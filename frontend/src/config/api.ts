// Get API URL from environment
export const getApiUrl = (): string => {
  try {
    if (typeof window !== 'undefined' && (window as any).import?.meta?.env?.VITE_API_URL) {
      return (window as any).import.meta.env.VITE_API_URL
    }
    // Fallback to environment variable
    return process.env.VITE_API_URL || 'http://localhost:3001'
  } catch {
    return 'http://localhost:3001'
  }
}

export const getGoogleClientId = (): string => {
  try {
    if (typeof window !== 'undefined' && (window as any).import?.meta?.env?.VITE_GOOGLE_CLIENT_ID) {
      return (window as any).import.meta.env.VITE_GOOGLE_CLIENT_ID
    }
    // Fallback to environment variable
    return process.env.VITE_GOOGLE_CLIENT_ID || ''
  } catch {
    return ''
  }
}

export const API_URL = getApiUrl()
export const GOOGLE_CLIENT_ID = getGoogleClientId()

// Check if Google OAuth is enabled
export const isGoogleOAuthEnabled = (): boolean => {
  const clientId = getGoogleClientId()
  return clientId && clientId !== 'seu-client-id.apps.googleusercontent.com'
}


