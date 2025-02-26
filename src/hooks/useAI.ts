import { useState, useCallback } from 'react';
import { aiService } from '../services/ai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export const useAI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reasoningContent, setReasoningContent] = useState<string>('');

  const generateResponse = useCallback(async (
    messages: ChatCompletionMessageParam[],
    onProgress?: (content: string) => void,
    onReasoningProgress?: (reasoning: string) => void
  ) => {
    setIsLoading(true);
    setError(null);
    setReasoningContent('');

    try {
      const response = await aiService.generateResponse(
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

  return {
    isLoading,
    error,
    reasoningContent,
    generateResponse
  };
}; 