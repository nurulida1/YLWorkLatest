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
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { InvoiceService } from '../../../services/invoiceService.service';
import { LoadingService } from '../../../services/loading.service';
import { MenuItem, MessageService } from 'primeng/api';
import { Router, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import {
  BuildFilterText,
  BuildSortText,
  GridifyQueryExtend,
  PagingContent,
  ValidateAllFormFields,
} from '../../../shared/helpers/helpers';
import { InvoiceDto } from '../../../models/Invoice';
import { MenuModule } from 'primeng/menu';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { PaymentService } from '../../../services/paymentService.service';

@Component({
  selector: 'app-invoice',
  imports: [
    CommonModule,
    TableModule,
    FormsModule,
    InputTextModule,
    ButtonModule,
    RouterLink,
    MenuModule,
    DialogModule,
    InputNumberModule,
    SelectModule,
    ReactiveFormsModule,
    DatePickerModule,
  ],
  template: `<div class="min-h-screen w-full flex flex-col p-5">
      <div
        class="flex flex-row items-center gap-1 text-gray-500 text-[15px] tracking-wide"
      >
        <div
          [routerLink]="'/dashboard'"
          class="cursor-pointer hover:text-gray-600"
        >
          Dashboard
        </div>
        /
        <div class="text-gray-700 font-semibold">Invoices</div>
      </div>

      <div class="py-2 grid grid-cols-12 gap-3 justify-between">
        <div
          class="col-span-3 border bg-white border-gray-200 rounded-sm px-5 py-3 flex flex-col"
        >
          <div class="flex flex-row items-center justify-between">
            <div class="flex flex-col gap-1">
              <div class="font-thin text-gray-500">Total Invoices</div>
              <div class="font-semibold text-gray-700 text-[20px]">
                {{ dashboardCount?.totalAmount | currency: 'RM ' }}
              </div>
            </div>
            <div
              class="rounded-full w-10 h-10 flex items-center justify-center  bg-purple-500"
            >
              <i class="pi pi-receipt text-white! text-xl! text-shadow-xl!"></i>
            </div>
          </div>
          <div class="border-b border-gray-200 mt-2 mb-2"></div>
          <div class="flex flex-row items-center gap-1 text-sm">
            <div class="text-green-500">
              <i class="pi pi-arrow-up-left text-[10px]!"></i>
              {{ dashboardCount?.totalPercentage }}%
            </div>
            <div class="text-gray-400">from last month</div>
          </div>
        </div>
        <div
          class="col-span-3 border bg-white border-gray-200 rounded-sm px-5 py-3 flex flex-col"
        >
          <div class="flex flex-row items-center justify-between">
            <div class="flex flex-col gap-1">
              <div class="font-thin text-gray-500">Paid Invoices</div>
              <div class="font-semibold text-gray-700 text-[20px]">
                {{ dashboardCount?.paidAmount | currency: 'RM ' }}
              </div>
            </div>
            <div
              class="rounded-full w-10 h-10 flex items-center justify-center  bg-green-500"
            >
              <i
                class="pi pi-check-circle text-white! text-xl! text-shadow-xl!"
              ></i>
            </div>
          </div>
          <div class="border-b border-gray-200 mt-2 mb-2"></div>
          <div class="flex flex-row items-center gap-1 text-sm">
            <div class="text-green-500">
              <i class="pi pi-arrow-up-left text-[10px]!"></i>
              {{ dashboardCount?.paidPercentage }}%
            </div>
            <div class="text-gray-400">from last month</div>
          </div>
        </div>
        <div
          class="col-span-3 border bg-white border-gray-200 rounded-sm px-5 py-3 flex flex-col"
        >
          <div class="flex flex-row items-center justify-between">
            <div class="flex flex-col gap-1">
              <div class="font-thin text-gray-500">Pending Invoices</div>
              <div class="font-semibold text-gray-700 text-[20px]">
                {{ dashboardCount?.pendingAmount | currency: 'RM ' }}
              </div>
            </div>
            <div
              class="rounded-full w-10 h-10 flex items-center justify-center  bg-yellow-500"
            >
              <i
                class="pi pi-hourglass text-white! text-xl! text-shadow-xl!"
              ></i>
            </div>
          </div>
          <div class="border-b border-gray-200 mt-2 mb-2"></div>
          <div class="flex flex-row items-center gap-1 text-sm">
            <div class="text-green-500">
              <i class="pi pi-arrow-up-left text-[10px]!"></i>
              {{ dashboardCount?.pendingPercentage }}%
            </div>
            <div class="text-gray-400">from last month</div>
          </div>
        </div>
        <div
          class="col-span-3 border bg-white border-gray-200 rounded-sm px-5 py-3 flex flex-col"
        >
          <div class="flex flex-row items-center justify-between">
            <div class="flex flex-col gap-1">
              <div class="font-thin text-gray-500">Overdue Invoices</div>
              <div class="font-semibold text-gray-700 text-[20px]">
                {{ dashboardCount?.overdueAmount | currency: 'RM ' }}
              </div>
            </div>
            <div
              class="rounded-full w-10 h-10 flex items-center justify-center  bg-red-500"
            >
              <i class="pi pi-receipt text-white! text-xl! text-shadow-xl!"></i>
            </div>
          </div>
          <div class="border-b border-gray-200 mt-2 mb-2"></div>
          <div class="flex flex-row items-center gap-1 text-sm">
            <div class="text-red-500">
              <i class="pi pi-exclamation-circle text-[10px]!"></i>
              {{ dashboardCount?.overduePercentage }}%
            </div>
            <div class="text-gray-400">from last month</div>
          </div>
        </div>
      </div>
      <div
        class="border border-gray-200 rounded-md tracking-wide bg-white p-5 flex flex-col"
      >
        <div class="flex flex-row items-center justify-between">
          <div class="flex flex-col">
            <div class="text-[20px] text-gray-700 font-semibold">Invoices</div>
            <div class="text-gray-500 text-[15px]">
              View, create, and track all invoices
            </div>
          </div>
          <div class="flex flex-row items-center gap-2">
            <div class="min-w-[300px] relative">
              <input
                type="text"
                pInputText
                [(ngModel)]="search"
                class="w-full! text-[15px]!"
                placeholder="Search by invoice no"
              />
              <i
                class="pi pi-search absolute! top-3! right-2! text-gray-500!"
              ></i>
            </div>
            <p-button
              label="New Invoice"
              [routerLink]="'/invoices/form'"
              icon="pi pi-plus-circle"
              severity="info"
              size="small"
              styleClass="py-2! whitespace-nowrap!"
            ></p-button>
          </div>
        </div>
        <div class="mt-3">
          <p-table
            #fTable
            [value]="PagingSignal().data"
            [paginator]="true"
            [rows]="Query.PageSize"
            [totalRecords]="PagingSignal().totalElements"
            [tableStyle]="{ 'min-width': '90rem' }"
            showGridlines
            [rowsPerPageOptions]="[10, 20, 30, 50]"
            stripedRows="false"
            [lazy]="true"
            (onLazyLoad)="NextPage($event)"
            showGridlines
          >
            <ng-template #header>
              <tr>
                <th
                  pSortableColumn="InvoiceNo"
                  class="bg-gray-100! text-[15px]! text-center! w-[10%]!"
                >
                  <div class="flex flex-row justify-center items-center gap-2">
                    <div>Invoice No</div>
                    <p-sortIcon field="InvoiceNo" />
                  </div>
                </th>
                <th class="bg-gray-100! text-[15px]! text-center! w-[20%]">
                  Client / Vendor
                </th>
                <th
                  pSortableColumn="InvoiceDate"
                  class="bg-gray-100! text-[15px]! text-center! w-[10%]!"
                >
                  <div class="flex flex-row justify-center items-center gap-2">
                    <div>Created On</div>
                    <p-sortIcon field="InvoiceDate" />
                  </div>
                </th>
                <th class="bg-gray-100! text-[15px]! text-center! w-[10%]!">
                  Amount
                </th>
                <th class="bg-gray-100! text-[15px]! text-center! w-[10%]!">
                  Paid
                </th>
                <th
                  pSortableColumn="Status"
                  class="bg-gray-100! text-[15px]! text-center! w-[10%]!"
                >
                  <div class="flex flex-row justify-center items-center gap-2">
                    <div>Status</div>
                    <p-sortIcon field="Status" />
                  </div>
                </th>
                <th
                  pSortableColumn="Status"
                  class="bg-gray-100! text-[15px]! text-center! w-[15%]!"
                >
                  <div class="flex flex-row justify-center items-center gap-2">
                    <div>Payment Mode</div>
                    <p-sortIcon field="Status" />
                  </div>
                </th>
                <th
                  pSortableColumn="Status"
                  class="bg-gray-100! text-[15px]! text-center! w-[10%]!"
                >
                  <div class="flex flex-row justify-center items-center gap-2">
                    <div>Due Date</div>
                    <p-sortIcon field="Status" />
                  </div>
                </th>
                <th class="bg-gray-100! text-[15px]! text-center! w-[10%]">
                  Action
                </th>
              </tr>
            </ng-template>
            <ng-template #body let-data>
              <tr>
                <td class="text-center! text-[14px]! font-semibold!">
                  {{ data.invoiceNo }}
                </td>
                <td class="text-center! text-[14px]!">
                  {{ data.client?.name ?? data.supplier?.name }}
                </td>
                <td class="text-center! text-[14px]!">
                  {{ data.invoiceDate | date }}
                </td>
                <td class="text-center! text-[14px]!">
                  {{ data.totalAmount | currency: 'RM ' }}
                </td>
                <td class="text-center! text-[14px]!">
                  {{ data.paidAmount | currency: 'RM ' }}
                </td>
                <td class="text-center! text-[14px]!">
                  <div class="flex justify-center">
                    <div
                      class="rounded-full px-4 text-[13px] py-0.5 font-medium w-fit whitespace-nowrap"
                      [ngClass]="{
                        'bg-red-100 text-red-600':
                          data.status === 'Cancelled' ||
                          data.status === 'Overdue' ||
                          (data.status !== 'Paid' && isOverdue(data)),
                        'bg-green-100 text-green-600': data.status === 'Paid',
                        'bg-yellow-100 text-yellow-600':
                          data.status === 'Unpaid' && !isOverdue(data),
                        'bg-blue-100 text-blue-600':
                          data.status === 'Draft' ||
                          data.status === 'Partially Paid',
                      }"
                    >
                      {{
                        data.status !== 'Paid' && isOverdue(data)
                          ? 'Overdue'
                          : data.status
                      }}
                    </div>
                  </div>
                </td>

                <td class="text-center! text-[14px]!">
                  {{ data.paymentMode }}
                </td>
                <td class="text-center! text-[14px]!">
                  {{ data.dueDate | date: 'dd MMM, yyyy' }}
                </td>

                <td class="text-center! text-[14px]!">
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
                  <div class="text-[15px] text-center text-gray-500">
                    No invoice found in records.
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      </div>
    </div>
    <p-menu
      #menu
      [model]="menuItems"
      [popup]="true"
      [style]="{ transform: 'translate(20px, 8px)' }"
    ></p-menu>

    <p-dialog
      [(visible)]="showDialog"
      [modal]="true"
      [style]="{ width: '850px' }"
      styleClass="preview-dialog rounded-xl! overflow-hidden"
      [maskStyle]="{ 'overflow-y': 'auto' }"
      appendTo="body"
    >
      <ng-template #headless>
        <div class="bg-gray-50 p-6 border-b border-gray-100 flex-none">
          <div class="flex justify-between items-start tracking-wide">
            <div>
              <p class="text-xl font-semibold text-gray-600">
                Recording payment for:
                <strong>#{{ selectedInvoice?.invoiceNo }}</strong>
              </p>
              <span class="block mt-1 text-gray-500">
                Balance Due:
                <span class="text-red-600 font-semibold">
                  {{
                    (selectedInvoice?.totalAmount || 0) -
                      (selectedInvoice?.paidAmount || 0) | currency: 'RM '
                  }}
                </span>
              </span>
            </div>
          </div>
        </div>
        <div class="p-6 flex-1 overflow-y-auto">
          <div [formGroup]="paymentForm" class="grid grid-cols-12 gap-3">
            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
              <div>Payment No</div>
              <input
                type="text"
                pInputText
                class="w-full text-[15px]!"
                formControlName="paymentNo"
              />
            </div>
            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
              <div>Client/Vendor</div>
              <p-select
                [options]="
                  sourceType === 'Client'
                    ? clientSelections
                    : supplierSelections
                "
                appendTo="body"
                styleClass="text-[15px]!"
                inputStyleClass="text-[15px]!"
                panelStyleClass="text-[15px]!"
                [formControlName]="
                  sourceType === 'Client' ? 'clientId' : 'supplierId'
                "
                [filter]="true"
              ></p-select>
            </div>

            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
              <div>Invoice</div>
              <p-select
                [options]="invoiceSelections || []"
                appendTo="body"
                styleClass="text-[15px]!"
                inputStyleClass="text-[15px]!"
                panelStyleClass="text-[15px]!"
                formControlName="invoiceId"
                [filter]="true"
              ></p-select>
            </div>
            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
              <div>Reference No</div>
              <input
                type="text"
                pInputText
                class="w-full text-[15px]!"
                formControlName="referenceNo"
              />
            </div>
            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
              <div>Payment Date</div>
              <p-datepicker
                appendTo="body"
                dateFormat="dd/mm/yy"
                [showIcon]="true"
                styleClass="w-full"
                inputStyleClass="w-full! text-[15px]!"
                formControlName="paymentDate"
              ></p-datepicker>
            </div>
            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
              <div>Payment Mode <span class="text-red-500">*</span></div>
              <p-select
                appendTo="body"
                styleClass="w-full"
                inputStyleClass="w-full! text-[15px]!"
                formControlName="paymentMode"
                [options]="[
                  { label: 'Cash', value: 'Cash' },
                  { label: 'Cheque', value: 'Cheque' },
                  { label: 'Bank Transfer', value: 'Bank Transfer' },
                  { label: 'Paypal', value: 'Paypal' },
                ]"
              ></p-select>
            </div>

            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
              <div>Amount <span class="text-red-500">*</span></div>
              <p-inputnumber
                appendTo="body"
                styleClass="w-full"
                inputStyleClass="w-full !text-[15px]"
                formControlName="amount"
                mode="currency"
                currency="MYR"
                locale="en-MY"
                [useGrouping]="true"
                [minFractionDigits]="2"
                [maxFractionDigits]="2"
              >
              </p-inputnumber>
            </div>
            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
              <div>Paid Amount <span class="text-red-500">*</span></div>
              <p-inputnumber
                appendTo="body"
                styleClass="w-full"
                inputStyleClass="w-full text-[15px]! bg-gray-200! text-gray-500!"
                formControlName="paidAmount"
                mode="currency"
                currency="MYR"
                locale="en-MY"
                [useGrouping]="true"
                [minFractionDigits]="2"
                [maxFractionDigits]="2"
                [readonly]="true"
              >
              </p-inputnumber>
            </div>

            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
              <div>Due Amount <span class="text-red-500">*</span></div>
              <p-inputnumber
                appendTo="body"
                styleClass="w-full"
                inputStyleClass="w-full text-[15px]! bg-gray-200! text-gray-500!"
                formControlName="dueAmount"
                mode="currency"
                currency="MYR"
                locale="en-MY"
                [useGrouping]="true"
                [minFractionDigits]="2"
                [maxFractionDigits]="2"
                [readonly]="true"
              >
              </p-inputnumber>
            </div>

            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
              <div>Notes</div>
              <input
                type="text"
                pInputText
                class="w-full"
                formControlName="notes"
              />
            </div>

            <div class="col-span-12 flex flex-col gap-1">
              <div>Attachment <span class="text-red-500">*</span></div>
              <div
                class="p-5 bg-gray-100 border-2 rounded-lg border-gray-300 border-dashed flex flex-col items-center justify-center"
              >
                <div *ngIf="paymentForm.get('attachment')?.value" class="mb-2">
                  <div
                    *ngIf="isImage(paymentForm.get('attachment')?.value)"
                    class="w-20 h-20 border border-gray-200 rounded overflow-hidden shadow-sm"
                  >
                    <img
                      [src]="paymentForm.get('attachment')?.value"
                      class="w-full h-full object-cover"
                    />
                  </div>

                  <div
                    *ngIf="!isImage(paymentForm.get('attachment')?.value)"
                    class="flex flex-col items-center"
                  >
                    <a
                      [href]="paymentForm.get('attachment')?.value"
                      download="attachment"
                      class="flex flex-col items-center gap-1 p-3 bg-white border rounded-md text-blue-600 hover:text-blue-800 transition-all shadow-sm"
                    >
                      <span class="pi pi-file-pdf text-3xl"></span>
                      <span class="text-[12px] font-medium">Download File</span>
                    </a>
                  </div>
                </div>

                <div
                  class="pi pi-cloud-upload text-gray-400 !text-3xl"
                  *ngIf="!paymentForm.get('attachment')?.value"
                ></div>

                <div
                  class="text-gray-500 text-[14px] mt-2 tracking-wide text-center"
                >
                  <ng-container *ngIf="!paymentForm.get('attachment')?.value">
                    Drop your attachment here or
                    <a
                      class="text-blue-500 hover:underline cursor-pointer"
                      (click)="fileInput.click()"
                      >Browse</a
                    >
                  </ng-container>

                  <ng-container *ngIf="paymentForm.get('attachment')?.value">
                    <a
                      class="text-blue-500 hover:underline cursor-pointer text-xs"
                      (click)="fileInput.click()"
                      >Change File</a
                    >
                    <span class="mx-2">|</span>
                    <a
                      class="text-red-500 hover:underline cursor-pointer text-xs"
                      (click)="paymentForm.get('attachment')?.setValue(null)"
                      >Remove</a
                    >
                  </ng-container>
                </div>
              </div>

              <input
                #fileInput
                type="file"
                (change)="onFileSelected($event)"
                class="hidden"
                accept="image/*,.pdf,.doc,.docx"
              />
              <input
                type="file"
                #fileInput
                style="display: none"
                accept="*"
                (change)="onFileSelected($event)"
              />
            </div>
          </div>
        </div>
        <div
          class="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 flex-none"
        >
          <p-button
            label="Cancel"
            severity="secondary"
            styleClass="border-gray-200!"
            (onClick)="showDialog = false"
          ></p-button>
          <p-button
            label="Save"
            icon="pi pi-check-circle"
            severity="info"
            (onClick)="AddPayment()"
          ></p-button>
        </div>
      </ng-template>
    </p-dialog>`,
  styleUrl: './invoice.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Invoice implements OnInit, OnDestroy {
  @ViewChild('fTable') fTable?: Table;

  private readonly invoiceService = inject(InvoiceService);
  private readonly loadingService = inject(LoadingService);
  private readonly messageService = inject(MessageService);
  private readonly paymentService = inject(PaymentService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  PagingSignal = signal<PagingContent<InvoiceDto>>(
    {} as PagingContent<InvoiceDto>,
  );

  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  search: string = '';
  title: string = 'Add New Invoice';
  paymentForm!: FormGroup;

  showDialog: boolean = false;

  menuItems: MenuItem[] = [];
  clientSelections: any[] = [];
  supplierSelections: any[] = [];
  invoiceSelections: any[] = [];
  selectedInvoice: InvoiceDto | null = null;

  dashboardCount: any | null = null;
  sourceType: 'Vendor' | 'Client' = 'Client';

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 10;
    this.Query.Filter = null;
    this.Query.OrderBy = 'CreatedAt desc';
    this.Query.Select = null;
    this.Query.Includes = 'Client,Supplier,InvoiceItems';
  }

  ngOnInit(): void {
    this.initForm();
    this.GetSummary();
  }

  GetSummary() {
    this.loadingService.start();
    this.invoiceService
      .GetSummary()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();
          this.dashboardCount = res;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loadingService.stop();
        },
      });
  }

  initForm() {
    this.paymentForm = new FormGroup({
      paymentNo: new FormControl<string | null>(null),
      clientId: new FormControl<string | null>(null),
      supplierId: new FormControl<string | null>(null),
      invoiceId: new FormControl<string | null>(null),
      referenceNo: new FormControl<string | null>(null),
      paymentDate: new FormControl<Date | null>(null, Validators.required),
      paymentMode: new FormControl<string | null>(null),
      amount: new FormControl<number | null>(null, Validators.required),
      paidAmount: new FormControl<number | null>(null),
      dueAmount: new FormControl<number | null>(null),
      notes: new FormControl<string | null>(null),
      attachment: new FormControl<string | null>(null),
    });
  }

  GetData() {
    this.loadingService.start();
    this.invoiceService
      .GetMany(this.Query)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.PagingSignal.set(res);
          this.loadingService.stop();
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

    this.Query.Filter = null;
    this.GetData();
  }

  ActionClick(data: InvoiceDto | null, action: string) {
    if (action === 'Update') {
      this.router.navigate(['/invoices/form'], {
        queryParams: { id: data?.id },
      });
    } else if (action === 'Delete' && data) {
      this.loadingService.start();
      this.invoiceService
        .Delete(data.id)
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe({
          next: (res) => {
            // Remove the deleted item from the current PagingSignal data
            const currentPaging = this.PagingSignal();
            const updatedData = currentPaging.data.filter(
              (item) => item.id !== data.id,
            );

            this.PagingSignal.set({
              ...currentPaging,
              data: updatedData,
              totalElements: currentPaging.totalElements - 1, // Update total count
            });
            this.cdr.markForCheck();
            this.messageService.add({
              severity: 'success',
              summary: 'Deleted',
              detail: `Invoice ${data.invoiceNo} deleted`,
            });
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Delete Failed',
              detail: err.error?.error || 'Something went wrong',
            });
          },
          complete: () => {
            this.loadingService.stop();
          },
        });
    } else if (action === 'Clone' && data) {
      this.loadingService.start();

      this.invoiceService
        .Clone(data.id)
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe({
          next: (clonedInvoice) => {
            const currentPaging = this.PagingSignal();

            // Add cloned item to top of list
            const updatedData = [clonedInvoice, ...currentPaging.data];

            this.PagingSignal.set({
              ...currentPaging,
              data: updatedData,
              totalElements: currentPaging.totalElements + 1,
            });

            this.cdr.markForCheck();

            this.messageService.add({
              severity: 'success',
              summary: 'Cloned',
              detail: `Invoice ${data.invoiceNo} cloned successfully`,
            });
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Clone Failed',
              detail: err.error?.error || 'Something went wrong',
            });
          },
          complete: () => {
            this.loadingService.stop();
          },
        });
    } else if (action === 'AddPayment' && data) {
      this.selectedInvoice = data;
      this.sourceType = data.supplierId ? 'Vendor' : 'Client';
      this.paymentForm.patchValue({
        ...data,
        paymentNo: `PAY-${data.invoiceNo}`,
        invoiceId: data.id,
        paidAmount: data.paidAmount ?? 0,
        dueAmount: data.totalAmount - (data.paidAmount ?? 0),
      });
      this.getDropdown();
      this.showDialog = true;
      this.cdr.markForCheck();
    }
  }

  getDropdown() {
    this.loadingService.start();
    this.paymentService
      .GetDropdown()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();

          this.clientSelections = res.clients
            .map((c: any) => ({
              label: c.name,
              value: c.id,
            }))
            .sort((a: any, b: any) => a.label.localeCompare(b.label));

          this.supplierSelections = res.suppliers
            .map((s: any) => ({
              label: s.name,
              value: s.id,
            }))
            .sort((a: any, b: any) => a.label.localeCompare(b.label));

          this.invoiceSelections = res.invoices
            .map((i: any) => ({
              label: i.invoiceNo,
              value: i.id,
            }))
            .sort((a: any, b: any) => a.label.localeCompare(b.label));

          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loadingService.stop();
        },
      });
  }

  onEllipsisClick(event: any, invoice: InvoiceDto, menu: any) {
    this.menuItems = [
      {
        label: 'Edit',
        icon: 'pi pi-pencil',
        disabled: ['Paid', 'Cancelled'].includes(invoice.status),
        command: () => this.ActionClick(invoice, 'Update'),
      },
      {
        label: 'Add Payment',
        icon: 'pi pi-money-bill', // or 'pi pi-wallet'
        // Only show if the invoice actually needs a payment
        visible:
          invoice.status === 'Unpaid' || invoice.status === 'PartiallyPaid',
        command: () => this.ActionClick(invoice, 'AddPayment'),
      },
      {
        label: 'Clone as Invoice',
        icon: 'pi pi-receipt',
        command: () => this.ActionClick(invoice, 'Clone'),
      },
      { separator: true },
      {
        label: 'Download as PDF',
        icon: 'pi pi-file-pdf',
        command: () => this.ActionClick(invoice, 'Download'),
      },
      {
        label: 'Delete',
        icon: 'pi pi-trash',
        visible: invoice.status === 'Unpaid' || invoice.status === 'Draft',
        styleClass: 'p-menuitem-text-danger', // PrimeNG's standard way to color text red
        command: () => this.ActionClick(invoice, 'Delete'),
      },
    ];
    menu.toggle(event);
  }

  AddPayment() {
    if (this.paymentForm.valid) {
      this.loadingService.start();

      // Capture form values before reset
      const formValue = this.paymentForm.getRawValue();
      const invoiceId = formValue.invoiceId;
      const paymentAmount = formValue.amount; // The amount being paid now

      this.paymentService
        .Create(formValue)
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe({
          next: (res) => {
            this.loadingService.stop();

            this.PagingSignal.update((state) => ({
              ...state,
              // Ensure property name matches your state (Data vs data)
              data: state.data.map((item: any) => {
                if (item.id === invoiceId) {
                  const updatedPaidAmount =
                    (item.paidAmount || 0) + paymentAmount;
                  const isFullyPaid = updatedPaidAmount >= item.totalAmount;

                  return {
                    ...item,
                    paidAmount: updatedPaidAmount,
                    status: isFullyPaid ? 'Paid' : 'PartiallyPaid',
                  };
                }
                return item;
              }),
            }));

            // 2. Update dashboardCount locally
            if (this.dashboardCount && this.selectedInvoice) {
              // Safe date conversion
              const dueDate = this.selectedInvoice.dueDate;
              const isOverdue = dueDate
                ? new Date(dueDate) < new Date()
                : false;

              // Capture payment amount from form
              const amountPaidNow = paymentAmount || 0;

              this.dashboardCount = {
                ...this.dashboardCount,
                paidAmount:
                  (this.dashboardCount.paidAmount || 0) + amountPaidNow,

                // Logic to subtract from the correct bucket
                pendingAmount: !isOverdue
                  ? Math.max(
                      0,
                      (this.dashboardCount.pendingAmount || 0) - amountPaidNow,
                    )
                  : this.dashboardCount.pendingAmount,

                overdueAmount: isOverdue
                  ? Math.max(
                      0,
                      (this.dashboardCount.overdueAmount || 0) - amountPaidNow,
                    )
                  : this.dashboardCount.overdueAmount,
              };
            }

            // Define this at the top of your next() block
            const paidAmt = this.paymentForm.get('amount')?.value;
            const formattedAmount = new Intl.NumberFormat('en-MY', {
              style: 'currency',
              currency: 'MYR',
            }).format(paidAmt);

            this.messageService.add({
              severity: 'success',
              summary: 'Payment Confirmed',
              detail: `${formattedAmount} applied to ${this.selectedInvoice?.invoiceNo}.`,
              life: 5000,
            });

            this.showDialog = false;
            this.paymentForm.reset();
            this.cdr.markForCheck();
          },
          error: (err) => {
            this.loadingService.stop();
          },
        });
    } else {
      ValidateAllFormFields(this.paymentForm);
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        const base64String = e.target.result;

        this.paymentForm.patchValue({
          attachment: base64String,
        });

        this.cdr.markForCheck();
      };

      reader.readAsDataURL(file);
    }
  }

  isImage(value: string | null): boolean {
    if (!value) return false;

    // Check if it's a Base64 image
    if (value.startsWith('data:image/')) return true;

    // Check if it's a URL ending in common image extensions
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
    const urlPart = value.split('?')[0].toLowerCase(); // Remove query params if any
    return imageExtensions.some((ext) => urlPart.endsWith('.' + ext));
  }

  isOverdue(data: any): boolean {
    if (!data?.dueDate || data?.status === 'Paid') return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to compare dates only

    const dateToCheck = new Date(data?.dueDate);
    return dateToCheck < today;
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
