from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.models import VerificationResult, BlockchainRecord
from backend.schemas.schemas import PublicVerificationResponse

router = APIRouter(prefix="/api/public", tags=["Public Verification"])

@router.get("/verify/{verification_id}", response_model=PublicVerificationResponse)
def get_public_verification(verification_id: str, db: Session = Depends(get_db)):
    """
    Public-safe verification endpoint.
    Strictly displays non-sensitive cryptographic proof and status without exposing
    private user records, original documents, or internal forensic heatmaps.
    """
    record = db.query(VerificationResult).filter(VerificationResult.id == verification_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Verification ID '{verification_id}' does not exist on this ledger."
        )

    b_record = db.query(BlockchainRecord).filter(BlockchainRecord.verification_id == verification_id).first()
    data = record.result_data or {}
    chain_info = data.get("blockchain", {})

    return PublicVerificationResponse(
        verification_id=record.id,
        status=record.status.value,
        timestamp=record.created_at.isoformat(),
        document_hash=chain_info.get("document_hash") or (b_record.document_hash if b_record else "UNKNOWN"),
        blockchain_confirmation=True if (b_record and b_record.status == "CONFIRMED") else False,
        transaction_id=chain_info.get("transaction_id") or (b_record.transaction_id if b_record else "0x0"),
        block_number=b_record.block_number if b_record else None,
        network=b_record.network if b_record else "EVM-Compatible",
        contract_address=b_record.contract_address if b_record else None
    )
