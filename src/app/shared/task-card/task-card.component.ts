import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProjectStep } from '../../services/types'; 
import { MatDividerModule } from '@angular/material/divider';
@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [
    CommonModule,
    MatDividerModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatChipsModule,
    MatMenuModule,
    MatTooltipModule
  ],
  templateUrl: './task-card.component.html',
  styleUrls: ['./task-card.component.scss']
})
export class TaskCardComponent {
  @Input() task!: ProjectStep;
  @Input() isSelected = false;

  @Output() toggleComplete = new EventEmitter<void>();
  @Output() edit = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
  @Output() select = new EventEmitter<void>();
  @Output() setReminder = new EventEmitter<void>();
  @Output() assignDate = new EventEmitter<void>();

  get isOverdue(): boolean {
    if (this.task.completed || !this.task.due_date) return false;
    return this.task.due_date < new Date();
  }

  onToggleComplete(): void {
    this.toggleComplete.emit();
  }

  onEdit(): void {
    this.edit.emit();
  }

  onDelete(): void {
    this.delete.emit();
  }

  onSelect(): void {
    this.select.emit();
  }

  onSetReminder(): void {
    this.setReminder.emit();
  }

  onAssignDate(): void {
    this.assignDate.emit();
  }

  getDateChipColor(): 'primary' | 'accent' | 'warn' {
    if (this.task.completed) return 'primary';
    if (this.isOverdue) return 'warn';
    
    if (this.task.due_date) {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (this.task.due_date <= tomorrow) {
        return 'accent';
      }
    }
    
    return 'primary';
  }

  formatDate(date: Date): string {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);

    if (compareDate.getTime() === today.getTime()) {
      return "Aujourd'hui";
    } else if (compareDate.getTime() === tomorrow.getTime()) {
      return 'Demain';
    } else if (compareDate.getTime() === yesterday.getTime()) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short'
      });
    }
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
