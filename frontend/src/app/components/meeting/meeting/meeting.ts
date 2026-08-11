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
import { LoadingService } from '../../../services/loading.service';
import { MeetingService } from '../../../services/MeetingService';
import { Subject, takeUntil } from 'rxjs';
import {
  GridifyQueryExtend,
  PagingContent,
} from '../../../shared/helpers/helpers';
import { MeetingDto } from '../../../models/Meeting';
import { RouterLink } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DatePickerModule } from 'primeng/datepicker';
import { MultiSelectModule } from 'primeng/multiselect';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { UserService } from '../../../services/userService.service';

interface CalendarDay {
  date: number;
  fullDate: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  meetings: MeetingDto[];
}

@Component({
  selector: 'app-meeting',
  imports: [
    CommonModule,
    RouterLink,
    InputTextModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    ReactiveFormsModule,
    DatePickerModule,
    MultiSelectModule,
    TextareaModule,
    SelectModule,
  ],
  template: `<div class="w-full min-h-[92.9vh] flex flex-col p-5">
    <div class="flex flex-row items-center justify-between">
      <div class="flex flex-row items-center gap-1 text-gray-500 tracking-wide">
        <div
          [routerLink]="'/dashboard'"
          class="cursor-pointer hover:text-gray-600"
        >
          Dashboard
        </div>
        <i class="pi pi-chevron-right text-[8px]! text-gray-500!"></i>
        <div class="text-gray-700 font-semibold">Upcoming Meetings</div>
      </div>
    </div>
    <div class="mt-3 tracking-wide flex flex-col">
      <div class="flex flex-row items-center justify-between">
        <div class="text-[20px] text-gray-700 font-semibold">
          Upcoming Meetings
        </div>

        <p-button
          label="New Meeting"
          icon="pi pi-plus"
          severity="info"
          (onClick)="OpenDialog()"
          styleClass="tracking-wide! bg-blue-700! border-none! rounded-none! py-2! px-5!"
        ></p-button>
      </div>
      <div class="calendar-container mt-4">
        <div class="calendar-header">
          <div class="calendar-navigation">
            <button
              type="button"
              class="calendar-nav-button"
              (click)="previousMonth()"
            >
              <i class="pi pi-chevron-left"></i>
            </button>

            <div class="calendar-title">
              <h1>{{ currentMonthName }}</h1>
              <p>{{ currentYear }}</p>
            </div>

            <button
              type="button"
              class="calendar-nav-button"
              (click)="nextMonth()"
            >
              <i class="pi pi-chevron-right"></i>
            </button>
          </div>

          <button type="button" class="today-button" (click)="goToToday()">
            Today
          </button>
        </div>

        <div class="calendar">
          <ng-container *ngFor="let dayName of dayNames">
            <span class="day-name">
              {{ dayName }}
            </span>
          </ng-container>

          <div
            *ngFor="let day of calendarDays; let i = index"
            class="day"
            [class.day--disabled]="!day.isCurrentMonth"
            [class.day--today]="day.isToday"
            [class.day--last-column]="i % 7 === 6"
          >
            <div class="day-number">
              {{ day.date }}
            </div>

            <div class="day-meetings">
              <div
                *ngFor="let meeting of getVisibleMeetings(day.meetings)"
                class="task"
                [ngClass]="getMeetingTaskClass(meeting)"
                [class.task--past]="isMeetingPast(meeting)"
                [class.task--now]="isMeetingNow(meeting)"
              >
                <div class="task-title">
                  {{ meeting.title }}
                </div>

                <div class="task-time">
                  {{ formatMeetingTime(meeting.meetingTime) }}
                </div>

                <div class="task__detail">
                  <h2>
                    {{ meeting.title }}
                  </h2>

                  <p class="task-date">
                    {{ formatMeetingDate(meeting.meetingDate) }}
                  </p>

                  <p *ngIf="meeting.meetingTime" class="task-time-detail">
                    <i class="pi pi-clock"></i>
                    {{ formatMeetingTime(meeting.meetingTime) }}
                  </p>

                  <p *ngIf="meeting.location" class="task-location">
                    <i class="pi pi-map-marker"></i>
                    {{ meeting.location }}
                  </p>

                  <p *ngIf="meeting.meetingLink" class="task-location">
                    <i class="pi pi-video"></i>
                    <a
                      [href]="meeting.meetingLink"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-blue-600 hover:underline"
                    >
                      Join Meeting
                    </a>
                  </p>

                  <p *ngIf="meeting.description" class="task-description">
                    {{ meeting.description }}
                  </p>

                  <div
                    *ngIf="isOrganizer(meeting) && !isMeetingPast(meeting)"
                    class="flex gap-2 mt-3 pt-3 border-t border-gray-200"
                  >
                    <p-button
                      label="Edit"
                      icon="pi pi-pencil"
                      size="small"
                      severity="info"
                      [outlined]="true"
                      (onClick)="EditMeeting(meeting)"
                    ></p-button>

                    <p-button
                      label="Cancel Meeting"
                      icon="pi pi-times"
                      size="small"
                      severity="danger"
                      [outlined]="true"
                      (onClick)="CancelMeeting(meeting)"
                    ></p-button>
                  </div>
                </div>
              </div>
              <button
                *ngIf="getMoreMeetingsCount(day) > 0"
                type="button"
                class="more-meetings"
                (click)="showMoreMeetings(day)"
              >
                +{{ getMoreMeetingsCount(day) }} more
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <p-dialog
      [(visible)]="dialogVisible"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      styleClass="backdrop-blur-lg! w-[600px]! max-w-[90vw]!"
      ><ng-template #headless>
        <div class="flex flex-col gap-3 p-5">
          <strong class="text-lg">
            {{ isUpdate ? 'Edit Meeting' : 'New Meeting' }}
          </strong>
          <div class="grid grid-cols-12 gap-5" [formGroup]="FG">
            <div class="col-span-12 flex flex-col gap-1">
              <div>Meeting Title</div>
              <input
                type="text"
                pInputText
                formControlName="title"
                class="w-full"
                placeholder="e.g. Meeting HOD"
              />
            </div>
            <div class="col-span-6 flex flex-col gap-1">
              <div>Date</div>
              <p-datepicker
                [showIcon]="true"
                formControlName="meetingDate"
                appendTo="body"
                dateFormat="dd/mm/yy"
                placeholder="dd/mm/yyyy"
                inputStyleClass="w-full!"
                styleClass="w-full!"
              ></p-datepicker>
            </div>
            <div class="col-span-6 flex flex-col gap-1">
              <div>Time</div>
              <p-datepicker
                [showIcon]="true"
                formControlName="meetingTime"
                appendTo="body"
                [showTime]="true"
                [timeOnly]="true"
                hourFormat="24"
                placeholder="HH:mm"
                inputStyleClass="w-full!"
                styleClass="w-full!"
              ></p-datepicker>
            </div>

            <div class="col-span-12 flex flex-col gap-1">
              <div>Meeting Method</div>
              <p-select
                appendTo="body"
                styleClass="w-full!"
                formControlName="meetingMethod"
                [options]="[
                  { label: 'Face to Face', value: 'face-to-face' },
                  { label: 'Online', value: 'online' },
                ]"
              ></p-select>
            </div>
            <div
              class="col-span-12 flex flex-col gap-1"
              *ngIf="FG.get('meetingMethod')?.value === 'face-to-face'"
            >
              <div>Meeting Location</div>
              <input
                type="text"
                pInputText
                formControlName="location"
                class="w-full"
                placeholder="e.g. Meeting Room - Floor 2"
              />
            </div>
            <div
              class="col-span-12 flex flex-col gap-1"
              *ngIf="FG.get('meetingMethod')?.value === 'online'"
            >
              <div>Meeting Url</div>
              <input
                type="text"
                pInputText
                formControlName="meetingLink"
                class="w-full"
                placeholder="e.g. https://zooom.com/meeting"
              />
            </div>

            <div class="col-span-12 flex flex-col gap-1">
              <div>Add Participants</div>

              <p-multiselect
                appendTo="body"
                styleClass="w-full!"
                formControlName="participantIds"
                [options]="userSelection || []"
                [filter]="true"
                [maxSelectedLabels]="2"
                selectedItemsLabel="{0} participants selected"
              ></p-multiselect>

              <div class="flex flex-wrap gap-2 max-h-[80px] overflow-y-auto">
                <ng-container *ngFor="let user of selectedUsers">
                  <div
                    class="py-1 px-3 rounded-full bg-blue-100 text-blue-700 tracking-wide text-sm whitespace-nowrap"
                  >
                    {{ user.label }}
                  </div>
                </ng-container>
              </div>
            </div>

            <div class="col-span-12 flex flex-col gap-1">
              <div>Description</div>
              <textarea
                pTextarea
                formControlName="description"
                class="w-full"
                placeholder="Briefly describe the meeting..."
              ></textarea>
            </div>
          </div>

          <div
            class="flex flex-row items-center gap-2 border-t border-gray-200 pt-3 justify-end"
          >
            <p-button
              label="Cancel"
              severity="secondary"
              [text]="true"
              (onClick)="CloseDialog()"
            ></p-button>
            <p-button
              [label]="isUpdate ? 'Update' : 'Save'"
              severity="info"
              styleClass="tracking-wide! bg-blue-700! border-none! rounded-sm! py-2! px-5!"
              (onClick)="SaveMeeting()"
            ></p-button>
          </div>
        </div>
      </ng-template>
    </p-dialog>

    <p-dialog
      [(visible)]="cancelDialogVisible"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [closable]="false"
      [dismissableMask]="true"
      styleClass="cancel-dialog"
    >
      <ng-template #headless>
        <div class="p-6">
          <div class="flex justify-center mb-4">
            <div
              class="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center"
            >
              <i class="pi pi-exclamation-triangle text-red-500 text-2xl!"></i>
            </div>
          </div>

          <div class="text-center">
            <div class="text-lg font-semibold text-gray-800">
              Cancel Meeting?
            </div>

            <div class="mt-2 text-sm text-gray-500">
              Are you sure you want to cancel this meeting?
            </div>

            <div
              *ngIf="meetingToCancel"
              class="mt-3 px-4 py-3 bg-gray-50 rounded-md text-sm font-medium text-gray-700"
            >
              {{ meetingToCancel.title }}
            </div>
          </div>

          <div class="flex justify-center gap-2 mt-6">
            <p-button
              label="No, Keep It"
              severity="secondary"
              [text]="true"
              (onClick)="CloseCancelDialog()"
            ></p-button>

            <p-button
              label="Yes, Cancel"
              severity="danger"
              icon="pi pi-times"
              styleClass="rounded-sm!"
              (onClick)="ConfirmCancelMeeting()"
            ></p-button>
          </div>
        </div>
      </ng-template>
    </p-dialog>

    <p-dialog
      [(visible)]="moreMeetingsDialogVisible"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [dismissableMask]="true"
      [closeOnEscape]="true"
      styleClass="w-[60%]! lg:w-[40%]!"
    >
      <ng-template #headless>
        <div class="flex flex-col">
          <div class="px-6 pt-5 pb-4 border-b border-gray-100">
            <div class="flex items-start justify-between gap-4">
              <div>
                <div class="text-lg font-semibold text-gray-800">
                  {{ selectedDay?.fullDate | date: 'EEEE, d MMMM yyyy' }}
                </div>

                <div class="text-sm text-gray-400 mt-1">
                  {{ selectedDay?.meetings?.length || 0 }}
                  {{
                    selectedDay?.meetings?.length === 1 ? 'meeting' : 'meetings'
                  }}
                </div>
              </div>

              <div
                class="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center shrink-0"
              >
                <i class="pi pi-calendar text-blue-600"></i>
              </div>
            </div>
          </div>

          <div class="px-6 py-5">
            <div
              *ngIf="!selectedDay?.meetings?.length"
              class="flex flex-col items-center justify-center py-10 text-center"
            >
              <div
                class="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3"
              >
                <i class="pi pi-calendar-times text-gray-400 text-lg"></i>
              </div>

              <div class="text-sm font-medium text-gray-600">No meetings</div>

              <div class="text-xs text-gray-400 mt-1">
                There are no meetings scheduled for this day.
              </div>
            </div>

            <div
              *ngIf="selectedDay?.meetings?.length"
              class="flex flex-col gap-3"
            >
              <div
                *ngFor="let meeting of selectedDay?.meetings"
                class="
              group
              relative
              p-4
              rounded-lg
              border
              border-gray-100
              bg-white
              shadow-sm
              transition-all
              duration-150
              hover:border-gray-200
              hover:shadow-md
            "
                [class.bg-gray-50]="isMeetingPast(meeting)"
                [class.opacity-70]="isMeetingPast(meeting)"
              >
                <div
                  class="
                absolute
                left-0
                top-3
                bottom-3
                w-1
                rounded-r-full
              "
                  [ngClass]="{
                    'bg-gray-300': isMeetingPast(meeting),
                    'bg-blue-500': isMeetingNow(meeting),
                    'bg-indigo-500':
                      !isMeetingPast(meeting) && !isMeetingNow(meeting),
                  }"
                ></div>

                <div class="flex items-start justify-between gap-4 pl-2">
                  <div class="min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <i
                        class="pi pi-clock text-xs!"
                        [ngClass]="{
                          'text-gray-400': isMeetingPast(meeting),
                          'text-blue-500': isMeetingNow(meeting),
                          'text-indigo-500':
                            !isMeetingPast(meeting) && !isMeetingNow(meeting),
                        }"
                      ></i>

                      <span
                        class="text-xs font-semibold"
                        [ngClass]="{
                          'text-gray-400': isMeetingPast(meeting),
                          'text-gray-600': !isMeetingPast(meeting),
                        }"
                      >
                        {{ formatMeetingTime(meeting.meetingTime) }}
                      </span>
                    </div>

                    <div
                      class="font-semibold truncate"
                      [ngClass]="{
                        'text-gray-400 line-through': isMeetingPast(meeting),
                        'text-gray-800': !isMeetingPast(meeting),
                      }"
                    >
                      {{ meeting.title }}
                    </div>

                    <div
                      *ngIf="meeting.location || meeting.meetingLink"
                      class="flex items-center gap-2 mt-2 text-sm text-gray-400"
                    >
                      <i
                        class="pi"
                        [ngClass]="
                          meeting.meetingLink ? 'pi-video' : 'pi-map-marker'
                        "
                      ></i>

                      <span class="truncate">
                        {{
                          meeting.meetingLink
                            ? 'Online Meeting'
                            : meeting.location
                        }}
                      </span>
                    </div>
                  </div>

                  <div class="shrink-0">
                    <span
                      *ngIf="isMeetingPast(meeting)"
                      class="
                    inline-flex
                    items-center
                    gap-1
                    px-2
                    py-1
                    rounded-full
                    bg-gray-100
                    text-gray-400
                    text-[10px]
                    font-semibold
                  "
                    >
                      Completed
                    </span>

                    <span
                      *ngIf="isMeetingNow(meeting)"
                      class="
                    inline-flex
                    items-center
                    gap-1
                    px-2
                    py-1
                    rounded-full
                    bg-blue-50
                    text-blue-600
                    text-[10px]
                    font-semibold
                  "
                    >
                      <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      Now
                    </span>

                    <span
                      *ngIf="!isMeetingPast(meeting) && !isMeetingNow(meeting)"
                      class="
                    inline-flex
                    items-center
                    gap-1
                    px-2
                    py-1
                    rounded-full
                    bg-indigo-50
                    text-indigo-600
                    text-[10px]
                    font-semibold
                  "
                    >
                      Upcoming
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ng-template>
    </p-dialog>
  </div>`,
  styleUrl: './meeting.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Meeting implements OnInit, OnDestroy {
  private readonly loadingService = inject(LoadingService);
  private readonly meetingService = inject(MeetingService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messageService = inject(MessageService);
  private readonly userService = inject(UserService);
  private timeRefreshInterval?: ReturnType<typeof setInterval>;

  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  PagingSignal = signal<PagingContent<MeetingDto>>(
    {} as PagingContent<MeetingDto>,
  );
  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  search: string = '';
  dialogVisible: boolean = false;
  isUpdate: boolean = false;
  cancelDialogVisible: boolean = false;
  moreMeetingsDialogVisible = false;

  meetingToCancel: MeetingDto | null = null;
  selectedDay: CalendarDay | null = null;

  FG!: FormGroup;

  userSelection: any;
  selectedUsers: any[] = [];

  dayNames: string[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  currentDate: Date = new Date();

  calendarDays: CalendarDay[] = [];

  currentUserId = this.userService.currentUser?.userId;

  get currentMonthName(): string {
    return this.currentDate.toLocaleDateString('en-US', {
      month: 'long',
    });
  }

  get currentYear(): number {
    return this.currentDate.getFullYear();
  }

  isOrganizer(meeting: MeetingDto): boolean {
    return meeting.organizerId === this.currentUserId;
  }

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 1000000;
    this.Query.Select = null;
    this.Query.OrderBy = null;
    this.Query.Filter = null;
    this.Query.Includes = null;
  }

  ngOnInit(): void {
    this.initForm();

    this.generateCalendar();

    this.FG.get('participantIds')
      ?.valueChanges.pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((value: string[]) => {
        if (!this.userSelection) {
          this.selectedUsers = [];
          return;
        }

        this.selectedUsers = this.userSelection.filter((user: any) =>
          value?.includes(user.value),
        );
      });

    this.GetData();

    this.timeRefreshInterval = setInterval(() => {
      this.cdr.markForCheck();
    }, 30000);
  }

  initForm() {
    this.FG = new FormGroup({
      id: new FormControl<string | null>({ value: null, disabled: true }),
      title: new FormControl<string | null>(null, Validators.required),
      description: new FormControl<string | null>(null),
      meetingDate: new FormControl<Date | null>(null, Validators.required),
      meetingTime: new FormControl<Date | null>(null, Validators.required),
      location: new FormControl<string | null>(null),
      meetingLink: new FormControl<string | null>(null),
      meetingMethod: new FormControl<string | null>('face-to-face'),
      reminderMinutes: new FormControl<number | null>(30, Validators.required),
      participantIds: new FormControl<string[] | null>([], Validators.required),
    });
  }

  OpenDialog(): void {
    this.isUpdate = false;

    this.FG.reset();

    this.FG.patchValue({
      reminderMinutes: 30,
      meetingMethod: 'face-to-face',
      participantIds: [],
    });

    this.selectedUsers = [];

    this.dialogVisible = true;

    this.getUserSelection();
  }

  getUserSelection() {
    this.meetingService
      .GetDropdown()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.userSelection = res.users.map((user: any) => ({
            label: user.name,
            value: user.id,
          }));
        },
      });
  }

  CloseDialog() {
    this.dialogVisible = false;
  }

  SaveMeeting(): void {
    if (this.FG.invalid) {
      this.FG.markAllAsTouched();
      return;
    }

    const formValue = this.FG.getRawValue();

    const time = formValue.meetingTime;

    const meetingTime = time
      ? `${String(time.getHours()).padStart(2, '0')}:${String(
          time.getMinutes(),
        ).padStart(2, '0')}:00`
      : null;

    const request = {
      ...formValue,
      meetingTime,
      participantIds: formValue.participantIds || [],
    };

    this.loadingService.start();

    const request$ = this.isUpdate
      ? this.meetingService.Update(request)
      : this.meetingService.Create(request);

    request$.pipe(takeUntil(this.ngUnsubscribe)).subscribe({
      next: (res) => {
        const currentData = this.PagingSignal();

        if (this.isUpdate) {
          const updatedData = (currentData.data || []).map(
            (meeting: MeetingDto) => (meeting.id === res.id ? res : meeting),
          );

          this.PagingSignal.set({
            ...currentData,
            data: updatedData,
          });

          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Meeting updated successfully!',
          });
        } else {
          this.PagingSignal.set({
            ...currentData,
            data: [res, ...(currentData.data || [])],
            totalElements: (currentData.totalElements || 0) + 1,
          });

          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Meeting created successfully!',
          });
        }

        this.generateCalendar();

        this.dialogVisible = false;

        const reminderMinutes = this.FG.get('reminderMinutes')?.value;

        this.FG.reset();

        this.FG.patchValue({
          reminderMinutes,
          meetingMethod: 'face-to-face',
          participantIds: [],
        });

        this.isUpdate = false;
        this.selectedUsers = [];

        this.cdr.markForCheck();
      },

      error: (err) => {
        console.error(
          this.isUpdate ? 'Error updating meeting:' : 'Error saving meeting:',
          err,
        );

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail:
            err?.error?.Error ||
            (this.isUpdate
              ? 'Failed to update meeting.'
              : 'Failed to create meeting.'),
        });

        this.loadingService.stop();
      },

      complete: () => {
        this.loadingService.stop();
      },
    });
  }

  GetData() {
    this.loadingService.start();

    this.meetingService
      .GetMany(this.Query)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (response) => {
          this.PagingSignal.set(response);

          this.generateCalendar();

          this.cdr.markForCheck();
        },

        error: (error) => {
          console.error('Error fetching data:', error);
        },

        complete: () => {
          this.loadingService.stop();
        },
      });
  }

  generateCalendar(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);

    // Convert Sunday = 0 to Monday = 0
    const firstDayIndex = (firstDayOfMonth.getDay() + 6) % 7;

    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();

    const daysInPreviousMonth = new Date(year, month, 0).getDate();

    const days: CalendarDay[] = [];

    // Previous month days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dateNumber = daysInPreviousMonth - i;

      const date = new Date(year, month - 1, dateNumber);

      days.push({
        date: dateNumber,
        fullDate: date,
        isCurrentMonth: false,
        isToday: false,
        meetings: this.getMeetingsForDate(date),
      });
    }

    // Current month
    for (let dateNumber = 1; dateNumber <= daysInCurrentMonth; dateNumber++) {
      const date = new Date(year, month, dateNumber);

      days.push({
        date: dateNumber,
        fullDate: date,
        isCurrentMonth: true,
        isToday: this.isToday(date),
        meetings: this.getMeetingsForDate(date),
      });
    }

    // Next month
    let nextMonthDate = 1;

    while (days.length < 35) {
      const date = new Date(year, month + 1, nextMonthDate);

      days.push({
        date: nextMonthDate,
        fullDate: date,
        isCurrentMonth: false,
        isToday: false,
        meetings: this.getMeetingsForDate(date),
      });

      nextMonthDate++;
    }

    // Some months need 42 cells
    if (days.length > 35) {
      while (days.length < 42) {
        const date = new Date(year, month + 1, nextMonthDate);

        days.push({
          date: nextMonthDate,
          fullDate: date,
          isCurrentMonth: false,
          isToday: false,
          meetings: this.getMeetingsForDate(date),
        });

        nextMonthDate++;
      }
    }

    this.calendarDays = days;
  }

  getMeetingsForDate(date: Date): MeetingDto[] {
    const meetings = this.PagingSignal().data || [];

    return meetings.filter((meeting) => {
      if (!meeting.meetingDate) {
        return false;
      }

      const meetingDate = new Date(meeting.meetingDate);

      return (
        meetingDate.getFullYear() === date.getFullYear() &&
        meetingDate.getMonth() === date.getMonth() &&
        meetingDate.getDate() === date.getDate()
      );
    });
  }

  isToday(date: Date): boolean {
    const today = new Date();

    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  }

  previousMonth(): void {
    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() - 1,
      1,
    );

    this.generateCalendar();
    this.cdr.markForCheck();
  }

  nextMonth(): void {
    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() + 1,
      1,
    );

    this.generateCalendar();
    this.cdr.markForCheck();
  }

  goToToday(): void {
    this.currentDate = new Date();

    this.generateCalendar();
    this.cdr.markForCheck();
  }

  formatMeetingTime(time: string | null | undefined): string {
    if (!time) {
      return '';
    }

    const parts = time.split(':');

    if (parts.length < 2) {
      return time;
    }

    let hour = Number(parts[0]);
    const minute = parts[1];

    const suffix = hour >= 12 ? 'PM' : 'AM';

    hour = hour % 12;

    if (hour === 0) {
      hour = 12;
    }

    return `${hour}:${minute} ${suffix}`;
  }

  formatMeetingDate(date: string | Date): string {
    const value = new Date(date);

    return value.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  getMeetingTaskClass(meeting: MeetingDto): string {
    const title = meeting.title?.toLowerCase() || '';

    if (title.includes('project') || title.includes('review')) {
      return 'task--warning';
    }

    if (title.includes('design') || title.includes('sprint')) {
      return 'task--danger';
    }

    if (title.includes('product') || title.includes('checkup')) {
      return 'task--info';
    }

    return 'task--primary';
  }

  getVisibleMeetings(meetings: MeetingDto[]): MeetingDto[] {
    if (!meetings?.length) {
      return [];
    }

    const sortedMeetings = [...meetings].sort((a, b) =>
      this.compareMeetingTime(a, b),
    );

    const today = new Date();

    const isToday = meetings.some((meeting) => {
      if (!meeting.meetingDate) {
        return false;
      }

      const meetingDate = new Date(meeting.meetingDate);

      return (
        meetingDate.getFullYear() === today.getFullYear() &&
        meetingDate.getMonth() === today.getMonth() &&
        meetingDate.getDate() === today.getDate()
      );
    });

    if (!isToday) {
      return sortedMeetings.slice(0, 2);
    }

    const currentMeeting = sortedMeetings.find((meeting) =>
      this.isMeetingNow(meeting),
    );

    if (currentMeeting) {
      const upcoming = sortedMeetings.filter(
        (meeting) =>
          meeting.id !== currentMeeting.id && !this.isMeetingPast(meeting),
      );

      return [currentMeeting, ...upcoming].slice(0, 2);
    }

    const upcomingMeetings = sortedMeetings.filter(
      (meeting) => !this.isMeetingPast(meeting),
    );

    if (upcomingMeetings.length > 0) {
      return upcomingMeetings.slice(0, 2);
    }

    return sortedMeetings.slice(-2);
  }

  private compareMeetingTime(a: MeetingDto, b: MeetingDto): number {
    const timeA = this.getMeetingDateTime(a)?.getTime() ?? 0;
    const timeB = this.getMeetingDateTime(b)?.getTime() ?? 0;

    return timeA - timeB;
  }

  private getMeetingDateTime(meeting: MeetingDto): Date | null {
    if (!meeting.meetingDate) {
      return null;
    }

    const date = new Date(meeting.meetingDate);

    if (meeting.meetingTime) {
      const [hours, minutes] = meeting.meetingTime
        .toString()
        .split(':')
        .map(Number);

      date.setHours(hours || 0, minutes || 0, 0, 0);
    } else {
      date.setHours(0, 0, 0, 0);
    }

    return date;
  }

  isMeetingNow(meeting: MeetingDto): boolean {
    if (!meeting.meetingDate || !meeting.meetingTime) {
      return false;
    }

    const meetingDate = new Date(meeting.meetingDate);

    const [hours, minutes] = meeting.meetingTime
      .toString()
      .split(':')
      .map(Number);

    meetingDate.setHours(hours, minutes, 0, 0);

    const now = new Date();

    const start = meetingDate.getTime();
    const end = start + 60 * 60 * 1000;

    return now.getTime() >= start && now.getTime() < end;
  }

  isMeetingPast(meeting: MeetingDto): boolean {
    if (!meeting.meetingDate || !meeting.meetingTime) {
      return false;
    }

    const meetingDate = new Date(meeting.meetingDate);

    const [hours, minutes] = meeting.meetingTime
      .toString()
      .split(':')
      .map(Number);

    meetingDate.setHours(hours, minutes, 0, 0);

    const meetingEnd = meetingDate.getTime() + 60 * 60 * 1000;

    console.log(new Date().getTime() >= meetingEnd);

    return new Date().getTime() >= meetingEnd;
  }

  showMoreMeetings(day: CalendarDay): void {
    this.selectedDay = {
      ...day,
      meetings: [...day.meetings].sort((a, b) => this.compareMeetingTime(a, b)),
    };

    this.moreMeetingsDialogVisible = true;
  }

  getMoreMeetingsCount(day: CalendarDay): number {
    const visibleCount = this.getVisibleMeetings(day.meetings).length;

    return Math.max(day.meetings.length - visibleCount, 0);
  }

  EditMeeting(meeting: MeetingDto): void {
    if (!this.isOrganizer(meeting)) {
      return;
    }

    this.isUpdate = true;

    this.getUserSelection();

    const meetingDate = meeting.meetingDate
      ? new Date(meeting.meetingDate)
      : null;

    let meetingTime: Date | null = null;

    if (meeting.meetingTime) {
      const [hours, minutes] = meeting.meetingTime
        .toString()
        .split(':')
        .map(Number);

      meetingTime = new Date();
      meetingTime.setHours(hours, minutes, 0, 0);
    }

    const participantIds =
      meeting.participants?.map((x: any) => x.userId) || [];

    this.FG.patchValue({
      id: meeting.id,
      title: meeting.title,
      description: meeting.description,
      meetingDate: meetingDate,
      meetingTime: meetingTime,
      location: meeting.location,
      meetingLink: meeting.meetingLink,
      meetingMethod: meeting.meetingLink ? 'online' : 'face-to-face',
      reminderMinutes: meeting.reminderMinutes ?? 30,
      participantIds: participantIds,
    });

    this.dialogVisible = true;

    this.cdr.markForCheck();
  }

  CancelMeeting(meeting: MeetingDto): void {
    if (!this.isOrganizer(meeting)) {
      return;
    }

    this.meetingToCancel = meeting;
    this.cancelDialogVisible = true;
  }

  ConfirmCancelMeeting(): void {
    if (!this.meetingToCancel) {
      return;
    }

    const meeting = this.meetingToCancel;

    this.loadingService.start();

    this.meetingService
      .Cancel(meeting.id)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: () => {
          const currentData = this.PagingSignal();

          const updatedData = (currentData.data || []).filter(
            (item: MeetingDto) => item.id !== meeting.id,
          );

          this.PagingSignal.set({
            ...currentData,
            data: updatedData,
            totalElements: Math.max((currentData.totalElements || 0) - 1, 0),
          });

          this.generateCalendar();

          this.messageService.add({
            severity: 'success',
            summary: 'Meeting Cancelled',
            detail: 'The meeting has been cancelled successfully.',
          });

          this.cancelDialogVisible = false;
          this.meetingToCancel = null;

          this.cdr.markForCheck();
        },

        error: (err) => {
          console.error('Error cancelling meeting:', err);

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err?.error?.Error || 'Failed to cancel meeting.',
          });

          this.loadingService.stop();
        },

        complete: () => {
          this.loadingService.stop();
        },
      });
  }

  CloseCancelDialog(): void {
    this.cancelDialogVisible = false;
    this.meetingToCancel = null;
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    if (this.timeRefreshInterval) {
      clearInterval(this.timeRefreshInterval);
    }

    this.loadingService.stop();
  }
}
