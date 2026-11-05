import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { finalize } from 'rxjs';
import { ClaimSettingsDto } from '../../../models/Claim';
import { ClaimSettingsService } from '../../../services/claim-settings.service';
import { LoadingService } from '../../../services/loading.service';

@Component({
  selector: 'app-claim-settings',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    InputNumberModule,
    InputTextModule,
    CheckboxModule,
  ],
  template: `
    <div
      class="min-h-screen w-full bg-slate-50 p-4 sm:p-6 lg:p-8"
      *ngIf="settings as s"
    >
      <div class="flex flex-col gap-6">
        <!-- Breadcrumb -->
        <div class="flex items-center gap-2 text-sm">
          <a
            routerLink="/dashboard"
            class="text-slate-400 hover:text-blue-600 transition-colors"
          >
            Dashboard
          </a>
          <i class="pi pi-angle-right text-xs text-slate-300"></i>
          <span class="font-medium text-slate-700">Claim Settings</span>
        </div>

        <!-- Page Header -->
        <div
          class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <div class="flex items-center gap-3">
              <div
                class="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600"
              >
                <i class="pi pi-sliders-h text-xl"></i>
              </div>
              <div>
                <h1 class="m-0 text-2xl font-bold text-slate-800">
                  Claim Settings
                </h1>
                <p class="mt-1 mb-0 text-sm text-slate-500">
                  Manage company reimbursement rates and claim calculation
                  rules.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Information -->
        <div
          class="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4"
        >
          <i class="pi pi-info-circle mt-0.5 text-blue-600"></i>
          <div>
            <p class="m-0 text-sm font-semibold text-blue-800">
              Company-wide configuration
            </p>
            <p class="mt-1 mb-0 text-sm text-blue-700">
              Changes made here will be used as the default rates and
              calculation rules when employees submit claims.
            </p>
          </div>
        </div>

        <!-- Reimbursement Limits -->
        <section class="settings-card">
          <div class="section-header">
            <div class="section-icon bg-emerald-100 text-emerald-600">
              <i class="pi pi-wallet"></i>
            </div>
            <div>
              <h2 class="section-title">Reimbursement Limits</h2>
              <p class="section-description">
                Configure the maximum reimbursable amounts for employee claims.
              </p>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-field">
              <label>Medical per receipt</label>
              <p-inputNumber
                [(ngModel)]="s.medicalPerReceiptLimit"
                mode="decimal"
                [min]="0"
                [minFractionDigits]="2"
                styleClass="w-full"
              />
              <small>Maximum amount per medical receipt.</small>
            </div>

            <div class="form-field">
              <label>Medical annual limit</label>
              <p-inputNumber
                [(ngModel)]="s.medicalAnnualLimit"
                mode="decimal"
                [min]="0"
                [minFractionDigits]="2"
                styleClass="w-full"
              />
              <small>Maximum medical reimbursement per year.</small>
            </div>

            <div class="form-field">
              <label>Safety shoes limit</label>
              <p-inputNumber
                [(ngModel)]="s.safetyShoesLimit"
                mode="decimal"
                [min]="0"
                [minFractionDigits]="2"
                styleClass="w-full"
              />
              <small>Maximum safety shoes reimbursement.</small>
            </div>
          </div>
        </section>

        <!-- Outstation Rates -->
        <section class="settings-card">
          <div class="section-header">
            <div class="section-icon bg-orange-100 text-orange-600">
              <i class="pi pi-car"></i>
            </div>
            <div>
              <h2 class="section-title">Outstation Rates</h2>
              <p class="section-description">
                Set mileage reimbursement and daily meal allowance rates.
              </p>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-field">
              <label>Car mileage rate</label>
              <p-inputNumber
                [(ngModel)]="s.mileageCarRatePerKm"
                mode="decimal"
                [min]="0"
                [minFractionDigits]="2"
                [maxFractionDigits]="4"
                suffix=" / km"
                styleClass="w-full"
              />
              <small>Reimbursement for each kilometre travelled by car.</small>
            </div>

            <div class="form-field">
              <label>Motorcycle mileage rate</label>
              <p-inputNumber
                [(ngModel)]="s.mileageMotorcycleRatePerKm"
                mode="decimal"
                [min]="0"
                [minFractionDigits]="2"
                [maxFractionDigits]="4"
                suffix=" / km"
                styleClass="w-full"
              />
              <small
                >Reimbursement for each kilometre travelled by
                motorcycle.</small
              >
            </div>

            <div class="form-field">
              <label>Meal allowance</label>
              <p-inputNumber
                [(ngModel)]="s.mealAllowancePerDay"
                mode="decimal"
                [min]="0"
                [minFractionDigits]="2"
                suffix=" / day"
                styleClass="w-full"
              />
              <small>Daily meal allowance for eligible outstation trips.</small>
            </div>
          </div>
        </section>

        <!-- Overtime -->
        <section class="settings-card">
          <div class="section-header">
            <div class="section-icon bg-purple-100 text-purple-600">
              <i class="pi pi-clock"></i>
            </div>
            <div>
              <h2 class="section-title">Overtime Calculation</h2>
              <p class="section-description">
                Configure the multipliers used to calculate employee overtime
                payments.
              </p>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-field">
              <label>Ordinary rate divisor</label>
              <p-inputNumber
                [(ngModel)]="s.ordinaryRateDivisorDays"
                [min]="1"
                styleClass="w-full"
              />
              <small>Number of days used to calculate the ordinary rate.</small>
            </div>

            <div class="form-field">
              <label>Ordinary day hours</label>
              <p-inputNumber
                [(ngModel)]="s.ordinaryDayHours"
                [min]="1"
                styleClass="w-full"
              />
              <small>Standard working hours per day.</small>
            </div>

            <div class="form-field">
              <label>Normal day OT</label>
              <p-inputNumber
                [(ngModel)]="s.otNormalMultiplier"
                mode="decimal"
                [min]="0"
                [minFractionDigits]="2"
                suffix=" × hourly"
                styleClass="w-full"
              />
              <small>Multiplier for overtime on normal working days.</small>
            </div>

            <div class="form-field">
              <label>Rest day — first band</label>
              <p-inputNumber
                [(ngModel)]="s.otRestDayFirstBandMultiplier"
                mode="decimal"
                [min]="0"
                [minFractionDigits]="2"
                suffix=" × ordinary"
                styleClass="w-full"
              />
              <small>Multiplier for the first rest-day overtime band.</small>
            </div>

            <div class="form-field">
              <label>Rest day — second band</label>
              <p-inputNumber
                [(ngModel)]="s.otRestDaySecondBandMultiplier"
                mode="decimal"
                [min]="0"
                [minFractionDigits]="2"
                suffix=" × ordinary"
                styleClass="w-full"
              />
              <small>Multiplier for the second rest-day overtime band.</small>
            </div>

            <div class="form-field">
              <label>Rest day — after 8 hours</label>
              <p-inputNumber
                [(ngModel)]="s.otRestDayAfter8HourlyMultiplier"
                mode="decimal"
                [min]="0"
                [minFractionDigits]="2"
                suffix=" × hourly"
                styleClass="w-full"
              />
              <small>Multiplier for rest-day overtime exceeding 8 hours.</small>
            </div>

            <div class="form-field">
              <label>Public holiday — up to 8 hours</label>
              <p-inputNumber
                [(ngModel)]="s.otPublicHolidayUpTo8Multiplier"
                mode="decimal"
                [min]="0"
                [minFractionDigits]="2"
                suffix=" × ordinary"
                styleClass="w-full"
              />
              <small
                >Multiplier for the first 8 hours on a public holiday.</small
              >
            </div>

            <div class="form-field">
              <label>Public holiday — after 8 hours</label>
              <p-inputNumber
                [(ngModel)]="s.otPublicHolidayAfter8HourlyMultiplier"
                mode="decimal"
                [min]="0"
                [minFractionDigits]="2"
                suffix=" × hourly"
                styleClass="w-full"
              />
              <small
                >Multiplier for public holiday overtime exceeding 8
                hours.</small
              >
            </div>
          </div>
        </section>

        <!-- Working Hours -->
        <section class="settings-card">
          <div class="section-header">
            <div class="section-icon bg-blue-100 text-blue-600">
              <i class="pi pi-calendar-clock"></i>
            </div>
            <div>
              <h2 class="section-title">Default Company Working Hours</h2>
              <p class="section-description">
                Set the standard working schedule and optional rest-day half-day
                hours.
              </p>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-field">
              <label>Work start time</label>
              <input
                pInputText
                type="time"
                [(ngModel)]="s.defaultWorkStartTime"
                class="w-full"
              />
              <small>Default start time (HH:mm).</small>
            </div>

            <div class="form-field">
              <label>Work end time</label>
              <input
                pInputText
                type="time"
                [(ngModel)]="s.defaultWorkEndTime"
                class="w-full"
              />
              <small>Default end time (HH:mm).</small>
            </div>
          </div>

          <div class="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div
              class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p class="m-0 font-semibold text-slate-800">
                  Rest day half-day schedule
                </p>
                <p class="mt-1 mb-0 text-sm text-slate-500">
                  Enable a separate working schedule for rest-day half days.
                </p>
              </div>

              <div class="flex items-center gap-2">
                <p-checkbox
                  [(ngModel)]="s.defaultUsesRestDayHalfDay"
                  [binary]="true"
                  inputId="half"
                />
                <label
                  for="half"
                  class="cursor-pointer text-sm font-medium text-slate-700"
                >
                  Enable schedule
                </label>
              </div>
            </div>

            <div
              class="mt-4 grid grid-cols-1 gap-4 border-t border-slate-200 pt-4 sm:grid-cols-2"
              *ngIf="s.defaultUsesRestDayHalfDay"
            >
              <div class="form-field">
                <label>Half-day start time</label>
                <input
                  pInputText
                  type="time"
                  [(ngModel)]="s.defaultRestDayHalfDayStart"
                  class="w-full"
                />
              </div>

              <div class="form-field">
                <label>Half-day end time</label>
                <input
                  pInputText
                  type="time"
                  [(ngModel)]="s.defaultRestDayHalfDayEnd"
                  class="w-full"
                />
              </div>
            </div>
          </div>
        </section>

        <!-- Bottom Save -->
        <div
          class="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <p class="m-0 text-xs text-slate-400">
            Make sure all rates and working hours are correct before saving.
          </p>

          <p-button
            label="Save Changes"
            icon="pi pi-save"
            (onClick)="save()"
            [loading]="saving"
            [disabled]="saving"
            styleClass="!px-6 !py-2.5 !rounded-lg bg-blue-900! border-none!"
          />
        </div>
      </div>
    </div>
  `,
  styleUrl: './claim-settings.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClaimSettingsPage implements OnInit {
  private readonly api = inject(ClaimSettingsService);
  private readonly messages = inject(MessageService);
  private readonly loading = inject(LoadingService);
  private readonly cdr = inject(ChangeDetectorRef);

  settings: ClaimSettingsDto | null = null;
  saving = false;

  ngOnInit(): void {
    this.loading.start();

    this.api
      .get()
      .pipe(finalize(() => this.loading.stop()))
      .subscribe({
        next: (s) => {
          this.settings = s;
          this.cdr.markForCheck();
        },
        error: () => {
          this.messages.add({
            severity: 'error',
            summary: 'Failed',
            detail: 'Unable to load claim settings.',
          });
          this.cdr.markForCheck();
        },
      });
  }

  save(): void {
    if (!this.settings || this.saving) return;

    this.saving = true;

    const { id: _id, ...dto } = this.settings;

    this.api
      .upsert(dto)
      .pipe(
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (s) => {
          this.settings = s;
          this.messages.add({
            severity: 'success',
            summary: 'Saved',
            detail: 'Claim settings updated.',
          });
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.messages.add({
            severity: 'error',
            summary: 'Failed',
            detail: err?.error?.message ?? 'Save failed.',
          });
        },
      });
  }
}
