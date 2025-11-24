// src/lib/supabaseClient.js

import { createClient } from '@supabase/supabase-js';

// 1. Get Environment Variables
// Next.js server-side code (like API Routes) reads non-NEXT_PUBLIC variables.
// Use the Service Role Key for secure server operations, as it bypasses RLS.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// 2. Early Error Handling
// This ensures your build process fails fast and gives a clear error if keys are missing.
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase configuration error: SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables are missing. Check your .env.local file and deployment settings.');
}

// 3. Create and Export the Client
// Use the Service Key here.
export const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);