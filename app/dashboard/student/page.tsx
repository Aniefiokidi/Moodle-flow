"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FileText, MessageSquare, User, Upload, Clock, CheckCircle, Mail, Send } from "lucide-react"

export default function StudentDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [studentData, setStudentData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Message dialog state
  const [messageDialogOpen, setMessageDialogOpen] = useState(false)
  const [messageSubject, setMessageSubject] = useState("")
  const [messageContent, setMessageContent] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)

  useEffect(() => {
    if (status === "loading") return // Still loading session

    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (session) {
      fetchStudentData()
    }
  }, [session, status, router])

  const fetchStudentData = async () => {
    try {
      const response = await fetch("/api/student/dashboard")
      if (response.status === 401) {
        router.push("/auth/signin")
        return
      }
      if (response.ok) {
        const data = await response.json()
        setStudentData(data)
      } else {
        setError("Failed to load student data")
      }
    } catch (error) {
      console.error("Error fetching student data:", error)
      setError("Failed to load student data")
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return "bg-blue-100 text-blue-800"
      case "UNDER_REVIEW":
        return "bg-yellow-100 text-yellow-800"
      case "NEEDS_REVISION":
        return "bg-red-100 text-red-800"
      case "APPROVED":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return <FileText className="h-4 w-4" />
      case "UNDER_REVIEW":
        return <Clock className="h-4 w-4" />
      case "APPROVED":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const handleSendMessage = async () => {
    if (!messageSubject || !messageContent) return
    
    setSendingMessage(true)
    try {
      const response = await fetch('/api/student/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: messageSubject,
          content: messageContent
        })
      })
      
      if (response.ok) {
        setMessageSubject("")
        setMessageContent("")
        setMessageDialogOpen(false)
        alert("Message sent successfully!")
      } else {
        const errorData = await response.json()
        console.error('Send message error:', errorData)
        alert(`Failed to send message: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert("Error sending message")
    } finally {
      setSendingMessage(false)
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
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout role="student">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchStudentData}>Try Again</Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!studentData) {
    return (
      <DashboardLayout role="student">
        <div className="flex items-center justify-center h-64">
          <p>No data available</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="student">
      <div className="space-y-6 px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {session?.user?.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Here's an overview of your project supervision activities.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{studentData.projects?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {studentData.recentMessages?.filter((msg: any) => msg.unread).length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assigned Supervisor</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {studentData.supervisor ? (
                <>
                  <div className="text-sm font-medium">{studentData.supervisor.name}</div>
                  <div className="text-xs text-muted-foreground">{studentData.supervisor.course}</div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">No supervisor assigned</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Supervisor Information */}
        {studentData.supervisor ? (
          <Card>
            <CardHeader>
              <CardTitle>Your Supervisor</CardTitle>
              <CardDescription>
                Contact information and details about your assigned supervisor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{studentData.supervisor.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{studentData.supervisor.email}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{studentData.supervisor.course}</p>
                </div>
                <Button onClick={() => setMessageDialogOpen(true)}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Send Message
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Supervisor Assignment</CardTitle>
              <CardDescription>
                You haven't been assigned a supervisor yet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <User className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Supervisor Assigned</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Your supervisor assignment is pending. Contact the admin or department for assistance.
                </p>
                <Button variant="outline">
                  <Mail className="mr-2 h-4 w-4" />
                  Contact Admin
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Project Status */}
        <Card>
          <CardHeader>
            <CardTitle>Current Projects</CardTitle>
            <CardDescription>
              Track the progress of your submitted projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {studentData.projects && studentData.projects.length > 0 ? (
                studentData.projects.map((project: any) => (
                  <div key={project.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg space-y-3 sm:space-y-0">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">{project.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Submitted: {new Date(project.submissionDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Last Update: {new Date(project.lastUpdate || project.submissionDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center justify-start sm:justify-end">
                      <Badge className={getStatusColor(project.status)}>
                        <span className="flex items-center space-x-1">
                          {getStatusIcon(project.status)}
                          <span className="text-xs">{project.status.replace('_', ' ')}</span>
                        </span>
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Projects Yet</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    You haven't submitted any projects yet. Upload your first project to get started.
                  </p>
                </div>
              )}
            </div>
            <div className="mt-6">
              <Button className="w-full sm:w-auto">
                <Upload className="mr-2 h-4 w-4" />
                Upload New Project
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Messages */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Messages</CardTitle>
            <CardDescription>
              Latest communication with your supervisor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {studentData.recentMessages.map((message: any) => (
                <div key={message.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">{message.sender}</span>
                      <span className="text-xs text-gray-500">{message.timestamp}</span>
                      {message.unread && (
                        <Badge variant="destructive" className="h-2 w-2 p-0" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{message.preview}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button variant="outline" className="w-full">
                View All Messages
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Message Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Send Message to {studentData?.supervisor?.name}</DialogTitle>
            <DialogDescription>
              Send a message to your supervisor.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={messageSubject}
                onChange={(e) => setMessageSubject(e.target.value)}
                placeholder="Enter message subject"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="Enter your message"
                rows={4}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setMessageDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendMessage} 
              disabled={sendingMessage || !messageSubject || !messageContent}
            >
              <Send className="h-4 w-4 mr-2" />
              {sendingMessage ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  )
}