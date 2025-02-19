import cron from 'node-cron';
import { checkPaymentWindowOpening } from '../utils/checkTime';

export const initializeCronJobs = () => {
  // Schedule task to run at 11:00 PM WAT (West African Time)
  // The timezone option ensures this runs at 11PM WAT regardless of server location
  cron.schedule('0 23 * * *', async () => {
    try {
      // checkPaymentWindowOpening() internally uses Africa/Lagos timezone
      // so it will work correctly regardless of server location
      const isOpeningDay = await checkPaymentWindowOpening();
      if (isOpeningDay.success) {
        // Add your logic here for what should happen when it's payment window opening day
        console.log('Payment window is opening today!');
      }
    } catch (error) {
      console.error('Error in payment window cron job:', error);
    }
  }, {
    scheduled: true,
    timezone: "Africa/Lagos" // This ensures cron runs in WAT timezone
  });
}; 