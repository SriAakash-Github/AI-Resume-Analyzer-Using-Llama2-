import React, { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Alert,
  Chip,
  IconButton
} from '@mui/material'
import {
  CloudUpload as UploadIcon,
  Description as FileIcon,
  Delete as DeleteIcon,
  CheckCircle as SuccessIcon
} from '@mui/icons-material'
import { useUploadState } from '../context/AppContext'
import { useUploadFile } from '../hooks/useApi'
import { validateFile } from '../utils/validation'

export function FileUpload() {
  const navigate = useNavigate()
  const { uploadState, setUploadState } = useUploadState()
  const uploadMutation = useUploadFile()
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    // Clear previous errors
    setValidationErrors([])

    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.flatMap((rejection: any) => 
        rejection.errors.map((error: any) => error.message)
      )
      setValidationErrors(errors)
      return
    }

    if (acceptedFiles.length === 0) {
      return
    }

    const file = acceptedFiles[0]

    // Validate file on frontend
    const errors = validateFile(file)
    if (errors.length > 0) {
      setValidationErrors(errors.map(e => e.message))
      return
    }

    // Update upload state
    setUploadState({
      isUploading: true,
      progress: 0,
      uploadedFile: file,
      error: undefined
    })

    try {
      const result = await uploadMutation.mutateAsync(file)
      
      if (result.success) {
        setUploadState({
          isUploading: false,
          progress: 100,
          fileId: result.data.fileId,
          error: undefined
        })

        // Navigate to analysis page after successful upload
        setTimeout(() => {
          navigate('/analysis')
        }, 1000)
      } else {
        throw new Error(result.error?.message || 'Upload failed')
      }
    } catch (error) {
      setUploadState({
        isUploading: false,
        progress: 0,
        error: error instanceof Error ? error.message : 'Upload failed'
      })
    }
  }, [uploadMutation, setUploadState, navigate])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: uploadState.isUploading
  })

  const handleRemoveFile = () => {
    setUploadState({
      isUploading: false,
      progress: 0,
      uploadedFile: undefined,
      fileId: undefined,
      error: undefined
    })
    setValidationErrors([])
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto' }}>
      <Card 
        sx={{ 
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : isDragReject ? 'error.main' : 'grey.300',
          backgroundColor: isDragActive ? 'primary.50' : isDragReject ? 'error.50' : 'background.paper',
          transition: 'all 0.2s ease-in-out',
          cursor: uploadState.isUploading ? 'not-allowed' : 'pointer',
          '&:hover': {
            borderColor: uploadState.isUploading ? 'grey.300' : 'primary.main',
            backgroundColor: uploadState.isUploading ? 'background.paper' : 'primary.50'
          }
        }}
      >
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <div {...getRootProps()}>
            <input {...getInputProps()} />
            
            {uploadState.uploadedFile && !uploadState.isUploading && uploadState.fileId ? (
              // Success state
              <Box>
                <SuccessIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  File uploaded successfully!
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
                  <FileIcon color="primary" />
                  <Typography variant="body1">
                    {uploadState.uploadedFile.name}
                  </Typography>
                  <Chip 
                    label={formatFileSize(uploadState.uploadedFile.size)} 
                    size="small" 
                    variant="outlined" 
                  />
                  <IconButton size="small" onClick={handleRemoveFile}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Redirecting to analysis...
                </Typography>
              </Box>
            ) : uploadState.isUploading ? (
              // Uploading state
              <Box>
                <UploadIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Uploading your resume...
                </Typography>
                {uploadState.uploadedFile && (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
                    <FileIcon color="primary" />
                    <Typography variant="body1">
                      {uploadState.uploadedFile.name}
                    </Typography>
                    <Chip 
                      label={formatFileSize(uploadState.uploadedFile.size)} 
                      size="small" 
                      variant="outlined" 
                    />
                  </Box>
                )}
                <LinearProgress 
                  variant="indeterminate" 
                  sx={{ width: '100%', mb: 2 }} 
                />
                <Typography variant="body2" color="text.secondary">
                  Please wait while we process your file...
                </Typography>
              </Box>
            ) : (
              // Default state
              <Box>
                <UploadIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  {isDragActive ? 'Drop your resume here' : 'Upload your resume'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Drag and drop your PDF resume here, or click to browse
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<UploadIcon />}
                  disabled={uploadState.isUploading}
                >
                  Choose File
                </Button>
                <Typography variant="caption" display="block" sx={{ mt: 2, color: 'text.secondary' }}>
                  Supported format: PDF • Maximum size: 10MB
                </Typography>
              </Box>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error messages */}
      {(validationErrors.length > 0 || uploadState.error) && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {uploadState.error && (
            <Typography variant="body2" gutterBottom>
              {uploadState.error}
            </Typography>
          )}
          {validationErrors.map((error, index) => (
            <Typography key={index} variant="body2">
              {error}
            </Typography>
          ))}
        </Alert>
      )}

      {/* Upload tips */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Tips for best results:
        </Typography>
        <Typography variant="body2" color="text.secondary" component="ul" sx={{ pl: 2 }}>
          <li>Use a well-formatted PDF resume</li>
          <li>Ensure text is selectable (not just an image)</li>
          <li>Include clear sections for experience, education, and skills</li>
          <li>Keep file size under 10MB</li>
        </Typography>
      </Box>
    </Box>
  )
}