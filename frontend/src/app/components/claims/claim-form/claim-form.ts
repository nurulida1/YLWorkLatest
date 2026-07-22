import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';

@Component({
  selector: 'app-claim-form',
  imports: [
    CommonModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    InputNumberModule,
    SelectModule,
    DatePickerModule,
    ReactiveFormsModule,
  ],
  template: `<div class="bg-gray-100 w-full min-h-screen px-5 py-7">
    <div class="font-semibold text-3xl">Claims</div>
    <span class="text-gray-500 tracking-wide"
      >Submit expense claims for reimbursement</span
    >
    <div class="grid grid-cols-12 gap-4 justify-between py-4">
      <div
        class="h-23 bg-white rounded-lg flex flex-col gap-1 tracking-wide items-center justify-center shadow-sm col-span-6"
      >
        <div class="font-bold text-green-600 text-2xl">RM 500</div>
        <span class="text-gray-500 text-sm">Approved</span>
      </div>
      <div
        class="h-23 bg-white rounded-lg flex flex-col gap-1 tracking-wide items-center justify-center shadow-sm col-span-6"
      >
        <div class="font-bold text-yellow-600 text-2xl">RM 0</div>
        <span class="text-gray-500 text-sm">Pending</span>
      </div>
    </div>

    <div class="bg-white rounded-lg p-5 flex flex-col shadow-sm">
      <b class="text-xl tracking-wide">Submit Claim</b>
      <div class="mt-4 grid grid-cols-12 gap-5 items-center" [formGroup]="FG">
        <div class="col-span-12 flex flex-col gap-1">
          <label for="">Claim Type</label>
          <p-select
            appendTo="body"
            formControlName="claimType"
            [options]="[
              { label: 'Transport', value: 'Transport' },
              { label: 'Meals & Refreshments', value: 'Meals & Refreshments' },
              { label: 'Accommodations', value: 'Accommodations' },
              { label: 'Office Supplies', value: 'Office Supplies' },
              {
                label: 'Training & Development',
                value: 'Training & Development',
              },
              { label: 'Others', value: 'Others' },
            ]"
            styleClass="border-gray-200!"
          ></p-select>
        </div>
        <div class="col-span-12 flex flex-col gap-1">
          <label for=""
            >Project
            <span class="italic text-sm text-gray-400">(Optional)</span></label
          >
          <p-select
            appendTo="body"
            formControlName="claimType"
            styleClass="border-gray-200!"
          ></p-select>
        </div>
        <div class="col-span-12 flex flex-col gap-1">
          <label for="">Amount (RM)</label>
          <p-inputnumber
            formControlName="amount"
            placeholder="0.00"
            inputStyleClass="border-gray-200!"
          ></p-inputnumber>
        </div>
        <div class="col-span-12 flex flex-col gap-1">
          <label for="">Date</label>
          <p-datepicker
            [showIcon]="true"
            formControlName="requestedDate"
            dateFormat="dd/mm/yy"
            appendTo="body"
            placeholder="dd/mm/yyyy"
            styleClass="w-full!"
            inputStyleClass="border-gray-200!"
          ></p-datepicker>
        </div>
        <div class="col-span-12 flex flex-col gap-1">
          <label for="">Description</label>
          <textarea
            name=""
            id=""
            pTextarea
            formControlName="description"
            rows="3"
            [autoResize]="true"
            class="border-gray-200!"
          ></textarea>
        </div>
        <div class="col-span-12 py-3">
          <div class="flex justify-between items-center">
            <div>
              <div class="font-medium">Attachment</div>

              <div class="text-sm text-gray-500">Supporting document</div>
            </div>

            <input
              #fileInput
              hidden
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              (change)="onFileSelected($event)"
            />

            <p-button
              icon="pi pi-upload"
              label="Upload Attachment"
              styleClass="text-sm! tracking-wide! border-gray-300! text-gray-500!"
              severity="info"
              outlined
              (click)="fileInput.click()"
            />
          </div>
          <div
            *ngIf="attachmentName"
            class="mt-3 flex items-center justify-between rounded-xl border border-gray-200 bg-surface-100 p-3"
          >
            <div class="flex items-center gap-2">
              <i class="pi pi-paperclip text-blue-500!"></i>
              <span class="text-blue-500!">{{ attachmentName }}</span>
            </div>

            <i
              class="pi pi-times text-red-500! cursor-pointer"
              (click)="removeAttachment()"
            ></i>
          </div>
        </div>
      </div>

      <p-button
        label="Submit Claim"
        severity="info"
        styleClass="w-full bg-blue-600! border-none! py-3!"
        class="my-4"
      ></p-button>
    </div>
  </div>`,
  styleUrl: './claim-form.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClaimForm {
  FG!: FormGroup;

  attachmentName: string = '';

  constructor() {
    this.initForm();
  }

  initForm() {
    this.FG = new FormGroup({
      id: new FormControl<string | null>({ value: null, disabled: true }),
      claimType: new FormControl<string | null>(null, Validators.required),
      amount: new FormControl<number | null>(null),
      requestedDate: new FormControl<Date | null>(null),
      description: new FormControl<string | null>(null),
      attachment: new FormControl<string | null>(null),
      projectId: new FormControl<string | null>(null),
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (!input.files?.length) return;

    const file = input.files[0];

    this.attachmentName = file.name;

    this.FG.patchValue({
      attachment: file,
    });
  }

  removeAttachment() {
    this.attachmentName = '';

    this.FG.patchValue({
      attachment: null,
    });
  }
}
