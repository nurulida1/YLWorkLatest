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
    <div class="w-full min-h-screen bg-[#f4f6f8] p-6">
      <div class="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
        <a routerLink="/dashboard" class="hover:text-blue-600">Dashboard</a>
        <span>/</span>
        <span class="text-gray-700 font-semibold">Leave types</span>
      </div>

      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 m-0">Leave types</h1>
          <p class="text-sm text-gray-500 mt-1 m-0">
            Configure leave categories and how entitlement is calculated.
          </p>
        </div>
        <p-button label="Add leave type" icon="pi pi-plus" (onClick)="openCreate()" />
      </div>

      <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <p-table [value]="types" styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              <th>Name</th>
              <th>Policy</th>
              <th>Gender</th>
              <th>Default days</th>
              <th>Flags</th>
              <th></th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-row>
            <tr>
              <td>
                <div class="font-medium text-gray-900">{{ row.name }}</div>
                <div class="text-xs text-gray-500">{{ row.description }}</div>
              </td>
              <td><span class="text-sm">{{ policyLabel(row.policyKind) }}</span></td>
              <td><span class="text-sm">{{ genderLabel(row.applicableGender) }}</span></td>
              <td>{{ row.defaultDaysPerYear }}</td>
              <td class="text-xs text-gray-600">
                @if (row.isPaid) { Paid } @else { Unpaid }
                @if (row.isEmergency) { · Emergency }
                @if (row.requiresDocument) { · Document }
              </td>
              <td class="whitespace-nowrap">
                <p-button label="Edit" size="small" [text]="true" (onClick)="openEdit(row)" />
                <p-button
                  label="Delete"
                  size="small"
                  severity="danger"
                  [text]="true"
                  (onClick)="confirmDelete(row)"
                  [loading]="deletingId === row.id"
                  [disabled]="!canDelete(row)"
                  [pTooltip]="deleteDisabledReason(row)"
                  tooltipPosition="left"
                />
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="6" class="text-center text-gray-500 py-8">No leave types yet.</td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <p-dialog
        [(visible)]="dialogVisible"
        [header]="editingId ? 'Edit leave type' : 'Add leave type'"
        [modal]="true"
        [style]="{ width: 'min(520px, 95vw)' }"
        [draggable]="false"
      >
        <div class="flex flex-col gap-3">
          <div>
            <label class="text-sm text-gray-600 block mb-1">Name</label>
            <input pInputText class="w-full" [(ngModel)]="form.name" />
          </div>
          <div>
            <label class="text-sm text-gray-600 block mb-1">Description</label>
            <textarea pTextarea rows="2" class="w-full" [(ngModel)]="form.description"></textarea>
          </div>
          <div>
            <label class="text-sm text-gray-600 block mb-1">Policy kind</label>
            <p-select
              [options]="policyKinds"
              [(ngModel)]="form.policyKind"
              optionLabel="label"
              optionValue="value"
              class="w-full"
            />
          </div>
          <div>
            <label class="text-sm text-gray-600 block mb-1">Applicable gender</label>
            <p-select
              [options]="genderOptions"
              [(ngModel)]="form.applicableGender"
              optionLabel="label"
              optionValue="value"
              class="w-full"
            />
            <p class="text-xs text-gray-500 mt-1 m-0">
              e.g. Maternity = Female, Paternity = Male. “All” for Annual / MC / Emergency.
            </p>
          </div>
          @if (form.policyKind === 'Fixed') {
            <div>
              <label class="text-sm text-gray-600 block mb-1">Default days per year</label>
              <p-inputNumber [(ngModel)]="form.defaultDaysPerYear" [min]="0" class="w-full" />
            </div>
          }
          <div class="flex flex-wrap gap-4 text-sm">
            <label class="inline-flex items-center gap-2">
              <p-checkbox [(ngModel)]="form.isPaid" [binary]="true" /> Paid
            </label>
            <label class="inline-flex items-center gap-2">
              <p-checkbox [(ngModel)]="form.isEmergency" [binary]="true" /> Emergency
            </label>
            <label class="inline-flex items-center gap-2">
              <p-checkbox [(ngModel)]="form.requiresDocument" [binary]="true" /> Requires document
            </label>
          </div>
          <p class="text-xs text-gray-500 m-0">
            Changing defaults does not rewrite existing year balances. Tenure types use leave policy bands.
          </p>
        </div>
        <ng-template pTemplate="footer">
          <p-button label="Cancel" severity="secondary" [text]="true" (onClick)="dialogVisible = false" />
          <p-button label="Save" (onClick)="save()" [loading]="saving" />
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
    return GENDER_OPTIONS.find((g) => g.value === gender)?.label ?? gender ?? 'All';
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
      policyKind: row.policyKind || 'Fixed',
      applicableGender: row.applicableGender || 'All',
    };
    this.dialogVisible = true;
  }

  confirmDelete(row: LeaveTypeDto): void {
    if (!this.canDelete(row)) return;
    const ok = window.confirm(`Delete leave type “${row.name}”? This cannot be undone.`);
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
      this.messageService.add({ severity: 'warn', summary: 'Name required', detail: 'Enter a leave type name.' });
      return;
    }
    this.saving = true;
    const req$ = this.editingId
      ? this.leaveTypeService.update(this.editingId, this.form)
      : this.leaveTypeService.create(this.form);

    req$.pipe(takeUntil(this.destroy$), finalize(() => (this.saving = false))).subscribe({
      next: () => {
        this.dialogVisible = false;
        this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Leave type updated.' });
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
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load leave types' });
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
      policyKind: 'Fixed',
      applicableGender: 'All',
    };
  }
}
