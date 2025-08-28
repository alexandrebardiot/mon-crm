import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CompanyService } from '../../../services/company.service';
import { ContactService } from '../../../services/contact.service';
import { CreateCompanyDto } from '../../../services/types';

@Component({
  selector: 'app-company-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './company-create.component.html',
  styleUrls: ['./company-create.component.scss']
})
export class CompanyCreateComponent implements OnInit {
  companyForm: FormGroup;
  contacts: any[] = [];
  isLoading = false;
  errorMessage = '';
  
  natureOptions = ['Prospect', 'Client', 'Prescripteur'];

  constructor(
    private fb: FormBuilder,
    private companyService: CompanyService,
    private contactService: ContactService,
    private router: Router
  ) {
    this.companyForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      nature: [''],
      siret: [''],
      code_naf: [''],
      chiffre_affaires: [''],
      nb_salaries: [null, [Validators.min(0)]],
      creditsafe_note: [null, [Validators.min(0), Validators.max(100)]],
      code_postal: ['', [Validators.pattern(/^\d{5}$/)]],
      site_web: ['', [Validators.pattern(/^https?:\/\/.+/)]],
      contact_principal: ['']
    });
  }

  async ngOnInit() {
    await this.loadContacts();
  }

  async loadContacts() {
    try {
      this.contacts = await this.contactService.getContacts();
    } catch (error) {
      console.error('Erreur lors du chargement des contacts:', error);
    }
  }

  async onSubmit() {
    if (this.companyForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      try {
        const formData = this.companyForm.value;
        const createData: CreateCompanyDto = {
          ...formData,
          contact_principal: formData.contact_principal || undefined
        };

        await this.companyService.create(createData);
        this.router.navigate(['/companies']);
      } catch (error: any) {
        this.errorMessage = error.message || 'Une erreur est survenue lors de la création';
        console.error('Erreur création entreprise:', error);
      } finally {
        this.isLoading = false;
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.companyForm.controls).forEach(key => {
      this.companyForm.get(key)?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.companyForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.companyForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return 'Ce champ est requis';
      if (field.errors['minlength']) return `Minimum ${field.errors['minlength'].requiredLength} caractères`;
      if (field.errors['pattern']) {
        if (fieldName === 'code_postal') return 'Format de code postal invalide (5 chiffres)';
        if (fieldName === 'site_web') return 'URL invalide (doit commencer par http:// ou https://)';
      }
      if (field.errors['min']) return `Valeur minimum: ${field.errors['min'].min}`;
      if (field.errors['max']) return `Valeur maximum: ${field.errors['max'].max}`;
    }
    return '';
  }

  onCancel() {
    this.router.navigate(['/companies']);
  }
}