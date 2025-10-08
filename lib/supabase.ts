import { createClient } from "@supabase/supabase-js";

// Supabase client configuration
// These environment variables need to be set in .env.local

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
  );
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // We don't need session persistence for this app
  },
});

// Database types for TypeScript
export interface Database {
  public: {
    Tables: {
      alerts: {
        Row: {
          id: string;
          email: string;
          dates: string[]; // JSONB array of date strings
          time_of_day: "morning" | "midday" | "afternoon" | "any";
          quantity: number;
          min_capacity: number | null;
          active: boolean;
          created_at: string;
          last_checked: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          dates: string[];
          time_of_day: "morning" | "midday" | "afternoon" | "any";
          quantity: number;
          min_capacity?: number | null;
          active?: boolean;
          created_at?: string;
          last_checked?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          dates?: string[];
          time_of_day?: "morning" | "midday" | "afternoon" | "any";
          quantity?: number;
          min_capacity?: number | null;
          active?: boolean;
          created_at?: string;
          last_checked?: string | null;
        };
      };
    };
  };
}
