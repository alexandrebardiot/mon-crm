import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';

// Services & DTO
import { ContactService } from '../../../services/contact.service';
import { CreateContactDto } from '../../../services/types';

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-edit-contact',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './edit-contact.component.html',
  styleUrls: ['./edit-contact.component.scss'],
})
export class EditContactComponent implements OnInit {
  contactForm!: FormGroup;
  loading = false;
  contactId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private contactService: ContactService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Initialisation du formulaire
    this.contactForm = this.fb.group({
      contact_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      position: [''],
      notes: [''],
      company_id: [''],
    });

    // Récupération de l'ID depuis l'URL
    this.contactId = this.route.snapshot.paramMap.get('id');
    if (this.contactId) {
      this.loadContact(this.contactId);
    }
  }

  async loadContact(id: string) {
    this.loading = true;
    try {
      const contact = await this.contactService.getContactById(id);
      if (contact) {
        this.contactForm.patchValue(contact);
      }
    } catch (err) {
      console.error('Erreur lors du chargement du contact', err);
    } finally {
      this.loading = false;
    }
  }

  async onSubmit() {
    if (this.contactForm.invalid) return;

    this.loading = true;
    try {
      const formValue = this.contactForm.value;

      // Nettoyage pour correspondre au DTO
      const contactData: CreateContactDto = {
        contact_name: formValue.contact_name ?? '',
        email: formValue.email ?? '',
        phone: formValue.phone || undefined,
        position: formValue.position || undefined,
        notes: formValue.notes || undefined,
      };

      if (this.contactId) {
        await this.contactService.updateContact(this.contactId, contactData);
      } else {
        await this.contactService.addContact(contactData);
      }

      // Redirection après succès
      this.router.navigate(['/dashboard']);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde du contact', err);
    } finally {
      this.loading = false;
    }
  }
}
