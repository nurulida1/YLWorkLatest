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
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { SelectModule } from 'primeng/select';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { PurchaseOrderService } from '../../../services/purchaseOrderService.service';
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
import { PurchaseOrderDto } from '../../../models/PurchaseOrder';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { QuotationService } from '../../../services/quotationService.service';
import { AppService } from '../../../services/appService.service';

@Component({
  selector: 'app-purchase-order',
  imports: [
    CommonModule,
    RouterLink,
    InputTextModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    MenuModule,
    SelectModule,
    ReactiveFormsModule,
    DatePickerModule,
    InputNumberModule,
    TextareaModule,
  ],
  template: `<div class="w-full min-h-[92.9vh] flex flex-col p-5">
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
        <div class="text-gray-700 font-semibold">Purchase Orders</div>
      </div>
      <div
        class="mt-3 border border-gray-200 rounded-md tracking-wide bg-white p-5 flex flex-col"
      >
        <div class="flex flex-row items-center justify-between">
          <div class="flex flex-col">
            <div class="text-[20px] text-gray-700 font-semibold">
              Purchase Orders
            </div>
            <div class="text-gray-500 text-[15px]">
              View, create, and track all project purchase orders
            </div>
          </div>
          <div class="flex flex-row items-center gap-2">
            <div class="min-w-[300px] relative">
              <input
                type="text"
                pInputText
                [(ngModel)]="search"
                class="w-full! text-[15px]!"
                placeholder="Search by PO No"
                (keydown)="onKeyDown($event)"
              />
              <i
                class="pi pi-search absolute! top-3! right-2! text-gray-500!"
              ></i>
            </div>
            <p-button
              label="Record Client PO"
              (onClick)="OpenFormDialog()"
              icon="pi pi-plus-circle"
              size="small"
              styleClass="bg-sky-600! border-none! py-2! whitespace-nowrap!"
            ></p-button>
            <p-button
              label="Generate Supplier PO"
              [routerLink]="'/purchase-orders/form'"
              icon="pi pi-file-pdf"
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
            [tableStyle]="{ 'min-width': '60rem' }"
            [showGridlines]="true"
            [rowsPerPageOptions]="[10, 20, 30, 50]"
            [lazy]="true"
            (onLazyLoad)="NextPage($event)"
          >
            <ng-template #header>
              <tr>
                <th
                  pSortableColumn="PONo"
                  class="bg-gray-100! text-[15px]! text-center! w-[15%]!"
                >
                  <div class="flex flex-row justify-center items-center gap-2">
                    <div>PO No</div>
                    <p-sortIcon field="PONo" />
                  </div>
                </th>
                <th class="bg-gray-100! text-[15px]! text-center! w-[30%]">
                  Vendor / Client
                </th>
                <th class="bg-gray-100! text-[15px]! text-center! w-[15%]">
                  Amount
                </th>
                <th class="bg-gray-100! text-[15px]! text-center! w-[20%]">
                  Payment Mode
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
                <th class="bg-gray-100! text-[15px]! text-center! w-[10%]">
                  Action
                </th>
              </tr>
            </ng-template>
            <ng-template #body let-data>
              <tr>
                <td class="text-center! text-[14px]! font-semibold!">
                  {{ data.poNo }}
                </td>
                <td class="text-center! text-[14px]!">
                  {{ data.supplier?.name ?? data.client?.name }}
                </td>
                <td class="text-center! text-[14px]!">
                  {{ data.totalAmount | currency: 'RM ' }}
                </td>
                <td class="text-center! text-[14px]!">
                  {{ data.paymentMode }}
                </td>
                <td class="text-center! text-[14px]!">
                  <div class="flex justify-center">
                    <div
                      class="rounded-full px-4 text-[13px] py-0.5 font-medium w-fit whitespace-nowrap"
                      [ngClass]="{
                        'bg-teal-100 text-teal-600':
                          data.status === 'PartiallyReceived',
                        'bg-indigo-100 text-indigo-600':
                          data.status === 'Issued',
                        'bg-blue-100 text-blue-600':
                          data.status === 'Open' ||
                          data.status === 'Signed' ||
                          data.status === 'InProgress',
                        'bg-orange-100 text-orange-600':
                          data.status === 'Pending Signature' ||
                          data.status === 'Draft',
                        'bg-green-100 text-green-600':
                          data.status === 'Accepted' ||
                          data.status === 'Received' ||
                          data.status === 'Sent',
                        'bg-red-100 text-red-600':
                          data.status === 'Declined' ||
                          data.status === 'Expired',
                      }"
                    >
                      {{ data.status }}
                    </div>
                  </div>
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
                    No purchase order found in records.
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
      [(visible)]="showRecordDialog"
      [modal]="true"
      [style]="{ width: '850px' }"
      styleClass="preview-dialog rounded-xl! overflow-hidden"
      [maskStyle]="{ 'overflow-y': 'auto' }"
      appendTo="body"
    >
      <ng-template #headless>
        <div class="bg-gray-50 p-6 border-b border-gray-100 flex-none">
          <div class="flex justify-between items-start">
            <div>
              <h1 class="text-xl font-bold text-gray-800">
                Record Client Purchase Order
              </h1>
              <p class="text-sm text-gray-500 mt-1">
                Verify and log the official PO received from the client to
                initiate the project.
              </p>
            </div>
            <p-button
              icon="pi pi-times"
              [rounded]="true"
              [text]="true"
              severity="secondary"
              (onClick)="showRecordDialog = false"
            ></p-button>
          </div>
        </div>
        <div class="p-6 flex-1 overflow-y-auto">
          <div [formGroup]="FG" class="grid grid-cols-12 gap-3">
            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
              <div>PO No <span class="text-red-500">*</span></div>
              <input
                type="text"
                pInputText
                class="w-full"
                formControlName="poNo"
              />
            </div>
            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
              <div>PO Date <span class="text-red-500">*</span></div>
              <p-datepicker
                formControlName="poDate"
                dateFormat="dd/mm/yy"
                styleClass="w-full"
                appendTo="body"
                [showIcon]="true"
              ></p-datepicker>
            </div>
            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
              <div>Received Date</div>
              <p-datepicker
                formControlName="poReceivedDate"
                dateFormat="dd/mm/yy"
                styleClass="w-full"
                appendTo="body"
                [showIcon]="true"
              ></p-datepicker>
            </div>
            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
              <div>Due Date <span class="text-red-500">*</span></div>
              <p-datepicker
                formControlName="dueDate"
                dateFormat="dd/mm/yy"
                styleClass="w-full"
                appendTo="body"
                [showIcon]="true"
              ></p-datepicker>
            </div>
            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
              <div>Quotation No</div>
              <p-select
                [options]="quotationSelection"
                appendTo="body"
                [filter]="true"
                formControlName="quotationId"
                [showClear]="FG.get('quotationId')?.value"
              ></p-select>
            </div>
            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
              <div>Client</div>
              <p-select
                [options]="clientSelection"
                appendTo="body"
                [filter]="true"
                formControlName="clientId"
                [showClear]="FG.get('clientId')?.value"
              ></p-select>
            </div>
            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
              <div>Payment Term</div>
              <input
                type="text"
                pInputText
                class="w-full"
                formControlName="paymentTerms"
              />
            </div>
            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
              <div>Tax</div>
              <p-inputnumber
                [useGrouping]="false"
                formControlName="tax"
                inputId="percent"
                suffix="%"
                class="w-full"
              ></p-inputnumber>
            </div>

            <div class="col-span-12 flex flex-col gap-1">
              <div>Line Items</div>
              <p-table
                [value]="items.controls"
                [showGridlines]="true"
                formArrayName="poItems"
                [tableStyle]="{ 'min-width': '60rem' }"
                styleClass="p-datatable-sm custom-table"
              >
                <ng-template #header>
                  <tr>
                    <th
                      class="!bg-gray-100 text-center! text-gray-500 font-semibold w-120"
                    >
                      Item Description
                    </th>
                    <th
                      class="!bg-gray-100 text-center! text-gray-500 font-semibold w-40"
                    >
                      Qty
                    </th>
                    <th
                      class="!bg-gray-100 text-center! text-gray-500 font-semibold w-32"
                    >
                      Unit
                    </th>
                    <th
                      class="!bg-gray-100 text-center! text-gray-500 font-semibold w-48"
                    >
                      Rate (RM)
                    </th>
                    <th
                      class="!bg-gray-100 text-center! text-gray-500 font-semibold w-48"
                    >
                      Tax (%)
                    </th>
                    <th
                      class="!bg-gray-100 text-center! text-gray-500 font-semibold w-64"
                    >
                      Amount
                    </th>
                    <th class="!bg-gray-100 w-32"></th>
                  </tr>
                  <ng-template #body let-item let-i="rowIndex">
                    <tr [formGroupName]="i">
                      <td>
                        <textarea
                          type="text"
                          pTextarea
                          formControlName="description"
                          class="focus:!ring-1 w-full text-[15px]!"
                          placeholder="Enter service or product..."
                          [autoResize]="true"
                        ></textarea>
                      </td>
                      <td>
                        <p-inputnumber
                          styleClass="text-center!"
                          formControlName="quantity"
                          inputStyleClass="!text-center w-full"
                        ></p-inputnumber>
                      </td>
                      <td>
                        <input
                          type="text"
                          pInputText
                          formControlName="unit"
                          class="focus:!ring-1 text-center! w-full"
                        />
                      </td>
                      <td>
                        <p-inputnumber
                          styleClass="w-full"
                          formControlName="rate"
                          inputStyleClass="!text-center w-full"
                          mode="decimal"
                          [minFractionDigits]="2"
                        ></p-inputnumber>
                      </td>
                      <td>
                        <p-inputnumber
                          styleClass="w-full"
                          formControlName="taxRate"
                          inputStyleClass="!text-center w-full"
                          suffix="%"
                        ></p-inputnumber>
                      </td>
                      <td class="text-center! font-bold text-gray-700 p-3">
                        {{ item.get('amount').value | number: '1.2-2' }}
                      </td>
                      <td class="text-center">
                        <div class="flex justify-center" *ngIf="i !== 0">
                          <p-button
                            (click)="removeItem(i)"
                            severity="danger"
                            [text]="true"
                            styleClass="text-red-300 hover:text-red-500 "
                          >
                            <i class="pi pi-trash"></i>
                          </p-button>
                        </div>
                      </td>
                    </tr>
                  </ng-template>
                </ng-template>
              </p-table>
              <button
                (click)="addItem()"
                class="mt-4 flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                <i class="pi pi-plus-circle"></i> Add Line Item
              </button>
            </div>
            <div
              class="col-span-12 flex flex-col items-end justify-end gap-1 border-t border-gray-200 pt-3"
            >
              <div class="text-right font-semibold">Total Amount</div>
              <div class="w-[30%]">
                <p-inputnumber
                  formControlName="totalAmount"
                  inputId="currency-my"
                  mode="currency"
                  currency="MYR"
                  currencyDisplay="symbol"
                  locale="en-MS"
                  [minFractionDigits]="2"
                  [maxFractionDigits]="2"
                  class="w-full"
                  styleClass="w-full"
                  inputStyleClass="w-full text-right!"
                ></p-inputnumber>
              </div>
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
            (onClick)="showRecordDialog = false"
          ></p-button>
          <p-button
            label="Save"
            icon="pi pi-check-circle"
            severity="info"
            (onClick)="saveRecord()"
          ></p-button></div></ng-template
    ></p-dialog>`,

  styleUrl: './purchase-order.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseOrder implements OnInit, OnDestroy {
  @ViewChild('fTable') fTable?: Table;

  private readonly purchaseOrderService = inject(PurchaseOrderService);
  private readonly quotationService = inject(QuotationService);
  private readonly loadingService = inject(LoadingService);
  private readonly messageService = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly appService = inject(AppService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  PagingSignal = signal<PagingContent<PurchaseOrderDto>>(
    {} as PagingContent<PurchaseOrderDto>,
  );
  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  search: string = '';

  showRecordDialog: boolean = false;

  FG!: FormGroup;

  menuItems: MenuItem[] = [];
  quotationSelection: any[] = [];
  clientSelection: any[] = [];

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 10;
    this.Query.Filter = null;
    this.Query.OrderBy = 'CreatedAt desc';
    this.Query.Select = null;
    this.Query.Includes =
      'Supplier.BillingAddress,Supplier.DeliveryAddress,Client.BillingAddress,Client.DeliveryAddress';
  }

  ngOnInit(): void {
    this.initForm();
  }

  initForm() {
    this.FG = new FormGroup({
      poNo: new FormControl<string | null>(null, Validators.required),
      poDate: new FormControl<Date | null>(null, Validators.required),
      poReceivedDate: new FormControl<Date | null>(null, Validators.required),
      quotationId: new FormControl<string | null>(null),
      clientId: new FormControl<string | null>(null),
      dueDate: new FormControl<Date | null>(null, Validators.required),
      totalAmount: new FormControl<number | null>(null, Validators.required),
      tax: new FormControl<number | null>(null),
      paymentTerms: new FormControl<string | null>(null),
      poItems: new FormArray([]),
    });

    this.FG.get('quotationId')?.valueChanges.subscribe((x) => {
      const selectedQuotation = this.quotationSelection.find(
        (y) => y.value === x,
      );

      if (selectedQuotation) {
        this.FG.get('clientId')?.patchValue(selectedQuotation.clientId);
        this.FG.get('totalAmount')?.patchValue(selectedQuotation.totalAmount);

        const poItemsArray = this.FG.get('poItems') as FormArray;

        while (poItemsArray.length !== 0) {
          poItemsArray.removeAt(0);
        }

        if (selectedQuotation.items && selectedQuotation.items.length > 0) {
          selectedQuotation.items.forEach((item: any) => {
            this.addItem(item);
          });
        }
      }
    });
  }

  GetData() {
    this.loadingService.start();
    this.purchaseOrderService
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
      PONo: [
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

  ActionClick(data: PurchaseOrderDto | null, action: string) {
    if (action === 'Update') {
      if (data?.supplierId) {
        this.router.navigate(['/purchase-orders/form'], {
          queryParams: { id: data?.id },
        });
      } else {
        this.OpenFormDialog();
      }
    } else if (action === 'Delete' && data) {
      this.loadingService.start();
      this.purchaseOrderService
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
              detail: `Purchase Order ${data.purchaseOrderNo} deleted`,
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
    } else if (action === 'GenerateInvoice' && data) {
      this.appService.setData(data, 'Invoice');
      this.router.navigate(['/invoices/form'], {
        queryParams: { source: data.supplierId ? 'Vendor' : 'Client' },
      });
    }
  }

  onEllipsisClick(event: any, purchaseOrder: PurchaseOrderDto, menu: any) {
    // 1. Top Section: Primary Actions
    const items: any[] = [];
    if (purchaseOrder.status === 'Draft' || purchaseOrder.status === 'Open') {
      items.push({
        label: 'Edit',
        icon: 'pi pi-pencil',
        command: () => this.ActionClick(purchaseOrder, 'Update'),
      });
    }

    // LOGIC FOR OUTGOING (To Vendor)
    if (purchaseOrder.supplierId) {
      if (purchaseOrder.status === 'Open') {
        items.push({
          label: 'Send to Vendor',
          icon: 'pi pi-send',
          command: () => this.updateStatus(purchaseOrder.id, 'Sent'),
        });
      }
      if (purchaseOrder.status === 'Sent') {
        items.push({
          label: 'Mark as Issued',
          icon: 'pi pi-box',
          command: () => this.updateStatus(purchaseOrder.id, 'Issued'),
        });
      }
      if (purchaseOrder.status === 'Issued') {
        items.push({
          label: 'Partially Received',
          icon: 'pi pi-box',
          command: () =>
            this.updateStatus(purchaseOrder.id, 'PartiallyReceived'),
        });
      }
      if (
        purchaseOrder.status === 'PartiallyReceived' ||
        purchaseOrder.status === 'Issued'
      ) {
        items.push({
          label: 'Received',
          icon: 'pi pi-box',
          command: () => this.updateStatus(purchaseOrder.id, 'Received'),
        });
      }
      if (purchaseOrder.status === 'Received') {
        items.push({
          label: 'Mark as Completed',
          icon: 'pi pi-check-circle',
          command: () => this.ActionClick(purchaseOrder, 'Completed'), // Updates status to 'Completed'
        });
      }

      if (
        ['Issued', 'Partially Received', 'Received'].includes(
          purchaseOrder.status,
        )
      ) {
        items.push({
          label: 'Create Invoice',
          icon: 'pi pi-receipt',
          command: () => this.ActionClick(purchaseOrder, 'GenerateInvoice'),
        });
      }
    }

    // LOGIC FOR INCOMING (From Client)
    if (purchaseOrder.clientId) {
      if (purchaseOrder.status === 'Received') {
        items.push({
          label: 'In Progress',
          icon: 'pi pi-play',
          command: () => this.updateStatus(purchaseOrder.id, 'InProgress'),
        });
      }
      if (purchaseOrder.status === 'InProgress') {
        items.push({
          label: 'Mark as Completed',
          icon: 'pi pi-check-circle',
          command: () => this.ActionClick(purchaseOrder, 'Completed'), // Updates status to 'Completed'
        });
      }
      if (
        purchaseOrder.status === 'InProgress' ||
        purchaseOrder.status === 'Completed'
      ) {
        items.push({
          label: 'Issue Invoice',
          icon: 'pi pi-money-bill',
          styleClass: 'text-green-600',
          command: () => this.ActionClick(purchaseOrder, 'GenerateInvoice'),
        });
      }
    }

    // 3. Add the Separator
    items.push({ separator: true });

    // 4. Bottom Section: PDF and Delete (Below Separator)
    items.push(
      {
        label: 'Download PDF',
        icon: 'pi pi-file-pdf',
        command: () => this.ActionClick(purchaseOrder, 'Download'),
      },
      {
        label: 'Delete',
        icon: 'pi pi-trash',
        styleClass: '!text-red-500', // Added ! to ensure Tailwind overrides PrimeNG defaults
        command: () => this.ActionClick(purchaseOrder, 'Delete'),
      },
    );

    // 5. Finalize
    this.menuItems = items;
    menu.toggle(event);
  }

  updateStatus(id: string, newStatus: string) {
    this.loadingService.start();

    this.purchaseOrderService
      .UpdateStatus(id, newStatus)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();
          this.PagingSignal.update((state) => ({
            ...state,
            data: state.data.map((item: any) =>
              item.id === id ? { ...item, status: newStatus } : item,
            ),
          }));
          this.cdr.markForCheck();
          this.messageService.add({
            severity: 'success',
            summary: 'Status Updated',
            detail: `PO: ${res.purchaseOrderNo} is now ${newStatus}`,
          });
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

  OpenFormDialog() {
    this.loadingService.start();

    // this.quotationService
    //   .GetMany({
    //     Page: 1,
    //     PageSize: 100000,
    //     OrderBy: 'QuotationNo desc',
    //     Select: null,
    //     Includes: 'Client,Items',
    //     Filter: null,
    //   })
    //   .pipe(takeUntil(this.ngUnsubscribe))
    //   .subscribe({
    //     next: (res) => {
    //       this.loadingService.stop();

    //       // 1. Fix: Wrap object in parentheses ({}) so map returns the object correctly
    //       this.quotationSelection = res.data.map((x) => ({
    //         label: x.quotationNo,
    //         value: x.id,
    //         clientId: x.clientId, // Keep this for auto-selection logic later
    //         totalAmount: x.totalAmount,
    //         items: x.?.map(({ id, ...rest }) => ({
    //           ...rest,
    //         })),
    //       }));

    //       // 2. Fix: Get Unique Clients only (to avoid duplicates in dropdown)
    //       const uniqueClients = Array.from(
    //         new Set(res.data.map((x) => x.clientId)),
    //       )
    //         .map((id) => res.data.find((q) => q.clientId === id)?.client)
    //         .filter((c) => !!c);

    //       this.clientSelection = uniqueClients.map((c) => ({
    //         label: c!.name,
    //         value: c!.id,
    //       }));
    //     },
    //     error: (err) => {
    //       this.loadingService.stop();
    //     },
    //   });

    this.showRecordDialog = true;
    this.cdr.markForCheck();
  }

  get items() {
    return this.FG.get('poItems') as FormArray;
  }

  addItem(item?: any) {
    // 1. Create the FormGroup using FormBuilder
    const newItemGroup = this.fb.group({
      description: [item?.description || '', Validators.required],
      quantity: [item?.quantity || 1, [Validators.required, Validators.min(1)]],
      unit: [item?.unit || 'Unit'],
      rate: [item?.rate || 0, [Validators.required, Validators.min(0)]],
      taxRate: [item?.taxRate || 0],
      amount: [{ value: item?.amount || 0, disabled: true }], // Amount is usually calculated, not typed
    });

    this.items.push(newItemGroup);

    this.calculateTotal();
  }

  calculateTotal() {
    let sub = 0;
    let tax = 0;

    this.items.controls.forEach((control) => {
      const qty = control.get('quantity')?.value || 0;
      const rate = control.get('rate')?.value || 0;
      const taxRate = control.get('taxRate')?.value || 0;

      const lineTotal = qty * rate;
      const lineTax = lineTotal * (taxRate / 100);
      const finalLineAmount = lineTotal + lineTax;

      control.get('amount')?.setValue(finalLineAmount, { emitEvent: false });

      sub += lineTotal;
      tax += lineTax;
    });

    const discountPercent = this.FG.get('discount')?.value || 0;

    const discountAmount = sub * (discountPercent / 100);

    // ✅ Keep form totalAmount in sync
    this.FG.get('totalAmount')?.setValue(sub + tax - discountAmount, {
      emitEvent: false,
    });
  }

  removeItem(index: number) {
    if (this.items.length > 1) {
      this.items.removeAt(index);
    }
  }

  saveRecord() {
    if (this.FG.valid) {
      this.loadingService.start();

      const formRaw = this.FG.getRawValue();

      // Map Angular form names to C# DTO property names
      const payload: any = {
        PONo: formRaw.poNo,
        PODate: formRaw.poDate,
        POReceivedDate: formRaw.poReceivedDate,
        DueDate: formRaw.dueDate,
        QuotationId: formRaw.quotationId,
        ClientId: formRaw.clientId,
        PaymentTerms: formRaw.paymentTerms,
        Tax: formRaw.tax || 0, // Mapping 'tax' to 'Tax'
        TotalAmount: formRaw.totalAmount,
        // Map poItems and ensure the inner properties match POItemRequest
        POItems: formRaw.poItems.map((item: any) => ({
          Description: item.description,
          Quantity: item.quantity,
          Unit: item.unit,
          Rate: item.rate,
          TaxRate: item.taxRate,
          Amount: item.amount,
        })),
        IsDraft: false, // Or link to a checkbox in your UI
      };

      this.purchaseOrderService
        .Create(payload)
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe({
          next: (res) => {
            this.loadingService.stop();
            this.PagingSignal.update((state) => ({ ...state, res }));
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Recorded successfully',
            });
            this.showRecordDialog = false;
            this.FG.reset();
            this.cdr.markForCheck();
          },
          error: (err) => {
            this.loadingService.stop();
            // Log the actual error to console to see the backend exception
            console.error('Backend Error:', err);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Check console for details',
            });
          },
        });
    } else {
      ValidateAllFormFields(this.FG);
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
