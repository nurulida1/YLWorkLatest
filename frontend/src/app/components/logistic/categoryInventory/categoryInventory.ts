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
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { LoadingService } from '../../../services/loading.service';
import { MenuItem, MessageService } from 'primeng/api';
import { CategoryInventoryService } from '../../../services/CategoryInventoryService';
import { Observable, Subject, takeUntil } from 'rxjs';
import {
  BuildFilterText,
  BuildSortText,
  GridifyQueryExtend,
  PagingContent,
} from '../../../shared/helpers/helpers';
import { BaseOption } from '../../../models/BaseModel';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MenuModule } from 'primeng/menu';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-category-inventory',
  imports: [
    CommonModule,
    ButtonModule,
    InputTextModule,
    FormsModule,
    RouterLink,
    TableModule,
    MenuModule,
    DialogModule,
  ],
  template: `<div class="w-full flex flex-col p-5">
      <div class="flex flex-row items-center gap-1 text-gray-500 tracking-wide">
        <div
          class="cursor-pointer hover:text-gray-500"
          [routerLink]="'/dashboard'"
        >
          Dashboard
        </div>
        /
        <div class="text-gray-700 font-semibold">Category</div>
      </div>
      <div
        class="mt-3 border border-gray-200 rounded-md tracking-wide bg-white p-5 flex flex-col"
      >
        <div class="flex flex-row items-center justify-between">
          <div class="flex flex-col">
            <div class="text-[20px] text-gray-700 font-semibold">Category</div>
            <div class="text-gray-500">
              List of available inventory category.
            </div>
          </div>
          <div class="flex flex-row items-center gap-2">
            <div class="min-w-[300px] relative">
              <input
                type="text"
                pInputText
                class="w-full!"
                placeholder="Search by name"
                [(ngModel)]="search"
                (keyup)="onKeyDown($event)"
              />
              <i
                class="pi pi-search absolute! top-3! right-2! text-gray-500!"
              ></i>
            </div>
            <p-button
              label="Add Category"
              icon="pi pi-plus-circle"
              (onClick)="ActionClick(null, 'add')"
              severity="info"
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
                <th class="bg-gray-100!! text-center! w-[80%]!">Name</th>
                <th class="bg-gray-100!! text-center! w-[20%]!">Action</th>
              </tr>
            </ng-template>
            <ng-template #body let-data>
              <tr>
                <td class="text-center! font-semibold!">
                  {{ data.name }}
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
                  <div class="text-center text-gray-500">
                    No category found in record.
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
      styleClass="relative! border-0! bg-white! overflow-y-auto! w-[80%]! lg:w-[50%]!"
    >
      <ng-template #headless>
        <div class="p-5 flex flex-col">
          <div class="font-semibold text-[18px]">{{ title }}</div>
          <div class="font-normal tracking-wide text-sm text-gray-500">
            Fill in all required field.
          </div>
          <div class="grid grid-cols-12 gap-4 tracking-wide mt-7">
            <div class="col-span-12 flex flex-col gap-1">
              <div>Name <span class="text-red-500">*</span></div>
              <input
                type="text"
                pInputText
                class="w-full py-1.5!"
                [(ngModel)]="name"
              />
            </div>
          </div>
          <div class="border-b border-gray-200 mt-3 mb-3"></div>
          <div class="flex flex-row items-center gap-3 justify-end">
            <p-button
              label="Cancel"
              severity="secondary"
              (onClick)="visible = false"
              styleClass="border-gray-200! py-1.5! px-4!"
            ></p-button>
            <p-button
              (onClick)="SaveCategory()"
              [label]="isUpdate ? 'Save Changes' : 'Add'"
              severity="info"
              styleClass="py-1.5! px-4!"
            ></p-button>
          </div>
        </div>
      </ng-template>
    </p-dialog>`,
  styleUrl: './categoryInventory.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryInventory implements OnInit, OnDestroy {
  @ViewChild('fTable') fTable?: Table;

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly loadingService = inject(LoadingService);
  private readonly messageService = inject(MessageService);
  private readonly categoryInventoryService = inject(CategoryInventoryService);

  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  PagingSignal = signal<PagingContent<BaseOption>>(
    {} as PagingContent<BaseOption>,
  );
  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  visible: boolean = false;
  isUpdate: boolean = false;

  search: string = '';
  title: string = 'Add New Category';
  name: string | null = null;
  id: string | null = null;
  menuItems: MenuItem[] = [];

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 10;
    this.Query.Filter = null;
    this.Query.OrderBy = 'Name';
    this.Query.Includes = null;
    this.Query.Select = null;
  }

  ngOnInit(): void {}

  GetData() {
    this.loadingService.start();
    this.categoryInventoryService
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

  ActionClick(data: BaseOption | null, action: string) {
    if (action === 'Delete' && data) {
      this.loadingService.start();

      this.categoryInventoryService
        .Delete(data?.id)
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe({
          next: (res: any) => {
            this.loadingService.stop();

            this.messageService.add({
              severity: 'success',
              summary: 'Deleted',
              detail: res?.message || 'Category deleted successfully',
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
                'Failed to delete category',
            });
          },
        });
    } else {
      this.isUpdate = action === 'Update';
      this.title = this.isUpdate ? 'Edit Category' : 'Add New Category';

      if (this.isUpdate) {
        this.id = data?.id || null;
        this.name = data?.name || null;
      } else {
        this.id = null;
        this.name = null;
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

  SaveCategory() {
    if (!this.name) {
      return this.messageService.add({
        severity: 'error',
        summary: 'Name is required',
        detail: '',
      });
    }

    const request$: Observable<any> = this.isUpdate
      ? this.categoryInventoryService.Update({
          id: this.id!,
          name: this.name,
        })
      : this.categoryInventoryService.Create({
          name: this.name,
        });

    request$.pipe(takeUntil(this.ngUnsubscribe)).subscribe({
      next: (res) => {
        this.loadingService.stop();

        if (res) {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `Category: ${this.name} has been ${this.isUpdate ? 'updated' : 'created'} successfully`,
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
