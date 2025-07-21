// types.ts - Interfaces principales corrigées

export interface Company {
  id: string;
  name: string;
  created_at: string;
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
  company?: Company; // Relation join avec Supabase
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
  create_by: string; // Correction: create_by au lieu de created_by
  created_at: string;
  contact?: Contact;
  company?: Company;
  project_steps?: ProjectStep[];
}

export interface ProjectStep {
  id: string;
  project_id: string;
  name: string;
  position: number;
  due_date: string;
  completed: boolean;
  created_at: string;
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

export interface CreateProjectDto {
  name: string;
  description?: string;
  contact_id: string;
  company_id: string;
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