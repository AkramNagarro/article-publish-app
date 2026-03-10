import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-author-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './author-login.html',
  styleUrls: ['./author-login.scss']
})
export class AuthorLoginComponent {
  isLoading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async loginWithGoogle(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';
      await this.authService.loginWithGoogle('author');
      this.router.navigate(['/home']);
    } catch (error: any) {
      this.errorMessage = error?.message || 'Google login failed.';
    } finally {
      this.isLoading = false;
    }
  }

  async loginWithFacebook(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';
      await this.authService.loginWithFacebook('author');
      this.router.navigate(['/home']);
    } catch (error: any) {
      this.errorMessage = error?.message || 'Facebook login failed.';
    } finally {
      this.isLoading = false;
    }
  }
}