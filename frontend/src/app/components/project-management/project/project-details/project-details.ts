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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { LoadingService } from '../../../../services/loading.service';
import { ProjectService } from '../../../../services/ProjectService';
import { ProjectDto } from '../../../../models/Project';
import { Subject, takeUntil } from 'rxjs';
import { TabsModule } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import {
  FormArray,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ProgressBarModule } from 'primeng/progressbar';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { MultiSelectModule } from 'primeng/multiselect';
import { TextareaModule } from 'primeng/textarea';
import { ValidateAllFormFields } from '../../../../shared/helpers/helpers';
import { TagModule } from 'primeng/tag';
import { ChipModule } from 'primeng/chip';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { JobSheetDto } from '../../../../models/JobSheets';
import { JobSheetService } from '../../../../services/JobSheetService';
import { DrawerModule } from 'primeng/drawer';
import { StaffTaskService } from '../../../../services/staffTaskService';
import { StaffTaskDto } from '../../../../models/StaffTask';
import { UserService } from '../../../../services/userService.service';

@Component({
  selector: 'app-project-details',
  imports: [
    CommonModule,
    RouterLink,
    ButtonModule,
    TabsModule,
    TableModule,
    SelectModule,
    FormsModule,
    ProgressBarModule,
    DialogModule,
    ReactiveFormsModule,
    InputTextModule,
    DatePickerModule,
    MultiSelectModule,
    TextareaModule,
    TagModule,
    AvatarModule,
    ChipModule,
    TooltipModule,
    ConfirmDialogModule,
    DrawerModule,
  ],
  template: `
    <main class="project-details min-h-screen bg-slate-50 p-3 sm:p-5 lg:p-6">
      <!-- Breadcrumb -->
      <nav class="mb-5 flex flex-wrap items-center gap-2 text-slate-500">
        <a routerLink="/dashboard" class="transition hover:text-blue-700"
          >Dashboard</a
        >
        <i class="pi pi-angle-right text-[10px]"></i>
        <a routerLink="/projects" class="transition hover:text-blue-700"
          >Projects</a
        >
        <i class="pi pi-angle-right text-[10px]"></i>
        <span class="font-semibold text-slate-800">
          {{ PagingSignal().projectCode || 'Project Details' }}
        </span>
      </nav>

      <!-- Project heading -->
      <section class="project-heading">
        <div class="flex min-w-0 items-start gap-4">
          <div class="project-heading-icon">
            <i class="pi pi-briefcase"></i>
          </div>

          <div class="min-w-0 flex-1">
            <p
              class="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400"
            >
              Project details
            </p>

            <h1
              class="break-words text-xl font-bold tracking-tight text-slate-900 sm:text-2xl"
            >
              {{ PagingSignal().projectTitle || 'Loading project...' }}
            </h1>

            <div
              class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 sm:text-sm"
            >
              <span class="font-semibold text-blue-700">
                {{ PagingSignal().projectCode || '-' }}
              </span>
              <span class="hidden text-slate-300 sm:inline">|</span>
              <span>
                <i class="pi pi-building mr-1 text-slate-400"></i>
                {{ PagingSignal().client.name || 'No client assigned' }}
              </span>
            </div>
          </div>
        </div>

        <div class="project-heading-actions">
          <div class="flex flex-col gap-1">
            <label class="text-[11px] font-semibold text-slate-500"
              >Project status</label
            >
            <p-select
              appendTo="body"
              [options]="[
                { label: 'Draft', value: 'Draft' },
                { label: 'Planning', value: 'Planning' },
                { label: 'WIP', value: 'WIP' },
                { label: 'On Hold', value: 'OnHold' },
                { label: 'Cancelled', value: 'Cancelled' },
              ]"
              [(ngModel)]="PagingSignal().status"
              styleClass="w-full sm:min-w-40"
            ></p-select>
          </div>

          <p-button
            label="Export Report"
            icon="pi pi-file-pdf"
            severity="secondary"
            [outlined]="true"
            styleClass="w-full sm:w-auto"
          ></p-button>
        </div>

        <div class="project-heading-meta text-xs">
          <span class="project-meta-item">
            <i class="pi pi-circle-fill text-[5px]!"></i>
            {{
              PagingSignal().status === 'InProgress'
                ? 'In Progress'
                : PagingSignal().status || 'Not set'
            }}
          </span>
          <span class="project-meta-item">
            <i class="pi pi-flag"></i>
            {{ PagingSignal().priority || 'Normal' }} priority
          </span>
          <span class="project-meta-item">
            <i class="pi pi-calendar"></i>
            {{
              PagingSignal().startDate
                ? (PagingSignal().startDate | date: 'dd MMM yyyy')
                : 'No start date'
            }}
          </span>
        </div>
      </section>

      <!-- Summary -->
      <section class="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <article class="project-summary-card">
          <div class="flex items-center justify-between gap-2">
            <span class="text-gray-500 text-sm">Project progress</span>
            <span class="project-summary-icon"
              ><i class="pi pi-chart-line"></i
            ></span>
          </div>
          <div class="mt-4 flex items-end justify-between gap-2">
            <span class="project-summary-value">0%</span>
            <span class="text-[10px] text-slate-400">Completion</span>
          </div>
          <p-progressbar
            [value]="0"
            [showValue]="false"
            styleClass="mt-3 h-1.5!"
          ></p-progressbar>
          <p class="mt-2 text-[11px] text-slate-400">
            Overall project completion
          </p>
        </article>

        <article class="project-summary-card">
          <div class="flex items-center justify-between gap-2">
            <span class="text-gray-500 text-sm">Work Orders</span>
            <span class="project-summary-icon">
              <i class="pi pi-clipboard"></i>
            </span>
          </div>

          <p class="project-summary-value mt-4 break-words text-xl sm:text-2xl">
            {{ PagingSignal().workOrders?.length ?? 0 }}
          </p>

          <p class="mt-2 text-[11px] text-slate-400">
            Total project work orders
          </p>
        </article>

        <article class="project-summary-card">
          <div class="flex items-center justify-between gap-2">
            <span class="text-gray-500 text-sm">Project tasks</span>
            <span class="project-summary-icon"
              ><i class="pi pi-list-check"></i
            ></span>
          </div>
          <p class="project-summary-value mt-4">
            {{ PagingSignal().staffTasks.length || 0 }}
          </p>
          <p class="mt-2 text-[11px] text-slate-400">Total assigned tasks</p>
        </article>

        <article class="project-summary-card">
          <div class="flex items-center justify-between gap-2">
            <span class="text-gray-500 text-sm">Material requests</span>
            <span class="project-summary-icon"><i class="pi pi-box"></i></span>
          </div>
          <p class="project-summary-value mt-4">
            {{ PagingSignal().siteMaterialRequests?.length || 0 }}
          </p>
          <p class="mt-2 text-[11px] text-slate-400">Total material requests</p>
        </article>
      </section>

      <!-- Main tabs -->
      <section class="project-main mt-5">
        <p-tabs value="0">
          <p-tablist styleClass="project-detail-tabs">
            <p-tab value="0">
              <i class="pi pi-th-large mr-2"></i>Overview
            </p-tab>

            <p-tab value="1">
              <i class="pi pi-clipboard mr-2"></i>Work Orders
              <span class="project-tab-count">
                {{ PagingSignal().workOrders?.length || 0 }}
              </span>
            </p-tab>

            <p-tab value="2">
              <i class="pi pi-list-check mr-2"></i>Tasks
              <span class="project-tab-count">
                {{ directProjectTasks?.length || 0 }}
              </span>
            </p-tab>

            <p-tab value="3">
              <i class="pi pi-box mr-2"></i>Materials
              <span class="project-tab-count">
                {{ PagingSignal().siteMaterialRequests?.length || 0 }}
              </span>
            </p-tab>

            <p-tab value="4">
              <i class="pi pi-clipboard mr-2"></i>Job Sheets
              <span class="project-tab-count">{{ jobSheets.length }}</span>
            </p-tab>
          </p-tablist>

          <p-tabpanels>
            <!-- OVERVIEW -->
            <p-tabpanel value="0">
              <div class="grid grid-cols-1 gap-5 xl:grid-cols-3">
                <div class="min-w-0 space-y-5 xl:col-span-2">
                  <!-- Description -->
                  <section class="project-panel">
                    <div class="project-panel-heading">
                      <span class="project-panel-icon"
                        ><i class="pi pi-align-left"></i
                      ></span>
                      <div>
                        <h2 class="project-panel-title">Project description</h2>
                        <p class="project-panel-subtitle">
                          Overview and scope of work
                        </p>
                      </div>
                    </div>
                    <p
                      class="whitespace-pre-line leading-7 text-slate-600 pt-3"
                    >
                      {{
                        PagingSignal().description ||
                          'No project description provided.'
                      }}
                    </p>
                  </section>

                  <!-- Client and project leader -->
                  <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <section class="project-panel">
                      <div class="project-panel-heading">
                        <span class="project-panel-icon"
                          ><i class="pi pi-building"></i
                        ></span>
                        <div>
                          <h3 class="project-panel-title">
                            Client information
                          </h3>
                          <p class="project-panel-subtitle">
                            Customer and project location
                          </p>
                        </div>
                      </div>

                      <div
                        class="mt-4 flex flex-col border-t border-slate-100 gap-2"
                      >
                        <p class="text-sm font-semibold text-slate-900 pt-3">
                          {{
                            PagingSignal().client.name || 'No client assigned'
                          }}
                        </p>
                        <div
                          class="flex flex-row items-center gap-2 text-sm text-slate-500"
                        >
                          <i class="pi pi-map-marker mt-0.5 text-slate-400"></i>
                          <span>{{
                            PagingSignal().location || 'No location provided'
                          }}</span>
                        </div>
                      </div>
                    </section>

                    <section class="project-panel">
                      <div class="project-panel-heading mb-3">
                        <span class="project-panel-icon"
                          ><i class="pi pi-user"></i
                        ></span>
                        <div>
                          <h3 class="project-panel-title">Project Leader</h3>
                          <p class="project-panel-subtitle">
                            Person responsible for this project
                          </p>
                        </div>
                      </div>

                      <div
                        class="flex min-w-0 items-center gap-3 border-t border-gray-100 pt-3"
                      >
                        <div class="project-person-avatar">
                          {{
                            getInitial(PagingSignal().projectLeader.fullName)
                          }}
                        </div>
                        <div class="min-w-0">
                          <p class="truncate font-semibold text-slate-900">
                            {{
                              PagingSignal().projectLeader.fullName ||
                                'Not assigned'
                            }}
                          </p>
                          <p class="mt-1 truncate text-sm text-slate-500">
                            {{ PagingSignal().projectLeader.jobTitle || '-' }}
                          </p>
                        </div>
                      </div>
                    </section>
                  </div>

                  <!-- Team -->
                  <section class="project-panel">
                    <div class="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h3 class="project-panel-title">Project team</h3>
                        <p class="project-panel-subtitle mt-1">
                          {{ PagingSignal().projectMembers.length || 0 }} team
                          members assigned
                        </p>
                      </div>
                      <span class="project-panel-icon"
                        ><i class="pi pi-users"></i
                      ></span>
                    </div>

                    <div
                      *ngIf="
                        PagingSignal().projectMembers.length;
                        else noTeamMembers
                      "
                      class="grid grid-cols-1 gap-2 sm:grid-cols-2"
                    >
                      <div
                        *ngFor="let member of PagingSignal().projectMembers"
                        class="flex min-w-0 items-center gap-3 rounded-lg border border-slate-100 p-3"
                      >
                        <div class="project-person-avatar">
                          {{ getInitial(member.user.fullName) }}
                        </div>
                        <div class="min-w-0">
                          <p class="truncate font-semibold text-slate-800">
                            {{ member.user.fullName || 'Unknown user' }}
                          </p>
                          <p class="mt-1 truncate text-sm text-slate-500">
                            {{ member.user.jobTitle || '-' }}
                          </p>
                        </div>
                      </div>
                    </div>

                    <ng-template #noTeamMembers>
                      <div class="project-empty py-7">
                        <i class="pi pi-users"></i>
                        <p>No project team members assigned.</p>
                      </div>
                    </ng-template>
                  </section>
                </div>

                <!-- Timeline -->
                <aside class="project-panel h-fit">
                  <div class="project-panel-heading">
                    <span class="project-panel-icon"
                      ><i class="pi pi-calendar"></i
                    ></span>
                    <div>
                      <h3 class="project-panel-title">Project timeline</h3>
                      <p class="project-panel-subtitle">
                        Important project dates
                      </p>
                    </div>
                  </div>

                  <div class="space-y-5">
                    <div class="project-timeline-item pt-3">
                      <span class="project-timeline-dot"></span>
                      <div>
                        <p class="text-sm text-slate-500">Start date</p>
                        <p class="mt-1 text-sm font-semibold text-slate-900">
                          {{
                            PagingSignal().startDate
                              ? (PagingSignal().startDate | date: 'dd MMM yyyy')
                              : '-'
                          }}
                        </p>
                      </div>
                    </div>

                    <div class="project-timeline-item">
                      <span class="project-timeline-dot"></span>
                      <div>
                        <p class="text-sm text-slate-500">
                          Estimated completion
                        </p>
                        <p class="mt-1 text-sm font-semibold text-slate-900">
                          {{
                            PagingSignal().estimatedCompletedDate
                              ? (PagingSignal().estimatedCompletedDate
                                | date: 'dd MMM yyyy')
                              : '-'
                          }}
                        </p>
                      </div>
                    </div>

                    <div class="border-t border-slate-100 pt-4">
                      <p class="text-sm font-medium text-slate-500">
                        Remaining days
                      </p>
                      <span
                        class="mt-2 inline-flex rounded-md px-3 py-1.5 text-sm font-semibold"
                        [ngClass]="{
                          'bg-red-50 text-red-700':
                            getRemainingDaysValue(
                              PagingSignal().estimatedCompletedDate
                            ) < 0,
                          'bg-amber-50 text-amber-700':
                            getRemainingDaysValue(
                              PagingSignal().estimatedCompletedDate
                            ) >= 0 &&
                            getRemainingDaysValue(
                              PagingSignal().estimatedCompletedDate
                            ) <= 7,
                          'bg-slate-100 text-slate-700':
                            getRemainingDaysValue(
                              PagingSignal().estimatedCompletedDate
                            ) > 7,
                        }"
                      >
                        {{
                          getRemainingDays(
                            PagingSignal().estimatedCompletedDate
                          )
                        }}
                      </span>
                    </div>
                  </div>
                </aside>
              </div>
            </p-tabpanel>
            <!-- WORK ORDERS -->
            <p-tabpanel value="1">
              <div class="project-section-toolbar">
                <div>
                  <h2 class="project-section-title text-lg">
                    Project Work Orders
                  </h2>
                  <p class="project-section-description">
                    Manage work orders and monitor the tasks assigned under each
                    work order.
                  </p>
                </div>

                <p-button
                  label="Create Work Order"
                  icon="pi pi-plus"
                  size="small"
                  styleClass="w-full sm:w-auto bg-blue-700! border-none! hover:bg-blue-500! py-2! px-4!"
                  (onClick)="ActionClick('createWorkOrder')"
                ></p-button>
              </div>

              <!-- Work Order cards -->
              <ng-container
                *ngIf="PagingSignal().workOrders?.length; else noWorkOrders"
              >
                <div class="space-y-4">
                  <article
                    *ngFor="let workOrder of PagingSignal().workOrders"
                    class="overflow-hidden rounded-xl border border-slate-200 bg-white"
                  >
                    <!-- Work Order header -->
                    <div
                      class="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div class="min-w-0">
                        <p
                          class="text-sm font-bold text-blue-700 cursor-pointer hover:underline"
                          [routerLink]="'/work-order/details'"
                          [queryParams]="{ id: workOrder.id }"
                        >
                          {{ workOrder.workOrderNo }}
                        </p>

                        <h3
                          class="mt-1 break-words text-base font-bold text-slate-900"
                        >
                          {{ workOrder.title || 'Untitled Work Order' }}
                        </h3>

                        <p
                          class="mt-1 text-sm text-slate-700 bg-slate-100 px-2 py-1 rounded-md w-fit"
                        >
                          {{ workOrder.workType || 'General Work Order' }}
                        </p>
                      </div>

                      <div class="flex flex-wrap items-center gap-2">
                        <p-tag
                          [value]="workOrder.status"
                          [severity]="
                            workOrder.status === 'Completed'
                              ? 'success'
                              : workOrder.status === 'Cancelled'
                                ? 'danger'
                                : workOrder.status === 'OnHold'
                                  ? 'warn'
                                  : workOrder.status === 'Assigned'
                                    ? 'info'
                                    : 'secondary'
                          "
                        ></p-tag>

                        <p-tag
                          [value]="workOrder.priority"
                          [severity]="
                            workOrder.priority === 'Urgent' ||
                            workOrder.priority === 'Critical'
                              ? 'danger'
                              : workOrder.priority === 'High'
                                ? 'warn'
                                : workOrder.priority === 'Medium'
                                  ? 'info'
                                  : 'success'
                          "
                        ></p-tag>
                      </div>
                    </div>

                    <!-- Work Order details -->
                    <div class="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3">
                      <div>
                        <p class="text-sm text-slate-400">Location</p>
                        <p class="mt-1 font-medium text-slate-700">
                          {{
                            workOrder.location || PagingSignal().location || '-'
                          }}
                        </p>
                      </div>

                      <div>
                        <p class="text-sm text-slate-400">Assigned to</p>
                        <p class="mt-1 font-medium text-slate-700">
                          {{ workOrder.assignedTo?.fullName || 'Not assigned' }}
                        </p>
                      </div>

                      <div>
                        <p class="text-sm text-slate-400">Tasks</p>
                        <p class="mt-1 font-medium text-slate-700">
                          {{
                            workOrder.staffTasks?.length ||
                              workOrder.taskCount ||
                              0
                          }}
                          tasks
                        </p>
                      </div>
                    </div>

                    <!-- Scope of work -->
                    <div class="border-t border-slate-100 px-4 py-3">
                      <p class="mb-1 text-sm font-semibold text-slate-500">
                        Scope of Work
                      </p>
                      <p class="whitespace-pre-line leading-6 text-slate-600">
                        {{
                          workOrder.scopeOfWork || workOrder.description || '-'
                        }}
                      </p>
                    </div>

                    <!-- Tasks under this Work Order -->
                    <div class="border-t border-slate-100 bg-slate-50/70 p-4">
                      <div
                        class="mb-3 flex flex-wrap items-center justify-between gap-2"
                      >
                        <div>
                          <h4 class="font-bold text-slate-800">
                            Assigned Tasks
                          </h4>
                          <p class="mt-1 text-sm text-slate-400">
                            Tasks associated with {{ workOrder.workOrderNo }}
                          </p>
                        </div>

                        <span
                          class="rounded-full bg-blue-50 px-2.5 py-1 text-sm font-semibold text-blue-700"
                        >
                          {{ workOrder.staffTasks?.length || 0 }} tasks
                        </span>
                      </div>

                      <ng-container
                        *ngIf="
                          workOrder.staffTasks?.length;
                          else noWorkOrderTasks
                        "
                      >
                        <div class="space-y-2">
                          <div
                            *ngFor="let task of workOrder.staffTasks"
                            class="cursor-pointer flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 transition hover:border-blue-300 hover:bg-blue-50/30 sm:flex-row sm:items-center sm:justify-between"
                            (click)="viewTask(task)"
                          >
                            <div class="min-w-0">
                              <h5
                                class="break-words font-semibold text-slate-800"
                              >
                                {{ task.title }}
                              </h5>

                              <p
                                class="mt-1 whitespace-pre-line text-sm leading-5 text-slate-500"
                              >
                                {{
                                  task.description || 'No description provided.'
                                }}
                              </p>

                              <div
                                class="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-400"
                              >
                                <span>
                                  <i class="pi pi-user mr-1 text-xs!"></i>
                                  {{
                                    task.assignedTo?.fullName || 'Not assigned'
                                  }}
                                </span>

                                <span *ngIf="task.dueDate">
                                  <i class="pi pi-calendar mr-1 text-xs!"></i>
                                  {{ task.dueDate | date: 'dd MMM yyyy' }}
                                </span>
                              </div>
                            </div>

                            <div class="flex shrink-0 items-center gap-2">
                              <p-tag
                                [value]="task.status"
                                [severity]="
                                  task.status === 'Completed'
                                    ? 'success'
                                    : task.status === 'InProgress'
                                      ? 'info'
                                      : task.status === 'Pending'
                                        ? 'warn'
                                        : task.status === 'Cancelled'
                                          ? 'danger'
                                          : 'secondary'
                                "
                              ></p-tag>

                              <i
                                class="pi pi-chevron-right text-sm text-slate-400"
                              ></i>
                            </div>
                          </div>
                        </div>
                      </ng-container>

                      <ng-template #noWorkOrderTasks>
                        <div
                          class="rounded-lg border border-dashed border-slate-200 bg-white py-6 text-center"
                        >
                          <i
                            class="pi pi-list-check text-xl! text-slate-300"
                          ></i>
                          <p class="mt-2 text-sm text-slate-400">
                            No tasks assigned to this Work Order yet.
                          </p>
                        </div>
                      </ng-template>
                    </div>
                  </article>
                </div>
              </ng-container>

              <ng-template #noWorkOrders>
                <div class="project-empty">
                  <i class="pi pi-clipboard"></i>
                  <p>No Work Orders created for this project.</p>
                </div>
              </ng-template>
            </p-tabpanel>
            <!-- TASKS -->
            <p-tabpanel value="2">
              <div class="project-section-toolbar">
                <div>
                  <h2 class="project-section-title text-lg">Project Tasks</h2>
                  <p class="project-section-description text-sm">
                    Manage milestones, task progress and team assignments.
                  </p>
                </div>
                <p-button
                  label="Add task"
                  icon="pi pi-plus"
                  size="small"
                  styleClass="w-full sm:w-auto py-2! px-3! bg-blue-700! hover:bg-blue-500! border-none!"
                  [routerLink]="'/staff-tasks/form'"
                  [queryParams]="{ projectId: PagingSignal().id }"
                ></p-button>
              </div>

              <!-- Mobile task cards -->
              <div class="space-y-3 lg:hidden">
                <ng-container *ngIf="directProjectTasks?.length; else noTasks">
                  <article
                    *ngFor="let data of directProjectTasks"
                    class="project-record"
                  >
                    <!-- Title and status -->
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0">
                        <h3
                          class="mt-1 break-words text-sm font-semibold text-slate-900"
                        >
                          {{ data.title }}
                        </h3>
                      </div>

                      <p-tag
                        [value]="data.status"
                        [severity]="
                          data.status === 'Completed'
                            ? 'success'
                            : data.status === 'InProgress'
                              ? 'info'
                              : data.status === 'Pending'
                                ? 'warn'
                                : data.status === 'Cancelled'
                                  ? 'danger'
                                  : 'secondary'
                        "
                      ></p-tag>
                    </div>

                    <!-- Description -->
                    <p
                      class="mt-3 whitespace-pre-line text-sm leading-6 text-slate-500"
                    >
                      {{ data.description || 'No description provided.' }}
                    </p>

                    <!-- Priority and due date -->
                    <div class="mt-3 flex flex-wrap items-center gap-2">
                      <p-tag
                        [value]="data.priority"
                        [severity]="
                          data.priority === 'Urgent'
                            ? 'danger'
                            : data.priority === 'High'
                              ? 'warn'
                              : data.priority === 'Medium'
                                ? 'info'
                                : 'success'
                        "
                        [rounded]="true"
                      ></p-tag>

                      <span class="text-xs text-slate-500">
                        <i class="pi pi-calendar mr-1"></i>
                        {{
                          data.dueDate
                            ? (data.dueDate | date: 'dd MMM yyyy')
                            : 'No due date'
                        }}
                      </span>
                    </div>

                    <!-- Assignee and checklist progress -->
                    <div
                      class="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3"
                    >
                      <div class="flex min-w-0 items-center gap-2">
                        <p-avatar
                          *ngIf="data.assignedTo?.fullName; else noAssignee"
                          [label]="getInitial(data.assignedTo!.fullName)"
                          shape="circle"
                          [pTooltip]="data.assignedTo!.fullName"
                          styleClass="bg-slate-100! text-slate-700! text-xs!"
                        ></p-avatar>

                        <ng-template #noAssignee>
                          <span class="text-xs text-slate-400">
                            No assignee
                          </span>
                        </ng-template>

                        <span
                          *ngIf="data.assignedTo?.fullName"
                          class="truncate text-xs text-slate-500"
                        >
                          {{ data.assignedTo?.fullName }}
                        </span>
                      </div>

                      <div
                        class="flex items-center gap-1 text-xs text-slate-500"
                      >
                        <i class="pi pi-check-square"></i>
                        <span>
                          {{ getCompletedChecklistCount(data) }}/{{
                            data.checklists?.length ?? 0
                          }}
                          completed
                        </span>
                      </div>
                    </div>

                    <!-- Actions -->
                    <div
                      *ngIf="
                        data.status !== 'Completed' &&
                        data.status !== 'Cancelled'
                      "
                      class="mt-3 flex justify-end gap-1"
                    >
                      <p-button
                        icon="pi pi-pencil"
                        [text]="true"
                        [rounded]="true"
                        severity="secondary"
                        size="small"
                        pTooltip="Edit task"
                        [routerLink]="'/staff-tasks/form'"
                        [queryParams]="{ id: data.id }"
                      ></p-button>

                      <p-button
                        *ngIf="data.assignedById === currentUserId"
                        icon="pi pi-trash"
                        [text]="true"
                        [rounded]="true"
                        severity="danger"
                        size="small"
                        pTooltip="Delete task"
                        (onClick)="RemoveTaskClick(data)"
                      ></p-button>
                    </div>
                  </article>
                </ng-container>
              </div>
              <!-- Desktop task table -->
              <div class="hidden overflow-hidden lg:block">
                <p-table
                  [value]="directProjectTasks"
                  [tableStyle]="{ 'min-width': '65rem' }"
                  showGridlines
                  size="small"
                >
                  <ng-template #header>
                    <tr>
                      <th class="text-center!">No</th>
                      <th>Task name</th>
                      <th>Description</th>
                      <th class="text-center!">Status</th>
                      <th>Assignee</th>
                      <th class="text-center!">Priority</th>
                      <th class="text-center!">Actions</th>
                    </tr>
                  </ng-template>
                  <ng-template #body let-data let-i="rowIndex">
                    <tr>
                      <td class="font-semibold  text-center!">
                        {{ i + 1 }}
                      </td>
                      <td class="font-medium text-slate-800">
                        {{ data.title }}
                      </td>
                      <td
                        class="max-w-xs whitespace-normal text-sm text-slate-500"
                      >
                        {{ data.description || '-' }}
                      </td>
                      <td class="text-center!">
                        <p-tag
                          [value]="data.status"
                          [severity]="
                            data.status === 'Completed'
                              ? 'success'
                              : data.status === 'InProgress'
                                ? 'info'
                                : data.status === 'Review'
                                  ? 'warn'
                                  : data.status === 'Cancelled'
                                    ? 'danger'
                                    : 'secondary'
                          "
                        ></p-tag>
                      </td>
                      <td>
                        <div class="flex flex-wrap gap-1">
                          <ng-container
                            *ngFor="let member of data.assignedTaskMembers"
                          >
                            <p-avatar
                              [label]="getInitial(member.user?.fullName)"
                              shape="circle"
                              pTooltip="{{ member.user?.fullName }}"
                              styleClass="bg-slate-100! text-slate-700!"
                            ></p-avatar>
                          </ng-container>
                          <span
                            *ngIf="!data.assignedTaskMembers?.length"
                            class="text-xs text-slate-400"
                            >No assignee</span
                          >
                        </div>
                      </td>
                      <td class="text-center!">
                        <p-tag
                          [value]="data.priority"
                          [severity]="
                            data.priority === 'Critical'
                              ? 'danger'
                              : data.priority === 'High'
                                ? 'warn'
                                : data.priority === 'Medium'
                                  ? 'info'
                                  : 'success'
                          "
                          [rounded]="true"
                        ></p-tag>
                      </td>
                      <td class="text-center!">
                        <div
                          *ngIf="
                            data.status !== 'Completed' &&
                            data.status !== 'Cancelled'
                          "
                          class="flex justify-center gap-1"
                        >
                          <p-button
                            icon="pi pi-pencil"
                            [text]="true"
                            [rounded]="true"
                            severity="secondary"
                            size="small"
                            pTooltip="Edit"
                            [routerLink]="'/staff-tasks/form'"
                            [queryParams]="{ id: data.id }"
                          ></p-button>
                          <p-button
                            *ngIf="data.status === 'NotStarted'"
                            icon="pi pi-trash"
                            [text]="true"
                            [rounded]="true"
                            severity="danger"
                            size="small"
                            pTooltip="Delete"
                            (onClick)="RemoveTaskClick(data)"
                          ></p-button>
                        </div>
                        <span
                          *ngIf="
                            data.status === 'Completed' ||
                            data.status === 'Cancelled'
                          "
                          class="text-slate-300"
                          >—</span
                        >
                      </td>
                    </tr>
                  </ng-template>
                  <ng-template #emptymessage>
                    <tr>
                      <td
                        colspan="7"
                        class="py-10! text-center! text-sm text-slate-400"
                      >
                        No tasks assigned to this project.
                      </td>
                    </tr>
                  </ng-template>
                </p-table>
              </div>

              <ng-template #noTasks>
                <div class="project-empty">
                  <i class="pi pi-list-check"></i>
                  <p>No tasks assigned to this project.</p>
                </div>
              </ng-template>
            </p-tabpanel>

            <!-- MATERIALS -->
            <p-tabpanel value="3">
              <div class="space-y-5">
                <!-- HEADER -->
                <div
                  class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h2 class="project-section-title text-lg">
                      Site Material Requests
                    </h2>
                    <p class="project-section-description text-sm">
                      Monitor material requests, approval status and issuance
                      progress.
                    </p>
                  </div>

                  <p-button
                    label="Request materials"
                    icon="pi pi-plus"
                    size="small"
                    styleClass="w-full sm:w-auto bg-blue-700! border-none! hover:bg-blue-600! px-3! py-2!"
                    (onClick)="ActionClick('requestMaterial')"
                  ></p-button>
                </div>

                <!-- SUMMARY CARDS -->
                <div class="grid grid-cols-2 gap-3 xl:grid-cols-4">
                  <!-- TOTAL -->
                  <div class="rounded-xl border border-slate-200 bg-white p-4">
                    <div class="flex items-center justify-between">
                      <span class="font-medium text-slate-500">
                        Total requests
                      </span>
                      <span
                        class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700"
                      >
                        <i class="pi pi-box"></i>
                      </span>
                    </div>

                    <p class="mt-3 text-2xl font-bold text-slate-800">
                      {{ materialRequests.length }}
                    </p>
                    <p class="mt-1 text-sm text-slate-400">
                      All material requests
                    </p>
                  </div>

                  <!-- PENDING -->
                  <div class="rounded-xl border border-slate-200 bg-white p-4">
                    <div class="flex items-center justify-between">
                      <span class="font-medium text-slate-500">
                        Pending approval
                      </span>
                      <span
                        class="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600"
                      >
                        <i class="pi pi-clock"></i>
                      </span>
                    </div>

                    <p class="mt-3 text-2xl font-bold text-amber-600">
                      {{ materialPendingCount }}
                    </p>
                    <p class="mt-1 text-sm text-slate-400">Awaiting review</p>
                  </div>

                  <!-- PARTIAL -->
                  <div class="rounded-xl border border-slate-200 bg-white p-4">
                    <div class="flex items-center justify-between">
                      <span class="font-medium text-slate-500">
                        Partially issued
                      </span>
                      <span
                        class="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-600"
                      >
                        <i class="pi pi-truck"></i>
                      </span>
                    </div>

                    <p class="mt-3 text-2xl font-bold text-orange-600">
                      {{ materialPartialCount }}
                    </p>
                    <p class="mt-1 text-sm text-slate-400">
                      Awaiting remaining items
                    </p>
                  </div>

                  <!-- COMPLETED -->
                  <div class="rounded-xl border border-slate-200 bg-white p-4">
                    <div class="flex items-center justify-between">
                      <span class="font-medium text-slate-500">
                        Fully issued
                      </span>
                      <span
                        class="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-600"
                      >
                        <i class="pi pi-check-circle"></i>
                      </span>
                    </div>

                    <p class="mt-3 text-2xl font-bold text-green-600">
                      {{ materialIssuedCount }}
                    </p>
                    <p class="mt-1 text-sm text-slate-400">
                      Fully fulfilled requests
                    </p>
                  </div>
                </div>

                <!-- REQUEST LIST -->
                <div
                  class="overflow-hidden rounded-xl border border-slate-200 bg-white"
                >
                  <!-- LIST HEADER -->
                  <div
                    class="flex flex-col gap-3 border-b border-slate-100 p-4"
                  >
                    <div
                      class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <h3 class="text-lg font-semibold text-slate-800">
                          Overview
                        </h3>
                        <p class="text-sm text-slate-400">
                          Select a request to view its material details.
                        </p>
                      </div>

                      <span class="text-sm font-medium text-slate-500">
                        {{ materialRequests.length }} requests
                      </span>
                    </div>

                    <!-- SEARCH & FILTERS -->
                    <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <div class="relative sm:col-span-1">
                        <i
                          class="pi pi-search absolute left-3 top-1/2 z-10 -translate-y-1/2 text-xs text-slate-400"
                        ></i>

                        <input
                          pInputText
                          #materialSearch
                          type="text"
                          placeholder="Search requests..."
                          class="w-full pl-9! text-sm"
                          (input)="
                            materialTable.filterGlobal(
                              materialSearch.value,
                              'contains'
                            )
                          "
                        />
                      </div>

                      <p-select
                        [options]="materialStatusOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="All statuses"
                        [showClear]="true"
                        styleClass="w-full text-sm"
                        (onChange)="
                          materialTable.filter($event.value, 'status', 'equals')
                        "
                      ></p-select>

                      <p-select
                        [options]="materialPriorityOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="All priorities"
                        [showClear]="true"
                        styleClass="w-full text-sm"
                        (onChange)="
                          materialTable.filter(
                            $event.value,
                            'priority',
                            'equals'
                          )
                        "
                      ></p-select>
                    </div>
                  </div>

                  <div class="p-3">
                    <!-- REQUEST TABLE -->
                    <p-table
                      #materialTable
                      [value]="materialRequests"
                      [expandedRowKeys]="expandedRows"
                      dataKey="id"
                      [globalFilterFields]="[
                        'subject',
                        'description',
                        'requestedBy',
                        'status',
                        'priority',
                      ]"
                      [rowHover]="true"
                      [paginator]="materialRequests.length > 10"
                      [rows]="10"
                      [rowsPerPageOptions]="[10, 20, 50]"
                      responsiveLayout="stack"
                      breakpoint="960px"
                      showGridlines
                    >
                      <!-- TABLE HEADER -->
                      <ng-template #header>
                        <tr>
                          <th class="w-12"></th>
                          <th>Request details</th>
                          <th class="text-center!">Needed by</th>
                          <th class="text-center!">Items</th>
                          <th class="text-center!">Priority</th>
                          <th class="text-center!">Status</th>
                          <th class="min-w-40">Fulfilment</th>
                        </tr>
                      </ng-template>

                      <!-- TABLE BODY -->
                      <ng-template #body let-data let-expanded="expanded">
                        <tr>
                          <!-- EXPAND -->
                          <td>
                            <p-button
                              [pRowToggler]="data"
                              [text]="true"
                              [rounded]="true"
                              severity="secondary"
                              size="small"
                              [icon]="
                                expanded
                                  ? 'pi pi-chevron-down'
                                  : 'pi pi-chevron-right'
                              "
                              [pTooltip]="
                                expanded ? 'Collapse details' : 'View details'
                              "
                            ></p-button>
                          </td>

                          <!-- REQUEST DETAILS -->
                          <td>
                            <div class="min-w-0">
                              <p class="font-semibold text-slate-800">
                                {{ data.subject || 'Untitled request' }}
                              </p>

                              <p
                                class="mt-1 line-clamp-2 text-xs text-slate-400"
                              >
                                {{
                                  data.description || 'No description provided.'
                                }}
                              </p>

                              <div
                                class="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400"
                              >
                                <span>
                                  <i class="pi pi-calendar mr-1 text-xs!"></i>
                                  {{ data.createdAt | date: 'dd MMM yyyy' }}
                                </span>

                                <span *ngIf="data.requestedBy">
                                  <i class="pi pi-user mr-1 text-xs!"></i>
                                  {{
                                    data.requestedBy.displayName ??
                                      data.requestedBy?.fullName
                                  }}
                                </span>
                              </div>
                            </div>
                          </td>

                          <!-- NEEDED BY -->
                          <td class="text-center!">
                            <div class="flex flex-col gap-1">
                              <span class="text-sm font-medium text-slate-700">
                                {{
                                  data.neededBy
                                    ? (data.neededBy | date: 'dd MMM yyyy')
                                    : '-'
                                }}
                              </span>

                              <span
                                *ngIf="isMaterialOverdue(data)"
                                class="text-[11px] font-semibold text-red-600"
                              >
                                <i class="pi pi-exclamation-circle mr-1"></i>
                                Overdue
                              </span>
                            </div>
                          </td>

                          <!-- ITEM COUNT -->
                          <td class="text-center!">
                            <span class="font-semibold text-slate-700">
                              {{ data.items?.length || 0 }}
                            </span>
                            <span class="ml-1 text-xs text-slate-400">
                              items
                            </span>
                          </td>

                          <!-- PRIORITY -->
                          <td class="text-center!">
                            <p-tag
                              [value]="data.priority || 'Normal'"
                              [severity]="
                                getMaterialPrioritySeverity(data.priority)
                              "
                            ></p-tag>
                          </td>

                          <!-- STATUS -->
                          <td class="text-center!">
                            <p-tag
                              [value]="data.status || 'Pending'"
                              [severity]="
                                getMaterialStatusSeverity(data.status)
                              "
                            ></p-tag>
                          </td>

                          <!-- FULFILMENT -->
                          <td>
                            <div class="min-w-36 space-y-2">
                              <div
                                class="flex items-center justify-between gap-2"
                              >
                                <span
                                  class="text-xs font-semibold text-slate-700"
                                >
                                  {{ getMaterialIssuedTotal(data) }}
                                  / {{ getMaterialRequestedTotal(data) }}
                                </span>

                                <span class="text-xs fonttext-slate-500">
                                  {{ getMaterialProgress(data) }}%
                                </span>
                              </div>

                              <div
                                class="h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
                              >
                                <div
                                  class="h-full rounded-full transition-all"
                                  [style.width.%]="getMaterialProgress(data)"
                                  [ngClass]="{
                                    'bg-green-500':
                                      getMaterialProgress(data) === 100,
                                    'bg-blue-600':
                                      getMaterialProgress(data) > 0 &&
                                      getMaterialProgress(data) < 100,
                                    'bg-slate-300':
                                      getMaterialProgress(data) === 0,
                                  }"
                                ></div>
                              </div>

                              <p class="text-[10px] text-slate-400">
                                Quantity issued
                              </p>
                            </div>
                          </td>
                        </tr>
                      </ng-template>

                      <!-- EXPANDED MATERIAL DETAILS -->
                      <ng-template #expandedrow let-data>
                        <tr>
                          <td colspan="7" class="bg-slate-50! p-3! sm:p-5!">
                            <div class="space-y-4">
                              <!-- EXPANDED HEADER -->
                              <div
                                class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div>
                                  <h4
                                    class="text-base font-semibold text-slate-800"
                                  >
                                    Requested Materials
                                  </h4>

                                  <p class="mt-1 text-sm text-slate-400">
                                    {{ data.subject }}
                                  </p>
                                </div>

                                <span class="text-sm text-slate-500">
                                  {{ data.items?.length || 0 }} material items
                                </span>
                              </div>

                              <!-- MATERIAL ITEMS -->
                              <div class="overflow-hidden">
                                <p-table
                                  [value]="data.items || []"
                                  [showGridlines]="false"
                                  responsiveLayout="scroll"
                                >
                                  <ng-template #header>
                                    <tr>
                                      <th>Material</th>
                                      <th>Item code</th>
                                      <th class="text-right!">Requested</th>
                                      <th class="text-right!">Approved</th>
                                      <th class="text-right!">Issued</th>
                                      <th class="text-right!">Reserved</th>
                                      <th class="text-right!">Outstanding</th>
                                    </tr>
                                  </ng-template>

                                  <ng-template #body let-item>
                                    <tr>
                                      <!-- MATERIAL -->
                                      <td>
                                        <p class="font-medium text-slate-800">
                                          {{ item.itemName }}
                                        </p>

                                        <p class="mt-1 text-xs text-slate-400">
                                          {{ item.description || '-' }}
                                        </p>
                                      </td>

                                      <!-- CODE -->
                                      <td>
                                        <span class="text-xs text-slate-500">
                                          {{ item.itemCode || '-' }}
                                        </span>
                                      </td>

                                      <!-- REQUESTED -->
                                      <td class="text-right!">
                                        <span
                                          class="font-semibold text-slate-700"
                                        >
                                          {{ item.requestedQuantity }}
                                        </span>
                                        <span class="text-xs text-slate-400">
                                          {{ item.unit || '' }}
                                        </span>
                                      </td>

                                      <!-- APPROVED -->
                                      <td class="text-right!">
                                        <span class="text-slate-700">
                                          {{ item.approvedQuantity ?? 0 }}
                                        </span>
                                      </td>

                                      <!-- ISSUED -->
                                      <td class="text-right!">
                                        <span
                                          class="font-semibold text-green-600"
                                        >
                                          {{ item.issuedQuantity ?? 0 }}
                                        </span>
                                      </td>

                                      <!-- RESERVED -->
                                      <td class="text-right!">
                                        <span class="text-blue-600">
                                          {{ item.reservedQuantity ?? 0 }}
                                        </span>
                                      </td>

                                      <!-- OUTSTANDING -->
                                      <td class="text-right!">
                                        <span
                                          class="font-semibold"
                                          [ngClass]="{
                                            'text-red-600':
                                              getMaterialOutstanding(item) > 0,
                                            'text-green-600':
                                              getMaterialOutstanding(item) ===
                                              0,
                                          }"
                                        >
                                          {{ getMaterialOutstanding(item) }}
                                        </span>
                                      </td>
                                    </tr>
                                  </ng-template>

                                  <ng-template #emptymessage>
                                    <tr>
                                      <td
                                        colspan="7"
                                        class="py-8! text-center!"
                                      >
                                        <i
                                          class="pi pi-box text-2xl text-slate-300"
                                        ></i>
                                        <p class="mt-2 text-sm text-slate-400">
                                          No material items found.
                                        </p>
                                      </td>
                                    </tr>
                                  </ng-template>
                                </p-table>
                              </div>

                              <!-- REQUEST REMARKS -->
                              <div
                                *ngIf="data.remarks"
                                class="rounded-lg border border-slate-200 bg-white p-3"
                              >
                                <p class="text-xs font-semibold text-slate-600">
                                  Request remarks
                                </p>
                                <p class="mt-1 text-sm text-slate-500">
                                  {{ data.remarks }}
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </ng-template>

                      <!-- EMPTY -->
                      <ng-template #emptymessage>
                        <tr>
                          <td colspan="7" class="py-12! text-center!">
                            <div class="flex flex-col items-center gap-2">
                              <i
                                class="pi pi-inbox text-3xl text-slate-300"
                              ></i>

                              <p class="text-sm font-medium text-slate-600">
                                No material requests found
                              </p>

                              <p class="text-xs text-slate-400">
                                Try changing your search or filters.
                              </p>
                            </div>
                          </td>
                        </tr>
                      </ng-template>
                    </p-table>
                  </div>
                </div>

                <!-- FOOTNOTE -->
                <div class="flex items-start gap-2 text-xs text-slate-400">
                  <i class="pi pi-info-circle text-xs!"></i>
                  <p>
                    Fulfilment is calculated using the total quantity issued
                    against the total requested quantity. Expand a request to
                    monitor individual material quantities.
                  </p>
                </div>
              </div>
            </p-tabpanel>

            <!-- JOB SHEETS -->
            <p-tabpanel value="4">
              <div class="project-section-toolbar">
                <div>
                  <h2 class="project-section-title">Job sheet logs</h2>
                  <p class="project-section-description">
                    Track work performed by project technicians.
                  </p>
                </div>
                <p-button
                  label="Create job sheet"
                  icon="pi pi-plus"
                  size="small"
                  styleClass="w-full sm:w-auto bg-blue-700! border-none! hover:bg-blue-500! py-3!"
                  (onClick)="OpenJobSheetDialog()"
                ></p-button>
              </div>

              <ng-container *ngIf="jobSheets.length > 0; else noJobSheet">
                <div
                  class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3"
                >
                  <article
                    *ngFor="let item of jobSheets"
                    class="project-record flex min-h-40 flex-col justify-between"
                  >
                    <div>
                      <div class="flex items-start justify-between gap-3">
                        <div class="min-w-0">
                          <p class="text-xs font-semibold text-blue-700">
                            {{ item.jobSheetNo }}
                          </p>
                          <h3
                            class="mt-2 line-clamp-3 text-sm font-semibold leading-6 text-slate-800"
                          >
                            {{ item.workDescription || 'No work description' }}
                          </h3>
                        </div>
                        <span class="project-panel-icon shrink-0"
                          ><i class="pi pi-clipboard"></i
                        ></span>
                      </div>
                    </div>

                    <div
                      class="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3"
                    >
                      <p-tag
                        [value]="item.status"
                        [severity]="
                          item.status === 'Completed'
                            ? 'success'
                            : item.status === 'Rejected'
                              ? 'danger'
                              : item.status === 'Draft'
                                ? 'secondary'
                                : 'info'
                        "
                      ></p-tag>
                      <span class="text-xs text-slate-500">
                        <i class="pi pi-calendar mr-1"></i>
                        {{ item.workDate | date: 'dd MMM yyyy' }}
                      </span>
                    </div>
                  </article>
                </div>
              </ng-container>

              <ng-template #noJobSheet>
                <div class="project-empty">
                  <i class="pi pi-clipboard"></i>
                  <p>No job sheets available for this project.</p>
                </div>
              </ng-template>
            </p-tabpanel>
          </p-tabpanels>
        </p-tabs>
      </section>
    </main>

    <!-- DELETE TASK DIALOG -->
    <p-dialog
      [(visible)]="deleteTaskDialog"
      [modal]="true"
      [draggable]="false"
      [closable]="false"
      [style]="{ width: '420px' }"
      [breakpoints]="{ '640px': 'calc(100vw - 2rem)' }"
      appendTo="body"
    >
      <ng-template #headless>
        <div class="p-6 text-center">
          <div
            class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600"
          >
            <i class="pi pi-trash text-xl"></i>
          </div>
          <h2 class="text-lg font-bold text-slate-900">Delete task?</h2>
          <p class="mt-2 text-sm leading-6 text-slate-500">
            Are you sure you want to delete
            <span class="font-semibold text-slate-800">{{
              taskToDelete?.taskCode
            }}</span
            >? This action cannot be undone.
          </p>
          <div class="mt-6 flex justify-center gap-2">
            <p-button
              label="Cancel"
              severity="secondary"
              [outlined]="true"
              (onClick)="CancelDeleteTask()"
            ></p-button>
            <p-button
              label="Delete task"
              icon="pi pi-trash"
              severity="danger"
              (onClick)="ConfirmDeleteTask()"
            ></p-button>
          </div>
        </div>
      </ng-template>
    </p-dialog>

    <!-- JOB SHEET DRAWER -->
    <p-drawer
      [(visible)]="jobSheetDialog"
      position="right"
      [modal]="true"
      [dismissible]="true"
      [showCloseIcon]="true"
      appendTo="body"
      styleClass="project-job-drawer w-full! sm:w-[50%]! lg:w-[40%]!"
      [header]="
        jobSheetUpdate
          ? 'Update Job Sheet: ' + selectedJobSheet?.jobSheetNo
          : 'New Job Sheet'
      "
    >
      <div class="flex h-full flex-col" [formGroup]="jobSheetForm">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="flex flex-col gap-1.5 sm:col-span-2">
            <label class="project-form-label">Job sheet number</label>
            <input pInputText class="w-full" formControlName="jobSheetNo" />
          </div>

          <div class="flex flex-col gap-1.5 sm:col-span-2">
            <label class="project-form-label">Related task</label>
            <p-select
              formControlName="projectTaskId"
              appendTo="body"
              styleClass="w-full"
              optionLabel="title"
              optionValue="id"
              [options]="PagingSignal().staffTasks || []"
              placeholder="Select project task"
            ></p-select>
          </div>

          <div class="flex flex-col gap-1.5 sm:col-span-2">
            <label class="project-form-label">Technician assignment</label>
            <p-multiselect
              formControlName="members"
              appendTo="body"
              styleClass="w-full"
              [options]="userSelection"
              [filter]="true"
              [showClear]="true"
              placeholder="Select team members"
            ></p-multiselect>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="project-form-label">Work date</label>
            <p-datepicker
              formControlName="workDate"
              [showIcon]="true"
              dateFormat="dd/mm/yy"
              placeholder="dd/mm/yyyy"
              styleClass="w-full"
              appendTo="body"
            ></p-datepicker>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="project-form-label">Start time</label>
            <p-datepicker
              formControlName="startTime"
              [timeOnly]="true"
              hourFormat="24"
              [showIcon]="true"
              placeholder="HH:mm"
              styleClass="w-full"
              appendTo="body"
            ></p-datepicker>
          </div>

          <div class="flex flex-col gap-1.5 sm:col-span-2">
            <label class="project-form-label">End time</label>
            <p-datepicker
              formControlName="endTime"
              [timeOnly]="true"
              hourFormat="24"
              [showIcon]="true"
              placeholder="HH:mm"
              styleClass="w-full"
              appendTo="body"
            ></p-datepicker>
          </div>

          <div class="flex flex-col gap-1.5 sm:col-span-2">
            <label class="project-form-label">Work description</label>
            <textarea
              pTextarea
              class="w-full"
              [rows]="5"
              [autoResize]="true"
              formControlName="workDescription"
              placeholder="Describe the work performed..."
            ></textarea>
          </div>

          <div class="flex flex-col gap-1.5 sm:col-span-2">
            <label class="project-form-label">Remarks</label>
            <input
              pInputText
              class="w-full"
              formControlName="remarks"
              placeholder="Additional notes..."
            />
          </div>
        </div>
      </div>
      <ng-template #footer>
        <div class="flex gap-2 w-full">
          <p-button
            label="Close"
            severity="secondary"
            [outlined]="true"
            class="flex-1!"
            styleClass="w-full! py-3!"
            (onClick)="jobSheetDialog = false"
          ></p-button>
          <p-button
            (onClick)="SaveJobSheet()"
            class="flex-1!"
            [label]="jobSheetUpdate ? 'Save changes' : 'Save job sheet'"
            styleClass="w-full bg-blue-700! border-none! hover:bg-blue-500! py-3!"
          ></p-button>
        </div>
      </ng-template>
    </p-drawer>

    <p-dialog
      header="Task Details"
      [(visible)]="taskDialogVisible"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '650px', maxWidth: '95vw' }"
    >
      @if (selectedTask) {
        <div class="space-y-5">
          <!-- Task Information -->
          <div>
            <div class="mb-2 flex flex-wrap items-center gap-2">
              <h3 class="text-lg font-bold text-slate-800">
                {{ selectedTask.title }}
              </h3>

              <p-tag
                [value]="selectedTask.status"
                [severity]="
                  selectedTask.status === 'Completed'
                    ? 'success'
                    : selectedTask.status === 'InProgress'
                      ? 'info'
                      : selectedTask.status === 'Pending'
                        ? 'warn'
                        : selectedTask.status === 'Cancelled'
                          ? 'danger'
                          : 'secondary'
                "
              />
            </div>

            <p class="whitespace-pre-line text-sm leading-6 text-slate-600">
              {{ selectedTask.description || 'No description provided.' }}
            </p>
          </div>

          <!-- Task Details -->
          <div class="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4">
            <div>
              <p class="text-xs text-slate-500">Assigned To</p>
              <p class="mt-1 text-sm font-medium text-slate-800">
                {{ selectedTask.assignedTo?.fullName || 'Not assigned' }}
              </p>
            </div>

            <div>
              <p class="text-xs text-slate-500">Assigned By</p>
              <p class="mt-1 text-sm font-medium text-slate-800">
                {{ selectedTask.assignedBy?.fullName || '-' }}
              </p>
            </div>

            <div>
              <p class="text-xs text-slate-500">Priority</p>
              <p class="mt-1 text-sm font-medium text-slate-800">
                {{ formatLabel(selectedTask.priority) }}
              </p>
            </div>

            <div>
              <p class="text-xs text-slate-500">Category</p>
              <p class="mt-1 text-sm font-medium text-slate-800">
                {{ formatLabel(selectedTask.category) }}
              </p>
            </div>

            <div>
              <p class="text-xs text-slate-500">Start Date</p>
              <p class="mt-1 text-sm font-medium text-slate-800">
                {{
                  selectedTask.startDate
                    ? (selectedTask.startDate | date: 'dd MMM yyyy')
                    : '-'
                }}
              </p>
            </div>

            <div>
              <p class="text-xs text-slate-500">Due Date</p>
              <p class="mt-1 text-sm font-medium text-slate-800">
                {{
                  selectedTask.dueDate
                    ? (selectedTask.dueDate | date: 'dd MMM yyyy')
                    : '-'
                }}
              </p>
            </div>

            <div>
              <p class="text-xs text-slate-500">Estimated Hours</p>
              <p class="mt-1 text-sm font-medium text-slate-800">
                {{ selectedTask.estimatedHours ?? '-' }}
              </p>
            </div>

            <div>
              <p class="text-xs text-slate-500">Actual Hours</p>
              <p class="mt-1 text-sm font-medium text-slate-800">
                {{ selectedTask.actualHours ?? '-' }}
              </p>
            </div>
          </div>

          <!-- Checklist -->
          <div>
            <div class="mb-3 flex items-center justify-between">
              <h4 class="font-semibold text-slate-800">Checklist</h4>

              <span class="text-xs text-slate-500">
                {{ selectedTask.completedChecklistCount || 0 }}/{{
                  selectedTask.checklistCount || 0
                }}
                completed
              </span>
            </div>

            <!-- Progress -->
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

            @if (selectedTask.checklists?.length) {
              <div class="space-y-2">
                @for (item of selectedTask.checklists; track item.id) {
                  <div
                    class="flex items-start gap-3 rounded-lg border border-slate-200 p-3"
                  >
                    <i
                      class="pi mt-0.5"
                      [ngClass]="
                        item.isCompleted
                          ? 'pi-check-circle text-green-600'
                          : 'pi-circle text-slate-300'
                      "
                    ></i>

                    <span
                      class="text-sm"
                      [ngClass]="
                        item.isCompleted
                          ? 'text-slate-400 line-through'
                          : 'text-slate-700'
                      "
                    >
                      {{ item.title }}
                    </span>
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

          <!-- Close -->
          <div class="flex justify-end border-t border-slate-200 pt-4">
            <p-button
              label="Close"
              severity="secondary"
              [outlined]="true"
              (onClick)="taskDialogVisible = false"
            />
          </div>
        </div>
      }
    </p-dialog>
  `,
  styleUrl: './project-details.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetails implements OnInit, OnDestroy {
  private readonly loadingService = inject(LoadingService);
  private readonly projectService = inject(ProjectService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly jobSheetService = inject(JobSheetService);
  private readonly staffTaskService = inject(StaffTaskService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);

  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  PagingSignal = signal<ProjectDto>({} as ProjectDto);
  projectId: string | null = null;
  expandedRows: { [key: string]: boolean } = {};
  userSelection: any;

  taskDialogVisible: boolean = false;
  taskUpdate: boolean = false;
  deleteTaskDialog: boolean = false;

  materialDialog: boolean = false;
  materialUpdate: boolean = false;
  deleteMaterialDialog: boolean = false;

  jobSheetDialog: boolean = false;
  jobSheetUpdate: boolean = false;
  deleteJobSheetDialog: boolean = false;
  confirmationPopup: boolean = false;

  confirmMessage: string = '';
  taskToDelete: any = null;

  materialForm!: FormGroup;
  jobSheetForm!: FormGroup;

  selectedTask: any;
  selectedMaterial: any;
  selectedJobSheet: any;

  workOrderSelection: { label: string; value: string }[] = [];

  jobSheets: JobSheetDto[] = [];

  ngOnInit(): void {
    this.initJobSheetForm();

    this.projectId = this.activatedRoute.snapshot.queryParams['id'];
    this.GetData();
  }

  GetData() {
    this.loadingService.start();
    this.projectService
      .GetOne({
        Page: 1,
        PageSize: 1,
        OrderBy: null,
        Select: null,
        Includes: 'ProjectMembers, StaffTasks, WorkOrders',
        Filter: `Id=${this.projectId}`,
      })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();

          if (res) {
            res.staffTasks = res.staffTasks ?? [];
            res.workOrders = res.workOrders ?? [];
            res.siteMaterialRequests = res.siteMaterialRequests ?? [];

            res.staffTasks.sort(
              (a: any, b: any) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime(),
            );

            this.PagingSignal.set(res);
            this.jobSheets = res.jobSheets ?? [];

            this.cdr.markForCheck();
          }
        },
        error: (err) => {
          this.loadingService.stop();
        },
      });
  }

  getUserDropdown() {
    const project = this.PagingSignal();

    const members =
      project.projectMembers?.map((x) => ({
        label: x.user?.fullName,
        value: x.userId,
      })) ?? [];

    const projectLeader = project.projectLeader
      ? [
          {
            label: project.projectLeader.fullName,
            value: project.projectLeaderId,
          },
        ]
      : [];

    this.userSelection = [...projectLeader, ...members].filter(
      (item, index, self) =>
        index === self.findIndex((x) => x.value === item.value),
    );

    // WorkOrder dropdown
    this.workOrderSelection =
      project.workOrders?.map((x) => ({
        label: x.workOrderNo,
        value: x.id,
      })) ?? [];
  }

  ActionClick(type: string): void {
    if (type === 'requestMaterial') {
      this.router.navigate(['/hardware-request'], {
        queryParams: {
          type: 'SiteMaterial',
          projectId: this.PagingSignal()?.id,
        },
      });
    }

    if (type === 'createWorkOrder') {
      this.router.navigate(['/work-order/form'], {
        queryParams: {
          projectId: this.PagingSignal()?.id,
        },
      });
    }
  }

  getInitial(fullName?: string): string {
    if (!fullName?.trim()) return '?';

    const names = fullName.trim().split(/\s+/).filter(Boolean);

    if (names.length === 1) {
      return names[0].substring(0, 2).toUpperCase();
    }

    return (names[0].charAt(0) + names[1].charAt(0)).toUpperCase();
  }

  getRemainingDaysValue(date: Date | string | null | undefined): number {
    if (!date) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const target = new Date(date);
    target.setHours(0, 0, 0, 0);

    return Math.ceil(
      (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
  }

  getRemainingDays(date: Date | string | null | undefined): string {
    const days = this.getRemainingDaysValue(date);

    if (days > 0) return `${days} days`;
    if (days === 0) return 'Today';

    return `${Math.abs(days)} days overdue`;
  }

  RemoveTaskClick(task: any) {
    this.taskToDelete = task;
    this.deleteTaskDialog = true;
  }

  ConfirmDeleteTask() {
    if (!this.taskToDelete) return;

    this.DeleteTask(this.taskToDelete.id);

    this.deleteTaskDialog = false;
    this.taskToDelete = null;
  }

  CancelDeleteTask() {
    this.deleteTaskDialog = false;
    this.taskToDelete = null;
  }

  DeleteTask(id: string) {
    this.loadingService.start();

    this.staffTaskService
      .Delete(id)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: () => {
          this.loadingService.stop();

          this.PagingSignal.update((project) => ({
            ...project,
            staffTasks: project.staffTasks.filter((x) => x.id !== id),
          }));

          this.cdr.markForCheck();
        },
        error: () => {
          this.loadingService.stop();
        },
      });
  }

  OpenMaterialDialog() {
    this.initMaterialForm();
    this.materialDialog = true;
  }

  EditMaterial(material: any) {
    this.selectedMaterial = material;
    this.materialDialog = true;
    this.OpenMaterialDialog();
  }

  initMaterialForm() {
    this.materialForm = new FormGroup({
      id: new FormControl<string | null>({ value: null, disabled: true }),
      projectId: new FormControl(this.PagingSignal().id),
      description: new FormControl(null),
      brand: new FormControl<string | null>(null),
      unit: new FormControl<string>('Nos'),
      quantity: new FormControl<number>(1),
      requiredAt: new FormControl<Date | null>(null),
      remarks: new FormControl<string | null>(null),
      supplierId: new FormControl<string | null>(null),
    });

    if (!this.materialUpdate || !this.selectedMaterial) {
      return;
    }

    this.materialForm.get('id')?.enable();

    this.materialForm.patchValue({
      id: this.selectedMaterial.id,
      projectId: this.selectedMaterial.projectId,
      description: this.selectedMaterial.description,
      brand: this.selectedMaterial.brand,
      unit: this.selectedMaterial.unit,
      quantity: this.selectedMaterial.quantity,
      requiredAt: this.selectedMaterial.requiredAt,
      remarks: this.selectedMaterial.remarks,
      supplierId: this.selectedMaterial.supplierId,
    });
  }

  //JobSheet
  OpenJobSheetDialog() {
    this.getUserDropdown();
    this.jobSheetDialog = true;
  }

  EditJobSheet(jobsheet: any) {
    this.selectedJobSheet = jobsheet;
    this.jobSheetDialog = true;
    this.OpenJobSheetDialog();
  }

  initJobSheetForm() {
    this.jobSheetForm = new FormGroup({
      id: new FormControl<string | null>({
        value: null,
        disabled: true,
      }),

      projectTaskId: new FormControl<string | null>(null),

      jobSheetNo: new FormControl<string | null>(null),

      workDate: new FormControl<Date | null>(null),
      startTime: new FormControl<Date | null>(null),
      endTime: new FormControl<Date | null>(null),
      workDescription: new FormControl<string | null>(null),

      status: new FormControl<string | null>('Draft'),

      remarks: new FormControl<string | null>(null),

      members: new FormControl<any[]>([]),

      files: new FormControl<File[] | null>(null),
    });

    this.jobSheetForm
      .get('projectTaskId')
      ?.valueChanges.pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((taskId: string | null) => {
        this.onProjectTaskChange(taskId);
      });

    if (!this.jobSheetUpdate || !this.selectedJobSheet) {
      return;
    }

    this.jobSheetForm.get('id')?.enable();

    this.jobSheetForm.patchValue({
      id: this.selectedJobSheet.id,
      projectTaskId: this.selectedJobSheet.projectTaskId,
      jobSheetNo: this.selectedJobSheet.jobSheetNo,
      workDate: this.selectedJobSheet.workDate
        ? new Date(this.selectedJobSheet.workDate)
        : null,
      startTime: this.selectedJobSheet.startTime
        ? new Date(this.selectedJobSheet.startTime)
        : null,
      endTime: this.selectedJobSheet.endTime
        ? new Date(this.selectedJobSheet.endTime)
        : null,
      workDescription: this.selectedJobSheet.workDescription,
      status: this.selectedJobSheet.status,
      members: this.selectedJobSheet.members ?? [],
    });
  }

  onProjectTaskChange(taskId: string | null) {
    if (!taskId) {
      this.jobSheetForm.patchValue({
        members: [],
      });

      return;
    }

    const task = this.PagingSignal().staffTasks?.find(
      (x: any) => x.id === taskId,
    );

    if (!task) {
      this.jobSheetForm.patchValue({
        members: [],
      });

      return;
    }

    // const members: string[] =
    //   task.assignedTaskMembers?.map((member: any) => member.userId) ?? [];

    // this.jobSheetForm.patchValue({
    //   members,
    // });
  }

  SaveJobSheet() {
    if (this.jobSheetForm.invalid) {
      ValidateAllFormFields(this.jobSheetForm);
      return;
    }

    this.loadingService.start();

    const value = this.jobSheetForm.getRawValue();

    const formData = new FormData();

    formData.append('JobSheetNo', value.jobSheetNo ?? '');

    formData.append('ProjectId', this.projectId!);

    if (value.projectTaskId) {
      formData.append('ProjectTaskId', value.projectTaskId);
    }

    if (value.workDate) {
      formData.append('WorkDate', new Date(value.workDate).toISOString());
    }

    if (value.startTime) {
      formData.append('StartTime', new Date(value.startTime).toISOString());
    }

    if (value.endTime) {
      formData.append('EndTime', new Date(value.endTime).toISOString());
    }

    formData.append('WorkDescription', value.workDescription ?? '');

    formData.append('Remarks', value.remarks ?? '');

    const members = value.members ?? [];

    members.forEach((member: any, index: number) => {
      formData.append(`Members[${index}].UserId`, member.userId ?? member);

      formData.append(
        `Members[${index}].IsLeader`,
        String(member.isLeader ?? false),
      );
    });

    if (value.files?.length) {
      value.files.forEach((file: File) => {
        formData.append('Files', file, file.name);
      });
    }

    const $request = this.jobSheetUpdate
      ? this.jobSheetService.Update(formData)
      : this.jobSheetService.Create(formData);

    $request.pipe(takeUntil(this.ngUnsubscribe)).subscribe({
      next: (jobsheet) => {
        this.loadingService.stop();

        this.PagingSignal.update((project) => {
          if (this.jobSheetUpdate) {
            return {
              ...project,
              jobSheets: project.jobSheets?.map((t) =>
                t.id === jobsheet.id ? jobsheet : t,
              ),
            };
          }

          return {
            ...project,
            jobSheets: [...(project.jobSheets ?? []), jobsheet],
          };
        });

        this.jobSheetDialog = false;
        this.jobSheetUpdate = false;
        this.selectedJobSheet = null;

        this.jobSheetForm.reset();

        this.cdr.markForCheck();
      },

      error: (error) => {
        this.loadingService.stop();

        console.error('Failed to save Job Sheet:', error);
      },
    });
  }

  get members(): FormArray {
    return this.jobSheetForm.get('members') as FormArray;
  }

  getWorkOrderNo(workOrderId?: string | null): string {
    if (!workOrderId) return 'Direct Project Task';

    return (
      this.PagingSignal().workOrders?.find((x) => x.id === workOrderId)
        ?.workOrderNo ?? 'Work Order'
    );
  }

  get directProjectTasks(): StaffTaskDto[] {
    return (this.PagingSignal().staffTasks || []).filter(
      (task) => !task.workOrderId,
    );
  }

  get currentUserId(): string | null {
    return this.userService.currentUser?.userId ?? null;
  }

  getCompletedChecklistCount(task: StaffTaskDto): number {
    return task.checklists?.filter((item) => item.isCompleted).length ?? 0;
  }

  viewTask(task: any): void {
    this.selectedTask = task;
    this.taskDialogVisible = true;
  }

  get checklistProgress(): number {
    const total =
      this.selectedTask?.checklistCount ??
      this.selectedTask?.checklists?.length ??
      0;

    const completed =
      this.selectedTask?.completedChecklistCount ??
      this.selectedTask?.checklists?.filter((item: any) => item.isCompleted)
        .length ??
      0;

    if (!total) return 0;

    return Math.round((completed / total) * 100);
  }

  formatLabel(value?: string | null): string {
    if (!value) return '-';

    return value
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
  }

  // ============================================================
  // SITE MATERIAL REQUEST MONITORING
  // ============================================================

  materialStatusOptions = [
    { label: 'Pending', value: 'Pending' },
    { label: 'Approved', value: 'Approved' },
    { label: 'Partially Issued', value: 'PartiallyIssued' },
    { label: 'Issued', value: 'Issued' },
    { label: 'Rejected', value: 'Rejected' },
    { label: 'Cancelled', value: 'Cancelled' },
  ];

  materialPriorityOptions = [
    { label: 'Low', value: 'Low' },
    { label: 'Normal', value: 'Normal' },
    { label: 'Medium', value: 'Medium' },
    { label: 'High', value: 'High' },
    { label: 'Urgent', value: 'Urgent' },
  ];

  // All project material requests
  get materialRequests(): any[] {
    return this.PagingSignal()?.siteMaterialRequests ?? [];
  }

  // Pending requests
  get materialPendingCount(): number {
    return this.materialRequests.filter(
      (x) => (x.status || 'Pending') === 'Pending',
    ).length;
  }

  // Partially issued requests
  get materialPartialCount(): number {
    return this.materialRequests.filter((x) => x.status === 'PartiallyIssued')
      .length;
  }

  // Fully issued requests
  get materialIssuedCount(): number {
    return this.materialRequests.filter(
      (x) =>
        x.status === 'Issued' ||
        ((x.items?.length ?? 0) > 0 &&
          x.items.every(
            (item: any) =>
              Number(item.requestedQuantity) > 0 &&
              Number(item.issuedQuantity ?? 0) >=
                Number(item.requestedQuantity),
          )),
    ).length;
  }

  // Total requested quantity
  getMaterialRequestedTotal(data: any): number {
    return (data.items ?? []).reduce(
      (total: number, item: any) => total + Number(item.requestedQuantity ?? 0),
      0,
    );
  }

  // Total issued quantity
  getMaterialIssuedTotal(data: any): number {
    return (data.items ?? []).reduce(
      (total: number, item: any) => total + Number(item.issuedQuantity ?? 0),
      0,
    );
  }

  // Outstanding quantity per item
  getMaterialOutstanding(item: any): number {
    return Math.max(
      0,
      Number(item.requestedQuantity ?? 0) - Number(item.issuedQuantity ?? 0),
    );
  }

  // Fulfilment percentage
  getMaterialProgress(data: any): number {
    const requested = this.getMaterialRequestedTotal(data);

    if (requested <= 0) {
      return 0;
    }

    const issued = this.getMaterialIssuedTotal(data);

    return Math.min(100, Math.round((issued / requested) * 100));
  }

  // Status tag colours
  getMaterialStatusSeverity(
    status: string,
  ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case 'Issued':
        return 'success';

      case 'Approved':
        return 'info';

      case 'PartiallyIssued':
        return 'warn';

      case 'Rejected':
      case 'Cancelled':
        return 'danger';

      case 'Pending':
      default:
        return 'secondary';
    }
  }

  // Priority tag colours
  getMaterialPrioritySeverity(
    priority: string,
  ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (priority) {
      case 'Urgent':
        return 'danger';

      case 'High':
        return 'warn';

      case 'Medium':
        return 'info';

      case 'Low':
        return 'success';

      case 'Normal':
      default:
        return 'secondary';
    }
  }

  // Overdue indicator
  isMaterialOverdue(data: any): boolean {
    if (!data.neededBy) {
      return false;
    }

    const status = data.status;

    if (
      status === 'Issued' ||
      status === 'Rejected' ||
      status === 'Cancelled'
    ) {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const neededBy = new Date(data.neededBy);
    neededBy.setHours(0, 0, 0, 0);

    return neededBy < today;
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
