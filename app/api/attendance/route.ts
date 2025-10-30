import { type NextRequest, NextResponse } from "next/server"

// Mock database
const attendance: any[] = [
  {
    id: "1",
    studentId: "1",
    studentName: "John Doe",
    date: "2024-10-30",
    time: "09:15",
    location: "Building A",
    faceMatch: 98,
    status: "approved",
  },
]

export async function GET() {
  return NextResponse.json(attendance)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const newRecord = {
    id: String(attendance.length + 1),
    ...body,
    status: "pending",
  }
  attendance.push(newRecord)
  return NextResponse.json(newRecord, { status: 201 })
}
