import { useState, useCallback } from 'react';
import { aiServiceFactory, ApiMode } from '../services/aiServiceFactory';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export const useAI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reasoningContent, setReasoningContent] = useState<string>('');
  const [apiMode, setApiMode] = useState<ApiMode>(aiServiceFactory.getMode());

  // 切换API模式
  const switchApiMode = useCallback((mode: ApiMode) => {
    aiServiceFactory.setMode(mode);
    setApiMode(mode);
  }, []);

  // 生成响应
  const generateResponse = useCallback(async (
    messages: ChatCompletionMessageParam[],
    onProgress?: (content: string) => void,
    onReasoningProgress?: (reasoning: string) => void
  ) => {
    setIsLoading(true);
    setError(null);
    setReasoningContent('');

    try {
      // 获取当前模式下的服务
      const service = aiServiceFactory.getService();
      
      // 调用服务生成响应
      const response = await service.generateResponse(
        messages, 
        onProgress,
        onReasoningProgress
      );
      return response;
    } catch (err: any) {
      setError(err.message || '生成回答时出错');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 测试API连接
  const testConnection = useCallback(async () => {
    try {
      const service = aiServiceFactory.getService();
      return await service.testConnection();
    } catch (error) {
      return false;
    }
  }, []);

  return {
    isLoading,
    error,
    reasoningContent,
    apiMode,
    switchApiMode,
    generateResponse,
    testConnection
  };
}; 