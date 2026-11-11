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

import { LoadingService } from '../../../services/loading.service';
import { UserService } from '../../../services/userService.service';

import { catchError, finalize, forkJoin, of, Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../services/authService';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ClaimRequestService } from '../../../services/claim-request.service';
import { LeaveRequestService } from '../../../services/leave-request.service';

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
            <p>
              View your personal details, employment information and employee
              benefits.
            </p>
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

        <!-- Tab Navigation -->
        <div class="personal-info-tabs">
          <button
            type="button"
            class="personal-info-tab"
            [class.active]="activeTab === 'personal'"
            (click)="activeTab = 'personal'"
          >
            <i class="pi pi-user"></i>
            <span>Personal Information</span>
          </button>

          <button
            type="button"
            class="personal-info-tab"
            [class.active]="activeTab === 'leave'"
            (click)="activeTab = 'leave'"
          >
            <i class="pi pi-calendar"></i>
            <span>Leave</span>
          </button>

          <button
            type="button"
            class="personal-info-tab"
            [class.active]="activeTab === 'claims'"
            (click)="activeTab = 'claims'"
          >
            <i class="pi pi-wallet"></i>
            <span>Claims</span>
          </button>

          <button
            type="button"
            class="personal-info-tab"
            [class.active]="activeTab === 'security'"
            (click)="activeTab = 'security'"
          >
            <i class="pi pi-shield"></i>
            <span>Account Security</span>
          </button>
        </div>

        <!-- ============================================ -->
        <!-- TAB 1: PERSONAL INFORMATION -->
        <!-- ============================================ -->

        <div class="tab-content" [hidden]="activeTab !== 'personal'">
          <!-- Personal & Employment Information -->
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
          </div>
        </div>

        <!-- ============================================ -->
        <!-- TAB 2: LEAVE -->
        <!-- ============================================ -->

        <div class="tab-content" [hidden]="activeTab !== 'leave'">
          <!-- Leave Balances -->
          <section class="info-card leave-card">
            <div class="info-card-header">
              <div class="info-icon info-icon-green">
                <i class="pi pi-calendar"></i>
              </div>
              <div>
                <h3>Leave Balances</h3>
                <p>
                  Your leave entitlement and remaining balances for
                  {{ currentYear }}
                </p>
              </div>
            </div>

            <div
              class="leave-balance-grid"
              *ngIf="leaveBalances?.length; else noLeaveBalances"
            >
              <div
                class="leave-balance-item"
                *ngFor="let balance of leaveBalances"
              >
                <div class="leave-balance-top">
                  <span class="leave-type-name">
                    {{ balance.leaveTypeName }}
                  </span>
                  <i class="pi pi-calendar-plus"></i>
                </div>

                <div class="leave-remaining">
                  <strong>
                    {{ balance.remainingDays | number: '1.0-2' }}
                  </strong>
                  <span>days remaining</span>
                </div>

                <div class="leave-balance-details">
                  <div>
                    <span>Entitled</span>
                    <strong>
                      {{ balance.entitledDays | number: '1.0-2' }}
                    </strong>
                  </div>

                  <div>
                    <span>Used</span>
                    <strong>
                      {{ balance.usedDays | number: '1.0-2' }}
                    </strong>
                  </div>

                  <div>
                    <span>Pending</span>
                    <strong>
                      {{ balance.pendingDays | number: '1.0-2' }}
                    </strong>
                  </div>
                </div>

                <div class="leave-balance-footer">
                  <span>
                    Carried Forward:
                    {{ balance.carriedForwardDays | number: '1.0-2' }}
                  </span>
                </div>
              </div>
            </div>

            <ng-template #noLeaveBalances>
              <div class="empty-state">
                <i class="pi pi-calendar-times"></i>
                <p>No leave balance information available.</p>
              </div>
            </ng-template>
          </section>

          <!-- Leave Application History -->
          <section class="info-card history-card">
            <div class="info-card-header">
              <div class="info-icon info-icon-blue">
                <i class="pi pi-history"></i>
              </div>
              <div>
                <h3>Leave Application History</h3>
                <p>
                  Your submitted leave applications and their current status
                </p>
              </div>
            </div>

            <div
              class="table-wrapper"
              *ngIf="leaveRequests?.length; else noLeaveRequests"
            >
              <table class="employee-history-table">
                <thead>
                  <tr>
                    <th>Leave Type</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Duration</th>
                    <th>Submitted</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  <tr *ngFor="let leave of leaveRequests">
                    <td>
                      <strong>{{ leave.leaveTypeName || '—' }}</strong>
                      <small *ngIf="leave.isEmergency"> Emergency Leave </small>
                      <small *ngIf="leave.isUnpaid"> Unpaid Leave </small>
                    </td>

                    <td>
                      {{ leave.startDate | date: 'dd MMM yyyy' }}
                    </td>

                    <td>
                      {{ leave.endDate | date: 'dd MMM yyyy' }}
                    </td>

                    <td>
                      {{ leave.totalDays | number: '1.0-2' }}
                      {{ leave.totalDays === 1 ? 'day' : 'days' }}
                    </td>

                    <td>
                      {{ leave.submittedAt | date: 'dd MMM yyyy' }}
                    </td>

                    <td>
                      <span class="history-status">
                        {{ leave.status || 'Unknown' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <ng-template #noLeaveRequests>
              <div class="empty-state">
                <i class="pi pi-inbox"></i>
                <p>You have not submitted any leave applications.</p>
              </div>
            </ng-template>
          </section>
        </div>

        <!-- ============================================ -->
        <!-- TAB 3: CLAIMS -->
        <!-- ============================================ -->

        <div class="tab-content" [hidden]="activeTab !== 'claims'">
          <!-- Claims Overview -->
          <section class="info-card claims-card">
            <div class="info-card-header">
              <div class="info-icon info-icon-orange">
                <i class="pi pi-wallet"></i>
              </div>
              <div>
                <h3>Claims Overview</h3>
                <p>Your claim summary for the current month</p>
              </div>
            </div>

            <div class="claims-summary-grid">
              <!-- Approved Claims -->
              <div class="claims-summary-item">
                <div class="claims-summary-icon approved-icon">
                  <i class="pi pi-check-circle"></i>
                </div>

                <div>
                  <span>Approved Claims</span>
                  <strong>
                    RM
                    {{ claimDashboard?.approvedTotal ?? 0 | number: '1.2-2' }}
                  </strong>
                  <small>
                    {{ claimDashboard?.approvedCount || 0 }} approved
                  </small>
                </div>
              </div>

              <!-- Pending Claims -->
              <div class="claims-summary-item">
                <div class="claims-summary-icon pending-icon">
                  <i class="pi pi-clock"></i>
                </div>

                <div>
                  <span>Pending Claims</span>
                  <strong>
                    RM
                    {{ claimDashboard?.pendingTotal ?? 0 | number: '1.2-2' }}
                  </strong>
                  <small>
                    {{ claimDashboard?.pendingCount || 0 }} pending
                  </small>
                </div>
              </div>
            </div>

            <div class="claims-summary-note">
              <i class="pi pi-info-circle"></i>
              <span>
                Approved claims are not necessarily paid. Please check with HR
                or Finance for payment status.
              </span>
            </div>
          </section>

          <!-- Medical Claims Balance -->
          <section class="info-card medical-card">
            <div class="info-card-header">
              <div class="info-icon info-icon-purple">
                <i class="pi pi-heart"></i>
              </div>
              <div>
                <h3>Medical Claims Balance</h3>
                <p>
                  Your annual medical claim entitlement for {{ currentYear }}
                </p>
              </div>
            </div>

            <div
              class="medical-balance-content"
              *ngIf="medicalBalance; else noMedicalBalance"
            >
              <div class="medical-balance-main">
                <span>Remaining Medical Limit</span>
                <strong>
                  RM {{ medicalBalance.remainingAmount | number: '1.2-2' }}
                </strong>
              </div>

              <div class="medical-balance-details">
                <div>
                  <span>Annual Limit</span>
                  <strong>
                    RM {{ medicalBalance.annualLimit | number: '1.2-2' }}
                  </strong>
                </div>

                <div>
                  <span>Used Amount</span>
                  <strong>
                    RM {{ medicalBalance.usedAmount | number: '1.2-2' }}
                  </strong>
                </div>

                <div>
                  <span>Per Receipt Limit</span>
                  <strong>
                    RM {{ medicalBalance.perReceiptLimit | number: '1.2-2' }}
                  </strong>
                </div>
              </div>

              <div
                class="medical-proration-note"
                *ngIf="medicalBalance.isProrated"
              >
                <i class="pi pi-info-circle"></i>
                Your annual medical limit has been prorated.
              </div>
            </div>

            <ng-template #noMedicalBalance>
              <div class="empty-state">
                <i class="pi pi-heart"></i>
                <p>No medical claim balance information available.</p>
              </div>
            </ng-template>
          </section>

          <!-- Claims History -->
          <section class="info-card history-card">
            <div class="info-card-header">
              <div class="info-icon info-icon-blue">
                <i class="pi pi-file"></i>
              </div>
              <div>
                <h3>Claims History</h3>
                <p>Your submitted claims and their current status</p>
              </div>
            </div>

            <div
              class="table-wrapper"
              *ngIf="claimRequests?.length; else noClaimRequests"
            >
              <table class="employee-history-table">
                <thead>
                  <tr>
                    <th>Claim Type</th>
                    <th>Submitted Date</th>
                    <th>Amount</th>
                    <th>Remarks</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  <tr *ngFor="let claim of claimRequests">
                    <td>
                      <strong>{{ claim.claimType || '—' }}</strong>
                    </td>

                    <td>
                      {{ claim.submittedAt | date: 'dd MMM yyyy' }}
                    </td>

                    <td class="amount-cell">
                      RM {{ claim.totalAmount | number: '1.2-2' }}
                    </td>

                    <td>
                      {{ claim.remarks || '—' }}
                    </td>

                    <td>
                      <span class="history-status">
                        {{ claim.status || 'Unknown' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <ng-template #noClaimRequests>
              <div class="empty-state">
                <i class="pi pi-inbox"></i>
                <p>You have not submitted any claims.</p>
              </div>
            </ng-template>
          </section>
        </div>

        <!-- ============================================ -->
        <!-- TAB 4: ACCOUNT SECURITY -->
        <!-- ============================================ -->

        <div class="tab-content" [hidden]="activeTab !== 'security'">
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
                Please contact your HR administrator for assistance with
                updating your employee details, leave balances or claim
                information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================ -->

    <!-- CHANGE PASSWORD DIALOG -->

    <!-- Keep outside all tab wrappers -->

    <!-- ============================================ -->

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
  private readonly http = inject(HttpClient);

  private readonly leaveRequestService = inject(LeaveRequestService);
  private readonly claimRequestService = inject(ClaimRequestService);

  protected ngUnsubscribe = new Subject<void>();
  activeTab: 'personal' | 'leave' | 'claims' | 'security' = 'personal';
  // ============================================
  // EMPLOYEE INFORMATION
  // ============================================

  selectedUser: any = null;

  // ============================================
  // LEAVE INFORMATION
  // ============================================

  currentYear = new Date().getFullYear();

  leaveBalances: any[] = [];
  leaveRequests: any[] = [];

  // ============================================
  // CLAIM INFORMATION
  // ============================================

  claimDashboard: any = null;
  claimRequests: any[] = [];
  medicalBalance: any = null;

  // Indicates whether any of the additional
  // personal information requests failed.
  dataLoadError = false;

  // ============================================
  // CHANGE PASSWORD
  // ============================================

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

  // ============================================
  // INITIALIZATION
  // ============================================

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

  // ============================================
  // LOAD ALL PERSONAL INFORMATION
  // ============================================

  GetData(): void {
    const employeeId = this.userService.currentUser?.userId;

    if (!employeeId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Unable to identify the current employee.',
        life: 4000,
      });

      return;
    }

    this.currentYear = new Date().getFullYear();
    this.dataLoadError = false;

    this.loadingService.start();

    const currentMonth = new Date().getMonth() + 1;

    forkJoin({
      // Employee profile
      profile: this.userService
        .GetOne({
          Page: 1,
          PageSize: 1,
          OrderBy: null,
          Includes: 'Departments, Hod',
          Select: null,
          Filter: `Id=${employeeId}`,
        })
        .pipe(
          catchError((error) => {
            console.error('Unable to load employee profile:', error);
            this.dataLoadError = true;
            return of(null);
          }),
        ),

      // Employee leave balances
      leaveBalances: this.http
        .get<
          any[]
        >(`${environment.ApiBaseUrl}/LeaveBalance/${employeeId}/${this.currentYear}`)
        .pipe(
          catchError((error) => {
            console.error('Unable to load leave balances:', error);
            this.dataLoadError = true;
            return of([]);
          }),
        ),

      // Employee leave application history
      leaveRequests: this.leaveRequestService.getAll(employeeId).pipe(
        catchError((error) => {
          console.error('Unable to load leave requests:', error);
          this.dataLoadError = true;
          return of([]);
        }),
      ),

      // Claims dashboard for current month
      claimDashboard: this.claimRequestService
        .getDashboard(this.currentYear, currentMonth)
        .pipe(
          catchError((error) => {
            console.error('Unable to load claims dashboard:', error);
            this.dataLoadError = true;
            return of(null);
          }),
        ),

      // Employee claim history
      claimRequests: this.claimRequestService.getAll(employeeId).pipe(
        catchError((error) => {
          console.error('Unable to load claims history:', error);
          this.dataLoadError = true;
          return of([]);
        }),
      ),

      // Employee medical claims balance
      medicalBalance: this.claimRequestService
        .getMedicalBalance(employeeId, this.currentYear)
        .pipe(
          catchError((error) => {
            console.error('Unable to load medical balance:', error);
            this.dataLoadError = true;
            return of(null);
          }),
        ),
    })
      .pipe(
        takeUntil(this.ngUnsubscribe),
        finalize(() => {
          this.loadingService.stop();
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (res) => {
          this.selectedUser = res.profile;

          this.leaveBalances = res.leaveBalances ?? [];

          this.leaveRequests = [...(res.leaveRequests ?? [])].sort(
            (a, b) =>
              new Date(b.submittedAt ?? b.startDate ?? 0).getTime() -
              new Date(a.submittedAt ?? a.startDate ?? 0).getTime(),
          );

          this.claimDashboard = res.claimDashboard;

          this.claimRequests = [...(res.claimRequests ?? [])].sort(
            (a, b) =>
              new Date(b.submittedAt ?? 0).getTime() -
              new Date(a.submittedAt ?? 0).getTime(),
          );

          this.medicalBalance = res.medicalBalance;

          if (this.dataLoadError) {
            this.messageService.add({
              severity: 'warn',
              summary: 'Partial Information',
              detail:
                'Some personal information could not be loaded. Please refresh and try again.',
              life: 4000,
            });
          }

          this.cdr.markForCheck();
        },

        error: (error) => {
          console.error('Unable to load personal information:', error);

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Unable to load personal information.',
            life: 4000,
          });

          this.cdr.markForCheck();
        },
      });
  }

  // ============================================
  // CHANGE PASSWORD
  // ============================================

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

  // ============================================
  // CLEANUP
  // ============================================

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
