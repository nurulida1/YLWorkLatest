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
import { MenuItem, MessageService } from 'primeng/api';
import { Observable, Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { RouterLink } from '@angular/router';
import { MenuModule } from 'primeng/menu';
import { DialogModule } from 'primeng/dialog';
import { ImageModule } from 'primeng/image';
import { InventoryDto } from '../../../models/Inventory';
import { InventoryService } from '../../../services/InventoryService';
import { LoadingService } from '../../../services/loading.service';
import {
  PagingContent,
  GridifyQueryExtend,
  BuildSortText,
  BuildFilterText,
} from '../../../shared/helpers/helpers';

@Component({
  selector: 'app-inventory',
  imports: [
    CommonModule,
    ButtonModule,
    TableModule,
    FormsModule,
    ReactiveFormsModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    SelectModule,
    RouterLink,
    DatePickerModule,
    MenuModule,
    DialogModule,
    ImageModule,
  ],
  template: `<div class="w-full flex flex-col p-5">
      <div class="flex flex-row items-center gap-1 text-gray-500 tracking-wide">
        <div
          class="cursor-pointer hover:text-gray-600"
          [routerLink]="'/dashboard'"
        >
          Dashboard
        </div>
        /
        <div class="text-gray-700 font-semibold">Inventory</div>
      </div>
      <div
        class="mt-3 border border-gray-200 rounded-md tracking-wide bg-white p-5 flex flex-col"
      >
        <div class="flex flex-row items-center justify-between">
          <div class="flex flex-col">
            <div class="text-[20px] text-gray-700 font-semibold">Inventory</div>
            <div class="text-gray-500">Manage and track stock items</div>
          </div>
          <p-button
            label="New Inventory"
            severity="info"
            icon="pi pi-plus-circle"
            styleClass="tracking-wider!"
            (onClick)="ActionClick(null, 'add')"
          ></p-button>
        </div>
        <div class="flex flex-row items-center gap-2 mt-3">
          <div class="flex-1 flex flex-row relative">
            <input
              type="text"
              pInputText
              [(ngModel)]="search"
              class="w-full!"
              placeholder="Search by name, model, or brand ... "
              (keyup)="onKeyDown($event)"
            />
            <i
              class="pi pi-search absolute! top-3! right-2! text-gray-500!"
            ></i>
          </div>
          <p-select
            [options]="sectionFilter || []"
            [(ngModel)]="selectedSectionId"
            appendTo="body"
            (onChange)="applyFilters()"
          ></p-select>
          <p-select
            [options]="[
              {
                label: 'All Status',
                value: 'All',
              },
              {
                label: 'In Stock',
                value: 'In Stock',
              },
              {
                label: 'Low Stock',
                value: 'Low Stock',
              },
              {
                label: 'Restock',
                value: 'Restock',
              },
              {
                label: 'FOC',
                value: 'FOC',
              },
              {
                label: 'Faulty',
                value: 'Faulty',
              },
              {
                label: 'Under Repair',
                value: 'Under Repair',
              },
            ]"
            appendTo="body"
            [(ngModel)]="selectedStatus"
            (onChange)="applyFilters()"
          ></p-select>
          <p-select
            [options]="categoryFilter || []"
            [(ngModel)]="selectedCategoryId"
            appendTo="body"
            (onChange)="applyFilters()"
          ></p-select>
          <p-button
            label="Reset all"
            severity="secondary"
            styleClass="border-gray-200!"
            [disabled]="Query.Filter == null"
            (onClick)="ResetTable()"
          ></p-button>
        </div>

        <div class="mt-3">
          <p-table
            #fTable
            [value]="PagingSignal().data"
            [paginator]="true"
            [rows]="Query.PageSize"
            [totalRecords]="PagingSignal().totalElements"
            tableStyleClass="min-w-[70rem] 3xl:min-w-[80rem]"
            [rowsPerPageOptions]="[10, 20, 30, 50]"
            [showGridlines]="true"
            [lazy]="true"
            (onLazyLoad)="NextPage($event)"
          >
            <ng-template #header>
              <tr>
                <th class="bg-gray-100! text-center! w-[10%]!"></th>
                <th
                  pSortableColumn="ItemName"
                  class="bg-gray-100! text-center! w-[20%]!"
                >
                  <div class="flex flex-row items-center gap-2">
                    <div>Item</div>
                    <p-sortIcon field="ItemName" />
                  </div>
                </th>
                <th
                  class="bg-gray-100! text-center! w-[15%]!"
                  pSortableColumn="Brand"
                >
                  <div class="flex flex-row items-center gap-2">
                    <div>Brand</div>
                    <p-sortIcon field="Brand" />
                  </div>
                </th>
                <th class="bg-gray-100! w-[10%]!" pSortableColumn="Model">
                  <div class="flex flex-row items-center gap-2">
                    <div>Model</div>
                    <p-sortIcon field="Model" />
                  </div>
                </th>
                <th
                  class="bg-gray-100! text-center! w-[10%]!"
                  pSortableColumn="Section"
                >
                  <div class="flex flex-row items-center justify-center gap-2">
                    <div>Section</div>
                    <p-sortIcon field="Section" />
                  </div>
                </th>
                <th class="bg-gray-100! text-center! w-[10%]!">Balance</th>
                <th
                  class="bg-gray-100! text-center! w-[10%]!"
                  pSortableColumn="ParLevel"
                >
                  <div class="flex flex-row items-center justify-center gap-2">
                    <div>Par</div>
                    <p-sortIcon field="ParLevel" />
                  </div>
                </th>
                <th class="bg-gray-100! text-center! w-[10%]!">Status</th>
                <th class="bg-gray-100! text-center! w-[10%]!">Action</th>
              </tr>
            </ng-template>
            <ng-template #body let-data>
              <tr
                [ngClass]="{
                  'bg-red-50!': data.status === 'Restock',
                  'bg-white!': data.status !== 'Restock',
                }"
              >
                <td>
                  <div class="flex items-center justify-center">
                    <p-image
                      [src]="data.attachment"
                      [preview]="true"
                      *ngIf="data.attachment"
                      width="70px"
                      height="70px"
                    ></p-image>
                  </div>
                </td>
                <td>
                  {{ data.itemName }}
                </td>
                <td>
                  {{ data.brand }}
                </td>
                <td>
                  {{ data.model }}
                </td>
                <td class="text-center!">
                  <div class="bg-gray-100 px-2 py-1">
                    {{ data.section.name }}
                  </div>
                </td>
                <td class="text-center!">
                  <div
                    [ngClass]="{
                      'text-red-500 font-semibold': data.quantity === 1,
                    }"
                  >
                    {{ data.quantity }}
                  </div>
                </td>
                <td class="text-center!">
                  {{ data.parLevel }}
                </td>
                <td class="text-center!">
                  <div
                    *ngIf="data.status"
                    class="rounded-full py-0 px-3 text-[12px] border-[0.5px]"
                    [ngClass]="{
                      'bg-green-200 text-green-700': data.status === 'In Stock',
                      'bg-purple-200 text-purple-700': data.status === 'FOC',
                      'bg-red-200 text-red-700':
                        data.status === 'Restock' || data.status == 'Low Stock',
                      'bg-yellow-100 text-orange-800':
                        data.status === 'Faulty/Repair',
                      'animate-pulse': data.status === 'Restock',
                    }"
                  >
                    {{ data.status }}
                  </div>
                </td>
                <td class="text-center!">
                  <i
                    class="pi pi-ellipsis-h cursor-pointer!"
                    (click)="onEllipsisClick($event, data, menu)"
                  ></i>
                </td>
              </tr>
            </ng-template>

            <ng-template #emptymessage>
              <tr>
                <td colspan="100%">
                  <div
                    class="flex items-center justify-center text-sm text-gray-500"
                  >
                    No inventory available
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
      *ngIf="visible"
      [(visible)]="visible"
      [modal]="true"
      [draggable]="false"
      [closable]="true"
      (onHide)="visible = false"
      styleClass="bg-white rounded-xl shadow-xl w-[90%] max-w-4xl border-0 overflow-hidden"
    >
      <ng-template #headless>
        <div class="flex flex-col h-full bg-white font-sans text-gray-900">
          <div class="p-6 border-b border-gray-100 bg-gray-50/30">
            <h2 class="font-bold text-xl tracking-tight text-gray-900 m-0">
              {{ title }}
            </h2>
            <p class="text-sm text-gray-500 m-0 mt-1">
              Complete the details below to maintain system inventory
              specifications.
            </p>
          </div>

          <div class="p-8 overflow-y-auto max-h-[70vh]">
            <div class="flex flex-col gap-8" [formGroup]="FG">
              <div class="flex flex-col gap-4">
                <div class="border-b border-gray-100 pb-2">
                  <h3
                    class="text-sm font-bold uppercase tracking-wider text-gray-400 m-0"
                  >
                    Product Identification
                  </h3>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div class="flex flex-col gap-1.5">
                    <label class="text-sm font-semibold text-gray-700"
                      >Item Code</label
                    >
                    <input
                      type="text"
                      pInputText
                      class="w-full h-10 px-3 border border-gray-200 rounded-md bg-gray-50/50 focus:bg-white transition-all"
                      formControlName="itemCode"
                      placeholder="e.g., HW-CAM-01"
                    />
                  </div>

                  <div class="flex flex-col gap-1.5">
                    <label class="text-sm font-semibold text-gray-700"
                      >Brand</label
                    >
                    <input
                      type="text"
                      pInputText
                      class="w-full h-10 px-3 border border-gray-200 rounded-md focus:bg-white transition-all"
                      formControlName="brand"
                      placeholder="e.g., Hanwha Vision"
                    />
                  </div>

                  <div class="md:col-span-2 flex flex-col gap-1.5">
                    <label
                      class="text-sm font-semibold text-gray-700 flex items-center gap-1"
                    >
                      Item Name <span class="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      pInputText
                      class="w-full h-10 px-3 border border-gray-200 rounded-md focus:bg-white transition-all"
                      formControlName="itemName"
                      placeholder="e.g., Hanwha Dome Camera 1080P WDR IP Dome IR"
                    />
                  </div>

                  <div class="flex flex-col gap-1.5">
                    <label class="text-sm font-semibold text-gray-700"
                      >Model</label
                    >
                    <input
                      type="text"
                      pInputText
                      class="w-full h-10 px-3 border border-gray-200 rounded-md focus:bg-white transition-all"
                      formControlName="model"
                      placeholder="e.g., QND-6012RP"
                    />
                  </div>

                  <div class="flex flex-col gap-1.5">
                    <label class="text-sm font-semibold text-gray-700"
                      >Category</label
                    >
                    <p-select
                      [options]="categorySelection || []"
                      appendTo="body"
                      formControlName="categoryId"
                      [filter]="true"
                      styleClass="w-full h-10 border border-gray-200 rounded-md flex items-center bg-white"
                      placeholder="Select Category"
                    ></p-select>
                  </div>
                </div>
              </div>

              <div class="flex flex-col gap-4">
                <div class="border-b border-gray-100 pb-2">
                  <h3
                    class="text-sm font-bold uppercase tracking-wider text-gray-400 m-0"
                  >
                    Logistics & Stock Levels
                  </h3>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div class="flex flex-col gap-1.5">
                    <label class="text-sm font-semibold text-gray-700"
                      >Storage Location</label
                    >
                    <p-select
                      [options]="locationSelection || []"
                      appendTo="body"
                      formControlName="locationId"
                      [filter]="true"
                      styleClass="w-full h-10 border border-gray-200 rounded-md flex items-center bg-white"
                      placeholder="Select Location"
                    ></p-select>
                  </div>

                  <div class="flex flex-col gap-1.5">
                    <label
                      class="text-sm font-semibold text-gray-700 flex items-center gap-1"
                    >
                      Section / Rack <span class="text-rose-500">*</span>
                    </label>
                    <p-select
                      [options]="sectionSelection || []"
                      appendTo="body"
                      formControlName="sectionId"
                      [filter]="true"
                      styleClass="w-full h-10 border border-gray-200 rounded-md flex items-center bg-white"
                      placeholder="Select Rack / Shelf Slot"
                    ></p-select>
                  </div>

                  <div class="flex flex-col gap-1.5">
                    <label
                      class="text-sm font-semibold text-gray-700 flex items-center gap-1"
                    >
                      Current Quantity <span class="text-rose-500">*</span>
                    </label>
                    <p-inputnumber
                      formControlName="quantity"
                      mode="decimal"
                      [minFractionDigits]="2"
                      [maxFractionDigits]="4"
                      styleClass="w-full"
                      inputStyleClass="w-full h-10 border border-gray-200 rounded-md text-right px-3 bg-white"
                    ></p-inputnumber>
                  </div>

                  <div class="flex flex-col gap-1.5">
                    <label class="text-sm font-semibold text-gray-700"
                      >Minimum Par Level</label
                    >
                    <p-inputnumber
                      formControlName="parLevel"
                      mode="decimal"
                      [minFractionDigits]="2"
                      [maxFractionDigits]="4"
                      styleClass="w-full"
                      inputStyleClass="w-full h-10 border border-gray-200 rounded-md text-right px-3 bg-white"
                    ></p-inputnumber>
                  </div>

                  <div class="flex flex-col gap-1.5">
                    <label class="text-sm font-semibold text-gray-700"
                      >Unit of Measure (UOM)</label
                    >
                    <p-select
                      formControlName="unit"
                      appendTo="body"
                      styleClass="w-full h-10 border border-gray-200 rounded-md flex items-center bg-white"
                      placeholder="Select Unit Type"
                      [options]="[
                        { label: 'Pcs', value: 'Pcs' },
                        { label: 'Box', value: 'Box' },
                        { label: 'Set', value: 'Set' },
                        { label: 'Pair', value: 'Pair' },
                        { label: 'Unit', value: 'Unit' },
                      ]"
                    ></p-select>
                  </div>

                  <div class="flex flex-col gap-1.5">
                    <label class="text-sm font-semibold text-gray-700"
                      >Inventory Status</label
                    >
                    <p-select
                      formControlName="status"
                      appendTo="body"
                      styleClass="w-full h-10 border border-gray-200 rounded-md flex items-center bg-white"
                      [options]="[
                        { label: 'All Status', value: 'All' },
                        { label: 'In Stock', value: 'In Stock' },
                        { label: 'Low Stock', value: 'Low Stock' },
                        { label: 'Restock', value: 'Restock' },
                        { label: 'FOC', value: 'FOC' },
                        { label: 'Faulty', value: 'Faulty' },
                        { label: 'Under Repair', value: 'Under Repair' },
                      ]"
                    ></p-select>
                  </div>
                </div>
              </div>

              <div class="flex flex-col gap-4">
                <div class="border-b border-gray-100 pb-2">
                  <h3
                    class="text-sm font-bold uppercase tracking-wider text-gray-400 m-0"
                  >
                    Documentation
                  </h3>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div class="md:col-span-2 flex flex-col gap-1.5">
                    <label class="text-sm font-semibold text-gray-700"
                      >Internal Operational Remarks</label
                    >
                    <textarea
                      pTextarea
                      formControlName="remarks"
                      [rows]="3"
                      class="w-full border border-gray-200 rounded-md p-3 focus:border-blue-500 resize-none line-height-relaxed bg-white"
                      placeholder="Enter context, project constraints or supplier notes..."
                    ></textarea>
                  </div>

                  <div class="md:col-span-2 flex flex-col gap-2 mt-1">
                    <label class="text-sm font-semibold text-gray-700"
                      >Product Image Document</label
                    >

                    <div
                      class="flex flex-row items-center gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50/50 max-w-xl"
                      *ngIf="FG.get('attachment')?.value"
                    >
                      <div
                        class="w-16 h-16 bg-white border border-gray-200 rounded flex items-center justify-center overflow-hidden flex-shrink-0"
                      >
                        <img
                          [src]="FG.get('attachment')?.value"
                          alt="Preview"
                          class="w-full h-full object-contain"
                        />
                      </div>
                      <div class="flex flex-col gap-1">
                        <span
                          class="text-sm font-medium text-gray-900 font-mono"
                          >Attachment Loaded</span
                        >
                        <div class="flex items-center gap-2">
                          <button
                            type="button"
                            class="text-sm font-bold text-gray-600 underline hover:text-gray-900"
                            (click)="file.click()"
                          >
                            Replace File
                          </button>
                          <span class="text-gray-300 text-xs">|</span>
                          <button
                            type="button"
                            class="text-sm font-bold text-rose-600 underline hover:text-rose-800"
                            (click)="removeAttachment()"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      *ngIf="!FG.get('attachment')?.value"
                      class="w-full max-w-xs h-10 flex items-center justify-center gap-2 border border-gray-200 border-dashed rounded-md bg-white hover:bg-gray-50 text-sm font-semibold text-gray-700 transition-colors"
                      (click)="file.click()"
                    >
                      <i class="pi pi-upload text-gray-400"></i>
                      Upload File
                    </button>

                    <input
                      type="file"
                      #file
                      hidden
                      accept="image/*"
                      (change)="onFileSelected($event)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            class="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3"
          >
            <button
              type="button"
              class="px-5 h-10 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-100 transition-all"
              (click)="visible = false"
            >
              Cancel
            </button>
            <button
              type="button"
              class="px-6 h-10 text-sm font-semibold text-white bg-gray-900 border border-transparent rounded-md hover:bg-gray-800 transition-all shadow-sm"
              (click)="SaveInventory()"
            >
              {{ isUpdate ? 'Save Changes' : 'Register Item' }}
            </button>
          </div>
        </div>
      </ng-template>
    </p-dialog>`,
  styleUrl: './inventory.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Inventory implements OnInit, OnDestroy {
  @ViewChild('fTable') fTable?: Table;

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly loadingService = inject(LoadingService);
  private readonly messageService = inject(MessageService);
  private readonly inventoryService = inject(InventoryService);

  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  PagingSignal = signal<PagingContent<InventoryDto>>(
    {} as PagingContent<InventoryDto>,
  );
  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  sectionSelection: { label: string; value: string }[] = [];
  categorySelection: { label: string; value: string }[] = [];
  locationSelection: { label: string; value: string }[] = [];
  sectionFilter: { label: string; value: string }[] = [];
  categoryFilter: { label: string; value: string }[] = [];

  visible: boolean = false;
  isUpdate: boolean = false;

  selectedCategoryId: string = 'All';
  selectedSectionId: string = 'All';
  selectedStatus: string = 'All';

  search: string = '';
  title: string = 'New Inventory';
  menuItems: MenuItem[] = [];

  FG!: FormGroup;

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 10;
    this.Query.Filter = null;
    this.Query.OrderBy = 'ItemName';
    this.Query.Select = null;
    this.Query.Includes = null;
  }

  ngOnInit(): void {
    this.getDropdown();
  }

  GetData() {
    this.loadingService.start();
    this.inventoryService
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

  buildFilters(): string {
    const filters: string[] = [];

    if (this.search?.trim()) {
      filters.push(`ItemName=${this.search.trim()}`);
    }

    if (this.selectedSectionId && this.selectedSectionId !== 'All') {
      filters.push(`SectionId=${this.selectedSectionId}`);
    }

    if (this.selectedCategoryId && this.selectedCategoryId !== 'All') {
      filters.push(`CategoryId=${this.selectedCategoryId}`);
    }

    if (this.selectedStatus && this.selectedStatus !== 'All') {
      filters.push(`Status=${this.selectedStatus}`);
    }

    return filters.join(',');
  }

  applyFilters() {
    if (this.fTable) {
      this.fTable.first = 0;
    }

    this.Query.Page = 1;
    this.Query.Filter = this.buildFilters();

    this.GetData();
  }

  NextPage(event: TableLazyLoadEvent) {
    if ((event?.first || event?.first === 0) && event?.rows) {
      this.Query.Page = event.first / event.rows + 1 || 1;
      this.Query.PageSize = event.rows;
    }

    const sortText = BuildSortText(event);
    this.Query.OrderBy = sortText ? sortText : 'ItemName';

    this.Query.Filter = BuildFilterText(event);
    this.GetData();
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.applyFilters();
    }

    if (event.key === 'Backspace' && this.search === '') {
      this.applyFilters();
    }
  }

  Search(data: string) {
    this.search = data;
    this.applyFilters();
  }

  ResetTable() {
    this.search = '';
    this.selectedCategoryId = 'All';
    this.selectedSectionId = 'All';
    this.selectedStatus = 'All';

    if (this.fTable) {
      this.fTable.first = 0;
      this.fTable.clearFilterValues();
      this.fTable.saveState();
    }

    this.Query.Filter = null;
    this.GetData();
  }

  initForm() {
    this.FG = new FormGroup({
      id: new FormControl<string | null>({ value: null, disabled: true }),
      itemCode: new FormControl<string | null>(null),
      itemName: new FormControl<string | null>(null, Validators.required),
      brand: new FormControl<string | null>(null),
      model: new FormControl<string | null>(null),
      categoryId: new FormControl<string | null>(null),
      description: new FormControl<string | null>(null),
      unit: new FormControl<string | null>(null, Validators.required),
      quantity: new FormControl<number | null>(null, Validators.required),
      reservedQuantity: new FormControl<number | null>(0),
      serialNumber: new FormControl<string | null>(null),
      referenceType: new FormControl<string | null>(null),
      referenceId: new FormControl<string | null>(null),
      locationId: new FormControl<string | null>(null),
      sectionId: new FormControl<string | null>(null),
      parLevel: new FormControl<string | null>(null),
      date: new FormControl<Date | null>(new Date()),
      status: new FormControl<string | null>(null),
      remarks: new FormControl<string | null>(null),
      costs: new FormControl<number | null>(null),
      attachment: new FormControl<string | null>(null),
    });
  }

  onEllipsisClick(event: any, client: any, menu: any) {
    this.menuItems = [
      {
        label: 'Edit',
        icon: 'pi pi-pencil',
        command: () => this.ActionClick(client, 'Update'),
      },
      {
        label: 'Delete',
        icon: 'pi pi-trash',
        command: () => this.ActionClick(client, 'Delete'),
      },
    ];

    menu.toggle(event);
  }

  ActionClick(data: InventoryDto | null, action: string) {
    if (action === 'Delete' && data) {
      this.loadingService.start();

      this.inventoryService
        .Delete(data?.id)
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe({
          next: (res: any) => {
            this.loadingService.stop();

            this.messageService.add({
              severity: 'success',
              summary: 'Deleted',
              detail: res?.message || 'Inventory deleted successfully',
            });

            this.PagingSignal.update((state) => ({
              ...state,
              data: state.data.filter((d: any) => d.id !== data.id),
            }));

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
                'Failed to delete inventory',
            });
          },
        });
    } else if (action === 'Update' && data) {
      this.isUpdate = true;
      this.initForm();
      this.FG.get('id')?.enable();
      this.FG.patchValue({
        ...data,
        date: new Date(data.date),
      });
      this.visible = true;
      this.cdr.detectChanges();
    } else if (action === 'add') {
      this.initForm();
      this.FG.reset();
      this.visible = true;
      this.cdr.detectChanges();
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    const reader = new FileReader();

    reader.onload = () => {
      const base64 = reader.result as string;

      this.FG.patchValue({
        attachment: base64,
      });

      this.FG.get('attachment')?.markAsDirty();
    };

    reader.readAsDataURL(file);

    this.cdr.markForCheck();
  }

  removeAttachment() {
    this.FG.patchValue({
      attachment: null,
    });
  }

  mapToDropdown(data: { id: string; name: string }[]) {
    return data.map((x) => ({
      label: x.name,
      value: x.id,
    }));
  }

  getDropdown() {
    this.inventoryService
      .GetDropdown()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.sectionSelection = this.mapToDropdown(res.sections);
          this.categorySelection = this.mapToDropdown(res.categories);
          this.locationSelection = this.mapToDropdown(res.locations);

          this.sectionFilter = [
            { label: 'All Section', value: 'All' },
            ...this.mapToDropdown(res.sections),
          ];

          this.categoryFilter = [
            { label: 'All Category', value: 'All' },
            ...this.mapToDropdown(res.categories),
          ];
        },
      });
  }

  SaveInventory() {
    if (!this.FG.valid) {
      return this.messageService.add({
        severity: 'error',
        summary: 'Inventory Name is required',
        detail: '',
      });
    }

    const request$: Observable<any> = this.isUpdate
      ? this.inventoryService.Update(this.FG.value)
      : this.inventoryService.Create(this.FG.value);

    request$.pipe(takeUntil(this.ngUnsubscribe)).subscribe({
      next: (res) => {
        this.loadingService.stop();

        if (res) {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `Inventory: ${res.ItemName + ' has been ' + this.isUpdate ? 'updated' : 'added'} successfully`,
          });

          this.visible = false;

          if (this.isUpdate) {
            this.PagingSignal.update((state) => ({
              ...state,
              data: state.data.map((u: any) => (u.id === res.id ? res : u)),
            }));
            this.isUpdate = false;
          } else {
            this.PagingSignal.update((state) => ({
              ...state,
              data: [res, ...state.data],
            }));
          }
          this.cdr.markForCheck();
        } else {
          this.messageService.add({
            severity: 'warn',
            summary: 'Warning',
            detail: res.message || res.Message || 'Operation partially failed',
          });
        }
      },
      error: (err: any) => {
        this.loadingService.stop();

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail:
            err.error?.message ||
            err.error?.Message ||
            'Something went wrong. Please try again.',
        });
      },
    });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
