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
import { Observable, Subject, takeUntil } from 'rxjs';
import {
  BuildFilterText,
  BuildSortText,
  GridifyQueryExtend,
  PagingContent,
} from '../../../shared/helpers/helpers';
import { CompanyDto } from '../../../models/Company';
import { ImageModule } from 'primeng/image';
import { ClientService } from '../../../services/ClientService';
import { HasPermissionActionDirective } from '../../../common/directives/hasPermission.directive';
import { PermissionContextService } from '../../../services/permission-context.service';

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
  template: `<div class="w-full flex flex-col p-5">
      <div
        class="flex flex-row items-center gap-1 text-gray-500 tracking-wide text-sm"
      >
        <div
          class="cursor-pointer hover:text-gray-600"
          [routerLink]="'/dashboard'"
        >
          Dashboard
        </div>
        <i class="pi pi-chevron-right text-[8px]! text-gray-500!"></i>
        <div class="text-gray-700 font-semibold">Client</div>
      </div>
      <div class="flex flex-row items-center justify-between my-4">
        <div class="flex flex-col">
          <div class="font-bold text-3xl text-gray-800">Client Directory</div>
          <span class="text-gray-500"
            >Manage client information and maintain your company's client
            records.</span
          >
        </div>
        <div class="flex flex-row items-center gap-2">
          <p-button
            (onClick)="exportCsv()"
            label="Export CSV"
            icon="pi pi-download"
            severity="secondary"
            [outlined]="true"
            size="small"
            styleClass="rounded-none! px-5! py-2! border! border-gray-400!"
          ></p-button>
          <p-button
            (onClick)="ActionClick(null, 'add')"
            label="Add Client"
            icon="pi pi-user-plus"
            severity="info"
            size="small"
            styleClass="rounded-none! px-5! py-2.5! border-none! bg-blue-600!"
          ></p-button>
        </div>
      </div>
      <div
        class="mt-3 border border-gray-200 rounded-md tracking-wide bg-white p-5 flex flex-col"
      >
        <div class="w-[70%] relative">
          <input
            type="text"
            pInputText
            class="w-full! pl-8! rounded-none!"
            placeholder="Search by name"
            [(ngModel)]="search"
            (keyup)="onKeyDown($event)"
          />
          <i class="pi pi-search absolute! top-3.5! left-2! text-gray-500!"></i>
        </div>
        <div class="mt-3">
          <p-table
            #fTable
            [value]="PagingSignal().data"
            [paginator]="true"
            [rows]="Query.PageSize"
            [totalRecords]="PagingSignal().totalElements"
            [tableStyle]="{ 'min-width': '80rem' }"
            [rowsPerPageOptions]="[10, 20, 30, 50]"
            [showGridlines]="true"
            [lazy]="true"
            (onLazyLoad)="NextPage($event)"
            ><ng-template #header>
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
                  *ngIf="rights().canUpdate || rights().canDelete"
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
                    <div class="font-semibold">{{ data.email }}</div>
                    <div class="text-sm text-gray-500">
                      {{ data.contactNo }}
                    </div>
                  </div>
                </td>
                <td class="text-left!">
                  <div class="flex flex-col">
                    <div class="font-semibold">
                      {{ data.primaryContactPerson }}
                    </div>
                    <div class="text-sm text-gray-500">
                      {{ data.primaryEmail }}
                    </div>
                  </div>
                </td>
                <td class="text-left!">
                  {{
                    data.balancePayment | currency: 'RM ' : 'symbol' : '1.2-2'
                  }}
                </td>

                <td
                  *ngIf="rights().canUpdate || rights().canDelete"
                  class="text-center!"
                >
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
                  <div class="text-center text-gray-500">
                    No client found in record.
                  </div>
                </td>
              </tr>
            </ng-template></p-table
          >
        </div>
      </div>
    </div>
    <p-menu #menu [model]="menuItems" [popup]="true"></p-menu> `,
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
  private readonly permissionContext = inject(PermissionContextService);
  readonly rights = this.permissionContext.rights;
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  PagingSignal = signal<PagingContent<CompanyDto>>(
    {} as PagingContent<CompanyDto>,
  );
  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  visible: boolean = false;
  isUpdate: boolean = false;

  search: string = '';
  title: string = 'Add New Client';
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

    this.Query.Filter = BuildFilterText({
      first: 0,
      rows: this.fTable?.rows,
      filters: filter,
      sortField: null,
      sortOrder: null,
    } as TableLazyLoadEvent);

    this.Query.Page = 1;

    this.GetData();
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

      this.clientService
        .Delete(data?.id)
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
                'Failed to delete client',
            });
          },
        });
    } else {
      this.router.navigate(['/clients/form'], {
        queryParams: { id: data?.id },
      });
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

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
