import fetch from 'node-fetch';
import { TELEGRAM_API_URL } from '../config/constants';
import { InlineKeyboardMarkup } from '../types/telegram-types';

interface SendMessageOptions {
  chat_id: number;
  text: string;
  parse_mode?: 'HTML' | 'Markdown';
  reply_markup?: InlineKeyboardMarkup;
}

export const sendMessage = async (options: SendMessageOptions): Promise<void> => {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Telegram API Error:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      throw new Error(`Failed to send message: ${response.statusText}. Details: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    // console.log('Message sent successfully:', data);
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}; 