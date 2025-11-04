"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { 
  FileText, 
  Download, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Eye,
  MessageSquare
} from "lucide-react"

export default function SupervisorReviews() {
  const { data: session } = useSession()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [feedback, setFeedback] = useState("")
  const [newStatus, setNewStatus] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReviewSubmit = async () => {
    if (!selectedProject || !newStatus || submitting) return

    setSubmitting(true)

    try {
      const response = await fetch(`/api/projects/${selectedProject.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          feedback: feedback
        }),
      })

      if (response.ok) {
        // Update the project in the list
        setProjects(prev =>
          prev.map(p =>
            p.id === selectedProject.id
              ? { ...p, status: newStatus }
              : p
          )
        )
        setSelectedProject(null)
        setFeedback("")
        setNewStatus("")
      } else {
        alert('Failed to submit review')
      }
    } catch (error) {
      alert('Failed to submit review')
    } finally {
      setSubmitting(false)
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

  const getPriorityProjects = () => {
    return projects.filter(p => 
      p.status === "SUBMITTED" || p.status === "UNDER_REVIEW"
    ).sort((a, b) => 
      new Date(a.submissionDate).getTime() - new Date(b.submissionDate).getTime()
    )
  }

  if (loading) {
    return (
      <DashboardLayout role="supervisor">
        <div className="flex items-center justify-center h-64">
          <div>Loading projects...</div>
        </div>
      </DashboardLayout>
    )
  }

  const priorityProjects = getPriorityProjects()

  return (
    <DashboardLayout role="supervisor">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Project Reviews</h1>
          <p className="text-gray-600">
            Review and provide feedback on student project submissions
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {projects.filter(p => p.status === "SUBMITTED" || p.status === "UNDER_REVIEW").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Needs Revision</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {projects.filter(p => p.status === "NEEDS_REVISION").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {projects.filter(p => p.status === "APPROVED").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Priority Reviews */}
        {priorityProjects.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-500" />
                <span>Priority Reviews</span>
              </CardTitle>
              <CardDescription>
                Projects requiring immediate attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {priorityProjects.slice(0, 3).map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-4 border border-orange-200 rounded-lg bg-orange-50">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div>
                          <h4 className="font-semibold">{project.title}</h4>
                          <p className="text-sm text-gray-600">
                            by {project.student?.user?.name || 'Unknown Student'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Submitted: {new Date(project.submissionDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(project.status)}>
                        {project.status.replace('_', ' ')}
                      </Badge>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm"
                            onClick={() => setSelectedProject(project)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                          <DialogHeader>
                            <DialogTitle>Review Project: {project.title}</DialogTitle>
                            <DialogDescription>
                              Provide feedback and update the project status
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-6">
                            {/* Project Details */}
                            <div className="space-y-2">
                              <h4 className="font-medium">Project Details</h4>
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <p><strong>Student:</strong> {project.student?.user?.name}</p>
                                <p><strong>Submitted:</strong> {new Date(project.submissionDate).toLocaleDateString()}</p>
                                <p><strong>Description:</strong> {project.description || 'No description provided'}</p>
                                {project.fileUrl && (
                                  <div className="mt-2">
                                    <Button variant="outline" size="sm" asChild>
                                      <a href={project.fileUrl} target="_blank" rel="noopener noreferrer">
                                        <Download className="mr-2 h-4 w-4" />
                                        Download Files
                                      </a>
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Status Selection */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium">New Status</label>
                              <Select value={newStatus} onValueChange={setNewStatus}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select new status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                                  <SelectItem value="NEEDS_REVISION">Needs Revision</SelectItem>
                                  <SelectItem value="APPROVED">Approved</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Feedback */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Feedback</label>
                              <Textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="Provide detailed feedback for the student..."
                                rows={6}
                              />
                            </div>

                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setSelectedProject(null)
                                  setFeedback("")
                                  setNewStatus("")
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleReviewSubmit}
                                disabled={!newStatus || submitting}
                              >
                                {submitting ? "Submitting..." : "Submit Review"}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Projects */}
        <Card>
          <CardHeader>
            <CardTitle>All Projects</CardTitle>
            <CardDescription>
              Complete list of student project submissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No projects submitted yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div>
                          <h4 className="font-semibold">{project.title}</h4>
                          <p className="text-sm text-gray-600">
                            by {project.student?.user?.name || 'Unknown Student'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Submitted: {new Date(project.submissionDate).toLocaleDateString()} • 
                            Updated: {new Date(project.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(project.status)}>
                        <span className="flex items-center space-x-1">
                          {getStatusIcon(project.status)}
                          <span>{project.status.replace('_', ' ')}</span>
                        </span>
                      </Badge>
                      <Button variant="outline" size="sm">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Chat
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm"
                            onClick={() => setSelectedProject(project)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Review
                          </Button>
                        </DialogTrigger>
                      </Dialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}