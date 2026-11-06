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

import { MenuItem, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';

import { Subject, takeUntil } from 'rxjs';

import { DeliveryOrderDto } from '../../../../models/DeliveryOrder';
import { DeliveryOrderService } from '../../../../services/deliveryOrderService';
import { LoadingService } from '../../../../services/loading.service';
import {
  PagingContent,
  GridifyQueryExtend,
  BuildSortText,
  BuildFilterText,
} from '../../../../shared/helpers/helpers';

@Component({
  selector: 'app-delivery-orders',
  imports: [
    CommonModule,
    ButtonModule,
    InputTextModule,
    MenuModule,
    FormsModule,
    RouterLink,
    TableModule,
  ],
  template: `
    <div
      class="delivery-orders-page min-h-[92.9vh] w-full bg-slate-50/60 p-3 sm:p-4 lg:p-6"
    >
      <div
        class="delivery-orders-container mx-auto flex w-full max-w-[1800px] flex-col"
      >
        <!-- Breadcrumb -->
        <nav
          class="mb-4 flex flex-wrap items-center gap-2 text-sm text-gray-500"
        >
          <a
            routerLink="/dashboard"
            class="cursor-pointer transition-colors hover:text-blue-600"
          >
            Dashboard
          </a>

          <i class="pi pi-angle-right text-xs text-gray-400"></i>

          <span class="font-semibold text-gray-800"> Delivery Orders </span>
        </nav>

        <!-- Main Card -->
        <section
          class="delivery-orders-card min-w-0 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5 lg:p-6"
        >
          <!-- Page Header -->
          <div
            class="delivery-orders-header flex min-w-0 flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"
          >
            <!-- Title -->
            <div class="min-w-0">
              <div class="flex items-center gap-3">
                <div
                  class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"
                >
                  <i class="pi pi-truck text-xl"></i>
                </div>

                <div class="min-w-0">
                  <h1
                    class="text-lg font-bold tracking-tight text-gray-800 sm:text-xl"
                  >
                    Delivery Orders
                  </h1>

                  <p class="mt-1 text-sm leading-relaxed text-gray-500">
                    View, create, and track all delivery orders.
                  </p>
                </div>
              </div>
            </div>

            <!-- Toolbar -->
            <div
              class="delivery-orders-toolbar flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center xl:w-auto xl:justify-end"
            >
              <!-- Search -->
              <div
                class="delivery-orders-search relative w-full sm:min-w-[240px] sm:flex-1 xl:w-[280px] xl:flex-none"
              >
                <i
                  class="pi pi-search pointer-events-none absolute left-3! top-1/2! -translate-y-1/2! text-sm text-gray-400"
                ></i>

                <input
                  type="text"
                  pInputText
                  [(ngModel)]="search"
                  class="w-full rounded-lg border border-gray-300 pl-9! pr-3! text-sm transition-shadow focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Search by DO No..."
                  (keydown)="onKeyDown($event)"
                />
              </div>

              <!-- Generate Button -->
              <p-button
                label="Generate DO"
                icon="pi pi-plus"
                severity="info"
                [routerLink]="'/delivery-orders/form'"
                styleClass="w-full rounded-lg border-none! bg-blue-600! px-4! py-3! text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700! sm:w-auto"
              ></p-button>
            </div>
          </div>

          <!-- Table Section -->
          <div
            class="delivery-orders-table mt-5 w-full min-w-0 overflow-hidden rounded-xl border border-gray-200"
          >
            <p-table
              #fTable
              dataKey="id"
              [value]="PagingSignal().data"
              [paginator]="true"
              [rows]="Query.PageSize"
              [totalRecords]="PagingSignal().totalElements"
              [tableStyle]="{ 'min-width': '65rem' }"
              [showGridlines]="false"
              [rowsPerPageOptions]="[10, 20, 30, 50]"
              [lazy]="true"
              (onLazyLoad)="NextPage($event)"
              styleClass="delivery-orders-datatable"
            >
              <!-- Table Header -->
              <ng-template #header>
                <tr>
                  <th
                    pSortableColumn="PurchaseOrderNo"
                    class="w-[15%] whitespace-nowrap bg-gray-50! px-4 py-4 text-center! text-xs font-bold uppercase tracking-wider text-gray-600"
                  >
                    <div class="flex items-center justify-center gap-2">
                      <span>DO No</span>
                      <p-sortIcon field="PurchaseOrderNo"></p-sortIcon>
                    </div>
                  </th>

                  <th
                    class="w-[25%] whitespace-nowrap bg-gray-50! px-4 py-4 text-left! text-xs font-bold uppercase tracking-wider text-gray-600"
                  >
                    Company
                  </th>

                  <th
                    pSortableColumn="DODate"
                    class="w-[12%] whitespace-nowrap bg-gray-50! px-4 py-4 text-center! text-xs font-bold uppercase tracking-wider text-gray-600"
                  >
                    <div class="flex items-center justify-center gap-2">
                      <span>DO Date</span>
                      <p-sortIcon field="DODate"></p-sortIcon>
                    </div>
                  </th>

                  <th
                    class="w-[15%] whitespace-nowrap bg-gray-50! px-4 py-4 text-center! text-xs font-bold uppercase tracking-wider text-gray-600"
                  >
                    Delivery Method
                  </th>

                  <th
                    class="w-[13%] whitespace-nowrap bg-gray-50! px-4 py-4 text-center! text-xs font-bold uppercase tracking-wider text-gray-600"
                  >
                    SO No
                  </th>

                  <th
                    pSortableColumn="Status"
                    class="w-[12%] whitespace-nowrap bg-gray-50! px-4 py-4 text-center! text-xs font-bold uppercase tracking-wider text-gray-600"
                  >
                    <div class="flex items-center justify-center gap-2">
                      <span>Status</span>
                      <p-sortIcon field="Status"></p-sortIcon>
                    </div>
                  </th>

                  <th
                    class="w-[8%] whitespace-nowrap bg-gray-50! px-4 py-4 text-center! text-xs font-bold uppercase tracking-wider text-gray-600"
                  >
                    Actions
                  </th>
                </tr>
              </ng-template>

              <!-- Table Body -->
              <ng-template #body let-data>
                <tr class="transition-colors hover:bg-blue-50/30">
                  <!-- DO Number -->
                  <td class="px-4 py-4 text-center">
                    <span class="font-bold text-gray-800">
                      {{ data.deliveryOrderNo || '-' }}
                    </span>
                  </td>

                  <!-- Company -->
                  <td class="px-4 py-4">
                    <div class="flex min-w-0 items-center gap-2.5">
                      <div
                        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500"
                      >
                        <i class="pi pi-building text-sm"></i>
                      </div>

                      <span class="truncate font-medium text-gray-700">
                        {{ data.receiverCompany?.name || '-' }}
                      </span>
                    </div>
                  </td>

                  <!-- DO Date -->
                  <td
                    class="whitespace-nowrap px-4 py-4 text-center text-sm text-gray-600"
                  >
                    {{
                      data.createdAt
                        ? (data.createdAt | date: 'dd/MM/yyyy')
                        : '-'
                    }}
                  </td>

                  <!-- Delivery Method -->
                  <td class="px-4 py-4 text-center">
                    <span
                      class="inline-flex items-center rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-gray-700"
                    >
                      {{ data.deliveryMethod || '-' }}
                    </span>
                  </td>

                  <!-- Sales Order -->
                  <td class="px-4 py-4 text-center">
                    <span class="font-semibold text-blue-600">
                      {{ data.salesOrder?.salesOrderNo || '-' }}
                    </span>
                  </td>

                  <!-- Status -->
                  <td class="px-4 py-4 text-center">
                    <div class="flex justify-center">
                      <span
                        class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold"
                        [ngClass]="{
                          'border-orange-200 bg-orange-50 text-orange-700':
                            data.status === 'Draft',

                          'border-yellow-200 bg-yellow-50 text-yellow-700':
                            data.status === 'Reviewed',

                          'border-blue-200 bg-blue-50 text-blue-700':
                            data.status === 'Approved' ||
                            data.status === 'InProgress',

                          'border-indigo-200 bg-indigo-50 text-indigo-700':
                            data.status === 'Sent' || data.status === 'Issued',

                          'border-teal-200 bg-teal-50 text-teal-700':
                            data.status === 'PartiallyReceived',

                          'border-emerald-200 bg-emerald-50 text-emerald-700':
                            data.status === 'Completed',

                          'border-rose-200 bg-rose-50 text-rose-700':
                            data.status === 'Rejected' ||
                            data.status === 'Cancelled',
                        }"
                      >
                        <span
                          class="h-1.5 w-1.5 rounded-full"
                          [ngClass]="{
                            'bg-orange-500': data.status === 'Draft',
                            'bg-yellow-500': data.status === 'Reviewed',
                            'bg-blue-500':
                              data.status === 'Approved' ||
                              data.status === 'InProgress',
                            'bg-indigo-500':
                              data.status === 'Sent' ||
                              data.status === 'Issued',
                            'bg-teal-500': data.status === 'PartiallyReceived',
                            'bg-emerald-500': data.status === 'Completed',
                            'bg-rose-500':
                              data.status === 'Rejected' ||
                              data.status === 'Cancelled',
                          }"
                        ></span>

                        {{ data.status || 'Unknown' }}
                      </span>
                    </div>
                  </td>

                  <!-- Actions -->
                  <td class="px-4 py-4 text-center">
                    <div class="flex items-center justify-center">
                      <button
                        type="button"
                        (click)="onEllipsisClick($event, data, menu)"
                        class="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        aria-label="Delivery order actions"
                      >
                        <i class="pi pi-ellipsis-h text-base"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </ng-template>

              <!-- Empty State -->
              <ng-template #emptymessage>
                <tr>
                  <td colspan="7" class="px-4 py-14">
                    <div
                      class="flex flex-col items-center justify-center gap-3 text-center"
                    >
                      <div
                        class="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100"
                      >
                        <i class="pi pi-truck text-2xl text-gray-400"></i>
                      </div>

                      <div>
                        <p class="text-sm font-semibold text-gray-700">
                          No delivery orders found
                        </p>

                        <p class="mt-1 text-xs text-gray-500">
                          Delivery orders will appear here once they are
                          available.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              </ng-template>
            </p-table>
          </div>
        </section>
      </div>
    </div>

    <!-- Action Menu -->
    <p-menu #menu [model]="menuItems" [popup]="true" appendTo="body"></p-menu>
  `,
  styleUrl: './delivery-orders.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeliveryOrders implements OnDestroy {
  @ViewChild('fTable') fTable?: Table;

  private readonly deliveryOrderService = inject(DeliveryOrderService);
  private readonly messageService = inject(MessageService);
  private readonly loadingService = inject(LoadingService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  PagingSignal = signal<PagingContent<DeliveryOrderDto>>(
    {} as PagingContent<DeliveryOrderDto>,
  );

  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  search: string = '';

  menuItems: MenuItem[] = [];

  selectedDO: any;
  events: any[] = [];

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 10;
    this.Query.Filter = null;
    this.Query.OrderBy = 'CreatedAt desc';
    this.Query.Select = null;
    this.Query.Includes = 'ReceiverCompany';
  }

  GetData() {
    this.loadingService.start();

    this.deliveryOrderService
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
      DeliveryOrderNo: [
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

  ActionClick(data: DeliveryOrderDto | null, action: string) {}

  onEllipsisClick(event: Event, data: DeliveryOrderDto, menu: any) {
    this.menuItems = [];

    if (data.status === 'Draft') {
      this.menuItems.push({
        label: 'Update',
        icon: 'pi pi-pencil',
        command: () => {
          this.router.navigate(['/delivery-orders/form'], {
            queryParams: { id: data.id },
          });
        },
      });
    }

    if (data.status !== 'Cancelled' && data.status !== 'Completed') {
      this.menuItems.push({
        label: 'Cancelled',
        icon: 'pi pi-times-circle',
      });
    }

    menu.toggle(event);
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
