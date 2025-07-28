import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { ProjectStep, WeekDay } from '../../services/types';

@Component({
  selector: 'app-task-scheduler',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './task-scheduler.component.html',
  styleUrls: ['./task-scheduler.component.scss'],
})
export class TaskSchedulerComponent implements OnInit, OnChanges {
  @Input() steps: ProjectStep[] = [];

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
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7)); // lundi
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
}
