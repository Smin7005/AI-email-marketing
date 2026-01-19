import { Inngest } from 'inngest';

// Create a client to send and receive events
export const inngest = new Inngest({
  id: 'b2b-email-marketing',
  // Only set eventKey if defined (not needed for local dev server)
  ...(process.env.INNGEST_EVENT_KEY && { eventKey: process.env.INNGEST_EVENT_KEY }),
});