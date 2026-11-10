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
import {
  GridifyQueryExtend,
  ValidateAllFormFields,
} from '../../../../shared/helpers/helpers';
import { Observable, Subject, takeUntil, merge } from 'rxjs';
import { CompanyType } from '../../../../shared/enum/enum';
import { ClientService } from '../../../../services/ClientService';
import { ConfirmationService, MessageService } from 'primeng/api';
import { LoadingService } from '../../../../services/loading.service';

@Component({
  selector: 'app-client-form',
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
    <div class="client-form-page min-h-screen bg-gray-50 p-4 sm:p-5 lg:p-6">
      <!-- Breadcrumb -->
      <div
        class="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-500 mb-5"
      >
        <span
          class="cursor-pointer hover:text-blue-700"
          [routerLink]="'/dashboard'"
        >
          Dashboard
        </span>
        <i class="pi pi-chevron-right text-[8px]!"></i>
        <span
          class="cursor-pointer hover:text-blue-700"
          [routerLink]="'/clients'"
        >
          Clients
        </span>
        <i class="pi pi-chevron-right text-[8px]!"></i>
        <span class="text-blue-700 font-semibold">
          {{ currentId ? 'Update Client' : 'New Client' }}
        </span>
      </div>

      <!-- Page heading -->
      <div
        class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6"
      >
        <div class="min-w-0">
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-800">
            {{
              currentId ? 'Update Client Profile' : 'Create New Client Profile'
            }}
          </h1>

          <p class="text-sm text-gray-500 mt-1">
            {{
              currentId
                ? 'Update your client information and details.'
                : 'Register a new corporate entity into YL Works.'
            }}
          </p>
        </div>

        <div class="flex flex-col-reverse sm:flex-row gap-2 w-full lg:w-auto">
          <p-button
            [routerLink]="'/clients'"
            label="Discard"
            severity="secondary"
            [outlined]="true"
            size="small"
            styleClass="w-full sm:w-auto! justify-center! px-5! py-2.5! rounded-lg!"
          ></p-button>

          <p-button
            (onClick)="SaveClient()"
            [label]="currentId ? 'Save Changes' : 'Create Client'"
            severity="info"
            size="small"
            [icon]="currentId ? 'pi pi-save' : 'pi pi-plus'"
            styleClass="w-full sm:w-auto! justify-center! px-5! py-2.5! bg-blue-700! border-none! rounded-lg!"
          ></p-button>
        </div>
      </div>

      <form [formGroup]="FG" class="flex flex-col gap-5">
        <!-- Company Information -->
        <section
          class="bg-white border border-gray-200 rounded-xl overflow-hidden"
        >
          <div
            class="flex items-center gap-3 p-4 sm:p-5 border-b border-gray-100"
          >
            <div
              class="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0"
            >
              <i class="pi pi-building text-lg"></i>
            </div>

            <div>
              <h2 class="font-bold text-gray-800">Company Information</h2>
              <p class="text-xs text-gray-500 mt-0.5">
                Basic company registration details
              </p>
            </div>
          </div>

          <div class="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="flex flex-col gap-1.5 sm:col-span-2">
              <label class="text-sm font-semibold text-gray-700">
                Legal Company Name <span class="text-red-500">*</span>
              </label>

              <input
                type="text"
                pInputText
                class="w-full! rounded-lg!"
                placeholder="e.g. Acme Precision Components Sdn Bhd"
                formControlName="name"
              />

              <small
                *ngIf="FG.get('name')?.invalid && FG.get('name')?.touched"
                class="text-red-500"
              >
                Company name is required.
              </small>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-semibold text-gray-700">
                Registration Number
              </label>

              <input
                type="text"
                pInputText
                class="w-full! rounded-lg!"
                placeholder="e.g. 202301012345 (1234567-X)"
                formControlName="registrationNo"
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-semibold text-gray-700">
                Company Email
              </label>

              <input
                type="email"
                pInputText
                class="w-full! rounded-lg!"
                placeholder="example@example.com"
                formControlName="email"
              />

              <small
                *ngIf="FG.get('email')?.invalid && FG.get('email')?.touched"
                class="text-red-500"
              >
                Please enter a valid email address.
              </small>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-semibold text-gray-700">
                Contact Number
              </label>

              <input
                type="text"
                pInputText
                class="w-full! rounded-lg!"
                placeholder="e.g. 03-12345678"
                formControlName="contactNo"
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-semibold text-gray-700">
                Fax Number
              </label>

              <input
                type="text"
                pInputText
                class="w-full! rounded-lg!"
                placeholder="e.g. 03-12345678"
                formControlName="faxNo"
              />
            </div>
          </div>
        </section>

        <!-- Contact Details -->
        <section
          class="bg-white border border-gray-200 rounded-xl overflow-hidden"
        >
          <div
            class="flex items-center gap-3 p-4 sm:p-5 border-b border-gray-100"
          >
            <div
              class="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0"
            >
              <i class="pi pi-address-book text-lg"></i>
            </div>

            <div>
              <h2 class="font-bold text-gray-800">Contact Details</h2>
              <p class="text-xs text-gray-500 mt-0.5">
                Primary and secondary contact persons
              </p>
            </div>
          </div>

          <div class="p-4 sm:p-5 flex flex-col gap-5">
            <!-- Primary Contact -->
            <div class="flex flex-col gap-4">
              <div class="flex items-center gap-2">
                <span
                  class="w-6 h-6 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center text-xs font-bold"
                >
                  1
                </span>
                <h3 class="font-semibold text-gray-800">Primary Contact</h3>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="flex flex-col gap-1.5 sm:col-span-2">
                  <label class="text-sm font-semibold text-gray-700">
                    Contact Person
                  </label>

                  <input
                    type="text"
                    pInputText
                    class="w-full! rounded-lg!"
                    placeholder="e.g. Ahmad"
                    formControlName="primaryContactPerson"
                  />
                </div>

                <div class="flex flex-col gap-1.5">
                  <label class="text-sm font-semibold text-gray-700">
                    Email
                  </label>

                  <input
                    type="email"
                    pInputText
                    class="w-full! rounded-lg!"
                    placeholder="example@example.com"
                    formControlName="primaryEmail"
                  />
                </div>

                <div class="flex flex-col gap-1.5">
                  <label class="text-sm font-semibold text-gray-700">
                    Contact Number
                  </label>

                  <input
                    type="text"
                    pInputText
                    class="w-full! rounded-lg!"
                    placeholder="e.g. 011-12345678"
                    formControlName="primaryContactNo"
                  />
                </div>
              </div>
            </div>

            <div class="border-t border-gray-100"></div>

            <!-- Secondary Contact -->
            <div class="flex flex-col gap-4">
              <div class="flex items-center gap-2">
                <span
                  class="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold"
                >
                  2
                </span>
                <h3 class="font-semibold text-gray-800">Secondary Contact</h3>
                <span class="text-xs text-gray-400">(Optional)</span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="flex flex-col gap-1.5 sm:col-span-2">
                  <label class="text-sm font-semibold text-gray-700">
                    Contact Person
                  </label>

                  <input
                    type="text"
                    pInputText
                    class="w-full! rounded-lg!"
                    placeholder="e.g. Ahmad"
                    formControlName="secondaryContactPerson"
                  />
                </div>

                <div class="flex flex-col gap-1.5">
                  <label class="text-sm font-semibold text-gray-700">
                    Email
                  </label>

                  <input
                    type="email"
                    pInputText
                    class="w-full! rounded-lg!"
                    placeholder="example@example.com"
                    formControlName="secondaryEmail"
                  />
                </div>

                <div class="flex flex-col gap-1.5">
                  <label class="text-sm font-semibold text-gray-700">
                    Contact Number
                  </label>

                  <input
                    type="text"
                    pInputText
                    class="w-full! rounded-lg!"
                    placeholder="e.g. 011-12345678"
                    formControlName="secondaryContactNo"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Billing Address -->
        <section
          class="bg-white border border-gray-200 rounded-xl overflow-hidden"
        >
          <div
            class="flex items-center gap-3 p-4 sm:p-5 border-b border-gray-100"
          >
            <div
              class="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0"
            >
              <i class="pi pi-map-marker text-lg"></i>
            </div>

            <div>
              <h2 class="font-bold text-gray-800">Billing Address</h2>
              <p class="text-xs text-gray-500 mt-0.5">
                Company billing location
              </p>
            </div>
          </div>

          <div class="p-4 sm:p-5" formGroupName="billingAddress">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div class="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-3">
                <label class="text-sm font-semibold text-gray-700">
                  Street Address
                </label>

                <input
                  type="text"
                  pInputText
                  class="w-full! rounded-lg!"
                  placeholder="e.g. 123 Block D"
                  formControlName="addressLine1"
                />
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-semibold text-gray-700">City</label>

                <input
                  type="text"
                  pInputText
                  class="w-full! rounded-lg!"
                  placeholder="City"
                  formControlName="city"
                />
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-semibold text-gray-700">State</label>

                <p-select
                  appendTo="body"
                  panelStyleClass="rounded-lg!"
                  styleClass="w-full! rounded-lg!"
                  [filter]="true"
                  [options]="MALAYSIA_STATES"
                  formControlName="state"
                  placeholder="Select state"
                ></p-select>
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-semibold text-gray-700"
                  >Postcode</label
                >

                <input
                  type="text"
                  pInputText
                  class="w-full! rounded-lg!"
                  placeholder="e.g. 50000"
                  formControlName="postcode"
                />
              </div>
            </div>
          </div>
        </section>

        <!-- Delivery Address -->
        <section
          class="bg-white border border-gray-200 rounded-xl overflow-hidden"
        >
          <div
            class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 sm:p-5 border-b border-gray-100"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0"
              >
                <i class="pi pi-truck text-lg"></i>
              </div>

              <div>
                <h2 class="font-bold text-gray-800">Delivery Address</h2>
                <p class="text-xs text-gray-500 mt-0.5">
                  Company delivery location
                </p>
              </div>
            </div>

            <label
              class="flex items-center gap-2 cursor-pointer bg-gray-50 rounded-lg px-3 py-2"
            >
              <p-checkbox
                [binary]="true"
                formControlName="sameAsBillingAddress"
              ></p-checkbox>

              <span class="text-sm font-medium text-gray-700">
                Same as Billing Address
              </span>
            </label>
          </div>

          <div class="p-4 sm:p-5" formGroupName="deliveryAddress">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div class="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-3">
                <label class="text-sm font-semibold text-gray-700">
                  Street Address
                </label>

                <input
                  type="text"
                  pInputText
                  class="w-full! rounded-lg!"
                  placeholder="Street address"
                  formControlName="addressLine1"
                />
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-semibold text-gray-700">City</label>

                <input
                  type="text"
                  pInputText
                  class="w-full! rounded-lg!"
                  placeholder="City"
                  formControlName="city"
                />
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-semibold text-gray-700">State</label>

                <p-select
                  formControlName="state"
                  appendTo="body"
                  panelStyleClass="rounded-lg!"
                  styleClass="w-full! rounded-lg!"
                  [filter]="true"
                  [options]="MALAYSIA_STATES"
                  placeholder="Select state"
                ></p-select>
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-semibold text-gray-700"
                  >Postcode</label
                >

                <input
                  type="text"
                  pInputText
                  class="w-full! rounded-lg!"
                  placeholder="e.g. 50000"
                  formControlName="postcode"
                />
              </div>
            </div>
          </div>
        </section>
      </form>
    </div>
  `,
  styleUrl: './client-form.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientForm implements OnInit, OnDestroy {
  private readonly confirmationService = inject(ConfirmationService);
  private readonly loadingService = inject(LoadingService);
  private readonly clientService = inject(ClientService);
  private readonly messageService = inject(MessageService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  protected ngUnsubscribe: Subject<void> = new Subject<void>();
  private addressSyncSub: Subject<void> = new Subject<void>();

  Query: GridifyQueryExtend = {} as GridifyQueryExtend;
  currentId: string | null = null;
  FG!: FormGroup;

  MALAYSIA_STATES = [
    { label: 'Johor', value: 'Johor' },
    { label: 'Kedah', value: 'Kedah' },
    { label: 'Kelantan', value: 'Kelantan' },
    { label: 'Melaka', value: 'Melaka' },
    { label: 'Negeri Sembilan', value: 'Negeri Sembilan' },
    { label: 'Pahang', value: 'Pahang' },
    { label: 'Perak', value: 'Perak' },
    { label: 'Perlis', value: 'Perlis' },
    { label: 'Pulau Pinang', value: 'Pulau Pinang' },
    { label: 'Sabah', value: 'Sabah' },
    { label: 'Sarawak', value: 'Sarawak' },
    { label: 'Selangor', value: 'Selangor' },
    { label: 'Terengganu', value: 'Terengganu' },
    { label: 'W.P. Kuala Lumpur', value: 'Kuala Lumpur' },
    { label: 'W.P. Labuan', value: 'Labuan' },
    { label: 'W.P. Putrajaya', value: 'Putrajaya' },
  ];

  constructor() {}

  initForm() {
    this.FG = new FormGroup({
      id: new FormControl<string | null>({ value: null, disabled: true }),
      name: new FormControl<string | null>(null, Validators.required),
      logoImage: new FormControl<string | null>(null),
      contactNo: new FormControl<string | null>(null),
      primaryContactPerson: new FormControl<string | null>(null),
      primaryContactNo: new FormControl<string | null>(null),
      primaryEmail: new FormControl<string | null>(null),
      secondaryContactPerson: new FormControl<string | null>(null),
      secondaryContactNo: new FormControl<string | null>(null),
      secondaryEmail: new FormControl<string | null>(null),
      faxNo: new FormControl<string | null>(null),
      acNo: new FormControl<string | null>(null),
      registrationNo: new FormControl<string | null>(null),
      email: new FormControl<string | null>(null, Validators.email),
      websiteUrl: new FormControl<string | null>(null),
      type: new FormControl<CompanyType | null>(CompanyType.Client),
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
      country: new FormControl('Malaysia'),
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

  setupAddressSyncListener(): void {
    const sameAsBillingControl = this.FG.get('sameAsBillingAddress');
    const billingGroup = this.FG.get('billingAddress') as FormGroup;
    const deliveryGroup = this.FG.get('deliveryAddress') as FormGroup;

    sameAsBillingControl?.valueChanges
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((checked: boolean) => {
        // Stop the previous subscription.
        this.addressSyncSub.next();
        this.addressSyncSub.complete();
        this.addressSyncSub = new Subject<void>();

        if (checked) {
          // Immediately copy all billing values, including state.
          deliveryGroup.patchValue(billingGroup.getRawValue(), {
            emitEvent: false,
          });

          // Keep delivery address synchronized with billing address.
          billingGroup.valueChanges
            .pipe(takeUntil(this.addressSyncSub))
            .subscribe((billingValue) => {
              deliveryGroup.patchValue(billingValue, {
                emitEvent: false,
              });

              this.cdr.markForCheck();
            });
        }

        this.cdr.markForCheck();
      });
  }

  GetData(): void {
    this.loadingService.start();

    this.clientService
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
            this.FG.patchValue(res, { emitEvent: false });

            this.FG.get('billingAddress')?.patchValue(
              res.billingAddress ?? {},
              { emitEvent: false },
            );

            this.FG.get('deliveryAddress')?.patchValue(
              res.deliveryAddress ?? {},
              { emitEvent: false },
            );

            if (this.FG.get('sameAsBillingAddress')?.value) {
              this.FG.get('deliveryAddress')?.patchValue(
                this.FG.get('billingAddress')?.getRawValue(),
                { emitEvent: false },
              );
            }

            this.cdr.markForCheck();
          }

          this.loadingService.stop();
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

  SaveClient(): void {
    if (this.FG.invalid) {
      ValidateAllFormFields(this.FG);
      this.cdr.markForCheck();
      return;
    }

    const payload = this.FG.getRawValue();

    this.loadingService.start();

    const request$: Observable<any> = this.currentId
      ? this.clientService.Update(payload)
      : this.clientService.Create(payload);

    request$.pipe(takeUntil(this.ngUnsubscribe)).subscribe({
      next: (res) => {
        this.loadingService.stop();

        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `${res.name} has been ${this.currentId ? 'updated' : 'created'} successfully`,
        });

        this.router.navigate(['/clients']);
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
