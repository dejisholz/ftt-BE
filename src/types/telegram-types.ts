export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      first_name: string;
      username?: string;
      type: string;
    };
    date: number;
    text?: string;
  };
  callback_query?: CallbackQuery;
}

export interface TelegramMessage {
  chat_id: number;
  text: string;
  parse_mode?: string;
}

export interface InlineKeyboardButton {
  text: string;
  url?: string;
  callback_data?: string;
}

export interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][];
}

export interface CallbackQuery {
  id: string;
  from: {
    id: number;
    first_name: string;
    username?: string;
  };
  message?: {
    message_id: number;
    chat: {
      id: number;
      type: string;
    };
  };
  data: string;
} 