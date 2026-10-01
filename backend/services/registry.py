from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.models.models import RegistryRecord
from backend.services.supabase_service import supabase_service
import difflib
import re

class RegistryService:
    """
    Cross-checks extracted document fields (PAN / Aadhaar / Certificate) against
    Supabase Cloud Registry and PostgreSQL Authorized Registry.
    """

    @staticmethod
    def _similarity(s1: str, s2: str) -> float:
        if not s1 or not s2:
            return 0.0
        return difflib.SequenceMatcher(None, s1.strip().lower(), s2.strip().lower()).ratio()

    @staticmethod
    def _normalize_id(val: str) -> str:
        if not val:
            return ""
        return re.sub(r"[\s\-]+", "-", val.strip().upper())

    @staticmethod
    def cross_check(db: Session, extracted_fields: Dict[str, Any]) -> Dict[str, Any]:
        cert_id = extracted_fields.get("certificate_id")
        norm_id = RegistryService._normalize_id(cert_id) if cert_id else ""
        name = extracted_fields.get("name")

        record: Optional[RegistryRecord] = None

        # 1. Search primarily by Document ID in PostgreSQL
        if norm_id:
            record = db.query(RegistryRecord).filter(
                RegistryRecord.certificate_id.ilike(norm_id)
            ).first()
            if not record and cert_id:
                record = db.query(RegistryRecord).filter(
                    RegistryRecord.certificate_id.ilike(cert_id.strip())
                ).first()

        # 2. Check Supabase Cloud Registry if not in local DB yet
        if not record and norm_id:
            sb_rec = supabase_service.lookup_registry_record(norm_id)
            if sb_rec:
                record = RegistryRecord(
                    certificate_id=sb_rec.get("certificate_id", norm_id),
                    name=sb_rec.get("name", ""),
                    dob=sb_rec.get("dob", ""),
                    institution=sb_rec.get("institution", ""),
                    course=sb_rec.get("course", ""),
                    issue_year=int(sb_rec.get("issue_year", 2026)),
                    status=sb_rec.get("status", "ACTIVE"),
                    is_synthetic=True,
                    metadata_json=sb_rec.get("metadata_json", {})
                )

        # 3. If not found by ID, attempt lookup by Name to detect forged/mismatched IDs
        if not record and name and "placeholder" not in str(name).lower():
            record = db.query(RegistryRecord).filter(
                RegistryRecord.name.ilike(f"%{name.strip()}%")
            ).first()

        if not record:
            return {
                "found": False,
                "certificate_id_match": False,
                "name_match": False,
                "dob_match": False,
                "institution_match": False,
                "details": {"message": "No matching record found in Authorized Document Registry"},
                "field_comparisons": [
                    {
                        "field_name": "Document Number (PAN / Aadhaar)",
                        "document_value": cert_id or "Not extracted",
                        "registry_value": "NOT FOUND IN REGISTRY",
                        "match_status": "MISMATCH",
                        "confidence": 0.0
                    },
                    {
                        "field_name": "Full Name",
                        "document_value": name or "Not extracted",
                        "registry_value": "NOT FOUND IN REGISTRY",
                        "match_status": "MISMATCH",
                        "confidence": 0.0
                    }
                ]
            }

        cert_match = (
            RegistryService._normalize_id(cert_id or "") == RegistryService._normalize_id(record.certificate_id)
            if cert_id else False
        )

        name_sim = RegistryService._similarity(name or "", record.name)
        name_match = name_sim >= 0.82

        doc_dob = str(extracted_fields.get("dob", "")).strip()
        reg_dob = str(record.dob).strip()
        dob_match = (doc_dob == reg_dob) if (doc_dob and reg_dob) else False

        doc_inst = extracted_fields.get("institution", "")
        inst_sim = RegistryService._similarity(doc_inst, record.institution)
        inst_match = inst_sim >= 0.70 if doc_inst else False

        doc_course = extracted_fields.get("course", "")
        course_sim = RegistryService._similarity(doc_course, record.course)
        course_match = course_sim >= 0.60 if doc_course else False

        doc_year = str(extracted_fields.get("issue_year", ""))
        reg_year = str(record.issue_year)
        year_match = (doc_year == reg_year) if (doc_year and reg_year) else False

        field_comparisons = [
            {
                "field_name": "Document Number (PAN / Aadhaar)",
                "document_value": cert_id or "Missing",
                "registry_value": record.certificate_id,
                "match_status": "MATCH" if cert_match else "MISMATCH",
                "confidence": 1.0 if cert_match else 0.0
            },
            {
                "field_name": "Full Name",
                "document_value": name or "Missing",
                "registry_value": record.name,
                "match_status": "MATCH" if name_match else "MISMATCH",
                "confidence": round(name_sim, 2)
            },
            {
                "field_name": "Date of Birth (DOB)",
                "document_value": doc_dob or "Missing",
                "registry_value": record.dob,
                "match_status": "MATCH" if dob_match else "MISMATCH",
                "confidence": 1.0 if dob_match else 0.0
            },
            {
                "field_name": "Issuing Authority",
                "document_value": doc_inst or "Missing",
                "registry_value": record.institution,
                "match_status": "MATCH" if inst_match else "MISMATCH",
                "confidence": round(inst_sim, 2)
            },
            {
                "field_name": "Document Category",
                "document_value": doc_course or "Missing",
                "registry_value": record.course,
                "match_status": "MATCH" if course_match else "MISMATCH",
                "confidence": round(course_sim, 2)
            },
            {
                "field_name": "Year of Issue",
                "document_value": doc_year or "Missing",
                "registry_value": str(record.issue_year),
                "match_status": "MATCH" if year_match else "MISMATCH",
                "confidence": 1.0 if year_match else 0.0
            }
        ]

        return {
            "found": True,
            "certificate_id_match": cert_match,
            "name_match": name_match,
            "dob_match": dob_match,
            "institution_match": inst_match,
            "course_match": course_match,
            "year_match": year_match,
            "details": {
                "registry_id": record.certificate_id,
                "status": record.status,
                "source": "Authorized Document Registry (Supabase + PostgreSQL)",
                "metadata": record.metadata_json
            },
            "field_comparisons": field_comparisons
        }
