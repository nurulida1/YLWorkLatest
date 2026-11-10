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
import { FormGroup, FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { LoadingService } from '../../../../services/loading.service';
import { MenuItem, MessageService } from 'primeng/api';
import { Observable, Subject, takeUntil } from 'rxjs';
import {
  BuildFilterText,
  BuildSortText,
  GridifyQueryExtend,
  PagingContent,
} from '../../../../shared/helpers/helpers';
import { CompanyDto } from '../../../../models/Company';
import { ImageModule } from 'primeng/image';
import { ClientService } from '../../../../services/ClientService';
import { PermissionContextService } from '../../../../services/permission-context.service';
import { UserService } from '../../../../services/userService.service';

@Component({
  selector: 'app-client',
  imports: [
    CommonModule,
    RouterLink,
    InputTextModule,
    FormsModule,
    TableModule,
    ButtonModule,
    FormsModule,
    MenuModule,
    ImageModule,
  ],
  template: `
    <!-- MOBILE VIEW -->
    <div class="flex flex-col lg:hidden min-w-0 bg-gray-50 min-h-screen">
      <!-- Header -->
      <div class="p-5 bg-white border-b border-gray-200 flex flex-col gap-4">
        <div class="flex flex-col gap-1">
          <div class="flex items-center justify-between gap-3">
            <h1 class="text-2xl font-extrabold text-gray-800">
              Client Directory
            </h1>

            <button
              type="button"
              (click)="ActionClick(null, 'add')"
              class="shrink-0 w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center shadow-sm"
            >
              <i class="pi pi-plus"></i>
            </button>
          </div>

          <span class="text-gray-500 text-sm">
            Manage client information and business partners.
          </span>
        </div>

        <!-- Search -->
        <div class="flex gap-2 items-center">
          <div class="flex-1 relative min-w-0">
            <i
              class="pi pi-search absolute top-1/2 -translate-y-1/2 left-4 text-gray-400"
            ></i>

            <input
              pInputText
              type="text"
              class="w-full! rounded-xl! py-3! pl-11! bg-gray-100! border-gray-200!"
              placeholder="Search client name..."
              [(ngModel)]="search"
              (keyup)="onKeyDown($event)"
            />
          </div>

          <button
            type="button"
            (click)="Search(search)"
            class="w-12 h-12 shrink-0 rounded-xl bg-blue-700 text-white flex items-center justify-center"
          >
            <i class="pi pi-search"></i>
          </button>
        </div>
      </div>

      <!-- Mobile list -->
      <div class="p-4 flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <div class="font-bold text-gray-800">
            Clients
            <span class="text-sm font-normal text-gray-500">
              ({{ PagingSignal().totalElements || 0 }})
            </span>
          </div>

          <button
            type="button"
            (click)="ResetTable()"
            class="text-sm text-blue-700 font-semibold flex items-center gap-1"
          >
            <i class="pi pi-refresh text-xs"></i>
            Reset
          </button>
        </div>

        <ng-container *ngIf="PagingSignal().data?.length; else mobileEmpty">
          <div
            *ngFor="let data of PagingSignal().data"
            class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col gap-3"
          >
            <!-- Client name and menu -->
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3 min-w-0">
                <div
                  class="w-11 h-11 shrink-0 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center"
                >
                  <i class="pi pi-building text-lg"></i>
                </div>

                <div class="min-w-0">
                  <div class="font-bold text-gray-800 break-words">
                    {{ data.name || '-' }}
                  </div>
                  <div class="text-xs text-gray-500 mt-1">Client</div>
                </div>
              </div>

              <button
                type="button"
                class="w-9 h-9 shrink-0 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-600"
                (click)="onEllipsisClick($event, data, menu)"
              >
                <i class="pi pi-ellipsis-v"></i>
              </button>
            </div>

            <div class="border-t border-gray-100"></div>

            <!-- Company contact -->
            <div class="grid grid-cols-1 gap-3">
              <div class="flex items-start gap-3">
                <i class="pi pi-envelope text-gray-400 mt-1"></i>
                <div class="min-w-0 flex-1">
                  <div class="text-xs text-gray-500">Company Email</div>
                  <div class="text-sm font-medium text-gray-800 break-all">
                    {{ data.email || '-' }}
                  </div>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <i class="pi pi-phone text-gray-400 mt-1"></i>
                <div class="min-w-0 flex-1">
                  <div class="text-xs text-gray-500">Company Contact</div>
                  <div class="text-sm font-medium text-gray-800">
                    {{ data.contactNo || '-' }}
                  </div>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <i class="pi pi-user text-gray-400 mt-1"></i>
                <div class="min-w-0 flex-1">
                  <div class="text-xs text-gray-500">Primary Contact</div>
                  <div class="text-sm font-semibold text-gray-800">
                    {{ data.primaryContactPerson || '-' }}
                  </div>
                  <div class="text-xs text-gray-500 break-all mt-1">
                    {{ data.primaryEmail || '-' }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Balance -->
            <div
              class="bg-gray-50 rounded-lg p-3 flex items-center justify-between gap-2"
            >
              <div class="flex items-center gap-2 text-gray-600">
                <i class="pi pi-wallet"></i>
                <span class="text-sm font-medium">Balance Payment</span>
              </div>

              <span class="font-bold text-gray-800 text-sm tabular-nums">
                {{
                  data.balancePayment ?? 0
                    | currency: 'RM ' : 'symbol' : '1.2-2'
                }}
              </span>
            </div>
          </div>
        </ng-container>

        <ng-template #mobileEmpty>
          <div
            class="bg-white border border-gray-200 rounded-xl p-8 text-center"
          >
            <i class="pi pi-building text-3xl text-gray-300"></i>
            <div class="font-semibold text-gray-700 mt-3">No clients found</div>
            <div class="text-sm text-gray-500 mt-1">
              Try changing your search or add a new client.
            </div>
          </div>
        </ng-template>

        <!-- Mobile pagination -->
        <div
          *ngIf="(PagingSignal().totalElements || 0) > 0"
          class="flex items-center justify-between gap-3 bg-white border border-gray-200 rounded-xl p-3 mt-1"
        >
          <button
            type="button"
            (click)="MobilePreviousPage()"
            [disabled]="currentPage <= 1"
            class="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <i class="pi pi-chevron-left"></i>
          </button>

          <div class="text-center">
            <div class="text-sm font-semibold text-gray-800">
              Page {{ currentPage }} of {{ totalPages }}
            </div>
            <div class="text-xs text-gray-500">
              {{ PagingSignal().totalElements }} clients
            </div>
          </div>

          <button
            type="button"
            (click)="MobileNextPage()"
            [disabled]="currentPage >= totalPages"
            class="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <i class="pi pi-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- DESKTOP VIEW -->
    <div class="w-full hidden lg:flex flex-col p-5 min-w-0">
      <!-- Breadcrumb -->
      <div
        class="flex flex-row items-center gap-2 text-gray-500 tracking-wide text-sm"
      >
        <div
          class="cursor-pointer hover:text-gray-700"
          [routerLink]="'/dashboard'"
        >
          Dashboard
        </div>

        <i class="pi pi-chevron-right text-[8px]! text-gray-500!"></i>

        <div class="text-gray-700 font-semibold">Client</div>
      </div>

      <!-- Heading -->
      <div class="flex flex-row items-center justify-between gap-4 my-5">
        <div class="flex flex-col">
          <div class="font-bold text-3xl text-gray-800">Client Directory</div>
          <span class="text-gray-500">
            Manage client information and maintain your company's client
            records.
          </span>
        </div>

        <div class="flex flex-row items-center gap-2 shrink-0">
          <p-button
            (onClick)="exportCsv()"
            label="Export CSV"
            icon="pi pi-download"
            severity="secondary"
            [outlined]="true"
            size="small"
            styleClass="rounded-lg! px-5! py-2! border! border-gray-300!"
          ></p-button>

          <p-button
            (onClick)="ActionClick(null, 'add')"
            label="Add Client"
            icon="pi pi-user-plus"
            severity="info"
            size="small"
            styleClass="rounded-lg! px-5! py-2.5! border-none! bg-blue-700!"
          ></p-button>
        </div>
      </div>

      <!-- Table container -->
      <div
        class="mt-2 border border-gray-200 rounded-xl bg-white p-5 flex flex-col"
      >
        <div class="w-full max-w-md relative">
          <input
            type="text"
            pInputText
            class="w-full! pl-10! rounded-lg!"
            placeholder="Search by client name"
            [(ngModel)]="search"
            (keyup)="onKeyDown($event)"
          />

          <i class="pi pi-search absolute! top-3.5! left-3! text-gray-500!"></i>
        </div>

        <div class="mt-4">
          <p-table
            #fTable
            [value]="PagingSignal().data || []"
            [paginator]="true"
            [rows]="Query.PageSize"
            [totalRecords]="PagingSignal().totalElements || 0"
            [tableStyle]="{ 'min-width': '80rem' }"
            [rowsPerPageOptions]="[10, 20, 30, 50]"
            [showGridlines]="true"
            [lazy]="true"
            (onLazyLoad)="NextPage($event)"
          >
            <ng-template #header>
              <tr>
                <th pSortableColumn="Name" class="bg-gray-100! w-[35%]!">
                  <div class="flex flex-row items-center gap-2">
                    <div class="uppercase text-sm">Client Name</div>
                    <p-sortIcon field="Name" class="mt-1" />
                  </div>
                </th>

                <th
                  class="bg-gray-100! text-left! w-[20%]! text-sm! uppercase!"
                >
                  Company Contact
                </th>

                <th
                  class="bg-gray-100! text-left! w-[15%]! uppercase! text-sm!"
                >
                  Primary Contact
                </th>

                <th
                  class="bg-gray-100! text-left! w-[15%]! uppercase! text-sm!"
                >
                  Balance Payment
                </th>

                <th
                  class="bg-gray-100! text-center! w-[10%]! text-sm! uppercase!"
                >
                  Action
                </th>
              </tr>
            </ng-template>

            <ng-template #body let-data>
              <tr>
                <td class="font-semibold!">
                  {{ data.name }}
                </td>

                <td class="text-left!">
                  <div class="flex flex-col">
                    <div class="font-semibold">{{ data.email || '-' }}</div>
                    <div class="text-sm text-gray-500">
                      {{ data.contactNo || '-' }}
                    </div>
                  </div>
                </td>

                <td class="text-left!">
                  <div class="flex flex-col">
                    <div class="font-semibold">
                      {{ data.primaryContactPerson || '-' }}
                    </div>
                    <div class="text-sm text-gray-500">
                      {{ data.primaryEmail || '-' }}
                    </div>
                  </div>
                </td>

                <td class="text-left!">
                  {{
                    data.balancePayment ?? 0
                      | currency: 'RM ' : 'symbol' : '1.2-2'
                  }}
                </td>

                <td class="text-center!">
                  <div class="flex items-center justify-center">
                    <i
                      class="pi pi-ellipsis-h cursor-pointer"
                      (click)="onEllipsisClick($event, data, menu)"
                    ></i>
                  </div>
                </td>
              </tr>
            </ng-template>

            <ng-template #emptymessage>
              <tr>
                <td class="border-x!" colspan="100%">
                  <div class="text-center text-gray-500 py-6">
                    No client found in record.
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      </div>
    </div>
    <!-- Delete Confirmation Dialog -->
    <div
      *ngIf="showDeleteDialog"
      class="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 p-4"
      (click)="cancelDelete()"
    >
      <div
        class="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden"
        (click)="$event.stopPropagation()"
      >
        <div class="p-6">
          <div class="flex items-start gap-4">
            <div
              class="w-12 h-12 shrink-0 rounded-full bg-red-50 text-red-600 flex items-center justify-center"
            >
              <i class="pi pi-trash text-xl"></i>
            </div>

            <div class="min-w-0">
              <h2 class="text-lg font-bold text-gray-800">Delete Client?</h2>

              <p class="text-sm text-gray-500 mt-2 leading-relaxed">
                Are you sure you want to delete
                <span class="font-semibold text-gray-800">
                  {{ selectedClient?.name }}
                </span>
                ? This action cannot be undone.
              </p>
            </div>
          </div>
        </div>

        <div
          class="flex flex-col-reverse sm:flex-row justify-end gap-2 p-4 bg-gray-50 border-t border-gray-100"
        >
          <button
            type="button"
            (click)="cancelDelete()"
            class="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-semibold text-sm hover:bg-gray-100"
          >
            Cancel
          </button>

          <button
            type="button"
            (click)="confirmDelete()"
            class="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-red-600 text-white font-semibold text-sm hover:bg-red-700"
          >
            <i class="pi pi-trash mr-2"></i>
            Yes, Delete
          </button>
        </div>
      </div>
    </div>

    <p-menu #menu [model]="menuItems" [popup]="true"></p-menu>
  `,
  styleUrl: './client.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Client implements OnInit, OnDestroy {
  @ViewChild('fTable') fTable?: Table;

  private readonly loadingService = inject(LoadingService);
  private readonly messageService = inject(MessageService);
  private readonly clientService = inject(ClientService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  private readonly permissionContext = inject(PermissionContextService);
  readonly rights = this.permissionContext.rights;
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  PagingSignal = signal<PagingContent<CompanyDto>>({
    data: [],
    totalElements: 0,
  } as PagingContent<CompanyDto>);

  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  visible: boolean = false;
  isUpdate: boolean = false;
  showDeleteDialog: boolean = false;
  selectedClient: CompanyDto | null = null;

  search: string = '';
  title: string = 'Add New Client';
  FG!: FormGroup;
  menuItems: MenuItem[] = [];

  currentUser = this.userService.currentUser;

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 10;
    this.Query.Filter = null;
    this.Query.OrderBy = 'Name';
    this.Query.Select = null;
    this.Query.Includes = null;
  }

  ngOnInit(): void {
    if (window.matchMedia('(max-width: 1023px)').matches) {
      this.GetData();
    }
  }

  GetData() {
    this.loadingService.start();
    this.clientService
      .GetMany(this.Query)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();
          this.PagingSignal.set(res);
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
    this.Query.OrderBy = sortText ? sortText : 'Name';

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

  Search(data: string): void {
    const filter = {
      Name: [
        {
          value: data,
          matchMode: '=',
          operator: 'and',
        },
      ],
    };

    this.Query.Filter = BuildFilterText({
      first: 0,
      rows: this.Query.PageSize,
      filters: filter,
      sortField: null,
      sortOrder: null,
    } as TableLazyLoadEvent);

    this.Query.Page = 1;

    if (this.fTable) {
      this.fTable.first = 0;
    }

    this.GetData();
  }

  ResetTable(): void {
    this.search = '';
    this.Query.Page = 1;
    this.Query.Filter = null;

    if (this.fTable) {
      this.fTable.first = 0;
      this.fTable.clearFilterValues();
      this.fTable.saveState();
    }

    this.GetData();
  }

  ActionClick(data: CompanyDto | null, action: string) {
    if (action === 'Delete' && data) {
      this.selectedClient = data;
      this.showDeleteDialog = true;
      this.cdr.markForCheck();
      return;
    }

    this.router.navigate(['/clients/form'], {
      queryParams: { id: data?.id },
    });
  }

  cancelDelete(): void {
    this.showDeleteDialog = false;
    this.selectedClient = null;
    this.cdr.markForCheck();
  }

  confirmDelete(): void {
    if (!this.selectedClient) return;

    const client = this.selectedClient;

    this.showDeleteDialog = false;
    this.loadingService.start();

    this.clientService
      .Delete(client.id)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res: any) => {
          this.loadingService.stop();

          this.messageService.add({
            severity: 'success',
            summary: 'Deleted',
            detail: res?.message || 'Client deleted successfully',
          });

          this.PagingSignal.update((state) => ({
            ...state,
            data: state.data.filter((d) => d.id !== client.id),
            totalElements: Math.max(0, state.totalElements - 1),
          }));

          this.selectedClient = null;
          this.cdr.markForCheck();
        },
        error: (err: any) => {
          this.loadingService.stop();

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail:
              err.error?.error ||
              err.error?.message ||
              'Failed to delete client',
          });

          this.selectedClient = null;
          this.cdr.markForCheck();
        },
      });
  }

  onEllipsisClick(event: any, client: any, menu: any) {
    this.menuItems = [];

    this.menuItems.push({
      label: 'Edit',
      icon: 'pi pi-pencil',
      command: () => this.ActionClick(client, 'Update'),
    });

    this.menuItems.push({
      label: 'Delete',
      icon: 'pi pi-trash',
      command: () => this.ActionClick(client, 'Delete'),
    });

    menu.toggle(event);
  }

  exportCsv() {
    this.clientService.ExportCsv().subscribe((blob) => {
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'clients.csv';
      a.click();

      window.URL.revokeObjectURL(url);
    });
  }

  getInitial(fullName?: string): string {
    if (!fullName?.trim()) return '?';

    const names = fullName.trim().split(/\s+/).filter(Boolean);

    if (names.length === 1) {
      return names[0].substring(0, 2).toUpperCase();
    }

    return (names[0].charAt(0) + names[1].charAt(0)).toUpperCase();
  }

  get currentPage(): number {
    return this.Query.Page || 1;
  }

  get totalPages(): number {
    const total = this.PagingSignal()?.totalElements || 0;
    const pageSize = this.Query.PageSize || 10;

    return Math.max(1, Math.ceil(total / pageSize));
  }

  MobilePreviousPage(): void {
    if (this.currentPage <= 1) return;

    this.Query.Page = this.currentPage - 1;
    this.GetData();
  }

  MobileNextPage(): void {
    if (this.currentPage >= this.totalPages) return;

    this.Query.Page = this.currentPage + 1;
    this.GetData();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
