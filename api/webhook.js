// Bot do Telegram — recebe mensagens e abre o Mini App

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const APP_URL   = process.env.APP_URL;

  async function sendMessage(chatId, text, replyMarkup = null) {
    const body = { chat_id: chatId, text, parse_mode: 'HTML' };
    if (replyMarkup) body.reply_markup = replyMarkup;
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  }

  try {
    const update  = req.body;
    const message = update.message;
    if (!message) return res.status(200).json({ ok: true });

    const chatId = message.chat.id;
    const text   = message.text || '';
    const nome   = message.from?.first_name || 'Olá';

    if (text === '/start' || text.startsWith('/start')) {
      await sendMessage(
        chatId,
        `👋 Olá, ${nome}! Sou a <b>Limpeza Segura</b>! 🛡️\n\n` +
        `Estou aqui para te ajudar a trabalhar com segurança.\n\n` +
        `✅ Aviso sobre produtos perigosos\n` +
        `📷 Identifico produtos por foto\n` +
        `🏠 Lembro os produtos de cada casa\n` +
        `🚨 Tenho botão de emergência\n\n` +
        `Toque no botão abaixo para abrir o app! 👇`,
        {
          inline_keyboard: [[{
            text: '🛡️ Abrir Limpeza Segura',
            web_app: { url: APP_URL }
          }]]
        }
      );
    }

    else if (text === '/sos') {
      await sendMessage(
        chatId,
        '🚨 <b>EMERGÊNCIA</b>\n\n' +
        '📞 SAMU: <b>192</b>\n' +
        '🔥 Bombeiros: <b>193</b>\n' +
        '☠️ Intoxicações: <b>0800-722-6001</b>\n' +
        '🏥 ANVISA: <b>0800-642-9782</b>\n\n' +
        '<b>Primeiros socorros:</b>\n' +
        '• Inalou → local aberto + SAMU\n' +
        '• Olhos → lavar 15min com água\n' +
        '• Pele → lavar 15min com água\n' +
        '• Ingeriu → NÃO vomite → pronto-socorro'
      );
    }

    else {
      await sendMessage(
        chatId,
        `Para usar todas as funções, abra o app completo! 👇`,
        {
          inline_keyboard: [[{
            text: '🛡️ Abrir Limpeza Segura',
            web_app: { url: APP_URL }
          }]]
        }
      );
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: 'Erro interno' });
  }
}
