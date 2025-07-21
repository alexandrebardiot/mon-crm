import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ProjectService } from '../../services/project.service';
import { Project, ProjectStep } from '../../services/types';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.scss']
})
export class ProjectDetailComponent implements OnInit {
  project: Project | null = null;
  projectSteps: ProjectStep[] = [];
  loading = true;
  editingStep: string | null = null;
  editingStepData: Partial<ProjectStep> = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    const projectId = this.route.snapshot.paramMap.get('id');
    if (projectId) {
      this.loadProject(projectId);
    }
  }

  async loadProject(projectId: string) {
    try {
      this.loading = true;
      this.project = await this.projectService.getProjectById(projectId);
      if (this.project) {
        this.projectSteps = await this.projectService.getProjectSteps(projectId);
      } else {
        this.router.navigate(['/projects']);
      }
    } catch (error) {
      this.snackBar.open('Erreur lors du chargement du projet', 'Fermer', {
        duration: 3000
      });
      this.router.navigate(['/projects']);
    } finally {
      this.loading = false;
    }
  }

  async toggleStepCompleted(step: ProjectStep) {
    try {
      const updatedStep = await this.projectService.toggleProjectStepCompleted(
        step.id,
        !step.completed
      );
      if (updatedStep) {
        const index = this.projectSteps.findIndex(s => s.id === step.id);
        if (index !== -1) {
          this.projectSteps[index] = updatedStep;
        }
      }
    } catch (error) {
      this.snackBar.open('Erreur lors de la mise à jour de l\'étape', 'Fermer', {
        duration: 3000
      });
    }
  }

  startEditingStep(step: ProjectStep) {
    this.editingStep = step.id;
    this.editingStepData = {
      name: step.name,
      due_date: step.due_date
    };
  }

  cancelEditingStep() {
    this.editingStep = null;
    this.editingStepData = {};
  }

  async saveStep(stepId: string) {
    try {
      const updatedStep = await this.projectService.updateProjectStep(
        stepId,
        this.editingStepData
      );
      if (updatedStep) {
        const index = this.projectSteps.findIndex(s => s.id === stepId);
        if (index !== -1) {
          this.projectSteps[index] = updatedStep;
        }
        this.editingStep = null;
        this.editingStepData = {};
        this.snackBar.open('Étape mise à jour avec succès', 'Fermer', {
          duration: 3000
        });
      }
    } catch (error) {
      this.snackBar.open('Erreur lors de la mise à jour de l\'étape', 'Fermer', {
        duration: 3000
      });
    }
  }

  async deleteStep(stepId: string, stepName: string) {
    const confirmed = confirm(`Êtes-vous sûr de vouloir supprimer l'étape "${stepName}" ?`);
    
    if (confirmed) {
      try {
        await this.projectService.deleteProjectStep(stepId);
        this.projectSteps = this.projectSteps.filter(s => s.id !== stepId);
        this.snackBar.open('Étape supprimée avec succès', 'Fermer', {
          duration: 3000
        });
      } catch (error) {
        this.snackBar.open('Erreur lors de la suppression de l\'étape', 'Fermer', {
          duration: 3000
        });
      }
    }
  }

  getCompletedSteps(): number {
    return this.projectSteps.filter(step => step.completed).length;
  }

  getTotalSteps(): number {
    return this.projectSteps.length;
  }

  getProgress(): number {
    const total = this.getTotalSteps();
    if (total === 0) return 0;
    return (this.getCompletedSteps() / total) * 100;
  }

  isOverdue(step: ProjectStep): boolean {
    if (!step.due_date || step.completed) return false;
    const today = new Date();
    const dueDate = new Date(step.due_date);
    return dueDate < today;
  }

  async deleteProject() {
    if (!this.project) return;
    
    const confirmed = confirm(`Êtes-vous sûr de vouloir supprimer le projet "${this.project.name}" ?`);
    
    if (confirmed) {
      try {
        await this.projectService.deleteProject(this.project.id);
        this.snackBar.open('Projet supprimé avec succès', 'Fermer', {
          duration: 3000
        });
        this.router.navigate(['/projects']);
      } catch (error) {
        this.snackBar.open('Erreur lors de la suppression du projet', 'Fermer', {
          duration: 3000
        });
      }
    }
  }
}