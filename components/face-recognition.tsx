"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

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
  const [instructionMessage, setInstructionMessage] = useState<string>("")

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
            setInstructionMessage("Position your face clearly in center. Ensure good lighting.")
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

    if (!studentId) {
      setError("Student ID not found")
      return
    }

    setIsCapturing(true)
    setError(null)

    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        throw new Error("Failed to access canvas context")
      }

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      console.log("[v0] Capturing face - Canvas:", canvas.width, "x", canvas.height)

      ctx.drawImage(video, 0, 0)
      const dataURL = canvas.toDataURL("image/jpeg", 0.95)

      if (!dataURL || dataURL.length < 100) {
        throw new Error("Failed to capture image data")
      }

      const imageBase64 = dataURL.split(",")[1]

      if (!imageBase64 || imageBase64.length < 100) {
        console.error("[v0] Base64 extraction failed - length:", imageBase64?.length)
        throw new Error("Image conversion failed")
      }

      console.log("[v0] Image captured and converted to base64 - length:", imageBase64.length)

      setInstructionMessage("Processing face...")

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 35000) // 35 second timeout

      try {
        const response = await fetch("/api/face/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId,
            imageData: imageBase64,
          }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        console.log("[v0] Face match response status:", response.status)

        if (!response.ok) {
          const result = await response.json()
          console.error("[v0] Face match API error:", result)
          throw new Error(result.error || result.message || `API error: ${response.status}`)
        }

        const result = await response.json()

        console.log("[v0] Face match result:", result)
        console.log("[v0] Using recognition source:", result.source)

        const matchConfidence = result.confidence
        const isValid = result.matched

        setConfidence(matchConfidence)
        setFaceDetected(isValid)
        onFaceDetected(matchConfidence)

        if (!isValid) {
          setError(`${result.message}`)
          setInstructionMessage("Try again with better lighting and clearer positioning.")
        } else {
          setInstructionMessage("✓ Face matched successfully!")
        }

        if (result.warning) {
          console.warn("[v0] Backend warning:", result.warning)
        }
      } catch (err) {
        clearTimeout(timeoutId)

        if (err instanceof Error && err.name === "AbortError") {
          console.error("[v0] Face matching timeout after 35 seconds")
          setError("Face recognition is taking too long. Please check your connection and try again.")
          setInstructionMessage("Timeout. Ensure Python backend is running or try fallback mode.")
        } else {
          console.error("[v0] Fetch error:", err)
          const errorMsg = err instanceof Error ? err.message : "Network error"
          setError(`Failed to process face: ${errorMsg}. Please try again.`)
          setInstructionMessage("Connection error. Check your internet and try again.")
        }
      }
    } catch (err) {
      console.error("[v0] Face capture error:", err)
      setError(err instanceof Error ? err.message : "Error capturing face. Please try again.")
      setInstructionMessage("Capture failed. Please try again.")
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

          {faceDetected && confidence !== null && (
            <div className="absolute top-4 right-4 bg-accent/90 text-accent-foreground px-3 py-2 rounded-lg text-sm font-medium">
              ✓ Match: {confidence}%
            </div>
          )}

          {isCapturing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}

          {instructionMessage && (
            <div className="absolute bottom-4 left-4 right-4 bg-black/60 text-white px-3 py-2 rounded-lg text-sm text-center">
              {instructionMessage}
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
                Below 70% threshold. Try again with better lighting and positioning.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
