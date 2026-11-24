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
  FormGroup,
} from '@angular/forms';

import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { ActivatedRoute } from '@angular/router';

import {
  HardwareRequestType,
  HardwareRequestPriority,
  CreateHardwareRequest,
  HardwareRequestDto,
} from '../../../../models/HardwareRequest';

import { HardwareRequestService } from '../../../../services/HardwareRequestService';
import { InventoryService } from '../../../../services/InventoryService';
import { InventoryDropdownItem } from '../../../../models/Inventory';
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
              <p>Provide the details required for your request.</p>
            </div>
            <span class="required-label">* Required fields</span>
          </div>

          <form [formGroup]="form" (ngSubmit)="submitRequest()">
            <!-- REQUEST INFORMATION -->
            <div class="form-section">
              <h4>Request Information</h4>

              <label class="field-label">Request Type <span>*</span></label>

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
                    <small class="error-text">Subject is required.</small>
                  }
                </div>

                <div class="form-field full-width">
                  <label>Description <span>*</span></label>
                  <textarea
                    formControlName="description"
                    rows="3"
                    placeholder="Describe your request..."
                  ></textarea>
                  @if (
                    form.get('description')?.touched &&
                    form.get('description')?.invalid
                  ) {
                    <small class="error-text">Description is required.</small>
                  }
                </div>

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
                    [minDate]="minNeededByDate"
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
                      [disabled]="projectsLoading"
                      appendTo="body"
                      styleClass="w-full py-1!"
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
                      placeholder="Enter location"
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
                    <p>Add items one at a time and save them to your list.</p>
                  </div>
                  <span class="item-count">{{ items.length }} saved</span>
                </div>

                <!-- ITEM SUMMARY -->
                <div class="item-summary">
                  <div>
                    <strong>{{ inventoryItemCount }}</strong>
                    <span>Inventory Items</span>
                  </div>
                  <div>
                    <strong>{{ manualItemCount }}</strong>
                    <span>Manual Items</span>
                  </div>
                  <div>
                    <strong>{{ totalRequestedQuantity }}</strong>
                    <span>Total Quantity</span>
                  </div>
                </div>

                <!-- ITEM EDITOR -->
                <div class="item-editor">
                  <div class="item-editor-heading">
                    <div>
                      <h5>
                        {{
                          editingItemIndex === null
                            ? 'Add an Item'
                            : 'Edit Item'
                        }}
                      </h5>
                      <p>
                        Select an inventory item or enter the details manually.
                      </p>
                    </div>

                    @if (editingItemIndex !== null) {
                      <span class="editing-label"
                        >Editing item {{ editingItemIndex + 1 }}</span
                      >
                    }
                  </div>

                  <form [formGroup]="itemDraft" (ngSubmit)="saveItem()">
                    <div class="form-grid">
                      <div class="form-field full-width">
                        <label>Inventory Item (Optional)</label>
                        <p-select
                          formControlName="inventoryId"
                          [options]="inventoryItems"
                          optionLabel="itemName"
                          optionValue="id"
                          placeholder="Search inventory or leave empty for manual entry"
                          [disabled]="inventoryLoading"
                          [showClear]="!!itemDraft.get('inventoryId')?.value"
                          [filter]="true"
                          filterBy="itemName,itemCode"
                          appendTo="body"
                          styleClass="w-full py-1!"
                          (onChange)="onInventorySelected()"
                        >
                          <ng-template let-inventory pTemplate="item">
                            <div class="flex flex-col">
                              <span class="font-medium">{{
                                inventory.itemName
                              }}</span>
                              <small class="text-gray-500">
                                {{ inventory.itemCode || 'No item code' }}
                              </small>
                            </div>
                          </ng-template>
                        </p-select>
                      </div>

                      <div class="form-field">
                        <label>Item Name <span>*</span></label>
                        <input
                          type="text"
                          formControlName="itemName"
                          placeholder="Enter item name"
                          [readonly]="!!itemDraft.get('inventoryId')?.value"
                        />
                        @if (
                          itemDraft.get('itemName')?.touched &&
                          itemDraft.get('itemName')?.invalid
                        ) {
                          <small class="error-text"
                            >Item name is required.</small
                          >
                        }
                      </div>

                      <div class="form-field">
                        <label>Item Code</label>
                        <input
                          type="text"
                          formControlName="itemCode"
                          placeholder="Item code"
                          [readonly]="!!itemDraft.get('inventoryId')?.value"
                        />
                      </div>

                      <div class="form-field">
                        <label>Quantity <span>*</span></label>
                        <input
                          type="number"
                          formControlName="requestedQuantity"
                          min="0.01"
                          step="0.01"
                        />
                        @if (
                          itemDraft.get('requestedQuantity')?.touched &&
                          itemDraft.get('requestedQuantity')?.invalid
                        ) {
                          <small class="error-text">
                            Quantity must be greater than zero.
                          </small>
                        }
                      </div>

                      <div class="form-field">
                        <label>Unit</label>
                        <p-select
                          formControlName="unit"
                          [options]="unitOptions"
                          placeholder="Select Unit"
                          appendTo="body"
                          styleClass="w-full py-1!"
                        />
                      </div>

                      <div class="form-field full-width">
                        <label>Description / Specification</label>
                        <input
                          type="text"
                          formControlName="description"
                          placeholder="Brand, model or specification"
                        />
                      </div>

                      <div class="form-field full-width">
                        <label>Remarks</label>
                        <input
                          type="text"
                          formControlName="remarks"
                          placeholder="Additional information"
                        />
                      </div>
                    </div>

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

                      <button type="submit" class="btn-save-item">
                        {{
                          editingItemIndex === null
                            ? 'Save Item'
                            : 'Update Item'
                        }}
                      </button>
                    </div>
                  </form>
                </div>

                <!-- SAVED ITEMS LIST -->
                <div class="saved-items-section">
                  <div class="saved-items-heading">
                    <div>
                      <h5>Added Items</h5>
                      <p>Your saved items for this request.</p>
                    </div>
                    <span class="item-count">{{ items.length }} item(s)</span>
                  </div>

                  @if (items.length === 0) {
                    <div class="items-empty-state">
                      <strong>No items added yet</strong>
                      <p>
                        Use the form above to add your first requested item.
                      </p>
                    </div>
                  } @else {
                    <div class="saved-item-list">
                      @for (
                        item of items.controls;
                        track $index;
                        let i = $index
                      ) {
                        <div
                          class="saved-item"
                          [class.saved-item-editing]="editingItemIndex === i"
                        >
                          <div class="saved-item-number">{{ i + 1 }}</div>

                          <div class="saved-item-info">
                            <div class="saved-item-title">
                              <strong>{{ item.get('itemName')?.value }}</strong>
                              @if (item.get('inventoryId')?.value) {
                                <span class="item-type inventory-type"
                                  >Inventory</span
                                >
                              } @else {
                                <span class="item-type manual-type"
                                  >Manual</span
                                >
                              }
                            </div>

                            <div class="saved-item-meta">
                              @if (item.get('itemCode')?.value) {
                                <span
                                  >Code: {{ item.get('itemCode')?.value }}</span
                                >
                              }
                              <span>
                                Qty: {{ item.get('requestedQuantity')?.value }}
                                {{ item.get('unit')?.value }}
                              </span>
                            </div>

                            @if (item.get('description')?.value) {
                              <p>{{ item.get('description')?.value }}</p>
                            }

                            @if (item.get('remarks')?.value) {
                              <small
                                >Remarks:
                                {{ item.get('remarks')?.value }}</small
                              >
                            }
                          </div>

                          <div class="saved-item-actions">
                            <button
                              type="button"
                              class="btn-edit-item"
                              (click)="editItem(i)"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              class="btn-remove"
                              (click)="removeItem(i)"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>
            }

            <!-- IT SUPPORT -->
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

            <!-- BUG REPORT -->
            @if (isBugReport) {
              <div class="form-section">
                <h4>Bug Report Details</h4>
                <p class="section-description">
                  Help us understand what went wrong so our development team can
                  investigate.
                </p>

                <div class="form-grid">
                  <div class="form-field">
                    <label>Module Affected <span>*</span></label>
                    <p-select
                      formControlName="affectedModule"
                      [options]="affectedModuleOptions"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Select Module"
                      [showClear]="!!form.get('affectedModule')?.value"
                      appendTo="body"
                      styleClass="w-full py-1!"
                    />
                    @if (
                      form.get('affectedModule')?.touched &&
                      form.get('affectedModule')?.invalid
                    ) {
                      <small class="error-text"
                        >Please select the affected module.</small
                      >
                    }
                  </div>

                  <div class="form-field">
                    <label>Issue Category <span>*</span></label>
                    <p-select
                      formControlName="bugCategory"
                      [options]="bugCategoryOptions"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Select Category"
                      [showClear]="!!form.get('bugCategory')?.value"
                      appendTo="body"
                      styleClass="w-full py-1!"
                    />
                    @if (
                      form.get('bugCategory')?.touched &&
                      form.get('bugCategory')?.invalid
                    ) {
                      <small class="error-text"
                        >Please select the issue category.</small
                      >
                    }
                  </div>

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
                      <small class="error-text"
                        >Please provide the steps to reproduce the issue.</small
                      >
                    }
                  </div>

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
                      <small class="error-text"
                        >Please describe the expected result.</small
                      >
                    }
                  </div>

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
                      <small class="error-text"
                        >Please describe the actual result.</small
                      >
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
                {{ submitting ? 'Submitting...' : 'Submit Request' }}
              </button>
            </div>
          </form>
        </section>

        <!-- MY REQUESTS -->
        <section class="requests-card">
          <div class="card-header">
            <div>
              <h3>My Requests</h3>
              <p>View and track your submitted requests.</p>
            </div>
            <button
              type="button"
              class="btn-refresh"
              (click)="loadMyRequests()"
              [disabled]="loading"
            >
              {{ loading ? 'Loading...' : 'Refresh' }}
            </button>
          </div>

          @if (!loading && requests.length > 0) {
            <div class="request-summary">
              <div>
                <strong>{{ requests.length }}</strong
                ><span>Total</span>
              </div>
              <div>
                <strong>{{ pendingRequestCount }}</strong
                ><span>Pending</span>
              </div>
              <div>
                <strong>{{ activeRequestCount }}</strong
                ><span>In Progress</span>
              </div>
              <div>
                <strong>{{ completedRequestCount }}</strong
                ><span>Completed</span>
              </div>
            </div>
          }

          @if (loading) {
            <div class="empty-state">Loading your requests...</div>
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
                    <div class="request-heading">
                      <span class="request-type-badge">
                        {{ getTypeLabel(request.requestType) }}
                      </span>
                      <span
                        class="status-badge"
                        [ngClass]="getStatusClass(request.status)"
                      >
                        {{ getStatusLabel(request.status) }}
                      </span>
                    </div>
                    <span class="request-date">
                      {{ request.createdAt | date: 'dd MMM yyyy' }}
                    </span>
                  </div>

                  <h4>{{ request.subject }}</h4>
                  <p class="request-description">{{ request.description }}</p>

                  <div class="request-meta">
                    <span
                      ><strong>Priority:</strong> {{ request.priority }}</span
                    >
                    @if (request.neededBy) {
                      <span>
                        <strong>Needed:</strong>
                        {{ request.neededBy | date: 'dd MMM yyyy' }}
                      </span>
                    }
                    @if (request.projectName || request.project?.projectTitle) {
                      <span>
                        <strong>Project:</strong>
                        {{
                          request.projectName || request.project?.projectTitle
                        }}
                      </span>
                    }
                    @if (request.siteName) {
                      <span><strong>Site:</strong> {{ request.siteName }}</span>
                    }
                  </div>

                  @if (request.items?.length) {
                    <div class="request-item-summary">
                      <strong
                        >{{ request.items.length }} Requested Item(s)</strong
                      >
                      <div class="request-item-preview">
                        @for (
                          item of request.items.slice(0, 3);
                          track item.id
                        ) {
                          <span>
                            {{ item.itemName }} × {{ item.requestedQuantity }}
                          </span>
                        }
                        @if (request.items.length > 3) {
                          <span class="more-items">
                            +{{ request.items.length - 3 }} more
                          </span>
                        }
                      </div>
                    </div>
                  }

                  <details class="request-details">
                    <summary>
                      <span>View Full Details</span>
                      <span class="details-arrow">⌄</span>
                    </summary>

                    <div class="request-details-content">
                      @if (request.requestType === 'SiteMaterial') {
                        <div class="detail-section">
                          <h5>Project / Site Information</h5>
                          <div class="detail-grid">
                            <div>
                              <small>Project</small>
                              <strong>
                                {{
                                  request.projectName ||
                                    request.project?.projectTitle ||
                                    '-'
                                }}
                              </strong>
                            </div>
                            <div>
                              <small>Site Name</small>
                              <strong>{{ request.siteName || '-' }}</strong>
                            </div>
                            <div>
                              <small>Location</small>
                              <strong>{{ request.location || '-' }}</strong>
                            </div>
                            <div>
                              <small>Location Details</small>
                              <strong>{{
                                request.locationDetails || '-'
                              }}</strong>
                            </div>
                          </div>
                        </div>
                      }

                      @if (request.items?.length) {
                        <div class="detail-section">
                          <h5>Requested Items</h5>
                          <div class="request-table-wrapper">
                            <table class="request-table">
                              <thead>
                                <tr>
                                  <th>Item</th>
                                  <th>Requested</th>
                                  <th>Approved</th>
                                  <th>Issued</th>
                                  <th>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                @for (item of request.items; track item.id) {
                                  <tr>
                                    <td>
                                      <strong>{{ item.itemName }}</strong>
                                      @if (item.itemCode) {
                                        <small>{{ item.itemCode }}</small>
                                      }
                                      @if (item.remarks) {
                                        <small>{{ item.remarks }}</small>
                                      }
                                    </td>
                                    <td>
                                      {{ item.requestedQuantity }}
                                      {{ item.unit || '' }}
                                    </td>
                                    <td>{{ item.approvedQuantity }}</td>
                                    <td>{{ item.issuedQuantity }}</td>
                                    <td>
                                      <span
                                        class="item-status"
                                        [ngClass]="getStatusClass(item.status)"
                                      >
                                        {{ item.status || '-' }}
                                      </span>
                                    </td>
                                  </tr>
                                }
                              </tbody>
                            </table>
                          </div>
                        </div>
                      }

                      @if (request.requestType === 'BugReport') {
                        <div class="detail-section">
                          <h5>Bug Report Details</h5>
                          <div class="detail-grid">
                            <div>
                              <small>Module</small>
                              <strong>{{
                                request.affectedModule || '-'
                              }}</strong>
                            </div>
                            <div>
                              <small>Category</small>
                              <strong>
                                {{
                                  request.bugCategory
                                    ? getBugCategoryLabel(request.bugCategory)
                                    : '-'
                                }}
                              </strong>
                            </div>
                          </div>

                          @if (request.stepsToReproduce) {
                            <div class="detail-text">
                              <small>Steps to Reproduce</small>
                              <p>{{ request.stepsToReproduce }}</p>
                            </div>
                          }
                          @if (request.expectedResult) {
                            <div class="detail-text">
                              <small>Expected Result</small>
                              <p>{{ request.expectedResult }}</p>
                            </div>
                          }
                          @if (request.actualResult) {
                            <div class="detail-text">
                              <small>Actual Result</small>
                              <p>{{ request.actualResult }}</p>
                            </div>
                          }
                        </div>
                      }

                      @if (request.assignedTo) {
                        <div class="detail-section">
                          <h5>Assignment</h5>
                          <p>
                            <strong>Assigned To:</strong>
                            {{ request.assignedTo }}
                          </p>
                        </div>
                      }

                      @if (request.adminRemarks) {
                        <div class="detail-note">
                          <strong>Admin Remarks</strong>
                          <p>{{ request.adminRemarks }}</p>
                        </div>
                      }

                      @if (request.rejectionReason) {
                        <div class="detail-note rejection">
                          <strong>Rejection Reason</strong>
                          <p>{{ request.rejectionReason }}</p>
                        </div>
                      }
                    </div>
                  </details>

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
  private projectIdFromRoute: string | null = null;

  loading = false;
  submitting = false;
  inventoryLoading = false;
  projectsLoading = false;

  inventoryItems: InventoryDropdownItem[] = [];
  requests: HardwareRequestDto[] = [];

  // Index of the item currently being edited.
  editingItemIndex: number | null = null;

  minNeededByDate = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate(),
  );

  projectSelection: {
    label: string;
    value: string;
    location: string;
  }[] = [];

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
    { label: 'UI / Display Issue', value: 'UI' },
    { label: 'Performance Issue', value: 'Performance' },
    { label: 'Validation Error', value: 'Validation' },
    { label: 'Incorrect Data', value: 'Data' },
    { label: 'Security / Permission Issue', value: 'Security' },
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
      description: 'Report errors or unexpected behaviour in OfficeHub.',
    },
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

  priorities: HardwareRequestPriority[] = ['Low', 'Normal', 'High', 'Urgent'];

  // Main request form. The items FormArray stores saved items only.
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

  // One reusable item editor instead of creating a full form for every item.
  itemDraft: FormGroup = this.createItemForm();

  // =====================================================
  // INITIALIZATION
  // =====================================================

  ngOnInit(): void {
    this.loadMyRequests();
    this.loadInventoryItems();
    this.loadProjects();

    this.route.queryParamMap.subscribe((params) => {
      const type = params.get('type');
      this.projectIdFromRoute = params.get('projectId');

      if (type && this.isValidRequestType(type)) {
        this.form.patchValue({ requestType: type });
        this.onRequestTypeChange();
      }

      this.applyRouteProject();
      this.cdr.markForCheck();
    });

    this.updateConditionalValidators();
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
  // ITEM SUMMARY
  // =====================================================

  get inventoryItemCount(): number {
    return this.items.controls.filter(
      (item) => !!item.get('inventoryId')?.value,
    ).length;
  }

  get manualItemCount(): number {
    return this.items.length - this.inventoryItemCount;
  }

  get totalRequestedQuantity(): number {
    return this.items.controls.reduce((total, item) => {
      return total + Number(item.get('requestedQuantity')?.value || 0);
    }, 0);
  }

  // =====================================================
  // REQUEST SUMMARY
  // =====================================================

  get pendingRequestCount(): number {
    return this.requests.filter((x) => x.status === 'Pending').length;
  }

  get activeRequestCount(): number {
    return this.requests.filter(
      (x) =>
        x.status === 'Approved' ||
        x.status === 'PartiallyIssued' ||
        x.status === 'InProgress',
    ).length;
  }

  get completedRequestCount(): number {
    return this.requests.filter(
      (x) => x.status === 'Issued' || x.status === 'Resolved',
    ).length;
  }

  // =====================================================
  // REQUEST TYPE
  // =====================================================

  private isValidRequestType(type: string): type is HardwareRequestType {
    return ['Hardware', 'SiteMaterial', 'ITSupport', 'BugReport'].includes(
      type,
    );
  }

  onRequestTypeChange(): void {
    if (!this.showItems) {
      this.items.clear();
      this.cancelEditItem();
      this.resetItemDraft();
    }

    this.updateConditionalValidators();

    this.cdr.markForCheck();
  }

  // =====================================================
  // ITEM EDITOR
  // =====================================================

  private createItemForm(): FormGroup {
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

  private resetItemDraft(): void {
    this.itemDraft.reset({
      inventoryId: '',
      itemName: '',
      itemCode: '',
      description: '',
      unit: 'Unit',
      requestedQuantity: 1,
      remarks: '',
    });

    this.itemDraft.markAsPristine();
    this.itemDraft.markAsUntouched();
    this.editingItemIndex = null;

    this.cdr.markForCheck();
  }

  saveItem(): void {
    if (!this.showItems) {
      return;
    }

    if (this.itemDraft.invalid) {
      this.itemDraft.markAllAsTouched();

      this.messageService.add({
        severity: 'warn',
        summary: 'Incomplete Item',
        detail: 'Please enter an item name and a valid quantity.',
      });

      return;
    }

    const value = this.itemDraft.getRawValue();

    const item = {
      inventoryId: value.inventoryId || null,
      itemName: String(value.itemName ?? '').trim(),
      itemCode: String(value.itemCode ?? '').trim(),
      description: String(value.description ?? '').trim(),
      unit: value.unit || 'Unit',
      requestedQuantity: Number(value.requestedQuantity),
      remarks: String(value.remarks ?? '').trim(),
    };

    if (
      !item.itemName ||
      !Number.isFinite(item.requestedQuantity) ||
      item.requestedQuantity <= 0
    ) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Invalid Item',
        detail: 'Please check the item name and quantity.',
      });
      return;
    }

    if (this.editingItemIndex !== null) {
      this.items.at(this.editingItemIndex).patchValue(item);

      this.messageService.add({
        severity: 'success',
        summary: 'Item Updated',
        detail: `${item.itemName} has been updated.`,
      });
    } else {
      this.items.push(this.fb.group(item));

      this.messageService.add({
        severity: 'success',
        summary: 'Item Saved',
        detail: `${item.itemName} has been added to the list.`,
      });
    }

    this.resetItemDraft();
    this.cdr.markForCheck();
  }

  editItem(index: number): void {
    const item = this.items.at(index);

    if (!item) {
      return;
    }

    this.itemDraft.patchValue(item.getRawValue());
    this.itemDraft.markAsPristine();
    this.itemDraft.markAsUntouched();

    this.editingItemIndex = index;

    this.cdr.markForCheck();
  }

  cancelEditItem(): void {
    this.resetItemDraft();
  }

  removeItem(index: number): void {
    if (index < 0 || index >= this.items.length) {
      return;
    }

    const removedItem = this.items.at(index);
    const removedName = removedItem.get('itemName')?.value || 'Item';

    this.items.removeAt(index);

    if (this.editingItemIndex === index) {
      this.resetItemDraft();
    } else if (
      this.editingItemIndex !== null &&
      this.editingItemIndex > index
    ) {
      this.editingItemIndex--;
    }

    this.messageService.add({
      severity: 'success',
      summary: 'Item Removed',
      detail: `${removedName} has been removed.`,
    });

    this.cdr.markForCheck();
  }

  // =====================================================
  // INVENTORY
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
        console.error('Failed to load inventory:', error);
        this.inventoryItems = [];
        this.inventoryLoading = false;

        this.messageService.add({
          severity: 'warn',
          summary: 'Inventory Unavailable',
          detail: 'You can still enter requested items manually.',
        });

        this.cdr.markForCheck();
      },
    });
  }

  onInventorySelected(): void {
    const inventoryId = this.itemDraft.get('inventoryId')?.value;

    if (!inventoryId) {
      this.itemDraft.patchValue({
        itemName: '',
        itemCode: '',
        unit: 'Unit',
      });

      this.itemDraft.get('itemName')?.updateValueAndValidity();
      this.cdr.markForCheck();
      return;
    }

    const selectedItem = this.inventoryItems.find(
      (item) => item.id === inventoryId,
    );

    if (!selectedItem) {
      this.itemDraft.patchValue({
        inventoryId: '',
        itemName: '',
        itemCode: '',
        unit: 'Unit',
      });

      this.messageService.add({
        severity: 'warn',
        summary: 'Inventory Item Unavailable',
        detail: 'Please select another inventory item.',
      });

      this.cdr.markForCheck();
      return;
    }

    this.itemDraft.patchValue({
      itemName: selectedItem.itemName,
      itemCode: selectedItem.itemCode ?? '',
      unit: selectedItem.unit || 'Unit',
    });

    this.itemDraft.get('itemName')?.updateValueAndValidity();
    this.cdr.markForCheck();
  }

  // =====================================================
  // PROJECTS
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
            location: project.location ?? '',
          }));

          this.projectSelection.push({
            label: 'Other (Enter Project Name)',
            value: this.OTHER_PROJECT_VALUE,
            location: '',
          });

          this.applyRouteProject();
          this.projectsLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Failed to load projects:', error);

          this.projectSelection = [
            {
              label: 'Other (Enter Project Name)',
              value: this.OTHER_PROJECT_VALUE,
              location: '',
            },
          ];

          this.projectsLoading = false;

          this.messageService.add({
            severity: 'warn',
            summary: 'Projects Unavailable',
            detail:
              'Unable to load projects. You can enter the project name manually.',
          });

          this.cdr.markForCheck();
        },
      });
  }

  private applyRouteProject(): void {
    if (
      !this.projectIdFromRoute ||
      !this.projectSelection.length ||
      !this.isSiteMaterial
    ) {
      return;
    }

    const project = this.projectSelection.find(
      (x) => x.value === this.projectIdFromRoute,
    );

    if (!project) {
      return;
    }

    this.form.patchValue({
      projectId: project.value,
      location: project.location || '',
    });

    this.onProjectSelectionChange();
  }

  onProjectSelectionChange(): void {
    const projectId = this.form.get('projectId')?.value;

    const selectedProject = this.projectSelection.find(
      (x) => x.value === projectId,
    );

    if (projectId === this.OTHER_PROJECT_VALUE) {
      this.form.get('location')?.setValue('', { emitEvent: false });
    } else {
      this.form
        .get('location')
        ?.setValue(selectedProject?.location || '', { emitEvent: false });
    }

    this.updateConditionalValidators();
    this.cdr.markForCheck();
  }

  // =====================================================
  // CONDITIONAL VALIDATORS
  // =====================================================

  private updateConditionalValidators(): void {
    const isBugReport = this.isBugReport;
    const isSiteMaterial = this.isSiteMaterial;

    const projectIdControl = this.form.get('projectId');
    const projectNameControl = this.form.get('projectName');

    const isOtherProject =
      isSiteMaterial && projectIdControl?.value === this.OTHER_PROJECT_VALUE;

    const affectedModuleControl = this.form.get('affectedModule');
    const bugCategoryControl = this.form.get('bugCategory');
    const stepsControl = this.form.get('stepsToReproduce');
    const expectedControl = this.form.get('expectedResult');
    const actualControl = this.form.get('actualResult');

    if (isBugReport) {
      affectedModuleControl?.setValidators([Validators.required]);
      bugCategoryControl?.setValidators([Validators.required]);
      stepsControl?.setValidators([
        Validators.required,
        Validators.maxLength(2000),
      ]);
      expectedControl?.setValidators([
        Validators.required,
        Validators.maxLength(1000),
      ]);
      actualControl?.setValidators([
        Validators.required,
        Validators.maxLength(1000),
      ]);
    } else {
      affectedModuleControl?.clearValidators();
      bugCategoryControl?.clearValidators();
      stepsControl?.clearValidators();
      expectedControl?.clearValidators();
      actualControl?.clearValidators();

      this.form.patchValue(
        {
          affectedModule: '',
          bugCategory: '',
          stepsToReproduce: '',
          expectedResult: '',
          actualResult: '',
        },
        { emitEvent: false },
      );

      [
        affectedModuleControl,
        bugCategoryControl,
        stepsControl,
        expectedControl,
        actualControl,
      ].forEach((control) => control?.markAsUntouched());
    }

    if (isSiteMaterial) {
      projectIdControl?.setValidators([Validators.required]);

      if (isOtherProject) {
        projectNameControl?.setValidators([
          Validators.required,
          Validators.maxLength(150),
        ]);
      } else {
        projectNameControl?.clearValidators();
        projectNameControl?.setValue('', { emitEvent: false });
        projectNameControl?.markAsUntouched();
      }
    } else {
      projectIdControl?.clearValidators();
      projectNameControl?.clearValidators();

      projectIdControl?.setValue('', { emitEvent: false });
      projectNameControl?.setValue('', { emitEvent: false });

      projectIdControl?.markAsUntouched();
      projectNameControl?.markAsUntouched();
    }

    [
      projectIdControl,
      projectNameControl,
      affectedModuleControl,
      bugCategoryControl,
      stepsControl,
      expectedControl,
      actualControl,
    ].forEach((control) => {
      control?.updateValueAndValidity({ emitEvent: false });
    });

    if (!isSiteMaterial) {
      this.form.patchValue(
        {
          siteName: '',
          location: '',
          locationDetails: '',
        },
        { emitEvent: false },
      );
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
    if (this.submitting) {
      return;
    }

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

    // Do not silently discard an unfinished item.
    if (this.showItems && this.itemDraft.dirty) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Unsaved Item',
        detail:
          'Please save or clear the item currently being entered before submitting.',
      });

      this.itemDraft.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

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
        detail: 'Please save at least one requested item before submitting.',
      });

      return;
    }

    const requestItems = (value.items ?? []) as Array<{
      inventoryId: string | null;
      itemName: string | null;
      itemCode: string | null;
      description: string | null;
      unit: string | null;
      requestedQuantity: number | null;
      remarks: string | null;
    }>;

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

      projectId:
        isSiteMaterial && !isOtherProject ? value.projectId || null : null,

      projectName: isOtherProject ? cleanText(value.projectName) || null : null,

      siteName: isSiteMaterial ? cleanText(value.siteName) || null : null,
      location: isSiteMaterial ? cleanText(value.location) || null : null,

      locationDetails: isSiteMaterial
        ? cleanText(value.locationDetails) || null
        : null,

      neededBy: this.formatLocalDate(value.neededBy),

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
        // Scroll to top after saving
        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        });

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
  // DATE
  // =====================================================

  private formatLocalDate(date: Date | null): string | null {
    if (!date) {
      return null;
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  // =====================================================
  // RESET
  // =====================================================

  resetForm(): void {
    const routeType = this.route.snapshot.queryParamMap.get('type');

    const defaultType: HardwareRequestType =
      routeType && this.isValidRequestType(routeType) ? routeType : 'Hardware';

    this.form.reset({
      requestType: defaultType,
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
    this.applyRouteProject();

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

  getStatusLabel(status: string): string {
    switch (status) {
      case 'PartiallyIssued':
        return 'Partially Issued';
      case 'InProgress':
        return 'In Progress';
      default:
        return status;
    }
  }

  getBugCategoryLabel(category: string): string {
    switch (category) {
      case 'Functional':
        return 'Feature Not Working';
      case 'UI':
        return 'UI / Display Issue';
      case 'Performance':
        return 'Performance Issue';
      case 'Validation':
        return 'Validation Error';
      case 'Data':
        return 'Incorrect Data';
      case 'Security':
        return 'Security / Permission Issue';
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
