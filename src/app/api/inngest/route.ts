import { inngest } from '@/lib/inngest/client';
import { serve } from 'inngest/next';

// Import Inngest functions
import { generateEmails, sendEmails } from '@/inngest/functions/generate-emails';

// Create an API that serves Inngest functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    generateEmails,
    sendEmails,
  ],
});