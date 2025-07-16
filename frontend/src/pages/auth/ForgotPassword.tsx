import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ResetPasswordRequestSchema, type ResetPasswordRequestDto } from '@stable-ride/shared'
import { motion } from 'framer-motion'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { showToast } from '../../components/ui/Toast'
import { api } from '../../services/api'

export const ForgotPassword: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordRequestDto>({
    resolver: zodResolver(ResetPasswordRequestSchema),
  })

  const onSubmit = async (data: ResetPasswordRequestDto) => {
    try {
      setLoading(true)
      await api.post('/auth/request-password-reset', data)
      setSubmitted(true)
      showToast.success('Password reset email sent!')
    } catch (err: any) {
      showToast.error(err.response?.data?.error || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white p-8 rounded-lg shadow-lg"
        >
          {!submitted ? (
            <>
              <div className="text-center">
                <h2 className="text-3xl font-extrabold text-gray-900">
                  Forgot your password?
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="john@example.com"
                  error={errors.email?.message}
                  {...register('email')}
                  icon={
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  }
                />

                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  loading={loading}
                  disabled={loading}
                >
                  Send Reset Email
                </Button>

                <div className="text-center">
                  <Link
                    to="/login"
                    className="text-sm font-medium text-primary-600 hover:text-primary-500"
                  >
                    Back to login
                  </Link>
                </div>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="rounded-full bg-green-100 p-3 mx-auto w-fit mb-4">
                <svg className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
              <p className="text-gray-600 mb-6">
                We've sent a password reset link to your email address. Please check your inbox and follow the instructions.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <Link to="/login">
                <Button fullWidth variant="outline">
                  Back to Login
                </Button>
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}