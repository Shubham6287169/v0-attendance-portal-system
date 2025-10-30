import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/jwt"

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || payload.role !== "teacher") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const { studentIds, timestamp } = await request.json()

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ message: "Invalid student IDs" }, { status: 400 })
    }

    // In production, save to database
    const attendanceRecords = studentIds.map((studentId: string) => ({
      studentId,
      teacherId: payload.id,
      timestamp,
      status: "approved",
      markedAt: new Date().toISOString(),
    }))

    return NextResponse.json({
      message: "Attendance marked successfully",
      records: attendanceRecords,
    })
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
