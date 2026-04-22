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
import { LoadingService } from '../../services/loading.service';
import { MenuItem, MessageService } from 'primeng/api';
import { UserService } from '../../services/userService.service';
import { InventoryService } from '../../services/InventoryService';
import { Observable, Subject, takeUntil } from 'rxjs';
import {
  BuildFilterText,
  BuildSortText,
  GridifyQueryExtend,
  PagingContent,
} from '../../shared/helpers/helpers';
import { InventoryDto } from '../../models/Inventory';
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
      <div
        class="flex flex-row items-center gap-1 text-gray-500 text-[15px] tracking-wide"
      >
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
            <div class="text-gray-500 text-[15px]">
              Manage and track stock items
            </div>
          </div>
          <p-button
            label="New Inventory"
            severity="info"
            size="small"
            icon="pi pi-plus-circle"
            (onClick)="ActionClick(null, 'add')"
          ></p-button>
        </div>
        <div class="flex flex-row items-center gap-2 mt-3">
          <div class="flex-1 flex flex-row relative">
            <input
              type="text"
              pInputText
              [(ngModel)]="search"
              class="w-full! text-[15px]!"
              placeholder="Search by name, model, or brand ... "
              (keyup)="onKeyDown($event)"
            />
            <i
              class="pi pi-search absolute! top-3! right-2! text-gray-500!"
            ></i>
          </div>
          <p-select
            styleClass="text-[15px]!"
            [options]="sectionFilter || []"
            [(ngModel)]="selectedSectionId"
            appendTo="body"
            (onChange)="applyFilters()"
          ></p-select>
          <p-select
            styleClass="text-[15px]!"
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
                label: 'Restock',
                value: 'Restock',
              },
              {
                label: 'FOC',
                value: 'FOC',
              },
              {
                label: 'Faulty/Repair',
                value: 'Faulty/Repair',
              },
            ]"
            appendTo="body"
            [(ngModel)]="selectedStatus"
            (onChange)="applyFilters()"
          ></p-select>
          <p-select
            styleClass="text-[15px]!"
            [options]="categoryFilter || []"
            [(ngModel)]="selectedCategoryId"
            appendTo="body"
            (onChange)="applyFilters()"
          ></p-select>
          <p-button
            label="Reset all"
            severity="secondary"
            styleClass="border-gray-200! text-[15px]!"
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
            [tableStyle]="{ 'min-width': '80rem' }"
            [rowsPerPageOptions]="[10, 20, 30, 50]"
            [showGridlines]="true"
            [lazy]="true"
            size="small"
            (onLazyLoad)="NextPage($event)"
          >
            <ng-template #header>
              <tr>
                <th
                  class="bg-gray-100! text-[15px]! text-center! w-[10%]!"
                ></th>
                <th class="bg-gray-100! text-[15px]! text-center! w-[20%]!">
                  Item
                </th>
                <th class="bg-gray-100! text-[15px]! text-center! w-[15%]!">
                  Brand
                </th>
                <th class="bg-gray-100! text-[15px]! text-center! w-[10%]!">
                  Model
                </th>
                <th class="bg-gray-100! text-[15px]! text-center! w-[10%]!">
                  Section
                </th>
                <th class="bg-gray-100! text-[15px]! text-center! w-[10%]!">
                  Balance
                </th>
                <th class="bg-gray-100! text-[15px]! text-center! w-[10%]!">
                  Par
                </th>
                <th class="bg-gray-100! text-[15px]! text-center! w-[10%]!">
                  Status
                </th>
                <th class="bg-gray-100! text-[15px]! text-center! w-[10%]!">
                  Action
                </th>
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
                <td class="text-center! text-[15px]!">
                  {{ data.itemName }}
                </td>
                <td class="text-center! text-[15px]!">
                  {{ data.brand }}
                </td>
                <td class="text-center! text-[15px]!">
                  {{ data.model }}
                </td>
                <td class="text-center! text-[15px]!">
                  {{ data.section.name }}
                </td>
                <td class="text-center! text-[15px]!">
                  <div
                    [ngClass]="{
                      'text-red-500 font-semibold': data.quantity === 1,
                    }"
                  >
                    {{ data.quantity }}
                  </div>
                </td>
                <td class="text-center! text-[15px]!">
                  {{ data.parLevel }}
                </td>
                <td class="text-center! text-[15px]!">
                  <div
                    *ngIf="data.status"
                    class="rounded-full py-0 px-3 text-[14px] border-[0.5px]"
                    [ngClass]="{
                      'bg-green-200 text-green-700': data.status === 'In Stock',
                      'bg-purple-200 text-purple-700': data.status === 'FOC',
                      'bg-red-200 text-red-700': data.status === 'Restock',
                      'bg-yellow-100 text-orange-800':
                        data.status === 'Faulty/Repair',
                      'animate-pulse': data.status === 'Restock',
                    }"
                  >
                    {{ data.status }}
                  </div>
                </td>
                <td class="text-center! text-[15px]!">
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
      styleClass="text-[15px]! relative! border-0! bg-white! overflow-y-auto! w-[80%]! lg:w-[50%]!"
    >
      <ng-template #headless>
        <div class="p-5 flex flex-col">
          <div class="font-semibold text-[20px]">{{ title }}</div>
          <div class="font-normal tracking-wide text-gray-500 text-[15px]">
            Fill in all required field.
          </div>
          <div
            class="mt-3 grid grid-cols-12 items-center gap-5"
            [formGroup]="FG"
          >
            <div class="col-span-12 flex flex-col gap-1">
              <div>Item Name <span class="text-red-500">*</span></div>
              <input
                type="text"
                class="w-full"
                pInputText
                formControlName="itemName"
              />
            </div>
            <div class="col-span-12 md:col-span-6 flex flex-col gap-1">
              <div>Brand</div>
              <input
                type="text"
                formControlName="brand"
                pInputText
                class="w-full"
              />
            </div>
            <div class="col-span-12 md:col-span-6 flex flex-col gap-1">
              <div>Model</div>
              <input
                type="text"
                pInputText
                class="w-full"
                formControlName="model"
              />
            </div>
            <div class="col-span-12 md:col-span-6 flex flex-col gap-1">
              <div>Category</div>
              <p-select
                [options]="categorySelection || []"
                appendTo="body"
                formControlName="categoryId"
                [filter]="true"
              ></p-select>
            </div>
            <div class="col-span-12 md:col-span-6 flex flex-col gap-1">
              <div>Location</div>
              <p-select
                [options]="locationSelection || []"
                appendTo="body"
                formControlName="locationId"
                [filter]="true"
              ></p-select>
            </div>
            <div class="col-span-12 md:col-span-6 flex flex-col gap-1">
              <div>Section <span class="text-red-500">*</span></div>

              <p-select
                [options]="sectionSelection || []"
                appendTo="body"
                formControlName="sectionId"
                [filter]="true"
              ></p-select>
            </div>
            <div class="col-span-12 md:col-span-6 flex flex-col gap-1">
              <div>Quantity <span class="text-red-500">*</span></div>
              <p-inputnumber formControlName="quantity"></p-inputnumber>
            </div>
            <div class="col-span-12 md:col-span-6 flex flex-col gap-1">
              <div>Par Level</div>
              <p-inputnumber formControlName="parLevel"></p-inputnumber>
            </div>
            <div class="col-span-12 md:col-span-6 flex flex-col gap-1">
              <div>Unit</div>
              <p-select
                formControlName="unit"
                appendTo="body"
                [options]="[
                  { label: 'Pcs', value: 'Pcs' },
                  { label: 'Box', value: 'Box' },
                  { label: 'Set', value: 'Set' },
                  { label: 'Pair', value: 'Pair' },
                  { label: 'Unit', value: 'Unit' },
                ]"
              ></p-select>
            </div>
            <div class="col-span-12 md:col-span-6 flex flex-col gap-1">
              <div>Status</div>
              <p-select
                formControlName="status"
                appendTo="body"
                [options]="[
                  { label: 'In Stock', value: 'In Stock' },
                  { label: 'FOC', value: 'FOC' },
                  { label: 'Restock', value: 'Restock' },
                  { label: 'Faulty/Repair', value: 'Faulty/Repair' },
                ]"
              ></p-select>
            </div>
            <div class="col-span-12 md:col-span-6 flex flex-col gap-1">
              <div>Cost (RM)</div>
              <p-inputnumber
                formControlName="costs"
                mode="decimal"
                [minFractionDigits]="2"
                [maxFractionDigits]="5"
              ></p-inputnumber>
            </div>
            <div class="col-span-12 flex flex-col gap-1">
              <div>Remark</div>
              <textarea
                name=""
                id=""
                pTextarea
                formControlName="remarks"
                [cols]="30"
                [rows]="3"
              ></textarea>
            </div>
            <div class="col-span-12 flex flex-col gap-1">
              <div>Attachment</div>
              <div
                class="flex flex-col gap-3"
                *ngIf="FG.get('attachment')?.value"
              >
                <div class="border w-[180px] h-[150px] border-gray-100">
                  <img
                    [src]="FG.get('attachment')?.value"
                    alt=""
                    class="w-full h-full object-contain"
                  />
                </div>
                <div class="flex flex-row items-center gap-2">
                  <p-button
                    label="Reupload"
                    icon="pi pi-upload"
                    size="small"
                    severity="secondary"
                    styleClass="border-gray-200!"
                    (onClick)="file.click()"
                  ></p-button>
                  <p-button
                    label="Delete"
                    size="small"
                    severity="danger"
                    styleClass="py-1.5!"
                    (onClick)="removeAttachment()"
                  ></p-button>
                </div>
              </div>
              <p-button
                *ngIf="!FG.get('attachment')?.value"
                label="Upload"
                severity="secondary"
                icon="pi pi-upload"
                size="small"
                styleClass="border-gray-200!"
                (onClick)="file.click()"
              ></p-button>
              <input
                type="file"
                #file
                hidden
                accept="image/*"
                (change)="onFileSelected($event)"
              />
            </div>
          </div>
          <div class="border-b border-gray-200 mt-3"></div>
          <div class="flex flex-row items-center justify-end gap-2 mt-5">
            <p-button
              label="Discard"
              severity="secondary"
              size="small"
              [outlined]="true"
              (onClick)="visible = false"
            ></p-button>
            <p-button
              [label]="isUpdate ? 'Save Changes' : 'Save'"
              severity="info"
              size="small"
              (onClick)="SaveInventory()"
            ></p-button>
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

    // search (LIKE behavior)
    if (this.search?.trim()) {
      filters.push(`ItemName=${this.search.trim()}`);
    }

    // section
    if (this.selectedSectionId && this.selectedSectionId !== 'All') {
      filters.push(`SectionId=${this.selectedSectionId}`);
    }

    // category
    if (this.selectedCategoryId && this.selectedCategoryId !== 'All') {
      filters.push(`CategoryId=${this.selectedCategoryId}`);
    }

    // status
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
      this.applyFilters(); // rebuild ALL filters, not just search
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
      itemName: new FormControl<string | null>(null, Validators.required),
      brand: new FormControl<string | null>(null),
      model: new FormControl<string | null>(null),
      categoryId: new FormControl<string | null>(null),
      description: new FormControl<string | null>(null),
      unit: new FormControl<string | null>(null, Validators.required),
      quantity: new FormControl<number | null>(null, Validators.required),
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
