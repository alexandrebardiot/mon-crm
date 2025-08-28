import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Company, CreateCompanyDto } from './types';

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

  // Récupérer une entreprise par ID
  async getCompanyById(id: string): Promise<Company> {
    const { data, error } = await this.supabaseService.client
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) throw error || new Error('Entreprise non trouvée');
    return data;
  }

  // Créer une entreprise
  async create(company: CreateCompanyDto): Promise<Company> {
    const { data, error } = await this.supabaseService.client
      .from('companies')
      .insert([company])
      .select()
      .single();

    if (error || !data) throw error || new Error('Erreur lors de la création');
    return data;
  }

  // Mettre à jour une entreprise
  async update(id: string, updateData: Partial<CreateCompanyDto>): Promise<Company> {
    const { data, error } = await this.supabaseService.client
      .from('companies')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) throw error || new Error('Erreur lors de la mise à jour');
    return data;
  }

  // Supprimer une entreprise
  async delete(id: string): Promise<void> {
    const { error } = await this.supabaseService.client
      .from('companies')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}