import { type NextRequest, NextResponse } from "next/server"

const students: any[] = [
  { id: "1", name: "Rajesh Kumar", email: "rajesh@example.com", status: "approved", enrollmentDate: "2024-01-15" },
  { id: "2", name: "Priya Sharma", email: "priya@example.com", status: "pending", enrollmentDate: "2024-10-25" },
  { id: "3", name: "Amit Patel", email: "amit@example.com", status: "approved", enrollmentDate: "2024-02-10" },
  { id: "4", name: "Neha Singh", email: "neha@example.com", status: "approved", enrollmentDate: "2024-03-05" },
  { id: "5", name: "Vikram Gupta", email: "vikram@example.com", status: "pending", enrollmentDate: "2024-10-28" },
  { id: "6", name: "Anjali Verma", email: "anjali@example.com", status: "approved", enrollmentDate: "2024-04-12" },
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
