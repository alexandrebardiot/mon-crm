import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { BehaviorSubject, from, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import {
  ProjectStep,
  CreateProjectStepRequest,
  UpdateProjectStepRequest
} from './types';

@Injectable({
  providedIn: 'root'
})
export class ProjectStepService {
  private stepsSubject = new BehaviorSubject<ProjectStep[]>([]);
  public steps$ = this.stepsSubject.asObservable();

  constructor(private supabaseService: SupabaseService) {}

  private enrichStep(step: any): ProjectStep {
    return {
      ...step,
      due_date: step.due_date ? new Date(step.due_date) : undefined,
      created_at: new Date(step.created_at),
      reminder_date: step.reminder_date ? new Date(step.reminder_date) : undefined,
      project_name: step.project_name ?? step.projects?.name ?? ''
    };
  }

  getAllUserSteps(): Observable<ProjectStep[]> {
    return from(
      this.supabaseService.client
        .from('project_steps')
        .select('*, projects(name)')
        .order('position', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        const enriched = (data || []).map(this.enrichStep.bind(this));
        this.stepsSubject.next(enriched);
        return enriched;
      })
    );
  }

  getProjectSteps(projectId: string): Observable<ProjectStep[]> {
    return from(
      this.supabaseService.client
        .from('project_steps')
        .select('*, projects(name)')
        .eq('project_id', projectId)
        .order('position', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        const enriched = (data || []).map(this.enrichStep.bind(this));
        this.stepsSubject.next(enriched);
        return enriched;
      })
    );
  }

  createProjectStep(stepData: CreateProjectStepRequest): Observable<ProjectStep> {
    const payload = {
      ...stepData,
      due_date: stepData.due_date?.toISOString(),
      reminder_date: stepData.reminder_date?.toISOString()
    };

    return from(
      this.supabaseService.client
        .from('project_steps')
        .insert([payload])
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        const newStep = this.enrichStep(data);
        this.stepsSubject.next([...this.stepsSubject.value, newStep]);
        return newStep;
      })
    );
  }

  updateProjectStep(stepId: string, updateData: UpdateProjectStepRequest): Observable<ProjectStep> {
    const payload = {
      ...updateData,
      due_date: updateData.due_date?.toISOString(),
      reminder_date: updateData.reminder_date?.toISOString()
    };

    return from(
      this.supabaseService.client
        .from('project_steps')
        .update(payload)
        .eq('id', stepId)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        const updated = this.enrichStep(data);
        const updatedSteps = this.stepsSubject.value.map(step =>
          step.id === stepId ? updated : step
        );
        this.stepsSubject.next(updatedSteps);
        return updated;
      })
    );
  }

  deleteProjectStep(stepId: string): Observable<void> {
    return from(
      this.supabaseService.client
        .from('project_steps')
        .delete()
        .eq('id', stepId)
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
        const updated = this.stepsSubject.value.filter(s => s.id !== stepId);
        this.stepsSubject.next(updated);
      })
    );
  }

  toggleTaskCompletion(stepId: string, completed: boolean): Observable<ProjectStep> {
    return this.updateProjectStep(stepId, { completed });
  }

  assignDueDate(stepId: string, dueDate: Date | null): Observable<ProjectStep> {
    return this.updateProjectStep(stepId, { due_date: dueDate || undefined });
  }

  createStepsFromTemplate(projectId: string, templateId: string): Observable<ProjectStep[]> {
    return from(
      this.supabaseService.client
        .from('steps')
        .select('*')
        .eq('template_id', templateId)
        .order('position', { ascending: true })
    ).pipe(
      switchMap(({ data, error }) => {
        if (error) throw error;

        const stepsToInsert = (data || []).map(step => ({
          ...step,
          id: undefined,
          template_id: null,
          project_id: projectId,
          created_at: new Date().toISOString()
        }));

        return from(
          this.supabaseService.client
            .from('project_steps')
            .insert(stepsToInsert)
            .select()
        ).pipe(
          map(({ data: inserted, error: insertError }) => {
            if (insertError) throw insertError;

            const enriched = inserted.map(this.enrichStep.bind(this));
            this.stepsSubject.next([...this.stepsSubject.value, ...enriched]);
            return enriched;
          })
        );
      })
    );
  }

  getOverdueTasks(): ProjectStep[] {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return this.stepsSubject.value.filter(
      step => !step.completed && step.due_date && step.due_date <= today
    );
  }

  getTasksWithReminders(): ProjectStep[] {
    const now = new Date();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    return this.stepsSubject.value.filter(
      step =>
        !step.completed &&
        step.reminder_date &&
        step.reminder_date >= now &&
        step.reminder_date <= endOfDay
    );
  }
}