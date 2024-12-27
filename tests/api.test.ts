import { OpenAI } from 'openai';
import { testMessages } from './fixtures/messages';

// 重试函数
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 2000
): Promise<T> {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      if (error?.status === 429) {
        console.warn(`Rate limit hit, attempt ${i + 1}/${maxRetries}, waiting ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        // 每次重试增加延迟
        delay *= 1.5;
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

describe('API Integration Tests', () => {
  let openai: OpenAI;

  beforeEach(() => {
    openai = new OpenAI({
      apiKey: process.env.ARK_API_KEY,
      baseURL: process.env.API_BASE_URL,
    });
  });

  // 基础连接测试
  test('should initialize OpenAI client', () => {
    expect(openai).toBeDefined();
    expect(openai.apiKey).toBeDefined();
  });

  // 基础消息发送测试
  test('should send message and receive response', async () => {
    const completion = await withRetry(async () => {
      return await openai.chat.completions.create({
        messages: testMessages.basic,
        model: 'ep-20241226145851-qrc5d',
      });
    });

    expect(completion.choices[0]?.message?.content).toBeDefined();
    expect(typeof completion.choices[0]?.message?.content).toBe('string');
  }, 20000); // 增加超时时间

  // 测试长文本场景
  test('should handle long text input', async () => {
    const longText = '请帮我总结以下内容的要点，并制作成思维导图：' + '测试内容'.repeat(50);
    
    const completion = await withRetry(async () => {
      return await openai.chat.completions.create({
        messages: [
          { role: 'system', content: '你是一个擅长制作思维导图的AI助手' },
          { role: 'user', content: longText }
        ],
        model: 'ep-20241226145851-qrc5d',
      });
    });

    expect(completion.choices[0]?.message?.content).toBeDefined();
  }, 30000);

  // 流式响应测试
  test('should handle streaming response', async () => {
    try {
      const stream = await openai.chat.completions.create({
        messages: testMessages.basic,
        model: 'ep-20241226145851-qrc5d',
        stream: true,
      });

      const chunks: string[] = [];
      for await (const part of stream) {
        const content = part.choices[0]?.delta?.content;
        if (content) {
          chunks.push(content);
        }
      }

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.join('')).toBeTruthy();
    } catch (error: any) {
      if (error?.status === 429) {
        console.warn('Rate limit exceeded, skipping test');
        return;
      }
      throw error;
    }
  }, 10000); // 增加超时时间

  // 错误处理测试保持不变
  test('should handle invalid API key', async () => {
    const invalidClient = new OpenAI({
      apiKey: 'invalid_key',
      baseURL: process.env.API_BASE_URL,
    });

    await expect(
      invalidClient.chat.completions.create({
        messages: testMessages.basic,
        model: 'ep-20241226145851-qrc5d',
      })
    ).rejects.toThrow();
  });
});