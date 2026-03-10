import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'reader-login',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'author-login',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'home',
    renderMode: RenderMode.Server
  },
  {
    path: 'author-profile',
    renderMode: RenderMode.Server
  },
  {
    path: 'authors',
    renderMode: RenderMode.Server
  },
  {
    path: 'article-details/:id',
    renderMode: RenderMode.Server
  },
  {
    path: 'editor',
    renderMode: RenderMode.Server
  },
  {
    path: 'editor/:id',
    renderMode: RenderMode.Server
  },
  {
    path: '**',
    renderMode: RenderMode.Server
  }
];