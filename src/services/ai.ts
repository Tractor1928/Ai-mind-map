import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export class AIService {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
  }

  async generateResponse(messages: ChatCompletionMessageParam[], onContent?: (content: string) => void) {
    try {
      const response = await fetch(`${this.baseURL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages }),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(5);
            if (data === '[DONE]') break;

            try {
              const { content } = JSON.parse(data);
              if (content) {
                fullResponse += content;
                onContent?.(content);
              }
            } catch (e) {
              console.warn('Failed to parse SSE data:', e);
            }
          }
        }
      }

      return fullResponse;
    } catch (error: any) {
      console.error('AI Service Error:', error);
      throw new Error(error?.message || '生成回答时出错');
    }
  }
}

export const aiService = new AIService(); 