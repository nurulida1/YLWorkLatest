import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

@Component({
  selector: 'app-apply-leave',
  imports: [
    CommonModule,
    InputTextModule,
    TextareaModule,
    ButtonModule,
    SelectModule,
    ToggleSwitchModule,
    DatePickerModule,
  ],
  template: `<div class="min-h-screen bg-surface-100">
    <div
      class="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center"
    >
      <p-button
        icon="pi pi-arrow-left"
        [text]="true"
        severity="secondary"
      ></p-button>

      <div class="flex-1 text-center font-semibold text-lg mr-10">
        Apply Leave
      </div>
    </div>

    <div class="grid grid-cols-12 gap-2 justify-between px-4 pt-3">
      <div
        class="col-span-4 p-5 bg-white rounded-lg flex flex-col items-center justify-center h-25 border border-gray-100 shadow-xs"
      >
        <b class="text-4xl text-green-600 text-shadow-2xs">8</b>
        <span class="text-gray-500 tracking-wide text-sm">Annual</span>
      </div>
      <div
        class="col-span-4 p-5 bg-white rounded-lg flex flex-col items-center justify-center h-25 border border-gray-100 shadow-xs"
      >
        <b class="text-4xl text-blue-500 text-shadow-2xs">12</b>
        <span class="text-gray-500 tracking-wide text-sm">Medical</span>
      </div>
      <div
        class="col-span-4 p-5 bg-white rounded-lg flex flex-col items-center justify-center h-25 border border-gray-100 shadow-xs"
      >
        <b class="text-4xl text-indigo-500 text-shadow-2xs">0</b>
        <span class="text-gray-500 tracking-wide text-sm">Other</span>
      </div>
    </div>

    <div class="p-4 space-y-5">
      <div class="bg-white rounded-2xl p-4 shadow-sm grid grid-cols-12 gap-4">
        <div class="col-span-12 flex flex-col">
          <label class="block text-sm font-medium mb-2"> Leave Type </label>

          <p-select
            [options]="leaveTypes"
            optionLabel="name"
            optionValue="value"
            formControlName="leaveType"
            placeholder="Select leave type"
            styleClass="border-gray-200!"
            class="w-full"
          />
        </div>

        <div class="col-span-6 flex flex-col">
          <label class="block text-sm font-medium"> From </label>

          <p-datepicker
            formControlName="startDate"
            class="w-full"
            inputStyleClass="border-gray-200!"
            appendTo="body"
            [showIcon]="true"
            dateFormat="dd/mm/yy"
            placeholder="dd/mm/yyyy"
          />
        </div>

        <div class="col-span-6 flex flex-col">
          <label class="block text-sm font-medium"> To </label>

          <p-datepicker
            formControlName="endDate"
            class="w-full"
            inputStyleClass="border-gray-200!"
            appendTo="body"
            [showIcon]="true"
            dateFormat="dd/mm/yy"
            placeholder="dd/mm/yyyy"
          />
        </div>

        <div class="col-span-12 py-2">
          <div class="flex justify-between items-center">
            <div>
              <div class="font-medium">Half Day</div>

              <div class="text-sm text-gray-500">
                Apply only for half-day leave
              </div>
            </div>

            <p-toggleswitch formControlName="isHalfDay" />
          </div>
        </div>

        <div class="col-span-12 flex flex-col gap-1">
          <label class="block text-sm font-medium"> Reason </label>

          <textarea
            pTextarea
            rows="3"
            [autoResize]="true"
            class="w-full border-gray-200!"
            placeholder="Optional"
            formControlName="reason"
          ></textarea>
        </div>

        <div class="col-span-12 py-3">
          <div class="flex justify-between items-center">
            <div>
              <div class="font-medium">Attachment</div>

              <div class="text-sm text-gray-500">MC / Supporting document</div>
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
        <p-button
          label="Submit Leave Request"
          class="col-span-12"
          icon="pi pi-send"
          iconPos="right"
          severity="info"
          styleClass="w-full! bg-blue-600! border-none! py-3!"
        />
        <span
          class="col-span-12 text-center text-gray-500 cursor-pointer hover:text-gray-700 hover:scale-101"
          >Save as Draft</span
        >
      </div>
    </div>
  </div>`,
  styleUrl: './apply-leave.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplyLeave {
  remainingBalance: number = 12;
  pendingLeave: number = 1;
  attachmentName: string = '';
  duration: number = 0;

  FG!: FormGroup;

  leaveTypes = [
    { name: 'Annual Leave', value: 'AL' },
    { name: 'Medical Leave', value: 'MC' },
    { name: 'Emergency Leave', value: 'EL' },
    { name: 'Hospitalization Leave', value: 'HL' },
    { name: 'Maternity Leave', value: 'MAT' },
    { name: 'Paternity Leave', value: 'PAT' },
    { name: 'Unpaid Leave', value: 'UPL' },
    { name: 'Replacement Leave', value: 'RL' },
  ];

  constructor() {
    this.initForm();

    this.FG.get('startDate')?.valueChanges.subscribe(() => this.calculate());
    this.FG.get('endDate')?.valueChanges.subscribe(() => this.calculate());
    this.FG.get('isHalfDay')?.valueChanges.subscribe(() => this.calculate());
  }

  initForm() {
    this.FG = new FormGroup({
      leaveType: new FormControl<string | null>(null, Validators.required),
      startDate: new FormControl<Date | null>(null, Validators.required),
      endDate: new FormControl<Date | null>(null, Validators.required),
      isHalfDay: new FormControl(false, {
        nonNullable: true,
      }),
      reason: new FormControl(''),
      attachment: new FormControl<File | null>(null),
    });
  }

  calculate() {
    const start = this.FG.get('startDate')?.value;
    const end = this.FG.get('endDate')?.value;

    if (!start || !end) {
      this.duration = 0;
      return;
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    const diff =
      Math.floor(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1;

    this.duration = this.FG.get('isHalfDay')?.value ? 0.5 : diff;
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
