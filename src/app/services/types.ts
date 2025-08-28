// types.ts - Interfaces principales corrigées

export interface Company {
  id: string;
  name: string;
  nature?: 'Prospect' | 'Client' | 'Prescripteur';
  siret?: string;
  code_naf?: string;
  chiffre_affaires?: string;
  nb_salaries?: number;
  creditsafe_note?: number;
  code_postal?: string;
  site_web?: string;
  created_at: string;
}
export interface CreateCompanyDto {
  name: string;
  nature?: 'Prospect' | 'Client' | 'Prescripteur';
  siret?: string;
  code_naf?: string;
  chiffre_affaires?: string;
  nb_salaries?: number;
  creditsafe_note?: number;
  code_postal?: string;
  site_web?: string;
}


export interface Contact {
  id: string;
  contact_name: string;
  email: string;
  phone?: string;
  position?: string;
  notes?: string;
  company_id?: string;
  user_id: string;
  created_at: string;
  updated_at?: string;
  companies?: Company; // Relation join avec Supabase
}

export interface Template {
  id: string;
  name: string;
  created_at: string;
}

export interface Step {
  id: string;
  name: string;
  position: number;
  default_due_days: number;
  template_id: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  contact_id: string;
  company_id: string;
  typology?: string;
  expected_revenue?: number;
  expectations?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  feeling?: string;
  create_by: string;
  created_at: string;
  contact?: Contact;
  project_steps?: ProjectStep[];
}

export interface CreateProjectDto {
  name: string;
  description?: string;
  contact_id: string;
  typology?: string;
  expected_revenue?: number;
  expectations?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  feeling?: string;
}


// DTOs pour les services

export interface CreateCompanyDto {
  name: string;
  sector?: string;
  address?: string;
}

export interface CreateContactDto {
  contact_name: string;
  email: string;
  phone?: string;
  position?: string;
  notes?: string;
  company_id?: string;
}


// Interface pour les réponses des services

export interface ServiceResponse<T> {
  data: T;
  error?: string;
}

// Example service interfaces

export interface CompanyServiceInterface {
  getCompanies(): Promise<Company[]>;
  create(companyData: CreateCompanyDto): Promise<Company>;
  update(id: string, companyData: Partial<CreateCompanyDto>): Promise<Company>;
  delete(id: string): Promise<void>;
}

export interface ContactServiceInterface {
  getContacts(): Promise<Contact[]>;
  addContact(contactData: CreateContactDto): Promise<Contact>;
  updateContact(id: string, contactData: Partial<CreateContactDto>): Promise<Contact>;
  deleteContact(id: string): Promise<void>;
}

export interface ProjectServiceInterface {
  getProjects(): Promise<Project[]>;
  createProject(projectData: CreateProjectDto): Promise<Project>;
  updateProject(id: string, projectData: Partial<CreateProjectDto>): Promise<Project>;
  deleteProject(id: string): Promise<void>;
}
export interface ProjectStep {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  position: number;
  due_date?: Date;
  created_at: Date;
  completed: boolean;
  reminder_date?: Date;
  project?: { name: string };
  project_name?: string;
}

export interface CreateProjectStepRequest {
  project_id: string;
  name: string;
  description?: string;
  position: number;
  due_date?: Date;
  reminder_date?: Date;
}

export interface UpdateProjectStepRequest {
  name?: string;
  description?: string;
  position?: number;
  due_date?: Date;
  completed?: boolean;
  reminder_date?: Date;
}

export interface TaskGroup {
  label: string;
  tasks: ProjectStep[];
  color: string;
}

export interface WeekDay {
  date: Date;
  dayName: string;
  dayNameShort: string;
  dayNumber: number;
  isToday: boolean;
  isWeekend: boolean;
  tasks: ProjectStep[];
}

export interface NotificationData {
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  duration?: number;
}