import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/jwt"

// Mock database
const attendanceRecords: any[] = []

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 })
    }

    const { faceMatch, location, geofenceValid } = await request.json()

    if (!faceMatch || !location || !geofenceValid) {
      return NextResponse.json({ message: "Invalid attendance data" }, { status: 400 })
    }

    const newRecord = {
      id: String(attendanceRecords.length + 1),
      studentId: payload.id,
      studentEmail: payload.email,
      date: new Date().toISOString().split("T")[0],
      time: new Date().toISOString(),
      location: `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`,
      faceMatch,
      accuracy: location.accuracy,
      status: "pending",
      createdAt: new Date().toISOString(),
    }

    attendanceRecords.push(newRecord)

    return NextResponse.json(
      {
        message: "Attendance marked successfully",
        record: newRecord,
      },
      { status: 201 },
    )
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 })
    }

    const studentRecords = attendanceRecords.filter((r) => r.studentId === payload.id)
    return NextResponse.json(studentRecords)
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
