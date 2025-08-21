import React from 'react'
import {
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
  Slider,
  Alert
} from '@mui/material'
import { Settings as SettingsIcon } from '@mui/icons-material'
import { useQuestionsState, useAnalysisState } from '../context/AppContext'
import { useGenerateQuestions } from '../hooks/useApi'
import { validateQuestionConfig } from '../utils/validation'
import { DifficultyLevel } from '../types'

export function QuestionConfiguration() {
  const { questionsState, setQuestionsState } = useQuestionsState()
  const { analysisState } = useAnalysisState()
  const generateMutation = useGenerateQuestions()
  const [errors, setErrors] = React.useState<string[]>([])

  const handleConfigChange = (field: string, value: any) => {
    setQuestionsState({
      config: {
        ...questionsState.config,
        [field]: value
      }
    })
    // Clear errors when user makes changes
    setErrors([])
  }

  const handleGenerate = async () => {
    if (!analysisState.analysis) {
      setErrors(['Please complete resume analysis first'])
      return
    }

    // Validate configuration
    const validationErrors = validateQuestionConfig(questionsState.config)
    if (validationErrors.length > 0) {
      setErrors(validationErrors.map(e => e.message))
      return
    }

    setQuestionsState({
      isGenerating: true,
      progress: 0,
      error: undefined
    })

    try {
      // Simulate progress
      const progressSteps = [25, 50, 75, 90]
      for (const progress of progressSteps) {
        setQuestionsState({ progress })
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      const result = await generateMutation.mutateAsync({
        analysis: analysisState.analysis,
        config: questionsState.config
      })

      if (result.success) {
        setQuestionsState({
          isGenerating: false,
          progress: 100,
          questions: result.data.questions,
          error: undefined
        })
      } else {
        throw new Error(result.error?.message || 'Question generation failed')
      }
    } catch (error) {
      setQuestionsState({
        isGenerating: false,
        progress: 0,
        error: error instanceof Error ? error.message : 'Question generation failed'
      })
    }
  }

  const difficultyOptions: DifficultyLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'Mixed']

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <SettingsIcon color="primary" />
          <Typography variant="h6">Question Configuration</Typography>
        </Box>

        {errors.length > 0 && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errors.map((error, index) => (
              <Typography key={index} variant="body2">
                {error}
              </Typography>
            ))}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" gutterBottom>
              Technical Questions: {questionsState.config.technicalCount}
            </Typography>
            <Slider
              value={questionsState.config.technicalCount}
              onChange={(_, value) => handleConfigChange('technicalCount', value)}
              min={1}
              max={50}
              step={1}
              marks={[
                { value: 1, label: '1' },
                { value: 10, label: '10' },
                { value: 25, label: '25' },
                { value: 50, label: '50' }
              ]}
              disabled={questionsState.isGenerating}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" gutterBottom>
              Behavioral Questions: {questionsState.config.behavioralCount}
            </Typography>
            <Slider
              value={questionsState.config.behavioralCount}
              onChange={(_, value) => handleConfigChange('behavioralCount', value)}
              min={1}
              max={50}
              step={1}
              marks={[
                { value: 1, label: '1' },
                { value: 10, label: '10' },
                { value: 25, label: '25' },
                { value: 50, label: '50' }
              ]}
              disabled={questionsState.isGenerating}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Difficulty Level</InputLabel>
              <Select
                value={questionsState.config.difficulty}
                label="Difficulty Level"
                onChange={(e) => handleConfigChange('difficulty', e.target.value)}
                disabled={questionsState.isGenerating}
              >
                {difficultyOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleGenerate}
            disabled={questionsState.isGenerating || !analysisState.analysis}
          >
            {questionsState.isGenerating 
              ? `Generating Questions... ${questionsState.progress}%`
              : 'Generate Questions'
            }
          </Button>
        </Box>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Total: {questionsState.config.technicalCount + questionsState.config.behavioralCount} questions
            {questionsState.config.difficulty !== 'Mixed' && ` • ${questionsState.config.difficulty} difficulty`}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}