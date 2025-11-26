"use client"

// Face descriptor storage (in production, store in database)
export interface FaceData {
  studentId: string
  descriptor: number[]
  enrolledAt: string
}

// Store face descriptors in localStorage (in production, use database)
const FACE_STORAGE_KEY = "face_descriptors"

export function storeFaceDescriptor(studentId: string, descriptor: number[]) {
  const stored = localStorage.getItem(FACE_STORAGE_KEY)
  const descriptors: FaceData[] = stored ? JSON.parse(stored) : []

  // Remove existing descriptor for this student
  const filtered = descriptors.filter((d) => d.studentId !== studentId)

  // Add new descriptor
  filtered.push({
    studentId,
    descriptor,
    enrolledAt: new Date().toISOString(),
  })

  localStorage.setItem(FACE_STORAGE_KEY, JSON.stringify(filtered))
}

export function getFaceDescriptor(studentId: string): FaceData | null {
  const stored = localStorage.getItem(FACE_STORAGE_KEY)
  if (!stored) return null

  const descriptors: FaceData[] = JSON.parse(stored)
  return descriptors.find((d) => d.studentId === studentId) || null
}

// Calculate Euclidean distance between two face descriptors
export function calculateFaceDistance(descriptor1: number[], descriptor2: number[]): number {
  if (descriptor1.length !== descriptor2.length) return Number.POSITIVE_INFINITY

  let sum = 0
  for (let i = 0; i < descriptor1.length; i++) {
    const diff = descriptor1[i] - descriptor2[i]
    sum += diff * diff
  }

  return Math.sqrt(sum)
}

// Match face with threshold (lower distance = better match)
export function matchFace(capturedDescriptor: number[], enrolledDescriptor: number[], threshold = 0.6): number {
  const distance = calculateFaceDistance(capturedDescriptor, enrolledDescriptor)

  // Convert distance to confidence percentage
  // Distance 0 = 100% match, Distance increases = lower confidence
  // Max useful distance is around 2.0, anything above is definitely not a match
  let confidence = Math.max(0, 100 - distance * 50)
  confidence = Math.min(100, confidence)

  console.log("[v0] Distance:", distance, "Confidence:", confidence)
  return confidence
}

// Check if face match is valid (above threshold)
export function isFaceMatchValid(confidence: number, threshold = 70): boolean {
  const isValid = confidence >= threshold
  console.log("[v0] Threshold check - Confidence:", confidence, "Threshold:", threshold, "Valid:", isValid)
  return isValid
}

// Generate deterministic descriptor from pixel data
export function generateDescriptorFromPixels(pixelData: Uint8ClampedArray, width: number, height: number): number[] {
  const descriptor: number[] = []

  // Sample pixels at regular intervals to create a 128-dimensional descriptor
  const step = Math.max(1, Math.floor(pixelData.length / 4 / 128))

  for (let i = 0; i < 128; i++) {
    const pixelIndex = (i * step * 4) % pixelData.length
    // Get RGB values and convert to grayscale
    const r = pixelData[pixelIndex]
    const g = pixelData[pixelIndex + 1]
    const b = pixelData[pixelIndex + 2]
    const gray = (r * 0.299 + g * 0.587 + b * 0.114) / 255
    // Normalize to -1 to 1 range
    descriptor.push(gray * 2 - 1)
  }

  return descriptor
}
