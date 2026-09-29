from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

from backend.database import get_db
from backend.models.models import (
    User, UserRole, VerificationResult, VerificationStatus,
    Complaint, BlockchainRecord, FAQ, WebsiteContent,
    VerificationSettings, AdminLog
)
from backend.schemas.schemas import (
    UserResponse, AdminCreateRequest, AdminUpdateRequest,
    WebsiteContentUpdate, VerificationSettingsUpdate
)
from backend.auth.dependencies import require_role
from backend.auth.security import get_password_hash, create_password_reset_token
from backend.services.notifications import AuditLogger

router = APIRouter(prefix="/api/owner", tags=["Owner Operations"])

owner_guard = require_role([UserRole.OWNER])

# --- Dashboard & Activity ---

@router.get("/dashboard")
def get_owner_dashboard(current_owner: User = Depends(owner_guard), db: Session = Depends(get_db)):
    total_docs = db.query(VerificationResult).count()
    verified_count = db.query(VerificationResult).filter(VerificationResult.status == VerificationStatus.VERIFIED).count()
    suspicious_count = db.query(VerificationResult).filter(VerificationResult.status == VerificationStatus.SUSPICIOUS).count()
    rejected_count = db.query(VerificationResult).filter(VerificationResult.status == VerificationStatus.REJECTED).count()
    
    total_complaints = db.query(Complaint).count()
    total_blockchain = db.query(BlockchainRecord).count()
    total_admins = db.query(User).filter(User.role == UserRole.ADMIN).count()
    total_users = db.query(User).filter(User.role == UserRole.USER).count()

    recent_logs = db.query(AdminLog).order_by(AdminLog.created_at.desc()).limit(10).all()
    logs_data = [{
        "id": l.id,
        "admin_name": l.admin.name if l.admin else "System",
        "action": l.action,
        "target_type": l.target_type,
        "target_id": l.target_id,
        "details": l.details,
        "created_at": l.created_at.isoformat()
    } for l in recent_logs]

    return {
        "stats": {
            "total_documents": total_docs,
            "verified": verified_count,
            "suspicious": suspicious_count,
            "rejected": rejected_count,
            "complaints": total_complaints,
            "blockchain_records": total_blockchain,
            "total_admins": total_admins,
            "total_users": total_users
        },
        "recent_activity": logs_data
    }

# --- Admin Management (Section 9) ---

@router.get("/admins", response_model=List[UserResponse])
def list_admins(current_owner: User = Depends(owner_guard), db: Session = Depends(get_db)):
    return db.query(User).filter(User.role == UserRole.ADMIN).order_by(User.created_at.desc()).all()

