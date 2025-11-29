export let faceDatabase: Array<{
  studentId: string
  descriptor: number[]
  enrolledAt: string
}> = []

export function addFaceEnrollment(studentId: string, descriptor: number[]) {
  // Remove old enrollment for this student
  faceDatabase = faceDatabase.filter((f) => f.studentId !== studentId)
  // Add new enrollment
  faceDatabase.push({
    studentId,
    descriptor,
    enrolledAt: new Date().toISOString(),
  })
}

export function getFaceEnrollment(studentId: string) {
  return faceDatabase.find((f) => f.studentId === studentId)
}

export function checkFaceEnrolled(studentId: string): boolean {
  return faceDatabase.some((f) => f.studentId === studentId)
}
