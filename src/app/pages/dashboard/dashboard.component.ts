import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { SupabaseService } from '../../services/supabase.service';
import { EditNoteDialogComponent } from '../edit-note-dialog/edit-note-dialog.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatToolbarModule,
    MatTooltipModule,
    MatDialogModule,
    MatIconModule,
    MatListModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    EditNoteDialogComponent
  ],
})
export class DashboardComponent implements OnInit {
  contacts: any[] = [];
  loading = false;
  errorMessage = '';

  constructor(
    private supabaseService: SupabaseService,
    private dialog: MatDialog
  ) {}

  async ngOnInit() {
    this.loading = true;
    this.errorMessage = '';

    try {
      this.contacts = await this.supabaseService.getContacts();
    } catch (error) {
      this.errorMessage = 'Erreur lors du chargement des contacts.';
      console.error(error);
    } finally {
      this.loading = false;
    }
  }

  async editNote(contact: any) {
    const dialogRef = this.dialog.open(EditNoteDialogComponent, {
      data: { notes: contact.notes || '' },
    });

    const result = await dialogRef.afterClosed().toPromise();
    if (result !== undefined) {
      try {
        await this.supabaseService.updateContact(contact.id, { notes: result });
        contact.notes = result;
      } catch (err) {
        console.error('Erreur mise à jour note', err);
      }
    }
  }

  getContactTooltip(contact: any): string {
    return `
📧 ${contact.email || '—'}
📞 ${contact.phone || '—'}
💼 ${contact.position || '—'}
    `.trim();
  }
}
