import axios from 'axios'

// Create axios instance
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 300000, // 5 minutes for AI operations
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add any auth headers here if needed
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error('API Request Error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`)
    return response
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message)
    
    // Handle common error scenarios
    if (error.response?.status === 413) {
      throw new Error('File too large. Please upload a file smaller than 10MB.')
    }
    
    if (error.response?.status === 503) {
      throw new Error('AI service is temporarily unavailable. Please try again later.')
    }
    
    if (error.code === 'ECONNREFUSED') {
      throw new Error('Unable to connect to the server. Please check if the backend is running.')
    }
    
    if (error.code === 'NETWORK_ERROR') {
      throw new Error('Network error. Please check your internet connection.')
    }
    
    // Return the original error for other cases
    return Promise.reject(error)
  }
)