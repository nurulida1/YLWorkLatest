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
    class="min-h-screen bg-slate-50/60 p-4 sm:p-6 lg:p-8 antialiased relative"
  >
    <div class="max-w-[1600px] mx-auto flex flex-col gap-6 pb-28">
      <div
        class="p-6 bg-white w-full border border-slate-200/80 shadow-sm rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div class="flex flex-col gap-1.5">
          <h1 class="text-xl font-bold text-slate-900 tracking-tight">
            Sales Order Verification
          </h1>
          <div class="flex flex-row items-center gap-2.5">
            <span class="font-bold text-slate-400 text-sm tracking-wide">{{
              soData()?.salesOrderNo
            }}</span>
            <i class="pi pi-circle-fill text-slate-300 text-[5px]!"></i>
            <span
              class="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider border"
              [ngClass]="{
                'bg-amber-50 text-amber-700 border-amber-200/70':
                  soData()?.status === 'Draft',
                'bg-emerald-50 text-emerald-700 border-emerald-200/70':
                  soData()?.status === 'Confirmed',
              }"
            >
              {{ soData()?.status }}
            </span>
          </div>
        </div>

        <div
          class="sm:text-right flex flex-col gap-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 min-w-[180px]"
        >
          <span
            class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block"
            >Gross Total Amount</span
          >
          <div class="text-xl font-bold text-indigo-950 tracking-tight">
            {{ soData()?.totalAmount | currency: 'RM ' : 'symbol' : '1.2-2' }}
          </div>
        </div>
      </div>

      <div class="grid grid-cols-12 gap-6 items-start">
        <div
          class="col-span-12 lg:col-span-7 flex flex-col rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden"
        >
          <div
            class="bg-slate-50/70 px-5 py-4 font-bold text-slate-800 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
          >
            <span class="flex items-center gap-2 text-slate-900">
              <i class="pi pi-list text-indigo-500 font-semibold"></i> Line
              Adjustment Items
            </span>
            <span
              class="text-sm font-semibold text-indigo-700 bg-indigo-50/80 border border-indigo-100/80 px-3 py-1 rounded-lg"
            >
              Quote Ref:
              <span
                class="font-bold cursor-pointer hover:underline"
                [routerLink]="'/quotations/details'"
                [queryParams]="{ quoteNo: soData()?.quotation?.quotationNo }"
                >{{
                  soData()?.quotation?.quotationNo || 'Direct Assignment'
                }}</span
              >
            </span>
          </div>

          <div class="p-5 flex flex-col gap-6">
            <div class="grid grid-cols-12 gap-4">
              <div class="col-span-12 sm:col-span-6 flex flex-col gap-1.5">
                <label
                  class="text-[10px] font-bold text-slate-400 uppercase tracking-wider"
                  >PO Number Reference</label
                >
                <div
                  class="border px-3 py-2 rounded-xl text-base text-slate-800 font-bold bg-slate-50/50 border-slate-200/70"
                >
                  {{ soData()?.clientPONumber || 'None Provided' }}
                </div>
              </div>
              <div class="col-span-12 sm:col-span-6 flex flex-col gap-1.5">
                <label
                  class="text-[10px] font-bold text-slate-400 uppercase tracking-wider"
                  >PO Received Date</label
                >
                <div
                  class="border px-3 py-2 rounded-xl text-base text-slate-800 font-semibold bg-slate-50/50 border-slate-200/70"
                >
                  {{
                    soData()?.clientPODate
                      ? (soData()?.clientPODate | date: 'dd MMM yyyy')
                      : '—'
                  }}
                </div>
              </div>
            </div>

            <div class="overflow-hidden rounded-xl border border-slate-200">
              <p-table
                [value]="getSortedSalesOrderItems()"
                [responsiveLayout]="'scroll'"
                [showGridlines]="true"
                styleClass="p-datatable-sm"
              >
                <ng-template #header>
                  <tr
                    class="uppercase bg-slate-50/80 border-b border-slate-200 text-slate-600 tracking-wider font-bold"
                  >
                    <th
                      class="w-[8%] text-center! py-3 pl-3 text-xs! bg-slate-100!"
                    >
                      Item
                    </th>
                    <th class="w-[34%] text-left! py-3 text-xs! bg-slate-100!">
                      Description
                    </th>
                    <th
                      class="w-[11%] text-center! py-3 text-xs! bg-slate-100!"
                    >
                      Qty
                    </th>
                    <th class="w-[12%] text-right! py-3 text-xs! bg-slate-100!">
                      Unit Price
                    </th>
                    <th
                      class="w-[12%] text-center! py-3 text-xs! bg-slate-100!"
                    >
                      Disc (%)
                    </th>
                    <th
                      class="w-[11%] text-center! py-3 text-xs! bg-slate-100!"
                    >
                      Tax (%)
                    </th>
                    <th
                      class="w-[12%] text-right! py-3 pr-4 text-xs! bg-slate-100!"
                    >
                      Total (RM)
                    </th>
                  </tr>
                </ng-template>

                <ng-template pTemplate="body" let-item let-rowIndex="rowIndex">
                  <ng-container
                    *ngIf="item.rowType === 'CategoryHeader'; else noteOrLine"
                  >
                    <tr class="bg-slate-50/40 border-b border-slate-100">
                      <td></td>
                      <td class="p-3">
                        <span
                          class="font-bold text-indigo-950 text-xs tracking-wider uppercase underline"
                        >
                          {{
                            item.description || item.item || 'Untitled Group'
                          }}
                        </span>
                      </td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td></tr
                  ></ng-container>

                  <ng-template #noteOrLine>
                    <ng-container
                      *ngIf="item.rowType === 'NoteRow'; else lineItem"
                    >
                      <tr
                        class="bg-amber-50/30 border-b border-amber-100/50 text-xs"
                      >
                        <td
                          colspan="1"
                          class="p-3 text-slate-600 leading-relaxed text-center!"
                        >
                          {{ item.item }}
                        </td>
                        <td
                          colspan="6"
                          class="p-3 text-slate-600 leading-relaxed text-sm!"
                        >
                          <span
                            [innerHTML]="item.description || 'No note provided'"
                          ></span>
                        </td>
                      </tr>
                    </ng-container>

                    <ng-template #lineItem>
                      <tr
                        class="border-b border-slate-100 hover:bg-slate-50/60 transition-colors text-sm text-slate-700"
                      >
                        <td
                          class="py-3 text-center! font-medium text-slate-400 pl-3"
                        >
                          {{ item.item || '-' }}
                        </td>

                        <td class="py-3 pr-2">
                          <div
                            *ngIf="item.description"
                            [innerHTML]="item.description"
                            class="font-medium text-slate-800 prose prose-sm max-w-none"
                          ></div>
                          <span
                            *ngIf="!item.description"
                            class="text-slate-400 italic text-xs"
                            >No description provided</span
                          >
                        </td>

                        <td class="py-2 text-center">
                          <p-inputNumber
                            [(ngModel)]="item.quantity"
                            (ngModelChange)="calculateTotals()"
                            [min]="0"
                            styleClass="w-20"
                            inputStyleClass="w-full text-center! border border-slate-200 rounded px-1.5 py-1 text-sm! font-semibold text-slate-800 focus:border-indigo-500"
                          ></p-inputNumber>
                        </td>

                        <td class="py-2 text-right">
                          <p-inputNumber
                            [(ngModel)]="item.unitPrice"
                            (ngModelChange)="calculateTotals()"
                            [min]="0"
                            mode="decimal"
                            [minFractionDigits]="2"
                            styleClass="w-24"
                            inputStyleClass="w-full text-right! border border-slate-200 rounded px-1.5 py-1 text-sm! font-medium text-slate-800 focus:border-indigo-500"
                          ></p-inputNumber>
                        </td>

                        <td class="py-2 text-center">
                          <p-inputNumber
                            [(ngModel)]="item.discount"
                            (ngModelChange)="calculateTotals()"
                            [min]="0"
                            mode="decimal"
                            [minFractionDigits]="2"
                            styleClass="w-20"
                            inputStyleClass="w-full text-center! border border-slate-200 rounded px-1.5 py-1 text-sm! text-slate-700 focus:border-indigo-500"
                          ></p-inputNumber>
                        </td>

                        <td class="py-2 text-center">
                          <p-inputNumber
                            [(ngModel)]="item.taxRate"
                            (ngModelChange)="calculateTotals()"
                            [min]="0"
                            [max]="100"
                            mode="decimal"
                            [minFractionDigits]="2"
                            styleClass="w-20"
                            inputStyleClass="w-full text-center! border border-slate-200 rounded px-1.5 py-1 text-sm! text-slate-700 focus:border-indigo-500"
                          ></p-inputNumber>
                        </td>

                        <td
                          class="py-3 text-right! pr-4 font-bold text-slate-900"
                        >
                          {{ item.totalPrice | number: '1.2' }}
                        </td>
                      </tr>
                    </ng-template>
                  </ng-template>
                </ng-template>

                <ng-template #emptymessage>
                  <tr>
                    <td
                      colspan="7"
                      class="text-center text-slate-400 py-14 bg-slate-50/30"
                    >
                      <div class="flex flex-col items-center gap-2.5">
                        <i class="pi pi-inbox text-3xl text-slate-300"></i>
                        <div class="font-bold text-slate-700 text-sm">
                          No line items mapped
                        </div>
                        <div class="text-xs text-slate-400">
                          This document holds no validated structural lines.
                        </div>
                      </div>
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            </div>

            <div
              class="border-t border-slate-100 pt-5 flex flex-col items-end gap-3 text-sm"
            >
              <div
                class="grid grid-cols-12 gap-5 w-full font-semibold tracking-wide items-center"
              >
                <div class="col-span-9 text-right text-gray-500 uppercase">
                  SubTotal :
                </div>
                <span class="col-span-3 font-bold text-slate-800 text-right"
                  >RM {{ subTotal | number: '1.2-2' }}</span
                >
                <div class="col-span-9 text-right text-red-600 uppercase">
                  - Discount (RM) :
                </div>
                <span class="col-span-3 font-bold text-slate-800 text-right">
                  <p-inputNumber
                    [(ngModel)]="discount"
                    (ngModelChange)="calculateTotals()"
                    [min]="0"
                    mode="decimal"
                    [minFractionDigits]="2"
                    currency="MYR"
                    locale="ms-MY"
                    styleClass="w-32"
                    inputStyleClass="w-full text-right text-sm! border border-rose-200 bg-white rounded-lg px-2.5! py-1! font-bold text-red-600! focus:ring-1 focus:ring-rose-400 outline-none shadow-2xs"
                  ></p-inputNumber
                ></span>
                <div class="col-span-9 text-right text-slate-600 uppercase">
                  Tax Amount (RM) :
                </div>
                <span class="col-span-3 font-bold text-slate-800 text-right">
                  <p-inputNumber
                    [(ngModel)]="taxAmount"
                    (ngModelChange)="calculateTotals()"
                    [min]="0"
                    mode="decimal"
                    [minFractionDigits]="2"
                    currency="MYR"
                    locale="ms-MY"
                    styleClass="w-32"
                    inputStyleClass="w-full text-right text-sm! border border-rose-200 bg-white rounded-lg px-2.5! py-1! font-bold focus:ring-1 focus:ring-rose-400 outline-none shadow-2xs"
                  ></p-inputNumber
                ></span>
                <div></div>
              </div>

              <div
                class="flex justify-between items-center w-[320px] text-sm font-bold text-slate-900 border-t-2 border-dashed border-slate-200 pt-4 px-1"
              >
                <span class="uppercase text-xs tracking-wider text-slate-400"
                  >Total Amount:</span
                >
                <span
                  class="text-xl text-indigo-600 font-extrabold tracking-tight"
                >
                  RM {{ totalAmount | number: '1.2-2' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div
          class="col-span-12 lg:col-span-5 flex flex-col rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm lg:sticky lg:top-6"
        >
          <div
            class="text-base bg-slate-50/70 px-4 py-3.5 font-bold text-slate-800 border-b border-slate-100 flex justify-between items-center"
          >
            <span class="flex items-center gap-2 text-slate-900 tracking-tight">
              <i class="pi pi-file-pdf text-red-500 font-semibold"></i> Client
              PO Document
            </span>
            <a
              *ngIf="attachmentUrl"
              [href]="attachmentUrl"
              target="_blank"
              class="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-white border border-slate-200 shadow-2xs px-2.5 py-1 rounded-lg transition-all"
            >
              <i class="pi pi-external-link text-[10px]!"></i> Pop Out
            </a>
          </div>

          <div
            class="bg-slate-100 p-3 flex justify-center items-center min-h-[520px] h-[calc(100vh-340px)]"
          >
            <ng-container *ngIf="soData()?.clientPOAttachment; else noFile">
              <object
                *ngIf="attachmentUrl"
                [data]="attachmentUrl"
                type="application/pdf"
                class="w-full h-full rounded-xl border border-slate-200 shadow-sm bg-white"
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
                class="text-center p-6 flex flex-col items-center gap-3 text-slate-400"
              >
                <div
                  class="p-4 bg-white shadow-xs border border-slate-200 rounded-2xl text-slate-300"
                >
                  <i class="pi pi-file-pdf text-4xl"></i>
                </div>
                <div class="flex flex-col gap-1 max-w-[260px]">
                  <span class="text-sm font-bold text-slate-700"
                    >No Document File Attached</span
                  >
                  <p class="text-xs text-slate-400 leading-relaxed">
                    This execution context references no verifiable physical
                    purchase order image upload.
                  </p>
                </div>
              </div>
            </ng-template>
          </div>
        </div>
      </div>

      <div
        class="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200/80 px-6 py-4 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] flex flex-col sm:flex-row items-center justify-between gap-4 z-50"
      >
        <div class="flex items-center gap-3 w-full sm:w-1/2 max-w-xl">
          <div class="w-full">
            <textarea
              rows="1"
              [(ngModel)]="remarks"
              [ngModelOptions]="{ standalone: true }"
              pTextarea
              [autoResize]="true"
              placeholder="Type verification notes or structural adjustment reasons..."
              class="w-full text-sm py-2.5 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none rounded-xl px-3.5 min-h-[42px] max-h-[120px] transition-all bg-slate-50/50 text-slate-700 placeholder-slate-400"
            ></textarea>
          </div>
        </div>

        <div
          class="flex flex-row items-center gap-3 w-full sm:w-auto justify-end"
        >
          <p-button
            label="Cancel"
            [routerLink]="'/sales-order'"
            severity="secondary"
            styleClass="px-4 py-2 border border-slate-200! text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 rounded-xl h-10 transition-colors"
          ></p-button>

          <button
            pButton
            type="button"
            label="Reject Document"
            icon="pi pi-times-circle"
            class="p-button-outlined p-button-danger text-xs font-bold h-10 px-4 rounded-xl border border-red-200 bg-white hover:bg-red-50/60 text-red-600 transition-colors"
            (click)="updateStatus('Rejected')"
          ></button>

          <button
            pButton
            type="button"
            label="Approve & Confirm Order"
            icon="pi pi-check-circle"
            class="p-button-success text-xs font-bold h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm border-0 transition-colors"
            (click)="updateStatus('Confirmed')"
          ></button>
        </div>
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

    this.subTotal = data.subTotal;
    this.discount = data.discount;
    this.totalAmount =
      data.subTotal - (data.discount || 0) + (data.taxAmount || 0);

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
    // for (let i = 0; i <= rowIndex; i++) {
    //   const item = items[i];
    //   if (item && item.type !== 'Category' && !item.isGroup) {
    //     itemCount++;
    //   }
    // }

    return itemCount;
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
