import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { finalize } from 'rxjs';

import { CLAIM_TYPE_LABELS, ClaimRequestDto } from '../../../models/Claim';
import { ClaimRequestService } from '../../../services/claim-request.service';
import { LoadingService } from '../../../services/loading.service';
import { UserService } from '../../../services/userService.service';

@Component({
  selector: 'app-claim-approvals',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    TableModule,
    TagModule,
    DialogModule,
    TextareaModule,
  ],
  template: `
    <div class="claim-approvals-page">
      <!-- Breadcrumb -->
      <div class="breadcrumb">
        <a routerLink="/dashboard">Dashboard</a>
        <i class="pi pi-angle-right"></i>
        <a routerLink="/claims">Claims</a>
        <i class="pi pi-angle-right"></i>
        <span>Approvals</span>
      </div>

      <!-- Heading -->
      <div class="page-heading">
        <div>
          <h1>Claim approvals</h1>
          <p>Review and manage employee claims awaiting your action.</p>
        </div>

        <div class="pending-count">
          <i class="pi pi-clock"></i>
          <span>{{ rows.length }} pending</span>
        </div>
      </div>

      <!-- Desktop table -->
      <div class="desktop-table-card">
        <p-table
          [value]="rows"
          [paginator]="true"
          [rows]="10"
          [rowHover]="true"
          responsiveLayout="scroll"
          styleClass="claim-approval-table"
        >
          <ng-template pTemplate="header">
            <tr>
              <th>Employee</th>
              <th>Claim type</th>
              <th>Amount</th>
              <th>Submitted</th>
              <th class="actions-column">Actions</th>
            </tr>
          </ng-template>

          <ng-template pTemplate="body" let-row>
            <tr>
              <td>
                <div class="employee-cell">
                  <div class="employee-avatar">
                    {{ getInitials(row.employeeName) }}
                  </div>
                  <span class="employee-name">{{ row.employeeName }}</span>
                </div>
              </td>

              <td>
                <span class="claim-type-pill">
                  {{ label(row.claimType) }}
                </span>
              </td>

              <td>
                <strong class="claim-amount">
                  RM {{ row.totalAmount | number: '1.2-2' }}
                </strong>
              </td>

              <td>
                <div class="submitted-date">
                  <i class="pi pi-calendar"></i>
                  {{ row.submittedAt | date: 'dd MMM yyyy' }}
                </div>
              </td>

              <td>
                <div class="table-actions">
                  <a
                    class="view-link"
                    [routerLink]="['/claims', row.requestId]"
                  >
                    <i class="pi pi-eye"></i>
                    View
                  </a>

                  <p-button
                    label="Approve"
                    icon="pi pi-check"
                    size="small"
                    (onClick)="approve(row)"
                  />

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
              <td colspan="5">
                <div class="empty-state">
                  <i class="pi pi-inbox"></i>
                  <h3>No pending approvals</h3>
                  <p>There are no claims waiting for your approval.</p>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- Mobile claim cards -->
      <div class="mobile-claim-list">
        @if (rows.length === 0) {
          <div class="empty-state mobile-empty-state">
            <i class="pi pi-inbox"></i>
            <h3>No pending approvals</h3>
            <p>There are no claims waiting for your approval.</p>
          </div>
        } @else {
          @for (row of rows; track row.requestId) {
            <article class="claim-card">
              <div class="claim-card-header">
                <div class="mobile-employee">
                  <div class="employee-avatar">
                    {{ getInitials(row.employeeName) }}
                  </div>

                  <div class="employee-info">
                    <h3>{{ row.employeeName }}</h3>
                    <span>Claim request</span>
                  </div>
                </div>

                <span class="claim-status">
                  <span class="status-dot"></span>
                  Pending
                </span>
              </div>

              <div class="claim-type-section">
                <span class="detail-label">Claim type</span>
                <span class="claim-type-pill">
                  {{ label(row.claimType) }}
                </span>
              </div>

              <div class="claim-information">
                <div class="claim-information-item amount-information">
                  <div class="information-icon">
                    <i class="pi pi-wallet"></i>
                  </div>

                  <div>
                    <span class="detail-label">Claim amount</span>
                    <strong>
                      RM {{ row.totalAmount | number: '1.2-2' }}
                    </strong>
                  </div>
                </div>

                <div class="claim-information-item">
                  <div class="information-icon">
                    <i class="pi pi-calendar"></i>
                  </div>

                  <div>
                    <span class="detail-label">Submitted date</span>
                    <strong>
                      {{ row.submittedAt | date: 'dd MMM yyyy' }}
                    </strong>
                  </div>
                </div>
              </div>

              <div class="claim-card-actions">
                <a
                  class="mobile-view-button"
                  [routerLink]="['/claims', row.requestId]"
                >
                  <i class="pi pi-eye"></i>
                  View details
                </a>

                <p-button
                  label="Approve"
                  icon="pi pi-check"
                  size="small"
                  (onClick)="approve(row)"
                />

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
        header="Reject claim"
        [(visible)]="rejectVisible"
        [modal]="true"
        [draggable]="false"
        [resizable]="false"
        [closable]="true"
        [breakpoints]="{ '640px': '100vw' }"
        [style]="{ width: '440px', maxWidth: '100vw' }"
        styleClass="claim-reject-dialog"
      >
        <div class="reject-form">
          <div class="reject-description">
            <div class="reject-warning-icon">
              <i class="pi pi-exclamation-triangle"></i>
            </div>

            <div>
              <h3>Reject this claim?</h3>
              <p>
                Please provide a reason for rejecting this claim. The employee
                will be notified.
              </p>
            </div>
          </div>

          <div class="reject-field">
            <label for="rejectReason"> Rejection reason <span>*</span> </label>

            <textarea
              id="rejectReason"
              pTextarea
              class="reject-textarea"
              rows="4"
              [(ngModel)]="rejectReason"
              placeholder="Enter the reason for rejecting this claim..."
              [autoResize]="true"
            ></textarea>

            <span class="field-hint">
              A rejection reason is required before submitting.
            </span>
          </div>

          <div class="reject-dialog-footer">
            <p-button
              label="Cancel"
              severity="secondary"
              [outlined]="true"
              (onClick)="rejectVisible = false"
            />

            <p-button
              label="Confirm reject"
              icon="pi pi-times"
              severity="danger"
              (onClick)="confirmReject()"
            />
          </div>
        </div>
      </p-dialog>
    </div>
  `,
  styleUrl: './claim-approvals.less',
})
export class ClaimApprovals implements OnInit {
  private readonly api = inject(ClaimRequestService);
  private readonly users = inject(UserService);
  private readonly messages = inject(MessageService);
  private readonly loading = inject(LoadingService);
  private readonly cdr = inject(ChangeDetectorRef);

