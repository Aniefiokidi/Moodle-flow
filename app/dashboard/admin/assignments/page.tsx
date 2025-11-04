"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { 
  Users, 
  UserPlus, 
  Shuffle,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Settings
} from "lucide-react"

export default function ManageAssignments() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [autoAssigning, setAutoAssigning] = useState(false)
  const [assignmentResult, setAssignmentResult] = useState<any>(null)
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAutoAssign = async () => {
    setAutoAssigning(true)
    try {
      const response = await fetch('/api/admin/auto-assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const result = await response.json()
        setAssignmentResult(result)
        setShowResults(true)
        // Refresh the users list to show updated assignments
        await fetchUsers()
      } else {
        const error = await response.json()
        alert(`Assignment failed: ${error.error}`)
      }
    } catch (error) {
      console.error('Auto-assignment error:', error)
      alert('Failed to auto-assign students')
    } finally {
      setAutoAssigning(false)
    }
  }

  // Separate users by role
  const supervisors = users.filter(user => user.role === 'SUPERVISOR')
  const students = users.filter(user => user.role === 'STUDENT')
  const unassignedStudents = students.filter(user => !user.student?.supervisorId)
  const assignedStudents = students.filter(user => user.student?.supervisorId)

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading assignments...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manage Assignments</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Assign students to supervisors and manage supervision relationships
            </p>
          </div>

          {/* Auto Assignment Button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                size="lg" 
                disabled={autoAssigning || unassignedStudents.length === 0 || supervisors.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Shuffle className="mr-2 h-4 w-4" />
                {autoAssigning ? 'Assigning...' : 'Auto Assign Students'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Auto-Assign Students to Supervisors</AlertDialogTitle>
                <AlertDialogDescription>
                  This will automatically assign all unassigned students to available supervisors using intelligent distribution.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-4">
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><strong>Course Matching:</strong> Students are preferentially assigned to supervisors in their course</li>
                  <li><strong>Load Balancing:</strong> Students are distributed evenly across supervisors</li>
                  <li><strong>Capacity Limits:</strong> Maximum 6 students per supervisor to prevent overloading</li>
                  <li><strong>Random Distribution:</strong> Fair random selection when multiple supervisors are equally suitable</li>
                </ul>
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                  <p className="text-sm font-medium mb-2">Current Status:</p>
                  <p className="text-sm">• {unassignedStudents.length} unassigned students</p>
                  <p className="text-sm">• {supervisors.length} available supervisors</p>
                  <p className="text-sm">• Max {Math.min(Math.ceil(unassignedStudents.length / Math.max(supervisors.length, 1)), 6)} students per supervisor</p>
                </div>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleAutoAssign} disabled={autoAssigning}>
                  {autoAssigning ? 'Processing...' : 'Start Auto Assignment'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Assignment Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{students.length}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {assignedStudents.length} assigned, {unassignedStudents.length} unassigned
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Supervisors</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{supervisors.length}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Available for assignments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assignment Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {students.length > 0 ? Math.round((assignedStudents.length / students.length) * 100) : 0}%
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Students with supervisors
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Load</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {supervisors.length > 0 ? Math.round(assignedStudents.length / supervisors.length * 10) / 10 : 0}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Students per supervisor
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Assignment Results Dialog */}
        {assignmentResult && (
          <Dialog open={showResults} onOpenChange={setShowResults}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Auto-Assignment Results</span>
                </DialogTitle>
                <DialogDescription>
                  Assignment completed successfully! Here's a summary of the changes:
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Summary Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{assignmentResult.summary?.totalAssigned || 0}</div>
                    <div className="text-sm text-green-700 dark:text-green-300">Students Assigned</div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{assignmentResult.summary?.courseMatches || 0}</div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">Course Matches</div>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{assignmentResult.summary?.courseMismatches || 0}</div>
                    <div className="text-sm text-orange-700 dark:text-orange-300">Cross-Course</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-gray-600">{assignmentResult.summary?.totalUnassigned || 0}</div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">Still Unassigned</div>
                  </div>
                </div>

                {/* Supervisor Distribution */}
                {assignmentResult.summary?.supervisorDistribution && assignmentResult.summary.supervisorDistribution.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Supervisor Assignment Distribution</h4>
                    <div className="space-y-2">
                      {assignmentResult.summary.supervisorDistribution.map((supervisor: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 border dark:border-gray-700 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{supervisor.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{supervisor.email}</p>
                            <Badge variant="outline" className="text-xs mt-1">
                              {supervisor.course}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center space-x-1">
                              <span className="text-sm text-gray-500">{supervisor.previousStudents}</span>
                              <ArrowRight className="h-3 w-3 text-gray-400" />
                              <span className="text-sm font-medium text-gray-900 dark:text-white">{supervisor.totalStudents}</span>
                              <span className="text-xs text-gray-500">students</span>
                            </div>
                            <p className="text-xs text-green-600">+{supervisor.newAssignments} new</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Individual Assignments */}
                {assignmentResult.assignments && assignmentResult.assignments.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Individual Assignments</h4>
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {assignmentResult.assignments.map((assignment: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{assignment.studentName}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{assignment.studentEmail}</p>
                            <Badge variant={assignment.matchesCourse ? "default" : "secondary"} className="text-xs mt-1">
                              {assignment.studentCourse} {assignment.matchesCourse ? "✓" : "→ " + assignment.supervisorCourse}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900 dark:text-white">{assignment.supervisorName}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{assignment.supervisorEmail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button onClick={() => setShowResults(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Current Assignments Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Unassigned Students */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                <span>Unassigned Students</span>
              </CardTitle>
              <CardDescription>
                Students who need supervisor assignment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {unassignedStudents.length > 0 ? (
                  unassignedStudents.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 border border-orange-200 dark:border-orange-800 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">{user.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{user.email}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {user.student?.course}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-300">All students have been assigned!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Supervisor Load Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-500" />
                <span>Supervisor Workload</span>
              </CardTitle>
              <CardDescription>
                Current student distribution across supervisors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {supervisors.length > 0 ? (
                  supervisors.map((user) => {
                    const assignedToThisSupervisor = assignedStudents.filter(
                      student => student.student?.supervisorId === user.supervisor?.id
                    ).length
                    
                    return (
                      <div key={user.id} className="flex items-center justify-between p-3 border dark:border-gray-700 rounded-lg">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">{user.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{user.email}</p>
                          <Badge variant="outline" className="text-xs mt-1">
                            {user.supervisor?.course}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900 dark:text-white">{assignedToThisSupervisor}</div>
                          <p className="text-xs text-gray-500">students</p>
                          <Badge 
                            variant={assignedToThisSupervisor === 0 ? "secondary" : assignedToThisSupervisor >= 5 ? "destructive" : "default"}
                            className="text-xs"
                          >
                            {assignedToThisSupervisor === 0 ? "Available" : 
                             assignedToThisSupervisor >= 5 ? "High Load" : "Active"}
                          </Badge>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-4">
                    <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-300">No supervisors registered yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}