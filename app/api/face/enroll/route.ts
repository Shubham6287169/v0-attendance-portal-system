import { type NextRequest, NextResponse } from "next/server"

// In-memory store for face data (replace with database in production)
let faceDatabase: Array<{
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

    // Remove old enrollment for this student
    faceDatabase = faceDatabase.filter((f) => f.studentId !== studentId)

    // Add new enrollment
    faceDatabase.push({
      studentId,
      descriptor,
      enrolledAt: new Date().toISOString(),
    })

    console.log("[v0] Face enrolled for student:", studentId)

    return NextResponse.json({
      success: true,
      message: "Face enrolled successfully",
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

    const enrollment = faceDatabase.find((f) => f.studentId === studentId)

    if (!enrollment) {
      return NextResponse.json({ enrolled: false })
    }

    return NextResponse.json({
      enrolled: true,
      studentId: enrollment.studentId,
      enrolledAt: enrollment.enrolledAt,
    })
  } catch (error) {
    console.error("[v0] Check enrollment error:", error)
    return NextResponse.json({ error: "Check failed" }, { status: 500 })
  }
}
