// The Supabase URL and anon/publishable key are meant to be public — they are
// embedded in every client bundle and are safe to expose. Real protection comes
// from Row Level Security policies in the database, not from hiding these values.
// Hardcoded directly (not read from process.env) so a wrong/misconfigured Vercel
// env var of the same name can never silently override the correct value.
export const SUPABASE_URL = "https://kyztsxgffagpuaugtsfv.supabase.co";

export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5enRzeGdmZmFncHVhdWd0c2Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxOTY0NDYsImV4cCI6MjA5OTc3MjQ0Nn0.EDzdZx34xrOjJ-OoB2yHhtpUU1NU_K5OoCPOc30LwyQ";
