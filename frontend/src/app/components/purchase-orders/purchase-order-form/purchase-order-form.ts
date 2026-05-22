import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
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
import { PurchaseOrderService } from '../../../services/purchaseOrderService.service';
import { LoadingService } from '../../../services/loading.service';
import { forkJoin, of, Subject, takeUntil } from 'rxjs';
import { ValidateAllFormFields } from '../../../shared/helpers/helpers';
import { UserService } from '../../../services/userService.service';
import { ProjectService } from '../../../services/ProjectService';
import { ProjectDto } from '../../../models/Project';
import { SupplierService } from '../../../services/SupplierService';
import { CompanyService } from '../../../services/companyService';
import { CompanyType } from '../../../shared/enum/enum';

@Component({
  selector: 'app-purchase-order-form',
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
  template: `
    <div class="w-full p-5 flex flex-col">
      <div class="flex flex-row items-center gap-1 text-gray-500 tracking-wide">
        <div
          [routerLink]="'/dashboard'"
          class="cursor-pointer hover:text-gray-600"
        >
          Dashboard
        </div>
        /
        <div
          [routerLink]="'/purchase-orders'"
          class="cursor-pointer hover:text-gray-600"
        >
          Purchase Orders
        </div>
        /
        <div class="text-gray-700 font-semibold">
          {{
            currentId
              ? poForm.get('purchaseOrderNo')?.value
              : 'New Purchase Order'
          }}
        </div>
      </div>
      <div
        class="px-5 py-2 flex flex-row items-center justify-between border border-gray-200 bg-white mt-3"
      >
        <div class="flex flex-row items-center gap-2 font-semibold">
          <i class="pi pi-file"></i>
          <div>
            {{ currentId ? 'Update Purchase Order' : 'Create Purchase Order' }}
          </div>
        </div>
        <div class="flex flex-row items-center gap-2">
          <p-button
            label="Cancel"
            severity="secondary"
            [outlined]="true"
            styleClass="py-1.5! px-4!"
            [routerLink]="'/purchase-orders/supplier'"
          ></p-button>
          <!-- <p-button
          label="Save As Draft"
          severity="info"
          [outlined]="true"
          styleClass="py-1.5!"
          size="small"
        ></p-button> -->
          <p-button
            (onClick)="onSave()"
            [label]="currentId ? 'Save Changes' : 'Create'"
            severity="info"
            styleClass="py-1.5! px-4!"
          ></p-button>
        </div>
      </div>

      <div class="mt-3 border border-gray-200 bg-white p-5 flex flex-col">
        <div class="grid grid-cols-12 gap-4 items-center" [formGroup]="poForm">
          <div class="col-span-12 font-semibold text-lg">
            Purchase Order Information
          </div>
          <div class="col-span-12 flex flex-col gap-1">
            <div class="flex items-center justify-between">
              <div>
                PO No
                <span class="text-gray-400 text-xs italic ml-1">
                  (Optional – auto-generated if left blank)
                </span>
              </div>
            </div>

            <input
              type="text"
              pInputText
              class="w-full font-semibold! placeholder:font-normal!"
              formControlName="purchaseOrderNo"
              placeholder="Leave blank for auto-generated PO number"
            />
          </div>
          <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
            <div class="mt-2 mb-1">
              From <span class="text-red-500">*</span>
            </div>
            <p-select
              [options]="companySelection || []"
              appendTo="body"
              styleClass="w-full!"
              formControlName="fromCompanyId"
            ></p-select>
          </div>
          <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
            <div class="flex flex-row justify-between items-center">
              <div>Bill To <span class="text-red-500">*</span></div>
              <p-button
                label="Add New Vendor"
                icon="pi pi-plus-circle"
                size="small"
                severity="info"
                [text]="true"
                (onClick)="AddVendorClick()"
              ></p-button>
            </div>
            <p-select
              [filter]="true"
              [options]="supplierSelection || []"
              appendTo="body"
              styleClass="w-full!"
              formControlName="supplierId"
              [showClear]="poForm.get('supplierId')?.value"
            ></p-select>
          </div>
          <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
            <div>Reference No</div>
            <input
              type="text"
              pInputText
              class="w-full"
              formControlName="quotationId"
            />
          </div>
          <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
            <div>PO date <span class="text-red-500">*</span></div>
            <p-datepicker
              appendTo="body"
              styleClass="w-full!"
              formControlName="poDate"
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
          <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
            <div>Project Code</div>
            <p-select
              [options]="projectSelection || []"
              appendTo="body"
              styleClass="w-full!"
              formControlName="projectId"
              appendTo="body"
              [filter]="true"
            ></p-select>
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
              [value]="items.controls"
            >
              <ng-template #header>
                <tr>
                  <th class="text-center! text-sm! w-[20%]!">Item</th>
                  <th class="text-center! text-sm! w-[30%]!">Description</th>
                  <th class="text-center! text-sm! w-[10%]!">Qty</th>

                  <th class="text-center! text-sm! w-[10%]!">Unit</th>
                  <th class="text-center! text-sm! w-[15%]!">
                    Unit Price (RM)
                  </th>
                  <th class="text-center! text-sm! w-[10%]!">Discount (%)</th>

                  <th class="text-center! text-sm! w-[15%]!">
                    Total Price (RM)
                  </th>
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
                      formControlName="totalPrice"
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
              placeholder="totalAmount"
              [minFractionDigits]="2"
            ></p-inputnumber>
          </div>
        </div>
      </div>
    </div>
    <p-dialog
      [(visible)]="showVendorDialog"
      [modal]="true"
      [style]="{ width: '850px' }"
      styleClass="preview-dialog overflow-hidden rounded-xl!"
      [maskStyle]="{ 'overflow-y': 'auto' }"
      appendTo="body"
    >
      <ng-template #headless>
        <div class="bg-gray-50/50 p-6 border-b border-gray-100">
          <div class="flex items-center gap-3">
            <div class="bg-blue-100 p-2.5 rounded-lg">
              <i class="pi pi-user-plus text-blue-600 text-xl"></i>
            </div>
            <div>
              <h2 class="text-xl font-bold text-gray-800 m-0">
                Create New Vendor
              </h2>
              <p class="text-sm text-gray-500 mt-1">
                Fill in the primary details and address information to register
                a new vendor.
              </p>
            </div>
          </div>
        </div>

        <div class="p-6 max-h-[70vh] overflow-y-auto">
          <div
            [formGroup]="vendorForm"
            class="grid grid-cols-12 gap-x-4 gap-y-3 text-[14px]"
          >
            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
              <label class="font-medium text-gray-700"
                >Vendor Name <span class="text-red-500">*</span></label
              >
              <input
                type="text"
                pInputText
                class="w-full!"
                formControlName="name"
                placeholder="e.g. Acme Corp"
              />
            </div>
            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
              <label class="font-medium text-gray-700">Email Address</label>
              <input
                type="text"
                pInputText
                class="w-full!"
                formControlName="email"
                placeholder="client@example.com"
              />
            </div>
            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
              <label class="font-medium text-gray-700">Contact Number</label>
              <input
                type="text"
                pInputText
                class="w-full!"
                formControlName="contactNo"
              />
            </div>
            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
              <label class="font-medium text-gray-700">Fax No</label>
              <input
                type="text"
                pInputText
                class="w-full!"
                formControlName="faxNo"
              />
            </div>
            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
              <label class="font-medium text-gray-700">Contact Person</label>
              <input
                type="text"
                pInputText
                class="w-full!"
                formControlName="contactPerson"
              />
            </div>
            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
              <label class="font-medium text-gray-700">A/C No</label>
              <input
                type="text"
                pInputText
                class="w-full!"
                formControlName="acNo"
              />
            </div>

            <div class="col-span-12 border-t border-gray-100 pt-4 mt-2">
              <div class="flex items-center gap-2 mb-3">
                <i class="pi pi-file text-gray-400"></i>
                <span
                  class="font-bold text-gray-800 uppercase tracking-wider text-xs"
                  >Billing Address</span
                >
              </div>
            </div>

            <div
              formGroupName="billingAddress"
              class="col-span-12 grid grid-cols-12 gap-3"
            >
              <div class="col-span-12 flex flex-col gap-1.5">
                <label class="text-gray-600">Address Line 1</label>
                <input
                  pInputText
                  formControlName="addressLine1"
                  class="w-full!"
                />
              </div>
              <div class="col-span-12 flex flex-col gap-1.5">
                <label class="text-gray-600">Address Line 2</label>
                <input
                  pInputText
                  formControlName="addressLine2"
                  class="w-full!"
                />
              </div>
              <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
                <label class="text-gray-600">City</label>
                <input pInputText formControlName="city" class="w-full!" />
              </div>
              <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
                <label class="text-gray-600">Postcode</label>
                <input pInputText formControlName="poscode" class="w-full!" />
              </div>
              <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
                <label class="text-gray-600">State</label>
                <input pInputText formControlName="state" class="w-full!" />
              </div>
              <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
                <label class="text-gray-600">Country</label>
                <input pInputText formControlName="country" class="w-full!" />
              </div>
            </div>

            <div
              class="col-span-12 border-t border-gray-100 pt-4 mt-4 flex justify-between items-center"
            >
              <div class="flex items-center gap-2">
                <i class="pi pi-truck text-gray-400"></i>
                <span
                  class="font-bold text-gray-800 uppercase tracking-wider text-xs"
                  >Delivery Address</span
                >
              </div>
              <div
                class="flex items-center gap-2 text-sm bg-gray-100 px-3 py-1 rounded-full cursor-pointer hover:bg-gray-200 transition-colors"
              >
                <input
                  type="checkbox"
                  formControlName="sameAsBilling"
                  id="sameAsBilling"
                  class="cursor-pointer"
                />
                <label
                  for="sameAsBilling"
                  class="cursor-pointer font-medium text-gray-600 text-xs"
                  >Same as Billing</label
                >
              </div>
            </div>

            <div
              formGroupName="deliveryAddress"
              class="col-span-12 grid grid-cols-12 gap-3"
            >
              <div class="col-span-12 flex flex-col gap-1.5">
                <label class="text-gray-600">Address Line 1</label>
                <input
                  pInputText
                  formControlName="addressLine1"
                  class="w-full!"
                />
              </div>
              <div class="col-span-12 flex flex-col gap-1.5">
                <label class="text-gray-600">Address Line 2</label>
                <input
                  pInputText
                  formControlName="addressLine2"
                  class="w-full!"
                />
              </div>
              <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
                <label class="text-gray-600">City</label>
                <input pInputText formControlName="city" class="w-full!" />
              </div>
              <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
                <label class="text-gray-600">Postcode</label>
                <input pInputText formControlName="poscode" class="w-full!" />
              </div>
              <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
                <label class="text-gray-600">State</label>
                <input pInputText formControlName="state" class="w-full!" />
              </div>
              <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
                <label class="text-gray-600">Country</label>
                <input pInputText formControlName="country" class="w-full!" />
              </div>
            </div>

            <div
              class="col-span-12 p-4 bg-blue-50/50 border border-blue-100 rounded-lg text-blue-700 text-center text-sm flex items-center justify-center gap-2 mt-2"
              *ngIf="vendorForm.get('sameAsBilling')?.value"
            >
              <i class="pi pi-info-circle"></i>
              System will use the billing address for delivery.
            </div>
          </div>
        </div>

        <div
          class="p-4 bg-gray-50 border-t border-gray-100 flex justify-end items-center gap-3"
        >
          <p-button
            (onClick)="showVendorDialog = false"
            label="Discard"
            severity="secondary"
            styleClass="px-6 py-2! border-gray-200!"
          ></p-button>

          <p-button
            (onClick)="AddNewVendor()"
            label="Create Vendor"
            severity="info"
            [disabled]="vendorForm.invalid"
            styleClass="px-8 py-2! shadow-sm"
          ></p-button>
        </div>
      </ng-template>
    </p-dialog>
  `,
  styleUrl: './purchase-order-form.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseOrderForm implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messageService = inject(MessageService);
  private readonly purchaseOrderService = inject(PurchaseOrderService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly supplierService = inject(SupplierService);
  private readonly companyService = inject(CompanyService);
  private readonly projectService = inject(ProjectService);
  private readonly loadingService = inject(LoadingService);
  private readonly userService = inject(UserService);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  private destroy$ = new Subject<void>();

  poForm!: FormGroup;
  vendorForm!: FormGroup;
  currentId: string = '';
  name = this.userService.currentUser?.fullName;

  displayPreview: boolean = false;
  showVendorDialog: boolean = false;
  previewData: any = null;

  today: Date = new Date();

  supplierSelection: any[] = [];
  companySelection: { label: string; value: string }[] = [];

  selectedVendor: any;
  selectedTemplate: string = 'notes';

  grossTotal = signal(0);
  discountTotal = signal(0);
  totalAmount = signal(0);

  projectSelection: any[] = [];

  ngOnInit(): void {
    this.initForm();
    this.currentId = this.activatedRoute.snapshot.queryParams['id'];

    this.getCompanySelection();
    this.getProjectSelection();

    this.poForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.calculateTotals());
  }

  initForm() {
    this.poForm = new FormGroup({
      purchaseOrderNo: new FormControl<string | null>(null),
      fromCompanyId: new FormControl<string | null>(null, Validators.required),
      type: new FormControl<string>('Outcoming'),
      poDate: new FormControl<Date | null>(new Date(), Validators.required),
      poReceivedDate: new FormControl<Date | null>(null),
      supplierId: new FormControl<string | null>(null),
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

    // this.poForm.get('quotationId')?.valueChanges.subscribe((x) => {
    //   const selectedQuotation = this.quotationSelection.find(
    //     (y) => y.value === x,
    //   );

    //   if (selectedQuotation) {
    //     this.poForm.get('clientId')?.patchValue(selectedQuotation.clientId);
    //     this.poForm
    //       .get('totalAmount')
    //       ?.patchValue(selectedQuotation.totalAmount);
    //     this.poForm.get('gross')?.patchValue(selectedQuotation.totalAmount);
    //   }
    // });
  }

  get items(): FormArray {
    return this.poForm.get('purchaseOrderItems') as FormArray;
  }

  createItem(data?: any): FormGroup {
    return this.fb.group({
      id: [data?.id ?? null],
      item: [data?.item ?? ''],
      description: [data?.description ?? '', Validators.required],
      quantity: [data?.quantity ?? 1, [Validators.required, Validators.min(1)]],
      unit: [data?.unit ?? 'unit'],
      unitPrice: [
        data?.unitPrice ?? 0,
        [Validators.required, Validators.min(0)],
      ],
      discount: [data?.discount ?? 0],
      totalPrice: [{ value: data?.totalPrice ?? 0, disabled: true }],
    });
  }

  addItem(item?: any) {
    const newItemGroup = this.createItem(item);

    this.items.push(newItemGroup);

    this.calculateTotals();
  }

  removeItem(index: number) {
    const current = this.items.at(index);

    if (current.get('isGroup')?.value) {
      this.items.removeAt(index);

      while (
        index < this.items.length &&
        !this.items.at(index).get('isGroup')?.value
      ) {
        this.items.removeAt(index);
      }
    } else {
      this.items.removeAt(index);
    }

    this.calculateTotals();
  }

  applyTemplate(type: 'notes' | 'terms' | 'bank') {
    this.selectedTemplate = type;

    this.cdr.detectChanges();
  }

  calculateTotals() {
    let gross = 0;
    let itemDiscountTotal = 0;
    let subtotal = 0;

    this.items.controls.forEach((control) => {
      const qty = control.get('quantity')?.value || 0;
      const unitPrice = control.get('unitPrice')?.value || 0;
      const itemDiscountPercent = control.get('discount')?.value || 0;

      const lineTotal = qty * unitPrice;

      const itemDiscount = lineTotal * (itemDiscountPercent / 100);
      const netLine = lineTotal - itemDiscount;

      control.get('totalPrice')?.setValue(netLine, { emitEvent: false });

      gross += lineTotal;
      itemDiscountTotal += itemDiscount;
      subtotal += netLine;
    });

    const headerDiscountPercent = this.poForm.get('discount')?.value || 0;
    const headerDiscountAmount = subtotal * (headerDiscountPercent / 100);

    const total = subtotal - headerDiscountAmount;

    // UI values
    this.grossTotal.set(gross);
    this.discountTotal.set(itemDiscountTotal + headerDiscountAmount);
    this.totalAmount.set(total);

    // Sync form
    this.poForm.get('gross')?.setValue(gross, { emitEvent: false });
    this.poForm.get('totalAmount')?.setValue(total, { emitEvent: false });
  }

  getCompanySelection() {
    forkJoin({
      selection: this.companyService.GetMany({
        Page: 1,
        PageSize: 1000000,
        OrderBy: 'Name',
        Select: null,
        Filter: null,
        Includes: null,
      }),
      data: this.currentId
        ? this.purchaseOrderService.GetOne({
            Page: 1,
            PageSize: 1,
            OrderBy: null,
            Select: null,
            Includes: 'PurchaseOrderItems',
            Filter: `Id=${this.currentId}`,
          })
        : of({} as any),
    })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(({ selection, data }) => {
        this.companySelection = selection.data
          .filter((x) => x.type === CompanyType.Own)
          .map((x) => ({ label: x.name, value: x.id }));

        this.supplierSelection = selection.data
          .filter((x) => x.type === CompanyType.Supplier)
          .map((x) => ({ label: x.name, value: x.id }));

        if (data && data.id) {
          this.patchData(data);
        }
      });
  }

  patchData(res: any) {
    this.poForm.patchValue({
      ...res,
      poDate: new Date(res.poDate),
    });

    this.items.clear();

    res.purchaseOrderItems.forEach((item: any) => {
      this.items.push(this.createItem(item));
    });
    this.calculateTotals();
    this.cdr.markForCheck();
  }

  getProjectSelection() {
    this.projectService
      .GetMany({
        Page: 1,
        PageSize: 1000000,
        Select: null,
        Includes: null,
        Filter: null,
        OrderBy: 'ProjectCode',
      })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.projectSelection = res.data.map((x: ProjectDto) => {
            return {
              label: x.projectCode + ' - ' + x.projectTitle,
              value: x.id,
            };
          });
        },
        error: (err) => {},
      });
  }

  VendorOnChange(event: any) {
    const selectedId = event.value;

    this.selectedVendor = this.supplierSelection.find(
      (x) => x.value === selectedId,
    );
  }

  onSave() {
    ValidateAllFormFields(this.poForm);
    if (this.poForm.invalid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Please fill all required fields',
      });
      return;
    }

    const formData = new FormData();

    const raw = this.poForm.getRawValue();

    Object.keys(raw).forEach((key) => {
      const value = (raw as any)[key];

      if (key === 'purchaseOrderItems') return;

      if (value === null || value === undefined) return;

      formData.append(key, value instanceof Date ? value.toISOString() : value);
    });

    formData.append(
      'purchaseOrderItems',
      JSON.stringify(raw.purchaseOrderItems),
    );
    if (this.currentId) {
      formData.append('id', this.currentId);
    }

    const action$ = this.currentId
      ? this.purchaseOrderService.Update(formData)
      : this.purchaseOrderService.Create(formData);

    action$.subscribe((res: any) => {
      if (res.success == false) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `${res.message}`,
        });
      } else {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `PO: ${res.purchaseOrderNo} has been saved`,
        });
        this.router.navigate(['/purchase-orders/supplier']);
      }
    });
  }

  downloadPDF() {
    window.print();
  }

  AddVendorClick() {
    this.vendorForm = new FormGroup({
      name: new FormControl<string | null>(null, Validators.required),
      email: new FormControl<string | null>(null, [Validators.email]),
      contactNo: new FormControl<string | null>(null, Validators.required),
      faxNo: new FormControl<string | null>(null),
      contactPerson: new FormControl<string | null>(null),
      acNo: new FormControl<string | null>(null),
      sameAsBilling: new FormControl(false),
      // Create nested group for billing address
      billingAddress: new FormGroup({
        name: new FormControl('Billing'),
        addressLine1: new FormControl(null, Validators.required),
        addressLine2: new FormControl(null),
        city: new FormControl(null, Validators.required),
        state: new FormControl(null, Validators.required),
        poscode: new FormControl(null, Validators.required),
        country: new FormControl('Malaysia', Validators.required),
      }),

      deliveryAddress: new FormGroup({
        name: new FormControl('Delivery'),
        addressLine1: new FormControl(null, Validators.required),
        addressLine2: new FormControl(null),
        city: new FormControl(null, Validators.required),
        state: new FormControl(null, Validators.required),
        poscode: new FormControl(null, Validators.required),
        country: new FormControl('Malaysia', Validators.required),
      }),
    });

    this.vendorForm.get('sameAsBilling')?.valueChanges.subscribe((checked) => {
      if (checked) {
        const billingValue = this.vendorForm.get('billingAddress')?.value;
        this.vendorForm.get('deliveryAddress')?.patchValue({
          ...billingValue,
          name: 'Delivery', // Keep the name as Delivery
        });
      }
    });

    this.showVendorDialog = true;
  }

  AddNewVendor() {
    ValidateAllFormFields(this.vendorForm);

    if (!this.vendorForm.valid) return;

    this.loadingService.start();

    this.supplierService
      .Create(this.vendorForm.value)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res: any) => {
          this.loadingService.stop();
          const activeAddress = res.deliveryAddress ?? res.billingAddress;

          const newVendor = {
            label: res.name || this.vendorForm.value.name,
            value: res.id,
            email: res.email,
            contactNo: res.contactNo,
            faxNo: res.faxNo,
            acNo: res.acNo,
            addressType: res.deliveryAddress ? 'Delivery' : 'Billing', // Optional: track which one is being shown
            deliveryAddress: {
              addressLine1: activeAddress.addressLine1,
              addressLine2: activeAddress.addressLine2,
              city: activeAddress.city,
              poscode: activeAddress.poscode,
              state: activeAddress.state,
              country: activeAddress.country,
            },
          };

          this.supplierSelection = [...this.supplierSelection, newVendor];

          this.vendorForm.get('supplierId')?.setValue(res.id);

          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Vendor created and selected successfully',
            life: 3000,
          });

          this.showVendorDialog = false;
          this.vendorForm.reset();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.loadingService.stop();

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail:
              err.error?.message ||
              'Failed to create vendor. Please try again.',
            life: 5000,
          });

          this.cdr.markForCheck();
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
