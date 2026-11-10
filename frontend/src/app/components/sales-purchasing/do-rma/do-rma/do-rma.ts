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
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { MenuItem } from 'primeng/api';
import { finalize, Subject, takeUntil } from 'rxjs';
import { DeliveryOrderRMA } from '../../../../models/DeliveryOrderRMA';
import { DeliveryOrderRMAService } from '../../../../services/DeliveryOrderRMAService';
import { LoadingService } from '../../../../services/loading.service';
import {
  PagingContent,
  GridifyQueryExtend,
  BuildSortText,
  BuildFilterText,
} from '../../../../shared/helpers/helpers';

@Component({
  selector: 'app-do-rma',
  imports: [
    CommonModule,
    TableModule,
    InputTextModule,
    FormsModule,
    MenuModule,
    ButtonModule,
    RouterLink,
  ],
  template: `
    <div class="w-full min-h-[92.9vh] flex flex-col p-3 sm:p-5 lg:p-6">
      <!-- Breadcrumb -->
      <div
        class="flex flex-wrap items-center gap-2 text-sm text-slate-500 mb-4"
      >
        <a
          routerLink="/dashboard"
          class="cursor-pointer hover:text-blue-600 hover:underline"
        >
          Dashboard
        </a>
        <i class="pi pi-chevron-right text-sm!"></i>
        <span class="text-slate-800 font-semibold">DO RMA</span>
      </div>

      <!-- Main Container -->
      <div
        class="border border-slate-200 rounded-xl bg-white p-3 sm:p-5 flex flex-col min-w-0 shadow-sm"
      >
        <!-- Header -->
        <div
          class="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4"
        >
          <div class="min-w-0">
            <h2 class="text-lg sm:text-xl font-bold text-slate-800">
              Delivery Order RMA
            </h2>
            <p class="text-xs sm:text-sm text-slate-500 mt-1">
              View, create, and track all delivery order RMA requests in the
              system.
            </p>
          </div>

          <!-- Search + Create -->
          <div class="flex flex-col sm:flex-row gap-2 w-full xl:w-auto">
            <div class="relative w-full sm:min-w-[260px] xl:w-[300px]">
              <input
                type="text"
                pInputText
                [(ngModel)]="search"
                class="w-full pr-9!"
                placeholder="Search by Request No..."
                (keydown)="onKeyDown($event)"
              />

              <button
                *ngIf="search"
                type="button"
                (click)="Search('')"
                class="absolute top-1/2 -translate-y-1/2 right-3 text-slate-400 hover:text-red-500"
                title="Clear search"
              >
                <i class="pi pi-times"></i>
              </button>

              <i
                *ngIf="!search"
                class="pi pi-search absolute top-1/2 -translate-y-1/2 right-3 text-slate-400"
              ></i>
            </div>

            <p-button
              label="New RMA Request"
              icon="pi pi-plus"
              [routerLink]="'/do-rma/form'"
              severity="info"
              styleClass="w-full py-3! sm:py-2! sm:w-auto whitespace-nowrap bg-blue-700! hover:bg-blue-500! border-none!"
            ></p-button>
          </div>
        </div>

        <!-- Desktop Table -->
        <div class="hidden md:block mt-5 w-full min-w-0">
          <p-table
            #fTable
            dataKey="id"
            [value]="PagingSignal().data || []"
            [paginator]="true"
            [rows]="Query.PageSize"
            [totalRecords]="PagingSignal().totalElements || 0"
            [tableStyle]="{ 'min-width': '850px', width: '100%' }"
            [showGridlines]="true"
            [rowsPerPageOptions]="[10, 20, 30, 50]"
            [lazy]="true"
            (onLazyLoad)="NextPage($event)"
            styleClass="p-datatable-sm do-rma-table"
          >
            <ng-template #header>
              <tr>
                <th
                  pSortableColumn="DeliveryOrderRMANo"
                  class="bg-slate-100! text-center! min-w-[150px]"
                >
                  <div class="flex justify-center items-center gap-2">
                    Request No
                    <p-sortIcon field="DeliveryOrderRMANo" />
                  </div>
                </th>

                <th class="bg-slate-100! text-center! min-w-[140px]">
                  Delivery Order No.
                </th>

                <th class="bg-slate-100! text-left! min-w-[200px]">
                  Requested By
                </th>

                <th
                  pSortableColumn="Status"
                  class="bg-slate-100! text-center! min-w-[140px]"
                >
                  <div class="flex justify-center items-center gap-2">
                    RMA Status
                    <p-sortIcon field="Status" />
                  </div>
                </th>

                <th
                  pSortableColumn="Date"
                  class="bg-slate-100! text-center! min-w-[130px]"
                >
                  <div class="flex justify-center items-center gap-2">
                    Request Date
                    <p-sortIcon field="Date" />
                  </div>
                </th>

                <th class="bg-slate-100! text-center! min-w-[90px]">Action</th>
              </tr>
            </ng-template>

            <ng-template #body let-data>
              <tr class="text-sm hover:bg-slate-50/70 transition-colors">
                <td class="text-center! font-semibold text-slate-800">
                  {{ data.deliveryOrderRMANo }}
                </td>

                <td class="text-center! text-slate-600">
                  {{ data.deliveryOrder?.deliveryOrderNo || '-' }}
                </td>

                <td class="text-left! text-slate-700">
                  {{ data.actionUserName || '-' }}
                </td>

                <td class="text-center!">
                  <span
                    class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap"
                    [ngClass]="{
                      'bg-orange-50 text-orange-700': data.status === 'Draft',
                      'bg-yellow-50 text-yellow-700':
                        data.status === 'Reviewed',
                      'bg-blue-50 text-blue-700':
                        data.status === 'Approved' ||
                        data.status === 'InProgress',
                      'bg-indigo-50 text-indigo-700':
                        data.status === 'Sent' || data.status === 'Issued',
                      'bg-teal-50 text-teal-700':
                        data.status === 'PartiallyReceived',
                      'bg-green-50 text-green-700': data.status === 'Completed',
                      'bg-red-50 text-red-700':
                        data.status === 'Rejected' ||
                        data.status === 'Cancelled',
                    }"
                  >
                    <span
                      class="w-1.5 h-1.5 rounded-full"
                      [ngClass]="{
                        'bg-orange-500': data.status === 'Draft',
                        'bg-yellow-500': data.status === 'Reviewed',
                        'bg-blue-500':
                          data.status === 'Approved' ||
                          data.status === 'InProgress',
                        'bg-indigo-500':
                          data.status === 'Sent' || data.status === 'Issued',
                        'bg-teal-500': data.status === 'PartiallyReceived',
                        'bg-green-500': data.status === 'Completed',
                        'bg-red-500':
                          data.status === 'Rejected' ||
                          data.status === 'Cancelled',
                      }"
                    ></span>
                    {{ data.status }}
                  </span>
                </td>

                <td class="text-center! text-slate-600">
                  {{ data.date | date: 'dd/MM/yyyy' }}
                </td>

                <td class="text-center!">
                  <button
                    type="button"
                    (click)="onEllipsisClick($event, data, menu)"
                    class="w-8 h-8 inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="More actions"
                  >
                    <i class="pi pi-ellipsis-h"></i>
                  </button>
                </td>
              </tr>
            </ng-template>

            <ng-template #emptymessage>
              <tr>
                <td colspan="6" class="text-center! py-8 text-slate-400">
                  <div class="flex flex-col items-center gap-2">
                    <i class="pi pi-inbox text-2xl text-slate-300"></i>
                    <span>No delivery order RMA found in records.</span>
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>

        <!-- Mobile Cards -->
        <div class="md:hidden flex flex-col gap-3 mt-5">
          <div
            *ngFor="let data of PagingSignal().data || []; let i = index"
            class="border border-slate-200 rounded-xl p-3 flex flex-col gap-3 bg-white"
          >
            <!-- Request Header -->
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <span
                  class="text-[10px] uppercase font-bold tracking-wide text-slate-400"
                >
                  Request No.
                </span>
                <h3 class="text-sm font-bold text-slate-800 break-words mt-0.5">
                  {{ data.deliveryOrderRMANo || '-' }}
                </h3>
              </div>

              <button
                type="button"
                (click)="onEllipsisClick($event, data, menu)"
                class="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                title="More actions"
              >
                <i class="pi pi-ellipsis-h"></i>
              </button>
            </div>

            <!-- Status -->
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs text-slate-400 font-medium">
                RMA Status
              </span>

              <span
                class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap"
                [ngClass]="{
                  'bg-orange-50 text-orange-700': data.status === 'Draft',
                  'bg-yellow-50 text-yellow-700': data.status === 'Reviewed',
                  'bg-blue-50 text-blue-700':
                    data.status === 'Approved' || data.status === 'InProgress',
                  'bg-indigo-50 text-indigo-700':
                    data.status === 'Sent' || data.status === 'Issued',
                  'bg-teal-50 text-teal-700':
                    data.status === 'PartiallyReceived',
                  'bg-green-50 text-green-700': data.status === 'Completed',
                  'bg-red-50 text-red-700':
                    data.status === 'Rejected' || data.status === 'Cancelled',
                }"
              >
                <span
                  class="w-1.5 h-1.5 rounded-full"
                  [ngClass]="{
                    'bg-orange-500': data.status === 'Draft',
                    'bg-yellow-500': data.status === 'Reviewed',
                    'bg-blue-500':
                      data.status === 'Approved' ||
                      data.status === 'InProgress',
                    'bg-indigo-500':
                      data.status === 'Sent' || data.status === 'Issued',
                    'bg-teal-500': data.status === 'PartiallyReceived',
                    'bg-green-500': data.status === 'Completed',
                    'bg-red-500':
                      data.status === 'Rejected' || data.status === 'Cancelled',
                  }"
                ></span>
                {{ data.status }}
              </span>
            </div>

            <div class="border-t border-slate-100"></div>

            <!-- Details -->
            <div class="grid grid-cols-2 gap-3">
              <div class="min-w-0">
                <span
                  class="block text-[10px] uppercase tracking-wide font-bold text-slate-400"
                >
                  Delivery Order No.
                </span>
                <span
                  class="block text-sm font-semibold text-slate-700 mt-1 break-words"
                >
                  {{ data.deliveryOrder?.deliveryOrderNo || '-' }}
                </span>
              </div>

              <div class="min-w-0">
                <span
                  class="block text-[10px] uppercase tracking-wide font-bold text-slate-400"
                >
                  Request Date
                </span>
                <span class="block text-sm font-semibold text-slate-700 mt-1">
                  {{ data.date | date: 'dd/MM/yyyy' }}
                </span>
              </div>

              <div class="col-span-2 min-w-0">
                <span
                  class="block text-[10px] uppercase tracking-wide font-bold text-slate-400"
                >
                  Requested By
                </span>
                <span
                  class="block text-sm font-semibold text-slate-700 mt-1 break-words"
                >
                  {{ data.actionUserName || '-' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div
            *ngIf="!PagingSignal().data?.length"
            class="flex flex-col items-center justify-center gap-2 text-center py-10 border border-dashed border-slate-200 rounded-xl"
          >
            <i class="pi pi-inbox text-3xl text-slate-300"></i>
            <span class="text-sm text-slate-500">
              No delivery order RMA found in records.
            </span>
          </div>

          <!-- Mobile Pagination -->
          <div
            *ngIf="PagingSignal().totalElements > 0"
            class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-slate-200 rounded-xl p-3 bg-white"
          >
            <span class="text-xs text-slate-500 text-center sm:text-left">
              Page {{ Query.Page }} · {{ PagingSignal().totalElements }} records
            </span>

            <div class="flex items-center justify-center gap-2">
              <p-button
                icon="pi pi-chevron-left"
                severity="secondary"
                [outlined]="true"
                [disabled]="Query.Page <= 1"
                size="small"
                (onClick)="changeMobilePage(Query.Page - 1)"
              ></p-button>

              <span class="text-xs font-semibold text-slate-700 px-2">
                {{ Query.Page }} /
                {{
                  Math.ceil(
                    (PagingSignal().totalElements || 0) / Query.PageSize
                  )
                }}
              </span>

              <p-button
                icon="pi pi-chevron-right"
                severity="secondary"
                [outlined]="true"
                [disabled]="
                  Query.Page * Query.PageSize >= PagingSignal().totalElements
                "
                size="small"
                (onClick)="changeMobilePage(Query.Page + 1)"
              ></p-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <p-menu #menu [model]="menuItems" [popup]="true"></p-menu>
  `,
  styleUrl: './do-rma.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DoRma implements OnInit, OnDestroy {
  @ViewChild('fTable') fTable?: Table;

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly loadingService = inject(LoadingService);
  private readonly deliveryOrderRMAService = inject(DeliveryOrderRMAService);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();
  protected readonly Math = Math;

  PagingSignal = signal<PagingContent<DeliveryOrderRMA>>(
    {} as PagingContent<DeliveryOrderRMA>,
  );
  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  search: string = '';

  menuItems: MenuItem[] = [];

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 10;
    this.Query.Filter = null;
    this.Query.OrderBy = 'Date desc';
    this.Query.Select = null;
    this.Query.Includes = 'SenderCompany,ReceiverCompany,DeliveryOrder';
  }

  GetData(): void {
    this.loadingService.start();

    this.deliveryOrderRMAService
      .GetMany(this.Query)
      .pipe(
        takeUntil(this.ngUnsubscribe),
        finalize(() => this.loadingService.stop()),
      )
      .subscribe({
        next: (res) => {
          this.PagingSignal.set(res);
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Failed to load Delivery Order RMA:', error);
        },
      });
  }

  ngOnInit(): void {}

  NextPage(event: TableLazyLoadEvent): void {
    if (event.first != null && event.rows != null) {
      this.Query.Page = Math.floor(event.first / event.rows) + 1;
      this.Query.PageSize = event.rows;
    }

    const sortText = BuildSortText(event);

    this.Query.OrderBy = sortText || 'Date desc';
    this.Query.Filter = BuildFilterText(event);

    this.GetData();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.Search(this.search);
    }
  }

  Search(data: string): void {
    const filter = {
      DeliveryOrderRMANo: [
        {
          value: data.trim(),
          matchMode: 'contains',
          operator: 'and',
        },
      ],
    };

    this.Query.Page = 1;

    if (this.fTable) {
      this.fTable.first = 0;
      this.fTable.filters = filter;
    }

    this.NextPage({
      first: 0,
      rows: this.Query.PageSize,
      filters: filter,
    });
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

  onEllipsisClick(event: any, data: DeliveryOrderRMA, menu: any) {
    this.menuItems = [];
    menu.toggle(event);
  }

  changeMobilePage(page: number): void {
    const totalPages = Math.ceil(
      (this.PagingSignal().totalElements || 0) / this.Query.PageSize,
    );

    if (page < 1 || page > totalPages) {
      return;
    }

    this.Query.Page = page;
    this.GetData();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
