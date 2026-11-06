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
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { map, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { ProjectDto } from '../../../models/Project';
import { StaffTask } from '../../../models/StaffTask';
import { LoadingService } from '../../../services/loading.service';
import { ProjectService } from '../../../services/ProjectService';
import { StaffTaskService } from '../../../services/staffTaskService';
import { UserService } from '../../../services/userService.service';
import {
  PagingContent,
  GridifyQueryExtend,
} from '../../../shared/helpers/helpers';

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
  ],
  template: `
    <div class="w-full min-h-[92.9vh] flex flex-col p-4 sm:p-5">
      <!-- BREADCRUMB -->
      <div
        class="flex flex-wrap items-center gap-1 text-gray-500 tracking-wide text-sm"
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
          (onClick)="OpenTaskDialog()"
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
                  (click)="editTask(task)"
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
                      (click)="$event.stopPropagation(); editTask(task)"
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
              <strong>{{ PagingSignal().data.length || 0 }}</strong>
              of
              <strong>{{ PagingSignal().totalElements }}</strong>
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

    <!-- TASK DIALOG -->
    <p-dialog
      [(visible)]="visible"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [closable]="false"
      [breakpoints]="{ '960px': '90vw', '640px': '98vw' }"
      [style]="{ width: '900px', maxWidth: '96vw' }"
      styleClass="task-dialog"
    >
      <ng-template #headless>
        <div class="task-dialog-container">
          <!-- DIALOG HEADER -->
          <div class="task-dialog-header">
            <div class="flex items-center gap-3 min-w-0">
              <div class="task-dialog-icon shrink-0">
                <i class="pi pi-clipboard"></i>
              </div>

              <div class="min-w-0">
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

          <!-- DIALOG BODY -->
          <div class="task-dialog-body" [formGroup]="FG">
            <div class="task-main">
              <!-- TASK DETAILS -->
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

                  <!-- DESCRIPTION -->
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

              <!-- CHECKLIST -->
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

                <div
                  *ngIf="checklists.length === 0"
                  class="text-sm text-gray-400 py-3"
                >
                  No checklist items added yet.
                </div>
              </div>

              <!-- SCHEDULE -->
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
                  <!-- START DATE -->
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

                  <!-- DUE DATE -->
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

                    <small
                      class="field-error"
                      *ngIf="
                        FG.get('dueDate')?.invalid && FG.get('dueDate')?.touched
                      "
                    >
                      Due date is required.
                    </small>
                  </div>

                  <!-- ESTIMATED HOURS -->
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

                  <!-- REMINDER -->
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

            <!-- SIDEBAR -->
            <aside class="task-sidebar">
              <!-- ASSIGNMENT -->
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
                            ? selectedTask?.assignedBy?.fullName || '-'
                            : createdBy
                        }}
                      </div>

                      <div class="user-role">Task creator</div>
                    </div>
                  </div>
                </div>

                <div class="form-field mt-3">
                  <label>Assign To</label>

                  <p-select
                    appendTo="body"
                    formControlName="assignedToId"
                    [options]="userSelection"
                    [filter]="true"
                    filterPlaceholder="Search staff..."
                    placeholder="Select staff member"
                    styleClass="w-full!"
                  ></p-select>

                  <small *ngIf="isAssigneeOnly" class="field-hint">
                    Assignment can only be changed by the task creator.
                  </small>
                </div>

                <div class="form-field mt-3">
                  <label>Project</label>

                  <p-select
                    appendTo="body"
                    formControlName="projectId"
                    [options]="projectSelection"
                    [filter]="true"
                    filterPlaceholder="Search projects..."
                    [showClear]="true"
                    placeholder="Select project (optional)"
                    styleClass="w-full!"
                  ></p-select>

                  <small class="field-hint">
                    You can leave this empty if the task is not associated with
                    a project.
                  </small>
                </div>
              </div>

              <!-- CLASSIFICATION -->
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
                  <label>Status</label>

                  <p-select
                    appendTo="body"
                    formControlName="status"
                    [options]="statusOptions"
                    optionLabel="label"
                    optionValue="value"
                    styleClass="w-full!"
                    placeholder="Select status"
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

              <!-- RECURRING -->
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

          <!-- DIALOG FOOTER -->
          <div class="task-dialog-footer">
            <div class="footer-info">
              <i class="pi pi-info-circle"></i>

              <span>
                {{
                  isAssigneeOnly
                    ? 'You can update checklist progress only.'
                    : 'Fields marked with'
                }}

                <span *ngIf="!isAssigneeOnly" class="required">*</span>

                <span *ngIf="!isAssigneeOnly">are required.</span>
              </span>
            </div>

            <div class="footer-actions">
              <p-button
                *ngIf="isUpdate && isTaskCreator"
                label="Delete"
                icon="pi pi-trash"
                severity="danger"
                [outlined]="true"
                styleClass="delete-button"
                (onClick)="DeleteTask()"
              ></p-button>
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
                styleClass="save-button bg-blue-900! border-none! rounded-sm! py-2! px-5!"
                (onClick)="SaveTask()"
              ></p-button>
            </div>
          </div>
        </div>
      </ng-template>
    </p-dialog>

    <p-dialog
      header="Delete Task"
      [(visible)]="showDeleteConfirm"
      [modal]="true"
      [closable]="false"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '420px', maxWidth: '95vw' }"
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

  PagingSignal = signal<PagingContent<StaffTask>>(
    {} as PagingContent<StaffTask>,
  );

  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  FG!: FormGroup;

  userSelection: { label: string; value: string }[] = [];
  projectSelection: { label: string; value: string }[] = [];

  visible: boolean = false;
  isUpdate: boolean = false;
  isAssigneeOnly: boolean = false;
  isTaskCreator: boolean = false;
  showDeleteConfirm: boolean = false;

  today = new Date();

  summaryCount: any = {
    myTasks: 0,
    assignedToOthers: 0,
    inProgress: 0,
    completed: 0,
  };

  selectedTask: StaffTask | null = null;

  createdBy = this.userService.currentUser?.fullName ?? '';

  priorityOptions = [
    { label: 'Low', value: 'Low' },
    { label: 'Medium', value: 'Medium' },
    { label: 'High', value: 'High' },
    { label: 'Critical', value: 'Critical' },
  ];

  categoryOptions = [
    { label: 'Admin', value: 'Admin' },
    { label: 'HR', value: 'HR' },
    { label: 'Development', value: 'Development' },
    { label: 'Documentation', value: 'Documentation' },
    { label: 'Maintenance', value: 'Maintenance' },
    { label: 'Meeting', value: 'Meeting' },
    { label: 'Training', value: 'Training' },
    { label: 'Others', value: 'Others' },
  ];

  recurringOptions = [
    { label: 'Daily', value: 'Daily' },
    { label: 'Weekly', value: 'Weekly' },
    { label: 'Monthly', value: 'Monthly' },
    { label: 'Yearly', value: 'Yearly' },
  ];

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

  ngOnInit(): void {
    this.initForm();
    this.getUserSelection();
    this.getProjectSelection();
    this.GetData();
  }

  getProjectSelection(): void {
    const query: GridifyQueryExtend = {
      Page: 1,
      PageSize: 1000,
      Select: null,
      Filter: null,
      OrderBy: null,
    } as GridifyQueryExtend;

    this.projectService
      .GetMany(query)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.projectSelection = (res?.data ?? []).map(
            (project: ProjectDto) => ({
              label: `${project.projectCode} - ${project.projectTitle}`,
              value: project.id,
            }),
          );

          this.cdr.markForCheck();
        },

        error: (err) => {
          console.error('Error loading projects:', err);

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load projects.',
          });
        },
      });
  }

  // --------------------------------------------------
  // FORM
  // --------------------------------------------------

  initForm(): void {
    this.FG = new FormGroup({
      id: new FormControl<string | null>({
        value: null,
        disabled: true,
      }),

      title: new FormControl<string | null>(null, [
        Validators.required,
        Validators.maxLength(200),
      ]),

      description: new FormControl<string | null>(null),

      assignedToId: new FormControl<string | null>(null),
      projectId: new FormControl<string | null>(null),
      priority: new FormControl<string>('Medium', Validators.required),

      category: new FormControl<string>('Others', Validators.required),

      status: new FormControl<string>('Todo'),

      startDate: new FormControl<Date | null>(null),

      dueDate: new FormControl<Date | null>(null, Validators.required),

      reminderAt: new FormControl<Date | null>(null),

      isRecurring: new FormControl<boolean>(false),

      recurringType: new FormControl<string | null>(null),

      estimatedHours: new FormControl<number | null>(null, [Validators.min(0)]),

      checklists: new FormArray([]),
    });
  }

  get checklists(): FormArray {
    return this.FG.get('checklists') as FormArray;
  }

  createChecklistForm(item?: any, assigneeOnly = false): FormGroup {
    return new FormGroup({
      id: new FormControl<string | null>(item?.id ?? null),

      title: new FormControl(
        {
          value: item?.title ?? '',
          disabled: assigneeOnly,
        },
        Validators.required,
      ),

      isCompleted: new FormControl<boolean>(item?.isCompleted ?? false),

      sequence: new FormControl({
        value: item?.sequence ?? this.checklists.length,
        disabled: assigneeOnly,
      }),
    });
  }

  clearChecklists(): void {
    while (this.checklists.length > 0) {
      this.checklists.removeAt(0);
    }
  }

  enableTaskFields(): void {
    const fields = [
      'title',
      'description',
      'assignedToId',
      'projectId',
      'priority',
      'category',
      'status',
      'startDate',
      'dueDate',
      'reminderAt',
      'isRecurring',
      'recurringType',
      'estimatedHours',
    ];

    fields.forEach((field) => {
      this.FG.get(field)?.enable({ emitEvent: false });
    });

    this.checklists.controls.forEach((control) => {
      control.get('title')?.enable({ emitEvent: false });
      control.get('sequence')?.enable({ emitEvent: false });
      control.get('isCompleted')?.enable({ emitEvent: false });
    });
  }

  disableTaskFieldsForAssignee(): void {
    const fields = [
      'title',
      'description',
      'assignedToId',
      'projectId',
      'priority',
      'category',
      'status',
      'startDate',
      'dueDate',
      'reminderAt',
      'isRecurring',
      'recurringType',
      'estimatedHours',
    ];

    fields.forEach((field) => {
      this.FG.get(field)?.disable({ emitEvent: false });
    });

    this.checklists.controls.forEach((control) => {
      control.get('title')?.disable({ emitEvent: false });
      control.get('sequence')?.disable({ emitEvent: false });
      control.get('isCompleted')?.enable({ emitEvent: false });
    });
  }

  // --------------------------------------------------
  // DATA
  // --------------------------------------------------

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

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load tasks.',
          });
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

  getUserSelection(): void {
    this.staffTaskService
      .GetDropdown()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.userSelection = (res?.users ?? []).map((user: any) => ({
            label:
              user.fullName ??
              user.displayName ??
              user.name ??
              user.email ??
              'Unknown User',
            value: user.id,
          }));

          this.cdr.markForCheck();
        },

        error: (err) => {
          console.error('Error loading staff dropdown:', err);

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load staff members.',
          });
        },
      });
  }

  // --------------------------------------------------
  // CREATE
  // --------------------------------------------------

  OpenTaskDialog(): void {
    this.isUpdate = false;
    this.isAssigneeOnly = false;
    this.isTaskCreator = false;
    this.selectedTask = null;

    this.enableTaskFields();
    this.FG.reset();

    this.clearChecklists();

    this.FG.patchValue({
      priority: 'Medium',
      category: 'Others',
      status: 'Todo',
      startDate: new Date(),
      dueDate: null,
      isRecurring: false,
      recurringType: null,
      estimatedHours: null,
      assignedToId: null,
      projectId: null,
    });

    this.visible = true;
    this.cdr.markForCheck();
  }

  // --------------------------------------------------
  // EDIT
  // --------------------------------------------------

  editTask(task: StaffTask): void {
    this.isUpdate = true;
    this.selectedTask = task;

    const currentUserId = this.userService.currentUser?.userId;

    this.isTaskCreator = !!currentUserId && task.assignedById === currentUserId;

    this.isAssigneeOnly =
      !!currentUserId &&
      task.assignedToId === currentUserId &&
      task.assignedById !== currentUserId;

    this.enableTaskFields();
    this.clearChecklists();

    for (const item of task.checklists ?? []) {
      this.checklists.push(this.createChecklistForm(item, this.isAssigneeOnly));
    }

    this.FG.patchValue({
      id: task.id,
      title: task.title,
      description: task.description,
      assignedToId: task.assignedToId ?? null,
      projectId: task.projectId ?? null,
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

  // --------------------------------------------------
  // SAVE
  // --------------------------------------------------

  SaveTask(): void {
    if (this.isAssigneeOnly) {
      this.saveChecklistOnly();
      return;
    }

    if (this.FG.invalid) {
      this.FG.markAllAsTouched();

      this.messageService.add({
        severity: 'warn',
        summary: 'Incomplete Information',
        detail: 'Please complete all required fields.',
      });

      return;
    }

    const formValue = this.FG.getRawValue();

    if (
      formValue.startDate &&
      formValue.dueDate &&
      new Date(formValue.startDate) > new Date(formValue.dueDate)
    ) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Invalid Date',
        detail: 'Start date cannot be later than the due date.',
      });

      return;
    }

    if (formValue.isRecurring && !formValue.recurringType) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Recurring Frequency Required',
        detail: 'Please select how often this task should repeat.',
      });

      return;
    }

    const request: any = {
      title: formValue.title?.trim(),
      description: formValue.description?.trim() || null,
      assignedToId: formValue.assignedToId || null,
      projectId: formValue.projectId || null,
      priority: formValue.priority,
      category: formValue.category,
      startDate: formValue.startDate,
      dueDate: formValue.dueDate,
      reminderAt: formValue.reminderAt,
      isRecurring: formValue.isRecurring,
      recurringType: formValue.isRecurring ? formValue.recurringType : null,
      estimatedHours: formValue.estimatedHours,

      checklists: (formValue.checklists ?? []).map(
        (item: any, index: number) => ({
          id: item.id ?? null,
          title: item.title?.trim(),
          isCompleted: item.isCompleted ?? false,
          sequence: item.sequence ?? index,
        }),
      ),
    };

    if (this.isUpdate) {
      request.id = formValue.id;
      request.status = formValue.status ?? 'Todo';
    }

    if (request.checklists.some((item: any) => !item.title)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Invalid Checklist',
        detail: 'Please enter a title for every checklist item.',
      });

      return;
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
          this.updateTaskInList(res);

          this.messageService.add({
            severity: 'success',
            summary: this.isUpdate ? 'Task Updated' : 'Task Created',
            detail: this.isUpdate
              ? 'Task has been updated successfully.'
              : 'Task has been created successfully.',
          });

          this.resetDialog();
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
              err?.error?.Error ??
              err?.error?.message ??
              (this.isUpdate
                ? 'Failed to update task.'
                : 'Failed to create task.'),
          });

          this.loadingService.stop();
          this.cdr.markForCheck();
        },

        complete: () => {
          this.loadingService.stop();
        },
      });
  }

  // --------------------------------------------------
  // ASSIGNEE CHECKLIST UPDATE
  // --------------------------------------------------

  saveChecklistOnly(): void {
    const formValue = this.FG.getRawValue();

    const request = {
      id: formValue.id,

      checklists: (formValue.checklists ?? []).map(
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
          this.updateTaskInList(res);

          this.messageService.add({
            severity: 'success',
            summary: 'Checklist Updated',
            detail: 'Checklist progress has been updated.',
          });

          this.resetDialog();
        },

        error: (err) => {
          console.error('Error updating checklist:', err);

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail:
              err?.error?.Error ??
              err?.error?.message ??
              'Failed to update checklist.',
          });

          this.loadingService.stop();
          this.cdr.markForCheck();
        },

        complete: () => {
          this.loadingService.stop();
        },
      });
  }

  // --------------------------------------------------
  // LIST HELPERS
  // --------------------------------------------------

  updateTaskInList(task: StaffTask): void {
    const currentData = this.PagingSignal();
    const existingData = currentData.data ?? [];

    const exists = existingData.some((item: StaffTask) => item.id === task.id);

    this.PagingSignal.set({
      ...currentData,

      data: exists
        ? existingData.map((item: StaffTask) =>
            item.id === task.id ? task : item,
          )
        : [task, ...existingData].slice(0, this.Query.PageSize),

      totalElements: exists
        ? currentData.totalElements
        : (currentData.totalElements ?? 0) + 1,
    });

    this.cdr.markForCheck();
  }

  getCompletedChecklistCount(task: StaffTask): number {
    return task.checklists?.filter((item: any) => item.isCompleted).length ?? 0;
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

  addChecklist(): void {
    this.checklists.push(
      this.createChecklistForm({
        sequence: this.checklists.length,
      }),
    );
  }

  removeChecklist(index: number): void {
    this.checklists.removeAt(index);

    this.checklists.controls.forEach((control, i) => {
      control.get('sequence')?.setValue(i);
    });
  }

  // --------------------------------------------------
  // DIALOG
  // --------------------------------------------------

  resetDialog(): void {
    this.visible = false;
    this.isUpdate = false;
    this.isAssigneeOnly = false;
    this.isTaskCreator = false;
    this.selectedTask = null;

    this.enableTaskFields();
    this.FG.reset();

    this.clearChecklists();

    this.FG.patchValue({
      priority: 'Medium',
      category: 'Others',
      status: 'Todo',
      isRecurring: false,
      recurringType: null,
    });

    this.cdr.markForCheck();
  }

  CloseDialog(): void {
    this.resetDialog();
  }

  // --------------------------------------------------
  // DELETE
  // --------------------------------------------------

  DeleteTask(): void {
    if (!this.isUpdate || !this.isTaskCreator || !this.selectedTask?.id) {
      return;
    }

    this.showDeleteConfirm = true;
  }

  CancelDelete(): void {
    this.showDeleteConfirm = false;
  }

  ConfirmDelete(): void {
    if (!this.selectedTask?.id) {
      return;
    }

    const taskId = this.selectedTask.id;

    this.staffTaskService
      .Delete(taskId)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: () => {
          this.showDeleteConfirm = false;

          this.messageService.add({
            severity: 'success',
            summary: 'Task Deleted',
            detail: 'Task has been deleted successfully.',
          });

          this.resetDialog();
          this.GetData();
          this.getCount();
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
        },
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
