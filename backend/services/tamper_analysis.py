import os
import io
import cv2
import numpy as np
from PIL import Image, ImageChops, ImageEnhance
from typing import Dict, Any, List, Tuple

class TamperAnalysisService:
    """
    Performs visual forensics, Error Level Analysis (ELA), localized digital paint/scribble/patch
    detection, edge discontinuity analysis, and QR code consistency checks.
    """

    @staticmethod
    def perform_ela(pil_img: Image.Image, quality: int = 90) -> Tuple[np.ndarray, float]:
        """
        Error Level Analysis (ELA) detects differences in JPEG compression levels.
        """
        rgb_img = pil_img.convert("RGB")
        buffer = io.BytesIO()
        rgb_img.save(buffer, "JPEG", quality=quality)
        buffer.seek(0)
        resaved = Image.open(buffer)

        diff = ImageChops.difference(rgb_img, resaved)
        extrema = diff.getextrema()
        max_diff = max([ex[1] for ex in extrema]) if isinstance(extrema[0], tuple) else max(extrema)
        scale = 255.0 / max_diff if max_diff > 0 else 1.0
        diff_enhanced = ImageEnhance.Brightness(diff).enhance(scale)

        ela_arr = np.array(diff_enhanced.convert("L"))
        ela_score = float(np.mean(ela_arr) / 255.0)
        return ela_arr, ela_score

    @staticmethod
    def detect_digital_markings_and_patches(cv_img: np.ndarray) -> List[Dict[str, Any]]:
        """
        Detects localized digital brush strokes, highlighter scribbles, or spliced color patches
        (e.g., bright yellow/red/neon MS Paint edits or pasted boxes) while ignoring normal
        portrait skin/clothing tones and card header ribbons.
        """
        h, w, _ = cv_img.shape
        hsv = cv2.cvtColor(cv_img, cv2.COLOR_BGR2HSV)

        # Detect vivid digital highlighter / brush markings (high saturation & high brightness yellow/gold or bright red)
        mask_yellow_highlighter = cv2.inRange(hsv, (18, 125, 175), (38, 255, 255))
        mask_bright_red1 = cv2.inRange(hsv, (0, 160, 160), (6, 255, 255))
        mask_bright_red2 = cv2.inRange(hsv, (172, 160, 160), (180, 255, 255))
        combined_mask = cv2.bitwise_or(
            mask_yellow_highlighter,
            cv2.bitwise_or(mask_bright_red1, mask_bright_red2)
        )

        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
        closed = cv2.morphologyEx(combined_mask, cv2.MORPH_CLOSE, kernel)
        contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        tamper_regions: List[Dict[str, Any]] = []
        for c in contours:
            bx, by, bw, bh = cv2.boundingRect(c)
            area = bw * bh
            # Ignore full-width header ribbons (bw > w * 0.55), tiny icons/specks (area < 2200), or thin lines (bh < 24)
            if 2200 <= area <= (w * h * 0.35) and 24 <= bh <= h * 0.65 and 28 <= bw <= w * 0.55:
                # Ignore top header emblem / tricolor ribbon area (y < h * 0.18)
                if by < h * 0.18 and bh < h * 0.15:
                    continue
                tamper_regions.append({
                    "x": int(bx),
                    "y": int(by),
                    "w": int(bw),
                    "h": int(bh),
                    "type": "Digital Overlay / Edited Patch",
                    "score": 0.89
                })

        return tamper_regions

    @staticmethod
    def check_qr_consistency(cv_img: np.ndarray, expected_cert_id: str = "") -> Dict[str, Any]:
        """Detects and decodes QR code if present, cross-checking with document ID."""
        detector = cv2.QRCodeDetector()
        try:
            data, bbox, _ = detector.detectAndDecode(cv_img)
            if data:
                match = (expected_cert_id.lower() in data.lower()) if expected_cert_id else True
                return {
                    "detected": True,
                    "data": data,
                    "matches_document": match,
                    "bbox": bbox.tolist() if bbox is not None else None
                }
        except Exception:
            pass
        return {"detected": False, "data": None, "matches_document": True, "bbox": None}

    @staticmethod
    def analyze_tampering(pil_img: Image.Image, cv_img: np.ndarray, cert_id: str = "") -> Dict[str, Any]:
        indicators: List[str] = []
        scores: List[float] = []

        # 1. Error Level Analysis (ELA)
        ela_map, ela_score = TamperAnalysisService.perform_ela(pil_img)
        scores.append(ela_score)
        if ela_score > 0.35:
            indicators.append(f"High JPEG Error Level Analysis (ELA) compression variance ({round(ela_score, 2)}) detected across document layers.")
        elif ela_score > 0.22:
            indicators.append(f"Moderate compression level discrepancy ({round(ela_score, 2)}) noted in background matrix.")

        # 2. Localized Digital Scribbles / Highlighter / Spliced Patch Detection
        tamper_regions = TamperAnalysisService.detect_digital_markings_and_patches(cv_img)
        if tamper_regions:
            patch_score = min(0.88, 0.35 + 0.15 * len(tamper_regions))
            scores.append(patch_score)
            coords_str = ", ".join([f"[{r['x']},{r['y']} {r['w']}x{r['h']}]" for r in tamper_regions[:4]])
            indicators.append(
                f"Detected {len(tamper_regions)} localized digital edit / brush / patch anomaly region(s) at coordinates {coords_str}."
            )

        # 3. Edge discontinuity / Copy-Paste Artifact Analysis
        gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        if laplacian_var > 650:
            scores.append(0.35)
            indicators.append("Edge sharpness mismatch observed between text layer and card background texture.")
        else:
            scores.append(0.05)

        # 4. QR Code Consistency
        qr_info = TamperAnalysisService.check_qr_consistency(cv_img, cert_id)
        if qr_info["detected"]:
            if not qr_info["matches_document"]:
                scores.append(0.45)
                indicators.append("Embedded QR code payload contradicts extracted card ID number.")
            else:
                scores.append(0.0)

        # Calculate composite tamper score (0.0 to 1.0)
        raw_tamper_score = float(np.mean(scores)) if scores else 0.05
        if tamper_regions:
            raw_tamper_score = max(raw_tamper_score, 0.48 if len(tamper_regions) >= 2 else 0.32)

        tamper_score = round(min(max(raw_tamper_score, 0.02), 0.96), 2)

        if tamper_score >= 0.45:
            status = "HIGH"
        elif tamper_score >= 0.20:
            status = "MODERATE"
        else:
            status = "LOW"

        if not indicators:
            indicators.append("No visual tampering, digital scribbles, or compression anomalies detected.")

        return {
            "tamper_score": tamper_score,
            "status": status,
            "indicators": indicators,
            "tamper_regions": tamper_regions,
            "qr_analysis": qr_info,
            "ela_variance": round(ela_score, 3)
        }
