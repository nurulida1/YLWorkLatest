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
import { DatePickerModule } from 'primeng/datepicker';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { finalize } from 'rxjs';
import {
  CLAIM_TYPE_LABELS,
  ClaimDashboardDto,
  ClaimRequestDto,
} from '../../../models/Claim';
import { ClaimRequestService } from '../../../services/claim-request.service';
import { LoadingService } from '../../../services/loading.service';

interface ClaimMonthGroup {
  key: string;
  label: string;
  claims: ClaimRequestDto[];
  approvedTotal: number;
  pendingTotal: number;
  approvedCount: number;
  pendingCount: number;
}

@Component({
  selector: 'app-claim-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    DatePickerModule,
    TableModule,
    TagModule,
  ],
  template: `
    <div class="w-full min-h-screen bg-[#f4f6f8] p-6 flex flex-col gap-5">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 m-0">Claims</h1>
          <p class="text-sm text-gray-500 mt-1 m-0">
            Submit and track reimbursements, overtime, and outstation claims.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <p-button label="Apply claim" icon="pi pi-plus" routerLink="/claims/apply" />
          <p-button
            label="Approvals"
            icon="pi pi-check"
            severity="secondary"
            [outlined]="true"
            routerLink="/claims/approvals"
          />
          <p-button
            label="History"
            icon="pi pi-history"
            severity="secondary"
            [outlined]="true"
            routerLink="/claims/history"
          />
        </div>
      </div>

      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-600 whitespace-nowrap">Summary for</label>
          <p-datepicker
            [(ngModel)]="selectedMonth"
            view="month"
            dateFormat="MM yy"
            [showIcon]="true"
            appendTo="body"
            (ngModelChange)="onMonthChange()"
          />
        </div>
        <span class="text-sm text-gray-500">
          Recent claims grouped by submission month (up to 10)
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="bg-white rounded-lg shadow-sm p-5 flex flex-col gap-1">
          <div class="font-bold text-green-600 text-2xl">
            RM {{ dash?.approvedTotal ?? 0 | number: '1.2-2' }}
          </div>
          <span class="text-gray-500 text-sm"
            >Approved in {{ selectedMonthLabel }} ({{ dash?.approvedCount ?? 0 }})</span
          >
        </div>
        <div class="bg-white rounded-lg shadow-sm p-5 flex flex-col gap-1">
          <div class="font-bold text-yellow-600 text-2xl">
            RM {{ dash?.pendingTotal ?? 0 | number: '1.2-2' }}
          </div>
          <span class="text-gray-500 text-sm"
            >Pending in {{ selectedMonthLabel }} ({{ dash?.pendingCount ?? 0 }})</span
          >
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm p-5 flex flex-col gap-6">
        <h2 class="text-lg font-semibold m-0">Recent claims</h2>

        @if (!monthGroups.length) {
          <p class="text-center text-gray-500 py-6 m-0">No claims yet.</p>
        }

        @for (group of monthGroups; track group.key) {
          <div>
            <div
              class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 pb-2 border-b"
            >
              <h3 class="text-base font-semibold m-0">{{ group.label }}</h3>
              <div class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                <span>
                  Approved:
                  <span class="font-medium text-green-600"
                    >RM {{ group.approvedTotal | number: '1.2-2' }} ({{ group.approvedCount }})</span
                  >
                </span>
                <span>
                  Pending:
                  <span class="font-medium text-yellow-600"
                    >RM {{ group.pendingTotal | number: '1.2-2' }} ({{ group.pendingCount }})</span
                  >
                </span>
              </div>
            </div>

            <p-table [value]="group.claims">
              <ng-template pTemplate="header">
                <tr>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th></th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-row>
                <tr>
                  <td>{{ label(row.claimType) }}</td>
                  <td>RM {{ row.totalAmount | number: '1.2-2' }}</td>
                  <td>
                    <p-tag [value]="row.status" [severity]="severity(row.status)" />
                  </td>
                  <td>{{ row.submittedAt | date: 'dd MMM yyyy' }}</td>
                  <td>
                    <a
                      class="text-blue-600 hover:underline text-sm"
                      [routerLink]="['/claims', row.requestId]"
                      >View</a
                    >
                  </td>
                </tr>
              </ng-template>
            </p-table>
          </div>
        }
      </div>
    </div>
  `,
})
export class ClaimDashboard implements OnInit {
  private readonly api = inject(ClaimRequestService);
  private readonly loading = inject(LoadingService);
  private readonly cdr = inject(ChangeDetectorRef);

  dash: ClaimDashboardDto | null = null;
  monthGroups: ClaimMonthGroup[] = [];
  selectedMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  get selectedMonthLabel(): string {
    return this.selectedMonth.toLocaleDateString('en-GB', {
      month: 'long',
      year: 'numeric',
    });
  }

  ngOnInit(): void {
    this.loadDashboard();
  }

  onMonthChange(): void {
    if (!this.selectedMonth) return;
    this.selectedMonth = new Date(
      this.selectedMonth.getFullYear(),
      this.selectedMonth.getMonth(),
      1,
    );
    this.loadDashboard();
  }

  private loadDashboard(): void {
    const year = this.selectedMonth.getFullYear();
    const month = this.selectedMonth.getMonth() + 1;

    this.loading.start();
    this.api
      .getDashboard(year, month)
      .pipe(finalize(() => this.loading.stop()))
      .subscribe({
        next: (d) => {
          this.dash = d;
          this.monthGroups = this.groupByMonth(d.recent ?? []);
          this.cdr.markForCheck();
        },
        error: () => this.cdr.markForCheck(),
      });
  }

  private groupByMonth(claims: ClaimRequestDto[]): ClaimMonthGroup[] {
    const map = new Map<string, ClaimRequestDto[]>();

    for (const claim of claims) {
      const date = new Date(claim.submittedAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const bucket = map.get(key) ?? [];
      bucket.push(claim);
      map.set(key, bucket);
    }

    return [...map.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, items]) => {
        const [year, month] = key.split('-').map(Number);
        const label = new Date(year, month - 1, 1).toLocaleDateString('en-GB', {
          month: 'long',
          year: 'numeric',
        });
        const approved = items.filter((c) => c.status === 'Approved');
        const pending = items.filter((c) => c.status === 'Pending');

        return {
          key,
          label,
          claims: items,
          approvedTotal: approved.reduce((sum, c) => sum + c.totalAmount, 0),
          pendingTotal: pending.reduce((sum, c) => sum + c.totalAmount, 0),
          approvedCount: approved.length,
          pendingCount: pending.length,
        };
      });
  }

  label(type: string): string {
    return CLAIM_TYPE_LABELS[type] ?? type;
  }

  severity(
    status: string,
  ): 'success' | 'warn' | 'danger' | 'secondary' | 'info' | 'contrast' | undefined {
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
}
