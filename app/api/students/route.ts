import { type NextRequest, NextResponse } from "next/server"

// Mock database
const students: any[] = [
  { id: "1", name: "John Doe", email: "john@example.com", status: "approved", enrollmentDate: "2024-01-15" },
  { id: "2", name: "Jane Smith", email: "jane@example.com", status: "pending", enrollmentDate: "2024-10-25" },
]

export async function GET() {
  return NextResponse.json(students)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const newStudent = {
    id: String(students.length + 1),
    ...body,
    status: "pending",
    enrollmentDate: new Date().toISOString().split("T")[0],
  }
  students.push(newStudent)
  return NextResponse.json(newStudent, { status: 201 })
}
