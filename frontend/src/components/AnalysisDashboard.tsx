import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  Button,
  Divider
} from '@mui/material'
import {
  Person as PersonIcon,
  Work as WorkIcon,
  School as EducationIcon,
  Code as SkillsIcon,
  Assignment as ProjectIcon
} from '@mui/icons-material'
import { useAnalysisState, useUploadState } from '../context/AppContext'
import { useAnalyzeResume } from '../hooks/useApi'

export function AnalysisDashboard() {
  const navigate = useNavigate()
  const { uploadState } = useUploadState()
  const { analysisState, setAnalysisState } = useAnalysisState()
  const analyzeMutation = useAnalyzeResume()

  useEffect(() => {
    if (uploadState.fileId && !analysisState.analysis && !analysisState.isAnalyzing) {
      handleAnalyze()
    }
  }, [uploadState.fileId])

  const handleAnalyze = async () => {
    if (!uploadState.fileId) {
      navigate('/')
      return
    }

    setAnalysisState({
      isAnalyzing: true,
      progress: 0,
      currentStep: 'Starting analysis...',
      error: undefined
    })

    try {
      // Simulate progress updates
      const progressSteps = [
        { progress: 20, step: 'Extracting PDF content...' },
        { progress: 40, step: 'Analyzing resume structure...' },
        { progress: 60, step: 'Extracting skills and experience...' },
        { progress: 80, step: 'Determining seniority level...' },
        { progress: 90, step: 'Generating career summary...' }
      ]

      for (const { progress, step } of progressSteps) {
        setAnalysisState({ progress, currentStep: step })
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      const result = await analyzeMutation.mutateAsync(uploadState.fileId)
      
      if (result.success) {
        setAnalysisState({
          isAnalyzing: false,
          progress: 100,
          currentStep: 'Analysis complete!',
          analysis: result.data,
          error: undefined
        })
      } else {
        throw new Error(result.error?.message || 'Analysis failed')
      }
    } catch (error) {
      setAnalysisState({
        isAnalyzing: false,
        progress: 0,
        currentStep: 'Analysis failed',
        error: error instanceof Error ? error.message : 'Analysis failed'
      })
    }
  }

  const handleRetry = () => {
    handleAnalyze()
  }

  const handleProceedToQuestions = () => {
    navigate('/questions')
  }

  if (!uploadState.fileId) {
    return (
      <Alert severity="warning">
        No file uploaded. Please go back and upload your resume first.
        <Button onClick={() => navigate('/')} sx={{ ml: 2 }}>
          Upload Resume
        </Button>
      </Alert>
    )
  }

  if (analysisState.isAnalyzing) {
    return (
      <Card>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Analyzing Your Resume
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {analysisState.currentStep}
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={analysisState.progress} 
            sx={{ mb: 2, height: 8, borderRadius: 4 }}
          />
          <Typography variant="body2" color="text.secondary">
            {analysisState.progress}% complete
          </Typography>
        </CardContent>
      </Card>
    )
  }

  if (analysisState.error) {
    return (
      <Alert severity="error" action={
        <Button color="inherit" size="small" onClick={handleRetry}>
          Retry
        </Button>
      }>
        {analysisState.error}
      </Alert>
    )
  }

  if (!analysisState.analysis) {
    return (
      <Card>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Ready to Analyze
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Click the button below to start analyzing your resume
          </Typography>
          <Button variant="contained" onClick={handleAnalyze}>
            Start Analysis
          </Button>
        </CardContent>
      </Card>
    )
  }

  const analysis = analysisState.analysis

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Summary Card */}
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Analysis Summary
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <PersonIcon color="primary" />
                <Typography variant="h6">
                  {analysis.personalInfo.name || 'Name not found'}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {analysis.careerSummary}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Chip 
                  label={`${analysis.seniorityLevel} Level`} 
                  color="primary" 
                  variant="outlined" 
                />
                <Chip 
                  label={`${analysis.totalExperienceYears} years experience`} 
                  color="secondary" 
                  variant="outlined" 
                />
                <Chip 
                  label={`${analysis.experience.length} positions`} 
                  variant="outlined" 
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Experience Section */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <WorkIcon color="primary" />
            <Typography variant="h6">Experience</Typography>
          </Box>
          {analysis.experience.slice(0, 3).map((exp, index) => (
            <Box key={exp.id} sx={{ mb: index < 2 ? 2 : 0 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {exp.position}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {exp.company} • {exp.startDate} - {exp.endDate || 'Present'}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {exp.description}
              </Typography>
              {index < 2 && <Divider sx={{ mt: 2 }} />}
            </Box>
          ))}
          {analysis.experience.length > 3 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              +{analysis.experience.length - 3} more positions
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Skills Section */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <SkillsIcon color="primary" />
            <Typography variant="h6">Skills</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Programming Languages
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {analysis.skills.languages.map((lang) => (
                  <Chip 
                    key={lang.name} 
                    label={`${lang.name} (${lang.proficiencyLevel})`}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Technical Skills
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {analysis.skills.technical.slice(0, 6).map((skill) => (
                  <Chip 
                    key={skill.name} 
                    label={skill.name}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Action Button */}
      <Box sx={{ textAlign: 'center', mt: 2 }}>
        <Button 
          variant="contained" 
          size="large" 
          onClick={handleProceedToQuestions}
        >
          Generate Interview Questions
        </Button>
      </Box>
    </Box>
  )
}