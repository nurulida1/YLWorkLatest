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

@Component({
  selector: 'app-work-order-details',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonModule],
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
            <div
              class="section-heading flex flex-row items-center justify-between"
            >
              <div class="flex flex-row items-center gap-4">
                <div class="section-icon">
                  <i class="pi pi-list-check"></i>
                </div>
                <div>
                  <b class="text-lg">Work Order Tasks</b>
                  <p class="section-description">
                    Individual activities required to complete this work order.
                  </p>
                </div>
              </div>
              <p-button
                label="Add Task"
                icon="pi pi-plus"
                styleClass="bg-blue-700! hover:bg-blue-500! border-none!"
              ></p-button>
            </div>

            <div class="p-5 sm:p-6">
              @if (workOrder.tasks?.length) {
                <div class="divide-y divide-slate-100">
                  @for (task of workOrder.tasks; track task.id) {
                    <div
                      class="flex flex-col justify-between gap-2 py-4 sm:flex-row sm:items-center"
                    >
                      <div>
                        <p class="text-sm font-semibold text-slate-800">
                          {{ task.title }}
                        </p>
                        <p class="mt-1 text-xs text-slate-500">
                          {{ task.assignedToName || 'Unassigned' }}
                        </p>
                      </div>

                      <span
                        class="w-fit rounded-full px-3 py-1 text-xs font-semibold"
                        [ngClass]="getStatusClass(task.status)"
                      >
                        {{ formatLabel(task.status) }}
                      </span>
                    </div>
                  }
                </div>
              } @else {
                <div
                  class="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center"
                >
                  <i class="pi pi-list-check text-2xl text-slate-400"></i>
                  <p class="mt-3 text-sm font-medium text-slate-600">
                    No tasks linked to this work order yet.
                  </p>
                  <p class="mt-1 text-xs text-slate-400">
                    Work execution tasks will appear here when they are created.
                  </p>
                </div>
              }
            </div>
          </section>
        }
      </div>
    </div>
  `,
  styleUrl: './work-order-details.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkOrderDetails implements OnInit {
  private readonly workOrderService = inject(WorkOrderService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = false;
  errorMessage = '';
  currentId: string | null = null;

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
      case 'assigned':
        return 'bg-indigo-100 text-indigo-700';
      case 'pendingverification':
        return 'bg-purple-100 text-purple-700';
      case 'onhold':
        return 'bg-orange-100 text-orange-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      case 'open':
        return 'bg-slate-100 text-slate-700';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  }
}
