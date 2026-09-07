import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { finalize } from 'rxjs';
import { environment } from '../../../../environments/environment.development';
import { CLAIM_TYPE_LABELS, ClaimApprovalChainStepDto, ClaimRequestDto } from '../../../models/Claim';
import { ClaimRequestService } from '../../../services/claim-request.service';
import { LoadingService } from '../../../services/loading.service';
import { UserService } from '../../../services/userService.service';

@Component({
  selector: 'app-claim-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, ButtonModule, TagModule],
  template: `
    <div class="w-full min-h-screen bg-[#f4f6f8] p-6 flex flex-col gap-5" *ngIf="req">
      <div class="flex items-center gap-1.5 text-sm text-gray-500">
        <a routerLink="/claims" class="hover:text-blue-600">Claims</a>
        <span>/</span>
        <span class="text-gray-700 font-semibold">Detail</span>
      </div>

      <div class="bg-white rounded-lg shadow-sm p-5 flex flex-col gap-4">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="text-2xl font-bold m-0">{{ label(req.claimType) }}</h1>
              <p-tag [value]="req.status" [severity]="severity(req.status)" />
            </div>
            <p class="text-sm text-gray-500 mt-1 m-0">
              {{ req.employeeName }} · submitted
              {{ req.submittedAt | date: 'dd MMM yyyy HH:mm' }}
            </p>
          </div>
          <div class="flex flex-wrap gap-2 items-center">
            @if (req.status === 'Pending' && isOwner) {
              <p-button
                label="Edit"
                size="small"
                [outlined]="true"
                [routerLink]="['/claims/apply', req.requestId]"
              />
              <p-button
                label="Withdraw"
                size="small"
                severity="danger"
                [outlined]="true"
                (onClick)="withdraw()"
              />
            }
            @if (canApprove) {
              <p-button label="Approve" size="small" (onClick)="approve()" />
              <p-button
                label="Reject"
                size="small"
                severity="danger"
                [outlined]="true"
                (onClick)="reject()"
              />
            }
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <div class="text-gray-500">Total</div>
            <div class="font-semibold">RM {{ req.totalAmount | number: '1.2-2' }}</div>
          </div>
          @if (req.destination) {
            <div>
              <div class="text-gray-500">Destination</div>
              <div class="font-semibold">{{ req.destination }}</div>
            </div>
          }
          @if (req.tripStartDate) {
            <div>
              <div class="text-gray-500">Trip</div>
              <div class="font-semibold">
                {{ req.tripStartDate | date: 'dd MMM' }} –
                {{ req.tripEndDate | date: 'dd MMM yyyy' }}
              </div>
            </div>
          }
          @if (req.rejectionReason) {
            <div class="col-span-2">
              <div class="text-gray-500">Rejection reason</div>
              <div class="font-semibold text-red-600">{{ req.rejectionReason }}</div>
            </div>
          }
        </div>

        @if (req.remarks) {
          <div class="text-sm">
            <div class="text-gray-500">Remarks</div>
            <div>{{ req.remarks }}</div>
          </div>
        }

        <div>
          <h2 class="text-lg font-semibold mb-2">Line items</h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-gray-500 border-b">
                  <th class="py-2">Kind</th>
                  <th>Details</th>
                  <th class="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                @for (line of req.lineItems; track line.id) {
                  <tr class="border-b">
                    <td class="py-2">{{ line.lineKind }}</td>
                    <td>
                      {{ line.description }}
                      @if (line.category) {
                        <span class="text-gray-500"> · {{ line.category }}</span>
                      }
                      @if (line.hours) {
                        <span class="text-gray-500">
                          · {{ line.dayType }} · {{ line.hours }}h</span
                        >
                      }
                      @if (line.kilometers) {
                        <span class="text-gray-500">
                          · {{ line.vehicleType }} · {{ line.kilometers }} km</span
                        >
                      }
                      @if (line.mealDays) {
                        <span class="text-gray-500"> · {{ line.mealDays }} day(s)</span>
                      }
                    </td>
                    <td class="text-right">RM {{ line.amount | number: '1.2-2' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        @if (req.documents.length) {
          <div>
            <h2 class="text-lg font-semibold mb-2">Documents</h2>
            <ul class="text-sm list-disc pl-5">
              @for (doc of req.documents; track doc.id) {
                <li>
                  <a class="text-blue-600" [href]="fileUrl(doc.fileUrl)" target="_blank"
                    >{{ doc.documentKind }}: {{ doc.fileName }}</a
                  >
                </li>
              }
            </ul>
          </div>
        }

        <section class="border border-gray-200 rounded-lg overflow-hidden">
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
              @if (req.noApproverAssigned) {
                <p class="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                  No approver assigned
                </p>
              } @else if (!chainSteps.length) {
                <p class="text-sm text-gray-500">
                  @if (req.status === 'Approved') {
                    No approvers assigned (auto-approved path).
                  } @else {
                    No approval steps available.
                  }
                </p>
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
                                {{ step.decidedAt | date: 'medium' }}
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
      </div>
    </div>
  `,
})
export class ClaimDetail implements OnInit {
  private readonly api = inject(ClaimRequestService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly users = inject(UserService);
  private readonly messages = inject(MessageService);
  private readonly loading = inject(LoadingService);
  private readonly cdr = inject(ChangeDetectorRef);

  req: ClaimRequestDto | null = null;
  approvalProgressOpen = true;

  get chainSteps(): ClaimApprovalChainStepDto[] {
    return this.req?.approvalChain ?? [];
  }

  get isOwner(): boolean {
    return !!this.req && this.req.employeeId === this.users.currentUser?.userId;
  }

  get canApprove(): boolean {
    const uid = this.users.currentUser?.userId;
    return (
      !!this.req &&
      this.req.status === 'Pending' &&
      !!uid &&
      this.req.currentApproverIds.includes(uid)
    );
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.loading.start();
    this.api
      .getById(id)
      .pipe(finalize(() => this.loading.stop()))
      .subscribe({
        next: (r) => {
          this.req = r;
          this.cdr.markForCheck();
        },
        error: () => void this.router.navigate(['/claims']),
      });
  }

  label(type: string): string {
    return CLAIM_TYPE_LABELS[type] ?? type;
  }

  severity(
    status: string,
  ): 'success' | 'warn' | 'danger' | 'secondary' | undefined {
    switch (status) {
      case 'Approved':
        return 'success';
      case 'Pending':
        return 'warn';
      case 'Rejected':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  fileUrl(path: string): string {
    if (!path) return '#';
    if (path.startsWith('http')) return path;
    const base = environment.ApiBaseUrl.replace(/\/api\/?$/, '');
    return `${base}/${path.replace(/^\/+/, '')}`;
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
      'border-green-500 bg-green-50 text-green-700': s === 'approved' || s === 'completed',
      'border-red-500 bg-red-50 text-red-700': s === 'rejected',
      'border-blue-500 bg-blue-50 text-blue-700': s === 'pending',
      'border-gray-300 bg-white text-gray-500': s === 'waiting' || !s,
    };
  }

  withdraw(): void {
    if (!this.req) return;
    const userId = this.users.currentUser?.userId;
    if (!userId) return;
    this.loading.start();
    this.api
      .cancel(this.req.requestId, { requestedBy: userId })
      .pipe(finalize(() => this.loading.stop()))
      .subscribe({
        next: (r) => {
          this.req = r;
          this.messages.add({
            severity: 'success',
            summary: 'Withdrawn',
            detail: 'Claim withdrawn.',
          });
          this.cdr.markForCheck();
        },
        error: (err) =>
          this.messages.add({
            severity: 'error',
            summary: 'Failed',
            detail: err?.error?.message ?? 'Withdraw failed.',
          }),
      });
  }

  approve(): void {
    if (!this.req) return;
    const userId = this.users.currentUser?.userId;
    if (!userId) return;
    this.loading.start();
    this.api
      .approve(this.req.requestId, { approverId: userId })
      .pipe(finalize(() => this.loading.stop()))
      .subscribe({
        next: (r) => {
          this.req = r;
          this.messages.add({ severity: 'success', summary: 'Approved' });
          this.cdr.markForCheck();
        },
        error: (err) =>
          this.messages.add({
            severity: 'error',
            summary: 'Failed',
            detail: err?.error?.message ?? 'Approve failed.',
          }),
      });
  }

  reject(): void {
    if (!this.req) return;
    const userId = this.users.currentUser?.userId;
    if (!userId) return;
    const reason = prompt('Rejection reason:');
    if (!reason?.trim()) return;
    this.loading.start();
    this.api
      .reject(this.req.requestId, {
        approverId: userId,
        rejectionReason: reason.trim(),
      })
      .pipe(finalize(() => this.loading.stop()))
      .subscribe({
        next: (r) => {
          this.req = r;
          this.messages.add({ severity: 'success', summary: 'Rejected' });
          this.cdr.markForCheck();
        },
        error: (err) =>
          this.messages.add({
            severity: 'error',
            summary: 'Failed',
            detail: err?.error?.message ?? 'Reject failed.',
          }),
      });
  }
}
