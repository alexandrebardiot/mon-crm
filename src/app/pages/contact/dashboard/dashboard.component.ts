import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ContactService } from '../../../services';
import { Contact } from '../../../services/types';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
})
export class DashboardComponent implements OnInit {
  contacts: Contact[] = [];
  loading = false;
  errorMessage = '';

  constructor(
    private contactService: ContactService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadContacts();
  }

  async loadContacts(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';

    try {
      this.contacts = await this.contactService.getContacts();
    } catch (error) {
      console.error('Erreur lors du chargement des contacts', error);
      this.errorMessage = 'Impossible de charger les contacts.';
    } finally {
      this.loading = false;
    }
  }

  /**
   * Récupère le nom de l'entreprise pour l'affichage
   */
 getCompanyName(contact: Contact): string {
  return contact.companies?.name || 'Entreprise non renseignée';
}


  /**
   * Génère le tooltip pour les informations du contact
   */
  getContactTooltip(contact: Contact): string {
    const info = [];
    
    if (contact.email) {
      info.push(`Email: ${contact.email}`);
    }
    
    if (contact.phone) {
      info.push(`Téléphone: ${contact.phone}`);
    }
    
    if (contact.position) {
      info.push(`Poste: ${contact.position}`);
    }
    
    if (contact.companies?.name) {
      info.push(`Entreprise: ${contact.companies.name}`);
    }
    
    if (contact.notes && contact.notes.trim() !== '') {
      info.push(`Notes: ${contact.notes}`);
    }

    return info.length > 0 ? info.join('\n') : 'Aucune information supplémentaire';
  }

  /**
   * Génère le tooltip pour les notes
   */
  getNotesTooltip(contact: Contact): string {
    if (!contact.notes || contact.notes.trim() === '') {
      return 'Aucune note - Cliquez pour ajouter';
    }
    return contact.notes;
  }

  /**
   * Ouvre l'édition des notes du contact
   */
  async editNote(contact: Contact): Promise<void> {
    // Ici vous pouvez implémenter un dialog pour éditer les notes
    // ou rediriger vers une page d'édition
    const newNote = prompt('Modifier la note:', contact.notes || '');
    
    if (newNote !== null) {
      try {
        await this.contactService.updateContactNotes(contact.id, newNote);
        // Recharger les contacts ou mettre à jour localement
        const updatedContact = this.contacts.find(c => c.id === contact.id);
        if (updatedContact) {
          updatedContact.notes = newNote;
        }
      } catch (error) {
        console.error('Erreur lors de la mise à jour de la note', error);
        this.errorMessage = 'Impossible de mettre à jour la note.';
      }
    }
  }

  /**
   * Supprime un contact avec confirmation
   */
  async deleteContact(contact: Contact): Promise<void> {
    const confirmed = confirm(`Êtes-vous sûr de vouloir supprimer le contact "${contact.contact_name}" ?`);
    
    if (confirmed) {
      try {
        await this.contactService.deleteContact(contact.id);
        // Supprimer le contact de la liste locale
        this.contacts = this.contacts.filter(c => c.id !== contact.id);
      } catch (error) {
        console.error('Erreur lors de la suppression du contact', error);
        this.errorMessage = 'Impossible de supprimer le contact.';
      }
    }
  }

  /**
   * Rafraîchit la liste des contacts
   */
  refreshContacts(): void {
    this.loadContacts();
  }
}