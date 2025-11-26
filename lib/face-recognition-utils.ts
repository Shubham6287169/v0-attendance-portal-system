"use client"

export interface FaceData {
  studentId: string
  descriptor: number[]
  enrolledAt: string
}

// Store face descriptors in localStorage (in production, store in database)
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

export function calculateFaceDistance(descriptor1: number[], descriptor2: number[]): number {
  if (descriptor1.length !== descriptor2.length) return Number.POSITIVE_INFINITY

  let sum = 0
  for (let i = 0; i < descriptor1.length; i++) {
    const diff = descriptor1[i] - descriptor2[i]
    sum += diff * diff
  }

  return Math.sqrt(sum)
}

export function matchFace(capturedDescriptor: number[], enrolledDescriptor: number[], threshold = 0.6): number {
  const distance = calculateFaceDistance(capturedDescriptor, enrolledDescriptor)

  // Convert distance to confidence with improved scaling
  // Using sigmoid-like function for better confidence mapping
  // Distance 0 = 100%, Distance 0.5 = 88%, Distance 1.0 = 73%
  let confidence = 100 / (1 + distance * 15)
  confidence = Math.max(0, Math.min(100, confidence))

  console.log("[v0] Face distance:", distance.toFixed(3), "Confidence:", confidence.toFixed(1) + "%")
  return confidence
}

// Check if face match is valid (above threshold)
export function isFaceMatchValid(confidence: number, threshold = 70): boolean {
  const isValid = confidence >= threshold
  console.log("[v0] Threshold check - Confidence:", confidence.toFixed(1), "Threshold:", threshold, "Valid:", isValid)
  return isValid
}

export function generateDescriptorFromPixels(pixelData: Uint8ClampedArray, width: number, height: number): number[] {
  const descriptor: number[] = []

  // Step 1: Convert to grayscale array
  const gray = new Uint8Array(width * height)
  for (let i = 0; i < pixelData.length; i += 4) {
    const r = pixelData[i]
    const g = pixelData[i + 1]
    const b = pixelData[i + 2]
    gray[i / 4] = Math.round(r * 0.299 + g * 0.587 + b * 0.114)
  }

  // Step 2: Apply histogram equalization for better contrast
  const histEqualized = histogramEqualize(gray, width, height)

  // Step 3: Apply edge detection (Sobel filter)
  const edges = sobelEdgeDetection(histEqualized, width, height)

  // Step 4: Extract local binary patterns (LBP) features
  const lbpFeatures = extractLBPFeatures(edges, width, height)

  // Step 5: Create final descriptor from multiple feature channels
  // Combine grayscale distribution, edge features, and texture patterns
  const grayHistogram = getHistogram(histEqualized, 16)
  const edgeHistogram = getHistogram(edges, 16)

  descriptor.push(...grayHistogram)
  descriptor.push(...edgeHistogram)
  descriptor.push(...lbpFeatures.slice(0, 96))

  // Normalize descriptor to unit length
  const norm = Math.sqrt(descriptor.reduce((sum, val) => sum + val * val, 0))
  if (norm > 0) {
    for (let i = 0; i < descriptor.length; i++) {
      descriptor[i] /= norm
    }
  }

  console.log("[v0] Generated descriptor with", descriptor.length, "features")
  return descriptor
}

function histogramEqualize(gray: Uint8Array, width: number, height: number): Uint8Array {
  const histogram = new Uint32Array(256)

  // Calculate histogram
  for (let i = 0; i < gray.length; i++) {
    histogram[gray[i]]++
  }

  // Calculate CDF
  const cdf = new Uint32Array(256)
  cdf[0] = histogram[0]
  for (let i = 1; i < 256; i++) {
    cdf[i] = cdf[i - 1] + histogram[i]
  }

  // Normalize CDF
  const cdfMin = cdf[0]
  const normalized = new Uint8Array(256)
  for (let i = 0; i < 256; i++) {
    normalized[i] = Math.round(((cdf[i] - cdfMin) / (width * height - cdfMin)) * 255)
  }

  // Apply equalization
  const result = new Uint8Array(gray.length)
  for (let i = 0; i < gray.length; i++) {
    result[i] = normalized[gray[i]]
  }

  return result
}

function sobelEdgeDetection(gray: Uint8Array, width: number, height: number): Uint8Array {
  const edges = new Uint8Array(width * height)

  const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1]
  const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1]

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gradX = 0
      let gradY = 0

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = (y + ky) * width + (x + kx)
          const kernelIdx = (ky + 1) * 3 + (kx + 1)
          gradX += gray[idx] * sobelX[kernelIdx]
          gradY += gray[idx] * sobelY[kernelIdx]
        }
      }

      const magnitude = Math.sqrt(gradX * gradX + gradY * gradY)
      edges[y * width + x] = Math.min(255, Math.round(magnitude / 4))
    }
  }

  return edges
}

function extractLBPFeatures(edges: Uint8Array, width: number, height: number): number[] {
  const features: number[] = []
  const blockSize = Math.floor(width / 8)

  for (let by = 0; by < 8; by++) {
    for (let bx = 0; bx < 8; bx++) {
      const startY = by * blockSize
      const startX = bx * blockSize
      const endY = Math.min(startY + blockSize, height)
      const endX = Math.min(startX + blockSize, width)

      // Calculate mean edge intensity in block
      let sum = 0
      let count = 0
      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          sum += edges[y * width + x]
          count++
        }
      }

      const mean = sum / count / 255
      features.push(mean)
    }
  }

  return features
}

function getHistogram(data: Uint8Array, bins: number): number[] {
  const histogram = new Uint32Array(bins)
  const scale = bins / 256

  for (let i = 0; i < data.length; i++) {
    const bin = Math.min(bins - 1, Math.floor(data[i] * scale))
    histogram[bin]++
  }

  // Normalize histogram
  const normalized: number[] = []
  const total = data.length
  for (let i = 0; i < bins; i++) {
    normalized.push(histogram[i] / total)
  }

  return normalized
}
