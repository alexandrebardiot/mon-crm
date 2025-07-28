import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Contact, CreateContactDto } from './types';
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
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getContactById(id: string): Promise<Contact | null> {
    const user = await this.authService.getUser();
    if (!user) throw new Error('Utilisateur non connecté');

    const { data, error } = await this.supabaseService.client
      .from('contacts')
      .select(`
        *,
        company:companies(*)
      `)
      .eq('id', id)
      .eq('user_id', user.id) // Sécurité : vérifier que le contact appartient à l'utilisateur
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Contact non trouvé
      }
      throw error;
    }
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
      .eq('user_id', user.id)
      .order('contact_name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async addContact(contactData: CreateContactDto): Promise<Contact> {
    const user = await this.authService.getUser();
    if (!user) throw new Error('Utilisateur non connecté');

    // Nettoyer les données avant insertion
    const cleanContactData = {
      contact_name: contactData.contact_name.trim(),
      email: contactData.email.trim().toLowerCase(),
      phone: contactData.phone?.trim() || null,
      position: contactData.position?.trim() || null,
      notes: contactData.notes?.trim() || null,
      company_id: contactData.company_id || null,
      user_id: user.id
    };

    const { data, error } = await this.supabaseService.client
      .from('contacts')
      .insert([cleanContactData])
      .select(`
        *,
        company:companies(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async updateContact(id: string, updates: Partial<CreateContactDto>): Promise<Contact> {
    const user = await this.authService.getUser();
    if (!user) throw new Error('Utilisateur non connecté');

    // Nettoyer les données de mise à jour
    const cleanUpdates: any = {};
    
    if (updates.contact_name !== undefined) {
      cleanUpdates.contact_name = updates.contact_name.trim();
    }
    
    if (updates.email !== undefined) {
      cleanUpdates.email = updates.email.trim().toLowerCase();
    }
    
    if (updates.phone !== undefined) {
      cleanUpdates.phone = updates.phone?.trim() || null;
    }
    
    if (updates.position !== undefined) {
      cleanUpdates.position = updates.position?.trim() || null;
    }
    
    if (updates.notes !== undefined) {
      cleanUpdates.notes = updates.notes?.trim() || null;
    }
    
    if (updates.company_id !== undefined) {
      cleanUpdates.company_id = updates.company_id || null;
    }

    // Ajouter updated_at timestamp
    cleanUpdates.updated_at = new Date().toISOString();

    const { data, error } = await this.supabaseService.client
      .from('contacts')
      .update(cleanUpdates)
      .eq('id', id)
      .eq('user_id', user.id) // Sécurité : vérifier que le contact appartient à l'utilisateur
      .select(`
        *,
        company:companies(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Met à jour uniquement les notes d'un contact
   */
  async updateContactNotes(id: string, notes: string): Promise<Contact> {
    const user = await this.authService.getUser();
    if (!user) throw new Error('Utilisateur non connecté');

    const { data, error } = await this.supabaseService.client
      .from('contacts')
      .update({ 
        notes: notes.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id) // Sécurité : vérifier que le contact appartient à l'utilisateur
      .select(`
        *,
        company:companies(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Supprime un contact
   */
  async deleteContact(id: string): Promise<void> {
    const user = await this.authService.getUser();
    if (!user) throw new Error('Utilisateur non connecté');

    const { error } = await this.supabaseService.client
      .from('contacts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id); // Sécurité : vérifier que le contact appartient à l'utilisateur

    if (error) throw error;
  }

  /**
   * Recherche des contacts par nom ou email
   */
  async searchContacts(searchTerm: string): Promise<Contact[]> {
    const user = await this.authService.getUser();
    if (!user) throw new Error('Utilisateur non connecté');

    if (!searchTerm.trim()) {
      return this.getContacts(); // Retourner tous les contacts si pas de terme de recherche
    }

    const { data, error } = await this.supabaseService.client
      .from('contacts')
      .select(`
        *,
        company:companies(*)
      `)
      .eq('user_id', user.id)
      .or(`contact_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .order('contact_name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Compte le nombre total de contacts de l'utilisateur
   */
  async getContactsCount(): Promise<number> {
    const user = await this.authService.getUser();
    if (!user) throw new Error('Utilisateur non connecté');

    const { count, error } = await this.supabaseService.client
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (error) throw error;
    return count || 0;
  }

  /**
   * Vérifie si un email existe déjà pour cet utilisateur
   */
  async checkEmailExists(email: string, excludeContactId?: string): Promise<boolean> {
    const user = await this.authService.getUser();
    if (!user) throw new Error('Utilisateur non connecté');

    let query = this.supabaseService.client
      .from('contacts')
      .select('id')
      .eq('user_id', user.id)
      .eq('email', email.trim().toLowerCase());

    if (excludeContactId) {
      query = query.neq('id', excludeContactId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data?.length || 0) > 0;
  }
}