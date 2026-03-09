import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReaderLogin } from './reader-login';

describe('ReaderLogin', () => {
  let component: ReaderLogin;
  let fixture: ComponentFixture<ReaderLogin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReaderLogin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReaderLogin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
