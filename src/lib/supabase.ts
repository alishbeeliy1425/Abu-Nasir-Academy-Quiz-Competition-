import { createClient } from '@supabase/supabase-js';

// Fix URL formatting - Supabase client expects base URL without /rest/v1/
const rawUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ixbwfqowdigqvywboxwo.supabase.co';
const cleanUrl = rawUrl.replace('/rest/v1/', '').replace('/rest/v1', '');

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!cleanUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials not found. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables or via the Secrets panel.");
}

export const supabase = createClient(
  cleanUrl,
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4YndmcW93ZGlncXZ5d2JveHdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwOTkwODIsImV4cCI6MjA5NDY3NTA4Mn0.uDZmYqt_xp0RbCapaR7H-0TlrTnN8TpxxEN7uCdmgAA'
);