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

import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ProductServicesService } from '../../../services/productServicesService';
import { LoadingService } from '../../../services/loading.service';
import { MenuItem, MessageService } from 'primeng/api';
import { Router, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import {
  BuildFilterText,
  BuildSortText,
  GridifyQueryExtend,
  PagingContent,
  ValidateAllFormFields,
} from '../../../shared/helpers/helpers';

import { ProductServiceDto } from '../../../models/ProductService';

import { InputTextModule } from 'primeng/inputtext';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { EditorModule } from 'primeng/editor';

@Component({
  selector: 'app-products-services',
  imports: [
    CommonModule,
    InputTextModule,
    FormsModule,
    InputNumberModule,
    RouterLink,
    ButtonModule,
    DialogModule,
    TableModule,
    TagModule,
    ReactiveFormsModule,
    EditorModule,
  ],
  template: `
    <div
      class="products-page min-h-screen w-full bg-slate-50/70 p-3 sm:p-4 lg:p-6"
    >
      <div class="products-container mx-auto w-full max-w-[1600px]">
        <!-- Breadcrumb -->
        <div
          class="mb-4 flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-500"
        >
          <a
            routerLink="/dashboard"
            class="cursor-pointer transition-colors hover:text-blue-600"
          >
            Dashboard
          </a>

          <i class="pi pi-angle-right text-xs text-slate-400"></i>

          <span class="font-semibold text-slate-700">
            Products & Services
          </span>
        </div>

        <!-- Main Card -->
        <div
          class="products-main-card rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <!-- Page Header -->
          <div
            class="products-header flex flex-col gap-4 border-b border-slate-100 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between lg:p-6"
          >
            <div class="min-w-0">
              <div class="flex items-center gap-3">
                <div
                  class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"
                >
                  <i class="pi pi-box text-xl"></i>
                </div>

                <div class="min-w-0">
                  <h1
                    class="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl"
                  >
                    Products & Services
                  </h1>

                  <p class="mt-1 text-xs text-slate-500 sm:text-sm">
                    View and manage your products and services.
                  </p>
                </div>
              </div>
            </div>

            <!-- Search and Add -->
            <div
              class="products-toolbar flex w-full flex-col gap-2 sm:flex-row lg:w-auto"
            >
              <div
                class="products-search relative w-full sm:min-w-[240px] lg:w-[300px]"
              >
                <i
                  class="pi pi-search absolute left-3 top-1/2 z-10 -translate-y-1/2 text-sm text-slate-400"
                ></i>

                <input
                  type="text"
                  pInputText
                  [(ngModel)]="search"
                  (keydown)="onKeyDown($event)"
                  class="w-full! rounded-xl! border-slate-200! py-2.5! pl-10! pr-10! text-sm!"
                  placeholder="Search by name..."
                />

                <button
                  *ngIf="search"
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700"
                  (click)="Search('')"
                  aria-label="Clear search"
                >
                  <i class="pi pi-times"></i>
                </button>
              </div>

              <p-button
                (onClick)="ActionClick('Create')"
                label="Add Product"
                icon="pi pi-plus"
                severity="info"
                styleClass="products-add-button w-full! justify-center! rounded-xl! border-none! bg-blue-600! px-5! py-2.5! text-sm! font-semibold! shadow-sm! hover:bg-blue-700! sm:w-auto!"
              ></p-button>
            </div>
          </div>

          <!-- Table -->
          <div class="products-table-section p-3 sm:p-4 lg:p-6">
            <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 class="text-sm font-semibold text-slate-800">
                  Product Catalogue
                </h2>
                <p class="mt-0.5 text-xs text-slate-500">
                  All registered products and services
                </p>
              </div>

              <div class="flex items-center gap-2 text-xs text-slate-500">
                <i class="pi pi-database"></i>
                <span> {{ PagingSignal().totalElements || 0 }} records </span>
              </div>
            </div>

            <div
              class="products-table-wrapper overflow-hidden rounded-xl border border-slate-200"
            >
              <p-table
                #fTable
                dataKey="id"
                [value]="PagingSignal().data || []"
                [paginator]="true"
                [rows]="Query.PageSize"
                [totalRecords]="PagingSignal().totalElements"
                [tableStyle]="{ 'min-width': '850px' }"
                [rowsPerPageOptions]="[10, 20, 30, 50]"
                [lazy]="true"
                (onLazyLoad)="NextPage($event)"
                [showGridlines]="false"
                [stripedRows]="true"
                [rowHover]="true"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} products"
                [showCurrentPageReport]="true"
                paginatorStyleClass="products-paginator"
              >
                <!-- Header -->
                <ng-template #header>
                  <tr>
                    <th
                      pSortableColumn="Code"
                      class="products-th w-[12%]! text-center!"
                    >
                      <div class="flex items-center justify-center gap-2">
                        <span>Code</span>
                        <p-sortIcon field="Code" />
                      </div>
                    </th>

                    <th class="products-th w-[12%]! text-center!">Item</th>

                    <th class="products-th w-[36%]! text-left!">Description</th>

                    <th class="products-th w-[10%]! text-center!">Unit</th>

                    <th class="products-th w-[10%]! text-center!">Quantity</th>

                    <th class="products-th w-[12%]! text-right!">Price (RM)</th>

                    <th class="products-th w-[8%]! text-center!">Action</th>
                  </tr>
                </ng-template>

                <!-- Body -->
                <ng-template #body let-data let-rowIndex="rowIndex">
                  <tr class="products-table-row">
                    <td class="text-center!">
                      <span
                        class="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 font-semibold text-slate-700"
                      >
                        {{ data.code }}
                      </span>
                    </td>

                    <td class="text-center!">
                      <span class="font-semibold text-slate-800">
                        {{ data.name }}
                      </span>
                    </td>

                    <td class="text-left!">
                      <div
                        class="products-description text-sm text-slate-600"
                        [innerHTML]="data.description"
                      ></div>
                    </td>

                    <td class="text-center!">
                      <p-tag
                        [value]="data.unit || '-'"
                        severity="secondary"
                        [rounded]="true"
                      ></p-tag>
                    </td>

                    <td class="text-center!">
                      <span class="font-medium tabular-nums text-slate-700">
                        {{ data.quantity ?? 0 }}
                      </span>
                    </td>

                    <td class="text-right!">
                      <span class="font-semibold tabular-nums text-slate-800">
                        {{ data.price | number: '1.2-2' }}
                      </span>
                    </td>

                    <td class="text-center!">
                      <div class="flex items-center justify-center gap-1">
                        <p-button
                          icon="pi pi-pencil"
                          severity="info"
                          [text]="true"
                          [rounded]="true"
                          size="small"
                          pTooltip="Edit product"
                        ></p-button>

                        <p-button
                          icon="pi pi-trash"
                          severity="danger"
                          [text]="true"
                          [rounded]="true"
                          size="small"
                          pTooltip="Delete product"
                        ></p-button>
                      </div>
                    </td>
                  </tr>
                </ng-template>

                <!-- Empty Message -->
                <ng-template #emptymessage>
                  <tr>
                    <td colspan="7">
                      <div
                        class="flex flex-col items-center justify-center gap-3 py-12 text-center"
                      >
                        <div
                          class="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100"
                        >
                          <i class="pi pi-box text-2xl text-slate-400"></i>
                        </div>

                        <div>
                          <p class="font-semibold text-slate-700">
                            No products found
                          </p>

                          <p class="mt-1 text-sm text-slate-500">
                            Try another search or add a new product.
                          </p>
                        </div>

                        <p-button
                          label="Add Product"
                          icon="pi pi-plus"
                          size="small"
                          severity="info"
                          (onClick)="ActionClick('Create')"
                          styleClass="mt-1 rounded-lg!"
                        ></p-button>
                      </div>
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ====================================== -->
    <!-- CREATE PRODUCT / SERVICE DIALOG -->
    <!-- ====================================== -->

    <p-dialog
      [(visible)]="displayFormDialog"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [closable]="false"
      styleClass="products-form-dialog"
      [maskStyle]="{
        'overflow-y': 'auto',
        'background-color': 'rgba(15, 23, 42, 0.6)',
        'backdrop-filter': 'blur(6px)',
      }"
      appendTo="body"
    >
      <ng-template #headless>
        <div class="products-dialog-content">
          <!-- Dialog Header -->
          <div
            class="products-dialog-header flex items-start justify-between gap-3 border-b border-slate-200 bg-white p-4 sm:p-6"
          >
            <div class="flex min-w-0 items-center gap-3 sm:gap-4">
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 sm:h-14 sm:w-14"
              >
                <i class="pi pi-box text-xl sm:text-2xl"></i>
              </div>

              <div class="min-w-0">
                <h2
                  class="text-lg font-bold tracking-tight text-slate-900 sm:text-2xl"
                >
                  Create New Product / Service
                </h2>

                <p
                  class="mt-1 text-xs leading-relaxed text-slate-500 sm:text-sm"
                >
                  Provide the details below to catalogue your new offering.
                </p>
              </div>
            </div>

            <p-button
              icon="pi pi-times"
              [rounded]="true"
              [text]="true"
              severity="secondary"
              size="small"
              styleClass="shrink-0!"
              (onClick)="displayFormDialog = false"
            ></p-button>
          </div>

          <!-- Dialog Form -->
          <div class="products-dialog-body">
            <div
              class="grid grid-cols-12 gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:gap-5 sm:p-6"
              [formGroup]="FG"
            >
              <!-- Name -->
              <div class="col-span-12 flex flex-col gap-2 md:col-span-6">
                <label class="text-sm font-semibold text-slate-700">
                  Name <span class="text-rose-500">*</span>
                </label>

                <input
                  type="text"
                  pInputText
                  class="w-full! rounded-lg!"
                  placeholder="e.g. Premium Cloud Storage"
                  formControlName="name"
                />

                <small
                  *ngIf="FG.get('name')?.invalid && FG.get('name')?.touched"
                  class="text-xs text-red-500"
                >
                  Name is required.
                </small>
              </div>

              <!-- Code -->
              <div class="col-span-12 flex flex-col gap-2 md:col-span-6">
                <label class="text-sm font-semibold text-slate-700">
                  Code <span class="text-rose-500">*</span>
                </label>

                <input
                  type="text"
                  pInputText
                  class="w-full! rounded-lg! uppercase"
                  placeholder="e.g. PCS-100"
                  formControlName="code"
                />

                <small
                  *ngIf="FG.get('code')?.invalid && FG.get('code')?.touched"
                  class="text-xs text-red-500"
                >
                  Code is required.
                </small>
              </div>

              <!-- Description -->
              <div class="col-span-12 flex flex-col gap-2">
                <label class="text-sm font-semibold text-slate-700">
                  Description
                </label>

                <div class="products-editor">
                  <p-editor
                    formControlName="description"
                    [style]="{ 'min-height': '140px' }"
                  >
                    <ng-template #header>
                      <span class="ql-formats">
                        <button
                          type="button"
                          class="ql-bold"
                          aria-label="Bold"
                        ></button>

                        <button
                          type="button"
                          class="ql-italic"
                          aria-label="Italic"
                        ></button>

                        <button
                          type="button"
                          class="ql-underline"
                          aria-label="Underline"
                        ></button>

                        <button
                          type="button"
                          class="ql-list"
                          value="ordered"
                        ></button>

                        <button
                          type="button"
                          class="ql-list"
                          value="bullet"
                        ></button>
                      </span>
                    </ng-template>
                  </p-editor>
                </div>
              </div>

              <!-- Unit -->
              <div class="col-span-12 flex flex-col gap-2 sm:col-span-4">
                <label class="text-sm font-semibold text-slate-700">
                  Unit
                </label>

                <input
                  type="text"
                  pInputText
                  class="w-full! rounded-lg!"
                  placeholder="e.g. pcs, hrs"
                  formControlName="unit"
                />
              </div>

              <!-- Quantity -->
              <div class="col-span-12 flex flex-col gap-2 sm:col-span-4">
                <label class="text-sm font-semibold text-slate-700">
                  Quantity
                </label>

                <p-inputNumber
                  formControlName="quantity"
                  styleClass="w-full!"
                  inputStyleClass="w-full! rounded-lg!"
                  placeholder="0"
                ></p-inputNumber>
              </div>

              <!-- Price -->
              <div class="col-span-12 flex flex-col gap-2 sm:col-span-4">
                <label class="text-sm font-semibold text-slate-700">
                  Price (RM)
                </label>

                <p-inputNumber
                  formControlName="price"
                  mode="currency"
                  currency="MYR"
                  locale="en-MY"
                  [minFractionDigits]="2"
                  [maxFractionDigits]="3"
                  [min]="0"
                  styleClass="w-full!"
                  inputStyleClass="w-full! rounded-lg!"
                  placeholder="0.00"
                ></p-inputNumber>
              </div>
            </div>
          </div>

          <!-- Dialog Footer -->
          <div
            class="products-dialog-footer flex flex-col-reverse gap-2 border-t border-slate-200 bg-white p-4 sm:flex-row sm:justify-end sm:gap-3 sm:px-6"
          >
            <p-button
              label="Cancel"
              severity="secondary"
              [outlined]="true"
              (onClick)="displayFormDialog = false"
              styleClass="w-full! justify-center! rounded-xl! px-5! py-2.5! sm:w-auto!"
            ></p-button>

            <p-button
              label="Save Product"
              severity="info"
              (onClick)="Save()"
              icon="pi pi-check-circle"
              styleClass="w-full! justify-center! rounded-xl! border-none! bg-blue-600! px-6! py-2.5! font-semibold! shadow-sm! hover:bg-blue-700! sm:w-auto!"
            ></p-button>
          </div>
        </div>
      </ng-template>
    </p-dialog>
  `,
  styleUrl: './ProductsServices.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsServices implements OnInit, OnDestroy {
  @ViewChild('fTable') fTable?: Table;

  private readonly productServiceService = inject(ProductServicesService);
  private readonly loadingService = inject(LoadingService);
  private readonly messageService = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  PagingSignal = signal<PagingContent<ProductServiceDto>>(
    {} as PagingContent<ProductServiceDto>,
  );

  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  search: string = '';
  menuItems: MenuItem[] = [];

  FG!: FormGroup;

  displayFormDialog: boolean = false;

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 10;
    this.Query.Filter = null;
    this.Query.OrderBy = `CreatedAt desc`;
    this.Query.Select = null;
    this.Query.Includes = null;
  }

  ngOnInit(): void {}

  GetData(): void {
    this.loadingService.start();

    this.productServiceService
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
          this.cdr.markForCheck();
        },
      });
  }

  NextPage(event: TableLazyLoadEvent): void {
    if ((event?.first || event?.first === 0) && event?.rows) {
      this.Query.Page = event.first / event.rows + 1 || 1;
      this.Query.PageSize = event.rows;
    }

    const sortText = BuildSortText(event);
    this.Query.OrderBy = sortText ? sortText : 'CreatedAt desc';

    this.Query.Filter = BuildFilterText(event);

    this.GetData();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.Search(this.search);
    }
  }

  Search(data: string): void {
    this.search = data;

    const filter = {
      Name: [
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
      rows: this.fTable?.rows || this.Query.PageSize,
      sortField: null,
      sortOrder: null,
      filters: filter,
    };

    this.NextPage(event);
  }

  ResetTable(): void {
    this.search = '';

    if (this.fTable) {
      this.fTable.first = 0;
      this.fTable.clearFilterValues();
      this.fTable.saveState();
    }

    this.Query.Filter = null;
    this.Query.Page = 1;

    this.GetData();
  }

  onEllipsisClick(event: any, data: ProductServiceDto, menu: any): void {}

  ActionClick(action: string, data?: ProductServiceDto): void {
    if (action === 'Create') {
      this.initForm();
      this.displayFormDialog = true;
    }
  }

  initForm(): void {
    this.FG = new FormGroup({
      id: new FormControl<string | null>({
        value: null,
        disabled: true,
      }),
      name: new FormControl<string | null>(null),
      code: new FormControl<string | null>(null),
      description: new FormControl<string | null>(null),
      unit: new FormControl<string | null>(null),
      quantity: new FormControl<number | null>(1),
      price: new FormControl<number | null>(null),
    });
  }

  Save(): void {
    if (this.FG.valid) {
      this.loadingService.start();

      this.productServiceService
        .Create(this.FG.getRawValue())
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe({
          next: (res) => {
            this.loadingService.stop();

            const current = this.PagingSignal();

            this.PagingSignal.set({
              ...current,
              data: [res, ...(current.data || [])],
              totalElements: (current.totalElements || 0) + 1,
            });

            this.displayFormDialog = false;
            this.FG.reset();

            this.cdr.markForCheck();

            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Item created successfully',
            });
          },
          error: () => {
            this.loadingService.stop();
            this.cdr.markForCheck();
          },
        });
    } else {
      ValidateAllFormFields(this.FG);
      this.cdr.markForCheck();
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
