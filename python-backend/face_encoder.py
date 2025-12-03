import numpy as np
import cv2
import face_recognition
from typing import Tuple, Optional
import logging

logger = logging.getLogger(__name__)

class FaceEncoder:
    """Encodes faces into 128-dimensional embeddings using face_recognition library"""
    
    def __init__(self, model: str = "dlib"):
        """
        Initialize Face Encoder
        
        Args:
            model: Model to use ("dlib" or "hog" for faster inference)
        """
        self.model = model
        self.embedding_dimension = 128
        logger.info(f"FaceEncoder initialized with model: {model}")
    
    def detect_faces(self, image: np.ndarray) -> list:
        """
        Detect faces in an image
        
        Args:
            image: Input image as numpy array (BGR format from OpenCV)
        
        Returns:
            List of face locations as tuples (top, right, bottom, left)
        """
        try:
            # Convert BGR to RGB for face_recognition
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Detect faces using HOG or CNN
            face_locations = face_recognition.face_locations(rgb_image, model=self.model)
            
            logger.debug(f"Detected {len(face_locations)} faces in image")
            return face_locations
        except Exception as e:
            logger.error(f"Error detecting faces: {str(e)}")
            return []
    
    def align_face(self, image: np.ndarray, face_location: Tuple) -> Optional[np.ndarray]:
        """
        Align face in image
        
        Args:
            image: Input image as numpy array
            face_location: Face location tuple (top, right, bottom, left)
        
        Returns:
            Aligned face image or None if alignment fails
        """
        try:
            top, right, bottom, left = face_location
            # Extract face region with some padding
            face_image = image[max(0, top-10):min(image.shape[0], bottom+10), 
                              max(0, left-10):min(image.shape[1], right+10)]
            return face_image
        except Exception as e:
            logger.error(f"Error aligning face: {str(e)}")
            return None
    
    def encode_face(self, image: np.ndarray, face_location: Tuple) -> Optional[np.ndarray]:
        """
        Generate 128-dimensional embedding for a face
        
        Args:
            image: Input image as numpy array (BGR format)
            face_location: Face location tuple (top, right, bottom, left)
        
        Returns:
            128-dimensional embedding vector or None if encoding fails
        """
        try:
            # Convert BGR to RGB
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Generate face encoding
            encodings = face_recognition.face_encodings(rgb_image, [face_location])
            
            if encodings:
                embedding = encodings[0]
                logger.debug(f"Generated embedding of shape: {embedding.shape}")
                return embedding.tolist()
            else:
                logger.warning("No encodings generated for face")
                return None
        except Exception as e:
            logger.error(f"Error encoding face: {str(e)}")
            return None
    
    def process_image(self, image_data: bytes) -> Tuple[Optional[list], dict]:
        """
        Process image and extract face embeddings
        
        Args:
            image_data: Image data as bytes
        
        Returns:
            Tuple of (embeddings list, metadata dict)
        """
        try:
            # Decode image from bytes
            nparr = np.frombuffer(image_data, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if image is None:
                logger.error("Failed to decode image")
                return None, {"error": "Invalid image format"}
            
            # Detect faces
            face_locations = self.detect_faces(image)
            
            if not face_locations:
                return None, {"error": "No faces detected", "faces_found": 0}
            
            # Encode all faces
            embeddings = []
            for face_location in face_locations:
                embedding = self.encode_face(image, face_location)
                if embedding:
                    embeddings.append(embedding)
            
            metadata = {
                "faces_detected": len(face_locations),
                "faces_encoded": len(embeddings),
                "image_shape": image.shape,
            }
            
            return embeddings[0] if embeddings else None, metadata
        except Exception as e:
            logger.error(f"Error processing image: {str(e)}")
            return None, {"error": str(e)}
    
    def compare_faces(self, embedding1: list, embedding2: list, threshold: float = 0.6) -> dict:
        """
        Compare two face embeddings
        
        Args:
            embedding1: First face embedding
            embedding2: Second face embedding
            threshold: Distance threshold for match
        
        Returns:
            Dictionary with match result and distance
        """
        try:
            emb1 = np.array(embedding1)
            emb2 = np.array(embedding2)
            
            # Calculate Euclidean distance
            distance = np.linalg.norm(emb1 - emb2)
            
            # Convert distance to confidence (0-100)
            confidence = max(0, min(100, 100 * (1 - distance / 2)))
            
            matched = distance <= threshold
            
            return {
                "matched": matched,
                "distance": float(distance),
                "confidence": float(confidence),
                "threshold": threshold,
            }
        except Exception as e:
            logger.error(f"Error comparing faces: {str(e)}")
            return {
                "matched": False,
                "distance": 2.0,
                "confidence": 0,
                "error": str(e),
            }