  rows: ClaimRequestDto[] = [];
  rejectVisible = false;
  rejectReason = '';
  rejectTarget: ClaimRequestDto | null = null;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const userId = this.users.currentUser?.userId;
    if (!userId) return;

    this.loading.start();

    this.api
      .getPendingForHod(userId)
      .pipe(finalize(() => this.loading.stop()))
      .subscribe({
        next: (rows) => {
          this.rows = rows;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.messages.add({
            severity: 'error',
            summary: 'Failed',
            detail: err?.error?.message ?? 'Failed to load pending claims.',
          });
          this.cdr.markForCheck();
        },
      });
  }

  label(type: string): string {
    return CLAIM_TYPE_LABELS[type] ?? type;
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

  approve(row: ClaimRequestDto): void {
    const userId = this.users.currentUser?.userId;
    if (!userId) return;

    this.loading.start();

    this.api
      .approve(row.requestId, { approverId: userId })
      .pipe(finalize(() => this.loading.stop()))
      .subscribe({
        next: () => {
          this.messages.add({
            severity: 'success',
            summary: 'Approved',
            detail: 'Claim approved.',
          });
          this.load();
        },
        error: (err) => {
          this.messages.add({
            severity: 'error',
            summary: 'Failed',
            detail: err?.error?.message ?? 'Approve failed.',
          });
        },
      });
  }

  openReject(row: ClaimRequestDto): void {
    this.rejectTarget = row;
    this.rejectReason = '';
    this.rejectVisible = true;
  }

  confirmReject(): void {
    const userId = this.users.currentUser?.userId;

    if (!userId || !this.rejectTarget) return;

    if (!this.rejectReason.trim()) {
      this.messages.add({
        severity: 'warn',
        summary: 'Reason required',
        detail: 'Please enter a rejection reason.',
      });
      return;
    }

    const target = this.rejectTarget;
    const reason = this.rejectReason.trim();

    this.loading.start();

    this.api
      .reject(target.requestId, {
        approverId: userId,
        rejectionReason: reason,
      })
      .pipe(finalize(() => this.loading.stop()))
      .subscribe({
        next: () => {
          this.rejectVisible = false;
          this.rejectTarget = null;
          this.rejectReason = '';

          this.messages.add({
            severity: 'success',
            summary: 'Rejected',
            detail: 'Claim rejected.',
          });

          this.load();
        },
        error: (err) => {
          this.messages.add({
            severity: 'error',
            summary: 'Failed',
            detail: err?.error?.message ?? 'Reject failed.',
          });
        },
      });
  }
}
