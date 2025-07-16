import { api } from './api'

export interface SSOProvider {
  name: 'google' | 'apple'
  displayName: string
  authUrl?: string
}

export const ssoService = {
  // Initiate SSO login flow
  async initiateSSO(provider: string) {
    try {
      const { data } = await api.get(`/auth/sso/${provider}/url`)
      return data.authUrl
    } catch (error) {
      console.error(`Failed to get ${provider} auth URL:`, error)
      throw error
    }
  },

  // Handle SSO callback
  async handleCallback(provider: string, code: string, state?: string) {
    try {
      const { data } = await api.post(`/auth/sso/${provider}/callback`, {
        code,
        state
      })
      return data
    } catch (error) {
      console.error(`Failed to handle ${provider} callback:`, error)
      throw error
    }
  },

  // For client-side OAuth popup flow
  async authenticateWithPopup(provider: string): Promise<any> {
    const width = 500
    const height = 600
    const left = window.screenX + (window.outerWidth - width) / 2
    const top = window.screenY + (window.outerHeight - height) / 2

    // Get auth URL from backend
    const authUrl = await this.initiateSSO(provider)
    
    // Open popup window
    const popup = window.open(
      authUrl,
      `${provider}-auth`,
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
    )

    if (!popup) {
      throw new Error('Failed to open authentication popup. Please check your popup blocker settings.')
    }

    // Return a promise that resolves when we receive the auth result
    return new Promise((resolve, reject) => {
      // Listen for messages from the popup
      const handleMessage = (event: MessageEvent) => {
        // Verify the message origin
        if (event.origin !== window.location.origin) return

        if (event.data.type === 'sso-success') {
          window.removeEventListener('message', handleMessage)
          popup.close()
          resolve(event.data.payload)
        } else if (event.data.type === 'sso-error') {
          window.removeEventListener('message', handleMessage)
          popup.close()
          reject(new Error(event.data.error))
        }
      }

      window.addEventListener('message', handleMessage)

      // Check if popup was closed without completing auth
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed)
          window.removeEventListener('message', handleMessage)
          reject(new Error('Authentication popup was closed'))
        }
      }, 1000)
    })
  },

  // Get available SSO providers
  getProviders(): SSOProvider[] {
    return [
      {
        name: 'google',
        displayName: 'Google'
      },
      {
        name: 'apple',
        displayName: 'Apple'
      }
    ]
  }
}