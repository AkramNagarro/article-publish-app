import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-header',
  templateUrl: './header.html',
  imports: [FormsModule],
  styleUrls: ['./header.scss']
})
export class Header {
  searchText = '';

  constructor(private router: Router) {}

  search() {
    const keyword = this.searchText.trim();

    // empty search -> go to home page
    if (!keyword) {
      this.router.navigate(['/home']);
      return;
    }

    // search with keyword -> go to home with query param
    this.router.navigate(['/home'], {
      queryParams: { search: keyword }
    });
  }

  goToProfile(): void {
    this.router.navigate(['/author-profile']);
  }
}