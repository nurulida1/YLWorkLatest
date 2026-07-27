import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { Subject, takeUntil } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { DepartmentDto } from '../../../models/Department';
import {
  LeaveCalendarEventDto,
  LeaveTypeDto,
} from '../../../models/Leave';
import { DepartmentService } from '../../../services/departmentService';
import { LeaveRequestService } from '../../../services/leave-request.service';
import { LeaveTypeService } from '../../../services/leave-type.service';
import { LoadingService } from '../../../services/loading.service';
import { UserService } from '../../../services/userService.service';
import { GridifyQueryExtend } from '../../../shared/helpers/helpers';

const APPROVER_ROLES = ['SuperAdmin', 'Admin', 'HR', 'Manager', 'HOD', 'Management'];
const CALENDAR_SYNC_ROLES = ['SuperAdmin', 'Admin', 'HR'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type CalendarView = 'month' | 'week' | 'day' | 'list';

interface CalendarDayCell {
  date: Date;
  key: string;
  inCurrentMonth: boolean;
  isToday: boolean;
  events: LeaveCalendarEventDto[];
}

@Component({
  selector: 'app-leave-team-calendar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    DialogModule,
    SelectModule,
  ],
  template: `
    <div class="flex flex-col gap-4">
      <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-2">
          <p-button icon="pi pi-chevron-left" [outlined]="true" severity="secondary" (onClick)="shift(-1)" />
          <p-button label="Today" [outlined]="true" severity="secondary" (onClick)="goToday()" />
          <p-button icon="pi pi-chevron-right" [outlined]="true" severity="secondary" (onClick)="shift(1)" />
          <h2 class="text-lg font-semibold text-gray-800 ml-1">{{ rangeLabel }}</h2>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          @if (canManageCalendarSync) {
            <a
              routerLink="/settings/leave-calendar-sync"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <i class="pi pi-google text-xs"></i>
              Sync to Google
            </a>
          }
          <div class="inline-flex rounded-lg border border-gray-200 overflow-hidden">
            @for (v of viewOptions; track v.value) {
              <button
                type="button"
                class="px-3 py-1.5 text-sm transition-colors"
                [class.bg-gray-800]="view === v.value"
                [class.text-white]="view === v.value"
                [class.bg-white]="view !== v.value"
                [class.text-gray-700]="view !== v.value"
                (click)="setView(v.value)"
              >
                {{ v.label }}
              </button>
            }
          </div>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row flex-wrap gap-3">
        <div class="w-full sm:w-56">
          <label class="block text-xs text-gray-500 mb-1">Department</label>
          <p-select
            [options]="departmentOptions"
            [(ngModel)]="departmentId"
            optionLabel="label"
            optionValue="value"
            placeholder="All departments"
            [showClear]="true"
            class="w-full"
            (onChange)="reload()"
          />
        </div>
        @if (canViewDetails) {
          <div class="w-full sm:w-56">
            <label class="block text-xs text-gray-500 mb-1">Leave type</label>
            <p-select
              [options]="leaveTypeOptions"
              [(ngModel)]="leaveTypeId"
              optionLabel="label"
              optionValue="value"
              placeholder="All leave types"
              [showClear]="true"
              class="w-full"
              (onChange)="reload()"
            />
          </div>
        }
      </div>

      @if (view === 'month') {
        <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div class="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
            @for (d of weekdays; track d) {
              <div class="px-2 py-2 text-center text-xs font-semibold text-gray-500 uppercase">{{ d }}</div>
            }
          </div>
          <div class="grid grid-cols-7">
            @for (cell of monthCells; track cell.key) {
              <button
                type="button"
                class="min-h-24 sm:min-h-28 border-b border-r border-gray-100 p-1.5 text-left align-top hover:bg-slate-50 transition-colors"
                [class.bg-slate-50]="!cell.inCurrentMonth"
                [class.opacity-60]="!cell.inCurrentMonth"
                (click)="openDay(cell)"
              >
                <div class="flex items-center justify-between gap-1 mb-1">
                  <span
                    class="text-xs sm:text-sm font-medium w-6 h-6 inline-flex items-center justify-center rounded-full"
                    [class.text-gray-400]="!cell.inCurrentMonth"
                    [class.text-gray-800]="cell.inCurrentMonth && !cell.isToday"
                    [class.bg-blue-600]="cell.isToday"
                    [class.text-white]="cell.isToday"
                  >
                    {{ cell.date.getDate() }}
                  </span>
                  @if (cell.events.length) {
                    <span class="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      {{ cell.events.length }}
                    </span>
                  }
                </div>
                <div class="flex flex-col gap-0.5">
                  @for (ev of cell.events.slice(0, 3); track ev.requestId) {
                    <div class="truncate text-xs text-gray-700 leading-tight">
                      {{ ev.employeeName }}
                    </div>
                  }
                  @if (cell.events.length > 3) {
                    <div class="text-xs text-gray-500">+{{ cell.events.length - 3 }} more</div>
                  }
                </div>
              </button>
            }
          </div>
        </div>
      }

      @if (view === 'week' || view === 'day') {
        <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div
            class="grid gap-0"
            [class.grid-cols-1]="view === 'day'"
            [class.sm:grid-cols-7]="view === 'week'"
          >
            @for (cell of periodCells; track cell.key) {
              <button
                type="button"
                class="min-h-32 border-b sm:border-r border-gray-100 p-3 text-left hover:bg-slate-50 transition-colors"
                (click)="openDay(cell)"
              >
                <div class="flex items-center justify-between mb-2">
                  <div>
                    <div class="text-xs text-gray-500">{{ weekdays[cell.date.getDay()] }}</div>
                    <div
                      class="text-sm font-semibold"
                      [class.text-blue-700]="cell.isToday"
                      [class.text-gray-800]="!cell.isToday"
                    >
                      {{ cell.date | date:'d MMM' }}
                    </div>
                  </div>
                  @if (cell.events.length) {
                    <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      {{ cell.events.length }}
                    </span>
                  }
                </div>
                <div class="flex flex-col gap-1">
                  @for (ev of cell.events; track ev.requestId) {
                    <div class="text-xs text-gray-700 truncate">{{ ev.employeeName }}</div>
                  }
                  @if (!cell.events.length) {
                    <div class="text-xs text-gray-400">No leave</div>
                  }
                </div>
              </button>
            }
          </div>
        </div>
      }

      @if (view === 'list') {
        <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
          @if (!listEvents.length) {
            <div class="p-8 text-center text-sm text-gray-500">No approved leave in this range.</div>
          } @else {
            <ul class="divide-y divide-gray-100 m-0 p-0 list-none">
              @for (ev of listEvents; track ev.requestId) {
                <li class="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div class="min-w-0">
                    <div class="font-medium text-gray-900">{{ ev.employeeName }}</div>
                    <div class="text-sm text-gray-500">
                      {{ ev.startDate | date:'mediumDate' }} – {{ ev.endDate | date:'mediumDate' }}
                      @if (canViewDetails && ev.leaveTypeName) {
                        <span> · {{ ev.leaveTypeName }}</span>
                      }
                    </div>
                    @if (canViewDetails && ev.reason) {
                      <div class="text-xs text-gray-500 mt-1 line-clamp-2">{{ ev.reason }}</div>
                    }
                  </div>
                  @if (canViewDetails) {
                    <a [routerLink]="['/leave', ev.requestId]" class="text-sm text-blue-600 hover:underline shrink-0">
                      View detail
                    </a>
                  }
                </li>
              }
            </ul>
          }
        </div>
      }

      <p-dialog
        [(visible)]="dayDialogVisible"
        [header]="dayDialogTitle"
        [modal]="true"
        [style]="{ width: 'min(480px, 95vw)' }"
        [draggable]="false"
      >
        @if (!selectedDayEvents.length) {
          <p class="text-sm text-gray-500 m-0">No one on leave this day.</p>
        } @else {
          <ul class="m-0 p-0 list-none flex flex-col gap-3">
            @for (ev of selectedDayEvents; track ev.requestId) {
              <li class="border border-gray-200 rounded-lg p-3">
                <div class="font-medium text-gray-900">{{ ev.employeeName }}</div>
                <div class="text-sm text-gray-500 mt-0.5">
                  {{ ev.startDate | date:'mediumDate' }} – {{ ev.endDate | date:'mediumDate' }}
                </div>
                @if (canViewDetails) {
                  @if (ev.leaveTypeName) {
                    <div class="text-sm text-gray-700 mt-1">{{ ev.leaveTypeName }}</div>
                  }
                  @if (ev.reason) {
                    <div class="text-xs text-gray-500 mt-1 whitespace-pre-wrap">{{ ev.reason }}</div>
                  }
                  <a
                    [routerLink]="['/leave', ev.requestId]"
                    class="inline-block text-sm text-blue-600 hover:underline mt-2"
                    (click)="dayDialogVisible = false"
                  >
                    View detail
                  </a>
                }
              </li>
            }
          </ul>
        }
      </p-dialog>
    </div>
  `,
})
export class LeaveTeamCalendar implements OnInit, OnDestroy {
  private readonly leaveRequestService = inject(LeaveRequestService);
  private readonly leaveTypeService = inject(LeaveTypeService);
  private readonly departmentService = inject(DepartmentService);
  private readonly userService = inject(UserService);
  private readonly messageService = inject(MessageService);
  private readonly loadingService = inject(LoadingService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  readonly weekdays = WEEKDAYS;
  readonly viewOptions: { label: string; value: CalendarView }[] = [
    { label: 'Month', value: 'month' },
    { label: 'Week', value: 'week' },
    { label: 'Day', value: 'day' },
    { label: 'List', value: 'list' },
  ];

  view: CalendarView = 'month';
  anchorDate = new Date();
  events: LeaveCalendarEventDto[] = [];
  canViewDetails = false;
  canManageCalendarSync = false;

  departmentId: string | null = null;
  leaveTypeId: string | null = null;
  departmentOptions: { label: string; value: string }[] = [];
  leaveTypeOptions: { label: string; value: string }[] = [];

  monthCells: CalendarDayCell[] = [];
  periodCells: CalendarDayCell[] = [];
  listEvents: LeaveCalendarEventDto[] = [];
  rangeLabel = '';

  dayDialogVisible = false;
  dayDialogTitle = '';
  selectedDayEvents: LeaveCalendarEventDto[] = [];

  private eventsByDay = new Map<string, LeaveCalendarEventDto[]>();

  ngOnInit(): void {
    const role = String(this.userService.currentUser?.systemRole ?? '');
    this.canViewDetails = APPROVER_ROLES.includes(role);
    this.canManageCalendarSync = CALENDAR_SYNC_ROLES.includes(role);
    this.loadFilterOptions();
    this.reload();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setView(view: CalendarView): void {
    if (this.view === view) return;
    this.view = view;
    this.reload();
  }

  shift(delta: number): void {
    const d = new Date(this.anchorDate);
    if (this.view === 'month' || this.view === 'list') {
      d.setMonth(d.getMonth() + delta);
    } else if (this.view === 'week') {
      d.setDate(d.getDate() + delta * 7);
    } else {
      d.setDate(d.getDate() + delta);
    }
    this.anchorDate = d;
    this.reload();
  }

  goToday(): void {
    this.anchorDate = new Date();
    this.reload();
  }

  openDay(cell: CalendarDayCell): void {
    this.selectedDayEvents = cell.events;
    this.dayDialogTitle = cell.date.toLocaleDateString(undefined, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    this.dayDialogVisible = true;
    this.cdr.markForCheck();
  }

  reload(): void {
    const { from, to } = this.fetchRange();
    this.loadingService.start();
    this.leaveRequestService
      .getCalendar(this.toIsoDate(from), this.toIsoDate(to), {
        departmentId: this.departmentId,
        leaveTypeId: this.canViewDetails ? this.leaveTypeId : null,
      })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loadingService.stop()),
      )
      .subscribe({
        next: (res) => {
          this.canViewDetails = res.canViewDetails;
          this.events = res.events ?? [];
          this.indexEvents();
          this.rebuildCells();
          this.cdr.markForCheck();
        },
        error: (e) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: e.error?.message || 'Failed to load team calendar',
          });
          this.cdr.markForCheck();
        },
      });
  }

  private loadFilterOptions(): void {
    const query: GridifyQueryExtend = {
      Page: 1,
      PageSize: 200,
      Select: null,
      OrderBy: 'Name',
      Filter: 'IsActive=true',
      Includes: null,
    };
    this.departmentService
      .GetMany(query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (page) => {
          const rows = (page?.data ?? []) as DepartmentDto[];
          this.departmentOptions = rows
            .map((d) => ({
              label: d.name,
              value: String(d.id ?? ''),
            }))
            .filter((o) => o.value);
          this.cdr.markForCheck();
        },
      });

    if (this.canViewDetails) {
      this.leaveTypeService
        .getAll()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (types: LeaveTypeDto[]) => {
            this.leaveTypeOptions = types.map((t) => ({ label: t.name, value: t.id }));
            this.cdr.markForCheck();
          },
        });
    }
  }

  private fetchRange(): { from: Date; to: Date } {
    if (this.view === 'month' || this.view === 'list') {
      return this.monthGridRange(this.anchorDate);
    }
    if (this.view === 'week') {
      const start = this.startOfWeek(this.anchorDate);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return { from: start, to: end };
    }
    const day = this.stripTime(this.anchorDate);
    return { from: day, to: day };
  }

  private rebuildCells(): void {
    if (this.view === 'month') {
      const { from, to } = this.monthGridRange(this.anchorDate);
      this.monthCells = this.buildDayCells(from, to, this.anchorDate.getMonth());
      this.periodCells = [];
      this.rangeLabel = this.anchorDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    } else if (this.view === 'week') {
      const from = this.startOfWeek(this.anchorDate);
      const to = new Date(from);
      to.setDate(to.getDate() + 6);
      this.periodCells = this.buildDayCells(from, to, null);
      this.monthCells = [];
      this.rangeLabel = `${from.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} – ${to.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`;
    } else if (this.view === 'day') {
      const day = this.stripTime(this.anchorDate);
      this.periodCells = this.buildDayCells(day, day, null);
      this.monthCells = [];
      this.rangeLabel = day.toLocaleDateString(undefined, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } else {
      this.monthCells = [];
      this.periodCells = [];
      const { from, to } = this.monthGridRange(this.anchorDate);
      this.listEvents = this.events
        .filter((e) => this.overlaps(e, from, to))
        .slice()
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      this.rangeLabel = this.anchorDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    }
  }

  private indexEvents(): void {
    this.eventsByDay.clear();
    for (const ev of this.events) {
      const start = this.stripTime(new Date(ev.startDate));
      const end = this.stripTime(new Date(ev.endDate));
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) continue;
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = this.dayKey(d);
        const list = this.eventsByDay.get(key) ?? [];
        list.push(ev);
        this.eventsByDay.set(key, list);
      }
    }
  }

  private buildDayCells(from: Date, to: Date, currentMonth: number | null): CalendarDayCell[] {
    const todayKey = this.dayKey(new Date());
    const cells: CalendarDayCell[] = [];
    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
      const date = this.stripTime(d);
      const key = this.dayKey(date);
      cells.push({
        date,
        key,
        inCurrentMonth: currentMonth == null ? true : date.getMonth() === currentMonth,
        isToday: key === todayKey,
        events: this.eventsByDay.get(key) ?? [],
      });
    }
    return cells;
  }

  private monthGridRange(anchor: Date): { from: Date; to: Date } {
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const last = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
    const from = this.startOfWeek(first);
    const to = this.startOfWeek(last);
    to.setDate(to.getDate() + 6);
    return { from, to };
  }

  private startOfWeek(date: Date): Date {
    const d = this.stripTime(date);
    d.setDate(d.getDate() - d.getDay());
    return d;
  }

  private stripTime(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private dayKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private toIsoDate(date: Date): string {
    return this.dayKey(date);
  }

  private overlaps(ev: LeaveCalendarEventDto, from: Date, to: Date): boolean {
    const start = this.stripTime(new Date(ev.startDate));
    const end = this.stripTime(new Date(ev.endDate));
    return start <= to && end >= from;
  }
}
