import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
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
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { DeliveryOrderRMAService } from '../../../services/DeliveryOrderRMAService';
import { LoadingService } from '../../../services/loading.service';
import { Subject, takeUntil } from 'rxjs';
import { FileUploadModule } from 'primeng/fileupload';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-do-rma-form',
  imports: [
    CommonModule,
    InputTextModule,
    DatePickerModule,
    TextareaModule,
    ReactiveFormsModule,
    InputNumberModule,
    SelectModule,
    FileUploadModule,
    RouterLink,
    ButtonModule,
    TableModule,
  ],
  template: `<div
    class="w-full min-h-screen bg-gray-50/50 p-6 sm:p-8 font-sans antialiased"
  >
    <nav class="flex items-center gap-2 text-gray-500 tracking-wide mb-6">
      <a
        [routerLink]="'/dashboard'"
        class="hover:text-gray-900 transition-colors"
        >Dashboard</a
      >
      <span class="text-gray-300">/</span>
      <a [routerLink]="'/do-rma'" class="hover:text-gray-900 transition-colors"
        >DO RMA</a
      >
      <span class="text-gray-300">/</span>
      <span class="text-gray-800 font-semibold"
        >{{ currentId ? 'Update' : 'New' }} Request</span
      >
    </nav>

    <div [formGroup]="rmaForm" class="mx-auto flex flex-col gap-6">
      <div
        class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 border border-gray-200/80 rounded-xl shadow-sm"
      >
        <div>
          <h1 class="text-2xl text-gray-900 font-bold">
            {{ currentId ? 'Modify RMA Request' : 'Create New RMA Request' }}
          </h1>
          <p class="text-gray-500 mt-0.5 tracking-wide">
            Fill out order metadata, validation reasons, and line items below.
          </p>
        </div>
        <div class="flex items-center gap-3 w-full sm:w-auto justify-end">
          <p-button
            label="Cancel"
            severity="secondary"
            styleClass="p-button-outlined font-medium px-4!"
            [routerLink]="'/do-rma'"
          >
          </p-button>
          <p-button
            type="submit"
            [label]="currentId ? 'Update RMA' : 'Submit Request'"
            severity="info"
            styleClass="font-medium shadow-sm"
            [disabled]="rmaForm.invalid"
          >
          </p-button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div class="lg:col-span-2 flex flex-col gap-6">
          <div
            class="bg-white rounded-xl border border-gray-200/80 shadow-sm p-6 flex flex-col gap-4"
          >
            <h2
              class="text-sm font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 pb-2"
            >
              Document Details
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="flex flex-col gap-1.5">
                <label class="font-semibold text-gray-700"
                  >Request No <span class="text-red-500">*</span></label
                >
                <input
                  pInputText
                  formControlName="deliveryOrderRMANo"
                  class="w-full bg-gray-50 text-gray-500"
                  placeholder="System generated"
                  readonly
                />
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="font-semibold text-gray-700"
                  >Source Delivery Order ID
                  <span class="text-red-500">*</span></label
                >
                <p-select
                  formControlName="deliveryOrderId"
                  styleClass="w-full!"
                  appendTo="body"
                  [options]="deliveryOrderSelection"
                  placeholder="Ex: DO-99812-X"
                />
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="font-semibold text-gray-700"
                  >Date <span class="text-red-500">*</span></label
                >
                <p-datepicker
                  formControlName="date"
                  [showIcon]="true"
                  styleClass="w-full"
                  inputStyleClass="w-full"
                  dateFormat="dd/mm/yy"
                ></p-datepicker>
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="font-semibold text-gray-700"
                  >Return Method <span class="text-red-500">*</span></label
                >
                <p-select
                  [options]="returnMethods"
                  formControlName="returnMethod"
                  styleClass="w-full"
                  placeholder="Select return method"
                  appendTo="body"
                ></p-select
                ><input
                  *ngIf="rmaForm.get('returnMethod')?.value === 'Other'"
                  pInputText
                  formControlName="returnMethodOther"
                  class="w-full mt-2"
                  placeholder="Specify return method..."
                />
              </div>
            </div>
          </div>

          <div
            class="bg-white rounded-xl border border-gray-200/80 shadow-sm p-6 flex flex-col gap-4"
          >
            <div
              class="flex justify-between items-center border-b border-gray-100 pb-2"
            >
              <h2
                class="text-sm font-bold uppercase tracking-wider text-gray-400"
              >
                RMA Line Inventory
              </h2>
              <p-button
                label="Add Item Row"
                icon="pi pi-plus"
                severity="secondary"
                styleClass="p-button-text font-semibold"
                (click)="addItemRow()"
              ></p-button>
            </div>

            <div class="overflow-x-auto -mx-6">
              <p-table [value]="itemControls.controls" class="min-w-[700px]">
                <ng-template #header>
                  <tr
                    class="bg-gray-50/70 border-b border-gray-200 text-gray-500 font-semibold uppercase"
                  >
                    <th class="bg-gray-200! w-[45%] text-left">Description</th>
                    <th class="bg-gray-200! w-[15%] text-center!">Qty</th>
                    <th class="bg-gray-200! w-[15%] text-center!">Unit</th>
                    <th class="bg-gray-200! w-[20%] text-left">Condition</th>
                    <th class="bg-gray-200! w-[5%] text-center!"></th>
                  </tr>
                </ng-template>
                <ng-template #body let-control let-i="rowIndex">
                  <tr
                    [formGroup]="control"
                    class="border-b border-gray-100 align-top"
                  >
                    <td class="p-2">
                      <input
                        pInputText
                        formControlName="description"
                        class="w-full"
                        placeholder="Item spec detail"
                      />
                    </td>
                    <td class="p-2">
                      <p-inputnumber
                        formControlName="quantity"
                        mode="decimal"
                        [minFractionDigits]="2"
                        [maxFractionDigits]="3"
                        [min]="0"
                        styleClass="w-full"
                        inputStyleClass="w-full text-center p-inputtext-sm"
                        placeholder="0.00"
                      />
                    </td>
                    <td class="p-2">
                      <input
                        pInputText
                        formControlName="unit"
                        class="w-full text-center"
                        placeholder="Ex: PCS"
                      />
                    </td>
                    <td class="p-2">
                      <p-select
                        [options]="itemConditions"
                        formControlName="condition"
                        styleClass="w-full"
                        appendTo="body"
                      ></p-select>
                    </td>
                    <td class="p-2 text-center">
                      <div class="flex items-center justify-center">
                        <button
                          pButton
                          type="button"
                          icon="pi pi-trash"
                          class="p-button-text p-button-danger mt-1"
                          (click)="removeItemRow(i)"
                        ></button>
                      </div>
                    </td>
                  </tr>
                </ng-template>
              </p-table>

              <div
                *ngIf="itemControls.length === 0"
                class="text-center text-sm text-gray-400 py-8"
              >
                No tracking items assigned. Click "Add Item Row" above.
              </div>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-6">
          <div
            class="bg-white rounded-xl border border-gray-200/80 shadow-sm p-6 flex flex-col gap-4"
          >
            <h2
              class="text-sm font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 pb-2"
            >
              Logistics Configuration
            </h2>

            <div class="flex flex-col gap-1.5">
              <label class="font-semibold text-gray-700"
                >Select Resolution <span class="text-red-500">*</span></label
              >
              <p-select
                [options]="returnActions"
                formControlName="returnAction"
                styleClass="w-full"
                appendTo="body"
              ></p-select
              ><input
                *ngIf="rmaForm.get('returnAction')?.value === 'Other'"
                pInputText
                formControlName="returnActionOther"
                class="w-full mt-2"
                placeholder="Specify resolution..."
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="font-semibold text-gray-700">
                Reason Category <span class="text-red-500">*</span>
              </label>

              <p-select
                [options]="returnReasons"
                formControlName="reason"
                styleClass="w-full"
                placeholder="Select reason category"
                appendTo="body"
              ></p-select>

              <small class="text-gray-400">
                Choose the main reason for this return </small
              ><input
                *ngIf="rmaForm.get('reason')?.value === 'Other'"
                pInputText
                formControlName="reasonOther"
                class="w-full mt-2"
                placeholder="Specify reason..."
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="font-semibold text-gray-700">Remarks</label>
              <textarea
                pInputTextarea
                formControlName="remarks"
                rows="3"
                [autoResize]="true"
                class="w-full text-sm"
                placeholder="Provide extra handling notes..."
              ></textarea>
            </div>
          </div>

          <div
            class="bg-white rounded-xl border border-gray-200/80 shadow-sm p-6 flex flex-col gap-4"
          >
            <h2
              class="text-sm font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 pb-2"
            >
              Proof Documentation
            </h2>

            <input
              type="file"
              #fileInput
              multiple
              accept="image/*"
              class="hidden"
              (change)="onFileSelect($event)"
            />

            <div
              (click)="fileInput.click()"
              class="border-2 border-dashed border-gray-200 hover:border-primary-500 hover:bg-gray-50/50 rounded-xl p-6 text-center cursor-pointer transition-all group flex flex-col items-center justify-center gap-2"
            >
              <div
                class="w-10 h-10 rounded-full bg-gray-50 group-hover:bg-white flex items-center justify-center border border-gray-100 shadow-sm transition-colors"
              >
                <i
                  class="pi pi-cloud-upload text-gray-500 group-hover:text-primary-600 text-lg"
                ></i>
              </div>
              <div class="flex flex-col gap-0.5">
                <p class="text-sm font-semibold text-gray-700">
                  Click to upload
                  <span class="text-blue-600 font-medium"
                    >or drag and drop</span
                  >
                </p>
                <p class="text-xs text-gray-400">PNG, JPG or JPEG up to 5MB</p>
              </div>
            </div>

            <div
              class="grid grid-cols-4 gap-3 mt-1"
              *ngIf="uploadedImages().length > 0"
            >
              <div
                *ngFor="let img of uploadedImages(); let idx = index"
                class="relative aspect-square rounded-lg border border-gray-200 overflow-hidden bg-gray-50 group shadow-sm transition-all hover:border-gray-300"
              >
                <img
                  [src]="img"
                  class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                <div
                  (click)="removeImage(idx); $event.stopPropagation()"
                  class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity cursor-pointer duration-200"
                >
                  <i class="pi pi-trash text-white text-base"></i>
                  <span class="text-[10px] text-white font-medium tracking-wide"
                    >Remove</span
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`,
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

  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  rmaForm!: FormGroup;
  uploadedImages = signal<string[]>([]);

  currentId: string | null = null;

  returnMethods = [
    { label: 'Third-Party Courier Service (3PL)', value: 'Courier' },
    { label: 'Company Pickup Arrangement', value: 'SelfCollect' },
    { label: 'Customer Drop-Off at Warehouse', value: 'DropOff' },
    { label: 'Other (Specify)', value: 'Other' },
  ];

  returnActions = [
    { label: 'Item Replacement (Re-issue)', value: 'Replacement' },
    { label: 'Issue Credit Note / Refund', value: 'CreditNote' },
    { label: 'Repair and Return to Customer', value: 'Repair' },
    { label: 'Other Resolution (Specify)', value: 'Other' },
  ];

  returnReasons = [
    { label: 'Damaged During Delivery', value: 'Damaged' },
    { label: 'Product Defect / Faulty', value: 'Faulty' },
    { label: 'Incorrect Item Received', value: 'WrongItem' },
    { label: 'Mismatch with Order Specification', value: 'NotAsOrdered' },
    { label: 'Other (Specify)', value: 'Other' },
  ];

  itemConditions = [
    { label: 'Unopened / Box Pristine', value: 'Excellent' },
    { label: 'Damaged Internal Content', value: 'Damaged' },
    { label: 'Defective Technical Internals', value: 'Faulty' },
  ];

  deliveryOrderSelection: { label: string; value: string }[] = [];

  ngOnInit(): void {
    this.loadDropdown();
    this.initForm();
    this.currentId = this.activatedRoute.snapshot.queryParams['id'];
    if (this.currentId) {
      this.loadFormData();
    } else {
      this.generateRMANo();
    }
  }

  loadDropdown() {
    this.deliveryOrderRMAService
      .GetDropdown()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.deliveryOrderSelection = res.deliveryOrders.map(
            (doItem: any) => ({
              label: `${doItem.deliveryOrderNo} - ${doItem.salesOrderNo}`,
              value: doItem.id,
            }),
          );
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load delivery order options.',
          });
        },
      });
  }

  generateRMANo() {
    this.deliveryOrderRMAService
      .GenerateNo()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.rmaForm.get('deliveryOrderRMANo')?.setValue(res.rmaNo);
          this.cdr.markForCheck();
        },
      });
  }

  private initForm(): void {
    this.rmaForm = new FormGroup({
      deliveryOrderRMANo: new FormControl(null),
      deliveryOrderId: new FormControl(null),
      salesOrderId: new FormControl(null),
      date: new FormControl(new Date()),
      returnMethod: new FormControl(null),
      returnAction: new FormControl(null),
      reason: new FormControl(null),
      reasonOther: new FormControl(null),
      remarks: new FormControl(null),
      doRMAItems: new FormArray([]),
    });
    this.addItemRow();

    this.rmaForm.get('reason')?.valueChanges.subscribe((val) => {
      const control = this.rmaForm.get('reasonOther');
      if (val === 'Other') {
        control?.setValidators([Validators.required]);
      } else {
        control?.clearValidators();
        control?.setValue(null);
      }
      control?.updateValueAndValidity();
    });
  }

  get itemControls(): FormArray {
    return this.rmaForm.get('doRMAItems') as FormArray;
  }

  addItemRow(): void {
    const itemRow = this.fb.group({
      description: ['', [Validators.required]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unit: ['PCS', [Validators.required]],
      condition: ['Excellent', [Validators.required]],
      remarks: [''],
    });
    this.itemControls.push(itemRow);
  }

  removeItemRow(index: number): void {
    this.itemControls.removeAt(index);
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const files = Array.from(input.files);

    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        this.messageService.add({
          severity: 'warn',
          summary: 'File Too Large',
          detail: `${file.name} exceeds the 5MB maximum limit.`,
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const result = e.target?.result as string;
        if (result) {
          this.uploadedImages.update((current) => [...current, result]);
          this.cdr.markForCheck();
        }
      };
      reader.readAsDataURL(file);
    });

    input.value = '';
  }

  removeImage(index: number): void {
    this.uploadedImages.update((current) =>
      current.filter((_, i) => i !== index),
    );
    this.cdr.markForCheck();
  }
  loadFormData() {
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
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (data) => {
          this.loadingService.stop();

          if (!data) {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'RMA request not found.',
            });
            this.router.navigate(['/do-rma']);
            return;
          }
          this.itemControls.clear();

          this.rmaForm.patchValue({
            id: data.id,
            deliveryOrderRMANo: data.deliveryOrderRMANo,
            deliveryOrderId: data.deliveryOrderId,
            date: new Date(data.date),
            returnMethod: data.returnMethod,
            returnAction: data.returnAction,
            reason: data.reason,
            remarks: data.remarks,
          });

          data.doRMAItems.forEach((item) => {
            this.itemControls.push(
              this.fb.group({
                description: [item.description, Validators.required],
                quantity: [
                  item.quantity,
                  [Validators.required, Validators.min(1)],
                ],
                unit: [item.unit, Validators.required],
                condition: [item.condition, Validators.required],
                remarks: [item.remarks],
              }),
            );
          });

          if (data.doRMAProofImages) {
            this.uploadedImages.set(
              data.doRMAProofImages.map((img) => img.url),
            );
          }
        },
        error: (err) => {
          this.loadingService.stop();
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load RMA request data.',
          });
          this.router.navigate(['/do-rma']);
        },
      });
  }

  onSubmit(): void {}

  ngOnDestroy(): void {}
}
