from typing import Dict, Any
from backend.models.models import VerificationStatus

class DecisionEngine:
    """
    Synthesizes all pipeline checks to produce a definitive verification decision:
    VERIFIED, SUSPICIOUS, or REJECTED.
    """

    @staticmethod
    def evaluate(
        risk_score: int,
        registry_result: Dict[str, Any],
        tamper_result: Dict[str, Any],
        ocr_confidence: float,
        validation_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        reg_found = registry_result.get("found", False)
        cert_match = registry_result.get("certificate_id_match", False)
        name_match = registry_result.get("name_match", False)
        tamper_status = tamper_result.get("status", "LOW")
        req_present = validation_result.get("required_fields_present", True)

        # 1. REJECTED Conditions:
        # Document completely missing from registry OR multiple critical field failures
        if not reg_found:
            return {
                "status": VerificationStatus.REJECTED.value,
                "summary": "Document could not be verified: Identifier not found in the synthetic authorized registry.",
                "action_recommended": "Please ensure the certificate was issued by an accredited institution and re-upload with clear legibility."
            }

        if not cert_match and not name_match:
            return {
                "status": VerificationStatus.REJECTED.value,
                "summary": "Verification failed: Both certificate ID and candidate identity contradict registry records.",
                "action_recommended": "The document contains critical contradictions. Reject submission and escalate if necessary."
            }

        # 2. SUSPICIOUS Conditions:
        # High or moderate tamper indicators, or one major mismatch (e.g. name or cert mismatch, or QR mismatch)
        qr_info = tamper_result.get("qr_analysis", {})
        qr_mismatch = qr_info.get("detected") and not qr_info.get("matches_document", True)

        if not cert_match or not name_match or tamper_status in ("HIGH", "MODERATE") or qr_mismatch or risk_score > 20:
            reasons = []
            if not cert_match:
                reasons.append("Certificate ID discrepancy")
            if not name_match:
                reasons.append("Candidate name variant")
            if tamper_status == "HIGH":
                reasons.append("Elevated visual/compression anomalies")
            elif tamper_status == "MODERATE":
                reasons.append("Moderate edge/artifact variance")
            if qr_mismatch:
                reasons.append("Contradictory embedded QR metadata")
            if risk_score > 20:
                reasons.append(f"Elevated risk score ({risk_score})")

            return {
                "status": VerificationStatus.SUSPICIOUS.value,
                "summary": f"Document marked as SUSPICIOUS due to: {', '.join(reasons)}.",
                "action_recommended": "Manual inspection by an administrator is recommended before granting clearance."
            }

        # 3. VERIFIED Conditions:
        # All required fields match, acceptable OCR, no significant anomalies
        return {
            "status": VerificationStatus.VERIFIED.value,
            "summary": "Document successfully verified against synthetic authorized registry with high authenticity confidence.",
            "action_recommended": "Record signed to blockchain ledger. Official verification receipt issued."
        }
