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
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { LoadingService } from '../../services/loading.service';
import { PaymentService } from '../../services/paymentService.service';
import { MenuItem, MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import {
  BuildFilterText,
  BuildSortText,
  GridifyQueryExtend,
  PagingContent,
  ValidateAllFormFields,
} from '../../shared/helpers/helpers';
import { PaymentDto } from '../../models/Payments';
import { RouterLink } from '@angular/router';
import { DatePickerModule } from 'primeng/datepicker';
import { MenuModule } from 'primeng/menu';

@Component({
  selector: 'app-payments',
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
  template: `<div class="w-full min-h-[92.9vh] flex flex-col p-5">
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
        <div class="text-gray-700 font-semibold">Payments</div>
      </div>
      <div
        class="mt-3 border border-gray-200 rounded-md tracking-wide bg-white p-5 flex flex-col"
      >
        <div class="flex flex-row items-center justify-between">
          <div class="flex flex-col">
            <div class="text-[20px] text-gray-700 font-semibold">Payments</div>
            <div class="text-gray-500 text-[15px]">
              Manage and oversee all project payments
            </div>
          </div>
          <div class="flex flex-row items-center gap-2">
            <div class="min-w-[300px] relative">
              <input
                type="text"
                pInputText
                [(ngModel)]="search"
                class="w-full! text-[15px]!"
                placeholder="Search by payment no"
                (keyup)="onKeyDown($event)"
              />
              <i
                class="pi pi-search absolute! top-3! right-2! text-gray-500!"
              ></i>
            </div>
            <p-button
              label="Add New Payment"
              (onClick)="ActionClick(null, 'add')"
              icon="pi pi-plus-circle"
              severity="info"
              size="small"
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
            stripedRows="false"
            [lazy]="true"
            [showGridlines]="true"
            (onLazyLoad)="NextPage($event)"
          >
            <ng-template #header>
              <tr>
                <th class="bg-gray-100! text-[15px]! text-center! w-[30%]!">
                  Client/Vendor
                </th>
                <th class="bg-gray-100! text-[15px]! text-center! w-[10%]">
                  Payment No
                </th>
                <th class="bg-gray-100! text-[15px]! text-center! w-[15%]">
                  Paid Date
                </th>
                <th class="bg-gray-100! text-[15px]! text-center! w-[15%]">
                  Amount
                </th>
                <th class="bg-gray-100! text-[15px]! text-center! w-[15%]">
                  Payment Method
                </th>

                <th class="bg-gray-100! text-[15px]! text-center! w-[10%]">
                  Action
                </th>
              </tr>
            </ng-template>
            <ng-template #body let-data>
              <tr>
                <td class="text-[14px]! text-center! font-semibold!">
                  {{ data.client?.name ?? data.supplier?.name }}
                </td>
                <td class="text-center! text-[14px]!">
                  {{ data.paymentNo }}
                </td>
                <td class="text-center! text-[14px]!">
                  {{ data.paymentDate | date }}
                </td>
                <td class="text-center! text-[14px]!">
                  {{ data.amount | currency: 'RM ' }}
                </td>

                <td class="text-center! text-[14px]!">
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
              </tr>
            </ng-template>
            <ng-template #emptymessage>
              <tr>
                <td colspan="100%" class="border-x!">
                  <div class="text-[15px] text-center text-gray-500">
                    No project found in records.
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
      styleClass="!relative !border-0 !bg-white overflow-y-auto! w-[90%] lg:w-[70%] xl:w-[50%]"
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
              <div>Payment No <span class="text-red-500">*</span></div>
              <input
                type="text"
                pInputText
                class="w-full! text-[15px]!"
                formControlName="paymentNo"
              />
            </div>

            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
              <div>Client</div>
              <p-select
                [options]="clients || []"
                appendTo="body"
                styleClass="text-[15px]!"
                inputStyleClass="text-[15px]!"
                panelStyleClass="text-[15px]!"
                formControlName="clientId"
                [showClear]="FG.get('clientId')?.value"
                [filter]="true"
              ></p-select>
            </div>

            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
              <div>Invoice No</div>
              <p-select
                [options]="clients || []"
                appendTo="body"
                styleClass="text-[15px]!"
                inputStyleClass="text-[15px]!"
                panelStyleClass="text-[15px]!"
                formControlName="invoiceId"
                [showClear]="FG.get('invoiceId')?.value"
                [filter]="true"
              ></p-select>
            </div>

            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
              <div>Reference No <span class="text-red-500">*</span></div>
              <input
                type="text"
                pInputText
                class="w-full! text-[15px]!"
                formControlName="referenceNo"
              />
            </div>

            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
              <div>Payment Date <span class="text-red-500">*</span></div>
              <p-datepicker
                appendTo="body"
                dateFormat="dd/mm/yy"
                [showIcon]="true"
                styleClass="w-full"
                inputStyleClass="w-full! text-[15px]!"
                formControlName="paymentDate"
              ></p-datepicker>
            </div>

            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
              <div>Payment Mode <span class="text-red-500">*</span></div>
              <p-select
                appendTo="body"
                styleClass="w-full"
                inputStyleClass="w-full! text-[15px]!"
                formControlName="paymentMode"
                [options]="[
                  { label: 'Cash', value: 'Cash' },
                  { label: 'Cheque', value: 'Cheque' },
                  { label: 'Bank Transfer', value: 'Bank Transfer' },
                  { label: 'Paypal', value: 'Paypal' },
                ]"
              ></p-select>
            </div>

            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
              <div>Amount <span class="text-red-500">*</span></div>
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

            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
              <div>Paid Amount <span class="text-red-500">*</span></div>
              <p-inputnumber
                appendTo="body"
                styleClass="w-full"
                inputStyleClass="w-full !text-[15px]"
                formControlName="paidAmount"
                mode="currency"
                currency="MYR"
                locale="en-MY"
                [useGrouping]="true"
                [minFractionDigits]="2"
                [maxFractionDigits]="2"
              >
              </p-inputnumber>
            </div>

            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
              <div>Due Amount <span class="text-red-500">*</span></div>
              <p-inputnumber
                appendTo="body"
                styleClass="w-full"
                inputStyleClass="w-full !text-[15px]"
                formControlName="dueAmount"
                mode="currency"
                currency="MYR"
                locale="en-MY"
                [useGrouping]="true"
                [minFractionDigits]="2"
                [maxFractionDigits]="2"
              >
              </p-inputnumber>
            </div>

            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
              <div>Notes</div>
              <input
                type="text"
                pInputText
                class="w-full"
                formControlName="notes"
              />
            </div>

            <div class="col-span-12 flex flex-col gap-1">
              <div>Attachment <span class="text-red-500">*</span></div>
              <div
                class="p-5 bg-gray-100 border-2 rounded-lg border-gray-300 border-dashed flex flex-col items-center justify-center"
              >
                <div
                  class="w-20 h-20 border"
                  *ngIf="FG.get('attachment')?.value"
                >
                  <img
                    [src]="FG.get('attachment')?.value"
                    alt=""
                    class="w-full h-full object-cover"
                  />
                </div>
                <div
                  class="pi pi-cloud-upload text-gray-400! text-3xl!"
                  *ngIf="!FG.get('attachment')?.value"
                ></div>
                <div class="text-gray-500 text-[14px] mt-2 tracking-wide">
                  Drop your attachment here or
                  <a
                    class="text-blue-500 hover:underline cursor-pointer"
                    (click)="fileInput.click()"
                    >Browse</a
                  >
                </div>
              </div>

              <input
                type="file"
                #fileInput
                style="display: none"
                accept="image/*"
                (change)="onFileSelected($event)"
              />
            </div>
          </div>
          <div class="border-b border-gray-200 mt-3 mb-3"></div>
          <div class="flex flex-row justify-end items-center gap-2 w-full">
            <p-button
              (onClick)="visible = false"
              label="Cancel"
              severity="secondary"
              styleClass="px-7! text-[14px]! tracking-wide! py-1.5! border-gray-200!"
            >
            </p-button>

            <p-button
              (onClick)="Submit()"
              [label]="isUpdate ? 'Save Changes' : 'Create'"
              severity="info"
              styleClass="px-7! text-[14px]! tracking-wide! py-1.5!"
            >
            </p-button>
          </div>
        </div>
      </ng-template>
    </p-dialog> `,
  styleUrl: './payments.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Payments implements OnInit, OnDestroy {
  @ViewChild('fTable') fTable?: Table;

  private readonly loadingService = inject(LoadingService);
  private readonly paymentService = inject(PaymentService);
  private readonly messageService = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  PagingSignal = signal<PagingContent<PaymentDto>>(
    {} as PagingContent<PaymentDto>,
  );
  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  visible: boolean = false;
  isUpdate: boolean = false;

  search: string = '';
  title: string = 'Add New Payment';
  FG!: FormGroup;
  menuItems: MenuItem[] = [];

  clients: { label: string; value: string }[] = [];

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 10;
    this.Query.Filter = null;
    this.Query.OrderBy = `CreatedAt desc`;
    this.Query.Select = null;
    this.Query.Includes = 'Client,Supplier';
  }

  ngOnInit(): void {}

  GetData() {
    this.loadingService.start();
    this.paymentService
      .GetMany(this.Query)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.PagingSignal.set(res);
          this.cdr.markForCheck();
          this.loadingService.stop();
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
      PaymentNo: [
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

  ActionClick(data: PaymentDto | null, action: string) {
    this.FG = new FormGroup({
      id: new FormControl<string | null>({ value: null, disabled: true }),
      paymentNo: new FormControl<string | null>(null),
      clientId: new FormControl<string | null>(null, Validators.required),
      invoiceId: new FormControl<string | null>(null),
      referenceNo: new FormControl<string | null>(null),
      paymentDate: new FormControl<Date | null>(null, Validators.required),
      paymentMode: new FormControl<string | null>(null),
      amount: new FormControl<number | null>(null, Validators.required),
      paidAmount: new FormControl<number | null>(null),
      dueAmount: new FormControl<number | null>(null),
      notes: new FormControl<string | null>(null),
      attachment: new FormControl<string | null>(null),
    });

    if (action === 'Update') {
      this.isUpdate = true;
      this.title = 'Update Payment';
      this.FG.get('id')?.enable();

      if (data) this.FG.patchValue(data);
      if (data?.paymentDate)
        this.FG.get('paymentDate')?.patchValue(new Date(data.paymentDate));
      this.visible = true;
    } else if (action === 'Delete' && data) {
      this.loadingService.start();
      this.paymentService
        .Delete(data.id)
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe({
          next: (res) => {
            // Remove the deleted item from the current PagingSignal data
            const currentPaging = this.PagingSignal();
            const updatedData = currentPaging.data.filter(
              (item) => item.id !== data.id,
            );

            this.PagingSignal.set({
              ...currentPaging,
              data: updatedData,
              totalElements: currentPaging.totalElements - 1, // Update total count
            });
            this.cdr.markForCheck();
            this.messageService.add({
              severity: 'success',
              summary: 'Deleted',
              detail: `Payment: ${data.paymentNo} deleted`,
            });
          },
          error: (err) => {
            this.loadingService.stop();
          },
        });
    } else {
      this.title = 'Add New Payment';
      this.isUpdate = false;
      this.FG.reset();
      this.visible = true;
    }

    this.cdr.detectChanges();
  }

  Submit() {
    ValidateAllFormFields(this.FG);

    if (!this.FG.valid) return;

    this.loadingService.start();
    this.paymentService
      .Create(this.FG.value)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          if (this.isUpdate) {
            const index = this.PagingSignal().data.findIndex(
              (x) => x.id === this.FG.get('id')?.value,
            );

            if (index > -1) {
              this.PagingSignal().data[index] = { ...res };
            }
          } else {
            this.PagingSignal().data.push(res);
          }

          this.loadingService.stop();
          this.visible = false;
          this.cdr.markForCheck();
          this.messageService.add({
            severity: 'success',
            summary: this.isUpdate ? 'Updated' : 'Created',
            detail: `Payment: ${res.paymentNo} created successfully.`,
          });
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

    menu.toggle(event); // toggle the popup menu
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        const base64String = e.target.result;

        this.FG.patchValue({
          attachment: base64String,
        });

        this.cdr.markForCheck();
      };

      reader.readAsDataURL(file);
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
