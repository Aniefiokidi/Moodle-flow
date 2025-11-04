import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    console.log("=== STUDENT PROJECTS API DEBUG START ===")
    console.log("Request URL:", request.url)
    
    const session = await getServerSession(authOptions)
    console.log("Session:", JSON.stringify(session, null, 2))
    
    if (!session?.user?.id) {
      console.log("No session or user ID found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Current user ID in student projects:", session.user.id)

    // Get student data
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id }
    })

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Get student's projects
    const projects = await prisma.project.findMany({
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

    return NextResponse.json(projects)
  } catch (error) {
    console.error("Error fetching student projects:", error)
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Current user ID in student projects POST:", session.user.id)

    const { title, description, fileUrl } = await request.json()

    const student = await prisma.student.findUnique({
      where: { userId: session.user.id }
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
        status: "SUBMITTED",
        submissionDate: new Date()
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

    return NextResponse.json(project)
  } catch (error) {
    console.error("Error creating project:", error)
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    )
  }
}