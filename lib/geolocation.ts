// Allowed attendance locations (in production, fetch from database)
export interface GeofenceSetting {
  name: string
  lat: number
  lng: number
  radius: number
}

// Default geofence settings
const DEFAULT_LOCATIONS: GeofenceSetting[] = [
  { name: "Building A", lat: 40.7128, lng: -74.006, radius: 100 },
  { name: "Building B", lat: 40.758, lng: -73.9855, radius: 100 },
  { name: "Campus Center", lat: 40.7489, lng: -73.968, radius: 150 },
  { name: "Greater Noida New Campus", lat: 28.4595, lng: 77.5362, radius: 200 },
]

export const ALLOWED_LOCATIONS = DEFAULT_LOCATIONS

// Get geofence settings from localStorage or use defaults
export function getAllowedLocations(): GeofenceSetting[] {
  if (typeof window === "undefined") return DEFAULT_LOCATIONS
  const stored = localStorage.getItem("geofenceSettings")
  return stored ? JSON.parse(stored) : DEFAULT_LOCATIONS
}

// Save geofence settings to localStorage
export function saveGeofenceSettings(settings: GeofenceSetting[]): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("geofenceSettings", JSON.stringify(settings))
  }
}

// Calculate distance between two coordinates using Haversine formula
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  if (typeof lat1 !== "number" || typeof lng1 !== "number" || typeof lat2 !== "number" || typeof lng2 !== "number") {
    console.error("[v0] Invalid coordinates - must be numbers", { lat1, lng1, lat2, lng2 })
    return Number.POSITIVE_INFINITY
  }

  // Validate coordinate ranges
  if (lat1 < -90 || lat1 > 90 || lat2 < -90 || lat2 > 90) {
    console.error("[v0] Invalid latitude values", { lat1, lat2 })
    return Number.POSITIVE_INFINITY
  }

  if (lng1 < -180 || lng1 > 180 || lng2 < -180 || lng2 > 180) {
    console.error("[v0] Invalid longitude values", { lng1, lng2 })
    return Number.POSITIVE_INFINITY
  }

  const R = 6371000 // Earth's radius in meters

  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180

  const lat1Rad = (lat1 * Math.PI) / 180
  const lat2Rad = (lat2 * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  console.log("[v0] Distance calculation:", { lat1, lng1, lat2, lng2, distance })
  return distance
}

// Check if location is within allowed geofence
export function isWithinGeofence(
  userLat: number,
  userLng: number,
): { isValid: boolean; location?: string; distance?: number } {
  if (typeof userLat !== "number" || typeof userLng !== "number") {
    console.error("[v0] Invalid user coordinates - must be numbers", { userLat, userLng })
    return { isValid: false }
  }

  if (userLat < -90 || userLat > 90 || userLng < -180 || userLng > 180) {
    console.error("[v0] User coordinates out of valid range", { userLat, userLng })
    return { isValid: false }
  }

  const locations = getAllowedLocations()

  const MIN_GPS_THRESHOLD = 50

  for (const location of locations) {
    // Ensure location coordinates are valid numbers
    if (typeof location.lat !== "number" || typeof location.lng !== "number") {
      console.warn("[v0] Invalid location coordinates", location)
      continue
    }

    const distance = calculateDistance(userLat, userLng, location.lat, location.lng)

    const effectiveRadius = Math.max(location.radius, MIN_GPS_THRESHOLD)

    console.log("[v0] Geofence check:", {
      location: location.name,
      distance,
      effectiveRadius,
      isValid: distance <= effectiveRadius,
    })

    if (distance <= effectiveRadius) {
      return { isValid: true, location: location.name, distance: Math.round(distance) }
    }
  }

  return { isValid: false }
}

// Get nearest allowed location
export function getNearestLocation(userLat: number, userLng: number) {
  if (typeof userLat !== "number" || typeof userLng !== "number") {
    console.error("[v0] Invalid coordinates for nearest location", { userLat, userLng })
    return { location: "Unknown", distance: Number.POSITIVE_INFINITY }
  }

  const locations = getAllowedLocations()
  if (!locations || locations.length === 0) {
    return { location: "No locations available", distance: Number.POSITIVE_INFINITY }
  }

  let nearest = locations[0]
  let minDistance = calculateDistance(userLat, userLng, nearest.lat, nearest.lng)

  for (const location of locations) {
    if (typeof location.lat !== "number" || typeof location.lng !== "number") {
      continue
    }

    const distance = calculateDistance(userLat, userLng, location.lat, location.lng)
    if (distance < minDistance) {
      minDistance = distance
      nearest = location
    }
  }

  return { location: nearest.name, distance: Math.round(minDistance) }
}

// Format location for display
export function formatLocation(lat: number, lng: number): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
}

// Get location accuracy description
export function getAccuracyDescription(accuracy: number): string {
  if (accuracy < 10) return "Excellent"
  if (accuracy < 50) return "Good"
  if (accuracy < 100) return "Fair"
  return "Poor"
}
