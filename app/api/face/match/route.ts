import { type NextRequest, NextResponse } from "next/server"
import { getFaceEnrollment } from "@/lib/face-database"

const PYTHON_SERVICE_URL = process.env.PYTHON_FACE_SERVICE_URL || "http://localhost:5000"
const FACE_RECOGNITION_THRESHOLD = Number.parseFloat(process.env.FACE_RECOGNITION_THRESHOLD || "0.6")

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId, imageData } = body

    if (!studentId || !imageData) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 })
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

    // Call Python backend to match faces
    const pythonResponse = await fetch(`${PYTHON_SERVICE_URL}/api/face/match`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enrolledEmbedding: enrolled.descriptor,
        capturedImage: imageData,
        threshold: FACE_RECOGNITION_THRESHOLD,
      }),
    })

    const pythonResult = await pythonResponse.json()

    if (!pythonResponse.ok) {
      console.error("[v0] Python service error:", pythonResult)
      return NextResponse.json({
        matched: false,
        confidence: 0,
        message: pythonResult.error || "Face matching failed",
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
  } catch (error) {
    console.error("[v0] Face match error:", error)
    return NextResponse.json({ error: "Matching failed" }, { status: 500 })
  }
}
