import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import HeroCarousel from '../components/landing/HeroCarousel'
import AuthModal from '../components/landing/AuthModal'

export const Home: React.FC = () => {
  const { user } = useAuth()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup')

  const handleLoginClick = () => {
    setAuthMode('login')
    setAuthModalOpen(true)
  }

  const handleSignupClick = () => {
    setAuthMode('signup')
    setAuthModalOpen(true)
  }

  const handleAuthModalClose = () => {
    setAuthModalOpen(false)
  }

  const handleAuthModeChange = (mode: 'login' | 'signup') => {
    setAuthMode(mode)
  }

  if (user) {
    window.location.href = '/dashboard'
    return null
  }

  return (
    <>
      <HeroCarousel 
        onLoginClick={handleLoginClick}
        onSignupClick={handleSignupClick}
      />
      <AuthModal
        isOpen={authModalOpen}
        onClose={handleAuthModalClose}
        mode={authMode}
        onModeChange={handleAuthModeChange}
      />
    </>
  )
}