import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-reader-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reader-login.html',
  styleUrls: ['./reader-login.scss']
})
export class ReaderLoginComponent {
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
      await this.authService.loginWithGoogle('reader');
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
      await this.authService.loginWithFacebook('reader');
      this.router.navigate(['/home']);
    } catch (error: any) {
      this.errorMessage = error?.message || 'Facebook login failed.';
    } finally {
      this.isLoading = false;
    }
  }
}