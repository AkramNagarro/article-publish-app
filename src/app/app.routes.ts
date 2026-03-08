import { Routes } from '@angular/router';
import { Login } from './login/login';
import { authGuard } from './auth-guard';
import { Home } from './home/home';
import { AuthorDirectory } from './components/author-directory/author-directory';
import { ArticleDetails } from './components/article-details/article-details';

export const routes: Routes = [
  
  { path: 'login', component: Login },

  {
    path: 'home',
    loadComponent: () =>
      import('./home/home').then(m => m.Home),
  },

  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },

  { path: 'articles', component: Home },

  {
    path: 'authors',
    component: AuthorDirectory
  },

  {
    path: 'article-details/:id',
    component: ArticleDetails
  },

  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: '**', redirectTo: 'login' }
];