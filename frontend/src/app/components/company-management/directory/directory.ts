import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { InputTextModule } from 'primeng/inputtext';

import { DepartmentService } from '../../../services/departmentService';
import { LoadingService } from '../../../services/loading.service';
import { UserService } from '../../../services/userService.service';

interface DirectoryDepartment {
  id?: string;
  name: string;
}

interface DirectoryUser {
  id?: string;
  fullName?: string;
  email?: string;
  jobTitle?: string;
  departments?: Array<string | { name?: string }>;
}

@Component({
  selector: 'app-directory',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, RouterLink],
  template: `
    <div class="directory-page">
      <!-- Header -->
      <section class="directory-header">
        <div class="header-top">
          <div>
            <a routerLink="/dashboard" class="brand">
              <span class="brand-icon">
                <i class="pi pi-building"></i>
              </span>
              <span>YL Works</span>
            </a>

            <div class="header-heading">
              <span class="header-eyebrow">PEOPLE & ORGANIZATION</span>
              <h1>Employee Directory</h1>
              <p>
                Find colleagues, explore departments and connect with your team.
              </p>
            </div>
          </div>

          <div class="header-decoration">
            <i class="pi pi-users"></i>
          </div>
        </div>

        <!-- Search -->
        <div class="search-container">
          <i class="pi pi-search search-icon"></i>

          <input
            type="text"
            pInputText
            [(ngModel)]="searchTerm"
            placeholder="Search by name, position or email..."
            class="search-input"
            aria-label="Search employees"
          />

          <button
            *ngIf="searchTerm"
            type="button"
            class="clear-search"
            aria-label="Clear search"
            (click)="searchTerm = ''"
          >
            <i class="pi pi-times"></i>
          </button>
        </div>
      </section>

      <!-- Main Content -->
      <section class="directory-content">
        <!-- Statistics -->
        <div class="directory-summary">
          <div class="summary-card">
            <div class="summary-icon blue">
              <i class="pi pi-users"></i>
            </div>
            <div>
              <span class="summary-label">Total Employees</span>
              <h2>{{ userLists.length }}</h2>
            </div>
          </div>

          <div class="summary-card">
            <div class="summary-icon purple">
              <i class="pi pi-sitemap"></i>
            </div>
            <div>
              <span class="summary-label">Departments</span>
              <h2>{{ departments.length }}</h2>
            </div>
          </div>

          <div class="summary-card">
            <div class="summary-icon green">
              <i class="pi pi-filter"></i>
            </div>
            <div>
              <span class="summary-label">Showing Results</span>
              <h2>{{ filteredUsers.length }}</h2>
            </div>
          </div>
        </div>

        <!-- Department Filter -->
        <div class="filter-section">
          <div class="filter-heading">
            <div>
              <h2>Browse Employees</h2>
              <p>Filter employees by department.</p>
            </div>

            <button
              *ngIf="activeDepartment || searchTerm"
              type="button"
              class="reset-button"
              (click)="clearFilters()"
            >
              <i class="pi pi-refresh"></i>
              Reset filters
            </button>
          </div>

          <div class="department-filters">
            <button
              type="button"
              class="department-chip"
              [class.selected]="activeDepartment === ''"
              (click)="activeDepartment = ''"
            >
              All Departments
              <span>{{ userLists.length }}</span>
            </button>

            <button
              *ngFor="let dept of departments"
              type="button"
              class="department-chip"
              [class.selected]="activeDepartment === dept.name"
              (click)="selectDepartment(dept.name)"
            >
              {{ dept.name }}
            </button>
          </div>
        </div>

        <!-- Employee List -->
        <div class="employee-section">
          <div class="employee-section-header">
            <div>
              <h3>
                {{ activeDepartment || 'All Employees' }}
              </h3>
              <p>
                {{ filteredUsers.length }}
                {{ filteredUsers.length === 1 ? 'employee' : 'employees' }}
                found
              </p>
            </div>

            <div class="sort-label">
              <i class="pi pi-sort-alpha-down"></i>
              Alphabetical order
            </div>
          </div>

          <!-- Loading Skeleton -->
          <div *ngIf="isLoading" class="employee-grid">
            <div
              class="employee-card skeleton-card"
              *ngFor="let item of skeletonItems"
            >
              <div class="skeleton-avatar"></div>
              <div class="skeleton-content">
                <div class="skeleton-line long"></div>
                <div class="skeleton-line medium"></div>
                <div class="skeleton-line short"></div>
              </div>
            </div>
          </div>

          <!-- Employee Cards -->
          <div
            *ngIf="!isLoading && filteredUsers.length > 0"
            class="employee-grid"
          >
            <article
              class="employee-card"
              *ngFor="let user of filteredUsers; trackBy: trackByUser"
            >
              <div class="employee-card-top">
                <div class="employee-avatar">
                  {{ getInitial(user.fullName) }}
                </div>

                <span class="employee-status">
                  <span></span>
                  Employee
                </span>
              </div>

              <div class="employee-information">
                <h4>{{ user.fullName || 'Unnamed Employee' }}</h4>

                <p class="employee-position">
                  {{ user.jobTitle || 'Position not specified' }}
                </p>

                <div class="employee-departments">
                  <span
                    *ngFor="let dept of getDepartmentNames(user)"
                    class="employee-department"
                  >
                    <i class="pi pi-sitemap"></i>
                    {{ dept }}
                  </span>

                  <span
                    *ngIf="getDepartmentNames(user).length === 0"
                    class="employee-department muted"
                  >
                    Department not assigned
                  </span>
                </div>
              </div>

              <div class="employee-card-footer">
                <div class="employee-email" [title]="user.email || ''">
                  <i class="pi pi-envelope"></i>
                  <span>{{ user.email || 'No email available' }}</span>
                </div>

                <a
                  *ngIf="user.email"
                  [href]="'mailto:' + user.email"
                  class="email-button"
                  [attr.aria-label]="'Email ' + user.fullName"
                  title="Send email"
                >
                  <i class="pi pi-send"></i>
                </a>
              </div>
            </article>
          </div>

          <!-- Empty State -->
          <div
            *ngIf="!isLoading && filteredUsers.length === 0"
            class="empty-state"
          >
            <div class="empty-icon">
              <i class="pi pi-users"></i>
            </div>

            <h3>No employees found</h3>

            <p>
              We couldn't find any employees matching your search or department.
            </p>

            <button
              type="button"
              class="empty-reset-button"
              (click)="clearFilters()"
            >
              Clear filters
            </button>
          </div>

          <!-- Error State -->
          <div *ngIf="!isLoading && loadError" class="error-state">
            <i class="pi pi-exclamation-circle"></i>
            <span>Unable to load employee directory.</span>

            <button type="button" (click)="GetData()">Try again</button>
          </div>
        </div>

        <!-- Footer -->
        <div class="directory-footer">
          <span>
            <i class="pi pi-shield"></i>
            Internal Employee Directory
          </span>
          <span>YL Systems</span>
        </div>
      </section>
    </div>
  `,
  styleUrl: './directory.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Directory implements OnInit, OnDestroy {
  private readonly departmentService = inject(DepartmentService);
  private readonly loadingService = inject(LoadingService);
  private readonly userService = inject(UserService);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly destroy$ = new Subject<void>();

  userLists: DirectoryUser[] = [];
  departments: DirectoryDepartment[] = [];

  activeDepartment = '';
  searchTerm = '';

  isLoading = false;
  loadError = false;

  skeletonItems = Array(6);

  ngOnInit(): void {
    this.GetDepartment();
    this.GetData();
  }

  // ==========================================
  // GET DEPARTMENTS
  // ==========================================

  GetDepartment(): void {
    this.departmentService
      .GetMany({
        Page: 1,
        PageSize: 100,
        OrderBy: 'Name',
        Includes: null,
        Select: null,
        Filter: null,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.departments = res?.data ?? [];
          this.cdr.markForCheck();
        },
        error: () => {
          this.departments = [];
          this.cdr.markForCheck();
        },
      });
  }

  // ==========================================
  // GET EMPLOYEES
  // ==========================================

  GetData(): void {
    this.isLoading = true;
    this.loadError = false;
    this.loadingService.start();
    this.cdr.markForCheck();

    this.userService
      .GetMany({
        Page: 1,
        PageSize: 100,
        Select: null,
        Includes: null,
        Filter: null,
        OrderBy: 'FullName asc',
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.userLists = res?.data ?? [];
          this.isLoading = false;
          this.loadingService.stop();
          this.cdr.markForCheck();
        },
        error: () => {
          this.userLists = [];
          this.isLoading = false;
          this.loadError = true;
          this.loadingService.stop();
          this.cdr.markForCheck();
        },
      });
  }

  // ==========================================
  // SEARCH AND FILTER
  // ==========================================

  get filteredUsers(): DirectoryUser[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.userLists.filter((user) => {
      const matchesSearch =
        !search ||
        user.fullName?.toLowerCase().includes(search) ||
        user.jobTitle?.toLowerCase().includes(search) ||
        user.email?.toLowerCase().includes(search);

      const userDepartments = this.getDepartmentNames(user);

      const matchesDepartment =
        !this.activeDepartment ||
        userDepartments.some(
          (department) =>
            department.toLowerCase() === this.activeDepartment.toLowerCase(),
        );

      return !!matchesSearch && matchesDepartment;
    });
  }

  selectDepartment(departmentName: string): void {
    this.activeDepartment =
      this.activeDepartment === departmentName ? '' : departmentName;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.activeDepartment = '';
  }

  // ==========================================
  // EMPLOYEE INFORMATION
  // ==========================================

  getInitial(fullName?: string): string {
    if (!fullName?.trim()) {
      return '?';
    }

    const names = fullName.trim().split(/\s+/).filter(Boolean);

    if (names.length === 1) {
      return names[0].substring(0, 2).toUpperCase();
    }

    return (names[0].charAt(0) + names[1].charAt(0)).toUpperCase();
  }

  getDepartmentNames(user: DirectoryUser): string[] {
    return (user.departments ?? [])
      .map((department) =>
        typeof department === 'string' ? department : (department?.name ?? ''),
      )
      .filter((name): name is string => !!name.trim());
  }

  trackByUser(index: number, user: DirectoryUser): string | number {
    return user.id ?? user.email ?? index;
  }

  // ==========================================
  // CLEANUP
  // ==========================================

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.loadingService.stop();
  }
}
