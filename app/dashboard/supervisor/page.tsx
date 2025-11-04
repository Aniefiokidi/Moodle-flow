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
import { Users, FileText, MessageSquare, Clock, CheckCircle, AlertCircle, Send } from "lucide-react"

export default function SupervisorDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [supervisorData, setSupervisorData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Message dialog state
  const [messageDialogOpen, setMessageDialogOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
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
      fetchSupervisorData()
    }
  }, [session, status, router])

  const fetchSupervisorData = async () => {
    try {
      const response = await fetch("/api/supervisor/dashboard")
      if (response.status === 401) {
        router.push("/auth/signin")
        return
      }
      if (response.ok) {
        const data = await response.json()
        setSupervisorData(data)
      } else {
        setError("Failed to load supervisor data")
      }
    } catch (error) {
      console.error("Error fetching supervisor data:", error)
      setError("Failed to load supervisor data")
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
      case "NEEDS_REVISION":
        return <AlertCircle className="h-4 w-4" />
      case "APPROVED":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const handleSendMessage = async () => {
    if (!selectedStudent || !messageSubject || !messageContent) return
    
    setSendingMessage(true)
    try {
      const response = await fetch('/api/supervisor/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          subject: messageSubject,
          content: messageContent
        })
      })
      
      if (response.ok) {
        setMessageSubject("")
        setMessageContent("")
        setMessageDialogOpen(false)
        setSelectedStudent(null)
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

  const openMessageDialog = (student: any) => {
    setSelectedStudent(student)
    setMessageDialogOpen(true)
  }

  // Show loading while session is being fetched
  if (status === "loading") {
    return (
      <DashboardLayout role="supervisor">
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
      <DashboardLayout role="supervisor">
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
      <DashboardLayout role="supervisor">
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
      <DashboardLayout role="supervisor">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchSupervisorData}>Try Again</Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!supervisorData) {
    return (
      <DashboardLayout role="supervisor">
        <div className="flex items-center justify-center h-64">
          <p>No data available</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="supervisor">
      <div className="space-y-6">
        {/* Welcome Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {session?.user?.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your students and review their project submissions.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{supervisorData.students.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {supervisorData.students?.filter((student: any) => student.project).length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {supervisorData.students?.filter((student: any) => 
                  student.project && (student.project.status === "SUBMITTED" || student.project.status === "UNDER_REVIEW")
                ).length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {supervisorData.recentMessages?.filter((msg: any) => msg.unread).length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Student Projects Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Student Projects</CardTitle>
            <CardDescription>
              Overview of all your assigned students and their project progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {supervisorData.students && supervisorData.students.length > 0 ? (
                supervisorData.students.map((student: any) => (
                  <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">{student.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{student.email}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Course: {student.course}</p>
                        </div>
                      </div>
                      {student.project ? (
                        <div className="mt-2">
                          <p className="font-medium text-sm text-gray-900 dark:text-white">{student.project.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Submitted: {new Date(student.project.submissionDate).toLocaleDateString()}
                          </p>
                        </div>
                      ) : (
                        <div className="mt-2">
                          <p className="text-sm text-gray-500 dark:text-gray-400 italic">No project submitted yet</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {student.project ? (
                        <>
                          <Badge className={getStatusColor(student.project.status)}>
                            <span className="flex items-center space-x-1">
                              {getStatusIcon(student.project.status)}
                              <span>{student.project.status.replace('_', ' ')}</span>
                            </span>
                          </Badge>
                          <div className="flex space-x-1">
                            <Button size="sm" variant="outline">
                              <FileText className="h-4 w-4 mr-1" />
                              Review
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => openMessageDialog(student)}>
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Message
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="flex space-x-1">
                          <Button size="sm" variant="outline" onClick={() => openMessageDialog(student)}>
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Message
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Users className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Students Assigned</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    You don't have any students assigned to you yet. Contact the admin to get students assigned.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-500" />
                <span>Pending Reviews</span>
              </CardTitle>
              <CardDescription>
                Projects that require your immediate attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {supervisorData.students
                  ?.filter((student: any) => student.project && (student.project.status === "UNDER_REVIEW" || student.project.status === "SUBMITTED"))
                  .map((student: any) => (
                    <div key={student.id} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <div>
                        <p className="font-medium text-sm text-gray-900 dark:text-white">{student.name}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-300">{student.project.title}</p>
                      </div>
                      <Button size="sm">Review</Button>
                    </div>
                  )) || (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-600 dark:text-gray-300">No pending reviews</p>
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-blue-500" />
                <span>Recent Messages</span>
              </CardTitle>
              <CardDescription>
                Latest messages from your students
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {supervisorData.recentMessages && supervisorData.recentMessages.length > 0 ? (
                  supervisorData.recentMessages.slice(0, 3).map((message: any) => (
                    <div key={message.id} className="flex items-start space-x-3 p-3 border dark:border-gray-700 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 dark:text-white">
                          <span className="font-medium">{message.sender}</span>: {message.preview}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(message.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">No recent messages</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Message Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Send Message to {selectedStudent?.name}</DialogTitle>
            <DialogDescription>
              Send a message to your student.
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