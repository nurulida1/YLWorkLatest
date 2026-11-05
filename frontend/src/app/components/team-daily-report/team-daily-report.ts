import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { DailyReportService } from '../../services/DailyReportService';

interface TeamReportTask {
  id: string;
  staffTaskId: string;
  taskTitle: string | null;
  workDescription: string;
  hoursSpent: number;
}

interface TeamReport {
  id: string;
  employeeId: string;
  employeeName: string | null;
  projectId: string | null;
  projectName: string | null;
  reportDate: string;
  completedWork: string;
  inProgressWork: string;
  issues: string;
  nextDayPlan: string;
  status: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewRemarks: string | null;
  canReview: boolean;
  tasks: TeamReportTask[];
}

@Component({
  selector: 'app-team-daily-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="team-report-page">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <div class="breadcrumb">
            <span>Dashboard</span>
            <i class="pi pi-chevron-right"></i>
            <span>Daily Reports</span>
            <i class="pi pi-chevron-right"></i>
            <span class="current">Team Reports</span>
          </div>

          <h1>Team Daily Reports</h1>
          <p class="page-description">
            Monitor and review daily reports submitted by your team.
          </p>
        </div>

        <button
          type="button"
          class="refresh-button"
          (click)="loadReports()"
          [disabled]="isLoading"
        >
          <i class="pi pi-refresh" [class.spinning]="isLoading"></i>
          Refresh
        </button>
      </div>

      <!-- Summary Cards -->
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-icon total-icon">
            <i class="pi pi-file"></i>
          </div>

          <div>
            <p>Total Reports</p>
            <h2>{{ reports.length }}</h2>
          </div>
        </div>

        <div class="summary-card">
          <div class="summary-icon pending-icon">
            <i class="pi pi-clock"></i>
          </div>

          <div>
            <p>Pending Review</p>
            <h2>{{ pendingCount }}</h2>
          </div>
        </div>

        <div class="summary-card">
          <div class="summary-icon approved-icon">
            <i class="pi pi-check-circle"></i>
          </div>

          <div>
            <p>Approved</p>
            <h2>{{ approvedCount }}</h2>
          </div>
        </div>

        <div class="summary-card">
          <div class="summary-icon rejected-icon">
            <i class="pi pi-times-circle"></i>
          </div>

          <div>
            <p>Rejected</p>
            <h2>{{ rejectedCount }}</h2>
          </div>
        </div>
      </div>

      <!-- Success Message -->
      @if (successMessage) {
        <div class="success-message">
          <i class="pi pi-check-circle"></i>
          {{ successMessage }}
        </div>
      }

      <!-- Filters -->
      <div class="filter-card">
        <div class="filter-header">
          <div>
            <h3>Reports</h3>
            <p>Search and filter submitted daily reports.</p>
          </div>

          <button
            type="button"
            class="clear-filter-button"
            (click)="clearFilters()"
          >
            <i class="pi pi-filter-slash"></i>
            Clear Filters
          </button>
        </div>

        <div class="filter-grid">
          <div class="filter-field search-field">
            <label for="reportSearch">Search</label>

            <div class="search-input-wrapper">
              <i class="pi pi-search"></i>

              <input
                id="reportSearch"
                type="text"
                [(ngModel)]="searchText"
                placeholder="Employee or report content..."
              />
            </div>
          </div>

          <div class="filter-field">
            <label for="employeeFilter">Employee</label>

            <select id="employeeFilter" [(ngModel)]="selectedEmployee">
              <option value="">All Employees</option>

              @for (employee of employees; track employee) {
                <option [value]="employee">
                  {{ employee }}
                </option>
              }
            </select>
          </div>

          <div class="filter-field">
            <label for="projectFilter">Project</label>

            <select id="projectFilter" [(ngModel)]="selectedProject">
              <option value="">All Projects</option>

              @for (project of projects; track project) {
                <option [value]="project">
                  {{ project }}
                </option>
              }
            </select>
          </div>

          <div class="filter-field">
            <label for="statusFilter">Status</label>

            <select id="statusFilter" [(ngModel)]="selectedStatus">
              <option value="">All Statuses</option>
              <option value="Submitted">Pending Review</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div class="filter-field">
            <label for="dateFrom">From Date</label>

            <input id="dateFrom" type="date" [(ngModel)]="dateFrom" />
          </div>

          <div class="filter-field">
            <label for="dateTo">To Date</label>

            <input id="dateTo" type="date" [(ngModel)]="dateTo" />
          </div>
        </div>

        <div class="filter-result">
          Showing
          <strong>{{ filteredReports.length }}</strong>
          of
          <strong>{{ reports.length }}</strong>
          reports
        </div>
      </div>

      <!-- Report List -->
      <div class="report-list-card">
        @if (isLoading) {
          <div class="loading-state">
            <i class="pi pi-spin pi-spinner"></i>
            <p>Loading team reports...</p>
          </div>
        } @else if (filteredReports.length === 0) {
          <div class="empty-state">
            <div class="empty-icon">
              <i class="pi pi-folder-open"></i>
            </div>

            <h3>No Reports Found</h3>

            <p>There are no reports matching your selected filters.</p>

            <button
              type="button"
              class="clear-filter-button"
              (click)="clearFilters()"
            >
              Clear Filters
            </button>
          </div>
        } @else {
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Report Date</th>
                  <th>Project</th>
                  <th>Tasks</th>
                  <th>Submitted At</th>
                  <th>Status</th>
                  <th class="text-center">Action</th>
                </tr>
              </thead>

              <tbody>
                @for (report of filteredReports; track report.id) {
                  <tr>
                    <td>
                      <div class="employee-cell">
                        <div class="employee-avatar">
                          {{ getInitials(report.employeeName) }}
                        </div>

                        <div class="employee-info">
                          <strong>
                            {{ report.employeeName || 'Unknown Employee' }}
                          </strong>

                          <span>
                            {{ report.projectName || 'No Project' }}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      {{ report.reportDate | date: 'dd MMM yyyy' }}
                    </td>

                    <td>
                      {{ report.projectName || '—' }}
                    </td>

                    <td>
                      <span class="task-count">
                        {{ report.tasks?.length || 0 }}
                        {{ report.tasks?.length === 1 ? 'Task' : 'Tasks' }}
                      </span>
                    </td>

                    <td>
                      {{
                        report.submittedAt
                          ? (report.submittedAt | date: 'dd MMM yyyy, h:mm a')
                          : '—'
                      }}
                    </td>

                    <td>
                      <span
                        class="status-badge"
                        [ngClass]="getStatusClass(report.status)"
                      >
                        <span class="status-dot"></span>
                        {{ getStatusLabel(report.status) }}
                      </span>
                    </td>

                    <td>
                      <div class="action-buttons">
                        <button
                          type="button"
                          class="view-button"
                          (click)="openReport(report)"
                          title="View Report"
                        >
                          <i class="pi pi-eye"></i>
                          View
                        </button>

                        @if (
                          report.canReview && report.status === 'Submitted'
                        ) {
                          <button
                            type="button"
                            class="approve-button"
                            (click)="approveReport(report)"
                            [disabled]="isReviewing"
                            title="Approve Report"
                          >
                            <i class="pi pi-check"></i>
                          </button>

                          <button
                            type="button"
                            class="reject-button"
                            (click)="openRejectDialog(report)"
                            [disabled]="isReviewing"
                            title="Reject Report"
                          >
                            <i class="pi pi-times"></i>
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

    <!-- Report Details Modal -->
    @if (showDetailsDialog && selectedReport) {
      <div class="modal-overlay" (click)="closeDetails()">
        <div
          class="modal-container details-modal"
          (click)="$event.stopPropagation()"
        >
          <div class="modal-header">
            <div>
              <h2>Daily Report Details</h2>
              <p>
                {{ selectedReport.employeeName || 'Unknown Employee' }}
                ·
                {{ selectedReport.reportDate | date: 'dd MMM yyyy' }}
              </p>
            </div>

            <button type="button" class="modal-close" (click)="closeDetails()">
              <i class="pi pi-times"></i>
            </button>
          </div>

          <div class="modal-body">
            <div class="detail-summary">
              <div>
                <span>Employee</span>
                <strong>
                  {{ selectedReport.employeeName || '—' }}
                </strong>
              </div>

              <div>
                <span>Project</span>
                <strong>
                  {{ selectedReport.projectName || 'No Project' }}
                </strong>
              </div>

              <div>
                <span>Report Date</span>
                <strong>
                  {{ selectedReport.reportDate | date: 'dd MMM yyyy' }}
                </strong>
              </div>

              <div>
                <span>Status</span>
                <strong>
                  <span
                    class="status-badge"
                    [ngClass]="getStatusClass(selectedReport.status)"
                  >
                    <span class="status-dot"></span>
                    {{ getStatusLabel(selectedReport.status) }}
                  </span>
                </strong>
              </div>
            </div>

            <div class="detail-section">
              <h3>
                <i class="pi pi-check-circle"></i>
                Completed Work
              </h3>

              <p class="detail-text">
                {{
                  selectedReport.completedWork || 'No completed work recorded.'
                }}
              </p>
            </div>

            <div class="detail-section">
              <h3>
                <i class="pi pi-clock"></i>
                Work In Progress
              </h3>

              <p class="detail-text">
                {{
                  selectedReport.inProgressWork || 'No ongoing work recorded.'
                }}
              </p>
            </div>

            <div class="detail-section">
              <h3>
                <i class="pi pi-exclamation-triangle"></i>
                Issues / Blockers
              </h3>

              <p class="detail-text">
                {{ selectedReport.issues || 'No issues reported.' }}
              </p>
            </div>

            <div class="detail-section">
              <h3>
                <i class="pi pi-calendar"></i>
                Next Day Plan
              </h3>

              <p class="detail-text">
                {{ selectedReport.nextDayPlan || 'No next day plan recorded.' }}
              </p>
            </div>

            <div class="detail-section">
              <div class="section-heading">
                <h3>
                  <i class="pi pi-list-check"></i>
                  Linked Tasks
                </h3>

                <span class="task-count">
                  {{ selectedReport.tasks?.length || 0 }} Tasks
                </span>
              </div>

              @if (selectedReport.tasks?.length) {
                <div class="linked-task-list">
                  @for (task of selectedReport.tasks; track task.id) {
                    <div class="linked-task">
                      <div class="linked-task-header">
                        <strong>
                          {{ task.taskTitle || 'Untitled Task' }}
                        </strong>

                        <span> {{ task.hoursSpent }} hours </span>
                      </div>

                      <p>
                        {{
                          task.workDescription ||
                            'No work description provided.'
                        }}
                      </p>
                    </div>
                  }
                </div>
              } @else {
                <p class="detail-text">No linked tasks.</p>
              }
            </div>

            @if (selectedReport.reviewRemarks) {
              <div class="review-remarks">
                <strong>Review Remarks</strong>
                <p>{{ selectedReport.reviewRemarks }}</p>
              </div>
            }

            @if (selectedReport.reviewedAt) {
              <p class="reviewed-date">
                Reviewed on
                {{ selectedReport.reviewedAt | date: 'dd MMM yyyy, h:mm a' }}
              </p>
            }
          </div>

          <div class="modal-footer">
            @if (
              selectedReport.canReview && selectedReport.status === 'Submitted'
            ) {
              <button
                type="button"
                class="reject-dialog-button"
                (click)="openRejectDialog(selectedReport)"
              >
                <i class="pi pi-times"></i>
                Reject
              </button>

              <button
                type="button"
                class="approve-dialog-button"
                (click)="approveReport(selectedReport)"
                [disabled]="isReviewing"
              >
                <i class="pi pi-check"></i>
                Approve Report
              </button>
            } @else {
              <button
                type="button"
                class="close-button"
                (click)="closeDetails()"
              >
                Close
              </button>
            }
          </div>
        </div>
      </div>
    }

    <!-- Reject Report Modal -->
    @if (showRejectDialog && reportToReject) {
      <div class="modal-overlay" (click)="closeRejectDialog()">
        <div
          class="modal-container reject-modal"
          (click)="$event.stopPropagation()"
        >
          <div class="modal-header">
            <div>
              <h2>Reject Daily Report</h2>
              <p>
                {{ reportToReject.employeeName || 'Unknown Employee' }}
              </p>
            </div>

            <button
              type="button"
              class="modal-close"
              (click)="closeRejectDialog()"
            >
              <i class="pi pi-times"></i>
            </button>
          </div>

          <div class="modal-body">
            <div class="warning-message">
              <i class="pi pi-exclamation-triangle"></i>
              Please provide a reason for rejecting this report.
            </div>

            <label for="rejectRemarks">
              Rejection Remarks <span>*</span>
            </label>

            <textarea
              id="rejectRemarks"
              rows="5"
              [(ngModel)]="rejectRemarks"
              placeholder="Explain why this daily report is being rejected..."
            ></textarea>

            @if (rejectRemarks.trim().length === 0 && rejectAttempted) {
              <p class="validation-error">Rejection remarks are required.</p>
            }
          </div>

          <div class="modal-footer">
            <button
              type="button"
              class="close-button"
              (click)="closeRejectDialog()"
              [disabled]="isReviewing"
            >
              Cancel
            </button>

            <button
              type="button"
              class="reject-dialog-button"
              (click)="confirmReject()"
              [disabled]="isReviewing"
            >
              <i class="pi pi-times"></i>
              {{ isReviewing ? 'Rejecting...' : 'Confirm Rejection' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './team-daily-report.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamDailyReport implements OnInit {
  private dailyReportService = inject(DailyReportService);
  private cdr = inject(ChangeDetectorRef);

  reports: TeamReport[] = [];

  isLoading = false;
  isReviewing = false;

  showDetailsDialog = false;
  showRejectDialog = false;

  selectedReport: TeamReport | null = null;
  reportToReject: TeamReport | null = null;

  rejectRemarks = '';
  rejectAttempted = false;

  searchText = '';
  selectedEmployee = '';
  selectedProject = '';
  selectedStatus = '';

  dateFrom = '';
  dateTo = '';

  successMessage = '';

  ngOnInit(): void {
    this.loadReports();
  }

  // ==========================================
  // LOAD TEAM REPORTS
  // ==========================================
  loadReports(): void {
    this.isLoading = true;
    this.successMessage = '';

    this.dailyReportService.GetMyReports().subscribe({
      next: (response) => {
        // GetMyReports also returns the current user's own drafts.
        // This team page only displays submitted/reviewed reports.
        this.reports = (response as unknown as TeamReport[])
          .filter((report) => report.status !== 'Draft')
          .sort(
            (a, b) =>
              new Date(b.reportDate).getTime() -
              new Date(a.reportDate).getTime(),
          );

        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  // ==========================================
  // FILTERED REPORTS
  // ==========================================
  get filteredReports(): TeamReport[] {
    const search = this.searchText.trim().toLowerCase();

    return this.reports.filter((report) => {
      const matchesSearch =
        !search ||
        (report.employeeName || '').toLowerCase().includes(search) ||
        (report.projectName || '').toLowerCase().includes(search) ||
        (report.completedWork || '').toLowerCase().includes(search) ||
        (report.inProgressWork || '').toLowerCase().includes(search) ||
        (report.issues || '').toLowerCase().includes(search) ||
        (report.nextDayPlan || '').toLowerCase().includes(search) ||
        (report.tasks || []).some(
          (task) =>
            (task.taskTitle || '').toLowerCase().includes(search) ||
            (task.workDescription || '').toLowerCase().includes(search),
        );

      const matchesEmployee =
        !this.selectedEmployee || report.employeeName === this.selectedEmployee;

      const matchesProject =
        !this.selectedProject || report.projectName === this.selectedProject;

      const matchesStatus =
        !this.selectedStatus || report.status === this.selectedStatus;

      const reportDate = this.toDateInputValue(report.reportDate);

      const matchesFromDate = !this.dateFrom || reportDate >= this.dateFrom;

      const matchesToDate = !this.dateTo || reportDate <= this.dateTo;

      return (
        matchesSearch &&
        matchesEmployee &&
        matchesProject &&
        matchesStatus &&
        matchesFromDate &&
        matchesToDate
      );
    });
  }

  // ==========================================
  // FILTER OPTIONS
  // ==========================================
  get employees(): string[] {
    return [
      ...new Set(
        this.reports
          .map((report) => report.employeeName)
          .filter((name): name is string => !!name),
      ),
    ].sort();
  }

  get projects(): string[] {
    return [
      ...new Set(
        this.reports
          .map((report) => report.projectName)
          .filter((name): name is string => !!name),
      ),
    ].sort();
  }

  // ==========================================
  // SUMMARY COUNTS
  // ==========================================
  get pendingCount(): number {
    return this.reports.filter((report) => report.status === 'Submitted')
      .length;
  }

  get approvedCount(): number {
    return this.reports.filter((report) => report.status === 'Approved').length;
  }

  get rejectedCount(): number {
    return this.reports.filter((report) => report.status === 'Rejected').length;
  }

  // ==========================================
  // OPEN REPORT DETAILS
  // ==========================================
  openReport(report: TeamReport): void {
    this.selectedReport = report;
    this.showDetailsDialog = true;
    this.cdr.markForCheck();
  }

  closeDetails(): void {
    this.showDetailsDialog = false;
    this.selectedReport = null;
    this.cdr.markForCheck();
  }

  // ==========================================
  // APPROVE REPORT
  // ==========================================
  approveReport(report: TeamReport): void {
    if (
      !report.canReview ||
      report.status !== 'Submitted' ||
      this.isReviewing
    ) {
      return;
    }

    this.isReviewing = true;
    this.successMessage = '';

    this.dailyReportService.Approve(report.id).subscribe({
      next: (response) => {
        this.isReviewing = false;

        this.closeDetails();

        this.successMessage =
          response?.message || 'Daily report approved successfully.';

        this.loadReports();
        this.cdr.markForCheck();
      },
      error: () => {
        this.isReviewing = false;
        this.cdr.markForCheck();
      },
    });
  }

  // ==========================================
  // OPEN REJECTION DIALOG
  // ==========================================
  openRejectDialog(report: TeamReport): void {
    if (
      !report.canReview ||
      report.status !== 'Submitted' ||
      this.isReviewing
    ) {
      return;
    }

    this.reportToReject = report;
    this.rejectRemarks = '';
    this.rejectAttempted = false;

    this.showRejectDialog = true;

    this.cdr.markForCheck();
  }

  // ==========================================
  // CLOSE REJECTION DIALOG
  // ==========================================
  closeRejectDialog(): void {
    if (this.isReviewing) {
      return;
    }

    this.showRejectDialog = false;
    this.reportToReject = null;
    this.rejectRemarks = '';
    this.rejectAttempted = false;

    this.cdr.markForCheck();
  }

  // ==========================================
  // CONFIRM REJECTION
  // ==========================================
  confirmReject(): void {
    this.rejectAttempted = true;

    const remarks = this.rejectRemarks.trim();

    if (!remarks || !this.reportToReject || this.isReviewing) {
      this.cdr.markForCheck();
      return;
    }

    const report = this.reportToReject;

    this.isReviewing = true;
    this.successMessage = '';

    this.dailyReportService.Reject(report.id, remarks).subscribe({
      next: (response) => {
        this.isReviewing = false;

        this.showRejectDialog = false;
        this.showDetailsDialog = false;

        this.reportToReject = null;
        this.selectedReport = null;
        this.rejectRemarks = '';
        this.rejectAttempted = false;

        this.successMessage =
          response?.message || 'Daily report rejected successfully.';

        this.loadReports();
        this.cdr.markForCheck();
      },
      error: () => {
        this.isReviewing = false;
        this.cdr.markForCheck();
      },
    });
  }

  // ==========================================
  // CLEAR FILTERS
  // ==========================================
  clearFilters(): void {
    this.searchText = '';
    this.selectedEmployee = '';
    this.selectedProject = '';
    this.selectedStatus = '';
    this.dateFrom = '';
    this.dateTo = '';

    this.cdr.markForCheck();
  }

  // ==========================================
  // STATUS HELPERS
  // ==========================================
  getStatusLabel(status: string): string {
    switch (status) {
      case 'Submitted':
        return 'Pending Review';

      case 'Approved':
        return 'Approved';

      case 'Rejected':
        return 'Rejected';

      default:
        return status;
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Submitted':
        return 'status-pending';

      case 'Approved':
        return 'status-approved';

      case 'Rejected':
        return 'status-rejected';

      default:
        return 'status-default';
    }
  }

  // ==========================================
  // EMPLOYEE INITIALS
  // ==========================================
  getInitials(name: string | null): string {
    if (!name) {
      return 'NA';
    }

    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }

  // ==========================================
  // DATE HELPER
  // ==========================================
  private toDateInputValue(value: string | Date): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
