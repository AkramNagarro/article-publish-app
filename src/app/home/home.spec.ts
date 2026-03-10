import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, firstValueFrom, of, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Home } from './home';
import { ArticleService } from '../services/article';
import { Article } from '../models/article.model';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;
  let queryParamsSubject: BehaviorSubject<Record<string, any>>;

  let articleServiceSpy: {
    getArticles: ReturnType<typeof vi.fn>;
    updateArticle: ReturnType<typeof vi.fn>;
  };

  let routerSpy: {
    navigate: ReturnType<typeof vi.fn>;
  };

  const mockArticles: Article[] = [
    {
      id: '1',
      title: 'Angular Signals Guide',
      thumbnail: 'img1.jpg',
      description: 'Signals in Angular',
      author: 'Akram',
      authorImage: 'author1.jpg',
      publishDate: '2025-03-01',
      likes: 50,
      views: 100,
      readTime: '5 min read',
      bookmark: false,
      liked: false,
      keywords: ['angular', 'signals'],
      editorFavorite: true,
      content: '<p>This is the content of the article.</p>'
    },
    {
      id: '2',
      title: 'RxJS Deep Dive',
      thumbnail: 'img2.jpg',
      description: 'All about RxJS',
      author: 'Rahul',
      authorImage: 'author2.jpg',
      publishDate: '2025-02-15',
      likes: 120,
      views: 500,
      readTime: '8 min read',
      bookmark: true,
      liked: true,
      keywords: ['rxjs', 'streams'],
      editorFavorite: false,
      content: '<p>This is the content of the article.</p>'
    },
    {
      id: '3',
      title: 'NgRx Store Basics',
      thumbnail: 'img3.jpg',
      description: 'State management',
      author: 'Akram',
      authorImage: 'author3.jpg',
      publishDate: '2025-04-10',
      likes: 70,
      views: 300,
      readTime: '7 min read',
      bookmark: false,
      liked: false,
      keywords: ['ngrx', 'state'],
      editorFavorite: true,
      content: '<p>This is the content of the article.</p>'
    }
  ];

  beforeEach(async () => {
    queryParamsSubject = new BehaviorSubject<Record<string, any>>({});

    articleServiceSpy = {
      getArticles: vi.fn(),
      updateArticle: vi.fn()
    };

    routerSpy = {
      navigate: vi.fn()
    };

    articleServiceSpy.getArticles.mockReturnValue(of(mockArticles));
    articleServiceSpy.updateArticle.mockReturnValue(of(mockArticles[0]));

    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        { provide: ArticleService, useValue: articleServiceSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: queryParamsSubject.asObservable()
          }
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should load articles', async () => {
    const result = await firstValueFrom(component.articles$);

    expect(articleServiceSpy.getArticles).toHaveBeenCalled();
    expect(result.length).toBe(3);
  });

  it('should detect featured articles', async () => {
    await firstValueFrom(component.articles$);

    expect(component.featuredArticles.length).toBe(2);
    expect(component.featuredArticles.map(a => a.id)).toEqual(['1', '3']);
  });

  it('should filter by author', async () => {
    queryParamsSubject.next({ search: 'Akram' });

    const result = await firstValueFrom(component.articles$);

    expect(result.length).toBe(2);
    expect(result.every(a => a.author === 'Akram')).toBe(true);
  });

  it('should filter by keyword', async () => {
    queryParamsSubject.next({ search: 'signals' });

    const result = await firstValueFrom(component.articles$);

    expect(result.length).toBe(1);
    expect(result[0].id).toBe('1');
  });

  it('should sort latest', async () => {
    queryParamsSubject.next({ sort: 'latest' });

    const result = await firstValueFrom(component.articles$);

    expect(result.map(a => a.id)).toEqual(['3', '1', '2']);
  });

  it('should sort popular', async () => {
    queryParamsSubject.next({ sort: 'popular' });

    const result = await firstValueFrom(component.articles$);

    expect(result.map(a => a.id)).toEqual(['2', '3', '1']);
  });

  it('should toggle like', () => {
    const article = { ...mockArticles[0], liked: false, likes: 50 };

    component.toggleLike(article);

    expect(articleServiceSpy.updateArticle).toHaveBeenCalledWith('1', {
      liked: true,
      likes: 51
    });
  });

  it('should toggle bookmark', () => {
    const article = { ...mockArticles[0], bookmark: false };

    component.toggleBookmark(article);

    expect(articleServiceSpy.updateArticle).toHaveBeenCalledWith('1', {
      bookmark: true
    });
  });

  it('should navigate to article details', () => {
    component.goToArticleDetails(mockArticles[0]);

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/article-details', '1']);
  });

  it('should navigate to editor', () => {
    component.goToArticleEditor();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/editor']);
  });

  it('should move carousel next', () => {
    component.featuredArticles = [mockArticles[0], mockArticles[2]];
    component.currentSlide = 0;

    component.nextSlide();

    expect(component.currentSlide).toBe(1);
  });

  it('should move carousel previous', () => {
    component.featuredArticles = [mockArticles[0], mockArticles[2]];
    component.currentSlide = 0;

    component.prevSlide();

    expect(component.currentSlide).toBe(1);
  });

  it('should handle update error', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    articleServiceSpy.updateArticle.mockReturnValue(
      throwError(() => new Error('error'))
    );

    component.toggleLike(mockArticles[0]);

    expect(consoleSpy).toHaveBeenCalled();
  });
});