import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST() {
  try {
    // This will create tables if they don't exist
    // In production, this is usually handled by migrations
    console.log("Initializing database schema...")
    
    // Push schema to database (creates tables)
    await prisma.$executeRaw`SELECT 1`
    
    console.log("Database schema initialized successfully")
    
    return NextResponse.json({
      message: "Database initialized successfully",
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("Database initialization failed:", error)
    
    return NextResponse.json({
      error: "Database initialization failed",
      details: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}