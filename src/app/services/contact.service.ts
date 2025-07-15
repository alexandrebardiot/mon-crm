import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Contact } from './types';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService
  ) {}

  async getContacts(): Promise<Contact[]> {
    const user = await this.authService.getUser();
    if (!user) throw new Error('Utilisateur non connecté');
    
    const { data, error } = await this.supabaseService.client
      .from('contacts')
      .select(`
        *,
        company:companies(*)
      `)
      .eq('user_id', user.id);

    if (error) throw error;
    return data || [];
  }

  async getContactById(id: string): Promise<Contact | null> {
    const { data, error } = await this.supabaseService.client
      .from('contacts')
      .select(`
        *,
        company:companies(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async getContactsByCompany(companyId: string): Promise<Contact[]> {
    const user = await this.authService.getUser();
    if (!user) throw new Error('Utilisateur non connecté');
    
    const { data, error } = await this.supabaseService.client
      .from('contacts')
      .select(`
        *,
        company:companies(*)
      `)
      .eq('company_id', companyId)
      .eq('user_id', user.id);

    if (error) throw error;
    return data || [];
  }

  async addContact(contact: {
    contact_name: string;
    email: string;
    phone?: string;
    company_name?: string;
    position?: string;
    notes?: string;
    company_id?: string;
  }): Promise<Contact | null> {
    const user = await this.authService.getUser();
    if (!user) throw new Error('Utilisateur non connecté');

    const { data, error } = await this.supabaseService.client
      .from('contacts')
      .insert([{ ...contact, user_id: user.id }])
      .select(`
        *,
        company:companies(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async updateContact(id: string, updates: Partial<Contact>): Promise<Contact | null> {
    const { data, error } = await this.supabaseService.client
      .from('contacts')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        company:companies(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async deleteContact(id: string): Promise<void> {
    const { error } = await this.supabaseService.client
      .from('contacts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
