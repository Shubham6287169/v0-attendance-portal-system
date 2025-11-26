"use client"

import { useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Camera, CheckCircle, AlertCircle } from "lucide-react"
import { storeFaceDescriptor, generateDescriptorFromPixels } from "@/lib/face-recognition-utils"

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

  const startEnrollment = async () => {
    setIsEnrolling(true)
    setError(null)
    setSuccess(false)
    setMessage("Starting camera...")

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
          setMessage("Position your face in the center and keep it steady...")
          setTimeout(() => captureAndEnroll(), 2000)
        }
      }
    } catch (err) {
      setError("Unable to access camera. Please check permissions.")
      setIsEnrolling(false)
      console.log("[v0] Camera error:", err)
    }
  }

  const captureAndEnroll = async () => {
    if (!videoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const video = videoRef.current
    const ctx = canvas.getContext("2d")

    if (!ctx) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)

    // Get actual pixel data from canvas
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const descriptor = generateDescriptorFromPixels(imageData.data, canvas.width, canvas.height)

    console.log("[v0] Face enrolled with descriptor length:", descriptor.length)

    // Store the face descriptor
    storeFaceDescriptor(studentId, descriptor)

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
            <Button onClick={stopEnrollment} variant="outline" className="w-full bg-transparent">
              Cancel
            </Button>
          </div>
        )}

        {!isEnrolling && !success && (
          <Button onClick={startEnrollment} className="w-full">
            <Camera className="w-4 h-4 mr-2" />
            Start Face Enrollment
          </Button>
        )}

        {success && (
          <Button onClick={() => setSuccess(false)} className="w-full">
            Done
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
