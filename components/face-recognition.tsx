"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getFaceDescriptor, matchFace, isFaceMatchValid } from "@/lib/face-recognition-utils"

interface FaceRecognitionProps {
  onFaceDetected: (confidence: number) => void
  isActive: boolean
  studentId?: string
}

export function FaceRecognition({ onFaceDetected, isActive, studentId }: FaceRecognitionProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [faceDetected, setFaceDetected] = useState(false)
  const [confidence, setConfidence] = useState<number | null>(null)
  const [isMatching, setIsMatching] = useState(false)
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!isActive) {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current)
      }
      return
    }

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        })

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play()
            detectAndMatchFace()
          }
        }
      } catch (err) {
        setError("Unable to access camera. Please check permissions.")
        console.log("[v0] Camera error:", err)
      }
    }

    startCamera()

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current)
      }
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach((track) => track.stop())
      }
    }
  }, [isActive])

  const detectAndMatchFace = () => {
    if (!videoRef.current || !canvasRef.current || !isActive) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    if (!ctx) return

    try {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0)

      // Simulate face detection and descriptor generation
      // In production, use face-api.js or TensorFlow.js with face_recognition.js
      const capturedDescriptor = Array.from({ length: 128 }, () => Math.random() * 2 - 1)

      setIsMatching(true)

      // Get enrolled face descriptor
      if (studentId) {
        const enrolledFace = getFaceDescriptor(studentId)

        if (enrolledFace) {
          // Match captured face with enrolled face
          const matchConfidence = matchFace(capturedDescriptor, enrolledFace.descriptor)
          const isValid = isFaceMatchValid(matchConfidence)

          console.log("[v0] Face match result:", { matchConfidence, isValid, studentId })

          setConfidence(Math.round(matchConfidence))
          setFaceDetected(isValid)
          onFaceDetected(Math.round(matchConfidence))
        } else {
          // No enrolled face found
          setError("Face not enrolled. Please enroll your face first.")
          setFaceDetected(false)
          onFaceDetected(0)
        }
      } else {
        // Fallback: just use simulated confidence
        const simulatedConfidence = Math.floor(Math.random() * (99 - 75 + 1)) + 75
        setConfidence(simulatedConfidence)
        setFaceDetected(true)
        onFaceDetected(simulatedConfidence)
      }

      setIsMatching(false)
    } catch (err) {
      console.log("[v0] Face detection error:", err)
      setError("Error detecting face")
    }

    detectionIntervalRef.current = setTimeout(detectAndMatchFace, 1000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Face Recognition
        </CardTitle>
        <CardDescription>Capture your face for attendance verification</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="relative bg-muted rounded-lg overflow-hidden aspect-video border-2 border-border">
          <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
          <canvas ref={canvasRef} className="hidden" />

          {faceDetected && confidence && (
            <div className="absolute top-4 right-4 bg-accent/90 text-accent-foreground px-3 py-2 rounded-lg text-sm font-medium">
              Match: {confidence}%
            </div>
          )}

          {isMatching && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}
        </div>

        {confidence !== null && (
          <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
            <p className="text-sm text-muted-foreground">Face Match Confidence</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 bg-border rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${confidence >= 70 ? "bg-accent" : "bg-destructive"}`}
                  style={{ width: `${confidence}%` }}
                />
              </div>
              <span className={`text-lg font-bold ${confidence >= 70 ? "text-accent" : "text-destructive"}`}>
                {confidence}%
              </span>
            </div>
            {confidence < 70 && (
              <p className="text-xs text-destructive mt-2">
                Face match below threshold. Please try again with better lighting.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
