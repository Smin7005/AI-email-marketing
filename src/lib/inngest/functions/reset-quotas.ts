import { inngest } from '../client';
import { quotaService } from '../../services/quota';

/**
 * Reset monthly quotas for all organizations
 * Runs automatically on the 1st of each month at midnight UTC
 */
export const resetMonthlyQuotas = inngest.createFunction(
  {
    id: 'reset-monthly-quotas',
    name: 'Reset Monthly Quotas',
    retries: 3,
  },
  {
    // Run at midnight UTC on the 1st of every month
    cron: '0 0 1 * *',
  },
  async ({ event, step }) => {
    console.log('Starting monthly quota reset...');

    // Reset all organization quotas
    const resetCount = await step.run('reset-quotas', async () => {
      await quotaService.resetMonthlyQuotas();
      return true; // We could return the actual count if needed
    });

    console.log('Monthly quota reset completed successfully');

    return {
      success: true,
      resetCount,
      timestamp: new Date().toISOString(),
    };
  }
);
