export interface Article {
  id:string
  title:string
  thumbnail:string
  description:string
  author:string
  authorImage:string
  publishDate:string
  likes:number
  views:number
  readTime:string
  bookmark:boolean
  keywords: string[],
  editorFavorite:boolean,
  content: string;
  liked: boolean;
}