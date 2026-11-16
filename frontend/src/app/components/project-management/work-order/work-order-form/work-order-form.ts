import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { WorkOrderService } from '../../../../services/WorkOrderService';
import { finalize, of, switchMap, tap } from 'rxjs';
import { WorkOrderDropdownDto } from '../../../../models/WorkOrder';
import { MultiSelectModule } from 'primeng/multiselect';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-work-order-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    SelectModule,
    DatePickerModule,
    InputTextModule,
    TextareaModule,
    MultiSelectModule,
  ],
  template: `
    <div class="min-h-0 bg-slate-50/80 p-4 sm:p-6">
      <div class="mx-auto space-y-6">
        <!-- Header -->
        <div
          class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
        >
          <div>
            <div class="mb-2 flex items-center gap-2 text-sm text-slate-500">
              <a class="transition hover:text-blue-600" (click)="cancel()">
                Work Orders
              </a>
              <i class="pi pi-angle-right text-xs"></i>
              <span class="text-slate-700">{{ pageTitle }}</span>
            </div>

            <h1 class="text-2xl font-bold text-slate-800">
              {{ pageTitle }}
            </h1>
            <p class="mt-1 text-slate-500">
              Fill in the details below to manage this work order.
            </p>
          </div>

          <button
            pButton
            type="button"
            severity="secondary"
            [outlined]="true"
            icon="pi pi-arrow-left"
            label="Back"
            (click)="cancel()"
          ></button>
        </div>

        <form [formGroup]="workOrderForm">
          <!-- Work Order Details -->
          <section class="form-section">
            <div class="section-header">
              <div class="section-icon">
                <i class="pi pi-clipboard"></i>
              </div>
              <div>
                <h2 class="section-title">Work Order Details</h2>
                <p class="section-description">
                  Basic information about the work to be performed.
                </p>
              </div>
            </div>

            <div class="form-grid">
              <!-- Project -->
              <div class="form-field">
                <label for="projectId">
                  Project <span class="required">*</span>
                </label>

                <p-select
                  inputId="projectId"
                  formControlName="projectId"
                  [options]="projects"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select project"
                  [filter]="true"
                  filterBy="label"
                  [showClear]="true"
                  appendTo="body"
                  styleClass="w-full"
                  [class.ng-invalid]="isInvalid('projectId')"
                ></p-select>

                @if (isInvalid('projectId')) {
                  <small class="error-message">Please select a project.</small>
                }
              </div>

              <!-- Work Type -->
              <div class="form-field">
                <label for="workType">
                  Work Type <span class="required">*</span>
                </label>

                <p-select
                  inputId="workType"
                  formControlName="workType"
                  [options]="workTypes"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select work type"
                  appendTo="body"
                  styleClass="w-full"
                ></p-select>

                @if (isInvalid('workType')) {
                  <small class="error-message"
                    >Please select a work type.</small
                  >
                }
              </div>

              <!-- Title -->
              <div class="form-field full-width">
                <label for="title">
                  Work Order Title <span class="required">*</span>
                </label>

                <input
                  pInputText
                  id="title"
                  formControlName="title"
                  placeholder="e.g. CCTV Installation at Sunway Velocity"
                  class="w-full"
                  maxlength="200"
                />

                @if (isInvalid('title')) {
                  <small class="error-message">
                    A title is required (maximum 200 characters).
                  </small>
                }
              </div>

              <!-- Location -->
              <div class="form-field full-width">
                <label for="location">Work Location</label>

                <input
                  pInputText
                  id="location"
                  formControlName="location"
                  placeholder="Enter work location"
                  class="w-full"
                  maxlength="250"
                />
              </div>

              <!-- Description -->
              <div class="form-field full-width">
                <label for="description">Description / Scope of Work</label>

                <textarea
                  pTextarea
                  id="description"
                  formControlName="description"
                  rows="5"
                  class="w-full"
                  placeholder="Describe the work to be carried out..."
                ></textarea>
              </div>
            </div>
          </section>

          <!-- Assignment & Status -->
          <section class="form-section">
            <div class="section-header">
              <div class="section-icon">
                <i class="pi pi-users"></i>
              </div>
              <div>
                <h2 class="section-title">Assignment & Status</h2>
                <p class="section-description">
                  Manage the person in charge, assigned team members and work
                  order status.
                </p>
              </div>
            </div>

            <div class="form-grid assignment-grid">
              <!-- Person In Charge: Full Width -->
              <div class="form-field priority-field">
                <label for="assignedToId">Person In Charge (PIC)</label>

                <p-select
                  inputId="assignedToId"
                  formControlName="assignedToId"
                  [options]="assignees"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select person in charge"
                  [filter]="true"
                  filterBy="label"
                  [showClear]="true"
                  appendTo="body"
                  styleClass="w-full"
                  (onChange)="onAssignedToChange()"
                ></p-select>

                <small class="field-hint">
                  Main person responsible for this work order.
                </small>
              </div>
              <!-- Priority: Left Column -->
              <div class="form-field status-field">
                <label for="priority">
                  Priority <span class="required">*</span>
                </label>

                <p-select
                  inputId="priority"
                  formControlName="priority"
                  [options]="priorities"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select priority"
                  appendTo="body"
                  styleClass="w-full"
                ></p-select>
              </div>

              <!-- Assigned Team Members: Full Width -->
              <div class="form-field team-members-field">
                <div class="team-field-heading">
                  <div>
                    <div class="team-field-label">Assigned Team Members</div>
                    <small class="field-hint mb-2">
                      Select additional staff members working on this order.
                    </small>
                  </div>

                  @if (totalSelectedMembers > 0) {
                    <span class="team-count-badge">
                      <i class="pi pi-users"></i>
                      {{ totalSelectedMembers }} assigned
                    </span>
                  }
                </div>

                <p-multiselect
                  inputId="WorkOrderMembers"
                  formControlName="workOrderMembers"
                  [options]="availableMembers"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Search staff members..."
                  [filter]="true"
                  filterBy="label"
                  [showClear]="true"
                  [showToggleAll]="true"
                  selectedItemsLabel="{0} members selected"
                  appendTo="body"
                  styleClass="w-full"
                ></p-multiselect>

                <!-- Selected Team Panel -->
                @if (totalSelectedMembers > 0) {
                  <div class="team-panel">
                    <!-- Panel Header -->
                    <div class="team-panel-header">
                      <div class="team-panel-title">
                        <i class="pi pi-check-circle"></i>
                        <span>Selected Team</span>
                        <span class="team-total">
                          {{ totalSelectedMembers }}
                        </span>
                      </div>

                      <button
                        type="button"
                        class="team-clear-btn"
                        (click)="clearAllMembers()"
                      >
                        <i class="pi pi-trash"></i>
                        Remove all
                      </button>
                    </div>

                    <!-- Selected Members -->
                    <div class="team-member-list">
                      @for (member of selectedMembers; track member.value) {
                        <div class="team-member-item">
                          <div class="team-member-avatar">
                            {{ member.label.charAt(0).toUpperCase() }}
                          </div>

                          <div class="team-member-info">
                            <span class="team-member-name">
                              {{ member.label }}
                            </span>
                            <span class="team-member-role"> Team Member </span>
                          </div>

                          <button
                            type="button"
                            class="team-member-remove"
                            (click)="removeMember(member.value)"
                            [attr.aria-label]="'Remove ' + member.label"
                            title="Remove member"
                          >
                            <i class="pi pi-times"></i>
                          </button>
                        </div>
                      }
                    </div>

                    <!-- Panel Footer -->
                    <div class="team-panel-footer">
                      <i class="pi pi-info-circle"></i>
                      {{ totalSelectedMembers }} staff members assigned to this
                      work order.
                    </div>
                  </div>
                } @else {
                  <!-- Empty State -->
                  <div class="team-empty-state">
                    <i class="pi pi-users"></i>
                    <span>No team members assigned yet.</span>
                    <small>Search above to add team members.</small>
                  </div>
                }
              </div>
            </div>
          </section>

          <!-- Schedule -->
          <section class="form-section">
            <div class="section-header">
              <div class="section-icon">
                <i class="pi pi-calendar"></i>
              </div>
              <div>
                <h2 class="section-title">Schedule</h2>
                <p class="section-description">
                  Set the planned work date and expected completion date.
                </p>
              </div>
            </div>

            <div class="form-grid">
              <!-- Scheduled Date -->
              <div class="form-field">
                <label for="scheduledDate">Scheduled Date</label>

                <p-datepicker
                  inputId="scheduledDate"
                  formControlName="scheduledDate"
                  placeholder="Select scheduled date"
                  dateFormat="dd/mm/yy"
                  [showIcon]="true"
                  [showButtonBar]="true"
                  appendTo="body"
                  styleClass="w-full"
                  inputStyleClass="w-full"
                ></p-datepicker>
              </div>

              <!-- Due Date -->
              <div class="form-field">
                <label for="dueDate">Due Date</label>

                <p-datepicker
                  inputId="dueDate"
                  formControlName="dueDate"
                  placeholder="Select due date"
                  dateFormat="dd/mm/yy"
                  [showIcon]="true"
                  [showButtonBar]="true"
                  appendTo="body"
                  styleClass="w-full"
                  inputStyleClass="w-full"
                ></p-datepicker>
              </div>
            </div>
          </section>

          <!-- Actions -->
          <div class="flex flex-col-reverse justify-end gap-3 sm:flex-row">
            <button
              pButton
              type="button"
              severity="secondary"
              [outlined]="true"
              label="Cancel"
              s
              (click)="cancel()"
              [disabled]="loading"
            ></button>

            <button
              pButton
              type="submit"
              label="{{ submitLabel }}"
              icon="pi pi-save"
              class="bg-blue-700! border-none! hover:bg-blue-500!"
              [loading]="loading"
              (click)="saveWorkOrder()"
            ></button>
          </div>
        </form>
      </div>
    </div>
  `,
  styleUrl: './work-order-form.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkOrderForm implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private messageService = inject(MessageService);
  private readonly workOrderService = inject(WorkOrderService);
  private readonly activatedRoute = inject(ActivatedRoute);

  loading: boolean = false;
  submitted: boolean = false;

  isEditMode: boolean = false;

  currentId: string | null = null;
  projectId: string | null = null;

  workOrderForm!: FormGroup;

  // Replace these sample options with API data.
  projects: {
    label: string;
    value: string;
    location: string;
    projectLeaderId: string | null;
    projectLeaderName: string | null;
    members: {
      label: string;
      value: string;
    }[];
  }[] = [];
  assignees: { label: string; value: string }[] = [];

  workTypes: { label: string; value: string }[] = [];
  priorities: { label: string; value: string }[] = [];
  statuses: { label: string; value: string }[] = [];
  members: { label: string; value: string }[] = [];

  ngOnInit(): void {
    this.currentId = this.activatedRoute.snapshot.queryParams['id'] || null;
    this.projectId =
      this.activatedRoute.snapshot.queryParams['projectId'] || null;

    this.isEditMode = !!this.currentId;

    this.initializeForm();
    this.valueOnChange();
    this.loadDropdowns();
  }

  valueOnChange(): void {
    this.workOrderForm.get('projectId')?.valueChanges.subscribe((projectId) => {
      this.updateProjectOptions(projectId, true);
    });
  }

  private updateProjectOptions(
    projectId: string | null,
    resetAssignment: boolean,
  ): void {
    const selectedProject = this.projects.find(
      (project) => project.value === projectId,
    );

    this.members = selectedProject?.members || [];
    this.assignees = [...this.members];

    this.workOrderForm.patchValue(
      {
        location: selectedProject?.location || '',
        ...(resetAssignment
          ? {
              assignedToId: null,
              workOrderMembers: [],
            }
          : {}),
      },
      { emitEvent: false },
    );

    this.cdr.markForCheck();
  }

  private initializeForm(): void {
    this.workOrderForm = this.fb.group({
      id: [null],
      projectId: [null, Validators.required],
      title: ['', [Validators.required, Validators.maxLength(200)]],
      workType: [null, Validators.required],
      priority: ['Normal', Validators.required],
      status: ['Open', Validators.required],
      location: ['', Validators.maxLength(250)],
      assignedToId: [null],
      workOrderMembers: [[]],
      scheduledDate: [null],
      dueDate: [null],
      description: ['', Validators.maxLength(5000)],
    });
  }

  loadDropdowns(): void {
    this.loading = true;

    this.workOrderService
      .GetDropdown()
      .pipe(
        // First: Load dropdown options
        tap((response: WorkOrderDropdownDto) => {
          this.projects = (response.projects || []).map((project) => {
            const members = (project.projectMembers || []).map((member) => ({
              label: member.user.displayName || member.user.fullName,
              value: member.userId,
            }));

            // Include Project Leader if not already in Project Members
            if (
              project.projectLeaderId &&
              !members.some(
                (member) => member.value === project.projectLeaderId,
              )
            ) {
              members.unshift({
                label: project.projectLeaderName || 'Project Leader',
                value: project.projectLeaderId,
              });
            }

            return {
              label: `${project.projectCode} - ${project.projectTitle}`,
              value: project.id,
              location: project.location || '',
              projectLeaderId: project.projectLeaderId,
              projectLeaderName: project.projectLeaderName,
              members,
            };
          });

          this.assignees = (response.users || []).map((user) => ({
            label: user.displayName || user.fullName,
            value: user.id,
          }));

          this.members = [...this.assignees];

          this.workTypes = (response.workTypes || []).map((item) => ({
            label: this.formatLabel(item),
            value: item,
          }));

          this.priorities = (response.priorities || []).map((item) => ({
            label: this.formatLabel(item),
            value: item,
          }));

          this.statuses = (response.statuses || []).map((item) => ({
            label: this.formatLabel(item),
            value: item,
          }));
        }),

        // Second: Load existing work order if edit mode
        switchMap(() => {
          if (this.currentId) {
            return this.workOrderService.GetOne(this.currentId);
          }

          return of(null);
        }),

        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (res) => {
          if (res) {
            // Edit mode: use the existing work order's project
            this.patchWorkOrderForm(res);
          } else if (this.projectId) {
            // Create mode: use projectId from ActivatedRoute
            this.workOrderForm.get('projectId')?.setValue(this.projectId);
          }

          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Failed to load work order form:', error);
        },
      });
  }

  // LoadForm(): void {
  //   if (!this.currentId) return;

  //   this.loading = true;

  //   this.workOrderService
  //     .GetOne(this.currentId)
  //     .pipe(
  //       finalize(() => {
  //         this.loading = false;
  //         this.cdr.markForCheck();
  //       }),
  //     )
  //     .subscribe({
  //       next: (res) => {
  //         // Find selected project
  //         const selectedProject = this.projects.find(
  //           (project) => project.value === res.projectId,
  //         );

  //         // Update project-dependent dropdown options
  //         this.members = selectedProject?.members || [];
  //         this.assignees = [...this.members];

  //         // Patch form values
  //         this.workOrderForm.patchValue(
  //           {
  //             ...res,
  //             scheduledDate: res.scheduledDate
  //               ? new Date(res.scheduledDate)
  //               : null,
  //             dueDate: res.dueDate ? new Date(res.dueDate) : null,
  //             workOrderMembers: (res.workOrderMembers || []).map(
  //               (member: any) => member.userId || member,
  //             ),
  //           },
  //           { emitEvent: false },
  //         );

  //         this.cdr.markForCheck();
  //       },
  //       error: (err) => {
  //         console.error('Failed to load work order:', err);
  //       },
  //     });
  // }

  private patchWorkOrderForm(res: any): void {
    // Set project members and PIC options without resetting assignments
    this.updateProjectOptions(res.projectId, false);

    this.workOrderForm.patchValue(
      {
        ...res,
        scheduledDate: res.scheduledDate ? new Date(res.scheduledDate) : null,
        dueDate: res.dueDate ? new Date(res.dueDate) : null,
        workOrderMembers: (res.workOrderMembers || []).map(
          (member: any) => member.userId || member,
        ),
      },
      { emitEvent: false },
    );

    this.cdr.markForCheck();
  }

  private formatLabel(value: string): string {
    return value.replace(/([a-z])([A-Z])/g, '$1 $2');
  }

  get f() {
    return this.workOrderForm.controls;
  }

  get pageTitle(): string {
    return this.isEditMode ? 'Edit Work Order' : 'Create Work Order';
  }

  get submitLabel(): string {
    return this.isEditMode ? 'Update Work Order' : 'Create Work Order';
  }

  isInvalid(controlName: string): boolean {
    const control = this.workOrderForm.get(controlName);

    return !!(
      control &&
      control.invalid &&
      (control.touched || this.submitted)
    );
  }

  saveWorkOrder(): void {
    this.submitted = true;

    if (this.workOrderForm.invalid) {
      this.workOrderForm.markAllAsTouched();
      return;
    }

    const formValue = this.workOrderForm.getRawValue();

    const payload = {
      ...formValue,
      scheduledDate: formValue.scheduledDate
        ? this.toDateOnly(formValue.scheduledDate)
        : null,
      dueDate: formValue.dueDate ? this.toDateOnly(formValue.dueDate) : null,
    };

    this.loading = true;
    this.cdr.markForCheck();

    const request = this.isEditMode
      ? this.workOrderService.Update(payload)
      : this.workOrderService.Create(payload);

    request.subscribe({
      next: (response) => {
        this.loading = false;
        this.cdr.markForCheck();

        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: this.isEditMode
            ? `Work order: ${response.workOrderNo} updated successfully.`
            : 'Work order created successfully.',
        });

        this.router.navigate(['/work-order']);
      },
      error: (error) => {
        this.loading = false;
        this.cdr.markForCheck();

        console.error('Save Work Order Error:', error);

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail:
            error.error?.message ||
            error.error?.Message ||
            'Failed to save work order.',
        });
      },
    });
  }

  private toDateOnly(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  cancel(): void {
    this.router.navigate(['/work-order']);
  }

  get allSelectedMembers(): { label: string; value: string }[] {
    const selectedIds: string[] =
      this.workOrderForm.get('workOrderMembers')?.value || [];

    return this.members.filter((member) => selectedIds.includes(member.value));
  }

  // Display every selected team member; there is no display limit.
  get selectedMembers(): { label: string; value: string }[] {
    return this.allSelectedMembers;
  }

  get totalSelectedMembers(): number {
    return this.allSelectedMembers.length;
  }

  get availableMembers(): { label: string; value: string }[] {
    const picId = this.workOrderForm.get('assignedToId')?.value;

    return this.members.filter((member) => member.value !== picId);
  }

  onAssignedToChange(): void {
    const picId = this.workOrderForm.get('assignedToId')?.value;
    const control = this.workOrderForm.get('workOrderMembers');

    const selectedIds: string[] = control?.value || [];

    control?.setValue(selectedIds.filter((id) => id !== picId));
  }

  clearAllMembers(): void {
    this.workOrderForm.patchValue({
      workOrderMembers: [],
    });
  }

  removeMember(memberId: string): void {
    const currentMembers: string[] =
      this.workOrderForm.get('workOrderMembers')?.value || [];

    this.workOrderForm.patchValue({
      workOrderMembers: currentMembers.filter((id) => id !== memberId),
    });
  }
}
