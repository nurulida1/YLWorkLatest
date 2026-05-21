import { CommonModule } from '@angular/common';
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
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { EditorModule } from 'primeng/editor';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { InvoiceService } from '../../../services/invoiceService.service';
import { LoadingService } from '../../../services/loading.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-invoice-form',
  imports: [
    CommonModule,
    RouterLink,
    InputTextModule,
    DatePickerModule,
    SelectModule,
    TableModule,
    FormsModule,
    InputNumberModule,
    ButtonModule,
    ReactiveFormsModule,
    DialogModule,
    EditorModule,
    TextareaModule,
  ],
  template: ` <div class="w-full p-5 flex flex-col">
    <div class="flex flex-row items-center gap-1 text-gray-500 tracking-wide">
      <div
        [routerLink]="'/dashboard'"
        class="cursor-pointer hover:text-gray-600"
      >
        Dashboard
      </div>
      /
      <div
        [routerLink]="'/invoices/sales'"
        class="cursor-pointer hover:text-gray-600"
      >
        Sales Invoice
      </div>
      /
      <div class="text-gray-700 font-semibold">
        {{ currentId ? FG.get('invoiceNo')?.value : 'New Sales Invoice' }}
      </div>
    </div>
    <div
      class="px-5 py-2 flex flex-row items-center justify-between border border-gray-200 bg-white mt-3"
    >
      <div class="flex flex-row items-center gap-2 font-semibold">
        <i class="pi pi-file"></i>
        <div>
          {{ currentId ? 'Update Sales Invoice' : 'Create Sales Invoice' }}
        </div>
      </div>
      <div class="flex flex-row items-center gap-2">
        <p-button
          label="Cancel"
          severity="secondary"
          [outlined]="true"
          styleClass="py-1.5! px-4!"
          [routerLink]="'/purchase-orders'"
        ></p-button>

        <p-button
          (onClick)="onSave()"
          [label]="currentId ? 'Save Changes' : 'Create'"
          severity="info"
          styleClass="py-1.5! px-4!"
        ></p-button>
      </div>
    </div>

    <div class="mt-3 border border-gray-200 bg-white p-5 flex flex-col">
      <div class="grid grid-cols-12 gap-4 items-center" [formGroup]="FG">
        <div class="col-span-12 font-semibold text-lg">Invoice Information</div>
        <div class="col-span-12 flex flex-col gap-1">
          <div class="flex items-center justify-between">
            <div>
              Invoice No
              <span class="text-gray-400 text-xs italic ml-1">
                (Optional – auto-generated if left blank)
              </span>
            </div>
          </div>

          <input
            type="text"
            pInputText
            class="w-full font-semibold! placeholder:font-normal!"
            formControlName="invoiceNo"
            placeholder="Leave blank for auto-generated invoice number"
          />
        </div>
        <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
          <div class="mt-2 mb-1">From <span class="text-red-500">*</span></div>
          <p-select
            [options]="companySelection || []"
            appendTo="body"
            styleClass="w-full!"
            formControlName="companyId"
          ></p-select>
        </div>
        <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
          <div class="flex flex-row justify-between items-center">
            <div>Bill To <span class="text-red-500">*</span></div>
            <!-- <p-button
              label="Add New Vendor"
              icon="pi pi-plus-circle"
              size="small"
              severity="info"
              [text]="true"
              (onClick)="AddVendorClick()"
            ></p-button> -->
          </div>
          <p-select
            [filter]="true"
            [options]="companySelection || []"
            appendTo="body"
            styleClass="w-full!"
            formControlName="clientId"
            [showClear]="FG.get('clientId')?.value"
          ></p-select>
        </div>
        <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
          <div class="flex flex-row justify-between items-center">
            <div>DO No.</div>
          </div>
          <p-select
            [filter]="true"
            [options]="deliveryOrderSelection || []"
            appendTo="body"
            styleClass="w-full!"
            formControlName="deliveryOrderId"
            [showClear]="FG.get('deliveryOrderId')?.value"
          ></p-select>
        </div>
        <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
          <div class="flex flex-row justify-between items-center">
            <div>PO No.</div>
          </div>
          <p-select
            [filter]="true"
            [options]="purchaseOrderSelection || []"
            appendTo="body"
            styleClass="w-full!"
            formControlName="purchaseOrderId"
            [showClear]="FG.get('purchaseOrderId')?.value"
          ></p-select>
        </div>
        <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
          <div>Invoice date <span class="text-red-500">*</span></div>
          <p-datepicker
            appendTo="body"
            styleClass="w-full!"
            formControlName="invoiceDate"
            [showIcon]="true"
            dateFormat="dd/mm/yy"
          ></p-datepicker>
        </div>
        <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
          <div>Terms</div>
          <input
            type="text"
            pInputText
            class="w-full"
            formControlName="terms"
          />
        </div>

        <div class="col-span-12 flex flex-col gap-1">
          <div>Remarks</div>
          <div class="col-span-12">
            <textarea
              name="remarks"
              id="remarks"
              pTextarea
              formControlName="remarks"
              class="w-full!"
              rows="3"
              cols="30"
              placeholder="Enter remarks here..."
            ></textarea>
          </div>
        </div>
        <div class="col-span-12 font-semibold text-lg">Items Details</div>
        <div class="col-span-12">
          <p-table
            showGridlines="true"
            [tableStyle]="{ 'min-width': '60rem', 'table-layout': 'fixed' }"
            [value]="Items.controls"
          >
            <ng-template #header>
              <tr>
                <th class="text-center! text-sm! w-[20%]!">Item</th>
                <th class="text-center! text-sm! w-[30%]!">Description</th>
                <th class="text-center! text-sm! w-[10%]!">Qty</th>

                <th class="text-center! text-sm! w-[10%]!">Unit</th>
                <th class="text-center! text-sm! w-[15%]!">Unit Price (RM)</th>
                <th class="text-center! text-sm! w-[10%]!">Discount (%)</th>

                <th class="text-center! text-sm! w-[15%]!">Total Price (RM)</th>
                <th class="text-center! text-sm! w-[10%]!">Action</th>
              </tr></ng-template
            >
            <ng-template #body let-row let-i="rowIndex">
              <tr [formGroup]="row">
                <td class="w-[20%]! text-center!">
                  <input
                    pInputText
                    formControlName="item"
                    class="w-full text-center!"
                  />
                </td>

                <td class="w-[15%]!">
                  <p-editor
                    formControlName="description"
                    [style]="{ height: '100px' }"
                  >
                    <ng-template #header>
                      <span class="ql-formats">
                        <button
                          type="button"
                          class="ql-bold"
                          aria-label="Bold"
                        ></button>
                        <button
                          type="button"
                          class="ql-italic"
                          aria-label="Italic"
                        ></button>
                        <button
                          type="button"
                          class="ql-underline"
                          aria-label="Underline"
                        ></button>
                      </span> </ng-template
                  ></p-editor>
                </td>
                <td class="w-[10%]!">
                  <p-inputNumber
                    formControlName="quantity"
                    class="w-full!"
                    inputStyleClass="w-full! text-center!"
                    styleClass="w-full!"
                  />
                </td>
                <td class="w-[10%]!">
                  <input
                    pInputText
                    formControlName="unit"
                    class="w-full text-center!"
                  />
                </td>

                <td class="w-[15%]!">
                  <p-inputNumber
                    formControlName="unitPrice"
                    class="w-full!"
                    inputStyleClass="w-full! text-center!"
                    styleClass="w-full!"
                    mode="decimal"
                    [minFractionDigits]="2"
                    [maxFractionDigits]="2"
                  />
                </td>

                <td class="w-[10%]!">
                  <p-inputNumber
                    formControlName="discount"
                    class="w-full!"
                    inputStyleClass="w-full! text-center!"
                    styleClass="w-full!"
                    mode="decimal"
                    [minFractionDigits]="2"
                    [maxFractionDigits]="2"
                  />
                </td>

                <td class="w-[15%]!">
                  <p-inputNumber
                    formControlName="amount"
                    [readonly]="true"
                    class="w-full!"
                    inputStyleClass="w-full! text-center!"
                    styleClass="w-full!"
                    mode="decimal"
                    [minFractionDigits]="2"
                    [maxFractionDigits]="2"
                  />
                </td>

                <td class="text-center w-[5%]!">
                  <p-button
                    icon="pi pi-trash"
                    severity="danger"
                    size="small"
                    class="flex items-center justify-center"
                    [text]="true"
                    (onClick)="removeItem(i)"
                  ></p-button>
                </td>
              </tr>
            </ng-template>
            <ng-template #emptymessage>
              <tr>
                <td colspan="100%">
                  <div
                    class="flex items-center justify-center text-sm text-gray-500"
                  >
                    No items
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>

          <div class="flex gap-2 mt-3">
            <p-button
              label="Add Item"
              styleClass="rounded-full!"
              icon="pi pi-plus-circle"
              size="small"
              (onClick)="addItem()"
            ></p-button>
          </div>
        </div>
        <div class="col-span-12 flex flex-row items-center justify-end gap-2">
          <div class="font-semibold">Total Amount :</div>
          <p-inputnumber
            styleClass="text-center!"
            formControlName="totalAmount"
            inputStyleClass="w-full font-semibold! cursor-pointer! bg-gray-200!"
            mode="currency"
            currency="MYR"
            readonly="true"
            locale="ms-MY"
            [minFractionDigits]="2"
          ></p-inputnumber>
        </div>
      </div>
    </div>
  </div>`,
  styleUrl: './invoice-form.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoiceForm implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messageService = inject(MessageService);
  private readonly invoiceService = inject(InvoiceService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly loadingService = inject(LoadingService);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  FG!: FormGroup;

  currentId: string = '';

  companySelection: any[] = [];
  deliveryOrderSelection: any[] = [];
  purchaseOrderSelection: any[] = [];

  ngOnInit(): void {
    this.currentId = this.activatedRoute.snapshot.queryParams['id'];

    this.initForm();
    this.getDropdown();

    if (this.currentId) {
      setTimeout(() => {
        this.LoadForm();
      }, 400);
    }

    this.FG.get('deliveryOrderId')
      ?.valueChanges.pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((doId) => {
        const selected = this.deliveryOrderSelection.find(
          (x: any) => x.value === doId,
        );

        if (selected) {
          this.FG.get('purchaseOrderId')?.setValue(selected.purchaseOrderId, {
            emitEvent: false,
          });
          this.FG.get('quotationId')?.setValue(selected.quotationId, {
            emitEvent: false,
          });
          this.FG.get('projectId')?.setValue(selected.projectId, {
            emitEvent: false,
          });
        } else {
          this.FG.get('purchaseOrderId')?.setValue(null);
          this.FG.get('quotationId')?.setValue(null);
          this.FG.get('projectId')?.setValue(null);
        }
      });

    this.FG.get('purchaseOrderId')
      ?.valueChanges.pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((poId) => {
        const selected = this.purchaseOrderSelection.find(
          (x: any) => x.value === poId,
        );

        if (selected) {
          this.FG.get('quotationId')?.setValue(selected.quotationId, {
            emitEvent: false,
          });
          this.FG.get('projectId')?.setValue(selected.projectId, {
            emitEvent: false,
          });
        } else {
          this.FG.get('quotationId')?.setValue(null);
          this.FG.get('projectId')?.setValue(null);
        }
      });
  }

  initForm() {
    this.FG = new FormGroup({
      id: new FormControl<string | null>({ value: null, disabled: true }),
      invoiceNo: new FormControl<string | null>(null),
      deliveryOrderId: new FormControl<string | null>(null),
      companyId: new FormControl<string | null>(null),
      clientId: new FormControl<string | null>(null),
      supplierId: new FormControl<string | null>(null),
      projectId: new FormControl<string | null>(null),
      purchaseOrderId: new FormControl<string | null>(null),
      quotationId: new FormControl<string | null>(null),
      invoiceDate: new FormControl<Date | null>(null),
      dueDate: new FormControl<Date | null>(null),
      gross: new FormControl<number | null>(null),
      discount: new FormControl<number | null>(null),
      totalAmount: new FormControl<number | null>(null),
      terms: new FormControl<string | null>(null),
      type: new FormControl<string | null>('Sales'),
      termsAndConditions: new FormControl<string | null>(null),
      bankDetails: new FormControl<string | null>(null),
      remarks: new FormControl<string | null>(null),
      notes: new FormControl<string | null>(null),
      attachment: new FormControl<File | null>(null),
      invoiceItems: new FormArray([]),
    });
  }

  getDropdown() {
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
            projectId: q.projectId,
            quotationId: q.quotationId,
          }));

          this.companySelection = res.companies.map((c: any) => ({
            label: c.name,
            value: c.id,
          }));

          this.deliveryOrderSelection = res.deliveryOrders.map((p: any) => ({
            label: p.deliveryOrderNo,
            value: p.id,
            purchaseOrderId: p.purchaseOrderId,
            quotationId: p.quotationId,
            projectId: p.projectId,
          }));
        },
      });
  }

  LoadForm() {
    this.loadingService.start();
    this.invoiceService
      .GetOne({
        Page: 1,
        PageSize: 1,
        OrderBy: null,
        Includes: 'InvoiceItems',
        Filter: `Id=${this.currentId}`,
        Select: null,
      })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();
          this.FG.patchValue({
            ...res,
            invoiceDate: res?.invoiceDate ? new Date(res.invoiceDate) : null,
          });
          this.Items.clear();

          if (res?.invoiceItems?.length) {
            res.invoiceItems.forEach((item: any) => {
              this.Items.push(this.createItem(item));
            });
          }

          this.calculateTotals();

          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loadingService.stop();
        },
      });
  }

  get Items(): FormArray {
    return this.FG.get('invoiceItems') as FormArray;
  }

  createItem(data?: any): FormGroup {
    const group = this.fb.group({
      id: [data?.id ?? null],
      item: [data?.id ?? null],
      description: [data?.description ?? null],
      quantity: [data?.quantity ?? null],
      unit: [data?.unit ?? null],
      unitPrice: [data?.unitPrice ?? null],
      discount: [data?.discount ?? null],
      amount: [data?.amount ?? null],
    });

    group.valueChanges.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
      this.calculateTotals();
    });
    return group;
  }

  addItem(item?: any) {
    const newItemGroup = this.createItem(item);

    this.Items.push(newItemGroup);

    this.calculateTotals();
  }

  removeItem(index: number) {
    const current = this.Items.at(index);

    if (current.get('isGroup')?.value) {
      this.Items.removeAt(index);

      while (
        index < this.Items.length &&
        !this.Items.at(index).get('isGroup')?.value
      ) {
        this.Items.removeAt(index);
      }
    } else {
      this.Items.removeAt(index);
    }

    this.calculateTotals();
  }

  calculateTotals() {
    let grandTotal = 0;

    this.Items.controls.forEach((control) => {
      const group = control as FormGroup;

      const qty = group.get('quantity')?.value || 0;
      const price = group.get('unitPrice')?.value || 0;
      const discount = group.get('discount')?.value || 0;

      const subtotal = qty * price;
      const discountAmount = subtotal * (discount / 100);
      const total = subtotal - discountAmount;

      group.get('amount')?.setValue(total, { emitEvent: false });

      grandTotal += total;
    });

    this.FG.get('totalAmount')?.setValue(grandTotal, { emitEvent: false });

    this.cdr.markForCheck();
  }

  onSave() {
    if (this.FG.invalid) {
      this.FG.markAllAsTouched();

      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Please fill in required fields',
      });
      return;
    }

    const formData = new FormData();

    const raw = this.FG.getRawValue();

    Object.keys(raw).forEach((key) => {
      const value = (raw as any)[key];

      if (key === 'invoiceItems') return;

      if (value === null || value === undefined) return;

      formData.append(key, value instanceof Date ? value.toISOString() : value);
    });

    formData.append('invoiceItems', JSON.stringify(raw.invoiceItems));
    if (this.currentId) {
      formData.append('id', this.currentId);
    }

    this.loadingService.start();

    const request$ = this.currentId
      ? this.invoiceService.Update(formData)
      : this.invoiceService.Create(formData);

    request$.pipe(takeUntil(this.ngUnsubscribe)).subscribe({
      next: (res) => {
        this.loadingService.stop();

        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: this.currentId
            ? `Invoice: ${res.invoiceNo} updated successfully`
            : `Invoice: ${res.invoiceNo} created successfully`,
        });

        this.router.navigate(['/invoices/sales']);
      },
      error: (err) => {
        this.loadingService.stop();

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'Failed to save invoice',
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
