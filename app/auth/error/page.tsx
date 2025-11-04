'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

const errorMap = {
  Configuration: 'There is a problem with the server configuration.',
  AccessDenied: 'You do not have permission to sign in.',
  Verification: 'The verification token has expired or has already been used.',
  Default: 'An unexpected error occurred.',
}

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams?.get('error') as keyof typeof errorMap || 'Default'

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center text-red-600">Authentication Error</CardTitle>
        <CardDescription className="text-center">
          {errorMap[error] || errorMap.Default}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 text-center">
          {error && `Error: ${error}`}
        </p>
      </CardContent>
      <CardFooter className="flex justify-center space-x-4">
        <Button asChild variant="outline">
          <Link href="/auth/signin">Try Again</Link>
        </Button>
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

export default function AuthError() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Suspense fallback={
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Loading...</CardTitle>
          </CardHeader>
        </Card>
      }>
        <ErrorContent />
      </Suspense>
    </div>
  )
}