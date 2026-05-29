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
import { SupplierService } from '../../../services/SupplierService';
import { CompanyType } from '../../../shared/enum/enum';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject, takeUntil, Observable, merge } from 'rxjs';
import { LoadingService } from '../../../services/loading.service';
import {
  GridifyQueryExtend,
  ValidateAllFormFields,
} from '../../../shared/helpers/helpers';

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
    <div class="w-full flex flex-col p-6 bg-gray-50 min-h-screen">
      <div
        class="flex flex-row items-center gap-2 text-gray-500 tracking-wide mb-4"
      >
        <span
          class="cursor-pointer hover:text-primary transition-colors"
          [routerLink]="'/dashboard'"
          >Dashboard</span
        >
        <span class="text-gray-400">/</span>
        <span
          class="cursor-pointer hover:text-primary transition-colors"
          [routerLink]="'/supplier'"
          >Suppliers</span
        >
        <span class="text-gray-400">/</span>
        <span class="text-gray-800 font-semibold">
          {{
            currentId
              ? 'Update ' + (FG.get('name')?.value || '')
              : 'New Supplier'
          }}
        </span>
      </div>

      <div
        class="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden"
        [formGroup]="FG"
      >
        <p-tabs value="0">
          <p-tablist class="bg-gray-50 border-b border-gray-200">
            <p-tab value="0" class="font-medium">Details</p-tab>
            <p-tab value="1" class="font-medium">Billing Address</p-tab>
            <p-tab value="2" class="font-medium">Delivery Address</p-tab>
          </p-tablist>

          <p-tabpanels class="p-6">
            <p-tabpanel value="0">
              <div class="grid grid-cols-12 gap-y-5 gap-x-6 items-center">
                <div
                  class="col-span-12 md:col-span-3 font-medium text-gray-700"
                >
                  Supplier Logo
                </div>
                <div class="col-span-12 md:col-span-9">
                  <div class="flex items-center gap-4">
                    <div
                      *ngIf="FG.get('logoImage')?.value"
                      class="relative group"
                    >
                      <img
                        [src]="FG.get('logoImage')?.value"
                        class="w-28 h-28 object-contain border border-gray-200 rounded-lg p-1 bg-gray-50"
                        alt="Supplier Logo"
                      />
                    </div>
                    <input
                      #file
                      type="file"
                      accept="image/*"
                      (change)="onFileSelected($event)"
                      hidden
                    />
                    <div class="flex gap-2">
                      <p-button
                        [label]="
                          FG.get('logoImage')?.value
                            ? 'Reupload'
                            : 'Upload Logo'
                        "
                        severity="secondary"
                        icon="pi pi-upload"
                        size="small"
                        (onClick)="file.click()"
                      ></p-button>
                      <p-button
                        *ngIf="FG.get('logoImage')?.value"
                        label="Remove"
                        severity="danger"
                        icon="pi pi-trash"
                        size="small"
                        [outlined]="true"
                        (onClick)="removeImage(file, $event)"
                      ></p-button>
                    </div>
                  </div>
                </div>

                <div
                  class="col-span-12 md:col-span-3 font-medium text-gray-700"
                >
                  Supplier Name <span class="text-red-500">*</span>
                </div>
                <div class="col-span-12 md:col-span-9">
                  <input
                    type="text"
                    pInputText
                    class="w-full"
                    formControlName="name"
                    placeholder="Enter supplier name"
                  />
                  <div
                    *ngIf="
                      FG.get('name')?.errors?.['required'] &&
                      FG.get('name')?.touched
                    "
                    class="text-red-500 text-xs mt-1"
                  >
                    Name is required.
                  </div>
                </div>

                <div
                  class="col-span-12 md:col-span-3 font-medium text-gray-700"
                >
                  Supplier Email
                </div>
                <div class="col-span-12 md:col-span-9">
                  <input
                    type="email"
                    pInputText
                    class="w-full"
                    formControlName="email"
                    placeholder="example@domain.com"
                  />
                  <div
                    *ngIf="
                      FG.get('email')?.errors?.['email'] &&
                      FG.get('email')?.touched
                    "
                    class="text-red-500 text-xs mt-1"
                  >
                    Please provide a valid email address.
                  </div>
                </div>

                <div
                  class="col-span-12 md:col-span-3 font-medium text-gray-700"
                >
                  Contact / Fax No
                </div>
                <div
                  class="col-span-12 md:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <input
                    type="text"
                    pInputText
                    class="w-full"
                    formControlName="contactNo"
                    placeholder="Contact number"
                  />
                  <input
                    type="text"
                    pInputText
                    class="w-full"
                    formControlName="faxNo"
                    placeholder="Fax number"
                  />
                </div>

                <div
                  class="col-span-12 md:col-span-3 font-medium text-gray-700"
                >
                  Contact Persons
                </div>
                <div
                  class="col-span-12 md:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <input
                    type="text"
                    pInputText
                    class="w-full"
                    formControlName="contactPerson1"
                    placeholder="Primary Contact Person"
                  />
                  <input
                    type="text"
                    pInputText
                    class="w-full"
                    formControlName="contactPerson2"
                    placeholder="Secondary Contact Person"
                  />
                </div>

                <div
                  class="col-span-12 md:col-span-3 font-medium text-gray-700"
                >
                  A/C & TIN No
                </div>
                <div
                  class="col-span-12 md:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <input
                    type="text"
                    pInputText
                    class="w-full"
                    formControlName="acNo"
                    placeholder="Account Number"
                  />
                  <input
                    type="text"
                    pInputText
                    class="w-full"
                    formControlName="tinNo"
                    placeholder="Tax Identification Number"
                  />
                </div>

                <div
                  class="col-span-12 md:col-span-3 font-medium text-gray-700"
                >
                  SST Reg & Website
                </div>
                <div
                  class="col-span-12 md:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <input
                    type="text"
                    pInputText
                    class="w-full"
                    formControlName="sstRegNo"
                    placeholder="SST Registration Number"
                  />
                  <input
                    type="text"
                    pInputText
                    class="w-full"
                    formControlName="websiteUrl"
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            </p-tabpanel>

            <p-tabpanel value="1">
              <div
                class="grid grid-cols-12 gap-y-4 gap-x-6 items-center pt-2"
                formGroupName="billingAddress"
              >
                <div
                  class="col-span-12 md:col-span-3 font-medium text-gray-700"
                >
                  Address Line 1
                </div>
                <div class="col-span-12 md:col-span-9">
                  <input
                    type="text"
                    pInputText
                    class="w-full"
                    formControlName="addressLine1"
                    placeholder="Street address, P.O. box"
                  />
                </div>

                <div
                  class="col-span-12 md:col-span-3 font-medium text-gray-700"
                >
                  Address Line 2
                </div>
                <div class="col-span-12 md:col-span-9">
                  <input
                    type="text"
                    pInputText
                    class="w-full"
                    formControlName="addressLine2"
                    placeholder="Apartment, suite, unit, building"
                  />
                </div>

                <div
                  class="col-span-12 md:col-span-3 font-medium text-gray-700"
                >
                  City & Postcode
                </div>
                <div class="col-span-12 md:col-span-9 grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    pInputText
                    class="w-full"
                    formControlName="city"
                    placeholder="City"
                  />
                  <input
                    type="text"
                    pInputText
                    class="w-full"
                    formControlName="poscode"
                    placeholder="Postcode"
                  />
                </div>

                <div
                  class="col-span-12 md:col-span-3 font-medium text-gray-700"
                >
                  State & Country
                </div>
                <div class="col-span-12 md:col-span-9 grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    pInputText
                    class="w-full"
                    formControlName="state"
                    placeholder="State"
                  />
                  <input
                    type="text"
                    pInputText
                    class="w-full"
                    formControlName="country"
                    placeholder="Country"
                  />
                </div>
              </div>
            </p-tabpanel>

            <p-tabpanel value="2">
              <div class="flex flex-col gap-4 pt-2">
                <div
                  class="flex flex-row items-center gap-2 bg-blue-50/50 border border-blue-100 rounded-lg p-3"
                >
                  <p-checkbox
                    formControlName="sameAsBillingAddress"
                    [binary]="true"
                    inputId="syncAddress"
                  ></p-checkbox>
                  <label
                    class="text-sm font-medium text-blue-800 cursor-pointer select-none"
                    for="syncAddress"
                  >
                    Link Addresses (Changes made to either Billing or Delivery
                    will sync automatically)
                  </label>
                </div>

                <div
                  class="grid grid-cols-12 gap-y-4 gap-x-6 items-center mt-2"
                  formGroupName="deliveryAddress"
                >
                  <div
                    class="col-span-12 md:col-span-3 font-medium text-gray-700"
                  >
                    Address Line 1
                  </div>
                  <div class="col-span-12 md:col-span-9">
                    <input
                      type="text"
                      pInputText
                      class="w-full"
                      formControlName="addressLine1"
                      placeholder="Street address, P.O. box"
                    />
                  </div>

                  <div
                    class="col-span-12 md:col-span-3 font-medium text-gray-700"
                  >
                    Address Line 2
                  </div>
                  <div class="col-span-12 md:col-span-9">
                    <input
                      type="text"
                      pInputText
                      class="w-full"
                      formControlName="addressLine2"
                      placeholder="Apartment, suite, unit, building"
                    />
                  </div>

                  <div
                    class="col-span-12 md:col-span-3 font-medium text-gray-700"
                  >
                    City & Postcode
                  </div>
                  <div class="col-span-12 md:col-span-9 grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      pInputText
                      class="w-full"
                      formControlName="city"
                      placeholder="City"
                    />
                    <input
                      type="text"
                      pInputText
                      class="w-full"
                      formControlName="poscode"
                      placeholder="Postcode"
                    />
                  </div>

                  <div
                    class="col-span-12 md:col-span-3 font-medium text-gray-700"
                  >
                    State & Country
                  </div>
                  <div class="col-span-12 md:col-span-9 grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      pInputText
                      class="w-full"
                      formControlName="state"
                      placeholder="State"
                    />
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

      <div
        class="mt-4 border border-gray-200 rounded-xl bg-white p-4 flex flex-row items-center justify-end gap-3 shadow-sm"
      >
        <p-button
          label="Discard"
          severity="secondary"
          [outlined]="true"
          [routerLink]="'/supplier'"
        ></p-button>
        <p-button
          [label]="currentId ? 'Save Changes' : 'Create Supplier'"
          severity="primary"
          (onClick)="SaveSupplier()"
        ></p-button>
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
      contactPerson1: new FormControl<string | null>(null),
      contactPerson2: new FormControl<string | null>(null),
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
      poscode: new FormControl(null),
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
            this.cdr.markForCheck();
          }
        },
        error: () => {
          this.loadingService.stop();
        },
      });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Invalid File',
        detail: 'Please upload an image file',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      this.FG.patchValue({ logoImage: base64 });
      this.cdr.detectChanges();
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

  SaveSupplier() {
    if (this.FG.valid) {
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
            detail: `${res.name} has been ${this.currentId ? 'updated' : 'created'} successfully`,
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
    ValidateAllFormFields(this.FG);
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.addressSyncSub.next();
    this.addressSyncSub.complete();
    this.loadingService.stop();
  }
}
