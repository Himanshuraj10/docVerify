import os
import cv2
import numpy as np
from typing import Dict, Any, List
from backend.config import settings

class ForensicHeatmapService:
    """
    Generates explainable, pixel-accurate forensic heatmaps and region anchors.
    Maps actual OCR bounding boxes, extracted field values, registry match status,
    and localized digital tamper/scribble regions onto the card image.
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

        reg_found = registry_result.get("found", False)
        cert_matched = registry_result.get("certificate_id_match", False)
        name_matched = registry_result.get("name_match", False)
        dob_matched = registry_result.get("dob_match", False)
        inst_matched = registry_result.get("institution_match", False)

        # Fallback coordinates only when a field was not found in OCR boxes
        default_layout = {
            "certificate_id": {"x": int(w * 0.30), "y": int(h * 0.76), "w": int(w * 0.42), "h": int(h * 0.11)},
            "name": {"x": int(w * 0.05), "y": int(h * 0.56), "w": int(w * 0.50), "h": int(h * 0.09)},
            "dob": {"x": int(w * 0.05), "y": int(h * 0.82), "w": int(w * 0.25), "h": int(h * 0.09)},
            "institution": {"x": int(w * 0.05), "y": int(h * 0.12), "w": int(w * 0.85), "h": int(h * 0.12)},
        }

        # 1. Aadhaar / PAN Number Anchor
        id_val = extracted_fields.get("certificate_id")
        pos_id = field_positions.get("certificate_id") or default_layout["certificate_id"]
        if not id_val:
            id_score, id_status = 0.95, "HIGH"
            id_text = "[MISSING — No Valid PAN / Aadhaar Number Found]"
            id_finding = "Critical: Mandatory 10-char PAN or 12-digit Aadhaar number is missing on this card."
        elif not reg_found or not cert_matched:
            id_score, id_status = 0.88, "HIGH"
            id_text = str(id_val)
            id_finding = f"Unregistered ID: '{id_val}' was not found in the UIDAI / Income Tax registry."
        else:
            id_score, id_status = 0.04, "LOW"
            id_text = str(id_val)
            id_finding = f"Verified: '{id_val}' matches active record in Authorized Document Registry."

        regions.append({
            "label": "Aadhaar / PAN Number",
            "extracted_text": id_text,
            "finding": id_finding,
            "x": int(pos_id["x"]),
            "y": int(pos_id["y"]),
            "width": int(pos_id.get("w", pos_id.get("width", 180))),
            "height": int(pos_id.get("h", pos_id.get("height", 42))),
            "score": id_score,
            "status": id_status
        })

        # 2. Cardholder Name Anchor
        name_val = extracted_fields.get("name")
        pos_name = field_positions.get("name") or default_layout["name"]
        if not name_val:
            name_score, name_status = 0.85, "HIGH"
            name_text = "[MISSING — Name Not Detected]"
            name_finding = "Cardholder name could not be extracted from the document."
        elif "placeholder" in str(name_val).lower() or "first name" in str(name_val).lower():
            name_score, name_status = 0.92, "HIGH"
            name_text = str(name_val)
            name_finding = "Invalid Template Text: Card contains sample placeholder 'FIRST NAME MIDDLE NAME SURNAME'."
        elif not reg_found:
            name_score, name_status = 0.72, "MODERATE"
            name_text = str(name_val)
            name_finding = f"Extracted '{name_val}', but no matching registry record exists to verify identity."
        elif not name_matched:
            name_score, name_status = 0.90, "HIGH"
            name_text = str(name_val)
            name_finding = f"Name Mismatch / Forgery: Card shows '{name_val}', which contradicts registered holder."
        else:
            name_score, name_status = 0.04, "LOW"
            name_text = str(name_val)
            name_finding = f"Verified: Holder name '{name_val}' matches official registry record."

        regions.append({
            "label": "Cardholder Full Name",
            "extracted_text": name_text,
            "finding": name_finding,
            "x": int(pos_name["x"]),
            "y": int(pos_name["y"]),
            "width": int(pos_name.get("w", pos_name.get("width", 260))),
            "height": int(pos_name.get("h", pos_name.get("height", 40))),
            "score": name_score,
            "status": name_status
        })

        # 3. Date of Birth (DOB) Anchor
        dob_val = extracted_fields.get("dob")
        pos_dob = field_positions.get("dob") or default_layout["dob"]
        if not dob_val:
            dob_score, dob_status = 0.65, "MODERATE"
            dob_text = "[MISSING — DOB Not Found]"
            dob_finding = "Date of Birth field was not found or is illegible."
        elif "placeholder" in str(dob_val).lower() or "dd/mm" in str(dob_val).lower():
            dob_score, dob_status = 0.88, "HIGH"
            dob_text = str(dob_val)
            dob_finding = "Invalid Template Text: DOB contains literal 'DD/MM/YYYY' placeholder instead of a real date."
        elif not reg_found:
            dob_score, dob_status = 0.50, "ATTENTION"
            dob_text = str(dob_val)
            dob_finding = f"Extracted DOB '{dob_val}', unverified against registry."
        elif not dob_matched:
            dob_score, dob_status = 0.80, "HIGH"
            dob_text = str(dob_val)
            dob_finding = f"DOB Mismatch: '{dob_val}' does not match registry DOB."
        else:
            dob_score, dob_status = 0.03, "LOW"
            dob_text = str(dob_val)
            dob_finding = f"Verified: DOB '{dob_val}' matches registry record."

        regions.append({
            "label": "Date of Birth (DOB)",
            "extracted_text": dob_text,
            "finding": dob_finding,
            "x": int(pos_dob["x"]),
            "y": int(pos_dob["y"]),
            "width": int(pos_dob.get("w", pos_dob.get("width", 150))),
            "height": int(pos_dob.get("h", pos_dob.get("height", 35))),
            "score": dob_score,
            "status": dob_status
        })

        # 4. Issuing Authority Header Anchor
        inst_val = extracted_fields.get("institution")
        pos_inst = field_positions.get("institution") or default_layout["institution"]
        if not inst_val:
            inst_score, inst_status = 0.60, "ATTENTION"
            inst_text = "[Authority Header Not Detected]"
            inst_finding = "Could not confirm UIDAI or Income Tax Department header."
        elif not reg_found:
            inst_score, inst_status = 0.25, "ATTENTION"
            inst_text = str(inst_val)
            inst_finding = f"Header reads '{inst_val}', but card ID is not registered."
        elif not inst_matched:
            inst_score, inst_status = 0.70, "MODERATE"
            inst_text = str(inst_val)
            inst_finding = f"Authority '{inst_val}' differs from expected registry authority."
        else:
            inst_score, inst_status = 0.05, "LOW"
            inst_text = str(inst_val)
            inst_finding = f"Verified Authority: '{inst_val}'."

        regions.append({
            "label": "Issuing Authority Header",
            "extracted_text": inst_text,
            "finding": inst_finding,
            "x": int(pos_inst["x"]),
            "y": int(pos_inst["y"]),
            "width": int(pos_inst.get("w", pos_inst.get("width", 280))),
            "height": int(pos_inst.get("h", pos_inst.get("height", 42))),
            "score": inst_score,
            "status": inst_status
        })

        # 5. Add Exact Detected Digital Tamper / Scribble / Paint Regions!
        tamper_patches = tamper_result.get("tamper_regions", [])
        for idx, patch in enumerate(tamper_patches[:5]):
            regions.append({
                "label": f"Tamper / Edit Anomaly #{idx + 1}",
                "extracted_text": "[Digital Paint / Scribble / Spliced Overlay]",
                "finding": f"Visual Tampering Detected: Localized digital marking or edited patch at [{patch['x']}, {patch['y']}, {patch['w']}x{patch['h']}].",
                "x": int(patch["x"]),
                "y": int(patch["y"]),
                "width": int(patch["w"]),
                "height": int(patch["h"]),
                "score": float(patch.get("score", 0.89)),
                "status": "HIGH"
            })

        # 6. Also add any additional real OCR text boxes not already covered so user sees all OCR regions
        covered_coords = [(r["x"], r["y"]) for r in regions]
        extra_added = 0
        for box in ocr_boxes:
            bx, by, bw, bh = int(box["x"]), int(box["y"]), int(box["w"]), int(box["h"])
            b_txt = str(box.get("text", "")).strip()
            if not b_txt or b_txt.startswith("["):
                continue
            # Check if close to an already-added anchor
            if any(abs(bx - cx) < 25 and abs(by - cy) < 25 for cx, cy in covered_coords):
                continue
            if extra_added < 4:
                is_placeholder = any(k in b_txt.upper() for k in ["FIRSTNAME", "FRSTNAME", "SURNAME", "DOMMYYYY", "DD/MM"])
                regions.append({
                    "label": f"OCR Text Block ({round(float(box.get('conf', 85)), 0)}% conf)",
                    "extracted_text": b_txt,
                    "finding": "Template placeholder text detected." if is_placeholder else f"OCR extracted text '{b_txt}' at [{bx}, {by}].",
                    "x": bx,
                    "y": by,
                    "width": bw,
                    "height": bh,
                    "score": 0.78 if is_placeholder else 0.08,
                    "status": "HIGH" if is_placeholder else "LOW"
                })
                covered_coords.append((bx, by))
                extra_added += 1

        # Render Colorized Overlay on the Card Image
        color_map = {
            "LOW": (40, 185, 40),        # Green (BGR)
            "ATTENTION": (0, 210, 255),  # Yellow (BGR)
            "MODERATE": (0, 135, 255),   # Orange (BGR)
            "HIGH": (30, 30, 235)        # Red (BGR)
        }

        heatmap_canvas = cv_img.copy()
        overlay = cv_img.copy()

        for r in regions:
            rx, ry, rw, rh = r["x"], r["y"], r["width"], r["height"]
            rx = max(2, min(rx, w - 12))
            ry = max(2, min(ry, h - 12))
            rw = max(12, min(rw, w - rx - 2))
            rh = max(12, min(rh, h - ry - 2))

            color = color_map.get(r["status"], (40, 185, 40))
            cv2.rectangle(overlay, (rx, ry), (rx + rw, ry + rh), color, -1)
            cv2.rectangle(heatmap_canvas, (rx, ry), (rx + rw, ry + rh), color, 2)

            # Draw compact label tag above the box
            tag_text = f"{r['label'][:22]} ({r['status']})"
            tag_y = max(16, ry - 5)
            cv2.putText(
                heatmap_canvas,
                tag_text,
                (rx, tag_y),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.42,
                color,
                1,
                cv2.LINE_AA
            )

        cv2.addWeighted(overlay, 0.34, heatmap_canvas, 0.66, 0, heatmap_canvas)

        heatmap_dir = settings.UPLOAD_DIR / "heatmaps"
        heatmap_dir.mkdir(parents=True, exist_ok=True)
        heatmap_filename = f"{verification_id}_heatmap.jpg"
        heatmap_path = heatmap_dir / heatmap_filename
        cv2.imwrite(str(heatmap_path), heatmap_canvas)

        overall_score = round(float(np.mean([r["score"] for r in regions])), 2) if regions else 0.05
        if any(r["status"] == "HIGH" for r in regions) or overall_score >= 0.45:
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
