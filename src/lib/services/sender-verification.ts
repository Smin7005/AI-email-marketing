import { getCompanyDbClient } from '../db/supabase';
import { sesService, SESService } from '../email/ses';
import { SENDER_VERIFICATION_STATUS, SENDER_DKIM_STATUS } from '../db/schema';

export interface DnsRecord {
  type: 'TXT' | 'CNAME';
  name: string;
  value: string;
  purpose: 'domain_verification' | 'dkim';
  status?: 'pending' | 'verified';
}

export interface SenderInfo {
  id: number;
  organizationId: string;
  emailAddress: string;
  domain: string;
  verificationStatus: string;
  verificationToken: string | null;
  dkimTokens: string[] | null;
  dkimStatus: string | null;
  isDefault: boolean;
  lastVerifiedAt: string | null;
  verificationError: string | null;
  configurationSetName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AddSenderResult {
  sender: SenderInfo;
  dnsRecords: DnsRecord[];
}

export class SenderVerificationService {
  private ses: SESService;
  private readonly MAX_PENDING_PER_ORG = 5;

  constructor(sesService?: SESService) {
    this.ses = sesService || new SESService();
  }

  /**
   * Extract domain from email address
   */
  private extractDomain(email: string): string {
    const parts = email.split('@');
    if (parts.length !== 2) {
      throw new Error('Invalid email address format');
    }
    return parts[1].toLowerCase();
  }

  /**
   * Validate email address format
   */
  private validateEmail(email: string): { valid: boolean; error?: string } {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return { valid: false, error: 'Invalid email address format' };
    }

    const domain = this.extractDomain(email);

    // Check for blacklisted domains
    const blacklistedDomains = ['example.com', 'test.com', 'localhost'];
    if (blacklistedDomains.includes(domain)) {
      return { valid: false, error: `Domain ${domain} is not allowed` };
    }

    // Check for IP address domains
    const ipRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
    if (ipRegex.test(domain)) {
      return { valid: false, error: 'IP address domains are not allowed' };
    }

    return { valid: true };
  }

  /**
   * Check if organization has reached the limit of pending senders
   */
  private async checkRateLimit(organizationId: string): Promise<boolean> {
    const supabase = getCompanyDbClient();

    const { count, error } = await supabase
      .from('senders')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('verification_status', SENDER_VERIFICATION_STATUS.PENDING);

    if (error) {
      console.error('Error checking rate limit:', error);
      return false;
    }

    return (count || 0) < this.MAX_PENDING_PER_ORG;
  }

  /**
   * Add a new sender (email address) for verification
   */
  async addSender(organizationId: string, emailAddress: string): Promise<AddSenderResult> {
    const supabase = getCompanyDbClient();

    // Normalize email
    const normalizedEmail = emailAddress.toLowerCase().trim();

    // Validate email format
    const validation = this.validateEmail(normalizedEmail);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Extract domain
    const domain = this.extractDomain(normalizedEmail);

    // Check rate limit
    const withinLimit = await this.checkRateLimit(organizationId);
    if (!withinLimit) {
      throw new Error(`Maximum of ${this.MAX_PENDING_PER_ORG} pending senders reached`);
    }

    // Check if sender already exists for this org
    const { data: existingSender } = await supabase
      .from('senders')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('email_address', normalizedEmail)
      .single();

    if (existingSender) {
      throw new Error('This email address is already registered');
    }

    // Initiate domain verification with AWS SES
    const { verificationToken } = await this.ses.verifyDomainIdentity(domain);

    // Initiate DKIM verification
    const { dkimTokens } = await this.ses.verifyDomainDkim(domain);

    // Insert sender record
    const { data: newSender, error: insertError } = await supabase
      .from('senders')
      .insert({
        organization_id: organizationId,
        email_address: normalizedEmail,
        domain: domain,
        verification_status: SENDER_VERIFICATION_STATUS.PENDING,
        verification_token: verificationToken,
        dkim_tokens: dkimTokens,
        dkim_status: SENDER_DKIM_STATUS.PENDING,
        is_default: false,
      })
      .select()
      .single();

    if (insertError || !newSender) {
      // Try to clean up AWS SES identity if insert fails
      try {
        await this.ses.deleteIdentity(domain);
      } catch {
        // Ignore cleanup errors
      }
      throw new Error(`Failed to create sender: ${insertError?.message || 'Unknown error'}`);
    }

    // Generate DNS records for display
    const dnsRecords = this.getDnsRecords({
      domain,
      verificationToken,
      dkimTokens,
      verificationStatus: SENDER_VERIFICATION_STATUS.PENDING,
      dkimStatus: SENDER_DKIM_STATUS.PENDING,
    });

    return {
      sender: this.mapToSenderInfo(newSender),
      dnsRecords,
    };
  }

