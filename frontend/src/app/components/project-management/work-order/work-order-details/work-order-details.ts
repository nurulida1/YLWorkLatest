import { CommonModule, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { WorkOrderService } from '../../../../services/WorkOrderService';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { FormsModule } from '@angular/forms';
import { StaffTaskService } from '../../../../services/staffTaskService';

@Component({
  selector: 'app-work-order-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ButtonModule,
    DialogModule,
    CheckboxModule,
    FormsModule,
  ],
  template: `
    <div class="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div class="mx-auto space-y-6">
        <!-- Header -->
        <div
          class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
        >
          <div>
            <div class="mb-2 flex items-center gap-2 text-sm text-slate-500">
              <a class="cursor-pointer hover:text-blue-600" (click)="back()">
                Work Orders
              </a>
              <i class="pi pi-angle-right"></i>
              <span class="text-slate-700">Details</span>
            </div>

            <h1 class="text-2xl font-bold text-slate-800">
              Work Order Details
            </h1>

            <p class="mt-1 text-slate-500">
              View work order information, assignments and execution details.
            </p>
          </div>

          <div class="flex gap-2">
            <button
              type="button"
              class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              (click)="back()"
            >
              <i class="pi pi-arrow-left mr-2"></i>
              Back
            </button>

            @if (workOrder) {
              <button
                type="button"
                class="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
                (click)="edit()"
              >
                <i class="pi pi-pencil mr-2"></i>
                Edit Work Order
              </button>
            }
          </div>
        </div>

        <!-- Loading -->
        @if (loading) {
          <div
            class="rounded-xl border border-slate-200 bg-white p-12 text-center"
          >
            <i class="pi pi-spin pi-spinner text-3xl text-blue-600"></i>
            <p class="mt-3 text-sm text-slate-500">Loading work order...</p>
          </div>
        }

        <!-- Error -->
        @if (!loading && errorMessage) {
          <div
            class="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700"
          >
            <i class="pi pi-exclamation-circle mr-2"></i>
            {{ errorMessage }}
          </div>
        }

        @if (!loading && workOrder) {
          <!-- Work Order Summary -->
          <section
            class="overflow-hidden rounded-xl border border-slate-200 bg-white"
          >
            <div class="border-b border-slate-200 p-5 sm:p-6">
              <div
                class="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"
              >
                <div>
                  <div class="mb-2 text-sm font-medium text-blue-700">
                    {{ workOrder.workOrderNo || 'Work Order' }}
                  </div>

                  <h2 class="text-xl font-bold text-slate-800">
                    {{ workOrder.title || '-' }}
                  </h2>

                  <p class="mt-2 text-sm text-slate-500">
                    {{ workOrder.project?.projectCode || '-' }}
                    <span class="mx-1">·</span>
                    {{
                      workOrder.project?.projectTitle ||
                        'No project information'
                    }}
                  </p>
                </div>

                <div class="flex flex-wrap gap-2">
                  <span
                    class="rounded-full px-3 py-1 text-xs font-semibold"
                    [ngClass]="getPriorityClass(workOrder.priority)"
                  >
                    {{ formatLabel(workOrder.priority) }} Priority
                  </span>

                  <span
                    class="rounded-full px-3 py-1 text-xs font-semibold"
                    [ngClass]="getStatusClass(workOrder.status)"
                  >
                    {{ formatLabel(workOrder.status) }}
                  </span>
                </div>
              </div>
            </div>

            <div
              class="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-6"
            >
              <div>
                <p class="detail-label">Work Type</p>
                <p class="detail-value">
                  {{ formatLabel(workOrder.workType) }}
                </p>
              </div>

              <div>
                <p class="detail-label">Scheduled Date</p>
                <p class="detail-value">
                  {{
                    workOrder.scheduledDate
                      ? (workOrder.scheduledDate | date: 'dd MMM yyyy')
                      : '-'
                  }}
                </p>
              </div>

              <div>
                <p class="detail-label">Due Date</p>
                <p class="detail-value">
                  {{
                    workOrder.dueDate
                      ? (workOrder.dueDate | date: 'dd MMM yyyy')
                      : '-'
                  }}
                </p>
              </div>

              <div>
                <p class="detail-label">Created Date</p>
                <p class="detail-value">
                  {{
                    workOrder.createdAt
                      ? (workOrder.createdAt | date: 'dd MMM yyyy')
                      : '-'
                  }}
                </p>
              </div>
            </div>
          </section>

          <!-- Project Information -->
          <section class="rounded-xl border border-slate-200 bg-white">
            <div class="section-heading">
              <div class="section-icon">
                <i class="pi pi-briefcase"></i>
              </div>
              <div>
                <b class="text-lg">Project Information</b>
                <p class="section-description">
                  Project and client associated with this work order.
                </p>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">
              <div>
                <p class="detail-label">Project Code</p>
                <div
                  class="detail-value cursor-pointer hover:underline text-blue-700"
                  [routerLink]="['/projects/details']"
                  [queryParams]="{ id: workOrder.projectId }"
                >
                  {{ workOrder.project?.projectCode || '-' }}
                </div>
              </div>

              <div>
                <p class="detail-label">Project Title</p>
                <p class="detail-value">
                  {{ workOrder.project?.projectTitle || '-' }}
                </p>
              </div>

              <div>
                <p class="detail-label">Client</p>
                <p class="detail-value">
                  {{ workOrder.project?.clientName || '-' }}
                </p>
              </div>

              <div>
                <p class="detail-label">Project Location</p>
                <p class="detail-value">
                  {{ workOrder.project?.location || '-' }}
                </p>
              </div>
            </div>
          </section>

          <!-- Work Description -->
          <section class="rounded-xl border border-slate-200 bg-white">
            <div class="section-heading">
              <div class="section-icon">
                <i class="pi pi-file-edit"></i>
              </div>
              <div>
                <b class="text-lg">Description / Scope of Work</b>
                <p class="section-description">
                  Details of the work to be carried out.
                </p>
              </div>
            </div>

            <div class="p-5 sm:p-6">
              <p class="whitespace-pre-line leading-7 text-slate-700">
                {{ workOrder.description || 'No description provided.' }}
              </p>
            </div>
          </section>

          <!-- Assignment -->
          <section class="rounded-xl border border-slate-200 bg-white">
            <div class="section-heading">
              <div class="section-icon">
                <i class="pi pi-users"></i>
              </div>
              <div>
                <b class="text-lg">Assignment</b>
                <p class="section-description">
                  Person in charge and assigned team members.
                </p>
              </div>
            </div>

            <div class="space-y-6 p-5 sm:p-6">
              <!-- PIC -->
              <div>
                <p class="detail-label mb-3">Person In Charge (PIC)</p>

                @if (workOrder.assignedTo) {
                  <div class="flex items-center gap-3">
                    <div class="member-avatar text-lg">
                      {{
                        getInitial(
                          workOrder.assignedTo.displayName ||
                            workOrder.assignedTo.fullName
                        )
                      }}
                    </div>
                    <div>
                      <p class="font-semibold text-slate-800">
                        {{
                          workOrder.assignedTo.displayName ||
                            workOrder.assignedTo.fullName
                        }}
                      </p>
                      <p class="text-sm text-slate-500">Person In Charge</p>
                    </div>
                  </div>
                } @else {
                  <p class="text-sm text-slate-400">No PIC assigned.</p>
                }
              </div>

              <div class="border-t border-slate-100"></div>

              <!-- Team Members -->
              <div>
                <div class="mb-3 flex items-center justify-between">
                  <p class="detail-label">Assigned Team Members</p>
                  <span
                    class="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                  >
                    {{ workOrder.workOrderMembers?.length || 0 }} Members
                  </span>
                </div>

                @if (workOrder.workOrderMembers?.length) {
                  <div
                    class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
                  >
                    @for (
                      member of workOrder.workOrderMembers;
                      track member.userId
                    ) {
                      <div
                        class="flex items-center gap-3 rounded-lg border border-slate-200 p-3"
                      >
                        <div class="member-avatar">
                          {{
                            getInitial(
                              member.user.displayName || member.user.fullName
                            )
                          }}
                        </div>
                        <div class="min-w-0">
                          <p class="truncate font-semibold text-slate-800">
                            {{
                              member.user.displayName || member.user.fullName
                            }}
                          </p>
                          <p class="text-sm text-slate-500">
                            {{ member.user.jobTitle ?? 'Team Member' }}
                          </p>
                        </div>
                      </div>
                    }
                  </div>
                } @else {
                  <p class="text-sm text-slate-400">
                    No team members assigned.
                  </p>
                }
              </div>
            </div>
          </section>

          <!-- Schedule -->
          <section class="rounded-xl border border-slate-200 bg-white">
            <div class="section-heading">
              <div class="section-icon">
                <i class="pi pi-calendar"></i>
              </div>
              <div>
                <h2 class="section-title">Schedule</h2>
                <p class="section-description">
                  Planned work dates and expected completion.
                </p>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">
              <div>
                <p class="detail-label">Scheduled Date</p>
                <p class="detail-value">
                  {{
                    workOrder.scheduledDate
                      ? (workOrder.scheduledDate | date: 'EEEE, dd MMMM yyyy')
                      : 'Not scheduled'
                  }}
                </p>
              </div>

              <div>
                <p class="detail-label">Due Date</p>
                <p class="detail-value">
                  {{
                    workOrder.dueDate
                      ? (workOrder.dueDate | date: 'EEEE, dd MMMM yyyy')
                      : 'No due date'
                  }}
                </p>
              </div>
            </div>
          </section>

          <!-- Related Tasks -->
          <section class="rounded-xl border border-slate-200 bg-white">
            <!-- Header -->
            <div class="section-heading">
              <div
                class="flex w-full flex-col justify-between gap-4 sm:flex-row sm:items-center"
              >
                <div class="flex items-center gap-4">
                  <div class="section-icon">
                    <i class="pi pi-list-check"></i>
                  </div>

                  <div>
                    <b class="text-lg">Work Order Tasks</b>
                    <p class="section-description">
                      Individual activities required to complete this work
                      order.
                    </p>
                  </div>
                </div>

                <p-button
                  label="Add Task"
                  icon="pi pi-plus"
                  size="small"
                  styleClass="bg-blue-700! hover:bg-blue-500! border-none!"
                  [routerLink]="'/staff-tasks/form'"
                  [queryParams]="{
                    projectId: workOrder.projectId,
                    workOrderId: workOrder.id,
                  }"
                />
              </div>
            </div>

            <div class="space-y-5 p-5 sm:p-6">
              <!-- Task Summary -->
              <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div class="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p class="text-sm text-slate-500">Total Tasks</p>
                  <p class="mt-1 text-2xl font-bold text-slate-800">
                    {{ totalTasks }}
                  </p>
                </div>

                <div class="rounded-lg border border-green-200 bg-green-50 p-4">
                  <p class="text-sm text-green-700">Completed</p>
                  <p class="mt-1 text-2xl font-bold text-green-700">
                    {{ completedTasks }}
                  </p>
                </div>

                <div
                  class="rounded-lg border border-orange-200 bg-orange-50 p-4"
                >
                  <p class="text-sm text-orange-700">Outstanding</p>
                  <p class="mt-1 text-2xl font-bold text-orange-700">
                    {{ outstandingTasks }}
                  </p>
                </div>
              </div>

              <!-- Progress -->
              @if (totalTasks > 0) {
                <div>
                  <div class="mb-2 flex items-center justify-between">
                    <span class="text-sm font-semibold text-slate-700">
                      Task Completion
                    </span>

                    <span class="text-sm font-semibold text-blue-700">
                      {{ taskCompletionPercentage }}%
                    </span>
                  </div>

                  <div class="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      class="h-full rounded-full bg-blue-600 transition-all duration-300"
                      [style.width.%]="taskCompletionPercentage"
                    ></div>
                  </div>
                </div>
              }

              <!-- Task List -->
              @if (workOrder.tasks?.length) {
                <div class="space-y-3">
                  @for (task of workOrder.tasks; track task.id) {
                    <div
                      class="cursor-pointer rounded-xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-slate-50/50"
                      (click)="viewTask(task)"
                    >
                      <div
                        class="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"
                      >
                        <!-- Task Information -->
                        <div class="min-w-0 flex-1">
                          <div class="flex flex-wrap items-center gap-2">
                            <h3 class="font-semibold text-slate-800">
                              {{ task.title }}
                            </h3>

                            <span
                              class="rounded-full px-2.5 py-1 text-xs font-semibold"
                              [ngClass]="getStatusClass(task.status)"
                            >
                              {{ formatLabel(task.status) }}
                            </span>
                          </div>

                          @if (task.description) {
                            <p
                              class="mt-2 whitespace-pre-line text-sm leading-6 text-slate-500"
                            >
                              {{ task.description }}
                            </p>
                          }

                          <div
                            class="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500"
                          >
                            <span class="flex items-center gap-1.5">
                              <i class="pi pi-user text-xs!"></i>
                              {{
                                task.assignedToName ||
                                  task.assignedTo?.displayName ||
                                  task.assignedTo?.fullName ||
                                  'Unassigned'
                              }}
                            </span>

                            <span class="flex items-center gap-1.5">
                              <i class="pi pi-calendar text-xs!"></i>
                              {{
                                task.dueDate
                                  ? (task.dueDate | date: 'dd MMM yyyy')
                                  : 'No due date'
                              }}
                            </span>

                            @if (task.category) {
                              <span class="flex items-center gap-1.5">
                                <i class="pi pi-folder text-xs!"></i>
                                {{ formatLabel(task.category) }}
                              </span>
                            }
                          </div>
                        </div>

                        <!-- Priority -->
                        <div class="flex shrink-0 items-center">
                          <span
                            class="rounded-full px-3 py-1 text-xs font-semibold"
                            [ngClass]="getPriorityClass(task.priority)"
                          >
                            {{ formatLabel(task.priority || 'Normal') }}
                          </span>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <!-- Empty State -->
                <div
                  class="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center"
                >
                  <div
                    class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50"
                  >
                    <i class="pi pi-list-check text-2xl text-blue-600"></i>
                  </div>

                  <h3 class="mt-4 font-semibold text-slate-800">
                    No tasks linked to this work order
                  </h3>

                  <p class="mt-1 text-sm text-slate-500 mb-3">
                    Create tasks to break down this work order into individual
                    activities.
                  </p>

                  <p-button
                    label="Create First Task"
                    icon="pi pi-plus"
                    size="small"
                    styleClass="bg-blue-700! hover:bg-blue-500! border-none! py-2!"
                    [routerLink]="'/staff-tasks/form'"
                    [queryParams]="{
                      projectId: workOrder.projectId,
                      workOrderId: workOrder.id,
                    }"
                  />
                </div>
              }
            </div>
          </section>
        }
      </div>
    </div>

    <p-dialog
      header="Task Details"
      [(visible)]="taskDialogVisible"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '650px', maxWidth: '95vw' }"
      [breakpoints]="{ '768px': '95vw' }"
    >
      @if (selectedTask) {
        <div class="space-y-5">
          <!-- Task Information -->
          <div>
            <div class="mb-2 flex flex-wrap items-center gap-2">
              <h3 class="text-lg font-bold text-slate-800">
                {{ selectedTask.title }}
              </h3>

              <span
                class="rounded-full px-2.5 py-1 text-xs font-semibold"
                [ngClass]="getStatusClass(selectedTask.status)"
              >
                {{ formatLabel(selectedTask.status) }}
              </span>
            </div>

            <p class="whitespace-pre-line text-sm leading-6 text-slate-600">
              {{ selectedTask.description || 'No description provided.' }}
            </p>
          </div>

          <!-- Task Information -->
          <div class="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4">
            <div>
              <p class="text-xs text-slate-500">Assigned To</p>
              <p class="mt-1 text-sm font-medium text-slate-800">
                {{
                  selectedTask.assignedToName ||
                    selectedTask.assignedTo?.displayName ||
                    selectedTask.assignedTo?.fullName ||
                    'Unassigned'
                }}
              </p>
            </div>

            <div>
              <p class="text-xs text-slate-500">Priority</p>
              <p class="mt-1 text-sm font-medium text-slate-800">
                {{ formatLabel(selectedTask.priority || 'Normal') }}
              </p>
            </div>

            <div>
              <p class="text-xs text-slate-500">Due Date</p>
              <p class="mt-1 text-sm font-medium text-slate-800">
                {{
                  selectedTask.dueDate
                    ? (selectedTask.dueDate | date: 'dd MMM yyyy')
                    : 'No due date'
                }}
              </p>
            </div>

            <div>
              <p class="text-xs text-slate-500">Category</p>
              <p class="mt-1 text-sm font-medium text-slate-800">
                {{ formatLabel(selectedTask.category || '-') }}
              </p>
            </div>
          </div>

          <!-- Checklist -->
          <div>
            <div class="mb-3 flex items-center justify-between">
              <h4 class="font-semibold text-slate-800">Checklist</h4>

              <span class="text-xs text-slate-500">
                {{ completedChecklistCount }}/{{ taskChecklists.length }}
                completed
              </span>
            </div>

            <!-- Checklist Progress -->
            <div class="mb-4">
              <div class="mb-2 flex justify-between text-xs text-slate-500">
                <span>Checklist Progress</span>
                <span>{{ checklistProgress }}%</span>
              </div>

              <div class="h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  class="h-full rounded-full bg-blue-600 transition-all"
                  [style.width.%]="checklistProgress"
                ></div>
              </div>
            </div>

            @if (loadingTask) {
              <div class="py-8 text-center text-sm text-slate-500">
                Loading checklist...
              </div>
            } @else if (taskChecklists.length) {
              <div class="space-y-2">
                @for (item of taskChecklists; track item.id) {
                  <div
                    class="flex items-start gap-3 rounded-lg border border-slate-200 p-3"
                  >
                    <p-checkbox
                      [(ngModel)]="item.isCompleted"
                      [binary]="true"
                      [inputId]="'check-' + item.id"
                      [disabled]="savingChecklist"
                    />

                    <label
                      [for]="'check-' + item.id"
                      class="cursor-pointer text-sm"
                      [ngClass]="{
                        'text-slate-400 line-through': item.isCompleted,
                        'text-slate-700': !item.isCompleted,
                      }"
                    >
                      {{ item.title }}
                    </label>
                  </div>
                }
              </div>
            } @else {
              <div
                class="rounded-lg border border-dashed border-slate-300 p-6 text-center"
              >
                <i class="pi pi-list-check text-2xl text-slate-400"></i>
                <p class="mt-2 text-sm text-slate-500">
                  No checklist items available.
                </p>
              </div>
            }
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <p-button
              label="Close"
              severity="secondary"
              [outlined]="true"
              (onClick)="taskDialogVisible = false"
            />

            <p-button
              label="Save Checklist"
              icon="pi pi-save"
              [loading]="savingChecklist"
              styleClass="bg-blue-700! border-none! hover:bg-blue-500!"
              [disabled]="loadingTask || !taskChecklists.length"
              (onClick)="saveChecklist()"
            />
          </div>
        </div>
      }
    </p-dialog>
  `,
  styleUrl: './work-order-details.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkOrderDetails implements OnInit {
  private readonly workOrderService = inject(WorkOrderService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly staffTaskService = inject(StaffTaskService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messageService = inject(MessageService);

  loading: boolean = false;
  taskDialogVisible: boolean = false;
  loadingTask: boolean = false;
  savingChecklist: boolean = false;

  errorMessage: string = '';
  currentId: string | null = null;

  selectedTask: any = null;
  taskChecklists: any[] = [];

  // Matches the GetOne response structure.
  workOrder: any = null;

  ngOnInit(): void {
    this.currentId =
      this.activatedRoute.snapshot.paramMap.get('id') ||
      this.activatedRoute.snapshot.queryParamMap.get('id');

    if (!this.currentId) {
      this.errorMessage = 'Work order ID was not provided.';
      return;
    }

    this.loadWorkOrder();
  }

  loadWorkOrder(): void {
    if (!this.currentId) return;

    this.loading = true;
    this.errorMessage = '';

    this.workOrderService
      .GetOne(this.currentId)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          this.workOrder = response;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Failed to load work order:', error);
          this.errorMessage =
            error.error?.message ||
            error.error?.Message ||
            'Unable to load work order details.';
        },
      });
  }

  back(): void {
    this.router.navigate(['/work-order']);
  }

  edit(): void {
    if (!this.currentId) return;

    // Adjust this route if your Work Order form uses a different route.
    this.router.navigate(['/work-order/form'], {
      queryParams: { id: this.currentId },
    });
  }

  formatLabel(value?: string | null): string {
    if (!value) return '-';

    return value
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
  }

  getInitial(name?: string | null): string {
    return name?.trim()?.charAt(0)?.toUpperCase() || '?';
  }

  getPriorityClass(priority?: string): string {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return 'bg-red-100 text-red-700';
      case 'high':
        return 'bg-orange-100 text-orange-700';
      case 'medium':
      case 'normal':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  }

  getStatusClass(status?: string): string {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-700';

      case 'inprogress':
        return 'bg-blue-100 text-blue-700';

      case 'pending':
        return 'bg-orange-100 text-orange-700';

      case 'todo':
        return 'bg-slate-100 text-slate-700';

      case 'cancelled':
        return 'bg-red-100 text-red-700';

      default:
        return 'bg-slate-100 text-slate-600';
    }
  }

  get totalTasks(): number {
    return this.workOrder?.tasks?.length || 0;
  }

  get completedTasks(): number {
    return (this.workOrder?.tasks || []).filter(
      (task: any) => task.status?.toLowerCase() === 'completed',
    ).length;
  }

  get outstandingTasks(): number {
    return this.totalTasks - this.completedTasks;
  }

  get taskCompletionPercentage(): number {
    if (!this.totalTasks) return 0;

    return Math.round((this.completedTasks / this.totalTasks) * 100);
  }

  viewTask(task: any): void {
    this.selectedTask = task;
    this.taskDialogVisible = true;
    this.loadingTask = true;
    this.taskChecklists = [];

    this.staffTaskService.GetOne(task.id).subscribe({
      next: (res: any) => {
        const data = res.data || res;

        this.selectedTask = data;

        this.taskChecklists = (data.checklists || data.Checklists || [])
          .map((item: any) => ({
            id: item.id || item.Id,
            title: item.title || item.Title,
            isCompleted: item.isCompleted ?? item.IsCompleted ?? false,
            sequence: item.sequence || item.Sequence || 0,
          }))
          .sort((a: any, b: any) => a.sequence - b.sequence);

        this.loadingTask = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingTask = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load task details.',
        });
        this.cdr.markForCheck();
      },
    });
  }

  saveChecklist(): void {
    if (!this.selectedTask?.id) return;

    this.savingChecklist = true;

    const request = {
      id: this.selectedTask.id,
      checklists: this.taskChecklists.map((item: any) => ({
        id: item.id,
        isCompleted: item.isCompleted,
        sequence: item.sequence,
      })),
    };

    this.staffTaskService.UpdateChecklist(request).subscribe({
      next: (res: any) => {
        const updatedTask = res.data || res;

        this.selectedTask = updatedTask;

        this.taskChecklists = (
          updatedTask.checklists ||
          updatedTask.Checklists ||
          []
        ).map((item: any) => ({
          id: item.id || item.Id,
          title: item.title || item.Title,
          isCompleted: item.isCompleted ?? item.IsCompleted ?? false,
          sequence: item.sequence || item.Sequence || 0,
        }));

        // Update the task in the Work Order task list
        const taskIndex = this.workOrder.tasks.findIndex(
          (x: any) => x.id === updatedTask.id,
        );

        if (taskIndex !== -1) {
          this.workOrder.tasks[taskIndex] = {
            ...this.workOrder.tasks[taskIndex],
            ...updatedTask,
          };
        }

        this.savingChecklist = false;

        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Checklist updated successfully.',
        });

        this.cdr.markForCheck();
      },
      error: () => {
        this.savingChecklist = false;

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to update checklist.',
        });

        this.cdr.markForCheck();
      },
    });
  }

  get completedChecklistCount(): number {
    return this.taskChecklists.filter((item: any) => item.isCompleted).length;
  }

  get checklistProgress(): number {
    if (!this.taskChecklists.length) return 0;

    return Math.round(
      (this.completedChecklistCount / this.taskChecklists.length) * 100,
    );
  }
}
