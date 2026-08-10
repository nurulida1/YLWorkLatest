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
} from '../../../shared/helpers/helpers';
import { Observable, Subject, takeUntil, merge } from 'rxjs';
import { CompanyType } from '../../../shared/enum/enum';
import { ClientService } from '../../../services/ClientService';
import { ConfirmationService, MessageService } from 'primeng/api';
import { LoadingService } from '../../../services/loading.service';

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
    <div class="w-full flex flex-col p-6 bg-gray-50 min-h-screen">
      <div
        class="text-sm flex flex-row items-center gap-2 text-gray-500 tracking-wide mb-4"
      >
        <span
          class="cursor-pointer hover:text-primary transition-colors"
          [routerLink]="'/dashboard'"
          >Dashboard</span
        >
        <i class="pi pi-chevron-right text-[8px]! text-gray-500!"></i>
        <span
          class="cursor-pointer hover:text-primary transition-colors"
          [routerLink]="'/clients'"
          >Clients</span
        >
        <i class="pi pi-chevron-right text-[8px]! text-gray-500!"></i>
        <span class="text-blue-700 font-semibold">
          {{
            currentId ? 'Update ' + (FG.get('name')?.value || '') : 'New Client'
          }}
        </span>
      </div>

      <div class="flex flex-row items-center justify-between mb-4">
        <div class="flex flex-col">
          <div class="text-3xl font-bold text-gray-800">
            {{
              currentId ? 'Update Client Profile' : 'Create New Client Profile'
            }}
          </div>
          <span class="text-gray-500 tracking-wide"
            >{{ currentId ? 'Update' : 'Register a new' }} corporate entity into
            the YL Works</span
          >
        </div>

        <div class="flex flex-row items-center gap-2">
          <p-button
            [routerLink]="'/clients'"
            label="Discard"
            severity="secondary"
            [outlined]="true"
            size="small"
            styleClass="px-5! py-2! border-gray-400! rounded-none!"
          ></p-button>
          <p-button
            (onClick)="SaveClient()"
            [label]="currentId ? 'Save Changes' : 'Create Client'"
            severity="info"
            size="small"
            [icon]="currentId ? '' : 'pi pi-plus'"
            styleClass="px-5! py-2.5! bg-blue-600! border-none! rounded-none!"
          ></p-button>
        </div>
      </div>

      <div class="flex flex-col gap-5">
        <div class="bg-white border border-gray-200 p-4 flex flex-col gap-4">
          <div class="flex flex-row items-center gap-2">
            <i class="pi pi-building text-blue-600! text-lg!"></i>
            <div class="font-bold tracking-wider text-lg">
              Company Information
            </div>
          </div>

          <div class="grid grid-cols-12 gap-4" [formGroup]="FG">
            <div class="col-span-12 flex flex-col gap-1">
              <div class="font-semibold text-gray-800">Legal Company Name</div>
              <input
                type="text"
                pInputText
                class="w-full rounded-none!"
                placeholder="e.g. Acme Precision Components Sdn Bhd"
                formControlName="name"
              />
            </div>

            <div class="col-span-6 flex flex-col gap-1">
              <div class="font-semibold text-gray-800">Registration Number</div>
              <input
                type="text"
                pInputText
                class="w-full rounded-none!"
                placeholder="e.g. 202301012345 (1234567-X)"
                formControlName="registrationNo"
              />
            </div>

            <div class="col-span-6 flex flex-col gap-1">
              <div class="font-semibold text-gray-800">Email</div>
              <input
                type="text"
                pInputText
                class="w-full rounded-none!"
                placeholder="e.g. example@example.com"
                formControlName="email"
              />
            </div>

            <div class="col-span-6 flex flex-col gap-1">
              <div class="font-semibold text-gray-800">Contact No</div>
              <input
                type="text"
                pInputText
                class="w-full rounded-none!"
                placeholder="e.g. 03-12345678"
                formControlName="contactNo"
              />
            </div>

            <div class="col-span-6 flex flex-col gap-1">
              <div class="font-semibold text-gray-800">Fax No</div>
              <input
                type="text"
                pInputText
                class="w-full rounded-none!"
                placeholder="e.g. 03-12345678"
                formControlName="faxNo"
              />
            </div>
          </div>
        </div>

        <div class="bg-white border border-gray-200 p-4 flex flex-col gap-4">
          <div class="flex flex-row items-center gap-2">
            <i class="pi pi-address-book text-blue-600! text-lg!"></i>
            <div class="font-bold tracking-wider text-lg">Contact Details</div>
          </div>

          <div class="grid grid-cols-12 gap-4" [formGroup]="FG">
            <div class="col-span-12 flex flex-col gap-1">
              <div class="font-semibold text-gray-800">
                Primary Contact Person
              </div>
              <input
                type="text"
                pInputText
                class="w-full rounded-none!"
                placeholder="e.g. Ahmad"
                formControlName="primaryContactPerson"
              />
            </div>

            <div class="col-span-6 flex flex-col gap-1">
              <div class="font-semibold text-gray-800">Primary Email</div>
              <input
                type="text"
                pInputText
                class="w-full rounded-none!"
                placeholder="e.g. example@example.com"
                formControlName="primaryEmail"
              />
            </div>

            <div class="col-span-6 flex flex-col gap-1">
              <div class="font-semibold text-gray-800">Primary Contact No</div>
              <input
                type="text"
                pInputText
                class="w-full rounded-none!"
                placeholder="e.g. 011-12345678"
                formControlName="primaryContactNo"
              />
            </div>

            <div class="col-span-12 border-b border-gray-200"></div>
            <div class="col-span-12 flex flex-col gap-1">
              <div class="font-semibold text-gray-800">
                Secondary Contact Person
              </div>
              <input
                type="text"
                pInputText
                class="w-full rounded-none!"
                placeholder="e.g. Ahmad"
                formControlName="secondaryContactPerson"
              />
            </div>

            <div class="col-span-6 flex flex-col gap-1">
              <div class="font-semibold text-gray-800">Secondary Email</div>
              <input
                type="text"
                pInputText
                class="w-full rounded-none!"
                placeholder="e.g. example@example.com"
                formControlName="secondaryEmail"
              />
            </div>

            <div class="col-span-6 flex flex-col gap-1">
              <div class="font-semibold text-gray-800">
                Secondary Contact No
              </div>
              <input
                type="text"
                pInputText
                class="w-full rounded-none!"
                placeholder="e.g. 011-12345678"
                formControlName="secondaryContactNo"
              />
            </div>
          </div>
        </div>

        <div
          class="bg-white border border-gray-200 p-4 flex flex-col gap-4"
          [formGroup]="FG"
        >
          <div class="flex flex-row items-center gap-2">
            <i class="pi pi-map-marker text-blue-600! text-lg!"></i>
            <div class="font-bold tracking-wider text-lg">Billing Address</div>
          </div>

          <div class="grid grid-cols-12 gap-4" formGroupName="billingAddress">
            <div class="col-span-12 flex flex-col gap-1">
              <div class="font-semibold text-gray-800">Street Address</div>
              <input
                type="text"
                pInputText
                class="w-full rounded-none!"
                placeholder="e.g. 123 Block D"
                formControlName="addressLine1"
              />
            </div>

            <div class="col-span-4 flex flex-col gap-1">
              <div class="font-semibold text-gray-800">City</div>
              <input
                type="text"
                pInputText
                class="w-full rounded-none!"
                placeholder="City"
                formControlName="city"
              />
            </div>

            <div class="col-span-4 flex flex-col gap-1">
              <div class="font-semibold text-gray-800">State</div>
              <p-select
                appendTo="body"
                panelStyleClass="rounded-none!"
                styleClass="rounded-none!"
                [filter]="true"
                [options]="MALAYSIA_STATES"
                formControlName="state"
              ></p-select>
            </div>

            <div class="col-span-4 flex flex-col gap-1">
              <div class="font-semibold text-gray-800">Postcode</div>
              <input
                type="text"
                pInputText
                class="w-full rounded-none!"
                placeholder="e.g. 50000"
                formControlName="postcode"
              />
            </div>
          </div>
        </div>

        <div
          class="bg-white border border-gray-200 p-4 flex flex-col gap-4"
          [formGroup]="FG"
        >
          <div class="flex flex-row items-center justify-between">
            <div class="flex flex-row items-center gap-2">
              <i class="pi pi-truck text-blue-600! text-lg!"></i>
              <div class="font-bold tracking-wider text-lg">
                Delivery Address
              </div>
            </div>
            <div class="flex flex-row items-center gap-2">
              <p-checkbox
                [binary]="true"
                formControlName="sameAsBillingAddress"
              ></p-checkbox>
              <div class="text-sm text-gray-700 mt-1">
                Same as Billing Address
              </div>
            </div>
          </div>

          <div class="grid grid-cols-12 gap-4" formGroupName="deliveryAddress">
            <div class="col-span-12 flex flex-col gap-1">
              <div class="font-semibold text-gray-800">Street Address</div>
              <input
                type="text"
                pInputText
                class="w-full rounded-none!"
                placeholder="e.g. Ahmad"
                formControlName="addressLine1"
              />
            </div>

            <div class="col-span-4 flex flex-col gap-1">
              <div class="font-semibold text-gray-800">City</div>
              <input
                type="text"
                pInputText
                class="w-full rounded-none!"
                placeholder="City"
                formControlName="city"
              />
            </div>

            <div class="col-span-4 flex flex-col gap-1">
              <div class="font-semibold text-gray-800">State</div>
              <p-select
                formControlName="state"
                appendTo="body"
                panelStyleClass="rounded-none!"
                styleClass="rounded-none!"
                [filter]="true"
                [options]="MALAYSIA_STATES"
              ></p-select>
            </div>

            <div class="col-span-4 flex flex-col gap-1">
              <div class="font-semibold text-gray-800">Postcode</div>
              <input
                type="text"
                pInputText
                class="w-full rounded-none!"
                placeholder="e.g. 50000"
                formControlName="postcode"
              />
            </div>
          </div>
        </div>
      </div>
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

  SaveClient() {
    if (this.FG.valid) {
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
