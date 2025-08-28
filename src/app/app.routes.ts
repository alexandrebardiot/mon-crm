import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/contact/dashboard/dashboard.component';
import { AddContactComponent } from './pages/contact/add-contact/add-contact.component';
import { EditContactComponent } from './pages/contact/edit-contact/edit-contact.component';
import { ContactDetailComponent } from './pages/contact/contact-detail/contact-detail.component';
import { LoginComponent } from './pages/login/login.component';
import { StepsManagerComponent } from './pages/steps-manager/steps-manager.component';
import { ProjectsComponent } from './pages/project/projects/projects.component';
import { ProjectDetailComponent } from './pages/project/project-detail/project-detail.component';
import { AddProjectComponent } from './pages/project/add-project/add-project.component';
import { AuthGuard } from './guards/auth.guard';
import { PlanningComponent } from './pages/scheduler/planning/planning.component';

// Companies
import { CompanyListComponent } from './pages/company/company-list/company-list.component';
import { CompanyCreateComponent } from './pages/company/company-create/company-create.component';
import { CompanyEditComponent } from './pages/company/company-edit/company-edit.component';
import { CompanyDetailsComponent } from './pages/company/company-details/company-details.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent, canActivate: [AuthGuard] },

  { path: 'login', component: LoginComponent },

  // Contacts
  { path: 'add-contact', component: AddContactComponent, canActivate: [AuthGuard] },
  { path: 'edit-contact/:id', component: EditContactComponent, canActivate: [AuthGuard] }, // ✅ Ajout
  { path: 'contact/:id', component: ContactDetailComponent, canActivate: [AuthGuard] },
  { path: 'contact/:id/details', component: ContactDetailComponent, canActivate: [AuthGuard] },

  // Projets
  { path: 'projects', component: ProjectsComponent, canActivate: [AuthGuard] },
  { path: 'project/:id', component: ProjectDetailComponent, canActivate: [AuthGuard] },
  { path: 'add-project', component: AddProjectComponent, canActivate: [AuthGuard] },
  { path: 'add-project/:contactId', component: AddProjectComponent, canActivate: [AuthGuard] },
  { path: 'company/:companyId/projects', component: ProjectsComponent, canActivate: [AuthGuard] },
  { path: 'contact/:contactId/projects', component: ProjectsComponent, canActivate: [AuthGuard] },

  // Companies
  { path: 'companies', component: CompanyListComponent, canActivate: [AuthGuard] },
  { path: 'companies/create', component: CompanyCreateComponent, canActivate: [AuthGuard] },
  { path: 'companies/:id/edit', component: CompanyEditComponent, canActivate: [AuthGuard] },
  { path: 'companies/:id/details', component: CompanyDetailsComponent, canActivate: [AuthGuard] },

  // Planning
  { path: 'planning', component: PlanningComponent, canActivate: [AuthGuard] },

  // Paramètres
  { path: 'steps-manager', component: StepsManagerComponent, canActivate: [AuthGuard] },

  // Catch-all
  { path: '**', redirectTo: '', pathMatch: 'full' },
];
