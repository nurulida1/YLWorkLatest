import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { finalize } from 'rxjs/operators';
import { LeaveRequestDto } from '../../../models/Leave';
import { formatDaysAmount, formatLeaveDurationLabel } from '../../../common/leave-day.util';
import { LeaveRequestService } from '../../../services/leave-request.service';
import { LoadingService } from '../../../services/loading.service';
import { UserService } from '../../../services/userService.service';
import { environment } from '../../../../environments/environment.development';

@Component({
  selector: 'app-leave-approvals',
  imports: [
    CommonModule,
    RouterLink,
    TableModule,
    ButtonModule,
    TagModule,
    DialogModule,
    ReactiveFormsModule,
    TextareaModule,
  ],
  template: `
    <div class="w-full flex flex-col p-5 gap-4">
      <div class="flex items-center gap-1 text-gray-500 text-sm">
        <a routerLink="/dashboard" class="hover:text-gray-700">Dashboard</a><span>/</span>
        <a routerLink="/leave" class="hover:text-gray-700">Leave</a><span>/</span>
        <span class="text-gray-800 font-semibold">Approvals</span>
      </div>
      <h1 class="text-xl font-semibold text-gray-800">Pending HOD approvals</h1>
      <p class="text-gray-500 text-sm">
        Leave requests
      </p>

      <div class="bg-white border border-gray-200 rounded-lg p-4">
        <p-table [value]="requests" styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              <th>Employee</th>
              <th>Type</th>
              <th>Dates</th>
              <th>Days</th>
              <th>Reason</th>
              <th>Document</th>
              <th>Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-row>
            <tr [class.bg-red-50]="row.isEmergency">
              <td>{{ row.employeeName }}</td>
              <td>
                {{ row.leaveTypeName }}
                @if (row.isShortNoticeAnnual) { <p-tag value="Short notice → Unpaid" severity="warn" class="ml-1" /> }
                @else if (hasBalanceSplit(row)) { <p-tag value="Balance split" severity="warn" class="ml-1" /> }
                @else if (row.isUnpaid) { <p-tag value="Unpaid" severity="secondary" class="ml-1" /> }
                @if (row.isEmergency) { <p-tag value="URGENT" severity="danger" class="ml-1" /> }
              </td>
              <td>{{ row.startDate | date:'dd MMM yyyy' }} – {{ row.endDate | date:'dd MMM yyyy' }}</td>
              <td>
                {{ formatLeaveDays(row) }}
                @if (hasBalanceSplit(row)) {
                  <div class="text-xs text-gray-500 mt-0.5">
                    @for (line of row.balanceAllocations!; track line.leaveTypeId + line.sortOrder; let last = $last) {
                      <span>{{ line.leaveTypeName }} {{ formatDays(line.days) }}{{ last ? '' : ' · ' }}</span>
                    }
                  </div>
                }
              </td>
              <td class="max-w-xs whitespace-pre-wrap text-gray-700">{{ row.reason }}</td>
              <td>
                @if (row.documentUrl) {
                  <a
                    [href]="resolveDocumentUrl(row.documentUrl)"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline max-w-[180px]"
                    [title]="row.documentFileName || 'View document'"
                  >
                    <i class="pi pi-file text-yellow-600 shrink-0"></i>
                    <span class="truncate">{{ row.documentFileName || 'View' }}</span>
                  </a>
                } @else {
                  <span class="text-gray-400 text-sm">—</span>
                }
              </td>
              <td class="flex gap-1 flex-wrap">
                <p-button label="Approve" size="small" (onClick)="approve(row)" />
                @if (canFinalize(row)) {
                  <p-button
                    label="Finalize"
                    size="small"
                    severity="success"
                    [outlined]="true"
                    (onClick)="finalize(row)"
                  />
                }
                <p-button label="Reject" size="small" severity="danger" [outlined]="true" (onClick)="openReject(row)" />
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="7" class="text-center text-gray-500 py-8">No pending requests.</td></tr>
          </ng-template>
        </p-table>
      </div>

      <p-dialog header="Reject leave" [(visible)]="rejectVisible" [modal]="true" [style]="{ width: '440px' }">
        <form [formGroup]="rejectForm" class="flex flex-col gap-3">
          <p class="text-sm text-gray-600">Rejection reason is mandatory.</p>
          <textarea pTextarea formControlName="rejectionReason" rows="4"></textarea>
          <p-button label="Confirm reject" severity="danger" (onClick)="confirmReject()" />
        </form>
      </p-dialog>
    </div>
  `,
})
export class LeaveApprovals implements OnInit, OnDestroy {
  private readonly leaveService = inject(LeaveRequestService);
  private readonly userService = inject(UserService);
  private readonly messageService = inject(MessageService);
  private readonly loadingService = inject(LoadingService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly fb = inject(FormBuilder);

  requests: LeaveRequestDto[] = [];
  rejectVisible = false;
  selected: LeaveRequestDto | null = null;
  rejectForm = this.fb.group({ rejectionReason: ['', [Validators.required, Validators.minLength(3)]] });

  formatLeaveDays(row: LeaveRequestDto): string {
    return formatLeaveDurationLabel(row);
  }

  formatDays(value: number | null | undefined): string {
    return formatDaysAmount(value);
  }

  hasBalanceSplit(row: LeaveRequestDto): boolean {
    const n = row.balanceAllocations?.length ?? 0;
    if (row.isEmergency && n > 0) return true;
    return n > 1;
  }

  ngOnInit(): void {
    const hodId = this.userService.currentUser?.userId;
    if (!hodId) return;
    this.loadingService.start();
    this.leaveService
      .getPendingForHod(hodId)
      .pipe(finalize(() => this.loadingService.stop()))
      .subscribe({
        next: (data) => {
          this.requests = data;
          this.cdr.markForCheck();
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load pending requests' });
          this.cdr.markForCheck();
        },
      });
  }

  ngOnDestroy(): void {
    this.loadingService.stop();
  }

  approve(row: LeaveRequestDto): void {
    const approverId = this.userService.currentUser?.userId;
    if (!approverId) return;
    this.loadingService.start();
    this.leaveService
      .approve(row.requestId, { approverId })
      .pipe(finalize(() => this.loadingService.stop()))
      .subscribe({
        next: () => {
          this.requests = this.requests.filter((r) => r.requestId !== row.requestId);
          this.messageService.add({ severity: 'success', summary: 'Approved', detail: `${row.employeeName}'s leave approved` });
          this.cdr.markForCheck();
        },
        error: (e) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: e.error?.message || 'Approve failed' });
          this.cdr.markForCheck();
        },
      });
  }

  canFinalize(row: LeaveRequestDto): boolean {
    const user = this.userService.currentUser;
    if (!user?.userId) return false;
    if ((user.systemRole ?? '').toString().toLowerCase() !== 'hr') return false;
    const ids = row.currentApproverIds ?? [];
    return ids.includes(user.userId);
  }

  finalize(row: LeaveRequestDto): void {
    const approverId = this.userService.currentUser?.userId;
    if (!approverId || !this.canFinalize(row)) return;
    this.loadingService.start();
    this.leaveService
      .finalize(row.requestId, { approverId })
      .pipe(finalize(() => this.loadingService.stop()))
      .subscribe({
        next: () => {
          this.requests = this.requests.filter((r) => r.requestId !== row.requestId);
          this.messageService.add({
            severity: 'success',
            summary: 'Finalized',
            detail: `${row.employeeName}'s leave finalized by HR`,
          });
          this.cdr.markForCheck();
        },
        error: (e) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: e.error?.message || 'Finalize failed',
          });
          this.cdr.markForCheck();
        },
      });
  }

  openReject(row: LeaveRequestDto): void {
    this.selected = row;
    this.rejectForm.reset();
    this.rejectVisible = true;
  }

  confirmReject(): void {
    const approverId = this.userService.currentUser?.userId;
    if (!this.selected || !approverId || this.rejectForm.invalid) return;
    this.loadingService.start();
    this.leaveService
      .reject(this.selected.requestId, {
        approverId,
        rejectionReason: this.rejectForm.value.rejectionReason!,
      })
      .pipe(finalize(() => this.loadingService.stop()))
      .subscribe({
        next: () => {
          const id = this.selected!.requestId;
          this.requests = this.requests.filter((r) => r.requestId !== id);
          this.rejectVisible = false;
          this.messageService.add({ severity: 'info', summary: 'Rejected', detail: 'Employee notified' });
          this.cdr.markForCheck();
        },
        error: (e) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: e.error?.message || 'Reject failed' });
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
