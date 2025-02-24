// Cloudflare Worker 代码
export default {
  async fetch(request, env) {
    try {
      // 记录请求信息
      const requestInfo = {
        url: request.url,
        method: request.method,
        pathname: new URL(request.url).pathname,
        headers: Object.fromEntries(request.headers.entries())
      };
      console.log('Debug - Request Info:', JSON.stringify(requestInfo, null, 2));

      // 处理根路径请求
      if (requestInfo.pathname === '/') {
        return new Response(JSON.stringify({
          status: 'ok',
          message: 'Worker is running',
          endpoints: ['/health', '/proxy/health', '/proxy/models'],
          timestamp: new Date().toISOString()
        }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

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
      
      // 添加健康检查端点
      if (url.pathname === '/health' || url.pathname === '/proxy/health') {
        console.log('Debug - Health check requested');
        return new Response(JSON.stringify({
          status: 'ok',
          message: 'Worker is healthy',
          path: url.pathname,
          timestamp: new Date().toISOString()
        }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      const targetUrl = url.pathname.replace('/proxy/', '');
      const apiUrl = `https://ark.cn-beijing.volces.com/api/v3/${targetUrl}`;
      
      console.log('Debug - Route info:', {
        originalUrl: request.url,
        pathname: url.pathname,
        targetUrl,
        apiUrl
      });

      // 如果是测试连接请求，返回一个简单的成功响应
      if (targetUrl === 'models') {
        console.log('Debug - Models endpoint requested');
        return new Response(JSON.stringify({ 
          status: 'ok',
          message: 'Connection test successful',
          path: url.pathname,
          timestamp: new Date().toISOString()
        }), {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
        });
      }

      // 创建新的请求
      const modifiedRequest = new Request(apiUrl, {
        method: request.method,
        headers: new Headers(request.headers),
        body: request.method !== 'GET' ? request.body : null,
      });

      console.log('Debug - Sending request to API:', {
        url: apiUrl,
        method: modifiedRequest.method,
        headers: Object.fromEntries(modifiedRequest.headers.entries())
      });

      // 发送请求到目标服务器
      const response = await fetch(modifiedRequest);
      
      // 记录响应信息
      console.log('Debug - API Response:', {
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
      console.error('Debug - Worker error:', {
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