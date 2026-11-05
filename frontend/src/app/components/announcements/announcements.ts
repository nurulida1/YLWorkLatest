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
import { LoadingService } from '../../services/loading.service';
import { NoticeService } from '../../services/NoticeService';
import { MessageService } from 'primeng/api';
import { finalize, Subject, takeUntil } from 'rxjs';
import {
  GridifyQueryExtend,
  PagingContent,
} from '../../shared/helpers/helpers';
import { CreateNoticeRequest, Notice } from '../../models/Notice';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { UserService } from '../../services/userService.service';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';

@Component({
  selector: 'app-announcements',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TableModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    DatePickerModule,
    CheckboxModule,
    DialogModule,
  ],
  template: `<div class="w-full flex flex-col p-5 gap-4">
      <!-- Breadcrumb -->
      <div class="flex items-center gap-2 text-sm text-gray-500">
        <div
          class="cursor-pointer hover:text-blue-700 transition-colors"
          [routerLink]="'/dashboard'"
        >
          Dashboard
        </div>
        <i class="pi pi-angle-right text-xs"></i>
        <div class="text-gray-700 font-semibold">Announcements</div>
      </div>

      <!-- Main Container -->
      <div
        class="bg-white border border-gray-200 rounded-xl p-5 lg:p-6 flex flex-col gap-6"
      >
        <!-- Header -->
        <div
          class="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5"
        >
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-2">
              <div
                class="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center"
              >
                <i class="pi pi-megaphone text-lg"></i>
              </div>

              <h2 class="text-xl font-semibold text-gray-800">Announcements</h2>
            </div>

            <p class="text-sm text-gray-500">
              Stay updated with the latest company news, notices and important
              information.
            </p>
          </div>

          <!-- Actions -->
          <div
            class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
          >
            <!-- Search -->
            <div class="w-full sm:w-64 relative">
              <i
                class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              ></i>

              <input
                type="text"
                pInputText
                [(ngModel)]="search"
                class="w-full! pl-10!"
                placeholder="Search announcements"
                (keyup)="onKeyDown($event)"
              />
            </div>

            <!-- Refresh -->
            <p-button
              icon="pi pi-refresh"
              label="Refresh"
              severity="secondary"
              [outlined]="true"
              (onClick)="ResetTable()"
              styleClass="whitespace-nowrap!"
            ></p-button>

            <!-- Add Notice -->
            @if (isHrOrSuperAdmin) {
              <p-button
                icon="pi pi-plus"
                label="Add Notice"
                (onClick)="AddNotice()"
                styleClass="whitespace-nowrap! bg-blue-900! border-blue-900!"
              ></p-button>
            }
          </div>
        </div>

        <!-- Summary -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Total Announcements -->
          <div
            class="border border-gray-200 rounded-xl p-5 flex items-center gap-4"
          >
            <div
              class="w-12 h-12 shrink-0 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center"
            >
              <i class="pi pi-megaphone text-xl"></i>
            </div>

            <div class="flex flex-col gap-1">
              <span class="text-sm text-gray-500"> Total Announcements </span>

              <span class="text-2xl font-bold text-gray-800">
                {{ PagingSignal().totalElements }}
              </span>
            </div>
          </div>

          <!-- Displayed -->
          <div
            class="border border-gray-200 rounded-xl p-5 flex items-center gap-4"
          >
            <div
              class="w-12 h-12 shrink-0 rounded-xl bg-green-50 text-green-700 flex items-center justify-center"
            >
              <i class="pi pi-list text-xl"></i>
            </div>

            <div class="flex flex-col gap-1">
              <span class="text-sm text-gray-500">
                Announcements Displayed
              </span>

              <span class="text-2xl font-bold text-gray-800">
                {{ PagingSignal().data.length }}
              </span>
            </div>
          </div>
        </div>

        <!-- Table Section -->
        <div class="flex flex-col gap-3">
          <div
            class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
          >
            <div>
              <h3 class="font-semibold text-gray-800">Announcement Records</h3>

              <p class="text-sm text-gray-500 mt-1">
                View and manage published company announcements.
              </p>
            </div>
          </div>

          <div class="w-full overflow-hidden">
            <p-table
              #fTable
              [value]="PagingSignal().data"
              [paginator]="true"
              [rows]="Query.PageSize"
              [totalRecords]="PagingSignal().totalElements"
              [tableStyle]="{ 'min-width': '75rem' }"
              [rowsPerPageOptions]="[10, 20, 30, 50]"
              [lazy]="true"
              [showGridlines]="true"
              (onLazyLoad)="NextPage($event)"
              styleClass="announcement-table"
            >
              <!-- Header -->
              <ng-template #header>
                <tr>
                  <th class="bg-gray-50! text-center! w-16!">No.</th>
                  <th class="bg-gray-50! min-w-48!">Title</th>
                  <th class="bg-gray-50! min-w-64!">Content</th>
                  <th class="bg-gray-50! text-center! min-w-36!">
                    Publish Date
                  </th>
                  <th class="bg-gray-50! text-center! min-w-36!">
                    Expiry Date
                  </th>
                  <th class="bg-gray-50! min-w-36!">Created By</th>
                  <th class="bg-gray-50! text-center! min-w-28!">Status</th>
                  @if (isHrOrSuperAdmin) {
                    <th class="bg-gray-50! text-center! w-28!">Actions</th>
                  }
                </tr>
              </ng-template>

              <!-- Body -->
              <ng-template #body let-data let-rowIndex="rowIndex">
                <tr>
                  <!-- Number -->
                  <td class="text-center! text-gray-500">
                    {{ (Query.Page - 1) * Query.PageSize + rowIndex + 1 }}
                  </td>

                  <td>
                    <div class="flex items-center gap-2 min-w-0">
                      <span class="font-semibold text-gray-800">
                        {{ data.title }}
                      </span>

                      @if (data.isPinned) {
                        <span
                          class="inline-flex items-center gap-1 shrink-0 text-[10px] font-medium text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded"
                        >
                          <i class="pi pi-thumbtack text-[9px]"></i>
                          Pinned
                        </span>
                      }
                    </div>
                  </td>

                  <!-- Content -->
                  <td>
                    <div
                      class="text-sm text-gray-600 whitespace-pre-line line-clamp-3 leading-6"
                      [title]="data.content || ''"
                    >
                      {{ data.content || 'No content provided.' }}
                    </div>
                  </td>

                  <!-- Publish Date -->
                  <td class="text-center!">
                    <div class="flex flex-col gap-1">
                      <span class="text-sm font-medium text-gray-700">
                        {{ data.publishDate | date: 'dd/MM/yyyy' }}
                      </span>

                      <span class="text-xs text-gray-400">
                        {{ data.publishDate | date: 'hh:mm a' }}
                      </span>
                    </div>
                  </td>

                  <!-- Expiry Date -->
                  <td class="text-center!">
                    @if (data.expiryDate) {
                      <span class="text-sm text-gray-700">
                        {{ data.expiryDate | date: 'dd/MM/yyyy' }}
                      </span>
                    } @else {
                      <span class="text-sm text-gray-400 italic">
                        No expiry
                      </span>
                    }
                  </td>

                  <!-- Created By -->
                  <td>
                    <div class="flex items-center gap-2">
                      <div
                        class="w-8 h-8 shrink-0 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center"
                      >
                        <i class="pi pi-user text-sm!"></i>
                      </div>

                      <span class="text-sm text-gray-600">
                        {{ data.createdByName || 'System' }}
                      </span>
                    </div>
                  </td>

                  <!-- Status -->
                  <td class="text-center!">
                    @if (data.isActive) {
                      <span
                        class="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-3 py-1.5 rounded-full"
                      >
                        <i class="pi pi-check-circle"></i>
                        Active
                      </span>
                    } @else {
                      <span
                        class="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full"
                      >
                        <i class="pi pi-ban"></i>
                        Inactive
                      </span>
                    }
                  </td>
                  @if (isHrOrSuperAdmin) {
                    <td class="text-center!">
                      <p-button
                        icon="pi pi-trash"
                        severity="danger"
                        [outlined]="true"
                        [rounded]="true"
                        size="small"
                        pTooltip="Delete announcement"
                        tooltipPosition="top"
                        (onClick)="DeleteNotice(data)"
                      ></p-button>
                    </td>
                  }
                </tr>
              </ng-template>

              <!-- Empty Message -->
              <ng-template #emptymessage>
                <tr>
                  <td colspan="100%">
                    <div
                      class="flex flex-col items-center justify-center text-center py-12"
                    >
                      <div
                        class="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-3"
                      >
                        <i class="pi pi-megaphone text-2xl text-gray-300"></i>
                      </div>

                      <div class="font-semibold text-gray-700">
                        No announcements found
                      </div>

                      <p class="text-sm text-gray-400 mt-1">
                        There are currently no announcements available.
                      </p>
                    </div>
                  </td>
                </tr>
              </ng-template>
            </p-table>
          </div>
        </div>
      </div>
    </div>

    <p-dialog
      header="Create Announcement"
      [(visible)]="showNoticeDialog"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '600px', maxWidth: '95vw' }"
      [breakpoints]="{ '640px': '95vw' }"
    >
      <div class="flex flex-col gap-4 pt-2">
        <!-- Title -->
        <div class="flex flex-col gap-2">
          <label class="font-medium text-gray-700">
            Title <span class="text-red-500">*</span>
          </label>

          <input
            pInputText
            type="text"
            [(ngModel)]="noticeForm.title"
            placeholder="Enter announcement title"
            maxlength="200"
            class="w-full!"
          />
        </div>

        <!-- Content -->
        <div class="flex flex-col gap-2">
          <label class="font-medium text-gray-700"> Content </label>

          <textarea
            pTextarea
            [(ngModel)]="noticeForm.content"
            placeholder="Write your announcement..."
            rows="5"
            class="w-full!"
            [autoResize]="true"
          ></textarea>
        </div>

        <!-- Publish Date -->
        <div class="flex flex-col gap-2">
          <label class="font-medium text-gray-700"> Publish Date </label>

          <p-datepicker
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
        <div class="flex flex-col gap-2">
          <label class="font-medium text-gray-700"> Expiry Date </label>

          <p-datepicker
            [(ngModel)]="noticeForm.expiryDate"
            [showTime]="true"
            hourFormat="12"
            [showIcon]="true"
            placeholder="No expiry date"
            styleClass="w-full"
            appendTo="body"
          ></p-datepicker>

          <small class="text-gray-400">
            Leave empty if this announcement has no expiry date.
          </small>
        </div>

        <!-- Pin Notice -->
        <div
          class="flex items-center gap-3 border border-gray-200 rounded-lg p-3"
        >
          <p-checkbox
            [(ngModel)]="noticeForm.isPinned"
            [binary]="true"
            inputId="pinNotice"
          ></p-checkbox>

          <label for="pinNotice" class="flex flex-col cursor-pointer">
            <span class="font-medium text-gray-700">
              Pin this announcement
            </span>
            <span class="text-sm text-gray-500">
              Pinned announcements appear before other notices.
            </span>
          </label>
        </div>
      </div>

      <!-- Footer -->
      <ng-template #footer>
        <div class="flex justify-end gap-2">
          <p-button
            label="Cancel"
            severity="secondary"
            [outlined]="true"
            (onClick)="showNoticeDialog = false"
            [disabled]="savingNotice"
          ></p-button>

          <p-button
            label="Publish Notice"
            icon="pi pi-send"
            severity="info"
            styleClass="bg-blue-900! border-none!"
            (onClick)="SaveNotice()"
            [loading]="savingNotice"
            [disabled]="!noticeForm.title.trim()"
          ></p-button>
        </div>
      </ng-template>
    </p-dialog>`,
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

  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  PagingSignal = signal<PagingContent<Notice>>({
    data: [],
    totalElements: 0,
  } as PagingContent<Notice>);

  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  search: string = '';
  showNoticeDialog: boolean = false;
  savingNotice: boolean = false;

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

  onKeyDown(event: KeyboardEvent): void {
    const isEnter = event.key === 'Enter';
    const isBackspaceClear = event.key === 'Backspace' && this.search === '';

    if (isEnter) {
      this.Search(this.search);
    } else if (isBackspaceClear) {
      this.Search('');
    }
  }

  Search(data: string): void {
    this.Query.Filter = data.trim() || null;

    if (this.fTable != null) {
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
    this.showNoticeDialog = true;
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

          // Return to previous page if the last record was deleted.
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
