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
import { CompanyService } from '../../../../services/companyService';
import { Subject, takeUntil } from 'rxjs';
import {
  BuildFilterText,
  BuildSortText,
  GridifyQueryExtend,
  PagingContent,
} from '../../../../shared/helpers/helpers';
import { CompanyDto } from '../../../../models/Company';
import { ImageModule } from 'primeng/image';
import { CompanyType } from '../../../../shared/enum/enum';
import { HasPermissionActionDirective } from '../../../../common/directives/hasPermission.directive';
import { PermissionContextService } from '../../../../services/permission-context.service';
import { PaginatorModule } from 'primeng/paginator';

@Component({
  selector: 'app-company',
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
    PaginatorModule,
    HasPermissionActionDirective,
  ],
  template: `
    <div class="company-page w-full min-h-screen flex flex-col p-3 sm:p-5">
      <!-- Breadcrumb -->
      <div class="flex items-center gap-2 text-sm text-gray-500">
        <a
          routerLink="/dashboard"
          class="cursor-pointer transition-colors hover:text-blue-600"
        >
          Dashboard
        </a>
        <i class="pi pi-angle-right text-xs"></i>
        <span class="font-semibold text-gray-800">Company</span>
      </div>

      <!-- Main content -->
      <div
        class="mt-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5"
      >
        <!-- Header -->
        <div
          class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"
        >
          <div>
            <h1 class="text-xl font-semibold tracking-tight text-gray-800">
              My Company Profiles
            </h1>
            <p class="mt-1 text-sm text-gray-500">
              Manage internal corporate profile configurations.
            </p>
          </div>

          <div class="flex w-full flex-col gap-2 sm:flex-row xl:w-auto">
            <!-- Search -->
            <div class="relative w-full sm:min-w-[260px] xl:w-[300px]">
              <i
                class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400"
              ></i>
              <input
                type="text"
                pInputText
                class="w-full pl-9!"
                placeholder="Search company name..."
                [(ngModel)]="search"
                (keyup)="onKeyDown($event)"
              />
            </div>

            <!-- Add button -->
            <p-button
              *hasPermissionAction="'canCreate'"
              label="Add Company"
              icon="pi pi-plus"
              (onClick)="ActionClick(null, 'add')"
              styleClass="w-full whitespace-nowrap sm:w-auto bg-blue-700! border-none! hover:bg-blue-500! py-3! sm:py-2!"
            ></p-button>
          </div>
        </div>

        <!-- Desktop table -->
        <div class="company-desktop-table mt-5 hidden lg:block">
          <p-table
            #fTable
            [value]="PagingSignal().data || []"
            [paginator]="true"
            [rows]="Query.PageSize"
            [first]="(Query.Page - 1) * Query.PageSize"
            [totalRecords]="PagingSignal().totalElements || 0"
            [rowsPerPageOptions]="[10, 20, 30, 50]"
            [stripedRows]="true"
            [showGridlines]="false"
            [lazy]="true"
            (onLazyLoad)="NextPage($event)"
            [tableStyle]="{ 'min-width': '850px' }"
          >
            <ng-template #header>
              <tr>
                <th class="w-[110px]">Logo</th>
                <th pSortableColumn="Name">
                  <div class="flex items-center gap-2">
                    Company Name
                    <p-sortIcon field="Name"></p-sortIcon>
                  </div>
                </th>
                <th class="w-[180px]">Contact Number</th>
                <th class="w-[240px]">Contact Person</th>
                <th
                  *ngIf="rights().canUpdate || rights().canDelete"
                  class="w-[90px] text-center!"
                >
                  Action
                </th>
              </tr>
            </ng-template>

            <ng-template #body let-data>
              <tr>
                <!-- Logo -->
                <td>
                  <div class="flex items-center justify-center">
                    <div
                      *ngIf="!data.logoImage"
                      class="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-400"
                    >
                      <i class="pi pi-building text-xl"></i>
                    </div>

                    <p-image
                      *ngIf="data.logoImage"
                      [src]="data.logoImage"
                      [preview]="true"
                      imageClass="h-12 w-12 rounded-lg border border-gray-200 object-contain"
                    ></p-image>
                  </div>
                </td>

                <!-- Name -->
                <td>
                  <div class="font-semibold text-gray-800">
                    {{ data.name || '-' }}
                  </div>
                </td>

                <!-- Contact -->
                <td>
                  <div class="flex items-center gap-2 text-gray-600">
                    <i class="pi pi-phone text-xs text-gray-400"></i>
                    {{ data.contactNo || '-' }}
                  </div>
                </td>

                <!-- Contact persons -->
                <td>
                  <div class="flex flex-col gap-1">
                    <span class="font-medium text-gray-700">
                      {{ data.primaryContactPerson || '-' }}
                    </span>

                    <span
                      *ngIf="data.secondaryContactPerson"
                      class="text-xs text-gray-500"
                    >
                      Alternative: {{ data.secondaryContactPerson }}
                    </span>
                  </div>
                </td>

                <!-- Actions -->
                <td
                  *ngIf="rights().canUpdate || rights().canDelete"
                  class="text-center!"
                >
                  <button
                    type="button"
                    class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
                    (click)="onEllipsisClick($event, data, menu)"
                    aria-label="Company actions"
                  >
                    <i class="pi pi-ellipsis-v"></i>
                  </button>
                </td>
              </tr>
            </ng-template>

            <ng-template #emptymessage>
              <tr>
                <td
                  [attr.colspan]="
                    rights().canUpdate || rights().canDelete ? 5 : 4
                  "
                  class="py-12 text-center!"
                >
                  <div class="flex flex-col items-center gap-2 text-gray-400">
                    <i class="pi pi-building text-3xl"></i>
                    <span class="font-medium text-gray-600">
                      No company found
                    </span>
                    <span class="text-sm">
                      Try changing your search or add a company.
                    </span>
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>

        <!-- Mobile and tablet cards -->
        <div class="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
          @for (data of PagingSignal().data || []; track data.id) {
            <div
              class="company-card min-w-0 rounded-xl border border-gray-200 bg-white p-4"
            >
              <div class="flex items-start gap-3">
                <!-- Logo -->
                <div
                  class="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
                >
                  @if (data.logoImage) {
                    <p-image
                      [src]="data.logoImage"
                      [preview]="true"
                      imageClass="h-14 w-14 object-contain"
                    ></p-image>
                  } @else {
                    <i class="pi pi-building text-2xl text-gray-400"></i>
                  }
                </div>

                <!-- Company name -->
                <div class="min-w-0 flex-1">
                  <div class="break-words font-semibold text-gray-800">
                    {{ data.name || '-' }}
                  </div>
                  <div class="mt-1 text-xs text-gray-500">Company Profile</div>
                </div>

                <!-- Actions -->
                @if (rights().canUpdate || rights().canDelete) {
                  <button
                    type="button"
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
                    (click)="onEllipsisClick($event, data, menu)"
                    aria-label="Company actions"
                  >
                    <i class="pi pi-ellipsis-v"></i>
                  </button>
                }
              </div>

              <div class="my-4 border-t border-gray-100"></div>

              <div class="space-y-3">
                <div class="flex items-start gap-3">
                  <i class="pi pi-phone mt-0.5 w-4 text-sm text-gray-400"></i>
                  <div class="min-w-0">
                    <div class="text-xs text-gray-500">Contact Number</div>
                    <div class="break-words text-sm font-medium text-gray-700">
                      {{ data.contactNo || '-' }}
                    </div>
                  </div>
                </div>

                <div class="flex items-start gap-3">
                  <i class="pi pi-user mt-0.5 w-4 text-sm text-gray-400"></i>
                  <div class="min-w-0 flex-1">
                    <div class="text-xs text-gray-500">Contact Person</div>
                    <div class="break-words text-sm font-medium text-gray-700">
                      {{ data.primaryContactPerson || '-' }}
                    </div>

                    @if (data.secondaryContactPerson) {
                      <div class="mt-1 break-words text-xs text-gray-500">
                        Alternative: {{ data.secondaryContactPerson }}
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>
          } @empty {
            <div
              class="col-span-full flex flex-col items-center rounded-xl border border-dashed border-gray-300 px-4 py-12 text-center"
            >
              <i class="pi pi-building text-3xl text-gray-300"></i>
              <div class="mt-3 font-medium text-gray-700">No company found</div>
              <div class="mt-1 text-sm text-gray-500">
                Try changing your search or add a company.
              </div>
            </div>
          }
        </div>

        <!-- Mobile pagination -->
        <div
          class="mt-4 border-t border-gray-100 pt-4 lg:hidden"
          *ngIf="(PagingSignal().totalElements || 0) > 0"
        >
          <p-paginator
            [first]="(Query.Page - 1) * Query.PageSize"
            [rows]="Query.PageSize"
            [totalRecords]="PagingSignal().totalElements || 0"
            [rowsPerPageOptions]="[10, 20, 30]"
            (onPageChange)="onMobilePageChange($event)"
          ></p-paginator>
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
        class="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
        (click)="$event.stopPropagation()"
      >
        <!-- Dialog content -->
        <div class="p-6">
          <div class="flex items-start gap-4">
            <div
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600"
            >
              <i class="pi pi-trash text-xl"></i>
            </div>

            <div class="min-w-0">
              <h2 class="text-lg font-bold text-gray-800">Delete Company?</h2>

              <p class="mt-2 text-sm leading-relaxed text-gray-500">
                Are you sure you want to delete
                <span class="font-semibold text-gray-800">
                  {{ selectedCompany?.name }}
                </span>
                ? This action cannot be undone.
              </p>
            </div>
          </div>
        </div>

        <!-- Dialog actions -->
        <div
          class="flex flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50 p-4 sm:flex-row sm:justify-end"
        >
          <button
            type="button"
            (click)="cancelDelete()"
            class="w-full rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 sm:w-auto"
          >
            Cancel
          </button>

          <button
            type="button"
            (click)="confirmDelete()"
            class="w-full rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 sm:w-auto"
          >
            <i class="pi pi-trash mr-2"></i>
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
    <p-menu #menu [model]="menuItems" [popup]="true" appendTo="body"></p-menu>
  `,
  styleUrl: './company.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Company implements OnInit, OnDestroy {
  @ViewChild('fTable') fTable?: Table;

  private readonly loadingService = inject(LoadingService);
  private readonly messageService = inject(MessageService);
  private readonly companyService = inject(CompanyService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly permissionContext = inject(PermissionContextService);
  readonly rights = this.permissionContext.rights;
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  PagingSignal = signal<PagingContent<CompanyDto>>(
    {} as PagingContent<CompanyDto>,
  );
  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  visible: boolean = false;
  isUpdate: boolean = false;
  showDeleteDialog: boolean = false;
  selectedCompany: CompanyDto | null = null;

  search: string = '';
  title: string = 'Add New Company';
  FG!: FormGroup;
  menuItems: MenuItem[] = [];

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 10;
    this.Query.Filter = null;
    this.Query.OrderBy = 'Name';
    this.Query.Select = null;
    this.Query.Includes = null;
  }

  ngOnInit(): void {}

  GetData() {
    this.loadingService.start();
    this.companyService
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

    const tableFilter = BuildFilterText(event);
    const ownCompanyFilter = `Type=${CompanyType.Own}`;
    this.Query.Filter = tableFilter
      ? `${tableFilter}, ${ownCompanyFilter}`
      : ownCompanyFilter;
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
      Name: [
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

    this.Query.Filter = `Type=${CompanyType.Own}`;
    this.GetData();
  }

  ActionClick(data: CompanyDto | null, action: string) {
    if (action === 'Delete' && data) {
      this.selectedCompany = data;
      this.showDeleteDialog = true;
      this.cdr.markForCheck();
      return;
    }

    this.router.navigate(['/company/form'], {
      queryParams: { id: data?.id, type: CompanyType.Own },
    });
  }

  cancelDelete(): void {
    this.showDeleteDialog = false;
    this.selectedCompany = null;
    this.cdr.markForCheck();
  }

  confirmDelete(): void {
    if (!this.selectedCompany) return;

    const company = this.selectedCompany;

    this.showDeleteDialog = false;
    this.loadingService.start();

    this.companyService
      .Delete(company.id)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res: any) => {
          this.loadingService.stop();

          this.messageService.add({
            severity: 'success',
            summary: 'Deleted',
            detail: res?.message || 'Company deleted successfully',
          });

          this.PagingSignal.update((state) => ({
            ...state,
            data: (state.data || []).filter((d) => d.id !== company.id),
            totalElements: Math.max(0, (state.totalElements || 0) - 1),
          }));

          this.selectedCompany = null;
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
              'Failed to delete company',
          });

          this.selectedCompany = null;
          this.cdr.markForCheck();
        },
      });
  }

  onEllipsisClick(event: any, client: any, menu: any) {
    this.menuItems = [];

    if (this.rights().canUpdate) {
      this.menuItems.push({
        label: 'Edit',
        icon: 'pi pi-pencil',
        command: () => this.ActionClick(client, 'Update'),
      });
    }

    if (this.rights().canDelete) {
      this.menuItems.push({
        label: 'Delete',
        icon: 'pi pi-trash',
        command: () => this.ActionClick(client, 'Delete'),
      });
    }

    menu.toggle(event);
  }

  getCompanyTypeLabel(type: CompanyType): string {
    switch (type) {
      case CompanyType.Own:
        return 'Own';
      case CompanyType.Client:
        return 'Client';
      case CompanyType.Supplier:
        return 'Supplier';
      default:
        return '-';
    }
  }

  onMobilePageChange(event: { first?: number; rows?: number }): void {
    const rows = event.rows ?? this.Query.PageSize;
    const first = event.first ?? 0;

    this.Query.Page = Math.floor(first / rows) + 1;
    this.Query.PageSize = rows;

    // Keep the current filter and sorting.
    this.GetData();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
