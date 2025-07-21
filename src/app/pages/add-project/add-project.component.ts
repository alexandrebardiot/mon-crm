import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ProjectService } from '../../services/project.service';
import { ContactService } from '../../services/contact.service';
import { TemplateService } from '../../services/template.service';
import { Contact, Template } from '../../services/types';

@Component({
  selector: 'app-add-project',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule
  ],
  templateUrl: './add-project.component.html',
  styleUrls: ['./add-project.component.scss']
})
export class AddProjectComponent implements OnInit {
  projectForm: FormGroup;
  contacts: Contact[] = [];
  templates: Template[] = [];
  loading = false;
  contactId: string | null = null;
  selectedContact: Contact | null = null;
  contactFieldDisabled = false; // POUR BLOQUER LE SELECT SI contactId EN URL

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService,
    private contactService: ContactService,
    private templateService: TemplateService,
    private snackBar: MatSnackBar
  ) {
    this.projectForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      contact_id: ['', Validators.required],
      template_id: [''],
      start_date: [new Date()],
      use_template: [false]
    });
  }

  ngOnInit() {
    this.contactId = this.route.snapshot.paramMap.get('contactId');
    this.loadInitialData();
  }

  async loadInitialData() {
    try {
      this.loading = true;

      const [contacts, templates] = await Promise.all([
        this.contactService.getContacts(),
        this.templateService.getTemplates()
      ]);

      this.contacts = contacts;
      this.templates = templates;

      if (this.contactId) {
        const contact = this.contacts.find(c => c.id === this.contactId);
        if (contact) {
          this.selectedContact = contact;
          this.projectForm.patchValue({
            contact_id: contact.id
          });
          this.contactFieldDisabled = true; // bloque le select contact
          this.projectForm.get('contact_id')?.disable();
        }
      }

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      this.snackBar.open('Erreur lors du chargement des données', 'Fermer', { duration: 3000 });
    } finally {
      this.loading = false;
    }
  }

  onContactChange() {
    if (this.contactFieldDisabled) return; // ne fait rien si le champ est désactivé

    const contactId = this.projectForm.get('contact_id')?.value;
    if (contactId) {
      const contact = this.contacts.find(c => c.id === contactId);
      if (contact) {
        this.selectedContact = contact;
      }
    } else {
      this.selectedContact = null;
    }
  }

  onUseTemplateChange() {
    const useTemplate = this.projectForm.get('use_template')?.value;
    if (useTemplate) {
      this.projectForm.get('template_id')?.setValidators([Validators.required]);
    } else {
      this.projectForm.get('template_id')?.clearValidators();
    }
    this.projectForm.get('template_id')?.updateValueAndValidity();
  }

  async onSubmit() {
    if (this.projectForm.valid) {
      try {
        this.loading = true;

        // Si le champ contact_id est désactivé, récupérer la valeur avec getRawValue()
        const formValue = this.projectForm.getRawValue();

        // Vérification contact existant
        const selectedContact = this.contacts.find(c => c.id === formValue.contact_id);
        if (!selectedContact) throw new Error('Contact non trouvé');

        // Création du projet
        const project = await this.projectService.createProject({
          name: formValue.name,
          description: formValue.description,
          contact_id: formValue.contact_id
        });

        if (project) {
          if (formValue.use_template && formValue.template_id) {
            await this.projectService.createProjectStepsFromTemplate(
              project.id,
              formValue.template_id,
              formValue.start_date
            );
          }

          this.snackBar.open('Projet créé avec succès', 'Fermer', { duration: 3000 });
          this.router.navigate(['/project', project.id]);
        }
      } catch (error) {
        console.error('Erreur lors de la création du projet:', error);
        this.snackBar.open('Erreur lors de la création du projet', 'Fermer', { duration: 3000 });
      } finally {
        this.loading = false;
      }
    } else {
      Object.keys(this.projectForm.controls).forEach(key => {
        this.projectForm.get(key)?.markAsTouched();
      });
    }
  }

  onCancel() {
    if (this.contactId) {
      this.router.navigate(['/contact', this.contactId]);
    } else {
      this.router.navigate(['/projects']);
    }
  }

  // Getters
  get name() { return this.projectForm.get('name'); }
  get description() { return this.projectForm.get('description'); }
  get contact_id() { return this.projectForm.get('contact_id'); }
  get template_id() { return this.projectForm.get('template_id'); }
  get start_date() { return this.projectForm.get('start_date'); }
  get use_template() { return this.projectForm.get('use_template'); }
}
