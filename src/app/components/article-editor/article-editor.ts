import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { QuillModule } from 'ngx-quill';

import { DraftArticle } from '../../models/draft.model';
import { DraftService } from '../../services/draft';

interface LoggedInUser {
  id: string;
  name: string;
  image?: string;
  email?: string;
  userType?: 'reader' | 'author';
}

interface PreviewArticle {
  id: string;
  title: string;
  thumbnail: string;
  description: string;
  author: string;
  authorImage: string;
  publishDate: string;
  likes: number;
  views: number;
  readTime: string;
  bookmark: boolean;
  keywords: string[];
  editorFavorite: boolean;
  liked: boolean;
  content: string;
}

@Component({
  selector: 'app-article-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, QuillModule, DatePipe],
  templateUrl: './article-editor.html',
  styleUrls: ['./article-editor.scss']
})
export class ArticleEditor implements OnInit {
  draftId: string | null = null;
  isSaving = false;
  isPublishing = false;
  keywordInput = '';
  showVersionHistory = false;

  drafts: DraftArticle[] = [];
  lastSavedSnapshot = '';

  isPreviewEnabled = false;
  isPreviewModalOpen = false;
  previewArticle: PreviewArticle | null = null;

  editorForm: DraftArticle = this.createEmptyForm();

  quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      ['code-block'],
      ['link', 'image', 'video'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['clean']
    ]
  };

  categories = [
    'Technology',
    'Blockchain',
    'AI',
    'Cloud',
    'Programming',
    'Finance',
    'Startup',
    'Cybersecurity',
    'Microservices'
  ];

  constructor(
    private draftService: DraftService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.applyLoggedInAuthorDefaults();
    this.loadDrafts();
    this.lastSavedSnapshot = this.getComparableSnapshot();
  }

  createEmptyForm(): DraftArticle {
    return {
      title: '',
      thumbnail: '',
      description: '',
      content: '',
      category: '',
      keywords: [],
      author: '',
      authorImage: '',
      authorId: '',
      status: 'draft',
      createdAt: '',
      updatedAt: ''
    };
  }

  applyLoggedInAuthorDefaults(): void {
    const rawUser = localStorage.getItem('loggedInUser');
    if (!rawUser) return;

    const user: LoggedInUser = JSON.parse(rawUser);

    this.editorForm.author = user.name || 'Unknown Author';
    this.editorForm.authorImage = user.image || 'https://i.pravatar.cc/100?img=5';
    this.editorForm.authorId = user.id || '';
  }

  resetForm(): void {
    const rawUser = localStorage.getItem('loggedInUser');

    this.editorForm = this.createEmptyForm();
    this.draftId = null;
    this.keywordInput = '';
    this.isPreviewEnabled = false;
    this.previewArticle = null;

    if (rawUser) {
      const user: LoggedInUser = JSON.parse(rawUser);
      this.editorForm.author = user.name || 'Unknown Author';
      this.editorForm.authorImage = user.image || 'https://i.pravatar.cc/100?img=5';
      this.editorForm.authorId = user.id || '';
    }

    this.lastSavedSnapshot = this.getComparableSnapshot();
  }

  loadDrafts(): void {
    this.draftService.getDrafts().subscribe({
      next: (drafts) => {
        this.drafts = [...drafts].sort((a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      },
      error: () => {
        this.drafts = [];
      }
    });
  }

  toggleVersionHistory(event?: Event): void {
    event?.stopPropagation();
    this.showVersionHistory = !this.showVersionHistory;
  }

  loadDraftForEdit(draft: DraftArticle): void {
    this.editorForm = {
      ...draft,
      keywords: [...(draft.keywords || [])]
    };
    this.draftId = draft.id || null;
    this.keywordInput = '';
    this.showVersionHistory = false;
    this.lastSavedSnapshot = this.getComparableSnapshot();
    this.isPreviewEnabled = true;
    this.buildPreviewArticle();
  }

  addKeyword(): void {
    const value = this.keywordInput.trim();
    if (!value) return;

    const exists = this.editorForm.keywords.some(
      keyword => keyword.toLowerCase() === value.toLowerCase()
    );

    if (!exists) {
      this.editorForm.keywords.push(value);
    }

    this.keywordInput = '';
  }

  removeKeyword(index: number): void {
    this.editorForm.keywords.splice(index, 1);
  }

  private getComparableSnapshot(): string {
    const comparable = {
      title: this.editorForm.title?.trim() || '',
      thumbnail: this.editorForm.thumbnail?.trim() || '',
      description: this.editorForm.description?.trim() || '',
      content: this.editorForm.content?.trim() || '',
      category: this.editorForm.category?.trim() || '',
      keywords: [...(this.editorForm.keywords || [])].map(k => k.trim()).sort(),
      author: this.editorForm.author?.trim() || '',
      authorImage: this.editorForm.authorImage?.trim() || '',
      authorId: this.editorForm.authorId?.trim() || '',
      status: 'draft'
    };

    return JSON.stringify(comparable);
  }

  private hasDraftChanged(): boolean {
    return this.getComparableSnapshot() !== this.lastSavedSnapshot;
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

  private buildPreviewArticle(): void {
    this.previewArticle = {
      id: this.draftId || 'preview',
      title: this.editorForm.title || 'Untitled article',
      thumbnail: this.editorForm.thumbnail || 'https://picsum.photos/1200/600?random=31',
      description: this.editorForm.description || '',
      author: this.editorForm.author || 'Unknown Author',
      authorImage: this.editorForm.authorImage || 'https://i.pravatar.cc/80?img=5',
      publishDate: new Date().toISOString().split('T')[0],
      likes: 1801,
      views: 4101,
      readTime: this.calculateReadTime(this.editorForm.content || ''),
      bookmark: true,
      keywords: [...(this.editorForm.keywords || [])],
      editorFavorite: false,
      liked: true,
      content: this.editorForm.content || ''
    };
  }

  saveDraft(): void {
    if (!this.editorForm.title.trim()) {
      alert('Title is required to save draft.');
      return;
    }

    if (!this.hasDraftChanged()) {
      alert('No changes detected to save.');
      return;
    }

    this.isSaving = true;

    const now = new Date().toISOString();

    const payload: DraftArticle = {
      ...this.editorForm,
      status: 'draft',
      createdAt: this.editorForm.createdAt || now,
      updatedAt: now,
      keywords: [...(this.editorForm.keywords || [])]
    };

    const request$ = this.draftId
      ? this.draftService.updateDraft(this.draftId, payload)
      : this.draftService.createDraft(payload);

    request$.subscribe({
      next: (savedDraft) => {
        this.isSaving = false;
        this.lastSavedSnapshot = JSON.stringify({
          title: savedDraft.title?.trim() || '',
          thumbnail: savedDraft.thumbnail?.trim() || '',
          description: savedDraft.description?.trim() || '',
          content: savedDraft.content?.trim() || '',
          category: savedDraft.category?.trim() || '',
          keywords: [...(savedDraft.keywords || [])].map(k => k.trim()).sort(),
          author: savedDraft.author?.trim() || '',
          authorImage: savedDraft.authorImage?.trim() || '',
          authorId: savedDraft.authorId?.trim() || '',
          status: 'draft'
        });

        this.draftId = savedDraft.id || null;
        this.editorForm = {
          ...savedDraft,
          keywords: [...(savedDraft.keywords || [])]
        };

        this.isPreviewEnabled = true;
        this.buildPreviewArticle();
        this.loadDrafts();

        alert('Your draft is saved. Check your version history to review and edit.');
        this.resetForm();
      },
      error: () => {
        this.isSaving = false;
        alert('Failed to save draft.');
      }
    });
  }

  publishArticle(): void {
    if (!this.editorForm.title.trim()) {
      alert('Title is required before publishing.');
      return;
    }

    if (!this.editorForm.description.trim()) {
      alert('Description is required before publishing.');
      return;
    }

    if (!this.editorForm.content.trim()) {
      alert('Content is required before publishing.');
      return;
    }

    const publishAfterSave = (draft: DraftArticle) => {
      this.isPublishing = true;

      this.draftService.publishDraft(draft).subscribe({
        next: (article) => {
          this.isPublishing = false;
          this.loadDrafts();
          this.resetForm();
          this.router.navigate(['/article-details', article.id]);
        },
        error: () => {
          this.isPublishing = false;
          alert('Failed to publish article.');
        }
      });
    };

    const now = new Date().toISOString();

    const payload: DraftArticle = {
      ...this.editorForm,
      status: 'draft',
      createdAt: this.editorForm.createdAt || now,
      updatedAt: now,
      keywords: [...(this.editorForm.keywords || [])]
    };

    if (this.draftId) {
      this.draftService.updateDraft(this.draftId, payload).subscribe({
        next: (draft) => publishAfterSave(draft),
        error: () => {
          alert('Unable to update draft before publishing.');
        }
      });
    } else {
      this.draftService.createDraft(payload).subscribe({
        next: (draft) => publishAfterSave(draft),
        error: () => {
          alert('Unable to create draft before publishing.');
        }
      });
    }
  }

  openPreview(): void {
    if (!this.isPreviewEnabled) {
      return;
    }

    this.buildPreviewArticle();
    this.isPreviewModalOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closePreview(): void {
    this.isPreviewModalOpen = false;
    document.body.style.overflow = '';
  }

  togglePreviewBookmark(): void {
    if (!this.previewArticle) return;
    this.previewArticle.bookmark = !this.previewArticle.bookmark;
  }

  togglePreviewLike(): void {
    if (!this.previewArticle) return;

    this.previewArticle.liked = !this.previewArticle.liked;
    this.previewArticle.likes += this.previewArticle.liked ? 1 : -1;
  }

  goBack(): void {
    window.history.back();
  }

  previewImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = 'https://picsum.photos/900/300?random=88';
  }

  trackDraft(index: number, draft: DraftArticle): string {
    return draft.id || String(index);
  }

  stopDropdownClose(event: Event): void {
    event.stopPropagation();
  }

  @HostListener('document:click')
  closeDropdownOnOutsideClick(): void {
    this.showVersionHistory = false;
  }

  startNewDraft(): void {
    this.showVersionHistory = false;
    this.isPreviewModalOpen = false;
    this.resetForm();
  }

  decodeHtml(content: string): string {
    if (!content) return '';

    const textarea = document.createElement('textarea');
    textarea.innerHTML = content;
    return textarea.value;
  }
}