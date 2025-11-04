import { NextApiRequest } from "next"
import { NextApiResponseServerIO } from "@/lib/socket"
import { Server as ServerIO } from "socket.io"
import { Server as NetServer } from "http"

export default function SocketHandler(req: NextApiRequest, res: NextApiResponseServerIO) {
  if (!res.socket.server.io) {
    console.log('Setting up Socket.io server...')
    
    const httpServer: NetServer = res.socket.server as any
    const io = new ServerIO(httpServer, {
      path: "/api/socket/io",
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    })

    // Socket connection handling
    io.on("connection", (socket) => {
      console.log(`User connected: ${socket.id}`)

      // Join user to their personal room for targeted messaging
      socket.on("join-user", (userId: string) => {
        socket.join(`user-${userId}`)
        console.log(`User ${userId} joined room user-${userId}`)
      })

      // Handle sending messages
      socket.on("send-message", (data) => {
        const { receiverId, message } = data
        
        // Emit to specific user
        socket.to(`user-${receiverId}`).emit("new-message", message)
        
        // Also emit notification
        socket.to(`user-${receiverId}`).emit("new-notification", {
          type: "NEW_MESSAGE",
          message: `New message from ${message.sender.name}`,
          timestamp: new Date().toISOString()
        })
      })

      // Handle project submission notifications
      socket.on("project-submitted", (data) => {
        const { supervisorId, project } = data
        
        socket.to(`user-${supervisorId}`).emit("new-notification", {
          type: "PROJECT_SUBMITTED",
          message: `New project submission: ${project.title}`,
          timestamp: new Date().toISOString()
        })
      })

      // Handle project review notifications
      socket.on("project-reviewed", (data) => {
        const { studentId, project } = data
        
        socket.to(`user-${studentId}`).emit("new-notification", {
          type: "PROJECT_REVIEWED",
          message: `Your project "${project.title}" has been reviewed`,
          timestamp: new Date().toISOString()
        })
      })

      // Handle user typing indicators
      socket.on("typing-start", (data) => {
        const { receiverId, senderName } = data
        socket.to(`user-${receiverId}`).emit("user-typing", { senderName })
      })

      socket.on("typing-stop", (data) => {
        const { receiverId } = data
        socket.to(`user-${receiverId}`).emit("user-stop-typing")
      })

      // Handle disconnection
      socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`)
      })
    })

    res.socket.server.io = io
  }
  
  res.end()
}