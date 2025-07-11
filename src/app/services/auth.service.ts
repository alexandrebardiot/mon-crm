import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { BehaviorSubject, from, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private userSubject = new BehaviorSubject<any>(null);
  user$: Observable<any> = this.userSubject.asObservable();

  constructor(private supabaseService: SupabaseService) {
    // Initialiser l'user au chargement du service
    this.loadUser();

    // Écouter les changements d'authentification
    this.supabaseService.supabase.auth.onAuthStateChange((_event, session) => {
      this.userSubject.next(session?.user ?? null);
    });
  }

  private async loadUser() {
    const { data, error } = await this.supabaseService.supabase.auth.getUser();
    if (!error) {
      this.userSubject.next(data.user ?? null);
    }
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabaseService.supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    this.userSubject.next(data.user ?? null);
    return data.user ?? null;
  }

  async signOut() {
    await this.supabaseService.supabase.auth.signOut();
    this.userSubject.next(null);
  }

  // Méthode observable pour le guard
  getCurrentUser(): Observable<any> {
    return this.user$;
  }

  // Optionnel : méthode async pour récupérer l'utilisateur une fois
  async getUser() {
    const { data, error } = await this.supabaseService.supabase.auth.getUser();
    if (error) {
      console.error('Erreur getUser:', error);
      return null;
    }
    return data.user ?? null;
  }
}
