"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, AlertCircle, MapPin, Camera } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AttendanceConfirmationProps {
  faceMatch: number | null
  location: { lat: number; lng: number; accuracy: number } | null
  geofenceValid: boolean
  onConfirm: () => void
  onCancel: () => void
  isLoading: boolean
}

export function AttendanceConfirmation({
  faceMatch,
  location,
  geofenceValid,
  onConfirm,
  onCancel,
  isLoading,
}: AttendanceConfirmationProps) {
  const isReady = faceMatch && location && geofenceValid

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle>Attendance Confirmation</CardTitle>
        <CardDescription>Review your attendance details before submitting</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Face Recognition Status */}
        <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
          <Camera className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">Face Recognition</p>
            {faceMatch ? (
              <p className="text-sm text-accent font-semibold">{faceMatch}% Match Confidence</p>
            ) : (
              <p className="text-sm text-muted-foreground">Not captured</p>
            )}
          </div>
        </div>

        {/* Location Status */}
        <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
          <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">Location Verification</p>
            {location ? (
              <>
                <p className="text-sm text-muted-foreground">
                  {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </p>
                <p className={`text-sm font-semibold ${geofenceValid ? "text-accent" : "text-destructive"}`}>
                  {geofenceValid ? "Within allowed area" : "Outside allowed area"}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Not captured</p>
            )}
          </div>
        </div>

        {/* Status Alert */}
        {isReady ? (
          <Alert className="bg-accent/10 border-accent/20">
            <CheckCircle className="h-4 w-4 text-accent" />
            <AlertDescription className="text-accent">All requirements met. Ready to submit.</AlertDescription>
          </Alert>
        ) : (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {!faceMatch && "Face recognition required. "}
              {!location && "Location capture required. "}
              {location && !geofenceValid && "You are outside the allowed attendance area."}
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={!isReady || isLoading}>
            {isLoading ? "Submitting..." : "Confirm Attendance"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
