import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Article } from '../models/article.model';

@Injectable({
  providedIn: 'root'
})
export class ArticleService {

  private api = 'http://localhost:3000/articles';

  constructor(private http: HttpClient) {}

  getArticles(): Observable<Article[]> {
    return this.http.get<Article[]>(this.api);
  }

  getArticleById(id: string) {
    return this.http.get<Article>(`http://localhost:3000/articles/${id}`);
  }

  updateArticle(id: string, payload: Partial<Article>) {
    return this.http.patch<Article>(`http://localhost:3000/articles/${id}`, payload);
  }

}