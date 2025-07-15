import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Step } from './types';

@Injectable({
  providedIn: 'root',
})
export class StepService {
  constructor(private supabaseService: SupabaseService) {}

  async getStepsByTemplate(templateId: string): Promise<Step[]> {
    const { data, error } = await this.supabaseService.client
      .from('steps')
      .select('*')
      .eq('template_id', templateId)
      .order('position', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getStepById(id: string): Promise<Step | null> {
    const { data, error } = await this.supabaseService.client
      .from('steps')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async addStep(
    templateId: string,
    name: string,
    position: number,
    defaultDueDays: number = 7
  ): Promise<Step | null> {
    const { data, error } = await this.supabaseService.client
      .from('steps')
      .insert([
        {
          template_id: templateId,
          name,
          position,
          default_due_days: defaultDueDays,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateStep(stepId: string, updates: Partial<Step>): Promise<Step | null> {
    const { data, error } = await this.supabaseService.client
      .from('steps')
      .update(updates)
      .eq('id', stepId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteStep(stepId: string): Promise<void> {
    const { error } = await this.supabaseService.client
      .from('steps')
      .delete()
      .eq('id', stepId);

    if (error) throw error;
  }

  async reorderSteps(templateId: string, oldPosition: number, newPosition: number): Promise<void> {
    if (oldPosition === newPosition) return;

    const steps = await this.getStepsByTemplate(templateId);

    const updatedSteps = steps.map((step) => {
      if (step.position === oldPosition) {
        return { ...step, position: newPosition };
      } else if (oldPosition < newPosition) {
        if (step.position > oldPosition && step.position <= newPosition) {
          return { ...step, position: step.position - 1 };
        }
      } else {
        if (step.position >= newPosition && step.position < oldPosition) {
          return { ...step, position: step.position + 1 };
        }
      }
      return step;
    });

    const updates = updatedSteps.map((step) =>
      this.supabaseService.client
        .from('steps')
        .update({ position: step.position })
        .eq('id', step.id)
    );

    const results = await Promise.all(updates);
    for (const result of results) {
      if (result.error) throw result.error;
    }
  }

  async incrementStepPositions(templateId: string, fromPosition: number): Promise<void> {
    const { data: steps, error: selectError } = await this.supabaseService.client
      .from('steps')
      .select('id, position')
      .eq('template_id', templateId)
      .gte('position', fromPosition);

    if (selectError) throw selectError;
    if (!steps || steps.length === 0) return;

    const updates = steps.map((step) =>
      this.supabaseService.client
        .from('steps')
        .update({ position: step.position + 1 })
        .eq('id', step.id)
    );

    const results = await Promise.all(updates);
    for (const result of results) {
      if (result.error) throw result.error;
    }
  }

  async decrementStepPositions(templateId: string, fromPosition: number): Promise<void> {
    const { data: steps, error: selectError } = await this.supabaseService.client
      .from('steps')
      .select('id, position')
      .eq('template_id', templateId)
      .gt('position', fromPosition);

    if (selectError) throw selectError;
    if (!steps || steps.length === 0) return;

    const updates = steps.map((step) =>
      this.supabaseService.client
        .from('steps')
        .update({ position: step.position - 1 })
        .eq('id', step.id)
    );

    const results = await Promise.all(updates);
    for (const result of results) {
      if (result.error) throw result.error;
    }
  }

  async updateStepName(stepId: string, name: string): Promise<Step | null> {
    const { data, error } = await this.supabaseService.client
      .from('steps')
      .update({ name })
      .eq('id', stepId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
