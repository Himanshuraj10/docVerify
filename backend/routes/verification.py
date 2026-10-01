import uuid
import shutil
from datetime import datetime, timezone
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, Request
from sqlalchemy.orm import Session
from typing import Optional, List

from backend.database import get_db
from backend.models.models import (
    User, Document, VerificationResult, VerificationCheck,
    BlockchainRecord, VerificationStatus, AdminLog
)
from backend.schemas.schemas import FixedVerificationResponse, UserResponse
from backend.auth.dependencies import get_current_user, get_optional_current_user
from backend.config import settings
from backend.services import (
    DocumentPreprocessor, OCRService, DocumentUnderstandingService,
    DocumentValidator, RegistryService, TamperAnalysisService,
    ForensicHeatmapService, anomaly_detector, RiskEngine,
    DecisionEngine, DocumentHashingService, blockchain_service,
    QRService, supabase_service
)

router = APIRouter(prefix="/api", tags=["Verification Pipeline"])

@router.get("/supabase/status")
def get_supabase_status():
    return supabase_service.check_connection()

@router.post("/supabase/sync")
def sync_all_data_to_supabase(db: Session = Depends(get_db)):
    return supabase_service.sync_all_local_data(db)

@router.post("/verify", response_model=FixedVerificationResponse)
async def verify_document(
    request: Request,
    file: UploadFile = File(...),
    document_type: str = Form("Auto-Detect"),
    consent: bool = Form(...),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    if not consent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User consent is required to process and verify the document."
        )

    # 1. Upload & File Validation
    ext = Path(file.filename).suffix.lower()
    allowed_exts = {".png", ".jpg", ".jpeg", ".pdf"}
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported format '{ext}'. Supported formats: PNG, JPG, JPEG, PDF."
        )

    year = datetime.now().year
    random_id = uuid.uuid4().hex[:6].upper()
    verification_id = f"VRF-{year}-{random_id}"

    # Save original document securely
    saved_filename = f"{verification_id}_doc{ext}"
    saved_filepath = settings.UPLOAD_DIR / saved_filename

    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty.")
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File exceeds maximum 10MB limit.")

    with open(saved_filepath, "wb") as f:
        f.write(contents)

    # 2. SHA-256 Document Hashing
    doc_hash = DocumentHashingService.calculate_bytes_hash(contents)

    # Resolve or create guest user if unauthenticated
    user_id = current_user.id if current_user else 1

    # 3. Document Preprocessing
    try:
        cv_img, pil_img = DocumentPreprocessor.load_as_image(str(saved_filepath))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to parse document image. Please upload a clear JPG, PNG, or PDF."
        )

    # 4. OCR & Data Extraction
    ocr_result = OCRService.extract_text_and_boxes(pil_img, cv_img, str(saved_filepath))
    raw_text = ocr_result.get("raw_text", "")
    ocr_conf = ocr_result.get("confidence", 85.0)
    ocr_boxes = ocr_result.get("boxes", [])

    # 5. Document Understanding Layer (with Auto-Detection of PAN / Aadhaar)
    doc_understanding = DocumentUnderstandingService.analyze_document(raw_text, ocr_boxes, document_type)
    resolved_doc_type = doc_understanding.get("document_type", document_type)
    extracted_fields = doc_understanding.get("extracted_fields", {})
    field_positions = doc_understanding.get("field_positions", {})

    # 6. Information Validation
    val_result = DocumentValidator.validate_fields(extracted_fields, resolved_doc_type)

    # 7. Authorized Registry Cross-Check
    reg_result = RegistryService.cross_check(db, extracted_fields)

    # 8. Visual / Tamper Analysis
    cert_id = extracted_fields.get("certificate_id", "")
    tamper_result = TamperAnalysisService.analyze_tampering(pil_img, cv_img, cert_id)

    # 9. AI-Assisted Forensic Heatmap
    heatmap_result = ForensicHeatmapService.generate_heatmap(
        cv_img=cv_img,
        extracted_fields=extracted_fields,
        field_positions=field_positions,
        registry_result=reg_result,
        tamper_result=tamper_result,
        ocr_boxes=ocr_boxes,
        verification_id=verification_id
    )

    # 10. ML Anomaly Detection (Isolation Forest)
    ml_result = anomaly_detector.detect(
        ocr_confidence=ocr_conf,
        registry_result=reg_result,
        tamper_result=tamper_result,
        validation_result=val_result
    )

    # 11. Centralized Explainable Risk Engine
    risk_result = RiskEngine.calculate_risk(
        registry_result=reg_result,
        tamper_result=tamper_result,
        ocr_confidence=ocr_conf,
        validation_result=val_result,
        ml_result=ml_result,
        extracted_fields=extracted_fields
    )
    risk_score = risk_result["risk_score"]

    # 12. Verification Decision
    decision_result = DecisionEngine.evaluate(
        risk_score=risk_score,
        registry_result=reg_result,
        tamper_result=tamper_result,
        ocr_confidence=ocr_conf,
        validation_result=val_result
    )
    final_status = decision_result["status"]

    # 13. Blockchain Notarization
    chain_record = blockchain_service.register_verification(
        verification_id=verification_id,
        document_hash=doc_hash,
        result=final_status
    )

    # 14. Verification Receipt & QR
    base_url = str(request.base_url).rstrip("/")
    qr_data = QRService.generate_verification_qr(verification_id, base_url)

    # Assemble Structured Response
    response_payload = {
        "verification_id": verification_id,
        "status": final_status,
        "risk_score": risk_score,
        "ocr_confidence": ocr_conf,
        "document_type": resolved_doc_type,
        "declared_document_type": document_type,
        "auto_detected_type": resolved_doc_type,
        "was_auto_corrected": doc_understanding.get("was_auto_corrected", False),
        "supabase": {
            "project_id": settings.SUPABASE_PROJECT_ID,
            "url": settings.SUPABASE_URL,
            "connected": True
        },
        "extracted_fields": extracted_fields,
        "ocr_details": {
            "engine": ocr_result.get("engine", "RapidOCR"),
            "declared_type": document_type,
            "auto_detected_type": resolved_doc_type,
            "was_auto_corrected": doc_understanding.get("was_auto_corrected", False),
            "raw_text": raw_text,
            "raw_lines": doc_understanding.get("raw_lines", []),
            "boxes": ocr_boxes,
            "field_count": len(extracted_fields),
            "supabase_project": settings.SUPABASE_PROJECT_ID
        },
        "registry": {
            "found": reg_result["found"],
            "certificate_id_match": reg_result["certificate_id_match"],
            "name_match": reg_result["name_match"],
            "dob_match": reg_result["dob_match"],
            "institution_match": reg_result["institution_match"],
            "details": reg_result.get("details")
        },
        "tamper_analysis": {
            "tamper_score": tamper_result["tamper_score"],
            "status": tamper_result["status"],
            "indicators": tamper_result["indicators"]
        },
        "risk_analysis": {
            "level": risk_result["level"],
            "reason": risk_result["reason"],
            "breakdown": risk_result["breakdown"],
            "factors": risk_result.get("factors", []),
            "problems_found": risk_result.get("problems_found", [])
        },
        "heatmap": {
            "overall_score": heatmap_result["overall_score"],
            "level": heatmap_result["level"],
            "regions": heatmap_result["regions"],
            "heatmap_image_url": heatmap_result["heatmap_image_url"],
            "original_image_url": f"/uploads/{saved_filename}"
        },
        "blockchain": {
            "recorded": chain_record["recorded"],
            "transaction_id": chain_record["transaction_id"],
            "document_hash": chain_record["document_hash"],
            "block_number": chain_record["block_number"],
            "contract_address": chain_record["contract_address"],
            "network": chain_record["network"],
            "timestamp": chain_record["timestamp"]
        },
        "qr": qr_data,
        "field_comparisons": reg_result.get("field_comparisons", []),
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    # Persist in PostgreSQL
    db_document = Document(
        user_id=user_id,
        file_name=file.filename,
        file_path=str(saved_filepath),
        file_size=len(contents),
        mime_type=file.content_type or "application/octet-stream",
        file_hash=doc_hash,
        document_type=resolved_doc_type
    )
    db.add(db_document)
    db.flush()

    status_enum = VerificationStatus(final_status)
    db_result = VerificationResult(
        id=verification_id,
        document_id=db_document.id,
        user_id=user_id,
        status=status_enum,
        risk_score=risk_score,
        ocr_confidence=ocr_conf,
        summary=decision_result["summary"],
        result_data=response_payload
    )
    db.add(db_result)

    # Persist individual checks
    checks = [
        ("OCR", "PASS" if ocr_conf >= 70 else "WARN", ocr_conf, {"engine": ocr_result.get("engine")}),
        ("REGISTRY", "PASS" if reg_result["found"] and reg_result["certificate_id_match"] else "FAIL", 1.0 if reg_result["found"] else 0.0, reg_result.get("details", {})),
        ("TAMPER", "PASS" if tamper_result["status"] == "LOW" else "WARN", tamper_result["tamper_score"], {"indicators": tamper_result["indicators"]}),
        ("ML_ANOMALY", "WARN" if ml_result["is_outlier"] else "PASS", ml_result["ml_anomaly_score"], ml_result["features_analyzed"]),
        ("RISK_ENGINE", risk_result["level"], float(risk_score), risk_result["breakdown"]),
        ("BLOCKCHAIN", "CONFIRMED", 1.0, {"tx": chain_record["transaction_id"]})
    ]

    for c_type, c_status, c_score, c_details in checks:
        db.add(VerificationCheck(
            verification_id=verification_id,
            check_type=c_type,
            status=c_status,
            score=c_score,
            details=c_details
        ))

    # Persist Blockchain Record
    db.add(BlockchainRecord(
        verification_id=verification_id,
        document_hash=doc_hash,
        transaction_id=chain_record["transaction_id"],
        block_number=chain_record["block_number"],
        contract_address=chain_record["contract_address"],
        issuer_id="DEMO-REGISTRY",
        record_version="1.0",
        network=chain_record["network"],
        status="CONFIRMED"
    ))

    db.commit()

    # Sync verification record to Supabase Cloud (non-blocking)
    supabase_service.sync_verification_result(response_payload)

    return response_payload

@router.get("/verification/{verification_id}", response_model=FixedVerificationResponse)
def get_verification_details(
    verification_id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    record = db.query(VerificationResult).filter(VerificationResult.id == verification_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Verification record '{verification_id}' was not found."
        )

    # If authenticated, ensure non-admins can only see their own records
    if current_user and current_user.role.value == "USER" and record.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this verification record.")

    return record.result_data

@router.get("/verification/{verification_id}/receipt")
def get_receipt(verification_id: str, db: Session = Depends(get_db)):
    record = db.query(VerificationResult).filter(VerificationResult.id == verification_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Verification record not found."
        )

    data = record.result_data
    return {
        "verification_id": data.get("verification_id"),
        "status": data.get("status"),
        "risk_level": data.get("risk_analysis", {}).get("level", "LOW"),
        "risk_score": data.get("risk_score"),
        "document_hash": data.get("blockchain", {}).get("document_hash"),
        "timestamp": data.get("blockchain", {}).get("timestamp"),
        "transaction_id": data.get("blockchain", {}).get("transaction_id"),
        "block_number": data.get("blockchain", {}).get("block_number"),
        "qr": data.get("qr")
    }

@router.get("/user/verifications")
def get_user_verifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    records = db.query(VerificationResult).filter(
        VerificationResult.user_id == current_user.id
    ).order_by(VerificationResult.created_at.desc()).all()

    total = len(records)
    verified = sum(1 for r in records if r.status == VerificationStatus.VERIFIED)
    suspicious = sum(1 for r in records if r.status == VerificationStatus.SUSPICIOUS)
    rejected = sum(1 for r in records if r.status == VerificationStatus.REJECTED)

    items = []
    for r in records:
        data = r.result_data or {}
        items.append({
            "verification_id": r.id,
            "status": r.status.value,
            "risk_score": r.risk_score,
            "ocr_confidence": r.ocr_confidence,
            "document_hash": data.get("blockchain", {}).get("document_hash", ""),
            "created_at": r.created_at.isoformat(),
            "transaction_id": data.get("blockchain", {}).get("transaction_id", "")
        })

    return {
        "stats": {
            "total": total,
            "verified": verified,
            "suspicious": suspicious,
            "rejected": rejected
        },
        "verifications": items
    }
