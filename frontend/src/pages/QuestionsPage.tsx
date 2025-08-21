import React from 'react'
import { Box, Typography, Container } from '@mui/material'
import { QuestionConfiguration } from '../components/QuestionConfiguration'
import { QuestionsDisplay } from '../components/QuestionsDisplay'
import { useCurrentStep } from '../context/AppContext'

export function QuestionsPage() {
  const { setCurrentStep } = useCurrentStep()

  React.useEffect(() => {
    setCurrentStep('questions')
  }, [setCurrentStep])

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Interview Questions
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Personalized technical and behavioral questions based on your experience
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <QuestionConfiguration />
        <QuestionsDisplay />
      </Box>
    </Container>
  )
}