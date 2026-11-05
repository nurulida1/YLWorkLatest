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
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { MaterialRequestService } from '../../../services/materialRequestService';
import { LoadingService } from '../../../services/loading.service';
import { Router, RouterLink } from '@angular/router';
import { map, Observable, Subject, takeUntil } from 'rxjs';
import {
  BuildFilterText,
  BuildSortText,
  GridifyQueryExtend,
  PagingContent,
} from '../../../shared/helpers/helpers';
import { MaterialRequestDto } from '../../../models/MaterialRequest';
import { MenuItem, MessageService } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { UserService } from '../../../services/userService.service';
import { TextareaModule } from 'primeng/textarea';
import { PermissionContextService } from '../../../services/permission-context.service';
import { ProgressBarModule } from 'primeng/progressbar';
import { environment } from '../../../../environments/environment.development';

@Component({
  selector: 'app-material-requests',
  imports: [
    CommonModule,
    TableModule,
    InputTextModule,
    ButtonModule,
    FormsModule,
    RouterLink,
    MenuModule,
    DialogModule,
    SelectModule,
    TextareaModule,
    ProgressBarModule,
  ],
  template: `
    <div class="flex flex-col lg:hidden">
      <div
        class="relative bg-[#1D4ED8] rounded-b-[2.5rem] overflow-hidden pb-3"
      >
        <div
          class="absolute -top-20 -right-15 w-56 h-56 bg-white/10 rounded-full border border-white/15 flex items-center justify-center"
        >
          <div
            class="w-44 h-44 rounded-full border border-white/20 bg-[#1D4ED8]"
          ></div>
        </div>

        <div
          class="absolute top-8 -right-20 w-36 h-36 rounded-full bg-white/5"
        ></div>

        <div class="relative z-10 h-full px-6 py-6 flex flex-col">
          <div class="flex flex-row items-center justify-between">
            <div
              class="flex flex-row items-center px-3 py-1 rounded-full border border-white/20 bg-white/10 gap-2"
            >
              <i class="pi pi-circle-fill text-[4px]! text-green-500!"></i>
              <span class="font-semibold text-white/80 text-sm"
                >YL WORKS ENTERPRISE</span
              >
            </div>

            <div class="flex flex-row items-center gap-2">
              <div
                class="w-11 h-11 rounded-full flex items-center justify-center bg-white/10 border border-white/30"
              >
                <i class="pi pi-bell text-white!"></i>
              </div>
              <div
                class="w-11 h-11 rounded-full flex items-center justify-center bg-white/10 border border-white/20"
              >
                <div class="font-semibold text-white text-shadow-sm">
                  {{ getInitial(currentUser?.displayName) }}
                </div>
              </div>
            </div>
          </div>
          <div class="flex flex-row justify-between mt-5">
            <div class="flex flex-col gap-1">
              <b class="text-2xl text-white text-shadow-sm"
                >Material Requests</b
              >
              <span class="text-sm text-white/80"
                >Request site tools, raw materials & equipment</span
              >
            </div>
            <p-button
              [routerLink]="'/material-requests/form'"
              label="Request"
              size="small"
              [rounded]="true"
              icon="pi pi-plus"
              styleClass="bg-white! border-none! text-blue-900! px-5! py-2! font-bold! shadow-lg!"
            ></p-button>
          </div>

          <div
            class="flex flex-row items-center gap-2 p-2 rounded-md bg-white/10 border border-white/20 mt-4"
          >
            <i class="pi pi-truck text-yellow-400!"></i>
            <span
              class="font-semibold text-sm text-white tracking-wide text-shadow-sm"
              >5 active dispatches scheduled</span
            >
          </div>
        </div>
      </div>
      <div class="flex flex-col px-7 py-4">
        <div class="flex flex-row items-center justify-between">
          <div class="font-bold text-xl">Overview Status</div>
          <div class="flex flex-row items-center gap-1">
            <div
              class="text-sm text-blue-700 font-semibold"
              [routerLink]="'/inventory'"
            >
              Site Inventory
            </div>
            <i class="pi pi-chevron-right text-xs! text-blue-700!"></i>
          </div>
        </div>
        <div class="mt-4 grid grid-cols-12 gap-4">
          <div
            class="col-span-6 flex flex-col p-3 border border-gray-200 rounded-lg"
          >
            <div class="flex flex-row items-center justify-between">
              <div class="text-gray-500 font-semibold text-xs tracking-wide">
                ACTIVE REQS
              </div>
              <div
                class="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50"
              >
                <i class="pi pi-truck text-blue-800!"></i>
              </div>
            </div>
            <div class="text-gray-500 text-sm">
              <b class="text-3xl text-gray-900">0</b> / 0 In Progress
            </div>
            <div class="py-2">
              <p-progressbar
                [style]="{ height: '6px' }"
                [value]="50"
                [showValue]="false"
                [color]="'blue'"
              ></p-progressbar>
            </div>
            <div class="flex flex-row items-center justify-between text-xs">
              <div class="text-gray-500">Pending: 2</div>
              <div class="text-blue-600 font-semibold">60% Active</div>
            </div>
          </div>
          <div
            class="col-span-6 flex flex-col p-3 border border-gray-200 rounded-lg"
          >
            <div class="flex flex-row items-center justify-between">
              <div class="text-gray-500 font-semibold text-xs tracking-wide">
                SITE DELIVERIES
              </div>
              <div
                class="w-8 h-8 flex items-center justify-center rounded-lg bg-green-50"
              >
                <i class="pi pi-verified text-green-800!"></i>
              </div>
            </div>
            <div class="text-gray-500 text-sm">
              <b class="text-3xl text-gray-900">8</b> Delivered
            </div>
            <div class="py-2">
              <p-progressbar
                [style]="{ height: '6px' }"
                [value]="100"
                [showValue]="false"
                [color]="'green'"
              ></p-progressbar>
            </div>
            <div class="flex flex-row items-center justify-between text-xs">
              <div class="text-gray-500">100% on time</div>
              <div class="text-green-600 font-semibold">100% Fulfilled</div>
            </div>
          </div>
        </div>
        <div
          class="text-sm bg-gray-200 rounded-lg p-1 grid grid-cols-12 w-full mt-4"
        >
          <div
            class="col-span-3 bg-white text-blue-800 font-semibold text-center p-2 rounded-lg"
          >
            All
          </div>
          <div class="col-span-3 text-gray-700 font-semibold text-center p-2">
            Pending
          </div>
          <div class="col-span-3 text-gray-700 font-semibold text-center p-2">
            In Transit
          </div>
          <div class="col-span-3 text-gray-700 font-semibold text-center p-2">
            Delivered
          </div>
        </div>
        <div class="flex flex-row items-center justify-between text-sm py-4">
          <div class="font-bold text-gray-500">REQUISITION RECORDS</div>
          <span class="text-xs text-gray-400"
            >{{ PagingSignal().totalElements ?? 0 }} Records</span
          >
        </div>
        <div class="flex flex-col gap-3">
          <ng-container *ngFor="let data of PagingSignal().data">
            <div
              class="p-4 bg-white border border-gray-200 rounded-xl flex flex-col shadow-sm"
            >
              <!-- TOP -->
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                  <!-- Icon -->
                  <div
                    class="shrink-0 rounded-xl w-11 h-11 flex items-center justify-center"
                  >
                    <i
                      class="pi text-orange-600! bg-orange-50"
                      [ngClass]="{ 'pi-file-o': data.status === 'Draft' }"
                    ></i>
                  </div>

                  <!-- Request Info -->
                  <div class="flex flex-col min-w-0">
                    <b class="text-base text-gray-900">
                      {{ data.requestNo }}
                    </b>

                    <span class="text-gray-500 text-xs truncate">
                      Site:
                      {{
                        data.project
                          ? data.project.projectTitle
                          : data.location || 'No site specified'
                      }}
                    </span>
                  </div>
                </div>

                <!-- PRIORITY BADGE -->
                <div
                  class="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                  [ngClass]="{
                    'bg-red-50 text-red-700 border border-red-200':
                      data.priority === 'Urgent',
                    'bg-orange-50 text-orange-700 border border-orange-200':
                      data.priority === 'High',
                    'bg-blue-50 text-blue-700 border border-blue-200':
                      data.priority === 'Standard',
                    'bg-gray-50 text-gray-600 border border-gray-200':
                      !data.priority,
                  }"
                >
                  <i
                    class="pi text-[4px]!"
                    [ngClass]="{
                      'pi-bolt': data.priority === 'Urgent',
                      'pi-arrow-up': data.priority === 'High',
                      'pi-circle-fill': data.priority === 'Standard',
                    }"
                  ></i>

                  {{ data.priority || 'Standard' }}
                </div>
              </div>

              <!-- MATERIAL ITEMS -->
              <div
                class="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-3"
              >
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-2">
                    <i class="pi pi-box text-gray-500! text-sm!"></i>
                    <span class="text-xs font-bold text-gray-500 tracking-wide">
                      REQUESTED ITEMS
                    </span>
                  </div>

                  <div
                    class="text-xs font-bold bg-white border border-gray-200 rounded-full px-2.5 py-1 text-gray-600"
                  >
                    {{ data.materialItems?.length || 0 }}
                    {{ data.materialItems?.length === 1 ? 'Item' : 'Items' }}
                  </div>
                </div>

                <!-- Item preview -->
                <div
                  *ngFor="
                    let item of data.materialItems?.slice(0, 2);
                    let last = last
                  "
                  class="flex items-center justify-between py-2"
                  [ngClass]="{
                    'border-b border-gray-200': !last,
                  }"
                >
                  <div class="flex items-center gap-2 min-w-0">
                    <div
                      class="w-7 h-7 shrink-0 bg-white border border-gray-200 rounded-lg flex items-center justify-center"
                    >
                      <i
                        *ngIf="!item.inventory?.attachment"
                        class="pi pi-box text-gray-400! text-xs!"
                      ></i>
                      <img
                        *ngIf="item.inventory?.attachment"
                        [src]="attachmentUrl + item.inventory?.attachment"
                        class="w-full h-full object-contain"
                      />
                    </div>

                    <div class="flex flex-col">
                      <span
                        class="text-sm font-semibold text-gray-800 truncate"
                      >
                        {{ item.inventory?.itemName || 'Material Item' }}
                      </span>
                      <span class="text-xs text-gray-500 font-semibold">{{
                        item.inventory?.itemCode
                      }}</span>
                    </div>
                  </div>

                  <span class="text-xs font-bold text-gray-500 ml-3">
                    ×{{ item.quantity }} {{ item.unit }}
                  </span>
                </div>

                <!-- More items -->
                <div
                  *ngIf="(data.materialItems?.length || 0) > 2"
                  class="text-xs text-blue-700 font-semibold text-center pt-2"
                >
                  +{{ data.materialItems.length - 2 }} more items
                </div>
              </div>

              <!-- META -->
              <div class="grid grid-cols-2 gap-3 mt-3">
                <!-- Requested Date -->
                <div class="flex flex-col gap-1">
                  <span class="text-[11px] text-gray-400 font-semibold">
                    REQUESTED DATE
                  </span>

                  <div class="flex items-center gap-1.5">
                    <i class="pi pi-calendar text-gray-400! text-xs!"></i>
                    <span class="text-sm font-semibold text-gray-700">
                      {{ data.requestDate | date: 'dd MMM yyyy' }}
                    </span>
                  </div>
                </div>

                <!-- Status -->
                <div class="flex flex-col items-end gap-1">
                  <span class="text-[11px] text-gray-400 font-semibold">
                    STATUS
                  </span>

                  <div
                    class="w-fit px-2.5 py-1 rounded-full text-xs font-semibold"
                    [ngClass]="{
                      'bg-amber-50 text-amber-700': data.status === 'Draft',
                      'bg-orange-50 text-orange-700':
                        data.status === 'PendingApproval',
                      'bg-blue-50 text-blue-700': data.status === 'Approved',
                      'bg-indigo-50 text-indigo-700': data.status === 'Issued',
                      'bg-sky-50 text-sky-700': data.status === 'Partial',
                      'bg-green-50 text-green-700': data.status === 'Completed',
                      'bg-red-50 text-red-700': data.status === 'Rejected',
                    }"
                  >
                    {{ data.status }}
                  </div>
                </div>
              </div>

              <!-- DIVIDER -->
              <div class="border-t border-gray-100 my-4"></div>

              <!-- REQUESTER + ACTION -->
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-2 min-w-0">
                  <div
                    class="shrink-0 text-xs font-semibold text-white w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center"
                  >
                    {{
                      getInitial(
                        data.requestedBy?.displayName ??
                          data.requestedBy?.fullName
                      )
                    }}
                  </div>

                  <div class="flex flex-col min-w-0">
                    <b class="text-xs text-gray-800 truncate">
                      {{
                        data.requestedBy?.displayName ??
                          data.requestedBy?.fullName
                      }}
                    </b>

                    <span class="text-[11px] text-gray-400 truncate">
                      {{ data.requestedBy?.jobTitle }}
                    </span>
                  </div>
                </div>

                <div class="flex items-center gap-2 shrink-0">
                  <p-button
                    label="View Request"
                    severity="secondary"
                    size="small"
                    styleClass="!px-3 !rounded-lg !bg-gray-100 rounded-none! !text-gray-700 !font-semibold"
                  >
                  </p-button>

                  <p-button
                    *ngIf="data.status === 'Draft'"
                    label="Cancel"
                    severity="danger"
                    size="small"
                    styleClass="!rounded-lg !bg-red-50 !text-red-600 border-none!"
                  ></p-button>
                </div>
              </div>
            </div>
          </ng-container>
        </div>
      </div>
    </div>

    <div class="w-full min-screen hidden lg:flex flex-col p-5">
      <div class="flex flex-row items-center gap-1 text-gray-500 tracking-wide">
        <div
          [routerLink]="'/dashboard'"
          class="cursor-pointer hover:text-gray-600"
        >
          Dashboard
        </div>
        /
        <div class="text-gray-700 font-semibold">Material Requests</div>
      </div>

      <div
        class="mt-3 border border-gray-200 rounded-md tracking-wide bg-white p-5 flex flex-col"
      >
        <div
          class="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-0 justify-between"
        >
          <div class="flex flex-col">
            <div class="text-[19px] text-gray-700 font-semibold">
              Material Requests
            </div>
            <div class="text-gray-500">
              View, create, and track all material requests in one place.
            </div>
          </div>

          <div class="flex flex-row items-center gap-2">
            <div class="min-w-[300px] relative">
              <input
                type="text"
                pInputText
                placeholder="Search..."
                class="w-full"
                [(ngModel)]="search"
                (keydown)="onKeyDown($event)"
              />
              <i
                class="pi pi-search absolute! top-3! right-2! text-gray-500!"
              ></i>
            </div>
            <p-button
              *hasPermissionAction="'canCreate'"
              label="New Material Request"
              [routerLink]="'/material-requests/form'"
              icon="pi pi-plus-circle"
              severity="info"
              styleClass="py-2! whitespace-nowrap!"
            ></p-button>
          </div>
        </div>
        <div class="mt-3">
          <p-table
            #fTable
            [value]="PagingSignal().data"
            [paginator]="true"
            [rows]="Query.PageSize"
            [totalRecords]="PagingSignal().totalElements"
            [lazy]="true"
            [showGridlines]="true"
            [tableStyle]="{ 'min-width': '60rem' }"
            (onLazyLoad)="NextPage($event)"
          >
            <ng-template #header>
              <tr>
                <th
                  pSortableColumn="RequestNo"
                  class="bg-gray-100! text-center! w-[15%]!"
                >
                  <div class="flex flex-row justify-center items-center gap-2">
                    <div>Request No</div>
                    <p-sortIcon field="RequestNo" />
                  </div>
                </th>
                <th class="bg-gray-100! text-center! w-[30%]">Client</th>
                <th
                  pSortableColumn="RequestDate"
                  class="bg-gray-100!  text-center! w-[15%]"
                >
                  <div class="flex flex-row justify-center items-center gap-2">
                    <div>Requested Date</div>
                    <p-sortIcon field="RequestDate" />
                  </div>
                </th>
                <th class="bg-gray-100! text-center! w-[20%]">Requested By</th>
                <th
                  pSortableColumn="Status"
                  class="bg-gray-100!  text-center! w-[15%]"
                >
                  <div class="flex flex-row justify-center items-center gap-2">
                    <div>Status</div>
                    <p-sortIcon field="Status" />
                  </div>
                </th>
                <th
                  *ngIf="
                    rights().canUpdate ||
                    rights().canDelete ||
                    rights().canUpdateStatus
                  "
                  class="bg-gray-100! text-center! w-[10%]"
                >
                  Action
                </th>
              </tr>
            </ng-template>
            <ng-template #body let-data>
              <tr>
                <td class="text-center! font-semibold!">
                  {{ data.requestNo }}
                </td>
                <td class="text-center!">
                  {{ data.client?.name }}
                </td>
                <td class="text-center!">
                  {{ data.requestDate | date: 'dd/MM/yyyy' }}
                </td>
                <td class="text-center!">
                  {{ data.requestedBy?.fullName }}
                </td>
                <td class="text-center!">
                  <div class="flex items-center justify-center">
                    <div
                      class="px-4 py-1 rounded-full"
                      [ngClass]="{
                        'bg-amber-100 text-amber-600': data.status === 'Draft',
                        'bg-orange-100 text-orange-600':
                          data.status === 'PendingApproval',
                        'bg-blue-100 text-blue-600': data.status === 'Approved',
                        'bg-indigo-100 text-indigo-600':
                          data.status === 'Issued',
                        'bg-sky-100 text-sky-600': data.status === 'Partial',
                        'bg-green-100 text-green-600':
                          data.status === 'Completed',
                        'bg-red-100 text-red-600': data.status === 'Rejected',
                      }"
                    >
                      {{ data.status }}
                    </div>
                  </div>
                </td>
                <td
                  *ngIf="
                    rights().canUpdate ||
                    rights().canDelete ||
                    rights().canUpdateStatus
                  "
                  class="text-center!"
                >
                  <i
                    *ngIf="
                      data.status !== 'Rejected' && data.status !== 'Completed'
                    "
                    class="pi pi-ellipsis-h cursor-pointer"
                    (click)="onEllipsisClick($event, data, menu)"
                  ></i>
                </td></tr
            ></ng-template>

            <ng-template #emptymessage>
              <tr>
                <td colspan="100%">
                  <div class="flex flex-col items-center justify-center">
                    <div class="text-gray-500">No material requests found.</div>
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
    ></p-menu>

    <p-dialog
      [modal]="true"
      [(visible)]="showApprovalDialog"
      [closable]="false"
      [draggable]="false"
      styleClass="w-[30%]"
    >
      <ng-template #headless>
        <div class="flex flex-col p-5">
          <b class="text-[18px] pb-4">Assign Approver</b>
          <div class="text-gray-600 text-[14px] mb-2 text-sm">
            Please select the management or director who will review and approve
            this material request.
          </div>
          <p-select
            [options]="(userSelections$ | async) || []"
            [(ngModel)]="selectedApprovalUserId"
            placeholder="Select Approver"
            appendTo="body"
            styleClass="w-full!"
            [filter]="true"
            panelStyleClass=""
            [showClear]="selectedApprovalUserId"
          ></p-select>

          <div class="border-b border-gray-200 mt-3 mb-3"></div>
          <div class="flex flex-row gap-2 justify-center mt-3">
            <p-button
              label="Cancel"
              (onClick)="showApprovalDialog = false"
              styleClass="tracking-wide! border-gray-200! py-1!"
              severity="secondary"
            ></p-button>
            <!-- <p-button
              label="Confirm"
              (onClick)="SetApproval()"
              styleClass="tracking-wide! py-1!"
              severity="info"
              [disabled]="!selectedApprovalUserId"
            ></p-button> -->
          </div>
        </div></ng-template
      >
    </p-dialog>

    <p-dialog
      [modal]="true"
      [(visible)]="showRejectedDialog"
      [closable]="false"
      [draggable]="false"
      styleClass="w-[450px] overflow-hidden rounded-xl"
    >
      <ng-template #headless>
        <div class="bg-white p-6 flex flex-col gap-4">
          <div class="flex items-center gap-3">
            <div class="bg-red-50 p-2 rounded-full">
              <i class="pi pi-exclamation-triangle text-red-600 text-xl"></i>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900 m-0">
                Reject Material
              </h3>
              <p class="text-sm text-gray-500">
                Please provide a reason for rejecting this item.
              </p>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <label for="reason" class="text-sm font-medium text-gray-700"
              >Rejection Reason</label
            >
            <textarea
              id="reason"
              pTextarea
              rows="3"
              class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
              [(ngModel)]="rejectReason"
              placeholder="e.g., Incomplete documentation..."
            ></textarea>
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <p-button
              label="Cancel"
              (onClick)="showRejectedDialog = false"
              severity="secondary"
              styleClass="border-gray-200! px-4 py-2 font-medium text-gray-600 hover:bg-gray-100"
            ></p-button>
            <p-button
              label="Confirm Rejection"
              (onClick)="ActionClick(selectedMaterial, 'Reject')"
              severity="danger"
              styleClass="px-4 py-2 font-medium"
            ></p-button>
          </div>
        </div>
      </ng-template>
    </p-dialog>
  `,
  styleUrl: './material-requests.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaterialRequests implements OnInit, OnDestroy {
  @ViewChild('fTable') fTable?: Table;

  private readonly materialRequestService = inject(MaterialRequestService);
  private readonly userService = inject(UserService);
  private readonly loadingService = inject(LoadingService);
  private readonly messageService = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly permissionContext = inject(PermissionContextService);
  readonly rights = this.permissionContext.rights;
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  PagingSignal = signal<PagingContent<MaterialRequestDto>>(
    {} as PagingContent<MaterialRequestDto>,
  );
  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  search: string = '';
  rejectReason: string | null = null;
  selectedApprovalUserId: string | null = null;
  menuItems: MenuItem[] = [];
  attachmentUrl: string = environment.AttachmentUrl;

  selectedMaterial!: MaterialRequestDto | null;
  showApprovalDialog: boolean = false;
  showRejectedDialog: boolean = false;
  userSelections$!: Observable<{ label: string; value: string }[]>;
  selectedUserId = this.userService.currentUser?.userId ?? undefined;
  currentUser = this.userService.currentUser;

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 10;
    if (this.currentUser?.systemRole === 'Director') {
      this.Query.Filter = `ApproverById=${this.currentUser.userId}`;
    } else {
      this.Query.Filter = null;
    }
    this.Query.Filter = null;
    this.Query.OrderBy = `CreatedAt desc`;
    this.Query.Select = null;
    this.Query.Includes = 'Client,RequestedBy';
  }

  ngOnInit(): void {}

  GetData() {
    this.loadingService.start();
    this.materialRequestService
      .GetMany(this.Query)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.PagingSignal.set(res);
          this.loadingService.stop();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loadingService.stop();
          this.cdr.markForCheck();
        },
      });
  }

  NextPage(event: TableLazyLoadEvent) {
    if ((event?.first || event?.first === 0) && event?.rows) {
      this.Query.Page = event.first / event.rows + 1 || 1;
      this.Query.PageSize = event.rows;
    }

    const sortText = BuildSortText(event);
    this.Query.OrderBy = sortText ? sortText : `CreatedAt desc`;

    if (this.currentUser?.systemRole === 'Director') {
      this.Query.Filter = `ApprovedById=${this.currentUser.userId}`;
    }

    this.Query.Filter =
      this.currentUser?.systemRole === 'Director'
        ? `ApprovedById=${this.currentUser.userId}`
        : BuildFilterText(event);
    this.GetData();
  }

  onKeyDown(event: KeyboardEvent) {
    const isEnter = event.key === 'Enter';
    const isBackspace = event.key === 'Backspace' && this.search === '';

    if (isEnter) {
      this.Search(this.search);
    } else if (isBackspace) {
      this.Search('');
    }
  }

  Search(data: string) {
    const filter = {
      RequestNo: [
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

  ActionClick(data: MaterialRequestDto | null, action: string) {
    if (data) {
      switch (action) {
        case 'Update':
          this.router.navigate(['/material-requests/form'], {
            queryParams: { id: data?.id },
          });
          break;
        case 'Delete':
          this.loadingService.start();
          this.materialRequestService
            .Delete(data.id)
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe({
              next: (res) => {
                this.loadingService.stop();
                const currentPaging = this.PagingSignal();
                const updatedData = currentPaging.data.filter(
                  (item) => item.id !== data.id,
                );

                this.PagingSignal.set({
                  ...currentPaging,
                  data: updatedData,
                  totalElements: currentPaging.totalElements - 1,
                });
                this.cdr.markForCheck();
                this.messageService.add({
                  severity: 'success',
                  summary: 'Success',
                  detail: 'Material Request deleted successfully',
                });
              },
              error: (err) => {
                this.loadingService.stop();
                this.cdr.markForCheck();
              },
            });
          break;
        // case 'RequestApproval':
        //   this.openApproveDialog(data);
        //   break;
        // case 'Approve':
        //   this.updateStatus(data, 'Approved');
        //   break;
        // case 'Reject':
        //   this.updateStatus(data, 'Rejected');
        //   break;
      }
    }
  }

  onEllipsisClick(event: any, material: MaterialRequestDto, menu: any) {
    this.menuItems = [];

    if (material.status === 'Draft') {
      if (this.rights().canUpdate) {
        this.menuItems.push({
          label: 'Edit',
          icon: 'pi pi-pencil',
          command: () => this.ActionClick(material, 'Update'),
        });
      }

      if (this.rights().canUpdateStatus) {
        this.menuItems.push({
          label: 'Request Approval',
          icon: 'pi pi-send',
          command: () => this.ActionClick(material, 'RequestApproval'),
        });
      }

      if (this.rights().canDelete) {
        this.menuItems.push({
          label: 'Delete',
          icon: 'pi pi-trash',
          command: () => this.ActionClick(material, 'Delete'),
        });
      }
    }

    // // If pending approval → management can approve/reject
    // if (
    //   material.status === 'PendingApproval' &&
    //   this.selectedUserId === material.approvedById
    // ) {
    //   this.menuItems.push(
    //     {
    //       label: 'Approve',
    //       icon: 'pi pi-check',
    //       command: () => this.ActionClick(material, 'Approve'),
    //     },
    //     {
    //       label: 'Reject',
    //       icon: 'pi pi-times',
    //       command: () => this.openRejectDialog(material),
    //     },
    //   );
    // }

    // if (material.status === 'Approved') {
    //   this.menuItems.push({
    //     label: 'Issued',
    //     icon: 'pi pi-receipt',
    //     command: () => this.updateStatus(material, 'Issued'),
    //   });
    // }

    // if (material.status === 'Issued') {
    //   this.menuItems.push({
    //     label: 'Completed',
    //     icon: 'pi pi-check-circle',
    //     command: () => this.updateStatus(material, 'Completed'),
    //   });
    // }

    menu.toggle(event);
  }

  getInitial(fullName?: string): string {
    if (!fullName?.trim()) return '?';

    const names = fullName.trim().split(/\s+/).filter(Boolean);

    if (names.length === 1) {
      return names[0].substring(0, 2).toUpperCase();
    }

    return (names[0].charAt(0) + names[1].charAt(0)).toUpperCase();
  }

  //   updateStatus(material: MaterialRequestDto, status: string) {
  //     this.loadingService.start();

  //     this.materialRequestService
  //       .UpdateStatus({
  //         id: material.id,
  //         status: status,
  //         approvedById: this.selectedApprovalUserId ?? undefined,
  //         rejectionReason: this.rejectReason ?? undefined,
  //       }) // create this API
  //       .pipe(takeUntil(this.ngUnsubscribe))
  //       .subscribe({
  //         next: () => {
  //           material.status = status;
  //           this.loadingService.stop();
  //           this.showApprovalDialog = false;
  //           this.showRejectedDialog = false;
  //           this.cdr.markForCheck();
  //           this.messageService.add({
  //             severity: 'success',
  //             summary: 'Success',
  //             detail: `Status updated to ${status}`,
  //           });
  //         },
  //         error: () => {
  //           this.loadingService.stop();
  //           this.cdr.markForCheck();
  //         },
  //       });
  //   }

  //   openApproveDialog(material: MaterialRequestDto) {
  //     this.userSelections$ = this.userService
  //       .GetMany({
  //         Page: 1,
  //         PageSize: 1000000,
  //         OrderBy: 'FirstName desc',
  //         Filter: null,
  //         Select: null,
  //         Includes: null,
  //       })
  //       .pipe(
  //         map((res) =>
  //           res.data.map((user) => ({
  //             label: `${user.firstName} ${user.lastName}`,
  //             value: user.id,
  //           })),
  //         ),
  //       );
  //     this.selectedMaterial = material;
  //     this.selectedApprovalUserId = null;
  //     this.showApprovalDialog = true;
  //   }

  //   openRejectDialog(material: MaterialRequestDto) {
  //     this.selectedMaterial = material;
  //     this.showRejectedDialog = true;
  //     this.cdr.markForCheck();
  //   }

  //   SetApproval() {
  //     if (!this.selectedApprovalUserId || !this.selectedMaterial) {
  //       this.messageService.add({
  //         severity: 'warn',
  //         summary: 'Warning',
  //         detail: 'Please select approver',
  //       });
  //       return;
  //     }

  //     this.updateStatus(this.selectedMaterial, 'PendingApproval');
  //   }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
