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
import { forkJoin, of, Subject, takeUntil } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { LeaveBalanceDto, LeaveTypeDto } from '../../../models/Leave';
import { LeaveBalanceService } from '../../../services/leave-balance.service';
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
              <p-datepicker formControlName="startDate" dateFormat="dd/mm/yy" class="w-full" />
            </div>
            <div>
              <label class="text-sm text-gray-600 mb-1 block">End date</label>
              <p-datepicker formControlName="endDate" dateFormat="dd/mm/yy" class="w-full" />
            </div>
          </div>

          @if (selectedBalance) {
            <div class="rounded-md bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-900">
              Remaining balance: <strong>{{ selectedBalance.remainingDays }}</strong> day(s)
              for {{ selectedBalance.leaveTypeName }}
            </div>
          }

          @if (selectedLeaveType?.isPaid) {
            <span class="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded w-fit">
              Paid Leave
            </span>
          } @else if (selectedLeaveType && !selectedLeaveType.isPaid) {
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

          <div class="flex flex-col gap-3">
            <div class="flex items-center gap-2">
              <p-checkbox formControlName="conflictOverride" [binary]="true" inputId="override" />
              <label for="override" class="text-sm text-gray-700">Proceed despite team conflict (if warned)</label>
            </div>
          </div>

          @if (conflictWarning) {
            <div class="rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900">
              {{ conflictWarning }}
            </div>
          }

          <div class="flex gap-2 pt-2">
            <p-button type="submit" [label]="isEditMode ? 'Update request' : 'Submit request'" [disabled]="!pageReady" />
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
  private readonly userService = inject(UserService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();
  private editRequestId = '';
  isEditMode = false;

  pageReady = false;
  /** Top-of-org: no HodId — submit will auto-approve. */
  willAutoApprove = false;
  leaveTypes: LeaveTypeDto[] = [];
  private allLeaveTypes: LeaveTypeDto[] = [];
  balances: LeaveBalanceDto[] = [];
  selectedBalance: LeaveBalanceDto | null = null;
  selectedLeaveType: LeaveTypeDto | null = null;
  conflictWarning: string | null = null;
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
    reason: ['', [Validators.required, Validators.minLength(3)]],
    conflictOverride: [false],
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
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loadingService.stop();
          this.pageReady = true;
          this.cdr.markForCheck();
        }),
      )
      .subscribe(({ types, balances, profile }) => {
        this.allLeaveTypes = types;
        this.balances = balances;
        this.leaveTypes = this.filterSelectableLeaveTypes(types, balances);
        const hodIds = (profile as { hodIds?: string[]; HodIds?: string[] } | null)?.hodIds
          ?? (profile as { hodIds?: string[]; HodIds?: string[] } | null)?.HodIds
          ?? [];
        this.willAutoApprove = !Array.isArray(hodIds) || hodIds.length === 0;
        if (this.editRequestId) {
          this.loadRequestForEdit(this.editRequestId);
        }
        this.updateSelectedBalance();
        this.cdr.markForCheck();
      });

    this.form
      .get('leaveTypeId')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((typeId) => {
        this.updateSelectedBalance(typeId ?? undefined);
        // PrimeNG select can emit before form snapshot settles; force immediate UI refresh.
        this.cdr.detectChanges();
      });
    this.form
      .get('startDate')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateSelectedBalance();
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.loadingService.stop();
  }

  private updateSelectedBalance(typeIdInput?: string): void {
    const typeId = typeIdInput ?? this.form.value.leaveTypeId ?? '';
    this.selectedLeaveType =
      this.leaveTypes.find((t) => t.id === typeId) ??
      this.allLeaveTypes.find((t) => t.id === typeId) ??
      null;
    this.selectedBalance = this.balances.find((b) => b.leaveTypeId === typeId) ?? null;
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
    this.conflictWarning = null;
    this.loadingService.start();

    const payload = {
      employeeId: user.userId,
      leaveTypeId: v.leaveTypeId!,
      startDate: this.toIsoDate(v.startDate!),
      endDate: this.toIsoDate(v.endDate!),
      reason: v.reason!,
      isEmergency: !!selectedType.isEmergency,
      isUnpaid: !selectedType.isPaid,
      conflictOverride: !!v.conflictOverride,
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
          const requestId = res.requestId ?? (res as { RequestId?: string }).RequestId;
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
          if (res.conflictWarning && !requestId) {
            this.conflictWarning = res.conflictWarning;
            this.messageService.add({ severity: 'warn', summary: 'Team conflict', detail: res.conflictWarning });
            this.cdr.markForCheck();
            return;
          }
          const autoApproved = this.isAutoApprovedResponse(res);
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
            this.router.navigate(['/leave', requestId || 'history']);
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
                this.router.navigate(['/leave', requestId]);
              },
              error: () => {
                this.messageService.add({
                  severity: 'warn',
                  summary: autoApproved ? 'Auto-approved' : 'Submitted',
                  detail: autoApproved
                    ? 'Leave auto-approved, but document upload failed. You can upload it from the detail page.'
                    : 'Leave submitted, but document upload failed. You can upload it from the detail page.',
                });
                this.router.navigate(['/leave', requestId]);
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
            const conflict =
              (body?.['conflictWarning'] ?? body?.['ConflictWarning']) as
                | string
                | undefined;
            if (conflict) {
              this.conflictWarning = conflict;
              this.messageService.add({
                severity: 'warn',
                summary: 'Team conflict',
                detail: conflict,
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
          this.form.patchValue({
            leaveTypeId: request.leaveTypeId,
            startDate: new Date(request.startDate),
            endDate: new Date(request.endDate),
            reason: request.reason,
            conflictOverride: request.conflictOverride,
          });
          this.leaveTypes = this.filterSelectableLeaveTypes(
            this.allLeaveTypes,
            this.balances,
            request.leaveTypeId,
          );
          this.selectedFile = null;
          this.hasExistingDocument = !!request.documentUrl;
          this.selectedFileName = request.documentFileName ?? '';
          this.updateSelectedBalance(request.leaveTypeId);
          this.cdr.markForCheck();
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load request for edit' });
          this.router.navigate(['/leave']);
        },
      });
  }
}
