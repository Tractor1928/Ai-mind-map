// Cloudflare Worker 代码
export default {
  async fetch(request, env) {
    // 记录所有请求信息
    console.log('Worker received request:', {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries())
    });

    try {
      // 基本响应头
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json',
      };

      // 处理 OPTIONS 请求
      if (request.method === 'OPTIONS') {
        console.log('Handling OPTIONS request');
        return new Response(null, { 
          headers: {
            ...corsHeaders,
            'Access-Control-Max-Age': '86400',
          }
        });
      }

      // 获取请求路径
      const url = new URL(request.url);
      console.log('Processing URL:', url.pathname);

      // 处理根路径
      if (url.pathname === '/' || url.pathname === '/proxy') {
        console.log('Handling root path request');
        return new Response(JSON.stringify({
          status: 'ok',
          message: 'Worker is running',
          version: '1.0.0',
          timestamp: new Date().toISOString()
        }), { headers: corsHeaders });
      }

      // 处理健康检查
      if (url.pathname === '/health' || url.pathname === '/proxy/health') {
        console.log('Handling health check request');
        return new Response(JSON.stringify({
          status: 'ok',
          message: 'Health check passed',
          timestamp: new Date().toISOString()
        }), { headers: corsHeaders });
      }

      // 处理模型测试
      if (url.pathname === '/proxy/models') {
        console.log('Handling models test request');
        // 检查 Authorization header
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
          return new Response(JSON.stringify({
            error: 'Missing Authorization header'
          }), { 
            status: 401,
            headers: corsHeaders 
          });
        }

        // 转发到实际的 API
        const apiUrl = 'https://ark.cn-beijing.volces.com/api/v3/models';
        const response = await fetch(apiUrl, {
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
        });

        const responseData = await response.json();
        return new Response(JSON.stringify(responseData), { 
          status: response.status,
          headers: corsHeaders 
        });
      }

      // 处理其他 API 请求
      if (url.pathname.startsWith('/proxy/')) {
        const targetPath = url.pathname.replace('/proxy/', '');
        const apiUrl = `https://ark.cn-beijing.volces.com/api/v3/${targetPath}`;
        
        console.log('Proxying request to:', apiUrl);

        // 获取原始请求的 headers
        const headers = new Headers(request.headers);
        
        // 确保设置了正确的 Content-Type
        headers.set('Content-Type', 'application/json');
        
        // 创建新的请求
        const apiRequest = new Request(apiUrl, {
          method: request.method,
          headers: headers,
          body: request.method !== 'GET' ? request.body : null,
        });

        console.log('Sending request with headers:', Object.fromEntries(apiRequest.headers.entries()));

        const response = await fetch(apiRequest);
        console.log('Received response:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });

        // 如果是流式响应，需要特殊处理
        if (response.headers.get('content-type')?.includes('text/event-stream')) {
          return new Response(response.body, {
            status: response.status,
            headers: {
              ...corsHeaders,
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
            }
          });
        }

        // 普通响应
        const responseData = await response.json();
        return new Response(JSON.stringify(responseData), {
          status: response.status,
          headers: corsHeaders
        });
      }

      // 处理未知路径
      console.log('Unknown path requested:', url.pathname);
      return new Response(JSON.stringify({
        error: 'Not Found',
        path: url.pathname,
        timestamp: new Date().toISOString()
      }), {
        status: 404,
        headers: corsHeaders
      });

    } catch (error) {
      console.error('Worker error:', {
        message: error.message,
        stack: error.stack,
        url: request.url
      });

      return new Response(JSON.stringify({
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        url: request.url,
      }), {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        }
      });
    }
  }
}; 