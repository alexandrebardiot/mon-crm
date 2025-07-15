import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TemplateService , StepService} from '../../services';
import { Subject, takeUntil, debounceTime } from 'rxjs';

interface Template {
  id: string;
  name: string;
  created_at: string;
}

interface Step {
  id: string;
  name: string;
  position: number;
  default_due_days: number;
  template_id: string;
}

@Component({
  selector: 'app-steps-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './steps-manager.component.html',
  styleUrls: ['./steps-manager.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush // Optimisation de la détection des changements
})
export class StepsManagerComponent implements OnInit, OnDestroy {
  @ViewChild('insertInput') insertInput!: ElementRef;
  @ViewChild('editInput') editInput!: ElementRef;
  @ViewChild('createInput') createInput!: ElementRef;
  @ViewChild('editTemplateInput') editTemplateInput!: ElementRef;

  private destroy$ = new Subject<void>();
  private loadingOperations = new Set<string>(); // Pour tracker les opérations en cours

  templates: Template[] = [];
  selectedTemplate: Template | null = null;
  selectedTemplateId: string = '';
  steps: Step[] = [];
  
  // États pour l'insertion
  insertingAt: number | null = null;
  newStepName: string = '';
  
  // États pour l'édition
  editingStepId: string | null = null;
  editingStepName: string = '';
  
  // États pour les templates
  isCreatingTemplate: boolean = false;
  newTemplateName: string = '';
  editingTemplateId: string | null = null;
  editingTemplateName: string = '';
  
  // États pour le drag & drop
  draggedStepId: string | null = null;
  draggedOverPosition: number | null = null;
  
  isLoading = false;
  error = '';

  constructor(
    private templateService: TemplateService,
    private stepService: StepService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadTemplates();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========== GESTION DU LOADING ==========
  
  private setLoading(operation: string, loading: boolean) {
    if (loading) {
      this.loadingOperations.add(operation);
    } else {
      this.loadingOperations.delete(operation);
    }
    
    const wasLoading = this.isLoading;
    this.isLoading = this.loadingOperations.size > 0;
    
    // Ne déclencher la détection de changement que si l'état a changé
    if (wasLoading !== this.isLoading) {
      this.cdr.markForCheck();
    }
  }

  // ========== GESTION DES TEMPLATES ==========

  async loadTemplates() {
    this.setLoading('loadTemplates', true);
    this.error = '';
    
    try {
      const templates = await this.templateService.getTemplates();
      
      // Optimisation: ne mettre à jour que si les données ont changé
      if (JSON.stringify(this.templates) !== JSON.stringify(templates)) {
        this.templates = templates;
        this.cdr.markForCheck();
      }
    } catch (err: any) {
      this.error = err.message || 'Erreur lors du chargement des templates';
      console.error(err);
      this.cdr.markForCheck();
    } finally {
      this.setLoading('loadTemplates', false);
    }
  }

  async selectTemplate(templateId: string) {
    if (!templateId) {
      this.selectedTemplate = null;
      this.selectedTemplateId = '';
      this.steps = [];
      this.resetAllStates();
      this.cdr.markForCheck();
      return;
    }

    const found = this.templates.find(t => t.id === templateId);
    if (found && found.id !== this.selectedTemplate?.id) {
      this.selectedTemplate = found;
      this.selectedTemplateId = templateId;
      this.resetAllStates();
      await this.loadSteps();
    }
  }

  private resetAllStates() {
    this.cancelInserting();
    this.cancelEditing();
    this.cancelCreatingTemplate();
    this.cancelTemplateEditing();
  }

  startCreatingTemplate() {
    if (this.isCreatingTemplate) return; // Éviter les actions redondantes
    
    this.resetAllStates();
    this.isCreatingTemplate = true;
    this.newTemplateName = '';
    this.cdr.markForCheck();
    
    this.focusElement(() => this.createInput?.nativeElement);
  }

  cancelCreatingTemplate() {
    if (!this.isCreatingTemplate) return;
    
    this.isCreatingTemplate = false;
    this.newTemplateName = '';
    this.cdr.markForCheck();
  }

  async createTemplate() {
    if (!this.newTemplateName.trim()) return;

    this.setLoading('createTemplate', true);
    this.error = '';
    
    try {
      await this.templateService.addTemplate(this.newTemplateName.trim());
      this.cancelCreatingTemplate();
      await this.loadTemplates();
    } catch (err: any) {
      this.error = err.message || 'Erreur lors de la création du template';
      console.error(err);
      this.cdr.markForCheck();
    } finally {
      this.setLoading('createTemplate', false);
    }
  }

  startEditingTemplate(template: Template) {
    if (this.editingTemplateId === template.id) return; // Éviter les actions redondantes
    
    this.resetAllStates();
    this.editingTemplateId = template.id;
    this.editingTemplateName = template.name;
    this.cdr.markForCheck();
    
    this.focusElement(() => this.editTemplateInput?.nativeElement);
  }

  cancelTemplateEditing() {
    if (!this.editingTemplateId) return;
    
    this.editingTemplateId = null;
    this.editingTemplateName = '';
    this.cdr.markForCheck();
  }

  async saveTemplateEdit() {
    if (!this.editingTemplateId || !this.editingTemplateName.trim()) return;

    this.setLoading('saveTemplateEdit', true);
    this.error = '';
    
    try {
      await this.templateService.updateTemplate(this.editingTemplateId, this.editingTemplateName.trim());
      
      // Mise à jour optimisée: modifier directement les objets en mémoire
      const templateIndex = this.templates.findIndex(t => t.id === this.editingTemplateId);
      if (templateIndex !== -1) {
        this.templates[templateIndex].name = this.editingTemplateName.trim();
      }
      
      if (this.selectedTemplate && this.selectedTemplate.id === this.editingTemplateId) {
        this.selectedTemplate.name = this.editingTemplateName.trim();
      }
      
      this.cancelTemplateEditing();
      this.cdr.markForCheck();
    } catch (err: any) {
      this.error = err.message || 'Erreur lors de la modification du template';
      console.error(err);
      this.cdr.markForCheck();
    } finally {
      this.setLoading('saveTemplateEdit', false);
    }
  }

  async deleteTemplate(template: Template) {
    if (!confirm(`Confirmez la suppression du template "${template.name}" et toutes ses étapes ?`)) return;

    this.setLoading('deleteTemplate', true);
    this.error = '';
    
    try {
      await this.templateService.deleteTemplate(template.id);
      
      // Mise à jour optimisée: supprimer directement de la liste
      this.templates = this.templates.filter(t => t.id !== template.id);
      
      // Si le template supprimé était sélectionné, réinitialiser la sélection
      if (this.selectedTemplate && this.selectedTemplate.id === template.id) {
        this.selectedTemplate = null;
        this.selectedTemplateId = '';
        this.steps = [];
      }
      
      this.cdr.markForCheck();
    } catch (err: any) {
      this.error = err.message || 'Erreur lors de la suppression du template';
      console.error(err);
      this.cdr.markForCheck();
    } finally {
      this.setLoading('deleteTemplate', false);
    }
  }

  // ========== GESTION DES ÉTAPES ==========

  async loadSteps() {
    if (!this.selectedTemplate) return;
    
    this.setLoading('loadSteps', true);
    this.error = '';
    
    try {
      const steps = await this.stepService.getStepsByTemplate(this.selectedTemplate.id);
      const sortedSteps = steps.sort((a, b) => a.position - b.position);
      
      // Optimisation: ne mettre à jour que si les données ont changé
      if (JSON.stringify(this.steps) !== JSON.stringify(sortedSteps)) {
        this.steps = sortedSteps;
        this.cdr.markForCheck();
      }
    } catch (err: any) {
      this.error = err.message || 'Erreur lors du chargement des étapes';
      console.error(err);
      this.cdr.markForCheck();
    } finally {
      this.setLoading('loadSteps', false);
    }
  }

  // Génération automatique des couleurs (méthode pure pour éviter les recalculs)
  getStepColor(position: number): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    return colors[position % colors.length];
  }

  isInsertingAtPosition(position: number): boolean {
    return this.insertingAt === position;
  }

  startInsertingStep(position: number) {
    const numPosition = Number(position);
    if (isNaN(numPosition) || this.insertingAt === numPosition) return;
    
    this.resetAllStates();
    this.insertingAt = numPosition;
    this.newStepName = '';
    this.cdr.markForCheck();
    
    this.focusElement(() => this.insertInput?.nativeElement);
  }

  cancelInserting() {
    if (this.insertingAt === null) return;
    
    this.insertingAt = null;
    this.newStepName = '';
    this.cdr.markForCheck();
  }

  async insertStep() {
    if (!this.selectedTemplate || 
        !this.newStepName.trim() || 
        this.insertingAt === null || 
        typeof this.insertingAt !== 'number') {
      return;
    }

    this.setLoading('insertStep', true);
    this.error = '';
    
    try {
      // Décaler les positions des étapes suivantes
      await this.stepService.incrementStepPositions(this.selectedTemplate.id, this.insertingAt);
      
      // Ajouter la nouvelle étape
      await this.stepService.addStep(
        this.selectedTemplate.id,
        this.newStepName.trim(),
        this.insertingAt,
        7
      );
      
      this.cancelInserting();
      await this.loadSteps();
    } catch (err: any) {
      this.error = err.message || 'Erreur lors de l\'insertion de l\'étape';
      console.error(err);
      this.cdr.markForCheck();
    } finally {
      this.setLoading('insertStep', false);
    }
  }

  startEditingStep(step: Step) {
    if (this.editingStepId === step.id) return;
    
    this.resetAllStates();
    this.editingStepId = step.id;
    this.editingStepName = step.name;
    this.cdr.markForCheck();
    
    this.focusElement(() => this.editInput?.nativeElement);
  }

  cancelEditing() {
    if (!this.editingStepId) return;
    
    this.editingStepId = null;
    this.editingStepName = '';
    this.cdr.markForCheck();
  }

  async saveStepEdit() {
    if (!this.editingStepId || !this.editingStepName.trim()) return;

    this.setLoading('saveStepEdit', true);
    this.error = '';
    
    try {
      await this.stepService.updateStepName(this.editingStepId, this.editingStepName.trim());
      
      // Mise à jour optimisée: modifier directement l'objet en mémoire
      const stepIndex = this.steps.findIndex(s => s.id === this.editingStepId);
      if (stepIndex !== -1) {
        this.steps[stepIndex].name = this.editingStepName.trim();
      }
      
      this.cancelEditing();
      this.cdr.markForCheck();
    } catch (err: any) {
      this.error = err.message || 'Erreur lors de la modification de l\'étape';
      console.error(err);
      this.cdr.markForCheck();
    } finally {
      this.setLoading('saveStepEdit', false);
    }
  }

  async deleteStep(step: Step) {
    if (!confirm(`Confirmez la suppression de l'étape "${step.name}" ?`)) return;

    this.setLoading('deleteStep', true);
    this.error = '';
    
    try {
      await this.stepService.deleteStep(step.id);
      await this.stepService.decrementStepPositions(step.template_id, step.position);
      await this.loadSteps();
    } catch (err: any) {
      this.error = err.message || 'Erreur lors de la suppression de l\'étape';
      console.error(err);
      this.cdr.markForCheck();
    } finally {
      this.setLoading('deleteStep', false);
    }
  }

  // ========== DRAG & DROP ==========

  onDragStart(event: DragEvent, step: Step) {
    this.draggedStepId = step.id;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragOver(event: DragEvent, position: number) {
    event.preventDefault();
    if (this.draggedOverPosition !== position) {
      this.draggedOverPosition = position;
      this.cdr.markForCheck();
    }
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDragLeave() {
    if (this.draggedOverPosition !== null) {
      this.draggedOverPosition = null;
      this.cdr.markForCheck();
    }
  }

  async onDrop(event: DragEvent, newPosition: number) {
    event.preventDefault();
    
    if (!this.draggedStepId || !this.selectedTemplate) return;

    const draggedStep = this.steps.find(s => s.id === this.draggedStepId);
    if (!draggedStep) return;

    const oldPosition = draggedStep.position;
    if (oldPosition === newPosition) return;

    this.setLoading('reorderSteps', true);
    this.error = '';
    
    try {
      await this.stepService.reorderSteps(
        this.selectedTemplate.id,
        oldPosition,
        newPosition
      );
      await this.loadSteps();
    } catch (err: any) {
      this.error = err.message || 'Erreur lors du réordonnancement';
      console.error(err);
      this.cdr.markForCheck();
    } finally {
      this.setLoading('reorderSteps', false);
      this.draggedStepId = null;
      this.draggedOverPosition = null;
    }
  }

  onDragEnd() {
    this.draggedStepId = null;
    this.draggedOverPosition = null;
    this.cdr.markForCheck();
  }

  // ========== UTILITAIRES ==========

  private focusElement(elementGetter: () => HTMLElement | undefined) {
    setTimeout(() => {
      const element = elementGetter();
      if (element) {
        element.focus();
      }
    }, 50);
  }

  // Méthodes pour le tracking des éléments (améliore les performances Angular)
  trackByTemplateId(index: number, template: Template): string {
    return template.id;
  }

  trackByStepId(index: number, step: Step): string {
    return step.id;
  }
}