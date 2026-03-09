import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, Subject, combineLatest, Observable, of } from 'rxjs';
import { map, switchMap, takeUntil } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';

import { ArticleService } from '../../services/article';
import { UserService } from '../../services/user';
import { CommentService, CommentSortType } from '../../services/comment';

import { Article } from '../../models/article.model';
import { User } from '../../models/user.model';
import { CommentItem, CommentNode, CommentUserType } from '../../models/comment.model';

interface RelatedArticle extends Article {
  matchedKeywords: string[];
}

interface ArticleDetailsViewModel {
  article: Article;
  author: User | null;
  otherArticlesByAuthor: Article[];
  authorArticleSlides: Article[][];
  relatedArticles: RelatedArticle[];
  relatedArticleSlides: RelatedArticle[][];
}

interface LoggedInUser {
  id: string;
  name: string;
  image: string;
  domain?: string;
  bio?: string;
  email?: string;
  password?: string;
  userType: CommentUserType;
}

@Component({
  selector: 'app-article-details',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule],
  templateUrl: './article-details.html',
  styleUrls: ['./article-details.scss']
})
export class ArticleDetails implements OnInit, OnDestroy {
  vm$!: Observable<ArticleDetailsViewModel | null>;

  currentAuthorSlide = 0;
  currentRelatedSlide = 0;

  comments: CommentNode[] = [];
  totalCommentCount = 0;
  isCommentDrawerOpen = false;
  newCommentText = '';
  commentSort: CommentSortType = 'newest';

  isPostingComment = false;
  likedCommentIds = new Set<string>();
  postingReplyIds = new Set<string>();

  currentUser: LoggedInUser = {
    id: 'guest',
    name: 'Guest User',
    image: 'https://i.pravatar.cc/400?img=15',
    userType: 'reader'
  };

  private refresh$ = new BehaviorSubject<number>(0);
  private commentSort$ = new BehaviorSubject<CommentSortType>('newest');
  private viewsUpdatedForArticleId: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private articleService: ArticleService,
    private userService: UserService,
    private commentService: CommentService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUserFromLocalStorage();

    this.vm$ = combineLatest([
      this.route.paramMap,
      this.refresh$
    ]).pipe(
      map(([params]) => String(params.get('id') ?? '')),
      switchMap((currentArticleId: string) => {
        if (!currentArticleId) {
          return of(null);
        }

        if (this.viewsUpdatedForArticleId !== currentArticleId) {
          this.viewsUpdatedForArticleId = currentArticleId;

          this.articleService.getArticleById(currentArticleId).subscribe({
            next: (article: Article) => {
              const updatedViews = (article.views ?? 0) + 1;

              this.articleService.updateArticle(currentArticleId, {
                views: updatedViews
              }).subscribe({
                next: () => {
                  this.refresh$.next(this.refresh$.value + 1);
                },
                error: (error) => console.error('View update failed', error)
              });
            },
            error: (error) => console.error('Fetch article failed', error)
          });
        }

        return combineLatest([
          this.articleService.getArticles(),
          this.userService.getUsers().pipe(
            map((users: User[]) =>
              users.filter((user: User) => user.userType?.toLowerCase() === 'author')
            )
          )
        ]).pipe(
          map(([articles, authors]) => {
            const article = articles.find(
              (item: Article) => String(item.id) === currentArticleId
            );

            if (!article) {
              return null;
            }

            const author =
              authors.find(
                (item: User) =>
                  item.name.trim().toLowerCase() ===
                  article.author.trim().toLowerCase()
              ) || null;

            const normalizedCurrentKeywords =
              article.keywords?.map((keyword: string) => keyword.trim().toLowerCase()) || [];

            const otherArticlesByAuthor = articles
              .filter(
                (item: Article) =>
                  String(item.id) !== String(article.id) &&
                  item.author.trim().toLowerCase() ===
                    article.author.trim().toLowerCase()
              )
              .sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0));

            const authorArticleSlides = this.chunkArticles(otherArticlesByAuthor, 3);

            const relatedArticles = articles
              .filter((item: Article) => String(item.id) !== String(article.id))
              .map((item: Article) => {
                const matchedKeywords =
                  item.keywords?.filter((keyword: string) =>
                    normalizedCurrentKeywords.includes(keyword.trim().toLowerCase())
                  ) || [];

                return {
                  ...item,
                  matchedKeywords
                };
              })
              .filter((item: RelatedArticle) => item.matchedKeywords.length > 0)
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
        );
      })
    );

