import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Container, Box } from '@mui/material'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Header } from './components/Header'
import { HomePage } from './pages/HomePage'
import { AnalysisPage } from './pages/AnalysisPage'
import { QuestionsPage } from './pages/QuestionsPage'
import { GuidancePage } from './pages/GuidancePage'
import { AppProvider } from './context/AppContext'

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <Router>
          <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
            <Header />
            <Container maxWidth="lg" sx={{ py: 4 }}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/analysis" element={<AnalysisPage />} />
                <Route path="/questions" element={<QuestionsPage />} />
                <Route path="/guidance" element={<GuidancePage />} />
              </Routes>
            </Container>
          </Box>
        </Router>
      </AppProvider>
    </ErrorBoundary>
  )
}

export default App