import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface EmailGenerationParams {
  businessName: string;
  businessDescription?: string;
  businessIndustry: string;
  serviceDescription: string;
  senderName: string;
  tone?: 'professional' | 'friendly' | 'casual';
}

export interface GeneratedEmail {
  subject: string;
  content: string;
  success: boolean;
  error?: string;
}

/**
 * Create email generation prompt
 */
function createEmailPrompt({
  businessName,
  businessDescription,
  businessIndustry,
  serviceDescription,
  senderName,
  tone = 'professional',
}: EmailGenerationParams): string {
  const toneInstructions = {
    professional: 'Write in a professional, business-like tone.',
    friendly: 'Write in a friendly, conversational tone.',
    casual: 'Write in a casual, relaxed tone.',
  };

  return `You are a marketing expert writing a cold email to promote services to Australian businesses.

BUSINESS INFORMATION:
- Business Name: ${businessName}
- Industry: ${businessIndustry}
- Description: ${businessDescription || 'Local service provider'}

YOUR SERVICE:
- Description: ${serviceDescription}
- Sender Name: ${senderName}

TONE: ${toneInstructions[tone]}

TASK: Write a personalized cold email that:
1. Opens with a compelling subject line
2. Shows you understand their business and industry
3. Clearly explains how your service can help them
4. Includes a soft call-to-action
5. Keeps it concise (under 200 words)
6. Avoids spam trigger words
7. References Australian business context where relevant

FORMAT YOUR RESPONSE AS:
Subject: [Your compelling subject line]

[Email body paragraph 1 - Personalization and hook]

[Email body paragraph 2 - Value proposition]

[Email body paragraph 3 - Soft CTA and close]`;
}

/**
 * Generate personalized email using OpenAI
 */
export async function generateEmail(params: EmailGenerationParams): Promise<GeneratedEmail> {
  try {
    const prompt = createEmailPrompt(params);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.7,
      top_p: 0.9,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content generated');
    }

    // Parse subject and body from response
    const lines = content.split('\n');
    let subject = '';
    let bodyStart = 0;

    // Find subject line
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('Subject:')) {
        subject = lines[i].replace(/^Subject:\s*/i, '').trim();
        bodyStart = i + 1;
        break;
      }
    }

    // If no subject found, use first line
    if (!subject && lines.length > 0) {
      subject = lines[0].trim();
      bodyStart = 1;
    }

    const body = lines.slice(bodyStart).join('\n').trim();

    if (!subject || !body) {
      throw new Error('Failed to parse generated email');
    }

    // Validate email content
    if (subject.length > 100) {
      throw new Error('Generated subject too long');
    }

    if (body.length > 2000) {
      throw new Error('Generated content too long');
    }

    // Check for spam words (basic validation)
    const spamWords = ['free', 'win', 'winner', 'congratulations', 'act now', 'limited time'];
    const lowerSubject = subject.toLowerCase();
    const lowerBody = body.toLowerCase();

    const hasSpamWords = spamWords.some(word =>
      lowerSubject.includes(word) || lowerBody.includes(word)
    );

    if (hasSpamWords) {
      console.warn('Generated email contains potential spam words');
    }

    return {
      subject,
      content: body,
      success: true,
    };
  } catch (error) {
    console.error('Email generation failed:', error);
    return {
      subject: '',
      content: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Validate email content for common issues
 */
export function validateEmailContent(subject: string, content: string): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  // Check subject length
  if (subject.length > 100) {
    warnings.push('Subject line is too long (max 100 characters)');
  }

  if (subject.length < 10) {
    warnings.push('Subject line is too short (min 10 characters)');
  }

  // Check content length
  if (content.length > 2000) {
    warnings.push('Email content is too long (max 2000 characters)');
  }

  if (content.length < 50) {
    warnings.push('Email content is too short (min 50 characters)');
  }

  // Check for spam words
  const spamWords = [
    'free', 'win', 'winner', 'congratulations', 'act now', 'limited time',
    'urgent', 'expires', 'guarantee', 'no obligation', 'risk free',
    'click here', 'call now', 'order now', 'apply now',
  ];

  const lowerContent = content.toLowerCase();
  const lowerSubject = subject.toLowerCase();

  const foundSpamWords = spamWords.filter(word =>
    lowerSubject.includes(word) || lowerContent.includes(word)
  );

  if (foundSpamWords.length > 0) {
    warnings.push(`Contains potential spam words: ${foundSpamWords.join(', ')}`);
  }

  // Check for excessive capitalization
  const capitalLetters = (subject + content).replace(/[^A-Z]/g, '').length;
  const totalLetters = (subject + content).replace(/[^a-zA-Z]/g, '').length;

  if (totalLetters > 0 && (capitalLetters / totalLetters) > 0.3) {
    warnings.push('Excessive use of capital letters detected');
  }

  // Check for excessive exclamation marks
  const exclamationCount = (subject + content).split('!').length - 1;
  if (exclamationCount > 3) {
    warnings.push('Excessive use of exclamation marks');
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}

/**
 * Clean up email content
 */
export function cleanEmailContent(content: string): string {
  // Remove excessive whitespace
  content = content.replace(/\n{3,}/g, '\n\n');

  // Remove leading/trailing whitespace
  content = content.trim();

  // Ensure proper line endings
  content = content.replace(/\r\n/g, '\n');

  // Remove any HTML comments
  content = content.replace(/<!--[\s\S]*?-->/g, '');

  return content;
}

/**
 * Add personalization to email content
 */
export function personalizeEmail(
  content: string,
  businessName: string,
  senderName: string
): string {
  // Replace placeholders
  content = content.replace(/\[Business Name\]/g, businessName);
  content = content.replace(/\[Sender Name\]/g, senderName);

  // Add personalization if not already present
  if (!content.includes(businessName)) {
    content = `Hi ${businessName} team,\n\n${content}`;
  }

  return content;
}