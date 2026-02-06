from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "sqlite:///./foodnova.db"
    
    # JWT
    JWT_SECRET: str = "change_this_secret_in_production"
    JWT_ACCESS_EXPIRES_MIN: int = 30
    JWT_REFRESH_EXPIRES_DAYS: int = 7
    JWT_ALGORITHM: str = "HS256"
    
    # Admin
    ADMIN_EMAIL: str = "admin@foodnova.com"
    ADMIN_PASSWORD: str = "Admin123!"
    
    # CORS
    FRONTEND_ORIGIN: str = "*"
    
    # Uploads
    UPLOAD_DRIVER: str = "local"
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_MB: int = 10
    
    # Africa's Talking SMS
    AT_USERNAME: str = ""
    AT_API_KEY: str = ""
    
    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
