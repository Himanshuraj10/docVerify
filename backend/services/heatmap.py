import os
import cv2
import numpy as np
from PIL import Image
from typing import Dict, Any, List, Optional
from pathlib import Path
from backend.config import settings

class ForensicHeatmapService:
    """
    Generates explainable, signal-driven forensic heatmaps and region overlays.
    Uses actual validation signals, registry comparisons, and tamper indicators.
    """

    @staticmethod
    def generate_heatmap(
        cv_img: np.ndarray,
        extracted_fields: Dict[str, Any],
        field_positions: Dict[str, Any],
        registry_result: Dict[str, Any],
        tamper_result: Dict[str, Any],
        ocr_boxes: List[Dict[str, Any]],
        verification_id: str
    ) -> Dict[str, Any]:
        h, w, _ = cv_img.shape
        regions: List[Dict[str, Any]] = []

        # Create overlay mask initialized to clean/zero
        overlay_mask = np.zeros((h, w), dtype=np.float32)

        # Standard document anchor regions if exact box not detected
        default_layout = {
            "certificate_id": {"x": int(w * 0.55), "y": int(h * 0.15), "w": int(w * 0.35), "h": int(h * 0.08)},
            "name": {"x": int(w * 0.20), "y": int(h * 0.38), "w": int(w * 0.60), "h": int(h * 0.09)},
            "dob": {"x": int(w * 0.20), "y": int(h * 0.48), "w": int(w * 0.30), "h": int(h * 0.07)},
            "institution": {"x": int(w * 0.15), "y": int(h * 0.22), "w": int(w * 0.70), "h": int(h * 0.10)},
            "course": {"x": int(w * 0.15), "y": int(h * 0.56), "w": int(w * 0.70), "h": int(h * 0.09)},
            "signature": {"x": int(w * 0.65), "y": int(h * 0.78), "w": int(w * 0.28), "h": int(h * 0.12)},
            "seal_or_qr": {"x": int(w * 0.10), "y": int(h * 0.76), "w": int(w * 0.20), "h": int(h * 0.15)}
        }

        # 1. Certificate ID Region
        cert_matched = registry_result.get("certificate_id_match", False)
        reg_found = registry_result.get("found", False)
        pos = field_positions.get("certificate_id") or default_layout["certificate_id"]
        
        if not reg_found:
            cert_score = 0.88
            cert_status = "HIGH"
        elif not cert_matched:
            cert_score = 0.92
            cert_status = "HIGH"
        else:
            cert_score = 0.05
            cert_status = "LOW"

        regions.append({
            "label": "Certificate ID",
            "x": int(pos["x"]),
            "y": int(pos["y"]),
            "width": int(pos.get("w", pos.get("width", 150))),
            "height": int(pos.get("h", pos.get("height", 40))),
            "score": cert_score,
            "status": cert_status
        })

        # 2. Candidate Name Region
        name_matched = registry_result.get("name_match", False)
        pos_name = field_positions.get("name") or default_layout["name"]
        if not reg_found:
            name_score = 0.75
            name_status = "MODERATE"
        elif not name_matched:
            name_score = 0.85
            name_status = "HIGH"
        else:
            name_score = 0.04
            name_status = "LOW"

        regions.append({
            "label": "Candidate Name",
            "x": int(pos_name["x"]),
            "y": int(pos_name["y"]),
            "width": int(pos_name.get("w", pos_name.get("width", 250))),
            "height": int(pos_name.get("h", pos_name.get("height", 45))),
            "score": name_score,
            "status": name_status
        })

        # 3. Date of Birth Region
        dob_matched = registry_result.get("dob_match", False)
        pos_dob = field_positions.get("dob") or default_layout["dob"]
        if not reg_found:
            dob_score = 0.50
            dob_status = "ATTENTION"
        elif not dob_matched:
            dob_score = 0.78
            dob_status = "MODERATE"
        else:
            dob_score = 0.03
            dob_status = "LOW"

        regions.append({
            "label": "Date of Birth",
            "x": int(pos_dob["x"]),
            "y": int(pos_dob["y"]),
            "width": int(pos_dob.get("w", pos_dob.get("width", 140))),
            "height": int(pos_dob.get("h", pos_dob.get("height", 35))),
            "score": dob_score,
            "status": dob_status
        })

        # 4. Institution Region
        inst_matched = registry_result.get("institution_match", False)
        pos_inst = field_positions.get("institution") or default_layout["institution"]
        if not reg_found:
            inst_score = 0.60
            inst_status = "ATTENTION"
        elif not inst_matched:
            inst_score = 0.70
            inst_status = "MODERATE"
        else:
            inst_score = 0.05
            inst_status = "LOW"

        regions.append({
            "label": "Institution Authority",
            "x": int(pos_inst["x"]),
            "y": int(pos_inst["y"]),
            "width": int(pos_inst.get("w", pos_inst.get("width", 280))),
            "height": int(pos_inst.get("h", pos_inst.get("height", 50))),
            "score": inst_score,
            "status": inst_status
        })

        # 5. Signature & Stamp Forensic Region
        tamper_score = tamper_result.get("tamper_score", 0.05)
        pos_sig = default_layout["signature"]
        if tamper_score >= 0.40:
            sig_score = 0.68
            sig_status = "MODERATE"
        elif tamper_score >= 0.20:
            sig_score = 0.35
            sig_status = "ATTENTION"
        else:
            sig_score = 0.08
            sig_status = "LOW"

        regions.append({
            "label": "Signature & Authorization",
            "x": int(pos_sig["x"]),
            "y": int(pos_sig["y"]),
            "width": int(pos_sig["w"]),
            "height": int(pos_sig["h"]),
            "score": sig_score,
            "status": sig_status
        })

        # Render Colorized Overlay
        # Color mapping: Green (low concern), Yellow (attention), Orange (moderate), Red (high)
        # Note: BGR in OpenCV
        color_map = {
            "LOW": (40, 180, 40),       # Green
            "ATTENTION": (0, 215, 255),  # Yellow
            "MODERATE": (0, 140, 255),   # Orange
            "HIGH": (30, 30, 230)        # Red
        }

        heatmap_canvas = cv_img.copy()
        overlay = cv_img.copy()

        for r in regions:
            rx, ry, rw, rh = r["x"], r["y"], r["width"], r["height"]
            # Clamp boundaries
            rx = max(0, min(rx, w - 10))
            ry = max(0, min(ry, h - 10))
            rw = max(10, min(rw, w - rx))
            rh = max(10, min(rh, h - ry))

            color = color_map.get(r["status"], (40, 180, 40))
            # Draw translucent filled box and contour border
            cv2.rectangle(overlay, (rx, ry), (rx + rw, ry + rh), color, -1)
            cv2.rectangle(heatmap_canvas, (rx, ry), (rx + rw, ry + rh), color, 2)

        # Blend overlay (40% color mask, 60% original image)
        cv2.addWeighted(overlay, 0.35, heatmap_canvas, 0.65, 0, heatmap_canvas)

        # Save heatmap image to uploads directory
        heatmap_dir = settings.UPLOAD_DIR / "heatmaps"
        heatmap_dir.mkdir(parents=True, exist_ok=True)
        heatmap_filename = f"{verification_id}_heatmap.jpg"
        heatmap_path = heatmap_dir / heatmap_filename
        cv2.imwrite(str(heatmap_path), heatmap_canvas)

        # Compute overall heatmap anomaly score
        overall_score = round(float(np.mean([r["score"] for r in regions])), 2)
        if overall_score >= 0.50:
            level = "HIGH"
        elif overall_score >= 0.25:
            level = "MODERATE"
        elif overall_score >= 0.12:
            level = "ATTENTION"
        else:
            level = "LOW"

        return {
            "overall_score": overall_score,
            "level": level,
            "regions": regions,
            "heatmap_image_url": f"/uploads/heatmaps/{heatmap_filename}",
            "original_image_url": f"/uploads/{verification_id}_doc.png"
        }
