import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthorLoginComponent } from '../author-login/author-login';

describe('AuthorLoginComponent', () => {
  let component: AuthorLoginComponent;
  let fixture: ComponentFixture<AuthorLoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthorLoginComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuthorLoginComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
