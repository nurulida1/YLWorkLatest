import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { forkJoin, of, Subject, takeUntil } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { LeaveBalanceDto, LeaveRequestDto } from '../../../models/Leave';
import { LeaveBalanceService } from '../../../services/leave-balance.service';
import { LeaveRequestService } from '../../../services/leave-request.service';
import { LoadingService } from '../../../services/loading.service';
import { UserService } from '../../../services/userService.service';
import { LeaveTeamCalendar } from '../leave-team-calendar/leave-team-calendar';

const APPROVER_ROLES = ['SuperAdmin', 'Admin', 'HR', 'Manager', 'HOD', 'Management'];

@Component({
  selector: 'app-leave-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    ButtonModule,
    TableModule,
    TagModule,
    TabsModule,
    LeaveTeamCalendar,
  ],
  template: `
    <div class="w-full flex flex-col p-5 gap-5">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div class="flex items-center gap-1 text-gray-500 text-sm mb-1">
            <a routerLink="/dashboard" class="hover:text-gray-700">Dashboard</a>
            <span>/</span>
            <span class="text-gray-800 font-semibold">Leave</span>
          </div>
          <h1 class="text-xl font-semibold text-gray-800">Leave overview</h1>
          <p class="text-gray-500 text-sm mt-0.5">Your balances, requests, and team calendar</p>
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
            label="View history"
            icon="pi pi-list"
            severity="secondary"
            [outlined]="true"
            routerLink="/leave/history"
          />
          <p-button label="Apply leave" icon="pi pi-plus" routerLink="/leave/apply" />
        </div>
      </div>

      <p-tabs [value]="activeTab" (valueChange)="onTabChange($event)">
        <p-tablist>
          <p-tab value="overview">Overview</p-tab>
          <p-tab value="calendar">Team calendar</p-tab>
        </p-tablist>

        <p-tabpanels>
          <p-tabpanel value="overview">
            <div class="flex flex-col gap-5 pt-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div class="bg-white border border-gray-200 rounded-lg p-4 flex flex-col gap-1">
                  <div class="flex items-center gap-2 text-emerald-700">
                    <i class="pi pi-wallet"></i>
                    <span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Remaining</span>
                  </div>
                  <div class="text-2xl font-bold text-gray-900">{{ heroRemaining }}</div>
                  <div class="text-sm text-gray-500">{{ heroBalanceLabel }}</div>
                </div>

                <div class="bg-white border border-gray-200 rounded-lg p-4 flex flex-col gap-1">
                  <div class="flex items-center gap-2 text-amber-600">
                    <i class="pi pi-clock"></i>
                    <span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Pending</span>
                  </div>
                  <div class="text-2xl font-bold text-gray-900">{{ pendingCount }}</div>
                  <div class="text-sm text-gray-500">Awaiting approval</div>
                </div>

                <div class="bg-white border border-gray-200 rounded-lg p-4 flex flex-col gap-1">
                  <div class="flex items-center gap-2 text-blue-600">
                    <i class="pi pi-check"></i>
                    <span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Approved</span>
                  </div>
                  <div class="text-2xl font-bold text-gray-900">{{ approvedThisYearCount }}</div>
                  <div class="text-sm text-gray-500">This year ({{ currentYear }})</div>
                </div>

                <div class="bg-white border border-gray-200 rounded-lg p-4 flex flex-col gap-1">
                  <div class="flex items-center gap-2 text-indigo-600">
                    <i class="pi pi-calendar"></i>
                    <span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Upcoming</span>
                  </div>
                  @if (upcomingLeave) {
                    <div class="text-lg font-bold text-gray-900 leading-tight">
                      {{ upcomingLeave.startDate | date:'d MMM' }} – {{ upcomingLeave.endDate | date:'d MMM' }}
                    </div>
                    <div class="text-sm text-gray-500">
                      {{ upcomingLeave.leaveTypeName }} · {{ upcomingLeave.totalDays }} day(s)
                    </div>
                  } @else {
                    <div class="text-2xl font-bold text-gray-400">—</div>
                    <div class="text-sm text-gray-500">No approved leave ahead</div>
                  }
                </div>
              </div>

              @if (canApprove) {
                <div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                    <div>
                      <h2 class="text-sm font-semibold text-amber-900">Awaiting your approval</h2>
                      <p class="text-sm text-amber-800/80">
                        {{ pendingApprovalCount }} request(s)
                      </p>
                    </div>
                    @if (pendingApprovalCount > 0) {
                      <p-button label="Open approvals queue" size="small" routerLink="/leave/approvals" />
                    }
                  </div>
                  @if (pendingApprovals.length > 0) {
                    <div class="flex flex-col gap-2">
                      @for (row of pendingApprovals.slice(0, 3); track row.requestId) {
                        <div
                          class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white rounded-md border border-amber-100 px-3 py-2"
                          [class.bg-red-50]="row.isEmergency"
                        >
                          <div class="text-sm">
                            <span class="font-semibold text-gray-800">{{ row.employeeName }}</span>
                            <span class="text-gray-500"> · {{ row.leaveTypeName }}</span>
                            @if (row.isEmergency) {
                              <p-tag value="URGENT" severity="danger" class="ml-1" />
                            }
                          </div>
                          <div class="text-sm text-gray-600">
                            {{ row.startDate | date:'shortDate' }} – {{ row.endDate | date:'shortDate' }}
                            · {{ row.totalDays }} day(s)
                          </div>
                        </div>
                      }
                    </div>
                  } @else {
                    <p class="text-sm text-amber-800/70">No pending requests for you right now.</p>
                  }
                </div>
              }

              <div>
                <h2 class="text-sm font-semibold text-gray-700 mb-3">Leave balances ({{ currentYear }})</h2>
                @if (balances.length === 0) {
                  <div class="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-500 text-sm">
                    No leave balances found for this year.
                  </div>
                } @else {
                  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    @for (b of balances; track b.leaveTypeId) {
                      <div class="bg-white border border-gray-200 rounded-lg p-4 flex flex-col gap-3">
                        <div class="font-semibold text-gray-800">{{ b.leaveTypeName }}</div>
                        <div>
                          <div class="text-3xl font-bold text-emerald-700">{{ b.remainingDays }}</div>
                          <div class="text-xs text-gray-500 uppercase tracking-wide">days remaining</div>
                        </div>
                        <div class="text-xs text-gray-600 flex flex-col gap-0.5">
                          <span>Entitled: {{ b.entitledDays }}
                            @if ((b.carriedForwardDays ?? 0) > 0) {
                              <span class="text-gray-500">
                                ({{ b.tenureEntitledDays ?? 0 }} + {{ b.carriedForwardDays }} carried)
                              </span>
                            }
                            @if ((b.creditedDays ?? 0) > 0 && (b.carriedForwardDays ?? 0) === 0) {
                              <span class="text-gray-500">({{ b.creditedDays }} credited)</span>
                            }
                          </span>
                          <span>Used: {{ b.usedDays }}</span>
                          <span>Pending: {{ b.pendingDays }}</span>
                        </div>
                        @if (b.entitledDays > 0) {
                          <div class="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              class="h-full rounded-full bg-emerald-500 transition-all"
                              [style.width.%]="balanceUsedPercent(b)"
                            ></div>
                          </div>
                        }
                        @if (isLowBalance(b)) {
                          <span class="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded w-fit">
                            Low balance
                          </span>
                        }
                      </div>
                    }
                  </div>
                }
              </div>

              <div class="flex flex-wrap gap-2">
                @for (chip of statusChips; track chip.label) {
                  <span
                    class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border"
                    [ngClass]="chip.class"
                  >
                    {{ chip.label }}: {{ chip.count }}
                  </span>
                }
              </div>

              <div class="bg-white border border-gray-200 rounded-lg p-4">
                <div class="flex items-center justify-between mb-3">
                  <h2 class="text-sm font-semibold text-gray-700">Recent requests</h2>
                  <a routerLink="/leave/history" class="text-sm text-blue-600 hover:underline">View all</a>
                </div>
                <p-table [value]="recentRequests" styleClass="p-datatable-sm">
                  <ng-template pTemplate="header">
                    <tr>
                      <th>Type</th>
                      <th>Dates</th>
                      <th>Days</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </ng-template>
                  <ng-template pTemplate="body" let-row>
                    <tr>
                      <td>
                        {{ row.leaveTypeName }}
                        @if (row.isEmergency) {
                          <p-tag value="Emergency" severity="danger" class="ml-1" />
                        }
                      </td>
                      <td>{{ row.startDate | date:'mediumDate' }} – {{ row.endDate | date:'mediumDate' }}</td>
                      <td>{{ row.totalDays }}</td>
                      <td><p-tag [value]="row.status" [severity]="statusSeverity(row)" /></td>
                      <td class="flex gap-1">
                        @if (row.status === 'Pending') {
                          <p-button label="Edit" size="small" [text]="true" [routerLink]="['/leave/apply', row.requestId]" />
                        }
                        <p-button label="View" size="small" [text]="true" [routerLink]="['/leave', row.requestId]" />
                      </td>
                    </tr>
                  </ng-template>
                  <ng-template pTemplate="emptymessage">
                    <tr>
                      <td colspan="5" class="text-center text-gray-500 py-8">No leave requests yet.</td>
                    </tr>
                  </ng-template>
                </p-table>
              </div>
            </div>
          </p-tabpanel>

          <p-tabpanel value="calendar">
            <div class="pt-4">
              @if (calendarMounted) {
                <app-leave-team-calendar />
              }
            </div>
          </p-tabpanel>
        </p-tabpanels>
      </p-tabs>
    </div>
  `,
})
export class LeaveDashboard implements OnInit, OnDestroy {
  private readonly leaveRequestService = inject(LeaveRequestService);
  private readonly leaveBalanceService = inject(LeaveBalanceService);
  private readonly userService = inject(UserService);
  private readonly messageService = inject(MessageService);
  private readonly loadingService = inject(LoadingService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  readonly currentYear = new Date().getFullYear();

  activeTab: string | number = 'overview';
  calendarMounted = false;

  balances: LeaveBalanceDto[] = [];
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

  ngOnInit(): void {
    const user = this.userService.currentUser;
    const userId = user?.userId;
    if (!userId) return;

    this.canApprove = APPROVER_ROLES.includes(String(user.systemRole ?? ''));

    this.loadingService.start();

    const balances$ = this.leaveBalanceService.getBalances(userId, this.currentYear).pipe(
      catchError(() => of([] as LeaveBalanceDto[])),
    );
    const requests$ = this.leaveRequestService.getAll(userId).pipe(
      catchError(() => of([] as LeaveRequestDto[])),
    );
    const approvals$ = this.canApprove
      ? this.leaveRequestService.getPendingForHod(userId).pipe(
          catchError(() => of([] as LeaveRequestDto[])),
        )
      : of([] as LeaveRequestDto[]);

    forkJoin({ balances: balances$, requests: requests$, approvals: approvals$ })
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
          this.cdr.markForCheck();
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load leave dashboard',
          });
          this.cdr.markForCheck();
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
    this.cdr.markForCheck();
  }

  statusSeverity(row: LeaveRequestDto): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
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
    const name = b.leaveTypeName.toLowerCase();
    if (name.includes('unpaid')) return false;
    return b.remainingDays <= 2 && b.entitledDays > 0;
  }

  private computeDerived(): void {
    this.setHeroBalance();
    this.pendingCount = this.requests.filter((r) => r.status === 'Pending').length;
    this.approvedThisYearCount = this.requests.filter(
      (r) => r.status === 'Approved' && this.isInYear(r.startDate),
    ).length;
    this.upcomingLeave = this.findUpcomingLeave();
    this.pendingApprovalCount = this.pendingApprovals.length;
    this.recentRequests = [...this.requests]
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 5);
    this.statusChips = this.buildStatusChips();
  }

  private setHeroBalance(): void {
    const annual = this.balances.find((b) => b.leaveTypeName.toLowerCase().includes('annual'));
    const hero = annual ?? this.balances.find((b) => !b.leaveTypeName.toLowerCase().includes('unpaid'));
    if (hero) {
      this.heroRemaining = String(hero.remainingDays);
      this.heroBalanceLabel = hero.leaveTypeName;
    } else if (this.balances.length > 0) {
      this.heroRemaining = String(this.balances[0].remainingDays);
      this.heroBalanceLabel = this.balances[0].leaveTypeName;
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
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    return upcoming[0] ?? null;
  }

  private buildStatusChips(): { label: string; count: number; class: string }[] {
    const yearRequests = this.requests.filter((r) => this.isInYear(r.startDate));
    const count = (status: string) => yearRequests.filter((r) => r.status === status).length;
    return [
      { label: 'Pending', count: count('Pending'), class: 'bg-amber-50 text-amber-800 border-amber-200' },
      { label: 'Approved', count: count('Approved'), class: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
      { label: 'Rejected', count: count('Rejected'), class: 'bg-red-50 text-red-800 border-red-200' },
      { label: 'Cancelled', count: count('Cancelled'), class: 'bg-gray-50 text-gray-700 border-gray-200' },
    ];
  }

  private isInYear(dateStr: string): boolean {
    const d = new Date(dateStr);
    return !Number.isNaN(d.getTime()) && d.getFullYear() === this.currentYear;
  }
}
