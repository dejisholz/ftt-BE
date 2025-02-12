import dotenv from 'dotenv';
dotenv.config();


export const TELEGRAM_BOT_TOKEN = '8121781737:AAGy9kv8kvFjwF1TpODH2lthNcVom6M_EZI'; // Replace with your bot token
export const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
export const WEBHOOK_BASE_URL = process.env.WEBHOOK_BASE_URL || 'https://betestsolom.pagekite.me'; // Replace with your domain 
export const BOT_LINK = process.env.BOT_LINK || 'https://t.me/BTradingVIP_Bot';
export const FRONTEND_PAYMENT_URL = process.env.FRONTEND_PAYMENT_URL || 'https://fttfe.vercel.app';
export const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || -2400975853;

// Tron Network Configuration
export const TRON_FULL_NODE = process.env.TRON_FULL_NODE || 'https://api.trongrid.io';
export const TRON_SOLIDITY_NODE = process.env.TRON_SOLIDITY_NODE || 'https://api.trongrid.io';
export const TRON_EVENT_SERVER = process.env.TRON_EVENT_SERVER || 'https://api.trongrid.io';

// Contract Addresses
export const MERCHANT_ADDRESS = process.env.NEXT_PUBLIC_MERCHANT_TRON_ADDRESS || 'TCRntw5B9QCUdmA6FcNZWKQPs621iH83ja';
export const USDT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_USDT_CONTRACT_ADDRESS || 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'; // USDT Contract on Tron

// Optional: Private key for signing transactions
export const PRIVATE_KEY = process.env.PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000000';