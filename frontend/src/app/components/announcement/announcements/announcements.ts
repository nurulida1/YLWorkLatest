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

import { LoadingService } from '../../../services/loading.service';
import { NoticeService } from '../../../services/NoticeService';
import { UserService } from '../../../services/userService.service';

import { MessageService } from 'primeng/api';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { EditorModule } from 'primeng/editor';

import { finalize, Subject, takeUntil } from 'rxjs';

import {
  GridifyQueryExtend,
  PagingContent,
} from '../../../shared/helpers/helpers';

import { CreateNoticeRequest, Notice } from '../../../models/Notice';
import { environment } from '../../../../environments/environment.development';

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TableModule,
    PaginatorModule,
    ButtonModule,
    InputTextModule,
    DatePickerModule,
    CheckboxModule,
    DialogModule,
    TooltipModule,
    EditorModule,
  ],
  template: `
    <div class="announcement-page">
      <!-- Breadcrumb -->
      <nav class="breadcrumb">
        <a routerLink="/dashboard">
          <span>Dashboard</span>
        </a>

        <i class="pi pi-angle-right separator"></i>

        <span class="current">Announcements</span>
      </nav>

      <!-- Page Header -->
      <section class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <i class="pi pi-megaphone"></i>
          </div>

          <div class="header-text">
            <h1>Announcements</h1>
            <p>
              Stay updated with the latest company news, notices and important
              information.
            </p>
          </div>
        </div>

        <div class="header-actions">
          <button
            pButton
            type="button"
            icon="pi pi-refresh"
            label="Refresh"
            class="refresh-button"
            (click)="ResetTable()"
          ></button>

          @if (isHrOrSuperAdmin) {
            <button
              pButton
              type="button"
              icon="pi pi-plus"
              label="Add Notice"
              class="add-button"
              (click)="AddNotice()"
            ></button>
          }
        </div>
      </section>

      <!-- Summary -->
      <section class="summary-grid">
        <div class="summary-card">
          <div class="summary-icon total-icon">
            <i class="pi pi-megaphone"></i>
          </div>

          <div class="summary-content">
            <span class="summary-label">Total Announcements</span>
            <strong>{{ PagingSignal().totalElements }}</strong>
            <small>Recorded announcements</small>
          </div>
        </div>

        <div class="summary-card">
          <div class="summary-icon displayed-icon">
            <i class="pi pi-list"></i>
          </div>

          <div class="summary-content">
            <span class="summary-label">Announcements Displayed</span>
            <strong>{{ PagingSignal().data.length }}</strong>
            <small>Announcements on this page</small>
          </div>
        </div>
      </section>

      <!-- Announcement Section -->
      <section class="announcement-section">
        <!-- Section Header -->
        <div class="section-header">
          <div class="section-title">
            <h2>Announcement Records</h2>
            <p>View and manage published company announcements.</p>
          </div>

          <!-- Search -->
          <div class="search-container">
            <i class="pi pi-search search-icon"></i>

            <input
              pInputText
              type="text"
              [(ngModel)]="search"
              placeholder="Search announcements..."
              (keyup)="onKeyDown($event)"
            />

            @if (search) {
              <button
                type="button"
                class="clear-search"
                aria-label="Clear search"
                (click)="ResetTable()"
              >
                <i class="pi pi-times"></i>
              </button>
            }
          </div>
        </div>

        <!-- Desktop Table -->
        <div class="desktop-table">
          <p-table
            #fTable
            [value]="PagingSignal().data"
            [paginator]="true"
            [rows]="Query.PageSize"
            [first]="(Query.Page - 1) * Query.PageSize"
            [totalRecords]="PagingSignal().totalElements"
            [rowsPerPageOptions]="[10, 20, 30, 50]"
            [lazy]="true"
            [rowHover]="true"
            [showGridlines]="false"
            (onLazyLoad)="NextPage($event)"
            styleClass="announcement-table"
          >
            <ng-template #header>
              <tr>
                <th class="number-column">No.</th>
                <th class="title-column">Announcement</th>
                <th>Content</th>
                <th class="date-column">Publish Date</th>
                <th class="date-column">Expiry Date</th>
                <th class="creator-column">Created By</th>
                <th class="status-column">Status</th>

                @if (isHrOrSuperAdmin) {
                  <th class="action-column">Actions</th>
                }
              </tr>
            </ng-template>

            <ng-template #body let-data let-rowIndex="rowIndex">
              <tr>
                <td class="number-cell">
                  {{ (Query.Page - 1) * Query.PageSize + rowIndex + 1 }}
                </td>

                <!-- Title -->
                <td>
                  <div class="announcement-title">
                    <span>{{ data.title }}</span>

                    @if (data.isPinned) {
                      <span class="pinned-badge">
                        <i class="pi pi-thumbtack"></i>
                        Pinned
                      </span>
                    }
                  </div>
                </td>

                <!-- Content -->
                <td>
                  <button
                    type="button"
                    class="content-preview-btn"
                    [title]="plainText(data.content)"
                    (click)="openNotice(data)"
                  >
                    {{
                      previewText(data.content) || 'No content provided.'
                    }}
                    @if (hasMoreContent(data.content)) {
                      <span class="read-more">Read more</span>
                    }
                  </button>
                </td>

                <!-- Publish Date -->
                <td>
                  <div class="date-info">
                    <span class="date-main">
                      {{ data.publishDate | date: 'dd MMM yyyy' }}
                    </span>
                    <span class="date-sub">
                      {{ data.publishDate | date: 'hh:mm a' }}
                    </span>
                  </div>
                </td>

                <!-- Expiry Date -->
                <td>
                  @if (data.expiryDate) {
                    <div class="date-info">
                      <span class="date-main">
                        {{ data.expiryDate | date: 'dd MMM yyyy' }}
                      </span>
                      <span class="date-sub">
                        {{ data.expiryDate | date: 'hh:mm a' }}
                      </span>
                    </div>
                  } @else {
                    <span class="no-expiry">No expiry</span>
                  }
                </td>

                <!-- Created By -->
                <td>
                  <div class="creator-info">
                    <div class="creator-avatar">
                      <i class="pi pi-user text-sm!"></i>
                    </div>
                    <span>{{ data.createdByName || 'System' }}</span>
                  </div>
                </td>

                <!-- Status -->
                <td>
                  <div class="status-cell">
                    @if (data.isActive) {
                      <span class="status-badge active">
                        <i class="pi pi-check-circle"></i>
                        Active
                      </span>
                    } @else {
                      <span class="status-badge inactive">
                        <i class="pi pi-ban"></i>
                        Inactive
                      </span>
                    }
                  </div>
                </td>

                <!-- Actions -->
                @if (isHrOrSuperAdmin) {
                  <td>
                    <div class="action-cell">
                      <button
                        pButton
                        type="button"
                        icon="pi pi-trash"
                        severity="danger"
                        [outlined]="true"
                        [rounded]="true"
                        size="small"
                        pTooltip="Delete announcement"
                        tooltipPosition="top"
                        (click)="DeleteNotice(data)"
                      ></button>
                    </div>
                  </td>
                }
              </tr>
            </ng-template>

            <ng-template #emptymessage>
              <tr>
                <td [attr.colspan]="isHrOrSuperAdmin ? 8 : 7">
                  <div class="empty-state">
                    <div class="empty-icon">
                      <i class="pi pi-megaphone"></i>
                    </div>

                    <strong>No announcements found</strong>
                    <span>
                      There are currently no announcements matching your search.
                    </span>
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>

        <!-- Mobile Announcement Cards -->
        <div class="mobile-announcement-list">
          @if (PagingSignal().data.length > 0) {
            @for (data of PagingSignal().data; track data.id; let i = $index) {
              <article
                class="announcement-card is-clickable"
                role="button"
                tabindex="0"
                (click)="openNotice(data)"
                (keydown.enter)="openNotice(data)"
              >
                <div class="mobile-card-header">
                  <div class="mobile-title-group">
                    <div class="mobile-announcement-icon">
                      <i class="pi pi-megaphone"></i>
                    </div>

                    <div class="mobile-title-content">
                      <h3>{{ data.title }}</h3>

                      @if (data.isPinned) {
                        <span class="pinned-badge">
                          <i class="pi pi-thumbtack"></i>
                          Pinned
                        </span>
                      }

                      <div class="mobile-content">
                        {{
                          previewText(data.content) || 'No content provided.'
                        }}
                        @if (hasMoreContent(data.content)) {
                          <span class="read-more">Tap to read more</span>
                        }
                      </div>
                    </div>
                  </div>

                  <span class="mobile-record-number">
                    #{{ (Query.Page - 1) * Query.PageSize + i + 1 }}
                  </span>
                </div>

                <div class="mobile-date-grid">
                  <div class="mobile-date-item">
                    <span class="mobile-label">
                      <i class="pi pi-calendar"></i>
                      Publish Date
                    </span>

                    <strong>
                      {{ data.publishDate | date: 'dd MMM yyyy' }}
                    </strong>

                    <small>
                      {{ data.publishDate | date: 'hh:mm a' }}
                    </small>
                  </div>

                  <div class="mobile-date-item">
                    <span class="mobile-label">
                      <i class="pi pi-calendar-times"></i>
                      Expiry Date
                    </span>

                    @if (data.expiryDate) {
                      <strong>
                        {{ data.expiryDate | date: 'dd MMM yyyy' }}
                      </strong>
                      <small>
                        {{ data.expiryDate | date: 'hh:mm a' }}
                      </small>
                    } @else {
                      <strong class="no-expiry">No expiry</strong>
                    }
                  </div>
                </div>

                <div class="mobile-card-footer">
                  <div class="mobile-creator">
                    <div class="creator-avatar">
                      <i class="pi pi-user"></i>
                    </div>

                    <div>
                      <small>Created by</small>
                      <span>{{ data.createdBy?.displayName || 'System' }}</span>
                    </div>
                  </div>

                  <div class="mobile-actions">
                    @if (data.isActive) {
                      <span class="status-badge active">
                        <i class="pi pi-check-circle"></i>
                        Active
                      </span>
                    } @else {
                      <span class="status-badge inactive">
                        <i class="pi pi-ban"></i>
                        Inactive
                      </span>
                    }

                    @if (isHrOrSuperAdmin) {
                      <button
                        pButton
                        type="button"
                        icon="pi pi-trash"
                        severity="danger"
                        [outlined]="true"
                        [rounded]="true"
                        size="small"
                        aria-label="Delete announcement"
                        (click)="DeleteNotice(data); $event.stopPropagation()"
                      ></button>
                    }
                  </div>
                </div>
              </article>
            }
          } @else {
            <div class="empty-state mobile-empty">
              <div class="empty-icon">
                <i class="pi pi-megaphone"></i>
              </div>

              <strong>No announcements found</strong>
              <span>
                There are currently no announcements matching your search.
              </span>
            </div>
          }

          <!-- Mobile Pagination -->
          @if (PagingSignal().totalElements > 0) {
            <p-paginator
              [first]="(Query.Page - 1) * Query.PageSize"
              [rows]="Query.PageSize"
              [totalRecords]="PagingSignal().totalElements"
              [rowsPerPageOptions]="[10, 20, 30]"
              (onPageChange)="OnMobilePage($event)"
              styleClass="mobile-paginator"
            ></p-paginator>
          }
        </div>
      </section>
    </div>

    <!-- View Announcement Dialog -->
    <p-dialog
      [(visible)]="showViewDialog"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '720px', maxWidth: '95vw' }"
      [breakpoints]="{ '640px': '95vw' }"
      styleClass="announcement-view-dialog"
      (onHide)="closeNotice()"
    >
      <ng-template #header>
        <div class="view-dialog-header">
          <div class="view-dialog-icon">
            <i class="pi pi-megaphone"></i>
          </div>
          <div class="min-w-0">
            <h2>{{ selectedNotice?.title }}</h2>
            <div class="view-dialog-meta">
              @if (selectedNotice?.isPinned) {
                <span class="pinned-badge">
                  <i class="pi pi-thumbtack"></i>
                  Pinned
                </span>
              }
              <span>
                {{ selectedNotice?.publishDate | date: 'dd MMM yyyy, hh:mm a' }}
              </span>
            </div>
          </div>
        </div>
      </ng-template>

      @if (selectedNotice) {
        <div class="view-dialog-body">
          @if (selectedNotice.content) {
            <div
              class="announcement-full-content"
              [innerHTML]="selectedNotice.content"
            ></div>
          } @else {
            <p class="view-empty-content">No content provided.</p>
          }

          <div class="view-dialog-footer-meta">
            <span>
              <i class="pi pi-user"></i>
              {{
                selectedNotice.createdBy?.displayName ||
                  selectedNotice.createdByName ||
                  'System'
              }}
            </span>
            @if (selectedNotice.expiryDate) {
              <span>
                <i class="pi pi-clock"></i>
                Expires
                {{ selectedNotice.expiryDate | date: 'dd MMM yyyy' }}
              </span>
            }
          </div>
        </div>
      }

      <ng-template #footer>
        <div class="dialog-footer">
          <button
            pButton
            type="button"
            label="Close"
            severity="secondary"
            [outlined]="true"
            (click)="closeNotice()"
          ></button>
        </div>
      </ng-template>
    </p-dialog>

    <!-- Create Announcement Dialog -->
    <p-dialog
      header="Create Announcement"
      [(visible)]="showNoticeDialog"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '860px', maxWidth: '95vw' }"
      [breakpoints]="{ '640px': '95vw' }"
      styleClass="announcement-dialog"
      (onHide)="OnDialogHide()"
    >
      <div class="dialog-content">
        <div class="dialog-description">
          <div class="dialog-icon">
            <i class="pi pi-megaphone"></i>
          </div>

          <div>
            <strong>New company announcement</strong>
            <p>Share important updates and information with your employees.</p>
          </div>
        </div>

        <!-- Title -->
        <div class="form-field">
          <label for="noticeTitle">
            Announcement Title
            <span class="required">*</span>
          </label>

          <input
            id="noticeTitle"
            pInputText
            type="text"
            [(ngModel)]="noticeForm.title"
            placeholder="Enter announcement title"
            maxlength="200"
            class="w-full"
          />

          <small class="field-hint"> Maximum 200 characters. </small>
        </div>

        <!-- Content -->
        <div class="form-field">
          <label for="noticeContent">Announcement Content</label>

          <p-editor
            id="noticeContent"
            [(ngModel)]="noticeForm.content"
            [style]="{ height: '240px' }"
            placeholder="Write your announcement..."
            styleClass="announcement-content-editor"
            (onInit)="onContentEditorInit($event)"
          >
            <ng-template #header>
              <span class="ql-formats">
                <select class="ql-header">
                  <option value="1"></option>
                  <option value="2"></option>
                  <option value="3"></option>
                  <option selected></option>
                </select>
              </span>
              <span class="ql-formats">
                <button type="button" class="ql-bold" aria-label="Bold"></button>
                <button
                  type="button"
                  class="ql-italic"
                  aria-label="Italic"
                ></button>
                <button
                  type="button"
                  class="ql-underline"
                  aria-label="Underline"
                ></button>
                <button
                  type="button"
                  class="ql-strike"
                  aria-label="Strike"
                ></button>
              </span>
              <span class="ql-formats">
                <button
                  type="button"
                  class="ql-list"
                  value="ordered"
                  aria-label="Ordered List"
                ></button>
                <button
                  type="button"
                  class="ql-list"
                  value="bullet"
                  aria-label="Unordered List"
                ></button>
              </span>
              <span class="ql-formats">
                <button
                  type="button"
                  class="ql-link"
                  aria-label="Insert Link"
                ></button>
                <button
                  type="button"
                  class="ql-image"
                  aria-label="Insert Image"
                ></button>
                <button
                  type="button"
                  class="ql-clean"
                  aria-label="Remove Formatting"
                ></button>
              </span>
            </ng-template>
          </p-editor>
        </div>

        <!-- Publish Date -->
        <div class="form-field">
          <label for="publishDate">Publish Date</label>

          <p-datepicker
            inputId="publishDate"
            [(ngModel)]="noticeForm.publishDate"
            [showTime]="true"
            hourFormat="12"
            [showIcon]="true"
            [showClear]="false"
            placeholder="Select publish date"
            styleClass="w-full"
            appendTo="body"
          ></p-datepicker>
        </div>

        <!-- Expiry Date -->
        <div class="form-field">
          <label for="expiryDate">Expiry Date</label>

          <p-datepicker
            inputId="expiryDate"
            [(ngModel)]="noticeForm.expiryDate"
            [showTime]="true"
            hourFormat="12"
            [showIcon]="true"
            placeholder="No expiry date"
            styleClass="w-full"
            appendTo="body"
          ></p-datepicker>

          <small class="field-hint">
            Leave empty if this announcement has no expiry date.
          </small>
        </div>

        <!-- Pin Notice -->
        <div class="pin-option">
          <p-checkbox
            [(ngModel)]="noticeForm.isPinned"
            [binary]="true"
            inputId="pinNotice"
          ></p-checkbox>

          <label for="pinNotice">
            <strong>Pin this announcement</strong>
            <span> Pinned announcements appear before other notices. </span>
          </label>
        </div>
      </div>

      <!-- Dialog Footer -->
      <ng-template #footer>
        <div class="dialog-footer">
          <button
            pButton
            type="button"
            label="Cancel"
            severity="secondary"
            [outlined]="true"
            (click)="showNoticeDialog = false"
            [disabled]="savingNotice"
          ></button>

          <button
            pButton
            type="button"
            label="Publish Notice"
            icon="pi pi-send"
            class="publish-button"
            (click)="SaveNotice()"
            [loading]="savingNotice"
            [disabled]="!noticeForm.title.trim()"
          ></button>
        </div>
      </ng-template>
    </p-dialog>
  `,
  styleUrl: './announcements.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Announcements implements OnInit, OnDestroy {
  @ViewChild('fTable') fTable?: Table;

  private readonly loadingService = inject(LoadingService);
  private readonly noticeService = inject(NoticeService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messageService = inject(MessageService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  protected ngUnsubscribe = new Subject<void>();

  PagingSignal = signal<PagingContent<Notice>>({
    data: [],
    totalElements: 0,
  } as PagingContent<Notice>);

  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  search = '';
  showNoticeDialog = false;
  showViewDialog = false;
  savingNotice = false;
  selectedNotice: Notice | null = null;
  private readonly previewLimit = 120;

  noticeForm: CreateNoticeRequest = this.getEmptyNotice();

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 10;
    this.Query.Filter = null;
    this.Query.OrderBy = 'CreatedAt desc';
    this.Query.Select = null;
    this.Query.Includes = null;
  }

  ngOnInit(): void {
    this.GetData();
  }

  GetData(): void {
    this.loadingService.start();

    this.noticeService
      .GetMany(this.Query)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.PagingSignal.set(res as unknown as PagingContent<Notice>);

          this.loadingService.stop();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loadingService.stop();

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.message || 'An error occurred while fetching notices.',
          });

          this.cdr.markForCheck();
        },
      });
  }

  NextPage(event: TableLazyLoadEvent): void {
    if ((event?.first || event?.first === 0) && event?.rows) {
      this.Query.Page = event.first / event.rows + 1 || 1;
      this.Query.PageSize = event.rows;
    }

    this.Query.OrderBy = 'CreatedAt desc';
    this.GetData();
  }

  OnMobilePage(event: { first?: number | null; rows?: number | null }): void {
    if (event.rows) {
      this.Query.PageSize = event.rows;
      this.Query.Page = Math.floor((event.first ?? 0) / event.rows) + 1;
    }

    this.Query.OrderBy = 'CreatedAt desc';
    this.GetData();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.Search(this.search);
    }
  }

  Search(data: string): void {
    this.Query.Filter = data.trim() || null;

    if (this.fTable) {
      this.fTable.first = 0;
    }

    this.Query.Page = 1;
    this.GetData();
  }

  ResetTable(): void {
    this.search = '';
    this.Query.Filter = null;
    this.Query.Page = 1;

    if (this.fTable) {
      this.fTable.first = 0;
    }

    this.GetData();
  }

  get isHrOrSuperAdmin(): boolean {
    const role = this.userService.currentUser?.systemRole?.toLowerCase();

    return role === 'hr' || role === 'superadmin';
  }

  private getEmptyNotice(): CreateNoticeRequest {
    return {
      title: '',
      content: '',
      publishDate: new Date(),
      expiryDate: undefined,
      isPinned: false,
    };
  }

  plainText(html: string | null | undefined): string {
    if (!html) return '';
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  previewText(html: string | null | undefined): string {
    const text = this.plainText(html);
    if (text.length <= this.previewLimit) return text;
    return `${text.slice(0, this.previewLimit).trimEnd()}…`;
  }

  hasMoreContent(html: string | null | undefined): boolean {
    return this.plainText(html).length > this.previewLimit || /<img\b/i.test(html || '');
  }

  openNotice(notice: Notice): void {
    this.selectedNotice = notice;
    this.showViewDialog = true;
    this.cdr.markForCheck();
  }

  closeNotice(): void {
    this.showViewDialog = false;
    this.selectedNotice = null;
    this.cdr.markForCheck();
  }

  onContentEditorInit(event: { editor: any }): void {
    const quill = event?.editor;
    if (!quill) return;

    const toolbar = quill.getModule('toolbar');
    toolbar?.addHandler('image', () => this.insertEditorImage(quill));
  }

  private insertEditorImage(quill: any): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/jpg,image/gif,image/webp';
    input.click();

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;

      if (file.size > 5_000_000) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Image too large',
          detail: 'Please choose an image that is 5MB or smaller.',
        });
        return;
      }

      this.messageService.add({
        severity: 'info',
        summary: 'Uploading',
        detail: 'Uploading image…',
        life: 1500,
      });

      this.noticeService.UploadImage(file).subscribe({
        next: (res) => {
          const relative = (res.url || '').replace(/^\/+/, '');
          const url = relative.startsWith('http')
            ? relative
            : `${environment.AttachmentUrl}${relative}`;

          const range =
            quill.getSelection(true) || { index: quill.getLength(), length: 0 };
          quill.insertEmbed(range.index, 'image', url, 'user');
          quill.setSelection(range.index + 1, 0, 'user');
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Upload failed',
            detail:
              error?.error?.message ??
              'Unable to upload image. Please try again.',
          });
        },
      });
    };
  }

  AddNotice(): void {
    if (!this.isHrOrSuperAdmin) {
      this.messageService.add({
        severity: 'error',
        summary: 'Access Denied',
        detail: 'Only HR and SuperAdmin can create notices.',
      });
      return;
    }

    this.noticeForm = this.getEmptyNotice();

    if (window.innerWidth < 768) {
      this.router.navigate(['/announcements/form']);
      return;
    }

    this.showNoticeDialog = true;
  }

  OnDialogHide(): void {
    if (!this.savingNotice) {
      this.noticeForm = this.getEmptyNotice();
    }
  }

  SaveNotice(): void {
    if (!this.isHrOrSuperAdmin || this.savingNotice) {
      return;
    }

    if (!this.noticeForm.title.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Please enter a notice title.',
      });
      return;
    }

    if (
      this.noticeForm.expiryDate &&
      this.noticeForm.publishDate &&
      this.noticeForm.expiryDate < this.noticeForm.publishDate
    ) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Expiry date cannot be earlier than publish date.',
      });
      return;
    }

    const request: CreateNoticeRequest = {
      ...this.noticeForm,
      title: this.noticeForm.title.trim(),
      content: this.noticeForm.content?.trim(),
    };

    this.savingNotice = true;
    this.loadingService.start();

    this.noticeService
      .Create(request)
      .pipe(
        takeUntil(this.ngUnsubscribe),
        finalize(() => {
          this.savingNotice = false;
          this.loadingService.stop();
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Notice created successfully.',
          });

          this.showNoticeDialog = false;
          this.noticeForm = this.getEmptyNotice();

          this.GetData();
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail:
              err.error?.Error ||
              err.error?.message ||
              'Failed to create notice.',
          });
        },
      });
  }

  DeleteNotice(data: Notice): void {
    if (!this.isHrOrSuperAdmin) {
      this.messageService.add({
        severity: 'error',
        summary: 'Access Denied',
        detail: 'Only HR and SuperAdmin can delete announcements.',
      });
      return;
    }

    if (!data?.id) {
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to delete "${data.title}"?`,
    );

    if (!confirmed) {
      return;
    }

    this.loadingService.start();

    this.noticeService
      .Delete(data.id)
      .pipe(
        takeUntil(this.ngUnsubscribe),
        finalize(() => {
          this.loadingService.stop();
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Deleted',
            detail: 'Announcement deleted successfully.',
          });

          // Move to the previous page if the last record was deleted.
          if (this.PagingSignal().data.length === 1 && this.Query.Page > 1) {
            this.Query.Page--;

            if (this.fTable) {
              this.fTable.first = (this.Query.Page - 1) * this.Query.PageSize;
            }
          }

          this.GetData();
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail:
              err.error?.Error ||
              err.error?.message ||
              'Failed to delete announcement.',
          });
        },
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
