// Cloudflare Worker 代码
export default {
  async fetch(request, env) {
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
    const targetUrl = url.pathname.replace('/proxy', '');
    
    // 创建新的请求
    const modifiedRequest = new Request(
      `https://ark.cn-beijing.volces.com/api/v3${targetUrl}`,
      {
        method: request.method,
        headers: request.headers,
        body: request.body,
      }
    );

    try {
      // 发送请求到目标服务器
      const response = await fetch(modifiedRequest);
      
      // 创建新的响应，添加 CORS 头
      const modifiedResponse = new Response(response.body, response);
      modifiedResponse.headers.set('Access-Control-Allow-Origin', '*');
      
      return modifiedResponse;
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
}; 