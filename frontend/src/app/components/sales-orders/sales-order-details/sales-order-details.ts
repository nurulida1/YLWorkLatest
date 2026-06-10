import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
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
import { MessageService } from 'primeng/api';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { PurchaseOrderService } from '../../../services/purchaseOrderService';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { SupplierService } from '../../../services/SupplierService';
import { EditorModule } from 'primeng/editor';
import { CompanyType } from '../../../shared/enum/enum';
import {
  normalizeHtml,
  ValidateAllFormFields,
} from '../../../shared/helpers/helpers';
import { TabsModule } from 'primeng/tabs';

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
    InputNumberModule,
    CheckboxModule,
    DialogModule,
    ReactiveFormsModule,
    DatePickerModule,
    SelectModule,
    EditorModule,
    TextareaModule,
    TabsModule,
  ],
  template: `<div
      class="relative w-full flex flex-col gap-6 p-6 min-h-screen bg-slate-50/50 text-slate-800"
    >
      <div
        class="flex flex-row items-center gap-2 text-sm text-slate-500 tracking-wide"
      >
        <div
          [routerLink]="'/dashboard'"
          class="cursor-pointer hover:text-indigo-600 transition-colors"
        >
          Dashboard
        </div>
        <span class="text-slate-300">/</span>
        <div
          [routerLink]="'/sales-order'"
          class="cursor-pointer hover:text-indigo-600 transition-colors"
        >
          Sales Order
        </div>
        <span class="text-slate-300">/</span>
        <div class="text-slate-900 font-semibold">
          {{ soData().salesOrderNo }}
        </div>
      </div>

      <div
        class="p-6 border border-slate-200 bg-white rounded-xl shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden"
      >
        <div
          class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500"
        ></div>

        <div class="flex flex-col gap-2">
          <div class="flex items-center gap-3">
            <span
              class="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-md tracking-wider uppercase border border-indigo-100"
            >
              Sales Order
            </span>
            <span
              class="text-sm text-slate-400 font-mono flex items-center gap-1.5"
            >
              <i class="pi pi-calendar-plus text-slate-300"></i>
              {{ soData().createdAt | date: 'mediumDate' }}
            </span>
          </div>

          <div class="flex flex-col gap-1">
            <h1 class="text-2xl font-black tracking-wider text-slate-900">
              {{ soData().salesOrderNo }}
            </h1>
            <p
              class="text-sm font-semibold text-slate-500 flex items-center gap-1.5"
            >
              <i class="pi pi-building text-slate-400"></i>
              {{ soData().client?.name }}
            </p>
          </div>
        </div>

        <div
          class="flex flex-row sm:items-center md:justify-end gap-4 w-full md:w-auto border-t md:border-t-0 border-slate-100 pt-4 md:pt-0"
        >
          <div class="hidden sm:flex flex-col text-right gap-0.5">
            <span
              class="text-[11px] font-bold text-slate-400 uppercase tracking-wider"
              >Fulfillment Stage</span
            >
            <span class="text-sm font-semibold text-slate-700">
              {{
                {
                  Draft: 'Awaiting Verification & Approval',
                  Confirmed: 'Confirmed & Ready for Execution',
                  'In Progress': 'Operations & Work Ongoing',
                  Completed: 'Job Fulfilled & Closed',
                  Cancelled: 'Order / Job Voided',
                  Expired: 'Validity Window Closed',
                }[soData().status] || 'Processing System Operations'
              }}
            </span>
          </div>

          <div class="hidden sm:block h-9 w-px bg-slate-200"></div>

          <div class="flex flex-col gap-1.5 min-w-[140px] sm:text-right">
            <span
              class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block sm:hidden"
              >Order Status</span
            >
            <div
              class="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl font-extrabold text-sm tracking-wide uppercase border shadow-2xs transition-all duration-200 max-w-max sm:ml-auto"
              [ngClass]="statusConfig().badge"
            >
              <span class="relative flex h-2.5 w-2.5">
                <span
                  class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  [ngClass]="statusConfig().dot"
                ></span>
                <span
                  class="relative inline-flex rounded-full h-2.5 w-2.5"
                  [ngClass]="statusConfig().dot"
                ></span>
              </span>
              {{ soData().status }}
            </div>
          </div>
        </div>
      </div>

      <div
        class="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden"
        *ngIf="soData()"
      >
        <p-tabs value="0">
          <p-tablist
            styleClass="bg-slate-50 border-b border-slate-200 px-2 pt-2"
          >
            <p-tab
              value="0"
              styleClass="text-xs font-bold uppercase tracking-wider gap-2"
            >
              <i class="pi pi-info-circle text-sm"></i> Overview Specifications
            </p-tab>
            <p-tab
              value="1"
              styleClass="text-xs font-bold uppercase tracking-wider gap-2"
            >
              <i class="pi pi-list text-sm"></i> Line Items
            </p-tab>
            <p-tab
              value="2"
              styleClass="text-xs font-bold uppercase tracking-wider gap-2"
            >
              <i class="pi pi-wallet text-sm"></i> Invoices & Client Profile
            </p-tab>
          </p-tablist>

          <p-tabpanels styleClass="p-6">
            <p-tabpanel value="0">
              <div class="grid grid-cols-12 gap-8">
                <div class="col-span-12 lg:col-span-7 flex flex-col gap-6">
                  <h3
                    class="font-bold text-slate-900 text-lg flex items-center gap-2"
                  >
                    Order Specifications
                  </h3>

                  <div
                    class="grid grid-cols-12 gap-6 bg-slate-50/60 p-5 rounded-xl border border-slate-100"
                  >
                    <div class="col-span-12 sm:col-span-6 flex flex-col gap-1">
                      <span
                        class="text-xs font-bold text-slate-400 uppercase tracking-wider"
                        >Order Date</span
                      >
                      <span class="font-semibold text-slate-800 text-base">
                        {{ soData().soDate | date: 'dd MMM yyyy' }}
                      </span>
                    </div>

                    <div class="col-span-12 sm:col-span-6 flex flex-col gap-1">
                      <span
                        class="text-xs font-bold text-slate-400 uppercase tracking-wider"
                        >Payment Terms</span
                      >
                      <span class="font-semibold text-slate-800 text-base">
                        {{ soData().paymentTerms || 'N/A' }}
                      </span>
                    </div>

                    <div
                      class="col-span-12 flex flex-col gap-1 pt-4 border-t border-slate-200/40"
                    >
                      <span
                        class="text-xs font-bold text-slate-400 uppercase tracking-wider"
                        >Reference Quotation No</span
                      >
                      <span
                        (click)="downloadAttachment(soData().quotation, 'Q')"
                        class="font-mono font-bold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer text-base flex items-center gap-2 max-w-max"
                      >
                        <i class="pi pi-link text-sm"></i>
                        {{
                          soData().quotation?.quotationNo ||
                            'Direct Order (No Quote)'
                        }}
                      </span>
                    </div>
                  </div>

                  <div class="flex flex-col gap-3">
                    <label
                      class="font-bold text-slate-800 text-sm tracking-wide"
                      >Remarks</label
                    >
                    <textarea
                      rows="3"
                      pTextarea
                      [autoResize]="true"
                      class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-slate-600 text-xs leading-relaxed cursor-default focus:outline-hidden resize-none"
                      placeholder="No supplementary processing directives saved for this record."
                      [(ngModel)]="soData().remarks"
                      readonly
                    ></textarea>
                  </div>
                </div>

                <div
                  class="col-span-12 lg:col-span-5 flex flex-col gap-4 justify-between"
                >
                  <div class="flex flex-col gap-1.5">
                    <span
                      class="text-sm font-bold text-slate-800 uppercase tracking-wide block"
                      >Client Purchase Order</span
                    >

                    <div
                      *ngIf="!soData().clientPONumber"
                      class="text-sm text-slate-500 italic bg-slate-50 rounded-xl p-4 border border-slate-200/60"
                    >
                      No client Purchase Order attached to this contract.
                    </div>

                    <div
                      *ngIf="soData().clientPONumber"
                      class="flex flex-col gap-4 bg-slate-50/80 rounded-xl p-4 border border-slate-200/60 shadow-3xs"
                    >
                      <div
                        class="flex justify-between items-center tracking-wide"
                      >
                        <span class="font-bold text-slate-400 uppercase text-sm"
                          >PO Reference:</span
                        >
                        <span class="font-mono font-bold text-slate-800">{{
                          soData().clientPONumber
                        }}</span>
                      </div>
                      <div
                        class="flex justify-between items-center tracking-wide"
                      >
                        <span class="font-bold text-slate-400 uppercase text-sm"
                          >PO Date:</span
                        >
                        <span class="font-semibold text-slate-800">{{
                          soData().clientPODate
                            ? (soData().clientPODate | date: 'dd MMM yyyy')
                            : '—'
                        }}</span>
                      </div>
                      <div
                        *ngIf="soData().clientPOAttachment"
                        class="pt-2 border-t border-slate-200"
                      >
                        <a
                          (click)="downloadAttachment(soData(), 'SO')"
                          class="inline-flex items-center justify-center gap-2 w-full text-sm font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg py-2 transition-all cursor-pointer shadow-3xs"
                        >
                          <i class="pi pi-file-pdf text-sm"></i> View Document
                          Attachment
                        </a>
                      </div>
                    </div>
                  </div>

                  <div
                    class="w-full flex flex-col gap-3 p-5 bg-gray-50 border border-gray-200 rounded-xl shadow-md mt-auto"
                  >
                    <div
                      class="flex justify-between items-center text-sm text-gray-500"
                    >
                      <span>SubTotal</span>
                      <span class="font-mono font-semibold text-gray-600"
                        >RM {{ soData().subTotal ?? 0 | number: '1.2-2' }}</span
                      >
                    </div>
                    <div
                      class="flex justify-between items-center text-sm text-emerald-600 font-medium"
                      *ngIf="soData().discount"
                    >
                      <span>Discount</span>
                      <span class="font-mono font-bold"
                        >- RM {{ soData().discount | number: '1.2-2' }}</span
                      >
                    </div>
                    <div
                      class="flex justify-between items-center text-sm text-slate-600 font-medium"
                      *ngIf="soData().taxAmount"
                    >
                      <span>Estimated Service Tax</span>
                      <span class="font-mono font-semibold text-slate-200"
                        >RM {{ soData().taxAmount | number: '1.2-2' }}</span
                      >
                    </div>
                    <div
                      class="flex justify-between items-center border-t border-gray-300 pt-3 mt-1"
                    >
                      <span class="font-bold text-sm uppercase tracking-wider"
                        >Total Statement Balance</span
                      >
                      <span class="font-mono font-black text-2xl tracking-wide"
                        >RM
                        {{ soData().totalAmount ?? 0 | number: '1.2-2' }}</span
                      >
                    </div>
                  </div>
                </div>
              </div>
            </p-tabpanel>

            <p-tabpanel value="1">
              <div class="flex flex-col gap-6">
                <div
                  class="bg-slate-50 text-slate-800 rounded-xl p-5 border border-slate-200/80 shadow-3xs grid grid-cols-1 md:grid-cols-12 gap-4 items-center"
                >
                  <div class="md:col-span-8 flex flex-col gap-0.5">
                    <div
                      class="font-bold tracking-wider uppercase text-indigo-600 text-sm flex items-center gap-2"
                    >
                      <i class="pi pi-sliders-h"></i> Order Fulfillment Actions
                    </div>
                    <p class="text-sm text-slate-500 leading-normal">
                      Quickly process selected items for delivery or
                      procurement.
                    </p>
                  </div>

                  <div
                    class="md:col-span-4 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full"
                  >
                    <button
                      (click)="generateDODraft()"
                      [disabled]="soData().status !== 'Confirmed'"
                      class="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 disabled:text-slate-400 border border-transparent text-white text-sm font-bold rounded-lg shadow-3xs transition-colors flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider disabled:cursor-not-allowed"
                    >
                      <i class="pi pi-truck text-sm"></i> Generate DO Draft
                    </button>
                    <button
                      (click)="generatePODraft()"
                      [disabled]="soData().status !== 'Confirmed'"
                      class="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-200 disabled:text-slate-400 border border-transparent text-white text-sm font-bold rounded-lg shadow-3xs transition-colors flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider disabled:cursor-not-allowed"
                    >
                      <i class="pi pi-shopping-bag text-sm"></i> Generate PO
                      Draft
                    </button>
                  </div>
                </div>

                <div class="shadow-3xs bg-white">
                  <p-table
                    [value]="getSortedSalesOrderItems()"
                    [showGridlines]="true"
                    styleClass="p-datatable-md"
                  >
                    <ng-template #header>
                      <tr
                        class="bg-slate-50 text-slate-600 text-[11px] tracking-wider font-extrabold uppercase border-b border-slate-200"
                      >
                        <th class="!w-[5%] !text-center bg-slate-50!"></th>
                        <th class="!w-[5%] !text-center py-3.5 bg-slate-50!">
                          Item
                        </th>
                        <th class="!w-[32%] !text-left bg-slate-50!">
                          Description
                        </th>
                        <th class="!w-[8%] !text-center bg-slate-50!">
                          Req Qty
                        </th>
                        <th
                          class="!w-[10%] !text-center bg-indigo-50/60! !text-indigo-800 font-bold!"
                        >
                          On Hand
                        </th>
                        <th class="!w-[12%] !text-right bg-slate-50!">
                          Price (RM)
                        </th>
                        <th class="!w-[5%] !text-center bg-slate-50!">Disc</th>
                        <th class="!w-[14%] !text-right bg-slate-50!">
                          Total (RM)
                        </th>
                        <th
                          class="!w-[20%] !text-center bg-slate-50! sticky! right-0! z-10! shadow-3xs"
                        >
                          Stock Status
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
                        <tr
                          class="bg-slate-100/70 border-y border-slate-200/80"
                        >
                          <td
                            class="text-left p-3.5 font-extrabold text-slate-700 text-sm border-l-4! border-l-indigo-600!"
                            colspan="100%"
                          >
                            {{
                              item.description ||
                                item.item ||
                                'Untitled Group Section'
                            }}
                          </td>
                        </tr>
                      </ng-container>

                      <ng-template #normalRow>
                        <tr
                          class="border-b border-slate-100 hover:bg-indigo-50/20 transition-colors"
                          [ngClass]="{
                            'bg-rose-50/20 font-medium':
                              item.itemType === 'Product' &&
                              item.qtyOnHand < item.quantity,
                          }"
                        >
                          <td class="text-center p-3">
                            <div class="flex items-center justify-center">
                              <p-checkbox
                                *ngIf="item.itemType === 'Product'"
                                [binary]="true"
                                [(ngModel)]="item.selected"
                                [disabled]="item.qtyOnHand >= item.quantity"
                              ></p-checkbox>
                            </div>
                          </td>

                          <td
                            class="p-3 !text-center text-slate-500 font-mono font-medium"
                          >
                            {{ item.item || '-' }}
                          </td>

                          <td class="p-3">
                            <div
                              *ngIf="item.description"
                              [innerHTML]="item.description"
                              class="text-slate-700 leading-relaxed font-normal text-sm prose prose-sm max-w-none"
                            ></div>
                            <div
                              *ngIf="!item.description"
                              class="text-slate-400 italic"
                            >
                              No item description documented
                            </div>

                            <div
                              *ngIf="item.purchaseOrderNos?.length"
                              class="mt-2.5 flex flex-wrap gap-2 items-center bg-slate-50 border border-slate-100 rounded-lg p-1.5 w-fit"
                            >
                              <span
                                class="inline-flex items-center gap-1 text-[10px] font-extrabold tracking-wider text-indigo-600 uppercase pl-1"
                              >
                                <svg
                                  class="w-3.5 h-3.5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2.5"
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  ></path>
                                </svg>
                                Linked POs:
                              </span>

                              <span
                                *ngFor="let po of item.purchaseOrderNos"
                                class="inline-flex items-center px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-white text-slate-700 border border-slate-200 shadow-3xs hover:border-indigo-300 hover:text-indigo-600 transition-colors cursor-pointer"
                                ><a
                                  class="cursor-pointer"
                                  [routerLink]="'/purchase-orders/details'"
                                  [queryParams]="{ poNo: po }"
                                  >{{ po }}</a
                                >
                              </span>
                            </div>
                          </td>

                          <td class="p-3 !text-center font-bold text-slate-900">
                            {{ item.quantity }}
                          </td>

                          <td
                            class="p-3 !text-center font-bold bg-indigo-50/10 text-indigo-900 border-x border-indigo-50/40"
                          >
                            {{
                              item.itemType === 'Product'
                                ? (item.qtyOnHand ?? 0)
                                : '—'
                            }}
                          </td>

                          <td
                            class="p-3 !text-right font-medium text-slate-600 font-mono"
                          >
                            {{ item.unitPrice | number: '1.2-2' }}
                          </td>

                          <td
                            class="p-3 !text-center font-semibold text-slate-500"
                          >
                            {{ item.discount ? item.discount + '%' : '-' }}
                          </td>

                          <td
                            class="!text-right font-bold p-3 text-slate-900 bg-slate-50/30 font-mono"
                          >
                            {{ item.totalPrice | number: '1.2-2' }}
                          </td>

                          <td
                            class="p-3 !text-center bg-white sticky right-0 z-10 border-l border-slate-100 shadow-3xs"
                          >
                            <div
                              class="flex flex-col gap-1.5 items-center justify-center"
                            >
                              <span
                                *ngIf="item.itemType === 'Service'"
                                class="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold rounded shadow-3xs block text-center uppercase tracking-wide w-full"
                              >
                                Service
                              </span>

                              <span
                                *ngIf="
                                  item.itemType === 'Product' &&
                                  item.qtyOnHand >= item.quantity
                                "
                                class="inline-flex items-center justify-center gap-1.5 w-full py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded shadow-3xs uppercase tracking-wide"
                              >
                                <span
                                  class="w-1.5 h-1.5 bg-emerald-500 rounded-full"
                                ></span>
                                Available
                              </span>

                              <span
                                *ngIf="
                                  item.itemType === 'Product' &&
                                  item.qtyOnHand < item.quantity
                                "
                                class="inline-flex items-center justify-center gap-1.5 w-full py-0.5 bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-extrabold rounded shadow-3xs uppercase tracking-wide"
                              >
                                Short: {{ item.quantity - item.qtyOnHand }}
                              </span>

                              <div
                                *ngIf="
                                  item.itemType === 'Product' &&
                                  item.quantityOrdered > 0
                                "
                                class="w-full text-center"
                              >
                                <span
                                  class="flex flex-col inline-block w-full py-0.5 rounded text-[9px] font-extrabold tracking-wide uppercase border shadow-3xs"
                                  [ngClass]="{
                                    'bg-blue-50 text-blue-700 border-blue-200':
                                      item.quantityOrdered < item.quantity,
                                    'bg-indigo-50 text-indigo-700 border-indigo-200':
                                      item.quantityOrdered >= item.quantity,
                                  }"
                                >
                                  <span>
                                    Ordered: {{ item.quantityOrdered }}</span
                                  >
                                  <span>
                                    Received:
                                    {{ item.receivedQuantity || 0 }}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </ng-template>
                      <ng-template #footer>
                        <tr>
                          <td colspan="7" class="text-right! text-sm">
                            SubTotal
                          </td>
                          <td
                            colspan="1"
                            class="text-right! font-semibold! font-mono"
                          >
                            {{ soData().subTotal | number: '1.2' }}
                          </td>
                          <td></td>
                        </tr>
                        <tr>
                          <td
                            colspan="7"
                            class="text-right! text-sm text-red-500!"
                          >
                            Discount
                          </td>
                          <td
                            colspan="1"
                            class="text-right! font-semibold! font-mono text-red-500!"
                          >
                            - {{ soData().discount | number: '1.2' }}
                          </td>
                          <td></td>
                        </tr>
                        <tr>
                          <td
                            colspan="7"
                            class="text-right! text-sm bg-gray-50! font-bold!"
                          >
                            Total Amount
                          </td>
                          <td
                            colspan="1"
                            class="text-right! font-bold! font-mono text-lg! bg-gray-50!"
                          >
                            {{ soData().totalAmount | number: '1.2' }}
                          </td>
                          <td class="bg-gray-50!"></td>
                        </tr>
                      </ng-template>
                    </ng-template>
                  </p-table>
                </div>
              </div>
            </p-tabpanel>

            <p-tabpanel value="2">
              <div class="grid grid-cols-12 gap-8">
                <div class="col-span-12 md:col-span-6 flex flex-col gap-4">
                  <h3
                    class="font-bold text-slate-900 text-base flex items-center gap-2"
                  >
                    Invoices
                  </h3>

                  <div
                    *ngIf="!soData().invoices || soData().invoices.length === 0"
                    class="bg-amber-50/30 border border-dashed border-amber-200 rounded-xl p-8 flex flex-col items-center text-center gap-3"
                  >
                    <div
                      class="w-11 h-11 flex items-center justify-center bg-amber-100 rounded-full text-amber-600 shadow-3xs"
                    >
                      <i class="pi pi-file-excel text-lg!"></i>
                    </div>
                    <div class="flex flex-col gap-0.5">
                      <div class="font-bold text-slate-800">
                        No Billings Documented
                      </div>
                      <p
                        class="text-sm text-slate-500 max-w-[280px] leading-relaxed"
                      >
                        No commercial transaction invoices have been published
                        against this client order profile yet.
                      </p>
                    </div>
                  </div>

                  <div
                    *ngIf="soData().invoices && soData().invoices.length > 0"
                    class="flex flex-col gap-4"
                  >
                    <div
                      class="bg-slate-50 border border-slate-200/60 rounded-xl p-4 text-sm flex flex-col gap-2 shadow-3xs"
                    >
                      <div
                        class="flex justify-between items-center text-slate-600 font-medium"
                      >
                        <span>Total Billing Statements</span>
                        <span
                          class="font-bold text-slate-900 bg-slate-200/60 px-2 py-0.5 rounded text-[10px]"
                          >{{ soData().invoices.length }} Records</span
                        >
                      </div>
                      <div class="w-full bg-slate-200 rounded-full h-1.5 mt-1">
                        <div
                          class="bg-indigo-600 h-1.5 rounded-full"
                          style="width: 100%"
                        ></div>
                      </div>
                    </div>

                    <div
                      class="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-1"
                    >
                      <div
                        *ngFor="let inv of soData().invoices"
                        class="bg-white border border-slate-100 hover:border-indigo-200 rounded-xl p-4 shadow-3xs hover:shadow-xs transition-all flex flex-col gap-3 border-l-2 border-l-slate-400"
                      >
                        <div class="flex items-center justify-between">
                          <div class="flex flex-col gap-0.5">
                            <span
                              class="font-mono font-bold text-sm text-slate-900 hover:text-indigo-600 cursor-pointer flex items-center gap-1.5"
                            >
                              #{{ inv.invoiceNo }}
                              <i
                                class="pi pi-external-link text-[10px] text-slate-400"
                              ></i>
                            </span>
                            <span class="text-[12px] text-slate-400 font-medium"
                              >Issued:
                              {{ inv.invoiceDate | date: 'dd MMM yyyy' }}</span
                            >
                          </div>
                          <span
                            class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border shadow-3xs"
                            [ngClass]="{
                              'bg-emerald-50 text-emerald-700 border-emerald-200':
                                inv.status === 'Paid',
                              'bg-amber-50 text-amber-700 border-amber-200':
                                inv.status === 'Partially Paid',
                              'bg-rose-50 text-rose-700 border-rose-200':
                                inv.status === 'Unpaid' ||
                                inv.status === 'Overdue',
                            }"
                          >
                            {{ inv.status }}
                          </span>
                        </div>

                        <div
                          class="flex justify-between items-center text-sm pt-2.5 border-t border-slate-50"
                        >
                          <div>
                            <span class="text-slate-400">Paid: </span>
                            <span class="font-mono font-bold text-slate-700"
                              >RM
                              {{ inv.paidAmount || 0 | number: '1.2-2' }}</span
                            >
                          </div>
                          <div class="text-right">
                            <span class="text-slate-400">Valuation: </span>
                            <span
                              class="font-mono font-extrabold text-slate-900"
                              >RM {{ inv.totalAmount | number: '1.2-2' }}</span
                            >
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  class="col-span-12 md:col-span-6 flex flex-col gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8"
                >
                  <h3
                    class="font-bold text-slate-900 text-lg flex items-center gap-2"
                  >
                    Client Profile Details
                  </h3>

                  <div
                    class="font-black text-slate-900 text-lg tracking-wide pb-3 border-b border-slate-100"
                  >
                    {{ soData().client?.name }}
                  </div>

                  <div class="flex flex-col gap-4 text-xs text-slate-600">
                    <div class="flex items-start gap-3">
                      <i
                        class="pi pi-id-card text-slate-400 mt-0.5 text-sm"
                      ></i>
                      <div class="flex flex-col gap-0.5">
                        <span
                          class="text-sm font-bold text-slate-400 uppercase tracking-wider"
                          >Primary Contact Person</span
                        >
                        <span class="font-semibold text-slate-800 text-base">{{
                          soData().client?.contactPerson1 || 'None Registered'
                        }}</span>
                      </div>
                    </div>

                    <div class="flex items-start gap-3">
                      <i class="pi pi-phone text-slate-400 mt-0.5 text-sm"></i>
                      <div class="flex flex-col gap-0.5">
                        <span
                          class="text-sm font-bold text-slate-400 uppercase tracking-wider"
                          >Contact Phone Number</span
                        >
                        <span
                          class="font-mono font-semibold text-slate-800 text-base"
                          >{{ soData().client?.contactNo || '—' }}</span
                        >
                      </div>
                    </div>

                    <div class="flex items-start gap-3">
                      <i
                        class="pi pi-envelope text-slate-400 mt-0.5 text-sm"
                      ></i>
                      <div class="flex flex-col gap-0.5 overflow-hidden">
                        <span
                          class="text-sm font-bold text-slate-400 uppercase tracking-wider"
                          >E-Mail</span
                        >
                        <span
                          class="font-semibold text-indigo-600 font-mono select-all truncate max-w-xs text-base"
                          title="{{ soData().client?.email }}"
                        >
                          {{ soData().client?.email }}
                        </span>
                      </div>
                    </div>

                    <div
                      class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 mt-2"
                    >
                      <div class="flex flex-col gap-1">
                        <span
                          class="font-bold uppercase tracking-wider text-sm text-slate-400 flex items-center gap-1.5"
                        >
                          <span
                            class="w-1.5 h-1.5 rounded-full bg-indigo-500"
                          ></span>
                          Billing Address
                        </span>
                        <p
                          class="text-sm text-slate-500 font-medium leading-relaxed mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100 min-h-[50px]"
                        >
                          {{
                            soData().client?.billingAddress?.addressLine1 ||
                              'No corporate billing address setup configured.'
                          }}
                        </p>
                      </div>
                      <div class="flex flex-col gap-1">
                        <span
                          class="font-bold uppercase tracking-wider text-sm text-slate-400 flex items-center gap-1.5"
                        >
                          <span
                            class="w-1.5 h-1.5 rounded-full bg-amber-500"
                          ></span>
                          Delivery Address
                        </span>
                        <p
                          class="text-sm text-slate-500 font-medium leading-relaxed mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100 min-h-[50px]"
                        >
                          {{
                            soData().client?.deliveryAddress?.addressLine1 ||
                              'Identical with assigned billing configuration address.'
                          }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </p-tabpanel>
          </p-tabpanels>
        </p-tabs>
      </div>
    </div>
    <p-dialog
      header="Draft New Purchase Order Request"
      [(visible)]="poDialog"
      [modal]="true"
      [breakpoints]="{ '1199px': '75vw', '575px': '90vw' }"
      [style]="{ width: '65vw' }"
      [draggable]="false"
      [resizable]="false"
      styleClass="p-fluid shadow-xl border border-slate-100"
    >
      <div
        [formGroup]="poForm"
        *ngIf="poForm"
        class="flex flex-col gap-8 pt-4 text-slate-800"
      >
        <div
          class="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/60 p-4 rounded-xl border border-slate-100"
        >
          <div class="flex flex-col gap-3">
            <label
              class="text-[11px] font-bold text-slate-500 uppercase tracking-wider"
              >Purchase Order No</label
            >
            <input
              type="text"
              pInputText
              formControlName="purchaseOrderNo"
              placeholder="e.g. PO-2026-0004"
              class="border-slate-200 focus:border-slate-400 bg-white shadow-3xs"
            />
          </div>

          <div class="flex flex-col gap-2">
            <div class="flex flex-row items-center justify-between">
              <label
                class="text-[11px] font-bold text-slate-500 uppercase tracking-wider"
              >
                Assigned Supplier
                <span class="text-red-500 font-normal">*</span>
              </label>
              <p-button
                size="small"
                label="Add New Supplier"
                icon="pi pi-plus-circle"
                styleClass="p-0!"
                severity="info"
                [text]="true"
                (onClick)="AddSupplierClick()"
              ></p-button>
            </div>
            <p-select
              [options]="supplierSelection || []"
              formControlName="supplierId"
              placeholder="Select supplier partner"
              appendTo="body"
              [filter]="true"
              styleClass="border-slate-200 focus:border-slate-400 bg-white shadow-3xs"
            ></p-select>
          </div>

          <div class="flex flex-col gap-3">
            <label
              class="text-[11px] font-bold text-slate-500 uppercase tracking-wider"
            >
              PO Date <span class="text-red-500 font-normal">*</span>
            </label>
            <p-datepicker
              formControlName="poDate"
              [showIcon]="true"
              appendTo="body"
              dateFormat="dd/mm/yy"
              styleClass="w-full! border-slate-200 bg-white shadow-3xs"
            ></p-datepicker>
          </div>
        </div>

        <div class="flex flex-col gap-3">
          <div
            class="flex justify-between items-center border-b border-slate-100 pb-2"
          >
            <label
              class="text-xs font-bold text-slate-700 uppercase tracking-wider"
              >Line Items</label
            >
            <span class="text-xs text-slate-400"
              >Values are updated dynamically</span
            >
          </div>

          <div>
            <p-table
              [showGridlines]="true"
              [value]="items.controls"
              [tableStyle]="{ 'min-width': '60rem', 'table-layout': 'fixed' }"
              styleClass="p-datatable-sm align-middle-cells"
            >
              <ng-template #header>
                <tr>
                  <th class="p-3 w-[25%] text-slate-600 bg-gray-50!">
                    Item Code
                  </th>
                  <th class="p-3 w-[30%] text-slate-600 bg-gray-50!">
                    Description
                  </th>
                  <th
                    class="p-3 w-[15%] text-center! text-slate-600 bg-gray-50!"
                  >
                    Quantity
                  </th>
                  <th
                    class="p-3 w-[15%] text-center! text-slate-600 bg-gray-50!"
                  >
                    Unit Price
                  </th>
                  <th
                    class="p-3 w-[15%] text-right! text-slate-600 bg-gray-50!"
                  >
                    Total Amount
                  </th>
                </tr>
              </ng-template>

              <ng-template #body let-row let-i="rowIndex">
                <tr
                  [formGroup]="getRowGroup(i)"
                  class="hover:bg-slate-50/30 transition-colors"
                >
                  <td class="p-3">
                    <input
                      type="text"
                      pInputText
                      formControlName="item"
                      class="w-full p-inputtext-sm"
                      placeholder="Enter variant ID..."
                    />
                  </td>

                  <td class="p-3">
                    <p-editor
                      [style]="{ height: '80px' }"
                      formControlName="description"
                    >
                      <ng-template #header>
                        <span class="ql-formats">
                          <button type="button" class="ql-bold"></button>
                          <button type="button" class="ql-italic"></button>
                          <button type="button" class="ql-underline"></button>
                        </span>
                      </ng-template>
                    </p-editor>
                  </td>

                  <td class="p-3 text-center!">
                    <div class="flex flex-col items-center gap-1">
                      <p-inputNumber
                        formControlName="quantity"
                        mode="decimal"
                        [minFractionDigits]="2"
                        [maxFractionDigits]="4"
                        [min]="0"
                        placeholder="0.00"
                        (onInput)="calculateRowTotal(i)"
                        inputStyleClass="text-center font-semibold w-full max-w-[110px] h-8 text-xs rounded-lg text-gray-900 border-gray-200"
                      ></p-inputNumber>
                      <span
                        class="text-[10px] tracking-wider text-slate-400 uppercase font-medium"
                      >
                        {{ items.at(i).get('unit')?.value || 'units' }}
                      </span>
                    </div>
                  </td>

                  <td class="p-3 text-center!">
                    <div class="flex flex-col items-center gap-1">
                      <p-inputNumber
                        formControlName="unitPrice"
                        mode="currency"
                        currency="MYR"
                        locale="en-MY"
                        [min]="0"
                        placeholder="RM 0.00"
                        (onInput)="calculateRowTotal(i)"
                        inputStyleClass="text-center font-semibold w-full max-w-[120px] h-8 text-xs rounded-lg text-gray-900 border-gray-200"
                      ></p-inputNumber>
                    </div>
                  </td>

                  <td
                    class="p-3 text-right! font-bold text-gray-900 bg-gray-50/30"
                  >
                    RM
                    {{
                      items.at(i).get('totalPrice')?.value || 0
                        | number: '1.2-2'
                    }}
                  </td>
                </tr>
              </ng-template>
            </p-table>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-12 gap-8 items-start pt-2">
          <div class="md:col-span-7 flex flex-col gap-2">
            <label
              class="text-[11px] font-bold text-slate-500 uppercase tracking-wider"
              >Remarks</label
            >
            <textarea
              rows="4"
              pTextarea
              formControlName="remarks"
              placeholder="Add notes, delivery terms, or instructions..."
              class="text-xs p-3 border border-slate-200 rounded-xl focus:border-slate-400 w-full resize-none line-height-relaxed bg-white shadow-3xs"
            ></textarea>
          </div>

          <div
            class="md:col-span-5 bg-gray-100 rounded-xl p-5 shadow-sm flex flex-col gap-4"
          >
            <div
              class="grid grid-cols-[120px_1fr] items-center gap-2 border-b border-gray-200 pb-3"
            >
              <span
                class="text-right text-sm font-bold text-slate-500 uppercase tracking-wider"
              >
                Total Qty :
              </span>

              <p-inputNumber
                formControlName="totalQuantity"
                mode="decimal"
                inputStyleClass="text-right w-full border-none bg-transparent font-semibold text-slate-950 shadow-none"
                readonly
              ></p-inputNumber>
            </div>
            <div
              class="grid grid-cols-[120px_1fr] items-center gap-2 border-b border-gray-200 pb-3"
            >
              <span
                class="text-right text-sm font-bold text-slate-500 uppercase tracking-wider"
              >
                Gross :
              </span>
              <p-inputNumber
                formControlName="gross"
                mode="currency"
                currency="MYR"
                locale="en-MY"
                inputStyleClass="text-right w-full border-none bg-transparent font-semibold text-slate-950 shadow-none"
                readonly
              ></p-inputNumber>
            </div>

            <div
              class="grid grid-cols-[120px_1fr] items-center gap-2 border-b border-gray-200 pb-3"
            >
              <span
                class="text-right text-sm font-bold text-slate-500 uppercase tracking-wider"
              >
                Discount :
              </span>
              <p-inputNumber
                formControlName="discount"
                mode="currency"
                currency="MYR"
                locale="en-MY"
                inputStyleClass="text-right w-full font-semibold text-slate-950"
              ></p-inputNumber>
            </div>

            <div class="grid grid-cols-[120px_1fr] items-center gap-2 pt-1">
              <span class="text-right font-semibold text-lg text-slate-700">
                Total Payable :
              </span>
              <span
                class="font-black text-xl tracking-wide text-right text-emerald-700"
              >
                RM {{ poForm.get('totalAmount')?.value | number: '1.2-2' }}
              </span>
            </div>
          </div>
        </div>

        <div
          class="flex justify-end gap-3 pt-5 border-t border-slate-200/80 mt-2"
        >
          <p-button
            (onClick)="poDialog = false"
            styleClass="px-5! py-2! bg-white! hover:bg-slate-50 text-slate-600! border border-slate-200! text-sm! font-bold rounded-lg! transition-all cursor-pointer tracking-wider! uppercase!"
          >
            Dismiss Draft
          </p-button>
          <p-button
            [disabled]="poForm.invalid"
            (onClick)="SubmitPO()"
            severity="help"
            styleClass="px-6! py-2! text-sm! font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 shadow-xs tracking-wider! uppercase!"
          >
            Submit PO
          </p-button>
        </div>
      </div>
    </p-dialog>

    <p-dialog
      [(visible)]="vendorDialog"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      styleClass="preview-dialog overflow-hidden rounded-xl! w-[95%]! max-w-[850px]! shadow-2xl"
      [maskStyle]="{
        'overflow-y': 'auto',
        'background-color': 'rgba(15, 23, 42, 0.4)',
        'backdrop-filter': 'blur(4px)',
      }"
      appendTo="body"
    >
      <ng-template #headless>
        <div class="bg-slate-50 p-6 border-b border-gray-200/80 flex-none">
          <div class="flex justify-between items-start gap-4">
            <div class="flex items-center gap-3.5">
              <div
                class="bg-blue-50 border border-blue-100 p-2.5 rounded-xl shadow-sm text-blue-600"
              >
                <i class="pi pi-building text-xl flex"></i>
              </div>
              <div>
                <h2 class="text-xl font-bold text-gray-900 tracking-tight m-0">
                  Add New Supplier
                </h2>
                <p class="text-sm text-gray-500 mt-0.5 leading-relaxed">
                  Fill in the company details, contact people, and addresses to
                  create a new account.
                </p>
              </div>
            </div>
            <p-button
              icon="pi pi-times"
              [rounded]="true"
              [text]="true"
              severity="secondary"
              styleClass="hover:bg-gray-200/60 text-gray-400 hover:text-gray-600 transition-colors"
              (onClick)="vendorDialog = false"
            ></p-button>
          </div>
        </div>

        <div class="p-6 max-h-[70vh] overflow-y-auto bg-white">
          <div
            [formGroup]="supplierForm"
            class="grid grid-cols-12 gap-x-5 gap-y-4"
          >
            <div
              class="col-span-12 grid grid-cols-12 gap-x-5 gap-y-4 bg-slate-50/40 p-4 border border-gray-100 rounded-xl"
            >
              <div class="col-span-12 lg:col-span-8 flex flex-col gap-1.5">
                <label
                  class="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1"
                >
                  Company Name <span class="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  pInputText
                  class="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm placeholder:text-gray-400"
                  formControlName="name"
                  placeholder="e.g. Acme Corp Bhd"
                />
              </div>

              <div class="col-span-12 lg:col-span-4 flex flex-col gap-1.5">
                <label
                  class="text-xs font-semibold text-gray-600 uppercase tracking-wider"
                  >Account Ref No.</label
                >
                <input
                  type="text"
                  pInputText
                  class="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm placeholder:text-gray-400"
                  formControlName="acNo"
                  placeholder="e.g. ACC-2026-89"
                />
              </div>

              <div class="col-span-12 md:col-span-4 flex flex-col gap-1.5">
                <label
                  class="text-xs font-semibold text-gray-600 uppercase tracking-wider"
                  >Email Address</label
                >
                <input
                  type="text"
                  pInputText
                  class="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm placeholder:text-gray-400"
                  formControlName="email"
                  placeholder="info@acme.com"
                />
              </div>

              <div
                class="col-span-12 sm:col-span-6 md:col-span-4 flex flex-col gap-1.5"
              >
                <label
                  class="text-xs font-semibold text-gray-600 uppercase tracking-wider"
                  >Phone Number</label
                >
                <input
                  type="text"
                  pInputText
                  class="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm placeholder:text-gray-400"
                  formControlName="contactNo"
                  placeholder="e.g. +60 3-XXXX XXXX"
                />
              </div>

              <div
                class="col-span-12 sm:col-span-6 md:col-span-4 flex flex-col gap-1.5"
              >
                <label
                  class="text-xs font-semibold text-gray-600 uppercase tracking-wider"
                  >Fax Number</label
                >
                <input
                  type="text"
                  pInputText
                  class="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm placeholder:text-gray-400"
                  formControlName="faxNo"
                  placeholder="e.g. +60 3-XXXX XXXX"
                />
              </div>
            </div>

            <div class="col-span-12 border-t border-gray-100 pt-4 mt-2">
              <div class="flex items-center gap-2 mb-1">
                <i class="pi pi-users text-gray-400 text-sm"></i>
                <span
                  class="font-bold text-gray-900 uppercase tracking-wider text-xs"
                  >Contact People</span
                >
              </div>
            </div>

            <div
              class="col-span-12 lg:col-span-6 flex flex-col gap-1.5 p-3.5 bg-slate-50/60 border border-slate-100 rounded-xl"
            >
              <div
                class="text-sm font-bold text-blue-700 tracking-wide flex items-center gap-1.5 mb-1"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                Primary Contact
              </div>
              <label class="text-sm font-medium text-gray-500">Full Name</label>
              <input
                type="text"
                pInputText
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow"
                formControlName="contactPerson1"
                placeholder="e.g. Mr. John Doe or Dr. Smith"
              />
            </div>

            <div
              class="col-span-12 lg:col-span-6 flex flex-col gap-1.5 p-3.5 bg-slate-50/60 border border-slate-100 rounded-xl"
            >
              <div
                class="text-xs font-bold text-gray-600 tracking-wide flex items-center gap-1.5 mb-1"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                Secondary Contact
                <span
                  class="text-[10px] text-gray-400 lowercase font-normal italic"
                  >(Optional)</span
                >
              </div>
              <label class="text-sm font-medium text-gray-500">Full Name</label>
              <input
                type="text"
                pInputText
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow"
                formControlName="contactPerson2"
                placeholder="e.g. Ms. Jane Doe"
              />
            </div>

            <div class="col-span-12 border-t border-gray-100 pt-4 mt-2">
              <div class="flex items-center gap-2 mb-1">
                <i class="pi pi-credit-card text-gray-400 text-sm"></i>
                <span
                  class="font-bold text-gray-900 uppercase tracking-wider text-sm"
                  >Billing Address</span
                >
              </div>
            </div>

            <div
              formGroupName="billingAddress"
              class="col-span-12 grid grid-cols-12 gap-x-5 gap-y-3"
            >
              <div class="col-span-12 flex flex-col gap-1.5">
                <label class="font-medium text-gray-500">Address Line 1</label>
                <input
                  pInputText
                  formControlName="addressLine1"
                  class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Floor, building, or suite number"
                />
              </div>
              <div class="col-span-12 flex flex-col gap-1.5">
                <label class="font-medium text-gray-500">Address Line 2</label>
                <input
                  pInputText
                  formControlName="addressLine2"
                  class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Street name or neighborhood"
                />
              </div>
              <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
                <label class="font-medium text-gray-500">City</label>
                <input
                  pInputText
                  formControlName="city"
                  class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
                <label class="font-medium text-gray-500">Postcode / ZIP</label>
                <input
                  pInputText
                  formControlName="poscode"
                  class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
                <label class="font-medium text-gray-500">State</label>
                <input
                  pInputText
                  formControlName="state"
                  class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
                <label class="font-medium text-gray-500">Country</label>
                <input
                  pInputText
                  formControlName="country"
                  class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div
              class="col-span-12 border-t border-gray-100 pt-4 mt-2 flex justify-between items-center"
            >
              <div class="flex items-center gap-2">
                <i class="pi pi-truck text-gray-400 text-sm"></i>
                <span class="font-bold text-gray-900 uppercase tracking-wider"
                  >Delivery Address</span
                >
              </div>
              <div
                class="flex items-center gap-2 bg-slate-100 border border-slate-200/60 px-3 py-1 rounded-lg cursor-pointer hover:bg-slate-200/80 transition-colors group"
              >
                <input
                  type="checkbox"
                  formControlName="sameAsBilling"
                  id="sameAsBilling"
                  class="cursor-pointer h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  for="sameAsBilling"
                  class="cursor-pointer font-semibold text-gray-700 text-xs select-none"
                >
                  Same as Billing
                </label>
              </div>
            </div>

            <div
              *ngIf="!supplierForm.get('sameAsBilling')?.value"
              formGroupName="deliveryAddress"
              class="col-span-12 grid grid-cols-12 gap-x-5 gap-y-3 transition-all"
            >
              <div class="col-span-12 flex flex-col gap-1.5">
                <label class="font-medium text-gray-500">Address Line 1</label>
                <input
                  pInputText
                  formControlName="addressLine1"
                  class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Warehouse, loading bay, or suite number"
                />
              </div>
              <div class="col-span-12 flex flex-col gap-1.5">
                <label class="font-medium text-gray-500">Address Line 2</label>
                <input
                  pInputText
                  formControlName="addressLine2"
                  class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Street name or neighborhood"
                />
              </div>
              <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
                <label class="font-medium text-gray-500">City</label>
                <input
                  pInputText
                  formControlName="city"
                  class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
                <label class="font-medium text-gray-500">Postcode / ZIP</label>
                <input
                  pInputText
                  formControlName="poscode"
                  class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
                <label class="font-medium text-gray-500">State</label>
                <input
                  pInputText
                  formControlName="state"
                  class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
                <label class="font-medium text-gray-500">Country</label>
                <input
                  pInputText
                  formControlName="country"
                  class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div
              class="col-span-12 p-4 bg-blue-50 border border-blue-100 rounded-xl text-blue-800 text-sm flex items-center gap-2.5 mt-2 transition-all shadow-sm"
              *ngIf="supplierForm.get('sameAsBilling')?.value"
            >
              <i class="pi pi-info-circle text-base text-blue-600"></i>
              <span class="font-medium"
                >Delivery address will automatically match the billing
                address.</span
              >
            </div>
          </div>
        </div>

        <div
          class="p-4 bg-slate-50 border-t border-gray-200 flex justify-end items-center gap-3 flex-none"
        >
          <p-button
            (onClick)="vendorDialog = false"
            label="Cancel"
            severity="secondary"
            styleClass="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 py-2 px-5 text-sm font-medium rounded-lg shadow-sm"
          ></p-button>

          <p-button
            (onClick)="SaveVendor()"
            label="Save Supplier"
            severity="info"
            [disabled]="supplierForm.invalid"
            styleClass="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-400 border-none text-white py-2 px-6 text-sm font-medium shadow-sm rounded-lg"
          ></p-button>
        </div>
      </ng-template>
    </p-dialog>`,
  styleUrl: './sales-order-details.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesOrderDetails {
  private readonly salesOrderService = inject(SalesOrderService);
  private readonly purchaseOrderService = inject(PurchaseOrderService);
  private readonly supplierService = inject(SupplierService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly loadingService = inject(LoadingService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private sanitizer = inject(DomSanitizer);

  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  soData = signal<SalesOrderDto>({} as SalesOrderDto);

  currentId: string | null = null;
  remarks: string | null = null;
  attachmentUrl: SafeResourceUrl | null = null;

  supplierSelection: any;

  poDialog: boolean = false;
  doDialog: boolean = false;
  vendorDialog: boolean = false;

  discount: number = 0;
  taxAmount: number = 0;
  subTotal: number = 0;
  totalAmount: number = 0;

  poForm!: FormGroup;
  doForm!: FormGroup;
  supplierForm!: FormGroup;

  poData: any;

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
        Includes:
          'Client.BillingAddress,Client.DeliveryAddress, SalesOrderItems, Quotation, PurchaseOrders',
        Filter: `Id=${this.currentId}`,
        Select: null,
      })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();
          if (res) this.soData.set(res);

          if (res) {
            this.discount = res.discount || 0;
            this.taxAmount = res.taxAmount || 0;
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

  statusConfig = computed(() => {
    const currentStatus = this.soData().status;

    const configMap: Record<string, { badge: string; dot: string }> = {
      Draft: {
        badge: 'bg-amber-50 text-amber-700 border-amber-200/60',
        dot: 'bg-amber-500',
      },
      Reviewed: {
        badge: 'bg-orange-50 text-orange-700 border-orange-200/60',
        dot: 'bg-orange-500',
      },
      Approved: {
        badge: 'bg-blue-50 text-blue-700 border-blue-200/60',
        dot: 'bg-blue-500',
      },
      InProgress: {
        badge: 'bg-blue-50 text-blue-700 border-blue-200/60',
        dot: 'bg-blue-500',
      },
      Sent: {
        badge: 'bg-purple-50 text-purple-700 border-purple-200/60',
        dot: 'bg-purple-500',
      },
      Issued: {
        badge: 'bg-purple-50 text-purple-700 border-purple-200/60',
        dot: 'bg-purple-500',
      },
      PartiallyReceived: {
        badge: 'bg-cyan-50 text-cyan-700 border-cyan-200/60',
        dot: 'bg-cyan-500',
      },
      PartiallyShipped: {
        badge: 'bg-cyan-50 text-cyan-700 border-cyan-200/60',
        dot: 'bg-cyan-500',
      },
      Confirmed: {
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
        dot: 'bg-emerald-500',
      },
      Rejected: {
        badge: 'bg-rose-50 text-rose-700 border-rose-200/60',
        dot: 'bg-rose-500',
      },
      Cancelled: {
        badge: 'bg-rose-50 text-rose-700 border-rose-200/60',
        dot: 'bg-rose-500',
      },
    };

    return (
      configMap[currentStatus] || {
        badge: 'bg-gray-50 text-gray-700 border-gray-200',
        dot: 'bg-gray-500',
      }
    );
  });

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

  generateDODraft() {}

  generatePODraft() {
    const items = this.soData()?.salesOrderItems || [];

    const selectedItems = items.filter(
      (x: any) =>
        x.selected && x.itemType === 'Product' && x.qtyOnHand < x.quantity,
    );

    if (!selectedItems.length) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Items Selected',
        detail: 'Please select at least one item for PO',
      });
      return;
    }

    console.log(selectedItems);

    const poItems = selectedItems.map((x: any) => ({
      salesOrderItemId: x.id,
      inventoryId: x.inventoryId,
      item: x.item,
      description: x.description,
      quantity: x.quantity - (x.orderedQuantity || 0) - (x.qtyOnHand || 0),
      unit: x.unit,
      unitPrice: x.unitPrice,
    }));

    this.initPOForm();

    const formArray = this.poForm.get('purchaseOrderItems') as FormArray;

    poItems.forEach((item) => {
      formArray.push(
        new FormGroup({
          salesOrderItemId: new FormControl(item.salesOrderItemId),
          inventoryId: new FormControl(item.inventoryId),
          item: new FormControl(item.item),
          quantity: new FormControl(item.quantity),
          unitPrice: new FormControl(item.unitPrice),
          unit: new FormControl(item.unit),
          description: new FormControl(item.description),
          totalPrice: new FormControl(item.quantity * item.unitPrice),
        }),
      );
    });

    this.recalculatePOTotals();

    this.poForm.patchValue({
      salesOrderId: this.currentId,
      clientId: this.soData().clientId,
      fromCompanyId: this.soData().companyId,
      projectId: this.soData().projectId,
      paymentTerms: this.soData().paymentTerms,
      quotationId: this.soData().quotationId,
      poDate: new Date(),
    });

    this.poData = {
      ...this.poForm.value,
      items: poItems,
    };

    this.purchaseOrderService
      .GenerateNo()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.poForm.get('purchaseOrderNo')?.patchValue(res.purchaseOrderNo);
        },
      });

    this.getSupplierDropdown();
    this.poDialog = true;

    this.cdr.markForCheck();
  }

  getRowGroup(i: number): FormGroup {
    return this.items.at(i) as FormGroup;
  }

  get items(): FormArray {
    return this.poForm.get('purchaseOrderItems') as FormArray;
  }

  recalculatePOTotals() {
    const items =
      (this.poForm.get('purchaseOrderItems') as FormArray).value || [];

    const gross = items.reduce((sum: number, item: any) => {
      return sum + (item.quantity || 0) * (item.unitPrice || 0);
    }, 0);

    const totalQuantity = items.reduce((sum: number, item: any) => {
      return sum + (item.quantity || 0);
    }, 0);

    const discount = this.poForm.get('discount')?.value || 0;

    const totalAmount = gross - discount;

    this.poForm.patchValue(
      {
        gross,
        totalQuantity,
        totalAmount,
      },
      { emitEvent: false },
    );
  }

  getSupplierDropdown() {
    this.supplierService
      .GetMany({
        Page: 1,
        PageSize: 1000000,
        OrderBy: 'Name',
        Includes: null,
        Filter: null,
        Select: null,
      })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.supplierSelection = res.data.map((x) => ({
            label: x.name,
            value: x.id,
          }));
        },
      });
  }

  initPOForm() {
    this.poForm = new FormGroup({
      id: new FormControl<string | null>({ value: null, disabled: true }),
      purchaseOrderNo: new FormControl<string | null>(null),
      fromCompanyId: new FormControl<string | null>(null),
      poDate: new FormControl<Date | null>(null),
      supplierId: new FormControl<string | null>(null),
      paymentTerms: new FormControl<string | null>(null),
      quotationId: new FormControl<string | null>(null),
      salesOrderId: new FormControl<string | null>(null),
      projectId: new FormControl<string | null>(null),
      gross: new FormControl<number | null>(null),
      discount: new FormControl<number | null>(null),
      totalAmount: new FormControl<number | null>(null),
      notes: new FormControl<string | null>(null),
      remarks: new FormControl<string | null>(null),
      totalQuantity: new FormControl<number | null>(null),
      purchaseOrderItems: new FormArray([]),
    });

    this.poForm.get('discount')?.valueChanges.subscribe(() => {
      this.recalculatePOTotals();
    });
  }

  SubmitPO() {
    if (this.poForm.invalid) {
      ValidateAllFormFields(this.poForm);
      return;
    }

    this.loadingService.start();

    const formData = new FormData();

    const raw = this.poForm.getRawValue();

    Object.keys(raw).forEach((key) => {
      const value = (raw as any)[key];

      if (key === 'purchaseOrderItems') return;

      if (value === null || value === undefined) return;

      formData.append(key, value instanceof Date ? value.toISOString() : value);
    });

    const items = raw.purchaseOrderItems.map((item: any) => ({
      ...item,
      description: normalizeHtml(item.description),
    }));

    formData.append('purchaseOrderItems', JSON.stringify(items));
    if (this.currentId) {
      formData.append('id', this.currentId);
    }

    this.purchaseOrderService
      .Create(formData)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.messageService.add({
            severity: 'success',
            summary: 'PO Created',
            detail: `Purchase Order ${res?.purchaseOrderNo || ''} created successfully`,
          });

          this.poDialog = false;

          this.patchSoAfterPO(items);
          this.loadingService.stop();
        },
        error: (err) => {
          this.loadingService.stop();
          this.messageService.add({
            severity: 'error',
            summary: 'Failed',
            detail: err?.error?.message || 'Failed to create Purchase Order',
          });
        },
      });
  }

  patchSoAfterPO(poItems: any[]) {
    const so = this.soData();

    const updatedItems = so.salesOrderItems?.map((item: any) => {
      const match = poItems.find((p: any) => p.salesOrderItemId === item.id);

      if (!match) return item;

      return {
        ...item,
        qtyOrdered: (item.qtyOrdered || 0) + match.quantity,
        selected: false,
      };
    });

    this.soData.set({
      ...so,
      salesOrderItems: updatedItems,
    });

    this.cdr.markForCheck();
  }

  AddSupplierClick() {
    this.supplierForm = new FormGroup({
      name: new FormControl<string | null>(null, Validators.required),
      email: new FormControl<string | null>(null, [Validators.email]),
      contactNo: new FormControl<string | null>(null, Validators.required),
      faxNo: new FormControl<string | null>(null),
      contactPerson1: new FormControl<string | null>(null),
      contactPerson2: new FormControl<string | null>(null),
      acNo: new FormControl<string | null>(null),
      type: new FormControl<CompanyType>(CompanyType.Supplier),
      sameAsBilling: new FormControl(false),

      billingAddress: new FormGroup({
        name: new FormControl('Billing'),
        addressLine1: new FormControl(null, Validators.required),
        addressLine2: new FormControl(null),
        city: new FormControl(null, Validators.required),
        state: new FormControl(null, Validators.required),
        poscode: new FormControl(null, Validators.required),
        country: new FormControl('Malaysia', Validators.required),
      }),

      deliveryAddress: new FormGroup({
        name: new FormControl('Delivery'),
        addressLine1: new FormControl(null, Validators.required),
        addressLine2: new FormControl(null),
        city: new FormControl(null, Validators.required),
        state: new FormControl(null, Validators.required),
        poscode: new FormControl(null, Validators.required),
        country: new FormControl('Malaysia', Validators.required),
      }),
    });

    this.supplierForm
      .get('sameAsBilling')
      ?.valueChanges.subscribe((checked) => {
        if (checked) {
          const billingValue = this.supplierForm.get('billingAddress')?.value;
          this.supplierForm.get('deliveryAddress')?.patchValue({
            ...billingValue,
            name: 'Delivery',
          });
        }
      });

    this.vendorDialog = true;
  }

  SaveVendor() {
    ValidateAllFormFields(this.supplierForm);

    if (!this.supplierForm.valid) return;

    this.loadingService.start();

    this.supplierService
      .Create(this.supplierForm.value)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res: any) => {
          this.loadingService.stop();
          const activeAddress = res.deliveryAddress ?? res.billingAddress;

          const newCompany = {
            label: res.name || this.supplierForm.value.name,
            value: res.id,
            email: res.email,
            contactNo: res.contactNo,
            faxNo: res.faxNo,
            acNo: res.acNo,
            addressType: res.deliveryAddress ? 'Delivery' : 'Billing',
            deliveryAddress: {
              addressLine1: activeAddress.addressLine1,
              addressLine2: activeAddress.addressLine2,
              city: activeAddress.city,
              poscode: activeAddress.poscode,
              state: activeAddress.state,
              country: activeAddress.country,
            },
          };

          this.supplierSelection = [...this.supplierSelection, newCompany];

          this.poForm.get('supplierId')?.setValue(res.id);

          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `${this.supplierForm.get('name')?.value} created and selected successfully`,
            life: 3000,
          });

          this.vendorDialog = false;
          this.supplierForm.reset();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.loadingService.stop();

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail:
              err.error?.message ||
              'Failed to create vendor. Please try again.',
            life: 5000,
          });

          this.cdr.markForCheck();
        },
      });
  }

  calculateRowTotal(index: number) {
    const rowGroup = this.getRowGroup(index);
    if (!rowGroup) return;

    const quantity = Number(rowGroup.get('quantity')?.value) || 0;
    const unitPrice = Number(rowGroup.get('unitPrice')?.value) || 0;
    const discount = Number(rowGroup.get('discount')?.value) || 0;

    const totalAmount = quantity * unitPrice - discount;

    rowGroup.patchValue(
      {
        totalPrice: totalAmount,
      },
      { emitEvent: false },
    );

    this.recalculatePOTotals();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
