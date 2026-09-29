import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.database import get_db
from backend.models.models import Complaint, ComplaintStatus, User
from backend.schemas.schemas import ComplaintCreateRequest, ComplaintResponse
from backend.auth.dependencies import get_current_user, get_optional_current_user

router = APIRouter(prefix="/api/complaints", tags=["Complaints"])

@router.post("", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
def submit_complaint(
    payload: ComplaintCreateRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    year = datetime.now().year
    random_num = uuid.uuid4().hex[:5].upper()
    complaint_id = f"CMP-{year}-{random_num}"

    user_id = current_user.id if current_user else 1

    complaint = Complaint(
        id=complaint_id,
        verification_id=payload.verification_id,
        user_id=user_id,
        email=payload.email,
        issue_type=payload.issue_type,
        description=payload.description,
        status=ComplaintStatus.SUBMITTED
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)

    return complaint

@router.get("/{complaint_id}", response_model=ComplaintResponse)
def get_complaint(complaint_id: str, db: Session = Depends(get_db)):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint with ID '{complaint_id}' was not found."
        )
    return complaint

@router.get("/user/my-complaints", response_model=List[ComplaintResponse])
def get_user_complaints(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaints = db.query(Complaint).filter(
        Complaint.user_id == current_user.id
    ).order_by(Complaint.created_at.desc()).all()
    return complaints
