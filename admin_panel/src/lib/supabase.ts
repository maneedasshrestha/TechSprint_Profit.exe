import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://olxtmubvfqglxjisokcr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9seHRtdWJ2ZnFnbHhqaXNva2NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTYwMTAsImV4cCI6MjA4MTQ3MjAxMH0.BUJhzOinj0GlqiNBzysw6WAtpVA9ibsFJa0o4qy1L_I';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types matching the actual proposals table schema
export interface ProposalRecord {
  id?: string;
  title: string;
  description: string;
  image_url?: string | null;
  creator_id?: string | null;
  blockchain_tx_hash?: string | null;
  proposal_blockchain_id?: number | null;
  created_at?: string | null;
  ends_at: string;
  status?: string | null;
}