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
import { Observable, Subject, takeUntil } from 'rxjs';
import { CompanyType } from '../../../shared/enum/enum';
import { ClientService } from '../../../services/ClientService';
import { ConfirmationService, MessageService } from 'primeng/api';
import { LoadingService } from '../../../services/loading.service';

@Component({
  selector: 'app-client-form',
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
  template: `<div class="w-full flex flex-col p-5">
    <div
      class="flex flex-row items-center gap-1 text-gray-500 text-[15px] tracking-wide"
    >
      <div
        class="cursor-pointer hover:text-gray-600"
        [routerLink]="'/dashboard'"
      >
        Dashboard
      </div>
      /
      <div class="cursor-pointer hover:text-gray-600" [routerLink]="'/clients'">
        Client
      </div>
      /
      <div class="text-gray-700 font-semibold">
        {{ currentId ? 'Update ' + FG.get('name')?.value : 'New Client' }}
      </div>
    </div>

    <div
      class="mt-3 border border-gray-200 rounded-md bg-white p-5 flex flex-col"
    >
      <p-tabs value="0">
        <p-tablist>
          <p-tab value="0">Details</p-tab>
          <p-tab value="1">Delivery Address</p-tab>
          <p-tab value="2">Billing Address</p-tab>
        </p-tablist>
        <p-tabpanels>
          <p-tabpanel value="0">
            <div class="grid grid-cols-12 gap-4 items-center" [formGroup]="FG">
              <div class="col-span-4">Client Logo</div>
              <div class="col-span-8">
                <div class="flex flex-row items-center gap-4">
                  <div *ngIf="FG.get('logoImage')?.value" class="mt-2">
                    <img
                      [src]="FG.get('logoImage')?.value"
                      class="w-32 h-32 object-contain border border-gray-200"
                    />
                  </div>
                  <input
                    #file
                    type="file"
                    accept="image/*"
                    (change)="onFileSelected($event)"
                    hidden
                  />
                  <p-button
                    [label]="FG.get('logoImage')?.value ? 'Reupload' : 'Upload'"
                    severity="secondary"
                    icon="pi pi-upload"
                    styleClass="border-gray-200!"
                    size="small"
                    (onClick)="file.click()"
                  ></p-button
                  ><p-button
                    *ngIf="FG.get('logoImage')?.value"
                    label="Remove"
                    severity="danger"
                    icon="pi pi-trash"
                    size="small"
                    (onClick)="removeImage(file, $event)"
                  ></p-button>
                </div>
              </div>
              <div class="col-span-4">
                Client Name <span class="text-red-500">*</span>
              </div>
              <div class="col-span-8">
                <input
                  type="text"
                  pInputText
                  class="w-full"
                  formControlName="name"
                />
                <small
                  *ngIf="
                    FG.get('name')?.errors?.['required'] &&
                    FG.get('name')?.touched
                  "
                  class="text-red-500"
                  >Name is required.</small
                >
              </div>
              <div class="col-span-4">Client Email</div>
              <div class="col-span-8">
                <input
                  type="text"
                  pInputText
                  class="w-full"
                  formControlName="email"
                />
                <small
                  *ngIf="
                    FG.get('email')?.errors?.['email'] &&
                    FG.get('email')?.touched
                  "
                  class="text-red-500"
                  >Email is invalid.</small
                >
              </div>
              <div class="col-span-4">Contact No</div>
              <div class="col-span-8">
                <input
                  type="text"
                  pInputText
                  class="w-full"
                  formControlName="contactNo"
                />
              </div>
              <div class="col-span-4">Fax No</div>
              <div class="col-span-8">
                <input
                  type="text"
                  pInputText
                  class="w-full"
                  formControlName="faxNo"
                />
              </div>
              <div class="col-span-4">Contact Person</div>
              <div class="col-span-8">
                <input
                  type="text"
                  pInputText
                  class="w-full"
                  formControlName="contactPerson1"
                />
              </div>
              <div class="col-span-4">Contact Person 2</div>
              <div class="col-span-8">
                <input
                  type="text"
                  pInputText
                  class="w-full"
                  formControlName="contactPerson2"
                />
              </div>

              <div class="col-span-4">A/C No</div>
              <div class="col-span-8">
                <input
                  type="text"
                  pInputText
                  class="w-full"
                  formControlName="acNo"
                />
              </div>
              <div class="col-span-4">TIN No</div>
              <div class="col-span-8">
                <input
                  type="text"
                  pInputText
                  class="w-full"
                  formControlName="tinNo"
                />
              </div>
              <div class="col-span-4">SST Reg No</div>
              <div class="col-span-8">
                <input
                  type="text"
                  pInputText
                  class="w-full"
                  formControlName="sstRegNo"
                />
              </div>
              <div class="col-span-4">Website Url</div>
              <div class="col-span-8">
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
            <div class="flex flex-col gap-2" [formGroup]="FG">
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
            <div class="flex flex-col gap-2" [formGroup]="FG">
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
              </div>
            </div>
          </p-tabpanel>
        </p-tabpanels>
      </p-tabs>
    </div>

    <div
      class="mt-3 border border-gray-200 rounded-md bg-white p-5 flex flex-row items-center justify-end gap-2"
    >
      <p-button
        label="Discard"
        severity="secondary"
        styleClass="tracking-wide! py-1.5! border-gray-200!"
        [routerLink]="'/company'"
      ></p-button>
      <p-button
        [label]="currentId ? 'Save Change' : 'Create'"
        severity="info"
        styleClass="tracking-wide! py-1.5!"
        (onClick)="SaveClient()"
      ></p-button>
    </div>
  </div>`,
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

    this.SameAddressOnChanges();
  }

  SameAddressOnChanges() {
    this.FG.get('sameAsBillingAddress')
      ?.valueChanges.pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((checked: boolean) => {
        if (checked) {
          const billing = this.FG.get('billingAddress')?.value;

          this.FG.get('deliveryAddress')?.patchValue(billing);
          this.FG.get('deliveryAddress')?.disable(); // optional UX
        } else {
          this.FG.get('deliveryAddress')?.enable();
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
        error: (err) => {
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

      this.FG.patchValue({
        logoImage: base64,
      });
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
            detail: `${res.name} has been ${
              this.currentId ? 'updated' : 'created'
            } successfully`,
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
    this.loadingService.stop();
  }
}
