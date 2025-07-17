import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { RegisterForm } from '../components/register-form'
import { useAuth } from '../contexts/AuthContext'
import { showToast } from '../components/ui/Toast'
import type { RegisterDto } from '@stable-ride/shared'

export const Register: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const { register: registerUser } = useAuth()

  const handleSubmit = async (data: RegisterDto) => {
    try {
      setLoading(true)
      await registerUser(data)
      showToast.success('Account created successfully! Please check your email to verify your account.')
    } catch (err: any) {
      showToast.error(err.response?.data?.error || 'Failed to register')
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
        <RegisterForm onSubmit={handleSubmit} loading={loading} />
      </div>
    </div>
  )
}