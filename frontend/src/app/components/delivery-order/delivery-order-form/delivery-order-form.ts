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
import { ValidateAllFormFields } from '../../../shared/helpers/helpers';
import { InputNumberModule } from 'primeng/inputnumber';
import { TableModule } from 'primeng/table';
import { EditorModule } from 'primeng/editor';

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
  template: `<div class="w-full p-5 flex flex-col">
    <div class="flex flex-row items-center gap-1 text-gray-500 tracking-wide">
      <div
        [routerLink]="'/dashboard'"
        class="cursor-pointer hover:text-gray-600"
      >
        Dashboard
      </div>
      /
      <div
        [routerLink]="'/delivery-orders/outbound'"
        class="cursor-pointer hover:text-gray-600"
      >
        Outbound Delivery Orders
      </div>
      /
      <div class="text-gray-700 font-semibold">
        {{
          currentId ? doForm.get('deliveryOrderNo')?.value : 'New Outbound DO'
        }}
      </div>
    </div>
    <div
      class="px-5 py-2 flex flex-row items-center justify-between border border-gray-200 bg-white mt-3"
    >
      <div class="flex flex-row items-center gap-2 font-semibold">
        <i class="pi pi-file"></i>
        <div>
          {{ currentId ? 'Update Outbound DO' : 'Create Outbound DO' }}
        </div>
      </div>
      <div class="flex flex-row items-center gap-2">
        <p-button
          label="Cancel"
          severity="secondary"
          [outlined]="true"
          styleClass="py-1.5! px-4!"
          [routerLink]="'/delivery-orders/outbound'"
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
      <div class="grid grid-cols-12 gap-4 items-center" [formGroup]="doForm">
        <div class="col-span-12 font-semibold text-lg">
          Delivery Order Information
        </div>
        <div class="col-span-12 flex flex-col gap-1">
          <div class="flex items-center justify-between">
            <div>
              DO No
              <span class="text-gray-400 text-xs italic ml-1">
                (Optional – auto-generated if left blank)
              </span>
            </div>
          </div>

          <input
            type="text"
            pInputText
            class="w-full font-semibold! placeholder:font-normal!"
            formControlName="deliveryOrderNo"
            placeholder="Leave blank for auto-generated DO number"
          />
        </div>
        <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
          <div class="mt-2 mb-1">
            Sender <span class="text-red-500">*</span>
          </div>
          <p-select
            appendTo="body"
            styleClass="w-full!"
            formControlName="senderCompanyId"
            [options]="companySelection"
            [filter]="true"
          ></p-select>
        </div>
        <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
          <div class="flex flex-row justify-between items-center">
            <div>Receiver <span class="text-red-500">*</span></div>
            <!-- <p-button
              label="Add New Vendor"
              icon="pi pi-plus-circle"
              size="small"
              severity="info"
              [text]="true"
            ></p-button> -->
          </div>
          <p-select
            appendTo="body"
            styleClass="w-full!"
            [options]="companySelection"
            [filter]="true"
            formControlName="receiverCompanyId"
          ></p-select>
        </div>

        <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
          <div>PO No</div>
          <p-select
            appendTo="body"
            styleClass="w-full!"
            formControlName="purchaseOrderId"
            [options]="purchaseOrderSelection"
            appendTo="body"
            [filter]="true"
          ></p-select>
        </div>
        <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
          <div>Project Code</div>
          <p-select
            appendTo="body"
            styleClass="w-full!"
            formControlName="projectId"
            [options]="projectSelection"
            appendTo="body"
            [filter]="true"
          ></p-select>
        </div>
        <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
          <div>Delivery Method</div>
          <p-select
            appendTo="body"
            styleClass="w-full!"
            formControlName="deliveryMethod"
            appendTo="body"
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
        <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
          <div>Reference No</div>
          <input
            type="text"
            pInputText
            class="w-full"
            formControlName="referenceNo"
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
                <th class="text-center! text-sm! w-[30%]!">Description</th>
                <th class="text-center! text-sm! w-[15%]!">Qty Ordered</th>
                <th class="text-center! text-sm! w-[15%]!">Qty Delivered</th>

                <th class="text-center! text-sm! w-[10%]!">Unit</th>

                <th class="text-center! text-sm! w-[20%]!">Remarks</th>
                <th class="text-center! text-sm! w-[10%]!">Action</th>
              </tr></ng-template
            >
            <ng-template #body let-row let-i="rowIndex">
              <tr [formGroup]="row">
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
                      </span> </ng-template
                  ></p-editor>
                </td>
                <td>
                  <p-inputNumber
                    formControlName="quantityOrdered"
                    class="w-full!"
                    inputStyleClass="w-full! text-center!"
                    styleClass="w-full!"
                  />
                </td>
                <td>
                  <p-inputNumber
                    formControlName="quantityDelivered"
                    class="w-full!"
                    inputStyleClass="w-full! text-center!"
                    styleClass="w-full!"
                  />
                </td>

                <td>
                  <input
                    pInputText
                    class="w-full text-center!"
                    formControlName="unit"
                  />
                </td>
                <td>
                  <input
                    pInputText
                    formControlName="remarks"
                    class="w-full text-center!"
                  />
                </td>

                <td>
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
  private readonly deliveryOrderService = inject(DeliveryOrderService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly loadingService = inject(LoadingService);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  doForm!: FormGroup;
  currentId: string = '';

  companySelection: any[] = [];
  supplierSelection: any[] = [];
  purchaseOrderSelection: any[] = [];
  projectSelection: any[] = [];

  ngOnInit(): void {
    this.initForm();
    this.getDropdown();
    this.currentId = this.activatedRoute.snapshot.queryParams['id'];

    if (this.currentId) {
      this.doForm.get('id')?.enable();
      this.doForm.get('id')?.patchValue(this.currentId);
      this.patchData();
    }
  }

  initForm() {
    this.doForm = new FormGroup({
      id: new FormControl<string | null>({ value: null, disabled: true }),
      deliveryOrderNo: new FormControl<string | null>(null),
      type: new FormControl<string>('Outbound'),
      projectId: new FormControl<string | null>(null),
      purchaseOrderId: new FormControl<string | null>(null),
      referenceNo: new FormControl<string | null>(null),
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
      deliveryOrderItems: new FormArray([]),
    });
  }

  getDropdown() {
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
        Includes: 'DeliveryOrderItems',
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

          if (res?.deliveryOrderItems)
            res.deliveryOrderItems.forEach((item: any) => {
              this.Items.push(this.createItem(item));
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

    formData.append(
      'deliveryOrderItems',
      JSON.stringify(raw.deliveryOrderItems),
    );
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
        this.router.navigate(['/delivery-orders/outbound']);
      }
    });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
