import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Face Recognition Service Configuration"""
    
    # Flask Configuration
    DEBUG = os.getenv("FLASK_DEBUG", "False") == "True"
    PORT = int(os.getenv("FACE_SERVICE_PORT", 5000))
    HOST = os.getenv("FACE_SERVICE_HOST", "0.0.0.0")
    
    # Face Recognition Configuration
    MODEL_TYPE = os.getenv("FACE_MODEL_TYPE", "dlib")  # dlib or mtcnn
    FACE_RECOGNITION_THRESHOLD = float(os.getenv("FACE_RECOGNITION_THRESHOLD", 0.6))
    MIN_CONFIDENCE = float(os.getenv("MIN_FACE_CONFIDENCE", 0.7))
    
    # Database Configuration (optional for storing embeddings)
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///face_embeddings.db")
    
    # CORS Configuration
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:3001")
    
    # Logging Configuration
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    
    # Performance Configuration
    MAX_WORKERS = int(os.getenv("MAX_WORKERS", 4))
    BATCH_SIZE = int(os.getenv("BATCH_SIZE", 32))
