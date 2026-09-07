import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
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
import { finalize, firstValueFrom } from 'rxjs';
import {
  CLAIM_TYPE_LABELS,
  ClaimType,
  CreateClaimLineItemDto,
  CreateClaimRequestDto,
  MedicalBalanceDto,
} from '../../../models/Claim';
import { ClaimRequestService } from '../../../services/claim-request.service';
import { ClaimSettingsService } from '../../../services/claim-settings.service';
import { LoadingService } from '../../../services/loading.service';
import { UserService } from '../../../services/userService.service';

@Component({
  selector: 'app-claim-apply',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    InputNumberModule,
    SelectModule,
    DatePickerModule,
  ],
  template: `
    <div class="w-full min-h-screen bg-[#f4f6f8] p-6 flex flex-col gap-5">
      <div class="flex items-center gap-1.5 text-sm text-gray-500">
        <a routerLink="/claims" class="hover:text-blue-600">Claims</a>
        <span>/</span>
        <span class="text-gray-700 font-semibold">{{ editId ? 'Edit' : 'Apply' }}</span>
      </div>

      <div class="bg-white rounded-lg shadow-sm p-5 flex flex-col gap-4" [formGroup]="form">
        <h1 class="text-2xl font-bold m-0">{{ editId ? 'Edit claim' : 'Submit claim' }}</h1>

        <div class="grid grid-cols-12 gap-4">
          <div class="col-span-12 md:col-span-6 flex flex-col gap-1">
            <label>Claim type</label>
            <p-select
              formControlName="claimType"
              [options]="claimTypeOptions"
              optionLabel="label"
              optionValue="value"
              appendTo="body"
              styleClass="w-full"
              (onChange)="onTypeChange()"
            />
          </div>
          <div class="col-span-12 flex flex-col gap-1">
            <label>Remarks</label>
            <textarea pTextarea formControlName="remarks" rows="2" class="w-full"></textarea>
          </div>
        </div>

        @if (form.value.claimType === 'OutstationTravel') {
          <div class="grid grid-cols-12 gap-4 border-t pt-4">
            <div class="col-span-12 md:col-span-4 flex flex-col gap-1">
              <label>Destination</label>
              <input pInputText formControlName="destination" class="w-full" />
            </div>
            <div class="col-span-12 md:col-span-4 flex flex-col gap-1">
              <label>Trip start</label>
              <p-datepicker formControlName="tripStartDate" dateFormat="dd/mm/yy" [showIcon]="true" appendTo="body" styleClass="w-full" />
            </div>
            <div class="col-span-12 md:col-span-4 flex flex-col gap-1">
              <label>Trip end</label>
              <p-datepicker formControlName="tripEndDate" dateFormat="dd/mm/yy" [showIcon]="true" appendTo="body" styleClass="w-full" />
            </div>
          </div>
        }

        <div class="flex items-center justify-between border-t pt-4">
          <h2 class="text-lg font-semibold m-0">Line items</h2>
          <p-button label="Add line" icon="pi pi-plus" size="small" (onClick)="addLine()" />
        </div>

        <div formArrayName="lineItems" class="flex flex-col gap-4">
          @for (ctrl of lineItems.controls; track $index; let i = $index) {
            <div class="border rounded-lg p-4 grid grid-cols-12 gap-3" [formGroupName]="i">
              <div class="col-span-12 flex justify-between items-center">
                <span class="font-medium text-sm text-gray-600">Line {{ i + 1 }}</span>
                <p-button
                  icon="pi pi-trash"
                  severity="danger"
                  [text]="true"
                  size="small"
                  (onClick)="removeLine(i)"
                  [disabled]="lineItems.length <= 1"
                />
              </div>

              @if (form.value.claimType === 'MonthlyReimbursement') {
                <div class="col-span-12 md:col-span-4 flex flex-col gap-1">
                  <label>Category</label>
                  <p-select formControlName="category" [options]="categoryOptions" optionLabel="label" optionValue="value" appendTo="body" styleClass="w-full" (onChange)="onMedicalDraftChanged()" />
                </div>
                <div class="col-span-12 md:col-span-4 flex flex-col gap-1">
                  <label>Purchase date</label>
                  <p-datepicker formControlName="purchaseDate" dateFormat="dd/mm/yy" [showIcon]="true" appendTo="body" styleClass="w-full" />
                </div>
                <div class="col-span-12 md:col-span-4 flex flex-col gap-1">
                  <label>Amount (RM)</label>
                  <p-inputNumber formControlName="amount" mode="decimal" [minFractionDigits]="2" styleClass="w-full" (onInput)="onMedicalDraftChanged()" />
                </div>
                @if (ctrl.value.category === 'Medical' && medicalBalance) {
                  <div
                    class="col-span-12 text-sm rounded-md bg-blue-50 border border-blue-100 px-3 py-2 text-blue-900"
                  >
                    Medical balance ({{ medicalBalance.year }}):
                    <span class="font-medium"
                      >RM {{ medicalRemainingAfterDraft | number: '1.2-2' }} remaining</span
                    >
                    of RM {{ medicalBalance.annualLimit | number: '1.2-2' }}
                    @if (medicalBalance.isProrated) {
                      <span class="text-blue-700"> (pro-rated)</span>
                    }
                    · Max RM {{ medicalBalance.perReceiptLimit | number: '1.2-2' }} per receipt
                  </div>
                }
                <div class="col-span-12 flex flex-col gap-1">
                  <label>Description</label>
                  <input pInputText formControlName="description" class="w-full" />
                </div>
                <div class="col-span-12 md:col-span-6 flex flex-col gap-1">
                  <label>Receipt <span class="text-red-500">*</span></label>
                  <div class="flex flex-row items-center gap-3">
                    <input
                      #lineReceiptFile
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                      (change)="onLineReceiptSelected(i, $event)"
                      hidden
                    />
                    <p-button
                      [label]="lineDocuments[i].receipt ? 'Reupload' : 'Upload'"
                      severity="secondary"
                      icon="pi pi-upload"
                      styleClass="border-gray-200!"
                      size="small"
                      (onClick)="lineReceiptFile.click()"
                    />
                    @if (lineDocuments[i].receipt) {
                      <div
                        class="bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm flex items-center gap-2"
                      >
                        <i class="pi pi-file text-yellow-600!"></i>
                        <span class="truncate max-w-[220px]">{{
                          lineDocuments[i].receipt!.name
                        }}</span>
                      </div>
                    }
                  </div>
                </div>
                <div class="col-span-12 md:col-span-6 flex flex-col gap-1">
                  <label>E-invoice <span class="text-gray-400">(optional)</span></label>
                  <div class="flex flex-row items-center gap-3">
                    <input
                      #lineEinvoiceFile
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                      (change)="onLineEinvoiceSelected(i, $event)"
                      hidden
                    />
                    <p-button
                      [label]="lineDocuments[i].einvoice ? 'Reupload' : 'Upload'"
                      severity="secondary"
                      icon="pi pi-upload"
                      styleClass="border-gray-200!"
                      size="small"
                      (onClick)="lineEinvoiceFile.click()"
                    />
                    @if (lineDocuments[i].einvoice) {
                      <div
                        class="bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm flex items-center gap-2"
                      >
                        <i class="pi pi-file text-yellow-600!"></i>
                        <span class="truncate max-w-[220px]">{{
                          lineDocuments[i].einvoice!.name
                        }}</span>
                      </div>
                    }
                  </div>
                </div>
              }

              @if (form.value.claimType === 'Overtime') {
                <div class="col-span-12 md:col-span-3 flex flex-col gap-1">
                  <label>Work date</label>
                  <p-datepicker formControlName="workDate" dateFormat="dd/mm/yy" [showIcon]="true" appendTo="body" styleClass="w-full" />
                </div>
                <div class="col-span-12 md:col-span-3 flex flex-col gap-1">
                  <label>Day type</label>
                  <p-select formControlName="dayType" [options]="dayTypeOptions" optionLabel="label" optionValue="value" appendTo="body" styleClass="w-full" (onChange)="previewOt(i)" />
                </div>
                <div class="col-span-12 md:col-span-3 flex flex-col gap-1">
                  <label>Hours</label>
                  <p-inputNumber formControlName="hours" mode="decimal" [minFractionDigits]="1" [maxFractionDigits]="2" styleClass="w-full" (onInput)="previewOt(i)" />
                </div>
                <div class="col-span-12 md:col-span-3 flex flex-col gap-1">
                  <label>Est. amount</label>
                  <input pInputText class="w-full" [value]="otPreviews[i] != null ? ('RM ' + (otPreviews[i] | number:'1.2-2')) : '—'" [readonly]="true" />
                </div>
                <div class="col-span-12 flex flex-col gap-1">
                  <label>Description</label>
                  <input pInputText formControlName="description" class="w-full" />
                </div>
              }

              @if (form.value.claimType === 'OutstationTravel') {
                <div class="col-span-12 md:col-span-3 flex flex-col gap-1">
                  <label>Line kind</label>
                  <p-select formControlName="lineKind" [options]="outstationKindOptions" optionLabel="label" optionValue="value" appendTo="body" styleClass="w-full" />
                </div>

                @if (ctrl.value.lineKind === 'Mileage') {
                  <div class="col-span-12 md:col-span-3 flex flex-col gap-1">
                    <label>Vehicle</label>
                    <p-select formControlName="vehicleType" [options]="vehicleOptions" optionLabel="label" optionValue="value" appendTo="body" styleClass="w-full" />
                  </div>
                  <div class="col-span-12 md:col-span-3 flex flex-col gap-1">
                    <label>Kilometers</label>
                    <p-inputNumber formControlName="kilometers" mode="decimal" [minFractionDigits]="1" styleClass="w-full" />
                  </div>
                }

                @if (ctrl.value.lineKind === 'Expense') {
                  <div class="col-span-12 md:col-span-3 flex flex-col gap-1">
                    <label>Amount (RM)</label>
                    <p-inputNumber formControlName="amount" mode="decimal" [minFractionDigits]="2" styleClass="w-full" />
                  </div>
                  <div class="col-span-12 md:col-span-3 flex flex-col gap-1">
                    <label>Purchase date</label>
                    <p-datepicker formControlName="purchaseDate" dateFormat="dd/mm/yy" [showIcon]="true" appendTo="body" styleClass="w-full" />
                  </div>
                  <div class="col-span-12 md:col-span-6 flex flex-col gap-1">
                    <label>Receipt <span class="text-red-500">*</span></label>
                    <div class="flex flex-row items-center gap-3">
                      <input
                        #expenseReceiptFile
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                        (change)="onLineReceiptSelected(i, $event)"
                        hidden
                      />
                      <p-button
                        [label]="lineDocuments[i].receipt ? 'Reupload' : 'Upload'"
                        severity="secondary"
                        icon="pi pi-upload"
                        styleClass="border-gray-200!"
                        size="small"
                        (onClick)="expenseReceiptFile.click()"
                      />
                      @if (lineDocuments[i].receipt) {
                        <div
                          class="bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm flex items-center gap-2"
                        >
                          <i class="pi pi-file text-yellow-600!"></i>
                          <span class="truncate max-w-[220px]">{{
                            lineDocuments[i].receipt!.name
                          }}</span>
                        </div>
                      }
                    </div>
                  </div>
                  <div class="col-span-12 md:col-span-6 flex flex-col gap-1">
                    <label>E-invoice <span class="text-gray-400">(optional)</span></label>
                    <div class="flex flex-row items-center gap-3">
                      <input
                        #expenseEinvoiceFile
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                        (change)="onLineEinvoiceSelected(i, $event)"
                        hidden
                      />
                      <p-button
                        [label]="lineDocuments[i].einvoice ? 'Reupload' : 'Upload'"
                        severity="secondary"
                        icon="pi pi-upload"
                        styleClass="border-gray-200!"
                        size="small"
                        (onClick)="expenseEinvoiceFile.click()"
                      />
                      @if (lineDocuments[i].einvoice) {
                        <div
                          class="bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm flex items-center gap-2"
                        >
                          <i class="pi pi-file text-yellow-600!"></i>
                          <span class="truncate max-w-[220px]">{{
                            lineDocuments[i].einvoice!.name
                          }}</span>
                        </div>
                      }
                    </div>
                  </div>
                }

                @if (ctrl.value.lineKind === 'MealAllowance') {
                  <div class="col-span-12 md:col-span-3 flex flex-col gap-1">
                    <label>Meal days</label>
                    <p-inputNumber formControlName="mealDays" [min]="1" styleClass="w-full" />
                  </div>
                  <div class="col-span-12 md:col-span-6 text-sm text-gray-500 self-end pb-2">
                    Rate RM {{ mealRate | number:'1.2-2' }}/day (optional claim)
                  </div>
                }

                <div class="col-span-12 flex flex-col gap-1">
                  <label>Description</label>
                  <input pInputText formControlName="description" class="w-full" />
                </div>
              }
            </div>
          }
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <p-button label="Cancel" severity="secondary" [outlined]="true" routerLink="/claims" />
          <p-button label="Submit" icon="pi pi-send" (onClick)="submit()" [loading]="saving" />
        </div>
      </div>
    </div>
  `,
})
export class ClaimApply implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ClaimRequestService);
  private readonly settingsApi = inject(ClaimSettingsService);
  private readonly users = inject(UserService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly messages = inject(MessageService);
  private readonly loading = inject(LoadingService);
  private readonly cdr = inject(ChangeDetectorRef);

  editId: string | null = null;
  saving = false;
  mealRate = 50;
  lineDocuments: Array<{ receipt: File | null; einvoice: File | null }> = [
    { receipt: null, einvoice: null },
  ];
  otPreviews: Array<number | null> = [];
  medicalBalance: MedicalBalanceDto | null = null;
  private medicalBalanceLoaded = false;

  claimTypeOptions = [
    { label: CLAIM_TYPE_LABELS['MonthlyReimbursement'], value: 'MonthlyReimbursement' },
    { label: CLAIM_TYPE_LABELS['Overtime'], value: 'Overtime' },
    { label: CLAIM_TYPE_LABELS['OutstationTravel'], value: 'OutstationTravel' },
  ];
  categoryOptions = [
    { label: 'Medical', value: 'Medical' },
    { label: 'Safety shoes', value: 'SafetyShoes' },
    { label: 'General purchase', value: 'GeneralPurchase' },
  ];
  dayTypeOptions = [
    { label: 'Normal day (weekday)', value: 'Normal' },
    { label: 'Rest day', value: 'RestDay' },
    { label: 'Public holiday', value: 'PublicHoliday' },
  ];
  outstationKindOptions = [
    { label: 'Mileage', value: 'Mileage' },
    { label: 'Expense / purchase', value: 'Expense' },
    { label: 'Meal allowance', value: 'MealAllowance' },
  ];
  vehicleOptions = [
    { label: 'Car', value: 'Car' },
    { label: 'Motorcycle', value: 'Motorcycle' },
  ];

  form: FormGroup = this.fb.group({
    claimType: ['MonthlyReimbursement', Validators.required],
    remarks: [''],
    destination: [''],
    tripStartDate: [null as Date | null],
    tripEndDate: [null as Date | null],
    lineItems: this.fb.array([this.createLine('MonthlyReimbursement')]),
  });

  get lineItems(): FormArray {
    return this.form.get('lineItems') as FormArray;
  }

  get draftMedicalTotal(): number {
    return this.lineItems.controls
      .filter((c) => c.value.category === 'Medical')
      .reduce((sum, c) => sum + Number(c.value.amount || 0), 0);
  }

  get medicalRemainingAfterDraft(): number {
    if (!this.medicalBalance) return 0;
    return Math.max(0, this.medicalBalance.remainingAmount - this.draftMedicalTotal);
  }

  ngOnInit(): void {
    this.settingsApi.get().subscribe({
      next: (s) => {
        this.mealRate = s.mealAllowancePerDay;
        this.cdr.markForCheck();
      },
    });

    this.editId = this.route.snapshot.paramMap.get('id');
    if (this.editId) {
      this.loading.start();
      this.api
        .getById(this.editId)
        .pipe(finalize(() => this.loading.stop()))
        .subscribe({
          next: (req) => {
            if (req.status !== 'Pending') {
              this.messages.add({
                severity: 'warn',
                summary: 'Not editable',
                detail: 'Only pending claims can be edited.',
              });
              void this.router.navigate(['/claims', req.requestId]);
              return;
            }
            this.form.patchValue({
              claimType: req.claimType,
              remarks: req.remarks,
              destination: req.destination ?? '',
              tripStartDate: req.tripStartDate ? new Date(req.tripStartDate) : null,
              tripEndDate: req.tripEndDate ? new Date(req.tripEndDate) : null,
            });
            this.lineItems.clear();
            for (const line of req.lineItems) {
              this.lineItems.push(
                this.fb.group({
                  lineKind: [line.lineKind],
                  category: [line.category],
                  purchaseDate: [line.purchaseDate ? new Date(line.purchaseDate) : null],
                  amount: [line.amount],
                  description: [line.description],
                  workDate: [line.workDate ? new Date(line.workDate) : null],
                  dayType: [line.dayType],
                  hours: [line.hours],
                  vehicleType: [line.vehicleType],
                  kilometers: [line.kilometers],
                  mealDays: [line.mealDays],
                }),
              );
            }
            this.otPreviews = this.lineItems.controls.map(() => null);
            this.lineDocuments = this.lineItems.controls.map(() => ({
              receipt: null,
              einvoice: null,
            }));
            this.loadMedicalBalanceOnce();
            this.cdr.markForCheck();
          },
        });
    } else {
      this.loadMedicalBalanceOnce();
    }
  }

  onTypeChange(): void {
    const type = this.form.value.claimType as ClaimType;
    this.lineItems.clear();
    this.lineItems.push(this.createLine(type));
    this.otPreviews = [null];
    this.lineDocuments = [{ receipt: null, einvoice: null }];
    if (type === 'MonthlyReimbursement') {
      this.loadMedicalBalanceOnce();
    }
    this.cdr.markForCheck();
  }

  createLine(type: ClaimType | string): FormGroup {
    if (type === 'Overtime') {
      return this.fb.group({
        lineKind: ['OvertimeItem'],
        workDate: [null, Validators.required],
        dayType: ['Normal', Validators.required],
        hours: [null, Validators.required],
        description: [''],
        category: [null],
        purchaseDate: [null],
        amount: [0],
        vehicleType: [null],
        kilometers: [null],
        mealDays: [null],
      });
    }
    if (type === 'OutstationTravel') {
      return this.fb.group({
        lineKind: ['Mileage'],
        vehicleType: ['Car'],
        kilometers: [null],
        amount: [0],
        purchaseDate: [null],
        mealDays: [null],
        description: [''],
        category: [null],
        workDate: [null],
        dayType: [null],
        hours: [null],
      });
    }
    return this.fb.group({
      lineKind: ['MonthlyItem'],
      category: ['GeneralPurchase', Validators.required],
      purchaseDate: [null, Validators.required],
      amount: [null, Validators.required],
      description: [''],
      workDate: [null],
      dayType: [null],
      hours: [null],
      vehicleType: [null],
      kilometers: [null],
      mealDays: [null],
    });
  }

  addLine(): void {
    this.lineItems.push(this.createLine(this.form.value.claimType));
    this.otPreviews.push(null);
    this.lineDocuments.push({ receipt: null, einvoice: null });
    this.cdr.markForCheck();
  }

  removeLine(i: number): void {
    if (this.lineItems.length <= 1) return;
    this.lineItems.removeAt(i);
    this.otPreviews.splice(i, 1);
    this.lineDocuments.splice(i, 1);
    this.cdr.markForCheck();
  }

  onMedicalDraftChanged(): void {
    this.cdr.markForCheck();
  }

  /** Fetches medical balance once per page visit; remaining amount is computed locally. */
  loadMedicalBalanceOnce(): void {
    if (this.medicalBalanceLoaded) return;

    const user = this.users.currentUser;
    if (!user?.userId || this.form.value.claimType !== 'MonthlyReimbursement') return;

    this.medicalBalanceLoaded = true;
    this.api
      .getMedicalBalance(user.userId, new Date().getFullYear(), this.editId ?? undefined)
      .subscribe({
        next: (balance) => {
          this.medicalBalance = balance;
          this.cdr.markForCheck();
        },
        error: () => {
          this.medicalBalance = null;
          this.medicalBalanceLoaded = false;
          this.cdr.markForCheck();
        },
      });
  }

  previewOt(i: number): void {
    const user = this.users.currentUser;
    const line = this.lineItems.at(i).value;
    if (!user?.userId || !line.dayType || !line.hours) return;
    this.api
      .previewOt({
        employeeId: user.userId,
        dayType: line.dayType,
        hours: Number(line.hours),
      })
      .subscribe({
        next: (r) => {
          this.otPreviews[i] = r.amount;
          this.cdr.markForCheck();
        },
        error: () => {
          this.otPreviews[i] = null;
          this.cdr.markForCheck();
        },
      });
  }

  onLineReceiptSelected(index: number, ev: Event): void {
    const input = ev.target as HTMLInputElement;
    if (!this.lineDocuments[index]) {
      this.lineDocuments[index] = { receipt: null, einvoice: null };
    }
    this.lineDocuments[index].receipt = input.files?.[0] ?? null;
    this.cdr.markForCheck();
  }

  onLineEinvoiceSelected(index: number, ev: Event): void {
    const input = ev.target as HTMLInputElement;
    if (!this.lineDocuments[index]) {
      this.lineDocuments[index] = { receipt: null, einvoice: null };
    }
    this.lineDocuments[index].einvoice = input.files?.[0] ?? null;
    this.cdr.markForCheck();
  }

  submit(): void {
    const user = this.users.currentUser;
    if (!user?.userId) {
      this.messages.add({
        severity: 'error',
        summary: 'Not signed in',
        detail: 'Please sign in again.',
      });
      return;
    }

    const type = this.form.value.claimType as ClaimType;
    if (!this.editId) {
      for (let i = 0; i < this.lineItems.controls.length; i++) {
        const line = this.lineItems.at(i).value;
        if (this.lineRequiresReceipt(type, line) && !this.lineDocuments[i].receipt) {
          this.messages.add({
            severity: 'warn',
            summary: 'Receipt required',
            detail: `Please attach a receipt for line ${i + 1}.`,
          });
          return;
        }
      }
    }

    const dto = this.buildDto(user.userId);
    if (this.form.value.claimType === 'MonthlyReimbursement' && this.medicalBalance) {
      const medicalLines = this.lineItems.controls.filter(
        (c) => c.value.category === 'Medical',
      );
      if (medicalLines.length > 0) {
        if (this.draftMedicalTotal > this.medicalBalance.remainingAmount) {
          const overBy = this.draftMedicalTotal - this.medicalBalance.remainingAmount;
          this.messages.add({
            severity: 'warn',
            summary: 'Medical limit exceeded',
            detail: `You only have RM ${this.medicalBalance.remainingAmount.toFixed(2)} remaining for ${this.medicalBalance.year}, but your medical lines total RM ${this.draftMedicalTotal.toFixed(2)} (over by RM ${overBy.toFixed(2)}).`,
          });
          return;
        }
        const overReceipt = medicalLines.find(
          (c) => Number(c.value.amount) > this.medicalBalance!.perReceiptLimit,
        );
        if (overReceipt) {
          this.messages.add({
            severity: 'warn',
            summary: 'Per-receipt limit',
            detail: `Each medical receipt cannot exceed RM ${this.medicalBalance.perReceiptLimit.toFixed(2)}.`,
          });
          return;
        }
      }
    }

    this.saving = true;
    this.loading.start();
    const req$ = this.editId
      ? this.api.update(this.editId, dto)
      : this.api.submit(dto);

    req$.pipe(finalize(() => {
      this.saving = false;
      this.loading.stop();
      this.cdr.markForCheck();
    })).subscribe({
      next: async (res) => {
        try {
          await this.uploadLineDocuments(res.requestId, type);
        } catch {
          this.messages.add({
            severity: 'warn',
            summary: 'Claim saved',
            detail: 'Claim submitted but document upload failed. You can retry from the detail page.',
          });
        }
        this.messages.add({
          severity: 'success',
          summary: 'Submitted',
          detail: 'Claim submitted successfully.',
        });
        void this.router.navigate(['/claims', res.requestId]);
      },
      error: (err) => {
        const status = err?.status as number | undefined;
        const detail = this.claimErrorMessage(
          err,
          'Unable to submit claim.',
        );
        this.messages.add({
          severity: status === 400 ? 'warn' : 'error',
          summary: status === 400 ? 'Cannot submit claim' : 'Submit failed',
          detail,
        });
      },
    });
  }

  private claimErrorMessage(err: unknown, fallback: string): string {
    const e = err as {
      error?: { message?: string; title?: string } | string;
      message?: string;
    };
    if (typeof e?.error === 'string' && e.error.trim()) return e.error;
    if (e?.error && typeof e.error === 'object') {
      if (e.error.message?.trim()) return e.error.message;
      if (e.error.title?.trim()) return e.error.title;
    }
    if (e?.message?.trim()) return e.message;
    return fallback;
  }

  private lineRequiresReceipt(
    type: ClaimType,
    line: { lineKind?: string | null },
  ): boolean {
    if (type === 'MonthlyReimbursement') return true;
    if (type === 'OutstationTravel' && line.lineKind === 'Expense') return true;
    return false;
  }

  private async uploadLineDocuments(requestId: string, type: ClaimType): Promise<void> {
    for (let i = 0; i < this.lineItems.controls.length; i++) {
      const line = this.lineItems.at(i).value;
      if (!this.lineRequiresReceipt(type, line)) continue;

      const docs = this.lineDocuments[i];
      if (!docs) continue;

      if (docs.receipt) {
        await firstValueFrom(
          this.api.uploadDocument(requestId, docs.receipt, 'Receipt'),
        );
      }
      if (docs.einvoice) {
        await firstValueFrom(
          this.api.uploadDocument(requestId, docs.einvoice, 'EInvoice'),
        );
      }
    }
  }

  private buildDto(employeeId: string): CreateClaimRequestDto {
    const type = this.form.value.claimType as ClaimType;
    const toIso = (d: Date | null | undefined) =>
      d ? new Date(d).toISOString() : undefined;

    const lineItems: CreateClaimLineItemDto[] = this.lineItems.controls.map((c) => {
      const v = c.value;
      if (type === 'MonthlyReimbursement') {
        return {
          lineKind: 'MonthlyItem',
          category: v.category,
          purchaseDate: toIso(v.purchaseDate),
          amount: Number(v.amount),
          description: v.description ?? '',
        };
      }
      if (type === 'Overtime') {
        return {
          lineKind: 'OvertimeItem',
          workDate: toIso(v.workDate),
          dayType: v.dayType,
          hours: Number(v.hours),
          description: v.description ?? '',
        };
      }
      const kind = v.lineKind as string;
      if (kind === 'Mileage') {
        return {
          lineKind: 'Mileage',
          vehicleType: v.vehicleType,
          kilometers: Number(v.kilometers),
          description: v.description ?? '',
        };
      }
      if (kind === 'MealAllowance') {
        return {
          lineKind: 'MealAllowance',
          mealDays: Number(v.mealDays),
          description: v.description ?? '',
        };
      }
      return {
        lineKind: 'Expense',
        amount: Number(v.amount),
        purchaseDate: toIso(v.purchaseDate),
        description: v.description ?? '',
      };
    });

    return {
      employeeId,
      claimType: type,
      remarks: this.form.value.remarks ?? '',
      destination:
        type === 'OutstationTravel' ? this.form.value.destination : undefined,
      tripStartDate:
        type === 'OutstationTravel' ? toIso(this.form.value.tripStartDate) : undefined,
      tripEndDate:
        type === 'OutstationTravel' ? toIso(this.form.value.tripEndDate) : undefined,
      lineItems,
    };
  }
}
