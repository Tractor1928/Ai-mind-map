import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';

// 指定 .env 文件路径
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
app.use(cors());
app.use(express.json());

// 添加环境变量检查
if (!process.env.ARK_API_KEY) {
  throw new Error('Missing ARK_API_KEY environment variable');
}

if (!process.env.API_BASE_URL) {
  throw new Error('Missing API_BASE_URL environment variable');
}

const openai = new OpenAI({
  apiKey: process.env.ARK_API_KEY,
  baseURL: process.env.API_BASE_URL,
});

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    
    const stream = await openai.chat.completions.create({
      messages,
      model: 'ep-20241226145851-qrc5d',
      stream: true,
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const part of stream) {
      const content = part.choices[0]?.delta?.content || '';
      res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error: any) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 