import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-edit-note-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Modifier la note</h2>
    <mat-dialog-content>
      <textarea [(ngModel)]="data.notes" rows="5" class="full-textarea"></textarea>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Annuler</button>
      <button mat-raised-button color="primary" (click)="dialogRef.close(data.notes)">
        Sauvegarder
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-textarea {
      width: 100%;
      min-width: 300px;
    }
  `]
})
export class EditNoteDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<EditNoteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { notes: string }
  ) {}
}
