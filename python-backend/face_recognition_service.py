from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import logging
import sys
from face_encoder import FaceEncoder
from config import Config

# Setup detailed logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('face_recognition.log')
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, origins=Config.CORS_ORIGINS.split(','))

# Initialize face encoder
face_encoder = FaceEncoder(model="hog")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    logger.info("Health check requested")
    return jsonify({
        "status": "healthy",
        "service": "face-recognition-service",
        "version": "1.0.0"
    }), 200

@app.route('/api/face/encode', methods=['POST'])
def encode_face():
    """Encode a face image into 128-dimensional embedding"""
    try:
        data = request.get_json()
        logger.info("Encode request received")
        
        if not data or 'image' not in data:
            logger.error("Missing 'image' field in request")
            return jsonify({"error": "Missing 'image' field"}), 400
        
        image_base64 = data['image']
        logger.debug(f"Base64 image length: {len(image_base64)}")
        
        if len(image_base64) < 100:
            logger.error(f"Base64 data too short: {len(image_base64)} bytes")
            return jsonify({"error": "Base64 data incomplete or corrupted"}), 400
        
        missing_padding = len(image_base64) % 4
        if missing_padding:
            image_base64 += '=' * (4 - missing_padding)
        
        try:
            image_bytes = base64.b64decode(image_base64)
            logger.debug(f"Successfully decoded {len(image_bytes)} bytes from Base64")
        except Exception as e:
            logger.error(f"Failed to decode Base64: {str(e)}")
            return jsonify({"error": f"Failed to decode image: {str(e)}"}), 400
        
        # Process image and extract embedding
        embedding, metadata = face_encoder.process_image(image_bytes)
        logger.info(f"Face processing result: {metadata}")
        
        if embedding is None:
            logger.error(f"Failed to encode face: {metadata.get('error')}")
            return jsonify({
                "success": False,
                "error": metadata.get("error", "Failed to encode face"),
                "metadata": metadata
            }), 400
        
        logger.info("Face encoded successfully")
        return jsonify({
            "success": True,
            "embedding": embedding,
            "metadata": metadata
        }), 200
    
    except Exception as e:
        logger.error(f"Error in encode_face endpoint: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500

@app.route('/api/face/match', methods=['POST'])
def match_faces():
    """Compare two face embeddings"""
    try:
        data = request.get_json()
        logger.info("Match request received")
        
        if not data or 'enrolledEmbedding' not in data or 'capturedImage' not in data:
            logger.error("Missing required fields")
            return jsonify({"error": "Missing required fields: enrolledEmbedding, capturedImage"}), 400
        
        enrolled_embedding = data['enrolledEmbedding']
        threshold = data.get('threshold', Config.FACE_RECOGNITION_THRESHOLD)
        
        logger.debug(f"Enrolled embedding type: {type(enrolled_embedding)}, length: {len(enrolled_embedding) if isinstance(enrolled_embedding, list) else 'N/A'}")
        
        # Validate enrolled embedding
        if not isinstance(enrolled_embedding, list) or len(enrolled_embedding) != 128:
            logger.error(f"Invalid enrolled embedding dimension: {len(enrolled_embedding) if isinstance(enrolled_embedding, list) else 'not a list'}")
            return jsonify({"error": "Invalid enrolled embedding dimension"}), 400
        
        image_base64 = data['capturedImage']
        logger.debug(f"Captured image Base64 length: {len(image_base64)}")
        
        if len(image_base64) < 100:
            logger.error(f"Base64 data too short: {len(image_base64)} bytes")
            return jsonify({"error": "Base64 data incomplete"}), 400
        
        missing_padding = len(image_base64) % 4
        if missing_padding:
            image_base64 += '=' * (4 - missing_padding)
        
        try:
            image_bytes = base64.b64decode(image_base64)
            logger.debug(f"Successfully decoded {len(image_bytes)} bytes from captured image")
        except Exception as e:
            logger.error(f"Failed to decode captured image: {str(e)}")
            return jsonify({"error": f"Failed to decode image: {str(e)}"}), 400
        
        # Extract embedding from captured image
        captured_embedding, metadata = face_encoder.process_image(image_bytes)
        logger.info(f"Captured image processing result: {metadata}")
        
        if metadata.get('faces_found', 0) == 0 or metadata.get('faces_detected', 0) == 0:
            logger.error("No faces detected in captured image")
            return jsonify({
                "success": False,
                "matched": False,
                "confidence": 0,
                "error": "No faces detected in image. Please position your face clearly in frame.",
                "metadata": metadata
            }), 400
        
        if captured_embedding is None:
            logger.error(f"Failed to extract embedding from captured image: {metadata.get('error')}")
            return jsonify({
                "success": False,
                "matched": False,
                "confidence": 0,
                "error": metadata.get("error", "Failed to detect face in captured image"),
                "metadata": metadata
            }), 400
        
        # Compare embeddings
        comparison = face_encoder.compare_faces(enrolled_embedding, captured_embedding, threshold)
        logger.info(f"Face comparison result - Distance: {comparison['distance']}, Confidence: {comparison['confidence']}, Matched: {comparison['matched']}")
        
        confidence_percentage = comparison['confidence']
        is_matched = comparison['matched'] and confidence_percentage >= (Config.MIN_CONFIDENCE * 100)
        
        logger.info(f"Final match result: {is_matched} (confidence: {confidence_percentage}%)")
        
        return jsonify({
            "success": True,
            "matched": is_matched,
            "confidence": round(confidence_percentage, 2),
            "distance": round(comparison['distance'], 4),
            "threshold": threshold,
            "message": "Face matched successfully" if is_matched else f"Face confidence {round(confidence_percentage, 1)}% below threshold"
        }), 200
    
    except Exception as e:
        logger.error(f"Error in match_faces endpoint: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500

@app.route('/api/face/enroll', methods=['POST'])
def enroll_face():
    """Enroll a new face from image"""
    try:
        data = request.get_json()
        logger.info("Enrollment request received")
        
        if not data or 'image' not in data or 'studentId' not in data:
            logger.error("Missing required fields for enrollment")
            return jsonify({"error": "Missing required fields: image, studentId"}), 400
        
        image_base64 = data['image']
        student_id = data['studentId']
        logger.debug(f"Enrolling student: {student_id}, Base64 length: {len(image_base64)}")
        
        if len(image_base64) < 100:
            logger.error(f"Enrollment Base64 too short: {len(image_base64)}")
            return jsonify({"error": "Base64 data incomplete"}), 400
        
        missing_padding = len(image_base64) % 4
        if missing_padding:
            image_base64 += '=' * (4 - missing_padding)
        
        try:
            image_bytes = base64.b64decode(image_base64)
            logger.debug(f"Decoded enrollment image: {len(image_bytes)} bytes")
        except Exception as e:
            logger.error(f"Failed to decode enrollment image: {str(e)}")
            return jsonify({"error": f"Failed to decode image: {str(e)}"}), 400
        
        # Process image and extract embedding
        embedding, metadata = face_encoder.process_image(image_bytes)
        logger.info(f"Enrollment face processing: {metadata}")
        
        if embedding is None:
            logger.error(f"Failed to detect face for enrollment: {metadata.get('error')}")
            return jsonify({
                "success": False,
                "error": metadata.get("error", "Failed to detect face"),
                "metadata": metadata
            }), 400
        
        logger.info(f"Successfully enrolled student {student_id}")
        return jsonify({
            "success": True,
            "message": "Face enrolled successfully",
            "studentId": student_id,
            "embedding": embedding,
            "metadata": metadata
        }), 200
    
    except Exception as e:
        logger.error(f"Error in enroll_face endpoint: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    logger.info(f"Starting Face Recognition Service on {Config.HOST}:{Config.PORT}")
    logger.info(f"CORS Origins: {Config.CORS_ORIGINS}")
    app.run(host=Config.HOST, port=Config.PORT, debug=Config.DEBUG, threaded=True)
