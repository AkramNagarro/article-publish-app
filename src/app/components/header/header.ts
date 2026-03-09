import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService, AppLoggedInUser } from '../../services/auth';

@Component({
  selector: 'app-header',
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class Header implements OnInit, OnDestroy {
  isLoggedIn = false;
  loggedInUser: AppLoggedInUser | null = null;
  isLoggingOut = false;

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.loggedInUser = user;
        this.isLoggedIn = !!user;
      });
  }

  async logout(): Promise<void> {
    if (this.isLoggingOut) return;

    this.isLoggingOut = true;

    try {
      await this.authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.isLoggedIn = false;
      this.loggedInUser = null;
      window.location.href = '/reader-login';
    }
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  goToReaderLogin(): void {
    this.router.navigate(['/reader-login']);
  }

  goToAuthorLogin(): void {
    this.router.navigate(['/author-login']);
  }

  goToAuthors(): void {
    this.router.navigate(['/authors']);
  }

  goToProfile(): void {
    if (!this.loggedInUser) return;

    if (this.loggedInUser.userType === 'author') {
      this.router.navigate(['/author-profile']);
    } else {
      this.router.navigate(['/reader-profile']);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}