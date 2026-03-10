import { Routes } from '@angular/router';
import { authGuard } from './auth-guard';
import { Home } from './home/home';
import { ReaderLoginComponent } from './components/reader-login/reader-login';
import { AuthorLoginComponent } from './components/author-login/author-login';
import { ArticleDetails } from './components/article-details/article-details';
import { AuthorDirectory } from './components/author-directory/author-directory';
import { AuthorProfile } from './components/author-profile/author-profile';
import { ArticleEditor } from './components/article-editor/article-editor';
export const routes: Routes = [
  {
    path: 'reader-login',
    component: ReaderLoginComponent
  },
  {
    path: 'author-login',
    component: AuthorLoginComponent
  },

  {
    path: 'home',
    component: Home,
    canActivate: [authGuard]
  },
  {
    path: 'author-profile',
    component: AuthorProfile,
    canActivate: [authGuard]
  },
  { path: 'authors', component: AuthorDirectory },

  {
    path: 'article-details/:id',
    component: ArticleDetails,
    canActivate: [authGuard]
  },

  {
    path: 'editor',
    component: ArticleEditor,
    canActivate: [authGuard]
  },
  {
    path: 'editor/:id',
    component: ArticleEditor,
    canActivate: [authGuard]
  },

  {
    path: '',
    redirectTo: 'reader-login',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'reader-login'
  }
];