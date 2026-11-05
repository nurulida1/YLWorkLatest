import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { TagModule } from 'primeng/tag';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { finalize } from 'rxjs/operators';
import {
  HrDashboardDto,
  SuperAdminDashboardDto,
  TeamAbsence,
} from '../../../models/AppModels';
import { LeaveCalendarEventDto } from '../../../models/Leave';
import { AppService } from '../../../services/appService.service';
import { LeaveRequestService } from '../../../services/leave-request.service';
import { LoadingService } from '../../../services/loading.service';
import { UserService } from '../../../services/userService.service';
import { ProgressBarModule } from 'primeng/progressbar';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import {
  CLAIM_TYPE_LABELS,
  ClaimType,
  MedicalBalanceDto,
} from '../../../models/Claim';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { Notice } from '../../../models/Notice';
import { HardwareRequestService } from '../../../services/HardwareRequestService';
import { HardwareRequestDto } from '../../../models/HardwareRequest';

interface PersonalTask {
  title: string;
  description: string;
  priority: string;
  severity: 'info' | 'warn' | 'danger';
}

interface WeekDayCell {
  label: string;
  date: Date;
  key: string;
  isToday: boolean;
  events: LeaveCalendarEventDto[];
}

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    ButtonModule,
    RouterLink,
    ChartModule,
    ProgressBarModule,
    TagModule,
    TableModule,
    DialogModule,
    SelectModule,
    ReactiveFormsModule,
    TextareaModule,
    DatePickerModule,
    InputNumberModule,
  ],
  template: `
    @if (isSuperAdmin) {
      <div class="bg-[#F8FAFC] p-4 sm:p-6 lg:p-8">
        @if (superAdminDashboard(); as dashboard) {
          <!-- HEADER -->
          <div
            class="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-5"
          >
            <div>
              <div class="flex items-center gap-2 text-sm text-gray-400 mb-2">
                <i class="pi pi-home"></i>
                <span>Workspace</span>
                <i class="pi pi-angle-right text-xs"></i>
                <span class="text-[#2148BC] font-medium">Dashboard</span>
              </div>

              <h1 class="text-3xl font-bold tracking-tight text-gray-950">
                Good morning, {{ currentUser?.displayName || 'Administrator' }}
              </h1>

              <p class="text-gray-500 mt-2">
                Here's what's happening across your YL Works workspace.
              </p>
            </div>

            <div class="flex items-center gap-3">
              <div
                class="hidden sm:flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-gray-200 shadow-sm"
              >
                <i class="pi pi-calendar text-[#2148BC]"></i>
                <span class="text-sm font-medium text-gray-600">
                  {{ today | date: 'dd MMM yyyy' }}
                </span>
              </div>

              <div
                class="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-50 border border-blue-100"
              >
                <span class="w-2 h-2 rounded-full bg-green-500"></span>
                <span class="text-sm font-semibold text-[#2148BC]">
                  SuperAdmin
                </span>
              </div>
            </div>
          </div>

          <!-- SUMMARY CARDS -->
          <div
            class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8"
          >
            <!-- TOTAL USERS -->
            <div
              class="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div class="flex items-center justify-between">
                <div class="text-sm font-medium text-gray-500">Total Users</div>
                <div
                  class="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center"
                >
                  <i class="pi pi-users text-[#2148BC] text-lg!"></i>
                </div>
              </div>
              <div class="text-3xl font-bold text-gray-900 mt-5">
                {{ dashboard.totalUsers }}
              </div>
              <div class="text-sm text-gray-400 mt-2">Registered accounts</div>
            </div>

            <!-- ACTIVE USERS -->
            <div
              class="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div class="flex items-center justify-between">
                <div class="text-sm font-medium text-gray-500">
                  Active Users
                </div>
                <div
                  class="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center"
                >
                  <i class="pi pi-check-circle text-green-600 text-lg!"></i>
                </div>
              </div>
              <div class="text-3xl font-bold text-gray-900 mt-5">
                {{ dashboard.activeUsers }}
              </div>
              <div class="text-sm text-green-600 mt-2">Active accounts</div>
            </div>

            <!-- INACTIVE USERS -->
            <div
              class="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div class="flex items-center justify-between">
                <div class="text-sm font-medium text-gray-500">
                  Inactive Users
                </div>
                <div
                  class="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center"
                >
                  <i class="pi pi-user-minus text-gray-600 text-lg!"></i>
                </div>
              </div>
              <div class="text-3xl font-bold text-gray-900 mt-5">
                {{ dashboard.inactiveUsers }}
              </div>
              <div class="text-sm text-gray-400 mt-2">Inactive accounts</div>
            </div>

            <!-- PENDING APPROVALS -->
            <div
              class="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div class="flex items-center justify-between">
                <div class="text-sm font-medium text-gray-500">
                  Pending Approvals
                </div>
                <div
                  class="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center"
                >
                  <i class="pi pi-clock text-amber-600 text-lg!"></i>
                </div>
              </div>
              <div class="text-3xl font-bold text-amber-600 mt-5">
                {{ dashboard.pendingApprovals }}
              </div>
              <a
                routerLink="/user-management"
                class="text-sm font-semibold text-[#2148BC] hover:underline mt-2 inline-flex items-center gap-1"
              >
                Review registrations
                <i class="pi pi-arrow-up-right text-[10px]"></i>
              </a>
            </div>

            <!-- DEPARTMENTS -->
            <div
              class="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div class="flex items-center justify-between">
                <div class="text-sm font-medium text-gray-500">Departments</div>
                <div
                  class="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center"
                >
                  <i class="pi pi-sitemap text-indigo-600 text-lg!"></i>
                </div>
              </div>
              <div class="text-3xl font-bold text-gray-900 mt-5">
                {{ dashboard.totalDepartments }}
              </div>
              <div class="text-sm text-gray-400 mt-2">
                Organisation departments
              </div>
            </div>

            <!-- INVENTORY -->
            <div
              class="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div class="flex items-center justify-between">
                <div class="text-sm font-medium text-gray-500">
                  Inventory Items
                </div>
                <div
                  class="w-11 h-11 rounded-xl bg-cyan-50 flex items-center justify-center"
                >
                  <i class="pi pi-box text-cyan-700 text-lg!"></i>
                </div>
              </div>
              <div class="text-3xl font-bold text-gray-900 mt-5">
                {{ dashboard.totalInventoryItems }}
              </div>
              <div class="text-sm text-gray-400 mt-2">Total recorded items</div>
            </div>

            <!-- LOW STOCK -->
            <div
              class="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div class="flex items-center justify-between">
                <div class="text-sm font-medium text-gray-500">
                  Low Stock Items
                </div>
                <div
                  class="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center"
                >
                  <i
                    class="pi pi-exclamation-triangle text-orange-600 text-lg!"
                  ></i>
                </div>
              </div>
              <div class="text-3xl font-bold text-orange-600 mt-5">
                {{ dashboard.lowStockItems }}
              </div>
              <div class="text-sm text-gray-400 mt-2">
                Items requiring attention
              </div>
            </div>

            <!-- FAULTY ITEMS -->
            <div
              class="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div class="flex items-center justify-between">
                <div class="text-sm font-medium text-gray-500">
                  Faulty Items
                </div>
                <div
                  class="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center"
                >
                  <i class="pi pi-wrench text-red-600 text-lg!"></i>
                </div>
              </div>
              <div class="text-3xl font-bold text-red-600 mt-5">
                {{ dashboard.faultyItems }}
              </div>
              <div class="text-sm text-gray-400 mt-2">
                Items requiring maintenance
              </div>
            </div>
          </div>

          <!-- LOWER SECTION -->
          <div class="grid grid-cols-1 xl:grid-cols-12 gap-5">
            <!-- PENDING REGISTRATIONS -->
            <div
              class="xl:col-span-7 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
            >
              <div
                class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-5 border-b border-gray-100"
              >
                <div>
                  <div class="flex items-center gap-2">
                    <h2 class="font-bold text-gray-900 text-lg">
                      Pending Registrations
                    </h2>
                    @if (dashboard.pendingApprovals > 0) {
                      <span
                        class="px-2 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold"
                      >
                        {{ dashboard.pendingApprovals }} pending
                      </span>
                    }
                  </div>
                  <p class="text-sm text-gray-400 mt-1">
                    New accounts waiting for administrator approval
                  </p>
                </div>

                <p-button
                  label="View All"
                  icon="pi pi-arrow-right"
                  iconPos="right"
                  [text]="true"
                  routerLink="/user-management"
                  styleClass="text-[#2148BC]!"
                >
                </p-button>
              </div>

              <div class="p-2 sm:p-4">
                <p-table
                  [value]="dashboard.pendingUsers ?? []"
                  size="small"
                  [tableStyle]="{ 'min-width': '100%' }"
                  responsiveLayout="scroll"
                >
                  <ng-template #header>
                    <tr>
                      <th class="bg-gray-50! text-gray-500! text-xs!">
                        EMPLOYEE
                      </th>
                      <th class="bg-gray-50! text-gray-500! text-xs!">
                        DEPARTMENT
                      </th>
                      <th class="bg-gray-50! text-gray-500! text-xs!">
                        REGISTERED
                      </th>
                      <th class="bg-gray-50! text-gray-500! text-xs!">
                        STATUS
                      </th>
                    </tr>
                  </ng-template>

                  <ng-template #body let-user>
                    <tr>
                      <td>
                        <div class="flex items-center gap-3 py-1">
                          <div
                            class="w-9 h-9 shrink-0 rounded-xl bg-blue-50 text-[#2148BC] flex items-center justify-center font-bold text-sm"
                          >
                            {{ (user.fullName || 'U').charAt(0).toUpperCase() }}
                          </div>
                          <div class="min-w-0">
                            <div class="font-semibold text-gray-800 text-sm">
                              {{ user.fullName }}
                            </div>
                            <div class="text-xs text-gray-400">
                              {{ user.jobTitle || 'Not specified' }}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td class="text-sm text-gray-600">
                        {{ user.department || '—' }}
                      </td>

                      <td class="text-sm text-gray-500 whitespace-nowrap">
                        {{ user.createdAt | date: 'dd MMM yyyy' }}
                      </td>

                      <td>
                        <span
                          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold"
                        >
                          <span
                            class="w-1.5 h-1.5 rounded-full bg-amber-500"
                          ></span>
                          Pending
                        </span>
                      </td>
                    </tr>
                  </ng-template>

                  <ng-template #emptymessage>
                    <tr>
                      <td colspan="4">
                        <div
                          class="flex flex-col items-center justify-center py-10"
                        >
                          <div
                            class="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center mb-3"
                          >
                            <i
                              class="pi pi-check-circle text-green-600 text-xl"
                            ></i>
                          </div>
                          <div class="font-semibold text-gray-700">
                            All caught up!
                          </div>
                          <div class="text-sm text-gray-400 mt-1">
                            There are no pending registrations.
                          </div>
                        </div>
                      </td>
                    </tr>
                  </ng-template>
                </p-table>
              </div>
            </div>

            <!-- RECENT ACTIVITIES -->
            <div
              class="xl:col-span-5 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
            >
              <div
                class="px-5 py-5 border-b border-gray-100 flex items-center justify-between gap-3"
              >
                <div class="flex items-center gap-2">
                  <div
                    class="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center"
                  >
                    <i class="pi pi-history text-[#2148BC]"></i>
                  </div>

                  <div>
                    <h2 class="font-bold text-gray-900 text-lg">
                      Recent Activities
                    </h2>
                    <p class="text-sm text-gray-400">
                      Latest updates across the workspace
                    </p>
                  </div>
                </div>

                @if ((dashboard.activities ?? []).length > 5) {
                  <a
                    routerLink="/activity-log"
                    class="text-sm font-semibold text-[#2148BC] hover:underline whitespace-nowrap"
                  >
                    View All
                    <i class="pi pi-arrow-up-right text-xs ml-1"></i>
                  </a>
                }
              </div>

              <div class="px-5">
                @for (activity of displayedActivities; track $index) {
                  <div
                    class="flex gap-3 py-4 border-b border-gray-100 last:border-0"
                  >
                    <div
                      class="w-9 h-9 shrink-0 rounded-xl bg-blue-50 flex items-center justify-center"
                    >
                      <i class="pi pi-bolt text-[#2148BC] text-sm"></i>
                    </div>

                    <div class="flex-1 min-w-0">
                      <div class="font-semibold text-gray-800 text-sm">
                        {{ activity.title }}
                      </div>

                      <p class="text-sm text-gray-500 mt-1 leading-relaxed">
                        {{ activity.description }}
                      </p>

                      <div
                        class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-gray-400"
                      >
                        <span class="flex items-center gap-1">
                          <i class="pi pi-user text-[10px]!"></i>
                          {{ activity.user }}
                        </span>
                        <span class="flex items-center gap-1">
                          <i class="pi pi-clock text-[10px]!"></i>
                          {{ activity.date | date: 'dd MMM yyyy, hh:mm a' }}
                        </span>
                      </div>
                    </div>
                  </div>
                } @empty {
                  <div class="flex flex-col items-center justify-center py-12">
                    <div
                      class="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-3"
                    >
                      <i class="pi pi-history text-gray-400 text-xl"></i>
                    </div>
                    <div class="font-semibold text-gray-700">
                      No recent activities
                    </div>
                    <div class="text-sm text-gray-400 mt-1">
                      System activities will appear here.
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        } @else {
          <!-- LOADING STATE -->
          <div class="min-h-[60vh] flex flex-col items-center justify-center">
            <div
              class="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4"
            >
              <i class="pi pi-chart-bar text-[#2148BC] text-2xl"></i>
            </div>
            <div class="font-semibold text-gray-800">
              Loading your dashboard
            </div>
            <div class="text-sm text-gray-400 mt-1">
              Please wait while we retrieve the latest information.
            </div>
          </div>
        }
      </div>
    } @else {
      <div class="bg-[#F8FAFC] p-4 sm:p-6 lg:p-8">
        <!-- Header -->
        <div
          class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div class="flex flex-col gap-1">
            <div class="flex flex-row items-center gap-2">
              <i class="pi pi-calendar text-[12px]! text-gray-500!"></i>
              <span class="text-gray-500 text-sm">
                {{ today | date: 'EEEE, dd MMMM yyyy' }}
              </span>
            </div>

            <div class="font-bold text-2xl sm:text-3xl">
              Welcome back, {{ currentUser?.displayName }}
            </div>
          </div>

          <div
            class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
          >
            <p-button
              (onClick)="showDialogReceipt()"
              label="New Claim"
              severity="secondary"
              icon="pi pi-money-bill"
              styleClass="bg-white! border-gray-300! px-5!"
            ></p-button>

            <p-button
              [routerLink]="'/leave/apply'"
              label="Apply Leave"
              severity="info"
              icon="pi pi-plus"
              styleClass="bg-blue-800! border-none! px-5!"
            ></p-button>
          </div>
        </div>

        <!-- Announcements -->
        <div
          class="mt-5 rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden"
        >
          <!-- Header -->
          <div
            class="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl bg-blue-50"
              >
                <i class="pi pi-megaphone text-blue-700 text-lg"></i>
              </div>

              <div>
                <h3 class="text-sm font-bold text-gray-800">Announcements</h3>
                <p class="text-xs text-gray-400 mt-0.5">
                  Latest company updates
                </p>
              </div>

              @if (announcements.length > 0) {
                <span
                  class="hidden sm:inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold"
                >
                  {{ announcements.length }}
                </span>
              }
            </div>

            <a
              routerLink="/announcements"
              class="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 transition-colors whitespace-nowrap"
            >
              View all
              <i class="pi pi-arrow-up-right text-[10px]"></i>
            </a>
          </div>

          <!-- Announcement List -->
          <div class="p-4">
            @for (
              announcement of displayedAnnouncements;
              track announcement.id
            ) {
              <div
                class="group relative p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-200 mb-3 last:mb-0"
              >
                <div class="flex items-start gap-3">
                  <!-- Indicator -->
                  <div
                    class="w-1 self-stretch min-h-10 rounded-full bg-blue-200 group-hover:bg-blue-500 transition-colors"
                  ></div>

                  <div class="flex-1 min-w-0">
                    <!-- Title and Badge -->
                    <div class="flex flex-wrap items-center gap-2">
                      <h4 class="text-sm font-semibold text-gray-800 leading-5">
                        {{ announcement.title }}
                      </h4>

                      @if (announcement.isPinned) {
                        <span
                          class="inline-flex items-center gap-1 text-[10px] font-semibold text-orange-700 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full"
                        >
                          <i class="pi pi-thumbtack text-[9px]"></i>
                          Pinned
                        </span>
                      }
                    </div>

                    <!-- Content -->
                    @if (announcement.content) {
                      <p
                        class="text-sm text-gray-500 mt-2 leading-relaxed line-clamp-2"
                      >
                        {{ announcement.content }}
                      </p>
                    }

                    <!-- Dates -->
                    <div
                      class="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3"
                    >
                      <span
                        class="inline-flex items-center gap-1.5 text-xs text-gray-400"
                      >
                        <i class="pi pi-calendar text-[11px]"></i>
                        {{ announcement.publishDate | date: 'dd MMM yyyy' }}
                      </span>

                      @if (announcement.expiryDate) {
                        <span
                          class="inline-flex items-center gap-1.5 text-xs text-gray-400"
                        >
                          <i class="pi pi-clock text-[11px]"></i>
                          Expires
                          {{ announcement.expiryDate | date: 'dd MMM yyyy' }}
                        </span>
                      }
                    </div>
                  </div>
                </div>
              </div>
            } @empty {
              <!-- Empty State -->
              <div
                class="flex flex-col items-center justify-center py-10 text-center"
              >
                <div
                  class="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3"
                >
                  <i class="pi pi-megaphone text-gray-300 text-xl"></i>
                </div>

                <p class="text-sm font-medium text-gray-600">
                  No announcements yet
                </p>
                <p class="text-xs text-gray-400 mt-1">
                  Company updates will appear here.
                </p>
              </div>
            }
          </div>

          <!-- Footer -->
          @if (announcements.length > 3) {
            <div class="px-5 py-3 bg-gray-50/70 border-t border-gray-100">
              <a
                routerLink="/announcements"
                class="flex items-center justify-center gap-2 text-xs font-semibold text-gray-500 hover:text-blue-700 transition-colors"
              >
                See all {{ announcements.length }} announcements
                <i class="pi pi-arrow-right text-[10px]"></i>
              </a>
            </div>
          }
        </div>

        <!-- HOD: Pending Hardware / Site Material / IT Support Approvals -->
        @if (pendingHardwareRequests.length > 0 || hardwareRequestLoading) {
          <div
            class="mt-6 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
          >
            <!-- Header -->
            <div
              class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100"
            >
              <div class="flex items-center gap-3">
                <div
                  class="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center"
                >
                  <i class="pi pi-inbox text-amber-600 text-lg"></i>
                </div>

                <div>
                  <div class="flex items-center gap-2">
                    <h2 class="font-bold text-gray-900 text-lg">
                      Pending Approvals
                    </h2>

                    @if (pendingHardwareRequests.length > 0) {
                      <span
                        class="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold"
                      >
                        {{ pendingHardwareRequests.length }} pending
                      </span>
                    }
                  </div>

                  <p class="text-sm text-gray-400 mt-1">
                    Hardware, site material and IT support requests awaiting
                    your review
                  </p>
                </div>
              </div>

              <a
                routerLink="/hardware-request"
                class="text-sm font-semibold text-blue-700 hover:underline whitespace-nowrap"
              >
                View All Requests
                <i class="pi pi-arrow-up-right text-xs ml-1"></i>
              </a>
            </div>

            <!-- Loading -->
            @if (hardwareRequestLoading) {
              <div class="flex items-center justify-center gap-3 py-8">
                <i class="pi pi-spin pi-spinner text-blue-700"></i>
                <span class="text-sm text-gray-500">
                  Loading pending approvals...
                </span>
              </div>
            }

            <!-- Request List -->
            @if (!hardwareRequestLoading) {
              <div class="divide-y divide-gray-100">
                @for (request of pendingHardwareRequests; track request.id) {
                  <a
                    [routerLink]="['/hardware-request', request.id]"
                    class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-blue-50/40 transition-colors"
                  >
                    <div class="flex items-start gap-3 min-w-0">
                      <div
                        class="w-10 h-10 shrink-0 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center"
                      >
                        @if (request.requestType === 'ITSupport') {
                          <i class="pi pi-desktop"></i>
                        } @else if (request.requestType === 'SiteMaterial') {
                          <i class="pi pi-box"></i>
                        } @else {
                          <i class="pi pi-wrench"></i>
                        }
                      </div>

                      <div class="min-w-0">
                        <div
                          class="font-semibold text-gray-800 text-sm truncate"
                        >
                          {{ request.subject }}
                        </div>

                        <div
                          class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500"
                        >
                          <span>
                            {{
                              request.requestType === 'SiteMaterial'
                                ? 'Site Material'
                                : request.requestType === 'ITSupport'
                                  ? 'IT Support'
                                  : 'Hardware'
                            }}
                          </span>

                          <span>
                            <i class="pi pi-user text-[10px] mr-1"></i>
                            {{ request.requestedBy || 'Unknown requester' }}
                          </span>

                          @if (request.siteName) {
                            <span>
                              <i class="pi pi-map-marker text-[10px] mr-1"></i>
                              {{ request.siteName }}
                            </span>
                          }
                        </div>

                        <div class="text-xs text-gray-400 mt-2">
                          {{ request.items?.length || 0 }} item(s)
                          @if (request.neededBy) {
                            <span class="mx-1">•</span>
                            Needed by
                            {{ request.neededBy | date: 'dd MMM yyyy' }}
                          }
                        </div>
                      </div>
                    </div>

                    <div
                      class="flex items-center justify-between sm:justify-end gap-3 shrink-0"
                    >
                      <span
                        class="px-2.5 py-1 rounded-full text-xs font-semibold"
                        [ngClass]="{
                          'bg-red-50 text-red-700':
                            request.priority === 'Urgent',
                          'bg-orange-50 text-orange-700':
                            request.priority === 'High',
                          'bg-blue-50 text-blue-700':
                            request.priority === 'Normal',
                          'bg-gray-100 text-gray-600':
                            request.priority === 'Low',
                        }"
                      >
                        {{ request.priority }}
                      </span>

                      <span
                        class="inline-flex items-center gap-1 text-sm font-semibold text-blue-700"
                      >
                        Review
                        <i class="pi pi-arrow-right text-xs"></i>
                      </span>
                    </div>
                  </a>
                } @empty {
                  <div class="flex flex-col items-center justify-center py-10">
                    <div
                      class="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center mb-3"
                    >
                      <i class="pi pi-check-circle text-green-600 text-xl"></i>
                    </div>

                    <div class="font-semibold text-gray-700">
                      All caught up!
                    </div>

                    <div class="text-sm text-gray-400 mt-1">
                      There are no requests waiting for your approval.
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- Dashboard Grid -->
        <div
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-5 lg:gap-6 mt-6"
        >
          <!-- Annual Leave -->
          <div
            class="min-h-40 lg:col-span-3 flex flex-col gap-3 justify-center p-5 rounded-xl border border-gray-200 bg-white shadow-sm"
          >
            <div class="flex flex-row items-center justify-between">
              <div class="font-semibold text-gray-500">Annual Leave</div>

              <div
                class="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-xl"
              >
                <i class="pi pi-sun"></i>
              </div>
            </div>

            <div class="flex flex-row items-end gap-2">
              <b class="text-5xl text-gray-600">0</b>
              <span class="text-gray-400 mb-1">/ 8 days left</span>
            </div>

            <p-progressbar
              [style]="{ height: '6px' }"
              [value]="50"
              [showValue]="false"
            ></p-progressbar>
          </div>

          <!-- Meetings Today -->
          <div
            class="min-h-40 lg:col-span-3 flex flex-col gap-3 justify-center p-5 rounded-xl border border-gray-200 bg-white shadow-sm"
          >
            <div class="flex flex-row items-center justify-between">
              <div class="font-semibold text-gray-500">Meetings Today</div>

              <div
                class="w-10 h-10 flex items-center justify-center bg-blue-50 rounded-xl"
              >
                <i class="pi pi-video text-blue-800!"></i>
              </div>
            </div>

            <div class="flex flex-row items-end gap-2">
              <b class="text-5xl text-gray-700">0</b>
              <span class="text-gray-400 mb-1">sessions</span>
            </div>

            <div class="flex flex-row items-center gap-2">
              <i class="pi pi-circle-fill text-gray-400! text-[7px]!"></i>
              <span class="text-gray-500">No meetings</span>
            </div>
          </div>

          <!-- Pending Claims -->
          <div
            class="min-h-40 lg:col-span-3 flex flex-col gap-3 justify-center p-5 rounded-xl border border-gray-200 bg-white shadow-sm"
          >
            <div class="flex flex-row items-center justify-between">
              <div class="font-semibold text-gray-500">Pending Claims</div>

              <div
                class="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-xl"
              >
                <i class="pi pi-money-bill text-gray-800!"></i>
              </div>
            </div>

            <b class="text-4xl text-gray-700">RM 0.00</b>

            <div
              class="flex flex-row items-center justify-between gap-2 text-sm"
            >
              <span class="text-gray-500">No claims under review</span>

              <a
                routerLink="/claims"
                class="hover:underline text-blue-700 cursor-pointer whitespace-nowrap"
              >
                Details
              </a>
            </div>
          </div>

          <!-- Team In Office -->
          <div
            class="min-h-40 lg:col-span-3 flex flex-col gap-3 justify-center p-5 rounded-xl border border-gray-200 bg-white shadow-sm"
          >
            <div class="flex flex-row items-center justify-between">
              <div class="font-semibold text-gray-500">Team In Office</div>

              <div
                class="w-10 h-10 flex items-center justify-center bg-green-50 rounded-xl"
              >
                <i class="pi pi-users text-green-800!"></i>
              </div>
            </div>

            <div class="flex flex-row items-end gap-2">
              <b class="text-5xl text-gray-600">0</b>
              <span class="text-gray-400 mb-1">/ 0 members</span>
            </div>

            <div class="flex flex-row items-center gap-2 text-gray-500 text-sm">
              <span>0 on leave</span>
              <i class="pi pi-circle-fill text-gray-500! text-[4px]!"></i>
              <span>0 remote today</span>
            </div>
          </div>

          <!-- Today's Schedule -->
          <div class="lg:col-span-7">
            <div
              class="border border-gray-200 rounded-lg shadow-sm p-5 flex flex-col bg-white h-full"
            >
              <div
                class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-2"
              >
                <div class="flex flex-col">
                  <b class="text-xl">Today's Schedule</b>
                  <span class="text-gray-400 text-sm">
                    Synced in real time with Google Calendar
                  </span>
                </div>

                <div class="flex flex-row items-center gap-2">
                  <p-button
                    [routerLink]="'/meeting'"
                    label="Full Calendar"
                    severity="secondary"
                    size="small"
                    styleClass="bg-white! border-gray-200!"
                  ></p-button>
                </div>
              </div>

              <div
                class="flex flex-col items-center justify-center py-8 text-center"
              >
                <i class="pi pi-calendar text-3xl text-gray-300 mb-3"></i>
                <b class="text-gray-600">No meetings scheduled</b>
                <span class="text-sm text-gray-400 mt-1">
                  Your schedule for today is clear.
                </span>
              </div>
            </div>
          </div>

          <!-- Team Absence -->
          <div class="lg:col-span-5">
            <div
              class="h-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
            >
              <!-- Header -->
              <div class="px-5 py-4 border-b border-slate-100">
                <div class="flex items-center justify-between gap-3">
                  <div class="flex items-center gap-3 min-w-0">
                    <div
                      class="w-10 h-10 shrink-0 rounded-xl bg-orange-50 flex items-center justify-center"
                    >
                      <i
                        class="pi pi-calendar-times text-orange-600 text-lg"
                      ></i>
                    </div>

                    <div class="min-w-0">
                      <h3
                        class="text-sm font-bold tracking-wide text-slate-800"
                      >
                        Team Absence
                      </h3>
                      <p class="text-xs text-slate-400 mt-0.5">
                        Approved leave · Today
                      </p>
                    </div>
                  </div>

                  <div class="flex items-center gap-2 shrink-0">
                    <!-- Count -->
                    <div
                      class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                      [ngClass]="
                        teamAbsenceCount > 0
                          ? 'bg-orange-50 text-orange-700'
                          : 'bg-emerald-50 text-emerald-700'
                      "
                    >
                      <span
                        class="w-1.5 h-1.5 rounded-full"
                        [ngClass]="
                          teamAbsenceCount > 0
                            ? 'bg-orange-500'
                            : 'bg-emerald-500'
                        "
                      ></span>
                      {{ teamAbsenceCount }} away
                    </div>
                  </div>
                </div>

                <!-- View Calendar -->
                <!-- <div class="mt-3 flex justify-end">
                  <a
                    routerLink="/leave/calendar"
                    class="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    View full leave calendar
                    <i class="pi pi-arrow-up-right text-[10px]!"></i>
                  </a>
                </div> -->
              </div>

              <!-- Absence List -->
              <div class="p-4">
                @if (teamAbsences.length > 0) {
                  <div class="space-y-2">
                    @for (
                      person of displayedTeamAbsences;
                      track person.employeeId + person.startDate
                    ) {
                      <div
                        class="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors"
                      >
                        <!-- Avatar -->
                        <div
                          class="w-11 h-11 shrink-0 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold"
                        >
                          {{
                            (person.employeeName || 'U').charAt(0).toUpperCase()
                          }}
                        </div>

                        <!-- Employee Details -->
                        <div class="flex-1 min-w-0">
                          <div
                            class="text-sm font-semibold text-slate-800 truncate"
                          >
                            {{ person.employeeName }}
                          </div>

                          <div
                            class="flex flex-wrap items-center gap-1.5 mt-1.5"
                          >
                            <span
                              class="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-semibold"
                            >
                              <i class="pi pi-building text-[9px]! mr-1"></i>
                              {{ person.department || 'No department' }}
                            </span>

                            <span
                              class="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-200/70 text-slate-600 text-[10px] font-medium"
                            >
                              {{ person.leaveTypeName || 'Leave' }}
                            </span>
                          </div>

                          <div
                            class="flex items-center gap-1.5 text-xs text-slate-400 mt-2"
                          >
                            <i class="pi pi-calendar text-[10px]!"></i>
                            <span>
                              {{ person.startDate | date: 'dd MMM' }}
                              –
                              {{ person.endDate | date: 'dd MMM yyyy' }}
                            </span>
                          </div>
                        </div>

                        <!-- Status -->
                        <div class="shrink-0">
                          <span
                            class="px-2.5 py-1 rounded-lg bg-orange-100 text-orange-700 text-[10px] font-bold uppercase tracking-wide"
                          >
                            Away
                          </span>
                        </div>
                      </div>
                    }
                  </div>

                  <!-- View All / Show Less -->
                  @if (teamAbsences.length > 5) {
                    <button
                      type="button"
                      (click)="toggleTeamAbsences()"
                      class="w-full mt-3 py-2.5 flex items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors"
                    >
                      {{
                        showAllTeamAbsences ? 'Show less' : 'View all employees'
                      }}

                      <i
                        class="pi"
                        [ngClass]="
                          showAllTeamAbsences
                            ? 'pi-chevron-up'
                            : 'pi-chevron-down'
                        "
                      ></i>

                      @if (!showAllTeamAbsences) {
                        <span class="text-xs text-slate-400">
                          (+{{ teamAbsences.length - 5 }})
                        </span>
                      }
                    </button>
                  }
                } @else {
                  <!-- Empty State -->
                  <div
                    class="flex flex-col items-center justify-center py-10 text-center"
                  >
                    <div
                      class="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3"
                    >
                      <i
                        class="pi pi-check-circle text-emerald-600 text-2xl"
                      ></i>
                    </div>

                    <p class="text-sm font-semibold text-slate-700">
                      Everyone is in!
                    </p>

                    <p class="text-xs text-slate-400 mt-1">
                      No approved leave recorded for today.
                    </p>
                  </div>
                }
              </div>

              <!-- Footer -->
              @if (teamAbsences.length > 0) {
                <div
                  class="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between"
                >
                  <span class="text-xs text-slate-400">
                    Total employees away today
                  </span>
                  <span class="text-xs font-bold text-slate-700">
                    {{ teamAbsenceCount }}
                  </span>
                </div>
              }
            </div>
          </div>
          <!-- Recent Claims -->
          <div class="lg:col-span-7">
            <div
              class="border border-gray-200 rounded-lg shadow-sm p-5 flex flex-col bg-white h-full"
            >
              <div
                class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-2"
              >
                <div class="flex flex-col">
                  <b class="text-xl">Recent Claims & Expenses</b>
                  <span class="text-gray-400 text-sm">
                    Monthly reimbursement pool balance:
                  </span>
                </div>

                <div class="flex flex-row items-center gap-2">
                  <p-button
                    [routerLink]="'/claims'"
                    label="View Ledger"
                    severity="info"
                    size="small"
                    styleClass="bg-blue-50! text-blue-800! border-none!"
                  ></p-button>
                </div>
              </div>

              <div class="mt-2 overflow-x-auto">
                <p-table size="small">
                  <ng-template #header>
                    <tr>
                      <th class="text-sm!">EXPENSE</th>
                      <th class="text-sm!">CATEGORY</th>
                      <th class="text-sm!">DATE</th>
                      <th class="text-sm!">AMOUNT</th>
                      <th class="text-sm!">STATUS</th>
                    </tr>
                  </ng-template>

                  <ng-template #emptymessage>
                    <tr>
                      <td
                        colspan="5"
                        class="text-sm! text-center! text-gray-500! py-6!"
                      >
                        No recent claims
                      </td>
                    </tr>
                  </ng-template>
                </p-table>
              </div>
            </div>
          </div>

          <!-- Workspace Shortcuts -->
          <div class="lg:col-span-5">
            <div
              class="border border-gray-200 rounded-lg shadow-sm p-5 flex flex-col bg-white h-full"
            >
              <div
                class="flex flex-row items-center gap-2 border-b border-gray-100 pb-2"
              >
                <b>WORKSPACE SHORTCUTS</b>
              </div>

              <div class="flex flex-col gap-3 mt-4">
                <!-- Hardware Request -->
                <div
                  routerLink="/hardware-request"
                  class="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition"
                >
                  <div
                    class="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center"
                  >
                    <i class="pi pi-desktop"></i>
                  </div>
                  <div class="flex flex-col">
                    <b>Hardware / IT Support</b>
                    <span class="text-sm text-gray-400">
                      Request equipment or technical assistance
                    </span>
                  </div>
                </div>

                <!-- Company Calendar -->
                <div
                  routerLink="/calendar"
                  class="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition"
                >
                  <div
                    class="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center"
                  >
                    <i class="pi pi-calendar"></i>
                  </div>
                  <div class="flex flex-col">
                    <b>Company Calendar</b>
                    <span class="text-sm text-gray-400">
                      View meetings and upcoming events
                    </span>
                  </div>
                </div>

                <!-- Company Documents -->
                <div
                  routerLink="/documents"
                  class="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition"
                >
                  <div
                    class="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center"
                  >
                    <i class="pi pi-folder"></i>
                  </div>
                  <div class="flex flex-col">
                    <b>Company Documents</b>
                    <span class="text-sm text-gray-400">
                      Access forms, SOPs and policies
                    </span>
                  </div>
                </div>

                <!-- Employee Directory -->
                <div
                  routerLink="/employees"
                  class="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition"
                >
                  <div
                    class="w-10 h-10 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center"
                  >
                    <i class="pi pi-users"></i>
                  </div>
                  <div class="flex flex-col">
                    <b>Employee Directory</b>
                    <span class="text-sm text-gray-400">
                      Find colleagues and contact details
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    }

    <p-dialog
      [visible]="showReceipt"
      [modal]="true"
      styleClass="w-[60%]! max-h-[90vh]!"
      [closable]="false"
      [contentStyle]="{
        padding: '0',
        overflow: 'hidden',
      }"
    >
      <ng-template #headless>
        <div
          class="rounded-xl flex flex-col max-h-[90vh] overflow-hidden bg-white"
        >
          <div
            class="shrink-0 z-10 bg-white flex flex-row items-center justify-between border-b border-gray-100 px-5 py-4"
          >
            <div class="flex flex-row items-center gap-3">
              <div
                class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-800"
              >
                <i class="pi pi-receipt"></i>
              </div>

              <div class="flex flex-col">
                <b class="text-lg">Upload Receipt Claim</b>

                <span class="text-sm text-gray-400">
                  Upload receipt image or PDF for automated AI extraction
                </span>
              </div>
            </div>

            <i
              class="pi pi-times text-lg! text-gray-400! cursor-pointer! hover:text-gray-500!"
              (click)="showReceipt = false"
            ></i>
          </div>

          <div class="flex-1 min-h-0 overflow-y-auto p-5">
            <div
              class="flex flex-col gap-3 items-center justify-center bg-blue-50 border-2 border-dashed border-blue-300 h-45 w-full rounded-lg"
            >
              <div
                class="w-15 h-15 rounded-full flex items-center justify-center bg-blue-100 text-blue-600"
              >
                <i class="pi pi-cloud-upload text-2xl!"></i>
              </div>

              <b>
                Drag & drop your receipt here, or
                <i class="text-blue-700">Browse Files</i>
              </b>

              <span class="text-gray-400 text-sm">
                Supports PNG, JPG, PDF (up to 15MB)
              </span>
            </div>

            <div class="mt-6 grid grid-cols-12 gap-4" [formGroup]="claimForm">
              <div class="col-span-12 flex flex-col gap-1">
                <div>Claim Type</div>

                <p-select
                  appendTo="body"
                  [options]="claimTypeOptions"
                  formControlName="claimType"
                ></p-select>
              </div>

              <div class="col-span-12 flex flex-col gap-1">
                <div>Remarks</div>

                <textarea
                  pTextarea
                  formControlName="remarks"
                  rows="3"
                  [autoResize]="true"
                  class="w-full"
                ></textarea>
              </div>

              <div class="col-span-12 w-full border-b border-gray-200"></div>

              <div class="col-span-12 flex flex-col">
                <div class="flex flex-row items-center justify-between">
                  <b>Line Items</b>

                  <p-button
                    label="Add line"
                    icon="pi pi-plus"
                    severity="info"
                    size="small"
                    styleClass="px-3! py-2! bg-blue-800! text-white! border-none!"
                  ></p-button>
                </div>

                <div class="mt-3 flex flex-col gap-3" formArrayName="lineItems">
                  @for (
                    ctrl of lineItems.controls;
                    track $index;
                    let i = $index
                  ) {
                    <div
                      class="p-5 border border-gray-200 rounded-lg grid grid-cols-12 gap-4"
                      [formGroupName]="i"
                    >
                      <div
                        class="pb-2 border-b border-gray-100 col-span-12 flex flex-row items-center justify-between"
                      >
                        <div class="font-semibold">Line {{ i + 1 }}</div>

                        <i
                          class="pi pi-trash text-red-500! cursor-pointer! hover:text-red-400!"
                        ></i>
                      </div>

                      @if (
                        claimForm.value.claimType === 'MonthlyReimbursement'
                      ) {
                        <div class="col-span-12 flex flex-col gap-1">
                          <div>Category</div>

                          <p-select
                            formControlName="category"
                            appendTo="body"
                            [options]="[
                              {
                                label: 'Medical',
                                value: 'Medical',
                              },
                              {
                                label: 'Safety shoes',
                                value: 'SafetyShoes',
                              },
                              {
                                label: 'General purchase',
                                value: 'GeneralPurchase',
                              },
                            ]"
                          ></p-select>
                        </div>

                        <div
                          class="col-span-12 lg:col-span-6 flex flex-col gap-1"
                        >
                          <div>Purchase Date</div>

                          <p-datepicker
                            appendTo="body"
                            formControlName="purchaseDate"
                            dateFormat="dd/mm/yy"
                            [showIcon]="true"
                            styleClass="w-full"
                          ></p-datepicker>
                        </div>

                        <div
                          class="col-span-12 lg:col-span-6 flex flex-col gap-1"
                        >
                          <div>Amount (RM)</div>

                          <p-inputnumber
                            formControlName="amount"
                            mode="decimal"
                            [minFractionDigits]="2"
                            styleClass="w-full"
                          ></p-inputnumber>
                        </div>

                        @if (
                          claimForm.get('category')?.value === 'Medical' &&
                          medicalBalance
                        ) {
                          <div
                            class="bg-blue-100 border border-blue-700 rounded-sm text-blue-800 col-span-12 flex flex-row items-center gap-1"
                          >
                            <div>
                              Medical balance: {{ medicalBalance.year }}:
                            </div>
                          </div>
                        }
                      }

                      <div class="col-span-12 flex flex-col gap-1">
                        <div>Description</div>

                        <textarea
                          pTextarea
                          [rows]="3"
                          [autoResize]="true"
                          formControlName="description"
                          class="w-full"
                        ></textarea>
                      </div>

                      <div
                        class="col-span-12 flex flex-col gap-3 items-center justify-center bg-blue-50 border-2 border-dashed border-blue-300 h-45 w-full rounded-lg"
                      >
                        <div
                          class="w-15 h-15 rounded-full flex items-center justify-center bg-blue-100 text-blue-600"
                        >
                          <i class="pi pi-cloud-upload text-2xl!"></i>
                        </div>

                        <b>
                          Drag & drop your receipt here, or
                          <i class="text-blue-700"> Browse Files </i>
                        </b>

                        <span class="text-gray-400 text-sm">
                          Supports PNG, JPG, PDF (up to 15MB)
                        </span>
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
          <div
            class="shrink-0 z-10 bg-white flex flex-row items-center justify-between border-t border-gray-200 px-5 py-4"
          >
            <div class="flex flex-row items-center justify-between">
              <p-button
                label="Save as Draft"
                severity="secondary"
                styleClass="bg-white! border-gray-200!"
              ></p-button>
            </div>
            <div class="flex flex-row items-center gap-2">
              <p-button
                (onClick)="showReceipt = false"
                label="Cancel"
                [text]="true"
                severity="secondary"
              ></p-button>
              <p-button
                label="Submit Claim"
                severity="info"
                icon="pi pi-send"
                styleClass="bg-blue-800! border-none! text-white!"
              ></p-button>
            </div>
          </div>
        </div>
      </ng-template>
    </p-dialog>
  `,
  styleUrl: './dashboard.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit, OnDestroy {
  private readonly userService = inject(UserService);
  private readonly appService = inject(AppService);
  private readonly leaveRequestService = inject(LeaveRequestService);
  private readonly loadingService = inject(LoadingService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  superAdminDashboard = signal<SuperAdminDashboardDto | null>(null);
  staffDashboard: any = null;
  pendingHardwareRequests: HardwareRequestDto[] = [];
  hardwareRequestLoading: boolean = false;
  dashboardLoading: boolean = false;
  showReceipt: boolean = false;
  showAllTeamAbsences: boolean = false;

  announcements: Notice[] = [];

  currentUser = this.userService.currentUser;
  name: string = this.currentUser?.displayName || 'User';
  systemRole: string = this.currentUser?.systemRole || 'Executive';
  today: Date = new Date();

  isSuperAdmin = this.systemRole.toLowerCase() === 'superadmin';
  isHr = this.systemRole.toLowerCase() === 'hr';
  isLogistics = this.systemRole.toLowerCase() === 'logistics';

  hrDashboard = signal<HrDashboardDto | null>(null);
  lastRefreshed = signal<Date | null>(null);
  weekDays = signal<WeekDayCell[]>([]);
  weekRangeLabel: string = '';

  claimForm!: FormGroup;
  medicalBalance: MedicalBalanceDto | null = null;
  teamAbsences: TeamAbsence[] = [];

  personalTasks: PersonalTask[] = [
    {
      title: 'Review pending leave applications',
      description: 'Check the approvals queue for requests awaiting action',
      priority: 'High',
      severity: 'danger',
    },
    {
      title: 'Onboard new staff',
      description: 'Prepare welcome pack and account setup',
      priority: 'Medium',
      severity: 'warn',
    },
    {
      title: 'Update leave policies',
      description: 'Quarterly policy review checklist',
      priority: 'Low',
      severity: 'info',
    },
  ];

  claimTypeOptions = [
    {
      label: CLAIM_TYPE_LABELS['MonthlyReimbursement'],
      value: 'MonthlyReimbursement',
    },
    { label: CLAIM_TYPE_LABELS['Overtime'], value: 'Overtime' },
    { label: CLAIM_TYPE_LABELS['OutstationTravel'], value: 'OutstationTravel' },
  ];

  departmentChartData: {
    labels: string[];
    datasets: {
      data: number[];
      backgroundColor: string[];
      borderWidth: number;
    }[];
  } = {
    labels: [],
    datasets: [{ data: [], backgroundColor: [], borderWidth: 0 }],
  };

  departmentChartOptions = {
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { boxWidth: 12, padding: 12 },
      },
    },
    maintainAspectRatio: false,
  };

  private readonly chartColors = [
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#06b6d4',
    '#64748b',
    '#ec4899',
    '#84cc16',
  ];

  ngOnInit(): void {
    if (this.isSuperAdmin) {
      this.loadSuperAdminDashboard();
    } else if (this.isHr) {
      this.loadHrDashboard();
    } else if (this.isLogistics) {
      this.loadLogisticDashboard();
    } else {
      this.loadStaffDashboard();
    }

    // The API must return only approvals belonging to the logged-in HOD.
    // For users who are not HODs, it should return an empty array.
    if (!this.isSuperAdmin) {
      this.loadPendingHardwareApprovals();
    }
  }

  loadSuperAdminDashboard(): void {
    this.loadingService.start();

    this.appService
      .GetSuperAdminDashboard()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loadingService.stop()),
      )
      .subscribe({
        next: (dashboard) => {
          this.superAdminDashboard.set(dashboard);
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Failed to load SuperAdmin dashboard:', err);
          this.cdr.markForCheck();
        },
      });
  }

  loadLogisticDashboard(): void {
    this.loadingService.start();

    this.appService
      .GetLogisticDashboard()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loadingService.stop()),
      )
      .subscribe({
        next: (dashboard) => {
          console.log('Logistics dashboard:', dashboard);
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Failed to load Logistics dashboard:', err);
          this.cdr.markForCheck();
        },
      });
  }

  loadStaffDashboard(): void {
    this.dashboardLoading = true;
    this.loadingService.start();

    this.appService
      .GetStaffDashboard()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.dashboardLoading = false;
          this.loadingService.stop();
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (res) => {
          // Support both wrapped API response and direct dashboard response
          const dashboard = res?.data ?? res;

          this.staffDashboard = dashboard;
          this.announcements = dashboard?.latestNotices ?? [];
          this.teamAbsences = dashboard?.teamAbsences ?? [];

          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Failed to load Staff dashboard:', err);
        },
      });
  }

  loadPendingHardwareApprovals(): void {
    this.hardwareRequestLoading = true;
    this.cdr.markForCheck();

    this.appService
      .GetPendingHardwareApprovals()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.hardwareRequestLoading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (requests) => {
          this.pendingHardwareRequests = requests ?? [];
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Failed to load pending hardware approvals:', err);

          this.pendingHardwareRequests = [];
          this.cdr.markForCheck();
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadHrDashboard(): void {
    const { from, to } = this.getWeekRange();
    this.weekRangeLabel = `${this.formatDayKey(from)} – ${this.formatDayKey(to)}`;

    this.loadingService.start();
    forkJoin({
      dashboard: this.appService.GetHrDashboard(),
      calendar: this.leaveRequestService.getCalendar(
        this.formatDayKey(from),
        this.formatDayKey(to),
      ),
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loadingService.stop()),
      )
      .subscribe({
        next: ({ dashboard, calendar }) => {
          const normalized = this.normalizeHrDashboard(
            dashboard as unknown as Record<string, unknown>,
          );
          this.hrDashboard.set(normalized);
          this.buildDepartmentChart(normalized.departmentDistribution);
          this.weekDays.set(
            this.buildWeekDays(from, to, calendar.events ?? []),
          );
          this.lastRefreshed.set(new Date());

          this.teamAbsences = normalized.todayLeaveEvents.map((ev) => ({
            employeeId: ev.employeeId,
            employeeName: ev.employeeName,
            department: '',
            leaveTypeName: ev.leaveTypeName || 'Leave',
            startDate: ev.startDate,
            endDate: ev.endDate,
          }));

          this.cdr.markForCheck();
        },
        error: () => {
          this.cdr.markForCheck();
        },
      });
  }

  private normalizeHrDashboard(raw: Record<string, unknown>): HrDashboardDto {
    const deptRaw = (raw['departmentDistribution'] ??
      raw['DepartmentDistribution'] ??
      []) as Record<string, unknown>[];
    const eventsRaw = (raw['todayLeaveEvents'] ??
      raw['TodayLeaveEvents'] ??
      []) as Record<string, unknown>[];

    return {
      totalEmployees: Number(
        raw['totalEmployees'] ?? raw['TotalEmployees'] ?? 0,
      ),
      pendingLeave: Number(raw['pendingLeave'] ?? raw['PendingLeave'] ?? 0),
      onLeaveToday: Number(raw['onLeaveToday'] ?? raw['OnLeaveToday'] ?? 0),
      assumedPresentToday: Number(
        raw['assumedPresentToday'] ?? raw['AssumedPresentToday'] ?? 0,
      ),
      resignedStaff: Number(raw['resignedStaff'] ?? raw['ResignedStaff'] ?? 0),
      newStaffUnderOneYear: Number(
        raw['newStaffUnderOneYear'] ?? raw['NewStaffUnderOneYear'] ?? 0,
      ),
      departmentDistribution: deptRaw.map((d) => ({
        departmentId: String(d['departmentId'] ?? d['DepartmentId'] ?? ''),
        department: String(d['department'] ?? d['Department'] ?? ''),
        count: Number(d['count'] ?? d['Count'] ?? 0),
      })),
      todayLeaveEvents: eventsRaw.map((e) => ({
        requestId: String(e['requestId'] ?? e['RequestId'] ?? ''),
        employeeId: String(e['employeeId'] ?? e['EmployeeId'] ?? ''),
        employeeName: String(e['employeeName'] ?? e['EmployeeName'] ?? ''),
        startDate: String(e['startDate'] ?? e['StartDate'] ?? ''),
        endDate: String(e['endDate'] ?? e['EndDate'] ?? ''),
        leaveTypeId: (e['leaveTypeId'] ?? e['LeaveTypeId']) as
          | string
          | undefined,
        leaveTypeName: (e['leaveTypeName'] ?? e['LeaveTypeName']) as
          | string
          | undefined,
        reason: (e['reason'] ?? e['Reason']) as string | undefined,
        totalDays: (e['totalDays'] ?? e['TotalDays']) as number | undefined,
        startSession: (e['startSession'] ?? e['StartSession']) as
          | string
          | undefined,
        endSession: (e['endSession'] ?? e['EndSession']) as string | undefined,
        canViewDetails: Boolean(
          e['canViewDetails'] ?? e['CanViewDetails'] ?? true,
        ),
      })),
    };
  }

  private buildDepartmentChart(
    distribution: HrDashboardDto['departmentDistribution'],
  ): void {
    this.departmentChartData = {
      labels: distribution.map((d) => d.department),
      datasets: [
        {
          data: distribution.map((d) => d.count),
          backgroundColor: distribution.map(
            (_, i) => this.chartColors[i % this.chartColors.length],
          ),
          borderWidth: 0,
        },
      ],
    };
  }

  private getWeekRange(): { from: Date; to: Date } {
    const now = new Date();
    const day = now.getDay();
    const diffToMon = day === 0 ? -6 : 1 - day;
    const from = new Date(now);
    from.setDate(now.getDate() + diffToMon);
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(from.getDate() + 6);
    to.setHours(0, 0, 0, 0);
    return { from, to };
  }

  private buildWeekDays(
    from: Date,
    to: Date,
    events: LeaveCalendarEventDto[],
  ): WeekDayCell[] {
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const todayKey = this.formatDayKey(new Date());
    const cells: WeekDayCell[] = [];

    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
      const date = new Date(d);
      date.setHours(0, 0, 0, 0);
      const key = this.formatDayKey(date);
      const dayEvents = events.filter((ev) => this.eventOverlapsDay(ev, date));
      cells.push({
        label: weekdays[cells.length] ?? '',
        date,
        key,
        isToday: key === todayKey,
        events: dayEvents,
      });
    }

    return cells;
  }

  private eventOverlapsDay(ev: LeaveCalendarEventDto, day: Date): boolean {
    const start = this.stripTime(new Date(ev.startDate));
    const end = this.stripTime(new Date(ev.endDate));
    const target = this.stripTime(day);
    return start <= target && end >= target;
  }

  private stripTime(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private formatDayKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  showDialogReceipt() {
    this.initReceiptForm();
    this.showReceipt = true;
    this.cdr.detectChanges();
  }

  initReceiptForm() {
    this.claimForm = new FormGroup({
      claimType: new FormControl<string | null>(
        'MonthlyReimbursement',
        Validators.required,
      ),
      remarks: new FormControl<string | null>(null),
      destination: new FormControl<string | null>(null),
      tripStartDate: new FormControl<Date | null>(null),
      tripEndDate: new FormControl<Date | null>(null),
      lineItems: new FormArray([this.createLine('MonthlyReimbursement')]),
    });
  }

  get lineItems(): FormArray {
    return this.claimForm.get('lineItems') as FormArray;
  }

  createLine(type: ClaimType | string): FormGroup {
    if (type === 'Overtime') {
      return this.fb.group({
        lineKind: ['OvertimeItem'],
        workDate: [null, Validators.required],
        dayType: ['Normal', Validators.required],
        hours: [null, Validators.required],
        description: [''],
        category: [null],
        purchaseDate: [null],
        amount: [0],
        vehicleType: [null],
        kilometers: [null],
        mealDays: [null],
      });
    }
    if (type === 'OutstationTravel') {
      return this.fb.group({
        lineKind: ['Mileage'],
        vehicleType: ['Car'],
        kilometers: [null],
        amount: [0],
        purchaseDate: [null],
        mealDays: [null],
        description: [''],
        category: [null],
        workDate: [null],
        dayType: [null],
        hours: [null],
      });
    }
    return this.fb.group({
      lineKind: ['MonthlyItem'],
      category: ['GeneralPurchase', Validators.required],
      purchaseDate: [null, Validators.required],
      amount: [null, Validators.required],
      description: [''],
      workDate: [null],
      dayType: [null],
      hours: [null],
      vehicleType: [null],
      kilometers: [null],
      mealDays: [null],
    });
  }

  get displayedAnnouncements(): Notice[] {
    return this.announcements.slice(0, 3);
  }

  get displayedActivities() {
    return (this.superAdminDashboard()?.activities ?? []).slice(0, 5);
  }

  get teamAbsenceCount(): number {
    return this.teamAbsences.length;
  }

  get displayedTeamAbsences(): TeamAbsence[] {
    return this.showAllTeamAbsences
      ? this.teamAbsences
      : this.teamAbsences.slice(0, 5);
  }

  toggleTeamAbsences(): void {
    this.showAllTeamAbsences = !this.showAllTeamAbsences;
  }
}
