import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SalesOrderService } from '../../../services/SalesOrderService';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LoadingService } from '../../../services/loading.service';
import { Subject, takeUntil } from 'rxjs';
import { SalesOrderDto } from '../../../models/SalesOrder';
import { TableModule } from 'primeng/table';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-sales-order-details',
  imports: [
    CommonModule,
    ButtonModule,
    InputTextModule,
    FormsModule,
    TextareaModule,
    RouterLink,
    TableModule,
  ],
  template: `<div
    class="relative w-full flex flex-col gap-3 p-5 pb-24 min-h-[93.9vh]"
  >
    <div
      class="flex flex-row items-center gap-1 text-gray-500 tracking-wide text-sm"
    >
      <div
        [routerLink]="'/dashboard'"
        class="cursor-pointer hover:text-gray-600"
      >
        Dashboard
      </div>
      /
      <div
        [routerLink]="'/purchase-orders'"
        class="cursor-pointer hover:text-gray-600"
      >
        Purchase Orders
      </div>
      /
      <div class="text-gray-700 font-semibold">
        {{ soData()?.salesOrderNo }}
      </div>
    </div>

    <div
      class="p-4 bg-white w-full border border-gray-200 shadow-sm rounded flex flex-row justify-between items-center"
    >
      <div class="flex flex-col gap-1">
        <b class="text-xl text-gray-800">Sales Order Verification</b>
        <div class="flex flex-row items-center gap-2 text-sm">
          <div class="font-semibold text-gray-600">
            {{ soData()?.salesOrderNo }}
          </div>
          <i class="pi pi-circle-fill text-gray-300 text-[4px]!"></i>
          <span
            class="px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider"
            [ngClass]="{
              'bg-amber-100 text-amber-800 border border-amber-200':
                soData()?.status === 'Draft',
              'bg-green-100 text-green-800 border border-green-200':
                soData()?.status === 'Confirmed',
            }"
          >
            {{ soData()?.status }}
          </span>
        </div>
      </div>
      <div class="text-right flex flex-col gap-1">
        <div class="text-xs text-gray-500 font-medium uppercase tracking-wider">
          Total Amount
        </div>
        <div class="text-xl font-bold text-gray-900">
          {{ soData()?.totalAmount | currency: 'MYR' : 'symbol' : '1.2-2' }}
        </div>
      </div>
    </div>

    <div class="grid grid-cols-12 gap-4 items-start">
      <div
        class="col-span-12 lg:col-span-6 flex flex-col shadow-sm rounded overflow-hidden border border-gray-200 bg-white"
      >
        <div
          class="text-base bg-gray-50 px-4 py-3 font-semibold text-gray-700 border-b border-gray-200 flex justify-between items-center"
        >
          <span>Sales Order Items</span>
          <span
            class="text-sm font-semibold text-gray-500 bg-gray-200 px-2 py-0.5 rounded"
          >
            Quotation: {{ soData()?.quotation?.quotationNo }}
          </span>
        </div>

        <div class="p-4 grid grid-cols-12 gap-4">
          <div class="col-span-6 flex flex-col gap-1.5">
            <label
              class="text-sm font-semibold text-gray-600 uppercase tracking-wide"
              >PO Number Reference</label
            >
            <div
              class="border p-2 rounded w-full text-gray-700 font-medium bg-gray-50 border-gray-200"
            >
              {{ soData()?.clientPONumber || 'N/A' }}
            </div>
          </div>
          <div class="col-span-6 flex flex-col gap-1.5">
            <label
              class="text-sm font-semibold text-gray-600 uppercase tracking-wide"
              >PO Date</label
            >
            <div
              class="border p-2 rounded w-full text-gray-700 font-medium bg-gray-50 border-gray-200"
            >
              {{ soData()?.clientPODate | date: 'dd/MM/yyyy' }}
            </div>
          </div>

          <div class="col-span-12 mt-2">
            <p-table
              styleClass="p-datatable-sm"
              [value]="soData()?.salesOrderItems || []"
              [responsive]="true"
              [showGridlines]="true"
            >
              <ng-template #header>
                <tr class="text-sm uppercase border-b border-gray-200">
                  <th
                    class="w-12 text-center! text-gray-600 font-bold p-2 bg-gray-100!"
                  >
                    No
                  </th>
                  <th
                    class="text-left! text-gray-600 font-bold p-2 bg-gray-100!"
                  >
                    Item Description
                  </th>
                  <th
                    class="w-20 text-center! text-gray-600 font-bold p-2 bg-gray-100!"
                  >
                    Qty
                  </th>
                  <th
                    class="w-28 text-right! text-gray-600 font-bold p-2 bg-gray-100!"
                  >
                    Unit Price (RM)
                  </th>
                  <th
                    class="w-28 text-right! text-gray-600 font-bold p-2 bg-gray-100!"
                  >
                    Total (RM)
                  </th>
                </tr>
              </ng-template>
              <ng-template #body let-item let-rowIndex="rowIndex">
                <ng-container *ngIf="item.isGroup; else normalRow">
                  <tr class="bg-gray-100 font-semibold text-gray-800 border-b">
                    <td class="text-center p-2">
                      {{ rowIndex + 1 }}
                    </td>

                    <td colspan="4" class="p-2">
                      📦 {{ item.description || item.item }}
                    </td>
                  </tr>
                </ng-container>

                <ng-template #normalRow>
                  <tr class="border-b border-gray-100 hover:bg-gray-50 text-sm">
                    <td class="text-center text-gray-500 p-2">
                      {{ rowIndex + 1 }}
                    </td>

                    <td class="p-2">
                      <div class="font-medium text-gray-800">
                        {{ item.item }}
                      </div>

                      <div
                        *ngIf="item.description"
                        [innerHTML]="item.description"
                        class="text-gray-500 text-xs mt-1"
                      ></div>
                    </td>

                    <td class="text-center font-medium p-2">
                      {{ item.quantity }}
                      <span class="text-gray-400">{{ item.unit }}</span>
                    </td>

                    <td class="text-right p-2">
                      {{ item.unitPrice | currency: ' ' : 'symbol' : '1.2-2' }}
                    </td>

                    <td class="text-right font-semibold p-2">
                      {{ item.totalPrice | currency: ' ' : 'symbol' : '1.2-2' }}
                    </td>
                  </tr>
                </ng-template>
              </ng-template>
              <ng-template #emptymessage>
                <tr>
                  <td
                    colspan="5"
                    class="text-center text-gray-400 py-6 text-sm"
                  >
                    No line items found for this sales order.
                  </td>
                </tr>
              </ng-template>
            </p-table>
          </div>
        </div>
      </div>

      <div
        class="col-span-12 lg:col-span-6 flex flex-col shadow-sm rounded overflow-hidden border border-gray-200 bg-white"
      >
        <div
          class="text-base bg-gray-50 px-4 py-3 font-semibold text-gray-700 border-b border-gray-200 flex justify-between items-center"
        >
          <span>Client PO Document</span>
          <a
            *ngIf="attachmentUrl"
            [href]="attachmentUrl"
            target="_blank"
            class="text-sm text-blue-600 hover:underline flex items-center gap-1"
          >
            <i class="pi pi-external-link text-[10px]"></i> Open in New Tab
          </a>
        </div>
        <div
          class="bg-gray-100 p-2 flex justify-center items-center min-h-[500px] h-[calc(100vh-340px)]"
        >
          <ng-container *ngIf="soData()?.clientPOAttachment; else noFile">
            <object
              *ngIf="attachmentUrl"
              [data]="attachmentUrl"
              type="application/pdf"
              class="w-full h-full rounded border border-gray-300 shadow-inner"
            >
              <iframe
                *ngIf="attachmentUrl"
                [src]="attachmentUrl"
                class="w-full h-full border-none"
              ></iframe>
            </object>
          </ng-container>
          <ng-template #noFile>
            <div
              class="text-center p-6 flex flex-col items-center gap-2 text-gray-400"
            >
              <i class="pi pi-file-pdf text-4xl text-gray-300"></i>
              <span class="text-sm"
                >No client attachment path available for verification.</span
              >
            </div>
          </ng-template>
        </div>
      </div>
    </div>

    <div
      class="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] flex flex-row items-center justify-between z-50"
    >
      <div class="flex items-center gap-3 w-1/2 max-w-xl">
        <span class="p-input-icon-left w-full">
          <textarea
            rows="1"
            [(ngModel)]="remarks"
            [ngModelOptions]="{ standalone: true }"
            pInputTextarea
            [autoResize]="true"
            placeholder="Add internal remarks or reason for rejection..."
            class="w-full text-sm py-2 border border-gray-300 focus:border-blue-500 rounded px-3"
          ></textarea>
        </span>
      </div>
      <div class="flex flex-row items-center gap-2">
        <p-button
          label="Cancel"
          [routerLink]="'/sales-order'"
          severity="secondary"
          styleClass="px-3 border-gray-200!"
        ></p-button>
        <button
          pButton
          type="button"
          label="Reject PO"
          icon="pi pi-times-circle"
          class="p-button-outlined p-button-danger text-sm font-semibold h-10 px-4"
          (click)="updateStatus('Rejected')"
        ></button>
        <button
          pButton
          type="button"
          label="Approve & Confirm"
          icon="pi pi-check-circle"
          class="p-button-success text-sm font-semibold h-10 px-4"
          (click)="updateStatus('Confirmed')"
        ></button>
      </div>
    </div>
  </div>`,
  styleUrl: './sales-order-details.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesOrderDetails {
  private readonly salesOrderService = inject(SalesOrderService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly loadingService = inject(LoadingService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private sanitizer = inject(DomSanitizer);

  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  soData = signal<SalesOrderDto | null>({} as SalesOrderDto);

  currentId: string | null = null;
  remarks: string | null = null;
  attachmentUrl: SafeResourceUrl | null = null;

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

  getAttachmentUrl(path: string | undefined | null): SafeResourceUrl {
    if (!path) return '';

    const fullUrl = `https://localhost:5000/${path}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(fullUrl);
  }

  updateStatus(newStatus: string) {
    if (!this.currentId) return;

    if (newStatus === 'Rejected' && !this.remarks) {
      alert('Please enter rejection reason');
      return;
    }

    this.loadingService.start();

    const api =
      newStatus === 'Rejected'
        ? this.salesOrderService.Reject({
            id: this.currentId,
            remarks: this.remarks,
          })
        : this.salesOrderService.Approve({
            id: this.currentId,
            remarks: this.remarks,
          });

    api.pipe(takeUntil(this.ngUnsubscribe)).subscribe({
      next: () => {
        this.loadingService.stop();
        this.router.navigate(['/sales-order']);
      },
      error: () => {
        this.loadingService.stop();
      },
    });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
