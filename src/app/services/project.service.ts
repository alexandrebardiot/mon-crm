import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { StepService } from './step.service';
import { Project, ProjectStep, CreateProjectDto } from './types';

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
          company:contact_company(*)
        ),
        project_steps(*)
      `)
      .eq('create_by', user.id)
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
          company:contact_company(*)
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
          company:contact_company(*)
        ),
        project_steps(*)
      `)
      .eq('contact_id', contactId)
      .eq('create_by', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des projets par contact:', error);
      throw error;
    }
    return data || [];
  }

  async getProjectsByCompany(companyId: string): Promise<Project[]> {
    const user = await this.authService.getUser();
    if (!user) throw new Error('Utilisateur non connecté');

    const { data, error } = await this.supabaseService.client
      .from('projects')
      .select(`
        *,
        contact:contacts(
          *,
          company:contact_company(*)
        ),
        project_steps(*)
      `)
      .eq('create_by', user.id)
      .filter('contact.company.id', 'eq', companyId) // filtre via la jointure
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des projets par entreprise:', error);
      throw error;
    }
    return data || [];
  }

  async createProject(projectDto: CreateProjectDto): Promise<Project | null> {
    const user = await this.authService.getUser();
    if (!user) throw new Error('Utilisateur non connecté');

    this.validateProjectData(projectDto);

    const { data, error } = await this.supabaseService.client
      .from('projects')
      .insert([{ 
        ...projectDto, 
        create_by: user.id 
      }])
      .select(`
        *,
        contact:contacts(
          *,
          company:contact_company(*)
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
    if (updates.start_date && updates.end_date) {
      this.validateDates(updates.start_date, updates.end_date);
    }

    if (updates.expected_revenue !== undefined && updates.expected_revenue < 0) {
      throw new Error('Le chiffre d\'affaires attendu ne peut pas être négatif');
    }

    const { data, error } = await this.supabaseService.client
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        contact:contacts(
          *,
          company:contact_company(*)
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
      const { error: stepsError } = await this.supabaseService.client
        .from('project_steps')
        .delete()
        .eq('project_id', id);

      if (stepsError) {
        console.error('Erreur lors de la suppression des étapes:', stepsError);
        throw stepsError;
      }

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

  private validateProjectData(project: CreateProjectDto): void {
    if (!project.name?.trim()) {
      throw new Error('Le nom du projet est obligatoire');
    }

    if (!project.contact_id) {
      throw new Error('Un contact est obligatoire');
    }

    if (project.start_date && project.end_date) {
      this.validateDates(project.start_date, project.end_date);
    }

    if (project.expected_revenue !== undefined && project.expected_revenue < 0) {
      throw new Error('Le chiffre d\'affaires attendu ne peut pas être négatif');
    }
  }

  private validateDates(startDate: string, endDate: string): void {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      throw new Error('La date de fin doit être postérieure à la date de début');
    }
  }

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

  async getProjectsByStatus(status: string): Promise<Project[]> {
    const user = await this.authService.getUser();
    if (!user) throw new Error('Utilisateur non connecté');

    const { data, error } = await this.supabaseService.client
      .from('projects')
      .select(`
        *,
        contact:contacts(
          *,
          company:contact_company(*)
        ),
        project_steps(*)
      `)
      .eq('create_by', user.id)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des projets par statut:', error);
      throw error;
    }
    return data || [];
  }

  async getProjectsByTypology(typology: string): Promise<Project[]> {
    const user = await this.authService.getUser();
    if (!user) throw new Error('Utilisateur non connecté');

    const { data, error } = await this.supabaseService.client
      .from('projects')
      .select(`
        *,
        contact:contacts(
          *,
          company:contact_company(*)
        ),
        project_steps(*)
      `)
      .eq('create_by', user.id)
      .eq('typology', typology)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des projets par typologie:', error);
      throw error;
    }
    return data || [];
  }

  calculateProjectDuration(project: Project): number | null {
    if (!project.start_date || !project.end_date) return null;

    const start = new Date(project.start_date);
    const end = new Date(project.end_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  isProjectOverdue(project: Project): boolean {
    if (!project.end_date || project.status === 'terminé') return false;

    const today = new Date();
    const endDate = new Date(project.end_date);
    return endDate < today;
  }

  getProjectProgress(project: Project): number {
    if (!project.project_steps || project.project_steps.length === 0) return 0;

    const completedSteps = project.project_steps.filter(step => step.completed).length;
    return (completedSteps / project.project_steps.length) * 100;
  }
}
