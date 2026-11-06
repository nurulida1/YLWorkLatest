import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { MessageService } from 'primeng/api';

import { Subject, finalize, takeUntil } from 'rxjs';

import { UserService } from '../../../services/userService.service';
import { AuthService } from '../../../services/authService';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, PasswordModule],
  template: `
    <div class="min-h-screen bg-slate-50 px-4 py-5 pb-10">
      <!-- Header -->
      <div class="flex items-center gap-3 mb-6">
        <div>
          <h1 class="text-xl font-bold text-slate-900">Change Password</h1>
          <p class="text-sm text-slate-500 mt-1">
            Update your account password
          </p>
        </div>
      </div>

      <!-- Security Banner -->
      <div class="rounded-2xl bg-blue-50 border border-blue-100 p-4 mb-6">
        <div class="flex items-start gap-3">
          <div
            class="w-11 h-11 shrink-0 rounded-xl bg-blue-100
                   flex items-center justify-center"
          >
            <i class="pi pi-shield text-xl text-blue-700"></i>
          </div>

          <div>
            <h2 class="font-semibold text-blue-900 text-sm">
              Keep your account secure
            </h2>

            <p class="text-xs text-blue-700 leading-relaxed mt-1">
              Use a strong password that you don't use on other websites or
              applications.
            </p>
          </div>
        </div>
      </div>

      <!-- Password Form -->
      <form
        [formGroup]="passwordForm"
        (ngSubmit)="submitChangePassword()"
        class="flex flex-col gap-5"
      >
        <!-- Current Password -->
        <section
          class="bg-white rounded-2xl border border-slate-200
                 p-4 shadow-sm"
        >
          <div class="flex items-center gap-2 mb-4">
            <div
              class="w-9 h-9 rounded-xl bg-slate-100
                     flex items-center justify-center"
            >
              <i class="pi pi-lock text-slate-600"></i>
            </div>

            <div>
              <h2 class="font-semibold text-slate-800 text-sm">
                Current Password
              </h2>
              <p class="text-xs text-slate-500">Enter your existing password</p>
            </div>
          </div>

          <p-password
            formControlName="currentPassword"
            placeholder="Enter current password"
            [feedback]="false"
            [toggleMask]="true"
            styleClass="w-full"
            inputStyleClass="w-full"
          ></p-password>

          @if (
            passwordForm.get('currentPassword')?.touched &&
            passwordForm.get('currentPassword')?.hasError('required')
          ) {
            <small class="text-red-500 block mt-2">
              Current password is required.
            </small>
          }

          @if (
            passwordForm.get('currentPassword')?.hasError('incorrectPassword')
          ) {
            <small class="text-red-500 block mt-2">
              Current password is incorrect.
            </small>
          }
        </section>

        <!-- New Password -->
        <section
          class="bg-white rounded-2xl border border-slate-200
                 p-4 shadow-sm"
        >
          <div class="flex items-center gap-2 mb-4">
            <div
              class="w-9 h-9 rounded-xl bg-blue-50
                     flex items-center justify-center"
            >
              <i class="pi pi-key text-blue-600"></i>
            </div>

            <div>
              <h2 class="font-semibold text-slate-800 text-sm">New Password</h2>
              <p class="text-xs text-slate-500">Create a new password</p>
            </div>
          </div>

          <p-password
            formControlName="newPassword"
            placeholder="Enter new password"
            [toggleMask]="true"
            [feedback]="true"
            styleClass="w-full"
            inputStyleClass="w-full"
          ></p-password>

          @if (
            passwordForm.get('newPassword')?.touched &&
            passwordForm.get('newPassword')?.hasError('required')
          ) {
            <small class="text-red-500 block mt-2">
              New password is required.
            </small>
          }

          @if (
            passwordForm.get('newPassword')?.touched &&
            passwordForm.get('newPassword')?.hasError('minlength')
          ) {
            <small class="text-red-500 block mt-2">
              Password must contain at least 8 characters.
            </small>
          }

          @if (
            passwordForm.get('newPassword')?.touched &&
            passwordForm.get('newPassword')?.hasError('sameAsCurrent')
          ) {
            <small class="text-red-500 block mt-2">
              New password must be different from your current password.
            </small>
          }
        </section>

        <!-- Confirm Password -->
        <section
          class="bg-white rounded-2xl border border-slate-200
                 p-4 shadow-sm"
        >
          <div class="flex items-center gap-2 mb-4">
            <div
              class="w-9 h-9 rounded-xl bg-purple-50
                     flex items-center justify-center"
            >
              <i class="pi pi-check-circle text-purple-600"></i>
            </div>

            <div>
              <h2 class="font-semibold text-slate-800 text-sm">
                Confirm New Password
              </h2>
              <p class="text-xs text-slate-500">Re-enter your new password</p>
            </div>
          </div>

          <p-password
            formControlName="confirmPassword"
            placeholder="Confirm new password"
            [feedback]="false"
            [toggleMask]="true"
            styleClass="w-full"
            inputStyleClass="w-full"
          ></p-password>

          @if (
            passwordForm.get('confirmPassword')?.touched &&
            passwordForm.get('confirmPassword')?.hasError('required')
          ) {
            <small class="text-red-500 block mt-2">
              Please confirm your new password.
            </small>
          }

          @if (
            passwordForm.get('confirmPassword')?.touched &&
            passwordForm.hasError('passwordMismatch')
          ) {
            <small class="text-red-500 block mt-2">
              Passwords do not match.
            </small>
          }
        </section>

        <!-- Password Requirements -->
        <div class="rounded-xl border border-slate-200 bg-white p-4">
          <h3 class="text-sm font-semibold text-slate-700 mb-3">
            Password Requirements
          </h3>

          <div class="flex items-center gap-2 text-xs text-slate-500">
            <i class="pi pi-check-circle text-emerald-500"></i>
            At least 8 characters
          </div>

          <div class="flex items-center gap-2 text-xs text-slate-500 mt-2">
            <i class="pi pi-check-circle text-emerald-500"></i>
            Different from your current password
          </div>

          <div class="flex items-center gap-2 text-xs text-slate-500 mt-2">
            <i class="pi pi-check-circle text-emerald-500"></i>
            Both new password fields must match
          </div>
        </div>

        <!-- Submit Button -->
        <p-button
          type="submit"
          label="Update Password"
          icon="pi pi-lock"
          [loading]="isChangingPassword"
          [disabled]="isChangingPassword"
          styleClass="w-full py-3! rounded-xl! bg-blue-700! border-none! hover:bg-blue-500!"
        ></p-button>

        <p class="text-center text-xs text-slate-400">
          Your session will end after your password is successfully changed.
        </p>
      </form>
    </div>
  `,
  styleUrl: './change-password.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangePassword implements OnDestroy {
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly destroy$ = new Subject<void>();

  isChangingPassword = false;

  passwordForm = new FormGroup(
    {
      currentPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),

      newPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(8)],
      }),

      confirmPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    {
      validators: (form) => {
        const newPassword = form.get('newPassword')?.value;
        const confirmPassword = form.get('confirmPassword')?.value;

        if (!confirmPassword || newPassword === confirmPassword) {
          return null;
        }

        return { passwordMismatch: true };
      },
    },
  );

  constructor() {
    this.passwordForm
      .get('currentPassword')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const control = this.passwordForm.get('currentPassword');

        if (control?.hasError('incorrectPassword')) {
          control.setErrors(null);
        }
      });

    this.passwordForm
      .get('newPassword')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const control = this.passwordForm.get('newPassword');

        if (control?.hasError('sameAsCurrent')) {
          control.setErrors(null);
        }
      });
  }

  submitChangePassword(): void {
    if (this.passwordForm.invalid || this.isChangingPassword) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword, confirmPassword } =
      this.passwordForm.getRawValue();

    if (currentPassword === newPassword) {
      this.passwordForm.get('newPassword')?.setErrors({
        sameAsCurrent: true,
      });

      this.passwordForm.get('newPassword')?.markAsTouched();
      return;
    }

    this.isChangingPassword = true;
    this.cdr.markForCheck();

    this.userService
      .ChangePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isChangingPassword = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (res) => {
          if (!res.success) {
            const message = res.message || 'Unable to change password.';

            if (message === 'Current password is incorrect.') {
              this.passwordForm
                .get('currentPassword')
                ?.setErrors({ incorrectPassword: true });

              this.passwordForm.get('currentPassword')?.markAsTouched();
            } else if (message === 'Passwords do not match.') {
              this.passwordForm.get('confirmPassword')?.markAsTouched();
            } else if (
              message ===
              'New password must be different from current password.'
            ) {
              this.passwordForm
                .get('newPassword')
                ?.setErrors({ sameAsCurrent: true });

              this.passwordForm.get('newPassword')?.markAsTouched();
            } else {
              this.messageService.add({
                severity: 'error',
                summary: 'Password Change Failed',
                detail: message,
                life: 4000,
              });
            }

            this.cdr.markForCheck();
            return;
          }

          this.messageService.add({
            severity: 'success',
            summary: 'Password Changed',
            detail: res.message,
            life: 4000,
          });

          this.passwordForm.reset();
          this.cdr.markForCheck();

          this.authService.logoutAfterPasswordChange();
        },

        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Server Error',
            detail:
              err?.error?.message ||
              'Unable to change your password. Please try again.',
            life: 4000,
          });

          this.cdr.markForCheck();
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
