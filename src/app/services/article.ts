import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Article } from '../models/article.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ArticleService {

  private apiUrl = environment.apiUrl;
  private articlesApi = `${this.apiUrl}/articles`;

  constructor(private http: HttpClient) {}

  getArticles(): Observable<Article[]> {
    return this.http.get<Article[]>(this.articlesApi);
  }

  getArticleById(id: string) {
    return this.http.get<Article>(`${this.articlesApi}/${id}`);
  }

  updateArticle(id: string, payload: Partial<Article>) {
    return this.http.patch<Article>(`${this.articlesApi}/${id}`, payload);
  }

}