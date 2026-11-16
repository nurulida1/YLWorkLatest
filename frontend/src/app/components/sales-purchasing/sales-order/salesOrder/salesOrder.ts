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
  FormArray,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { SelectModule } from 'primeng/select';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { AccordionModule } from 'primeng/accordion';
import { MessageService, MenuItem } from 'primeng/api';
import { CheckboxModule } from 'primeng/checkbox';
import { DrawerModule } from 'primeng/drawer';
import { TextareaModule } from 'primeng/textarea';
import { Subject, takeUntil } from 'rxjs';

import { SalesOrderDto } from '../../../../models/SalesOrder';
import { DeliveryOrderService } from '../../../../services/deliveryOrderService';
import { LoadingService } from '../../../../services/loading.service';
import { SalesOrderService } from '../../../../services/SalesOrderService';
import {
  PagingContent,
  GridifyQueryExtend,
  BuildSortText,
  BuildFilterText,
  ValidateAllFormFields,
  resolveAssetUrl,
} from '../../../../shared/helpers/helpers';

@Component({
  selector: 'app-sales-order',
  imports: [
    CommonModule,
    ButtonModule,
    InputTextModule,
    FormsModule,
    TableModule,
    RouterLink,
    DialogModule,
    ReactiveFormsModule,
    DatePickerModule,
    SelectModule,
    InputNumberModule,
    MenuModule,
    DrawerModule,
    TextareaModule,
    CheckboxModule,
    AccordionModule,
  ],
  template: `
    <div
      class="sales-order-page min-h-0 w-full bg-slate-50/70 p-3 sm:p-5 lg:p-7"
    >
      <div class="mx-auto flex w-full flex-col">
        <!-- Breadcrumb -->
        <div class="mb-4 flex items-center gap-2 text-slate-500">
          <a
            routerLink="/dashboard"
            class="transition-colors hover:text-blue-600"
          >
            Dashboard
          </a>
          <i class="pi pi-angle-right text-xs text-slate-400"></i>
          <span class="font-semibold text-slate-800">Sales Orders</span>
        </div>

        <!-- Main Card -->
        <div
          class="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:p-6"
        >
          <!-- Header -->
          <div
            class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
          >
            <div class="min-w-0">
              <h1
                class="text-xl font-bold tracking-tight text-slate-800 sm:text-2xl"
              >
                Sales Orders
              </h1>
              <p class="mt-1 leading-relaxed text-slate-500">
                Manage, track, and process customer sales orders and fulfillment
                statuses.
              </p>
            </div>

            <!-- Toolbar -->
            <div
              class="grid w-full grid-cols-1 gap-2 sm:grid-cols-[minmax(220px,1fr)_auto_auto] lg:w-auto"
            >
              <div class="min-w-0">
                <input
                  type="text"
                  pInputText
                  [(ngModel)]="search"
                  class="w-full rounded-lg border border-slate-300 bg-white px-3! py-2.5! text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Search SO or client PO..."
                  (keydown)="onKeyDown($event)"
                />
              </div>

              <p-button
                label="Export Excel"
                icon="pi pi-file-export"
                severity="secondary"
                [outlined]="true"
                styleClass="w-full whitespace-nowrap rounded-lg! py-2.5! sm:w-auto"
                (onClick)="exportToExcel()"
              ></p-button>

              <p-button
                label="Create Sales Order"
                icon="pi pi-plus"
                severity="info"
                styleClass="w-full whitespace-nowrap rounded-lg! border-none! bg-blue-700! px-4! py-2.5! font-semibold! shadow-sm! hover:bg-blue-800! sm:w-auto"
                (onClick)="ActionClick(null, 'Create')"
              ></p-button>
            </div>
          </div>

          <!-- ========================= -->
          <!-- DESKTOP / TABLET TABLE -->
          <!-- ========================= -->
          <div class="mt-6 hidden min-w-0 md:block">
            <div class="w-full overflow-x-auto">
              <p-table
                #fTable
                dataKey="id"
                [value]="PagingSignal().data || []"
                [paginator]="true"
                [rows]="Query.PageSize"
                [totalRecords]="PagingSignal().totalElements"
                [tableStyle]="{ 'min-width': '1050px', width: '100%' }"
                [showGridlines]="true"
                [rowsPerPageOptions]="[10, 20, 30, 50]"
                [lazy]="true"
                (onLazyLoad)="NextPage($event)"
                styleClass="sales-order-p-table"
              >
                <ng-template #header>
                  <tr>
                    <th
                      pSortableColumn="SalesOrderNo"
                      class="w-[150px] bg-slate-100! px-4 py-3.5 text-left! text-sm! font-bold! uppercase! tracking-wider! text-slate-600!"
                    >
                      <div class="flex items-center gap-2">
                        SO Number
                        <p-sortIcon field="SalesOrderNo" />
                      </div>
                    </th>

                    <th
                      class="min-w-[220px] bg-slate-100! px-4 py-3.5 text-left! text-sm! font-bold! uppercase! tracking-wider! text-slate-600!"
                    >
                      Client
                    </th>

                    <th
                      pSortableColumn="SODate"
                      class="w-[130px] bg-slate-100! px-4 py-3.5 text-center! text-sm! font-bold! uppercase! tracking-wider! text-slate-600!"
                    >
                      <div class="flex items-center justify-center gap-2">
                        Order Date
                        <p-sortIcon field="SODate" />
                      </div>
                    </th>

                    <th
                      class="w-[150px] bg-slate-100! px-4 py-3.5 text-center! text-sm! font-bold! uppercase! tracking-wider! text-slate-600!"
                    >
                      Client PO
                    </th>

                    <th
                      class="w-[150px] bg-slate-100! px-4 py-3.5 text-center! text-sm! font-bold! uppercase! tracking-wider! text-slate-600!"
                    >
                      PO Received
                    </th>

                    <th
                      class="w-[150px] bg-slate-100! px-4 py-3.5 text-right! text-sm! font-bold! uppercase! tracking-wider! text-slate-600!"
                    >
                      Total Amount
                    </th>

                    <th
                      pSortableColumn="Status"
                      class="w-[150px] bg-slate-100! px-4 py-3.5 text-center! text-sm! font-bold! uppercase! tracking-wider! text-slate-600!"
                    >
                      <div class="flex items-center justify-center gap-2">
                        Status
                        <p-sortIcon field="Status" />
                      </div>
                    </th>

                    <th
                      class="w-[90px] bg-slate-100! px-4 py-3.5 text-center! text-sm! font-bold! uppercase! tracking-wider! text-slate-600!"
                    >
                      Actions
                    </th>
                  </tr>
                </ng-template>

                <ng-template #body let-data>
                  <tr class="transition-colors hover:bg-slate-50/80">
                    <td class="whitespace-nowrap px-4 py-3.5">
                      <span class="font-bold text-blue-700">
                        {{ data.salesOrderNo }}
                      </span>
                    </td>

                    <td class="px-4 py-3.5">
                      <p
                        class="max-w-[280px] truncate font-semibold text-slate-800"
                      >
                        {{ data.client?.name || '-' }}
                      </p>
                    </td>

                    <td
                      class="whitespace-nowrap px-4 py-3.5 text-center! text-slate-600"
                    >
                      {{ data.soDate | date: 'dd/MM/yyyy' }}
                    </td>

                    <td
                      class="whitespace-nowrap px-4 py-3.5 text-center! font-medium text-slate-700"
                    >
                      {{ data.clientPONumber || '-' }}
                    </td>

                    <td
                      class="whitespace-nowrap px-4 py-3.5 text-center! text-slate-600"
                    >
                      {{
                        data.clientPODate
                          ? (data.clientPODate | date: 'dd/MM/yyyy')
                          : '-'
                      }}
                    </td>

                    <td
                      class="whitespace-nowrap px-4 py-3.5 text-right! font-semibold text-slate-800"
                    >
                      {{ data.totalAmount | currency: 'RM ' }}
                    </td>

                    <td class="px-4 py-3.5 text-center!">
                      <span [ngClass]="getStatusClass(data.status)">
                        <span
                          class="h-1.5 w-1.5 shrink-0 rounded-full"
                          [ngClass]="getStatusDotClass(data.status)"
                        ></span>
                        {{ data.status }}
                      </span>

                      <p
                        *ngIf="
                          data.status === 'Rejected' && getRejectedReason(data)
                        "
                        class="mx-auto mt-1 max-w-[180px] truncate italic text-slate-500"
                        [title]="getRejectedReason(data) || ''"
                      >
                        {{ getRejectedReason(data) }}
                      </p>
                    </td>

                    <td class="px-4 py-3.5 text-center!">
                      <button
                        type="button"
                        (click)="onEllipsisClick($event, data, menu)"
                        class="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Sales order actions"
                      >
                        <i class="pi pi-ellipsis-h"></i>
                      </button>
                    </td>
                  </tr>
                </ng-template>

                <ng-template #emptymessage>
                  <tr>
                    <td colspan="8" class="py-14 text-center">
                      <div class="flex flex-col items-center gap-2">
                        <div
                          class="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100"
                        >
                          <i
                            class="pi pi-folder-open text-2xl text-slate-400"
                          ></i>
                        </div>
                        <p class="font-semibold text-slate-700">
                          No sales orders found
                        </p>
                        <p class="text-sm text-slate-400">
                          Try adjusting your search or create a new sales order.
                        </p>
                      </div>
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            </div>
          </div>

          <!-- ========================= -->
          <!-- MOBILE CARD LAYOUT -->
          <!-- ========================= -->
          <div class="mt-5 space-y-3 md:hidden">
            <ng-container *ngIf="PagingSignal().data?.length; else mobileEmpty">
              <div
                *ngFor="let data of PagingSignal().data; trackBy: trackById"
                class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                <!-- Card Header -->
                <div
                  class="flex items-start justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3"
                >
                  <div class="min-w-0">
                    <p
                      class="text-[10px] font-bold uppercase tracking-wider text-slate-400"
                    >
                      Sales Order Number
                    </p>
                    <p class="mt-1 break-all text-sm font-bold text-blue-700">
                      {{ data.salesOrderNo }}
                    </p>
                  </div>

                  <button
                    type="button"
                    (click)="onEllipsisClick($event, data, menu)"
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                    aria-label="Sales order actions"
                  >
                    <i class="pi pi-ellipsis-v"></i>
                  </button>
                </div>

                <!-- Card Content -->
                <div class="space-y-3 p-4">
                  <div>
                    <p
                      class="text-[10px] font-bold uppercase tracking-wider text-slate-400"
                    >
                      Client
                    </p>
                    <p
                      class="mt-1 text-sm font-semibold leading-relaxed text-slate-800"
                    >
                      {{ data.client?.name || '-' }}
                    </p>
                  </div>

                  <div class="grid grid-cols-2 gap-3">
                    <div class="min-w-0">
                      <p
                        class="text-[10px] font-bold uppercase tracking-wider text-slate-400"
                      >
                        Order Date
                      </p>
                      <p class="mt-1 text-sm font-medium text-slate-700">
                        {{ data.soDate | date: 'dd/MM/yyyy' }}
                      </p>
                    </div>

                    <div class="min-w-0">
                      <p
                        class="text-[10px] font-bold uppercase tracking-wider text-slate-400"
                      >
                        PO Received
                      </p>
                      <p class="mt-1 text-sm font-medium text-slate-700">
                        {{
                          data.clientPODate
                            ? (data.clientPODate | date: 'dd/MM/yyyy')
                            : '-'
                        }}
                      </p>
                    </div>

                    <div class="min-w-0">
                      <p
                        class="text-[10px] font-bold uppercase tracking-wider text-slate-400"
                      >
                        Client PO Number
                      </p>
                      <p
                        class="mt-1 break-words text-sm font-medium text-slate-700"
                      >
                        {{ data.clientPONumber || '-' }}
                      </p>
                    </div>

                    <div class="min-w-0">
                      <p
                        class="text-[10px] font-bold uppercase tracking-wider text-slate-400"
                      >
                        Total Amount
                      </p>
                      <p class="mt-1 text-sm font-bold text-slate-900">
                        {{ data.totalAmount | currency: 'RM ' }}
                      </p>
                    </div>
                  </div>

                  <div
                    class="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3"
                  >
                    <div>
                      <p
                        class="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400"
                      >
                        Status
                      </p>
                      <span [ngClass]="getStatusClass(data.status)">
                        <span
                          class="h-1.5 w-1.5 shrink-0 rounded-full"
                          [ngClass]="getStatusDotClass(data.status)"
                        ></span>
                        {{ data.status }}
                      </span>
                    </div>

                    <div
                      *ngIf="data.clientPOAttachment"
                      class="flex items-center gap-1.5 text-xs font-medium text-blue-600"
                    >
                      <i class="pi pi-paperclip"></i>
                      PO attached
                    </div>
                  </div>

                  <p
                    *ngIf="
                      data.status === 'Rejected' && getRejectedReason(data)
                    "
                    class="rounded-lg bg-rose-50 px-3 py-2 text-xs leading-relaxed text-rose-700"
                  >
                    <span class="font-semibold">Reason:</span>
                    {{ getRejectedReason(data) }}
                  </p>
                </div>
              </div>
            </ng-container>

            <ng-template #mobileEmpty>
              <div
                class="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-4 py-12 text-center"
              >
                <div
                  class="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100"
                >
                  <i class="pi pi-folder-open text-2xl text-slate-400"></i>
                </div>
                <p class="mt-3 font-semibold text-slate-700">
                  No sales orders found
                </p>
                <p class="mt-1 text-sm text-slate-400">
                  Try adjusting your search or create a new sales order.
                </p>
              </div>
            </ng-template>

            <!-- Mobile Pagination -->
            <div
              *ngIf="PagingSignal().totalElements > 0"
              class="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3"
            >
              <p-button
                icon="pi pi-chevron-left"
                severity="secondary"
                [outlined]="true"
                [disabled]="Query.Page <= 1"
                styleClass="h-9! w-9! rounded-lg!"
                (onClick)="changeMobilePage(-1)"
              ></p-button>

              <div class="min-w-0 text-center">
                <p class="text-xs font-semibold text-slate-700">
                  Page {{ Query.Page }} of {{ totalPages }}
                </p>
                <p class="mt-0.5 text-[10px] text-slate-400">
                  {{ PagingSignal().totalElements }} sales orders
                </p>
              </div>

              <p-button
                icon="pi pi-chevron-right"
                severity="secondary"
                [outlined]="true"
                [disabled]="Query.Page >= totalPages"
                styleClass="h-9! w-9! rounded-lg!"
                (onClick)="changeMobilePage(1)"
              ></p-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Shared Action Menu -->
    <p-menu #menu [model]="menuItems" [popup]="true"></p-menu>

    <!-- Record / Update Sales Order Dialog -->
    <p-dialog
      [(visible)]="displayDialog"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: 'min(96vw, 780px)' }"
      [breakpoints]="{
        '960px': '94vw',
        '640px': '96vw',
      }"
      styleClass="sales-order-dialog overflow-hidden rounded-2xl! shadow-2xl"
      [maskStyle]="{
        'overflow-y': 'auto',
        'background-color': 'rgba(15, 23, 42, 0.4)',
        'backdrop-filter': 'blur(4px)',
      }"
      appendTo="body"
    >
      <ng-template #headless>
        <!-- Dialog Header -->
        <div
          class="flex items-start justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-4 sm:px-6 sm:py-5"
        >
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700"
              >
                <i class="pi pi-file-edit"></i>
              </div>
              <h2
                class="text-lg font-bold tracking-tight text-slate-900 sm:text-xl"
              >
                {{
                  FG.get('id')?.value
                    ? 'Update Sales Order'
                    : 'Record Sales Order'
                }}
              </h2>
            </div>
            <p class="mt-2 text-xs leading-relaxed text-slate-500 sm:text-sm">
              Record and manage the official purchase order received from the
              client.
            </p>
          </div>

          <p-button
            icon="pi pi-times"
            [rounded]="true"
            [text]="true"
            severity="secondary"
            styleClass="shrink-0 text-slate-400 hover:bg-slate-200!"
            (onClick)="closeDialog()"
          ></p-button>
        </div>

        <!-- Dialog Body -->
        <div
          class="sales-order-dialog-body max-h-[70vh] overflow-y-auto p-4 sm:max-h-[75vh] sm:p-6"
        >
          <div
            [formGroup]="FG"
            class="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2"
          >
            <!-- SO Number -->
            <div class="flex min-w-0 flex-col gap-1.5">
              <label class="form-label">SO Number</label>
              <input
                type="text"
                pInputText
                formControlName="salesOrderNo"
                placeholder="System generated if left blank"
                class="form-input bg-slate-50!"
              />
            </div>

            <!-- SO Date -->
            <div class="flex min-w-0 flex-col gap-1.5">
              <label class="form-label">
                SO Date <span class="text-rose-500">*</span>
              </label>
              <p-datepicker
                formControlName="soDate"
                dateFormat="dd/mm/yy"
                styleClass="w-full"
                inputStyleClass="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                appendTo="body"
                [showIcon]="true"
                placeholder="Select order date"
              ></p-datepicker>
            </div>

            <!-- Client PO Number -->
            <div class="flex min-w-0 flex-col gap-1.5">
              <label class="form-label">
                Client PO Number <span class="text-rose-500">*</span>
              </label>
              <input
                type="text"
                pInputText
                formControlName="clientPONumber"
                placeholder="e.g. PO-2026-001"
                class="form-input"
              />
            </div>

            <!-- PO Received Date -->
            <div class="flex min-w-0 flex-col gap-1.5">
              <label class="form-label">PO Received Date</label>
              <p-datepicker
                formControlName="clientPODate"
                dateFormat="dd/mm/yy"
                styleClass="w-full"
                inputStyleClass="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                appendTo="body"
                [showIcon]="true"
                placeholder="Select receive date"
              ></p-datepicker>
            </div>

            <!-- Quotation -->
            <div class="flex min-w-0 flex-col gap-1.5">
              <label class="form-label">Quotation Reference</label>
              <p-select
                [options]="quotationSelections"
                appendTo="body"
                [filter]="true"
                [showClear]="!!FG.get('quotationId')?.value"
                formControlName="quotationId"
                styleClass="w-full rounded-lg border border-slate-300"
                placeholder="Link a quotation"
              ></p-select>
            </div>

            <!-- Client -->
            <div class="flex min-w-0 flex-col gap-1.5">
              <label class="form-label">
                Client Account <span class="text-rose-500">*</span>
              </label>
              <p-select
                [options]="clientSelections"
                appendTo="body"
                [filter]="true"
                [showClear]="!!FG.get('clientId')?.value"
                formControlName="clientId"
                styleClass="w-full rounded-lg border border-slate-300"
                placeholder="Select a client account"
              ></p-select>
            </div>

            <!-- Total Amount -->
            <div class="flex min-w-0 flex-col gap-1.5">
              <label class="form-label">Total Value (Gross)</label>
              <p-inputnumber
                formControlName="totalAmount"
                styleClass="w-full"
                inputStyleClass="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-medium"
                mode="currency"
                currency="MYR"
                locale="ms-MY"
                [minFractionDigits]="2"
                placeholder="RM 0.00"
              ></p-inputnumber>
            </div>

            <!-- Payment Terms -->
            <div class="flex min-w-0 flex-col gap-1.5">
              <label class="form-label">
                Payment Terms <span class="text-rose-500">*</span>
              </label>
              <input
                type="text"
                pInputText
                formControlName="paymentTerms"
                placeholder="e.g. 30 Days, COD, Net 60"
                class="form-input"
              />
            </div>

            <!-- Internal Remarks -->
            <div class="flex min-w-0 flex-col gap-1.5 sm:col-span-2">
              <label class="form-label">Internal Remarks</label>
              <textarea
                pTextarea
                formControlName="remarks"
                rows="3"
                [autoResize]="true"
                placeholder="Add any internal processing notes..."
                class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              ></textarea>
            </div>

            <!-- Attachment -->
            <div
              class="flex min-w-0 flex-col gap-3 border-t border-slate-100 pt-5 sm:col-span-2"
            >
              <div>
                <label class="form-label">
                  Official Client PO Attachment
                  <span class="text-rose-500">*</span>
                </label>
                <p class="mt-1 text-xs text-slate-400">
                  Upload the official purchase order document received from the
                  client.
                </p>
              </div>

              <input
                #file
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                (change)="onFileSelected($event)"
                hidden
              />

              <div
                class="flex min-w-0 flex-col gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div class="flex min-w-0 items-center gap-3">
                  <div
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600"
                  >
                    <i class="pi pi-file text-lg"></i>
                  </div>

                  <div class="min-w-0">
                    <p class="truncate text-sm font-semibold text-slate-700">
                      {{ selectedFileName || 'No document selected' }}
                    </p>
                    <p class="text-xs text-slate-400">
                      PDF, DOC, DOCX or image
                    </p>
                  </div>
                </div>

                <p-button
                  [label]="
                    FG.get('clientPOAttachment')?.value
                      ? 'Replace Document'
                      : 'Upload Document'
                  "
                  severity="secondary"
                  icon="pi pi-upload"
                  styleClass="w-full whitespace-nowrap rounded-lg! sm:w-auto"
                  (onClick)="file.click()"
                ></p-button>
              </div>

              <a
                *ngIf="selectedFileUrl && selectedFileName"
                [href]="selectedFileUrl"
                [download]="selectedFileName"
                target="_blank"
                rel="noopener noreferrer"
                class="flex min-w-0 items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                <i class="pi pi-external-link shrink-0"></i>
                <span class="truncate">{{ selectedFileName }}</span>
              </a>
            </div>
          </div>
        </div>

        <!-- Dialog Footer -->
        <div
          class="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:px-6"
        >
          <p-button
            label="Cancel"
            severity="secondary"
            [outlined]="true"
            styleClass="w-full rounded-lg! px-5! py-2.5! sm:w-auto"
            (onClick)="closeDialog()"
          ></p-button>

          <p-button
            [label]="FG.get('id')?.value ? 'Save Changes' : 'Record Order'"
            [icon]="FG.get('id')?.value ? 'pi pi-save' : 'pi pi-check-circle'"
            severity="info"
            styleClass="w-full rounded-lg! border-none! bg-blue-700! px-5! py-2.5! font-semibold! shadow-sm! hover:bg-blue-800! sm:w-auto"
            (onClick)="saveRecord()"
          ></p-button>
        </div>
      </ng-template>
    </p-dialog>
  `,
  styleUrl: './salesOrder.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesOrder implements OnInit, OnDestroy {
  @ViewChild('fTable') fTable?: Table;

  private readonly salesOrderService = inject(SalesOrderService);
  private readonly deliveryOrderService = inject(DeliveryOrderService);
  private readonly loadingService = inject(LoadingService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);

  protected ngUnsubscribe = new Subject<void>();

  PagingSignal = signal<PagingContent<SalesOrderDto>>(
    {} as PagingContent<SalesOrderDto>,
  );

  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  search = '';
  selectedFileName = '';
  selectedFileUrl: string | null = null;

  displayDialog = false;

  FG!: FormGroup;

  menuItems: MenuItem[] = [];

  companySelections: any[] = [];
  quotationSelections: any[] = [];
  clientSelections: any[] = [];

  selectedSO: any;
  selectedDOItems: any[] = [];

  paymentForm = {
    invoiceId: '',
    clientId: '',
    referenceNo: '',
    paymentDate: new Date(),
    paymentMode: 'Bank Transfer',
    amount: 0,
    notes: '',
  };

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 10;
    this.Query.Filter = null;
    this.Query.OrderBy = 'CreatedAt desc';
    this.Query.Select = null;
    this.Query.Includes =
      'Client.BillingAddress,Client.DeliveryAddress,Company.DeliveryAddress,SalesOrderItems,SalesOrderStatusHistories,Quotation';
  }

  ngOnInit(): void {}

  get totalPages(): number {
    const total = this.PagingSignal().totalElements || 0;
    return Math.max(1, Math.ceil(total / (this.Query.PageSize || 10)));
  }

  trackById(index: number, item: SalesOrderDto): string {
    return item.id;
  }

  getStatusClass(status: string): string {
    const base =
      'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold';

    const classes: Record<string, string> = {
      Draft: 'border-amber-200 bg-amber-50 text-amber-700',
      Reviewed: 'border-orange-200 bg-orange-50 text-orange-700',
      Approved: 'border-blue-200 bg-blue-50 text-blue-700',
      InProgress: 'border-blue-200 bg-blue-50 text-blue-700',
      Sent: 'border-purple-200 bg-purple-50 text-purple-700',
      Issued: 'border-purple-200 bg-purple-50 text-purple-700',
      PartiallyReceived: 'border-cyan-200 bg-cyan-50 text-cyan-700',
      PartiallyShipped: 'border-cyan-200 bg-cyan-50 text-cyan-700',
      Confirmed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      Rejected: 'border-rose-200 bg-rose-50 text-rose-700',
      Cancelled: 'border-rose-200 bg-rose-50 text-rose-700',
    };

    return `${base} ${classes[status] || 'border-slate-200 bg-slate-100 text-slate-600'}`;
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

    return classes[status] || 'bg-slate-400';
  }

  parseDONo(no: string) {
    const parts = no.split('/');

    return {
      prefix: `${parts[0]}/${parts[1]}`,
      number: parseInt(parts[2] || '0', 10),
      year: parts[3],
    };
  }

  buildDONo(prefix: string, number: number, year: string) {
    return `${prefix}/${number}/${year}`;
  }

  GetData() {
    this.loadingService.start();

    this.salesOrderService
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

  changeMobilePage(direction: number) {
    const nextPage = this.Query.Page + direction;

    if (nextPage < 1 || nextPage > this.totalPages) return;

    this.Query.Page = nextPage;
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
      SalesOrderNo: [
        {
          value: data,
          matchMode: '=',
          operator: 'and',
        },
      ],
      ClientPONumber: [
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
      rows: this.Query.PageSize,
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
    this.Query.Page = 1;
    this.GetData();
  }

  ActionClick(data: SalesOrderDto | null, action: string) {
    switch (action) {
      case 'Create':
        this.clearSelectedFile();
        this.getDropdown();
        this.initForm();
        this.generateSONo();

        this.displayDialog = true;
        this.cdr.markForCheck();
        break;

      case 'Update':
        this.clearSelectedFile();
        this.getDropdown();
        this.initForm();
        this.displayDialog = true;

        setTimeout(() => {
          if (!data) return;

          if (data.clientPOAttachment) {
            const cleanPath = data.clientPOAttachment.replace(/\\/g, '/');
            this.selectedFileName = cleanPath.split('/').pop() || '';
            this.selectedFileUrl = resolveAssetUrl(cleanPath);
          }

          this.FG.patchValue({
            ...data,
            soDate: data.soDate ? new Date(data.soDate) : null,
            clientPODate: data.clientPODate
              ? new Date(data.clientPODate)
              : null,
          });

          const fa = this.FG.get('salesOrderItems') as FormArray;
          fa.clear();

          if (data.salesOrderItems?.length) {
            data.salesOrderItems.forEach((item: any) => {
              fa.push(this.buildItemGroup(item));
            });
          }

          this.cdr.markForCheck();
        }, 100);

        break;

      case 'Review':
        if (!data) return;

        this.router.navigate(['/sales-order/reviews'], {
          queryParams: { id: data.id },
        });
        break;

      case 'View':
        if (!data) return;

        this.router.navigate(['/sales-order/details'], {
          queryParams: { id: data.id },
        });
        break;
    }
  }

  private buildItemGroup(item: any): FormGroup {
    return new FormGroup({
      id: new FormControl(item.id ?? null),
      sortOrder: new FormControl(item.sortOrder ?? 0),
      type: new FormControl(item.type ?? ''),
      isGroup: new FormControl(item.isGroup ?? false),
      description: new FormControl(item.description ?? ''),
      unit: new FormControl(item.unit ?? ''),
      quantity: new FormControl(item.quantity ?? 0),
      unitPrice: new FormControl(item.unitPrice ?? 0),
      totalPrice: new FormControl(item.totalPrice ?? 0),
      children: new FormControl(item.children ?? []),
    });
  }

  initForm() {
    this.FG = new FormGroup({
      id: new FormControl<string | null>({
        value: null,
        disabled: true,
      }),
      salesOrderNo: new FormControl<string | null>(null),
      companyId: new FormControl<string | null>(null),
      clientId: new FormControl<string | null>(null, Validators.required),
      projectId: new FormControl<string | null>(null),
      quotationId: new FormControl<string | null>(null),
      soDate: new FormControl<Date | null>(new Date(), Validators.required),
      totalAmount: new FormControl<number | null>(null),
      remarks: new FormControl<string | null>(null),
      paymentTerms: new FormControl<string | null>(null, Validators.required),
      clientPOAttachment: new FormControl<File | string | null>(
        null,
        Validators.required,
      ),
      clientPODate: new FormControl<Date | null>(null),
      clientPONumber: new FormControl<string | null>(null, Validators.required),
      salesOrderItems: new FormArray([]),
    });

    this.FG.get('quotationId')
      ?.valueChanges.pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((res) => {
        const selectedQuotation = this.quotationSelections.find(
          (x) => x.value === res,
        );

        if (!selectedQuotation) return;

        this.FG.patchValue({
          clientId: selectedQuotation.clientId,
          companyId: selectedQuotation.fromCompanyId,
          totalAmount: selectedQuotation.totalAmount,
        });

        const itemsFA = this.FG.get('salesOrderItems') as FormArray;
        itemsFA.clear();

        const items = selectedQuotation.items || [];
        this.buildItems(items, itemsFA);

        this.cdr.markForCheck();
      });
  }

  buildItems(items: any[], formArray: FormArray) {
    items.forEach((item) => {
      const group = new FormGroup({
        id: new FormControl(item.id ?? null),
        sortOrder: new FormControl(item.sortOrder),
        type: new FormControl(item.type),
        isGroup: new FormControl(item.isGroup),
        description: new FormControl(item.description),
        unit: new FormControl(item.unit),
        quantity: new FormControl(item.quantity),
        unitPrice: new FormControl(item.unitPrice),
        totalPrice: new FormControl(item.totalPrice),
        children: new FormArray([]),
      });

      const childrenFA = group.get('children') as FormArray;

      if (item.children?.length) {
        this.buildItems(item.children, childrenFA);
      }

      formArray.push(group);
    });
  }

  generateSONo() {
    this.salesOrderService
      .GenerateNo()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.FG.get('salesOrderNo')?.setValue(res.salesOrderNo);
          this.cdr.markForCheck();
        },
      });
  }

  getDropdown() {
    this.salesOrderService
      .GetDropdown()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.companySelections = res.companies.map((q: any) => ({
            label: q.name,
            value: q.id,
          }));

          this.clientSelections = res.clients.map((q: any) => ({
            label: q.name,
            value: q.id,
          }));

          this.quotationSelections = res.quotations.map((q: any) => ({
            label: q.quotationNo,
            value: q.id,
            fromCompanyId: q.fromCompanyId,
            totalAmount: q.totalAmount,
            clientId: q.clientId,
            items: q.items,
          }));

          this.cdr.markForCheck();
        },
      });
  }

  onEllipsisClick(event: Event, so: SalesOrderDto, menu: any) {
    this.menuItems = [];

    if (so.status === 'Draft') {
      this.menuItems.push(
        {
          label: 'Update',
          icon: 'pi pi-pencil',
          command: () => this.ActionClick(so, 'Update'),
        },
        {
          label: 'Review',
          icon: 'pi pi-file-edit',
          command: () => this.ActionClick(so, 'Review'),
        },
      );
    } else if (so.status === 'Confirmed' || so.status === 'InProgress') {
      this.menuItems.push({
        label: 'View Details',
        icon: 'pi pi-eye',
        command: () => this.ActionClick(so, 'View'),
      });
    }

    if (so.clientPOAttachment) {
      this.menuItems.push({
        label: 'Download File',
        icon: 'pi pi-file',
        command: () => this.downloadAttachment(so, 'SO'),
      });
    }

    menu.toggle(event);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    this.clearSelectedFile();

    this.selectedFileName = file.name;
    this.selectedFileUrl = URL.createObjectURL(file);

    this.FG.patchValue({
      clientPOAttachment: file,
    });

    this.FG.get('clientPOAttachment')?.updateValueAndValidity();
    this.cdr.markForCheck();

    input.value = '';
  }

  private clearSelectedFile() {
    if (this.selectedFileUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(this.selectedFileUrl);
    }

    this.selectedFileName = '';
    this.selectedFileUrl = null;
  }

  closeDialog() {
    this.displayDialog = false;
    this.clearSelectedFile();
  }

  saveRecord() {
    if (!this.FG.valid) {
      ValidateAllFormFields(this.FG);
      return;
    }

    this.loadingService.start();

    const formData = new FormData();

    Object.keys(this.FG.controls).forEach((key) => {
      let value = this.FG.get(key)?.value;

      if (value === null || value === undefined) return;

      if (value instanceof Date) {
        value = value.toISOString();
      }

      if (key === 'salesOrderItems') {
        formData.append(key, JSON.stringify(value));
        return;
      }

      if (value instanceof File) {
        formData.append(key, value, value.name);
        return;
      }

      // Do not send the existing attachment URL as a file.
      if (key === 'clientPOAttachment' && typeof value === 'string') {
        formData.append(key, value);
        return;
      }

      formData.append(key, String(value));
    });

    const id = this.FG.get('id')?.value;

    if (id) {
      formData.append('id', id);
    }

    const request$ = id
      ? this.salesOrderService.Update(formData)
      : this.salesOrderService.Create(formData);

    request$.pipe(takeUntil(this.ngUnsubscribe)).subscribe({
      next: (res: any) => {
        this.loadingService.stop();

        if (res?.success === false) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Duplicate SO',
            detail: res.message,
          });
          return;
        }

        if (id) {
          const current = this.PagingSignal();

          const updated = (current.data || []).map((item) =>
            item.id === id ? res : item,
          );

          this.PagingSignal.set({
            ...current,
            data: updated,
          });

          this.messageService.add({
            severity: 'success',
            summary: 'Updated',
            detail: `SO: ${res.salesOrderNo} updated successfully`,
          });
        } else {
          this.PagingSignal.update((state) => ({
            ...state,
            data: [res, ...(state.data || [])],
            totalElements: (state.totalElements || 0) + 1,
          }));

          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `SO: ${res.salesOrderNo} recorded successfully`,
          });
        }

        this.displayDialog = false;
        this.resetForm();
        this.cdr.markForCheck();
      },

      error: (err) => {
        this.loadingService.stop();

        const message =
          err?.error?.message ||
          err?.error?.Error ||
          'Check console for details';

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: message,
        });
      },
    });
  }

  resetForm() {
    this.FG.reset({
      soDate: new Date(),
      clientPODate: null,
    });

    this.clearSelectedFile();
    this.FG.get('id')?.disable();
  }

  downloadAttachment(data: any, type: 'SO' | 'Q' = 'SO') {
    const rawPath = data.clientPOAttachment || data.attachmentPath;

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
        const fallbackPrefix = type === 'SO' ? 'SO-Doc' : 'Quotation-Doc';
        const documentNo =
          data.salesOrderNo || data.quotationNo || fallbackPrefix;

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

  getRejectedReason(data: SalesOrderDto): string | null {
    if (!data.salesOrderStatusHistories?.length) return null;

    const rejectedHistory = data.salesOrderStatusHistories
      .filter((x: any) => x.status === 'Rejected')
      .sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0];

    return rejectedHistory?.remarks || null;
  }

  exportToExcel() {
    this.salesOrderService.ExportToExcel().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = `SO_${new Date().getTime()}.xlsx`;

        link.click();
        window.URL.revokeObjectURL(url);
      },
    });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();

    this.clearSelectedFile();
    this.loadingService.stop();
  }
}
