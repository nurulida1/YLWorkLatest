import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
} from '@angular/core';

import {
  FormBuilder,
  Validators,
  FormArray,
  ReactiveFormsModule,
} from '@angular/forms';

import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';

import {
  HardwareRequestType,
  HardwareRequestPriority,
  CreateHardwareRequest,
  HardwareRequestDto,
} from '../../../../models/HardwareRequest';

import { HardwareRequestService } from '../../../../services/HardwareRequestService';
import { InventoryService } from '../../../../services/InventoryService';
import { InventoryDropdownItem } from '../../../../models/Inventory';
import { ActivatedRoute } from '@angular/router';
import { ProjectService } from '../../../../services/ProjectService';

@Component({
  selector: 'app-hardware-request',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePickerModule, SelectModule],
  template: `
    <div class="hardware-page">
      <!-- PAGE HEADER -->
      <div class="page-header">
        <div>
          <h2>Hardware / IT Support</h2>
          <p>
            Submit equipment requests, site material requests, technical support
            tickets or report an OfficeHub bug.
          </p>
        </div>
      </div>

      <div class="request-layout">
        <!-- REQUEST FORM -->
        <section class="form-card">
          <div class="card-header">
            <div>
              <h3>New Request</h3>
              <p>Fill in the details below to submit your request.</p>
            </div>

            <span class="required-label">* Required fields</span>
          </div>

          <form [formGroup]="form" (ngSubmit)="submitRequest()">
            <!-- REQUEST INFORMATION -->
            <div class="form-section">
              <h4>Request Information</h4>

              <label class="field-label"> Request Type <span>*</span> </label>

              <div class="request-type-grid">
                @for (type of requestTypes; track type.value) {
                  <label
                    class="request-type-option"
                    [class.selected]="requestType === type.value"
                  >
                    <input
                      type="radio"
                      formControlName="requestType"
                      [value]="type.value"
                      (change)="onRequestTypeChange()"
                    />

                    <div>
                      <strong>{{ type.label }}</strong>
                      <small>{{ type.description }}</small>
                    </div>
                  </label>
                }
              </div>

              <div class="form-grid">
                <!-- SUBJECT -->
                <div class="form-field full-width">
                  <label>Subject <span>*</span></label>

                  <input
                    type="text"
                    formControlName="subject"
                    placeholder="Enter request subject"
                  />

                  @if (
                    form.get('subject')?.touched && form.get('subject')?.invalid
                  ) {
                    <small class="error-text"> Subject is required. </small>
                  }
                </div>

                <!-- DESCRIPTION -->
                <div class="form-field full-width">
                  <label>Description <span>*</span></label>

                  <textarea
                    formControlName="description"
                    rows="4"
                    placeholder="Describe your request..."
                  ></textarea>

                  @if (
                    form.get('description')?.touched &&
                    form.get('description')?.invalid
                  ) {
                    <small class="error-text"> Description is required. </small>
                  }
                </div>

                <!-- PRIORITY -->
                <div class="form-field">
                  <label>Priority <span>*</span></label>

                  <p-select
                    formControlName="priority"
                    [options]="priorities"
                    placeholder="Select Priority"
                    appendTo="body"
                    styleClass="w-full"
                  />
                </div>

                <!-- NEEDED BY -->
                <div class="form-field">
                  <label>Needed By</label>

                  <p-datepicker
                    formControlName="neededBy"
                    dateFormat="dd/mm/yy"
                    placeholder="Select Needed By Date"
                    [showIcon]="true"
                    [showButtonBar]="true"
                    appendTo="body"
                    styleClass="w-full"
                    inputStyleClass="w-full"
                  />
                </div>
              </div>
            </div>

            <!-- PROJECT / SITE INFORMATION -->
            @if (isSiteMaterial) {
              <div class="form-section">
                <h4>Project / Site Information</h4>

                <div class="form-grid">
                  <div class="form-field">
                    <label>Project <span>*</span></label>

                    <p-select
                      formControlName="projectId"
                      [options]="projectSelection"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Select Project"
                      [filter]="true"
                      appendTo="body"
                      styleClass="w-full"
                      (onChange)="onProjectSelectionChange()"
                    />

                    @if (
                      form.get('projectId')?.touched &&
                      form.get('projectId')?.invalid
                    ) {
                      <small class="error-text">Please select a project.</small>
                    }
                  </div>

                  @if (isOtherProject) {
                    <div class="form-field">
                      <label>Project Name <span>*</span></label>

                      <input
                        type="text"
                        formControlName="projectName"
                        placeholder="Enter project name"
                        maxlength="150"
                      />

                      @if (
                        form.get('projectName')?.touched &&
                        form.get('projectName')?.invalid
                      ) {
                        <small class="error-text">
                          Please enter the project name.
                        </small>
                      }
                    </div>
                  }

                  <div class="form-field">
                    <label>Site Name</label>

                    <input
                      type="text"
                      formControlName="siteName"
                      placeholder="Enter site name"
                    />
                  </div>

                  <div class="form-field">
                    <label>Location</label>

                    <input
                      type="text"
                      formControlName="location"
                      placeholder="e.g. Kuala Lumpur"
                    />
                  </div>

                  <div class="form-field">
                    <label>Location Details</label>

                    <input
                      type="text"
                      formControlName="locationDetails"
                      placeholder="Building, floor, room, etc."
                    />
                  </div>
                </div>
              </div>
            }

            <!-- REQUESTED ITEMS -->
            @if (showItems) {
              <div class="form-section">
                <div class="section-heading">
                  <div>
                    <h4>Requested Items</h4>
                    <p>Add all equipment or materials required.</p>
                  </div>

                  <span class="item-count"> {{ items.length }} item(s) </span>
                </div>

                <div formArrayName="items" class="items-container">
                  @for (item of items.controls; track $index; let i = $index) {
                    <div class="item-card" [formGroupName]="i">
                      <!-- ITEM HEADER -->
                      <div class="item-header">
                        <div>
                          <strong>Item {{ i + 1 }}</strong>

                          @if (item.get('inventoryId')?.value) {
                            <span class="item-type inventory-type">
                              Inventory
                            </span>
                          } @else {
                            <span class="item-type manual-type"> Manual </span>
                          }
                        </div>

                        <button
                          type="button"
                          class="btn-remove"
                          (click)="removeItem(i)"
                          [disabled]="items.length <= 1"
                        >
                          <span>×</span> Remove
                        </button>
                      </div>

                      <div class="form-grid">
                        <!-- INVENTORY -->
                        <div class="form-field full-width">
                          <label>Inventory Item (Optional)</label>

                          <p-select
                            formControlName="inventoryId"
                            [options]="inventoryItems"
                            optionLabel="itemName"
                            optionValue="id"
                            placeholder="-- Select Inventory or Enter Manually --"
                            [disabled]="inventoryLoading"
                            [showClear]="!!item.get('inventoryId')?.value"
                            [filter]="true"
                            filterBy="itemName,itemCode"
                            appendTo="body"
                            styleClass="w-full"
                            (onChange)="onInventorySelected(i)"
                          >
                            <ng-template let-inventory pTemplate="item">
                              <div class="flex flex-col">
                                <span class="font-medium">
                                  {{ inventory.itemName }}
                                </span>

                                @if (inventory.itemCode) {
                                  <small class="text-gray-500">
                                    {{ inventory.itemCode }}
                                  </small>
                                }
                              </div>
                            </ng-template>
                          </p-select>
                        </div>

                        <!-- ITEM NAME -->
                        <div class="form-field">
                          <label>Item Name <span>*</span></label>

                          <input
                            type="text"
                            formControlName="itemName"
                            placeholder="Enter item name"
                            [readonly]="!!item.get('inventoryId')?.value"
                          />

                          @if (
                            item.get('itemName')?.touched &&
                            item.get('itemName')?.invalid
                          ) {
                            <small class="error-text">
                              Item name is required.
                            </small>
                          }
                        </div>

                        <!-- ITEM CODE -->
                        <div class="form-field">
                          <label>Item Code</label>

                          <input
                            type="text"
                            formControlName="itemCode"
                            placeholder="Item code"
                            [readonly]="!!item.get('inventoryId')?.value"
                          />
                        </div>

                        <!-- QUANTITY -->
                        <div class="form-field">
                          <label>Quantity <span>*</span></label>

                          <input
                            type="number"
                            formControlName="requestedQuantity"
                            min="0.01"
                            step="0.01"
                          />

                          @if (
                            item.get('requestedQuantity')?.touched &&
                            item.get('requestedQuantity')?.invalid
                          ) {
                            <small class="error-text">
                              Quantity must be greater than zero.
                            </small>
                          }
                        </div>

                        <!-- UNIT -->
                        <div class="form-field">
                          <label>Unit</label>

                          <input
                            type="text"
                            formControlName="unit"
                            placeholder="Unit, Box, Roll..."
                          />
                        </div>

                        <!-- DESCRIPTION -->
                        <div class="form-field full-width">
                          <label>Description / Specification</label>

                          <input
                            type="text"
                            formControlName="description"
                            placeholder="Brand, model or specification"
                          />
                        </div>

                        <!-- REMARKS -->
                        <div class="form-field full-width">
                          <label>Remarks</label>

                          <input
                            type="text"
                            formControlName="remarks"
                            placeholder="Additional information"
                          />
                        </div>
                      </div>
                    </div>
                  }
                </div>

                <!-- ADD ITEM -->
                <div class="add-item-sticky">
                  <button
                    type="button"
                    class="btn-add-sticky"
                    (click)="addItem()"
                  >
                    <span>+</span>
                    Add Another Item
                  </button>
                </div>
              </div>
            }

            <!-- IT SUPPORT INFORMATION -->
            @if (isITSupport) {
              <div class="info-note">
                <strong>IT Support Request</strong>

                <p>
                  Describe the technical issue in the description field. Include
                  the affected computer, software, network or device so the IT
                  team can investigate.
                </p>
              </div>
            }

            <!-- BUG REPORT INFORMATION -->
            @if (isBugReport) {
              <div class="form-section">
                <h4>Bug Report Details</h4>

                <p class="section-description">
                  Help us understand what went wrong so our development team can
                  investigate.
                </p>

                <div class="form-grid">
                  <!-- AFFECTED MODULE -->
                  <div class="form-field">
                    <label>Module Affected <span>*</span></label>

                    <p-select
                      formControlName="affectedModule"
                      [options]="affectedModuleOptions"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Select Module"
                      [showClear]="form.get('affectedModule')?.value"
                      styleClass="w-full"
                      appendTo="body"
                    ></p-select>

                    @if (
                      form.get('affectedModule')?.touched &&
                      form.get('affectedModule')?.invalid
                    ) {
                      <small class="error-text">
                        Please select the affected module.
                      </small>
                    }
                  </div>

                  <!-- BUG CATEGORY -->
                  <div class="form-field">
                    <label>Issue Category <span>*</span></label>

                    <p-select
                      formControlName="bugCategory"
                      [options]="bugCategoryOptions"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Select Category"
                      [showClear]="form.get('bugCategory')?.value"
                      styleClass="w-full"
                      appendTo="body"
                    ></p-select>

                    @if (
                      form.get('bugCategory')?.touched &&
                      form.get('bugCategory')?.invalid
                    ) {
                      <small class="error-text">
                        Please select the issue category.
                      </small>
                    }
                  </div>

                  <!-- STEPS TO REPRODUCE -->
                  <div class="form-field full-width">
                    <label>Steps to Reproduce <span>*</span></label>

                    <textarea
                      formControlName="stepsToReproduce"
                      rows="3"
                      placeholder="1. Open the module&#10;2. Click the button&#10;3. Describe what happens..."
                    ></textarea>

                    @if (
                      form.get('stepsToReproduce')?.touched &&
                      form.get('stepsToReproduce')?.invalid
                    ) {
                      <small class="error-text">
                        Please provide the steps to reproduce the issue.
                      </small>
                    }
                  </div>

                  <!-- EXPECTED RESULT -->
                  <div class="form-field full-width">
                    <label>Expected Result <span>*</span></label>

                    <textarea
                      formControlName="expectedResult"
                      rows="2"
                      placeholder="What should happen?"
                    ></textarea>

                    @if (
                      form.get('expectedResult')?.touched &&
                      form.get('expectedResult')?.invalid
                    ) {
                      <small class="error-text">
                        Please describe the expected result.
                      </small>
                    }
                  </div>

                  <!-- ACTUAL RESULT -->
                  <div class="form-field full-width">
                    <label>Actual Result <span>*</span></label>

                    <textarea
                      formControlName="actualResult"
                      rows="2"
                      placeholder="What actually happened?"
                    ></textarea>

                    @if (
                      form.get('actualResult')?.touched &&
                      form.get('actualResult')?.invalid
                    ) {
                      <small class="error-text">
                        Please describe the actual result.
                      </small>
                    }
                  </div>
                </div>
              </div>
            }

            <!-- FORM ACTIONS -->
            <div class="form-actions">
              <button
                type="button"
                class="btn-secondary"
                (click)="resetForm()"
                [disabled]="submitting"
              >
                Clear Form
              </button>

              <button type="submit" class="btn-primary" [disabled]="submitting">
                @if (submitting) {
                  Submitting...
                } @else {
                  Submit Request
                }
              </button>
            </div>
          </form>
        </section>

        <!-- MY REQUESTS -->
        <section class="requests-card">
          <div class="card-header">
            <div>
              <h3>My Requests</h3>
              <p>Track your submitted requests.</p>
            </div>

            <button
              type="button"
              class="btn-refresh"
              (click)="loadMyRequests()"
              [disabled]="loading"
            >
              Refresh
            </button>
          </div>

          @if (loading) {
            <div class="empty-state">Loading requests...</div>
          } @else if (requests.length === 0) {
            <div class="empty-state">
              <strong>No requests yet</strong>
              <p>Your submitted requests will appear here.</p>
            </div>
          } @else {
            <div class="request-list">
              @for (request of requests; track request.id) {
                <article class="request-item">
                  <div class="request-item-top">
                    <span class="request-type-badge">
                      {{ getTypeLabel(request.requestType) }}
                    </span>

                    <span
                      class="status-badge"
                      [ngClass]="getStatusClass(request.status)"
                    >
                      {{ request.status }}
                    </span>
                  </div>

                  <h4>{{ request.subject }}</h4>

                  <p class="request-description">
                    {{ request.description }}
                  </p>

                  <!-- BUG REPORT SUMMARY -->
                  @if (request.requestType === 'BugReport') {
                    <div class="request-meta">
                      @if (request.affectedModule) {
                        <span>
                          <strong>Module:</strong>
                          {{ request.affectedModule }}
                        </span>
                      }

                      @if (request.bugCategory) {
                        <span>
                          <strong>Category:</strong>
                          {{ getBugCategoryLabel(request.bugCategory) }}
                        </span>
                      }
                    </div>

                    @if (request.stepsToReproduce) {
                      <div class="remarks-box">
                        <strong>Steps to Reproduce</strong>
                        <p>{{ request.stepsToReproduce }}</p>
                      </div>
                    }

                    @if (request.expectedResult) {
                      <div class="remarks-box">
                        <strong>Expected Result</strong>
                        <p>{{ request.expectedResult }}</p>
                      </div>
                    }

                    @if (request.actualResult) {
                      <div class="remarks-box">
                        <strong>Actual Result</strong>
                        <p>{{ request.actualResult }}</p>
                      </div>
                    }
                  }

                  <div class="request-meta">
                    <span>
                      <strong>Priority:</strong>
                      {{ request.priority }}
                    </span>

                    @if (request.neededBy) {
                      <span>
                        <strong>Needed:</strong>
                        {{ request.neededBy | date: 'dd MMM yyyy' }}
                      </span>
                    }

                    @if (request.projectName) {
                      <span>
                        <strong>Project:</strong>
                        {{ request.projectName }}
                      </span>
                    }

                    @if (request.siteName) {
                      <span>
                        <strong>Site:</strong>
                        {{ request.siteName }}
                      </span>
                    }
                  </div>

                  @if (request.items.length) {
                    <div class="request-items">
                      <strong>Items:</strong>

                      @for (item of request.items; track item.id) {
                        <div class="request-item-line">
                          <span>{{ item.itemName }}</span>

                          <span>
                            {{ item.issuedQuantity }} /
                            {{ item.approvedQuantity }}
                            {{ item.unit || '' }}
                          </span>
                        </div>
                      }
                    </div>
                  }

                  @if (request.assignedTo) {
                    <p class="assigned-info">
                      Assigned to: {{ request.assignedTo }}
                    </p>
                  }

                  @if (request.adminRemarks) {
                    <div class="remarks-box">
                      <strong>Admin Remarks</strong>
                      <p>{{ request.adminRemarks }}</p>
                    </div>
                  }

                  @if (request.rejectionReason) {
                    <div class="remarks-box rejection">
                      <strong>Rejection Reason</strong>
                      <p>{{ request.rejectionReason }}</p>
                    </div>
                  }

                  @if (isCancellable(request.status)) {
                    <div class="request-actions">
                      <button
                        type="button"
                        class="btn-cancel"
                        (click)="cancelRequest(request)"
                      >
                        Cancel Request
                      </button>
                    </div>
                  }
                </article>
              }
            </div>
          }
        </section>
      </div>
    </div>
  `,
  styleUrl: './hardware-request.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HardwareRequest implements OnInit {
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  private hardwareRequestService = inject(HardwareRequestService);
  private messageService = inject(MessageService);
  private inventoryService = inject(InventoryService);
  private projectService = inject(ProjectService);
  private readonly route = inject(ActivatedRoute);

  private readonly OTHER_PROJECT_VALUE = '__OTHER__';

  loading = false;
  submitting = false;
  inventoryLoading = false;
  projectsLoading = false;

  inventoryItems: InventoryDropdownItem[] = [];
  requests: HardwareRequestDto[] = [];

  projectSelection: { label: string; value: string }[] = [];

  affectedModuleOptions = [
    { label: 'Dashboard', value: 'Dashboard' },
    { label: 'User Management', value: 'User Management' },
    { label: 'Leave Management', value: 'Leave Management' },
    { label: 'Claims', value: 'Claims' },
    { label: 'Meetings', value: 'Meetings' },
    { label: 'Projects', value: 'Projects' },
    { label: 'Inventory', value: 'Inventory' },
    { label: 'Announcements', value: 'Announcements' },
    { label: 'Other', value: 'Other' },
  ];

  bugCategoryOptions = [
    { label: 'Feature Not Working', value: 'Functional' },
    { label: 'UI / Display Issue', value: 'Display' },
    { label: 'Performance Issue', value: 'Performance' },
    { label: 'Login / Permission Issue', value: 'Access' },
    { label: 'Incorrect Data', value: 'Data' },
    { label: 'Other', value: 'Other' },
  ];

  requestTypes: {
    label: string;
    value: HardwareRequestType;
    description: string;
  }[] = [
    {
      label: 'Hardware Request',
      value: 'Hardware',
      description: 'Request computers, monitors, accessories and equipment.',
    },
    {
      label: 'Site Material Request',
      value: 'SiteMaterial',
      description: 'Request materials required for project or site work.',
    },
    {
      label: 'IT Support',
      value: 'ITSupport',
      description: 'Report computer, network, software or technical issues.',
    },
    {
      label: 'Bug Report',
      value: 'BugReport',
      description:
        'Report errors, broken features or unexpected behaviour in OfficeHub.',
    },
  ];

  priorities: HardwareRequestPriority[] = ['Low', 'Normal', 'High', 'Urgent'];

  form = this.fb.group({
    requestType: ['Hardware' as HardwareRequestType, Validators.required],

    subject: ['', [Validators.required, Validators.maxLength(150)]],

    description: ['', [Validators.required, Validators.maxLength(2000)]],

    priority: ['Normal' as HardwareRequestPriority, Validators.required],

    projectId: ['' as string | null],
    projectName: [''],

    siteName: [''],
    location: [''],
    locationDetails: [''],

    neededBy: [null as Date | null],

    affectedModule: [''],
    bugCategory: [''],
    stepsToReproduce: [''],
    expectedResult: [''],
    actualResult: [''],

    items: this.fb.array([]),
  });

  // =====================================================
  // INITIALIZATION
  // =====================================================

  ngOnInit(): void {
    this.loadMyRequests();
    this.loadInventoryItems();
    this.loadProjects();

    this.route.queryParamMap.subscribe((params) => {
      const type = params.get('type');
      const projectId = params.get('projectId');

      if (type && this.isValidRequestType(type)) {
        this.form.patchValue({
          requestType: type,
        });

        this.onRequestTypeChange();
      }

      if (projectId) {
        this.form.patchValue({
          projectId,
        });
      }

      this.cdr.markForCheck();
    });

    this.updateConditionalValidators();

    if (this.showItems && this.items.length === 0) {
      this.addItem();
    }
  }

  private isValidRequestType(type: string): type is HardwareRequestType {
    return ['Hardware', 'SiteMaterial', 'ITSupport', 'BugReport'].includes(
      type,
    );
  }

  // =====================================================
  // LOAD PROJECTS
  // =====================================================

  loadProjects(): void {
    this.projectsLoading = true;

    this.projectService
      .GetMany({
        Page: 1,
        PageSize: 1000,
        Filter: null,
        OrderBy: 'ProjectTitle',
        Includes: null,
        Select: null,
      })
      .subscribe({
        next: (response) => {
          const projects = response?.data ?? [];

          this.projectSelection = projects.map((project) => ({
            label: `${project.projectCode} - ${project.projectTitle}`,
            value: project.id,
          }));

          // Always provide the manual project option.
          this.projectSelection.push({
            label: 'Other (Enter Project Name)',
            value: this.OTHER_PROJECT_VALUE,
          });

          this.projectsLoading = false;
          this.cdr.markForCheck();
        },

        error: (error) => {
          console.error('Failed to load projects:', error);

          // Still allow users to enter a project manually.
          this.projectSelection = [
            {
              label: 'Other (Enter Project Name)',
              value: this.OTHER_PROJECT_VALUE,
            },
          ];

          this.projectsLoading = false;

          this.messageService.add({
            severity: 'warn',
            summary: 'Projects Unavailable',
            detail:
              'Unable to load projects. You can select Other and enter the project name manually.',
          });

          this.cdr.markForCheck();
        },
      });
  }

  // =====================================================
  // LOAD INVENTORY
  // =====================================================

  loadInventoryItems(): void {
    this.inventoryLoading = true;

    this.inventoryService.GetRequestItems().subscribe({
      next: (response) => {
        this.inventoryItems = response ?? [];
        this.inventoryLoading = false;
        this.cdr.markForCheck();
      },

      error: (error) => {
        console.error('Failed to load inventory items:', error);

        this.inventoryItems = [];
        this.inventoryLoading = false;

        this.messageService.add({
          severity: 'warn',
          summary: 'Inventory Unavailable',
          detail:
            'Unable to load inventory items. You can still enter items manually.',
        });

        this.cdr.markForCheck();
      },
    });
  }

  // =====================================================
  // GETTERS
  // =====================================================

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  get requestType(): HardwareRequestType {
    return this.form.get('requestType')?.value as HardwareRequestType;
  }

  get isITSupport(): boolean {
    return this.requestType === 'ITSupport';
  }

  get isSiteMaterial(): boolean {
    return this.requestType === 'SiteMaterial';
  }

  get isBugReport(): boolean {
    return this.requestType === 'BugReport';
  }

  get showItems(): boolean {
    return (
      this.requestType === 'Hardware' || this.requestType === 'SiteMaterial'
    );
  }

  get isOtherProject(): boolean {
    return (
      this.isSiteMaterial &&
      this.form.get('projectId')?.value === this.OTHER_PROJECT_VALUE
    );
  }

  // =====================================================
  // PROJECT SELECTION
  // =====================================================

  onProjectSelectionChange(): void {
    const projectIdControl = this.form.get('projectId');
    const projectNameControl = this.form.get('projectName');

    if (!projectIdControl || !projectNameControl) {
      return;
    }

    if (projectIdControl.value === this.OTHER_PROJECT_VALUE) {
      projectNameControl.setValidators([
        Validators.required,
        Validators.maxLength(150),
      ]);
    } else {
      projectNameControl.clearValidators();
      projectNameControl.setValue('');
      projectNameControl.markAsUntouched();
    }

    projectNameControl.updateValueAndValidity({
      emitEvent: false,
    });

    this.updateConditionalValidators();
    this.cdr.markForCheck();
  }

  // =====================================================
  // CONDITIONAL VALIDATORS
  // =====================================================

  private updateConditionalValidators(): void {
    const bugReportFields = [
      'affectedModule',
      'bugCategory',
      'stepsToReproduce',
      'expectedResult',
      'actualResult',
    ];

    for (const fieldName of bugReportFields) {
      const control = this.form.get(fieldName);

      if (!control) {
        continue;
      }

      if (this.isBugReport) {
        control.setValidators([
          Validators.required,
          Validators.maxLength(fieldName === 'stepsToReproduce' ? 4000 : 2000),
        ]);
      } else {
        control.clearValidators();
        control.setValue('');
        control.markAsUntouched();
      }

      control.updateValueAndValidity({
        emitEvent: false,
      });
    }

    // Project selection is required only for Site Material requests.
    const projectIdControl = this.form.get('projectId');
    const projectNameControl = this.form.get('projectName');

    if (this.isSiteMaterial) {
      projectIdControl?.setValidators([Validators.required]);
    } else {
      projectIdControl?.clearValidators();
      projectIdControl?.setValue('');
      projectIdControl?.markAsUntouched();

      projectNameControl?.clearValidators();
      projectNameControl?.setValue('');
      projectNameControl?.markAsUntouched();
    }

    if (this.isOtherProject) {
      projectNameControl?.setValidators([
        Validators.required,
        Validators.maxLength(150),
      ]);
    }

    projectIdControl?.updateValueAndValidity({
      emitEvent: false,
    });

    projectNameControl?.updateValueAndValidity({
      emitEvent: false,
    });
  }

  // =====================================================
  // CREATE ITEM FORM
  // =====================================================

  createItemForm() {
    return this.fb.group({
      inventoryId: [''],

      itemName: ['', Validators.required],

      itemCode: [''],

      description: [''],

      unit: ['Unit'],

      requestedQuantity: [1, [Validators.required, Validators.min(0.01)]],

      remarks: [''],
    });
  }

  // =====================================================
  // ADD ITEM
  // =====================================================

  addItem(): void {
    if (!this.showItems) {
      return;
    }

    this.items.push(this.createItemForm());
    this.cdr.markForCheck();
  }

  // =====================================================
  // REMOVE ITEM
  // =====================================================

  removeItem(index: number): void {
    if (this.items.length <= 1) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cannot Remove',
        detail: 'At least one item is required.',
      });

      return;
    }

    this.items.removeAt(index);
    this.cdr.markForCheck();
  }

  // =====================================================
  // INVENTORY SELECTION
  // =====================================================

  onInventorySelected(index: number): void {
    const itemGroup = this.items.at(index);
    const inventoryId = itemGroup.get('inventoryId')?.value;

    if (!inventoryId) {
      itemGroup.patchValue({
        inventoryId: '',
        itemName: '',
        itemCode: '',
      });

      this.cdr.markForCheck();
      return;
    }

    const selectedItem = this.inventoryItems.find(
      (item) => item.id === inventoryId,
    );

    if (!selectedItem) {
      return;
    }

    itemGroup.patchValue({
      itemName: selectedItem.itemName,
      itemCode: selectedItem.itemCode ?? '',
    });

    itemGroup.get('itemName')?.updateValueAndValidity();

    this.cdr.markForCheck();
  }

  // =====================================================
  // REQUEST TYPE CHANGE
  // =====================================================

  onRequestTypeChange(): void {
    if (!this.showItems) {
      this.items.clear();
    } else if (this.items.length === 0) {
      this.addItem();
    }

    this.updateConditionalValidators();
    this.cdr.markForCheck();
  }

  // =====================================================
  // LOAD MY REQUESTS
  // =====================================================

  loadMyRequests(): void {
    this.loading = true;

    this.hardwareRequestService.GetMyRequests().subscribe({
      next: (response) => {
        this.requests = response ?? [];
        this.loading = false;
        this.cdr.markForCheck();
      },

      error: (error) => {
        console.error('Failed to load requests:', error);

        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  // =====================================================
  // SUBMIT REQUEST
  // =====================================================

  submitRequest(): void {
    this.updateConditionalValidators();

    if (this.form.invalid) {
      this.form.markAllAsTouched();

      this.messageService.add({
        severity: 'warn',
        summary: 'Incomplete Form',
        detail: 'Please complete all required fields.',
      });

      return;
    }

    const value = this.form.getRawValue();

    // Helper for nullable text fields.
    const cleanText = (input: string | null | undefined): string =>
      (input ?? '').trim();

    const subject = cleanText(value.subject);
    const description = cleanText(value.description);

    if (!subject || !description) {
      this.form.markAllAsTouched();

      this.messageService.add({
        severity: 'warn',
        summary: 'Incomplete Form',
        detail: 'Subject and description are required.',
      });

      return;
    }

    if (this.showItems && this.items.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Missing Items',
        detail: 'Please add at least one requested item.',
      });

      return;
    }

    // Explicitly type FormArray values.
    const requestItems = (value.items ?? []) as Array<{
      inventoryId: string | null;
      itemName: string | null;
      itemCode: string | null;
      description: string | null;
      unit: string | null;
      requestedQuantity: number | null;
      remarks: string | null;
    }>;

    // Validate item names after trimming.
    if (
      this.showItems &&
      requestItems.some((item) => !cleanText(item.itemName))
    ) {
      this.items.markAllAsTouched();

      this.messageService.add({
        severity: 'warn',
        summary: 'Missing Item Name',
        detail: 'Please enter an item name for every requested item.',
      });

      return;
    }

    const requestType = value.requestType as HardwareRequestType;
    const priority = value.priority as HardwareRequestPriority;

    const isSiteMaterial = requestType === 'SiteMaterial';
    const isBugReport = requestType === 'BugReport';

    const isOtherProject =
      isSiteMaterial && value.projectId === this.OTHER_PROJECT_VALUE;

    this.submitting = true;

    const request: CreateHardwareRequest = {
      requestType,

      subject,

      description,

      priority,

      // Existing project: send its ID.
      // Other: send null and use the manually entered project name.
      projectId:
        isSiteMaterial && !isOtherProject ? value.projectId || null : null,

      projectName: isOtherProject ? cleanText(value.projectName) || null : null,

      siteName: isSiteMaterial ? cleanText(value.siteName) || null : null,

      location: isSiteMaterial ? cleanText(value.location) || null : null,

      locationDetails: isSiteMaterial
        ? cleanText(value.locationDetails) || null
        : null,

      neededBy: value.neededBy ? value.neededBy.toISOString() : null,

      // Bug Report fields.
      affectedModule: isBugReport
        ? cleanText(value.affectedModule) || null
        : null,

      bugCategory: isBugReport ? value.bugCategory || null : null,

      stepsToReproduce: isBugReport
        ? cleanText(value.stepsToReproduce) || null
        : null,

      expectedResult: isBugReport
        ? cleanText(value.expectedResult) || null
        : null,

      actualResult: isBugReport ? cleanText(value.actualResult) || null : null,

      // Only Hardware and SiteMaterial contain items.
      items: this.showItems
        ? requestItems.map((item) => ({
            inventoryId: item.inventoryId || null,

            itemName: cleanText(item.itemName),

            itemCode: cleanText(item.itemCode) || null,

            description: cleanText(item.description) || null,

            unit: cleanText(item.unit) || null,

            requestedQuantity: Number(item.requestedQuantity),

            remarks: cleanText(item.remarks) || null,
          }))
        : [],
    };

    this.hardwareRequestService.Create(request).subscribe({
      next: (response) => {
        this.submitting = false;

        this.messageService.add({
          severity: 'success',
          summary: 'Request Submitted',
          detail: response.message || 'Your request has been submitted.',
        });

        this.resetForm();
        this.loadMyRequests();

        this.cdr.markForCheck();
      },

      error: (error) => {
        console.error('Failed to submit request:', error);

        this.submitting = false;

        this.messageService.add({
          severity: 'error',
          summary: 'Submission Failed',
          detail:
            error?.error?.message ||
            error?.error?.detail ||
            'Unable to submit your request.',
        });

        this.cdr.markForCheck();
      },
    });
  }

  // =====================================================
  // RESET FORM
  // =====================================================

  resetForm(): void {
    this.form.reset({
      requestType: 'Hardware',
      subject: '',
      description: '',
      priority: 'Normal',

      projectId: '',
      projectName: '',

      siteName: '',
      location: '',
      locationDetails: '',

      neededBy: null,

      affectedModule: '',
      bugCategory: '',
      stepsToReproduce: '',
      expectedResult: '',
      actualResult: '',
    });

    this.items.clear();

    this.updateConditionalValidators();

    this.addItem();

    this.form.markAsPristine();
    this.form.markAsUntouched();

    this.cdr.markForCheck();
  }

  // =====================================================
  // CANCEL REQUEST
  // =====================================================

  cancelRequest(request: HardwareRequestDto): void {
    if (!confirm(`Cancel request "${request.subject}"?`)) {
      return;
    }

    this.hardwareRequestService.Cancel(request.id).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Cancelled',
          detail: response.message || 'Request cancelled successfully.',
        });

        this.loadMyRequests();
      },

      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Unable to Cancel',
          detail: error?.error?.message || 'Unable to cancel this request.',
        });
      },
    });
  }

  // =====================================================
  // DISPLAY HELPERS
  // =====================================================

  getTypeLabel(type: string): string {
    switch (type) {
      case 'Hardware':
        return 'Hardware';
      case 'SiteMaterial':
        return 'Site Material';
      case 'ITSupport':
        return 'IT Support';
      case 'BugReport':
        return 'Bug Report';
      default:
        return type;
    }
  }

  getBugCategoryLabel(category: string): string {
    switch (category) {
      case 'Functional':
        return 'Feature Not Working';
      case 'Display':
        return 'UI / Display Issue';
      case 'Performance':
        return 'Performance Issue';
      case 'Access':
        return 'Login / Permission Issue';
      case 'Data':
        return 'Incorrect Data';
      case 'Other':
        return 'Other';
      default:
        return category;
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Approved':
      case 'Issued':
      case 'Resolved':
        return 'status-success';

      case 'Pending':
      case 'PartiallyIssued':
      case 'InProgress':
        return 'status-warning';

      case 'Rejected':
      case 'Cancelled':
        return 'status-danger';

      default:
        return 'status-default';
    }
  }

  isCancellable(status: string): boolean {
    return !['Issued', 'Resolved', 'Rejected', 'Cancelled'].includes(status);
  }
}
