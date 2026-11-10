import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { MenuModule } from 'primeng/menu';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService, MenuItem } from 'primeng/api';

import { Subject, takeUntil } from 'rxjs';

import { GoodsReceivingDto } from '../../../../models/GoodsReceiving';
import { GoodsReceivingService } from '../../../../services/goodsReceivingService';
import { InvoiceService } from '../../../../services/invoiceService.service';
import { LoadingService } from '../../../../services/loading.service';

import {
  PagingContent,
  GridifyQueryExtend,
  BuildSortText,
  BuildFilterText,
  buildFormData,
  ValidateAllFormFields,
  resolveAssetUrl,
} from '../../../../shared/helpers/helpers';

@Component({
  selector: 'app-goods-receiving',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    TableModule,
    MenuModule,
    InputNumberModule,
    TextareaModule,
    SelectModule,
    DatePickerModule,
    DialogModule,
    CheckboxModule,
  ],
  template: `
    <div class="w-full min-h-screen bg-slate-50/50 p-3 sm:p-4 lg:p-6">
      <!-- Breadcrumb -->
      <div class="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500">
        <a
          routerLink="/dashboard"
          class="cursor-pointer transition-colors hover:text-blue-600"
        >
          Dashboard
        </a>
        <i class="pi pi-angle-right text-xs"></i>
        <span class="font-medium text-gray-800"> Goods Received Notes </span>
      </div>

      <!-- Main content -->
      <div
        class="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
      >
        <!-- Header -->
        <div
          class="flex flex-col gap-4 border-b border-gray-100 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between"
        >
          <div class="min-w-0">
            <h1
              class="text-lg font-bold tracking-tight text-gray-800 sm:text-xl"
            >
              Goods Received Notes
            </h1>
            <p class="mt-1 text-xs leading-relaxed text-gray-500 sm:text-sm">
              Manage, track, and process customer goods received notes and
              fulfillment statuses.
            </p>
          </div>

          <div class="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
            <!-- Search -->
            <div class="relative w-full sm:flex-1 lg:w-[260px] lg:flex-none">
              <i
                class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400"
              ></i>
              <input
                type="text"
                pInputText
                [(ngModel)]="search"
                class="w-full !rounded-lg !py-2 !pl-9 !pr-3 !text-sm"
                placeholder="Search by GRN No..."
                (keydown)="onKeyDown($event)"
              />
            </div>

            <p-button
              label="Create Stock GRN"
              icon="pi pi-plus"
              severity="info"
              styleClass="py-3! sm:py-2! w-full !justify-center !rounded-lg !px-4 !text-sm sm:w-auto bg-blue-700! border-none! hover:bg-blue-500!"
              (onClick)="ActionClick(null, 'Create')"
            ></p-button>
          </div>
        </div>

        <!-- Table -->
        <div class="p-3 sm:p-4">
          <p-table
            #fTable
            styleClass="grn-table"
            dataKey="id"
            [value]="PagingSignal().data || []"
            [paginator]="true"
            [rows]="Query.PageSize"
            [totalRecords]="PagingSignal().totalElements"
            [showGridlines]="true"
            [rowsPerPageOptions]="[10, 20, 30, 50]"
            [lazy]="true"
            [rowHover]="true"
            (onLazyLoad)="NextPage($event)"
            [tableStyle]="{ 'min-width': '70rem' }"
            paginatorDropdownAppendTo="body"
          >
            <ng-template #header>
              <tr>
                <th pSortableColumn="GRNNO" class="!bg-gray-50 !px-4 !py-3">
                  <div class="flex items-center gap-2">
                    <span>GRN Number</span>
                    <p-sortIcon field="GRNNO"></p-sortIcon>
                  </div>
                </th>

                <th class="!bg-gray-50 !px-4 !py-3 !text-center">
                  Purchase Order No
                </th>

                <th class="!bg-gray-50 !px-4 !py-3">Supplier</th>

                <th class="!bg-gray-50 !px-4 !py-3 !text-center">Account No</th>

                <th class="!bg-gray-50 !px-4 !py-3 !text-right">
                  Total Amount
                </th>

                <th
                  pSortableColumn="Status"
                  class="!bg-gray-50 !px-4 !py-3 !text-center"
                >
                  <div class="flex items-center justify-center gap-2">
                    Status
                    <p-sortIcon field="Status"></p-sortIcon>
                  </div>
                </th>

                <th class="!bg-gray-50 !px-4 !py-3 !text-center">Actions</th>
              </tr>
            </ng-template>

            <ng-template #body let-data>
              <tr class="transition-colors hover:bg-slate-50">
                <td class="!px-4 !py-3">
                  <span class="font-bold text-gray-800">
                    {{ data.grnNo }}
                  </span>
                </td>

                <td class="!px-4 !py-3 !text-center">
                  <a
                    class="cursor-pointer font-semibold text-blue-600 hover:underline"
                    [routerLink]="'/purchase-orders/details'"
                    [queryParams]="{ id: data.purchaseOrderId }"
                  >
                    {{ data.purchaseOrder?.purchaseOrderNo || '-' }}
                  </a>
                </td>

                <td class="!px-4 !py-3 text-gray-700">
                  {{ data.supplier?.name || '-' }}
                </td>

                <td class="!px-4 !py-3 !text-center text-gray-600">
                  {{ data.supplier?.acNo || '-' }}
                </td>

                <td class="!px-4 !py-3 !text-right font-medium text-gray-700">
                  {{ data.totalAmount | currency: 'RM ' }}
                </td>

                <td class="!px-4 !py-3 !text-center">
                  <span
                    class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold"
                    [ngClass]="getStatusClass(data.status)"
                  >
                    <span
                      class="h-1.5 w-1.5 rounded-full"
                      [ngClass]="getStatusDotClass(data.status)"
                    ></span>
                    {{ data.status }}
                  </span>
                </td>

                <td class="!px-4 !py-3 !text-center">
                  <button
                    type="button"
                    (click)="onEllipsisClick($event, data, menu)"
                    class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                  >
                    <i class="pi pi-ellipsis-h"></i>
                  </button>
                </td>
              </tr>
            </ng-template>

            <ng-template #emptymessage>
              <tr>
                <td colspan="7" class="!py-12">
                  <div
                    class="flex flex-col items-center justify-center gap-2 text-center"
                  >
                    <i class="pi pi-folder-open text-3xl text-gray-300"></i>
                    <span class="text-sm font-medium text-gray-500">
                      No goods received notes found.
                    </span>
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>

          <!-- Mobile cards -->
          <div class="grn-mobile-list space-y-3">
            <ng-container *ngIf="PagingSignal().data?.length; else mobileEmpty">
              <div
                *ngFor="let data of PagingSignal().data"
                class="rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0 flex-1">
                    <div
                      class="text-[10px] font-semibold uppercase tracking-wider text-gray-400"
                    >
                      GRN Number
                    </div>
                    <div
                      class="mt-1 break-words text-sm font-bold text-gray-800"
                    >
                      {{ data.grnNo }}
                    </div>
                  </div>

                  <button
                    type="button"
                    (click)="onEllipsisClick($event, data, menu)"
                    class="flex h-9 w-9 flex-none items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50"
                  >
                    <i class="pi pi-ellipsis-v"></i>
                  </button>
                </div>

                <div class="my-3 border-t border-gray-100"></div>

                <div class="grid grid-cols-2 gap-x-3 gap-y-3">
                  <div class="col-span-2 min-w-0">
                    <div
                      class="text-[10px] font-semibold uppercase tracking-wider text-gray-400"
                    >
                      Supplier
                    </div>
                    <div
                      class="mt-1 break-words text-sm font-medium text-gray-700"
                    >
                      {{ data.supplier?.name || '-' }}
                    </div>
                  </div>

                  <div class="min-w-0">
                    <div
                      class="text-[10px] font-semibold uppercase tracking-wider text-gray-400"
                    >
                      Purchase Order
                    </div>
                    <a
                      class="mt-1 block break-words text-sm font-semibold text-blue-600"
                      [routerLink]="'/purchase-orders/details'"
                      [queryParams]="{ id: data.purchaseOrderId }"
                    >
                      {{ data.purchaseOrder.purchaseOrderNo || '-' }}
                    </a>
                  </div>

                  <div class="min-w-0">
                    <div
                      class="text-[10px] font-semibold uppercase tracking-wider text-gray-400"
                    >
                      Account No
                    </div>
                    <div class="mt-1 break-words text-sm text-gray-700">
                      {{ data.supplier?.acNo || '-' }}
                    </div>
                  </div>

                  <div class="min-w-0">
                    <div
                      class="text-[10px] font-semibold uppercase tracking-wider text-gray-400"
                    >
                      Total Amount
                    </div>
                    <div class="mt-1 text-sm font-bold text-gray-800">
                      {{ data.totalAmount | currency: 'RM ' }}
                    </div>
                  </div>

                  <div class="min-w-0">
                    <div
                      class="text-[10px] font-semibold uppercase tracking-wider text-gray-400"
                    >
                      Status
                    </div>
                    <div class="mt-1">
                      <span
                        class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold"
                        [ngClass]="getStatusClass(data.status)"
                      >
                        <span
                          class="h-1.5 w-1.5 rounded-full"
                          [ngClass]="getStatusDotClass(data.status)"
                        ></span>
                        {{ data.status }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </ng-container>

            <ng-template #mobileEmpty>
              <div
                class="flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-200 py-10 text-center"
              >
                <i class="pi pi-folder-open text-3xl text-gray-300"></i>
                <span class="text-sm text-gray-500">
                  No goods received notes found.
                </span>
              </div>
            </ng-template>
          </div>
        </div>
      </div>
    </div>

    <p-menu #menu [model]="menuItems" [popup]="true"></p-menu>

    <!-- Invoice dialog -->
    <p-dialog
      [(visible)]="invoiceDialog"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [dismissableMask]="false"
      [blockScroll]="true"
      styleClass="grn-invoice-dialog"
      [maskStyle]="{
        'background-color': 'rgba(15, 23, 42, 0.5)',
        'backdrop-filter': 'blur(3px)',
      }"
      appendTo="body"
    >
      <ng-template #headless>
        <div
          class="flex max-h-[95dvh] flex-col overflow-hidden bg-white sm:max-h-[90vh]"
        >
          <!-- Dialog header -->
          <div
            class="flex flex-none items-start justify-between gap-3 border-b border-gray-200 bg-slate-50 px-4 py-4 sm:px-6 sm:py-5"
          >
            <div class="min-w-0">
              <h2
                class="flex items-center gap-2 text-base font-bold text-gray-900 sm:text-xl"
              >
                <i class="pi pi-receipt text-blue-600"></i>
                Add Supplier Invoice
              </h2>
              <p class="mt-1 text-xs leading-relaxed text-gray-500 sm:text-sm">
                Verify invoice details and record the supplier billing
                information.
              </p>
            </div>

            <p-button
              icon="pi pi-times"
              [rounded]="true"
              [text]="true"
              severity="secondary"
              styleClass="!h-9 !w-9 flex-none"
              (onClick)="invoiceDialog = false"
            ></p-button>
          </div>

          <!-- Dialog body -->
          <div
            class="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-3 sm:p-6"
          >
            <!-- Supplier summary -->
            <div
              class="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4"
            >
              <div class="flex min-w-0 items-center gap-3">
                <div
                  class="flex h-9 w-9 flex-none items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600"
                >
                  <i class="pi pi-building"></i>
                </div>
                <div class="min-w-0">
                  <div
                    class="text-[10px] font-semibold uppercase tracking-wider text-gray-400"
                  >
                    Associated Supplier
                  </div>
                  <div
                    class="mt-0.5 break-words text-sm font-bold text-gray-800"
                  >
                    {{ selectedGRN?.supplier?.name || '-' }}
                  </div>
                </div>
              </div>

              <div class="text-left sm:text-right">
                <div
                  class="text-[10px] font-semibold uppercase tracking-wider text-gray-400"
                >
                  GRN Code
                </div>
                <div
                  class="mt-0.5 break-all font-mono text-sm font-bold text-gray-900"
                >
                  {{ selectedGRN?.grnNo }}
                </div>
              </div>
            </div>

            <!-- Invoice form -->
            <div
              [formGroup]="invoiceForm"
              class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4"
            >
              <div class="flex min-w-0 flex-col gap-1.5">
                <label class="text-xs font-semibold text-gray-700 sm:text-sm">
                  Supplier Invoice No <span class="text-rose-500">*</span>
                </label>
                <input
                  pInputText
                  formControlName="invoiceNo"
                  class="w-full !text-sm"
                  placeholder="e.g. INV-2026-991"
                />
                <small
                  *ngIf="
                    invoiceForm.get('invoiceNo')?.touched &&
                    invoiceForm.get('invoiceNo')?.invalid
                  "
                  class="text-xs text-rose-500"
                >
                  Invoice number is required.
                </small>
              </div>

              <div class="flex min-w-0 flex-col gap-1.5">
                <label class="text-xs font-semibold text-gray-700 sm:text-sm">
                  Invoice Date <span class="text-rose-500">*</span>
                </label>
                <p-datepicker
                  appendTo="body"
                  [showIcon]="true"
                  styleClass="w-full"
                  inputStyleClass="w-full !text-sm"
                  dateFormat="dd/mm/yy"
                  formControlName="invoiceDate"
                ></p-datepicker>
              </div>

              <div class="flex min-w-0 flex-col gap-1.5">
                <label class="text-xs font-semibold text-gray-700 sm:text-sm">
                  Payment Due Date <span class="text-rose-500">*</span>
                </label>
                <p-datepicker
                  appendTo="body"
                  [showIcon]="true"
                  styleClass="w-full"
                  inputStyleClass="w-full !text-sm"
                  dateFormat="dd/mm/yy"
                  formControlName="dueDate"
                ></p-datepicker>
              </div>

              <div class="flex min-w-0 flex-col gap-1.5">
                <label class="text-xs font-semibold text-gray-700 sm:text-sm">
                  Internal Remarks
                </label>
                <input
                  pInputText
                  formControlName="remarks"
                  class="w-full !text-sm"
                  placeholder="Optional notes..."
                />
              </div>

              <!-- Attachment -->
              <div
                class="col-span-1 flex min-w-0 flex-col gap-2 border-t border-gray-100 pt-4 sm:col-span-2"
              >
                <label
                  class="text-xs font-semibold uppercase tracking-wider text-gray-600"
                >
                  Supplier Invoice Attachment
                </label>

                <input
                  #fileInputRef
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  (change)="onFileSelected($event)"
                  hidden
                />

                <div
                  class="flex min-w-0 flex-col gap-3 rounded-lg border border-dashed border-gray-300 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div
                    class="flex min-w-0 items-center gap-2 text-sm text-gray-600"
                  >
                    <i
                      class="pi pi-file-pdf flex-none text-lg text-blue-500"
                    ></i>
                    <a
                      *ngIf="selectedFileName"
                      [href]="selectedFileUrl"
                      [download]="selectedFileName"
                      target="_blank"
                      class="min-w-0 truncate text-blue-600 hover:underline"
                    >
                      {{ selectedFileName }}
                    </a>
                    <span
                      *ngIf="!selectedFileName"
                      class="text-xs text-gray-400"
                    >
                      No document selected
                    </span>
                  </div>

                  <div class="flex flex-none items-center gap-2">
                    <p-button
                      [label]="
                        invoiceForm.get('attachment')?.value
                          ? 'Replace'
                          : 'Upload Document'
                      "
                      icon="pi pi-upload"
                      severity="secondary"
                      size="small"
                      styleClass="!text-xs"
                      (onClick)="fileInputRef.click()"
                    ></p-button>

                    <p-button
                      *ngIf="invoiceForm.get('attachment')?.value"
                      icon="pi pi-trash"
                      severity="danger"
                      size="small"
                      [text]="true"
                      (onClick)="RemoveAttachment()"
                    ></p-button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Billing items -->
            <div class="space-y-3">
              <div
                class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
              >
                <h3 class="text-sm font-bold text-gray-800">
                  Billing Items Breakdown
                </h3>
                <span class="text-xs text-gray-500">
                  {{ invoiceItems.controls.length }} rows found
                </span>
              </div>

              <!-- Desktop invoice items table -->
              <div
                class="hidden overflow-hidden rounded-lg border border-gray-200 md:block"
              >
                <p-table
                  [value]="invoiceItems.controls"
                  [showGridlines]="false"
                  styleClass="p-datatable-sm"
                  [tableStyle]="{ 'min-width': '48rem' }"
                >
                  <ng-template #header>
                    <tr>
                      <th class="!w-12 !bg-gray-50 !text-center">Select</th>
                      <th class="!w-12 !bg-gray-50 !text-center">No</th>
                      <th class="!bg-gray-50">Item / Model</th>
                      <th class="!bg-gray-50">Description</th>
                      <th class="!bg-gray-50 !text-center">Qty</th>
                      <th class="!bg-gray-50 !text-right">Unit Price</th>
                      <th class="!bg-gray-50 !text-right">Amount</th>
                    </tr>
                  </ng-template>

                  <ng-template #body let-control let-i="rowIndex">
                    <tr [formGroup]="getInvoiceItemGroup(i)">
                      <td class="!text-center">
                        <p-checkbox
                          [binary]="true"
                          formControlName="selected"
                        ></p-checkbox>
                      </td>
                      <td class="!text-center text-xs text-gray-400">
                        {{ i + 1 }}
                      </td>
                      <td
                        class="max-w-[180px] whitespace-normal break-words font-semibold text-gray-800"
                      >
                        {{ control.get('item')?.value }}
                      </td>
                      <td
                        class="max-w-[200px] whitespace-normal break-words text-xs text-gray-500"
                      >
                        <div
                          [innerHTML]="control.get('description')?.value"
                        ></div>
                      </td>
                      <td class="!text-center">
                        <p-inputnumber
                          formControlName="quantity"
                          [showButtons]="false"
                          inputStyleClass="!w-16 !py-1 !px-1.5 !text-center"
                          [min]="0"
                          (onInput)="calculateRowTotals()"
                        ></p-inputnumber>
                      </td>
                      <td class="!text-right font-mono text-gray-700">
                        {{ control.get('unitPrice')?.value | currency: 'RM ' }}
                      </td>
                      <td class="!text-right font-mono font-bold text-gray-800">
                        {{
                          control.get('quantity')?.value *
                            control.get('unitPrice')?.value | currency: 'RM '
                        }}
                      </td>
                    </tr>
                  </ng-template>
                </p-table>
              </div>

              <!-- Mobile invoice item cards -->
              <div class="space-y-3 md:hidden">
                <div
                  *ngFor="let control of invoiceItems.controls; let i = index"
                  [formGroup]="getInvoiceItemGroup(i)"
                  class="rounded-lg border border-gray-200 p-3"
                >
                  <div class="flex items-start gap-3">
                    <p-checkbox
                      [binary]="true"
                      formControlName="selected"
                    ></p-checkbox>

                    <div class="min-w-0 flex-1">
                      <div
                        class="text-[10px] font-semibold uppercase text-gray-400"
                      >
                        Item {{ i + 1 }}
                      </div>
                      <div
                        class="mt-1 break-words text-sm font-semibold text-gray-800"
                      >
                        {{ control.get('item')?.value || '-' }}
                      </div>
                      <div
                        class="mt-1 break-words text-xs text-gray-500"
                        [innerHTML]="control.get('description')?.value"
                      ></div>
                    </div>
                  </div>

                  <div
                    class="mt-3 grid grid-cols-2 gap-3 border-t border-gray-100 pt-3"
                  >
                    <div>
                      <label
                        class="mb-1 block text-[10px] font-semibold uppercase text-gray-400"
                      >
                        Quantity
                      </label>
                      <p-inputnumber
                        formControlName="quantity"
                        [showButtons]="true"
                        buttonLayout="horizontal"
                        inputStyleClass="!w-12 !py-1 !px-1 !text-center !text-sm"
                        [min]="0"
                        (onInput)="calculateRowTotals()"
                        styleClass="w-full"
                      ></p-inputnumber>
                    </div>

                    <div>
                      <div
                        class="text-[10px] font-semibold uppercase text-gray-400"
                      >
                        Unit Price
                      </div>
                      <div class="mt-1 text-sm font-medium text-gray-700">
                        {{ control.get('unitPrice')?.value | currency: 'RM ' }}
                      </div>
                    </div>

                    <div
                      class="col-span-2 flex items-center justify-between border-t border-gray-100 pt-2"
                    >
                      <span class="text-xs font-semibold text-gray-500">
                        Amount
                      </span>
                      <span class="text-sm font-bold text-gray-800">
                        {{
                          control.get('quantity')?.value *
                            control.get('unitPrice')?.value | currency: 'RM '
                        }}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  *ngIf="invoiceItems.controls.length === 0"
                  class="rounded-lg border border-dashed border-gray-200 py-8 text-center text-sm text-gray-400"
                >
                  No invoice items available.
                </div>
              </div>
            </div>

            <!-- Totals -->
            <div class="flex justify-end">
              <div
                class="w-full space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:max-w-[320px]"
              >
                <div
                  class="flex items-center justify-between gap-3 text-sm text-gray-500"
                >
                  <span>Subtotal</span>
                  <span class="font-mono font-medium text-gray-800">
                    {{ invoiceForm.get('gross')?.value | currency: 'RM ' }}
                  </span>
                </div>

                <div
                  class="flex items-center justify-between gap-3 text-sm text-gray-500"
                >
                  <span>Discount</span>
                  <span class="font-mono text-rose-600">
                    - {{ invoiceForm.get('discount')?.value | currency: 'RM ' }}
                  </span>
                </div>

                <div class="border-t border-gray-200"></div>

                <div class="flex items-center justify-between gap-3">
                  <span class="text-sm font-bold text-gray-800">
                    Total Amount
                  </span>
                  <span class="font-mono text-base font-bold text-blue-700">
                    {{
                      invoiceForm.get('totalAmount')?.value | currency: 'RM '
                    }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Dialog footer -->
          <div
            class="flex flex-none flex-col gap-3 border-t border-gray-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6"
          >
            <div
              class="hidden items-center gap-2 text-xs text-gray-400 sm:flex"
            >
              <i class="pi pi-shield-check"></i>
              <span>Secured Ledger Sync Engine v2.0</span>
            </div>

            <div class="flex w-full items-center gap-2 sm:w-auto">
              <p-button
                label="Discard"
                severity="secondary"
                [outlined]="true"
                styleClass="!flex-1 !justify-center !text-xs sm:!flex-none"
                (onClick)="invoiceDialog = false"
              ></p-button>

              <p-button
                label="Save Invoice"
                icon="pi pi-cloud-upload"
                severity="info"
                styleClass="!flex-1 !justify-center !text-xs sm:!flex-none"
                (onClick)="submitInvoice()"
              ></p-button>
            </div>
          </div>
        </div>
      </ng-template>
    </p-dialog>
  `,
  styleUrl: './goods-receiving.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoodsReceiving implements OnInit, OnDestroy {
  @ViewChild('fTable') fTable?: Table;
  @ViewChild('fileInputRef') fileInputRef!: ElementRef<HTMLInputElement>;

  private readonly goodsReceivingService = inject(GoodsReceivingService);
  private readonly invoiceService = inject(InvoiceService);
  private readonly loadingService = inject(LoadingService);
  private readonly messageService = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  protected ngUnsubscribe = new Subject<void>();

  PagingSignal = signal<PagingContent<GoodsReceivingDto>>(
    {} as PagingContent<GoodsReceivingDto>,
  );

  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  search = '';
  menuItems: MenuItem[] = [];

  receivedForm!: FormGroup;
  invoiceForm!: FormGroup;

  receivedDialog = false;
  showDrawer = false;
  invoiceDialog = false;

  selectedGRN: any;
  selectedInvoiceItems: any[] = [];

  selectedFileName = '';
  selectedFileUrl: string | null = null;

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 10;
    this.Query.Filter = null;
    this.Query.OrderBy = 'CreatedAt desc';
    this.Query.Select = null;
    this.Query.Includes =
      'PurchaseOrder.PurchaseOrderItems,Supplier,GoodsReceivingItems';
  }

  ngOnInit(): void {}

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      Draft: 'bg-amber-50 text-amber-700 border-amber-200',
      Reviewed: 'bg-orange-50 text-orange-700 border-orange-200',
      Approved: 'bg-blue-50 text-blue-700 border-blue-200',
      InProgress: 'bg-blue-50 text-blue-700 border-blue-200',
      Sent: 'bg-purple-50 text-purple-700 border-purple-200',
      Issued: 'bg-purple-50 text-purple-700 border-purple-200',
      PartiallyReceived: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      PartiallyShipped: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      Confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      Rejected: 'bg-rose-50 text-rose-700 border-rose-200',
      Cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
    };

    return classes[status] || 'bg-gray-50 text-gray-600 border-gray-200';
  }

  getStatusDotClass(status: string): string {
    const classes: Record<string, string> = {
      Draft: 'bg-amber-500',
      Reviewed: 'bg-orange-500',
      Approved: 'bg-blue-500',
      InProgress: 'bg-blue-500',
      Sent: 'bg-purple-500',
      Issued: 'bg-purple-500',
      PartiallyReceived: 'bg-cyan-500',
      PartiallyShipped: 'bg-cyan-500',
      Confirmed: 'bg-emerald-500',
      Rejected: 'bg-rose-500',
      Cancelled: 'bg-rose-500',
    };

    return classes[status] || 'bg-gray-400';
  }

  GetData(): void {
    this.loadingService.start();

    this.goodsReceivingService
      .GetMany(this.Query)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();
          this.PagingSignal.set(res);
          this.cdr.markForCheck();
        },
        error: () => {
          this.loadingService.stop();
          this.cdr.markForCheck();
        },
      });
  }

  NextPage(event: TableLazyLoadEvent): void {
    if ((event?.first || event?.first === 0) && event?.rows) {
      this.Query.Page = event.first / event.rows + 1 || 1;
      this.Query.PageSize = event.rows;
    }

    const sortText = BuildSortText(event);
    this.Query.OrderBy = sortText || 'CreatedAt desc';
    this.Query.Filter = BuildFilterText(event);

    this.GetData();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.Search(this.search);
    } else if (event.key === 'Backspace' && this.search === '') {
      this.Search('');
    }
  }

  Search(data: string): void {
    const filter = {
      GRNNo: [
        {
          value: data,
          matchMode: '=',
          operator: 'and',
        },
      ],
    };

    if (this.fTable) {
      this.fTable.first = 0;
      this.fTable.filters = filter;
    }

    const event: TableLazyLoadEvent = {
      first: 0,
      rows: this.fTable?.rows || this.Query.PageSize,
      sortField: null,
      sortOrder: null,
      filters: filter,
    };

    this.NextPage(event);
  }

  ResetTable(): void {
    this.search = '';

    if (this.fTable) {
      this.fTable.first = 0;
      this.fTable.clearFilterValues();
      this.fTable.saveState();
    }

    this.Query.Filter = null;
    this.GetData();
  }

  onEllipsisClick(event: Event, data: GoodsReceivingDto, menu: any): void {
    this.menuItems = [];

    if (data.status === 'Draft') {
      this.menuItems.push(
        {
          label: 'Update',
          icon: 'pi pi-pencil',
          command: () =>
            this.router.navigate(['/goods-receiving/form'], {
              queryParams: { id: data.id },
            }),
        },
        {
          label: 'Mark as Confirm',
          icon: 'pi pi-check-circle',
          command: () => this.UpdateStatus(data, 'Confirmed'),
        },
        {
          label: 'Delete',
          icon: 'pi pi-trash',
          command: () => this.ActionClick(data, 'Delete'),
        },
      );
    }

    if (data.status === 'Confirmed') {
      this.menuItems.push({
        label: 'Record Invoice',
        icon: 'pi pi-receipt',
        command: () => this.ActionClick(data, 'Invoice'),
      });
    }

    if (data.status !== 'Draft') {
      this.menuItems.push(
        {
          label: 'View Details',
          icon: 'pi pi-eye',
          command: () =>
            this.router.navigate(['/goods-receiving/details'], {
              queryParams: { id: data.id },
            }),
        },
        {
          label: 'Download Attachment',
          icon: 'pi pi-file',
          command: () => this.downloadAttachment(data),
        },
      );
    }

    menu.toggle(event);
  }

  ActionClick(data: GoodsReceivingDto | null, action: string): void {
    // Create action: navigate to the GRN form.
    if (action === 'Create') {
      this.router.navigate(['/goods-receiving/form']);
      return;
    }

    if (!data) return;

    if (action === 'Invoice') {
      this.selectedGRN = data;
      this.selectedFileName = '';
      this.selectedFileUrl = null;

      this.initInvoiceForm();

      this.invoiceForm.patchValue({
        supplierId: data.supplierId,
        companyId: data.companyId,
        goodsReceivingId: data.id,
        purchaseOrderId: data.purchaseOrderId,
        quotationId: data.purchaseOrder?.quotationId,
        invoiceDate: new Date(),
        dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
        type: 'Purchase',
        gross: 0,
        discount: data.discount,
        totalAmount: 0,
      });

      this.invoiceItems.clear();

      data.goodsReceivingItems?.forEach((x: any) => {
        const row = new FormGroup({
          selected: new FormControl(false),
          goodsReceivingItemId: new FormControl(x.id),
          item: new FormControl(x.purchaseOrderItem?.item ?? ''),
          description: new FormControl(x.purchaseOrderItem?.description ?? ''),
          unit: new FormControl(x.unit),
          unitPrice: new FormControl(x.unitPrice ?? 0),
          quantity: new FormControl(x.receivedQuantity),
          discount: new FormControl(x.discount),
          amount: new FormControl(x.totalPrice),
        });

        row
          .get('selected')
          ?.valueChanges.pipe(takeUntil(this.ngUnsubscribe))
          .subscribe(() => this.calculateRowTotals());

        row
          .get('quantity')
          ?.valueChanges.pipe(takeUntil(this.ngUnsubscribe))
          .subscribe(() => this.calculateRowTotals());

        this.invoiceItems.push(row);
      });

      this.calculateRowTotals();
      this.invoiceDialog = true;
      this.cdr.markForCheck();
    }
  }

  initForm(): void {
    this.receivedForm = new FormGroup({
      id: new FormControl<string | null>({ value: null, disabled: true }),
      grnNo: new FormControl<string | null>(null),
      purchaseOrderId: new FormControl<string | null>(null),
      supplierId: new FormControl<string | null>(null),
      receivedDate: new FormControl<Date | null>(null),
      supplierDONo: new FormControl<string | null>(null),
      supplierDODate: new FormControl<Date | null>(null),
      supplierDOAttachment: new FormControl<File | null>(null),
      remarks: new FormControl<string | null>(null),
      gross: new FormControl<number | null>(null),
      discount: new FormControl<number | null>(null),
      totalAmount: new FormControl<number | null>(null),
      goodsReceivingItems: new FormArray([]),
    });
  }

  downloadAttachment(data: any): void {
    const rawPath = data.supplierDOAttachment || data.attachmentPath;

    if (!rawPath) {
      this.messageService.add({
        severity: 'warn',
        summary: 'File Not Found',
        detail: 'No attachment path associated with this record.',
      });
      return;
    }

    const cleanPath = rawPath.replace(/\\/g, '/');
    const fileUrl = resolveAssetUrl(cleanPath);

    this.loadingService.start();

    fetch(fileUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP status ${response.status}`);
        }

        return response.blob();
      })
      .then((blob) => {
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = blobUrl;

        const fileExtension = cleanPath.split('.').pop() || 'pdf';
        const documentNo = data.grnNo || 'GRN';

        link.download = `${documentNo}.${fileExtension}`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        window.URL.revokeObjectURL(blobUrl);
        this.loadingService.stop();
      })
      .catch((error) => {
        console.error('Download failed:', error);
        this.loadingService.stop();

        this.messageService.add({
          severity: 'error',
          summary: 'Download Failed',
          detail: 'Could not fetch file stream from server backend.',
        });
      });
  }

  UpdateStatus(data: GoodsReceivingDto, newStatus: string): void {
    if (!data?.id) return;

    this.loadingService.start();

    this.goodsReceivingService
      .UpdateStatus(data.id, newStatus)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();

          const current = this.PagingSignal();

          const updated = current.data.map((item) =>
            item.id === data.id ? { ...item, status: newStatus } : item,
          );

          this.PagingSignal.set({
            ...current,
            data: updated,
          });

          this.messageService.add({
            severity: 'success',
            summary: 'Status Updated',
            detail:
              res?.remarks || `Status ${data.grnNo} changed to ${newStatus}`,
          });

          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loadingService.stop();

          console.error('UpdateStatus Error:', err);

          this.messageService.add({
            severity: 'error',
            summary: 'Update Failed',
            detail:
              err?.error?.message ||
              err?.error?.title ||
              'Failed to update status',
          });
        },
      });
  }

  initInvoiceForm(): void {
    this.invoiceForm = new FormGroup({
      invoiceNo: new FormControl<string | null>(null, Validators.required),
      companyId: new FormControl<string | null>(null),
      supplierId: new FormControl<string | null>(null),
      projectId: new FormControl<string | null>(null),
      goodsReceivingId: new FormControl<string | null>(null),
      quotationId: new FormControl<string | null>(null),
      type: new FormControl<string | null>('Purchase'),
      invoiceDate: new FormControl<Date | null>(null, Validators.required),
      dueDate: new FormControl<Date | null>(null, Validators.required),
      gross: new FormControl<number | null>(null),
      discount: new FormControl<number | null>(null),
      totalAmount: new FormControl<number | null>(null),
      paymentTerms: new FormControl<string | null>(null),
      remarks: new FormControl<string | null>(null),
      attachment: new FormControl<File | null>(null, Validators.required),
      invoiceItems: new FormArray([]),
    });
  }

  get invoiceItems(): FormArray {
    return this.invoiceForm.get('invoiceItems') as FormArray;
  }

  getInvoiceItemGroup(index: number): FormGroup {
    return this.invoiceItems.at(index) as FormGroup;
  }

  submitInvoice(): void {
    if (this.invoiceForm.valid) {
      this.loadingService.start();

      const formData = buildFormData(this.invoiceForm);

      this.invoiceService
        .Create(formData)
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe({
          next: (res) => {
            this.loadingService.stop();

            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: `Invoice: ${res.invoiceNo} has been created.`,
            });

            this.invoiceDialog = false;
            this.cdr.markForCheck();
          },
          error: (err) => {
            this.loadingService.stop();

            this.messageService.add({
              severity: 'error',
              summary: 'Save Failed',
              detail:
                err?.error?.message ||
                err?.error?.title ||
                'Failed to create invoice.',
            });

            this.cdr.markForCheck();
          },
        });
    }

    ValidateAllFormFields(this.invoiceForm);
  }

  calculateRowTotals(): void {
    let subtotalGross = 0;

    this.invoiceItems.controls.forEach((group) => {
      const isSelected = group.get('selected')?.value;
      const qty = Number(group.get('quantity')?.value ?? 0);
      const price = Number(group.get('unitPrice')?.value ?? 0);

      const rowAmount = qty * price;

      group.get('amount')?.setValue(rowAmount, { emitEvent: false });

      if (isSelected) {
        subtotalGross += rowAmount;
      }
    });

    const discount = Number(this.invoiceForm.get('discount')?.value ?? 0);

    const total = subtotalGross - discount;

    this.invoiceForm.patchValue(
      {
        gross: subtotalGross,
        totalAmount: total,
      },
      { emitEvent: false },
    );

    this.cdr.markForCheck();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    // Revoke the previous object URL to avoid retaining unused files.
    if (this.selectedFileUrl) {
      URL.revokeObjectURL(this.selectedFileUrl);
    }

    this.selectedFileName = file.name;
    this.selectedFileUrl = URL.createObjectURL(file);

    this.invoiceForm.patchValue({
      attachment: file,
    });

    this.invoiceForm.get('attachment')?.markAsDirty();
    this.cdr.markForCheck();
  }

  RemoveAttachment(): void {
    this.selectedFileName = '';

    if (this.selectedFileUrl) {
      URL.revokeObjectURL(this.selectedFileUrl);
    }

    this.selectedFileUrl = null;

    this.invoiceForm.get('attachment')?.setValue(null);
    this.invoiceForm.get('attachment')?.markAsPristine();
    this.invoiceForm.get('attachment')?.markAsUntouched();

    if (this.fileInputRef) {
      this.fileInputRef.nativeElement.value = '';
    }

    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    if (this.selectedFileUrl) {
      URL.revokeObjectURL(this.selectedFileUrl);
    }

    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
