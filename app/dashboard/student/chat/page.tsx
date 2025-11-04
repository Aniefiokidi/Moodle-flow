"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"
import ChatInterface from "@/components/chat-interface"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, User, Mail } from "lucide-react"

export default function StudentChat() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [supervisorData, setSupervisorData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return

    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (session) {
      fetchSupervisorData()
    }
  }, [session, status, router])

  const fetchSupervisorData = async () => {
    try {
      const response = await fetch("/api/student/dashboard")
      if (response.status === 401) {
        router.push("/auth/signin")
        return
      }
      if (response.ok) {
        const data = await response.json()
        if (data.supervisor) {
          setSupervisorData({
            id: data.supervisor.id,
            name: data.supervisor.name,
            email: data.supervisor.email,
            course: data.supervisor.course,
            unreadMessages: data.recentMessages.filter((msg: any) => msg.unread).length
          })
        } else {
          setSupervisorData(null)
        }
      } else {
        console.error('Failed to fetch supervisor data')
      }
    } catch (error) {
      console.error('Failed to fetch supervisor data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Show loading while session is being fetched
  if (status === "loading") {
    return (
      <DashboardLayout role="student">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Redirect if not authenticated
  if (!session) {
    return (
      <DashboardLayout role="student">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p>Redirecting to login...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (loading) {
    return (
      <DashboardLayout role="student">
        <div className="flex items-center justify-center h-64">
          <div>Loading chat...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (!supervisorData) {
    return (
      <DashboardLayout role="student">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Chat</h1>
            <p className="text-gray-600">
              Communicate with your supervisor
            </p>
          </div>

          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No supervisor assigned
              </h3>
              <p className="text-gray-600">
                You need to be assigned to a supervisor to start chatting
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="student">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Chat</h1>
          <p className="text-gray-600">
            Communicate with your supervisor
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Supervisor Info Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Your Supervisor</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      {supervisorData.name.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold">{supervisorData.name}</h3>
                    <p className="text-sm text-gray-600">{supervisorData.course}</p>
                  </div>
                  {supervisorData.unreadMessages > 0 && (
                    <Badge variant="destructive" className="h-6 w-6 p-0 flex items-center justify-center">
                      {supervisorData.unreadMessages}
                    </Badge>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">{supervisorData.email}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-medium mb-2">Quick Actions</h4>
                  <div className="space-y-2">
                    <button className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100">
                      View Profile
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100">
                      Schedule Meeting
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100">
                      Send Email
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <ChatInterface
              chatPartnerId={supervisorData.id}
              chatPartnerName={supervisorData.name}
              className="h-full"
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}