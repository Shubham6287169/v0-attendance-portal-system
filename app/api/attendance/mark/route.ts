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

    // Also added better error messages
    if (faceMatch === null || faceMatch === undefined || !location || !geofenceValid) {
      const missingFields = []
      if (faceMatch === null || faceMatch === undefined) missingFields.push("Face recognition")
      if (!location) missingFields.push("Location")
      if (!geofenceValid) missingFields.push("Geofence validation")

      return NextResponse.json({ message: `Missing required fields: ${missingFields.join(", ")}` }, { status: 400 })
    }

    if (faceMatch < 70) {
      return NextResponse.json(
        { message: "Face match confidence below threshold (70%). Please try again with a clearer face." },
        { status: 400 },
      )
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
    console.log("[v0] Error in attendance API:", error)
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
