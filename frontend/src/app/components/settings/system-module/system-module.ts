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
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { SelectModule } from 'primeng/select';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { SystemModuleService } from '../../../services/SystemModuleService';
import { SystemModuleDto } from '../../../models/SystemModule';
import { MessageService, MenuItem } from 'primeng/api';
import { Subject, takeUntil, Observable } from 'rxjs';
import { LoadingService } from '../../../services/loading.service';
import {
  PagingContent,
  GridifyQueryExtend,
  BuildSortText,
  BuildFilterText,
} from '../../../shared/helpers/helpers';

@Component({
  selector: 'app-system-module',
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
  template: `<div
      class="w-full min-h-screen bg-[#f4f6f8] p-6 text-gray-800 tracking-normal font-sans"
    >
      <div
        class="flex flex-row items-center gap-1.5 text-sm text-gray-500 font-medium mb-4"
      >
        <span
          class="cursor-pointer hover:text-blue-600 transition-colors"
          [routerLink]="'/dashboard'"
          >Dashboard</span
        >
        <span class="text-gray-400">/</span>
        <span class="text-gray-700 font-semibold">System Modules</span>
      </div>

      <div
        class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6"
      >
        <div>
          <h1 class="text-2xl font-bold text-gray-900 m-0">
            System Application Modules
          </h1>
          <p class="text-sm text-gray-500 mt-1 m-0">
            Register and manage functional application boundaries and permission
            keys.
          </p>
        </div>

        <div
          class="flex items-center gap-3 self-end md:self-auto w-full md:w-auto"
        >
          <div class="relative w-full md:w-[280px]">
            <input
              type="text"
              pInputText
              [(ngModel)]="search"
              class="w-full !pl-9 !pr-4 !py-2 !bg-white !border-gray-300 !rounded-lg"
              placeholder="Search by name..."
              (keyup)="onKeyDown($event)"
            />
            <i
              class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
            ></i>
          </div>

          <p-button
            label="New Module"
            icon="pi pi-plus"
            (onClick)="ActionClick(null, 'add')"
            styleClass="!bg-[#2b6cb0] hover:!bg-[#2b5a9e] !border-0 !py-2 !px-4  font-medium rounded-lg shadow-sm transition-all whitespace-nowrap text-white"
          ></p-button>
        </div>
      </div>

      <div
        class="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden"
      >
        <p-table
          #fTable
          [value]="PagingSignal().data"
          [paginator]="true"
          [rows]="Query.PageSize"
          [totalRecords]="PagingSignal().totalElements"
          [rowsPerPageOptions]="[10, 20, 30, 50]"
          [lazy]="true"
          (onLazyLoad)="NextPage($event)"
          styleClass="p-datatable-sm"
        >
          <ng-template #header>
            <tr
              class="bg-gray-50/70 border-b border-gray-200 text-sm font-bold text-gray-600 uppercase tracking-wider"
            >
              <th class="py-3 px-6 text-left w-[45%]">
                Module Identification Name
              </th>
              <th class="py-3 px-6 text-left w-[40%]">System Route Code Key</th>
              <th class="py-3 px-6 text-center w-[15%]">Actions</th>
            </tr>
          </ng-template>

          <ng-template #body let-data>
            <tr
              class="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors text-sm"
            >
              <td class="py-3.5 px-6 font-semibold text-gray-900">
                {{ data.name }}
              </td>
              <td class="py-3.5 px-6">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-mono font-medium bg-gray-100 text-gray-800 border border-gray-200"
                >
                  {{ data.code || 'n/a' }}
                </span>
              </td>
              <td class="py-3.5 px-6 text-center">
                <button
                  type="button"
                  (click)="onEllipsisClick($event, data, menu)"
                  class="w-8 h-8 inline-flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-all border-0 bg-transparent cursor-pointer"
                >
                  <i class="pi pi-ellipsis-v text-sm"></i>
                </button>
              </td>
            </tr>
          </ng-template>

          <ng-template #emptymessage>
            <tr>
              <td
                colspan="3"
                class="py-12 text-center text-gray-400 font-medium"
              >
                <i
                  class="pi pi-folder-open text-2xl mb-2 block text-gray-300"
                ></i>
                No administrative system modules located within active storage
                registries.
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>

    <p-menu
      #menu
      [model]="menuItems"
      [popup]="true"
      styleClass="!rounded-lg !shadow-md !border-gray-200"
    ></p-menu>

    <p-dialog
      [(visible)]="visible"
      [modal]="true"
      [draggable]="false"
      [closable]="true"
      (onHide)="visible = false"
      styleClass="w-[90%] sm:w-[460px] !border-0 !rounded-xl !shadow-xl !overflow-hidden bg-white"
      header="System Module Configuration"
    >
      <div class="p-6 flex flex-col gap-5 bg-white">
        <div>
          <h3 class="text-base font-bold text-gray-900 m-0">{{ title }}</h3>
          <p class="text-xs text-gray-500 mt-1 m-0">
            Provide precise code parameters to bind this application view
            container safely.
          </p>
        </div>

        <div class="flex flex-col gap-4 my-2">
          <div class="flex flex-col gap-1.5">
            <label
              class="text-xs font-bold text-gray-700 uppercase tracking-wider"
            >
              Module Name <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              pInputText
              class="w-full !py-2 !px-3 !text-sm !border-gray-300 !rounded-lg focus:!border-blue-500"
              placeholder="e.g., Purchase Orders"
              [(ngModel)]="moduleName"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label
              class="text-xs font-bold text-gray-700 uppercase tracking-wider"
              >System Route Code Key</label
            >
            <input
              type="text"
              pInputText
              class="w-full !py-2 !px-3 !text-sm !border-gray-300 !rounded-lg focus:!border-blue-500 font-mono"
              placeholder="e.g., purchase-orders"
              [(ngModel)]="code"
            />
          </div>
        </div>

        <div
          class="flex items-center gap-3 justify-end mt-2 pt-4 border-t border-gray-100"
        >
          <p-button
            label="Cancel"
            severity="secondary"
            (onClick)="visible = false"
            styleClass="!bg-gray-100 hover:!bg-gray-200 !text-gray-700 !border-0 !py-2 !px-4 !text-sm font-medium rounded-lg transition-colors"
          ></p-button>

          <p-button
            (onClick)="SaveModule()"
            [label]="isUpdate ? 'Save Changes' : 'Create Module'"
            styleClass="!bg-[#2b6cb0] hover:!bg-[#2b5a9e] !border-0 !py-2 !px-4 !text-sm font-medium rounded-lg text-white shadow-sm transition-colors"
          ></p-button>
        </div>
      </div>
    </p-dialog> `,
  styleUrl: './system-module.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemModule implements OnInit, OnDestroy {
  @ViewChild('fTable') fTable?: Table;

  private readonly loadingService = inject(LoadingService);
  private readonly messageService = inject(MessageService);
  private readonly systemModuleService = inject(SystemModuleService);
  private readonly cdr = inject(ChangeDetectorRef);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  PagingSignal = signal<PagingContent<SystemModuleDto>>(
    {} as PagingContent<SystemModuleDto>,
  );
  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  visible: boolean = false;
  isUpdate: boolean = false;

  search: string = '';
  title: string = 'Add New System Module';
  moduleName: string | null = null;
  code: string | null = null;
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
    this.systemModuleService
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

  ActionClick(data: SystemModuleDto | null, action: string) {
    if (action === 'Delete' && data) {
      this.loadingService.start();

      this.systemModuleService
        .Delete(data?.id)
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe({
          next: (res: any) => {
            this.loadingService.stop();

            this.messageService.add({
              severity: 'success',
              summary: 'Deleted',
              detail: res?.message || 'System module deleted successfully',
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
                'Failed to delete system module',
            });
          },
        });
    } else {
      this.isUpdate = action === 'Update';
      this.title = this.isUpdate
        ? 'Edit System Module'
        : 'Add New System Module';

      if (this.isUpdate) {
        this.moduleName = data?.name || null;
        this.code = data?.code || null;
      } else {
        this.moduleName = null;
        this.code = null;
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

  SaveModule() {
    if (!this.moduleName) {
      return this.messageService.add({
        severity: 'error',
        summary: 'Module Name is required',
        detail: '',
      });
    }

    const request$: Observable<any> = this.isUpdate
      ? this.systemModuleService.Update({
          id: this.code!,
          name: this.moduleName,
          code: '',
        })
      : this.systemModuleService.Create({
          name: this.moduleName,
          code: this.code,
        });

    request$.pipe(takeUntil(this.ngUnsubscribe)).subscribe({
      next: (res) => {
        this.loadingService.stop();

        if (res) {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `Module: ${this.moduleName} has been ${this.isUpdate ? 'updated' : 'created'} successfully`,
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
