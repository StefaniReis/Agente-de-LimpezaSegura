// Backend que chama o Gemini (Google) grátis

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY não configurada no Vercel' });

  try {
    const { messages, system, max_tokens } = req.body;

    // Converte formato do app → formato Gemini
    const geminiContents = messages.map(msg => {
      const role = msg.role === 'assistant' ? 'model' : 'user';

      if (Array.isArray(msg.content)) {
        const parts = msg.content.map(c => {
          if (c.type === 'text') return { text: c.text };
          if (c.type === 'image') return {
            inline_data: { mime_type: c.source.media_type, data: c.source.data }
          };
          return null;
        }).filter(Boolean);
        return { role, parts };
      }

      return { role, parts: [{ text: String(msg.content) }] };
    });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: system ? { parts: [{ text: system }] } : undefined,
          contents: geminiContents,
          generationConfig: { maxOutputTokens: max_tokens || 900, temperature: 0.7 }
        })
      }
    );

    if (!response.ok) {
      const err = await response.json();
      return res.status(500).json({ error: 'Erro na API Gemini', details: err });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Desculpe, tente novamente.';

    return res.status(200).json({ content: [{ type: 'text', text }] });

  } catch (error) {
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