    combineLatest([
      this.route.paramMap.pipe(map((params) => String(params.get('id') ?? ''))),
      this.refresh$,
      this.commentSort$
    ])
      .pipe(
        takeUntil(this.destroy$),
        switchMap(([articleId, _, sort]) => {
          if (!articleId) {
            return of({ comments: [], count: 0 });
          }

          return combineLatest([
            this.commentService.getCommentsByArticle(articleId, sort),
            this.commentService.getCommentCount(articleId)
          ]).pipe(
            map(([comments, count]) => ({
              comments,
              count
            }))
          );
        })
      )
      .subscribe({
        next: ({ comments, count }) => {
          this.comments = comments;
          this.totalCommentCount = count;
        },
        error: (error) => console.error('Failed to load comments', error)
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    document.body.style.overflow = 'auto';
  }

  private loadCurrentUserFromLocalStorage(): void {
    try {
      const storedUser = localStorage.getItem('user');

      if (!storedUser) {
        return;
      }

      const parsedUser = JSON.parse(storedUser) as Partial<LoggedInUser>;

      this.currentUser = {
        id: parsedUser.id || 'guest',
        name: parsedUser.name || 'Guest User',
        image: parsedUser.image || 'https://i.pravatar.cc/400?img=15',
        domain: parsedUser.domain,
        bio: parsedUser.bio,
        email: parsedUser.email,
        password: parsedUser.password,
        userType: parsedUser.userType === 'author' ? 'author' : 'reader'
      };
    } catch (error) {
      console.error('Failed to parse localStorage user', error);
    }
  }

  private reloadComments(): void {
    this.refresh$.next(this.refresh$.value + 1);
  }

  changeCommentSort(sort: CommentSortType): void {
    this.commentSort = sort;
    this.commentSort$.next(sort);
  }

  openComments(): void {
    this.isCommentDrawerOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeComments(): void {
    this.isCommentDrawerOpen = false;
    document.body.style.overflow = 'auto';
  }

  submitComment(article: Article): void {
    const message = this.newCommentText.trim();

    if (!message || this.isPostingComment) {
      return;
    }

    this.isPostingComment = true;

    if (this.commentSort !== 'newest') {
      this.commentSort = 'newest';
      this.commentSort$.next('newest');
    }

    const userType: CommentUserType =
      this.currentUser.name.trim().toLowerCase() === article.author.trim().toLowerCase()
        ? 'author'
        : this.currentUser.userType === 'author'
          ? 'author'
          : 'reader';

    const tempComment: CommentNode = {
      id: `temp-${Date.now()}`,
      articleId: String(article.id),
      parentId: null,
      userName: this.currentUser.name,
      userImage: this.currentUser.image,
      userType,
      message,
      createdAt: new Date().toISOString(),
      likes: 0,
      replies: [],
      showReplyBox: false,
      replyText: ''
    };

    this.insertRootCommentLocally(tempComment);
    this.totalCommentCount += 1;
    this.newCommentText = '';

    const payload: CommentItem = {
      articleId: String(article.id),
      parentId: null,
      userName: tempComment.userName,
      userImage: tempComment.userImage,
      userType: tempComment.userType,
      message: tempComment.message,
      createdAt: tempComment.createdAt,
      likes: 0
    };

    this.commentService.addComment(payload).subscribe({
      next: () => {
        this.isPostingComment = false;
        this.reloadComments();
      },
      error: (error) => {
        console.error('Failed to add comment', error);
        this.isPostingComment = false;
        this.reloadComments();
      }
    });
  }

  toggleReplyBox(comment: CommentNode): void {
    comment.showReplyBox = !comment.showReplyBox;
  }

  submitReply(parent: CommentNode, article: Article): void {
    const replyMessage = (parent.replyText || '').trim();

    if (!replyMessage || !parent.id) {
      return;
    }

    const parentId = String(parent.id);

    if (this.postingReplyIds.has(parentId)) {
      return;
    }

    this.postingReplyIds.add(parentId);

    if (this.commentSort !== 'newest') {
      this.commentSort = 'newest';
      this.commentSort$.next('newest');
    }

    const userType: CommentUserType =
      this.currentUser.name.trim().toLowerCase() === article.author.trim().toLowerCase()
        ? 'author'
        : this.currentUser.userType === 'author'
          ? 'author'
          : 'reader';

    const tempReply: CommentNode = {
      id: `temp-${Date.now()}`,
      articleId: String(article.id),
      parentId,
      userName: this.currentUser.name,
      userImage: this.currentUser.image,
      userType,
      message: replyMessage,
      createdAt: new Date().toISOString(),
      likes: 0,
      replies: [],
      showReplyBox: false,
      replyText: ''
    };

    parent.replies = [tempReply, ...parent.replies];
    parent.replyText = '';
    parent.showReplyBox = false;
    this.totalCommentCount += 1;

    const payload: CommentItem = {
      articleId: String(article.id),
      parentId,
      userName: tempReply.userName,
      userImage: tempReply.userImage,
      userType: tempReply.userType,
      message: tempReply.message,
      createdAt: tempReply.createdAt,
      likes: 0
    };

    this.commentService.addComment(payload).subscribe({
      next: () => {
        this.postingReplyIds.delete(parentId);
        this.reloadComments();
      },
      error: (error) => {
        console.error('Failed to add reply', error);
        this.postingReplyIds.delete(parentId);
        this.reloadComments();
      }
    });
  }

  likeComment(comment: CommentNode, articleId: string): void {
    if (!comment.id) {
      return;
    }

    const commentId = String(comment.id);

    if (this.likedCommentIds.has(commentId)) {
      return;
    }

    this.likedCommentIds.add(commentId);

    const previousLikes = comment.likes ?? 0;
    comment.likes = previousLikes + 1;

    this.commentService.likeComment(commentId, previousLikes).subscribe({
      next: () => {
        this.likedCommentIds.delete(commentId);

        if (this.commentSort === 'most-liked') {
          this.reloadComments();
        }
      },
      error: (error) => {
        console.error('Failed to like comment', error);
        comment.likes = previousLikes;
        this.likedCommentIds.delete(commentId);
      }
    });
  }

  trackByCommentId(index: number, item: CommentNode): string {
    return item.id || String(index);
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }

  openArticle(articleId: string): void {
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

  private insertRootCommentLocally(comment: CommentNode): void {
    const updated = [...this.comments];

    if (this.commentSort === 'oldest') {
      updated.push(comment);
    } else {
      updated.unshift(comment);
    }

    this.comments = updated;
  }
}