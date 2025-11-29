export interface FaceEnrollment {
  studentId: string
  descriptor: number[]
  enrolledAt: string
  enrolledOnce: boolean
}

export let faceDatabase: FaceEnrollment[] = []

export function addFaceEnrollment(studentId: string, descriptor: number[]) {
  const existing = faceDatabase.find((f) => f.studentId === studentId)

  if (existing && existing.enrolledOnce) {
    return { success: false, message: "Face already enrolled. Contact admin for re-enrollment." }
  }

  const enrollment: FaceEnrollment = {
    studentId,
    descriptor,
    enrolledAt: new Date().toISOString(),
    enrolledOnce: true,
  }

  if (existing) {
    Object.assign(existing, enrollment)
  } else {
    faceDatabase.push(enrollment)
  }

  return { success: true, message: "Face enrolled successfully" }
}

export function getFaceEnrollment(studentId: string) {
  return faceDatabase.find((f) => f.studentId === studentId)
}

export function checkFaceEnrolled(studentId: string): boolean {
  const enrollment = faceDatabase.find((f) => f.studentId === studentId)
  return enrollment?.enrolledOnce === true
}

export function getFaceEnrollments() {
  return faceDatabase
}

export function resetFaceEnrollment(studentId: string) {
  const enrollment = faceDatabase.find((f) => f.studentId === studentId)
  if (enrollment) {
    enrollment.enrolledOnce = false
  }
  return { success: true, message: "Face enrollment reset" }
}

export function deleteFaceEnrollment(studentId: string) {
  faceDatabase = faceDatabase.filter((f) => f.studentId !== studentId)
  return { success: true, message: "Face enrollment deleted" }
}
