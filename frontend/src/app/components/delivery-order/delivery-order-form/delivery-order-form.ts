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
import { DeliveryOrderService } from '../../../services/deliveryOrderService';
import { LoadingService } from '../../../services/loading.service';
import { Subject, takeUntil } from 'rxjs';
import {
  denormalizeHtml,
  normalizeHtml,
  ValidateAllFormFields,
} from '../../../shared/helpers/helpers';
import { InputNumberModule } from 'primeng/inputnumber';
import { TableModule } from 'primeng/table';
import { EditorModule } from 'primeng/editor';
import { ProjectService } from '../../../services/ProjectService';

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
  template: `<div class="w-full p-6 flex flex-col bg-gray-50 min-h-screen">
    <div
      class="flex flex-row items-center gap-2 text-sm text-gray-500 tracking-wide font-medium"
    >
      <div
        [routerLink]="'/dashboard'"
        class="cursor-pointer hover:text-primary transition-colors"
      >
        Dashboard
      </div>
      <span class="text-gray-300">/</span>
      <div
        [routerLink]="'/delivery-orders/outbound'"
        class="cursor-pointer hover:text-primary transition-colors"
      >
        Delivery Orders
      </div>
      <span class="text-gray-300">/</span>
      <div class="text-gray-800 font-semibold">
        {{ currentId ? doForm.get('deliveryOrderNo')?.value : 'New DO' }}
      </div>
    </div>

    <div
      class="sticky top-0 z-10 px-6 py-4 flex flex-row items-center justify-between border border-gray-200 bg-white shadow-sm rounded-lg mt-4"
    >
      <div
        class="flex flex-row items-center gap-3 font-bold text-gray-800 text-lg"
      >
        <i class="pi pi-file text-primary text-xl"></i>
        <h1>
          {{ currentId ? 'Update Delivery Order' : 'Create Delivery Order' }}
        </h1>
      </div>
      <div class="flex flex-row items-center gap-3">
        <p-button
          label="Cancel"
          severity="secondary"
          [outlined]="true"
          styleClass="py-2 px-4"
          [routerLink]="'/delivery-orders'"
        ></p-button>
        <p-button
          (onClick)="onSave()"
          [label]="currentId ? 'Save Changes' : 'Create'"
          severity="info"
          styleClass="py-2 px-4 shadow-sm"
        ></p-button>
      </div>
    </div>

    <div
      class="mt-4 border border-gray-200 bg-white rounded-lg shadow-sm p-6 flex flex-col"
      [formGroup]="doForm"
    >
      <div class="grid grid-cols-12 gap-x-6 gap-y-5 items-start">
        <div
          class="col-span-12 font-bold text-gray-900 text-xl border-b border-gray-100 pb-2"
        >
          Delivery Order Information
        </div>

        <div class="col-span-12 flex flex-col gap-1.5">
          <label
            class="text-sm font-semibold text-gray-700 flex items-center gap-1.5"
          >
            DO No
            <span class="text-gray-400 text-xs font-normal italic">
              (Optional – auto-generated if left blank)
            </span>
          </label>
          <input
            type="text"
            pInputText
            class="w-full font-medium placeholder:font-normal"
            formControlName="deliveryOrderNo"
            placeholder="Leave blank for auto-generated DO number"
          />
        </div>

        <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
          <label class="text-sm font-semibold text-gray-700">
            Sender <span class="text-red-500">*</span>
          </label>
          <p-select
            appendTo="body"
            styleClass="w-full"
            formControlName="senderCompanyId"
            [options]="companySelection"
            [filter]="true"
          ></p-select>
          <div
            class="mt-2 bg-gray-50 p-5 rounded-lg border border-gray-200 text-sm text-gray-600 space-y-3"
          >
            <div>
              <div
                class="text-xs uppercase tracking-wider font-bold text-gray-400 mb-1"
              >
                Sender Address
              </div>
              <address
                class="not-italic text-gray-800 font-medium space-y-0.5 leading-relaxed"
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
                  {{ selectedSenderAddress.postcode
                  }}{{
                    selectedSenderAddress.postcode && selectedSenderAddress.city
                      ? ' '
                      : ''
                  }}{{ selectedSenderAddress.city }}
                </div>
                <div
                  *ngIf="
                    selectedSenderAddress?.state ||
                    selectedSenderAddress?.country
                  "
                >
                  {{ selectedSenderAddress.state
                  }}{{
                    selectedSenderAddress.state && selectedSenderAddress.country
                      ? ', '
                      : ''
                  }}{{ selectedSenderAddress.country }}
                </div>
                <div
                  *ngIf="!selectedSenderAddress"
                  class="text-gray-400 font-normal italic"
                >
                  No sender address details available.
                </div>
              </address>
            </div>
          </div>
        </div>

        <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
          <div class="flex flex-row justify-between items-center h-5">
            <label class="text-sm font-semibold text-gray-700">
              Receiver <span class="text-red-500">*</span>
            </label>
          </div>
          <p-select
            appendTo="body"
            styleClass="w-full"
            [options]="companySelection"
            [filter]="true"
            formControlName="receiverCompanyId"
          ></p-select>

          <div
            class="mt-2 bg-gray-50 p-5 rounded-lg border border-gray-200 text-sm text-gray-600 space-y-3"
          >
            <div>
              <div
                class="text-xs uppercase tracking-wider font-bold text-gray-400 mb-1"
              >
                Shipping Address
              </div>
              <address
                class="not-italic text-gray-800 font-medium space-y-0.5 leading-relaxed"
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
                  {{ selectedReceiverAddress.postcode
                  }}{{
                    selectedReceiverAddress.postcode &&
                    selectedReceiverAddress.city
                      ? ' '
                      : ''
                  }}{{ selectedReceiverAddress.city }}
                </div>
                <div
                  *ngIf="
                    selectedReceiverAddress?.state ||
                    selectedReceiverAddress?.country
                  "
                >
                  {{ selectedReceiverAddress.state
                  }}{{
                    selectedReceiverAddress.state &&
                    selectedReceiverAddress.country
                      ? ', '
                      : ''
                  }}{{ selectedReceiverAddress.country }}
                </div>
                <div
                  *ngIf="!selectedReceiverAddress"
                  class="text-gray-400 font-normal italic"
                >
                  No address details available.
                </div>
              </address>
            </div>

            <div class="grid grid-cols-2 gap-4 border-t border-gray-100 pt-3">
              <div>
                <span
                  class="text-xs uppercase tracking-wider font-bold text-gray-400 block mb-0.5"
                  >Contact Person</span
                >
                <span class="font-semibold text-gray-800">{{
                  doForm.get('receiverContactPerson')?.value || '—'
                }}</span>
              </div>
              <div>
                <span
                  class="text-xs uppercase tracking-wider font-bold text-gray-400 block mb-0.5"
                  >Phone Number</span
                >
                <span class="font-semibold text-gray-800">{{
                  doForm.get('receiverContactNo')?.value || '—'
                }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
          <label class="text-sm font-semibold text-gray-700 py-1.5"
            >SO No</label
          >
          <p-select
            appendTo="body"
            styleClass="w-full"
            formControlName="salesOrderId"
            [options]="salesOrderSelection"
            [filter]="true"
          ></p-select>
        </div>

        <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
          <div class="flex flex-row items-center justify-between">
            <label class="text-sm font-semibold text-gray-700">Project</label>
            <p-button
              label="Add New Project"
              icon="pi pi-plus-circle"
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
          ></p-select>
        </div>

        <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
          <label class="text-sm font-semibold text-gray-700"
            >Payment Terms</label
          >
          <input
            pInputText
            formControlName="paymentTerms"
            class="w-full"
            placeholder="Specify payment terms..."
          />
        </div>

        <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
          <label class="text-sm font-semibold text-gray-700"
            >Delivery Method</label
          >
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
              { label: '3rd Party Logistics (Grab, Lalamove)', value: '3PL' },
              { label: 'Air Freight', value: 'Air Freight' },
              { label: 'Sea Freight', value: 'Sea Freight' },
              { label: 'Other (Specify)', value: 'Other' },
            ]"
          ></p-select>
          <input
            *ngIf="doForm.get('deliveryMethod')?.value === 'Other'"
            pInputText
            formControlName="deliveryMethodOther"
            class="w-full mt-1.5"
            placeholder="Specify delivery method..."
          />
        </div>

        <div class="col-span-12 flex flex-col gap-1.5">
          <label class="text-sm font-semibold text-gray-700">Remarks</label>
          <textarea
            pTextarea
            formControlName="remarks"
            class="w-full"
            rows="3"
            placeholder="Enter remarks here..."
          ></textarea>
        </div>

        <div
          class="col-span-12 font-bold text-gray-900 text-xl border-b border-gray-100 pb-2 mt-4"
        >
          Items Details
        </div>

        <div class="col-span-12 overflow-x-auto">
          <p-table
            [showGridlines]="true"
            [tableStyle]="{ 'min-width': '65rem', 'table-layout': 'fixed' }"
            [value]="Items.controls"
            styleClass="p-datatable-sm"
          >
            <ng-template #header>
              <tr class="bg-gray-50">
                <th
                  class="text-left font-semibold text-gray-700 text-xs uppercase tracking-wider w-[35%]"
                >
                  Description
                </th>
                <th
                  class="text-center! font-semibold text-gray-700 text-xs uppercase tracking-wider w-[13%]"
                >
                  Qty Ordered
                </th>
                <th
                  class="text-center! font-semibold text-gray-700 text-xs uppercase tracking-wider w-[13%]"
                >
                  Qty Delivered
                </th>
                <th
                  class="text-center! font-semibold text-gray-700 text-xs uppercase tracking-wider w-[10%]"
                >
                  Unit
                </th>
                <th
                  class="text-left font-semibold text-gray-700 text-xs uppercase tracking-wider w-[21%]"
                >
                  Remarks
                </th>
                <th
                  class="text-center! font-semibold text-gray-700 text-xs uppercase tracking-wider w-[8%]"
                >
                  Action
                </th>
              </tr>
            </ng-template>

            <ng-template #body let-row let-i="rowIndex">
              <tr
                [formGroup]="row"
                class="hover:bg-gray-50/50 transition-colors"
              >
                <td class="p-2 align-top">
                  <p-editor
                    formControlName="description"
                    [style]="{ height: '80px' }"
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
                <td class="p-2 align-top">
                  <p-inputNumber
                    formControlName="quantityOrdered"
                    styleClass="w-full"
                    inputStyleClass="w-full text-center"
                  ></p-inputNumber>
                </td>
                <td class="p-2 align-top">
                  <p-inputNumber
                    formControlName="quantityDelivered"
                    styleClass="w-full"
                    inputStyleClass="w-full text-center"
                  ></p-inputNumber>
                </td>
                <td class="p-2 align-top">
                  <input
                    pInputText
                    class="w-full text-center"
                    formControlName="unit"
                  />
                </td>
                <td class="p-2 align-top">
                  <input pInputText formControlName="remarks" class="w-full" />
                </td>
                <td class="p-2 align-top text-center">
                  <div class="flex justify-center">
                    <p-button
                      icon="pi pi-trash"
                      severity="danger"
                      size="small"
                      [text]="true"
                      styleClass="mx-auto"
                      (onClick)="removeItem(i)"
                    ></p-button>
                  </div>
                </td>
              </tr>
            </ng-template>

            <ng-template #emptymessage>
              <tr>
                <td
                  colspan="6"
                  class="p-8 text-center text-sm text-gray-400 font-medium"
                >
                  <i class="pi pi-box text-2xl block mb-2 text-gray-300"></i>
                  No items have been added yet.
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>

        <div class="col-span-12 flex justify-start">
          <p-button
            label="Add Item"
            styleClass="rounded-full px-4 py-2"
            icon="pi pi-plus-circle"
            size="small"
            (onClick)="addItem()"
          ></p-button>
        </div>

        <!-- <div
          class="col-span-12 flex justify-end mt-4 border-t border-gray-100 pt-6"
        >
          <div
            class="w-[320px] bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3 text-sm text-gray-600"
          >
            <div class="flex justify-between items-center">
              <span>Subtotal</span>
              <span class="font-medium text-gray-900">{{
                doForm.get('subTotal')?.value | number: '1.2-2'
              }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span>Tax</span>
              <span class="font-medium text-gray-900">{{
                doForm.get('taxAmount')?.value | number: '1.2-2'
              }}</span>
            </div>
            <div
              class="flex justify-between items-center border-t border-gray-200 pt-2 font-bold text-base text-gray-900"
            >
              <span>Total</span>
              <span class="text-primary">{{
                doForm.get('totalAmount')?.value | number: '1.2-2'
              }}</span>
            </div>
          </div>
        </div> -->
      </div>
    </div>
  </div>`,
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

    // this.Items.valueChanges.subscribe((items) => {
    //   let subTotal = 0;
    //   let taxTotal = 0;

    //   items.forEach((item: any) => {
    //     const lineTotal = item.quantityDelivered * item.unitPrice;
    //     const tax = (lineTotal * item.taxRate) / 100;

    //     item.total = lineTotal + tax;
    //     item.taxAmount = tax;

    //     subTotal += lineTotal;
    //     taxTotal += tax;
    //   });

    //   this.doForm.patchValue(
    //     {
    //       subTotal,
    //       taxAmount: taxTotal,
    //       totalAmount: subTotal + taxTotal,
    //     },
    //     { emitEvent: false },
    //   );

    //   this.cdr.markForCheck();
    // });
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

          this.salesOrderSelection = res.salesOrders?.map((q: any) => ({
            label: q.salesOrderNo,
            value: q.id,
            clientId: q.clientId,
            supplierId: q.supplierId,
            projectId: q.projectId,
            salesOrderItems: q.salesOrderItems,
          }));

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
