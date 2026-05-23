import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials not found. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables or via the Secrets panel.");
}

export const supabase = createClient(
  supabaseUrl || 'https://ixbwfqowdigqvywboxwo.supabase.co/rest/v1/',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4YndmcW93ZGlncXZ5d2JveHdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwOTkwODIsImV4cCI6MjA5NDY3NTA4Mn0.uDZmYqt_xp0RbCapaR7H-0TlrTnN8TpxxEN7uCdmgAA'
);