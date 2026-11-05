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
import { environment } from '../../../../environments/environment.development';

@Component({
  selector: 'app-leave-detail',
  imports: [CommonModule, RouterLink, TagModule, ButtonModule],
  template: `
    <div class="min-h-screen w-full bg-slate-50 p-4 sm:p-6 lg:p-8">
      @if (request) {
        <div class="flex flex-col gap-6">
          <!-- Breadcrumb -->
          <div class="flex items-center gap-2 text-sm">
            <a
              routerLink="/leave"
              class="font-medium text-slate-500 transition hover:text-blue-600"
            >
              Leave
            </a>
            <i class="pi pi-chevron-right text-[10px] text-slate-400"></i>
            <span class="font-semibold text-slate-800">Leave Details</span>
          </div>

          <!-- Header -->
          <div
            class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div class="min-w-0">
              <div class="mb-2 flex flex-wrap items-center gap-3">
                <h1
                  class="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
                >
                  {{ request.leaveTypeName }}
                </h1>
                <p-tag [value]="request.status" />
              </div>

              <p class="text-sm text-slate-500">
                Leave application by
                <span class="font-semibold text-slate-700">{{
                  request.employeeName
                }}</span>
              </p>

              <div class="mt-3 flex flex-wrap gap-2">
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
              <p-button
                label="Cancel Leave"
                icon="pi pi-times"
                severity="danger"
                [outlined]="true"
                size="small"
                (onClick)="cancel()"
              />
            }
          </div>

          <!-- Summary Cards -->
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div
              class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div
                class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50"
              >
                <i class="pi pi-calendar text-lg text-blue-600"></i>
              </div>
              <p class="text-sm text-slate-500">Leave Duration</p>
              <h2 class="mt-1 text-2xl font-bold text-slate-900">
                {{ formatLeaveDays(request) }}
              </h2>
            </div>

            <div
              class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div
                class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50"
              >
                <i class="pi pi-clock text-lg text-purple-600"></i>
              </div>
              <p class="text-sm text-slate-500">Start Date</p>
              <h2 class="mt-1 text-lg font-bold text-slate-900">
                {{ request.startDate | date: 'dd MMM yyyy' }}
              </h2>
            </div>

            <div
              class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div
                class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50"
              >
                <i class="pi pi-calendar-plus text-lg text-emerald-600"></i>
              </div>
              <p class="text-sm text-slate-500">End Date</p>
              <h2 class="mt-1 text-lg font-bold text-slate-900">
                {{ request.endDate | date: 'dd MMM yyyy' }}
              </h2>
            </div>

            <div
              class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div
                class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50"
              >
                <i class="pi pi-send text-lg text-amber-600"></i>
              </div>
              <p class="text-sm text-slate-500">Submitted On</p>
              <h2 class="mt-1 text-lg font-bold text-slate-900">
                {{ request.submittedAt | date: 'dd MMM yyyy' }}
              </h2>
            </div>
          </div>

          <!-- Main Content -->
          <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div class="flex flex-col gap-6 lg:col-span-2">
              <!-- Leave Information -->
              <section
                class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                <div class="border-b border-slate-100 px-5 py-4">
                  <h2 class="font-semibold text-slate-900">
                    Leave Information
                  </h2>
                  <p class="mt-1 text-xs text-slate-500">
                    Details of this leave application
                  </p>
                </div>

                <div class="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
                  <div>
                    <p
                      class="text-xs font-medium uppercase tracking-wide text-slate-400"
                    >
                      Leave Type
                    </p>
                    <p class="mt-1 font-semibold text-slate-800">
                      {{ request.leaveTypeName }}
                    </p>
                  </div>

                  <div>
                    <p
                      class="text-xs font-medium uppercase tracking-wide text-slate-400"
                    >
                      Employee
                    </p>
                    <p class="mt-1 font-semibold text-slate-800">
                      {{ request.employeeName }}
                    </p>
                  </div>

                  <div>
                    <p
                      class="text-xs font-medium uppercase tracking-wide text-slate-400"
                    >
                      Start Date
                    </p>
                    <p class="mt-1 font-semibold text-slate-800">
                      {{ request.startDate | date: 'EEEE, dd MMMM yyyy' }}
                    </p>
                  </div>

                  <div>
                    <p
                      class="text-xs font-medium uppercase tracking-wide text-slate-400"
                    >
                      End Date
                    </p>
                    <p class="mt-1 font-semibold text-slate-800">
                      {{ request.endDate | date: 'EEEE, dd MMMM yyyy' }}
                    </p>
                  </div>

                  <div>
                    <p
                      class="text-xs font-medium uppercase tracking-wide text-slate-400"
                    >
                      Total Leave
                    </p>
                    <p class="mt-1 font-semibold text-slate-800">
                      {{ formatLeaveDays(request) }}
                    </p>
                  </div>

                  <div>
                    <p
                      class="text-xs font-medium uppercase tracking-wide text-slate-400"
                    >
                      Submitted Date
                    </p>
                    <p class="mt-1 font-semibold text-slate-800">
                      {{ request.submittedAt | date: 'dd MMM yyyy, HH:mm' }}
                    </p>
                  </div>

                  <div class="sm:col-span-2">
                    <div class="border-t border-slate-100 pt-5">
                      <p
                        class="text-xs font-medium uppercase tracking-wide text-slate-400"
                      >
                        Reason for Leave
                      </p>
                      <p
                        class="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700"
                      >
                        {{ request.reason || 'No reason provided.' }}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <!-- Balance Breakdown -->
              @if (hasBalanceSplit(request)) {
                <section
                  class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                >
                  <div class="border-b border-slate-100 px-5 py-4">
                    <div class="flex items-center gap-2">
                      <div
                        class="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50"
                      >
                        <i class="pi pi-wallet text-amber-600"></i>
                      </div>
                      <div>
                        <h2 class="font-semibold text-slate-900">
                          Leave Balance Breakdown
                        </h2>
                        <p class="mt-1 text-xs text-slate-500">
                          Allocation of leave days across leave balances
                        </p>
                      </div>
                    </div>
                  </div>

                  <div class="divide-y divide-slate-100">
                    @for (
                      line of request.balanceAllocations!;
                      track line.leaveTypeId + line.sortOrder
                    ) {
                      <div
                        class="flex items-center justify-between gap-3 px-5 py-4"
                      >
                        <div class="min-w-0">
                          <p class="font-semibold text-slate-800">
                            {{ line.leaveTypeName }}
                          </p>
                          @if (line.isUnpaidBucket) {
                            <span
                              class="mt-1 inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
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
                  <div class="border-b border-slate-100 px-5 py-4">
                    <h2 class="font-semibold text-slate-900">
                      Supporting Document
                    </h2>
                    <p class="mt-1 text-xs text-slate-500">
                      Uploaded document for this leave application
                    </p>
                  </div>

                  <div class="p-5">
                    <div
                      class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div class="flex min-w-0 items-center gap-3">
                        <div
                          class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50"
                        >
                          <i class="pi pi-file text-xl text-red-500"></i>
                        </div>

                        <div class="min-w-0">
                          @if (request.documentUrl) {
                            <a
                              [href]="resolveDocumentUrl(request.documentUrl)"
                              target="_blank"
                              rel="noopener noreferrer"
                              class="block truncate text-sm font-semibold text-blue-600 hover:underline"
                            >
                              {{
                                request.documentFileName ||
                                  'View uploaded document'
                              }}
                            </a>
                            <p class="mt-1 text-xs text-slate-500">
                              Click to open the supporting document
                            </p>
                          } @else {
                            <p class="text-sm font-semibold text-slate-800">
                              No document uploaded
                            </p>
                            <p class="mt-1 text-xs text-slate-500">
                              Emergency leave requires supporting documentation.
                            </p>
                          }
                        </div>
                      </div>

                      @if (request.isEmergency) {
                        <div class="shrink-0">
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
                            size="small"
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
                <section class="rounded-xl border border-red-200 bg-red-50 p-5">
                  <div class="flex items-center gap-2">
                    <i class="pi pi-exclamation-circle text-red-600"></i>
                    <h2 class="font-semibold text-red-800">
                      Leave Application Rejected
                    </h2>
                  </div>

                  <p class="mt-3 text-sm font-medium text-red-800">
                    Rejection Reason
                  </p>
                  <p
                    class="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-red-700"
                  >
                    {{ request.rejectionReason }}
                  </p>

                  <div class="mt-4 border-t border-red-200 pt-3">
                    <p class="text-xs text-red-700">
                      This request cannot be reopened. Submit a new leave
                      application if you still need time off.
                    </p>

                    <a routerLink="/leave/apply" class="mt-3 inline-block">
                      <p-button
                        label="Apply for New Leave"
                        icon="pi pi-plus"
                        size="small"
                      />
                    </a>
                  </div>
                </section>
              }
            </div>

            <!-- Approval Progress -->
            <div class="lg:col-span-1">
              <section
                class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                <button
                  type="button"
                  class="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 text-left transition hover:bg-slate-50"
                  (click)="approvalProgressOpen = !approvalProgressOpen"
                  [attr.aria-expanded]="approvalProgressOpen"
                >
                  <div>
                    <h2 class="font-semibold text-slate-900">
                      Approval Progress
                    </h2>
                    <p class="mt-1 text-xs text-slate-500">
                      Track your leave approval steps
                    </p>
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
                        class="rounded-lg border border-amber-200 bg-amber-50 p-4"
                      >
                        <div
                          class="flex items-center gap-2 text-sm font-semibold text-amber-800"
                        >
                          <i class="pi pi-exclamation-triangle"></i>
                          No Approver Assigned
                        </div>
                        <p class="mt-1 text-xs text-amber-700">
                          This leave application currently has no assigned
                          approver.
                        </p>
                      </div>
                    } @else if (!chainSteps.length) {
                      <div class="py-8 text-center">
                        <div
                          class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100"
                        >
                          <i
                            class="pi pi-info-circle text-xl text-slate-400"
                          ></i>
                        </div>
                        <p class="mt-3 text-sm font-medium text-slate-600">
                          No approval steps available.
                        </p>
                      </div>
                    } @else {
                      <ol class="relative m-0 list-none p-0">
                        @for (
                          step of chainSteps;
                          track step.stepOrder;
                          let last = $last
                        ) {
                          <li class="relative flex gap-3 pb-6 last:pb-0">
                            @if (!last) {
                              <span
                                class="absolute left-[15px] top-8 bottom-0 w-px bg-slate-200"
                                aria-hidden="true"
                              ></span>
                            }

                            <span
                              class="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold"
                              [ngClass]="stepDotClass(step.status)"
                              aria-hidden="true"
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

                            <div class="min-w-0 flex-1 pt-1">
                              <div
                                class="flex flex-wrap items-start justify-between gap-2"
                              >
                                <p
                                  class="break-words text-sm font-semibold text-slate-800"
                                >
                                  {{ step.approverName || 'Approver' }}
                                </p>

                                <span
                                  class="inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold"
                                  [ngClass]="stepBadgeClass(step.status)"
                                >
                                  {{ step.status }}
                                </span>
                              </div>

                              @if (step.decidedAt) {
                                <p class="mt-1 text-xs text-slate-400">
                                  {{
                                    step.decidedAt | date: 'dd MMM yyyy, HH:mm'
                                  }}
                                </p>
                              }

                              @if (
                                step.status === 'Rejected' &&
                                step.rejectionReason
                              ) {
                                <div class="mt-2 rounded-md bg-red-50 p-2.5">
                                  <p
                                    class="whitespace-pre-wrap break-words text-xs leading-relaxed text-red-700"
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
            </div>
          </div>

          <!-- Footer -->
          <div class="flex justify-start">
            <p-button
              label="Back to Leave Overview"
              icon="pi pi-arrow-left"
              severity="secondary"
              [outlined]="true"
              size="small"
              routerLink="/leave"
            />
          </div>
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
          <p class="text-sm font-medium text-slate-500">
            Loading leave details...
          </p>
        </div>
      }
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
}
