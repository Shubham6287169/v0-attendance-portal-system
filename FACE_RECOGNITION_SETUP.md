# Python-Based Face Recognition System Setup

This document provides complete setup and deployment instructions for the Python-based face recognition system.

## Architecture Overview

\`\`\`
Frontend (React) 
    ↓ (Captures video frames)
Next.js API Routes 
    ↓ (Forwards base64 images)
Python ML Backend (Flask)
    ↓ (Detects, aligns, encodes faces)
Face Recognition Database
    ↓ (Matches embeddings)
Result back to Frontend
\`\`\`

## Prerequisites

- Python 3.8+
- Node.js 16+ (for Next.js)
- CUDA 11.0+ (optional, for GPU acceleration with deep learning models)

## Python Backend Setup

### 1. Install Python Dependencies

\`\`\`bash
cd python-backend
pip install -r requirements.txt
\`\`\`

### 2. Configure Environment Variables

Create `.env` file in the `python-backend` directory:

\`\`\`env
FLASK_DEBUG=False
FACE_SERVICE_PORT=5000
FACE_SERVICE_HOST=0.0.0.0
FACE_MODEL_TYPE=dlib
FACE_RECOGNITION_THRESHOLD=0.6
MIN_FACE_CONFIDENCE=0.7
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
LOG_LEVEL=INFO
\`\`\`

### 3. Run the Python Service

\`\`\`bash
python face_recognition_service.py
\`\`\`

The service will start on `http://localhost:5000`

## Next.js Backend Setup

### 1. Configure Environment Variables

Add these to your `.env.local` file in the Next.js root directory:

\`\`\`env
PYTHON_FACE_SERVICE_URL=http://localhost:5000
FACE_RECOGNITION_THRESHOLD=0.6
\`\`\`

### 2. Restart Next.js Server

\`\`\`bash
npm run dev
\`\`\`

## API Endpoints

### Health Check
- **Endpoint**: `GET /health`
- **Response**: Service status

### Encode Face (Enrollment)
- **Endpoint**: `POST /api/face/enroll`
- **Body**:
\`\`\`json
{
  "image": "base64_encoded_jpeg_image",
  "studentId": "student_123"
}
\`\`\`
- **Response**:
\`\`\`json
{
  "success": true,
  "embedding": [0.123, 0.456, ...128 values],
  "metadata": {
    "faces_detected": 1,
    "faces_encoded": 1,
    "image_shape": [480, 640, 3]
  }
}
\`\`\`

### Match Faces (Attendance)
- **Endpoint**: `POST /api/face/match`
- **Body**:
\`\`\`json
{
  "enrolledEmbedding": [0.123, 0.456, ...128 values],
  "capturedImage": "base64_encoded_jpeg_image",
  "threshold": 0.6
}
\`\`\`
- **Response**:
\`\`\`json
{
  "success": true,
  "matched": true,
  "confidence": 85.5,
  "distance": 0.342,
  "threshold": 0.6,
  "message": "Face matched successfully"
}
\`\`\`

## Performance Tuning

### Use HOG Model for Speed (Default)
\`\`\`python
face_encoder = FaceEncoder(model="hog")  # Faster, good accuracy
\`\`\`

### Use CNN Model for Accuracy
\`\`\`python
face_encoder = FaceEncoder(model="cnn")  # Slower, best accuracy
\`\`\`

### GPU Acceleration
Install GPU-supported libraries:
\`\`\`bash
pip install tensorflow-gpu
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
\`\`\`

## Production Deployment

### Option 1: Docker Deployment

Create `Dockerfile`:
\`\`\`dockerfile
FROM python:3.10-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 5000

CMD ["python", "face_recognition_service.py"]
\`\`\`

Build and run:
\`\`\`bash
docker build -t face-recognition-service .
docker run -p 5000:5000 -e FLASK_DEBUG=False face-recognition-service
\`\`\`

### Option 2: AWS Deployment

1. Push to ECR
2. Deploy on ECS or Lambda
3. Use API Gateway to expose endpoints

### Option 3: Heroku Deployment

\`\`\`bash
heroku login
heroku create your-app-name
git push heroku main
\`\`\`

## Database Integration (Production)

For production, replace in-memory storage with a real database:

\`\`\`python
from sqlalchemy import create_engine, Column, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

Base = declarative_base()

class FaceEnrollment(Base):
    __tablename__ = "face_enrollments"
    
    studentId = Column(String, primary_key=True)
    embedding = Column(String)  # Store as JSON
    enrolledAt = Column(DateTime)
    enrolledOnce = Column(Boolean)

# Connect to database
engine = create_engine(Config.DATABASE_URL)
Session = sessionmaker(bind=engine)
\`\`\`

## Troubleshooting

### Face Not Detected
- Ensure good lighting
- Position face at least 20cm from camera
- Use HOG model instead of CNN for better detection

### Low Confidence Scores
- Improve lighting
- Reduce camera distance to face
- Adjust FACE_RECOGNITION_THRESHOLD in .env

### Performance Issues
- Use HOG model (faster than CNN)
- Reduce image resolution
- Enable GPU acceleration
- Deploy on multiple instances with load balancing

### Connection Issues
- Verify `PYTHON_FACE_SERVICE_URL` in Next.js .env
- Check firewall rules
- Verify Python service is running on correct port

## Security Considerations

1. **Input Validation**: Always validate base64 images
2. **Rate Limiting**: Add rate limiting to prevent abuse
3. **Authentication**: Add API key authentication to Python service
4. **Data Encryption**: Encrypt face embeddings at rest
5. **Privacy**: Never store raw images, only embeddings
