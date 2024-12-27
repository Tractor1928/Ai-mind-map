import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

async function main() {
  const openai = new OpenAI({
    apiKey: process.env.ARK_API_KEY,
    baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
  });

  try {
    // 标准请求
    console.log('----- standard request -----')
    const completion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: '你是豆包，是由字节跳动开发的 AI 人工智能助手' },
        { role: 'user', content: '常见的十字花科植物有哪些？' },
      ],
      model: 'ep-20241226145851-qrc5d',
    });
    console.log(completion.choices[0]?.message?.content);

    // 流式请求
    console.log('\n----- streaming request -----')
    const stream = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: '你是豆包，是由字节跳动开发的 AI 人工智能助手' },
        { role: 'user', content: '常见的十字花科植物有哪些？' },
      ],
      model: 'ep-20241226145851-qrc5d',
      stream: true,
    });
    for await (const part of stream) {
      process.stdout.write(part.choices[0]?.delta?.content || '');
    }
    process.stdout.write('\n');

  } catch (error: any) {
    console.error('Error:', {
      status: error?.status,
      message: error?.message,
      response: error?.response?.data
    });
  }
}

main(); 