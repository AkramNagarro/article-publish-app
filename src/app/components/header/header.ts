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

    if (!keyword) return;

    this.router.navigate(['/home'], {
      queryParams: { search: keyword }
    });
  }

}