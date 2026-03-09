import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface LoggedInAuthor {
  id: string;
  name: string;
  image: string;
  domain: string;
  bio: string;
  email: string;
  password: string;
  userType: 'author' | 'reader';
}

@Component({
  selector: 'app-author-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './author-profile.html',
  styleUrls: ['./author-profile.scss']
})
export class AuthorProfile implements OnInit {
  author: LoggedInAuthor | null = null;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadLoggedInAuthor();
  }

  private loadLoggedInAuthor(): void {
    try {
      const storedUser = localStorage.getItem('user');

      if (!storedUser) {
        return;
      }

      const parsedUser = JSON.parse(storedUser) as LoggedInAuthor;

      if (parsedUser.userType !== 'author') {
        return;
      }

      this.author = {
        id: parsedUser.id,
        name: parsedUser.name,
        image: parsedUser.image,
        domain: parsedUser.domain,
        bio: parsedUser.bio,
        email: parsedUser.email,
        password: parsedUser.password,
        userType: parsedUser.userType
      };
    } catch (error) {
      console.error('Failed to load logged in author', error);
    }
  }

  get maskedPassword(): string {
    return this.author?.password ? '*'.repeat(this.author.password.length) : '';
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }
}