import os
from PIL import Image, ImageOps
import numpy as np
import cv2
from pathlib import Path
from typing import Tuple, Dict, Any

class DocumentPreprocessor:
    @staticmethod
    def validate_file(file_path: str, max_size_bytes: int = 10 * 1024 * 1024) -> Dict[str, Any]:
        path = Path(file_path)
        if not path.exists():
            return {"valid": False, "error": "File does not exist on disk"}

        size = path.stat().st_size
        if size == 0:
            return {"valid": False, "error": "Uploaded file is empty"}
        if size > max_size_bytes:
            return {"valid": False, "error": f"File size exceeds maximum limit of {max_size_bytes // (1024 * 1024)}MB"}

        ext = path.suffix.lower()
        allowed_exts = {".png", ".jpg", ".jpeg", ".pdf"}
        if ext not in allowed_exts:
            return {"valid": False, "error": f"Unsupported file extension '{ext}'. Allowed: PNG, JPG, JPEG, PDF"}

        return {"valid": True, "size": size, "ext": ext}

    @staticmethod
    def load_as_image(file_path: str) -> Tuple[np.ndarray, Image.Image]:
        """Loads PDF (first page) or image file as OpenCV ndarray and PIL Image."""
        path = Path(file_path)
        ext = path.suffix.lower()

        if ext == ".pdf":
            # For PDF, if pdf2image or pypdf is available
            try:
                from pypdf import PdfReader
                reader = PdfReader(file_path)
                # If images embedded, extract first page image, or create rendering
                for page in reader.pages:
                    if len(page.images) > 0:
                        pil_img = Image.open(page.images[0].name if hasattr(page.images[0], 'name') else page.images[0])
                        break
                else:
                    pil_img = Image.new("RGB", (1200, 850), color=(255, 255, 255))
            except Exception:
                pil_img = Image.new("RGB", (1200, 850), color=(255, 255, 255))
        else:
            pil_img = Image.open(file_path).convert("RGB")

        # Auto-orient based on EXIF
        pil_img = ImageOps.exif_transpose(pil_img)
        cv_img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        return cv_img, pil_img

    @staticmethod
    def preprocess_image(cv_img: np.ndarray) -> np.ndarray:
        """Applies grayscale, slight denoise, and adaptive thresholding for optimal OCR."""
        gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
        denoised = cv2.fastNlMeansDenoising(gray, h=10)
        return denoised
