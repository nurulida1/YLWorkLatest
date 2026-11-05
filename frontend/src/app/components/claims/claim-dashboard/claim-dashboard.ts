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
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { finalize } from 'rxjs';
import { CLAIM_TYPE_LABELS, ClaimRequestDto } from '../../../models/Claim';
import { ClaimRequestService } from '../../../services/claim-request.service';
import { LoadingService } from '../../../services/loading.service';

@Component({
  selector: 'app-claim-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    TableModule,
    TagModule,
  ],
  template: `
    <div
      class="claim-page min-h-screen w-full bg-slate-50 p-4 sm:p-6 lg:p-8 flex flex-col gap-6"
    >
      <!-- Header -->
      <div
        class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <div class="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <a routerLink="/dashboard" class="hover:text-blue-600">
              Dashboard
            </a>
            <i class="pi pi-angle-right"></i>
            <span class="font-medium text-slate-600">Claims</span>
          </div>

          <h1
            class="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 m-0"
          >
            Claims
          </h1>

          <p class="text-sm text-slate-500 mt-1 m-0">
            View and manage all your submitted claims.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <p-button
            label="Approvals"
            icon="pi pi-check-circle"
            severity="secondary"
            [outlined]="true"
            routerLink="/claims/approvals"
            styleClass="claim-action-secondary"
          />

          <p-button
            label="Apply claim"
            icon="pi pi-plus"
            routerLink="/claims/apply"
            styleClass="claim-action-primary"
          />
        </div>
      </div>

      <!-- Claims content -->
      <div class="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <!-- Table heading -->
        <div
          class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-5 border-b border-slate-100"
        >
          <div>
            <h2 class="text-base font-bold text-slate-800 m-0">All claims</h2>
            <p class="text-xs text-slate-400 mt-1 m-0">
              Browse your complete claim submission history.
            </p>
          </div>

          <span
            class="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full w-fit"
          >
            {{ filteredClaims.length }} record(s)
          </span>
        </div>

        <!-- Filters -->
        <div class="p-5 border-b border-slate-100">
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <!-- Search -->
            <div class="xl:col-span-2">
              <label class="claim-filter-label" for="claim-search">
                Search claims
              </label>

              <div class="claim-search-box">
                <i class="pi pi-search text-slate-400"></i>
                <input
                  id="claim-search"
                  type="text"
                  [(ngModel)]="searchTerm"
                  placeholder="Search claim type, remarks or destination..."
                  class="claim-search-input"
                />
                @if (searchTerm) {
                  <button
                    type="button"
                    class="text-slate-400 hover:text-slate-700"
                    (click)="searchTerm = ''"
                    aria-label="Clear search"
                  >
                    <i class="pi pi-times"></i>
                  </button>
                }
              </div>
            </div>

            <!-- Status filter -->
            <div>
              <label class="claim-filter-label" for="claim-status">
                Status
              </label>
              <select
                id="claim-status"
                [(ngModel)]="selectedStatus"
                class="claim-filter-select"
              >
                <option value="All">All statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <!-- Claim type filter -->
            <div>
              <label class="claim-filter-label" for="claim-type">
                Claim type
              </label>
              <select
                id="claim-type"
                [(ngModel)]="selectedClaimType"
                class="claim-filter-select"
              >
                <option value="All">All claim types</option>
                @for (type of claimTypes; track type.value) {
                  <option [value]="type.value">
                    {{ type.label }}
                  </option>
                }
              </select>
            </div>
          </div>

          <div class="flex justify-end mt-3">
            <button
              type="button"
              class="claim-reset-button"
              (click)="clearFilters()"
            >
              <i class="pi pi-filter-slash"></i>
              Clear filters
            </button>
          </div>
        </div>

        <!-- Table -->
        <div class="claim-table-wrapper">
          <p-table
            [value]="filteredClaims"
            [paginator]="true"
            [rows]="10"
            [rowsPerPageOptions]="[10, 25, 50]"
            [showCurrentPageReport]="true"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} claims"
            [rowHover]="true"
            responsiveLayout="scroll"
            styleClass="claim-table"
            paginatorDropdownAppendTo="body"
          >
            <ng-template pTemplate="header">
              <tr>
                <th>Claim type</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Submitted date</th>
                <th>Remarks</th>
                <th class="text-right">Action</th>
              </tr>
            </ng-template>

            <ng-template pTemplate="body" let-row>
              <tr>
                <!-- Claim type -->
                <td>
                  <div class="flex items-center gap-3 min-w-36">
                    <div class="claim-type-icon">
                      <i class="pi pi-file text-slate-500"></i>
                    </div>
                    <span class="font-semibold text-slate-700">
                      {{ label(row.claimType) }}
                    </span>
                  </div>
                </td>

                <!-- Amount -->
                <td>
                  <span
                    class="font-semibold text-slate-800 tabular-nums whitespace-nowrap"
                  >
                    RM {{ row.totalAmount | number: '1.2-2' }}
                  </span>
                </td>

                <!-- Status -->
                <td>
                  <p-tag
                    [value]="row.status"
                    [severity]="severity(row.status)"
                  />
                </td>

                <!-- Submitted date -->
                <td>
                  <span class="text-sm text-slate-500 whitespace-nowrap">
                    {{ row.submittedAt | date: 'dd MMM yyyy' }}
                  </span>
                </td>

                <!-- Remarks -->
                <td>
                  <span
                    class="text-sm text-slate-500 claim-remarks"
                    [title]="row.remarks || '-'"
                  >
                    {{ row.remarks || '-' }}
                  </span>
                </td>

                <!-- Action -->
                <td class="text-right">
                  <a
                    class="claim-view-link"
                    [routerLink]="['/claims', row.requestId]"
                  >
                    View details
                    <i class="pi pi-arrow-up-right text-xs"></i>
                  </a>
                </td>
              </tr>
            </ng-template>

            <!-- Empty table -->
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="6">
                  <div
                    class="flex flex-col items-center justify-center text-center py-14"
                  >
                    <div
                      class="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4"
                    >
                      <i class="pi pi-inbox text-2xl text-slate-400"></i>
                    </div>

                    @if (claims.length === 0) {
                      <h3 class="text-sm font-semibold text-slate-700 m-0">
                        No claims submitted yet
                      </h3>
                      <p class="text-xs text-slate-400 mt-2 mb-4">
                        Your submitted claims will appear here.
                      </p>
                      <p-button
                        label="Submit your first claim"
                        icon="pi pi-plus"
                        size="small"
                        routerLink="/claims/apply"
                        styleClass="claim-action-primary"
                      />
                    } @else {
                      <h3 class="text-sm font-semibold text-slate-700 m-0">
                        No matching claims
                      </h3>
                      <p class="text-xs text-slate-400 mt-2 mb-4">
                        Try changing your search or filter criteria.
                      </p>
                      <button
                        type="button"
                        class="claim-reset-button"
                        (click)="clearFilters()"
                      >
                        Clear filters
                      </button>
                    }
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      </div>
    </div>
  `,
  styleUrl: './claim-dashboard.less',
})
export class ClaimDashboard implements OnInit {
  private readonly api = inject(ClaimRequestService);
  private readonly loading = inject(LoadingService);
  private readonly cdr = inject(ChangeDetectorRef);

