import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://sucfuzsxrlcyzlyagwjp.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1Y2Z1enN4cmxjeXpseWFnd2pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTM2MDAsImV4cCI6MjA4OTg2OTYwMH0.ZusM8V0RbSJvXsq1aTH3FvMpOpHRiOc6rYGGHzYNsjI";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);