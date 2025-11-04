import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Current user ID:", session.user.id)

    // Get student data with supervisor and projects
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
      include: {
        supervisor: {
          include: {
            user: true
          }
        },
        projects: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    console.log("Found student:", student)

    if (!student) {
      // Return empty data instead of error for now
      return NextResponse.json({
        student: {
          id: null,
          course: null,
          userId: session.user.id
        },
        supervisor: null,
        projects: [],
        recentMessages: []
      })
    }

    // Get recent messages
    const recentMessages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: session.user.id },
          { receiverId: session.user.id }
        ]
      },
      include: {
        sender: true,
        receiver: true
      },
      orderBy: { timestamp: 'desc' },
      take: 5
    })

    const response = {
      student: {
        id: student.id,
        course: student.course,
        userId: student.userId
      },
      supervisor: student.supervisor ? {
        id: student.supervisor.user.id, // Use user.id instead of supervisor.id for messages
        name: student.supervisor.user.name,
        email: student.supervisor.user.email,
        course: student.supervisor.course
      } : null,
      projects: student.projects.map(project => ({
        id: project.id,
        title: project.title,
        description: project.description,
        status: project.status,
        submissionDate: project.submissionDate.toISOString(),
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString()
      })),
      recentMessages: recentMessages.map(message => ({
        id: message.id,
        sender: message.sender.name,
        senderId: message.senderId,
        preview: message.content.length > 50 ? message.content.substring(0, 50) + "..." : message.content,
        timestamp: message.timestamp.toISOString(),
        unread: !message.read && message.receiverId === session.user.id,
        messageType: message.messageType
      }))
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching student data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}