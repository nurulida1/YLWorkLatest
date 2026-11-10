import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { forkJoin, of, Subject, takeUntil } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { LeaveBalanceDto, LeaveRequestDto } from '../../../models/Leave';
import { formatLeaveDurationLabel } from '../../../common/guard/leave-day.util';
import { LeaveBalanceService } from '../../../services/leave-balance.service';
import { LeaveRequestService } from '../../../services/leave-request.service';
import { LoadingService } from '../../../services/loading.service';
import { UserService } from '../../../services/userService.service';
import { LeaveCalendar } from '../leave-calendar/leave-calendar';

const APPROVER_ROLES = [
  'SuperAdmin',
  'Admin',
  'HR',
  'Manager',
  'HOD',
  'Management',
];

@Component({
  selector: 'app-leave-dashboard',
  imports: [
    CommonModule,
    RouterLink,
    ButtonModule,
    TableModule,
    TagModule,
    TabsModule,
    LeaveCalendar,
  ],
  template: `
    <!-- ===================================================== -->
    <!-- MOBILE VIEW -->
    <!-- ===================================================== -->

    <div class="flex flex-col lg:hidden min-h-screen bg-slate-50">
      <!-- Mobile Header -->
      <div
        class="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-800 to-blue-700 rounded-b-[2rem]"
      >
        <!-- Decorative circles -->
        <div
          class="absolute -top-24 -right-16 w-64 h-64 rounded-full border border-white/10 bg-white/5"
        ></div>
        <div
          class="absolute -top-12 -right-5 w-40 h-40 rounded-full border border-white/10"
        ></div>
        <div
          class="absolute bottom-0 -left-16 w-40 h-40 rounded-full bg-blue-400/10 blur-2xl"
        ></div>

        <div class="relative z-10 px-5 pt-6 pb-6">
          <!-- Top navigation -->
          <div class="flex items-center justify-between">
            <div
              class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15"
            >
              <i class="pi pi-circle-fill text-[6px]! text-emerald-400!"></i>
              <span class="text-xs font-bold tracking-wider text-white/90">
                YL WORKS ENTERPRISE
              </span>
            </div>

            <div class="flex items-center gap-2">
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center bg-white/15 border border-white/20"
              >
                <span class="font-bold text-white">
                  {{ getInitial(currentUser?.displayName) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Page title -->
          <div class="mt-7 flex items-end justify-between gap-3">
            <div class="min-w-0">
              <div
                class="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-2"
              >
                Employee Self-Service
              </div>

              <h1 class="text-2xl font-bold text-white tracking-tight">
                Leave Management
              </h1>

              <p class="text-sm text-blue-100/80 mt-1 leading-relaxed">
                Manage your leave balances and requests.
              </p>
            </div>

            <p-button
              label="Apply"
              icon="pi pi-plus"
              size="small"
              [rounded]="true"
              routerLink="/leave/apply"
              styleClass="bg-white! border-none! text-blue-900! font-bold! shadow-lg! px-4!"
            />
          </div>

          <!-- Available balance -->
          <div
            class="mt-6 p-3.5 rounded-xl bg-white/10 border border-white/15 backdrop-blur-sm"
          >
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-2">
                <div
                  class="w-9 h-9 rounded-lg bg-emerald-400/15 flex items-center justify-center"
                >
                  <i class="pi pi-wallet text-emerald-300!"></i>
                </div>

                <div>
                  <p
                    class="text-[10px] uppercase tracking-wider text-blue-100/70 font-semibold"
                  >
                    Available Balance
                  </p>

                  <p class="text-sm font-semibold text-white">
                    {{ heroBalanceLabel }}
                  </p>
                </div>
              </div>

              <div class="text-2xl font-bold text-white tabular-nums">
                {{ heroRemaining }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile Content -->
      <div class="px-4 py-5 flex flex-col gap-5">
        <!-- Summary -->
        <section>
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-sm font-bold text-slate-800">Overview</h2>

            <span class="text-xs text-slate-400">
              {{ currentYear }}
            </span>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <!-- Remaining -->
            <div
              class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
            >
              <div class="flex items-center justify-between">
                <div
                  class="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center"
                >
                  <i class="pi pi-wallet text-emerald-600!"></i>
                </div>

                <span
                  class="text-[10px] font-bold uppercase tracking-wider text-slate-400"
                >
                  Balance
                </span>
              </div>

              <div class="mt-3 text-2xl font-bold text-slate-900 tabular-nums">
                {{ heroRemaining }}
              </div>

              <div class="text-xs text-slate-500 mt-1">
                {{ heroBalanceLabel }}
              </div>
            </div>

            <!-- Pending -->
            <div
              class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
            >
              <div class="flex items-center justify-between">
                <div
                  class="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center"
                >
                  <i class="pi pi-clock text-amber-600!"></i>
                </div>

                <span
                  class="text-[10px] font-bold uppercase tracking-wider text-slate-400"
                >
                  Pending
                </span>
              </div>

              <div class="mt-3 text-2xl font-bold text-slate-900 tabular-nums">
                {{ pendingCount }}
              </div>

              <div class="text-xs text-slate-500 mt-1">Awaiting approval</div>
            </div>

            <!-- Approved -->
            <div
              class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
            >
              <div class="flex items-center justify-between">
                <div
                  class="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center"
                >
                  <i class="pi pi-check-circle text-blue-600!"></i>
                </div>

                <span
                  class="text-[10px] font-bold uppercase tracking-wider text-slate-400"
                >
                  Approved
                </span>
              </div>

              <div class="mt-3 text-2xl font-bold text-slate-900 tabular-nums">
                {{ approvedThisYearCount }}
              </div>

              <div class="text-xs text-slate-500 mt-1">This year</div>
            </div>

            <!-- Upcoming -->
            <div
              class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
            >
              <div class="flex items-center justify-between">
                <div
                  class="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center"
                >
                  <i class="pi pi-calendar text-indigo-600!"></i>
                </div>

                <span
                  class="text-[10px] font-bold uppercase tracking-wider text-slate-400"
                >
                  Upcoming
                </span>
              </div>

              @if (upcomingLeave) {
                <div
                  class="mt-3 text-base font-bold text-slate-900 leading-tight"
                >
                  {{ upcomingLeave.startDate | date: 'd MMM' }}
                  –
                  {{ upcomingLeave.endDate | date: 'd MMM' }}
                </div>

                <div class="text-xs text-slate-500 mt-1">
                  {{ upcomingLeave.leaveTypeName }}
                  ·
                  {{ formatLeaveDays(upcomingLeave) }}
                </div>

                @if (upcomingLeave.isShortNoticeAnnual) {
                  <div class="mt-2">
                    <p-tag value="Short notice → Unpaid" severity="warn" />
                  </div>
                }
              } @else {
                <div class="mt-3 text-2xl font-bold text-slate-300">—</div>

                <div class="text-xs text-slate-500 mt-1">
                  No approved leave ahead
                </div>
              }
            </div>
          </div>
        </section>

        <!-- Quick Actions -->
        <section>
          <h2 class="text-sm font-bold text-slate-800 mb-3">Quick Actions</h2>

          <div class="grid grid-cols-2 gap-3">
            <p-button
              label="Leave History"
              icon="pi pi-history"
              severity="secondary"
              [outlined]="true"
              routerLink="/leave/history"
              styleClass="w-full! bg-white! border-slate-200! text-slate-700!"
            />

            @if (canApprove) {
              <p-button
                [label]="'Approvals (' + pendingApprovalCount + ')'"
                icon="pi pi-check-circle"
                severity="warn"
                routerLink="/leave/approvals"
                styleClass="w-full!"
              />
            }
          </div>
        </section>

        <!-- Leave Balances -->
        <section>
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-sm font-bold text-slate-800">Leave Balances</h2>

            <span class="text-xs text-slate-400">
              {{ currentYear }}
            </span>
          </div>

          @if (paidBalances.length === 0 && !unpaidUsage) {
            <div
              class="bg-white border border-slate-200 rounded-xl p-8 text-center"
            >
              <i class="pi pi-wallet text-2xl text-slate-300"></i>

              <p class="text-sm text-slate-500 mt-3">
                No leave balances found for this year.
              </p>
            </div>
          } @else {
            <div class="flex flex-col gap-3">
              @for (b of paidBalances; track b.leaveTypeId) {
                <div
                  class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
                >
                  <div class="flex items-center justify-between gap-2">
                    <div class="font-bold text-sm text-slate-800">
                      {{ b.leaveTypeName }}
                    </div>

                    @if (isLowBalance(b)) {
                      <span
                        class="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-1 rounded-md"
                      >
                        Low balance
                      </span>
                    }
                  </div>

                  <div class="flex items-end justify-between mt-4">
                    <div>
                      <div
                        class="text-3xl font-bold text-emerald-700 tabular-nums"
                      >
                        {{ b.remainingDays }}
                      </div>

                      <div
                        class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-1"
                      >
                        Days remaining
                      </div>
                    </div>

                    <div class="text-right text-xs text-slate-500 space-y-1">
                      <div>
                        Entitled:
                        <span class="font-semibold text-slate-700">{{
                          b.entitledDays
                        }}</span>

                        @if ((b.carriedForwardDays ?? 0) > 0) {
                          <span class="text-slate-400">
                            ({{ b.tenureEntitledDays ?? 0 }} +
                            {{ b.carriedForwardDays }} carried)
                          </span>
                        }

                        @if (
                          (b.creditedDays ?? 0) > 0 &&
                          (b.carriedForwardDays ?? 0) === 0
                        ) {
                          <span class="text-slate-400">
                            ({{ b.creditedDays }} credited)
                          </span>
                        }
                      </div>

                      <div>
                        Used:
                        <span class="font-semibold text-slate-700">{{
                          b.usedDays
                        }}</span>
                      </div>

                      <div>
                        Pending:
                        <span class="font-semibold text-amber-600">{{
                          b.pendingDays
                        }}</span>
                      </div>
                    </div>
                  </div>

                  @if (b.entitledDays > 0) {
                    <div class="mt-4">
                      <div
                        class="w-full bg-slate-100 rounded-full h-2 overflow-hidden"
                      >
                        <div
                          class="h-full rounded-full bg-emerald-500 transition-all"
                          [style.width.%]="balanceUsedPercent(b)"
                        ></div>
                      </div>
                    </div>
                  }
                </div>
              }

              <!-- Unpaid Leave -->
              @if (unpaidUsage) {
                <div
                  class="bg-slate-100 border border-slate-200 rounded-xl p-4"
                >
                  <div class="flex items-center justify-between gap-2">
                    <div class="font-bold text-sm text-slate-800">
                      Unpaid Leave
                    </div>

                    <span
                      class="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-md"
                    >
                      Unlimited
                    </span>
                  </div>

                  <div class="mt-4">
                    <div class="text-3xl font-bold text-slate-800 tabular-nums">
                      {{ unpaidUsage.takenDays }}
                    </div>

                    <div
                      class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-1"
                    >
                      Days taken this year
                    </div>
                  </div>

                  <div class="mt-4 flex flex-col gap-1 text-xs text-slate-600">
                    <span>Approved: {{ unpaidUsage.approvedDays }}</span>
                    <span>Pending: {{ unpaidUsage.pendingDays }}</span>

                    @if (unpaidUsage.shortNoticeDays > 0) {
                      <span class="text-amber-700">
                        Short-notice Annual:
                        {{ unpaidUsage.shortNoticeDays }} day(s)
                      </span>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </section>

        <!-- Recent Requests -->
        <section
          class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
        >
          <div class="flex items-center justify-between mb-3">
            <div>
              <h2 class="text-sm font-bold text-slate-800">Recent Requests</h2>

              <p class="text-xs text-slate-400 mt-0.5">
                Your latest leave applications
              </p>
            </div>

            <a
              routerLink="/leave/history"
              class="text-xs font-semibold text-blue-700 hover:text-blue-900"
            >
              View all
              <i class="pi pi-arrow-right text-[10px] ml-1"></i>
            </a>
          </div>

          @if (recentRequests.length > 0) {
            <div class="flex flex-col divide-y divide-slate-100">
              @for (row of recentRequests; track row.requestId) {
                <div class="py-3 first:pt-0 last:pb-0">
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <div class="flex flex-wrap items-center gap-1.5">
                        <span class="font-semibold text-sm text-slate-800">
                          {{ row.leaveTypeName }}
                        </span>

                        @if (row.isShortNoticeAnnual) {
                          <p-tag
                            value="Short notice → Unpaid"
                            severity="warn"
                          />
                        } @else if (row.isUnpaid) {
                          <p-tag value="Unpaid" severity="secondary" />
                        }

                        @if (row.isEmergency) {
                          <p-tag value="Emergency" severity="danger" />
                        }
                      </div>

                      <div class="text-xs text-slate-500 mt-1">
                        {{ row.startDate | date: 'mediumDate' }}
                        –
                        {{ row.endDate | date: 'mediumDate' }}
                      </div>

                      <div class="text-xs text-slate-400 mt-1">
                        {{ formatLeaveDays(row) }}
                      </div>
                    </div>

                    <p-tag
                      [value]="row.status"
                      [severity]="statusSeverity(row)"
                    />
                  </div>

                  <div class="flex gap-2 mt-2">
                    @if (row.status === 'Pending') {
                      <p-button
                        label="Edit"
                        icon="pi pi-pencil"
                        size="small"
                        [text]="true"
                        [routerLink]="['/leave/apply', row.requestId]"
                      />
                    }

                    <p-button
                      label="View Details"
                      icon="pi pi-arrow-right"
                      iconPos="right"
                      size="small"
                      [text]="true"
                      [routerLink]="['/leave', row.requestId]"
                    />
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="py-8 text-center">
              <div
                class="w-12 h-12 mx-auto rounded-full bg-slate-50 flex items-center justify-center"
              >
                <i class="pi pi-inbox text-xl text-slate-300"></i>
              </div>

              <p class="text-sm font-medium text-slate-600 mt-3">
                No leave requests yet
              </p>

              <p class="text-xs text-slate-400 mt-1">
                Your applications will appear here.
              </p>
            </div>
          }
        </section>
      </div>
    </div>

    <!-- ===================================================== -->
    <!-- DESKTOP VIEW -->
    <!-- ===================================================== -->

    <div
      class="hidden lg:flex flex-col w-full min-h-screen bg-slate-50 p-5 xl:p-7 gap-5"
    >
      <!-- Header -->
      <div
        class="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <div class="flex items-center gap-2 text-slate-400 mb-2">
            <a
              routerLink="/dashboard"
              class="hover:text-blue-700 transition-colors"
            >
              Dashboard
            </a>

            <i class="pi pi-angle-right text-[10px]!"></i>

            <span class="font-semibold text-slate-600"> Leave Management </span>
          </div>

          <h1 class="mt-4 text-2xl font-bold text-slate-900 tracking-tight">
            Leave Overview
          </h1>

          <p class="text-sm text-slate-500 mt-1">
            Manage your leave balances, requests and team approvals.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          @if (canApprove && pendingApprovalCount > 0) {
            <p-button
              [label]="'Review approvals (' + pendingApprovalCount + ')'"
              icon="pi pi-check-circle"
              severity="warn"
              routerLink="/leave/approvals"
            />
          }

          <p-button
            label="Apply Leave"
            icon="pi pi-plus"
            routerLink="/leave/apply"
            styleClass="bg-blue-800! border-blue-800! hover:bg-blue-900! hover:border-blue-900! shadow-sm!"
          />
        </div>
      </div>

      <!-- Main Tabs -->
      <div
        class="bg-white border border-slate-200 rounded-xl shadow-sm p-4 xl:p-5"
      >
        <p-tabs [value]="activeTab" (valueChange)="onTabChange($event)">
          <p-tablist>
            <p-tab value="overview">
              <div class="flex items-center gap-2">
                <i class="pi pi-chart-bar"></i>
                <span>Overview</span>
              </div>
            </p-tab>

            <p-tab value="calendar">
              <div class="flex items-center gap-2">
                <i class="pi pi-calendar"></i>
                <span>Team Calendar</span>
              </div>
            </p-tab>
          </p-tablist>

          <p-tabpanels>
            <!-- ================================================= -->
            <!-- OVERVIEW TAB -->
            <!-- ================================================= -->

            <p-tabpanel value="overview">
              <div class="flex flex-col gap-6 pt-5">
                <!-- KPI CARDS -->
                <section>
                  <div class="flex items-center justify-between mb-3">
                    <h2 class="text-sm font-bold text-slate-800">
                      Leave Summary
                    </h2>

                    <span class="text-xs text-slate-400">
                      {{ currentYear }}
                    </span>
                  </div>

                  <div class="grid grid-cols-2 xl:grid-cols-4 gap-4">
                    <!-- Remaining -->
                    <div
                      class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
                    >
                      <div class="flex items-center justify-between">
                        <div
                          class="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center"
                        >
                          <i class="pi pi-wallet text-emerald-600! text-lg"></i>
                        </div>

                        <span
                          class="text-[10px] font-bold uppercase tracking-wider text-slate-400"
                        >
                          Available
                        </span>
                      </div>

                      <div
                        class="mt-4 text-3xl font-bold text-slate-900 tabular-nums"
                      >
                        {{ heroRemaining }}
                      </div>

                      <p class="text-sm text-slate-500 mt-1">
                        {{ heroBalanceLabel }}
                      </p>
                    </div>

                    <!-- Pending -->
                    <div
                      class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
                    >
                      <div class="flex items-center justify-between">
                        <div
                          class="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center"
                        >
                          <i class="pi pi-clock text-amber-600! text-lg"></i>
                        </div>

                        <span
                          class="text-[10px] font-bold uppercase tracking-wider text-slate-400"
                        >
                          In Progress
                        </span>
                      </div>

                      <div
                        class="mt-4 text-3xl font-bold text-slate-900 tabular-nums"
                      >
                        {{ pendingCount }}
                      </div>

                      <p class="text-sm text-slate-500 mt-1">
                        Awaiting approval
                      </p>
                    </div>

                    <!-- Approved -->
                    <div
                      class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
                    >
                      <div class="flex items-center justify-between">
                        <div
                          class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center"
                        >
                          <i
                            class="pi pi-check-circle text-blue-600! text-lg"
                          ></i>
                        </div>

                        <span
                          class="text-[10px] font-bold uppercase tracking-wider text-slate-400"
                        >
                          Completed
                        </span>
                      </div>

                      <div
                        class="mt-4 text-3xl font-bold text-slate-900 tabular-nums"
                      >
                        {{ approvedThisYearCount }}
                      </div>

                      <p class="text-sm text-slate-500 mt-1">
                        Approved this year
                      </p>
                    </div>

                    <!-- Upcoming -->
                    <div
                      class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
                    >
                      <div class="flex items-center justify-between">
                        <div
                          class="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center"
                        >
                          <i
                            class="pi pi-calendar text-indigo-600! text-lg"
                          ></i>
                        </div>

                        <span
                          class="text-[10px] font-bold uppercase tracking-wider text-slate-400"
                        >
                          Next Leave
                        </span>
                      </div>

                      @if (upcomingLeave) {
                        <div class="mt-4 text-xl font-bold text-slate-900">
                          {{ upcomingLeave.startDate | date: 'd MMM' }}
                          –
                          {{ upcomingLeave.endDate | date: 'd MMM' }}
                        </div>

                        <div
                          class="text-sm text-slate-500 mt-1 flex flex-wrap items-center gap-1.5"
                        >
                          <span>
                            {{ upcomingLeave.leaveTypeName }}
                            ·
                            {{ formatLeaveDays(upcomingLeave) }}
                          </span>

                          @if (upcomingLeave.isShortNoticeAnnual) {
                            <p-tag
                              value="Short notice → Unpaid"
                              severity="warn"
                            />
                          }
                        </div>
                      } @else {
                        <div class="mt-4 text-2xl font-bold text-slate-300">
                          —
                        </div>

                        <p class="text-sm text-slate-500 mt-1">
                          No approved leave ahead
                        </p>
                      }
                    </div>
                  </div>
                </section>

                <!-- ================================================= -->
                <!-- APPROVAL SECTION -->
                <!-- ================================================= -->

                @if (canApprove) {
                  <section
                    class="bg-amber-50/70 border border-amber-200 rounded-xl p-5"
                  >
                    <div
                      class="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4"
                    >
                      <div class="flex items-center gap-3">
                        <div
                          class="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"
                        >
                          <i class="pi pi-bell text-amber-700!"></i>
                        </div>

                        <div>
                          <h2 class="text-sm font-bold text-amber-950">
                            Awaiting Your Approval
                          </h2>

                          <p class="text-xs text-amber-800/70 mt-0.5">
                            {{ pendingApprovalCount }} request(s) require your
                            attention
                          </p>
                        </div>
                      </div>

                      @if (pendingApprovalCount > 0) {
                        <p-button
                          label="Open Approval Queue"
                          icon="pi pi-arrow-right"
                          iconPos="right"
                          size="small"
                          routerLink="/leave/approvals"
                        />
                      }
                    </div>

                    @if (pendingApprovals.length > 0) {
                      <div class="flex flex-col gap-2">
                        @for (
                          row of pendingApprovals.slice(0, 3);
                          track row.requestId
                        ) {
                          <div
                            class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-lg border border-amber-100 px-4 py-3"
                            [class.bg-red-50]="row.isEmergency"
                          >
                            <div class="min-w-0">
                              <div class="flex flex-wrap items-center gap-2">
                                <span
                                  class="font-semibold text-sm text-slate-800"
                                >
                                  {{ row.employeeName }}
                                </span>

                                <span class="text-slate-300">•</span>

                                <span class="text-sm text-slate-600">
                                  {{ row.leaveTypeName }}
                                </span>

                                @if (row.isShortNoticeAnnual) {
                                  <p-tag
                                    value="Short notice → Unpaid"
                                    severity="warn"
                                  />
                                }

                                @if (row.isEmergency) {
                                  <p-tag value="URGENT" severity="danger" />
                                }
                              </div>

                              <div class="text-xs text-slate-500 mt-1">
                                {{ row.startDate | date: 'mediumDate' }}
                                –
                                {{ row.endDate | date: 'mediumDate' }}
                                <span class="mx-1">•</span>
                                {{ formatLeaveDays(row) }}
                              </div>
                            </div>

                            <p-button
                              label="Review"
                              icon="pi pi-arrow-right"
                              iconPos="right"
                              size="small"
                              [text]="true"
                              routerLink="/leave/approvals"
                            />
                          </div>
                        }
                      </div>
                    } @else {
                      <div class="bg-white/70 rounded-lg p-4 text-center">
                        <i
                          class="pi pi-check-circle text-emerald-600 text-xl"
                        ></i>

                        <p class="text-sm font-medium text-slate-700 mt-2">
                          All caught up!
                        </p>

                        <p class="text-xs text-slate-500 mt-1">
                          No pending requests for you right now.
                        </p>
                      </div>
                    }
                  </section>
                }

                <!-- ================================================= -->
                <!-- LEAVE BALANCES -->
                <!-- ================================================= -->

                <section>
                  <div class="flex items-center justify-between mb-3">
                    <div>
                      <h2 class="text-sm font-bold text-slate-800">
                        Leave Balances
                      </h2>

                      <p class="text-xs text-slate-400 mt-1">
                        Your entitlement and usage for {{ currentYear }}
                      </p>
                    </div>
                  </div>

                  @if (paidBalances.length === 0 && !unpaidUsage) {
                    <div
                      class="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center"
                    >
                      <i class="pi pi-wallet text-3xl text-slate-300"></i>

                      <p class="text-sm text-slate-600 font-medium mt-3">
                        No leave balances found
                      </p>

                      <p class="text-xs text-slate-400 mt-1">
                        Your leave entitlements will appear here.
                      </p>
                    </div>
                  } @else {
                    <div
                      class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
                    >
                      <!-- Paid Leave -->
                      @for (b of paidBalances; track b.leaveTypeId) {
                        <div
                          class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col gap-4"
                        >
                          <div class="flex items-center justify-between gap-2">
                            <div class="font-bold text-sm text-slate-800">
                              {{ b.leaveTypeName }}
                            </div>

                            @if (isLowBalance(b)) {
                              <span
                                class="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-1 rounded-md whitespace-nowrap"
                              >
                                Low balance
                              </span>
                            }
                          </div>

                          <div>
                            <div
                              class="text-3xl font-bold text-emerald-700 tabular-nums"
                            >
                              {{ b.remainingDays }}
                            </div>

                            <div
                              class="text-[10px] uppercase font-semibold tracking-wider text-slate-400 mt-1"
                            >
                              Days remaining
                            </div>
                          </div>

                          <div class="space-y-2 text-xs text-slate-600">
                            <div
                              class="flex items-center justify-between gap-2"
                            >
                              <span>Entitled</span>

                              <span class="font-semibold text-slate-800">
                                {{ b.entitledDays }}
                              </span>
                            </div>

                            @if ((b.carriedForwardDays ?? 0) > 0) {
                              <div class="text-[11px] text-slate-400">
                                {{ b.tenureEntitledDays ?? 0 }}
                                + {{ b.carriedForwardDays }} carried forward
                              </div>
                            }

                            @if (
                              (b.creditedDays ?? 0) > 0 &&
                              (b.carriedForwardDays ?? 0) === 0
                            ) {
                              <div class="text-[11px] text-slate-400">
                                {{ b.creditedDays }} credited
                              </div>
                            }

                            <div
                              class="flex items-center justify-between gap-2"
                            >
                              <span>Used</span>

                              <span class="font-semibold text-slate-800">
                                {{ b.usedDays }}
                              </span>
                            </div>

                            <div
                              class="flex items-center justify-between gap-2"
                            >
                              <span>Pending</span>

                              <span class="font-semibold text-amber-600">
                                {{ b.pendingDays }}
                              </span>
                            </div>
                          </div>

                          @if (b.entitledDays > 0) {
                            <div class="mt-auto pt-1">
                              <div
                                class="flex justify-between text-[10px] text-slate-400 mb-1.5"
                              >
                                <span>Usage</span>
                                <span>{{ balanceUsedPercent(b) }}%</span>
                              </div>

                              <div
                                class="w-full bg-slate-100 rounded-full h-2 overflow-hidden"
                              >
                                <div
                                  class="h-full rounded-full bg-emerald-500 transition-all"
                                  [style.width.%]="balanceUsedPercent(b)"
                                ></div>
                              </div>
                            </div>
                          }
                        </div>
                      }

                      <!-- Unpaid Leave -->
                      @if (unpaidUsage) {
                        <div
                          class="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col gap-4"
                        >
                          <div class="flex items-center justify-between gap-2">
                            <div class="font-bold text-sm text-slate-800">
                              Unpaid Leave
                            </div>

                            <span
                              class="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-md"
                            >
                              Unlimited
                            </span>
                          </div>

                          <div>
                            <div
                              class="text-3xl font-bold text-slate-800 tabular-nums"
                            >
                              {{ unpaidUsage.takenDays }}
                            </div>

                            <div
                              class="text-[10px] uppercase font-semibold tracking-wider text-slate-400 mt-1"
                            >
                              Days taken this year
                            </div>
                          </div>

                          <div class="space-y-2 text-xs text-slate-600">
                            <div class="flex items-center justify-between">
                              <span>Approved</span>

                              <span class="font-semibold text-slate-800">
                                {{ unpaidUsage.approvedDays }}
                              </span>
                            </div>

                            <div class="flex items-center justify-between">
                              <span>Pending</span>

                              <span class="font-semibold text-amber-600">
                                {{ unpaidUsage.pendingDays }}
                              </span>
                            </div>

                            @if (unpaidUsage.shortNoticeDays > 0) {
                              <div class="text-amber-700">
                                Short-notice Annual:
                                {{ unpaidUsage.shortNoticeDays }} day(s)
                              </div>
                            }
                          </div>

                          <p
                            class="text-xs text-slate-500 leading-relaxed mt-auto pt-2 border-t border-slate-200"
                          >
                            Unpaid leave has no balance limit, so it is not
                            deducted from Annual or other paid types.
                          </p>
                        </div>
                      }
                    </div>
                  }
                </section>

                <!-- ================================================= -->
                <!-- STATUS SUMMARY -->
                <!-- ================================================= -->

                <section>
                  <h2 class="text-sm font-bold text-slate-800 mb-3">
                    Request Status
                  </h2>

                  <div class="flex flex-wrap gap-2">
                    @for (chip of statusChips; track chip.label) {
                      <div
                        class="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border bg-white"
                        [ngClass]="chip.class"
                      >
                        <span>{{ chip.label }}</span>

                        <span class="font-bold">
                          {{ chip.count }}
                        </span>
                      </div>
                    }
                  </div>
                </section>

                <!-- ================================================= -->
                <!-- RECENT REQUESTS -->
                <!-- ================================================= -->

                <section
                  class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"
                >
                  <div
                    class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-100"
                  >
                    <div>
                      <h2 class="text-sm font-bold text-slate-800">
                        Recent Leave Requests
                      </h2>

                      <p class="text-xs text-slate-400 mt-1">
                        Your latest leave application history
                      </p>
                    </div>

                    <a
                      routerLink="/leave/history"
                      class="text-xs font-semibold text-blue-700 hover:text-blue-900"
                    >
                      View All Requests
                      <i class="pi pi-arrow-right text-[10px] ml-1"></i>
                    </a>
                  </div>

                  <div class="p-3">
                    <p-table
                      [value]="recentRequests"
                      styleClass="p-datatable-sm"
                    >
                      <ng-template pTemplate="header">
                        <tr>
                          <th
                            class="text-xs! uppercase! tracking-wider! text-slate-500!"
                          >
                            Leave Type
                          </th>
                          <th
                            class="text-xs! uppercase! tracking-wider! text-slate-500!"
                          >
                            Dates
                          </th>
                          <th
                            class="text-xs! uppercase! tracking-wider! text-slate-500!"
                          >
                            Duration
                          </th>
                          <th
                            class="text-xs! uppercase! tracking-wider! text-slate-500!"
                          >
                            Status
                          </th>
                          <th></th>
                        </tr>
                      </ng-template>

                      <ng-template pTemplate="body" let-row>
                        <tr>
                          <td>
                            <div class="flex flex-wrap items-center gap-1.5">
                              <span
                                class="font-semibold text-sm text-slate-800"
                              >
                                {{ row.leaveTypeName }}
                              </span>

                              @if (row.isShortNoticeAnnual) {
                                <p-tag
                                  value="Short notice → Unpaid"
                                  severity="warn"
                                />
                              } @else if (row.isUnpaid) {
                                <p-tag value="Unpaid" severity="secondary" />
                              }

                              @if (row.isEmergency) {
                                <p-tag value="Emergency" severity="danger" />
                              }
                            </div>
                          </td>

                          <td>
                            <div class="text-sm text-slate-700">
                              {{ row.startDate | date: 'mediumDate' }}
                            </div>

                            <div class="text-xs text-slate-400 mt-0.5">
                              to {{ row.endDate | date: 'mediumDate' }}
                            </div>
                          </td>

                          <td>
                            <span class="text-sm font-medium text-slate-700">
                              {{ formatLeaveDays(row) }}
                            </span>
                          </td>

                          <td>
                            <p-tag
                              [value]="row.status"
                              [severity]="statusSeverity(row)"
                            />
                          </td>

                          <td>
                            <div class="flex items-center justify-end gap-1">
                              @if (row.status === 'Pending') {
                                <p-button
                                  label="Edit"
                                  icon="pi pi-pencil"
                                  size="small"
                                  [text]="true"
                                  [routerLink]="['/leave/apply', row.requestId]"
                                />
                              }

                              <p-button
                                label="View"
                                icon="pi pi-arrow-right"
                                iconPos="right"
                                size="small"
                                [text]="true"
                                [routerLink]="['/leave', row.requestId]"
                              />
                            </div>
                          </td>
                        </tr>
                      </ng-template>

                      <ng-template pTemplate="emptymessage">
                        <tr>
                          <td colspan="5">
                            <div class="py-10 text-center">
                              <i
                                class="pi pi-inbox text-3xl text-slate-300"
                              ></i>

                              <p
                                class="text-sm font-medium text-slate-600 mt-3"
                              >
                                No leave requests yet
                              </p>

                              <p class="text-xs text-slate-400 mt-1">
                                Your leave applications will appear here.
                              </p>
                            </div>
                          </td>
                        </tr>
                      </ng-template>
                    </p-table>
                  </div>
                </section>
              </div>
            </p-tabpanel>

            <!-- ================================================= -->
            <!-- TEAM CALENDAR TAB -->
            <!-- ================================================= -->

            <p-tabpanel value="calendar">
              <div class="pt-2">
                @if (calendarMounted) {
                  <app-leave-calendar />
                }
              </div>
            </p-tabpanel>
          </p-tabpanels>
        </p-tabs>
      </div>
    </div>
  `,
  styleUrl: './leave-dashboard.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaveDashboard implements OnInit, OnDestroy {
  private readonly leaveRequestService = inject(LeaveRequestService);
  private readonly leaveBalanceService = inject(LeaveBalanceService);
  private readonly userService = inject(UserService);
  private readonly messageService = inject(MessageService);
  private readonly loadingService = inject(LoadingService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly currentYear = new Date().getFullYear();

  currentUser = this.userService.currentUser;

  activeTab: string | number = 'overview';
  calendarMounted = false;

  balances: LeaveBalanceDto[] = [];
  paidBalances: LeaveBalanceDto[] = [];
  unpaidUsage: {
    takenDays: number;
    approvedDays: number;
    pendingDays: number;
    shortNoticeDays: number;
  } | null = null;
  requests: LeaveRequestDto[] = [];
  pendingApprovals: LeaveRequestDto[] = [];

  heroRemaining = '—';
  heroBalanceLabel = 'Annual leave';
  pendingCount = 0;
  approvedThisYearCount = 0;
  upcomingLeave: LeaveRequestDto | null = null;
  pendingApprovalCount = 0;
  recentRequests: LeaveRequestDto[] = [];
  statusChips: { label: string; count: number; class: string }[] = [];
  canApprove = false;

  formatLeaveDays(row: LeaveRequestDto): string {
    return formatLeaveDurationLabel(row);
  }

  ngOnInit(): void {
    // Keep the selected tab synchronised with the URL.
    this.activatedRoute.queryParamMap
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        const type = params.get('type');

        this.activeTab = type === 'calendar' ? 'calendar' : 'overview';

        if (this.activeTab === 'calendar') {
          this.calendarMounted = true;
        }

        this.cdr.detectChanges();
      });

    const user = this.userService.currentUser;
    const userId = user?.userId;

    if (!userId) return;

    this.canApprove = APPROVER_ROLES.includes(String(user.systemRole ?? ''));

    this.loadingService.start();

    const balances$ = this.leaveBalanceService
      .getBalances(userId, this.currentYear)
      .pipe(catchError(() => of([] as LeaveBalanceDto[])));

    const requests$ = this.leaveRequestService
      .getAll(userId)
      .pipe(catchError(() => of([] as LeaveRequestDto[])));

    const approvals$ = this.canApprove
      ? this.leaveRequestService
          .getPendingForHod(userId)
          .pipe(catchError(() => of([] as LeaveRequestDto[])))
      : of([] as LeaveRequestDto[]);

    forkJoin({
      balances: balances$,
      requests: requests$,
      approvals: approvals$,
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loadingService.stop()),
      )
      .subscribe({
        next: ({ balances, requests, approvals }) => {
          this.balances = balances;
          this.requests = requests;
          this.pendingApprovals = approvals;

          this.computeDerived();
          this.cdr.detectChanges();
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load leave dashboard',
          });

          this.cdr.detectChanges();
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.loadingService.stop();
  }

  onTabChange(value: string | number | undefined): void {
    if (value == null) return;

    this.activeTab = value;

    if (value === 'calendar') {
      this.calendarMounted = true;
    }

    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: {
        type: value === 'calendar' ? 'calendar' : null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });

    this.cdr.detectChanges();
  }

  statusSeverity(
    row: LeaveRequestDto,
  ): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    switch (row.status) {
      case 'Approved':
        return 'success';
      case 'Rejected':
        return 'danger';
      case 'Pending':
        return 'warn';
      default:
        return 'secondary';
    }
  }

  balanceUsedPercent(b: LeaveBalanceDto): number {
    if (b.entitledDays <= 0) return 0;
    const used = Math.min(b.entitledDays, b.usedDays + b.pendingDays);
    return Math.round((used / b.entitledDays) * 100);
  }

  isLowBalance(b: LeaveBalanceDto): boolean {
    if (this.isUnpaidBalance(b)) return false;
    return b.remainingDays <= 2 && b.entitledDays > 0;
  }

  isUnpaidBalance(b: LeaveBalanceDto): boolean {
    return b.leaveTypeName.toLowerCase().includes('unpaid');
  }

  private computeDerived(): void {
    this.paidBalances = this.balances.filter(
      (b) => !this.isUnpaidBalance(b) && !this.isEmergencyBalance(b),
    );
    this.unpaidUsage = this.computeUnpaidUsage();
    this.setHeroBalance();
    this.pendingCount = this.requests.filter(
      (r) => r.status === 'Pending',
    ).length;
    this.approvedThisYearCount = this.requests.filter(
      (r) => r.status === 'Approved' && this.isInYear(r.startDate),
    ).length;
    this.upcomingLeave = this.findUpcomingLeave();
    this.pendingApprovalCount = this.pendingApprovals.length;
    this.recentRequests = [...this.requests]
      .sort(
        (a, b) =>
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
      )
      .slice(0, 5);
    this.statusChips = this.buildStatusChips();
  }

  isEmergencyBalance(b: LeaveBalanceDto): boolean {
    return b.leaveTypeName.toLowerCase().includes('emergency');
  }

  private computeUnpaidUsage(): {
    takenDays: number;
    approvedDays: number;
    pendingDays: number;
    shortNoticeDays: number;
  } | null {
    const hasUnpaidType = this.balances.some((b) => this.isUnpaidBalance(b));
    const yearRequests = this.requests.filter(
      (r) =>
        this.isInYear(r.startDate) &&
        (r.status === 'Pending' || r.status === 'Approved'),
    );

    const unpaidDayRows = yearRequests
      .map((r) => ({ request: r, days: this.unpaidDaysFromRequest(r) }))
      .filter((row) => row.days > 0);

    if (!hasUnpaidType && unpaidDayRows.length === 0) return null;

    const approvedDays = unpaidDayRows
      .filter((row) => row.request.status === 'Approved')
      .reduce((sum, row) => sum + row.days, 0);
    const pendingDays = unpaidDayRows
      .filter((row) => row.request.status === 'Pending')
      .reduce((sum, row) => sum + row.days, 0);
    const shortNoticeDays = yearRequests
      .filter((r) => r.isShortNoticeAnnual)
      .reduce((sum, r) => sum + (r.totalDays || 0), 0);

    return {
      takenDays: approvedDays + pendingDays,
      approvedDays,
      pendingDays,
      shortNoticeDays,
    };
  }

  /** Unpaid portion for a request (full unpaid, short-notice, or cascade unpaid bucket). */
  private unpaidDaysFromRequest(r: LeaveRequestDto): number {
    const allocations = r.balanceAllocations ?? [];
    if (allocations.length > 0) {
      return allocations
        .filter((a) => a.isUnpaidBucket)
        .reduce((sum, a) => sum + (a.days || 0), 0);
    }
    if (r.isUnpaid || r.isShortNoticeAnnual) return r.totalDays || 0;
    return 0;
  }

  private setHeroBalance(): void {
    const annual = this.paidBalances.find((b) =>
      b.leaveTypeName.toLowerCase().includes('annual'),
    );
    const hero = annual ?? this.paidBalances[0];
    if (hero) {
      this.heroRemaining = String(hero.remainingDays);
      this.heroBalanceLabel = hero.leaveTypeName;
    } else {
      this.heroRemaining = '—';
      this.heroBalanceLabel = 'No balance data';
    }
  }

  private findUpcomingLeave(): LeaveRequestDto | null {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcoming = this.requests
      .filter((r) => r.status === 'Approved' && new Date(r.startDate) >= today)
      .sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
      );
    return upcoming[0] ?? null;
  }

  private buildStatusChips(): {
    label: string;
    count: number;
    class: string;
  }[] {
    const yearRequests = this.requests.filter((r) =>
      this.isInYear(r.startDate),
    );
    const count = (status: string) =>
      yearRequests.filter((r) => r.status === status).length;
    return [
      {
        label: 'Pending',
        count: count('Pending'),
        class: 'bg-amber-50 text-amber-800 border-amber-200',
      },
      {
        label: 'Approved',
        count: count('Approved'),
        class: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      },
      {
        label: 'Rejected',
        count: count('Rejected'),
        class: 'bg-red-50 text-red-800 border-red-200',
      },
      {
        label: 'Cancelled',
        count: count('Cancelled'),
        class: 'bg-gray-50 text-gray-700 border-gray-200',
      },
    ];
  }

  getInitial(fullName?: string): string {
    if (!fullName?.trim()) return '?';

    const names = fullName.trim().split(/\s+/).filter(Boolean);

    if (names.length === 1) {
      return names[0].substring(0, 2).toUpperCase();
    }

    return (names[0].charAt(0) + names[1].charAt(0)).toUpperCase();
  }

  private isInYear(dateStr: string): boolean {
    const d = new Date(dateStr);
    return !Number.isNaN(d.getTime()) && d.getFullYear() === this.currentYear;
  }
}
