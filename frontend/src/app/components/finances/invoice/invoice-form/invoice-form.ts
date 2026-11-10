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
import { InvoiceService } from '../../../../services/invoiceService.service';
import { LoadingService } from '../../../../services/loading.service';
import { Subject, takeUntil } from 'rxjs';
import {
  denormalizeHtml,
  normalizeHtml,
} from '../../../../shared/helpers/helpers';
import { TooltipModule } from 'primeng/tooltip';

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
    TooltipModule,
  ],
  template: `
    <div class="w-full min-w-0 p-3 sm:p-4 lg:p-5 flex flex-col">
      <!-- Breadcrumb -->
      <div
        class="flex flex-wrap items-center gap-1 text-xs sm:text-sm text-gray-500 tracking-wide"
      >
        <a routerLink="/dashboard" class="hover:text-blue-600 cursor-pointer">
          Dashboard
        </a>
        <span>/</span>
        <a
          routerLink="/invoices/sales"
          class="hover:text-blue-600 cursor-pointer"
        >
          Sales Invoice
        </a>
        <span>/</span>
        <span class="text-gray-700 font-semibold truncate">
          {{
            currentId
              ? FG.get('invoiceNo')?.value || 'Update Invoice'
              : 'New Sales Invoice'
          }}
        </span>
      </div>

      <!-- Page Header -->
      <div
        class="mt-3 flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
      >
        <div class="flex items-center gap-3 min-w-0">
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700"
          >
            <i class="pi pi-file text-lg"></i>
          </div>

          <div class="min-w-0">
            <h1 class="text-base sm:text-lg font-semibold text-gray-800">
              {{ currentId ? 'Update Sales Invoice' : 'Create Sales Invoice' }}
            </h1>
            <p class="text-xs text-gray-500 mt-0.5">
              Manage invoice information and item details
            </p>
          </div>
        </div>

        <div class="grid grid-cols-2 sm:flex sm:flex-row gap-2">
          <p-button
            label="Cancel"
            severity="secondary"
            [outlined]="true"
            styleClass="w-full sm:w-auto"
            [routerLink]="'/invoices/sales'"
          ></p-button>

          <p-button
            (onClick)="onSave()"
            [label]="currentId ? 'Save Changes' : 'Create Invoice'"
            severity="info"
            styleClass="w-full sm:w-auto bg-blue-700! border-none! hover:bg-blue-500!"
          ></p-button>
        </div>
      </div>

      <!-- Invoice Form -->
      <div
        class="mt-3 rounded-lg border border-gray-200 bg-white p-4 sm:p-5"
        [formGroup]="FG"
      >
        <!-- Invoice Information -->
        <div class="mb-5">
          <div
            class="flex items-center gap-2 border-b border-gray-100 pb-3 mb-4"
          >
            <i class="pi pi-info-circle text-blue-600"></i>
            <h2 class="font-semibold text-gray-800">Invoice Information</h2>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Invoice No -->
            <div class="sm:col-span-2 flex flex-col gap-1">
              <label class="font-medium text-sm text-gray-700">
                Invoice No
                <span class="ml-1 text-xs font-normal italic text-gray-400">
                  (Optional – auto-generated if left blank)
                </span>
              </label>

              <input
                type="text"
                pInputText
                class="w-full font-semibold"
                formControlName="invoiceNo"
                placeholder="Leave blank for auto-generated invoice number"
              />
            </div>

            <!-- From -->
            <div class="flex flex-col gap-1">
              <label class="font-medium text-sm text-gray-700">
                From <span class="text-red-500">*</span>
              </label>

              <p-select
                [options]="companySelection || []"
                appendTo="body"
                styleClass="w-full"
                formControlName="companyId"
                placeholder="Select company"
              ></p-select>
            </div>

            <!-- Bill To -->
            <div class="flex flex-col gap-1">
              <label class="font-medium text-sm text-gray-700">
                Bill To <span class="text-red-500">*</span>
              </label>

              <p-select
                [filter]="true"
                [options]="companySelection || []"
                appendTo="body"
                styleClass="w-full"
                formControlName="clientId"
                placeholder="Select client"
                [showClear]="!!FG.get('clientId')?.value"
              ></p-select>
            </div>

            <!-- DO -->
            <div class="flex flex-col gap-1">
              <label class="font-medium text-sm text-gray-700">DO No.</label>

              <p-select
                [filter]="true"
                [options]="deliveryOrderSelection || []"
                appendTo="body"
                styleClass="w-full"
                formControlName="deliveryOrderId"
                placeholder="Select delivery order"
                [showClear]="!!FG.get('deliveryOrderId')?.value"
              ></p-select>
            </div>

            <!-- PO -->
            <div class="flex flex-col gap-1">
              <label class="font-medium text-sm text-gray-700">PO No.</label>

              <p-select
                [filter]="true"
                [options]="purchaseOrderSelection || []"
                appendTo="body"
                styleClass="w-full"
                formControlName="purchaseOrderId"
                placeholder="Select purchase order"
                [showClear]="!!FG.get('purchaseOrderId')?.value"
              ></p-select>
            </div>

            <!-- Invoice Date -->
            <div class="flex flex-col gap-1">
              <label class="font-medium text-sm text-gray-700">
                Invoice Date <span class="text-red-500">*</span>
              </label>

              <p-datepicker
                appendTo="body"
                styleClass="w-full"
                formControlName="invoiceDate"
                [showIcon]="true"
                dateFormat="dd/mm/yy"
                placeholder="Select invoice date"
              ></p-datepicker>
            </div>

            <!-- Terms -->
            <div class="flex flex-col gap-1">
              <label class="font-medium text-sm text-gray-700">Terms</label>

              <input
                type="text"
                pInputText
                class="w-full"
                formControlName="terms"
                placeholder="Enter payment terms"
              />
            </div>

            <!-- Remarks -->
            <div class="sm:col-span-2 flex flex-col gap-1">
              <label class="font-medium text-sm text-gray-700">Remarks</label>

              <textarea
                pTextarea
                formControlName="remarks"
                class="w-full"
                rows="3"
                placeholder="Enter remarks here..."
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Items Details -->
        <div class="mt-6">
          <div
            class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-3 mb-4"
          >
            <div class="flex items-center gap-2">
              <i class="pi pi-list text-blue-600"></i>
              <h2 class="font-semibold text-gray-800">Items Details</h2>
            </div>

            <span class="text-xs text-gray-500">
              {{ Items.length }} item(s)
            </span>
          </div>

          <!-- Responsive Table -->
          <div
            class="invoice-items-table w-full overflow-x-auto rounded-lg border border-gray-200"
          >
            <p-table
              showGridlines="true"
              [value]="Items.controls"
              [tableStyle]="{
                'min-width': '1050px',
                'table-layout': 'fixed',
              }"
            >
              <ng-template #header>
                <tr>
                  <th class="text-center! w-[15%]!">Item</th>
                  <th class="text-center! w-[25%]!">Description</th>
                  <th class="text-center! w-[8%]!">Qty</th>
                  <th class="text-center! w-[8%]!">Unit</th>
                  <th class="text-center! w-[13%]!">Unit Price (RM)</th>
                  <th class="text-center! w-[10%]!">Discount (%)</th>
                  <th class="text-center! w-[13%]!">Total Price (RM)</th>
                  <th class="text-center! w-[8%]!">Action</th>
                </tr>
              </ng-template>

              <ng-template #body let-row let-i="rowIndex">
                <tr [formGroup]="row">
                  <td>
                    <input
                      pInputText
                      formControlName="item"
                      class="w-full text-center"
                      placeholder="Item"
                    />
                  </td>

                  <td>
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
                        </span>
                      </ng-template>
                    </p-editor>
                  </td>

                  <td>
                    <p-inputNumber
                      formControlName="quantity"
                      styleClass="w-full"
                      inputStyleClass="w-full text-center"
                    />
                  </td>

                  <td>
                    <input
                      pInputText
                      formControlName="unit"
                      class="w-full text-center"
                      placeholder="Unit"
                    />
                  </td>

                  <td>
                    <p-inputNumber
                      formControlName="unitPrice"
                      styleClass="w-full"
                      inputStyleClass="w-full text-center"
                      mode="decimal"
                      [minFractionDigits]="2"
                      [maxFractionDigits]="2"
                    />
                  </td>

                  <td>
                    <p-inputNumber
                      formControlName="discount"
                      styleClass="w-full"
                      inputStyleClass="w-full text-center"
                      mode="decimal"
                      [minFractionDigits]="2"
                      [maxFractionDigits]="2"
                    />
                  </td>

                  <td>
                    <p-inputNumber
                      formControlName="amount"
                      [readonly]="true"
                      styleClass="w-full"
                      inputStyleClass="w-full text-center"
                      mode="decimal"
                      [minFractionDigits]="2"
                      [maxFractionDigits]="2"
                    />
                  </td>

                  <td class="text-center">
                    <p-button
                      icon="pi pi-trash"
                      severity="danger"
                      size="small"
                      [text]="true"
                      [rounded]="true"
                      pTooltip="Remove item"
                      (onClick)="removeItem(i)"
                    ></p-button>
                  </td>
                </tr>
              </ng-template>

              <ng-template #emptymessage>
                <tr>
                  <td colspan="8">
                    <div
                      class="flex flex-col items-center justify-center gap-2 py-8 text-gray-400"
                    >
                      <i class="pi pi-inbox text-2xl"></i>
                      <span class="text-sm">No invoice items added yet</span>
                    </div>
                  </td>
                </tr>
              </ng-template>
            </p-table>
          </div>

          <div class="mt-3">
            <p-button
              label="Add Item"
              icon="pi pi-plus"
              size="small"
              severity="info"
              [outlined]="true"
              (onClick)="addItem()"
            ></p-button>
          </div>
        </div>

        <!-- Total Amount -->
        <div
          class="mt-6 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-center border-t border-gray-200 pt-4"
        >
          <label
            class="sm:col-span-8 font-semibold text-gray-700 sm:text-right"
          >
            Total Amount
          </label>

          <div class="sm:col-span-4">
            <p-inputnumber
              styleClass="w-full"
              formControlName="totalAmount"
              inputStyleClass="w-full font-semibold bg-gray-100"
              mode="currency"
              currency="MYR"
              readonly="true"
              locale="ms-MY"
              [minFractionDigits]="2"
            ></p-inputnumber>
          </div>
        </div>
      </div>
    </div>
  `,
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

          // Clear existing items
          this.Items.clear();

          // Load invoice items only once
          if (res?.invoiceItems?.length) {
            [...res.invoiceItems]
              .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
              .forEach((item: any) => {
                const group = this.createItem({
                  ...item,
                  description: denormalizeHtml(item.description),
                });

                this.Items.push(group);
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

    const items = raw.invoiceItems.map((item: any) => ({
      ...item,
      description: normalizeHtml(item.description),
    }));

    formData.append('invoiceItems', JSON.stringify(items));
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
