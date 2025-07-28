import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Angular Material imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Services et types
import { ProjectStepService } from '../../services/project-step.service';
import { NotificationService } from '../../services/notification.service';
import { ProjectStep, TaskGroup } from '../../services/types';

@Component({
  selector: 'app-planning',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatBadgeModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './planning.component.html',
  styleUrls: ['./planning.component.scss']
})
export class PlanningComponent implements OnInit, OnDestroy {
  // Propriétés principales
  taskGroups: TaskGroup[] = [];
  summary: { overdue: number; today: number; upcoming: number } | null = null;
  loading = true;
  selectedTask: ProjectStep | null = null;

  // Subject pour la gestion des subscriptions
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly projectStepService: ProjectStepService,
    private readonly notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.initializeComponent();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialise le composant en chargeant les données
   */
  private initializeComponent(): void {
    this.loadTasks();
    this.setupSummary();
  }

  /**
   * Charge toutes les tâches de l'utilisateur
   */
  loadTasks(): void {
    this.loading = true;

    this.projectStepService.getAllUserSteps()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tasks: ProjectStep[]) => {
          this.groupTasks(tasks);
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des tâches:', error);
          this.notificationService.showError('Impossible de charger les tâches');
          this.loading = false;
        }
      });
  }

  /**
   * Configure le résumé des tâches pour le dashboard
   */
  private setupSummary(): void {
    this.notificationService.getDashboardSummary()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (summary) => {
          this.summary = summary;
        },
        error: (error) => {
          console.error('Erreur lors du chargement du résumé:', error);
        }
      });
  }

  /**
   * Actualise les tâches
   */
  refreshTasks(): void {
    this.loadTasks();
    this.setupSummary();
  }

  /**
   * Groupe les tâches par catégories temporelles
   */
  groupTasks(tasks: ProjectStep[]): void {
    const now = new Date();
    const today = this.getEndOfDay(new Date());
    const tomorrow = this.getEndOfDay(this.addDays(new Date(), 1));
    const endOfWeek = this.getEndOfWeek(new Date());

    this.taskGroups = [
      {
        label: 'En retard',
        color: '#f44336',
        tasks: this.filterAndSortTasks(tasks, task => 
          task.completed === false && 
          task.due_date !== null && 
          task.due_date !== undefined &&
          task.due_date < now
        )
      },
      {
        label: "Aujourd'hui",
        color: '#ff9800',
        tasks: this.filterAndSortTasks(tasks, task => 
          task.completed === false && 
          task.due_date !== null && 
          task.due_date !== undefined &&
          task.due_date >= now && 
          task.due_date <= today
        )
      },
      {
        label: 'Demain',
        color: '#2196f3',
        tasks: this.filterAndSortTasks(tasks, task => 
          task.completed === false && 
          task.due_date !== null && 
          task.due_date !== undefined &&
          task.due_date > today && 
          task.due_date <= tomorrow
        )
      },
      {
        label: 'Cette semaine',
        color: '#4caf50',
        tasks: this.filterAndSortTasks(tasks, task => 
          task.completed === false && 
          task.due_date !== null && 
          task.due_date !== undefined &&
          task.due_date > tomorrow && 
          task.due_date <= endOfWeek
        )
      },
      {
        label: 'Plus tard',
        color: '#9c27b0',
        tasks: this.filterAndSortTasks(tasks, task => 
          task.completed === false && 
          task.due_date !== null && 
          task.due_date !== undefined &&
          task.due_date > endOfWeek
        )
      },
      {
        label: 'Sans date',
        color: '#607d8b',
        tasks: tasks
          .filter(task => task.completed === false && (!task.due_date))
          .sort((a, b) => a.position - b.position)
      },
      {
        label: 'Terminées',
        color: '#4caf50',
        tasks: tasks
          .filter(task => task.completed === true)
          .sort((a, b) => this.compareDates(b.due_date, a.due_date))
      }
    ];
  }

  /**
   * Filtre et trie les tâches selon un prédicat
   */
  private filterAndSortTasks(tasks: ProjectStep[], predicate: (task: ProjectStep) => boolean): ProjectStep[] {
    return tasks
      .filter(predicate)
      .sort((a, b) => this.compareDates(a.due_date, b.due_date));
  }

  /**
   * Compare deux dates en gérant les valeurs nulles/undefined
   */
  private compareDates(dateA: Date | null | undefined, dateB: Date | null | undefined): number {
    const timeA = dateA?.getTime() || 0;
    const timeB = dateB?.getTime() || 0;
    return timeA - timeB;
  }

  /**
   * Retourne la fin de journée pour une date donnée
   */
  private getEndOfDay(date: Date): Date {
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay;
  }

  /**
   * Ajoute un nombre de jours à une date
   */
  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Retourne la fin de semaine pour une date donnée
   */
  private getEndOfWeek(date: Date): Date {
    const endOfWeek = new Date(date);
    const daysToAdd = 7 - date.getDay();
    endOfWeek.setDate(endOfWeek.getDate() + daysToAdd);
    return this.getEndOfDay(endOfWeek);
  }

  /**
   * Basculer le statut de completion d'une tâche
   */
  onToggleComplete(task: ProjectStep): void {
    const newStatus = !task.completed;

    this.projectStepService.toggleTaskCompletion(task.id, newStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          const action = newStatus ? 'completed' : 'uncompleted';
          this.notificationService.showSuccessMessage(action, task.name);
          this.refreshTasks();
        },
        error: (error) => {
          console.error('Erreur lors de la mise à jour de la tâche:', error);
          this.notificationService.showError('Impossible de mettre à jour la tâche');
        }
      });
  }

  /**
   * Éditer une tâche
   */
  onEditTask(task: ProjectStep): void {
    console.log('Éditer la tâche:', task);
    // TODO: Implémenter l'ouverture du modal d'édition
    // this.dialog.open(TaskEditDialogComponent, {
    //   data: task,
    //   width: '600px'
    // });
  }

  /**
   * Supprimer une tâche avec confirmation
   */
  onDeleteTask(task: ProjectStep): void {
    const confirmMessage = `Êtes-vous sûr de vouloir supprimer la tâche "${task.name}" ?`;
    
    if (confirm(confirmMessage)) {
      this.projectStepService.deleteProjectStep(task.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notificationService.showSuccessMessage('deleted', task.name);
            this.refreshTasks();
          },
          error: (error) => {
            console.error('Erreur lors de la suppression:', error);
            this.notificationService.showError('Impossible de supprimer la tâche');
          }
        });
    }
  }

  /**
   * Sélectionner/désélectionner une tâche
   */
  onSelectTask(task: ProjectStep): void {
    this.selectedTask = this.selectedTask?.id === task.id ? null : task;
  }

  /**
   * Définir un rappel pour une tâche
   */
  onSetReminder(task: ProjectStep): void {
    console.log('Définir rappel pour:', task);
    // TODO: Implémenter l'ouverture du modal de rappel
    // this.dialog.open(ReminderDialogComponent, {
    //   data: task,
    //   width: '400px'
    // });
  }

  /**
   * Assigner une date à une tâche
   */
  onAssignDate(task: ProjectStep): void {
    console.log('Planifier la tâche:', task);
    // TODO: Implémenter l'ouverture du modal de planification
    // this.dialog.open(DateAssignDialogComponent, {
    //   data: task,
    //   width: '400px'
    // });
  }

  /**
   * Fonction de tracking pour ngFor
   */
  trackByTaskId(index: number, task: ProjectStep): string {
    return task.id;
  }

  /**
   * Retourne le texte d'état vide pour un groupe
   */
  getEmptyStateText(groupLabel: string): string {
    const messages: Record<string, string> = {
      'En retard': 'en retard',
      "Aujourd'hui": "pour aujourd'hui",
      'Demain': 'pour demain',
      'Cette semaine': 'pour cette semaine',
      'Plus tard': 'planifiée plus tard',
      'Sans date': 'sans date',
      'Terminées': 'terminée'
    };

    return messages[groupLabel] || 'dans cette catégorie';
  }
}