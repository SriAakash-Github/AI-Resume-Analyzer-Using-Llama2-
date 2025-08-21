import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Alert,
  Grid,
  Divider
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  Code as TechnicalIcon,
  Psychology as BehavioralIcon,
  Download as DownloadIcon,
  Timer as TimerIcon
} from '@mui/icons-material'
import { useQuestionsState } from '../context/AppContext'
import { Question } from '../types'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`questions-tabpanel-${index}`}
      aria-labelledby={`questions-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

export function QuestionsDisplay() {
  const { questionsState } = useQuestionsState()
  const [tabValue, setTabValue] = useState(0)
  const [expandedQuestion, setExpandedQuestion] = useState<string | false>(false)

  if (!questionsState.questions || questionsState.questions.length === 0) {
    if (questionsState.error) {
      return (
        <Alert severity="error">
          {questionsState.error}
        </Alert>
      )
    }
    return null
  }

  const technicalQuestions = questionsState.questions.filter(q => q.type === 'technical')
  const behavioralQuestions = questionsState.questions.filter(q => q.type === 'behavioral')

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleAccordionChange = (panel: string) => (
    event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpandedQuestion(isExpanded ? panel : false)
  }

  const handleExport = () => {
    const content = questionsState.questions.map((q, index) => 
      `${index + 1}. ${q.question}\n\nCategory: ${q.category}\nDifficulty: ${q.difficulty}\nType: ${q.type}\nEstimated Time: ${q.estimatedTime || 'N/A'}\n\nSuggested Answer Framework:\n${q.suggestedAnswerFramework || 'N/A'}\n\n---\n\n`
    ).join('')

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'interview-questions.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const renderQuestions = (questions: Question[]) => (
    <Box>
      {questions.map((question, index) => (
        <Accordion
          key={question.id}
          expanded={expandedQuestion === question.id}
          onChange={handleAccordionChange(question.id)}
          sx={{ mb: 1 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body1" sx={{ flexGrow: 1 }}>
                <strong>Q{index + 1}:</strong> {question.question}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                <Chip 
                  label={question.difficulty} 
                  size="small" 
                  color={
                    question.difficulty === 'Beginner' ? 'success' :
                    question.difficulty === 'Intermediate' ? 'warning' : 'error'
                  }
                />
                <Chip 
                  label={question.category} 
                  size="small" 
                  variant="outlined" 
                />
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <Typography variant="subtitle2" gutterBottom>
                  Suggested Answer Framework:
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {question.suggestedAnswerFramework || 'No framework provided'}
                </Typography>
                
                {question.relatedSkills && question.relatedSkills.length > 0 && (
                  <>
                    <Typography variant="subtitle2" gutterBottom>
                      Related Skills:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      {question.relatedSkills.map((skill) => (
                        <Chip key={skill} label={skill} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </>
                )}
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {question.estimatedTime && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TimerIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {question.estimatedTime}
                      </Typography>
                    </Box>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    Type: {question.type}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Category: {question.category}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  )

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Generated Questions ({questionsState.questions.length})
          </Typography>
          <Button
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            variant="outlined"
            size="small"
          >
            Export
          </Button>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab 
              icon={<TechnicalIcon />} 
              label={`Technical (${technicalQuestions.length})`} 
              iconPosition="start"
            />
            <Tab 
              icon={<BehavioralIcon />} 
              label={`Behavioral (${behavioralQuestions.length})`} 
              iconPosition="start"
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {technicalQuestions.length > 0 ? (
            renderQuestions(technicalQuestions)
          ) : (
            <Typography color="text.secondary">
              No technical questions generated
            </Typography>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {behavioralQuestions.length > 0 ? (
            renderQuestions(behavioralQuestions)
          ) : (
            <Typography color="text.secondary">
              No behavioral questions generated
            </Typography>
          )}
        </TabPanel>
      </CardContent>
    </Card>
  )
}