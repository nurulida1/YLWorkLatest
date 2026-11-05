import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import {
  ApproveHardwareRequest,
  AssignHardwareRequest,
  HardwareRequestDto,
  HardwareRequestStatus,
  HardwareRequestType,
  IssueHardwareRequest,
  RejectHardwareRequest,
  UpdateHardwareRequestStatus,
} from '../../../models/HardwareRequest';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MessageService } from 'primeng/api';
import { HardwareRequestService } from '../../../services/HardwareRequestService';
import { UserService } from '../../../services/userService.service';
import { SelectModule } from 'primeng/select';

type RequestFilter =
  | 'All'
  | 'Pending'
  | 'Approved'
  | 'InProgress'
  | 'PartiallyIssued'
  | 'Issued'
  | 'Resolved'
  | 'Rejected'
  | 'Cancelled';

type RequestTypeFilter = 'All' | HardwareRequestType;

@Component({
  selector: 'app-incoming-hardware-request',
  imports: [CommonModule, ReactiveFormsModule, SelectModule],
  template: `
    <div class="incoming-page">
      <!-- PAGE HEADER -->
      <div class="page-header">
        <div>
          <h2>Incoming Requests</h2>
          <p>Review, approve and manage requests submitted by employees.</p>
        </div>

        <button
          type="button"
          class="btn-refresh"
          (click)="loadRequests()"
          [disabled]="loading"
        >
          <span class="refresh-icon">↻</span>
          Refresh
        </button>
      </div>

      <!-- STATISTICS -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon total-icon">▤</div>
          <div>
            <span class="stat-label">Total Requests</span>
            <h3>{{ totalRequests }}</h3>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon pending-icon">◷</div>
          <div>
            <span class="stat-label">Pending Approval</span>
            <h3>{{ pendingCount }}</h3>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon approved-icon">✓</div>
          <div>
            <span class="stat-label">Approved</span>
            <h3>{{ approvedCount }}</h3>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon progress-icon">⟳</div>
          <div>
            <span class="stat-label">In Progress</span>
            <h3>{{ inProgressCount }}</h3>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon completed-icon">✔</div>
          <div>
            <span class="stat-label">Completed</span>
            <h3>{{ completedCount }}</h3>
          </div>
        </div>
      </div>

      <!-- REQUEST LIST -->
      <div class="request-panel">
        <div class="panel-header">
          <div>
            <h3>Request Management</h3>
            <p>Review incoming requests from your department.</p>
          </div>

          <span class="result-count">
            {{ filteredRequests.length }} request(s)
          </span>
        </div>

        <!-- FILTERS -->
        <div class="filter-section">
          <div class="search-box">
            <span class="search-icon">⌕</span>
            <input
              type="text"
              placeholder="Search subject, requester, project or item..."
              [value]="searchText"
              (input)="onSearchChange($any($event.target).value)"
            />
          </div>

          <select
            [value]="selectedType"
            (change)="onTypeChange($any($event.target).value)"
          >
            @for (filter of typeFilters; track filter.value) {
              <option [value]="filter.value">
                {{ filter.label }}
              </option>
            }
          </select>

          <select
            [value]="selectedStatus"
            (change)="onStatusChange($any($event.target).value)"
          >
            @for (filter of statusFilters; track filter.value) {
              <option [value]="filter.value">
                {{ filter.label }}
              </option>
            }
          </select>

          <button type="button" class="btn-clear" (click)="clearFilters()">
            Clear
          </button>
        </div>

        <!-- LOADING -->
        @if (loading) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading incoming requests...</p>
          </div>
        }

        <!-- EMPTY STATE -->
        @else if (filteredRequests.length === 0) {
          <div class="empty-state">
            <div class="empty-icon">▤</div>
            <h3>No requests found</h3>
            <p class="mb-2">
              There are no requests matching your current filters.
            </p>

            <button type="button" class="btn-clear" (click)="clearFilters()">
              Clear Filters
            </button>
          </div>
        }

        <!-- REQUEST TABLE -->
        @else {
          <div class="table-wrapper">
            <table class="request-table">
              <thead>
                <tr>
                  <th>Request</th>
                  <th>Requester</th>
                  <th>Type</th>
                  <th>Priority</th>
                  <th>Items</th>
                  <th>Needed By</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                @for (request of filteredRequests; track request.id) {
                  <tr>
                    <td>
                      <div class="request-info">
                        <strong>{{ request.subject }}</strong>
                        <small>{{ request.id }}</small>
                        @if (request.projectName || request.siteName) {
                          <small>
                            {{ request.projectName || request.siteName }}
                          </small>
                        }
                      </div>
                    </td>

                    <td>
                      <span class="requester-name">
                        {{ request.requestedBy || 'Unknown' }}
                      </span>
                    </td>

                    <td>
                      <span class="type-badge">
                        {{ getRequestTypeLabel(request.requestType) }}
                      </span>
                    </td>

                    <td>
                      <span
                        class="priority-badge"
                        [ngClass]="getPriorityClass(request.priority)"
                      >
                        {{ request.priority }}
                      </span>
                    </td>

                    <td>
                      <span class="item-quantity">
                        {{ request.items.length || 0 }} item(s)
                      </span>
                    </td>

                    <td>
                      <span class="date-text">
                        {{
                          request.neededBy
                            ? (request.neededBy | date: 'dd MMM yyyy')
                            : '-'
                        }}
                      </span>
                    </td>

                    <td>
                      <span
                        class="status-badge"
                        [ngClass]="getStatusClass(request.status)"
                      >
                        {{
                          request.status === 'InProgress'
                            ? 'In Progress'
                            : request.status === 'PartiallyIssued'
                              ? 'Partially Issued'
                              : request.status
                        }}
                      </span>
                    </td>

                    <td>
                      {{ request.assignedTo || 'Unassigned' }}
                    </td>

                    <td>
                      <div class="action-buttons">
                        <button
                          type="button"
                          class="action-btn view-btn"
                          title="View Details"
                          (click)="viewDetails(request)"
                        >
                          View
                        </button>

                        @if (canApprove(request)) {
                          <button
                            type="button"
                            class="action-btn approve-btn"
                            title="Approve Request"
                            (click)="openApproveDialog(request)"
                          >
                            Approve
                          </button>
                        }

                        @if (canReject(request)) {
                          <button
                            type="button"
                            class="action-btn reject-btn"
                            title="Reject Request"
                            (click)="openRejectDialog(request)"
                          >
                            Reject
                          </button>
                        }

                        @if (canAssign(request)) {
                          <button
                            type="button"
                            class="action-btn assign-btn"
                            title="Assign Request"
                            (click)="openAssignDialog(request)"
                          >
                            Assign
                          </button>
                        }

                        @if (canIssue(request)) {
                          <button
                            type="button"
                            class="action-btn issue-btn"
                            title="Issue Items"
                            (click)="openIssueDialog(request)"
                          >
                            Issue
                          </button>
                        }

                        @if (canUpdateStatus(request)) {
                          <button
                            type="button"
                            class="action-btn progress-btn"
                            title="Update Status"
                            (click)="openStatusDialog(request)"
                          >
                            Update
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>

    <!-- ===================================================== -->
    <!-- REQUEST DETAILS DIALOG -->
    <!-- ===================================================== -->

    @if (showDetails && selectedRequest) {
      <div class="modal-backdrop" (click)="closeDetails()">
        <div class="modal modal-large" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h3>Request Details</h3>
              <p>{{ selectedRequest.id }}</p>
            </div>

            <button type="button" class="modal-close" (click)="closeDetails()">
              ×
            </button>
          </div>

          <div class="modal-body">
            <div class="details-heading">
              <div>
                <span class="type-badge">
                  {{ getRequestTypeLabel(selectedRequest.requestType) }}
                </span>

                <h2>{{ selectedRequest.subject }}</h2>

                <span
                  class="status-badge"
                  [ngClass]="getStatusClass(selectedRequest.status)"
                >
                  {{ selectedRequest.status }}
                </span>
              </div>

              <span
                class="priority-badge"
                [ngClass]="getPriorityClass(selectedRequest.priority)"
              >
                {{ selectedRequest.priority }} Priority
              </span>
            </div>

            <div class="details-grid">
              <div class="detail-field">
                <label>Requested By</label>
                <strong>{{ selectedRequest.requestedBy || '-' }}</strong>
              </div>

              <div class="detail-field">
                <label>Request Type</label>
                <strong>{{
                  getRequestTypeLabel(selectedRequest.requestType)
                }}</strong>
              </div>

              <div class="detail-field">
                <label>Project</label>
                <strong>{{ selectedRequest.projectName || '-' }}</strong>
              </div>

              <div class="detail-field">
                <label>Site</label>
                <strong>{{ selectedRequest.siteName || '-' }}</strong>
              </div>

              <div class="detail-field">
                <label>Location</label>
                <strong>{{ selectedRequest.location || '-' }}</strong>
              </div>

              <div class="detail-field">
                <label>Needed By</label>
                <strong>
                  {{
                    selectedRequest.neededBy
                      ? (selectedRequest.neededBy | date: 'dd MMM yyyy')
                      : '-'
                  }}
                </strong>
              </div>

              <div class="detail-field">
                <label>Assigned To</label>
                <strong>{{
                  selectedRequest.assignedTo || 'Unassigned'
                }}</strong>
              </div>

              <div class="detail-field">
                <label>Approved By</label>
                <strong>{{ selectedRequest.approvedBy || '-' }}</strong>
              </div>
            </div>

            <div class="detail-description">
              <label>Description</label>
              <p>{{ selectedRequest.description }}</p>
            </div>

            @if (selectedRequest.locationDetails) {
              <div class="detail-description">
                <label>Location Details</label>
                <p>{{ selectedRequest.locationDetails }}</p>
              </div>
            }

            <!-- REQUEST ITEMS -->
            @if (selectedRequest.items?.length) {
              <div class="details-items">
                <h4>Requested Items</h4>

                <div class="table-wrapper">
                  <table class="request-table detail-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Item Code</th>
                        <th>Requested</th>
                        <th>Approved</th>
                        <th>Issued</th>
                        <th>Remaining</th>
                        <th>Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      @for (item of selectedRequest.items; track item.id) {
                        <tr>
                          <td>
                            <strong>{{ item.itemName }}</strong>
                            @if (item.description) {
                              <small class="item-description">{{
                                item.description
                              }}</small>
                            }
                          </td>

                          <td>{{ item.itemCode || '-' }}</td>

                          <td>{{ item.requestedQuantity }} {{ item.unit }}</td>

                          <td>{{ item.approvedQuantity }} {{ item.unit }}</td>

                          <td>{{ item.issuedQuantity }} {{ item.unit }}</td>

                          <td>
                            {{
                              getRemainingQuantity(
                                item.approvedQuantity,
                                item.issuedQuantity
                              )
                            }}
                            {{ item.unit }}
                          </td>

                          <td>
                            <span
                              class="status-badge"
                              [ngClass]="getStatusClass(item.status)"
                            >
                              {{ item.status }}
                            </span>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }

            @if (selectedRequest.adminRemarks) {
              <div class="detail-description">
                <label>Admin Remarks</label>
                <p>{{ selectedRequest.adminRemarks }}</p>
              </div>
            }

            @if (selectedRequest.rejectionReason) {
              <div class="detail-description rejection-note">
                <label>Rejection Reason</label>
                <p>{{ selectedRequest.rejectionReason }}</p>
              </div>
            }
          </div>

          <div class="modal-footer">
            <button
              type="button"
              class="btn-secondary"
              (click)="closeDetails()"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ===================================================== -->
    <!-- APPROVE DIALOG -->
    <!-- ===================================================== -->

    @if (showApproveDialog && selectedRequest) {
      <div class="modal-backdrop">
        <div class="modal modal-large">
          <div class="modal-header">
            <div>
              <h3>Approve Request</h3>
              <p>{{ selectedRequest.subject }}</p>
            </div>

            <button
              type="button"
              class="modal-close"
              (click)="showApproveDialog = false"
            >
              ×
            </button>
          </div>

          <form [formGroup]="approveForm" (ngSubmit)="approveRequest()">
            <div class="modal-body">
              <div class="info-banner">
                Review each requested item and enter the quantity you approve.
              </div>

              <!-- APPROVAL ITEMS -->
              <div formArrayName="items" class="approval-list">
                @for (
                  item of approvalItems.controls;
                  track $index;
                  let i = $index
                ) {
                  <div class="approval-item" [formGroupName]="i">
                    <div class="approval-item-heading">
                      <strong>{{ item.get('itemName')?.value }}</strong>

                      <span>
                        Requested: {{ item.get('requestedQuantity')?.value }}
                      </span>
                    </div>

                    <div class="form-grid">
                      <div class="form-field">
                        <label>Approved Quantity <span>*</span></label>

                        <input
                          type="number"
                          formControlName="approvedQuantity"
                          min="0"
                          [max]="item.get('requestedQuantity')?.value"
                          step="0.01"
                        />

                        @if (
                          item.get('approvedQuantity')?.touched &&
                          item.get('approvedQuantity')?.invalid
                        ) {
                          <small class="error-text">
                            Enter a quantity between 0 and the requested
                            quantity.
                          </small>
                        }
                      </div>

                      <div class="form-field">
                        <label>Item Remarks</label>

                        <input
                          type="text"
                          formControlName="remarks"
                          placeholder="Optional remarks"
                        />
                      </div>
                    </div>
                  </div>
                }
              </div>

              <!-- ASSIGN STAFF - OUTSIDE THE ITEMS LOOP -->
              <div class="form-field">
                <label>Assign To</label>

                <p-select
                  formControlName="assignedToId"
                  [options]="assignableUsers"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select staff (optional)"
                  [showClear]="approveForm.get('assignedToId')?.value"
                  styleClass="w-full"
                  [filter]="true"
                  appendTo="body"
                ></p-select>

                <small class="helper-text">
                  Leave empty to automatically assign this request to yourself.
                </small>

                @if (assignableUsers.length === 0) {
                  <small class="helper-text">
                    No staff members available. Please check the employee list.
                  </small>
                }
              </div>

              <!-- APPROVAL REMARKS -->
              <div class="form-field">
                <label>Approval Remarks</label>

                <textarea
                  formControlName="remarks"
                  rows="3"
                  placeholder="Add approval remarks..."
                ></textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button
                type="button"
                class="btn-secondary"
                (click)="showApproveDialog = false"
              >
                Cancel
              </button>

              <button type="submit" class="btn-primary" [disabled]="submitting">
                {{ submitting ? 'Approving...' : 'Confirm Approval' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- ===================================================== -->
    <!-- REJECT DIALOG -->
    <!-- ===================================================== -->

    @if (showRejectDialog && selectedRequest) {
      <div class="modal-backdrop">
        <div class="modal">
          <div class="modal-header">
            <div>
              <h3>Reject Request</h3>
              <p>{{ selectedRequest.subject }}</p>
            </div>

            <button
              type="button"
              class="modal-close"
              (click)="showRejectDialog = false"
            >
              ×
            </button>
          </div>

          <form [formGroup]="rejectForm" (ngSubmit)="rejectRequest()">
            <div class="modal-body">
              <div class="warning-banner">
                Are you sure you want to reject this request? Please provide a
                reason.
              </div>

              <div class="form-field">
                <label>Rejection Reason <span>*</span></label>
                <textarea
                  formControlName="reason"
                  rows="5"
                  placeholder="Explain why this request is rejected..."
                ></textarea>

                @if (
                  rejectForm.get('reason')?.touched &&
                  rejectForm.get('reason')?.invalid
                ) {
                  <small class="error-text">
                    Rejection reason is required.
                  </small>
                }
              </div>
            </div>

            <div class="modal-footer">
              <button
                type="button"
                class="btn-secondary"
                (click)="showRejectDialog = false"
              >
                Cancel
              </button>

              <button type="submit" class="btn-danger" [disabled]="submitting">
                {{ submitting ? 'Rejecting...' : 'Confirm Rejection' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- ===================================================== -->
    <!-- ASSIGN DIALOG -->
    <!-- ===================================================== -->

    @if (showAssignDialog && selectedRequest) {
      <div class="modal-backdrop">
        <div class="modal">
          <div class="modal-header">
            <div>
              <h3>Assign Request</h3>
              <p>{{ selectedRequest.subject }}</p>
            </div>

            <button
              type="button"
              class="modal-close"
              (click)="showAssignDialog = false"
            >
              ×
            </button>
          </div>

          <form [formGroup]="assignForm" (ngSubmit)="assignRequest()">
            <div class="modal-body">
              <div class="form-field">
                <label>Assign To <span>*</span></label>

                <p-select
                  formControlName="assignedToId"
                  [options]="assignableUsers"
                  optionLabel="label"
                  optionValue="value"
                  [filter]="true"
                  placeholder="-- Select Staff --"
                  [showClear]="assignForm.get('assignedToId')?.value"
                  styleClass="w-full"
                  appendTo="body"
                ></p-select>
                @if (
                  assignForm.get('assignedToId')?.touched &&
                  assignForm.get('assignedToId')?.invalid
                ) {
                  <small class="error-text">
                    Please select a staff member.
                  </small>
                }

                @if (assignableUsers.length === 0) {
                  <small class="helper-text">
                    No staff members loaded yet. Connect your employee API to
                    populate this list.
                  </small>
                }
              </div>
            </div>

            <div class="modal-footer">
              <button
                type="button"
                class="btn-secondary"
                (click)="showAssignDialog = false"
              >
                Cancel
              </button>

              <button
                type="submit"
                class="btn-primary"
                [disabled]="submitting || assignableUsers.length === 0"
              >
                {{ submitting ? 'Assigning...' : 'Confirm Assignment' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- ===================================================== -->
    <!-- ISSUE ITEMS DIALOG -->
    <!-- ===================================================== -->

    @if (showIssueDialog && selectedRequest) {
      <div class="modal-backdrop">
        <div class="modal modal-large">
          <div class="modal-header">
            <div>
              <h3>Issue Items</h3>
              <p>{{ selectedRequest.subject }}</p>
            </div>

            <button
              type="button"
              class="modal-close"
              (click)="showIssueDialog = false"
            >
              ×
            </button>
          </div>

          <form [formGroup]="issueForm" (ngSubmit)="issueRequest()">
            <div class="modal-body">
              <div class="info-banner">
                Enter the quantities being issued. You can issue items
                partially.
              </div>

              <div formArrayName="items" class="approval-list">
                @for (
                  item of issueItems.controls;
                  track $index;
                  let i = $index
                ) {
                  <div class="approval-item" [formGroupName]="i">
                    <div class="approval-item-heading">
                      <strong>{{ item.get('itemName')?.value }}</strong>

                      <span>
                        Approved: {{ item.get('approvedQuantity')?.value }}
                      </span>
                    </div>

                    <div class="form-grid">
                      <div class="form-field">
                        <label>Quantity to Issue <span>*</span></label>

                        <input
                          type="number"
                          formControlName="issuedQuantity"
                          min="0"
                          [max]="getRemainingIssueQuantity(item)"
                          step="0.01"
                        />

                        @if (
                          item.get('issuedQuantity')?.touched &&
                          item.get('issuedQuantity')?.invalid
                        ) {
                          <small class="error-text">
                            Enter a valid issue quantity.
                          </small>
                        }
                      </div>

                      <div class="form-field">
                        <label>Remarks</label>
                        <input
                          type="text"
                          formControlName="remarks"
                          placeholder="Optional remarks"
                        />
                      </div>
                    </div>
                  </div>
                }
              </div>

              @if (issueItems.length === 0) {
                <div class="empty-state compact-empty">
                  <p>There are no outstanding approved items to issue.</p>
                </div>
              }
            </div>

            <div class="modal-footer">
              <button
                type="button"
                class="btn-secondary"
                (click)="showIssueDialog = false"
              >
                Cancel
              </button>

              <button
                type="submit"
                class="btn-primary"
                [disabled]="submitting || issueItems.length === 0"
              >
                {{ submitting ? 'Processing...' : 'Confirm Issue' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- ===================================================== -->
    <!-- UPDATE STATUS DIALOG -->
    <!-- ===================================================== -->

    @if (showStatusDialog && selectedRequest) {
      <div class="modal-backdrop">
        <div class="modal">
          <div class="modal-header">
            <div>
              <h3>Update Request Status</h3>
              <p>{{ selectedRequest.subject }}</p>
            </div>

            <button
              type="button"
              class="modal-close"
              (click)="showStatusDialog = false"
            >
              ×
            </button>
          </div>

          <form [formGroup]="statusForm" (ngSubmit)="updateRequestStatus()">
            <div class="modal-body">
              <div class="form-field">
                <label>New Status <span>*</span></label>

                <p-select
                  formControlName="status"
                  [options]="statusOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select status"
                  styleClass="w-full"
                  appendTo="body"
                ></p-select>
              </div>

              <div class="form-field">
                <label>Remarks</label>
                <textarea
                  formControlName="remarks"
                  rows="4"
                  placeholder="Enter progress or resolution details..."
                ></textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button
                type="button"
                class="btn-secondary"
                (click)="showStatusDialog = false"
              >
                Cancel
              </button>

              <button type="submit" class="btn-primary" [disabled]="submitting">
                {{ submitting ? 'Updating...' : 'Update Status' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styleUrl: './incoming-hardware-request.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncomingHardwareRequest implements OnInit {
  private readonly requestService = inject(HardwareRequestService);
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly messageService = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  currentUserId = this.userService.currentUser?.userId;

  // =====================================================
  // DATA
  // =====================================================

  requests: HardwareRequestDto[] = [];
  filteredRequests: HardwareRequestDto[] = [];

  selectedRequest: HardwareRequestDto | null = null;

  loading: boolean = false;
  submitting: boolean = false;

  // =====================================================
  // FILTERS
  // =====================================================

  searchText: string = '';

  selectedStatus: RequestFilter = 'All';
  selectedType: RequestTypeFilter = 'All';

  statusFilters: { label: string; value: RequestFilter }[] = [
    { label: 'All Requests', value: 'All' },
    { label: 'Pending', value: 'Pending' },
    { label: 'Approved', value: 'Approved' },
    { label: 'In Progress', value: 'InProgress' },
    { label: 'Partially Issued', value: 'PartiallyIssued' },
    { label: 'Issued', value: 'Issued' },
    { label: 'Resolved', value: 'Resolved' },
    { label: 'Rejected', value: 'Rejected' },
    { label: 'Cancelled', value: 'Cancelled' },
  ];

  typeFilters: { label: string; value: RequestTypeFilter }[] = [
    { label: 'All Types', value: 'All' },
    { label: 'Hardware', value: 'Hardware' },
    { label: 'Site Material', value: 'SiteMaterial' },
    { label: 'IT Support', value: 'ITSupport' },
  ];

  // =====================================================
  // APPROVAL FORM
  // =====================================================

  approveForm = this.fb.group({
    remarks: [''],
    assignedToId: [''],
    items: this.fb.array([]),
  });

  // =====================================================
  // REJECTION FORM
  // =====================================================

  rejectForm = this.fb.group({
    reason: ['', [Validators.required, Validators.maxLength(2000)]],
  });

  // =====================================================
  // ASSIGNMENT FORM
  // =====================================================

  assignForm = this.fb.group({
    assignedToId: ['', Validators.required],
  });

  // =====================================================
  // ISSUE FORM
  // =====================================================

  issueForm = this.fb.group({
    items: this.fb.array([]),
  });

  // =====================================================
  // STATUS FORM
  // =====================================================

  statusForm = this.fb.group({
    status: ['InProgress' as 'InProgress' | 'Resolved', Validators.required],
    remarks: [''],
  });

  // =====================================================
  // MODAL / ACTION STATE
  // =====================================================

  showDetails: boolean = false;
  showApproveDialog: boolean = false;
  showRejectDialog: boolean = false;
  showAssignDialog: boolean = false;
  showIssueDialog: boolean = false;
  showStatusDialog: boolean = false;

  // Populate this from your existing employee/user API.
  // Do not use arbitrary hardcoded user IDs.
  assignableUsers: { label: string; value: string }[] = [];

  statusOptions = [
    { label: 'In Progress', value: 'InProgress' },
    { label: 'Resolved', value: 'Resolved' },
  ];

  // =====================================================
  // INITIALIZATION
  // =====================================================

  ngOnInit(): void {
    this.loadRequests();
    this.loadUsers();
  }

  loadUsers(): void {
    this.userService
      .GetMany({
        Page: 1,
        PageSize: 1000000,
        OrderBy: 'FullName',
        Filter: `SystemRole!=SuperAdmin`,
        Select: null,
        Includes: null,
      })
      .subscribe({
        next: (res) => {
          this.assignableUsers = (res.data ?? [])
            .filter((user: any) => user.isActive && user.status === 'Approved')
            .map((user: any) => ({
              label: user.fullName,
              value: user.id,
            }));

          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading assignable users:', error);

          this.assignableUsers = [];

          this.showError('Failed to load staff members.');
        },
      });
  }

  // =====================================================
  // LOAD REQUESTS
  // =====================================================

  // =====================================================
  // LOAD ALL INCOMING REQUESTS
  // =====================================================

  loadRequests(): void {
    this.loading = true;

    this.requestService.GetIncomingRequests().subscribe({
      next: (data) => {
        this.requests = data ?? [];
        this.applyFilters();

        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading incoming requests:', error);

        this.loading = false;
        this.showError('Failed to load incoming requests.');
        this.cdr.markForCheck();
      },
    });
  }

  // =====================================================
  // FILTERS
  // =====================================================

  applyFilters(): void {
    const search = this.searchText.trim().toLowerCase();

    this.filteredRequests = this.requests.filter((request) => {
      const matchesStatus =
        this.selectedStatus === 'All' || request.status === this.selectedStatus;

      const matchesType =
        this.selectedType === 'All' ||
        request.requestType === this.selectedType;

      const matchesSearch =
        !search ||
        request.subject?.toLowerCase().includes(search) ||
        request.description?.toLowerCase().includes(search) ||
        request.requestedBy?.toLowerCase().includes(search) ||
        request.projectName?.toLowerCase().includes(search) ||
        request.siteName?.toLowerCase().includes(search) ||
        request.items?.some(
          (item) =>
            item.itemName?.toLowerCase().includes(search) ||
            item.itemCode?.toLowerCase().includes(search),
        );

      return matchesStatus && matchesType && matchesSearch;
    });

    this.cdr.markForCheck();
  }

  onSearchChange(value: string): void {
    this.searchText = value;
    this.applyFilters();
  }

  onStatusChange(value: RequestFilter): void {
    this.selectedStatus = value;
    this.applyFilters();
  }

  onTypeChange(value: RequestTypeFilter): void {
    this.selectedType = value;
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchText = '';
    this.selectedStatus = 'All';
    this.selectedType = 'All';
    this.applyFilters();
  }

  // =====================================================
  // COUNTS
  // =====================================================

  get totalRequests(): number {
    return this.requests.length;
  }

  get pendingCount(): number {
    return this.requests.filter((x) => x.status === 'Pending').length;
  }

  get approvedCount(): number {
    return this.requests.filter((x) => x.status === 'Approved').length;
  }

  get inProgressCount(): number {
    return this.requests.filter((x) => x.status === 'InProgress').length;
  }

  get completedCount(): number {
    return this.requests.filter(
      (x) => x.status === 'Issued' || x.status === 'Resolved',
    ).length;
  }

  // =====================================================
  // REQUEST DETAILS
  // =====================================================

  viewDetails(request: HardwareRequestDto): void {
    this.requestService.GetById(request.id).subscribe({
      next: (data) => {
        if (!data) {
          this.showError('Request not found.');
          return;
        }

        this.selectedRequest = data;
        this.showDetails = true;
        this.cdr.markForCheck();
      },
    });
  }

  closeDetails(): void {
    this.showDetails = false;
    this.selectedRequest = null;
  }

  // =====================================================
  // APPROVAL
  // =====================================================

  get approvalItems(): FormArray {
    return this.approveForm.get('items') as FormArray;
  }

  openApproveDialog(request: HardwareRequestDto): void {
    this.selectedRequest = request;

    this.approveForm.reset({
      remarks: '',
      assignedToId: request.assignedToId ?? '',
    });

    this.approvalItems.clear();

    request.items?.forEach((item) => {
      this.approvalItems.push(
        this.fb.group({
          requestItemId: [item.id],
          itemName: [item.itemName],
          requestedQuantity: [item.requestedQuantity],

          approvedQuantity: [
            item.requestedQuantity,
            [
              Validators.required,
              Validators.min(0),
              Validators.max(item.requestedQuantity),
            ],
          ],

          remarks: [item.remarks ?? ''],
        }),
      );
    });

    this.showApproveDialog = true;
    this.cdr.markForCheck();
  }

  approveRequest(): void {
    if (!this.selectedRequest || this.approveForm.invalid) {
      this.approveForm.markAllAsTouched();
      return;
    }

    const formValue = this.approveForm.getRawValue();

    const payload: ApproveHardwareRequest = {
      remarks: formValue.remarks,
      assignedToId: formValue.assignedToId || null,

      items: (formValue.items ?? []).map((item: any) => ({
        requestItemId: item.requestItemId,
        approvedQuantity: Number(item.approvedQuantity),
        remarks: item.remarks,
      })),
    };

    this.submitting = true;

    this.requestService.Approve(this.selectedRequest.id, payload).subscribe({
      next: (response) => {
        this.showSuccess(response.message || 'Request approved successfully.');

        this.submitting = false;
        this.showApproveDialog = false;

        this.refreshSelectedRequest();
      },

      error: (error) => {
        console.error('Error approving request:', error);

        this.submitting = false;

        this.showError(
          error.error?.message ||
            'Failed to approve request. Please try again.',
        );

        this.cdr.markForCheck();
      },
    });
  }

  // =====================================================
  // REJECTION
  // =====================================================

  openRejectDialog(request: HardwareRequestDto): void {
    this.selectedRequest = request;

    this.rejectForm.reset({
      reason: '',
    });

    this.showRejectDialog = true;
  }

  rejectRequest(): void {
    if (!this.selectedRequest || this.rejectForm.invalid) {
      this.rejectForm.markAllAsTouched();
      return;
    }

    const payload: RejectHardwareRequest = {
      reason: this.rejectForm.value.reason,
    };

    this.submitting = true;

    this.requestService.Reject(this.selectedRequest.id, payload).subscribe({
      next: (response) => {
        this.showSuccess(response.message || 'Request rejected.');
        this.showRejectDialog = false;
        this.submitting = false;
        this.refreshSelectedRequest();
      },
      error: () => {
        this.submitting = false;
        this.cdr.markForCheck();
      },
    });
  }

  // =====================================================
  // ASSIGN REQUEST
  // =====================================================

  openAssignDialog(request: HardwareRequestDto): void {
    this.selectedRequest = request;

    this.assignForm.reset({
      assignedToId: request.assignedToId ?? '',
    });

    this.showAssignDialog = true;
  }

  assignRequest(): void {
    if (!this.selectedRequest || this.assignForm.invalid) {
      this.assignForm.markAllAsTouched();
      return;
    }

    const payload: AssignHardwareRequest = {
      assignedToId: this.assignForm.value.assignedToId!,
    };

    this.submitting = true;

    this.requestService.Assign(this.selectedRequest.id, payload).subscribe({
      next: (response) => {
        this.showSuccess(response.message || 'Request assigned successfully.');
        this.showAssignDialog = false;
        this.submitting = false;
        this.refreshSelectedRequest();
      },
      error: () => {
        this.submitting = false;
        this.cdr.markForCheck();
      },
    });
  }

  // =====================================================
  // ISSUE ITEMS
  // =====================================================

  get issueItems(): FormArray {
    return this.issueForm.get('items') as FormArray;
  }

  openIssueDialog(request: HardwareRequestDto): void {
    this.selectedRequest = request;

    this.issueForm.reset();
    this.issueItems.clear();

    request.items
      ?.filter((item) => item.approvedQuantity > item.issuedQuantity)
      .forEach((item) => {
        const remaining = item.approvedQuantity - item.issuedQuantity;

        this.issueItems.push(
          this.fb.group({
            requestItemId: [item.id],
            itemName: [item.itemName],
            approvedQuantity: [item.approvedQuantity],
            issuedQuantity: [
              remaining,
              [
                Validators.required,
                Validators.min(0),
                Validators.max(remaining),
              ],
            ],
            remarks: [''],
          }),
        );
      });

    this.showIssueDialog = true;
  }

  issueRequest(): void {
    if (!this.selectedRequest || this.issueForm.invalid) {
      this.issueForm.markAllAsTouched();
      return;
    }

    const items = this.issueForm
      .getRawValue()
      .items.filter((item: any) => Number(item.issuedQuantity) > 0)
      .map((item: any) => ({
        requestItemId: item.requestItemId,
        issuedQuantity: Number(item.issuedQuantity),
        remarks: item.remarks,
      }));

    if (!items.length) {
      this.showError('Enter at least one quantity to issue.');
      return;
    }

    const payload: IssueHardwareRequest = { items };

    this.submitting = true;

    this.requestService.Issue(this.selectedRequest.id, payload).subscribe({
      next: (response) => {
        this.showSuccess(response.message || 'Items issued successfully.');
        this.showIssueDialog = false;
        this.submitting = false;
        this.refreshSelectedRequest();
      },
      error: () => {
        this.submitting = false;
        this.cdr.markForCheck();
      },
    });
  }

  // =====================================================
  // UPDATE STATUS
  // =====================================================

  openStatusDialog(request: HardwareRequestDto): void {
    this.selectedRequest = request;

    this.statusForm.reset({
      status: 'InProgress',
      remarks: '',
    });

    this.showStatusDialog = true;
  }

  updateRequestStatus(): void {
    if (!this.selectedRequest || this.statusForm.invalid) {
      this.statusForm.markAllAsTouched();
      return;
    }

    const payload: UpdateHardwareRequestStatus = {
      status: this.statusForm.value.status as 'InProgress' | 'Resolved',
      remarks: this.statusForm.value.remarks,
    };

    this.submitting = true;

    this.requestService
      .UpdateStatus(this.selectedRequest.id, payload)
      .subscribe({
        next: (response) => {
          this.showSuccess(response.message || 'Request status updated.');
          this.showStatusDialog = false;
          this.submitting = false;
          this.refreshSelectedRequest();
        },
        error: () => {
          this.submitting = false;
          this.cdr.markForCheck();
        },
      });
  }

  // =====================================================
  // REFRESH SELECTED REQUEST
  // =====================================================

  private refreshSelectedRequest(): void {
    const requestId = this.selectedRequest?.id;

    if (!requestId) {
      this.loadRequests();
      return;
    }

    this.requestService.GetById(requestId).subscribe({
      next: (updated) => {
        if (updated) {
          this.selectedRequest = updated;
        }

        this.closeAllDialogs();
        this.loadRequests();
        this.cdr.markForCheck();
      },
      error: () => {
        this.closeAllDialogs();
        this.loadRequests();
      },
    });
  }

  private closeAllDialogs(): void {
    this.showApproveDialog = false;
    this.showRejectDialog = false;
    this.showAssignDialog = false;
    this.showIssueDialog = false;
    this.showStatusDialog = false;
  }

  // =====================================================
  // UI HELPERS
  // =====================================================

  getStatusClass(status: HardwareRequestStatus): string {
    switch (status) {
      case 'Pending':
        return 'status-pending';

      case 'Approved':
        return 'status-approved';

      case 'Rejected':
        return 'status-rejected';

      case 'PartiallyIssued':
        return 'status-partial';

      case 'Issued':
      case 'Resolved':
        return 'status-completed';

      case 'InProgress':
        return 'status-progress';

      case 'Cancelled':
        return 'status-cancelled';

      default:
        return 'status-default';
    }
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'Urgent':
        return 'priority-urgent';

      case 'High':
        return 'priority-high';

      case 'Low':
        return 'priority-low';

      default:
        return 'priority-normal';
    }
  }

  getRequestTypeLabel(type: HardwareRequestType): string {
    switch (type) {
      case 'SiteMaterial':
        return 'Site Material';

      case 'ITSupport':
        return 'IT Support';

      default:
        return 'Hardware';
    }
  }

  getRemainingQuantity(
    approvedQuantity: number,
    issuedQuantity: number,
  ): number {
    return Math.max(0, approvedQuantity - issuedQuantity);
  }
  canApprove(request: HardwareRequestDto): boolean {
    return request.status === 'Pending';
  }

  canReject(request: HardwareRequestDto): boolean {
    return request.status === 'Pending';
  }

  // Only managers / HODs should see Assign.
  // Assigned staff should not see this button.
  canAssign(request: HardwareRequestDto): boolean {
    return (
      !this.isAssignedStaff(request) &&
      !['Rejected', 'Cancelled', 'Resolved'].includes(request.status)
    );
  }

  canIssue(request: HardwareRequestDto): boolean {
    return (
      ['Approved', 'PartiallyIssued', 'InProgress'].includes(request.status) &&
      request.items?.some(
        (item) => item.approvedQuantity > item.issuedQuantity,
      ) === true
    );
  }

  canUpdateStatus(request: HardwareRequestDto): boolean {
    return (
      ['Approved', 'PartiallyIssued', 'InProgress'].includes(request.status) &&
      (this.isAssignedStaff(request) || !this.isAssignedStaff(request))
    );
  }

  isAssignedStaff(request: HardwareRequestDto): boolean {
    return !!this.currentUserId && request.assignedToId === this.currentUserId;
  }

  // =====================================================
  // NOTIFICATIONS
  // =====================================================

  private showSuccess(detail: string): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail,
    });

    this.cdr.markForCheck();
  }

  getRemainingIssueQuantity(formItem: any): number {
    const requestItemId = formItem.get('requestItemId')?.value;

    const approvedQuantity = Number(
      formItem.get('approvedQuantity')?.value ?? 0,
    );

    const originalItem = this.selectedRequest?.items?.find(
      (item) => item.id === requestItemId,
    );

    const issuedQuantity = Number(originalItem?.issuedQuantity ?? 0);

    return this.getRemainingQuantity(approvedQuantity, issuedQuantity);
  }

  private showError(detail: string): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail,
    });

    this.cdr.markForCheck();
  }
}
