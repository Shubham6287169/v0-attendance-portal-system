"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogOut, Camera, Clock, CheckCircle, AlertCircle, Fingerprint } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FaceRecognition } from "@/components/face-recognition"
import { FaceEnrollment } from "@/components/face-enrollment"
import { GeolocationTracker } from "@/components/geolocation-tracker"
import { AttendanceConfirmation } from "@/components/attendance-confirmation"
import { isWithinGeofence } from "@/lib/geolocation"

interface AttendanceRecord {
  id: string
  date: string
  time: string
  location: string
  faceMatch: number
  status: "approved" | "pending" | "rejected"
}

export default function StudentDashboard() {
  const [user, setUser] = useState<any>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [location, setLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null)
  const [faceMatch, setFaceMatch] = useState<number | null>(null)
  const [geofenceValid, setGeofenceValid] = useState(false)
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([
    { id: "1", date: "2024-10-30", time: "09:15", location: "Building A", faceMatch: 98, status: "approved" },
    { id: "2", date: "2024-10-29", time: "09:20", location: "Building A", faceMatch: 96, status: "approved" },
    { id: "3", date: "2024-10-28", time: "09:10", location: "Building B", faceMatch: 94, status: "approved" },
  ])
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [faceEnrolled, setFaceEnrolled] = useState(false)
  const [showEnrollment, setShowEnrollment] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      window.location.href = "/"
      return
    }
    const parsedUser = JSON.parse(userData)
    setUser(parsedUser)

    // Check if face is enrolled
    const faceData = localStorage.getItem("face_descriptors")
    if (faceData) {
      const descriptors = JSON.parse(faceData)
      const enrolled = descriptors.some((d: any) => d.studentId === parsedUser.id)
      setFaceEnrolled(enrolled)
    }
  }, [])

  useEffect(() => {
    if (location) {
      const geofence = isWithinGeofence(location.lat, location.lng)
      setGeofenceValid(geofence.isValid)
    }
  }, [location])

  const handleMarkAttendance = async () => {
    if (!location || !faceMatch || !geofenceValid) {
      setMessage({ type: "error", text: "Please complete all requirements" })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/attendance/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          faceMatch,
          location,
          geofenceValid,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage({ type: "error", text: data.message || "Failed to mark attendance" })
        return
      }

      const newRecord: AttendanceRecord = {
        id: data.record.id,
        date: data.record.date,
        time: new Date(data.record.time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        location: data.record.location,
        faceMatch: data.record.faceMatch,
        status: "pending",
      }

      setAttendanceRecords([newRecord, ...attendanceRecords])
      setCameraActive(false)
      setLocation(null)
      setFaceMatch(null)
      setMessage({ type: "success", text: "Attendance marked successfully. Pending admin approval." })
    } catch (err) {
      setMessage({ type: "error", text: "An error occurred. Please try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    window.location.href = "/"
  }

  const approvedCount = attendanceRecords.filter((r) => r.status === "approved").length
  const pendingCount = attendanceRecords.filter((r) => r.status === "pending").length

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">Student Dashboard</h1>
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
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{attendanceRecords.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">{approvedCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">{pendingCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Face Enrollment Alert */}
        {!faceEnrolled && !showEnrollment && (
          <Alert className="mb-6 border-secondary/50 bg-secondary/10">
            <Fingerprint className="h-4 w-4" />
            <AlertDescription>
              You need to enroll your face first before marking attendance.{" "}
              <Button variant="link" className="p-0 h-auto font-semibold" onClick={() => setShowEnrollment(true)}>
                Enroll Now
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs defaultValue={showEnrollment ? "enroll" : "mark"} className="space-y-4">
          <TabsList>
            {!faceEnrolled && (
              <TabsTrigger value="enroll" className="flex items-center gap-2">
                <Fingerprint className="w-4 h-4" />
                Enroll Face
              </TabsTrigger>
            )}
            <TabsTrigger value="mark" className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Mark Attendance
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Attendance History
            </TabsTrigger>
          </TabsList>

          {/* Face Enrollment Tab */}
          {!faceEnrolled && (
            <TabsContent value="enroll" className="space-y-4">
              <FaceEnrollment
                studentId={user?.id}
                onEnrollmentComplete={() => {
                  setFaceEnrolled(true)
                  setShowEnrollment(false)
                  setMessage({ type: "success", text: "Face enrolled successfully!" })
                }}
              />
            </TabsContent>
          )}

          {/* Mark Attendance Tab */}
          <TabsContent value="mark" className="space-y-4">
            {!faceEnrolled ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Please enroll your face first to mark attendance.</AlertDescription>
              </Alert>
            ) : (
              <>
                {message && (
                  <Alert variant={message.type === "success" ? "default" : "destructive"}>
                    {message.type === "success" ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <AlertDescription>{message.text}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2 space-y-4">
                    <FaceRecognition isActive={cameraActive} onFaceDetected={setFaceMatch} studentId={user?.id} />
                    <GeolocationTracker onLocationCaptured={setLocation} />
                  </div>

                  <div className="space-y-4">
                    <Button
                      onClick={() => setCameraActive(!cameraActive)}
                      className="w-full h-12"
                      variant={cameraActive ? "destructive" : "default"}
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      {cameraActive ? "Stop Camera" : "Start Camera"}
                    </Button>

                    <AttendanceConfirmation
                      faceMatch={faceMatch}
                      location={location}
                      geofenceValid={geofenceValid}
                      onConfirm={handleMarkAttendance}
                      onCancel={() => {
                        setCameraActive(false)
                        setLocation(null)
                        setFaceMatch(null)
                      }}
                      isLoading={isSubmitting}
                    />
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* Attendance History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Attendance History</CardTitle>
                <CardDescription>Your attendance records and approval status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Face Match</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">{record.date}</TableCell>
                          <TableCell>{record.time}</TableCell>
                          <TableCell className="text-sm">{record.location}</TableCell>
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
