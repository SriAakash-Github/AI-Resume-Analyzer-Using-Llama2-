import { useMutation, useQuery } from 'react-query'
import { 
  ResumeAnalysis, 
  Question, 
  CareerRoadmap, 
  QuestionConfig,
  ApiResponse,
  UploadResult
} from '../types'
import { apiClient } from '../services/api'

// Upload file hook
export function useUploadFile() {
  return useMutation<ApiResponse<UploadResult>, Error, File>({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('resume', file)
      
      const response = await apiClient.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      return response.data
    }
  })
}

// Analyze resume hook
export function useAnalyzeResume() {
  return useMutation<ApiResponse<ResumeAnalysis>, Error, string>({
    mutationFn: async (fileId: string) => {
      const response = await apiClient.post('/analysis', { fileId })
      return response.data
    }
  })
}

// Generate questions hook
export function useGenerateQuestions() {
  return useMutation<ApiResponse<{ questions: Question[]; summary: any }>, Error, {
    analysis: ResumeAnalysis
    config: QuestionConfig
  }>({
    mutationFn: async ({ analysis, config }) => {
      const response = await apiClient.post('/questions', { analysis, config })
      return response.data
    }
  })
}

// Generate technical questions only
export function useGenerateTechnicalQuestions() {
  return useMutation<ApiResponse<{ questions: Question[]; summary: any }>, Error, {
    skills: any
    count: number
    difficulty: string
  }>({
    mutationFn: async ({ skills, count, difficulty }) => {
      const response = await apiClient.post('/questions/technical', { skills, count, difficulty })
      return response.data
    }
  })
}

// Generate behavioral questions only
export function useGenerateBehavioralQuestions() {
  return useMutation<ApiResponse<{ questions: Question[]; summary: any }>, Error, {
    experience: any[]
    count: number
  }>({
    mutationFn: async ({ experience, count }) => {
      const response = await apiClient.post('/questions/behavioral', { experience, count })
      return response.data
    }
  })
}

// Generate career guidance hook
export function useGenerateGuidance() {
  return useMutation<ApiResponse<CareerRoadmap>, Error, ResumeAnalysis>({
    mutationFn: async (analysis: ResumeAnalysis) => {
      const response = await apiClient.post('/guidance', { analysis })
      return response.data
    }
  })
}

// Health check hooks
export function useHealthCheck() {
  return useQuery<ApiResponse<any>, Error>({
    queryKey: ['health'],
    queryFn: async () => {
      const response = await apiClient.get('/health')
      return response.data
    },
    refetchInterval: 30000, // Check every 30 seconds
    retry: 1
  })
}

export function useOllamaHealth() {
  return useQuery<ApiResponse<any>, Error>({
    queryKey: ['health', 'ollama'],
    queryFn: async () => {
      const response = await apiClient.get('/health/ollama')
      return response.data
    },
    refetchInterval: 60000, // Check every minute
    retry: 1
  })
}

// Delete file hook
export function useDeleteFile() {
  return useMutation<ApiResponse, Error, string>({
    mutationFn: async (fileId: string) => {
      const response = await apiClient.delete(`/upload/${fileId}`)
      return response.data
    }
  })
}