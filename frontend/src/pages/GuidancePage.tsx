import React from 'react'
import { Box, Typography, Container } from '@mui/material'
import { CareerGuidance } from '../components/CareerGuidance'
import { useCurrentStep } from '../context/AppContext'

export function GuidancePage() {
  const { setCurrentStep } = useCurrentStep()

  React.useEffect(() => {
    setCurrentStep('guidance')
  }, [setCurrentStep])

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Career Guidance
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Personalized roadmap and recommendations for your career development
        </Typography>
      </Box>

      <CareerGuidance />
    </Container>
  )
}