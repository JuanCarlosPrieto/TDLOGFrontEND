import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/Auth/auth-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  loginForm: FormGroup;
  submitted = false;
  apiError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit() {
    this.submitted = true;
    this.apiError = null;

    if (this.loginForm.valid) {
      console.log('Datos del login:', this.loginForm.value);
      this.auth.login(this.loginForm.value).subscribe({
      next: () => {
        this.router.navigate(['/perfil']);
      },
      error: (err) => {
        console.error(err);
        this.apiError = err?.error?.detail || 'Login failed. Please try again.';
      }
    });
    }
  }

  get f() {
    return this.loginForm.controls;
  }
}
