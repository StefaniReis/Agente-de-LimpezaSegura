module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GROQ_API_KEY não configurada' });

  try {
    const { messages, system, max_tokens } = req.body;

    const groqMessages = [
      { role: 'system', content: system || '' },
      ...messages.map(m => {
        if (Array.isArray(m.content)) {
          const text = m.content
            .filter(c => c.type === 'text')
            .map(c => c.text)
            .join(' ');
          return { role: m.role === 'assistant' ? 'assistant' : 'user', content: text };
        }
        return { role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content) };
      })
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
       model: 'llama-3.3-70b-versatile',
        messages: groqMessages,
        max_tokens: max_tokens || 900,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('Groq error:', JSON.stringify(err));
      return res.status(500).json({ error: 'Erro na API Groq', details: err });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || 'Desculpe, tente novamente.';
    return res.status(200).json({ content: [{ type: 'text', text }] });

  } catch (error) {
    console.error('Erro interno:', error.message);
    return res.status(500).json({ error: 'Erro interno', details: error.message });
  }
};
