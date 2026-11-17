import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { finalize } from 'rxjs';
import { StaffTaskService } from '../../../../services/staffTaskService';

@Component({
  selector: 'app-staff-task-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    DatePickerModule,
  ],
  template: `
    <div class="min-h-0 bg-slate-50 px-4 py-5 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-2xl font-semibold text-slate-800">
            {{
              isViewMode
                ? 'View Task'
                : isEditMode
                  ? 'Edit Task'
                  : 'Create Task'
            }}
          </h2>

          <p class="mt-1 text-slate-500">
            {{
              isViewMode
                ? 'View task information and assignment details.'
                : isEditMode
                  ? 'Update task information.'
                  : 'Create and assign a new task.'
            }}
          </p>
        </div>

        <div class="flex items-center gap-2">
          @if (isViewMode) {
            <p-button
              label="Edit"
              icon="pi pi-pencil"
              styleClass="bg-blue-700! hover:bg-blue-500! border-none!"
              (onClick)="enableEdit()"
            />
          }

          <p-button
            label="Back"
            icon="pi pi-arrow-left"
            severity="secondary"
            [outlined]="true"
            (onClick)="cancel()"
          />
        </div>
      </div>

      <form [formGroup]="taskForm" (ngSubmit)="saveTask()" class="mt-4">
        <div
          class="space-y-6"
          [ngClass]="
            isViewMode
              ? 'py-2'
              : 'rounded-xl border border-slate-200 bg-white p-5'
          "
        >
          <!-- Basic Information -->
          <section class="space-y-4">
            <h3 class="text-lg font-semibold text-slate-800">
              Task Information
            </h3>

            <!-- Task Title -->
            <div>
              <label class="mb-2 block text-sm font-medium text-slate-500">
                Task Title <span class="text-red-500">*</span>
              </label>

              @if (isViewMode) {
                <p class="text-base font-semibold text-slate-800">
                  {{ taskForm.get('title')?.value || '-' }}
                </p>
              } @else {
                <input
                  pInputText
                  formControlName="title"
                  class="w-full"
                  placeholder="Enter task title"
                />

                @if (
                  taskForm.get('title')?.touched &&
                  taskForm.get('title')?.invalid
                ) {
                  <small class="text-red-500"> Task title is required. </small>
                }
              }
            </div>

            <!-- Description -->
            <div>
              <label class="mb-2 block text-sm font-medium text-slate-500">
                Description / Scope of Work
              </label>

              @if (isViewMode) {
                <p class="whitespace-pre-line text-sm text-slate-800">
                  {{ taskForm.get('description')?.value || '-' }}
                </p>
              } @else {
                <textarea
                  pTextarea
                  formControlName="description"
                  rows="4"
                  class="w-full"
                  placeholder="Describe the task or scope of work..."
                ></textarea>
              }
            </div>
          </section>

          <hr class="border-slate-200" />

          <!-- Project / Work Order -->
          <section class="space-y-4">
            <h3 class="text-lg font-semibold text-slate-800">
              Related Information
            </h3>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <!-- Project -->
              <div>
                <label class="mb-2 block text-sm font-medium text-slate-500">
                  Project
                </label>

                @if (isViewMode) {
                  <p class="text-sm text-slate-800">
                    {{
                      getOptionLabel(
                        projectOptions,
                        taskForm.get('projectId')?.value
                      )
                    }}
                  </p>
                } @else {
                  <p-select
                    [options]="projectOptions"
                    formControlName="projectId"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select Project"
                    class="w-full"
                    [disabled]="true"
                  />
                }
              </div>

              <!-- Work Order -->
              <div>
                <label class="mb-2 block text-sm font-medium text-slate-500">
                  Work Order
                </label>

                @if (isViewMode) {
                  <p class="text-sm text-slate-800">
                    {{
                      getOptionLabel(
                        workOrderOptions,
                        taskForm.get('workOrderId')?.value
                      )
                    }}
                  </p>
                } @else {
                  <p-select
                    [options]="workOrderOptions"
                    formControlName="workOrderId"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="No Work Order"
                    class="w-full"
                    [disabled]="true"
                  />
                }
              </div>
            </div>
          </section>

          <hr class="border-slate-200" />

          <!-- Assignment -->
          <section class="space-y-4">
            <h3 class="text-lg font-semibold text-slate-800">Assignment</h3>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <!-- Assign To -->
              <div>
                <label class="mb-2 block text-sm font-medium text-slate-500">
                  Assign To
                </label>

                @if (isViewMode) {
                  <p class="text-sm text-slate-800">
                    {{
                      getOptionLabel(users, taskForm.get('assignedToId')?.value)
                    }}
                  </p>
                } @else {
                  <p-select
                    formControlName="assignedToId"
                    [options]="users"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select staff"
                    [filter]="true"
                    [showClear]="true"
                    class="w-full"
                  />
                }
              </div>

              <!-- Priority -->
              <div>
                <label class="mb-2 block text-sm font-medium text-slate-500">
                  Priority <span class="text-red-500">*</span>
                </label>

                @if (isViewMode) {
                  <p class="text-sm font-medium text-slate-800">
                    {{
                      getOptionLabel(
                        priorities,
                        taskForm.get('priority')?.value
                      )
                    }}
                  </p>
                } @else {
                  <p-select
                    formControlName="priority"
                    [options]="priorities"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select priority"
                    class="w-full"
                  />
                }
              </div>

              <!-- Category -->
              <div>
                <label class="mb-2 block text-sm font-medium text-slate-500">
                  Category <span class="text-red-500">*</span>
                </label>

                @if (isViewMode) {
                  <p class="text-sm text-slate-800">
                    {{
                      getOptionLabel(
                        categories,
                        taskForm.get('category')?.value
                      )
                    }}
                  </p>
                } @else {
                  <p-select
                    formControlName="category"
                    [options]="categories"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select category"
                    class="w-full"
                  />
                }
              </div>

              <!-- Status -->
              <div>
                <label class="mb-2 block text-sm font-medium text-slate-500">
                  Status
                </label>

                @if (isViewMode) {
                  <p class="text-sm text-slate-800">
                    {{
                      getOptionLabel(statuses, taskForm.get('status')?.value)
                    }}
                  </p>
                } @else {
                  <p-select
                    formControlName="status"
                    [options]="statuses"
                    optionLabel="label"
                    optionValue="value"
                    class="w-full"
                  />
                }
              </div>
            </div>
          </section>

          <hr class="border-slate-200" />

          <!-- Schedule -->
          <section class="space-y-4">
            <h3 class="text-lg font-semibold text-slate-800">Schedule</h3>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <!-- Start Date -->
              <div>
                <label class="mb-2 block text-sm font-medium text-slate-500">
                  Start Date
                </label>

                @if (isViewMode) {
                  <p class="text-sm text-slate-800">
                    {{ formatDate(taskForm.get('startDate')?.value) }}
                  </p>
                } @else {
                  <p-datepicker
                    formControlName="startDate"
                    [showIcon]="true"
                    dateFormat="dd/mm/yy"
                    placeholder="Select start date"
                    styleClass="w-full"
                    class="w-full"
                  />
                }
              </div>

              <!-- Due Date -->
              <div>
                <label class="mb-2 block text-sm font-medium text-slate-500">
                  Due Date <span class="text-red-500">*</span>
                </label>

                @if (isViewMode) {
                  <p class="text-sm text-slate-800">
                    {{ formatDate(taskForm.get('dueDate')?.value) }}
                  </p>
                } @else {
                  <p-datepicker
                    formControlName="dueDate"
                    [showIcon]="true"
                    dateFormat="dd/mm/yy"
                    placeholder="Select due date"
                    styleClass="w-full"
                    class="w-full"
                  />

                  @if (
                    taskForm.get('dueDate')?.touched &&
                    taskForm.get('dueDate')?.invalid
                  ) {
                    <small class="text-red-500"> Due date is required. </small>
                  }
                }
              </div>

              <!-- Estimated Hours -->
              <div>
                <label class="mb-2 block text-sm font-medium text-slate-500">
                  Estimated Hours
                </label>

                @if (isViewMode) {
                  <p class="text-sm text-slate-800">
                    {{ taskForm.get('estimatedHours')?.value ?? '-' }}
                    @if (taskForm.get('estimatedHours')?.value != null) {
                      hours
                    }
                  </p>
                } @else {
                  <input
                    pInputText
                    type="number"
                    min="0"
                    formControlName="estimatedHours"
                    class="w-full"
                    placeholder="e.g. 8"
                  />
                }
              </div>

              <!-- Actual Hours -->
              <div>
                <label class="mb-2 block text-sm font-medium text-slate-500">
                  Actual Hours
                </label>

                @if (isViewMode) {
                  <p class="text-sm text-slate-800">
                    {{ taskForm.get('actualHours')?.value ?? '-' }}
                    @if (taskForm.get('actualHours')?.value != null) {
                      hours
                    }
                  </p>
                } @else {
                  <input
                    pInputText
                    type="number"
                    min="0"
                    formControlName="actualHours"
                    class="w-full"
                    placeholder="e.g. 6"
                  />
                }
              </div>
            </div>
          </section>

          <hr class="border-slate-200" />

          <!-- Checklist -->
          <section class="space-y-4">
            <div class="flex items-center justify-between gap-3">
              <div>
                <h3 class="text-lg font-semibold text-slate-800">Checklist</h3>
                <p class="text-sm text-slate-500">
                  Break the task into smaller steps.
                </p>
              </div>

              @if (!isViewMode) {
                <p-button
                  label="Add Item"
                  icon="pi pi-plus"
                  size="small"
                  styleClass="text-blue-700! border-blue-700! border-dashed!"
                  [outlined]="true"
                  type="button"
                  (onClick)="addChecklist()"
                />
              }
            </div>

            <div formArrayName="checklists" class="space-y-3">
              @for (item of checklists.controls; track $index; let i = $index) {
                <div
                  [formGroupName]="i"
                  class="flex items-center gap-3 rounded-lg"
                  [ngClass]="
                    isViewMode ? 'py-2' : 'border border-slate-200 p-3'
                  "
                >
                  <span class="text-sm font-medium text-slate-400">
                    {{ i + 1 }}.
                  </span>

                  @if (isViewMode) {
                    <p class="flex-1 text-sm text-slate-800">
                      {{ item.get('title')?.value || '-' }}
                    </p>
                  } @else {
                    <input
                      pInputText
                      formControlName="title"
                      class="flex-1"
                      placeholder="Enter checklist item"
                    />

                    <p-button
                      icon="pi pi-trash"
                      severity="danger"
                      [text]="true"
                      type="button"
                      (onClick)="removeChecklist(i)"
                    />
                  }

                  @if (isViewMode && item.get('isCompleted')?.value) {
                    <i class="pi pi-check-circle text-green-600"></i>
                  }
                </div>
              } @empty {
                <div
                  class="rounded-lg border border-dashed border-slate-300 p-6 text-center"
                >
                  <p class="text-sm text-slate-500">
                    No checklist items added.
                  </p>
                </div>
              }
            </div>
          </section>

          <!-- Actions -->
          @if (!isViewMode) {
            <div
              class="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5"
            >
              <p-button
                label="Cancel"
                severity="secondary"
                [outlined]="true"
                type="button"
                (onClick)="cancel()"
              />

              <p-button
                [label]="isEditMode ? 'Update Task' : 'Create Task'"
                icon="pi pi-save"
                type="submit"
                styleClass="bg-blue-700! hover:bg-blue-500! border-none!"
                [loading]="saving"
                [disabled]="saving || loading"
              />
            </div>
          }
        </div>
      </form>
    </div>
  `,
  styleUrl: './staff-task-form.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaffTaskForm implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private staffTaskService = inject(StaffTaskService);
  private messageService = inject(MessageService);

  taskForm!: FormGroup;

  loading = false;
  saving = false;
  isEditMode = false;
  isViewMode = false;

  currentId: string | null = null;
  projectId: string | null = null;
  workOrderId: string | null = null;

  users: any[] = [];
  allUsers: any[] = [];

  projects: any[] = [];
  workOrders: any[] = [];

  projectOptions: any[] = [];
  workOrderOptions: any[] = [];

  priorities = [
    { label: 'Low', value: 'Low' },
    { label: 'Medium', value: 'Medium' },
    { label: 'High', value: 'High' },
    { label: 'Urgent', value: 'Urgent' },
  ];

  categories = [
    { label: 'Admin', value: 'Admin' },
    { label: 'HR', value: 'HR' },
    { label: 'Development', value: 'Development' },
    { label: 'Documentation', value: 'Documentation' },
    { label: 'Maintenance', value: 'Maintenance' },
    { label: 'Meeting', value: 'Meeting' },
    { label: 'Training', value: 'Training' },
    { label: 'Others', value: 'Others' },
  ];

  statuses = [
    { label: 'To Do', value: 'Todo' },
    { label: 'In Progress', value: 'InProgress' },
    { label: 'Pending', value: 'Pending' },
    { label: 'Completed', value: 'Completed' },
    { label: 'Cancelled', value: 'Cancelled' },
  ];

  ngOnInit(): void {
    this.initializeForm();

    this.route.queryParams.subscribe((params) => {
      this.currentId = params['id'] || null;
      this.projectId = params['projectId'] || null;
      this.workOrderId = params['workOrderId'] || null;

      this.isViewMode = !!this.currentId;
      this.isEditMode = false;

      this.loadDropdowns();
    });
  }

  initializeForm(): void {
    this.taskForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],

      assignedToId: [null],

      projectId: [null],
      workOrderId: [null],

      priority: ['Medium', Validators.required],
      category: ['Development', Validators.required],
      status: ['Todo', Validators.required],

      startDate: [null],
      dueDate: [null, Validators.required],
      reminderAt: [null],

      isRecurring: [false],
      recurringType: [null],

      estimatedHours: [null],
      actualHours: [null],

      checklists: this.fb.array([]),
    });
  }

  get checklists(): FormArray {
    return this.taskForm.get('checklists') as FormArray;
  }

  getOptionLabel(options: any[], value: any): string {
    if (value === null || value === undefined || value === '') {
      return '-';
    }

    return options.find((option: any) => option.value === value)?.label || '-';
  }

  formatDate(value: any): string {
    if (!value) return '-';

    const date = value instanceof Date ? value : new Date(value);

    if (isNaN(date.getTime())) return '-';

    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  createChecklistItem(): FormGroup {
    return this.fb.group({
      title: ['', Validators.required],
      sequence: [this.checklists.length + 1],
      isCompleted: [false],
    });
  }

  addChecklist(): void {
    this.checklists.push(this.createChecklistItem());
    this.cdr.markForCheck();
  }

  removeChecklist(index: number): void {
    this.checklists.removeAt(index);

    this.checklists.controls.forEach((control, i) => {
      control.get('sequence')?.setValue(i + 1);
    });

    this.cdr.markForCheck();
  }

  loadDropdowns(): void {
    this.loading = true;

    this.staffTaskService
      .GetDropdown()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (res: any) => {
          this.allUsers = (res.users || res.Users || []).map((user: any) => ({
            label:
              user.displayName ||
              user.DisplayName ||
              user.fullName ||
              user.FullName ||
              user.name ||
              user.Name,
            value: user.id || user.Id,
          }));

          this.projects = res.projects || res.Projects || [];

          this.projectOptions = this.projects.map((p: any) => ({
            label:
              p.label ||
              p.Label ||
              `${p.projectCode || p.ProjectCode} - ${p.projectTitle || p.ProjectTitle}`,
            value: p.id || p.Id,
          }));

          this.workOrders = res.workOrders || res.WorkOrders || [];

          this.workOrderOptions = this.workOrders.map((w: any) => ({
            label: `${w.workOrderNo || w.WorkOrderNo} - ${w.title || w.Title}`,
            value: w.id || w.Id,
            projectId: w.projectId || w.ProjectId,
          }));

          if (this.currentId) {
            this.loadTask();
          } else {
            this.taskForm.patchValue({
              projectId: this.projectId,
              workOrderId: this.workOrderId,
            });

            this.updateAssignedUsers();
          }

          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Failed to load task dropdowns:', error);

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load dropdown data.',
          });
        },
      });
  }

  loadTask(): void {
    if (!this.currentId) return;

    this.loading = true;

    this.staffTaskService
      .GetOne(this.currentId)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (res: any) => {
          const task = res.data || res;

          this.taskForm.patchValue({
            title: task.title,
            description: task.description,
            assignedToId: task.assignedToId,
            projectId: task.projectId,
            workOrderId: task.workOrderId,
            priority: task.priority,
            category: task.category,
            status: task.status,
            startDate: task.startDate ? new Date(task.startDate) : null,
            dueDate: task.dueDate ? new Date(task.dueDate) : null,
            reminderAt: task.reminderAt ? new Date(task.reminderAt) : null,
            isRecurring: task.isRecurring,
            recurringType: task.recurringType,
            estimatedHours: task.estimatedHours,
            actualHours: task.actualHours,
          });

          this.checklists.clear();

          (task.checklists || []).forEach((item: any) => {
            this.checklists.push(
              this.fb.group({
                id: [item.id],
                title: [item.title, Validators.required],
                sequence: [item.sequence],
                isCompleted: [item.isCompleted],
              }),
            );
          });

          this.updateAssignedUsers();

          if (
            task.assignedToId &&
            !this.users.some((user: any) => user.value === task.assignedToId)
          ) {
            const assignedUser = this.allUsers.find(
              (user: any) => user.value === task.assignedToId,
            );

            if (assignedUser) {
              this.users = [...this.users, assignedUser];
            }
          }

          this.enableViewMode();
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Failed to load task:', error);

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load task details.',
          });
        },
      });
  }

  saveTask(): void {
    // Prevent saving while viewing an existing task.
    if (this.currentId && !this.isEditMode) {
      return;
    }

    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();

      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Please complete all required fields.',
      });

      return;
    }

    const formValue = this.taskForm.getRawValue();

    const payload: any = {
      ...formValue,
      projectId: formValue.projectId,
      workOrderId: formValue.workOrderId,
      startDate: formValue.startDate || null,
      dueDate: formValue.dueDate,
      reminderAt: formValue.reminderAt || null,
      estimatedHours: formValue.estimatedHours
        ? Number(formValue.estimatedHours)
        : null,
      actualHours: formValue.actualHours ? Number(formValue.actualHours) : null,
      checklists: formValue.checklists.map((item: any, index: number) => ({
        ...(item.id ? { id: item.id } : {}),
        title: item.title,
        sequence: index + 1,
        isCompleted: item.isCompleted || false,
      })),
    };

    if (this.isEditMode) {
      payload.id = this.currentId;
    }

    this.saving = true;

    const request = this.isEditMode
      ? this.staffTaskService.Update(payload)
      : this.staffTaskService.Create(payload);

    request
      .pipe(
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: this.isEditMode
              ? 'Task updated successfully.'
              : 'Task created successfully.',
          });

          this.router.navigate(['/staff-tasks']);
        },
        error: (error) => {
          console.error('Failed to save task:', error);

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to save task.',
          });
        },
      });
  }

  cancel(): void {
    this.router.navigate(['/staff-tasks']);
  }

  updateAssignedUsers(): void {
    const projectId = this.taskForm.get('projectId')?.value;
    const workOrderId = this.taskForm.get('workOrderId')?.value;

    const allowedUserIds = new Set<string>();

    // CASE 1: Work Order selected
    if (workOrderId) {
      const workOrder = this.workOrders.find(
        (w: any) => (w.id || w.Id) === workOrderId,
      );

      const assignedToId = workOrder
        ? workOrder.assignedToId || workOrder.AssignedToId
        : null;

      if (assignedToId) {
        allowedUserIds.add(assignedToId);
      }

      const workOrderProjectId = workOrder
        ? workOrder.projectId || workOrder.ProjectId
        : projectId;

      const project = this.projects.find(
        (p: any) => (p.id || p.Id) === workOrderProjectId,
      );

      if (project) {
        const leaderId = project.projectLeaderId || project.ProjectLeaderId;

        if (leaderId) {
          allowedUserIds.add(leaderId);
        }

        const members = project.members || project.Members || [];

        members.forEach((member: any) => {
          const memberId =
            member.id || member.Id || member.userId || member.UserId;

          if (memberId) {
            allowedUserIds.add(memberId);
          }
        });
      }

      this.users = this.allUsers.filter((user: any) =>
        allowedUserIds.has(user.value),
      );

      this.cdr.markForCheck();
      return;
    }

    // CASE 2: Project selected
    if (projectId) {
      const project = this.projects.find(
        (p: any) => (p.id || p.Id) === projectId,
      );

      if (!project) {
        this.users = [];
        this.cdr.markForCheck();
        return;
      }

      const leaderId = project.projectLeaderId || project.ProjectLeaderId;

      if (leaderId) {
        allowedUserIds.add(leaderId);
      }

      const members = project.members || project.Members || [];

      members.forEach((member: any) => {
        const memberId =
          member.id || member.Id || member.userId || member.UserId;

        if (memberId) {
          allowedUserIds.add(memberId);
        }
      });

      this.users = this.allUsers.filter((user: any) =>
        allowedUserIds.has(user.value),
      );

      this.cdr.markForCheck();
      return;
    }

    // CASE 3: No Project / Work Order
    this.users = [...this.allUsers];
    this.cdr.markForCheck();
  }

  enableViewMode(): void {
    this.isViewMode = true;
    this.isEditMode = false;

    this.taskForm.disable();

    this.cdr.markForCheck();
  }

  enableEdit(): void {
    this.isViewMode = false;
    this.isEditMode = true;

    this.taskForm.enable();

    // Project and Work Order remain read-only.
    this.taskForm.get('projectId')?.disable();
    this.taskForm.get('workOrderId')?.disable();

    this.cdr.markForCheck();
  }
}
