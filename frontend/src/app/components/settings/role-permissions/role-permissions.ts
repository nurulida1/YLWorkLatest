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
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { LoadingService } from '../../../services/loading.service';
import { DepartmentService } from '../../../services/departmentService';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { RolePermissionService } from '../../../services/RolePermissionService';
import { RolePermissionDto } from '../../../models/RolePermission';
import {
  BuildFilterText,
  BuildSortText,
  GridifyQueryExtend,
  PagingContent,
} from '../../../shared/helpers/helpers';
import { MessageService } from 'primeng/api';
import { SystemModuleService } from '../../../services/SystemModuleService';

@Component({
  selector: 'app-role-permissions',
  imports: [
    CommonModule,
    ButtonModule,
    InputTextModule,
    FormsModule,
    RouterLink,
    TableModule,
    SelectModule,
    DialogModule,
    CheckboxModule,
  ],
  template: `<div
    class="w-full min-h-screen bg-[#f4f6f8] p-6 text-gray-800 tracking-normal font-sans"
  >
    <div
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
    >
      <div>
        <h1 class="text-2xl font-bold text-gray-900 m-0">
          Role Access Control
        </h1>
        <p class="text-sm text-gray-500 mt-1 m-0">
          Configure permissions for each role across different modules.
        </p>
      </div>
      <p-button
        label="Apply Permission Changes"
        icon="pi pi-shield"
        [loading]="isSaving()"
        [disabled]="matrixRows().length === 0"
        (onClick)="onSaveChanges()"
        styleClass="!bg-[#2b6cb0] hover:!bg-[#2b5a9e] disabled:!opacity-60 !border-0 !py-2 !px-4 !text-sm font-medium rounded-lg shadow-sm text-white transition-all whitespace-nowrap"
      ></p-button>
    </div>

    <div class="grid grid-cols-12 gap-6 items-start">
      <div
        class="col-span-12 xl:col-span-9 bg-white border border-gray-200 rounded-xl shadow-xs p-6"
      >
        <div class="flex flex-wrap items-center gap-4 mb-6">
          <div
            class="flex flex-col gap-1.5 min-w-[240px] flex-1 sm:flex-initial"
          >
            <label
              class="text-sm font-bold text-gray-700 uppercase tracking-wider"
              >Select System Role</label
            >
            <p-select
              [options]="systemRoles"
              [(ngModel)]="selectedSystemRole"
              (onChange)="onFilterScopeChanged()"
              placeholder="Choose Target Role"
              styleClass="w-full !bg-white !border-gray-300 !rounded-lg !text-sm"
            ></p-select>
          </div>

          <div
            class="flex flex-col gap-1.5 min-w-[280px] flex-1 sm:flex-initial"
          >
            <label
              class="text-sm font-bold text-gray-700 uppercase tracking-wider"
              >Select Department Scope</label
            >
            <p-select
              [options]="departmentSelection"
              [(ngModel)]="selectedDepartmentId"
              (onChange)="onFilterScopeChanged()"
              placeholder="Choose Department"
              styleClass="w-full !bg-white !border-gray-300 !rounded-lg !text-sm"
            ></p-select>
          </div>
        </div>

        <div class="overflow-hidden border border-gray-200 rounded-xl">
          <table class="w-full text-left border-collapse m-0">
            <thead>
              <tr
                class="bg-gray-50 border-b border-gray-200 text-sm font-bold text-gray-600 uppercase tracking-wider"
              >
                <th class="py-3 px-5 w-[35%]">
                  System Module Context Identifier
                </th>
                <th class="py-3 px-3 text-center w-[13%]">Read / View</th>
                <th class="py-3 px-3 text-center w-[13%]">Write / Create</th>
                <th class="py-3 px-3 text-center w-[13%]">Modify / Edit</th>
                <th class="py-3 px-3 text-center w-[13%]">Purge / Delete</th>
                <th class="py-3 px-3 text-center w-[13%]">State / Status</th>
              </tr>
            </thead>
            <tbody class="text-sm">
              <tr *ngIf="matrixRows().length === 0">
                <td
                  colspan="6"
                  class="py-12 text-center text-gray-400 font-medium bg-white"
                >
                  <i
                    class="pi pi-sliders-h text-2xl mb-2 block text-gray-300"
                  ></i>
                  Select both a functional Role and Department to construct the
                  workspace canvas matrix.
                </td>
              </tr>

              <tr
                *ngFor="let row of matrixRows()"
                class="border-b border-gray-100 last:border-0 hover:bg-gray-50/60 transition-colors bg-white"
                [ngClass]="{
                  'bg-amber-50/30':
                    row.moduleKey === 'quotations' ||
                    row.moduleKey === 'yl-works',
                }"
              >
                <td class="py-3.5 px-5">
                  <div class="flex flex-col">
                    <span class="font-semibold text-gray-900">
                      {{ row.moduleName }}
                    </span>
                    <span class="text-[11px] font-mono text-gray-400 mt-0.5">
                      {{ row.moduleKey || 'id: ' + row.systemModuleId }}
                    </span>
                  </div>
                </td>

                <td class="py-3.5 px-3 text-center">
                  <p-checkbox
                    [(ngModel)]="row.canRead"
                    [binary]="true"
                  ></p-checkbox>
                </td>

                <td class="py-3.5 px-3 text-center">
                  <p-checkbox
                    [(ngModel)]="row.canCreate"
                    [binary]="true"
                  ></p-checkbox>
                </td>

                <td class="py-3.5 px-3 text-center">
                  <p-checkbox
                    [(ngModel)]="row.canUpdate"
                    [binary]="true"
                  ></p-checkbox>
                </td>

                <td class="py-3.5 px-3 text-center">
                  <p-checkbox
                    [(ngModel)]="row.canDelete"
                    [binary]="true"
                    [styleClass]="
                      row.moduleKey === 'purchase-orders'
                        ? '![--p-checkbox-border-color:#f43f5e]'
                        : ''
                    "
                  ></p-checkbox>
                </td>

                <td class="py-3.5 px-3 text-center">
                  <p-checkbox
                    [(ngModel)]="row.canUpdateStatus"
                    [binary]="true"
                  ></p-checkbox>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="col-span-12 xl:col-span-3 flex flex-col gap-4">
        <div class="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
          <h3
            class="text-sm font-bold text-gray-800 mt-0 mb-3 uppercase tracking-wider flex items-center gap-2"
          >
            <i class="pi pi-bookmark-fill text-blue-600"></i> About This Page
          </h3>
          <p class="text-sm text-gray-600 leading-relaxed m-0">
            This section shows all system modules. You can control what each
            role is allowed to do in each module. Changes will be saved
            instantly.
          </p>
        </div>

        <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-xs">
          <div class="flex items-start gap-2.5">
            <i class="pi pi-info-circle text-blue-600 text-sm mt-0.5"></i>
            <div class="flex flex-col gap-1">
              <h4
                class="text-sm font-bold text-blue-900 m-0 uppercase tracking-wide"
              >
                Important
              </h4>
              <p class="text-[11px] text-blue-700 leading-normal m-0">
                Some modules may not have existing permissions yet. When you
                save, they will be created automatically.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`,
  styleUrl: './role-permissions.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RolePermissions implements OnInit, OnDestroy {
  @ViewChild('fTable') fTable?: Table;

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messageService = inject(MessageService);
  private readonly loadingService = inject(LoadingService);
  private readonly departmentService = inject(DepartmentService);
  private readonly systemModuleService = inject(SystemModuleService);
  private readonly rolePermissionService = inject(RolePermissionService);

  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  PagingSignal = signal<PagingContent<RolePermissionDto>>(
    {} as PagingContent<RolePermissionDto>,
  );
  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  search: string = '';
  selectedSystemRole: string = 'Support';
  selectedDepartmentId: string = '';

  matrixRows = signal<RolePermissionDto[]>([]);
  isSaving = signal<boolean>(false);

  systemRoles = [
    { label: 'Management', value: 'Management' },
    { label: 'HOD', value: 'HOD' },
    { label: 'Executive', value: 'Executive' },
    { label: 'Support', value: 'Support' },
    { label: 'SuperAdmin', value: 'SuperAdmin' },
  ];

  departmentSelection: any[] = [];

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 10;
    this.Query.Filter = null;
    this.Query.OrderBy = 'Name';
    this.Query.Select = null;
    this.Query.Includes = null;
  }

  ngOnInit(): void {
    this.GetDropdown();
  }

  GetDropdown() {
    this.departmentService
      .GetMany({
        Page: 1,
        PageSize: 1000000,
        OrderBy: 'Name',
        Includes: null,
        Select: null,
        Filter: null,
      })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((res) => {
        this.departmentSelection = res.data.map((x) => ({
          label: x.name,
          value: x.id,
        }));

        const salesDept = this.departmentSelection.find((d) =>
          d.label.toLowerCase().includes('sales'),
        );
        if (salesDept) {
          this.selectedDepartmentId = salesDept.value;
        } else if (this.departmentSelection.length > 0) {
          this.selectedDepartmentId = this.departmentSelection[0].value;
        }

        this.onFilterScopeChanged();
        this.cdr.markForCheck();
      });
  }

  onFilterScopeChanged(): void {
    if (!this.selectedSystemRole || !this.selectedDepartmentId) return;

    this.loadingService.start();

    forkJoin({
      modules: this.systemModuleService.GetMany({
        Page: 1,
        PageSize: 10000,
        OrderBy: 'Name',
        Includes: null,
        Select: null,
        Filter: null,
      }),
      assignedPermissions: this.rolePermissionService.GetByMatrix(
        this.selectedSystemRole,
        this.selectedDepartmentId,
      ),
    })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: ({ modules, assignedPermissions }) => {
          this.loadingService.stop();

          const completeMatrix: RolePermissionDto[] = modules.data.map(
            (mod: any) => {
              const existingMatch = assignedPermissions.find(
                (p) => p.systemModuleId === mod.id,
              );

              if (existingMatch) {
                return {
                  ...existingMatch,
                  moduleName: mod.name,
                  moduleKey: mod.code || existingMatch.moduleKey,
                };
              }

              return {
                id: '00000000-0000-0000-0000-000000000000',
                systemRole: this.selectedSystemRole,
                departmentId: this.selectedDepartmentId,
                systemModuleId: mod.id,
                moduleName: mod.name,
                moduleKey: mod.code || '',
                canRead: false,
                canCreate: false,
                canUpdate: false,
                canDelete: false,
                canUpdateStatus: false,
              } as unknown as RolePermissionDto;
            },
          );

          this.matrixRows.set(completeMatrix);
          this.cdr.markForCheck();
        },
        error: (err: any) => {
          this.loadingService.stop();
          this.messageService.add({
            severity: 'error',
            summary: 'Fetch Error',
            detail:
              'Failed to securely map master functional elements into current layout matrix.',
          });
        },
      });
  }

  GetData() {
    this.loadingService.start();
    this.rolePermissionService
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

  onSaveChanges(): void {
    if (this.matrixRows().length === 0) return;

    this.isSaving.set(true);
    this.loadingService.start();

    this.rolePermissionService
      .BulkSave(this.matrixRows())
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.loadingService.stop();
          this.messageService.add({
            severity: 'success',
            summary: 'Matrix Configuration Saved',
            detail:
              'Security policies and access control boundaries updated successfully.',
          });
          this.cdr.markForCheck();
        },
        error: () => {
          this.isSaving.set(false);
          this.loadingService.stop();
          this.cdr.markForCheck();
        },
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
