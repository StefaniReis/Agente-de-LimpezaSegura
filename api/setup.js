// Roda UMA VEZ após o deploy
// Acesse: https://seusite.vercel.app/api/setup

export default async function handler(req, res) {
  const BOT_TOKEN   = process.env.TELEGRAM_BOT_TOKEN;
  const WEBHOOK_URL = `${process.env.APP_URL}/api/webhook`;

  try {
    const r1 = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${WEBHOOK_URL}`
    );
    const d1 = await r1.json();

    const r2 = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setChatMenuButton`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        menu_button: {
          type: 'web_app',
          text: '🛡️ Abrir App',
          web_app: { url: process.env.APP_URL }
        }
      })
    });
    const d2 = await r2.json();

    return res.status(200).json({
      mensagem: 'Setup concluído com sucesso!',
      webhook: d1,
      menuButton: d2
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
