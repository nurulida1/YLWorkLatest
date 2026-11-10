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
import { FormGroup, FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { MenuItem, MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { LoadingService } from '../../../../services/loading.service';
import { SupplierService } from '../../../../services/SupplierService';
import { CompanyDto } from '../../../../models/Company';
import {
  PagingContent,
  GridifyQueryExtend,
  BuildFilterText,
  BuildSortText,
} from '../../../../shared/helpers/helpers';
import { ImageModule } from 'primeng/image';

@Component({
  selector: 'app-supplier',
  imports: [
    CommonModule,
    RouterLink,
    InputTextModule,
    FormsModule,
    TableModule,
    ButtonModule,
    FormsModule,
    MenuModule,
    ImageModule,
  ],
  template: `
    <div
      class="supplier-page w-full min-h-screen bg-slate-50 p-3 sm:p-5 lg:p-6"
    >
      <!-- Breadcrumb -->
      <div class="mb-4 flex flex-wrap items-center gap-2 text-sm text-gray-500">
        <a [routerLink]="'/dashboard'" class="hover:text-blue-700">
          Dashboard
        </a>
        <i class="pi pi-angle-right text-xs"></i>
        <span class="font-semibold text-gray-800">Supplier</span>
      </div>

      <!-- Main container -->
      <div
        class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5"
      >
        <!-- Heading -->
        <div
          class="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1
              class="text-xl font-semibold tracking-tight text-gray-800 sm:text-2xl"
            >
              Supplier
            </h1>
            <p class="mt-1 text-sm text-gray-500">
              Manage supplier profiles and information.
            </p>
          </div>

          <p-button
            label="New Supplier"
            icon="pi pi-plus"
            severity="info"
            styleClass="w-full sm:w-auto whitespace-nowrap border-none! bg-blue-700! hover:bg-blue-500!"
            (onClick)="ActionClick(null, 'add')"
          ></p-button>
        </div>

        <!-- Search -->
        <div class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div class="relative w-full sm:max-w-md">
            <i
              class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            ></i>

            <input
              type="text"
              pInputText
              class="w-full pl-10!"
              placeholder="Search supplier by name..."
              [(ngModel)]="search"
              (keyup)="onKeyDown($event)"
            />
          </div>

          <p-button
            *ngIf="search"
            label="Clear"
            icon="pi pi-times"
            severity="secondary"
            [outlined]="true"
            styleClass="w-full sm:w-auto"
            (onClick)="ResetTable()"
          ></p-button>
        </div>

        <!-- Desktop table -->
        <div class="supplier-desktop-table">
          <p-table
            #fTable
            [value]="PagingSignal().data || []"
            [paginator]="true"
            [rows]="Query.PageSize"
            [totalRecords]="PagingSignal().totalElements"
            [first]="((Query.Page || 1) - 1) * (Query.PageSize || 10)"
            [rowsPerPageOptions]="[10, 20, 30, 50]"
            [stripedRows]="true"
            [showGridlines]="true"
            [lazy]="true"
            (onLazyLoad)="NextPage($event)"
            [tableStyle]="{ 'min-width': '75rem' }"
          >
            <ng-template #header>
              <tr>
                <th class="bg-gray-50! text-center! w-20!"></th>

                <th pSortableColumn="Name" class="bg-gray-50!">
                  <div class="flex items-center gap-2">
                    Name
                    <p-sortIcon field="Name"></p-sortIcon>
                  </div>
                </th>

                <th class="bg-gray-50! text-center!">Email</th>
                <th class="bg-gray-50! text-center!">Contact No</th>
                <th class="bg-gray-50! text-center!">Contact Person</th>
                <th class="bg-gray-50! text-center!">Balance Payment (RM)</th>
                <th class="bg-gray-50! text-center! w-20!">Action</th>
              </tr>
            </ng-template>

            <ng-template #body let-data>
              <tr>
                <td class="text-center!">
                  <div class="flex justify-center">
                    <div
                      *ngIf="!data.logoImage"
                      class="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100"
                    >
                      <i class="pi pi-building text-xl text-gray-400"></i>
                    </div>

                    <p-image
                      *ngIf="data.logoImage"
                      [src]="data.logoImage"
                      width="48"
                      [preview]="true"
                      imageClass="h-12 w-12 rounded-lg border border-gray-200 object-contain"
                    ></p-image>
                  </div>
                </td>

                <td class="font-semibold! text-gray-800!">
                  {{ data.name }}
                </td>

                <td class="text-center!">
                  {{ data.email || '-' }}
                </td>

                <td class="text-center!">
                  {{ data.contactNo || '-' }}
                </td>

                <td class="text-center!">
                  <div class="flex flex-col items-center gap-1">
                    <span class="font-medium text-gray-800">
                      {{ data.primaryContactPerson || '-' }}
                    </span>

                    <span
                      *ngIf="data.secondaryContactPerson"
                      class="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500"
                    >
                      Alt: {{ data.secondaryContactPerson }}
                    </span>
                  </div>
                </td>

                <td class="text-center! font-medium! tabular-nums!">
                  {{ data.balancePayment ?? 0 | number: '1.2-2' }}
                </td>

                <td class="text-center!">
                  <button
                    type="button"
                    class="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-blue-700"
                    (click)="onEllipsisClick($event, data, menu)"
                  >
                    <i class="pi pi-ellipsis-h"></i>
                  </button>
                </td>
              </tr>
            </ng-template>

            <ng-template #emptymessage>
              <tr>
                <td colspan="7" class="py-8! text-center! text-gray-500!">
                  <div class="flex flex-col items-center gap-2">
                    <i class="pi pi-building text-3xl text-gray-300"></i>
                    <span>No supplier found in record.</span>
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>

        <!-- Mobile cards -->
        <div class="supplier-mobile-list space-y-3">
          <ng-container *ngIf="PagingSignal().data?.length; else mobileEmpty">
            <div
              *ngFor="let data of PagingSignal().data"
              class="rounded-xl border border-gray-200 bg-white p-4"
            >
              <!-- Card header -->
              <div class="flex items-start gap-3">
                <div
                  *ngIf="!data.logoImage"
                  class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100"
                >
                  <i class="pi pi-building text-xl text-gray-400"></i>
                </div>

                <p-image
                  *ngIf="data.logoImage"
                  [src]="data.logoImage"
                  width="48"
                  [preview]="true"
                  imageClass="h-12 w-12 rounded-lg border border-gray-200 object-contain"
                ></p-image>

                <div class="min-w-0 flex-1">
                  <h3 class="break-words font-semibold text-gray-800">
                    {{ data.name }}
                  </h3>

                  <p class="mt-1 break-all text-xs text-gray-500">
                    {{ data.email || 'No email provided' }}
                  </p>
                </div>

                <button
                  type="button"
                  class="shrink-0 rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                  (click)="onEllipsisClick($event, data, menu)"
                >
                  <i class="pi pi-ellipsis-h"></i>
                </button>
              </div>

              <div class="my-3 border-t border-gray-100"></div>

              <!-- Card details -->
              <div class="grid grid-cols-2 gap-4">
                <div class="min-w-0">
                  <p class="text-xs text-gray-400">Contact Number</p>
                  <p class="mt-1 break-words text-sm font-medium text-gray-700">
                    {{ data.contactNo || '-' }}
                  </p>
                </div>

                <div class="min-w-0">
                  <p class="text-xs text-gray-400">Contact Person</p>
                  <p class="mt-1 break-words text-sm font-medium text-gray-700">
                    {{ data.primaryContactPerson || '-' }}
                  </p>

                  <p
                    *ngIf="data.secondaryContactPerson"
                    class="mt-1 break-words text-xs text-gray-500"
                  >
                    Alt: {{ data.secondaryContactPerson }}
                  </p>
                </div>

                <div class="col-span-2 rounded-lg bg-slate-50 p-3">
                  <p class="text-xs text-gray-500">Balance Payment</p>
                  <p class="mt-1 text-lg font-semibold text-gray-800">
                    RM {{ data.balancePayment ?? 0 | number: '1.2-2' }}
                  </p>
                </div>
              </div>
            </div>
          </ng-container>

          <ng-template #mobileEmpty>
            <div
              class="rounded-xl border border-dashed border-gray-300 py-10 text-center"
            >
              <i class="pi pi-building text-3xl text-gray-300"></i>
              <p class="mt-2 text-sm text-gray-500">
                No supplier found in record.
              </p>
            </div>
          </ng-template>

          <!-- Mobile pagination -->
          <div
            *ngIf="PagingSignal().totalElements > 0"
            class="flex items-center justify-between gap-3 border-t border-gray-100 pt-4"
          >
            <p class="text-xs text-gray-500">
              Page {{ currentPage }} of {{ totalPages }}
              <span class="block mt-1">
                {{ PagingSignal().totalElements }} suppliers
              </span>
            </p>

            <div class="flex items-center gap-2">
              <p-button
                icon="pi pi-chevron-left"
                severity="secondary"
                [outlined]="true"
                size="small"
                [disabled]="currentPage <= 1"
                (onClick)="MobilePreviousPage()"
              ></p-button>

              <p-button
                icon="pi pi-chevron-right"
                severity="secondary"
                [outlined]="true"
                size="small"
                [disabled]="currentPage >= totalPages"
                (onClick)="MobileNextPage()"
              ></p-button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Delete Confirmation Dialog -->
    <div
      *ngIf="showDeleteDialog"
      class="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 p-4"
      (click)="cancelDelete()"
    >
      <div
        class="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
        (click)="$event.stopPropagation()"
      >
        <!-- Dialog content -->
        <div class="p-6">
          <div class="flex items-start gap-4">
            <div
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600"
            >
              <i class="pi pi-trash text-xl"></i>
            </div>

            <div class="min-w-0">
              <h2 class="text-lg font-bold text-gray-800">Delete Supplier?</h2>

              <p class="mt-2 text-sm leading-relaxed text-gray-500">
                Are you sure you want to delete
                <span class="font-semibold text-gray-800">
                  {{ selectedSupplier?.name }}
                </span>
                ? This action cannot be undone.
              </p>
            </div>
          </div>
        </div>

        <!-- Dialog actions -->
        <div
          class="flex flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50 p-4 sm:flex-row sm:justify-end"
        >
          <button
            type="button"
            (click)="cancelDelete()"
            class="w-full rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 sm:w-auto"
          >
            Cancel
          </button>

          <button
            type="button"
            (click)="confirmDelete()"
            class="w-full rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 sm:w-auto"
          >
            <i class="pi pi-trash mr-2"></i>
            Yes, Delete
          </button>
        </div>
      </div>
    </div>

    <p-menu #menu [model]="menuItems" [popup]="true"></p-menu>
  `,
  styleUrl: './supplier.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Supplier implements OnInit, OnDestroy {
  @ViewChild('fTable') fTable?: Table;

  private readonly loadingService = inject(LoadingService);
  private readonly messageService = inject(MessageService);
  private readonly supplierService = inject(SupplierService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  PagingSignal = signal<PagingContent<CompanyDto>>(
    {} as PagingContent<CompanyDto>,
  );
  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  visible: boolean = false;
  isUpdate: boolean = false;
  showDeleteDialog: boolean = false;
  selectedSupplier: CompanyDto | null = null;

  search: string = '';
  title: string = 'Add New Supplier';
  FG!: FormGroup;
  menuItems: MenuItem[] = [];

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 10;
    this.Query.Filter = null;
    this.Query.OrderBy = 'Name';
    this.Query.Select = null;
    this.Query.Includes = null;
  }

  ngOnInit(): void {}

  GetData() {
    this.loadingService.start();
    this.supplierService
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
    this.Query.OrderBy = sortText ? sortText : 'Name';

    this.Query.Filter = BuildFilterText(event);
    console.log(this.Query);
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
      Name: [
        {
          value: data,
          matchMode: '=',
          operator: 'and',
        },
      ],
    };

    this.Query.Filter = BuildFilterText({
      first: 0,
      rows: this.fTable?.rows,
      filters: filter,
      sortField: null,
      sortOrder: null,
    } as TableLazyLoadEvent);

    this.Query.Page = 1;

    this.GetData();
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

  ActionClick(data: CompanyDto | null, action: string) {
    if (action === 'Delete' && data) {
      this.selectedSupplier = data;
      this.showDeleteDialog = true;
      this.cdr.markForCheck();
      return;
    }

    this.router.navigate(['/supplier/form'], {
      queryParams: { id: data?.id },
    });
  }

  cancelDelete(): void {
    this.showDeleteDialog = false;
    this.selectedSupplier = null;
    this.cdr.markForCheck();
  }

  confirmDelete(): void {
    if (!this.selectedSupplier) return;

    const supplier = this.selectedSupplier;

    this.showDeleteDialog = false;
    this.loadingService.start();

    this.supplierService
      .Delete(supplier.id)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res: any) => {
          this.loadingService.stop();

          this.messageService.add({
            severity: 'success',
            summary: 'Deleted',
            detail: res?.message || 'Supplier deleted successfully',
          });

          this.PagingSignal.update((state) => ({
            ...state,
            data: (state.data || []).filter((d) => d.id !== supplier.id),
            totalElements: Math.max(0, (state.totalElements || 0) - 1),
          }));

          this.selectedSupplier = null;
          this.cdr.markForCheck();
        },

        error: (err: any) => {
          this.loadingService.stop();

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail:
              err.error?.error ||
              err.error?.message ||
              'Failed to delete supplier',
          });

          this.selectedSupplier = null;
          this.cdr.markForCheck();
        },
      });
  }

  onEllipsisClick(event: any, supplier: any, menu: any) {
    this.menuItems = [
      {
        label: 'Edit',
        icon: 'pi pi-pencil',
        command: () => this.ActionClick(supplier, 'Update'),
      },
      {
        label: 'Delete',
        icon: 'pi pi-trash',
        command: () => this.ActionClick(supplier, 'Delete'),
      },
    ];

    menu.toggle(event);
  }

  get currentPage(): number {
    return this.Query.Page || 1;
  }

  get totalPages(): number {
    const total = this.PagingSignal()?.totalElements || 0;
    const pageSize = this.Query.PageSize || 10;

    return Math.max(1, Math.ceil(total / pageSize));
  }

  MobilePreviousPage(): void {
    if (this.currentPage <= 1) return;

    this.Query.Page = this.currentPage - 1;
    this.GetData();
  }

  MobileNextPage(): void {
    if (this.currentPage >= this.totalPages) return;

    this.Query.Page = this.currentPage + 1;
    this.GetData();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
