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
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { Subject, takeUntil } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { PublicHolidayDto, UpsertPublicHolidayDto } from '../../../models/Leave';
import { LeaveHolidayService } from '../../../services/leave-holiday.service';
import { LoadingService } from '../../../services/loading.service';

@Component({
  selector: 'app-leave-holidays-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    TableModule,
    DialogModule,
    InputTextModule,
    DatePickerModule,
    CheckboxModule,
    SelectModule,
  ],
  template: `
    <div class="w-full min-h-screen bg-[#f4f6f8] p-6">
      <div class="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
        <a routerLink="/dashboard" class="hover:text-blue-600">Dashboard</a>
        <span>/</span>
        <span class="text-gray-700 font-semibold">Public holidays</span>
      </div>

      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 m-0">Public holidays</h1>
          <p class="text-sm text-gray-500 mt-1 m-0">
            Holidays cannot be selected as leave start or end dates.
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <p-select
            [options]="yearOptions"
            [(ngModel)]="year"
            (onChange)="load()"
            styleClass="w-28"
          />
          <p-button label="Add holiday" icon="pi pi-plus" (onClick)="openCreate()" />
        </div>
      </div>

      <div class="bg-white border border-gray-200 rounded-xl overflow-x-auto">
        <p-table [value]="holidays" styleClass="p-datatable-sm" [tableStyle]="{ 'min-width': '36rem' }">
          <ng-template pTemplate="header">
            <tr>
              <th style="min-width: 8rem">Date</th>
              <th style="min-width: 12rem">Name</th>
              <th style="min-width: 6rem">Status</th>
              <th style="min-width: 10rem"></th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-row>
            <tr>
              <td class="font-medium text-gray-900 whitespace-nowrap">{{ formatDate(row.date) }}</td>
              <td class="break-words">{{ row.name }}</td>
              <td>
                <span
                  class="inline-flex px-2 py-0.5 rounded text-xs font-medium"
                  [class.bg-green-100]="row.isActive"
                  [class.text-green-800]="row.isActive"
                  [class.bg-gray-100]="!row.isActive"
                  [class.text-gray-600]="!row.isActive"
                >
                  {{ row.isActive ? 'Active' : 'Inactive' }}
                </span>
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
                />
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="4" class="text-center text-gray-500 py-8">
                No public holidays for {{ year }}.
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>

    <p-dialog
      [(visible)]="dialogVisible"
      [header]="editingId ? 'Edit public holiday' : 'Add public holiday'"
      [modal]="true"
      [style]="{ width: 'min(28rem, 95vw)' }"
      [contentStyle]="{ overflow: 'visible' }"
      [draggable]="false"
      [dismissableMask]="true"
    >
      <div class="flex flex-col gap-4 pt-2 overflow-visible">
        <div class="relative z-10">
          <label class="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <p-datepicker
            [(ngModel)]="formDate"
            dateFormat="dd/mm/yy"
            [showIcon]="true"
            appendTo="body"
            [baseZIndex]="12000"
            styleClass="w-full"
            inputStyleClass="w-full"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input pInputText class="w-full" [(ngModel)]="formName" placeholder="e.g. Hari Merdeka" />
        </div>
        <div class="flex items-center gap-2">
          <p-checkbox [(ngModel)]="formActive" [binary]="true" inputId="holidayActive" />
          <label for="holidayActive" class="text-sm text-gray-700">Active</label>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <p-button label="Cancel" [text]="true" severity="secondary" (onClick)="dialogVisible = false" />
        <p-button label="Save" icon="pi pi-check" (onClick)="save()" [loading]="saving" />
      </ng-template>
    </p-dialog>
  `,
})
export class LeaveHolidaysSettings implements OnInit, OnDestroy {
  private readonly holidayService = inject(LeaveHolidayService);
  private readonly loading = inject(LoadingService);
  private readonly messages = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  year = new Date().getFullYear();
  yearOptions = Array.from({ length: 6 }, (_, i) => {
    const y = new Date().getFullYear() - 1 + i;
    return { label: String(y), value: y };
  });

  holidays: PublicHolidayDto[] = [];
  dialogVisible = false;
  editingId: string | null = null;
  formDate: Date | null = null;
  formName = '';
  formActive = true;
  saving = false;
  deletingId: string | null = null;

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  load(): void {
    this.loading.start();
    this.holidayService
      .getByYear(this.year, true)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading.stop();
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (rows) => {
          this.holidays = rows;
        },
        error: () => {
          this.messages.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load public holidays.',
          });
        },
      });
  }

  openCreate(): void {
    this.editingId = null;
    this.formDate = null;
    this.formName = '';
    this.formActive = true;
    this.dialogVisible = true;
    this.cdr.markForCheck();
  }

  openEdit(row: PublicHolidayDto): void {
    this.editingId = row.id;
    this.formDate = this.parseDate(row.date);
    this.formName = row.name;
    this.formActive = row.isActive;
    this.dialogVisible = true;
    this.cdr.markForCheck();
  }

  save(): void {
    if (!this.formDate) {
      this.messages.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Date is required.',
      });
      return;
    }
    if (!this.formName.trim()) {
      this.messages.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Name is required.',
      });
      return;
    }

    const dto: UpsertPublicHolidayDto = {
      date: this.toIsoDate(this.formDate),
      name: this.formName.trim(),
      isActive: this.formActive,
    };

    this.saving = true;
    this.cdr.markForCheck();
    const req$ = this.editingId
      ? this.holidayService.update(this.editingId, dto)
      : this.holidayService.create(dto);

    req$
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.dialogVisible = false;
          this.messages.add({
            severity: 'success',
            summary: 'Saved',
            detail: 'Public holiday saved.',
          });
          this.year = this.formDate!.getFullYear();
          this.load();
        },
        error: (err) => {
          this.messages.add({
            severity: 'error',
            summary: 'Error',
            detail: err?.error?.message || 'Failed to save public holiday.',
          });
        },
      });
  }

  confirmDelete(row: PublicHolidayDto): void {
    if (!confirm(`Delete holiday "${row.name}" on ${this.formatDate(row.date)}?`)) return;
    this.deletingId = row.id;
    this.cdr.markForCheck();
    this.holidayService
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
          this.messages.add({
            severity: 'success',
            summary: 'Deleted',
            detail: 'Public holiday removed.',
          });
          this.load();
        },
        error: () => {
          this.messages.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to delete public holiday.',
          });
        },
      });
  }

  formatDate(iso: string): string {
    const d = this.parseDate(iso);
    if (!d) return iso;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  }

  private parseDate(iso: string): Date | null {
    if (!iso) return null;
    const part = iso.slice(0, 10);
    const [y, m, d] = part.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  }

  private toIsoDate(value: Date): string {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
