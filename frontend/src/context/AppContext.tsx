import React, { createContext, useContext, useReducer, ReactNode } from 'react'
import { 
  ResumeAnalysis, 
  Question, 
  CareerRoadmap, 
  QuestionConfig,
  UploadState,
  AnalysisState,
  QuestionGenerationState,
  GuidanceState
} from '../types'

// State interface
interface AppState {
  upload: UploadState
  analysis: AnalysisState
  questions: QuestionGenerationState
  guidance: GuidanceState
  currentStep: 'upload' | 'analysis' | 'questions' | 'guidance'
}

// Action types
type AppAction =
  | { type: 'SET_UPLOAD_STATE'; payload: Partial<UploadState> }
  | { type: 'SET_ANALYSIS_STATE'; payload: Partial<AnalysisState> }
  | { type: 'SET_QUESTIONS_STATE'; payload: Partial<QuestionGenerationState> }
  | { type: 'SET_GUIDANCE_STATE'; payload: Partial<GuidanceState> }
  | { type: 'SET_CURRENT_STEP'; payload: AppState['currentStep'] }
  | { type: 'RESET_STATE' }

// Initial state
const initialState: AppState = {
  upload: {
    isUploading: false,
    progress: 0
  },
  analysis: {
    isAnalyzing: false,
    progress: 0,
    currentStep: 'Waiting to start...'
  },
  questions: {
    isGenerating: false,
    progress: 0,
    config: {
      technicalCount: 10,
      behavioralCount: 10,
      difficulty: 'Mixed'
    }
  },
  guidance: {
    isGenerating: false
  },
  currentStep: 'upload'
}

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_UPLOAD_STATE':
      return {
        ...state,
        upload: { ...state.upload, ...action.payload }
      }
    case 'SET_ANALYSIS_STATE':
      return {
        ...state,
        analysis: { ...state.analysis, ...action.payload }
      }
    case 'SET_QUESTIONS_STATE':
      return {
        ...state,
        questions: { ...state.questions, ...action.payload }
      }
    case 'SET_GUIDANCE_STATE':
      return {
        ...state,
        guidance: { ...state.guidance, ...action.payload }
      }
    case 'SET_CURRENT_STEP':
      return {
        ...state,
        currentStep: action.payload
      }
    case 'RESET_STATE':
      return initialState
    default:
      return state
  }
}

// Context
const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<AppAction>
} | null>(null)

// Provider component
interface AppProviderProps {
  children: ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

// Hook to use the context
export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}

// Convenience hooks for specific state slices
export function useUploadState() {
  const { state, dispatch } = useAppContext()
  
  const setUploadState = (payload: Partial<UploadState>) => {
    dispatch({ type: 'SET_UPLOAD_STATE', payload })
  }

  return {
    uploadState: state.upload,
    setUploadState
  }
}

export function useAnalysisState() {
  const { state, dispatch } = useAppContext()
  
  const setAnalysisState = (payload: Partial<AnalysisState>) => {
    dispatch({ type: 'SET_ANALYSIS_STATE', payload })
  }

  return {
    analysisState: state.analysis,
    setAnalysisState
  }
}

export function useQuestionsState() {
  const { state, dispatch } = useAppContext()
  
  const setQuestionsState = (payload: Partial<QuestionGenerationState>) => {
    dispatch({ type: 'SET_QUESTIONS_STATE', payload })
  }

  return {
    questionsState: state.questions,
    setQuestionsState
  }
}

export function useGuidanceState() {
  const { state, dispatch } = useAppContext()
  
  const setGuidanceState = (payload: Partial<GuidanceState>) => {
    dispatch({ type: 'SET_GUIDANCE_STATE', payload })
  }

  return {
    guidanceState: state.guidance,
    setGuidanceState
  }
}

export function useCurrentStep() {
  const { state, dispatch } = useAppContext()
  
  const setCurrentStep = (step: AppState['currentStep']) => {
    dispatch({ type: 'SET_CURRENT_STEP', payload: step })
  }

  return {
    currentStep: state.currentStep,
    setCurrentStep
  }
}