import { CommonModule, Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { GoodsReceivingService } from '../../../services/goodsReceivingService';
import { LoadingService } from '../../../services/loading.service';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { PurchaseOrderService } from '../../../services/purchaseOrderService';
import { MessageService } from 'primeng/api';
import { ValidateAllFormFields } from '../../../shared/helpers/helpers';
import { TextareaModule } from 'primeng/textarea';

@Component({
  selector: 'app-goods-received-form',
  imports: [
    CommonModule,
    ButtonModule,
    InputTextModule,
    DatePickerModule,
    ReactiveFormsModule,
    InputNumberModule,
    SelectModule,
    TableModule,
    RouterLink,
    TextareaModule,
  ],
  template: `<div
    class="w-full min-h-[92.9vh] bg-slate-50/50 flex flex-col p-4 sm:p-6"
    [formGroup]="receiveForm"
  >
    <div
      class="flex flex-wrap items-center gap-2 text-sm text-slate-500 tracking-wide mb-4 sm:mb-6"
    >
      <div
        [routerLink]="'/dashboard'"
        class="cursor-pointer hover:text-slate-800 hover:underline transition-all"
      >
        Dashboard
      </div>
      <span class="text-slate-300">/</span>
      <div
        [routerLink]="'/grn'"
        class="cursor-pointer hover:text-slate-800 hover:underline transition-all"
      >
        Goods Received Notes
      </div>
      <span class="text-slate-300">/</span>
      <div class="text-slate-800 font-medium tracking-normal">
        Create Receipt
      </div>
    </div>

    <div
      class="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 items-start w-full mx-auto"
    >
      <div class="lg:col-span-2 flex flex-col gap-5 sm:gap-6">
        <div
          class="w-full bg-white border border-slate-200 rounded-xl shadow-xs p-4 sm:p-6 flex flex-col gap-5"
        >
          <div
            class="flex flex-row items-center justify-between border-b border-slate-100 pb-3"
          >
            <div class="flex flex-col">
              <h2 class="text-xl font-bold text-slate-800 tracking-wide">
                Goods Receiving Information
              </h2>
              <p class="text-sm text-slate-400 mt-0.5">
                Fill down the details corresponding to the physical delivery
                manifest tracking records.
              </p>
            </div>
            <div
              *ngIf="selectedPO?.purchaseOrderNo"
              class="w-fit bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5 flex items-center gap-2"
            >
              <span
                class="text-[11px] font-bold text-blue-500 uppercase tracking-wider"
                >PO Ref:</span
              >
              <span class="text-sm font-bold text-blue-700 tracking-tight">{{
                selectedPO.purchaseOrderNo
              }}</span>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-semibold text-slate-600"
                >GRN Number</label
              >
              <input
                type="text"
                pInputText
                formControlName="grnNo"
                placeholder="Auto-generated if left blank..."
                class="w-full"
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-semibold text-slate-600"
                >Received Date</label
              >
              <p-datepicker
                formControlName="receivedDate"
                [showIcon]="true"
                styleClass="w-full"
                appendTo="body"
                dateFormat="dd/mm/yy"
                placeholder="Select date..."
              ></p-datepicker>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-semibold text-slate-600"
                >Supplier DO Number</label
              >
              <input
                type="text"
                pInputText
                formControlName="supplierDONo"
                placeholder="Enter supplier DO no..."
                class="w-full"
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-semibold text-slate-600"
                >Supplier DO Date</label
              >
              <p-datepicker
                formControlName="supplierDODate"
                [showIcon]="true"
                styleClass="w-full"
                appendTo="body"
                dateFormat="dd/mm/yy"
                placeholder="Select DO date..."
              ></p-datepicker>
            </div>

            <div class="flex flex-col gap-1.5 sm:col-span-2">
              <label class="text-sm font-semibold text-slate-600"
                >DO Attachment Document</label
              >
              <div
                class="relative group flex items-center justify-between w-full h-[38px] border border-slate-300 rounded-lg bg-white hover:border-slate-400 transition-all duration-200 pr-1.5 text-sm"
              >
                <input
                  *ngIf="!receiveForm.get('supplierDOAttachment')?.value"
                  type="file"
                  id="doAttachmentFile"
                  class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
                  (change)="onFileSelect($event)"
                  accept=".pdf,.png,.jpg,.jpeg"
                />

                <div
                  class="flex items-center gap-2 text-slate-500 group-hover:text-slate-700 truncate max-w-[70%] pl-3"
                >
                  <i
                    class="pi"
                    [ngClass]="
                      receiveForm.get('supplierDOAttachment')?.value
                        ? 'pi-file text-slate-600 text-sm!'
                        : 'pi-upload text-slate-400 text-xs!'
                    "
                  ></i>
                  <span class="truncate text-sm font-medium">
                    {{
                      receiveForm.get('supplierDOAttachment')?.value?.name ||
                        receiveForm.get('supplierDOAttachmentUrl')?.value ||
                        'Upload delivery document copy...'
                    }}
                  </span>
                </div>

                <div
                  class="flex items-center gap-1"
                  [ngClass]="
                    receiveForm.get('supplierDOAttachment')?.value
                      ? 'z-40 relative'
                      : 'z-0'
                  "
                >
                  <ng-container
                    *ngIf="
                      receiveForm.get('supplierDOAttachment')?.value ||
                        receiveForm.get('supplierDOAttachmentUrl')?.value;
                      else browseBtn
                    "
                  >
                    <button
                      type="button"
                      (click)="downloadAttachment()"
                      title="Download/Preview File"
                      class="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 rounded-md transition-colors flex items-center justify-center cursor-pointer border-none"
                    >
                      <i class="pi pi-download text-[10px]"></i>
                    </button>
                    <button
                      type="button"
                      (click)="clearAttachment()"
                      title="Remove File"
                      class="bg-slate-100 hover:bg-slate-200 text-slate-600 p-1.5 rounded-md transition-colors flex items-center justify-center cursor-pointer border-none"
                    >
                      <i class="pi pi-trash text-[10px]"></i>
                    </button>
                  </ng-container>
                  <ng-template #browseBtn>
                    <button
                      type="button"
                      class="bg-slate-100 text-slate-600 text-sm font-semibold px-2.5 py-1 rounded-md pointer-events-none mr-1"
                    >
                      Browse
                    </button>
                  </ng-template>
                </div>
              </div>
            </div>

            <div class="flex flex-col gap-1.5 sm:col-span-2">
              <label class="text-sm font-semibold text-slate-600"
                >Remarks</label
              >
              <textarea
                name=""
                pTextarea
                [rows]="2"
                [autoResize]="true"
                formControlName="remarks"
                placeholder="Optional internal warehouse execution notes..."
                id=""
              ></textarea>
            </div>
          </div>
        </div>
      </div>

      <div
        class="lg:col-span-1 bg-white border border-slate-200 rounded-xl shadow-xs p-4 sm:p-5 flex flex-col gap-4"
      >
        <div
          class="flex flex-row items-center gap-2 border-b border-slate-100 pb-2.5"
        >
          <i class="pi pi-info-circle text-blue-500 text-sm"></i>
          <h3 class="font-bold text-slate-700 text-sm uppercase tracking-wider">
            Supplier Profile Info
          </h3>
        </div>

        <div class="flex flex-col gap-3 text-sm">
          <div class="bg-slate-50/80 rounded-lg p-3 border border-slate-100">
            <span
              class="text-[10px] uppercase font-bold text-slate-400 block tracking-wide mb-1"
              >Supplier Name</span
            >
            <div
              class="font-bold text-slate-800 text-base tracking-tight break-words"
            >
              {{ selectedPO?.supplier?.name || 'N/A' }}
            </div>
          </div>

          <div
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 px-1 mt-1"
          >
            <div class="flex flex-col gap-0.5">
              <span class="text-slate-400 font-semibold text-sm"
                >Account Reference No.</span
              >
              <span class="text-slate-700 font-medium text-base">{{
                selectedPO?.supplier?.acNo || '-'
              }}</span>
            </div>

            <div class="flex flex-col gap-0.5">
              <span class="text-slate-400 font-semibold text-sm"
                >Contact Line</span
              >
              <span class="text-slate-700 font-medium text-base">{{
                selectedPO?.supplier?.contactNo || '-'
              }}</span>
            </div>

            <div class="flex flex-col gap-0.5 sm:col-span-2 lg:col-span-1">
              <span class="text-slate-400 font-semibold text-sm"
                >Contact Account Person</span
              >
              <span class="text-slate-700 font-medium text-base">{{
                selectedPO?.supplier?.contactPerson1 || '-'
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <div
        class="lg:col-span-3 bg-white p-4 sm:p-5 border border-slate-200 rounded-xl shadow-xs"
      >
        <div class="flex flex-col gap-4">
          <div
            class="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-2.5 gap-1"
          >
            <div class="flex items-center gap-2">
              <i class="pi pi-list text-slate-400 text-xs"></i>
              <label
                class="text-sm font-bold text-slate-700 uppercase tracking-wider"
                >Line Items Allocation</label
              >
            </div>
            <span class="text-[11px] text-slate-400 font-medium"
              >Verify incoming units accurately matching physical packaging
              documents</span
            >
          </div>

          <div class="hidden md:block">
            <p-table
              [showGridlines]="true"
              [value]="items.controls"
              [tableStyle]="{ 'min-width': '100%', 'table-layout': 'fixed' }"
              styleClass="p-datatable-sm"
            >
              <ng-template #header>
                <tr class="bg-slate-50 text-sm">
                  <th
                    class="p-3 w-[38%] bg-gray-100! text-slate-600 font-semibold text-left!"
                  >
                    Item Description
                  </th>
                  <th
                    class="p-3 w-[14%] text-slate-600 font-semibold text-center! bg-gray-100!"
                  >
                    Ordered Qty
                  </th>
                  <th
                    class="p-3 w-[14%] text-slate-600 font-semibold text-center! bg-gray-100!"
                  >
                    Previously Received Qty
                  </th>
                  <th
                    class="p-3 w-[17%] text-slate-600 font-semibold text-center! bg-gray-100!"
                  >
                    Receiving Qty
                  </th>
                  <th
                    class="p-3 w-[16%] text-slate-600 font-semibold text-center! bg-gray-100!"
                  >
                    Unit Price
                  </th>
                  <th
                    class="p-3 w-[10%] text-slate-600 font-semibold text-center! bg-gray-100!"
                  >
                    Unit
                  </th>
                  <th
                    class="p-3 w-[15%] text-slate-600 font-semibold text-right! bg-gray-100!"
                  >
                    Total
                  </th>
                </tr>
              </ng-template>

              <ng-template #body let-row let-i="rowIndex">
                <tr
                  [formGroup]="getRowGroup(i)"
                  class="border-b border-slate-100 hover:bg-slate-50/40 transition-colors align-middle text-sm"
                >
                  <td class="p-3">
                    <div
                      class="font-semibold text-slate-800 truncate"
                      [title]="row.get('itemName')?.value"
                    >
                      {{ row.get('itemName')?.value }}
                    </div>
                  </td>
                  <td
                    class="p-3 text-center! text-slate-600 font-medium bg-slate-50/20"
                  >
                    {{ row.get('orderedQty')?.value | number: '1.2-2' }}
                  </td>
                  <td
                    class="p-3 text-center! text-slate-600 font-medium bg-slate-50/20"
                  >
                    {{ row.get('previouslyReceived')?.value | number: '1.2-2' }}
                  </td>
                  <td class="p-3 text-center">
                    <p-inputNumber
                      formControlName="receivedQuantity"
                      mode="decimal"
                      [minFractionDigits]="2"
                      [maxFractionDigits]="4"
                      [min]="0"
                      placeholder="0.00"
                      [showButtons]="true"
                      buttonLayout="horizontal"
                      inputStyleClass="text-center! font-semibold w-full! rounded-lg border-slate-200 bg-slate-50/30 focus:bg-white focus:border-slate-400 transition-all"
                    >
                      <ng-template #incrementbuttonicon>
                        <span class="pi pi-plus"></span>
                      </ng-template>
                      <ng-template #decrementbuttonicon>
                        <span class="pi pi-minus"></span> </ng-template
                    ></p-inputNumber>
                  </td>
                  <td class="p-3 text-center">
                    <p-inputNumber
                      formControlName="unitPrice"
                      mode="decimal"
                      [minFractionDigits]="2"
                      [maxFractionDigits]="2"
                      [min]="0"
                      placeholder="0.00"
                      inputStyleClass="text-center! font-semibold w-full! rounded-lg border-slate-200 bg-slate-50/30 focus:bg-white focus:border-slate-400 transition-all"
                    ></p-inputNumber>
                  </td>
                  <td class="text-center!">{{ row.get('unit')?.value }}</td>
                  <td
                    class="p-3 text-right! font-semibold text-slate-700 bg-slate-50/10"
                  >
                    RM {{ row.get('totalPrice')?.value || 0 | number: '1.2-2' }}
                  </td>
                </tr>
              </ng-template>

              <ng-template #footer>
                <tr class="bg-slate-50/80 font-semibold text-slate-700 text-sm">
                  <td
                    colspan="6"
                    class="p-3 text-right! text-slate-400 font-medium uppercase tracking-wider"
                  >
                    SubTotal:
                  </td>

                  <td
                    class="p-3 text-right! text-slate-900 font-bold text-base"
                  >
                    RM
                    {{ receiveForm.get('gross')?.value || 0 | number: '1.2-2' }}
                  </td>
                </tr>
                <tr class="font-semibold text-slate-700 text-sm">
                  <td
                    colspan="6"
                    class="p-3 text-right! text-red-500! font-medium uppercase tracking-wider"
                  >
                    - Discount:
                  </td>

                  <td class="p-3 text-right! !text-red-500 font-bold text-base">
                    RM
                    {{
                      receiveForm.get('discount')?.value || 0 | number: '1.2-2'
                    }}
                  </td>
                </tr>
                <tr class="bg-slate-50/80 font-semibold text-slate-700 text-sm">
                  <td
                    colspan="6"
                    class="p-3 text-right! text-slate-400 font-medium uppercase tracking-wider"
                  >
                    Total Amount:
                  </td>

                  <td class="p-3 text-right! text-slate-900 font-bold text-lg">
                    RM
                    {{
                      receiveForm.get('totalAmount')?.value || 0
                        | number: '1.2-2'
                    }}
                  </td>
                </tr>
              </ng-template>
            </p-table>
          </div>

          <div class="block md:hidden flex flex-col gap-3">
            <div
              *ngFor="let row of items.controls; let i = index"
              [formGroup]="getRowGroup(i)"
              class="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3 text-xs"
            >
              <div
                class="flex justify-between items-start border-b border-slate-100 pb-2"
              >
                <div
                  class="font-bold text-slate-800 pr-2 break-words max-w-[65%]"
                >
                  {{ row.get('itemName')?.value }}
                </div>
                <div
                  class="text-right bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded text-[10px]"
                >
                  Ordered: {{ row.get('orderedQty')?.value | number: '1.2-2' }}
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="flex flex-col gap-1">
                  <span
                    class="text-slate-400 font-semibold text-[10px] uppercase"
                    >Receiving Qty</span
                  >
                  <p-inputNumber
                    formControlName="receivedQuantity"
                    mode="decimal"
                    [minFractionDigits]="2"
                    [maxFractionDigits]="4"
                    [min]="0"
                    styleClass="w-full"
                    inputStyleClass="font-semibold w-full rounded-lg border-slate-200"
                  ></p-inputNumber>
                </div>

                <div class="flex flex-col gap-1">
                  <span
                    class="text-slate-400 font-semibold text-[10px] uppercase"
                    >Unit Price</span
                  >
                  <p-inputNumber
                    formControlName="unitPrice"
                    mode="decimal"
                    [minFractionDigits]="2"
                    [maxFractionDigits]="2"
                    [min]="0"
                    styleClass="w-full"
                    inputStyleClass="font-semibold w-full rounded-lg border-slate-200"
                  ></p-inputNumber>
                </div>
              </div>

              <div
                class="flex justify-between items-center bg-slate-50/80 p-2 rounded-lg font-medium mt-1 border border-slate-100"
              >
                <span
                  class="text-slate-400 text-[10px] uppercase font-bold tracking-wide"
                  >Line Total Balance</span
                >
                <span class="font-bold text-slate-800">
                  RM {{ row.get('totalPrice')?.value || 0 | number: '1.2-2' }}
                </span>
              </div>
            </div>

            <div
              class="bg-slate-100/60 border border-slate-200 rounded-lg p-3 flex flex-col gap-2 text-xs font-semibold text-slate-700 mt-1"
            >
              <div class="flex justify-between">
                <span class="text-slate-400 font-normal"
                  >Total Units Receiving:</span
                >
                <span>{{ calculateTotalQuantity() | number: '1.2-2' }}</span>
              </div>
              <div
                class="flex justify-between border-t border-slate-200/60 pt-2 text-slate-900 font-bold"
              >
                <span>Gross Balance Total:</span>
                <span
                  >RM
                  {{
                    receiveForm.get('gross')?.value || 0 | number: '1.2-2'
                  }}</span
                >
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        class="col-span-3 flex flex-row justify-end items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 shadow-xs"
      >
        <p-button
          label="Cancel"
          severity="secondary"
          styleClass="border-gray-200! px-4!"
          (onClick)="CancelClick()"
        ></p-button>
        <p-button
          label="Submit GRN"
          severity="info"
          icon="pi pi-check-circle"
          styleClass="px-4!"
          (onClick)="submitReceipt()"
        ></p-button>
      </div>
    </div>
  </div>`,
  styleUrl: './goods-received-form.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoodsReceivedForm implements OnInit, OnDestroy {
  private readonly goodsReceivingService = inject(GoodsReceivingService);
  private readonly purchaseOrderService = inject(PurchaseOrderService);
  private readonly messageService = inject(MessageService);
  private readonly loadingService = inject(LoadingService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly cdr = inject(ChangeDetectorRef);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  receiveForm!: FormGroup;
  currentId: string | null = null;
  poId: string | null = null;

  selectedPO: any;

  constructor() {
    this.initForm();
  }

  initForm() {
    this.receiveForm = new FormGroup({
      id: new FormControl<string | null>({ value: null, disabled: true }),
      grnNo: new FormControl<string | null>(null),
      purchaseOrderId: new FormControl<string | null>(null),
      supplierId: new FormControl<string | null>(null),
      receivedDate: new FormControl<Date | null>(null),
      supplierDONo: new FormControl<string | null>(null),
      supplierDODate: new FormControl<Date | null>(null),
      supplierDOAttachment: new FormControl<File | null>(null),
      supplierDOAttachmentUrl: new FormControl<string | null>(null),
      remarks: new FormControl<string | null>(null),
      gross: new FormControl<number | null>(null),
      discount: new FormControl<number | null>(null),
      totalAmount: new FormControl<number | null>(null),
      goodsReceivingItems: new FormArray([]),
    });
  }

  ngOnInit(): void {
    this.poId = this.activatedRoute.snapshot.queryParams['poId'];
    this.currentId = this.activatedRoute.snapshot.queryParams['id'];

    if (this.poId) {
      this.GetPOData();
    }
    if (!this.currentId) {
      this.generateGRNNo();
    } else {
      this.LoadForm();
    }

    this.receiveForm.get('goodsReceivingItems')?.valueChanges.subscribe(() => {
      this.calculateTotals();
    });
  }

  LoadForm() {
    this.loadingService.start();

    this.goodsReceivingService
      .GetOne({
        Page: 1,
        PageSize: 1,
        OrderBy: null,
        Select: null,
        Includes:
          'GoodsReceivingItems.PurchaseOrderItem,PurchaseOrder.Supplier,PurchaseOrder.PurchaseOrderItems',
        Filter: `Id=${this.currentId}`,
      })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();

          if (!res) return;

          this.selectedPO = res.purchaseOrder;

          const attachmentUrl = res.supplierDOAttachment
            ? res.supplierDOAttachment.replace(/\\/g, '/')
            : null;

          this.receiveForm.patchValue({
            ...res,
            receivedDate: res?.receivedDate ? new Date(res.receivedDate) : null,
            supplierDODate: res?.supplierDODate
              ? new Date(res.supplierDODate)
              : null,
            supplierDOAttachmentUrl: attachmentUrl,
            supplierDOAttachment: null,
          });

          if (res?.goodsReceivingItems?.length) {
            this.items.clear();

            res.goodsReceivingItems.forEach((item: any) => {
              const row = new FormGroup({
                id: new FormControl(item.id),
                purchaseOrderItemId: new FormControl(item.purchaseOrderItemId),
                itemName: new FormControl(item.purchaseOrderItem.item),
                orderedQty: new FormControl(item.purchaseOrderItem.quantity),
                receivedQuantity: new FormControl(
                  item.purchaseOrderItem.quantity - item.receivedQuantity,
                ),
                previouslyReceived: new FormControl(item.receivedQuantity),
                unitPrice: new FormControl(item.unitPrice),
                unit: new FormControl(item.unit),
                discount: new FormControl(item.discount),
                totalPrice: new FormControl(item.totalPrice),
                remarks: new FormControl(item.remarks),
              });

              row.valueChanges.subscribe((val) => {
                const qty = val.receivedQuantity || 0;
                const price = val.unitPrice || 0;
                row.get('totalPrice')?.setValue(qty * price, {
                  emitEvent: false,
                });
              });

              this.items.push(row);
            });
          }

          this.calculateTotals();
          this.cdr.markForCheck();
        },
        error: () => {
          this.loadingService.stop();
        },
      });
  }

  generateGRNNo() {
    this.goodsReceivingService
      .GenerateNo()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.receiveForm.get('grnNo')?.patchValue(res.grnNo);
        },
      });
  }

  calculateTotals() {
    let gross = 0;
    let discount = 0;

    this.items.controls.forEach((group: any) => {
      const qty = group.get('receivedQuantity')?.value || 0;
      const price = group.get('unitPrice')?.value || 0;
      const disc = group.get('discount')?.value || 0;

      const lineTotal = qty * price;

      group.get('totalPrice')?.setValue(lineTotal, { emitEvent: false });

      gross += lineTotal;
      discount += disc;
    });

    this.receiveForm.patchValue(
      {
        gross,
        discount,
        totalAmount: gross - discount,
      },
      { emitEvent: false },
    );
  }

  get items(): FormArray {
    return this.receiveForm.get('goodsReceivingItems') as FormArray;
  }

  GetPOData() {
    this.loadingService.start();
    this.purchaseOrderService
      .GetOne({
        Page: 1,
        PageSize: 1,
        OrderBy: null,
        Includes: 'Supplier,PurchaseOrderItems',
        Select: null,
        Filter: `Id=${this.poId}`,
      })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();
          this.selectedPO = res;
          console.log('API Response:', res);

          if (res) {
            this.receiveForm.patchValue({
              ...res,
              purchaseOrderId: res.id,
              supplierId: res.supplierId,
              remarks: res.remarks,
              discount: res.discount || 0,
            });

            this.buildItemsFromPO();
          }

          console.log('Form Value After Build:', this.receiveForm.value);
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loadingService.stop();
        },
      });
  }

  buildItemsFromPO() {
    const itemsFormArray = new FormArray<FormGroup>([]);

    const poItems = this.selectedPO?.purchaseOrderItems || [];

    poItems.forEach((item: any) => {
      const orderedQty = item.quantity || 0;
      const unitPrice = item.unitPrice || 0;

      const initialTotal = orderedQty * unitPrice;

      const rowGroup = new FormGroup({
        purchaseOrderItemId: new FormControl(item.id),
        itemName: new FormControl(item.item),
        orderedQty: new FormControl(orderedQty),
        previouslyReceived: new FormControl(item.receivedQuantity),
        receivedQuantity: new FormControl(
          item.quantity - item.receivedQuantity,
          [Validators.required, Validators.min(0)],
        ),
        unitPrice: new FormControl(unitPrice),
        unit: new FormControl(item.unit),
        discount: new FormControl(item.discount || 0),
        totalPrice: new FormControl(initialTotal),
        remarks: new FormControl(null),
      });

      rowGroup.valueChanges.subscribe((val) => {
        const qty = val.receivedQuantity || 0;
        const price = val.unitPrice || 0;
        rowGroup.get('totalPrice')?.setValue(qty * price, { emitEvent: false });
      });

      itemsFormArray.push(rowGroup);
    });

    this.receiveForm.setControl('goodsReceivingItems', itemsFormArray);

    this.receiveForm.get('goodsReceivingItems')?.valueChanges.subscribe(() => {
      this.calculateTotals();
    });

    this.calculateTotals();
  }
  onFileSelect(event: Event) {
    const inputNode = event.target as HTMLInputElement;

    if (inputNode.files && inputNode.files.length > 0) {
      const targetFile = inputNode.files[0];

      this.receiveForm.patchValue({
        supplierDOAttachment: targetFile,
      });

      this.receiveForm.get('supplierDOAttachment')?.updateValueAndValidity();
    }
  }

  downloadAttachment() {
    const file: File = this.receiveForm.get('supplierDOAttachment')?.value;
    const url: string = this.receiveForm.get('supplierDOAttachmentUrl')?.value;

    if (file) {
      const objectUrl = URL.createObjectURL(file);

      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = file.name;

      document.body.appendChild(a);
      a.click();

      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
      return;
    }

    if (url) {
      window.open(url, '_blank');
    }
  }

  clearAttachment() {
    this.receiveForm.patchValue({
      supplierDOAttachment: null,
      supplierDOAttachmentUrl: null,
    });

    const fileInput = document.getElementById(
      'doAttachmentFile',
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  CancelClick() {
    this.location.back();
  }

  submitReceipt() {
    if (this.receiveForm.invalid) {
      ValidateAllFormFields(this.receiveForm);
      return;
    }

    const formValues = this.receiveForm.getRawValue();
    const formData = new FormData();

    formData.append('purchaseOrderId', formValues.purchaseOrderId || '');
    formData.append('supplierId', formValues.supplierId || '');
    formData.append('grnNo', formValues.grnNo || '');
    formData.append('receivedDate', new Date().toISOString());
    formData.append('supplierDONo', formValues.supplierDONo || '');
    formData.append('remarks', formValues.remarks || '');
    formData.append('gross', formValues.gross?.toString() || '0');
    formData.append('discount', formValues.discount?.toString() || '0');
    formData.append('totalAmount', formValues.totalAmount?.toString() || '0');

    if (formValues.supplierDODate) {
      formData.append(
        'supplierDODate',
        new Date(formValues.supplierDODate).toISOString(),
      );
    }

    if (formValues.supplierDOAttachment) {
      formData.append(
        'supplierDOAttachment',
        formValues.supplierDOAttachment,
        formValues.supplierDOAttachment.name,
      );
    }

    formData.append(
      'goodsReceivingItems',
      JSON.stringify(formValues.goodsReceivingItems || []),
    );

    this.loadingService.start();

    this.goodsReceivingService
      .Create(formData)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();

          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Goods Received Note created successfully',
          });

          this.CancelClick();
        },

        error: (err) => {
          this.loadingService.stop();

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err?.error?.message || 'Failed to create GRN',
          });

          this.cdr.markForCheck();
        },
      });
  }

  getRowGroup(index: number): FormGroup {
    return this.items.at(index) as FormGroup;
  }

  calculateTotalQuantity(): number {
    return this.items.controls.reduce((total, control) => {
      return total + (Number(control.get('receivedQuantity')?.value) || 0);
    }, 0);
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
