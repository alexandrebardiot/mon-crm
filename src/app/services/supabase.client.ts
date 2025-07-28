import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xihjlfidezvugdhtdvwk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpaGpsZmlkZXp2dWdkaHRkdndrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxNjA2MTYsImV4cCI6MjA2NzczNjYxNn0.aBjdDn19OPdm8gMWL0lMZXOhLTZbrtXn7vg85w8wCpU';

export const supabase = createClient(supabaseUrl, supabaseKey);