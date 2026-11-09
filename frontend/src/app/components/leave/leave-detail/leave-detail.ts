import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { finalize } from 'rxjs/operators';
import {
  LeaveApprovalChainStepDto,
  LeaveRequestDto,
} from '../../../models/Leave';
import {
  formatDaysAmount,
  formatLeaveDurationLabel,
} from '../../../common/guard/leave-day.util';
import { LeaveRequestService } from '../../../services/leave-request.service';
import { LoadingService } from '../../../services/loading.service';
import { UserService } from '../../../services/userService.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-leave-detail',
  imports: [CommonModule, RouterLink, TagModule, ButtonModule],
  template: `
    <div class="min-h-screen w-full bg-slate-50">
      <div
        class="mx-auto flex w-full max-w-[1440px] flex-col gap-5 p-4 sm:gap-6 sm:p-6 lg:p-8"
      >
        @if (request) {
          <!-- Breadcrumb -->
          <div class="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
            <a
              routerLink="/dashboard"
              class="text-slate-400 transition hover:text-blue-600"
            >
              Dashboard
            </a>
            <i class="pi pi-angle-right text-[9px] text-slate-300"></i>
            <a
              routerLink="/leave"
              class="text-slate-400 transition hover:text-blue-600"
            >
              Leave
            </a>
            <i class="pi pi-angle-right text-[9px] text-slate-300"></i>
            <span class="font-semibold text-slate-700">Leave Details</span>
          </div>

          <!-- Page Header -->
          <div
            class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div class="h-1.5 bg-blue-700"></div>

            <div
              class="flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between"
            >
              <div class="min-w-0">
                <div class="mb-3 flex flex-wrap items-center gap-2">
                  <span
                    class="rounded-md bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700"
                  >
                    Leave Application
                  </span>

                  <p-tag
                    [value]="request.status"
                    [severity]="statusSeverity(request.status)"
                  />
                </div>

                <h1
                  class="break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
                >
                  {{ request.leaveTypeName }}
                </h1>

                <p class="mt-2 text-sm text-slate-500">
                  Application submitted by
                  <span class="font-semibold text-slate-700">
                    {{ request.employeeName }}
                  </span>
                </p>

                <div class="mt-4 flex flex-wrap gap-2">
                  @if (request.isShortNoticeAnnual) {
                    <p-tag value="Short Notice · Unpaid" severity="warn" />
                  } @else if (hasBalanceSplit(request)) {
                    <p-tag value="Balance Split" severity="warn" />
                  } @else if (request.isUnpaid) {
                    <p-tag value="Unpaid Leave" severity="secondary" />
                  }

                  @if (request.isEmergency) {
                    <p-tag value="Emergency Leave" severity="danger" />
                  }
                </div>
              </div>

              @if (canCancel) {
                <div class="w-full shrink-0 sm:w-auto">
                  <p-button
                    label="Cancel Leave"
                    icon="pi pi-times"
                    severity="danger"
                    [outlined]="true"
                    styleClass="w-full sm:w-auto rounded-lg! px-4! py-2.5!"
                    (onClick)="cancel()"
                  />
                </div>
              }
            </div>
          </div>

          <!-- Summary Cards -->
          <div class="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <!-- Duration -->
            <div
              class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
            >
              <div
                class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"
              >
                <i class="pi pi-calendar text-lg"></i>
              </div>

              <p class="mt-4 text-xs font-medium text-slate-400 sm:text-sm">
                Leave Duration
              </p>

              <h2
                class="mt-1 break-words text-xl font-bold text-slate-900 sm:text-2xl"
              >
                {{ formatLeaveDays(request) }}
              </h2>
            </div>

            <!-- Start Date -->
            <div
              class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
            >
              <div
                class="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600"
              >
                <i class="pi pi-calendar-plus text-lg"></i>
              </div>

              <p class="mt-4 text-xs font-medium text-slate-400 sm:text-sm">
                Start Date
              </p>

              <h2 class="mt-1 text-base font-bold text-slate-900 sm:text-lg">
                {{ request.startDate | date: 'dd MMM yyyy' }}
              </h2>
            </div>

            <!-- End Date -->
            <div
              class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
            >
              <div
                class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"
              >
                <i class="pi pi-calendar-check text-lg"></i>
              </div>

              <p class="mt-4 text-xs font-medium text-slate-400 sm:text-sm">
                End Date
              </p>

              <h2 class="mt-1 text-base font-bold text-slate-900 sm:text-lg">
                {{ request.endDate | date: 'dd MMM yyyy' }}
              </h2>
            </div>

            <!-- Submitted -->
            <div
              class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
            >
              <div
                class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600"
              >
                <i class="pi pi-send text-lg"></i>
              </div>

              <p class="mt-4 text-xs font-medium text-slate-400 sm:text-sm">
                Submitted On
              </p>

              <h2 class="mt-1 text-base font-bold text-slate-900 sm:text-lg">
                {{ request.submittedAt | date: 'dd MMM yyyy' }}
              </h2>
            </div>
          </div>

          <!-- Main Layout -->
          <div
            class="grid grid-cols-1 items-start gap-5 lg:grid-cols-3 lg:gap-6"
          >
            <!-- Left Content -->
            <div class="flex min-w-0 flex-col gap-5 lg:col-span-2">
              <!-- Leave Information -->
              <section
                class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                <div
                  class="flex items-center gap-3 border-b border-slate-100 px-5 py-4"
                >
                  <div
                    class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"
                  >
                    <i class="pi pi-file-edit text-lg"></i>
                  </div>

                  <div>
                    <h2 class="font-semibold text-slate-900">
                      Leave Information
                    </h2>
                    <p class="mt-0.5 text-xs text-slate-400">
                      Application details and leave reason
                    </p>
                  </div>
                </div>

                <div
                  class="grid grid-cols-1 gap-x-6 gap-y-5 p-5 sm:grid-cols-2 sm:p-6"
                >
                  <div>
                    <p
                      class="text-[11px] font-semibold uppercase tracking-wider text-slate-400"
                    >
                      Leave Type
                    </p>
                    <p
                      class="mt-1.5 break-words text-sm font-semibold text-slate-800"
                    >
                      {{ request.leaveTypeName }}
                    </p>
                  </div>

                  <div>
                    <p
                      class="text-[11px] font-semibold uppercase tracking-wider text-slate-400"
                    >
                      Employee
                    </p>
                    <p
                      class="mt-1.5 break-words text-sm font-semibold text-slate-800"
                    >
                      {{ request.employeeName }}
                    </p>
                  </div>

                  <div>
                    <p
                      class="text-[11px] font-semibold uppercase tracking-wider text-slate-400"
                    >
                      Start Date
                    </p>
                    <p class="mt-1.5 text-sm font-semibold text-slate-800">
                      {{ request.startDate | date: 'EEEE, dd MMMM yyyy' }}
                    </p>
                  </div>

                  <div>
                    <p
                      class="text-[11px] font-semibold uppercase tracking-wider text-slate-400"
                    >
                      End Date
                    </p>
                    <p class="mt-1.5 text-sm font-semibold text-slate-800">
                      {{ request.endDate | date: 'EEEE, dd MMMM yyyy' }}
                    </p>
                  </div>

                  <div>
                    <p
                      class="text-[11px] font-semibold uppercase tracking-wider text-slate-400"
                    >
                      Total Leave
                    </p>
                    <p class="mt-1.5 text-sm font-semibold text-slate-800">
                      {{ formatLeaveDays(request) }}
                    </p>
                  </div>

                  <div>
                    <p
                      class="text-[11px] font-semibold uppercase tracking-wider text-slate-400"
                    >
                      Submitted Date
                    </p>
                    <p class="mt-1.5 text-sm font-semibold text-slate-800">
                      {{ request.submittedAt | date: 'dd MMM yyyy, HH:mm' }}
                    </p>
                  </div>

                  <!-- Reason -->
                  <div class="sm:col-span-2">
                    <div class="border-t border-slate-100 pt-5">
                      <p
                        class="text-[11px] font-semibold uppercase tracking-wider text-slate-400"
                      >
                        Reason for Leave
                      </p>

                      <div class="mt-3 rounded-lg bg-slate-50 p-4">
                        <p
                          class="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700"
                        >
                          {{ request.reason || 'No reason provided.' }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <!-- Balance Breakdown -->
              @if (hasBalanceSplit(request)) {
                <section
                  class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                >
                  <div
                    class="flex items-center gap-3 border-b border-slate-100 px-5 py-4"
                  >
                    <div
                      class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600"
                    >
                      <i class="pi pi-wallet text-lg"></i>
                    </div>

                    <div>
                      <h2 class="font-semibold text-slate-900">
                        Leave Balance Breakdown
                      </h2>
                      <p class="mt-0.5 text-xs text-slate-400">
                        Allocation across leave balances
                      </p>
                    </div>
                  </div>

                  <div class="divide-y divide-slate-100">
                    @for (
                      line of request.balanceAllocations!;
                      track line.leaveTypeId + line.sortOrder
                    ) {
                      <div
                        class="flex items-center justify-between gap-3 px-5 py-4 sm:px-6"
                      >
                        <div class="min-w-0">
                          <p
                            class="break-words text-sm font-semibold text-slate-800"
                          >
                            {{ line.leaveTypeName }}
                          </p>

                          @if (line.isUnpaidBucket) {
                            <span
                              class="mt-1 inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700"
                            >
                              Unpaid allocation
                            </span>
                          }
                        </div>

                        <div class="shrink-0 text-right">
                          <p class="text-lg font-bold text-slate-900">
                            {{ formatDays(line.days) }}
                          </p>
                          <p class="text-xs text-slate-400">day(s)</p>
                        </div>
                      </div>
                    }
                  </div>
                </section>
              }

              <!-- Supporting Document -->
              @if (request.documentUrl || request.isEmergency) {
                <section
                  class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                >
                  <div
                    class="flex items-center gap-3 border-b border-slate-100 px-5 py-4"
                  >
                    <div
                      class="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500"
                    >
                      <i class="pi pi-paperclip text-lg"></i>
                    </div>

                    <div>
                      <h2 class="font-semibold text-slate-900">
                        Supporting Document
                      </h2>
                      <p class="mt-0.5 text-xs text-slate-400">
                        Document attached to this application
                      </p>
                    </div>
                  </div>

                  <div class="p-5 sm:p-6">
                    <div
                      class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div class="flex min-w-0 items-center gap-3">
                        <div
                          class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50"
                        >
                          <i class="pi pi-file-pdf text-xl text-red-500"></i>
                        </div>

                        <div class="min-w-0">
                          @if (request.documentUrl) {
                            <a
                              [href]="resolveDocumentUrl(request.documentUrl)"
                              target="_blank"
                              rel="noopener noreferrer"
                              class="block break-all text-sm font-semibold text-blue-600 hover:underline"
                            >
                              {{
                                request.documentFileName ||
                                  'View uploaded document'
                              }}
                            </a>

                            <p class="mt-1 text-xs text-slate-400">
                              Open supporting document
                            </p>
                          } @else {
                            <p class="text-sm font-semibold text-slate-700">
                              No document uploaded
                            </p>
                            <p class="mt-1 text-xs text-slate-400">
                              Upload the required supporting document.
                            </p>
                          }
                        </div>
                      </div>

                      @if (request.isEmergency) {
                        <div class="w-full shrink-0 sm:w-auto">
                          <input
                            #documentFile
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                            class="hidden"
                            (change)="onFile($event)"
                          />

                          <p-button
                            [label]="
                              request.documentUrl
                                ? 'Replace Document'
                                : 'Upload Document'
                            "
                            [icon]="
                              request.documentUrl
                                ? 'pi pi-refresh'
                                : 'pi pi-upload'
                            "
                            severity="secondary"
                            [outlined]="true"
                            styleClass="w-full rounded-lg! sm:w-auto"
                            (onClick)="documentFile.click()"
                          />
                        </div>
                      }
                    </div>
                  </div>
                </section>
              }

              <!-- Rejection Reason -->
              @if (request.status === 'Rejected' && request.rejectionReason) {
                <section
                  class="overflow-hidden rounded-xl border border-red-200 bg-white shadow-sm"
                >
                  <div class="border-b border-red-100 bg-red-50 px-5 py-4">
                    <div class="flex items-center gap-2">
                      <i class="pi pi-exclamation-circle text-red-600"></i>
                      <h2 class="font-semibold text-red-800">
                        Leave Application Rejected
                      </h2>
                    </div>
                  </div>

                  <div class="p-5">
                    <p
                      class="text-xs font-bold uppercase tracking-wider text-red-500"
                    >
                      Rejection Reason
                    </p>

                    <p
                      class="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-red-800"
                    >
                      {{ request.rejectionReason }}
                    </p>

                    <div class="mt-5 border-t border-red-100 pt-4">
                      <p class="text-xs leading-relaxed text-slate-500">
                        This request cannot be reopened. You may submit a new
                        leave application if you still need time off.
                      </p>

                      <a routerLink="/leave/apply" class="mt-4 inline-block">
                        <p-button
                          label="Apply for New Leave"
                          icon="pi pi-plus"
                          size="small"
                          styleClass="rounded-lg!"
                        />
                      </a>
                    </div>
                  </div>
                </section>
              }
            </div>

            <!-- Right Sidebar: Approval Progress -->
            <div class="min-w-0 lg:sticky lg:top-5 lg:col-span-1">
              <section
                class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                <button
                  type="button"
                  class="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 text-left transition hover:bg-slate-50"
                  (click)="approvalProgressOpen = !approvalProgressOpen"
                  [attr.aria-expanded]="approvalProgressOpen"
                >
                  <div class="flex items-center gap-3">
                    <div
                      class="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"
                    >
                      <i class="pi pi-sitemap text-lg"></i>
                    </div>

                    <div>
                      <h2 class="font-semibold text-slate-900">
                        Approval Progress
                      </h2>
                      <p class="mt-0.5 text-xs text-slate-400">
                        Approval workflow
                      </p>
                    </div>
                  </div>

                  <i
                    class="pi text-sm text-slate-400"
                    [ngClass]="
                      approvalProgressOpen ? 'pi-chevron-up' : 'pi-chevron-down'
                    "
                  ></i>
                </button>

                @if (approvalProgressOpen) {
                  <div class="p-5">
                    @if (request.noApproverAssigned) {
                      <div
                        class="rounded-xl border border-amber-200 bg-amber-50 p-4"
                      >
                        <div
                          class="flex items-center gap-2 text-sm font-semibold text-amber-800"
                        >
                          <i class="pi pi-exclamation-triangle"></i>
                          No Approver Assigned
                        </div>

                        <p class="mt-2 text-xs leading-relaxed text-amber-700">
                          This leave application currently has no assigned
                          approver.
                        </p>
                      </div>
                    } @else if (!chainSteps.length) {
                      <div class="flex flex-col items-center py-8 text-center">
                        <div
                          class="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100"
                        >
                          <i
                            class="pi pi-info-circle text-xl text-slate-400"
                          ></i>
                        </div>

                        <p class="mt-3 text-sm font-semibold text-slate-600">
                          No approval steps available
                        </p>

                        <p class="mt-1 text-xs text-slate-400">
                          Approval information is not available yet.
                        </p>
                      </div>
                    } @else {
                      <ol class="relative m-0 list-none p-0">
                        @for (
                          step of chainSteps;
                          track step.stepOrder;
                          let last = $last
                        ) {
                          <li class="relative flex gap-3 pb-7 last:pb-0">
                            @if (!last) {
                              <span
                                class="absolute bottom-0 left-[15px] top-8 w-px bg-slate-200"
                                aria-hidden="true"
                              ></span>
                            }

                            <!-- Step Icon -->
                            <span
                              class="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold"
                              [ngClass]="stepDotClass(step.status)"
                            >
                              @if (
                                step.status === 'Approved' ||
                                step.status === 'Completed'
                              ) {
                                <i class="pi pi-check"></i>
                              } @else if (step.status === 'Rejected') {
                                <i class="pi pi-times"></i>
                              } @else {
                                {{ step.stepOrder }}
                              }
                            </span>

                            <!-- Step Information -->
                            <div class="min-w-0 flex-1 pt-1">
                              <div class="flex flex-col gap-2">
                                <p
                                  class="break-words text-sm font-semibold text-slate-800"
                                >
                                  {{ step.approverName || 'Approver' }}
                                </p>

                                <span
                                  class="w-fit rounded-full px-2.5 py-1 text-[10px] font-bold"
                                  [ngClass]="stepBadgeClass(step.status)"
                                >
                                  {{ step.status }}
                                </span>
                              </div>

                              @if (step.decidedAt) {
                                <p class="mt-2 text-xs text-slate-400">
                                  <i class="pi pi-clock mr-1"></i>
                                  {{
                                    step.decidedAt | date: 'dd MMM yyyy, HH:mm'
                                  }}
                                </p>
                              }

                              @if (
                                step.status === 'Rejected' &&
                                step.rejectionReason
                              ) {
                                <div
                                  class="mt-3 rounded-lg border border-red-100 bg-red-50 p-3"
                                >
                                  <p
                                    class="text-[10px] font-bold uppercase tracking-wider text-red-500"
                                  >
                                    Rejection Reason
                                  </p>

                                  <p
                                    class="mt-1 whitespace-pre-wrap break-words text-xs leading-relaxed text-red-700"
                                  >
                                    {{ step.rejectionReason }}
                                  </p>
                                </div>
                              }
                            </div>
                          </li>
                        }
                      </ol>
                    }
                  </div>
                }
              </section>

              <!-- Application Status Information -->
              <div
                class="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4"
              >
                <div class="flex items-start gap-2">
                  <i class="pi pi-info-circle mt-0.5 text-blue-600"></i>

                  <div>
                    <p class="text-sm font-semibold text-blue-900">
                      Application Information
                    </p>

                    <p class="mt-1 text-xs leading-relaxed text-blue-700">
                      You can track each approval step here. The status will
                      update when an approver takes action.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div
            class="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <p class="text-xs text-slate-400">Leave application details</p>

            <p-button
              label="Back to Leave Overview"
              icon="pi pi-arrow-left"
              severity="secondary"
              [outlined]="true"
              routerLink="/leave"
              styleClass="w-full rounded-lg! sm:w-auto"
            />
          </div>
        } @else {
          <div
            class="flex min-h-[60vh] flex-col items-center justify-center gap-3"
          >
            <div
              class="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50"
            >
              <i class="pi pi-calendar text-2xl text-blue-500"></i>
            </div>

            <p class="text-sm font-semibold text-slate-600">
              Loading leave details...
            </p>

            <p class="text-xs text-slate-400">
              Please wait while we retrieve your application.
            </p>
          </div>
        }
      </div>
    </div>
  `,
})
export class LeaveDetail implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly leaveService = inject(LeaveRequestService);
  private readonly userService = inject(UserService);
  private readonly messageService = inject(MessageService);
  private readonly loadingService = inject(LoadingService);
  private readonly cdr = inject(ChangeDetectorRef);

  request: LeaveRequestDto | null = null;
  approvalProgressOpen = true;
  private routeRequestId = '';

  get canCancel(): boolean {
    return (
      !!this.request &&
      ['Approved', 'Pending'].includes(this.request.status) &&
      new Date(this.request.startDate) > new Date()
    );
  }

  get chainSteps(): LeaveApprovalChainStepDto[] {
    return this.request?.approvalChain ?? [];
  }

  formatLeaveDays(row: LeaveRequestDto): string {
    return formatLeaveDurationLabel(row);
  }

  formatDays(value: number | null | undefined): string {
    return formatDaysAmount(value);
  }

  hasBalanceSplit(row: LeaveRequestDto | null | undefined): boolean {
    const n = row?.balanceAllocations?.length ?? 0;
    if (row?.isEmergency && n > 0) return true;
    return n > 1;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.routeRequestId = id;
    this.loadingService.start();
    this.leaveService
      .getById(id)
      .pipe(finalize(() => this.loadingService.stop()))
      .subscribe({
        next: (r) => {
          this.request = r;
          this.cdr.markForCheck();
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Leave request not found',
          });
          this.cdr.markForCheck();
        },
      });
  }

  ngOnDestroy(): void {
    this.loadingService.stop();
  }

  stepBadgeClass(status: string): Record<string, boolean> {
    const s = (status || '').toLowerCase();
    return {
      'bg-green-100 text-green-800': s === 'approved' || s === 'completed',
      'bg-red-100 text-red-800': s === 'rejected',
      'bg-blue-100 text-blue-800': s === 'pending',
      'bg-gray-100 text-gray-600': s === 'waiting' || !s,
    };
  }

  stepDotClass(status: string): Record<string, boolean> {
    const s = (status || '').toLowerCase();
    return {
      'border-green-500 bg-green-50 text-green-700':
        s === 'approved' || s === 'completed',
      'border-red-500 bg-red-50 text-red-700': s === 'rejected',
      'border-blue-500 bg-blue-50 text-blue-700': s === 'pending',
      'border-gray-300 bg-white text-gray-500': s === 'waiting' || !s,
    };
  }

  cancel(): void {
    const userId = this.userService.currentUser?.userId;
    const requestId = this.resolveRequestId();
    if (!this.request || !userId || !requestId) return;
    this.loadingService.start();
    this.leaveService
      .cancel(requestId, { requestedBy: userId })
      .pipe(finalize(() => this.loadingService.stop()))
      .subscribe({
        next: (r) => {
          this.request = r;
          this.messageService.add({
            severity: 'success',
            summary: 'Cancelled',
            detail: 'Leave request updated',
          });
          this.cdr.markForCheck();
        },
        error: (e) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: e.error?.message || 'Cancel failed',
          });
          this.cdr.markForCheck();
        },
      });
  }

  private resolveRequestId(): string {
    return this.request?.requestId || this.routeRequestId;
  }

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const requestId = this.resolveRequestId();
    if (!file || !this.request || !requestId) return;

    const allowed = /\.(pdf|jpe?g|png)$/i.test(file.name);
    if (!allowed) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Unsupported file',
        detail: 'Please upload a PDF, JPG, or PNG file.',
      });
      input.value = '';
      return;
    }

    this.loadingService.start();
    this.leaveService
      .uploadDocument(requestId, file)
      .pipe(finalize(() => this.loadingService.stop()))
      .subscribe({
        next: (res) => {
          this.request!.documentUrl = res.fileUrl;
          this.request!.documentFileName = file.name;
          this.messageService.add({
            severity: 'success',
            summary: 'Uploaded',
            detail: `${file.name} saved successfully`,
          });
          input.value = '';
          this.cdr.markForCheck();
        },
        error: () => {
          input.value = '';
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Upload failed',
          });
          this.cdr.markForCheck();
        },
      });
  }

  resolveDocumentUrl(path: string): string {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    const base = environment.ApiBaseUrl.replace(/\/api\/?$/, '');
    const cleaned = path.startsWith('/') ? path.slice(1) : path;
    return `${base}/${cleaned}`;
  }

  statusSeverity(
    status: string,
  ): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    switch (status) {
      case 'Approved':
        return 'success';

      case 'Rejected':
        return 'danger';

      case 'Pending':
        return 'warn';

      default:
        return 'secondary';
    }
  }
}
