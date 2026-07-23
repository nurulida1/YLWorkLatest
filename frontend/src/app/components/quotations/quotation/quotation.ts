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
import {
  QuotationDto,
  QuotationStatusHistory,
} from '../../../models/Quotation';
import { UserService } from '../../../services/userService.service';
import { TimelineModule } from 'primeng/timeline';
import { DatePickerModule } from 'primeng/datepicker';
import { DrawerModule } from 'primeng/drawer';

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
    TimelineModule,
    DatePickerModule,
    DrawerModule,
  ],
  template: `<div class="w-full min-h-[92.9vh] flex flex-col p-5">
      <div class="flex flex-row items-center gap-1 text-gray-500 tracking-wide">
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
            <div class="text-gray-500">
              View, create, and track all project quotations
            </div>
          </div>

          <div class="flex flex-row items-center gap-2">
            <div class="min-w-[300px] relative">
              <input
                type="text"
                pInputText
                [(ngModel)]="search"
                (keydown)="onKeyDown($event)"
                class="w-full!"
                placeholder="Search by quotation no"
              />
              <i
                class="pi pi-search absolute! top-3! right-2! text-gray-500!"
              ></i>
            </div>
            <p-button
              label="Export as Excel"
              (onClick)="exportToExcel()"
              icon="pi pi-file-export"
              severity="secondary"
              [outlined]="true"
              styleClass="py-2! whitespace-nowrap!"
            ></p-button>
            <p-button
              label="Quotation"
              [routerLink]="'/quotations/form'"
              icon="pi pi-plus"
              severity="info"
              styleClass="py-2! whitespace-nowrap! bg-blue-600! border-none!"
            ></p-button>
          </div>
        </div>

        <div class="mt-3">
          <p-table
            #fTable
            dataKey="id"
            [value]="PagingSignal().data"
            [paginator]="true"
            [rows]="Query.PageSize"
            [totalRecords]="PagingSignal().totalElements"
            [tableStyle]="{ 'min-width': '60rem' }"
            [rowsPerPageOptions]="[10, 20, 30, 50]"
            stripedRows="false"
            [lazy]="true"
            (onLazyLoad)="NextPage($event)"
            showGridlines
            [expandedRowKeys]="expandedRows"
          >
            <ng-template #header>
              <tr>
                <th class="w-[2%]! bg-gray-100!"></th>
                <th
                  pSortableColumn="QuotationNo"
                  class="bg-gray-100! text-center! w-[10%]!"
                >
                  <div class="flex flex-row justify-center items-center gap-2">
                    <div>Quotation No</div>
                    <p-sortIcon field="QuotationNo" />
                  </div>
                </th>
                <th class="bg-gray-100! text-left! w-[30%]">Client</th>
                <th class="bg-gray-100! text-left! w-[10%]">Quotation By</th>

                <th
                  pSortableColumn="QuotationDate"
                  class="bg-gray-100! text-center! w-[10%]!"
                >
                  <div class="flex flex-row justify-center items-center gap-2">
                    <div>Quotation Date</div>
                    <p-sortIcon field="QuotationDate" />
                  </div>
                </th>
                <th
                  pSortableColumn="DueDate"
                  class="bg-gray-100! text-center! w-[10%]!"
                >
                  <div class="flex flex-row justify-center items-center gap-2">
                    <div>Due Date</div>
                    <p-sortIcon field="DueDate" />
                  </div>
                </th>
                <th
                  pSortableColumn="Status"
                  class="bg-gray-100! text-center! w-[10%]!"
                >
                  <div class="flex flex-row justify-center items-center gap-2">
                    <div>Status</div>
                    <p-sortIcon field="Status" />
                  </div>
                </th>
                <th class="bg-gray-100! text-left! w-[10%]">Action</th>
              </tr>
            </ng-template>

            <ng-template
              #body
              let-data
              let-rowIndex="rowIndex"
              let-expanded="expanded"
            >
              <tr>
                <td>
                  <div
                    class="flex items-center justify-center cursor-pointer"
                    (click)="onRowExpand(data, fTable)"
                  >
                    <i
                      class="text-sm!"
                      [class]="
                        expanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'
                      "
                    ></i>
                  </div>
                </td>
                <td class="text-center! font-semibold!">
                  {{ data.quotationNo }}
                </td>
                <td class="text-left!">{{ data.client?.name }}</td>
                <td class="text-left!">{{ data.createdBy?.displayName }}</td>

                <td class="text-center!">
                  {{ data.quotationDate | date: 'dd/MM/yyyy' }}
                </td>
                <td class="text-center!">
                  {{ data.dueDate | date: 'dd/MM/yyyy' }}
                </td>
                <td class="text-center!">
                  <div class="flex justify-center">
                    <div
                      class="rounded-full px-4 text-sm py-0.5 font-medium w-fit whitespace-nowrap"
                      [ngClass]="{
                        'bg-blue-100 text-blue-600':
                          data.status === 'Reviewed' ||
                          data.status === 'Sent' ||
                          data.status === 'Approved',
                        'bg-orange-100 text-orange-600':
                          data.status === 'Draft',
                        'bg-green-100 text-green-600':
                          data.status === 'Accepted',
                        'bg-red-100 text-red-600':
                          data.status === 'Rejected' ||
                          data.status === 'Cancelled' ||
                          data.status == 'Expired',
                      }"
                    >
                      {{ data.status }}
                    </div>
                  </div>
                </td>
                <td class="text-center!">
                  <div
                    class="flex flex-row items-center gap-6 whitespace-nowrap"
                  >
                    <p-button
                      label="Convert to SO"
                      (onClick)="ActionClick(data, 'Convert')"
                      [severity]="data.status !== 'Sent' ? 'secondary' : 'info'"
                      [outlined]="true"
                      size="small"
                      styleClass="border-2! font-semibold!"
                      [disabled]="data.status !== 'Sent'"
                    ></p-button>
                    <div
                      class="flex items-center justify-center"
                      *ngIf="data.status !== 'Cancelled'"
                    >
                      <i
                        (click)="onEllipsisClick($event, data, menu)"
                        class="pi pi-ellipsis-h cursor-pointer"
                      ></i>
                    </div>
                  </div>
                </td>
              </tr>
            </ng-template>

            <ng-template #expandedrow let-item>
              <tr>
                <td colspan="100%">
                  <div class="px-5">
                    <p-timeline
                      [value]="timelineMap[item.id]"
                      align="top"
                      layout="horizontal"
                      class="customized-timeline w-full whitespace-nowrap"
                    >
                      <ng-template #marker let-event>
                        <div
                          class="w-6 h-6 p-2 flex items-center justify-center rounded-full shadow-sm text-white"
                          [ngClass]="
                            event.actionAt ? 'bg-blue-500' : 'bg-gray-300'
                          "
                        >
                          <i
                            class="pi text-xs"
                            [ngClass]="
                              event.verified ? 'pi-check' : 'pi-circle-fill'
                            "
                          ></i>
                        </div>
                      </ng-template>
                      <ng-template #content let-event>
                        <div class="flex flex-col min-h-[70px]">
                          <div class="font-semibold text-sm">
                            {{ event.status }}
                          </div>
                          <small
                            class="text-gray-500 text-xs"
                            *ngIf="event.actionUser"
                          >
                            {{ event.actionUser }}
                          </small>
                          <small
                            class="text-gray-400 text-xs"
                            *ngIf="event.actionAt"
                          >
                            {{ event.actionAt | date: 'dd MMM, yyyy HH:mm aa' }}
                          </small>
                        </div>
                      </ng-template>
                    </p-timeline>
                  </div>
                </td>
              </tr>
            </ng-template>

            <ng-template #emptymessage>
              <tr>
                <td colspan="100%" class="border-x!">
                  <div class="text-center text-gray-500">
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

    <p-dialog
      header="Convert Quotation to Sales Order"
      [(visible)]="displayConvertSODialog"
      [modal]="true"
      [style]="{ width: '450px' }"
      [draggable]="false"
      [resizable]="false"
      (onHide)="resetConvertForm()"
    >
      <div class="flex flex-col gap-4 py-2 text-sm text-gray-700 tracking-wide">
        <div class="flex flex-col gap-1">
          <label class="font-semibold text-gray-600"
            >Client PO Number <span class="text-red-500">*</span></label
          >
          <input
            type="text"
            pInputText
            [(ngModel)]="soForm.clientPONumber"
            placeholder="e.g., PO-12345"
            class="w-full"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="font-semibold text-gray-600">PO Received Date</label>

          <p-datepicker
            [(ngModel)]="soForm.clientPODate"
            appendTo="body"
            [showIcon]="true"
            dateFormat="dd/mm/yy"
            inputStyleClass="w-full"
            styleClass="w-full"
          >
          </p-datepicker>
        </div>

        <div class="flex flex-col gap-1">
          <label class="font-semibold text-gray-600">Remarks</label>
          <input
            type="text"
            pInputText
            [(ngModel)]="soForm.remarks"
            placeholder="Optional notes..."
            class="w-full"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="font-semibold text-gray-600"
            >PO Attachment File <span class="text-red-500">*</span></label
          >
          <div
            class="flex items-center justify-between gap-2 border border-dashed border-gray-300 rounded p-3 bg-gray-50"
          >
            <input
              type="file"
              id="poFile"
              (change)="onFileSelected($event)"
              accept=".pdf,.png,.jpg,.jpeg"
              class="hidden"
              #fileInput
            />
            <div class="flex flex-col truncate max-w-[250px]">
              <span
                *ngIf="soForm.clientPOAttachment"
                (click)="downloadLocalFile(soForm.clientPOAttachment)"
                class="text-xs text-blue-600 hover:text-blue-800 font-medium underline cursor-pointer truncate flex items-center gap-1"
              >
                <i class="pi pi-download text-[10px]"></i>
                {{ soForm.clientPOAttachment.name }}
              </span>
              <span
                *ngIf="!soForm.clientPOAttachment"
                class="text-xs text-gray-500 font-medium truncate"
                >No file chosen</span
              >
            </div>
            <p-button
              label="Choose File"
              size="small"
              icon="pi pi-upload"
              severity="secondary"
              (click)="fileInput.click()"
            ></p-button>
          </div>
        </div>
      </div>

      <ng-template #footer>
        <div class="flex justify-end gap-2 mt-2">
          <p-button
            label="Cancel"
            severity="secondary"
            styleClass="py-1.5!"
            (click)="displayConvertSODialog = false"
          ></p-button>
          <p-button
            label="Convert"
            severity="success"
            styleClass="py-1.5!"
            [disabled]="!soForm.clientPONumber || !soForm.clientPOAttachment"
            (click)="submitConvertToSO()"
          ></p-button>
        </div>
      </ng-template>
    </p-dialog>

    <p-drawer
      [(visible)]="displayDetailsDrawer"
      position="right"
      styleClass="w-[70%]!"
      [modal]="true"
      [showCloseIcon]="false"
      (onHide)="selectedQuotation = null"
    >
      <ng-template #header>
        <div class="flex items-center justify-between w-full pr-4">
          <div class="flex items-center gap-4">
            <div
              class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg"
            >
              <i class="pi pi-file-edit text-white text-xl"></i>
            </div>
            <div>
              <h2 class="text-2xl font-bold text-slate-900 tracking-tight">
                Quotation Details
              </h2>
              <p class="text-sm text-slate-500 mt-0.5">
                Complete quotation information and line items
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <div
              *ngIf="!loadingDetails && selectedQuotation"
              class="rounded-xl px-4 py-2 text-sm font-bold uppercase tracking-wider shadow-sm"
              [ngClass]="{
                'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 border-2 border-blue-200':
                  selectedQuotation.status === 'Reviewed' ||
                  selectedQuotation.status === 'Sent' ||
                  selectedQuotation.status === 'Approved',
                'bg-gradient-to-r from-orange-100 to-orange-50 text-orange-700 border-2 border-orange-200':
                  selectedQuotation.status === 'Draft',
                'bg-gradient-to-r from-green-100 to-green-50 text-green-700 border-2 border-green-200':
                  selectedQuotation.status === 'Accepted',
                'bg-gradient-to-r from-red-100 to-red-50 text-red-700 border-2 border-red-200':
                  selectedQuotation.status === 'Rejected' ||
                  selectedQuotation.status === 'Cancelled' ||
                  selectedQuotation.status === 'Expired',
              }"
            >
              <i
                class="pi mr-2 mt-1"
                [ngClass]="{
                  'pi-eye': selectedQuotation.status === 'Reviewed',
                  'pi-send': selectedQuotation.status === 'Sent',
                  'pi-check-circle':
                    selectedQuotation.status === 'Approved' ||
                    selectedQuotation.status === 'Accepted',
                  'pi-file-edit': selectedQuotation.status === 'Draft',
                  'pi-times-circle':
                    selectedQuotation.status === 'Rejected' ||
                    selectedQuotation.status === 'Cancelled' ||
                    selectedQuotation.status === 'Expired',
                }"
              ></i>
              {{ selectedQuotation.status }}
            </div>

            <p-button
              icon="pi pi-times"
              [rounded]="true"
              [text]="true"
              severity="secondary"
              styleClass="hover:bg-slate-100 text-slate-600"
              (onClick)="displayDetailsDrawer = false"
            ></p-button>
          </div>
        </div>
      </ng-template>

      <div
        *ngIf="loadingDetails"
        class="flex flex-col items-center justify-center py-16 gap-4"
      >
        <div
          class="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center"
        >
          <i class="pi pi-spin pi-spinner text-3xl text-blue-600"></i>
        </div>
        <div class="text-center">
          <div class="text-slate-900 font-semibold text-lg">
            Loading quotation details...
          </div>
          <div class="text-slate-500 text-sm mt-1">
            Please wait while we fetch the information
          </div>
        </div>
      </div>

      <div
        *ngIf="!loadingDetails && selectedQuotation"
        class="flex flex-col gap-6 p-6 bg-slate-50 min-h-full"
      >
        <div
          *ngIf="selectedQuotation.status === 'Draft'"
          class="bg-white rounded-xl border-2 border-orange-200 p-4 flex items-center justify-between shadow-sm"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center"
            >
              <i class="pi pi-exclamation-triangle text-orange-600 text-lg"></i>
            </div>
            <div>
              <div class="font-semibold text-slate-900">
                This quotation is in
                <b class="text-orange-400 tracking-wide">Draft</b> status
              </div>
              <div class="text-sm text-slate-600 mt-0.5">
                Review and mark as reviewed, or cancel if needed
              </div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <p-button
              label="Mark as Reviewed"
              icon="pi pi-check-circle"
              severity="success"
              styleClass="px-5! py-2.5 font-semibold bg-gradient-to-r from-green-600 to-green-500 border-0 shadow-lg shadow-green-500/25 rounded-xl"
              (onClick)="
                updateQuotationStatus(selectedQuotation.id, 'Reviewed')
              "
            ></p-button>
            <p-button
              label="Cancel Quote"
              icon="pi pi-ban"
              severity="danger"
              [outlined]="true"
              styleClass="px-5! py-2.5 font-semibold border-2 border-red-200 text-red-700 hover:bg-red-50 rounded-xl"
              (onClick)="
                updateQuotationStatus(selectedQuotation.id, 'Cancelled')
              "
            ></p-button>
          </div>
        </div>

        <div
          class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
        >
          <div class="bg-gray-100 px-8 py-3 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <div>
                <div
                  class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1"
                >
                  Quotation Number
                </div>
                <div class="text-2xl font-bold tracking-wide">
                  {{ selectedQuotation.quotationNo }}
                </div>
              </div>
              <div class="text-right">
                <div
                  class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1"
                >
                  Date
                </div>
                <div class="text-lg font-bold">
                  {{ selectedQuotation.quotationDate | date: 'dd MMM yyyy' }}
                </div>
              </div>
            </div>
          </div>

          <div class="px-8 py-5 space-y-3">
            <div class="pb-2 border-b-2 border-slate-100">
              <div
                class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2"
              >
                Subject
              </div>
              <div class="text-lg font-semibold text-slate-900 leading-relaxed">
                {{ selectedQuotation.subject || 'No subject provided' }}
              </div>
            </div>

            <div class="grid grid-cols-2 gap-6">
              <div
                class="bg-gradient-to-br from-blue-50 to-slate-50 rounded-xl border-2 border-blue-100 p-5"
              >
                <div
                  class="flex items-center gap-2 mb-4 pb-3 border-b-2 border-blue-200/50"
                >
                  <div
                    class="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center"
                  >
                    <i class="pi pi-building text-white text-sm"></i>
                  </div>
                  <span
                    class="font-bold text-slate-900 uppercase tracking-wider text-sm"
                    >From</span
                  >
                </div>
                <div
                  class="space-y-2.5 text-sm"
                  *ngIf="selectedQuotation.fromCompany"
                >
                  <div class="font-bold text-slate-900 text-base">
                    {{ selectedQuotation.fromCompany?.name }}
                  </div>
                  <div class="text-slate-700 leading-relaxed">
                    <div>
                      {{
                        selectedQuotation.fromCompany?.billingAddress
                          ?.addressLine1
                      }}
                    </div>
                    <div>
                      {{
                        selectedQuotation.fromCompany?.billingAddress
                          ?.addressLine2
                      }}
                    </div>
                    <div>
                      {{ selectedQuotation.fromCompany?.billingAddress?.city }},
                      {{ selectedQuotation.fromCompany?.billingAddress?.state }}
                    </div>
                    <div>
                      {{
                        selectedQuotation.fromCompany?.billingAddress?.poscode
                      }}
                    </div>
                  </div>
                  <div class="pt-2 mt-2 border-t border-blue-200/50 space-y-1">
                    <div class="flex items-center gap-2 text-slate-700">
                      <i class="pi pi-phone text-blue-600 text-xs"></i>
                      <span>{{
                        selectedQuotation.fromCompany?.contactNo
                      }}</span>
                    </div>
                    <div class="flex items-center gap-2 text-slate-700">
                      <i class="pi pi-envelope text-blue-600 text-xs"></i>
                      <span class="break-all">{{
                        selectedQuotation.fromCompany?.email
                      }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div
                class="bg-gradient-to-br from-emerald-50 to-slate-50 rounded-xl border-2 border-emerald-100 p-5"
              >
                <div
                  class="flex items-center gap-2 mb-4 pb-3 border-b-2 border-emerald-200/50"
                >
                  <div
                    class="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center"
                  >
                    <i class="pi pi-user text-white text-sm"></i>
                  </div>
                  <span
                    class="font-bold text-slate-900 uppercase tracking-wider text-sm"
                    >Bill To</span
                  >
                </div>
                <div
                  class="space-y-2.5 text-sm"
                  *ngIf="selectedQuotation.client"
                >
                  <div class="font-bold text-slate-900 text-base">
                    {{ selectedQuotation.client?.name }}
                  </div>
                  <div class="text-slate-700 leading-relaxed">
                    <div>
                      {{
                        selectedQuotation.client?.billingAddress?.addressLine1
                      }}
                    </div>
                    <div>
                      {{
                        selectedQuotation.client?.billingAddress?.addressLine2
                      }}
                    </div>
                    <div>
                      {{ selectedQuotation.client?.billingAddress?.city }},
                      {{ selectedQuotation.client?.billingAddress?.state }}
                    </div>
                    <div>
                      {{ selectedQuotation.client?.billingAddress?.poscode }}
                    </div>
                  </div>
                  <div
                    class="pt-2 mt-2 border-t border-emerald-200/50 space-y-1"
                  >
                    <div class="flex items-center gap-2 text-slate-700">
                      <i class="pi pi-user text-emerald-600 text-xs"></i>
                      <span>{{
                        selectedQuotation.client?.contactPerson1
                      }}</span>
                    </div>
                    <div class="flex items-center gap-2 text-slate-700">
                      <i class="pi pi-phone text-emerald-600 text-xs"></i>
                      <span>{{ selectedQuotation.client?.contactNo }}</span>
                    </div>
                    <div class="flex items-center gap-2 text-slate-700">
                      <i class="pi pi-envelope text-emerald-600 text-xs"></i>
                      <span class="break-all">{{
                        selectedQuotation.client?.email
                      }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              *ngIf="selectedQuotation.projectCode"
              class="bg-slate-50 rounded-xl border border-slate-200 p-4"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <i class="pi pi-briefcase text-slate-500"></i>
                  <span
                    class="text-sm font-bold text-slate-600 uppercase tracking-wider"
                    >Project Code</span
                  >
                </div>
                <span class="font-mono font-bold text-slate-900">{{
                  selectedQuotation.projectCode
                }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-slate-200">
          <div class="px-8 py-5">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center"
              >
                <i class="pi pi-list text-lg!"></i>
              </div>
              <div>
                <h3 class="text-xl font-bold">Line Items</h3>
                <p class="text-gray-500 text-sm mt-0.5">
                  Detailed quotation items and pricing
                </p>
              </div>
            </div>
          </div>

          <div class="overflow-auto px-2">
            <p-table
              [value]="getSortedQuotationItems()"
              styleClass="border! border-gray-200!"
              [showGridlines]="true"
            >
              <ng-template #header>
                <tr class="border-b-2 border-slate-200">
                  <th
                    class="bg-gray-100! text-center! text-xs font-bold text-slate-700 uppercase tracking-wider w-[5%]!"
                  >
                    Item
                  </th>
                  <th
                    class="bg-gray-100! text-left! text-xs font-bold text-slate-700 uppercase tracking-wider w-[35%]!"
                  >
                    Description
                  </th>
                  <th
                    class="bg-gray-100! text-center! text-xs font-bold text-slate-700 uppercase tracking-wider w-[5%]!"
                  >
                    Unit
                  </th>
                  <th
                    class="bg-gray-100! text-center! text-xs font-bold text-slate-700 uppercase tracking-wider w-[10%]!"
                  >
                    Qty
                  </th>
                  <th
                    class="bg-gray-100! text-right! text-xs font-bold text-slate-700 uppercase tracking-wider w-[15%]!"
                  >
                    Unit Price (RM)
                  </th>
                  <th
                    class="bg-gray-100! text-right! text-xs font-bold text-slate-700 uppercase tracking-wider w-[25%]!"
                  >
                    Total (RM)
                  </th>
                </tr>
              </ng-template>
              <ng-template #body let-item let-i="rowIndex">
                <ng-container>
                  <tr
                    *ngIf="item.type === 'Category'"
                    class="bg-gray-50 border-y-2 border-gray-200"
                  >
                    <td colspan="6" class="px-4 py-3">
                      <div class="flex items-center gap-3">
                        <span
                          class="font-bold text-gray-900 text-base"
                          [innerHTML]="item.description"
                        ></span>
                      </div>
                    </td>
                  </tr>

                  <tr
                    *ngIf="item.type === 'Item'"
                    class="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                  >
                    <td class="text-center!">
                      {{ item.item || '-' }}
                    </td>
                    <td class="px-4 py-4">
                      <div
                        class="text-sm text-slate-900 leading-relaxed"
                        [innerHTML]="item.description"
                      ></div>
                    </td>
                    <td class="text-center!">
                      <span
                        class="inline-block px-3 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium text-sm"
                      >
                        {{ item.unit || '-' }}
                      </span>
                    </td>
                    <td class="text-center! font-semibold text-slate-900">
                      {{ item.quantity || '-' }}
                    </td>
                    <td
                      class="text-right! font-mono font-semibold text-slate-900"
                    >
                      {{
                        item.unitPrice
                          ? (item.unitPrice | number: '1.2-2')
                          : '-'
                      }}
                    </td>
                    <td class="text-right! font-mono font-bold text-slate-900">
                      {{
                        item.totalPrice
                          ? (item.totalPrice | number: '1.2-2')
                          : '-'
                      }}
                    </td>
                  </tr>
                </ng-container>

                <tr *ngIf="!selectedQuotation.quotationItems?.length">
                  <td colspan="6" class="px-4 py-12 text-center">
                    <div class="flex flex-col items-center gap-3">
                      <div
                        class="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center"
                      >
                        <i class="pi pi-inbox text-3xl text-slate-300"></i>
                      </div>
                      <div class="text-slate-600 font-semibold">
                        No items found
                      </div>
                      <div class="text-sm text-slate-400">
                        This quotation doesn't have any line items yet
                      </div>
                    </div>
                  </td>
                </tr>
              </ng-template>

              <ng-template #footer>
                <tr class="border-slate-200 bg-slate-50/50">
                  <td
                    colspan="5"
                    class="text-right! font-bold text-slate-700 text-base"
                  >
                    Subtotal
                  </td>
                  <td class="text-right! font-mono font-bold text-slate-900">
                    {{ selectedQuotation.subTotal | number: '1.2-2' }}
                  </td>
                </tr>

                <tr *ngIf="selectedQuotation.discount" class="bg-slate-50/30">
                  <td
                    colspan="5"
                    class="text-right! font-bold text-red-600! text-base"
                  >
                    Discount
                  </td>
                  <td
                    class="text-right! font-mono font-bold text-red-600! text-base"
                  >
                    -{{ selectedQuotation.discount | number: '1.2-2' }}
                  </td>
                </tr>

                <tr class=" bg-gray-100">
                  <td
                    colspan="5"
                    class="bg-gray-100! px-4 py-5 text-right! font-bold text-slate-900 text-lg"
                  >
                    Total Amount
                  </td>
                  <td
                    class="bg-gray-100! px-4 py-5 text-right! font-mono font-bold text-gray-900 text-xl"
                  >
                    {{
                      selectedQuotation.totalAmount
                        | currency: 'RM ' : 'symbol' : '1.2-2'
                    }}
                  </td>
                </tr>
              </ng-template>
            </p-table>
          </div>
        </div>

        <div
          class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
        >
          <div class="bg-gray-100 px-8 py-5 border-b border-gray-200">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-lg bg-gray-300 backdrop-blur-sm flex items-center justify-center"
              >
                <i class="pi pi-file-edit text-lg!"></i>
              </div>
              <div>
                <h3 class="text-xl font-bold">Terms & Conditions</h3>
                <p class="text-gray-500 text-sm mt-0.5">
                  Commercial terms for this quotation
                </p>
              </div>
            </div>
          </div>

          <div class="p-8 grid grid-cols-12 gap-3">
            <div class="col-span-1 font-semibold">Terms</div>
            <div class="col-span-11">
              : {{ selectedQuotation.paymentTerms }}
            </div>
            <div class="col-span-1 font-semibold">Validity</div>
            <div class="col-span-11">
              : {{ selectedQuotation.validity }}
              {{ selectedQuotation.validityType }} (with effect from the date of
              this quotation)
            </div>
            <div class="col-span-1 font-semibold">Execution</div>
            <div class="col-span-11">: {{ selectedQuotation.execution }}</div>
            <div class="col-span-1 font-semibold">Warranty</div>
            <div class="col-span-11">
              : {{ selectedQuotation.warrantyTerms }}
            </div>

            <div
              *ngIf="selectedQuotation.remarks"
              class="col-span-12 mt-6 bg-yellow-50 rounded-xl border border-yellow-400 p-5"
            >
              <div class="flex items-center gap-2 mb-3">
                <i class="pi pi-comment text-yellow-600"></i>
                <span
                  class="text-xs font-bold text-slate-500 uppercase tracking-wider"
                  >Remarks</span
                >
              </div>
              <div
                class="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap"
              >
                {{ selectedQuotation.remarks }}
              </div>
            </div>
          </div>
        </div>

        <div
          class="bg-white rounded-xl border border-slate-200 p-6 flex items-center justify-between shadow-sm sticky bottom-0"
        >
          <div class="flex items-center gap-2 text-sm text-slate-600">
            <i class="pi pi-info-circle"></i>
            <span
              >Last updated:
              {{
                selectedQuotation.updatedAt
                  ? (selectedQuotation.updatedAt | date: 'dd MMM yyyy, h:mm a')
                  : (selectedQuotation.createdAt | date: 'dd MMM yyyy, h:mm a')
              }}</span
            >
          </div>
          <div class="flex items-center gap-3">
            <p-button
              label="Generate PDF"
              icon="pi pi-file-pdf"
              severity="danger"
              styleClass="px-5 py-2.5 font-semibold border-2 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl"
              (onClick)="generatePDF()"
            ></p-button>
            <p-button
              *ngIf="selectedQuotation.status === 'Draft'"
              label="Edit Quotation"
              icon="pi pi-pencil"
              severity="info"
              styleClass="px-5 py-2.5 font-semibold bg-gradient-to-r from-blue-600 to-blue-500 border-0 shadow-lg shadow-blue-500/25 rounded-xl"
              (onClick)="ActionClick(selectedQuotation, 'Update')"
            ></p-button>
            <p-button
              *ngIf="selectedQuotation.status === 'Reviewed'"
              label="Mark as Sent"
              icon="pi pi-send"
              severity="info"
              styleClass="px-5 py-2.5 font-semibold bg-gradient-to-r from-blue-600 to-blue-500 border-0 shadow-lg shadow-blue-500/25 rounded-xl"
              (onClick)="updateQuotationStatus(selectedQuotation.id, 'Sent')"
            ></p-button>
          </div>
        </div>
      </div>
    </p-drawer> `,
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
  expandedRows: { [key: string]: boolean } = {};

  search: string = '';
  menuItems: MenuItem[] = [];
  events: any[] = [];

  displayReviseByDialog: boolean = false;
  displayConvertSODialog: boolean = false;
  displayDetailsDrawer: boolean = false;
  loadingDetails: boolean = false;

  selectedQuotation: any;

  currentUser = this.userService.currentUser;

  reviewerSelection: { label: string; value: string }[] = [];

  isAdmin: boolean = false;

  timelineMap: { [key: string]: any[] } = {};

  soForm = {
    quotationData: null as any,
    clientPONumber: '',
    clientPODate: '',
    remarks: '',
    clientPOAttachment: null as File | null,
  };

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 10;
    this.Query.Filter = null;
    this.Query.OrderBy = 'CreatedAt desc';
    this.Query.Select = null;
    this.Query.Includes =
      'FromCompany.BillingAddress,Client.BillingAddress,QuotationStatusHistories,QuotationStatusHistories.ActionUser,QuotationItems,Project';
  }

  ngOnInit(): void {}

  GetData() {
    this.loadingService.start();

    this.quotationService
      .GetMany(this.Query)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();
          this.PagingSignal.set(res);

          const statusOrder = [
            'Draft',
            'Approved',
            'Sent',
            'Accepted',
            'Rejected',
            'Cancelled',
            'Expired',
          ];

          const allHistories = res.data.flatMap(
            (x) => x.quotationStatusHistories || [],
          );

          const latestByStatus = new Map<string, any>();

          for (const h of allHistories) {
            const existing = latestByStatus.get(h.status);

            if (
              !existing ||
              new Date(h.actionAt) > new Date(existing.actionAt)
            ) {
              latestByStatus.set(h.status, h);
            }
          }

          const reachedIndex =
            Math.max(
              ...allHistories.map((h) => statusOrder.indexOf(h.status)),
            ) ?? -1;

          this.events = statusOrder.map((status, index) => {
            const item = latestByStatus.get(status);

            return {
              status,
              actionAt: item?.actionAt ?? null,
              actionUser: item?.actionUser?.displayName,
              verified: index <= reachedIndex,
            };
          });

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
    if (!data) return;

    if (action === 'Update') {
      this.router.navigate(['/quotations/form'], {
        queryParams: { id: data.id },
      });
    } else if (action === 'Convert') {
      this.soForm.quotationData = data;
      this.displayConvertSODialog = true;
      this.cdr.markForCheck();
    } else if (action === 'Download') {
      this.quotationService.downloadPdf(data.id);
    } else if (action === 'Reviewed') {
      this.selectedQuotation = data;
      this.displayDetailsDrawer = true;
    }
  }

  onRowExpand(data: QuotationDto, table: Table) {
    if (!this.timelineMap[data.id]) {
      this.timelineMap[data.id] = this.buildTimeline(data);
    }

    table.toggleRow(data);
  }

  onEllipsisClick(event: any, quotation: QuotationDto, menu: any) {
    const status = quotation.status;

    this.menuItems = [];

    if (status === 'Draft') {
      this.menuItems.push(
        {
          label: 'Edit',
          icon: 'pi pi-pencil',
          command: () => this.ActionClick(quotation, 'Update'),
        },
        {
          label: 'Review',
          icon: 'pi pi-file-edit',
          command: () =>
            this.router.navigate(['/quotations/details'], {
              queryParams: { id: quotation.id },
            }),
        },
      );
    }

    if (status === 'Sent') {
      this.menuItems.push(
        // {
        //   label: 'Convert to SO',
        //   icon: 'pi pi-file',
        //   command: () => this.ActionClick(quotation, 'Convert'),
        // },
        {
          label: 'Rejected',
          icon: 'pi pi-times-circle',
          command: () => this.updateQuotationStatus(quotation.id, 'Rejected'),
        },
        {
          label: 'View Details',
          icon: 'pi pi-eye',
          command: () =>
            this.router.navigate(['/quotations/details'], {
              queryParams: { id: quotation.id },
            }),
        },
      );
    }

    if (status === 'Approved') {
      this.menuItems.push(
        {
          label: 'Mark As Sent',
          icon: 'pi pi-send',
          command: () => this.updateQuotationStatus(quotation.id, 'Sent'),
        },
        {
          label: 'Cancel',
          icon: 'pi pi-times-circle',
          command: () => this.updateQuotationStatus(quotation.id, 'Cancelled'),
        },
        {
          label: 'View Details',
          icon: 'pi pi-eye',
          command: () =>
            this.router.navigate(['/quotations/details'], {
              queryParams: { id: quotation.id },
            }),
        },
      );
    }

    if (status === 'Draft') {
      this.menuItems.push({
        label: 'Delete',
        icon: 'pi pi-trash',
        command: () => this.deleteQuotation(quotation.id),
      });
    }

    if (status === 'Accepted') {
      this.menuItems.push(
        {
          label: 'View Details',
          icon: 'pi pi-eye',
          command: () =>
            this.router.navigate(['/quotations/details'], {
              queryParams: { id: quotation.id },
            }),
        },
        {
          label: 'Download as PDF',
          icon: 'pi pi-file-pdf',
          command: () => this.ActionClick(quotation, 'Download'),
        },
        // { separator: true },
        // {
        //   label: 'Attach PO',
        //   icon: 'pi pi-paperclip',
        //   command: () => this.ActionClick(quotation, 'PO'),
        // },
        // {
        //   label: 'Attach Work Order',
        //   icon: 'pi pi-paperclip',
        //   command: () => this.ActionClick(quotation, 'WO'),
        // },
        // {
        //   label: 'Attach Bill',
        //   icon: 'pi pi-paperclip',
        //   command: () => this.ActionClick(quotation, 'Bill'),
        // },
      );
    } else if (status === 'Rejected' || status == 'Expired') {
      this.menuItems.push({
        label: 'View Details',
        icon: 'pi pi-eye',
        command: () =>
          this.router.navigate(['/quotations/details'], {
            queryParams: { id: quotation.id },
          }),
      });
    }

    if (this.menuItems.length > 0) {
      menu.toggle(event);
    }
  }

  openDetailsDrawer(data: QuotationDto) {
    this.displayDetailsDrawer = true;
    this.loadingDetails = true;
    setTimeout(() => {
      this.selectedQuotation = data;
      this.loadingDetails = false;
    }, 100);
    this.cdr.markForCheck();
  }

  updateQuotationStatus(id: string, newStatus: string) {
    this.loadingService.start();

    this.quotationService
      .UpdateStatus(id, newStatus)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res: any) => {
          this.loadingService.stop();

          const currentPaging = this.PagingSignal();

          const updatedData = currentPaging.data.map((q) => {
            if (q.id !== id) return q;

            const newHistory = {
              id: res.id,
              status: res.status,
              actionAt: res.actionAt,
              remarks: res.remarks,
              actionUser: res.actionUser,
              quotationId: id,
              actionUserId: res.actionUser?.id,
              createdAt: res.actionAt,
              signatureImage: null,
            } as any;

            const updatedHistories = [
              ...(q.quotationStatusHistories || []),
              newHistory,
            ];

            const updatedQuotation = {
              ...q,
              status: res.status,
              quotationStatusHistories: updatedHistories,
            };

            this.timelineMap = {
              ...this.timelineMap,
              [id]: this.buildTimeline(updatedQuotation),
            };

            return updatedQuotation;
          });

          this.PagingSignal.set({
            ...currentPaging,
            data: updatedData,
          });

          this.messageService.add({
            severity: 'success',
            summary: 'Status Updated',
            detail: `Quotation is now ${res.status}`,
          });
          this.displayDetailsDrawer = false;
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

  getSortedQuotationItems() {
    if (!this.selectedQuotation?.quotationItems) {
      return [];
    }

    const items = [...this.selectedQuotation.quotationItems];

    items.sort((a, b) => {
      const orderA = a.sortOrder ?? 999999;
      const orderB = b.sortOrder ?? 999999;
      return orderA - orderB;
    });

    return items;
  }

  generatePDF() {}

  buildTimeline(quotation: QuotationDto): any[] {
    const statusOrder = [
      'Draft',
      'Approved',
      'Sent',
      'Accepted',
      'Rejected',
      'Cancelled',
      'Expired',
    ];

    const histories = quotation.quotationStatusHistories || [];
    const latestByStatus = new Map<string, any>();

    for (const h of histories) {
      const existing = latestByStatus.get(h.status);

      if (!existing || new Date(h.actionAt) > new Date(existing.actionAt)) {
        latestByStatus.set(h.status, h);
      }
    }

    const reachedIndex =
      Math.max(...histories.map((h) => statusOrder.indexOf(h.status))) ?? -1;

    return statusOrder.map((status, index) => {
      const item = latestByStatus.get(status);

      return {
        status,
        actionAt: item?.actionAt ?? null,
        actionUser: item?.actionUser?.displayName || 'System',
        verified: index <= reachedIndex,
      };
    });
  }

  onFileSelected(event: any) {
    const fileList: FileList = event.target.files;
    if (fileList.length > 0) {
      this.soForm.clientPOAttachment = fileList[0];
    }
  }

  submitConvertToSO() {
    if (
      !this.soForm.clientPONumber ||
      !this.soForm.clientPOAttachment ||
      !this.soForm.quotationData
    ) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please provide a PO Number and upload an attachment file.',
      });
      return;
    }

    this.loadingService.start();
    this.displayConvertSODialog = false;

    const quotationId = this.soForm.quotationData.id;

    let formattedPODate: string | undefined = undefined;
    if (this.soForm.clientPODate) {
      const dateObj = new Date(this.soForm.clientPODate);
      if (!isNaN(dateObj.getTime())) {
        formattedPODate = dateObj.toISOString().split('T')[0];
      }
    }

    this.quotationService
      .ConvertToSalesOrder(
        quotationId,
        this.soForm.clientPONumber,
        formattedPODate || undefined,
        this.soForm.clientPOAttachment || undefined,
        this.soForm.remarks || undefined,
      )
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res: any) => {
          this.loadingService.stop();
          this.messageService.add({
            severity: 'success',
            summary: 'Converted Successfully',
            detail: `Sales Order generated: ${res.salesOrderNo}`,
          });

          const currentPaging = this.PagingSignal();

          const newHistory: QuotationStatusHistory = {
            id: res.id ?? crypto.randomUUID(),
            status: 'Accepted',
            actionAt: new Date(),
            remarks: `Converted into Sales Order ${res.salesOrderNo}`,
            actionUser: this.currentUser
              ? {
                  id: this.currentUser.userId,
                  fullName: this.currentUser.fullName,
                }
              : undefined,
            actionUserId: this.currentUser?.userId || '',
            quotationId: quotationId,

            quotation: null as any,
          };

          const updatedData: QuotationDto[] = currentPaging.data.map((q) => {
            if (q.id !== quotationId) return q;

            const updatedHistories: QuotationStatusHistory[] = [
              ...(q.quotationStatusHistories || []),
              newHistory,
            ];

            const updatedQuotation: QuotationDto = {
              ...q,
              status: 'Accepted',
              quotationStatusHistories: updatedHistories,
            };

            this.timelineMap = {
              ...this.timelineMap,
              [quotationId]: this.buildTimeline(updatedQuotation),
            };

            return updatedQuotation;
          });

          this.PagingSignal.set({
            ...currentPaging,
            data: updatedData,
          });
          this.resetConvertForm();
          this.cdr.markForCheck();
        },
        error: () => {
          this.loadingService.stop();
        },
      });
  }

  downloadLocalFile(file: File | null) {
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);

    const tempAnchor = document.createElement('a');
    tempAnchor.href = objectUrl;
    tempAnchor.download = file.name;

    document.body.appendChild(tempAnchor);
    tempAnchor.click();

    document.body.removeChild(tempAnchor);
    URL.revokeObjectURL(objectUrl);
  }

  resetConvertForm() {
    this.soForm = {
      quotationData: null,
      clientPONumber: '',
      clientPODate: '',
      remarks: '',
      clientPOAttachment: null,
    };
  }

  convert(type: 'Invoice' | 'SO', data: any) {
    this.loadingService.start();

    const action$: Observable<any> =
      type === 'Invoice'
        ? this.quotationService.ConvertToInvoice(data.id)
        : this.quotationService.ConvertToSalesOrder(data.id);

    action$.subscribe({
      next: (res: any) => {
        this.loadingService.stop();
        this.messageService.add({
          severity: 'success',
          summary: 'Converted Successfully',
          detail: `${type} generated: ${res.invoiceNo || res.salesOrderNo}`,
        });
      },
      error: () => this.loadingService.stop(),
    });
  }

  deleteQuotation(id: string) {
    this.loadingService.start();

    this.quotationService
      .Delete(id)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: () => {
          this.loadingService.stop();

          const current = this.PagingSignal();
          this.PagingSignal.set({
            ...current,
            data: current.data.filter((x) => x.id !== id),
          });

          this.messageService.add({
            severity: 'success',
            summary: 'Deleted',
            detail: 'Quotation removed successfully',
          });

          this.cdr.markForCheck();
        },
        error: () => {
          this.loadingService.stop();
        },
      });
  }

  exportToExcel() {
    this.quotationService.ExportToExcel().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;

        const fileName = `Quotation_${new Date().getTime()}.xlsx`;

        link.download = fileName;
        link.click();

        window.URL.revokeObjectURL(url);
      },
    });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
