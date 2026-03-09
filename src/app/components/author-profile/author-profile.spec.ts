import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthorProfile } from './author-profile';

describe('AuthorProfile', () => {
  let component: AuthorProfile;
  let fixture: ComponentFixture<AuthorProfile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthorProfile]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuthorProfile);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
