import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.authService.getCurrentUser().pipe(
      take(1), // prend la première valeur puis complète l'observable
      map(user => {
        if (user) {
          return true;  // utilisateur connecté, accès autorisé
        } else {
          return this.router.createUrlTree(['/login']);  // redirection vers login
        }
      })
    );
  }
}
