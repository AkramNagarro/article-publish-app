import { Routes } from '@angular/router';
import { Login } from './login/login';
import { authGuard } from './auth-guard';
import { Home } from './home/home';

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

  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: '**', redirectTo: 'login' }
];