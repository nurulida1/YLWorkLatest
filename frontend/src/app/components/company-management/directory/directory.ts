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
      <div class="hidden sm:block">
        <div class="min-h-screen bg-slate-50">
          <!-- Desktop Header -->
          <header class="bg-white border-b border-slate-200">
            <div class="max-w-[1600px] mx-auto px-8 py-7">
              <div class="flex items-center justify-between gap-6">
                <div>
                  <div class="flex items-center gap-3 mb-2">
                    <span class="w-1 h-8 rounded-full bg-[#2148BC]"></span>
                    <div>
                      <p
                        class="text-xs font-semibold tracking-widest text-slate-400 uppercase"
                      >
                        People & Organization
                      </p>
                      <h1 class="text-3xl font-bold text-slate-900">
                        Employee Directory
                      </h1>
                    </div>
                  </div>

                  <p class="text-sm text-slate-500 ml-4">
                    Find colleagues, explore departments and connect with your
                    team.
                  </p>
                </div>
              </div>

              <!-- Search -->
              <div class="mt-7 max-w-2xl relative">
                <i
                  class="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                ></i>

                <input
                  pInputText
                  type="text"
                  [(ngModel)]="searchTerm"
                  placeholder="Search by name, position or email..."
                  class="w-full pl-11! pr-12! py-3! rounded-xl! border-slate-200! bg-slate-50! text-sm!"
                />

                <button
                  *ngIf="searchTerm"
                  type="button"
                  (click)="searchTerm = ''"
                  class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  <i class="pi pi-times"></i>
                </button>
              </div>
            </div>
          </header>

          <!-- Desktop Content -->
          <main class="max-w-[1600px] mx-auto px-8 py-8">
            <!-- Statistics -->
            <div class="grid grid-cols-3 gap-5 mb-8">
              <div
                class="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4"
              >
                <div
                  class="w-12 h-12 rounded-xl bg-blue-50 text-[#2148BC] flex items-center justify-center"
                >
                  <i class="pi pi-users text-xl"></i>
                </div>
                <div>
                  <p class="text-sm text-slate-500">Total Employees</p>
                  <h2 class="text-2xl font-bold text-slate-900">
                    {{ userLists.length }}
                  </h2>
                </div>
              </div>

              <div
                class="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4"
              >
                <div
                  class="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center"
                >
                  <i class="pi pi-sitemap text-xl"></i>
                </div>
                <div>
                  <p class="text-sm text-slate-500">Departments</p>
                  <h2 class="text-2xl font-bold text-slate-900">
                    {{ departments.length }}
                  </h2>
                </div>
              </div>

              <div
                class="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4"
              >
                <div
                  class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"
                >
                  <i class="pi pi-filter text-xl"></i>
                </div>
                <div>
                  <p class="text-sm text-slate-500">Showing Results</p>
                  <h2 class="text-2xl font-bold text-slate-900">
                    {{ filteredUsers.length }}
                  </h2>
                </div>
              </div>
            </div>

            <!-- Directory Section -->
            <section
              class="bg-white border border-slate-200 rounded-2xl overflow-hidden"
            >
              <!-- Section Heading -->
              <div
                class="px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-4"
              >
                <div>
                  <h2 class="text-lg font-bold text-slate-900">
                    Browse Employees
                  </h2>
                  <p class="text-sm text-slate-500 mt-1">
                    Filter and view employees across the organization.
                  </p>
                </div>

                <button
                  *ngIf="activeDepartment || searchTerm"
                  type="button"
                  (click)="clearFilters()"
                  class="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  <i class="pi pi-refresh"></i>
                  Reset filters
                </button>
              </div>

              <!-- Department Filters -->
              <div class="px-6 py-4 border-b border-slate-100">
                <div class="flex flex-wrap gap-2">
                  <button
                    type="button"
                    (click)="activeDepartment = ''"
                    [class.bg-blue-50]="activeDepartment === ''"
                    [class.text-[#2148BC]]="activeDepartment === ''"
                    [class.border-blue-200]="activeDepartment === ''"
                    [class.bg-white]="activeDepartment !== ''"
                    [class.text-slate-600]="activeDepartment !== ''"
                    class="cursor-pointer px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-50 transition-colors"
                  >
                    All Departments
                    <span class="ml-1 text-xs opacity-70">
                      {{ userLists.length }}
                    </span>
                  </button>

                  <button
                    *ngFor="let dept of departments"
                    type="button"
                    (click)="selectDepartment(dept.name)"
                    [class.bg-blue-50]="activeDepartment === dept.name"
                    [class.text-[#2148BC]]="activeDepartment === dept.name"
                    [class.border-blue-200]="activeDepartment === dept.name"
                    [class.bg-white]="activeDepartment !== dept.name"
                    [class.text-slate-600]="activeDepartment !== dept.name"
                    class="cursor-pointer px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-50 transition-colors"
                  >
                    {{ dept.name }}
                  </button>
                </div>
              </div>

              <!-- Table Heading -->
              <div
                class="px-6 py-4 flex items-center justify-between bg-slate-50/70"
              >
                <div>
                  <h3 class="font-semibold text-slate-800">
                    {{ activeDepartment || 'All Employees' }}
                  </h3>
                  <p class="text-xs text-slate-500 mt-1">
                    {{ filteredUsers.length }}
                    {{ filteredUsers.length === 1 ? 'employee' : 'employees' }}
                    found
                  </p>
                </div>

                <div class="flex items-center gap-2 text-xs text-slate-500">
                  <i class="pi pi-sort-alpha-down"></i>
                  Alphabetical order
                </div>
              </div>

              <!-- Loading -->
              <div *ngIf="isLoading" class="p-6 space-y-4">
                <div
                  *ngFor="let item of skeletonItems"
                  class="h-16 rounded-xl bg-slate-100 animate-pulse"
                ></div>
              </div>

              <!-- Employee Table -->
              <div
                *ngIf="!isLoading && filteredUsers.length > 0"
                class="overflow-x-auto"
              >
                <table class="w-full text-left">
                  <thead
                    class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"
                  >
                    <tr>
                      <th class="px-6 py-4 font-semibold">Employee</th>
                      <th class="px-6 py-4 font-semibold">Position</th>
                      <th class="px-6 py-4 font-semibold">Department</th>
                      <th class="px-6 py-4 font-semibold">Email Address</th>
                      <th class="px-6 py-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>

                  <tbody class="divide-y divide-slate-100">
                    <tr
                      *ngFor="let user of filteredUsers; trackBy: trackByUser"
                      class="hover:bg-slate-50/70 transition-colors"
                    >
                      <!-- Employee -->
                      <td class="px-6 py-4">
                        <div class="flex items-center gap-3 min-w-[190px]">
                          <div
                            class="w-10 h-10 shrink-0 rounded-full bg-blue-50 text-[#2148BC] flex items-center justify-center font-bold text-sm"
                          >
                            {{ getInitial(user.fullName) }}
                          </div>

                          <div class="min-w-0">
                            <p class="font-semibold text-sm text-slate-800">
                              {{ user.fullName || 'Unnamed Employee' }}
                            </p>
                            <span class="text-xs text-emerald-600">
                              <i class="pi pi-circle-fill text-[7px]! mr-1"></i>
                              Employee
                            </span>
                          </div>
                        </div>
                      </td>

                      <!-- Position -->
                      <td class="px-6 py-4">
                        <span class="text-sm text-slate-600">
                          {{ user.jobTitle || 'Position not specified' }}
                        </span>
                      </td>

                      <!-- Department -->
                      <td class="px-6 py-4">
                        <div class="flex flex-wrap gap-1.5 max-w-[240px]">
                          <span
                            *ngFor="let dept of getDepartmentNames(user)"
                            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs"
                          >
                            <i class="pi pi-sitemap text-[10px]"></i>
                            {{ dept }}
                          </span>

                          <span
                            *ngIf="getDepartmentNames(user).length === 0"
                            class="text-xs text-slate-400"
                          >
                            Not assigned
                          </span>
                        </div>
                      </td>

                      <!-- Email -->
                      <td class="px-6 py-4">
                        <span class="text-sm text-slate-500">
                          {{ user.email || 'No email available' }}
                        </span>
                      </td>

                      <!-- Action -->
                      <td class="px-6 py-4 text-right">
                        <a
                          *ngIf="user.email"
                          [href]="'mailto:' + user.email"
                          [attr.aria-label]="'Email ' + user.fullName"
                          title="Send email"
                          class="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 text-slate-500 hover:text-[#2148BC] hover:border-blue-200 hover:bg-blue-50 transition-colors"
                        >
                          <i class="pi pi-envelope"></i>
                        </a>
                        <span
                          *ngIf="!user.email"
                          class="text-xs text-slate-300"
                        >
                          —
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Empty State -->
              <div
                *ngIf="!isLoading && filteredUsers.length === 0 && !loadError"
                class="py-16 px-6 text-center"
              >
                <div
                  class="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400"
                >
                  <i class="pi pi-users text-2xl"></i>
                </div>

                <h3 class="font-semibold text-slate-800">No employees found</h3>

                <p class="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                  We couldn't find any employees matching your search or
                  department.
                </p>

                <button
                  type="button"
                  (click)="clearFilters()"
                  class="mt-5 px-4 py-2 rounded-lg bg-[#2148BC] text-white text-sm font-semibold hover:bg-blue-800"
                >
                  Clear filters
                </button>
              </div>

              <!-- Error State -->
              <div *ngIf="!isLoading && loadError" class="py-12 text-center">
                <i class="pi pi-exclamation-circle text-3xl text-red-500"></i>
                <p class="text-sm text-slate-600 mt-3">
                  Unable to load employee directory.
                </p>
                <button
                  type="button"
                  (click)="GetData()"
                  class="mt-4 text-sm font-semibold text-[#2148BC] hover:underline"
                >
                  Try again
                </button>
              </div>
            </section>
          </main>
        </div>
      </div>

      <div class="sm:hidden">
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
                  Find colleagues, explore departments and connect with your
                  team.
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
                We couldn't find any employees matching your search or
                department.
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
