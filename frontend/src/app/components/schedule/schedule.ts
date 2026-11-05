import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  Query,
} from '@angular/core';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { TagModule } from 'primeng/tag';
import { ClientRoutingModule } from '../clients/client-routing.module';
import { StaffTaskService } from '../../services/staffTaskService';
import { LoadingService } from '../../services/loading.service';
import { GridifyQueryExtend } from '../../shared/helpers/helpers';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { MeetingService } from '../../services/MeetingService';
import { ScheduleItem } from '../../models/Schedule';

@Component({
  selector: 'app-schedule',
  imports: [
    CommonModule,
    FullCalendarModule,
    ButtonModule,
    DatePickerModule,
    TagModule,
    ClientRoutingModule,
  ],
  template: `<div class="w-full min-h-screen bg-gray-100">
    <!-- Header -->
    <div
      class="bg-[#0566D9] px-6 py-4 text-center text-white font-bold text-2xl rounded-b-2xl"
    >
      Schedule
    </div>

    <div class="p-5 flex flex-col gap-5">
      <!-- Schedule Summary -->
      <div class="flex items-start justify-between">
        <div>
          <div class="font-bold text-lg text-gray-800">Schedule</div>

          <div class="text-sm text-gray-500">
            {{ selectedDate | date: 'EEEE, MMMM dd, yyyy' }}
          </div>
        </div>

        <div
          class="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm font-semibold"
        >
          {{ selectedScheduleItems.length }} Items
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-2 gap-3">
        <!-- Tasks -->
        <div class="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center"
            >
              <i class="pi pi-check-square text-blue-600 text-lg!"></i>
            </div>

            <div>
              <div class="text-gray-500">Tasks</div>

              <div class="font-bold text-2xl text-gray-800">
                {{ selectedTaskCount }}
              </div>
            </div>
          </div>
        </div>

        <!-- Meetings -->
        <div class="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center"
            >
              <i class="pi pi-users text-purple-600 text-lg!"></i>
            </div>

            <div>
              <div class="text-gray-500">Meetings</div>

              <div class="font-bold text-2xl text-gray-800">
                {{ selectedMeetingCount }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Week Calendar -->
      <div
        class="bg-white border border-gray-200 rounded-xl py-4 px-4 shadow-sm"
      >
        <div class="flex justify-between items-center mb-4">
          <div class="text-xl font-semibold text-gray-800">
            {{ currentMonthLabel }}
          </div>

          <div class="flex items-center gap-1">
            <p-button
              icon="pi pi-chevron-left"
              [text]="true"
              severity="secondary"
              (onClick)="previousWeek()"
            ></p-button>

            <p-button
              icon="pi pi-chevron-right"
              [text]="true"
              severity="secondary"
              (onClick)="nextWeek()"
            ></p-button>
          </div>
        </div>

        <div class="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
          @for (day of weekDays; track day.date.getTime()) {
            <button
              type="button"
              (click)="selectDate(day.date)"
              class="flex flex-col items-center justify-center min-w-[58px] py-2 px-2 rounded-xl transition-all duration-200"
              [class.bg-blue-600]="isSelected(day.date)"
              [class.text-white]="isSelected(day.date)"
              [class.shadow-md]="isSelected(day.date)"
              [class.bg-gray-50]="!isSelected(day.date)"
              [class.text-gray-600]="!isSelected(day.date)"
            >
              <span
                class="text-xs uppercase font-medium mb-1"
                [class.text-white]="isSelected(day.date)"
                [class.text-gray-400]="!isSelected(day.date)"
              >
                {{ day.date | date: 'EEE' }}
              </span>

              <span class="text-lg font-semibold">
                {{ day.date | date: 'dd' }}
              </span>

              <!-- Indicator -->
              @if (getScheduleCountForDate(day.date) > 0) {
                <div
                  class="mt-1 w-1.5 h-1.5 rounded-full"
                  [class.bg-white]="isSelected(day.date)"
                  [class.bg-blue-500]="!isSelected(day.date)"
                ></div>
              }
            </button>
          }
        </div>
      </div>

      <!-- Schedule List Header -->
      <div class="flex items-center justify-between">
        <div>
          <div class="font-bold text-lg text-gray-800">
            Schedule for {{ selectedDate | date: 'MMMM dd, yyyy' }}
          </div>

          <div class="text-sm text-gray-500 mt-1">
            @if (selectedScheduleItems.length > 0) {
              {{ selectedScheduleItems.length }}
              {{ selectedScheduleItems.length === 1 ? 'item' : 'items' }}
              scheduled
            } @else {
              No schedule for this day
            }
          </div>
        </div>
      </div>

      <!-- Schedule Items -->
      <div class="flex flex-col gap-3">
        @for (item of selectedScheduleItems; track item.id) {
          <!-- TASK -->
          @if (item.type === 'task') {
            <div
              class="relative overflow-hidden bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
            >
              <!-- Priority Color -->
              <div
                class="absolute left-0 top-0 bottom-0 w-1"
                [class.bg-red-500]="
                  item.priority === 'High' || item.priority === 'Critical'
                "
                [class.bg-orange-500]="item.priority === 'Medium'"
                [class.bg-green-500]="item.priority === 'Low'"
                [class.bg-blue-500]="!item.priority"
              ></div>

              <div class="pl-2 flex flex-col gap-3">
                <!-- Top -->
                <div class="flex justify-between items-start gap-3">
                  <div class="flex items-start gap-3 min-w-0">
                    <div
                      class="w-10 h-10 shrink-0 rounded-lg bg-blue-50 flex items-center justify-center"
                    >
                      <i class="pi pi-check-square text-blue-600"></i>
                    </div>

                    <div class="min-w-0">
                      <div class="font-bold text-gray-800 truncate">
                        {{ item.title }}
                      </div>

                      @if (item.description) {
                        <div class="text-sm text-gray-500 mt-1 line-clamp-2">
                          {{ item.description }}
                        </div>
                      }
                    </div>
                  </div>

                  <i class="pi pi-ellipsis-v text-gray-400 shrink-0"></i>
                </div>

                <!-- Dates -->
                <div
                  class="text-sm text-gray-500 flex flex-wrap items-center gap-x-2 gap-y-1"
                >
                  <i class="pi pi-calendar text-xs"></i>

                  @if (item.startDate) {
                    <span>
                      Start:
                      {{ item.startDate | date: 'MMM dd' }}
                    </span>
                  }

                  @if (item.endDate) {
                    <span class="text-gray-300">•</span>

                    <span>
                      Due:
                      {{ item.endDate | date: 'MMM dd' }}
                    </span>
                  }
                </div>

                <!-- Tags -->
                <div class="flex flex-wrap gap-2">
                  <p-tag
                    [value]="item.priority || 'Medium'"
                    [severity]="getPrioritySeverity(item.priority)"
                  ></p-tag>

                  @if (item.category) {
                    <p-tag [value]="item.category" severity="secondary"></p-tag>
                  }

                  @if (item.status) {
                    <p-tag
                      [value]="item.status"
                      [severity]="getStatusSeverity(item.status)"
                    ></p-tag>
                  }
                </div>
              </div>
            </div>
          }

          <!-- MEETING -->
          @if (item.type === 'meeting') {
            <div
              class="relative overflow-hidden bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
            >
              <!-- Meeting Color -->
              <div
                class="absolute left-0 top-0 bottom-0 w-1 bg-purple-500"
              ></div>

              <div class="pl-2 flex flex-col gap-3">
                <!-- Top -->
                <div class="flex justify-between items-start gap-3">
                  <div class="flex items-start gap-3 min-w-0">
                    <div
                      class="w-10 h-10 shrink-0 rounded-lg bg-purple-50 flex items-center justify-center"
                    >
                      <i class="pi pi-users text-purple-600"></i>
                    </div>

                    <div class="min-w-0">
                      <div class="font-bold text-gray-800 truncate">
                        {{ item.title }}
                      </div>

                      @if (item.description) {
                        <div class="text-sm text-gray-500 mt-1 line-clamp-2">
                          {{ item.description }}
                        </div>
                      }
                    </div>
                  </div>

                  <i class="pi pi-ellipsis-v text-gray-400 shrink-0"></i>
                </div>

                <!-- Meeting Time -->
                @if (item.meetingTime) {
                  <div class="text-sm text-gray-500 flex items-center gap-2">
                    <i class="pi pi-clock"></i>

                    <span>
                      {{ formatMeetingTime(item.meetingTime) }}
                    </span>
                  </div>
                }

                <!-- Location -->
                @if (item.location) {
                  <div class="text-sm text-gray-500 flex items-center gap-2">
                    <i class="pi pi-map-marker"></i>

                    <span class="truncate">
                      {{ item.location }}
                    </span>
                  </div>
                }

                <!-- Meeting Link -->
                @if (item.meetingLink) {
                  <a
                    [href]="item.meetingLink"
                    target="_blank"
                    class="text-sm text-blue-600 flex items-center gap-2"
                  >
                    <i class="pi pi-external-link"></i>

                    <span>Join Meeting</span>
                  </a>
                }

                <!-- Tags -->
                <div class="flex flex-wrap gap-2">
                  <p-tag value="Meeting" severity="secondary"></p-tag>

                  @if (item.category) {
                    <p-tag [value]="item.category" severity="info"></p-tag>
                  }
                </div>
              </div>
            </div>
          }
        }

        <!-- Empty State -->
        @if (selectedScheduleItems.length === 0) {
          <div
            class="bg-white rounded-xl border border-gray-200 p-8 text-center"
          >
            <div
              class="w-14 h-14 mx-auto rounded-full bg-gray-100 flex items-center justify-center"
            >
              <i class="pi pi-calendar text-gray-400 text-xl"></i>
            </div>

            <div class="font-semibold text-gray-700 mt-4">
              No schedule found
            </div>

            <div class="text-sm text-gray-500 mt-1">
              You don't have any tasks or meetings scheduled for this date.
            </div>
          </div>
        }
      </div>

      <!-- Add Task -->
      <p-button
        [routerLink]="'/tasks/form'"
        label="Add New Task"
        icon="pi pi-plus"
        styleClass="w-full! py-3! mt-2 bg-blue-600! border-none!"
      ></p-button>
    </div>
  </div>`,
  styleUrl: './schedule.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Schedule implements OnInit, OnDestroy {
  private readonly staffTaskService = inject(StaffTaskService);
  private readonly meetingService = inject(MeetingService);
  private readonly loadingService = inject(LoadingService);

  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  selectedDate: Date = new Date();
  weekStart: Date = this.getWeekStart(new Date());

  scheduleItems: ScheduleItem[] = [];

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],

    initialView: 'dayGridMonth',

    headerToolbar: {
      left: 'prev,next',
      center: 'title',
      right: '',
    },

    height: 'auto',

    fixedWeekCount: false,

    dayMaxEvents: 2,

    events: [
      {
        title: 'Website Redesign',
        start: '2026-07-10',
        end: '2026-07-18',
        backgroundColor: '#2563eb',
        borderColor: '#2563eb',
      },
      {
        title: 'Mobile App Development',
        start: '2026-07-15',
        end: '2026-07-30',
        backgroundColor: '#16a34a',
        borderColor: '#16a34a',
      },
      {
        title: 'Testing Phase',
        start: '2026-07-22',
        backgroundColor: '#f59e0b',
        borderColor: '#f59e0b',
      },
    ],

    dateClick: (info) => {
      this.selectedDate = info.date;
    },

    eventClick: (info) => {
      this.selectedDate = info.event.start ?? new Date();
    },
  };

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 1000000;
    this.Query.Select = null;
    this.Query.OrderBy = null;
    this.Query.Filter = null;
    this.Query.Includes = null;
  }

  ngOnInit() {
    this.GetData();
  }

  GetData() {
    this.loadingService.start();

    forkJoin({
      tasks: this.staffTaskService.GetMany(this.Query),
      meetings: this.meetingService.GetMany(this.Query),
    })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: ({ tasks, meetings }) => {
          this.loadingService.stop();

          const taskData = tasks.data ?? tasks;
          const meetingData = meetings.data ?? meetings;

          const taskItems: ScheduleItem[] = taskData.map((task: any) => ({
            id: task.id,
            type: 'task',

            title: task.title,
            description: task.description,

            startDate: new Date(task.startDate ?? task.dueDate),

            endDate: new Date(task.dueDate),

            priority: task.priority,
            category: task.category,
            status: task.status,
          }));

          const meetingItems: ScheduleItem[] = meetingData.map(
            (meeting: any) => ({
              id: meeting.id,
              type: 'meeting',

              title: meeting.title,
              description: meeting.description,

              startDate: new Date(meeting.meetingDate),

              meetingTime: meeting.meetingTime,

              location: meeting.location,
              meetingLink: meeting.meetingLink,

              category: 'Meeting',
            }),
          );

          this.scheduleItems = [...taskItems, ...meetingItems];

          console.log('All Schedule:', this.scheduleItems);
        },

        error: (err) => {
          this.loadingService.stop();
          console.error('Failed to load schedule:', err);
        },
      });
  }

  get selectedScheduleItems(): ScheduleItem[] {
    return this.scheduleItems
      .filter((item) => this.isItemOnDate(item, this.selectedDate))
      .sort((a, b) => this.getScheduleTime(a) - this.getScheduleTime(b));
  }

  private isSameDate(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  private getScheduleTime(item: ScheduleItem): number {
    const date = new Date(item.startDate);

    if (item.type === 'meeting' && item.meetingTime) {
      const [hours, minutes, seconds = '0'] = item.meetingTime.split(':');

      date.setHours(Number(hours), Number(minutes), Number(seconds), 0);
    }

    return date.getTime();
  }

  get selectedTaskCount(): number {
    return this.selectedScheduleItems.filter((x) => x.type === 'task').length;
  }

  get selectedMeetingCount(): number {
    return this.selectedScheduleItems.filter((x) => x.type === 'meeting')
      .length;
  }

  get weekDays(): { date: Date }[] {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(this.weekStart);

      date.setDate(this.weekStart.getDate() + index);

      return { date };
    });
  }

  get currentMonthLabel(): string {
    return this.selectedDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }

  getWeekStart(date: Date): Date {
    const result = new Date(date);

    const day = result.getDay();

    const diff = day === 0 ? -6 : 1 - day;

    result.setDate(result.getDate() + diff);

    result.setHours(0, 0, 0, 0);

    return result;
  }

  previousWeek(): void {
    const date = new Date(this.weekStart);

    date.setDate(date.getDate() - 7);

    this.weekStart = date;

    this.selectedDate = new Date(date);
  }

  nextWeek(): void {
    const date = new Date(this.weekStart);

    date.setDate(date.getDate() + 7);

    this.weekStart = date;

    this.selectedDate = new Date(date);
  }

  selectDate(date: Date): void {
    this.selectedDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );
  }

  isSelected(date: Date): boolean {
    return (
      date.getFullYear() === this.selectedDate.getFullYear() &&
      date.getMonth() === this.selectedDate.getMonth() &&
      date.getDate() === this.selectedDate.getDate()
    );
  }

  getScheduleCountForDate(date: Date): number {
    return this.scheduleItems.filter((item) => this.isItemOnDate(item, date))
      .length;
  }

  getPrioritySeverity(
    priority?: string,
  ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (priority?.toLowerCase()) {
      case 'critical':
      case 'high':
        return 'danger';

      case 'medium':
        return 'warn';

      case 'low':
        return 'success';

      default:
        return 'secondary';
    }
  }

  getStatusSeverity(
    status?: string,
  ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'success';

      case 'inprogress':
      case 'in progress':
        return 'info';

      case 'pending':
        return 'warn';

      case 'cancelled':
        return 'danger';

      case 'todo':
      default:
        return 'secondary';
    }
  }

  formatMeetingTime(time?: string): string {
    if (!time) {
      return '';
    }

    const [hours, minutes] = time.split(':');

    const date = new Date();

    date.setHours(Number(hours), Number(minutes), 0, 0);

    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  private getDateKey(date: Date | string): string {
    const d = new Date(date);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private isItemOnDate(item: ScheduleItem, date: Date): boolean {
    const selectedKey = this.getDateKey(date);

    // Meeting only belongs to its meeting date
    if (item.type === 'meeting') {
      return this.getDateKey(item.startDate) === selectedKey;
    }

    // Task can span from StartDate until DueDate
    const selected = new Date(date);
    selected.setHours(0, 0, 0, 0);

    const start = new Date(item.startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(item.endDate ?? item.startDate);
    end.setHours(23, 59, 59, 999);

    return selected >= start && selected <= end;
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
