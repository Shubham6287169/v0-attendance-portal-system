"use client"

import { useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Camera, CheckCircle, AlertCircle } from "lucide-react"

interface FaceEnrollmentProps {
  studentId: string
  onEnrollmentComplete: () => void
}

export function FaceEnrollment({ studentId, onEnrollmentComplete }: FaceEnrollmentProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [message, setMessage] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const startEnrollment = async () => {
    setIsEnrolling(true)
    setError(null)
    setSuccess(false)
    setMessage("Starting camera...")

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch((err) => {
            console.log("[v0] Play error:", err)
            setError("Failed to start video")
          })
          setMessage("Position your face in the center. Keep good lighting. Click 'Capture & Enroll' when ready.")
        }
      }
    } catch (err) {
      setError("Unable to access camera. Please check permissions.")
      setIsEnrolling(false)
      console.log("[v0] Camera error:", err)
    }
  }

  const captureAndEnroll = async () => {
    if (!videoRef.current || !canvasRef.current) {
      setError("Camera or canvas reference not available")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const canvas = canvasRef.current
      const video = videoRef.current
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        throw new Error("Failed to get canvas context")
      }

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      console.log("[v0] Canvas dimensions:", canvas.width, "x", canvas.height)

      ctx.drawImage(video, 0, 0)
      const imageBase64 = canvas.toDataURL("image/jpeg", 0.9).split(",")[1]

      const response = await fetch("/api/face/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          imageData: imageBase64,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Enrollment failed")
      }

      console.log("[v0] Face enrollment successful:", result)

      setMessage("Face enrolled successfully!")
      setSuccess(true)

      // Stop camera
      if (video.srcObject) {
        const tracks = (video.srcObject as MediaStream).getTracks()
        tracks.forEach((track) => track.stop())
      }

      setTimeout(() => {
        setIsEnrolling(false)
        onEnrollmentComplete()
      }, 2000)
    } catch (err) {
      console.log("[v0] Capture error:", err)
      setError(err instanceof Error ? err.message : "Failed to capture and enroll face")
    } finally {
      setIsSubmitting(false)
    }
  }

  const stopEnrollment = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
    }
    setIsEnrolling(false)
    setMessage("")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Face Enrollment
        </CardTitle>
        <CardDescription>Register your face for attendance verification</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {isEnrolling && !success && (
          <div className="space-y-4">
            <div className="relative bg-muted rounded-lg overflow-hidden aspect-video border-2 border-border">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <p className="text-sm text-muted-foreground text-center">{message}</p>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={captureAndEnroll} disabled={isSubmitting} className="w-full" size="lg">
                <Camera className="w-4 h-4 mr-2" />
                {isSubmitting ? "Enrolling..." : "Capture & Enroll"}
              </Button>
              <Button
                onClick={stopEnrollment}
                variant="outline"
                className="w-full bg-transparent"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {!isEnrolling && !success && (
          <Button onClick={startEnrollment} className="w-full" size="lg">
            <Camera className="w-4 h-4 mr-2" />
            Start Face Enrollment
          </Button>
        )}

        {success && (
          <Button onClick={() => setSuccess(false)} className="w-full" size="lg">
            Done
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
