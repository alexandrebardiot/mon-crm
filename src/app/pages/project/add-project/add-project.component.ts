// add-project.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

// Angular Material Modules
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

// Services
import { ProjectService } from '../../../services/project.service';
import { ContactService } from '../../../services/contact.service';
import { TemplateService } from '../../../services/template.service';
import { StepService } from '../../../services/step.service';

// Types
import { Contact, Company, Template, ProjectStep } from '../../../services/types';

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
  filteredContacts: Contact[] = [];
  companies: Company[] = [];
  templates: Template[] = [];
  projectSteps: ProjectStep[] = [];

  loading = false;
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
      company_id: ['', Validators.required],
      typology: [''],
      expected_revenue: [null],
      expectations: [''],
      start_date: [null],
      end_date: [null],
      status: [''],
      feeling: [''],
      template_id: ['', Validators.required],
    });

    this.initializeCurrentWeek();
  }

  ngOnInit(): void {
    this.loadData();

    this.projectForm.get('company_id')?.valueChanges.subscribe(companyId => {
      this.filteredContacts = this.contacts.filter(c => c.company_id === companyId);
      const selectedContact = this.projectForm.get('contact_id')?.value;
      if (!this.filteredContacts.find(c => c.id === selectedContact)) {
        this.projectForm.get('contact_id')?.setValue(null);
      }
    });

    this.projectForm.get('template_id')?.valueChanges.subscribe(() => this.onTemplateSelected());
  }

  async loadData(): Promise<void> {
    this.loading = true;
    try {
      const [contacts, companies, templates] = await Promise.all([
        this.contactService.getContacts(),
        this.contactService.getCompanies(),
        this.templateService.getTemplates(),
      ]);
      this.contacts = contacts;
      this.companies = companies;
      this.templates = templates;

      const currentCompanyId = this.projectForm.get('company_id')?.value;
      if (currentCompanyId) {
        this.filteredContacts = contacts.filter(c => c.company_id === currentCompanyId);
      }
    } catch (err) {
      this.snackBar.open('Erreur de chargement des données', 'Fermer', { duration: 3000 });
    } finally {
      this.loading = false;
    }
  }

  async onTemplateSelected(): Promise<void> {
    const templateId = this.projectForm.get('template_id')?.value;
    if (!templateId) {
      this.projectSteps = [];
      this.planningMap = {};
      this.selectedStepIndex = null;
      this.generateWeekDays();
      return;
    }

    try {
      this.loading = true;
      const templateSteps = await this.stepService.getStepsByTemplate(templateId);
      this.projectSteps = templateSteps.map((step: TemplateStep, index): ProjectStep => ({
        id: `temp_${index}`,
        project_id: '',
        name: step.name,
        description: step.description || '',
        position: step.position,
        due_date: undefined,
        completed: false,
        created_at: new Date(),
      }));

      this.planningMap = {};
      this.selectedStepIndex = null;
      this.generateWeekDays();
    } catch (error) {
      this.snackBar.open('Impossible de charger les étapes du modèle', 'Fermer', { duration: 3000 });
    } finally {
      this.loading = false;
    }
  }

  initializeCurrentWeek(): void {
    const today = new Date();
    const mondayOffset = today.getDay() === 0 ? -6 : 1 - today.getDay();
    this.currentWeekStart = new Date(today);
    this.currentWeekStart.setDate(today.getDate() + mondayOffset);
    this.generateWeekDays();
  }

  generateWeekDays(): void {
    this.weekDays = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const date = new Date(this.currentWeekStart);
      date.setDate(this.currentWeekStart.getDate() + i);

      const dateString = this.formatDateString(date);
      this.weekDays.push({
        date,
        dayName: this.getDayName(date),
        dayNumber: this.formatDayNumber(date),
        isToday: date.getTime() === today.getTime(),
        tasks: this.planningMap[dateString] || [],
      });
    }
  }

  navigateWeek(direction: 'prev' | 'next'): void {
    const offset = direction === 'next' ? 7 : -7;
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() + offset);
    this.generateWeekDays();
  }

  // Méthode appelée depuis le TaskScheduler quand on sélectionne une étape
  onSelectStep(step: ProjectStep): void {
    const index = this.projectSteps.findIndex(s => s.id === step.id);
    this.selectedStepIndex = this.selectedStepIndex === index ? null : index;
  }

  // Méthode appelée depuis le TaskScheduler pour assigner une étape
  onAssignStep(step: ProjectStep): void {
    // Ici, vous pouvez implémenter la logique d'assignation
    // Par exemple, ouvrir une modal de sélection de date
    // ou assigner automatiquement à une date
    this.snackBar.open(`Assignation de l'étape "${step.name}"`, 'Fermer', { duration: 2000 });
  }

  // Méthodes originales conservées pour la navigation manuelle
  selectStep(stepIndex: number): void {
    this.selectedStepIndex = this.selectedStepIndex === stepIndex ? null : stepIndex;
  }

  assignStepToDay(dayIndex: number): void {
    if (this.selectedStepIndex === null) {
      this.snackBar.open("Veuillez d'abord sélectionner une étape", 'Fermer', { duration: 2000 });
      return;
    }

    const step = this.projectSteps[this.selectedStepIndex];
    const day = this.weekDays[dayIndex];
    const dateString = this.formatDateString(day.date);

    // Retirer étape de son ancienne date si assignée
    if (step.due_date) {
      const oldDate = this.formatDateString(new Date(step.due_date));
      this.planningMap[oldDate] = (this.planningMap[oldDate] || []).filter(s => s.id !== step.id);
    }

    step.due_date = new Date(day.date);
    this.planningMap[dateString] = this.planningMap[dateString] || [];

    if (!this.planningMap[dateString].some(s => s.id === step.id)) {
      this.planningMap[dateString].push(step);
    }

    this.generateWeekDays();
    this.selectedStepIndex = null;

    this.snackBar.open(`Étape "${step.name}" assignée au ${this.formatDayNumber(day.date)}`, 'Fermer', { duration: 2000 });
  }

  canSubmit(): boolean {
    return !this.loading && this.projectForm.valid && this.projectSteps.every(s => s.due_date);
  }

  getUnscheduledStepsCount(): number {
    return this.projectSteps.filter(step => !step.due_date).length;
  }

  async onSubmit(): Promise<void> {
    if (!this.canSubmit()) {
      const unscheduled = this.getUnscheduledStepsCount();
      if (unscheduled > 0) {
        this.snackBar.open(`${unscheduled} étape(s) non planifiée(s)`, 'Fermer', { duration: 3000 });
      }
      return;
    }

    const {
      name, description, contact_id, company_id,
      typology, expected_revenue, expectations,
      start_date, end_date, status, feeling
    } = this.projectForm.getRawValue();

    try {
      this.loading = true;

      const project = await this.projectService.createProject({
        name,
        description,
        contact_id,
        typology,
        expected_revenue,
        expectations,
        start_date: start_date ? this.formatDateString(start_date) : undefined,
        end_date: end_date ? this.formatDateString(end_date) : undefined,
        status,
        feeling
      });

      if (!project?.id) throw new Error('Échec de la création du projet');

      for (const step of this.projectSteps) {
        await this.projectService.createProjectStep(project.id, {
          name: step.name,
          description: step.description,
          due_date: step.due_date ? this.formatDateString(step.due_date) : undefined,
          position: step.position,
          completed: false
        });
      }

      this.snackBar.open('Projet créé avec succès', 'Fermer', { duration: 3000 });
      this.router.navigate(['/project', project.id]);

    } catch (error) {
      console.error(error);
      this.snackBar.open('Erreur lors de la création du projet', 'Fermer', { duration: 3000 });
    } finally {
      this.loading = false;
    }
  }

  onCancel(): void {
    this.router.navigate(['/projects']);
  }

  private formatDateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private getDayName(date: Date): string {
    return ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][date.getDay()];
  }

  // Méthodes rendues publiques pour le template
  public formatDayNumber(date: Date): string {
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  }

  // Méthode publique pour calculer la date de fin de semaine
  public getWeekEndDate(): Date {
    return new Date(this.currentWeekStart.getTime() + 6 * 86400000);
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

  isStepScheduled(step: ProjectStep): boolean {
    return !!step.due_date;
  }
}