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
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { DeliveryOrderService } from '../../../../services/deliveryOrderService';
import { LoadingService } from '../../../../services/loading.service';
import { Subject, takeUntil } from 'rxjs';
import {
  denormalizeHtml,
  normalizeHtml,
  ValidateAllFormFields,
} from '../../../../shared/helpers/helpers';
import { InputNumberModule } from 'primeng/inputnumber';
import { TableModule } from 'primeng/table';
import { EditorModule } from 'primeng/editor';
import { ProjectService } from '../../../../services/ProjectService';

@Component({
  selector: 'app-delivery-order-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    InputTextModule,
    ButtonModule,
    SelectModule,
    TextareaModule,
    DatePickerModule,
    InputNumberModule,
    EditorModule,
    TableModule,
  ],
  template: `
    <div
      class="delivery-order-page min-h-screen w-full bg-slate-50/70 p-3 sm:p-4 lg:p-6"
    >
      <div class="mx-auto flex w-full max-w-[1600px] flex-col">
        <!-- Breadcrumb -->
        <nav
          class="mb-4 flex flex-wrap items-center gap-2 text-xs font-medium text-gray-500 sm:text-sm"
        >
          <a
            routerLink="/dashboard"
            class="transition-colors hover:text-blue-600"
          >
            Dashboard
          </a>

          <i class="pi pi-angle-right text-[10px] text-gray-400"></i>

          <a
            routerLink="/delivery-orders/outbound"
            class="transition-colors hover:text-blue-600"
          >
            Delivery Orders
          </a>

          <i class="pi pi-angle-right text-[10px] text-gray-400"></i>

          <span class="font-semibold text-gray-800">
            {{
              currentId
                ? doForm.get('deliveryOrderNo')?.value || 'Update DO'
                : 'New DO'
            }}
          </span>
        </nav>

        <!-- Sticky Action Header -->
        <div
          class="delivery-order-actionbar sticky top-2 z-20 mb-5 flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-5"
        >
          <div class="flex min-w-0 items-center gap-3">
            <div
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"
            >
              <i class="pi pi-file-edit text-xl"></i>
            </div>

            <div class="min-w-0">
              <h1
                class="truncate text-base font-bold tracking-tight text-gray-800 sm:text-lg"
              >
                {{
                  currentId ? 'Update Delivery Order' : 'Create Delivery Order'
                }}
              </h1>

              <p class="mt-0.5 text-xs text-gray-500 sm:text-sm">
                {{
                  currentId
                    ? 'Update delivery order information and items.'
                    : 'Fill in the details to create a new delivery order.'
                }}
              </p>
            </div>
          </div>

          <div
            class="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row sm:items-center"
          >
            <p-button
              label="Cancel"
              severity="secondary"
              [outlined]="true"
              styleClass="w-full sm:w-auto rounded-lg px-4 py-2.5"
              [routerLink]="'/delivery-orders'"
            ></p-button>

            <p-button
              (onClick)="onSave()"
              [label]="currentId ? 'Save Changes' : 'Create Delivery Order'"
              [icon]="currentId ? 'pi pi-save' : 'pi pi-plus'"
              severity="info"
              styleClass="w-full sm:w-auto rounded-lg px-4 py-2.5 shadow-sm bg-blue-700! hover:bg-blue-500! border-none!"
            ></p-button>
          </div>
        </div>

        <!-- Form -->
        <div [formGroup]="doForm" class="flex min-w-0 flex-col gap-5">
          <!-- Delivery Order Information -->
          <section class="form-section">
            <div class="form-section-heading">
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600"
              >
                <i class="pi pi-info-circle"></i>
              </div>

              <div>
                <h2 class="text-sm font-bold text-gray-800 sm:text-base">
                  Delivery Order Information
                </h2>

                <p class="mt-0.5 text-xs text-gray-500">
                  General information about this delivery order.
                </p>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-5 p-4 sm:p-5 lg:grid-cols-2">
              <!-- DO Number -->
              <div class="form-field lg:col-span-2">
                <label class="form-label">
                  DO Number
                  <span class="font-normal text-gray-400">(Optional)</span>
                </label>

                <input
                  type="text"
                  pInputText
                  formControlName="deliveryOrderNo"
                  class="w-full"
                  placeholder="Delivery order number will be generated automatically"
                />

                <p class="field-hint">
                  Leave blank to use the automatically generated number.
                </p>
              </div>

              <!-- Sender -->
              <div class="form-field">
                <label class="form-label">
                  Sender <span class="text-red-500">*</span>
                </label>

                <p-select
                  appendTo="body"
                  styleClass="w-full"
                  formControlName="senderCompanyId"
                  [options]="companySelection"
                  [filter]="true"
                  filterBy="label"
                  [showClear]="true"
                  placeholder="Select sender company"
                ></p-select>

                <!-- Sender Address Card -->
                <div class="address-card mt-3">
                  <div class="mb-3 flex items-center gap-2">
                    <i class="pi pi-building text-blue-500"></i>
                    <span class="address-card-title">Sender Address</span>
                  </div>

                  <address
                    class="not-italic text-sm leading-relaxed text-gray-700"
                  >
                    <div *ngIf="selectedSenderAddress?.addressLine1">
                      {{ selectedSenderAddress.addressLine1 }}
                    </div>

                    <div *ngIf="selectedSenderAddress?.addressLine2">
                      {{ selectedSenderAddress.addressLine2 }}
                    </div>

                    <div
                      *ngIf="
                        selectedSenderAddress?.postcode ||
                        selectedSenderAddress?.city
                      "
                    >
                      {{ selectedSenderAddress.postcode }}
                      {{ selectedSenderAddress.city }}
                    </div>

                    <div
                      *ngIf="
                        selectedSenderAddress?.state ||
                        selectedSenderAddress?.country
                      "
                    >
                      {{ selectedSenderAddress.state }}
                      {{
                        selectedSenderAddress.state &&
                        selectedSenderAddress.country
                          ? ', '
                          : ''
                      }}
                      {{ selectedSenderAddress.country }}
                    </div>

                    <div
                      *ngIf="!selectedSenderAddress"
                      class="text-xs italic text-gray-400"
                    >
                      Select a sender to view its address.
                    </div>
                  </address>
                </div>
              </div>

              <!-- Receiver -->
              <div class="form-field">
                <label class="form-label">
                  Receiver <span class="text-red-500">*</span>
                </label>

                <p-select
                  appendTo="body"
                  styleClass="w-full"
                  [options]="companySelection"
                  [filter]="true"
                  filterBy="label"
                  [showClear]="true"
                  formControlName="receiverCompanyId"
                  placeholder="Select receiver company"
                ></p-select>

                <!-- Receiver Address Card -->
                <div class="address-card mt-3">
                  <div class="mb-3 flex items-center gap-2">
                    <i class="pi pi-map-marker text-emerald-600"></i>
                    <span class="address-card-title">Shipping Address</span>
                  </div>

                  <address
                    class="not-italic text-sm leading-relaxed text-gray-700"
                  >
                    <div *ngIf="selectedReceiverAddress?.addressLine1">
                      {{ selectedReceiverAddress.addressLine1 }}
                    </div>

                    <div *ngIf="selectedReceiverAddress?.addressLine2">
                      {{ selectedReceiverAddress.addressLine2 }}
                    </div>

                    <div
                      *ngIf="
                        selectedReceiverAddress?.postcode ||
                        selectedReceiverAddress?.city
                      "
                    >
                      {{ selectedReceiverAddress.postcode }}
                      {{ selectedReceiverAddress.city }}
                    </div>

                    <div
                      *ngIf="
                        selectedReceiverAddress?.state ||
                        selectedReceiverAddress?.country
                      "
                    >
                      {{ selectedReceiverAddress.state }}
                      {{
                        selectedReceiverAddress.state &&
                        selectedReceiverAddress.country
                          ? ', '
                          : ''
                      }}
                      {{ selectedReceiverAddress.country }}
                    </div>

                    <div
                      *ngIf="!selectedReceiverAddress"
                      class="text-xs italic text-gray-400"
                    >
                      Select a receiver to view its address.
                    </div>
                  </address>

                  <div
                    class="mt-4 grid grid-cols-1 gap-3 border-t border-gray-200 pt-3 sm:grid-cols-2"
                  >
                    <div class="min-w-0">
                      <span class="address-meta-label">Contact Person</span>
                      <p
                        class="break-words text-sm font-semibold text-gray-800"
                      >
                        {{ doForm.get('receiverContactPerson')?.value || '—' }}
                      </p>
                    </div>

                    <div class="min-w-0">
                      <span class="address-meta-label">Phone Number</span>
                      <p
                        class="break-words text-sm font-semibold text-gray-800"
                      >
                        {{ doForm.get('receiverContactNo')?.value || '—' }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Sales Order -->
              <div class="form-field">
                <label class="form-label">Sales Order</label>

                <p-select
                  appendTo="body"
                  styleClass="w-full"
                  formControlName="salesOrderId"
                  [options]="salesOrderSelection"
                  [filter]="true"
                  filterBy="label"
                  [showClear]="true"
                  placeholder="Select sales order"
                ></p-select>

                <p class="field-hint">
                  Selecting a sales order can populate its project and item
                  details.
                </p>
              </div>

              <!-- Project -->
              <div class="form-field">
                <div
                  class="mb-1 flex flex-wrap items-center justify-between gap-2"
                >
                  <label class="form-label mb-0">Project</label>

                  <p-button
                    label="Add Project"
                    icon="pi pi-plus"
                    size="small"
                    severity="info"
                    [text]="true"
                    styleClass="p-0 text-xs font-semibold"
                    (onClick)="AddProject()"
                  ></p-button>
                </div>

                <p-select
                  appendTo="body"
                  styleClass="w-full"
                  formControlName="projectId"
                  [options]="projectSelection"
                  [filter]="true"
                  filterBy="label"
                  [showClear]="true"
                  placeholder="Select project"
                ></p-select>
              </div>

              <!-- Payment Terms -->
              <div class="form-field">
                <label class="form-label">Payment Terms</label>

                <input
                  pInputText
                  formControlName="paymentTerms"
                  class="w-full"
                  placeholder="e.g. 30 days"
                />
              </div>

              <!-- Delivery Method -->
              <div class="form-field">
                <label class="form-label">Delivery Method</label>

                <p-select
                  appendTo="body"
                  styleClass="w-full"
                  formControlName="deliveryMethod"
                  [options]="[
                    { label: 'Self Pickup', value: 'Self Pickup' },
                    {
                      label: 'Standard Courier (J&T, DHL, Pos Laju)',
                      value: 'Courier',
                    },
                    {
                      label: '3rd Party Logistics (Grab, Lalamove)',
                      value: '3PL',
                    },
                    { label: 'Air Freight', value: 'Air Freight' },
                    { label: 'Sea Freight', value: 'Sea Freight' },
                    { label: 'Other (Specify)', value: 'Other' },
                  ]"
                  placeholder="Select delivery method"
                ></p-select>

                <input
                  *ngIf="doForm.get('deliveryMethod')?.value === 'Other'"
                  pInputText
                  formControlName="deliveryMethodOther"
                  class="mt-2 w-full"
                  placeholder="Specify delivery method..."
                />
              </div>

              <!-- Remarks -->
              <div class="form-field lg:col-span-2">
                <label class="form-label">Remarks</label>

                <textarea
                  pTextarea
                  formControlName="remarks"
                  class="w-full"
                  rows="4"
                  [autoResize]="true"
                  placeholder="Enter any additional delivery instructions or remarks..."
                ></textarea>
              </div>
            </div>
          </section>

          <!-- Items Details -->
          <section class="form-section">
            <div
              class="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
            >
              <div class="flex items-center gap-3">
                <div
                  class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"
                >
                  <i class="pi pi-box"></i>
                </div>

                <div>
                  <h2 class="text-sm font-bold text-gray-800 sm:text-base">
                    Delivery Items
                  </h2>

                  <p class="mt-0.5 text-xs text-gray-500">
                    Manage the items and quantities included in this delivery.
                  </p>
                </div>
              </div>

              <span
                class="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
              >
                {{ Items.length }} {{ Items.length === 1 ? 'Item' : 'Items' }}
              </span>
            </div>

            <!-- Items Table -->
            <div class="delivery-items-table w-full min-w-0">
              <p-table
                [showGridlines]="false"
                [tableStyle]="{ 'min-width': '65rem', 'table-layout': 'fixed' }"
                [value]="Items.controls"
                styleClass="p-datatable-sm"
              >
                <ng-template #header>
                  <tr>
                    <th class="w-[35%]">Description</th>
                    <th class="w-[13%] text-center!">Qty Ordered</th>
                    <th class="w-[13%] text-center!">Qty Delivered</th>
                    <th class="w-[10%] text-center!">Unit</th>
                    <th class="w-[21%]">Remarks</th>
                    <th class="w-[8%] text-center!">Action</th>
                  </tr>
                </ng-template>

                <ng-template #body let-row let-i="rowIndex">
                  <tr [formGroup]="row">
                    <!-- Description -->
                    <td class="p-3 align-top">
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

                    <!-- Quantity Ordered -->
                    <td class="p-3 align-top">
                      <p-inputNumber
                        formControlName="quantityOrdered"
                        styleClass="w-full"
                        inputStyleClass="w-full text-center"
                        [min]="0"
                      ></p-inputNumber>
                    </td>

                    <!-- Quantity Delivered -->
                    <td class="p-3 align-top">
                      <p-inputNumber
                        formControlName="quantityDelivered"
                        styleClass="w-full"
                        inputStyleClass="w-full text-center"
                        [min]="0"
                      ></p-inputNumber>
                    </td>

                    <!-- Unit -->
                    <td class="p-3 align-top">
                      <input
                        pInputText
                        class="w-full text-center"
                        formControlName="unit"
                        placeholder="Unit"
                      />
                    </td>

                    <!-- Remarks -->
                    <td class="p-3 align-top">
                      <input
                        pInputText
                        formControlName="remarks"
                        class="w-full"
                        placeholder="Remarks..."
                      />
                    </td>

                    <!-- Action -->
                    <td class="p-3 text-center align-top">
                      <p-button
                        icon="pi pi-trash"
                        severity="danger"
                        size="small"
                        [text]="true"
                        [rounded]="true"
                        styleClass="mx-auto"
                        (onClick)="removeItem(i)"
                      ></p-button>
                    </td>
                  </tr>
                </ng-template>

                <!-- Empty State -->
                <ng-template #emptymessage>
                  <tr>
                    <td colspan="6" class="px-4 py-12">
                      <div
                        class="flex flex-col items-center justify-center text-center"
                      >
                        <div
                          class="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100"
                        >
                          <i class="pi pi-inbox text-2xl text-gray-400"></i>
                        </div>

                        <p class="text-sm font-semibold text-gray-700">
                          No items added yet
                        </p>

                        <p class="mt-1 text-xs text-gray-500">
                          Add items to this delivery order to get started.
                        </p>
                      </div>
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            </div>

            <!-- Add Item -->
            <div
              class="flex flex-col gap-3 border-t border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
            >
              <p class="text-xs text-gray-500">
                Make sure the delivered quantities are correct before saving.
              </p>

              <p-button
                label="Add Item"
                icon="pi pi-plus"
                severity="info"
                [outlined]="true"
                styleClass="w-full rounded-lg px-4 py-2 sm:w-auto"
                (onClick)="addItem()"
              ></p-button>
            </div>
          </section>
        </div>
      </div>
    </div>
  `,
  styleUrl: './delivery-order-form.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeliveryOrderForm implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messageService = inject(MessageService);
  private readonly projectService = inject(ProjectService);
  private readonly deliveryOrderService = inject(DeliveryOrderService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly loadingService = inject(LoadingService);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  doForm!: FormGroup;
  projectForm!: FormGroup;

  currentId: string = '';

  showProjectDialog: boolean = false;
  showCompanyDialog: boolean = false;

  companySelection: any[] = [];
  supplierSelection: any[] = [];
  salesOrderSelection: any[] = [];
  projectSelection: any[] = [];
  userSelection: any[] = [];

  selectedReceiverAddress: any = null;
  selectedSenderAddress: any = null;

  ngOnInit(): void {
    this.initForm();
    this.getDropdown();
    this.currentId = this.activatedRoute.snapshot.queryParams['id'];

    if (this.currentId) {
      this.doForm.get('id')?.enable();
      this.doForm.get('id')?.patchValue(this.currentId);
      this.patchData();
    } else {
      this.generateDONo();
    }
  }

  initForm() {
    this.doForm = new FormGroup({
      id: new FormControl<string | null>({ value: null, disabled: true }),
      deliveryOrderNo: new FormControl<string | null>(null),
      projectId: new FormControl<string | null>(null),
      salesOrderId: new FormControl<string | null>(null),
      senderCompanyId: new FormControl<string | null>(
        null,
        Validators.required,
      ),
      receiverCompanyId: new FormControl<string | null>(
        null,
        Validators.required,
      ),
      deliveryMethod: new FormControl<string | null>(null),
      deliveryMethodOther: new FormControl<string | null>(null),
      notes: new FormControl<string | null>(null),
      remarks: new FormControl<string | null>(null),
      paymentTerms: new FormControl<string | null>(null),
      receiverAddress: new FormControl<string | null>({
        value: null,
        disabled: true,
      }),
      receiverContactPerson: new FormControl<string | null>({
        value: null,
        disabled: true,
      }),
      receiverContactNo: new FormControl<string | null>({
        value: null,
        disabled: true,
      }),
      deliveryOrderItems: new FormArray([]),
    });

    this.formOnChanges();
  }

  formOnChanges() {
    this.doForm.get('salesOrderId')?.valueChanges.subscribe((soId) => {
      const selectedSO = this.salesOrderSelection.find((x) => x.value === soId);

      if (!selectedSO) return;

      this.doForm.get('projectId')?.patchValue(selectedSO.projectId);
      this.doForm.get('paymentTerms')?.patchValue(selectedSO.terms);

      const items = selectedSO.salesOrderItems || [];

      this.Items.clear();

      items.forEach((item: any) => {
        this.Items.push(
          this.fb.group({
            id: [null],
            salesOrderItemId: [item.id],
            description: [item.description],
            quantityOrdered: [item.quantity],
            quantityDelivered: [0],
            unit: [item.unit],
            unitPrice: [item.unitPrice],
            taxRate: [item.taxRate],
            taxAmount: [item.taxAmount],
            total: [item.total],
            remarks: [null],
          }),
        );
      });

      this.cdr.markForCheck();
    });

    this.doForm.get('receiverCompanyId')?.valueChanges.subscribe((id) => {
      const company = this.companySelection.find(
        (c) => c.id === id || c.value === id,
      );

      if (!company) {
        this.selectedReceiverAddress = null;
        return;
      }

      this.selectedReceiverAddress = company.deliveryAddress || null;

      let legacyFullAddress = '';
      if (company.deliveryAddress) {
        const { addressLine1, addressLine2, postcode, city, state, country } =
          company.deliveryAddress;

        legacyFullAddress = [
          addressLine1,
          addressLine2,
          `${postcode || ''} ${city || ''}`.trim(),
          state,
          country,
        ]
          .filter((segment) => segment && segment.trim() !== '')
          .join(', ');
      }

      this.doForm.patchValue({
        receiverAddress: legacyFullAddress,
        receiverContactPerson: company.contactPerson1 || '—',
        receiverContactNo: company.contactNo || '—',
      });

      this.cdr.markForCheck();
    });

    this.doForm.get('senderCompanyId')?.valueChanges.subscribe((id) => {
      const company = this.companySelection.find(
        (c) => c.id === id || c.value === id,
      );

      if (!company) {
        this.selectedSenderAddress = null;
        return;
      }

      this.selectedSenderAddress = company.deliveryAddress || null;
      this.cdr.markForCheck();
    });
  }

  generateDONo() {
    this.deliveryOrderService
      .GenerateNo()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.doForm.get('deliveryOrderNo')?.setValue(res.deliveryOrderNo);
          this.cdr.markForCheck();
        },
      });
  }

  getDropdown() {
    this.deliveryOrderService
      .GetDropdown()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();

          this.salesOrderSelection =
            res.salesOrders?.map((q: any) => ({
              label: q.salesOrderNo,
              value: q.id,
              clientId: q.clientId,
              supplierId: q.supplierId,
              projectId: q.projectId,
              terms: q.terms,
              salesOrderItems: q.salesOrderItems,
            })) || [];

          this.companySelection = res.companies.map((c: any) => ({
            label: c.name,
            value: c.id,
            contactPerson1: c.contactPerson1,
            contactNo: c.contactNo,
            deliveryAddress: c.deliveryAddress,
            billingAddress: c.billingAddress,
          }));

          this.projectSelection = res.projects.map((p: any) => ({
            label: p.projectCode + ' - ' + p.projectTitle,
            value: p.id,
          }));

          this.cdr.markForCheck();
        },
      });
  }

  get Items(): FormArray {
    return this.doForm.get('deliveryOrderItems') as FormArray;
  }

  createItem(data?: any): FormGroup {
    return this.fb.group({
      id: [data?.id ?? null],
      description: [data?.description ?? null],
      salesOrderItemId: [data?.salesOrderItemId ?? null],
      quantityOrdered: [data?.quantityOrdered ?? null],
      quantityDelivered: [data?.quantityDelivered ?? null],
      unit: [data?.unit ?? null],
      remarks: [data?.remarks ?? null],
    });
  }

  addItem(item?: any) {
    const newItemGroup = this.createItem(item);

    this.Items.push(newItemGroup);
  }

  removeItem(index: number) {
    this.Items.removeAt(index);
  }

  patchData() {
    this.loadingService.start();
    this.deliveryOrderService
      .GetOne({
        Page: 1,
        PageSize: 1,
        OrderBy: null,
        Includes:
          'DeliveryOrderItems,SenderCompany.DeliveryAddress,ReceiverCompany.DeliveryAddress',
        Select: null,
        Filter: `Id=${this.currentId}`,
      })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();
          this.doForm.patchValue({
            ...res,
          });

          this.Items.clear();

          res?.deliveryOrderItems
            ?.sort((a: any, b: any) => a.sortOrder - b.sortOrder)
            .forEach((item: any) => {
              const group = this.createItem({
                ...item,
                description: denormalizeHtml(item.description),
              });

              this.Items.push(group);
            });

          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loadingService.stop();
        },
      });
  }

  onSave() {
    ValidateAllFormFields(this.doForm);
    if (this.doForm.invalid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Please fill all required fields.',
      });
      return;
    }

    const formData = new FormData();

    const raw = this.doForm.getRawValue();

    Object.keys(raw).forEach((key) => {
      const value = (raw as any)[key];

      if (key === 'deliveryOrderItems') return;

      if (value === null || value === undefined) return;

      formData.append(key, value instanceof Date ? value.toISOString() : value);
    });

    const items = raw.deliveryOrderItems.map((item: any) => ({
      ...item,
      description: normalizeHtml(item.description),
    }));

    formData.append('deliveryOrderItems', JSON.stringify(items));
    if (this.currentId) {
      formData.append('id', this.currentId);
    }

    const action$ = this.currentId
      ? this.deliveryOrderService.Update(formData)
      : this.deliveryOrderService.Create(formData);

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
          detail: `DO: ${res.deliveryOrderNo} has been saved`,
        });
        this.router.navigate(['/delivery-orders']);
      }
    });
  }

  AddProject() {
    this.projectForm = new FormGroup({
      id: new FormControl<string | null>({ value: null, disabled: true }),
      projectCode: new FormControl<string | null>(null),
      projectTitle: new FormControl<string | null>(null, Validators.required),
      clientId: new FormControl<string | null>(null, Validators.required),
      startDate: new FormControl<string | null>(null),
      dueDate: new FormControl<Date | null>(null),
      description: new FormControl<string | null>(null),
      priority: new FormControl<string | null>(null),
      projectMembers: new FormControl<string[]>([]),
    });

    this.showProjectDialog = true;
  }

  get selectedTeamMembers() {
    const selectedIds = this.projectForm.get('projectMembers')?.value || [];

    return this.userSelection.filter((u) => selectedIds.includes(u.value));
  }

  RemoveSelectedMember(user: any) {
    const selectedIds = this.projectForm.get('projectMembers')?.value || [];

    const updated = selectedIds.filter((id: string) => id !== user.value);

    this.projectForm.get('projectMembers')?.setValue(updated);
  }

  SaveProject() {
    ValidateAllFormFields(this.projectForm);

    if (!this.projectForm.valid) return;

    this.loadingService.start();
    this.projectService
      .Create(this.projectForm.value)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();
          const newProject = {
            label: `${res.projectCode} - ${res.projectTitle}`,
            value: res.id,
          };

          this.projectSelection = [...this.projectSelection, newProject];

          this.doForm.get('projectId')?.setValue(res.id);

          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `${this.projectForm.get('projectCode')?.value} created and selected successfully`,
            life: 3000,
          });

          this.showProjectDialog = false;
          this.projectForm.reset();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.loadingService.stop();

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail:
              err.error?.message ||
              'Failed to create project. Please try again.',
            life: 5000,
          });

          this.cdr.markForCheck();
        },
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
