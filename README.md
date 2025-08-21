# Resume Analyzer

An AI-powered application that analyzes PDF resumes to generate personalized interview questions and career guidance using local AI processing with Ollama.

## Features

- 📄 **PDF Resume Parsing** - Accurate extraction of resume content with OCR fallback
- 🤖 **AI-Powered Analysis** - Local processing using Ollama for privacy
- ❓ **Custom Question Generation** - Technical and behavioral questions with configurable difficulty
- 🎯 **Career Guidance** - Personalized roadmaps and skill gap analysis
- 🔒 **Privacy-First** - All processing happens locally, no data sent to external servers
- ⚡ **Fast & Responsive** - Modern React interface with optimized performance

## Prerequisites

- Node.js 18+ and npm 9+
- [Ollama](https://ollama.ai/) installed and running locally
- Recommended Ollama models: `llama2`, `codellama`, or `mistral`

## Quick Start

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd resume-analyzer
   npm install
   ```

2. **Install dependencies for both frontend and backend:**
   ```bash
   cd frontend && npm install
   cd ../backend && npm install
   ```

3. **Start Ollama and pull a model:**
   ```bash
   ollama serve
   ollama pull llama2
   ```

4. **Start the development servers:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## Project Structure

```
resume-analyzer/
├── frontend/          # React TypeScript frontend
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   └── package.json
├── backend/           # Node.js Express backend
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   └── package.json
└── package.json       # Root workspace configuration
```

## Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build both applications for production
- `npm run test` - Run tests for both applications
- `npm run lint` - Lint both applications

## Configuration

The application uses environment variables for configuration:

### Backend (.env)
```
PORT=3001
OLLAMA_HOST=http://localhost:11434
UPLOAD_MAX_SIZE=10485760
TEMP_DIR=./temp-files
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001
```

## Usage

1. **Upload Resume**: Drag and drop or select a PDF resume file
2. **Configure Questions**: Set the number and difficulty of questions you want
3. **Analyze**: Wait for AI processing to complete
4. **Review Results**: View generated questions and career guidance
5. **Export**: Download results as PDF or text files

## Development

### Adding New Features

1. Update the appropriate service in the backend
2. Add corresponding API endpoints
3. Create or update React components in the frontend
4. Add tests for new functionality

### Testing

```bash
# Run all tests
npm run test

# Run frontend tests only
cd frontend && npm run test

# Run backend tests only
cd backend && npm run test
```

## Deployment

### Local Production Build

```bash
npm run build
npm start
```

### Docker Deployment

```bash
docker-compose up --build
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details"# AI-Resume-Analyzer-Using-Llama2-" 
