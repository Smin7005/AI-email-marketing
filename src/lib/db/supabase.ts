import { createClient, SupabaseClient } from '@supabase/supabase-js';

// User's private Supabase (for user-specific data like collections)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Company's production database (for leads, campaigns, etc.)
const companyDbUrl = process.env.NEXT_PUBLIC_COMPANY_DB_URL || '';
const companyDbAnonKey = process.env.NEXT_PUBLIC_COMPANY_DB_ANON_KEY || '';

// Singleton instances
let companyDbClient: SupabaseClient | null = null;

export const getSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }
  return createClient(supabaseUrl, supabaseAnonKey);
};

export const getSupabaseAdmin = () => {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase service role key');
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

/**
 * Get Supabase client for company's production database
 * Used for leads, campaigns, and other business data
 */
export const getCompanyDbClient = (): SupabaseClient => {
  if (!companyDbUrl || !companyDbAnonKey) {
    throw new Error('Missing company database environment variables (NEXT_PUBLIC_COMPANY_DB_URL, NEXT_PUBLIC_COMPANY_DB_ANON_KEY)');
  }

  if (!companyDbClient) {
    companyDbClient = createClient(companyDbUrl, companyDbAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return companyDbClient;
};

