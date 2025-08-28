import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ProjectService } from '../../../services/project.service';
import { Project } from '../../../services/types';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss']
})
export class ProjectsComponent implements OnInit {
  projects: Project[] = [];
  loading = true;
  contactId: string | null = null;

  constructor(
    private projectService: ProjectService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.contactId = this.route.snapshot.paramMap.get('contactId');
    this.loadProjects();
  }

  async loadProjects() {
    try {
      this.loading = true;

      if (this.contactId) {
        this.projects = await this.projectService.getProjectsByContact(this.contactId);
      } else {
        this.projects = await this.projectService.getProjects();
      }

    } catch (error) {
      this.snackBar.open('Erreur lors du chargement des projets', 'Fermer', {
        duration: 3000
      });
    } finally {
      this.loading = false;
    }
  }
  get contactName(): string | null {
    if (this.projects.length > 0) {
      return this.projects[0].contact?.contact_name || null;
    } 
    return null;
  }

  getTotalSteps(project: Project): number {
    return project.project_steps?.length || 0;
  }

  getCompletedSteps(project: Project): number {
    return project.project_steps?.filter(step => step.completed).length || 0;
  }

  getProgress(project: Project): number {
    const total = this.getTotalSteps(project);
    return total > 0 ? (this.getCompletedSteps(project) / total) * 100 : 0;
  }

  async deleteProject(projectId: string, projectName: string) {
    const confirmed = confirm(`Êtes-vous sûr de vouloir supprimer le projet "${projectName}" ?`);
    
    if (confirmed) {
      try {
        await this.projectService.deleteProject(projectId);
        this.projects = this.projects.filter(p => p.id !== projectId);
        this.snackBar.open('Projet supprimé avec succès', 'Fermer', {
          duration: 3000
        });
      } catch (error) {
        this.snackBar.open('Erreur lors de la suppression du projet', 'Fermer', {
          duration: 3000
        });
      }
    }
  }
}
