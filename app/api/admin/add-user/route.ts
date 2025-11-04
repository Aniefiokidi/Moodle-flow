import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { name, email, role, course } = await request.json()

    if (!name || !email || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate role
    const validRoles = ['STUDENT', 'SUPERVISOR', 'ADMIN']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Validate course for students and supervisors
    const validCourses = ['COMPUTER_SCIENCE', 'MIS']
    if ((role === 'STUDENT' || role === 'SUPERVISOR') && !validCourses.includes(course)) {
      return NextResponse.json({ error: 'Course is required for students and supervisors' }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 })
    }

    // Generate a temporary password (in production, you'd send this via email)
    const tempPassword = Math.random().toString(36).slice(-8)
    const hashedPassword = await bcrypt.hash(tempPassword, 10)

    // Create the user and associated role record
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        role: role as any
      }
    })

    // Create the associated role record
    let roleRecord = null
    if (role === 'STUDENT') {
      roleRecord = await prisma.student.create({
        data: {
          userId: newUser.id,
          course: course as any
        }
      })
    } else if (role === 'SUPERVISOR') {
      roleRecord = await prisma.supervisor.create({
        data: {
          userId: newUser.id,
          course: course as any
        }
      })
    } else if (role === 'ADMIN') {
      roleRecord = await prisma.admin.create({
        data: {
          userId: newUser.id
        }
      })
    }

    return NextResponse.json({ 
      success: true, 
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        course: course || null
      },
      tempPassword, // In production, don't return this - send via email instead
      message: 'User created successfully' 
    })

  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}