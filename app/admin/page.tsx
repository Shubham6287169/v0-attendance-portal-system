"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogOut, Plus, Trash2, CheckCircle, XCircle, Users, BarChart3, TrendingUp, Settings } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AnalyticsCharts } from "@/components/analytics-charts"
import { AnalyticsStats } from "@/components/analytics-stats"
import { getAllowedLocations, saveGeofenceSettings, type GeofenceSetting } from "@/lib/geolocation"

interface Student {
  id: string
  name: string
  email: string
  status: "pending" | "approved" | "rejected"
  enrollmentDate: string
}

interface AttendanceRecord {
  id: string
  studentId: string
  studentName: string
  date: string
  time: string
  location: string
  faceMatch: number
  status: "approved" | "pending" | "rejected"
}

export default function AdminDashboard() {
  const [students, setStudents] = useState<Student[]>([
    { id: "1", name: "Rajesh Kumar", email: "rajesh@example.com", status: "approved", enrollmentDate: "2024-01-15" },
    { id: "2", name: "Priya Sharma", email: "priya@example.com", status: "pending", enrollmentDate: "2024-10-25" },
    { id: "3", name: "Amit Patel", email: "amit@example.com", status: "approved", enrollmentDate: "2024-02-10" },
    { id: "4", name: "Neha Singh", email: "neha@example.com", status: "approved", enrollmentDate: "2024-03-05" },
    { id: "5", name: "Vikram Gupta", email: "vikram@example.com", status: "pending", enrollmentDate: "2024-10-28" },
    { id: "6", name: "Anjali Verma", email: "anjali@example.com", status: "approved", enrollmentDate: "2024-04-12" },
  ])

  const [attendance, setAttendance] = useState<AttendanceRecord[]>([
    {
      id: "1",
      studentId: "1",
      studentName: "Rajesh Kumar",
      date: "2024-10-30",
      time: "09:15",
      location: "Greater Noida New Campus",
      faceMatch: 98,
      status: "approved",
    },
    {
      id: "2",
      studentId: "2",
      studentName: "Priya Sharma",
      date: "2024-10-30",
      time: "09:45",
      location: "Greater Noida New Campus",
      faceMatch: 95,
      status: "pending",
    },
    {
      id: "3",
      studentId: "3",
      studentName: "Amit Patel",
      date: "2024-10-30",
      time: "10:00",
      location: "Greater Noida New Campus",
      faceMatch: 92,
      status: "approved",
    },
  ])

  const [newStudent, setNewStudent] = useState({ name: "", email: "" })
  const [user, setUser] = useState<any>(null)

  const [geofenceSettings, setGeofenceSettings] = useState<GeofenceSetting[]>([])
  const [editingLocation, setEditingLocation] = useState<GeofenceSetting | null>(null)
  const [newLocation, setNewLocation] = useState({ name: "", lat: "", lng: "", radius: "" })

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      window.location.href = "/"
      return
    }
    setUser(JSON.parse(userData))

    setGeofenceSettings(getAllowedLocations())
  }, [])

  const handleAddStudent = () => {
    if (newStudent.name && newStudent.email) {
      const student: Student = {
        id: String(students.length + 1),
        name: newStudent.name,
        email: newStudent.email,
        status: "pending",
        enrollmentDate: new Date().toISOString().split("T")[0],
      }
      setStudents([...students, student])
      setNewStudent({ name: "", email: "" })
    }
  }

  const handleApproveStudent = (id: string) => {
    setStudents(students.map((s) => (s.id === id ? { ...s, status: "approved" } : s)))
  }

  const handleRejectStudent = (id: string) => {
    setStudents(students.map((s) => (s.id === id ? { ...s, status: "rejected" } : s)))
  }

  const handleDeleteStudent = (id: string) => {
    setStudents(students.filter((s) => s.id !== id))
  }

  const handleApproveAttendance = (id: string) => {
    setAttendance(attendance.map((a) => (a.id === id ? { ...a, status: "approved" } : a)))
  }

  const handleRejectAttendance = (id: string) => {
    setAttendance(attendance.map((a) => (a.id === id ? { ...a, status: "rejected" } : a)))
  }

  const handleAddLocation = () => {
    if (newLocation.name && newLocation.lat && newLocation.lng && newLocation.radius) {
      const location: GeofenceSetting = {
        name: newLocation.name,
        lat: Number.parseFloat(newLocation.lat),
        lng: Number.parseFloat(newLocation.lng),
        radius: Number.parseFloat(newLocation.radius),
      }
      const updated = [...geofenceSettings, location]
      setGeofenceSettings(updated)
      saveGeofenceSettings(updated)
      setNewLocation({ name: "", lat: "", lng: "", radius: "" })
    }
  }

  const handleUpdateLocation = () => {
    if (editingLocation && newLocation.name && newLocation.lat && newLocation.lng && newLocation.radius) {
      const updated = geofenceSettings.map((loc) =>
        loc.name === editingLocation.name
          ? {
              name: newLocation.name,
              lat: Number.parseFloat(newLocation.lat),
              lng: Number.parseFloat(newLocation.lng),
              radius: Number.parseFloat(newLocation.radius),
            }
          : loc,
      )
      setGeofenceSettings(updated)
      saveGeofenceSettings(updated)
      setEditingLocation(null)
      setNewLocation({ name: "", lat: "", lng: "", radius: "" })
    }
  }

  const handleDeleteLocation = (name: string) => {
    const updated = geofenceSettings.filter((loc) => loc.name !== name)
    setGeofenceSettings(updated)
    saveGeofenceSettings(updated)
  }

  const handleEditLocation = (location: GeofenceSetting) => {
    setEditingLocation(location)
    setNewLocation({
      name: location.name,
      lat: location.lat.toString(),
      lng: location.lng.toString(),
      radius: location.radius.toString(),
    })
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    window.location.href = "/"
  }

  const approvedCount = students.filter((s) => s.status === "approved").length
  const pendingCount = students.filter((s) => s.status === "pending").length
  const totalAttendance = attendance.length
  const approvedAttendance = attendance.filter((a) => a.status === "approved").length
  const averageFaceMatch = Math.round(attendance.reduce((sum, a) => sum + a.faceMatch, 0) / attendance.length)
  const attendanceRate = totalAttendance > 0 ? Math.round((approvedAttendance / totalAttendance) * 100) : 0

  const attendanceData = [
    { date: "Oct 24", count: 45 },
    { date: "Oct 25", count: 52 },
    { date: "Oct 26", count: 48 },
    { date: "Oct 27", count: 61 },
    { date: "Oct 28", count: 55 },
    { date: "Oct 29", count: 67 },
    { date: "Oct 30", count: approvedAttendance },
  ]

  const studentStatusData = [
    { name: "Approved", value: approvedCount },
    { name: "Pending", value: pendingCount },
    { name: "Rejected", value: students.filter((s) => s.status === "rejected").length },
  ]

  const faceMatchData = [
    { range: "90-95%", count: attendance.filter((a) => a.faceMatch >= 90 && a.faceMatch < 95).length },
    { range: "95-98%", count: attendance.filter((a) => a.faceMatch >= 95 && a.faceMatch < 98).length },
    { range: "98-100%", count: attendance.filter((a) => a.faceMatch >= 98).length },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">Admin Dashboard</h1>
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
        {/* Analytics Stats */}
        <AnalyticsStats
          totalStudents={students.length}
          approvedStudents={approvedCount}
          totalAttendance={totalAttendance}
          approvedAttendance={approvedAttendance}
          averageFaceMatch={averageFaceMatch}
          attendanceRate={attendanceRate}
        />

        {/* Tabs */}
        <Tabs defaultValue="analytics" className="space-y-4 mt-8">
          <TabsList>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="students" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Student Management
            </TabsTrigger>
            <TabsTrigger value="attendance" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Attendance Records
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Geolocation Settings
            </TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <AnalyticsCharts
              attendanceData={attendanceData}
              studentStatusData={studentStatusData}
              faceMatchData={faceMatchData}
            />
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Add New Student</CardTitle>
                <CardDescription>Register a new student in the system</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="student-name">Full Name</Label>
                    <Input
                      id="student-name"
                      placeholder="Rajesh Kumar"
                      value={newStudent.name}
                      onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-email">Email</Label>
                    <Input
                      id="student-email"
                      type="email"
                      placeholder="rajesh@example.com"
                      value={newStudent.email}
                      onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={handleAddStudent} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Student
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Student List</CardTitle>
                <CardDescription>Manage and approve student registrations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Enrollment Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell>{student.email}</TableCell>
                          <TableCell>{student.enrollmentDate}</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                student.status === "approved"
                                  ? "bg-accent/20 text-accent"
                                  : student.status === "pending"
                                    ? "bg-secondary/20 text-secondary"
                                    : "bg-destructive/20 text-destructive"
                              }`}
                            >
                              {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                            </span>
                          </TableCell>
                          <TableCell className="space-x-2">
                            {student.status === "pending" && (
                              <>
                                <Button size="sm" variant="outline" onClick={() => handleApproveStudent(student.id)}>
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleRejectStudent(student.id)}>
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            <Button size="sm" variant="outline" onClick={() => handleDeleteStudent(student.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Records</CardTitle>
                <CardDescription>Review and approve attendance submissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Face Match</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendance.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">{record.studentName}</TableCell>
                          <TableCell>{record.date}</TableCell>
                          <TableCell>{record.time}</TableCell>
                          <TableCell>{record.location}</TableCell>
                          <TableCell>
                            <span
                              className={`font-medium ${record.faceMatch >= 95 ? "text-accent" : "text-secondary"}`}
                            >
                              {record.faceMatch}%
                            </span>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                record.status === "approved"
                                  ? "bg-accent/20 text-accent"
                                  : record.status === "pending"
                                    ? "bg-secondary/20 text-secondary"
                                    : "bg-destructive/20 text-destructive"
                              }`}
                            >
                              {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                            </span>
                          </TableCell>
                          <TableCell className="space-x-2">
                            {record.status === "pending" && (
                              <>
                                <Button size="sm" variant="outline" onClick={() => handleApproveAttendance(record.id)}>
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleRejectAttendance(record.id)}>
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Geolocation Settings</CardTitle>
                <CardDescription>Configure attendance locations and geofence radius</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location-name">Location Name</Label>
                    <Input
                      id="location-name"
                      placeholder="e.g., Greater Noida New Campus"
                      value={newLocation.name}
                      onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location-lat">Latitude</Label>
                    <Input
                      id="location-lat"
                      type="number"
                      step="0.0001"
                      placeholder="28.4595"
                      value={newLocation.lat}
                      onChange={(e) => setNewLocation({ ...newLocation, lat: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location-lng">Longitude</Label>
                    <Input
                      id="location-lng"
                      type="number"
                      step="0.0001"
                      placeholder="77.5362"
                      value={newLocation.lng}
                      onChange={(e) => setNewLocation({ ...newLocation, lng: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location-radius">Geofence Radius (meters)</Label>
                    <Input
                      id="location-radius"
                      type="number"
                      placeholder="200"
                      value={newLocation.radius}
                      onChange={(e) => setNewLocation({ ...newLocation, radius: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={editingLocation ? handleUpdateLocation : handleAddLocation} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  {editingLocation ? "Update Location" : "Add Location"}
                </Button>
                {editingLocation && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingLocation(null)
                      setNewLocation({ name: "", lat: "", lng: "", radius: "" })
                    }}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Locations</CardTitle>
                <CardDescription>Manage attendance geofence locations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Location Name</TableHead>
                        <TableHead>Latitude</TableHead>
                        <TableHead>Longitude</TableHead>
                        <TableHead>Radius (m)</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {geofenceSettings.map((location) => (
                        <TableRow key={location.name}>
                          <TableCell className="font-medium">{location.name}</TableCell>
                          <TableCell>{location.lat.toFixed(4)}</TableCell>
                          <TableCell>{location.lng.toFixed(4)}</TableCell>
                          <TableCell>{location.radius}</TableCell>
                          <TableCell className="space-x-2">
                            <Button size="sm" variant="outline" onClick={() => handleEditLocation(location)}>
                              Edit
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDeleteLocation(location.name)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
