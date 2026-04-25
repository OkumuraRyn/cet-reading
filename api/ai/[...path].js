// api/ai/[...path].js
// Vercel Serverless Function - 转发请求到 DeepSeek API

export default async function handler(req, res) {
  // 从路径中提取 DeepSeek API 的路径
  // 例如请求 /api/ai/v1/chat/completions → path = ['v1', 'chat', 'completions']
  const apiPath = req.query.path.join('/');
  
  // DeepSeek API 地址
  const deepseekUrl = `https://api.deepseek.com/${apiPath}`;
  
  try {
    const response = await fetch(deepseekUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        // 从 Vercel 环境变量读取密钥，前端看不到
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      // GET 请求不需要 body
      body: req.method !== 'GET' && req.method !== 'HEAD' 
        ? JSON.stringify(req.body) 
        : undefined,
    });

    const data = await response.json();
    
    // 返回 DeepSeek 的响应给前端
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ 
      error: 'API 请求失败', 
      message: error.message 
    });
  }
}