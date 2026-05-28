import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  signal,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { PurchaseOrderService } from '../../../services/purchaseOrderService';
import { LoadingService } from '../../../services/loading.service';
import { map, Subject, takeUntil } from 'rxjs';
import { PurchaseOrderDto } from '../../../models/PurchaseOrder';
import {
  PagingContent,
  GridifyQueryExtend,
  BuildFilterText,
  BuildSortText,
} from '../../../shared/helpers/helpers';
import { MenuItem, MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { TimelineModule } from 'primeng/timeline';
import { UserService } from '../../../services/userService.service';
import { InputNumberModule } from 'primeng/inputnumber';

@Component({
  selector: 'app-supplier-purchase-order',
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
    TimelineModule,
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
        <div class="text-gray-700 font-semibold">Purchase Orders</div>
      </div>
      <div
        class="mt-3 border border-gray-200 rounded-md tracking-wide bg-white p-5 flex flex-col"
      >
        <div
          class="flex flex-col gap-3 xl:gap-0 xl:flex-row xl:items-center justify-between"
        >
          <div class="flex flex-col">
            <div class="text-[18px] text-gray-700 font-semibold">
              Supplier Purchase Orders
            </div>
            <div class="text-gray-500">
              View, create, and track all purchase orders
            </div>
          </div>
          <div class="flex flex-row items-center gap-2">
            <div class="w-full xl:min-w-[100px] relative">
              <input
                type="text"
                pInputText
                [(ngModel)]="search"
                class="w-full!"
                placeholder="Search by PO No"
                (keydown)="onKeyDown($event)"
              />
              <i
                class="pi pi-search absolute! top-3! right-2! text-gray-500!"
              ></i>
            </div>

            <p-button
              *ngIf="isPurchasing()"
              label="Generate Supplier PO"
              [routerLink]="'/purchase-orders/supplier/form'"
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
                  *ngIf="isPurchasing()"
                  ssss
                  class="w-[5%]! bg-gray-100!"
                ></th>

                <th
                  pSortableColumn="PurchaseOrderNo"
                  class="bg-gray-100! text-center! w-[15%]!"
                >
                  <div class="flex flex-row justify-center items-center gap-2">
                    <div>PO No</div>
                    <p-sortIcon field="PurchaseOrderNo" />
                  </div>
                </th>
                <th class="bg-gray-100! w-[30%]">Company</th>

                <th
                  pSortableColumn="PODate"
                  class="bg-gray-100! text-center! w-[10%]"
                >
                  <div class="flex flex-row justify-center items-center gap-2">
                    <div class="whitespace-nowrap">PO Date</div>
                    <p-sortIcon field="PODate" />
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
                <td *ngIf="isPurchasing()">
                  <div
                    class="flex items-center justify-center cursor-pointer"
                    (click)="onRowExpand(data, fTable)"
                  >
                    <i
                      [class]="
                        expanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'
                      "
                    ></i>
                  </div>
                </td>
                <td class="text-center! font-semibold!">
                  {{ data.purchaseOrderNo }}
                </td>
                <td>
                  {{ data.supplier?.name }}
                </td>

                <td class="text-center!">
                  {{ data.poDate | date: 'dd/MM/yyyy' }}
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
                          data.status === 'Draft',

                        'bg-yellow-100 text-yellow-600':
                          data.status === 'Reviewed',

                        'bg-blue-100 text-blue-600':
                          data.status === 'Approved' ||
                          data.status === 'InProgress',

                        'bg-indigo-100 text-indigo-600':
                          data.status === 'Sent' || data.status === 'Issued',

                        'bg-teal-100 text-teal-600':
                          data.status === 'PartiallyReceived',

                        'bg-green-100 text-green-600':
                          data.status === 'Received',

                        'bg-purple-100 text-purple-600':
                          data.status === 'PartiallyInvoiced',

                        'bg-emerald-100 text-emerald-700':
                          data.status === 'FullyInvoiced',

                        'bg-red-100 text-red-600':
                          data.status === 'Rejected' ||
                          data.status === 'Declined' ||
                          data.status === 'Expired',
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
            <ng-template #expandedrow let-item>
              <tr>
                <td colspan="100%">
                  <div class="px-5">
                    <div class="overflow-x-auto pb-2">
                      <div class="min-w-max">
                        <p-timeline
                          [value]="timelineMap[item.id]"
                          align="top"
                          layout="horizontal"
                          class="customized-timeline"
                        >
                          <ng-template #marker let-event>
                            <div
                              class="w-6 h-6 p-1 flex items-center justify-center rounded-full shadow-sm text-white"
                              [ngClass]="
                                event.actionAt ? 'bg-blue-500' : 'bg-gray-300'
                              "
                            >
                              <i
                                class="pi text-xs"
                                [ngClass]="
                                  event.verified ? 'pi-check' : 'pi-circle-fill'
                                "
                              ></i>
                            </div>
                          </ng-template>

                          <ng-template #content let-event>
                            <div class="flex flex-col min-h-[70px]">
                              <div
                                class="font-semibold text-sm whitespace-nowrap"
                              >
                                {{ event.status }}
                              </div>

                              <small
                                class="text-gray-500 text-xs w-[120px]"
                                *ngIf="event.actionUser"
                              >
                                {{ event.actionUser }}
                              </small>

                              <small
                                class="text-gray-400 text-xs"
                                *ngIf="event.actionAt"
                              >
                                {{
                                  event.actionAt | date: 'dd MMM yyyy hh:mm aa'
                                }}
                              </small>
                            </div>
                          </ng-template>
                        </p-timeline>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </ng-template>
            <ng-template #emptymessage>
              <tr>
                <td colspan="100%" class="border-x!">
                  <div class="text-center text-gray-500">
                    No supplier purchase order found in records.
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
      header="Select Reviewer"
      [(visible)]="displayReviseByDialog"
      [modal]="true"
      styleClass="w-[80%]! lg:w-[50%]!"
    >
      <div class="flex flex-col gap-4 mt-2">
        <label class="font-medium"
          >Assign a reviewer for this po:
          <b>{{ selectedPO?.purchaseOrderNo }}</b></label
        >
        <p-select
          [options]="reviewerSelection || []"
          [(ngModel)]="selectedReviewerId"
          placeholder="Select a Reviewer"
          styleClass="w-full"
          appendTo="body"
          [filter]="true"
        >
        </p-select>
      </div>
      <ng-template pTemplate="footer">
        <p-button
          label="Cancel"
          (click)="displayReviseByDialog = false"
          severity="secondary"
          styleClass="border-gray-200!"
          [text]="true"
        ></p-button>
        <p-button
          label="Update"
          severity="info"
          (click)="confirmReviewer()"
          [disabled]="!selectedReviewerId"
        ></p-button>
      </ng-template>
    </p-dialog>

    <p-dialog
      [(visible)]="displayInvoiceDialog"
      header="Create Purchase Invoice"
      styleClass="w-[92%] lg:w-[45%] rounded-xl"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
    >
      <div class="flex flex-col gap-5">
        <div
          class="bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col gap-2"
        >
          <div class="flex justify-between text-gray-600">
            <span>Total PO</span>
            <span class="font-semibold text-gray-800">
              {{ poTotalAmount | currency: 'RM ' }}
            </span>
          </div>

          <div class="flex justify-between text-gray-600">
            <span>Remaining</span>
            <span class="font-bold text-green-600 text-base">
              {{ poRemainingAmount | currency: 'RM ' }}
            </span>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <label class="font-medium text-gray-700"> Invoice Amount </label>

          <p-inputnumber
            appendTo="body"
            styleClass="w-full"
            inputStyleClass="w-full p-2 text-lg"
            [(ngModel)]="invoiceAmount"
            mode="currency"
            currency="MYR"
            locale="en-MY"
            [useGrouping]="true"
            [minFractionDigits]="2"
            [maxFractionDigits]="2"
          >
          </p-inputnumber>

          <small class="text-gray-400">
            You can partially invoice or fully settle remaining amount
          </small>
        </div>

        <div class="flex flex-wrap gap-2 pt-1">
          <p-button
            label="Full"
            severity="success"
            styleClass="px-4 py-2 rounded-lg"
            (onClick)="invoiceAmount = poRemainingAmount"
          ></p-button>

          <p-button
            label="75%"
            severity="info"
            styleClass="px-4 py-2 rounded-lg"
            (onClick)="invoiceAmount = poRemainingAmount * 0.75"
          ></p-button>

          <p-button
            label="50%"
            severity="warn"
            styleClass="px-4 py-2 rounded-lg"
            (onClick)="invoiceAmount = poRemainingAmount / 2"
          ></p-button>

          <p-button
            label="25%"
            severity="secondary"
            styleClass="px-4 py-2 rounded-lg"
            (onClick)="invoiceAmount = poRemainingAmount * 0.25"
          ></p-button>
        </div>
      </div>

      <ng-template pTemplate="footer">
        <div class="flex justify-end gap-2 w-full">
          <p-button
            severity="secondary"
            label="Cancel"
            (onClick)="displayInvoiceDialog = false"
          ></p-button>

          <p-button
            label="Generate Invoice"
            icon="pi pi-receipt"
            severity="info"
            [disabled]="invoiceAmount <= 0"
            (onClick)="GeneratePurchaseInvoice()"
          ></p-button>
        </div>
      </ng-template>
    </p-dialog>`,
  styleUrl: './supplier-purchase-order.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupplierPurchaseOrder implements OnDestroy {
  @ViewChild('fTable') fTable?: Table;

  private readonly purchaseOrderService = inject(PurchaseOrderService);
  private readonly loadingService = inject(LoadingService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  PagingSignal = signal<PagingContent<PurchaseOrderDto>>(
    {} as PagingContent<PurchaseOrderDto>,
  );
  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  search: string = '';
  selectedReviewerId: string | null = null;

  displayReviseByDialog: boolean = false;
  displayInvoiceDialog: boolean = false;

  menuItems: MenuItem[] = [];
  currentUser = this.userService.currentUser;
  timelineMap: { [key: string]: any[] } = {};

  selectedPO: any;
  events: any[] = [];

  reviewerSelection: { label: string; value: string }[] = [];

  invoiceAmount: number = 0;
  poTotalAmount: number = 0;
  poRemainingAmount: number = 0;

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 10;
    this.Query.Filter = null;
    this.Query.OrderBy = 'CreatedAt desc';
    this.Query.Select = null;
    this.Query.Includes =
      'Supplier.BillingAddress,Supplier.DeliveryAddress,PurchaseOrderStatusHistories.ActionUser';
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
          const statusOrder = [
            'Draft',
            'Reviewed',
            'Approved',
            'Sent',
            'PartiallyReceived',
            'Received',
            'PartiallyInvoiced',
            'FullyInvoiced',
            'Rejected',
          ];

          const allHistories = res.data.flatMap(
            (x) => x.purchaseOrderStatusHistories || [],
          );

          const latestByStatus = new Map<string, any>();

          for (const h of allHistories) {
            const existing = latestByStatus.get(h.status);

            if (
              !existing ||
              new Date(h.actionAt) > new Date(existing.actionAt)
            ) {
              latestByStatus.set(h.status, h);
            }
          }

          const reachedIndex =
            Math.max(
              ...allHistories.map((h) => statusOrder.indexOf(h.status)),
            ) ?? -1;

          this.events = statusOrder.map((status, index) => {
            const item = latestByStatus.get(status);

            return {
              status,
              actionAt: item?.actionAt ?? null,
              actionUser: item?.actionUser?.displayName,
              verified: index <= reachedIndex,
            };
          });

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

    this.Query.Filter = this.Query.Filter
      ? `${this.Query.Filter},Type=Outcoming`
      : 'Type=Outcoming';

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
      PurchaseOrderNo: [
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

    this.Query.Filter = `Type=Outcoming`;
    this.GetData();
  }

  ActionClick(data: PurchaseOrderDto | null, action: string) {
    if (!data && action !== 'Create') return;

    switch (action) {
      case 'Update':
        this.router.navigate(['/purchase-orders/supplier/form'], {
          queryParams: { id: data?.id },
        });
        break;

      case 'Delete':
        this.RemoveRecord(data!);
        break;

      case 'Revised':
        this.showReviewerSelectionDialog(data!);
        break;

      case 'Sent':
        this.updateStatus(data!.id, 'Sent');
        break;

      case 'Approved':
        this.updateStatus(data!.id, 'Approved');
        break;

      case 'Rejected':
        this.updateStatus(data!.id, 'Draft');
        break;

      case 'PartiallyReceived':
        this.updateStatus(data!.id, 'PartiallyReceived');
        break;

      case 'Received':
        this.updateStatus(data!.id, 'Received');
        break;

      case 'GenerateInvoice':
        this.openInvoiceDialog(data);
        break;
    }
  }

  GeneratePurchaseInvoice() {
    this.loadingService.start();

    this.purchaseOrderService
      .ConvertToPurchaseInvoice(this.selectedPO.id, this.invoiceAmount)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();

          this.messageService.add({
            severity: 'success',
            summary: 'Invoice Generated',
            detail: `Invoice ${res.invoice.invoiceNo} created successfully`,
          });

          const state = this.PagingSignal();

          const updated = state.data.map((po) => {
            if (po.id === this.selectedPO.id) {
              return {
                ...po,
                status: res.purchaseOrder?.status ?? po.status,
              };
            }
            return po;
          });

          this.PagingSignal.set({
            ...state,
            data: updated,
          });

          this.displayInvoiceDialog = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loadingService.stop();

          this.messageService.add({
            severity: 'error',
            summary: 'Failed',
            detail: err.error?.message || 'Failed to generate invoice',
          });
        },
      });
  }

  RemoveRecord(data: PurchaseOrderDto) {
    this.loadingService.start();
    this.purchaseOrderService
      .Delete(data.id)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          const currentPaging = this.PagingSignal();
          const updatedData = currentPaging.data.filter(
            (item) => item.id !== data.id,
          );

          this.PagingSignal.set({
            ...currentPaging,
            data: updatedData,
            totalElements: currentPaging.totalElements - 1,
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
  }

  onRowExpand(data: PurchaseOrderDto, table: Table) {
    if (!this.timelineMap[data.id]) {
      this.timelineMap[data.id] = this.buildTimeline(data);
    }

    table.toggleRow(data);
  }

  buildTimeline(po: PurchaseOrderDto): any[] {
    const statusOrder = [
      'Draft',
      'Reviewed',
      'Approved',
      'Sent',
      'PartiallyReceived',
      'Received',
      'PartiallyInvoiced',
      'FullyInvoiced',
      'Rejected',
    ];

    const histories = po.purchaseOrderStatusHistories || [];
    const latestByStatus = new Map<string, any>();

    for (const h of histories) {
      const existing = latestByStatus.get(h.status);

      if (!existing || new Date(h.actionAt) > new Date(existing.actionAt)) {
        latestByStatus.set(h.status, h);
      }
    }

    const reachedIndex =
      Math.max(...histories.map((h) => statusOrder.indexOf(h.status))) ?? -1;

    return statusOrder.map((status, index) => {
      const item = latestByStatus.get(status);

      return {
        status,
        actionAt: item?.actionAt ?? null,
        actionUser: item?.actionUser?.displayName || '-',
        verified: index <= reachedIndex,
      };
    });
  }

  onEllipsisClick(event: any, po: PurchaseOrderDto, menu: any) {
    this.menuItems = this.buildMenuItems(po);
    menu.toggle(event);
  }

  private buildMenuItems(po: PurchaseOrderDto) {
    const items: any[] = [];
    const status = po.status;

    const add = (item: any) => items.push(item);

    const inStatus = (...s: string[]) => s.includes(status);

    if (inStatus('Draft', 'Open') && this.isPurchasing()) {
      add({
        label: 'Edit',
        icon: 'pi pi-pencil',
        command: () => this.ActionClick(po, 'Update'),
      });
    }

    if (status === 'Draft' && this.isPurchasing()) {
      add({
        label: 'Under review',
        icon: 'pi pi-file-edit',
        command: () => this.updateStatus(po.id, 'Reviewed'),
      });
    }

    if (status === 'Reviewed' && this.isPurchasing()) {
      add({
        label: 'Approved',
        icon: 'pi pi-check-circle',
        command: () => this.updateStatus(po.id, 'Approved'),
      });
      add({
        label: 'Rejected',
        icon: 'pi pi-times-circle',
        command: () => this.updateStatus(po.id, 'Rejected'),
      });
    }

    if (status === 'Approved' && this.isPurchasing()) {
      add({
        label: 'Mark as Sent',
        icon: 'pi pi-send',
        command: () => this.updateStatus(po.id, 'Sent'),
      });
    }

    if (status === 'Sent' && this.isPurchasing()) {
      add({
        label: 'Partially Received',
        icon: 'pi pi-box',
        command: () => this.updateStatus(po.id, 'PartiallyReceived'),
      });
    }

    if (inStatus('Sent', 'PartiallyReceived') && this.isPurchasing()) {
      add({
        label: 'Received',
        icon: 'pi pi-box',
        command: () => this.updateStatus(po.id, 'Received'),
      });
    }

    if (
      inStatus('PartiallyReceived', 'Received', 'PartiallyInvoiced') &&
      this.isAccounting()
    ) {
      add({
        label: 'Create Invoice',
        icon: 'pi pi-receipt',
        command: () => this.ActionClick(po, 'GenerateInvoice'),
      });
    }

    if (inStatus('Draft')) {
      add({
        label: 'Delete',
        icon: 'pi pi-trash',
        styleClass: '!text-red-500',
        command: () => this.ActionClick(po, 'Delete'),
      });
    }
    if (!inStatus('Rejected') || !inStatus('Cancelled')) {
      add({
        label: 'Download PO',
        icon: 'pi pi-file',
        command: () => this.ActionClick(po, 'Download'),
      });
    }

    return items;
  }

  openInvoiceDialog(po: any) {
    this.selectedPO = po;

    this.poTotalAmount = po.totalAmount;

    const invoiced =
      po.purchaseOrderItems?.reduce(
        (sum: number, x: any) => sum + x.invoicedQuantity * x.unitPrice,
        0,
      ) || 0;

    this.poRemainingAmount = this.poTotalAmount - po.invoicedAmount;

    this.invoiceAmount = this.poRemainingAmount;

    this.displayInvoiceDialog = true;
  }

  showReviewerSelectionDialog(po: any) {
    this.selectedPO = po;
    this.selectedReviewerId = null;
    this.displayReviseByDialog = true;
    this.userService
      .GetMany({
        Page: 1,
        PageSize: 100,
        OrderBy: 'FullName desc',
        Select: 'Id,FullName,JobTitle,Email',
        Includes: null,
        Filter: `JobTitle=Sales Director|JobTitle=Sales Support|JobTitle=Sales Executive`,
      })
      .pipe(
        map(
          (res) =>
            (this.reviewerSelection = res.data.map((user: any) => ({
              label: `${user.FullName} — ${user.JobTitle || 'Staff'}`,
              value: user.Id,
            }))),
        ),
      )
      .subscribe();
    this.cdr.detectChanges();
  }

  confirmReviewer() {
    if (!this.selectedPO) return;

    this.loadingService.start();

    this.purchaseOrderService
      .UpdateStatus(this.selectedPO.id, 'Revised', this.selectedReviewerId)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res: any) => {
          this.loadingService.stop();

          const currentPaging = this.PagingSignal();

          const reviewer = this.reviewerSelection.find(
            (x) => x.value === this.selectedReviewerId,
          );

          const reviewerName = reviewer?.label.split(' — ')[0] || '-';

          const updatedData = currentPaging.data.map((q) => {
            if (q.id === this.selectedPO.id) {
              const newHistory = {
                id: res.id,
                status: res.status,
                actionAt: res.actionAt,
                remarks: res.remarks,
                actionUser: res.actionUser,
                reviewedByUser: {
                  id: this.selectedReviewerId,
                  fullName: reviewerName,
                },
                purchaseOrderId: q.id,
                actionUserId: res.actionUser?.id,
                reviewedByUserId: this.selectedReviewerId,
                createdAt: res.actionAt,
                signatureImage: null,
              } as any;

              const updatedHistories = [
                ...(q.purchaseOrderStatusHistories || []),
                newHistory,
              ];

              return {
                ...q,
                status: 'Revised',
                purchaseOrderStatusHistories: updatedHistories,
              };
            }
            return q;
          });

          this.PagingSignal.set({
            ...currentPaging,
            data: updatedData,
          });

          this.displayReviseByDialog = false;

          this.messageService.add({
            severity: 'success',
            summary: 'Status Updated',
            detail: res.remarks,
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
  updateStatus(id: string, newStatus: string) {
    this.loadingService.start();

    this.purchaseOrderService
      .UpdateStatus(id, newStatus)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();

          const currentPaging = this.PagingSignal();

          const reviewer = this.reviewerSelection.find(
            (x) => x.value === this.selectedReviewerId,
          );

          const reviewerName = reviewer?.label.split(' — ')[0] || '-';

          const updatedData = currentPaging.data.map((q) => {
            if (q.id === id) {
              const newHistory = {
                id: res.id,
                status: res.status,
                actionAt: res.actionAt,
                remarks: res.remarks,
                actionUser: res.actionUser,
                reviewedByUser: {
                  id: this.selectedReviewerId,
                  fullName: reviewerName,
                },
                purchaseOrderId: q.id,
                actionUserId: res.actionUser?.id,
                reviewedByUserId: this.selectedReviewerId,
                createdAt: res.actionAt,
                signatureImage: null,
              } as any;

              const updatedHistories = [
                ...(q.purchaseOrderStatusHistories || []),
                newHistory,
              ];

              const updatedPO = {
                ...q,
                status: res.status,
                purchaseOrderStatusHistories: updatedHistories,
              };

              this.timelineMap = {
                ...this.timelineMap,
                [id]: this.buildTimeline(updatedPO),
              };

              return {
                ...q,
                status: newStatus,
                purchaseOrderStatusHistories: updatedHistories,
              };
            }

            return q;
          });

          this.PagingSignal.set({
            ...currentPaging,
            data: updatedData,
          });

          this.displayReviseByDialog = false;

          this.messageService.add({
            severity: 'success',
            summary: 'Status Updated',
            detail: res.remarks,
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

  getStatusColor(status: string): string {
    switch (status) {
      case 'Draft':
        return 'bg-gray-400';

      case 'Revised':
        return 'bg-yellow-400';

      case 'Approved':
        return 'bg-green-500';

      case 'Sent':
        return 'bg-blue-500';

      case 'Issued':
        return 'bg-indigo-500';

      case 'PartiallyReceived':
        return 'bg-orange-400';

      case 'Received':
        return 'bg-emerald-500';

      case 'Rejected':
        return 'bg-red-500';

      default:
        return 'bg-gray-300';
    }
  }

  isPurchasing(): boolean {
    return (
      this.currentUser?.jobTitle === 'Senior Procurement Executive' ||
      this.currentUser?.jobTitle === 'Purchasing Executive' ||
      this.currentUser?.jobTitle === 'Project Director' ||
      this.currentUser?.jobTitle === 'Sales Director'
    );
  }

  isAccounting(): boolean {
    return this.currentUser?.jobTitle === 'Admin and Account Executive';
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
