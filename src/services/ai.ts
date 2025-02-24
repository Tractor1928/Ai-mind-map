import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export class AIService {
  private getBaseURL(): string {
    const url = process.env.REACT_APP_API_URL || 'https://ai-mind-map-proxy.nionxd1928.workers.dev/proxy';
    console.log('Using API URL:', url);
    return url;
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

      const url = `${this.getBaseURL()}/chat/completions`;
      console.log('Sending request to:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model,
          messages,
          stream: Boolean(onContent),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`API 请求失败: ${response.status} ${response.statusText}\n${errorText}`);
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
          console.log('Received chunk:', chunk); // 添加日志
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(5);
              if (data === '[DONE]') break;

              try {
                const parsed = JSON.parse(data);
                console.log('Parsed SSE data:', parsed); // 添加日志
                const content = parsed.choices?.[0]?.delta?.content || '';
                if (content) {
                  fullResponse += content;
                  onContent(content);
                }
              } catch (e) {
                console.warn('解析 SSE 数据失败:', e, 'Raw data:', data);
              }
            }
          }
        }

        return fullResponse;
      } else {
        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
      }
    } catch (error: any) {
      console.error('AI 服务错误:', {
        message: error.message,
        stack: error.stack,
        url: this.getBaseURL()
      });
      throw new Error(error?.message || '生成回答时出错');
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const model = localStorage.getItem('model');
      if (!model) {
        throw new Error('请先在设置中配置模型名称');
      }

      const url = `${this.getBaseURL()}/models`;
      console.log('Testing connection to:', url);

      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Connection test failed:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`API 请求失败: ${response.status} ${response.statusText}\n${errorText}`);
      }

      return true;
    } catch (error: any) {
      console.error('连接测试失败:', {
        message: error.message,
        stack: error.stack,
        url: this.getBaseURL()
      });
      return false;
    }
  }
}

export const aiService = new AIService(); 