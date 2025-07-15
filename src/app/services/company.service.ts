import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Company } from './types';

@Injectable({
  providedIn: 'root',
})
export class CompanyService {
  constructor(private supabaseService: SupabaseService) {}

  async getCompanies(): Promise<Company[]> {
    const { data, error } = await this.supabaseService.client
      .from('companies')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getCompanyById(id: string): Promise<Company | null> {
    const { data, error } = await this.supabaseService.client
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async addCompany(company: { name: string; sector?: string; address?: string }): Promise<Company | null> {
    const { data, error } = await this.supabaseService.client
      .from('companies')
      .insert([company])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateCompany(id: string, updates: Partial<Company>): Promise<Company | null> {
    const { data, error } = await this.supabaseService.client
      .from('companies')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteCompany(id: string): Promise<void> {
    const { error } = await this.supabaseService.client
      .from('companies')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
