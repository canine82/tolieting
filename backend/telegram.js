import { runSingleQuery } from './database.js';

export const sendTelegramAlert = async (message) => {
  let TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  let TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  try {
    const dbToken = await runSingleQuery('SELECT value FROM settings WHERE key = ?', ['TELEGRAM_BOT_TOKEN']);
    if (dbToken && dbToken.value) TELEGRAM_BOT_TOKEN = dbToken.value;

    const dbChatId = await runSingleQuery('SELECT value FROM settings WHERE key = ?', ['TELEGRAM_CHAT_ID']);
    if (dbChatId && dbChatId.value) TELEGRAM_CHAT_ID = dbChatId.value;

    const dbCommsName = await runSingleQuery('SELECT value FROM settings WHERE key = ?', ['COMMS_NAME']);
    if (dbCommsName && dbCommsName.value) {
      message = `<b>[${dbCommsName.value}]</b>\n${message}`;
    }
  } catch (err) {
    console.error('Failed to get settings from DB', err);
  }

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('Telegram credentials not set. Message not sent:', message);
    return;
  }

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      }),
    });

    if (!response.ok) {
      console.error('Failed to send Telegram message:', await response.text());
    } else {
      console.log('Telegram message sent successfully');
    }
  } catch (error) {
    console.error('Error sending Telegram message:', error.message);
  }
};
