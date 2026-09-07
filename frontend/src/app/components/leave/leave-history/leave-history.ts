import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { finalize } from 'rxjs/operators';
import { LeaveRequestDto } from '../../../models/Leave';
import { formatDaysAmount, formatLeaveDurationLabel } from '../../../common/leave-day.util';
import { LeaveRequestService } from '../../../services/leave-request.service';
import { LoadingService } from '../../../services/loading.service';
import { UserService } from '../../../services/userService.service';

@Component({
  selector: 'app-leave-history',
  imports: [CommonModule, RouterLink, TableModule, ButtonModule, TagModule],
  template: `
    <div class="w-full flex flex-col p-5 gap-4">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div class="flex items-center gap-1 text-gray-500 text-sm mb-1">
            <a routerLink="/dashboard" class="hover:text-gray-700">Dashboard</a><span>/</span>
            <a routerLink="/leave" class="hover:text-gray-700">Leave</a><span>/</span>
            <span class="text-gray-800 font-semibold">History</span>
          </div>
          <h1 class="text-xl font-semibold text-gray-800">Leave history</h1>
        </div>
        <p-button label="Apply leave" icon="pi pi-plus" routerLink="/leave/apply" />
      </div>

      <div class="bg-white border border-gray-200 rounded-lg p-4">
        <p-table [value]="requests" [paginator]="true" [rows]="10" styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              <th>Type</th>
              <th>Dates</th>
              <th>Days</th>
              <th>Status</th>
              <th></th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-row>
            <tr>
              <td>
                {{ row.leaveTypeName }}
                @if (row.isShortNoticeAnnual) {
                  <p-tag value="Short notice → Unpaid" severity="warn" class="ml-1" />
                } @else if (hasBalanceSplit(row)) {
                  <p-tag value="Balance split" severity="warn" class="ml-1" />
                } @else if (row.isUnpaid) {
                  <p-tag value="Unpaid" severity="secondary" class="ml-1" />
                }
                @if (row.isEmergency) {
                  <p-tag value="Emergency" severity="danger" class="ml-1" />
                }
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
              <td><p-tag [value]="statusLabel(row)" [severity]="statusSeverity(row)" /></td>
              <td>
                @if (row.status === 'Pending') {
                  <p-button label="Edit" size="small" [text]="true" [routerLink]="['/leave/apply', row.requestId]" />
                }
                <p-button label="View" size="small" [text]="true" [routerLink]="['/leave', row.requestId]" />
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="5" class="text-center text-gray-500 py-8">No leave requests yet.</td></tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `,
})
export class LeaveHistory implements OnInit, OnDestroy {
  private readonly leaveService = inject(LeaveRequestService);
  private readonly userService = inject(UserService);
  private readonly messageService = inject(MessageService);
  private readonly loadingService = inject(LoadingService);
  private readonly cdr = inject(ChangeDetectorRef);

  requests: LeaveRequestDto[] = [];

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
    const userId = this.userService.currentUser?.userId;
    this.loadingService.start();
    this.leaveService
      .getAll(userId)
      .pipe(finalize(() => this.loadingService.stop()))
      .subscribe({
        next: (data) => {
          this.requests = data;
          this.cdr.markForCheck();
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load leave history' });
          this.cdr.markForCheck();
        },
      });
  }

  ngOnDestroy(): void {
    this.loadingService.stop();
  }

  statusLabel(row: LeaveRequestDto): string {
    return row.status;
  }

  statusSeverity(row: LeaveRequestDto): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    switch (row.status) {
      case 'Approved': return 'success';
      case 'Rejected': return 'danger';
      case 'Pending': return 'warn';
      default: return 'secondary';
    }
  }
}
