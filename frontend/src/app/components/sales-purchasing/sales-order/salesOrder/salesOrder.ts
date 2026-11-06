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
  FormArray,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { SelectModule } from 'primeng/select';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { AccordionModule } from 'primeng/accordion';
import { MessageService, MenuItem } from 'primeng/api';
import { CheckboxModule } from 'primeng/checkbox';
import { DrawerModule } from 'primeng/drawer';
import { TextareaModule } from 'primeng/textarea';
import { Subject, takeUntil } from 'rxjs';

import { SalesOrderDto } from '../../../../models/SalesOrder';
import { DeliveryOrderService } from '../../../../services/deliveryOrderService';
import { LoadingService } from '../../../../services/loading.service';
import { SalesOrderService } from '../../../../services/SalesOrderService';
import {
  PagingContent,
  GridifyQueryExtend,
  BuildSortText,
  BuildFilterText,
  ValidateAllFormFields,
} from '../../../../shared/helpers/helpers';

@Component({
  selector: 'app-sales-order',
  imports: [
    CommonModule,
    ButtonModule,
    InputTextModule,
    FormsModule,
    TableModule,
    RouterLink,
    DialogModule,
    ReactiveFormsModule,
    DatePickerModule,
    SelectModule,
    InputNumberModule,
    MenuModule,
    DrawerModule,
    TextareaModule,
    CheckboxModule,
    AccordionModule,
  ],
  template: `
    <div
      class="sales-order-page min-h-[92.9vh] w-full bg-slate-50/50 p-3 sm:p-4 lg:p-6"
    >
      <div
        class="sales-order-container mx-auto flex w-full max-w-[1800px] flex-col"
      >
        <!-- Breadcrumb -->
        <div
          class="mb-3 flex flex-wrap items-center gap-1 text-sm tracking-wide text-gray-500"
        >
          <a
            routerLink="/dashboard"
            class="cursor-pointer transition-colors hover:text-blue-600"
          >
            Dashboard
          </a>
          <span class="text-gray-400">/</span>
          <span class="font-medium text-gray-800">Sales Orders</span>
        </div>

        <!-- Main card -->
        <div
          class="sales-order-card flex min-w-0 flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5 lg:p-6"
        >
          <!-- Header -->
          <div
            class="sales-order-header flex min-w-0 flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"
          >
            <div class="min-w-0">
              <h1
                class="text-lg font-semibold tracking-wide text-gray-800 sm:text-xl"
              >
                Sales Orders
              </h1>
              <p class="mt-1 text-sm leading-relaxed text-gray-500">
                Manage, track, and process customer sales orders and fulfillment
                statuses.
              </p>
            </div>

            <!-- Toolbar -->
            <div
              class="sales-order-toolbar flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center xl:w-auto xl:justify-end"
            >
              <div
                class="w-full sm:min-w-[220px] sm:flex-1 xl:w-[260px] xl:flex-none"
              >
                <input
                  type="text"
                  pInputText
                  [(ngModel)]="search"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Search by SO No..."
                  (keydown)="onKeyDown($event)"
                />
              </div>

              <div class="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
                <p-button
                  label="Export as Excel"
                  (onClick)="exportToExcel()"
                  icon="pi pi-file-export"
                  severity="secondary"
                  [outlined]="true"
                  styleClass="w-full py-2! whitespace-nowrap! sm:w-auto"
                ></p-button>

                <p-button
                  label="Create Sales Order"
                  (onClick)="ActionClick(null, 'Create')"
                  icon="pi pi-plus"
                  severity="info"
                  styleClass="w-full bg-blue-700! border-none! hover:bg-blue-500! rounded-lg px-4 py-2 text-sm font-medium shadow-sm sm:w-auto"
                ></p-button>
              </div>
            </div>
          </div>

          <!-- Table -->
          <div
            class="sales-order-table mt-5 w-full min-w-0 overflow-hidden rounded-lg border border-gray-200"
          >
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
                    pSortableColumn="SalesOrderNo"
                    class="w-[10%] bg-gray-100! px-4 py-3.5 text-left! font-semibold tracking-wider text-gray-600"
                  >
                    <div class="flex items-center gap-1.5">
                      <span>SO Number</span>
                      <p-sortIcon field="SalesOrderNo" class="text-gray-400" />
                    </div>
                  </th>

                  <th
                    class="w-[25%] bg-gray-100! px-4 py-3.5 text-left! font-semibold tracking-wider text-gray-600"
                  >
                    Client
                  </th>

                  <th
                    pSortableColumn="SODate"
                    class="w-[10%] bg-gray-100! px-4 py-3.5 text-center! font-semibold tracking-wider text-gray-600"
                  >
                    <div class="flex items-center justify-center gap-1.5">
                      <span>Order Date</span>
                      <p-sortIcon field="SODate" class="text-gray-400" />
                    </div>
                  </th>

                  <th
                    class="w-[10%] bg-gray-100! px-4 py-3.5 text-center! font-semibold tracking-wider text-gray-600"
                  >
                    Client PO
                  </th>

                  <th
                    class="w-[12%] bg-gray-100! px-4 py-3.5 text-center! font-semibold tracking-wider text-gray-600"
                  >
                    PO Received Date
                  </th>

                  <th
                    class="w-[10%] bg-gray-100! px-4 py-3.5 text-center! font-semibold tracking-wider text-gray-600"
                  >
                    Total Amount
                  </th>

                  <th
                    pSortableColumn="Status"
                    class="w-[10%] bg-gray-100! px-4 py-3.5 text-center! font-semibold tracking-wider text-gray-600"
                  >
                    <div class="flex items-center justify-center gap-1.5">
                      <span>Status</span>
                      <p-sortIcon field="Status" class="text-gray-400" />
                    </div>
                  </th>

                  <th
                    class="w-[8%] bg-gray-100! px-4 py-3.5 text-center! font-semibold tracking-wider text-gray-600"
                  >
                    Actions
                  </th>
                </tr>
              </ng-template>

              <ng-template #body let-data let-rowIndex="rowIndex">
                <tr
                  class="border-b border-gray-100 transition-colors hover:bg-slate-50/80"
                >
                  <td class="px-4 py-3 font-bold text-gray-800">
                    {{ data.salesOrderNo }}
                  </td>

                  <td class="px-4 py-3 font-medium text-gray-700">
                    {{ data.client?.name || '-' }}
                  </td>

                  <td class="px-4 py-3 text-center! text-gray-600">
                    {{ data.soDate | date: 'dd/MM/yyyy' }}
                  </td>

                  <td class="px-4 py-3 text-center! font-medium text-gray-700">
                    {{ data.clientPONumber || '-' }}
                  </td>

                  <td class="px-4 py-3 text-center! text-gray-600">
                    {{ data.clientPODate | date: 'dd/MM/yyyy' }}
                  </td>

                  <td class="px-4 py-3 text-center! font-medium text-gray-900">
                    {{ data.totalAmount | currency: 'RM ' }}
                  </td>

                  <td class="px-4 py-3 text-center">
                    <div class="flex flex-col items-center gap-1">
                      <span
                        class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-sm font-semibold"
                        [ngClass]="{
                          'border border-amber-200 bg-amber-100 text-amber-700':
                            data.status === 'Draft',
                          'border border-orange-200 bg-orange-100 text-orange-700':
                            data.status === 'Reviewed',
                          'border border-blue-200 bg-blue-100 text-blue-700':
                            data.status === 'Approved' ||
                            data.status === 'InProgress',
                          'border border-purple-200 bg-purple-100 text-purple-700':
                            data.status === 'Sent' || data.status === 'Issued',
                          'border border-cyan-200 bg-cyan-100 text-cyan-700':
                            data.status === 'PartiallyReceived' ||
                            data.status === 'PartiallyShipped',
                          'border border-emerald-200 bg-emerald-100 text-emerald-700':
                            data.status === 'Confirmed',
                          'border border-rose-200 bg-rose-100 text-rose-700':
                            data.status === 'Rejected' ||
                            data.status === 'Cancelled',
                        }"
                      >
                        <span
                          class="h-1.5 w-1.5 rounded-full"
                          [ngClass]="{
                            'bg-amber-500': data.status === 'Draft',
                            'bg-orange-500': data.status === 'Reviewed',
                            'bg-blue-500':
                              data.status === 'Approved' ||
                              data.status === 'InProgress',
                            'bg-purple-500':
                              data.status === 'Sent' ||
                              data.status === 'Issued',
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

                      <small
                        *ngIf="
                          data.status === 'Rejected' && getRejectedReason(data)
                        "
                        class="max-w-[180px] cursor-help truncate text-center text-xs italic text-gray-500"
                        [title]="getRejectedReason(data)"
                      >
                        {{ getRejectedReason(data) }}
                      </small>
                    </div>
                  </td>

                  <td class="px-4 py-3 text-center">
                    <div class="flex items-center justify-center">
                      <button
                        type="button"
                        (click)="onEllipsisClick($event, data, menu)"
                        class="rounded-md p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none"
                        aria-label="Sales order actions"
                      >
                        <i class="pi pi-ellipsis-h text-base"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </ng-template>

              <ng-template #emptymessage>
                <tr>
                  <td colspan="100%" class="border-b border-gray-100 py-12">
                    <div
                      class="flex flex-col items-center justify-center gap-2"
                    >
                      <i class="pi pi-folder-open text-3xl text-gray-300"></i>
                      <div class="text-sm font-medium text-gray-500">
                        No sales orders found in records.
                      </div>
                    </div>
                  </td>
                </tr>
              </ng-template>
            </p-table>
          </div>
        </div>
      </div>
    </div>

    <p-menu #menu [model]="menuItems" [popup]="true"></p-menu>

    <!-- Record Sales Order Dialog -->
    <p-dialog
      [(visible)]="displayDialog"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      styleClass="sales-order-dialog rounded-xl! overflow-hidden shadow-2xl"
      [maskStyle]="{
        'overflow-y': 'auto',
        'background-color': 'rgba(15, 23, 42, 0.4)',
        'backdrop-filter': 'blur(4px)',
      }"
      appendTo="body"
    >
      <ng-template #headless>
        <div
          class="sales-order-dialog-header flex-none border-b border-gray-200/80 bg-slate-50 px-4 py-4 sm:px-6 sm:py-5"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <h2
                class="text-lg font-bold tracking-tight text-gray-900 sm:text-xl"
              >
                Record Sales Order
              </h2>
              <p class="mt-1 text-sm leading-relaxed text-gray-500">
                Verify and log the official PO received from the client to
                initiate the project workflow.
              </p>
            </div>

            <p-button
              icon="pi pi-times"
              [rounded]="true"
              [text]="true"
              severity="secondary"
              styleClass="shrink-0 text-gray-400 transition-colors hover:bg-gray-200/60 hover:text-gray-600"
              (onClick)="displayDialog = false"
            ></p-button>
          </div>
        </div>

        <div
          class="sales-order-dialog-body min-h-0 flex-1 overflow-y-auto p-4 sm:p-6"
        >
          <div
            [formGroup]="FG"
            class="grid grid-cols-12 gap-x-4 gap-y-4 sm:gap-x-5"
          >
            <!-- SO Number -->
            <div class="col-span-12 flex flex-col gap-1.5 md:col-span-6">
              <label
                class="text-xs font-semibold uppercase tracking-wider text-gray-600"
              >
                SO Number
              </label>
              <input
                type="text"
                pInputText
                class="w-full rounded-lg border border-gray-300 bg-gray-50/50 px-3 py-2 text-sm transition-shadow focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                formControlName="salesOrderNo"
                placeholder="System generated if left blank"
              />
            </div>

            <!-- SO Date -->
            <div class="col-span-12 flex flex-col gap-1.5 md:col-span-6">
              <label
                class="text-xs font-semibold uppercase tracking-wider text-gray-600"
              >
                SO Date <span class="text-rose-500">*</span>
              </label>
              <p-datepicker
                formControlName="soDate"
                dateFormat="dd/mm/yy"
                styleClass="w-full"
                inputStyleClass="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500"
                appendTo="body"
                [showIcon]="true"
                placeholder="Select order date"
              ></p-datepicker>
            </div>

            <!-- Client PO Number -->
            <div class="col-span-12 flex flex-col gap-1.5 md:col-span-6">
              <label
                class="text-xs font-semibold uppercase tracking-wider text-gray-600"
              >
                Client PO Number <span class="text-rose-500">*</span>
              </label>
              <input
                type="text"
                pInputText
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                formControlName="clientPONumber"
                placeholder="e.g. PO-2026-001"
              />
            </div>

            <!-- PO Received Date -->
            <div class="col-span-12 flex flex-col gap-1.5 md:col-span-6">
              <label
                class="text-xs font-semibold uppercase tracking-wider text-gray-600"
              >
                PO Received Date
              </label>
              <p-datepicker
                formControlName="clientPODate"
                dateFormat="dd/mm/yy"
                styleClass="w-full"
                inputStyleClass="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500"
                appendTo="body"
                [showIcon]="true"
                placeholder="Select receive date"
              ></p-datepicker>
            </div>

            <!-- Quotation -->
            <div class="col-span-12 flex flex-col gap-1.5 md:col-span-6">
              <label
                class="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-600"
              >
                <span>Quotation Ref</span>
                <span
                  class="text-[11px] font-normal lowercase italic text-gray-400"
                >
                  optional
                </span>
              </label>
              <p-select
                [options]="quotationSelections"
                appendTo="body"
                [filter]="true"
                formControlName="quotationId"
                styleClass="w-full rounded-lg border border-gray-300"
                [showClear]="!!FG.get('quotationId')?.value"
                placeholder="Link a quotation"
              ></p-select>
            </div>

            <!-- Client -->
            <div class="col-span-12 flex flex-col gap-1.5 md:col-span-6">
              <label
                class="text-xs font-semibold uppercase tracking-wider text-gray-600"
              >
                Client Account
              </label>
              <p-select
                [options]="clientSelections"
                appendTo="body"
                [filter]="true"
                formControlName="clientId"
                styleClass="w-full rounded-lg border border-gray-300"
                [showClear]="!!FG.get('clientId')?.value"
                placeholder="Select a client account"
              ></p-select>
            </div>

            <!-- Total Amount -->
            <div class="col-span-12 flex flex-col gap-1.5 md:col-span-6">
              <label
                class="text-xs font-semibold uppercase tracking-wider text-gray-600"
              >
                Total Value (Gross)
              </label>
              <p-inputnumber
                formControlName="totalAmount"
                styleClass="w-full text-left"
                inputStyleClass="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                mode="currency"
                currency="MYR"
                locale="ms-MY"
                [minFractionDigits]="2"
                placeholder="RM 0.00"
              ></p-inputnumber>
            </div>

            <!-- Payment Terms -->
            <div class="col-span-12 flex flex-col gap-1.5 md:col-span-6">
              <label
                class="text-xs font-semibold uppercase tracking-wider text-gray-600"
              >
                Payment Terms <span class="text-rose-500">*</span>
              </label>
              <input
                type="text"
                pInputText
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                formControlName="paymentTerms"
                placeholder="e.g. 30 Days, Cash on Delivery, Net 60"
              />
            </div>

            <!-- Remarks -->
            <div class="col-span-12 flex flex-col gap-1.5">
              <label
                class="text-xs font-semibold uppercase tracking-wider text-gray-600"
              >
                Internal Remarks
              </label>
              <input
                type="text"
                pInputText
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                formControlName="remarks"
                placeholder="Add any internal processing notes"
              />
            </div>

            <!-- Attachment -->
            <div
              class="col-span-12 mt-2 flex flex-col gap-2 border-t border-gray-100 pt-4"
            >
              <label
                class="text-xs font-semibold uppercase tracking-wider text-gray-600"
              >
                Official Client PO Attachment
                <span class="text-rose-500">*</span>
              </label>

              <div
                class="flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center"
              >
                <input
                  #file
                  type="file"
                  (change)="onFileSelected($event)"
                  hidden
                />

                <p-button
                  [label]="
                    FG.get('clientPOAttachment')?.value
                      ? 'Replace Document'
                      : 'Upload PO Document'
                  "
                  severity="secondary"
                  icon="pi pi-upload"
                  styleClass="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 sm:w-auto"
                  (onClick)="file.click()"
                ></p-button>

                <a
                  *ngIf="selectedFileName"
                  [href]="selectedFileUrl"
                  [download]="selectedFileName"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex max-w-full items-center gap-2 rounded-xl border border-blue-200/60 bg-blue-50/50 px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50"
                >
                  <i class="pi pi-file shrink-0 text-blue-500"></i>
                  <span class="max-w-[220px] truncate sm:max-w-[280px]">
                    {{ selectedFileName }}
                  </span>
                  <i
                    class="pi pi-external-link ml-1 shrink-0 text-[10px] text-blue-400"
                  ></i>
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- Dialog footer -->
        <div
          class="sales-order-dialog-footer flex flex-none flex-col-reverse gap-2 border-t border-gray-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:px-6"
        >
          <p-button
            label="Cancel"
            severity="secondary"
            styleClass="w-full rounded-lg border border-gray-300! bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:w-auto"
            (onClick)="displayDialog = false"
          ></p-button>

          <p-button
            label="Record Order"
            icon="pi pi-check-circle"
            severity="info"
            styleClass="w-full rounded-lg border-none! bg-blue-600! px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700! sm:w-auto"
            (onClick)="saveRecord()"
          ></p-button>
        </div>
      </ng-template>
    </p-dialog>
  `,
  styleUrl: './salesOrder.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesOrder implements OnInit, OnDestroy {
  @ViewChild('fTable') fTable?: Table;

  private readonly salesOrderService = inject(SalesOrderService);
  private readonly deliveryOrderService = inject(DeliveryOrderService);
  private readonly loadingService = inject(LoadingService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);

  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  PagingSignal = signal<PagingContent<SalesOrderDto>>(
    {} as PagingContent<SalesOrderDto>,
  );

  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  search = '';
  selectedFileName = '';
  selectedFileUrl: string | null = null;

  displayDialog = false;
  selectAllItems = false;

  FG!: FormGroup;

  menuItems: MenuItem[] = [];

  companySelections: any[] = [];
  quotationSelections: any[] = [];
  clientSelections: any[] = [];

  selectedSO: any;
  selectedDOItems: any[] = [];

  paymentForm = {
    invoiceId: '',
    clientId: '',
    referenceNo: '',
    paymentDate: new Date(),
    paymentMode: 'Bank Transfer',
    amount: 0,
    notes: '',
  };

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 10;
    this.Query.Filter = null;
    this.Query.OrderBy = 'CreatedAt desc';
    this.Query.Select = null;
    this.Query.Includes =
      'Client.BillingAddress,Client.DeliveryAddress,Company.DeliveryAddress,SalesOrderItems,SalesOrderStatusHistories,Quotation';
  }

  ngOnInit(): void {}

  parseDONo(no: string) {
    const parts = no.split('/');

    return {
      prefix: `${parts[0]}/${parts[1]}`,
      number: parseInt(parts[2] || '0', 10),
      year: parts[3],
    };
  }

  buildDONo(prefix: string, number: number, year: string) {
    return `${prefix}/${number}/${year}`;
  }

  GetData() {
    this.loadingService.start();

    this.salesOrderService
      .GetMany(this.Query)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();
          this.PagingSignal.set(res);
          this.cdr.markForCheck();
        },
        error: () => {
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
      SalesOrderNo: [
        {
          value: data,
          matchMode: '=',
          operator: 'and',
        },
      ],
      ClientPONumber: [
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

  ActionClick(data: SalesOrderDto | null, action: string) {
    switch (action) {
      case 'Create':
        this.clearSelectedFile();
        this.getDropdown();
        this.initForm();
        this.generateSONo();

        this.displayDialog = true;
        this.cdr.markForCheck();
        break;

      case 'Update':
        this.clearSelectedFile();
        this.getDropdown();
        this.initForm();
        this.displayDialog = true;

        setTimeout(() => {
          if (!data) return;

          if (data.clientPOAttachment) {
            const cleanPath = data.clientPOAttachment.replace(/\\/g, '/');
            this.selectedFileName = cleanPath.split('/').pop() || '';
            this.selectedFileUrl = `https://localhost:5000/${cleanPath}`;
          }

          this.FG.patchValue({
            ...data,
            soDate: data.soDate ? new Date(data.soDate) : null,
            clientPODate: data.clientPODate
              ? new Date(data.clientPODate)
              : null,
          });

          const fa = this.FG.get('salesOrderItems') as FormArray;
          fa.clear();

          if (data.salesOrderItems?.length) {
            data.salesOrderItems.forEach((item: any) => {
              fa.push(this.buildItemGroup(item));
            });
          }

          this.cdr.markForCheck();
        }, 100);

        break;

      case 'Review':
        if (!data) return;

        this.router.navigate(['/sales-order/reviews'], {
          queryParams: { id: data.id },
        });
        break;

      case 'View':
        if (!data) return;

        this.router.navigate(['/sales-order/details'], {
          queryParams: { id: data.id },
        });
        break;
    }
  }

  private buildItemGroup(item: any): FormGroup {
    return new FormGroup({
      id: new FormControl(item.id ?? null),
      sortOrder: new FormControl(item.sortOrder ?? 0),
      type: new FormControl(item.type ?? ''),
      isGroup: new FormControl(item.isGroup ?? false),
      description: new FormControl(item.description ?? ''),
      unit: new FormControl(item.unit ?? ''),
      quantity: new FormControl(item.quantity ?? 0),
      unitPrice: new FormControl(item.unitPrice ?? 0),
      totalPrice: new FormControl(item.totalPrice ?? 0),
      children: new FormControl(item.children ?? []),
    });
  }

  initForm() {
    this.FG = new FormGroup({
      id: new FormControl<string | null>({
        value: null,
        disabled: true,
      }),
      salesOrderNo: new FormControl<string | null>(null),
      companyId: new FormControl<string | null>(null),
      clientId: new FormControl<string | null>(null, Validators.required),
      projectId: new FormControl<string | null>(null),
      quotationId: new FormControl<string | null>(null),
      soDate: new FormControl<Date | null>(new Date()),
      totalAmount: new FormControl<number | null>(null),
      remarks: new FormControl<string | null>(null),
      paymentTerms: new FormControl<string | null>(null),
      clientPOAttachment: new FormControl<File | null>(null),
      clientPODate: new FormControl<Date | null>(null),
      clientPONumber: new FormControl<string | null>(null),
      salesOrderItems: new FormArray([]),
    });

    this.FG.get('quotationId')
      ?.valueChanges.pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((res) => {
        const selectedQuotation = this.quotationSelections.find(
          (x) => x.value === res,
        );

        if (!selectedQuotation) return;

        this.FG.patchValue({
          clientId: selectedQuotation.clientId,
          companyId: selectedQuotation.fromCompanyId,
          totalAmount: selectedQuotation.totalAmount,
        });

        const itemsFA = this.FG.get('salesOrderItems') as FormArray;
        itemsFA.clear();

        const items = selectedQuotation.items || [];
        this.buildItems(items, itemsFA);

        this.cdr.markForCheck();
      });
  }

  buildItems(items: any[], formArray: FormArray) {
    items.forEach((item) => {
      const group = new FormGroup({
        id: new FormControl(item.id ?? null),
        sortOrder: new FormControl(item.sortOrder),
        type: new FormControl(item.type),
        isGroup: new FormControl(item.isGroup),
        description: new FormControl(item.description),
        unit: new FormControl(item.unit),
        quantity: new FormControl(item.quantity),
        unitPrice: new FormControl(item.unitPrice),
        totalPrice: new FormControl(item.totalPrice),
        children: new FormArray([]),
      });

      const childrenFA = group.get('children') as FormArray;

      if (item.children?.length) {
        this.buildItems(item.children, childrenFA);
      }

      formArray.push(group);
    });
  }

  generateSONo() {
    this.salesOrderService
      .GenerateNo()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.FG.get('salesOrderNo')?.setValue(res.salesOrderNo);
          this.cdr.markForCheck();
        },
      });
  }

  getDropdown() {
    this.salesOrderService
      .GetDropdown()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.companySelections = res.companies.map((q: any) => ({
            label: q.name,
            value: q.id,
          }));

          this.clientSelections = res.clients.map((q: any) => ({
            label: q.name,
            value: q.id,
          }));

          this.quotationSelections = res.quotations.map((q: any) => ({
            label: q.quotationNo,
            value: q.id,
            fromCompanyId: q.fromCompanyId,
            totalAmount: q.totalAmount,
            clientId: q.clientId,
            items: q.items,
          }));

          this.cdr.markForCheck();
        },
      });
  }

  onEllipsisClick(event: Event, so: SalesOrderDto, menu: any) {
    this.menuItems = [];

    if (so.status === 'Draft') {
      this.menuItems.push(
        {
          label: 'Update',
          icon: 'pi pi-pencil',
          command: () => this.ActionClick(so, 'Update'),
        },
        {
          label: 'Review',
          icon: 'pi pi-file-edit',
          command: () => this.ActionClick(so, 'Review'),
        },
      );
    } else if (so.status === 'Confirmed' || so.status === 'InProgress') {
      this.menuItems.push({
        label: 'View Details',
        icon: 'pi pi-eye',
        command: () => this.ActionClick(so, 'View'),
      });
    }

    if (so.clientPOAttachment) {
      this.menuItems.push({
        label: 'Download File',
        icon: 'pi pi-file',
        command: () => this.downloadAttachment(so, 'SO'),
      });
    }

    menu.toggle(event);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      this.clearSelectedFile();

      this.selectedFileName = file.name;
      this.selectedFileUrl = URL.createObjectURL(file);

      this.FG.patchValue({
        clientPOAttachment: file,
      });

      this.cdr.markForCheck();
    }
  }

  private clearSelectedFile() {
    if (this.selectedFileUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(this.selectedFileUrl);
    }

    this.selectedFileName = '';
    this.selectedFileUrl = null;
  }

  saveRecord() {
    if (!this.FG.valid) {
      ValidateAllFormFields(this.FG);
      return;
    }

    this.loadingService.start();

    const formData = new FormData();

    Object.keys(this.FG.controls).forEach((key) => {
      let value = this.FG.get(key)?.value;

      if (value === null || value === undefined) return;

      if (value instanceof Date) {
        value = value.toISOString();
      }

      if (key === 'salesOrderItems') {
        formData.append(key, JSON.stringify(value));
        return;
      }

      if (value instanceof File) {
        formData.append(key, value, value.name);
        return;
      }

      formData.append(key, String(value));
    });

    const id = this.FG.get('id')?.value;

    if (id) {
      formData.append('id', id);
    }

    const request$ = id
      ? this.salesOrderService.Update(formData)
      : this.salesOrderService.Create(formData);

    request$.pipe(takeUntil(this.ngUnsubscribe)).subscribe({
      next: (res: any) => {
        this.loadingService.stop();

        if (res?.success === false) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Duplicate SO',
            detail: res.message,
          });
          return;
        }

        if (id) {
          const current = this.PagingSignal();

          const updated = current.data.map((item) =>
            item.id === id ? res : item,
          );

          this.PagingSignal.set({
            ...current,
            data: updated,
          });

          this.messageService.add({
            severity: 'success',
            summary: 'Updated',
            detail: `SO: ${res.salesOrderNo} updated successfully`,
          });
        } else {
          this.PagingSignal.update((state) => ({
            ...state,
            data: [res, ...(state.data || [])],
            totalElements: (state.totalElements || 0) + 1,
          }));

          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `SO: ${res.salesOrderNo} recorded successfully`,
          });
        }

        this.resetForm();
        this.displayDialog = false;
        this.cdr.markForCheck();
      },

      error: (err) => {
        this.loadingService.stop();

        const message =
          err?.error?.message ||
          err?.error?.Error ||
          'Check console for details';

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: message,
        });
      },
    });
  }

  resetForm() {
    this.FG.reset({
      soDate: new Date(),
      clientPODate: new Date(),
    });

    this.clearSelectedFile();
    this.FG.get('id')?.disable();
  }

  downloadAttachment(data: any, type: 'SO' | 'Q' = 'SO') {
    const rawPath = data.clientPOAttachment || data.attachmentPath;

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
        if (!response.ok) {
          throw new Error(`HTTP status ${response.status}`);
        }

        return response.blob();
      })
      .then((blob) => {
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = blobUrl;

        const fileExtension = cleanPath.split('.').pop() || 'pdf';
        const fallbackPrefix = type === 'SO' ? 'SO-Doc' : 'Quotation-Doc';
        const documentNo =
          data.salesOrderNo || data.quotationNo || fallbackPrefix;

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

  getRejectedReason(data: SalesOrderDto): string | null {
    if (!data.salesOrderStatusHistories?.length) return null;

    const rejectedHistory = data.salesOrderStatusHistories
      .filter((x: any) => x.status === 'Rejected')
      .sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0];

    return rejectedHistory?.remarks || null;
  }

  exportToExcel() {
    this.salesOrderService.ExportToExcel().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;

        const fileName = `SO_${new Date().getTime()}.xlsx`;

        link.download = fileName;
        link.click();

        window.URL.revokeObjectURL(url);
      },
    });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();

    this.clearSelectedFile();
    this.loadingService.stop();
  }
}
