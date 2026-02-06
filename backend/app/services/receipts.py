import os
import uuid
from pathlib import Path
from fastapi import UploadFile, HTTPException
from ..core.config import settings


ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".pdf"}
MAX_SIZE_BYTES = settings.MAX_UPLOAD_MB * 1024 * 1024


class StorageDriver:
    """Abstract storage driver for receipts"""
    
    def save(self, file: UploadFile, filename: str) -> str:
        raise NotImplementedError
    
    def delete(self, file_key: str) -> bool:
        raise NotImplementedError
    
    def get_url(self, file_key: str) -> str:
        raise NotImplementedError


class LocalStorageDriver(StorageDriver):
    """Local filesystem storage driver"""
    
    def __init__(self, upload_dir: str):
        self.upload_dir = Path(upload_dir)
        self.upload_dir.mkdir(parents=True, exist_ok=True)
    
    def save(self, file_content: bytes, filename: str) -> str:
        file_path = self.upload_dir / filename
        with open(file_path, "wb") as f:
            f.write(file_content)
        return filename
    
    def delete(self, file_key: str) -> bool:
        file_path = self.upload_dir / file_key
        if file_path.exists():
            file_path.unlink()
            return True
        return False
    
    def get_url(self, file_key: str, base_url: str = "") -> str:
        return f"{base_url}/api/uploads/{file_key}"


def get_storage_driver() -> StorageDriver:
    """Get the configured storage driver"""
    if settings.UPLOAD_DRIVER == "local":
        return LocalStorageDriver(settings.UPLOAD_DIR)
    # Add S3 driver here in future
    return LocalStorageDriver(settings.UPLOAD_DIR)


async def save_receipt_file(file: UploadFile, base_url: str = "") -> tuple[str, str]:
    """
    Save uploaded receipt file
    Returns: (file_url, file_key)
    """
    # Validate extension
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Read and validate size
    content = await file.read()
    if len(content) > MAX_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {settings.MAX_UPLOAD_MB}MB"
        )
    
    # Generate unique filename
    unique_id = str(uuid.uuid4())
    filename = f"{unique_id}{ext}"
    
    # Save file
    driver = get_storage_driver()
    file_key = driver.save(content, filename)
    file_url = driver.get_url(file_key, base_url)
    
    return file_url, file_key
