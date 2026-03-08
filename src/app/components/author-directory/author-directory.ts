import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { combineLatest, map, Observable, BehaviorSubject } from 'rxjs';

import { ArticleService } from '../../services/article';
import { AuthorService } from '../../services/author';

import { Article } from '../../models/article.model';
import { Author } from '../../models/author.model';

interface AuthorDirectoryViewModel {
  readerChoiceArticles: Article[];
  trendingKeywords: string[];
  filteredAuthors: Author[];
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
    private authorService: AuthorService
  ) {}

  ngOnInit(): void {

    const articles$ = this.articleService.getArticles();
    const authors$ = this.authorService.getAuthors();

    this.vm$ = combineLatest([
      articles$,
      authors$,
      this.searchText$
    ]).pipe(
      map(([articles, authors, searchText]) => {

        const allAuthors = this.buildAuthorsWithStats(authors, articles);

        const normalizedSearch = searchText.trim().toLowerCase();
        const isSearching = normalizedSearch.length >= 3;

        const filteredAuthors =
          !isSearching
            ? allAuthors
            : allAuthors.filter(author =>
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

    articles.forEach(article => {
      article.keywords?.forEach(keyword => {
        const normalized = keyword.trim().toLowerCase();
        keywordMap[normalized] = (keywordMap[normalized] || 0) + 1;
      });
    });

    return Object.entries(keywordMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([keyword]) => keyword);
  }

  private buildAuthorsWithStats(authors: Author[], articles: Article[]): Author[] {

    return authors
      .map(author => {

        const authorArticles = articles.filter(
          article =>
            article.author.trim().toLowerCase() ===
            author.name.trim().toLowerCase()
        );

        const totalViews = authorArticles.reduce(
          (sum, article) => sum + (article.views ?? 0),
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