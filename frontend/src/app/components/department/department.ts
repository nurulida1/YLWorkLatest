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
  template: `<div class="w-full flex flex-col p-5">
      <div
        class="flex flex-row items-center gap-1 text-gray-500 text-[15px] tracking-wide"
      >
        <div
          class="cursor-pointer hover:text-gray-600"
          [routerLink]="'/dashboard'"
        >
          Dashboard
        </div>
        /
        <div class="text-gray-700 font-semibold">Department</div>
      </div>

      <div
        class="mt-3 border border-gray-200 rounded-md tracking-wide bg-white p-5 flex flex-col"
      >
        <div class="flex flex-row items-center justify-between">
          <div class="flex flex-col">
            <div class="text-[20px] text-gray-700 font-semibold">
              Department
            </div>
            <div class="text-gray-500 text-[15px]">
              Create, edit, and manage department
            </div>
          </div>
          <div class="flex flex-row items-center gap-2">
            <div class="min-w-[300px] relative">
              <input
                type="text"
                pInputText
                [(ngModel)]="search"
                class="w-full! text-[15px]!"
                placeholder="Search by name"
                (keyup)="onKeyDown($event)"
              />
              <i
                class="pi pi-search absolute! top-3! right-2! text-gray-500!"
              ></i>
            </div>
            <p-button
              label="New Department"
              (onClick)="ActionClick(null, 'add')"
              icon="pi pi-plus-circle"
              severity="info"
              size="small"
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
            [tableStyle]="{ 'min-width': '60rem' }"
            [rowsPerPageOptions]="[10, 20, 30, 50]"
            [stripedRows]="true"
            [showGridlines]="true"
            [lazy]="true"
            (onLazyLoad)="NextPage($event)"
          >
            <ng-template #header>
              <tr>
                <th class="bg-gray-100! text-[15px]! text-center! w-[40%]!">
                  Name
                </th>
                <th class="bg-gray-100! text-[15px]! text-center! w-[40%]!">
                  HOD
                </th>
                <th class="bg-gray-100! text-[15px]! text-center! w-[20%]!">
                  Action
                </th>
              </tr>
            </ng-template>
            <ng-template #body let-data>
              <tr>
                <td class="text-[14px] text-center! font-semibold!">
                  {{ data.name }}
                </td>
                <td class="text-[14px] text-center!">
                  {{ data.hod?.fullName }}
                </td>
                <td class="text-center! text-[14px]!">
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
                  <div class="text-[15px] text-center text-gray-500">
                    No department found in record.
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
      *ngIf="visible"
      [(visible)]="visible"
      [modal]="true"
      [draggable]="false"
      [closable]="true"
      (onHide)="visible = false"
      styleClass="relative! border-0! bg-white! overflow-y-auto! w-[80%]! md:w-[50%]!"
    >
      <ng-template #headless>
        <div class="p-5 flex flex-col">
          <div class="font-semibold text-[20px]">{{ title }}</div>
          <div class="font-normal tracking-wide text-gray-500 text-[15px]">
            Fill in all required field.
          </div>
          <div class="text-[15px] tracking-wide mt-7 grid grid-cols-12 gap-4">
            <div class="col-span-12 flex flex-col gap-1">
              <div>Name <span class="text-red-500">*</span></div>
              <input
                type="text"
                pInputText
                class="w-full py-1.5!"
                [(ngModel)]="departmentName"
              />
            </div>
            <div class="col-span-12 flex flex-col gap-1">
              <div>HOD</div>
              <p-select
                [options]="hodSelection || []"
                appendTo="body"
                [filter]="true"
                [showClear]="hodId"
                [(ngModel)]="hodId"
              ></p-select>
            </div>
          </div>
          <div class="border-b border-gray-200 mt-3 mb-3"></div>
          <div class="flex flex-row items-center gap-3 justify-between">
            <p-button
              label="Cancel"
              severity="secondary"
              (onClick)="visible = false"
              styleClass="border-gray-200! py-1.5! px-4!"
            ></p-button>
            <p-button
              (onClick)="SaveDepartment()"
              [label]="isUpdate ? 'Save Changes' : 'Create'"
              severity="info"
              styleClass="py-1.5! px-4!"
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
            detail: `Department ${this.departmentName + ' has been ' + this.isUpdate ? 'updated' : 'created'} successfully`,
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
