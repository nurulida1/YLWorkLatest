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
import { HrDashboardDto } from '../../../models/AppModels';
import { LeaveCalendarEventDto } from '../../../models/Leave';
import { AppService } from '../../../services/appService.service';
import { LeaveRequestService } from '../../../services/leave-request.service';
import { LoadingService } from '../../../services/loading.service';
import { UserService } from '../../../services/userService.service';

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
  imports: [CommonModule, ButtonModule, RouterLink, ChartModule, TagModule],
  template: `@if (isHr) {
      <div class="p-10 bg-gray-50 min-h-[85vh]">
        <div
          class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 pl-4 border-blue-600 rounded-sm mb-8"
        >
          <div class="flex flex-col tracking-wide">
            <div class="font-bold text-2xl text-gray-900">HR Overview</div>
            <span class="text-gray-500"
              >Welcome back, {{ name }} &bull;
              {{ now | date: 'EEEE, dd MMMM yyyy' }}</span
            >
          </div>
          <div class="flex flex-row items-center gap-3">
            @if (lastRefreshed()) {
              <div
                class="px-3 py-1 text-center bg-blue-100 text-blue-600 font-bold text-sm rounded-full"
              >
                Updated {{ lastRefreshed() | date: 'shortTime' }}
              </div>
            }
            <p-button
              label="Refresh"
              icon="pi pi-refresh"
              severity="secondary"
              [outlined]="true"
              size="small"
              (onClick)="loadHrDashboard()"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-6">
          <a
            routerLink="/settings/user-management"
            class="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between h-36 hover:border-blue-200 transition-colors"
          >
            <div class="flex flex-row justify-between items-start">
              <span
                class="text-sm text-gray-500 font-semibold tracking-wide uppercase"
                >Total Employees</span
              >
              <div class="p-2.5 rounded-lg bg-blue-50 text-blue-800">
                <i class="pi pi-users text-lg!"></i>
              </div>
            </div>
            <div class="text-4xl font-bold text-gray-900">
              {{ hrDashboard()?.totalEmployees ?? 0 }}
            </div>
            <div class="text-sm text-gray-400 font-medium">Active approved staff</div>
          </a>

          <a
            routerLink="/leave/approvals"
            class="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between h-36 hover:border-amber-200 transition-colors"
          >
            <div class="flex flex-row justify-between items-start">
              <span
                class="text-sm text-gray-500 font-semibold tracking-wide uppercase"
                >Pending Leave</span
              >
              <div class="p-2.5 rounded-lg bg-amber-50 text-amber-700">
                <i class="pi pi-calendar-clock text-lg!"></i>
              </div>
            </div>
            <div class="text-4xl font-bold text-gray-900">
              {{ hrDashboard()?.pendingLeave ?? 0 }}
            </div>
            <div class="text-sm text-amber-600 font-medium">Company-wide awaiting approval</div>
          </a>

          <div
            class="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between h-36"
          >
            <div class="flex flex-row justify-between items-start">
              <span
                class="text-sm text-gray-500 font-semibold tracking-wide uppercase"
                >On Leave Today</span
              >
              <div class="p-2.5 rounded-lg bg-rose-50 text-rose-700">
                <i class="pi pi-sign-out text-lg!"></i>
              </div>
            </div>
            <div class="text-4xl font-bold text-gray-900">
              {{ hrDashboard()?.onLeaveToday ?? 0 }}
            </div>
            <div class="text-sm text-gray-400 font-medium">Approved leave overlapping today</div>
          </div>

          <div
            class="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between h-36"
          >
            <div class="flex flex-row justify-between items-start">
              <span
                class="text-sm text-gray-500 font-semibold tracking-wide uppercase"
                >Assumed at Work</span
              >
              <div class="p-2.5 rounded-lg bg-emerald-50 text-emerald-700">
                <i class="pi pi-check-circle text-lg!"></i>
              </div>
            </div>
            <div class="text-4xl font-bold text-gray-900">
              {{ hrDashboard()?.assumedPresentToday ?? 0 }}
            </div>
            <div class="text-sm text-gray-400 font-medium">
              of {{ hrDashboard()?.totalEmployees ?? 0 }} active staff
            </div>
          </div>

          <div
            class="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between h-36"
          >
            <div class="flex flex-row justify-between items-start">
              <span
                class="text-sm text-gray-500 font-semibold tracking-wide uppercase"
                >Resigned Staff</span
              >
              <div class="p-2.5 rounded-lg bg-gray-100 text-gray-600">
                <i class="pi pi-user-minus text-lg!"></i>
              </div>
            </div>
            <div class="text-4xl font-bold text-gray-900">
              {{ hrDashboard()?.resignedStaff ?? 0 }}
            </div>
            <div class="text-sm text-gray-400 font-medium">Inactive with join date on record</div>
          </div>

          <div
            class="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between h-36"
          >
            <div class="flex flex-row justify-between items-start">
              <span
                class="text-sm text-gray-500 font-semibold tracking-wide uppercase"
                >New Staff (&lt;1 year)</span
              >
              <div class="p-2.5 rounded-lg bg-purple-50 text-purple-700">
                <i class="pi pi-user-plus text-lg!"></i>
              </div>
            </div>
            <div class="text-4xl font-bold text-gray-900">
              {{ hrDashboard()?.newStaffUnderOneYear ?? 0 }}
            </div>
            <div class="text-sm text-gray-400 font-medium">Joined within the last 12 months</div>
          </div>
        </div>

        <p class="text-xs text-gray-400 mb-6 -mt-2">
          Attendance is estimated from approved leave: if no one is on leave, all active staff are
          assumed at work.
        </p>

        <div class="grid grid-cols-12 gap-6 mb-6">
          <div
            class="col-span-12 lg:col-span-5 p-5 rounded-xl border border-gray-100 bg-white shadow-sm"
          >
            <h3 class="text-xl font-bold text-gray-900 mb-1">Department Distribution</h3>
            <p class="text-sm text-gray-400 mb-4">Headcount by department (active staff)</p>
            @if (departmentChartData.labels.length) {
              <div class="h-72 flex items-center justify-center">
                <p-chart type="doughnut" [data]="departmentChartData" [options]="departmentChartOptions" />
              </div>
              <div class="mt-4 grid grid-cols-2 gap-2">
                @for (dept of hrDashboard()?.departmentDistribution ?? []; track dept.departmentId) {
                  <div class="flex justify-between text-sm text-gray-600 px-2">
                    <span>{{ dept.department }}</span>
                    <span class="font-semibold text-gray-800">{{ dept.count }}</span>
                  </div>
                }
              </div>
            } @else {
              <div class="h-72 flex items-center justify-center text-gray-400 text-sm">
                No department data available
              </div>
            }
          </div>

          <div class="col-span-12 lg:col-span-7 flex flex-col gap-6">
            <div class="p-5 rounded-xl border border-gray-100 bg-white shadow-sm">
              <div class="flex justify-between items-start mb-4">
                <div>
                  <h3 class="text-xl font-bold text-gray-900">Team Leave Today</h3>
                  <p class="text-sm text-gray-400">Staff on approved leave today</p>
                </div>
                <a
                  routerLink="/leave"
                  class="text-blue-800 text-sm font-semibold hover:underline"
                  >View full calendar</a
                >
              </div>
              @if ((hrDashboard()?.todayLeaveEvents ?? []).length) {
                <div class="flex flex-col gap-2 max-h-48 overflow-y-auto">
                  @for (ev of hrDashboard()?.todayLeaveEvents ?? []; track ev.requestId) {
                    <div
                      class="p-3 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center gap-3"
                    >
                      <div>
                        <div class="font-semibold text-gray-800">{{ ev.employeeName }}</div>
                        <div class="text-xs text-gray-500">
                          {{ ev.leaveTypeName || 'Leave' }}
                          @if (ev.startSession || ev.endSession) {
                            &bull; {{ ev.startSession }} – {{ ev.endSession }}
                          }
                        </div>
                      </div>
                      <span class="text-xs text-gray-400 whitespace-nowrap">{{
                        ev.startDate | date: 'dd MMM'
                      }}</span>
                    </div>
                  }
                </div>
              } @else {
                <p class="text-sm text-gray-400 italic py-6 text-center">
                  No one is on approved leave today.
                </p>
              }
            </div>

            <div class="p-5 rounded-xl border border-gray-100 bg-white shadow-sm">
              <div class="flex justify-between items-start mb-4">
                <div>
                  <h3 class="text-xl font-bold text-gray-900">Personal Tasks</h3>
                  <p class="text-sm text-gray-400">Your schedule and reminders</p>
                </div>
                <a
                  routerLink="/schedule"
                  class="text-blue-800 text-sm font-semibold hover:underline"
                  >Open Schedule</a
                >
              </div>
              <div class="flex flex-col gap-2">
                @for (task of personalTasks; track task.title) {
                  <div
                    class="p-3 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center gap-3"
                  >
                    <div class="flex items-center gap-3 min-w-0">
                      <i class="pi pi-file text-gray-400 text-2xl! shrink-0"></i>
                      <div class="min-w-0">
                        <div class="font-semibold text-gray-800 truncate">{{ task.title }}</div>
                        <div class="text-xs text-gray-500 truncate">{{ task.description }}</div>
                      </div>
                    </div>
                    <p-tag
                      [value]="task.priority"
                      [severity]="task.severity"
                      styleClass="px-4! rounded-full! shrink-0"
                    />
                  </div>
                }
              </div>
            </div>
          </div>
        </div>

        <div class="p-5 rounded-xl border border-gray-100 bg-white shadow-sm">
          <div class="flex justify-between items-start mb-4">
            <div>
              <h3 class="text-xl font-bold text-gray-900">This Week's Leave</h3>
              <p class="text-sm text-gray-400">{{ weekRangeLabel }}</p>
            </div>
          </div>
          <div class="grid grid-cols-7 gap-2">
            @for (day of weekDays(); track day.key) {
              <div
                class="rounded-lg border p-2 min-h-24 flex flex-col"
                [class.border-blue-300]="day.isToday"
                [class.bg-blue-50]="day.isToday"
                [class.border-gray-100]="!day.isToday"
                [class.bg-gray-50]="!day.isToday"
              >
                <div class="text-xs font-semibold text-gray-500 uppercase">{{ day.label }}</div>
                <div
                  class="text-sm font-bold mb-1"
                  [class.text-blue-700]="day.isToday"
                  [class.text-gray-800]="!day.isToday"
                >
                  {{ day.date | date: 'd MMM' }}
                </div>
                @if (day.events.length) {
                  <div class="flex flex-col gap-1 overflow-hidden">
                    @for (ev of day.events.slice(0, 2); track $index) {
                      <div
                        class="text-[10px] leading-tight px-1.5 py-0.5 rounded bg-white border border-gray-200 truncate"
                        [title]="ev.employeeName"
                      >
                        {{ ev.employeeName }}
                      </div>
                    }
                    @if (day.events.length > 2) {
                      <div class="text-[10px] text-gray-400">+{{ day.events.length - 2 }} more</div>
                    }
                  </div>
                } @else {
                  <div class="text-[10px] text-gray-400 mt-auto">—</div>
                }
              </div>
            }
          </div>
        </div>
      </div>
    } @else {
      <div class="p-10 bg-gray-50 min-h-[85vh]">
        <div
          class="flex flex-row item-center justify-between border-l-4 pl-4 border-blue-600 rounded-sm"
        >
          <div class="flex flex-col tracking-wide">
            <div class="font-bold text-2xl">System Overview</div>
            <span class="text-gray-500"
              >Unified performance metrics and real-time operational data</span
            >
          </div>
        </div>
      </div>
    }`,
  styleUrl: './dashboard.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit, OnDestroy {
  private readonly userService = inject(UserService);
  private readonly appService = inject(AppService);
  private readonly leaveRequestService = inject(LeaveRequestService);
  private readonly loadingService = inject(LoadingService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  currentUser = this.userService.currentUser;
  name: string = this.currentUser?.displayName || 'User';
  systemRole: string = this.currentUser?.systemRole || 'Executive';
  now: Date = new Date();

  isHr = this.systemRole === 'HR';
  hrDashboard = signal<HrDashboardDto | null>(null);
  lastRefreshed = signal<Date | null>(null);
  weekDays = signal<WeekDayCell[]>([]);
  weekRangeLabel = '';

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

  departmentChartData: {
    labels: string[];
    datasets: { data: number[]; backgroundColor: string[]; borderWidth: number }[];
  } = { labels: [], datasets: [{ data: [], backgroundColor: [], borderWidth: 0 }] };

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
    if (this.isHr) {
      this.loadHrDashboard();
    }
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
          const normalized = this.normalizeHrDashboard(dashboard as unknown as Record<string, unknown>);
          this.hrDashboard.set(normalized);
          this.buildDepartmentChart(normalized.departmentDistribution);
          this.weekDays.set(this.buildWeekDays(from, to, calendar.events ?? []));
          this.lastRefreshed.set(new Date());
          this.cdr.markForCheck();
        },
        error: () => {
          this.cdr.markForCheck();
        },
      });
  }

  private normalizeHrDashboard(raw: Record<string, unknown>): HrDashboardDto {
    const deptRaw = (raw['departmentDistribution'] ?? raw['DepartmentDistribution'] ?? []) as Record<
      string,
      unknown
    >[];
    const eventsRaw = (raw['todayLeaveEvents'] ?? raw['TodayLeaveEvents'] ?? []) as Record<
      string,
      unknown
    >[];

    return {
      totalEmployees: Number(raw['totalEmployees'] ?? raw['TotalEmployees'] ?? 0),
      pendingLeave: Number(raw['pendingLeave'] ?? raw['PendingLeave'] ?? 0),
      onLeaveToday: Number(raw['onLeaveToday'] ?? raw['OnLeaveToday'] ?? 0),
      assumedPresentToday: Number(raw['assumedPresentToday'] ?? raw['AssumedPresentToday'] ?? 0),
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
        leaveTypeId: (e['leaveTypeId'] ?? e['LeaveTypeId']) as string | undefined,
        leaveTypeName: (e['leaveTypeName'] ?? e['LeaveTypeName']) as string | undefined,
        reason: (e['reason'] ?? e['Reason']) as string | undefined,
        totalDays: (e['totalDays'] ?? e['TotalDays']) as number | undefined,
        startSession: (e['startSession'] ?? e['StartSession']) as string | undefined,
        endSession: (e['endSession'] ?? e['EndSession']) as string | undefined,
        canViewDetails: Boolean(e['canViewDetails'] ?? e['CanViewDetails'] ?? true),
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

  private buildWeekDays(from: Date, to: Date, events: LeaveCalendarEventDto[]): WeekDayCell[] {
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
}
