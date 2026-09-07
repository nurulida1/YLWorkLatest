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
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    <div class="w-full min-h-screen bg-[#f4f6f8] p-6 flex flex-col gap-5" *ngIf="settings">
      <div class="flex items-center gap-1.5 text-sm text-gray-500">
        <a routerLink="/dashboard" class="hover:text-blue-600">Dashboard</a>
        <span>/</span>
        <span class="text-gray-700 font-semibold">Claim settings</span>
      </div>

      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold m-0">Claim settings</h1>
          <p class="text-sm text-gray-500 mt-1 m-0">
            Configure reimbursement caps, mileage/meal rates, OT multipliers, and default hours.
          </p>
        </div>
        <p-button label="Save" icon="pi pi-save" (onClick)="save()" [loading]="saving" />
      </div>

      <div class="bg-white rounded-lg shadow-sm p-5 grid grid-cols-12 gap-4">
        <h2 class="col-span-12 text-lg font-semibold m-0">Monthly reimbursement limits</h2>
        <div class="col-span-12 md:col-span-4 flex flex-col gap-1">
          <label>Medical per receipt (RM)</label>
          <p-inputNumber [(ngModel)]="settings.medicalPerReceiptLimit" mode="decimal" [minFractionDigits]="2" styleClass="w-full" />
        </div>
        <div class="col-span-12 md:col-span-4 flex flex-col gap-1">
          <label>Medical annual limit (RM)</label>
          <p-inputNumber [(ngModel)]="settings.medicalAnnualLimit" mode="decimal" [minFractionDigits]="2" styleClass="w-full" />
        </div>
        <div class="col-span-12 md:col-span-4 flex flex-col gap-1">
          <label>Safety shoes limit (RM)</label>
          <p-inputNumber [(ngModel)]="settings.safetyShoesLimit" mode="decimal" [minFractionDigits]="2" styleClass="w-full" />
        </div>

        <h2 class="col-span-12 text-lg font-semibold m-0 mt-2">Outstation rates</h2>
        <div class="col-span-12 md:col-span-4 flex flex-col gap-1">
          <label>Car mileage (RM/km)</label>
          <p-inputNumber [(ngModel)]="settings.mileageCarRatePerKm" mode="decimal" [minFractionDigits]="2" [maxFractionDigits]="4" styleClass="w-full" />
        </div>
        <div class="col-span-12 md:col-span-4 flex flex-col gap-1">
          <label>Motorcycle mileage (RM/km)</label>
          <p-inputNumber [(ngModel)]="settings.mileageMotorcycleRatePerKm" mode="decimal" [minFractionDigits]="2" [maxFractionDigits]="4" styleClass="w-full" />
        </div>
        <div class="col-span-12 md:col-span-4 flex flex-col gap-1">
          <label>Meal allowance (RM/day)</label>
          <p-inputNumber [(ngModel)]="settings.mealAllowancePerDay" mode="decimal" [minFractionDigits]="2" styleClass="w-full" />
        </div>

        <h2 class="col-span-12 text-lg font-semibold m-0 mt-2">Overtime calculation</h2>
        <div class="col-span-12 md:col-span-3 flex flex-col gap-1">
          <label>Ordinary rate divisor (days)</label>
          <p-inputNumber [(ngModel)]="settings.ordinaryRateDivisorDays" [min]="1" styleClass="w-full" />
        </div>
        <div class="col-span-12 md:col-span-3 flex flex-col gap-1">
          <label>Ordinary day hours</label>
          <p-inputNumber [(ngModel)]="settings.ordinaryDayHours" [min]="1" styleClass="w-full" />
        </div>
        <div class="col-span-12 md:col-span-3 flex flex-col gap-1">
          <label>Normal day OT × hourly</label>
          <p-inputNumber [(ngModel)]="settings.otNormalMultiplier" mode="decimal" [minFractionDigits]="2" styleClass="w-full" />
        </div>
        <div class="col-span-12 md:col-span-3 flex flex-col gap-1">
          <label>Rest day first band × ordinary</label>
          <p-inputNumber [(ngModel)]="settings.otRestDayFirstBandMultiplier" mode="decimal" [minFractionDigits]="2" styleClass="w-full" />
        </div>
        <div class="col-span-12 md:col-span-3 flex flex-col gap-1">
          <label>Rest day second band × ordinary</label>
          <p-inputNumber [(ngModel)]="settings.otRestDaySecondBandMultiplier" mode="decimal" [minFractionDigits]="2" styleClass="w-full" />
        </div>
        <div class="col-span-12 md:col-span-3 flex flex-col gap-1">
          <label>Rest day after 8h × hourly</label>
          <p-inputNumber [(ngModel)]="settings.otRestDayAfter8HourlyMultiplier" mode="decimal" [minFractionDigits]="2" styleClass="w-full" />
        </div>
        <div class="col-span-12 md:col-span-3 flex flex-col gap-1">
          <label>PH up to 8h × ordinary</label>
          <p-inputNumber [(ngModel)]="settings.otPublicHolidayUpTo8Multiplier" mode="decimal" [minFractionDigits]="2" styleClass="w-full" />
        </div>
        <div class="col-span-12 md:col-span-3 flex flex-col gap-1">
          <label>PH after 8h × hourly</label>
          <p-inputNumber [(ngModel)]="settings.otPublicHolidayAfter8HourlyMultiplier" mode="decimal" [minFractionDigits]="2" styleClass="w-full" />
        </div>

        <h2 class="col-span-12 text-lg font-semibold m-0 mt-2">Default company working hours</h2>
        <div class="col-span-12 md:col-span-3 flex flex-col gap-1">
          <label>Work start (HH:mm)</label>
          <input pInputText [(ngModel)]="settings.defaultWorkStartTime" class="w-full" />
        </div>
        <div class="col-span-12 md:col-span-3 flex flex-col gap-1">
          <label>Work end (HH:mm)</label>
          <input pInputText [(ngModel)]="settings.defaultWorkEndTime" class="w-full" />
        </div>
        <div class="col-span-12 md:col-span-3 flex items-center gap-2 pt-6">
          <p-checkbox [(ngModel)]="settings.defaultUsesRestDayHalfDay" [binary]="true" inputId="half" />
          <label for="half">Rest day half-day schedule</label>
        </div>
        <div class="col-span-12 md:col-span-3 flex flex-col gap-1">
          <label>Half-day start</label>
          <input pInputText [(ngModel)]="settings.defaultRestDayHalfDayStart" class="w-full" />
        </div>
        <div class="col-span-12 md:col-span-3 flex flex-col gap-1">
          <label>Half-day end</label>
          <input pInputText [(ngModel)]="settings.defaultRestDayHalfDayEnd" class="w-full" />
        </div>
      </div>
    </div>
  `,
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
      });
  }

  save(): void {
    if (!this.settings) return;
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
        error: (err) =>
          this.messages.add({
            severity: 'error',
            summary: 'Failed',
            detail: err?.error?.message ?? 'Save failed.',
          }),
      });
  }
}
