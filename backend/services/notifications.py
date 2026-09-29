from sqlalchemy.orm import Session
from backend.models.models import AdminLog
from typing import Optional, Dict, Any

class AuditLogger:
    @staticmethod
    def log_action(
        db: Session,
        admin_id: Optional[int],
        action: str,
        target_type: Optional[str] = None,
        target_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None
    ):
        try:
            log_entry = AdminLog(
                admin_id=admin_id,
                action=action,
                target_type=target_type,
                target_id=str(target_id) if target_id else None,
                details=details or {},
                ip_address=ip_address
            )
            db.add(log_entry)
            db.commit()
        except Exception:
            db.rollback()
