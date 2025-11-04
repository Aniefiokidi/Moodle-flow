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

    // Verify supervisor role and get supervisor data
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        supervisor: {
          include: {
            students: {
              include: {
                user: true
              }
            }
          }
        }
      }
    })

    if (!user || user.role !== 'SUPERVISOR' || !user.supervisor) {
      return NextResponse.json({ error: 'Supervisor access required' }, { status: 403 })
    }

    const { studentId, subject, content } = await request.json()

    if (!studentId || !subject || !content) {
      return NextResponse.json({ error: 'Student ID, subject and content are required' }, { status: 400 })
    }

    // Verify the student belongs to this supervisor
    const student = user.supervisor.students.find(s => s.user.id === studentId)
    if (!student) {
      return NextResponse.json({ error: 'Student not found or not assigned to you' }, { status: 404 })
    }

    // Create message record
    const message = await prisma.message.create({
      data: {
        senderId: user.id,
        receiverId: studentId,
        messageType: 'TEXT',
        content: JSON.stringify({
          subject,
          body: content
        }),
        timestamp: new Date(),
        read: false
      }
    })

    console.log(`Supervisor ${user.name} sent message to student ${student.user.name}:`)
    console.log(`Subject: ${subject}`)
    console.log(`Content: ${content}`)

    return NextResponse.json({ 
      success: true, 
      message: 'Message sent successfully',
      messageId: message.id
    })

  } catch (error) {
    console.error('Error sending supervisor message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}