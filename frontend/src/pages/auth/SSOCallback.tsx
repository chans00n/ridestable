import React, { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ssoService } from '@/services/sso.service'
import { useAuth } from '@/contexts/AuthContext'
import { showToast } from '@/components/ui/Toast'
import { Loader2 } from 'lucide-react'

export const SSOCallback: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { refreshUser } = useAuth()

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code')
      const state = searchParams.get('state')
      const error = searchParams.get('error')
      const provider = window.location.pathname.split('/').pop() // e.g., /auth/callback/google

      if (error) {
        showToast.error(`Authentication failed: ${error}`)
        navigate('/login')
        return
      }

      if (!code || !provider) {
        showToast.error('Invalid authentication response')
        navigate('/login')
        return
      }

      try {
        const response = await ssoService.handleCallback(provider, code, state || undefined)
        
        if (response.accessToken && response.refreshToken) {
          localStorage.setItem('accessToken', response.accessToken)
          localStorage.setItem('refreshToken', response.refreshToken)
          
          // If we're in a popup, send message to parent window
          if (window.opener) {
            window.opener.postMessage({
              type: 'sso-success',
              payload: response
            }, window.location.origin)
            window.close()
          } else {
            // Otherwise redirect to dashboard
            await refreshUser()
            showToast.success('Successfully logged in!')
            navigate('/dashboard')
          }
        }
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.message || 'Authentication failed'
        
        if (window.opener) {
          window.opener.postMessage({
            type: 'sso-error',
            error: errorMessage
          }, window.location.origin)
          window.close()
        } else {
          showToast.error(errorMessage)
          navigate('/login')
        }
      }
    }

    handleCallback()
  }, [searchParams, navigate, refreshUser])

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  )
}