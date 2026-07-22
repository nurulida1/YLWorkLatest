import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { LoadingService } from '../../../services/loading.service';
import { MenuItem, MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import {
  BuildFilterText,
  buildFormData,
  BuildSortText,
  GridifyQueryExtend,
  PagingContent,
  ValidateAllFormFields,
} from '../../../shared/helpers/helpers';
import { GoodsReceivingDto } from '../../../models/GoodsReceiving';
import { GoodsReceivingService } from '../../../services/goodsReceivingService';
import { MenuModule } from 'primeng/menu';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { DrawerModule } from 'primeng/drawer';
import { CheckboxModule } from 'primeng/checkbox';
import { InvoiceService } from '../../../services/invoiceService.service';

@Component({
  selector: 'app-goods-receiving',
  imports: [
    CommonModule,
    ButtonModule,
    InputTextModule,
    ButtonModule,
    FormsModule,
    RouterLink,
    TableModule,
    MenuModule,
    ReactiveFormsModule,
    InputNumberModule,
    TextareaModule,
    SelectModule,
    DialogModule,
    DatePickerModule,
    DrawerModule,
    DialogModule,
    CheckboxModule,
  ],
  template: `<div
      class="w-full min-h-[92.9vh] flex flex-col p-6 bg-slate-50/50"
    >
      <div
        class="text-sm flex flex-row items-center gap-1 text-gray-500 tracking-wide"
      >
        <div
          [routerLink]="'/dashboard'"
          class="cursor-pointer hover:text-blue-600 transition-colors"
        >
          Dashboard
        </div>
        <span class="text-gray-400">/</span>
        <div class="text-gray-800 font-medium">Goods Received Notes</div>
      </div>

      <div
        class="mt-3 border border-gray-200 rounded-md tracking-wide bg-white p-5 flex flex-col"
      >
        <div
          class="flex flex-col gap-3 xl:gap-0 xl:flex-row xl:items-center justify-between"
        >
          <div class="flex flex-col gap-0.5">
            <div class="text-[18px] text-gray-700 font-semibold">
              Goods Received Notes
            </div>
            <div class="text-gray-500">
              Manage, track, and process customer goods received notes and
              fulfillment statuses
            </div>
          </div>

          <div class="flex flex-row items-center gap-3">
            <div class="w-full lg:w-[260px] relative">
              <input
                type="text"
                pInputText
                [(ngModel)]="search"
                class="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Search by GRN No..."
                (keydown)="onKeyDown($event)"
              />
            </div>

            <p-button
              label="Create Stock GRN"
              (onClick)="ActionClick(null, 'Create')"
              icon="pi pi-plus"
              severity="info"
              styleClass="py-2 px-4 text-sm font-medium whitespace-nowrap shadow-sm rounded-lg"
            ></p-button>
          </div>
        </div>

        <div class="mt-4">
          <p-table
            #fTable
            dataKey="id"
            [value]="PagingSignal().data"
            [paginator]="true"
            [rows]="Query.PageSize"
            [totalRecords]="PagingSignal().totalElements"
            [tableStyle]="{ 'min-width': '90rem' }"
            [showGridlines]="true"
            [rowsPerPageOptions]="[10, 20, 30, 50]"
            [lazy]="true"
            (onLazyLoad)="NextPage($event)"
          >
            <ng-template #header>
              <tr class="border-b border-gray-200 bg-gray-50/70">
                <th
                  pSortableColumn="GRNNO"
                  class="bg-gray-100! text-left! py-3.5 px-4 font-semibold text-gray-600 tracking-wider w-[10%]"
                >
                  <div class="flex items-center gap-1.5">
                    <span>GRN Number</span>
                    <p-sortIcon field="GRNNO" class="text-gray-400" />
                  </div>
                </th>
                <th
                  class="bg-gray-100! text-center! py-3.5 px-4 font-semibold text-gray-600 tracking-wider w-[15%]"
                >
                  Purchase Order No
                </th>
                <th
                  class="bg-gray-100! text-left! py-3.5 px-4 font-semibold text-gray-600 tracking-wider w-[25%]"
                >
                  Supplier
                </th>
                <th
                  class="bg-gray-100! text-center! py-3.5 px-4 font-semibold text-gray-600 tracking-wider w-[10%]"
                >
                  Account No
                </th>

                <th
                  class="bg-gray-100! text-center! py-3.5 px-4 font-semibold text-gray-600 tracking-wider w-[10%]"
                >
                  Total Amount
                </th>
                <th
                  pSortableColumn="Status"
                  class="bg-gray-100! text-center! py-3.5 px-4 font-semibold text-gray-600 tracking-wider w-[10%]"
                >
                  <div class="flex items-center justify-center gap-1.5">
                    <span>Status</span>
                    <p-sortIcon field="Status" class="text-gray-400" />
                  </div>
                </th>
                <th
                  class="bg-gray-100! text-center! py-3.5 px-4 font-semibold text-gray-600 tracking-wider w-[8%]"
                >
                  Actions
                </th>
              </tr>
            </ng-template>

            <ng-template #body let-data let-rowIndex="rowIndex">
              <tr
                class="hover:bg-slate-50/80 border-b border-gray-100 transition-colors"
              >
                <td class="py-3 px-4 font-bold">
                  {{ data.grnNo }}
                </td>
                <td class="py-3 px-4 text-gray-700 text-center! font-medium">
                  <a
                    class="text-blue-500 font-bold cursor-pointer"
                    [routerLink]="'/purchase-orders/details'"
                    [queryParams]="{ id: data.purchaseOrderId }"
                    >{{ data.purchaseOrder?.purchaseOrderNo }}</a
                  >
                </td>
                <td class="py-3 px-4 text-gray-600">
                  {{ data.supplier?.name }}
                </td>
                <td class="py-3 px-4 text-center! text-gray-700 font-medium">
                  {{ data.supplier?.acNo }}
                </td>

                <td class="py-3 px-4 text-center! text-gray-600">
                  {{ data.totalAmount | currency: 'RM ' }}
                </td>
                <td class="py-3 px-4 text-center">
                  <div class="flex flex-col items-center gap-1">
                    <span
                      class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold text-sm"
                      [ngClass]="{
                        'bg-amber-100 text-amber-700 border border-amber-200':
                          data.status === 'Draft',
                        'bg-orange-100 text-orange-700 border border-orange-200':
                          data.status === 'Reviewed',
                        'bg-blue-100 text-blue-700 border border-blue-200':
                          data.status === 'Approved' ||
                          data.status === 'InProgress',
                        'bg-purple-100 text-purple-700 border border-purple-200':
                          data.status === 'Sent' || data.status === 'Issued',
                        'bg-cyan-100 text-cyan-700 border border-cyan-200':
                          data.status === 'PartiallyReceived' ||
                          data.status === 'PartiallyShipped',
                        'bg-emerald-100 text-emerald-700 border border-emerald-200':
                          data.status === 'Confirmed',
                        'bg-rose-100 text-rose-700 border border-rose-200':
                          data.status === 'Rejected' ||
                          data.status === 'Cancelled',
                      }"
                    >
                      <span
                        class="w-1.5 h-1.5 rounded-full"
                        [ngClass]="{
                          'bg-amber-500': data.status === 'Draft',
                          'bg-orange-500': data.status === 'Reviewed',
                          'bg-blue-500':
                            data.status === 'Approved' ||
                            data.status === 'InProgress',
                          'bg-purple-500':
                            data.status === 'Sent' || data.status === 'Issued',
                          'bg-cyan-500':
                            data.status === 'PartiallyReceived' ||
                            data.status === 'PartiallyShipped',
                          'bg-emerald-500': data.status === 'Confirmed',
                          'bg-rose-500':
                            data.status === 'Rejected' ||
                            data.status === 'Cancelled',
                        }"
                      ></span>

                      {{ data.status }}
                    </span>
                  </div>
                </td>
                <td class="py-3 px-4 text-center">
                  <div class="flex items-center justify-center">
                    <button
                      (click)="onEllipsisClick($event, data, menu)"
                      class="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none"
                    >
                      <i class="pi pi-ellipsis-h text-base"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </ng-template>

            <ng-template #emptymessage>
              <tr>
                <td colspan="100%" class="py-12 border-b border-gray-100">
                  <div class="flex flex-col items-center justify-center gap-2">
                    <i class="pi pi-folder-open text-3xl text-gray-300"></i>
                    <div class="text-sm font-medium text-gray-500">
                      No goods received notes found in records.
                    </div>
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
      [(visible)]="invoiceDialog"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      styleClass="rounded-xl overflow-hidden w-[95%] max-w-[900px] shadow-2xl border-0"
      [maskStyle]="{
        'overflow-y': 'auto',
        'background-color': 'rgba(15, 23, 42, 0.4)',
        'backdrop-filter': 'blur(4px)',
      }"
      appendTo="body"
    >
      <ng-template #headless>
        <div
          class="bg-slate-50 px-6 py-5 border-b border-gray-200/80 flex-none flex justify-between items-start gap-4"
        >
          <div>
            <h1
              class="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2"
            >
              <i class="pi pi-receipt text-blue-600 text-lg"></i>
              Add Supplier Invoice
            </h1>
            <p class="text-sm text-gray-500 mt-1 leading-relaxed">
              Verify corporate line items and establish matching invoice numbers
              to log the billing record into accounts payable.
            </p>
          </div>
          <p-button
            icon="pi pi-times"
            [rounded]="true"
            [text]="true"
            severity="secondary"
            styleClass="hover:bg-gray-200/60 text-gray-400 hover:text-gray-600 transition-colors"
            (onClick)="invoiceDialog = false"
          ></p-button>
        </div>

        <div
          class="p-6 overflow-y-auto max-h-[70vh] bg-white flex flex-col gap-5"
        >
          <div
            class="bg-slate-50/80 rounded-lg p-3.5 border border-slate-200/60 flex items-center justify-between"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-9 h-9 rounded-md bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100"
              >
                <i class="pi pi-building text-sm"></i>
              </div>
              <div>
                <div
                  class="text-xs font-semibold text-gray-400 uppercase tracking-wider"
                >
                  Associated Supplier
                </div>
                <div class="font-bold text-gray-800 mt-0.5">
                  {{ selectedGRN?.supplier?.name }}
                </div>
              </div>
            </div>
            <div class="text-right text-sm text-gray-500 font-medium">
              GRN Code:
              <span
                class="font-mono text-base text-gray-900 font-bold bg-gray-100 px-1.5 py-0.5 rounded"
                >{{ selectedGRN?.grnNo }}</span
              >
            </div>
          </div>

          <div
            [formGroup]="invoiceForm"
            class="grid grid-cols-12 gap-x-4 gap-y-3 text-sm"
          >
            <div class="col-span-12 md:col-span-6 flex flex-col gap-1.5">
              <label class="font-semibold text-gray-700"
                >Supplier Invoice No <span class="text-rose-500">*</span></label
              >
              <input
                pInputText
                class="w-full text-sm"
                placeholder="e.g. INV-2026-991"
                formControlName="invoiceNo"
              />
            </div>

            <div class="col-span-12 md:col-span-6 flex flex-col gap-1.5">
              <label class="font-semibold text-gray-700"
                >Invoice Date <span class="text-rose-500">*</span></label
              >
              <p-datepicker
                appendTo="body"
                [showIcon]="true"
                styleClass="w-full"
                inputStyleClass="w-full text-sm"
                dateFormat="dd/mm/yy"
                formControlName="invoiceDate"
              ></p-datepicker>
            </div>

            <div class="col-span-12 md:col-span-6 flex flex-col gap-1.5">
              <label class="font-semibold text-gray-700"
                >Payment Due Date <span class="text-rose-500">*</span></label
              >
              <p-datepicker
                appendTo="body"
                [showIcon]="true"
                styleClass="w-full"
                inputStyleClass="w-full text-sm"
                dateFormat="dd/mm/yy"
                formControlName="dueDate"
              ></p-datepicker>
            </div>

            <div class="col-span-12 md:col-span-6 flex flex-col gap-1.5">
              <label class="font-semibold text-gray-700"
                >Internal Remarks</label
              >
              <input
                formControlName="remarks"
                pInputText
                class="w-full text-sm"
                placeholder="Optional notes for account processing..."
              />
            </div>

            <div
              class="col-span-12 flex flex-col gap-2 mt-2 pt-4 border-t border-gray-100"
            >
              <label
                class="text-xs font-semibold text-gray-600 uppercase tracking-wider"
              >
                Supplier Invoice Attachment
                <span class="text-rose-500">*</span>
              </label>

              <div class="flex flex-wrap items-center gap-3">
                <input
                  #file
                  type="file"
                  (change)="onFileSelected($event)"
                  hidden
                />

                <div
                  class="p-3 border border-dashed border-gray-200 w-full flex flex-row items-center justify-between"
                >
                  <a
                    *ngIf="selectedFileName"
                    [href]="selectedFileUrl"
                    [download]="selectedFileName"
                    target="_blank"
                    class="text-sm text-blue-500 flex flex-row items-center gap-2 cursor-pointer hover:underline"
                  >
                    <i
                      class="pi pi-file text-blue-500 group-hover:scale-105 transition-transform"
                    ></i>
                    <span class="truncate max-w-[280px]">{{
                      selectedFileName
                    }}</span>
                  </a>
                  <div class="flex flex-row gap-2">
                    <p-button
                      [label]="
                        invoiceForm.get('attachment')?.value
                          ? 'Replace Document'
                          : 'Upload Invoice Document'
                      "
                      severity="secondary"
                      icon="pi pi-upload"
                      size="small"
                      (onClick)="file.click()"
                    ></p-button>
                    <p-button
                      *ngIf="invoiceForm.get('attachment')?.value"
                      severity="danger"
                      size="small"
                      icon="pi pi-trash"
                      (onClick)="RemoveAttachment()"
                    ></p-button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-2 mt-2">
            <div
              class="text-sm tracking-wide font-bold text-gray-800 flex items-center gap-1.5"
            >
              <span>Billing Items Breakdown</span>
              <span class="text-xs font-normal text-gray-500"
                >({{ invoiceItems.controls.length }} rows found)</span
              >
            </div>

            <div
              class="border border-gray-200 rounded-lg overflow-hidden shadow-xs"
            >
              <p-table
                [value]="invoiceItems.controls"
                [showGridlines]="false"
                styleClass="p-datatable-sm"
                [tableStyle]="{ 'min-width': '50rem' }"
              >
                <ng-template #header>
                  <tr
                    class="bg-slate-50 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wider"
                  >
                    <th class="w-[5%] text-center! py-2.5 bg-gray-100!"></th>
                    <th class="w-[5%] text-center! bg-gray-100!">No</th>
                    <th class="w-[25%] text-left! bg-gray-100!">
                      Item / Model
                    </th>
                    <th class="w-[25%] text-left! bg-gray-100!">Description</th>
                    <th class="w-[10%] text-center! bg-gray-100!">Qty</th>
                    <th class="w-[15%] text-right! bg-gray-100!">Unit Price</th>
                    <th class="w-[15%] text-right! bg-gray-100!">Amount</th>
                  </tr>
                </ng-template>

                <ng-template #body let-control let-i="rowIndex">
                  <tr
                    [formGroup]="control"
                    class="hover:bg-slate-50/50 transition-colors border-b border-gray-100 last:border-0 align-middle text-sm"
                  >
                    <td class="text-center py-2">
                      <p-checkbox
                        [binary]="true"
                        formControlName="selected"
                      ></p-checkbox>
                    </td>

                    <td class="text-center! font-medium text-gray-400 text-xs">
                      {{ i + 1 }}
                    </td>

                    <td
                      class="text-left font-semibold text-gray-800 whitespace-normal break-words max-w-[200px]"
                    >
                      {{ control.get('item')?.value }}
                    </td>

                    <td
                      class="text-left text-xs text-gray-500 max-w-[200px] whitespace-normal break-words"
                    >
                      <div
                        [innerHTML]="control.get('description')?.value"
                      ></div>
                    </td>
                    <td class="text-center!">
                      <p-inputnumber
                        formControlName="quantity"
                        [showButtons]="false"
                        buttonLayout="horizontal"
                        inputStyleClass="w-16 py-1 px-1.5 text-center! text-base! border border-gray-300 rounded"
                        [min]="0"
                        (onInput)="calculateRowTotals()"
                      ></p-inputnumber>
                    </td>

                    <td class="text-right! text-gray-700 font-mono text-base!">
                      {{ control.get('unitPrice')?.value | currency: 'RM ' }}
                    </td>

                    <td
                      class="text-right! font-bold text-gray-800 font-mono text-base! pr-4"
                    >
                      {{
                        control.get('quantity')?.value *
                          control.get('unitPrice')?.value | currency: 'RM '
                      }}
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            </div>
          </div>

          <div class="flex justify-end mt-1">
            <div
              class="w-full md:w-[320px] bg-slate-50 rounded-lg p-4 border border-slate-200/80 flex flex-col gap-2.5 text-sm"
            >
              <div class="flex justify-between items-center text-gray-500">
                <div>SubTotal</div>
                <div class="font-mono font-medium text-base">
                  {{ invoiceForm.get('gross')?.value | currency: 'RM ' }}
                </div>
              </div>
              <div class="flex justify-between items-center text-gray-500">
                <div>Discount</div>
                <div class="font-mono text-rose-600 text-base">
                  - {{ invoiceForm.get('discount')?.value | currency: 'RM ' }}
                </div>
              </div>
              <div class="h-px bg-gray-200 my-1"></div>
              <div
                class="flex justify-between items-center text-gray-900 font-bold"
              >
                <div class="text-gray-800">Total Amount</div>
                <div class="font-mono text-base text-blue-700 text-base">
                  {{ invoiceForm.get('totalAmount')?.value | currency: 'RM ' }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          class="bg-slate-50 px-6 py-4 border-t border-gray-200 flex flex-row items-center justify-between flex-none"
        >
          <div class="text-xs text-gray-400 flex items-center gap-1.5">
            <i class="pi pi-shield-check"></i>
            <span>Secured Ledger Sync Engine v2.0</span>
          </div>
          <div class="flex items-center gap-2.5">
            <p-button
              label="Discard"
              severity="secondary"
              [outlined]="true"
              styleClass="py-2 !px-4 text-xs font-medium border-gray-300 hover:bg-gray-100 text-gray-600"
              (onClick)="invoiceDialog = false"
            ></p-button>
            <p-button
              label="Save Invoice"
              icon="pi pi-cloud-upload"
              severity="info"
              styleClass="py-2 !px-4 text-xs font-semibold shadow-sm text-white"
              (onClick)="submitInvoice()"
            ></p-button>
          </div>
        </div>
      </ng-template>
    </p-dialog>`,
  styleUrl: './goods-receiving.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoodsReceiving implements OnInit, OnDestroy {
  @ViewChild('fTable') fTable?: Table;
  @ViewChild('file') fileInputRef!: ElementRef;

  private readonly goodsReceivingService = inject(GoodsReceivingService);
  private readonly invoiceService = inject(InvoiceService);
  private readonly loadingService = inject(LoadingService);
  private readonly messageService = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  PagingSignal = signal<PagingContent<GoodsReceivingDto>>(
    {} as PagingContent<GoodsReceivingDto>,
  );
  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  search: string = '';
  menuItems: MenuItem[] = [];

  receivedForm!: FormGroup;
  invoiceForm!: FormGroup;

  receivedDialog: boolean = false;
  showDrawer: boolean = false;
  invoiceDialog: boolean = false;

  selectedGRN: any;
  selectedInvoiceItems: any[] = [];

  selectedFileName: string = '';
  selectedFileUrl: string | null = null;

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 10;
    this.Query.Filter = null;
    this.Query.OrderBy = 'CreatedAt desc';
    this.Query.Select = null;
    this.Query.Includes =
      'PurchaseOrder.PurchaseOrderItems,Supplier,GoodsReceivingItems';
  }

  ngOnInit(): void {}

  GetData() {
    this.loadingService.start();
    this.goodsReceivingService
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
      GRNNo: [
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

  onEllipsisClick(event: any, data: GoodsReceivingDto, menu: any) {
    this.menuItems = [];

    if (data.status === 'Draft') {
      this.menuItems.push(
        {
          label: 'Update',
          icon: 'pi pi-pencil',
          command: () =>
            this.router.navigate(['/goods-receiving/form'], {
              queryParams: { id: data.id },
            }),
        },
        {
          label: 'Mark as Confirm',
          icon: 'pi pi-check-circle',
          command: () => this.UpdateStatus(data, 'Confirmed'),
        },
        {
          label: 'Delete',
          icon: 'pi pi-trash',
          command: () => this.ActionClick(data, 'Delete'),
        },
      );
    }

    if (data.status === 'Confirmed') {
      this.menuItems.push({
        label: 'Record Invoice',
        icon: 'pi pi-receipt',
        command: () => this.ActionClick(data, 'Invoice'),
      });
    }

    if (data.status !== 'Draft') {
      this.menuItems.push(
        {
          label: 'View Details',
          icon: 'pi pi-eye',
          command: () =>
            this.router.navigate(['/goods-receiving/details'], {
              queryParams: { id: data.id },
            }),
        },
        {
          label: 'Download Attachment',
          icon: 'pi pi-file',
          command: () => this.downloadAttachment(data),
        },
      );
    }
    menu.toggle(event);
  }

  ActionClick(data: GoodsReceivingDto | null, action: string) {
    if (!data) return;

    if (action === 'Invoice') {
      this.selectedGRN = data;
      this.selectedFileName = '';
      this.selectedFileUrl = null;

      this.initInvoiceForm();
      console.log(data);
      this.invoiceForm.patchValue({
        supplierId: data.supplierId,
        companyId: data.companyId,
        goodsReceivingId: data.id,
        purchaseOrderId: data.purchaseOrderId,
        quotationId: data.purchaseOrder.quotationId,
        invoiceDate: new Date(),
        dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
        type: 'Purchase',
        gross: 0,
        discount: data.discount,
        totalAmount: 0,
      });

      this.invoiceItems.clear();

      data.goodsReceivingItems.forEach((x: any) => {
        const row = new FormGroup({
          selected: new FormControl(false),
          goodsReceivingItemId: new FormControl(x.id),
          item: new FormControl(x.purchaseOrderItem?.item ?? ''),
          description: new FormControl(x.purchaseOrderItem?.description ?? ''),
          unit: new FormControl(x.unit),
          unitPrice: new FormControl(x.unitPrice ?? 0),
          quantity: new FormControl(x.receivedQuantity),
          discount: new FormControl(x.discount),
          amount: new FormControl(x.totalPrice),
        });

        row.get('selected')?.valueChanges.subscribe(() => {
          this.calculateRowTotals();
        });

        row.get('quantity')?.valueChanges.subscribe(() => {
          this.calculateRowTotals();
        });

        this.invoiceItems.push(row);
      });

      this.calculateRowTotals();
      this.invoiceDialog = true;
      this.cdr.markForCheck();
    }
  }

  initForm() {
    this.receivedForm = new FormGroup({
      id: new FormControl<string | null>({ value: null, disabled: true }),
      grnNo: new FormControl<string | null>(null),
      purchaseOrderId: new FormControl<string | null>(null),
      supplierId: new FormControl<string | null>(null),
      receivedDate: new FormControl<Date | null>(null),
      supplierDONo: new FormControl<string | null>(null),
      supplierDODate: new FormControl<Date | null>(null),
      supplierDOAttachment: new FormControl<File | null>(null),
      remarks: new FormControl<string | null>(null),
      gross: new FormControl<number | null>(null),
      discount: new FormControl<number | null>(null),
      totalAmount: new FormControl<number | null>(null),
      goodsReceivingItems: new FormArray([]),
    });
  }

  downloadAttachment(data: any) {
    const rawPath = data.supplierDOAttachment || data.attachmentPath;
    if (!rawPath) {
      this.messageService.add({
        severity: 'warn',
        summary: 'File Not Found',
        detail: 'No attachment path associated with this record.',
      });
      return;
    }

    const cleanPath = rawPath.replace(/\\/g, '/');
    const fileUrl = `https://localhost:5000/${cleanPath}`;

    this.loadingService.start();

    fetch(fileUrl)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP status ${response.status}`);
        return response.blob();
      })
      .then((blob) => {
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;

        const fileExtension = cleanPath.split('.').pop() || 'pdf';
        const fallbackPrefix = 'GRN';
        const documentNo = data.grnNo || fallbackPrefix;

        link.download = `${documentNo}.${fileExtension}`;

        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
        this.loadingService.stop();
      })
      .catch((error) => {
        console.error('Download failed:', error);
        this.loadingService.stop();
        this.messageService.add({
          severity: 'error',
          summary: 'Download Failed',
          detail: 'Could not fetch file stream from server backend.',
        });
      });
  }

  UpdateStatus(data: GoodsReceivingDto, newStatus: string) {
    if (!data?.id) return;

    this.loadingService.start();

    this.goodsReceivingService
      .UpdateStatus(data.id, newStatus)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();

          const current = this.PagingSignal();

          const updated = current.data.map((item) =>
            item.id === data.id ? { ...item, status: newStatus } : item,
          );

          this.PagingSignal.set({
            ...current,
            data: updated,
          });

          this.messageService.add({
            severity: 'success',
            summary: 'Status Updated',
            detail:
              res?.remarks || `Status ${data.grnNo} changed to ${newStatus}`,
          });

          this.cdr.markForCheck();
        },

        error: (err) => {
          this.loadingService.stop();

          console.error('UpdateStatus Error:', err);

          this.messageService.add({
            severity: 'error',
            summary: 'Update Failed',
            detail:
              err?.error?.message ||
              err?.error?.title ||
              'Failed to update status',
          });
        },
      });
  }

  initInvoiceForm() {
    this.invoiceForm = new FormGroup({
      invoiceNo: new FormControl<string | null>(null, Validators.required),
      companyId: new FormControl<string | null>(null),
      supplierId: new FormControl<string | null>(null),
      projectId: new FormControl<string | null>(null),
      goodsReceivingId: new FormControl<string | null>(null),
      quotationId: new FormControl<string | null>(null),
      type: new FormControl<string | null>('Purchase'),
      invoiceDate: new FormControl<Date | null>(null),
      dueDate: new FormControl<Date | null>(null),
      gross: new FormControl<number | null>(null),
      discount: new FormControl<number | null>(null),
      totalAmount: new FormControl<number | null>(null),
      paymentTerms: new FormControl<string | null>(null),
      remarks: new FormControl<string | null>(null),
      attachment: new FormControl<File | null>(null),
      invoiceItems: new FormArray([]),
    });
  }

  get invoiceItems(): FormArray {
    return this.invoiceForm.get('invoiceItems') as FormArray;
  }

  submitInvoice() {
    if (this.invoiceForm.valid) {
      this.loadingService.start();
      const formData = buildFormData(this.invoiceForm);

      this.invoiceService
        .Create(formData)
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe({
          next: (res) => {
            this.loadingService.stop();
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: `Invoice: ${res.invoiceNo} has been created.`,
            });

            this.invoiceDialog = false;
            this.cdr.markForCheck();
          },
          error: (err) => {
            this.loadingService.stop();
          },
        });
    }
    ValidateAllFormFields(this.invoiceForm);
  }

  calculateRowTotals(): void {
    let subtotalGross = 0;

    this.invoiceItems.controls.forEach((group) => {
      const isSelected = group.get('selected')?.value;
      const qty = group.get('quantity')?.value ?? 0;
      const price = group.get('unitPrice')?.value ?? 0;

      const rowAmount = qty * price;

      group.get('amount')?.setValue(rowAmount, { emitEvent: false });

      if (isSelected) {
        subtotalGross += rowAmount;
      }
    });

    const discount = this.invoiceForm.get('discount')?.value ?? 0;
    const total = subtotalGross - discount;

    this.invoiceForm.patchValue(
      {
        gross: subtotalGross,
        totalAmount: total,
      },
      { emitEvent: false },
    );

    this.cdr.markForCheck();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];

    if (file) {
      this.selectedFileName = file.name;

      this.selectedFileUrl = URL.createObjectURL(file);

      this.invoiceForm.patchValue({
        attachment: file,
      });
    }
  }

  RemoveAttachment() {
    this.selectedFileName = '';
    this.selectedFileUrl = null;

    this.invoiceForm.get('attachment')?.setValue(null);
    this.invoiceForm.get('attachment')?.markAsPristine();
    this.invoiceForm.get('attachment')?.markAsUntouched();

    if (this.fileInputRef) {
      this.fileInputRef.nativeElement.value = '';
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
