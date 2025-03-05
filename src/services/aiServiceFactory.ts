import { aiService } from './ai';
import { mockAIService } from './mockAI';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

// API模式类型
export type ApiMode = 'real' | 'mock';

// AI服务接口
export interface AIServiceInterface {
  generateResponse(
    messages: ChatCompletionMessageParam[],
    onContent?: (content: string) => void,
    onReasoningContent?: (reasoning: string) => void
  ): Promise<string>;
  
  testConnection(): Promise<boolean>;
}

/**
 * AI服务工厂类
 * 根据模式返回相应的AI服务实例
 */
class AIServiceFactory {
  private mode: ApiMode = 'real';
  
  /**
   * 设置API模式
   * @param mode API模式
   */
  setMode(mode: ApiMode): void {
    this.mode = mode;
    console.log(`API模式已切换为: ${mode}`);
  }
  
  /**
   * 获取当前API模式
   */
  getMode(): ApiMode {
    return this.mode;
  }
  
  /**
   * 获取AI服务实例
   * @returns 根据当前模式返回相应的AI服务实例
   */
  getService(): AIServiceInterface {
    return this.mode === 'real' ? aiService : mockAIService;
  }
}

// 导出单例实例
export const aiServiceFactory = new AIServiceFactory(); 