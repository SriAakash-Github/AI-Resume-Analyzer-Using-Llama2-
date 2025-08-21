import React from 'react'
import { Box, Typography, Container } from '@mui/material'
import { FileUpload } from '../components/FileUpload'
import { useCurrentStep } from '../context/AppContext'

export function HomePage() {
  const { setCurrentStep } = useCurrentStep()

  React.useEffect(() => {
    setCurrentStep('upload')
  }, [setCurrentStep])

  return (
    <Container maxWidth="md">
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          AI Resume Analyzer
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          Upload your resume to get personalized interview questions and career guidance
        </Typography>
      </Box>

      <FileUpload />

      <Box sx={{ mt: 6, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Your resume is processed locally using AI. No data is sent to external servers.
        </Typography>
      </Box>
    </Container>
  )
}