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
import { RouterLink } from '@angular/router';
import { MessageService, MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { SelectModule } from 'primeng/select';
import { TableModule, Table, TableLazyLoadEvent } from 'primeng/table';
import { Subject, takeUntil, Observable } from 'rxjs';
import { HasPermissionActionDirective } from '../../../common/directives/hasPermission.directive';
import { DepartmentDto } from '../../../models/Department';
import { DepartmentService } from '../../../services/departmentService';
import { LoadingService } from '../../../services/loading.service';
import { PermissionContextService } from '../../../services/permission-context.service';
import { UserService } from '../../../services/userService.service';
import {
  PagingContent,
  GridifyQueryExtend,
  BuildSortText,
  BuildFilterText,
} from '../../../shared/helpers/helpers';

@Component({
  selector: 'app-department',
  imports: [
    CommonModule,
    ButtonModule,
    InputTextModule,
    FormsModule,
    RouterLink,
    TableModule,
    SelectModule,
    MenuModule,
    DialogModule,
    HasPermissionActionDirective,
  ],
  template: `
    <div
      class="department-page min-h-screen w-full bg-slate-50 p-3 sm:p-5 lg:p-6"
    >
      <div class="mx-auto w-full">
        <!-- Breadcrumb -->
        <div class="mb-4 flex items-center gap-2 text-sm text-slate-400">
          <a
            routerLink="/dashboard"
            class="transition-colors hover:text-blue-700"
          >
            Dashboard
          </a>
          <i class="pi pi-angle-right"></i>
          <span class="font-semibold text-slate-700">Departments</span>
        </div>

        <!-- Page heading -->
        <div
          class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 class="text-2xl font-bold tracking-tight text-slate-800">
              Departments
            </h1>
            <p class="mt-1 text-sm text-slate-500">
              Manage your organization's departments and reporting structure.
            </p>
          </div>

          <p-button
            label="New Department"
            icon="pi pi-plus"
            (onClick)="ActionClick(null, 'add')"
            styleClass="w-full sm:w-auto department-primary-button"
          ></p-button>
        </div>

        <!-- Directory -->
        <div
          class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
        >
          <!-- Search header -->
          <div
            class="flex flex-col gap-4 border-b border-slate-100 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between"
          >
            <div>
              <h2 class="text-base font-semibold text-slate-800">
                Department Directory
              </h2>
              <p class="mt-1 text-xs text-slate-500">
                View and manage your registered departments.
              </p>
            </div>

            <div class="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
              <div class="department-search relative w-full sm:w-80">
                <i
                  class="pi pi-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400"
                ></i>
                <input
                  type="text"
                  pInputText
                  [(ngModel)]="search"
                  class="w-full"
                  placeholder="Search department..."
                  (keyup)="onKeyDown($event)"
                />
              </div>

              <p-button
                *ngIf="search"
                label="Clear"
                icon="pi pi-times"
                severity="secondary"
                [outlined]="true"
                (onClick)="ResetTable()"
                styleClass="w-full sm:w-auto"
              ></p-button>
            </div>
          </div>

          <!-- Desktop table -->
          <div class="department-desktop-view p-4 sm:p-5">
            <p-table
              #fTable
              [value]="PagingSignal().data || []"
              [paginator]="true"
              [rows]="Query.PageSize"
              [first]="(Query.Page - 1) * Query.PageSize"
              [totalRecords]="PagingSignal().totalElements || 0"
              [rowsPerPageOptions]="[10, 20, 30, 50]"
              [stripedRows]="true"
              [lazy]="true"
              (onLazyLoad)="NextPage($event)"
              styleClass="p-datatable-sm department-table"
            >
              <ng-template #header>
                <tr>
                  <th class="w-[45%]">Department</th>
                  <th class="w-[40%]">Head of Department</th>
                  <th class="w-[15%] text-center">Actions</th>
                </tr>
              </ng-template>

              <ng-template #body let-data>
                <tr>
                  <!-- Department -->
                  <td>
                    <div class="flex min-w-0 items-center gap-3 py-1">
                      <div
                        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"
                      >
                        <i class="pi pi-building"></i>
                      </div>

                      <div class="min-w-0">
                        <div
                          class="truncate text-sm font-semibold text-slate-800"
                        >
                          {{ data.name || 'Unnamed Department' }}
                        </div>
                        <div class="mt-1 text-xs text-slate-400">
                          Department
                        </div>
                      </div>
                    </div>
                  </td>

                  <!-- HOD -->
                  <td>
                    <div
                      *ngIf="data.hod?.fullName; else noDesktopHod"
                      class="flex items-center gap-3"
                    >
                      <div
                        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-700"
                      >
                        <i class="pi pi-user"></i>
                      </div>
                      <div class="min-w-0">
                        <div
                          class="truncate text-sm font-medium text-slate-700"
                        >
                          {{ data.hod.fullName }}
                        </div>
                        <span
                          class="mt-1 inline-flex items-center gap-1 text-xs text-emerald-600"
                        >
                          <i class="pi pi-check-circle text-sm!"></i>
                          Assigned
                        </span>
                      </div>
                    </div>

                    <ng-template #noDesktopHod>
                      <span
                        class="inline-flex items-center gap-2 text-sm text-slate-400"
                      >
                        <i class="pi pi-user"></i>
                        Unassigned
                      </span>
                    </ng-template>
                  </td>

                  <!-- Actions -->
                  <td class="text-center">
                    <button
                      type="button"
                      class="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-700"
                      (click)="onEllipsisClick($event, data, menu)"
                      aria-label="Department actions"
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
                      rights().canUpdate || rights().canDelete ? 3 : 2
                    "
                    class="py-14 text-center"
                  >
                    <div class="flex flex-col items-center">
                      <div
                        class="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-50"
                      >
                        <i class="pi pi-building text-2xl text-slate-300"></i>
                      </div>
                      <p class="text-sm font-semibold text-slate-700">
                        No departments found
                      </p>
                      <p class="mt-1 text-xs text-slate-400">
                        Try another search or create a new department.
                      </p>
                    </div>
                  </td>
                </tr>
              </ng-template>
            </p-table>
          </div>

          <!-- Mobile cards -->
          <div class="department-mobile-view space-y-3 p-3">
            <ng-container *ngIf="PagingSignal().data?.length; else mobileEmpty">
              <div
                *ngFor="let data of PagingSignal().data"
                class="department-mobile-card rounded-xl border border-slate-200 bg-white p-4"
              >
                <div class="flex items-start gap-3">
                  <div
                    class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"
                  >
                    <i class="pi pi-building text-lg"></i>
                  </div>

                  <div class="min-w-0 flex-1">
                    <div class="flex items-start justify-between gap-2">
                      <div class="min-w-0">
                        <h3
                          class="break-words text-sm font-semibold text-slate-800"
                        >
                          {{ data.name || 'Unnamed Department' }}
                        </h3>
                        <p class="mt-1 text-xs text-slate-400">Department</p>
                      </div>

                      <button
                        type="button"
                        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-blue-700"
                        (click)="onEllipsisClick($event, data, menu)"
                        aria-label="Department actions"
                      >
                        <i class="pi pi-ellipsis-v"></i>
                      </button>
                    </div>
                  </div>
                </div>

                <div class="my-3 border-t border-slate-100"></div>

                <div class="flex items-center justify-between gap-3">
                  <div class="flex min-w-0 items-center gap-2">
                    <div
                      class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-700"
                    >
                      <i class="pi pi-user text-xs"></i>
                    </div>

                    <div class="min-w-0">
                      <p class="text-[11px] text-slate-400">
                        Head of Department
                      </p>
                      <p class="truncate text-sm font-medium text-slate-700">
                        {{ data.hod?.fullName || 'Unassigned' }}
                      </p>
                    </div>
                  </div>

                  <span
                    *ngIf="data.hod?.fullName; else unassignedBadge"
                    class="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700"
                  >
                    Assigned
                  </span>

                  <ng-template #unassignedBadge>
                    <span
                      class="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500"
                    >
                      Unassigned
                    </span>
                  </ng-template>
                </div>
              </div>
            </ng-container>

            <ng-template #mobileEmpty>
              <div class="flex flex-col items-center px-4 py-12 text-center">
                <div
                  class="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-50"
                >
                  <i class="pi pi-building text-2xl text-slate-300"></i>
                </div>
                <p class="text-sm font-semibold text-slate-700">
                  No departments found
                </p>
                <p class="mt-1 text-xs text-slate-400">
                  Try another search or create a new department.
                </p>
                <button
                  *ngIf="search"
                  type="button"
                  (click)="ResetTable()"
                  class="mt-3 text-sm font-semibold text-blue-700"
                >
                  Clear search
                </button>
              </div>
            </ng-template>

            <!-- Mobile pagination -->
            <div
              *ngIf="(PagingSignal().totalElements || 0) > 0"
              class="flex items-center justify-between gap-3 border-t border-slate-100 pt-4"
            >
              <p class="text-xs text-slate-500">
                Page {{ currentPage }} of {{ totalPages }}
              </p>

              <div class="flex items-center gap-2">
                <p-button
                  icon="pi pi-chevron-left"
                  severity="secondary"
                  [outlined]="true"
                  [disabled]="currentPage <= 1"
                  (onClick)="MobilePreviousPage()"
                  styleClass="department-page-button"
                ></p-button>

                <p-button
                  icon="pi pi-chevron-right"
                  severity="secondary"
                  [outlined]="true"
                  [disabled]="currentPage >= totalPages"
                  (onClick)="MobileNextPage()"
                  styleClass="department-page-button"
                ></p-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Action menu -->
    <p-menu
      #menu
      [model]="menuItems"
      [popup]="true"
      appendTo="body"
      styleClass="department-action-menu"
    ></p-menu>

    <!-- Add / Edit dialog -->
    <p-dialog
      *ngIf="visible"
      [(visible)]="visible"
      [modal]="true"
      [draggable]="false"
      [closable]="false"
      [dismissableMask]="true"
      [appendTo]="'body'"
      [baseZIndex]="10000"
      [autoZIndex]="true"
      (onHide)="visible = false"
      [style]="{ width: '550px', maxWidth: '95vw' }"
      [breakpoints]="{ '640px': '95vw' }"
      styleClass="department-dialog"
    >
      <ng-template #headless>
        <div class="flex max-h-[90dvh] flex-col overflow-hidden rounded-xl">
          <!-- Dialog header -->
          <div
            class="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 bg-white px-4 py-4 sm:px-6"
          >
            <div class="flex min-w-0 items-center gap-3">
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"
              >
                <i
                  class="pi"
                  [ngClass]="isUpdate ? 'pi-pencil' : 'pi-building'"
                ></i>
              </div>

              <div class="min-w-0">
                <h3 class="text-base font-bold text-slate-800">
                  {{ title }}
                </h3>
                <p class="mt-1 text-xs text-slate-500">
                  {{
                    isUpdate
                      ? 'Update department information.'
                      : 'Create a new department.'
                  }}
                </p>
              </div>
            </div>

            <button
              type="button"
              (click)="visible = false"
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <i class="pi pi-times"></i>
            </button>
          </div>

          <!-- Dialog content -->
          <div
            class="department-dialog-content min-h-0 flex-1 space-y-6 overflow-y-auto p-4 sm:p-6"
          >
            <!-- Department information -->
            <section>
              <div class="mb-4 flex items-center gap-2">
                <i class="pi pi-info-circle text-blue-700"></i>
                <h4 class="text-sm font-semibold text-slate-800">
                  Department Information
                </h4>
              </div>

              <div class="space-y-4">
                <div class="flex flex-col gap-2">
                  <label class="text-sm font-medium text-slate-700">
                    Department Name <span class="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    pInputText
                    class="w-full"
                    placeholder="Enter department name"
                    [(ngModel)]="departmentName"
                  />
                </div>

                <div class="flex flex-col gap-2">
                  <label class="text-sm font-medium text-slate-700">
                    Head of Department (HOD)
                  </label>
                  <p-select
                    [options]="hodSelection || []"
                    optionLabel="label"
                    optionValue="value"
                    appendTo="body"
                    [filter]="true"
                    filterPlaceholder="Search employee..."
                    [showClear]="!!hodId"
                    placeholder="Select a department head"
                    [(ngModel)]="hodId"
                    styleClass="w-full"
                  ></p-select>
                  <p class="text-xs text-slate-400">
                    Assign an employee to lead this department.
                  </p>
                </div>
              </div>
            </section>

            <!-- Working hours -->
            <section>
              <div class="mb-4 flex items-center gap-2">
                <i class="pi pi-clock text-blue-700"></i>
                <h4 class="text-sm font-semibold text-slate-800">
                  Working Hours Configuration
                </h4>
              </div>

              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div class="flex flex-col gap-2">
                  <label class="text-sm font-medium text-slate-700">
                    Work Start Time
                  </label>
                  <input
                    type="text"
                    pInputText
                    class="w-full"
                    placeholder="09:00"
                    [(ngModel)]="workStartTime"
                  />
                </div>

                <div class="flex flex-col gap-2">
                  <label class="text-sm font-medium text-slate-700">
                    Work End Time
                  </label>
                  <input
                    type="text"
                    pInputText
                    class="w-full"
                    placeholder="18:00"
                    [(ngModel)]="workEndTime"
                  />
                </div>

                <div class="flex flex-col gap-2">
                  <label class="text-sm font-medium text-slate-700">
                    Half-day Start
                  </label>
                  <input
                    type="text"
                    pInputText
                    class="w-full"
                    placeholder="08:00"
                    [(ngModel)]="restDayHalfDayStart"
                  />
                </div>

                <div class="flex flex-col gap-2">
                  <label class="text-sm font-medium text-slate-700">
                    Half-day End
                  </label>
                  <input
                    type="text"
                    pInputText
                    class="w-full"
                    placeholder="12:00"
                    [(ngModel)]="restDayHalfDayEnd"
                  />
                </div>
              </div>

              <div
                class="mt-4 flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-blue-800"
              >
                <i class="pi pi-info-circle mt-0.5 text-sm"></i>
                <p class="text-xs leading-relaxed">
                  Use the 24-hour format (HH:mm), for example 09:00 or 18:00.
                </p>
              </div>
            </section>
          </div>

          <!-- Dialog footer -->
          <div
            class="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:justify-end sm:px-6"
          >
            <p-button
              label="Cancel"
              severity="secondary"
              [outlined]="true"
              (onClick)="visible = false"
              styleClass="w-full sm:w-auto"
            ></p-button>

            <p-button
              (onClick)="SaveDepartment()"
              [label]="isUpdate ? 'Save Changes' : 'Create Department'"
              [icon]="isUpdate ? 'pi pi-save' : 'pi pi-plus'"
              styleClass="w-full sm:w-auto bg-blue-700! border-none! hover:bg-blue-500!"
            ></p-button>
          </div>
        </div>
      </ng-template>
    </p-dialog>

    <!-- Delete confirmation dialog -->
    <p-dialog
      [(visible)]="showDeleteConfirm"
      [modal]="true"
      [closable]="false"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '420px', maxWidth: '95vw' }"
      [breakpoints]="{ '640px': '95vw' }"
      appendTo="body"
      styleClass="department-delete-dialog"
    >
      <div class="flex flex-col items-center px-2 py-3 text-center">
        <div
          class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50"
        >
          <i class="pi pi-trash text-2xl text-rose-600"></i>
        </div>

        <h3 class="text-lg font-bold text-slate-800">Delete Department?</h3>

        <p class="mt-2 text-sm leading-relaxed text-slate-500">
          Are you sure you want to delete
          <span class="font-semibold text-slate-800">
            "{{ selectedDepartment?.name }}" </span
          >? This action cannot be undone.
        </p>
      </div>

      <ng-template #footer>
        <div
          class="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end"
        >
          <p-button
            label="Cancel"
            severity="secondary"
            [outlined]="true"
            (onClick)="CancelDelete()"
            styleClass="w-full sm:w-auto"
          ></p-button>

          <p-button
            label="Yes, Delete"
            icon="pi pi-trash"
            severity="danger"
            (onClick)="ConfirmDelete()"
            styleClass="w-full sm:w-auto"
          ></p-button>
        </div>
      </ng-template>
    </p-dialog>
  `,
  styleUrl: './department.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Department implements OnInit, OnDestroy {
  @ViewChild('fTable') fTable?: Table;

  private readonly loadingService = inject(LoadingService);
  private readonly messageService = inject(MessageService);
  private readonly departmentService = inject(DepartmentService);
  private readonly userService = inject(UserService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly permissionContext = inject(PermissionContextService);
  readonly rights = this.permissionContext.rights;
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  PagingSignal = signal<PagingContent<DepartmentDto>>({
    data: [],
    totalElements: 0,
  } as PagingContent<DepartmentDto>);

  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  visible: boolean = false;
  isUpdate: boolean = false;
  showDeleteConfirm: boolean = false;
  selectedDepartment: DepartmentDto | null = null;

  search: string = '';
  title: string = 'Add New Department';
  departmentName: string | null = null;
  hodId: string | null = null;
  workStartTime: string | null = null;
  workEndTime: string | null = null;
  restDayHalfDayStart: string | null = null;
  restDayHalfDayEnd: string | null = null;
  departmentId: string | null = null;
  menuItems: MenuItem[] = [];

  hodSelection: { label: string; value: string }[] = [];

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 10;
    this.Query.Filter = null;
    this.Query.OrderBy = 'Name';
    this.Query.Select = null;
    this.Query.Includes = null;
  }

  ngOnInit(): void {
    // Mobile cards do not trigger the desktop table's lazy-load event.
    if (window.matchMedia('(max-width: 1023px)').matches) {
      this.GetData();
    }
  }

  GetData() {
    this.loadingService.start();
    this.departmentService
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
    const filter = data?.trim()
      ? {
          Name: [
            {
              value: data.trim(),
              matchMode: 'contains',
              operator: 'and',
            },
          ],
        }
      : {};

    this.Query.Page = 1;

    if (this.fTable) {
      this.fTable.first = 0;
    }

    const event: TableLazyLoadEvent = {
      first: 0,
      rows: this.Query.PageSize,
      sortField: null,
      sortOrder: null,
      filters: filter,
    };

    this.NextPage(event);
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

  ActionClick(data: DepartmentDto | null, action: string): void {
    if (action === 'Delete' && data) {
      this.loadingService.start();

      this.departmentService
        .Delete(data.id)
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe({
          next: (res: any) => {
            this.loadingService.stop();

            this.messageService.add({
              severity: 'success',
              summary: 'Deleted',
              detail: res?.message || 'Department deleted successfully',
            });

            this.GetData();
          },
          error: (err: any) => {
            this.loadingService.stop();

            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail:
                err.error?.error ||
                err.error?.message ||
                'Failed to delete department',
            });
          },
        });

      return;
    }

    this.isUpdate = action === 'Update';
    this.title = this.isUpdate ? 'Edit Department' : 'Add New Department';

    this.departmentId = this.isUpdate ? data?.id || null : null;
    this.departmentName = this.isUpdate ? data?.name || null : null;
    this.hodId = this.isUpdate ? data?.hodId || null : null;
    this.workStartTime = this.isUpdate ? data?.workStartTime || null : null;
    this.workEndTime = this.isUpdate ? data?.workEndTime || null : null;
    this.restDayHalfDayStart = this.isUpdate
      ? data?.restDayHalfDayStart || null
      : null;
    this.restDayHalfDayEnd = this.isUpdate
      ? data?.restDayHalfDayEnd || null
      : null;

    this.GetHodSelection();

    this.visible = true;
    this.cdr.detectChanges();
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
      command: () => this.DeleteDepartment(client),
    });

    menu.toggle(event);
  }

  GetHodSelection() {
    this.userService
      .GetMany({
        Page: 1,
        PageSize: 1000000,
        OrderBy: 'FullName',
        Filter: `SystemRole!=SuperAdmin`,
        Select: null,
        Includes: null,
      })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((res) => {
        this.hodSelection = res.data.map((user: any) => ({
          label: user.fullName,
          value: user.id,
        }));
      });
  }

  SaveDepartment() {
    if (!this.departmentName) {
      return this.messageService.add({
        severity: 'error',
        summary: 'Department Name is required',
        detail: '',
      });
    }
    this.loadingService.start();

    const request$: Observable<any> = this.isUpdate
      ? this.departmentService.Update({
          id: this.departmentId!,
          name: this.departmentName,
          hodId: this.hodId!,
          description: '',
          code: '',
          isActive: true,
          workStartTime: this.workStartTime,
          workEndTime: this.workEndTime,
          restDayHalfDayStart: this.restDayHalfDayStart,
          restDayHalfDayEnd: this.restDayHalfDayEnd,
        })
      : this.departmentService.Create({
          name: this.departmentName,
          hodId: this.hodId!,
          description: '',
          code: '',
          isActive: true,
          workStartTime: this.workStartTime,
          workEndTime: this.workEndTime,
          restDayHalfDayStart: this.restDayHalfDayStart,
          restDayHalfDayEnd: this.restDayHalfDayEnd,
        });

    request$.pipe(takeUntil(this.ngUnsubscribe)).subscribe({
      next: (res) => {
        this.loadingService.stop();

        if (res) {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `Department: ${this.departmentName} has been ${
              this.isUpdate ? 'updated' : 'created'
            } successfully`,
          });

          this.visible = false;
          this.GetData();
        } else {
          this.messageService.add({
            severity: 'warn',
            summary: 'Warning',
            detail:
              res?.message || res?.Message || 'Operation partially failed',
          });
        }
      },
      error: (err: any) => {
        this.loadingService.stop();

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail:
            err.error?.message ||
            err.error?.Message ||
            'Something went wrong. Please try again.',
        });
      },
    });
  }

  get currentPage(): number {
    return this.Query.Page || 1;
  }

  get totalPages(): number {
    const total = this.PagingSignal()?.totalElements || 0;
    return Math.max(1, Math.ceil(total / (this.Query.PageSize || 10)));
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

  DeleteDepartment(data: DepartmentDto): void {
    this.selectedDepartment = data;
    this.showDeleteConfirm = true;
  }

  CancelDelete(): void {
    this.showDeleteConfirm = false;
    this.selectedDepartment = null;
  }

  ConfirmDelete(): void {
    if (!this.selectedDepartment) return;

    const department = this.selectedDepartment;

    this.showDeleteConfirm = false;
    this.selectedDepartment = null;

    this.ActionClick(department, 'Delete');
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
