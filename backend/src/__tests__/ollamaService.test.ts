import ollamaService from '../services/ollamaService';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock logger
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

describe('OllamaService', () => {
  const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
  });

  describe('checkConnection', () => {
    it('should return true when Ollama is available', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        status: 200,
        data: {
          models: [
            { name: 'llama2' },
            { name: 'codellama' }
          ]
        }
      });

      const result = await ollamaService.checkConnection();

      expect(result).toBe(true);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/tags');
    });

    it('should return false when Ollama is not available', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Connection refused'));

      const result = await ollamaService.checkConnection();

      expect(result).toBe(false);
    });
  });

  describe('getAvailableModels', () => {
    it('should return list of available models', async () => {
      const mockModels = [
        {
          name: 'llama2',
          modified_at: '2023-01-01T00:00:00Z',
          size: 1000000,
          digest: 'abc123',
          details: {
            format: 'gguf',
            family: 'llama',
            families: ['llama'],
            parameter_size: '7B',
            quantization_level: 'Q4_0'
          }
        }
      ];

      mockAxiosInstance.get.mockResolvedValue({
        status: 200,
        data: { models: mockModels }
      });

      const result = await ollamaService.getAvailableModels();

      expect(result).toEqual(mockModels);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/tags');
    });

    it('should handle empty models list', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        status: 200,
        data: { models: [] }
      });

      const result = await ollamaService.getAvailableModels();

      expect(result).toEqual([]);
    });

    it('should throw error when request fails', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Network error'));

      await expect(ollamaService.getAvailableModels())
        .rejects.toThrow('Unable to fetch available models from Ollama');
    });
  });

  describe('pullModel', () => {
    it('should successfully pull a model', async () => {
      mockAxiosInstance.post.mockResolvedValue({ status: 200 });
      mockAxiosInstance.get.mockResolvedValue({
        status: 200,
        data: { models: [{ name: 'llama2' }] }
      });

      const result = await ollamaService.pullModel('llama2');

      expect(result).toBe(true);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/pull', {
        name: 'llama2'
      });
    });

    it('should return false when pull fails', async () => {
      mockAxiosInstance.post.mockRejectedValue(new Error('Pull failed'));

      const result = await ollamaService.pullModel('nonexistent-model');

      expect(result).toBe(false);
    });
  });

  describe('generate', () => {
    const mockRequest = {
      model: 'llama2',
      prompt: 'Test prompt'
    };

    beforeEach(() => {
      // Mock successful connection check
      mockAxiosInstance.get.mockResolvedValue({
        status: 200,
        data: { models: [{ name: 'llama2' }] }
      });
    });

    it('should generate response successfully', async () => {
      const mockResponse = {
        model: 'llama2',
        created_at: '2023-01-01T00:00:00Z',
        response: 'Generated response',
        done: true
      };

      mockAxiosInstance.post.mockResolvedValue({
        status: 200,
        data: mockResponse
      });

      const result = await ollamaService.generate(mockRequest);

      expect(result).toBe('Generated response');
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/generate', {
        ...mockRequest,
        stream: false
      });
    });

    it('should handle connection errors', async () => {
      mockAxiosInstance.get.mockRejectedValue({ code: 'ECONNREFUSED' });

      await expect(ollamaService.generate(mockRequest))
        .rejects.toThrow('Ollama service is not available');
    });

    it('should handle model not found errors', async () => {
      mockAxiosInstance.post.mockRejectedValue({
        response: { status: 404 },
        isAxiosError: true
      });

      // Mock axios.isAxiosError
      (axios.isAxiosError as jest.Mock).mockReturnValue(true);

      await expect(ollamaService.generate(mockRequest))
        .rejects.toThrow('Model llama2 not found');
    });

    it('should attempt to pull model if not available', async () => {
      // First call returns empty models, second call returns the model
      mockAxiosInstance.get
        .mockResolvedValueOnce({
          status: 200,
          data: { models: [] }
        })
        .mockResolvedValueOnce({
          status: 200,
          data: { models: [{ name: 'llama2' }] }
        });

      // Mock successful pull
      mockAxiosInstance.post
        .mockResolvedValueOnce({ status: 200 }) // pull request
        .mockResolvedValueOnce({ // generate request
          status: 200,
          data: {
            model: 'llama2',
            response: 'Generated response',
            done: true
          }
        });

      const result = await ollamaService.generate(mockRequest);

      expect(result).toBe('Generated response');
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/pull', {
        name: 'llama2'
      });
    });
  });

  describe('generateWithRetry', () => {
    const mockRequest = {
      model: 'llama2',
      prompt: 'Test prompt'
    };

    beforeEach(() => {
      mockAxiosInstance.get.mockResolvedValue({
        status: 200,
        data: { models: [{ name: 'llama2' }] }
      });
    });

    it('should succeed on first attempt', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        status: 200,
        data: {
          model: 'llama2',
          response: 'Generated response',
          done: true
        }
      });

      const result = await ollamaService.generateWithRetry(mockRequest, 3, 100);

      expect(result).toBe('Generated response');
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      mockAxiosInstance.post
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({
          status: 200,
          data: {
            model: 'llama2',
            response: 'Generated response',
            done: true
          }
        });

      const result = await ollamaService.generateWithRetry(mockRequest, 3, 10);

      expect(result).toBe('Generated response');
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retries', async () => {
      mockAxiosInstance.post.mockRejectedValue(new Error('Persistent failure'));

      await expect(ollamaService.generateWithRetry(mockRequest, 2, 10))
        .rejects.toThrow('Persistent failure');

      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(2);
    });
  });

  describe('generateStructuredResponse', () => {
    beforeEach(() => {
      mockAxiosInstance.get.mockResolvedValue({
        status: 200,
        data: { models: [{ name: 'llama2' }] }
      });
    });

    it('should parse valid JSON response', async () => {
      const mockJsonResponse = { name: 'John', skills: ['JavaScript', 'Python'] };
      
      mockAxiosInstance.post.mockResolvedValue({
        status: 200,
        data: {
          model: 'llama2',
          response: JSON.stringify(mockJsonResponse),
          done: true
        }
      });

      const result = await ollamaService.generateStructuredResponse('Test prompt');

      expect(result).toEqual(mockJsonResponse);
    });

    it('should extract JSON from wrapped response', async () => {
      const mockJsonResponse = { name: 'John', skills: ['JavaScript'] };
      const wrappedResponse = `Here is the JSON response: ${JSON.stringify(mockJsonResponse)} Hope this helps!`;
      
      mockAxiosInstance.post.mockResolvedValue({
        status: 200,
        data: {
          model: 'llama2',
          response: wrappedResponse,
          done: true
        }
      });

      const result = await ollamaService.generateStructuredResponse('Test prompt');

      expect(result).toEqual(mockJsonResponse);
    });

    it('should throw error for invalid JSON', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        status: 200,
        data: {
          model: 'llama2',
          response: 'This is not JSON',
          done: true
        }
      });

      await expect(ollamaService.generateStructuredResponse('Test prompt'))
        .rejects.toThrow('Response is not valid JSON');
    });
  });

  describe('utility methods', () => {
    it('should get and set default model', () => {
      const originalModel = ollamaService.getDefaultModel();
      
      ollamaService.setDefaultModel('codellama');
      expect(ollamaService.getDefaultModel()).toBe('codellama');
      
      // Reset to original
      ollamaService.setDefaultModel(originalModel);
    });

    it('should check model availability', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        status: 200,
        data: { models: [{ name: 'llama2' }] }
      });

      await ollamaService.checkConnection();

      expect(ollamaService.isModelAvailable('llama2')).toBe(true);
      expect(ollamaService.isModelAvailable('nonexistent')).toBe(false);
    });

    it('should perform health check', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        status: 200,
        data: { models: [{ name: 'llama2' }] }
      });

      const health = await ollamaService.healthCheck();

      expect(health).toEqual({
        connected: true,
        modelsAvailable: 1,
        defaultModel: expect.any(String),
        defaultModelAvailable: expect.any(Boolean)
      });
    });
  });
});