import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { StepService } from './step.service';
import { Project, ProjectStep } from './types';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService,
    private stepService: StepService
  ) {}

  async getProjects(): Promise<Project[]> {
    const user = await this.authService.getUser();
    if (!user) throw new Error('Utilisateur non connecté');

    const { data, error } = await this.supabaseService.client
      .from('projects')
      .select(`
        *,
        contact:contacts(
          *,
          company:companies(*)
        ),
        project_steps(*)
      `)
      .eq('create_by', user.id) // correction : create_by
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des projets:', error);
      throw error;
    }
    return data || [];
  }

  async getProjectById(id: string): Promise<Project | null> {
    const { data, error } = await this.supabaseService.client
      .from('projects')
      .select(`
        *,
        contact:contacts(
          *,
          company:companies(*)
        ),
        project_steps(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erreur lors de la récupération du projet:', error);
      throw error;
    }
    return data;
  }

  async getProjectsByContact(contactId: string): Promise<Project[]> {
    const user = await this.authService.getUser();
    if (!user) throw new Error('Utilisateur non connecté');

    const { data, error } = await this.supabaseService.client
      .from('projects')
      .select(`
        *,
        contact:contacts(
          *,
          company:companies(*)
        ),
        project_steps(*)
      `)
      .eq('contact_id', contactId)
      .eq('create_by', user.id) // correction : create_by
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des projets par contact:', error);
      throw error;
    }
    return data || [];
  }

  async createProject(project: {
    name: string;
    description?: string;
    contact_id: string;
  }): Promise<Project | null> {
    const user = await this.authService.getUser();
    if (!user) throw new Error('Utilisateur non connecté');

    const { data, error } = await this.supabaseService.client
      .from('projects')
      .insert([{ 
        ...project, 
        create_by: user.id // correction : create_by
      }])
      .select(`
        *,
        contact:contacts(
          *,
          company:companies(*)
        )
      `)
      .single();

    if (error) {
      console.error('Erreur lors de la création du projet:', error);
      throw error;
    }
    return data;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    const { data, error } = await this.supabaseService.client
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        contact:contacts(
          *,
          company:companies(*)
        )
      `)
      .single();

    if (error) {
      console.error('Erreur lors de la mise à jour du projet:', error);
      throw error;
    }
    return data;
  }

  async deleteProject(id: string): Promise<void> {
    try {
      // Supprimer d'abord les étapes associées
      const { error: stepsError } = await this.supabaseService.client
        .from('project_steps')
        .delete()
        .eq('project_id', id);

      if (stepsError) {
        console.error('Erreur lors de la suppression des étapes:', stepsError);
        throw stepsError;
      }

      // Puis supprimer le projet
      const { error } = await this.supabaseService.client
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erreur lors de la suppression du projet:', error);
        throw error;
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du projet:', error);
      throw error;
    }
  }

  // ========== PROJECT STEPS ==========

  async getProjectSteps(projectId: string): Promise<ProjectStep[]> {
    const { data, error } = await this.supabaseService.client
      .from('project_steps')
      .select('*')
      .eq('project_id', projectId)
      .order('position', { ascending: true });

    if (error) {
      console.error('Erreur lors de la récupération des étapes:', error);
      throw error;
    }
    return data || [];
  }

  async createProjectStepsFromTemplate(
    projectId: string,
    templateId: string,
    startDate: Date = new Date()
  ): Promise<ProjectStep[]> {
    try {
      const templateSteps = await this.stepService.getStepsByTemplate(templateId);

      const projectSteps = templateSteps.map((step) => {
        const dueDate = new Date(startDate);
        dueDate.setDate(dueDate.getDate() + step.default_due_days);

        return {
          project_id: projectId,
          name: step.name,
          position: step.position,
          due_date: dueDate.toISOString().split('T')[0],
          completed: false,
        };
      });

      const { data, error } = await this.supabaseService.client
        .from('project_steps')
        .insert(projectSteps)
        .select();

      if (error) {
        console.error('Erreur lors de la création des étapes depuis le template:', error);
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Erreur lors de la création des étapes depuis le template:', error);
      throw error;
    }
  }

  async updateProjectStep(id: string, updates: Partial<ProjectStep>): Promise<ProjectStep | null> {
    const { data, error } = await this.supabaseService.client
      .from('project_steps')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la mise à jour de l\'étape:', error);
      throw error;
    }
    return data;
  }

  async toggleProjectStepCompleted(id: string, completed: boolean): Promise<ProjectStep | null> {
    return this.updateProjectStep(id, { completed });
  }

  async deleteProjectStep(id: string): Promise<void> {
    const { error } = await this.supabaseService.client
      .from('project_steps')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erreur lors de la suppression de l\'étape:', error);
      throw error;
    }
  }
  // Méthode à ajouter dans votre ProjectService si elle n'existe pas déjà

async createProjectStep(projectId: string, step: {
  name: string;
  description?: string;
  due_date?: string;
  position?: number;
  completed?: boolean;
}): Promise<ProjectStep | null> {
  const { data, error } = await this.supabaseService.client
    .from('project_steps')
    .insert([{
      project_id: projectId,
      name: step.name,
      description: step.description || '',
      due_date: step.due_date,
      position: step.position || 0,
      completed: step.completed || false,
    }])
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la création de l\'étape:', error);
    throw error;
  }
  return data;
}
}
