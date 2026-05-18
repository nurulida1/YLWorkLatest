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
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { DeliveryOrderService } from '../../../services/deliveryOrderService';
import { LoadingService } from '../../../services/loading.service';
import { MenuItem, MessageService } from 'primeng/api';
import { map, Subject, takeUntil } from 'rxjs';
import { DeliveryOrderDto } from '../../../models/DeliveryOrder';
import {
  BuildFilterText,
  BuildSortText,
  GridifyQueryExtend,
  PagingContent,
} from '../../../shared/helpers/helpers';
import { UserService } from '../../../services/userService.service';
import { TimelineModule } from 'primeng/timeline';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'app-outbound-do',
  imports: [
    CommonModule,
    ButtonModule,
    InputTextModule,
    FormsModule,
    TableModule,
    RouterLink,
    TimelineModule,
    MenuModule,
    DialogModule,
    SelectModule,
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
        <div class="text-gray-700 font-semibold">Outbound Delivery Orders</div>
      </div>

      <div
        class="mt-3 border border-gray-200 rounded-md tracking-wide bg-white p-5 flex flex-col"
      >
        <div
          class="flex flex-col gap-3 xl:gap-0 xl:flex-row xl:items-center justify-between"
        >
          <div class="flex flex-col">
            <div class="text-[18px] text-gray-700 font-semibold">
              Outbound Delivery Orders
            </div>
            <div class="text-gray-500">
              View, create, and track all outbound delivery orders
            </div>
          </div>
          <div class="flex flex-row items-center gap-2">
            <div class="w-full xl:min-w-[300px] relative">
              <input
                type="text"
                pInputText
                [(ngModel)]="search"
                class="w-full!"
                placeholder="Search by DO No"
                (keydown)="onKeyDown($event)"
              />
              <i
                class="pi pi-search absolute! top-3! right-2! text-gray-500!"
              ></i>
            </div>

            <p-button
              label="Generate Outbound DO"
              [routerLink]="'/delivery-orders/outbound/form'"
              icon="pi pi-file-pdf"
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
            [showGridlines]="true"
            [rowsPerPageOptions]="[10, 20, 30, 50]"
            [lazy]="true"
            (onLazyLoad)="NextPage($event)"
          >
            <ng-template #header>
              <tr>
                <th class="w-[5%]! bg-gray-100!"></th>

                <th
                  pSortableColumn="DeliveryOrderNo"
                  class="bg-gray-100! text-center! w-[10%]!"
                >
                  <div class="flex flex-row justify-center items-center gap-2">
                    <div>DO No</div>
                    <p-sortIcon field="DeliveryOrderNo" />
                  </div>
                </th>
                <th class="bg-gray-100! w-[20%]">Project</th>

                <th class="bg-gray-100! text-center! w-[15%]">Sender</th>
                <th class="bg-gray-100! text-center! w-[15%]">Receiver</th>

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
                <td class="text-center! font-semibold!">
                  {{ data.deliveryOrderNo }}
                </td>
                <td>
                  {{ data.project?.projectCode }} -
                  {{ data.project?.projectTitle || '-' }}
                </td>

                <td class="text-center!">
                  {{ data.senderCompany?.name || '-' }}
                </td>
                <td class="text-center!">
                  {{ data.receiverCompany?.name || '-' }}
                </td>
                <td class="text-center!">
                  <div class="flex justify-center">
                    <div
                      class="rounded-full px-4 text-[13px] py-0.5 font-medium w-fit whitespace-nowrap"
                      [ngClass]="{
                        'bg-teal-100 text-teal-600':
                          data.status === 'PartiallyReceived',
                        'bg-yellow-100 text-yellow-600':
                          data.status === 'UnderReview',
                        'bg-indigo-100 text-indigo-600':
                          data.status === 'Issued' ||
                          data.status === 'Prepared',
                        'bg-blue-100 text-blue-600':
                          data.status === 'OutForDelivery' ||
                          data.status === 'Approved',
                        'bg-orange-100 text-orange-600':
                          data.status === 'Pending Signature' ||
                          data.status === 'Draft',
                        'bg-green-100 text-green-600':
                          data.status === 'PartiallyDelivered' ||
                          data.status === 'Delivered' ||
                          data.status === 'Completed',
                        'bg-red-100 text-red-600':
                          data.status === 'Cancelled' ||
                          data.status === 'Expired',
                      }"
                    >
                      {{ data.status }}
                    </div>
                  </div>
                </td>

                <td class="text-center!">
                  <div
                    class="flex items-center justify-center"
                    *ngIf="
                      data.status !== 'Completed' && data.status !== 'Cancelled'
                    "
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
                      [value]="item.timeline"
                      align="top"
                      layout="horizontal"
                      class="customized-timeline w-full"
                    >
                      <ng-template #marker let-event>
                        <div
                          class="w-6 h-6 p-2 flex items-center justify-center rounded-full shadow-sm text-white"
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
                  <div class="text-center text-gray-500">
                    No outbound delivery orders found in records.
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      </div>
    </div>
    <p-menu #menu [model]="menuItems" [popup]="true"></p-menu>

    <p-dialog
      header="Select Reviewer"
      [(visible)]="displayReviseByDialog"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      styleClass="w-[80%]! lg:w-[50%]!"
    >
      <div class="flex flex-col gap-4 mt-2">
        <label class="font-medium"
          >Assign a reviewer for this do:
          <b>{{ selectedDO?.deliveryOrderNo }}</b></label
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
        ></p-button> </ng-template
    ></p-dialog>`,
  styleUrl: './outbound-do.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutboundDo implements OnInit, OnDestroy {
  @ViewChild('fTable') fTable?: Table;

  private readonly deliveryOrderService = inject(DeliveryOrderService);
  private readonly loadingService = inject(LoadingService);
  private readonly messageService = inject(MessageService);
  private readonly userService = inject(UserService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  PagingSignal = signal<PagingContent<DeliveryOrderDto>>(
    {} as PagingContent<DeliveryOrderDto>,
  );
  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  search: string = '';
  selectedReviewerId: string | null = null;

  displayReviseByDialog: boolean = false;

  menuItems: MenuItem[] = [];
  currentUser = this.userService.currentUser;
  reviewerSelection: { label: string; value: string }[] = [];

  selectedDO: any;

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 10;
    this.Query.Filter = null;
    this.Query.OrderBy = 'CreatedAt desc';
    this.Query.Select = null;
    this.Query.Includes = 'Project,SenderCompany,ReceiverCompany';
  }

  ngOnInit(): void {}

  GetData() {
    this.loadingService.start();

    this.deliveryOrderService.GetMany(this.Query).subscribe({
      next: (res) => {
        this.loadingService.stop();

        const statusOrder = [
          'Draft',
          'UnderReview',
          'Approved',
          'Prepared',
          'OutForDelivery',
          'PartiallyDelivered',
          'Delivered',
          'Completed',
          'Cancelled',
        ];

        const colorMap: Record<string, string> = {
          Draft: 'bg-orange-400',
          UnderReview: 'bg-yellow-400',
          Approved: 'bg-blue-400',
          Prepared: 'bg-green-400',
          OutForDelivery: 'bg-yellow-400',
          PartiallyDelivered: 'bg-purple-400',
          Delivered: 'bg-indigo-400',
          Completed: 'bg-teal-400',
          Cancelled: 'bg-red-400',
        };

        const enhancedData = res.data.map((order) => {
          const histories = order.deliveryOrderStatusHistories || [];

          const latestByStatus = new Map<string, any>();

          for (const h of histories) {
            const existing = latestByStatus.get(h.status);

            if (
              !existing ||
              new Date(h.actionAt) > new Date(existing.actionAt)
            ) {
              latestByStatus.set(h.status, h);
            }
          }

          const reachedIndex =
            Math.max(...histories.map((h) => statusOrder.indexOf(h.status))) ??
            -1;

          const timeline = statusOrder.map((status, index) => {
            const item = latestByStatus.get(status);

            let displayUser = item?.actionUser?.name;

            return {
              status,
              actionAt: item?.actionAt ?? null,
              actionUser: displayUser,
              color: colorMap[status],
              verified: index <= reachedIndex,
            };
          });

          return {
            ...order,
            timeline,
          };
        });

        this.PagingSignal.set({
          ...res,
          data: enhancedData,
        });

        this.cdr.markForCheck();
      },
      error: (err) => {
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

    this.Query.Filter = this.Query.Filter
      ? `${this.Query.Filter},Type=Outbound`
      : 'Type=Outbound';

    this.GetData();
  }

  onKeyDown(event: KeyboardEvent) {
    const isEnter = event.key === 'Enter';
    const isBackspaceClear =
      event.key === 'Backspace' && this.search.length === 0;

    if (isEnter) {
      this.Search(this.search);
    } else if (isBackspaceClear) {
      this.Search('');
    }
  }

  Search(data: string) {
    const filter = {
      DeliveryOrderNo: [
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

    this.Query.Filter = `Type=Outbound`;
    this.GetData();
  }

  ActionClick(data: DeliveryOrderDto | null, action: string) {
    if (!data && action !== 'Create') return;

    switch (action) {
      case 'Update':
        this.router.navigate(['/delivery-order/outbound/form'], {
          queryParams: { id: data?.id },
        });
        break;
      case 'Delete':
        this.RemoveRecord(data!);
    }
  }

  RemoveRecord(data: DeliveryOrderDto) {
    this.loadingService.start();
    this.deliveryOrderService
      .Delete(data.id)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          const currentPaging = this.PagingSignal();
          const updatedData = currentPaging.data.filter(
            (d) => d.id !== data.id,
          );

          this.PagingSignal.set({
            ...currentPaging,
            data: updatedData,
            totalElements: currentPaging.totalElements - 1,
          });
          this.cdr.markForCheck();
          this.messageService.add({
            severity: 'success',
            summary: 'Record Deleted',
            detail: `Delivery Order ${data.deliveryOrderNo} has been deleted.`,
          });
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail:
              err?.error?.detail || err?.message || 'Failed to delete record.',
          });
        },
        complete: () => {
          this.loadingService.stop();
        },
      });
  }

  onEllipsisClick(event: any, doData: DeliveryOrderDto, menu: any) {
    const isReviewer = doData.deliveryOrderStatusHistories?.some(
      (h: any) => String(h.reviewByUserId) === String(this.currentUser?.userId),
    );

    this.menuItems = this.buildMenuItems(doData, isReviewer);
    menu.toggle(event);
  }

  private buildMenuItems(
    doData: DeliveryOrderDto,
    isReviewer: boolean,
  ): MenuItem[] {
    const id = doData.id;

    const actions: Record<string, MenuItem[]> = {
      Draft: [
        {
          label: 'Edit Delivery Order',
          icon: 'pi pi-pencil',
          command: () =>
            this.router.navigate(['/delivery-orders/outbound/form'], {
              queryParams: { id },
            }),
        },
        {
          label: 'Submit for Review',
          icon: 'pi pi-send',
          command: () => this.showReviewerSelectionDialog(doData),
        },
      ],

      UnderReview: isReviewer
        ? [
            {
              label: 'Approve',
              icon: 'pi pi-check-circle',
              command: () => this.updateStatus(id, 'Approved'),
            },
            {
              label: 'Reject',
              icon: 'pi pi-times-circle',
              command: () => this.updateStatus(id, 'Draft'),
            },
          ]
        : [],

      Approved: [
        {
          label: 'Mark as Prepared',
          icon: 'pi pi-box',
          command: () => this.updateStatus(id, 'Prepared'),
        },
      ],

      Prepared: [
        {
          label: 'Dispatch / Out for Delivery',
          icon: 'pi pi-truck',
          command: () => this.updateStatus(id, 'OutForDelivery'),
        },
      ],

      OutForDelivery: [
        {
          label: 'Mark as Partially Delivered',
          icon: 'pi pi-clipboard',
          command: () => this.updateStatus(id, 'PartiallyDelivered'),
        },
        {
          label: 'Mark as Delivered',
          icon: 'pi pi-check-circle',
          command: () => this.updateStatus(id, 'Delivered'),
        },
      ],

      PartiallyDelivered: [
        {
          label: 'Complete Delivery',
          icon: 'pi pi-check-circle',
          command: () => this.updateStatus(id, 'Delivered'),
        },
      ],

      Delivered: [
        {
          label: 'Mark as Completed',
          icon: 'pi pi-verified',
          command: () => this.updateStatus(id, 'Completed'),
        },
      ],
    };

    return actions[doData.status] ?? [];
  }

  updateStatus(id: string, newStatus: string, userId?: string) {
    this.loadingService.start();

    this.deliveryOrderService
      .UpdateStatus(id, newStatus)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();

          const currentPaging = this.PagingSignal();

          const updatedData = currentPaging.data.map((q) => {
            if (q.id === id) {
              const newHistory = {
                id: res.id,
                status: res.status,
                actionAt: res.actionAt,
                remarks: res.remarks,
                actionUser: res.actionUser,
                purchaseOrderId: q.id,
                actionUserId: res.actionUser?.id,
                createdAt: res.actionAt,
                signatureImage: null,
              } as any;

              const updatedHistories = [
                ...(q.deliveryOrderStatusHistories || []),
                newHistory,
              ];

              return {
                ...q,
                status: newStatus,
                deliveryOrderStatusHistories: updatedHistories,
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
            detail: res.remarks,
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

  showReviewerSelectionDialog(doData: any) {
    this.selectedDO = doData;
    this.selectedReviewerId = null;
    this.displayReviseByDialog = true;

    this.userService
      .GetMany({
        Page: 1,
        PageSize: 100,
        OrderBy: 'FullName desc',
        Select: 'Id,FullName,JobTitle,Email',
        Includes: null,
        Filter: null,
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
    if (!this.selectedDO) return;

    this.loadingService.start();

    this.deliveryOrderService
      .UpdateStatus(this.selectedDO.id, 'UnderReview', this.selectedReviewerId)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();

          const currentPaging = this.PagingSignal();

          const reviewer = this.reviewerSelection.find(
            (x) => x.value === this.selectedReviewerId,
          );
          const reviewerName = reviewer?.label.split(' — ')[0] || '-';

          const updatedData = currentPaging.data.map((q) => {
            if (q.id === this.selectedDO.id) {
              const newHistory = {
                id: res.id,
                status: res.status,
                actionAt: res.ActionAt,
                remarks: res.remarks,
                actionUser: res.actionUser,
                reviewedByUser: {
                  id: this.selectedReviewerId,
                  fullName: reviewerName,
                },
                deliveryOrderId: q.id,
                actionUserId: res.actionUser?.id,
                reviewedByUserId: this.selectedReviewerId,
                createdAt: res.ActionAt,
              } as any;

              const updatedHistories = [
                ...(q.deliveryOrderStatusHistories || []),
                newHistory,
              ];

              return {
                ...q,
                status: 'UnderReview',
                deliveryOrderStatusHistories: updatedHistories,
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
            detail: res.remarks,
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

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
