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
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { Subject, takeUntil } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LeaveTypeDto, UpsertLeaveTypeDto } from '../../../models/Leave';
import { LeaveTypeService } from '../../../services/leave-type.service';
import { LoadingService } from '../../../services/loading.service';

const POLICY_KINDS = [
  { label: 'Fixed days', value: 'Fixed' },
  { label: 'Annual (tenure + carry)', value: 'AnnualTenure' },
  { label: 'Medical (tenure)', value: 'MedicalTenure' },
  { label: 'Replacement (credited)', value: 'Replacement' },
];

const GENDER_OPTIONS = [
  { label: 'All employees', value: 'All' },
  { label: 'Male only', value: 'Male' },
  { label: 'Female only', value: 'Female' },
];

const PROTECTED_POLICY_KINDS = new Set(['AnnualTenure', 'MedicalTenure']);

@Component({
  selector: 'app-leave-types-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    TableModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    CheckboxModule,
    TextareaModule,
    TooltipModule,
  ],
  template: `
    <div class="min-h-screen w-full bg-slate-50 p-3 sm:p-5 lg:p-6">
      <!-- Breadcrumb -->
      <div
        class="mb-4 flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-500"
      >
        <a
          routerLink="/dashboard"
          class="transition-colors hover:text-blue-600"
        >
          Dashboard
        </a>
        <i class="pi pi-angle-right text-xs"></i>
        <span class="font-semibold text-slate-700">Leave types</span>
      </div>

      <!-- Page Header -->
      <div
        class="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1
            class="m-0 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl"
          >
            Leave types
          </h1>
          <p class="mt-1 text-xs text-slate-500 sm:text-sm">
            Configure leave categories and how entitlement is calculated.
          </p>
        </div>

        <p-button
          label="Add leave type"
          icon="pi pi-plus"
          (onClick)="openCreate()"
          styleClass="w-full sm:w-auto bg-blue-700! border-none! hover:bg-blue-500!"
        />
      </div>

      <!-- Summary -->
      <div class="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div class="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
          <div
            class="mb-2 flex items-center gap-2 text-xs text-slate-500 sm:text-sm"
          >
            <i class="pi pi-list text-blue-600"></i>
            Total leave types
          </div>
          <div class="text-2xl font-bold text-slate-900">
            {{ types.length }}
          </div>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
          <div
            class="mb-2 flex items-center gap-2 text-xs text-slate-500 sm:text-sm"
          >
            <i class="pi pi-check-circle text-emerald-600"></i>
            Paid leave
          </div>
          <div class="text-2xl font-bold text-slate-900">
            {{ totalPaidLeaveTypes }}
          </div>
        </div>

        <div
          class="col-span-2 rounded-xl border border-slate-200 bg-white p-3 sm:col-span-1 sm:p-4"
        >
          <div
            class="mb-2 flex items-center gap-2 text-xs text-slate-500 sm:text-sm"
          >
            <i class="pi pi-shield text-amber-600"></i>
            Protected policies
          </div>
          <div class="text-2xl font-bold text-slate-900">
            {{ totalProtectedPolicies }}
          </div>
        </div>
      </div>

      <!-- Desktop Table -->
      <div
        class="hidden overflow-hidden rounded-xl border border-slate-200 bg-white lg:block"
      >
        <p-table
          [value]="types"
          [rowHover]="true"
          styleClass="p-datatable-sm"
          [tableStyle]="{ 'min-width': '850px' }"
        >
          <ng-template pTemplate="header">
            <tr>
              <th class="!py-4">Leave type</th>
              <th>Policy</th>
              <th>Gender</th>
              <th>Default days</th>
              <th>Configuration</th>
              <th class="!text-right">Actions</th>
            </tr>
          </ng-template>

          <ng-template pTemplate="body" let-row>
            <tr>
              <td class="!py-4">
                <div class="font-semibold text-slate-800">{{ row.name }}</div>
                <div class="mt-1 max-w-xs text-xs text-slate-500">
                  {{ row.description || 'No description provided' }}
                </div>
              </td>

              <td>
                <span
                  class="inline-flex rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
                >
                  {{ policyLabel(row.policyKind) }}
                </span>
              </td>

              <td class="text-sm text-slate-600">
                {{ genderLabel(row.applicableGender) }}
              </td>

              <td class="font-semibold text-slate-700">
                {{ row.defaultDaysPerYear }}
                <span class="text-xs font-normal text-slate-400">days</span>
              </td>

              <td>
                <div class="flex max-w-xs flex-wrap gap-1.5">
                  <span
                    class="rounded-md px-2 py-1 text-xs font-medium"
                    [ngClass]="
                      row.isPaid
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    "
                  >
                    {{ row.isPaid ? 'Paid' : 'Unpaid' }}
                  </span>

                  @if (row.isEmergency) {
                    <span
                      class="rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700"
                    >
                      Emergency
                    </span>
                  }

                  @if (row.requiresDocument) {
                    <span
                      class="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600"
                    >
                      Document
                    </span>
                  }

                  @if (row.allowsHalfDay) {
                    <span
                      class="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600"
                    >
                      Half day
                    </span>
                  }

                  @if (row.allowsBalanceCascade) {
                    <span
                      class="rounded-md bg-indigo-50 px-2 py-1 text-xs text-indigo-700"
                    >
                      Cascade
                    </span>
                  }
                </div>
              </td>

              <td>
                <div class="flex justify-end gap-1">
                  <p-button
                    icon="pi pi-pencil"
                    severity="secondary"
                    [text]="true"
                    [rounded]="true"
                    pTooltip="Edit leave type"
                    (onClick)="openEdit(row)"
                  />

                  <p-button
                    icon="pi pi-trash"
                    severity="danger"
                    [text]="true"
                    [rounded]="true"
                    pTooltip="Delete leave type"
                    tooltipPosition="left"
                    (onClick)="confirmDelete(row)"
                    [loading]="deletingId === row.id"
                    [disabled]="!canDelete(row)"
                  />
                </div>
              </td>
            </tr>
          </ng-template>

          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="6" class="!py-12 text-center">
                <i class="pi pi-inbox mb-3 block text-3xl text-slate-300"></i>
                <div class="font-medium text-slate-600">No leave types yet</div>
                <p class="mt-1 text-xs text-slate-400">
                  Add a leave type to get started.
                </p>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- Mobile / Tablet Cards -->
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
        @for (row of types; track row.id) {
          <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
            <!-- Card Header -->
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h3
                  class="m-0 break-words text-base font-semibold text-slate-900"
                >
                  {{ row.name }}
                </h3>
                <p
                  class="mt-1 break-words text-xs leading-relaxed text-slate-500"
                >
                  {{ row.description || 'No description provided' }}
                </p>
              </div>

              <span
                class="shrink-0 rounded-md px-2 py-1 text-[10px] font-semibold"
                [ngClass]="
                  row.isPaid
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-slate-100 text-slate-600'
                "
              >
                {{ row.isPaid ? 'PAID' : 'UNPAID' }}
              </span>
            </div>

            <div class="my-4 border-t border-slate-100"></div>

            <!-- Policy Details -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <div class="text-[11px] text-slate-400">Policy</div>
                <div class="mt-1 text-xs font-medium text-slate-700">
                  {{ policyLabel(row.policyKind) }}
                </div>
              </div>

              <div>
                <div class="text-[11px] text-slate-400">Applicable gender</div>
                <div class="mt-1 text-xs font-medium text-slate-700">
                  {{ genderLabel(row.applicableGender) }}
                </div>
              </div>

              <div>
                <div class="text-[11px] text-slate-400">
                  Default entitlement
                </div>
                <div class="mt-1 text-sm font-semibold text-slate-900">
                  {{ row.defaultDaysPerYear }} days
                </div>
              </div>

              <div>
                <div class="text-[11px] text-slate-400">Policy status</div>
                <div class="mt-1 text-xs font-medium text-slate-700">
                  {{ canDelete(row) ? 'Custom policy' : 'Protected policy' }}
                </div>
              </div>
            </div>

            <!-- Configuration Flags -->
            <div class="mt-4 flex flex-wrap gap-1.5">
              @if (row.isEmergency) {
                <span
                  class="rounded-md bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-700"
                >
                  Emergency
                </span>
              }

              @if (row.requiresDocument) {
                <span
                  class="rounded-md bg-slate-100 px-2 py-1 text-[10px] text-slate-600"
                >
                  Requires document
                </span>
              }

              @if (row.allowsHalfDay) {
                <span
                  class="rounded-md bg-slate-100 px-2 py-1 text-[10px] text-slate-600"
                >
                  Half day
                </span>
              }

              @if (row.allowsBalanceCascade) {
                <span
                  class="rounded-md bg-indigo-50 px-2 py-1 text-[10px] text-indigo-700"
                >
                  Balance cascade
                </span>
              }
            </div>

            <!-- Actions -->
            <div class="mt-4 flex gap-2 border-t border-slate-100 pt-3">
              <p-button
                label="Edit"
                icon="pi pi-pencil"
                severity="secondary"
                [outlined]="true"
                size="small"
                styleClass="w-full"
                class="flex-1"
                (onClick)="openEdit(row)"
              />

              <p-button
                label="Delete"
                icon="pi pi-trash"
                severity="danger"
                [outlined]="true"
                size="small"
                styleClass="w-full"
                class="flex-1"
                (onClick)="confirmDelete(row)"
                [loading]="deletingId === row.id"
                [disabled]="!canDelete(row)"
                [pTooltip]="deleteDisabledReason(row)"
              />
            </div>
          </div>
        } @empty {
          <div
            class="col-span-full rounded-xl border border-slate-200 bg-white px-4 py-12 text-center"
          >
            <i class="pi pi-inbox mb-3 block text-3xl text-slate-300"></i>
            <div class="font-medium text-slate-600">No leave types yet</div>
            <p class="mt-1 text-xs text-slate-400">
              Add a leave type to get started.
            </p>
          </div>
        }
      </div>

      <!-- Add / Edit Dialog -->
      <p-dialog
        [(visible)]="dialogVisible"
        [header]="editingId ? 'Edit leave type' : 'Add leave type'"
        [modal]="true"
        [draggable]="false"
        [resizable]="false"
        [baseZIndex]="10000"
        [appendTo]="'body'"
        [autoZIndex]="true"
        [style]="{
          width: '560px',
          'max-width': 'calc(100vw - 1.5rem)',
        }"
        [breakpoints]="{ '640px': 'calc(100vw - 1.5rem)' }"
        [contentStyle]="{
          'max-height': 'calc(100dvh - 180px)',
          'overflow-y': 'auto',
          'overflow-x': 'hidden',
        }"
        styleClass="leave-type-dialog"
      >
        <div class="flex flex-col gap-4">
          <!-- Name -->
          <div>
            <label class="mb-1.5 block text-sm font-medium text-slate-700">
              Leave type name <span class="text-red-500">*</span>
            </label>
            <input
              pInputText
              class="w-full"
              [(ngModel)]="form.name"
              placeholder="e.g. Annual Leave"
            />
          </div>

          <!-- Description -->
          <div>
            <label class="mb-1.5 block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              pTextarea
              rows="3"
              [autoResize]="true"
              class="w-full"
              [(ngModel)]="form.description"
              placeholder="Describe this leave type..."
            ></textarea>
          </div>

          <!-- Policy and Gender -->
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div class="min-w-0">
              <label class="mb-1.5 block text-sm font-medium text-slate-700">
                Policy kind
              </label>
              <p-select
                [options]="policyKinds"
                [(ngModel)]="form.policyKind"
                optionLabel="label"
                optionValue="value"
                appendTo="body"
                styleClass="w-full"
              />
            </div>

            <div class="min-w-0">
              <label class="mb-1.5 block text-sm font-medium text-slate-700">
                Applicable gender
              </label>
              <p-select
                [options]="genderOptions"
                [(ngModel)]="form.applicableGender"
                optionLabel="label"
                optionValue="value"
                appendTo="body"
                styleClass="w-full"
              />
            </div>
          </div>

          <p class="-mt-2 text-xs leading-relaxed text-slate-500">
            Example: Maternity = Female, Paternity = Male. Select All for leave
            types available to everyone.
          </p>

          <!-- Default Days -->
          @if (form.policyKind === 'Fixed') {
            <div>
              <label class="mb-1.5 block text-sm font-medium text-slate-700">
                Default days per year
              </label>
              <p-inputNumber
                [(ngModel)]="form.defaultDaysPerYear"
                [min]="0"
                [showButtons]="true"
                styleClass="w-full"
                inputStyleClass="w-full"
              />
            </div>
          }

          <!-- Configuration -->
          <div class="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div class="mb-3 text-sm font-semibold text-slate-800">
              Leave configuration
            </div>

            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label
                class="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
              >
                <p-checkbox [(ngModel)]="form.isPaid" [binary]="true" />
                Paid leave
              </label>

              <label
                class="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
              >
                <p-checkbox [(ngModel)]="form.isEmergency" [binary]="true" />
                Emergency leave
              </label>

              <label
                class="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
              >
                <p-checkbox
                  [(ngModel)]="form.requiresDocument"
                  [binary]="true"
                />
                Requires document
              </label>

              <label
                class="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
              >
                <p-checkbox [(ngModel)]="form.allowsHalfDay" [binary]="true" />
                Allow half day
              </label>

              <label
                class="flex cursor-pointer items-center gap-2 text-sm text-slate-700 sm:col-span-2"
              >
                <p-checkbox
                  [(ngModel)]="form.allowsBalanceCascade"
                  [binary]="true"
                  [disabled]="!form.isPaid || form.isEmergency"
                />
                Allow balance cascade
              </label>
            </div>
          </div>

          <!-- Policy Information -->
          @if (form.isEmergency) {
            <div
              class="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3"
            >
              <i class="pi pi-info-circle mt-0.5 text-amber-600"></i>
              <p class="m-0 text-xs leading-relaxed text-amber-800">
                Emergency leave has no entitlement balance. It always charges
                Annual Leave first, then Unpaid Leave (staff must confirm).
                Cascade setting does not apply.
              </p>
            </div>
          } @else {
            <div
              class="flex gap-2 rounded-lg border border-blue-100 bg-blue-50 p-3"
            >
              <i class="pi pi-info-circle mt-0.5 text-blue-600"></i>
              <p class="m-0 text-xs leading-relaxed text-blue-800">
                When the remaining balance is insufficient, the applicant can
                choose Annual Leave or Unpaid Leave for the overflow. Staff must
                confirm. Changing defaults does not rewrite existing year
                balances.
              </p>
            </div>
          }
        </div>

        <!-- Dialog Footer -->
        <ng-template pTemplate="footer">
          <div
            class="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end"
          >
            <p-button
              label="Cancel"
              severity="secondary"
              [outlined]="true"
              styleClass="w-full sm:w-auto"
              (onClick)="dialogVisible = false"
            />

            <p-button
              [label]="editingId ? 'Save changes' : 'Create leave type'"
              icon="pi pi-save"
              styleClass="w-full sm:w-auto bg-blue-700! border-none! hover:bg-blue-500!"
              (onClick)="save()"
              [loading]="saving"
              [disabled]="saving"
            />
          </div>
        </ng-template>
      </p-dialog>
    </div>
  `,
})
export class LeaveTypesSettings implements OnInit, OnDestroy {
  private readonly leaveTypeService = inject(LeaveTypeService);
  private readonly messageService = inject(MessageService);
  private readonly loadingService = inject(LoadingService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  readonly policyKinds = POLICY_KINDS;
  readonly genderOptions = GENDER_OPTIONS;
  types: LeaveTypeDto[] = [];
  dialogVisible = false;
  editingId: string | null = null;
  deletingId: string | null = null;
  saving = false;
  form: UpsertLeaveTypeDto = this.emptyForm();

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  policyLabel(kind: string): string {
    return POLICY_KINDS.find((k) => k.value === kind)?.label ?? kind;
  }

  genderLabel(gender: string): string {
    return (
      GENDER_OPTIONS.find((g) => g.value === gender)?.label ?? gender ?? 'All'
    );
  }

  canDelete(row: LeaveTypeDto): boolean {
    return !PROTECTED_POLICY_KINDS.has(row.policyKind);
  }

  deleteDisabledReason(row: LeaveTypeDto): string {
    if (!this.canDelete(row)) {
      return 'Annual and Medical types are required for leave policy.';
    }
    return '';
  }

  openCreate(): void {
    this.editingId = null;
    this.form = this.emptyForm();
    this.dialogVisible = true;
  }

  openEdit(row: LeaveTypeDto): void {
    this.editingId = row.id;
    this.form = {
      name: row.name,
      description: row.description,
      isPaid: row.isPaid,
      isEmergency: row.isEmergency,
      defaultDaysPerYear: row.defaultDaysPerYear,
      requiresDocument: row.requiresDocument,
      allowsHalfDay: !!row.allowsHalfDay,
      allowsBalanceCascade: row.isEmergency
        ? false
        : !!row.allowsBalanceCascade,
      policyKind: row.policyKind || 'Fixed',
      applicableGender: row.applicableGender || 'All',
    };
    this.dialogVisible = true;
  }

  confirmDelete(row: LeaveTypeDto): void {
    if (!this.canDelete(row)) return;
    const ok = window.confirm(
      `Delete leave type “${row.name}”? This cannot be undone.`,
    );
    if (!ok) return;

    this.deletingId = row.id;
    this.leaveTypeService
      .delete(row.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.deletingId = null;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Deleted',
            detail: `${row.name} removed.`,
          });
          this.load();
        },
        error: (e) =>
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: e.error?.message || 'Delete failed',
          }),
      });
  }

  save(): void {
    if (!this.form.name?.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Name required',
        detail: 'Enter a leave type name.',
      });
      return;
    }
    if (this.form.isEmergency) {
      this.form.allowsBalanceCascade = false;
    }
    this.saving = true;
    const req$ = this.editingId
      ? this.leaveTypeService.update(this.editingId, this.form)
      : this.leaveTypeService.create(this.form);

    req$
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.saving = false)),
      )
      .subscribe({
        next: () => {
          this.dialogVisible = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Saved',
            detail: 'Leave type updated.',
          });
          this.load();
          this.cdr.markForCheck();
        },
        error: (e) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: e.error?.message || 'Save failed',
          });
          this.cdr.markForCheck();
        },
      });
  }

  private load(): void {
    this.loadingService.start();
    this.leaveTypeService
      .getAll()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loadingService.stop()),
      )
      .subscribe({
        next: (rows) => {
          this.types = rows;
          this.cdr.markForCheck();
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load leave types',
          });
          this.cdr.markForCheck();
        },
      });
  }

  private emptyForm(): UpsertLeaveTypeDto {
    return {
      name: '',
      description: '',
      isPaid: true,
      isEmergency: false,
      defaultDaysPerYear: 0,
      requiresDocument: false,
      allowsHalfDay: false,
      allowsBalanceCascade: false,
      policyKind: 'Fixed',
      applicableGender: 'All',
    };
  }

  get totalPaidLeaveTypes(): number {
    return this.types.filter((type) => type.isPaid).length;
  }

  get totalProtectedPolicies(): number {
    return this.types.filter((type) => !this.canDelete(type)).length;
  }
}
