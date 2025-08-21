import axios, { AxiosInstance, AxiosResponse } from 'axios';
import logger from '../utils/logger';

export interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  format?: 'json';
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_predict?: number;
  };
}

export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

class OllamaService {
  private client: AxiosInstance;
  private baseUrl: string;
  private defaultModel: string;
  private isConnected: boolean = false;
  private availableModels: string[] = [];

  constructor() {
    this.baseUrl = process.env.OLLAMA_HOST || 'http://localhost:11434';
    this.defaultModel = process.env.OLLAMA_DEFAULT_MODEL || 'llama2';
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 300000, // 5 minutes timeout for AI operations
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add request/response interceptors for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug('Ollama request:', {
          url: config.url,
          method: config.method,
          model: config.data?.model
        });
        return config;
      },
      (error) => {
        logger.error('Ollama request error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        logger.debug('Ollama response received:', {
          status: response.status,
          model: response.data?.model,
          responseLength: response.data?.response?.length
        });
        return response;
      },
      (error) => {
        logger.error('Ollama response error:', {
          status: error.response?.status,
          message: error.message,
          url: error.config?.url
        });
        return Promise.reject(error);
      }
    );
  }

  public async checkConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/api/tags');
      this.isConnected = response.status === 200;
      
      if (this.isConnected) {
        this.availableModels = response.data.models?.map((model: OllamaModel) => model.name) || [];
        logger.info('Ollama connection successful', {
          availableModels: this.availableModels.length,
          models: this.availableModels
        });
      }
      
      return this.isConnected;
    } catch (error) {
      this.isConnected = false;
      logger.error('Ollama connection failed:', error);
      return false;
    }
  }

  public async getAvailableModels(): Promise<OllamaModel[]> {
    try {
      const response = await this.client.get('/api/tags');
      const models = response.data.models || [];
      this.availableModels = models.map((model: OllamaModel) => model.name);
      return models;
    } catch (error) {
      logger.error('Failed to fetch available models:', error);
      throw new Error('Unable to fetch available models from Ollama');
    }
  }

  public async pullModel(modelName: string): Promise<boolean> {
    try {
      logger.info(`Pulling model: ${modelName}`);
      
      const response = await this.client.post('/api/pull', {
        name: modelName
      });

      if (response.status === 200) {
        logger.info(`Model ${modelName} pulled successfully`);
        // Refresh available models list
        await this.getAvailableModels();
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error(`Failed to pull model ${modelName}:`, error);
      return false;
    }
  }

  public async generate(request: OllamaGenerateRequest): Promise<string> {
    try {
      // Ensure we're connected
      if (!this.isConnected) {
        const connected = await this.checkConnection();
        if (!connected) {
          throw new Error('Ollama service is not available');
        }
      }

      // Check if model is available
      if (!this.availableModels.includes(request.model)) {
        logger.warn(`Model ${request.model} not found, attempting to pull...`);
        const pulled = await this.pullModel(request.model);
        if (!pulled) {
          throw new Error(`Model ${request.model} is not available and could not be pulled`);
        }
      }

      const response: AxiosResponse<OllamaResponse> = await this.client.post('/api/generate', {
        ...request,
        stream: false // We want the complete response
      });

      if (response.data && response.data.response) {
        logger.info('Ollama generation successful', {
          model: request.model,
          promptLength: request.prompt.length,
          responseLength: response.data.response.length,
          totalDuration: response.data.total_duration
        });
        
        return response.data.response;
      }

      throw new Error('No response received from Ollama');
    } catch (error) {
      logger.error('Ollama generation failed:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          throw new Error('Ollama service is not running. Please start Ollama and try again.');
        }
        if (error.response?.status === 404) {
          throw new Error(`Model ${request.model} not found. Please pull the model first.`);
        }
        if (error.response?.status === 500) {
          throw new Error('Ollama internal server error. Please check the model and try again.');
        }
      }
      
      throw new Error(`AI generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async generateWithRetry(
    request: OllamaGenerateRequest, 
    maxRetries: number = 3,
    retryDelay: number = 1000
  ): Promise<string> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.generate(request);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < maxRetries) {
          logger.warn(`Ollama generation attempt ${attempt} failed, retrying in ${retryDelay}ms:`, error);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          retryDelay *= 2; // Exponential backoff
        }
      }
    }

    throw lastError!;
  }

  public async generateStructuredResponse<T>(
    prompt: string,
    model: string = this.defaultModel,
    schema?: any
  ): Promise<T> {
    try {
      const request: OllamaGenerateRequest = {
        model,
        prompt: prompt + '\n\nPlease respond with valid JSON only.',
        format: 'json',
        options: {
          temperature: 0.1, // Lower temperature for more consistent structured output
          num_predict: 2000
        }
      };

      const response = await this.generateWithRetry(request);
      
      // Try to parse JSON response
      try {
        const parsed = JSON.parse(response);
        return parsed as T;
      } catch (parseError) {
        logger.warn('Failed to parse JSON response, attempting to extract JSON:', parseError);
        
        // Try to extract JSON from response if it's wrapped in other text
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]) as T;
        }
        
        throw new Error('Response is not valid JSON');
      }
    } catch (error) {
      logger.error('Structured response generation failed:', error);
      throw error;
    }
  }

  public getDefaultModel(): string {
    return this.defaultModel;
  }

  public setDefaultModel(model: string): void {
    this.defaultModel = model;
  }

  public isModelAvailable(model: string): boolean {
    return this.availableModels.includes(model);
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  public async healthCheck(): Promise<{
    connected: boolean;
    modelsAvailable: number;
    defaultModel: string;
    defaultModelAvailable: boolean;
  }> {
    const connected = await this.checkConnection();
    
    return {
      connected,
      modelsAvailable: this.availableModels.length,
      defaultModel: this.defaultModel,
      defaultModelAvailable: this.isModelAvailable(this.defaultModel)
    };
  }
}

export default new OllamaService();