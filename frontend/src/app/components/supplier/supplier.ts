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
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { LoadingService } from '../../services/loading.service';
import { MenuItem, MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import {
  BuildFilterText,
  GridifyQueryExtend,
  PagingContent,
  ValidateAllFormFields,
} from '../../shared/helpers/helpers';
import { InputNumberModule } from 'primeng/inputnumber';
import { CompanyService } from '../../services/companyService';
import { CompanyDto } from '../../models/Company';

@Component({
  selector: 'app-supplier',
  imports: [
    CommonModule,
    RouterLink,
    InputTextModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    ReactiveFormsModule,
    TextareaModule,
    MenuModule,
    InputNumberModule,
  ],
  template: `<div class="min-h-screen w-full flex flex-col p-5">
      <div
        class="flex flex-row items-center gap-1 text-gray-500 text-[15px] tracking-wide"
      >
        <div
          [routerLink]="'/dashboard'"
          class="cursor-pointer hover:text-gray-600"
        >
          Dashboard
        </div>
        /
        <div class="text-gray-700 font-semibold">Suppliers</div>
      </div>
      <div
        class="mt-3 border border-gray-200 rounded-md tracking-wide bg-white p-5 flex flex-col"
      >
        <div class="flex flex-row items-center justify-between">
          <div class="flex flex-col">
            <div class="text-[20px] text-gray-700 font-semibold">Suppliers</div>
            <div class="text-gray-500 text-[15px]">
              Manage and monitor supplier accounts
            </div>
          </div>
          <div class="flex flex-row items-center gap-2">
            <div class="min-w-[300px] relative">
              <input
                type="text"
                pInputText
                [(ngModel)]="search"
                class="w-full! text-[15px]!"
                placeholder="Search by supplier name"
              />
              <i
                class="pi pi-search absolute! top-3! right-2! text-gray-500!"
              ></i>
            </div>
            <p-button
              (onClick)="ActionClick(null, 'add')"
              label="Add New Supplier"
              icon="pi pi-plus"
              severity="info"
              size="small"
              styleClass="py-2!"
            ></p-button>
          </div>
        </div>

        <div class="mt-3">
          <p-table
            #fTable
            [value]="PagingSignal().data"
            [paginator]="true"
            [rows]="Query.PageSize"
            [totalRecords]="PagingSignal().totalElements"
            [tableStyle]="{ 'min-width': '60rem' }"
            [rowsPerPageOptions]="[10, 20, 30, 50]"
            stripedRows="false"
            [lazy]="true"
            (onLazyLoad)="NextPage($event)"
            [showGridlines]="true"
          >
            <ng-template #header>
              <tr>
                <th
                  pSortableColumn="Name"
                  class="bg-gray-100! text-[15px]! text-center! w-[30%]!"
                >
                  <div class="flex flex-row justify-center items-center gap-2">
                    <div>Supplier</div>
                    <p-sortIcon field="Name" />
                  </div>
                </th>
                <th class="bg-gray-100! text-center! text-[15px]! w-[15%]!">
                  Phone
                </th>
                <th class="bg-gray-100! text-center! text-[15px]! w-[15%]!">
                  Created On
                </th>
                <th class="bg-gray-100! text-center! text-[15px]! w-[20%]!">
                  Balance
                </th>

                <th class="bg-gray-100! text-center! text-[15px]! w-[10%]!">
                  Action
                </th>
              </tr>
            </ng-template>
            <ng-template #body let-data>
              <tr>
                <td class="text-center! text-[14px]! font-semibold!">
                  {{ data.name }}
                </td>
                <td class="text-center! text-[14px]!">
                  {{ data.contactNo }}
                </td>
                <td class="text-center! text-[14px]!">
                  {{ data.createdAt | date: 'dd MMM, yyyy' }}
                </td>
                <td class="text-center! text-[14px]!">
                  <span
                    [ngClass]="{
                      'text-red-600 font-semibold': (data.balance || 0) > 0,
                    }"
                  >
                    {{
                      data.balance
                        | currency: 'RM ' : 'symbol' : '1.2-2' : 'en-MY'
                    }}
                  </span>
                </td>
                <td class="text-center! text-[14px]!">
                  <div class="flex items-center justify-center">
                    <i
                      (click)="onEllipsisClick($event, data, menu)"
                      class="pi pi-ellipsis-h cursor-pointer"
                    ></i>
                  </div>
                </td>
              </tr>
            </ng-template>
            <ng-template #emptymessage>
              <tr>
                <td colspan="100%" class="border-x!">
                  <div class="text-[15px] text-center text-gray-500">
                    No supplier found in records.
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
      closable="true"
      (onHide)="visible = false"
      styleClass="!relative !border-0 !bg-white w-[50%]"
    >
      <ng-template #header>
        <div class="font-semibold text-[20px]">{{ title }}</div>
      </ng-template>
      <div [formGroup]="FG" class="grid grid-cols-12 gap-3 text-[15px]">
        <div class="col-span-12 flex flex-col gap-1">
          <div>Name</div>
          <div class="flex flex-row w-full">
            <div
              class="p-2 flex items-center justify-center bg-gray-100 rounded-l-lg border border-gray-300"
            >
              <i class="pi pi-briefcase text-gray-500!"></i>
            </div>
            <input
              type="text"
              pInputText
              class="rounded-l-none! border-l-none! w-full! text-[15px]!"
              formControlName="name"
            />
          </div>
        </div>
        <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
          <div>Email</div>
          <div class="flex flex-row w-full">
            <div
              class="p-2 flex items-center justify-center bg-gray-100 rounded-l-lg border border-gray-300"
            >
              <i class="pi pi-envelope text-gray-500!"></i>
            </div>
            <input
              type="text"
              pInputText
              class="rounded-l-none! border-l-none! w-full! text-[15px]!"
              formControlName="email"
            />
          </div>
        </div>
        <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
          <div>Contact Number</div>
          <div class="flex flex-row w-full">
            <div
              class="p-2 flex items-center justify-center bg-gray-100 rounded-l-lg border border-gray-300"
            >
              <i class="pi pi-phone text-gray-500!"></i>
            </div>
            <input
              type="text"
              pInputText
              class="rounded-l-none! border-l-none! w-full! text-[15px]!"
              formControlName="contactNo"
            />
          </div>
        </div>
        <div class="col-span-12 flex flex-col gap-1">
          <div>Balance</div>
          <div class="flex flex-row w-full">
            <div
              class="p-2 flex items-center justify-center bg-gray-100 rounded-l-lg border border-gray-300"
            >
              <i class="pi pi-money-bill text-gray-500!"></i>
            </div>
            <p-inputnumber
              inputStyleClass="w-full! text-[15px]! rounded-l-none!"
              styleClass="w-full!"
              formControlName="balance"
              appendTo="body"
              mode="currency"
              currency="MYR"
              locale="en-MY"
              [useGrouping]="true"
              [minFractionDigits]="2"
              [maxFractionDigits]="2"
            ></p-inputnumber>
          </div>
        </div>
      </div>
      <div class="border-b border-gray-200 mt-3 mb-3"></div>
      <div class="flex flex-row items-center justify-end gap-2 w-full">
        <p-button
          (onClick)="visible = false"
          label="Cancel"
          severity="secondary"
          styleClass="w-full py-1.5! px-5! border-gray-200!"
        >
        </p-button>

        <p-button
          (onClick)="Submit()"
          [label]="isUpdate ? 'Save Changes' : 'Save'"
          severity="info"
          styleClass="w-full py-1.5! px-5!"
        >
        </p-button>
      </div>
    </p-dialog>`,
  styleUrl: './supplier.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Supplier implements OnDestroy {
  @ViewChild('fTable') fTable?: Table;

  private readonly loadingService = inject(LoadingService);
  private readonly messageService = inject(MessageService);
  private readonly companyService = inject(CompanyService);
  private readonly cdr = inject(ChangeDetectorRef);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  PagingSignal = signal<PagingContent<CompanyDto>>(
    {} as PagingContent<CompanyDto>,
  );
  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  visible: boolean = false;
  isUpdate: boolean = false;

  search: string = '';
  title: string = 'Add New Supplier';
  FG!: FormGroup;
  menuItems: MenuItem[] = [];

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 10;
    this.Query.OrderBy = `Name desc`;
    this.Query.Filter = null;
    this.Query.Select = null;
    this.Query.Includes = null;
  }

  GetData() {
    this.loadingService.start();
    this.companyService
      .GetMany(this.Query)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.PagingSignal.set(res);
          this.cdr.markForCheck();
          this.loadingService.stop();
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.message,
          });
          this.loadingService.stop();
        },
      });
  }

  NextPage(event: TableLazyLoadEvent) {
    if ((event?.first || event?.first === 0) && event?.rows) {
      this.Query.Page = event.first / event.rows + 1 || 1;
      this.Query.PageSize = event.rows;
    }

    const sortText = BuildFilterText(event);
    this.Query.OrderBy = sortText ? sortText : `Name desc`;

    this.Query.Filter = BuildFilterText(event);
    this.GetData();
  }

  onKeyDown(event: KeyboardEvent) {
    const isEnter = event.key === 'Enter';
    const isBackspaceClear =
      event.key === 'Backspace' && this.search.length === 0;

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

  ActionClick(data: CompanyDto | null, action: string) {
    this.FG = new FormGroup({
      id: new FormControl<string | null>({ value: null, disabled: true }),
      name: new FormControl<string | null>(null, Validators.required),
      email: new FormControl<string | null>(null, [Validators.email]),
      contactNo: new FormControl<string | null>(null, Validators.required),
      balance: new FormControl<string | null>(null),
    });

    if (action === 'Update' && data) {
      this.isUpdate = true;
      this.title = 'Update Supplier';
      this.FG.get('id')?.enable();
      this.FG.patchValue(data);
    } else {
      this.isUpdate = false;
      this.title = 'Add New Supplier';
      this.FG.reset();
    }
    this.visible = true;
  }

  Submit() {
    ValidateAllFormFields(this.FG);

    if (!this.FG.valid) return;

    this.loadingService.start();
    const request$ = this.isUpdate
      ? this.companyService.Update(this.FG.value)
      : this.companyService.Create(this.FG.value);

    request$.pipe(takeUntil(this.ngUnsubscribe)).subscribe({
      next: (res) => {
        // Update local data if needed
        if (this.isUpdate) {
          const index = this.PagingSignal().data.findIndex(
            (x) => x.id === this.FG.get('id')?.value,
          );
          if (index > -1) {
            this.PagingSignal().data[index] = { ...res };
          }
        } else {
          // For create, you can push new record to your list
          this.PagingSignal().data.push(res);
        }

        this.loadingService.stop();
        this.visible = false;
        this.cdr.markForCheck();
        this.messageService.add({
          severity: 'success',
          summary: this.isUpdate ? 'Updated' : 'Created',
          detail: this.isUpdate
            ? 'Client updated successfully.'
            : 'Client created successfully.',
        });

        // Optionally reset the form after creation
        if (!this.isUpdate) this.FG.reset();
      },
      error: (err) => {
        this.loadingService.stop();
        this.messageService.add({
          severity: 'error',
          summary: this.isUpdate ? 'Update Failed' : 'Creation Failed',
          detail: err?.error?.message || 'Something went wrong',
        });
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
    ];
    menu.toggle(event);
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
