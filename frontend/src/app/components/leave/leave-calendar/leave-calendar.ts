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
import { SelectModule } from 'primeng/select';
import { Subject, forkJoin, catchError, of, takeUntil, finalize } from 'rxjs';

import {
  normalizeLeaveSession,
  formatLeaveDurationLabel,
} from '../../../common/guard/leave-day.util';
import { DepartmentDto } from '../../../models/Department';
import {
  LeaveCalendarEventDto,
  PublicHolidayDto,
  LeaveTypeDto,
} from '../../../models/Leave';
import { DepartmentService } from '../../../services/departmentService';
import { LeaveHolidayService } from '../../../services/leave-holiday.service';
import { LeaveRequestService } from '../../../services/leave-request.service';
import { LeaveTypeService } from '../../../services/leave-type.service';
import { LoadingService } from '../../../services/loading.service';
import { UserService } from '../../../services/userService.service';
import { GridifyQueryExtend } from '../../../shared/helpers/helpers';

const APPROVER_ROLES = [
  'SuperAdmin',
  'Admin',
  'HR',
  'Manager',
  'HOD',
  'Management',
];

const CALENDAR_SYNC_ROLES = ['SuperAdmin', 'Admin', 'HR'];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type CalendarView = 'month' | 'week' | 'day' | 'list';

interface CalendarDayCell {
  date: Date;
  key: string;
  inCurrentMonth: boolean;
  isToday: boolean;
  events: LeaveCalendarEventDto[];
  holidayName: string | null;
}

interface CalendarWeekRow {
  key: string;
  days: CalendarDayCell[];
  events: CalendarWeekEvent[];
}

interface CalendarWeekEvent {
  event: LeaveCalendarEventDto;
  startColumn: number;
  span: number;
  continuesBefore: boolean;
  continuesAfter: boolean;
}

