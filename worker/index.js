// Cloudflare Worker 代码
export default {
  async fetch(request, env) {
    try {
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
      console.log('Target URL:', targetUrl);
      
      // 创建新的请求
      const apiUrl = `https://ark.cn-beijing.volces.com/api/v3/${targetUrl}`;
      console.log('Sending request to:', apiUrl);
      
      const modifiedRequest = new Request(apiUrl, {
        method: request.method,
        headers: request.headers,
        body: request.method !== 'GET' ? request.body : null,
      });

      // 设置超时
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 30000);
      });

      // 发送请求到目标服务器
      const responsePromise = fetch(modifiedRequest);
      
      // 使用 Promise.race 来处理超时
      const response = await Promise.race([responsePromise, timeoutPromise]);
      
      // 创建新的响应，添加 CORS 头
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
      console.error('Worker error:', error);
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