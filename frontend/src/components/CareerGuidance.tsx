import React, { useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  Alert,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  TrendingUp as GrowthIcon,
  School as LearningIcon,
  Assignment as TaskIcon,
  Schedule as TimeIcon,
  Priority as PriorityIcon,
  Link as LinkIcon
} from '@mui/icons-material'
import { useGuidanceState, useAnalysisState } from '../context/AppContext'
import { useGenerateGuidance } from '../hooks/useApi'

export function CareerGuidance() {
  const { guidanceState, setGuidanceState } = useGuidanceState()
  const { analysisState } = useAnalysisState()
  const guidanceMutation = useGenerateGuidance()

  useEffect(() => {
    if (analysisState.analysis && !guidanceState.roadmap && !guidanceState.isGenerating) {
      handleGenerateGuidance()
    }
  }, [analysisState.analysis])

  const handleGenerateGuidance = async () => {
    if (!analysisState.analysis) {
      setGuidanceState({ error: 'Please complete resume analysis first' })
      return
    }

    setGuidanceState({
      isGenerating: true,
      error: undefined
    })

    try {
      const result = await guidanceMutation.mutateAsync(analysisState.analysis)
      
      if (result.success) {
        setGuidanceState({
          isGenerating: false,
          roadmap: result.data,
          error: undefined
        })
      } else {
        throw new Error(result.error?.message || 'Guidance generation failed')
      }
    } catch (error) {
      setGuidanceState({
        isGenerating: false,
        error: error instanceof Error ? error.message : 'Guidance generation failed'
      })
    }
  }

  const handleRetry = () => {
    handleGenerateGuidance()
  }

  if (!analysisState.analysis) {
    return (
      <Alert severity="warning">
        Please complete resume analysis first to generate career guidance.
      </Alert>
    )
  }

  if (guidanceState.isGenerating) {
    return (
      <Card>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <GrowthIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Generating Career Guidance
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Analyzing your profile and creating personalized recommendations...
          </Typography>
          <LinearProgress sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            This may take a few moments
          </Typography>
        </CardContent>
      </Card>
    )
  }

  if (guidanceState.error) {
    return (
      <Alert 
        severity="error" 
        action={
          <Button color="inherit" size="small" onClick={handleRetry}>
            Retry
          </Button>
        }
      >
        {guidanceState.error}
      </Alert>
    )
  }

  if (!guidanceState.roadmap) {
    return (
      <Card>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Ready to Generate Guidance
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Get personalized career recommendations based on your resume
          </Typography>
          <Button variant="contained" onClick={handleGenerateGuidance}>
            Generate Career Guidance
          </Button>
        </CardContent>
      </Card>
    )
  }

  const roadmap = guidanceState.roadmap

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'error'
      case 'Medium': return 'warning'
      case 'Low': return 'success'
      default: return 'default'
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Career Overview */}
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Career Roadmap
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Current Level: <strong>{roadmap.currentLevel}</strong>
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                Target Role: <strong>{roadmap.targetRole || 'Not specified'}</strong>
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                Timeline: <strong>{roadmap.timelineEstimate}</strong>
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip 
                  label={`${roadmap.overallPriority} Priority`}
                  color={getPriorityColor(roadmap.overallPriority)}
                  variant="outlined"
                />
                <Chip 
                  label={`${roadmap.skillGaps.length} Skill Gaps`}
                  variant="outlined"
                />
                <Chip 
                  label={`${roadmap.recommendedPath.length} Steps`}
                  variant="outlined"
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Skill Gaps */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Skill Gap Analysis
          </Typography>
          <Grid container spacing={2}>
            {roadmap.skillGaps.map((gap, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card variant="outlined">
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2">
                        {gap.skill}
                      </Typography>
                      <Chip 
                        label={gap.priority}
                        size="small"
                        color={getPriorityColor(gap.priority)}
                        variant="outlined"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {gap.currentLevel} → {gap.targetLevel}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <TimeIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {gap.estimatedLearningTime}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Roadmap Steps */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Development Roadmap
          </Typography>
          {roadmap.recommendedPath.map((step, index) => (
            <Accordion key={step.id} sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Typography variant="h6" color="primary">
                    {index + 1}
                  </Typography>
                  <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                    {step.title}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip 
                      label={step.priority}
                      size="small"
                      color={getPriorityColor(step.priority)}
                      variant="outlined"
                    />
                    <Chip 
                      label={step.estimatedTime}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {step.description}
                </Typography>
                
                {step.skills.length > 0 && (
                  <>
                    <Typography variant="subtitle2" gutterBottom>
                      Skills to Develop:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      {step.skills.map((skill) => (
                        <Chip key={skill} label={skill} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </>
                )}

                {step.prerequisites && step.prerequisites.length > 0 && (
                  <>
                    <Typography variant="subtitle2" gutterBottom>
                      Prerequisites:
                    </Typography>
                    <List dense>
                      {step.prerequisites.map((prereq, idx) => (
                        <ListItem key={idx}>
                          <ListItemIcon>
                            <TaskIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={prereq} />
                        </ListItem>
                      ))}
                    </List>
                  </>
                )}
              </AccordionDetails>
            </Accordion>
          ))}
        </CardContent>
      </Card>
    </Box>
  )
}