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
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { SelectModule } from 'primeng/select';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { LoadingService } from '../../../services/loading.service';
import { MenuItem, MessageService } from 'primeng/api';
import { QuotationService } from '../../../services/quotationService.service';
import { map, Observable, Subject, takeUntil } from 'rxjs';
import {
  BuildFilterText,
  BuildSortText,
  GridifyQueryExtend,
  PagingContent,
} from '../../../shared/helpers/helpers';
import { QuotationDto } from '../../../models/Quotation';
import { UserService } from '../../../services/userService.service';

@Component({
  selector: 'app-quotation',
  imports: [
    CommonModule,
    RouterLink,
    InputTextModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    MenuModule,
    SelectModule,
  ],
  template: `<div class="w-full min-h-[92.9vh] flex flex-col p-5">
      <div
        class="flex flex-row items-center gap-1 text-gray-500 text-[15px] tracking-wide"
      >
        <div
          [routerLink]="'/dashboard'"
          class="cursor-pointer hover:text-gray-600"
        >
          Dashboard
        </div>
        /
        <div class="text-gray-700 font-semibold">Quotations</div>
      </div>
      <div
        class="mt-3 border border-gray-200 rounded-md tracking-wide bg-white p-5 flex flex-col"
      >
        <div class="flex flex-row items-center justify-between">
          <div class="flex flex-col">
            <div class="text-[20px] text-gray-700 font-semibold">
              Quotations
            </div>
            <div class="text-gray-500 text-[15px]">
              View, create, and track all project quotations
            </div>
          </div>
          <div class="flex flex-row items-center gap-2">
            <div class="min-w-[300px] relative">
              <input
                type="text"
                pInputText
                [(ngModel)]="search"
                class="w-full! text-[15px]!"
                placeholder="Search by quotation no"
              />
              <i
                class="pi pi-search absolute! top-3! right-2! text-gray-500!"
              ></i>
            </div>
            <p-button
              *ngIf="isAdmin"
              label="New Quotations"
              [routerLink]="'/quotations/form'"
              icon="pi pi-plus"
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
            showGridlines
            [rowsPerPageOptions]="[10, 20, 30, 50]"
            stripedRows="false"
            [lazy]="true"
            (onLazyLoad)="NextPage($event)"
            showGridlines
          >
            <ng-template #header>
              <tr>
                <th
                  pSortableColumn="QuotationNo"
                  class="bg-gray-100! text-[15px]! text-center! w-[20%]!"
                >
                  <div class="flex flex-row justify-center items-center gap-2">
                    <div>Quotation No</div>
                    <p-sortIcon field="QuotationNo" />
                  </div>
                </th>
                <th class="bg-gray-100! text-[15px]! text-center! w-[30%]">
                  Client
                </th>
                <th
                  pSortableColumn="QuotationDate"
                  class="bg-gray-100! text-[15px]! text-center! w-[15%]!"
                >
                  <div class="flex flex-row justify-center items-center gap-2">
                    <div>Created On</div>
                    <p-sortIcon field="QuotationDate" />
                  </div>
                </th>
                <th
                  pSortableColumn="Status"
                  class="bg-gray-100! text-[15px]! text-center! w-[10%]!"
                >
                  <div class="flex flex-row justify-center items-center gap-2">
                    <div>Status</div>
                    <p-sortIcon field="Status" />
                  </div>
                </th>
                <th class="bg-gray-100! text-[15px]! text-center! w-[10%]">
                  Action
                </th>
              </tr>
            </ng-template>
            <ng-template #body let-data>
              <tr>
                <td class="text-center! text-[14px]! font-semibold!">
                  {{ data.quotationNo }}
                </td>
                <td class="text-center! text-[14px]!">
                  {{ data.client?.name }}
                </td>
                <td class="text-center! text-[14px]!">
                  {{ data.quotationDate | date: 'dd MMMM, yyyy' }}
                </td>
                <td class="text-center! text-[14px]!">
                  <div class="flex justify-center">
                    <div
                      class="rounded-full px-4 text-[13px] py-0.5 font-medium w-fit whitespace-nowrap"
                      [ngClass]="{
                        'bg-blue-100 text-blue-600':
                          data.status === 'Open' ||
                          data.status === 'Sent' ||
                          data.status === 'Signed',
                        'bg-orange-100 text-orange-600':
                          data.status === 'Pending Signature',
                        'bg-green-100 text-green-600':
                          data.status === 'Accepted',
                        'bg-red-100 text-red-600':
                          data.status === 'Declined' ||
                          data.status === 'Expired',
                      }"
                    >
                      {{ data.status }}
                    </div>
                  </div>
                </td>

                <td class="text-center! text-[14px]!">
                  <div class="flex items-center justify-center">
                    <i
                      (click)="onEllipsisClick($event, data, menu)"
                      class="pi pi-ellipsis-h cursor-pointer"
                    ></i>
                  </div>
                </td>
              </tr>
            </ng-template>
            <ng-template #emptymessage>
              <tr>
                <td colspan="100%" class="border-x!">
                  <div class="text-[15px] text-center text-gray-500">
                    No quotation found in records.
                  </div>
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
      [style]="{ transform: 'translate(20px, 8px)' }"
    ></p-menu>

    <div
      class="mb-20 p-10 bg-white hidden"
      id="quotation-print"
      *ngIf="previewData"
    >
      <div class="bg-white p-4">
        <div class="flex justify-between items-start mb-10">
          <div>
            <h2 class="text-2xl font-bold text-blue-900">YL Systems Sdn Bhd</h2>
            <p class="text-xs text-gray-500 uppercase">
              ELV Technology Solution Provider
            </p>
          </div>
          <div class="text-right">
            <h1 class="text-4xl font-light text-gray-300 mb-2">QUOTATION</h1>
            <p class="font-bold text-lg">{{ previewData.quotationNo }}</p>
            <p class="text-sm text-gray-600">
              Date: {{ previewData.quotationDate | date: 'dd MMM yyyy' }}
            </p>
          </div>
        </div>

        <div
          class="flex justify-between mb-10 border-t border-b py-6 border-gray-100"
        >
          <div class="w-1/2">
            <p class="text-xs font-bold text-blue-600 uppercase mb-2">From</p>
            <p class="font-bold text-gray-900">YL Systems Sdn Bhd</p>
            <p class="text-sm text-gray-700">42, Jln 21/19, Sea Park</p>
            <p class="text-sm text-gray-700">46300 Petaling Jaya, Selangor</p>
            <p class="text-sm text-gray-700">
              <strong>Contact:</strong> 03-78773929
            </p>
          </div>

          <div class="text-right w-[30%]">
            <p class="text-xs font-bold text-blue-600 uppercase mb-2">
              Bill To
            </p>
            <p class="font-bold text-gray-900">
              {{ previewData.client?.companyName }}
            </p>
            <p class="text-sm text-gray-700 whitespace-pre-line">
              {{ previewData.client?.address }}
            </p>
            <p class="text-sm text-gray-700">
              <strong>Attn:</strong> {{ previewData.client?.contactPerson }}
            </p>
            <p class="text-sm text-gray-700">
              <strong>Email:</strong> {{ previewData.client?.email }}
            </p>
          </div>
        </div>

        <p-table [value]="previewData?.items" class="w-full" [rowHover]="false">
          <ng-template #header>
            <tr>
              <th class="p-3 uppercase">Description</th>
              <th class="p-3 uppercase text-center w-16">Qty</th>
              <th class="p-3 uppercase text-center w-16">Unit</th>
              <th class="p-3 uppercase text-right w-32">Rate (RM)</th>
              <th class="p-3 uppercase text-right w-32">Amount (RM)</th>
            </tr>
          </ng-template>
          <ng-template #body let-item>
            <tr>
              <td class="p-3 text-sm">{{ item.description }}</td>
              <td class="p-3 text-sm text-center">{{ item.quantity }}</td>
              <td class="p-3 text-sm text-center">{{ item.unit }}</td>
              <td class="p-3 text-sm text-right">
                {{ item.rate | number: '1.2-2' }}
              </td>
              <td class="p-3 text-sm text-right font-semibold">
                {{ item.amount | number: '1.2-2' }}
              </td>
            </tr>
          </ng-template>
        </p-table>

        <div class="grid grid-cols-2 gap-4 mt-8">
          <div class="text-sm text-gray-500 italic">
            <p
              class="font-bold text-gray-400 uppercase not-italic text-xs mb-1"
            >
              Notes
            </p>
            {{ previewData?.description || 'No additional notes provided.' }}
          </div>
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>RM {{ this.subTotal() | number: '1.2-2' }}</span>
            </div>
            <div class="flex justify-between text-sm text-red-500">
              <span>Discount ({{ previewData?.discount }}%)</span>
              <span
                >-RM
                {{
                  (this.subTotal() * previewData?.discount) / 100
                    | number: '1.2-2'
                }}</span
              >
            </div>
            <div
              class="flex justify-between text-xl font-bold border-t-2 pt-3 text-blue-900"
            >
              <span>Total Amount</span>
              <span>RM {{ previewData?.totalAmount | number: '1.2-2' }}</span>
            </div>

            <div
              class="mt-12 text-right flex flex-col items-end"
              *ngIf="previewData?.signatureImageUrl"
            >
              <img
                [src]="previewData?.signatureImageUrl"
                class="max-w-[180px] border-b border-gray-200 mb-2"
              />
              <p class="text-sm font-bold">
                {{ previewData?.signatureName }}
              </p>
              <p class="text-xs text-gray-400 uppercase tracking-tighter">
                Authorized Signature
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <p-dialog
      header="Select Director"
      [(visible)]="displayDirectorDialog"
      [modal]="true"
      [style]="{ width: '30vw' }"
    >
      <div class="flex flex-col gap-4 mt-2">
        <label class="font-medium">Who should sign this quotation?</label>
        <p-select
          [options]="(directors$ | async) || []"
          [(ngModel)]="selectedDirectorId"
          placeholder="Select a Director"
          styleClass="w-full"
          appendTo="body"
          [filter]="true"
        >
        </p-select>
      </div>
      <ng-template pTemplate="footer">
        <p-button
          label="Cancel"
          (click)="displayDirectorDialog = false"
          severity="secondary"
          styleClass="border-gray-200!"
          [text]="true"
        ></p-button>
        <p-button
          label="Submit Request"
          severity="info"
          (click)="confirmSignatureRequest()"
          [disabled]="!selectedDirectorId"
        ></p-button>
      </ng-template>
    </p-dialog> `,
  styleUrl: './quotation.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Quotation implements OnInit, OnDestroy {
  @ViewChild('fTable') fTable?: Table;

  private readonly quotationService = inject(QuotationService);
  private readonly userService = inject(UserService);
  private readonly loadingService = inject(LoadingService);
  private readonly messageService = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  PagingSignal = signal<PagingContent<QuotationDto>>(
    {} as PagingContent<QuotationDto>,
  );
  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  search: string = '';
  selectedDirectorId: string | null = null;
  menuItems: MenuItem[] = [];
  previewData: any;

  subTotal = signal(0);
  taxTotal = signal(0);
  grandTotal = signal(0);

  displayDirectorDialog: boolean = false;
  activeQuotation: any = null;
  directors$!: Observable<any[]>;

  isAdmin: boolean = false;

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 10;
    this.Query.Filter = null;
    this.Query.OrderBy = 'CreatedAt desc';
    this.Query.Select = null;
    this.Query.Includes = 'Client,Items';
  }

  ngOnInit(): void {}

  GetData() {
    this.loadingService.start();

    // 1. Get current user info (this depends on how your UserService is structured)
    const currentUser = this.userService.currentUser; // or this.userService.getUser()
    this.isAdmin = currentUser?.systemRole === 'Admin';
    const userId = currentUser?.userId;

    // 2. Build the role-based filter
    let roleFilter = '';
    if (!this.isAdmin) {
      // If not Admin (e.g., Director), only show assigned ones
      roleFilter = `AssignedToId=${userId}`;
    }

    // 3. Combine with existing filters (like search)
    // Logic: (Existing Filter) AND (Role Filter)
    const originalFilter = this.Query.Filter;
    if (roleFilter) {
      this.Query.Filter = originalFilter
        ? `(${originalFilter}),${roleFilter}`
        : roleFilter;
    }

    this.quotationService
      .GetMany(this.Query)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();
          this.PagingSignal.set(res);
          this.cdr.markForCheck();

          // Restore original filter so search/pagination doesn't stack incorrectly
          this.Query.Filter = originalFilter;
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
      QuotationNo: [
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

  ActionClick(data: QuotationDto | null, action: string) {
    if (action === 'Update') {
      this.router.navigate(['/quotations/form'], {
        queryParams: { id: data?.id },
      });
    } else if (action === 'Download' && data) {
      this.quotationService.downloadPdf(data.id).subscribe({
        next: (blob: Blob) => {
          // Create a local URL for the binary data
          const fileUrl = window.URL.createObjectURL(blob);

          // Option A: Open in new tab
          window.open(fileUrl, '_blank');

          // Option B: Force immediate download with filename
          const link = document.createElement('a');
          link.href = fileUrl;
          link.download = `Quotation_${data.quotationNo}.pdf`;
          link.click();

          // Clean up the memory after a short delay
          setTimeout(() => window.URL.revokeObjectURL(fileUrl), 100);
        },
        error: (err) => console.error('Download failed', err),
      });
    } else if (action === 'Delete' && data) {
      this.loadingService.start();
      this.quotationService
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
              detail: `Quotation ${data.quotationNo} deleted`,
            });
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Delete Failed',
              detail: err.error?.error || 'Something went wrong',
            });
          },
          complete: () => {
            this.loadingService.stop();
          },
        });
    }
  }

  printPreview() {
    const printContents = document.getElementById('quotation-print');
    if (!printContents) return;

    // 1. Add a class to body to trigger print styles
    document.body.classList.add('is-printing');

    // 2. Wait for images (like signature) to be ready, then print
    setTimeout(() => {
      window.print();
      // 3. Remove class to restore UI
      document.body.classList.remove('is-printing');
    }, 100);
  }

  calculateTotals() {
    let sub = 0;
    let tax = 0;

    this.previewData?.items.forEach((item: any) => {
      const qty = item?.quantity || 0;
      const rate = item?.rate || 0;
      const taxRate = item?.taxRate || 0;

      const lineTotal = qty * rate;
      const lineTax = lineTotal * (taxRate / 100);
      const finalLineAmount = lineTotal + lineTax;

      item.amount = finalLineAmount;

      sub += lineTotal;
      tax += lineTax;
    });

    const discountPercent = this.previewData?.discount || 0;

    const discountAmount = sub * (discountPercent / 100);

    this.subTotal.set(sub);
    this.taxTotal.set(tax);
    this.grandTotal.set(sub + tax - discountAmount);

    // ✅ Keep form totalAmount in sync
    this.previewData.totalAmount = this.grandTotal();
  }

  onEllipsisClick(event: any, quotation: QuotationDto, menu: any) {
    this.menuItems = [
      {
        label: 'Edit',
        icon: 'pi pi-pencil',
        visible: this.isAdmin,
        // Disable editing once it's finalized or sent to client
        disabled: ['Sent', 'Accepted', 'Declined', 'Signed'].includes(
          quotation.status,
        ),
        command: () => this.ActionClick(quotation, 'Update'),
      },
      {
        label: 'Request Signature',
        icon: 'pi pi-user-edit',
        visible: quotation.status === 'Draft' || quotation.status === 'Open',
        command: () => this.showDirectorSelectionDialog(quotation),
      },
      {
        label: 'Sign Quotation',
        icon: 'pi pi-check-square',
        visible: !this.isAdmin && quotation.status === 'Pending Signature',
        command: () =>
          this.router.navigate(['/quotations/sign'], {
            queryParams: { id: quotation.id },
          }),
      },
      {
        label: 'Mark as Sent to Client',
        icon: 'pi pi-send',
        // This only appears once the system detects the signature and flips the status
        visible: this.isAdmin && quotation.status === 'Signed',
        command: () => this.updateQuotationStatus(quotation.id, 'Sent'),
      },
      {
        label: 'Accept',
        icon: 'pi pi-check',
        visible: quotation.status === 'Sent',
        command: () => this.updateQuotationStatus(quotation.id, 'Accepted'),
      },
      {
        label: 'Decline',
        icon: 'pi pi-times',
        visible: quotation.status === 'Sent',
        command: () => this.updateQuotationStatus(quotation.id, 'Declined'),
      },
      {
        label: 'Clone to Invoice',
        icon: 'pi pi-receipt',
        visible: quotation.status === 'Signed',
        command: () => this.convert('Invoice', quotation),
      },
      { separator: true },
      {
        label: 'Download PDF',
        icon: 'pi pi-file-pdf',
        command: () => this.ActionClick(quotation, 'Download'),
      },
      {
        label: 'Delete',
        icon: 'pi pi-trash',
        visible:
          this.isAdmin &&
          (quotation.status === 'Open' ||
            quotation.status === 'Draft' ||
            quotation.status === 'Pending Signature'),
        styleClass: 'text-red-500',
        command: () => this.ActionClick(quotation, 'Delete'),
      },
    ];

    menu.toggle(event);
  }

  showDirectorSelectionDialog(quotation: any) {
    console.log(quotation);
    this.activeQuotation = quotation;
    this.selectedDirectorId = null; // Reset
    this.displayDirectorDialog = true;
    this.directors$ = this.userService
      .GetMany({
        Page: 1,
        PageSize: 100,
        OrderBy: 'FirstName desc',
        Select: 'Id,FirstName,LastName,Role',
        Includes: null,
        Filter: 'Role=Director',
      })
      .pipe(
        map((res) =>
          res.data.map((user: any) => ({
            label: `${user.FirstName} ${user.LastName}`, // How it looks in the list
            value: user.Id, // The GUID sent to the DB
          })),
        ),
      );
    this.cdr.detectChanges();
  }

  confirmSignatureRequest() {
    if (!this.activeQuotation) return;

    this.loadingService.start();

    this.quotationService
      .UpdateStatus(
        this.activeQuotation.id,
        'Pending Signature',
        this.selectedDirectorId,
      )
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res: any) => {
          this.loadingService.stop();

          // 1. Update the Signal locally
          const currentPaging = this.PagingSignal();
          const updatedData = currentPaging.data.map((q) => {
            if (q.id === this.activeQuotation.id) {
              // Return a new object with updated status
              return { ...q, status: 'Pending Signature' };
            }
            return q;
          });

          // 2. Set the signal with the new data array
          this.PagingSignal.set({
            ...currentPaging,
            data: updatedData,
          });

          // 3. Clean up UI
          this.displayDirectorDialog = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Status Updated',
            detail: `Quotation is now Pending Signature`,
          });

          // 4. Trigger Change Detection for OnPush strategy
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loadingService.stop();
          this.messageService.add({
            severity: 'error',
            summary: 'Update Failed',
            detail: err.error?.error || 'Invalid status transition.',
          });
        },
      });
  }

  updateQuotationStatus(id: string, newStatus: string) {
    this.loadingService.start();

    // Note: Your backend expects { status: '...' }
    this.quotationService
      .UpdateStatus(id, newStatus)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res: any) => {
          this.loadingService.stop();
          this.PagingSignal.update((state) => ({
            ...state,
            data: state.data.map((item: any) =>
              item.id === id ? { ...item, status: newStatus } : item,
            ),
          }));
          this.cdr.markForCheck();
          this.messageService.add({
            severity: 'success',
            summary: 'Status Updated',
            detail: `Quotation is now ${newStatus}`,
          });
        },
        error: (err) => {
          this.loadingService.stop();
          this.messageService.add({
            severity: 'error',
            summary: 'Update Failed',
            detail: err.error?.error || 'Invalid status transition.',
          });
        },
      });
  }

  convert(type: 'Invoice' | 'PO', data: any) {
    this.loadingService.start();

    const action$: Observable<any> =
      type === 'Invoice'
        ? this.quotationService.ConvertToInvoice(data.id)
        : this.quotationService.ConvertToPO(data.id);

    action$.subscribe({
      next: (res: any) => {
        this.loadingService.stop();
        this.messageService.add({
          severity: 'success',
          summary: 'Converted Successfully',
          detail: `${type} generated: ${res.invoiceNo || res.poNo}`,
        });

        // Optionally redirect to the new document
        // if (type === 'Invoice') this.router.navigate(['/invoices/details', res.invoiceNo]);
      },
      error: () => this.loadingService.stop(),
    });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
