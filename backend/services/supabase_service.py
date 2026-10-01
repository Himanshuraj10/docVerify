import logging
import requests
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from backend.config import settings

logger = logging.getLogger(__name__)


class SupabaseService:
    """
    Connects the Document Verification Portal to Supabase REST / PostgREST API.
    Project ID: qplrpyjfxiddhezjutqa
    Supabase URL: https://qplrpyjfxiddhezjutqa.supabase.co
    """

    def __init__(self):
        self.project_id = settings.SUPABASE_PROJECT_ID
        self.base_url = settings.SUPABASE_URL.rstrip("/")
        self.api_key = settings.SUPABASE_KEY
        self.rest_url = f"{self.base_url}/rest/v1"

    def _headers(self, prefer: str = "return=representation") -> Dict[str, str]:
        return {
            "apikey": self.api_key,
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Prefer": prefer
        }

    def check_connection(self) -> Dict[str, Any]:
        """Verifies live connectivity to the Supabase project."""
        if not self.base_url or not self.api_key:
            return {"connected": False, "project_id": self.project_id, "reason": "Missing Supabase URL or API Key"}

        try:
            resp = requests.get(
                f"{self.base_url}/auth/v1/settings",
                headers={"apikey": self.api_key},
                timeout=4.0
            )
            auth_ok = resp.status_code == 200

            table_resp = requests.get(
                f"{self.rest_url}/verification_results?select=id&limit=1",
                headers=self._headers(),
                timeout=4.0
            )
            tables_ready = table_resp.status_code == 200

            return {
                "connected": auth_ok,
                "project_id": self.project_id,
                "supabase_url": self.base_url,
                "tables_initialized": tables_ready,
                "status": "Connected & Synced" if (auth_ok and tables_ready) else "Connected (Run supabase_schema.sql in Supabase SQL Editor to create tables)"
            }
        except Exception as e:
            logger.warning(f"Supabase connection check failed: {e}")
            return {
                "connected": False,
                "project_id": self.project_id,
                "supabase_url": self.base_url,
                "error": str(e)
            }

    def sync_verification_result(self, payload: Dict[str, Any]) -> bool:
        """Upserts a verification result record into Supabase `verification_results` table."""
        if not self.base_url or not self.api_key:
            return False

        row = {
            "id": payload.get("verification_id"),
            "document_type": payload.get("document_type"),
            "status": payload.get("status"),
            "risk_score": payload.get("risk_score"),
            "ocr_confidence": payload.get("ocr_confidence"),
            "certificate_id": payload.get("extracted_fields", {}).get("certificate_id"),
            "holder_name": payload.get("extracted_fields", {}).get("name"),
            "dob": payload.get("extracted_fields", {}).get("dob"),
            "result_data": payload,
            "created_at": payload.get("created_at")
        }

        try:
            resp = requests.post(
                f"{self.rest_url}/verification_results",
                headers=self._headers("resolution=merge-duplicates,return=minimal"),
                json=row,
                timeout=4.0
            )
            return resp.status_code in (200, 201, 204)
        except Exception as e:
            logger.debug(f"Supabase verification sync skipped: {e}")
            return False

    def sync_registry_record(self, record_dict: Dict[str, Any]) -> bool:
        """Upserts a registry record into Supabase `registry_records` table."""
        if not self.base_url or not self.api_key:
            return False
        try:
            resp = requests.post(
                f"{self.rest_url}/registry_records?on_conflict=certificate_id",
                headers=self._headers("resolution=merge-duplicates,return=minimal"),
                json=record_dict,
                timeout=4.0
            )
            return resp.status_code in (200, 201, 204)
        except Exception as e:
            logger.debug(f"Supabase registry sync skipped: {e}")
            return False

    def sync_all_local_data(self, db: Session) -> Dict[str, Any]:
        """Pushes all local RegistryRecord, VerificationResult, FAQ, and Complaint rows to Supabase."""
        from backend.models.models import RegistryRecord, VerificationResult, FAQ, Complaint

        reg_rows = db.query(RegistryRecord).all()
        ver_rows = db.query(VerificationResult).all()
        faq_rows = db.query(FAQ).all()
        comp_rows = db.query(Complaint).all()

        reg_payloads = [
            {
                "certificate_id": r.certificate_id,
                "name": r.name,
                "dob": r.dob,
                "institution": r.institution,
                "course": r.course,
                "issue_year": r.issue_year
            }
            for r in reg_rows
        ]

        ver_payloads = []
        for v in ver_rows:
            d = v.result_data or {}
            ef = d.get("extracted_fields", {})
            ver_payloads.append({
                "id": v.id,
                "document_type": d.get("document_type", "Identity Document"),
                "status": v.status.value if hasattr(v.status, "value") else str(v.status),
                "risk_score": v.risk_score,
                "ocr_confidence": v.ocr_confidence,
                "certificate_id": ef.get("certificate_id"),
                "holder_name": ef.get("name"),
                "dob": ef.get("dob"),
                "result_data": d,
                "created_at": v.created_at.isoformat() if v.created_at else None
            })

        reg_ok = False
        ver_ok = False
        err_msg = None

        try:
            r1 = requests.post(
                f"{self.rest_url}/registry_records?on_conflict=certificate_id",
                headers=self._headers("resolution=merge-duplicates,return=minimal"),
                json=reg_payloads,
                timeout=8.0
            )
            reg_ok = r1.status_code in (200, 201, 204)
            if not reg_ok:
                err_msg = r1.text

            r2 = requests.post(
                f"{self.rest_url}/verification_results?on_conflict=id",
                headers=self._headers("resolution=merge-duplicates,return=minimal"),
                json=ver_payloads,
                timeout=10.0
            )
            ver_ok = r2.status_code in (200, 201, 204)
            if not ver_ok and not err_msg:
                err_msg = r2.text
        except Exception as e:
            err_msg = str(e)

        return {
            "project_id": self.project_id,
            "supabase_url": self.base_url,
            "registry_count": len(reg_payloads),
            "verification_count": len(ver_payloads),
            "faq_count": len(faq_rows),
            "complaint_count": len(comp_rows),
            "registry_synced": reg_ok,
            "verifications_synced": ver_ok,
            "error": err_msg
        }

    def lookup_registry_in_supabase(self, certificate_id: str) -> Optional[Dict[str, Any]]:
        """Queries Supabase `registry_records` table for a PAN or Aadhaar number if available."""
        if not self.base_url or not self.api_key or not certificate_id:
            return None

        try:
            resp = requests.get(
                f"{self.rest_url}/registry_records",
                headers=self._headers(),
                params={"certificate_id": f"eq.{certificate_id}", "select": "*", "limit": "1"},
                timeout=3.0
            )
            if resp.status_code == 200:
                rows = resp.json()
                if isinstance(rows, list) and len(rows) > 0:
                    return rows[0]
        except Exception:
            pass
        return None


supabase_service = SupabaseService()