  /**
   * Get DNS records for a sender
   */
  getDnsRecords(params: {
    domain: string;
    verificationToken: string | null;
    dkimTokens: string[] | null;
    verificationStatus: string;
    dkimStatus: string | null;
  }): DnsRecord[] {
    const records: DnsRecord[] = [];
    const { domain, verificationToken, dkimTokens, verificationStatus, dkimStatus } = params;

    // Domain verification TXT record
    if (verificationToken) {
      records.push({
        type: 'TXT',
        name: `_amazonses.${domain}`,
        value: verificationToken,
        purpose: 'domain_verification',
        status: verificationStatus === SENDER_VERIFICATION_STATUS.VERIFIED ? 'verified' : 'pending',
      });
    }

    // DKIM CNAME records
    if (dkimTokens && dkimTokens.length > 0) {
      dkimTokens.forEach((token, index) => {
        records.push({
          type: 'CNAME',
          name: `${token}._domainkey.${domain}`,
          value: `${token}.dkim.amazonses.com`,
          purpose: 'dkim',
          status: dkimStatus === SENDER_DKIM_STATUS.SUCCESS ? 'verified' : 'pending',
        });
      });
    }

    return records;
  }

  /**
   * List all senders for an organization
   */
  async listSenders(organizationId: string): Promise<SenderInfo[]> {
    const supabase = getCompanyDbClient();

    const { data: senders, error } = await supabase
      .from('senders')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to list senders: ${error.message}`);
    }

    return (senders || []).map(this.mapToSenderInfo);
  }

  /**
   * Get a single sender by ID
   */
  async getSender(organizationId: string, senderId: number): Promise<SenderInfo | null> {
    const supabase = getCompanyDbClient();

    const { data: sender, error } = await supabase
      .from('senders')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('id', senderId)
      .single();

    if (error || !sender) {
      return null;
    }

    return this.mapToSenderInfo(sender);
  }

  /**
   * Check verification status with AWS SES and update database
   */
  async checkVerificationStatus(organizationId: string, senderId: number): Promise<SenderInfo> {
    const supabase = getCompanyDbClient();

    // Get sender
    const sender = await this.getSender(organizationId, senderId);
    if (!sender) {
      throw new Error('Sender not found');
    }

    // Check status with AWS SES
    const verificationAttrs = await this.ses.getIdentityVerificationAttributes([sender.domain]);
    const dkimAttrs = await this.ses.getIdentityDkimAttributes([sender.domain]);

    const verification = verificationAttrs.get(sender.domain);
    const dkim = dkimAttrs.get(sender.domain);

    // Map AWS statuses to our statuses
    let newVerificationStatus = sender.verificationStatus;
    let newDkimStatus = sender.dkimStatus;

    if (verification) {
      switch (verification.verificationStatus) {
        case 'Success':
          newVerificationStatus = SENDER_VERIFICATION_STATUS.VERIFIED;
          break;
        case 'Failed':
          newVerificationStatus = SENDER_VERIFICATION_STATUS.FAILED;
          break;
        case 'Pending':
          newVerificationStatus = SENDER_VERIFICATION_STATUS.PENDING;
          break;
      }
    }

    if (dkim) {
      switch (dkim.dkimVerificationStatus) {
        case 'Success':
          newDkimStatus = SENDER_DKIM_STATUS.SUCCESS;
          break;
        case 'Failed':
          newDkimStatus = SENDER_DKIM_STATUS.FAILED;
          break;
        case 'Pending':
          newDkimStatus = SENDER_DKIM_STATUS.PENDING;
          break;
      }
    }

    // Update database
    const { data: updatedSender, error } = await supabase
      .from('senders')
      .update({
        verification_status: newVerificationStatus,
        dkim_status: newDkimStatus,
        last_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', senderId)
      .select()
      .single();

    if (error || !updatedSender) {
      throw new Error(`Failed to update sender: ${error?.message || 'Unknown error'}`);
    }

    return this.mapToSenderInfo(updatedSender);
  }

  /**
   * Remove a sender
   */
  async removeSender(organizationId: string, senderId: number): Promise<void> {
    const supabase = getCompanyDbClient();

    // Get sender first
    const sender = await this.getSender(organizationId, senderId);
    if (!sender) {
      throw new Error('Sender not found');
    }

    // Check if there are active campaigns using this sender
    // (This check can be expanded based on business requirements)

    // Delete from AWS SES
    try {
      await this.ses.deleteIdentity(sender.domain);
    } catch (error) {
      console.error('Failed to delete identity from SES:', error);
      // Continue with database deletion even if SES deletion fails
    }

    // Delete from database
    const { error } = await supabase
      .from('senders')
      .delete()
      .eq('id', senderId)
      .eq('organization_id', organizationId);

    if (error) {
      throw new Error(`Failed to delete sender: ${error.message}`);
    }
  }

  /**
   * Set a sender as the default for the organization
   */
  async setDefaultSender(organizationId: string, senderId: number): Promise<void> {
    const supabase = getCompanyDbClient();

    // Get sender
    const sender = await this.getSender(organizationId, senderId);
    if (!sender) {
      throw new Error('Sender not found');
    }

    // Check if sender is verified
    if (sender.verificationStatus !== SENDER_VERIFICATION_STATUS.VERIFIED) {
      throw new Error('Sender must be verified before setting as default');
    }

    // Unset all other defaults for this org
    await supabase
      .from('senders')
      .update({ is_default: false, updated_at: new Date().toISOString() })
      .eq('organization_id', organizationId);

    // Set this sender as default
    const { error } = await supabase
      .from('senders')
      .update({ is_default: true, updated_at: new Date().toISOString() })
      .eq('id', senderId);

    if (error) {
      throw new Error(`Failed to set default sender: ${error.message}`);
    }
  }

  /**
   * Get the default sender for an organization
   */
  async getDefaultSender(organizationId: string): Promise<SenderInfo | null> {
    const supabase = getCompanyDbClient();

    const { data: sender, error } = await supabase
      .from('senders')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_default', true)
      .eq('verification_status', SENDER_VERIFICATION_STATUS.VERIFIED)
      .single();

    if (error || !sender) {
      return null;
    }

    return this.mapToSenderInfo(sender);
  }

  /**
   * Get a verified sender for an organization (default or any verified)
   */
  async getVerifiedSender(organizationId: string): Promise<SenderInfo | null> {
    // Try to get default sender first
    const defaultSender = await this.getDefaultSender(organizationId);
    if (defaultSender) {
      return defaultSender;
    }

    // Otherwise, get any verified sender
    const supabase = getCompanyDbClient();

    const { data: sender, error } = await supabase
      .from('senders')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('verification_status', SENDER_VERIFICATION_STATUS.VERIFIED)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (error || !sender) {
      return null;
    }

    return this.mapToSenderInfo(sender);
  }

  /**
   * Map database row to SenderInfo
   */
  private mapToSenderInfo(row: Record<string, unknown>): SenderInfo {
    return {
      id: row.id as number,
      organizationId: row.organization_id as string,
      emailAddress: row.email_address as string,
      domain: row.domain as string,
      verificationStatus: row.verification_status as string,
      verificationToken: row.verification_token as string | null,
      dkimTokens: row.dkim_tokens as string[] | null,
      dkimStatus: row.dkim_status as string | null,
      isDefault: row.is_default as boolean,
      lastVerifiedAt: row.last_verified_at as string | null,
      verificationError: row.verification_error as string | null,
      configurationSetName: row.configuration_set_name as string | null,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }
}

export const senderVerificationService = new SenderVerificationService();
