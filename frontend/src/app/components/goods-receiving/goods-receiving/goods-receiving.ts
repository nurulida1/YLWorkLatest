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
  BuildSortText,
  GridifyQueryExtend,
  PagingContent,
} from '../../../shared/helpers/helpers';
import { GoodsReceivingDto } from '../../../models/GoodsReceiving';
import { GoodsReceivingService } from '../../../services/goodsReceivingService';
import { MenuModule } from 'primeng/menu';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';

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
    <p-menu #menu [model]="menuItems" [popup]="true"></p-menu> `,
  styleUrl: './goods-receiving.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoodsReceiving implements OnInit, OnDestroy {
  @ViewChild('fTable') fTable?: Table;

  private readonly goodsReceivingService = inject(GoodsReceivingService);
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

  receivedDialog: boolean = false;

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 10;
    this.Query.Filter = null;
    this.Query.OrderBy = 'CreatedAt desc';
    this.Query.Select = null;
    this.Query.Includes = 'PurchaseOrder,Supplier';
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
          command: () => this.ActionClick(data, 'Confirmed'),
        },
        {
          label: 'Delete',
          icon: 'pi pi-trash',
          command: () => this.ActionClick(data, 'Delete'),
        },
      );
    }

    if (data.status !== 'Draft') {
      this.menuItems.push({
        label: 'View Details',
        icon: 'pi pi-eye',
        command: () =>
          this.router.navigate(['/goods-receiving/details'], {
            queryParams: { id: data.id },
          }),
      });
    }
    menu.toggle(event);
  }

  ActionClick(data: GoodsReceivingDto | null, action: string) {
    if (!data) return;

    if (action === 'Confirmed') {
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
        if (!response.ok) throw new Error(`HTTP status ${response.status}`);
        return response.blob();
      })
      .then((blob) => {
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;

        const fileExtension = cleanPath.split('.').pop() || 'pdf';
        const fallbackPrefix = 'GRN';
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

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
