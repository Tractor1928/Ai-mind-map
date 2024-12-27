import React, { useState } from 'react';
import { useAI } from '../hooks/useAI';

const AITest: React.FC = () => {
  const { generateResponse, isLoading, error } = useAI();
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [streamingResponse, setStreamingResponse] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResponse('');
    setStreamingResponse('');

    const messages = [
      { 
        role: 'system' as const, 
        content: '你是一个AI助手' 
      },
      { 
        role: 'user' as const, 
        content: input 
      }
    ];

    // 处理流式响应
    const onProgress = (content: string) => {
      setStreamingResponse(prev => prev + content);
    };

    const result = await generateResponse(messages, onProgress);
    if (result) {
      setResponse(result);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>AI 测试</h2>
      
      <form onSubmit={handleSubmit}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入你的问题..."
          style={{
            width: '100%',
            height: '100px',
            marginBottom: '10px',
            padding: '8px'
          }}
        />
        <button 
          type="submit" 
          disabled={isLoading || !input.trim()}
          style={{
            padding: '8px 16px',
            marginBottom: '20px'
          }}
        >
          {isLoading ? '生成中...' : '发送'}
        </button>
      </form>

      {error && (
        <div style={{ color: 'red', marginBottom: '10px' }}>
          错误: {error}
        </div>
      )}

      {streamingResponse && (
        <div style={{ marginTop: '20px' }}>
          <h3>实时响应:</h3>
          <pre style={{ 
            whiteSpace: 'pre-wrap',
            backgroundColor: '#f5f5f5',
            padding: '10px',
            borderRadius: '4px'
          }}>
            {streamingResponse}
          </pre>
        </div>
      )}
    </div>
  );
};

export default AITest; 