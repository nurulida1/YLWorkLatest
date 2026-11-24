import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, Subject, takeUntil } from 'rxjs';

import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';

import { WorkOrderDto } from '../../../../models/WorkOrder';
import { WorkOrderService } from '../../../../services/WorkOrderService';
import { LoadingService } from '../../../../services/loading.service';
import { RouterLink } from '@angular/router';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-work-order',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    SelectModule,
    ButtonModule,
    TooltipModule,
    InputTextModule,
    RouterLink,
    DialogModule,
  ],
  template: `
    <div
      class="work-order-page min-h-0 w-full bg-slate-50/70 p-3 sm:p-4 lg:p-6"
    >
      <div class="work-order-container mx-auto w-full space-y-4">
        <!-- Header -->
        <div
          class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="flex items-center gap-3">
            <div>
              <h1
                class="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl"
              >
                Work Orders
              </h1>
              <p class="mt-1 text-slate-500">
                Manage and monitor your work orders.
              </p>
            </div>
          </div>

          <p-button
            label="Create Work Order"
            icon="pi pi-plus"
            severity="info"
            [routerLink]="'/work-order/form'"
            styleClass="w-full! justify-center! rounded-xl! border-none! bg-blue-600! px-5! py-2.5! font-semibold! shadow-sm! hover:bg-blue-700! sm:w-auto!"
          />
        </div>

        <!-- Summary -->
        <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div class="summary-card">
            <div class="summary-icon bg-blue-100 text-blue-700">
              <i class="pi pi-clipboard text-xl!"></i>
            </div>
            <div>
              <p class="summary-label">Total Work Orders</p>
              <p class="summary-value">{{ totalElements }}</p>
            </div>
          </div>

          <div class="summary-card">
            <div class="summary-icon bg-amber-100 text-amber-700">
              <i class="pi pi-folder-open text-xl!"></i>
            </div>
            <div>
              <p class="summary-label">Open</p>
              <p class="summary-value">{{ countByStatus('Open') }}</p>
            </div>
          </div>

          <div class="summary-card">
            <div class="summary-icon bg-indigo-100 text-indigo-700">
              <i class="pi pi-spinner text-xl!"></i>
            </div>
            <div>
              <p class="summary-label">In Progress</p>
              <p class="summary-value">{{ countByStatus('InProgress') }}</p>
            </div>
          </div>

          <div class="summary-card">
            <div class="summary-icon bg-green-100 text-green-700">
              <i class="pi pi-check-circle text-xl!"></i>
            </div>
            <div>
              <p class="summary-label">Completed</p>
              <p class="summary-value">{{ countByStatus('Completed') }}</p>
            </div>
          </div>
        </div>

        <!-- Main Card -->
        <div
          class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <!-- Search and Filters -->
          <div class="border-b border-slate-100 p-4 sm:p-5">
            <div class="mb-4">
              <h2 class="text-lg font-semibold text-slate-800">
                Work Order List
              </h2>
              <p class="mt-1 text-slate-500">
                View and manage all registered work orders.
              </p>
            </div>

            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <!-- Search -->
              <div class="relative">
                <i
                  class="pi pi-search absolute left-3 top-1/2 z-10 -translate-y-1/2 text-sm text-slate-400"
                ></i>

                <input
                  type="text"
                  pInputText
                  [(ngModel)]="search"
                  (keydown)="onKeyDown($event)"
                  placeholder="Search work orders..."
                  class="w-full! rounded-xl! border-slate-200! py-2.5! pl-10! pr-10!"
                />

                <button
                  *ngIf="search"
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  (click)="Search('')"
                  aria-label="Clear search"
                >
                  <i class="pi pi-times"></i>
                </button>
              </div>

              <!-- Status -->
              <p-select
                [(ngModel)]="status"
                (onChange)="applyFilters()"
                [options]="statusOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="All Statuses"
                [showClear]="true"
                styleClass="filter-select w-full!"
                [fluid]="true"
              />

              <!-- Priority -->
              <p-select
                [(ngModel)]="priority"
                (onChange)="applyFilters()"
                [options]="priorityOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="All Priorities"
                [showClear]="true"
                styleClass="filter-select w-full!"
                [fluid]="true"
              />

              <!-- Work Type -->
              <p-select
                [(ngModel)]="workType"
                (onChange)="applyFilters()"
                [options]="workTypeOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="All Work Types"
                [showClear]="true"
                styleClass="filter-select w-full!"
                [fluid]="true"
              />
            </div>

            <div class="mt-3 flex justify-end">
              <button
                type="button"
                class="text-sm font-medium text-slate-500 transition hover:text-blue-600"
                (click)="ResetTable()"
              >
                <i class="pi pi-filter-slash mr-1"></i>
                Clear filters
              </button>
            </div>
          </div>

          <!-- Table -->
          <div class="p-3 sm:p-4 lg:p-5">
            <div class="work-order-table-wrapper overflow-hidden">
              <p-table
                #fTable
                dataKey="id"
                [value]="workOrders"
                [lazy]="true"
                (onLazyLoad)="NextPage($event)"
                [loading]="loading"
                [paginator]="true"
                [rows]="pageSize"
                [first]="first"
                [totalRecords]="totalElements"
                [rowsPerPageOptions]="[10, 20, 30, 50]"
                [tableStyle]="{ 'min-width': '1050px' }"
                [showGridlines]="true"
                [scrollable]="true"
                scrollHeight="flex"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} work orders"
                [showCurrentPageReport]="true"
                paginatorStyleClass="work-order-paginator"
              >
                <!-- Header -->
                <ng-template #header>
                  <tr>
                    <th class="work-order-th min-w-[190px]!">Work Order</th>

                    <th class="work-order-th min-w-[180px]!">Project</th>

                    <th class="work-order-th min-w-[140px]!">Work Type</th>

                    <th class="work-order-th min-w-[160px]!">Assigned To</th>

                    <th class="work-order-th min-w-[110px]! text-center!">
                      Priority
                    </th>

                    <th class="work-order-th min-w-[160px]! text-center!">
                      Status
                    </th>

                    <th class="work-order-th min-w-[130px]! text-center!">
                      Due Date
                    </th>

                    <th class="work-order-th min-w-[90px]! text-center!">
                      Action
                    </th>
                  </tr>
                </ng-template>

                <!-- Body -->
                <ng-template #body let-data>
                  <tr class="work-order-row">
                    <!-- Work Order -->
                    <td>
                      <div class="flex flex-col gap-1">
                        <a
                          class="font-semibold text-base text-blue-700 cursor-pointer hover:underline"
                          [routerLink]="'/work-order/details'"
                          [queryParams]="{ id: data.id }"
                        >
                          {{ data.workOrderNo }}
                        </a>

                        <span
                          class="max-w-[230px] truncate text-sm text-slate-500"
                        >
                          {{ data.title }}
                        </span>
                      </div>
                    </td>

                    <!-- Project -->
                    <td>
                      <div class="flex flex-col gap-1">
                        <span
                          class="font-semibold text-base text-slate-700 cursor-pointer hover:underline"
                          [routerLink]="'/projects/details'"
                          [queryParams]="{ id: data.projectId }"
                        >
                          {{ data.projectCode || '-' }}
                        </span>

                        <span
                          class="max-w-[200px] truncate text-sm text-slate-500"
                        >
                          {{ data.projectTitle || '-' }}
                        </span>
                      </div>
                    </td>

                    <!-- Work Type -->
                    <td>
                      <span class="text-slate-600 text-base">
                        {{ formatLabel(data.workType) }}
                      </span>
                    </td>

                    <!-- Assigned To -->
                    <td>
                      <div class="flex items-center gap-2">
                        <div
                          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700"
                        >
                          {{ getInitials(data.assignedTo?.fullName) }}
                        </div>

                        <span class="text-base text-slate-600">
                          {{ data.assignedTo?.fullName || 'Unassigned' }}
                        </span>
                      </div>
                    </td>

                    <!-- Priority -->
                    <td class="text-center! text-sm!">
                      <span
                        class="priority-badge"
                        [ngClass]="getPriorityClass(data.priority)"
                      >
                        {{ data.priority }}
                      </span>
                    </td>

                    <!-- Status -->
                    <td class="text-center! text-sm!">
                      <span
                        class="status-badge"
                        [ngClass]="getStatusClass(data.status)"
                      >
                        {{ formatLabel(data.status) }}
                      </span>
                    </td>

                    <!-- Due Date -->
                    <td class="text-center!">
                      <span class="whitespace-nowrap text-sm text-slate-600">
                        {{
                          data.dueDate
                            ? (data.dueDate | date: 'dd MMM yyyy')
                            : '-'
                        }}
                      </span>
                    </td>

                    <!-- Action -->
                    <td class="text-center!">
                      <div class="flex flex-row items-center justify-center">
                        <p-button
                          icon="pi pi-eye"
                          severity="info"
                          [text]="true"
                          [rounded]="true"
                          pTooltip="View"
                          tooltipPosition="top"
                          [routerLink]="'/work-order/details'"
                          [queryParams]="{ id: data.id }"
                        />
                        <p-button
                          icon="pi pi-pencil"
                          severity="info"
                          [text]="true"
                          [rounded]="true"
                          pTooltip="Edit"
                          tooltipPosition="top"
                          [routerLink]="'/work-order/form'"
                          [queryParams]="{ id: data.id }"
                        /><p-button
                          icon="pi pi-trash"
                          severity="danger"
                          [text]="true"
                          [rounded]="true"
                          pTooltip="Delete"
                          tooltipPosition="top"
                          (onClick)="deleteWorkOrder(data)"
                          *ngIf="
                            data.status === 'Open' || data.status === 'Assigned'
                          "
                        />
                      </div>
                    </td>
                  </tr>
                </ng-template>

                <!-- Empty Message -->
                <ng-template #emptymessage>
                  <tr>
                    <td colspan="8">
                      <div
                        class="flex flex-col items-center justify-center gap-3 py-12 text-center"
                      >
                        <div
                          class="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100"
                        >
                          <i
                            class="pi pi-clipboard text-2xl text-slate-400"
                          ></i>
                        </div>

                        <div>
                          <p class="font-semibold text-slate-700">
                            No work orders found
                          </p>

                          <p class="mt-1 text-sm text-slate-500">
                            Try changing your search or filters.
                          </p>
                        </div>

                        <p-button
                          label="Clear Filters"
                          icon="pi pi-filter-slash"
                          size="small"
                          severity="secondary"
                          [outlined]="true"
                          (onClick)="ResetTable()"
                        />
                      </div>
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <p-dialog
      header="Delete Work Order"
      [(visible)]="deleteDialogVisible"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [closable]="true"
      [style]="{ width: '420px', maxWidth: '90vw' }"
    >
      <div class="flex items-start gap-3 py-2">
        <div
          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600"
        >
          <i class="pi pi-exclamation-triangle text-xl"></i>
        </div>

        <div>
          <p class="font-semibold text-slate-800">
            Are you sure you want to delete this work order?
          </p>

          <p class="mt-1 text-sm text-slate-500">
            Work Order:
            <span class="font-semibold text-slate-700">
              {{ selectedWorkOrder?.workOrderNo }}
            </span>
          </p>

          <p class="mt-2 text-sm text-red-500">This action cannot be undone.</p>
        </div>
      </div>

      <ng-template #footer>
        <div class="flex justify-end gap-2">
          <p-button
            label="Cancel"
            severity="secondary"
            [outlined]="true"
            (onClick)="closeDeleteDialog()"
          />

          <p-button
            label="Delete"
            icon="pi pi-trash"
            severity="danger"
            [loading]="deleting"
            [disabled]="deleting"
            (onClick)="confirmDeleteWorkOrder()"
          />
        </div>
      </ng-template>
    </p-dialog>
  `,
  styleUrl: './work-order.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkOrder implements OnInit, OnDestroy {
  @ViewChild('fTable') fTable?: Table;

  private readonly workOrderService = inject(WorkOrderService);
  private readonly loadingService = inject(LoadingService);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly ngUnsubscribe = new Subject<void>();

  workOrders: WorkOrderDto[] = [];

  loading: boolean = false;
  deleting: boolean = false;

  errorMessage: string = '';

  search: string = '';
  status: string | null = null;
  priority: string | null = null;
  workType: string | null = null;

  deleteDialogVisible: boolean = false;
  selectedWorkOrder: WorkOrderDto | null = null;

  page: number = 1;
  pageSize: number = 10;
  first: number = 0;
  totalElements: number = 0;

  statusOptions = [
    { label: 'Open', value: 'Open' },
    { label: 'Assigned', value: 'Assigned' },
    { label: 'In Progress', value: 'InProgress' },
    { label: 'On Hold', value: 'OnHold' },
    { label: 'Pending Verification', value: 'PendingVerification' },
    { label: 'Completed', value: 'Completed' },
    { label: 'Cancelled', value: 'Cancelled' },
  ];

  priorityOptions = [
    { label: 'Low', value: 'Low' },
    { label: 'Normal', value: 'Normal' },
    { label: 'High', value: 'High' },
    { label: 'Urgent', value: 'Urgent' },
  ];

  workTypeOptions = [
    { label: 'Installation', value: 'Installation' },
    { label: 'Maintenance', value: 'Maintenance' },
    { label: 'Troubleshooting', value: 'Troubleshooting' },
    { label: 'Integration', value: 'Integration' },
    { label: 'Configuration', value: 'Configuration' },
    { label: 'Inspection', value: 'Inspection' },
    { label: 'Support', value: 'Support' },
    { label: 'Testing', value: 'Testing' },
    { label: 'Others', value: 'Others' },
  ];

  ngOnInit(): void {}

  // =========================================================
  // LAZY LOADING
  // =========================================================

  NextPage(event: TableLazyLoadEvent): void {
    const rows = event.rows || this.pageSize;
    const first = event.first ?? 0;

    this.first = first;
    this.pageSize = rows;
    this.page = Math.floor(first / rows) + 1;

    this.GetData(event);
  }

  GetData(event?: TableLazyLoadEvent): void {
    this.loading = true;
    this.errorMessage = '';
    this.loadingService.start();

    // Backend accepts OrderBy, not Gridify sort syntax.
    const sortField = Array.isArray(event?.sortField)
      ? event.sortField[0]
      : event?.sortField;

    const sortOrder = event?.sortOrder;

    const orderBy =
      sortField && sortOrder
        ? `${sortField} ${sortOrder === 1 ? 'asc' : 'desc'}`
        : 'CreatedAt desc';

    this.workOrderService
      .GetMany({
        Page: this.page,
        PageSize: this.pageSize,
        Search: this.search.trim() || undefined,
        Status: this.status || undefined,
        Priority: this.priority || undefined,
        WorkType: this.workType || undefined,
        OrderBy: orderBy,
      })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.workOrders = res.data ?? [];
          this.totalElements = res.totalElements ?? 0;

          this.loading = false;
          this.loadingService.stop();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.workOrders = [];
          this.totalElements = 0;

          this.loading = false;
          this.loadingService.stop();

          this.errorMessage =
            err?.error?.detail ||
            err?.error?.message ||
            err?.message ||
            'Unable to load work orders. Please try again.';

          this.cdr.markForCheck();
        },
      });
  }

  // =========================================================
  // SEARCH AND FILTERS
  // =========================================================

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.Search(this.search);
    }
  }

  Search(value: string): void {
    this.search = value;
    this.ResetPageAndLoad();
  }

  applyFilters(): void {
    this.ResetPageAndLoad();
  }

  ResetPageAndLoad(): void {
    this.first = 0;
    this.page = 1;

    if (this.fTable) {
      this.fTable.first = 0;
    }

    this.GetData({
      first: 0,
      rows: this.pageSize,
    });
  }

  ResetTable(): void {
    this.search = '';
    this.status = null;
    this.priority = null;
    this.workType = null;

    this.first = 0;
    this.page = 1;

    if (this.fTable) {
      this.fTable.first = 0;
    }

    this.GetData({
      first: 0,
      rows: this.pageSize,
    });
  }

  // =========================================================
  // SUMMARY
  // =========================================================

  countByStatus(status: string): number {
    return this.workOrders.filter(
      (item) => item.status?.toLowerCase() === status.toLowerCase(),
    ).length;
  }

  // =========================================================
  // DISPLAY HELPERS
  // =========================================================

  formatLabel(value?: string): string {
    if (!value) return '-';

    return value.replace(/([a-z])([A-Z])/g, '$1 $2');
  }

  getInitials(name?: string): string {
    if (!name) return '?';

    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }

  getStatusClass(status?: string): string {
    switch (status?.toLowerCase()) {
      case 'open':
        return 'status-open';
      case 'assigned':
        return 'status-assigned';
      case 'inprogress':
        return 'status-progress';
      case 'onhold':
        return 'status-hold';
      case 'pendingverification':
        return 'status-pending';
      case 'completed':
        return 'status-completed';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-default';
    }
  }

  getPriorityClass(priority?: string): string {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return 'priority-urgent';
      case 'high':
        return 'priority-high';
      case 'normal':
        return 'priority-normal';
      case 'low':
        return 'priority-low';
      default:
        return 'priority-normal';
    }
  }

  // =========================================================
  // ACTIONS
  // =========================================================

  deleteWorkOrder(item: WorkOrderDto): void {
    this.selectedWorkOrder = item;
    this.deleteDialogVisible = true;
  }

  closeDeleteDialog(): void {
    if (this.deleting) return;

    this.deleteDialogVisible = false;
    this.selectedWorkOrder = null;
  }

  confirmDeleteWorkOrder(): void {
    if (!this.selectedWorkOrder || this.deleting) return;

    const item = this.selectedWorkOrder;

    this.deleting = true;
    this.loadingService.start();

    this.workOrderService
      .Delete(item.id)
      .pipe(
        takeUntil(this.ngUnsubscribe),
        finalize(() => {
          this.deleting = false;
          this.loadingService.stop();
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          // Remove deleted item
          this.workOrders = this.workOrders.filter(
            (workOrder) => workOrder.id !== item.id,
          );

          // Update total count
          this.totalElements = Math.max(0, this.totalElements - 1);

          // Move to previous page if current page is empty
          if (this.workOrders.length === 0 && this.page > 1) {
            this.page--;
            this.first = (this.page - 1) * this.pageSize;

            if (this.fTable) {
              this.fTable.first = this.first;
            }
          }

          this.deleteDialogVisible = false;
          this.selectedWorkOrder = null;

          this.cdr.markForCheck();
        },
        error: (err) => {
          this.errorMessage =
            err?.error?.detail ||
            err?.error?.message ||
            'Unable to delete work order. Please try again.';

          this.cdr.markForCheck();
        },
      });
  }
  // =========================================================
  // DESTROY
  // =========================================================

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
