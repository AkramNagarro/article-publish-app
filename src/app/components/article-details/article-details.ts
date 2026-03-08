import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, map, Observable, switchMap } from 'rxjs';

import { ArticleService } from '../../services/article';
import { AuthorService } from '../../services/author';

import { Article } from '../../models/article.model';
import { Author } from '../../models/author.model';

interface RelatedArticle extends Article {
  matchedKeywords: string[];
}

interface ArticleDetailsViewModel {
  article: Article;
  author: Author | null;
  otherArticlesByAuthor: Article[];
  authorArticleSlides: Article[][];
  relatedArticles: RelatedArticle[];
  relatedArticleSlides: RelatedArticle[][];
}

@Component({
  selector: 'app-article-details',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './article-details.html',
  styleUrls: ['./article-details.scss']
})
export class ArticleDetails implements OnInit {
  vm$!: Observable<ArticleDetailsViewModel | null>;

  currentAuthorSlide = 0;
  currentRelatedSlide = 0;

  private refresh$ = new BehaviorSubject<number>(0);

  private viewsUpdated = false;

  private lastViewedArticleId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private articleService: ArticleService,
    private authorService: AuthorService
  ) {}

  ngOnInit(): void {

    const articleId = this.route.snapshot.paramMap.get('id');

    // increment views only once
    if (articleId && !this.viewsUpdated) {

      this.viewsUpdated = true;

      this.articleService.getArticleById(articleId).subscribe({
        next: (article) => {

          const updatedViews = (article.views ?? 0) + 1;

          this.articleService.updateArticle(articleId, {
            views: updatedViews
          }).subscribe({
            next: () => {
              // refresh vm$ so UI updates immediately
              this.refresh$.next(this.refresh$.value + 1);
            },
            error: (error) => console.error('View update failed', error)
          });

        },
        error: (error) => console.error('Fetch article failed', error)
      });
    }

    this.vm$ = combineLatest([
      this.route.paramMap,
      this.refresh$
    ]).pipe(
      map(([params]) => String(params.get('id'))),
      switchMap((articleId: String) =>
        combineLatest([
          this.articleService.getArticles(),
          this.authorService.getAuthors()
        ]).pipe(
          map(([articles, authors]) => {

            const article = articles.find(item => item.id === articleId);

            if (!article) {
              return null;
            }

            const author =
              authors.find(
                item =>
                  item.name.trim().toLowerCase() ===
                  article.author.trim().toLowerCase()
              ) || null;

            const normalizedCurrentKeywords =
              article.keywords?.map(keyword => keyword.trim().toLowerCase()) || [];

            const otherArticlesByAuthor = articles
              .filter(
                item =>
                  item.id !== article.id &&
                  item.author.trim().toLowerCase() ===
                    article.author.trim().toLowerCase()
              )
              .sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0));

            const authorArticleSlides = this.chunkArticles(otherArticlesByAuthor, 3);

            const relatedArticles = articles
              .filter(item => item.id !== article.id)
              .map(item => {
                const matchedKeywords =
                  item.keywords?.filter(keyword =>
                    normalizedCurrentKeywords.includes(keyword.trim().toLowerCase())
                  ) || [];

                return {
                  ...item,
                  matchedKeywords
                };
              })
              .filter(item => item.matchedKeywords.length > 0)
              .sort((a, b) => {
                if (b.matchedKeywords.length !== a.matchedKeywords.length) {
                  return b.matchedKeywords.length - a.matchedKeywords.length;
                }

                return (b.likes ?? 0) - (a.likes ?? 0);
              });

            const relatedArticleSlides = this.chunkArticles(relatedArticles, 3);

            if (this.currentAuthorSlide >= authorArticleSlides.length) {
              this.currentAuthorSlide = 0;
            }

            if (this.currentRelatedSlide >= relatedArticleSlides.length) {
              this.currentRelatedSlide = 0;
            }

            return {
              article,
              author,
              otherArticlesByAuthor,
              authorArticleSlides,
              relatedArticles,
              relatedArticleSlides
            };
          })
        )
      )
    );
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }

  openArticle(articleId: String): void {
    this.router.navigate(['/article-details', articleId]);
  }

  toggleLike(article: Article): void {
    const currentlyLiked = !!article.liked;

    this.articleService.updateArticle(article.id, {
      liked: !currentlyLiked,
      likes: currentlyLiked
        ? Math.max((article.likes ?? 0) - 1, 0)
        : (article.likes ?? 0) + 1
    }).subscribe({
      next: () => this.refresh$.next(this.refresh$.value + 1),
      error: (error) => console.error('Failed to update like', error)
    });
  }

  toggleBookmark(article: Article): void {
    this.articleService.updateArticle(article.id, {
      bookmark: !article.bookmark
    }).subscribe({
      next: () => this.refresh$.next(this.refresh$.value + 1),
      error: (error) => console.error('Failed to update bookmark', error)
    });
  }

  nextAuthorSlide(length: number): void {
    if (!length) return;
    this.currentAuthorSlide = (this.currentAuthorSlide + 1) % length;
  }

  prevAuthorSlide(length: number): void {
    if (!length) return;
    this.currentAuthorSlide = (this.currentAuthorSlide - 1 + length) % length;
  }

  goToAuthorSlide(index: number): void {
    this.currentAuthorSlide = index;
  }

  nextRelatedSlide(length: number): void {
    if (!length) return;
    this.currentRelatedSlide = (this.currentRelatedSlide + 1) % length;
  }

  prevRelatedSlide(length: number): void {
    if (!length) return;
    this.currentRelatedSlide = (this.currentRelatedSlide - 1 + length) % length;
  }

  goToRelatedSlide(index: number): void {
    this.currentRelatedSlide = index;
  }

  chunkArticles<T>(articles: T[], size: number): T[][] {
    const chunks: T[][] = [];

    for (let i = 0; i < articles.length; i += size) {
      chunks.push(articles.slice(i, i + size));
    }

    return chunks;
  }
}