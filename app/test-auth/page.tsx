"use client"

import { useState } from "react"

export default function TestAuth() {
  const [result, setResult] = useState("")
  const [loading, setLoading] = useState(false)

  const testAuth = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      })
      
      const data = await response.json()
      setResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setResult(`Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const testLogin = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          email: "debug@example.com", 
          password: "password123" 
        }),
      })
      
      const data = await response.json()
      setResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setResult(`Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800/50 border-slate-700 backdrop-blur-sm rounded-lg p-6">
        <h1 className="text-2xl font-bold text-white mb-4">Auth Test</h1>
        
        <div className="space-y-4">
          <button
            onClick={testLogin}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
          >
            {loading ? "Testing..." : "Test Login"}
          </button>
          
          <button
            onClick={testAuth}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
          >
            {loading ? "Testing..." : "Test Auth Check"}
          </button>
        </div>
        
        {result && (
          <div className="mt-4">
            <h2 className="text-white font-semibold mb-2">Result:</h2>
            <pre className="bg-slate-700 p-4 rounded text-sm text-slate-200 overflow-auto">
              {result}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
} 