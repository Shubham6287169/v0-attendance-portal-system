import { type NextRequest, NextResponse } from "next/server"
import { getFaceEnrollment } from "@/lib/face-database"

function calculateFaceDistance(descriptor1: number[], descriptor2: number[]): number {
  if (descriptor1.length !== descriptor2.length) return Number.POSITIVE_INFINITY

  let sum = 0
  for (let i = 0; i < descriptor1.length; i++) {
    const diff = descriptor1[i] - descriptor2[i]
    sum += diff * diff
  }

  return Math.sqrt(sum)
}

function calculateConfidence(distance: number): number {
  // Convert distance to confidence using sigmoid-like function
  let confidence = 100 / (1 + distance * 15)
  confidence = Math.max(0, Math.min(100, confidence))
  return confidence
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId, descriptor } = body

    if (!studentId || !descriptor || !Array.isArray(descriptor)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 })
    }

    const enrolled = getFaceEnrollment(studentId)

    console.log("[v0] Face match attempt for student:", studentId, "Enrolled:", !!enrolled)

    if (!enrolled) {
      return NextResponse.json({
        matched: false,
        confidence: 0,
        message: "Face not enrolled for this student",
      })
    }

    // Calculate distance between descriptors
    const distance = calculateFaceDistance(descriptor, enrolled.descriptor)
    const confidence = calculateConfidence(distance)
    const threshold = 70
    const matched = confidence >= threshold

    console.log("[v0] Face match result:", {
      studentId,
      distance: distance.toFixed(3),
      confidence: confidence.toFixed(1),
      matched,
      threshold,
    })

    return NextResponse.json({
      matched,
      confidence: Math.round(confidence),
      distance: Number.parseFloat(distance.toFixed(3)),
      message: matched
        ? "Face matched successfully"
        : `Face confidence ${Math.round(confidence)}% below threshold of ${threshold}%`,
    })
  } catch (error) {
    console.error("[v0] Face match error:", error)
    return NextResponse.json({ error: "Matching failed" }, { status: 500 })
  }
}
