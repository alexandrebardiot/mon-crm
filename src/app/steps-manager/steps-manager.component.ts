import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../services/supabase.service';

interface Step {
  id: string;
  label: string;
  position: number;
}

@Component({
  selector: 'app-steps-manager',
  standalone: true, // Ajout du standalone
  imports: [CommonModule, FormsModule], // Ajout des imports nécessaires
  templateUrl: './steps-manager.component.html',
  styleUrls: ['./steps-manager.component.scss']
})
export class StepsManagerComponent implements OnInit {
  steps: Step[] = [];
  newStepLabel: string = '';
  isLoading = false;
  error = '';

  constructor(private supabaseService: SupabaseService) {}

  ngOnInit() {
    this.loadSteps();
  }

  async loadSteps() {
    this.isLoading = true;
    this.error = '';
    try {
      this.steps = await this.supabaseService.getSteps();
    } catch (err: any) {
      this.error = err.message || 'Erreur lors du chargement des étapes';
      console.error(err);
    } finally {
      this.isLoading = false;
    }
  }

  // Modification pour accepter l'événement du formulaire
  async addStep(event?: Event) {
    if (event) {
      event.preventDefault(); // Empêche le rechargement de la page
    }

    if (!this.newStepLabel.trim()) {
      this.error = "Le nom de l'étape est requis";
      return;
    }

    this.isLoading = true;
    this.error = '';

    try {
      const nextPosition = this.steps.length > 0 
        ? Math.max(...this.steps.map(s => s.position)) + 1 
        : 1;

      await this.supabaseService.addStep(null, this.newStepLabel.trim(), nextPosition);
      
      this.newStepLabel = '';
      await this.loadSteps();
    } catch (err: any) {
      this.error = err.message || 'Erreur lors de l\'ajout de l\'étape';
      console.error(err);
    } finally {
      this.isLoading = false;
    }
  }

  async deleteStep(stepId: string) {
    if (!confirm('Confirmez la suppression de cette étape ?')) return;

    this.isLoading = true;
    this.error = '';

    try {
      await this.supabaseService.deleteStep(stepId);
      await this.loadSteps();
    } catch (err: any) {
      this.error = err.message || 'Erreur lors de la suppression de l\'étape';
      console.error(err);
    } finally {
      this.isLoading = false;
    }
  }
}