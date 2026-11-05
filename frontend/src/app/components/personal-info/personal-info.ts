import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';

import { LoadingService } from '../../services/loading.service';
import { UserService } from '../../services/userService.service';

import { finalize, Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/authService';

@Component({
  selector: 'app-personal-info',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    DialogModule,
  ],
  template: `
    <div class="personal-info-page">
      <div class="personal-info-container">
        <!-- Page Heading -->
        <div class="page-heading">
          <div>
            <h1>Personal Information</h1>
            <p>View your personal details and employment information.</p>
          </div>
        </div>

        <!-- Employee Profile Summary -->
        <section class="employee-summary">
          <div class="employee-avatar">
            {{ selectedUser?.fullName?.charAt(0) || 'U' }}
          </div>

          <div class="employee-summary-info">
            <h2>{{ selectedUser?.fullName || 'Employee Name' }}</h2>
            <p>{{ selectedUser?.jobTitle || 'Employee' }}</p>

            <div class="employee-summary-meta">
              <span>
                <i class="pi pi-id-card"></i>
                {{ selectedUser?.employeeNo || '—' }}
              </span>

              <span>
                <i class="pi pi-envelope"></i>
                {{ selectedUser?.email || '—' }}
              </span>
            </div>
          </div>

          <div class="employee-status">
            <span class="status-dot"></span>
            Employee
          </div>
        </section>

        <!-- Information Sections -->
        <div class="information-grid">
          <!-- Basic Information -->
          <section class="info-card">
            <div class="info-card-header">
              <div class="info-icon info-icon-blue">
                <i class="pi pi-user"></i>
              </div>

              <div>
                <h3>Basic Information</h3>
                <p>Personal identification details</p>
              </div>
            </div>

            <div class="info-card-body">
              <div class="info-field">
                <label>Full Name</label>
                <span>{{ selectedUser?.fullName || '—' }}</span>
              </div>

              <div class="info-field">
                <label>Display Name</label>
                <span>{{ selectedUser?.displayName || '—' }}</span>
              </div>

              <div class="info-field">
                <label>Employee ID</label>
                <span>{{ selectedUser?.employeeNo || '—' }}</span>
              </div>
            </div>
          </section>

          <!-- Contact Details -->
          <section class="info-card">
            <div class="info-card-header">
              <div class="info-icon info-icon-purple">
                <i class="pi pi-address-book"></i>
              </div>

              <div>
                <h3>Contact Details</h3>
                <p>Your contact information</p>
              </div>
            </div>

            <div class="info-card-body">
              <div class="info-field">
                <label>Corporate Email</label>
                <span class="break-value">
                  {{ selectedUser?.email || '—' }}
                </span>
              </div>

              <div class="info-field">
                <label>Phone Number</label>
                <span>{{ selectedUser?.contactNo || '—' }}</span>
              </div>
            </div>
          </section>

          <!-- Professional Information -->
          <section class="info-card">
            <div class="info-card-header">
              <div class="info-icon info-icon-green">
                <i class="pi pi-briefcase"></i>
              </div>

              <div>
                <h3>Professional Information</h3>
                <p>Employment details</p>
              </div>
            </div>

            <div class="info-card-body">
              <div class="info-field">
                <label>Job Title</label>
                <span>{{ selectedUser?.jobTitle || '—' }}</span>
              </div>

              <div class="info-field">
                <label>Reporting Manager</label>
                <span>
                  {{ selectedUser?.hod?.displayName || 'Not assigned' }}
                </span>
              </div>

              <div class="info-field">
                <label>Date Joined</label>
                <span>
                  {{
                    selectedUser?.joinedDate
                      ? (selectedUser.joinedDate | date: 'dd MMM yyyy')
                      : '—'
                  }}
                </span>
              </div>
            </div>
          </section>
        </div>

        <!-- Department Information -->
        <section class="info-card department-card">
          <div class="info-card-header">
            <div class="info-icon info-icon-orange">
              <i class="pi pi-sitemap"></i>
            </div>

            <div>
              <h3>Department Information</h3>
              <p>Departments assigned to your employee profile</p>
            </div>
          </div>

          <div class="department-content">
            <ng-container
              *ngIf="selectedUser?.departments?.length; else noDepartments"
            >
              <span
                class="department-tag"
                *ngFor="let department of selectedUser.departments"
              >
                <i class="pi pi-building"></i>
                {{ department?.name }}
              </span>
            </ng-container>

            <ng-template #noDepartments>
              <span class="empty-text">No department assigned.</span>
            </ng-template>
          </div>
        </section>

        <!-- Account Security -->
        <section class="info-card security-card">
          <div class="info-card-header">
            <div class="info-icon info-icon-security">
              <i class="pi pi-shield"></i>
            </div>

            <div>
              <h3>Account Security</h3>
              <p>Manage your account credentials and security.</p>
            </div>
          </div>

          <div class="security-content">
            <div class="security-info">
              <div class="security-icon">
                <i class="pi pi-lock"></i>
              </div>

              <div>
                <strong>Password</strong>
                <p>
                  Keep your account secure by updating your password
                  periodically.
                </p>
              </div>
            </div>

            <button
              pButton
              type="button"
              label="Change Password"
              icon="pi pi-key"
              severity="secondary"
              [outlined]="true"
              (click)="openChangePassword()"
            ></button>
          </div>
        </section>

        <!-- Information Notice -->
        <div class="profile-notice">
          <i class="pi pi-info-circle"></i>

          <div>
            <strong>Need to update your information?</strong>
            <p>
              Please contact your HR administrator for assistance with updating
              your employee details.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Change Password Dialog -->
    <p-dialog
      header="Change Password"
      [(visible)]="isChangePasswordVisible"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '450px', maxWidth: '95vw' }"
      [breakpoints]="{ '640px': '95vw' }"
      (onHide)="resetPasswordForm()"
    >
      <form
        [formGroup]="passwordForm"
        (ngSubmit)="submitChangePassword()"
        class="flex flex-col gap-4 pt-2"
      >
        <div class="text-sm text-gray-500">
          Enter your current password and choose a new password for your
          account.
        </div>

        <!-- Current Password -->
        <div class="flex flex-col gap-2">
          <label for="currentPassword" class="font-medium text-sm">
            Current Password
          </label>

          <p-password
            inputId="currentPassword"
            formControlName="currentPassword"
            placeholder="Enter current password"
            [feedback]="false"
            [toggleMask]="true"
            styleClass="w-full"
            inputStyleClass="w-full"
          ></p-password>
          <small
            class="text-red-500"
            *ngIf="
              passwordForm.get('currentPassword')?.touched &&
              passwordForm.get('currentPassword')?.hasError('incorrectPassword')
            "
          >
            Current password is incorrect.
          </small>
          <small
            class="text-red-500"
            *ngIf="
              passwordForm.get('currentPassword')?.touched &&
              passwordForm.get('currentPassword')?.hasError('required')
            "
          >
            Current password is required.
          </small>
        </div>

        <!-- New Password -->
        <div class="flex flex-col gap-2">
          <label for="newPassword" class="font-medium text-sm">
            New Password
          </label>

          <p-password
            inputId="newPassword"
            formControlName="newPassword"
            placeholder="Enter new password"
            [toggleMask]="true"
            [feedback]="true"
            styleClass="w-full"
            inputStyleClass="w-full"
          ></p-password>
          <small
            class="text-red-500"
            *ngIf="
              passwordForm.get('newPassword')?.touched &&
              passwordForm.get('newPassword')?.hasError('sameAsCurrent')
            "
          >
            New password must be different from your current password.
          </small>

          <small
            class="text-red-500"
            *ngIf="
              passwordForm.get('newPassword')?.touched &&
              passwordForm.get('newPassword')?.hasError('required')
            "
          >
            New password is required.
          </small>

          <small
            class="text-red-500"
            *ngIf="
              passwordForm.get('newPassword')?.touched &&
              passwordForm.get('newPassword')?.hasError('minlength')
            "
          >
            Password must contain at least 8 characters.
          </small>
        </div>

        <!-- Confirm Password -->
        <div class="flex flex-col gap-2">
          <label for="confirmPassword" class="font-medium text-sm">
            Confirm New Password
          </label>

          <p-password
            inputId="confirmPassword"
            formControlName="confirmPassword"
            placeholder="Re-enter new password"
            [feedback]="false"
            [toggleMask]="true"
            styleClass="w-full"
            inputStyleClass="w-full"
          ></p-password>

          <small
            class="text-red-500"
            *ngIf="
              passwordForm.get('confirmPassword')?.touched &&
              passwordForm.hasError('passwordMismatch')
            "
          >
            Passwords do not match.
          </small>

          <small
            class="text-red-500"
            *ngIf="
              passwordForm.get('confirmPassword')?.touched &&
              passwordForm.get('confirmPassword')?.hasError('required')
            "
          >
            Please confirm your new password.
          </small>
        </div>

        <!-- Dialog Actions -->
        <div class="flex justify-end gap-2 pt-3 border-t border-gray-200">
          <button
            pButton
            type="button"
            label="Cancel"
            severity="secondary"
            [outlined]="true"
            (click)="isChangePasswordVisible = false"
          ></button>

          <button
            pButton
            type="submit"
            label="Save Changes"
            icon="pi pi-save"
            class="bg-blue-900! border-none! hover:bg-blue-700!"
            [loading]="isChangingPassword"
            [disabled]="isChangingPassword"
          ></button>
        </div>
      </form>
    </p-dialog>
  `,
  styleUrl: './personal-info.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonalInfo implements OnInit, OnDestroy {
  private readonly loadingService = inject(LoadingService);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messageService = inject(MessageService);

  protected ngUnsubscribe = new Subject<void>();

  selectedUser: any;

  isChangePasswordVisible = false;
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

  ngOnInit(): void {
    this.GetData();
    this.passwordForm
      .get('currentPassword')
      ?.valueChanges.pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        const control = this.passwordForm.get('currentPassword');

        if (control?.hasError('incorrectPassword')) {
          control.setErrors(null);
        }
      });
  }

  GetData(): void {
    this.loadingService.start();

    this.userService
      .GetOne({
        Page: 1,
        PageSize: 1,
        OrderBy: null,
        Includes: 'Departments, Hod',
        Select: null,
        Filter: `Id=${this.userService.currentUser?.userId}`,
      })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();
          this.selectedUser = res;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loadingService.stop();

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Unable to load personal information.',
          });

          this.cdr.markForCheck();
        },
      });
  }

  openChangePassword(): void {
    this.resetPasswordForm();
    this.isChangePasswordVisible = true;
  }

  resetPasswordForm(): void {
    this.passwordForm.reset();
    this.isChangingPassword = false;
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
        takeUntil(this.ngUnsubscribe),
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

          this.isChangePasswordVisible = false;
          this.resetPasswordForm();

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
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
