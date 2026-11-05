import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { LoadingService } from '../../services/loading.service';
import { UserService } from '../../services/userService.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-personal-info',
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, InputTextModule],
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
                <span>{{
                  selectedUser?.hod?.displayName || 'Not assigned'
                }}</span>
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
  `,
  styleUrl: './personal-info.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonalInfo implements OnInit, OnDestroy {
  private readonly loadingService = inject(LoadingService);
  private readonly userService = inject(UserService);
  private readonly cdr = inject(ChangeDetectorRef);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  FG!: FormGroup;
  selectedUser: any;

  ngOnInit(): void {
    this.GetData();
  }

  GetData() {
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
          // if (res) this.FG.patchValue(res);
          this.selectedUser = res;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loadingService.stop();
        },
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
