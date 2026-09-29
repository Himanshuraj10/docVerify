from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.database import get_db
from backend.models.models import (
    User, UserRole, VerificationResult, VerificationStatus,
    Complaint, ComplaintStatus, BlockchainRecord, FAQ, AdminLog
)
from backend.schemas.schemas import (
    UserResponse, ComplaintResponse, ComplaintStatusUpdateRequest,
    FAQCreateRequest, FAQUpdateRequest, FAQResponse
)
from backend.auth.dependencies import require_role
from backend.services.notifications import AuditLogger

router = APIRouter(prefix="/api/admin", tags=["Admin Operations"])

admin_guard = require_role([UserRole.ADMIN, UserRole.OWNER])

@router.get("/dashboard")
def get_admin_dashboard(current_admin: User = Depends(admin_guard), db: Session = Depends(get_db)):
    total_docs = db.query(VerificationResult).count()
    verified_count = db.query(VerificationResult).filter(VerificationResult.status == VerificationStatus.VERIFIED).count()
    suspicious_count = db.query(VerificationResult).filter(VerificationResult.status == VerificationStatus.SUSPICIOUS).count()
    rejected_count = db.query(VerificationResult).filter(VerificationResult.status == VerificationStatus.REJECTED).count()
    
    total_complaints = db.query(Complaint).count()
    pending_complaints = db.query(Complaint).filter(Complaint.status != ComplaintStatus.RESOLVED).count()
    total_blockchain = db.query(BlockchainRecord).count()
    total_users = db.query(User).filter(User.role == UserRole.USER).count()

    recent_verifications = db.query(VerificationResult).order_by(VerificationResult.created_at.desc()).limit(8).all()
    recent_items = []
    for r in recent_verifications:
        data = r.result_data or {}
        recent_items.append({
            "verification_id": r.id,
            "status": r.status.value,
            "risk_score": r.risk_score,
            "ocr_confidence": r.ocr_confidence,
            "created_at": r.created_at.isoformat(),
            "transaction_id": data.get("blockchain", {}).get("transaction_id", "")
        })

    return {
        "stats": {
            "total_documents": total_docs,
            "verified": verified_count,
            "suspicious": suspicious_count,
            "rejected": rejected_count,
            "total_complaints": total_complaints,
            "pending_complaints": pending_complaints,
            "total_blockchain_records": total_blockchain,
            "total_users": total_users
        },
        "recent_verifications": recent_items
    }

@router.get("/verifications")
def get_all_verifications(
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    current_admin: User = Depends(admin_guard),
    db: Session = Depends(get_db)
):
    query = db.query(VerificationResult)
    if status_filter:
        try:
            query = query.filter(VerificationResult.status == VerificationStatus(status_filter))
        except ValueError:
            pass

    if search:
        query = query.filter(VerificationResult.id.ilike(f"%{search.strip()}%"))

    records = query.order_by(VerificationResult.created_at.desc()).all()
    results = []
    for r in records:
        data = r.result_data or {}
        results.append({
            "verification_id": r.id,
            "status": r.status.value,
            "risk_score": r.risk_score,
            "ocr_confidence": r.ocr_confidence,
            "document_hash": data.get("blockchain", {}).get("document_hash", ""),
            "transaction_id": data.get("blockchain", {}).get("transaction_id", ""),
            "created_at": r.created_at.isoformat()
        })
    return results

@router.get("/suspicious")
def get_suspicious_cases(current_admin: User = Depends(admin_guard), db: Session = Depends(get_db)):
    records = db.query(VerificationResult).filter(
        VerificationResult.status == VerificationStatus.SUSPICIOUS
    ).order_by(VerificationResult.created_at.desc()).all()

    results = []
    for r in records:
        data = r.result_data or {}
        results.append({
            "verification_id": r.id,
            "risk_score": r.risk_score,
            "indicators": data.get("tamper_analysis", {}).get("indicators", []),
            "reason": data.get("risk_analysis", {}).get("reason", ""),
            "created_at": r.created_at.isoformat(),
            "heatmap_url": data.get("heatmap", {}).get("heatmap_image_url")
        })
    return results

@router.get("/complaints", response_model=List[ComplaintResponse])
def get_admin_complaints(
    status_filter: Optional[str] = None,
    current_admin: User = Depends(admin_guard),
    db: Session = Depends(get_db)
):
    query = db.query(Complaint)
    if status_filter:
        try:
            query = query.filter(Complaint.status == ComplaintStatus(status_filter))
        except ValueError:
            pass
    return query.order_by(Complaint.created_at.desc()).all()

@router.put("/complaints/{complaint_id}")
def update_complaint_status(
    complaint_id: str,
    payload: ComplaintStatusUpdateRequest,
    current_admin: User = Depends(admin_guard),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")

    try:
        complaint.status = ComplaintStatus(payload.status)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid status '{payload.status}'")

    if payload.response is not None:
        complaint.response = payload.response

    db.commit()

    AuditLogger.log_action(
        db=db,
        admin_id=current_admin.id,
        action="UPDATE_COMPLAINT_STATUS",
        target_type="COMPLAINT",
        target_id=complaint_id,
        details={"status": payload.status, "has_response": bool(payload.response)}
    )

    return {"message": "Complaint updated successfully", "complaint_id": complaint_id}

@router.get("/users", response_model=List[UserResponse])
def get_permitted_users(current_admin: User = Depends(admin_guard), db: Session = Depends(get_db)):
    # Exclude passwords strictly
    users = db.query(User).filter(User.role == UserRole.USER).order_by(User.created_at.desc()).all()
    return users

@router.get("/blockchain")
def get_blockchain_monitoring(current_admin: User = Depends(admin_guard), db: Session = Depends(get_db)):
    """READ-ONLY blockchain ledger records view."""
    records = db.query(BlockchainRecord).order_by(BlockchainRecord.recorded_at.desc()).all()
    return [{
        "id": r.id,
        "verification_id": r.verification_id,
        "document_hash": r.document_hash,
        "transaction_id": r.transaction_id,
        "block_number": r.block_number,
        "contract_address": r.contract_address,
        "network": r.network,
        "status": r.status,
        "recorded_at": r.recorded_at.isoformat()
    } for r in records]

@router.post("/faqs", response_model=FAQResponse)
def create_faq(payload: FAQCreateRequest, current_admin: User = Depends(admin_guard), db: Session = Depends(get_db)):
    faq = FAQ(**payload.model_dump())
    db.add(faq)
    db.commit()
    db.refresh(faq)
    return faq

@router.put("/faqs/{faq_id}", response_model=FAQResponse)
def update_faq(faq_id: int, payload: FAQUpdateRequest, current_admin: User = Depends(admin_guard), db: Session = Depends(get_db)):
    faq = db.query(FAQ).filter(FAQ.id == faq_id).first()
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")
    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(faq, field, val)
    db.commit()
    db.refresh(faq)
    return faq

@router.delete("/faqs/{faq_id}")
def delete_faq(faq_id: int, current_admin: User = Depends(admin_guard), db: Session = Depends(get_db)):
    faq = db.query(FAQ).filter(FAQ.id == faq_id).first()
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")
    db.delete(faq)
    db.commit()
    return {"message": "FAQ deleted"}
