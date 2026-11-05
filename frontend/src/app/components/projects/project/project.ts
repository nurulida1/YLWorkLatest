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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { LoadingService } from '../../../services/loading.service';
import { MenuItem } from 'primeng/api';
import { ProjectService } from '../../../services/ProjectService';
import { Subject, takeUntil } from 'rxjs';
import {
  BuildFilterText,
  BuildSortText,
  GridifyQueryExtend,
  PagingContent,
} from '../../../shared/helpers/helpers';
import { ProjectDto } from '../../../models/Project';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { MultiSelectModule } from 'primeng/multiselect';
import { ProgressBarModule } from 'primeng/progressbar';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core/index.js';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { TabsModule } from 'primeng/tabs';
import { CheckboxModule } from 'primeng/checkbox';
import { UserService } from '../../../services/userService.service';

@Component({
  selector: 'app-project',
  imports: [
    CommonModule,
    RouterLink,
    InputTextModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    ReactiveFormsModule,
    DatePickerModule,
    TextareaModule,
    MenuModule,
    SelectModule,
    MultiSelectModule,
    ProgressBarModule,
    AvatarModule,
    TooltipModule,
    FullCalendarModule,
    TabsModule,
    CheckboxModule,
  ],
  template: `
    <ng-container>
      <!-- ================= MOBILE ================= -->
      <div class="lg:hidden min-h-screen bg-slate-50 pb-8">
        <!-- Header -->
        <div
          class="relative overflow-hidden rounded-b-[2rem] bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 px-5 pt-6 pb-8"
        >
          <div
            class="absolute -right-12 -top-16 h-48 w-48 rounded-full border border-white/10"
          ></div>
          <div
            class="absolute -right-5 -top-9 h-32 w-32 rounded-full border border-white/10"
          ></div>

          <div class="relative z-10">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div
                  class="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15"
                >
                  <i class="pi pi-briefcase text-white"></i>
                </div>
                <div>
                  <div
                    class="text-xs font-medium tracking-widest text-blue-100"
                  >
                    YL WORKS
                  </div>
                  <div class="text-sm font-bold text-white">
                    Project Management
                  </div>
                </div>
              </div>

              <div
                class="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10"
              >
                <span class="text-sm font-bold text-white">
                  {{ getInitial(currentUser?.displayName) }}
                </span>
              </div>
            </div>

            <div class="mt-7 flex items-end justify-between gap-3">
              <div>
                <h1 class="text-2xl font-bold text-white">Projects</h1>
                <p class="mt-1 max-w-[230px] text-sm text-blue-100">
                  Monitor your projects, site progress and timelines.
                </p>
              </div>

              <p-button
                icon="pi pi-plus"
                label="New"
                size="small"
                [rounded]="true"
                [routerLink]="'/projects/form'"
                styleClass="border-0! bg-white! px-4! font-bold! text-blue-700! shadow-lg!"
              ></p-button>
            </div>
          </div>
        </div>

        <!-- Mobile Content -->
        <div class="-mt-4 relative z-10 px-4">
          <!-- Search -->
          <div
            class="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
          >
            <div class="relative">
              <i
                class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              ></i>
              <input
                pInputText
                type="text"
                [(ngModel)]="search"
                (keyup)="onKeyDown($event)"
                placeholder="Search project code or name..."
                class="w-full rounded-xl! border-slate-200! bg-slate-50! py-3! pl-10! text-sm!"
              />
            </div>
          </div>

          <!-- Status Filters -->
          <div class="mt-5">
            <div class="mb-3 flex items-center justify-between">
              <span class="text-sm font-bold text-slate-800">Project List</span>
              <span class="text-xs text-slate-500">
                {{ PagingSignal().totalElements || 0 }} projects
              </span>
            </div>

            <div class="flex gap-2 overflow-x-auto pb-2">
              <button
                type="button"
                (click)="selectedStatus = null"
                class="shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition"
                [ngClass]="
                  selectedStatus === null
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-200 bg-white text-slate-600'
                "
              >
                All
              </button>

              <button
                type="button"
                *ngFor="
                  let status of [
                    'Planning',
                    'InProgress',
                    'OnHold',
                    'Completed',
                  ]
                "
                (click)="
                  selectedStatus = selectedStatus === status ? null : status
                "
                class="shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition"
                [ngClass]="
                  selectedStatus === status
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-200 bg-white text-slate-600'
                "
              >
                {{
                  status === 'InProgress'
                    ? 'In Progress'
                    : status === 'OnHold'
                      ? 'On Hold'
                      : status
                }}
              </button>
            </div>
          </div>

          <!-- Project Cards -->
          <div class="mt-3 flex flex-col gap-3">
            <ng-container *ngIf="mobileProjects.length > 0; else mobileEmpty">
              <div
                *ngFor="let data of mobileProjects"
                class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <!-- Project Header -->
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0 flex-1">
                    <div class="text-xs font-bold tracking-wide text-blue-700">
                      {{ data.projectCode }}
                    </div>
                    <a
                      [routerLink]="'/projects/details'"
                      [queryParams]="{ id: data.id }"
                      class="mt-1 block text-base font-bold leading-snug text-slate-800"
                    >
                      {{ data.projectTitle }}
                    </a>
                  </div>

                  <button
                    type="button"
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600"
                    aria-label="Project actions"
                    (click)="onEllipsisClick($event, data, menu)"
                  >
                    <i class="pi pi-ellipsis-v"></i>
                  </button>
                </div>

                <!-- Client -->
                <div class="mt-4 flex items-center gap-2">
                  <div
                    class="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50"
                  >
                    <i class="pi pi-building text-sm! text-indigo-600"></i>
                  </div>
                  <div class="min-w-0">
                    <div
                      class="text-[10px] font-semibold uppercase tracking-wide text-slate-400"
                    >
                      Client
                    </div>
                    <div class="truncate text-sm font-semibold text-slate-700">
                      {{ data.client?.name || 'No client assigned' }}
                    </div>
                  </div>
                </div>

                <!-- Dates -->
                <div
                  class="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3"
                >
                  <div>
                    <div
                      class="text-[10px] font-semibold uppercase tracking-wide text-slate-400"
                    >
                      Start Date
                    </div>
                    <div class="mt-1 text-xs font-semibold text-slate-700">
                      {{ data.startDate | date: 'dd MMM yyyy' }}
                    </div>
                  </div>

                  <div>
                    <div
                      class="text-[10px] font-semibold uppercase tracking-wide text-slate-400"
                    >
                      Estimated Completion
                    </div>
                    <div class="mt-1 text-xs font-semibold text-slate-700">
                      {{ data.estimatedCompletedDate | date: 'dd MMM yyyy' }}
                    </div>
                  </div>
                </div>

                <!-- Priority and Status -->
                <div
                  class="mt-4 flex flex-wrap items-center justify-between gap-2"
                >
                  <span
                    class="rounded-full border px-3 py-1 text-xs font-semibold"
                    [ngClass]="{
                      'border-blue-200 bg-blue-50 text-blue-700':
                        data.priority === 'Low',
                      'border-yellow-200 bg-yellow-50 text-yellow-700':
                        data.priority === 'Medium',
                      'border-red-200 bg-red-50 text-red-700':
                        data.priority === 'High',
                    }"
                  >
                    <i class="pi pi-flag mr-1 text-sm!"></i>
                    {{ data.priority || 'Normal' }} Priority
                  </span>

                  <span
                    class="rounded-full px-3 py-1 text-xs font-semibold"
                    [ngClass]="{
                      'bg-slate-100 text-slate-600': data.status === 'Draft',
                      'bg-amber-50 text-amber-700': data.status === 'Planning',
                      'bg-blue-50 text-blue-700': data.status === 'InProgress',
                      'bg-red-50 text-red-700': data.status === 'OnHold',
                      'bg-green-50 text-green-700': data.status === 'Completed',
                    }"
                  >
                    <i class="pi pi-circle-fill mr-1 text-[6px]!"></i>
                    {{
                      data.status === 'InProgress'
                        ? 'In Progress'
                        : data.status === 'OnHold'
                          ? 'On Hold'
                          : data.status
                    }}
                  </span>
                </div>
              </div>
            </ng-container>

            <ng-template #mobileEmpty>
              <div
                class="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center"
              >
                <div
                  class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100"
                >
                  <i class="pi pi-folder-open text-2xl text-slate-400"></i>
                </div>
                <div class="mt-4 font-bold text-slate-700">
                  No projects found
                </div>
                <p class="mt-1 text-sm text-slate-500">
                  Try changing your search or status filter.
                </p>
              </div>
            </ng-template>
          </div>

          <!-- Mobile Pagination -->
          <div class="mt-5 flex items-center justify-between gap-3">
            <span class="text-xs text-slate-500"> Page {{ Query.Page }} </span>

            <div class="flex gap-2">
              <p-button
                icon="pi pi-chevron-left"
                [text]="true"
                [rounded]="true"
                severity="secondary"
                [disabled]="Query.Page <= 1"
                (onClick)="changeMobilePage(-1)"
              ></p-button>

              <p-button
                icon="pi pi-chevron-right"
                [text]="true"
                [rounded]="true"
                severity="secondary"
                [disabled]="
                  Query.Page * Query.PageSize >= PagingSignal().totalElements
                "
                (onClick)="changeMobilePage(1)"
              ></p-button>
            </div>
          </div>
        </div>
      </div>

      <!-- ================= DESKTOP ================= -->
      <div class="hidden min-h-screen bg-slate-50 p-6 lg:block">
        <!-- Breadcrumb -->
        <div class="mb-5 flex items-center gap-2 text-sm text-slate-500">
          <a routerLink="/dashboard" class="transition hover:text-blue-600">
            Dashboard
          </a>
          <i class="pi pi-chevron-right text-[9px]"></i>
          <span class="font-semibold text-slate-800">Projects</span>
        </div>

        <!-- Page Header -->
        <div class="mb-5 flex items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold tracking-tight text-slate-800">
              Projects
            </h1>
            <p class="mt-1 text-sm text-slate-500">
              Manage and monitor project lifecycles, clients and site progress.
            </p>
          </div>

          <p-button
            label="New Project"
            icon="pi pi-plus"
            severity="info"
            [routerLink]="'/projects/form'"
            styleClass="border-0! bg-blue-700! px-5! py-2.5! font-semibold! shadow-sm!"
          ></p-button>
        </div>

        <!-- Main Panel -->
        <div
          class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <!-- Toolbar -->
          <div
            class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-5"
          >
            <div>
              <h2 class="font-bold text-slate-800">All Projects</h2>
              <p class="mt-1 text-xs text-slate-500">
                {{ PagingSignal().totalElements || 0 }} project records
              </p>
            </div>

            <div class="flex items-center gap-2">
              <div class="relative w-80">
                <i
                  class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                ></i>
                <input
                  pInputText
                  type="text"
                  [(ngModel)]="search"
                  (keyup)="onKeyDown($event)"
                  placeholder="Search project code or title..."
                  class="w-full border-slate-200! pl-10!"
                />
              </div>

              <p-button
                icon="pi pi-refresh"
                severity="secondary"
                [outlined]="true"
                pTooltip="Refresh"
                (onClick)="ResetTable()"
              ></p-button>
            </div>
          </div>

          <!-- Table -->
          <div class="p-5">
            <p-table
              #fTable
              [value]="PagingSignal().data || []"
              [paginator]="true"
              [rows]="Query.PageSize"
              [totalRecords]="PagingSignal().totalElements"
              [tableStyle]="{ 'min-width': '75rem' }"
              [rowsPerPageOptions]="[10, 20, 30, 50]"
              [showGridlines]="false"
              [rowHover]="true"
              [lazy]="true"
              (onLazyLoad)="NextPage($event)"
            >
              <ng-template #header>
                <tr>
                  <th
                    pSortableColumn="ProjectCode"
                    class="bg-slate-50! text-slate-600!"
                  >
                    Project Code
                    <p-sortIcon field="ProjectCode"></p-sortIcon>
                  </th>

                  <th
                    pSortableColumn="ProjectTitle"
                    class="bg-slate-50! text-slate-600!"
                  >
                    Project
                    <p-sortIcon field="ProjectTitle"></p-sortIcon>
                  </th>

                  <th class="bg-slate-50! text-slate-600!">Client</th>

                  <th
                    pSortableColumn="Priority"
                    class="bg-slate-50! text-center! text-slate-600!"
                  >
                    Priority
                    <p-sortIcon field="Priority"></p-sortIcon>
                  </th>

                  <th class="bg-slate-50! text-slate-600!">Timeline</th>

                  <th
                    pSortableColumn="Status"
                    class="bg-slate-50! text-center! text-slate-600!"
                  >
                    Status
                    <p-sortIcon field="Status"></p-sortIcon>
                  </th>

                  <th class="bg-slate-50! text-center! text-slate-600!">
                    Actions
                  </th>
                </tr>
              </ng-template>

              <ng-template #body let-data>
                <tr class="transition hover:bg-slate-50">
                  <td>
                    <a
                      [routerLink]="'/projects/details'"
                      [queryParams]="{ id: data.id }"
                      class="font-bold text-blue-700 hover:underline"
                    >
                      {{ data.projectCode }}
                    </a>
                  </td>

                  <td>
                    <div class="font-semibold text-slate-800">
                      {{ data.projectTitle }}
                    </div>
                  </td>

                  <td>
                    <div class="flex items-center gap-2">
                      <div
                        class="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50"
                      >
                        <i class="pi pi-building text-sm! text-indigo-600"></i>
                      </div>
                      <span class="text-sm text-slate-700">
                        {{ data.client?.name || '-' }}
                      </span>
                    </div>
                  </td>

                  <td class="text-center!">
                    <span
                      class="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                      [ngClass]="{
                        'bg-blue-50 text-blue-700': data.priority === 'Low',
                        'bg-yellow-50 text-yellow-700':
                          data.priority === 'Medium',
                        'bg-red-50 text-red-700': data.priority === 'High',
                      }"
                    >
                      {{ data.priority || 'Normal' }}
                    </span>
                  </td>

                  <td>
                    <div class="flex flex-col gap-1 text-xs">
                      <span class="font-medium text-slate-700">
                        {{ data.startDate | date: 'dd MMM yyyy' }}
                      </span>
                      <span class="text-slate-400">
                        to
                        {{ data.estimatedCompletedDate | date: 'dd MMM yyyy' }}
                      </span>
                    </div>
                  </td>

                  <td class="text-center!">
                    <span
                      class="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold"
                      [ngClass]="{
                        'bg-slate-100 text-slate-600': data.status === 'Draft',
                        'bg-amber-50 text-amber-700':
                          data.status === 'Planning',
                        'bg-blue-50 text-blue-700':
                          data.status === 'InProgress',
                        'bg-red-50 text-red-700': data.status === 'OnHold',
                        'bg-green-50 text-green-700':
                          data.status === 'Completed',
                      }"
                    >
                      <i class="pi pi-circle-fill text-[6px]!"></i>
                      {{
                        data.status === 'InProgress'
                          ? 'In Progress'
                          : data.status === 'OnHold'
                            ? 'On Hold'
                            : data.status
                      }}
                    </span>
                  </td>

                  <td class="text-center!">
                    <button
                      type="button"
                      class="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-blue-700"
                      aria-label="Project actions"
                      (click)="onEllipsisClick($event, data, menu)"
                    >
                      <i class="pi pi-ellipsis-v"></i>
                    </button>
                  </td>
                </tr>
              </ng-template>

              <ng-template #emptymessage>
                <tr>
                  <td colspan="7">
                    <div
                      class="flex flex-col items-center justify-center py-14 text-center"
                    >
                      <i class="pi pi-folder-open text-4xl text-slate-300"></i>
                      <div class="mt-3 font-semibold text-slate-700">
                        No projects found
                      </div>
                      <p class="mt-1 text-sm text-slate-400">
                        Try changing your search criteria.
                      </p>
                    </div>
                  </td>
                </tr>
              </ng-template>
            </p-table>
          </div>
        </div>
      </div>

      <!-- Shared Action Menu -->
      <p-menu #menu [model]="menuItems" [popup]="true"></p-menu>
    </ng-container>

    <!-- Desktop Projects -->
    <div class="hidden lg:flex flex-col w-full min-h-[92.9vh] p-6 bg-slate-50">
      <!-- Breadcrumb -->
      <div class="flex items-center gap-2 text-sm text-slate-500">
        <div
          [routerLink]="'/dashboard'"
          class="cursor-pointer transition-colors hover:text-blue-600"
        >
          Dashboard
        </div>
        <i class="pi pi-chevron-right text-[9px]!"></i>
        <span class="font-semibold text-slate-800">Projects</span>
      </div>

      <!-- Main Container -->
      <div
        class="mt-5 flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm"
      >
        <!-- Page Header -->
        <div
          class="flex flex-row items-center justify-between gap-4 border-b border-slate-100 px-6 py-5"
        >
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-2">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700"
              >
                <i class="pi pi-briefcase text-lg"></i>
              </div>

              <div class="flex flex-col">
                <h1 class="text-xl font-bold tracking-tight text-slate-800">
                  Projects
                </h1>
                <p class="text-sm text-slate-500">
                  Manage and monitor precision engineering project lifecycles.
                </p>
              </div>
            </div>
          </div>

          <p-button
            label="New Project"
            icon="pi pi-plus"
            severity="info"
            styleClass="!bg-blue-700 !border-blue-700 !rounded-lg !px-5 !py-2.5 !text-sm !font-semibold hover:!bg-blue-800"
            [routerLink]="'/projects/form'"
          ></p-button>
        </div>

        <!-- Toolbar -->
        <div
          class="flex flex-row items-center justify-between gap-4 border-b border-slate-100 px-6 py-4"
        >
          <div class="relative w-full max-w-md">
            <i
              class="pi pi-search absolute left-3 top-1/2 z-10 -translate-y-1/2 text-sm text-slate-400"
            ></i>

            <input
              type="text"
              pInputText
              [(ngModel)]="search"
              class="!w-full !rounded-lg !border-slate-200 !bg-slate-50 !py-2.5 !pl-10 !pr-4 !text-sm focus:!border-blue-400 focus:!bg-white"
              placeholder="Search project code or project name..."
              (keyup)="onKeyDown($event)"
            />
          </div>

          <div class="flex items-center gap-2 text-xs text-slate-500">
            <i class="pi pi-info-circle"></i>
            <span>Showing project records</span>
          </div>
        </div>

        <!-- Project Table -->
        <div class="px-6 py-5">
          <p-table
            #fTable
            [value]="PagingSignal().data"
            [paginator]="true"
            [rows]="Query.PageSize"
            [totalRecords]="PagingSignal().totalElements"
            [tableStyle]="{ 'min-width': '75rem' }"
            [rowsPerPageOptions]="[10, 20, 30, 50]"
            [showGridlines]="false"
            [lazy]="true"
            (onLazyLoad)="NextPage($event)"
            styleClass="project-table"
          >
            <!-- Header -->
            <ng-template #header>
              <tr>
                <th
                  pSortableColumn="ProjectCode"
                  class="!w-[14%] !bg-slate-50 !px-4 !py-4 !text-center !text-xs !font-bold !uppercase !tracking-wider !text-slate-500"
                >
                  <div class="flex items-center justify-center gap-2">
                    Project Code
                    <p-sortIcon field="ProjectCode"></p-sortIcon>
                  </div>
                </th>

                <th
                  pSortableColumn="ProjectTitle"
                  class="!w-[25%] !bg-slate-50 !px-4 !py-4 !text-xs !font-bold !uppercase !tracking-wider !text-slate-500"
                >
                  <div class="flex items-center gap-2">
                    Project Title
                    <p-sortIcon field="ProjectTitle"></p-sortIcon>
                  </div>
                </th>

                <th
                  pSortableColumn="Priority"
                  class="!w-[11%] !bg-slate-50 !px-4 !py-4 !text-center !text-xs !font-bold !uppercase !tracking-wider !text-slate-500"
                >
                  <div class="flex items-center justify-center gap-2">
                    Priority
                    <p-sortIcon field="Priority"></p-sortIcon>
                  </div>
                </th>

                <th
                  class="!w-[18%] !bg-slate-50 !px-4 !py-4 !text-xs !font-bold !uppercase !tracking-wider !text-slate-500"
                >
                  Client
                </th>

                <th
                  class="!w-[17%] !bg-slate-50 !px-4 !py-4 !text-center !text-xs !font-bold !uppercase !tracking-wider !text-slate-500"
                >
                  Timeline
                </th>

                <th
                  pSortableColumn="Status"
                  class="!w-[11%] !bg-slate-50 !px-4 !py-4 !text-center !text-xs !font-bold !uppercase !tracking-wider !text-slate-500"
                >
                  <div class="flex items-center justify-center gap-2">
                    Status
                    <p-sortIcon field="Status"></p-sortIcon>
                  </div>
                </th>

                <th
                  class="!w-[4%] !bg-slate-50 !px-4 !py-4 !text-center !text-xs !font-bold !uppercase !tracking-wider !text-slate-500"
                >
                  Action
                </th>
              </tr>
            </ng-template>

            <!-- Body -->
            <ng-template #body let-data>
              <tr class="transition-colors hover:!bg-slate-50">
                <!-- Project Code -->
                <td class="!px-4 !py-4 !text-center">
                  <a
                    class="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-100 hover:text-blue-800"
                    [routerLink]="'/projects/details'"
                    [queryParams]="{ id: data.id }"
                  >
                    {{ data.projectCode }}
                  </a>
                </td>

                <!-- Project Title -->
                <td class="!px-4 !py-4">
                  <div class="font-semibold text-slate-800">
                    {{ data.projectTitle }}
                  </div>
                </td>

                <!-- Priority -->
                <td class="!px-4 !py-4 !text-center">
                  <span
                    class="inline-flex min-w-[75px] items-center justify-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold"
                    [ngClass]="{
                      'border-red-200 bg-red-50 text-red-700':
                        data.priority === 'High',
                      'border-yellow-200 bg-yellow-50 text-yellow-700':
                        data.priority === 'Medium',
                      'border-blue-200 bg-blue-50 text-blue-700':
                        data.priority === 'Low',
                    }"
                  >
                    <i class="pi pi-circle-fill text-[6px]!"></i>
                    {{ data.priority }}
                  </span>
                </td>

                <!-- Client -->
                <td class="!px-4 !py-4">
                  <div class="flex items-center gap-2">
                    <div
                      class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600"
                    >
                      {{ data.client?.name?.charAt(0) || '?' }}
                    </div>

                    <span class="text-sm font-medium text-slate-700">
                      {{ data.client?.name || '-' }}
                    </span>
                  </div>
                </td>

                <!-- Timeline -->
                <td class="!px-4 !py-4 !text-center">
                  <div class="flex flex-col items-center gap-1 text-xs">
                    <span class="font-medium text-slate-700">
                      {{ data.startDate | date: 'dd MMM yyyy' }}
                    </span>

                    <span class="text-slate-400"> to </span>

                    <span class="font-medium text-slate-700">
                      {{ data.estimatedCompletedDate | date: 'dd MMM yyyy' }}
                    </span>
                  </div>
                </td>

                <!-- Status -->
                <td class="!px-4 !py-4 !text-center">
                  <span
                    class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold"
                    [ngClass]="{
                      'border-amber-200 bg-amber-50 text-amber-700':
                        data.status === 'Draft',
                      'border-yellow-200 bg-yellow-50 text-yellow-700':
                        data.status === 'Planning',
                      'border-blue-200 bg-blue-50 text-blue-700':
                        data.status === 'InProgress',
                      'border-red-200 bg-red-50 text-red-700':
                        data.status === 'OnHold',
                      'border-green-200 bg-green-50 text-green-700':
                        data.status === 'Completed',
                    }"
                  >
                    <i class="pi pi-circle-fill text-[6px]!"></i>

                    {{
                      data.status === 'InProgress' ? 'In Progress' : data.status
                    }}
                  </span>
                </td>

                <!-- Action -->
                <td class="!px-4 !py-4 !text-center">
                  <button
                    *ngIf="data.status !== 'Completed'"
                    type="button"
                    class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                    (click)="onEllipsisClick($event, data, menu)"
                    pTooltip="More actions"
                    tooltipPosition="left"
                  >
                    <i class="pi pi-ellipsis-v"></i>
                  </button>

                  <span
                    *ngIf="data.status === 'Completed'"
                    class="text-xs text-slate-300"
                  >
                    -
                  </span>
                </td>
              </tr>
            </ng-template>

            <!-- Empty State -->
            <ng-template #emptymessage>
              <tr>
                <td colspan="7" class="!border-0 !py-16">
                  <div class="flex flex-col items-center justify-center gap-3">
                    <div
                      class="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400"
                    >
                      <i class="pi pi-folder-open text-2xl"></i>
                    </div>

                    <div class="text-sm font-semibold text-slate-700">
                      No projects found
                    </div>

                    <div class="text-xs text-slate-400">
                      Try changing your search or create a new project.
                    </div>
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      </div>
    </div>

    <!-- Project Actions Menu -->
    <p-menu #menu [model]="menuItems" [popup]="true" appendTo="body"></p-menu>
  `,
  styleUrl: './project.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Project implements OnInit, OnDestroy {
  @ViewChild('fTable') fTable?: Table;

  private readonly loadingService = inject(LoadingService);
  private readonly projectService = inject(ProjectService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly userService = inject(UserService);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  PagingSignal = signal<PagingContent<ProjectDto>>(
    {} as PagingContent<ProjectDto>,
  );
  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  search: string = '';
  viewMode: 'grid' | 'list' | 'calendar' = 'grid';
  title: string = 'Create New Project';
  selectedStatus: string | null = null;
  sortBy: string | null = null;
  menuItems: MenuItem[] = [];

  currentUser = this.userService.currentUser;

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay',
    },
    events: this.getCalendarEvents(),
    height: 650,
    editable: false,
  };

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 10;
    this.Query.Filter = null;
    this.Query.OrderBy = `CreatedAt desc`;
    this.Query.Select = null;
    this.Query.Includes = null;
  }

  ngOnInit(): void {
    if (this.mobileProjects) {
      this.GetData();
    }
  }

  getCalendarEvents() {
    if (!this.PagingSignal()?.data) return [];
    return this.PagingSignal().data.map((project) => ({
      title: project.projectTitle,
      start: project.createdAt,
      end: project.dueDate,
      extendedProps: {
        priority: project.priority,
        status: project.status,
      },
      backgroundColor:
        project.status === 'Completed'
          ? '#10B981'
          : project.status === 'On Hold'
            ? '#EF4444'
            : '#3B82F6',
    }));
  }

  GetData() {
    this.loadingService.start();
    this.projectService
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
      ProjectCode: [
        {
          value: data,
          matchMode: '=',
          operator: 'and',
        },
      ],
      ProjectTitle: [
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

  ActionClick(data: ProjectDto | null, action: string) {
    if (action === 'Edit') {
      this.router.navigate(['/projects/form'], {
        queryParams: { id: data?.id },
      });
    }
  }

  onEllipsisClick(event: any, project: any, menu: any) {
    const statusFlow: Record<string, string[]> = {
      Planning: ['Start Progress'],
      InProgress: ['Put On Hold', 'Mark Completed'],
      OnHold: ['Resume Progress', 'Mark Completed'],
      Completed: [],
    };

    const actions = statusFlow[project.status] || [];

    this.menuItems = [
      {
        label: 'Edit',
        icon: 'pi pi-pencil',
        command: () => this.ActionClick(project, 'Edit'),
      },
      ...actions.map((action) => ({
        label: action,
        icon: this.getStatusIcon(action),
        command: () => this.handleStatusChange(project, action),
      })),
    ];

    menu.toggle(event);
  }

  handleStatusChange(project: any, action: string) {
    let newStatus = project.status;

    switch (action) {
      case 'Start Progress':
        newStatus = 'InProgress';
        break;
      case 'Put On Hold':
        newStatus = 'OnHold';
        break;
      case 'Resume Progress':
        newStatus = 'InProgress';
        break;
      case 'Mark Completed':
        newStatus = 'Completed';
        break;
    }

    this.projectService
      .UpdateStatus({
        projectId: project.id,
        status: newStatus,
      })
      .subscribe((res) => {
        project.status = res.status;
        this.cdr.markForCheck();
      });
  }

  getStatusIcon(action: string) {
    switch (action) {
      case 'Start Progress':
      case 'Resume Progress':
        return 'pi pi-play';

      case 'Put On Hold':
        return 'pi pi-pause';

      case 'Mark Completed':
        return 'pi pi-check';

      default:
        return 'pi pi-cog';
    }
  }

  getInitial(fullName?: string): string {
    if (!fullName?.trim()) return '?';

    const names = fullName.trim().split(/\s+/).filter(Boolean);

    if (names.length === 1) {
      return names[0].substring(0, 2).toUpperCase();
    }

    return (names[0].charAt(0) + names[1].charAt(0)).toUpperCase();
  }

  get mobileProjects(): ProjectDto[] {
    const projects = this.PagingSignal()?.data ?? [];

    return projects.filter((project: any) => {
      const matchesStatus =
        !this.selectedStatus || project.status === this.selectedStatus;

      const searchText = this.search.trim().toLowerCase();

      const matchesSearch =
        !searchText ||
        project.projectCode?.toLowerCase().includes(searchText) ||
        project.projectTitle?.toLowerCase().includes(searchText) ||
        project.client?.name?.toLowerCase().includes(searchText);

      return matchesStatus && matchesSearch;
    });
  }

  changeMobilePage(direction: number): void {
    const totalPages = Math.ceil(
      (this.PagingSignal()?.totalElements ?? 0) / this.Query.PageSize,
    );

    const nextPage = this.Query.Page + direction;

    if (nextPage < 1 || nextPage > totalPages) {
      return;
    }

    this.Query.Page = nextPage;
    this.GetData();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
