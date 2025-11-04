"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import ChatInterface from "@/components/chat-interface"
import { ArrowLeft, MessageSquare, Users } from "lucide-react"
import Link from "next/link"

interface Student {
  id: string
  userId: string
  name: string
  email: string
  course: string
}

interface Conversation {
  user: {
    id: string
    name: string
    email: string
    role: string
  }
  lastMessage: {
    content: {
      subject: string
      body: string
    }
    timestamp: string
    isSentByMe: boolean
  } | null
  unreadCount: number
}

export default function SupervisorChatPage() {
  const { data: session, status } = useSession()
  const [students, setStudents] = useState<Student[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedUserName, setSelectedUserName] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "SUPERVISOR") {
      fetchStudentsAndConversations()
    }
  }, [status, session])

  const fetchStudentsAndConversations = async () => {
    try {
      // Fetch assigned students
      const studentsResponse = await fetch("/api/supervisor/dashboard")
      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json()
        setStudents(studentsData.students || [])
      }

      // Fetch conversations
      const conversationsResponse = await fetch("/api/messages")
      if (conversationsResponse.ok) {
        const conversationsData = await conversationsResponse.json()
        setConversations(conversationsData.conversations || [])
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartChat = (student: Student) => {
    setSelectedUserId(student.userId)
    setSelectedUserName(student.name)
  }

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedUserId(conversation.user.id)
    setSelectedUserName(conversation.user.name)
  }

  if (status === "loading") {
    return <div>Loading...</div>
  }

  if (status === "unauthenticated" || session?.user?.role !== "SUPERVISOR") {
    redirect("/auth/signin")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="flex items-center justify-center h-64">
          <div>Loading...</div>
        </div>
      </div>
    )
  }

  if (selectedUserId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="default" 
              onClick={() => setSelectedUserId(null)}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white shadow-lg"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Conversations
            </Button>
            <h1 className="text-2xl font-bold text-gray-800">
              Chat with {selectedUserName}
            </h1>
          </div>
          
          <ChatInterface 
            chatPartnerId={selectedUserId}
            chatPartnerName={selectedUserName}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Supervisor Chat Center</h1>
            <p className="text-gray-600 mt-2">Communicate with your assigned students</p>
          </div>
          <Link href="/dashboard/supervisor">
            <Button variant="default" className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white shadow-lg">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assigned Students */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Your Assigned Students
              </CardTitle>
              <CardDescription>
                Start new conversations with your students
              </CardDescription>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No students assigned yet
                </p>
              ) : (
                <div className="space-y-3">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={`/api/placeholder/40/40`} />
                          <AvatarFallback>
                            {student.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{student.name}</h3>
                          <p className="text-sm text-gray-500">{student.email}</p>
                        </div>
                        <Badge variant="secondary">{student.course}</Badge>
                      </div>
                      <Button
                        onClick={() => handleStartChat(student)}
                        size="sm"
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Chat
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Conversations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Recent Conversations
              </CardTitle>
              <CardDescription>
                Continue existing conversations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {conversations.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No conversations yet
                </p>
              ) : (
                <div className="space-y-3">
                  {conversations.map((conversation, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleSelectConversation(conversation)}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={`/api/placeholder/40/40`} />
                          <AvatarFallback>
                            {conversation.user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium truncate">{conversation.user.name}</h3>
                            <Badge variant="outline" className="text-xs">
                              {conversation.user.role}
                            </Badge>
                            {conversation.unreadCount > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                          </div>
                          {conversation.lastMessage && (
                            <div className="text-sm text-gray-500 truncate">
                              <span className="font-medium">
                                {conversation.lastMessage.content.subject}
                              </span>
                              {conversation.lastMessage.content.body && (
                                <span className="ml-2">
                                  {conversation.lastMessage.content.body.substring(0, 50)}...
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 ml-2">
                        {conversation.lastMessage && 
                          new Date(conversation.lastMessage.timestamp).toLocaleDateString()
                        }
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}