import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap, map } from 'rxjs';

import { DraftArticle } from '../models/draft.model';
import { Article } from '../models/article.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DraftService {
  private apiUrl = environment.apiUrl;
  private draftsApi = `${this.apiUrl}/drafts`;
  private articlesApi = `${this.apiUrl}/articles`;

  constructor(private http: HttpClient) {}

  getDrafts(): Observable<DraftArticle[]> {
    return this.http.get<DraftArticle[]>(this.draftsApi);
  }

  getDraftById(id: string): Observable<DraftArticle> {
    return this.http.get<DraftArticle>(`${this.draftsApi}/${id}`);
  }

  createDraft(draft: DraftArticle): Observable<DraftArticle> {
    return this.http.post<DraftArticle>(this.draftsApi, draft);
  }

  updateDraft(id: string, draft: DraftArticle): Observable<DraftArticle> {
    return this.http.put<DraftArticle>(`${this.draftsApi}/${id}`, draft);
  }

  deleteDraft(id: string): Observable<void> {
    return this.http.delete<void>(`${this.draftsApi}/${id}`);
  }

  publishDraft(draft: DraftArticle): Observable<Article> {
    const article: Article = {
      id: crypto.randomUUID(),
      title: draft.title,
      thumbnail: draft.thumbnail || 'https://picsum.photos/900/300?random=20',
      description: draft.description,
      author: draft.author,
      authorImage: draft.authorImage,
      publishDate: new Date().toISOString().split('T')[0],
      likes: 0,
      views: 0,
      readTime: this.resolveReadTime(draft.readTime, draft.content),
      bookmark: false,
      keywords: [...(draft.keywords || [])],
      editorFavorite: !!draft.editorFavorite,
      liked: false,
      content: draft.content
    };

    return this.http.post<Article>(this.articlesApi, article).pipe(
      switchMap((createdArticle) =>
        this.deleteDraft(draft.id as string).pipe(
          map(() => createdArticle)
        )
      )
    );
  }

  private calculateReadTime(content: string): string {
    const plainText = (content || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const words = plainText ? plainText.split(' ').length : 0;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return `${minutes} min read`;
  }

  private resolveReadTime(readTime: string | undefined, content: string): string {
    const value = (readTime || '').trim();

    if (!value) {
      return this.calculateReadTime(content || '');
    }

    const numericOnly = value.match(/^\d+$/);
    if (numericOnly) {
      return `${numericOnly[0]} min read`;
    }

    return value;
  }
}