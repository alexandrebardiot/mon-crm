import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, timer, combineLatest, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { ProjectStepService } from './project-step.service';
import { ProjectStep, NotificationData } from './types';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(
    private snackBar: MatSnackBar,
    private projectStepService: ProjectStepService
  ) {}

  showNotification(data: NotificationData): void {
    const config = {
      duration: data.duration || 5000,
      panelClass: [`snackbar-${data.type}`]
    };

    this.snackBar.open(data.message, 'Fermer', config);
  }

  showDailyReminders(): void {
    combineLatest([
      of(this.projectStepService.getOverdueTasks()),
      of(this.projectStepService.getTasksWithReminders())
    ]).subscribe({
      next: ([overdueTasks, reminderTasks]: [ProjectStep[], ProjectStep[]]) => {
        if (overdueTasks.length > 0) {
          const message = overdueTasks.length === 1 
            ? `1 tâche en retard : ${overdueTasks[0].name}`
            : `${overdueTasks.length} tâches en retard`;
          
          this.showNotification({
            message,
            type: 'warning',
            duration: 8000
          });
        }

        if (reminderTasks.length > 0) {
          const message = reminderTasks.length === 1
            ? `Rappel : ${reminderTasks[0].name}`
            : `${reminderTasks.length} rappels aujourd'hui`;
          
          this.showNotification({
            message,
            type: 'info',
            duration: 6000
          });
        }
      },
      error: (error: any) => {
        console.error('Erreur lors de la récupération des tâches :', error);
      }
    });
  }

  startReminderWatch(): void {
    timer(0, 15 * 60 * 1000)
      .pipe(
        switchMap(() => of(this.projectStepService.getTasksWithReminders()))
      )
      .subscribe({
        next: (reminderTasks: ProjectStep[]) => {
          reminderTasks.forEach((task: ProjectStep) => {
            if (this.shouldShowReminder(task)) {
              this.showTaskReminder(task);
            }
          });
        },
        error: (error: any) => {
          console.error('Erreur dans startReminderWatch:', error);
        }
      });
  }

  private shouldShowReminder(task: ProjectStep): boolean {
    if (!task.reminder_date) return false;

    const now = new Date();
    const reminderTime = new Date(task.reminder_date);
    const diffMinutes = Math.abs(now.getTime() - reminderTime.getTime()) / (1000 * 60);

    return diffMinutes <= 15;
  }

  private showTaskReminder(task: ProjectStep): void {
    const action = this.snackBar.open(
      `Rappel : ${task.name}`,
      'Voir',
      {
        duration: 10000,
        panelClass: ['snackbar-info']
      }
    );

    action.onAction().subscribe(() => {
      console.log('Navigation vers la tâche:', task.id);
    });
  }

  showSuccessMessage(action: string, taskName?: string): void {
    let message = '';
    switch (action) {
      case 'created':
        message = taskName ? `Tâche "${taskName}" créée` : 'Tâche créée avec succès';
        break;
      case 'updated':
        message = taskName ? `Tâche "${taskName}" mise à jour` : 'Tâche mise à jour';
        break;
      case 'deleted':
        message = taskName ? `Tâche "${taskName}" supprimée` : 'Tâche supprimée';
        break;
      case 'completed':
        message = taskName ? `Tâche "${taskName}" terminée` : 'Tâche marquée comme terminée';
        break;
      case 'uncompleted':
        message = taskName ? `Tâche "${taskName}" réouverte` : 'Tâche marquée comme non terminée';
        break;
      default:
        message = 'Action effectuée avec succès';
    }

    this.showNotification({
      message,
      type: 'success',
      duration: 3000
    });
  }

  showError(message: string = 'Une erreur est survenue'): void {
    this.showNotification({
      message,
      type: 'error',
      duration: 5000
    });
  }

  getDashboardSummary(): Observable<{ overdue: number; today: number; upcoming: number }> {
    return this.projectStepService.steps$.pipe(
      map((steps: ProjectStep[]) => {
        const now = new Date();
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        const incompleteTasks = steps.filter(s => !s.completed && s.due_date);

        return {
          overdue: incompleteTasks.filter(s => s.due_date! < now).length,
          today: incompleteTasks.filter(s => s.due_date! >= now && s.due_date! <= today).length,
          upcoming: incompleteTasks.filter(s => s.due_date! > today && s.due_date! <= nextWeek).length
        };
      })
    );
  }
}