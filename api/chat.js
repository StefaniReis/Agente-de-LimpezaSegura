module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OPENROUTER_API_KEY não configurada' });

  const { messages, system, max_tokens } = req.body;

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

  // Tenta vários modelos gratuitos em sequência
  const models = [
    'google/gemma-3-12b-it:free',
    'mistralai/mistral-7b-instruct:free',
    'qwen/qwen-2.5-7b-instruct:free',
    'microsoft/phi-3-mini-128k-instruct:free'
  ];

  for (const model of models) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': process.env.APP_URL || 'https://limpeza-segura.vercel.app',
          'X-Title': 'Limpeza Segura'
        },
        body: JSON.stringify({
          model: model,
          messages: orMessages,
          max_tokens: max_tokens || 900
        })
      });

      const data = await response.json();

      if (data.error) {
        console.log(`Modelo ${model} falhou:`, data.error.message);
        continue; // tenta o próximo
      }

      const text = data.choices?.[0]?.message?.content;
      if (!text) {
        console.log(`Modelo ${model} sem resposta`);
        continue;
      }

      console.log(`✅ Modelo funcionando: ${model}`);
      return res.status(200).json({ content: [{ type: 'text', text }] });

    } catch (e) {
      console.log(`Erro no modelo ${model}:`, e.message);
      continue;
    }
  }

  return res.status(500).json({ error: 'Nenhum modelo disponível no momento. Tente em alguns minutos.' });
};
