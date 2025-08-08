'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error(error)
  }, [error])

  const handleBack = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/20 border-white/20 backdrop-blur-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-red-100 border border-red-200 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <CardTitle className="text-2xl font-semibold text-gray-900">Dashboard Error</CardTitle>
            <CardDescription className="text-gray-600">
              Something went wrong while loading your dashboard.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-4">
              {error.message || 'An unknown error occurred'}
            </p>
            <div className="space-y-2">
              <Button 
                onClick={reset}
                className="w-full bg-gradient-to-br from-orange-400 to-red-400 text-white hover:from-orange-500 hover:to-red-500"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try again
              </Button>
              <Button 
                onClick={handleBack}
                variant="ghost"
                className="w-full text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}