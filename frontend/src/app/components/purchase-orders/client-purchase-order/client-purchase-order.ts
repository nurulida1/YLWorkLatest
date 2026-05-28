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
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { PurchaseOrderService } from '../../../services/purchaseOrderService';
import { LoadingService } from '../../../services/loading.service';
import { AppService } from '../../../services/appService.service';
import { Subject, takeUntil } from 'rxjs';
import {
  BuildFilterText,
  BuildSortText,
  GridifyQueryExtend,
  PagingContent,
  ValidateAllFormFields,
} from '../../../shared/helpers/helpers';
import { PurchaseOrderDto } from '../../../models/PurchaseOrder';
import { MenuItem, MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { MenuModule } from 'primeng/menu';
import { UserService } from '../../../services/userService.service';

@Component({
  selector: 'app-client-purchase-order',
  imports: [
    CommonModule,
    ButtonModule,
    InputTextModule,
    FormsModule,
    TableModule,
    RouterLink,
    DialogModule,
    ReactiveFormsModule,
    DatePickerModule,
    SelectModule,
    InputNumberModule,
    MenuModule,
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
        <div class="text-gray-700 font-semibold">Client Purchase Orders</div>
      </div>
      <div
        class="mt-3 border border-gray-200 rounded-md tracking-wide bg-white p-5 flex flex-col"
      >
        <div
          class="flex flex-col gap-3 xl:gap-0 xl:flex-row xl:items-center justify-between"
        >
          <div class="flex flex-col">
            <div class="text-[18px] text-gray-700 font-semibold">
              Client Purchase Orders
            </div>
            <div class="text-gray-500">
              Manage your purchase orders with ease and efficiency
            </div>
          </div>
          <div class="flex flex-row items-center gap-2">
            <div class="w-full xl:min-w-[300px] relative">
              <input
                type="text"
                pInputText
                [(ngModel)]="search"
                class="w-full!"
                placeholder="Search by PO No"
                (keydown)="onKeyDown($event)"
              />
              <i
                class="pi pi-search absolute! top-3! right-2! text-gray-500!"
              ></i>
            </div>
            <p-button
              *ngIf="isPurchasing()"
              label="Record Client PO"
              (onClick)="OpenFormDialog()"
              icon="pi pi-plus-circle"
              styleClass="bg-sky-600! border-none! py-2! whitespace-nowrap!"
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
            [showGridlines]="true"
            [rowsPerPageOptions]="[10, 20, 30, 50]"
            [lazy]="true"
            (onLazyLoad)="NextPage($event)"
          >
            <ng-template #header>
              <tr>
                <th
                  pSortableColumn="PurchaseOrderNo"
                  class="bg-gray-100! text-center! w-[15%]!"
                >
                  <div class="flex flex-row justify-center items-center gap-2">
                    <div>PO No</div>
                    <p-sortIcon field="PurchaseOrderNo" />
                  </div>
                </th>
                <th class="bg-gray-100! w-[30%]">Company</th>

                <th
                  pSortableColumn="POReceivedDate"
                  class="bg-gray-100! text-center! w-[10%]"
                >
                  <div class="flex flex-row justify-center items-center gap-2">
                    <div class="whitespace-nowrap">Received Date</div>
                    <p-sortIcon field="POReceivedDate" />
                  </div>
                </th>
                <th class="bg-gray-100! text-center! w-[15%]">Amount</th>

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
            <ng-template #body let-data>
              <tr>
                <td class="text-center! font-semibold!">
                  {{ data.purchaseOrderNo }}
                </td>
                <td>{{ data.client?.name }}</td>
                <td class="text-center!">
                  {{ data.poReceivedDate | date: 'dd/MM/yyyy' }}
                </td>
                <td class="text-center!">
                  {{ data.totalAmount | currency: 'RM ' }}
                </td>
                <td class="text-center!">
                  <div class="flex justify-center">
                    <div
                      class="rounded-full px-4 py-0.5 font-medium w-fit whitespace-nowrap"
                      [ngClass]="{
                        'bg-indigo-100 text-indigo-600':
                          data.status === 'Approved',
                        'bg-blue-100 text-blue-600':
                          data.status === 'Reviewed' ||
                          data.status === 'In Progress',
                        'bg-green-100 text-green-600':
                          data.status === 'Accepted' ||
                          data.status === 'Received',
                        'bg-red-100 text-red-600':
                          data.status === 'Rejected' ||
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
            <ng-template #emptymessage>
              <tr>
                <td colspan="100%" class="border-x!">
                  <div class="text-center text-gray-500">
                    No client purchase order found in records.
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
                Record Client Purchase Order
              </h1>
              <p class="text-sm text-gray-500 mt-1">
                Verify and log the official PO received from the client to
                initiate the project.
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
            <div class="col-span-12 md:col-span-6 flex flex-col gap-1">
              <div>PO No <span class="text-red-500">*</span></div>
              <input
                type="text"
                pInputText
                class="w-full"
                formControlName="purchaseOrderNo"
              />
            </div>
            <div class="col-span-12 md:col-span-6 flex flex-col gap-1">
              <div>PO Date <span class="text-red-500">*</span></div>
              <p-datepicker
                formControlName="poDate"
                dateFormat="dd/mm/yy"
                styleClass="w-full"
                appendTo="body"
                [showIcon]="true"
              ></p-datepicker>
            </div>
            <div class="col-span-12 md:col-span-6 flex flex-col gap-1">
              <div>Received Date</div>
              <p-datepicker
                formControlName="poReceivedDate"
                dateFormat="dd/mm/yy"
                styleClass="w-full"
                appendTo="body"
                [showIcon]="true"
              ></p-datepicker>
            </div>
            <div class="col-span-12 md:col-span-6 flex flex-col gap-1">
              <div>
                Quotation No
                <span class="text-sm text-gray-500 italic">(Optional)</span>
              </div>
              <p-select
                [options]="quotationSelection"
                appendTo="body"
                [filter]="true"
                formControlName="quotationId"
                [showClear]="FG.get('quotationId')?.value"
              ></p-select>
            </div>
            <div class="col-span-12 md:col-span-6 flex flex-col gap-1">
              <div>Client</div>
              <p-select
                [options]="clientSelection"
                appendTo="body"
                [filter]="true"
                formControlName="clientId"
                [showClear]="FG.get('clientId')?.value"
              ></p-select>
            </div>

            <div class="col-span-12 md:col-span-6 flex flex-col gap-1">
              <div>Amount</div>
              <p-inputnumber
                styleClass="text-center!"
                formControlName="totalAmount"
                inputStyleClass="w-full text-[13px]!"
                mode="currency"
                currency="MYR"
                locale="ms-MY"
                [minFractionDigits]="2"
              ></p-inputnumber>
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
    ></p-dialog>`,
  styleUrl: './client-purchase-order.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientPurchaseOrder implements OnInit, OnDestroy {
  @ViewChild('fTable') fTable?: Table;

  private readonly purchaseOrderService = inject(PurchaseOrderService);
  private readonly loadingService = inject(LoadingService);
  private readonly messageService = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly appService = inject(AppService);
  private readonly userService = inject(UserService);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  PagingSignal = signal<PagingContent<PurchaseOrderDto>>(
    {} as PagingContent<PurchaseOrderDto>,
  );
  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  search: string = '';
  selectedFileName: string = '';
  selectedFileUrl: string | null = null;

  currentUser = this.userService.currentUser;

  showRecordDialog: boolean = false;

  FG!: FormGroup;

  menuItems: MenuItem[] = [];
  quotationSelection: any[] = [];
  clientSelection: any[] = [];

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 10;
    this.Query.Filter = `Type=Incoming`;
    this.Query.OrderBy = 'CreatedAt desc';
    this.Query.Select = null;
    this.Query.Includes = 'Client.BillingAddress,Client.DeliveryAddress';
  }

  ngOnInit(): void {
    this.initForm();
  }

  initForm() {
    this.FG = new FormGroup({
      id: new FormControl<string | null>({ value: null, disabled: true }),
      purchaseOrderNo: new FormControl<string | null>(
        null,
        Validators.required,
      ),
      type: new FormControl<string>('Incoming'),
      poDate: new FormControl<Date | null>(new Date(), Validators.required),
      poReceivedDate: new FormControl<Date | null>(null, Validators.required),
      clientId: new FormControl<string | null>(null),
      terms: new FormControl<string | null>(null),
      projectId: new FormControl<string | null>(null),
      quotationId: new FormControl<string | null>(null),
      gross: new FormControl<number | null>(0),
      discount: new FormControl<number | null>(null),
      totalAmount: new FormControl<number | null>(0),
      remarks: new FormControl<string | null>(null),
      notes: new FormControl<string | null>(null),
      termsAndConditions: new FormControl<string | null>(null),
      bankDetails: new FormControl<string | null>(null),
      totalQuantity: new FormControl<number | null>(null),
      attachment: new FormControl<string | null>(null),
      purchaseOrderItems: new FormArray([]),
    });

    this.FG.get('quotationId')?.valueChanges.subscribe((x) => {
      const selectedQuotation = this.quotationSelection.find(
        (y) => y.value === x,
      );

      if (selectedQuotation) {
        this.FG.get('clientId')?.patchValue(selectedQuotation.clientId);
        this.FG.get('totalAmount')?.patchValue(selectedQuotation.totalAmount);
        this.FG.get('gross')?.patchValue(selectedQuotation.totalAmount);
      }
    });
  }

  GetData() {
    this.loadingService.start();
    this.purchaseOrderService.GetMany(this.Query).subscribe({
      next: (res) => {
        this.PagingSignal.set(res);
        this.loadingService.stop();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loadingService.stop();
        this.cdr.markForCheck();
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
      ? `${this.Query.Filter},Type=Incoming`
      : 'Type=Incoming';

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
      PurchaseOrderNo: [
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

    this.Query.Filter = `Type=Incoming`;
    this.GetData();
  }

  ActionClick(data: PurchaseOrderDto | null, action: string) {
    if (!data) return;

    if (action === 'Download') {
      this.downloadAttachment(data);
    } else if (action === 'Delete') {
      this.RemoveRecord(data);
    } else if (action === 'Update') {
      this.OpenFormDialog();

      this.FG.get('id')?.enable();
      this.FG.patchValue({
        ...data,
        poDate: data.poDate ? new Date(data.poDate) : null,
        poReceivedDate: data.poReceivedDate
          ? new Date(data.poReceivedDate)
          : null,
      });

      if (data.attachment) {
        const cleanPath = data.attachment.replace(/\\/g, '/');

        this.selectedFileName = cleanPath.split('/').pop() || '';

        this.selectedFileUrl = `https://localhost:5000/${cleanPath}`;

        this.FG.patchValue({
          attachment: data.attachment,
        });
      } else {
        this.selectedFileName = '';
        this.selectedFileUrl = null;
      }
    }
  }

  updateStatus(id: string, newStatus: string) {
    this.loadingService.start();

    this.purchaseOrderService
      .UpdateStatus(id, newStatus)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();

          const currentPaging = this.PagingSignal();

          const updatedData = currentPaging.data.map((q) => {
            if (q.id === id) {
              const newHistory = {
                id: res.id,
                status: res.status,
                actionAt: res.actionAt,
                remarks: res.remarks,
                actionUser: res.actionUser,
                purchaseOrderId: q.id,
                actionUserId: res.actionUser?.id,
                createdAt: res.actionAt,
                signatureImage: null,
              } as any;

              const updatedHistories = [
                ...(q.purchaseOrderStatusHistories || []),
                newHistory,
              ];

              return {
                ...q,
                status: newStatus,
                purchaseOrderStatusHistories: updatedHistories,
              };
            }

            return q;
          });

          this.PagingSignal.set({
            ...currentPaging,
            data: updatedData,
          });

          this.messageService.add({
            severity: 'success',
            summary: 'Status Updated',
            detail: res.remarks,
          });

          this.cdr.markForCheck();
        },

        error: (err) => {
          this.loadingService.stop();

          this.messageService.add({
            severity: 'error',
            summary: 'Update Failed',
            detail: err.error?.error || 'Invalid status transition.',
          });
        },
      });
  }

  RemoveRecord(data: PurchaseOrderDto) {
    this.loadingService.start();
    this.purchaseOrderService
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
            detail: `Purchase Order ${data.purchaseOrderNo} deleted`,
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

  OpenFormDialog() {
    this.loadingService.start();

    this.purchaseOrderService
      .GetDropdown()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();

          this.quotationSelection = res.quotations.map((q: any) => ({
            label: q.quotationNo,
            value: q.id,
            clientId: q.clientId,
            totalAmount: q.totalAmount,
          }));

          this.clientSelection = res.clients.map((c: any) => ({
            label: c.name,
            value: c.id,
          }));
        },
        error: (err) => {
          this.loadingService.stop();
        },
      });

    this.showRecordDialog = true;
    this.cdr.markForCheck();
  }

  createItemGroup(data?: any): FormGroup {
    return new FormGroup({
      id: new FormControl<string | null>(data?.id ?? null),
      type: new FormControl<'Category' | 'Item'>(
        data?.type ?? (data?.isGroup ? 'Category' : 'Item'),
      ),
      parentId: new FormControl<string | null>(data?.parentId ?? null),
      isGroup: new FormControl<boolean>(data?.isGroup ?? false),
      description: new FormControl<string | null>(data?.description ?? null),
      quantity: new FormControl<number>(data?.quantity ?? 1),
      unit: new FormControl<string>(data?.unit ?? 'Unit'),
      unitPrice: new FormControl<number>(data?.unitPrice ?? 0),
      totalPrice: new FormControl<number>({
        value: data?.totalPrice ?? 0,
        disabled: true,
      }),
      sortOrder: new FormControl<number>(data?.sortOrder ?? 0),
    });
  }

  saveRecord() {
    if (!this.FG.valid) {
      ValidateAllFormFields(this.FG);
      return;
    }

    this.loadingService.start();

    const formData = new FormData();

    Object.keys(this.FG.controls).forEach((key) => {
      let value = this.FG.get(key)?.value;

      if (value === null || value === undefined) return;

      if (value instanceof Date) {
        value = value.toISOString();
      }

      if (value instanceof File) {
        formData.append(key, value, value.name);
        return;
      }

      formData.append(key, value);
    });

    const id = this.FG.get('id')?.value;
    if (id) {
      formData.append('id', id);
    }

    const request$ = id
      ? this.purchaseOrderService.Update(formData)
      : this.purchaseOrderService.Create(formData);

    request$.pipe(takeUntil(this.ngUnsubscribe)).subscribe({
      next: (res: any) => {
        this.loadingService.stop();

        if (res?.success === false) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Duplicate PO',
            detail: res.message,
          });
          return;
        }

        if (id) {
          const current = this.PagingSignal();

          const updated = current.data.map((item) =>
            item.id === id ? res : item,
          );

          this.PagingSignal.set({
            ...current,
            data: updated,
          });

          this.messageService.add({
            severity: 'success',
            summary: 'Updated',
            detail: `PO: ${res.purchaseOrderNo} updated successfully`,
          });
        } else {
          this.PagingSignal.update((state) => ({
            ...state,
            data: [res, ...state.data],
            totalElements: state.totalElements + 1,
          }));

          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `PO: ${res.purchaseOrderNo} recorded successfully`,
          });
        }

        this.resetForm();
        this.showRecordDialog = false;
        this.cdr.markForCheck();
      },

      error: (err) => {
        this.loadingService.stop();

        const message =
          err?.error?.message ||
          err?.error?.Error ||
          'Check console for details';

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: message,
        });
      },
    });
  }

  resetForm() {
    this.FG.reset({
      poDate: new Date(),
      type: 'Incoming',
    });

    this.selectedFileName = '';
    this.selectedFileUrl = null;

    this.FG.get('id')?.disable();
  }

  downloadAttachment(data: PurchaseOrderDto) {
    if (!data.attachment) return;

    const cleanPath = data.attachment.replace(/\\/g, '/');
    const fileUrl = `https://localhost:5000/${cleanPath}`;

    fetch(fileUrl)
      .then((response) => response.blob())
      .then((blob) => {
        const blobUrl = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;

        const fileExtension = cleanPath.split('.').pop() || '';
        const poNo = data.purchaseOrderNo || 'PO';

        link.download = `${poNo}.${fileExtension}`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        window.URL.revokeObjectURL(blobUrl);
      })
      .catch((error) => {
        console.error('Download failed:', error);
      });
  }

  onEllipsisClick(event: any, purchaseOrder: PurchaseOrderDto, menu: any) {
    const items: any[] = [];

    const status = purchaseOrder.status;

    const isEditable = status === 'Received';

    const canProgress = status === 'In Progress';

    const canInvoice = status === 'InProgress' || status === 'Completed';

    if (isEditable && this.isPurchasing()) {
      items.push(
        {
          label: 'Update',
          icon: 'pi pi-pencil',
          command: () => this.ActionClick(purchaseOrder, 'Update'),
        },
        {
          label: 'Reviewed',
          icon: 'pi pi-file-edit',
          command: () => this.updateStatus(purchaseOrder.id, 'Reviewed'),
        },
      );
    }

    if (status === 'Reviewed' && this.isPurchasing()) {
      items.push(
        {
          label: 'Approve',
          icon: 'pi pi-check-circle',
          command: () => this.updateStatus(purchaseOrder.id, 'Approved'),
        },
        {
          label: 'Reject',
          icon: 'pi pi-times-circle',
          command: () => this.updateStatus(purchaseOrder.id, 'Rejected'),
        },
      );
    }

    if (status === 'Approved' && this.isPurchasing()) {
      items.push(
        {
          label: 'In Progress',
          icon: 'pi pi-play',
          command: () => this.updateStatus(purchaseOrder.id, 'In Progress'),
        },
        {
          label: 'Cancel',
          icon: 'pi pi-times-circle',
          command: () => this.updateStatus(purchaseOrder.id, 'Cancelled'),
        },
      );
    }

    if (canProgress && this.isPurchasing()) {
      items.push({
        label: 'Mark as Completed',
        icon: 'pi pi-check-circle',
        command: () => this.ActionClick(purchaseOrder, 'Completed'),
      });
    }

    if (canInvoice && this.isAccounting()) {
      items.push({
        label: 'Issue Invoice',
        icon: 'pi pi-money-bill',
        styleClass: 'text-green-600',
        command: () => this.ActionClick(purchaseOrder, 'GenerateInvoice'),
      });
    }

    if (items.length > 0) {
      items.push({ separator: true });
    }

    if (purchaseOrder.attachment) {
      items.push({
        label: 'Download File',
        icon: 'pi pi-file',
        command: () => this.ActionClick(purchaseOrder, 'Download'),
      });
    }

    if (status === 'Received' && this.isPurchasing()) {
      items.push({
        label: 'Delete',
        icon: 'pi pi-trash',
        styleClass: '!text-red-500',
        command: () => this.ActionClick(purchaseOrder, 'Delete'),
      });
    }

    this.menuItems = items;
    menu.toggle(event);
  }

  isPurchasing(): boolean {
    return (
      this.currentUser?.jobTitle === 'Senior Procurement Executive' ||
      this.currentUser?.jobTitle === 'Purchasing Executive' ||
      this.currentUser?.jobTitle === 'Project Director' ||
      this.currentUser?.jobTitle === 'Sales Director'
    );
  }

  isAccounting(): boolean {
    return this.currentUser?.jobTitle === 'Admin and Account Executive';
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
