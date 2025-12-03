import { type NextRequest, NextResponse } from "next/server"
import { addFaceEnrollment, checkFaceEnrolled } from "@/lib/face-database"

const PYTHON_SERVICE_URL = process.env.PYTHON_FACE_SERVICE_URL || "http://localhost:5000"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Face enrollment request received")
    console.log("[v0] Python service URL:", PYTHON_SERVICE_URL)

    const body = await request.json()
    const { studentId, imageData } = body

    if (!studentId || !imageData) {
      console.log("[v0] Missing studentId or imageData")
      return NextResponse.json({ error: "Missing studentId or imageData" }, { status: 400 })
    }

    if (typeof imageData !== "string" || imageData.length < 100) {
      console.log("[v0] Invalid or incomplete image data. Length:", imageData?.length || 0)
      return NextResponse.json({ error: "Invalid or incomplete image data" }, { status: 400 })
    }

    if (checkFaceEnrolled(studentId)) {
      console.log("[v0] Face already enrolled for student:", studentId)
      return NextResponse.json({ error: "Face already enrolled. Contact admin to reset enrollment." }, { status: 400 })
    }

    console.log("[v0] Calling Python backend to encode face...")
    console.log("[v0] Image data length:", imageData.length)

    try {
      const pythonResponse = await fetch(`${PYTHON_SERVICE_URL}/api/face/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageData,
          studentId,
        }),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      })

      console.log("[v0] Python response status:", pythonResponse.status)

      const pythonResult = await pythonResponse.json()

      if (!pythonResponse.ok) {
        console.error("[v0] Python service error:", pythonResult)
        return NextResponse.json({ error: pythonResult.error || "Face detection failed" }, { status: 400 })
      }

      const embedding = pythonResult.embedding

      if (!embedding || !Array.isArray(embedding)) {
        console.error("[v0] Invalid embedding returned:", embedding)
        return NextResponse.json({ error: "Invalid embedding from face detection" }, { status: 400 })
      }

      // Store in database
      const result = addFaceEnrollment(studentId, embedding)

      if (!result.success) {
        console.log("[v0] Database storage failed:", result.message)
        return NextResponse.json({ error: result.message }, { status: 400 })
      }

      console.log("[v0] Face enrolled successfully for student:", studentId, "Embedding dimension:", embedding.length)

      return NextResponse.json({
        success: true,
        message: result.message,
        studentId,
        enrolledAt: new Date().toISOString(),
        metadata: pythonResult.metadata,
      })
    } catch (pythonError) {
      console.error("[v0] Python service connection error:", pythonError)

      console.log("[v0] Python backend unavailable. Using fallback local enrollment...")

      // For testing: use a mock embedding when Python service is down
      const mockEmbedding = new Array(128).fill(0).map(() => Math.random())
      const result = addFaceEnrollment(studentId, mockEmbedding)

      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        message: result.message + " (Using fallback mode - Please set up Python backend for production)",
        studentId,
        enrolledAt: new Date().toISOString(),
        fallbackMode: true,
      })
    }
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
