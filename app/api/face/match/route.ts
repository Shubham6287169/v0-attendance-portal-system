import { type NextRequest, NextResponse } from "next/server"
import { getFaceEnrollment } from "@/lib/face-database"

const PYTHON_SERVICE_URL = process.env.PYTHON_FACE_SERVICE_URL || "http://localhost:5000"
const FACE_RECOGNITION_THRESHOLD = Number.parseFloat(process.env.FACE_RECOGNITION_THRESHOLD || "0.6")
const API_TIMEOUT = 30000

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId, imageData } = body

    if (!studentId || !imageData) {
      console.log("[v0] Invalid data provided - studentId:", !!studentId, "imageData:", !!imageData)
      return NextResponse.json({ error: "Invalid data" }, { status: 400 })
    }

    if (typeof imageData !== "string" || imageData.length < 100) {
      console.log("[v0] Image data incomplete - length:", imageData?.length)
      return NextResponse.json(
        {
          error: "Image data incomplete or corrupted",
          imageLength: imageData?.length,
        },
        { status: 400 },
      )
    }

    // Get enrolled embedding from database
    const enrolled = getFaceEnrollment(studentId)

    console.log("[v0] Face match attempt for student:", studentId, "Enrolled:", !!enrolled)

    if (!enrolled) {
      return NextResponse.json({
        matched: false,
        confidence: 0,
        message: "Face not enrolled for this student",
      })
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

    try {
      console.log("[v0] Sending face match request to Python backend...")

      // Call Python backend to match faces
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

      const pythonResult = await pythonResponse.json()

      console.log("[v0] Python response status:", pythonResponse.status)

      if (!pythonResponse.ok) {
        console.error("[v0] Python service error:", pythonResult)
        return NextResponse.json({
          matched: false,
          confidence: 0,
          message: pythonResult.error || "Face matching failed",
          pythonError: pythonResult,
        })
      }

      console.log("[v0] Face match result:", {
        studentId,
        matched: pythonResult.matched,
        confidence: pythonResult.confidence,
        distance: pythonResult.distance,
      })

      return NextResponse.json({
        matched: pythonResult.matched,
        confidence: Math.round(pythonResult.confidence),
        distance: pythonResult.distance,
        message: pythonResult.message,
      })
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId)

      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        console.error("[v0] Python service request timeout after 30 seconds")
        return NextResponse.json(
          {
            matched: false,
            confidence: 0,
            message: "Face recognition service timeout. Please try again.",
            error: "timeout",
          },
          { status: 504 },
        )
      }

      console.error("[v0] Python service connection error:", fetchError)
      return NextResponse.json(
        {
          matched: false,
          confidence: 0,
          message: "Could not connect to face recognition service",
          error: fetchError instanceof Error ? fetchError.message : "Unknown error",
        },
        { status: 503 },
      )
    }
  } catch (error) {
    console.error("[v0] Face match error:", error)
    return NextResponse.json({ error: "Matching failed" }, { status: 500 })
  }
}
