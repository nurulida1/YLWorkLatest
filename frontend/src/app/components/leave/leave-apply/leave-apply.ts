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
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { forkJoin, merge, of, Subject, takeUntil } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { LeaveBalanceAllocationDto, LeaveBalanceDto, LeaveDaySession, LeaveTypeDto } from '../../../models/Leave';
import {
  calculateChargeableDaysClient,
  formatDaysAmount,
  formatSessionLabel,
  normalizeLeaveSession,
} from '../../../common/leave-day.util';
import { LeaveBalanceService } from '../../../services/leave-balance.service';
import { LeaveHolidayService } from '../../../services/leave-holiday.service';
import { LeaveRequestService } from '../../../services/leave-request.service';
import { LeaveTypeService } from '../../../services/leave-type.service';
import { LoadingService } from '../../../services/loading.service';
import { UserService } from '../../../services/userService.service';

@Component({
  selector: 'app-leave-apply',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    SelectModule,
    DatePickerModule,
    TextareaModule,
    CheckboxModule,
  ],
  template: `
    <div class="w-full flex flex-col p-5 gap-4">
      <div class="flex items-center gap-1 text-gray-500 text-sm">
        <a routerLink="/dashboard" class="hover:text-gray-700">Dashboard</a>
        <span>/</span>
        <a routerLink="/leave" class="hover:text-gray-700">Leave</a>
        <span>/</span>
        <span class="text-gray-800 font-semibold">Apply</span>
      </div>

      <div class="bg-white border border-gray-200 rounded-lg p-6 max-w-2xl">
        <h1 class="text-xl font-semibold text-gray-800 mb-1">{{ isEditMode ? 'Edit Leave Request' : 'Apply for Leave' }}</h1>
        <p class="text-gray-500 text-sm mb-6">
          {{ isEditMode ? 'Update your pending leave request.' : 'Submit a new leave request for HOD approval.' }}
        </p>

        @if (!isEditMode && willAutoApprove) {
          <div class="rounded-md bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-900 mb-4">
            No reporting manager is assigned to your profile — this request will be auto-approved on submit.
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col gap-4">
          <div>
            <label class="text-sm text-gray-600 mb-1 block">Leave type</label>
            <p-select
              formControlName="leaveTypeId"
              [options]="leaveTypes"
              optionLabel="name"
              optionValue="id"
              placeholder="Select type"
              class="w-full"
            />
            @if (pageReady && leaveTypes.length === 0) {
              <p class="text-amber-600 text-xs mt-1">No leave types found. Run the API seed or add types in settings.</p>
            }
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="text-sm text-gray-600 mb-1 block">Start date</label>
              <p-datepicker
                formControlName="startDate"
                dateFormat="dd/mm/yy"
                class="w-full"
                [disabledDates]="disabledHolidayDates"
                (onSelect)="onLeaveDatePicked()"
                (onClear)="onLeaveDatePicked()"
              />
            </div>
            <div>
              <label class="text-sm text-gray-600 mb-1 block">End date</label>
              <p-datepicker
                formControlName="endDate"
                dateFormat="dd/mm/yy"
                class="w-full"
                [disabledDates]="disabledHolidayDates"
                (onSelect)="onLeaveDatePicked()"
                (onClear)="onLeaveDatePicked()"
              />
            </div>
          </div>
          @if (selectedLeaveType?.allowsHalfDay) {
            @if (isSameDayLeave) {
              <div>
                <label class="text-sm text-gray-600 mb-1 block">Session</label>
                <p-select
                  formControlName="startSession"
                  [options]="fullSessionOptions"
                  optionLabel="label"
                  optionValue="value"
                  class="w-full max-w-md"
                />
                <p class="text-xs text-gray-500 mt-1 m-0">Half day (AM or PM) deducts 0.5 day.</p>
              </div>
            } @else {
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 -mt-1">
                <div>
                  <label class="text-sm text-gray-600 mb-1 block">Start session</label>
                  <p-select
                    formControlName="startSession"
                    [options]="startSessionOptions"
                    optionLabel="label"
                    optionValue="value"
                    class="w-full"
                  />
                </div>
                <div>
                  <label class="text-sm text-gray-600 mb-1 block">End session</label>
                  <p-select
                    formControlName="endSession"
                    [options]="endSessionOptions"
                    optionLabel="label"
                    optionValue="value"
                    class="w-full"
                  />
                </div>
              </div>
              <p class="text-xs text-gray-500 -mt-2 m-0">
                Multi-day: start Full or PM; end Full or AM. Half portions count as 0.5 day.
              </p>
            }
          }
          @if (disabledHolidayDates.length) {
            <p class="text-xs text-gray-500 -mt-2">
              Public holidays cannot be start/end dates, and holidays inside the range are not deducted from balance.
            </p>
          }

          @if (selectedBalance && !selectedLeaveType?.isEmergency) {
            <div class="rounded-md bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-900">
              Remaining balance: <strong>{{ selectedBalance.remainingDays }}</strong> day(s)
              for {{ selectedBalance.leaveTypeName }}
            </div>
          }

          @if (selectedLeaveType?.isEmergency && chargeableDays !== null) {
            <div class="rounded-md bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-900">
              Emergency leave has no separate balance. Days are taken from
              <strong>Annual Leave</strong> first, then <strong>Unpaid Leave</strong>.
              @if (annualBalanceForEmergency) {
                <span>
                  · Annual remaining: <strong>{{ annualBalanceForEmergency.remainingDays }}</strong>
                </span>
              }
            </div>
          }

          @if (chargeableDays !== null && (isShortNoticeAnnual || (selectedLeaveType && !selectedLeaveType.isPaid))) {
            <p class="text-sm text-slate-600 -mt-1">
              Days requested (unpaid): <strong>{{ formatDays(chargeableDays) }}</strong>
              @if (sessionSummary) {
                <span class="text-slate-500"> · {{ sessionSummary }}</span>
              }
              @if (holidaysSkippedInRange > 0) {
                <span class="text-slate-500">
                  ({{ holidaysSkippedInRange }} public holiday{{ holidaysSkippedInRange === 1 ? '' : 's' }} excluded)
                </span>
              }
              @if (isShortNoticeAnnual) {
                <span class="text-amber-700"> · Annual balance will not be deducted</span>
              }
            </p>
          } @else if (chargeableDays !== null && (selectedBalance || selectedLeaveType?.isEmergency)) {
            <p
              class="text-sm -mt-1"
              [class.text-red-600]="isInsufficientBalance"
              [class.text-slate-600]="!isInsufficientBalance"
            >
              Leave days to deduct: <strong>{{ formatDays(chargeableDays) }}</strong>
              @if (sessionSummary) {
                <span class="text-slate-500"> · {{ sessionSummary }}</span>
              }
              @if (holidaysSkippedInRange > 0) {
                <span class="text-slate-500">
                  ({{ holidaysSkippedInRange }} public holiday{{ holidaysSkippedInRange === 1 ? '' : 's' }} excluded)
                </span>
              }
              @if (!cascadePreview) {
                · After this request: <strong>{{ formatDays(remainingAfterRequest) }}</strong> day(s) left
              }
            </p>
            @if (cascadePreview) {
              <div class="rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-950 space-y-2">
                <p class="font-semibold m-0">
                  {{ selectedLeaveType?.isEmergency ? 'Emergency leave balance split' : 'Balance split required' }}
                </p>
                <p class="m-0">
                  @if (selectedLeaveType?.isEmergency) {
                    Emergency leave is charged in this order:
                  } @else {
                    Not enough remaining on {{ selectedLeaveType?.name }}. Days will be taken in this order:
                  }
                </p>
                <ul class="m-0 pl-5 list-disc">
                  @for (line of cascadePreview.lines; track line.leaveTypeName + line.sortOrder) {
                    <li>
                      {{ line.leaveTypeName }}: <strong>{{ formatDays(line.days) }}</strong> day(s)
                      @if (line.isUnpaidBucket) { (unpaid) }
                    </li>
                  }
                </ul>
                <div class="flex items-start gap-2 pt-1">
                  <p-checkbox
                    formControlName="acceptBalanceCascade"
                    [binary]="true"
                    inputId="cascadeAccept"
                  />
                  <label for="cascadeAccept" class="text-sm text-amber-950 cursor-pointer">
                    I understand and agree to this balance split
                  </label>
                </div>
              </div>
            } @else if (isInsufficientBalance) {
              <p class="text-sm text-red-600 -mt-2">
                Insufficient balance for this date range. Submit is disabled.
              </p>
            }
          }

          @if (isShortNoticeAnnual) {
            <div class="rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-950 space-y-2">
              <p class="font-semibold m-0">Short-notice Annual Leave</p>
              <p class="m-0">
                Annual leave must be requested at least <strong>7 calendar days</strong> before the start date.
                This request is short notice, so it will be recorded as <strong>Unpaid Leave</strong>
                (not deducted from your Annual Leave balance).
              </p>
              <div class="flex items-start gap-2 pt-1">
                <p-checkbox
                  formControlName="acceptShortNoticeAsUnpaid"
                  [binary]="true"
                  inputId="shortNoticeAccept"
                />
                <label for="shortNoticeAccept" class="text-sm text-amber-950 cursor-pointer">
                  I understand and agree to proceed as unpaid leave
                </label>
              </div>
            </div>
          }

          @if (selectedLeaveType?.isPaid && !isShortNoticeAnnual) {
            <span class="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded w-fit">
              Paid Leave
            </span>
          } @else if ((selectedLeaveType && !selectedLeaveType.isPaid) || isShortNoticeAnnual) {
            <span class="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded w-fit">
              Unpaid Leave
            </span>
          }
          @if (selectedLeaveType?.isEmergency) {
            <span class="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded w-fit">
              Emergency Leave
            </span>
          }

          <div>
            <label class="text-sm text-gray-600 mb-1 block">Reason</label>
            <textarea pTextarea formControlName="reason" rows="4" class="w-full"></textarea>
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-sm text-gray-600">
              Supporting document
              @if (selectedLeaveType?.requiresDocument && !hasExistingDocument) {
                <span class="text-red-600">*</span>
              }
            </label>

            <div class="flex flex-row items-center gap-3">
              <input
                #documentFile
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                (change)="onDocumentChange($event)"
                hidden
              />

              <p-button
                [label]="selectedFile || hasExistingDocument ? 'Reupload' : 'Upload'"
                severity="secondary"
                icon="pi pi-upload"
                styleClass="border-gray-200!"
                size="small"
                (onClick)="documentFile.click()"
              />

              @if (selectedFileName) {
                <div class="bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                  <i class="pi pi-file text-yellow-600!"></i>
                  <span class="truncate max-w-[220px]">{{ selectedFileName }}</span>
                </div>
              }
            </div>

            @if (selectedLeaveType?.requiresDocument && hasExistingDocument) {
              <p class="text-xs text-gray-500">A document is already attached. Upload only if you want to replace it.</p>
            } @else if (selectedLeaveType?.requiresDocument) {
              <p class="text-xs text-red-600">Document is mandatory for this leave type.</p>
            } @else {
              <p class="text-xs text-gray-500">Optional for this leave type.</p>
            }
          </div>

          <div class="flex gap-2 pt-2">
            <p-button
              type="submit"
              [label]="isEditMode ? 'Update request' : 'Submit request'"
              [disabled]="!pageReady || isInsufficientBalance || shortNoticeBlocked || cascadeBlocked"
            />
            <p-button type="button" label="Cancel" severity="secondary" routerLink="/leave" />
          </div>
        </form>
      </div>
    </div>
  `,
})
export class LeaveApply implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly loadingService = inject(LoadingService);
  private readonly leaveTypeService = inject(LeaveTypeService);
  private readonly balanceService = inject(LeaveBalanceService);
  private readonly leaveRequestService = inject(LeaveRequestService);
  private readonly leaveHolidayService = inject(LeaveHolidayService);
  private readonly userService = inject(UserService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();
  private editRequestId = '';
  private editOriginalLeaveTypeId = '';
  private editOriginalTotalDays = 0;
  private editOriginalAllocations: LeaveBalanceAllocationDto[] = [];
  isEditMode = false;

  pageReady = false;
  /** Top-of-org: no HodId — submit will auto-approve. */
  willAutoApprove = false;
  leaveTypes: LeaveTypeDto[] = [];
  private allLeaveTypes: LeaveTypeDto[] = [];
  balances: LeaveBalanceDto[] = [];
  selectedBalance: LeaveBalanceDto | null = null;
  selectedLeaveType: LeaveTypeDto | null = null;
  /** Active public holidays disabled on start/end datepickers. */
  disabledHolidayDates: Date[] = [];
  private holidayNameByKey = new Map<string, string>();
  chargeableDays: number | null = null;
  holidaysSkippedInRange = 0;
  readonly fullSessionOptions = [
    { label: 'Full day', value: 'Full' as LeaveDaySession },
    { label: 'Morning (AM)', value: 'AM' as LeaveDaySession },
    { label: 'Afternoon (PM)', value: 'PM' as LeaveDaySession },
  ];
  startSessionOptions = [...this.fullSessionOptions];
  endSessionOptions = [...this.fullSessionOptions];

  get isSameDayLeave(): boolean {
    const start = this.toLocalDate(this.form.get('startDate')?.value);
    const end = this.toLocalDate(this.form.get('endDate')?.value);
    return !!start && !!end && start.getTime() === end.getTime();
  }

  get sessionSummary(): string | null {
    if (!this.selectedLeaveType?.allowsHalfDay || this.chargeableDays === null) return null;
    const start = normalizeLeaveSession(this.form.value.startSession);
    const end = normalizeLeaveSession(this.form.value.endSession);
    if (start === 'Full' && end === 'Full') return null;
    if (start === end) return formatSessionLabel(start);
    return `${formatSessionLabel(start)} – ${formatSessionLabel(end)}`;
  }

  formatDays(value: number | null | undefined): string {
    return formatDaysAmount(value);
  }

  /** Available days for this form, adding back pending days already held when editing. */
  get effectiveRemaining(): number {
    return this.effectiveRemainingForType(this.form.value.leaveTypeId ?? '');
  }

  private effectiveRemainingForType(leaveTypeId: string): number {
    const balance = this.balances.find((b) => b.leaveTypeId === leaveTypeId);
    const remaining = balance?.remainingDays ?? 0;
    if (!this.isEditMode || !leaveTypeId) return remaining;
    const credit = this.editOriginalAllocations
      .filter((a) => a.leaveTypeId === leaveTypeId && !a.isUnpaidBucket)
      .reduce((sum, a) => sum + (a.days || 0), 0);
    if (credit > 0) return remaining + credit;
    // Legacy edit without allocation rows: credit whole total if same type.
    if (
      this.editOriginalAllocations.length === 0 &&
      leaveTypeId === this.editOriginalLeaveTypeId
    ) {
      return remaining + this.editOriginalTotalDays;
    }
    return remaining;
  }

  get remainingAfterRequest(): number | null {
    if (this.chargeableDays === null || !this.selectedLeaveType?.isPaid || this.isShortNoticeAnnual) {
      return null;
    }
    if (this.selectedLeaveType.isEmergency || this.cascadePreview) return null;
    return this.effectiveRemaining - this.chargeableDays;
  }

  get isShortNoticeAnnual(): boolean {
    if (!this.selectedLeaveType || this.selectedLeaveType.isEmergency) return false;
    if (!this.isAnnualLeaveName(this.selectedLeaveType.name)) return false;
    const start = this.toLocalDate(this.form.get('startDate')?.value);
    if (!start) return false;
    return this.isWithinShortNoticeWindow(start);
  }

  get shortNoticeBlocked(): boolean {
    return this.isShortNoticeAnnual && !this.form.value.acceptShortNoticeAsUnpaid;
  }

  get annualBalanceForEmergency(): LeaveBalanceDto | null {
    if (!this.selectedLeaveType?.isEmergency) return null;
    const annual = this.allLeaveTypes.find((t) => this.isAnnualLeaveName(t.name) && t.isPaid);
    if (!annual) return null;
    return this.balances.find((b) => b.leaveTypeId === annual.id) ?? null;
  }

  /** Client preview: Emergency always Annual→Unpaid; other types when cascade needed. */
  get cascadePreview(): { lines: LeaveBalanceAllocationDto[] } | null {
    if (this.isShortNoticeAnnual) return null;
    if (!this.selectedLeaveType || this.chargeableDays === null || this.chargeableDays <= 0) return null;

    if (this.selectedLeaveType.isEmergency) {
      return this.buildEmergencySplitPreview(this.chargeableDays);
    }

    if (!this.selectedLeaveType.isPaid || !this.selectedLeaveType.allowsBalanceCascade) return null;

    const primaryAvail = Math.max(0, this.effectiveRemaining);
    if (this.chargeableDays <= primaryAvail) return null;

    let rest = Math.round((this.chargeableDays - primaryAvail) * 10000) / 10000;
    const lines: LeaveBalanceAllocationDto[] = [];
    if (primaryAvail > 0) {
      lines.push({
        leaveTypeId: this.selectedLeaveType.id,
        leaveTypeName: this.selectedLeaveType.name,
        days: primaryAvail,
        sortOrder: 0,
        isUnpaidBucket: false,
      });
    }

    const start = this.toLocalDate(this.form.get('startDate')?.value);
    const annualType = this.allLeaveTypes.find((t) => this.isAnnualLeaveName(t.name) && t.isPaid);
    const isAnnualSelected = this.isAnnualLeaveName(this.selectedLeaveType.name);
    if (rest > 0 && annualType && !isAnnualSelected && start && !this.isWithinShortNoticeWindow(start)) {
      const annualAvail = Math.max(0, this.effectiveRemainingForType(annualType.id));
      const annualTake = Math.min(annualAvail, rest);
      if (annualTake > 0) {
        lines.push({
          leaveTypeId: annualType.id,
          leaveTypeName: annualType.name,
          days: annualTake,
          sortOrder: 1,
          isUnpaidBucket: false,
        });
        rest = Math.round((rest - annualTake) * 10000) / 10000;
      }
    }

    if (rest > 0) {
      const unpaidType = this.allLeaveTypes.find((t) => this.isUnpaidLeaveName(t.name));
      lines.push({
        leaveTypeId: unpaidType?.id ?? '',
        leaveTypeName: unpaidType?.name ?? 'Unpaid Leave',
        days: rest,
        sortOrder: 2,
        isUnpaidBucket: true,
      });
    }

    return { lines };
  }

  private buildEmergencySplitPreview(totalDays: number): { lines: LeaveBalanceAllocationDto[] } {
    const annualType = this.allLeaveTypes.find((t) => this.isAnnualLeaveName(t.name) && t.isPaid);
    const unpaidType = this.allLeaveTypes.find((t) => this.isUnpaidLeaveName(t.name));
    const annualAvail = annualType ? Math.max(0, this.effectiveRemainingForType(annualType.id)) : 0;
    const annualTake = Math.min(annualAvail, totalDays);
    const unpaidTake = Math.round((totalDays - annualTake) * 10000) / 10000;
    const lines: LeaveBalanceAllocationDto[] = [];
    if (annualTake > 0 && annualType) {
      lines.push({
        leaveTypeId: annualType.id,
        leaveTypeName: annualType.name,
        days: annualTake,
        sortOrder: 0,
        isUnpaidBucket: false,
      });
    }
    if (unpaidTake > 0) {
      lines.push({
        leaveTypeId: unpaidType?.id ?? '',
        leaveTypeName: unpaidType?.name ?? 'Unpaid Leave',
        days: unpaidTake,
        sortOrder: 1,
        isUnpaidBucket: true,
      });
    }
    return { lines };
  }

  get cascadeBlocked(): boolean {
    return !!this.cascadePreview && !this.form.value.acceptBalanceCascade;
  }

  get isInsufficientBalance(): boolean {
    if (this.isShortNoticeAnnual) return false;
    if (this.selectedLeaveType?.isEmergency) return false;
    if (!this.selectedLeaveType?.isPaid) return false;
    if (this.chargeableDays === null || !this.selectedBalance) return false;
    if (this.cascadePreview) return false;
    return this.chargeableDays > this.effectiveRemaining;
  }
  selectedFile: File | null = null;
  selectedFileName = '';
  /** Edit mode: request already has an uploaded document on the server. */
  hasExistingDocument = false;
  private readonly maxDocumentSizeBytes = 25 * 1024 * 1024;
  private readonly allowedDocumentMimeTypes = new Set([
    'application/pdf',
    'image/jpeg',
    'image/png',
  ]);

  form = this.fb.group({
    leaveTypeId: ['', Validators.required],
    startDate: [null as Date | null, Validators.required],
    endDate: [null as Date | null, Validators.required],
    startSession: ['Full' as LeaveDaySession, Validators.required],
    endSession: ['Full' as LeaveDaySession, Validators.required],
    reason: ['', [Validators.required, Validators.minLength(3)]],
    acceptShortNoticeAsUnpaid: [false],
    acceptBalanceCascade: [false],
  });

  ngOnInit(): void {
    const userId = this.userService.currentUser?.userId;
    const routeId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!routeId;
    this.editRequestId = routeId ?? '';
    this.loadingService.start();

    forkJoin({
      types: this.leaveTypeService.getAll(userId).pipe(
        catchError(() => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load leave types.',
          });
          return of([] as LeaveTypeDto[]);
        }),
      ),
      balances: userId
        ? this.balanceService.getBalances(userId).pipe(
            catchError(() => {
              this.messageService.add({
                severity: 'warn',
                summary: 'Balances unavailable',
                detail: 'Could not load leave balances.',
              });
              return of([] as LeaveBalanceDto[]);
            }),
          )
        : of([] as LeaveBalanceDto[]),
      profile: userId
        ? this.userService
            .GetOne({
              Page: 1,
              PageSize: 1,
              OrderBy: null,
              Includes: null,
              Select: null,
              Filter: `Id=${userId}`,
            })
            .pipe(catchError(() => of(null)))
        : of(null),
      holidays: (() => {
        const y = new Date().getFullYear();
        const from = new Date(y, 0, 1);
        const to = new Date(y + 1, 11, 31);
        return this.leaveHolidayService.getInRange(from, to).pipe(
          catchError(() => of([])),
        );
      })(),
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loadingService.stop();
          this.pageReady = true;
          this.cdr.markForCheck();
        }),
      )
      .subscribe(({ types, balances, profile, holidays }) => {
        this.allLeaveTypes = types;
        this.balances = balances;
        this.leaveTypes = this.filterSelectableLeaveTypes(types, balances);
        this.setHolidays(holidays);
        const hodIds = (profile as { hodIds?: string[]; HodIds?: string[] } | null)?.hodIds
          ?? (profile as { hodIds?: string[]; HodIds?: string[] } | null)?.HodIds
          ?? [];
        this.willAutoApprove = !Array.isArray(hodIds) || hodIds.length === 0;
        if (this.editRequestId) {
          this.loadRequestForEdit(this.editRequestId);
        }
        this.updateSelectedBalance();
        this.refreshChargeableDaysPreview();
      });

    this.form
      .get('leaveTypeId')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((typeId) => {
        this.updateSelectedBalance(typeId ?? undefined);
        this.syncSessionControls();
        this.refreshChargeableDaysPreview();
      });

    const startCtrl = this.form.get('startDate');
    const endCtrl = this.form.get('endDate');
    const startSessionCtrl = this.form.get('startSession');
    const endSessionCtrl = this.form.get('endSession');
    if (startCtrl && endCtrl && startSessionCtrl && endSessionCtrl) {
      merge(
        startCtrl.valueChanges,
        endCtrl.valueChanges,
        startSessionCtrl.valueChanges,
        endSessionCtrl.valueChanges,
      )
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.syncSessionControls();
          this.refreshChargeableDaysPreview();
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.loadingService.stop();
  }

  /** DatePicker can update the control slightly after onSelect — sync sessions then refresh. */
  onLeaveDatePicked(): void {
    queueMicrotask(() => {
      this.syncSessionControls();
      this.refreshChargeableDaysPreview();
    });
  }

  private refreshChargeableDaysPreview(): void {
    this.updateChargeableDays(
      this.form.get('startDate')?.value,
      this.form.get('endDate')?.value,
    );
    if (!this.isShortNoticeAnnual && this.form.value.acceptShortNoticeAsUnpaid) {
      this.form.patchValue({ acceptShortNoticeAsUnpaid: false }, { emitEvent: false });
    }
    if (!this.cascadePreview && this.form.value.acceptBalanceCascade) {
      this.form.patchValue({ acceptBalanceCascade: false }, { emitEvent: false });
    }
    // OnPush: markForCheck alone was leaving a stale deduct preview after date picks.
    this.cdr.detectChanges();
  }

  private updateSelectedBalance(typeIdInput?: string): void {
    const typeId = typeIdInput ?? this.form.value.leaveTypeId ?? '';
    this.selectedLeaveType =
      this.leaveTypes.find((t) => t.id === typeId) ??
      this.allLeaveTypes.find((t) => t.id === typeId) ??
      null;
    this.selectedBalance = this.balances.find((b) => b.leaveTypeId === typeId) ?? null;
  }

  private toLocalDate(value: Date | string | null | undefined): Date | null {
    if (value == null || value === '') return null;
    if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) return null;
      return new Date(value.getFullYear(), value.getMonth(), value.getDate());
    }
    const raw = String(value).trim();
    // yyyy-MM-dd (API / ISO date-only)
    const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
    if (iso) {
      return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    }
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return null;
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }

  private updateChargeableDays(
    startInput?: Date | string | null,
    endInput?: Date | string | null,
  ): void {
    const start = this.toLocalDate(startInput ?? this.form.get('startDate')?.value);
    const end = this.toLocalDate(endInput ?? this.form.get('endDate')?.value);
    if (!start || !end || end.getTime() < start.getTime()) {
      this.chargeableDays = null;
      this.holidaysSkippedInRange = 0;
      return;
    }

    const allowsHalf = !!this.selectedLeaveType?.allowsHalfDay;
    let startSession = normalizeLeaveSession(this.form.get('startSession')?.value);
    let endSession = normalizeLeaveSession(this.form.get('endSession')?.value);
    if (!allowsHalf) {
      startSession = 'Full';
      endSession = 'Full';
    } else if (start.getTime() === end.getTime()) {
      endSession = startSession;
    }

    const { total, skipped } = calculateChargeableDaysClient(
      start,
      end,
      startSession,
      endSession,
      (d) => this.holidayNameByKey.has(this.dateKey(d)),
    );
    this.chargeableDays = total;
    this.holidaysSkippedInRange = skipped;
  }

  /** Align sessions with date span before API submit (mirrors backend rules). */
  private resolveSessionsForSubmit(
    startInput: Date | null | undefined,
    endInput: Date | null | undefined,
    startSessionInput: unknown,
    endSessionInput: unknown,
  ): { startSession: LeaveDaySession; endSession: LeaveDaySession } {
    const allowsHalf = !!this.selectedLeaveType?.allowsHalfDay;
    let startSession = normalizeLeaveSession(startSessionInput);
    let endSession = normalizeLeaveSession(endSessionInput);
    if (!allowsHalf) {
      return { startSession: 'Full', endSession: 'Full' };
    }

    const start = this.toLocalDate(startInput);
    const end = this.toLocalDate(endInput);
    if (!start || !end) {
      return { startSession, endSession };
    }

    if (start.getTime() === end.getTime()) {
      // Single-day UI only binds startSession — force both to match.
      return { startSession, endSession: startSession };
    }

    if (startSession === 'AM') startSession = 'Full';
    if (endSession === 'PM') endSession = 'Full';
    return { startSession, endSession };
  }

  /** Keep session options valid for single-day vs multi-day and leave type capability. */
  private syncSessionControls(): void {
    const allowsHalf = !!this.selectedLeaveType?.allowsHalfDay;
    const start = this.toLocalDate(this.form.get('startDate')?.value);
    const end = this.toLocalDate(this.form.get('endDate')?.value);
    const sameDay = !!start && !!end && start.getTime() === end.getTime();

    if (!allowsHalf) {
      this.startSessionOptions = [{ label: 'Full day', value: 'Full' }];
      this.endSessionOptions = [{ label: 'Full day', value: 'Full' }];
      if (this.form.value.startSession !== 'Full' || this.form.value.endSession !== 'Full') {
        this.form.patchValue({ startSession: 'Full', endSession: 'Full' }, { emitEvent: false });
      }
      return;
    }

    if (sameDay) {
      this.startSessionOptions = [...this.fullSessionOptions];
      this.endSessionOptions = [...this.fullSessionOptions];
      // Single-day UI only edits startSession — keep endSession identical for API validation.
      const session = normalizeLeaveSession(
        this.form.get('startSession')?.value ?? this.form.value.startSession,
      );
      const endSession = normalizeLeaveSession(
        this.form.get('endSession')?.value ?? this.form.value.endSession,
      );
      if (endSession !== session) {
        this.form.patchValue({ endSession: session }, { emitEvent: false });
      }
      return;
    }

    this.startSessionOptions = [
      { label: 'Full day', value: 'Full' },
      { label: 'Afternoon (PM)', value: 'PM' },
    ];
    this.endSessionOptions = [
      { label: 'Full day', value: 'Full' },
      { label: 'Morning (AM)', value: 'AM' },
    ];
    const startSession = normalizeLeaveSession(this.form.value.startSession);
    const endSession = normalizeLeaveSession(this.form.value.endSession);
    const patch: { startSession?: LeaveDaySession; endSession?: LeaveDaySession } = {};
    if (startSession === 'AM') patch.startSession = 'Full';
    if (endSession === 'PM') patch.endSession = 'Full';
    if (Object.keys(patch).length) {
      this.form.patchValue(patch, { emitEvent: false });
    }
  }

  /** Replacement leave appears only when credited balance remains (or when editing that type). */
  private filterSelectableLeaveTypes(
    types: LeaveTypeDto[],
    balances: LeaveBalanceDto[],
    keepTypeId?: string,
  ): LeaveTypeDto[] {
    return types.filter((t) => {
      if (t.policyKind !== 'Replacement') return true;
      if (keepTypeId && t.id === keepTypeId) return true;
      const bal = balances.find((b) => b.leaveTypeId === t.id);
      return (bal?.remainingDays ?? 0) > 0;
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Missing required fields',
        detail: this.buildMissingFieldsMessage(),
      });
      this.cdr.markForCheck();
      return;
    }
    const user = this.userService.currentUser;
    if (!user?.userId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Not signed in',
        detail: 'Please log in again to submit a leave request.',
      });
      return;
    }

    const v = this.form.getRawValue();
    const selectedType = this.selectedLeaveType;
    if (!selectedType) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Leave type required',
        detail: 'Please select a leave type.',
      });
      return;
    }
    if (selectedType.requiresDocument && !this.selectedFile && !this.hasExistingDocument) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Document required',
        detail: 'Please upload a supporting document for this leave type.',
      });
      return;
    }

    const holidayMsg = this.holidayStartEndMessage(v.startDate, v.endDate);
    if (holidayMsg) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Public holiday',
        detail: holidayMsg,
      });
      return;
    }

    if (this.isInsufficientBalance) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Insufficient balance',
        detail: `This request needs ${this.chargeableDays} day(s); available: ${this.effectiveRemaining}.`,
      });
      return;
    }

    if (this.shortNoticeBlocked) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Short-notice confirmation required',
        detail: 'Confirm that you agree to proceed as unpaid leave before submitting.',
      });
      return;
    }

    if (this.cascadeBlocked) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Balance split confirmation required',
        detail: 'Confirm the Annual / Unpaid balance split before submitting.',
      });
      return;
    }

    this.loadingService.start();

    // Datepicker can leave endSession stale after collapsing multi-day → same day.
    const sessions = this.resolveSessionsForSubmit(v.startDate, v.endDate, v.startSession, v.endSession);
    this.form.patchValue(
      { startSession: sessions.startSession, endSession: sessions.endSession },
      { emitEvent: false },
    );

    const payload = {
      employeeId: user.userId,
      leaveTypeId: v.leaveTypeId!,
      startDate: this.toIsoDate(v.startDate!),
      endDate: this.toIsoDate(v.endDate!),
      reason: v.reason!,
      isEmergency: !!selectedType.isEmergency,
      isUnpaid: !selectedType.isPaid || this.isShortNoticeAnnual,
      acceptShortNoticeAsUnpaid: !!v.acceptShortNoticeAsUnpaid,
      acceptBalanceCascade: !!v.acceptBalanceCascade,
      startSession: sessions.startSession,
      endSession: sessions.endSession,
    };
    const save$ = this.isEditMode && this.editRequestId
      ? this.leaveRequestService.update(this.editRequestId, payload)
      : this.leaveRequestService.submit(payload);

    save$
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loadingService.stop()),
      )
      .subscribe({
        next: (res) => {
          const rawId = String(
            res.requestId || (res as { RequestId?: string }).RequestId || '',
          ).trim();
          const requestId =
            rawId && rawId !== '00000000-0000-0000-0000-000000000000'
              ? rawId
              : this.editRequestId || '';
          if (res.balanceSufficient === false) {
            this.messageService.add({
              severity: 'warn',
              summary: 'Insufficient balance',
              detail: `Remaining: ${res.remainingBalance} days.`,
              life: 8000,
            });
            this.cdr.markForCheck();
            return;
          }
          const autoApproved = this.isAutoApprovedResponse(res);
          const detailPath = requestId ? ['/leave', requestId] : ['/leave', 'history'];
          if (!requestId || !this.selectedFile) {
            this.messageService.add({
              severity: 'success',
              summary: this.isEditMode ? 'Updated' : autoApproved ? 'Auto-approved' : 'Submitted',
              detail: this.isEditMode
                ? 'Leave request updated'
                : autoApproved
                  ? 'Leave request auto-approved'
                  : 'Leave request submitted',
            });
            this.router.navigate(detailPath);
            return;
          }

          this.loadingService.start();
          this.leaveRequestService
            .uploadDocument(requestId, this.selectedFile)
            .pipe(
              takeUntil(this.destroy$),
              finalize(() => this.loadingService.stop()),
            )
            .subscribe({
              next: () => {
                this.messageService.add({
                  severity: 'success',
                  summary: this.isEditMode ? 'Updated' : autoApproved ? 'Auto-approved' : 'Submitted',
                  detail: this.isEditMode
                    ? 'Leave request updated with document'
                    : autoApproved
                      ? 'Leave request auto-approved with document'
                      : 'Leave request submitted with document',
                });
                this.router.navigate(detailPath);
              },
              error: () => {
                this.messageService.add({
                  severity: 'warn',
                  summary: autoApproved ? 'Auto-approved' : 'Submitted',
                  detail: autoApproved
                    ? 'Leave auto-approved, but document upload failed. You can upload it from the detail page.'
                    : 'Leave submitted, but document upload failed. You can upload it from the detail page.',
                });
                this.router.navigate(detailPath);
              },
            });
        },
        error: (err) => {
          const body = err.error as Record<string, unknown> | undefined;
          const balanceSufficient =
            body?.['balanceSufficient'] ?? body?.['BalanceSufficient'];
          if (balanceSufficient === false) {
            const remaining =
              body?.['remainingBalance'] ?? body?.['RemainingBalance'];
            this.messageService.add({
              severity: 'warn',
              summary: 'Insufficient balance',
              detail: `Remaining: ${remaining} days.`,
              life: 8000,
            });
          } else {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail:
                  (body?.['message'] as string) ||
                  (body?.['Message'] as string) ||
                  (this.isEditMode
                    ? 'Failed to update leave request.'
                    : 'Failed to submit leave request.'),
              });
          }
          this.cdr.markForCheck();
        },
      });
  }

  private isAutoApprovedResponse(res: {
    status?: string;
    noApproverAssigned?: boolean; 
  }): boolean {
    return (
      !this.isEditMode &&
      !!res.noApproverAssigned &&
      (res.status ?? '').toLowerCase() === 'approved'
    );
  }

  private buildMissingFieldsMessage(): string {
    const missing: string[] = [];
    const leaveTypeId = this.form.get('leaveTypeId');
    const startDate = this.form.get('startDate');
    const endDate = this.form.get('endDate');
    const reason = this.form.get('reason');

    if (leaveTypeId?.invalid) missing.push('Leave type');
    if (startDate?.invalid) missing.push('Start date');
    if (endDate?.invalid) missing.push('End date');
    if (reason?.hasError('required')) missing.push('Reason');
    else if (reason?.hasError('minlength')) {
      missing.push('Reason (at least 3 characters)');
    }

    if (
      this.selectedLeaveType?.requiresDocument &&
      !this.selectedFile &&
      !this.hasExistingDocument
    ) {
      missing.push('Supporting document');
    }

    return missing.length
      ? `Please fill: ${missing.join(', ')}.`
      : 'Please complete all required fields.';
  }

  onDocumentChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) {
      this.selectedFile = null;
      this.selectedFileName = '';
      this.cdr.markForCheck();
      return;
    }

    if (!this.allowedDocumentMimeTypes.has(file.type)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Invalid file type',
        detail: 'Only PDF, JPG/JPEG, and PNG files are allowed.',
      });
      input.value = '';
      this.selectedFile = null;
      this.selectedFileName = '';
      this.cdr.markForCheck();
      return;
    }

    if (file.size > this.maxDocumentSizeBytes) {
      this.messageService.add({
        severity: 'warn',
        summary: 'File too large',
        detail: 'Maximum file size is 25 MB.',
      });
      input.value = '';
      this.selectedFile = null;
      this.selectedFileName = '';
      this.cdr.markForCheck();
      return;
    }

    this.selectedFile = file;
    this.selectedFileName = file.name;
    this.cdr.markForCheck();
  }

  private setHolidays(
    holidays: { date: string; name: string; isActive?: boolean }[],
  ): void {
    this.holidayNameByKey.clear();
    this.disabledHolidayDates = [];
    for (const h of holidays) {
      if (h.isActive === false) continue;
      const key = h.date.slice(0, 10);
      const [y, m, d] = key.split('-').map(Number);
      if (!y || !m || !d) continue;
      this.holidayNameByKey.set(key, h.name);
      this.disabledHolidayDates.push(new Date(y, m - 1, d));
    }
  }

  private holidayStartEndMessage(start: Date | null | undefined, end: Date | null | undefined): string | null {
    if (!start || !end) return null;
    const startKey = this.dateKey(start);
    const endKey = this.dateKey(end);
    const startName = this.holidayNameByKey.get(startKey);
    const endName = this.holidayNameByKey.get(endKey);
    if (startName && endName && startKey === endKey) {
      return `Start and end date cannot fall on a public holiday (${startName}).`;
    }
    if (startName) return `Start date cannot fall on a public holiday (${startName}).`;
    if (endName) return `End date cannot fall on a public holiday (${endName}).`;
    return null;
  }

  private isAnnualLeaveName(name: string | null | undefined): boolean {
    return (name ?? '').trim().toLowerCase() === 'annual leave';
  }

  private isUnpaidLeaveName(name: string | null | undefined): boolean {
    return (name ?? '').trim().toLowerCase() === 'unpaid leave';
  }

  private isWithinShortNoticeWindow(start: Date): boolean {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const daysUntilStart = Math.round((start.getTime() - today.getTime()) / 86_400_000);
    return daysUntilStart < 7;
  }

  private dateKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private toIsoDate(d: Date): string {
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString();
  }

  private loadRequestForEdit(id: string): void {
    this.leaveRequestService
      .getById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (request) => {
          if (request.status !== 'Pending') {
            this.messageService.add({
              severity: 'warn',
              summary: 'Cannot edit',
              detail: 'Only pending requests can be edited.',
            });
            this.router.navigate(['/leave', id]);
            return;
          }
          this.editOriginalLeaveTypeId = request.leaveTypeId;
          this.editOriginalTotalDays = request.totalDays ?? 0;
          this.editOriginalAllocations = [...(request.balanceAllocations ?? [])];
          const displayTypeId = request.isShortNoticeAnnual
            ? (this.allLeaveTypes.find((t) => this.isAnnualLeaveName(t.name))?.id ?? request.leaveTypeId)
            : request.leaveTypeId;
          this.form.patchValue({
            leaveTypeId: displayTypeId,
            startDate: new Date(request.startDate),
            endDate: new Date(request.endDate),
            startSession: normalizeLeaveSession(request.startSession),
            endSession: normalizeLeaveSession(request.endSession),
            reason: request.reason,
            acceptShortNoticeAsUnpaid: !!request.isShortNoticeAnnual,
            acceptBalanceCascade:
              !!request.isEmergency || (request.balanceAllocations?.length ?? 0) > 1,
          });
          this.leaveTypes = this.filterSelectableLeaveTypes(
            this.allLeaveTypes,
            this.balances,
            displayTypeId,
          );
          this.selectedFile = null;
          this.hasExistingDocument = !!request.documentUrl;
          this.selectedFileName = request.documentFileName ?? '';
          this.updateSelectedBalance(displayTypeId);
          this.syncSessionControls();
          this.refreshChargeableDaysPreview();
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load request for edit' });
          this.router.navigate(['/leave']);
        },
      });
  }
}
