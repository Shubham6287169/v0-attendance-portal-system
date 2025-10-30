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

  // Convert distance to confidence percentage (0-100)
  // Distance < 0.3 = excellent match, Distance > 1.0 = poor match
  const confidence = Math.max(0, Math.min(100, 100 - distance * 100))

  return confidence
}

// Check if face match is valid (above threshold)
export function isFaceMatchValid(confidence: number, threshold = 70): boolean {
  return confidence >= threshold
}
