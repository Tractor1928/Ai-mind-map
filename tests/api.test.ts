import { OpenAI } from 'openai';
import { testMessages } from './fixtures/messages';

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
    const completion = await openai.chat.completions.create({
      messages: testMessages.basic,
      model: 'ep-20241226145851-qrc5d',
    });

    expect(completion.choices[0]?.message?.content).toBeDefined();
    expect(typeof completion.choices[0]?.message?.content).toBe('string');
  });

  // 流式响应测试
  test('should handle streaming response', async () => {
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
  });

  // 错误处理测试
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