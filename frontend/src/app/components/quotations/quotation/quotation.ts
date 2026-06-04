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
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { SelectModule } from 'primeng/select';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { LoadingService } from '../../../services/loading.service';
import { MenuItem, MessageService } from 'primeng/api';
import { QuotationService } from '../../../services/quotationService.service';
import { map, Observable, Subject, takeUntil } from 'rxjs';
import {
  BuildFilterText,
  BuildSortText,
  GridifyQueryExtend,
  PagingContent,
} from '../../../shared/helpers/helpers';
import {
  QuotationDto,
  QuotationStatusHistory,
} from '../../../models/Quotation';
import { UserService } from '../../../services/userService.service';
import { TimelineModule } from 'primeng/timeline';
import { HasPermissionDirective } from '../../../common/directives/hasPermission.directive';
import { PermissionService } from '../../../services/permissionService';
import { DatePickerModule } from 'primeng/datepicker';
import { DrawerModule } from 'primeng/drawer';

@Component({
  selector: 'app-quotation',
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
    TimelineModule,
    HasPermissionDirective,
    DatePickerModule,
    DrawerModule,
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
        <div class="text-gray-700 font-semibold">Quotations</div>
      </div>

      <div
        class="mt-3 border border-gray-200 rounded-md tracking-wide bg-white p-5 flex flex-col"
      >
        <div class="flex flex-row items-center justify-between">
          <div class="flex flex-col">
            <div class="text-[20px] text-gray-700 font-semibold">
              Quotations
            </div>
            <div class="text-gray-500">
              View, create, and track all project quotations
            </div>
          </div>

          <div class="flex flex-row items-center gap-2">
            <div class="min-w-[300px] relative">
              <input
                type="text"
                pInputText
                [(ngModel)]="search"
                (keydown)="onKeyDown($event)"
                class="w-full!"
                placeholder="Search by quotation no"
              />
              <i
                class="pi pi-search absolute! top-3! right-2! text-gray-500!"
              ></i>
            </div>

            <p-button
              *hasPermission="'QUOTATION'; action: 'canCreate'"
              label="New Quotation"
              [routerLink]="'/quotations/form'"
              icon="pi pi-plus"
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
            [rowsPerPageOptions]="[10, 20, 30, 50]"
            stripedRows="false"
            [lazy]="true"
            (onLazyLoad)="NextPage($event)"
            showGridlines
            [expandedRowKeys]="expandedRows"
          >
            <ng-template #header>
              <tr>
                <th
                  class="w-[5%]! bg-gray-100!"
                  *ngIf="permissions().canUpdate"
                ></th>
                <th
                  pSortableColumn="QuotationNo"
                  class="bg-gray-100! text-center! w-[20%]!"
                >
                  <div class="flex flex-row justify-center items-center gap-2">
                    <div>Quotation No</div>
                    <p-sortIcon field="QuotationNo" />
                  </div>
                </th>
                <th class="bg-gray-100! text-center! w-[30%]">Client</th>
                <th
                  pSortableColumn="QuotationDate"
                  class="bg-gray-100! text-center! w-[15%]!"
                >
                  <div class="flex flex-row justify-center items-center gap-2">
                    <div>Date</div>
                    <p-sortIcon field="QuotationDate" />
                  </div>
                </th>
                <th
                  pSortableColumn="Status"
                  class="bg-gray-100! text-center! w-[10%]!"
                >
                  <div class="flex flex-row justify-center items-center gap-2">
                    <div>Status</div>
                    <p-sortIcon field="Status" />
                  </div>
                </th>
                <th
                  *ngIf="
                    permissions().canUpdate ||
                    permissions().canUpdateStatus ||
                    permissions().canDelete
                  "
                  class="bg-gray-100! text-center! w-[10%]"
                >
                  Action
                </th>
              </tr>
            </ng-template>

            <ng-template
              #body
              let-data
              let-rowIndex="rowIndex"
              let-expanded="expanded"
            >
              <tr>
                <td *ngIf="permissions().canUpdate">
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
                  {{ data.quotationNo }}
                </td>
                <td class="text-center!">{{ data.client?.name }}</td>
                <td class="text-center!">
                  {{ data.quotationDate | date: 'dd/MM/yyyy' }}
                </td>
                <td class="text-center!">
                  <div class="flex justify-center">
                    <div
                      class="rounded-full px-4 text-sm py-0.5 font-medium w-fit whitespace-nowrap"
                      [ngClass]="{
                        'bg-blue-100 text-blue-600':
                          data.status === 'Reviewed' ||
                          data.status === 'Sent' ||
                          data.status === 'Approved',
                        'bg-orange-100 text-orange-600':
                          data.status === 'Draft',
                        'bg-green-100 text-green-600':
                          data.status === 'Accepted',
                        'bg-red-100 text-red-600':
                          data.status === 'Rejected' ||
                          data.status === 'Cancelled',
                      }"
                    >
                      {{ data.status }}
                    </div>
                  </div>
                </td>
                <td
                  *ngIf="
                    permissions().canUpdate ||
                    permissions().canUpdateStatus ||
                    permissions().canDelete
                  "
                  class="text-center!"
                >
                  <div
                    class="flex items-center justify-center"
                    *ngIf="data.status !== 'Cancelled'"
                  >
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
                    <p-timeline
                      [value]="timelineMap[item.id]"
                      align="top"
                      layout="horizontal"
                      class="customized-timeline w-full whitespace-nowrap"
                    >
                      <ng-template #marker let-event>
                        <div
                          class="w-6 h-6 p-2 flex items-center justify-center rounded-full shadow-sm text-white"
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
                          <div class="font-semibold text-sm">
                            {{ event.status }}
                          </div>
                          <small
                            class="text-gray-500 text-xs"
                            *ngIf="event.actionUser"
                          >
                            {{ event.actionUser }}
                          </small>
                          <small
                            class="text-gray-400 text-xs"
                            *ngIf="event.actionAt"
                          >
                            {{ event.actionAt | date: 'dd MMM, yyyy HH:mm aa' }}
                          </small>
                        </div>
                      </ng-template>
                    </p-timeline>
                  </div>
                </td>
              </tr>
            </ng-template>

            <ng-template #emptymessage>
              <tr>
                <td colspan="100%" class="border-x!">
                  <div class="text-center text-gray-500">
                    No quotation found in records.
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
      header="Convert Quotation to Sales Order"
      [(visible)]="displayConvertSODialog"
      [modal]="true"
      [style]="{ width: '450px' }"
      [draggable]="false"
      [resizable]="false"
      (onHide)="resetConvertForm()"
    >
      <div class="flex flex-col gap-4 py-2 text-sm text-gray-700 tracking-wide">
        <div class="flex flex-col gap-1">
          <label class="font-semibold text-gray-600"
            >Client PO Number <span class="text-red-500">*</span></label
          >
          <input
            type="text"
            pInputText
            [(ngModel)]="soForm.clientPONumber"
            placeholder="e.g., PO-12345"
            class="w-full"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="font-semibold text-gray-600">PO Received Date</label>

          <p-datepicker
            [(ngModel)]="soForm.clientPODate"
            appendTo="body"
            [showIcon]="true"
            dateFormat="dd/mm/yy"
            inputStyleClass="w-full"
            styleClass="w-full"
          >
          </p-datepicker>
        </div>

        <div class="flex flex-col gap-1">
          <label class="font-semibold text-gray-600">Remarks</label>
          <input
            type="text"
            pInputText
            [(ngModel)]="soForm.remarks"
            placeholder="Optional notes..."
            class="w-full"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="font-semibold text-gray-600"
            >PO Attachment File <span class="text-red-500">*</span></label
          >
          <div
            class="flex items-center justify-between gap-2 border border-dashed border-gray-300 rounded p-3 bg-gray-50"
          >
            <input
              type="file"
              id="poFile"
              (change)="onFileSelected($event)"
              accept=".pdf,.png,.jpg,.jpeg"
              class="hidden"
              #fileInput
            />
            <div class="flex flex-col truncate max-w-[250px]">
              <span
                *ngIf="soForm.clientPOAttachment"
                (click)="downloadLocalFile(soForm.clientPOAttachment)"
                class="text-xs text-blue-600 hover:text-blue-800 font-medium underline cursor-pointer truncate flex items-center gap-1"
              >
                <i class="pi pi-download text-[10px]"></i>
                {{ soForm.clientPOAttachment.name }}
              </span>
              <span
                *ngIf="!soForm.clientPOAttachment"
                class="text-xs text-gray-500 font-medium truncate"
                >No file chosen</span
              >
            </div>
            <p-button
              label="Choose File"
              size="small"
              icon="pi pi-upload"
              severity="secondary"
              (click)="fileInput.click()"
            ></p-button>
          </div>
        </div>
      </div>

      <ng-template #footer>
        <div class="flex justify-end gap-2 mt-2">
          <p-button
            label="Cancel"
            severity="secondary"
            styleClass="py-1.5!"
            (click)="displayConvertSODialog = false"
          ></p-button>
          <p-button
            label="Convert"
            severity="success"
            styleClass="py-1.5!"
            [disabled]="!soForm.clientPONumber || !soForm.clientPOAttachment"
            (click)="submitConvertToSO()"
          ></p-button>
        </div>
      </ng-template>
    </p-dialog>

    <p-drawer
      [(visible)]="displayDetailsDrawer"
      position="right"
      styleClass="w-[60%]!"
      [modal]="true"
      [showCloseIcon]="false"
      (onHide)="selectedQuotation = null"
      ><ng-template #header>
        <div class="flex items-center gap-3 tracking-wide">
          <span class="text-xl font-semibold text-gray-800"
            >Quotation Details</span
          >

          <div
            *ngIf="!loadingDetails && selectedQuotation"
            class="rounded-full px-3 py-0.5 text-xs font-semibold uppercase tracking-wider"
            [ngClass]="{
              'bg-blue-100 text-blue-600':
                selectedQuotation.status === 'Reviewed' ||
                selectedQuotation.status === 'Sent' ||
                selectedQuotation.status === 'Approved',
              'bg-orange-100 text-orange-600':
                selectedQuotation.status === 'Draft',
              'bg-green-100 text-green-600':
                selectedQuotation.status === 'Accepted',
              'bg-red-100 text-red-600':
                selectedQuotation.status === 'Rejected' ||
                selectedQuotation.status === 'Cancelled',
            }"
          >
            {{ selectedQuotation.status }}
          </div>
        </div>
      </ng-template>
      <div
        *ngIf="loadingDetails"
        class="flex flex-col items-center justify-center py-8 gap-2 text-gray-500"
      >
        <i class="pi pi-spin pi-spinner text-2xl"></i>
        <span>Loading detailed items...</span>
      </div>

      <div
        *ngIf="!loadingDetails && selectedQuotation"
        class="flex flex-col gap-5 tracking-wide text-gray-700"
      >
        <div
          class="bg-gray-50 border border-gray-100 rounded-lg p-4 flex flex-col gap-1.5"
        >
          <div class="flex justify-between items-center">
            <span class="text-sm font-bold text-gray-400 uppercase"
              >Quotation No</span
            >
            <span class="font-semibold text-gray-800">{{
              selectedQuotation.quotationNo
            }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm font-bold text-gray-400 uppercase"
              >Subject</span
            >
            <span class="text-gray-600 truncate max-w-[600px] font-medium">{{
              selectedQuotation.subject || '-'
            }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm font-bold text-gray-400 uppercase"
              >Project Code</span
            >
            <span class="text-gray-600 font-mono">{{
              selectedQuotation.projectCode || '-'
            }}</span>
          </div>
        </div>

        <div>
          <h3
            class="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2"
          >
            Terms & Conditions
          </h3>
          <div
            class="grid grid-cols-2 gap-3 bg-white border border-gray-200 rounded-lg p-4"
          >
            <div>
              <label class="text-sm text-gray-400 block">Payment Terms</label>
              <span class="font-medium text-gray-700">{{
                selectedQuotation.paymentTerms || '-'
              }}</span>
            </div>
            <div>
              <label class="text-sm text-gray-400 block">Validity period</label>
              <span class="font-medium text-gray-700">{{
                selectedQuotation.validityDays
                  ? selectedQuotation.validityDays +
                    ' Days (with effect from the date of this quotation)'
                  : '-'
              }}</span>
            </div>
            <div class="col-span-2 border-t border-gray-100 pt-2">
              <label class="text-sm text-gray-400 block"
                >Delivery Timeline</label
              >
              <span class="font-medium text-gray-700">{{
                selectedQuotation.deliveryTimeline || '-'
              }}</span>
            </div>
          </div>
        </div>

        <div>
          <h3
            class="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2"
          >
            Line Summary
          </h3>
          <div
            class="border border-gray-200 rounded-lg overflow-hidden bg-white"
          >
            <p-table
              class="w-full text-left border-collapse"
              [value]="selectedQuotation.quotationItems || []"
            >
              <ng-template #header>
                <tr
                  class="bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-500"
                >
                  <th class="p-2.5 bg-gray-100!">Item Description</th>
                  <th class="p-2.5 text-center! w-[15%] bg-gray-100!">Qty</th>
                  <th class="p-2.5 text-right! w-[25%] bg-gray-100!">
                    Unit Price
                  </th>
                  <th class="p-2.5 text-center! w-[25%] bg-gray-100!">Unit</th>

                  <th class="p-2.5 text-right! w-[25%] bg-gray-100!">Total</th>
                </tr>
              </ng-template>
              <ng-template #body let-item>
                <tr>
                  <td class="p-2.5 font-medium text-gray-700 text-sm">
                    <div [innerHTML]="item.description"></div>
                  </td>
                  <td class="p-2.5 text-center! text-gray-600">
                    {{ item.quantity }}
                  </td>
                  <td
                    class="p-2.5 text-right! text-gray-600 font-mono text-base"
                  >
                    {{ item.unitPrice | currency: 'RM ' : 'symbol' : '1.2-2' }}
                  </td>
                  <td class="p-2.5 text-center! text-gray-600 text-sm">
                    {{ item.unit }}
                  </td>
                  <td
                    class="p-2.5 text-right! text-gray-600 font-mono text-base"
                  >
                    {{ item.totalPrice | currency: 'RM ' : 'symbol' : '1.2-2' }}
                  </td>
                </tr>
                <tr *ngIf="!selectedQuotation.quotationItems?.length">
                  <td
                    colspan="100%"
                    class="p-4 text-center! text-gray-400 italic"
                  >
                    No items found.
                  </td>
                </tr>
              </ng-template>
            </p-table>
          </div>
        </div>

        <div
          class="mt-2 border-t border-gray-200 pt-4 flex flex-col items-end gap-2 text-sm"
        >
          <div class="flex justify-between w-[220px] text-gray-500">
            <span>Subtotal:</span>
            <span class="font-mono text-base">{{
              selectedQuotation.subTotal ?? 0
                | currency: 'RM ' : 'symbol' : '1.2-2'
            }}</span>
          </div>
          <div
            *ngIf="selectedQuotation.discount"
            class="flex justify-between w-[250px] text-red-500"
          >
            <span>Discount:</span>
            <span class="font-mono text-base"
              >-{{
                selectedQuotation.discount ?? 0
                  | currency: 'RM ' : 'symbol' : '1.2-2'
              }}</span
            >
          </div>
          <div class="flex justify-between w-[250px] text-gray-500">
            <span>Tax Amount:</span>
            <span class="font-mono text-base">{{
              selectedQuotation.taxAmount ?? 0
                | currency: 'RM ' : 'symbol' : '1.2-2'
            }}</span>
          </div>
          <div
            class="flex justify-between w-[250px] text-lg font-bold text-gray-800 border-t border-gray-100 pt-2"
          >
            <span>Total Amount:</span>
            <span class="font-mono text-blue-600">{{
              selectedQuotation.totalAmount
                | currency: 'RM ' : 'symbol' : '1.2-2'
            }}</span>
          </div>
        </div>
      </div>
    </p-drawer>`,
  styleUrl: './quotation.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Quotation implements OnInit, OnDestroy {
  @ViewChild('fTable') fTable?: Table;

  private readonly quotationService = inject(QuotationService);
  private readonly userService = inject(UserService);
  private readonly loadingService = inject(LoadingService);
  private readonly messageService = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();
  private readonly permissionService = inject(PermissionService);

  PagingSignal = signal<PagingContent<QuotationDto>>(
    {} as PagingContent<QuotationDto>,
  );
  Query: GridifyQueryExtend = {} as GridifyQueryExtend;
  expandedRows: { [key: string]: boolean } = {};

  search: string = '';
  menuItems: MenuItem[] = [];
  events: any[] = [];

  displayReviseByDialog: boolean = false;
  displayConvertSODialog: boolean = false;
  displayDetailsDrawer: boolean = false;
  loadingDetails: boolean = false;

  selectedQuotation: any;

  currentUser = this.userService.currentUser;

  reviewerSelection: { label: string; value: string }[] = [];

  isAdmin: boolean = false;

  timelineMap: { [key: string]: any[] } = {};
  permissions = this.permissionService.getModuleRights('QUOTATION');

  soForm = {
    quotationData: null as any,
    clientPONumber: '',
    clientPODate: '',
    remarks: '',
    clientPOAttachment: null as File | null,
  };

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 10;
    this.Query.Filter = null;
    this.Query.OrderBy = 'CreatedAt desc';
    this.Query.Select = null;
    this.Query.Includes =
      'Client,QuotationStatusHistories,QuotationStatusHistories.ActionUser,QuotationItems,Project';
  }

  ngOnInit(): void {}

  GetData() {
    this.loadingService.start();

    this.quotationService
      .GetMany(this.Query)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();
          this.PagingSignal.set(res);

          const statusOrder = [
            'Draft',
            'Reviewed',
            'Sent',
            'Accepted',
            'Rejected',
            'Cancelled',
          ];

          const allHistories = res.data.flatMap(
            (x) => x.quotationStatusHistories || [],
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

    this.Query.Filter =
      !this.permissions().canUpdate && !this.permissions().canCreate
        ? `${BuildFilterText(event)},Status=Accepted`
        : BuildFilterText(event);

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
      QuotationNo: [
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

    this.Query.Filter =
      !this.permissions().canUpdate && !this.permissions().canCreate
        ? 'Status=Accepted'
        : null;
    this.GetData();
  }

  ActionClick(data: QuotationDto | null, action: string) {
    if (!data) return;

    if (action === 'Update') {
      this.router.navigate(['/quotations/form'], {
        queryParams: { id: data.id },
      });
    } else if (action === 'Convert') {
      this.soForm.quotationData = data;
      this.displayConvertSODialog = true;
      this.cdr.markForCheck();
    } else if (action === 'Download') {
      this.quotationService.downloadPdf(data.id);
    }
  }

  onRowExpand(data: QuotationDto, table: Table) {
    if (!this.timelineMap[data.id]) {
      this.timelineMap[data.id] = this.buildTimeline(data);
    }

    table.toggleRow(data);
  }

  onEllipsisClick(event: any, quotation: QuotationDto, menu: any) {
    const status = quotation.status;
    const rights = this.permissions();

    this.menuItems = [];

    if (rights.canUpdate && status === 'Draft') {
      this.menuItems.push({
        label: 'Edit',
        icon: 'pi pi-pencil',
        command: () => this.ActionClick(quotation, 'Update'),
      });
    }

    if (rights.canUpdateStatus) {
      if (status === 'Draft') {
        this.menuItems.push({
          label: 'Reviewed',
          icon: 'pi pi-file-edit',
          command: () => this.updateQuotationStatus(quotation.id, 'Reviewed'),
        });
      }

      if (status === 'Reviewed') {
        this.menuItems.push({
          label: 'Mark As Sent',
          icon: 'pi pi-send',
          command: () => this.updateQuotationStatus(quotation.id, 'Sent'),
        });
      }

      if (status === 'Sent') {
        this.menuItems.push(
          {
            label: 'Convert to SO',
            icon: 'pi pi-file',
            command: () => this.ActionClick(quotation, 'Convert'),
          },
          {
            label: 'Rejected',
            icon: 'pi pi-times-circle',
            command: () => this.updateQuotationStatus(quotation.id, 'Rejected'),
          },
        );
      }

      if (status === 'Reviewed') {
        this.menuItems.push({
          label: 'Cancel',
          icon: 'pi pi-times-circle',
          command: () => this.updateQuotationStatus(quotation.id, 'Cancelled'),
        });
      }
    }

    if (rights.canDelete && status === 'Draft') {
      this.menuItems.push({
        label: 'Delete',
        icon: 'pi pi-trash',
        command: () => this.deleteQuotation(quotation.id),
      });
    }

    if (rights.canRead && status === 'Accepted') {
      this.menuItems.push(
        {
          label: 'View Details',
          icon: 'pi pi-eye',
          command: () => this.openDetailsDrawer(quotation),
        },
        {
          label: 'Download File',
          icon: 'pi pi-file',
          command: () => this.ActionClick(quotation, 'Download'),
        },
      );
    } else if (rights.canRead && status === 'Rejected') {
      this.menuItems.push({
        label: 'View Details',
        icon: 'pi pi-eye',
        command: () => this.openDetailsDrawer(quotation),
      });
    }

    if (this.menuItems.length > 0) {
      menu.toggle(event);
    }
  }

  openDetailsDrawer(data: QuotationDto) {
    this.displayDetailsDrawer = true;
    this.loadingDetails = true;
    setTimeout(() => {
      this.selectedQuotation = data;
      this.loadingDetails = false;
    }, 100);
    this.cdr.markForCheck();
  }

  updateQuotationStatus(id: string, newStatus: string) {
    this.loadingService.start();

    this.quotationService
      .UpdateStatus(id, newStatus)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res: any) => {
          this.loadingService.stop();

          const currentPaging = this.PagingSignal();

          const updatedData = currentPaging.data.map((q) => {
            if (q.id !== id) return q;

            const newHistory = {
              id: res.id,
              status: res.status,
              actionAt: res.actionAt,
              remarks: res.remarks,
              actionUser: res.actionUser,
              quotationId: id,
              actionUserId: res.actionUser?.id,
              createdAt: res.actionAt,
              signatureImage: null,
            } as any;

            const updatedHistories = [
              ...(q.quotationStatusHistories || []),
              newHistory,
            ];

            const updatedQuotation = {
              ...q,
              status: res.status,
              quotationStatusHistories: updatedHistories,
            };

            this.timelineMap = {
              ...this.timelineMap,
              [id]: this.buildTimeline(updatedQuotation),
            };

            return updatedQuotation;
          });

          this.PagingSignal.set({
            ...currentPaging,
            data: updatedData,
          });

          this.messageService.add({
            severity: 'success',
            summary: 'Status Updated',
            detail: `Quotation is now ${res.status}`,
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

  buildTimeline(quotation: QuotationDto): any[] {
    const statusOrder = [
      'Draft',
      'Reviewed',
      'Sent',
      'Accepted',
      'Rejected',
      'Cancelled',
    ];

    const histories = quotation.quotationStatusHistories || [];
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

  onFileSelected(event: any) {
    const fileList: FileList = event.target.files;
    if (fileList.length > 0) {
      this.soForm.clientPOAttachment = fileList[0];
    }
  }

  submitConvertToSO() {
    if (
      !this.soForm.clientPONumber ||
      !this.soForm.clientPOAttachment ||
      !this.soForm.quotationData
    ) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please provide a PO Number and upload an attachment file.',
      });
      return;
    }

    this.loadingService.start();
    this.displayConvertSODialog = false;

    const quotationId = this.soForm.quotationData.id;

    let formattedPODate: string | undefined = undefined;
    if (this.soForm.clientPODate) {
      const dateObj = new Date(this.soForm.clientPODate);
      if (!isNaN(dateObj.getTime())) {
        formattedPODate = dateObj.toISOString().split('T')[0];
      }
    }

    this.quotationService
      .ConvertToSalesOrder(
        quotationId,
        this.soForm.clientPONumber,
        formattedPODate || undefined,
        this.soForm.clientPOAttachment || undefined,
        this.soForm.remarks || undefined,
      )
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res: any) => {
          this.loadingService.stop();
          this.messageService.add({
            severity: 'success',
            summary: 'Converted Successfully',
            detail: `Sales Order generated: ${res.salesOrderNo}`,
          });

          const currentPaging = this.PagingSignal();

          const newHistory: QuotationStatusHistory = {
            id: res.id ?? crypto.randomUUID(),
            status: 'Accepted',
            actionAt: new Date(),
            remarks: `Converted into Sales Order ${res.salesOrderNo}`,
            actionUser: this.currentUser
              ? {
                  id: this.currentUser.userId,
                  fullName: this.currentUser.fullName,
                }
              : undefined,
            actionUserId: this.currentUser?.userId || '',
            quotationId: quotationId,

            quotation: null as any,
          };

          const updatedData: QuotationDto[] = currentPaging.data.map((q) => {
            if (q.id !== quotationId) return q;

            const updatedHistories: QuotationStatusHistory[] = [
              ...(q.quotationStatusHistories || []),
              newHistory,
            ];

            const updatedQuotation: QuotationDto = {
              ...q,
              status: 'Accepted',
              quotationStatusHistories: updatedHistories,
            };

            this.timelineMap = {
              ...this.timelineMap,
              [quotationId]: this.buildTimeline(updatedQuotation),
            };

            return updatedQuotation;
          });

          this.PagingSignal.set({
            ...currentPaging,
            data: updatedData,
          });
          this.resetConvertForm();
          this.cdr.markForCheck();
        },
        error: () => {
          this.loadingService.stop();
        },
      });
  }

  downloadLocalFile(file: File | null) {
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);

    const tempAnchor = document.createElement('a');
    tempAnchor.href = objectUrl;
    tempAnchor.download = file.name;

    document.body.appendChild(tempAnchor);
    tempAnchor.click();

    document.body.removeChild(tempAnchor);
    URL.revokeObjectURL(objectUrl);
  }

  resetConvertForm() {
    this.soForm = {
      quotationData: null,
      clientPONumber: '',
      clientPODate: '',
      remarks: '',
      clientPOAttachment: null,
    };
  }

  convert(type: 'Invoice' | 'SO', data: any) {
    this.loadingService.start();

    const action$: Observable<any> =
      type === 'Invoice'
        ? this.quotationService.ConvertToInvoice(data.id)
        : this.quotationService.ConvertToSalesOrder(data.id);

    action$.subscribe({
      next: (res: any) => {
        this.loadingService.stop();
        this.messageService.add({
          severity: 'success',
          summary: 'Converted Successfully',
          detail: `${type} generated: ${res.invoiceNo || res.salesOrderNo}`,
        });
      },
      error: () => this.loadingService.stop(),
    });
  }

  deleteQuotation(id: string) {
    this.loadingService.start();

    this.quotationService
      .Delete(id)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: () => {
          this.loadingService.stop();

          const current = this.PagingSignal();
          this.PagingSignal.set({
            ...current,
            data: current.data.filter((x) => x.id !== id),
          });

          this.messageService.add({
            severity: 'success',
            summary: 'Deleted',
            detail: 'Quotation removed successfully',
          });

          this.cdr.markForCheck();
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
