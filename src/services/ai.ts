import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export class AIService {
  // 在生产环境中使用 Cloudflare Worker URL，在开发环境中使用本地代理
  private getBaseURL(): string {
    return process.env.NODE_ENV === 'production'
      ? 'https://ai-mind-map-proxy.你的workers域名.workers.dev/proxy'
      : 'http://localhost:8787/proxy';
  }

  private getHeaders(): HeadersInit {
    const apiKey = localStorage.getItem('apiKey');
    if (!apiKey) {
      throw new Error('请先在设置中配置 API Key');
    }

    return {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  async generateResponse(messages: ChatCompletionMessageParam[], onContent?: (content: string) => void) {
    try {
      const model = localStorage.getItem('model');
      if (!model) {
        throw new Error('请先在设置中配置模型名称');
      }

      const response = await fetch(`${this.getBaseURL()}/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model,
          messages,
          stream: Boolean(onContent),
        }),
      });

      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
      }

      if (onContent) {
        // 处理流式响应
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
                const { choices } = JSON.parse(data);
                const content = choices?.[0]?.delta?.content || '';
                if (content) {
                  fullResponse += content;
                  onContent(content);
                }
              } catch (e) {
                console.warn('解析 SSE 数据失败:', e);
              }
            }
          }
        }

        return fullResponse;
      } else {
        // 处理普通响应
        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
      }
    } catch (error: any) {
      console.error('AI 服务错误:', error);
      throw new Error(error?.message || '生成回答时出错');
    }
  }

  // 用于测试配置是否正确
  async testConnection(): Promise<boolean> {
    try {
      const model = localStorage.getItem('model');
      if (!model) {
        throw new Error('请先在设置中配置模型名称');
      }

      const response = await fetch(`${this.getBaseURL()}/models`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('连接测试失败:', error);
      return false;
    }
  }
}

export const aiService = new AIService(); 