import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { Subject, finalize, takeUntil } from 'rxjs';

import { DeliveryOrderRMAService } from '../../../../services/DeliveryOrderRMAService';
import { LoadingService } from '../../../../services/loading.service';

@Component({
  selector: 'app-do-rma-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    DatePickerModule,
    InputNumberModule,
    SelectModule,
    TextareaModule,
  ],
  template: `
    <div
      class="min-h-screen w-full bg-gray-50/70 p-3 font-sans antialiased
             sm:p-6 lg:p-8"
    >
      <!-- Breadcrumb -->
      <nav
        class="mb-5 flex flex-wrap items-center gap-2 text-xs text-gray-500 sm:text-sm"
      >
        <a
          routerLink="/dashboard"
          class="transition-colors hover:text-blue-600"
        >
          Dashboard
        </a>

        <i class="pi pi-angle-right text-xs text-gray-400"></i>

        <a routerLink="/do-rma" class="transition-colors hover:text-blue-600">
          DO RMA
        </a>

        <i class="pi pi-angle-right text-xs text-gray-400"></i>

        <span class="font-semibold text-gray-800">
          {{ currentId ? 'Update Request' : 'New Request' }}
        </span>
      </nav>

      <form
        [formGroup]="rmaForm"
        (ngSubmit)="onSubmit()"
        class="mx-auto flex flex-col gap-5"
      >
        <!-- Page Header -->
        <div
          class="flex flex-col gap-4 rounded-xl border border-gray-200
                 bg-white p-4 shadow-sm sm:flex-row sm:items-center
                 sm:justify-between sm:p-6"
        >
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center
                       rounded-lg bg-blue-50 text-blue-600"
              >
                <i class="pi pi-replay text-lg"></i>
              </div>

              <div class="min-w-0">
                <h1 class="text-xl font-bold text-gray-900 sm:text-2xl">
                  {{ currentId ? 'Update RMA Request' : 'Create RMA Request' }}
                </h1>

                <p class="mt-1 text-xs text-gray-500 sm:text-sm">
                  Manage delivery order return information and documentation.
                </p>
              </div>
            </div>
          </div>

          <div
            class="hidden sm:flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row"
          >
            <p-button
              type="button"
              label="Cancel"
              severity="secondary"
              [outlined]="true"
              styleClass="w-full sm:w-auto"
              routerLink="/do-rma"
            ></p-button>

            <p-button
              type="submit"
              [label]="currentId ? 'Update RMA' : 'Submit Request'"
              severity="info"
              styleClass="w-full sm:w-auto bg-blue-700! border-none! hover:bg-blue-500!"
              [disabled]="rmaForm.invalid || isSubmitting"
              [loading]="isSubmitting"
            ></p-button>
          </div>
        </div>

        <!-- Form Content -->
        <div class="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
          <!-- Left Column -->
          <div class="flex min-w-0 flex-col gap-5 lg:col-span-2">
            <!-- Document Details -->
            <section
              class="rounded-xl border border-gray-200 bg-white p-4
                     shadow-sm sm:p-6"
            >
              <div
                class="mb-5 flex items-center gap-3 border-b border-gray-100 pb-3"
              >
                <div
                  class="flex h-9 w-9 items-center justify-center
                         rounded-lg bg-blue-50 text-blue-600"
                >
                  <i class="pi pi-file-edit"></i>
                </div>

                <div>
                  <h2 class="font-bold text-gray-800">Document Details</h2>
                  <p class="text-xs text-gray-400">
                    Basic RMA request information
                  </p>
                </div>
              </div>

              <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <!-- RMA Number -->
                <div class="flex flex-col gap-1.5">
                  <label class="text-sm font-semibold text-gray-700">
                    Request No
                  </label>

                  <input
                    pInputText
                    formControlName="deliveryOrderRMANo"
                    class="w-full"
                    placeholder="Generating request number..."
                  />

                  <small class="text-xs text-gray-400">
                    Automatically generated by the system.
                  </small>
                </div>

                <!-- Delivery Order -->
                <div class="flex flex-col gap-1.5">
                  <label class="text-sm font-semibold text-gray-700">
                    Source Delivery Order
                    <span class="text-red-500">*</span>
                  </label>

                  <p-select
                    formControlName="deliveryOrderId"
                    [options]="deliveryOrderSelection"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select delivery order"
                    [filter]="true"
                    filterBy="label"
                    [showClear]="true"
                    appendTo="body"
                    styleClass="w-full"
                  ></p-select>

                  <small
                    *ngIf="isInvalid('deliveryOrderId')"
                    class="text-xs text-red-500"
                  >
                    Please select a delivery order.
                  </small>
                </div>

                <!-- Date -->
                <div class="flex flex-col gap-1.5">
                  <label class="text-sm font-semibold text-gray-700">
                    RMA Date
                    <span class="text-red-500">*</span>
                  </label>

                  <p-datepicker
                    formControlName="date"
                    [showIcon]="true"
                    [showButtonBar]="true"
                    dateFormat="dd/mm/yy"
                    placeholder="Select date"
                    appendTo="body"
                    styleClass="w-full"
                    inputStyleClass="w-full"
                  ></p-datepicker>

                  <small *ngIf="isInvalid('date')" class="text-xs text-red-500">
                    Please select a date.
                  </small>
                </div>

                <!-- Return Type -->
                <div class="flex flex-col gap-1.5">
                  <label class="text-sm font-semibold text-gray-700">
                    Return Type
                  </label>

                  <input
                    pInputText
                    formControlName="returnType"
                    class="w-full"
                    placeholder="Enter return type"
                  />
                </div>

                <!-- Return Quantity -->
                <div class="flex flex-col gap-1.5">
                  <label class="text-sm font-semibold text-gray-700">
                    Return Quantity
                  </label>

                  <p-inputnumber
                    formControlName="returnQuantity"
                    [min]="0"
                    [minFractionDigits]="0"
                    [maxFractionDigits]="3"
                    styleClass="w-full"
                    inputStyleClass="w-full"
                    placeholder="Enter quantity"
                  ></p-inputnumber>
                </div>

                <!-- Sender Company -->
                <div class="flex flex-col gap-1.5">
                  <label class="text-sm font-semibold text-gray-700">
                    Sender Company
                  </label>

                  <p-select
                    formControlName="senderCompanyId"
                    [options]="companySelection"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select sender company"
                    [filter]="true"
                    appendTo="body"
                    styleClass="w-full"
                  ></p-select>
                </div>

                <!-- Receiver Company -->
                <div class="flex flex-col gap-1.5">
                  <label class="text-sm font-semibold text-gray-700">
                    Receiver Company
                  </label>

                  <p-select
                    formControlName="receiverCompanyId"
                    [options]="companySelection"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select receiver company"
                    [filter]="true"
                    appendTo="body"
                    styleClass="w-full"
                  ></p-select>
                </div>

                <!-- Return Method -->
                <div class="flex flex-col gap-1.5">
                  <label class="text-sm font-semibold text-gray-700">
                    Return Method
                    <span class="text-red-500">*</span>
                  </label>

                  <p-select
                    formControlName="returnMethod"
                    [options]="returnMethods"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select return method"
                    appendTo="body"
                    styleClass="w-full"
                  ></p-select>

                  <input
                    *ngIf="rmaForm.get('returnMethod')?.value === 'Other'"
                    pInputText
                    formControlName="returnMethodOther"
                    class="mt-2 w-full"
                    placeholder="Specify return method"
                  />

                  <small
                    *ngIf="isInvalid('returnMethod')"
                    class="text-xs text-red-500"
                  >
                    Please select a return method.
                  </small>

                  <small
                    *ngIf="isInvalid('returnMethodOther')"
                    class="text-xs text-red-500"
                  >
                    Please specify the return method.
                  </small>
                </div>
              </div>
            </section>

            <!-- RMA Items -->
            <section
              class="rounded-xl border border-gray-200 bg-white p-4
                     shadow-sm sm:p-6"
            >
              <div
                class="mb-5 flex flex-col gap-3 border-b border-gray-100
                       pb-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-9 w-9 items-center justify-center
                           rounded-lg bg-indigo-50 text-indigo-600"
                  >
                    <i class="pi pi-box"></i>
                  </div>

                  <div>
                    <h2 class="font-bold text-gray-800">RMA Line Items</h2>
                    <p class="text-xs text-gray-400">Items being returned</p>
                  </div>
                </div>

                <p-button
                  type="button"
                  label="Add Item"
                  icon="pi pi-plus"
                  severity="secondary"
                  [outlined]="true"
                  size="small"
                  styleClass="w-full sm:w-auto"
                  (onClick)="addItemRow()"
                ></p-button>
              </div>

              <div formArrayName="doRMAItems" class="flex flex-col gap-4">
                <div
                  *ngFor="let control of itemControls.controls; let i = index"
                  [formGroupName]="i"
                  class="rounded-xl border border-gray-200 bg-gray-50/60 p-3
                         sm:p-4"
                >
                  <!-- Item Header -->
                  <div
                    class="mb-4 flex items-center justify-between border-b
                           border-gray-200 pb-3"
                  >
                    <div class="flex items-center gap-2">
                      <span
                        class="flex h-7 w-7 items-center justify-center
                               rounded-full bg-blue-100 text-xs font-bold
                               text-blue-700"
                      >
                        {{ i + 1 }}
                      </span>

                      <span class="text-sm font-semibold text-gray-800">
                        Item {{ i + 1 }}
                      </span>
                    </div>

                    <button
                      type="button"
                      class="flex items-center gap-1 rounded-lg px-2 py-1.5
                             text-xs font-medium text-red-500
                             transition-colors hover:bg-red-50
                             hover:text-red-700"
                      [disabled]="itemControls.length === 1"
                      [class.opacity-40]="itemControls.length === 1"
                      (click)="removeItemRow(i)"
                    >
                      <i class="pi pi-trash"></i>
                      Remove
                    </button>
                  </div>

                  <!-- Item Fields -->
                  <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div class="flex flex-col gap-1.5 sm:col-span-2">
                      <label class="text-xs font-semibold text-gray-600">
                        Description
                        <span class="text-red-500">*</span>
                      </label>

                      <input
                        pInputText
                        formControlName="description"
                        class="w-full"
                        placeholder="Enter item description or specification"
                      />

                      <small
                        *ngIf="isItemInvalid(i, 'description')"
                        class="text-xs text-red-500"
                      >
                        Description is required.
                      </small>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                      <div class="flex flex-col gap-1.5">
                        <label class="text-xs font-semibold text-gray-600">
                          Quantity
                          <span class="text-red-500">*</span>
                        </label>

                        <p-inputnumber
                          formControlName="quantity"
                          [min]="1"
                          [minFractionDigits]="0"
                          [maxFractionDigits]="3"
                          placeholder="0"
                          styleClass="w-full"
                          inputStyleClass="w-full"
                        ></p-inputnumber>

                        <small
                          *ngIf="isItemInvalid(i, 'quantity')"
                          class="text-xs text-red-500"
                        >
                          Enter a quantity of at least 1.
                        </small>
                      </div>

                      <div class="flex flex-col gap-1.5">
                        <label class="text-xs font-semibold text-gray-600">
                          Unit
                          <span class="text-red-500">*</span>
                        </label>

                        <input
                          pInputText
                          formControlName="unit"
                          class="w-full"
                          placeholder="PCS"
                        />

                        <small
                          *ngIf="isItemInvalid(i, 'unit')"
                          class="text-xs text-red-500"
                        >
                          Unit is required.
                        </small>
                      </div>
                    </div>

                    <div class="flex flex-col gap-1.5">
                      <label class="text-xs font-semibold text-gray-600">
                        Item Condition
                        <span class="text-red-500">*</span>
                      </label>

                      <p-select
                        formControlName="condition"
                        [options]="itemConditions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Select condition"
                        appendTo="body"
                        styleClass="w-full"
                      ></p-select>

                      <small
                        *ngIf="isItemInvalid(i, 'condition')"
                        class="text-xs text-red-500"
                      >
                        Please select item condition.
                      </small>
                    </div>

                    <div class="flex flex-col gap-1.5 sm:col-span-2">
                      <label class="text-xs font-semibold text-gray-600">
                        Item Remarks
                      </label>

                      <textarea
                        pTextarea
                        formControlName="remarks"
                        rows="2"
                        [autoResize]="true"
                        class="w-full"
                        placeholder="Additional information about this item"
                      ></textarea>
                    </div>
                  </div>
                </div>

                <!-- Empty State -->
                <div
                  *ngIf="itemControls.length === 0"
                  class="rounded-xl border border-dashed border-gray-300
                         py-10 text-center"
                >
                  <i class="pi pi-box text-3xl text-gray-300"></i>

                  <p class="mt-3 text-sm font-medium text-gray-600">
                    No items added
                  </p>

                  <p class="mt-1 text-xs text-gray-400">
                    Add at least one item to continue.
                  </p>

                  <p-button
                    type="button"
                    label="Add First Item"
                    icon="pi pi-plus"
                    size="small"
                    [outlined]="true"
                    styleClass="mt-4"
                    (onClick)="addItemRow()"
                  ></p-button>
                </div>
              </div>
            </section>
          </div>

          <!-- Right Column -->
          <div class="flex min-w-0 flex-col gap-5">
            <!-- Logistics Configuration -->
            <section
              class="rounded-xl border border-gray-200 bg-white p-4
                     shadow-sm sm:p-6"
            >
              <div
                class="mb-5 flex items-center gap-3 border-b border-gray-100 pb-3"
              >
                <div
                  class="flex h-9 w-9 items-center justify-center
                         rounded-lg bg-amber-50 text-amber-600"
                >
                  <i class="pi pi-truck"></i>
                </div>

                <div>
                  <h2 class="font-bold text-gray-800">Resolution Details</h2>
                  <p class="text-xs text-gray-400">
                    Return reason and resolution
                  </p>
                </div>
              </div>

              <div class="flex flex-col gap-4">
                <!-- Return Action -->
                <div class="flex flex-col gap-1.5">
                  <label class="text-sm font-semibold text-gray-700">
                    Select Resolution
                    <span class="text-red-500">*</span>
                  </label>

                  <p-select
                    formControlName="returnAction"
                    [options]="returnActions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select resolution"
                    appendTo="body"
                    styleClass="w-full"
                  ></p-select>

                  <input
                    *ngIf="rmaForm.get('returnAction')?.value === 'Other'"
                    pInputText
                    formControlName="returnActionOther"
                    class="mt-2 w-full"
                    placeholder="Specify resolution"
                  />

                  <small
                    *ngIf="isInvalid('returnAction')"
                    class="text-xs text-red-500"
                  >
                    Please select a resolution.
                  </small>

                  <small
                    *ngIf="isInvalid('returnActionOther')"
                    class="text-xs text-red-500"
                  >
                    Please specify the resolution.
                  </small>
                </div>

                <!-- Reason -->
                <div class="flex flex-col gap-1.5">
                  <label class="text-sm font-semibold text-gray-700">
                    Reason Category
                    <span class="text-red-500">*</span>
                  </label>

                  <p-select
                    formControlName="reason"
                    [options]="returnReasons"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select reason"
                    appendTo="body"
                    styleClass="w-full"
                  ></p-select>

                  <small class="text-xs text-gray-400">
                    Choose the main reason for this return.
                  </small>

                  <input
                    *ngIf="rmaForm.get('reason')?.value === 'Other'"
                    pInputText
                    formControlName="reasonOther"
                    class="mt-2 w-full"
                    placeholder="Specify reason"
                  />

                  <small
                    *ngIf="isInvalid('reason')"
                    class="text-xs text-red-500"
                  >
                    Please select a reason.
                  </small>

                  <small
                    *ngIf="isInvalid('reasonOther')"
                    class="text-xs text-red-500"
                  >
                    Please specify the reason.
                  </small>
                </div>

                <!-- Remarks -->
                <div class="flex flex-col gap-1.5">
                  <label class="text-sm font-semibold text-gray-700">
                    General Remarks
                  </label>

                  <textarea
                    pTextarea
                    formControlName="remarks"
                    rows="4"
                    [autoResize]="true"
                    class="w-full"
                    placeholder="Provide additional handling notes..."
                  ></textarea>
                </div>
              </div>
            </section>

            <!-- Proof Documentation -->
            <section
              class="rounded-xl border border-gray-200 bg-white p-4
                     shadow-sm sm:p-6"
            >
              <div
                class="mb-5 flex items-center gap-3 border-b border-gray-100 pb-3"
              >
                <div
                  class="flex h-9 w-9 items-center justify-center
                         rounded-lg bg-emerald-50 text-emerald-600"
                >
                  <i class="pi pi-images"></i>
                </div>

                <div>
                  <h2 class="font-bold text-gray-800">Proof Documentation</h2>
                  <p class="text-xs text-gray-400">
                    Attach images as supporting evidence
                  </p>
                </div>
              </div>

              <input
                type="file"
                #fileInput
                multiple
                accept="image/png,image/jpeg,image/jpg,image/webp"
                class="hidden"
                (change)="onFileSelect($event)"
              />

              <button
                type="button"
                class="flex w-full flex-col items-center justify-center
                       rounded-xl border-2 border-dashed border-gray-200
                       bg-gray-50/50 px-4 py-7 text-center
                       transition-all hover:border-blue-400
                       hover:bg-blue-50/40"
                (click)="fileInput.click()"
              >
                <span
                  class="flex h-12 w-12 items-center justify-center
                         rounded-full border border-gray-200 bg-white
                         text-blue-600 shadow-sm"
                >
                  <i class="pi pi-cloud-upload text-xl"></i>
                </span>

                <span class="mt-3 text-sm font-semibold text-gray-700">
                  Click to upload images
                </span>

                <span class="mt-1 text-xs text-gray-400">
                  PNG, JPG or WEBP · Maximum 5MB per image
                </span>
              </button>

              <!-- Image Preview -->
              <div *ngIf="uploadedImages().length > 0" class="mt-4">
                <div class="mb-2 flex items-center justify-between">
                  <span class="text-xs font-semibold text-gray-600">
                    Uploaded Images
                  </span>

                  <span class="text-xs text-gray-400">
                    {{ uploadedImages().length }} image(s)
                  </span>
                </div>

                <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div
                    *ngFor="let img of uploadedImages(); let idx = index"
                    class="group relative aspect-square overflow-hidden
                           rounded-lg border border-gray-200 bg-gray-50"
                  >
                    <img
                      [src]="img"
                      [alt]="'RMA proof image ' + (idx + 1)"
                      class="h-full w-full object-cover"
                    />

                    <button
                      type="button"
                      class="absolute right-2 top-2 flex h-8 w-8
                             items-center justify-center rounded-full
                             bg-black/60 text-white opacity-100
                             transition-all hover:bg-red-600
                             sm:opacity-0 sm:group-hover:opacity-100"
                      (click)="removeImage(idx)"
                      aria-label="Remove image"
                    >
                      <i class="pi pi-trash text-xs"></i>
                    </button>
                  </div>
                </div>
              </div>

              <p
                *ngIf="uploadedImages().length === 0"
                class="mt-4 text-center text-xs text-gray-400"
              >
                No proof images attached yet.
              </p>
            </section>

            <!-- Form Summary -->
            <section
              class="rounded-xl border border-blue-100 bg-blue-50/60 p-4"
            >
              <div class="flex items-start gap-3">
                <i class="pi pi-info-circle mt-0.5 text-blue-600"></i>

                <div>
                  <h3 class="text-sm font-semibold text-blue-900">
                    Before submitting
                  </h3>

                  <p class="mt-1 text-xs leading-relaxed text-blue-800/80">
                    Ensure the delivery order, returned item quantities, return
                    reason and supporting documentation are correct.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>

        <!-- Bottom Actions for Mobile -->
        <div
          class="w-full sticky bottom-0 z-10 -mx-3 flex gap-2 border-t
                 border-gray-200 bg-white/95 p-3 backdrop-blur
                 sm:hidden"
        >
          <p-button
            type="button"
            label="Cancel"
            severity="secondary"
            [outlined]="true"
            class="w-full"
            styleClass="w-full! py-3!"
            routerLink="/do-rma"
          ></p-button>

          <p-button
            type="submit"
            [label]="currentId ? 'Update' : 'Submit'"
            severity="info"
            class="w-full"
            styleClass="w-full! bg-blue-700! hover:bg-blue-500! border-none! py-3!"
            [disabled]="rmaForm.invalid || isSubmitting"
            [loading]="isSubmitting"
          ></p-button>
        </div>
      </form>
    </div>
  `,
  styleUrl: './do-rma-form.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DoRmaForm implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly messageService = inject(MessageService);
  private readonly deliveryOrderRMAService = inject(DeliveryOrderRMAService);
  private readonly loadingService = inject(LoadingService);

  private readonly ngUnsubscribe = new Subject<void>();

  rmaForm!: FormGroup;

  uploadedImages = signal<string[]>([]);

  currentId: string | null = null;
  isSubmitting = false;

  deliveryOrderSelection: {
    label: string;
    value: string;
  }[] = [];

  companySelection: {
    label: string;
    value: string;
  }[] = [];

  returnMethods = [
    {
      label: 'Third-Party Courier Service (3PL)',
      value: 'Courier',
    },
    {
      label: 'Company Pickup Arrangement',
      value: 'SelfCollect',
    },
    {
      label: 'Customer Drop-Off at Warehouse',
      value: 'DropOff',
    },
    {
      label: 'Other (Specify)',
      value: 'Other',
    },
  ];

  returnActions = [
    {
      label: 'Item Replacement (Re-issue)',
      value: 'Replacement',
    },
    {
      label: 'Issue Credit Note / Refund',
      value: 'CreditNote',
    },
    {
      label: 'Repair and Return to Customer',
      value: 'Repair',
    },
    {
      label: 'Other Resolution (Specify)',
      value: 'Other',
    },
  ];

  returnReasons = [
    {
      label: 'Damaged During Delivery',
      value: 'Damaged',
    },
    {
      label: 'Product Defect / Faulty',
      value: 'Faulty',
    },
    {
      label: 'Incorrect Item Received',
      value: 'WrongItem',
    },
    {
      label: 'Mismatch with Order Specification',
      value: 'NotAsOrdered',
    },
    {
      label: 'Other (Specify)',
      value: 'Other',
    },
  ];

  itemConditions = [
    {
      label: 'Unopened / Box Pristine',
      value: 'Excellent',
    },
    {
      label: 'Damaged Internal Content',
      value: 'Damaged',
    },
    {
      label: 'Defective Technical Internals',
      value: 'Faulty',
    },
  ];

  ngOnInit(): void {
    this.initForm();

    this.currentId = this.activatedRoute.snapshot.queryParamMap.get('id');

    this.loadDropdown();

    if (this.currentId) {
      this.loadFormData();
    } else {
      this.generateRMANo();
    }
  }

  // ---------------------------------------------------------
  // Form initialization
  // ---------------------------------------------------------

  private initForm(): void {
    this.rmaForm = this.fb.group({
      deliveryOrderRMANo: [{ value: null, disabled: true }],
      deliveryOrderId: [null, Validators.required],
      date: [new Date(), Validators.required],

      returnType: [null],
      returnQuantity: [null],
      senderCompanyId: [null],
      receiverCompanyId: [null],

      returnMethod: [null, Validators.required],
      returnMethodOther: [null],

      returnAction: [null, Validators.required],
      returnActionOther: [null],

      reason: [null, Validators.required],
      reasonOther: [null],

      remarks: [null],
      doRMAItems: this.fb.array([]),
    });

    this.addItemRow();

    this.setupOtherFieldValidation('returnMethod', 'returnMethodOther');

    this.setupOtherFieldValidation('returnAction', 'returnActionOther');

    this.setupOtherFieldValidation('reason', 'reasonOther');
  }

  private setupOtherFieldValidation(
    sourceName: string,
    otherName: string,
  ): void {
    const source = this.rmaForm.get(sourceName);
    const other = this.rmaForm.get(otherName);

    source?.valueChanges
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((value) => {
        if (value === 'Other') {
          other?.setValidators([Validators.required]);
        } else {
          other?.clearValidators();
          other?.setValue(null);
        }

        other?.updateValueAndValidity({
          emitEvent: false,
        });

        this.cdr.markForCheck();
      });
  }

  get itemControls(): FormArray {
    return this.rmaForm.get('doRMAItems') as FormArray;
  }

  // ---------------------------------------------------------
  // Item management
  // ---------------------------------------------------------

  addItemRow(): void {
    this.itemControls.push(
      this.fb.group({
        description: ['', Validators.required],

        quantity: [1, [Validators.required, Validators.min(1)]],

        unit: ['PCS', Validators.required],

        condition: ['Excellent', Validators.required],

        remarks: [''],
      }),
    );

    this.cdr.markForCheck();
  }

  removeItemRow(index: number): void {
    if (index < 0 || index >= this.itemControls.length) {
      return;
    }

    this.itemControls.removeAt(index);
    this.cdr.markForCheck();
  }

  isItemInvalid(index: number, controlName: string): boolean {
    const control = this.itemControls.at(index).get(controlName);

    return !!(control?.invalid && (control.dirty || control.touched));
  }

  isInvalid(controlName: string): boolean {
    const control = this.rmaForm.get(controlName);

    return !!(control?.invalid && (control.dirty || control.touched));
  }

  // ---------------------------------------------------------
  // Dropdown
  // ---------------------------------------------------------

  loadDropdown(): void {
    this.deliveryOrderRMAService
      .GetDropdown()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res: any) => {
          this.deliveryOrderSelection = (res?.deliveryOrders ?? []).map(
            (item: any) => ({
              label: `${item.deliveryOrderNo ?? ''} - ${item.salesOrderNo ?? ''}`,
              value: item.id,
            }),
          );

          this.companySelection = (res?.companies ?? []).map(
            (company: any) => ({
              label: company.name,
              value: company.id,
            }),
          );

          this.cdr.markForCheck();
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load dropdown options.',
          });
        },
      });
  }

  // ---------------------------------------------------------
  // Generate RMA number
  // ---------------------------------------------------------

  generateRMANo(): void {
    this.deliveryOrderRMAService
      .GenerateNo()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res: any) => {
          this.rmaForm.get('deliveryOrderRMANo')?.setValue(res?.rmaNo ?? null);

          this.cdr.markForCheck();
        },

        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to generate RMA request number.',
          });
        },
      });
  }

  // ---------------------------------------------------------
  // Load existing RMA
  // ---------------------------------------------------------

  loadFormData(): void {
    if (!this.currentId) return;

    this.loadingService.start();

    this.deliveryOrderRMAService
      .GetOne({
        Page: 1,
        PageSize: 1,
        Select: null,
        Includes: 'DORMAItems,DORMAProofImages',
        Filter: `Id=${this.currentId}`,
        OrderBy: null,
      })
      .pipe(
        takeUntil(this.ngUnsubscribe),
        finalize(() => {
          this.loadingService.stop();
        }),
      )
      .subscribe({
        next: (data: any) => {
          if (!data) {
            this.messageService.add({
              severity: 'error',
              summary: 'Not Found',
              detail: 'RMA request not found.',
            });

            this.router.navigate(['/do-rma']);
            return;
          }

          this.itemControls.clear();

          const returnMethod = this.resolveOtherValue(
            data.returnMethod,
            this.returnMethods,
          );

          const returnAction = this.resolveOtherValue(
            data.returnAction,
            this.returnActions,
          );

          const reason = this.resolveOtherValue(
            data.reason,
            this.returnReasons,
          );

          this.rmaForm.patchValue({
            deliveryOrderRMANo: data.deliveryOrderRMANo ?? null,
            deliveryOrderId: data.deliveryOrderId ?? null,
            date: data.date ? new Date(data.date) : new Date(),

            returnType: data.returnType ?? null,
            returnQuantity: data.returnQuantity ?? null,
            senderCompanyId: data.senderCompanyId ?? null,
            receiverCompanyId: data.receiverCompanyId ?? null,

            returnMethod: returnMethod.value,
            returnMethodOther: returnMethod.other,

            returnAction: returnAction.value,
            returnActionOther: returnAction.other,

            reason: reason.value,
            reasonOther: reason.other,

            remarks: data.remarks ?? null,
          });

          // Restore RMA items
          const items = data.dormaItems ?? [];

          items.forEach((item: any) => {
            this.itemControls.push(
              this.fb.group({
                description: [item.description ?? '', Validators.required],

                quantity: [
                  item.quantity ?? 1,
                  [Validators.required, Validators.min(1)],
                ],

                unit: [item.unit ?? 'PCS', Validators.required],

                condition: [item.condition ?? 'Excellent', Validators.required],

                remarks: [item.remarks ?? ''],
              }),
            );
          });

          if (this.itemControls.length === 0) {
            this.addItemRow();
          }

          // Restore proof images
          const images = data.dormaProofImages ?? [];

          this.uploadedImages.set(
            images
              .map((img: any) => img.url)
              .filter(
                (url: unknown): url is string =>
                  typeof url === 'string' && url.length > 0,
              ),
          );

          this.rmaForm.updateValueAndValidity();
          this.cdr.markForCheck();
        },

        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load RMA request data.',
          });

          this.router.navigate(['/do-rma']);
        },
      });
  }

  private resolveOtherValue(
    value: string | null,
    options: { label: string; value: string }[],
  ): {
    value: string | null;
    other: string | null;
  } {
    if (!value) {
      return {
        value: null,
        other: null,
      };
    }

    const exists = options.some((option) => option.value === value);

    if (exists) {
      return {
        value,
        other: null,
      };
    }

    return {
      value: 'Other',
      other: value,
    };
  }

  // ---------------------------------------------------------
  // Proof image management
  // ---------------------------------------------------------

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);

    files.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Invalid File',
          detail: `${file.name} is not an image.`,
        });

        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        this.messageService.add({
          severity: 'warn',
          summary: 'File Too Large',
          detail: `${file.name} exceeds the 5MB maximum limit.`,
        });

        return;
      }

      const reader = new FileReader();

      reader.onload = () => {
        if (typeof reader.result === 'string') {
          this.uploadedImages.update((current) => [
            ...current,
            reader.result as string,
          ]);

          this.cdr.markForCheck();
        }
      };

      reader.onerror = () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Upload Error',
          detail: `Unable to read ${file.name}.`,
        });
      };

      reader.readAsDataURL(file);
    });

    // Allow selecting the same file again
    input.value = '';
  }

  removeImage(index: number): void {
    this.uploadedImages.update((current) =>
      current.filter((_, i) => i !== index),
    );

    this.cdr.markForCheck();
  }

  // ---------------------------------------------------------
  // Submit
  // ---------------------------------------------------------

  onSubmit(): void {
    if (this.isSubmitting) return;

    if (this.rmaForm.invalid) {
      this.rmaForm.markAllAsTouched();

      this.messageService.add({
        severity: 'warn',
        summary: 'Incomplete Form',
        detail: 'Please complete all required fields.',
      });

      return;
    }

    if (this.itemControls.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Missing Items',
        detail: 'Please add at least one RMA item.',
      });

      return;
    }

    const formValue = this.rmaForm.getRawValue();

    const payload = {
      deliveryOrderRMANo: formValue.deliveryOrderRMANo,

      deliveryOrderId: formValue.deliveryOrderId,

      date: formValue.date ? new Date(formValue.date).toISOString() : null,

      returnType: formValue.returnType,
      returnQuantity: formValue.returnQuantity,

      senderCompanyId: formValue.senderCompanyId,
      receiverCompanyId: formValue.receiverCompanyId,

      returnMethod:
        formValue.returnMethod === 'Other'
          ? formValue.returnMethodOther
          : formValue.returnMethod,

      returnAction:
        formValue.returnAction === 'Other'
          ? formValue.returnActionOther
          : formValue.returnAction,

      reason:
        formValue.reason === 'Other' ? formValue.reasonOther : formValue.reason,

      remarks: formValue.remarks,

      dormaItems: formValue.doRMAItems.map((item: any) => ({
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        condition: item.condition,
        remarks: item.remarks,
      })),

      dormaProofImages: this.uploadedImages().map((url) => ({
        url,
      })),
    };

    this.isSubmitting = true;
    this.loadingService.start();

    const request$ = this.currentId
      ? this.deliveryOrderRMAService.Update({
          id: this.currentId,
          ...payload,
        })
      : this.deliveryOrderRMAService.Create(payload);

    request$
      .pipe(
        takeUntil(this.ngUnsubscribe),
        finalize(() => {
          this.isSubmitting = false;
          this.loadingService.stop();
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: this.currentId
              ? 'RMA request updated successfully.'
              : 'RMA request created successfully.',
          });

          this.router.navigate(['/do-rma']);
        },

        error: (err: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err?.error?.message ?? 'Failed to save RMA request.',
          });
        },
      });
  }

  // ---------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
