import express from 'express';
import { handleUpdate } from './controllers/telegram-controller';
import { TELEGRAM_BOT_TOKEN, WEBHOOK_BASE_URL } from './config/constants';
import { setupWebhook } from './utils/webhook-setup';
import { initializeCronJobs } from './services/cron-service';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4100;

app.use(express.json());

// Webhook endpoint for Telegram updates
app.post(`/webhook/${TELEGRAM_BOT_TOKEN}`, handleUpdate);

// Health check endpoint
app.get('/health', (_, res) => {
  res.status(200).json({ status: 'ok' });
});

const startServer = async () => {
  try {
    // Start the server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

    if (process.env.NODE_ENV === 'production') {
      initializeCronJobs();
    }

    // Setup webhook after server starts
    await setupWebhook(WEBHOOK_BASE_URL);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 
