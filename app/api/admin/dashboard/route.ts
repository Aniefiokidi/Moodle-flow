import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      )
    }

    // Get total counts
    const [totalStudents, totalSupervisors, totalProjects] = await Promise.all([
      prisma.student.count(),
      prisma.supervisor.count(),
      prisma.project.count()
    ])

    const totalUsers = totalStudents + totalSupervisors + 1 // +1 for admin

    // Get project statistics
    const [approvedProjects, pendingProjects, revisionProjects] = await Promise.all([
      prisma.project.count({ where: { status: 'APPROVED' } }),
      prisma.project.count({ where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } } }),
      prisma.project.count({ where: { status: 'NEEDS_REVISION' } })
    ])

    // Get supervisor statistics
    const supervisorStats = await prisma.supervisor.findMany({
      include: {
        user: true,
        students: {
          include: {
            user: true,
            projects: true
          }
        }
      }
    })

    const formattedSupervisorStats = supervisorStats.map(supervisor => ({
      id: supervisor.user.id, // Use user ID instead of supervisor record ID
      supervisorId: supervisor.id, // Keep supervisor record ID for reference
      name: supervisor.user.name,
      email: supervisor.user.email,
      course: supervisor.course,
      students: supervisor.students.length,
      pendingReviews: supervisor.students.reduce((acc, student) => {
        return acc + student.projects.filter(project => 
          project.status === 'SUBMITTED' || project.status === 'UNDER_REVIEW'
        ).length
      }, 0),
      completedProjects: supervisor.students.reduce((acc, student) => {
        return acc + student.projects.filter(project => 
          project.status === 'APPROVED'
        ).length
      }, 0)
    }))

    // Get recent activity (messages, project submissions, etc.)
    const recentProjects = await prisma.project.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          include: {
            user: true
          }
        },
        supervisor: {
          include: {
            user: true
          }
        }
      }
    })

    const recentActivity = recentProjects.map(project => {
      let type = 'PROJECT_SUBMITTED'
      let message = `${project.student.user.name} submitted project: ${project.title}`
      
      if (project.status === 'APPROVED') {
        type = 'PROJECT_APPROVED'
        message = `${project.supervisor.user.name} approved ${project.student.user.name}'s project`
      } else if (project.status === 'NEEDS_REVISION') {
        type = 'PROJECT_REVISION'
        message = `${project.supervisor.user.name} requested revisions for ${project.student.user.name}'s project`
      }

      return {
        id: project.id,
        type,
        message,
        timestamp: project.updatedAt
      }
    })

    const dashboardData = {
      totalUsers,
      totalStudents,
      totalSupervisors,
      totalProjects,
      pendingReviews: pendingProjects,
      approvedProjects,
      needsRevision: revisionProjects,
      supervisorStats: formattedSupervisorStats,
      recentActivity
    }

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error("Admin dashboard API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch admin dashboard data" },
      { status: 500 }
    )
  }
}