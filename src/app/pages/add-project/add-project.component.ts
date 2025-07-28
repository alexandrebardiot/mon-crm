import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ProjectService } from '../../services/project.service';
import { ContactService } from '../../services/contact.service';
import { TemplateService } from '../../services/template.service';
import { StepService } from '../../services/step.service';
import { Contact, ProjectStep, Template } from '../../services/types';

// Define the TemplateStep interface locally since it's not exported
interface TemplateStep {
  id: string;
  name: string;
  description?: string;
  position: number;
  default_due_days: number;
  template_id: string;
  created_at?: string;
}

interface WeekDay {
  date: Date;
  dayName: string;
  dayNumber: string;
  isToday: boolean;
  tasks: ProjectStep[];
}

@Component({
  selector: 'app-add-project',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatTooltipModule,
  ],
  templateUrl: './add-project.component.html',
  styleUrls: ['./add-project.component.scss'],
})
export class AddProjectComponent implements OnInit {
  projectForm: FormGroup;
  contacts: Contact[] = [];
  templates: Template[] = [];
  projectSteps: ProjectStep[] = [];
  loading = false;

  // Planification
  currentWeekStart: Date = new Date();
  weekDays: WeekDay[] = [];
  planningMap: { [date: string]: ProjectStep[] } = {};
  selectedStepIndex: number | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private projectService: ProjectService,
    private contactService: ContactService,
    private templateService: TemplateService,
    private stepService: StepService,
    private snackBar: MatSnackBar
  ) {
    this.projectForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      contact_id: ['', Validators.required],
      template_id: ['', Validators.required], // Template obligatoire
    });

    // Initialiser la semaine courante (commencer le lundi)
    this.initializeCurrentWeek();
  }

  ngOnInit() {
    this.loadData();
    this.projectForm.get('template_id')?.valueChanges.subscribe(() => {
      this.onTemplateSelected();
    });
  }

  async loadData() {
    this.loading = true;
    try {
      const [contacts, templates] = await Promise.all([
        this.contactService.getContacts(),
        this.templateService.getTemplates(),
      ]);
      this.contacts = contacts;
      this.templates = templates;
    } catch (err) {
      this.snackBar.open('Erreur de chargement des données', 'Fermer', { duration: 3000 });
    } finally {
      this.loading = false;
    }
  }

  // ========== GESTION DES TEMPLATES ==========

  async onTemplateSelected() {
    const templateId = this.projectForm.get('template_id')?.value;
    if (templateId) {
      try {
        this.loading = true;
        const templateSteps = await this.stepService.getStepsByTemplate(templateId);
        
        // Convertir les TemplateStep en ProjectStep
        this.projectSteps = templateSteps.map((templateStep: TemplateStep, index: number): ProjectStep => ({
          id: `temp_${index}`, // ID temporaire
          project_id: '', // Sera rempli lors de la création du projet
          name: templateStep.name,
          description: templateStep.description || '',
          position: templateStep.position,
          due_date: undefined, // Sera assigné via la planification
          completed: false,
          created_at: new Date(), // Valeur temporaire
        }));

        // Réinitialiser la planification
        this.planningMap = {};
        this.selectedStepIndex = null;
        this.generateWeekDays();

      } catch (error) {
        this.snackBar.open('Impossible de charger les étapes du modèle', 'Fermer', { duration: 3000 });
        this.projectSteps = [];
      } finally {
        this.loading = false;
      }
    } else {
      this.projectSteps = [];
      this.planningMap = {};
      this.selectedStepIndex = null;
      this.generateWeekDays();
    }
  }

  // ========== GESTION DE LA SEMAINE ==========

  initializeCurrentWeek() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Dimanche = 0, donc -6 pour aller au lundi
    
    this.currentWeekStart = new Date(today);
    this.currentWeekStart.setDate(today.getDate() + mondayOffset);
    this.generateWeekDays();
  }

  generateWeekDays() {
    this.weekDays = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const date = new Date(this.currentWeekStart);
      date.setDate(this.currentWeekStart.getDate() + i);
      
      const dateString = this.formatDateString(date);
      const tasks = this.planningMap[dateString] || [];

      this.weekDays.push({
        date: date,
        dayName: this.getDayName(date),
        dayNumber: this.formatDayNumber(date),
        isToday: date.getTime() === today.getTime(),
        tasks: tasks
      });
    }
  }

  navigateWeek(direction: 'prev' | 'next') {
    const offset = direction === 'next' ? 7 : -7;
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() + offset);
    this.generateWeekDays();
  }

  // ========== GESTION DE LA PLANIFICATION ==========

  selectStep(stepIndex: number) {
    if (this.selectedStepIndex === stepIndex) {
      this.selectedStepIndex = null; // Désélectionner si déjà sélectionné
    } else {
      this.selectedStepIndex = stepIndex;
    }
  }

  assignStepToDay(dayIndex: number) {
    if (this.selectedStepIndex === null) {
      this.snackBar.open('Veuillez d\'abord sélectionner une étape', 'Fermer', { duration: 2000 });
      return;
    }

    const selectedStep = this.projectSteps[this.selectedStepIndex];
    const selectedDay = this.weekDays[dayIndex];
    const dateString = this.formatDateString(selectedDay.date);

    // Retirer l'étape de son ancienne date si elle était déjà planifiée
    if (selectedStep.due_date) {
      const oldDateString = this.formatDateString(new Date(selectedStep.due_date));
      if (this.planningMap[oldDateString]) {
        this.planningMap[oldDateString] = this.planningMap[oldDateString].filter(
          step => step.id !== selectedStep.id
        );
      }
    }

    selectedStep.due_date = new Date(selectedDay.date);
    
    if (!this.planningMap[dateString]) {
      this.planningMap[dateString] = [];
    }
    
    // Éviter les doublons
    const existingIndex = this.planningMap[dateString].findIndex(step => step.id === selectedStep.id);
    if (existingIndex === -1) {
      this.planningMap[dateString].push(selectedStep);
    }

    // Regénérer les jours pour mettre à jour l'affichage
    this.generateWeekDays();
    
    // Désélectionner l'étape après attribution
    this.selectedStepIndex = null;
    
    this.snackBar.open(`Étape "${selectedStep.name}" assignée au ${this.formatDayNumber(selectedDay.date)}`, 'Fermer', { duration: 2000 });
  }

  // ========== VALIDATION ET SOUMISSION ==========

  canSubmit(): boolean {
    if (this.projectForm.invalid || this.loading) {
      return false;
    }

    // Vérifier que toutes les étapes sont planifiées
    return this.projectSteps.every(step => step.due_date);
  }

  getUnscheduledStepsCount(): number {
    return this.projectSteps.filter(step => !step.due_date).length;
  }

  async onSubmit() {
    if (!this.canSubmit()) {
      const unscheduled = this.getUnscheduledStepsCount();
      if (unscheduled > 0) {
        this.snackBar.open(`${unscheduled} étape(s) non planifiée(s)`, 'Fermer', { duration: 3000 });
      }
      return;
    }

    const { name, description, contact_id, template_id } = this.projectForm.getRawValue();

    try {
      this.loading = true;

      // Créer le projet
      const project = await this.projectService.createProject({ 
        name, 
        description, 
        contact_id 
      });
      
      if (!project?.id) throw new Error('Projet non créé');

      // Créer les étapes avec les dates planifiées
      for (const step of this.projectSteps) {
  await this.projectService.createProjectStep(project.id, {
    name: step.name,
    description: step.description,
    due_date: step.due_date ? step.due_date.toISOString().split('T')[0] : undefined,
    position: step.position,
    completed: false,
  });
}


      this.snackBar.open('Projet créé avec succès', 'Fermer', { duration: 3000 });
      this.router.navigate(['/project', project.id]);
      
    } catch (err) {
      console.error(err);
      this.snackBar.open('Erreur lors de la création du projet', 'Fermer', { duration: 3000 });
    } finally {
      this.loading = false;
    }
  }

  onCancel() {
    this.router.navigate(['/projects']);
  }

  // ========== UTILITAIRES ==========

  private formatDateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private getDayName(date: Date): string {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return days[date.getDay()];
  }

  private formatDayNumber(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month}`;
  }

  isStepScheduled(step: ProjectStep): boolean {
    return !!step.due_date;
  }

  getTasksCountForDay(dayIndex: number): number {
    return this.weekDays[dayIndex]?.tasks.length || 0;
  }

  getLoadIndicatorClass(dayIndex: number): string {
    const count = this.getTasksCountForDay(dayIndex);
    if (count === 0) return 'load-none';
    if (count <= 2) return 'load-light';
    if (count <= 4) return 'load-medium';
    return 'load-heavy';
  }
}