import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, map, Observable, switchMap } from 'rxjs';

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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private articleService: ArticleService,
    private authorService: AuthorService
  ) {}

  ngOnInit(): void {
    this.vm$ = this.route.paramMap.pipe(
      map(params => Number(params.get('id'))),
      switchMap((articleId: number) =>
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

            this.currentAuthorSlide = 0;
            this.currentRelatedSlide = 0;

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

  openArticle(articleId: number): void {
    this.router.navigate(['/article-details', articleId]);
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