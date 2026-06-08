import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { SalesOrderService } from '../../../services/SalesOrderService';
import { LoadingService } from '../../../services/loading.service';
import { MessageService } from 'primeng/api';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subject, takeUntil } from 'rxjs';
import { SalesOrderDto } from '../../../models/SalesOrder';

@Component({
  selector: 'app-sales-order-review',
  imports: [
    CommonModule,
    ButtonModule,
    InputTextModule,
    FormsModule,
    TextareaModule,
    RouterLink,
    TableModule,
    InputNumberModule,
  ],
  template: `<div
    class="relative w-full flex flex-col gap-4 p-5 pb-24 min-h-[93.9vh] bg-slate-50/50"
  >
    <div
      class="flex flex-row items-center gap-1.5 text-sm text-gray-500 tracking-wide"
    >
      <div
        [routerLink]="'/dashboard'"
        class="cursor-pointer hover:text-indigo-600 transition-colors"
      >
        Dashboard
      </div>
      <span class="text-gray-300">/</span>
      <div
        [routerLink]="'/sales-order'"
        class="cursor-pointer hover:text-indigo-600 transition-colors"
      >
        Sales Order
      </div>
      <span class="text-gray-300">/</span>
      <div class="text-gray-800 font-semibold">
        {{ soData()?.salesOrderNo }}
      </div>
    </div>

    <div
      class="p-4 bg-white w-full border border-gray-200 shadow-xs rounded-xl flex flex-row justify-between items-center"
    >
      <div class="flex flex-col gap-1">
        <h1 class="text-xl font-bold text-gray-900">
          Sales Order Verification
        </h1>
        <div class="flex flex-row items-center gap-2">
          <span class="font-mono font-semibold text-gray-500">{{
            soData()?.salesOrderNo
          }}</span>
          <i class="pi pi-circle-fill text-gray-300 text-[6px]!"></i>
          <span
            class="px-4 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider"
            [ngClass]="{
              'bg-amber-100 text-amber-700 border border-amber-200':
                soData()?.status === 'Draft',
              'bg-emerald-100 text-emerald-700 border border-emerald-200':
                soData()?.status === 'Confirmed',
            }"
          >
            {{ soData()?.status }}
          </span>
        </div>
      </div>

      <div class="text-right flex flex-col gap-0.5">
        <span
          class="text-[10px] text-gray-400 font-bold uppercase tracking-wider"
          >Total Amount</span
        >
        <div class="text-xl font-mono font-bold text-indigo-900">
          {{ soData()?.totalAmount | currency: 'RM  ' : 'symbol' : '1.2-2' }}
        </div>
      </div>
    </div>

    <div class="grid grid-cols-12 gap-5 items-start">
      <div
        class="col-span-12 lg:col-span-6 flex flex-col shadow-2xs rounded-xl border border-gray-200 bg-white overflow-hidden"
      >
        <div
          class="bg-gray-50 px-4 py-3 font-bold text-gray-700 border-b border-gray-200 flex justify-between items-center"
        >
          <span class="flex items-center gap-1.5">
            <i class="pi pi-list text-indigo-500"></i> Sales Order Items
          </span>
          <span
            class="text-sm font-mono font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-lg"
          >
            Quote Ref:
            {{ soData()?.quotation?.quotationNo || 'Direct Assignment' }}
          </span>
        </div>

        <div class="p-4 flex flex-col gap-4">
          <div class="grid grid-cols-12 gap-3">
            <div class="col-span-6 flex flex-col gap-1.5">
              <label
                class="text-sm font-bold text-gray-400 uppercase tracking-wider"
                >PO Number Reference</label
              >
              <div
                class="border px-3 py-2 rounded-lg text-lg text-gray-700 font-mono font-semibold bg-gray-50 border-gray-200/80"
              >
                {{ soData()?.clientPONumber || 'None Provided' }}
              </div>
            </div>
            <div class="col-span-6 flex flex-col gap-1.5">
              <label
                class="text-sm font-bold text-gray-400 uppercase tracking-wider"
                >PO Received Date</label
              >
              <div
                class="border px-3 py-2 rounded-lg text-base text-gray-700 font-semibold bg-gray-50 border-gray-200/80"
              >
                {{
                  soData()?.clientPODate
                    ? (soData()?.clientPODate | date: 'dd/MM/yyyy')
                    : '—'
                }}
              </div>
            </div>
          </div>

          <div class="w-full mt-2">
            <p-table
              styleClass="p-datatable-gridlines"
              [value]="getSortedSalesOrderItems()"
              [responsiveLayout]="'scroll'"
              [showGridlines]="true"
            >
              <ng-template #header>
                <tr
                  class="text-xs uppercase bg-gradient-to-r from-slate-100 to-slate-50 text-gray-700 tracking-wider"
                >
                  <th
                    class="w-24 text-center! p-3 font-bold bg-slate-100! border-r-2 border-slate-200"
                  >
                    Item
                  </th>
                  <th
                    class="text-left! p-3 font-bold bg-slate-100! border-r-2 border-slate-200"
                  >
                    Description
                  </th>
                  <th
                    class="w-20 text-center! p-3 bg-slate-100! font-bold border-r-2 border-slate-200"
                  >
                    Qty
                  </th>
                  <th
                    class="w-28 text-right! p-3 bg-slate-100! font-bold border-r-2 border-slate-200"
                  >
                    Unit Price
                  </th>
                  <th
                    class="w-24 text-right! p-3 bg-slate-100! font-bold border-r-2 border-slate-200"
                  >
                    Disc (%)
                  </th>
                  <th
                    class="w-20 text-center! p-3 bg-slate-100! font-bold border-r-2 border-slate-200"
                  >
                    Tax (%)
                  </th>
                  <th
                    class="w-28 text-right! p-3 bg-slate-100! font-bold bg-gray-50 sticky right-0!"
                  >
                    Total (RM)
                  </th>
                </tr>
              </ng-template>

              <ng-template #body let-item let-rowIndex="rowIndex">
                <ng-container
                  *ngIf="
                    item.type === 'Category' || item.isGroup;
                    else normalRow
                  "
                >
                  <tr>
                    <td class="text-center p-3" colspan="100%">
                      <div class="flex items-center gap-3">
                        <span class="font-bold text-gray-900 text-base">
                          {{
                            item.description || item.item || 'Untitled Group'
                          }}
                        </span>
                      </div>
                    </td>
                  </tr>
                </ng-container>

                <ng-template #normalRow>
                  <tr
                    class="border-b border-gray-100 hover:bg-blue-50/30 transition-colors text-sm"
                  >
                    <td class="p-2.5 text-center!">
                      {{ item.item || '-' }}
                    </td>

                    <td class="p-2.5">
                      <div
                        *ngIf="item.description"
                        [innerHTML]="item.description"
                        class="text-gray-700 text-sm leading-relaxed prose prose-sm max-w-none"
                      ></div>
                      <div
                        *ngIf="!item.description"
                        class="text-gray-400 text-sm italic"
                      >
                        No description provided
                      </div>
                    </td>

                    <td class="p-1.5 text-center">
                      <p-inputNumber
                        [(ngModel)]="item.quantity"
                        (ngModelChange)="calculateTotals()"
                        [min]="0"
                        [showButtons]="false"
                        styleClass="w-[5rem]!"
                        inputStyleClass="w-full! text-sm! text-center! border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none rounded-lg p-2 font-bold font-mono text-slate-900 transition-all duration-200"
                      ></p-inputNumber>
                    </td>

                    <td class="p-1.5 text-right">
                      <p-inputNumber
                        [(ngModel)]="item.unitPrice"
                        (ngModelChange)="calculateTotals()"
                        [min]="0"
                        mode="decimal"
                        [minFractionDigits]="2"
                        [maxFractionDigits]="2"
                        styleClass="w-[5rem]!"
                        inputStyleClass="w-full text-sm! text-right! border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none rounded-lg p-2 font-bold font-mono text-slate-900 transition-all duration-200"
                      ></p-inputNumber>
                    </td>

                    <td class="p-1.5 text-right!">
                      <p-inputNumber
                        [(ngModel)]="item.discount"
                        (ngModelChange)="calculateTotals()"
                        [min]="0"
                        mode="decimal"
                        [minFractionDigits]="2"
                        [maxFractionDigits]="2"
                        placeholder="0.00"
                        styleClass="w-[5rem]!"
                        inputStyleClass="w-full text-sm! text-right! border-2 border-rose-200 bg-rose-50/30 text-rose-600 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none rounded-lg p-2 font-bold font-mono transition-all duration-200"
                      ></p-inputNumber>
                    </td>

                    <td class="p-1.5 text-center!">
                      <p-inputNumber
                        [(ngModel)]="item.taxRate"
                        (ngModelChange)="calculateTotals()"
                        [min]="0"
                        [max]="100"
                        styleClass="w-[5rem]!"
                        [minFractionDigits]="2"
                        [maxFractionDigits]="2"
                        mode="decimal"
                        inputStyleClass="w-full text-center! text-sm! border-2 border-amber-200 bg-amber-50/30 text-amber-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none rounded-lg p-2 font-bold font-mono transition-all duration-200"
                      ></p-inputNumber>
                    </td>

                    <td
                      class="text-right! font-bold p-2.5 text-slate-900 font-mono text-base bg-gray-50 sticky right-0!"
                    >
                      {{ item.totalPrice | number: '1.2' }}
                    </td>
                  </tr>
                </ng-template>
              </ng-template>

              <ng-template #emptymessage>
                <tr>
                  <td
                    colspan="8"
                    class="text-center text-gray-400 py-12 bg-slate-50/50"
                  >
                    <div class="flex flex-col items-center gap-3">
                      <div
                        class="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center"
                      >
                        <i class="pi pi-inbox text-3xl text-slate-300"></i>
                      </div>
                      <div class="font-semibold text-slate-600">
                        No line items found
                      </div>
                      <div class="text-sm text-slate-400">
                        This sales order doesn't have any items yet
                      </div>
                    </div>
                  </td>
                </tr>
              </ng-template>
            </p-table>
          </div>

          <div
            class="mt-2 border-t border-gray-200 pt-4 flex flex-col items-end gap-2.5 text-sm"
          >
            <div
              class="flex justify-between items-center w-[300px] text-gray-500"
            >
              <span class="font-medium">SubTotal:</span>
              <span class="font-mono text-base font-bold text-gray-700">
                RM {{ subTotal | number: '1.2-2' }}
              </span>
            </div>

            <div
              class="flex justify-between items-center w-[300px] text-gray-600"
            >
              <span class="font-bold flex items-center gap-1">
                <i class="pi pi-minus-circle text-[10px]!"></i> Discount (RM):
              </span>
              <p-inputNumber
                [(ngModel)]="discount"
                (ngModelChange)="calculateTotals()"
                [min]="0"
                mode="decimal"
                [minFractionDigits]="2"
                [maxFractionDigits]="2"
                placeholder="0.00"
                styleClass="w-32"
                inputStyleClass="w-full text-right text-base border border-rose-200 bg-rose-50/40 rounded px-2.5 py-1 font-mono font-bold text-rose-600 focus:border-rose-400 focus:ring-1 focus:ring-rose-400 outline-none"
              ></p-inputNumber>
            </div>

            <div
              class="flex justify-between items-center w-[300px] text-gray-600"
            >
              <span class="font-bold flex items-center gap-1 text-amber-600">
                <i class="pi pi-plus-circle text-[10px]!"></i> Tax Amount (RM):
              </span>
              <p-inputNumber
                [(ngModel)]="taxAmount"
                (ngModelChange)="calculateTotals()"
                [min]="0"
                mode="decimal"
                [minFractionDigits]="2"
                [maxFractionDigits]="2"
                placeholder="0.00"
                styleClass="w-32"
                inputStyleClass="w-full text-right text-base border border-orange-200 bg-amber-50/40 rounded px-2.5 py-1 font-mono font-bold text-amber-600 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none"
              ></p-inputNumber>
            </div>

            <div
              class="flex justify-between items-center w-[300px] text-sm font-bold text-gray-800 border-t border-gray-200 pt-3 mt-1"
            >
              <span>Total Amount:</span>
              <span class="font-mono text-lg text-indigo-600">
                RM {{ totalAmount | number: '1.2-2' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        class="col-span-12 lg:col-span-6 flex flex-col shadow-2xs rounded-xl overflow-hidden border border-gray-200 bg-white"
      >
        <div
          class="text-sm bg-gray-50 px-4 py-3 font-bold text-gray-700 border-b border-gray-200 flex justify-between items-center"
        >
          <span class="flex items-center gap-1.5">
            <i class="pi pi-file-pdf text-indigo-500"></i> Client PO Document
          </span>
          <a
            *ngIf="attachmentUrl"
            [href]="attachmentUrl"
            target="_blank"
            class="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-md transition-colors"
          >
            <i class="pi pi-external-link text-[10px]"></i> Open New Tab
          </a>
        </div>

        <div
          class="bg-slate-100 p-3 flex justify-center items-center min-h-[520px] h-[calc(100vh-320px)]"
        >
          <ng-container *ngIf="soData()?.clientPOAttachment; else noFile">
            <object
              *ngIf="attachmentUrl"
              [data]="attachmentUrl"
              type="application/pdf"
              class="w-full h-full rounded-xl border border-gray-200 shadow-xs bg-white"
            >
              <iframe
                *ngIf="attachmentUrl"
                [src]="attachmentUrl"
                class="w-full h-full border-none rounded-xl"
              ></iframe>
            </object>
          </ng-container>

          <ng-template #noFile>
            <div
              class="text-center p-6 flex flex-col items-center gap-2.5 text-gray-400"
            >
              <div
                class="p-4 bg-white shadow-xs border border-gray-200 rounded-2xl text-gray-300"
              >
                <i class="pi pi-file-pdf text-4xl"></i>
              </div>
              <div class="flex flex-col gap-0.5 max-w-xs">
                <span class="text-sm font-semibold text-gray-700"
                  >No Document File Attached</span
                >
                <p class="text-xs text-gray-400 leading-relaxed">
                  This contract does not reference an uploaded purchase order
                  artifact for live data review validation.
                </p>
              </div>
            </div>
          </ng-template>
        </div>
      </div>
    </div>

    <div
      class="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3.5 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] flex flex-row items-center justify-between z-50"
    >
      <div class="flex items-center gap-3 w-1/2 max-w-xl">
        <div class="w-full">
          <textarea
            rows="1"
            [(ngModel)]="remarks"
            [ngModelOptions]="{ standalone: true }"
            pInputTextarea
            [autoResize]="true"
            placeholder="Add internal remarks or reason for rejection"
            class="w-full text-sm py-2 border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none rounded-lg px-3 min-h-[38px] transition-all bg-slate-50/50"
          ></textarea>
        </div>
      </div>

      <div class="flex flex-row items-center gap-2.5">
        <p-button
          label="Cancel"
          [routerLink]="'/sales-order'"
          severity="secondary"
          styleClass="px-4 py-2 border-gray-200! text-xs font-bold text-gray-600 bg-white hover:bg-gray-50 rounded-lg h-10 transition-colors"
        ></p-button>

        <button
          pButton
          type="button"
          label="Reject PO Document"
          icon="pi pi-times-circle"
          class="p-button-outlined p-button-danger text-xs font-bold h-10 px-4 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-600 transition-colors"
          (click)="updateStatus('Rejected')"
        ></button>

        <button
          pButton
          type="button"
          label="Approve & Confirm Order"
          icon="pi pi-check-circle"
          class="p-button-success text-xs font-bold h-10 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
          (click)="updateStatus('Confirmed')"
        ></button>
      </div>
    </div>
  </div>`,
  styleUrl: './sales-order-review.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesOrderReview {
  private readonly salesOrderService = inject(SalesOrderService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly loadingService = inject(LoadingService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private sanitizer = inject(DomSanitizer);

  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  soData = signal<SalesOrderDto | null>({} as SalesOrderDto);

  currentId: string | null = null;
  remarks: string | null = null;
  attachmentUrl: SafeResourceUrl | null = null;

  discount: number = 0;
  taxAmount: number = 0;
  subTotal: number = 0;
  totalAmount: number = 0;

  constructor() {
    this.currentId = this.activatedRoute.snapshot.queryParams['id'];
  }

  ngOnInit(): void {
    this.GetData();
  }

  GetData() {
    this.loadingService.start();
    this.salesOrderService
      .GetOne({
        Page: 1,
        PageSize: 1,
        OrderBy: null,
        Includes: 'Client, SalesOrderItems, Quotation',
        Filter: `Id=${this.currentId}`,
        Select: null,
      })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();
          this.soData.set(res);

          if (res) {
            this.discount = res.discount || 0;
            this.taxAmount = res.taxAmount || 0;
            this.calculateTotals();
          }

          if (res?.clientPOAttachment) {
            const fullUrl = `https://localhost:5000/${res.clientPOAttachment}`;
            this.attachmentUrl =
              this.sanitizer.bypassSecurityTrustResourceUrl(fullUrl);
          }

          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loadingService.stop();
        },
      });
  }

  calculateTotals() {
    const data = this.soData();
    if (!data || !data.salesOrderItems) return;

    let calculatedSubTotal = 0;

    data.salesOrderItems.forEach((item) => {
      if (!item.isGroup) {
        const qty = item.quantity || 0;
        const price = item.unitPrice || 0;
        const discountPct = item.discount || 0;
        const taxRate = item.taxRate || 0;

        const grossAmount = qty * price;

        const lineDiscAmount = grossAmount * (discountPct / 100);

        const baseRowTotal = grossAmount - lineDiscAmount;
        const rowTaxAmount = baseRowTotal * (taxRate / 100);

        item.totalPrice = baseRowTotal + rowTaxAmount;
        calculatedSubTotal += item.totalPrice;
      }
    });

    this.subTotal = calculatedSubTotal;
    this.totalAmount =
      this.subTotal - (this.discount || 0) + (this.taxAmount || 0);

    this.soData.set({
      ...data,
      salesOrderItems: data.salesOrderItems,
    });

    this.cdr.markForCheck();
  }

  getAttachmentUrl(path: string | undefined | null): SafeResourceUrl {
    if (!path) return '';

    const fullUrl = `https://localhost:5000/${path}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(fullUrl);
  }

  updateStatus(newStatus: string) {
    if (!this.currentId) return;

    if (newStatus === 'Rejected' && !this.remarks) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Please enter rejection reason',
      });
      return;
    }

    this.loadingService.start();

    const payload = {
      id: this.currentId,
      remarks: this.remarks,
      discount: this.discount,
      taxAmount: this.taxAmount,
      subTotal: this.subTotal,
      totalAmount: this.totalAmount,
      items: this.soData()?.salesOrderItems,
    };

    const api =
      newStatus === 'Rejected'
        ? this.salesOrderService.Reject(payload)
        : this.salesOrderService.Approve(payload);

    api.pipe(takeUntil(this.ngUnsubscribe)).subscribe({
      next: () => {
        this.loadingService.stop();
        this.messageService.add({
          severity: 'success',
          summary: newStatus === 'Rejected' ? 'Rejected' : 'Approved',
          detail:
            newStatus === 'Rejected'
              ? 'Sales Order has been rejected successfully.'
              : 'Sales Order has been approved and confirmed.',
        });

        this.router.navigate(['/sales-order']);
      },
      error: (err) => {
        this.loadingService.stop();
        this.messageService.add({
          severity: 'error',
          summary: 'Action Failed',
          detail:
            err?.error?.error ||
            'Something went wrong while updating the Sales Order.',
        });
      },
    });
  }

  getSortedSalesOrderItems() {
    const items = this.soData()?.salesOrderItems;

    if (!items || items.length === 0) {
      return [];
    }

    const sortedItems = [...items];

    sortedItems.sort((a, b) => {
      const orderA = a.sortOrder ?? 999999;
      const orderB = b.sortOrder ?? 999999;

      return orderA - orderB;
    });

    return sortedItems;
  }

  getItemNumber(rowIndex: number): number {
    const items = this.getSortedSalesOrderItems();

    let itemCount = 0;
    for (let i = 0; i <= rowIndex; i++) {
      const item = items[i];
      if (item && item.type !== 'Category' && !item.isGroup) {
        itemCount++;
      }
    }

    return itemCount;
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
