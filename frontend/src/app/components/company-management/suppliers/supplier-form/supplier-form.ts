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
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';
import { TextareaModule } from 'primeng/textarea';
import { SupplierService } from '../../../../services/SupplierService';
import { CompanyType } from '../../../../shared/enum/enum';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject, takeUntil, Observable, merge } from 'rxjs';
import { LoadingService } from '../../../../services/loading.service';
import {
  GridifyQueryExtend,
  ValidateAllFormFields,
} from '../../../../shared/helpers/helpers';

@Component({
  selector: 'app-supplier-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    TextareaModule,
    ButtonModule,
    RouterLink,
    SelectModule,
    TabsModule,
    CheckboxModule,
  ],
  template: `
    <div
      class="supplier-form-page min-h-screen w-full bg-slate-50 p-3 sm:p-5 lg:p-6"
    >
      <!-- Breadcrumb -->
      <div class="mb-4 flex flex-wrap items-center gap-2 text-sm text-gray-500">
        <a
          [routerLink]="'/dashboard'"
          class="transition-colors hover:text-blue-700"
        >
          Dashboard
        </a>
        <i class="pi pi-angle-right text-xs text-gray-400"></i>
        <a
          [routerLink]="'/supplier'"
          class="transition-colors hover:text-blue-700"
        >
          Suppliers
        </a>
        <i class="pi pi-angle-right text-xs text-gray-400"></i>
        <span class="font-semibold text-gray-800">
          {{ currentId ? 'Update Supplier' : 'New Supplier' }}
        </span>
      </div>

      <!-- Heading -->
      <div
        class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1
            class="text-xl font-semibold tracking-tight text-gray-800 sm:text-2xl"
          >
            {{
              currentId ? 'Update Supplier Profile' : 'Create Supplier Profile'
            }}
          </h1>
          <p class="mt-1 text-sm text-gray-500">
            Manage supplier information, contact details, billing and delivery
            addresses.
          </p>
        </div>

        <div
          *ngIf="currentId"
          class="inline-flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700"
        >
          <i class="pi pi-building"></i>
          Supplier Profile
        </div>
      </div>

      <!-- Form -->
      <div
        class="supplier-form-container w-full max-w-full rounded-xl border border-gray-200 bg-white shadow-sm"
        [formGroup]="FG"
      >
        <p-tabs value="0" styleClass="supplier-tabs">
          <!-- Tab navigation -->
          <p-tablist styleClass="supplier-tablist">
            <p-tab value="0">
              <span class="flex items-center gap-2 whitespace-nowrap">
                <i class="pi pi-building"></i>
                Details
              </span>
            </p-tab>

            <p-tab value="1">
              <span class="flex items-center gap-2 whitespace-nowrap">
                <i class="pi pi-file-edit"></i>
                Billing Address
              </span>
            </p-tab>

            <p-tab value="2">
              <span class="flex items-center gap-2 whitespace-nowrap">
                <i class="pi pi-truck"></i>
                Delivery Address
              </span>
            </p-tab>
          </p-tablist>

          <p-tabpanels styleClass="supplier-tabpanels">
            <!-- SUPPLIER DETAILS -->
            <p-tabpanel value="0">
              <div class="space-y-6">
                <!-- Section heading -->
                <div>
                  <h2 class="text-base font-semibold text-gray-800">
                    Supplier Information
                  </h2>
                  <p class="mt-1 text-sm text-gray-500">
                    Enter the supplier's general and registration details.
                  </p>
                </div>

                <!-- Logo -->
                <div
                  class="rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-5"
                >
                  <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div
                      class="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white"
                    >
                      <img
                        *ngIf="FG.get('logoImage')?.value"
                        [src]="FG.get('logoImage')?.value"
                        class="h-full w-full object-contain p-2"
                        alt="Supplier Logo"
                      />

                      <i
                        *ngIf="!FG.get('logoImage')?.value"
                        class="pi pi-building text-3xl text-gray-300"
                      ></i>
                    </div>

                    <div class="min-w-0 flex-1">
                      <div class="font-semibold text-gray-800">
                        Supplier Logo
                      </div>

                      <p class="mt-1 text-sm text-gray-500">
                        Upload a supplier logo. Supported formats: JPG, PNG and
                        other image files.
                      </p>

                      <input
                        #file
                        type="file"
                        accept="image/*"
                        (change)="onFileSelected($event)"
                        hidden
                      />

                      <div class="mt-3 flex flex-wrap gap-2">
                        <p-button
                          [label]="
                            FG.get('logoImage')?.value
                              ? 'Change Logo'
                              : 'Upload Logo'
                          "
                          icon="pi pi-upload"
                          severity="secondary"
                          size="small"
                          (onClick)="file.click()"
                        ></p-button>

                        <p-button
                          *ngIf="FG.get('logoImage')?.value"
                          label="Remove"
                          icon="pi pi-trash"
                          severity="danger"
                          [outlined]="true"
                          size="small"
                          (onClick)="removeImage(file, $event)"
                        ></p-button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- General information -->
                <div>
                  <h3
                    class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500"
                  >
                    General Information
                  </h3>

                  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div class="flex flex-col gap-1.5 sm:col-span-2">
                      <label class="text-sm font-medium text-gray-700">
                        Supplier Name <span class="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        pInputText
                        class="w-full"
                        formControlName="name"
                        placeholder="Enter supplier name"
                      />
                      <small
                        *ngIf="
                          FG.get('name')?.hasError('required') &&
                          FG.get('name')?.touched
                        "
                        class="text-red-500"
                      >
                        Supplier name is required.
                      </small>
                    </div>

                    <div class="flex flex-col gap-1.5">
                      <label class="text-sm font-medium text-gray-700">
                        Supplier Email
                      </label>
                      <input
                        type="email"
                        pInputText
                        class="w-full"
                        formControlName="email"
                        placeholder="example@domain.com"
                      />
                      <small
                        *ngIf="
                          FG.get('email')?.hasError('email') &&
                          FG.get('email')?.touched
                        "
                        class="text-red-500"
                      >
                        Please provide a valid email address.
                      </small>
                    </div>

                    <div class="flex flex-col gap-1.5">
                      <label class="text-sm font-medium text-gray-700">
                        Contact Number
                      </label>
                      <input
                        type="text"
                        pInputText
                        class="w-full"
                        formControlName="contactNo"
                        placeholder="Enter contact number"
                      />
                    </div>

                    <div class="flex flex-col gap-1.5">
                      <label class="text-sm font-medium text-gray-700">
                        Fax Number
                      </label>
                      <input
                        type="text"
                        pInputText
                        class="w-full"
                        formControlName="faxNo"
                        placeholder="Enter fax number"
                      />
                    </div>
                  </div>
                </div>

                <div class="border-t border-gray-100 pt-5">
                  <h3
                    class="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500"
                  >
                    Primary Contact Person
                  </h3>
                  <p class="mb-3 text-xs text-gray-400">
                    Main person to contact regarding this company.
                  </p>

                  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div class="flex flex-col gap-1.5 sm:col-span-2">
                      <label class="text-sm font-medium text-gray-700"
                        >Full Name</label
                      >
                      <input
                        type="text"
                        pInputText
                        class="w-full"
                        formControlName="primaryContactPerson"
                        placeholder="Enter primary contact name"
                      />
                    </div>

                    <div class="flex flex-col gap-1.5">
                      <label class="text-sm font-medium text-gray-700"
                        >Contact Number</label
                      >
                      <input
                        type="text"
                        pInputText
                        class="w-full"
                        formControlName="primaryContactNo"
                        placeholder="Enter contact number"
                      />
                    </div>

                    <div class="flex flex-col gap-1.5">
                      <label class="text-sm font-medium text-gray-700"
                        >Email Address</label
                      >
                      <input
                        type="email"
                        pInputText
                        class="w-full"
                        formControlName="primaryEmail"
                        placeholder="Enter email address"
                      />
                      <small
                        *ngIf="
                          FG.get('primaryEmail')?.hasError('email') &&
                          FG.get('primaryEmail')?.touched
                        "
                        class="text-red-500"
                      >
                        Please provide a valid email address.
                      </small>
                    </div>
                  </div>
                </div>

                <div class="border-t border-gray-100 pt-5">
                  <h3
                    class="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500"
                  >
                    Secondary Contact Person
                  </h3>
                  <p class="mb-3 text-xs text-gray-400">
                    Alternative person to contact when the primary contact is
                    unavailable.
                  </p>

                  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div class="flex flex-col gap-1.5 sm:col-span-2">
                      <label class="text-sm font-medium text-gray-700"
                        >Full Name</label
                      >
                      <input
                        type="text"
                        pInputText
                        class="w-full"
                        formControlName="secondaryContactPerson"
                        placeholder="Enter secondary contact name"
                      />
                    </div>

                    <div class="flex flex-col gap-1.5">
                      <label class="text-sm font-medium text-gray-700"
                        >Contact Number</label
                      >
                      <input
                        type="text"
                        pInputText
                        class="w-full"
                        formControlName="secondaryContactNo"
                        placeholder="Enter contact number"
                      />
                    </div>

                    <div class="flex flex-col gap-1.5">
                      <label class="text-sm font-medium text-gray-700"
                        >Email Address</label
                      >
                      <input
                        type="email"
                        pInputText
                        class="w-full"
                        formControlName="secondaryEmail"
                        placeholder="Enter email address"
                      />
                      <small
                        *ngIf="
                          FG.get('secondaryEmail')?.hasError('email') &&
                          FG.get('secondaryEmail')?.touched
                        "
                        class="text-red-500"
                      >
                        Please provide a valid email address.
                      </small>
                    </div>
                  </div>
                </div>

                <!-- Registration -->
                <div class="border-t border-gray-100 pt-5">
                  <h3
                    class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500"
                  >
                    Registration & Financial Details
                  </h3>

                  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div class="flex flex-col gap-1.5">
                      <label class="text-sm font-medium text-gray-700">
                        Account Number (A/C No)
                      </label>
                      <input
                        type="text"
                        pInputText
                        class="w-full"
                        formControlName="acNo"
                        placeholder="Enter account number"
                      />
                    </div>

                    <div class="flex flex-col gap-1.5">
                      <label class="text-sm font-medium text-gray-700">
                        Tax Identification Number (TIN)
                      </label>
                      <input
                        type="text"
                        pInputText
                        class="w-full"
                        formControlName="tinNo"
                        placeholder="Enter TIN number"
                      />
                    </div>

                    <div class="flex flex-col gap-1.5">
                      <label class="text-sm font-medium text-gray-700">
                        SST Registration Number
                      </label>
                      <input
                        type="text"
                        pInputText
                        class="w-full"
                        formControlName="sstRegNo"
                        placeholder="Enter SST registration number"
                      />
                    </div>

                    <div class="flex flex-col gap-1.5">
                      <label class="text-sm font-medium text-gray-700">
                        Website URL
                      </label>
                      <input
                        type="text"
                        pInputText
                        class="w-full"
                        formControlName="websiteUrl"
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </p-tabpanel>

            <!-- BILLING ADDRESS -->
            <p-tabpanel value="1">
              <div class="space-y-5" formGroupName="billingAddress">
                <div>
                  <h2 class="text-base font-semibold text-gray-800">
                    Billing Address
                  </h2>
                  <p class="mt-1 text-sm text-gray-500">
                    Enter the supplier's registered billing address.
                  </p>
                </div>

                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div class="flex flex-col gap-1.5 sm:col-span-2">
                    <label class="text-sm font-medium text-gray-700">
                      Address Line 1
                    </label>
                    <input
                      type="text"
                      pInputText
                      class="w-full"
                      formControlName="addressLine1"
                      placeholder="Street address, P.O. box"
                    />
                  </div>

                  <div class="flex flex-col gap-1.5 sm:col-span-2">
                    <label class="text-sm font-medium text-gray-700">
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      pInputText
                      class="w-full"
                      formControlName="addressLine2"
                      placeholder="Apartment, suite, unit, building"
                    />
                  </div>

                  <div class="flex flex-col gap-1.5">
                    <label class="text-sm font-medium text-gray-700"
                      >City</label
                    >
                    <input
                      type="text"
                      pInputText
                      class="w-full"
                      formControlName="city"
                      placeholder="City"
                    />
                  </div>

                  <div class="flex flex-col gap-1.5">
                    <label class="text-sm font-medium text-gray-700"
                      >Postcode</label
                    >
                    <input
                      type="text"
                      pInputText
                      class="w-full"
                      formControlName="postcode"
                      placeholder="Postcode"
                    />
                  </div>

                  <div class="flex flex-col gap-1.5">
                    <label class="text-sm font-medium text-gray-700"
                      >State</label
                    >
                    <input
                      type="text"
                      pInputText
                      class="w-full"
                      formControlName="state"
                      placeholder="State"
                    />
                  </div>

                  <div class="flex flex-col gap-1.5">
                    <label class="text-sm font-medium text-gray-700"
                      >Country</label
                    >
                    <input
                      type="text"
                      pInputText
                      class="w-full"
                      formControlName="country"
                      placeholder="Country"
                    />
                  </div>
                </div>
              </div>
            </p-tabpanel>

            <!-- DELIVERY ADDRESS -->
            <p-tabpanel value="2">
              <div class="space-y-5">
                <div>
                  <h2 class="text-base font-semibold text-gray-800">
                    Delivery Address
                  </h2>
                  <p class="mt-1 text-sm text-gray-500">
                    Specify where goods or documents should be delivered.
                  </p>
                </div>

                <div
                  class="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 p-3 sm:items-center"
                >
                  <p-checkbox
                    formControlName="sameAsBillingAddress"
                    [binary]="true"
                    inputId="syncAddress"
                  ></p-checkbox>

                  <label
                    class="cursor-pointer select-none text-sm leading-5 text-blue-800"
                    for="syncAddress"
                  >
                    Same as billing address. Automatically synchronise billing
                    and delivery addresses.
                  </label>
                </div>

                <div
                  class="grid grid-cols-1 gap-4 sm:grid-cols-2"
                  formGroupName="deliveryAddress"
                >
                  <div class="flex flex-col gap-1.5 sm:col-span-2">
                    <label class="text-sm font-medium text-gray-700">
                      Address Line 1
                    </label>
                    <input
                      type="text"
                      pInputText
                      class="w-full"
                      formControlName="addressLine1"
                      placeholder="Street address, P.O. box"
                    />
                  </div>

                  <div class="flex flex-col gap-1.5 sm:col-span-2">
                    <label class="text-sm font-medium text-gray-700">
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      pInputText
                      class="w-full"
                      formControlName="addressLine2"
                      placeholder="Apartment, suite, unit, building"
                    />
                  </div>

                  <div class="flex flex-col gap-1.5">
                    <label class="text-sm font-medium text-gray-700"
                      >City</label
                    >
                    <input
                      type="text"
                      pInputText
                      class="w-full"
                      formControlName="city"
                      placeholder="City"
                    />
                  </div>

                  <div class="flex flex-col gap-1.5">
                    <label class="text-sm font-medium text-gray-700"
                      >Postcode</label
                    >
                    <input
                      type="text"
                      pInputText
                      class="w-full"
                      formControlName="postcode"
                      placeholder="Postcode"
                    />
                  </div>

                  <div class="flex flex-col gap-1.5">
                    <label class="text-sm font-medium text-gray-700"
                      >State</label
                    >
                    <input
                      type="text"
                      pInputText
                      class="w-full"
                      formControlName="state"
                      placeholder="State"
                    />
                  </div>

                  <div class="flex flex-col gap-1.5">
                    <label class="text-sm font-medium text-gray-700"
                      >Country</label
                    >
                    <input
                      type="text"
                      pInputText
                      class="w-full"
                      formControlName="country"
                      placeholder="Country"
                    />
                  </div>
                </div>
              </div>
            </p-tabpanel>
          </p-tabpanels>
        </p-tabs>
      </div>

      <!-- Action footer -->
      <div
        class="sticky bottom-0 z-10 mt-4 rounded-xl border border-gray-200 bg-white/95 p-3 shadow-sm backdrop-blur sm:p-4"
      >
        <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <p-button
            label="Discard"
            severity="secondary"
            [outlined]="true"
            styleClass="w-full sm:w-auto"
            [routerLink]="'/supplier'"
          ></p-button>

          <p-button
            [label]="currentId ? 'Save Changes' : 'Create Supplier'"
            icon="pi pi-save"
            severity="primary"
            styleClass="w-full sm:w-auto bg-blue-700! border-none! hover:bg-blue-500!"
            (onClick)="SaveSupplier()"
          ></p-button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './supplier-form.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupplierForm implements OnInit, OnDestroy {
  private readonly confirmationService = inject(ConfirmationService);
  private readonly loadingService = inject(LoadingService);
  private readonly supplierService = inject(SupplierService);
  private readonly messageService = inject(MessageService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  protected ngUnsubscribe: Subject<void> = new Subject<void>();
  private addressSyncSub: Subject<void> = new Subject<void>();

  Query: GridifyQueryExtend = {} as GridifyQueryExtend;
  currentId: string | null = null;
  FG!: FormGroup;

  constructor() {}

  initForm() {
    this.FG = new FormGroup({
      id: new FormControl<string | null>({ value: null, disabled: true }),
      name: new FormControl<string | null>(null, Validators.required),
      logoImage: new FormControl<string | null>(null),
      contactNo: new FormControl<string | null>(null),
      primaryContactPerson: new FormControl<string | null>(null),
      primaryContactNo: new FormControl<string | null>(null),
      primaryEmail: new FormControl<string | null>(null, Validators.email),
      secondaryContactPerson: new FormControl<string | null>(null),
      secondaryContactNo: new FormControl<string | null>(null),
      secondaryEmail: new FormControl<string | null>(null, Validators.email),
      faxNo: new FormControl<string | null>(null),
      acNo: new FormControl<string | null>(null),
      email: new FormControl<string | null>(null, Validators.email),
      websiteUrl: new FormControl<string | null>(null),
      type: new FormControl<CompanyType | null>(CompanyType.Supplier),
      tinNo: new FormControl<string | null>(null),
      sstRegNo: new FormControl<string | null>(null),
      sameAsBillingAddress: new FormControl<boolean>(false),
      billingAddress: this.createAddressGroup(),
      deliveryAddress: this.createAddressGroup(),
    });
  }

  createAddressGroup(): FormGroup {
    return new FormGroup({
      addressLine1: new FormControl(null),
      addressLine2: new FormControl(null),
      city: new FormControl(null),
      state: new FormControl(null),
      country: new FormControl(null),
      postcode: new FormControl(null),
    });
  }

  ngOnInit(): void {
    this.currentId = this.activatedRoute.snapshot.queryParams['id'];
    this.initForm();
    if (this.currentId) {
      this.FG.get('id')?.enable();
      this.GetData();
    }

    this.setupAddressSyncListener();
  }

  setupAddressSyncListener() {
    this.FG.get('sameAsBillingAddress')
      ?.valueChanges.pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((checked: boolean) => {
        this.addressSyncSub.next();
        this.addressSyncSub.complete();
        this.addressSyncSub = new Subject<void>();

        if (checked) {
          const billingGroup = this.FG.get('billingAddress') as FormGroup;
          const deliveryGroup = this.FG.get('deliveryAddress') as FormGroup;

          deliveryGroup.patchValue(billingGroup.value, { emitEvent: false });

          merge(
            billingGroup.valueChanges.pipe(takeUntil(this.addressSyncSub)),
            deliveryGroup.valueChanges.pipe(takeUntil(this.addressSyncSub)),
          ).subscribe(() => {
            const activeElement = document.activeElement;

            if (activeElement?.closest('[formGroupName="billingAddress"]')) {
              deliveryGroup.patchValue(billingGroup.value, {
                emitEvent: false,
              });
            } else if (
              activeElement?.closest('[formGroupName="deliveryAddress"]')
            ) {
              billingGroup.patchValue(deliveryGroup.value, {
                emitEvent: false,
              });
            }
            this.cdr.markForCheck();
          });
        }
      });
  }

  GetData() {
    this.supplierService
      .GetOne({
        Page: 1,
        PageSize: 1,
        Select: null,
        OrderBy: null,
        Includes: 'DeliveryAddress,BillingAddress',
        Filter: `Id=${this.currentId}`,
      })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          if (res) {
            this.loadingService.stop();
            this.FG.patchValue(res);
            this.FG.get('billingAddress')?.patchValue(res.billingAddress ?? {});
            this.FG.get('deliveryAddress')?.patchValue(
              res.deliveryAddress ?? {},
            );
            if (this.FG.get('sameAsBillingAddress')?.value) {
              const deliveryGroup = this.FG.get('deliveryAddress');
              deliveryGroup?.disable({ emitEvent: false });
            }
            this.cdr.markForCheck();
          }
        },
        error: () => {
          this.loadingService.stop();
        },
      });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Invalid File',
        detail: 'Please upload an image file',
      });

      input.value = '';
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      this.FG.patchValue({
        logoImage: reader.result as string,
      });

      this.cdr.markForCheck();
    };

    reader.readAsDataURL(file);
  }

  removeImage(fileInput: HTMLInputElement, event: any) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Remove this image?',
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.FG.patchValue({ logoImage: null });
        fileInput.value = '';
        this.cdr.detectChanges();
      },
    });
  }

  SaveSupplier(): void {
    if (this.FG.invalid) {
      ValidateAllFormFields(this.FG);
      return;
    }

    const payload = this.FG.getRawValue();
    this.loadingService.start();

    const request$: Observable<any> = this.currentId
      ? this.supplierService.Update(payload)
      : this.supplierService.Create(payload);

    request$.pipe(takeUntil(this.ngUnsubscribe)).subscribe({
      next: (res) => {
        this.loadingService.stop();

        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `${res?.name || 'Supplier'} has been ${
            this.currentId ? 'updated' : 'created'
          } successfully`,
        });

        this.router.navigate(['/supplier']);
      },
      error: (err: any) => {
        this.loadingService.stop();

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail:
            err.error?.message ||
            err.error?.Message ||
            'Something went wrong. Please try again.',
        });
      },
    });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.addressSyncSub.next();
    this.addressSyncSub.complete();
    this.loadingService.stop();
  }
}
