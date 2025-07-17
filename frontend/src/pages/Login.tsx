import React, { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { LoginForm } from '../components/login-form'
import { useAuth } from '../contexts/AuthContext'
import { showToast } from '../components/ui/Toast'
import type { LoginDto } from '@stable-ride/shared'

interface LoginFormData extends LoginDto {
  rememberMe?: boolean
}

export const Login: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const from = location.state?.from?.pathname || '/dashboard'

  const handleSubmit = async (data: LoginFormData) => {
    try {
      setLoading(true)
      await login(data)
      showToast.success('Welcome back!')
      navigate(from, { replace: true })
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to login'
      showToast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/50">
      <div className="mx-auto w-full max-w-sm">
        <Link to="/" className="flex justify-center mb-8">
          <img 
            src="/logo_black.png" 
            alt="Stable Ride" 
            className="h-12 w-12 dark:hidden hover:opacity-80 transition-opacity"
          />
          <img 
            src="/logo_white.png" 
            alt="Stable Ride" 
            className="h-12 w-12 hidden dark:block hover:opacity-80 transition-opacity"
          />
        </Link>
        <LoginForm onSubmit={handleSubmit} loading={loading} />
      </div>
    </div>
  )
}