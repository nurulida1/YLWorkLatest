import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
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

import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { MessageService } from 'primeng/api';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';

import {
  HardwareRequestType,
  HardwareRequestPriority,
  CreateHardwareRequest,
} from '../../../../models/HardwareRequest';

import { HardwareRequestService } from '../../../../services/HardwareRequestService';
import { InventoryService } from '../../../../services/InventoryService';
import { InventoryDropdownItem } from '../../../../models/Inventory';
import { ProjectService } from '../../../../services/ProjectService';
import { Textarea, TextareaModule } from 'primeng/textarea';

@Component({
  selector: 'app-request-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DatePickerModule,
    SelectModule,
    TextareaModule,
  ],
  template: `
    <div class="request-form-page">
      <!-- PAGE HEADER -->
      <div class="page-header">
        <div>
          <h2>New Request</h2>
          <p class="page-description">
            Submit a hardware, site material, IT support or bug report request.
          </p>
        </div>

        <button type="button" class="btn-secondary" (click)="goBack()">
          <i class="pi pi-arrow-left"></i>
          Back
        </button>
      </div>

      <!-- REQUEST FORM -->
      <form
        [formGroup]="form"
        (ngSubmit)="submitRequest()"
        class="request-form"
      >
        <!-- REQUEST INFORMATION -->
        <section class="form-section">
          <div class="section-header">
            <div>
              <h3 class="text-lg">Request Information</h3>
              <p>Provide the basic information about your request.</p>
            </div>
          </div>

          <!-- REQUEST TYPE -->
          <div class="form-group">
            <label class="form-label">
              Request Type <span class="required">*</span>
            </label>

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

                  <span class="request-type-content">
                    <strong>{{ type.label }}</strong>

                    <small>
                      @switch (type.value) {
                        @case ('Hardware') {
                          Request equipment or hardware.
                        }
                        @case ('SiteMaterial') {
                          Request materials for project sites.
                        }
                        @case ('ITSupport') {
                          Request technical assistance.
                        }
                        @case ('BugReport') {
                          Report an application issue.
                        }
                      }
                    </small>
                  </span>
                </label>
              }
            </div>
          </div>

          <div class="form-grid mt-4">
            <!-- SUBJECT -->
            <div class="form-group full-width">
              <label for="subject" class="form-label">
                Subject <span class="required">*</span>
              </label>

              <input
                id="subject"
                type="text"
                formControlName="subject"
                class="form-control"
                placeholder="Enter request subject"
                maxlength="150"
              />

              @if (
                form.get('subject')?.touched &&
                form.get('subject')?.hasError('required')
              ) {
                <small class="error-message"> Subject is required. </small>
              }
            </div>

            <!-- DESCRIPTION -->
            <div class="form-group full-width">
              <label for="description" class="form-label">
                Description <span class="required">*</span>
              </label>

              <textarea
                id="description"
                formControlName="description"
                rows="3"
                maxlength="2000"
                placeholder="Describe your request..."
                pTextarea
                [autoResize]="true"
              ></textarea>

              @if (
                form.get('description')?.touched &&
                form.get('description')?.hasError('required')
              ) {
                <small class="error-message"> Description is required. </small>
              }
            </div>

            <!-- PRIORITY -->
            <div class="form-group">
              <label for="priority" class="form-label">
                Priority <span class="required">*</span>
              </label>

              <p-select
                inputId="priority"
                formControlName="priority"
                [options]="priorities"
                optionLabel="label"
                optionValue="value"
                placeholder="Select priority"
                [showClear]="false"
                styleClass="w-full"
              ></p-select>
            </div>

            <!-- NEEDED BY -->
            <div class="form-group">
              <label for="neededBy" class="form-label"> Needed By </label>

              <p-datepicker
                inputId="neededBy"
                formControlName="neededBy"
                dateFormat="dd/mm/yy"
                [showIcon]="true"
                [showButtonBar]="true"
                placeholder="Select required date"
                styleClass="w-full"
                [minDate]="null"
              ></p-datepicker>
            </div>
          </div>
        </section>

        <!-- PROJECT / SITE INFORMATION -->
        @if (isSiteMaterial) {
          <section class="form-section">
            <div class="section-header">
              <div>
                <h3>Project / Site Information</h3>
                <p>
                  Provide the project and location where the materials are
                  required.
                </p>
              </div>
            </div>

            <div class="form-grid">
              <!-- PROJECT -->
              <div class="form-group">
                <label for="projectId" class="form-label">
                  Project <span class="required">*</span>
                </label>

                <p-select
                  inputId="projectId"
                  formControlName="projectId"
                  [options]="projectOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select project"
                  [filter]="true"
                  filterBy="label"
                  [loading]="loadingProjects"
                  (onChange)="onProjectSelectionChange($event)"
                  styleClass="w-full"
                ></p-select>

                @if (
                  form.get('projectId')?.touched &&
                  form.get('projectId')?.hasError('required')
                ) {
                  <small class="error-message"> Project is required. </small>
                }
              </div>

              <!-- PROJECT NAME -->
              @if (isOtherProject) {
                <div class="form-group">
                  <label for="projectName" class="form-label">
                    Project Name <span class="required">*</span>
                  </label>

                  <input
                    id="projectName"
                    type="text"
                    formControlName="projectName"
                    class="form-control"
                    placeholder="Enter project name"
                  />

                  @if (
                    form.get('projectName')?.touched &&
                    form.get('projectName')?.hasError('required')
                  ) {
                    <small class="error-message">
                      Project name is required.
                    </small>
                  }
                </div>
              }

              <!-- SITE NAME -->
              <div class="form-group">
                <label for="siteName" class="form-label">
                  Site Name <span class="required">*</span>
                </label>

                <input
                  id="siteName"
                  type="text"
                  formControlName="siteName"
                  class="form-control"
                  placeholder="Enter site name"
                />

                @if (
                  form.get('siteName')?.touched &&
                  form.get('siteName')?.hasError('required')
                ) {
                  <small class="error-message"> Site name is required. </small>
                }
              </div>

              <!-- LOCATION -->
              <div class="form-group">
                <label for="location" class="form-label">
                  Location <span class="required">*</span>
                </label>

                <input
                  id="location"
                  type="text"
                  formControlName="location"
                  class="form-control"
                  placeholder="e.g. Server Room, Level 2"
                />

                @if (
                  form.get('location')?.touched &&
                  form.get('location')?.hasError('required')
                ) {
                  <small class="error-message"> Location is required. </small>
                }
              </div>

              <!-- LOCATION DETAILS -->
              <div class="form-group full-width">
                <label for="locationDetails" class="form-label">
                  Additional Location Details
                </label>

                <textarea
                  id="locationDetails"
                  formControlName="locationDetails"
                  class="form-control"
                  rows="2"
                  placeholder="Provide additional directions or details..."
                ></textarea>
              </div>
            </div>
          </section>
        }

        <!-- REQUESTED ITEMS -->
        @if (showItems) {
          <section class="form-section">
            <div class="section-header">
              <div>
                <h3 class="text-lg">Requested Items</h3>
                <p>
                  Add inventory items or manually enter items that are not
                  listed.
                </p>
              </div>

              <div class="item-summary">
                <span>{{ items.length }} Items</span>
                <span>{{ totalRequestedQuantity }} Total Qty</span>
              </div>
            </div>

            <!-- ITEM EDITOR -->
            <div class="item-editor">
              <div class="item-editor-header">
                <h4>
                  {{ editingItemIndex !== null ? 'Edit Item' : 'Add Item' }}
                </h4>

                <span class="optional-label">
                  Select inventory or enter manually
                </span>
              </div>

              <div [formGroup]="itemDraft">
                <div class="form-grid">
                  <!-- INVENTORY -->
                  <div class="form-group full-width">
                    <label for="inventoryId" class="form-label">
                      Inventory Item
                    </label>

                    <p-select
                      inputId="inventoryId"
                      formControlName="inventoryId"
                      [options]="inventoryItems"
                      optionLabel="itemName"
                      optionValue="id"
                      placeholder="Select inventory item (optional)"
                      [filter]="true"
                      filterBy="itemName,itemCode"
                      [showClear]="true"
                      [loading]="loadingInventory"
                      (onChange)="onInventorySelected($event)"
                      styleClass="w-full"
                    >
                      <ng-template #selectedItem let-selected>
                        @if (selected) {
                          <div class="inventory-option">
                            <span>{{ selected.itemName }}</span>
                            @if (selected.itemCode) {
                              <small>{{ selected.itemCode }}</small>
                            }
                          </div>
                        }
                      </ng-template>

                      <ng-template #item let-item>
                        <div class="inventory-option">
                          <span>{{ item.itemName }}</span>
                          @if (item.itemCode) {
                            <small>{{ item.itemCode }}</small>
                          }
                        </div>
                      </ng-template>
                    </p-select>

                    <small class="field-hint">
                      Leave empty if the item is not available in inventory.
                    </small>
                  </div>

                  <!-- ITEM NAME -->
                  <div class="form-group">
                    <label for="itemName" class="form-label">
                      Item Name <span class="required">*</span>
                    </label>

                    <input
                      id="itemName"
                      type="text"
                      formControlName="itemName"
                      class="form-control"
                      placeholder="Enter item name"
                    />

                    @if (
                      itemDraft.get('itemName')?.touched &&
                      itemDraft.get('itemName')?.hasError('required')
                    ) {
                      <small class="error-message">
                        Item name is required.
                      </small>
                    }
                  </div>

                  <!-- ITEM CODE -->
                  <div class="form-group">
                    <label for="itemCode" class="form-label"> Item Code </label>

                    <input
                      id="itemCode"
                      type="text"
                      formControlName="itemCode"
                      class="form-control"
                      placeholder="Enter item code"
                    />
                  </div>

                  <!-- DESCRIPTION -->
                  <div class="form-group full-width">
                    <label for="itemDescription" class="form-label">
                      Item Description
                    </label>

                    <textarea
                      id="itemDescription"
                      formControlName="description"
                      rows="2"
                      pTextarea
                      [autoResize]="true"
                      placeholder="Enter item specifications or description..."
                    ></textarea>
                  </div>

                  <!-- QUANTITY -->
                  <div class="form-group">
                    <label for="requestedQuantity" class="form-label">
                      Quantity <span class="required">*</span>
                    </label>

                    <input
                      id="requestedQuantity"
                      type="number"
                      formControlName="requestedQuantity"
                      class="form-control"
                      min="0.01"
                      step="0.01"
                      placeholder="Enter quantity"
                    />

                    @if (
                      itemDraft.get('requestedQuantity')?.touched &&
                      itemDraft.get('requestedQuantity')?.invalid
                    ) {
                      <small class="error-message">
                        Enter a quantity greater than zero.
                      </small>
                    }
                  </div>

                  <!-- UNIT -->
                  <div class="form-group">
                    <label for="unit" class="form-label"> Unit </label>

                    <p-select
                      formControlName="unit"
                      [options]="unitOptions"
                      placeholder="Select Unit"
                      appendTo="body"
                      styleClass="w-full"
                    />
                  </div>

                  <!-- REMARKS -->
                  <div class="form-group full-width">
                    <label for="itemRemarks" class="form-label">
                      Remarks
                    </label>

                    <textarea
                      id="itemRemarks"
                      formControlName="remarks"
                      rows="3"
                      pTextarea
                      [autoResize]="true"
                      placeholder="Additional remarks..."
                    ></textarea>
                  </div>
                </div>

                <!-- ITEM EDITOR ACTIONS -->
                <div class="item-editor-actions">
                  @if (editingItemIndex !== null) {
                    <button
                      type="button"
                      class="btn-secondary"
                      (click)="cancelEditItem()"
                    >
                      Cancel Edit
                    </button>
                  }

                  <button
                    type="button"
                    class="btn-save-item"
                    (click)="saveItem()"
                  >
                    <i
                      class="pi"
                      [class.pi-plus]="editingItemIndex === null"
                      [class.pi-check]="editingItemIndex !== null"
                    ></i>

                    {{ editingItemIndex === null ? 'Add Item' : 'Update Item' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- SAVED ITEMS -->
            <div class="saved-items-section">
              <div class="saved-items-header">
                <h4>Added Items</h4>

                <span class="item-count"> {{ items.length }} item(s) </span>
              </div>

              @if (items.length > 0) {
                <div class="saved-items-list" formArrayName="items">
                  @for (item of items.controls; track $index; let i = $index) {
                    <div class="saved-item-card" [formGroupName]="i">
                      <div class="saved-item-main">
                        <div class="saved-item-icon">
                          <i class="pi pi-box"></i>
                        </div>

                        <div class="saved-item-info">
                          <div class="saved-item-title">
                            <strong>{{ item.get('itemName')?.value }}</strong>

                            @if (item.get('inventoryId')?.value) {
                              <span class="inventory-badge">
                                <i class="pi pi-database"></i>
                                Inventory
                              </span>
                            } @else {
                              <span class="manual-badge"> Manual </span>
                            }
                          </div>

                          <div class="saved-item-meta">
                            @if (item.get('itemCode')?.value) {
                              <span>
                                Code: {{ item.get('itemCode')?.value }}
                              </span>
                            }

                            <span>
                              Qty:
                              {{ item.get('requestedQuantity')?.value }}
                              {{ item.get('unit')?.value }}
                            </span>
                          </div>

                          @if (item.get('description')?.value) {
                            <p class="saved-item-description">
                              {{ item.get('description')?.value }}
                            </p>
                          }

                          @if (item.get('remarks')?.value) {
                            <p class="saved-item-remarks">
                              Remarks: {{ item.get('remarks')?.value }}
                            </p>
                          }
                        </div>
                      </div>

                      <div class="saved-item-actions">
                        <button
                          type="button"
                          class="btn-icon btn-edit"
                          title="Edit item"
                          (click)="editItem(i)"
                        >
                          <i class="pi pi-pencil"></i>
                        </button>

                        <button
                          type="button"
                          class="btn-icon btn-delete"
                          title="Remove item"
                          (click)="removeItem(i)"
                        >
                          <i class="pi pi-trash"></i>
                        </button>
                      </div>
                    </div>
                  }
                </div>

                <!-- ITEM TOTAL -->
                <div class="items-total">
                  <div>
                    <span>Total Items</span>
                    <strong>{{ items.length }}</strong>
                  </div>

                  <div>
                    <span>Inventory Items</span>
                    <strong>{{ inventoryItemCount }}</strong>
                  </div>

                  <div>
                    <span>Manual Items</span>
                    <strong>{{ manualItemCount }}</strong>
                  </div>

                  <div>
                    <span>Total Quantity</span>
                    <strong>{{ totalRequestedQuantity }}</strong>
                  </div>
                </div>
              } @else {
                <div class="empty-items">
                  <i class="pi pi-inbox"></i>
                  <strong>No items added yet</strong>
                  <p>Add at least one item to continue.</p>
                </div>
              }
            </div>
          </section>
        }

        <!-- IT SUPPORT -->
        @if (isITSupport) {
          <section class="form-section">
            <div class="section-header">
              <div>
                <h3>IT Support Details</h3>
                <p>
                  Provide details to help the IT team understand your issue.
                </p>
              </div>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label for="affectedModule" class="form-label">
                  Affected System / Module <span class="required">*</span>
                </label>

                <input
                  id="affectedModule"
                  type="text"
                  formControlName="affectedModule"
                  class="form-control"
                  placeholder="e.g. Computer, Network, Printer, Email"
                />

                @if (
                  form.get('affectedModule')?.touched &&
                  form.get('affectedModule')?.hasError('required')
                ) {
                  <small class="error-message">
                    Affected system or module is required.
                  </small>
                }
              </div>

              <div class="form-group full-width">
                <label class="form-label"> Additional Information </label>

                <div class="info-note">
                  <i class="pi pi-info-circle"></i>
                  <span>
                    Include any error messages, device names or troubleshooting
                    steps already performed in the description above.
                  </span>
                </div>
              </div>
            </div>
          </section>
        }

        <!-- BUG REPORT -->
        @if (isBugReport) {
          <section class="form-section">
            <div class="section-header">
              <div>
                <h3>Bug Report Details</h3>
                <p>
                  Provide information to help the development team reproduce the
                  issue.
                </p>
              </div>
            </div>

            <div class="form-grid">
              <!-- AFFECTED MODULE -->
              <div class="form-group">
                <label for="bugAffectedModule" class="form-label">
                  Affected System / Module <span class="required">*</span>
                </label>

                <input
                  id="bugAffectedModule"
                  type="text"
                  formControlName="affectedModule"
                  class="form-control"
                  placeholder="e.g. YLWorks - Leave Module"
                />

                @if (
                  form.get('affectedModule')?.touched &&
                  form.get('affectedModule')?.hasError('required')
                ) {
                  <small class="error-message">
                    Affected module is required.
                  </small>
                }
              </div>

              <!-- BUG CATEGORY -->
              <div class="form-group">
                <label for="bugCategory" class="form-label">
                  Bug Category <span class="required">*</span>
                </label>

                <p-select
                  inputId="bugCategory"
                  formControlName="bugCategory"
                  [options]="bugCategories"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select bug category"
                  styleClass="w-full"
                ></p-select>

                @if (
                  form.get('bugCategory')?.touched &&
                  form.get('bugCategory')?.hasError('required')
                ) {
                  <small class="error-message">
                    Bug category is required.
                  </small>
                }
              </div>

              <!-- STEPS TO REPRODUCE -->
              <div class="form-group full-width">
                <label for="stepsToReproduce" class="form-label">
                  Steps to Reproduce <span class="required">*</span>
                </label>

                <textarea
                  id="stepsToReproduce"
                  formControlName="stepsToReproduce"
                  class="form-control"
                  rows="4"
                  placeholder="1. Go to...
2. Click...
3. Observe the issue..."
                ></textarea>

                @if (
                  form.get('stepsToReproduce')?.touched &&
                  form.get('stepsToReproduce')?.hasError('required')
                ) {
                  <small class="error-message">
                    Steps to reproduce are required.
                  </small>
                }
              </div>

              <!-- EXPECTED RESULT -->
              <div class="form-group">
                <label for="expectedResult" class="form-label">
                  Expected Result
                </label>

                <textarea
                  id="expectedResult"
                  formControlName="expectedResult"
                  class="form-control"
                  rows="3"
                  placeholder="What should happen?"
                ></textarea>
              </div>

              <!-- ACTUAL RESULT -->
              <div class="form-group">
                <label for="actualResult" class="form-label">
                  Actual Result
                </label>

                <textarea
                  id="actualResult"
                  formControlName="actualResult"
                  class="form-control"
                  rows="3"
                  placeholder="What actually happened?"
                ></textarea>
              </div>
            </div>
          </section>
        }

        <!-- FORM ACTIONS -->
        <div class="form-actions">
          <button
            type="button"
            class="btn-secondary"
            [disabled]="loading"
            (click)="resetForm()"
          >
            <i class="pi pi-refresh"></i>
            Reset Form
          </button>

          <button type="submit" class="btn-primary" [disabled]="loading">
            @if (loading) {
              <i class="pi pi-spin pi-spinner"></i>
              Submitting...
            } @else {
              <i class="pi pi-send"></i>
              Submit Request
            }
          </button>
        </div>
      </form>
    </div>
  `,
  styleUrl: './request-form.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestForm implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  private messageService = inject(MessageService);
  private hardwareRequestService = inject(HardwareRequestService);
  private inventoryService = inject(InventoryService);
  private projectService = inject(ProjectService);

  private routeSubscription?: Subscription;

  loading = false;
  loadingInventory = false;
  loadingProjects = false;

  inventoryItems: InventoryDropdownItem[] = [];
  projects: any[] = [];

  editingItemIndex: number | null = null;

  requestTypes = [
    { label: 'Hardware Request', value: 'Hardware' },
    { label: 'Site Material', value: 'SiteMaterial' },
    { label: 'IT Support', value: 'ITSupport' },
    { label: 'Bug Report', value: 'BugReport' },
  ];

  unitOptions = [
    { label: 'Pcs', value: 'Pcs' },
    { label: 'Box', value: 'Box' },
    { label: 'Set', value: 'Set' },
    { label: 'Pair', value: 'Pair' },
    { label: 'Unit', value: 'Unit' },
    { label: 'Meter', value: 'Meter' },
    { label: 'Length', value: 'Length' },
  ];

  priorities = [
    { label: 'Low', value: 'Low' },
    { label: 'Normal', value: 'Normal' },
    { label: 'High', value: 'High' },
    { label: 'Urgent', value: 'Urgent' },
  ];

  bugCategories = [
    { label: 'UI / Display Issue', value: 'UI' },
    { label: 'Functionality Issue', value: 'Functionality' },
    { label: 'Performance Issue', value: 'Performance' },
    { label: 'Login / Access Issue', value: 'Access' },
    { label: 'Data Issue', value: 'Data' },
    { label: 'Other', value: 'Other' },
  ];

  projectOptions: any[] = [];

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

  itemDraft = this.createItemForm();

  ngOnInit(): void {
    this.loadInventoryItems();
    this.loadProjects();

    this.routeSubscription = this.route.queryParams.subscribe((params) => {
      const type = params['type'];
      const projectId = params['projectId'];

      if (type && this.isValidRequestType(type)) {
        this.form.patchValue({
          requestType: type,
        });
      }

      if (projectId) {
        this.form.patchValue({
          projectId,
        });

        this.applyRouteProject(projectId);
      }

      this.updateConditionalValidators();
    });

    this.updateConditionalValidators();
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
  }

  // ---------------------------------------------------------
  // GETTERS
  // ---------------------------------------------------------

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
      this.form.get('projectId')?.value === 'OTHER' ||
      this.form.get('projectId')?.value === null
    );
  }

  get inventoryItemCount(): number {
    return this.items.controls.filter(
      (item) => !!item.get('inventoryId')?.value,
    ).length;
  }

  get manualItemCount(): number {
    return this.items.controls.filter((item) => !item.get('inventoryId')?.value)
      .length;
  }

  get totalRequestedQuantity(): number {
    return this.items.controls.reduce((total, item) => {
      return total + Number(item.get('requestedQuantity')?.value || 0);
    }, 0);
  }

  // ---------------------------------------------------------
  // REQUEST TYPE
  // ---------------------------------------------------------

  isValidRequestType(type: string): type is HardwareRequestType {
    return ['Hardware', 'SiteMaterial', 'ITSupport', 'BugReport'].includes(
      type,
    );
  }

  onRequestTypeChange(): void {
    this.updateConditionalValidators();
  }

  updateConditionalValidators(): void {
    const projectId = this.form.get('projectId');
    const projectName = this.form.get('projectName');
    const siteName = this.form.get('siteName');
    const location = this.form.get('location');

    const affectedModule = this.form.get('affectedModule');
    const bugCategory = this.form.get('bugCategory');
    const stepsToReproduce = this.form.get('stepsToReproduce');

    [
      projectId,
      projectName,
      siteName,
      location,
      affectedModule,
      bugCategory,
      stepsToReproduce,
    ].forEach((control) => {
      control?.clearValidators();
    });

    if (this.isSiteMaterial) {
      projectId?.setValidators([Validators.required]);
      projectName?.setValidators([Validators.required]);
      siteName?.setValidators([Validators.required]);
      location?.setValidators([Validators.required]);
    }

    if (this.isITSupport) {
      affectedModule?.setValidators([Validators.required]);
    }

    if (this.isBugReport) {
      affectedModule?.setValidators([Validators.required]);
      bugCategory?.setValidators([Validators.required]);
      stepsToReproduce?.setValidators([Validators.required]);
    }

    [
      projectId,
      projectName,
      siteName,
      location,
      affectedModule,
      bugCategory,
      stepsToReproduce,
    ].forEach((control) => {
      control?.updateValueAndValidity();
    });
  }

  // ---------------------------------------------------------
  // ITEM FORM
  // ---------------------------------------------------------

  createItemForm(): FormGroup {
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

  resetItemDraft(): void {
    this.itemDraft.reset({
      inventoryId: '',
      itemName: '',
      itemCode: '',
      description: '',
      unit: 'Unit',
      requestedQuantity: 1,
      remarks: '',
    });

    this.itemDraft.get('itemName')?.enable();
    this.itemDraft.get('itemCode')?.enable();

    this.editingItemIndex = null;
  }

  saveItem(): void {
    if (this.itemDraft.invalid) {
      this.itemDraft.markAllAsTouched();

      this.messageService.add({
        severity: 'warn',
        summary: 'Incomplete Item',
        detail: 'Please complete the required item information.',
      });

      return;
    }

    const item = this.itemDraft.getRawValue();

    if (this.editingItemIndex !== null) {
      this.items.at(this.editingItemIndex).patchValue(item);

      this.messageService.add({
        severity: 'success',
        summary: 'Item Updated',
        detail: 'Requested item has been updated.',
      });
    } else {
      this.items.push(
        this.fb.group({
          inventoryId: [item.inventoryId],
          itemName: [item.itemName, Validators.required],
          itemCode: [item.itemCode],
          description: [item.description],
          unit: [item.unit],
          requestedQuantity: [
            item.requestedQuantity,
            [Validators.required, Validators.min(0.01)],
          ],
          remarks: [item.remarks],
        }),
      );

      this.messageService.add({
        severity: 'success',
        summary: 'Item Added',
        detail: 'Item has been added to your request.',
      });
    }

    this.resetItemDraft();

    // Scroll to the top after saving an item.
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  editItem(index: number): void {
    const item = this.items.at(index);
    const value = item.getRawValue();

    this.itemDraft.patchValue(value);

    if (value.inventoryId) {
      this.itemDraft.get('itemName')?.disable();
      this.itemDraft.get('itemCode')?.disable();
    } else {
      this.itemDraft.get('itemName')?.enable();
      this.itemDraft.get('itemCode')?.enable();
    }

    this.editingItemIndex = index;

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  cancelEditItem(): void {
    this.resetItemDraft();
  }

  removeItem(index: number): void {
    this.items.removeAt(index);

    if (this.editingItemIndex === index) {
      this.resetItemDraft();
    } else if (
      this.editingItemIndex !== null &&
      this.editingItemIndex > index
    ) {
      this.editingItemIndex--;
    }
  }

  // ---------------------------------------------------------
  // INVENTORY
  // ---------------------------------------------------------

  loadInventoryItems(): void {
    this.loadingInventory = true;

    this.inventoryService.GetRequestItems().subscribe({
      next: (response: any) => {
        this.inventoryItems = response?.data ?? response ?? [];
        this.loadingInventory = false;
      },
      error: () => {
        this.loadingInventory = false;

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Unable to load inventory items.',
        });
      },
    });
  }

  onInventorySelected(event: any): void {
    const inventoryId = event?.value ?? event;

    if (!inventoryId) {
      this.itemDraft.patchValue({
        inventoryId: '',
        itemName: '',
        itemCode: '',
        description: '',
        unit: 'Unit',
      });

      this.itemDraft.get('itemName')?.enable();
      this.itemDraft.get('itemCode')?.enable();

      return;
    }

    const selected = this.inventoryItems.find(
      (item: any) => String(item.id) === String(inventoryId),
    );

    if (!selected) {
      return;
    }

    this.itemDraft.patchValue({
      inventoryId: selected.id,
      itemName: selected.itemName,
      itemCode: selected.itemCode,
      unit: selected.unit ?? 'Unit',
    });

    this.itemDraft.get('itemName')?.disable();
    this.itemDraft.get('itemCode')?.disable();
  }

  // ---------------------------------------------------------
  // PROJECTS
  // ---------------------------------------------------------

  loadProjects(): void {
    this.loadingProjects = true;

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
        next: (response: any) => {
          const data = response?.data ?? response ?? [];

          this.projects = data;

          this.projectOptions = [
            ...data.map((project: any) => ({
              label: project.projectTitle,
              value: project.id,
            })),
            {
              label: 'Other / Not Listed',
              value: 'OTHER',
            },
          ];

          this.loadingProjects = false;
        },
        error: () => {
          this.loadingProjects = false;

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Unable to load projects.',
          });
        },
      });
  }

  applyRouteProject(projectId: string): void {
    const project = this.projects.find(
      (item: any) => String(item.id) === String(projectId),
    );

    if (!project) {
      return;
    }

    this.form.patchValue({
      projectId: project.id,
      projectName: project.projectTitle,
    });
  }

  onProjectSelectionChange(event: any): void {
    const projectId = event?.value ?? event;

    if (!projectId || projectId === 'OTHER') {
      this.form.patchValue({
        projectName: '',
      });

      return;
    }

    const project = this.projects.find(
      (item: any) => String(item.id) === String(projectId),
    );

    if (!project) {
      return;
    }

    this.form.patchValue({
      projectName: project.projectTitle,
    });
  }

  // ---------------------------------------------------------
  // SUBMIT REQUEST
  // ---------------------------------------------------------

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

    if (this.showItems && this.items.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Items Added',
        detail: 'Please add at least one requested item.',
      });

      return;
    }

    if (this.itemDraft.dirty) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Unsaved Item',
        detail: 'Please save or cancel the item you are currently editing.',
      });

      return;
    }

    const value = this.form.getRawValue();

    const request: CreateHardwareRequest = {
      requestType: value.requestType!,
      subject: value.subject!,
      description: value.description!,
      priority: value.priority!,

      projectId:
        value.projectId && value.projectId !== 'OTHER' ? value.projectId : null,

      projectName: value.projectName || '',
      siteName: value.siteName || '',
      location: value.location || '',
      locationDetails: value.locationDetails || '',

      neededBy: value.neededBy ? this.formatLocalDate(value.neededBy) : null,

      affectedModule: value.affectedModule || '',
      bugCategory: value.bugCategory || '',
      stepsToReproduce: value.stepsToReproduce || '',
      expectedResult: value.expectedResult || '',
      actualResult: value.actualResult || '',

      items: this.items.controls.map((control: any) => {
        const item = control.getRawValue();

        return {
          inventoryId: item.inventoryId || null,
          itemName: item.itemName,
          itemCode: item.itemCode || '',
          description: item.description || '',
          unit: item.unit || 'Unit',
          requestedQuantity: Number(item.requestedQuantity),
          remarks: item.remarks || '',
        };
      }),
    };

    this.loading = true;

    this.hardwareRequestService.Create(request).subscribe({
      next: () => {
        this.loading = false;

        this.messageService.add({
          severity: 'success',
          summary: 'Request Submitted',
          detail: 'Your request has been submitted successfully.',
        });

        this.resetForm();

        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
      },
      error: (error: any) => {
        this.loading = false;

        this.messageService.add({
          severity: 'error',
          summary: 'Submission Failed',
          detail:
            error?.error?.message ??
            'Unable to submit your request. Please try again.',
        });
      },
    });
  }

  // ---------------------------------------------------------
  // DATE
  // ---------------------------------------------------------

  formatLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  // ---------------------------------------------------------
  // RESET
  // ---------------------------------------------------------

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
    this.resetItemDraft();
    this.updateConditionalValidators();
  }

  // ---------------------------------------------------------
  // NAVIGATION
  // ---------------------------------------------------------

  goToMyRequests(): void {
    this.router.navigate(['/hardware-request/my-requests']);
  }

  goBack(): void {
    this.router.navigate(['/hardware-request']);
  }
}
