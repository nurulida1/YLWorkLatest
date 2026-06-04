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
import { SalesOrderService } from '../../../services/SalesOrderService';
import { LoadingService } from '../../../services/loading.service';
import { MenuItem, MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import {
  BuildFilterText,
  BuildSortText,
  GridifyQueryExtend,
  PagingContent,
  ValidateAllFormFields,
} from '../../../shared/helpers/helpers';
import { SalesOrderDto } from '../../../models/SalesOrder';
import { DrawerModule } from 'primeng/drawer';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { BulkDORequest } from '../../../models/DeliveryOrder';

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
    DatePickerModule,
  ],
  template: `<div
      class="w-full min-h-[92.9vh] flex flex-col p-6 bg-slate-50/50"
    >
      <div class="flex flex-row items-center gap-1 text-gray-500 tracking-wide">
        <div
          [routerLink]="'/dashboard'"
          class="cursor-pointer hover:text-blue-600 transition-colors"
        >
          Dashboard
        </div>
        <span class="text-gray-400">/</span>
        <div class="text-gray-800 font-medium">Sales Orders</div>
      </div>

      <div
        class="mt-3 border border-gray-200 rounded-md tracking-wide bg-white p-5 flex flex-col"
      >
        <div
          class="flex flex-col gap-3 xl:gap-0 xl:flex-row xl:items-center justify-between"
        >
          <div class="flex flex-col gap-0.5">
            <div class="text-[18px] text-gray-700 font-semibold">
              Sales Orders
            </div>
            <div class="text-gray-500">
              Manage, track, and process customer sales orders and fulfillment
              statuses
            </div>
          </div>

          <div class="flex flex-row items-center gap-3">
            <div class="w-full lg:w-[260px] relative">
              <input
                type="text"
                pInputText
                [(ngModel)]="search"
                class="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Search by SO No..."
                (keydown)="onKeyDown($event)"
              />
              <!-- <i
                class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
              ></i> -->
            </div>

            <p-button
              label="Create Sales Order"
              (onClick)="ActionClick(null, 'Create')"
              icon="pi pi-plus"
              severity="info"
              styleClass="py-2 px-4 text-sm font-medium whitespace-nowrap shadow-sm rounded-lg"
            ></p-button>
          </div>
        </div>

        <div class="mt-4">
          <p-table
            #fTable
            dataKey="id"
            [value]="PagingSignal().data"
            [paginator]="true"
            [rows]="Query.PageSize"
            [totalRecords]="PagingSignal().totalElements"
            [tableStyle]="{ 'min-width': '90rem' }"
            [showGridlines]="true"
            [rowsPerPageOptions]="[10, 20, 30, 50]"
            [lazy]="true"
            (onLazyLoad)="NextPage($event)"
          >
            <ng-template #header>
              <tr class="border-b border-gray-200 bg-gray-50/70">
                <th
                  pSortableColumn="SalesOrderNo"
                  class="bg-gray-100! text-left! py-3.5 px-4 font-semibold text-gray-600 tracking-wider w-[10%]"
                >
                  <div class="flex items-center gap-1.5">
                    <span>SO Number</span>
                    <p-sortIcon field="SalesOrderNo" class="text-gray-400" />
                  </div>
                </th>
                <th
                  class="bg-gray-100! text-left! py-3.5 px-4 font-semibold text-gray-600 tracking-wider w-[25%]"
                >
                  Client
                </th>
                <th
                  pSortableColumn="SODate"
                  class="bg-gray-100! text-center! py-3.5 px-4 font-semibold text-gray-600 tracking-wider w-[10%]"
                >
                  <div class="flex justify-center items-center gap-1.5">
                    <span>Order Date</span>
                    <p-sortIcon field="SODate" class="text-gray-400" />
                  </div>
                </th>

                <th
                  class="bg-gray-100! text-center! py-3.5 px-4 font-semibold text-gray-600 tracking-wider w-[10%]"
                >
                  Client PO
                </th>

                <th
                  class="bg-gray-100! text-center! py-3.5 px-4 font-semibold text-gray-600 tracking-wider w-[12%]"
                >
                  PO Received Date
                </th>

                <th
                  class="bg-gray-100! text-center! py-3.5 px-4 font-semibold text-gray-600 tracking-wider w-[10%]"
                >
                  Total Amount
                </th>
                <th
                  pSortableColumn="Status"
                  class="bg-gray-100! text-center! py-3.5 px-4 font-semibold text-gray-600 tracking-wider w-[10%]"
                >
                  <div class="flex items-center justify-center gap-1.5">
                    <span>Status</span>
                    <p-sortIcon field="Status" class="text-gray-400" />
                  </div>
                </th>
                <th
                  class="bg-gray-100! text-center! py-3.5 px-4 font-semibold text-gray-600 tracking-wider w-[8%]"
                >
                  Actions
                </th>
              </tr>
            </ng-template>

            <ng-template #body let-data let-rowIndex="rowIndex">
              <tr
                class="hover:bg-slate-50/80 border-b border-gray-100 transition-colors"
              >
                <td class="py-3 px-4 font-semibold text-blue-600">
                  {{ data.salesOrderNo }}
                </td>
                <td class="py-3 px-4 text-gray-700 font-medium">
                  {{ data.client?.name }}
                </td>
                <td class="py-3 px-4 text-center! text-gray-600">
                  {{ data.soDate | date: 'dd/MM/yyyy' }}
                </td>
                <td class="py-3 px-4 text-center! text-gray-700 font-medium">
                  {{ data.clientPONumber || '-' }}
                </td>

                <td class="py-3 px-4 text-center! text-gray-600">
                  {{ data.clientPODate | date: 'dd/MM/yyyy' }}
                </td>
                <td class="py-3 px-4 text-center! font-medium text-gray-900">
                  {{ data.totalAmount | currency: 'RM ' }}
                </td>
                <td class="py-3 px-4 text-center">
                  <div class="flex flex-col items-center gap-1">
                    <span
                      class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold text-sm"
                      [ngClass]="{
                        'bg-amber-100 text-amber-700 border border-amber-200':
                          data.status === 'Draft',
                        'bg-orange-100 text-orange-700 border border-orange-200':
                          data.status === 'Reviewed',
                        'bg-blue-100 text-blue-700 border border-blue-200':
                          data.status === 'Approved' ||
                          data.status === 'InProgress',
                        'bg-purple-100 text-purple-700 border border-purple-200':
                          data.status === 'Sent' || data.status === 'Issued',
                        'bg-cyan-100 text-cyan-700 border border-cyan-200':
                          data.status === 'PartiallyReceived' ||
                          data.status === 'PartiallyShipped',
                        'bg-emerald-100 text-emerald-700 border border-emerald-200':
                          data.status === 'Confirmed',
                        'bg-rose-100 text-rose-700 border border-rose-200':
                          data.status === 'Rejected' ||
                          data.status === 'Cancelled',
                      }"
                    >
                      <span
                        class="w-1.5 h-1.5 rounded-full"
                        [ngClass]="{
                          'bg-amber-500': data.status === 'Draft',
                          'bg-orange-500': data.status === 'Reviewed',
                          'bg-blue-500':
                            data.status === 'Approved' ||
                            data.status === 'InProgress',
                          'bg-purple-500':
                            data.status === 'Sent' || data.status === 'Issued',
                          'bg-cyan-500':
                            data.status === 'PartiallyReceived' ||
                            data.status === 'PartiallyShipped',
                          'bg-emerald-500': data.status === 'Confirmed',
                          'bg-rose-500':
                            data.status === 'Rejected' ||
                            data.status === 'Cancelled',
                        }"
                      ></span>

                      {{ data.status }}
                    </span>

                    <small
                      *ngIf="
                        data.status === 'Rejected' && getRejectedReason(data)
                      "
                      class="text-xs text-gray-500 italic max-w-[180px] text-center truncate cursor-help"
                      [title]="getRejectedReason(data)"
                    >
                      {{ getRejectedReason(data) }}
                    </small>
                  </div>
                </td>
                <td class="py-3 px-4 text-center">
                  <div class="flex items-center justify-center">
                    <button
                      (click)="onEllipsisClick($event, data, menu)"
                      class="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none"
                    >
                      <i class="pi pi-ellipsis-h text-base"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </ng-template>

            <ng-template #emptymessage>
              <tr>
                <td colspan="100%" class="py-12 border-b border-gray-100">
                  <div class="flex flex-col items-center justify-center gap-2">
                    <i class="pi pi-folder-open text-3xl text-gray-300"></i>
                    <div class="text-sm font-medium text-gray-500">
                      No sales orders found in records.
                    </div>
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
      [(visible)]="displayDialog"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      styleClass="preview-dialog rounded-xl! overflow-hidden w-[95%]! max-w-[720px]! shadow-2xl"
      [maskStyle]="{
        'overflow-y': 'auto',
        'background-color': 'rgba(15, 23, 42, 0.4)',
        'backdrop-filter': 'blur(4px)',
      }"
      appendTo="body"
    >
      <ng-template #headless>
        <div
          class="bg-slate-50 px-6 py-5 border-b border-gray-200/80 flex-none"
        >
          <div class="flex justify-between items-start gap-4">
            <div>
              <h1 class="text-xl font-bold text-gray-900 tracking-tight">
                Record Sales Order
              </h1>
              <p class="text-sm text-gray-500 mt-1 leading-relaxed">
                Verify and log the official PO received from the client to
                initiate the project workflow.
              </p>
            </div>
            <p-button
              icon="pi pi-times"
              [rounded]="true"
              [text]="true"
              severity="secondary"
              styleClass="hover:bg-gray-200/60 text-gray-400 hover:text-gray-600 transition-colors"
              (onClick)="displayDialog = false"
            ></p-button>
          </div>
        </div>

        <div class="p-6 flex-1 overflow-y-auto max-h-[70vh]">
          <div [formGroup]="FG" class="grid grid-cols-12 gap-x-5 gap-y-4">
            <div class="col-span-12 md:col-span-6 flex flex-col gap-1.5">
              <label
                class="text-xs font-semibold text-gray-600 uppercase tracking-wider"
                >SO Number</label
              >
              <input
                type="text"
                pInputText
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow bg-gray-50/50"
                formControlName="salesOrderNo"
                placeholder="System generated if left blank"
              />
            </div>

            <div class="col-span-12 md:col-span-6 flex flex-col gap-1.5">
              <label
                class="text-xs font-semibold text-gray-600 uppercase tracking-wider"
              >
                SO Date <span class="text-rose-500">*</span>
              </label>
              <p-datepicker
                formControlName="soDate"
                dateFormat="dd/mm/yy"
                styleClass="w-full"
                inputStyleClass="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500"
                appendTo="body"
                [showIcon]="true"
                placeholder="Select order date"
              ></p-datepicker>
            </div>

            <div class="col-span-12 md:col-span-6 flex flex-col gap-1.5">
              <label
                class="text-xs font-semibold text-gray-600 uppercase tracking-wider"
              >
                Client PO Number <span class="text-rose-500">*</span>
              </label>
              <input
                type="text"
                pInputText
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                formControlName="clientPONumber"
                placeholder="e.g. PO-2026-001"
              />
            </div>

            <div class="col-span-12 md:col-span-6 flex flex-col gap-1.5">
              <label
                class="text-xs font-semibold text-gray-600 uppercase tracking-wider"
                >PO Received Date</label
              >
              <p-datepicker
                formControlName="clientPODate"
                dateFormat="dd/mm/yy"
                styleClass="w-full"
                inputStyleClass="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500"
                appendTo="body"
                [showIcon]="true"
                placeholder="Select receive date"
              ></p-datepicker>
            </div>

            <div class="col-span-12 md:col-span-6 flex flex-col gap-1.5">
              <label
                class="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center justify-between"
              >
                <span>Quotation Ref</span>
                <span
                  class="text-[11px] text-gray-400 lowercase font-normal italic"
                  >optional</span
                >
              </label>
              <p-select
                [options]="quotationSelections"
                appendTo="body"
                [filter]="true"
                formControlName="quotationId"
                styleClass="w-full border border-gray-300 rounded-lg"
                [showClear]="FG.get('quotationId')?.value"
                placeholder="Link a quotation"
              ></p-select>
            </div>

            <div class="col-span-12 md:col-span-6 flex flex-col gap-1.5">
              <label
                class="text-xs font-semibold text-gray-600 uppercase tracking-wider"
                >Client Account</label
              >
              <p-select
                [options]="clientSelections"
                appendTo="body"
                [filter]="true"
                formControlName="clientId"
                styleClass="w-full border border-gray-300 rounded-lg"
                [showClear]="FG.get('clientId')?.value"
                placeholder="Select a client account"
              ></p-select>
            </div>

            <div class="col-span-12 md:col-span-6 flex flex-col gap-1.5">
              <label
                class="text-xs font-semibold text-gray-600 uppercase tracking-wider"
                >Total Value (Gross)</label
              >
              <p-inputnumber
                formControlName="totalAmount"
                styleClass="w-full text-left"
                inputStyleClass="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg font-medium text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                mode="currency"
                currency="MYR"
                locale="ms-MY"
                [minFractionDigits]="2"
                placeholder="RM 0.00"
              ></p-inputnumber>
            </div>
            <div class="col-span-12 md:col-span-6 flex flex-col gap-1.5">
              <label
                class="text-xs font-semibold text-gray-600 uppercase tracking-wider"
              >
                Payment Terms <span class="text-rose-500">*</span>
              </label>

              <input
                type="text"
                pInputText
                class="w-full"
                formControlName="paymentTerms"
                placeholder="e.g. 30 Days, Cash on Delivery, Net 60"
              />
            </div>
            <div class="col-span-12 flex flex-col gap-1.5">
              <label
                class="text-xs font-semibold text-gray-600 uppercase tracking-wider"
                >Internal Remarks</label
              >
              <input
                type="text"
                pInputText
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                formControlName="remarks"
                placeholder="Add any internal processing notes"
              />
            </div>

            <div
              class="col-span-12 flex flex-col gap-2 mt-2 pt-4 border-t border-gray-100"
            >
              <label
                class="text-xs font-semibold text-gray-600 uppercase tracking-wider"
              >
                Official Client PO Attachment
                <span class="text-rose-500">*</span>
              </label>

              <div class="flex flex-wrap items-center gap-3">
                <input
                  #file
                  type="file"
                  (change)="onFileSelected($event)"
                  hidden
                />

                <p-button
                  [label]="
                    FG.get('clientPOAttachment')?.value
                      ? 'Replace Document'
                      : 'Upload PO Document'
                  "
                  severity="secondary"
                  icon="pi pi-upload"
                  styleClass="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 py-2 px-3 text-xs font-medium shadow-sm rounded-lg"
                  (onClick)="file.click()"
                ></p-button>

                <a
                  *ngIf="selectedFileName"
                  [href]="selectedFileUrl"
                  [download]="selectedFileName"
                  target="_blank"
                  class="bg-blue-50/50 hover:bg-blue-50 border border-blue-200/60 rounded-xl px-3 py-2 text-sm font-medium text-blue-700 flex items-center gap-2 max-w-full transition-colors group"
                >
                  <i
                    class="pi pi-file text-blue-500 group-hover:scale-105 transition-transform"
                  ></i>
                  <span class="truncate max-w-[280px]">{{
                    selectedFileName
                  }}</span>
                  <i
                    class="pi pi-external-link text-[10px] text-blue-400 ml-1"
                  ></i>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div
          class="p-4 bg-slate-50 border-t border-gray-200 flex justify-end items-center gap-3 flex-none"
        >
          <p-button
            label="Cancel"
            severity="secondary"
            styleClass="border border-gray-300! bg-white hover:bg-gray-50 text-gray-700 py-2 px-4 text-sm font-medium rounded-lg"
            (onClick)="displayDialog = false"
          ></p-button>
          <p-button
            label="Record Order"
            icon="pi pi-check-circle"
            severity="info"
            styleClass="bg-blue-600 hover:bg-blue-700 border-none text-white py-2 px-4 text-sm font-medium shadow-sm rounded-lg"
            (onClick)="saveRecord()"
          ></p-button>
        </div>
      </ng-template>
    </p-dialog>

    <p-drawer
      [(visible)]="viewDialog"
      position="right"
      styleClass="w-[75%]! bg-slate-50/50 backdrop-blur-xs! p-0 shadow-2xl"
      [showCloseIcon]="true"
      [showCloseIcon]="false"
    >
      <ng-template #header>
        <div
          class="flex flex-row items-center justify-between w-full border-b border-gray-100 pb-4 px-2 bg-white"
        >
          <div class="flex flex-col gap-1">
            <span
              class="text-xs font-semibold uppercase tracking-wider text-gray-400"
              >Sales Order</span
            >
            <h2 class="text-2xl font-bold">
              {{ selectedSO.salesOrderNo }}
            </h2>
          </div>
          <div class="flex items-center gap-3">
            <span
              class="px-3.5 py-1 text-xs font-semibold tracking-wide rounded-full uppercase border shadow-xs"
              [ngClass]="{
                'bg-indigo-50 text-indigo-700 border-indigo-200':
                  selectedSO.status === 'InProgress',
                'bg-emerald-50 text-emerald-700 border-emerald-200':
                  selectedSO.status === 'Completed' ||
                  selectedSO.status === 'Delivered',
                'bg-green-50 text-green-700 border-green-200':
                  selectedSO.status === 'Confirmed',
                'bg-gray-50 text-gray-600 border-gray-200':
                  selectedSO.status === 'Draft',
              }"
            >
              {{ selectedSO.status }}
            </span>
          </div>
        </div>
      </ng-template>

      <div class="grid grid-cols-12 gap-6 p-6" *ngIf="selectedSO">
        <div class="flex flex-col col-span-12 lg:col-span-8 gap-6">
          <div class="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
            <h3
              class="font-bold text-gray-800 text-base border-b border-gray-100 pb-2 mb-4 flex items-center gap-2"
            >
              <i class="pi pi-info-circle text-indigo-500"></i> Order Details
            </h3>

            <div class="grid grid-cols-12 gap-y-5 gap-x-6">
              <div class="col-span-12 sm:col-span-6 flex flex-col gap-1">
                <span
                  class="text-xs font-semibold text-gray-400 uppercase tracking-wider"
                  >Order Date</span
                >
                <span class="font-semibold text-gray-800 text-base">
                  {{ selectedSO.soDate | date: 'dd MMM yyyy' }}
                </span>
              </div>

              <div class="col-span-12 sm:col-span-6 flex flex-col gap-1">
                <span
                  class="text-xs font-semibold text-gray-400 uppercase tracking-wider"
                  >Payment Terms</span
                >
                <span class="font-semibold text-gray-800 text-base">
                  {{ selectedSO.paymentTerms || 'N/A' }}
                </span>
              </div>

              <div class="col-span-12 flex flex-col gap-1">
                <span
                  class="text-xs font-semibold text-gray-400 uppercase tracking-wider"
                  >Reference Quotation No</span
                >
                <span
                  (click)="downloadAttachment(selectedSO.quotation, 'Q')"
                  class="font-mono font-bold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer text-base flex items-center gap-1.5"
                >
                  <i class="pi pi-link text-xs"></i>
                  {{
                    selectedSO.quotation?.quotationNo ||
                      'Direct Order (No Quote)'
                  }}
                </span>
              </div>

              <div class="col-span-12 mt-2 pt-4 border-t border-gray-100">
                <span
                  class="text-sm font-bold text-slate-700 uppercase tracking-wide block mb-3"
                >
                  Client Purchase Order Info
                </span>

                <div
                  *ngIf="!selectedSO.clientPONumber"
                  class="text-sm text-gray-400 italic bg-gray-50 rounded-lg p-3 border border-gray-100"
                >
                  No client Purchase Order attached to this contract.
                </div>

                <div
                  *ngIf="selectedSO.clientPONumber"
                  class="grid grid-cols-12 gap-4 bg-slate-50/60 rounded-xl p-4 border border-slate-100"
                >
                  <div class="col-span-12 sm:col-span-4 flex flex-col gap-1">
                    <span
                      class="text-[11px] font-medium text-gray-400 uppercase"
                      >PO Reference No</span
                    >
                    <span class="font-semibold text-gray-800 font-mono">{{
                      selectedSO.clientPONumber
                    }}</span>
                  </div>

                  <div class="col-span-12 sm:col-span-4 flex flex-col gap-1">
                    <span
                      class="text-[11px] font-medium text-gray-400 uppercase"
                      >PO Signed Date</span
                    >
                    <span class="font-semibold text-gray-800">
                      {{
                        selectedSO.clientPODate
                          ? (selectedSO.clientPODate | date: 'dd MMM yyyy')
                          : '—'
                      }}
                    </span>
                  </div>

                  <div
                    class="col-span-12 sm:col-span-4 flex flex-col gap-1 justify-center"
                  >
                    <span
                      class="text-[11px] font-medium text-gray-400 uppercase mb-0.5"
                      >Attachment</span
                    >
                    <div
                      *ngIf="selectedSO.clientPOAttachment; else noAttachment"
                    >
                      <a
                        (click)="downloadAttachment(selectedSO, 'SO')"
                        class="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg px-2.5 py-1 transition-colors cursor-pointer"
                      >
                        <i class="pi pi-file-pdf"></i> View Document
                      </a>
                    </div>
                    <ng-template #noAttachment>
                      <span
                        class="text-xs text-gray-400 italic flex items-center gap-1"
                      >
                        <i class="pi pi-minus-circle text-[10px]"></i> No File
                        Uploaded
                      </span>
                    </ng-template>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            class="bg-white border border-gray-200 rounded-xl p-5 shadow-xs flex flex-col"
          >
            <h3
              class="font-bold text-gray-800 text-base border-b border-gray-100 pb-2 mb-4 flex items-center gap-2"
            >
              <i class="pi pi-list text-indigo-500"></i> Line Item Details
            </h3>

            <div class="overflow-hidden border border-gray-200">
              <p-table
                [value]="selectedSO.salesOrderItems || []"
                [showGridlines]="false"
                styleClass="p-datatable-sm"
                [showGridlines]="true"
              >
                <ng-template #header>
                  <tr
                    class="bg-gray-50/70 text-gray-400 text-xs tracking-wider font-semibold uppercase"
                  >
                    <th class="w-[8%]! text-center! py-3 bg-gray-100!">#</th>
                    <th class="w-[42%]! text-left! bg-gray-100!">
                      Description Details
                    </th>
                    <th class="w-[10%]! text-center! bg-gray-100!">Qty</th>
                    <th class="w-[10%]! text-center! bg-gray-100!">Unit</th>
                    <th class="w-[15%]! text-right! bg-gray-100!">
                      Unit Price (RM)
                    </th>
                    <th class="w-[10%]! text-center! bg-gray-100!">Disc (%)</th>
                    <th class="w-[10%]! text-center! bg-gray-100!">
                      Tax Rate (%)
                    </th>

                    <th class="w-[15%]! text-right! pr-4 bg-gray-100!">
                      Total (RM)
                    </th>
                  </tr>
                </ng-template>
                <ng-template #body let-data let-i="rowIndex">
                  <tr
                    class="border-b border-gray-100 hover:bg-slate-50/50 transition-colors text-gray-700"
                  >
                    <td class="text-center! font-medium text-gray-400 py-3">
                      {{ i + 1 }}
                    </td>
                    <td>
                      <div
                        class="prose prose-sm font-normal text-gray-800 max-w-none text-sm"
                        [innerHTML]="data.description"
                      ></div>
                    </td>
                    <td class="text-center! font-semibold">
                      {{ data.quantity }}
                    </td>
                    <td class="text-center! text-gray-500 text-sm">
                      {{ data.unit }}
                    </td>
                    <td class="text-right! font-mono">
                      {{ data.unitPrice | number: '1.2-2' }}
                    </td>
                    <td class="text-center! font-mono">
                      {{ data.discount | number: '1.2-2' }}
                    </td>
                    <td class="text-center! font-mono">
                      {{ data.taxRate | number: '1.2-2' }}
                    </td>
                    <td
                      class="text-right! font-mono font-extrabold! text-gray-900 pr-4"
                    >
                      {{ data.totalPrice | number: '1.2-2' }}
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            </div>

            <div class="flex justify-end mt-4">
              <div
                class="w-full sm:w-102 flex flex-col gap-2.5 p-3 bg-slate-50/50 rounded-xl border border-gray-100"
              >
                <div class="flex justify-between items-center">
                  <span class="text-gray-500">Subtotal</span>
                  <span class="font-mono font-medium text-gray-800"
                    >RM {{ selectedSO.subTotal ?? 0 | number: '1.2-2' }}</span
                  >
                </div>
                <div
                  class="flex justify-between items-center text-emerald-600"
                  *ngIf="selectedSO.discount"
                >
                  <span>Discount</span>
                  <span class="font-mono font-medium"
                    >- RM {{ selectedSO.discount | number: '1.2-2' }}</span
                  >
                </div>
                <div
                  class="flex justify-between items-center text-gray-500"
                  *ngIf="selectedSO.taxAmount"
                >
                  <span>Estimated Tax</span>
                  <span class="font-mono font-medium"
                    >RM {{ selectedSO.taxAmount | number: '1.2-2' }}</span
                  >
                </div>
                <div
                  class="flex justify-between items-center border-t border-gray-200 pt-2.5 mt-1"
                >
                  <span class="font-bold text-gray-900 text-base"
                    >Total Amount</span
                  >
                  <span class="font-mono font-bold text-xl text-indigo-900"
                    >RM
                    {{ selectedSO.totalAmount ?? 0 | number: '1.2-2' }}</span
                  >
                </div>
              </div>
            </div>
          </div>

          <div
            class="bg-white border border-gray-200 rounded-xl p-5 shadow-xs flex flex-col gap-3"
          >
            <label
              class="font-bold text-gray-800 text-base flex items-center gap-2"
            >
              <i class="pi pi-comment text-indigo-500"></i>
              Remarks
            </label>
            <textarea
              rows="3"
              pTextarea
              [autoResize]="true"
              class="w-full bg-gray-100! cursor-default"
              placeholder="Append processing updates or client dispatch instructions here..."
              [(ngModel)]="selectedSO.remarks"
              readonly
            ></textarea>
          </div>
        </div>

        <div class="flex flex-col col-span-12 lg:col-span-4 gap-6">
          <div
            class="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col gap-4"
          >
            <h3
              class="font-bold text-gray-800 text-base border-b border-gray-100 pb-2 flex items-center gap-2"
            >
              <i class="pi pi-wallet text-indigo-500"></i> Invoices
            </h3>

            <div
              *ngIf="!selectedSO.invoices || selectedSO.invoices.length === 0"
              class="bg-amber-50/40 border border-dashed border-amber-200 rounded-xl p-4 flex flex-col items-center text-center gap-3"
            >
              <div
                class="w-12 h-12 flex items-center justify-center bg-amber-100 rounded-full text-amber-600"
              >
                <i class="pi pi-file-excel text-2xl!"></i>
              </div>
              <div class="flex flex-col gap-0.5">
                <div class="font-semibold text-gray-800 text-base">
                  No Invoice Found
                </div>
                <p class="text-sm text-gray-500 max-w-[220px] leading-relaxed">
                  No financial requests have been issued for this sales order
                  yet.
                </p>
              </div>
            </div>

            <div
              *ngIf="selectedSO.invoices && selectedSO.invoices.length > 0"
              class="flex flex-col gap-3"
            >
              <div
                class="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs flex flex-col gap-2"
              >
                <div class="flex justify-between text-gray-500">
                  <span>Total Invoiced Summary</span>
                  <span class="font-semibold text-gray-800">
                    {{ selectedSO.invoices.length }} Invoice(s)
                  </span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                  <div
                    class="bg-indigo-600 h-1.5 rounded-full"
                    style="width: 65%"
                  ></div>
                </div>
              </div>

              <div
                class="flex flex-col gap-2 max-h-[280px] overflow-y-auto pr-1"
              >
                <div
                  *ngFor="let inv of selectedSO.invoices"
                  class="bg-white border border-gray-100 hover:border-gray-200 rounded-xl p-3 shadow-2xs transition-all flex flex-col gap-2"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex flex-col">
                      <span
                        class="font-mono font-bold text-sm text-gray-800 hover:text-indigo-600 cursor-pointer flex items-center gap-1"
                      >
                        #{{ inv.invoiceNo }}
                        <i
                          class="pi pi-external-link text-[10px] text-gray-400"
                        ></i>
                      </span>
                      <span class="text-[10px] text-gray-400">{{
                        inv.invoiceDate | date: 'dd MMM yyyy'
                      }}</span>
                    </div>

                    <span
                      class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                      [ngClass]="{
                        'bg-emerald-50 text-emerald-700 border border-emerald-200':
                          inv.status === 'Paid',
                        'bg-amber-50 text-amber-700 border border-amber-200':
                          inv.status === 'Partially Paid',
                        'bg-red-50 text-red-700 border border-red-200':
                          inv.status === 'Unpaid' || inv.status === 'Overdue',
                      }"
                    >
                      {{ inv.status }}
                    </span>
                  </div>

                  <div
                    class="flex justify-between items-center text-xs pt-1 border-t border-gray-50"
                  >
                    <div>
                      <span class="text-gray-400">Paid: </span>
                      <span class="font-mono font-semibold text-gray-700"
                        >RM {{ inv.paidAmount || 0 | number: '1.2-2' }}</span
                      >
                    </div>
                    <div class="text-right">
                      <span class="text-gray-400">Total: </span>
                      <span class="font-mono font-bold text-gray-900"
                        >RM {{ inv.totalAmount | number: '1.2-2' }}</span
                      >
                    </div>
                  </div>

                  <div
                    class="grid grid-cols-2 gap-2 mt-1 pt-2 border-t border-gray-100/60"
                    *ngIf="inv.status !== 'Paid'"
                  >
                    <button
                      (click)="recordPayment(inv)"
                      class="text-[11px] font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 py-1 rounded text-center transition-colors"
                    >
                      <i class="pi pi-credit-card mr-1 text-[10px]"></i> Record
                      Pay
                    </button>
                    <button
                      (click)="viewInvoice(inv)"
                      class="text-[11px] font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 py-1 rounded text-center transition-colors"
                    >
                      <i class="pi pi-eye mr-1 text-[10px]"></i> View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            class="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col gap-3.5"
          >
            <h3
              class="font-bold text-gray-800 text-base border-b border-gray-100 pb-2 flex items-center gap-2"
            >
              <i class="pi pi-user text-indigo-500"></i> Client Profile
            </h3>

            <div class="flex flex-col gap-1.5">
              <div class="font-bold text-gray-900 tracking-wide leading-snug">
                {{ selectedSO.client?.name }}
              </div>
            </div>

            <div
              class="flex flex-col gap-2.5 text-sm text-gray-600 border-t border-gray-50 pt-3"
            >
              <div class="flex items-start gap-3">
                <i class="pi pi-id-card text-gray-400 mt-0.5"></i>
                <div class="flex flex-col">
                  <span class="text-gray-400 uppercase font-medium"
                    >Contact Person</span
                  >
                  <span class="font-medium text-gray-800 text-base">{{
                    selectedSO.client?.contactPerson1 || 'None Registered'
                  }}</span>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <i class="pi pi-phone text-gray-400 mt-0.5"></i>
                <div class="flex flex-col">
                  <span class="text-gray-400 uppercase font-medium"
                    >Contact Number</span
                  >
                  <span class="font-medium text-gray-800 text-base">{{
                    selectedSO.client?.contactNo || '—'
                  }}</span>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <i class="pi pi-envelope text-gray-400 mt-0.5"></i>
                <div class="flex flex-col">
                  <span class="text-gray-400 uppercase font-medium"
                    >E-Mail Address</span
                  >
                  <span
                    class="font-medium text-indigo-600 font-mono select-all truncate max-w-[300px] text-base"
                    >{{ selectedSO.client?.email }}</span
                  >
                </div>
              </div>
            </div>
          </div>

          <div
            class="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col gap-4"
          >
            <h3
              class="font-bold text-gray-800 border-b border-gray-100 pb-2 flex items-center gap-2"
            >
              <i class="pi pi-map-marker text-indigo-500"></i> Address
            </h3>

            <div class="flex flex-col gap-1">
              <span
                class="font-bold uppercase tracking-wider text-[10px] text-gray-500 flex items-center gap-1.5"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                Billing Address
              </span>
              <p
                class="text-gray-400 leading-relaxed pl-3 border-l border-indigo-100 mt-1"
              >
                {{
                  selectedSO.client?.billingAddress?.addressLine1 ||
                    'No billing address stored.'
                }}
              </p>
            </div>

            <div class="flex flex-col gap-1">
              <span
                class="font-bold uppercase tracking-wider text-[10px] text-gray-500 flex items-center gap-1.5"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                Delivery Address
              </span>
              <p
                class="text-gray-400 leading-relaxed pl-3 border-l border-amber-100 mt-1"
              >
                {{
                  selectedSO.client?.deliveryAddress?.addressLine1 ||
                    'Identical with Billing Address.'
                }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </p-drawer>

    <p-dialog
      [(visible)]="showDODialog"
      [modal]="true"
      header="Configure Delivery Shipments Schedule"
      [style]="{ width: '75vw' }"
    >
      <div
        class="flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded border border-gray-200"
      >
        <label class="font-semibold text-gray-700"
          >How many shipments/trips are needed?</label
        >
        <p-inputNumber
          [(ngModel)]="totalDeliveryPlanned"
          (onInput)="onShipmentCountChange()"
          [min]="1"
          [max]="5"
          [showButtons]="true"
          buttonLayout="horizontal"
          spinnerMode="horizontal"
          decrementButtonClass="p-button-secondary"
          incrementButtonClass="p-button-secondary"
          incrementButtonIcon="pi pi-plus"
          decrementButtonIcon="pi pi-minus"
          inputStyleClass="w-14 text-center p-inputtext-sm"
          styleClass="w-auto"
        ></p-inputNumber>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div
          *ngFor="let shipment of doConfigs; let idx = index"
          class="p-4 bg-blue-50/50 rounded-lg border border-blue-100"
        >
          <div class="font-bold text-blue-800 mb-2 flex justify-between">
            <span>📦 Delivery Order #{{ idx + 1 }}</span>
            <span class="text-sm text-blue-600 font-mono"
              >Draft Reference: {{ shipment.tempNo }}</span
            >
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="text-xs font-semibold text-gray-600 block mb-1"
                >Delivery Method</label
              >
              <p-select
                [options]="deliveryMethods"
                [(ngModel)]="shipment.deliveryMethod"
                placeholder="Select Method"
                styleClass="w-full p-inputtext-sm"
              ></p-select>
            </div>
            <div>
              <label class="text-xs font-semibold text-gray-600 block mb-1"
                >Target Delivery Date</label
              >
              <p-datepicker
                [(ngModel)]="shipment.deliveryDate"
                dateFormat="dd/mm/yy"
                [showIcon]="true"
                appendTo="body"
                styleClass="w-full p-inputtext-sm"
              ></p-datepicker>
            </div>
          </div>
        </div>
      </div>

      <p-table
        [value]="selectedSOForDO?.salesOrderItems || []"
        [showGridlines]="true"
      >
        <ng-template #header>
          <tr>
            <th class="bg-gray-100!">Description</th>
            <th class="text-center! bg-gray-100!" style="width: 100px;">
              Total Ordered
            </th>

            <th
              *ngFor="let shipment of doConfigs; let idx = index"
              class="text-center! bg-blue-100!"
            >
              Allocated Qty (DO #{{ idx + 1 }})
            </th>

            <th class="text-center! bg-gray-100!" style="width: 100px;">
              Remaining
            </th>
          </tr>
        </ng-template>

        <ng-template #body let-item>
          <tr>
            <td><div [innerHTML]="item.description"></div></td>
            <td class="text-center! font-bold">{{ item.quantity }}</td>

            <td
              *ngFor="let do of doConfigs; let idx = index"
              class="text-center!"
            >
              <p-inputNumber
                [ngModel]="item.allocatedQtys ? item.allocatedQtys[idx] : 0"
                (onInput)="calculateRemainingBalance(item)"
                [min]="0"
                [max]="item.quantity"
                [showButtons]="false"
                inputStyleClass="w-24 text-center! p-inputtext-sm"
              ></p-inputNumber>
            </td>

            <td
              class="text-center! font-semibold"
              [ngClass]="
                item.remainingBalance === 0
                  ? 'text-green-600'
                  : 'text-amber-600'
              "
            >
              {{ item.remainingBalance }}
            </td>
          </tr>
        </ng-template>
      </p-table>

      <ng-template pTemplate="footer">
        <p-button
          label="Cancel"
          severity="secondary"
          (onClick)="showDODialog = false"
        ></p-button>
        <p-button
          label="Generate Scheduled DOs"
          icon="pi pi-check-square"
          (onClick)="submitScheduledDOs()"
        ></p-button>
      </ng-template>
    </p-dialog> `,
  styleUrl: './salesOrder.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesOrder implements OnInit, OnDestroy {
  @ViewChild('fTable') fTable?: Table;

  private readonly salesOrderService = inject(SalesOrderService);
  private readonly loadingService = inject(LoadingService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  PagingSignal = signal<PagingContent<SalesOrderDto>>(
    {} as PagingContent<SalesOrderDto>,
  );
  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  search: string = '';
  selectedFileName: string = '';
  selectedFileUrl: string | null = null;

  displayDialog: boolean = false;
  viewDialog: boolean = false;
  paymentDialogVisible: boolean = false;
  showDODialog: boolean = false;

  activeInvoiceForPayment: any = null;

  totalDeliveryPlanned: number = 0;
  doConfigs: any[] = [];

  deliveryMethods = [
    { label: 'Company Lorry', value: 'Lorry' },
    { label: 'Company Van', value: 'Van' },
    { label: 'Hand Carry / Self Collect', value: 'HandCarry' },
    { label: 'Courier Service', value: 'Courier' },
  ];

  FG!: FormGroup;

  menuItems: MenuItem[] = [];

  companySelections: any[] = [];
  quotationSelections: any[] = [];
  clientSelections: any[] = [];

  selectedSO: any;
  selectedSOForDO: SalesOrderDto | null = null;
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
      'Client.BillingAddress,Client.DeliveryAddress,SalesOrderItems,SalesOrderStatusHistories,Quotation';
  }

  ngOnInit(): void {}

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

  ActionClick(data: SalesOrderDto | null, action: string) {
    switch (action) {
      case 'Create':
        this.getDropdown();
        this.initForm();
        this.generateSONo();

        this.displayDialog = true;
        this.cdr.markForCheck();
        break;
      case 'Update':
        this.getDropdown();
        this.initForm();
        this.displayDialog = true;

        setTimeout(() => {
          if (!data) return;

          if (data.clientPOAttachment) {
            const cleanPath = data.clientPOAttachment.replace(/\\/g, '/');
            this.selectedFileName = cleanPath.split('/').pop() || '';
            this.selectedFileUrl = `https://localhost:5000/${cleanPath}`;
          }

          this.FG.patchValue({
            ...data,
            soDate: new Date(data.soDate),
            clientPODate: new Date(data.clientPODate),
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
        this.router.navigate(['/sales-order/details'], {
          queryParams: { id: data.id },
        });
        break;

      case 'View':
        if (!data) return;
        this.selectedSO = data;
        this.viewDialog = true;
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
      id: new FormControl<string | null>({ value: null, disabled: true }),
      salesOrderNo: new FormControl<string | null>(null),
      companyId: new FormControl<string | null>(null),
      clientId: new FormControl<string | null>(null, Validators.required),
      projectId: new FormControl<string | null>(null),
      quotationId: new FormControl<string | null>(null),
      soDate: new FormControl<Date | null>(new Date()),
      totalAmount: new FormControl<number | null>(null),
      remarks: new FormControl<string | null>(null),
      paymentTerms: new FormControl<string | null>(null),
      clientPOAttachment: new FormControl<File | null>(null),
      clientPODate: new FormControl<Date | null>(null),
      clientPONumber: new FormControl<string | null>(null),
      salesOrderItems: new FormArray([]),
    });

    this.FG.get('quotationId')?.valueChanges.subscribe((res) => {
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
        },
      });
  }

  onEllipsisClick(event: any, so: SalesOrderDto, menu: any) {
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
    } else if (so.status === 'Confirmed') {
      this.menuItems.push(
        {
          label: 'View Details',
          icon: 'pi pi-eye',
          command: () => this.ActionClick(so, 'View'),
        },
        {
          label: 'Generate Delivery Order',
          icon: 'pi pi-truck',
          command: () => this.generateDO(so),
        },
      );
    } else if (so.status === 'InProgress') {
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

  onFileSelected(event: any) {
    const file = event.target.files[0];

    if (file) {
      this.selectedFileName = file.name;

      this.selectedFileUrl = URL.createObjectURL(file);

      this.FG.patchValue({
        clientPOAttachment: file,
      });
    }
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

      formData.append(key, value);
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

          const updated = current.data.map((item) =>
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
            data: [res, ...state.data],
            totalElements: state.totalElements + 1,
          }));

          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `SO: ${res.salesOrderNo} recorded successfully`,
          });
        }

        this.resetForm();
        this.displayDialog = false;
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
      clientPODate: new Date(),
    });

    this.selectedFileName = '';
    this.selectedFileUrl = null;

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
    const fileUrl = `https://localhost:5000/${cleanPath}`;

    this.loadingService.start();

    fetch(fileUrl)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP status ${response.status}`);
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

  openDODialog(salesOrder: any) {
    this.selectedSOForDO = JSON.parse(JSON.stringify(salesOrder));
    this.totalDeliveryPlanned = 1;

    this.doConfigs = [
      {
        tempNo: 'DO-TEMP-1',
        deliveryMethod: 'Van',
        deliveryDate: new Date(),
      },
    ];

    this.selectedSOForDO?.salesOrderItems?.forEach((item: any) => {
      item.allocatedQtys = [item.quantity];
      item.remainingBalance = 0;
    });

    this.showDODialog = true;
  }

  onShipmentCountChange() {
    if (this.totalDeliveryPlanned < 1) this.totalDeliveryPlanned = 1;

    const currentCount = this.doConfigs.length;

    if (this.totalDeliveryPlanned > currentCount) {
      for (let i = currentCount; i < this.totalDeliveryPlanned; i++) {
        this.doConfigs.push({
          tempNo: `DO-TEMP-${i + 1}`,
          deliveryMethod: 'Van',
          deliveryDate: new Date(),
        });
      }
    } else if (this.totalDeliveryPlanned < currentCount) {
      this.doConfigs = this.doConfigs.slice(0, this.totalDeliveryPlanned);
    }

    this.selectedSOForDO?.salesOrderItems?.forEach((item: any) => {
      if (!item.allocatedQtys) {
        item.allocatedQtys = [];
      }

      const updatedAllocations = [];
      for (let i = 0; i < this.totalDeliveryPlanned; i++) {
        updatedAllocations.push(
          item.allocatedQtys[i] !== undefined ? item.allocatedQtys[i] : 0,
        );
      }

      item.allocatedQtys = updatedAllocations;
      this.calculateRemainingBalance(item);
    });
  }

  calculateRemainingBalance(item: any) {
    const totalAllocated = item.allocatedQtys.reduce(
      (sum: number, val: number) => sum + (val || 0),
      0,
    );
    console.log(item, totalAllocated);
    item.remainingBalance = item.quantity - totalAllocated;
  }

  generateDO(so: SalesOrderDto) {
    this.selectedSOForDO = so;
    this.selectedDOItems = [];
    this.showDODialog = true;
  }

  submitScheduledDOs() {
    if (!this.selectedSOForDO) return;

    this.loadingService.start();

    const shipmentsPayload = this.doConfigs
      .map((config, doIndex) => {
        return {
          salesOrderId: this.selectedSOForDO!.id,
          deliveryMethod: config.deliveryMethod,
          estimatedDeliveryDate: config.deliveryDate,
          items:
            this.selectedSOForDO!.salesOrderItems?.filter(
              (item: any) => item.allocatedQtys[doIndex] > 0,
            ).map((item: any) => ({
              salesOrderItemId: item.id,
              quantityToDeliver: item.allocatedQtys[doIndex],
            })) || [],
        };
      })
      .filter((doGroup) => doGroup.items.length > 0);

    const payload: BulkDORequest = {
      deliveryOrders: shipmentsPayload,
    };

    this.salesOrderService.GenerateBulkDOs(payload).subscribe({
      next: (res) => {
        this.loadingService.stop();

        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: res?.message || 'Delivery Orders generated successfully',
        });

        this.showDODialog = false;
      },
      error: () => {
        this.loadingService.stop();
      },
    });
  }

  // generateDO(so: SalesOrderDto) {
  //   this.loadingService.start();

  //   this.salesOrderService
  //     .GenerateDO(so.id)
  //     .pipe(takeUntil(this.ngUnsubscribe))
  //     .subscribe({
  //       next: (res: any) => {
  //         this.loadingService.stop();

  //         const current = this.PagingSignal();

  //         const updatedData = current.data.map((item) => {
  //           if (item.id === so.id) {
  //             return {
  //               ...item,
  //               status: 'InProgress',
  //             };
  //           }
  //           return item;
  //         });

  //         this.PagingSignal.set({
  //           ...current,
  //           data: updatedData,
  //         });

  //         this.messageService.add({
  //           severity: 'success',
  //           summary: 'Success',
  //           detail: `Delivery Order generated for ${so.salesOrderNo}`,
  //         });
  //       },
  //       error: () => {
  //         this.loadingService.stop();
  //       },
  //     });
  // }

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

  viewInvoice(invoice: any): void {
    if (!invoice || !invoice.id) return;

    console.log(`Navigating to invoice panel context: ${invoice.invoiceNo}`);

    this.router.navigate(['/financials/invoices', invoice.id]);
  }

  recordPayment(invoice: any): void {
    if (!invoice) return;

    this.activeInvoiceForPayment = invoice;

    this.paymentForm = {
      invoiceId: invoice.id,
      clientId: this.selectedSO.clientId,
      referenceNo: '',
      paymentDate: new Date(),
      paymentMode: 'Bank Transfer',

      amount: (invoice.totalAmount ?? 0) - (invoice.paidAmount ?? 0),
      notes: `Settlement processing entry for Invoice No: ${invoice.invoiceNo}`,
    };

    this.paymentDialogVisible = true;
  }

  submitPaymentReceipt(): void {
    if (this.paymentForm.amount <= 0) {
      console.error(
        'Payment receipt processing demands value amount constraints above zero.',
      );
      return;
    }
    this.paymentDialogVisible = false;
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
