import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { LoadingService } from '../../../services/loading.service';
import { PurchaseOrderService } from '../../../services/purchaseOrderService';
import { Subject, takeUntil } from 'rxjs';
import { PurchaseOrderDto } from '../../../models/PurchaseOrder';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-purchase-order-details',
  imports: [
    CommonModule,
    TableModule,
    InputTextModule,
    FormsModule,
    ButtonModule,
    RouterLink,
    TextareaModule,
    TagModule,
  ],
  template: `<div class="relative min-h-[94vh] mx-auto px-4 md:px-6 py-5 pb-36">
    <div class="flex items-center gap-2 text-sm text-gray-500 mb-5">
      <a
        [routerLink]="'/dashboard'"
        class="hover:text-primary transition-colors"
      >
        Dashboard
      </a>

      <i class="pi pi-angle-right text-xs"></i>

      <a
        [routerLink]="'/purchase-orders'"
        class="hover:text-primary transition-colors"
      >
        Purchase Orders
      </a>

      <i class="pi pi-angle-right text-xs"></i>

      <span class="font-medium text-gray-800">
        {{ poData()?.purchaseOrderNo || 'Details' }}
      </span>
    </div>

    <div
      *ngIf="!poData()"
      class="bg-white rounded-2xl border border-gray-200 p-16 text-center"
    >
      <i class="pi pi-spin pi-spinner text-3xl text-primary mb-3"></i>

      <div class="text-gray-500">Loading purchase order...</div>
    </div>

    <div *ngIf="poData()" class="space-y-6">
      <div class="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div
          class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6"
        >
          <div class="space-y-3">
            <div class="flex items-center gap-3 flex-wrap">
              <h1 class="text-2xl font-bold text-gray-900">
                {{ poData()?.purchaseOrderNo }}
              </h1>

              <p-tag
                [value]="poData()?.status"
                [severity]="getStatusSeverity(poData()?.status)"
                styleClass="text-xs px-3 py-1 font-semibold uppercase"
              ></p-tag>
            </div>
            <div *ngIf="poData()?.projectId" class="text-sm text-gray-500">
              Project:
              <span class="font-medium">
                {{ poData()?.project?.projectCode }} -
                {{ poData()?.project?.projectTitle }}
              </span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 min-w-[260px]">
            <div class="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div class="text-xs text-gray-400 uppercase mb-1">PO Date</div>

              <div class="font-semibold text-gray-800">
                {{ poData()?.poDate | date: 'dd MMM yyyy' }}
              </div>
            </div>

            <div class="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div class="text-xs text-gray-400 uppercase mb-1">Terms</div>

              <div class="font-semibold text-gray-800">
                {{ poData()?.terms || '-' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div class="text-xs uppercase text-gray-400 mb-3">From Company</div>

          <div class="space-y-2">
            <div class="text-lg font-semibold text-gray-900">
              {{ poData()?.fromCompany?.name || '-' }}
            </div>
            <div class="flex flex-col text-gray-500">
              <div>
                {{ poData()?.fromCompany?.billingAddress?.addressLine1 }}
              </div>
              <div>
                {{ poData()?.fromCompany?.billingAddress?.addressLine2 }}
              </div>
              <div>
                {{ poData()?.fromCompany?.billingAddress?.poscode }},
                {{ poData()?.fromCompany?.billingAddress?.city }}
              </div>
              {{ poData()?.fromCompany?.billingAddress?.state }},
              {{ poData()?.fromCompany?.billingAddress?.country }}
            </div>

            <div class="mt-4 space-y-1 text-sm text-gray-600">
              <div class="flex">
                <div class="w-20">Attn</div>
                <div class="w-3 text-center">:</div>
                <div class="flex-1">
                  {{ poData()?.fromCompany?.contactPerson1 }}
                </div>
              </div>

              <div class="flex">
                <div class="w-20">TEL</div>
                <div class="w-3 text-center">:</div>
                <div class="flex-1">
                  {{ poData()?.fromCompany?.contactNo }}
                </div>
              </div>

              <div class="flex">
                <div class="w-20">FAX</div>
                <div class="w-3 text-center">:</div>
                <div class="flex-1">
                  {{ poData()?.fromCompany?.faxNo }}
                </div>
              </div>

              <div class="flex">
                <div class="w-20">A/C NO.</div>
                <div class="w-3 text-center">:</div>
                <div class="flex-1">
                  {{ poData()?.fromCompany?.acNo }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div class="text-xs uppercase text-gray-400 mb-3">Supplier</div>

          <div class="space-y-2">
            <div class="text-lg font-semibold text-gray-900">
              {{ poData()?.supplier?.name || '-' }}
            </div>

            <div class="flex flex-col text-gray-500">
              <div>
                {{ poData()?.supplier?.billingAddress?.addressLine1 }}
              </div>
              <div>
                {{ poData()?.supplier?.billingAddress?.addressLine2 }}
              </div>
              <div>
                {{ poData()?.supplier?.billingAddress?.poscode }},
                {{ poData()?.supplier?.billingAddress?.city }}
              </div>
              {{ poData()?.supplier?.billingAddress?.state }},
              {{ poData()?.supplier?.billingAddress?.country }}
            </div>

            <div class="mt-4 space-y-1 text-sm text-gray-600">
              <div class="flex">
                <div class="w-20">Attn</div>
                <div class="w-3 text-center">:</div>
                <div class="flex-1">
                  {{ poData()?.supplier?.contactPerson1 }}
                </div>
              </div>

              <div class="flex">
                <div class="w-20">TEL</div>
                <div class="w-3 text-center">:</div>
                <div class="flex-1">
                  {{ poData()?.supplier?.contactNo }}
                </div>
              </div>

              <div class="flex">
                <div class="w-20">FAX</div>
                <div class="w-3 text-center">:</div>
                <div class="flex-1">
                  {{ poData()?.supplier?.faxNo }}
                </div>
              </div>

              <div class="flex">
                <div class="w-20">A/C NO.</div>
                <div class="w-3 text-center">:</div>
                <div class="flex-1">
                  {{ poData()?.supplier?.acNo }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        class="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
      >
        <div class="px-6 py-5 border-b border-gray-100">
          <h2 class="text-lg font-semibold text-gray-900">
            Purchase Order Items
          </h2>
        </div>

        <p-table
          [value]="poData()?.purchaseOrderItems || []"
          responsiveLayout="scroll"
          styleClass="p-datatable-sm"
          [showGridlines]="true"
        >
          <ng-template #header>
            <tr class="text-sm">
              <th class="w-[5%] bg-gray-100! text-center!">#</th>
              <th class="w-[35%] bg-gray-100!">Description</th>
              <th class="w-[10%] text-center! bg-gray-100!">Qty</th>
              <th class="w-[10%] bg-gray-100! text-right!">Unit Price (RM)</th>
              <th class="w-[10%] bg-gray-100! text-right!" s>Discount (%)</th>
              <th class="w-[10%] bg-gray-100! text-right!">Total (RM)</th>
              <th class="w-[10%] bg-gray-100! text-right!">Received</th>
            </tr>
          </ng-template>

          <ng-template #body let-item let-rowIndex="rowIndex">
            <tr class="text-sm">
              <td class="text-gray-400 text-center!">
                {{ rowIndex + 1 }}
              </td>

              <td>
                <div class="font-medium text-gray-900">
                  {{ item.item }}
                </div>

                <div
                  *ngIf="item.description"
                  class="text-sm text-gray-400 mt-1"
                  [innerHTML]="item.description"
                ></div>
              </td>

              <td class="text-center!">
                {{ item.quantity }}
              </td>

              <td class="text-right!">
                {{ item.unitPrice | number: '1.2-2' }}
              </td>

              <td class="text-right! text-red-500">
                {{ item.discount || 0 | number: '1.2-2' }}
              </td>

              <td class="text-right! font-semibold">
                {{ item.totalPrice | number: '1.2-2' }}
              </td>

              <td class="text-right! text-gray-500">
                {{ item.receivedQuantity || 0 }}
                /
                {{ item.quantity }}
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div
          class="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
        >
          <div class="text-xs uppercase text-gray-400 mb-3">Remarks</div>

          <div class="text-sm text-gray-600 leading-relaxed">
            {{ poData()?.remarks || 'No notes available.' }}
          </div>
        </div>

        <div class="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div class="space-y-4">
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-500"> Gross (RM) </span>

              <span class="font-medium">
                {{ poData()?.gross || 0 | number: '1.2-2' }}
              </span>
            </div>

            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-500"> Discount </span>

              <span class="text-red-500 font-medium">
                -
                {{ poData()?.discount || 0 | number: '1.2-2' }}
              </span>
            </div>

            <div
              class="border-t border-gray-100 pt-4 flex items-center justify-between"
            >
              <span class="font-semibold text-gray-800">
                Total Amount (RM)</span
              >

              <span class="text-xl font-bold text-primary">
                {{ poData()?.totalAmount || 0 | number: '1.2-2' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      class="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 md:px-6 py-4 shadow-lg z-50"
    >
      <div class="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div class="w-200">
          <textarea
            rows="1"
            [(ngModel)]="remarks"
            pInputTextarea
            [autoResize]="true"
            placeholder="Remarks..."
            class="w-full"
          ></textarea>
        </div>

        <div class="flex items-center gap-3 w-full lg:w-auto justify-end">
          <p-button
            label="Cancel"
            [routerLink]="'/purchase-orders'"
            severity="secondary"
            styleClass="px-4! border-gray-200!"
          ></p-button>

          <button
            pButton
            type="button"
            label="Reject"
            icon="pi pi-times-circle"
            class="p-button-danger"
            (click)="updateStatus('Rejected')"
          ></button>

          <button
            pButton
            type="button"
            label="Approve"
            icon="pi pi-check-circle"
            class="p-button-success"
            (click)="updateStatus('Approved')"
          ></button>
        </div>
      </div>
    </div>
  </div>`,
  styleUrl: './purchase-order-details.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseOrderDetails implements OnInit, OnDestroy {
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly loadingService = inject(LoadingService);
  private readonly messageService = inject(MessageService);
  private readonly purchaseOrderService = inject(PurchaseOrderService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  remarks: string | null = null;
  currentId: string | null = null;

  poData = signal<PurchaseOrderDto | null>({} as PurchaseOrderDto);

  constructor() {
    this.currentId = this.activatedRoute.snapshot.queryParams['id'];
  }

  ngOnInit(): void {
    this.GetData();
  }

  GetData() {
    this.loadingService.start();
    this.purchaseOrderService
      .GetOne({
        Page: 1,
        PageSize: 1,
        OrderBy: null,
        Select: null,
        Includes:
          'PurchaseOrderItems,Supplier.BillingAddress,Supplier.DeliveryAddress,FromCompany.BillingAddress,FromCompany.DeliveryAddress',
        Filter: `Id=${this.currentId}`,
      })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();
          this.poData.set(res);
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loadingService.stop();
        },
      });
  }

  updateStatus(status: string) {
    if (!this.currentId) return;

    this.loadingService.start();

    this.purchaseOrderService
      .UpdateStatus(this.currentId, status, this.remarks)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();
          this.messageService.add({
            severity: 'success',
            summary: 'Status Updated',
            detail: `Purchase Order has been ${status.toLowerCase()} successfully.`,
          });

          this.router.navigate(['/purchase-orders']);
        },
        error: (err) => {
          this.loadingService.stop();

          this.messageService.add({
            severity: 'error',
            summary: 'Update Failed',
            detail:
              err?.error?.message || 'Unable to update purchase order status.',
          });
        },
      });
  }

  getStatusSeverity(
    status: string | undefined,
  ): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'accepted':
      case 'completed':
        return 'success';
      case 'sent':
      case 'partiallyreceived':
        return 'info';
      case 'draft':
        return 'warning';
      case 'rejected':
      case 'cancelled':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  ngOnDestroy(): void {
    this.loadingService.stop();
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