  claims: ClaimRequestDto[] = [];

  searchTerm = '';
  selectedStatus = 'All';
  selectedClaimType = 'All';

  get filteredClaims(): ClaimRequestDto[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.claims.filter((claim) => {
      const matchesSearch =
        !search ||
        [
          this.label(claim.claimType),
          claim.status,
          claim.remarks,
          claim.destination,
          claim.totalAmount.toString(),
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));

      const matchesStatus =
        this.selectedStatus === 'All' ||
        claim.status.toLowerCase() === this.selectedStatus.toLowerCase();

      const matchesType =
        this.selectedClaimType === 'All' ||
        claim.claimType === this.selectedClaimType;

      return matchesSearch && matchesStatus && matchesType;
    });
  }

  get claimTypes(): { value: string; label: string }[] {
    return [...new Set(this.claims.map((claim) => claim.claimType))]
      .sort()
      .map((value) => ({
        value,
        label: this.label(value),
      }));
  }

  ngOnInit(): void {
    this.loadClaims();
  }

  private loadClaims(): void {
    this.loading.start();

    this.api
      .getAll()
      .pipe(finalize(() => this.loading.stop()))
      .subscribe({
        next: (records) => {
          this.claims = [...(records ?? [])].sort(
            (a, b) =>
              new Date(b.submittedAt).getTime() -
              new Date(a.submittedAt).getTime(),
          );

          this.cdr.markForCheck();
        },
        error: () => {
          this.claims = [];
          this.cdr.markForCheck();
        },
      });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = 'All';
    this.selectedClaimType = 'All';
  }

  label(type: string): string {
    return CLAIM_TYPE_LABELS[type] ?? type;
  }

  severity(
    status: string,
  ):
    | 'success'
    | 'warn'
    | 'danger'
    | 'secondary'
    | 'info'
    | 'contrast'
    | undefined {
    switch (status) {
      case 'Approved':
        return 'success';
      case 'Pending':
        return 'warn';
      case 'Rejected':
        return 'danger';
      case 'Cancelled':
        return 'secondary';
      default:
        return 'secondary';
    }
  }
}
