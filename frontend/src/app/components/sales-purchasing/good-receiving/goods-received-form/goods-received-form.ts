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
import { GoodsReceivingService } from '../../../../services/goodsReceivingService';
import { LoadingService } from '../../../../services/loading.service';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { PurchaseOrderService } from '../../../../services/purchaseOrderService';
import { MessageService } from 'primeng/api';
import { ValidateAllFormFields } from '../../../../shared/helpers/helpers';
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
  template: `
    <div
      class="w-full min-h-[92.9vh] bg-slate-50/50 flex flex-col p-3 sm:p-5 lg:p-6"
      [formGroup]="receiveForm"
    >
      <!-- Breadcrumb -->
      <div
        class="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-500 mb-4 sm:mb-6"
      >
        <a routerLink="/dashboard" class="hover:text-blue-600 hover:underline"
          >Dashboard</a
        >
        <span class="text-slate-300">/</span>
        <a routerLink="/grn" class="hover:text-blue-600 hover:underline"
          >Goods Received Notes</a
        >
        <span class="text-slate-300">/</span>
        <span class="text-slate-800 font-semibold">Create Receipt</span>
      </div>

      <!-- Main layout -->
      <div
        class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 items-start w-full mx-auto"
      >
        <!-- GRN Information -->
        <section
          class="lg:col-span-2 min-w-0 bg-white border border-slate-200 rounded-xl shadow-sm p-4 sm:p-5 lg:p-6"
        >
          <div
            class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b border-slate-100 pb-4 mb-5"
          >
            <div class="min-w-0">
              <h2 class="text-lg sm:text-xl font-bold text-slate-800">
                Goods Receiving Information
              </h2>
              <p class="text-xs sm:text-sm text-slate-400 mt-1">
                Enter the details according to the physical delivery manifest.
              </p>
            </div>

            <div
              *ngIf="selectedPO?.purchaseOrderNo"
              class="shrink-0 w-fit bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 flex items-center gap-2"
            >
              <span
                class="text-[10px] font-bold text-blue-500 uppercase tracking-wider"
                >PO Ref:</span
              >
              <span class="text-sm font-bold text-blue-700">
                {{ selectedPO.purchaseOrderNo }}
              </span>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- GRN Number -->
            <div class="flex flex-col gap-1.5 min-w-0">
              <label class="text-sm font-semibold text-slate-600"
                >GRN Number</label
              >
              <input
                pInputText
                type="text"
                formControlName="grnNo"
                placeholder="Auto-generated if left blank..."
                class="w-full"
              />
            </div>

            <!-- Received Date -->
            <div class="flex flex-col gap-1.5 min-w-0">
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

            <!-- Supplier DO Number -->
            <div class="flex flex-col gap-1.5 min-w-0">
              <label class="text-sm font-semibold text-slate-600"
                >Supplier DO Number</label
              >
              <input
                pInputText
                type="text"
                formControlName="supplierDONo"
                placeholder="Enter supplier DO number..."
                class="w-full"
              />
            </div>

            <!-- Supplier DO Date -->
            <div class="flex flex-col gap-1.5 min-w-0">
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

            <!-- Attachment -->
            <div class="sm:col-span-2 flex flex-col gap-1.5 min-w-0">
              <label class="text-sm font-semibold text-slate-600"
                >DO Attachment Document</label
              >

              <div
                class="relative flex items-center justify-between gap-2 w-full min-h-[42px] border border-slate-300 rounded-lg bg-white hover:border-slate-400 transition-colors px-3 py-1.5"
              >
                <input
                  *ngIf="!receiveForm.get('supplierDOAttachment')?.value"
                  type="file"
                  id="doAttachmentFile"
                  class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  (change)="onFileSelect($event)"
                  accept=".pdf,.png,.jpg,.jpeg"
                />

                <div class="flex items-center gap-2 min-w-0 text-slate-500">
                  <i
                    class="pi shrink-0"
                    [ngClass]="
                      receiveForm.get('supplierDOAttachment')?.value ||
                      receiveForm.get('supplierDOAttachmentUrl')?.value
                        ? 'pi-file text-blue-600'
                        : 'pi-upload text-slate-400'
                    "
                  ></i>

                  <span class="truncate text-xs sm:text-sm font-medium">
                    {{
                      receiveForm.get('supplierDOAttachment')?.value?.name ||
                        receiveForm.get('supplierDOAttachmentUrl')?.value ||
                        'Upload delivery document copy...'
                    }}
                  </span>
                </div>

                <div class="flex items-center gap-1 shrink-0 relative z-20">
                  <ng-container
                    *ngIf="
                      receiveForm.get('supplierDOAttachment')?.value ||
                        receiveForm.get('supplierDOAttachmentUrl')?.value;
                      else browseButton
                    "
                  >
                    <button
                      type="button"
                      (click)="downloadAttachment()"
                      title="Download attachment"
                      class="h-8 w-8 flex items-center justify-center rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700"
                    >
                      <i class="pi pi-download text-xs"></i>
                    </button>

                    <button
                      type="button"
                      (click)="clearAttachment()"
                      title="Remove attachment"
                      class="h-8 w-8 flex items-center justify-center rounded-md bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600"
                    >
                      <i class="pi pi-trash text-xs"></i>
                    </button>
                  </ng-container>

                  <ng-template #browseButton>
                    <span
                      class="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-2 rounded-md"
                    >
                      Browse
                    </span>
                  </ng-template>
                </div>
              </div>

              <span class="text-[11px] text-slate-400">
                Accepted formats: PDF, PNG, JPG and JPEG.
              </span>
            </div>

            <!-- Remarks -->
            <div class="sm:col-span-2 flex flex-col gap-1.5 min-w-0">
              <label class="text-sm font-semibold text-slate-600"
                >Remarks</label
              >
              <textarea
                pTextarea
                [rows]="3"
                [autoResize]="true"
                formControlName="remarks"
                placeholder="Optional internal warehouse execution notes..."
                class="w-full"
              ></textarea>
            </div>
          </div>
        </section>

        <!-- Supplier Information -->
        <section
          class="lg:col-span-1 min-w-0 bg-white border border-slate-200 rounded-xl shadow-sm p-4 sm:p-5"
        >
          <div
            class="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4"
          >
            <i class="pi pi-building text-blue-500"></i>
            <h3
              class="font-bold text-slate-700 text-sm uppercase tracking-wider"
            >
              Supplier Profile
            </h3>
          </div>

          <div class="bg-slate-50 rounded-lg p-3 border border-slate-100 mb-4">
            <span
              class="text-[10px] uppercase font-bold text-slate-400 block tracking-wide mb-1"
            >
              Supplier Name
            </span>
            <div class="font-bold text-slate-800 text-base break-words">
              {{ selectedPO?.supplier?.name || 'N/A' }}
            </div>
          </div>

          <div
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 px-1"
          >
            <div class="flex flex-col gap-1">
              <span class="text-xs text-slate-400 font-semibold"
                >Account Reference No.</span
              >
              <span class="text-sm text-slate-700 font-medium break-words">
                {{ selectedPO?.supplier?.acNo || '-' }}
              </span>
            </div>

            <div class="flex flex-col gap-1">
              <span class="text-xs text-slate-400 font-semibold"
                >Contact Line</span
              >
              <span class="text-sm text-slate-700 font-medium break-words">
                {{ selectedPO?.supplier?.contactNo || '-' }}
              </span>
            </div>

            <div class="flex flex-col gap-1 sm:col-span-2 lg:col-span-1">
              <span class="text-xs text-slate-400 font-semibold"
                >Contact Person</span
              >
              <span class="text-sm text-slate-700 font-medium break-words">
                {{ selectedPO?.supplier?.contactPerson1 || '-' }}
              </span>
            </div>
          </div>
        </section>

        <!-- Line Items -->
        <section
          class="lg:col-span-3 min-w-0 bg-white border border-slate-200 rounded-xl shadow-sm p-3 sm:p-5"
        >
          <div
            class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3 mb-4"
          >
            <div class="flex items-center gap-2">
              <i class="pi pi-list text-blue-500"></i>
              <h3
                class="text-sm font-bold text-slate-700 uppercase tracking-wider"
              >
                Line Items Allocation
              </h3>
            </div>

            <span class="text-xs text-slate-400">
              Verify received quantities against the purchase order.
            </span>
          </div>

          <!-- Desktop table -->
          <div class="hidden md:block w-full overflow-x-auto">
            <p-table
              [showGridlines]="true"
              [value]="items.controls"
              [tableStyle]="{ 'min-width': '900px', width: '100%' }"
              styleClass="p-datatable-sm grn-items-table"
            >
              <ng-template #header>
                <tr>
                  <th
                    class="bg-slate-100! text-slate-600 font-semibold text-left! min-w-[220px]"
                  >
                    Item Description
                  </th>
                  <th
                    class="bg-slate-100! text-slate-600 font-semibold text-center! min-w-[105px]"
                  >
                    Ordered Qty
                  </th>
                  <th
                    class="bg-slate-100! text-slate-600 font-semibold text-center! min-w-[125px]"
                  >
                    Previously Received
                  </th>
                  <th
                    class="bg-slate-100! text-slate-600 font-semibold text-center! min-w-[155px]"
                  >
                    Receiving Qty
                  </th>
                  <th
                    class="bg-slate-100! text-slate-600 font-semibold text-center! min-w-[145px]"
                  >
                    Unit Price
                  </th>
                  <th
                    class="bg-slate-100! text-slate-600 font-semibold text-center! min-w-[85px]"
                  >
                    Unit
                  </th>
                  <th
                    class="bg-slate-100! text-slate-600 font-semibold text-right! min-w-[125px]"
                  >
                    Total
                  </th>
                </tr>
              </ng-template>

              <ng-template #body let-row let-i="rowIndex">
                <tr [formGroup]="getRowGroup(i)" class="align-middle text-sm">
                  <td class="font-semibold text-slate-800">
                    <span class="break-words">{{
                      row.get('itemName')?.value
                    }}</span>
                  </td>

                  <td class="text-center! text-slate-600">
                    {{ row.get('orderedQty')?.value | number: '1.2-2' }}
                  </td>

                  <td class="text-center! text-slate-600">
                    {{ row.get('previouslyReceived')?.value | number: '1.2-2' }}
                  </td>

                  <td>
                    <p-inputNumber
                      formControlName="receivedQuantity"
                      mode="decimal"
                      [minFractionDigits]="2"
                      [maxFractionDigits]="4"
                      [min]="0"
                      placeholder="0.00"
                      [showButtons]="true"
                      buttonLayout="horizontal"
                      inputStyleClass="text-center! font-semibold w-full! rounded-lg"
                    >
                      <ng-template #incrementbuttonicon>
                        <span class="pi pi-plus"></span>
                      </ng-template>
                      <ng-template #decrementbuttonicon>
                        <span class="pi pi-minus"></span>
                      </ng-template>
                    </p-inputNumber>
                  </td>

                  <td>
                    <p-inputNumber
                      formControlName="unitPrice"
                      mode="decimal"
                      [minFractionDigits]="2"
                      [maxFractionDigits]="2"
                      [min]="0"
                      placeholder="0.00"
                      inputStyleClass="text-center! font-semibold w-full! rounded-lg"
                    ></p-inputNumber>
                  </td>

                  <td class="text-center! text-slate-600">
                    {{ row.get('unit')?.value || '-' }}
                  </td>

                  <td class="text-right! font-bold text-slate-800">
                    RM {{ row.get('totalPrice')?.value || 0 | number: '1.2-2' }}
                  </td>
                </tr>
              </ng-template>

              <ng-template #footer>
                <tr class="bg-slate-50 font-semibold">
                  <td
                    colspan="6"
                    class="text-right! text-slate-500 uppercase text-xs"
                  >
                    Subtotal
                  </td>
                  <td class="text-right! text-slate-900">
                    RM
                    {{ receiveForm.get('gross')?.value || 0 | number: '1.2-2' }}
                  </td>
                </tr>

                <tr>
                  <td
                    colspan="6"
                    class="text-right! text-red-500 uppercase text-xs"
                  >
                    Discount
                  </td>
                  <td class="text-right! font-semibold text-red-500">
                    - RM
                    {{
                      receiveForm.get('discount')?.value || 0 | number: '1.2-2'
                    }}
                  </td>
                </tr>

                <tr class="bg-blue-50/70">
                  <td
                    colspan="6"
                    class="text-right! text-slate-700 uppercase text-xs font-bold"
                  >
                    Total Amount
                  </td>
                  <td class="text-right! text-blue-700 font-bold text-base">
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

          <!-- Mobile cards -->
          <div class="md:hidden flex flex-col gap-3">
            <div
              *ngFor="let row of items.controls; let i = index"
              [formGroup]="getRowGroup(i)"
              class="border border-slate-200 rounded-xl p-3 sm:p-4 flex flex-col gap-3"
            >
              <div
                class="flex items-start justify-between gap-2 border-b border-slate-100 pb-3"
              >
                <div class="min-w-0">
                  <span
                    class="text-[10px] text-slate-400 font-bold uppercase tracking-wide"
                  >
                    Item {{ i + 1 }}
                  </span>
                  <h4
                    class="text-sm font-bold text-slate-800 break-words mt-0.5"
                  >
                    {{ row.get('itemName')?.value }}
                  </h4>
                </div>

                <span
                  class="shrink-0 text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded-md"
                >
                  {{ row.get('unit')?.value || 'Unit' }}
                </span>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="bg-slate-50 rounded-lg p-2.5">
                  <span
                    class="block text-[10px] text-slate-400 font-semibold uppercase"
                  >
                    Ordered Qty
                  </span>
                  <span class="block text-sm font-bold text-slate-700 mt-1">
                    {{ row.get('orderedQty')?.value | number: '1.2-2' }}
                  </span>
                </div>

                <div class="bg-slate-50 rounded-lg p-2.5">
                  <span
                    class="block text-[10px] text-slate-400 font-semibold uppercase"
                  >
                    Previously Received
                  </span>
                  <span class="block text-sm font-bold text-slate-700 mt-1">
                    {{ row.get('previouslyReceived')?.value | number: '1.2-2' }}
                  </span>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="flex flex-col gap-1.5 min-w-0">
                  <label class="text-xs font-semibold text-slate-600"
                    >Receiving Qty</label
                  >
                  <p-inputNumber
                    formControlName="receivedQuantity"
                    mode="decimal"
                    [minFractionDigits]="2"
                    [maxFractionDigits]="4"
                    [min]="0"
                    [showButtons]="true"
                    styleClass="w-full"
                    inputStyleClass="w-full font-semibold text-sm"
                  ></p-inputNumber>
                </div>

                <div class="flex flex-col gap-1.5 min-w-0">
                  <label class="text-xs font-semibold text-slate-600"
                    >Unit Price (RM)</label
                  >
                  <p-inputNumber
                    formControlName="unitPrice"
                    mode="decimal"
                    [minFractionDigits]="2"
                    [maxFractionDigits]="2"
                    [min]="0"
                    styleClass="w-full"
                    inputStyleClass="w-full font-semibold text-sm"
                  ></p-inputNumber>
                </div>
              </div>

              <div
                class="flex items-center justify-between gap-2 bg-blue-50/70 border border-blue-100 rounded-lg px-3 py-2.5"
              >
                <span class="text-xs font-semibold text-slate-600"
                  >Line Total</span
                >
                <span class="text-sm font-bold text-blue-700">
                  RM {{ row.get('totalPrice')?.value || 0 | number: '1.2-2' }}
                </span>
              </div>
            </div>

            <div
              *ngIf="items.length === 0"
              class="text-center text-sm text-slate-400 border border-dashed border-slate-200 rounded-lg p-6"
            >
              No purchase order items found.
            </div>

            <!-- Mobile totals -->
            <div
              class="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col gap-2.5"
            >
              <div class="flex justify-between items-center text-xs">
                <span class="text-slate-500">Total Units Receiving</span>
                <span class="font-semibold text-slate-700">
                  {{ calculateTotalQuantity() | number: '1.2-2' }}
                </span>
              </div>

              <div class="flex justify-between items-center text-xs">
                <span class="text-slate-500">Subtotal</span>
                <span class="font-semibold text-slate-700">
                  RM
                  {{ receiveForm.get('gross')?.value || 0 | number: '1.2-2' }}
                </span>
              </div>

              <div class="flex justify-between items-center text-xs">
                <span class="text-red-500">Discount</span>
                <span class="font-semibold text-red-500">
                  - RM
                  {{
                    receiveForm.get('discount')?.value || 0 | number: '1.2-2'
                  }}
                </span>
              </div>

              <div
                class="border-t border-slate-200 pt-2 flex justify-between items-center"
              >
                <span class="text-sm font-bold text-slate-700"
                  >Total Amount</span
                >
                <span class="text-base font-bold text-blue-700">
                  RM
                  {{
                    receiveForm.get('totalAmount')?.value || 0 | number: '1.2-2'
                  }}
                </span>
              </div>
            </div>
          </div>
        </section>

        <!-- Actions -->
        <div
          class="lg:col-span-3 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 p-3 sm:p-4 bg-white rounded-xl border border-slate-200 shadow-sm"
        >
          <p-button
            label="Cancel"
            severity="secondary"
            [outlined]="true"
            styleClass="py-3! sm:py-2! w-full sm:w-auto"
            (onClick)="CancelClick()"
          ></p-button>

          <p-button
            [label]="currentId ? 'Update GRN' : 'Submit GRN'"
            severity="info"
            icon="pi pi-check-circle"
            styleClass="py-3! sm:py-2! w-full sm:w-auto bg-blue-700! hover:bg-blue-500! border-none!"
            (onClick)="submitReceipt()"
          ></p-button>
        </div>
      </div>
    </div>
  `,
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
      companyId: new FormControl<string | null>(null),
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

          this.receiveForm.get('id')?.enable();
          this.receiveForm.get('id')?.patchValue(this.currentId);

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

    if (this.currentId) {
      formData.append('id', this.currentId);
    }
    formData.append('purchaseOrderId', formValues.purchaseOrderId || '');
    formData.append('supplierId', formValues.supplierId || '');
    formData.append('grnNo', formValues.grnNo || '');
    formData.append(
      'receivedDate',
      formValues.receivedDate
        ? new Date(formValues.receivedDate).toISOString()
        : new Date().toISOString(),
    );
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

    const $request = this.currentId
      ? this.goodsReceivingService.Update(formData)
      : this.goodsReceivingService.Create(formData);

    $request.pipe(takeUntil(this.ngUnsubscribe)).subscribe({
      next: (res) => {
        this.loadingService.stop();

        const isUpdate = !!this.currentId;

        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: isUpdate
            ? `${res.grnNo} updated successfully`
            : `Goods Received Note: ${res.grnNo} created successfully`,
        });

        this.CancelClick();
      },

      error: (err) => {
        this.loadingService.stop();

        const isUpdate = !!this.currentId;

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail:
            err?.error?.message ||
            (isUpdate ? 'Failed to update GRN' : 'Failed to create GRN'),
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
