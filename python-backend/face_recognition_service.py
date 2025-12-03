from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import logging
import sys
from face_encoder import FaceEncoder
from config import Config

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, origins=Config.CORS_ORIGINS.split(','))

# Initialize face encoder
face_encoder = FaceEncoder(model="hog")  # Use HOG for faster inference, "cnn" for better accuracy

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "face-recognition-service",
        "version": "1.0.0"
    }), 200

@app.route('/api/face/encode', methods=['POST'])
def encode_face():
    """
    Encode a face image into 128-dimensional embedding
    
    Expected JSON:
    {
        "image": "base64_encoded_image_data",
        "imageFormat": "jpeg" (optional, default: jpeg)
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({"error": "Missing 'image' field"}), 400
        
        # Decode base64 image
        image_base64 = data['image']
        try:
            image_bytes = base64.b64decode(image_base64)
        except Exception as e:
            return jsonify({"error": f"Failed to decode image: {str(e)}"}), 400
        
        # Process image and extract embedding
        embedding, metadata = face_encoder.process_image(image_bytes)
        
        if embedding is None:
            return jsonify({
                "success": False,
                "error": metadata.get("error", "Failed to encode face"),
                "metadata": metadata
            }), 400
        
        return jsonify({
            "success": True,
            "embedding": embedding,
            "metadata": metadata
        }), 200
    
    except Exception as e:
        logger.error(f"Error in encode_face endpoint: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/face/match', methods=['POST'])
def match_faces():
    """
    Compare two face embeddings
    
    Expected JSON:
    {
        "enrolledEmbedding": [list of 128 floats],
        "capturedImage": "base64_encoded_image_data",
        "threshold": 0.6 (optional, default: 0.6)
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'enrolledEmbedding' not in data or 'capturedImage' not in data:
            return jsonify({"error": "Missing required fields: enrolledEmbedding, capturedImage"}), 400
        
        enrolled_embedding = data['enrolledEmbedding']
        threshold = data.get('threshold', Config.FACE_RECOGNITION_THRESHOLD)
        
        # Validate enrolled embedding
        if not isinstance(enrolled_embedding, list) or len(enrolled_embedding) != 128:
            return jsonify({"error": "Invalid enrolled embedding dimension"}), 400
        
        # Decode and process captured image
        image_base64 = data['capturedImage']
        try:
            image_bytes = base64.b64decode(image_base64)
        except Exception as e:
            return jsonify({"error": f"Failed to decode image: {str(e)}"}), 400
        
        # Extract embedding from captured image
        captured_embedding, metadata = face_encoder.process_image(image_bytes)
        
        if captured_embedding is None:
            return jsonify({
                "success": False,
                "matched": False,
                "confidence": 0,
                "error": metadata.get("error", "Failed to detect face in captured image"),
                "metadata": metadata
            }), 400
        
        # Compare embeddings
        comparison = face_encoder.compare_faces(enrolled_embedding, captured_embedding, threshold)
        
        # Calculate confidence as percentage
        confidence_percentage = comparison['confidence']
        is_matched = comparison['matched'] and confidence_percentage >= (Config.MIN_CONFIDENCE * 100)
        
        return jsonify({
            "success": True,
            "matched": is_matched,
            "confidence": round(confidence_percentage, 2),
            "distance": round(comparison['distance'], 4),
            "threshold": threshold,
            "message": "Face matched successfully" if is_matched else f"Face confidence {round(confidence_percentage, 1)}% below threshold"
        }), 200
    
    except Exception as e:
        logger.error(f"Error in match_faces endpoint: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/face/enroll', methods=['POST'])
def enroll_face():
    """
    Enroll a new face from image
    
    Expected JSON:
    {
        "image": "base64_encoded_image_data",
        "studentId": "student_id_string"
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'image' not in data or 'studentId' not in data:
            return jsonify({"error": "Missing required fields: image, studentId"}), 400
        
        image_base64 = data['image']
        student_id = data['studentId']
        
        # Decode base64 image
        try:
            image_bytes = base64.b64decode(image_base64)
        except Exception as e:
            return jsonify({"error": f"Failed to decode image: {str(e)}"}), 400
        
        # Process image and extract embedding
        embedding, metadata = face_encoder.process_image(image_bytes)
        
        if embedding is None:
            return jsonify({
                "success": False,
                "error": metadata.get("error", "Failed to detect face"),
                "metadata": metadata
            }), 400
        
        return jsonify({
            "success": True,
            "message": "Face enrolled successfully",
            "studentId": student_id,
            "embedding": embedding,
            "metadata": metadata
        }), 200
    
    except Exception as e:
        logger.error(f"Error in enroll_face endpoint: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    logger.info(f"Starting Face Recognition Service on {Config.HOST}:{Config.PORT}")
    app.run(host=Config.HOST, port=Config.PORT, debug=Config.DEBUG)
