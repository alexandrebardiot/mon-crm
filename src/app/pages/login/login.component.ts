import { Component ,OnInit} from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  errorMessage = '';
  loading = false;

  constructor(private authService: AuthService, private router: Router) {}

  async ngOnInit() {
    const user = await this.authService.getUser();
    if (user) {
      // Déjà connecté → redirige vers le dashboard
      this.router.navigate(['/']);
    }
  }

  async login() {
    this.errorMessage = '';
    if (!this.email || !this.password) {
      this.errorMessage = 'Email et mot de passe sont requis.';
      return;
    }
    this.loading = true;

    try {
      const user = await this.authService.signIn(this.email, this.password);
      if (user) {
        this.router.navigate(['/']);
      }
    } catch (error: any) {
      this.errorMessage = error.message || 'Erreur lors de la connexion.';
    } finally {
      this.loading = false;
    }
  }
}