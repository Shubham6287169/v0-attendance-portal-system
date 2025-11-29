import { type NextRequest, NextResponse } from "next/server"
import { addFaceEnrollment, checkFaceEnrolled } from "@/lib/face-database"

// In-memory store for face data (replace with database in production)
const faceDatabase: Array<{
  studentId: string
  descriptor: number[]
  enrolledAt: string
}> = []

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId, descriptor, studentName } = body

    if (!studentId || !descriptor || !Array.isArray(descriptor)) {
      return NextResponse.json({ error: "Invalid face data" }, { status: 400 })
    }

    if (checkFaceEnrolled(studentId)) {
      return NextResponse.json({ error: "Face already enrolled. Contact admin to reset enrollment." }, { status: 400 })
    }

    const result = addFaceEnrollment(studentId, descriptor)

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    console.log("[v0] Face enrolled for student:", studentId, "Descriptor length:", descriptor.length)

    return NextResponse.json({
      success: true,
      message: result.message,
      studentId,
      enrolledAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Enrollment error:", error)
    return NextResponse.json({ error: "Enrollment failed" }, { status: 500 })
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
