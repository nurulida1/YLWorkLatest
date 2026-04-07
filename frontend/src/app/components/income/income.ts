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
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { SelectModule } from 'primeng/select';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { LoadingService } from '../../services/loading.service';
import { IncomeService } from '../../services/IncomeService';
import { MenuItem, MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import {
  BuildFilterText,
  BuildSortText,
  GridifyQueryExtend,
  PagingContent,
  ValidateAllFormFields,
} from '../../shared/helpers/helpers';
import { IncomeDto } from '../../models/Income';

@Component({
  selector: 'app-income',
  imports: [
    CommonModule,
    TableModule,
    ReactiveFormsModule,
    FormsModule,
    SelectModule,
    InputTextModule,
    InputNumberModule,
    ButtonModule,
    DialogModule,
    RouterLink,
    DatePickerModule,
    MenuModule,
  ],
  template: `<div class="w-full min-h-screen flex flex-col p-5">
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
        <div class="text-gray-700 font-semibold">Incomes</div>
      </div>
      <div
        class="mt-3 border border-gray-200 rounded-md tracking-wide bg-white p-5 flex flex-col"
      >
        <div class="flex flex-row items-center justify-between">
          <div class="flex flex-col">
            <div class="text-[20px] text-gray-700 font-semibold">Incomes</div>
            <div class="text-gray-500 text-[15px]">
              Manage and oversee all project incomes
            </div>
          </div>
          <div class="flex flex-row items-center gap-2">
            <div class="min-w-[300px] relative">
              <input
                type="text"
                pInputText
                [(ngModel)]="search"
                class="w-full! text-[15px]!"
                placeholder="Search by income no"
                (keyup)="onKeyDown($event)"
              />
              <i
                class="pi pi-search absolute! top-3! right-2! text-gray-500!"
              ></i>
            </div>
            <p-button
              label="Add New Income"
              size="small"
              (onClick)="ActionClick(null, 'Create')"
              icon="pi pi-plus-circle"
              severity="info"
              styleClass="py-2! whitespace-nowrap!"
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
            [lazy]="true"
            [showGridlines]="true"
            (onLazyLoad)="NextPage($event)"
          >
            <ng-template #header>
              <tr>
                <th class="bg-gray-100! text-[15px]! text-center! w-[15%]!">
                  Income No
                </th>
                <th class="bg-gray-100! text-[15px]! text-center! w-[15%]!">
                  Date
                </th>
                <th class="bg-gray-100! text-[15px]! text-center! w-[15%]!">
                  Reference No
                </th>
                <th class="bg-gray-100! text-[15px]! text-center! w-[25%]!">
                  Description
                </th>
                <th class="bg-gray-100! text-[15px]! text-center! w-[15%]!">
                  Amount
                </th>
                <th class="bg-gray-100! text-[15px]! text-center! w-[15%]!">
                  Payment Mode
                </th>
                <th
                  class="bg-gray-100! text-[15px]! text-center! w-[15%]!"
                ></th>
              </tr>
            </ng-template>
            <ng-template #body let-data>
              <td class="text-[14px]! text-center! font-semibold!">
                {{ data.incomeNo }}
              </td>
              <td class="text-[14px]! text-center!">
                {{ data.incomeDate | date }}
              </td>
              <td class="text-[14px]! text-center!">
                {{ data.referenceNo }}
              </td>
              <td class="text-[14px]! text-center!">
                {{ data.description }}
              </td>
              <td class="text-[14px]! text-center!">
                {{ data.amount | currency: 'RM ' }}
              </td>
              <td class="text-[14px]! text-center!">
                {{ data.paymentMode }}
              </td>
              <td class="text-center! text-[14px]!">
                <div class="flex items-center justify-center">
                  <i
                    (click)="onEllipsisClick($event, data, menu)"
                    class="pi pi-ellipsis-h cursor-pointer"
                  ></i>
                </div>
              </td>
            </ng-template>
            <ng-template #emptymessage>
              <tr>
                <td colspan="100%" class="border-x!">
                  <div class="text-[15px] text-center text-gray-500">
                    No income found in records.
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
      [closable]="false"
      (onHide)="visible = false"
      styleClass="relative! border-0! bg-white! overflow-y-auto! w-[90%] lg:w-[70%] xl:w-[50%]"
    >
      <ng-template #headless>
        <div class="flex flex-col p-5">
          <div class="font-semibold text-[20px]">{{ title }}</div>
          <div class="font-normal tracking-wide text-gray-500 text-[14px]">
            Fill in all required field.
          </div>
          <div class="border-b border-gray-200 w-full mt-2 mb-2"></div>
          <div
            [formGroup]="FG"
            class="mt-3 grid grid-cols-12 gap-3 text-[15px]"
          >
            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
              <div>Income No <span class="text-red-500">*</span></div>
              <input
                type="text"
                pInputText
                class="w-full text-[15px]!"
                formControlName="incomeNo"
              />
            </div>
            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
              <div>Reference No</div>
              <input
                type="text"
                pInputText
                class="w-full text-[15px]!"
                formControlName="referenceNo"
              />
            </div>
            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
              <div>Amount</div>
              <p-inputnumber
                appendTo="body"
                styleClass="w-full"
                inputStyleClass="w-full !text-[15px]"
                formControlName="amount"
                mode="currency"
                currency="MYR"
                locale="en-MY"
                [useGrouping]="true"
                [minFractionDigits]="2"
                [maxFractionDigits]="2"
              >
              </p-inputnumber>
            </div>
          </div>
        </div>
      </ng-template>
    </p-dialog>`,
  styleUrl: './income.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Income implements OnInit, OnDestroy {
  @ViewChild('fTable') fTable?: Table;

  private readonly loadingService = inject(LoadingService);
  private readonly incomeService = inject(IncomeService);
  private readonly messageService = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  PagingSignal = signal<PagingContent<IncomeDto>>(
    {} as PagingContent<IncomeDto>,
  );
  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  visible: boolean = false;
  search: string = '';
  title: string = 'Add New Income';
  FG!: FormGroup;
  menuItems: MenuItem[] = [];

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 10;
    this.Query.Filter = null;
    this.Query.OrderBy = 'CreatedAt desc';
    this.Query.Select = null;
    this.Query.Includes = null;
  }

  ngOnInit(): void {}

  GetData() {
    this.loadingService.start();
    this.incomeService
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
    this.Query.OrderBy = sortText ? sortText : `CreatedAt desc`;

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
      IncomeNo: [
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

  ActionClick(data: IncomeDto | null, action: string) {
    this.initForm();

    if (action === 'Create') {
      this.title = 'Add New Income';
      this.FG.reset();
      this.visible = true;
      this.cdr.detectChanges();
    }
  }

  initForm() {
    this.FG = new FormGroup({
      id: new FormControl<string | null>({ value: null, disabled: true }),
      incomeNo: new FormControl<string | null>(null),
      referenceNo: new FormControl<string | null>(null),
      amount: new FormControl<number | null>(null, Validators.required),
      incomeDate: new FormControl<Date | null>(new Date()),
      paymentMode: new FormControl<string | null>(null),
      description: new FormControl<string | null>(null),
    });
  }

  Submit() {
    ValidateAllFormFields(this.FG);

    if (!this.FG.valid) return;

    this.loadingService.start();
    this.incomeService
      .Create(this.FG.value)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();
          this.PagingSignal().data.push(res);
          this.visible = false;
          this.cdr.markForCheck();
          this.messageService.add({
            severity: 'success',
            summary: 'Successfully Created',
            detail: `Income: ${res.incomeNo} created successfully.`,
          });
          this.FG.reset();
        },
        error: (err) => {
          this.loadingService.stop();
          this.messageService.add({
            severity: 'error',
            summary: 'Creation Failed',
            detail: err?.error?.message || 'Something went wrong',
          });
        },
      });
  }

  onEllipsisClick(event: any, data: IncomeDto, menu: any) {
    this.menuItems = [
      {
        label: 'Delete',
        icon: 'pi pi-trash',
        command: () => this.ActionClick(data, 'Delete'),
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
