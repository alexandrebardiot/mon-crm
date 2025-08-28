import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CompanyService } from '../../../services/company.service';
import { ContactService } from '../../../services/contact.service';
import { Company, CreateCompanyDto } from '../../../services/types';

@Component({
  selector: 'app-company-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './company-edit.component.html',
  styleUrls: ['./company-edit.component.scss']
})
export class CompanyEditComponent implements OnInit {
  companyForm: FormGroup;
  contacts: any[] = [];
  company: Company | null = null;
  companyId: string = '';
  isLoading = false;
  isLoadingData = true;
  errorMessage = '';

  natureOptions = ['Prospect', 'Client', 'Prescripteur'];

  constructor(
    private fb: FormBuilder,
    private companyService: CompanyService,
    private contactService: ContactService,
    private router: Router,
    private route: ActivatedRoute
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
      site_web: ['', [Validators.pattern(/^https?:\/\/.+/)]]
      // contact_principal retiré ici
    });
  }

  async ngOnInit() {
    this.companyId = this.route.snapshot.paramMap.get('id') || '';
    if (this.companyId) {
      await Promise.all([
        this.loadCompany(),
        this.loadContacts()
      ]);
    } else {
      this.router.navigate(['/companies']);
    }
  }

  async loadCompany() {
    try {
      this.company = await this.companyService.getCompanyById(this.companyId);
      if (this.company) {
        this.populateForm();
      } else {
        this.errorMessage = 'Entreprise non trouvée';
        this.router.navigate(['/companies']);
      }
    } catch (error: any) {
      this.errorMessage = error.message || 'Erreur lors du chargement de l\'entreprise';
      console.error('Erreur chargement entreprise:', error);
    } finally {
      this.isLoadingData = false;
    }
  }

  async loadContacts() {
    try {
      // Récupérer uniquement les contacts liés à cette société
      this.contacts = await this.contactService.getContactsByCompany(this.companyId);
    } catch (error) {
      console.error('Erreur lors du chargement des contacts:', error);
    }
  }

  private populateForm() {
    if (this.company) {
      this.companyForm.patchValue({
        name: this.company.name,
        nature: this.company.nature || '',
        siret: this.company.siret || '',
        code_naf: this.company.code_naf || '',
        chiffre_affaires: this.company.chiffre_affaires || '',
        nb_salaries: this.company.nb_salaries || null,
        creditsafe_note: this.company.creditsafe_note || null,
        code_postal: this.company.code_postal || '',
        site_web: this.company.site_web || ''
        // contact_principal retiré ici
      });
    }
  }

  async onSubmit() {
    if (this.companyForm.valid && this.companyId) {
      this.isLoading = true;
      this.errorMessage = '';

      try {
        const formData = this.companyForm.value;
        const updateData: Partial<CreateCompanyDto> = {
          ...formData
          // plus de contact_principal dans le DTO
        };

        await this.companyService.update(this.companyId, updateData);
        this.router.navigate(['/companies', this.companyId]);
      } catch (error: any) {
        this.errorMessage = error.message || 'Une erreur est survenue lors de la modification';
        console.error('Erreur modification entreprise:', error);
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
    this.router.navigate(['/companies', this.companyId]);
  }
}
