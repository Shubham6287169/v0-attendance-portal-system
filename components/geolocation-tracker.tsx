"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, AlertCircle, CheckCircle, Navigation } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { isWithinGeofence, getNearestLocation, formatLocation, getAccuracyDescription } from "@/lib/geolocation"

interface GeolocationTrackerProps {
  onLocationCaptured: (location: { lat: number; lng: number; accuracy: number }) => void
}

export function GeolocationTracker({ onLocationCaptured }: GeolocationTrackerProps) {
  const [location, setLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [geofenceStatus, setGeofenceStatus] = useState<{
    isValid: boolean
    location?: string
    distance?: number
  } | null>(null)
  const [nearestLocation, setNearestLocation] = useState<{ location: string; distance: number } | null>(null)

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
          accuracy: Math.round(position.coords.accuracy),
        }

        setLocation(loc)

        // Check geofence
        const geofence = isWithinGeofence(loc.lat, loc.lng)
        setGeofenceStatus(geofence)

        // Get nearest location
        const nearest = getNearestLocation(loc.lat, loc.lng)
        setNearestLocation(nearest)

        onLocationCaptured(loc)
        setLoading(false)
      },
      (err) => {
        setError("Unable to access location. Please check permissions.")
        setLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="w-5 h-5" />
          Geolocation Tracking
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

        {location && (
          <>
            <div className="bg-muted rounded-lg p-4 border border-border space-y-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Current Location</p>
                <p className="font-mono text-sm mt-1">{formatLocation(location.lat, location.lng)}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Accuracy</p>
                  <p className="text-sm font-medium">{location.accuracy}m</p>
                  <p className="text-xs text-accent">{getAccuracyDescription(location.accuracy)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Nearest Location</p>
                  <p className="text-sm font-medium">{nearestLocation?.location}</p>
                  <p className="text-xs text-secondary">{nearestLocation?.distance}m away</p>
                </div>
              </div>
            </div>

            {geofenceStatus && (
              <Alert variant={geofenceStatus.isValid ? "default" : "destructive"}>
                {geofenceStatus.isValid ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <AlertDescription>
                  {geofenceStatus.isValid
                    ? `You are within the allowed area (${geofenceStatus.location}, ${geofenceStatus.distance}m)`
                    : `You are outside the allowed attendance area. Nearest: ${nearestLocation?.location} (${nearestLocation?.distance}m)`}
                </AlertDescription>
              </Alert>
            )}
          </>
        )}

        {!location && (
          <div className="text-center py-4">
            <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Location not captured yet</p>
          </div>
        )}

        <Button onClick={handleGetLocation} className="w-full" disabled={loading}>
          <MapPin className="w-4 h-4 mr-2" />
          {loading ? "Getting location..." : "Capture Location"}
        </Button>
      </CardContent>
    </Card>
  )
}