@router.post("/admins", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_admin(payload: AdminCreateRequest, current_owner: User = Depends(owner_guard), db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email.ilike(payload.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="A user with this email already exists.")

    new_admin = User(
        name=payload.name.strip(),
        email=payload.email.lower().strip(),
        hashed_password=get_password_hash(payload.password),
        role=UserRole.ADMIN,
        is_active=True,
        permissions=payload.permissions
    )
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)

    AuditLogger.log_action(
        db=db,
        admin_id=current_owner.id,
        action="CREATE_ADMIN",
        target_type="ADMIN",
        target_id=str(new_admin.id),
        details={"name": new_admin.name, "email": new_admin.email}
    )
    return new_admin

@router.put("/admins/{admin_id}", response_model=UserResponse)
def update_admin(
    admin_id: int,
    payload: AdminUpdateRequest,
    current_owner: User = Depends(owner_guard),
    db: Session = Depends(get_db)
):
    admin = db.query(User).filter(User.id == admin_id, User.role == UserRole.ADMIN).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")

    if payload.email and payload.email.lower().strip() != admin.email:
        # Check collision
        coll = db.query(User).filter(User.email.ilike(payload.email.strip())).first()
        if coll:
            raise HTTPException(status_code=400, detail="New email is already in use by another account.")
        admin.email = payload.email.lower().strip()

    if payload.name:
        admin.name = payload.name.strip()
    if payload.is_active is not None:
        admin.is_active = payload.is_active
    if payload.permissions is not None:
        admin.permissions = payload.permissions

    db.commit()
    db.refresh(admin)

    AuditLogger.log_action(
        db=db,
        admin_id=current_owner.id,
        action="UPDATE_ADMIN",
        target_type="ADMIN",
        target_id=str(admin.id),
        details={"email": admin.email, "is_active": admin.is_active}
    )
    return admin

@router.post("/admins/{admin_id}/reset-password")
def trigger_admin_password_reset(admin_id: int, current_owner: User = Depends(owner_guard), db: Session = Depends(get_db)):
    admin = db.query(User).filter(User.id == admin_id, User.role == UserRole.ADMIN).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")

    reset_token = create_password_reset_token(admin.email)
    AuditLogger.log_action(
        db=db,
        admin_id=current_owner.id,
        action="TRIGGER_PASSWORD_RESET",
        target_type="ADMIN",
        target_id=str(admin.id),
        details={"email": admin.email}
    )
    return {
        "message": f"Password reset instructions issued for admin {admin.email}.",
        "reset_token": reset_token
    }

# --- User Management ---

@router.get("/users", response_model=List[UserResponse])
def list_users(current_owner: User = Depends(owner_guard), db: Session = Depends(get_db)):
    return db.query(User).order_by(User.created_at.desc()).all()

@router.post("/users/{user_id}/toggle-active")
def toggle_user_active(user_id: int, current_owner: User = Depends(owner_guard), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_owner.id:
        raise HTTPException(status_code=400, detail="Cannot disable the active Owner account.")

    user.is_active = not user.is_active
    db.commit()

    AuditLogger.log_action(
        db=db,
        admin_id=current_owner.id,
        action="TOGGLE_USER_ACTIVE",
        target_type="USER",
        target_id=str(user.id),
        details={"new_state": user.is_active}
    )
    return {"message": f"User active state set to {user.is_active}", "is_active": user.is_active}

# --- Website Content Management (Section 31) ---

@router.get("/content")
def get_website_content(db: Session = Depends(get_db)):
    """Publicly accessible content for the dynamic homepage."""
    contents = db.query(WebsiteContent).filter(WebsiteContent.is_active == True).all()
    result = {}
    for c in contents:
        result[c.section_key] = {
            "title": c.title,
            "subtitle": c.subtitle,
            "content": c.content,
            "cta_text": c.cta_text,
            "cta_link": c.cta_link
        }
    return result

@router.put("/content/{section_key}")
def update_website_content(
    section_key: str,
    payload: WebsiteContentUpdate,
    current_owner: User = Depends(owner_guard),
    db: Session = Depends(get_db)
):
    section = db.query(WebsiteContent).filter(WebsiteContent.section_key == section_key).first()
    if not section:
        section = WebsiteContent(section_key=section_key)
        db.add(section)

    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(section, field, val)

    db.commit()
    return {"message": f"Section '{section_key}' updated successfully."}

# --- Verification Settings Management ---

@router.get("/settings")
def get_verification_settings(current_owner: User = Depends(owner_guard), db: Session = Depends(get_db)):
    settings_records = db.query(VerificationSettings).all()
    return {s.setting_key: s.setting_value for s in settings_records}

@router.put("/settings/{setting_key}")
def update_verification_setting(
    setting_key: str,
    payload: VerificationSettingsUpdate,
    current_owner: User = Depends(owner_guard),
    db: Session = Depends(get_db)
):
    setting = db.query(VerificationSettings).filter(VerificationSettings.setting_key == setting_key).first()
    if not setting:
        setting = VerificationSettings(setting_key=setting_key, setting_value=payload.setting_value)
        db.add(setting)
    else:
        setting.setting_value = payload.setting_value
        if payload.description:
            setting.description = payload.description

    db.commit()
    return {"message": f"Setting '{setting_key}' updated."}
