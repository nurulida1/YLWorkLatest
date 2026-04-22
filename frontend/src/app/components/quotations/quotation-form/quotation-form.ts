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
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { LoadingService } from '../../../services/loading.service';
import { QuotationService } from '../../../services/quotationService.service';
import { MessageService } from 'primeng/api';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, map, of, Subject, switchMap, takeUntil } from 'rxjs';
import { ValidateAllFormFields } from '../../../shared/helpers/helpers';
import { CompanyService } from '../../../services/companyService';
import { CompanyType } from '../../../shared/enum/enum';
import { DatePickerModule } from 'primeng/datepicker';
import { EditorModule } from 'primeng/editor';
import { ClientService } from '../../../services/ClientService';
import { DialogModule } from 'primeng/dialog';
import { TabsModule } from 'primeng/tabs';
import { CheckboxModule } from 'primeng/checkbox';

@Component({
  selector: 'app-quotation-form',
  imports: [
    CommonModule,
    InputTextModule,
    TableModule,
    ButtonModule,
    ReactiveFormsModule,
    TextareaModule,
    InputNumberModule,
    SelectModule,
    RouterLink,
    DatePickerModule,
    EditorModule,
    DialogModule,
    TabsModule,
    CheckboxModule,
  ],
  template: `<div class="w-full p-5 flex flex-col">
      <div
        class="flex flex-row items-center gap-1 text-gray-500 text-[15px] tracking-wide"
      >
        <div
          [routerLink]="'/dashboard'"
          class="cursor-pointer hover:text-gray-600"
        >
          Dashboard
        </div>
        /
        <div
          [routerLink]="'/quotations'"
          class="cursor-pointer hover:text-gray-600"
        >
          Quotations
        </div>
        /
        <div class="text-gray-700 font-semibold">
          {{ currentId ? FG.get('quotationNo')?.value : 'New Quotation' }}
        </div>
      </div>

      <div
        class="px-5 py-2 flex flex-row items-center justify-between border border-gray-200 bg-white mt-3"
      >
        <div class="flex flex-row items-center gap-2 font-semibold">
          <i class="pi pi-file"></i>
          <div>{{ currentId ? 'Update Quote' : 'Create Quote' }}</div>
        </div>
        <div class="flex flex-row items-center gap-2">
          <p-button
            label="Cancel"
            severity="secondary"
            [outlined]="true"
            styleClass="py-1.5! px-4!"
            [routerLink]="'/quotations'"
            size="small"
          ></p-button>
          <!-- <p-button
          label="Save As Draft"
          severity="info"
          [outlined]="true"
          styleClass="py-1.5!"
          size="small"
        ></p-button> -->
          <p-button
            (onClick)="SaveQuotation()"
            [label]="currentId ? 'Save Changes' : 'Create'"
            severity="info"
            styleClass="py-1.5! px-4!"
            size="small"
          ></p-button>
        </div>
      </div>
      <div class="mt-3 border border-gray-200 bg-white p-5 flex flex-col">
        <div class="grid grid-cols-12 gap-4 items-center" [formGroup]="FG">
          <div class="col-span-12 font-semibold text-lg">
            Quotes Information
          </div>
          <div class="col-span-12 lg:col-span-6 gap-2">
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
          <div class="col-span-12 lg:col-span-6 gap-2">
            <div class="flex flex-row justify-between items-center">
              <div>Bill To <span class="text-red-500">*</span></div>
              <p-button
                label="Add New Client"
                icon="pi pi-plus-circle"
                size="small"
                severity="info"
                [text]="true"
                (onClick)="AddClientClick()"
              ></p-button>
            </div>
            <p-select
              [filter]="true"
              [options]="clientSelection || []"
              appendTo="body"
              styleClass="w-full!"
              formControlName="clientId"
              [showClear]="FG.get('clientId')?.value"
            ></p-select>
          </div>
          <div class="col-span-12 lg:col-span-6">
            <div>Reference No <span class="text-red-500">*</span></div>
            <input
              type="text"
              pInputText
              class="w-full"
              formControlName="quotationNo"
            />
          </div>
          <div class="col-span-12 lg:col-span-6 gap-2">
            <div>Quote date <span class="text-red-500">*</span></div>
            <p-datepicker
              appendTo="body"
              styleClass="w-full!"
              formControlName="quotationDate"
              [showIcon]="true"
              dateFormat="dd/mm/yy"
              [showClear]="FG.get('clientId')?.value"
            ></p-datepicker>
          </div>
          <div class="col-span-12">
            <div>Subject <span class="text-red-500">*</span></div>
            <input
              type="text"
              pInputText
              class="w-full"
              formControlName="subject"
            />
          </div>
          <div class="col-span-12 font-semibold text-lg">Items Details</div>
          <div class="col-span-12">
            <p-table
              size="small"
              showGridlines="true"
              [tableStyle]="{ 'min-width': '60rem', 'table-layout': 'fixed' }"
              [value]="Items.controls"
            >
              <ng-template #header>
                <tr>
                  <th class="text-center! text-sm! w-[10%]!">Item</th>
                  <th class="text-center! text-sm! w-[40%]!">Description</th>
                  <th class="text-center! text-sm! w-[10%]!">Unit</th>
                  <th class="text-center! text-sm! w-[10%]!">Qty</th>
                  <th class="text-center! text-sm! w-[20%]!">
                    Unit Price (RM)
                  </th>
                  <th class="text-center! text-sm! w-[20%]!">
                    Total Price (RM)
                  </th>
                  <th class="text-center! text-sm! w-[10%]!">Action</th>
                </tr></ng-template
              >
              <ng-template #body let-row let-i="rowIndex">
                <tr [formGroup]="row">
                  <ng-container
                    *ngIf="
                      row.get('type')?.value === 'Category';
                      else normalRow
                    "
                  >
                    <td colspan="6" class="font-semibold bg-gray-100">
                      <input
                        pInputText
                        formControlName="description"
                        placeholder="Group Title (e.g. CCTV Equipment System)"
                        class="w-full font-semibold"
                      />
                    </td>
                    <td colspan="1" class="bg-gray-100">
                      <p-button
                        icon="pi pi-trash"
                        severity="danger"
                        size="small"
                        [text]="true"
                        (onClick)="removeItem(i)"
                        class="flex items-center justify-center"
                      ></p-button>
                    </td>
                  </ng-container>
                  <ng-template #normalRow>
                    <td class="w-[10%]! text-center!">
                      {{ row.get('isGroup')?.value ? '' : getItemNumber(i) }}
                    </td>

                    <td class="w-[30%]!">
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
                      <input
                        pInputText
                        formControlName="unit"
                        class="w-full text-center!"
                      />
                    </td>

                    <td class="w-[10%]!">
                      <p-inputNumber
                        formControlName="quantity"
                        class="w-full!"
                        inputStyleClass="w-full! text-center!"
                        styleClass="w-full!"
                      />
                    </td>

                    <td class="w-[20%]!">
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

                    <td class="w-[30%]!">
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
                  </ng-template>
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
                label="Add Group"
                styleClass="rounded-full!"
                icon="pi pi-plus-circle"
                severity="info"
                size="small"
                (onClick)="addGroup()"
              ></p-button>
              <p-button
                label="Add Item"
                styleClass="rounded-full!"
                icon="pi pi-plus-circle"
                size="small"
                (onClick)="addItem()"
              ></p-button>
            </div>
          </div>
          <div class="col-span-12 font-semibold text-lg mt-2">
            Terms and Conditions
          </div>
          <div class="col-span-12">
            <p-editor
              formControlName="termsAndConditions"
              [style]="{ height: '320px' }"
            />
          </div>
        </div>
      </div>
    </div>

    <p-dialog
      [(visible)]="visible"
      [modal]="true"
      [closable]="true"
      [draggable]="false"
      styleClass="w-[70%]"
    >
      <ng-template #headless>
        <div class="flex flex-col p-5 gap-2">
          <div class="font-semibold text-lg">Add New Client</div>
          <p-tabs value="0">
            <p-tablist>
              <p-tab value="0">Details</p-tab>
              <p-tab value="1">Delivery Address</p-tab>
              <p-tab value="2">Billing Address</p-tab>
            </p-tablist>
            <p-tabpanels>
              <p-tabpanel value="0">
                <div
                  class="grid grid-cols-12 gap-3 items-center mt-3"
                  [formGroup]="clientForm"
                >
                  <div class="col-span-12 lg:col-span-6 flex flex-col gap-2">
                    <div>Name</div>
                    <input
                      type="text"
                      pInputText
                      class="w-full"
                      formControlName="name"
                    />
                  </div>
                  <div class="col-span-12 lg:col-span-6 flex flex-col gap-2">
                    <div>Email</div>
                    <input
                      type="text"
                      pInputText
                      class="w-full"
                      formControlName="email"
                    />
                  </div>
                  <div class="col-span-12 lg:col-span-6 flex flex-col gap-2">
                    <div>Contact No</div>
                    <input
                      type="text"
                      pInputText
                      class="w-full"
                      formControlName="contactNo"
                    />
                  </div>
                  <div class="col-span-12 lg:col-span-6 flex flex-col gap-2">
                    <div>Fax No</div>
                    <input
                      type="text"
                      pInputText
                      class="w-full"
                      formControlName="faxNo"
                    />
                  </div>
                  <div class="col-span-12 lg:col-span-6 flex flex-col gap-2">
                    <div>Contact Person</div>
                    <input
                      type="text"
                      pInputText
                      class="w-full"
                      formControlName="contactPerson1"
                    />
                  </div>
                  <div class="col-span-12 lg:col-span-6 flex flex-col gap-2">
                    <div>Contact Person 2</div>
                    <input
                      type="text"
                      pInputText
                      class="w-full"
                      formControlName="contactPerson2"
                    />
                  </div>
                  <div class="col-span-12 lg:col-span-6 flex flex-col gap-2">
                    <div>TIN No</div>
                    <input
                      type="text"
                      pInputText
                      class="w-full"
                      formControlName="tinNo"
                    />
                  </div>
                  <div class="col-span-12 lg:col-span-6 flex flex-col gap-2">
                    <div>SST Reg No</div>
                    <input
                      type="text"
                      pInputText
                      class="w-full"
                      formControlName="sstRegNo"
                    />
                  </div>
                  <div class="col-span-12 flex flex-col gap-2">
                    <div>Website Url</div>
                    <input
                      type="text"
                      pInputText
                      class="w-full"
                      formControlName="websiteUrl"
                    />
                  </div>
                </div>
              </p-tabpanel>
              <p-tabpanel value="1">
                <div class="flex flex-col gap-2" [formGroup]="clientForm">
                  <div
                    class="grid grid-cols-12 gap-4 mt-4 items-center"
                    formGroupName="billingAddress"
                  >
                    <div class="col-span-4">Address Line 1</div>
                    <div class="col-span-8">
                      <input
                        type="text"
                        pInputText
                        class="w-full"
                        formControlName="addressLine1"
                      />
                    </div>
                    <div class="col-span-4">Address Line 2</div>
                    <div class="col-span-8">
                      <input
                        type="text"
                        pInputText
                        class="w-full"
                        formControlName="addressLine2"
                      />
                    </div>
                    <div class="col-span-4">City</div>
                    <div class="col-span-8">
                      <input
                        type="text"
                        pInputText
                        class="w-full"
                        formControlName="city"
                      />
                    </div>
                    <div class="col-span-4">Poscode</div>
                    <div class="col-span-8">
                      <input
                        type="text"
                        pInputText
                        class="w-full"
                        formControlName="poscode"
                      />
                    </div>
                    <div class="col-span-4">State</div>
                    <div class="col-span-8">
                      <input
                        type="text"
                        pInputText
                        class="w-full"
                        formControlName="state"
                      />
                    </div>
                    <div class="col-span-4">Country</div>
                    <div class="col-span-8">
                      <input
                        type="text"
                        pInputText
                        class="w-full"
                        formControlName="country"
                      />
                    </div>
                  </div>
                </div>
              </p-tabpanel>
              <p-tabpanel value="2">
                <div class="flex flex-col gap-2" [formGroup]="clientForm">
                  <div class="flex flex-row items-center gap-2">
                    <p-checkbox
                      formControlName="sameAsBillingAddress"
                      [binary]="true"
                    ></p-checkbox>
                    <label class="mt-1 text-sm text-gray-600" for=""
                      >Same with Delivery Address</label
                    >
                  </div>
                  <div class="border-b border-gray-200 mt-2"></div>
                  <div
                    class="grid grid-cols-12 gap-4 mt-4 items-center"
                    formGroupName="deliveryAddress"
                  >
                    <div class="col-span-4">Address Line 1</div>
                    <div class="col-span-8">
                      <input
                        type="text"
                        pInputText
                        class="w-full"
                        formControlName="addressLine1"
                      />
                    </div>
                    <div class="col-span-4">Address Line 2</div>
                    <div class="col-span-8">
                      <input
                        type="text"
                        pInputText
                        class="w-full"
                        formControlName="addressLine2"
                      />
                    </div>
                    <div class="col-span-4">City</div>
                    <div class="col-span-8">
                      <input
                        type="text"
                        pInputText
                        class="w-full"
                        formControlName="city"
                      />
                    </div>
                    <div class="col-span-4">Poscode</div>
                    <div class="col-span-8">
                      <input
                        type="text"
                        pInputText
                        class="w-full"
                        formControlName="poscode"
                      />
                    </div>
                    <div class="col-span-4">State</div>
                    <div class="col-span-8">
                      <input
                        type="text"
                        pInputText
                        class="w-full"
                        formControlName="state"
                      />
                    </div>
                    <div class="col-span-4">Country</div>
                    <div class="col-span-8">
                      <input
                        type="text"
                        pInputText
                        class="w-full"
                        formControlName="country"
                      />
                    </div>
                  </div></div
              ></p-tabpanel>
            </p-tabpanels>
          </p-tabs>

          <div class="flex flex-row items-center gap-2 justify-end">
            <p-button
              label="Discard"
              severity="secondary"
              size="small"
              (onClick)="visible = false"
              styleClass="py-1.5! px-4! border-gray-200!"
            ></p-button>
            <p-button
              label="Create"
              severity="info"
              size="small"
              styleClass="py-1.5! px-4!"
              (onClick)="SaveClient()"
            ></p-button>
          </div>
        </div>
      </ng-template>
    </p-dialog> `,
  styleUrl: './quotation-form.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuotationForm implements OnInit, OnDestroy {
  private readonly loadingService = inject(LoadingService);
  private readonly quotationService = inject(QuotationService);
  private readonly messageService = inject(MessageService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly companyService = inject(CompanyService);
  private readonly clientService = inject(ClientService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  currentId: string | null = null;
  visible: boolean = false;
  FG!: FormGroup;
  clientForm!: FormGroup;

  companySelection: { label: string; value: string }[] = [];
  clientSelection: { label: string; value: string }[] = [];

  ngOnInit(): void {
    this.currentId = this.activatedRoute.snapshot.queryParams['id'];

    this.initForm();

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
        ? this.quotationService.GetOne({
            Page: 1,
            PageSize: 1,
            OrderBy: null,
            Select: null,
            Includes: 'QuotationItems',
            Filter: `Id=${this.currentId}`,
          })
        : of({} as any),
    })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(({ selection, data }) => {
        // ✅ set dropdown first
        this.companySelection = selection.data
          .filter((x) => x.type === CompanyType.Own)
          .map((x) => ({ label: x.name, value: x.id }));

        this.clientSelection = selection.data
          .filter((x) => x.type === CompanyType.Client)
          .map((x) => ({ label: x.name, value: x.id }));

        // ✅ THEN patch form
        if (data && data.id) {
          this.patchData(data);
        }
      });
  }

  patchData(res: any) {
    this.FG.patchValue({
      ...res,
      quotationDate: new Date(res.quotationDate),
    });

    this.Items.clear();

    res.quotationItems
      ?.sort((a: any, b: any) => a.sortOrder - b.sortOrder)
      .forEach((item: any) => {
        const group = this.createItemGroup(item);

        group.patchValue(
          {
            totalPrice: (item.quantity ?? 0) * (item.unitPrice ?? 0),
          },
          { emitEvent: false },
        );

        this.Items.push(group);
      });
    this.calculateTotal();
    this.cdr.markForCheck();
  }

  getSelection() {
    this.companyService
      .GetMany({
        Page: 1,
        PageSize: 1000000,
        OrderBy: 'Name',
        Select: null,
        Filter: null,
        Includes: null,
      })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.companySelection = res.data
            .filter((x) => x.type === CompanyType.Own)
            .map((x) => ({ label: x.name, value: x.id }));

          this.clientSelection = res.data
            .filter((x) => x.type === CompanyType.Client)
            .map((x) => ({ label: x.name, value: x.id }));
        },
      });
  }

  initForm() {
    this.FG = new FormGroup({
      id: new FormControl<string | null>({ value: null, disabled: true }),
      referenceNo: new FormControl<string | null>(null),
      quotationNo: new FormControl<string | null>(null),
      quotationDate: new FormControl<Date | null>(null),
      fromCompanyId: new FormControl<string | null>(null, Validators.required),
      clientId: new FormControl<string | null>(null, Validators.required),
      subject: new FormControl<string | null>(null),
      totalAmount: new FormControl<number | null>(null),
      termsAndConditions: new FormControl<string | null>(null),
      quotationItems: new FormArray([]),
    });
    this.listenItemChanges();
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

  GetData() {
    this.loadingService.start();
    this.quotationService
      .GetOne({
        Page: 1,
        PageSize: 1,
        OrderBy: null,
        Select: null,
        Includes: 'QuotationItems',
        Filter: `Id=${this.currentId}`,
      })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          if (res) {
            this.loadingService.stop();
            this.FG.patchValue({
              ...res,
              quotationDate: new Date(res.quotationDate),
            });
            this.Items.clear();

            if (res.quotationItems?.length) {
              res.quotationItems.forEach((item: any) => {
                const group = this.createItemGroup(item);

                // ensure total is recalculated properly
                const qty = item.quantity ?? 0;
                const price = item.unitPrice ?? 0;

                group.patchValue(
                  {
                    totalPrice: qty * price,
                  },
                  { emitEvent: false },
                );

                this.Items.push(group);
              });
            }

            // 4. recompute totals once
            this.calculateTotal();

            this.cdr.markForCheck();
          }
        },
        error: (err) => {
          this.loadingService.stop();
        },
      });
  }

  private buildQuotationItemsPayload() {
    const items = this.Items.getRawValue();

    return items.map((x, index) => ({
      id: x.id || null,
      type: x.type, // ✅ REQUIRED
      parentId: x.parentId || null,

      description: x.description,
      quantity: x.quantity,
      unit: x.unit,
      unitPrice: x.unitPrice,
      totalPrice: x.quantity * x.unitPrice,
      sortOrder: index,

      children: [],
    }));
  }

  getItemNumber(index: number): number {
    let count = 0;

    for (let i = 0; i <= index; i++) {
      const item = this.Items.at(i);
      if (!item.get('isGroup')?.value) {
        count++;
      }
    }

    return count;
  }

  listenItemChanges() {
    this.Items.valueChanges
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        this.Items.controls.forEach((group: any) => {
          const qty = group.get('quantity')?.value || 0;
          const price = group.get('unitPrice')?.value || 0;
          const total = qty * price;

          group.get('totalPrice')?.setValue(total, { emitEvent: false });
        });

        this.calculateTotal();
      });
  }

  addItem(parentGroupId: string | null = null) {
    this.Items.push(
      this.createItemGroup({
        type: 'Item',
        isGroup: false,
        parentId: parentGroupId,
      }),
    );
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

    this.calculateTotal();
  }

  addGroup() {
    const groupId = crypto.randomUUID();

    this.Items.push(
      this.createItemGroup({
        id: groupId,
        type: 'Category',
        isGroup: true,
        description: 'New Group',
      }),
    );
  }

  calculateTotal() {
    const total = this.Items.controls.reduce((sum: number, group: any) => {
      return sum + (group.get('totalPrice')?.value || 0);
    }, 0);

    this.FG.get('totalAmount')?.setValue(total, { emitEvent: false });
  }

  get Items(): FormArray {
    return this.FG.get('quotationItems') as FormArray;
  }

  AddClientClick() {
    this.initClientForm();
    this.visible = true;
    this.cdr.detectChanges();
  }

  initClientForm() {
    this.clientForm = new FormGroup({
      name: new FormControl<string | null>(null, Validators.required),
      logoImage: new FormControl<string | null>(null),
      contactNo: new FormControl<string | null>(null),
      contactPerson1: new FormControl<string | null>(null),
      contactPerson2: new FormControl<string | null>(null),
      faxNo: new FormControl<string | null>(null),
      acNo: new FormControl<string | null>(null),
      email: new FormControl<string | null>(null, Validators.email),
      websiteUrl: new FormControl<string | null>(null),
      type: new FormControl<CompanyType | null>(CompanyType.Client),
      tinNo: new FormControl<string | null>(null),
      sstRegNo: new FormControl<string | null>(null),
      sameAsBillingAddress: new FormControl<boolean>(false),
      billingAddress: this.createAddressGroup(),
      deliveryAddress: this.createAddressGroup(),
    });
    this.SameAddressOnChanges();
  }

  SameAddressOnChanges() {
    this.clientForm
      .get('sameAsBillingAddress')
      ?.valueChanges.pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((checked: boolean) => {
        if (checked) {
          const billing = this.clientForm.get('billingAddress')?.value;

          this.clientForm.get('deliveryAddress')?.patchValue(billing);
          this.clientForm.get('deliveryAddress')?.disable(); // optional UX
        } else {
          this.clientForm.get('deliveryAddress')?.enable();
        }
      });
  }

  createAddressGroup(): FormGroup {
    return new FormGroup({
      addressLine1: new FormControl(null),
      addressLine2: new FormControl(null),
      city: new FormControl(null),
      state: new FormControl(null),
      country: new FormControl(null),
      poscode: new FormControl(null),
    });
  }

  SaveClient() {
    if (!this.clientForm.valid) {
      ValidateAllFormFields(this.clientForm);
      return;
    }

    const payload = this.clientForm.getRawValue();

    this.loadingService.start();

    this.clientService
      .Create(payload)
      .pipe(
        switchMap((res) => {
          const newClientId = res?.id;

          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Client created successfully',
          });

          this.visible = false;

          // return refresh observable (IMPORTANT)
          return this.companyService
            .GetMany({
              Page: 1,
              PageSize: 1000000,
              OrderBy: 'Name',
              Select: null,
              Filter: null,
              Includes: null,
            })
            .pipe(map((clientRes) => ({ clientRes, newClientId })));
        }),
        takeUntil(this.ngUnsubscribe),
      )
      .subscribe({
        next: ({ clientRes, newClientId }) => {
          this.loadingService.stop();

          this.clientSelection = clientRes.data
            .filter((x) => x.type === CompanyType.Client)
            .map((x) => ({ label: x.name, value: x.id }));

          // auto select new client
          this.FG.get('clientId')?.setValue(newClientId);

          this.cdr.markForCheck();
        },
        error: () => {
          this.loadingService.stop();
        },
      });
  }

  SaveQuotation() {
    if (this.FG.valid) {
      this.loadingService.start();
      const payload = {
        ...this.FG.getRawValue(),
        quotationItems: this.buildQuotationItemsPayload(),
      };
      const request$ = this.currentId
        ? this.quotationService.Update(payload)
        : this.quotationService.Create(payload);

      request$.pipe(takeUntil(this.ngUnsubscribe)).subscribe({
        next: (res) => {
          this.loadingService.stop();
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `${res.quotationNo} has been successfully ${this.currentId ? 'updated' : 'added'}`,
          });

          this.router.navigate(['/quotations']);
        },
        error: (err) => {
          this.loadingService.stop();
        },
      });
    }
    ValidateAllFormFields(this.FG);
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
