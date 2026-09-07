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
    <div class="w-full min-h-screen bg-[#f4f6f8] p-6 flex flex-col gap-5">
      <div>
        <h1 class="text-2xl font-bold m-0">Claim approvals</h1>
        <p class="text-sm text-gray-500 mt-1 m-0">Claims awaiting your action</p>
      </div>

      <div class="bg-white rounded-lg shadow-sm p-5">
        <p-table [value]="rows" [paginator]="true" [rows]="10">
          <ng-template pTemplate="header">
            <tr>
              <th>Employee</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Submitted</th>
              <th></th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-row>
            <tr>
              <td>{{ row.employeeName }}</td>
              <td>{{ label(row.claimType) }}</td>
              <td>RM {{ row.totalAmount | number: '1.2-2' }}</td>
              <td>{{ row.submittedAt | date: 'dd MMM yyyy' }}</td>
              <td class="flex flex-wrap gap-2">
                <a class="text-blue-600 text-sm self-center" [routerLink]="['/claims', row.requestId]"
                  >View</a
                >
                <p-button label="Approve" size="small" (onClick)="approve(row)" />
                <p-button
                  label="Reject"
                  size="small"
                  severity="danger"
                  [outlined]="true"
                  (onClick)="openReject(row)"
                />
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="5" class="text-center text-gray-500 py-6">
                No pending approvals.
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <p-dialog
        header="Reject claim"
        [(visible)]="rejectVisible"
        [modal]="true"
        [style]="{ width: '28rem' }"
      >
        <textarea
          pTextarea
          class="w-full"
          rows="4"
          [(ngModel)]="rejectReason"
          placeholder="Rejection reason (required)"
        ></textarea>
        <div class="flex justify-end gap-2 mt-3">
          <p-button label="Cancel" severity="secondary" [outlined]="true" (onClick)="rejectVisible = false" />
          <p-button label="Reject" severity="danger" (onClick)="confirmReject()" />
        </div>
      </p-dialog>
    </div>
  `,
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
      });
  }

  label(type: string): string {
    return CLAIM_TYPE_LABELS[type] ?? type;
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
        error: (err) =>
          this.messages.add({
            severity: 'error',
            summary: 'Failed',
            detail: err?.error?.message ?? 'Approve failed.',
          }),
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
    this.loading.start();
    this.api
      .reject(this.rejectTarget.requestId, {
        approverId: userId,
        rejectionReason: this.rejectReason.trim(),
      })
      .pipe(finalize(() => this.loading.stop()))
      .subscribe({
        next: () => {
          this.rejectVisible = false;
          this.messages.add({
            severity: 'success',
            summary: 'Rejected',
            detail: 'Claim rejected.',
          });
          this.load();
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
