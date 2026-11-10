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
import { TagModule } from 'primeng/tag';
import { Subject, takeUntil } from 'rxjs';
import { HasPermissionActionDirective } from '../../../common/directives/hasPermission.directive';
import { PaymentDto } from '../../../models/Payments';
import { LoadingService } from '../../../services/loading.service';
import { PaymentService } from '../../../services/paymentService.service';
import { PermissionContextService } from '../../../services/permission-context.service';
import {
  PagingContent,
  GridifyQueryExtend,
  BuildSortText,
  BuildFilterText,
  ValidateAllFormFields,
} from '../../../shared/helpers/helpers';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';

@Component({
  selector: 'app-payments',
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
    TagModule,
    MenuModule,
    PaginatorModule,
    HasPermissionActionDirective,
  ],
  template: `
    <div class="w-full min-h-screen flex flex-col p-3 sm:p-5">
      <!-- Breadcrumb -->
      <div
        class="flex items-center gap-2 text-xs sm:text-sm text-gray-500 tracking-wide"
      >
        <div
          [routerLink]="'/dashboard'"
          class="cursor-pointer hover:text-blue-600"
        >
          Dashboard
        </div>
        <i class="pi pi-angle-right text-xs"></i>
        <div class="text-gray-700 font-semibold">Payments</div>
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
            <div class="text-xl font-semibold text-gray-800">Payments</div>
            <div class="text-sm text-gray-500 mt-1">
              Manage and oversee all project payments.
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
                placeholder="Search by payment no"
                (keyup)="onKeyDown($event)"
              />
              <i class="pi pi-search absolute top-3 right-3 text-gray-400"></i>
            </div>

            <p-button
              *hasPermissionAction="'canCreate'"
              label="Add New Payment"
              icon="pi pi-plus"
              (onClick)="ActionClick(null, 'add')"
              styleClass="w-full sm:w-auto whitespace-nowrap bg-blue-700! border-none! hover:bg-blue-500!"
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
                <th class="bg-gray-50! w-[25%]!">Client / Vendor</th>
                <th class="bg-gray-50! text-center!">Payment No</th>
                <th class="bg-gray-50! text-center!">Paid Date</th>
                <th class="bg-gray-50! text-center!">Amount</th>
                <th class="bg-gray-50! text-center!">Type</th>
                <th class="bg-gray-50! text-center!">Payment Method</th>
                <th
                  *ngIf="rights().canUpdate || rights().canDelete"
                  class="bg-gray-50! text-center! w-24!"
                >
                  Action
                </th>
              </tr>
            </ng-template>

            <ng-template #body let-data>
              <tr>
                <td class="font-semibold! text-gray-700">
                  {{ data.client?.name ?? data.supplier?.name ?? '-' }}
                </td>

                <td class="text-center! font-semibold!">
                  {{ data.paymentNo || '-' }}
                </td>

                <td class="text-center! whitespace-nowrap">
                  {{ data.paymentDate | date: 'dd/MM/yyyy' }}
                </td>

                <td class="text-center! font-semibold! whitespace-nowrap">
                  {{ data.amount | currency: 'RM ' }}
                </td>

                <td class="text-center!">
                  <p-tag
                    [value]="data.clientId ? 'Income' : 'Expense'"
                    [severity]="data.clientId ? 'success' : 'danger'"
                  ></p-tag>
                </td>

                <td class="text-center!">
                  {{ data.paymentMode || '-' }}
                </td>

                <td
                  *ngIf="rights().canUpdate || rights().canDelete"
                  class="text-center!"
                >
                  <button
                    type="button"
                    (click)="onEllipsisClick($event, data, menu)"
                    class="inline-flex items-center justify-center rounded-lg p-2 text-gray-600 hover:bg-gray-100"
                    title="Payment actions"
                  >
                    <i class="pi pi-ellipsis-h"></i>
                  </button>
                </td>
              </tr>
            </ng-template>

            <ng-template #emptymessage>
              <tr>
                <td colspan="7" class="text-center! py-8! text-gray-500">
                  <i class="pi pi-wallet text-2xl mb-2 block"></i>
                  No payment found in records.
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
                  <div class="text-xs text-gray-500">Payment No.</div>
                  <div class="font-semibold text-gray-800 break-all mt-1">
                    {{ data.paymentNo || '-' }}
                  </div>
                  <div class="mt-2">
                    <p-tag
                      [value]="data.clientId ? 'Income' : 'Expense'"
                      [severity]="data.clientId ? 'success' : 'danger'"
                    ></p-tag>
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
                <div class="col-span-2 min-w-0">
                  <div class="text-xs text-gray-500">Client / Vendor</div>
                  <div
                    class="text-sm text-gray-700 font-semibold mt-1 break-words"
                  >
                    {{ data.client?.name ?? data.supplier?.name ?? '-' }}
                  </div>
                </div>

                <div class="min-w-0">
                  <div class="text-xs text-gray-500">Payment Date</div>
                  <div class="text-sm text-gray-700 font-medium mt-1">
                    {{ data.paymentDate | date: 'dd/MM/yyyy' }}
                  </div>
                </div>

                <div class="min-w-0">
                  <div class="text-xs text-gray-500">Payment Method</div>
                  <div class="text-sm text-gray-700 font-medium mt-1">
                    {{ data.paymentMode || '-' }}
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div
                *ngIf="rights().canUpdate || rights().canDelete"
                class="border-t border-gray-100 mt-3 pt-3 flex justify-end"
              >
                <button
                  type="button"
                  (click)="onEllipsisClick($event, data, menu)"
                  class="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <i class="pi pi-ellipsis-h"></i>
                  Actions
                </button>
              </div>
            </div>
          } @empty {
            <div
              class="border border-gray-200 rounded-xl p-8 text-center text-gray-500"
            >
              <i class="pi pi-wallet text-3xl mb-3 block"></i>
              <div class="font-medium">No payment found</div>
              <div class="text-sm mt-1">
                There are no payment records to display.
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

    <!-- Action Menu -->
    <p-menu #menu [model]="menuItems" [popup]="true" appendTo="body"></p-menu>

    <!-- Add / Update Payment Dialog -->
    <p-dialog
      *ngIf="visible"
      [(visible)]="visible"
      [modal]="true"
      [draggable]="false"
      [closable]="true"
      [autoZIndex]="true"
      [baseZIndex]="10000"
      [appendTo]="'body'"
      [breakpoints]="{ '640px': '96vw', '960px': '85vw' }"
      styleClass="payment-dialog"
      (onHide)="visible = false"
    >
      <ng-template #headless>
        <div class="flex flex-col min-h-0">
          <!-- Dialog Header -->
          <div class="p-4 sm:p-6 pb-3">
            <div class="font-semibold text-lg sm:text-xl text-gray-800">
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
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium text-gray-700">
                Payment No <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                pInputText
                class="w-full"
                formControlName="paymentNo"
              />
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium text-gray-700">Client</label>
              <p-select
                [options]="clients || []"
                appendTo="body"
                styleClass="w-full"
                inputStyleClass="w-full"
                panelStyleClass="text-sm"
                formControlName="clientId"
                [showClear]="!!FG.get('clientId')?.value"
                [filter]="true"
                placeholder="Select client"
              ></p-select>
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium text-gray-700"
                >Invoice No</label
              >
              <p-select
                [options]="clients || []"
                appendTo="body"
                styleClass="w-full"
                inputStyleClass="w-full"
                panelStyleClass="text-sm"
                formControlName="invoiceId"
                [showClear]="!!FG.get('invoiceId')?.value"
                [filter]="true"
                placeholder="Select invoice"
              ></p-select>
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium text-gray-700">
                Reference No <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                pInputText
                class="w-full"
                formControlName="referenceNo"
              />
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium text-gray-700">
                Payment Date <span class="text-red-500">*</span>
              </label>
              <p-datepicker
                appendTo="body"
                dateFormat="dd/mm/yy"
                [showIcon]="true"
                styleClass="w-full"
                inputStyleClass="w-full"
                formControlName="paymentDate"
              ></p-datepicker>
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium text-gray-700">
                Payment Mode <span class="text-red-500">*</span>
              </label>
              <p-select
                appendTo="body"
                styleClass="w-full"
                inputStyleClass="w-full"
                formControlName="paymentMode"
                [options]="[
                  { label: 'Cash', value: 'Cash' },
                  { label: 'Cheque', value: 'Cheque' },
                  { label: 'Bank Transfer', value: 'Bank Transfer' },
                  { label: 'Paypal', value: 'Paypal' },
                ]"
                placeholder="Select payment mode"
              ></p-select>
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium text-gray-700">
                Amount <span class="text-red-500">*</span>
              </label>
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
              <label class="text-sm font-medium text-gray-700"
                >Paid Amount</label
              >
              <p-inputnumber
                appendTo="body"
                styleClass="w-full"
                inputStyleClass="w-full"
                formControlName="paidAmount"
                mode="currency"
                currency="MYR"
                locale="en-MY"
                [useGrouping]="true"
                [minFractionDigits]="2"
                [maxFractionDigits]="2"
              ></p-inputnumber>
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium text-gray-700"
                >Due Amount</label
              >
              <p-inputnumber
                appendTo="body"
                styleClass="w-full"
                inputStyleClass="w-full"
                formControlName="dueAmount"
                mode="currency"
                currency="MYR"
                locale="en-MY"
                [useGrouping]="true"
                [minFractionDigits]="2"
                [maxFractionDigits]="2"
              ></p-inputnumber>
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium text-gray-700">Notes</label>
              <input
                type="text"
                pInputText
                class="w-full"
                formControlName="notes"
              />
            </div>

            <!-- Attachment -->
            <div class="sm:col-span-2 flex flex-col gap-2">
              <label class="text-sm font-medium text-gray-700">
                Attachment <span class="text-red-500">*</span>
              </label>

              <div
                class="p-4 sm:p-5 bg-gray-50 border-2 rounded-xl border-gray-300 border-dashed flex flex-col items-center justify-center"
              >
                <div
                  class="w-24 h-24 border border-gray-200 rounded-lg overflow-hidden bg-white"
                  *ngIf="FG.get('attachment')?.value"
                >
                  <img
                    [src]="FG.get('attachment')?.value"
                    alt="Payment attachment preview"
                    class="w-full h-full object-cover"
                  />
                </div>

                <div
                  class="pi pi-cloud-upload text-gray-400! text-3xl!"
                  *ngIf="!FG.get('attachment')?.value"
                ></div>

                <div class="text-gray-500 text-sm mt-3 text-center">
                  Choose an image attachment or
                  <button
                    type="button"
                    class="text-blue-600 hover:underline font-medium"
                    (click)="fileInput.click()"
                  >
                    Browse
                  </button>
                </div>
              </div>

              <input
                type="file"
                #fileInput
                class="hidden"
                accept="image/*"
                (change)="onFileSelected($event)"
              />
            </div>
          </div>

          <!-- Footer -->
          <div
            class="border-t border-gray-200 p-4 sm:px-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2"
          >
            <p-button
              (onClick)="visible = false"
              label="Cancel"
              severity="secondary"
              styleClass="w-full sm:w-auto"
            ></p-button>

            <p-button
              (onClick)="Submit()"
              [label]="isUpdate ? 'Save Changes' : 'Create'"
              icon="pi pi-save"
              styleClass="w-full sm:w-auto border-none! bg-blue-700! hover:bg-blue-500!"
            ></p-button>
          </div>
        </div>
      </ng-template>
    </p-dialog>
  `,
  styleUrl: './payments.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Payments implements OnInit, OnDestroy {
  @ViewChild('fTable') fTable?: Table;

  private readonly loadingService = inject(LoadingService);
  private readonly paymentService = inject(PaymentService);
  private readonly messageService = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly permissionContext = inject(PermissionContextService);
  readonly rights = this.permissionContext.rights;
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  PagingSignal = signal<PagingContent<PaymentDto>>(
    {} as PagingContent<PaymentDto>,
  );
  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  visible: boolean = false;
  isUpdate: boolean = false;

  search: string = '';
  title: string = 'Add New Payment';
  FG!: FormGroup;
  menuItems: MenuItem[] = [];

  clients: { label: string; value: string }[] = [];

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 10;
    this.Query.Filter = null;
    this.Query.OrderBy = `CreatedAt desc`;
    this.Query.Select = null;
    this.Query.Includes = 'Client,Supplier';
  }

  ngOnInit(): void {}

  GetData() {
    this.loadingService.start();
    this.paymentService
      .GetMany(this.Query)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.PagingSignal.set(res);
          this.cdr.markForCheck();
          this.loadingService.stop();
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
    this.Query.OrderBy = sortText ? sortText : 'CreatedAt desc';

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
      paymentNo: [
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

  ActionClick(data: PaymentDto | null, action: string) {
    this.FG = new FormGroup({
      id: new FormControl<string | null>({ value: null, disabled: true }),
      paymentNo: new FormControl<string | null>(null),
      clientId: new FormControl<string | null>(null, Validators.required),
      invoiceId: new FormControl<string | null>(null),
      referenceNo: new FormControl<string | null>(null),
      paymentDate: new FormControl<Date | null>(null, Validators.required),
      paymentMode: new FormControl<string | null>(null),
      amount: new FormControl<number | null>(null, Validators.required),
      paidAmount: new FormControl<number | null>(null),
      dueAmount: new FormControl<number | null>(null),
      notes: new FormControl<string | null>(null),
      attachment: new FormControl<string | null>(null),
    });

    if (action === 'Update') {
      this.isUpdate = true;
      this.title = 'Update Payment';
      this.FG.get('id')?.enable();

      if (data) this.FG.patchValue(data);
      if (data?.paymentDate)
        this.FG.get('paymentDate')?.patchValue(new Date(data.paymentDate));
      this.visible = true;
    } else if (action === 'Delete' && data) {
      this.loadingService.start();
      this.paymentService
        .Delete(data.id)
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe({
          next: (res) => {
            // Remove the deleted item from the current PagingSignal data
            const currentPaging = this.PagingSignal();
            const updatedData = currentPaging.data.filter(
              (item) => item.id !== data.id,
            );

            this.PagingSignal.set({
              ...currentPaging,
              data: updatedData,
              totalElements: currentPaging.totalElements - 1, // Update total count
            });
            this.cdr.markForCheck();
            this.messageService.add({
              severity: 'success',
              summary: 'Deleted',
              detail: `Payment: ${data.paymentNo} deleted`,
            });
          },
          error: (err) => {
            this.loadingService.stop();
          },
        });
    } else {
      this.title = 'Add New Payment';
      this.isUpdate = false;
      this.FG.reset();
      this.visible = true;
    }

    this.cdr.detectChanges();
  }

  Submit() {
    ValidateAllFormFields(this.FG);

    if (!this.FG.valid) return;

    this.loadingService.start();
    this.paymentService
      .Create(this.FG.value)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          if (this.isUpdate) {
            const index = this.PagingSignal().data.findIndex(
              (x) => x.id === this.FG.get('id')?.value,
            );

            if (index > -1) {
              this.PagingSignal().data[index] = { ...res };
            }
          } else {
            this.PagingSignal().data.push(res);
          }

          this.loadingService.stop();
          this.visible = false;
          this.cdr.markForCheck();
          this.messageService.add({
            severity: 'success',
            summary: this.isUpdate ? 'Updated' : 'Created',
            detail: `Payment: ${res.paymentNo} created successfully.`,
          });
          if (!this.isUpdate) this.FG.reset();
        },
        error: (err) => {
          this.loadingService.stop();
          this.messageService.add({
            severity: 'error',
            summary: this.isUpdate ? 'Update Failed' : 'Creation Failed',
            detail: err?.error?.message || 'Something went wrong',
          });
        },
      });
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

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        const base64String = e.target.result;

        this.FG.patchValue({
          attachment: base64String,
        });

        this.cdr.markForCheck();
      };

      reader.readAsDataURL(file);
    }
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
