import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify student role and get student data
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        student: {
          include: {
            supervisor: {
              include: {
                user: true
              }
            }
          }
        }
      }
    })

    if (!user || user.role !== 'STUDENT' || !user.student) {
      return NextResponse.json({ error: 'Student access required' }, { status: 403 })
    }

    if (!user.student.supervisor) {
      return NextResponse.json({ error: 'No supervisor assigned' }, { status: 400 })
    }

    const { subject, content } = await request.json()

    if (!subject || !content) {
      return NextResponse.json({ error: 'Subject and content are required' }, { status: 400 })
    }

    // Create message record
    const message = await prisma.message.create({
      data: {
        senderId: user.id,
        receiverId: user.student.supervisor.user.id,
        messageType: 'TEXT',
        content: JSON.stringify({
          subject,
          body: content
        }),
        timestamp: new Date(),
        read: false
      }
    })

    console.log(`Student ${user.name} sent message to supervisor ${user.student.supervisor.user.name}:`)
    console.log(`Subject: ${subject}`)
    console.log(`Content: ${content}`)

    return NextResponse.json({ 
      success: true, 
      message: 'Message sent successfully',
      messageId: message.id
    })

  } catch (error) {
    console.error('Error sending student message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}