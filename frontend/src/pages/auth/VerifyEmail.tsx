import React, { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '../../components/ui/Button'
import { showToast } from '../../components/ui/Toast'
import { api } from '../../services/api'
import { Skeleton } from '@/components/ui/skeleton'

export const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams()
  const [verifying, setVerifying] = useState(true)
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resending, setResending] = useState(false)

  const token = searchParams.get('token')

  useEffect(() => {
    if (token) {
      verifyEmail(token)
    } else {
      setVerifying(false)
      setError('No verification token provided')
    }
  }, [token])

  const verifyEmail = async (verificationToken: string) => {
    try {
      await api.get(`/auth/verify-email?token=${verificationToken}`)
      setVerified(true)
      showToast.success('Email verified successfully!')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to verify email')
    } finally {
      setVerifying(false)
    }
  }

  const resendVerificationEmail = async () => {
    const email = prompt('Please enter your email address:')
    if (!email) return

    try {
      setResending(true)
      await api.post('/auth/resend-verification', { email })
      showToast.success('Verification email sent! Check your inbox.')
    } catch (err: any) {
      showToast.error(err.response?.data?.error || 'Failed to send verification email')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white p-8 rounded-lg shadow-lg text-center"
        >
          {verifying ? (
            <>
              <Skeleton className="h-12 w-12 rounded-full mx-auto" />
              <h2 className="mt-4 text-2xl font-bold text-gray-900">Verifying your email...</h2>
            </>
          ) : verified ? (
            <>
              <div className="rounded-full bg-green-100 p-3 mx-auto w-fit">
                <svg className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mt-4 text-2xl font-bold text-gray-900">Email Verified!</h2>
              <p className="mt-2 text-gray-600">
                Your email has been successfully verified. You can now access all features of Stable Ride.
              </p>
              <div className="mt-6">
                <Link to="/dashboard">
                  <Button fullWidth>Go to Dashboard</Button>
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-full bg-red-100 p-3 mx-auto w-fit">
                <svg className="h-12 w-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="mt-4 text-2xl font-bold text-gray-900">Verification Failed</h2>
              <p className="mt-2 text-gray-600">
                {error || 'We couldn\'t verify your email. The link may have expired or is invalid.'}
              </p>
              <div className="mt-6 space-y-3">
                <Button
                  fullWidth
                  onClick={resendVerificationEmail}
                  loading={resending}
                  disabled={resending}
                >
                  Resend Verification Email
                </Button>
                <Link to="/login">
                  <Button fullWidth variant="outline">
                    Back to Login
                  </Button>
                </Link>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}