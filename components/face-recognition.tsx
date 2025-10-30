"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface FaceRecognitionProps {
  onFaceDetected: (confidence: number) => void
  isActive: boolean
}

export function FaceRecognition({ onFaceDetected, isActive }: FaceRecognitionProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [faceDetected, setFaceDetected] = useState(false)
  const [confidence, setConfidence] = useState<number | null>(null)

  useEffect(() => {
    if (!isActive) return

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        })

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play()
            detectFace()
          }
        }
      } catch (err) {
        setError("Unable to access camera. Please check permissions.")
      }
    }

    startCamera()

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach((track) => track.stop())
      }
    }
  }, [isActive])

  const detectFace = () => {
    if (!videoRef.current || !canvasRef.current || !isActive) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    if (!ctx) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    ctx.drawImage(video, 0, 0)

    // Simulate face detection with random confidence
    // In production, use face-api.js or TensorFlow.js
    const simulatedConfidence = Math.floor(Math.random() * (99 - 75 + 1)) + 75
    setConfidence(simulatedConfidence)
    setFaceDetected(true)
    onFaceDetected(simulatedConfidence)

    // Continue detection loop
    setTimeout(detectFace, 500)
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
              Face: {confidence}%
            </div>
          )}
        </div>

        {confidence && (
          <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
            <p className="text-sm text-muted-foreground">Detection Confidence</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 bg-border rounded-full h-2">
                <div className="bg-accent h-2 rounded-full transition-all" style={{ width: `${confidence}%` }} />
              </div>
              <span className="text-lg font-bold text-accent">{confidence}%</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
