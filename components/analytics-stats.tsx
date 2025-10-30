"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Users, CheckCircle } from "lucide-react"

interface AnalyticsStatsProps {
  totalStudents: number
  approvedStudents: number
  totalAttendance: number
  approvedAttendance: number
  averageFaceMatch: number
  attendanceRate: number
}

export function AnalyticsStats({
  totalStudents,
  approvedStudents,
  totalAttendance,
  approvedAttendance,
  averageFaceMatch,
  attendanceRate,
}: AnalyticsStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Users className="w-4 h-4" />
            Total Students
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">{totalStudents}</div>
          <p className="text-xs text-muted-foreground mt-1">{approvedStudents} approved</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Attendance Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-accent">{attendanceRate}%</div>
          <p className="text-xs text-muted-foreground mt-1">
            {approvedAttendance} of {totalAttendance} approved
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Avg Face Match
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-secondary">{averageFaceMatch}%</div>
          <p className="text-xs text-muted-foreground mt-1">Recognition confidence</p>
        </CardContent>
      </Card>
    </div>
  )
}
