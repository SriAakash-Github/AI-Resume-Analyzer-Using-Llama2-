import React from 'react'
import { Box, Typography, Container } from '@mui/material'
import { AnalysisDashboard } from '../components/AnalysisDashboard'
import { useCurrentStep } from '../context/AppContext'

export function AnalysisPage() {
  const { setCurrentStep } = useCurrentStep()

  React.useEffect(() => {
    setCurrentStep('analysis')
  }, [setCurrentStep])

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Resume Analysis
        </Typography>
        <Typography variant="body1" color="text.secondary">
          AI-powered analysis of your resume content, skills, and experience
        </Typography>
      </Box>

      <AnalysisDashboard />
    </Container>
  )
}