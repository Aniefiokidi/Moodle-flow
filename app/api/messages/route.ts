import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const otherUserId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (otherUserId) {
      // Get conversation between current user and specific user
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: user.id, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: user.id }
          ]
        },
        orderBy: { timestamp: 'desc' },
        take: limit,
        include: {
          sender: {
            select: { id: true, name: true, email: true, role: true }
          },
          receiver: {
            select: { id: true, name: true, email: true, role: true }
          }
        }
      })

      // Mark messages as read (messages sent to current user)
      await prisma.message.updateMany({
        where: {
          senderId: otherUserId,
          receiverId: user.id,
          read: false
        },
        data: { read: true }
      })

      return NextResponse.json({
        messages: messages.map(message => ({
          id: message.id,
          content: (() => {
            try {
              return typeof message.content === 'string' ? JSON.parse(message.content) : message.content
            } catch {
              // If JSON parsing fails, treat as plain text message
              return { subject: "Message", body: message.content }
            }
          })(),
          timestamp: message.timestamp,
          read: message.read,
          sender: message.sender,
          receiver: message.receiver,
          isSentByMe: message.senderId === user.id
        }))
      })

    } else {
      // Get all conversations (list of users current user has messaged with)
      const sentMessages = await prisma.message.findMany({
        where: { senderId: user.id },
        select: { receiverId: true },
        distinct: ['receiverId']
      })

      const receivedMessages = await prisma.message.findMany({
        where: { receiverId: user.id },
        select: { senderId: true },
        distinct: ['senderId']
      })

      const userIds = [
        ...sentMessages.map(m => m.receiverId),
        ...receivedMessages.map(m => m.senderId)
      ]

      const uniqueUserIds = [...new Set(userIds)]

      const conversations = await Promise.all(
        uniqueUserIds.map(async (userId) => {
          const otherUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, role: true }
          })

          const lastMessage = await prisma.message.findFirst({
            where: {
              OR: [
                { senderId: user.id, receiverId: userId },
                { senderId: userId, receiverId: user.id }
              ]
            },
            orderBy: { timestamp: 'desc' }
          })

          const unreadCount = await prisma.message.count({
            where: {
              senderId: userId,
              receiverId: user.id,
              read: false
            }
          })

          return {
            user: otherUser,
            lastMessage: lastMessage ? {
              content: (() => {
                try {
                  return typeof lastMessage.content === 'string' ? JSON.parse(lastMessage.content) : lastMessage.content
                } catch {
                  // If JSON parsing fails, treat as plain text message
                  return { subject: "Message", body: lastMessage.content }
                }
              })(),
              timestamp: lastMessage.timestamp,
              isSentByMe: lastMessage.senderId === user.id
            } : null,
            unreadCount
          }
        })
      )

      return NextResponse.json({
        conversations: conversations.filter(c => c.user !== null)
      })
    }

  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  console.log('=== MESSAGES API POST REQUEST STARTED ===')
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { receiverId, content, messageType = "TEXT", fileUrl } = body

    console.log('POST /api/messages request body:', { receiverId, content, messageType, fileUrl })
    console.log('Current user:', user.id, user.email)

    if (!receiverId || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        senderId: user.id,
        receiverId,
        content: typeof content === 'string' ? content : JSON.stringify(content),
        messageType,
        fileUrl,
        timestamp: new Date(),
        read: false
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true, role: true }
        },
        receiver: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    })

    return NextResponse.json({
      id: message.id,
      content: (() => {
        try {
          return typeof message.content === 'string' ? JSON.parse(message.content) : message.content
        } catch {
          // If JSON parsing fails, treat as plain text message
          return { subject: "Message", body: message.content }
        }
      })(),
      timestamp: message.timestamp,
      read: message.read,
      sender: message.sender,
      receiver: message.receiver,
      isSentByMe: true
    })

  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
// Force reload