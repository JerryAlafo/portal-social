import axios from 'axios'
import { isGuestModeActive, notifyLoginRequired } from '@/lib/guest-mode'

// Base Axios instance for calling our own Next.js API routes
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Intercept 401 responses and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      if (isGuestModeActive()) {
        notifyLoginRequired()
        return Promise.reject(error)
      }

      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
