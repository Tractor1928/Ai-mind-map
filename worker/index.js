// Cloudflare Worker 代码
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // 设置 CORS 头
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
  
  // 处理 OPTIONS 请求
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    })
  }
  
  try {
    // 获取请求路径
    const url = new URL(request.url)
    const path = url.pathname.replace('/proxy', '')
    
    // 构建转发到 API 的请求
    const apiUrl = `https://ark.cn-beijing.volces.com/api/v3${path}`
    
    // 复制原始请求的头信息
    const headers = new Headers(request.headers)
    
    // 创建新的请求
    const apiRequest = new Request(apiUrl, {
      method: request.method,
      headers: headers,
      body: request.body,
      redirect: 'follow'
    })
    
    // 发送请求到 API
    const response = await fetch(apiRequest)
    
    // 读取响应内容
    let responseBody
    const contentType = response.headers.get('content-type') || ''
    
    if (contentType.includes('application/json')) {
      // 安全地解析 JSON
      try {
        responseBody = await response.json()
        // 将对象转回字符串
        responseBody = JSON.stringify(responseBody)
      } catch (e) {
        // 如果 JSON 解析失败，直接使用文本
        responseBody = await response.text()
      }
    } else {
      // 非 JSON 内容直接使用文本
      responseBody = await response.text()
    }
    
    // 创建新的响应
    const newResponse = new Response(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...Object.fromEntries(response.headers),
        ...corsHeaders
      }
    })
    
    return newResponse
  } catch (error) {
    // 返回错误信息
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack,
      url: request.url
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    })
  }
} 