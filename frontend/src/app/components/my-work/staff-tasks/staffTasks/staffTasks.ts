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
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { map, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { ProjectDto } from '../../../../models/Project';
import { StaffTaskDto } from '../../../../models/StaffTask';
import { LoadingService } from '../../../../services/loading.service';
import { ProjectService } from '../../../../services/ProjectService';
import { StaffTaskService } from '../../../../services/staffTaskService';
import { UserService } from '../../../../services/userService.service';
import {
  PagingContent,
  GridifyQueryExtend,
} from '../../../../shared/helpers/helpers';

@Component({
  selector: 'app-staff-tasks',
  standalone: true,
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
    FormsModule,
  ],
  template: `
    <div class="w-full min-h-0 flex flex-col p-4 sm:p-5">
      <!-- BREADCRUMB -->
      <div
        class="flex flex-wrap items-center gap-1 text-gray-500 tracking-wide"
      >
        <div
          [routerLink]="'/dashboard'"
          class="cursor-pointer hover:text-gray-600"
        >
          Dashboard
        </div>

        <i class="pi pi-chevron-right text-[8px]! text-gray-400!"></i>

        <div class="text-gray-700 font-semibold">Tasks</div>
      </div>

      <!-- PAGE HEADER -->
      <div
        class="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <div class="text-[22px] text-gray-800 font-semibold">Tasks</div>

          <div class="mt-1 text-sm text-gray-400">
            Create, assign and track tasks for yourself or other staff.
          </div>
        </div>

        <p-button
          label="New Task"
          icon="pi pi-plus"
          severity="info"
          styleClass="tracking-wide! bg-blue-700! border-none! rounded-sm! py-2! px-5! w-full! sm:w-auto!"
          [routerLink]="'/my-tasks/form'"
        ></p-button>
      </div>

      <!-- SUMMARY CARDS -->
      <div
        class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mt-5"
      >
        <!-- MY TASKS -->
        <div class="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm text-gray-400">My Tasks</div>

              <div class="text-3xl font-semibold text-gray-800 mt-1">
                {{ summaryCount?.myTasks ?? 0 }}
              </div>
            </div>

            <div
              class="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center"
            >
              <i class="pi pi-user text-blue-600 text-lg"></i>
            </div>
          </div>
        </div>

        <!-- ASSIGNED TO OTHERS -->
        <div class="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm text-gray-400">Assigned to Others</div>

              <div class="text-3xl font-semibold text-gray-800 mt-1">
                {{ summaryCount?.assignedToOthers ?? 0 }}
              </div>
            </div>

            <div
              class="w-11 h-11 rounded-full bg-indigo-50 flex items-center justify-center"
            >
              <i class="pi pi-users text-indigo-600 text-lg"></i>
            </div>
          </div>
        </div>

        <!-- IN PROGRESS -->
        <div class="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm text-gray-400">In Progress</div>

              <div class="text-3xl font-semibold text-gray-800 mt-1">
                {{ summaryCount?.inProgress ?? 0 }}
              </div>
            </div>

            <div
              class="w-11 h-11 rounded-full bg-amber-50 flex items-center justify-center"
            >
              <i class="pi pi-spinner text-amber-600 text-lg"></i>
            </div>
          </div>
        </div>

        <!-- COMPLETED -->
        <div class="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm text-gray-400">Completed</div>

              <div class="text-3xl font-semibold text-gray-800 mt-1">
                {{ summaryCount?.completed ?? 0 }}
              </div>
            </div>

            <div
              class="w-11 h-11 rounded-full bg-green-50 flex items-center justify-center"
            >
              <i class="pi pi-check-circle text-green-600 text-lg"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- TASK LIST -->
      <div class="mt-6 bg-white border border-gray-100 rounded-lg shadow-sm">
        <div class="task-list-card">
          <!-- LIST HEADER -->
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
                  [(ngModel)]="searchText"
                  (input)="onSearch()"
                />
              </div>

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

          <!-- LIST CONTENT -->
          <div class="task-list-content">
            <!-- EMPTY STATE -->
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

            <!-- TASK ITEMS -->
            <ng-container *ngIf="PagingSignal().totalElements > 0">
              <div class="task-items">
                <div
                  *ngFor="let task of PagingSignal().data; let i = index"
                  class="task-item"
                  [style.animation-delay]="i * 50 + 'ms'"
                  [routerLink]="'/my-tasks/form'"
                  [queryParams]="{ id: task.id }"
                >
                  <!-- PRIORITY INDICATOR -->
                  <div
                    class="task-priority-line"
                    [ngClass]="{
                      'priority-low': task.priority === 'Low',
                      'priority-medium': task.priority === 'Medium',
                      'priority-high': task.priority === 'High',
                      'priority-critical': task.priority === 'Critical',
                    }"
                  ></div>

                  <!-- STATUS ICON -->
                  <div
                    class="task-status-icon"
                    [ngClass]="{
                      'status-not-started': task.status === 'Todo',
                      'status-in-progress': task.status === 'InProgress',
                      'status-on-hold': task.status === 'Pending',
                      'status-completed': task.status === 'Completed',
                      'status-cancelled': task.status === 'Cancelled',
                    }"
                  >
                    <i [ngClass]="getStatusIcon(task.status)"></i>
                  </div>

                  <!-- TASK INFORMATION -->
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

                      <!-- PRIORITY -->
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

                    <!-- TASK META -->
                    <div class="task-meta">
                      <!-- ASSIGNEE -->
                      <div class="task-meta-item">
                        <div class="task-avatar">
                          {{
                            task.assignedTo?.fullName
                              ? task.assignedTo?.fullName
                                  ?.charAt(0)
                                  ?.toUpperCase()
                              : 'ME'
                          }}
                        </div>

                        <span>
                          {{ task.assignedTo?.fullName || 'Own Task' }}
                        </span>
                      </div>

                      <span class="task-meta-divider"></span>

                      <!-- DUE DATE -->
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

                      <!-- CHECKLIST PROGRESS -->
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

                      <!-- ESTIMATED HOURS -->
                      <ng-container *ngIf="task.estimatedHours">
                        <span class="task-meta-divider"></span>

                        <div class="task-meta-item">
                          <i class="pi pi-clock"></i>
                          <span>{{ task.estimatedHours }}h</span>
                        </div>
                      </ng-container>
                    </div>
                  </div>

                  <!-- STATUS BADGE -->
                  <div class="task-status-wrapper">
                    <span
                      class="task-status-badge"
                      [ngClass]="{
                        'task-status-not-started': task.status === 'Todo',
                        'task-status-in-progress': task.status === 'InProgress',
                        'task-status-on-hold': task.status === 'Pending',
                        'task-status-completed': task.status === 'Completed',
                        'task-status-cancelled': task.status === 'Cancelled',
                      }"
                    >
                      <span class="status-dot"></span>
                      {{ getStatusLabel(task.status) }}
                    </span>
                  </div>

                  <!-- ACTION -->
                  <div class="task-action">
                    <button
                      type="button"
                      class="task-action-button"
                      [routerLink]="'/my-tasks/form'"
                      [queryParams]="{ id: task.id }"
                    >
                      <i class="pi pi-chevron-right"></i>
                    </button>
                  </div>
                </div>
              </div>
            </ng-container>
          </div>

          <!-- LIST FOOTER -->
          <div
            class="task-list-footer"
            *ngIf="PagingSignal().totalElements > 0"
          >
            <div class="task-count">
              <i class="pi pi-list"></i>

              Showing
              <strong>
                {{ PagingSignal().data.length || 0 }}
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

    <!-- DELETE CONFIRMATION DIALOG -->
    <p-dialog
      header="Delete Task"
      [(visible)]="showDeleteConfirm"
      [modal]="true"
      [closable]="false"
      [draggable]="false"
      [resizable]="false"
      [style]="{
        width: '420px',
        maxWidth: '95vw',
      }"
    >
      <div class="flex items-start gap-3">
        <i class="pi pi-exclamation-triangle text-red-500 text-2xl"></i>

        <div class="flex flex-col gap-1">
          <span class="font-semibold text-gray-800">
            Are you sure you want to delete this task?
          </span>

          <span class="text-sm text-gray-500">
            "{{ selectedTask?.title }}" will be permanently deleted. This action
            cannot be undone.
          </span>
        </div>
      </div>

      <ng-template pTemplate="footer">
        <p-button
          label="Cancel"
          severity="secondary"
          [outlined]="true"
          (onClick)="CancelDelete()"
        />

        <p-button
          label="Yes, Delete"
          icon="pi pi-trash"
          severity="danger"
          (onClick)="ConfirmDelete()"
        />
      </ng-template>
    </p-dialog>
  `,
  styleUrl: './staffTasks.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaffTasks implements OnInit, OnDestroy {
  private readonly loadingService = inject(LoadingService);
  private readonly staffTaskService = inject(StaffTaskService);
  private readonly userService = inject(UserService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messageService = inject(MessageService);
  private readonly projectService = inject(ProjectService);

  protected ngUnsubscribe = new Subject<void>();

  // --------------------------------------------------
  // DATA
  // --------------------------------------------------

  PagingSignal = signal<PagingContent<StaffTaskDto>>({
    data: [],
    totalElements: 0,
  } as PagingContent<StaffTaskDto>);

  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  searchText: string = '';

  summaryCount: any = {
    myTasks: 0,
    assignedToOthers: 0,
    inProgress: 0,
    completed: 0,
  };

  selectedTask: StaffTaskDto | null = null;

  // --------------------------------------------------
  // DIALOG STATE
  // --------------------------------------------------

  isAssigneeOnly = false;
  isTaskCreator = false;
  showDeleteConfirm = false;

  today = new Date();

  createdBy = this.userService.currentUser?.fullName ?? '';

  // --------------------------------------------------
  // DROPDOWN OPTIONS
  // --------------------------------------------------

  statusOptions = [
    { label: 'To Do', value: 'Todo' },
    { label: 'In Progress', value: 'InProgress' },
    { label: 'Pending', value: 'Pending' },
    { label: 'Completed', value: 'Completed' },
    { label: 'Cancelled', value: 'Cancelled' },
  ];

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 10;
    this.Query.Select = null;
    this.Query.Filter = null;
    this.Query.OrderBy = null;
  }

  // --------------------------------------------------
  // LIFECYCLE
  // --------------------------------------------------

  ngOnInit(): void {
    this.GetData();
  }

  // --------------------------------------------------
  // GET DATA
  // --------------------------------------------------

  GetData(): void {
    this.loadingService.start();

    this.staffTaskService
      .GetMany(this.Query)
      .pipe(
        takeUntil(this.ngUnsubscribe),

        tap((res) => {
          this.PagingSignal.set({
            ...res,
            data: res?.data ?? [],
            totalElements: res?.totalElements ?? 0,
          });
        }),

        switchMap(() => this.getCount()),
      )
      .subscribe({
        next: () => {
          this.cdr.markForCheck();
        },

        error: (err) => {
          console.error('Error loading tasks:', err);

          this.PagingSignal.set({
            data: [],
            totalElements: 0,
          } as PagingContent<StaffTaskDto>);

          this.loadingService.stop();

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load tasks.',
          });

          this.cdr.markForCheck();
        },

        complete: () => {
          this.loadingService.stop();
        },
      });
  }

  getCount() {
    return this.staffTaskService.GetSummary().pipe(
      takeUntil(this.ngUnsubscribe),

      tap((res) => {
        this.summaryCount = {
          myTasks: res?.myTasks ?? 0,
          assignedToOthers: res?.assignedToOthers ?? 0,
          inProgress: res?.inProgress ?? 0,
          completed: res?.completed ?? 0,
        };

        this.cdr.markForCheck();
      }),
    );
  }

  // --------------------------------------------------
  // LIST HELPERS
  // --------------------------------------------------

  updateTaskInList(task: StaffTaskDto): void {
    const currentData = this.PagingSignal();

    const existingData = currentData.data ?? [];

    const exists = existingData.some(
      (item: StaffTaskDto) => item.id === task.id,
    );

    this.PagingSignal.set({
      ...currentData,

      data: exists
        ? existingData.map((item: StaffTaskDto) =>
            item.id === task.id ? task : item,
          )
        : [task, ...existingData].slice(0, this.Query.PageSize),

      totalElements: exists
        ? currentData.totalElements
        : (currentData.totalElements ?? 0) + 1,
    });

    this.cdr.markForCheck();
  }

  getCompletedChecklistCount(task: StaffTaskDto): number {
    return task.checklists?.filter((item: any) => item.isCompleted).length ?? 0;
  }

  isTaskOverdue(task: StaffTaskDto): boolean {
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

  getStatusLabel(status: string): string {
    const option = this.statusOptions.find((item) => item.value === status);

    return option?.label ?? status;
  }

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      Todo: 'pi pi-circle',
      InProgress: 'pi pi-spinner',
      Pending: 'pi pi-pause',
      Completed: 'pi pi-check',
      Cancelled: 'pi pi-times',
    };

    return icons[status] ?? 'pi pi-circle';
  }

  // --------------------------------------------------
  // SEARCH
  // --------------------------------------------------

  onSearch(): void {
    this.Query.Page = 1;

    const search = this.searchText.trim();

    // Assumes your backend Gridify filter supports
    // title=*searchText* syntax.
    this.Query.Filter = search ? `title=*${search}*` : null;

    this.GetData();
  }

  // --------------------------------------------------
  // DELETE TASK
  // --------------------------------------------------

  DeleteTask(): void {
    if (!this.isTaskCreator || !this.selectedTask?.id) {
      return;
    }

    this.showDeleteConfirm = true;
  }

  CancelDelete(): void {
    this.showDeleteConfirm = false;
  }

  ConfirmDelete(): void {
    const task = this.selectedTask;

    if (!task?.id) {
      return;
    }

    const taskId = task.id;
    const currentUserId = this.userService.currentUser?.userId;

    this.loadingService.start();

    this.staffTaskService
      .Delete(taskId)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: () => {
          // 1. Remove deleted task from the current list
          const current = this.PagingSignal();

          this.PagingSignal.set({
            ...current,
            data: current.data.filter((item) => item.id !== taskId),
            totalElements: Math.max(0, current.totalElements - 1),
          });

          // 2. Update summary counts locally
          const counts = { ...this.summaryCount };

          const isMyTask =
            task.assignedToId === currentUserId ||
            (!task.assignedToId && task.assignedById === currentUserId);

          const isAssignedToOther =
            task.assignedById === currentUserId &&
            !!task.assignedToId &&
            task.assignedToId !== currentUserId;

          if (isMyTask) {
            counts.myTasks = Math.max(0, counts.myTasks - 1);

            if (task.status === 'InProgress') {
              counts.inProgress = Math.max(0, counts.inProgress - 1);
            }

            if (task.status === 'Completed') {
              counts.completed = Math.max(0, counts.completed - 1);
            }
          }

          if (isAssignedToOther) {
            counts.assignedToOthers = Math.max(0, counts.assignedToOthers - 1);
          }

          this.summaryCount = counts;

          // 3. Close dialog and clear selected task
          this.showDeleteConfirm = false;
          this.selectedTask = null;

          // 4. Success message
          this.messageService.add({
            severity: 'success',
            summary: 'Task Deleted',
            detail: 'Task has been deleted successfully.',
          });

          this.loadingService.stop();
          this.cdr.markForCheck();
        },

        error: (err) => {
          console.error('Error deleting task:', err);

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail:
              err?.error?.Error ??
              err?.error?.message ??
              'Failed to delete task.',
          });

          this.loadingService.stop();
          this.cdr.markForCheck();
        },
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
