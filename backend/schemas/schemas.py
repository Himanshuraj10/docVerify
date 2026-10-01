from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
import re

EMAIL_REGEX = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"

def validate_email_format(email: str) -> str:
    cleaned = email.strip().lower()
    if not re.match(EMAIL_REGEX, cleaned):
        raise ValueError("Invalid email format")
    return cleaned

# --- Auth Schemas ---

class UserSignupRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=128)
    email: str
    password: str = Field(..., min_length=8, max_length=128)
    confirm_password: str

    @field_validator("email")
    @classmethod
    def check_email(cls, v: str):
        return validate_email_format(v)

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v: str, info):
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("Passwords do not match")
        return v

class UserLoginRequest(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def check_email(cls, v: str):
        return validate_email_format(v)

class ForgotPasswordRequest(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def check_email(cls, v: str):
        return validate_email_format(v)

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)
    confirm_password: str

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v: str, info):
        if "new_password" in info.data and v != info.data["new_password"]:
            raise ValueError("Passwords do not match")
        return v

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    name: str
    email: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    is_active: bool
    permissions: List[str] = []
    created_at: datetime

    class Config:
        from_attributes = True

# --- Admin Management Schemas (Owner only) ---

class AdminCreateRequest(BaseModel):
    name: str
    email: str
    password: str = Field(..., min_length=8)
    permissions: List[str] = ["VERIFY_DOCUMENTS", "HANDLE_COMPLAINTS", "MANAGE_FAQ"]

    @field_validator("email")
    @classmethod
    def check_email(cls, v: str):
        return validate_email_format(v)

class AdminUpdateRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    is_active: Optional[bool] = None
    permissions: Optional[List[str]] = None

    @field_validator("email")
    @classmethod
    def check_email(cls, v: Optional[str]):
        if v is not None:
            return validate_email_format(v)
        return v

# --- Verification Fixed Contract Schemas (Section 22) ---

class RegistryCheckResult(BaseModel):
    found: bool
    certificate_id_match: bool
    name_match: bool
    dob_match: bool
    institution_match: bool
    details: Optional[Dict[str, Any]] = None

class TamperAnalysisResult(BaseModel):
    tamper_score: float
    status: str  # LOW, MODERATE, HIGH
    indicators: List[str] = []

class RiskAnalysisResult(BaseModel):
    level: str   # LOW, MEDIUM, HIGH
    reason: str
    breakdown: Optional[Dict[str, Any]] = None
    factors: Optional[List[str]] = []
    problems_found: Optional[List[Dict[str, Any]]] = []

class HeatmapRegion(BaseModel):
    label: str
    extracted_text: Optional[str] = None
    finding: Optional[str] = None
    x: int
    y: int
    width: int
    height: int
    score: float
    status: str  # LOW, ATTENTION, MODERATE, HIGH

class HeatmapResult(BaseModel):
    overall_score: float
    level: str   # LOW, ATTENTION, MODERATE, HIGH
    regions: List[HeatmapRegion] = []
    heatmap_image_url: Optional[str] = None
    original_image_url: Optional[str] = None

class BlockchainVerificationResult(BaseModel):
    recorded: bool
    transaction_id: str
    document_hash: str
    block_number: Optional[int] = None
    contract_address: Optional[str] = None
    network: Optional[str] = None
    timestamp: Optional[str] = None

class QRResult(BaseModel):
    verification_url: str
    qr_data_url: Optional[str] = None

class ExtractedField(BaseModel):
    field_name: str
    document_value: Optional[str] = None
    registry_value: Optional[str] = None
    match_status: str  # MATCH, MISMATCH, MISSING
    confidence: float

class FixedVerificationResponse(BaseModel):
    verification_id: str
    status: str  # VERIFIED, SUSPICIOUS, REJECTED
    risk_score: int
    ocr_confidence: float
    document_type: str = "Aadhaar Card"
    declared_document_type: Optional[str] = "Auto-Detect"
    auto_detected_type: Optional[str] = None
    was_auto_corrected: Optional[bool] = False
    supabase: Optional[Dict[str, Any]] = None
    extracted_fields: Optional[Dict[str, Any]] = {}
    ocr_details: Optional[Dict[str, Any]] = {}
    registry: RegistryCheckResult
    tamper_analysis: TamperAnalysisResult
    risk_analysis: RiskAnalysisResult
    heatmap: HeatmapResult
    blockchain: BlockchainVerificationResult
    qr: QRResult
    field_comparisons: List[ExtractedField] = []
    created_at: Optional[str] = None

# Public Safe Verification (Section 26)
class PublicVerificationResponse(BaseModel):
    verification_id: str
    status: str
    timestamp: str
    document_hash: str
    blockchain_confirmation: bool
    transaction_id: str
    block_number: Optional[int] = None
    network: Optional[str] = None
    contract_address: Optional[str] = None

# --- Complaints Schemas ---

class ComplaintCreateRequest(BaseModel):
    verification_id: Optional[str] = None
    issue_type: str
    description: str
    email: str

    @field_validator("email")
    @classmethod
    def check_email(cls, v: str):
        return validate_email_format(v)

class ComplaintResponse(BaseModel):
    id: str
    verification_id: Optional[str] = None
    user_id: int
    email: str
    issue_type: str
    description: str
    status: str
    response: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ComplaintStatusUpdateRequest(BaseModel):
    status: str
    response: Optional[str] = None

# --- FAQ & Chatbot Schemas ---

class FAQCreateRequest(BaseModel):
    question: str
    answer: str
    category: str = "General"
    sort_order: int = 0
    is_enabled: bool = True

class FAQUpdateRequest(BaseModel):
    question: Optional[str] = None
    answer: Optional[str] = None
    category: Optional[str] = None
    sort_order: Optional[int] = None
    is_enabled: Optional[bool] = None

class FAQResponse(BaseModel):
    id: int
    question: str
    answer: str
    category: str
    is_enabled: bool
    sort_order: int

    class Config:
        from_attributes = True

class ChatbotQueryRequest(BaseModel):
    message: str

class ChatbotQueryResponse(BaseModel):
    reply: str
    matched_faq_id: Optional[int] = None
    confidence: float
    suggested_questions: List[str] = []

# --- Website Content & Settings ---

class WebsiteContentUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    content: Optional[Dict[str, Any]] = None
    cta_text: Optional[str] = None
    cta_link: Optional[str] = None
    is_active: Optional[bool] = None

class VerificationSettingsUpdate(BaseModel):
    setting_value: Dict[str, Any]
    description: Optional[str] = None
