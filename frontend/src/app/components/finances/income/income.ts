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
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MessageService, MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { SelectModule } from 'primeng/select';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { Subject, takeUntil } from 'rxjs';
import { HasPermissionActionDirective } from '../../../common/directives/hasPermission.directive';
import { IncomeDto } from '../../../models/Income';
import { IncomeService } from '../../../services/IncomeService';
import { LoadingService } from '../../../services/loading.service';
import { PermissionContextService } from '../../../services/permission-context.service';
import {
  PagingContent,
  GridifyQueryExtend,
  BuildSortText,
  BuildFilterText,
  ValidateAllFormFields,
  resolveAssetUrl,
} from '../../../shared/helpers/helpers';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';

@Component({
  selector: 'app-income',
  imports: [
    CommonModule,
    TableModule,
    ReactiveFormsModule,
    FormsModule,
    SelectModule,
    InputTextModule,
    InputNumberModule,
    ButtonModule,
    DialogModule,
    RouterLink,
    DatePickerModule,
    MenuModule,
    TextareaModule,
    HasPermissionActionDirective,
    PaginatorModule,
  ],
  template: `
    <div class="w-full min-h-screen flex flex-col p-3 sm:p-5">
      <!-- Breadcrumb -->
      <div
        class="flex items-center gap-2 text-xs sm:text-sm text-gray-500 tracking-wide"
      >
        <div
          class="cursor-pointer hover:text-blue-600"
          [routerLink]="'/dashboard'"
        >
          Dashboard
        </div>
        <i class="pi pi-angle-right text-xs"></i>
        <div class="text-gray-700 font-semibold">Incomes</div>
      </div>

      <!-- Main Content -->
      <div
        class="mt-4 border border-gray-200 rounded-xl bg-white p-3 sm:p-5 flex flex-col min-w-0"
      >
        <!-- Header -->
        <div
          class="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4"
        >
          <div class="flex flex-col">
            <div class="text-xl font-semibold text-gray-800">Incomes</div>
            <div class="text-sm text-gray-500 mt-1">
              Manage and oversee all incomes here.
            </div>
          </div>

          <div
            class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
          >
            <div class="w-full sm:w-[280px] relative">
              <input
                type="text"
                pInputText
                [(ngModel)]="search"
                class="w-full"
                placeholder="Search by income no"
                (keyup)="onKeyDown($event)"
              />
              <i class="pi pi-search absolute top-3 right-3 text-gray-400"></i>
            </div>

            <p-button
              *hasPermissionAction="'canCreate'"
              label="Add New Income"
              icon="pi pi-plus"
              (onClick)="ActionClick(null, 'Create')"
              styleClass="w-full sm:w-auto whitespace-nowrap border-none! bg-blue-700! hover:bg-blue-500!"
            ></p-button>
          </div>
        </div>

        <!-- Summary -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5">
          <div class="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div class="text-xs text-gray-500">Total Records</div>
            <div class="text-xl font-semibold text-gray-800 mt-1">
              {{ PagingSignal().totalElements || 0 }}
            </div>
          </div>

          <div class="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div class="text-xs text-gray-500">Current Page</div>
            <div class="text-xl font-semibold text-gray-800 mt-1">
              {{ Query.Page || 1 }}
            </div>
          </div>

          <div
            class="rounded-lg border border-gray-200 bg-gray-50 p-3 col-span-2 sm:col-span-1"
          >
            <div class="text-xs text-gray-500">Records Per Page</div>
            <div class="text-xl font-semibold text-gray-800 mt-1">
              {{ Query.PageSize || 10 }}
            </div>
          </div>
        </div>

        <!-- Desktop Table -->
        <div class="hidden lg:block mt-5">
          <p-table
            #fTable
            [value]="PagingSignal().data || []"
            [paginator]="true"
            [rows]="Query.PageSize"
            [totalRecords]="PagingSignal().totalElements || 0"
            [rowsPerPageOptions]="[10, 20, 30, 50]"
            [lazy]="true"
            [showGridlines]="true"
            [rowHover]="true"
            [tableStyle]="{ 'min-width': '60rem' }"
            (onLazyLoad)="NextPage($event)"
          >
            <ng-template #header>
              <tr>
                <th class="bg-gray-50! text-center!">Income No</th>
                <th class="bg-gray-50! text-center!">Date</th>
                <th class="bg-gray-50! text-center!">Description</th>
                <th class="bg-gray-50! text-center!">Amount</th>
                <th class="bg-gray-50! text-center!">Payment Mode</th>
                <th class="bg-gray-50! text-center!">Processed By</th>
                <th
                  *ngIf="rights().canRead"
                  class="bg-gray-50! text-center! w-20!"
                >
                  Attachment
                </th>
              </tr>
            </ng-template>

            <ng-template #body let-data>
              <tr>
                <td class="text-center! font-semibold! text-gray-700">
                  {{ data.incomeNo || '-' }}
                </td>

                <td class="text-center! whitespace-nowrap">
                  {{ data.incomeDate | date: 'dd/MM/yyyy' }}
                </td>

                <td class="text-center! max-w-[280px]!">
                  <span class="line-clamp-2">
                    {{ data.description || '-' }}
                  </span>
                </td>

                <td class="text-center! font-semibold! whitespace-nowrap">
                  {{ data.amount | currency: 'RM ' }}
                </td>

                <td class="text-center!">
                  {{ data.paymentMode || '-' }}
                </td>

                <td class="text-center!">
                  {{ data.processedBy?.fullName || '-' }}
                </td>

                <td *ngIf="rights().canRead" class="text-center!">
                  <button
                    *ngIf="data.attachment"
                    type="button"
                    (click)="downloadAttachment(data)"
                    class="inline-flex items-center justify-center rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                    title="Download attachment"
                  >
                    <i class="pi pi-download"></i>
                  </button>
                  <span *ngIf="!data.attachment" class="text-gray-400">-</span>
                </td>
              </tr>
            </ng-template>

            <ng-template #emptymessage>
              <tr>
                <td colspan="7" class="text-center! py-8! text-gray-500">
                  <i class="pi pi-wallet text-2xl mb-2 block"></i>
                  No income found in records.
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>

        <!-- Mobile / Tablet Cards -->
        <div class="lg:hidden mt-5 flex flex-col gap-3">
          @for (data of PagingSignal().data || []; track data.id) {
            <div class="border border-gray-200 rounded-xl p-4 bg-white">
              <!-- Card Header -->
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="text-xs text-gray-500">Income No.</div>
                  <div class="font-semibold text-gray-800 break-all mt-1">
                    {{ data.incomeNo || '-' }}
                  </div>
                </div>

                <div class="text-right shrink-0">
                  <div class="text-xs text-gray-500">Amount</div>
                  <div
                    class="font-bold text-blue-700 text-base mt-1 whitespace-nowrap"
                  >
                    {{ data.amount | currency: 'RM ' }}
                  </div>
                </div>
              </div>

              <div class="border-t border-gray-100 my-3"></div>

              <!-- Card Details -->
              <div class="grid grid-cols-2 gap-x-3 gap-y-4">
                <div class="min-w-0">
                  <div class="text-xs text-gray-500">Income Date</div>
                  <div class="text-sm text-gray-700 font-medium mt-1">
                    {{ data.incomeDate | date: 'dd/MM/yyyy' }}
                  </div>
                </div>

                <div class="min-w-0">
                  <div class="text-xs text-gray-500">Payment Mode</div>
                  <div class="text-sm text-gray-700 font-medium mt-1">
                    {{ data.paymentMode || '-' }}
                  </div>
                </div>

                <div class="col-span-2 min-w-0">
                  <div class="text-xs text-gray-500">Description</div>
                  <div class="text-sm text-gray-700 mt-1 break-words">
                    {{ data.description || '-' }}
                  </div>
                </div>
              </div>

              <!-- Attachment -->
              <div
                *ngIf="rights().canRead && data.attachment"
                class="border-t border-gray-100 mt-3 pt-3 flex justify-end"
              >
                <button
                  type="button"
                  (click)="downloadAttachment(data)"
                  class="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
                >
                  <i class="pi pi-download"></i>
                  Download Attachment
                </button>
              </div>
            </div>
          } @empty {
            <div
              class="border border-gray-200 rounded-xl p-8 text-center text-gray-500"
            >
              <i class="pi pi-wallet text-3xl mb-3 block"></i>
              <div class="font-medium">No income found</div>
              <div class="text-sm mt-1">
                There are no income records to display.
              </div>
            </div>
          }

          <!-- Mobile Pagination -->
          <p-paginator
            [first]="((Query.Page || 1) - 1) * (Query.PageSize || 10)"
            [rows]="Query.PageSize || 10"
            [totalRecords]="PagingSignal().totalElements || 0"
            [rowsPerPageOptions]="[10, 20, 30, 50]"
            (onPageChange)="onMobilePageChange($event)"
            styleClass="border border-gray-200 rounded-lg"
          ></p-paginator>
        </div>
      </div>
    </div>

    <p-menu #menu [model]="menuItems" [popup]="true" appendTo="body"></p-menu>

    <!-- Add Income Dialog -->
    <p-dialog
      *ngIf="visible"
      [(visible)]="visible"
      [modal]="true"
      [draggable]="false"
      [closable]="false"
      [autoZIndex]="true"
      [baseZIndex]="10000"
      [appendTo]="'body'"
      [breakpoints]="{ '640px': '96vw', '960px': '85vw' }"
      styleClass="income-dialog"
      (onHide)="visible = false"
    >
      <ng-template #headless>
        <div class="flex flex-col min-h-0">
          <!-- Dialog Header -->
          <div class="p-4 sm:p-6 pb-3">
            <div class="font-semibold text-lg text-gray-800">
              {{ title }}
            </div>
            <div class="text-sm text-gray-500 mt-1">
              Fill in all required fields.
            </div>
          </div>

          <div class="border-b border-gray-200"></div>

          <!-- Form -->
          <div
            [formGroup]="FG"
            class="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto"
          >
            <div class="sm:col-span-2 flex flex-col gap-1">
              <label class="text-sm font-medium text-gray-700">Amount</label>
              <p-inputnumber
                appendTo="body"
                styleClass="w-full"
                inputStyleClass="w-full"
                formControlName="amount"
                mode="currency"
                currency="MYR"
                locale="en-MY"
                [useGrouping]="true"
                [minFractionDigits]="2"
                [maxFractionDigits]="2"
              ></p-inputnumber>
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium text-gray-700">Date</label>
              <p-datepicker
                appendTo="body"
                styleClass="w-full"
                inputStyleClass="w-full"
                formControlName="incomeDate"
                [showIcon]="true"
                dateFormat="dd/mm/yy"
              ></p-datepicker>
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium text-gray-700"
                >Payment Mode</label
              >
              <p-select
                appendTo="body"
                styleClass="w-full"
                inputStyleClass="w-full"
                formControlName="paymentMode"
                [options]="[
                  { label: 'Cash', value: 'Cash' },
                  { label: 'Card', value: 'Card' },
                  { label: 'Bank Transfer', value: 'Bank Transfer' },
                  { label: 'E-Wallet', value: 'E-Wallet' },
                  { label: 'Cheque', value: 'Cheque' },
                  { label: 'Other', value: 'Other' },
                ]"
                placeholder="Select payment mode"
              ></p-select>
            </div>

            <div class="sm:col-span-2 flex flex-col gap-1">
              <label class="text-sm font-medium text-gray-700"
                >Description</label
              >
              <textarea
                pTextarea
                class="w-full"
                formControlName="description"
                rows="4"
                [autoResize]="true"
              ></textarea>
            </div>
          </div>

          <!-- Dialog Footer -->
          <div
            class="border-t border-gray-200 p-4 sm:px-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2"
          >
            <p-button
              label="Cancel"
              (onClick)="visible = false"
              severity="secondary"
              styleClass="w-full sm:w-auto"
            ></p-button>

            <p-button
              label="Submit"
              icon="pi pi-save"
              (onClick)="Submit()"
              styleClass="w-full sm:w-auto bg-blue-700! border-none! hover:bg-blue-500!"
            ></p-button>
          </div>
        </div>
      </ng-template>
    </p-dialog>
  `,
  styleUrl: './income.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Income implements OnInit, OnDestroy {
  @ViewChild('fTable') fTable?: Table;

  private readonly loadingService = inject(LoadingService);
  private readonly incomeService = inject(IncomeService);
  private readonly messageService = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly permissionContext = inject(PermissionContextService);
  readonly rights = this.permissionContext.rights;
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  PagingSignal = signal<PagingContent<IncomeDto>>(
    {} as PagingContent<IncomeDto>,
  );
  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  visible: boolean = false;
  search: string = '';
  title: string = 'Add New Income';
  FG!: FormGroup;
  menuItems: MenuItem[] = [];

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 10;
    this.Query.Filter = null;
    this.Query.OrderBy = 'CreatedAt desc';
    this.Query.Select = null;
    this.Query.Includes = 'ProcessedBy';
  }

  ngOnInit(): void {}

  GetData() {
    this.loadingService.start();
    this.incomeService
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
    this.Query.OrderBy = sortText ? sortText : `CreatedAt desc`;

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
      IncomeNo: [
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

  ActionClick(data: IncomeDto | null, action: string) {
    this.initForm();

    if (action === 'Create') {
      this.title = 'Add New Income';
      this.FG.reset();
      this.visible = true;
      this.cdr.detectChanges();
    } else if (action === 'Delete' && data) {
      this.loadingService.start();
      this.incomeService
        .Delete(data.id)
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe({
          next: (res) => {
            this.loadingService.stop();
            const index = this.PagingSignal().data.findIndex(
              (x) => x.id === data.id,
            );
            if (index !== -1) {
              const updatedData = [...this.PagingSignal().data];
              updatedData.splice(index, 1);
              this.PagingSignal.set({
                ...this.PagingSignal(),
                data: updatedData,
                totalElements: this.PagingSignal().totalElements - 1,
              });
            }
            this.cdr.markForCheck();
            this.messageService.add({
              severity: 'success',
              summary: 'Deleted',
              detail: `Income ${data.incomeNo} deleted`,
            });
          },
          error: (err) => {
            this.loadingService.stop();
          },
        });
    }
  }

  initForm() {
    this.FG = new FormGroup({
      id: new FormControl<string | null>({ value: null, disabled: true }),
      amount: new FormControl<number | null>(null, Validators.required),
      incomeDate: new FormControl<Date | null>(new Date(), Validators.required),
      paymentMode: new FormControl<string | null>(null, Validators.required),
      description: new FormControl<string | null>(null),
    });
  }

  downloadAttachment(data: IncomeDto) {
    if (!data) return;

    const cleanPath = data.attachment.replace(/\\/g, '/');
    const fileUrl = resolveAssetUrl(cleanPath);

    fetch(fileUrl)
      .then((response) => response.blob())
      .then((blob) => {
        const blobUrl = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;

        const fileExtension = cleanPath.split('.').pop() || '';
        const incomeNo = data.incomeNo || 'Income';

        link.download = `${incomeNo}.${fileExtension}`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        window.URL.revokeObjectURL(blobUrl);
      })
      .catch((error) => {
        console.error('Download failed:', error);
      });
  }

  Submit() {
    ValidateAllFormFields(this.FG);

    if (!this.FG.valid) return;

    this.loadingService.start();

    const formData = new FormData();
    const raw = this.FG.getRawValue();

    Object.entries(raw).forEach(([key, value]) => {
      if (value === null || value === undefined || key === 'id') return;

      if (value instanceof Date) {
        value = value.toISOString();
      }

      if (typeof value === 'object' && !(value instanceof File)) {
        value = JSON.stringify(value);
      }

      formData.append(key, value as any);
    });

    this.incomeService
      .Create(formData)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();
          this.PagingSignal().data.push(res);
          this.visible = false;
          this.cdr.markForCheck();
          this.messageService.add({
            severity: 'success',
            summary: 'Successfully Created',
            detail: `Income: ${res.incomeNo} created successfully.`,
          });
          this.FG.reset();
        },
        error: (err) => {
          this.loadingService.stop();
          this.messageService.add({
            severity: 'error',
            summary: 'Creation Failed',
            detail: err?.error?.message || 'Something went wrong',
          });
        },
      });
  }

  onEllipsisClick(event: any, data: IncomeDto, menu: any) {
    this.menuItems = [];

    if (this.rights().canDelete) {
      this.menuItems.push({
        label: 'Delete',
        icon: 'pi pi-trash',
        command: () => this.ActionClick(data, 'Delete'),
      });
    }

    menu.toggle(event);
  }

  onMobilePageChange(event: PaginatorState): void {
    const first = event.first ?? 0;
    const rows = event.rows ?? this.Query.PageSize ?? 10;

    this.Query.Page = Math.floor(first / rows) + 1;
    this.Query.PageSize = rows;

    this.GetData();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
