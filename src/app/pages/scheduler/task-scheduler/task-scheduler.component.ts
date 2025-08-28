import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ProjectStep } from '../../../services/types';

interface WeekDay {
  date: Date;
  dayName: string;
  dayNameShort: string;
  dayNumber: number;
  isToday: boolean;
  isWeekend: boolean;
  tasks: ProjectStep[];
}

@Component({
  selector: 'app-task-scheduler',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './task-scheduler.component.html',
  styleUrls: ['./task-scheduler.component.scss'],
})
export class TaskSchedulerComponent implements OnInit, OnChanges {
  @Input() steps: ProjectStep[] = [];
  @Input() selectedStepIndex: number | null = null;

  // Évènements pour interaction avec parent
  @Output() assignStep = new EventEmitter<ProjectStep>();
  @Output() selectStep = new EventEmitter<ProjectStep>();

  // WeekDays calculés et tâches non assignées
  weekDays: WeekDay[] = [];
  unassignedTasks: ProjectStep[] = [];
  
  today = new Date();

  ngOnInit(): void {
    this.initWeekDays();
    this.distributeSteps();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['steps']) {
      this.distributeSteps();
    }
  }

  private initWeekDays(): void {
    const monday = new Date();
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);

    const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'];

    this.weekDays = Array.from({ length: 5 }, (_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);

      return {
        date,
        dayName: dayNames[i],
        dayNameShort: dayNames[i],
        dayNumber: date.getDate(),
        isToday: date.toDateString() === this.today.toDateString(),
        isWeekend: false,
        tasks: [],
      };
    });
  }

  private distributeSteps(): void {
    this.weekDays.forEach(day => (day.tasks = []));
    this.unassignedTasks = [];

    this.steps.forEach(step => {
      if (step.due_date) {
        const dueDate = new Date(step.due_date);
        const matchedDay = this.weekDays.find(
          d => d.date.toDateString() === dueDate.toDateString()
        );
        if (matchedDay) {
          matchedDay.tasks.push(step);
        } else {
          this.unassignedTasks.push(step);
        }
      } else {
        this.unassignedTasks.push(step);
      }
    });
  }

  // Méthodes déclenchées côté template
  onAssignStep(step: ProjectStep, event: MouseEvent): void {
    event.stopPropagation();
    this.assignStep.emit(step);
  }

  onSelectStep(step: ProjectStep): void {
    this.selectStep.emit(step);
  }

  // Vérifier si une étape est sélectionnée
  isStepSelected(step: ProjectStep): boolean {
    if (this.selectedStepIndex === null) return false;
    return this.steps[this.selectedStepIndex]?.id === step.id;
  }
}