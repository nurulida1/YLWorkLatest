import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, timer } from 'rxjs';
import { DailyReportService } from '../../../services/DailyReportService';
import {
  DailyReportDto,
  DailyReportTaskDto,
  CreateDailyReportRequest,
  UpdateDailyReportRequest,
  DailyReportStaffTaskDropdown,
} from '../../../models/DailyReport';
import { SelectModule } from 'primeng/select';
import { ProjectDto } from '../../../models/Project';
import { ProjectService } from '../../../services/ProjectService';
import { UserService } from '../../../services/userService.service';
import { DatePickerModule } from 'primeng/datepicker';
@Component({
  selector: 'app-daily-report',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SelectModule, DatePickerModule],
  template: `
    <div class="w-full min-h-[92vh] bg-slate-50 p-3 sm:p-6 lg:p-8">
      <!-- HEADER -->
      <div
        class="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
      >
        <div>
          <h1 class="text-2xl font-bold text-gray-800">Daily Reports</h1>
          <p class="mt-1 text-sm text-gray-500">
            View your daily reports, project team progress and assigned task
            updates.
          </p>
        </div>

        <button
          type="button"
          (click)="openCreate()"
          class="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 sm:w-auto"
        >
          <i class="pi pi-plus mr-2"></i>
          Create Daily Report
        </button>
      </div>

      <!-- REPORT LIST -->
      <div class="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div
          class="flex items-center justify-between border-b border-gray-200 p-4"
        >
          <div>
            <h2 class="font-semibold text-gray-800">Report History</h2>
            <p class="mt-1 text-xs text-gray-500">
              {{ reports.length }} report(s)
            </p>
          </div>

          <button
            type="button"
            (click)="GetData()"
            class="text-sm text-blue-600 hover:text-blue-700"
          >
            <i class="pi pi-refresh mr-1"></i>
            Refresh
          </button>
        </div>

        @if (isLoading) {
          <div class="p-10 text-center text-gray-500">
            <i class="pi pi-spin pi-spinner text-2xl"></i>
            <p class="mt-2 text-sm">Loading daily reports...</p>
          </div>
        } @else if (reports.length === 0) {
          <div class="p-12 text-center">
            <i class="pi pi-file-edit text-4xl text-gray-300"></i>
            <p class="mt-3 font-medium text-gray-700">No daily reports found</p>
            <p class="mt-1 text-sm text-gray-500">
              Create your first daily report to get started.
            </p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full min-w-[900px] text-left text-sm">
              <thead class="bg-gray-50 text-gray-600">
                <tr>
                  <th class="px-5 py-3 font-semibold">Report Date</th>
                  <th class="px-5 py-3 font-semibold">Employee</th>
                  <th class="px-5 py-3 font-semibold">Project</th>
                  <th class="px-5 py-3 font-semibold">Completed Work</th>
                  <th class="px-5 py-3 text-center font-semibold">Tasks</th>
                  <th class="px-5 py-3 text-center font-semibold">Status</th>
                  <th class="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody class="divide-y divide-gray-100">
                @for (report of reports; track report.id) {
                  <tr class="hover:bg-gray-50">
                    <td class="whitespace-nowrap px-5 py-4 text-gray-700">
                      {{ report.reportDate | date: 'dd MMM yyyy' }}
                    </td>

                    <td class="whitespace-nowrap px-5 py-4 text-gray-700">
                      {{ report.employeeName || 'Unknown Employee' }}
                    </td>

                    <td class="px-5 py-4 text-gray-600">
                      {{ report.projectName || 'No project' }}
                    </td>

                    <td class="max-w-xs px-5 py-4">
                      <p class="line-clamp-2 text-gray-700">
                        {{
                          report.completedWork || 'No completed work recorded'
                        }}
                      </p>
                    </td>

                    <td class="px-5 py-4 text-center">
                      <span
                        class="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
                      >
                        {{ report.tasks.length || 0 }}
                      </span>
                    </td>

                    <td class="px-5 py-4 text-center">
                      <span
                        class="rounded-full px-2.5 py-1 text-xs font-medium"
                        [ngClass]="getStatusClass(report.status)"
                      >
                        {{ report.status }}
                      </span>
                    </td>

                    <td class="px-5 py-4">
                      <div class="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          title="View"
                          (click)="viewReport(report)"
                          class="rounded-lg p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <i class="pi pi-eye"></i>
                        </button>

                        @if (
                          report.canReview && report.status === 'Submitted'
                        ) {
                          <button
                            type="button"
                            title="Approve"
                            [disabled]="reviewingReportId === report.id"
                            (click)="approveReport(report)"
                            class="rounded-lg p-2 text-gray-500 hover:bg-green-50 hover:text-green-600 disabled:opacity-50"
                          >
                            <i class="pi pi-check"></i>
                          </button>

                          <button
                            type="button"
                            title="Reject"
                            [disabled]="reviewingReportId === report.id"
                            (click)="openReject(report)"
                            class="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          >
                            <i class="pi pi-times"></i>
                          </button>
                        }

                        @if (
                          isReportOwner(report) && report.status === 'Draft'
                        ) {
                          <button
                            type="button"
                            title="Edit"
                            (click)="openEdit(report)"
                            class="rounded-lg p-2 text-gray-500 hover:bg-amber-50 hover:text-amber-600"
                          >
                            <i class="pi pi-pencil"></i>
                          </button>

                          <button
                            type="button"
                            title="Submit"
                            (click)="submitReport(report)"
                            class="rounded-lg p-2 text-gray-500 hover:bg-green-50 hover:text-green-600"
                          >
                            <i class="pi pi-send"></i>
                          </button>

                          <button
                            type="button"
                            title="Delete"
                            (click)="openDelete(report)"
                            class="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
                          >
                            <i class="pi pi-trash"></i>
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- CREATE / EDIT DIALOG -->
      @if (showFormDialog) {
        <div
          class="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto bg-black/50 p-2 sm:p-5 h-full"
        >
          <div
            class="my-auto flex max-h-[80%] md:max-h-[90%] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl sm:max-h-[95dvh]"
          >
            <!-- HEADER -->
            <div
              class="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3 sm:px-5 sm:py-4"
            >
              <div>
                <h2 class="text-lg font-semibold text-gray-800">
                  {{ isUpdate ? 'Edit Daily Report' : 'Create Daily Report' }}
                </h2>
                <p class="mt-1 text-xs text-gray-500">
                  Record your daily activities and progress.
                </p>
              </div>

              <button
                type="button"
                (click)="closeForm()"
                class="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
              >
                <i class="pi pi-times"></i>
              </button>
            </div>

            <!-- SCROLLABLE FORM BODY -->
            <form
              [formGroup]="reportForm"
              (ngSubmit)="saveReport()"
              class="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-4 sm:p-5"
            >
              <!-- GENERAL DETAILS -->
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label class="mb-1 block text-sm font-medium text-gray-700">
                    Report Date <span class="text-red-500">*</span>
                  </label>

                  <p-datepicker
                    formControlName="reportDate"
                    dateFormat="dd M yy"
                    placeholder="Select report date"
                    [showIcon]="true"
                    iconDisplay="input"
                    [showButtonBar]="true"
                    [touchUI]="false"
                    appendTo="body"
                    styleClass="w-full"
                    inputStyleClass="w-full !text-base sm:!text-sm py-3!"
                  ></p-datepicker>

                  @if (
                    reportForm.controls.reportDate.touched &&
                    reportForm.controls.reportDate.invalid
                  ) {
                    <p class="mt-1 text-xs text-red-500">
                      Report date is required.
                    </p>
                  }
                </div>

                <div>
                  <label class="mb-1 block text-sm font-medium text-gray-700">
                    Project <span class="text-gray-400">(Optional)</span>
                  </label>

                  <p-select
                    formControlName="projectId"
                    [options]="projects"
                    optionLabel="name"
                    optionValue="id"
                    placeholder="Select Project"
                    [showClear]="!!reportForm.get('projectId')?.value"
                    [filter]="true"
                    filterBy="name"
                    styleClass="w-full py-0.5!"
                    appendTo="body"
                  ></p-select>
                </div>
              </div>

              <!-- COMPLETED WORK -->
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700">
                  Completed Work
                </label>

                <textarea
                  formControlName="completedWork"
                  rows="3"
                  placeholder="Describe the work completed today..."
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-base outline-none focus:border-blue-500 sm:text-sm"
                ></textarea>
              </div>

              <!-- IN PROGRESS -->
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700">
                  In Progress Work
                </label>

                <textarea
                  formControlName="inProgressWork"
                  rows="3"
                  placeholder="Describe work that is still ongoing..."
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-base outline-none focus:border-blue-500 sm:text-sm"
                ></textarea>
              </div>

              <!-- ISSUES -->
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700">
                  Issues / Blockers
                </label>

                <textarea
                  formControlName="issues"
                  rows="3"
                  placeholder="Describe any issues encountered..."
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-base outline-none focus:border-blue-500 sm:text-sm"
                ></textarea>
              </div>

              <!-- NEXT DAY PLAN -->
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700">
                  Next Day Plan
                </label>

                <textarea
                  formControlName="nextDayPlan"
                  rows="3"
                  placeholder="What do you plan to do next?"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-base outline-none focus:border-blue-500 sm:text-sm"
                ></textarea>
              </div>

              <!-- TASKS -->
              <div>
                <div
                  class="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h3 class="font-semibold text-gray-800">Linked Tasks</h3>
                    <p class="mt-1 text-xs text-gray-500">
                      Link tasks assigned to you or assigned by you.
                    </p>
                  </div>

                  <button
                    type="button"
                    (click)="addTask()"
                    class="w-full rounded-lg border border-blue-200 px-3 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50 sm:w-auto"
                  >
                    <i class="pi pi-plus mr-1"></i>
                    Add Task
                  </button>
                </div>

                <div formArrayName="tasks" class="space-y-3">
                  @for (task of tasks.controls; track $index; let i = $index) {
                    <div
                      [formGroupName]="i"
                      class="rounded-lg border border-gray-200 bg-gray-50 p-3 sm:p-4"
                    >
                      <div class="mb-3 flex items-center justify-between">
                        <span class="font-semibold text-gray-700">
                          Task {{ i + 1 }}
                        </span>

                        <button
                          type="button"
                          (click)="removeTask(i)"
                          class="text-xs! text-red-500 hover:text-red-700"
                        >
                          <i class="pi pi-trash text-xs! mr-1"></i>
                          Remove
                        </button>
                      </div>

                      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div class="sm:col-span-2">
                          <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                          >
                            Task
                          </label>

                          <p-select
                            formControlName="staffTaskId"
                            [options]="staffTasks"
                            optionLabel="title"
                            optionValue="id"
                            placeholder="Select Task"
                            [filter]="true"
                            [showClear]="reportForm.get('staffTaskId')?.value"
                            styleClass="w-full"
                            appendTo="body"
                          ></p-select>

                          @if (
                            task.get('staffTaskId')?.touched &&
                            task.get('staffTaskId')?.invalid
                          ) {
                            <p class="mt-1 text-xs text-red-500">
                              Task is required.
                            </p>
                          }
                        </div>

                        <div>
                          <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                          >
                            Hours Spent
                          </label>

                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            formControlName="hoursSpent"
                            placeholder="e.g. 2.5"
                            class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base outline-none focus:border-blue-500 sm:text-sm"
                          />
                        </div>

                        <div class="sm:col-span-2">
                          <label
                            class="mb-1 block text-xs font-medium text-gray-600"
                          >
                            Work Description
                          </label>

                          <textarea
                            formControlName="workDescription"
                            rows="2"
                            placeholder="Describe the work done for this task..."
                            class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base outline-none focus:border-blue-500 sm:text-sm"
                          ></textarea>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              </div>
            </form>

            <!-- FIXED FOOTER -->
            <div
              class="flex shrink-0 flex-col-reverse gap-2 border-t border-gray-200 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-5 sm:py-4"
            >
              <button
                type="button"
                (click)="closeForm()"
                class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 sm:w-auto"
              >
                Cancel
              </button>

              <button
                type="button"
                [disabled]="isSaving"
                (click)="saveReport()"
                class="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 sm:w-auto"
              >
                @if (isSaving) {
                  <i class="pi pi-spin pi-spinner mr-2"></i>
                  Saving...
                } @else {
                  <i class="pi pi-save mr-2"></i>
                  {{ isUpdate ? 'Update Report' : 'Create Report' }}
                }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- VIEW DIALOG -->
      @if (showViewDialog && selectedReport) {
        <div
          class="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto bg-black/50 p-2 sm:p-5"
        >
          <div
            class="my-auto flex max-h-[calc(100dvh-1rem)] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl sm:max-h-[90dvh]"
          >
            <div
              class="flex shrink-0 items-center justify-between border-b border-gray-200 p-4 sm:p-5"
            >
              <h2 class="text-lg font-semibold text-gray-800">
                Daily Report Details
              </h2>

              <button
                type="button"
                (click)="showViewDialog = false"
                class="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
              >
                <i class="pi pi-times"></i>
              </button>
            </div>

            <div
              class="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-4 sm:p-5"
            >
              <div>
                <h3 class="text-xl font-semibold text-gray-800">
                  {{ selectedReport.reportDate | date: 'dd MMMM yyyy' }}
                </h3>

                <p class="mt-1 text-sm text-gray-500">
                  Submitted by:
                  <span class="font-medium text-gray-700">
                    {{ selectedReport.employeeName || 'Unknown Employee' }}
                  </span>
                </p>

                <span
                  class="mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-medium"
                  [ngClass]="getStatusClass(selectedReport.status)"
                >
                  {{ selectedReport.status }}
                </span>
              </div>

              <div>
                <p class="text-xs font-semibold uppercase text-gray-400">
                  Project
                </p>
                <p class="mt-1 text-sm text-gray-700">
                  {{ selectedReport.projectName || 'No project linked' }}
                </p>
              </div>

              @for (
                section of [
                  {
                    label: 'Completed Work',
                    value: selectedReport.completedWork,
                  },
                  {
                    label: 'In Progress Work',
                    value: selectedReport.inProgressWork,
                  },
                  { label: 'Issues / Blockers', value: selectedReport.issues },
                  { label: 'Next Day Plan', value: selectedReport.nextDayPlan },
                ];
                track section.label
              ) {
                <div>
                  <p class="text-xs font-semibold uppercase text-gray-400">
                    {{ section.label }}
                  </p>
                  <p class="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                    {{ section.value || 'Not provided.' }}
                  </p>
                </div>
              }

              <div>
                <h3 class="mb-3 font-semibold text-gray-800">Linked Tasks</h3>

                @if (selectedReport.tasks.length) {
                  <div class="space-y-3">
                    @for (task of selectedReport.tasks; track task.id) {
                      <div class="rounded-lg border border-gray-200 p-4">
                        <p class="font-medium text-gray-800">
                          {{ task.taskTitle || 'Staff Task' }}
                        </p>

                        <p
                          class="mt-2 whitespace-pre-wrap text-sm text-gray-600"
                        >
                          {{ task.workDescription || 'No work description.' }}
                        </p>

                        <p class="mt-2 text-xs text-gray-500">
                          Hours spent: {{ task.hoursSpent }}
                        </p>
                      </div>
                    }
                  </div>
                } @else {
                  <p class="text-sm text-gray-500">No linked tasks.</p>
                }
              </div>

              @if (selectedReport.reviewRemarks) {
                <div>
                  <p class="text-xs font-semibold uppercase text-gray-400">
                    Review Remarks
                  </p>
                  <p class="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                    {{ selectedReport.reviewRemarks }}
                  </p>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- REJECT CONFIRMATION -->
      @if (showRejectDialog) {
        <div
          class="fixed inset-0 z-[1100] flex items-center justify-center overflow-y-auto bg-black/60 p-3 sm:p-4"
        >
          <div
            class="my-auto w-full max-w-md rounded-xl bg-white p-4 shadow-2xl sm:p-5"
          >
            <div class="flex items-start gap-3">
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500"
              >
                <i class="pi pi-times-circle text-xl"></i>
              </div>

              <div>
                <h3 class="font-semibold text-gray-800">
                  Reject Daily Report?
                </h3>
                <p class="mt-1 text-sm text-gray-500">
                  Please provide a reason for rejecting this report.
                </p>
              </div>
            </div>

            <div class="mt-4">
              <label class="mb-1 block text-sm font-medium text-gray-700">
                Rejection Remarks <span class="text-red-500">*</span>
              </label>

              <textarea
                rows="4"
                [value]="rejectRemarks"
                (input)="rejectRemarks = $any($event.target).value"
                placeholder="Explain why this report is rejected..."
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-base outline-none focus:border-red-500 sm:text-sm"
              ></textarea>
            </div>

            <div
              class="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"
            >
              <button
                type="button"
                (click)="closeReject()"
                [disabled]="isReviewing"
                class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-600 sm:w-auto"
              >
                Cancel
              </button>

              <button
                type="button"
                (click)="confirmReject()"
                [disabled]="isReviewing || !rejectRemarks.trim()"
                class="w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 sm:w-auto"
              >
                {{ isReviewing ? 'Rejecting...' : 'Confirm Reject' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- DELETE CONFIRMATION -->
      @if (showDeleteDialog) {
        <div
          class="fixed inset-0 z-[1100] flex items-center justify-center overflow-y-auto bg-black/60 p-3 sm:p-4"
        >
          <div
            class="my-auto w-full max-w-md rounded-xl bg-white p-4 shadow-2xl sm:p-5"
          >
            <div class="flex items-start gap-3">
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500"
              >
                <i class="pi pi-exclamation-triangle text-xl"></i>
              </div>

              <div>
                <h3 class="font-semibold text-gray-800">
                  Delete Daily Report?
                </h3>

                <p class="mt-2 text-sm text-gray-500">
                  Are you sure you want to delete this report for
                  <strong class="text-gray-700">
                    {{
                      reportToDelete?.reportDate | date: 'dd MMM yyyy'
                    }} </strong
                  >? This action cannot be undone.
                </p>
              </div>
            </div>

            <div
              class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"
            >
              <button
                type="button"
                (click)="showDeleteDialog = false"
                class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-600 sm:w-auto"
              >
                Cancel
              </button>

              <button
                type="button"
                [disabled]="isDeleting"
                (click)="confirmDelete()"
                class="w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 sm:w-auto"
              >
                {{ isDeleting ? 'Deleting...' : 'Yes, Delete' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- SUCCESS MESSAGE -->
      @if (successMessage) {
        <div
          class="fixed inset-x-3 top-3 z-[1200] rounded-lg bg-green-600 px-4 py-3 text-sm text-white shadow-lg sm:inset-x-auto sm:right-5 sm:top-5"
        >
          <i class="pi pi-check-circle mr-2"></i>
          {{ successMessage }}
        </div>
      }
    </div>
  `,
  styleUrl: './daily-report.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailyReport implements OnInit {
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private readonly projectService = inject(ProjectService);
  private dailyReportService = inject(DailyReportService);
  private userService = inject(UserService);
  private successTimer?: Subscription;
  reports: DailyReportDto[] = [];
  projects: any[] = [];

  isLoading: boolean = false;
  isSaving: boolean = false;
  isDeleting: boolean = false;
  isUpdate: boolean = false;

  showFormDialog: boolean = false;
  showViewDialog: boolean = false;
  showDeleteDialog: boolean = false;
  showRejectDialog: boolean = false;

  isReviewing: boolean = false;

  reviewingReportId: string | null = null;

  reportToReject: DailyReportDto | null = null;

  rejectRemarks: string = '';

  selectedReport: DailyReportDto | null = null;
  reportToDelete: DailyReportDto | null = null;
  staffTasks: DailyReportStaffTaskDropdown[] = [];

  successMessage: string = '';

  reportForm = this.fb.group({
    id: [null as string | null],
    projectId: [null as string | null],
    reportDate: [this.getToday(), Validators.required],
    completedWork: [''],
    inProgressWork: [''],
    issues: [''],
    nextDayPlan: [''],
    tasks: this.fb.array([]),
  });

  ngOnInit(): void {
    this.GetDropdown();
    this.GetData();

    this.OnChanges();
  }

  OnChanges(): void {
    this.reportForm
      .get('projectId')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((projectId) => {
        this.loadStaffTasks(projectId);
        this.tasks.clear();
      });
  }

  loadStaffTasks(projectId?: string | null): void {
    this.dailyReportService.GetMyStaffTasks(projectId).subscribe({
      next: (response) => {
        this.staffTasks = response;
      },
      error: (error) => {
        console.error('Failed to load staff tasks:', error);
        this.staffTasks = [];
      },
    });
  }

  GetDropdown(): void {
    this.projectService
      .GetMany({
        Page: 1,
        PageSize: 1000,
        Filter: null,
        OrderBy: 'ProjectTitle',
        Includes: null,
        Select: null,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.projects =
            response?.data.map((p) => ({
              id: p.id,
              name: `${p.projectCode} - ${p.projectTitle}`,
            })) ?? [];

          this.cdr.markForCheck();
        },
        error: () => {
          this.projects = [];
          this.cdr.markForCheck();
        },
      });
  }

  get tasks(): FormArray {
    return this.reportForm.controls.tasks as FormArray;
  }

  private getToday(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private createTaskForm(task?: Partial<DailyReportTaskDto>) {
    return this.fb.group({
      staffTaskId: [task?.staffTaskId ?? '', Validators.required],
      workDescription: [task?.workDescription ?? ''],
      hoursSpent: [task?.hoursSpent ?? 0, [Validators.min(0)]],
    });
  }

  addTask(): void {
    this.tasks.push(this.createTaskForm());
    this.cdr.markForCheck();
  }

  removeTask(index: number): void {
    this.tasks.removeAt(index);
    this.cdr.markForCheck();
  }

  // ==========================================
  // GET MY REPORTS
  // ==========================================
  GetData(): void {
    this.isLoading = true;

    this.dailyReportService
      .GetMyReports()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.reports = (response ?? []).filter(
            (report) => report.employeeId === this.currentUserId,
          );

          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }
  // ==========================================
  // CREATE
  // ==========================================
  openCreate(): void {
    this.isUpdate = false;
    this.selectedReport = null;

    this.reportForm.reset({
      id: null,
      projectId: null,
      reportDate: this.getToday(),
      completedWork: null,
      inProgressWork: null,
      issues: null,
      nextDayPlan: null,
    });

    this.tasks.clear();
    this.tasks.push(this.createTaskForm());

    this.showFormDialog = true;
    this.cdr.markForCheck();
  }

  // ==========================================
  // EDIT
  // ==========================================
  openEdit(report: DailyReportDto): void {
    if (!this.isReportOwner(report) || report.status !== 'Draft') {
      return;
    }

    this.isUpdate = true;

    this.dailyReportService
      .GetById(report.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (!response) {
            this.showSuccess('Daily report not found.');
            return;
          }

          this.selectedReport = response;

          this.reportForm.patchValue({
            id: response.id,
            projectId: response.projectId ?? '',
            reportDate:
              response.reportDate?.substring(0, 10) ?? this.getToday(),
            completedWork: response.completedWork ?? '',
            inProgressWork: response.inProgressWork ?? '',
            issues: response.issues ?? '',
            nextDayPlan: response.nextDayPlan ?? '',
          });

          this.tasks.clear();

          for (const task of response.tasks ?? []) {
            this.tasks.push(this.createTaskForm(task));
          }

          if (this.tasks.length === 0) {
            this.tasks.push(this.createTaskForm());
          }

          this.showFormDialog = true;
          this.cdr.markForCheck();
        },
        error: () => {
          this.cdr.markForCheck();
        },
      });
  }

  // ==========================================
  // VIEW
  // ==========================================
  viewReport(report: DailyReportDto): void {
    this.dailyReportService
      .GetById(report.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.selectedReport = response;
          this.showViewDialog = !!response;
          this.cdr.markForCheck();
        },
        error: () => {
          this.showViewDialog = false;
          this.cdr.markForCheck();
        },
      });
  }

  closeForm(): void {
    if (this.isSaving) {
      return;
    }

    this.showFormDialog = false;
    this.selectedReport = null;
  }

  // ==========================================
  // SAVE
  // ==========================================
  saveReport(): void {
    if (this.reportForm.invalid) {
      this.reportForm.markAllAsTouched();
      return;
    }

    const value = this.reportForm.getRawValue();

    const projectId = value.projectId?.trim() || null;

    const tasks = value.tasks
      .filter((task: any) => task.staffTaskId?.trim())
      .map((task: any) => ({
        staffTaskId: task.staffTaskId.trim(),
        workDescription: task.workDescription?.trim() || null,
        hoursSpent: Number(task.hoursSpent) || 0,
      }));

    const baseRequest: CreateDailyReportRequest = {
      projectId,
      reportDate: value.reportDate!,
      completedWork: value.completedWork?.trim() || null,
      inProgressWork: value.inProgressWork?.trim() || null,
      issues: value.issues?.trim() || null,
      nextDayPlan: value.nextDayPlan?.trim() || null,
      tasks,
    };

    this.isSaving = true;

    if (this.isUpdate) {
      const request: UpdateDailyReportRequest = {
        ...baseRequest,
        id: value.id!,
      };

      this.dailyReportService
        .Update(request)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            this.finishSave(
              response.message || 'Daily report updated successfully.',
            );
          },
          error: () => {
            this.isSaving = false;
            this.cdr.markForCheck();
          },
        });
    } else {
      this.dailyReportService
        .Create(baseRequest)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            this.finishSave(
              response.message || 'Daily report created successfully.',
            );
          },
          error: () => {
            this.isSaving = false;
            this.cdr.markForCheck();
          },
        });
    }
  }

  private finishSave(message: string): void {
    this.isSaving = false;
    this.showFormDialog = false;
    this.selectedReport = null;

    this.showSuccess(message);
    this.GetData();
    this.cdr.markForCheck();
  }

  // ==========================================
  // SUBMIT
  // ==========================================
  submitReport(report: DailyReportDto): void {
    if (!this.isReportOwner(report) || report.status !== 'Draft') {
      return;
    }

    this.dailyReportService
      .Submit(report.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.showSuccess(
            response.message || 'Daily report submitted successfully.',
          );
          this.GetData();
        },
      });
  }

  // ==========================================
  // APPROVE
  // ==========================================
  approveReport(report: DailyReportDto): void {
    if (!report.canReview || report.status !== 'Submitted') {
      return;
    }

    if (this.isReviewing) {
      return;
    }

    this.isReviewing = true;
    this.reviewingReportId = report.id;

    this.dailyReportService
      .Approve(report.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isReviewing = false;
          this.reviewingReportId = null;

          this.showSuccess(
            response.message || 'Daily report approved successfully.',
          );

          this.GetData();
          this.cdr.markForCheck();
        },
        error: () => {
          this.isReviewing = false;
          this.reviewingReportId = null;
          this.cdr.markForCheck();
        },
      });
  }

  // ==========================================
  // REJECT
  // ==========================================
  openReject(report: DailyReportDto): void {
    if (!report.canReview || report.status !== 'Submitted') {
      return;
    }

    this.reportToReject = report;
    this.rejectRemarks = '';
    this.showRejectDialog = true;

    this.cdr.markForCheck();
  }

  closeReject(): void {
    if (this.isReviewing) {
      return;
    }

    this.showRejectDialog = false;
    this.reportToReject = null;
    this.rejectRemarks = '';

    this.cdr.markForCheck();
  }

  confirmReject(): void {
    if (
      !this.reportToReject ||
      !this.reportToReject.canReview ||
      this.reportToReject.status !== 'Submitted' ||
      !this.rejectRemarks.trim() ||
      this.isReviewing
    ) {
      return;
    }

    const reportId = this.reportToReject.id;
    const remarks = this.rejectRemarks.trim();

    this.isReviewing = true;
    this.reviewingReportId = reportId;

    this.dailyReportService
      .Reject(reportId, remarks)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isReviewing = false;
          this.reviewingReportId = null;

          this.showRejectDialog = false;
          this.reportToReject = null;
          this.rejectRemarks = '';

          this.showSuccess(
            response.message || 'Daily report rejected successfully.',
          );

          this.GetData();
          this.cdr.markForCheck();
        },
        error: () => {
          this.isReviewing = false;
          this.reviewingReportId = null;
          this.cdr.markForCheck();
        },
      });
  }

  // ==========================================
  // DELETE
  // ==========================================
  openDelete(report: DailyReportDto): void {
    if (!this.isReportOwner(report) || report.status !== 'Draft') {
      return;
    }

    this.reportToDelete = report;
    this.showDeleteDialog = true;
    this.cdr.markForCheck();
  }

  confirmDelete(): void {
    if (!this.reportToDelete?.id) {
      return;
    }

    this.isDeleting = true;

    this.dailyReportService
      .Delete(this.reportToDelete.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isDeleting = false;
          this.showDeleteDialog = false;
          this.reportToDelete = null;

          this.showSuccess(
            response.message || 'Daily report deleted successfully.',
          );
          this.GetData();
          this.cdr.markForCheck();
        },
        error: () => {
          this.isDeleting = false;
          this.cdr.markForCheck();
        },
      });
  }

  // ==========================================
  // STATUS
  // ==========================================
  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'draft':
        return 'bg-gray-100 text-gray-700';

      case 'submitted':
        return 'bg-blue-50 text-blue-700';

      case 'approved':
        return 'bg-green-50 text-green-700';

      case 'rejected':
        return 'bg-red-50 text-red-700';

      default:
        return 'bg-gray-100 text-gray-700';
    }
  }

  // ==========================================
  // SUCCESS MESSAGE
  // ==========================================
  private showSuccess(message: string): void {
    this.successMessage = message;
    this.cdr.markForCheck();

    this.successTimer?.unsubscribe();

    this.successTimer = timer(3000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.successMessage = '';
        this.cdr.markForCheck();
      });
  }

  get currentUserId(): string {
    return this.userService.currentUser?.userId ?? '';
  }

  isReportOwner(report: DailyReportDto): boolean {
    return report.employeeId === this.currentUserId;
  }
}
