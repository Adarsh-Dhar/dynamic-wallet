"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

interface User {
  id: string;
  email: string;
}

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)

  const userId = params.id as string

  useEffect(() => {
    checkAuth()
  }, [userId])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        
        // Verify the user ID matches the URL
        if (data.user.id !== userId) {
          router.push('/')
          return
        }
      } else {
        // Redirect to login if not authenticated
        router.push('/')
        return
      }
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/')
      return
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
} 