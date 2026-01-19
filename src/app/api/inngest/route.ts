import { inngest } from '@/lib/inngest/client';
import { serve } from 'inngest/next';
import { NextRequest, NextResponse } from 'next/server';

// Import Inngest functions
import { generateEmails } from '@/inngest/functions/generate-emails';
import { sendCampaignBatch } from '@/lib/inngest/functions/send-emails';

// Create an API that serves Inngest functions
const handler = serve({
  client: inngest,
  functions: [
    generateEmails,
    sendCampaignBatch,
  ],
});

export const GET = handler.GET;
export const POST = handler.POST;

// Handle PUT requests for Inngest dev server sync (avoid JSON parse errors on empty body)
export async function PUT(req: NextRequest) {
  try {
    return await handler.PUT(req);
  } catch (error) {
    // Return OK for empty body PUT requests (used for dev server health checks)
    return NextResponse.json({ ok: true });
  }
}