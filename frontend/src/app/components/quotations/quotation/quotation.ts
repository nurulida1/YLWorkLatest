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
import { HasPermissionDirective } from '../../../common/directives/hasPermission.directive';
import { PermissionService } from '../../../services/permissionService';

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
    HasPermissionDirective,
  ],
  template: `<div class="w-full min-h-[92.9vh] flex flex-col p-5">
      <div class="flex flex-row items-center gap-1 text-gray-500 tracking-wide">
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
            <div class="text-gray-500">
              View, create, and track all project quotations
            </div>
          </div>

          <div class="flex flex-row items-center gap-2">
            <div class="min-w-[300px] relative">
              <input
                type="text"
                pInputText
                [(ngModel)]="search"
                (keydown)="onKeyDown($event)"
                class="w-full!"
                placeholder="Search by quotation no"
              />
              <i
                class="pi pi-search absolute! top-3! right-2! text-gray-500!"
              ></i>
            </div>

            <p-button
              *hasPermission="'Quotations'; action: 'canCreate'"
              label="New Quotation"
              [routerLink]="'/quotations/form'"
              icon="pi pi-plus"
              severity="info"
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
                <th
                  class="w-[5%]! bg-gray-100!"
                  *ngIf="permissions().canUpdate"
                ></th>
                <th
                  pSortableColumn="QuotationNo"
                  class="bg-gray-100! text-center! w-[20%]!"
                >
                  <div class="flex flex-row justify-center items-center gap-2">
                    <div>Quotation No</div>
                    <p-sortIcon field="QuotationNo" />
                  </div>
                </th>
                <th class="bg-gray-100! text-center! w-[30%]">Client</th>
                <th
                  pSortableColumn="QuotationDate"
                  class="bg-gray-100! text-center! w-[15%]!"
                >
                  <div class="flex flex-row justify-center items-center gap-2">
                    <div>Date</div>
                    <p-sortIcon field="QuotationDate" />
                  </div>
                </th>
                <th
                  pSortableColumn="Status"
                  class="bg-gray-100! text-center! w-[10%]!"
                >
                  <div class="flex flex-row justify-center items-center gap-2">
                    <div>Status</div>
                    <p-sortIcon field="Status" />
                  </div>
                </th>
                <th class="bg-gray-100! text-center! w-[10%]">Action</th>
              </tr>
            </ng-template>

            <ng-template
              #body
              let-data
              let-rowIndex="rowIndex"
              let-expanded="expanded"
            >
              <tr>
                <td *ngIf="permissions().canUpdate">
                  <div
                    class="flex items-center justify-center cursor-pointer"
                    (click)="onRowExpand(data, fTable)"
                  >
                    <i
                      [class]="
                        expanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'
                      "
                    ></i>
                  </div>
                </td>
                <td class="text-center! font-semibold!">
                  {{ data.quotationNo }}
                </td>
                <td class="text-center!">{{ data.client?.name }}</td>
                <td class="text-center!">
                  {{ data.quotationDate | date: 'dd/MM/yyyy' }}
                </td>
                <td class="text-center!">
                  <div class="flex justify-center">
                    <div
                      class="rounded-full px-4 text-sm py-0.5 font-medium w-fit whitespace-nowrap"
                      [ngClass]="{
                        'bg-blue-100 text-blue-600':
                          data.status === 'Reviewed' ||
                          data.status === 'Sent' ||
                          data.status === 'Approved',
                        'bg-orange-100 text-orange-600':
                          data.status === 'Draft',
                        'bg-green-100 text-green-600':
                          data.status === 'Accepted',
                        'bg-red-100 text-red-600':
                          data.status === 'Rejected' ||
                          data.status === 'Cancelled',
                      }"
                    >
                      {{ data.status }}
                    </div>
                  </div>
                </td>
                <td class="text-center!">
                  <div
                    class="flex items-center justify-center"
                    *ngIf="data.status !== 'Cancelled'"
                  >
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
                      [value]="timelineMap[item.id]"
                      align="top"
                      layout="horizontal"
                      class="customized-timeline w-full whitespace-nowrap"
                    >
                      <ng-template #marker let-event>
                        <div
                          class="w-6 h-6 p-2 flex items-center justify-center rounded-full shadow-sm text-white"
                          [ngClass]="
                            event.actionAt ? 'bg-blue-500' : 'bg-gray-300'
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
                  <div class="text-center text-gray-500">
                    No quotation found in records.
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      </div>
    </div>

    <p-menu
      #menu
      [model]="menuItems"
      [popup]="true"
      [style]="{ transform: 'translate(20px, 8px)' }"
    ></p-menu>`,
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
  private readonly permissionService = inject(PermissionService);

  PagingSignal = signal<PagingContent<QuotationDto>>(
    {} as PagingContent<QuotationDto>,
  );
  Query: GridifyQueryExtend = {} as GridifyQueryExtend;
  expandedRows: { [key: string]: boolean } = {};

  search: string = '';
  menuItems: MenuItem[] = [];
  events: any[] = [];

  displayReviseByDialog: boolean = false;
  selectedQuotation: any;

  currentUser = this.userService.currentUser;

  reviewerSelection: { label: string; value: string }[] = [];

  isAdmin: boolean = false;

  timelineMap: { [key: string]: any[] } = {};
  permissions = this.permissionService.getModuleRights('Quotations');

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 10;
    this.Query.Filter = null;
    this.Query.OrderBy = 'CreatedAt desc';
    this.Query.Select = null;
    this.Query.Includes =
      'Client,QuotationStatusHistories,QuotationStatusHistories.ActionUser';
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
            'Reviewed',
            'Sent',
            'Accepted',
            'Rejected',
            'Cancelled',
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

    this.Query.Filter =
      !this.permissions().canUpdate && !this.permissions().canCreate
        ? `${BuildFilterText(event)},Status=Accepted`
        : BuildFilterText(event);

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

    this.Query.Filter =
      !this.permissions().canUpdate && !this.permissions().canCreate
        ? 'Status=Accepted'
        : null;
    this.GetData();
  }

  ActionClick(data: QuotationDto | null, action: string) {
    if (!data) return;

    if (action === 'Update') {
      this.router.navigate(['/quotations/form'], {
        queryParams: { id: data.id },
      });
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
    const rights = this.permissions();

    this.menuItems = [];

    if (rights.canUpdate && status === 'Draft') {
      this.menuItems.push({
        label: 'Edit',
        icon: 'pi pi-pencil',
        command: () => this.ActionClick(quotation, 'Update'),
      });
    }

    if (rights.canUpdateStatus) {
      if (status === 'Draft') {
        this.menuItems.push({
          label: 'Reviewed',
          icon: 'pi pi-file-edit',
          command: () => this.updateQuotationStatus(quotation.id, 'Reviewed'),
        });
      }
      if (status === 'Reviewed') {
        this.menuItems.push({
          label: 'Mark As Sent',
          icon: 'pi pi-send',
          command: () => this.updateQuotationStatus(quotation.id, 'Sent'),
        });
      }
      if (status === 'Sent') {
        this.menuItems.push(
          {
            label: 'Accepted',
            icon: 'pi pi-check-circle',
            command: () => this.updateQuotationStatus(quotation.id, 'Accepted'),
          },
          {
            label: 'Rejected',
            icon: 'pi pi-times',
            command: () => this.updateQuotationStatus(quotation.id, 'Rejected'),
          },
        );
      }
      if (
        status !== 'Accepted' &&
        status !== 'Rejected' &&
        status !== 'Cancelled'
      ) {
        this.menuItems.push({
          label: 'Cancel',
          icon: 'pi pi-times-circle',
          command: () => this.updateQuotationStatus(quotation.id, 'Cancelled'),
        });
      }
    }

    if (rights.canUpdate && status === 'Accepted') {
      this.menuItems.push({
        label: 'Convert to PO',
        icon: 'pi pi-file',
        command: () => this.ActionClick(quotation, 'Convert'),
      });
    }

    if (rights.canRead && status === 'Accepted') {
      this.menuItems.push({
        label: 'Download File',
        icon: 'pi pi-file',
        command: () => this.ActionClick(quotation, 'Download'),
      });
    }

    if (this.menuItems.length > 0) {
      menu.toggle(event);
    }
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

  buildTimeline(quotation: QuotationDto): any[] {
    const statusOrder = [
      'Draft',
      'Reviewed',
      'Sent',
      'Accepted',
      'Rejected',
      'Cancelled',
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
        actionUser: item?.actionUser?.displayName || '-',
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

  isEditor(): boolean {
    return (
      this.currentUser?.jobTitle === 'Sales Executive' ||
      this.currentUser?.jobTitle === 'Sales Support' ||
      this.currentUser?.jobTitle === 'Sales Director'
    );
  }
}
