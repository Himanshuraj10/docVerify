from typing import Dict, Any, List, Tuple

class RiskEngine:
    """
    Centralized, explainable risk engine.
    Calculates final composite risk score (0-100) and risk level from actual analysis signals.
    """

    # Configurable penalty weights
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
        ml_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        risk_score = 0
        factors: List[str] = []
        breakdown: Dict[str, int] = {}

        # 1. Registry Record Check
        if not registry_result.get("found", False):
            penalty = cls.WEIGHTS["registry_not_found"]
            risk_score += penalty
            factors.append(f"Document record not found in synthetic registry (+{penalty})")
            breakdown["registry_not_found"] = penalty
        else:
            if not registry_result.get("certificate_id_match", False):
                p = cls.WEIGHTS["certificate_id_mismatch"]
                risk_score += p
                factors.append(f"Certificate identifier does not match registry (+{p})")
                breakdown["certificate_id_mismatch"] = p

            if not registry_result.get("name_match", False):
                p = cls.WEIGHTS["name_mismatch"]
                risk_score += p
                factors.append(f"Candidate name differs from registered record (+{p})")
                breakdown["name_mismatch"] = p

            if not registry_result.get("dob_match", False):
                p = cls.WEIGHTS["dob_mismatch"]
                risk_score += p
                factors.append(f"Date of birth mismatch against registry (+{p})")
                breakdown["dob_mismatch"] = p

            if not registry_result.get("institution_match", False):
                p = cls.WEIGHTS["institution_mismatch"]
                risk_score += p
                factors.append(f"Issuing institution differs from record (+{p})")
                breakdown["institution_mismatch"] = p

        # 2. QR Consistency
        qr_info = tamper_result.get("qr_analysis", {})
        if qr_info.get("detected") and not qr_info.get("matches_document", True):
            p = cls.WEIGHTS["qr_mismatch"]
            risk_score += p
            factors.append(f"Embedded QR code contradicts extracted document ID (+{p})")
            breakdown["qr_mismatch"] = p

        # 3. Visual / Tamper indicators
        tamper_status = tamper_result.get("status", "LOW")
        if tamper_status == "HIGH":
            p = cls.WEIGHTS["high_tamper"]
            risk_score += p
            factors.append(f"Multiple visual / forensic tamper anomalies detected (+{p})")
            breakdown["high_tamper"] = p
        elif tamper_status == "MODERATE":
            p = cls.WEIGHTS["moderate_tamper"]
            risk_score += p
            factors.append(f"Moderate compression / edge variance observed (+{p})")
            breakdown["moderate_tamper"] = p

        # 4. OCR Confidence
        if ocr_confidence < 70.0:
            p = cls.WEIGHTS["low_ocr_confidence"]
            risk_score += p
            factors.append(f"Low OCR text clarity / confidence ({ocr_confidence}%) (+{p})")
            breakdown["low_ocr_confidence"] = p

        # 5. Validation Check
        if not validation_result.get("required_fields_present", True):
            p = cls.WEIGHTS["missing_mandatory_fields"]
            risk_score += p
            factors.append(f"Mandatory certificate fields missing (+{p})")
            breakdown["missing_mandatory_fields"] = p

        # 6. ML Anomaly Modulation
        ml_score = ml_result.get("ml_anomaly_score", 0.0)
        if ml_score > 0.75 and risk_score < 40:
            ml_penalty = 8
            risk_score += ml_penalty
            factors.append(f"ML Isolation Forest flagged multidimensional anomaly (+{ml_penalty})")
            breakdown["ml_anomaly_modulation"] = ml_penalty

        # Clamp between 0 and 100
        final_risk = int(max(0, min(risk_score, 100)))

        # Determine Risk Level: 0–20 LOW, 21–50 MEDIUM, 51–100 HIGH
        if final_risk <= 20:
            level = "LOW"
            summary_reason = "All critical fields matched with minimal visual/structural risk."
        elif final_risk <= 50:
            level = "MEDIUM"
            summary_reason = "Discrepancies noted in secondary fields or visual indicators requiring attention."
        else:
            level = "HIGH"
            summary_reason = "Critical contradictions detected between document contents and registry records."

        if factors:
            reason = f"{summary_reason} Factors: " + "; ".join(factors[:3])
        else:
            reason = summary_reason

        return {
            "risk_score": final_risk,
            "level": level,
            "reason": reason,
            "breakdown": breakdown,
            "factors": factors
        }
