import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { SelectModule } from 'primeng/select';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { MenuItem, MessageService } from 'primeng/api';
import { map, Observable, Subject, takeUntil } from 'rxjs';
import { TimelineModule } from 'primeng/timeline';
import { DatePickerModule } from 'primeng/datepicker';
import { DrawerModule } from 'primeng/drawer';
import {
  QuotationDto,
  QuotationStatusHistory,
} from '../../../../models/Quotation';
import { LoadingService } from '../../../../services/loading.service';
import { QuotationService } from '../../../../services/quotationService.service';
import { UserService } from '../../../../services/userService.service';
import {
  PagingContent,
  GridifyQueryExtend,
  BuildSortText,
  BuildFilterText,
} from '../../../../shared/helpers/helpers';
import { PaginatorModule } from 'primeng/paginator';

@Component({
  selector: 'app-quotation',
  imports: [
    CommonModule,
    RouterLink,
    InputTextModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    MenuModule,
    SelectModule,
    TimelineModule,
    DatePickerModule,
    DrawerModule,
    PaginatorModule,
  ],
  template: `<div class="quotation-page">
      <div class="quotation-container">
        <!-- Breadcrumb -->
        <div class="breadcrumb">
          <a routerLink="/dashboard">Dashboard</a>
          <i class="pi pi-angle-right"></i>
          <span>Quotations</span>
        </div>

        <!-- Page heading -->
        <div class="page-heading">
          <div class="heading-copy">
            <div class="heading-icon">
              <i class="pi pi-file-edit"></i>
            </div>

            <div>
              <h1>Quotations</h1>
              <p>Manage, review and track your project quotations.</p>
            </div>
          </div>

          <div class="heading-actions">
            <p-button
              label="Export Excel"
              icon="pi pi-file-excel"
              severity="secondary"
              [outlined]="true"
              styleClass="export-button"
              (onClick)="exportToExcel()"
            ></p-button>

            <p-button
              label="New Quotation"
              icon="pi pi-plus"
              styleClass="new-quotation-button"
              [routerLink]="'/quotations/form'"
            ></p-button>
          </div>
        </div>

        <!-- Main content -->
        <section class="quotation-panel">
          <!-- Toolbar -->
          <div class="quotation-toolbar">
            <div class="toolbar-title">
              <h2>All Quotations</h2>
              <p>Browse and manage quotation records</p>
            </div>

            <div class="toolbar-actions">
              <div class="quotation-search">
                <i class="pi pi-search"></i>
                <input
                  type="text"
                  pInputText
                  [(ngModel)]="search"
                  (keydown)="onKeyDown($event)"
                  placeholder="Search quotation number..."
                />

                <button
                  *ngIf="search"
                  type="button"
                  class="clear-search"
                  aria-label="Clear search"
                  (click)="ResetTable()"
                >
                  <i class="pi pi-times"></i>
                </button>
              </div>

              <p-button
                icon="pi pi-refresh"
                severity="secondary"
                [outlined]="true"
                styleClass="refresh-button"
                pTooltip="Refresh quotations"
                (onClick)="ResetTable()"
              ></p-button>
            </div>
          </div>

          <!-- Desktop table -->
          <div class="desktop-table">
            <p-table
              #fTable
              dataKey="id"
              [value]="PagingSignal().data || []"
              [paginator]="true"
              [rows]="Query.PageSize"
              [totalRecords]="PagingSignal().totalElements || 0"
              [rowsPerPageOptions]="[10, 20, 30, 50]"
              [lazy]="true"
              (onLazyLoad)="NextPage($event)"
              [expandedRowKeys]="expandedRows"
              [tableStyle]="{ 'min-width': '1050px' }"
              [showGridlines]="false"
              [rowHover]="true"
              styleClass="quotation-table"
            >
              <ng-template #header>
                <tr>
                  <th class="expand-column"></th>

                  <th pSortableColumn="QuotationNo">
                    Quotation
                    <p-sortIcon field="QuotationNo"></p-sortIcon>
                  </th>

                  <th>Client</th>
                  <th>Created By</th>

                  <th pSortableColumn="QuotationDate">
                    Quotation Date
                    <p-sortIcon field="QuotationDate"></p-sortIcon>
                  </th>

                  <th pSortableColumn="DueDate">
                    Due Date
                    <p-sortIcon field="DueDate"></p-sortIcon>
                  </th>

                  <th pSortableColumn="Status">
                    Status
                    <p-sortIcon field="Status"></p-sortIcon>
                  </th>

                  <th class="action-column">Actions</th>
                </tr>
              </ng-template>

              <ng-template #body let-data let-expanded="expanded">
                <tr>
                  <td class="expand-cell">
                    <button
                      type="button"
                      class="expand-button"
                      [attr.aria-label]="
                        expanded
                          ? 'Collapse quotation history'
                          : 'Expand quotation history'
                      "
                      (click)="onRowExpand(data, fTable)"
                    >
                      <i
                        [class]="
                          expanded
                            ? 'pi pi-chevron-down'
                            : 'pi pi-chevron-right'
                        "
                      ></i>
                    </button>
                  </td>

                  <td>
                    <div class="quotation-number">
                      <span class="quotation-number-icon">
                        <i class="pi pi-file"></i>
                      </span>
                      <span>{{ data.quotationNo }}</span>
                    </div>
                  </td>

                  <td>
                    <div class="client-cell">
                      <span class="client-name">
                        {{ data.client.name || '—' }}
                      </span>
                    </div>
                  </td>

                  <td>
                    <span class="muted-cell">
                      {{ data.createdBy.displayName || '—' }}
                    </span>
                  </td>

                  <td>
                    <span class="date-cell">
                      {{ data.quotationDate | date: 'dd MMM yyyy' }}
                    </span>
                  </td>

                  <td>
                    <span class="date-cell">
                      {{ data.dueDate | date: 'dd MMM yyyy' }}
                    </span>
                  </td>

                  <td>
                    <span
                      class="status-badge"
                      [ngClass]="{
                        'status-draft': data.status === 'Draft',
                        'status-progress':
                          data.status === 'Reviewed' ||
                          data.status === 'Sent' ||
                          data.status === 'Approved',
                        'status-accepted': data.status === 'Accepted',
                        'status-rejected':
                          data.status === 'Rejected' ||
                          data.status === 'Cancelled' ||
                          data.status === 'Expired',
                      }"
                    >
                      <span class="status-dot"></span>
                      {{ data.status }}
                    </span>
                  </td>

                  <td>
                    <div class="table-actions">
                      <p-button
                        label="Convert to SO"
                        icon="pi pi-arrow-right-arrow-left"
                        size="small"
                        [outlined]="true"
                        severity="info"
                        styleClass="convert-button"
                        [disabled]="data.status !== 'Sent'"
                        (onClick)="ActionClick(data, 'Convert')"
                      ></p-button>

                      <button
                        *ngIf="data.status !== 'Cancelled'"
                        type="button"
                        class="icon-action-button"
                        aria-label="Quotation actions"
                        (click)="onEllipsisClick($event, data, menu)"
                      >
                        <i class="pi pi-ellipsis-v"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </ng-template>

              <!-- Expanded quotation history -->
              <ng-template #expandedrow let-item>
                <tr>
                  <td colspan="8">
                    <div class="history-container">
                      <div class="history-heading">
                        <i class="pi pi-history"></i>
                        <span>Quotation Status History</span>
                      </div>

                      <p-timeline
                        [value]="timelineMap[item.id] || []"
                        align="top"
                        layout="horizontal"
                        class="quotation-timeline"
                      >
                        <ng-template #marker let-event>
                          <div
                            class="timeline-marker"
                            [class.timeline-marker-active]="event.actionAt"
                          >
                            <i
                              class="pi"
                              [ngClass]="
                                event.verified ? 'pi-check' : 'pi-circle-fill'
                              "
                            ></i>
                          </div>
                        </ng-template>

                        <ng-template #content let-event>
                          <div class="timeline-content">
                            <span class="timeline-status">
                              {{ event.status }}
                            </span>

                            <span
                              *ngIf="event.actionUser"
                              class="timeline-user"
                            >
                              {{ event.actionUser }}
                            </span>

                            <span *ngIf="event.actionAt" class="timeline-date">
                              {{ event.actionAt | date: 'dd MMM yyyy, h:mm a' }}
                            </span>
                          </div>
                        </ng-template>
                      </p-timeline>
                    </div>
                  </td>
                </tr>
              </ng-template>

              <ng-template #emptymessage>
                <tr>
                  <td colspan="8">
                    <div class="empty-state">
                      <div class="empty-icon">
                        <i class="pi pi-folder-open"></i>
                      </div>
                      <h3>No quotations found</h3>
                      <p>Try changing your search or create a new quotation.</p>
                      <p-button
                        label="Create Quotation"
                        icon="pi pi-plus"
                        size="small"
                        styleClass="bg-blue-700! border-none! hover:bg-blue-500! py-3! px-5!"
                        [routerLink]="'/quotations/form'"
                      ></p-button>
                    </div>
                  </td>
                </tr>
              </ng-template>
            </p-table>
          </div>

          <!-- Mobile quotation cards -->
          <div class="mobile-quotation-list">
            <div
              *ngIf="!PagingSignal().data?.length"
              class="empty-state mobile-empty-state"
            >
              <div class="empty-icon">
                <i class="pi pi-folder-open"></i>
              </div>
              <h3>No quotations found</h3>
              <p>There are no quotation records to display.</p>
            </div>

            <article
              *ngFor="let data of PagingSignal().data || []"
              class="mobile-quotation-card"
            >
              <div class="mobile-card-top">
                <div class="mobile-quotation-number">
                  <div class="mobile-file-icon">
                    <i class="pi pi-file"></i>
                  </div>

                  <div>
                    <span class="mobile-field-label">Quotation No.</span>
                    <strong>{{ data.quotationNo }}</strong>
                  </div>
                </div>

                <button
                  *ngIf="data.status !== 'Cancelled'"
                  type="button"
                  class="icon-action-button"
                  aria-label="Quotation actions"
                  (click)="onEllipsisClick($event, data, menu)"
                >
                  <i class="pi pi-ellipsis-v"></i>
                </button>
              </div>

              <div class="mobile-card-client">
                {{ data.client.name || 'No client information' }}
              </div>

              <div class="mobile-card-details">
                <div>
                  <span class="mobile-field-label">Quotation Date</span>
                  <span>{{ data.quotationDate | date: 'dd MMM yyyy' }}</span>
                </div>

                <div>
                  <span class="mobile-field-label">Due Date</span>
                  <span>{{ data.dueDate | date: 'dd MMM yyyy' }}</span>
                </div>

                <div>
                  <span class="mobile-field-label">Created By</span>
                  <span>{{ data.createdBy.displayName || '—' }}</span>
                </div>

                <div>
                  <span class="mobile-field-label">Status</span>
                  <span
                    class="status-badge"
                    [ngClass]="{
                      'status-draft': data.status === 'Draft',
                      'status-progress':
                        data.status === 'Reviewed' ||
                        data.status === 'Sent' ||
                        data.status === 'Approved',
                      'status-accepted': data.status === 'Accepted',
                      'status-rejected':
                        data.status === 'Rejected' ||
                        data.status === 'Cancelled' ||
                        data.status === 'Expired',
                    }"
                  >
                    <span class="status-dot"></span>
                    {{ data.status }}
                  </span>
                </div>
              </div>

              <div class="mobile-card-footer">
                <button
                  type="button"
                  class="history-button"
                  (click)="openDetailsDrawer(data)"
                >
                  <i class="pi pi-eye"></i>
                  View Details
                </button>

                <p-button
                  label="Convert to SO"
                  icon="pi pi-arrow-right-arrow-left"
                  size="small"
                  severity="info"
                  [outlined]="true"
                  [disabled]="data.status !== 'Sent'"
                  styleClass="mobile-convert-button"
                  (onClick)="ActionClick(data, 'Convert')"
                ></p-button>
              </div>
            </article>

            <!-- Mobile pagination -->
            <p-paginator
              [first]="((Query.Page || 1) - 1) * (Query.PageSize || 10)"
              [rows]="Query.PageSize || 10"
              [totalRecords]="PagingSignal().totalElements || 0"
              [rowsPerPageOptions]="[10, 20, 30]"
              (onPageChange)="NextPage($event)"
            ></p-paginator>
          </div>
        </section>
      </div>
    </div>

    <p-menu
      #menu
      [model]="menuItems"
      [popup]="true"
      [style]="{ transform: 'translate(20px, 8px)' }"
    ></p-menu>

    <p-dialog
      [(visible)]="displayConvertSODialog"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [closable]="true"
      [dismissableMask]="false"
      [style]="{ width: '480px' }"
      [breakpoints]="{
        '768px': '90vw',
        '480px': 'calc(100vw - 24px)',
      }"
      styleClass="quotation-convert-dialog"
      (onHide)="resetConvertForm()"
    >
      <!-- Dialog Header -->
      <ng-template #header>
        <div class="convert-dialog-header">
          <div class="convert-header-icon">
            <i class="pi pi-file-edit"></i>
          </div>

          <div class="convert-header-text">
            <h2>Convert to Sales Order</h2>
            <p>Provide the client's purchase order details.</p>
          </div>
        </div>
      </ng-template>

      <!-- Dialog Content -->
      <div class="convert-dialog-content">
        <!-- Information -->
        <div class="convert-info-banner">
          <i class="pi pi-info-circle"></i>

          <div>
            <span class="font-semibold">Before you continue</span>
            <p>
              Please provide the client's PO number and attach the official
              purchase order document.
            </p>
          </div>
        </div>

        <!-- Client PO Number -->
        <div class="convert-form-field">
          <label for="clientPONumber">
            Client PO Number
            <span class="required-mark">*</span>
          </label>

          <input
            id="clientPONumber"
            type="text"
            pInputText
            [(ngModel)]="soForm.clientPONumber"
            placeholder="e.g. PO-12345"
            maxlength="100"
            autocomplete="off"
            class="w-full"
          />

          <small class="field-hint">
            Enter the purchase order number provided by the client.
          </small>
        </div>

        <!-- PO Received Date -->
        <div class="convert-form-field">
          <label for="clientPODate">
            PO Received Date
            <span class="optional-mark">Optional</span>
          </label>

          <p-datepicker
            inputId="clientPODate"
            [(ngModel)]="soForm.clientPODate"
            appendTo="body"
            [showIcon]="true"
            [showButtonBar]="true"
            dateFormat="dd/mm/yy"
            placeholder="Select received date"
            inputStyleClass="w-full"
            styleClass="w-full"
          ></p-datepicker>

          <small class="field-hint">
            Select the date the purchase order was received.
          </small>
        </div>

        <!-- Remarks -->
        <div class="convert-form-field">
          <label for="soRemarks">
            Remarks
            <span class="optional-mark">Optional</span>
          </label>

          <textarea
            id="soRemarks"
            pInputText
            [(ngModel)]="soForm.remarks"
            placeholder="Add any additional notes..."
            rows="3"
            maxlength="1000"
            class="w-full resize-none"
          ></textarea>
        </div>

        <!-- Attachment -->
        <div class="convert-form-field">
          <label>
            Client PO Attachment
            <span class="required-mark">*</span>
          </label>

          <input
            #fileInput
            type="file"
            id="poFile"
            accept=".pdf,.png,.jpg,.jpeg"
            (change)="onFileSelected($event)"
            class="hidden"
          />

          <!-- No file selected -->
          <div
            *ngIf="!soForm.clientPOAttachment"
            class="attachment-upload-area"
            (click)="fileInput.click()"
            (keydown.enter)="fileInput.click()"
            (keydown.space)="fileInput.click(); $event.preventDefault()"
            tabindex="0"
            role="button"
            aria-label="Choose purchase order attachment"
          >
            <div class="upload-icon">
              <i class="pi pi-cloud-upload"></i>
            </div>

            <div class="upload-text">
              <span>
                Click to upload
                <strong>or browse files</strong>
              </span>

              <small
                >PDF, PNG or JPG (maximum file size depends on server
                limits)</small
              >
            </div>
          </div>

          <!-- File selected -->
          <div
            *ngIf="soForm.clientPOAttachment as attachment"
            class="attachment-selected"
          >
            <div class="attachment-file-icon">
              <i
                class="pi"
                [ngClass]="
                  attachment.type === 'application/pdf'
                    ? 'pi-file-pdf'
                    : 'pi-image'
                "
              ></i>
            </div>

            <div class="attachment-file-info">
              <span class="attachment-file-name">
                {{ attachment.name }}
              </span>

              <span class="attachment-file-size">
                {{ formatFileSize(attachment.size) }}
              </span>
            </div>

            <div class="attachment-actions">
              <button
                type="button"
                class="attachment-action"
                title="Download selected file"
                (click)="downloadLocalFile(attachment)"
              >
                <i class="pi pi-download"></i>
              </button>

              <button
                type="button"
                class="attachment-action remove-attachment"
                title="Remove attachment"
                (click)="removeAttachment(fileInput)"
              >
                <i class="pi pi-trash"></i>
              </button>
            </div>
          </div>

          <small class="field-hint">
            <i class="pi pi-lock"></i>
            The purchase order will be attached to the generated Sales Order.
          </small>
        </div>
      </div>

      <!-- Dialog Footer -->
      <ng-template #footer>
        <div class="convert-dialog-footer">
          <p-button
            label="Cancel"
            severity="secondary"
            [outlined]="true"
            styleClass="cancel-convert-button"
            (onClick)="displayConvertSODialog = false"
          ></p-button>

          <p-button
            label="Convert to SO"
            icon="pi pi-arrow-right"
            iconPos="right"
            severity="success"
            styleClass="submit-convert-button"
            [disabled]="
              !soForm.clientPONumber.trim() || !soForm.clientPOAttachment
            "
            (onClick)="submitConvertToSO()"
          ></p-button>
        </div>
      </ng-template>
    </p-dialog>

    <p-drawer
      [(visible)]="displayDetailsDrawer"
      position="right"
      styleClass="quotation-details-drawer"
      [modal]="true"
      [showCloseIcon]="false"
      (onHide)="selectedQuotation = null"
    >
      <!-- Drawer Header -->
      <ng-template #header>
        <div class="quotation-drawer-header">
          <div class="flex items-center gap-3 min-w-0">
            <div class="quotation-header-icon">
              <i class="pi pi-file-edit"></i>
            </div>

            <div class="min-w-0">
              <h2 class="text-lg sm:text-xl font-bold text-slate-900">
                Quotation Details
              </h2>
              <p class="text-xs sm:text-sm text-slate-500 mt-1">
                Quotation information and pricing
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <span
              *ngIf="!loadingDetails && selectedQuotation"
              class="quotation-status"
              [ngClass]="{
                'status-draft': selectedQuotation.status === 'Draft',
                'status-reviewed': selectedQuotation.status === 'Reviewed',
                'status-sent': selectedQuotation.status === 'Sent',
                'status-approved': selectedQuotation.status === 'Approved',
                'status-accepted': selectedQuotation.status === 'Accepted',
                'status-rejected':
                  selectedQuotation.status === 'Rejected' ||
                  selectedQuotation.status === 'Cancelled' ||
                  selectedQuotation.status === 'Expired',
              }"
            >
              <i
                class="pi"
                [ngClass]="{
                  'pi-file-edit': selectedQuotation.status === 'Draft',
                  'pi-eye': selectedQuotation.status === 'Reviewed',
                  'pi-send': selectedQuotation.status === 'Sent',
                  'pi-check-circle':
                    selectedQuotation.status === 'Approved' ||
                    selectedQuotation.status === 'Accepted',
                  'pi-times-circle':
                    selectedQuotation.status === 'Rejected' ||
                    selectedQuotation.status === 'Cancelled' ||
                    selectedQuotation.status === 'Expired',
                }"
              ></i>
              {{ selectedQuotation.status }}
            </span>

            <p-button
              icon="pi pi-times"
              [rounded]="true"
              [text]="true"
              severity="secondary"
              ariaLabel="Close quotation details"
              styleClass="quotation-close-button"
              (onClick)="displayDetailsDrawer = false"
            ></p-button>
          </div>
        </div>
      </ng-template>

      <!-- Loading -->
      <div
        *ngIf="loadingDetails"
        class="flex flex-col items-center justify-center py-20 px-4"
      >
        <div class="quotation-loading-icon">
          <i class="pi pi-spin pi-spinner"></i>
        </div>

        <h3 class="text-base font-semibold text-slate-800 mt-4">
          Loading quotation details
        </h3>

        <p class="text-sm text-slate-500 mt-1 text-center">
          Please wait while we retrieve the quotation information.
        </p>
      </div>

      <!-- Drawer Content -->
      <div
        *ngIf="!loadingDetails && selectedQuotation"
        class="quotation-drawer-content"
      >
        <!-- Draft Notice -->
        <div
          *ngIf="selectedQuotation.status === 'Draft'"
          class="quotation-draft-notice"
        >
          <div class="flex items-start gap-3 min-w-0">
            <div class="quotation-notice-icon">
              <i class="pi pi-exclamation-triangle"></i>
            </div>

            <div class="min-w-0">
              <div class="font-semibold text-slate-900">
                This quotation is still in Draft
              </div>
              <p class="text-sm text-slate-600 mt-1">
                Review the quotation before sending it to the client.
              </p>
            </div>
          </div>

          <div class="quotation-notice-actions">
            <p-button
              label="Mark as Reviewed"
              icon="pi pi-check-circle"
              severity="success"
              styleClass="w-full sm:w-auto"
              (onClick)="
                updateQuotationStatus(selectedQuotation.id, 'Reviewed')
              "
            ></p-button>

            <p-button
              label="Cancel Quote"
              icon="pi pi-ban"
              severity="danger"
              [outlined]="true"
              styleClass="w-full sm:w-auto"
              (onClick)="
                updateQuotationStatus(selectedQuotation.id, 'Cancelled')
              "
            ></p-button>
          </div>
        </div>

        <!-- Quotation Summary -->
        <section class="quotation-section">
          <div class="quotation-summary">
            <div class="min-w-0">
              <span class="quotation-field-label">Quotation Number</span>
              <h2 class="quotation-number">
                {{ selectedQuotation.quotationNo || '-' }}
              </h2>
            </div>

            <div class="quotation-summary-date">
              <span class="quotation-field-label">Quotation Date</span>
              <div class="font-semibold text-slate-800">
                {{
                  selectedQuotation.quotationDate
                    ? (selectedQuotation.quotationDate | date: 'dd MMM yyyy')
                    : '-'
                }}
              </div>
            </div>
          </div>

          <div class="quotation-subject">
            <span class="quotation-field-label">Subject</span>
            <p class="text-base sm:text-lg font-semibold text-slate-900 mt-1">
              {{ selectedQuotation.subject || 'No subject provided' }}
            </p>
          </div>

          <!-- Company and Client -->
          <div class="quotation-parties-grid">
            <!-- From Company -->
            <div class="quotation-party-card quotation-party-company">
              <div class="quotation-party-heading">
                <div class="quotation-party-icon">
                  <i class="pi pi-building"></i>
                </div>

                <div>
                  <h3>From</h3>
                  <p>Your company information</p>
                </div>
              </div>

              <ng-container *ngIf="selectedQuotation.fromCompany as company">
                <h4 class="quotation-party-name">
                  {{ company.name || '-' }}
                </h4>

                <div class="quotation-address">
                  <div *ngIf="company.billingAddress?.addressLine1">
                    {{ company.billingAddress?.addressLine1 }}
                  </div>

                  <div *ngIf="company.billingAddress?.addressLine2">
                    {{ company.billingAddress?.addressLine2 }}
                  </div>

                  <div
                    *ngIf="
                      company.billingAddress?.city ||
                      company.billingAddress?.state
                    "
                  >
                    {{ company.billingAddress?.city }}
                    <span
                      *ngIf="
                        company.billingAddress?.city &&
                        company.billingAddress?.state
                      "
                      >,</span
                    >
                    {{ company.billingAddress?.state }}
                  </div>

                  <div *ngIf="company.billingAddress?.postcode">
                    {{ company.billingAddress?.postcode }}
                  </div>
                </div>

                <div class="quotation-party-contact">
                  <div *ngIf="company.contactNo" class="quotation-contact-row">
                    <i class="pi pi-phone"></i>
                    <span>{{ company.contactNo }}</span>
                  </div>

                  <div *ngIf="company.email" class="quotation-contact-row">
                    <i class="pi pi-envelope"></i>
                    <span class="break-all">{{ company.email }}</span>
                  </div>
                </div>
              </ng-container>

              <div
                *ngIf="!selectedQuotation.fromCompany"
                class="text-sm text-slate-400"
              >
                Company information unavailable.
              </div>
            </div>

            <!-- Client -->
            <div class="quotation-party-card quotation-party-client">
              <div class="quotation-party-heading">
                <div class="quotation-party-icon">
                  <i class="pi pi-user"></i>
                </div>

                <div>
                  <h3>Bill To</h3>
                  <p>Customer information</p>
                </div>
              </div>

              <ng-container *ngIf="selectedQuotation.client as client">
                <h4 class="quotation-party-name">
                  {{ client.name || '-' }}
                </h4>

                <div class="quotation-address">
                  <div *ngIf="client.billingAddress?.addressLine1">
                    {{ client.billingAddress?.addressLine1 }}
                  </div>

                  <div *ngIf="client.billingAddress?.addressLine2">
                    {{ client.billingAddress?.addressLine2 }}
                  </div>

                  <div
                    *ngIf="
                      client.billingAddress?.city ||
                      client.billingAddress?.state
                    "
                  >
                    {{ client.billingAddress?.city }}
                    <span
                      *ngIf="
                        client.billingAddress?.city &&
                        client.billingAddress?.state
                      "
                      >,</span
                    >
                    {{ client.billingAddress?.state }}
                  </div>

                  <div *ngIf="client.billingAddress?.postcode">
                    {{ client.billingAddress?.postcode }}
                  </div>
                </div>

                <div class="quotation-party-contact">
                  <div
                    *ngIf="client.contactPerson1"
                    class="quotation-contact-row"
                  >
                    <i class="pi pi-user"></i>
                    <span>{{ client.contactPerson1 }}</span>
                  </div>

                  <div *ngIf="client.contactNo" class="quotation-contact-row">
                    <i class="pi pi-phone"></i>
                    <span>{{ client.contactNo }}</span>
                  </div>

                  <div *ngIf="client.email" class="quotation-contact-row">
                    <i class="pi pi-envelope"></i>
                    <span class="break-all">{{ client.email }}</span>
                  </div>
                </div>
              </ng-container>

              <div
                *ngIf="!selectedQuotation.client"
                class="text-sm text-slate-400"
              >
                Client information unavailable.
              </div>
            </div>
          </div>

          <!-- Project Code -->
          <div
            *ngIf="selectedQuotation.projectCode"
            class="quotation-project-code"
          >
            <div class="flex items-center gap-2">
              <i class="pi pi-briefcase"></i>
              <span>Project Code</span>
            </div>

            <span class="font-mono font-semibold text-slate-800">
              {{ selectedQuotation.projectCode }}
            </span>
          </div>
        </section>

        <!-- Line Items -->
        <section class="quotation-section">
          <div class="quotation-section-heading">
            <div class="quotation-section-icon">
              <i class="pi pi-list"></i>
            </div>

            <div>
              <h3>Line Items</h3>
              <p>Quotation items and pricing breakdown</p>
            </div>
          </div>

          <div class="quotation-table-wrapper">
            <p-table
              [value]="getSortedQuotationItems()"
              [showGridlines]="true"
              styleClass="quotation-items-table"
              responsiveLayout="scroll"
            >
              <ng-template #header>
                <tr>
                  <th class="text-center! min-w-[65px]!">Item</th>
                  <th class="min-w-[220px]!">Description</th>
                  <th class="text-center! min-w-[80px]!">Unit</th>
                  <th class="text-center! min-w-[75px]!">Qty</th>
                  <th class="text-right! min-w-[130px]!">Unit Price (RM)</th>
                  <th class="text-right! min-w-[130px]!">Total (RM)</th>
                </tr>
              </ng-template>

              <ng-template #body let-item>
                <tr
                  *ngIf="item.type === 'Category'"
                  class="quotation-category-row"
                >
                  <td colspan="6">
                    <span [innerHTML]="item.description"></span>
                  </td>
                </tr>

                <tr *ngIf="item.type === 'Item'">
                  <td class="text-center!">
                    {{ item.item || '-' }}
                  </td>

                  <td>
                    <div
                      class="text-sm text-slate-700 leading-relaxed"
                      [innerHTML]="item.description"
                    ></div>
                  </td>

                  <td class="text-center!">
                    {{ item.unit || '-' }}
                  </td>

                  <td class="text-center! font-medium">
                    {{ item.quantity || '-' }}
                  </td>

                  <td class="text-right! font-mono">
                    {{
                      item.unitPrice != null
                        ? (item.unitPrice | number: '1.2-2')
                        : '-'
                    }}
                  </td>

                  <td
                    class="text-right! font-mono font-semibold text-slate-900"
                  >
                    {{
                      item.totalPrice != null
                        ? (item.totalPrice | number: '1.2-2')
                        : '-'
                    }}
                  </td>
                </tr>
              </ng-template>

              <ng-template #emptymessage>
                <tr>
                  <td colspan="6" class="text-center! py-10">
                    <div class="flex flex-col items-center gap-2">
                      <i class="pi pi-inbox text-3xl text-slate-300"></i>
                      <span class="font-semibold text-slate-600">
                        No line items found
                      </span>
                      <span class="text-sm text-slate-400">
                        This quotation does not contain any items.
                      </span>
                    </div>
                  </td>
                </tr>
              </ng-template>

              <ng-template #footer>
                <tr class="quotation-subtotal-row">
                  <td colspan="5" class="text-right!">Subtotal</td>
                  <td class="text-right! font-mono">
                    {{ selectedQuotation.subTotal | number: '1.2-2' }}
                  </td>
                </tr>

                <tr
                  *ngIf="
                    selectedQuotation.discount != null &&
                    selectedQuotation.discount !== 0
                  "
                  class="quotation-discount-row"
                >
                  <td colspan="5" class="text-right!">Discount</td>
                  <td class="text-right! font-mono">
                    -{{ selectedQuotation.discount | number: '1.2-2' }}
                  </td>
                </tr>

                <tr class="quotation-total-row">
                  <td colspan="5" class="text-right!">Total Amount</td>
                  <td class="text-right! font-mono">
                    {{
                      selectedQuotation.totalAmount
                        | currency: 'RM ' : 'symbol' : '1.2-2'
                    }}
                  </td>
                </tr>
              </ng-template>
            </p-table>
          </div>
        </section>

        <!-- Terms and Conditions -->
        <section class="quotation-section">
          <div class="quotation-section-heading">
            <div class="quotation-section-icon terms-icon">
              <i class="pi pi-file-edit"></i>
            </div>

            <div>
              <h3>Terms & Conditions</h3>
              <p>Commercial terms for this quotation</p>
            </div>
          </div>

          <div class="quotation-terms">
            <div class="quotation-term-row">
              <span class="quotation-term-label">Payment Terms</span>
              <span class="quotation-term-value">
                {{ selectedQuotation.paymentTerms || '-' }}
              </span>
            </div>

            <div class="quotation-term-row">
              <span class="quotation-term-label">Validity</span>
              <span class="quotation-term-value">
                <ng-container
                  *ngIf="
                    selectedQuotation.validity ||
                      selectedQuotation.validityType;
                    else noValidity
                  "
                >
                  {{ selectedQuotation.validity || '' }}
                  {{ selectedQuotation.validityType || '' }}
                  <span class="text-slate-500">
                    (with effect from the date of this quotation)
                  </span>
                </ng-container>

                <ng-template #noValidity>-</ng-template>
              </span>
            </div>

            <div class="quotation-term-row">
              <span class="quotation-term-label">Execution</span>
              <span class="quotation-term-value">
                {{ selectedQuotation.execution || '-' }}
              </span>
            </div>

            <div class="quotation-term-row">
              <span class="quotation-term-label">Warranty</span>
              <span class="quotation-term-value">
                {{ selectedQuotation.warrantyTerms || '-' }}
              </span>
            </div>
          </div>

          <!-- Remarks -->
          <div *ngIf="selectedQuotation.remarks" class="quotation-remarks">
            <div class="flex items-center gap-2 mb-2">
              <i class="pi pi-comment"></i>
              <span>Remarks</span>
            </div>

            <p>{{ selectedQuotation.remarks }}</p>
          </div>
        </section>

        <!-- Footer Actions -->
        <div class="quotation-drawer-footer">
          <div class="quotation-last-updated">
            <i class="pi pi-clock"></i>

            <span>
              Last updated:
              {{
                selectedQuotation.updatedAt
                  ? (selectedQuotation.updatedAt | date: 'dd MMM yyyy, h:mm a')
                  : (selectedQuotation.createdAt | date: 'dd MMM yyyy, h:mm a')
              }}
            </span>
          </div>

          <div class="quotation-footer-actions">
            <p-button
              label="Generate PDF"
              icon="pi pi-file-pdf"
              severity="danger"
              [outlined]="true"
              styleClass="w-full sm:w-auto"
              (onClick)="generatePDF()"
            ></p-button>

            <p-button
              *ngIf="selectedQuotation.status === 'Draft'"
              label="Edit Quotation"
              icon="pi pi-pencil"
              severity="info"
              styleClass="w-full sm:w-auto"
              (onClick)="ActionClick(selectedQuotation, 'Update')"
            ></p-button>

            <p-button
              *ngIf="selectedQuotation.status === 'Reviewed'"
              label="Mark as Sent"
              icon="pi pi-send"
              severity="info"
              styleClass="w-full sm:w-auto"
              (onClick)="updateQuotationStatus(selectedQuotation.id, 'Sent')"
            ></p-button>
          </div>
        </div>
      </div>
    </p-drawer> `,
  styleUrl: './quotation.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Quotation implements OnInit, OnDestroy {
  @ViewChild('fTable') fTable?: Table;

  private readonly quotationService = inject(QuotationService);
  private readonly userService = inject(UserService);
  private readonly loadingService = inject(LoadingService);
  private readonly messageService = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  PagingSignal = signal<PagingContent<QuotationDto>>(
    {} as PagingContent<QuotationDto>,
  );
  Query: GridifyQueryExtend = {} as GridifyQueryExtend;
  expandedRows: { [key: string]: boolean } = {};

  search: string = '';
  menuItems: MenuItem[] = [];
  events: any[] = [];

  displayReviseByDialog: boolean = false;
  displayConvertSODialog: boolean = false;
  displayDetailsDrawer: boolean = false;
  loadingDetails: boolean = false;

  selectedQuotation: any;

  currentUser = this.userService.currentUser;

  reviewerSelection: { label: string; value: string }[] = [];

  isAdmin: boolean = false;

  timelineMap: { [key: string]: any[] } = {};

  soForm = {
    quotationData: null as any,
    clientPONumber: '',
    clientPODate: '',
    remarks: '',
    clientPOAttachment: null as File | null,
  };

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 10;
    this.Query.Filter = null;
    this.Query.OrderBy = 'CreatedAt desc';
    this.Query.Select = null;
    this.Query.Includes =
      'FromCompany.BillingAddress,Client.BillingAddress,QuotationStatusHistories,QuotationStatusHistories.ActionUser,QuotationItems,Project';
  }

  ngOnInit(): void {}

  GetData() {
    this.loadingService.start();

    this.quotationService
      .GetMany(this.Query)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();
          this.PagingSignal.set(res);

          const statusOrder = [
            'Draft',
            'Approved',
            'Sent',
            'Accepted',
            'Rejected',
            'Cancelled',
            'Expired',
          ];

          const allHistories = res.data.flatMap(
            (x) => x.quotationStatusHistories || [],
          );

          const latestByStatus = new Map<string, any>();

          for (const h of allHistories) {
            const existing = latestByStatus.get(h.status);

            if (
              !existing ||
              new Date(h.actionAt) > new Date(existing.actionAt)
            ) {
              latestByStatus.set(h.status, h);
            }
          }

          const reachedIndex =
            Math.max(
              ...allHistories.map((h) => statusOrder.indexOf(h.status)),
            ) ?? -1;

          this.events = statusOrder.map((status, index) => {
            const item = latestByStatus.get(status);

            return {
              status,
              actionAt: item?.actionAt ?? null,
              actionUser: item?.actionUser?.displayName,
              verified: index <= reachedIndex,
            };
          });

          this.cdr.markForCheck();
        },
        error: () => {
          this.loadingService.stop();
        },
      });
  }

  NextPage(event: TableLazyLoadEvent) {
    if ((event?.first || event?.first === 0) && event?.rows) {
      this.Query.Page = event.first / event.rows + 1 || 1;
      this.Query.PageSize = event.rows;
    }

    const sortText = BuildSortText(event);
    this.Query.OrderBy = sortText ? sortText : 'CreatedAt desc';

    this.Query.Filter = BuildFilterText(event);

    this.GetData();
  }

  onKeyDown(event: KeyboardEvent) {
    const isEnter = event.key === 'Enter';
    const isBackspaceClear = event.key === 'Backspace' && this.search === '';

    if (isEnter) {
      this.Search(this.search);
    } else if (isBackspaceClear) {
      this.Search('');
    }
  }

  Search(data: string) {
    const filter = {
      QuotationNo: [
        {
          value: data,
          matchMode: '=',
          operator: 'and',
        },
      ],
    };

    if (this.fTable != null) {
      this.fTable.first = 0;
      this.fTable.filters = filter;
    }

    const event: TableLazyLoadEvent = {
      first: 0,
      rows: this.fTable?.rows,
      sortField: null,
      sortOrder: null,
      filters: filter,
    };

    this.NextPage(event);
  }

  ResetTable() {
    this.search = '';

    if (this.fTable) {
      this.fTable.first = 0;
      this.fTable.clearFilterValues();
      this.fTable.saveState();
    }

    this.Query.Filter = null;
    this.GetData();
  }

  ActionClick(data: QuotationDto | null, action: string) {
    if (!data) return;

    if (action === 'Update') {
      this.router.navigate(['/quotations/form'], {
        queryParams: { id: data.id },
      });
    } else if (action === 'Convert') {
      this.soForm.quotationData = data;
      this.displayConvertSODialog = true;
      this.cdr.markForCheck();
    } else if (action === 'Download') {
      // this.quotationService.downloadPdf(data.id);
    } else if (action === 'Reviewed') {
      this.selectedQuotation = data;
      this.displayDetailsDrawer = true;
    }
  }

  onRowExpand(data: QuotationDto, table: Table) {
    if (!this.timelineMap[data.id]) {
      this.timelineMap[data.id] = this.buildTimeline(data);
    }

    table.toggleRow(data);
  }

  onEllipsisClick(event: any, quotation: QuotationDto, menu: any) {
    const status = quotation.status;

    this.menuItems = [];

    if (status === 'Draft') {
      this.menuItems.push(
        {
          label: 'Edit',
          icon: 'pi pi-pencil',
          command: () => this.ActionClick(quotation, 'Update'),
        },
        {
          label: 'Review',
          icon: 'pi pi-file-edit',
          command: () =>
            this.router.navigate(['/quotations/details'], {
              queryParams: { id: quotation.id },
            }),
        },
      );
    }

    if (status === 'Sent') {
      this.menuItems.push(
        // {
        //   label: 'Convert to SO',
        //   icon: 'pi pi-file',
        //   command: () => this.ActionClick(quotation, 'Convert'),
        // },
        {
          label: 'Rejected',
          icon: 'pi pi-times-circle',
          command: () => this.updateQuotationStatus(quotation.id, 'Rejected'),
        },
        {
          label: 'View Details',
          icon: 'pi pi-eye',
          command: () =>
            this.router.navigate(['/quotations/details'], {
              queryParams: { id: quotation.id },
            }),
        },
      );
    }

    if (status === 'Approved') {
      this.menuItems.push(
        {
          label: 'Mark As Sent',
          icon: 'pi pi-send',
          command: () => this.updateQuotationStatus(quotation.id, 'Sent'),
        },
        {
          label: 'Cancel',
          icon: 'pi pi-times-circle',
          command: () => this.updateQuotationStatus(quotation.id, 'Cancelled'),
        },
        {
          label: 'View Details',
          icon: 'pi pi-eye',
          command: () =>
            this.router.navigate(['/quotations/details'], {
              queryParams: { id: quotation.id },
            }),
        },
      );
    }

    if (status === 'Draft') {
      this.menuItems.push({
        label: 'Delete',
        icon: 'pi pi-trash',
        command: () => this.deleteQuotation(quotation.id),
      });
    }

    if (status === 'Accepted') {
      this.menuItems.push(
        {
          label: 'View Details',
          icon: 'pi pi-eye',
          command: () =>
            this.router.navigate(['/quotations/details'], {
              queryParams: { id: quotation.id },
            }),
        },
        {
          label: 'Download as PDF',
          icon: 'pi pi-file-pdf',
          command: () => this.ActionClick(quotation, 'Download'),
        },
        // { separator: true },
        // {
        //   label: 'Attach PO',
        //   icon: 'pi pi-paperclip',
        //   command: () => this.ActionClick(quotation, 'PO'),
        // },
        // {
        //   label: 'Attach Work Order',
        //   icon: 'pi pi-paperclip',
        //   command: () => this.ActionClick(quotation, 'WO'),
        // },
        // {
        //   label: 'Attach Bill',
        //   icon: 'pi pi-paperclip',
        //   command: () => this.ActionClick(quotation, 'Bill'),
        // },
      );
    } else if (status === 'Rejected' || status == 'Expired') {
      this.menuItems.push({
        label: 'View Details',
        icon: 'pi pi-eye',
        command: () =>
          this.router.navigate(['/quotations/details'], {
            queryParams: { id: quotation.id },
          }),
      });
    }

    if (this.menuItems.length > 0) {
      menu.toggle(event);
    }
  }

  openDetailsDrawer(data: QuotationDto) {
    this.displayDetailsDrawer = true;
    this.loadingDetails = true;
    setTimeout(() => {
      this.selectedQuotation = data;
      this.loadingDetails = false;
    }, 100);
    this.cdr.markForCheck();
  }

  updateQuotationStatus(id: string, newStatus: string) {
    this.loadingService.start();

    this.quotationService
      .UpdateStatus(id, newStatus)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res: any) => {
          this.loadingService.stop();

          const currentPaging = this.PagingSignal();

          const updatedData = currentPaging.data.map((q) => {
            if (q.id !== id) return q;

            const newHistory = {
              id: res.id,
              status: res.status,
              actionAt: res.actionAt,
              remarks: res.remarks,
              actionUser: res.actionUser,
              quotationId: id,
              actionUserId: res.actionUser?.id,
              createdAt: res.actionAt,
              signatureImage: null,
            } as any;

            const updatedHistories = [
              ...(q.quotationStatusHistories || []),
              newHistory,
            ];

            const updatedQuotation = {
              ...q,
              status: res.status,
              quotationStatusHistories: updatedHistories,
            };

            this.timelineMap = {
              ...this.timelineMap,
              [id]: this.buildTimeline(updatedQuotation),
            };

            return updatedQuotation;
          });

          this.PagingSignal.set({
            ...currentPaging,
            data: updatedData,
          });

          this.messageService.add({
            severity: 'success',
            summary: 'Status Updated',
            detail: `Quotation is now ${res.status}`,
          });
          this.displayDetailsDrawer = false;
          this.cdr.markForCheck();
        },

        error: (err) => {
          this.loadingService.stop();

          this.messageService.add({
            severity: 'error',
            summary: 'Update Failed',
            detail: err.error?.error || 'Invalid status transition.',
          });
        },
      });
  }

  getSortedQuotationItems() {
    if (!this.selectedQuotation?.quotationItems) {
      return [];
    }

    const items = [...this.selectedQuotation.quotationItems];

    items.sort((a, b) => {
      const orderA = a.sortOrder ?? 999999;
      const orderB = b.sortOrder ?? 999999;
      return orderA - orderB;
    });

    return items;
  }

  generatePDF() {}

  buildTimeline(quotation: QuotationDto): any[] {
    const statusOrder = [
      'Draft',
      'Approved',
      'Sent',
      'Accepted',
      'Rejected',
      'Cancelled',
      'Expired',
    ];

    const histories = quotation.quotationStatusHistories || [];
    const latestByStatus = new Map<string, any>();

    for (const h of histories) {
      const existing = latestByStatus.get(h.status);

      if (!existing || new Date(h.actionAt) > new Date(existing.actionAt)) {
        latestByStatus.set(h.status, h);
      }
    }

    const reachedIndex =
      Math.max(...histories.map((h) => statusOrder.indexOf(h.status))) ?? -1;

    return statusOrder.map((status, index) => {
      const item = latestByStatus.get(status);

      return {
        status,
        actionAt: item?.actionAt ?? null,
        actionUser: item?.actionUser?.displayName || 'System',
        verified: index <= reachedIndex,
      };
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg'];

    if (!allowedTypes.includes(file.type)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Invalid File',
        detail: 'Only PDF, PNG and JPG files are allowed.',
      });

      input.value = '';
      return;
    }

    this.soForm.clientPOAttachment = file;
    this.cdr.markForCheck();
  }

  submitConvertToSO() {
    if (
      !this.soForm.clientPONumber ||
      !this.soForm.clientPOAttachment ||
      !this.soForm.quotationData
    ) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please provide a PO Number and upload an attachment file.',
      });
      return;
    }

    this.loadingService.start();
    this.displayConvertSODialog = false;

    const quotationId = this.soForm.quotationData.id;

    let formattedPODate: string | undefined = undefined;
    if (this.soForm.clientPODate) {
      const dateObj = new Date(this.soForm.clientPODate);
      if (!isNaN(dateObj.getTime())) {
        formattedPODate = dateObj.toISOString().split('T')[0];
      }
    }

    this.quotationService
      .ConvertToSalesOrder(
        quotationId,
        this.soForm.clientPONumber,
        formattedPODate || undefined,
        this.soForm.clientPOAttachment || undefined,
        this.soForm.remarks || undefined,
      )
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res: any) => {
          this.loadingService.stop();
          this.messageService.add({
            severity: 'success',
            summary: 'Converted Successfully',
            detail: `Sales Order generated: ${res.salesOrderNo}`,
          });

          const currentPaging = this.PagingSignal();

          const newHistory: QuotationStatusHistory = {
            id: res.id ?? crypto.randomUUID(),
            status: 'Accepted',
            actionAt: new Date(),
            remarks: `Converted into Sales Order ${res.salesOrderNo}`,
            actionUser: this.currentUser
              ? {
                  id: this.currentUser.userId,
                  fullName: this.currentUser.fullName,
                }
              : undefined,
            actionUserId: this.currentUser?.userId || '',
            quotationId: quotationId,

            quotation: null as any,
          };

          const updatedData: QuotationDto[] = currentPaging.data.map((q) => {
            if (q.id !== quotationId) return q;

            const updatedHistories: QuotationStatusHistory[] = [
              ...(q.quotationStatusHistories || []),
              newHistory,
            ];

            const updatedQuotation: QuotationDto = {
              ...q,
              status: 'Accepted',
              quotationStatusHistories: updatedHistories,
            };

            this.timelineMap = {
              ...this.timelineMap,
              [quotationId]: this.buildTimeline(updatedQuotation),
            };

            return updatedQuotation;
          });

          this.PagingSignal.set({
            ...currentPaging,
            data: updatedData,
          });
          this.resetConvertForm();
          this.cdr.markForCheck();
        },
        error: () => {
          this.loadingService.stop();
        },
      });
  }

  downloadLocalFile(file: File | null) {
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);

    const tempAnchor = document.createElement('a');
    tempAnchor.href = objectUrl;
    tempAnchor.download = file.name;

    document.body.appendChild(tempAnchor);
    tempAnchor.click();

    document.body.removeChild(tempAnchor);
    URL.revokeObjectURL(objectUrl);
  }

  resetConvertForm() {
    this.soForm = {
      quotationData: null,
      clientPONumber: '',
      clientPODate: '',
      remarks: '',
      clientPOAttachment: null,
    };
  }

  convert(type: 'Invoice' | 'SO', data: any) {
    // this.loadingService.start();
    // const action$: Observable<any> =
    //   type === 'Invoice'
    //     ? this.quotationService.ConvertToInvoice(data.id)
    //     : this.quotationService.ConvertToSalesOrder(data.id);
    // action$.subscribe({
    //   next: (res: any) => {
    //     this.loadingService.stop();
    //     this.messageService.add({
    //       severity: 'success',
    //       summary: 'Converted Successfully',
    //       detail: `${type} generated: ${res.invoiceNo || res.salesOrderNo}`,
    //     });
    //   },
    //   error: () => this.loadingService.stop(),
    // });
  }

  deleteQuotation(id: string) {
    this.loadingService.start();

    this.quotationService
      .Delete(id)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: () => {
          this.loadingService.stop();

          const current = this.PagingSignal();
          this.PagingSignal.set({
            ...current,
            data: current.data.filter((x) => x.id !== id),
          });

          this.messageService.add({
            severity: 'success',
            summary: 'Deleted',
            detail: 'Quotation removed successfully',
          });

          this.cdr.markForCheck();
        },
        error: () => {
          this.loadingService.stop();
        },
      });
  }

  exportToExcel() {
    this.quotationService.ExportToExcel().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;

        const fileName = `Quotation_${new Date().getTime()}.xlsx`;

        link.download = fileName;
        link.click();

        window.URL.revokeObjectURL(url);
      },
    });
  }

  formatFileSize(bytes: number): string {
    if (!bytes || bytes <= 0) {
      return '0 KB';
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  removeAttachment(fileInput: HTMLInputElement): void {
    this.soForm.clientPOAttachment = null;
    fileInput.value = '';
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
