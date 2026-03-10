import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { AuthService, AppLoggedInUser } from '../../services/auth';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class Header implements OnInit, OnDestroy {
  searchText = '';
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

  search(): void {
    if (!this.isLoggedIn) {
      return;
    }

    const keyword = this.searchText.trim();

    if (!keyword) {
      this.router.navigate(['/home']);
      return;
    }

    this.router.navigate(['/home'], {
      queryParams: { search: keyword }
    });
  }

  goToProfile(): void {
    this.router.navigate(['/author-profile']);
  }

  goToAuthors(): void {
    this.router.navigate(['/authors']);
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

  goToReaderLogin(): void {
    this.router.navigate(['/reader-login']);
  }

  goToAuthorLogin(): void {
    this.router.navigate(['/author-login']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}