import { api } from './api'
import type {
  RegisterDto,
  LoginDto,
  AuthResponse,
  UserDto,
} from '@stable-ride/shared'

export const authService = {
  async register(data: RegisterDto): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data)
    return response.data
  },

  async login(data: LoginDto, rememberMe?: boolean): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', { ...data, rememberMe })
    return response.data
  },

  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('refreshToken')
    try {
      await api.post('/auth/logout', { refreshToken })
    } finally {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    }
  },

  async getMe(): Promise<UserDto> {
    const response = await api.get<{ user: UserDto }>('/auth/me')
    return response.data.user
  },
}