import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { finalize } from 'rxjs/operators';

import { LeaveRequestDto } from '../../../models/Leave';
import {
  formatDaysAmount,
  formatLeaveDurationLabel,
} from '../../../common/guard/leave-day.util';
import { LeaveRequestService } from '../../../services/leave-request.service';
import { LoadingService } from '../../../services/loading.service';
import { UserService } from '../../../services/userService.service';

@Component({
  selector: 'app-leave-history',
  imports: [CommonModule, RouterLink, TableModule, ButtonModule, TagModule],
  template: `
    <div class="min-h-screen w-full bg-slate-50">
      <div
        class="mx-auto flex w-full max-w-[1440px] flex-col gap-6 p-4 sm:p-6 lg:p-8"
      >
        <!-- Page Header -->
        <div
          class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <div
              class="mb-2 flex flex-wrap items-center gap-2 text-sm text-slate-400"
            >
              <a
                routerLink="/dashboard"
                class="transition-colors hover:text-blue-600"
              >
                Dashboard
              </a>

              <i class="pi pi-angle-right text-xs"></i>

              <a
                routerLink="/leave"
                class="transition-colors hover:text-blue-600"
              >
                Leave
              </a>

              <i class="pi pi-angle-right text-xs"></i>

              <span class="font-medium text-slate-700">History</span>
            </div>

            <div>
              <h1
                class="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl"
              >
                Leave History
              </h1>

              <p class="mt-1 text-sm text-slate-500">
                View and manage your previous leave applications.
              </p>
            </div>
          </div>

          <p-button
            label="Apply Leave"
            icon="pi pi-plus"
            routerLink="/leave/apply"
            styleClass="w-full sm:w-auto bg-blue-700! border-blue-700! hover:bg-blue-800! rounded-lg! px-5! py-3!"
          />
        </div>

        <!-- Summary Cards -->
        <div
          class="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4"
        >
          <!-- Total -->
          <div
            class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
          >
            <div class="flex items-center justify-between gap-2">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600"
              >
                <i class="pi pi-calendar text-lg"></i>
              </div>

              <span class="text-xs font-medium text-slate-400">
                All requests
              </span>
            </div>

            <div class="mt-4">
              <div class="text-2xl font-bold text-slate-800 sm:text-3xl">
                {{ requests.length }}
              </div>

              <div class="mt-1 text-sm text-slate-500">Total applications</div>
            </div>
          </div>

          <!-- Pending -->
          <div
            class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
          >
            <div class="flex items-center justify-between gap-2">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600"
              >
                <i class="pi pi-clock text-lg"></i>
              </div>

              <span class="text-xs font-medium text-slate-400"> Awaiting </span>
            </div>

            <div class="mt-4">
              <div class="text-2xl font-bold text-amber-600 sm:text-3xl">
                {{ pendingCount }}
              </div>

              <div class="mt-1 text-sm text-slate-500">Pending requests</div>
            </div>
          </div>

          <!-- Approved -->
          <div
            class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
          >
            <div class="flex items-center justify-between gap-2">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"
              >
                <i class="pi pi-check-circle text-lg"></i>
              </div>

              <span class="text-xs font-medium text-slate-400"> Accepted </span>
            </div>

            <div class="mt-4">
              <div class="text-2xl font-bold text-emerald-600 sm:text-3xl">
                {{ approvedCount }}
              </div>

              <div class="mt-1 text-sm text-slate-500">Approved requests</div>
            </div>
          </div>

          <!-- Rejected -->
          <div
            class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
          >
            <div class="flex items-center justify-between gap-2">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600"
              >
                <i class="pi pi-times-circle text-lg"></i>
              </div>

              <span class="text-xs font-medium text-slate-400"> Declined </span>
            </div>

            <div class="mt-4">
              <div class="text-2xl font-bold text-red-600 sm:text-3xl">
                {{ rejectedCount }}
              </div>

              <div class="mt-1 text-sm text-slate-500">Rejected requests</div>
            </div>
          </div>
        </div>

        <!-- Leave History Section -->
        <div
          class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
        >
          <!-- Section Header -->
          <div
            class="flex flex-col gap-2 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
          >
            <div>
              <h2 class="text-base font-semibold text-slate-800">
                My Leave Applications
              </h2>

              <p class="mt-1 text-xs text-slate-500">
                A record of all your submitted leave requests.
              </p>
            </div>

            <div class="flex items-center gap-2 text-xs text-slate-400">
              <i class="pi pi-file text-sm"></i>
              {{ requests.length }} records
            </div>
          </div>

          <!-- Mobile Cards -->
          <div class="flex flex-col gap-3 p-4 lg:hidden">
            @if (requests.length > 0) {
              @for (row of requests; track row.requestId) {
                <div
                  class="rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-sm"
                >
                  <!-- Card Top -->
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0 flex-1">
                      <div
                        class="text-xs font-medium uppercase tracking-wide text-slate-400"
                      >
                        Leave Type
                      </div>

                      <h3
                        class="mt-1 break-words text-base font-semibold text-slate-800"
                      >
                        {{ row.leaveTypeName }}
                      </h3>
                    </div>

                    <p-tag
                      [value]="statusLabel(row)"
                      [severity]="statusSeverity(row)"
                      styleClass="shrink-0"
                    />
                  </div>

                  <!-- Additional Labels -->
                  <div class="mt-3 flex flex-wrap gap-1.5">
                    @if (row.isShortNoticeAnnual) {
                      <p-tag value="Short notice → Unpaid" severity="warn" />
                    } @else if (hasBalanceSplit(row)) {
                      <p-tag value="Balance split" severity="warn" />
                    } @else if (row.isUnpaid) {
                      <p-tag value="Unpaid" severity="secondary" />
                    }

                    @if (row.isEmergency) {
                      <p-tag value="Emergency" severity="danger" />
                    }
                  </div>

                  <!-- Divider -->
                  <div
                    class="my-4 border-t border-dashed border-slate-200"
                  ></div>

                  <!-- Dates -->
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <div
                        class="flex items-center gap-1.5 text-xs text-slate-400"
                      >
                        <i class="pi pi-calendar"></i>
                        Start Date
                      </div>

                      <div class="mt-1 text-sm font-medium text-slate-700">
                        {{ row.startDate | date: 'dd MMM yyyy' }}
                      </div>
                    </div>

                    <div>
                      <div
                        class="flex items-center gap-1.5 text-xs text-slate-400"
                      >
                        <i class="pi pi-calendar"></i>
                        End Date
                      </div>

                      <div class="mt-1 text-sm font-medium text-slate-700">
                        {{ row.endDate | date: 'dd MMM yyyy' }}
                      </div>
                    </div>
                  </div>

                  <!-- Duration -->
                  <div class="mt-4 rounded-lg bg-slate-50 p-3">
                    <div class="flex items-center justify-between gap-2">
                      <div
                        class="flex items-center gap-2 text-sm text-slate-500"
                      >
                        <i class="pi pi-clock"></i>
                        Leave Duration
                      </div>

                      <span class="text-sm font-bold text-slate-800">
                        {{ formatLeaveDays(row) }}
                      </span>
                    </div>

                    @if (hasBalanceSplit(row)) {
                      <div class="mt-2 border-t border-slate-200 pt-2">
                        @for (
                          line of row.balanceAllocations!;
                          track line.leaveTypeId + line.sortOrder
                        ) {
                          <div
                            class="flex items-center justify-between gap-2 py-1 text-xs text-slate-500"
                          >
                            <span>{{ line.leaveTypeName }}</span>
                            <span class="font-medium text-slate-700">
                              {{ formatDays(line.days) }}
                            </span>
                          </div>
                        }
                      </div>
                    }
                  </div>

                  <!-- Actions -->
                  <div class="mt-4 flex gap-2">
                    @if (row.status === 'Pending') {
                      <p-button
                        label="Edit"
                        icon="pi pi-pencil"
                        severity="secondary"
                        [outlined]="true"
                        size="small"
                        [routerLink]="['/leave/apply', row.requestId]"
                        styleClass="flex-1 justify-center rounded-lg!"
                      />
                    }

                    <p-button
                      label="View Details"
                      icon="pi pi-arrow-right"
                      iconPos="right"
                      size="small"
                      [outlined]="true"
                      severity="info"
                      [routerLink]="['/leave', row.requestId]"
                      styleClass="flex-1 justify-center rounded-lg!"
                    />
                  </div>
                </div>
              }
            } @else {
              <!-- Mobile Empty State -->
              <div
                class="flex flex-col items-center justify-center px-4 py-12 text-center"
              >
                <div
                  class="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50"
                >
                  <i class="pi pi-calendar-times text-2xl text-blue-500"></i>
                </div>

                <h3 class="mt-4 text-base font-semibold text-slate-800">
                  No leave history yet
                </h3>

                <p class="mt-2 max-w-xs text-sm leading-relaxed text-slate-500">
                  You haven't submitted any leave applications. Your leave
                  records will appear here.
                </p>

                <p-button
                  label="Apply for Leave"
                  icon="pi pi-plus"
                  routerLink="/leave/apply"
                  styleClass="mt-5 rounded-lg! bg-blue-700! border-blue-700!"
                />
              </div>
            }
          </div>

          <!-- Desktop Table -->
          <div class="hidden lg:block">
            <p-table
              [value]="requests"
              [paginator]="true"
              [rows]="10"
              [rowsPerPageOptions]="[10, 20, 50]"
              [showCurrentPageReport]="true"
              currentPageReportTemplate="Showing {first} to {last} of {totalRecords} requests"
              styleClass="p-datatable-sm leave-history-table"
              [tableStyle]="{ 'min-width': '900px' }"
            >
              <ng-template pTemplate="header">
                <tr>
                  <th
                    class="!bg-slate-50 !px-5 !py-4 !text-xs !font-semibold !uppercase !tracking-wider !text-slate-500"
                  >
                    Leave Type
                  </th>

                  <th
                    class="!bg-slate-50 !px-5 !py-4 !text-xs !font-semibold !uppercase !tracking-wider !text-slate-500"
                  >
                    Date Range
                  </th>

                  <th
                    class="!bg-slate-50 !px-5 !py-4 !text-xs !font-semibold !uppercase !tracking-wider !text-slate-500"
                  >
                    Duration
                  </th>

                  <th
                    class="!bg-slate-50 !px-5 !py-4 !text-xs !font-semibold !uppercase !tracking-wider !text-slate-500"
                  >
                    Status
                  </th>

                  <th
                    class="!w-[180px] !bg-slate-50 !px-5 !py-4 !text-xs !font-semibold !uppercase !tracking-wider !text-slate-500 !text-right"
                  >
                    Actions
                  </th>
                </tr>
              </ng-template>

              <ng-template pTemplate="body" let-row>
                <tr class="transition-colors hover:!bg-slate-50">
                  <!-- Leave Type -->
                  <td class="!px-5 !py-4">
                    <div class="font-semibold text-slate-800">
                      {{ row.leaveTypeName }}
                    </div>

                    <div class="mt-2 flex flex-wrap gap-1.5">
                      @if (row.isShortNoticeAnnual) {
                        <p-tag value="Short notice → Unpaid" severity="warn" />
                      } @else if (hasBalanceSplit(row)) {
                        <p-tag value="Balance split" severity="warn" />
                      } @else if (row.isUnpaid) {
                        <p-tag value="Unpaid" severity="secondary" />
                      }

                      @if (row.isEmergency) {
                        <p-tag value="Emergency" severity="danger" />
                      }
                    </div>
                  </td>

                  <!-- Date Range -->
                  <td class="!px-5 !py-4">
                    <div class="flex items-center gap-2 text-sm text-slate-700">
                      <i class="pi pi-calendar text-slate-400"></i>

                      <div>
                        <div>
                          {{ row.startDate | date: 'dd MMM yyyy' }}
                        </div>

                        <div class="mt-1 text-xs text-slate-400">
                          to {{ row.endDate | date: 'dd MMM yyyy' }}
                        </div>
                      </div>
                    </div>
                  </td>

                  <!-- Duration -->
                  <td class="!px-5 !py-4">
                    <div class="font-semibold text-slate-800">
                      {{ formatLeaveDays(row) }}
                    </div>

                    @if (hasBalanceSplit(row)) {
                      <div class="mt-2 space-y-1">
                        @for (
                          line of row.balanceAllocations!;
                          track line.leaveTypeId + line.sortOrder
                        ) {
                          <div class="text-xs text-slate-500">
                            {{ line.leaveTypeName }}
                            <span class="font-medium">
                              {{ formatDays(line.days) }}
                            </span>
                          </div>
                        }
                      </div>
                    }
                  </td>

                  <!-- Status -->
                  <td class="!px-5 !py-4">
                    <p-tag
                      [value]="statusLabel(row)"
                      [severity]="statusSeverity(row)"
                    />
                  </td>

                  <!-- Actions -->
                  <td class="!px-5 !py-4">
                    <div class="flex items-center justify-end gap-1">
                      @if (row.status === 'Pending') {
                        <p-button
                          icon="pi pi-pencil"
                          pTooltip="Edit leave request"
                          tooltipPosition="top"
                          severity="secondary"
                          [text]="true"
                          size="small"
                          [routerLink]="['/leave/apply', row.requestId]"
                        />
                      }

                      <p-button
                        icon="pi pi-eye"
                        pTooltip="View leave request"
                        tooltipPosition="top"
                        severity="info"
                        [text]="true"
                        size="small"
                        [routerLink]="['/leave', row.requestId]"
                      />
                    </div>
                  </td>
                </tr>
              </ng-template>

              <ng-template pTemplate="emptymessage">
                <tr>
                  <td colspan="5" class="!py-16">
                    <div
                      class="flex flex-col items-center justify-center text-center"
                    >
                      <div
                        class="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100"
                      >
                        <i
                          class="pi pi-calendar-times text-xl text-slate-400"
                        ></i>
                      </div>

                      <div class="mt-4 font-semibold text-slate-700">
                        No leave history yet
                      </div>

                      <p class="mt-1 text-sm text-slate-400">
                        Your leave applications will appear here.
                      </p>
                    </div>
                  </td>
                </tr>
              </ng-template>
            </p-table>
          </div>
        </div>

        <!-- Footer Note -->
        <div
          class="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3"
        >
          <i class="pi pi-info-circle mt-0.5 text-blue-600"></i>

          <p class="text-xs leading-relaxed text-blue-700">
            Only pending leave applications can be edited. To check the details
            or approval status of an application, select View Details.
          </p>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaveHistory implements OnInit, OnDestroy {
  private readonly leaveService = inject(LeaveRequestService);
  private readonly userService = inject(UserService);
  private readonly messageService = inject(MessageService);
  private readonly loadingService = inject(LoadingService);
  private readonly cdr = inject(ChangeDetectorRef);

  requests: LeaveRequestDto[] = [];

  get pendingCount(): number {
    return this.requests.filter((x) => x.status === 'Pending').length;
  }

  get approvedCount(): number {
    return this.requests.filter((x) => x.status === 'Approved').length;
  }

  get rejectedCount(): number {
    return this.requests.filter((x) => x.status === 'Rejected').length;
  }

  formatLeaveDays(row: LeaveRequestDto): string {
    return formatLeaveDurationLabel(row);
  }

  formatDays(value: number | null | undefined): string {
    return formatDaysAmount(value);
  }

  hasBalanceSplit(row: LeaveRequestDto): boolean {
    const n = row.balanceAllocations?.length ?? 0;

    if (row.isEmergency && n > 0) {
      return true;
    }

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
          this.requests = data || [];
          this.cdr.markForCheck();
        },

        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load leave history',
          });

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

  statusSeverity(
    row: LeaveRequestDto,
  ): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    switch (row.status) {
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
