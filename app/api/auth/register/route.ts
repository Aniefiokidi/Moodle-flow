import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { HOD_TOKEN } from "@/lib/constants/courses"

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role, course, hodToken } = await request.json()

    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate course for students and supervisors
    if ((role === "STUDENT" || role === "SUPERVISOR") && !course) {
      return NextResponse.json(
        { error: "Course is required for students and supervisors" },
        { status: 400 }
      )
    }

    // Validate HOD token for admin registration
    if (role === "ADMIN") {
      if (!hodToken || hodToken !== HOD_TOKEN) {
        return NextResponse.json(
          { error: "Invalid HOD authorization token" },
          { status: 401 }
        )
      }
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
      }
    })

    // Create role-specific record
    if (role === "STUDENT") {
      await prisma.student.create({
        data: {
          userId: user.id,
          course: course,
        }
      })
    } else if (role === "SUPERVISOR") {
      await prisma.supervisor.create({
        data: {
          userId: user.id,
          course: course,
        }
      })
    } else if (role === "ADMIN") {
      await prisma.admin.create({
        data: {
          userId: user.id,
        }
      })
    }

    return NextResponse.json(
      { message: "User created successfully", userId: user.id },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    
    // More specific error handling
    if (error instanceof Error) {
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }
    
    // Check if it's a Prisma error
    if (error && typeof error === 'object' && 'code' in error) {
      console.error("Prisma error code:", (error as any).code)
      console.error("Prisma error meta:", (error as any).meta)
    }
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: process.env.NODE_ENV === 'development' ? error?.toString() : undefined
      },
      { status: 500 }
    )
  }
}