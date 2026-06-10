export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OPENROUTER_API_KEY não configurada' });

  try {
    const { messages, system, max_tokens } = req.body;

    // Converte mensagens para formato OpenRouter
    const orMessages = [
      { role: 'system', content: system || '' },
      ...messages.map(m => {
        if (Array.isArray(m.content)) {
          const parts = m.content.map(c => {
            if (c.type === 'text') return { type: 'text', text: c.text };
            if (c.type === 'image') return {
              type: 'image_url',
              image_url: { url: `data:${c.source.media_type};base64,${c.source.data}` }
            };
            return null;
          }).filter(Boolean);
          return { role: m.role === 'assistant' ? 'assistant' : 'user', content: parts };
        }
        return { role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content) };
      })
    ];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.APP_URL || 'https://limpeza-segura.vercel.app',
        'X-Title': 'Limpeza Segura'
      },
      body: JSON.stringify({
        model:'meta-llama/llama-3.1-8b-instruct:free',,
        messages: orMessages,
        max_tokens: max_tokens || 900
      })
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('OpenRouter error:', err);
      return res.status(500).json({ error: 'Erro na API', details: err });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || 'Desculpe, tente novamente.';

    return res.status(200).json({ content: [{ type: 'text', text }] });

  } catch (error) {
    console.error('Erro interno:', error);
    return res.status(500).json({ error: 'Erro interno', details: error.message });
  }
}
