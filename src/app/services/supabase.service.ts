// supabase.service.ts
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    const url = 'https://xihjlfidezvugdhtdvwk.supabase.co';
    const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpaGpsZmlkZXp2dWdkaHRkdndrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxNjA2MTYsImV4cCI6MjA2NzczNjYxNn0.aBjdDn19OPdm8gMWL0lMZXOhLTZbrtXn7vg85w8wCpU'; // garde-le safe dans env si possible
    this.supabase = createClient(url, key);
  }

  get client(): SupabaseClient {
    return this.supabase;
  }
}
