import fetch from 'node-fetch';
import { TELEGRAM_API_URL, TELEGRAM_BOT_TOKEN } from '../config/constants';

export async function setupWebhook(baseUrl: string): Promise<void> {
  try {
    const webhookUrl = `${baseUrl}/webhook/${TELEGRAM_BOT_TOKEN}`;
    console.log('\n--- Setting up Webhook ---');
    console.log('Webhook URL:', webhookUrl);
    
    // Delete any existing webhook first
    console.log('Deleting existing webhook...');
    await fetch(`${TELEGRAM_API_URL}/deleteWebhook`, {
      method: 'POST'
    });
    
    console.log('Setting new webhook...');
    const response = await fetch(`${TELEGRAM_API_URL}/setWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message', 'callback_query', 'inline_query']
      }),
    });

    const webhookResponse = await response.json();
    console.log('Webhook setup response:', webhookResponse);
    
    // Get webhook info to verify
    const webhookInfoResponse = await fetch(`${TELEGRAM_API_URL}/getWebhookInfo`);
    const webhookInfo = await webhookInfoResponse.json();
    console.log('Webhook Info:', webhookInfo);
    
    if (webhookResponse.ok) {
      console.log('✅ Webhook set successfully');
    } else {
      console.error('❌ Failed to set webhook:', webhookResponse.description);
      process.exit(1);
    }
  } catch (error) {
    console.error('Webhook setup error:', error);
    process.exit(1);
  }
} 