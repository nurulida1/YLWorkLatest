import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { LoadingService } from '../../../services/loading.service';
import { GridifyQueryExtend } from '../../../shared/helpers/helpers';
import { Subject, takeUntil } from 'rxjs';
import { TooltipModule } from 'primeng/tooltip';
import { CalendarOptions } from '@fullcalendar/core/index.js';
import { StaffTaskService } from '../../../services/staffTaskService';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
@Component({
  selector: 'app-task-list-mobile',
  imports: [
    CommonModule,
    ButtonModule,
    InputTextModule,
    FormsModule,
    TagModule,
    AvatarModule,
    AvatarGroupModule,
    ProgressBarModule,
    DrawerModule,
    RouterLink,
    TooltipModule,
  ],
  template: ` <div class="w-full min-h-screen bg-gray-100">
    <div
      class="bg-[#0566D9] px-6 py-4 text-center text-white font-bold text-2xl rounded-b-2xl"
    >
      Schedule
    </div>

    <div class="bg-white border-b border-gray-200 py-4 px-4 shadow-sm">
      <div class="flex justify-between items-center mb-3">
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
            class="flex flex-col items-center justify-center
                     min-w-[58px] py-2 px-2 rounded-xl
                     transition-all duration-200"
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
          </button>
        }
      </div>
    </div>

    <div class="p-5 flex flex-col">
      <div class="font-bold text-lg text-gray-800">
        Task for {{ selectedDate | date: 'MMMM dd, yyyy' }}
      </div>

      <div class="mt-4 flex flex-col gap-3">
        <div
          class="relative overflow-hidden bg-white rounded-lg
                   border border-gray-200 p-4 shadow-sm"
        >
          <div class="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>

          <div class="pl-2 flex flex-col gap-3">
            <div class="flex justify-between items-start">
              <div>
                <div class="font-bold text-gray-800">
                  Review Project Proposal
                </div>

                <div
                  class="text-sm text-gray-500
                           flex items-center gap-2 mt-1"
                >
                  <i class="pi pi-clock"></i>
                  10:00 AM - 11:30 AM
                </div>
              </div>

              <i class="pi pi-ellipsis-v text-gray-400"></i>
            </div>

            <div class="flex gap-2">
              <p-tag value="High Priority" severity="danger"></p-tag>

              <p-tag value="Engineering" severity="secondary"></p-tag>
            </div>
          </div>
        </div>

        <div
          class="relative overflow-hidden bg-white rounded-lg
                   border border-gray-200 p-4 shadow-sm"
        >
          <div class="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>

          <div class="pl-2 flex flex-col gap-3">
            <div class="flex justify-between items-start">
              <div>
                <div class="font-bold text-gray-800">Team Sync: Q4 Goals</div>

                <div
                  class="text-sm text-gray-500
                           flex items-center gap-2 mt-1"
                >
                  <i class="pi pi-clock"></i>
                  1:00 PM - 2:00 PM
                </div>
              </div>

              <i class="pi pi-ellipsis-v text-gray-400"></i>
            </div>

            <div class="flex gap-2">
              <p-tag value="Medium Priority" severity="warn"></p-tag>

              <p-tag value="Management" severity="secondary"></p-tag>
            </div>
          </div>
        </div>

        <div
          class="relative overflow-hidden bg-white rounded-lg
                   border border-gray-200 p-4 shadow-sm"
        >
          <div class="absolute left-0 top-0 bottom-0 w-1 bg-gray-500"></div>

          <div class="pl-2 flex flex-col gap-3">
            <div class="flex justify-between items-start">
              <div>
                <div class="font-bold text-gray-800">
                  Update Onboarding Docs
                </div>

                <div
                  class="text-sm text-gray-500
                           flex items-center gap-2 mt-1"
                >
                  <i class="pi pi-clock"></i>
                  3:30 PM - 4:30 PM
                </div>
              </div>

              <i class="pi pi-ellipsis-v text-gray-400"></i>
            </div>

            <div class="flex gap-2">
              <p-tag value="Low Priority" severity="info"></p-tag>

              <p-tag value="HR" severity="secondary"></p-tag>
            </div>
          </div>
        </div>

        <p-button
          [routerLink]="'/tasks/form'"
          label="Add New Task"
          icon="pi pi-plus"
          styleClass="w-full! py-3! mt-3 bg-blue-600! border-none!"
        ></p-button>
      </div>
    </div>
  </div>`,
  styleUrl: './task-list-mobile.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskListMobile implements OnInit, OnDestroy {
  private readonly staffTaskService = inject(StaffTaskService);
  private readonly loadingService = inject(LoadingService);

  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  selectedDate: Date = new Date();
  weekStart: Date = this.getWeekStart(new Date());

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
    this.staffTaskService
      .GetMany(this.Query)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();
        },
        error: (err) => {
          this.loadingService.stop();
        },
      });
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
    this.selectedDate = new Date(date);
  }

  isSelected(date: Date): boolean {
    return (
      date.getFullYear() === this.selectedDate.getFullYear() &&
      date.getMonth() === this.selectedDate.getMonth() &&
      date.getDate() === this.selectedDate.getDate()
    );
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
