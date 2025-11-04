"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Users, 
  FileText, 
  MessageSquare, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  UserPlus,
  Settings,
  Send,
  Download,
  BarChart3
} from "lucide-react"

export default function AdminDashboard() {
  const { data: session } = useSession()
  const [adminData, setAdminData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Dialog states
  const [messageDialogOpen, setMessageDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false)
  const [reportsDialogOpen, setReportsDialogOpen] = useState(false)
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
  
  // Selected supervisor for message/details
  const [selectedSupervisor, setSelectedSupervisor] = useState<any>(null)
  
  // Message form
  const [messageSubject, setMessageSubject] = useState("")
  const [messageContent, setMessageContent] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)
  
  // Add user form
  const [newUserName, setNewUserName] = useState("")
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserRole, setNewUserRole] = useState("")
  const [newUserCourse, setNewUserCourse] = useState("")
  const [addingUser, setAddingUser] = useState(false)

  const fetchAdminData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard')
      if (response.ok) {
        const data = await response.json()
        setAdminData(data)
      } else {
        console.error('Failed to fetch admin data')
        // Set empty state for failed fetch
        setAdminData({
          totalUsers: 0,
          totalStudents: 0,
          totalSupervisors: 0,
          totalProjects: 0,
          pendingReviews: 0,
          approvedProjects: 0,
          needsRevision: 0,
          supervisorStats: [],
          recentActivity: []
        })
      }
    } catch (error) {
      console.error('Error fetching admin data:', error)
      setAdminData({
        totalUsers: 0,
        totalStudents: 0,
        totalSupervisors: 0,
        totalProjects: 0,
        pendingReviews: 0,
        approvedProjects: 0,
        needsRevision: 0,
        supervisorStats: [],
        recentActivity: []
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdminData()
  }, [])

  // Handler functions
  const handleSendMessage = async () => {
    if (!selectedSupervisor || !messageSubject || !messageContent) return
    
    setSendingMessage(true)
    try {
      const response = await fetch('/api/admin/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supervisorId: selectedSupervisor.id,
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

  const handleAddUser = async () => {
    if (!newUserName || !newUserEmail || !newUserRole) return
    
    setAddingUser(true)
    try {
      const response = await fetch('/api/admin/add-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          role: newUserRole,
          course: newUserCourse
        })
      })
      
      if (response.ok) {
        setNewUserName("")
        setNewUserEmail("")
        setNewUserRole("")
        setNewUserCourse("")
        setAddUserDialogOpen(false)
        alert("User added successfully!")
        // Refresh admin data
        fetchAdminData()
      } else {
        const error = await response.json()
        alert(`Failed to add user: ${error.error}`)
      }
    } catch (error) {
      console.error('Error adding user:', error)
      alert("Error adding user")
    } finally {
      setAddingUser(false)
    }
  }

  const handleGenerateReport = (reportType: string) => {
    // For now, we'll create a simple CSV download
    const generateCSV = () => {
      if (!adminData) return
      
      let csvContent = ""
      
      if (reportType === 'supervisors') {
        csvContent = "Name,Email,Course,Students,Pending Reviews,Completed Projects\n"
        adminData.supervisorStats?.forEach((supervisor: any) => {
          csvContent += `"${supervisor.name}","${supervisor.email}","${supervisor.course}",${supervisor.students},${supervisor.pendingReviews},${supervisor.completedProjects}\n`
        })
      } else if (reportType === 'system') {
        csvContent = "Metric,Value\n"
        csvContent += `Total Users,${adminData.totalUsers}\n`
        csvContent += `Total Students,${adminData.totalStudents}\n`
        csvContent += `Total Supervisors,${adminData.totalSupervisors}\n`
        csvContent += `Total Projects,${adminData.totalProjects}\n`
        csvContent += `Pending Reviews,${adminData.pendingReviews}\n`
        csvContent += `Approved Projects,${adminData.approvedProjects}\n`
        csvContent += `Needs Revision,${adminData.needsRevision}\n`
      }
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
    
    generateCSV()
    setReportsDialogOpen(false)
  }

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div>Loading...</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Welcome Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Overview of the CIS project supervision system.
          </p>
        </div>

        {/* System Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{adminData.totalUsers}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {adminData.totalStudents} students, {adminData.totalSupervisors} supervisors
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{adminData.totalProjects}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Across all supervisors
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{adminData.pendingReviews}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Require attention
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {adminData.totalProjects > 0 ? Math.round((adminData.approvedProjects / adminData.totalProjects) * 100) : 0}%
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Projects approved
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Project Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Approved Projects</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{adminData.approvedProjects}</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Successfully completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-500" />
                <span>Under Review</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{adminData.pendingReviews}</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Awaiting supervisor review</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <span>Needs Revision</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{adminData.needsRevision}</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Requires student updates</p>
            </CardContent>
          </Card>
        </div>

        {/* Supervisor Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Supervisor Performance</CardTitle>
            <CardDescription>
              Overview of supervisor workload and performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {adminData.supervisorStats && adminData.supervisorStats.length > 0 ? (
                adminData.supervisorStats.map((supervisor: any) => (
                  <div key={supervisor.id} className="flex items-center justify-between p-4 border dark:border-gray-700 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{supervisor.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{supervisor.email}</p>
                      <div className="flex space-x-4 mt-2">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          Students: <span className="font-medium text-gray-900 dark:text-white">{supervisor.students}</span>
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          Pending: <span className="font-medium text-orange-600">{supervisor.pendingReviews}</span>
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          Completed: <span className="font-medium text-green-600">{supervisor.completedProjects}</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedSupervisor(supervisor)
                          setMessageDialogOpen(true)
                        }}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Message
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedSupervisor(supervisor)
                          setDetailsDialogOpen(true)
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Users className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Supervisors Registered</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    No supervisors have registered in the system yet.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity and Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest system activity and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {adminData.recentActivity && adminData.recentActivity.length > 0 ? (
                  adminData.recentActivity.map((activity: any) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 border dark:border-gray-700 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 dark:text-white">{activity.message}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(activity.timestamp).toLocaleDateString()} at {new Date(activity.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {activity.type.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">No recent activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common administrative tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button 
                  className="w-full justify-start"
                  onClick={() => setAddUserDialogOpen(true)}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add New User
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.location.href = '/dashboard/admin/assignments'}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Manage Assignments
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setReportsDialogOpen(true)}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Reports
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setSettingsDialogOpen(true)}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  System Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Message Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Send Message to {selectedSupervisor?.name}</DialogTitle>
            <DialogDescription>
              Send a direct message to the supervisor.
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

      {/* Supervisor Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Supervisor Details - {selectedSupervisor?.name}</DialogTitle>
            <DialogDescription>
              Detailed information about the supervisor's performance and workload.
            </DialogDescription>
          </DialogHeader>
          {selectedSupervisor && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Name</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{selectedSupervisor.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{selectedSupervisor.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Course</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{selectedSupervisor.course}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Current Students</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{selectedSupervisor.students}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Pending Reviews</Label>
                  <p className="text-sm text-orange-600">{selectedSupervisor.pendingReviews}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Completed Projects</Label>
                  <p className="text-sm text-green-600">{selectedSupervisor.completedProjects}</p>
                </div>
              </div>
              <div className="pt-4">
                <Label className="text-sm font-medium">Performance Summary</Label>
                <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    This supervisor is currently managing {selectedSupervisor.students} students with {selectedSupervisor.pendingReviews} pending reviews. 
                    They have successfully completed {selectedSupervisor.completedProjects} projects.
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account in the system.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Enter full name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="Enter email address"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select value={newUserRole} onValueChange={setNewUserRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STUDENT">Student</SelectItem>
                  <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(newUserRole === 'STUDENT' || newUserRole === 'SUPERVISOR') && (
              <div className="grid gap-2">
                <Label htmlFor="course">Course</Label>
                <Select value={newUserCourse} onValueChange={setNewUserCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COMPUTER_SCIENCE">Computer Science</SelectItem>
                    <SelectItem value="MIS">Management Information Systems</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setAddUserDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddUser} 
              disabled={addingUser || !newUserName || !newUserEmail || !newUserRole}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {addingUser ? 'Adding...' : 'Add User'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reports Dialog */}
      <Dialog open={reportsDialogOpen} onOpenChange={setReportsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Generate Reports</DialogTitle>
            <DialogDescription>
              Download various system reports in CSV format.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => handleGenerateReport('supervisors')}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Supervisor Performance Report
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => handleGenerateReport('system')}
            >
              <Download className="mr-2 h-4 w-4" />
              System Statistics Report
            </Button>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setReportsDialogOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>System Settings</DialogTitle>
            <DialogDescription>
              Configure system-wide settings and preferences.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Maximum Students per Supervisor</Label>
                  <p className="text-xs text-gray-500">Default limit for auto-assignment</p>
                </div>
                <div className="text-sm font-medium">6</div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Email Notifications</Label>
                  <p className="text-xs text-gray-500">Send automatic notifications</p>
                </div>
                <div className="text-sm font-medium text-green-600">Enabled</div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Auto-backup</Label>
                  <p className="text-xs text-gray-500">Daily database backups</p>
                </div>
                <div className="text-sm font-medium text-green-600">Active</div>
              </div>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                For advanced settings and configurations, please contact the system administrator.
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setSettingsDialogOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  )
}