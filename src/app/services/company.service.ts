import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Company } from './types';

@Injectable({
  providedIn: 'root',
})
export class CompanyService {
  constructor(private supabaseService: SupabaseService) {}

  // Récupérer toutes les entreprises (triées par nom)
  async getCompanies(): Promise<Company[]> {
    const { data, error } = await this.supabaseService.client
      .from('companies')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Créer une entreprise avec juste un nom
  async create(company: { name: string }): Promise<Company> {
    const { data, error } = await this.supabaseService.client
      .from('companies')
      .insert([company])
      .select()
      .single();

    if (error) throw error;
    return data!;
  }

  // (Optionnel) récupérer une entreprise par son id
  async getById(id: string): Promise<Company | null> {
    const { data, error } = await this.supabaseService.client
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }
}
