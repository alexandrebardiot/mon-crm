import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Template, ProjectStep } from './types';

@Injectable({
  providedIn: 'root',
})
export class TemplateService {
  constructor(private supabaseService: SupabaseService) {}

  async getTemplates(): Promise<Template[]> {
    const { data, error } = await this.supabaseService.client
      .from('templates')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getTemplateById(id: string): Promise<Template | null> {
    const { data, error } = await this.supabaseService.client
      .from('templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async getTemplateSteps(templateId: string): Promise<ProjectStep[]> {
    const { data, error } = await this.supabaseService.client
      .from('steps') // ou 'template_steps' si c’est ton nom réel
      .select('*')
      .eq('template_id', templateId)
      .order('position', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async addTemplate(name: string): Promise<Template | null> {
    const { data, error } = await this.supabaseService.client
      .from('templates')
      .insert([{ name }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateTemplate(id: string, name: string): Promise<Template | null> {
    const { data, error } = await this.supabaseService.client
      .from('templates')
      .update({ name })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteTemplate(id: string): Promise<void> {
    // Supprimer d'abord les étapes associées
    const { error: stepsError } = await this.supabaseService.client
      .from('steps')
      .delete()
      .eq('template_id', id);

    if (stepsError) throw stepsError;

    // Puis supprimer le template
    const { error } = await this.supabaseService.client
      .from('templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
