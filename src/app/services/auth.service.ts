import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private userSubject = new BehaviorSubject<any>(null);
  user$: Observable<any> = this.userSubject.asObservable();

  constructor(private supabaseService: SupabaseService) {
    this.loadUser();
    this.supabaseService.client.auth.onAuthStateChange((_event, session) => {
      this.userSubject.next(session?.user ?? null);
    });
  }

  private async loadUser() {
    const { data, error } = await this.supabaseService.client.auth.getUser();
    if (!error) {
      this.userSubject.next(data.user ?? null);
    }
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabaseService.client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    this.userSubject.next(data.user ?? null);
    return data.user ?? null;
  }

  async signOut() {
    await this.supabaseService.client.auth.signOut();
    this.userSubject.next(null);
  }

  getCurrentUser(): Observable<any> {
    return this.user$;
  }

  async getUser() {
    const { data, error } = await this.supabaseService.client.auth.getUser();
    if (error) {
      console.error('Erreur getUser:', error);
      return null;
    }
    return data.user ?? null;
  }
}
