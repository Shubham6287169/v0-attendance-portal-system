// Allowed attendance locations (in production, fetch from database)
export const ALLOWED_LOCATIONS = [
  { name: "Building A", lat: 40.7128, lng: -74.006, radius: 100 }, // 100 meters radius
  { name: "Building B", lat: 40.758, lng: -73.9855, radius: 100 },
  { name: "Campus Center", lat: 40.7489, lng: -73.968, radius: 150 },
]

// Calculate distance between two coordinates using Haversine formula
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000 // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Check if location is within allowed geofence
export function isWithinGeofence(
  userLat: number,
  userLng: number,
): { isValid: boolean; location?: string; distance?: number } {
  for (const location of ALLOWED_LOCATIONS) {
    const distance = calculateDistance(userLat, userLng, location.lat, location.lng)
    if (distance <= location.radius) {
      return { isValid: true, location: location.name, distance: Math.round(distance) }
    }
  }
  return { isValid: false }
}

// Get nearest allowed location
export function getNearestLocation(userLat: number, userLng: number) {
  let nearest = ALLOWED_LOCATIONS[0]
  let minDistance = calculateDistance(userLat, userLng, nearest.lat, nearest.lng)

  for (const location of ALLOWED_LOCATIONS) {
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
