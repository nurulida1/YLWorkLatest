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
import {
  Table,
  TableLazyLoadEvent,
  TableModule,
  TableRowCollapseEvent,
  TableRowExpandEvent,
} from 'primeng/table';
import { LoadingService } from '../../../services/loading.service';
import { MenuItem, MessageService } from 'primeng/api';
import { QuotationService } from '../../../services/quotationService.service';
import { map, Observable, Subject, takeUntil } from 'rxjs';
import {
  BuildFilterText,
  BuildSortText,
  GridifyQueryExtend,
  PagingContent,
} from '../../../shared/helpers/helpers';
import { QuotationDto } from '../../../models/Quotation';
import { UserService } from '../../../services/userService.service';
import { TimelineModule } from 'primeng/timeline';

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
  ],
  template: `<div class="w-full min-h-[92.9vh] flex flex-col p-5">
      <div
        class="flex flex-row items-center gap-1 text-gray-500 text-[15px] tracking-wide"
      >
        <div
          [routerLink]="'/dashboard'"
          class="cursor-pointer hover:text-gray-600"
        >
          Dashboard
        </div>
        /
        <div class="text-gray-700 font-semibold">Quotations</div>
      </div>
      <div
        class="mt-3 border border-gray-200 rounded-md tracking-wide bg-white p-5 flex flex-col"
      >
        <div class="flex flex-row items-center justify-between">
          <div class="flex flex-col">
            <div class="text-[20px] text-gray-700 font-semibold">
              Quotations
            </div>
            <div class="text-gray-500 text-[15px]">
              View, create, and track all project quotations
            </div>
          </div>
          <div class="flex flex-row items-center gap-2">
            <div class="min-w-[300px] relative">
              <input
                type="text"
                pInputText
                [(ngModel)]="search"
                class="w-full! text-[15px]!"
                placeholder="Search by quotation no"
              />
              <i
                class="pi pi-search absolute! top-3! right-2! text-gray-500!"
              ></i>
            </div>
            <p-button
              label="New Quotation"
              [routerLink]="'/quotations/form'"
              icon="pi pi-plus"
              severity="info"
              size="small"
              styleClass="py-2! whitespace-nowrap!"
            ></p-button>
          </div>
        </div>
        <div class="mt-3">
          <p-table
            #fTable
            dataKey="id"
            [value]="PagingSignal().data"
            [paginator]="true"
            [rows]="Query.PageSize"
            [totalRecords]="PagingSignal().totalElements"
            [tableStyle]="{ 'min-width': '60rem' }"
            [rowsPerPageOptions]="[10, 20, 30, 50]"
            stripedRows="false"
            [lazy]="true"
            (onLazyLoad)="NextPage($event)"
            showGridlines
            [expandedRowKeys]="expandedRows"
          >
            <ng-template #header>
              <tr>
                <th class="w-[5%]! bg-gray-100!"></th>
                <th
                  pSortableColumn="QuotationNo"
                  class="bg-gray-100! text-[15px]! text-center! w-[20%]!"
                >
                  <div class="flex flex-row justify-center items-center gap-2">
                    <div>Quotation No</div>
                    <p-sortIcon field="QuotationNo" />
                  </div>
                </th>
                <th class="bg-gray-100! text-[15px]! text-center! w-[30%]">
                  Client
                </th>
                <th
                  pSortableColumn="QuotationDate"
                  class="bg-gray-100! text-[15px]! text-center! w-[15%]!"
                >
                  <div class="flex flex-row justify-center items-center gap-2">
                    <div>Created On</div>
                    <p-sortIcon field="QuotationDate" />
                  </div>
                </th>
                <th
                  pSortableColumn="Status"
                  class="bg-gray-100! text-[15px]! text-center! w-[10%]!"
                >
                  <div class="flex flex-row justify-center items-center gap-2">
                    <div>Status</div>
                    <p-sortIcon field="Status" />
                  </div>
                </th>
                <th class="bg-gray-100! text-[15px]! text-center! w-[10%]">
                  Action
                </th>
              </tr>
            </ng-template>
            <ng-template
              #body
              let-data
              let-rowIndex="rowIndex"
              let-expanded="expanded"
            >
              <tr>
                <td>
                  <div
                    class="flex items-center justify-center cursor-pointer"
                    (click)="fTable.toggleRow(data)"
                  >
                    <i
                      [class]="
                        expanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'
                      "
                    ></i>
                  </div>
                </td>
                <td class="text-center! text-[14px]! font-semibold!">
                  {{ data.quotationNo }}
                </td>
                <td class="text-center! text-[14px]!">
                  {{ data.client?.name }}
                </td>
                <td class="text-center! text-[14px]!">
                  {{ data.quotationDate | date: 'dd MMMM, yyyy' }}
                </td>
                <td class="text-center! text-[14px]!">
                  <div class="flex justify-center">
                    <div
                      class="rounded-full px-4 text-[13px] py-0.5 font-medium w-fit whitespace-nowrap"
                      [ngClass]="{
                        'bg-blue-100 text-blue-600':
                          data.status === 'Revised' ||
                          data.status === 'Sent' ||
                          data.status === 'Approved',
                        'bg-orange-100 text-orange-600':
                          data.status === 'Draft',
                        'bg-green-100 text-green-600':
                          data.status === 'Accepted',
                        'bg-red-100 text-red-600': data.status === 'Rejected',
                      }"
                    >
                      {{ data.status }}
                    </div>
                  </div>
                </td>

                <td class="text-center! text-[14px]!">
                  <div class="flex items-center justify-center">
                    <i
                      (click)="onEllipsisClick($event, data, menu)"
                      class="pi pi-ellipsis-h cursor-pointer"
                    ></i>
                  </div>
                </td>
              </tr>
            </ng-template>
            <ng-template #expandedrow let-item>
              <tr>
                <td colspan="100%">
                  <div class="px-5">
                    <p-timeline
                      [value]="events"
                      align="top"
                      layout="horizontal"
                      class="customized-timeline w-full"
                    >
                      <ng-template #marker let-event>
                        <div
                          class="w-5 h-5 flex items-center justify-center rounded-full shadow-sm text-white"
                          [ngClass]="
                            event.actionAt ? event.color : 'bg-gray-300'
                          "
                        >
                          <i
                            class="pi text-xs"
                            [ngClass]="
                              event.verified ? 'pi-check' : 'pi-circle-fill'
                            "
                          ></i>
                        </div>
                      </ng-template>

                      <ng-template #content let-event>
                        <div class="flex flex-col min-h-[70px]">
                          <div class="font-semibold text-sm">
                            {{ event.status }}
                          </div>

                          <small
                            class="text-gray-500 text-xs"
                            *ngIf="event.actionUser"
                          >
                            {{ event.actionUser }}
                          </small>

                          <small
                            class="text-gray-400 text-xs"
                            *ngIf="event.actionAt"
                          >
                            {{ event.actionAt | date: 'dd MMM, yyyy HH:mm aa' }}
                          </small>
                        </div>
                      </ng-template>
                    </p-timeline>
                  </div>
                </td>
              </tr>
            </ng-template>

            <ng-template #emptymessage>
              <tr>
                <td colspan="100%" class="border-x!">
                  <div class="text-[15px] text-center text-gray-500">
                    No quotation found in records.
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      </div>
    </div>
    {{ menuItems | json }}
    <p-menu
      #menu
      [model]="menuItems"
      [popup]="true"
      [style]="{ transform: 'translate(20px, 8px)' }"
    ></p-menu>

    <p-dialog
      header="Select Reviewer"
      [(visible)]="displayReviseByDialog"
      [modal]="true"
      styleClass="w-[80%]! lg:w-[50%]!"
    >
      <div class="flex flex-col gap-4 mt-2">
        <label class="font-medium"
          >Assign a reviewer for this quotation:
          <b>{{ selectedQuotation?.quotationNo }}</b></label
        >
        <p-select
          [options]="reviewerSelection || []"
          [(ngModel)]="selectedReviewerId"
          placeholder="Select a Reviewer"
          styleClass="w-full"
          appendTo="body"
          [filter]="true"
        >
        </p-select>
      </div>
      <ng-template pTemplate="footer">
        <p-button
          label="Cancel"
          (click)="displayReviseByDialog = false"
          severity="secondary"
          styleClass="border-gray-200!"
          [text]="true"
        ></p-button>
        <p-button
          label="Update"
          severity="info"
          (click)="confirmReviewer()"
          [disabled]="!selectedReviewerId"
        ></p-button>
      </ng-template>
    </p-dialog> `,
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
  selectedReviewerId: string | null = null;
  menuItems: MenuItem[] = [];
  events: any[] = [];

  displayReviseByDialog: boolean = false;
  selectedQuotation: any;

  currentUser = this.userService.currentUser;

  reviewerSelection: { label: string; value: string }[] = [];

  isAdmin: boolean = false;

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 10;
    this.Query.Filter = null;
    this.Query.OrderBy = 'CreatedAt desc';
    this.Query.Select = null;
    this.Query.Includes = 'Client';
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
            'Revised',
            'Approved',
            'Sent',
            'Accepted',
            'Rejected',
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

          const colorMap: Record<string, string> = {
            Draft: 'bg-orange-400',
            Revised: 'bg-yellow-400',
            Approved: 'bg-blue-400',
            Sent: 'bg-blue-400',
            Accepted: 'bg-green-400',
            Rejected: 'bg-red-400',
          };

          this.events = statusOrder.map((status, index) => {
            const item = latestByStatus.get(status);

            let displayUser = '-';

            if (status === 'Revised') {
              displayUser = item?.reviewedByUser?.fullName ?? '-';
            } else {
              displayUser = item?.actionUser?.fullName ?? '-';
            }

            return {
              status,
              actionAt: item?.actionAt ?? null,
              actionUser: displayUser,
              color: colorMap[status],
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
    if (action === 'Draft') {
      this.updateQuotationStatus(data!.id, 'Draft'); // backend converts to Draft
    }

    if (action === 'Approved') {
      this.updateQuotationStatus(data!.id, 'Approved');
    }

    if (action === 'Update') {
      this.router.navigate(['/quotations/form'], {
        queryParams: { id: data?.id },
      });
    }

    if (action === 'Revised') {
      this.showReviewerSelectionDialog(data);
    }
  }

  onEllipsisClick(event: any, quotation: QuotationDto, menu: any) {
    const jobTitle = this.currentUser?.systemRole;
    const status = quotation.status;
    console.log(status);
    const isReviewer = quotation.quotationStatusHistories?.some(
      (h: any) => h.reviewedByUser?.id === this.currentUser?.userId,
    );

    this.menuItems = [];

    // =========================
    // ADMIN / SALES EXECUTIVE
    // =========================
    if (jobTitle === 'Sales Executive' || jobTitle === 'Sales Director') {
      this.menuItems = [
        {
          label: 'Edit',
          icon: 'pi pi-pencil',
          visible: status !== 'Accepted',
          command: () => this.ActionClick(quotation, 'Update'),
        },
        {
          label: 'Revised',
          icon: 'pi pi-file-edit',
          visible: status === 'Draft' || status === 'Revised',
          command: () => this.ActionClick(quotation, 'Revised'),
        },
        {
          label: 'Approved',
          icon: 'pi pi-check-circle',
          visible: status === 'Revised',
          command: () => this.ActionClick(quotation, 'Approved'),
        },
      ];
    }

    // =========================
    // REVIEWER ONLY
    // =========================
    if (isReviewer) {
      this.menuItems = [
        {
          label: 'Approved',
          icon: 'pi pi-check-circle',
          visible: status === 'Revised',
          command: () => this.ActionClick(quotation, 'Approved'),
        },
        {
          label: 'Back to Draft',
          icon: 'pi pi-times',
          visible: status === 'Revised',
          command: () => this.ActionClick(quotation, 'Draft'),
        },
      ];
    }

    menu.toggle(event);
  }

  canAccessQuotationAction(action: string, quotation: QuotationDto): boolean {
    const jobTitle = this.currentUser?.systemRole;
    const status = quotation.status;

    const isSuperAdmin = jobTitle === 'SuperAdmin';
    const isSalesRole = [
      'Sales Director',
      'Sales Executive',
      'Sales Support',
    ].includes(jobTitle!);

    if (isSuperAdmin) return true;

    switch (action) {
      case 'Edit':
        return !['Accepted', 'Rejected', 'Sent'].includes(status);

      case 'Revised':
        return (
          isSalesRole &&
          !['Revised', 'Approved', 'Sent', 'Accepted', 'Rejected'].includes(
            status,
          )
        );

      case 'Approved':
        return (
          (jobTitle === 'Sales Director' || isSalesRole) &&
          ['Draft', 'Revised'].includes(status)
        );

      default:
        return false;
    }
  }

  showReviewerSelectionDialog(quotation: any) {
    this.selectedQuotation = quotation;
    this.selectedReviewerId = null;
    this.displayReviseByDialog = true;
    this.userService
      .GetMany({
        Page: 1,
        PageSize: 100,
        OrderBy: 'FullName desc',
        Select: 'Id,FullName,JobTitle,Email',
        Includes: null,
        Filter: `JobTitle=Sales Director|JobTitle=Sales Support|JobTitle=Sales Executive`,
      })
      .pipe(
        map(
          (res) =>
            (this.reviewerSelection = res.data.map((user: any) => ({
              label: `${user.FullName} — ${user.JobTitle || 'Staff'}`,
              value: user.Id,
            }))),
        ),
      )
      .subscribe();
    this.cdr.detectChanges();
  }

  confirmReviewer() {
    if (!this.selectedQuotation) return;

    this.loadingService.start();

    this.quotationService
      .UpdateStatus(
        this.selectedQuotation.id,
        'Revised',
        this.selectedReviewerId,
      )
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res: any) => {
          this.loadingService.stop();

          const currentPaging = this.PagingSignal();

          const updatedData = currentPaging.data.map((q) => {
            if (q.id === this.selectedQuotation.id) {
              return {
                ...q,
                status: 'Revised',
                // optional: keep UI consistent
                revisedByUserId: this.selectedReviewerId,
              };
            }
            return q;
          });

          this.PagingSignal.set({
            ...currentPaging,
            data: updatedData,
          });

          this.displayReviseByDialog = false;

          this.messageService.add({
            severity: 'success',
            summary: 'Status Updated',
            detail: `Quotation revised by ${res.actionUser?.fullName ?? '-'}`,
          });

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
            if (q.id === id) {
              // ✅ SAFELY CAST to expected type
              const newHistory = {
                id: res.id,
                status: res.status,
                actionAt: res.actionAt,
                remarks: res.remarks,
                actionUser: res.actionUser,
                reviewedByUser: res.reviewedByUser,

                // 👉 add missing required fields (dummy safe values)
                quotationId: id,
                actionUserId: res.actionUser?.id,
                reviewedByUserId: res.reviewedByUser?.id,
                createdAt: res.actionAt,
                signatureImage: null,
              } as any; // 🔥 important: bypass strict typing

              const updatedHistories = [
                ...(q.quotationStatusHistories || []),
                newHistory,
              ];

              return {
                ...q,
                status: newStatus,
                quotationStatusHistories: updatedHistories,
              };
            }
            return q;
          });

          this.PagingSignal.set({
            ...currentPaging,
            data: updatedData,
          });

          this.messageService.add({
            severity: 'success',
            summary: 'Status Updated',
            detail: `Quotation is now ${newStatus}`,
          });

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

  buildTimeline(quotation: QuotationDto) {
    const statusOrder = [
      'Draft',
      'Revised',
      'Approved',
      'Sent',
      'Accepted',
      'Rejected',
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

    const colorMap: Record<string, string> = {
      Draft: 'bg-orange-400',
      Revised: 'bg-yellow-400',
      Approved: 'bg-blue-400',
      Sent: 'bg-blue-400',
      Accepted: 'bg-green-400',
      Rejected: 'bg-red-400',
    };

    this.events = statusOrder.map((status, index) => {
      const item = latestByStatus.get(status);

      let displayUser = '-';

      // 🔥 KEY FIX
      if (status === 'Revised') {
        displayUser =
          item?.reviewedByUser?.fullName || item?.actionUser?.fullName || '-';
      } else {
        displayUser = item?.actionUser?.fullName || '-';
      }

      return {
        status,
        actionAt: item?.actionAt ?? null,
        actionUser: displayUser,
        color: colorMap[status],
        verified: index <= reachedIndex,
      };
    });
  }

  convert(type: 'Invoice' | 'PO', data: any) {
    this.loadingService.start();

    const action$: Observable<any> =
      type === 'Invoice'
        ? this.quotationService.ConvertToInvoice(data.id)
        : this.quotationService.ConvertToPO(data.id);

    action$.subscribe({
      next: (res: any) => {
        this.loadingService.stop();
        this.messageService.add({
          severity: 'success',
          summary: 'Converted Successfully',
          detail: `${type} generated: ${res.invoiceNo || res.poNo}`,
        });
      },
      error: () => this.loadingService.stop(),
    });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
