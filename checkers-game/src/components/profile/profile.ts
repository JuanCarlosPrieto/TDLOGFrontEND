import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService, User } from '../../services/Auth/auth-service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit {
  form: FormGroup;
  isSubmitting = false;
  apiError: string | null = null;
  apiSuccess: string | null = null;
  user: User | null = null;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService
  ) {
    this.form = this.fb.group({
      username: [
        '',
        [Validators.required, Validators.minLength(3), Validators.maxLength(24)]
      ],
      name: ['', [Validators.maxLength(100)]],
      surname: ['', [Validators.maxLength(100)]],
      // email is read-only in the UI; we do not send it in the payload
      email: [''],
      birthdate: [''],
      country: ['', [Validators.maxLength(80)]]
    });
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  get f() {
    return this.form.controls;
  }

  loadProfile(): void {
    this.apiError = null;
    this.apiSuccess = null;

    this.auth.checkSession().subscribe({
      next: (user) => {
        this.user = user;
        
        if (user) {
          this.form.patchValue({
            username: user.username,
            name: user.name,
            surname: user.surname ?? '',
            email: user.email,
            birthdate: user.birthdate ?? '',
            country: user.country ?? ''
          });
        }        
      },
      error: (err) => {
        console.error(err);
        this.apiError = 'Could not load your profile. Please try again.';
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.apiError = null;
    this.apiSuccess = null;

    const payload = {
      username: this.form.get('username')?.value,
      name: this.form.get('name')?.value,
      surname: this.form.get('surname')?.value,
      birthdate: this.form.get('birthdate')?.value,
      country: this.form.get('country')?.value
      // email is intentionally NOT sent
    };

    this.auth.updateProfile(payload).subscribe({
      next: (updatedUser) => {
        this.isSubmitting = false;
        this.apiSuccess = 'Profile updated successfully.';
        this.user = updatedUser;

        this.form.patchValue({
          username: updatedUser.username,
          name: updatedUser.name ?? '',
          surname: updatedUser.surname ?? '',
          email: updatedUser.email,
          birthdate: updatedUser.birthdate ?? '',
          country: updatedUser.country ?? ''
        });
      },
      error: (err) => {
        console.error(err);
        this.isSubmitting = false;
        this.apiError = err?.error?.detail ?? 'Could not update your profile.';
      }
    });
  }
}
