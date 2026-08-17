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
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { LoadingService } from '../../services/loading.service';
import { StaffTaskService } from '../../services/staffTaskService';
import { MessageService } from 'primeng/api';
import { map, Subject, switchMap, takeUntil, tap } from 'rxjs';
import {
  GridifyQueryExtend,
  PagingContent,
} from '../../shared/helpers/helpers';
import { StaffTask } from '../../models/StaffTask';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { UserService } from '../../services/userService.service';
import { CheckboxModule } from 'primeng/checkbox';

@Component({
  selector: 'app-staff-tasks',
  imports: [
    CommonModule,
    RouterLink,
    TableModule,
    InputTextModule,
    ReactiveFormsModule,
    ButtonModule,
    DatePickerModule,
    SelectModule,
    DialogModule,
    TextareaModule,
    CheckboxModule,
  ],
  template: `<div class="w-full min-h-[92.9vh] flex flex-col p-5">
      <div class="flex flex-row items-center gap-1 text-gray-500 tracking-wide">
        <div
          [routerLink]="'/dashboard'"
          class="cursor-pointer hover:text-gray-600"
        >
          Dashboard
        </div>

        <i class="pi pi-chevron-right text-[8px]! text-gray-400!"></i>

        <div class="text-gray-700 font-semibold">Tasks</div>
      </div>

      <div class="mt-4 flex flex-row items-center justify-between">
        <div>
          <div class="text-[22px] text-gray-800 font-semibold">Staff Tasks</div>

          <div class="mt-1 text-sm text-gray-400">
            Create, assign and track tasks for yourself or other staff.
          </div>
        </div>

        <p-button
          label="New Task"
          icon="pi pi-plus"
          severity="info"
          styleClass="tracking-wide! bg-blue-700! border-none! rounded-sm! py-2! px-5!"
          (onClick)="OpenTaskDialog()"
        >
        </p-button>
      </div>

      <div class="grid grid-cols-4 gap-4 mt-3">
        <div
          class="bg-white border border-gray-100 rounded-lg p-4 shadow-sm h-25"
        >
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm text-gray-400">My Tasks</div>

              <div class="text-3xl font-semibold text-gray-800 mt-1">
                {{ summaryCount?.myTasks }}
              </div>
            </div>

            <div
              class="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center"
            >
              <i class="pi pi-user text-blue-600"></i>
            </div>
          </div>
        </div>

        <div
          class="bg-white border border-gray-100 rounded-lg p-4 shadow-sm h-25"
        >
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm text-gray-400">Assigned to Others</div>

              <div class="text-3xl font-semibold text-gray-800 mt-1">
                {{ summaryCount?.assignedToOthers }}
              </div>
            </div>

            <div
              class="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center"
            >
              <i class="pi pi-users text-indigo-600"></i>
            </div>
          </div>
        </div>

        <div
          class="bg-white border border-gray-100 rounded-lg p-4 shadow-sm h-25"
        >
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm text-gray-400">In Progress</div>

              <div class="text-3xl font-semibold text-gray-800 mt-1">
                {{ summaryCount?.inProgress }}
              </div>
            </div>

            <div
              class="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center"
            >
              <i class="pi pi-spinner text-amber-600"></i>
            </div>
          </div>
        </div>

        <div
          class="bg-white border border-gray-100 rounded-lg p-4 shadow-sm h-25"
        >
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm text-gray-400">Completed</div>

              <div class="text-3xl font-semibold text-gray-800 mt-1">
                {{ summaryCount?.completed }}
              </div>
            </div>

            <div
              class="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center"
            >
              <i class="pi pi-check-circle text-green-600"></i>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-6 bg-white border border-gray-100 rounded-lg shadow-sm">
        <div class="task-list-card">
          <div class="task-list-header">
            <div class="task-list-heading">
              <div class="task-list-title">
                <div class="task-list-title-icon">
                  <i class="pi pi-list-check"></i>
                </div>

                <div>
                  <div class="task-list-title-text">Task List</div>

                  <div class="task-list-description">
                    Manage your tasks and tasks assigned to other staff.
                  </div>
                </div>
              </div>
            </div>

            <div class="task-list-actions">
              <div class="task-search">
                <i class="pi pi-search"></i>

                <input
                  pInputText
                  type="text"
                  placeholder="Search tasks..."
                  class="task-search-input"
                />
              </div>

              <button type="button" class="task-toolbar-button">
                <i class="pi pi-filter"></i>
                <span>Filter</span>
              </button>

              <button
                type="button"
                class="task-toolbar-button"
                (click)="GetData()"
              >
                <i class="pi pi-refresh"></i>
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <div class="task-list-content">
            <ng-container *ngIf="PagingSignal().totalElements === 0">
              <div class="task-empty-state flex flex-col gap-2">
                <div class="task-empty-icon">
                  <i class="pi pi-check-square"></i>
                </div>

                <div class="task-empty-title">No tasks found</div>

                <div class="task-empty-description">
                  There are currently no tasks available. Create a new task to
                  get started.
                </div>
              </div>
            </ng-container>

            <ng-container *ngIf="PagingSignal().totalElements > 0">
              <div class="task-items">
                <div
                  *ngFor="let task of PagingSignal().data; let i = index"
                  class="task-item"
                  [style.animation-delay]="i * 50 + 'ms'"
                  (click)="editTask(task)"
                >
                  <div
                    class="task-priority-line"
                    [ngClass]="{
                      'priority-low': task.priority === 'Low',

                      'priority-medium': task.priority === 'Medium',

                      'priority-high': task.priority === 'High',

                      'priority-critical': task.priority === 'Critical',
                    }"
                  ></div>

                  <div
                    class="task-status-icon"
                    [ngClass]="{
                      'status-not-started': task.status === 'NotStarted',

                      'status-in-progress': task.status === 'InProgress',

                      'status-on-hold': task.status === 'OnHold',

                      'status-review': task.status === 'Review',

                      'status-completed': task.status === 'Completed',

                      'status-cancelled': task.status === 'Cancelled',
                    }"
                  >
                    <i
                      [ngClass]="{
                        'pi pi-circle': task.status === 'NotStarted',

                        'pi pi-spinner': task.status === 'InProgress',

                        'pi pi-pause': task.status === 'OnHold',

                        'pi pi-eye': task.status === 'Review',

                        'pi pi-check': task.status === 'Completed',

                        'pi pi-times': task.status === 'Cancelled',
                      }"
                    ></i>
                  </div>
                  <div class="task-information">
                    <div class="task-title-row">
                      <div
                        class="task-title"
                        [class.task-title-completed]="
                          task.status === 'Completed'
                        "
                      >
                        {{ task.title }}
                      </div>

                      <span
                        class="task-priority-badge"
                        [ngClass]="{
                          'priority-badge-low': task.priority === 'Low',

                          'priority-badge-medium': task.priority === 'Medium',

                          'priority-badge-high': task.priority === 'High',

                          'priority-badge-critical':
                            task.priority === 'Critical',
                        }"
                      >
                        {{ task.priority }}
                      </span>
                    </div>

                    <div *ngIf="task.description" class="task-description">
                      {{ task.description }}
                    </div>

                    <div class="task-meta">
                      <div class="task-meta-item">
                        <div class="task-avatar">
                          {{
                            task.assignedTo?.fullName
                              ? task.assignedTo.fullName.charAt(0).toUpperCase()
                              : 'ME'
                          }}
                        </div>

                        <span>
                          {{ task.assignedTo?.fullName || 'Own Task' }}
                        </span>
                      </div>

                      <span class="task-meta-divider"></span>

                      <div class="task-meta-item">
                        <i class="pi pi-calendar"></i>

                        <span [class.task-overdue]="isTaskOverdue(task)">
                          {{
                            task.dueDate
                              ? (task.dueDate | date: 'dd MMM yyyy')
                              : 'No due date'
                          }}
                        </span>
                      </div>

                      <ng-container
                        *ngIf="task.checklists && task.checklists.length > 0"
                      >
                        <span class="task-meta-divider"></span>

                        <div class="task-meta-item">
                          <i class="pi pi-check-square"></i>

                          <span>
                            {{ getCompletedChecklistCount(task) }}/{{
                              task.checklists.length
                            }}
                          </span>
                        </div>
                      </ng-container>

                      <ng-container *ngIf="task.estimatedHours">
                        <span class="task-meta-divider"></span>

                        <div class="task-meta-item">
                          <i class="pi pi-clock"></i>

                          <span> {{ task.estimatedHours }}h </span>
                        </div>
                      </ng-container>
                    </div>
                  </div>
                  <div class="task-status-wrapper">
                    <span
                      class="task-status-badge"
                      [ngClass]="{
                        'task-status-not-started': task.status === 'NotStarted',

                        'task-status-in-progress': task.status === 'InProgress',

                        'task-status-on-hold': task.status === 'OnHold',

                        'task-status-review': task.status === 'Review',

                        'task-status-completed': task.status === 'Completed',

                        'task-status-cancelled': task.status === 'Cancelled',
                      }"
                    >
                      <span class="status-dot"></span>

                      {{
                        task.status === 'NotStarted'
                          ? 'Not Started'
                          : task.status === 'InProgress'
                            ? 'In Progress'
                            : task.status === 'OnHold'
                              ? 'On Hold'
                              : task.status === 'Review'
                                ? 'Review'
                                : task.status === 'Completed'
                                  ? 'Completed'
                                  : task.status === 'Cancelled'
                                    ? 'Cancelled'
                                    : task.status
                      }}
                    </span>
                  </div>
                  <div class="task-action">
                    <button
                      type="button"
                      class="task-action-button"
                      (click)="$event.stopPropagation(); editTask(task)"
                    >
                      <i class="pi pi-chevron-right"></i>
                    </button>
                  </div>
                </div>
              </div>
            </ng-container>
          </div>
          <div
            class="task-list-footer"
            *ngIf="PagingSignal().totalElements > 0"
          >
            <div class="task-count">
              <i class="pi pi-list"></i>

              Showing
              <strong>
                {{ PagingSignal().data?.length || 0 }}
              </strong>

              of

              <strong>
                {{ PagingSignal().totalElements }}
              </strong>

              tasks
            </div>

            <div class="task-footer-hint">
              <i class="pi pi-info-circle"></i>
              Click a task to view or edit
            </div>
          </div>
        </div>
      </div>
    </div>

    <p-dialog
      [(visible)]="visible"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [closable]="false"
      styleClass="task-dialog"
    >
      <ng-template #headless>
        <div class="task-dialog-container">
          <div class="task-dialog-header">
            <div class="flex items-center gap-3">
              <div class="task-dialog-icon">
                <i class="pi pi-clipboard"></i>
              </div>

              <div>
                <h2 class="task-dialog-title">
                  {{
                    isAssigneeOnly
                      ? 'Task Details'
                      : isUpdate
                        ? 'Edit Task'
                        : 'Create New Task'
                  }}
                </h2>

                <p class="task-dialog-subtitle">
                  {{
                    isAssigneeOnly
                      ? 'Review the task and update your checklist progress.'
                      : isUpdate
                        ? 'Update the details and assignment for this task.'
                        : 'Create a task and assign it to a staff member.'
                  }}
                </p>
              </div>
            </div>

            <button
              type="button"
              class="task-dialog-close"
              (click)="CloseDialog()"
            >
              <i class="pi pi-times"></i>
            </button>
          </div>

          <div class="task-dialog-body" [formGroup]="FG">
            <div class="task-main">
              <div class="form-section">
                <div class="section-header">
                  <div class="section-icon">
                    <i class="pi pi-file-edit"></i>
                  </div>

                  <div>
                    <div class="section-title">Task Details</div>
                    <div class="section-description">
                      Provide the basic information for this task.
                    </div>
                  </div>
                </div>

                <div class="form-grid">
                  <!-- TITLE -->
                  <div class="form-field col-span-2">
                    <label>
                      Task Title
                      <span class="required">*</span>
                    </label>

                    <input
                      pInputText
                      type="text"
                      formControlName="title"
                      placeholder="e.g. Prepare monthly report"
                    />

                    <small
                      class="field-error"
                      *ngIf="
                        FG.get('title')?.invalid && FG.get('title')?.touched
                      "
                    >
                      Task title is required.
                    </small>
                  </div>

                  <div class="form-field col-span-2">
                    <label>Description</label>

                    <textarea
                      pTextarea
                      formControlName="description"
                      rows="3"
                      [autoResize]="true"
                      class="w-full!"
                      placeholder="Describe what needs to be completed..."
                    ></textarea>

                    <div class="field-hint">
                      Add useful information, instructions or requirements.
                    </div>
                  </div>
                </div>
              </div>
              <div class="form-section">
                <div class="section-header">
                  <div class="section-icon">
                    <i class="pi pi-check-square"></i>
                  </div>

                  <div>
                    <div class="section-title">Checklist</div>
                    <div class="section-description">
                      Break this task into smaller actionable items.
                    </div>
                  </div>
                </div>

                <div formArrayName="checklists">
                  <div
                    *ngFor="let item of checklists.controls; let i = index"
                    [formGroupName]="i"
                    class="checklist-item"
                  >
                    <p-checkbox
                      [binary]="true"
                      formControlName="isCompleted"
                    ></p-checkbox>

                    <input
                      pInputText
                      type="text"
                      formControlName="title"
                      placeholder="Enter checklist item..."
                      class="checklist-input"
                      [class.completed]="item.get('isCompleted')?.value"
                    />

                    <button
                      *ngIf="!isAssigneeOnly"
                      type="button"
                      class="checklist-remove"
                      (click)="removeChecklist(i)"
                    >
                      <i class="pi pi-trash"></i>
                    </button>
                  </div>
                </div>

                <button
                  *ngIf="!isAssigneeOnly"
                  type="button"
                  class="add-checklist-btn"
                  (click)="addChecklist()"
                >
                  <i class="pi pi-plus"></i>
                  Add Checklist Item
                </button>
              </div>
              <div class="form-section">
                <div class="section-header">
                  <div class="section-icon">
                    <i class="pi pi-calendar"></i>
                  </div>

                  <div>
                    <div class="section-title">Schedule</div>
                    <div class="section-description">
                      Set when this task should be completed.
                    </div>
                  </div>
                </div>

                <div class="form-grid">
                  <div class="form-field">
                    <label>Start Date</label>

                    <p-datepicker
                      formControlName="startDate"
                      [showIcon]="true"
                      appendTo="body"
                      dateFormat="dd/mm/yy"
                      placeholder="dd/mm/yyyy"
                      styleClass="w-full!"
                      inputStyleClass="w-full!"
                    ></p-datepicker>
                  </div>

                  <div class="form-field">
                    <label>
                      Due Date
                      <span class="required">*</span>
                    </label>

                    <p-datepicker
                      formControlName="dueDate"
                      [showIcon]="true"
                      appendTo="body"
                      dateFormat="dd/mm/yy"
                      placeholder="dd/mm/yyyy"
                      styleClass="w-full!"
                      inputStyleClass="w-full!"
                    ></p-datepicker>
                  </div>

                  <div class="form-field">
                    <label>Estimated Hours</label>

                    <input
                      pInputText
                      type="number"
                      formControlName="estimatedHours"
                      placeholder="e.g. 4"
                      min="0"
                    />
                  </div>

                  <div class="form-field">
                    <label>Reminder</label>

                    <p-datepicker
                      formControlName="reminderAt"
                      [showIcon]="true"
                      [showTime]="true"
                      appendTo="body"
                      dateFormat="dd/mm/yy"
                      placeholder="Set reminder"
                      styleClass="w-full!"
                      inputStyleClass="w-full!"
                    ></p-datepicker>
                  </div>
                </div>
              </div>
            </div>

            <aside class="task-sidebar">
              <div class="sidebar-section">
                <div class="sidebar-section-title">
                  <i class="pi pi-users"></i>
                  Assignment
                </div>

                <div class="form-field">
                  <label>Created By</label>

                  <div class="user-display">
                    <div class="user-avatar">
                      <i class="pi pi-user"></i>
                    </div>

                    <div class="min-w-0">
                      <div class="user-name">
                        {{
                          isUpdate
                            ? selectedTask.assignedBy?.fullName
                            : createdBy
                        }}
                      </div>

                      <div class="user-role">Task creator</div>
                    </div>
                  </div>
                </div>

                <div class="form-field">
                  <label>Assign To</label>

                  <p-select
                    appendTo="body"
                    formControlName="assignedToId"
                    [options]="userSelection || []"
                    [filter]="true"
                    filterPlaceholder="Search staff..."
                    placeholder="Select staff member"
                    styleClass="w-full!"
                  ></p-select>
                  <small *ngIf="isAssigneeOnly" class="field-hint">
                    Assignment can only be changed by the task creator.
                  </small>
                </div>
              </div>

              <div class="sidebar-section">
                <div class="sidebar-section-title">
                  <i class="pi pi-sliders-h"></i>
                  Classification
                </div>

                <div class="form-field">
                  <label>Priority</label>

                  <p-select
                    appendTo="body"
                    formControlName="priority"
                    [options]="priorityOptions"
                    optionLabel="label"
                    optionValue="value"
                    styleClass="w-full!"
                    placeholder="Select priority"
                  ></p-select>
                </div>

                <div class="form-field mt-2">
                  <label>Category</label>

                  <p-select
                    appendTo="body"
                    formControlName="category"
                    [options]="categoryOptions"
                    optionLabel="label"
                    optionValue="value"
                    styleClass="w-full!"
                    placeholder="Select category"
                  ></p-select>
                </div>
              </div>

              <div class="sidebar-section">
                <div class="sidebar-section-title">
                  <i class="pi pi-refresh"></i>
                  Recurring Task
                </div>

                <div class="recurring-row">
                  <div>
                    <div class="recurring-title">Repeat this task</div>

                    <div class="recurring-description">
                      Automatically repeat this task.
                    </div>
                  </div>

                  <p-checkbox
                    [binary]="true"
                    formControlName="isRecurring"
                  ></p-checkbox>
                </div>

                <div
                  class="form-field mt-4"
                  *ngIf="FG.get('isRecurring')?.value"
                >
                  <label>Repeat</label>

                  <p-select
                    appendTo="body"
                    formControlName="recurringType"
                    [options]="recurringOptions"
                    optionLabel="label"
                    optionValue="value"
                    styleClass="w-full!"
                    placeholder="Select frequency"
                  ></p-select>
                </div>
              </div>
            </aside>
          </div>

          <div class="task-dialog-footer">
            <div class="footer-info">
              <i class="pi pi-info-circle"></i>

              <span>
                {{
                  isAssigneeOnly
                    ? 'You can update checklist progress only.'
                    : 'Fields marked with'
                }}

                <span *ngIf="!isAssigneeOnly" class="required"> * </span>

                <span *ngIf="!isAssigneeOnly"> are required. </span>
              </span>
            </div>

            <div class="footer-actions">
              <p-button
                label="Cancel"
                severity="secondary"
                [outlined]="true"
                styleClass="cancel-button"
                (onClick)="CloseDialog()"
              ></p-button>

              <p-button
                [label]="
                  isAssigneeOnly
                    ? 'Save Checklist'
                    : isUpdate
                      ? 'Update Task'
                      : 'Create Task'
                "
                severity="info"
                styleClass="save-button"
                (onClick)="SaveTask()"
              ></p-button>
            </div>
          </div>
        </div>
      </ng-template>
    </p-dialog> `,
  styleUrl: './staffTasks.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaffTasks implements OnInit, OnDestroy {
  private readonly loadingService = inject(LoadingService);
  private readonly staffTaskService = inject(StaffTaskService);
  private readonly userService = inject(UserService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messageService = inject(MessageService);

  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  PagingSignal = signal<PagingContent<StaffTask>>(
    {} as PagingContent<StaffTask>,
  );
  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  FG!: FormGroup;
  userSelection: any;
  visible: boolean = false;
  isUpdate: boolean = false;
  isAssigneeOnly: boolean = false;
  isTaskCreator: boolean = false;

  today = new Date();
  summaryCount: any;

  selectedTask: any;
  createdBy = `${this.userService.currentUser?.fullName}`;

  statusOptions = [
    { label: 'Not Started', value: 'NotStarted' },
    { label: 'In Progress', value: 'InProgress' },
    { label: 'On Hold', value: 'OnHold' },
    { label: 'Review', value: 'Review' },
    { label: 'Completed', value: 'Completed' },
    { label: 'Cancelled', value: 'Cancelled' },
  ];
  priorityOptions = [
    { label: 'Low', value: 'Low' },
    { label: 'Medium', value: 'Medium' },
    { label: 'High', value: 'High' },
    { label: 'Critical', value: 'Critical' },
  ];
  categoryOptions = [
    { label: 'General', value: 'General' },
    { label: 'Development', value: 'Development' },
    { label: 'Documentation', value: 'Documentation' },
    { label: 'Testing', value: 'Testing' },
    { label: 'Meeting', value: 'Meeting' },
    { label: 'Administrative', value: 'Administrative' },
    { label: 'Support', value: 'Support' },
    { label: 'Other', value: 'Other' },
  ];
  recurringOptions = [
    { label: 'Does not repeat', value: null },
    { label: 'Daily', value: 'Daily' },
    { label: 'Weekly', value: 'Weekly' },
    { label: 'Monthly', value: 'Monthly' },
  ];

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 10;
    this.Query.Select = null;
    this.Query.Filter = null;
    this.Query.OrderBy = null;
  }

  ngOnInit(): void {
    this.getCount();
    this.initForm();
    this.getUserSelection();
    this.GetData();
  }

  getCount() {
    return this.staffTaskService.GetSummary().pipe(
      takeUntil(this.ngUnsubscribe),
      tap((res) => {
        this.summaryCount = res;
        this.cdr.markForCheck();
      }),
    );
  }

  initForm() {
    this.FG = new FormGroup({
      id: new FormControl<string | null>({ value: null, disabled: true }),
      title: new FormControl<string | null>(null, Validators.required),
      description: new FormControl<string | null>(null),
      assignedToId: new FormControl<string | null>(null),
      priority: new FormControl<string | null>(null),
      category: new FormControl<string | null>(null),
      startDate: new FormControl<Date | null>(null),
      dueDate: new FormControl<Date | null>(null, Validators.required),
      reminderAt: new FormControl<Date | null>(null),
      isRecurring: new FormControl<boolean>(false),
      recurringType: new FormControl<string | null>(null),
      estimatedHours: new FormControl<number | null>(null),
      checklists: new FormArray([]),
    });
  }

  GetData(): void {
    this.loadingService.start();

    this.staffTaskService
      .GetMany(this.Query)
      .pipe(
        takeUntil(this.ngUnsubscribe),
        tap((res) => {
          this.PagingSignal.set(res);
        }),
        switchMap(() => this.getCount()),
      )
      .subscribe({
        next: () => {
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error loading tasks:', err);
          this.loadingService.stop();
        },
        complete: () => {
          this.loadingService.stop();
        },
      });
  }

  OpenTaskDialog() {
    this.isUpdate = false;

    this.FG.reset();

    this.FG.patchValue({
      priority: 'Medium',
      category: 'General',
      status: 'NotStarted',
      startDate: new Date(),
      isRecurring: false,
      recurringType: null,
    });
    this.clearChecklists();

    this.visible = true;
    this.cdr.markForCheck();
  }

  editTask(task: StaffTask): void {
    this.isUpdate = true;
    this.selectedTask = task;
    console.log(task);

    const currentUserId = this.userService.currentUser?.userId;

    this.isTaskCreator = !!currentUserId && task.assignedById === currentUserId;

    this.isAssigneeOnly =
      !!currentUserId &&
      task.assignedToId === currentUserId &&
      task.assignedById !== currentUserId;

    this.clearChecklists();
    for (const item of task.checklists || []) {
      this.checklists.push(
        new FormGroup({
          id: new FormControl(item.id),
          title: new FormControl({
            value: item.title,
            disabled: this.isAssigneeOnly,
          }),
          isCompleted: new FormControl(item.isCompleted),
          sequence: new FormControl({
            value: item.sequence ?? 0,
            disabled: this.isAssigneeOnly,
          }),
        }),
      );
    }

    this.FG.patchValue({
      id: task.id,
      title: task.title,
      description: task.description,
      assignedToId: task.assignedToId,
      priority: task.priority,
      category: task.category,
      status: task.status,
      startDate: task.startDate ? new Date(task.startDate) : null,
      dueDate: task.dueDate ? new Date(task.dueDate) : null,
      reminderAt: task.reminderAt ? new Date(task.reminderAt) : null,
      isRecurring: task.isRecurring,
      recurringType: task.recurringType,
      estimatedHours: task.estimatedHours,
    });

    if (this.isAssigneeOnly) {
      this.disableTaskFieldsForAssignee();
    }
    this.visible = true;
    this.cdr.markForCheck();
  }

  disableTaskFieldsForAssignee(): void {
    const fields = [
      'title',
      'description',
      'assignedToId',
      'priority',
      'category',
      'startDate',
      'dueDate',
      'reminderAt',
      'isRecurring',
      'recurringType',
      'estimatedHours',
    ];

    fields.forEach((field) => {
      this.FG.get(field)?.disable();
    });
  }

  clearChecklists(): void {
    while (this.checklists.length) {
      this.checklists.removeAt(0);
    }
  }

  getUserSelection() {
    this.staffTaskService
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

  get checklists(): FormArray {
    return this.FG.get('checklists') as FormArray;
  }

  CloseDialog() {
    this.visible = false;
  }

  SaveTask(): void {
    if (this.FG.invalid && !this.isAssigneeOnly) {
      this.FG.markAllAsTouched();
      return;
    }

    if (this.isAssigneeOnly) {
      this.saveChecklistOnly();
      return;
    }

    const formValue = this.FG.getRawValue();

    const request = {
      ...formValue,

      checklists: (formValue.checklists || []).map(
        (item: any, index: number) => ({
          id: item.id ?? null,
          title: item.title,
          isCompleted: item.isCompleted ?? false,
          sequence: item.sequence ?? index,
        }),
      ),

      recurringType: formValue.isRecurring ? formValue.recurringType : null,
    };

    if (!this.isUpdate) {
      delete request.id;
    }

    this.loadingService.start();

    const request$ = this.isUpdate
      ? this.staffTaskService.Update(request)
      : this.staffTaskService.Create(request);

    request$
      .pipe(
        takeUntil(this.ngUnsubscribe),
        switchMap((res: StaffTask) => this.getCount().pipe(map(() => res))),
      )
      .subscribe({
        next: (res: StaffTask) => {
          const currentData = this.PagingSignal();

          if (this.isUpdate) {
            const updatedData = (currentData.data || []).map(
              (task: StaffTask) => (task.id === res.id ? res : task),
            );

            this.PagingSignal.set({
              ...currentData,
              data: updatedData,
            });

            this.messageService.add({
              severity: 'success',
              summary: 'Task Updated',
              detail: 'Task has been updated successfully.',
            });
          } else {
            this.PagingSignal.set({
              ...currentData,
              data: [res, ...(currentData.data || [])],
              totalElements: (currentData.totalElements || 0) + 1,
            });

            this.messageService.add({
              severity: 'success',
              summary: 'Task Created',
              detail: 'Task has been created successfully.',
            });
          }

          this.visible = false;
          this.isUpdate = false;
          this.isAssigneeOnly = false;
          this.isTaskCreator = false;
          this.selectedTask = null;

          this.FG.reset();

          this.FG.patchValue({
            priority: 'Medium',
            category: 'General',
            startDate: new Date(),
            isRecurring: false,
            recurringType: null,
            checklists: [],
          });

          this.clearChecklists();

          this.cdr.markForCheck();
        },

        error: (err) => {
          console.error(
            this.isUpdate ? 'Error updating task:' : 'Error creating task:',
            err,
          );

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail:
              err?.error?.Error ||
              err?.error?.message ||
              (this.isUpdate
                ? 'Failed to update task.'
                : 'Failed to create task.'),
          });

          this.cdr.markForCheck();
        },

        complete: () => {
          this.loadingService.stop();
        },
      });
  }

  saveChecklistOnly(): void {
    const formValue = this.FG.getRawValue();

    const request = {
      id: formValue.id,

      checklists: (formValue.checklists || []).map(
        (item: any, index: number) => ({
          id: item.id,
          isCompleted: item.isCompleted ?? false,
          sequence: item.sequence ?? index,
        }),
      ),
    };

    this.loadingService.start();

    this.staffTaskService
      .UpdateChecklist(request)
      .pipe(
        takeUntil(this.ngUnsubscribe),
        switchMap((res: StaffTask) => this.getCount().pipe(map(() => res))),
      )
      .subscribe({
        next: (res: StaffTask) => {
          const currentData = this.PagingSignal();

          this.PagingSignal.set({
            ...currentData,
            data: (currentData.data || []).map((task: StaffTask) =>
              task.id === res.id ? res : task,
            ),
          });

          this.messageService.add({
            severity: 'success',
            summary: 'Checklist Updated',
            detail: 'Checklist progress has been updated.',
          });

          this.visible = false;
          this.isAssigneeOnly = false;
          this.selectedTask = null;

          this.cdr.markForCheck();
        },

        error: (err) => {
          console.error('Error updating checklist:', err);

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail:
              err?.error?.Error ||
              err?.error?.message ||
              'Failed to update checklist.',
          });

          this.cdr.markForCheck();
        },

        complete: () => {
          this.loadingService.stop();
        },
      });
  }

  getCompletedChecklistCount(task: StaffTask): number {
    return task.checklists?.filter((item: any) => item.isCompleted).length || 0;
  }

  isTaskOverdue(task: StaffTask): boolean {
    if (!task.dueDate) {
      return false;
    }

    if (task.status === 'Completed' || task.status === 'Cancelled') {
      return false;
    }

    const dueDate = new Date(task.dueDate);
    const today = new Date();

    dueDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    return dueDate < today;
  }

  addChecklist(): void {
    this.checklists.push(
      new FormGroup({
        id: new FormControl(null),
        title: new FormControl('', Validators.required),
        isCompleted: new FormControl(false),
        sequence: new FormControl(this.checklists.length),
      }),
    );
  }

  removeChecklist(index: number): void {
    this.checklists.removeAt(index);
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
