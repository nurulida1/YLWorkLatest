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
import { LoadingService } from '../../../services/loading.service';
import { MenuItem, MessageService } from 'primeng/api';
import { CompanyService } from '../../../services/companyService';
import { Subject, takeUntil } from 'rxjs';
import {
  BuildFilterText,
  BuildSortText,
  GridifyQueryExtend,
  PagingContent,
} from '../../../shared/helpers/helpers';
import { CompanyDto } from '../../../models/Company';
import { ImageModule } from 'primeng/image';
import { CompanyType } from '../../../shared/enum/enum';

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
        <div class="text-gray-700 font-semibold">Company</div>
      </div>
      <div
        class="mt-3 border border-gray-200 rounded-md tracking-wide bg-white p-5 flex flex-col"
      >
        <div class="flex flex-row items-center justify-between">
          <div class="flex flex-col">
            <div class="text-[20px] text-gray-700 font-semibold">Company</div>
            <div class="text-gray-500 text-[15px]">
              Manage company profiles and information
            </div>
          </div>
          <div class="flex flex-row items-center gap-2">
            <div class="min-w-[300px] relative">
              <input
                type="text"
                pInputText
                class="w-full! text-[15px]!"
                placeholder="Search by name"
                (keyup)="onKeyDown($event)"
              />
              <i
                class="pi pi-search absolute! top-3! right-2! text-gray-500!"
              ></i>
            </div>
            <p-button
              label="New Company"
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
            ><ng-template #header>
              <tr>
                <th
                  class="bg-gray-100! text-[15px]! text-center! w-[10%]!"
                ></th>
                <th
                  pSortableColumn="Name"
                  class="bg-gray-100! text-[15px]! text-center! w-[30%]!"
                >
                  <div class="flex flex-row justify-center items-center gap-2">
                    <div>Name</div>
                    <p-sortIcon field="Name" class="mt-1" />
                  </div>
                </th>
                <th class="bg-gray-100! text-[15px]! text-center! w-[20%]!">
                  Contact No
                </th>
                <th class="bg-gray-100! text-[15px]! text-center! w-[20%]!">
                  Contact Person
                </th>
                <th class="bg-gray-100! text-[15px]! text-center! w-[10%]!">
                  Type
                </th>
                <th class="bg-gray-100! text-[15px]! text-center! w-[10%]!">
                  Action
                </th>
              </tr>
            </ng-template>
            <ng-template #body let-data>
              <tr>
                <td class="text-[14px] text-center! font-semibold!">
                  <div class="flex items-center justify-center">
                    <div
                      class="w-[100px] flex items-center justify-center"
                      *ngIf="!data.logoImage"
                    >
                      <i class="pi pi-building text-[30px]!"></i>
                    </div>
                    <p-image
                      *ngIf="data.logoImage"
                      [src]="data.logoImage"
                      width="100px"
                    ></p-image>
                  </div>
                </td>
                <td class="text-[14px] text-center! font-semibold!">
                  {{ data.name }}
                </td>
                <td class="text-[14px] text-center!">
                  {{ data.contactNo }}
                </td>
                <td class="text-[14px] text-center!">
                  {{ data.contactPerson1 }}
                </td>
                <td class="text-[14px] text-center!">
                  {{ getCompanyTypeLabel(data.type) }}
                </td>

                <td class="text-center! text-[14px]!">
                  <div class="flex items-center justify-center">
                    <i
                      class="pi pi-ellipsis-h cursor-pointer"
                      (click)="onEllipsisClick($event, data, menu)"
                    ></i>
                  </div>
                </td>
              </tr> </ng-template
            ><ng-template #emptymessage>
              <tr>
                <td class="border-x!" colspan="100%">
                  <div class="text-[15px] text-center text-gray-500">
                    No company found in record.
                  </div>
                </td>
              </tr>
            </ng-template></p-table
          >
        </div>
      </div>
    </div>
    <p-menu #menu [model]="menuItems" [popup]="true"></p-menu> `,
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
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  PagingSignal = signal<PagingContent<CompanyDto>>(
    {} as PagingContent<CompanyDto>,
  );
  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  visible: boolean = false;
  isUpdate: boolean = false;

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

  ActionClick(data: CompanyDto | null, action: string) {
    if (action === 'Delete' && data) {
      this.loadingService.start();

      this.companyService
        .Delete(data?.id)
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
                'Failed to delete company',
            });
          },
        });
    } else {
      this.router.navigate(['/company/form'], {
        queryParams: { id: data?.id },
      });
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

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
