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
    <div class="claim-apply-page min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <!-- Breadcrumb -->
      <div class="flex items-center gap-2 text-xs text-slate-400 mb-5">
        <a routerLink="/claims" class="hover:text-blue-600 transition-colors">
          Claims
        </a>
        <i class="pi pi-angle-right text-[10px]"></i>
        <span class="font-medium text-slate-600">
          {{ editId ? 'Edit claim' : 'Apply claim' }}
        </span>
      </div>

      <!-- Page header -->
      <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
      >
        <div>
          <h1
            class="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 m-0"
          >
            {{ editId ? 'Edit claim' : 'Apply for a claim' }}
          </h1>
          <p class="text-sm text-slate-500 mt-2 mb-0">
            {{
              editId
                ? 'Update your pending claim details before resubmitting.'
                : 'Complete the information below to submit your reimbursement request.'
            }}
          </p>
        </div>

        <div class="flex items-center gap-2">
          <span class="claim-form-status">
            <i class="pi pi-file-edit"></i>
            {{ editId ? 'Editing draft' : 'New application' }}
          </span>
        </div>
      </div>

      <form
        [formGroup]="form"
        (ngSubmit)="submit()"
        class="flex flex-col gap-5"
      >
        <!-- Claim information -->
        <section class="claim-form-card">
          <div class="claim-section-header">
            <div class="flex items-center gap-3">
              <div class="claim-section-icon">
                <i class="pi pi-file"></i>
              </div>
              <div>
                <h2 class="claim-section-title">Claim information</h2>
                <p class="claim-section-description">
                  Select the claim category and provide general information.
                </p>
              </div>
            </div>
          </div>

          <div class="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div class="flex flex-col gap-2">
              <label class="claim-field-label">
                Claim type <span class="text-red-500">*</span>
              </label>
              <p-select
                formControlName="claimType"
                [options]="claimTypeOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Select claim type"
                appendTo="body"
                styleClass="w-full claim-select"
                (onChange)="onTypeChange()"
              />
            </div>

            <div class="flex flex-col gap-2 md:col-span-2">
              <label class="claim-field-label">Remarks</label>
              <textarea
                pTextarea
                formControlName="remarks"
                rows="3"
                class="w-full claim-textarea"
                placeholder="Provide any additional information about this claim..."
              ></textarea>
              <span class="claim-field-hint">
                Optional. Include any details that may help the approver
                understand your request.
              </span>
            </div>
          </div>
        </section>

        <!-- Outstation trip information -->
        @if (form.value.claimType === 'OutstationTravel') {
          <section class="claim-form-card">
            <div class="claim-section-header">
              <div class="flex items-center gap-3">
                <div class="claim-section-icon claim-section-icon--purple">
                  <i class="pi pi-map-marker"></i>
                </div>
                <div>
                  <h2 class="claim-section-title">Trip information</h2>
                  <p class="claim-section-description">
                    Provide the destination and travel period.
                  </p>
                </div>
              </div>
            </div>

            <div class="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
              <div class="flex flex-col gap-2">
                <label class="claim-field-label">
                  Destination <span class="text-red-500">*</span>
                </label>
                <input
                  pInputText
                  formControlName="destination"
                  class="w-full"
                  placeholder="Enter destination"
                />
              </div>

              <div class="flex flex-col gap-2">
                <label class="claim-field-label">
                  Trip start date <span class="text-red-500">*</span>
                </label>
                <p-datepicker
                  formControlName="tripStartDate"
                  dateFormat="dd/mm/yy"
                  [showIcon]="true"
                  iconDisplay="input"
                  placeholder="Select start date"
                  appendTo="body"
                  styleClass="w-full"
                />
              </div>

              <div class="flex flex-col gap-2">
                <label class="claim-field-label">
                  Trip end date <span class="text-red-500">*</span>
                </label>
                <p-datepicker
                  formControlName="tripEndDate"
                  dateFormat="dd/mm/yy"
                  [showIcon]="true"
                  iconDisplay="input"
                  placeholder="Select end date"
                  appendTo="body"
                  styleClass="w-full"
                />
              </div>
            </div>
          </section>
        }

        <!-- Line items -->
        <section class="claim-form-card">
          <div class="claim-section-header">
            <div
              class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div class="flex items-center gap-3">
                <div class="claim-section-icon claim-section-icon--green">
                  <i class="pi pi-list"></i>
                </div>
                <div>
                  <h2 class="claim-section-title">Claim line items</h2>
                  <p class="claim-section-description">
                    Add the expenses or details included in this claim.
                  </p>
                </div>
              </div>

              <p-button
                label="Add line item"
                icon="pi pi-plus"
                size="small"
                severity="secondary"
                [outlined]="true"
                styleClass="claim-add-line-button"
                (onClick)="addLine()"
              />
            </div>
          </div>

          <div formArrayName="lineItems" class="p-5 sm:p-6 flex flex-col gap-5">
            @for (ctrl of lineItems.controls; track $index; let i = $index) {
              <div class="claim-line-card" [formGroupName]="i">
                <!-- Line heading -->
                <div class="claim-line-header">
                  <div class="flex items-center gap-3">
                    <div class="claim-line-number">{{ i + 1 }}</div>
                    <div>
                      <h3 class="text-sm font-bold text-slate-800 m-0">
                        Line item {{ i + 1 }}
                      </h3>
                      <p class="text-xs text-slate-400 mt-1 mb-0">
                        {{
                          form.value.claimType === 'MonthlyReimbursement'
                            ? 'Reimbursement details'
                            : form.value.claimType === 'Overtime'
                              ? 'Overtime details'
                              : 'Travel expense details'
                        }}
                      </p>
                    </div>
                  </div>

                  <p-button
                    icon="pi pi-trash"
                    severity="danger"
                    [text]="true"
                    [rounded]="true"
                    size="small"
                    pTooltip="Remove line item"
                    (onClick)="removeLine(i)"
                    [disabled]="lineItems.length <= 1"
                  />
                </div>

                <div
                  class="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
                >
                  <!-- MONTHLY REIMBURSEMENT -->
                  @if (form.value.claimType === 'MonthlyReimbursement') {
                    <div class="flex flex-col gap-2">
                      <label class="claim-field-label">
                        Category <span class="text-red-500">*</span>
                      </label>
                      <p-select
                        formControlName="category"
                        [options]="categoryOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Select category"
                        appendTo="body"
                        styleClass="w-full claim-select"
                        (onChange)="onMedicalDraftChanged()"
                      />
                    </div>

                    <div class="flex flex-col gap-2">
                      <label class="claim-field-label">
                        Purchase date <span class="text-red-500">*</span>
                      </label>
                      <p-datepicker
                        formControlName="purchaseDate"
                        dateFormat="dd/mm/yy"
                        [showIcon]="true"
                        iconDisplay="input"
                        placeholder="Select date"
                        appendTo="body"
                        styleClass="w-full"
                      />
                    </div>

                    <div class="flex flex-col gap-2">
                      <label class="claim-field-label">
                        Amount (RM) <span class="text-red-500">*</span>
                      </label>
                      <p-inputNumber
                        formControlName="amount"
                        mode="decimal"
                        [min]="0"
                        [minFractionDigits]="2"
                        [maxFractionDigits]="2"
                        placeholder="0.00"
                        styleClass="w-full"
                        (onInput)="onMedicalDraftChanged()"
                      />
                    </div>

                    @if (ctrl.value.category === 'Medical' && medicalBalance) {
                      <div
                        class="md:col-span-2 xl:col-span-3 claim-medical-info"
                      >
                        <div class="flex items-start gap-3">
                          <i class="pi pi-info-circle mt-0.5"></i>
                          <div class="flex-1">
                            <p class="text-sm font-semibold m-0">
                              Medical reimbursement balance ({{
                                medicalBalance.year
                              }})
                            </p>
                            <div
                              class="flex flex-wrap gap-x-5 gap-y-2 mt-2 text-xs"
                            >
                              <span>
                                Remaining:
                                <strong>
                                  RM
                                  {{
                                    medicalRemainingAfterDraft | number: '1.2-2'
                                  }}
                                </strong>
                              </span>
                              <span>
                                Annual limit:
                                <strong>
                                  RM
                                  {{
                                    medicalBalance.annualLimit | number: '1.2-2'
                                  }}
                                </strong>
                              </span>
                              <span>
                                Per receipt:
                                <strong>
                                  RM
                                  {{
                                    medicalBalance.perReceiptLimit
                                      | number: '1.2-2'
                                  }}
                                </strong>
                              </span>
                            </div>
                            @if (medicalBalance.isProrated) {
                              <p class="text-xs mt-2 mb-0">
                                <i class="pi pi-info-circle mr-1"></i>
                                Your annual medical limit is pro-rated.
                              </p>
                            }
                          </div>
                        </div>
                      </div>
                    }

                    <div
                      class="md:col-span-2 xl:col-span-3 flex flex-col gap-2"
                    >
                      <label class="claim-field-label">Description</label>
                      <input
                        pInputText
                        formControlName="description"
                        class="w-full"
                        placeholder="Describe the item or expense"
                      />
                    </div>

                    <!-- Monthly receipt -->
                    <div
                      class="md:col-span-2 xl:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                      <div class="flex flex-col gap-2">
                        <label class="claim-field-label">
                          Receipt <span class="text-red-500">*</span>
                        </label>

                        <input
                          #lineReceiptFile
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                          (change)="onLineReceiptSelected(i, $event)"
                          hidden
                        />

                        <div class="claim-upload-box">
                          <div class="flex items-center gap-3 min-w-0">
                            <div class="claim-upload-icon">
                              <i class="pi pi-file-pdf"></i>
                            </div>
                            <div class="min-w-0">
                              <p
                                class="text-sm font-semibold text-slate-700 m-0"
                              >
                                {{
                                  lineDocuments[i].receipt
                                    ? lineDocuments[i].receipt!.name
                                    : 'No receipt selected'
                                }}
                              </p>
                              <p class="text-xs text-slate-400 mt-1 mb-0">
                                PDF, JPG or PNG
                              </p>
                            </div>
                          </div>

                          <p-button
                            [label]="
                              lineDocuments[i].receipt ? 'Change' : 'Upload'
                            "
                            severity="secondary"
                            [outlined]="true"
                            icon="pi pi-upload"
                            size="small"
                            styleClass="claim-upload-button"
                            (onClick)="lineReceiptFile.click()"
                          />
                        </div>
                      </div>

                      <div class="flex flex-col gap-2">
                        <label class="claim-field-label">
                          E-invoice
                          <span class="text-slate-400 font-normal"
                            >(Optional)</span
                          >
                        </label>

                        <input
                          #lineEinvoiceFile
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                          (change)="onLineEinvoiceSelected(i, $event)"
                          hidden
                        />

                        <div class="claim-upload-box">
                          <div class="flex items-center gap-3 min-w-0">
                            <div
                              class="claim-upload-icon claim-upload-icon--blue"
                            >
                              <i class="pi pi-file"></i>
                            </div>
                            <div class="min-w-0">
                              <p
                                class="text-sm font-semibold text-slate-700 m-0"
                              >
                                {{
                                  lineDocuments[i].einvoice
                                    ? lineDocuments[i].einvoice!.name
                                    : 'No e-invoice selected'
                                }}
                              </p>
                              <p class="text-xs text-slate-400 mt-1 mb-0">
                                PDF, JPG or PNG
                              </p>
                            </div>
                          </div>

                          <p-button
                            [label]="
                              lineDocuments[i].einvoice ? 'Change' : 'Upload'
                            "
                            severity="secondary"
                            [outlined]="true"
                            icon="pi pi-upload"
                            size="small"
                            styleClass="claim-upload-button"
                            (onClick)="lineEinvoiceFile.click()"
                          />
                        </div>
                      </div>
                    </div>
                  }

                  <!-- OVERTIME -->
                  @if (form.value.claimType === 'Overtime') {
                    <div class="flex flex-col gap-2">
                      <label class="claim-field-label">
                        Work date <span class="text-red-500">*</span>
                      </label>
                      <p-datepicker
                        formControlName="workDate"
                        dateFormat="dd/mm/yy"
                        [showIcon]="true"
                        iconDisplay="input"
                        placeholder="Select work date"
                        appendTo="body"
                        styleClass="w-full"
                      />
                    </div>

                    <div class="flex flex-col gap-2">
                      <label class="claim-field-label">
                        Day type <span class="text-red-500">*</span>
                      </label>
                      <p-select
                        formControlName="dayType"
                        [options]="dayTypeOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Select day type"
                        appendTo="body"
                        styleClass="w-full"
                        (onChange)="previewOt(i)"
                      />
                    </div>

                    <div class="flex flex-col gap-2">
                      <label class="claim-field-label">
                        Hours <span class="text-red-500">*</span>
                      </label>
                      <p-inputNumber
                        formControlName="hours"
                        mode="decimal"
                        [min]="0"
                        [minFractionDigits]="1"
                        [maxFractionDigits]="2"
                        placeholder="Enter hours"
                        styleClass="w-full"
                        (onInput)="previewOt(i)"
                      />
                    </div>

                    <div class="md:col-span-2 xl:col-span-3 claim-ot-preview">
                      <div class="flex items-center gap-3">
                        <div class="claim-ot-icon">
                          <i class="pi pi-calculator"></i>
                        </div>
                        <div>
                          <p class="text-xs text-slate-500 m-0">
                            Estimated overtime amount
                          </p>
                          <p
                            class="text-xl font-bold text-slate-900 mt-1 mb-0 tabular-nums"
                          >
                            {{
                              otPreviews[i] != null
                                ? 'RM ' + (otPreviews[i] | number: '1.2-2')
                                : '—'
                            }}
                          </p>
                        </div>
                      </div>
                      <span class="text-xs text-slate-400">
                        Calculated based on your selected day type and hours.
                      </span>
                    </div>

                    <div
                      class="md:col-span-2 xl:col-span-3 flex flex-col gap-2"
                    >
                      <label class="claim-field-label">Description</label>
                      <input
                        pInputText
                        formControlName="description"
                        class="w-full"
                        placeholder="Additional overtime details"
                      />
                    </div>
                  }

                  <!-- OUTSTATION -->
                  @if (form.value.claimType === 'OutstationTravel') {
                    <div class="flex flex-col gap-2">
                      <label class="claim-field-label">
                        Expense type <span class="text-red-500">*</span>
                      </label>
                      <p-select
                        formControlName="lineKind"
                        [options]="outstationKindOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Select expense type"
                        appendTo="body"
                        styleClass="w-full"
                      />
                    </div>

                    @if (ctrl.value.lineKind === 'Mileage') {
                      <div class="flex flex-col gap-2">
                        <label class="claim-field-label">
                          Vehicle <span class="text-red-500">*</span>
                        </label>
                        <p-select
                          formControlName="vehicleType"
                          [options]="vehicleOptions"
                          optionLabel="label"
                          optionValue="value"
                          placeholder="Select vehicle"
                          appendTo="body"
                          styleClass="w-full"
                        />
                      </div>

                      <div class="flex flex-col gap-2">
                        <label class="claim-field-label">
                          Distance (KM) <span class="text-red-500">*</span>
                        </label>
                        <p-inputNumber
                          formControlName="kilometers"
                          mode="decimal"
                          [min]="0"
                          [minFractionDigits]="1"
                          placeholder="Enter distance"
                          styleClass="w-full"
                        />
                      </div>
                    }

                    @if (ctrl.value.lineKind === 'Expense') {
                      <div class="flex flex-col gap-2">
                        <label class="claim-field-label">
                          Amount (RM) <span class="text-red-500">*</span>
                        </label>
                        <p-inputNumber
                          formControlName="amount"
                          mode="decimal"
                          [min]="0"
                          [minFractionDigits]="2"
                          [maxFractionDigits]="2"
                          placeholder="0.00"
                          styleClass="w-full"
                        />
                      </div>

                      <div class="flex flex-col gap-2">
                        <label class="claim-field-label">
                          Purchase date <span class="text-red-500">*</span>
                        </label>
                        <p-datepicker
                          formControlName="purchaseDate"
                          dateFormat="dd/mm/yy"
                          [showIcon]="true"
                          iconDisplay="input"
                          placeholder="Select date"
                          appendTo="body"
                          styleClass="w-full"
                        />
                      </div>

                      <div
                        class="md:col-span-2 xl:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4"
                      >
                        <div class="flex flex-col gap-2">
                          <label class="claim-field-label">
                            Receipt <span class="text-red-500">*</span>
                          </label>
                          <input
                            #expenseReceiptFile
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                            (change)="onLineReceiptSelected(i, $event)"
                            hidden
                          />

                          <div class="claim-upload-box">
                            <div class="flex items-center gap-3 min-w-0">
                              <div class="claim-upload-icon">
                                <i class="pi pi-file-pdf"></i>
                              </div>
                              <div class="min-w-0">
                                <p
                                  class="text-sm font-semibold text-slate-700 m-0"
                                >
                                  {{
                                    lineDocuments[i].receipt
                                      ? lineDocuments[i].receipt!.name
                                      : 'No receipt selected'
                                  }}
                                </p>
                                <p class="text-xs text-slate-400 mt-1 mb-0">
                                  PDF, JPG or PNG
                                </p>
                              </div>
                            </div>
                            <p-button
                              [label]="
                                lineDocuments[i].receipt ? 'Change' : 'Upload'
                              "
                              severity="secondary"
                              [outlined]="true"
                              icon="pi pi-upload"
                              size="small"
                              styleClass="claim-upload-button"
                              (onClick)="expenseReceiptFile.click()"
                            />
                          </div>
                        </div>

                        <div class="flex flex-col gap-2">
                          <label class="claim-field-label">
                            E-invoice
                            <span class="text-slate-400 font-normal"
                              >(Optional)</span
                            >
                          </label>
                          <input
                            #expenseEinvoiceFile
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                            (change)="onLineEinvoiceSelected(i, $event)"
                            hidden
                          />

                          <div class="claim-upload-box">
                            <div class="flex items-center gap-3 min-w-0">
                              <div
                                class="claim-upload-icon claim-upload-icon--blue"
                              >
                                <i class="pi pi-file"></i>
                              </div>
                              <div class="min-w-0">
                                <p
                                  class="text-sm font-semibold text-slate-700 m-0"
                                >
                                  {{
                                    lineDocuments[i].einvoice
                                      ? lineDocuments[i].einvoice!.name
                                      : 'No e-invoice selected'
                                  }}
                                </p>
                                <p class="text-xs text-slate-400 mt-1 mb-0">
                                  PDF, JPG or PNG
                                </p>
                              </div>
                            </div>
                            <p-button
                              [label]="
                                lineDocuments[i].einvoice ? 'Change' : 'Upload'
                              "
                              severity="secondary"
                              [outlined]="true"
                              icon="pi pi-upload"
                              size="small"
                              styleClass="claim-upload-button"
                              (onClick)="expenseEinvoiceFile.click()"
                            />
                          </div>
                        </div>
                      </div>
                    }

                    @if (ctrl.value.lineKind === 'MealAllowance') {
                      <div class="flex flex-col gap-2">
                        <label class="claim-field-label">
                          Meal days <span class="text-red-500">*</span>
                        </label>
                        <p-inputNumber
                          formControlName="mealDays"
                          [min]="1"
                          [showButtons]="true"
                          placeholder="Number of days"
                          styleClass="w-full"
                        />
                      </div>

                      <div class="md:col-span-2 flex items-center">
                        <div class="claim-meal-rate">
                          <i class="pi pi-info-circle"></i>
                          Meal allowance rate:
                          <strong
                            >RM {{ mealRate | number: '1.2-2' }}/day</strong
                          >
                        </div>
                      </div>
                    }

                    <div
                      class="md:col-span-2 xl:col-span-3 flex flex-col gap-2"
                    >
                      <label class="claim-field-label">Description</label>
                      <input
                        pInputText
                        formControlName="description"
                        class="w-full"
                        placeholder="Describe this travel expense"
                      />
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </section>

        <!-- Form actions -->
        <div class="claim-form-footer">
          <div class="flex items-start gap-2 text-xs text-slate-500">
            <i class="pi pi-info-circle mt-0.5"></i>
            <span>
              Please check all information and required attachments before
              submitting.
            </span>
          </div>

          <div
            class="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2"
          >
            <p-button
              label="Cancel"
              severity="secondary"
              [outlined]="true"
              routerLink="/claims"
              styleClass="claim-cancel-button"
            />

            <p-button
              [label]="editId ? 'Save changes' : 'Submit claim'"
              [icon]="editId ? 'pi pi-save' : 'pi pi-send'"
              type="submit"
              styleClass="claim-submit-button"
              [loading]="saving"
            />
          </div>
        </div>
      </form>
    </div>
  `,
  styleUrl: './claim-apply.less',
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
    {
      label: CLAIM_TYPE_LABELS['MonthlyReimbursement'],
      value: 'MonthlyReimbursement',
    },
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
    return Math.max(
      0,
      this.medicalBalance.remainingAmount - this.draftMedicalTotal,
    );
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
              tripStartDate: req.tripStartDate
                ? new Date(req.tripStartDate)
                : null,
              tripEndDate: req.tripEndDate ? new Date(req.tripEndDate) : null,
            });
            this.lineItems.clear();
            for (const line of req.lineItems) {
              this.lineItems.push(
                this.fb.group({
                  lineKind: [line.lineKind],
                  category: [line.category],
                  purchaseDate: [
                    line.purchaseDate ? new Date(line.purchaseDate) : null,
                  ],
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
    if (!user?.userId || this.form.value.claimType !== 'MonthlyReimbursement')
      return;

    this.medicalBalanceLoaded = true;
    this.api
      .getMedicalBalance(
        user.userId,
        new Date().getFullYear(),
        this.editId ?? undefined,
      )
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
        if (
          this.lineRequiresReceipt(type, line) &&
          !this.lineDocuments[i].receipt
        ) {
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
    if (
      this.form.value.claimType === 'MonthlyReimbursement' &&
      this.medicalBalance
    ) {
      const medicalLines = this.lineItems.controls.filter(
        (c) => c.value.category === 'Medical',
      );
      if (medicalLines.length > 0) {
        if (this.draftMedicalTotal > this.medicalBalance.remainingAmount) {
          const overBy =
            this.draftMedicalTotal - this.medicalBalance.remainingAmount;
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

    req$
      .pipe(
        finalize(() => {
          this.saving = false;
          this.loading.stop();
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: async (res) => {
          try {
            await this.uploadLineDocuments(res.requestId, type);
          } catch {
            this.messages.add({
              severity: 'warn',
              summary: 'Claim saved',
              detail:
                'Claim submitted but document upload failed. You can retry from the detail page.',
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
          const detail = this.claimErrorMessage(err, 'Unable to submit claim.');
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

  private async uploadLineDocuments(
    requestId: string,
    type: ClaimType,
  ): Promise<void> {
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

    const lineItems: CreateClaimLineItemDto[] = this.lineItems.controls.map(
      (c) => {
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
      },
    );

    return {
      employeeId,
      claimType: type,
      remarks: this.form.value.remarks ?? '',
      destination:
        type === 'OutstationTravel' ? this.form.value.destination : undefined,
      tripStartDate:
        type === 'OutstationTravel'
          ? toIso(this.form.value.tripStartDate)
          : undefined,
      tripEndDate:
        type === 'OutstationTravel'
          ? toIso(this.form.value.tripEndDate)
          : undefined,
      lineItems,
    };
  }
}
