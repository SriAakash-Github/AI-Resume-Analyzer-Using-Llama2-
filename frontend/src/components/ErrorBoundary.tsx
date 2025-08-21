import React, { Component, ErrorInfo, ReactNode } from 'react'
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent,
  Alert,
  Container
} from '@mui/material'
import { Refresh as RefreshIcon, BugReport as BugIcon } from '@mui/icons-material'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Card sx={{ textAlign: 'center' }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ mb: 3 }}>
                <BugIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
                <Typography variant="h4" gutterBottom>
                  Oops! Something went wrong
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  We encountered an unexpected error. This has been logged and we'll look into it.
                </Typography>
              </Box>

              <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Error Details:
                </Typography>
                <Typography variant="body2" component="pre" sx={{ 
                  fontFamily: 'monospace', 
                  fontSize: '0.875rem',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {this.state.error?.message}
                </Typography>
              </Alert>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleReload}
                >
                  Reload Page
                </Button>
                <Button
                  variant="outlined"
                  onClick={this.handleReset}
                >
                  Try Again
                </Button>
              </Box>

              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <Box sx={{ mt: 3, textAlign: 'left' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Stack Trace (Development Only):
                  </Typography>
                  <Box sx={{ 
                    backgroundColor: 'grey.100', 
                    p: 2, 
                    borderRadius: 1,
                    maxHeight: 300,
                    overflow: 'auto'
                  }}>
                    <Typography variant="body2" component="pre" sx={{ 
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}>
                      {this.state.errorInfo.componentStack}
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Container>
      )
    }

    return this.props.children
  }
}