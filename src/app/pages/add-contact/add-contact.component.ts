import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

import { ContactService } from './../../services';

@Component({
  selector: 'app-add-contact',
  standalone: true,
  templateUrl: './add-contact.component.html',
  styleUrls: ['./add-contact.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatToolbarModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
})
export class AddContactComponent {
  company_name = '';
  contact_name = '';
  position = '';
  email = '';
  tel = '';
  notes = '';
  errorMessage = '';
  loading = false;

  constructor(
    private ContactService: ContactService,
    private router: Router
  ) {}

  async ajouter() {
    if (!this.contact_name || !this.email) {
      this.errorMessage = 'Nom du contact et email sont obligatoires.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    try {
      await this.ContactService.addContact({
        contact_name: this.contact_name,
        email: this.email,
        phone: this.tel,
        company_name: this.company_name,
        position: this.position,
        notes: this.notes,
      });
      this.router.navigate(['/']);
    } catch (error) {
      this.errorMessage = 'Erreur lors de l\'ajout du contact.';
      console.error(error);
    } finally {
      this.loading = false;
    }
  }
}