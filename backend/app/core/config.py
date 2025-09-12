#!/usr/bin/env python3
"""
Configuration settings for IntelliLab GC API
"""

from pydantic import BaseModel
from typing import Optional, List
import os


class Settings(BaseModel):
    """Application settings"""
    
    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "IntelliLab GC API"
    
    # CORS - Enhanced for better frontend compatibility
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "*"  # Allow all origins in development
    ]
    
    # Database - Fixed local storage for persistence
    DATABASE_URL: str = "sqlite:///./intellilab_gc.db"
    
    @classmethod
    def get_data_dir(cls) -> str:
        """Get platform-specific data directory"""
        import platform
        from pathlib import Path
        import os
        
        system = platform.system()
        if system == "Windows":
            data_dir = Path("C:/IntelliLab_GC/Data")
        else:  # macOS/Linux
            data_dir = Path.home() / "IntelliLab_GC" / "Data"
        
        # Create directory if it doesn't exist
        data_dir.mkdir(parents=True, exist_ok=True)
        return str(data_dir)
    
    @classmethod 
    def get_database_path(cls) -> str:
        """Get full database path"""
        from pathlib import Path
        return str(Path(cls.get_data_dir()) / "intellilab.db")
    
    @classmethod
    def get_backup_dir(cls) -> str:
        """Get backup directory path"""
        from pathlib import Path
        backup_dir = Path(cls.get_data_dir()) / "backups"
        backup_dir.mkdir(parents=True, exist_ok=True)
        return str(backup_dir)
    
    # File Storage
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    
    # Security
    SECRET_KEY: str = "your-secret-key-here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "logs/intellilab_gc.log"
    
    # Scientific Computing
    CALCULATION_TIMEOUT: int = 30  # seconds
    MAX_CALCULATION_ITERATIONS: int = 1000
    
    # WebSocket
    WEBSOCKET_PING_INTERVAL: int = 20
    WEBSOCKET_PING_TIMEOUT: int = 20
    
    # WebSocket Message Queue
    WS_MESSAGE_QUEUE_SIZE: int = 100
    
    # AI Configuration
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4"
    AI_TEMPERATURE: float = 0.7
    AI_MAX_TOKENS: int = 2000
    
    # Predictive Maintenance
    MAINTENANCE_MODEL_PATH: str = "models/maintenance_predictor.joblib"
    MAINTENANCE_THRESHOLD: float = 0.8
    
    # Chromatogram Analysis
    PEAK_DETECTION_SENSITIVITY: float = 0.1
    BASELINE_CORRECTION: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Create settings instance
settings = Settings()

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs("logs", exist_ok=True) 