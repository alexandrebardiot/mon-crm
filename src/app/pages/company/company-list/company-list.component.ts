import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CompanyService } from '../../../services/company.service';
import { Company } from '../../../services/types';

@Component({
  selector: 'app-company-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './company-list.component.html',
  styleUrls: ['./company-list.component.scss']
})
export class CompanyListComponent implements OnInit {
  companies: Company[] = [];
  isLoading = true;
  errorMessage = '';
  deleteConfirmation: { show: boolean; company: Company | null } = { show: false, company: null };

  constructor(
    private companyService: CompanyService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.loadCompanies();
  }

  async loadCompanies() {
    try {
      this.isLoading = true;
      this.errorMessage = '';
      this.companies = await this.companyService.getCompanies();
    } catch (error: any) {
      this.errorMessage = error.message || 'Erreur lors du chargement des entreprises';
      console.error('Erreur chargement entreprises:', error);
    } finally {
      this.isLoading = false;
    }
  }

  navigateToCreate() {
    this.router.navigate(['/companies/create']);
  }

  navigateToDetails(companyId: string) {
    this.router.navigate(['/companies', companyId]);
  }

  navigateToEdit(companyId: string) {
    this.router.navigate(['/companies', companyId, 'edit']);
  }

  confirmDelete(company: Company) {
    this.deleteConfirmation = { show: true, company };
  }

  cancelDelete() {
    this.deleteConfirmation = { show: false, company: null };
  }

  async confirmDeleteAction() {
    if (this.deleteConfirmation.company) {
      try {
        await this.companyService.delete(this.deleteConfirmation.company.id);
        this.cancelDelete();
        await this.loadCompanies(); // Recharger la liste
      } catch (error: any) {
        this.errorMessage = error.message || 'Erreur lors de la suppression';
        console.error('Erreur suppression entreprise:', error);
        this.cancelDelete();
      }
    }
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Date invalide';
    }
  }

  getNatureBadgeClass(nature?: string): string {
    switch (nature) {
      case 'Client':
        return 'badge-success';
      case 'Prospect':
        return 'badge-warning';
      case 'Prescripteur':
        return 'badge-info';
      default:
        return 'badge-secondary';
    }
  }

  formatChiffreAffaires(ca?: string): string {
    if (!ca) return '-';
    // Si c'est déjà formaté avec des espaces ou des devises
    if (ca.includes(' ') || ca.includes('€') || ca.includes('$')) {
      return ca;
    }
    // Sinon, essayer de formater comme un nombre
    const number = parseFloat(ca);
    if (!isNaN(number)) {
      return number.toLocaleString('fr-FR') + ' €';
    }
    return ca;
  }

  formatNbSalaries(nb?: number): string {
    if (nb === null || nb === undefined) return '-';
    return nb.toString();
  }

  formatCreditSafeNote(note?: number): string {
    if (note === null || note === undefined) return '-';
    return `${note}/100`;
  }

  getCreditSafeClass(note?: number): string {
    if (note === null || note === undefined) return '';
    if (note >= 80) return 'credit-excellent';
    if (note >= 60) return 'credit-good';
    if (note >= 40) return 'credit-average';
    return 'credit-poor';
  }
}