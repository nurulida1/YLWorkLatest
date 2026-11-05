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
import {
  CLAIM_TYPE_LABELS,
  ClaimApprovalChainStepDto,
  ClaimRequestDto,
} from '../../../models/Claim';
import { ClaimRequestService } from '../../../services/claim-request.service';
import { LoadingService } from '../../../services/loading.service';
import { UserService } from '../../../services/userService.service';

@Component({
  selector: 'app-claim-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, ButtonModule, TagModule],
  template: `
    <div class="min-h-screen w-full bg-slate-50 p-4 sm:p-6 lg:p-8">
      @if (req) {
        <div class="flex flex-col gap-6">
          <!-- Breadcrumb -->
          <div class="flex items-center gap-2 text-sm">
            <a
              routerLink="/claims"
              class="font-medium text-slate-500 transition hover:text-blue-600"
            >
              Claims
            </a>
            <i class="pi pi-chevron-right text-[10px] text-slate-400"></i>
            <span class="font-semibold text-slate-800">Claim Details</span>
          </div>

          <!-- Header -->
          <div
            class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <div class="mb-2 flex flex-wrap items-center gap-3">
                <h1
                  class="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
                >
                  {{ label(req.claimType) }}
                </h1>
                <p-tag [value]="req.status" [severity]="severity(req.status)" />
              </div>
              <p class="text-sm text-slate-500">
                Claim submitted by
                <span class="font-semibold text-slate-700">{{
                  req.employeeName
                }}</span>
                <span class="mx-1">·</span>
                {{ req.submittedAt | date: 'dd MMM yyyy, HH:mm' }}
              </p>
            </div>

            <div class="flex flex-wrap gap-2">
              @if (req.status === 'Pending' && isOwner) {
                <p-button
                  label="Edit Claim"
                  icon="pi pi-pencil"
                  size="small"
                  severity="secondary"
                  [outlined]="true"
                  [routerLink]="['/claims/apply', req.requestId]"
                />
                <p-button
                  label="Withdraw"
                  icon="pi pi-times"
                  size="small"
                  severity="danger"
                  [outlined]="true"
                  (onClick)="withdraw()"
                />
              }

              @if (canApprove) {
                <p-button
                  label="Approve"
                  icon="pi pi-check"
                  size="small"
                  (onClick)="approve()"
                />
                <p-button
                  label="Reject"
                  icon="pi pi-times"
                  size="small"
                  severity="danger"
                  [outlined]="true"
                  (onClick)="reject()"
                />
              }
            </div>
          </div>

          <!-- Summary -->
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div
              class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div
                class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50"
              >
                <i class="pi pi-wallet text-lg text-blue-600"></i>
              </div>
              <p class="text-sm text-slate-500">Total Claim Amount</p>
              <h2 class="mt-1 text-2xl font-bold text-slate-900">
                RM {{ req.totalAmount | number: '1.2-2' }}
              </h2>
            </div>

            <div
              class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div
                class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50"
              >
                <i class="pi pi-user text-lg text-purple-600"></i>
              </div>
              <p class="text-sm text-slate-500">Employee</p>
              <h2 class="mt-1 truncate text-lg font-bold text-slate-900">
                {{ req.employeeName }}
              </h2>
            </div>

            <div
              class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div
                class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50"
              >
                <i class="pi pi-calendar text-lg text-emerald-600"></i>
              </div>
              <p class="text-sm text-slate-500">Submitted Date</p>
              <h2 class="mt-1 text-lg font-bold text-slate-900">
                {{ req.submittedAt | date: 'dd MMM yyyy' }}
              </h2>
            </div>

            <div
              class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div
                class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50"
              >
                <i class="pi pi-list text-lg text-amber-600"></i>
              </div>
              <p class="text-sm text-slate-500">Line Items</p>
              <h2 class="mt-1 text-2xl font-bold text-slate-900">
                {{ req.lineItems.length }}
              </h2>
            </div>
          </div>

          <!-- Claim Information -->
          <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div class="flex flex-col gap-6 lg:col-span-2">
              <!-- Claim Information -->
              <section
                class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                <div class="border-b border-slate-100 px-5 py-4">
                  <h2 class="font-semibold text-slate-900">
                    Claim Information
                  </h2>
                  <p class="mt-1 text-xs text-slate-500">
                    General information about this claim
                  </p>
                </div>

                <div class="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
                  @if (req.destination) {
                    <div>
                      <p
                        class="text-xs font-medium uppercase tracking-wide text-slate-400"
                      >
                        Destination
                      </p>
                      <p class="mt-1 font-semibold text-slate-800">
                        {{ req.destination }}
                      </p>
                    </div>
                  }

                  @if (req.tripStartDate) {
                    <div>
                      <p
                        class="text-xs font-medium uppercase tracking-wide text-slate-400"
                      >
                        Trip Period
                      </p>
                      <p class="mt-1 font-semibold text-slate-800">
                        {{ req.tripStartDate | date: 'dd MMM yyyy' }}
                        –
                        {{ req.tripEndDate | date: 'dd MMM yyyy' }}
                      </p>
                    </div>
                  }

                  @if (req.remarks) {
                    <div class="sm:col-span-2">
                      <p
                        class="text-xs font-medium uppercase tracking-wide text-slate-400"
                      >
                        Remarks
                      </p>
                      <p
                        class="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-700"
                      >
                        {{ req.remarks }}
                      </p>
                    </div>
                  }

                  @if (req.rejectionReason) {
                    <div
                      class="rounded-lg border border-red-200 bg-red-50 p-4 sm:col-span-2"
                    >
                      <div
                        class="flex items-center gap-2 text-sm font-semibold text-red-700"
                      >
                        <i class="pi pi-exclamation-circle"></i>
                        Rejection Reason
                      </div>
                      <p class="mt-2 whitespace-pre-wrap text-sm text-red-700">
                        {{ req.rejectionReason }}
                      </p>
                    </div>
                  }
                </div>
              </section>

              <!-- Line Items -->
              <section
                class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                <div
                  class="flex items-center justify-between border-b border-slate-100 px-5 py-4"
                >
                  <div>
                    <h2 class="font-semibold text-slate-900">
                      Claim Line Items
                    </h2>
                    <p class="mt-1 text-xs text-slate-500">
                      Breakdown of submitted expenses
                    </p>
                  </div>
                  <span
                    class="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                  >
                    {{ req.lineItems.length }} item(s)
                  </span>
                </div>

                <div class="overflow-x-auto">
                  <table class="w-full min-w-[600px] text-sm">
                    <thead
                      class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"
                    >
                      <tr>
                        <th class="px-5 py-3 text-left font-semibold">Kind</th>
                        <th class="px-5 py-3 text-left font-semibold">
                          Description
                        </th>
                        <th class="px-5 py-3 text-right font-semibold">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      @for (line of req.lineItems; track line.id) {
                        <tr class="transition hover:bg-slate-50">
                          <td class="px-5 py-4">
                            <span
                              class="inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                            >
                              {{ line.lineKind }}
                            </span>
                          </td>
                          <td class="px-5 py-4">
                            <p class="font-medium text-slate-800">
                              {{ line.description }}
                            </p>

                            <div
                              class="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-slate-500"
                            >
                              @if (line.category) {
                                <span>{{ line.category }}</span>
                              }
                              @if (line.hours) {
                                <span
                                  >· {{ line.dayType }} ·
                                  {{ line.hours }}h</span
                                >
                              }
                              @if (line.kilometers) {
                                <span
                                  >· {{ line.vehicleType }} ·
                                  {{ line.kilometers }} km</span
                                >
                              }
                              @if (line.mealDays) {
                                <span>· {{ line.mealDays }} day(s)</span>
                              }
                            </div>
                          </td>
                          <td
                            class="whitespace-nowrap px-5 py-4 text-right font-semibold text-slate-900"
                          >
                            RM {{ line.amount | number: '1.2-2' }}
                          </td>
                        </tr>
                      } @empty {
                        <tr>
                          <td
                            colspan="3"
                            class="px-5 py-10 text-center text-slate-400"
                          >
                            No line items available.
                          </td>
                        </tr>
                      }
                    </tbody>
                    <tfoot class="bg-slate-50">
                      <tr>
                        <td
                          colspan="2"
                          class="px-5 py-4 text-right font-semibold text-slate-600"
                        >
                          Total Amount
                        </td>
                        <td
                          class="px-5 py-4 text-right text-base font-bold text-blue-700"
                        >
                          RM {{ req.totalAmount | number: '1.2-2' }}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </section>

              <!-- Documents -->
              @if (req.documents.length) {
                <section
                  class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                >
                  <div class="border-b border-slate-100 px-5 py-4">
                    <h2 class="font-semibold text-slate-900">
                      Supporting Documents
                    </h2>
                    <p class="mt-1 text-xs text-slate-500">
                      Receipts and other uploaded documents
                    </p>
                  </div>

                  <div class="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
                    @for (doc of req.documents; track doc.id) {
                      <a
                        [href]="fileUrl(doc.fileUrl)"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 p-3 transition hover:border-blue-300 hover:bg-blue-50"
                      >
                        <div
                          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50"
                        >
                          <i class="pi pi-file-pdf text-lg text-red-500"></i>
                        </div>
                        <div class="min-w-0 flex-1">
                          <p
                            class="truncate text-sm font-semibold text-slate-800"
                          >
                            {{ doc.fileName }}
                          </p>
                          <p class="mt-1 text-xs text-slate-500">
                            {{ doc.documentKind }}
                          </p>
                        </div>
                        <i
                          class="pi pi-external-link shrink-0 text-sm text-slate-400"
                        ></i>
                      </a>
                    }
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
                      Track your claim approval steps
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
                    @if (req.noApproverAssigned) {
                      <div
                        class="rounded-lg border border-amber-200 bg-amber-50 p-4"
                      >
                        <div
                          class="flex items-center gap-2 text-sm font-semibold text-amber-800"
                        >
                          <i class="pi pi-exclamation-triangle"></i>
                          No approver assigned
                        </div>
                        <p class="mt-1 text-xs text-amber-700">
                          This claim currently has no assigned approver.
                        </p>
                      </div>
                    } @else if (!chainSteps.length) {
                      <div class="py-6 text-center">
                        <i
                          class="pi pi-info-circle text-2xl text-slate-300"
                        ></i>
                        <p class="mt-2 text-sm text-slate-500">
                          @if (req.status === 'Approved') {
                            No approvers assigned (auto-approved path).
                          } @else {
                            No approval steps available.
                          }
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

          <!-- Back button -->
          <div class="flex justify-start">
            <p-button
              label="Back to Claims"
              icon="pi pi-arrow-left"
              severity="secondary"
              [outlined]="true"
              size="small"
              routerLink="/claims"
            />
          </div>
        </div>
      } @else {
        <div
          class="flex min-h-[60vh] flex-col items-center justify-center gap-3"
        >
          <i class="pi pi-file text-4xl text-slate-300"></i>
          <p class="text-sm font-medium text-slate-500">
            Loading claim details...
          </p>
        </div>
      }
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
      'border-green-500 bg-green-50 text-green-700':
        s === 'approved' || s === 'completed',
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
