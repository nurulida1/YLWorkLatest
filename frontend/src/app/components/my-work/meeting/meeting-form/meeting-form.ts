import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { MultiSelectModule } from 'primeng/multiselect';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';

import { Subject, takeUntil, finalize } from 'rxjs';

import { LoadingService } from '../../../../services/loading.service';
import { MeetingService } from '../../../../services/MeetingService';
import { UserService } from '../../../../services/userService.service';

@Component({
  selector: 'app-meeting-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    DatePickerModule,
    MultiSelectModule,
    TextareaModule,
    SelectModule,
  ],
  template: `
    <div class="meeting-form-page">
      <div class="meeting-form-container">
        <!-- Breadcrumb -->
        <div class="breadcrumb">
          <a routerLink="/dashboard">Dashboard</a>
          <i class="pi pi-chevron-right"></i>
          <a routerLink="/meeting">Upcoming Meetings</a>
          <i class="pi pi-chevron-right"></i>
          <span>New Meeting</span>
        </div>

        <!-- Page Header -->
        <div class="page-header">
          <div class="page-heading">
            <div class="page-icon">
              <i class="pi pi-calendar-plus"></i>
            </div>

            <div>
              <h1>New Meeting</h1>
              <p>Schedule a meeting and invite your colleagues.</p>
            </div>
          </div>

          <a routerLink="/meeting" class="back-button">
            <i class="pi pi-arrow-left"></i>
            <span>Back to Meetings</span>
          </a>
        </div>

        <!-- Form -->
        <form [formGroup]="FG" (ngSubmit)="SaveMeeting()">
          <!-- Meeting Details -->
          <section class="form-card">
            <div class="section-heading">
              <div class="section-icon">
                <i class="pi pi-calendar"></i>
              </div>

              <div>
                <h2>Meeting Details</h2>
                <p>Enter the basic information for your meeting.</p>
              </div>
            </div>

            <div class="form-grid">
              <!-- Meeting Title -->
              <div class="form-field full-width">
                <label for="title">
                  Meeting Title <span class="required">*</span>
                </label>

                <input
                  id="title"
                  type="text"
                  pInputText
                  formControlName="title"
                  placeholder="e.g. Weekly Department Meeting"
                  class="w-full"
                />

                <small
                  class="error-message"
                  *ngIf="
                    FG.get('title')?.touched &&
                    FG.get('title')?.hasError('required')
                  "
                >
                  Meeting title is required.
                </small>
              </div>

              <!-- Date -->
              <div class="form-field">
                <label for="meetingDate">
                  Meeting Date <span class="required">*</span>
                </label>

                <p-datepicker
                  inputId="meetingDate"
                  formControlName="meetingDate"
                  [showIcon]="true"
                  [showButtonBar]="true"
                  appendTo="body"
                  dateFormat="dd/mm/yy"
                  placeholder="Select meeting date"
                  styleClass="w-full"
                  inputStyleClass="w-full"
                ></p-datepicker>

                <small
                  class="error-message"
                  *ngIf="
                    FG.get('meetingDate')?.touched &&
                    FG.get('meetingDate')?.hasError('required')
                  "
                >
                  Meeting date is required.
                </small>
              </div>

              <!-- Time -->
              <div class="form-field">
                <label for="meetingTime">
                  Meeting Time <span class="required">*</span>
                </label>

                <p-datepicker
                  inputId="meetingTime"
                  formControlName="meetingTime"
                  [showIcon]="true"
                  [timeOnly]="true"
                  [showTime]="true"
                  hourFormat="24"
                  appendTo="body"
                  placeholder="Select meeting time"
                  styleClass="w-full"
                  inputStyleClass="w-full"
                ></p-datepicker>

                <small
                  class="error-message"
                  *ngIf="
                    FG.get('meetingTime')?.touched &&
                    FG.get('meetingTime')?.hasError('required')
                  "
                >
                  Meeting time is required.
                </small>
              </div>

              <!-- Meeting Method -->
              <div class="form-field full-width">
                <label for="meetingMethod">
                  Meeting Method <span class="required">*</span>
                </label>

                <p-select
                  inputId="meetingMethod"
                  formControlName="meetingMethod"
                  [options]="meetingMethodOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select meeting method"
                  appendTo="body"
                  styleClass="w-full"
                ></p-select>
              </div>

              <!-- Physical Location -->
              <div
                class="form-field full-width"
                *ngIf="FG.get('meetingMethod')?.value === 'face-to-face'"
              >
                <label for="location">
                  Meeting Location <span class="required">*</span>
                </label>

                <input
                  id="location"
                  type="text"
                  pInputText
                  formControlName="location"
                  placeholder="e.g. Meeting Room - Floor 2"
                  class="w-full"
                />

                <small
                  class="error-message"
                  *ngIf="
                    FG.get('location')?.touched &&
                    FG.get('location')?.hasError('required')
                  "
                >
                  Meeting location is required.
                </small>
              </div>

              <!-- Online Meeting Link -->
              <div
                class="form-field full-width"
                *ngIf="FG.get('meetingMethod')?.value === 'online'"
              >
                <label for="meetingLink">
                  Meeting URL <span class="required">*</span>
                </label>

                <input
                  id="meetingLink"
                  type="url"
                  pInputText
                  formControlName="meetingLink"
                  placeholder="https://example.com/meeting"
                  class="w-full"
                />

                <small
                  class="error-message"
                  *ngIf="
                    FG.get('meetingLink')?.touched &&
                    FG.get('meetingLink')?.hasError('required')
                  "
                >
                  Meeting URL is required.
                </small>

                <small
                  class="error-message"
                  *ngIf="
                    FG.get('meetingLink')?.touched &&
                    FG.get('meetingLink')?.hasError('pattern')
                  "
                >
                  Please enter a valid URL beginning with http:// or https://.
                </small>
              </div>
            </div>
          </section>

          <!-- Participants -->
          <section class="form-card">
            <div class="section-heading">
              <div class="section-icon participants-icon">
                <i class="pi pi-users"></i>
              </div>

              <div>
                <h2>Participants</h2>
                <p>Select colleagues who should attend this meeting.</p>
              </div>
            </div>

            <div class="form-field">
              <label for="participantIds">
                Add Participants <span class="required">*</span>
              </label>

              <p-multiselect
                inputId="participantIds"
                formControlName="participantIds"
                [options]="userSelection"
                optionLabel="label"
                optionValue="value"
                [filter]="true"
                [showClear]="true"
                [maxSelectedLabels]="2"
                selectedItemsLabel="{0} participants selected"
                placeholder="Search and select participants"
                appendTo="body"
                styleClass="w-full"
              ></p-multiselect>

              <small
                class="error-message"
                *ngIf="
                  FG.get('participantIds')?.touched &&
                  FG.get('participantIds')?.hasError('required')
                "
              >
                Please select at least one participant.
              </small>

              <div
                class="selected-participants"
                *ngIf="selectedUsers.length > 0"
              >
                <div class="selected-heading">
                  Selected participants
                  <span>{{ selectedUsers.length }}</span>
                </div>

                <div class="participant-list">
                  <div
                    class="participant-chip"
                    *ngFor="let user of selectedUsers"
                  >
                    <i class="pi pi-user"></i>
                    {{ user.label }}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Description -->
          <section class="form-card">
            <div class="section-heading">
              <div class="section-icon description-icon">
                <i class="pi pi-align-left"></i>
              </div>

              <div>
                <h2>Additional Information</h2>
                <p>Provide more details about the meeting.</p>
              </div>
            </div>

            <div class="form-field">
              <label for="description">Description</label>

              <textarea
                id="description"
                pTextarea
                formControlName="description"
                [autoResize]="true"
                rows="5"
                placeholder="Briefly describe the meeting agenda, objectives or other important information..."
                class="w-full"
              ></textarea>
            </div>
          </section>

          <!-- Form Actions -->
          <div class="form-actions">
            <a routerLink="/meeting" class="cancel-button"> Cancel </a>

            <p-button
              type="submit"
              label="Create Meeting"
              icon="pi pi-calendar"
              [disabled]="isSubmitting"
              styleClass="submit-button"
            ></p-button>
          </div>
        </form>
      </div>
    </div>
  `,
  styleUrl: './meeting-form.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeetingForm implements OnInit, OnDestroy {
  private readonly loadingService = inject(LoadingService);
  private readonly meetingService = inject(MeetingService);
  private readonly userService = inject(UserService);
  private readonly messageService = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  private readonly ngUnsubscribe = new Subject<void>();

  FG!: FormGroup;

  userSelection: any[] = [];
  selectedUsers: any[] = [];

  isSubmitting = false;

  meetingMethodOptions = [
    { label: 'Face to Face', value: 'face-to-face' },
    { label: 'Online Meeting', value: 'online' },
  ];

  ngOnInit(): void {
    this.initForm();
    this.getUserSelection();

    this.FG.get('participantIds')
      ?.valueChanges.pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((value: string[] | null) => {
        const selectedIds = value || [];

        this.selectedUsers = this.userSelection.filter((user) =>
          selectedIds.includes(user.value),
        );

        this.cdr.markForCheck();
      });

    this.FG.get('meetingMethod')
      ?.valueChanges.pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((method: string) => {
        this.updateMeetingMethodValidators(method);
      });
  }

  initForm(): void {
    this.FG = new FormGroup({
      title: new FormControl<string | null>(null, Validators.required),

      description: new FormControl<string | null>(null),

      meetingDate: new FormControl<Date | null>(null, Validators.required),

      meetingTime: new FormControl<Date | null>(null, Validators.required),

      location: new FormControl<string | null>(null, Validators.required),

      meetingLink: new FormControl<string | null>(null),

      meetingMethod: new FormControl<string>(
        'face-to-face',
        Validators.required,
      ),

      reminderMinutes: new FormControl<number>(30, Validators.required),

      participantIds: new FormControl<string[]>([], Validators.required),
    });
  }

  updateMeetingMethodValidators(method: string): void {
    const locationControl = this.FG.get('location');
    const linkControl = this.FG.get('meetingLink');

    if (method === 'face-to-face') {
      locationControl?.setValidators([Validators.required]);

      linkControl?.clearValidators();
      linkControl?.setValue(null);
    } else {
      locationControl?.clearValidators();
      locationControl?.setValue(null);

      linkControl?.setValidators([
        Validators.required,
        Validators.pattern(/^https?:\/\/.+/i),
      ]);
    }

    locationControl?.updateValueAndValidity({ emitEvent: false });
    linkControl?.updateValueAndValidity({ emitEvent: false });

    this.cdr.markForCheck();
  }

  getUserSelection(): void {
    this.meetingService
      .GetDropdown()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.userSelection = (res.users || []).map((user: any) => ({
            label: user.name,
            value: user.id,
          }));

          this.cdr.markForCheck();
        },

        error: (err) => {
          console.error('Error loading participants:', err);

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load participants.',
          });
        },
      });
  }

  SaveMeeting(): void {
    if (this.isSubmitting) {
      return;
    }

    if (this.FG.invalid) {
      this.FG.markAllAsTouched();

      this.messageService.add({
        severity: 'warn',
        summary: 'Incomplete Form',
        detail: 'Please complete all required fields.',
      });

      return;
    }

    const formValue = this.FG.getRawValue();

    const time: Date | null = formValue.meetingTime;

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

    this.isSubmitting = true;
    this.loadingService.start();
    this.cdr.markForCheck();

    this.meetingService
      .Create(request)
      .pipe(
        takeUntil(this.ngUnsubscribe),
        finalize(() => {
          this.isSubmitting = false;
          this.loadingService.stop();
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Meeting created successfully!',
          });

          this.FG.reset({
            title: null,
            description: null,
            meetingDate: null,
            meetingTime: null,
            location: null,
            meetingLink: null,
            meetingMethod: 'face-to-face',
            reminderMinutes: 30,
            participantIds: [],
          });

          this.selectedUsers = [];
          this.cdr.markForCheck();

          this.router.navigate(['/meeting']);
        },

        error: (err) => {
          console.error('Error creating meeting:', err);

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail:
              err?.error?.Error ||
              err?.error?.message ||
              'Failed to create meeting. Please try again.',
          });
        },
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
