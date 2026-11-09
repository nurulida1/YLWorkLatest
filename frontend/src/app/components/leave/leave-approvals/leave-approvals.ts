import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
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
import {
  formatDaysAmount,
  formatLeaveDurationLabel,
} from '../../../common/guard/leave-day.util';
import { LeaveRequestService } from '../../../services/leave-request.service';
import { LoadingService } from '../../../services/loading.service';
import { UserService } from '../../../services/userService.service';
import { environment } from '../../../../environments/environment';

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
    <div class="leave-approvals-page">
      <!-- Breadcrumb -->
      <div class="breadcrumb">
        <a routerLink="/dashboard">Dashboard</a>
        <i class="pi pi-angle-right"></i>
        <a routerLink="/leave">Leave</a>
        <i class="pi pi-angle-right"></i>
        <span>Approvals</span>
      </div>

      <!-- Page heading -->
      <div class="page-heading">
        <div>
          <h1>Pending HOD approvals</h1>
          <p>Review and manage employee leave requests.</p>
        </div>

        <div class="pending-count">
          <i class="pi pi-clock"></i>
          <span>{{ requests.length }} pending</span>
        </div>
      </div>

      <!-- Desktop table -->
      <div class="desktop-table-card">
        <p-table
          [value]="requests"
          styleClass="p-datatable-sm leave-approval-table"
          [rowHover]="true"
          responsiveLayout="scroll"
        >
          <ng-template pTemplate="header">
            <tr>
              <th>Employee</th>
              <th>Leave type</th>
              <th>Dates</th>
              <th>Days</th>
              <th>Reason</th>
              <th>Document</th>
              <th class="actions-column">Actions</th>
            </tr>
          </ng-template>

          <ng-template pTemplate="body" let-row>
            <tr [class.emergency-row]="row.isEmergency">
              <td>
                <div class="employee-cell">
                  <div class="employee-avatar">
                    {{ getInitials(row.employeeName) }}
                  </div>
                  <span class="employee-name">{{ row.employeeName }}</span>
                </div>
              </td>

              <td>
                <div class="tag-list">
                  <span class="leave-type-name">{{ row.leaveTypeName }}</span>

                  @if (row.isShortNoticeAnnual) {
                    <p-tag value="Short notice → Unpaid" severity="warn" />
                  } @else if (hasBalanceSplit(row)) {
                    <p-tag value="Balance split" severity="warn" />
                  } @else if (row.isUnpaid) {
                    <p-tag value="Unpaid" severity="secondary" />
                  }

                  @if (row.isEmergency) {
                    <p-tag value="URGENT" severity="danger" />
                  }
                </div>
              </td>

              <td>
                <div class="date-cell">
                  <span>{{ row.startDate | date: 'dd MMM yyyy' }}</span>
                  <span class="date-separator">to</span>
                  <span>{{ row.endDate | date: 'dd MMM yyyy' }}</span>
                </div>
              </td>

              <td>
                <div class="days-cell">
                  <strong>{{ formatLeaveDays(row) }}</strong>

                  @if (hasBalanceSplit(row)) {
                    <div class="balance-details">
                      @for (
                        line of row.balanceAllocations!;
                        track line.leaveTypeId + line.sortOrder;
                        let last = $last
                      ) {
                        <span>
                          {{ line.leaveTypeName }}
                          {{ formatDays(line.days) }}{{ last ? '' : ' · ' }}
                        </span>
                      }
                    </div>
                  }
                </div>
              </td>

              <td>
                <div class="reason-cell">{{ row.reason || '—' }}</div>
              </td>

              <td>
                @if (row.documentUrl) {
                  <a
                    [href]="resolveDocumentUrl(row.documentUrl)"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="document-link"
                    [title]="row.documentFileName || 'View document'"
                  >
                    <i class="pi pi-file-pdf"></i>
                    <span>{{ row.documentFileName || 'View document' }}</span>
                    <i class="pi pi-external-link"></i>
                  </a>
                } @else {
                  <span class="no-document">No document</span>
                }
              </td>

              <td>
                <div class="table-actions">
                  <p-button
                    label="Approve"
                    icon="pi pi-check"
                    size="small"
                    (onClick)="approve(row)"
                  />

                  @if (canFinalize(row)) {
                    <p-button
                      label="Finalize"
                      icon="pi pi-verified"
                      size="small"
                      severity="success"
                      [outlined]="true"
                      (onClick)="finalize(row)"
                    />
                  }

                  <p-button
                    label="Reject"
                    icon="pi pi-times"
                    size="small"
                    severity="danger"
                    [outlined]="true"
                    (onClick)="openReject(row)"
                  />
                </div>
              </td>
            </tr>
          </ng-template>

          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="7">
                <div class="empty-state">
                  <i class="pi pi-inbox"></i>
                  <h3>No pending requests</h3>
                  <p>There are no leave requests waiting for your approval.</p>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- Mobile request cards -->
      <div class="mobile-request-list">
        @if (requests.length === 0) {
          <div class="empty-state mobile-empty-state">
            <i class="pi pi-inbox"></i>
            <h3>No pending requests</h3>
            <p>There are no leave requests waiting for your approval.</p>
          </div>
        } @else {
          @for (row of requests; track row.requestId) {
            <article
              class="request-card"
              [class.request-card-emergency]="row.isEmergency"
            >
              <div class="request-card-header">
                <div class="mobile-employee">
                  <div class="employee-avatar">
                    {{ getInitials(row.employeeName) }}
                  </div>

                  <div class="mobile-employee-info">
                    <h3>{{ row.employeeName }}</h3>
                    <span>Leave request</span>
                  </div>
                </div>

                @if (row.isEmergency) {
                  <p-tag value="URGENT" severity="danger" />
                }
              </div>

              <div class="request-card-tags">
                <span class="leave-type-pill">{{ row.leaveTypeName }}</span>

                @if (row.isShortNoticeAnnual) {
                  <p-tag value="Short notice → Unpaid" severity="warn" />
                } @else if (hasBalanceSplit(row)) {
                  <p-tag value="Balance split" severity="warn" />
                } @else if (row.isUnpaid) {
                  <p-tag value="Unpaid" severity="secondary" />
                }
              </div>

              <div class="request-details">
                <div class="request-detail">
                  <div class="detail-icon">
                    <i class="pi pi-calendar"></i>
                  </div>
                  <div>
                    <span class="detail-label">Leave dates</span>
                    <strong>
                      {{ row.startDate | date: 'dd MMM yyyy' }}
                      –
                      {{ row.endDate | date: 'dd MMM yyyy' }}
                    </strong>
                  </div>
                </div>

                <div class="request-detail">
                  <div class="detail-icon">
                    <i class="pi pi-clock"></i>
                  </div>
                  <div>
                    <span class="detail-label">Duration</span>
                    <strong>{{ formatLeaveDays(row) }}</strong>

                    @if (hasBalanceSplit(row)) {
                      <div class="balance-details mobile-balance-details">
                        @for (
                          line of row.balanceAllocations!;
                          track line.leaveTypeId + line.sortOrder;
                          let last = $last
                        ) {
                          <span>
                            {{ line.leaveTypeName }}
                            {{ formatDays(line.days) }}{{ last ? '' : ' · ' }}
                          </span>
                        }
                      </div>
                    }
                  </div>
                </div>
              </div>

              <div class="request-reason">
                <span class="detail-label">Reason</span>
                <p>{{ row.reason || 'No reason provided.' }}</p>
              </div>

              <div class="request-document">
                <span class="detail-label">Supporting document</span>

                @if (row.documentUrl) {
                  <a
                    [href]="resolveDocumentUrl(row.documentUrl)"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="document-link"
                    [title]="row.documentFileName || 'View document'"
                  >
                    <i class="pi pi-file-pdf"></i>
                    <span>{{ row.documentFileName || 'View document' }}</span>
                    <i class="pi pi-external-link"></i>
                  </a>
                } @else {
                  <span class="no-document">No document attached</span>
                }
              </div>

              <div class="mobile-card-actions">
                <p-button
                  label="Approve"
                  icon="pi pi-check"
                  size="small"
                  (onClick)="approve(row)"
                />

                @if (canFinalize(row)) {
                  <p-button
                    label="Finalize"
                    icon="pi pi-verified"
                    size="small"
                    severity="success"
                    [outlined]="true"
                    (onClick)="finalize(row)"
                  />
                }

                <p-button
                  label="Reject"
                  icon="pi pi-times"
                  size="small"
                  severity="danger"
                  [outlined]="true"
                  (onClick)="openReject(row)"
                />
              </div>
            </article>
          }
        }
      </div>

      <!-- Reject dialog -->
      <p-dialog
        header="Reject leave request"
        [(visible)]="rejectVisible"
        [modal]="true"
        [draggable]="false"
        [resizable]="false"
        [closable]="true"
        [breakpoints]="{ '640px': '100vw' }"
        [style]="{ width: '440px', maxWidth: '100vw' }"
        styleClass="leave-reject-dialog"
      >
        <form
          [formGroup]="rejectForm"
          class="reject-form"
          (ngSubmit)="confirmReject()"
        >
          <div class="reject-dialog-description">
            <div class="reject-warning-icon">
              <i class="pi pi-exclamation-triangle"></i>
            </div>

            <div>
              <h3>Reject this leave request?</h3>
              <p>
                Please provide a reason. The employee will be notified of the
                rejection.
              </p>
            </div>
          </div>

          <div class="reject-field">
            <label for="rejectionReason">
              Rejection reason <span>*</span>
            </label>

            <textarea
              id="rejectionReason"
              pTextarea
              formControlName="rejectionReason"
              rows="4"
              placeholder="Enter the reason for rejecting this request..."
              [autoResize]="true"
              class="reject-textarea"
            ></textarea>

            @if (
              rejectForm.controls.rejectionReason.touched &&
              rejectForm.controls.rejectionReason.invalid
            ) {
              <small class="reject-validation">
                Please enter a reason with at least 3 characters.
              </small>
            }
          </div>

          <div class="reject-dialog-footer">
            <p-button
              label="Cancel"
              severity="secondary"
              [outlined]="true"
              type="button"
              (onClick)="rejectVisible = false"
            />

            <p-button
              label="Confirm reject"
              icon="pi pi-times"
              severity="danger"
              type="submit"
              [disabled]="rejectForm.invalid"
            />
          </div>
        </form>
      </p-dialog>
    </div>
  `,
  styleUrl: './leave-approvals.less',
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

  rejectForm = this.fb.group({
    rejectionReason: ['', [Validators.required, Validators.minLength(3)]],
  });

  formatLeaveDays(row: LeaveRequestDto): string {
    return formatLeaveDurationLabel(row);
  }

  formatDays(value: number | null | undefined): string {
    return formatDaysAmount(value);
  }

  getInitials(name: string | null | undefined): string {
    if (!name?.trim()) return 'NA';

    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
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
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load pending requests',
          });
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
          this.requests = this.requests.filter(
            (r) => r.requestId !== row.requestId,
          );

          this.messageService.add({
            severity: 'success',
            summary: 'Approved',
            detail: `${row.employeeName}'s leave approved`,
          });

          this.cdr.markForCheck();
        },
        error: (e) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: e.error?.message || 'Approve failed',
          });
          this.cdr.markForCheck();
        },
      });
  }

  canFinalize(row: LeaveRequestDto): boolean {
    const user = this.userService.currentUser;

    if (!user?.userId) return false;

    if ((user.systemRole ?? '').toString().toLowerCase() !== 'hr') {
      return false;
    }

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
          this.requests = this.requests.filter(
            (r) => r.requestId !== row.requestId,
          );

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

    if (!this.selected || !approverId || this.rejectForm.invalid) {
      this.rejectForm.markAllAsTouched();
      return;
    }

    const selectedRequest = this.selected;
    const rejectionReason = this.rejectForm.value.rejectionReason?.trim() ?? '';

    this.loadingService.start();

    this.leaveService
      .reject(selectedRequest.requestId, {
        approverId,
        rejectionReason,
      })
      .pipe(finalize(() => this.loadingService.stop()))
      .subscribe({
        next: () => {
          this.requests = this.requests.filter(
            (r) => r.requestId !== selectedRequest.requestId,
          );

          this.rejectVisible = false;
          this.selected = null;

          this.messageService.add({
            severity: 'info',
            summary: 'Rejected',
            detail: 'Employee notified',
          });

          this.cdr.markForCheck();
        },
        error: (e) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: e.error?.message || 'Reject failed',
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
