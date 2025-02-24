import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export class AIService {
  getBaseURL(): string {
    const userApiUrl = localStorage.getItem('apiUrl');
    if (userApiUrl) {
      // 移除末尾的斜杠，因为我们会在请求时添加
      return userApiUrl.endsWith('/') ? userApiUrl.slice(0, -1) : userApiUrl;
    }
    return process.env.REACT_APP_API_URL || 'http://localhost:3001';
  }

  async generateResponse(messages: ChatCompletionMessageParam[], onContent?: (content: string) => void) {
    try {
      const response = await fetch(`${this.getBaseURL()}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages }),
      });

      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('无法读取响应内容');

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
              console.warn('解析 SSE 数据失败:', e);
            }
          }
        }
      }

      return fullResponse;
    } catch (error: any) {
      console.error('AI 服务错误:', error);
      throw new Error(error?.message || '生成回答时出错');
    }
  }
}

export const aiService = new AIService(); 