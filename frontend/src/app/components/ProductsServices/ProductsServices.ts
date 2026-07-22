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
import { ProductServicesService } from '../../services/productServicesService';
import { LoadingService } from '../../services/loading.service';
import { MenuItem, MessageService } from 'primeng/api';
import { Router, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import {
  BuildFilterText,
  BuildSortText,
  GridifyQueryExtend,
  PagingContent,
  ValidateAllFormFields,
} from '../../shared/helpers/helpers';
import { ProductServiceDto } from '../../models/ProductService';
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
  template: `<div class="w-full flex flex-col p-5">
      <div class="flex flex-row items-center gap-1 text-gray-500 tracking-wide">
        <div
          [routerLink]="'/dashboard'"
          class="cursor-pointer hover:text-gray-600"
        >
          Dashboard
        </div>
        /
        <div class="text-gray-700 font-semibold">Products Services</div>
      </div>

      <div
        class="mt-3 border border-gray-200 rounded-md tracking-wide bg-white p-5 flex flex-col"
      >
        <div class="flex flex-row items-center justify-between">
          <div class="flex flex-col">
            <div class="text-[20px] text-gray-700 font-semibold">
              Products Services
            </div>
            <div class="text-gray-500">
              View, and manage products and services
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
                placeholder="Search by name"
              />
              <i
                class="pi pi-search absolute! top-3! right-2! text-gray-500!"
              ></i>
            </div>

            <p-button
              (onClick)="ActionClick('Create')"
              label="Add"
              icon="pi pi-plus"
              severity="info"
              styleClass="py-2! whitespace-nowrap! bg-blue-600! border-none!"
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
          >
            <ng-template #header>
              <tr>
                <th
                  pSortableColumn="Code"
                  class="bg-gray-100! text-center! w-[10%]!"
                >
                  <div class="flex flex-row justify-center items-center gap-2">
                    <div>Code</div>
                    <p-sortIcon field="Code" />
                  </div>
                </th>
                <th class="bg-gray-100! text-center! w-[5%]!">Item</th>
                <th class="bg-gray-100! text-left! w-[35%]">Description</th>
                <th class="bg-gray-100! text-center! w-[5%]">Unit</th>
                <th class="bg-gray-100! text-center! w-[5%]">Quantity</th>

                <th class="bg-gray-100! text-right! w-[10%]">Price (RM)</th>

                <th class="bg-gray-100! text-center! w-[5%]">Action</th>
              </tr>
            </ng-template>

            <ng-template #body let-data let-rowIndex="rowIndex">
              <tr>
                <td class="text-center! font-semibold!">
                  {{ data.code }}
                </td>
                <td class="text-center! font-semibold!">
                  {{ data.name }}
                </td>
                <td class="text-left!">
                  <div [innerHtml]="data.description"></div>
                </td>
                <td class="text-center!">
                  <p-tag [value]="data.unit" severity="secondary"></p-tag>
                </td>
                <td class="text-center!">
                  {{ data.quantity }}
                </td>
                <td class="text-right!">{{ data.price | number: '1.2' }}</td>

                <td class="text-center!">
                  <div class="flex flex-row items-center gap-2 justify-center">
                    <p-button
                      icon="pi pi-pencil"
                      severity="info"
                      [text]="true"
                    ></p-button>
                    <p-button
                      icon="pi pi-trash"
                      severity="danger"
                      [text]="true"
                    ></p-button>
                  </div>
                </td>
              </tr>
            </ng-template>

            <ng-template #emptymessage>
              <tr>
                <td colspan="100%" class="border-x!">
                  <div class="text-center text-gray-500">
                    No data found in records.
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      </div>
    </div>

    <p-dialog
      [(visible)]="displayFormDialog"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      styleClass="preview-dialog rounded-2xl! overflow-hidden w-[95%]! max-w-[760px]! shadow-2xl border-none"
      [maskStyle]="{
        'overflow-y': 'auto',
        'background-color': 'rgba(15, 23, 42, 0.6)',
        'backdrop-filter': 'blur(8px)',
      }"
      appendTo="body"
    >
      <ng-template #headless>
        <div class="p-6 md:p-8 flex flex-col gap-6 bg-slate-50/50">
          <div class="flex flex-col gap-1">
            <h2 class="text-2xl font-bold tracking-tight text-slate-900">
              Create New Product / Service
            </h2>
            <p class="text-sm text-slate-500">
              Provide the details below to catalog your new offering.
            </p>
          </div>

          <div
            class="grid grid-cols-12 gap-5 p-5 bg-white border border-slate-200/80 rounded-xl shadow-sm"
            [formGroup]="FG"
          >
            <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
              <label class="text-sm font-semibold text-slate-700">
                Name <span class="text-rose-500">*</span>
              </label>
              <input
                type="text"
                pInputText
                class="w-full border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all rounded-lg"
                placeholder="e.g., Premium Cloud Storage"
                formControlName="name"
              />
            </div>

            <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
              <label class="text-sm font-semibold text-slate-700">
                Code <span class="text-rose-500">*</span>
              </label>
              <input
                type="text"
                pInputText
                class="w-full border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all rounded-lg uppercase"
                placeholder="e.g., PCS-100"
                formControlName="code"
              />
            </div>

            <div class="col-span-12 flex flex-col gap-2">
              <label class="text-sm font-semibold text-slate-700"
                >Description</label
              >
              <p-editor
                formControlName="description"
                [style]="{ 'min-height': '120px' }"
                styleClass="border border-slate-200 rounded-lg overflow-hidden transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500"
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

            <div class="col-span-12 md:col-span-4 flex flex-col gap-2">
              <label class="text-sm font-semibold text-slate-700">Unit</label>
              <input
                type="text"
                pInputText
                class="w-full border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all rounded-lg"
                placeholder="e.g., pcs, hrs"
                formControlName="unit"
              />
            </div>

            <div class="col-span-12 md:col-span-4 flex flex-col gap-2">
              <label class="text-sm font-semibold text-slate-700"
                >Quantity</label
              >
              <p-inputNumber
                formControlName="quantity"
                styleClass="w-full"
                inputStyleClass="w-full border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all rounded-lg"
                placeholder="0"
              ></p-inputNumber>
            </div>

            <div class="col-span-12 md:col-span-4 flex flex-col gap-2">
              <label class="text-sm font-semibold text-slate-700">Price</label>
              <p-inputNumber
                formControlName="price"
                mode="currency"
                currency="MYR"
                locale="en-MY"
                [minFractionDigits]="2"
                [maxFractionDigits]="3"
                [min]="0"
                styleClass="w-full"
                inputStyleClass="w-full border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all rounded-lg"
                placeholder="0.00"
              ></p-inputNumber>
            </div>
          </div>

          <div class="pt-2 flex flex-row gap-3 justify-end items-center">
            <p-button
              label="Cancel"
              severity="secondary"
              [text]="true"
              (onClick)="displayFormDialog = false"
              styleClass="hover:bg-slate-100! border-gray-200! text-slate-600! font-medium px-5! py-2.5! rounded-lg"
            ></p-button>
            <p-button
              label="Save Item"
              severity="info"
              (onClick)="Save()"
              icon="pi pi-check-circle"
              styleClass="bg-blue-600! hover:bg-blue-700! text-white! border-none! font-medium px-6! py-2.5! rounded-lg shadow-sm shadow-blue-500/20 tracking-wide transition-all"
            ></p-button>
          </div>
        </div>
      </ng-template>
    </p-dialog> `,
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

  GetData() {
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

  onEllipsisClick(event: any, data: ProductServiceDto, menu: any) {}

  ActionClick(action: string, data?: ProductServiceDto) {
    if (action === 'Create') {
      this.initForm();
      this.displayFormDialog = true;
    }
  }

  initForm() {
    this.FG = new FormGroup({
      id: new FormControl<string | null>({ value: null, disabled: true }),
      name: new FormControl<string | null>(null),
      code: new FormControl<string | null>(null),
      description: new FormControl<string | null>(null),
      unit: new FormControl<string | null>(null),
      quantity: new FormControl<number | null>(1),
      price: new FormControl<number | null>(null),
    });
  }

  Save() {
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
