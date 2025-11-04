import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      )
    }

    // Get all unassigned students
    const unassignedStudents = await prisma.student.findMany({
      where: {
        supervisorId: null
      },
      include: {
        user: true
      }
    })

    if (unassignedStudents.length === 0) {
      return NextResponse.json(
        { message: "No unassigned students found", assignments: [] },
        { status: 200 }
      )
    }

    // Get all supervisors with their current student counts
    const supervisors = await prisma.supervisor.findMany({
      include: {
        user: true,
        students: {
          include: {
            user: true
          }
        }
      }
    })

    if (supervisors.length === 0) {
      return NextResponse.json(
        { error: "No supervisors available for assignment" },
        { status: 400 }
      )
    }

    // Calculate optimal assignment parameters
    const totalStudents = unassignedStudents.length
    const totalSupervisors = supervisors.length
    const maxStudentsPerSupervisor = Math.ceil(totalStudents / totalSupervisors)
    
    // Add buffer to prevent overloading (max 6 students per supervisor)
    const finalMaxPerSupervisor = Math.min(maxStudentsPerSupervisor, 6)

    console.log(`Auto-assignment parameters:`)
    console.log(`- Unassigned students: ${totalStudents}`)
    console.log(`- Available supervisors: ${totalSupervisors}`)
    console.log(`- Max students per supervisor: ${finalMaxPerSupervisor}`)

    // Create assignment plan
    const assignments = []
    const shuffledStudents = [...unassignedStudents].sort(() => Math.random() - 0.5) // Random shuffle
    
    // Track current assignments per supervisor
    const supervisorLoads = supervisors.map(supervisor => ({
      id: supervisor.id,
      name: supervisor.user.name,
      email: supervisor.user.email,
      course: (supervisor as any).course,
      currentStudents: supervisor.students.length,
      newAssignments: [] as any[]
    }))

    // Distribute students
    for (const student of shuffledStudents) {
      // Find supervisors with capacity, preferring same course and lowest load
      const availableSupervisors = supervisorLoads
        .filter(supervisor => supervisor.currentStudents + supervisor.newAssignments.length < finalMaxPerSupervisor)
        .sort((a, b) => {
          // Prefer same course - using type assertion for course field
          const studentCourse = (student as any).course
          const aMatchesCourse = a.course === studentCourse ? -1 : 1
          const bMatchesCourse = b.course === studentCourse ? -1 : 1
          
          if (aMatchesCourse !== bMatchesCourse) {
            return aMatchesCourse - bMatchesCourse
          }
          
          // Then prefer lower load
          const aLoad = a.currentStudents + a.newAssignments.length
          const bLoad = b.currentStudents + b.newAssignments.length
          return aLoad - bLoad
        })

      if (availableSupervisors.length > 0) {
        const selectedSupervisor = availableSupervisors[0]
        selectedSupervisor.newAssignments.push(student)
        
        assignments.push({
          studentId: student.id,
          studentName: student.user.name,
          studentEmail: student.user.email,
          studentCourse: (student as any).course,
          supervisorId: selectedSupervisor.id,
          supervisorName: selectedSupervisor.name,
          supervisorEmail: selectedSupervisor.email,
          supervisorCourse: selectedSupervisor.course,
          matchesCourse: selectedSupervisor.course === (student as any).course
        })
      }
    }

    if (assignments.length === 0) {
      return NextResponse.json(
        { message: "All supervisors are at capacity", assignments: [] },
        { status: 200 }
      )
    }

    // Execute the assignments in the database
    const updatePromises = assignments.map(assignment =>
      prisma.student.update({
        where: { id: assignment.studentId },
        data: { supervisorId: assignment.supervisorId }
      })
    )

    await Promise.all(updatePromises)

    // Generate assignment summary
    const summary = {
      totalAssigned: assignments.length,
      totalUnassigned: totalStudents - assignments.length,
      supervisorDistribution: supervisorLoads
        .filter(supervisor => supervisor.newAssignments.length > 0)
        .map(supervisor => ({
          name: supervisor.name,
          email: supervisor.email,
          course: supervisor.course,
          previousStudents: supervisor.currentStudents,
          newAssignments: supervisor.newAssignments.length,
          totalStudents: supervisor.currentStudents + supervisor.newAssignments.length
        })),
      courseMatches: assignments.filter(a => a.matchesCourse).length,
      courseMismatches: assignments.filter(a => !a.matchesCourse).length
    }

    return NextResponse.json({
      success: true,
      message: `Successfully assigned ${assignments.length} students to supervisors`,
      assignments,
      summary
    })

  } catch (error) {
    console.error("Auto-assignment error:", error)
    return NextResponse.json(
      { error: "Failed to auto-assign students" },
      { status: 500 }
    )
  }
}