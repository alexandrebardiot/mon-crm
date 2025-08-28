import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';

import { ContactService, CompanyService } from '../../../services';
import { Company, Contact } from '../../../services/types';

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
    MatSelectModule,
  ],
})
export class AddContactComponent implements OnInit {
  contact_name = '';
  position = '';
  email = '';
  tel = '';
  notes = '';
  errorMessage = '';
  loading = false;

  companies: Company[] = [];
  selectedCompanyId: string | null = null;
  creatingNewCompany = false;
  newCompanyName = '';

  constructor(
    private ContactService: ContactService,
    private CompanyService: CompanyService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCompanies();
  }

  async loadCompanies() {
    try {
      this.companies = await this.CompanyService.getCompanies();
    } catch (error) {
      console.error('Erreur lors du chargement des entreprises', error);
      this.errorMessage = "Impossible de charger les entreprises.";
    }
  }

  onCompanySelectionChange(value: string | null) {
    if (value === 'create_new') {
      this.creatingNewCompany = true;
      this.selectedCompanyId = null;
      this.newCompanyName = '';
    } else {
      this.creatingNewCompany = false;
      this.selectedCompanyId = value;
      this.newCompanyName = '';
    }
  }

  async ajouter() {
    if (!this.contact_name || !this.email) {
      this.errorMessage = 'Nom du contact et email sont obligatoires.';
      return;
    }

    if (this.creatingNewCompany && !this.newCompanyName.trim()) {
      this.errorMessage = 'Le nom de la nouvelle entreprise est obligatoire.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    try {
      let companyId: string | undefined = this.selectedCompanyId || undefined;

      // Créer une nouvelle entreprise si nécessaire
      if (this.creatingNewCompany && this.newCompanyName.trim()) {
        const newCompanyData = {
          name: this.newCompanyName.trim()
        };
        
        const newCompany: Company = await this.CompanyService.create(newCompanyData);
        companyId = newCompany.id;
        
        // Ajouter la nouvelle entreprise à la liste locale
        this.companies.push(newCompany);
      }

      // Créer le contact avec les données adaptées aux interfaces
      const contactData = {
        contact_name: this.contact_name,
        email: this.email,
        phone: this.tel || undefined,
        position: this.position || undefined,
        notes: this.notes || undefined,
        company_id: companyId,
      };

      await this.ContactService.addContact(contactData);

      // Rediriger vers la page principale
      this.router.navigate(['/']);
    } catch (error) {
      this.errorMessage = 'Erreur lors de l\'ajout du contact.';
      console.error(error);
    } finally {
      this.loading = false;
    }
  }

  // Méthode pour annuler la création d'une nouvelle entreprise
  cancelNewCompany() {
    this.creatingNewCompany = false;
    this.newCompanyName = '';
    this.selectedCompanyId = null;
  }
}