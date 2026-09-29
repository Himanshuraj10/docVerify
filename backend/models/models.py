import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey, Enum as SQLEnum, JSON, Index, CheckConstraint
)
from sqlalchemy.orm import relationship
from backend.database import Base

class UserRole(str, enum.Enum):
    USER = "USER"
    ADMIN = "ADMIN"
    OWNER = "OWNER"

class VerificationStatus(str, enum.Enum):
    VERIFIED = "VERIFIED"
    SUSPICIOUS = "SUSPICIOUS"
    REJECTED = "REJECTED"

class ComplaintStatus(str, enum.Enum):
    SUBMITTED = "Submitted"
    UNDER_REVIEW = "Under Review"
    INVESTIGATION = "Investigation"
    RESOLVED = "Resolved"

def utcnow():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.USER, nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    permissions = Column(JSON, default=list, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")
    verifications = relationship("VerificationResult", back_populates="user", cascade="all, delete-orphan")
    complaints = relationship("Complaint", back_populates="user", cascade="all, delete-orphan")
    admin_logs = relationship("AdminLog", back_populates="admin")

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(128), nullable=False)
    file_hash = Column(String(64), nullable=False, index=True)  # SHA-256
    document_type = Column(String(64), nullable=False, default="Degree Certificate")
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    user = relationship("User", back_populates="documents")
    verification = relationship("VerificationResult", back_populates="document", uselist=False, cascade="all, delete-orphan")

class RegistryRecord(Base):
    __tablename__ = "registry_records"

    id = Column(Integer, primary_key=True, index=True)
    certificate_id = Column(String(64), unique=True, index=True, nullable=False)
    name = Column(String(128), nullable=False, index=True)
    dob = Column(String(32), nullable=False)
    institution = Column(String(255), nullable=False)
    course = Column(String(128), nullable=False)
    issue_year = Column(Integer, nullable=False)
    status = Column(String(32), default="ACTIVE", nullable=False)
    is_synthetic = Column(Boolean, default=True, nullable=False)
    metadata_json = Column(JSON, default=dict, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

class VerificationResult(Base):
    __tablename__ = "verification_results"

    id = Column(String(64), primary_key=True, index=True)  # Format: VRF-YYYY-XXXXX
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, unique=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(SQLEnum(VerificationStatus), nullable=False, index=True)
    risk_score = Column(Integer, nullable=False)
    ocr_confidence = Column(Float, nullable=False)
    summary = Column(Text, nullable=True)
    result_data = Column(JSON, nullable=False)  # Complete response structure
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    __table_args__ = (
        CheckConstraint('risk_score >= 0 AND risk_score <= 100', name='check_risk_score_range'),
    )

    document = relationship("Document", back_populates="verification")
    user = relationship("User", back_populates="verifications")
    checks = relationship("VerificationCheck", back_populates="verification", cascade="all, delete-orphan")
    blockchain_record = relationship("BlockchainRecord", back_populates="verification", uselist=False, cascade="all, delete-orphan")
    complaints = relationship("Complaint", back_populates="verification")

class VerificationCheck(Base):
    __tablename__ = "verification_checks"

    id = Column(Integer, primary_key=True, index=True)
    verification_id = Column(String(64), ForeignKey("verification_results.id", ondelete="CASCADE"), nullable=False, index=True)
    check_type = Column(String(64), nullable=False)  # OCR, REGISTRY, TAMPER, ML_ANOMALY, RISK, BLOCKCHAIN
    status = Column(String(32), nullable=False)      # PASS, WARN, FAIL
    score = Column(Float, nullable=True)
    details = Column(JSON, default=dict, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    verification = relationship("VerificationResult", back_populates="checks")

class BlockchainRecord(Base):
    __tablename__ = "blockchain_records"

    id = Column(Integer, primary_key=True, index=True)
    verification_id = Column(String(64), ForeignKey("verification_results.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    document_hash = Column(String(64), nullable=False, index=True)
    transaction_id = Column(String(128), nullable=False, index=True)
    block_number = Column(Integer, nullable=False)
    contract_address = Column(String(64), nullable=False)
    issuer_id = Column(String(64), default="DEMO-REGISTRY", nullable=False)
    record_version = Column(String(16), default="1.0", nullable=False)
    network = Column(String(64), default="EVM-Compatible Local", nullable=False)
    status = Column(String(32), default="CONFIRMED", nullable=False)
    recorded_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    verification = relationship("VerificationResult", back_populates="blockchain_record")

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(String(64), primary_key=True, index=True)  # Format: CMP-YYYY-XXXXX
    verification_id = Column(String(64), ForeignKey("verification_results.id", ondelete="SET NULL"), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    email = Column(String(255), nullable=False)
    issue_type = Column(String(64), nullable=False)
    description = Column(Text, nullable=False)
    attachment_path = Column(String(512), nullable=True)
    status = Column(SQLEnum(ComplaintStatus), default=ComplaintStatus.SUBMITTED, nullable=False, index=True)
    response = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    user = relationship("User", back_populates="complaints")
    verification = relationship("VerificationResult", back_populates="complaints")

class FAQ(Base):
    __tablename__ = "faq"

    id = Column(Integer, primary_key=True, index=True)
    question = Column(String(255), nullable=False)
    answer = Column(Text, nullable=False)
    category = Column(String(64), default="General", nullable=False)
    is_enabled = Column(Boolean, default=True, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

class WebsiteContent(Base):
    __tablename__ = "website_content"

    id = Column(Integer, primary_key=True, index=True)
    section_key = Column(String(64), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=True)
    subtitle = Column(Text, nullable=True)
    content = Column(JSON, default=dict, nullable=False)
    cta_text = Column(String(64), nullable=True)
    cta_link = Column(String(128), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

class VerificationSettings(Base):
    __tablename__ = "verification_settings"

    id = Column(Integer, primary_key=True, index=True)
    setting_key = Column(String(64), unique=True, index=True, nullable=False)
    setting_value = Column(JSON, nullable=False)
    description = Column(String(255), nullable=True)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

class AdminLog(Base):
    __tablename__ = "admin_logs"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(128), nullable=False)
    target_type = Column(String(64), nullable=True)
    target_id = Column(String(64), nullable=True)
    details = Column(JSON, default=dict, nullable=False)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    admin = relationship("User", back_populates="admin_logs")
