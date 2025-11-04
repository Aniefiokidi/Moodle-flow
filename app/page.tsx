"use client"

import { useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { BookOpen, Users, MessageSquare, BarChart3 } from "lucide-react"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Don't auto-redirect anymore - let users see the homepage even when logged in

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <Link href="/">
                <h1 className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer">
                  Supervision Portal
                </h1>
              </Link>
            </div>
            <div className="flex space-x-2">
              {session ? (
                <>
                  <Link href={`/dashboard/${session.user.role.toLowerCase()}`}>
                    <Button variant="outline" className="bg-white hover:bg-gray-50 border-gray-300 text-gray-700">
                      Go to Dashboard
                    </Button>
                  </Link>
                  <Button 
                    onClick={() => signOut({ callbackUrl: '/' })} 
                    variant="outline"
                    className="bg-white hover:bg-gray-50 border-gray-300 text-gray-700"
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/auth/signin">
                    <Button variant="outline">Sign In</Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button>Sign Up</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center">
          {session ? (
            <>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Welcome back, {session.user.name}!
              </h2>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                You're logged in as a {session.user.role.toLowerCase()}. Access your dashboard to manage your projects, 
                communicate with your team, and track your progress.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Departmental Project Supervision Portal
              </h2>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                A comprehensive platform for managing student projects, facilitating 
                communication between students and supervisors, and streamlining the 
                academic supervision process.
              </p>
            </>
          )}
          <div className="flex justify-center space-x-4">
            {session ? (
              <>
                <Link href={`/dashboard/${session.user.role.toLowerCase()}`}>
                  <Button size="lg" className="px-8 py-3">
                    Go to Dashboard
                  </Button>
                </Link>
                <Link href="#features">
                  <Button size="lg" variant="outline" className="px-8 py-3 bg-white hover:bg-gray-50 border-gray-300 text-gray-700 shadow-sm">
                    Learn More
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/signup">
                  <Button size="lg" className="px-8 py-3">
                    Get Started
                  </Button>
                </Link>
                <Link href="/auth/signin">
                  <Button size="lg" variant="outline" className="px-8 py-3 bg-white hover:bg-gray-50 border-gray-300 text-gray-700 shadow-sm">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Key Features
          </h3>
          <p className="text-lg text-gray-600">
            Everything you need for effective project supervision
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <BookOpen className="h-6 w-6 text-blue-600" />
                <CardTitle>Project Management</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Upload, track, and manage project submissions with real-time 
                status updates and progress tracking.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-6 w-6 text-green-600" />
                <CardTitle>Real-time Chat</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Seamless communication between students and supervisors with 
                instant messaging, file sharing, and notifications.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Users className="h-6 w-6 text-purple-600" />
                <CardTitle>Role-based Access</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Tailored dashboards for students, supervisors, and administrators 
                with appropriate permissions and features.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-6 w-6 text-orange-600" />
                <CardTitle>Analytics & Reports</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Comprehensive analytics for administrators to track performance, 
                monitor progress, and generate reports.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <BookOpen className="h-6 w-6 text-red-600" />
                <CardTitle>Feedback System</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Structured feedback and review process with status tracking 
                and notification system.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Users className="h-6 w-6 text-indigo-600" />
                <CardTitle>User Management</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Easy user registration, role assignment, and supervisor-student 
                pairing management.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 Departmental Project Supervision Portal. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
