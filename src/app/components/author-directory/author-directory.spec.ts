import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthorDirectory } from './author-directory';

describe('AuthorDirectory', () => {
  let component: AuthorDirectory;
  let fixture: ComponentFixture<AuthorDirectory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthorDirectory]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuthorDirectory);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
