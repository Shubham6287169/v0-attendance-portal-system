"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { LogOut, Clock, CheckCircle, AlertCircle, MapPin } from "lucide-react"
import { ALLOWED_LOCATIONS } from "@/lib/geolocation"

interface Student {
  id: string
  name: string
  email: string
  status: "present" | "absent" | "pending"
  lastAttendance?: string
}

interface AttendanceRecord {
  studentId: string
  studentName: string
  timestamp: string
  faceConfidence: number
  location: string
  status: "approved" | "pending" | "rejected"
}

export default function TeacherDashboard() {
  const [students, setStudents] = useState<Student[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [selectedLocation, setSelectedLocation] = useState<string>(ALLOWED_LOCATIONS[0].name)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
    loadStudents()
    loadAttendanceRecords()
  }, [])

  const loadStudents = () => {
    // Mock data - in production, fetch from API
    const mockStudents: Student[] = [
      { id: "1", name: "Alice Johnson", email: "alice@example.com", status: "pending" },
      { id: "2", name: "Bob Smith", email: "bob@example.com", status: "pending" },
      { id: "3", name: "Carol White", email: "carol@example.com", status: "pending" },
      { id: "4", name: "David Brown", email: "david@example.com", status: "pending" },
      { id: "5", name: "Emma Davis", email: "emma@example.com", status: "pending" },
    ]
    setStudents(mockStudents)
  }

  const loadAttendanceRecords = () => {
    // Mock data - in production, fetch from API
    const mockRecords: AttendanceRecord[] = [
      {
        studentId: "1",
        studentName: "Alice Johnson",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        faceConfidence: 0.95,
        location: "Greater Noida New Campus",
        status: "approved",
      },
      {
        studentId: "2",
        studentName: "Bob Smith",
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        faceConfidence: 0.88,
        location: "Building A",
        status: "approved",
      },
    ]
    setAttendanceRecords(mockRecords)
  }

  const toggleStudentSelection = (studentId: string) => {
    const newSelected = new Set(selectedStudents)
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId)
    } else {
      newSelected.add(studentId)
    }
    setSelectedStudents(newSelected)
  }

  const markAttendance = async () => {
    if (selectedStudents.size === 0) {
      setMessage("Please select at least one student")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/teacher/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentIds: Array.from(selectedStudents),
          location: selectedLocation,
          timestamp: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        setMessage("Attendance marked successfully")
        setSelectedStudents(new Set())
        loadAttendanceRecords()
        setTimeout(() => setMessage(""), 3000)
      } else {
        setMessage("Failed to mark attendance")
      }
    } catch (error) {
      setMessage("Error marking attendance")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    window.location.href = "/"
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">Teacher Dashboard</h1>
            <p className="text-sm text-muted-foreground">Welcome, {user?.name}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {message && (
          <Alert className="mb-6" variant={message.includes("successfully") ? "default" : "destructive"}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="attendance" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="attendance" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Mark Attendance
            </TabsTrigger>
            <TabsTrigger value="records" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Attendance Records
            </TabsTrigger>
          </TabsList>

          {/* Mark Attendance Tab */}
          <TabsContent value="attendance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mark Student Attendance</CardTitle>
                <CardDescription>Select students and mark their attendance for today</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Select Campus Location
                  </label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  >
                    {ALLOWED_LOCATIONS.map((location) => (
                      <option key={location.name} value={location.name}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Current selection: <span className="font-medium">{selectedLocation}</span>
                  </p>
                </div>

                <div className="space-y-3">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition"
                      onClick={() => toggleStudentSelection(student.id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudents.has(student.id)}
                        onChange={() => toggleStudentSelection(student.id)}
                        className="w-5 h-5 rounded border-border"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                      </div>
                      <Badge variant="outline">{student.status}</Badge>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button onClick={markAttendance} disabled={selectedStudents.size === 0 || loading} className="flex-1">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {loading ? "Marking..." : `Mark Attendance (${selectedStudents.size})`}
                  </Button>
                  {selectedStudents.size > 0 && (
                    <Button variant="outline" onClick={() => setSelectedStudents(new Set())}>
                      Clear Selection
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendance Records Tab */}
          <TabsContent value="records" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Records</CardTitle>
                <CardDescription>View recent attendance submissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {attendanceRecords.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No attendance records yet</p>
                  ) : (
                    attendanceRecords.map((record, idx) => (
                      <div key={idx} className="p-4 border border-border rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-medium">{record.studentName}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(record.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <Badge variant={record.status === "approved" ? "default" : "secondary"}>
                            {record.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Face Confidence</p>
                            <p className="font-medium">{(record.faceConfidence * 100).toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Location</p>
                            <p className="font-medium flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {record.location}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
