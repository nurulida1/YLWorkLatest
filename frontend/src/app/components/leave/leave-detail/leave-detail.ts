import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { finalize } from 'rxjs/operators';
import { LeaveApprovalChainStepDto, LeaveRequestDto } from '../../../models/Leave';
import { formatDaysAmount, formatLeaveDurationLabel } from '../../../common/leave-day.util';
import { LeaveRequestService } from '../../../services/leave-request.service';
import { LoadingService } from '../../../services/loading.service';
import { UserService } from '../../../services/userService.service';
import { environment } from '../../../../environments/environment.development';

@Component({
  selector: 'app-leave-detail',
  imports: [CommonModule, RouterLink, TagModule, ButtonModule],
  template: `
    <div class="w-full flex flex-col p-4 sm:p-5 gap-4">
      <a routerLink="/leave" class="text-sm text-blue-600 hover:underline w-fit">← Back to leave overview</a>

      @if (request) {
        <div class="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 max-w-2xl w-full">
          <div class="flex items-start justify-between gap-4 mb-4">
            <div class="min-w-0">
              <h1 class="text-xl font-semibold text-gray-800 break-words">{{ request.leaveTypeName }}</h1>
              <p class="text-gray-500 text-sm">{{ request.employeeName }}</p>
              <div class="flex flex-wrap gap-1.5 mt-2">
                @if (request.isShortNoticeAnnual) {
                  <p-tag value="Short notice → Unpaid" severity="warn" />
                } @else if (hasBalanceSplit(request)) {
                  <p-tag value="Balance split" severity="warn" />
                } @else if (request.isUnpaid) {
                  <p-tag value="Unpaid" severity="secondary" />
                }
                @if (request.isEmergency) {
                  <p-tag value="Emergency" severity="danger" />
                }
              </div>
            </div>
            <p-tag [value]="request.status" />
          </div>

          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-6">
            <div><dt class="text-gray-500">Dates</dt><dd>{{ request.startDate | date:'mediumDate' }} – {{ request.endDate | date:'mediumDate' }}</dd></div>
            <div><dt class="text-gray-500">Total days</dt><dd>{{ formatLeaveDays(request) }}</dd></div>
            @if (hasBalanceSplit(request)) {
              <div class="sm:col-span-2">
                <dt class="text-gray-500 mb-1">Balance breakdown</dt>
                <dd>
                  <ul class="m-0 pl-5 list-disc text-gray-800">
                    @for (line of request.balanceAllocations!; track line.leaveTypeId + line.sortOrder) {
                      <li>
                        {{ line.leaveTypeName }}: {{ formatDays(line.days) }} day(s)
                        @if (line.isUnpaidBucket) { (unpaid) }
                      </li>
                    }
                  </ul>
                </dd>
              </div>
            }
            <div class="sm:col-span-2"><dt class="text-gray-500">Reason</dt><dd class="break-words">{{ request.reason }}</dd></div>
            <div><dt class="text-gray-500">Submitted</dt><dd>{{ request.submittedAt | date:'medium' }}</dd></div>
          </dl>

          @if (request.status === 'Rejected' && request.rejectionReason) {
            <div class="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-900 mb-4">
              <div class="font-semibold text-red-800 mb-1">Rejection reason</div>
              <p class="whitespace-pre-wrap">{{ request.rejectionReason }}</p>
            </div>
            <p class="text-sm text-gray-600 mb-4">
              This request cannot be reopened. Submit a new leave application if you still need time off.
            </p>
            <a routerLink="/leave/apply" class="inline-block mb-6">
              <p-button label="Apply for new leave" />
            </a>
          }

          @if (request.documentUrl || request.isEmergency) {
            <div class="rounded-md bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-800 mb-6">
              <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div class="min-w-0 flex-1">
                  <div class="font-semibold text-slate-700 mb-1">Supporting document</div>
                  @if (request.documentUrl) {
                    <a
                      [href]="resolveDocumentUrl(request.documentUrl)"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="inline-flex items-center gap-2 text-blue-600 hover:underline break-all"
                    >
                      <i class="pi pi-file text-amber-600" aria-hidden="true"></i>
                      {{ request.documentFileName || 'View uploaded document' }}
                    </a>
                    <p class="text-xs text-gray-500 mt-1.5 m-0">
                      Open the file in a new tab. You can replace it below if needed.
                    </p>
                  } @else {
                    <p class="text-xs text-gray-500 m-0">
                      Emergency leave should include a supporting document (PDF or image).
                    </p>
                  }
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
                      [label]="request.documentUrl ? 'Replace document' : 'Choose file'"
                      [icon]="request.documentUrl ? 'pi pi-refresh' : 'pi pi-upload'"
                      severity="secondary"
                      [outlined]="true"
                      size="small"
                      (onClick)="documentFile.click()"
                    />
                  </div>
                }
              </div>
            </div>
          }

          <section class="border border-gray-200 rounded-lg mb-6 overflow-hidden">
            <button
              type="button"
              class="w-full flex items-center justify-between gap-3 px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors"
              (click)="approvalProgressOpen = !approvalProgressOpen"
              [attr.aria-expanded]="approvalProgressOpen"
            >
              <span class="font-semibold text-gray-800 text-sm sm:text-base">Approval progress</span>
              <span class="text-gray-500 text-lg leading-none select-none" aria-hidden="true">
                {{ approvalProgressOpen ? '▾' : '▸' }}
              </span>
            </button>

            @if (approvalProgressOpen) {
              <div class="px-4 py-4 border-t border-gray-200">
                @if (request.noApproverAssigned) {
                  <p class="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                    No approver assigned
                  </p>
                } @else if (!chainSteps.length) {
                  <p class="text-sm text-gray-500">No approval steps available.</p>
                } @else {
                  <ol class="relative m-0 p-0 list-none">
                    @for (step of chainSteps; track step.stepOrder; let last = $last) {
                      <li class="relative flex gap-3 pb-5 last:pb-0">
                        @if (!last) {
                          <span
                            class="absolute left-[11px] top-6 bottom-0 w-px bg-gray-200"
                            aria-hidden="true"
                          ></span>
                        }
                        <span
                          class="relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-semibold"
                          [ngClass]="stepDotClass(step.status)"
                          aria-hidden="true"
                        >
                          {{ step.stepOrder }}
                        </span>
                        <div class="min-w-0 flex-1 pt-0.5">
                          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-3">
                            <div class="min-w-0">
                              <div class="text-sm font-medium text-gray-900 break-words">
                                {{ step.approverName || 'Approver' }}
                              </div>
                              @if (step.decidedAt) {
                                <div class="text-xs text-gray-500 mt-0.5">
                                  {{ step.decidedAt | date:'medium' }}
                                </div>
                              }
                            </div>
                            <span
                              class="inline-flex w-fit shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                              [ngClass]="stepBadgeClass(step.status)"
                            >
                              {{ step.status }}
                            </span>
                          </div>
                          @if (step.status === 'Rejected' && step.rejectionReason) {
                            <p class="mt-2 text-xs text-red-700 whitespace-pre-wrap break-words">
                              {{ step.rejectionReason }}
                            </p>
                          }
                        </div>
                      </li>
                    }
                  </ol>
                }
              </div>
            }
          </section>

          <div class="flex flex-wrap gap-2">
            @if (canCancel) {
              <p-button label="Cancel leave" severity="danger" [outlined]="true" (onClick)="cancel()" />
            }
          </div>
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
    return !!this.request && ['Approved', 'Pending'].includes(this.request.status) && new Date(this.request.startDate) > new Date();
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
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Leave request not found' });
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
      'bg-gray-100 text-gray-600': s === 'waiting' || (!s),
    };
  }

  stepDotClass(status: string): Record<string, boolean> {
    const s = (status || '').toLowerCase();
    return {
      'border-green-500 bg-green-50 text-green-700': s === 'approved' || s === 'completed',
      'border-red-500 bg-red-50 text-red-700': s === 'rejected',
      'border-blue-500 bg-blue-50 text-blue-700': s === 'pending',
      'border-gray-300 bg-white text-gray-500': s === 'waiting' || (!s),
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
          this.messageService.add({ severity: 'success', summary: 'Cancelled', detail: 'Leave request updated' });
          this.cdr.markForCheck();
        },
        error: (e) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: e.error?.message || 'Cancel failed' });
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
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Upload failed' });
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
