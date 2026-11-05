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

import {
  HardwareRequestType,
  HardwareRequestPriority,
  CreateHardwareRequest,
  HardwareRequestDto,
} from '../../../models/HardwareRequest';

import { HardwareRequestService } from '../../../services/HardwareRequestService';
import { InventoryService } from '../../../services/InventoryService';
import { InventoryDropdownItem } from '../../../models/Inventory';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';

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
            Submit equipment requests, site material requests or technical
            support tickets.
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
                  >
                  </p-select>
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
                    <label>Project Name</label>

                    <input
                      type="text"
                      formControlName="projectName"
                      placeholder="Enter project name"
                    />
                  </div>

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
                            [showClear]="form.get('inventoryId')?.value"
                            [filter]="true"
                            filterBy="itemName,itemCode"
                            appendTo="body"
                            styleClass="w-full"
                            (onChange)="onInventorySelected(i)"
                          >
                            <ng-template let-inventory pTemplate="item">
                              <div class="flex flex-col">
                                <span class="font-medium">{{
                                  inventory.itemName
                                }}</span>
                                @if (inventory.itemCode) {
                                  <small class="text-gray-500">{{
                                    inventory.itemCode
                                  }}</small>
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

                <!-- STICKY ADD BUTTON -->
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

                  @if (request.items?.length) {
                    <div class="request-items">
                      <strong>Items:</strong>

                      @for (item of request.items; track item.id) {
                        <div class="request-item-line">
                          <span>
                            {{ item.itemName }}
                          </span>

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

  loading = false;
  submitting = false;

  inventoryLoading = false;
  inventoryItems: InventoryDropdownItem[] = [];

  requests: HardwareRequestDto[] = [];

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
  ];

  priorities: HardwareRequestPriority[] = ['Low', 'Normal', 'High', 'Urgent'];

  // =====================================================
  // MAIN FORM
  // =====================================================

  form = this.fb.group({
    requestType: ['Hardware' as HardwareRequestType, Validators.required],

    subject: ['', [Validators.required, Validators.maxLength(150)]],

    description: ['', [Validators.required, Validators.maxLength(2000)]],

    priority: ['Normal' as HardwareRequestPriority, Validators.required],

    projectId: [''],
    projectName: [''],
    siteName: [''],

    location: [''],
    locationDetails: [''],

    neededBy: [''],

    items: this.fb.array([]),
  });

  // =====================================================
  // INITIALIZATION
  // =====================================================

  ngOnInit(): void {
    this.loadMyRequests();
    this.loadInventoryItems();

    if (this.showItems) {
      this.addItem();
    }
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

  get showItems(): boolean {
    return (
      this.requestType === 'Hardware' || this.requestType === 'SiteMaterial'
    );
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
    this.items.push(this.createItemForm());

    this.cdr.detectChanges();

    setTimeout(() => {
      const itemCards = document.querySelectorAll('.item-card');

      const lastItem = itemCards[itemCards.length - 1];

      lastItem?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 50);
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

    // User wants to enter a custom item
    if (!inventoryId) {
      itemGroup.patchValue({
        inventoryId: null,
      });

      // Allow manual editing
      this.cdr.markForCheck();
      return;
    }

    const selectedItem = this.inventoryItems.find((x) => x.id === inventoryId);

    if (!selectedItem) {
      return;
    }

    // Populate from existing inventory
    itemGroup.patchValue({
      itemName: selectedItem.itemName,
      itemCode: selectedItem.itemCode ?? '',
    });

    this.cdr.markForCheck();
  }

  // =====================================================
  // REQUEST TYPE CHANGE
  // =====================================================

  onRequestTypeChange(): void {
    if (this.isITSupport) {
      this.items.clear();
    } else if (this.items.length === 0) {
      this.addItem();
    }

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
        summary: 'Missing Items',
        detail: 'Please add at least one requested item.',
      });

      return;
    }

    this.submitting = true;

    const value = this.form.getRawValue();

    const request: CreateHardwareRequest = {
      requestType: value.requestType as HardwareRequestType,

      subject: value.subject!.trim(),

      description: value.description!.trim(),

      priority: value.priority as HardwareRequestPriority,

      projectId: value.projectId || null,

      projectName: value.projectName || null,

      siteName: value.siteName || null,

      location: value.location || null,

      locationDetails: value.locationDetails || null,

      neededBy: value.neededBy || null,

      items: this.showItems
        ? value.items.map((item: any) => ({
            inventoryId: item.inventoryId || null,

            itemName: item.itemName?.trim(),

            itemCode: item.itemCode?.trim() || null,

            description: item.description?.trim() || null,

            unit: item.unit?.trim() || null,

            requestedQuantity: Number(item.requestedQuantity),

            remarks: item.remarks?.trim() || null,
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

      neededBy: '',
    });

    this.items.clear();

    this.addItem();

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

      default:
        return type;
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
