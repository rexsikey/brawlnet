import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

if (supabaseUrl.includes('placeholder') || supabaseAnonKey === 'placeholder') {
  console.warn('⚠️ BRAWLNET: Supabase keys are missing. Using placeholders.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
