import React, { useState } from 'react'
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
        <RegisterForm onSubmit={handleSubmit} loading={loading} />
      </div>
    </div>
  )
}