import os
from pathlib import Path
from typing import List, Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent


def _parse_csv(value: Optional[str]) -> List[str]:
    if not value:
        return []
    return [item.strip() for item in value.split(",") if item.strip()]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="allow",
        case_sensitive=False,
    )

    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5432/document_verification"
    SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    SUPABASE_PROJECT_ID: str = ""
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""

    OWNER_EMAIL: str = "owner@docverify.local"
    OWNER_NAME: str = "System Owner"
    OWNER_INITIAL_PASSWORD: str = "change-me-in-production"

    BLOCKCHAIN_RPC_URL: str = ""
    BLOCKCHAIN_PRIVATE_KEY: str = ""
    CONTRACT_ADDRESS: str = "0x5FbDB2315678afecb367f032d93F642f64180aa3"

    UPLOAD_DIR: Path = BASE_DIR / "backend" / "uploads"
    OCR_ENGINE: str = "rapidocr"
    APP_ENV: str = "development"
    FRONTEND_URL: str = "http://localhost:5173"
    CORS_ALLOWED_ORIGINS: List[str] = Field(
        default_factory=lambda: ["http://localhost:5173", "http://127.0.0.1:5173"]
    )

    @field_validator("CORS_ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_allowed_origins(cls, value):
        if value is None:
            return []
        if isinstance(value, str):
            return _parse_csv(value)
        return value

    @property
    def is_production(self) -> bool:
        return self.APP_ENV.lower() == "production"

    def validate_for_environment(self) -> None:
        if not self.is_production:
            return

        if self.SECRET_KEY in {"", "change-me-in-production", "docverify-super-secret-jwt-key-2026-production"}:
            raise RuntimeError("SECRET_KEY must be set to a secure value in production.")

        if self.OWNER_INITIAL_PASSWORD in {"", "change-me-in-production", "OwnerSecurePass2026!"}:
            raise RuntimeError("OWNER_INITIAL_PASSWORD must be changed before running in production.")

        if not self.FRONTEND_URL:
            raise RuntimeError("FRONTEND_URL must be set in production.")

        if self.DATABASE_URL.startswith("postgresql+psycopg://postgres:postgres@localhost:5432/document_verification") and not os.getenv("DATABASE_URL"):
            # This is a harmless local fallback. Production envs should always set DATABASE_URL explicitly.
            raise RuntimeError("DATABASE_URL must be explicitly configured in production.")

        if not self.CORS_ALLOWED_ORIGINS:
            raise RuntimeError("CORS_ALLOWED_ORIGINS must be configured in production.")


settings = Settings()
settings.validate_for_environment()
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
