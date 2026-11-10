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
import {
  PublicHolidayDto,
  UpsertPublicHolidayDto,
} from '../../../models/Leave';
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
    <div
      class="leave-holidays-page min-h-screen w-full bg-slate-50 p-4 sm:p-6 lg:p-8"
    >
      <!-- Breadcrumb -->
      <div
        class="mb-5 flex flex-wrap items-center gap-2 text-sm text-slate-500"
      >
        <a
          routerLink="/dashboard"
          class="transition-colors hover:text-[#2148BC]"
        >
          Dashboard
        </a>
        <i class="pi pi-angle-right text-xs"></i>
        <span class="font-semibold text-slate-700">Public holidays</span>
      </div>

      <!-- Page heading -->
      <div
        class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <div class="flex items-center gap-3">
            <div
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#2148BC]"
            >
              <i class="pi pi-calendar text-xl"></i>
            </div>
            <div>
              <h1 class="m-0 text-xl font-bold text-slate-900 sm:text-2xl">
                Public holidays
              </h1>
              <p class="m-0 mt-1 text-sm text-slate-500">
                Manage public holidays and their availability.
              </p>
            </div>
          </div>
        </div>

        <div
          class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center"
        >
          <p-select
            [options]="yearOptions"
            [(ngModel)]="year"
            (onChange)="load()"
            optionLabel="label"
            optionValue="value"
            placeholder="Select year"
            styleClass="holiday-year-select w-full sm:w-32"
          />

          <p-button
            label="Add holiday"
            icon="pi pi-plus"
            (onClick)="openCreate()"
            styleClass="whitespace-nowrap! border-none! bg-blue-700! hover:bg-blue-500! w-full sm:w-auto"
          />
        </div>
      </div>

      <!-- Summary -->
      <div class="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div class="holiday-summary-card">
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs font-medium text-slate-500 sm:text-sm"
              >Total holidays</span
            >
            <i class="pi pi-calendar text-blue-600"></i>
          </div>
          <div class="mt-2 text-2xl font-bold text-slate-900">
            {{ holidays.length }}
          </div>
          <p class="m-0 mt-1 text-xs text-slate-400">{{ year }}</p>
        </div>

        <div class="holiday-summary-card">
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs font-medium text-slate-500 sm:text-sm"
              >Active holidays</span
            >
            <i class="pi pi-check-circle text-green-600"></i>
          </div>
          <div class="mt-2 text-2xl font-bold text-slate-900">
            {{ getActiveCount() }}
          </div>
          <p class="m-0 mt-1 text-xs text-slate-400">Currently enabled</p>
        </div>

        <div class="holiday-summary-card col-span-2 sm:col-span-1">
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs font-medium text-slate-500 sm:text-sm"
              >Inactive holidays</span
            >
            <i class="pi pi-minus-circle text-slate-400"></i>
          </div>
          <div class="mt-2 text-2xl font-bold text-slate-900">
            {{ holidays.length - getActiveCount() }}
          </div>
          <p class="m-0 mt-1 text-xs text-slate-400">Currently disabled</p>
        </div>
      </div>

      <!-- Desktop table -->
      <div
        class="holiday-table-container hidden overflow-hidden rounded-xl border border-slate-200 bg-white md:block"
      >
        <div
          class="flex items-center justify-between border-b border-slate-100 px-5 py-4"
        >
          <div>
            <h2 class="m-0 text-base font-semibold text-slate-800">
              Holiday list
            </h2>
            <p class="m-0 mt-1 text-xs text-slate-500">
              Public holidays for {{ year }}
            </p>
          </div>
          <span
            class="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
          >
            {{ holidays.length }} records
          </span>
        </div>

        <p-table
          [value]="holidays"
          styleClass="p-datatable-sm holiday-table"
          [tableStyle]="{ 'min-width': '42rem' }"
        >
          <ng-template pTemplate="header">
            <tr>
              <th class="w-44">Date</th>
              <th>Name</th>
              <th class="w-36">Status</th>
              <th class="w-36 text-right">Actions</th>
            </tr>
          </ng-template>

          <ng-template pTemplate="body" let-row>
            <tr>
              <td>
                <div class="flex items-center gap-2 whitespace-nowrap">
                  <i class="pi pi-calendar text-slate-400"></i>
                  <span class="font-medium text-slate-800">
                    {{ formatDate(row.date) }}
                  </span>
                </div>
              </td>

              <td>
                <span class="font-medium text-slate-700">{{ row.name }}</span>
              </td>

              <td>
                <span
                  class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                  [class.bg-green-50]="row.isActive"
                  [class.text-green-700]="row.isActive"
                  [class.bg-slate-100]="!row.isActive"
                  [class.text-slate-500]="!row.isActive"
                >
                  <span
                    class="h-1.5 w-1.5 rounded-full"
                    [class.bg-green-500]="row.isActive"
                    [class.bg-slate-400]="!row.isActive"
                  ></span>
                  {{ row.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>

              <td>
                <div class="flex justify-end gap-1">
                  <p-button
                    icon="pi pi-pencil"
                    severity="secondary"
                    [text]="true"
                    [rounded]="true"
                    size="small"
                    pTooltip="Edit"
                    (onClick)="openEdit(row)"
                  />
                  <p-button
                    icon="pi pi-trash"
                    severity="danger"
                    [text]="true"
                    [rounded]="true"
                    size="small"
                    pTooltip="Delete"
                    (onClick)="confirmDelete(row)"
                    [loading]="deletingId === row.id"
                    [disabled]="deletingId !== null"
                  />
                </div>
              </td>
            </tr>
          </ng-template>

          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="4">
                <div
                  class="flex flex-col items-center justify-center py-12 text-center"
                >
                  <div
                    class="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100"
                  >
                    <i class="pi pi-calendar-times text-2xl text-slate-400"></i>
                  </div>
                  <p class="m-0 font-semibold text-slate-700">
                    No public holidays found
                  </p>
                  <p class="m-0 mt-1 text-sm text-slate-400">
                    There are no holidays configured for {{ year }}.
                  </p>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- Mobile cards -->
      <div class="space-y-3 md:hidden">
        <div class="flex items-center justify-between">
          <h2 class="m-0 text-base font-semibold text-slate-800">
            Holiday list
          </h2>
          <span class="text-xs text-slate-500"
            >{{ holidays.length }} records</span
          >
        </div>

        <ng-container *ngIf="holidays.length > 0; else mobileEmpty">
          <div *ngFor="let row of holidays" class="holiday-mobile-card">
            <div class="flex min-w-0 items-start gap-3">
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#2148BC]"
              >
                <i class="pi pi-calendar text-lg"></i>
              </div>

              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-sm font-semibold text-slate-900">
                    {{ row.name }}
                  </span>
                  <span
                    class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
                    [class.bg-green-50]="row.isActive"
                    [class.text-green-700]="row.isActive"
                    [class.bg-slate-100]="!row.isActive"
                    [class.text-slate-500]="!row.isActive"
                  >
                    {{ row.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </div>

                <p class="m-0 mt-1 text-sm text-slate-500">
                  {{ formatDate(row.date) }}
                </p>
              </div>
            </div>

            <div
              class="mt-4 flex items-center justify-end gap-2 border-t border-slate-100 pt-3"
            >
              <p-button
                label="Edit"
                icon="pi pi-pencil"
                severity="secondary"
                [outlined]="true"
                size="small"
                (onClick)="openEdit(row)"
              />
              <p-button
                label="Delete"
                icon="pi pi-trash"
                severity="danger"
                [outlined]="true"
                size="small"
                (onClick)="confirmDelete(row)"
                [loading]="deletingId === row.id"
                [disabled]="deletingId !== null"
              />
            </div>
          </div>
        </ng-container>

        <ng-template #mobileEmpty>
          <div
            class="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center"
          >
            <i class="pi pi-calendar-times text-3xl text-slate-300"></i>
            <p class="mb-1 mt-3 text-sm font-semibold text-slate-700">
              No public holidays found
            </p>
            <p class="m-0 text-xs text-slate-400">
              There are no holidays configured for {{ year }}.
            </p>
          </div>
        </ng-template>
      </div>
    </div>

    <!-- Add / Edit dialog -->
    <p-dialog
      [(visible)]="dialogVisible"
      [header]="editingId ? 'Edit public holiday' : 'Add public holiday'"
      [modal]="true"
      [style]="{ width: 'min(28rem, calc(100vw - 2rem))' }"
      [draggable]="false"
      [resizable]="false"
      [dismissableMask]="true"
      [breakpoints]="{ '640px': 'calc(100vw - 2rem)' }"
      appendTo="body"
      styleClass="holiday-form-dialog"
    >
      <div class="flex flex-col gap-4 pt-2">
        <div>
          <label class="holiday-field-label"
            >Date <span class="text-red-500">*</span></label
          >
          <p-datepicker
            [(ngModel)]="formDate"
            dateFormat="dd/mm/yy"
            [showIcon]="true"
            appendTo="body"
            [baseZIndex]="12000"
            styleClass="w-full"
            inputStyleClass="w-full"
            placeholder="Select holiday date"
          />
        </div>

        <div>
          <label class="holiday-field-label"
            >Holiday name <span class="text-red-500">*</span></label
          >
          <input
            pInputText
            class="w-full"
            [(ngModel)]="formName"
            placeholder="e.g. Hari Merdeka"
            maxlength="150"
          />
        </div>

        <div
          class="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3"
        >
          <div>
            <p class="m-0 text-sm font-semibold text-slate-700">
              Active holiday
            </p>
            <p class="m-0 mt-0.5 text-xs text-slate-500">
              Allow this holiday to be applied to leave restrictions.
            </p>
          </div>
          <p-checkbox
            [(ngModel)]="formActive"
            [binary]="true"
            inputId="holidayActive"
          />
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
            (onClick)="dialogVisible = false"
            styleClass="w-full sm:w-auto"
          />
          <p-button
            label="Save holiday"
            icon="pi pi-save"
            (onClick)="save()"
            [loading]="saving"
            [disabled]="saving"
            styleClass="bg-blue-700! border-none! hover:bg-blue-500! w-full sm:w-auto"
          />
        </div>
      </ng-template>
    </p-dialog>

    <!-- Delete confirmation dialog -->
    <p-dialog
      [(visible)]="deleteDialogVisible"
      [modal]="true"
      [closable]="false"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: 'min(25rem, calc(100vw - 2rem))' }"
      appendTo="body"
      styleClass="holiday-delete-dialog"
    >
      <div class="flex flex-col items-center px-2 py-3 text-center">
        <div
          class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50"
        >
          <i class="pi pi-trash text-2xl text-red-600"></i>
        </div>

        <h3 class="m-0 text-lg font-bold text-slate-800">
          Delete public holiday?
        </h3>

        <p class="mt-2 text-sm leading-relaxed text-slate-500">
          Are you sure you want to delete
          <span class="font-semibold text-slate-800">
            "{{ selectedHoliday?.name }}" </span
          >? This action cannot be undone.
        </p>
      </div>

      <ng-template pTemplate="footer">
        <div
          class="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end"
        >
          <p-button
            label="Cancel"
            severity="secondary"
            [outlined]="true"
            (onClick)="cancelDelete()"
            styleClass="w-full sm:w-auto"
          />
          <p-button
            label="Yes, delete"
            icon="pi pi-trash"
            severity="danger"
            (onClick)="deleteHoliday()"
            [loading]="deletingId !== null"
            [disabled]="deletingId !== null"
            styleClass="w-full sm:w-auto"
          />
        </div>
      </ng-template>
    </p-dialog>
  `,
  styleUrl: './leave-holidays.less',
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

  formName: string = '';
  editingId: string | null = null;
  deletingId: string | null = null;
  formDate: Date | null = null;
  formActive: boolean = true;

  deleteDialogVisible: boolean = false;
  saving: boolean = false;
  dialogVisible: boolean = false;

  selectedHoliday: PublicHolidayDto | null = null;
  holidays: PublicHolidayDto[] = [];

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
    if (this.deletingId !== null) return;

    this.selectedHoliday = row;
    this.deleteDialogVisible = true;
    this.cdr.markForCheck();
  }

  cancelDelete(): void {
    if (this.deletingId !== null) return;

    this.deleteDialogVisible = false;
    this.selectedHoliday = null;
    this.cdr.markForCheck();
  }

  deleteHoliday(): void {
    if (!this.selectedHoliday || this.deletingId !== null) return;

    const holiday = this.selectedHoliday;

    this.deletingId = holiday.id;
    this.cdr.markForCheck();

    this.holidayService
      .delete(holiday.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.deletingId = null;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.deleteDialogVisible = false;
          this.selectedHoliday = null;

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

  getActiveCount(): number {
    return this.holidays.filter((holiday) => holiday.isActive).length;
  }
}
