import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AddContactComponent } from './pages/add-contact/add-contact.component';
import { ContactDetailComponent } from './pages/contact-detail/contact-detail.component';
import { LoginComponent } from './pages/login/login.component';
import { StepsManagerComponent } from './steps-manager/steps-manager.component';
import { AuthGuard } from './guards/auth.guard'; 

export const routes: Routes = [
  { path: '', component: DashboardComponent, canActivate: [AuthGuard] },
  
  { path: 'login', component: LoginComponent },

  { path: 'add-contact', component: AddContactComponent, canActivate: [AuthGuard] },
  { path: 'contact/:id', component: ContactDetailComponent, canActivate: [AuthGuard] },

  { path: 'planning', component: DashboardComponent, canActivate: [AuthGuard] },

  { path: 'steps-manager', component: StepsManagerComponent, canActivate: [AuthGuard] },

  { path: '**', redirectTo: '', pathMatch: 'full' },
];
