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
import { DeliveryOrderService } from '../../../services/deliveryOrderService';
import { LoadingService } from '../../../services/loading.service';
import { MenuItem, MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { DeliveryOrderDto } from '../../../models/DeliveryOrder';
import {
  PagingContent,
  GridifyQueryExtend,
  BuildFilterText,
  BuildSortText,
  ValidateAllFormFields,
} from '../../../shared/helpers/helpers';
import { TimelineModule } from 'primeng/timeline';

@Component({
  selector: 'app-inbound-do',
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
    TimelineModule,
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
        <div class="text-gray-700 font-semibold">Inbound Delivery Orders</div>
      </div>
      <div
        class="mt-3 border border-gray-200 rounded-md tracking-wide bg-white p-5 flex flex-col"
      >
        <div
          class="flex flex-col gap-3 xl:gap-0 xl:flex-row xl:items-center justify-between"
        >
          <div class="flex flex-col">
            <div class="text-[18px] text-gray-700 font-semibold">
              Inbound Delivery Orders
            </div>
            <div class="text-gray-500">
              Manage your inbound delivery orders with ease and efficiency
            </div>
          </div>
          <div class="flex flex-row items-center gap-2">
            <div class="w-full xl:min-w-[300px] relative">
              <input
                type="text"
                pInputText
                [(ngModel)]="search"
                class="w-full!"
                placeholder="Search by Delivery Order No"
                (keydown)="onKeyDown($event)"
              />
              <i
                class="pi pi-search absolute! top-3! right-2! text-gray-500!"
              ></i>
            </div>
            <p-button
              label="Record Inbound DO"
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
                <th class="w-[5%]! bg-gray-100!"></th>

                <th
                  pSortableColumn="DeliveryOrderNo"
                  class="bg-gray-100! text-center! w-[15%]!"
                >
                  <div class="flex flex-row justify-center items-center gap-2">
                    <div>DO No</div>
                    <p-sortIcon field="DeliveryOrderNo" />
                  </div>
                </th>
                <th class="bg-gray-100! w-[20%]">Supplier</th>

                <th class="bg-gray-100! w-[20%]">Receiver</th>
                <th class="bg-gray-100! text-center! w-[15%]">
                  Delivery Method
                </th>

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
                <td>
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
                </td>
                <td class="text-center! font-semibold!">
                  {{ data.deliveryOrderNo }}
                </td>
                <td>{{ data.senderCompany?.name }}</td>
                <td>
                  {{ data.receiverCompany?.name }}
                </td>
                <td class="text-center!">
                  {{ data.deliveryMethod }}
                </td>
                <td class="text-center!">
                  <div class="flex justify-center">
                    <div
                      class="rounded-full px-6 text-[13px] py-0.5 font-medium w-fit whitespace-nowrap"
                      [ngClass]="{
                        'bg-orange-200 text-orange-600':
                          data.status === 'Draft',
                        'bg-yellow-100 text-yellow-600':
                          data.status === 'PartiallyReceived',
                        'bg-green-200 text-green-600':
                          data.status === 'Completed',
                        'bg-blue-200 text-blue-600':
                          data.status === 'FullyReceived',
                        'bg-red-200 text-red-600': data.status === 'Cancelled',
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
            <ng-template #expandedrow let-item>
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
            </ng-template>
            <ng-template #emptymessage>
              <tr>
                <td colspan="100%" class="border-x!">
                  <div class="text-center text-gray-500">
                    No delivery orders found in records.
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
                Record Delivery Order
              </h1>
              <p class="text-sm text-gray-500 mt-1">
                Verify and log the delivery order details to initiate the
                project.
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
              <div>Delivery Order No <span class="text-red-500">*</span></div>
              <input
                type="text"
                pInputText
                class="w-full"
                formControlName="deliveryOrderNo"
              />
            </div>
            <div class="col-span-12 md:col-span-6 flex flex-col gap-1">
              <div>
                Purchase Order<span class="text-sm italic text-gray-500"
                  >(Optional)</span
                >
              </div>
              <p-select
                [options]="purchaseOrderSelection"
                appendTo="body"
                [filter]="true"
                formControlName="purchaseOrderId"
                [showClear]="FG.get('purchaseOrderId')?.value"
              ></p-select>
            </div>
            <div class="col-span-12 md:col-span-6 flex flex-col gap-1">
              <div>
                Project
                <span class="text-sm italic text-gray-500">(Optional)</span>
              </div>
              <p-select
                [options]="projectSelection"
                appendTo="body"
                [filter]="true"
                formControlName="projectId"
                [showClear]="FG.get('projectId')?.value"
              ></p-select>
            </div>
            <div class="col-span-12 md:col-span-6 flex flex-col gap-1">
              <div>
                Reference No
                <span class="text-sm italic text-gray-500">(Optional)</span>
              </div>
              <input
                type="text"
                pInputText
                class="w-full"
                formControlName="referenceNo"
              />
            </div>

            <div class="col-span-12 md:col-span-6 flex flex-col gap-1">
              <div>Sender</div>
              <p-select
                [options]="companySelection"
                appendTo="body"
                [filter]="true"
                formControlName="senderCompanyId"
                [showClear]="FG.get('senderCompanyId')?.value"
              ></p-select>
            </div>
            <div class="col-span-12 md:col-span-6 flex flex-col gap-1">
              <div>Receiver</div>
              <p-select
                [options]="companySelection"
                appendTo="body"
                [filter]="true"
                formControlName="receiverCompanyId"
                [showClear]="FG.get('receiverCompanyId')?.value"
              ></p-select>
            </div>

            <div class="col-span-12 md:col-span-6 flex flex-col gap-1">
              <div>Delivery Method</div>
              <p-select
                appendTo="body"
                formControlName="deliveryMethod"
                [options]="[
                  { label: 'Self Pickup', value: 'Self Pickup' },
                  {
                    label: 'Standard Courier (e.g. J&T, DHL, Pos Laju)',
                    value: 'Standard Courier',
                  },
                  {
                    label: 'Third Party Logistics (e.g. Grab, Lalamove)',
                    value: 'Third Party Logistics',
                  },
                  { label: 'Air Freight', value: 'Air Freight' },
                  { label: 'Other', value: 'Other' },
                ]"
              ></p-select>
            </div>

            <div class="col-span-12 md:col-span-6 flex flex-col gap-1">
              <div>
                Remarks
                <span class="text-sm text-gray-500 italic">(Optiona)</span>
              </div>
              <input
                type="text"
                pInputText
                class="w-full"
                formControlName="remarks"
              />
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
    ></p-dialog>

    <p-dialog
      [(visible)]="showProofDialog"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      header="Upload Proof Images"
      styleClass="w-[500px]"
    >
      <div class="flex flex-col gap-4">
        <input
          #fileInput
          type="file"
          multiple
          accept="image/*"
          hidden
          (change)="onProofSelected($event)"
        />

        <p-button
          label="Upload Images"
          icon="pi pi-upload"
          severity="secondary"
          (onClick)="fileInput.click()"
        ></p-button>

        <div class="text-sm text-gray-500">
          {{
            selectedStatus === 'FullyReceived'
              ? 'Proof images required for Fully Received'
              : 'Upload proof images (optional)'
          }}
        </div>

        <div *ngIf="proofFiles.length > 0" class="grid grid-cols-3 gap-3 mt-2">
          <div
            *ngFor="let file of proofFiles; let i = index"
            class="relative group border border-gray-200 rounded-lg overflow-hidden bg-gray-50"
          >
            <img [src]="previewUrls[i]" class="w-full h-50 object-cover" />

            <div
              class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 
             flex items-center justify-center transition"
            >
              <p-button
                icon="pi pi-times"
                severity="danger"
                [rounded]="true"
                (onClick)="removeProof(i)"
              ></p-button>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-2">
          <p-button
            label="Cancel"
            severity="secondary"
            (onClick)="showProofDialog = false"
          ></p-button>

          <p-button
            label="Confirm"
            icon="pi pi-check"
            (onClick)="confirmStatusUpdate()"
          ></p-button>
        </div>
      </div>
    </p-dialog>`,
  styleUrl: './inbound-do.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InboundDo implements OnInit, OnDestroy {
  @ViewChild('fTable') fTable?: Table;

  private readonly deliveryOrderService = inject(DeliveryOrderService);
  private readonly loadingService = inject(LoadingService);
  private readonly messageService = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  private isInitializingForm: boolean = false;

  PagingSignal = signal<PagingContent<DeliveryOrderDto>>({
    data: [],
    totalElements: 0,
  } as PagingContent<DeliveryOrderDto>);
  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  search: string = '';
  selectedFileName: string = '';
  selectedFileUrl: string | null = null;
  isEditMode: boolean = false;

  editingId: string | null = null;

  showRecordDialog: boolean = false;
  showProofDialog: boolean = false;

  selectedStatusId: string | null = null;
  selectedStatus: string = '';
  proofFiles: File[] = [];
  previewUrls: string[] = [];

  FG!: FormGroup;

  menuItems: MenuItem[] = [];
  companySelection: any[] = [];
  supplierSelection: any[] = [];
  purchaseOrderSelection: any[] = [];
  projectSelection: any[] = [];

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 10;
    this.Query.Filter = `Type=Inbound`;
    this.Query.OrderBy = 'CreatedAt desc';
    this.Query.Select = null;
    this.Query.Includes =
      'SenderCompany.BillingAddress,SenderCompany.DeliveryAddress';
  }

  ngOnInit(): void {
    this.initForm();
  }

  initForm() {
    this.FG = new FormGroup({
      id: new FormControl<string | null>({ value: null, disabled: true }),
      deliveryOrderNo: new FormControl<string | null>(
        null,
        Validators.required,
      ),
      projectId: new FormControl<string | null>(null),
      referenceNo: new FormControl<string | null>(null),
      purchaseOrderId: new FormControl<string | null>(null),
      senderCompanyId: new FormControl<string | null>(
        null,
        Validators.required,
      ),
      receiverCompanyId: new FormControl<string | null>(
        null,
        Validators.required,
      ),
      deliveryMethod: new FormControl<string | null>(null),
      remarks: new FormControl<string | null>(null),
      notes: new FormControl<string | null>(null),
      attachment: new FormControl<File | null>(null),
      type: new FormControl<'Inbound' | 'Outbound'>(
        'Inbound',
        Validators.required,
      ),
    });

    this.FG.get('purchaseOrderId')?.valueChanges.subscribe(
      (purchaseOrderId) => {
        if (this.isInitializingForm) return;
        const selectedPO = this.purchaseOrderSelection.find(
          (po) => po.value === purchaseOrderId,
        );

        if (selectedPO) {
          this.FG.patchValue(
            {
              senderCompanyId: selectedPO.supplierId,
              receiverCompanyId: selectedPO.clientId,
              projectId: selectedPO.projectId,
            },
            { emitEvent: false },
          );
        }
      },
    );
  }

  GetData() {
    this.loadingService.start();

    this.deliveryOrderService.GetMany(this.Query).subscribe({
      next: (res) => {
        const statusOrder = [
          'Draft',
          'PartiallyReceived',
          'FullyReceived',
          'Completed',
          'Cancelled',
        ];

        const colorMap: Record<string, string> = {
          Draft: 'bg-orange-400',
          PartiallyReceived: 'bg-yellow-400',
          FullyReceived: 'bg-blue-400',
          Completed: 'bg-green-400',
          Cancelled: 'bg-red-400',
        };

        const enhancedData = res.data.map((order) => {
          const histories = order.deliveryOrderStatusHistories || [];

          // group latest history per status (per ORDER, not global)
          const latestByStatus = new Map<string, any>();

          for (const h of histories) {
            const existing = latestByStatus.get(h.status);

            if (
              !existing ||
              new Date(h.actionAt) > new Date(existing.actionAt)
            ) {
              latestByStatus.set(h.status, h);
            }
          }

          const reachedIndex =
            Math.max(...histories.map((h) => statusOrder.indexOf(h.status))) ??
            -1;

          const timeline = statusOrder.map((status, index) => {
            const item = latestByStatus.get(status);

            return {
              status,
              actionAt: item?.actionAt ?? null,
              actionUser: item?.actionUser?.fullName ?? null,
              color: colorMap[status],
              verified: index <= reachedIndex,
            };
          });

          return {
            ...order,
            timeline, // 👈 IMPORTANT: attach per-order timeline
          };
        });

        this.PagingSignal.set({
          ...res,
          data: enhancedData,
        });

        this.loadingService.stop();
        this.cdr.markForCheck();
      },

      error: () => {
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
      ? `${this.Query.Filter},Type=Inbound`
      : 'Type=Inbound';

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
      DeliveryOrderNo: [
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

    this.Query.Filter = `Type=Inbound`;
    this.GetData();
  }

  ActionClick(data: DeliveryOrderDto | null, action: string) {
    if (action === 'Download' && data) {
      this.downloadAttachment(data);
    } else if (action === 'Update' && data) {
      this.OpenFormDialog(data);
    } else if (action === 'Delete' && data) {
      this.RemoveRecord(data);
    }
  }

  RemoveRecord(data: DeliveryOrderDto) {
    this.loadingService.start();
    this.deliveryOrderService
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
            detail: `DO: ${data.deliveryOrderNo} deleted`,
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

  OpenFormDialog(data?: DeliveryOrderDto) {
    this.loadingService.start();

    this.deliveryOrderService
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
              type: 'Inbound',
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
      deliveryOrderId: new FormControl<string | null>(
        data?.deliveryOrderId ?? null,
      ),
      description: new FormControl<string | null>(data?.description ?? null),
      quantityOrdered: new FormControl<number>(data?.quantityOrdered ?? false),
      quantityDelivered: new FormControl<number>(data?.quantityDelivered ?? 0),
      unit: new FormControl<string>(data?.unit ?? 'Unit'),
      remarks: new FormControl<string | null>(data?.remarks ?? null),
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
      ? this.deliveryOrderService.Update(formData)
      : this.deliveryOrderService.Create(formData);

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
          detail: `DO: ${res.deliveryOrderNo} saved successfully`,
        });

        this.showRecordDialog = false;
        this.FG.reset({
          type: 'Inbound',
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
  downloadAttachment(data: DeliveryOrderDto) {
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

  onEllipsisClick(event: any, deliveryOrder: DeliveryOrderDto, menu: any) {
    const items: any[] = [];

    if (deliveryOrder.status !== 'Completed') {
      items.push({
        label: 'Update',
        icon: 'pi pi-pencil',
        command: () => this.ActionClick(deliveryOrder, 'Update'),
      });
    }

    if (deliveryOrder.status === 'Draft') {
      items.push(
        {
          label: 'Partially Received',
          icon: 'pi pi-check',
          command: () =>
            this.openProofDialog(deliveryOrder.id, 'PartiallyReceived'),
        },
        {
          label: 'Fully Received',
          icon: 'pi pi-check-circle',
          command: () =>
            this.openProofDialog(deliveryOrder.id, 'FullyReceived'),
        },
      );
    }

    if (deliveryOrder.status === 'PartiallyReceived') {
      items.push({
        label: 'Fully Received',
        icon: 'pi pi-check-circle',
        command: () => this.updateStatus(deliveryOrder.id, 'FullyReceived'),
      });
    }

    if (
      deliveryOrder.status !== 'Cancelled' &&
      deliveryOrder.status !== 'Completed'
    ) {
      items.push({
        label: 'Cancel',
        icon: 'pi pi-times',
        styleClass: '!text-red-500',
        command: () => this.updateStatus(deliveryOrder.id, 'Cancelled'),
      });
    }

    if (deliveryOrder.status === 'FullyReceived') {
      items.push({
        label: 'Complete',
        icon: 'pi pi-check',
        command: () => this.updateStatus(deliveryOrder.id, 'Completed'),
      });
    }

    items.push(
      ...(deliveryOrder.attachment
        ? [
            {
              label: 'Download File',
              icon: 'pi pi-file',
              command: () => this.ActionClick(deliveryOrder, 'Download'),
            },
          ]
        : []),
      {
        label: 'Delete',
        icon: 'pi pi-trash',
        styleClass: '!text-red-500',
        command: () => this.ActionClick(deliveryOrder, 'Delete'),
      },
    );
    this.menuItems = items;
    menu.toggle(event);
  }

  openProofDialog(id: string, status: string) {
    this.selectedStatusId = id;
    this.selectedStatus = status;
    this.proofFiles = [];
    this.showProofDialog = true;
  }

  onProofSelected(event: any) {
    const files: File[] = Array.from(event.target.files);

    this.proofFiles = [...this.proofFiles, ...files];

    this.previewUrls = this.proofFiles.map((file) => URL.createObjectURL(file));
  }

  removeProof(index: number) {
    this.proofFiles.splice(index, 1);
    this.proofFiles = [...this.proofFiles];
  }

  confirmStatusUpdate() {
    if (!this.selectedStatusId) return;

    this.showProofDialog = false;

    this.updateStatus(
      this.selectedStatusId,
      this.selectedStatus,
      this.proofFiles,
    );
  }

  updateStatus(id: string, newStatus: string, proofImages: File[] = []) {
    this.loadingService.start();

    this.deliveryOrderService
      .UpdateStatus(id, newStatus, null, proofImages)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();

          const statusOrder = [
            'Draft',
            'PartiallyReceived',
            'FullyReceived',
            'Completed',
            'Cancelled',
          ];

          const colorMap: Record<string, string> = {
            Draft: 'bg-orange-400',
            PartiallyReceived: 'bg-yellow-400',
            FullyReceived: 'bg-blue-400',
            Completed: 'bg-green-400',
            Cancelled: 'bg-red-400',
          };

          const currentPaging = this.PagingSignal();

          const updatedData = currentPaging.data.map((order) => {
            if (order.id !== id) return order;

            const histories = [
              ...(order.deliveryOrderStatusHistories || []),
              {
                ...res,
                actionUser: res.actionUser ?? { fullName: 'System' },
                proofImages: res.proofImages ?? [],
              },
            ];

            const latestByStatus = new Map<string, any>();

            for (const h of histories) {
              const existing = latestByStatus.get(h.status);

              if (
                !existing ||
                new Date(h.actionAt) > new Date(existing.actionAt)
              ) {
                latestByStatus.set(h.status, h);
              }
            }

            const reachedIndex =
              Math.max(
                ...histories.map((h) => statusOrder.indexOf(h.status)),
              ) ?? -1;

            const timeline = statusOrder.map((status, index) => {
              const item = latestByStatus.get(status);

              return {
                status,
                actionAt: item?.actionAt ?? null,
                actionUser: item?.actionUser?.fullName ?? null,
                color: colorMap[status],
                verified: index <= reachedIndex,
              };
            });

            return {
              ...order,
              status: newStatus,
              deliveryOrderStatusHistories: histories,
              timeline, // ✅ updated only for this order
            };
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

  getStatusColor(status: string): string {
    switch (status) {
      case 'Draft':
        return 'bg-gray-400';

      case 'PartiallyReceived':
        return 'bg-yellow-400';

      case 'Completed':
        return 'bg-green-500';

      case 'FullyReceived':
        return 'bg-blue-500';
      case 'Cancelled':
        return 'bg-red-500';

      default:
        return 'bg-gray-300';
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
