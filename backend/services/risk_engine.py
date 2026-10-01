from typing import Dict, Any, List, Optional

class RiskEngine:
    """
    Centralized, explainable risk engine.
    Calculates final composite risk score (0-100), risk level, penalty breakdown,
    and a detailed, user-friendly list of exact problems found and how to resolve them.
    """

    WEIGHTS = {
        "registry_not_found": 35,
        "certificate_id_mismatch": 30,
        "name_mismatch": 20,
        "dob_mismatch": 15,
        "institution_mismatch": 10,
        "qr_mismatch": 15,
        "high_tamper": 15,
        "moderate_tamper": 8,
        "low_ocr_confidence": 5,
        "missing_mandatory_fields": 10
    }

    @classmethod
    def calculate_risk(
        cls,
        registry_result: Dict[str, Any],
        tamper_result: Dict[str, Any],
        ocr_confidence: float,
        validation_result: Dict[str, Any],
        ml_result: Dict[str, Any],
        extracted_fields: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        risk_score = 0
        factors: List[str] = []
        breakdown: Dict[str, int] = {}
        problems_found: List[Dict[str, str]] = []
        ext = extracted_fields or {}

        cert_id = ext.get("certificate_id")
        name_val = ext.get("name")
        dob_val = ext.get("dob")
        inst_val = ext.get("institution")

        # Check for template/placeholder text on uploaded sample cards
        has_placeholder_name = bool(name_val and ("placeholder" in str(name_val).lower() or "first name" in str(name_val).lower()))
        has_placeholder_dob = bool(dob_val and ("placeholder" in str(dob_val).lower() or "dd/mm" in str(dob_val).lower()))

        # 1. Missing or Placeholder Mandatory Fields
        if not cert_id:
            p = cls.WEIGHTS["missing_mandatory_fields"]
            risk_score += p
            breakdown["missing_pan_or_aadhaar_number"] = p
            factors.append(f"PAN / Aadhaar ID number is missing from the card (+{p})")
            problems_found.append({
                "issue": "Missing PAN / Aadhaar Number",
                "severity": "HIGH",
                "extracted": "None (Not found on image)",
                "expected": "10-char PAN (e.g. ABCDE1234F) or 12-digit Aadhaar (XXXX-XXXX-XXXX)",
                "solution": "Upload a complete card image where the 10-character PAN number or 12-digit Aadhaar number is clearly printed."
            })

        if not name_val or has_placeholder_name:
            p = 15 if has_placeholder_name else 10
            risk_score += p
            breakdown["invalid_or_placeholder_name"] = p
            factors.append(f"Cardholder Name is {'a dummy template placeholder' if has_placeholder_name else 'missing'} (+{p})")
            problems_found.append({
                "issue": "Invalid / Placeholder Cardholder Name" if has_placeholder_name else "Cardholder Name Could Not Be Read",
                "severity": "HIGH",
                "extracted": str(name_val or "Not detected"),
                "expected": "Real citizen full name registered with UIDAI / Income Tax Dept",
                "solution": "This image appears to be a blank sample template ('FIRST NAME MIDDLE NAME SURNAME'). Please upload a real issued card."
            })

        if has_placeholder_dob:
            p = 10
            risk_score += p
            breakdown["placeholder_dob_detected"] = p
            factors.append(f"Date of Birth contains template text 'DD/MM/YYYY' (+{p})")
            problems_found.append({
                "issue": "Placeholder Date of Birth ('DD/MM/YYYY')",
                "severity": "HIGH",
                "extracted": str(dob_val),
                "expected": "Valid Date of Birth in DD/MM/YYYY format (e.g. 18/08/1999)",
                "solution": "The uploaded card shows 'DD/MM/YYYY' instead of an actual birth date."
            })

        # 2. Registry Record Check
        if not registry_result.get("found", False):
            penalty = cls.WEIGHTS["registry_not_found"]
            risk_score += penalty
            factors.append(f"Card record not found in UIDAI / Income Tax registry (+{penalty})")
            breakdown["registry_not_found"] = penalty
            problems_found.append({
                "issue": "Not Found in Official UIDAI / Income Tax Registry",
                "severity": "HIGH",
                "extracted": f"ID: {cert_id or 'Missing'} | Name: {name_val or 'Missing'}",
                "expected": "Active matching record in Authorized Document Registry",
                "solution": "Verify that the PAN or Aadhaar number is valid and registered in the database."
            })
        else:
            reg_comps = {c["field_name"]: c for c in registry_result.get("field_comparisons", [])}
            if not registry_result.get("certificate_id_match", False):
                p = cls.WEIGHTS["certificate_id_mismatch"]
                risk_score += p
                factors.append(f"Aadhaar / PAN number does not match registry (+{p})")
                breakdown["id_number_mismatch"] = p
                problems_found.append({
                    "issue": "Aadhaar / PAN Number Mismatch",
                    "severity": "HIGH",
                    "extracted": str(cert_id or "Missing"),
                    "expected": reg_comps.get("Document Number (PAN / Aadhaar)", {}).get("registry_value", "Registered ID"),
                    "solution": "The ID number on the card does not match the registered citizen record."
                })

            if not registry_result.get("name_match", False):
                p = cls.WEIGHTS["name_mismatch"]
                risk_score += p
                factors.append(f"Cardholder name differs from registered record (+{p})")
                breakdown["cardholder_name_mismatch"] = p
                problems_found.append({
                    "issue": "Full Name Mismatch (Potential Identity Forgery)",
                    "severity": "HIGH",
                    "extracted": str(name_val or "Missing"),
                    "expected": reg_comps.get("Full Name", {}).get("registry_value", "Registered Name"),
                    "solution": "The name printed on the card contradicts the official name registered under this PAN/Aadhaar number."
                })

            if not registry_result.get("dob_match", False):
                p = cls.WEIGHTS["dob_mismatch"]
                risk_score += p
                factors.append(f"Date of birth mismatch against registry (+{p})")
                breakdown["dob_mismatch"] = p
                problems_found.append({
                    "issue": "Date of Birth Mismatch",
                    "severity": "MEDIUM",
                    "extracted": str(dob_val or "Missing"),
                    "expected": reg_comps.get("Date of Birth (DOB)", {}).get("registry_value", "Registered DOB"),
                    "solution": "The Date of Birth on the card does not match the official database record."
                })

            if not registry_result.get("institution_match", False):
                p = cls.WEIGHTS["institution_mismatch"]
                risk_score += p
                factors.append(f"Issuing authority differs from record (+{p})")
                breakdown["authority_mismatch"] = p

        # 3. Visual / Tamper & Digital Scribble Indicators
        tamper_status = tamper_result.get("status", "LOW")
        tamper_regions = tamper_result.get("tamper_regions", [])
        if tamper_status == "HIGH":
            p = cls.WEIGHTS["high_tamper"]
            risk_score += p
            factors.append(f"Visual tampering / digital edits detected on card (+{p})")
            breakdown["visual_tampering_detected"] = p
            coords_list = ", ".join([f"[{r['x']},{r['y']} ({r['w']}x{r['h']})]" for r in tamper_regions[:4]])
            problems_found.append({
                "issue": f"Visual Tampering / Digital Scribbles Detected ({len(tamper_regions)} Region(s))",
                "severity": "HIGH",
                "extracted": f"Digital paint/patch overlay at {coords_list}" if coords_list else "High ELA compression anomaly",
                "expected": "Clean, unedited original PAN / Aadhaar card image",
                "solution": "Remove any digital brush strokes, highlighter marks, or pasted text boxes and upload the original unaltered card."
            })
        elif tamper_status == "MODERATE":
            p = cls.WEIGHTS["moderate_tamper"]
            risk_score += p
            factors.append(f"Moderate compression / visual edit variance observed (+{p})")
            breakdown["moderate_visual_tamper"] = p
            problems_found.append({
                "issue": "Moderate Image Tampering / Spliced Region Detected",
                "severity": "MEDIUM",
                "extracted": "; ".join(tamper_result.get("indicators", [])[:2]),
                "expected": "Uniform image compression and original typography",
                "solution": "Check the red/orange highlighted regions in the Forensic Heatmap below."
            })

        # 4. OCR Clarity Confidence
        if ocr_confidence < 70.0:
            p = cls.WEIGHTS["low_ocr_confidence"]
            risk_score += p
            factors.append(f"Low OCR text clarity ({ocr_confidence}%) (+{p})")
            breakdown["low_ocr_clarity"] = p
            problems_found.append({
                "issue": f"Low Image Clarity / Blurry Text ({ocr_confidence}% Confidence)",
                "severity": "MEDIUM",
                "extracted": f"OCR Clarity Score: {ocr_confidence}%",
                "expected": "At least 75% optical clarity for reliable document text extraction",
                "solution": "Upload a sharper, higher-resolution scan or photo in good lighting."
            })

        # Clamp between 0 and 100
        final_risk = int(max(0, min(risk_score, 100)))

        if final_risk <= 20 and not problems_found:
            level = "LOW"
            summary_reason = "All PAN / Aadhaar document fields matched official registry records with zero visual tampering."
        elif final_risk <= 50:
            level = "MEDIUM"
            summary_reason = f"Found {len(problems_found)} verification issue(s) requiring attention."
        else:
            level = "HIGH"
            summary_reason = f"Document verification failed: {len(problems_found)} critical issue(s) detected on this document."

        if factors:
            reason = f"{summary_reason} Key factors: " + "; ".join(factors[:4])
        else:
            reason = summary_reason

        return {
            "risk_score": final_risk,
            "level": level,
            "reason": reason,
            "breakdown": breakdown,
            "factors": factors,
            "problems_found": problems_found
        }
