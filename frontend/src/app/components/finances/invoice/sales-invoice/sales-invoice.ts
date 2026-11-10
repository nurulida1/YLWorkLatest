import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { SelectModule } from 'primeng/select';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { InvoiceService } from '../../../../services/invoiceService.service';
import { LoadingService } from '../../../../services/loading.service';
import { MenuItem, MessageService } from 'primeng/api';
import { UserService } from '../../../../services/userService.service';
import { Subject, takeUntil } from 'rxjs';
import {
  BuildFilterText,
  BuildSortText,
  GridifyQueryExtend,
  PagingContent,
  ValidateAllFormFields,
} from '../../../../shared/helpers/helpers';
import { InvoiceDto } from '../../../../models/Invoice';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { HasPermissionActionDirective } from '../../../../common/directives/hasPermission.directive';
import { PermissionContextService } from '../../../../services/permission-context.service';
import { PaginatorModule } from 'primeng/paginator';

@Component({
  selector: 'app-sales-invoice',
  imports: [
    CommonModule,
    ButtonModule,
    InputTextModule,
    MenuModule,
    FormsModule,
    RouterLink,
    TableModule,
    DialogModule,
    SelectModule,
    InputNumberModule,
    TextareaModule,
    ReactiveFormsModule,
    DatePickerModule,
    HasPermissionActionDirective,
    PaginatorModule,
  ],
  template: `
    <div class="min-h-screen w-full bg-slate-50 p-3 sm:p-5 lg:p-6">
      <!-- Breadcrumb -->
      <div
        class="mb-4 flex items-center gap-2 text-xs tracking-wide text-slate-500 sm:text-sm"
      >
        <a routerLink="/dashboard" class="cursor-pointer hover:text-blue-600">
          Dashboard
        </a>
        <i class="pi pi-angle-right text-xs"></i>
        <span class="font-semibold text-slate-700">Sales Invoice</span>
      </div>

      <!-- Main Container -->
      <div class="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <!-- Header -->
        <div
          class="flex flex-col gap-4 border-b border-slate-200 p-4 sm:p-5 xl:flex-row xl:items-center xl:justify-between"
        >
          <div>
            <h1
              class="m-0 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl"
            >
              Sales Invoice
            </h1>
            <p class="mt-1 text-xs text-slate-500 sm:text-sm">
              View, create, and track all sales invoices.
            </p>
          </div>

          <div class="flex w-full flex-col gap-2 sm:flex-row xl:w-auto">
            <!-- Search -->
            <div class="relative w-full sm:flex-1 xl:w-72">
              <input
                type="text"
                pInputText
                [(ngModel)]="search"
                class="w-full pr-9"
                placeholder="Search by invoice number"
                (keydown)="onKeyDown($event)"
              />
              <i
                class="pi pi-search absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400"
              ></i>
            </div>

            <!-- Create -->
            <p-button
              *hasPermissionAction="'canCreate'"
              label="Generate Sales Invoice"
              icon="pi pi-file-pdf"
              severity="info"
              styleClass="w-full whitespace-nowrap sm:w-auto bg-blue-700! py-3! sm:py-2! border-none! bg-blue-500!"
              [routerLink]="'/invoices/sales/form'"
            />
          </div>
        </div>

        <!-- DESKTOP TABLE -->
        <div class="hidden lg:block">
          <p-table
            #fTable
            dataKey="id"
            [value]="PagingSignal().data || []"
            [paginator]="true"
            [rows]="Query.PageSize"
            [totalRecords]="PagingSignal().totalElements"
            [tableStyle]="{ 'min-width': '900px' }"
            [showGridlines]="false"
            [rowsPerPageOptions]="[10, 20, 30, 50]"
            [lazy]="true"
            [rowHover]="true"
            (onLazyLoad)="NextPage($event)"
            styleClass="p-datatable-sm"
          >
            <ng-template #header>
              <tr>
                <th
                  pSortableColumn="InvoiceNo"
                  class="!w-[15%] !bg-slate-50 !py-4"
                >
                  <div class="flex items-center justify-center gap-2">
                    Invoice No
                    <p-sortIcon field="InvoiceNo" />
                  </div>
                </th>

                <th class="!w-[30%] !bg-slate-50">Company</th>

                <th pSortableColumn="InvoiceDate" class="!w-[15%] !bg-slate-50">
                  <div class="flex items-center justify-center gap-2">
                    Invoice Date
                    <p-sortIcon field="InvoiceDate" />
                  </div>
                </th>

                <th class="!w-[15%] !bg-slate-50 !text-center">Amount</th>

                <th pSortableColumn="Status" class="!w-[15%] !bg-slate-50">
                  <div class="flex items-center justify-center gap-2">
                    Status
                    <p-sortIcon field="Status" />
                  </div>
                </th>

                <th class="!w-[10%] !bg-slate-50 !text-center">Action</th>
              </tr>
            </ng-template>

            <ng-template #body let-data>
              <tr>
                <td class="!text-center">
                  <span class="font-semibold text-slate-800">
                    {{ data.invoiceNo }}
                  </span>
                </td>

                <td>
                  <div class="font-medium text-slate-800">
                    {{ data.client?.name || '-' }}
                  </div>
                </td>

                <td class="!text-center text-sm text-slate-600">
                  {{ data.invoiceDate | date: 'dd/MM/yyyy' }}
                </td>

                <td class="!text-center">
                  <span class="font-semibold text-slate-800">
                    {{ data.totalAmount | currency: 'RM ' }}
                  </span>
                </td>

                <td class="!text-center">
                  <span
                    class="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                    [ngClass]="{
                      'bg-orange-100 text-orange-700':
                        data.status === 'Draft' || data.status === 'Refunded',
                      'bg-blue-100 text-blue-700': data.status === 'Sent',
                      'bg-yellow-100 text-yellow-700':
                        data.status === 'PartiallyPaid',
                      'bg-green-100 text-green-700': data.status === 'Paid',
                      'bg-red-100 text-red-700':
                        data.status === 'Overdue' ||
                        data.status === 'Cancelled',
                    }"
                  >
                    {{ data.status }}
                  </span>
                </td>

                <td class="!text-center">
                  <button
                    type="button"
                    class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                    (click)="onEllipsisClick($event, data, menu)"
                    pTooltip="More actions"
                  >
                    <i class="pi pi-ellipsis-h"></i>
                  </button>
                </td>
              </tr>
            </ng-template>

            <ng-template #emptymessage>
              <tr>
                <td colspan="6" class="!py-12 text-center!">
                  <i
                    class="pi pi-file-invoice mb-3 block text-3xl text-slate-300"
                  ></i>
                  <div class="font-medium text-slate-600">
                    No sales invoices found
                  </div>
                  <p class="mt-1 text-xs text-slate-400">
                    Try changing your search or create a new invoice.
                  </p>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>

        <!-- MOBILE / TABLET CARDS -->
        <div
          class="grid grid-cols-1 gap-3 bg-slate-50/50 p-3 sm:grid-cols-2 sm:p-4 lg:hidden"
        >
          @for (data of PagingSignal().data || []; track data.id) {
            <div
              class="min-w-0 rounded-xl border border-slate-200 bg-white p-4"
            >
              <!-- Invoice Header -->
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0 flex-1">
                  <div
                    class="text-[11px] font-medium uppercase tracking-wide text-slate-400"
                  >
                    Invoice number
                  </div>
                  <div class="mt-1 break-all text-sm font-bold text-slate-900">
                    {{ data.invoiceNo }}
                  </div>
                </div>

                <button
                  type="button"
                  class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                  (click)="onEllipsisClick($event, data, menu)"
                >
                  <i class="pi pi-ellipsis-h"></i>
                </button>
              </div>

              <div class="my-3 border-t border-slate-100"></div>

              <!-- Company -->
              <div>
                <div class="text-[11px] text-slate-400">Company</div>
                <div
                  class="mt-1 break-words text-sm font-semibold text-slate-800"
                >
                  {{ data.client.name || '-' }}
                </div>
              </div>

              <!-- Date and Amount -->
              <div class="mt-4 grid grid-cols-2 gap-3">
                <div class="min-w-0">
                  <div class="text-[11px] text-slate-400">Invoice date</div>
                  <div class="mt-1 text-sm font-medium text-slate-700">
                    {{ data.invoiceDate | date: 'dd/MM/yyyy' }}
                  </div>
                </div>

                <div class="min-w-0">
                  <div class="text-[11px] text-slate-400">Total amount</div>
                  <div
                    class="mt-1 break-words text-sm font-bold text-slate-900"
                  >
                    {{ data.totalAmount | currency: 'RM ' }}
                  </div>
                </div>
              </div>

              <!-- Status -->
              <div
                class="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3"
              >
                <span class="text-xs text-slate-500">Invoice status</span>

                <span
                  class="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                  [ngClass]="{
                    'bg-orange-100 text-orange-700':
                      data.status === 'Draft' || data.status === 'Refunded',
                    'bg-blue-100 text-blue-700': data.status === 'Sent',
                    'bg-yellow-100 text-yellow-700':
                      data.status === 'PartiallyPaid',
                    'bg-green-100 text-green-700': data.status === 'Paid',
                    'bg-red-100 text-red-700':
                      data.status === 'Overdue' || data.status === 'Cancelled',
                  }"
                >
                  {{ data.status }}
                </span>
              </div>
            </div>
          } @empty {
            <div
              class="col-span-full rounded-xl border border-slate-200 bg-white px-4 py-12 text-center"
            >
              <i
                class="pi pi-file-invoice mb-3 block text-3xl text-slate-300"
              ></i>
              <div class="font-medium text-slate-600">
                No sales invoices found
              </div>
              <p class="mt-1 text-xs text-slate-400">
                Try changing your search or create a new invoice.
              </p>
            </div>
          }
        </div>

        <!-- MOBILE PAGINATION -->
        <div class="border-t border-slate-200 bg-white px-2 py-3 lg:hidden">
          <p-paginator
            [first]="(Query.Page - 1) * Query.PageSize"
            [rows]="Query.PageSize"
            [totalRecords]="PagingSignal().totalElements || 0"
            [rowsPerPageOptions]="[10, 20, 30]"
            (onPageChange)="onMobilePageChange($event)"
          />
        </div>
      </div>
    </div>

    <!-- ACTION MENU -->
    <p-menu
      #menu
      [model]="menuItems"
      [popup]="true"
      appendTo="body"
      styleClass="min-w-[190px]"
    />

    <!-- RECORD PAYMENT DIALOG -->
    <p-dialog
      [(visible)]="showPaymentDialog"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [dismissableMask]="false"
      [baseZIndex]="10000"
      [autoZIndex]="true"
      [style]="{
        width: '600px',
        'max-width': 'calc(100vw - 24px)',
      }"
      [contentStyle]="{
        'max-height': 'calc(100dvh - 220px)',
        'overflow-y': 'auto',
        'overflow-x': 'hidden',
      }"
      styleClass="sales-payment-dialog"
    >
      <!-- Dialog Header -->
      <ng-template pTemplate="header">
        <div class="min-w-0">
          <div class="text-lg font-bold text-slate-900">Record Payment</div>
          <div class="mt-1 text-xs font-normal text-slate-500 sm:text-sm">
            Enter payment details for this invoice.
          </div>
        </div>
      </ng-template>

      <!-- Dialog Content -->
      <div class="flex flex-col gap-4" [formGroup]="paymentFG">
        <!-- Payment Number and Date -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="flex min-w-0 flex-col gap-1.5">
            <label class="text-sm font-medium text-slate-700">
              Payment No
            </label>
            <input
              type="text"
              pInputText
              class="w-full"
              placeholder="Auto-generated if empty"
              formControlName="paymentNo"
            />
            <small class="text-xs text-slate-400">
              Leave empty to auto-generate.
            </small>
          </div>

          <div class="flex min-w-0 flex-col gap-1.5">
            <label class="text-sm font-medium text-slate-700">
              Payment Date <span class="text-red-500">*</span>
            </label>
            <p-datepicker
              styleClass="w-full"
              dateFormat="dd/mm/yy"
              [showIcon]="true"
              appendTo="body"
              formControlName="paymentDate"
            />
          </div>
        </div>

        <!-- Payment Mode and Amount -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="flex min-w-0 flex-col gap-1.5">
            <label class="text-sm font-medium text-slate-700">
              Payment Mode <span class="text-red-500">*</span>
            </label>
            <p-select
              [options]="[
                { label: 'Cash', value: 'Cash' },
                { label: 'Bank Transfer', value: 'Bank Transfer' },
                { label: 'Cheque', value: 'Cheque' },
              ]"
              formControlName="paymentMode"
              optionLabel="label"
              optionValue="value"
              placeholder="Select payment mode"
              styleClass="w-full"
              appendTo="body"
            />
          </div>

          <div class="flex min-w-0 flex-col gap-1.5">
            <label class="text-sm font-medium text-slate-700">
              Amount <span class="text-red-500">*</span>
            </label>

            <p-inputnumber
              styleClass="w-full"
              formControlName="amount"
              inputStyleClass="w-full"
              mode="currency"
              currency="MYR"
              locale="ms-MY"
              [max]="
                selectedInvoice?.totalAmount -
                (selectedInvoice?.paidAmount || 0)
              "
              [minFractionDigits]="2"
            />

            <small class="text-xs text-slate-500">
              Remaining after payment: RM
              {{ remainingAmount | number: '1.2-2' }}
            </small>

            <small
              *ngIf="paymentFG.get('amount')?.errors?.['exceed']"
              class="text-xs text-red-500"
            >
              Amount exceeds remaining balance.
            </small>
          </div>
        </div>

        <!-- Notes -->
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-slate-700">
            Notes
            <span class="font-normal text-slate-400">(Optional)</span>
          </label>
          <textarea
            pTextarea
            [rows]="3"
            [autoResize]="true"
            class="w-full"
            formControlName="notes"
            placeholder="Add payment notes..."
          ></textarea>
        </div>

        <!-- Attachment -->
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-slate-700">
            Attachment <span class="text-red-500">*</span>
          </label>

          <input
            #file
            type="file"
            (change)="onPaymentFileSelected($event)"
            hidden
          />

          <div class="flex flex-wrap items-center gap-2">
            <p-button
              [label]="paymentFile ? 'Replace attachment' : 'Upload attachment'"
              severity="secondary"
              [outlined]="true"
              icon="pi pi-upload"
              size="small"
              (onClick)="file.click()"
            />

            <a
              *ngIf="paymentFileName"
              [href]="paymentFileUrl"
              [download]="paymentFileName"
              target="_blank"
              class="flex min-w-0 max-w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 sm:max-w-[260px]"
            >
              <i class="pi pi-file-pdf shrink-0 text-red-500"></i>
              <span class="truncate">{{ paymentFileName }}</span>
            </a>
          </div>
        </div>
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
            (onClick)="showPaymentDialog = false"
          />

          <p-button
            label="Save Payment"
            icon="pi pi-check"
            severity="info"
            styleClass="w-full sm:w-auto"
            (onClick)="submitPayment()"
          />
        </div>
      </ng-template>
    </p-dialog>
  `,
  styleUrl: './sales-invoice.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesInvoice implements OnInit, OnDestroy {
  @ViewChild('fTable') fTable?: Table;

  private readonly invoiceService = inject(InvoiceService);
  private readonly loadingService = inject(LoadingService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  private readonly permissionContext = inject(PermissionContextService);
  readonly rights = this.permissionContext.rights;
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  PagingSignal = signal<PagingContent<InvoiceDto>>(
    {} as PagingContent<InvoiceDto>,
  );
  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  search: string = '';
  selectedInvoice: any;

  paymentFile: File | null = null;
  paymentFileName: string = '';
  paymentFileUrl: string | null = null;

  showRecordDialog: boolean = false;
  showPaymentDialog: boolean = false;

  remainingAmount: number = 0;

  menuItems: MenuItem[] = [];
  currentUser = this.userService.currentUser;

  paymentFG!: FormGroup;

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 10;
    this.Query.Filter = null;
    this.Query.OrderBy = 'CreatedAt desc';
    this.Query.Select = null;
    this.Query.Includes = 'Client';
  }

  ngOnInit(): void {
    this.initPaymentForm();

    this.paymentFG.get('amount')?.valueChanges.subscribe((value) => {
      const total = this.selectedInvoice?.totalAmount || 0;
      const currentPaid = this.selectedInvoice?.paidAmount || 0;
      const input = value || 0;

      const remaining = total - currentPaid;

      this.remainingAmount = remaining - input;

      if (input > remaining) {
        this.paymentFG.get('amount')?.setErrors({ exceed: true });
      } else {
        this.paymentFG.get('amount')?.setErrors(null);
      }
    });
  }

  initPaymentForm() {
    this.paymentFG = new FormGroup({
      paymentNo: new FormControl<string | null>(null),
      paymentDate: new FormControl<Date | null>(
        new Date(),
        Validators.required,
      ),
      paymentMode: new FormControl<string | null>(null, Validators.required),
      amount: new FormControl<number | null>(null, Validators.required),
      notes: new FormControl<string | null>(null),
    });
  }

  GetData() {
    this.loadingService.start();

    this.invoiceService
      .GetMany(this.Query)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();
          this.PagingSignal.set(res);
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loadingService.stop();
        },
      });
  }

  NextPage(event: TableLazyLoadEvent) {
    if ((event?.first || event?.first === 0) && event?.rows) {
      this.Query.Page = event.first / event.rows + 1 || 1;
      this.Query.PageSize = event.rows;
    }

    const sortText = BuildSortText(event);
    this.Query.OrderBy = sortText ? sortText : 'CreatedAt desc';

    this.Query.Filter = BuildFilterText(event);

    this.Query.Filter = this.Query.Filter
      ? `${this.Query.Filter},Type=Sales`
      : 'Type=Sales';

    this.GetData();
  }

  onKeyDown(event: KeyboardEvent) {
    const isEnter = event.key === 'Enter';
    const isBackspaceClear = event.key === 'Backspace' && this.search === '';

    if (isEnter) {
      this.Search(this.search);
    } else if (isBackspaceClear) {
      this.Search('');
    }
  }

  Search(data: string) {
    const filter = {
      InvoiceNo: [
        {
          value: data,
          matchMode: '=',
          operator: 'and',
        },
      ],
    };

    if (this.fTable != null) {
      this.fTable.first = 0;
      this.fTable.filters = filter;
    }

    const event: TableLazyLoadEvent = {
      first: 0,
      rows: this.fTable?.rows,
      sortField: null,
      sortOrder: null,
      filters: filter,
    };

    this.NextPage(event);
  }

  ResetTable() {
    this.search = '';

    if (this.fTable) {
      this.fTable.first = 0;
      this.fTable.clearFilterValues();
      this.fTable.saveState();
    }

    this.Query.Filter = `Type=Sales`;
    this.GetData();
  }

  onEllipsisClick(event: any, invoice: InvoiceDto, menu: any) {
    const items: any[] = [];
    const status = invoice.status;

    if (status === 'Draft') {
      items.push(
        {
          label: 'Update',
          icon: 'pi pi-pencil',
          command: () => this.ActionClick(invoice, 'Update'),
        },
        {
          label: 'Mark as Sent',
          icon: 'pi pi-send',
          command: () => this.updateStatus(invoice.id, 'Sent'),
        },
        {
          label: 'Cancelled',
          icon: 'pi pi-times-circle',
          command: () => this.updateStatus(invoice.id, 'Cancelled'),
        },
      );
    } else if (status === 'Sent' || status === 'PartiallyPaid') {
      items.push(
        {
          label: 'Record Payment',
          icon: 'pi pi-money-bill',
          command: () => this.RecordPayment(invoice),
        },
        {
          label: 'Cancelled',
          icon: 'pi pi-times-circle',
          command: () => this.updateStatus(invoice.id, 'Cancelled'),
        },
      );
    }
    this.menuItems = items;
    menu.toggle(event);
  }

  updateStatus(id: string, newStatus: string) {
    this.loadingService.start();

    this.invoiceService
      .UpdateStatus(id, newStatus)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();

          const currentPaging = this.PagingSignal();

          const updatedData = currentPaging.data.map((q) => {
            if (q.id === id) {
              return {
                ...q,
                status: newStatus,
              };
            }

            return q;
          });

          this.PagingSignal.set({
            ...currentPaging,
            data: updatedData,
          });

          this.messageService.add({
            severity: 'success',
            summary: 'Status Updated',
            detail: `#${res.invoiceNo} has been ${newStatus}`,
          });

          this.cdr.markForCheck();
        },

        error: (err) => {
          this.loadingService.stop();

          this.messageService.add({
            severity: 'error',
            summary: 'Update Failed',
            detail: err.error?.error || 'Invalid status transition.',
          });
        },
      });
  }

  onPaymentFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.paymentFile = file;
    this.paymentFileName = file.name;
    this.paymentFileUrl = URL.createObjectURL(file);
  }

  RecordPayment(data: InvoiceDto) {
    this.selectedInvoice = data;

    this.paymentFG.reset({
      paymentNo: null,
      paymentDate: new Date(),
      paymentMode: null,
      amount: data.totalAmount - data.paidAmount,
      notes: null,
    });

    this.showPaymentDialog = true;

    this.cdr.markForCheck();
  }

  submitPayment() {
    if (!this.paymentFile) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Attachment required',
        detail: 'Please upload the payment attachment.',
      });
      return;
    }

    if (this.paymentFG.invalid) {
      ValidateAllFormFields(this.paymentFG);
      return;
    }

    const formData = new FormData();

    const val = this.paymentFG.value;

    formData.append('invoiceId', this.selectedInvoice.id);
    formData.append('clientId', this.selectedInvoice.clientId);
    formData.append('amount', val.amount);
    if (val.paymentNo && val.paymentNo.trim() !== '') {
      formData.append('paymentNo', val.paymentNo.trim());
    }
    formData.append('paymentDate', val.paymentDate.toISOString());
    formData.append('paymentMode', val.paymentMode);
    formData.append('notes', val.notes || '');

    if (this.paymentFile) {
      formData.append('attachment', this.paymentFile);
    }

    this.loadingService.start();

    this.invoiceService.MarkAsPaid(formData).subscribe({
      next: (res) => {
        this.loadingService.stop();

        const state = this.PagingSignal();

        const updated = state.data.map((x) => {
          if (x.id === this.selectedInvoice.id) {
            const newPaid = (x.paidAmount || 0) + val.amount;

            let status = 'PartiallyPaid';
            if (newPaid >= x.totalAmount) {
              status = 'Paid';
            }

            return {
              ...x,
              paidAmount: newPaid,
              status,
            };
          }
          return x;
        });

        this.PagingSignal.set({
          ...state,
          data: updated,
        });

        this.messageService.add({
          severity: 'success',
          summary: 'Payment Recorded',
          detail: `RM ${val.amount} recorded for Invoice ${this.selectedInvoice.invoiceNo}`,
        });

        this.showPaymentDialog = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loadingService.stop();
        console.error(err);
      },
    });
  }

  ActionClick(data: InvoiceDto, action: string) {
    if (data && action === 'Update') {
      this.router.navigate(['/invoices/sales/form'], {
        queryParams: { id: data?.id },
      });
    }
  }

  onMobilePageChange(event: { first?: number; rows?: number }): void {
    this.NextPage({
      first: event.first ?? 0,
      rows: event.rows ?? this.Query.PageSize,
    } as TableLazyLoadEvent);
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
