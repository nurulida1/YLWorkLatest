import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { Subject, takeUntil, forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import {
  LeavePolicyDto,
  LeaveTenureBandDto,
  LeaveTypeDto,
} from '../../../models/Leave';
import { LeaveBalanceService } from '../../../services/leave-balance.service';
import { LeavePolicyService } from '../../../services/leave-policy.service';
import { LeaveTypeService } from '../../../services/leave-type.service';
import { LoadingService } from '../../../services/loading.service';
import { UserService } from '../../../services/userService.service';
import { UserDto } from '../../../models/User';

@Component({
  selector: 'app-leave-policy-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    TableModule,
    DialogModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    MultiSelectModule,
    TextareaModule,
  ],
  template: `
    <div class="w-full min-h-screen bg-[#f4f6f8] p-6 flex flex-col gap-5">
      <div class="flex items-center gap-1.5 text-sm text-gray-500">
        <a routerLink="/dashboard" class="hover:text-blue-600">Dashboard</a>
        <span>/</span>
        <span class="text-gray-700 font-semibold">Leave policy</span>
      </div>

      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div class="min-w-0">
            <h1 class="text-2xl font-bold text-gray-900 m-0">Leave policy</h1>
            <p class="text-sm text-gray-500 mt-1 m-0">
              Tenure bands for Annual and Medical leave, annual use-it-or-lose-it % (forfeit unused portion of that %),
              and replacement leave credits. Policy edits apply from the effective year / next calendar year.
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2 shrink-0">
            <p-button
              label="Grant replacement leave"
              icon="pi pi-gift"
              severity="secondary"
              [outlined]="true"
              (onClick)="openCreditDialog()"
            />
            <p-button
              label="Save policy"
              icon="pi pi-save"
              (onClick)="save()"
              [loading]="saving"
            />
          </div>
        </div>

        <div
          class="bg-white border border-gray-200 rounded-xl px-4 py-3 flex flex-col gap-2 md:flex-row md:items-center md:gap-4"
        >
          <div class="flex flex-wrap items-center gap-2 shrink-0">
            <label class="text-sm font-medium text-gray-700 whitespace-nowrap">Close year</label>
            <p-inputNumber
              [(ngModel)]="yearEndCloseYear"
              [useGrouping]="false"
              [min]="2000"
              [max]="2100"
              placeholder="Year"
              class="w-[6.5rem] shrink-0"
              styleClass="w-full"
              inputStyleClass="w-full"
            />
            <p-button
              label="Run year-end"
              icon="pi pi-calendar"
              severity="secondary"
              [outlined]="true"
              class="shrink-0"
              (onClick)="runYearEnd()"
              [loading]="runningYearEnd"
            />
          </div>
          <p class="text-xs text-gray-500 m-0 md:flex-1">
            Closes the selected year and builds next-year balances (with Annual carry). Chain tests: 2025, then 2026, etc.
          </p>
        </div>
      </div>

      @if (policy) {
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-white border border-gray-200 rounded-xl p-4">
            <label class="text-sm font-semibold text-gray-700 block mb-2">Effective from year</label>
            <p-inputNumber [(ngModel)]="policy.effectiveFromYear" [useGrouping]="false" class="w-full" />
            <p class="text-xs text-gray-500 mt-2 m-0">New balances for this year onward use these bands.</p>
          </div>
          <div class="bg-white border border-gray-200 rounded-xl p-4">
            <label class="text-sm font-semibold text-gray-700 block mb-2">Annual use-it-or-lose-it %</label>
            <p-inputNumber
              [(ngModel)]="policy.annualCarryForwardPercent"
              [min]="0"
              [max]="100"
              suffix=" %"
              class="w-full"
            />
            <p class="text-xs text-gray-500 mt-2 m-0">
              At year-end, forfeit = max(0, % × tenure − approved used). Carry = remaining − forfeit (can exceed the %).
            </p>
          </div>
        </div>

        <details class="bg-white border border-gray-200 rounded-xl text-sm text-gray-700 open:[&_summary_i]:rotate-180">
          <summary class="cursor-pointer list-none flex items-center justify-between gap-3 px-4 py-3 select-none [&::-webkit-details-marker]:hidden">
            <span class="font-medium text-gray-800">Carry examples</span>
            <i class="pi pi-chevron-down text-gray-400 text-xs transition-transform"></i>
          </summary>
          <div class="px-4 pb-4 pt-0 border-t border-gray-100">
            <p class="text-xs text-gray-500 m-0 mt-3 mb-2">Tenure 15, carry % = 50 → must use/lose 7.5</p>
            <ul class="m-0 pl-5 space-y-1 text-sm text-gray-700">
              <li>15 entitled, used 0 → carry 7.5 → next <strong>22.5</strong></li>
              <li>22.5 entitled, used 7.5 → carry 15 → next <strong>30</strong></li>
              <li>30 entitled, used 3 → carry 22.5 → next <strong>37.5</strong></li>
            </ul>
          </div>
        </details>

        <div class="bg-white border border-gray-200 rounded-xl p-4">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-sm font-semibold text-gray-800 m-0">Annual tenure bands</h2>
            <p-button label="Add band" size="small" [text]="true" (onClick)="addBand('Annual')" />
          </div>
          <p-table [value]="annualBands" styleClass="p-datatable-sm">
            <ng-template pTemplate="header">
              <tr>
                <th>Min years</th>
                <th>Max years (exclusive)</th>
                <th>Days / year</th>
                <th></th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-row let-i="rowIndex">
              <tr>
                <td><p-inputNumber [(ngModel)]="row.minYearsInclusive" [min]="0" /></td>
                <td>
                  <p-inputNumber [(ngModel)]="row.maxYearsExclusive" [min]="0" placeholder="Open" />
                </td>
                <td><p-inputNumber [(ngModel)]="row.daysPerYear" [min]="0" /></td>
                <td>
                  <p-button icon="pi pi-trash" severity="danger" [text]="true" (onClick)="removeBand('Annual', i)" />
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>

        <div class="bg-white border border-gray-200 rounded-xl p-4">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-sm font-semibold text-gray-800 m-0">Medical (MC) tenure bands</h2>
            <p-button label="Add band" size="small" [text]="true" (onClick)="addBand('Medical')" />
          </div>
          <p-table [value]="medicalBands" styleClass="p-datatable-sm">
            <ng-template pTemplate="header">
              <tr>
                <th>Min years</th>
                <th>Max years (exclusive)</th>
                <th>Days / year</th>
                <th></th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-row let-i="rowIndex">
              <tr>
                <td><p-inputNumber [(ngModel)]="row.minYearsInclusive" [min]="0" /></td>
                <td>
                  <p-inputNumber [(ngModel)]="row.maxYearsExclusive" [min]="0" placeholder="Open" />
                </td>
                <td><p-inputNumber [(ngModel)]="row.daysPerYear" [min]="0" /></td>
                <td>
                  <p-button icon="pi pi-trash" severity="danger" [text]="true" (onClick)="removeBand('Medical', i)" />
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      }

      <p-dialog
        [(visible)]="creditDialog"
        header="Grant replacement leave"
        [modal]="true"
        [style]="{ width: 'min(520px, 95vw)' }"
        [draggable]="false"
      >
        <div class="flex flex-col gap-3">
          <div>
            <label class="text-sm text-gray-600 block mb-1">Employees</label>
            <p-multiSelect
              class="w-full"
              appendTo="body"
              styleClass="w-full"
              [options]="employeeOptions"
              [(ngModel)]="creditEmployeeIds"
              optionLabel="label"
              optionValue="value"
              placeholder="Select employees"
              [filter]="true"
              [showToggleAll]="true"
              display="chip"
              selectedItemsLabel="{0} employees selected"
              [maxSelectedLabels]="3"
            />
            <p class="text-xs text-gray-500 mt-1 m-0">
              Use the header checkbox to select all. Same days/note apply to each selected employee.
            </p>
          </div>
          <div>
            <label class="text-sm text-gray-600 block mb-1">Replacement leave type</label>
            <p-select
              [options]="replacementTypes"
              [(ngModel)]="creditLeaveTypeId"
              optionLabel="name"
              optionValue="id"
              placeholder="Select type"
              class="w-full"
              appendTo="body"
            />
          </div>
          <div>
            <label class="text-sm text-gray-600 block mb-1">Days</label>
            <p-inputNumber [(ngModel)]="creditDays" [min]="0.5" [minFractionDigits]="0" [maxFractionDigits]="1" />
          </div>
          <div>
            <label class="text-sm text-gray-600 block mb-1">Note (optional)</label>
            <textarea pTextarea rows="2" class="w-full" [(ngModel)]="creditNote" placeholder="e.g. Worked CNY public holiday"></textarea>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <p-button label="Cancel" severity="secondary" [text]="true" (onClick)="creditDialog = false" />
          <p-button
            [label]="creditEmployeeIds.length > 1 ? 'Credit ' + creditEmployeeIds.length + ' employees' : 'Credit'"
            (onClick)="grantCredit()"
            [loading]="crediting"
          />
        </ng-template>
      </p-dialog>
    </div>
  `,
})
export class LeavePolicySettings implements OnInit, OnDestroy {
  private readonly policyService = inject(LeavePolicyService);
  private readonly leaveTypeService = inject(LeaveTypeService);
  private readonly balanceService = inject(LeaveBalanceService);
  private readonly userService = inject(UserService);
  private readonly messageService = inject(MessageService);
  private readonly loadingService = inject(LoadingService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  policy: LeavePolicyDto | null = null;
  annualBands: LeaveTenureBandDto[] = [];
  medicalBands: LeaveTenureBandDto[] = [];
  replacementTypes: LeaveTypeDto[] = [];
  employeeOptions: { label: string; value: string }[] = [];
  saving = false;
  runningYearEnd = false;
  /** Calendar year to close (creates balances for year+1). Default: previous year. */
  yearEndCloseYear = new Date().getFullYear() - 1;
  creditDialog = false;
  crediting = false;
  creditEmployeeIds: string[] = [];
  creditLeaveTypeId: string | null = null;
  creditDays = 1;
  creditNote = '';

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  addBand(kind: 'Annual' | 'Medical'): void {
    const band: LeaveTenureBandDto = {
      bandKind: kind,
      minYearsInclusive: 0,
      maxYearsExclusive: null,
      daysPerYear: 0,
    };
    if (kind === 'Annual') this.annualBands = [...this.annualBands, band];
    else this.medicalBands = [...this.medicalBands, band];
    this.cdr.markForCheck();
  }

  removeBand(kind: 'Annual' | 'Medical', index: number): void {
    if (kind === 'Annual') this.annualBands = this.annualBands.filter((_, i) => i !== index);
    else this.medicalBands = this.medicalBands.filter((_, i) => i !== index);
    this.cdr.markForCheck();
  }

  save(): void {
    if (!this.policy) return;
    this.saving = true;
    const tenureBands = [
      ...this.annualBands.map((b) => ({ ...b, bandKind: 'Annual' })),
      ...this.medicalBands.map((b) => ({ ...b, bandKind: 'Medical' })),
    ];
    this.policyService
      .upsert({
        effectiveFromYear: this.policy.effectiveFromYear,
        annualCarryForwardPercent: this.policy.annualCarryForwardPercent,
        tenureBands,
      })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (p) => {
          this.applyPolicy(p);
          this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Leave policy updated.' });
        },
        error: (e) =>
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: e.error?.message || 'Save failed',
          }),
      });
  }

  runYearEnd(): void {
    const year = this.yearEndCloseYear;
    if (!year || year < 2000) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Year required',
        detail: 'Enter the calendar year to close (e.g. 2025 creates 2026 balances).',
      });
      return;
    }
    this.runningYearEnd = true;
    this.balanceService
      .runYearEnd(year)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.runningYearEnd = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (res) => {
          if (res.rows === 0) {
            this.messageService.add({
              severity: 'info',
              summary: 'Already closed',
              detail: `Year ${res.closedYear} was already closed. Pick the next year (e.g. ${res.closedYear + 1}) to continue the chain.`,
            });
            return;
          }
          this.messageService.add({
            severity: 'success',
            summary: 'Year-end complete',
            detail: `Closed ${res.closedYear} → created/updated ${res.closedYear + 1} (${res.rows} balance rows).`,
          });
          this.yearEndCloseYear = res.closedYear + 1;
          this.cdr.markForCheck();
        },
        error: (e) =>
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: e.error?.message || 'Year-end failed',
          }),
      });
  }

  openCreditDialog(): void {
    this.creditEmployeeIds = [];
    this.creditDays = 1;
    this.creditNote = '';
    if (this.replacementTypes.length && !this.creditLeaveTypeId) {
      this.creditLeaveTypeId = this.replacementTypes[0].id;
    }
    this.creditDialog = true;
    this.cdr.markForCheck();
  }

  grantCredit(): void {
    if (!this.creditEmployeeIds.length || !this.creditLeaveTypeId || this.creditDays <= 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Missing fields',
        detail: 'Select at least one employee, leave type, and days.',
      });
      return;
    }
    this.crediting = true;
    const leaveTypeId = this.creditLeaveTypeId;
    const days = this.creditDays;
    const note = this.creditNote || undefined;
    const requests = this.creditEmployeeIds.map((employeeId) =>
      this.balanceService.credit({ employeeId, leaveTypeId, days, note }),
    );

    forkJoin(requests)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.crediting = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          const n = this.creditEmployeeIds.length;
          this.creditDialog = false;
          this.creditEmployeeIds = [];
          this.messageService.add({
            severity: 'success',
            summary: 'Credited',
            detail:
              n === 1
                ? 'Replacement leave added.'
                : `Replacement leave credited to ${n} employees.`,
          });
        },
        error: (e) =>
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: e.error?.message || 'Credit failed',
          }),
      });
  }

  private load(): void {
    this.loadingService.start();
    forkJoin({
      policy: this.policyService.get(),
      types: this.leaveTypeService.getAll().pipe(catchError(() => of([] as LeaveTypeDto[]))),
      users: this.userService
        .GetMany({
          Page: 1,
          PageSize: 500,
          OrderBy: 'FullName',
          Filter: null,
          Select: null,
          Includes: null,
        })
        .pipe(catchError(() => of({ data: [] as UserDto[], totalElements: 0 }))),
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loadingService.stop()),
      )
      .subscribe({
        next: ({ policy, types, users }) => {
          this.applyPolicy(policy);
          this.replacementTypes = types.filter((t) => t.policyKind === 'Replacement');
          if (this.replacementTypes.length && !this.creditLeaveTypeId) {
            this.creditLeaveTypeId = this.replacementTypes[0].id;
          }
          this.employeeOptions = (users.data ?? []).map((u: UserDto) => ({
            label: `${u.fullName || u.email} (${u.systemRole || ''})`,
            value: String(u.id),
          }));
          this.cdr.markForCheck();
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load leave policy' });
          this.cdr.markForCheck();
        },
      });
  }

  private applyPolicy(p: LeavePolicyDto): void {
    this.policy = p;
    this.annualBands = p.tenureBands.filter((b) => b.bandKind === 'Annual').map((b) => ({ ...b }));
    this.medicalBands = p.tenureBands.filter((b) => b.bandKind === 'Medical').map((b) => ({ ...b }));
  }
}
