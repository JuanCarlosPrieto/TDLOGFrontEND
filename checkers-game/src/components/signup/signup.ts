import { Component } from '@angular/core';
import { FormBuilder, Validators, AbstractControl, ValidationErrors, FormGroup } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/Auth/auth-service';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// Validador para comparar contraseña y confirmación
function matchPasswords(group: AbstractControl): ValidationErrors | null {
  const pass = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pass && confirm && pass !== confirm ? { passwordsMismatch: true } : null;
}

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './signup.html',
  styleUrls: ['./signup.css'] // 👈 OJO: styleUrls, no styleUrl
})
export class Signup {
  isSubmitting = false;
  showPassword = false;
  showConfirm = false;
  apiError: string | null = null;

  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(24)]],
      email: ['', [Validators.required, Validators.email]],

      // NUEVOS CAMPOS
      name: ['', [Validators.maxLength(100)]],
      surname: ['', [Validators.maxLength(100)]],
      birthdate: [''], // el <input type="date"> te devuelve 'YYYY-MM-DD'
      country: ['', [Validators.maxLength(80)]],

      passwords: this.fb.group(
        {
          password: [
            '',
            [
              Validators.required,
              Validators.minLength(8),
              Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/),
            ],
          ],
          confirmPassword: ['', [Validators.required]],
        },
        { validators: matchPasswords }
      ),

      terms: [false, [Validators.requiredTrue]],
    });
  }

  // Getters para usar en el HTML
  get f() { return this.form.controls; }
  get pwGroup() { return this.form.get('passwords') as FormGroup; }
  get passwordCtrl() { return this.pwGroup.get('password'); }
  get confirmCtrl() { return this.pwGroup.get('confirmPassword'); }

  togglePassword() { this.showPassword = !this.showPassword; }
  toggleConfirm() { this.showConfirm = !this.showConfirm; }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.apiError = null;
    this.isSubmitting = true;

    const payload = {
      username: this.f['username'].value,
      email: this.f['email'].value,
      password: this.passwordCtrl?.value,

      // Campos extra que tienes en la BD
      name: this.f['name'].value || null,
      surname: this.f['surname'].value || null,
      birthdate: this.f['birthdate'].value || null, // ya viene 'YYYY-MM-DD'
      country: this.f['country'].value || null,
    };

    this.auth.register(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/perfil']);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.apiError = err?.error?.detail || 'No se pudo crear la cuenta. Intenta de nuevo.';
      },
    });
  }
}
