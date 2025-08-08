"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, EyeOff, Wallet } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setError("")
    setLoading(true)
    
    try {
      console.log('Attempting login with:', { email, password })
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      console.log('Login response status:', response.status)
      const data = await response.json()
      console.log('Login response data:', data)

      if (response.ok) {
        console.log('Login successful, redirecting to:', `/${data.user.id}/dashboard`)
        // Wait a bit for cookies to be set
        setTimeout(() => {
          router.push(`/${data.user.id}/dashboard`)
        }, 100)
      } else {
        setError(data.error || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    setError("")
    
    if (password !== confirmPassword) {
      setError("Passwords don't match")
      return
    }
    
    setLoading(true)
    
    try {
      console.log('Attempting registration with:', { email, password })
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      console.log('Registration response status:', response.status)
      const data = await response.json()
      console.log('Registration response data:', data)

      if (response.ok) {
        console.log('Registration successful, redirecting to:', `/${data.user.id}/dashboard`)
        // Wait a bit for cookies to be set
        setTimeout(() => {
          router.push(`/${data.user.id}/dashboard`)
        }, 100)
      } else {
        setError(data.error || 'Registration failed')
      }
    } catch (error) {
      console.error('Registration error:', error)
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/20 border-white/30 backdrop-blur-xl shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <Wallet className="w-6 h-6 text-orange-500" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">CryptoVault</CardTitle>
            <CardDescription className="text-gray-600">
              Your secure gateway to the decentralized world
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/30 rounded-xl">
              <TabsTrigger value="login" className="data-[state=active]:bg-black text-gray-700 data-[state=active]:text-white">Login</TabsTrigger>
              <TabsTrigger value="create" className="data-[state=active]:bg-black text-gray-700 data-[state=active]:text-white">Create Wallet</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="bg-white/50 border-white/30 text-gray-900 placeholder:text-gray-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="bg-white/50 border-white/30 text-gray-900 placeholder:text-gray-500 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}
              <Button 
                className="w-full bg-black hover:bg-gray-900 text-white"
                onClick={handleLogin}
                disabled={loading}
              >
                {loading ? "Unlocking..." : "Unlock Wallet"}
              </Button>
              <p className="text-xs text-gray-500 text-center">
                Forgot your password? You'll need your seed phrase to recover.
              </p>
            </TabsContent>
            
            <TabsContent value="create" className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="new-email" className="text-gray-700">Email</Label>
                <Input
                  id="new-email"
                  type="email"
                  placeholder="Enter your email"
                  className="bg-white/50 border-white/30 text-gray-900 placeholder:text-gray-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-gray-700">Create Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    className="bg-white/50 border-white/30 text-gray-900 placeholder:text-gray-500 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-gray-700">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm your password"
                  className="bg-white/50 border-white/30 text-gray-900 placeholder:text-gray-500"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}
              <Button 
                className="w-full bg-gradient-to-br from-orange-400 to-red-400 hover:from-orange-500 hover:to-red-500 text-white"
                onClick={handleRegister}
                disabled={loading}
              >
                {loading ? "Creating..." : "Create New Wallet"}
              </Button>
              <p className="text-xs text-gray-500 text-center">
                By creating a wallet, you agree to our Terms of Service and Privacy Policy.
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
