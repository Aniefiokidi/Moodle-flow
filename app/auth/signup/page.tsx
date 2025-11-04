"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CIS_COURSE_OPTIONS, HOD_TOKEN } from "@/lib/constants/courses"

export default function SignUp() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState<"STUDENT" | "SUPERVISOR" | "ADMIN" | "">("")
  const [course, setCourse] = useState("")
  const [hodToken, setHodToken] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    if (!role) {
      setError("Please select a role")
      setLoading(false)
      return
    }

    if ((role === "SUPERVISOR" || role === "STUDENT") && !course) {
      setError("Please select a course")
      setLoading(false)
      return
    }

    if (role === "ADMIN" && hodToken !== HOD_TOKEN) {
      setError("Invalid HOD token. Please contact the institution for the correct token.")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          course: (role === "SUPERVISOR" || role === "STUDENT") ? course : undefined,
          hodToken: role === "ADMIN" ? hodToken : undefined,
        }),
      })

      if (response.ok) {
        router.push("/auth/signin?message=Registration successful. Please sign in.")
      } else {
        const data = await response.json()
        setError(data.error || "Registration failed")
      }
    } catch (error) {
      setError("An error occurred during registration")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Create your account
          </CardTitle>
          <CardDescription className="text-center">
            Departmental Project Supervision Portal
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {role === "ADMIN" ? "Admin (HOD)" : role || "Select role"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full">
                  <DropdownMenuItem onClick={() => setRole("STUDENT")}>
                    Student
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setRole("SUPERVISOR")}>
                    Supervisor
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setRole("ADMIN")}>
                    Admin (HOD)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {(role === "SUPERVISOR" || role === "STUDENT") && (
              <div className="space-y-2">
                <Label htmlFor="course">Course</Label>
                <Select value={course} onValueChange={setCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {CIS_COURSE_OPTIONS.map((courseOption) => (
                      <SelectItem key={courseOption.value} value={courseOption.value}>
                        {courseOption.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {role === "ADMIN" && (
              <div className="space-y-2">
                <Label htmlFor="hodToken">HOD Authorization Token</Label>
                <Input
                  id="hodToken"
                  type="password"
                  value={hodToken}
                  onChange={(e) => setHodToken(e.target.value)}
                  required
                  className="w-full"
                  placeholder="Enter institution-provided token"
                />
                <p className="text-xs text-gray-500">
                  Contact the institution for the HOD authorization token
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Sign up"}
            </Button>
            <p className="text-sm text-center text-gray-600">
              Already have an account?{" "}
              <Link href="/auth/signin" className="text-blue-600 hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}