import OpenAI from 'openai';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface EmailGenerationOptions {
  businessName: string;
  businessDescription: string;
  businessIndustry: string;
  serviceDescription: string;
  senderName: string;
  tone: 'professional' | 'friendly' | 'casual';
}

export function createEmailPrompt(options: EmailGenerationOptions): string {
  return `You are a professional B2B email writer. Create a personalized cold email that is concise, relevant, and includes a clear call-to-action.

Write an email from ${options.senderName} to ${options.businessName} in the ${options.businessIndustry} industry.

Their business: ${options.businessDescription}
Our service: ${options.serviceDescription}
Tone: ${options.tone}

Include:
1. Personalized opener that references their business
2. Brief value proposition
3. Soft call-to-action (invite for call, reply, etc.)
4. Professional signature

Format your response as:
Subject: [your subject line]
[email body]

Keep the email under 200 words.`;
}