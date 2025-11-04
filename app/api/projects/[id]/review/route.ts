import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "SUPERVISOR") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { status, feedback } = await request.json()
    const { id: projectId } = await params

    // Validate status
    const validStatuses = ["UNDER_REVIEW", "NEEDS_REVISION", "APPROVED"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      )
    }

    // Check if project exists and belongs to this supervisor
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        supervisor: {
          userId: session.user.id
        }
      },
      include: {
        student: {
          include: {
            user: true
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or unauthorized" },
        { status: 404 }
      )
    }

    // Update project status
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: { status }
    })

    // Create notification for student
    let notificationMessage = ""
    switch (status) {
      case "UNDER_REVIEW":
        notificationMessage = `Your project "${project.title}" is now under review`
        break
      case "NEEDS_REVISION":
        notificationMessage = `Your project "${project.title}" needs revision. Please check the feedback.`
        break
      case "APPROVED":
        notificationMessage = `Congratulations! Your project "${project.title}" has been approved.`
        break
    }

    await prisma.notification.create({
      data: {
        userId: project.student.userId,
        message: notificationMessage,
        type: "PROJECT_FEEDBACK"
      }
    })

    // If feedback is provided, send it as a message
    if (feedback && feedback.trim()) {
      await prisma.message.create({
        data: {
          senderId: session.user.id,
          receiverId: project.student.userId,
          content: `Feedback for "${project.title}": ${feedback}`,
          messageType: "TEXT"
        }
      })

      // Create notification for the feedback message
      await prisma.notification.create({
        data: {
          userId: project.student.userId,
          message: `New feedback from your supervisor`,
          type: "NEW_MESSAGE"
        }
      })
    }

    return NextResponse.json(updatedProject)
  } catch (error) {
    console.error("Review submission error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}