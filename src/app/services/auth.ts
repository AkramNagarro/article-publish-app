import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signOut,
  UserCredential
} from 'firebase/auth';
import { BehaviorSubject } from 'rxjs';
import { auth } from '../firebase.config';

export interface AppLoggedInUser {
  id: string;
  name: string;
  image: string;
  email: string;
  userType: 'reader' | 'author';
  provider: 'google' | 'facebook';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isBrowser: boolean;
  private currentUserSubject = new BehaviorSubject<AppLoggedInUser | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);

    if (this.isBrowser) {
      this.currentUserSubject.next(this.getStoredUser());
    }
  }

  async loginWithGoogle(userType: 'reader' | 'author'): Promise<AppLoggedInUser> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    const result: UserCredential = await signInWithPopup(auth, provider);
    const user = result.user;

    const appUser: AppLoggedInUser = {
      id: user.uid,
      name: user.displayName || 'Google User',
      image: user.photoURL || 'https://i.pravatar.cc/400?img=5',
      email: user.email || '',
      userType,
      provider: 'google'
    };

    if (this.isBrowser) {
      localStorage.setItem('loggedInUser', JSON.stringify(appUser));
    }

    this.currentUserSubject.next(appUser);
    return appUser;
  }

  async loginWithFacebook(userType: 'reader' | 'author'): Promise<AppLoggedInUser> {
    const provider = new FacebookAuthProvider();

    const result: UserCredential = await signInWithPopup(auth, provider);
    const user = result.user;

    const appUser: AppLoggedInUser = {
      id: user.uid,
      name: user.displayName || 'Facebook User',
      image: user.photoURL || 'https://i.pravatar.cc/400?img=5',
      email: user.email || '',
      userType,
      provider: 'facebook'
    };

    if (this.isBrowser) {
      localStorage.setItem('loggedInUser', JSON.stringify(appUser));
    }

    this.currentUserSubject.next(appUser);
    return appUser;
  }

  async logout(): Promise<void> {
    if (this.isBrowser) {
      localStorage.removeItem('loggedInUser');
    }

    this.currentUserSubject.next(null);

    try {
      await signOut(auth);
    } catch (error) {
      console.error('Firebase signOut failed:', error);
    }
  }

  getStoredUser(): AppLoggedInUser | null {
    if (!this.isBrowser) return null;

    const raw = localStorage.getItem('loggedInUser');
    if (!raw) return null;

    try {
      return JSON.parse(raw) as AppLoggedInUser;
    } catch {
      return null;
    }
  }
}