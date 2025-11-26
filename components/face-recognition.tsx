"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
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
  const [isCapturing, setIsCapturing] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)

  useEffect(() => {
    if (!isActive) {
      return
    }

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        })

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch((err) => {
              console.log("[v0] Play error:", err)
              setError("Failed to start video stream")
            })
            setCameraReady(true)
          }
        }
      } catch (err) {
        setError("Unable to access camera. Please check permissions.")
        console.log("[v0] Camera error:", err)
        setCameraReady(false)
      }
    }

    startCamera()

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach((track) => track.stop())
      }
      setCameraReady(false)
    }
  }, [isActive])

  const handleCaptureFace = async () => {
    if (!videoRef.current || !canvasRef.current || !cameraReady) {
      setError("Camera is not ready. Please wait and try again.")
      return
    }

    setIsCapturing(true)
    setError(null)

    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        setError("Failed to access canvas context")
        return
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0)

      // Create a stable descriptor from the captured frame
      // Using a deterministic approach based on the image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      // Generate descriptor from pixel data (simplified face encoding)
      const descriptor: number[] = []
      const samplingRate = Math.max(1, Math.floor(data.length / 128))

      for (let i = 0; i < 128; i++) {
        const pixelIndex = (i * samplingRate) % data.length
        // Normalize pixel values to -1 to 1 range
        descriptor.push((data[pixelIndex] / 255) * 2 - 1)
      }

      console.log("[v0] Face captured - descriptor generated")

      // Get enrolled face descriptor
      if (studentId) {
        const enrolledFace = getFaceDescriptor(studentId)

        if (enrolledFace) {
          // Match captured face with enrolled face
          const matchConfidence = matchFace(descriptor, enrolledFace.descriptor)
          const isValid = isFaceMatchValid(matchConfidence)

          console.log("[v0] Face match result:", { matchConfidence, isValid, studentId })

          setConfidence(Math.round(matchConfidence))
          setFaceDetected(isValid)
          onFaceDetected(Math.round(matchConfidence))

          if (!isValid) {
            setError(`Face match confidence ${Math.round(matchConfidence)}% is below threshold. Please try again.`)
          }
        } else {
          setError("Face not enrolled. Please enroll your face first.")
          setFaceDetected(false)
          onFaceDetected(0)
        }
      } else {
        setError("Student ID not found")
        onFaceDetected(0)
      }
    } catch (err) {
      console.log("[v0] Face capture error:", err)
      setError("Error capturing face. Please try again.")
    } finally {
      setIsCapturing(false)
    }
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
              ✓ Match: {confidence}%
            </div>
          )}

          {isCapturing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}
        </div>

        <Button onClick={handleCaptureFace} disabled={!cameraReady || isCapturing} className="w-full" size="lg">
          <Camera className="w-4 h-4 mr-2" />
          {isCapturing ? "Capturing..." : "Capture Face"}
        </Button>

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
                Face match below 70% threshold. Please try again with better lighting and angle.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
