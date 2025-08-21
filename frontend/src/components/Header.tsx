import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Stepper,
  Step,
  StepLabel,
  useTheme,
  useMediaQuery
} from '@mui/material'
import {
  CloudUpload as UploadIcon,
  Analytics as AnalysisIcon,
  Quiz as QuestionIcon,
  TrendingUp as GuidanceIcon
} from '@mui/icons-material'
import { useCurrentStep } from '../context/AppContext'

const steps = [
  { key: 'upload', label: 'Upload Resume', icon: <UploadIcon /> },
  { key: 'analysis', label: 'Analysis', icon: <AnalysisIcon /> },
  { key: 'questions', label: 'Questions', icon: <QuestionIcon /> },
  { key: 'guidance', label: 'Guidance', icon: <GuidanceIcon /> }
]

export function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { currentStep } = useCurrentStep()

  const getCurrentStepIndex = () => {
    const path = location.pathname.slice(1) || 'upload'
    return steps.findIndex(step => step.key === path)
  }

  const handleStepClick = (stepKey: string) => {
    const path = stepKey === 'upload' ? '/' : `/${stepKey}`
    navigate(path)
  }

  const handleLogoClick = () => {
    navigate('/')
  }

  return (
    <AppBar position="static" elevation={1} sx={{ backgroundColor: 'white', color: 'text.primary' }}>
      <Toolbar sx={{ minHeight: { xs: 64, sm: 80 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Button
            onClick={handleLogoClick}
            sx={{ 
              textTransform: 'none',
              color: 'primary.main',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              '&:hover': {
                backgroundColor: 'transparent'
              }
            }}
          >
            Resume Analyzer
          </Button>
        </Box>

        {!isMobile && (
          <Box sx={{ flexGrow: 2, maxWidth: 600, mx: 4 }}>
            <Stepper 
              activeStep={getCurrentStepIndex()} 
              alternativeLabel
              sx={{
                '& .MuiStepLabel-root': {
                  cursor: 'pointer'
                },
                '& .MuiStepIcon-root': {
                  fontSize: '1.5rem'
                }
              }}
            >
              {steps.map((step, index) => (
                <Step key={step.key}>
                  <StepLabel
                    onClick={() => handleStepClick(step.key)}
                    sx={{
                      '& .MuiStepLabel-label': {
                        fontSize: '0.875rem',
                        fontWeight: getCurrentStepIndex() === index ? 600 : 400
                      }
                    }}
                  >
                    {step.label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => window.open('https://github.com/your-repo', '_blank')}
            sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
          >
            GitHub
          </Button>
        </Box>
      </Toolbar>

      {isMobile && (
        <Box sx={{ px: 2, pb: 2 }}>
          <Stepper 
            activeStep={getCurrentStepIndex()} 
            alternativeLabel
            sx={{
              '& .MuiStepLabel-root': {
                cursor: 'pointer'
              },
              '& .MuiStepIcon-root': {
                fontSize: '1.25rem'
              }
            }}
          >
            {steps.map((step, index) => (
              <Step key={step.key}>
                <StepLabel
                  onClick={() => handleStepClick(step.key)}
                  sx={{
                    '& .MuiStepLabel-label': {
                      fontSize: '0.75rem',
                      fontWeight: getCurrentStepIndex() === index ? 600 : 400
                    }
                  }}
                >
                  {step.label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
      )}
    </AppBar>
  )
}