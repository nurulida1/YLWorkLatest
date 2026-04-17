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
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { SelectModule } from 'primeng/select';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { LoadingService } from '../../services/loading.service';
import { PaymentService } from '../../services/paymentService.service';
import { MenuItem, MessageService } from 'primeng/api';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import {
  BuildFilterText,
  GridifyQueryExtend,
  PagingContent,
  ValidateAllFormFields,
} from '../../shared/helpers/helpers';
import { PaymentDto } from '../../models/Payments';
import { InvoiceService } from '../../services/invoiceService.service';
import { CompanyService } from '../../services/companyService';

@Component({
  selector: 'app-supplier-payment',
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
          [routerLink]="'/dashboard'"
          class="cursor-pointer hover:text-gray-600"
        >
          Dashboard
        </div>
        /
        <div class="text-gray-700 font-semibold">Supplier Payments</div>
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
            [showGridlines]="true"
            [lazy]="true"
            (onLazyLoad)="NextPage($event)"
          >
            <ng-template #header>
              <tr>
                <th class="bg-gray-100! text-[15px]! text-center! w-[20%]!">
                  Supplier
                </th>
                <th class="bg-gray-100! text-[15px]! text-center! w-[15%]">
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
                  {{ data.supplier?.name }} {{ data.clientId }}
                </td>
                <td class="text-center! text-[14px]!">
                  {{ data.paymentNo }}
                </td>
                <td class="text-center! text-[14px]!">
                  {{ data.paymentDate | date }}
                </td>
                <td class="text-center! text-[14px]!">
                  {{
                    data.amount | currency: 'RM ' : 'symbol-narrow' : '1.2-2'
                  }}
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
              <div>Reference No <span class="text-red-500">*</span></div>
              <input
                type="text"
                pInputText
                class="w-full! text-[15px]!"
                formControlName="referenceNo"
              />
            </div>
            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
              <div>Supplier</div>
              <p-select
                [options]="suppliers || []"
                appendTo="body"
                styleClass="text-[15px]!"
                inputStyleClass="text-[15px]!"
                panelStyleClass="text-[15px]!"
                formControlName="supplierId"
                [showClear]="FG.get('supplierId')?.value"
                (onChange)="SupplierOnChange($event.value)"
                [filter]="true"
              ></p-select>
            </div>

            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
              <div>Invoice</div>
              <p-select
                [options]="invoices || []"
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
              <div>Payment Amount<span class="text-red-500">*</span></div>
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
                inputStyleClass="w-full !text-[15px] bg-gray-200! text-gray-500!"
                formControlName="paidAmount"
                mode="currency"
                currency="MYR"
                locale="en-MY"
                [useGrouping]="true"
                [minFractionDigits]="2"
                [maxFractionDigits]="2"
                [readonly]="true"
              >
              </p-inputnumber>
            </div>

            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
              <div>Outstanding Balance <span class="text-red-500">*</span></div>
              <p-inputnumber
                appendTo="body"
                styleClass="w-full"
                inputStyleClass="w-full !text-[15px] bg-gray-200! text-gray-500!"
                formControlName="dueAmount"
                mode="currency"
                currency="MYR"
                locale="en-MY"
                [useGrouping]="true"
                [minFractionDigits]="2"
                [maxFractionDigits]="2"
                [readonly]="true"
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
                class="p-5 bg-gray-100 border-2 rounded-lg border-gray-300 border-dashed flex flex-col items-center justify-center relative"
              >
                <ng-container *ngIf="FG.get('attachment')?.value as fileData">
                  <div
                    class="w-20 h-20 mb-2"
                    *ngIf="fileData.startsWith('data:image/')"
                  >
                    <img
                      [src]="fileData"
                      class="w-full h-full object-cover rounded border border-gray-200"
                    />
                  </div>

                  <div
                    class="flex flex-col items-center gap-2 mb-2"
                    *ngIf="!fileData.startsWith('data:image/')"
                  >
                    <i class="pi pi-file-pdf text-red-500 text-4xl"></i>
                    <span class="text-[12px] text-gray-500">Document File</span>
                  </div>

                  <div class="absolute top-2 right-2 flex gap-2">
                    <i
                      (click)="downloadFile()"
                      title="Download"
                      class="pi pi-download text-gray-400 hover:text-blue-500 cursor-pointer text-xl"
                    >
                    </i>

                    <i
                      (click)="FG.get('attachment')?.reset()"
                      title="Remove"
                      class="pi pi-times-circle text-gray-400 hover:text-red-500 cursor-pointer text-xl"
                    >
                    </i>
                  </div>
                </ng-container>

                <div
                  class="flex flex-col items-center"
                  *ngIf="!FG.get('attachment')?.value"
                >
                  <div
                    class="pi pi-cloud-upload text-gray-400! text-3xl!"
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

                <div *ngIf="FG.get('attachment')?.value" class="mt-2">
                  <a
                    class="text-blue-500 text-[13px] hover:underline cursor-pointer"
                    (click)="fileInput.click()"
                    >Replace File</a
                  >
                </div>
              </div>

              <input
                type="file"
                #fileInput
                style="display: none"
                accept="image/*,.pdf"
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
  styleUrl: './supplier-payment.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupplierPayment implements OnInit, OnDestroy {
  @ViewChild('fTable') fTable?: any;

  private readonly loadingService = inject(LoadingService);
  private readonly paymentService = inject(PaymentService);
  private readonly companyService = inject(CompanyService);
  private readonly invoiceService = inject(InvoiceService);
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

  suppliers: { label: string; value: string; balance: number }[] = [];
  invoices: {
    label: string;
    value: string;
    totalAmount: number;
    balance: number;
  }[] = [];

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 10;
    this.Query.Filter = `SupplierId!=null`;
    this.Query.OrderBy = `CreatedAt desc`;
    this.Query.Select = null;
    this.Query.Includes = 'Supplier';
  }

  ngOnInit(): void {
    this.getDropdown();
    this.initForm();

    this.FG.get('paidAmount')?.valueChanges.subscribe((value) => {
      const amount = this.FG.get('amount')?.value ?? 0;
      const paid = value ?? 0;

      const remaining = amount - paid;

      this.FG.patchValue(
        {
          dueAmount: remaining >= 0 ? remaining : 0,
        },
        { emitEvent: false },
      );
    });
  }

  getDropdown() {
    this.loadingService.start();

    forkJoin({
      suppliers: this.companyService.GetMany({
        Page: 1,
        PageSize: 10000,
        Filter: null,
        OrderBy: null,
        Select: null,
        Includes: null,
      }),
      invoices: this.invoiceService.GetMany({
        Page: 1,
        PageSize: 10000,
        Filter: `Status=Unpaid|Status=PartiallyPaid`,
        OrderBy: null,
        Select: null,
        Includes: null,
      }),
    }).subscribe({
      next: ({ suppliers, invoices }) => {
        this.suppliers = (suppliers?.data || []).map((s) => ({
          label: s?.name ?? 'Unknown Supplier',
          value: s?.id,
          balance: s?.balancePayment ?? 0,
        }));

        this.invoices = (invoices?.data || []).map((i) => ({
          label: i.invoiceNo,
          value: i.id,
          totalAmount: i.totalAmount ?? 0,
          paidAmount: i.paidAmount ?? 0,
          balance: (i.totalAmount ?? 0) - (i.paidAmount ?? 0),
        }));

        this.loadingService.stop();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.message || 'An error occurred while fetching data.',
        });
        this.loadingService.stop();
      },
    });
  }

  initForm() {
    this.FG = new FormGroup({
      id: new FormControl<string | null>({ value: null, disabled: true }),
      paymentNo: new FormControl<string | null>(null),
      supplierId: new FormControl<string | null>(null),
      invoiceId: new FormControl<string | null>(null),
      referenceNo: new FormControl<string | null>(null),
      paymentDate: new FormControl<Date | null>(null),
      paymentMode: new FormControl<string | null>(null),
      amount: new FormControl<number | null>(null),
      paidAmount: new FormControl<number | null>(null),
      dueAmount: new FormControl<number | null>(null),
      notes: new FormControl<string | null>(null),
      attachment: new FormControl<string | null>(null),
    });
  }

  GetData() {
    this.loadingService.start();
    this.paymentService.GetMany(this.Query).subscribe({
      next: (res) => {
        this.PagingSignal.set(res);
        this.cdr.markForCheck();
        this.loadingService.stop();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.message || 'An error occurred while fetching data.',
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
    this.Query.OrderBy = sortText ? sortText : `CreatedAt desc`;

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
    if (action === 'Update') {
      this.isUpdate = true;
      this.title = 'Update Payment';
      this.FG.get('id')?.enable();

      if (data) {
        this.FG.patchValue({
          ...data,
          paymentDate: new Date(data.paymentDate),
        });
      }
    } else {
      this.title = 'Add New Payment';
      this.isUpdate = false;
      this.FG.reset();
    }

    this.visible = true;
    this.cdr.detectChanges();
  }

  InvoiceOnChange(event: any) {
    const invoice = this.invoices.find((i) => i.value === event);
    if (!invoice) return;

    this.FG.patchValue({
      amount: invoice.totalAmount,
      dueAmount: invoice.balance,
    });

    this.cdr.markForCheck();
  }

  SupplierOnChange(event: any) {
    const balance = this.suppliers.find((s) => s.value === event)?.balance || 0;
    this.FG.patchValue({
      ...this.FG.value,
      dueAmount: balance,
    });
    this.cdr.markForCheck();
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
          this.loadingService.stop();

          this.visible = false;
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
          if (!this.isUpdate) this.FG.reset();
          this.cdr.markForCheck();
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Payment created successfully.',
          });
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.message || 'An error occurred while creating payment.',
          });
          this.loadingService.stop();
        },
      });
  }

  onEllipsisClick(event: any, data: PaymentDto, menu: any) {
    this.menuItems = [
      {
        label: 'Edit',
        icon: 'pi pi-pencil',
        command: () => {
          this.ActionClick(data, 'Update');
        },
      },
    ];

    menu.toggle(event);
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        const base64String = e.target.result;

        this.FG.patchValue({
          ...this.FG.value,
          attachment: base64String,
        });

        this.cdr.markForCheck();
      };
      reader.readAsDataURL(file);
    }
  }

  downloadFile() {
    const base64Data = this.FG.get('attachment')?.value;
    if (!base64Data) return;

    // Identify extension (e.g., image/png -> png, application/pdf -> pdf)
    const extension = base64Data.split(';')[0].split('/')[1] || 'file';
    const fileName = `attachment_${new Date().getTime()}.${extension}`;

    const link = document.createElement('a');
    link.href = base64Data;
    link.download = fileName;
    link.click();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
