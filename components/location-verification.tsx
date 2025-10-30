"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface LocationVerificationProps {
  onLocationCaptured: (location: { lat: number; lng: number }) => void
}

export function LocationVerification({ onLocationCaptured }: LocationVerificationProps) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleGetLocation = () => {
    setLoading(true)
    setError(null)

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser")
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setLocation(loc)
        onLocationCaptured(loc)
        setLoading(false)
      },
      (err) => {
        setError("Unable to access location. Please check permissions.")
        setLoading(false)
      },
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Location Verification
        </CardTitle>
        <CardDescription>Verify your location for attendance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="bg-muted rounded-lg p-4 border border-border">
          {location ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-accent" />
                <p className="text-sm font-medium text-foreground">Location Captured</p>
              </div>
              <p className="font-mono text-sm text-muted-foreground">Latitude: {location.lat.toFixed(6)}</p>
              <p className="font-mono text-sm text-muted-foreground">Longitude: {location.lng.toFixed(6)}</p>
            </div>
          ) : (
            <div className="text-center py-4">
              <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Location not captured yet</p>
            </div>
          )}
        </div>

        <Button onClick={handleGetLocation} className="w-full" disabled={loading}>
          <MapPin className="w-4 h-4 mr-2" />
          {loading ? "Getting location..." : "Capture Location"}
        </Button>
      </CardContent>
    </Card>
  )
}
