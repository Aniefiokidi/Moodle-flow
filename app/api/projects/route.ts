import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    console.log("=== PROJECTS API DEBUG START ===")
    console.log("Request URL:", request.url)
    console.log("Request cookies:", request.cookies.getAll())
    
    // Try using JWT token instead
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    console.log("Token:", JSON.stringify(token, null, 2))
    console.log("NEXTAUTH_SECRET exists:", !!process.env.NEXTAUTH_SECRET)
    
    if (!token || !token.sub) {
      console.log("No token or user ID found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Current user ID in projects:", token.sub)
    console.log("User role:", token.role)

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    let projects: any[] = []

    if (token.role === "STUDENT") {
      // Students can only see their own projects
      const student = await prisma.student.findUnique({
        where: { userId: token.sub }
      })
      
      if (student) {
        projects = await prisma.project.findMany({
          where: { studentId: student.id },
          include: {
            student: {
              include: { user: true }
            },
            supervisor: {
              include: { user: true }
            }
          },
          orderBy: { createdAt: "desc" }
        })
      }
    } else if (token.role === "SUPERVISOR") {
      // Supervisors can see projects they supervise
      const supervisor = await prisma.supervisor.findUnique({
        where: { userId: token.sub }
      })
      
      if (supervisor) {
        projects = await prisma.project.findMany({
          where: { supervisorId: supervisor.id },
          include: {
            student: {
              include: { user: true }
            },
            supervisor: {
              include: { user: true }
            }
          },
          orderBy: { createdAt: "desc" }
        })
      }
    } else if (token.role === "ADMIN") {
      // Admins can see all projects
      projects = await prisma.project.findMany({
        include: {
          student: {
            include: { user: true }
          },
          supervisor: {
            include: { user: true }
          }
        },
        orderBy: { createdAt: "desc" }
      })
    }

    return NextResponse.json(projects)
  } catch (error) {
    console.error("Get projects error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    
    console.log("Token in POST projects API:", token)
    console.log("Token user in POST:", token?.sub)
    
    if (!token || !token.sub || token.role !== "STUDENT") {
      console.log("POST: No token, user, or not a student")
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { title, description, fileUrl } = await request.json()

    const student = await prisma.student.findUnique({
      where: { userId: token.sub }
    })

    if (!student || !student.supervisorId) {
      return NextResponse.json(
        { error: "Student not found or no supervisor assigned" },
        { status: 400 }
      )
    }

    const project = await prisma.project.create({
      data: {
        title,
        description,
        fileUrl,
        studentId: student.id,
        supervisorId: student.supervisorId,
        status: "SUBMITTED"
      },
      include: {
        student: {
          include: { user: true }
        },
        supervisor: {
          include: { user: true }
        }
      }
    })

    // Create notification for supervisor
    await prisma.notification.create({
      data: {
        userId: project.supervisor.userId,
        message: `New project submission from ${project.student.user.name}: ${title}`,
        type: "PROJECT_SUBMISSION"
      }
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error("Create project error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}