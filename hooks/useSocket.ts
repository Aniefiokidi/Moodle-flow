"use client"

import { useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { io, Socket } from "socket.io-client"

export const useSocket = () => {
  const { data: session } = useSession()
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!session?.user?.id) return

    // Initialize socket connection
    socketRef.current = io(process.env.NODE_ENV === 'production' ? process.env.NEXTAUTH_URL || '' : 'http://localhost:3000', {
      path: '/api/socket/io',
      addTrailingSlash: false,
    })

    const socket = socketRef.current

    // Join user room on connection
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id)
      socket.emit('join-user', session.user.id)
    })

    socket.on('disconnect', () => {
      console.log('Socket disconnected')
    })

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
    })

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [session?.user?.id])

  return {
    socket: socketRef.current,
    sendMessage: (receiverId: string, message: any) => {
      socketRef.current?.emit('send-message', { receiverId, message })
    },
    notifyProjectSubmission: (supervisorId: string, project: any) => {
      socketRef.current?.emit('project-submitted', { supervisorId, project })
    },
    notifyProjectReview: (studentId: string, project: any) => {
      socketRef.current?.emit('project-reviewed', { studentId, project })
    },
    startTyping: (receiverId: string, senderName: string) => {
      socketRef.current?.emit('typing-start', { receiverId, senderName })
    },
    stopTyping: (receiverId: string) => {
      socketRef.current?.emit('typing-stop', { receiverId })
    }
  }
}