import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ArticleService } from '../../services/article';
import { UserService } from '../../services/user';

import { Article } from '../../models/article.model';
import { User } from '../../models/user.model';

interface AuthorDirectoryViewModel {
  readerChoiceArticles: Article[];
  trendingKeywords: string[];
  filteredAuthors: User[];
  isSearching: boolean;
  searchText: string;
}

@Component({
  selector: 'app-author-directory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './author-directory.html',
  styleUrls: ['./author-directory.scss'],
})
export class AuthorDirectory implements OnInit {
  searchText = '';

  private searchText$ = new BehaviorSubject<string>('');

  vm$!: Observable<AuthorDirectoryViewModel>;

  constructor(
    private router: Router,
    private articleService: ArticleService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    const articles$ = this.articleService.getArticles();

    const authors$ = this.userService.getUsers().pipe(
      map((users: User[]) =>
        users.filter((user: User) => user.userType?.toLowerCase() === 'author')
      )
    );

    this.vm$ = combineLatest([
      articles$,
      authors$,
      this.searchText$
    ]).pipe(
      map(([articles, authors, searchText]) => {
        const allAuthors = this.buildAuthorsWithStats(authors, articles);

        const normalizedSearch = searchText.trim().toLowerCase();
        const isSearching = normalizedSearch.length >= 3;

        const filteredAuthors = !isSearching
          ? allAuthors
          : allAuthors.filter((author: User) =>
              author.name.toLowerCase().includes(normalizedSearch)
            );

        return {
          readerChoiceArticles: [...articles]
            .sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))
            .slice(0, 4),

          trendingKeywords: this.getTopTrendingKeywords(articles),

          filteredAuthors,
          isSearching,
          searchText
        };
      })
    );
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }

  onSearchKeyup(): void {
    this.searchText$.next(this.searchText);
  }

  private getTopTrendingKeywords(articles: Article[]): string[] {
    const keywordMap: Record<string, number> = {};

    articles.forEach((article: Article) => {
      article.keywords?.forEach((keyword: string) => {
        const normalized = keyword.trim().toLowerCase();
        keywordMap[normalized] = (keywordMap[normalized] || 0) + 1;
      });
    });

    return Object.entries(keywordMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([keyword]) => keyword);
  }

  private buildAuthorsWithStats(authors: User[], articles: Article[]): User[] {
    return authors
      .map((author: User) => {
        const authorArticles = articles.filter(
          (article: Article) =>
            article.author.trim().toLowerCase() ===
            author.name.trim().toLowerCase()
        );

        const totalViews = authorArticles.reduce(
          (sum: number, article: Article) => sum + (article.views ?? 0),
          0
        );

        return {
          ...author,
          articleCount: authorArticles.length,
          totalViews
        };
      })
      .sort((a, b) => (b.totalViews ?? 0) - (a.totalViews ?? 0));
  }
}