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
import { SalesOrderService } from '../../../services/SalesOrderService';
import { LoadingService } from '../../../services/loading.service';
import { MenuItem, MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import {
  BuildFilterText,
  BuildSortText,
  GridifyQueryExtend,
  PagingContent,
  ValidateAllFormFields,
} from '../../../shared/helpers/helpers';
import { SalesOrderDto } from '../../../models/SalesOrder';

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
  ],
  template: `<div
      class="w-full min-h-[92.9vh] flex flex-col p-6 bg-slate-50/50"
    >
      <div class="flex flex-row items-center gap-1 text-gray-500 tracking-wide">
        <div
          [routerLink]="'/dashboard'"
          class="cursor-pointer hover:text-blue-600 transition-colors"
        >
          Dashboard
        </div>
        <span class="text-gray-400">/</span>
        <div class="text-gray-800 font-medium">Sales Orders</div>
      </div>

      <div
        class="mt-3 border border-gray-200 rounded-md tracking-wide bg-white p-5 flex flex-col"
      >
        <div
          class="flex flex-col gap-3 xl:gap-0 xl:flex-row xl:items-center justify-between"
        >
          <div class="flex flex-col gap-0.5">
            <div class="text-[18px] text-gray-700 font-semibold">
              Sales Orders
            </div>
            <div class="text-gray-500">
              Manage, track, and process customer sales orders and fulfillment
              statuses
            </div>
          </div>

          <div class="flex flex-row items-center gap-3">
            <div class="w-full lg:w-[260px] relative">
              <input
                type="text"
                pInputText
                [(ngModel)]="search"
                class="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Search by SO No..."
                (keydown)="onKeyDown($event)"
              />
              <!-- <i
                class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
              ></i> -->
            </div>

            <p-button
              label="Create Sales Order"
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
                  pSortableColumn="SalesOrderNo"
                  class="bg-gray-100! text-left! py-3.5 px-4 font-semibold text-gray-600 tracking-wider w-[10%]"
                >
                  <div class="flex items-center gap-1.5">
                    <span>SO Number</span>
                    <p-sortIcon field="SalesOrderNo" class="text-gray-400" />
                  </div>
                </th>
                <th
                  class="bg-gray-100! text-left! py-3.5 px-4 font-semibold text-gray-600 tracking-wider w-[25%]"
                >
                  Client
                </th>
                <th
                  pSortableColumn="SODate"
                  class="bg-gray-100! text-center! py-3.5 px-4 font-semibold text-gray-600 tracking-wider w-[10%]"
                >
                  <div class="flex justify-center items-center gap-1.5">
                    <span>Order Date</span>
                    <p-sortIcon field="SODate" class="text-gray-400" />
                  </div>
                </th>

                <th
                  class="bg-gray-100! text-center! py-3.5 px-4 font-semibold text-gray-600 tracking-wider w-[10%]"
                >
                  Client PO
                </th>

                <th
                  class="bg-gray-100! text-center! py-3.5 px-4 font-semibold text-gray-600 tracking-wider w-[12%]"
                >
                  PO Received Date
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
                <td class="py-3 px-4 font-semibold text-blue-600">
                  {{ data.salesOrderNo }}
                </td>
                <td class="py-3 px-4 text-gray-700 font-medium">
                  {{ data.client?.name }}
                </td>
                <td class="py-3 px-4 text-center! text-gray-600">
                  {{ data.soDate || data.poDate | date: 'dd MMM yyyy' }}
                </td>
                <td class="py-3 px-4 text-center! text-gray-700 font-medium">
                  {{ data.clientPONumber || '-' }}
                </td>

                <td class="py-3 px-4 text-center! text-gray-600">
                  {{ data.clientPODate | date: 'dd MMM yyyy' }}
                </td>
                <td class="py-3 px-4 text-center! font-medium text-gray-900">
                  {{ data.totalAmount | currency: 'RM ' }}
                </td>
                <td class="py-3 px-4 text-center!">
                  <div class="flex justify-center">
                    <span
                      class="inline-flex items-center gap-1.5 px-4 py-1 rounded-full font-semibold"
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
    <p-menu #menu [model]="menuItems" [popup]="true"></p-menu>

    <p-dialog
      [(visible)]="displayDialog"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      styleClass="preview-dialog rounded-xl! overflow-hidden w-[95%]! max-w-[720px]! shadow-2xl"
      [maskStyle]="{
        'overflow-y': 'auto',
        'background-color': 'rgba(15, 23, 42, 0.4)',
        'backdrop-filter': 'blur(4px)',
      }"
      appendTo="body"
    >
      <ng-template #headless>
        <div
          class="bg-slate-50 px-6 py-5 border-b border-gray-200/80 flex-none"
        >
          <div class="flex justify-between items-start gap-4">
            <div>
              <h1 class="text-xl font-bold text-gray-900 tracking-tight">
                Record Sales Order
              </h1>
              <p class="text-sm text-gray-500 mt-1 leading-relaxed">
                Verify and log the official PO received from the client to
                initiate the project workflow.
              </p>
            </div>
            <p-button
              icon="pi pi-times"
              [rounded]="true"
              [text]="true"
              severity="secondary"
              styleClass="hover:bg-gray-200/60 text-gray-400 hover:text-gray-600 transition-colors"
              (onClick)="displayDialog = false"
            ></p-button>
          </div>
        </div>

        <div class="p-6 flex-1 overflow-y-auto max-h-[70vh]">
          <div [formGroup]="FG" class="grid grid-cols-12 gap-x-5 gap-y-4">
            <div class="col-span-12 md:col-span-6 flex flex-col gap-1.5">
              <label
                class="text-xs font-semibold text-gray-600 uppercase tracking-wider"
                >SO Number</label
              >
              <input
                type="text"
                pInputText
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow bg-gray-50/50"
                formControlName="salesOrderNo"
                placeholder="System generated if left blank"
              />
            </div>

            <div class="col-span-12 md:col-span-6 flex flex-col gap-1.5">
              <label
                class="text-xs font-semibold text-gray-600 uppercase tracking-wider"
              >
                SO Date <span class="text-rose-500">*</span>
              </label>
              <p-datepicker
                formControlName="soDate"
                dateFormat="dd/mm/yy"
                styleClass="w-full"
                inputStyleClass="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500"
                appendTo="body"
                [showIcon]="true"
                placeholder="Select order date"
              ></p-datepicker>
            </div>

            <div class="col-span-12 md:col-span-6 flex flex-col gap-1.5">
              <label
                class="text-xs font-semibold text-gray-600 uppercase tracking-wider"
              >
                Client PO Number <span class="text-rose-500">*</span>
              </label>
              <input
                type="text"
                pInputText
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                formControlName="clientPONumber"
                placeholder="e.g. PO-2026-001"
              />
            </div>

            <div class="col-span-12 md:col-span-6 flex flex-col gap-1.5">
              <label
                class="text-xs font-semibold text-gray-600 uppercase tracking-wider"
                >PO Received Date</label
              >
              <p-datepicker
                formControlName="clientPODate"
                dateFormat="dd/mm/yy"
                styleClass="w-full"
                inputStyleClass="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500"
                appendTo="body"
                [showIcon]="true"
                placeholder="Select receive date"
              ></p-datepicker>
            </div>

            <div class="col-span-12 md:col-span-6 flex flex-col gap-1.5">
              <label
                class="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center justify-between"
              >
                <span>Quotation Ref</span>
                <span
                  class="text-[11px] text-gray-400 lowercase font-normal italic"
                  >optional</span
                >
              </label>
              <p-select
                [options]="quotationSelections"
                appendTo="body"
                [filter]="true"
                formControlName="quotationId"
                styleClass="w-full border border-gray-300 rounded-lg"
                [showClear]="FG.get('quotationId')?.value"
                placeholder="Link a quotation"
              ></p-select>
            </div>

            <div class="col-span-12 md:col-span-6 flex flex-col gap-1.5">
              <label
                class="text-xs font-semibold text-gray-600 uppercase tracking-wider"
                >Client Account</label
              >
              <p-select
                [options]="clientSelections"
                appendTo="body"
                [filter]="true"
                formControlName="clientId"
                styleClass="w-full border border-gray-300 rounded-lg"
                [showClear]="FG.get('clientId')?.value"
                placeholder="Select a client account"
              ></p-select>
            </div>

            <div class="col-span-12 md:col-span-6 flex flex-col gap-1.5">
              <label
                class="text-xs font-semibold text-gray-600 uppercase tracking-wider"
                >Total Value (Gross)</label
              >
              <p-inputnumber
                formControlName="totalAmount"
                styleClass="w-full text-left"
                inputStyleClass="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg font-medium text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                mode="currency"
                currency="MYR"
                locale="ms-MY"
                [minFractionDigits]="2"
                placeholder="RM 0.00"
              ></p-inputnumber>
            </div>

            <div class="col-span-12 md:col-span-6 flex flex-col gap-1.5">
              <label
                class="text-xs font-semibold text-gray-600 uppercase tracking-wider"
                >Internal Remarks</label
              >
              <input
                type="text"
                pInputText
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                formControlName="remarks"
                placeholder="Add any internal processing notes"
              />
            </div>

            <div
              class="col-span-12 flex flex-col gap-2 mt-2 pt-4 border-t border-gray-100"
            >
              <label
                class="text-xs font-semibold text-gray-600 uppercase tracking-wider"
              >
                Official Client PO Attachment
                <span class="text-rose-500">*</span>
              </label>

              <div class="flex flex-wrap items-center gap-3">
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
                  styleClass="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 py-2 px-3 text-xs font-medium shadow-sm rounded-lg"
                  (onClick)="file.click()"
                ></p-button>

                <a
                  *ngIf="selectedFileName"
                  [href]="selectedFileUrl"
                  [download]="selectedFileName"
                  target="_blank"
                  class="bg-blue-50/50 hover:bg-blue-50 border border-blue-200/60 rounded-xl px-3 py-2 text-sm font-medium text-blue-700 flex items-center gap-2 max-w-full transition-colors group"
                >
                  <i
                    class="pi pi-file text-blue-500 group-hover:scale-105 transition-transform"
                  ></i>
                  <span class="truncate max-w-[280px]">{{
                    selectedFileName
                  }}</span>
                  <i
                    class="pi pi-external-link text-[10px] text-blue-400 ml-1"
                  ></i>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div
          class="p-4 bg-slate-50 border-t border-gray-200 flex justify-end items-center gap-3 flex-none"
        >
          <p-button
            label="Cancel"
            severity="secondary"
            styleClass="border border-gray-300! bg-white hover:bg-gray-50 text-gray-700 py-2 px-4 text-sm font-medium rounded-lg"
            (onClick)="displayDialog = false"
          ></p-button>
          <p-button
            label="Record Order"
            icon="pi pi-check-circle"
            severity="info"
            styleClass="bg-blue-600 hover:bg-blue-700 border-none text-white py-2 px-4 text-sm font-medium shadow-sm rounded-lg"
            (onClick)="saveRecord()"
          ></p-button>
        </div>
      </ng-template>
    </p-dialog>`,
  styleUrl: './salesOrder.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesOrder implements OnInit, OnDestroy {
  @ViewChild('fTable') fTable?: Table;

  private readonly salesOrderService = inject(SalesOrderService);
  private readonly loadingService = inject(LoadingService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  PagingSignal = signal<PagingContent<SalesOrderDto>>(
    {} as PagingContent<SalesOrderDto>,
  );
  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  search: string = '';
  selectedFileName: string = '';
  selectedFileUrl: string | null = null;

  displayDialog: boolean = false;

  FG!: FormGroup;

  menuItems: MenuItem[] = [];

  companySelections: any[] = [];
  quotationSelections: any[] = [];
  clientSelections: any[] = [];

  selectedSO: any;

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 10;
    this.Query.Filter = null;
    this.Query.OrderBy = 'CreatedAt desc';
    this.Query.Select = null;
    this.Query.Includes = 'Client,SalesOrderItems';
  }

  ngOnInit(): void {}

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
        this.getDropdown();
        this.initForm();
        this.generateSONo();

        this.displayDialog = true;
        this.cdr.markForCheck();
        break;
      case 'Update':
        this.getDropdown();
        this.initForm();

        setTimeout(() => {
          this.displayDialog = true;

          if (!data) return;

          if (data.clientPOAttachment) {
            const cleanPath = data.clientPOAttachment.replace(/\\/g, '/');
            this.selectedFileName = cleanPath.split('/').pop() || '';
            this.selectedFileUrl = `https://localhost:5000/${cleanPath}`;
          }

          this.FG.patchValue({
            ...data,
            soDate: new Date(data.soDate),
            clientPODate: new Date(data.clientPODate),
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
      id: new FormControl<string | null>({ value: null, disabled: true }),
      salesOrderNo: new FormControl<string | null>(null),
      companyId: new FormControl<string | null>(null),
      clientId: new FormControl<string | null>(null, Validators.required),
      projectId: new FormControl<string | null>(null),
      quotationId: new FormControl<string | null>(null),
      soDate: new FormControl<Date | null>(new Date()),
      totalAmount: new FormControl<number | null>(null),
      remarks: new FormControl<string | null>(null),
      clientPOAttachment: new FormControl<File | null>(null),
      clientPODate: new FormControl<Date | null>(null),
      clientPONumber: new FormControl<string | null>(null),
      salesOrderItems: new FormArray([]),
    });

    this.FG.get('quotationId')?.valueChanges.subscribe((res) => {
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
        },
      });
  }

  onEllipsisClick(event: any, so: SalesOrderDto, menu: any) {
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
    } else if (so.status === 'Confirmed') {
      this.menuItems.push({
        label: 'Generate Delivery Order',
        icon: 'pi pi-truck',
        command: () => this.generateDO(so),
      });
    }

    if (so.clientPOAttachment) {
      this.menuItems.push({
        label: 'Download File',
        icon: 'pi pi-file',
        command: () => this.downloadAttachment(so),
      });
    }

    menu.toggle(event);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];

    if (file) {
      this.selectedFileName = file.name;

      this.selectedFileUrl = URL.createObjectURL(file);

      this.FG.patchValue({
        clientPOAttachment: file,
      });
    }
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

      formData.append(key, value);
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
            data: [res, ...state.data],
            totalElements: state.totalElements + 1,
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

    this.selectedFileName = '';
    this.selectedFileUrl = null;

    this.FG.get('id')?.disable();
  }

  downloadAttachment(data: SalesOrderDto) {
    if (!data.clientPOAttachment) return;

    const cleanPath = data.clientPOAttachment.replace(/\\/g, '/');
    const fileUrl = `https://localhost:5000/${cleanPath}`;

    fetch(fileUrl)
      .then((response) => response.blob())
      .then((blob) => {
        const blobUrl = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;

        const fileExtension = cleanPath.split('.').pop() || '';
        const poNo = data.salesOrderNo || 'SO';

        link.download = `${poNo}.${fileExtension}`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        window.URL.revokeObjectURL(blobUrl);
      })
      .catch((error) => {
        console.error('Download failed:', error);
      });
  }

  generateDO(so: SalesOrderDto) {
    this.loadingService.start();

    this.salesOrderService
      .GenerateDO(so.id)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res: any) => {
          this.loadingService.stop();

          const current = this.PagingSignal();

          const updatedData = current.data.map((item) => {
            if (item.id === so.id) {
              return {
                ...item,
                status: 'InProgress',
              };
            }
            return item;
          });

          this.PagingSignal.set({
            ...current,
            data: updatedData,
          });

          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `Delivery Order generated for ${so.salesOrderNo}`,
          });
        },
        error: () => {
          this.loadingService.stop();
        },
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
