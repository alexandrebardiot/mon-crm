export interface Company {
  id: string;
  name: string;
  sector?: string;
  address?: string;
  created_at: string;
}

export interface Contact {
  id: string;
  contact_name: string;
  email: string;
  phone?: string;
  company_name?: string;
  position?: string;
  notes?: string;
  company_id?: string;
  user_id: string;
  created_at: string;
  company?: Company;
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
  created_by: string;
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