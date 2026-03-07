import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../services/auth';
import { inject } from '@angular/core';
import { Router } from '@angular/router';


@Component({
  selector: 'app-login',
  imports:[ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class Login {

  loginForm: FormGroup;
  submitted = false;
  authService = inject(AuthService);
  router= inject(Router);

  constructor(private fb: FormBuilder) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  onSubmit() {
    this.submitted = true;

    if (this.loginForm.invalid) return;

    const { email, password } = this.loginForm.value;

    this.authService.login(email!, password!)
      .subscribe(users => {
        if (users.length > 0) {
          this.authService.saveSession(users[0]);
          this.router.navigate(['home']);
        } else {
          alert('Invalid Credentials');
        }
      });
    
  }
}