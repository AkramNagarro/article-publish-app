import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { CommentItem, CommentNode } from '../models/comment.model';

export type CommentSortType = 'newest' | 'oldest' | 'most-liked';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private apiUrl = 'http://localhost:3000/comments';

  constructor(private http: HttpClient) {}

  getCommentsByArticle(
    articleId: string,
    sort: CommentSortType = 'newest'
  ): Observable<CommentNode[]> {
    return this.http
      .get<CommentItem[]>(`${this.apiUrl}?articleId=${articleId}`)
      .pipe(
        map((comments) => this.buildCommentTree(comments)),
        map((comments) => this.sortCommentTree(comments, sort))
      );
  }

  getCommentCount(articleId: string): Observable<number> {
    return this.http
      .get<CommentItem[]>(`${this.apiUrl}?articleId=${articleId}`)
      .pipe(map((comments) => comments.length));
  }

  addComment(comment: CommentItem): Observable<CommentItem> {
    return this.http.post<CommentItem>(this.apiUrl, comment);
  }

  likeComment(commentId: string, currentLikes: number): Observable<CommentItem> {
    return this.http.patch<CommentItem>(`${this.apiUrl}/${commentId}`, {
      likes: currentLikes + 1
    });
  }

  private buildCommentTree(comments: CommentItem[]): CommentNode[] {
    const commentMap = new Map<string, CommentNode>();
    const roots: CommentNode[] = [];

    for (const item of comments) {
      const id = String(item.id ?? '');

      if (!id) {
        continue;
      }

      commentMap.set(id, {
        ...item,
        id,
        parentId: item.parentId ? String(item.parentId) : null,
        replies: [],
        showReplyBox: false,
        replyText: ''
      });
    }

    for (const item of comments) {
      const currentId = String(item.id ?? '');
      const current = commentMap.get(currentId);

      if (!current) {
        continue;
      }

      if (current.parentId === null) {
        roots.push(current);
      } else {
        const parent = commentMap.get(String(current.parentId));

        if (parent) {
          parent.replies.push(current);
        } else {
          roots.push(current);
        }
      }
    }

    return roots;
  }

  private sortCommentTree(
    comments: CommentNode[],
    sort: CommentSortType
  ): CommentNode[] {
    const mapped = comments.map((comment) => ({
      ...comment,
      replies: this.sortReplies(comment.replies, sort)
    }));

    if (sort === 'newest') {
      return mapped.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    if (sort === 'oldest') {
      return mapped.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    }

    return mapped.sort((a, b) => {
      const likeDiff = (b.likes ?? 0) - (a.likes ?? 0);

      if (likeDiff !== 0) {
        return likeDiff;
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  private sortReplies(
    replies: CommentNode[],
    sort: CommentSortType
  ): CommentNode[] {
    const sorted = [...replies];

    if (sort === 'newest') {
      return sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    if (sort === 'oldest') {
      return sorted.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    }

    return sorted.sort((a, b) => {
      const likeDiff = (b.likes ?? 0) - (a.likes ?? 0);

      if (likeDiff !== 0) {
        return likeDiff;
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }
}