@Component({
  selector: 'app-leave-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ButtonModule, SelectModule],
  template: `
    <!-- CALENDAR CARD -->
    <section class="border border-gray-200 overflow-hidden">
      <!-- TOOLBAR -->
      <div class="p-4 sm:p-5 border-b border-slate-100">
        <div
          class="flex flex-col xl:flex-row xl:items-center justify-between gap-4"
        >
          <!-- DATE NAVIGATION -->
          <div class="flex items-center justify-between sm:justify-start gap-3">
            <div class="flex items-center gap-1">
              <button
                type="button"
                (click)="shift(-1)"
                aria-label="Previous period"
                class="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition"
              >
                <i class="pi pi-chevron-left"></i>
              </button>

              <button
                type="button"
                (click)="shift(1)"
                aria-label="Next period"
                class="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition"
              >
                <i class="pi pi-chevron-right"></i>
              </button>
            </div>

            <div class="min-w-0">
              <h2 class="text-lg sm:text-xl font-bold text-slate-900">
                {{ rangeLabel }}
              </h2>
              <p class="text-xs text-slate-400 mt-0.5">Team leave schedule</p>
            </div>

            <button
              type="button"
              (click)="goToday()"
              class="ml-1 px-3.5 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition"
            >
              Today
            </button>
          </div>

          <!-- FILTERS + VIEW -->
          <div class="flex flex-col sm:flex-row sm:items-end gap-3">
            <div
              class="grid grid-cols-1 gap-3"
              [ngClass]="canViewDetails ? 'sm:grid-cols-2' : 'sm:grid-cols-1'"
            >
              <div class="w-full">
                <label
                  class="block text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1.5"
                >
                  Department
                </label>

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
                <div class="w-full">
                  <label
                    class="block text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1.5"
                  >
                    Leave Type
                  </label>

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

            <div>
              <label
                class="block text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1.5"
              >
                Calendar View
              </label>

              <div
                class="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200"
              >
                @for (v of viewOptions; track v.value) {
                  <button
                    type="button"
                    (click)="setView(v.value)"
                    class="px-3 py-2 rounded-lg text-xs font-semibold transition"
                    [class.bg-white]="view === v.value"
                    [class.text-blue-700]="view === v.value"
                    [class.shadow-sm]="view === v.value"
                    [class.text-slate-500]="view !== v.value"
                    [class.hover:text-slate-800]="view !== v.value"
                  >
                    {{ v.label }}
                  </button>
                }
              </div>
            </div>
          </div>
        </div>

        <!-- LEGEND -->
        <div
          class="flex flex-wrap items-center gap-x-5 gap-y-2 mt-5 pt-4 border-t border-slate-100"
        >
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <span class="text-xs text-slate-500">Full-day leave</span>
          </div>

          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span class="text-xs text-slate-500">Half-day leave</span>
          </div>

          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span class="text-xs text-slate-500">Public holiday</span>
          </div>

          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-blue-200"></span>
            <span class="text-xs text-slate-500">Today</span>
          </div>
        </div>
      </div>

      <!-- MONTH VIEW -->
      @if (view === 'month') {
        <div class="overflow-x-auto">
          <div class="min-w-[720px]">
            <!-- WEEKDAY HEADER -->
            <div class="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
              @for (d of weekdays; track d) {
                <div
                  class="py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500"
                >
                  {{ d }}
                </div>
              }
            </div>

            <!-- CALENDAR GRID -->
            <div class="flex flex-col">
              @for (week of monthWeeks; track week.key) {
                <!-- WEEK ROW -->
                <div
                  class="relative grid grid-cols-7 border-b border-slate-100 min-h-[135px]"
                >
                  <!-- DATE CELLS -->
                  @for (cell of week.days; track cell.key; let i = $index) {
                    <div
                      class="relative min-h-[135px] p-2 pb-10 border-r border-slate-100 transition hover:bg-slate-50"
                      [class.bg-slate-50]="!cell.inCurrentMonth"
                      [class.bg-blue-50]="cell.isToday"
                      [class.border-r-0]="i === 6"
                      [attr.aria-label]="
                        (cell.date | date: 'fullDate') +
                        ', ' +
                        cell.events.length +
                        ' leave entries'
                      "
                    >
                      <!-- DATE NUMBER -->
                      <div class="flex items-center justify-between gap-1 mb-2">
                        <span
                          class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                          [class.bg-blue-600]="cell.isToday"
                          [class.text-white]="cell.isToday"
                          [class.text-slate-400]="
                            !cell.inCurrentMonth && !cell.isToday
                          "
                          [class.text-slate-700]="
                            cell.inCurrentMonth && !cell.isToday
                          "
                        >
                          {{ cell.date.getDate() }}
                        </span>

                        @if (cell.holidayName) {
                          <span
                            class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700"
                          >
                            PH
                          </span>
                        }
                      </div>

                      <!-- PUBLIC HOLIDAY -->
                      @if (cell.holidayName) {
                        <div
                          class="rounded-md bg-rose-50 border-l-2 border-rose-500 px-2 py-1.5 mb-1"
                          [title]="cell.holidayName"
                        >
                          <div
                            class="text-[10px] font-bold text-rose-800 truncate"
                          >
                            <i class="pi pi-flag mr-1"></i>
                            {{ cell.holidayName }}
                          </div>
                        </div>
                      }
                    </div>
                  }

                  <!-- CONTINUOUS LEAVE EVENTS -->
                  <div
                    class="absolute inset-x-0 top-1/2 -translate-y-1/2 grid grid-cols-7 auto-rows-[28px] gap-y-1 px-1 z-10"
                  >
                    @for (item of week.events; track item.event.requestId) {
                      <div
                        class="group relative min-w-0 h-7 flex items-center px-2 border-y border-l-2 pointer-events-auto cursor-help"
                        [style.grid-column]="
                          item.startColumn + 1 + ' / span ' + item.span
                        "
                        [style.background-color]="
                          leaveTypeColor(item.event).background
                        "
                        [style.border-left-color]="
                          leaveTypeColor(item.event).border
                        "
                        [style.border-top-color]="
                          leaveTypeColor(item.event).background
                        "
                        [style.border-bottom-color]="
                          leaveTypeColor(item.event).background
                        "
                        [class.rounded-l-md]="!item.continuesBefore"
                        [class.rounded-r-md]="!item.continuesAfter"
                        [class.border-r-2]="!item.continuesAfter"
                        [style.border-right-color]="
                          leaveTypeColor(item.event).border
                        "
                        [title]="eventTitle(item.event)"
                      >
                        @if (!item.continuesBefore) {
                          <div
                            class="text-[10px] font-semibold truncate"
                            [style.color]="leaveTypeColor(item.event).text"
                          >
                            {{ item.event.employeeName }}
                            <span class="font-normal">
                              · {{ item.event.leaveTypeName || 'Leave' }}
                            </span>
                          </div>
                        }
                        <!-- Hover Details -->
                        <div
                          class="hidden group-hover:block absolute left-0 top-full mt-1 w-64 p-3 rounded-xl bg-white border border-slate-200 shadow-xl z-50"
                        >
                          <p class="text-sm font-bold text-slate-800">
                            {{ item.event.employeeName }}
                          </p>

                          <p class="text-xs text-slate-500 mt-1">
                            {{ item.event.leaveTypeName || 'Leave' }}
                          </p>

                          <div class="border-t border-slate-100 my-2"></div>

                          <p class="text-xs text-slate-600">
                            {{ item.event.startDate | date: 'mediumDate' }}
                            –
                            {{ item.event.endDate | date: 'mediumDate' }}
                          </p>

                          <p class="text-xs text-slate-600 mt-2">
                            {{
                              halfDayMarker(item.event) ||
                                formatEventDuration(item.event)
                            }}
                          </p>

                          @if (canViewDetails && item.event.reason) {
                            <div class="border-t border-slate-100 my-2"></div>

                            <p
                              class="text-xs text-slate-600 whitespace-pre-wrap"
                            >
                              {{ item.event.reason }}
                            </p>
                          }
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- MONTH FOOTER -->
        <div
          class="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between"
        >
          <span class="text-xs text-slate-500">
            Hover over a leave entry to view its details.
          </span>

          <span class="text-xs font-medium text-slate-400">
            {{ monthCells.length }} days displayed
          </span>
        </div>
      }

      <!-- WEEK / DAY VIEW -->
      @if (view === 'week' || view === 'day') {
        <div
          class="grid"
          [class.grid-cols-1]="view === 'day'"
          [class.grid-cols-7]="view === 'week'"
        >
          @for (cell of periodCells; track cell.key) {
            <div
              class="min-w-0 min-h-56 border-b border-r border-slate-100 p-3 hover:bg-slate-50/70 transition"
              [class.bg-blue-50]="cell.isToday"
            >
              <div class="flex items-start justify-between gap-2 mb-4">
                <div>
                  <p
                    class="text-[10px] font-bold uppercase tracking-wider"
                    [class.text-blue-600]="cell.isToday"
                    [class.text-slate-400]="!cell.isToday"
                  >
                    {{ weekdays[cell.date.getDay()] }}
                  </p>

                  <p class="text-lg font-bold text-slate-800 mt-1">
                    {{ cell.date | date: 'd MMM' }}
                  </p>
                </div>

                @if (cell.isToday) {
                  <span
                    class="text-[9px] font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded-full"
                  >
                    Today
                  </span>
                }
              </div>

              @if (cell.holidayName) {
                <div
                  class="flex gap-2 p-2 rounded-lg bg-rose-50 border border-rose-100 mb-2"
                  [title]="cell.holidayName"
                >
                  <i class="pi pi-flag text-rose-600 text-xs mt-0.5"></i>
                  <span class="text-xs font-semibold text-rose-800">
                    {{ cell.holidayName }}
                  </span>
                </div>
              }

              <div class="flex flex-col gap-2">
                @for (ev of cell.events; track ev.requestId) {
                  <div
                    class="group relative p-2.5 rounded-lg border cursor-help"
                    [style.background-color]="leaveTypeColor(ev).background"
                    [style.border-color]="leaveTypeColor(ev).border"
                  >
                    <p
                      class="text-xs font-bold truncate"
                      [style.color]="leaveTypeColor(ev).text"
                    >
                      {{ ev.employeeName }}
                    </p>

                    <p
                      class="text-[10px] font-medium mt-1 truncate"
                      [style.color]="leaveTypeColor(ev).text"
                    >
                      {{ ev.leaveTypeName || 'Leave' }}
                    </p>

                    <p
                      class="text-[10px] mt-0.5"
                      [class.text-amber-700]="isHalfDayEvent(ev)"
                      [class.text-slate-500]="!isHalfDayEvent(ev)"
                    >
                      {{ halfDayMarker(ev) || formatEventDuration(ev) }}
                    </p>

                    <!-- HOVER DETAILS -->
                    <div
                      class="invisible opacity-0 group-hover:visible group-hover:opacity-100
         absolute left-0 top-full mt-2 w-72
         bg-white rounded-xl border border-slate-200
         shadow-[0_8px_30px_rgba(15,23,42,0.14)]
         z-50 overflow-hidden
         transition-all duration-200
         pointer-events-none"
                    >
                      <!-- TOP ACCENT -->
                      <div
                        class="h-1 w-full"
                        [style.background-color]="leaveTypeColor(ev).border"
                      ></div>

                      <div class="p-4">
                        <!-- EMPLOYEE -->
                        <div class="flex items-center gap-3">
                          <div
                            class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                            [style.background-color]="
                              leaveTypeColor(ev).background
                            "
                            [style.color]="leaveTypeColor(ev).text"
                          >
                            <i class="pi pi-user text-sm"></i>
                          </div>

                          <div class="min-w-0 flex-1">
                            <p
                              class="text-sm font-bold text-slate-800 truncate"
                            >
                              {{ ev.employeeName }}
                            </p>

                            <p class="text-[11px] text-slate-400 mt-0.5">
                              Leave Request
                            </p>
                          </div>
                        </div>

                        <!-- LEAVE TYPE -->
                        <div class="mt-4">
                          <span
                            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
                            [style.background-color]="
                              leaveTypeColor(ev).background
                            "
                            [style.color]="leaveTypeColor(ev).text"
                          >
                            <i class="pi pi-tag text-[9px]"></i>
                            {{ ev.leaveTypeName || 'Leave' }}
                          </span>
                        </div>

                        <!-- DATE AND DURATION -->
                        <div class="mt-4 space-y-3">
                          <div class="flex items-start gap-3">
                            <div
                              class="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0"
                            >
                              <i
                                class="pi pi-calendar text-slate-500 text-xs"
                              ></i>
                            </div>

                            <div class="min-w-0">
                              <p
                                class="text-[10px] font-bold uppercase tracking-wider text-slate-400"
                              >
                                Leave Period
                              </p>

                              <p
                                class="text-xs font-semibold text-slate-700 mt-1"
                              >
                                {{ ev.startDate | date: 'mediumDate' }}
                              </p>

                              @if (ev.startDate !== ev.endDate) {
                                <p class="text-xs text-slate-500 mt-0.5">
                                  Until {{ ev.endDate | date: 'mediumDate' }}
                                </p>
                              }
                            </div>
                          </div>

                          <div class="flex items-start gap-3">
                            <div
                              class="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0"
                            >
                              <i class="pi pi-clock text-slate-500 text-xs"></i>
                            </div>

                            <div class="min-w-0">
                              <p
                                class="text-[10px] font-bold uppercase tracking-wider text-slate-400"
                              >
                                Duration
                              </p>

                              <p
                                class="text-xs font-semibold text-slate-700 mt-1"
                              >
                                {{
                                  halfDayMarker(ev) ||
                                    formatEventDuration(ev) ||
                                    'Not specified'
                                }}
                              </p>
                            </div>
                          </div>
                        </div>

                        <!-- REASON -->
                        @if (canViewDetails && ev.reason) {
                          <div class="border-t border-slate-100 mt-4 pt-3">
                            <p
                              class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5"
                            >
                              Reason
                            </p>

                            <p
                              class="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap break-words"
                            >
                              {{ ev.reason }}
                            </p>
                          </div>
                        }
                      </div>
                    </div>
                  </div>
                }

                @if (!cell.events.length && !cell.holidayName) {
                  <div
                    class="flex flex-col items-center justify-center py-8 text-slate-300"
                  >
                    <i class="pi pi-calendar text-xl"></i>
                    <span class="text-[10px] mt-2">No leave</span>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- LIST VIEW -->
      @if (view === 'list') {
        <div>
          <div
            class="px-5 py-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between"
          >
            <div>
              <h3 class="text-sm font-bold text-slate-800">Schedule Details</h3>

              <p class="text-xs text-slate-400 mt-1">
                Leave activities for {{ rangeLabel }}
              </p>
            </div>

            <div
              class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"
            >
              <i class="pi pi-list text-blue-600"></i>
            </div>
          </div>

          @if (listHolidays.length) {
            <div class="p-5 bg-rose-50/60 border-b border-rose-100">
              <div class="flex items-center gap-2 mb-3">
                <i class="pi pi-flag text-rose-600"></i>

                <span
                  class="text-xs font-bold uppercase tracking-wide text-rose-800"
                >
                  Public Holidays
                </span>

                <span
                  class="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full"
                >
                  {{ listHolidays.length }}
                </span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                @for (h of listHolidays; track h.id) {
                  <div class="flex items-center gap-3">
                    <div
                      class="w-10 h-10 rounded-lg bg-white border border-rose-100 flex flex-col items-center justify-center shrink-0"
                    >
                      <span
                        class="text-[9px] font-bold uppercase text-rose-500"
                      >
                        {{ h.date | date: 'MMM' }}
                      </span>

                      <span class="text-sm font-bold text-rose-800">
                        {{ h.date | date: 'd' }}
                      </span>
                    </div>

                    <div class="min-w-0">
                      <p class="text-xs font-semibold text-rose-900">
                        {{ h.name }}
                      </p>

                      <p class="text-[10px] text-rose-600 mt-0.5">
                        {{ h.date | date: 'fullDate' }}
                      </p>
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          @if (!listEvents.length) {
            <div class="py-16 px-5 text-center">
              <div
                class="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center"
              >
                <i class="pi pi-calendar-times text-2xl text-slate-400"></i>
              </div>

              <h3 class="text-sm font-bold text-slate-800 mt-4">
                No approved leave found
              </h3>

              <p class="text-xs text-slate-400 mt-1">
                There are no leave activities in this period.
              </p>
            </div>
          } @else {
            <div class="divide-y divide-slate-100">
              @for (ev of listEvents; track ev.requestId) {
                <div
                  class="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition"
                >
                  <div class="flex items-start gap-3 min-w-0">
                    <div
                      class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                      [style.background-color]="leaveTypeColor(ev).background"
                      [style.color]="leaveTypeColor(ev).text"
                    >
                      <i class="pi pi-calendar text-lg"></i>
                    </div>

                    <div class="min-w-0">
                      <div class="flex flex-wrap items-center gap-2">
                        <p class="text-sm font-bold text-slate-800">
                          {{ ev.employeeName }}
                        </p>

                        @if (isHalfDayEvent(ev)) {
                          <span
                            class="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-800"
                          >
                            Half-day
                          </span>
                        }
                      </div>

                      <p class="text-xs text-slate-500 mt-1">
                        {{ ev.startDate | date: 'mediumDate' }}
                        –
                        {{ ev.endDate | date: 'mediumDate' }}
                      </p>

                      @if (ev.leaveTypeName) {
                        <p class="text-xs text-slate-600 mt-1">
                          <i class="pi pi-tag text-[10px]! mr-1"></i>
                          {{ ev.leaveTypeName }}
                        </p>
                      }

                      @if (canViewDetails && halfDayMarker(ev); as mark) {
                        <p class="text-xs text-amber-700 mt-1">
                          {{ mark }}
                        </p>
                      }

                      @if (canViewDetails && ev.reason) {
                        <p class="text-xs text-slate-400 mt-1 line-clamp-2">
                          {{ ev.reason }}
                        </p>
                      }
                    </div>
                  </div>

                  @if (canViewDetails) {
                    <a
                      [routerLink]="['/leave', ev.requestId]"
                      class="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800 shrink-0"
                    >
                      View Details
                      <i class="pi pi-arrow-right text-[10px]"></i>
                    </a>
                  }
                </div>
              }
            </div>
          }
        </div>
      }
    </section>
  `,
  styleUrl: './leave-calendar.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaveCalendar implements OnInit, OnDestroy {
  private readonly leaveRequestService = inject(LeaveRequestService);
  private readonly leaveHolidayService = inject(LeaveHolidayService);
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

  monthWeeks: CalendarWeekRow[] = [];

  view: CalendarView = 'month';
  anchorDate = new Date();

  events: LeaveCalendarEventDto[] = [];
  holidays: PublicHolidayDto[] = [];

  canViewDetails = false;
  canManageCalendarSync = false;

  departmentId: string | null = null;
  leaveTypeId: string | null = null;

  departmentOptions: { label: string; value: string }[] = [];
  leaveTypeOptions: { label: string; value: string }[] = [];

  monthCells: CalendarDayCell[] = [];
  periodCells: CalendarDayCell[] = [];

  listEvents: LeaveCalendarEventDto[] = [];
  listHolidays: PublicHolidayDto[] = [];

  rangeLabel: string = '';

  private eventsByDay = new Map<string, LeaveCalendarEventDto[]>();
  private holidayByDay = new Map<string, string>();

  private readonly leaveTypePalette = [
    { background: '#eff6ff', border: '#3b82f6', text: '#1d4ed8' },
    { background: '#f0fdf4', border: '#22c55e', text: '#15803d' },
    { background: '#faf5ff', border: '#a855f7', text: '#7e22ce' },
    { background: '#fff7ed', border: '#f97316', text: '#c2410c' },
    { background: '#fdf2f8', border: '#ec4899', text: '#be185d' },
    { background: '#ecfeff', border: '#06b6d4', text: '#0e7490' },
    { background: '#fefce8', border: '#eab308', text: '#a16207' },
    { background: '#f1f5f9', border: '#64748b', text: '#334155' },
    { background: '#fff1f2', border: '#f43f5e', text: '#be123c' },
    { background: '#eef2ff', border: '#6366f1', text: '#4338ca' },
  ];

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

  // --------------------------------------------------
  // LEAVE DISPLAY HELPERS
  // --------------------------------------------------

  isHalfDayEvent(ev: LeaveCalendarEventDto): boolean {
    const start = normalizeLeaveSession(ev.startSession);
    const end = normalizeLeaveSession(ev.endSession);

    return start !== 'Full' || end !== 'Full';
  }

  halfDayMarker(ev: LeaveCalendarEventDto): string | null {
    if (!this.isHalfDayEvent(ev)) return null;

    const start = normalizeLeaveSession(ev.startSession);
    const end = normalizeLeaveSession(ev.endSession);

    if (start === end) return start;

    return `${start}-${end}`;
  }

  formatEventDuration(ev: LeaveCalendarEventDto): string | null {
    if (ev.totalDays == null && !this.isHalfDayEvent(ev)) {
      return null;
    }

    return formatLeaveDurationLabel({
      totalDays: ev.totalDays ?? 0,
      startSession: ev.startSession,
      endSession: ev.endSession,
    });
  }

  eventTitle(ev: LeaveCalendarEventDto): string {
    const parts = [ev.employeeName];

    if (ev.leaveTypeName) {
      parts.push(ev.leaveTypeName);
    }

    const duration = this.formatEventDuration(ev);

    if (duration) {
      parts.push(duration);
    }

    return parts.join(' · ');
  }

  leaveTypeColor(ev: LeaveCalendarEventDto) {
    const key = String(
      ev.leaveTypeId || ev.leaveTypeName || 'default-leave',
    ).toLowerCase();

    let hash = 0;

    for (let i = 0; i < key.length; i++) {
      hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    }

    return this.leaveTypePalette[hash % this.leaveTypePalette.length];
  }

  // --------------------------------------------------
  // CALENDAR NAVIGATION
  // --------------------------------------------------

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
  // --------------------------------------------------
  // DATA LOADING
  // --------------------------------------------------

  reload(): void {
    const { from, to } = this.fetchRange();

    this.loadingService.start();

    forkJoin({
      calendar: this.leaveRequestService.getCalendar(
        this.toIsoDate(from),
        this.toIsoDate(to),
        {
          departmentId: this.departmentId,
          leaveTypeId: this.canViewDetails ? this.leaveTypeId : null,
        },
      ),

      holidays: this.leaveHolidayService
        .getInRange(from, to)
        .pipe(catchError(() => of([] as PublicHolidayDto[]))),
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loadingService.stop()),
      )
      .subscribe({
        next: ({ calendar, holidays }) => {
          this.canViewDetails = calendar.canViewDetails;

          this.events = calendar.events ?? [];
          this.holidays = holidays ?? [];

          this.indexEvents();
          this.indexHolidays();
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
            this.leaveTypeOptions = types.map((t) => ({
              label: t.name,
              value: t.id,
            }));

            this.cdr.markForCheck();
          },
        });
    }
  }

  // --------------------------------------------------
  // DATE RANGE
  // --------------------------------------------------

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

      this.monthCells = this.buildDayCells(
        from,
        to,
        this.anchorDate.getMonth(),
      );

      this.buildMonthWeeks();

      this.periodCells = [];
      this.listEvents = [];
      this.listHolidays = [];

      this.rangeLabel = this.anchorDate.toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
      });
    } else if (this.view === 'week') {
      const from = this.startOfWeek(this.anchorDate);
      const to = new Date(from);

      to.setDate(to.getDate() + 6);

      this.periodCells = this.buildDayCells(from, to, null);

      this.monthCells = [];
      this.monthWeeks = [];
      this.listEvents = [];
      this.listHolidays = [];

      this.rangeLabel = `${from.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
      })} – ${to.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })}`;
    } else if (this.view === 'day') {
      const day = this.stripTime(this.anchorDate);

      this.periodCells = this.buildDayCells(day, day, null);

      this.monthCells = [];
      this.monthWeeks = [];
      this.listEvents = [];
      this.listHolidays = [];

      this.rangeLabel = day.toLocaleDateString(undefined, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } else {
      this.monthCells = [];
      this.monthWeeks = [];
      this.periodCells = [];

      const { from, to } = this.monthGridRange(this.anchorDate);

      this.listEvents = this.events
        .filter((e) => this.overlaps(e, from, to))
        .slice()
        .sort(
          (a, b) =>
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
        );

      this.listHolidays = this.holidays
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date));

      this.rangeLabel = this.anchorDate.toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
      });
    }
  }

  // --------------------------------------------------
  // EVENT AND HOLIDAY INDEXING
  // --------------------------------------------------

  private indexEvents(): void {
    this.eventsByDay.clear();

    for (const ev of this.events) {
      const start = this.stripTime(new Date(ev.startDate));
      const end = this.stripTime(new Date(ev.endDate));

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        continue;
      }

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = this.dayKey(d);
        const list = this.eventsByDay.get(key) ?? [];

        list.push(ev);
        this.eventsByDay.set(key, list);
      }
    }
  }

  private indexHolidays(): void {
    this.holidayByDay.clear();

    for (const h of this.holidays) {
      const key = h.date.slice(0, 10);

      if (key) {
        this.holidayByDay.set(key, h.name);
      }
    }
  }

  // --------------------------------------------------
  // CALENDAR CELL BUILDING
  // --------------------------------------------------

  private buildDayCells(
    from: Date,
    to: Date,
    currentMonth: number | null,
  ): CalendarDayCell[] {
    const todayKey = this.dayKey(new Date());
    const cells: CalendarDayCell[] = [];

    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
      const date = this.stripTime(d);
      const key = this.dayKey(date);

      cells.push({
        date,
        key,
        inCurrentMonth:
          currentMonth == null ? true : date.getMonth() === currentMonth,
        isToday: key === todayKey,
        events: this.eventsByDay.get(key) ?? [],
        holidayName: this.holidayByDay.get(key) ?? null,
      });
    }

    return cells;
  }

  private monthGridRange(anchor: Date): {
    from: Date;
    to: Date;
  } {
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);

    const last = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);

    const from = this.startOfWeek(first);
    const to = this.startOfWeek(last);

    to.setDate(to.getDate() + 6);

    return { from, to };
  }

  // --------------------------------------------------
  // CONTINUOUS MONTH EVENT BARS
  // --------------------------------------------------

  private buildMonthWeeks(): void {
    const weeks: CalendarWeekRow[] = [];

    for (let i = 0; i < this.monthCells.length; i += 7) {
      const days = this.monthCells.slice(i, i + 7);

      if (days.length !== 7) {
        continue;
      }

      const weekStart = days[0].date;
      const weekEnd = days[6].date;

      const weekEvents: CalendarWeekEvent[] = [];

      // Collect unique events for this week.
      const uniqueEvents = new Map<string, LeaveCalendarEventDto>();

      for (const day of days) {
        for (const ev of day.events) {
          uniqueEvents.set(ev.requestId, ev);
        }
      }

      // Build a continuous segment for each event.
      for (const ev of uniqueEvents.values()) {
        const eventStart = this.stripTime(new Date(ev.startDate));
        const eventEnd = this.stripTime(new Date(ev.endDate));

        const segmentStart = eventStart > weekStart ? eventStart : weekStart;

        const segmentEnd = eventEnd < weekEnd ? eventEnd : weekEnd;

        const startColumn = segmentStart.getDay();

        const span =
          Math.round(
            (segmentEnd.getTime() - segmentStart.getTime()) / 86400000,
          ) + 1;

        weekEvents.push({
          event: ev,
          startColumn,
          span,
          continuesBefore: eventStart < weekStart,
          continuesAfter: eventEnd > weekEnd,
        });
      }

      // Sort events by start date, then longer events first.
      weekEvents.sort(
        (a, b) => a.startColumn - b.startColumn || b.span - a.span,
      );

      weeks.push({
        key: this.dayKey(weekStart),
        days,
        events: weekEvents,
      });
    }

    this.monthWeeks = weeks;
  }

  // --------------------------------------------------
  // DATE HELPERS
  // --------------------------------------------------

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
