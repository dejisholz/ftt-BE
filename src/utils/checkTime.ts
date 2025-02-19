import { getNextWindowDate } from './payment-window';
import { removeNonAdminUsers } from './autoRemove';
import dotenv from 'dotenv';

dotenv.config();

const bot_token = process.env.TELEGRAM_BOT_TOKEN;
const channelID = process.env.TELEGRAM_CHANNEL_ID;

export const checkPaymentWindowOpening = async (): Promise<{success: boolean, message: string}> => {
  // Create date object for current time in WAT
  const watDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));
  
  // Get next window date
  const nextWindowDate = getNextWindowDate(watDate);
  
  // Compare current date with next window date
  if (
    watDate.getDate() + 1 === nextWindowDate.getDate() &&
    watDate.getMonth() === nextWindowDate.getMonth() &&
    watDate.getFullYear() === nextWindowDate.getFullYear()
  ) {
    await removeNonAdminUsers(bot_token, channelID);
    return {success: true, message: "Auto remove completed"};
  } else {
    return {success: false, message: "Not the right time to remove users"};
  }
};

