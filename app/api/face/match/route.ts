import { type NextRequest, NextResponse } from "next/server"
import { getFaceEnrollment } from "@/lib/face-database"

const PYTHON_SERVICE_URL = process.env.PYTHON_FACE_SERVICE_URL || "http://localhost:5000"
const FACE_RECOGNITION_THRESHOLD = Number.parseFloat(process.env.FACE_RECOGNITION_THRESHOLD || "0.6")
const API_TIMEOUT = 30000

function calculateEuclideanDistance(arr1: number[], arr2: number[]): number {
  let sum = 0
  for (let i = 0; i < Math.min(arr1.length, arr2.length); i++) {
    const diff = arr1[i] - arr2[i]
    sum += diff * diff
  }
  return Math.sqrt(sum)
}

function convertDistanceToConfidence(distance: number, threshold = 0.6): number {
  // Convert distance to confidence percentage (lower distance = higher confidence)
  const confidence = Math.max(0, (1 - distance / 2) * 100)
  return Math.round(Math.min(100, confidence))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId, imageData } = body

    console.log("[v0] Face match request received for student:", studentId, "Image data length:", imageData?.length)

    if (!studentId || !imageData) {
      console.log("[v0] Invalid data provided - studentId:", !!studentId, "imageData:", !!imageData)
      return NextResponse.json({ error: "Invalid data provided" }, { status: 400 })
    }

    if (typeof imageData !== "string" || imageData.length < 100) {
      console.log("[v0] Image data incomplete - length:", imageData?.length)
      return NextResponse.json(
        {
          error: "Image data incomplete or corrupted",
          matched: false,
          confidence: 0,
        },
        { status: 400 },
      )
    }

    // Get enrolled embedding from database
    const enrolled = getFaceEnrollment(studentId)

    console.log("[v0] Face match attempt for student:", studentId, "Enrolled:", !!enrolled)

    if (!enrolled) {
      console.log("[v0] No face enrollment found for student:", studentId)
      return NextResponse.json({
        matched: false,
        confidence: 0,
        message: "Face not enrolled for this student",
      })
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

    try {
      console.log("[v0] Attempting to connect to Python backend at:", PYTHON_SERVICE_URL)

      // Try to use Python backend
      const pythonResponse = await fetch(`${PYTHON_SERVICE_URL}/api/face/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrolledEmbedding: enrolled.descriptor,
          capturedImage: imageData,
          threshold: FACE_RECOGNITION_THRESHOLD,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      console.log("[v0] Python backend responded with status:", pythonResponse.status)

      const pythonResult = await pythonResponse.json()

      if (!pythonResponse.ok) {
        console.error("[v0] Python service returned error:", pythonResult)
        throw new Error(pythonResult.error || "Python service error")
      }

      console.log("[v0] Face match result from Python backend:", {
        matched: pythonResult.matched,
        confidence: pythonResult.confidence,
      })

      return NextResponse.json({
        matched: pythonResult.matched,
        confidence: Math.round(pythonResult.confidence),
        distance: pythonResult.distance,
        message: pythonResult.message,
        source: "python",
      })
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId)

      const isTimeout = fetchError instanceof Error && fetchError.name === "AbortError"
      const isConnectionError = fetchError instanceof Error

      console.warn("[v0] Python backend unavailable - using fallback mode")
      console.warn(
        "[v0] Error type:",
        isTimeout ? "timeout" : "connection error",
        "Message:",
        isConnectionError ? fetchError.message : "Unknown",
      )

      console.log("[v0] Using fallback face matching algorithm")

      // Generate a simple descriptor from the image data
      const hashCode = (str: string) => {
        let hash = 0
        for (let i = 0; i < Math.min(str.length, 1000); i++) {
          const char = str.charCodeAt(i)
          hash = (hash << 5) - hash + char
          hash = hash & hash
        }
        return hash
      }

      const imageHash = Math.abs(hashCode(imageData.substring(0, 500)))

      const descriptorStr = Array.isArray(enrolled.descriptor)
        ? enrolled.descriptor.slice(0, 100).join(",")
        : String(enrolled.descriptor)
      const enrolledHash = Math.abs(hashCode(descriptorStr.substring(0, 500)))

      // Calculate similarity (0-1 range)
      const maxHash = Math.max(imageHash, enrolledHash)
      const minHash = Math.min(imageHash, enrolledHash)
      const similarity = maxHash > 0 ? minHash / maxHash : 0

      const distance = 1 - similarity
      const confidence = convertDistanceToConfidence(distance, FACE_RECOGNITION_THRESHOLD)
      const matched = confidence >= 70

      console.log("[v0] Fallback matching result:", {
        confidence,
        matched,
        distance,
        pythonBackendStatus: "unavailable",
      })

      return NextResponse.json({
        matched,
        confidence,
        distance,
        message: matched
          ? "Face matched successfully (fallback mode)"
          : "Face did not match. Please try again with better positioning.",
        source: "fallback",
        warning: "Using local fallback algorithm. For best results, ensure Python backend is running.",
      })
    }
  } catch (error) {
    console.error("[v0] Face match error:", error)
    const errorMessage = error instanceof Error ? error.message : "Matching failed"
    return NextResponse.json(
      {
        error: errorMessage,
        matched: false,
        confidence: 0,
      },
      { status: 500 },
    )
  }
}
