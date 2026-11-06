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
    <div class="department-page w-full min-h-full p-6">
      <div class="w-full max-w-[1440px] mx-auto">
        <!-- Breadcrumb -->
        <div
          class="flex items-center gap-2 text-xs font-medium tracking-wide text-gray-400 uppercase"
        >
          <span
            class="cursor-pointer hover:text-blue-600 transition-colors"
            [routerLink]="'/dashboard'"
          >
            Dashboard
          </span>

          <i class="pi pi-angle-right text-gray-300"></i>

          <span class="text-gray-700 font-semibold">Department</span>
        </div>

        <!-- Page Heading -->
        <div
          class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-5 mb-6"
        >
          <div>
            <h1 class="text-2xl font-bold text-gray-900 tracking-tight">
              Departments
            </h1>

            <p class="text-sm text-gray-500 mt-1">
              Manage your organization's departments and reporting structure.
            </p>
          </div>

          <p-button
            *hasPermissionAction="'canCreate'"
            label="New Department"
            icon="pi pi-plus"
            (onClick)="ActionClick(null, 'add')"
            severity="info"
            styleClass="bg-blue-800! hover:bg-blue-900! border-none! text-white! py-2.5 px-5 rounded-lg text-sm font-semibold shadow-sm"
          ></p-button>
        </div>

        <!-- Department Table Card -->
        <div
          class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
        >
          <!-- Card Header -->
          <div
            class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-5 sm:p-6 border-b border-gray-100"
          >
            <div>
              <h2 class="text-base font-bold text-gray-800">
                Department Directory
              </h2>

              <p class="text-xs text-gray-400 mt-1">
                View and manage all registered departments.
              </p>
            </div>

            <!-- Search -->
            <div
              class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
            >
              <div class="relative w-full sm:w-80">
                <i
                  class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none"
                ></i>

                <input
                  type="text"
                  pInputText
                  [(ngModel)]="search"
                  class="w-full pl-9! pr-3! py-2.5! text-sm! rounded-lg! border-gray-200! shadow-none! focus:border-blue-500!"
                  placeholder="Search department..."
                  (keyup)="onKeyDown($event)"
                />
              </div>

              <button
                type="button"
                *ngIf="search"
                (click)="ResetTable()"
                class="inline-flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-colors"
              >
                <i class="pi pi-times"></i>
                Clear
              </button>
            </div>
          </div>

          <!-- Table -->
          <div class="p-4 sm:p-5">
            <p-table
              #fTable
              [value]="PagingSignal().data"
              [paginator]="true"
              [rows]="Query.PageSize"
              [totalRecords]="PagingSignal().totalElements"
              [tableStyle]="{ 'min-width': '45rem' }"
              [rowsPerPageOptions]="[10, 20, 30, 50]"
              [stripedRows]="true"
              [showGridlines]="false"
              [lazy]="true"
              (onLazyLoad)="NextPage($event)"
              styleClass="p-datatable-sm department-table"
            >
              <!-- Table Header -->
              <ng-template #header>
                <tr class="text-xs uppercase text-gray-500 font-semibold">
                  <th
                    class="bg-gray-50! py-4! px-5! text-left! w-[45%]! border-b! border-gray-200!"
                  >
                    Department Name
                  </th>

                  <th
                    class="bg-gray-50! py-4! px-5! text-left! w-[40%]! border-b! border-gray-200!"
                  >
                    Head of Department
                  </th>

                  <th
                    *ngIf="rights().canUpdate || rights().canDelete"
                    class="bg-gray-50! py-4! px-5! text-center! w-[15%]! border-b! border-gray-200!"
                  >
                    Actions
                  </th>
                </tr>
              </ng-template>

              <!-- Table Body -->
              <ng-template #body let-data>
                <tr class="hover:bg-blue-50/30 transition-colors">
                  <!-- Department Name -->
                  <td class="py-4! px-5!">
                    <div class="flex items-center gap-3">
                      <div
                        class="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 text-blue-700 shrink-0"
                      >
                        <i class="pi pi-building text-base"></i>
                      </div>

                      <div class="min-w-0">
                        <div class="text-sm font-semibold text-gray-800">
                          {{ data.name || 'Unnamed Department' }}
                        </div>

                        <div class="text-xs text-gray-400 mt-1">Department</div>
                      </div>
                    </div>
                  </td>

                  <!-- HOD -->
                  <td class="py-4! px-5!">
                    <div
                      *ngIf="data.hod?.fullName; else noHod"
                      class="flex items-center gap-3"
                    >
                      <div
                        class="flex items-center justify-center w-9 h-9 rounded-full bg-purple-50 text-purple-700 shrink-0"
                      >
                        <i class="pi pi-user text-sm"></i>
                      </div>

                      <div class="min-w-0">
                        <div class="text-sm font-medium text-gray-700">
                          {{ data.hod?.fullName }}
                        </div>

                        <div class="text-xs text-green-600 mt-0.5">
                          Assigned
                        </div>
                      </div>
                    </div>

                    <ng-template #noHod>
                      <div class="flex items-center gap-2 text-gray-400">
                        <div
                          class="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 shrink-0"
                        >
                          <i class="pi pi-user text-sm"></i>
                        </div>

                        <div>
                          <div class="text-sm font-medium italic">
                            Unassigned
                          </div>

                          <div class="text-xs mt-0.5">No HOD assigned</div>
                        </div>
                      </div>
                    </ng-template>
                  </td>

                  <!-- Actions -->
                  <td
                    *ngIf="rights().canUpdate || rights().canDelete"
                    class="py-4! px-5! text-center!"
                  >
                    <button
                      type="button"
                      class="inline-flex items-center justify-center w-9 h-9 rounded-lg text-gray-400 hover:text-blue-700 hover:bg-blue-50 transition-all"
                      (click)="onEllipsisClick($event, data, menu)"
                      aria-label="Department actions"
                    >
                      <i class="pi pi-ellipsis-v text-sm"></i>
                    </button>
                  </td>
                </tr>
              </ng-template>

              <!-- Empty State -->
              <ng-template #emptymessage>
                <tr>
                  <td
                    [attr.colspan]="
                      rights().canUpdate || rights().canDelete ? 3 : 2
                    "
                    class="py-16! text-center!"
                  >
                    <div class="flex flex-col items-center justify-center">
                      <div
                        class="flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4"
                      >
                        <i class="pi pi-building text-2xl text-gray-300"></i>
                      </div>

                      <h3 class="text-sm font-semibold text-gray-700">
                        No departments found
                      </h3>

                      <p class="text-xs text-gray-400 mt-2 max-w-xs">
                        There are currently no departments matching your search.
                      </p>

                      <button
                        *ngIf="search"
                        type="button"
                        (click)="ResetTable()"
                        class="mt-4 text-sm font-semibold text-blue-700 hover:text-blue-900 transition-colors"
                      >
                        Clear search
                      </button>
                    </div>
                  </td>
                </tr>
              </ng-template>
            </p-table>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- DEPARTMENT ACTION MENU -->
    <!-- ============================================ -->

    <p-menu
      #menu
      [model]="menuItems"
      [popup]="true"
      appendTo="body"
      styleClass="text-sm shadow-lg border border-gray-100! rounded-lg!"
    ></p-menu>

    <!-- ============================================ -->
    <!-- ADD / EDIT DEPARTMENT DIALOG -->
    <!-- ============================================ -->

    <p-dialog
      *ngIf="visible"
      [(visible)]="visible"
      [modal]="true"
      [draggable]="false"
      [closable]="true"
      [dismissableMask]="true"
      (onHide)="visible = false"
      [style]="{ width: '550px', maxWidth: '95vw' }"
      [breakpoints]="{ '640px': '95vw' }"
      styleClass="department-dialog border-0 rounded-xl overflow-hidden"
    >
      <ng-template #headless>
        <div class="flex flex-col">
          <!-- Dialog Header -->
          <div
            class="flex items-start justify-between gap-4 px-6 py-5 border-b border-gray-100 bg-gray-50/70"
          >
            <div class="flex items-center gap-3">
              <div
                class="flex items-center justify-center w-11 h-11 rounded-xl bg-blue-100 text-blue-700 shrink-0"
              >
                <i
                  class="pi"
                  [ngClass]="isUpdate ? 'pi-pencil' : 'pi-building'"
                ></i>
              </div>

              <div>
                <h3 class="text-lg font-bold text-gray-800">
                  {{ title }}
                </h3>

                <p class="text-xs text-gray-400 mt-1">
                  {{
                    isUpdate
                      ? 'Update department details and working hours.'
                      : 'Create a new department and configure its details.'
                  }}
                </p>
              </div>
            </div>

            <button
              type="button"
              (click)="visible = false"
              class="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors"
            >
              <i class="pi pi-times"></i>
            </button>
          </div>

          <!-- Dialog Content -->
          <div class="p-6 space-y-6">
            <!-- Basic Information -->
            <section>
              <div class="flex items-center gap-2 mb-4">
                <i class="pi pi-info-circle text-blue-600"></i>

                <h4 class="text-sm font-bold text-gray-800">
                  Department Information
                </h4>
              </div>

              <div class="space-y-4">
                <!-- Department Name -->
                <div class="flex flex-col gap-2">
                  <label class="text-sm font-semibold text-gray-700">
                    Department Name
                    <span class="text-rose-500">*</span>
                  </label>

                  <input
                    type="text"
                    pInputText
                    class="w-full py-2.5! px-3! text-sm! rounded-lg! border-gray-200! shadow-none! focus:border-blue-500!"
                    placeholder="Enter department name"
                    [(ngModel)]="departmentName"
                  />
                </div>

                <!-- HOD -->
                <div class="flex flex-col gap-2">
                  <label class="text-sm font-semibold text-gray-700">
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
                    styleClass="w-full border-gray-200! rounded-lg! shadow-none! text-sm!"
                  ></p-select>

                  <p class="text-xs text-gray-400">
                    Assign an employee to lead this department.
                  </p>
                </div>
              </div>
            </section>

            <!-- Working Hours -->
            <section>
              <div class="flex items-center gap-2 mb-4">
                <i class="pi pi-clock text-blue-600"></i>

                <h4 class="text-sm font-bold text-gray-800">
                  Working Hours Configuration
                </h4>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <!-- Work Start -->
                <div class="flex flex-col gap-2">
                  <label class="text-sm font-medium text-gray-600">
                    Work Start Time
                  </label>

                  <input
                    type="text"
                    pInputText
                    class="w-full py-2.5! px-3! text-sm! rounded-lg! border-gray-200! shadow-none!"
                    placeholder="09:00"
                    [(ngModel)]="workStartTime"
                  />
                </div>

                <!-- Work End -->
                <div class="flex flex-col gap-2">
                  <label class="text-sm font-medium text-gray-600">
                    Work End Time
                  </label>

                  <input
                    type="text"
                    pInputText
                    class="w-full py-2.5! px-3! text-sm! rounded-lg! border-gray-200! shadow-none!"
                    placeholder="18:00"
                    [(ngModel)]="workEndTime"
                  />
                </div>

                <!-- Half Day Start -->
                <div class="flex flex-col gap-2">
                  <label class="text-sm font-medium text-gray-600">
                    Half-day Start
                  </label>

                  <input
                    type="text"
                    pInputText
                    class="w-full py-2.5! px-3! text-sm! rounded-lg! border-gray-200! shadow-none!"
                    placeholder="08:00"
                    [(ngModel)]="restDayHalfDayStart"
                  />
                </div>

                <!-- Half Day End -->
                <div class="flex flex-col gap-2">
                  <label class="text-sm font-medium text-gray-600">
                    Half-day End
                  </label>

                  <input
                    type="text"
                    pInputText
                    class="w-full py-2.5! px-3! text-sm! rounded-lg! border-gray-200! shadow-none!"
                    placeholder="12:00"
                    [(ngModel)]="restDayHalfDayEnd"
                  />
                </div>
              </div>

              <div
                class="flex items-start gap-2 mt-4 p-3 rounded-lg bg-blue-50 text-blue-700"
              >
                <i class="pi pi-info-circle text-sm mt-0.5"></i>

                <p class="text-xs leading-relaxed">
                  Enter time using the 24-hour format (HH:mm), for example 09:00
                  or 18:00.
                </p>
              </div>
            </section>
          </div>

          <!-- Dialog Footer -->
          <div
            class="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50"
          >
            <p-button
              label="Cancel"
              severity="secondary"
              [outlined]="true"
              (onClick)="visible = false"
              styleClass="w-full sm:w-auto py-2 px-5 rounded-lg text-sm font-medium"
            ></p-button>

            <p-button
              (onClick)="SaveDepartment()"
              [label]="isUpdate ? 'Save Changes' : 'Create Department'"
              [icon]="isUpdate ? 'pi pi-save' : 'pi pi-plus'"
              severity="info"
              styleClass="w-full sm:w-auto bg-blue-800! hover:bg-blue-900! border-none! py-2 px-5 rounded-lg text-sm font-semibold shadow-sm"
            ></p-button>
          </div>
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

  PagingSignal = signal<PagingContent<DepartmentDto>>(
    {} as PagingContent<DepartmentDto>,
  );
  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  visible: boolean = false;
  isUpdate: boolean = false;

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

  ngOnInit(): void {}

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

    this.Query.Filter = null;
    this.GetData();
  }

  ActionClick(data: DepartmentDto | null, action: string) {
    if (action === 'Delete' && data) {
      this.loadingService.start();

      this.departmentService
        .Delete(data?.id)
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe({
          next: (res: any) => {
            this.loadingService.stop();

            this.messageService.add({
              severity: 'success',
              summary: 'Deleted',
              detail: res?.message || 'Department deleted successfully',
            });

            this.PagingSignal.update((state) => ({
              ...state,
              data: state.data.filter((d: any) => d.id !== data.id),
            }));

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
                'Failed to delete department',
            });
          },
        });
    } else {
      this.isUpdate = action === 'Update';
      this.title = this.isUpdate ? 'Edit Department' : 'Add New Department';

      this.GetHodSelection();

      if (this.isUpdate) {
        this.hodId = data?.hodId || null;
        this.departmentName = data?.name || null;
        this.departmentId = data?.id || null;
        this.workStartTime = data?.workStartTime || null;
        this.workEndTime = data?.workEndTime || null;
        this.restDayHalfDayStart = data?.restDayHalfDayStart || null;
        this.restDayHalfDayEnd = data?.restDayHalfDayEnd || null;
      } else {
        this.hodId = null;
        this.departmentName = null;
        this.workStartTime = null;
        this.workEndTime = null;
        this.restDayHalfDayStart = null;
        this.restDayHalfDayEnd = null;
      }
      this.visible = true;
      this.cdr.detectChanges();
    }
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
            detail: `Department: ${this.departmentName} has been ${this.isUpdate ? 'updated' : 'created'} successfully`,
          });

          this.visible = false;

          if (this.isUpdate) {
            this.PagingSignal.update((state) => ({
              ...state,
              data: state.data.map((u: any) => (u.id === res.id ? res : u)),
            }));
          } else {
            this.PagingSignal.update((state) => ({
              ...state,
              data: [res, ...state.data],
            }));
          }
          this.cdr.markForCheck();
        } else {
          this.messageService.add({
            severity: 'warn',
            summary: 'Warning',
            detail: res.message || res.Message || 'Operation partially failed',
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

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
