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
  FormArray,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { InvoiceService } from '../../../services/invoiceService.service';
import { MenuItem, MessageService } from 'primeng/api';
import { LoadingService } from '../../../services/loading.service';
import { Subject, takeUntil } from 'rxjs';
import {
  BuildFilterText,
  BuildSortText,
  GridifyQueryExtend,
  PagingContent,
  ValidateAllFormFields,
} from '../../../shared/helpers/helpers';
import { InvoiceDto } from '../../../models/Invoice';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-purchase-invoice',
  imports: [
    CommonModule,
    ButtonModule,
    InputTextModule,
    FormsModule,
    RouterLink,
    MenuModule,
    TableModule,
    ReactiveFormsModule,
    SelectModule,
    InputNumberModule,
    DatePickerModule,
    DialogModule,
  ],
  template: `<div class="w-full min-h-[92.9vh] flex flex-col p-5">
      <div class="flex flex-row items-center gap-1 text-gray-500 tracking-wide">
        <div
          [routerLink]="'/dashboard'"
          class="cursor-pointer hover:text-gray-600"
        >
          Dashboard
        </div>
        /
        <div class="text-gray-700 font-semibold">Purchase Invoice</div>
      </div>
      <div
        class="mt-3 border border-gray-200 rounded-md tracking-wide bg-white p-5 flex flex-col"
      >
        <div
          class="flex flex-col gap-3 xl:gap-0 xl:flex-row xl:items-center justify-between"
        >
          <div class="flex flex-col">
            <div class="text-[18px] text-gray-700 font-semibold">
              Purchase Invoices
            </div>
            <div class="text-gray-500">
              Manage your purchase invoice with ease and efficiency
            </div>
          </div>
          <div class="flex flex-row items-center gap-2">
            <div class="w-full xl:min-w-[300px] relative">
              <input
                type="text"
                pInputText
                [(ngModel)]="search"
                class="w-full!"
                placeholder="Search by Invoice No"
                (keydown)="onKeyDown($event)"
              />
              <i
                class="pi pi-search absolute! top-3! right-2! text-gray-500!"
              ></i>
            </div>
            <p-button
              label="Record Purchase Invoice"
              (onClick)="OpenFormDialog()"
              icon="pi pi-plus-circle"
              styleClass="bg-sky-600! border-none! py-2! whitespace-nowrap!"
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
            [showGridlines]="true"
            [rowsPerPageOptions]="[10, 20, 30, 50]"
            [lazy]="true"
            (onLazyLoad)="NextPage($event)"
          >
            <ng-template #header>
              <tr>
                <!-- <th class="w-[5%]! bg-gray-100!"></th> -->

                <th
                  pSortableColumn="InvoiceNo"
                  class="bg-gray-100! text-center! w-[10%]!"
                >
                  <div class="flex flex-row justify-center items-center gap-2">
                    <div>Invoice No</div>
                    <p-sortIcon field="InvoiceNo" />
                  </div>
                </th>
                <th class="bg-gray-100! w-[20%]">Supplier</th>

                <th
                  pSortableColumn="InvoiceDate"
                  class="bg-gray-100! w-[10%] text-center!"
                >
                  <div class="flex flex-row justify-center items-center gap-2">
                    <div>Invoice Date</div>
                    <p-sortIcon field="InvoiceDate" />
                  </div>
                </th>

                <th class="bg-gray-100! text-center! w-[15%]">Total Amount</th>
                <th class="bg-gray-100! text-center! w-[10%]">Due Date</th>

                <th
                  pSortableColumn="Status"
                  class="bg-gray-100! text-center! w-[10%]!"
                >
                  <div class="flex flex-row justify-center items-center gap-2">
                    <div>Status</div>
                    <p-sortIcon field="Status" />
                  </div>
                </th>
                <th class="bg-gray-100! text-center! w-[10%]">Action</th>
              </tr>
            </ng-template>
            <ng-template
              #body
              let-data
              let-rowIndex="rowIndex"
              let-expanded="expanded"
            >
              <tr>
                <!-- <td>
                  <div
                    class="flex items-center justify-center cursor-pointer"
                    (click)="fTable.toggleRow(data)"
                  >
                    <i
                      [class]="
                        expanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'
                      "
                    ></i>
                  </div>
                </td> -->
                <td class="text-center! font-semibold!">
                  {{ data.invoiceNo }}
                </td>
                <td>{{ data.supplier?.name }}</td>
                <td class="text-center!">
                  {{ data.invoiceDate | date: 'dd/MM/yyyy' }}
                </td>
                <td class="text-center!">
                  {{ data.totalAmount | currency: 'RM ' }}
                </td>
                <td class="text-center!">
                  {{ data.dueDate | date: 'dd/MM/yyyy' }}
                </td>
                <td class="text-center!">
                  <div class="flex justify-center">
                    <div
                      class="rounded-full px-6 text-[13px] py-0.5 font-medium w-fit whitespace-nowrap"
                      [ngClass]="{
                        'bg-blue-100 text-blue-700': data.status === 'Received',

                        'bg-indigo-100 text-indigo-700':
                          data.status === 'Verified',

                        'bg-amber-100 text-amber-700':
                          data.status === 'PartiallyPaid',

                        'bg-green-100 text-green-700': data.status === 'Paid',

                        'bg-red-100 text-red-700': data.status === 'Overdue',

                        'bg-orange-100 text-orange-700':
                          data.status === 'Disputed' || data.status === 'Draft',

                        'bg-gray-200 text-gray-600':
                          data.status === 'Cancelled',
                      }"
                    >
                      {{ data.status }}
                    </div>
                  </div>
                </td>

                <td class="text-center!">
                  <div class="flex items-center justify-center">
                    <i
                      (click)="onEllipsisClick($event, data, menu)"
                      class="pi pi-ellipsis-h cursor-pointer"
                    ></i>
                  </div>
                </td>
              </tr>
            </ng-template>
            <!-- <ng-template #expandedrow let-item>
              <tr>
                <td colspan="100%">
                  <div class="px-5">
                    <p-timeline
                      [value]="item.timeline"
                      align="top"
                      layout="horizontal"
                      class="customized-timeline w-full"
                    >
                      <ng-template #marker let-event>
                        <div
                          class="w-6 h-6 p-2 flex items-center justify-center rounded-full shadow-sm text-white"
                          [ngClass]="
                            event.actionAt ? event.color : 'bg-gray-300'
                          "
                        >
                          <i
                            class="pi text-xs"
                            [ngClass]="
                              event.verified ? 'pi-check' : 'pi-circle-fill'
                            "
                          ></i>
                        </div>
                      </ng-template>

                      <ng-template #content let-event>
                        <div class="flex flex-col min-h-[70px]">
                          <div class="font-semibold text-sm">
                            {{ event.status }}
                          </div>

                          <small
                            class="text-gray-500 text-xs whitespace-nowrap"
                            *ngIf="event.actionUser"
                          >
                            {{ event.actionUser }}
                          </small>

                          <small
                            class="text-gray-400 text-xs whitespace-nowrap"
                            *ngIf="event.actionAt"
                          >
                            {{ event.actionAt | date: 'dd MMM, yyyy HH:mm aa' }}
                          </small>
                        </div>
                      </ng-template>
                    </p-timeline>
                  </div>
                </td>
              </tr>
            </ng-template> -->
            <ng-template #emptymessage>
              <tr>
                <td colspan="100%" class="border-x!">
                  <div class="text-center text-gray-500">
                    No purchase invoices found in records.
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
      [(visible)]="showRecordDialog"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      styleClass="preview-dialog rounded-xl! overflow-hidden w-[90%]! lg:w-[60%]!"
      [maskStyle]="{ 'overflow-y': 'auto' }"
      appendTo="body"
    >
      <ng-template #headless>
        <div class="bg-gray-50 p-6 border-b border-gray-100 flex-none">
          <div class="flex justify-between items-start">
            <div>
              <h1 class="text-xl font-bold text-gray-800">
                Record Purchase Invoice
              </h1>
              <p class="text-sm text-gray-500 mt-1">
                Enter and verify supplier invoice details for accurate tracking
                and payment processing.
              </p>
            </div>
            <p-button
              icon="pi pi-times"
              [rounded]="true"
              [text]="true"
              severity="secondary"
              (onClick)="showRecordDialog = false"
            ></p-button>
          </div>
        </div>
        <div class="p-6 flex-1 overflow-y-auto">
          <div [formGroup]="FG" class="grid grid-cols-12 gap-4">
            <div class="col-span-12 flex flex-col gap-1">
              <div>Invoice No <span class="text-red-500">*</span></div>
              <input
                type="text"
                pInputText
                class="w-full"
                formControlName="invoiceNo"
              />
            </div>
            <div class="col-span-12 md:col-span-6 flex flex-col gap-1">
              <div>Supplier</div>
              <p-select
                [options]="companySelection"
                appendTo="body"
                [filter]="true"
                formControlName="supplierId"
                [showClear]="FG.get('supplierId')?.value"
              ></p-select>
            </div>
            <div class="col-span-12 md:col-span-6 flex flex-col gap-1">
              <div>Total Amount</div>
              <p-inputnumber
                appendTo="body"
                styleClass="w-full"
                inputStyleClass="w-full"
                formControlName="totalAmount"
                mode="currency"
                currency="MYR"
                locale="en-MY"
                [useGrouping]="true"
                [minFractionDigits]="2"
                [maxFractionDigits]="2"
              >
              </p-inputnumber>
            </div>
            <div class="col-span-12 md:col-span-6 flex flex-col gap-1">
              <div>Invoice Date</div>
              <p-datepicker
                appendTo="body"
                dateFormat="dd/mm/yy"
                styleClass="w-full!"
                [showIcon]="true"
                formControlName="invoiceDate"
              ></p-datepicker>
            </div>
            <div class="col-span-12 md:col-span-6 flex flex-col gap-1">
              <div>Due Date</div>
              <p-datepicker
                appendTo="body"
                dateFormat="dd/mm/yy"
                styleClass="w-full!"
                [showIcon]="true"
                formControlName="dueDate"
              ></p-datepicker>
            </div>

            <div class="col-span-12 flex flex-row items-center gap-3 md:mt-3">
              <div>
                Attachment
                <span class="text-red-500">*</span>
              </div>

              :

              <input
                #file
                type="file"
                (change)="onFileSelected($event)"
                hidden
              />

              <p-button
                [label]="FG.get('attachment')?.value ? 'Reupload' : 'Upload'"
                severity="secondary"
                icon="pi pi-upload"
                styleClass="border-gray-200!"
                size="small"
                (onClick)="file.click()"
              ></p-button>

              <a
                *ngIf="selectedFileName"
                [href]="selectedFileUrl"
                [download]="selectedFileName"
                target="_blank"
                class="bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm flex items-center gap-2"
              >
                <i class="pi pi-file text-yellow-600!"></i>

                <span class="truncate max-w-[200px]">
                  {{ selectedFileName }}
                </span>
              </a>
            </div>
          </div>
        </div>
        <div
          class="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 flex-none"
        >
          <p-button
            label="Cancel"
            severity="secondary"
            styleClass="border-gray-200!"
            (onClick)="showRecordDialog = false"
          ></p-button>
          <p-button
            label="Save"
            icon="pi pi-check-circle"
            severity="info"
            (onClick)="saveRecord()"
          ></p-button></div></ng-template
    ></p-dialog> `,
  styleUrl: './purchase-invoice.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseInvoice implements OnInit, OnDestroy {
  @ViewChild('fTable') fTable?: Table;

  private readonly invoiceService = inject(InvoiceService);
  private readonly messageService = inject(MessageService);
  private readonly loadingService = inject(LoadingService);
  private readonly cdr = inject(ChangeDetectorRef);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();
  private isInitializingForm: boolean = false;

  PagingSignal = signal<PagingContent<InvoiceDto>>(
    {} as PagingContent<InvoiceDto>,
  );
  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  search: string = '';
  selectedFileName: string = '';
  selectedFileUrl: string | null = null;
  editingId: string | null = null;

  isEditMode: boolean = false;
  showRecordDialog: boolean = false;

  FG!: FormGroup;

  menuItems: MenuItem[] = [];
  companySelection: any[] = [];
  purchaseOrderSelection: any[] = [];
  quotationSelection: any[] = [];
  deliveryOrderSelection: any[] = [];
  projectSelection: any[] = [];

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 10;
    this.Query.Filter = `Type=Purchase`;
    this.Query.OrderBy = 'CreatedAt desc';
    this.Query.Select = null;
    this.Query.Includes = 'Supplier';
  }

  ngOnInit(): void {
    this.initForm();
  }

  initForm() {
    this.FG = new FormGroup({
      id: new FormControl<string | null>({ value: null, disabled: true }),
      invoiceNo: new FormControl<string | null>(null, Validators.required),
      deliveryOrderId: new FormControl<string | null>(null),
      clientId: new FormControl<string | null>(null),
      supplierId: new FormControl<string | null>(null),
      projectId: new FormControl<string | null>(null),
      purchaseOrderId: new FormControl<string | null>(null),
      quotationId: new FormControl<string | null>(null),
      type: new FormControl<'Purchase' | 'Sales'>('Purchase'),
      invoiceDate: new FormControl<Date | null>(null),
      dueDate: new FormControl<Date | null>(null),
      gross: new FormControl<number | null>(null),
      discount: new FormControl<number | null>(null),
      totalAmount: new FormControl<number | null>(null),
      terms: new FormControl<string | null>(null),
      termsAndConditions: new FormControl<string | null>(null),
      bankDetails: new FormControl<string | null>(null),
      remarks: new FormControl<string | null>(null),
      notes: new FormControl<string | null>(null),
      attachment: new FormControl<File | null>(null),
      invoiceItems: new FormArray([]),
    });
  }

  GetData() {
    this.loadingService.start();

    this.invoiceService
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

    this.Query.Filter = this.Query.Filter
      ? `${this.Query.Filter},Type=Purchase`
      : 'Type=Purchase';

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
      InvoiceNo: [
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

    this.Query.Filter = `Type=Purchase`;
    this.GetData();
  }

  ActionClick(data: InvoiceDto | null, action: string) {
    if (action === 'Download' && data) {
      this.downloadAttachment(data);
    } else if (action === 'Update' && data) {
      this.OpenFormDialog(data);
    } else if (action === 'Delete' && data) {
      this.RemoveRecord(data);
    }
  }

  RemoveRecord(data: InvoiceDto) {
    this.loadingService.start();
    this.invoiceService
      .Delete(data.id)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          const currentPaging = this.PagingSignal();
          const updatedData = currentPaging.data.filter(
            (item) => item.id !== data.id,
          );

          this.PagingSignal.set({
            ...currentPaging,
            data: updatedData,
            totalElements: currentPaging.totalElements - 1,
          });
          this.cdr.markForCheck();
          this.messageService.add({
            severity: 'success',
            summary: 'Deleted',
            detail: `Invoice: ${data.invoiceNo} deleted`,
          });
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Delete Failed',
            detail: err.error?.error || 'Something went wrong',
          });
        },
        complete: () => {
          this.loadingService.stop();
        },
      });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];

    if (file) {
      this.selectedFileName = file.name;

      this.selectedFileUrl = URL.createObjectURL(file);

      this.FG.patchValue({
        attachment: file,
      });
    }
  }

  OpenFormDialog(data?: InvoiceDto) {
    this.loadingService.start();

    this.invoiceService
      .GetDropdown()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();

          this.purchaseOrderSelection = res.purchaseOrders.map((q: any) => ({
            label: q.purchaseOrderNo,
            value: q.id,
            clientId: q.clientId,
            supplierId: q.supplierId,
          }));

          this.companySelection = res.companies.map((c: any) => ({
            label: c.name,
            value: c.id,
          }));

          this.projectSelection = res.projects.map((p: any) => ({
            label: p.projectCode + ' - ' + p.projectTitle,
            value: p.id,
          }));

          if (data) {
            this.isEditMode = true;
            this.editingId = data.id;
            this.isInitializingForm = true;

            this.FG.patchValue({
              ...data,
            });
            this.isInitializingForm = false;
            if (data.attachment) {
              this.selectedFileName = data.attachment.split('/').pop() || '';
              this.selectedFileUrl = `https://localhost:5000/${data.attachment.replace(/\\/g, '/')}`;
            }
          } else {
            this.isEditMode = false;
            this.editingId = null;
            this.FG.reset({
              type: 'Purchase',
            });
          }

          this.showRecordDialog = true;
          this.cdr.markForCheck();
        },
      });
  }

  createItemGroup(data?: any): FormGroup {
    return new FormGroup({
      id: new FormControl<string | null>(data?.id ?? null),
      invoiceId: new FormControl<string | null>(data?.invoiceId ?? null),
      item: new FormControl<string | null>(data?.item ?? null),
      description: new FormControl<string | null>(data?.description ?? null),
      quantity: new FormControl<number>(data?.quantity ?? false),
      unitPrice: new FormControl<number>(data?.unitPrice ?? 0),
      unit: new FormControl<string>(data?.unit ?? 'Unit'),
      discount: new FormControl<number | null>(data?.discount ?? null),
      amount: new FormControl<number | null>(data?.amount ?? null),
    });
  }

  saveRecord() {
    if (this.FG.invalid) {
      ValidateAllFormFields(this.FG);
      return;
    }

    this.loadingService.start();

    const formData = new FormData();

    const raw = this.FG.getRawValue();

    Object.entries(raw).forEach(([key, value]) => {
      if (value === null || value === undefined) return;

      if (value instanceof Date) {
        value = value.toISOString();
      }

      if (typeof value === 'object' && !(value instanceof File)) {
        value = JSON.stringify(value);
      }

      formData.append(key, value as any);
    });

    if (this.isEditMode && this.editingId) {
      formData.append('id', this.editingId);
    }

    const request$ = this.isEditMode
      ? this.invoiceService.Update(formData)
      : this.invoiceService.Create(formData);

    request$.pipe(takeUntil(this.ngUnsubscribe)).subscribe({
      next: (res) => {
        this.loadingService.stop();

        const state = this.PagingSignal();

        if (this.isEditMode) {
          const updated = state.data.map((x) => (x.id === res.id ? res : x));

          this.PagingSignal.set({
            ...state,
            data: updated,
          });
        } else {
          this.PagingSignal.set({
            ...state,
            data: [res, ...state.data],
            totalElements: state.totalElements + 1,
          });
        }

        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Invoice: ${res.invoiceNo} saved successfully`,
        });

        this.showRecordDialog = false;
        this.FG.reset({
          type: 'Purchase',
        });

        this.isEditMode = false;
        this.editingId = null;

        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loadingService.stop();
        console.error(err);
      },
    });
  }

  downloadAttachment(data: InvoiceDto) {
    if (!data.attachment) return;

    const cleanPath = data.attachment.replace(/\\/g, '/');
    const fileUrl = `https://localhost:5000/${cleanPath}`;

    fetch(fileUrl)
      .then((response) => response.blob())
      .then((blob) => {
        const blobUrl = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = cleanPath.split('/').pop() || 'attachment';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        window.URL.revokeObjectURL(blobUrl);
      })
      .catch((error) => {
        console.error('Download failed:', error);
      });
  }

  onEllipsisClick(event: any, deliveryOrder: InvoiceDto, menu: any) {}

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
