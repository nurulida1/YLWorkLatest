import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { finalize } from 'rxjs';
import { CLAIM_TYPE_LABELS, ClaimRequestDto } from '../../../models/Claim';
import { ClaimRequestService } from '../../../services/claim-request.service';
import { LoadingService } from '../../../services/loading.service';
import { UserService } from '../../../services/userService.service';

@Component({
  selector: 'app-claim-history',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, ButtonModule, TableModule, TagModule],
  template: `
    <div class="w-full min-h-screen bg-[#f4f6f8] p-6 flex flex-col gap-5">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold m-0">Claim history</h1>
          <p class="text-sm text-gray-500 mt-1 m-0">Your submitted claims</p>
        </div>
        <p-button label="Apply claim" icon="pi pi-plus" routerLink="/claims/apply" />
      </div>

      <div class="bg-white rounded-lg shadow-sm p-5">
        <p-table [value]="rows" [paginator]="true" [rows]="10">
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
              <td><p-tag [value]="row.status" [severity]="severity(row.status)" /></td>
              <td>{{ row.submittedAt | date: 'dd MMM yyyy HH:mm' }}</td>
              <td>
                <div class="flex items-center gap-2">
                  <a class="text-blue-600 text-sm" [routerLink]="['/claims', row.requestId]">View</a>
                  @if (row.status === 'Pending') {
                    <a
                      class="text-blue-600 text-sm"
                      [routerLink]="['/claims/apply', row.requestId]"
                      >Edit</a
                    >
                  }
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="5" class="text-center text-gray-500 py-6">No claims found.</td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `,
})
export class ClaimHistory implements OnInit {
  private readonly api = inject(ClaimRequestService);
  private readonly users = inject(UserService);
  private readonly loading = inject(LoadingService);
  private readonly cdr = inject(ChangeDetectorRef);

  rows: ClaimRequestDto[] = [];

  ngOnInit(): void {
    const userId = this.users.currentUser?.userId;
    this.loading.start();
    this.api
      .getAll(userId)
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
}
