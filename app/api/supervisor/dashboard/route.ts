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

    console.log("Current supervisor user ID:", session.user.id)

    // Get supervisor data with students and their projects
    const supervisor = await prisma.supervisor.findUnique({
      where: { userId: session.user.id },
      include: {
        students: {
          include: {
            user: true,
            projects: {
              orderBy: { createdAt: 'desc' },
              take: 1 // Get the latest project for each student
            }
          }
        }
      }
    })

    console.log("Found supervisor:", supervisor)

    if (!supervisor) {
      // Return empty data instead of error for now
      return NextResponse.json({
        supervisor: {
          id: null,
          course: null,
          userId: session.user.id
        },
        students: [],
        recentMessages: []
      })
    }

    // Get recent messages for this supervisor
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
      take: 10
    })

    const response = {
      supervisor: {
        id: supervisor.id,
        course: supervisor.course,
        userId: supervisor.userId
      },
      students: supervisor.students.map(student => ({
        id: student.id,
        userId: student.userId,
        name: student.user.name,
        email: student.user.email,
        course: student.course,
        project: student.projects.length > 0 ? {
          id: student.projects[0].id,
          title: student.projects[0].title,
          description: student.projects[0].description,
          status: student.projects[0].status,
          submissionDate: student.projects[0].submissionDate.toISOString(),
          createdAt: student.projects[0].createdAt.toISOString(),
          updatedAt: student.projects[0].updatedAt.toISOString()
        } : null
      })),
      recentMessages: recentMessages.map(message => ({
        id: message.id,
        sender: message.sender.name,
        senderId: message.senderId,
        receiverId: message.receiverId,
        preview: message.content.length > 50 ? message.content.substring(0, 50) + "..." : message.content,
        timestamp: message.timestamp.toISOString(),
        unread: !message.read && message.receiverId === session.user.id,
        messageType: message.messageType
      }))
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching supervisor data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}