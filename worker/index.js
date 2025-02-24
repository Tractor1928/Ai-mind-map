// Cloudflare Worker 代码
export default {
  async fetch(request, env) {
    try {
      // 记录请求信息
      console.log('Received request:', {
        url: request.url,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries())
      });

      // 处理 CORS 预检请求
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400',
          },
        });
      }

      // 获取目标 URL
      const url = new URL(request.url);
      const targetUrl = url.pathname.replace('/proxy/', '');
      const apiUrl = `https://ark.cn-beijing.volces.com/api/v3/${targetUrl}`;
      
      console.log('Request details:', {
        originalUrl: request.url,
        targetUrl,
        apiUrl
      });

      // 如果是测试连接请求，返回一个简单的成功响应
      if (targetUrl === 'models') {
        return new Response(JSON.stringify({ status: 'ok' }), {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
        });
      }

      // 创建新的请求
      const modifiedRequest = new Request(apiUrl, {
        method: request.method,
        headers: request.headers,
        body: request.method !== 'GET' ? request.body : null,
      });

      // 发送请求到目标服务器
      const response = await fetch(modifiedRequest);
      
      // 记录响应信息
      console.log('API Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      // 创建新的响应
      const modifiedResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': response.headers.get('Content-Type') || 'application/json',
        },
      });
      
      return modifiedResponse;
    } catch (error) {
      console.error('Worker error:', {
        message: error.message,
        stack: error.stack,
        url: request.url
      });

      return new Response(
        JSON.stringify({ 
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
          url: request.url,
        }), 
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }
  },
}; 