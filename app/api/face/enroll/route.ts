import { type NextRequest, NextResponse } from "next/server"
import { addFaceEnrollment, checkFaceEnrolled } from "@/lib/face-database"

const PYTHON_SERVICE_URL = process.env.PYTHON_FACE_SERVICE_URL || "http://localhost:5000"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId, imageData } = body

    if (!studentId || !imageData) {
      return NextResponse.json({ error: "Missing studentId or imageData" }, { status: 400 })
    }

    if (checkFaceEnrolled(studentId)) {
      return NextResponse.json({ error: "Face already enrolled. Contact admin to reset enrollment." }, { status: 400 })
    }

    // Call Python backend to encode face
    const pythonResponse = await fetch(`${PYTHON_SERVICE_URL}/api/face/enroll`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: imageData,
        studentId,
      }),
    })

    const pythonResult = await pythonResponse.json()

    if (!pythonResponse.ok) {
      console.error("[v0] Python service error:", pythonResult)
      return NextResponse.json({ error: pythonResult.error || "Face detection failed" }, { status: 400 })
    }

    const embedding = pythonResult.embedding

    if (!embedding || !Array.isArray(embedding)) {
      return NextResponse.json({ error: "Invalid embedding from face detection" }, { status: 400 })
    }

    // Store in database
    const result = addFaceEnrollment(studentId, embedding)

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    console.log("[v0] Face enrolled for student:", studentId, "Embedding dimension:", embedding.length)

    return NextResponse.json({
      success: true,
      message: result.message,
      studentId,
      enrolledAt: new Date().toISOString(),
      metadata: pythonResult.metadata,
    })
  } catch (error) {
    console.error("[v0] Enrollment error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Enrollment failed" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const studentId = request.nextUrl.searchParams.get("studentId")

    if (!studentId) {
      return NextResponse.json({ error: "Student ID required" }, { status: 400 })
    }

    const enrolled = checkFaceEnrolled(studentId)

    console.log("[v0] Enrollment check for student:", studentId, "Enrolled:", enrolled)

    return NextResponse.json({
      enrolled,
      studentId,
    })
  } catch (error) {
    console.error("[v0] Check enrollment error:", error)
    return NextResponse.json({ error: "Check failed" }, { status: 500 })
  }
}
