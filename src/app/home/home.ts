import { Component } from '@angular/core';
import { ArticleService } from '../services/article';
import { Article } from '../models/article.model';
import { ActivatedRoute, Router } from '@angular/router';
import { map, switchMap } from 'rxjs/operators';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
  standalone: true,
  imports: [AsyncPipe]
})
export class Home {
  articles$!: Observable<Article[]>;

  featuredArticles: Article[] = [];
  searchKeyword = '';
  currentSlide = 0;

  currentPage = 1;
  pageSize = 10;
  totalPages = 0;

  sortType = 'all';

  private page$ = new BehaviorSubject<number>(1);

  constructor(
    private route: ActivatedRoute,
    private articleService: ArticleService,
    private router: Router
  ) {}

  ngOnInit() {
    this.articles$ = combineLatest([
      this.route.queryParams,
      this.page$
    ]).pipe(
      switchMap(([params, page]) => {
        this.searchKeyword = params['search'] || '';
        this.sortType = params['sort'] || 'all';
        this.currentPage = page;

        return this.articleService.getArticles();
      }),

      map((articles: Article[]) => {
        this.featuredArticles = articles.filter(
          article => article.editorFavorite === true
        );

        let filtered = [...articles];

        if (this.searchKeyword) {
          const keyword = this.searchKeyword.trim().toLowerCase();

          filtered = articles.filter(article => {
            const titleMatch = article.title?.toLowerCase().includes(keyword);
            const authorMatch = article.author?.toLowerCase().includes(keyword);
            const keywordMatch = article.keywords?.some(k =>
              k.toLowerCase().includes(keyword)
            );

            return titleMatch || authorMatch || keywordMatch;
          });
        }

        if (this.sortType === 'latest') {
          filtered.sort((a, b) =>
            new Date(b.publishDate).getTime() -
            new Date(a.publishDate).getTime()
          );
        }

        if (this.sortType === 'popular') {
          filtered.sort((a, b) =>
            (b.likes ?? 0) - (a.likes ?? 0)
          );
        }

        if (this.sortType === 'editor') {
          filtered.sort((a, b) =>
            (b.editorFavorite ? 1 : 0) -
            (a.editorFavorite ? 1 : 0)
          );
        }

        this.totalPages = Math.ceil(filtered.length / this.pageSize);

        if (this.currentPage > this.totalPages && this.totalPages > 0) {
          this.currentPage = 1;
          this.page$.next(1);
        }

        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;

        return filtered.slice(start, end);
      })
    );
  }

  changePage(page: number) {
    this.page$.next(page);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.page$.next(this.currentPage + 1);
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.page$.next(this.currentPage - 1);
    }
  }

  get pages() {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  nextSlide() {
    this.currentSlide =
      (this.currentSlide + 1) % this.featuredArticles.length;
  }

  prevSlide() {
    this.currentSlide =
      (this.currentSlide - 1 + this.featuredArticles.length)
      % this.featuredArticles.length;
  }

  goToSlide(index: number) {
    this.currentSlide = index;
  }

  onSortChange(event: any) {
    const value = event.target.value;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { sort: value },
      queryParamsHandling: 'merge'
    });

    this.page$.next(1);
  }
}