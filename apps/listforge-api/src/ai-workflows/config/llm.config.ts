import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';

/**
 * LLM Model Configuration
 */
export interface LLMModelConfig {
  primary: {
    modelName: string;
    temperature: number;
    maxTokens: number;
  };
  fallback?: {
    modelName: string;
    temperature: number;
    maxTokens: number;
  };
  costTracking?: boolean;
}

/**
 * Default LLM configurations for different use cases
 */
const DEFAULT_CONFIGS: Record<string, LLMModelConfig> = {
  research: {
    primary: {
      modelName: 'gpt-4o',
      temperature: 0.3,
      maxTokens: 2000,
    },
    fallback: {
      modelName: 'gpt-4o-mini',
      temperature: 0.3,
      maxTokens: 2000,
    },
    costTracking: true,
  },
  vision: {
    primary: {
      modelName: 'gpt-4o',
      temperature: 0.1,
      maxTokens: 1000,
    },
    fallback: {
      modelName: 'gpt-4o-mini',
      temperature: 0.1,
      maxTokens: 1000,
    },
  },
  listing: {
    primary: {
      modelName: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 1500,
    },
    fallback: {
      modelName: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 1500,
    },
  },
  chat: {
    primary: {
      modelName: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 1000,
    },
    fallback: {
      modelName: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 1000,
    },
  },
};

/**
 * LLM Config Service
 * Provides configured LLM instances with fallback support
 */
@Injectable()
export class LLMConfigService {
  private readonly logger = new Logger(LLMConfigService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Get LLM instance for a specific use case
   */
  getLLM(useCase: 'research' | 'vision' | 'listing' | 'chat' = 'research'): ChatOpenAI {
    const config = this.getConfig(useCase);

    try {
      return new ChatOpenAI({
        modelName: config.primary.modelName,
        temperature: config.primary.temperature,
        maxTokens: config.primary.maxTokens,
        apiKey: this.configService.get('OPENAI_API_KEY'),
      });
    } catch (error) {
      this.logger.warn(`Failed to initialize primary LLM for ${useCase}, trying fallback`, error);

      if (config.fallback) {
        return new ChatOpenAI({
          modelName: config.fallback.modelName,
          temperature: config.fallback.temperature,
          maxTokens: config.fallback.maxTokens,
          apiKey: this.configService.get('OPENAI_API_KEY'),
        });
      }

      throw error;
    }
  }

  /**
   * Get configuration for a use case
   * Allows environment overrides
   */
  private getConfig(useCase: string): LLMModelConfig {
    const defaultConfig = DEFAULT_CONFIGS[useCase] || DEFAULT_CONFIGS.research;

    // Allow environment variable overrides
    const envModelName = this.configService.get(`LLM_${useCase.toUpperCase()}_MODEL`);
    const envTemperature = this.configService.get(`LLM_${useCase.toUpperCase()}_TEMPERATURE`);
    const envMaxTokens = this.configService.get(`LLM_${useCase.toUpperCase()}_MAX_TOKENS`);

    return {
      ...defaultConfig,
      primary: {
        modelName: envModelName || defaultConfig.primary.modelName,
        temperature: envTemperature ? parseFloat(envTemperature) : defaultConfig.primary.temperature,
        maxTokens: envMaxTokens ? parseInt(envMaxTokens, 10) : defaultConfig.primary.maxTokens,
      },
    };
  }

  /**
   * Estimate token cost for a run (rough estimation)
   */
  estimateCost(tokensUsed: number, model: string): number {
    // Rough cost estimates per 1K tokens (as of Dec 2024)
    const costs: Record<string, { input: number; output: number }> = {
      'gpt-4o': { input: 0.005, output: 0.015 },
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
    };

    const modelCost = costs[model] || costs['gpt-4o'];
    // Assume 50/50 split between input and output
    return ((tokensUsed / 1000) * (modelCost.input + modelCost.output)) / 2;
  }
}
