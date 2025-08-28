import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import {
  Contact,
  Company,
  CreateContactDto
} from './types';

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService
  ) {}

  private async getUserId(): Promise<string> {
    const user = await this.authService.getUser();
    if (!user) throw new Error('Utilisateur non connecté');
    return user.id;
  }

  // Récupérer tous les contacts de l'utilisateur connecté
  async getContacts(): Promise<Contact[]> {
    const userId = await this.getUserId();

    const { data, error } = await this.supabaseService.client
      .from('contacts')
      .select('*, companies(*)') // Jointure avec companies
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Récupérer un contact par ID
  async getContactById(id: string): Promise<Contact | null> {
    const userId = await this.getUserId();

    const { data, error } = await this.supabaseService.client
      .from('contacts')
      .select('*, companies(*)')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error?.code === 'PGRST116') return null;
    if (error) throw error;
    return data;
  }

  // Récupérer les contacts d'une entreprise
  async getContactsByCompany(companyId: string): Promise<Contact[]> {
    const userId = await this.getUserId();

    const { data, error } = await this.supabaseService.client
      .from('contacts')
      .select('*, companies(*)')
      .eq('company_id', companyId)
      .eq('user_id', userId)
      .order('contact_name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Ajouter un contact
  async addContact(contactData: CreateContactDto): Promise<Contact> {
    const userId = await this.getUserId();

    const cleanData = {
      contact_name: contactData.contact_name.trim(),
      email: contactData.email.trim().toLowerCase(),
      phone: contactData.phone?.trim() || null,
      position: contactData.position?.trim() || null,
      notes: contactData.notes?.trim() || null,
      company_id: contactData.company_id || null,
      user_id: userId,
    };

    const { data, error } = await this.supabaseService.client
      .from('contacts')
      .insert([cleanData])
      .select('*, companies(*)')
      .single();

    if (error) throw error;
    return data;
  }

  // Modifier un contact
  async updateContact(id: string, updates: Partial<CreateContactDto>): Promise<Contact> {
    const userId = await this.getUserId();

    const cleanUpdates: any = {};
    if (updates.contact_name !== undefined) cleanUpdates.contact_name = updates.contact_name.trim();
    if (updates.email !== undefined) cleanUpdates.email = updates.email.trim().toLowerCase();
    if (updates.phone !== undefined) cleanUpdates.phone = updates.phone?.trim() || null;
    if (updates.position !== undefined) cleanUpdates.position = updates.position?.trim() || null;
    if (updates.notes !== undefined) cleanUpdates.notes = updates.notes?.trim() || null;
    if (updates.company_id !== undefined) cleanUpdates.company_id = updates.company_id || null;
    cleanUpdates.updated_at = new Date().toISOString();

    const { data, error } = await this.supabaseService.client
      .from('contacts')
      .update(cleanUpdates)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*, companies(*)')
      .single();

    if (error) throw error;
    return data;
  }

  // Mettre à jour uniquement les notes
  async updateContactNotes(id: string, notes: string): Promise<Contact> {
    const userId = await this.getUserId();

    const { data, error } = await this.supabaseService.client
      .from('contacts')
      .update({
        notes: notes.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select('*, companies(*)')
      .single();

    if (error) throw error;
    return data;
  }

  // Supprimer un contact
  async deleteContact(id: string): Promise<void> {
    const userId = await this.getUserId();

    const { error } = await this.supabaseService.client
      .from('contacts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  }

  // Recherche de contacts
  async searchContacts(searchTerm: string): Promise<Contact[]> {
    const userId = await this.getUserId();
    if (!searchTerm.trim()) return this.getContacts();

    const { data, error } = await this.supabaseService.client
      .from('contacts')
      .select('*, companies(*)')
      .eq('user_id', userId)
      .or(`contact_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .order('contact_name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Compter les contacts
  async getContactsCount(): Promise<number> {
    const userId = await this.getUserId();

    const { count, error } = await this.supabaseService.client
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) throw error;
    return count || 0;
  }

  // Vérifier si un email est déjà utilisé
  async checkEmailExists(email: string, excludeContactId?: string): Promise<boolean> {
    const userId = await this.getUserId();

    let query = this.supabaseService.client
      .from('contacts')
      .select('id')
      .eq('user_id', userId)
      .eq('email', email.trim().toLowerCase());

    if (excludeContactId) query = query.neq('id', excludeContactId);

    const { data, error } = await query;

    if (error) throw error;
    return (data?.length || 0) > 0;
  }

  // Récupérer toutes les entreprises (non liées à user_id)
  async getCompanies(): Promise<Company[]> {
    const { data, error } = await this.supabaseService.client
      .from('companies')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }
}
