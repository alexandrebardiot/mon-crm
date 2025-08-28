import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ContactService } from '../../../services';
import { Contact } from '../../../services/types';

@Component({
  selector: 'app-contact-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './contact-detail.component.html',
  styleUrls: ['./contact-detail.component.scss']
})
export class ContactDetailComponent implements OnInit {
  contact: Contact | null = null;
  loading = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private contactService: ContactService
  ) {}

  ngOnInit(): void {
    this.loadContact();
  }

  async loadContact(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage = 'ID du contact manquant.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    try {
      const result = await this.contactService.getContactById(id);
      this.contact = result ?? null;
    } catch (error) {
      console.error('Erreur lors du chargement du contact', error);
      this.errorMessage = 'Impossible de charger le contact.';
    } finally {
      this.loading = false;
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  editContact(): void {
    if (this.contact) {
      this.router.navigate(['/edit-contact', this.contact.id]);
    }
  }

  async deleteContact(): Promise<void> {
    if (!this.contact) return;
    const confirmed = confirm(`Supprimer le contact "${this.contact.contact_name}" ?`);
    if (confirmed) {
      try {
        await this.contactService.deleteContact(this.contact.id);
        this.router.navigate(['/dashboard']);
      } catch (error) {
        console.error('Erreur lors de la suppression', error);
        this.errorMessage = 'Impossible de supprimer le contact.';
      }
    }
  }

  getCompanyName(): string {
    return this.contact?.companies?.name || 'Entreprise non renseignée';
  }
}
