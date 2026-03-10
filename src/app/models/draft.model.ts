export interface DraftArticle {
  id?: string;
  title: string;
  thumbnail: string;
  description: string;
  content: string;
  category: string;
  keywords: string[];
  author: string;
  authorImage: string;
  authorId?: string;
  status: 'draft';
  createdAt: string;
  updatedAt: string;
  editorFavorite: boolean;
  readTime: string;
}