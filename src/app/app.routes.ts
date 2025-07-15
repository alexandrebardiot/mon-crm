import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AddContactComponent } from './pages/add-contact/add-contact.component';
import { ContactDetailComponent } from './pages/contact-detail/contact-detail.component';
import { LoginComponent } from './pages/login/login.component';
import { StepsManagerComponent } from './pages/steps-manager/steps-manager.component';
import { ProjectsComponent } from './pages/projects/projects.component';
import { ProjectDetailComponent } from './pages/project-detail/project-detail.component';
import { AddProjectComponent } from './pages/add-project/add-project.component';
import { CompanyDetailComponent } from './pages/company-detail/company-detail.component';
import { AuthGuard } from './guards/auth.guard'; 

import { RouterModule } from '@angular/router';

export const routes: Routes = [
  { path: '', component: DashboardComponent, canActivate: [AuthGuard] },
  
  { path: 'login', component: LoginComponent },

  // Contacts
  { path: 'add-contact', component: AddContactComponent, canActivate: [AuthGuard] },
  { path: 'contact/:id', component: ContactDetailComponent, canActivate: [AuthGuard] },

  // Projets
  { path: 'projects', component: ProjectsComponent, canActivate: [AuthGuard] },
  { path: 'project/:id', component: ProjectDetailComponent, canActivate: [AuthGuard] },
  { path: 'add-project', component: AddProjectComponent, canActivate: [AuthGuard] },
  { path: 'add-project/:contactId', component: AddProjectComponent, canActivate: [AuthGuard] },

  // Entreprises
  { path: 'company/:id', component: CompanyDetailComponent, canActivate: [AuthGuard] },

  { path: 'planning', component: DashboardComponent, canActivate: [AuthGuard] },

  { path: 'steps-manager', component: StepsManagerComponent, canActivate: [AuthGuard] },

  { path: '**', redirectTo: '', pathMatch: 'full' },
];