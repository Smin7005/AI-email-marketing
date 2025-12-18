/**
 * Email validation utilities
 */

/**
 * RFC 5322 compliant email regex (simplified)
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Common email providers (for validation suggestions)
 */
const COMMON_PROVIDERS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'aol.com',
  'icloud.com',
  'mail.com',
  'live.com',
  'msn.com',
  'ymail.com',
];

/**
 * Disposable email domains (partial list)
 */
const DISPOSABLE_DOMAINS = [
  '10minutemail.com',
  'guerrillamail.com',
  'mailinator.com',
  'tempmail.org',
  'throwaway.email',
  'yopmail.com',
  'temp-mail.org',
  'fakeinbox.com',
  'mailnesia.com',
  'trashmail.com',
];

export interface EmailValidationResult {
  valid: boolean;
  email: string;
  normalized: string;
  errors: string[];
  warnings: string[];
  suggestions?: string[];
}

/**
 * Validate email address
 */
export function validateEmail(email: string): EmailValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Normalize email
  const normalized = email.toLowerCase().trim();

  // Check if email is provided
  if (!email || email.trim().length === 0) {
    errors.push('Email address is required');
    return {
      valid: false,
      email,
      normalized,
      errors,
      warnings,
    };
  }

  // Check length
  if (normalized.length > 254) {
    errors.push('Email address is too long (max 254 characters)');
  }

  // Check format
  if (!EMAIL_REGEX.test(normalized)) {
    errors.push('Invalid email format');
  }

  // Split into local and domain parts
  const [localPart, domain] = normalized.split('@');

  if (localPart && domain) {
    // Check local part length
    if (localPart.length > 64) {
      errors.push('Local part is too long (max 64 characters)');
    }

    // Check domain length
    if (domain.length > 255) {
      errors.push('Domain is too long (max 255 characters)');
    }

    // Check for consecutive dots
    if (localPart.includes('..') || domain.includes('..')) {
      errors.push('Email cannot contain consecutive dots');
    }

    // Check for dots at start/end
    if (localPart.startsWith('.') || localPart.endsWith('.')) {
      errors.push('Local part cannot start or end with a dot');
    }

    if (domain.startsWith('.') || domain.endsWith('.')) {
      errors.push('Domain cannot start or end with a dot');
    }

    // Check for invalid characters
    const invalidChars = /[^a-zA-Z0-9._+-]/;
    if (invalidChars.test(localPart)) {
      errors.push('Local part contains invalid characters');
    }

    // Check domain format
    const domainParts = domain.split('.');
    if (domainParts.length < 2) {
      errors.push('Domain must have at least one dot');
    }

    // Check for disposable email
    if (DISPOSABLE_DOMAINS.includes(domain)) {
      warnings.push('Email appears to be from a disposable provider');
    }

    // Check for common typos in domain
    const domainWithoutTLD = domainParts[0];
    const tld = domainParts[domainParts.length - 1];

    // Common domain typos
    const typos: Record<string, string> = {
      'gmial': 'gmail',
      'gmai': 'gmail',
      'gmali': 'gmail',
      'yahooo': 'yahoo',
      'yaho': 'yahoo',
      'hotmial': 'hotmail',
      'hotmai': 'hotmail',
      'outlok': 'outlook',
      'outloo': 'outlook',
    };

    if (typos[domainWithoutTLD]) {
      suggestions.push(`${localPart}@${typos[domainWithoutTLD]}.${tld}`);
    }

    // Common TLD typos
    const tldTypos: Record<string, string> = {
      'com': 'com',
      'co': 'com',
      'cm': 'com',
      'con': 'com',
      'net': 'net',
      'ne': 'net',
      'org': 'org',
      'or': 'org',
    };

    if (tld.length < 2 || tld.length > 6) {
      warnings.push('Top-level domain appears unusual');
    }
  }

  // Check for role-based emails
  const roleBasedPrefixes = [
    'info@',
    'admin@',
    'webmaster@',
    'support@',
    'contact@',
    'sales@',
    'marketing@',
    'noreply@',
    'no-reply@',
    'postmaster@',
    'abuse@',
  ];

  if (roleBasedPrefixes.some(prefix => normalized.startsWith(prefix))) {
    warnings.push('Email appears to be role-based');
  }

  return {
    valid: errors.length === 0,
    email,
    normalized,
    errors,
    warnings,
    suggestions: suggestions.length > 0 ? suggestions : undefined,
  };
}

/**
 * Validate multiple email addresses
 */
export function validateEmails(emails: string[]): EmailValidationResult[] {
  return emails.map(validateEmail);
}

/**
 * Check if email is from a common provider
 */
export function isCommonProvider(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return domain ? COMMON_PROVIDERS.includes(domain) : false;
}

/**
 * Check if email is from a disposable provider
 */
export function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return domain ? DISPOSABLE_DOMAINS.includes(domain) : false;
}

/**
 * Normalize email address
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Extract domain from email
 */
export function getEmailDomain(email: string): string {
  return email.split('@')[1]?.toLowerCase() || '';
}

/**
 * Check if email is role-based
 */
export function isRoleBasedEmail(email: string): boolean {
  const localPart = email.split('@')[0]?.toLowerCase();

  const roleBasedLocalParts = [
    'info',
    'admin',
    'webmaster',
    'support',
    'contact',
    'sales',
    'marketing',
    'noreply',
    'no-reply',
    'postmaster',
    'abuse',
    'help',
    'enquiries',
    'enquiry',
    'office',
    'accounts',
    'billing',
    'orders',
    'team',
    'hello',
  ];

  return localPart ? roleBasedLocalParts.includes(localPart) : false;
}

/**
 * Email validation rules
 */
export const emailRules = {
  maxLength: 254,
  minLength: 5,
  localMaxLength: 64,
  domainMaxLength: 255,
  allowedChars: /^[a-zA-Z0-9._+-]+$/,
  forbiddenPatterns: [
    /\.\./, // Consecutive dots
    /^\./, // Starts with dot
    /\.$/, // Ends with dot
  ],
};

/**
 * Sanitize email for display
 */
export function sanitizeEmailForDisplay(email: string): string {
  const [local, domain] = email.split('@');

  if (!local || !domain) {
    return email;
  }

  // Hide part of local part if it's long
  if (local.length > 6) {
    const visible = local.slice(0, 3);
    const hidden = '*'.repeat(local.length - 3);
    return `${visible}${hidden}@${domain}`;
  }

  // Hide part of domain if it's long
  if (domain.length > 10) {
    const [domainName, tld] = domain.split('.');
    if (domainName && tld) {
      const visible = domainName.slice(0, 3);
      const hidden = '*'.repeat(domainName.length - 3);
      return `${local}@${visible}${hidden}.${tld}`;
    }
  }

  return email;
}

/**
 * Email validation error messages
 */
export const emailErrorMessages = {
  REQUIRED: 'Email address is required',
  INVALID_FORMAT: 'Invalid email format',
  TOO_LONG: 'Email address is too long (max 254 characters)',
  LOCAL_TOO_LONG: 'Local part is too long (max 64 characters)',
  DOMAIN_TOO_LONG: 'Domain is too long (max 255 characters)',
  CONSECUTIVE_DOTS: 'Email cannot contain consecutive dots',
  DOTS_AT_EDGES: 'Email cannot start or end with a dot',
  INVALID_CHARS: 'Email contains invalid characters',
  NO_DOMAIN_DOT: 'Domain must contain a dot',
  DISPOSABLE: 'Email appears to be from a disposable provider',
  ROLE_BASED: 'Email appears to be role-based',
};