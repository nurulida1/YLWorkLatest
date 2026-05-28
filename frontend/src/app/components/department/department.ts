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
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { LoadingService } from '../../services/loading.service';
import { MenuItem, MessageService } from 'primeng/api';
import { DepartmentService } from '../../services/departmentService';
import { UserService } from '../../services/userService.service';
import { SelectModule } from 'primeng/select';
import { Observable, Subject, takeUntil } from 'rxjs';
import {
  BuildFilterText,
  BuildSortText,
  GridifyQueryExtend,
  PagingContent,
} from '../../shared/helpers/helpers';
import { DepartmentDto } from '../../models/Department';
import { DialogModule } from 'primeng/dialog';

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
  ],
  template: `<div class="w-full flex flex-col p-6">
      <div
        class="flex flex-row items-center gap-2 text-xs tracking-wider uppercase text-gray-400 font-medium"
      >
        <span
          class="cursor-pointer hover:text-gray-600 transition-colors"
          [routerLink]="'/dashboard'"
        >
          Dashboard
        </span>
        <span class="text-gray-300">/</span>
        <span class="text-gray-600 font-semibold text-gray-700"
          >Department</span
        >
      </div>

      <div
        class="mt-4 border border-gray-100 rounded-xl shadow-sm bg-white overflow-hidden flex flex-col"
      >
        <div
          class="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gray-50/50"
        >
          <div class="flex flex-col">
            <h1 class="text-xl text-gray-800 font-bold tracking-tight">
              Departments
            </h1>
            <p class="text-sm text-gray-500 mt-0.5">
              Create, edit, and orchestrate functional organizational branches.
            </p>
          </div>

          <div class="flex flex-row items-center gap-2.5 self-end sm:self-auto">
            <div class="w-72 relative">
              <input
                type="text"
                pInputText
                [(ngModel)]="search"
                class="w-full pl-3 pr-9 py-2 text-sm rounded-lg border-gray-200 focus:border-sky-500! shadow-inner!"
                placeholder="Search branches by name..."
                (keyup)="onKeyDown($event)"
              />
              <i
                class="pi pi-search absolute top-1/2 -translate-y-1/2 right-3 text-gray-400 text-sm pointer-events-none"
              ></i>
            </div>

            <p-button
              label="New Department"
              (onClick)="ActionClick(null, 'add')"
              icon="pi pi-plus-circle"
              severity="info"
              styleClass="py-2 px-4 rounded-lg text-sm font-medium tracking-wide shadow-sm"
            ></p-button>
          </div>
        </div>

        <div class="p-4 bg-white">
          <p-table
            #fTable
            [value]="PagingSignal().data"
            [paginator]="true"
            [rows]="Query.PageSize"
            [totalRecords]="PagingSignal().totalElements"
            [tableStyle]="{ 'min-width': '50rem' }"
            [rowsPerPageOptions]="[10, 20, 30, 50]"
            [stripedRows]="true"
            [showGridlines]="false"
            [lazy]="true"
            (onLazyLoad)="NextPage($event)"
            styleClass="p-datatable-sm"
          >
            <ng-template #header>
              <tr
                class="text-xs uppercase text-gray-500 font-bold border-b border-gray-200"
              >
                <th class="bg-gray-50/70 py-3.5 px-5 text-left w-[45%]">
                  Department Name
                </th>
                <th class="bg-gray-50/70 py-3.5 px-5 text-left w-[40%]">
                  Head of Department (HOD)
                </th>
                <th class="bg-gray-50/70 py-3.5 px-5 text-center w-[15%]">
                  Actions
                </th>
              </tr>
            </ng-template>

            <ng-template #body let-data>
              <tr
                class="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors text-sm text-gray-700"
              >
                <td class="py-3 px-5 font-semibold text-gray-900">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-sky-400"></span>
                    {{ data.name }}
                  </div>
                </td>
                <td class="py-3 px-5 text-gray-600">
                  <div
                    class="flex items-center gap-2"
                    *ngIf="data.hod?.fullName; else noHod"
                  >
                    <i class="pi pi-user text-xs text-gray-400"></i>
                    <span>{{ data.hod?.fullName }}</span>
                  </div>
                  <ng-template #noHod>
                    <span class="text-xs italic text-gray-400"
                      >Unassigned / Vacant</span
                    >
                  </ng-template>
                </td>
                <td class="py-3 px-5 text-center">
                  <button
                    class="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-all inline-flex items-center justify-center"
                    (click)="onEllipsisClick($event, data, menu)"
                  >
                    <i class="pi pi-ellipsis-h text-sm"></i>
                  </button>
                </td>
              </tr>
            </ng-template>

            <ng-template #emptymessage>
              <tr>
                <td
                  colspan="3"
                  class="py-12 text-center text-gray-400 bg-white font-medium border border-gray-100 rounded-lg"
                >
                  <i
                    class="pi pi-folder-open text-3xl text-gray-200 mb-2 block"
                  ></i>
                  No workspace department branches discovered matching selection
                  records.
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
      styleClass="text-sm shadow-md border-gray-100!"
    ></p-menu>

    <p-dialog
      *ngIf="visible"
      [(visible)]="visible"
      [modal]="true"
      [draggable]="false"
      [closable]="true"
      (onHide)="visible = false"
      styleClass="relative border-0 bg-white rounded-xl shadow-2xl overflow-y-auto w-[90%] max-w-lg"
    >
      <ng-template #headless>
        <div class="p-6 flex flex-col space-y-6">
          <div class="flex flex-col">
            <h3 class="font-bold text-lg text-gray-800">{{ title }}</h3>
            <p class="text-xs text-gray-400 mt-0.5 tracking-wide">
              Provide management parameters to configure structural data
              profiles.
            </p>
          </div>

          <div class="space-y-4 text-sm text-gray-700">
            <div class="flex flex-col gap-1.5">
              <label class="font-semibold text-gray-700">
                Department Name <span class="text-rose-500 font-bold">*</span>
              </label>
              <input
                type="text"
                pInputText
                class="w-full py-2 px-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-sky-100"
                placeholder="e.g. Technology Support Services"
                [(ngModel)]="departmentName"
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="font-semibold text-gray-700"
                >Head of Department (HOD)</label
              >
              <p-select
                [options]="hodSelection || []"
                optionLabel="label"
                optionValue="value"
                appendTo="body"
                [filter]="true"
                filterPlaceholder="Search user identity profiles..."
                [showClear]="!!hodId"
                placeholder="Assign dynamic leadership authority..."
                [(ngModel)]="hodId"
                styleClass="w-full border-gray-200! rounded-lg! shadow-none!"
              ></p-select>
            </div>
          </div>

          <div class="border-b border-gray-100"></div>

          <div class="flex flex-row items-center justify-between gap-3 pt-1">
            <p-button
              label="Cancel"
              severity="secondary"
              (onClick)="visible = false"
              styleClass="border border-gray-200! py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-50!"
            ></p-button>
            <p-button
              (onClick)="SaveDepartment()"
              [label]="isUpdate ? 'Save Changes' : 'Create Branch'"
              severity="info"
              styleClass="py-2 px-5 rounded-lg text-sm font-medium tracking-wide shadow-sm"
            ></p-button>
          </div>
        </div>
      </ng-template>
    </p-dialog>`,
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
      } else {
        this.hodId = null;
        this.departmentName = null;
      }
      this.visible = true;
      this.cdr.detectChanges();
    }
  }

  onEllipsisClick(event: any, client: any, menu: any) {
    this.menuItems = [
      {
        label: 'Edit',
        icon: 'pi pi-pencil',
        command: () => this.ActionClick(client, 'Update'),
      },
      {
        label: 'Delete',
        icon: 'pi pi-trash',
        command: () => this.ActionClick(client, 'Delete'),
      },
    ];

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
        })
      : this.departmentService.Create({
          name: this.departmentName,
          hodId: this.hodId!,
          description: '',
          code: '',
          isActive: true,
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
