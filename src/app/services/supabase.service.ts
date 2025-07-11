import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface Step {
  id: string;
  label: string;
  position: number;
  contact_id?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabaseUrl = 'https://xihjlfidezvugdhtdvwk.supabase.co';
  private supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpaGpsZmlkZXp2dWdkaHRkdndrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxNjA2MTYsImV4cCI6MjA2NzczNjYxNn0.aBjdDn19OPdm8gMWL0lMZXOhLTZbrtXn7vg85w8wCpU';
  public supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
  }

  // Récupérer l'utilisateur connecté
  private async getCurrentUser() {
    const { data: userData, error: userError } = await this.supabase.auth.getUser();
    if (userError || !userData?.user) {
      throw new Error('Utilisateur non authentifié');
    }
    return userData.user;
  }

  // Contacts liés à l'utilisateur connecté
  async getContacts() {
    const user = await this.getCurrentUser();
    const { data, error } = await this.supabase
      .from('contacts')
      .select('*')
      .eq('user_id', user.id);

    if (error) throw error;
    return data;
  }

  async addContact(contact: {
    contact_name: string;
    email: string;
    phone?: string;
    company_name?: string;
    position?: string;
    notes?: string;
  }) {
    const user = await this.getCurrentUser();

    const { data, error } = await this.supabase
      .from('contacts')
      .insert([{ ...contact, user_id: user.id }]);

    if (error) throw error;
    return data;
  }

  async updateContact(id: string, updates: any) {
    const { data, error } = await this.supabase
      .from('contacts')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    return data;
  }

  // Steps

  /** Récupère les étapes, optionnellement pour un contact donné */
  
async getSteps(contactId?: string | null): Promise<Step[]> {
  let query = this.supabase.from('steps').select('*');
  
  if (contactId) {
    query = query.eq('contact_id', contactId);
  }
  
  const { data, error } = await query.order('position', { ascending: true });
  
  if (error) throw error;
  return data || [];
}

/**
 * Ajoute une nouvelle étape
 */
async addStep(contactId: string | null, label: string, position: number): Promise<Step | null> {
  const { data, error } = await this.supabase
    .from('steps')
    .insert([{ contact_id: contactId, label, position }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Supprime une étape par son ID
 */
async deleteStep(stepId: string): Promise<void> {
  const { error } = await this.supabase
    .from('steps')
    .delete()
    .eq('id', stepId);
  
  if (error) throw error;
}

/**
 * Met à jour une étape existante
 */
async updateStep(stepId: string, updates: Partial<Omit<Step, 'id'>>): Promise<Step | null> {
  const { data, error } = await this.supabase
    .from('steps')
    .update(updates)
    .eq('id', stepId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Réorganise les positions des étapes
 */
async reorderSteps(steps: { id: string; position: number }[]): Promise<void> {
  const updates = steps.map(step => 
    this.supabase
      .from('steps')
      .update({ position: step.position })
      .eq('id', step.id)
  );
  
  const results = await Promise.all(updates);
  
  for (const result of results) {
    if (result.error) throw result.error;
  }
}
  
}
