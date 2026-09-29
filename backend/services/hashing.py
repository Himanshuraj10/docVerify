import hashlib
from pathlib import Path

class DocumentHashingService:
    @staticmethod
    def calculate_file_hash(file_path: str) -> str:
        """Calculates canonical SHA-256 hash of a file on disk."""
        sha256 = hashlib.sha256()
        with open(file_path, "rb") as f:
            while chunk := f.read(65536):
                sha256.update(chunk)
        return sha256.hexdigest().upper()

    @staticmethod
    def calculate_bytes_hash(data: bytes) -> str:
        """Calculates canonical SHA-256 hash of binary data."""
        return hashlib.sha256(data).hexdigest().upper()
