import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect'; // Import MultiSelect
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { UserService } from '../../../services/userService.service';
import { MenuItem, MessageService } from 'primeng/api';
import { Observable, Subject, takeUntil } from 'rxjs';
import { LoadingService } from '../../../services/loading.service';
import { UserDto } from '../../../models/User';
import {
  PagingContent,
  GridifyQueryExtend,
  BuildFilterText,
  BuildSortText,
  ValidateAllFormFields,
  passwordMatchValidator,
} from '../../../shared/helpers/helpers';
import { MenuModule } from 'primeng/menu';
import { InputNumberModule } from 'primeng/inputnumber';
import { KeyFilterModule } from 'primeng/keyfilter';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { DatePickerModule } from 'primeng/datepicker';
import { PasswordModule } from 'primeng/password';
import { DepartmentService } from '../../../services/departmentService';
import { ChartModule } from 'primeng/chart';
import { Textarea, TextareaModule } from 'primeng/textarea';
import { PaginatorModule } from 'primeng/paginator';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    InputTextModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    ReactiveFormsModule,
    SelectModule,
    MultiSelectModule,
    MenuModule,
    InputNumberModule,
    KeyFilterModule,
    ToggleSwitchModule,
    DatePickerModule,
    PasswordModule,
    ChartModule,
    TextareaModule,
    PaginatorModule,
  ],
  template: `<div class="min-h-screen w-full bg-slate-50/70 p-3 sm:p-5 lg:p-7">
      <div class="mx-auto flex w-full max-w-[1600px] flex-col gap-5">
        <!-- Breadcrumb -->
        <div class="flex items-center gap-2 text-xs font-medium text-slate-400">
          <a
            routerLink="/dashboard"
            class="transition-colors hover:text-blue-600"
          >
            Dashboard
          </a>
          <i class="pi pi-chevron-right text-[9px]!"></i>
          <span class="font-semibold text-slate-700">User Management</span>
        </div>

        <!-- Page heading -->
        <div
          class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <h1 class="m-0 text-2xl font-bold tracking-tight text-slate-900">
                User Management
              </h1>
              <span
                class="hidden rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700 sm:inline-flex"
              >
                Administration
              </span>
            </div>
            <p class="mt-1 text-sm text-slate-500">
              Manage employee accounts, roles and organisational access.
            </p>
          </div>

          <p-button
            label="Add User"
            icon="pi pi-user-plus"
            (onClick)="ActionClick(null, 'add')"
            styleClass="!w-full sm:!w-auto !justify-center !bg-blue-700 hover:!bg-blue-800 !border-blue-700 !rounded-xl !px-5 !py-2.5 !text-sm !font-semibold !shadow-sm"
          ></p-button>
        </div>

        <!-- Dashboard statistics -->
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <!-- Total Users -->
          <div
            class="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:gap-4 sm:p-5"
          >
            <div
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 sm:h-12 sm:w-12"
            >
              <i class="pi pi-users text-xl"></i>
            </div>
            <div class="min-w-0">
              <p
                class="m-0 text-xs font-semibold uppercase tracking-wider text-slate-400"
              >
                Total Users
              </p>
              <p
                class="mt-1 text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl"
              >
                {{ dashboardCount?.totalUsers ?? 0 }}
              </p>
            </div>
          </div>

          <!-- Pending Approvals -->
          <div
            class="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:gap-4 sm:p-5"
          >
            <div
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 sm:h-12 sm:w-12"
            >
              <i class="pi pi-clock text-xl"></i>
            </div>
            <div class="min-w-0">
              <p
                class="m-0 text-xs font-semibold uppercase tracking-wider text-slate-400"
              >
                Pending Approvals
              </p>
              <p
                class="mt-1 text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl"
              >
                {{ dashboardCount?.pendingUsers ?? 0 }}
              </p>
            </div>
          </div>

          <!-- Active Staff -->
          <div
            class="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:gap-4 sm:p-5"
          >
            <div
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 sm:h-12 sm:w-12"
            >
              <i class="pi pi-user-check text-xl"></i>
            </div>
            <div class="min-w-0">
              <p
                class="m-0 text-xs font-semibold uppercase tracking-wider text-slate-400"
              >
                Active Staff
              </p>
              <p
                class="mt-1 text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl"
              >
                {{ dashboardCount?.activeUsers ?? 0 }}
              </p>
            </div>
          </div>
        </div>

        <!-- User records panel -->
        <div
          class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
        >
          <!-- Search toolbar -->
          <div
            class="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
          >
            <div>
              <h2 class="m-0 text-sm font-bold text-slate-800">
                Employee Accounts
              </h2>
              <p class="mt-1 text-xs text-slate-400">
                View and manage registered users.
              </p>
            </div>

            <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <div class="relative w-full sm:min-w-[300px]">
                <i
                  class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400"
                ></i>
                <input
                  type="text"
                  pInputText
                  [(ngModel)]="search"
                  (keyup)="onKeyDown($event)"
                  placeholder="Search by employee name..."
                  class="w-full !rounded-xl !border-slate-200 !py-2.5 !pl-9 !pr-3 !text-sm placeholder:!text-slate-400 focus:!border-blue-500 focus:!ring-2 focus:!ring-blue-100"
                />
              </div>

              <button
                type="button"
                (click)="ResetTable()"
                class="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                <i class="pi pi-refresh text-xs"></i>
                <span>Reset</span>
              </button>
            </div>
          </div>

          <!-- ================= MOBILE USER CARDS ================= -->
          <div class="divide-y divide-slate-100 md:hidden">
            <ng-container *ngIf="PagingSignal().data?.length; else mobileEmpty">
              <div
                *ngFor="let data of PagingSignal().data"
                class="p-4 transition-colors active:bg-slate-50"
              >
                <!-- Name and action -->
                <div class="flex items-start justify-between gap-3">
                  <div class="flex min-w-0 items-center gap-3">
                    <div
                      class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold uppercase text-blue-700"
                    >
                      {{ data.fullName.charAt(0) || '?' }}
                    </div>

                    <div class="min-w-0">
                      <p class="m-0 truncate text-sm font-bold text-slate-800">
                        {{ data.fullName }}
                      </p>
                      <p class="mt-0.5 truncate text-xs text-slate-400">
                        {{ '@' }}{{ data.displayName || 'no-alias' }}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    (click)="onEllipsisClick($event, data, menu)"
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                  >
                    <i class="pi pi-ellipsis-v"></i>
                  </button>
                </div>

                <!-- Role and status -->
                <div class="mt-3 flex flex-wrap items-center gap-2">
                  <span
                    class="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    [ngClass]="{
                      'bg-purple-50 text-purple-700':
                        data.systemRole === 'SuperAdmin',
                      'bg-blue-50 text-blue-700':
                        data.systemRole === 'Management',
                      'bg-green-50 text-green-700': data.systemRole === 'HOD',
                      'bg-orange-50 text-orange-700': data.systemRole === 'HR',
                      'bg-red-50 text-red-700': data.systemRole === 'Support',
                      'bg-slate-100 text-slate-600':
                        data.systemRole === 'Staff',
                    }"
                  >
                    {{ getRoleLabel(data.systemRole) }}
                  </span>

                  <span
                    class="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    [ngClass]="{
                      'bg-amber-50 text-amber-700': data.status === 'Pending',
                      'bg-emerald-50 text-emerald-700':
                        data.status === 'Approved',
                      'bg-red-50 text-red-700': data.status === 'Rejected',
                    }"
                  >
                    {{ data.status }}
                  </span>

                  <span
                    class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                    [ngClass]="
                      data.isActive
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    "
                  >
                    <span
                      class="h-1.5 w-1.5 rounded-full"
                      [ngClass]="
                        data.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                      "
                    ></span>
                    {{ data.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </div>

                <!-- Department details -->
                <div class="mt-3">
                  <p
                    class="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400"
                  >
                    Departments
                  </p>

                  <div class="flex flex-wrap gap-1.5">
                    <span
                      *ngFor="let dept of data.departments"
                      class="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600"
                    >
                      {{ dept.name }}
                    </span>

                    <span
                      *ngIf="!data.departments?.length"
                      class="text-xs italic text-slate-400"
                    >
                      No departments assigned
                    </span>
                  </div>
                </div>

                <!-- Last active and created date -->
                <div
                  class="mt-3 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3"
                >
                  <div class="min-w-0">
                    <p
                      class="m-0 text-[10px] font-semibold uppercase tracking-wider text-slate-400"
                    >
                      Last Active
                    </p>
                    <p
                      class="mt-1 truncate text-xs font-semibold text-slate-700"
                    >
                      {{ getLastSeen(data.lastLoginAt) }}
                    </p>
                  </div>

                  <div class="min-w-0">
                    <p
                      class="m-0 text-[10px] font-semibold uppercase tracking-wider text-slate-400"
                    >
                      Created Date
                    </p>
                    <p class="mt-1 text-xs font-semibold text-slate-700">
                      {{ data.createdAt | date: 'dd MMM yyyy' }}
                    </p>
                  </div>
                </div>

                <!-- Active toggle -->
                <div
                  class="mt-3 flex items-center justify-between border-t border-slate-100 pt-3"
                >
                  <div>
                    <p class="m-0 text-xs font-semibold text-slate-700">
                      Account Status
                    </p>
                    <p class="mt-0.5 text-[11px] text-slate-400">
                      Enable or disable this account
                    </p>
                  </div>

                  <p-toggleswitch
                    [(ngModel)]="data.isActive"
                    (ngModelChange)="isActiveOnChange($event, data.id)"
                  />
                </div>
              </div>
            </ng-container>

            <ng-template #mobileEmpty>
              <div class="flex flex-col items-center px-4 py-12 text-center">
                <div
                  class="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"
                >
                  <i class="pi pi-users text-2xl"></i>
                </div>
                <p class="mt-3 text-sm font-semibold text-slate-700">
                  No users found
                </p>
                <p class="mt-1 text-xs text-slate-400">
                  Try changing your search or reset the filters.
                </p>
              </div>
            </ng-template>
          </div>

          <!-- Mobile paginator -->
          <div class="border-t border-slate-100 p-3 md:hidden">
            <p-paginator
              [first]="((Query.Page || 1) - 1) * (Query.PageSize || 10)"
              [rows]="Query.PageSize || 10"
              [totalRecords]="PagingSignal().totalElements || 0"
              [rowsPerPageOptions]="[10, 20, 30]"
              (onPageChange)="NextPage($event)"
            ></p-paginator>
          </div>

          <!-- ================= DESKTOP TABLE ================= -->
          <div class="hidden md:block">
            <div class="overflow-x-auto">
              <p-table
                #fTable
                [value]="PagingSignal().data"
                [paginator]="true"
                [rows]="Query.PageSize"
                [totalRecords]="PagingSignal().totalElements"
                [rowsPerPageOptions]="[10, 20, 30, 50]"
                [lazy]="true"
                [showGridlines]="false"
                (onLazyLoad)="NextPage($event)"
                styleClass="p-datatable-sm user-management-table"
              >
                <ng-template #header>
                  <tr>
                    <th
                      pSortableColumn="FullName"
                      class="user-table-header min-w-[220px]"
                    >
                      <div class="flex items-center gap-2">
                        Name
                        <p-sortIcon field="FullName" />
                      </div>
                    </th>
                    <th class="user-table-header min-w-[180px]">System Role</th>
                    <th class="user-table-header min-w-[200px]">Departments</th>
                    <th class="user-table-header text-center">Last Active</th>
                    <th class="user-table-header text-center">Created Date</th>
                    <th class="user-table-header text-center">Status</th>
                    <th class="user-table-header text-center">Is Active</th>
                    <th class="user-table-header text-center">Action</th>
                  </tr>
                </ng-template>

                <ng-template #body let-data>
                  <tr class="transition-colors hover:bg-blue-50/30">
                    <td class="px-5 py-4">
                      <div class="flex items-center gap-3">
                        <div
                          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold uppercase text-blue-700"
                        >
                          {{ data.fullName.charAt(0) || '?' }}
                        </div>
                        <div class="min-w-0">
                          <p
                            class="m-0 truncate text-sm font-semibold text-slate-800"
                          >
                            {{ data.fullName }}
                          </p>
                          <p class="mt-0.5 truncate text-xs text-slate-400">
                            {{ '@' }}{{ data.displayName || 'no-alias' }}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td class="px-4 py-4">
                      <span
                        class="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                        [ngClass]="{
                          'bg-purple-50 text-purple-700':
                            data.systemRole === 'SuperAdmin',
                          'bg-blue-50 text-blue-700':
                            data.systemRole === 'Management',
                          'bg-green-50 text-green-700':
                            data.systemRole === 'HOD',
                          'bg-orange-50 text-orange-700':
                            data.systemRole === 'HR',
                          'bg-red-50 text-red-700':
                            data.systemRole === 'Support',
                          'bg-slate-100 text-slate-600':
                            data.systemRole === 'Staff',
                        }"
                      >
                        {{ getRoleLabel(data.systemRole) }}
                      </span>
                    </td>

                    <td class="px-4 py-4">
                      <div class="flex max-w-[240px] flex-wrap gap-1.5">
                        <span
                          *ngFor="let dept of data.departments"
                          class="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600"
                        >
                          {{ dept.name }}
                        </span>
                        <span
                          *ngIf="!data.departments?.length"
                          class="text-xs italic text-slate-400"
                        >
                          No departments
                        </span>
                      </div>
                    </td>

                    <td class="px-4 py-4 text-center">
                      <div
                        class="flex items-center justify-center gap-2 text-xs"
                      >
                        <span
                          class="h-2 w-2 rounded-full"
                          [ngClass]="
                            getLastSeen(data.lastLoginAt) === 'Online'
                              ? 'animate-pulse bg-emerald-500'
                              : 'bg-slate-300'
                          "
                        ></span>
                        <span class="font-medium text-slate-600">
                          {{ getLastSeen(data.lastLoginAt) }}
                        </span>
                      </div>
                    </td>

                    <td class="px-4 py-4 text-center text-xs text-slate-600">
                      {{ data.createdAt | date: 'dd MMM yyyy' }}
                    </td>

                    <td class="px-4 py-4 text-center">
                      <span
                        class="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                        [ngClass]="{
                          'bg-amber-50 text-amber-700':
                            data.status === 'Pending',
                          'bg-emerald-50 text-emerald-700':
                            data.status === 'Approved',
                          'bg-red-50 text-red-700': data.status === 'Rejected',
                        }"
                      >
                        {{ data.status }}
                      </span>
                    </td>

                    <td class="px-4 py-4 text-center">
                      <div class="flex justify-center">
                        <p-toggleswitch
                          [(ngModel)]="data.isActive"
                          (ngModelChange)="isActiveOnChange($event, data.id)"
                        />
                      </div>
                    </td>

                    <td class="px-4 py-4 text-center">
                      <button
                        type="button"
                        (click)="onEllipsisClick($event, data, menu)"
                        class="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                      >
                        <i class="pi pi-ellipsis-v"></i>
                      </button>
                    </td>
                  </tr>
                </ng-template>

                <ng-template #emptymessage>
                  <tr>
                    <td colspan="8" class="px-4 py-12 text-center">
                      <i class="pi pi-users text-3xl text-slate-300"></i>
                      <p class="mt-3 text-sm font-semibold text-slate-600">
                        No user records found
                      </p>
                      <p class="mt-1 text-xs text-slate-400">
                        Try changing your search criteria.
                      </p>
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            </div>
          </div>
        </div>
      </div>
    </div>
    <p-menu
      #menu
      [model]="menuItems"
      [popup]="true"
      styleClass="shadow-lg border border-gray-100 rounded-lg text-sm"
    ></p-menu>

    <p-dialog
      *ngIf="visible"
      [(visible)]="visible"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [dismissableMask]="true"
      closable="true"
      (onHide)="visible = false"
      styleClass="yl-user-dialog !w-[calc(100vw-1rem)] sm:!w-[95%] md:!w-[90%] lg:!w-[900px] xl:!w-[1050px] !max-h-[94dvh] !border-0 !bg-white !p-0 !shadow-2xl !overflow-hidden"
    >
      <ng-template #header>
        <div class="w-full px-5 sm:px-6 pt-1">
          <div
            class="flex items-start justify-between gap-4 border-b border-gray-100 pb-3"
          >
            <div class="flex items-start gap-3 min-w-0">
              <div
                class="
              shrink-0
              w-11 h-11
              sm:w-12 sm:h-12
              rounded-2xl
              bg-blue-50
              border border-blue-100
              flex items-center justify-center
            "
              >
                <i class="pi pi-user-plus text-blue-600! text-lg!"></i>
              </div>

              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <h2
                    class="
                  text-lg
                  sm:text-xl
                  font-bold
                  text-gray-900
                  tracking-tight
                  m-0
                "
                  >
                    {{ title }}
                  </h2>

                  <span
                    class="
                  hidden
                  sm:inline-flex
                  px-2
                  py-0.5
                  rounded-full
                  bg-blue-50
                  text-blue-600
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-wider
                "
                  >
                    Employee
                  </span>
                </div>

                <p
                  class="
                text-xs
                sm:text-sm
                text-gray-500
                mt-1
                leading-relaxed
              "
                >
                  Create an employee account and configure their organisational
                  access.
                </p>
              </div>
            </div>
          </div>
        </div>
      </ng-template>

      <div
        class="user-dialog-form min-h-0 px-4 py-4 sm:px-6 sm:py-5"
        [formGroup]="FG"
      >
        <div class="flex flex-col gap-8">
          <section>
            <div
              class="flex items-center gap-3 mb-4 border-b border-gray-100 pb-3"
            >
              <div
                class="
              shrink-0
              w-8 h-8
              rounded-lg
              bg-blue-50
              text-blue-600
              flex items-center justify-center
            "
              >
                <i class="pi pi-user text-sm"></i>
              </div>

              <div>
                <h3 class="text-sm font-bold text-gray-800 m-0">
                  Personal Information
                </h3>

                <p class="text-xs text-gray-400 mt-0.5">
                  Basic employee information
                </p>
              </div>
            </div>

            <div class="grid grid-cols-12 gap-x-5 gap-y-4">
              <div
                class="
              col-span-12
              md:col-span-6
              flex flex-col gap-1.5
            "
              >
                <label class="text-xs font-semibold text-gray-700">
                  Full Name
                  <span class="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  pInputText
                  class="
                w-full!
                h-10!
                px-3!
                border-gray-200!
                rounded-xl!
                bg-gray-50/50!
                text-gray-800!
                text-sm!
                transition-all
                focus:bg-white!
                focus:border-blue-500!
                focus:ring-2!
                focus:ring-blue-100!
              "
                  placeholder="e.g. John Doe"
                  formControlName="fullName"
                />

                <small
                  class="text-red-500 font-medium text-xs"
                  *ngIf="
                    FG.get('fullName')?.errors?.['required'] &&
                    FG.get('fullName')?.touched
                  "
                >
                  Full Name is required.
                </small>
              </div>

              <div
                class="
              col-span-12
              md:col-span-6
              flex flex-col gap-1.5
            "
              >
                <label class="text-xs font-semibold text-gray-700">
                  Display Name
                </label>

                <input
                  type="text"
                  pInputText
                  class="
                w-full!
                h-10!
                px-3!
                border-gray-200!
                rounded-xl!
                bg-gray-50/50!
                text-gray-800!
                text-sm!
                focus:bg-white!
                focus:border-blue-500!
                focus:ring-2!
                focus:ring-blue-100!
              "
                  placeholder="e.g. Johnny"
                  formControlName="displayName"
                />
              </div>

              <div
                class="
              col-span-12
              md:col-span-6
              flex flex-col gap-1.5
            "
              >
                <label class="text-xs font-semibold text-gray-700">
                  Email Address
                  <span class="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  pInputText
                  class="
                w-full!
                h-10!
                px-3!
                border-gray-200!
                rounded-xl!
                bg-gray-50/50!
                text-gray-800!
                text-sm!
                focus:bg-white!
                focus:border-blue-500!
                focus:ring-2!
                focus:ring-blue-100!
              "
                  placeholder="name@company.com"
                  formControlName="email"
                />

                <small
                  class="text-red-500 font-medium text-xs"
                  *ngIf="FG.get('email')?.errors?.['email']"
                >
                  Invalid email format.
                </small>

                <small
                  class="text-red-500 font-medium text-xs"
                  *ngIf="
                    FG.get('email')?.errors?.['required'] &&
                    FG.get('email')?.touched
                  "
                >
                  Email is required.
                </small>
              </div>

              <div
                class="
              col-span-12
              md:col-span-6
              flex flex-col gap-1.5
            "
              >
                <label class="text-xs font-semibold text-gray-700">
                  Contact No
                </label>

                <input
                  type="text"
                  pInputText
                  class="
                w-full!
                h-10!
                px-3!
                border-gray-200!
                rounded-xl!
                bg-gray-50/50!
                text-gray-800!
                text-sm!
                focus:bg-white!
                focus:border-blue-500!
                focus:ring-2!
                focus:ring-blue-100!
              "
                  placeholder="+60123456789"
                  formControlName="contactNo"
                />

                <small
                  class="text-red-500 font-medium text-xs"
                  *ngIf="
                    FG.get('contactNo')?.errors?.['required'] &&
                    FG.get('contactNo')?.touched
                  "
                >
                  Contact No is required.
                </small>
              </div>

              <div
                class="
              col-span-12
              md:col-span-6
              flex flex-col gap-1.5
            "
              >
                <label class="text-xs font-semibold text-gray-700">
                  Job Title
                </label>

                <input
                  type="text"
                  pInputText
                  class="
                w-full!
                h-10!
                px-3!
                border-gray-200!
                rounded-xl!
                bg-gray-50/50!
                text-gray-800!
                text-sm!
                focus:bg-white!
                focus:border-blue-500!
                focus:ring-2!
                focus:ring-blue-100!
              "
                  placeholder="e.g. Software Engineer"
                  formControlName="jobTitle"
                />
              </div>

              <div
                class="
              col-span-12
              md:col-span-6
              flex flex-col gap-1.5
            "
              >
                <label class="text-xs font-semibold text-gray-700">
                  Gender
                </label>

                <p-select
                  class="w-full"
                  appendTo="body"
                  styleClass="
                w-full!
                !h-10
                !border-gray-200
                !rounded-xl
                !bg-gray-50/50
                !text-gray-800
              "
                  [options]="[
                    { label: 'Male', value: 'Male' },
                    { label: 'Female', value: 'Female' },
                  ]"
                  formControlName="gender"
                  placeholder="Select gender"
                ></p-select>
              </div>
            </div>
          </section>

          <section>
            <div
              class="flex items-center gap-3 mb-4 border-b border-gray-100 pb-3"
            >
              <div
                class="
              shrink-0
              w-8 h-8
              rounded-lg
              bg-indigo-50
              text-indigo-600
              flex items-center justify-center
            "
              >
                <i class="pi pi-briefcase text-sm"></i>
              </div>

              <div>
                <h3 class="text-sm font-bold text-gray-800 m-0">
                  Employment Details
                </h3>

                <p class="text-xs text-gray-400 mt-0.5">
                  Organisation and reporting structure
                </p>
              </div>
            </div>

            <div class="grid grid-cols-12 gap-x-5 gap-y-4">
              <div
                class="
              col-span-12
              md:col-span-6
              flex flex-col gap-1.5
            "
              >
                <label class="text-xs font-semibold text-gray-700">
                  Joined Date
                </label>

                <p-datepicker
                  class="w-full"
                  showIcon="false"
                  appendTo="body"
                  styleClass="
                w-full!
                !h-10
                !rounded-xl
                !text-gray-800
              "
                  inputStyleClass="
                !h-10
                !text-sm
                !rounded-xl border-gray-200!
                !bg-gray-50/50
              "
                  dateFormat="dd/mm/yy"
                  placeholder="Select effective date"
                  formControlName="joinedDate"
                ></p-datepicker>
              </div>

              <!-- Salary -->
              <div
                class="
              col-span-12
              md:col-span-6
              flex flex-col gap-1.5
            "
              >
                <label class="text-xs font-semibold text-gray-700">
                  Monthly Salary
                  <span class="text-gray-400 font-normal">(RM)</span>
                </label>

                <p-inputNumber
                  formControlName="monthlySalary"
                  mode="decimal"
                  [minFractionDigits]="2"
                  styleClass="w-full!"
                  inputStyleClass="
                w-full!
                !h-10
                !px-3
                !border-gray-200
                !rounded-xl
                !bg-gray-50/50
                !text-sm
              "
                  placeholder="0.00"
                ></p-inputNumber>

                <span class="text-[11px] text-gray-400">
                  Used for overtime claims.
                </span>
              </div>

              <!-- Departments -->
              <div
                class="
              col-span-12
              md:col-span-6
              flex flex-col gap-1.5
            "
              >
                <label class="text-xs font-semibold text-gray-700">
                  Assigned Departments
                </label>

                <p-multiSelect
                  class="w-full"
                  appendTo="body"
                  styleClass="
                w-full!
                !border-gray-200
                !rounded-xl
                !bg-gray-50/50
                !text-gray-800
              "
                  [options]="departmentSelection"
                  formControlName="departmentIds"
                  placeholder="Select operational divisions"
                  display="chip"
                ></p-multiSelect>
              </div>

              <div
                class="
              col-span-12
              md:col-span-6
              flex flex-col gap-1.5
            "
              >
                <label class="text-xs font-semibold text-gray-700">
                  Reporting Managers
                  <span class="text-gray-400 font-normal">(HOD)</span>
                </label>

                <p-multiSelect
                  class="w-full"
                  appendTo="body"
                  styleClass="
                w-full!
                !border-gray-200
                !rounded-xl
                !bg-gray-50/50
                !text-gray-800
              "
                  formControlName="hodIds"
                  [options]="hodSelection || []"
                  [filter]="true"
                  placeholder="Select reporting managers"
                  display="chip"
                ></p-multiSelect>
              </div>
            </div>
          </section>

          <section>
            <div
              class="flex items-center gap-3 mb-4 border-b border-gray-100 pb-3"
            >
              <div
                class="
              shrink-0
              w-8 h-8
              rounded-lg
              bg-emerald-50
              text-emerald-600
              flex items-center justify-center
            "
              >
                <i class="pi pi-clock text-sm"></i>
              </div>

              <div>
                <h3 class="text-sm font-bold text-gray-800 m-0">
                  Working Hours
                </h3>

                <p class="text-xs text-gray-400 mt-0.5">
                  Configure the standard working schedule
                </p>
              </div>
            </div>

            <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <!-- Work Start -->
              <div
                class="
              p-3
              rounded-xl
              bg-gray-50
              border border-gray-100
            "
              >
                <label class="text-[11px] font-semibold text-gray-500">
                  WORK START
                </label>

                <input
                  type="text"
                  pInputText
                  class="
                w-full!
                mt-2
                !h-9
                !px-3
                !border-gray-200
                !rounded-lg
                !bg-white
                !text-sm
              "
                  placeholder="09:00"
                  formControlName="workStartTime"
                />
              </div>

              <!-- Work End -->
              <div
                class="
              p-3
              rounded-xl
              bg-gray-50
              border border-gray-100
            "
              >
                <label class="text-[11px] font-semibold text-gray-500">
                  WORK END
                </label>

                <input
                  type="text"
                  pInputText
                  class="
                w-full!
                mt-2
                !h-9
                !px-3
                !border-gray-200
                !rounded-lg
                !bg-white
                !text-sm
              "
                  placeholder="18:00"
                  formControlName="workEndTime"
                />
              </div>

              <!-- Half Day Start -->
              <div
                class="
              p-3
              rounded-xl
              bg-gray-50
              border border-gray-100
            "
              >
                <label class="text-[11px] font-semibold text-gray-500">
                  HALF-DAY START
                </label>

                <input
                  type="text"
                  pInputText
                  class="
                w-full!
                mt-2
                !h-9
                !px-3
                !border-gray-200
                !rounded-lg
                !bg-white
                !text-sm
              "
                  placeholder="08:00"
                  formControlName="restDayHalfDayStart"
                />
              </div>

              <!-- Half Day End -->
              <div
                class="
              p-3
              rounded-xl
              bg-gray-50
              border border-gray-100
            "
              >
                <label class="text-[11px] font-semibold text-gray-500">
                  HALF-DAY END
                </label>

                <input
                  type="text"
                  pInputText
                  class="
                w-full!
                mt-2
                !h-9
                !px-3
                !border-gray-200
                !rounded-lg
                !bg-white
                !text-sm
              "
                  placeholder="12:00"
                  formControlName="restDayHalfDayEnd"
                />
              </div>
            </div>
          </section>

          <section>
            <div
              class="flex items-center gap-3 mb-4 border-b border-gray-100 pb-3"
            >
              <div
                class="
              shrink-0
              w-8 h-8
              rounded-lg
              bg-violet-50
              text-violet-600
              flex items-center justify-center
            "
              >
                <i class="pi pi-shield text-sm"></i>
              </div>

              <div>
                <h3 class="text-sm font-bold text-gray-800 m-0">
                  System Access
                </h3>

                <p class="text-xs text-gray-400 mt-0.5">
                  Assign application permissions
                </p>
              </div>
            </div>

            <div class="grid grid-cols-12 gap-4">
              <div
                class="
              col-span-12
              md:col-span-6
              flex flex-col gap-1.5
            "
              >
                <label class="text-xs font-semibold text-gray-700">
                  System Access Role
                </label>

                <p-select
                  class="w-full"
                  appendTo="body"
                  styleClass="
                w-full!
                !h-10
                !border-gray-200
                !rounded-xl
                !bg-gray-50/50
                !text-gray-800
              "
                  placeholder="Assign permission level"
                  [options]="systemRoles"
                  formControlName="systemRole"
                ></p-select>
              </div>
            </div>
          </section>

          <section *ngIf="!isUpdate">
            <div
              class="flex items-center gap-3 mb-4 border-b border-gray-100 pb-3"
            >
              <div
                class="
              shrink-0
              w-8 h-8
              rounded-lg
              bg-amber-50
              text-amber-600
              flex items-center justify-center
            "
              >
                <i class="pi pi-lock text-sm"></i>
              </div>

              <div>
                <h3 class="text-sm font-bold text-gray-800 m-0">
                  Account Security
                </h3>

                <p class="text-xs text-gray-400 mt-0.5">
                  Set the initial account password
                </p>
              </div>
            </div>

            <div class="grid grid-cols-12 gap-x-5 gap-y-4">
              <!-- Password -->
              <div
                class="
              col-span-12
              md:col-span-6
              flex flex-col gap-1.5
            "
              >
                <label class="text-xs font-semibold text-gray-700">
                  Account Password
                  <span class="text-red-500">*</span>
                </label>

                <p-password
                  formControlName="password"
                  [feedback]="false"
                  autocomplete="off"
                  styleClass="w-full!"
                  placeholder="Enter password"
                  inputStyleClass="
                w-full!
                !h-10
                !px-3
                !border-gray-200
                !rounded-xl
                !bg-gray-50/50
                !text-gray-800
              "
                  [toggleMask]="true"
                ></p-password>

                <span class="text-[11px] text-gray-400">
                  Minimum 6 alphanumeric characters.
                </span>
              </div>

              <!-- Confirm Password -->
              <div
                class="
              col-span-12
              md:col-span-6
              flex flex-col gap-1.5
            "
              >
                <label class="text-xs font-semibold text-gray-700">
                  Confirm Password
                  <span class="text-red-500">*</span>
                </label>

                <p-password
                  formControlName="confirmPassword"
                  [feedback]="false"
                  autocomplete="off"
                  styleClass="w-full!"
                  placeholder="Re-enter password"
                  inputStyleClass="
                w-full!
                !h-10
                !px-3
                !border-gray-200
                !rounded-xl
                !bg-gray-50/50
                !text-gray-800
              "
                  [toggleMask]="true"
                ></p-password>

                <small
                  class="text-red-500 font-medium text-xs"
                  *ngIf="
                    FG.errors?.['passwordMismatch'] &&
                    FG.get('confirmPassword')?.touched
                  "
                >
                  Passwords do not match.
                </small>
              </div>
            </div>
          </section>
        </div>
      </div>

      <ng-template #footer>
        <div
          class="flex w-full flex-col-reverse gap-2 border-t border-slate-100 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
        >
          <p class="hidden text-xs text-slate-400 sm:block">
            <i class="pi pi-info-circle mr-1"></i>
            Changes will take effect immediately.
          </p>

          <div class="flex w-full gap-2 sm:w-auto">
            <p-button
              (onClick)="visible = false"
              label="Cancel"
              severity="secondary"
              styleClass="!w-full sm:!w-auto !justify-center !rounded-xl !border-slate-200 !bg-white !px-5 !py-2.5 !text-sm !font-medium !text-slate-600"
            ></p-button>

            <p-button
              (onClick)="SaveUser()"
              [label]="isUpdate ? 'Save Changes' : 'Create User'"
              icon="pi pi-save"
              iconPos="right"
              styleClass="!w-full sm:!w-auto !justify-center !rounded-xl !border-blue-700 !bg-blue-700 !px-5 !py-2.5 !text-sm !font-semibold hover:!bg-blue-800"
            ></p-button>
          </div>
        </div>
      </ng-template>
    </p-dialog>

    <p-dialog
      [(visible)]="approvalVisible"
      header="Approve User"
      [modal]="true"
      styleClass="yl-approval-dialog"
    >
      <div [formGroup]="approvalForm" class="flex flex-col gap-2">
        <label>System Role <span class="text-red-500">*</span></label>

        <p-select
          appendTo="body"
          class="w-full"
          [options]="systemRoles"
          optionLabel="label"
          optionValue="value"
          formControlName="systemRole"
          placeholder="Select role"
        />

        <label>Departments (Optional)</label>

        <p-multiSelect
          appendTo="body"
          class="w-full"
          [options]="departmentSelection"
          optionLabel="label"
          optionValue="value"
          formControlName="departmentIds"
          display="chip"
        />
      </div>

      <ng-template pTemplate="footer">
        <p-button
          label="Cancel"
          severity="secondary"
          (click)="approvalVisible = false"
        />

        <p-button
          label="Approve"
          severity="success"
          styleClass="bg-green-600!"
          (click)="ApproveUser()"
        />
      </ng-template>
    </p-dialog>

    <p-dialog
      [(visible)]="rejectVisible"
      header="Reject User"
      [modal]="true"
      styleClass="yl-reject-dialog"
    >
      <div [formGroup]="rejectForm">
        <label> Reason * </label>

        <textarea
          pTextarea
          rows="5"
          class="w-full"
          [autoResize]="true"
          formControlName="reason"
          placeholder="Enter rejection reason"
        ></textarea>
      </div>

      <ng-template pTemplate="footer">
        <p-button
          label="Cancel"
          severity="secondary"
          (click)="rejectVisible = false"
        />

        <p-button label="Reject" severity="danger" (click)="RejectUser()" />
      </ng-template>
    </p-dialog>`,
  styleUrl: './user-management.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserManagement implements OnInit, OnDestroy {
  @ViewChild('fTable') fTable?: Table;

  private readonly departmentService = inject(DepartmentService);
  private readonly loadingService = inject(LoadingService);
  private readonly messageService = inject(MessageService);
  private readonly userService = inject(UserService);
  private readonly cdr = inject(ChangeDetectorRef);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  PagingSignal = signal<PagingContent<UserDto>>({} as PagingContent<UserDto>);
  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  visible: boolean = false;
  isUpdate: boolean = false;

  approvalVisible: boolean = false;
  rejectVisible: boolean = false;

  selectedUser: any = null;

  approvalForm = new FormGroup({
    systemRole: new FormControl<string | null>(null, Validators.required),
    departmentIds: new FormControl<string[]>([]),
  });

  rejectForm = new FormGroup({
    reason: new FormControl(null, Validators.required),
  });

  now: Date = new Date();

  dashboardCount: any;

  departmentSelection: any[] = [];

  search: string = '';
  title: string = 'Add New User';
  FG!: FormGroup;
  menuItems: MenuItem[] = [];

  hodSelection: { label: string; value: string }[] = [];

  systemRoles = [
    { label: 'Super Administrator', value: 'SuperAdmin' },
    { label: 'Management (Director)', value: 'Management' },
    { label: 'Head of Department (HOD)', value: 'HOD' },
    { label: 'Human Resources (HR)', value: 'HR' },
    { label: 'Staff / Engineer / Executive', value: 'Staff' },
    { label: 'Technical & System Support', value: 'Support' },
  ];

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 10;
    this.Query.Filter = null;
    this.Query.OrderBy = `CreatedAt desc`;
    this.Query.Select = null;
    this.Query.Includes = null;
  }

  ngOnInit(): void {
    this.GetCount();
  }

  GetCount() {
    this.userService
      .GetDashboard()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.dashboardCount = res;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error(err);
        },
      });
  }

  GetData() {
    this.loadingService.start();
    this.userService
      .GetMany(this.Query)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.PagingSignal.set(res);
          this.cdr.markForCheck();
          this.loadingService.stop();
        },
        error: (err) => {
          this.loadingService.stop();
        },
      });
  }

  NextPage(event: TableLazyLoadEvent) {
    if ((event?.first || event?.first === 0) && event?.rows) {
      this.Query.Page = event.first / event.rows + 1 || 1;
      this.Query.PageSize = event.rows;
    }

    const sortText = BuildSortText(event);
    this.Query.OrderBy = sortText ? sortText : 'CreatedAt desc';

    this.Query.Filter = BuildFilterText(event);
    this.GetData();
  }

  onKeyDown(event: KeyboardEvent) {
    const isEnter = event.key === 'Enter';
    const isBackspaceClear = event.key === 'Backspace' && this.search === '';

    if (isEnter) {
      this.Search(this.search);
    } else if (isBackspaceClear) {
      this.Search('');
    }
  }

  Search(data: string) {
    const filter = {
      FullName: [
        {
          value: data,
          matchMode: '=',
          operator: 'and',
        },
      ],
    };

    if (this.fTable != null) {
      this.fTable.first = 0;
      this.fTable.filters = filter;
    }

    const event: TableLazyLoadEvent = {
      first: 0,
      rows: this.fTable?.rows,
      sortField: null,
      sortOrder: null,
      filters: filter,
    };

    this.NextPage(event);
  }

  ResetTable() {
    this.search = '';

    if (this.fTable) {
      this.fTable.first = 0;
      this.fTable.clearFilterValues();
      this.fTable.saveState();
    }

    this.Query.Filter = null;
    this.GetData();
  }

  ActionClick(data: UserDto | null, action: string) {
    this.isUpdate = action === 'Update';
    this.title = this.isUpdate ? 'Edit User' : 'Add New User';

    this.GetHodSelection();
    this.GetDepartmentSelection();

    this.FG = new FormGroup(
      {
        id: new FormControl<string | null>({
          value: data?.id || null,
          disabled: true,
        }),
        fullName: new FormControl<string | null>(
          data?.fullName || null,
          Validators.required,
        ),
        displayName: new FormControl<string | null>(null),
        email: new FormControl<string | null>(data?.email || null, [
          Validators.required,
          Validators.email,
        ]),
        contactNo: new FormControl<string | null>(null),
        password: new FormControl<string | null>(
          null,
          this.isUpdate ? [] : [Validators.required, Validators.minLength(6)],
        ),
        confirmPassword: new FormControl<string | null>(
          null,
          this.isUpdate ? [] : [Validators.required],
        ),
        jobTitle: new FormControl<string | null>(data?.jobTitle ?? null),
        joinedDate: new FormControl<Date | null>(
          data?.joinedDate ? new Date(data.joinedDate) : null,
        ),
        hodIds: new FormControl<string[] | null>(data?.hodIds || []),

        departmentIds: new FormControl<string[] | null>(
          data?.departmentIds || [],
        ),
        gender: new FormControl<string | null>(data?.gender || 'Male'),
        systemRole: new FormControl<string | null>(data?.systemRole || null),
        monthlySalary: new FormControl<number | null>(
          (data as any)?.monthlySalary ?? null,
        ),
        workStartTime: new FormControl<string | null>(
          (data as any)?.workStartTime ?? null,
        ),
        workEndTime: new FormControl<string | null>(
          (data as any)?.workEndTime ?? null,
        ),
        restDayHalfDayStart: new FormControl<string | null>(
          (data as any)?.restDayHalfDayStart ?? null,
        ),
        restDayHalfDayEnd: new FormControl<string | null>(
          (data as any)?.restDayHalfDayEnd ?? null,
        ),
      },
      { validators: passwordMatchValidator },
    );

    if (this.isUpdate && data) {
      this.FG.patchValue({
        ...data,
        joinedDate: data.joinedDate ? new Date(data.joinedDate) : null,
        departmentIds: data.departmentIds || [],
        hodIds: data.hodIds || [],
      });
    }

    this.visible = true;
    this.cdr.detectChanges();

    this.valueOnChange();
  }

  valueOnChange() {
    this.FG.get('departmentIds')
      ?.valueChanges.pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((departmentIds: string[] | null) => {
        if (!departmentIds?.length) {
          this.FG.patchValue(
            {
              hodIds: [],
            },
            { emitEvent: false },
          );

          return;
        }

        const hodIds = [
          ...new Set(
            this.departmentSelection
              .filter((d) => departmentIds.includes(d.value))
              .map((d) => d.hodId)
              .filter(Boolean),
          ),
        ];

        this.FG.patchValue(
          {
            hodIds,
          },
          { emitEvent: false },
        );
      });
  }

  onEllipsisClick(event: any, client: any, menu: any) {
    this.menuItems = [
      {
        label: 'Edit',
        icon: 'pi pi-pencil',
        command: () => this.ActionClick(client, 'Update'),
      },
    ];

    if (client.status === 'Pending') {
      this.menuItems.push(
        {
          label: 'Approve',
          icon: 'pi pi-check-circle',
          command: () => this.OpenApprove(client),
        },
        {
          label: 'Reject',
          icon: 'pi pi-times-circle',
          command: () => this.OpenReject(client),
        },
      );
    }

    menu.toggle(event);
  }

  OpenApprove(user: any) {
    this.selectedUser = user;

    this.approvalForm.reset({
      systemRole: null,
      departmentIds: [],
    });

    this.approvalVisible = true;

    this.GetDepartmentSelection();
  }

  OpenReject(user: any) {
    this.selectedUser = user;

    this.rejectForm.reset({
      reason: null,
    });

    this.rejectVisible = true;
  }

  GetHodSelection() {
    this.userService
      .GetMany({
        Page: 1,
        PageSize: 1000000,
        OrderBy: 'FullName',
        Filter: `SystemRole!=SuperAdmin`,
        Select: null,
        Includes: null,
      })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((res) => {
        this.hodSelection = res.data.map((user: any) => ({
          label: user.fullName,
          value: user.id,
        }));
      });
  }

  GetDepartmentSelection() {
    this.departmentService
      .GetMany({
        Page: 1,
        PageSize: 1000000,
        OrderBy: 'Name',
        Includes: null,
        Select: null,
        Filter: null,
      })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.departmentSelection = res.data.map((x) => ({
            label: x.name,
            value: x.id,
            hodId: x.hodId,
          }));
        },
      });
  }

  getLastSeen(lastLoginAt: string | Date): string {
    if (!lastLoginAt) return '-';

    const last = new Date(lastLoginAt).getTime();
    const now = Date.now();
    const diffMs = now - last;

    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (minutes < 2) return 'Online';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;

    return new Date(lastLoginAt).toLocaleDateString('en-MY', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  isActiveOnChange(event: any, userId: string) {
    this.userService.UpdateStatus(userId, event).subscribe({
      next: (res) => {
        if (res.success) {
          this.PagingSignal.update((current) => ({
            ...current,
            data: current.data.map((user) =>
              user.id === userId ? { ...user, isActive: event } : user,
            ),
          }));

          this.messageService.add({
            severity: 'success',
            summary: 'Updated',
            detail: `User is now ${event ? 'Active' : 'Inactive'}`,
          });
        }
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to update status',
        });
      },
    });
  }

  SaveUser() {
    ValidateAllFormFields(this.FG);

    if (this.FG.invalid) return;

    this.loadingService.start();

    const payload = this.FG.getRawValue();

    const request$: Observable<any> = this.isUpdate
      ? this.userService.UpdateUser(payload)
      : this.userService.AdminCreate(payload);

    request$.pipe(takeUntil(this.ngUnsubscribe)).subscribe({
      next: (res: any) => {
        this.loadingService.stop();

        if (res) {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `User ${this.isUpdate ? 'updated' : 'registered'} successfully`,
          });

          this.visible = false;
          if (this.isUpdate) {
            this.PagingSignal.update((state) => ({
              ...state,
              data: state.data.map((u: any) =>
                u.id === res.user.id ? res.user : u,
              ),
            }));
          } else {
            this.PagingSignal.update((state) => ({
              ...state,
              totalElements: state.totalElements + 1,
              data: [res, ...state.data],
            }));

            if (this.dashboardCount) {
              this.dashboardCount = {
                ...this.dashboardCount,
                totalUsers: this.dashboardCount.totalUsers + 1,
                activeUsers: this.dashboardCount.activeUsers + 1,
              };
            }
          }

          this.cdr.markForCheck();
        } else {
          this.messageService.add({
            severity: 'warn',
            summary: 'Warning',
            detail: res.message || res.Message || 'Operation partially failed',
          });
        }
      },
      error: (err: any) => {
        this.loadingService.stop();

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail:
            err.error?.message ||
            err.error?.Message ||
            'Something went wrong. Please try again.',
        });
      },
    });
  }

  ApproveUser() {
    if (this.approvalForm.invalid || !this.selectedUser) {
      this.approvalForm.markAllAsTouched();
      return;
    }

    const payload = {
      id: this.selectedUser.id,
      status: 'Approved',
      systemRole: this.approvalForm.value.systemRole,
      departmentIds: this.approvalForm.value.departmentIds,
    };

    this.loadingService.start();

    this.userService
      .UpdateApproval(payload)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();

          const approvedUserId = this.selectedUser.id;

          // Success message
          this.messageService.add({
            severity: 'success',
            summary: 'Approved',
            detail: 'User approved successfully',
          });

          // Update table row
          this.PagingSignal.update((state) => ({
            ...state,
            data: state.data.map((user: any) =>
              user.id === approvedUserId
                ? {
                    ...user,
                    status: 'Approved',
                    isActive: true,
                    systemRole: payload.systemRole,
                    departments: this.departmentSelection
                      .filter((d) => payload.departmentIds?.includes(d.value))
                      .map((d) => ({
                        id: d.value,
                        name: d.label,
                      })),
                  }
                : user,
            ),
          }));

          // Update dashboard counters
          if (this.dashboardCount) {
            this.dashboardCount = {
              ...this.dashboardCount,
              pendingUsers: Math.max(0, this.dashboardCount.pendingUsers - 1),
              activeUsers: this.dashboardCount.activeUsers + 1,
            };
          }

          this.approvalVisible = false;
          this.cdr.markForCheck();
        },

        error: (err) => {
          this.loadingService.stop();

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail:
              err.error?.message ||
              err.error?.Message ||
              'Failed to approve user. Please try again.',
          });
        },
      });
  }

  RejectUser() {
    if (this.rejectForm.invalid) return;

    const payload = {
      id: this.selectedUser.id,
      status: 'Rejected',
      reason: this.rejectForm.value.reason,
    };

    this.userService.UpdateApproval(payload).subscribe({
      next: (res) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Rejected',
          detail: 'User rejected successfully',
        });

        this.PagingSignal.update((state) => ({
          ...state,
          data: state.data.map((user: any) =>
            user.id === this.selectedUser.id
              ? {
                  ...user,
                  status: 'Rejected',
                  rejectionReason: payload.reason,
                }
              : user,
          ),
        }));

        if (this.dashboardCount) {
          this.dashboardCount = {
            ...this.dashboardCount,
            pendingUsers: Math.max(0, this.dashboardCount.pendingUsers - 1),
          };
        }

        this.rejectVisible = false;
        this.cdr.markForCheck();
      },
    });
  }

  getRoleLabel(role: string): string {
    return (
      this.systemRoles.find((x) => x.value === role)?.label || 'Unassigned Role'
    );
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
