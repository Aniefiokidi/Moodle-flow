"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createProject(formData: FormData) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== "STUDENT") {
      throw new Error("Unauthorized")
    }

    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const fileUrl = formData.get("fileUrl") as string

    if (!title || !description) {
      throw new Error("Title and description are required")
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.user.id }
    })

    if (!student || !student.supervisorId) {
      throw new Error("Student not found or no supervisor assigned")
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

    // Create notification for supervisor
    await prisma.notification.create({
      data: {
        userId: project.supervisor.userId,
        message: `New project submission from ${project.student.user.name}: ${title}`,
        type: "PROJECT_SUBMISSION"
      }
    })

    revalidatePath("/dashboard/student/projects")
    return { success: true, project }
    
  } catch (error) {
    console.error("Error creating project:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create project" 
    }
  }
}

export async function getStudentProjects() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== "STUDENT") {
      throw new Error("Unauthorized")
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.user.id }
    })

    if (!student) {
      throw new Error("Student not found")
    }

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

    return { success: true, projects }
    
  } catch (error) {
    console.error("Error fetching student projects:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch projects" 
    }
  }
}