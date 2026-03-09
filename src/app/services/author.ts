import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map} from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthorService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  getAuthors(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl + '/users').pipe(
      map(users => users.filter(user => user.userType === 'author'))
    );
  }
}