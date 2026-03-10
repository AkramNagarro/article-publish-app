import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signOut,
  UserCredential
} from 'firebase/auth';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { auth } from '../firebase.config';
import { environment } from '../../environments/environment';

export interface AppLoggedInUser {
  id: string;
  name: string;
  image: string;
  email: string;
  domain: string;
  bio: string;
  password: string;
  userType: 'reader' | 'author';
  provider: 'google' | 'facebook';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isBrowser: boolean;
  private apiUrl = environment.apiUrl;
  private usersApi = `${this.apiUrl}/users`;

  private currentUserSubject = new BehaviorSubject<AppLoggedInUser | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient
  ) {
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
      domain: '',
      bio: '',
      password: '',
      userType,
      provider: 'google'
    };

    const savedUser = await this.upsertUserInDb(appUser);

    if (this.isBrowser) {
      localStorage.setItem('loggedInUser', JSON.stringify(savedUser));
    }

    this.currentUserSubject.next(savedUser);
    return savedUser;
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
      domain: '',
      bio: '',
      password: '',
      userType,
      provider: 'facebook'
    };

    const savedUser = await this.upsertUserInDb(appUser);

    if (this.isBrowser) {
      localStorage.setItem('loggedInUser', JSON.stringify(savedUser));
    }

    this.currentUserSubject.next(savedUser);
    return savedUser;
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

  private async upsertUserInDb(user: AppLoggedInUser): Promise<AppLoggedInUser> {
    try {
      const existingUsers = await firstValueFrom(
        this.http.get<AppLoggedInUser[]>(`${this.usersApi}?id=${user.id}`)
      );

      if (existingUsers.length > 0) {
        const existingUser = existingUsers[0];

        const updatedUser: AppLoggedInUser = {
          ...existingUser,
          name: user.name,
          image: user.image,
          email: user.email,
          userType: user.userType,
          provider: user.provider,
          domain: existingUser.domain || '',
          bio: existingUser.bio || '',
          password: existingUser.password || ''
        };

        await firstValueFrom(
          this.http.put<AppLoggedInUser>(`${this.usersApi}/${existingUser.id}`, updatedUser)
        );

        return updatedUser;
      }

      await firstValueFrom(
        this.http.post<AppLoggedInUser>(this.usersApi, user)
      );

      return user;
    } catch (error) {
      console.error('Failed to sync user in db.json', error);
      return user;
    }
  }
}