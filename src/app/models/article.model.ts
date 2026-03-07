export interface Article {
  id:number
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
  editorFavorite:boolean
}