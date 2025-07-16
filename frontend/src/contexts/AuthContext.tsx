import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/auth'
import { ssoService } from '../services/sso.service'
import type { UserDto, LoginDto, RegisterDto } from '@stable-ride/shared'

interface LoginFormData extends LoginDto {
  rememberMe?: boolean
}

interface AuthContextType {
  user: UserDto | null
  loading: boolean
  login: (data: LoginFormData) => Promise<void>
  register: (data: RegisterDto) => Promise<void>
  loginWithSSO: (provider: 'google') => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserDto | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken')
      if (token) {
        try {
          const userData = await authService.getMe()
          setUser(userData)
        } catch (error) {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = async (data: LoginFormData) => {
    const { rememberMe, ...loginData } = data
    const response = await authService.login(loginData, rememberMe)
    localStorage.setItem('accessToken', response.accessToken)
    localStorage.setItem('refreshToken', response.refreshToken)
    setUser(response.user)
    navigate('/dashboard')
  }

  const register = async (data: RegisterDto) => {
    const response = await authService.register(data)
    localStorage.setItem('accessToken', response.accessToken)
    localStorage.setItem('refreshToken', response.refreshToken)
    setUser(response.user)
    navigate('/dashboard')
  }

  const logout = async () => {
    await authService.logout()
    setUser(null)
    navigate('/login')
  }

  const refreshUser = async () => {
    try {
      const userData = await authService.getMe()
      setUser(userData)
    } catch (error) {
      console.error('Failed to refresh user data:', error)
    }
  }

  const loginWithSSO = async (provider: 'google') => {
    try {
      const response = await ssoService.authenticateWithPopup(provider)
      if (response.accessToken && response.refreshToken) {
        localStorage.setItem('accessToken', response.accessToken)
        localStorage.setItem('refreshToken', response.refreshToken)
        setUser(response.user)
        navigate('/dashboard')
      }
    } catch (error) {
      console.error(`SSO login with ${provider} failed:`, error)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithSSO, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}