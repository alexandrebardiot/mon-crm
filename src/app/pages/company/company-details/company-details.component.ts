import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Company, Contact } from '../../../services/types';
import { CompanyService } from '../../../services/company.service';
import { ContactService } from '../../../services/contact.service';
import { DatePipe } from '@angular/common';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-company-details',
  standalone: true,
  imports: [DatePipe, CommonModule],
  templateUrl: './company-details.component.html',
})
export class CompanyDetailsComponent implements OnInit {
  company: Company | null = null;
  contacts: Contact[] = [];   // Liste complète des contacts liés à la société
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private companyService: CompanyService,
    private contactService: ContactService
  ) {}

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'ID entreprise non fourni.';
      this.loading = false;
      return;
    }

    try {
      this.company = await this.companyService.getCompanyById(id);

      if (this.company) {
        // Récupérer tous les contacts liés à cette société
        this.contacts = await this.contactService.getContactsByCompany(this.company.id);
      }
    } catch (e) {
      this.error = 'Erreur lors du chargement des données.';
      console.error(e);
    } finally {
      this.loading = false;
    }
  }

  goBack(): void {
    this.router.navigate(['/companies']);
  }

  edit(): void {
    this.router.navigate(['/companies', this.company?.id, 'edit']);
  }
}
