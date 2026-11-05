import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { HardwareRequestService } from '../../../services/HardwareRequestService';
import {
  ApproveHardwareRequest,
  AssignHardwareRequest,
  HardwareRequestDto,
  HardwareRequestStatus,
  RejectHardwareRequest,
  UpdateHardwareRequestStatus,
} from '../../../models/HardwareRequest';

@Component({
  selector: 'app-hardware-request-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <a routerLink="/hardware-request" class="back-link">
            ← Back to Hardware Requests
          </a>

          <h1>Request Details</h1>
          <p>View and manage the hardware request.</p>
        </div>

        @if (request) {
          <span class="status-badge" [ngClass]="getStatusClass(request.status)">
            {{ request.status }}
          </span>
        }
      </div>

      <!-- Loading -->
      @if (loading) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Loading request details...</p>
        </div>
      }

      <!-- Error -->
      @if (!loading && errorMessage) {
        <div class="alert alert-error">
          {{ errorMessage }}
        </div>
      }

      @if (!loading && request) {
        <!-- Request Information -->
        <div class="content-grid">
          <section class="card request-card">
            <div class="card-header">
              <div>
                <h2>{{ request.subject }}</h2>
                <p class="muted">{{ request.requestType }} Request</p>
              </div>

              <span
                class="priority-badge"
                [ngClass]="getPriorityClass(request.priority)"
              >
                {{ request.priority }} Priority
              </span>
            </div>

            <div class="details-grid">
              <div class="detail-item">
                <label>Request Type</label>
                <p>{{ request.requestType }}</p>
              </div>

              <div class="detail-item">
                <label>Requested By</label>
                <p>{{ request.requestedBy || '-' }}</p>
              </div>

              <div class="detail-item">
                <label>Site</label>
                <p>{{ request.siteName || '-' }}</p>
              </div>

              <div class="detail-item">
                <label>Location</label>
                <p>{{ request.location || '-' }}</p>
              </div>

              <div class="detail-item">
                <label>Needed By</label>
                <p>
                  {{
                    request.neededBy
                      ? (request.neededBy | date: 'dd MMM yyyy')
                      : '-'
                  }}
                </p>
              </div>

              <div class="detail-item">
                <label>Project</label>
                <p>{{ request.projectName || '-' }}</p>
              </div>
            </div>

            <div class="description-section">
              <label>Description</label>
              <p>{{ request.description || 'No description provided.' }}</p>
            </div>

            @if (request.locationDetails) {
              <div class="description-section">
                <label>Additional Location Details</label>
                <p>{{ request.locationDetails }}</p>
              </div>
            }
          </section>

          <!-- Items -->
          @if (request.items?.length) {
            <section class="card">
              <div class="card-header">
                <div>
                  <h2>Requested Items</h2>
                  <p class="muted">{{ request.items.length }} item(s)</p>
                </div>
              </div>

              <div class="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Item Code</th>
                      <th>Unit</th>
                      <th>Requested</th>
                      <th>Approved</th>
                      <th>Issued</th>
                      <th>Available Stock</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    @for (item of request.items; track item.id) {
                      <tr>
                        <td>
                          <strong>{{ item.itemName }}</strong>
                          @if (item.description) {
                            <small class="item-description">
                              {{ item.description }}
                            </small>
                          }
                        </td>

                        <td>{{ item.itemCode || '-' }}</td>
                        <td>{{ item.unit || '-' }}</td>
                        <td>{{ item.requestedQuantity }}</td>
                        <td>{{ item.approvedQuantity }}</td>
                        <td>{{ item.issuedQuantity }}</td>
                        <td>{{ item.availableStock ?? '-' }}</td>
                        <td>
                          <span class="item-status">
                            {{ item.status }}
                          </span>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </section>
          }

          <!-- Assignment and approval information -->
          <section class="card">
            <h2>Processing Information</h2>

            <div class="details-grid">
              <div class="detail-item">
                <label>Approved By</label>
                <p>{{ request.approvedBy || '-' }}</p>
              </div>

              <div class="detail-item">
                <label>Assigned To</label>
                <p>{{ request.assignedTo || 'Not assigned' }}</p>
              </div>
            </div>

            @if (request.adminRemarks) {
              <div class="description-section">
                <label>Remarks</label>
                <p>{{ request.adminRemarks }}</p>
              </div>
            }

            @if (request.rejectionReason) {
              <div class="description-section rejection-text">
                <label>Rejection Reason</label>
                <p>{{ request.rejectionReason }}</p>
              </div>
            }
          </section>

          <!-- HOD Actions -->
          @if (request.status === 'Pending') {
            <section class="card action-card">
              <h2>Approval Action</h2>
              <p class="muted">
                Review each item and specify the quantity to approve.
              </p>

              @if (request.items?.length) {
                <div class="approval-items">
                  @for (item of request.items; track item.id) {
                    <div class="approval-item">
                      <div>
                        <strong>{{ item.itemName }}</strong>
                        <small>
                          Requested: {{ item.requestedQuantity }}
                          {{ item.unit || '' }}
                        </small>
                        <small>
                          Available stock:
                          {{ item.availableStock ?? 'Not linked' }}
                        </small>
                      </div>

                      <div class="form-group">
                        <label [for]="'approved-' + item.id">
                          Approved Quantity
                        </label>
                        <input
                          [id]="'approved-' + item.id"
                          type="number"
                          min="0"
                          [max]="item.requestedQuantity"
                          step="0.01"
                          [ngModel]="
                            approvalQuantities[item.id] ??
                            item.requestedQuantity
                          "
                          (ngModelChange)="approvalQuantities[item.id] = $event"
                          [ngModelOptions]="{ standalone: true }"
                        />
                      </div>
                    </div>
                  }
                </div>
              }

              <div class="form-group">
                <label for="remarks">Remarks (Optional)</label>
                <textarea
                  id="remarks"
                  rows="3"
                  [(ngModel)]="remarks"
                  placeholder="Enter your remarks..."
                ></textarea>
              </div>

              <div class="action-buttons">
                <button
                  type="button"
                  class="btn btn-success"
                  [disabled]="processing"
                  (click)="approveRequest()"
                >
                  {{ processing ? 'Processing...' : 'Approve Request' }}
                </button>

                <button
                  type="button"
                  class="btn btn-danger"
                  [disabled]="processing || !remarks.trim()"
                  (click)="rejectRequest()"
                >
                  Reject Request
                </button>
              </div>
            </section>
          }

          <!-- Assignment -->
          @if (
            request.status === 'Approved' || request.status === 'InProgress'
          ) {
            <section class="card action-card">
              <h2>Assign Request</h2>
              <p class="muted">
                Assign this request to the staff member responsible for handling
                it.
              </p>

              <div class="form-group">
                <label for="assignedToId">Staff User ID</label>
                <input
                  id="assignedToId"
                  type="text"
                  [(ngModel)]="assignedToId"
                  placeholder="Enter staff user ID"
                />
              </div>

              <button
                type="button"
                class="btn btn-primary"
                [disabled]="processing || !assignedToId.trim()"
                (click)="assignRequest()"
              >
                Assign Request
              </button>
            </section>
          }

          <!-- IT Support status -->
          @if (
            request.requestType === 'ITSupport' &&
            (request.status === 'Approved' || request.status === 'InProgress')
          ) {
            <section class="card action-card">
              <h2>Update Support Status</h2>

              <div class="form-group">
                <label for="newStatus">Status</label>
                <select id="newStatus" [(ngModel)]="newStatus">
                  <option value="InProgress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>

              <button
                type="button"
                class="btn btn-primary"
                [disabled]="processing"
                (click)="updateRequestStatus()"
              >
                Update Status
              </button>
            </section>
          }
        </div>
      }
    </div>
  `,
  styleUrl: './hardware-request-details.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HardwareRequestDetails implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly hardwareRequestService = inject(HardwareRequestService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  request: HardwareRequestDto | null = null;

  loading: boolean = false;
  processing: boolean = false;

  errorMessage: string = '';
  remarks: string = '';
  assignedToId: string = '';
  newStatus: 'InProgress' | 'Resolved' = 'InProgress';

  approvalQuantities: Record<string, number> = {};

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.errorMessage = 'Invalid request ID.';
      return;
    }

    this.loadRequest(id);
  }

  loadRequest(id: string): void {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.hardwareRequestService
      .GetById(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          if (!response) {
            this.request = null;
            this.errorMessage = 'Request not found.';
            return;
          }

          this.request = response;
          this.assignedToId = response.assignedToId || '';

          this.approvalQuantities = {};

          for (const item of response.items ?? []) {
            this.approvalQuantities[item.id] = item.requestedQuantity;
          }

          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Failed to load hardware request:', error);
          this.errorMessage = 'Unable to load request details.';
          this.cdr.markForCheck();
        },
      });
  }

  approveRequest(): void {
    if (!this.request || this.processing) return;

    const approvalItems = (this.request.items ?? []).map((item) => {
      const approvedQuantity = Number(
        this.approvalQuantities[item.id] ?? item.requestedQuantity,
      );

      return {
        requestItemId: item.id,
        approvedQuantity,
        remarks: null,
      };
    });

    const invalidItem = (this.request.items ?? []).some((item) => {
      const quantity = Number(
        this.approvalQuantities[item.id] ?? item.requestedQuantity,
      );

      return (
        !Number.isFinite(quantity) ||
        quantity < 0 ||
        quantity > item.requestedQuantity
      );
    });

    if (invalidItem) {
      this.errorMessage =
        'Approved quantity must be between zero and the requested quantity.';
      return;
    }

    const payload: ApproveHardwareRequest = {
      remarks: this.remarks.trim() || null,
      items: approvalItems,
    };

    this.processing = true;
    this.errorMessage = '';

    this.hardwareRequestService
      .Approve(this.request.id, payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.processing = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.remarks = '';
          this.loadRequest(this.request!.id);
        },
        error: (error) => {
          console.error('Approve request failed:', error);
          this.errorMessage =
            error?.error?.message || 'Failed to approve this request.';
          this.cdr.markForCheck();
        },
      });
  }

  rejectRequest(): void {
    if (!this.request || this.processing || !this.remarks.trim()) return;

    const payload: RejectHardwareRequest = {
      reason: this.remarks.trim(),
    };

    this.processing = true;

    this.hardwareRequestService
      .Reject(this.request.id, payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.processing = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.remarks = '';
          this.loadRequest(this.request!.id);
        },
        error: (error) => {
          console.error('Reject request failed:', error);
          this.errorMessage = 'Failed to reject this request.';
          this.cdr.markForCheck();
        },
      });
  }

  assignRequest(): void {
    if (!this.request || this.processing || !this.assignedToId.trim()) {
      return;
    }

    const payload: AssignHardwareRequest = {
      assignedToId: this.assignedToId.trim(),
    };

    this.processing = true;

    this.hardwareRequestService
      .Assign(this.request.id, payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.processing = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.loadRequest(this.request!.id);
        },
        error: (error) => {
          console.error('Assign request failed:', error);
          this.errorMessage = 'Failed to assign this request.';
          this.cdr.markForCheck();
        },
      });
  }

  updateRequestStatus(): void {
    if (!this.request || this.processing) return;

    const payload: UpdateHardwareRequestStatus = {
      status: this.newStatus,
      remarks: this.remarks.trim() || null,
    };

    this.processing = true;

    this.hardwareRequestService
      .UpdateStatus(this.request.id, payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.processing = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.loadRequest(this.request!.id);
        },
        error: (error) => {
          console.error('Update request status failed:', error);
          this.errorMessage = 'Failed to update request status.';
          this.cdr.markForCheck();
        },
      });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Pending':
        return 'status-pending';
      case 'Approved':
        return 'status-approved';
      case 'Rejected':
        return 'status-rejected';
      case 'InProgress':
        return 'status-progress';
      case 'Resolved':
      case 'Issued':
        return 'status-completed';
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
}
