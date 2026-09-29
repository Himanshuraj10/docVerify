import os
import io
import cv2
import numpy as np
from PIL import Image, ImageChops, ImageEnhance
from typing import Dict, Any, List, Tuple

class TamperAnalysisService:
    """
    Performs visual forensics, Error Level Analysis (ELA), edge discontinuity analysis,
    and QR code consistency checks.
    Uses cautious forensic terminology ('Potential anomaly detected').
    """

    @staticmethod
    def perform_ela(pil_img: Image.Image, quality: int = 90) -> Tuple[np.ndarray, float]:
        """
        Error Level Analysis (ELA) detects differences in JPEG compression levels.
        Edited or pasted regions degrade at different rates than original background.
        """
        buffer = io.BytesIO()
        pil_img.save(buffer, "JPEG", quality=quality)
        buffer.seek(0)
        resaved = Image.open(buffer)

        # Difference between original and recompressed image
        diff = ImageChops.difference(pil_img, resaved)
        extrema = diff.getextrema()
        max_diff = max([ex[1] for ex in extrema]) if isinstance(extrema[0], tuple) else max(extrema)
        scale = 255.0 / max_diff if max_diff > 0 else 1.0
        diff_enhanced = ImageEnhance.Brightness(diff).enhance(scale)
        
        ela_arr = np.array(diff_enhanced.convert("L"))
        # Average intensity of high variance areas
        ela_score = float(np.mean(ela_arr) / 255.0)
        return ela_arr, ela_score

    @staticmethod
    def check_qr_consistency(cv_img: np.ndarray, expected_cert_id: str = "") -> Dict[str, Any]:
        """Detects and decodes QR code if present, cross-checking with document ID."""
        detector = cv2.QRCodeDetector()
        data, bbox, _ = detector.detectAndDecode(cv_img)
        if data:
            match = (expected_cert_id.lower() in data.lower()) if expected_cert_id else True
            return {
                "detected": True,
                "data": data,
                "matches_document": match,
                "bbox": bbox.tolist() if bbox is not None else None
            }
        return {"detected": False, "data": None, "matches_document": True, "bbox": None}

    @staticmethod
    def analyze_tampering(pil_img: Image.Image, cv_img: np.ndarray, cert_id: str = "") -> Dict[str, Any]:
        indicators: List[str] = []
        scores: List[float] = []

        # 1. Error Level Analysis
        ela_map, ela_score = TamperAnalysisService.perform_ela(pil_img)
        scores.append(ela_score)
        if ela_score > 0.35:
            indicators.append("Potential compression artifact variance detected across document layers.")
        elif ela_score > 0.22:
            indicators.append("Minor compression level discrepancy noted in background matrix.")

        # 2. Edge discontinuity / Copy-Paste Artifact Analysis
        gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        # High local contrast variance can indicate spliced high-res text on scanned background
        if laplacian_var > 650:
            scores.append(0.35)
            indicators.append("Potential edge sharpness mismatch observed between text and paper texture.")
        else:
            scores.append(0.05)

        # 3. QR Code Consistency
        qr_info = TamperAnalysisService.check_qr_consistency(cv_img, cert_id)
        if qr_info["detected"]:
            if not qr_info["matches_document"]:
                scores.append(0.40)
                indicators.append("Potential anomaly detected: Embedded QR payload does not correspond with extracted Certificate ID.")
            else:
                scores.append(0.0)

        # 4. Color uniformity / patch detection
        hsv = cv2.cvtColor(cv_img, cv2.COLOR_BGR2HSV)
        sat = hsv[:, :, 1]
        sat_std = float(np.std(sat))
        if sat_std > 45:
            scores.append(0.20)
            indicators.append("Localized color saturation variations observed in document body.")

        # Calculate composite tamper score (0.0 to 1.0)
        raw_tamper_score = float(np.mean(scores)) if scores else 0.05
        tamper_score = round(min(max(raw_tamper_score, 0.02), 0.95), 2)

        if tamper_score >= 0.45:
            status = "HIGH"
        elif tamper_score >= 0.20:
            status = "MODERATE"
        else:
            status = "LOW"

        if not indicators:
            indicators.append("No significant visual anomalies or structural inconsistencies observed.")

        return {
            "tamper_score": tamper_score,
            "status": status,
            "indicators": indicators,
            "qr_analysis": qr_info,
            "ela_variance": round(ela_score, 3)
        }
