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
import { InvoiceService } from '../../../services/invoiceService.service';
import { LoadingService } from '../../../services/loading.service';
import { MenuItem, MessageService } from 'primeng/api';
import { UserService } from '../../../services/userService.service';
import { Subject, takeUntil } from 'rxjs';
import {
  BuildFilterText,
  BuildSortText,
  GridifyQueryExtend,
  PagingContent,
  ValidateAllFormFields,
} from '../../../shared/helpers/helpers';
import { InvoiceDto } from '../../../models/Invoice';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';

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
  ],
  template: `<div class="w-full min-h-[92.9vh] flex flex-col p-5">
      <div class="flex flex-row items-center gap-1 text-gray-500 tracking-wide">
        <div
          [routerLink]="'/dashboard'"
          class="cursor-pointer hover:text-gray-600"
        >
          Dashboard
        </div>
        /
        <div class="text-gray-700 font-semibold">Sales Invoice</div>
      </div>
      <div
        class="mt-3 border border-gray-200 rounded-md tracking-wide bg-white p-5 flex flex-col"
      >
        <div
          class="flex flex-col gap-3 xl:gap-0 xl:flex-row xl:items-center justify-between"
        >
          <div class="flex flex-col">
            <div class="text-[18px] text-gray-700 font-semibold">
              Sales Invoice
            </div>
            <div class="text-gray-500">
              View, create, and track all sales invoices
            </div>
          </div>
          <div class="flex flex-row items-center gap-2">
            <div class="w-full xl:min-w-[100px] relative">
              <input
                type="text"
                pInputText
                [(ngModel)]="search"
                class="w-full!"
                placeholder="Search by Invoice No"
                (keydown)="onKeyDown($event)"
              />
              <i
                class="pi pi-search absolute! top-3! right-2! text-gray-500!"
              ></i>
            </div>

            <p-button
              label="Generate Sales Invoice"
              [routerLink]="'/invoices/sales/form'"
              icon="pi pi-file-pdf"
              severity="info"
              styleClass="py-2! whitespace-nowrap!"
            ></p-button>
          </div>
        </div>
        <div class="mt-3">
          <p-table
            #fTable
            dataKey="id"
            [value]="PagingSignal().data"
            [paginator]="true"
            [rows]="Query.PageSize"
            [totalRecords]="PagingSignal().totalElements"
            [tableStyle]="{ 'min-width': '60rem' }"
            [showGridlines]="true"
            [rowsPerPageOptions]="[10, 20, 30, 50]"
            [lazy]="true"
            (onLazyLoad)="NextPage($event)"
          >
            <ng-template #header>
              <tr>
                <th
                  pSortableColumn="InvoiceNo"
                  class="bg-gray-100! text-center! w-[15%]!"
                >
                  <div class="flex flex-row justify-center items-center gap-2">
                    <div>Invoice No</div>
                    <p-sortIcon field="InvoiceNo" />
                  </div>
                </th>
                <th class="bg-gray-100! w-[30%]">Company</th>

                <th
                  pSortableColumn="InvoiceDate"
                  class="bg-gray-100! text-center! w-[10%]"
                >
                  <div class="flex flex-row justify-center items-center gap-2">
                    <div class="whitespace-nowrap">Invoice Date</div>
                    <p-sortIcon field="InvoiceDate" />
                  </div>
                </th>
                <th class="bg-gray-100! text-center! w-[15%]">Amount</th>

                <th
                  pSortableColumn="Status"
                  class="bg-gray-100! text-center! w-[10%]!"
                >
                  <div class="flex flex-row justify-center items-center gap-2">
                    <div>Status</div>
                    <p-sortIcon field="Status" />
                  </div>
                </th>
                <th class="bg-gray-100! text-center! w-[10%]">Action</th>
              </tr>
            </ng-template>
            <ng-template
              #body
              let-data
              let-rowIndex="rowIndex"
              let-expanded="expanded"
            >
              <tr>
                <td class="text-center! font-semibold!">
                  {{ data.invoiceNo }}
                </td>
                <td>
                  {{ data.client?.name }}
                </td>

                <td class="text-center!">
                  {{ data.invoiceDate | date: 'dd/MM/yyyy' }}
                </td>
                <td class="text-center!">
                  {{ data.totalAmount | currency: 'RM ' }}
                </td>
                <td class="text-center!">
                  <div class="flex justify-center">
                    <div
                      class="rounded-full px-4 text-[13px] py-0.5 font-medium w-fit whitespace-nowrap"
                      [ngClass]="{
                        'bg-orange-100 text-orange-600':
                          data.status === 'Draft' || data.status === 'Refunded',

                        'bg-blue-100 text-blue-600': data.status === 'Sent',

                        'bg-yellow-100 text-yellow-600':
                          data.status === 'PartiallyPaid',

                        'bg-green-100 text-green-600': data.status === 'Paid',

                        'bg-red-100 text-red-600':
                          data.status === 'Overdue' ||
                          data.status === 'Cancelled',
                      }"
                    >
                      {{ data.status }}
                    </div>
                  </div>
                </td>

                <td class="text-center!">
                  <div class="flex items-center justify-center">
                    <i
                      (click)="onEllipsisClick($event, data, menu)"
                      class="pi pi-ellipsis-h cursor-pointer"
                    ></i>
                  </div>
                </td>
              </tr>
            </ng-template>

            <ng-template #emptymessage>
              <tr>
                <td colspan="100%" class="border-x!">
                  <div class="text-center text-gray-500">
                    No sales invoice found in records.
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      </div>
    </div>
    <p-menu #menu [model]="menuItems" [popup]="true"></p-menu>

    <p-dialog
      [(visible)]="showPaymentDialog"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      styleClass="w-[92%] lg:w-[40%] rounded-xl"
    >
      <ng-template pTemplate="header">
        <div>
          <div class="text-lg font-semibold">Record Payment</div>
          <div class="text-sm text-gray-500 tracking-wide">
            Enter payment details for this invoice
          </div>
        </div>
      </ng-template>

      <div class="grid grid-cols-12 gap-4" [formGroup]="paymentFG">
        <div class="col-span-6 flex flex-col gap-1">
          <label for="">Payment No</label>
          <input
            type="text"
            pInputText
            class="w-full"
            placeholder="Auto-generated if empty"
            formControlName="paymentNo"
          />
          <small class="text-gray-500">Leave empty to auto-generate</small>
        </div>
        <div class="col-span-6 flex flex-col gap-1">
          <label>Payment Date <span class="text-red-500">*</span></label>
          <p-datepicker
            styleClass="w-full!"
            dateFormat="dd/mm/yy"
            [showIcon]="true"
            appendTo="body"
            formControlName="paymentDate"
          ></p-datepicker>
        </div>

        <div class="col-span-6 flex flex-col gap-1">
          <label>Payment Mode <span class="text-red-500">*</span></label>
          <p-select
            [options]="[
              { label: 'Cash', value: 'Cash' },
              { label: 'Bank Transfer', value: 'Bank Transfer' },
              { label: 'Cheque', value: 'Cheque' },
            ]"
            formControlName="paymentMode"
            appendTo="body"
          ></p-select>
        </div>

        <div class="col-span-6 flex flex-col gap-1">
          <label> Amount <span class="text-red-500">*</span> </label>

          <p-inputnumber
            styleClass="text-center!"
            formControlName="amount"
            inputStyleClass="w-full text-[13px]!"
            mode="currency"
            currency="MYR"
            locale="ms-MY"
            [max]="
              selectedInvoice?.totalAmount - (selectedInvoice?.paidAmount || 0)
            "
            [minFractionDigits]="2"
          ></p-inputnumber>

          <small class="text-gray-500 text-xs">
            Remaining amount: RM
            {{ remainingAmount | number: '1.2-2' }} </small
          ><small
            *ngIf="paymentFG.get('amount')?.errors?.['exceed']"
            class="text-red-500 text-xs"
          >
            Amount exceeds remaining balance
          </small>
        </div>

        <div class="col-span-12 flex flex-col gap-1">
          <label
            >Notes
            <span class="italic text-sm text-gray-500">(Optional)</span></label
          >
          <textarea
            pTextarea
            [cols]="30"
            [rows]="3"
            [autoResize]="true"
            class="w-full"
            formControlName="notes"
          ></textarea>
        </div>
        <div class="col-span-12 flex flex-row items-center gap-3 md:mt-3">
          <div>
            Attachment
            <span class="text-red-500">*</span>
          </div>

          :

          <input
            #file
            type="file"
            (change)="onPaymentFileSelected($event)"
            hidden
          />

          <p-button
            [label]="paymentFile ? 'Reupload' : 'Upload'"
            severity="secondary"
            icon="pi pi-upload"
            styleClass="border-gray-200!"
            size="small"
            (onClick)="file.click()"
          ></p-button>

          <a
            *ngIf="paymentFileName"
            [href]="paymentFileUrl"
            [download]="paymentFileName"
            target="_blank"
            class="bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm flex items-center gap-2"
          >
            <i class="pi pi-file text-yellow-600!"></i>

            <span class="truncate max-w-[200px]">
              {{ paymentFileName }}
            </span>
          </a>
        </div>
      </div>

      <ng-template pTemplate="footer">
        <div class="flex justify-end gap-2">
          <p-button
            label="Cancel"
            severity="secondary"
            (onClick)="showPaymentDialog = false"
          ></p-button>

          <p-button
            label="Save Payment"
            severity="info"
            (onClick)="submitPayment()"
          ></p-button>
        </div>
      </ng-template>
    </p-dialog>`,
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

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
