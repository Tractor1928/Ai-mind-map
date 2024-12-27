import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export class AIService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.REACT_APP_ARK_API_KEY,
      baseURL: process.env.REACT_APP_API_BASE_URL,
    });
  }

  async generateResponse(messages: ChatCompletionMessageParam[], onContent?: (content: string) => void) {
    try {
      const stream = await this.client.chat.completions.create({
        messages,
        model: 'ep-20241226145851-qrc5d',
        stream: true,
      });

      let fullResponse = '';
      for await (const part of stream) {
        const content = part.choices[0]?.delta?.content || '';
        fullResponse += content;
        onContent?.(content);
      }

      return fullResponse;
    } catch (error: any) {
      console.error('AI Service Error:', error);
      throw new Error(error?.message || '生成回答时出错');
    }
  }
}

export const aiService = new AIService(); 