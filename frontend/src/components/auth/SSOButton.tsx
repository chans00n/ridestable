import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { showToast } from '@/components/ui/Toast'
import { ssoService } from '@/services/sso.service'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

interface SSOButtonProps {
  provider: 'google'
  action: 'login' | 'register'
  className?: string
}

export const SSOButton: React.FC<SSOButtonProps> = ({ provider, action, className }) => {
  const [loading, setLoading] = useState(false)
  const { refreshUser } = useAuth()
  const navigate = useNavigate()

  const providerConfig = {
    google: {
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      ),
      label: 'Continue with Google'
    }
  }

  const handleSSOLogin = async () => {
    setLoading(true)
    
    try {
      const response = await ssoService.authenticateWithPopup(provider)
      
      if (response.accessToken && response.refreshToken) {
        localStorage.setItem('accessToken', response.accessToken)
        localStorage.setItem('refreshToken', response.refreshToken)
        
        await refreshUser()
        showToast.success(`Successfully ${action === 'login' ? 'logged in' : 'registered'} with ${provider}!`)
        navigate('/dashboard')
      } else {
        throw new Error('Invalid authentication response')
      }
    } catch (error: any) {
      console.error(`SSO ${action} failed:`, error)
      
      // Handle specific error cases
      if (error.message.includes('popup was closed')) {
        showToast.error('Authentication cancelled')
      } else if (error.message.includes('popup blocker')) {
        showToast.error('Please allow popups for this site to use social login')
      } else {
        // Generic error message
        showToast.error(`Unable to ${action} with ${provider}. Please try again.`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleSSOLogin}
      disabled={loading}
      className={className}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
      ) : (
        providerConfig[provider].icon
      )}
      <span className="ml-2">{providerConfig[provider].label}</span>
    </Button>
  )
}