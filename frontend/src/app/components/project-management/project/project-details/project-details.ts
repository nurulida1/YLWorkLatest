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
import { ProjectTaskService } from '../../../../services/ProjectTaskService';
import { TagModule } from 'primeng/tag';
import { ChipModule } from 'primeng/chip';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { JobSheetDto } from '../../../../models/JobSheets';
import { JobSheetService } from '../../../../services/JobSheetService';
import { DrawerModule } from 'primeng/drawer';

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

        <div class="project-heading-meta">
          <span class="project-meta-item">
            <i class="pi pi-circle-fill text-[7px]!"></i>
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
            <span class="text-gray-500 text-sm">Estimated budget</span>
            <span class="project-summary-icon"
              ><i class="pi pi-wallet"></i
            ></span>
          </div>
          <p class="project-summary-value mt-4 break-words text-xl sm:text-2xl">
            {{
              PagingSignal().estimatedBudget
                | currency: 'RM ' : 'symbol' : '1.2-2'
            }}
          </p>
          <p class="mt-2 text-[11px] text-slate-400">
            Allocated project budget
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
            {{ PagingSignal().projectTasks.length || 0 }}
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
              <i class="pi pi-list-check mr-2"></i>Tasks
              <span class="project-tab-count">{{
                PagingSignal().projectTasks.length || 0
              }}</span>
            </p-tab>
            <p-tab value="2">
              <i class="pi pi-box mr-2"></i>Materials
              <span class="project-tab-count">{{
                PagingSignal().siteMaterialRequests?.length || 0
              }}</span>
            </p-tab>
            <p-tab value="3">
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
                      class="whitespace-pre-line text-sm leading-7 text-slate-600"
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

                      <p class="text-sm font-semibold text-slate-900">
                        {{ PagingSignal().client.name || 'No client assigned' }}
                      </p>

                      <div
                        class="mt-4 flex items-start gap-2 border-t border-slate-100 pt-3 text-sm text-slate-500"
                      >
                        <i class="pi pi-map-marker mt-0.5 text-slate-400"></i>
                        <span>{{
                          PagingSignal().location || 'No location provided'
                        }}</span>
                      </div>
                    </section>

                    <section class="project-panel">
                      <div class="project-panel-heading">
                        <span class="project-panel-icon"
                          ><i class="pi pi-user"></i
                        ></span>
                        <div>
                          <h3 class="project-panel-title">Project leader</h3>
                          <p class="project-panel-subtitle">
                            Person responsible for this project
                          </p>
                        </div>
                      </div>

                      <div class="flex min-w-0 items-center gap-3">
                        <div class="project-person-avatar">
                          {{
                            getInitial(PagingSignal().projectLeader.fullName)
                          }}
                        </div>
                        <div class="min-w-0">
                          <p
                            class="truncate text-sm font-semibold text-slate-900"
                          >
                            {{
                              PagingSignal().projectLeader.fullName ||
                                'Not assigned'
                            }}
                          </p>
                          <p class="mt-1 truncate text-xs text-slate-500">
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
                          <p
                            class="truncate text-sm font-semibold text-slate-800"
                          >
                            {{ member.user.fullName || 'Unknown user' }}
                          </p>
                          <p class="mt-1 truncate text-xs text-slate-500">
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
                    <div class="project-timeline-item">
                      <span class="project-timeline-dot"></span>
                      <div>
                        <p class="text-xs text-slate-500">Start date</p>
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
                        <p class="text-xs text-slate-500">
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
                      <p class="text-xs font-medium text-slate-500">
                        Remaining days
                      </p>
                      <span
                        class="mt-2 inline-flex rounded-md px-3 py-1.5 text-xs font-semibold"
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

            <!-- TASKS -->
            <p-tabpanel value="1">
              <div class="project-section-toolbar">
                <div>
                  <h2 class="project-section-title">Project tasks</h2>
                  <p class="project-section-description">
                    Manage milestones, task progress and team assignments.
                  </p>
                </div>
                <p-button
                  label="Add task"
                  icon="pi pi-plus"
                  size="small"
                  styleClass="w-full sm:w-auto py-3! bg-blue-700! hover:bg-blue-500! border-none!"
                  (onClick)="OpenTaskDialog()"
                ></p-button>
              </div>

              <!-- Mobile task cards -->
              <div class="space-y-3 lg:hidden">
                <ng-container
                  *ngIf="PagingSignal().projectTasks?.length; else noTasks"
                >
                  <article
                    *ngFor="let data of PagingSignal().projectTasks"
                    class="project-record"
                  >
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0">
                        <p class="text-xs font-semibold text-blue-700">
                          {{ data.taskCode }}
                        </p>
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
                              : data.status === 'Review'
                                ? 'warn'
                                : data.status === 'Cancelled'
                                  ? 'danger'
                                  : 'secondary'
                        "
                      ></p-tag>
                    </div>

                    <p
                      class="mt-3 whitespace-pre-line text-sm leading-6 text-slate-500"
                    >
                      {{ data.description || 'No description provided.' }}
                    </p>

                    <div class="mt-3 flex flex-wrap items-center gap-2">
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
                      <span class="text-xs text-slate-500">
                        <i class="pi pi-calendar mr-1"></i>
                        {{
                          data.dueDate
                            ? (data.dueDate | date: 'dd MMM yyyy')
                            : 'No due date'
                        }}
                      </span>
                    </div>

                    <div
                      class="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3"
                    >
                      <div class="flex flex-wrap items-center gap-1">
                        <ng-container
                          *ngFor="let member of data.assignedTaskMembers"
                        >
                          <p-avatar
                            [label]="getInitial(member.user.fullName)"
                            shape="circle"
                            pTooltip="{{ member.user.fullName }}"
                            styleClass="bg-slate-100! text-slate-700! text-xs!"
                          ></p-avatar>
                        </ng-container>
                        <span
                          *ngIf="!data.assignedTaskMembers.length"
                          class="text-xs text-slate-400"
                          >No assignee</span
                        >
                      </div>

                      <div
                        *ngIf="
                          data.status !== 'Completed' &&
                          data.status !== 'Cancelled'
                        "
                        class="flex gap-1"
                      >
                        <p-button
                          icon="pi pi-pencil"
                          [text]="true"
                          [rounded]="true"
                          severity="secondary"
                          size="small"
                          pTooltip="Edit task"
                          (onClick)="EditTask(data)"
                        ></p-button>
                        <p-button
                          *ngIf="data.status === 'NotStarted'"
                          icon="pi pi-trash"
                          [text]="true"
                          [rounded]="true"
                          severity="danger"
                          size="small"
                          pTooltip="Delete task"
                          (onClick)="RemoveTaskClick(data)"
                        ></p-button>
                      </div>
                    </div>
                  </article>
                </ng-container>
              </div>

              <!-- Desktop task table -->
              <div
                class="hidden overflow-hidden rounded-lg border border-slate-200 lg:block"
              >
                <p-table
                  [value]="PagingSignal().projectTasks || []"
                  [tableStyle]="{ 'min-width': '65rem' }"
                  [rowHover]="true"
                  size="small"
                >
                  <ng-template #header>
                    <tr>
                      <th>Task ID</th>
                      <th>Task name</th>
                      <th>Description</th>
                      <th class="text-center!">Status</th>
                      <th>Assignee</th>
                      <th class="text-center!">Priority</th>
                      <th class="text-center!">Actions</th>
                    </tr>
                  </ng-template>
                  <ng-template #body let-data>
                    <tr>
                      <td class="font-semibold text-blue-700">
                        {{ data.taskCode }}
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
                            (onClick)="EditTask(data)"
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
            <p-tabpanel value="2">
              <div class="project-section-toolbar">
                <div>
                  <h2 class="project-section-title">Site material requests</h2>
                  <p class="project-section-description">
                    Review materials requested for this project.
                  </p>
                </div>

                <p-button
                  label="Request materials"
                  icon="pi pi-plus"
                  size="small"
                  styleClass="w-full sm:w-auto bg-blue-700! border-none! hover:bg-blue-500! py-3!"
                  (onClick)="ActionClick('requestMaterial')"
                ></p-button>
              </div>

              <!-- Mobile cards -->
              <div class="space-y-3 lg:hidden">
                <ng-container
                  *ngIf="
                    PagingSignal().siteMaterialRequests?.length;
                    else noMaterials
                  "
                >
                  <article
                    *ngFor="let data of PagingSignal().siteMaterialRequests"
                    class="project-record"
                  >
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0">
                        <p class="text-xs font-semibold text-blue-700">
                          {{ data.subject }}
                        </p>
                        <p class="mt-1 text-sm text-slate-500">
                          {{ data.description || 'No description provided.' }}
                        </p>
                      </div>

                      <p-tag
                        [value]="data.status || 'Pending'"
                        [severity]="
                          data.status === 'Approved' || data.status === 'Issued'
                            ? 'success'
                            : data.status === 'Rejected' ||
                                data.status === 'Cancelled'
                              ? 'danger'
                              : data.status === 'PartiallyIssued'
                                ? 'warn'
                                : 'info'
                        "
                      ></p-tag>
                    </div>

                    <div class="mt-4 grid grid-cols-2 gap-3">
                      <div>
                        <p class="text-[11px] text-slate-400">Request date</p>
                        <p class="mt-1 text-sm font-medium text-slate-700">
                          {{ data.createdAt | date: 'dd MMM yyyy' }}
                        </p>
                      </div>

                      <div>
                        <p class="text-[11px] text-slate-400">Needed by</p>
                        <p class="mt-1 text-sm font-medium text-slate-700">
                          {{
                            data.neededBy
                              ? (data.neededBy | date: 'dd MMM yyyy')
                              : '-'
                          }}
                        </p>
                      </div>

                      <div>
                        <p class="text-[11px] text-slate-400">Priority</p>
                        <p class="mt-1 text-sm font-medium text-slate-700">
                          {{ data.priority }}
                        </p>
                      </div>

                      <div>
                        <p class="text-[11px] text-slate-400">Total items</p>
                        <p class="mt-1 text-sm font-medium text-slate-700">
                          {{ data.items?.length || 0 }} items
                        </p>
                      </div>
                    </div>

                    <div class="mt-4 border-t border-slate-100 pt-3">
                      <p class="mb-2 text-xs font-semibold text-slate-700">
                        Requested materials
                      </p>

                      <div
                        *ngFor="let item of data.items"
                        class="border-b border-slate-50 py-2 last:border-0"
                      >
                        <div class="flex items-start justify-between gap-3">
                          <div class="min-w-0">
                            <p
                              class="break-words text-sm font-medium text-slate-800"
                            >
                              {{ item.itemName }}
                            </p>
                            <p class="mt-0.5 text-xs text-slate-400">
                              {{ item.itemCode || item.description || '-' }}
                            </p>
                          </div>

                          <span
                            class="shrink-0 text-sm font-semibold text-slate-800"
                          >
                            {{ item.requestedQuantity }} {{ item.unit || '' }}
                          </span>
                        </div>

                        <div
                          class="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500"
                        >
                          <span>Approved: {{ item.approvedQuantity }}</span>
                          <span>Issued: {{ item.issuedQuantity }}</span>
                          <span>Reserved: {{ item.reservedQuantity }}</span>
                        </div>
                      </div>

                      <p
                        *ngIf="!data.items?.length"
                        class="text-xs text-slate-400"
                      >
                        No material items.
                      </p>
                    </div>

                    <div
                      *ngIf="data.requestedBy"
                      class="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500"
                    >
                      <i class="pi pi-user mr-1"></i>
                      Requested by:
                      {{ data.requestedBy || '-' }}
                    </div>
                  </article>
                </ng-container>
              </div>

              <!-- Desktop table -->
              <div
                class="hidden overflow-hidden rounded-lg border border-slate-200 lg:block"
              >
                <p-table
                  [value]="PagingSignal().siteMaterialRequests || []"
                  [expandedRowKeys]="expandedRows"
                  dataKey="id"
                  [showGridlines]="false"
                  [rowHover]="true"
                  size="small"
                >
                  <ng-template #header>
                    <tr>
                      <th class="w-12"></th>
                      <th>Request subject</th>
                      <th>Request date</th>
                      <th>Needed by</th>
                      <th class="text-center!">Items</th>
                      <th class="text-center!">Priority</th>
                      <th class="text-center!">Status</th>
                    </tr>
                  </ng-template>

                  <ng-template #body let-data let-expanded="expanded">
                    <tr>
                      <td>
                        <p-button
                          [pRowToggler]="data"
                          [text]="true"
                          [rounded]="true"
                          severity="secondary"
                          [icon]="
                            expanded
                              ? 'pi pi-chevron-down'
                              : 'pi pi-chevron-right'
                          "
                        ></p-button>
                      </td>

                      <td>
                        <p class="font-semibold text-slate-800">
                          {{ data.subject }}
                        </p>
                        <p
                          class="mt-1 max-w-xs truncate text-xs text-slate-400"
                        >
                          {{ data.description || '-' }}
                        </p>
                      </td>

                      <td>
                        {{ data.createdAt | date: 'dd MMM yyyy' }}
                      </td>

                      <td>
                        {{
                          data.neededBy
                            ? (data.neededBy | date: 'dd MMM yyyy')
                            : '-'
                        }}
                      </td>

                      <td class="text-center!">
                        {{ data.items?.length || 0 }}
                      </td>

                      <td class="text-center!">
                        <p-tag
                          [value]="data.priority"
                          [severity]="
                            data.priority === 'Urgent'
                              ? 'danger'
                              : data.priority === 'High'
                                ? 'warn'
                                : data.priority === 'Normal'
                                  ? 'info'
                                  : 'secondary'
                          "
                        ></p-tag>
                      </td>

                      <td class="text-center!">
                        <p-tag
                          [value]="data.status || 'Pending'"
                          [severity]="
                            data.status === 'Approved' ||
                            data.status === 'Issued'
                              ? 'success'
                              : data.status === 'Rejected' ||
                                  data.status === 'Cancelled'
                                ? 'danger'
                                : data.status === 'PartiallyIssued'
                                  ? 'warn'
                                  : 'info'
                          "
                        ></p-tag>
                      </td>
                    </tr>
                  </ng-template>

                  <!-- Expanded items -->
                  <ng-template #expandedrow let-data>
                    <tr>
                      <td colspan="7" class="bg-slate-50! p-4!">
                        <p-table [value]="data.items || []" size="small">
                          <ng-template #header>
                            <tr>
                              <th>Item name</th>
                              <th>Item code</th>
                              <th>Description</th>
                              <th>Unit</th>
                              <th class="text-right!">Requested</th>
                              <th class="text-right!">Approved</th>
                              <th class="text-right!">Issued</th>
                              <th class="text-right!">Reserved</th>
                              <th class="text-center!">Status</th>
                              <th>Remarks</th>
                            </tr>
                          </ng-template>

                          <ng-template #body let-item>
                            <tr>
                              <td class="font-medium text-slate-800">
                                {{ item.itemName }}
                              </td>
                              <td>{{ item.itemCode || '-' }}</td>
                              <td>{{ item.description || '-' }}</td>
                              <td>{{ item.unit || '-' }}</td>
                              <td class="text-right!">
                                {{ item.requestedQuantity }}
                              </td>
                              <td class="text-right!">
                                {{ item.approvedQuantity }}
                              </td>
                              <td class="text-right!">
                                {{ item.issuedQuantity }}
                              </td>
                              <td class="text-right!">
                                {{ item.reservedQuantity }}
                              </td>
                              <td class="text-center!">
                                <p-tag
                                  [value]="item.status"
                                  severity="info"
                                ></p-tag>
                              </td>
                              <td>{{ item.remarks || '-' }}</td>
                            </tr>
                          </ng-template>

                          <ng-template #emptymessage>
                            <tr>
                              <td
                                colspan="10"
                                class="py-5! text-center! text-slate-400"
                              >
                                No material items found.
                              </td>
                            </tr>
                          </ng-template>
                        </p-table>
                      </td>
                    </tr>
                  </ng-template>

                  <ng-template #emptymessage>
                    <tr>
                      <td
                        colspan="7"
                        class="py-10! text-center! text-slate-400"
                      >
                        No site material requests found.
                      </td>
                    </tr>
                  </ng-template>
                </p-table>
              </div>

              <ng-template #noMaterials>
                <div class="project-empty">
                  <i class="pi pi-box"></i>
                  <p>No site material requests found.</p>
                </div>
              </ng-template>
            </p-tabpanel>

            <!-- JOB SHEETS -->
            <p-tabpanel value="3">
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

    <!-- TASK DIALOG -->
    <p-dialog
      [(visible)]="taskDialog"
      [modal]="true"
      [draggable]="false"
      [closable]="true"
      (onHide)="taskDialog = false"
      appendTo="body"
      [style]="{ width: 'min(720px, calc(100vw - 2rem))' }"
      [breakpoints]="{ '640px': 'calc(100vw - 1rem)' }"
      styleClass="project-form-dialog"
    >
      <ng-template #headless>
        <div class="flex flex-col" [formGroup]="taskForm">
          <div class="border-b border-slate-100 px-5 py-4 sm:px-6">
            <p
              class="text-[10px] font-bold uppercase tracking-wider text-slate-400"
            >
              Project task
            </p>
            <h2 class="mt-1 text-lg font-bold text-slate-900">
              {{
                taskUpdate
                  ? 'Update task: ' + selectedTask?.taskCode
                  : 'Create new task'
              }}
            </h2>
            <p class="mt-1 text-xs text-slate-500">
              Enter the task details and assign team members.
            </p>
          </div>

          <div class="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6">
            <div class="flex flex-col gap-1.5 sm:col-span-2">
              <label class="project-form-label">Task name</label>
              <input
                pInputText
                class="w-full"
                formControlName="title"
                placeholder="e.g. Pressure Valve Inspection"
              />
            </div>

            <div class="flex flex-col gap-1.5 sm:col-span-2">
              <label class="project-form-label">Description</label>
              <textarea
                pTextarea
                class="w-full"
                [rows]="4"
                [autoResize]="true"
                formControlName="description"
                placeholder="Describe the task requirements..."
              ></textarea>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="project-form-label">Priority</label>
              <p-select
                formControlName="priority"
                appendTo="body"
                styleClass="w-full"
                [options]="[
                  { label: 'Low', value: 'Low' },
                  { label: 'Medium', value: 'Medium' },
                  { label: 'High', value: 'High' },
                  { label: 'Critical', value: 'Critical' },
                ]"
              ></p-select>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="project-form-label">Due date</label>
              <p-datepicker
                formControlName="dueDate"
                [showIcon]="true"
                dateFormat="dd/mm/yy"
                placeholder="dd/mm/yyyy"
                styleClass="w-full"
                appendTo="body"
              ></p-datepicker>
            </div>

            <div class="flex flex-col gap-1.5 sm:col-span-2">
              <label class="project-form-label">Status</label>
              <p-select
                formControlName="status"
                appendTo="body"
                styleClass="w-full"
                [options]="[
                  { label: 'Not Started', value: 'NotStarted' },
                  { label: 'In Progress', value: 'InProgress' },
                  { label: 'On Hold', value: 'OnHold' },
                  { label: 'Review', value: 'Review' },
                  { label: 'Completed', value: 'Completed' },
                  { label: 'Cancelled', value: 'Cancelled' },
                ]"
              ></p-select>
            </div>

            <div class="flex flex-col gap-1.5 sm:col-span-2">
              <label class="project-form-label">Assignees</label>
              <p-multiselect
                formControlName="assignedUserIds"
                appendTo="body"
                styleClass="w-full"
                [options]="userSelection"
                [filter]="true"
                [showClear]="true"
                placeholder="Select team members"
              ></p-multiselect>
            </div>
          </div>

          <div
            class="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6"
          >
            <p-button
              label="Cancel"
              severity="secondary"
              [outlined]="true"
              styleClass="w-full!"
              (onClick)="taskDialog = false"
            ></p-button>
            <p-button
              (onClick)="SaveTask()"
              styleClass="w-full! bg-blue-700! hover:bg-blue-500! border-none!"
              [label]="taskUpdate ? 'Save changes' : 'Create task'"
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
              [options]="PagingSignal().projectTasks || []"
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
  `,
  styleUrl: './project-details.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetails implements OnInit, OnDestroy {
  private readonly loadingService = inject(LoadingService);
  private readonly projectService = inject(ProjectService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly jobSheetService = inject(JobSheetService);
  private readonly projectTaskService = inject(ProjectTaskService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  PagingSignal = signal<ProjectDto>({} as ProjectDto);
  projectId: string | null = null;
  expandedRows: { [key: string]: boolean } = {};
  userSelection: any;

  taskDialog: boolean = false;
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

  taskForm!: FormGroup;
  materialForm!: FormGroup;
  jobSheetForm!: FormGroup;

  selectedTask: any;
  selectedMaterial: any;
  selectedJobSheet: any;

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
        Includes: 'ProjectMembers, ProjectTasks',
        Filter: `Id=${this.projectId}`,
      })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();

          if (res) {
            res.projectTasks =
              res.projectTasks?.sort(
                (a: any, b: any) =>
                  new Date(a.createdAt).getTime() -
                  new Date(b.createdAt).getTime(),
              ) ?? [];

            res.siteMaterialRequests = res.siteMaterialRequests ?? [];

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

  ActionClick(type: string) {
    if (type === 'requestMaterial') {
      this.router.navigate(['/hardware-request'], {
        queryParams: {
          type: 'SiteMaterial',
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

  OpenTaskDialog() {
    this.getUserDropdown();
    this.initTaskForm();
    this.taskDialog = true;
  }

  EditTask(task: any) {
    this.selectedTask = task;
    this.taskUpdate = true;
    this.OpenTaskDialog();
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
  }

  initTaskForm() {
    this.taskForm = new FormGroup({
      id: new FormControl<string | null>({ value: null, disabled: true }),
      projectId: new FormControl(this.PagingSignal().id),
      title: new FormControl(null, Validators.required),
      description: new FormControl(null),
      priority: new FormControl('Low'),
      status: new FormControl('NotStarted'),
      dueDate: new FormControl<Date | null>(null),
      assignedUserIds: new FormControl<string[]>([]),
    });

    if (!this.taskUpdate || !this.selectedTask) {
      return;
    }

    this.taskForm.get('id')?.enable();

    this.taskForm.patchValue({
      id: this.selectedTask.id,
      projectId: this.selectedTask.projectId,
      title: this.selectedTask.title,
      description: this.selectedTask.description,
      priority: this.selectedTask.priority,
      dueDate: this.selectedTask.dueDate
        ? new Date(this.selectedTask.dueDate)
        : null,
      assignedUserIds:
        this.selectedTask.assignedTaskMembers?.map((x: any) => x.userId) ?? [],
    });
  }

  SaveTask() {
    if (this.taskForm.invalid) {
      ValidateAllFormFields(this.taskForm);
      return;
    }

    this.loadingService.start();

    const request = this.taskForm.getRawValue();

    const $request = this.taskUpdate
      ? this.projectTaskService.Update(request)
      : this.projectTaskService.Create(request);

    $request.pipe(takeUntil(this.ngUnsubscribe)).subscribe({
      next: (task) => {
        this.loadingService.stop();

        this.PagingSignal.update((project) => {
          if (this.taskUpdate) {
            return {
              ...project,
              projectTasks: project.projectTasks.map((t) =>
                t.id === task.id ? task : t,
              ),
            };
          }

          return {
            ...project,
            projectTasks: [...project.projectTasks, task],
          };
        });

        this.taskDialog = false;
        this.taskUpdate = false;
        this.selectedTask = null;
        this.taskForm.reset();

        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingService.stop();
      },
    });
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

    this.projectTaskService
      .Delete(id)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: () => {
          this.loadingService.stop();

          this.PagingSignal.update((project) => ({
            ...project,
            projectTasks: project.projectTasks.filter((x) => x.id !== id),
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

    const task = this.PagingSignal().projectTasks?.find(
      (x: any) => x.id === taskId,
    );

    if (!task) {
      this.jobSheetForm.patchValue({
        members: [],
      });

      return;
    }

    const members: string[] =
      task.assignedTaskMembers?.map((member: any) => member.userId) ?? [];

    this.jobSheetForm.patchValue({
      members,
    });
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

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
