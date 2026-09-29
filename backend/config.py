import os
from pydantic_settings import BaseSettings
from typing import Optional
from pathlib import Path
from dotenv import load_dotenv

# Load .env file
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR.parent / ".env")

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg://postgres:postgres@localhost:5432/document_verification"
    )
    SECRET_KEY: str = os.getenv("SECRET_KEY", "docverify-super-secret-jwt-key-2026-production")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    
    # First Owner Setup
    OWNER_EMAIL: str = os.getenv("OWNER_EMAIL", "owner@docverify.local")
    OWNER_NAME: str = os.getenv("OWNER_NAME", "System Owner")
    OWNER_INITIAL_PASSWORD: str = os.getenv("OWNER_INITIAL_PASSWORD", "OwnerSecurePass2026!")

    # Blockchain
    BLOCKCHAIN_RPC_URL: Optional[str] = os.getenv("BLOCKCHAIN_RPC_URL", "")
    BLOCKCHAIN_PRIVATE_KEY: Optional[str] = os.getenv("BLOCKCHAIN_PRIVATE_KEY", "")
    CONTRACT_ADDRESS: str = os.getenv("CONTRACT_ADDRESS", "0x5FbDB2315678afecb367f032d93F642f64180aa3")

    # Storage & Processing
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    OCR_ENGINE: str = os.getenv("OCR_ENGINE", "tesseract")
    APP_ENV: str = os.getenv("APP_ENV", "development")

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
