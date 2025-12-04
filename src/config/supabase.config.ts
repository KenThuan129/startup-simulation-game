// Load env vars if not already loaded (for scripts that don't use index.ts)
if (!process.env.SUPABASE_URL && typeof require !== 'undefined') {
  try {
    require('dotenv').config();
  } catch (e) {
    // dotenv may not be available, that's okay
  }
}

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

// Only throw error if actually trying to use Supabase (not for simulation)
if (!supabaseUrl || !supabaseKey) {
  // Don't throw immediately - allow scripts to run without DB
  console.warn('⚠️  Warning: Missing Supabase configuration. Database features will not work.');
}

export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null as any; // Type assertion for optional Supabase

