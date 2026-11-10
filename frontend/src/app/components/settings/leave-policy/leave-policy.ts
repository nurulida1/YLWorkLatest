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
    <div
      class="leave-policy-page min-h-screen w-full bg-slate-50 p-3 sm:p-5 lg:p-6"
    >
      <div class="mx-auto flex w-full flex-col gap-5">
        <!-- Breadcrumb -->
        <div class="flex items-center gap-2 text-sm text-slate-400">
          <a
            routerLink="/dashboard"
            class="transition-colors hover:text-blue-700"
          >
            Dashboard
          </a>
          <i class="pi pi-angle-right text-xs"></i>
          <span class="font-semibold text-slate-700">Leave Policy</span>
        </div>

        <!-- Page heading -->
        <div
          class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"
        >
          <div class="min-w-0">
            <h1 class="text-2xl font-bold tracking-tight text-slate-800">
              Leave Policy
            </h1>
            <p class="mt-1 max-w-3xl text-sm leading-relaxed text-slate-500">
              Configure annual and medical leave entitlement by employee tenure,
              carry-forward rules, and replacement leave credits.
            </p>
          </div>

          <div
            class="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:flex xl:shrink-0"
          >
            <p-button
              label="Grant replacement leave"
              icon="pi pi-gift"
              severity="secondary"
              [outlined]="true"
              (onClick)="openCreditDialog()"
              styleClass="w-full"
            />
            <p-button
              label="Save policy"
              icon="pi pi-save"
              (onClick)="save()"
              [loading]="saving"
              styleClass="w-full leave-primary-button"
            />
          </div>
        </div>

        @if (policy) {
          <!-- Policy configuration -->
          <section class="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <!-- Effective year -->
            <div class="leave-setting-card">
              <div class="mb-3 flex items-center gap-3">
                <div class="leave-icon-box bg-blue-50 text-blue-700">
                  <i class="pi pi-calendar"></i>
                </div>
                <div>
                  <h2 class="text-sm font-semibold text-slate-800">
                    Effective from year
                  </h2>
                  <p class="mt-0.5 text-xs text-slate-500">
                    When this policy takes effect
                  </p>
                </div>
              </div>

              <p-inputNumber
                [(ngModel)]="policy.effectiveFromYear"
                [useGrouping]="false"
                [min]="2000"
                [max]="2100"
                class="w-full"
                styleClass="w-full"
                inputStyleClass="w-full"
              />

              <p class="mt-2 text-xs text-slate-500">
                New balances from this year onward use these tenure bands.
              </p>
            </div>

            <!-- Carry forward -->
            <div class="leave-setting-card">
              <div class="mb-3 flex items-center gap-3">
                <div class="leave-icon-box bg-violet-50 text-violet-700">
                  <i class="pi pi-percentage"></i>
                </div>
                <div>
                  <h2 class="text-sm font-semibold text-slate-800">
                    Annual use-it-or-lose-it
                  </h2>
                  <p class="mt-0.5 text-xs text-slate-500">
                    Annual carry-forward percentage
                  </p>
                </div>
              </div>

              <p-inputNumber
                [(ngModel)]="policy.annualCarryForwardPercent"
                [min]="0"
                [max]="100"
                suffix=" %"
                class="w-full"
                styleClass="w-full"
                inputStyleClass="w-full"
              />

              <p class="mt-2 text-xs leading-relaxed text-slate-500">
                The configured percentage determines the minimum leave to use or
                forfeit. Carry-forward is calculated from the remaining balance.
              </p>
            </div>
          </section>

          <!-- Year-end processing -->
          <section
            class="rounded-xl border border-slate-200 bg-white p-4 sm:p-5"
          >
            <div
              class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"
            >
              <div class="flex items-start gap-3">
                <div class="leave-icon-box shrink-0 bg-amber-50 text-amber-700">
                  <i class="pi pi-calendar-clock"></i>
                </div>
                <div class="min-w-0">
                  <h2 class="text-sm font-semibold text-slate-800">
                    Year-end processing
                  </h2>
                  <p class="mt-1 text-xs leading-relaxed text-slate-500">
                    Close a calendar year and create the following year's leave
                    balances, including eligible Annual leave carry-forward.
                  </p>
                </div>
              </div>

              <div
                class="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(120px,160px)_auto] xl:w-auto"
              >
                <p-inputNumber
                  [(ngModel)]="yearEndCloseYear"
                  [useGrouping]="false"
                  [min]="2000"
                  [max]="2100"
                  placeholder="Year"
                  styleClass="w-full"
                  inputStyleClass="w-full"
                />
                <p-button
                  label="Run year-end"
                  icon="pi pi-play"
                  severity="secondary"
                  [outlined]="true"
                  (onClick)="runYearEnd()"
                  [loading]="runningYearEnd"
                  styleClass="w-full"
                />
              </div>
            </div>

            <div
              class="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-amber-800"
            >
              <i class="pi pi-info-circle mt-0.5 shrink-0 text-sm"></i>
              <p class="text-xs leading-relaxed">
                Example: close 2025 to create 2026 balances. For consecutive
                years, process them in order.
              </p>
            </div>
          </section>

          <!-- Carry examples -->
          <details
            class="overflow-hidden rounded-xl border border-slate-200 bg-white text-sm"
          >
            <summary
              class="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 font-semibold text-slate-800 select-none"
            >
              <span class="flex items-center gap-2">
                <i class="pi pi-calculator text-blue-700"></i>
                Carry-forward examples
              </span>
              <i
                class="pi pi-chevron-down text-xs text-slate-400 transition-transform"
              ></i>
            </summary>

            <div class="border-t border-slate-100 px-4 py-4">
              <p class="mb-3 text-xs text-slate-500">
                Example: tenure entitlement of 15 days with a carry-forward
                percentage of 50%.
              </p>

              <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div class="rounded-lg bg-slate-50 p-3">
                  <p class="text-xs text-slate-500">Used: 0 days</p>
                  <p class="mt-1 text-lg font-bold text-slate-800">22.5 days</p>
                  <p class="text-xs text-slate-500">Next-year balance</p>
                </div>
                <div class="rounded-lg bg-slate-50 p-3">
                  <p class="text-xs text-slate-500">Used: 7.5 days</p>
                  <p class="mt-1 text-lg font-bold text-slate-800">30 days</p>
                  <p class="text-xs text-slate-500">Next-year balance</p>
                </div>
                <div class="rounded-lg bg-slate-50 p-3">
                  <p class="text-xs text-slate-500">Used: 3 days</p>
                  <p class="mt-1 text-lg font-bold text-slate-800">37.5 days</p>
                  <p class="text-xs text-slate-500">Next-year balance</p>
                </div>
              </div>
            </div>
          </details>

          <!-- Annual bands -->
          <section class="leave-section-card">
            <div
              class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div class="flex items-center gap-3">
                <div class="leave-icon-box bg-emerald-50 text-emerald-700">
                  <i class="pi pi-sun"></i>
                </div>
                <div>
                  <h2 class="text-sm font-semibold text-slate-800">
                    Annual leave tenure bands
                  </h2>
                  <p class="mt-0.5 text-xs text-slate-500">
                    Configure annual entitlement according to service years.
                  </p>
                </div>
              </div>

              <p-button
                label="Add band"
                icon="pi pi-plus"
                size="small"
                [outlined]="true"
                (onClick)="addBand('Annual')"
                styleClass="w-full sm:w-auto text-blue-700! border-blue-700!"
              />
            </div>

            <!-- Desktop table -->
            <div class="leave-band-desktop">
              <p-table
                [value]="annualBands"
                styleClass="p-datatable-sm leave-band-table"
              >
                <ng-template pTemplate="header">
                  <tr>
                    <th>Minimum years</th>
                    <th>Maximum years (exclusive)</th>
                    <th>Days per year</th>
                    <th class="w-16 text-center">Action</th>
                  </tr>
                </ng-template>

                <ng-template pTemplate="body" let-row let-i="rowIndex">
                  <tr>
                    <td>
                      <p-inputNumber
                        [(ngModel)]="row.minYearsInclusive"
                        [min]="0"
                        styleClass="w-full"
                        inputStyleClass="w-full"
                      />
                    </td>
                    <td>
                      <p-inputNumber
                        [(ngModel)]="row.maxYearsExclusive"
                        [min]="0"
                        placeholder="Open"
                        styleClass="w-full"
                        inputStyleClass="w-full"
                      />
                    </td>
                    <td>
                      <p-inputNumber
                        [(ngModel)]="row.daysPerYear"
                        [min]="0"
                        styleClass="w-full"
                        inputStyleClass="w-full"
                      />
                    </td>
                    <td class="text-center">
                      <p-button
                        icon="pi pi-trash"
                        severity="danger"
                        [text]="true"
                        [rounded]="true"
                        (onClick)="removeBand('Annual', i)"
                      />
                    </td>
                  </tr>
                </ng-template>

                <ng-template pTemplate="emptymessage">
                  <tr>
                    <td
                      colspan="4"
                      class="py-8 text-center text-sm text-slate-400"
                    >
                      No Annual leave bands configured. Add a band to get
                      started.
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            </div>

            <!-- Mobile cards -->
            <div class="leave-band-mobile space-y-3">
              <div
                *ngFor="let row of annualBands; let i = index"
                class="leave-band-card"
              >
                <div class="mb-3 flex items-center justify-between">
                  <span class="text-xs font-semibold text-slate-500">
                    Annual band {{ i + 1 }}
                  </span>
                  <p-button
                    icon="pi pi-trash"
                    severity="danger"
                    [text]="true"
                    [rounded]="true"
                    size="small"
                    (onClick)="removeBand('Annual', i)"
                  />
                </div>

                <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label class="leave-field-label">Minimum years</label>
                    <p-inputNumber
                      [(ngModel)]="row.minYearsInclusive"
                      [min]="0"
                      styleClass="w-full"
                      inputStyleClass="w-full"
                    />
                  </div>
                  <div>
                    <label class="leave-field-label">Maximum years</label>
                    <p-inputNumber
                      [(ngModel)]="row.maxYearsExclusive"
                      [min]="0"
                      placeholder="Open"
                      styleClass="w-full"
                      inputStyleClass="w-full"
                    />
                    <p class="mt-1 text-[10px] text-slate-400">
                      Exclusive; leave empty for no limit.
                    </p>
                  </div>
                  <div>
                    <label class="leave-field-label">Days per year</label>
                    <p-inputNumber
                      [(ngModel)]="row.daysPerYear"
                      [min]="0"
                      styleClass="w-full"
                      inputStyleClass="w-full"
                    />
                  </div>
                </div>
              </div>

              <div
                *ngIf="!annualBands.length"
                class="rounded-lg bg-slate-50 px-4 py-8 text-center"
              >
                <i class="pi pi-calendar text-2xl text-slate-300"></i>
                <p class="mt-2 text-sm font-medium text-slate-600">
                  No Annual leave bands
                </p>
                <p class="mt-1 text-xs text-slate-400">
                  Add a band to configure entitlement.
                </p>
              </div>
            </div>
          </section>

          <!-- Medical bands -->
          <section class="leave-section-card">
            <div
              class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div class="flex items-center gap-3">
                <div class="leave-icon-box bg-rose-50 text-rose-700">
                  <i class="pi pi-heart"></i>
                </div>
                <div>
                  <h2 class="text-sm font-semibold text-slate-800">
                    Medical leave tenure bands
                  </h2>
                  <p class="mt-0.5 text-xs text-slate-500">
                    Configure medical leave entitlement according to service
                    years.
                  </p>
                </div>
              </div>

              <p-button
                label="Add band"
                icon="pi pi-plus"
                size="small"
                [outlined]="true"
                (onClick)="addBand('Medical')"
                styleClass="w-full sm:w-auto text-blue-700! border-blue-700!"
              />
            </div>

            <!-- Desktop table -->
            <div class="leave-band-desktop">
              <p-table
                [value]="medicalBands"
                styleClass="p-datatable-sm leave-band-table"
              >
                <ng-template pTemplate="header">
                  <tr>
                    <th>Minimum years</th>
                    <th>Maximum years (exclusive)</th>
                    <th>Days per year</th>
                    <th class="w-16 text-center">Action</th>
                  </tr>
                </ng-template>

                <ng-template pTemplate="body" let-row let-i="rowIndex">
                  <tr>
                    <td>
                      <p-inputNumber
                        [(ngModel)]="row.minYearsInclusive"
                        [min]="0"
                        styleClass="w-full"
                        inputStyleClass="w-full"
                      />
                    </td>
                    <td>
                      <p-inputNumber
                        [(ngModel)]="row.maxYearsExclusive"
                        [min]="0"
                        placeholder="Open"
                        styleClass="w-full"
                        inputStyleClass="w-full"
                      />
                    </td>
                    <td>
                      <p-inputNumber
                        [(ngModel)]="row.daysPerYear"
                        [min]="0"
                        styleClass="w-full"
                        inputStyleClass="w-full"
                      />
                    </td>
                    <td class="text-center">
                      <p-button
                        icon="pi pi-trash"
                        severity="danger"
                        [text]="true"
                        [rounded]="true"
                        (onClick)="removeBand('Medical', i)"
                      />
                    </td>
                  </tr>
                </ng-template>

                <ng-template pTemplate="emptymessage">
                  <tr>
                    <td
                      colspan="4"
                      class="py-8 text-center text-sm text-slate-400"
                    >
                      No Medical leave bands configured. Add a band to get
                      started.
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            </div>

            <!-- Mobile cards -->
            <div class="leave-band-mobile space-y-3">
              <div
                *ngFor="let row of medicalBands; let i = index"
                class="leave-band-card"
              >
                <div class="mb-3 flex items-center justify-between">
                  <span class="text-xs font-semibold text-slate-500">
                    Medical band {{ i + 1 }}
                  </span>
                  <p-button
                    icon="pi pi-trash"
                    severity="danger"
                    [text]="true"
                    [rounded]="true"
                    size="small"
                    (onClick)="removeBand('Medical', i)"
                  />
                </div>

                <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label class="leave-field-label">Minimum years</label>
                    <p-inputNumber
                      [(ngModel)]="row.minYearsInclusive"
                      [min]="0"
                      styleClass="w-full"
                      inputStyleClass="w-full"
                    />
                  </div>
                  <div>
                    <label class="leave-field-label">Maximum years</label>
                    <p-inputNumber
                      [(ngModel)]="row.maxYearsExclusive"
                      [min]="0"
                      placeholder="Open"
                      styleClass="w-full"
                      inputStyleClass="w-full"
                    />
                    <p class="mt-1 text-[10px] text-slate-400">
                      Exclusive; leave empty for no limit.
                    </p>
                  </div>
                  <div>
                    <label class="leave-field-label">Days per year</label>
                    <p-inputNumber
                      [(ngModel)]="row.daysPerYear"
                      [min]="0"
                      styleClass="w-full"
                      inputStyleClass="w-full"
                    />
                  </div>
                </div>
              </div>

              <div
                *ngIf="!medicalBands.length"
                class="rounded-lg bg-slate-50 px-4 py-8 text-center"
              >
                <i class="pi pi-heart text-2xl text-slate-300"></i>
                <p class="mt-2 text-sm font-medium text-slate-600">
                  No Medical leave bands
                </p>
                <p class="mt-1 text-xs text-slate-400">
                  Add a band to configure entitlement.
                </p>
              </div>
            </div>
          </section>
        }
      </div>

      <!-- Replacement leave dialog -->
      <p-dialog
        [(visible)]="creditDialog"
        [modal]="true"
        [draggable]="false"
        [resizable]="false"
        [style]="{ width: '520px', maxWidth: '95vw' }"
        [breakpoints]="{ '640px': '95vw' }"
        appendTo="body"
        styleClass="leave-credit-dialog"
      >
        <ng-template pTemplate="header">
          <div class="flex min-w-0 items-center gap-3">
            <div class="leave-icon-box shrink-0 bg-violet-50 text-violet-700">
              <i class="pi pi-gift"></i>
            </div>
            <div class="min-w-0">
              <h2 class="text-base font-bold text-slate-800">
                Grant replacement leave
              </h2>
              <p class="mt-0.5 text-xs text-slate-500">
                Credit leave days to selected employees.
              </p>
            </div>
          </div>
        </ng-template>

        <div class="flex flex-col gap-4">
          <div>
            <label class="leave-field-label">Employees</label>
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
            <p class="mt-1 text-xs text-slate-400">
              Select one or more employees. The same days and note will apply to
              everyone selected.
            </p>
          </div>

          <div>
            <label class="leave-field-label">Replacement leave type</label>
            <p-select
              [options]="replacementTypes"
              [(ngModel)]="creditLeaveTypeId"
              optionLabel="name"
              optionValue="id"
              placeholder="Select type"
              class="w-full"
              styleClass="w-full"
              appendTo="body"
            />
          </div>

          <div>
            <label class="leave-field-label">Days</label>
            <p-inputNumber
              [(ngModel)]="creditDays"
              [min]="0.5"
              [minFractionDigits]="0"
              [maxFractionDigits]="1"
              styleClass="w-full"
              inputStyleClass="w-full"
            />
          </div>

          <div>
            <label class="leave-field-label">Note (optional)</label>
            <textarea
              pTextarea
              rows="3"
              class="w-full"
              [(ngModel)]="creditNote"
              placeholder="e.g. Worked on a public holiday"
            ></textarea>
          </div>

          <div
            class="rounded-lg bg-blue-50 p-3 text-xs leading-relaxed text-blue-800"
          >
            <i class="pi pi-info-circle mr-1"></i>
            This will credit
            <strong>{{ creditEmployeeIds.length }}</strong>
            employee(s) with
            <strong>{{ creditDays }}</strong>
            day(s) each.
          </div>
        </div>

        <ng-template pTemplate="footer">
          <div
            class="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end"
          >
            <p-button
              label="Cancel"
              severity="secondary"
              [outlined]="true"
              (onClick)="creditDialog = false"
              styleClass="w-full sm:w-auto"
            />
            <p-button
              [label]="
                creditEmployeeIds.length > 1
                  ? 'Credit ' + creditEmployeeIds.length + ' employees'
                  : 'Credit leave'
              "
              icon="pi pi-gift"
              (onClick)="grantCredit()"
              [loading]="crediting"
              [disabled]="crediting"
              styleClass="w-full sm:w-auto bg-purple-700! hover:bg-purple-500! border-none!"
            />
          </div>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styleUrl: './leave-policy.less',
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
    if (kind === 'Annual')
      this.annualBands = this.annualBands.filter((_, i) => i !== index);
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
          this.messageService.add({
            severity: 'success',
            summary: 'Saved',
            detail: 'Leave policy updated.',
          });
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
        detail:
          'Enter the calendar year to close (e.g. 2025 creates 2026 balances).',
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
    if (
      !this.creditEmployeeIds.length ||
      !this.creditLeaveTypeId ||
      this.creditDays <= 0
    ) {
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
      types: this.leaveTypeService
        .getAll()
        .pipe(catchError(() => of([] as LeaveTypeDto[]))),
      users: this.userService
        .GetMany({
          Page: 1,
          PageSize: 500,
          OrderBy: 'FullName',
          Filter: null,
          Select: null,
          Includes: null,
        })
        .pipe(
          catchError(() => of({ data: [] as UserDto[], totalElements: 0 })),
        ),
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loadingService.stop()),
      )
      .subscribe({
        next: ({ policy, types, users }) => {
          this.applyPolicy(policy);
          this.replacementTypes = types.filter(
            (t) => t.policyKind === 'Replacement',
          );
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
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load leave policy',
          });
          this.cdr.markForCheck();
        },
      });
  }

  private applyPolicy(p: LeavePolicyDto): void {
    this.policy = p;
    this.annualBands = p.tenureBands
      .filter((b) => b.bandKind === 'Annual')
      .map((b) => ({ ...b }));
    this.medicalBands = p.tenureBands
      .filter((b) => b.bandKind === 'Medical')
      .map((b) => ({ ...b }));
  }
}
