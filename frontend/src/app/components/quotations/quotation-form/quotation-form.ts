import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { LoadingService } from '../../../services/loading.service';
import { QuotationService } from '../../../services/quotationService.service';
import { MessageService } from 'primeng/api';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, map, of, Subject, switchMap, takeUntil } from 'rxjs';
import {
  denormalizeHtml,
  normalizeHtml,
  ValidateAllFormFields,
} from '../../../shared/helpers/helpers';
import { CompanyService } from '../../../services/companyService';
import { CompanyType } from '../../../shared/enum/enum';
import { DatePickerModule } from 'primeng/datepicker';
import { EditorModule } from 'primeng/editor';
import { ClientService } from '../../../services/ClientService';
import { DialogModule } from 'primeng/dialog';
import { TabsModule } from 'primeng/tabs';
import { CheckboxModule } from 'primeng/checkbox';

@Component({
  selector: 'app-quotation-form',
  imports: [
    CommonModule,
    InputTextModule,
    TableModule,
    ButtonModule,
    ReactiveFormsModule,
    TextareaModule,
    InputNumberModule,
    SelectModule,
    RouterLink,
    DatePickerModule,
    EditorModule,
    DialogModule,
    TabsModule,
    CheckboxModule,
  ],
  template: `<div
      class="w-full min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50"
    >
      <div
        class="bg-white border-b border-slate-200/60 px-6 py-4 sticky top-0 z-10 backdrop-blur-sm bg-white/95"
      >
        <div class="max-w-[1600px] mx-auto">
          <div class="flex items-center gap-2.5 text-sm text-slate-500">
            <i class="pi pi-home text-slate-400"></i>
            <div
              [routerLink]="'/dashboard'"
              class="cursor-pointer hover:text-blue-600 transition-all duration-200 font-medium hover:underline underline-offset-4"
            >
              Dashboard
            </div>
            <i class="pi pi-chevron-right text-xs text-slate-300"></i>
            <div
              [routerLink]="'/quotations'"
              class="cursor-pointer hover:text-blue-600 transition-all duration-200 font-medium hover:underline underline-offset-4"
            >
              Quotations
            </div>
            <i class="pi pi-chevron-right text-xs text-slate-300"></i>
            <div class="text-slate-900 font-semibold">
              {{ currentId ? FG.get('quotationNo')?.value : 'New Quotation' }}
            </div>
          </div>
        </div>
      </div>

      <div class="max-w-[1600px] mx-auto px-6 py-8 space-y-6">
        <div
          class="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden"
        >
          <div
            class="px-8 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div class="flex items-center gap-4">
              <div
                class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25"
              >
                <i class="pi pi-file-edit text-white text-xl"></i>
              </div>
              <div>
                <h1 class="text-2xl font-bold text-slate-900 tracking-tight">
                  {{ currentId ? 'Update Quotation' : 'Create New Quotation' }}
                </h1>
                <p class="text-sm text-slate-500 mt-0.5">
                  Fill in the details to generate a professional quotation
                </p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <p-button
                label="Cancel"
                severity="secondary"
                [outlined]="true"
                styleClass="py-2.5 px-6! font-semibold border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 rounded-xl"
                [routerLink]="'/quotations'"
              ></p-button>
              <p-button
                (onClick)="SaveQuotation()"
                [label]="currentId ? 'Save Changes' : 'Generate Quotation'"
                severity="info"
                icon="pi pi-file"
                styleClass="py-2.5 px-6! font-semibold shadow-lg shadow-blue-500/25 bg-gradient-to-r from-blue-600 to-blue-500 border-0 hover:from-blue-700 hover:to-blue-600 transition-all duration-200 rounded-xl"
              ></p-button>
            </div>
          </div>
        </div>

        <div [formGroup]="FG" class="space-y-6">
          <div
            class="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden"
          >
            <div
              class="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-8 py-5"
            >
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"
                >
                  <i class="pi pi-info-circle text-blue-600 text-lg"></i>
                </div>
                <div>
                  <h2 class="text-lg font-bold text-slate-900">
                    General Information
                  </h2>
                  <p class="text-sm text-slate-500 mt-0.5">
                    Basic quotation details and parties involved
                  </p>
                </div>
              </div>
            </div>

            <div class="p-8 space-y-6">
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="space-y-2">
                  <label class="block text-sm font-semibold text-slate-700">
                    Quotation Number <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    pInputText
                    class="w-full px-4 py-3 border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-slate-900 placeholder:text-slate-400 font-medium transition-all duration-200"
                    formControlName="quotationNo"
                    placeholder="e.g. QT-2026-001"
                  />
                </div>
                <div class="space-y-2">
                  <label class="block text-sm font-semibold text-slate-700">
                    Quote Date <span class="text-red-500">*</span>
                  </label>
                  <p-datepicker
                    appendTo="body"
                    styleClass="w-full"
                    inputStyleClass="w-full px-4 py-3 border-2 border-slate-200 focus:border-blue-500 rounded-xl"
                    formControlName="quotationDate"
                    [showIcon]="true"
                    dateFormat="dd/mm/yy"
                  ></p-datepicker>
                </div>
              </div>

              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="space-y-2">
                  <div class="flex items-center justify-between mb-2">
                    <label class="text-sm font-semibold text-slate-700">
                      From Company <span class="text-red-500">*</span>
                    </label>
                    <p-button
                      label="Add Company"
                      icon="pi pi-plus"
                      severity="info"
                      [text]="true"
                      size="small"
                      styleClass="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all duration-200"
                      (onClick)="AddCompanyClick()"
                    ></p-button>
                  </div>
                  <p-select
                    [options]="companySelection || []"
                    appendTo="body"
                    styleClass="w-full border-2 border-slate-200 rounded-xl"
                    formControlName="fromCompanyId"
                    placeholder="Select a company"
                  ></p-select>

                  <div
                    *ngIf="selectedFromCompany"
                    class="mt-4 bg-gradient-to-br from-blue-50 via-blue-50/50 to-slate-50 p-5 rounded-xl border-2 border-blue-100 space-y-3 animate-fadeIn"
                  >
                    <div
                      class="flex items-center gap-2.5 pb-3 border-b border-blue-200/50"
                    >
                      <div
                        class="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center"
                      >
                        <i class="pi pi-building text-white text-sm"></i>
                      </div>
                      <span class="font-bold text-slate-900 text-sm"
                        >From Company Details</span
                      >
                    </div>
                    <div class="space-y-2.5 text-sm">
                      <div class="flex items-start gap-2">
                        <i class="pi pi-phone text-blue-600 text-xs mt-1"></i>
                        <div>
                          <span class="font-medium text-slate-500 block text-xs"
                            >Phone</span
                          >
                          <span class="text-slate-900 font-semibold">{{
                            selectedFromCompany.contactNo
                          }}</span>
                        </div>
                      </div>
                      <div class="flex items-start gap-2">
                        <i
                          class="pi pi-envelope text-blue-600 text-xs mt-1"
                        ></i>
                        <div>
                          <span class="font-medium text-slate-500 block text-xs"
                            >Email</span
                          >
                          <span
                            class="text-slate-900 font-semibold break-all"
                            >{{ selectedFromCompany.email }}</span
                          >
                        </div>
                      </div>
                      <div
                        class="flex items-start gap-2 pt-2 border-t border-blue-200/50"
                      >
                        <i
                          class="pi pi-map-marker text-blue-600 text-xs mt-1"
                        ></i>
                        <div class="flex-1">
                          <span
                            class="font-medium text-slate-500 block text-xs mb-1"
                            >Address</span
                          >
                          <div class="text-xs text-slate-700 leading-relaxed">
                            {{
                              selectedFromCompany.deliveryAddress?.addressLine1
                            }},
                            {{
                              selectedFromCompany.deliveryAddress?.addressLine2
                            }}, {{ selectedFromCompany.deliveryAddress?.city }},
                            {{ selectedFromCompany.deliveryAddress?.state }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="space-y-2">
                  <div class="flex items-center justify-between mb-2">
                    <label class="text-sm font-semibold text-slate-700">
                      Bill To (Client) <span class="text-red-500">*</span>
                    </label>
                    <p-button
                      label="Add Client"
                      icon="pi pi-plus"
                      severity="info"
                      [text]="true"
                      size="small"
                      styleClass="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all duration-200"
                      (onClick)="AddClientClick()"
                    ></p-button>
                  </div>
                  <p-select
                    [filter]="true"
                    [options]="clientSelection || []"
                    appendTo="body"
                    styleClass="w-full border-2 border-slate-200 rounded-xl"
                    formControlName="clientId"
                    placeholder="Search or select client"
                    [showClear]="FG.get('clientId')?.value"
                  ></p-select>

                  <div
                    *ngIf="selectedClient"
                    class="mt-4 bg-gradient-to-br from-emerald-50 via-emerald-50/50 to-slate-50 p-5 rounded-xl border-2 border-emerald-100 space-y-3 animate-fadeIn"
                  >
                    <div
                      class="flex items-center gap-2.5 pb-3 border-b border-emerald-200/50"
                    >
                      <div
                        class="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center"
                      >
                        <i class="pi pi-user text-white text-sm"></i>
                      </div>
                      <span class="font-bold text-slate-900 text-sm"
                        >Client Details</span
                      >
                    </div>
                    <div class="space-y-2.5 text-sm">
                      <div class="flex items-start gap-2">
                        <i
                          class="pi pi-users text-emerald-600 text-xs mt-1"
                        ></i>
                        <div>
                          <span class="font-medium text-slate-500 block text-xs"
                            >Contact Person</span
                          >
                          <span class="text-slate-900 font-semibold">
                            {{
                              selectedClient.contactPerson1 +
                                (selectedClient.contactPerson2
                                  ? ' / ' + selectedClient.contactPerson2
                                  : '')
                            }}
                          </span>
                        </div>
                      </div>
                      <div class="flex items-start gap-2">
                        <i
                          class="pi pi-phone text-emerald-600 text-xs mt-1"
                        ></i>
                        <div>
                          <span class="font-medium text-slate-500 block text-xs"
                            >Phone</span
                          >
                          <span class="text-slate-900 font-semibold">{{
                            selectedClient.contactNo
                          }}</span>
                        </div>
                      </div>
                      <div class="flex items-start gap-2">
                        <i
                          class="pi pi-envelope text-emerald-600 text-xs mt-1"
                        ></i>
                        <div>
                          <span class="font-medium text-slate-500 block text-xs"
                            >Email</span
                          >
                          <span
                            class="text-slate-900 font-semibold break-all"
                            >{{ selectedClient.email }}</span
                          >
                        </div>
                      </div>
                      <div
                        class="flex items-start gap-2 pt-2 border-t border-emerald-200/50"
                      >
                        <i
                          class="pi pi-map-marker text-emerald-600 text-xs mt-1"
                        ></i>
                        <div class="flex-1">
                          <span
                            class="font-medium text-slate-500 block text-xs mb-1"
                            >Billing Address</span
                          >
                          <div class="text-xs text-slate-700 leading-relaxed">
                            {{ selectedClient.billingAddress?.addressLine1 }},
                            {{ selectedClient.billingAddress?.addressLine2 }},
                            {{ selectedClient.billingAddress?.city }},
                            {{ selectedClient.billingAddress?.state }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="space-y-2">
                <label class="block text-sm font-semibold text-slate-700">
                  Subject <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  pInputText
                  class="w-full px-4 py-3 border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-slate-900 placeholder:text-slate-400 transition-all duration-200"
                  formControlName="subject"
                  placeholder="Provide a clear title for this quotation"
                />
              </div>
            </div>
          </div>

          <div
            class="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden"
          >
            <div
              class="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-8 py-5"
            >
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center"
                >
                  <i class="pi pi-list text-purple-600 text-lg"></i>
                </div>
                <div>
                  <h2 class="text-lg font-bold text-slate-900">
                    Line Items Configuration
                  </h2>
                  <p class="text-sm text-slate-500 mt-0.5">
                    Add products, services, or grouped sections
                  </p>
                </div>
              </div>
            </div>

            <div class="p-8 space-y-6">
              <div
                class="overflow-hidden rounded-xl border-2 border-slate-200 shadow-sm"
              >
                <p-table
                  [value]="Items.controls"
                  styleClass="p-datatable-sm"
                  [tableStyle]="{ 'min-width': '60rem' }"
                  [showGridlines]="true"
                >
                  <ng-template #header>
                    <tr class="bg-gradient-to-r from-slate-100 to-slate-50">
                      <th
                        class="text-center! font-bold text-slate-700 py-4 text-xs uppercase tracking-wider w-[8%]"
                      >
                        Item
                      </th>
                      <th
                        class="text-left! font-bold text-slate-700 py-4 text-xs uppercase tracking-wider w-[37%]"
                      >
                        Description
                      </th>
                      <th
                        class="text-center! font-bold text-slate-700 py-4 text-xs uppercase tracking-wider w-[8%]"
                      >
                        Item Type
                      </th>
                      <th
                        class="text-center! font-bold text-slate-700 py-4 text-xs uppercase tracking-wider w-[10%]"
                      >
                        Unit
                      </th>
                      <th
                        class="text-center! font-bold text-slate-700 py-4 text-xs uppercase tracking-wider w-[10%]"
                      >
                        Quantity
                      </th>
                      <th
                        class="text-right! font-bold text-slate-700 py-4 text-xs uppercase tracking-wider w-[15%]"
                      >
                        Unit Price (RM)
                      </th>
                      <th
                        class="text-right! font-bold text-slate-700 py-4 text-xs uppercase tracking-wider w-[15%]"
                      >
                        Total Price (RM)
                      </th>
                      <th
                        class="text-center! font-bold text-slate-700 py-4 text-xs uppercase tracking-wider w-[7%]"
                      >
                        Action
                      </th>
                    </tr>
                  </ng-template>

                  <ng-template #body let-row let-i="rowIndex">
                    <tr
                      [formGroup]="row"
                      class="hover:bg-slate-50/50 transition-all duration-150 border-b border-slate-100 last:border-0"
                    >
                      <ng-container
                        *ngIf="
                          row.get('type')?.value === 'Category';
                          else normalRow
                        "
                      >
                        <td
                          colspan="7"
                          class="bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 py-3 px-4 border-y-2 border-indigo-200"
                        >
                          <div class="flex items-center gap-3">
                            <input
                              pInputText
                              formControlName="description"
                              placeholder="📁 Group Heading (e.g. CCTV Equipment System)"
                              class="flex-1 font-bold text-indigo-900 border-2 border-transparent bg-white/50 focus:border-indigo-400 focus:bg-white rounded-lg px-4 py-2.5 placeholder:text-indigo-400/70 transition-all duration-200"
                            />
                          </div>
                        </td>
                        <td
                          class="bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 text-center border-y-2 border-indigo-200"
                        >
                          <p-button
                            icon="pi pi-trash"
                            severity="danger"
                            [rounded]="true"
                            [text]="true"
                            styleClass="hover:bg-red-100 transition-all duration-200"
                            (onClick)="removeItem(i)"
                          ></p-button>
                        </td>
                      </ng-container>

                      <ng-template #normalRow>
                        <td class="text-center py-4 px-3">
                          <input
                            pInputText
                            formControlName="item"
                            class="w-full text-center! border-2 border-slate-200 focus:border-blue-500 rounded-lg px-2 py-1.5 font-semibold"
                          />
                        </td>

                        <td class="py-4 px-3">
                          <p-editor
                            formControlName="description"
                            [style]="{ height: '90px' }"
                            styleClass="border-2 border-slate-200 rounded-lg overflow-hidden focus-within:border-blue-400 transition-all duration-200"
                          >
                            <ng-template #header>
                              <span class="ql-formats">
                                <button
                                  type="button"
                                  class="ql-bold"
                                  aria-label="Bold"
                                ></button>
                                <button
                                  type="button"
                                  class="ql-italic"
                                  aria-label="Italic"
                                ></button>
                                <button
                                  type="button"
                                  class="ql-underline"
                                  aria-label="Underline"
                                ></button>
                              </span>
                            </ng-template>
                          </p-editor>
                        </td>
                        <td class="py-4 px-3">
                          <p-select
                            formControlName="itemType"
                            appendTo="body"
                            [options]="[
                              { label: 'Select Type', value: null },
                              { label: 'Product', value: 'Product' },
                              { label: 'Service', value: 'Service' },
                              { label: 'Notes', value: 'Notes' },
                            ]"
                            inputStyleClass="w-full text-center! border-2 border-slate-200 focus:border-blue-500 rounded-lg px-3 py-2.5 transition-all duration-200"
                          />
                        </td>
                        <td class="py-4 px-3">
                          <input
                            pInputText
                            formControlName="unit"
                            class="w-full text-center! border-2 border-slate-200 focus:border-blue-500 rounded-lg px-3 py-2.5 transition-all duration-200"
                          />
                        </td>

                        <td class="py-4 px-3">
                          <p-inputNumber
                            formControlName="quantity"
                            class="w-full"
                            inputStyleClass="w-full text-center! border-2 border-slate-200 focus:border-blue-500 rounded-lg px-3 py-2.5"
                            styleClass="w-full"
                          ></p-inputNumber>
                        </td>

                        <td class="py-4 px-3">
                          <p-inputNumber
                            formControlName="unitPrice"
                            class="w-full"
                            inputStyleClass="w-full text-right! border-2 border-slate-200 focus:border-blue-500 rounded-lg px-3 py-2.5"
                            styleClass="w-full"
                            mode="decimal"
                            [minFractionDigits]="2"
                            [maxFractionDigits]="2"
                          ></p-inputNumber>
                        </td>

                        <td class="py-4 px-3">
                          <p-inputNumber
                            formControlName="totalPrice"
                            [readonly]="true"
                            class="w-full"
                            inputStyleClass="w-full text-right! bg-slate-50 border-2 border-slate-200 text-slate-900 font-bold rounded-lg px-3 py-2.5"
                            styleClass="w-full"
                            mode="decimal"
                            [minFractionDigits]="2"
                            [maxFractionDigits]="2"
                          ></p-inputNumber>
                        </td>

                        <td class="text-center py-4 px-3">
                          <p-button
                            icon="pi pi-trash"
                            severity="danger"
                            [rounded]="true"
                            [text]="true"
                            styleClass="hover:bg-red-100 transition-all duration-200"
                            (onClick)="removeItem(i)"
                          ></p-button>
                        </td>
                      </ng-template>
                    </tr>
                  </ng-template>

                  <ng-template #footer>
                    <tr class="border-t-2 border-slate-200">
                      <td
                        colspan="6"
                        class="text-right! font-bold text-slate-700 px-6 py-4 bg-slate-50/50"
                      >
                        Subtotal
                      </td>
                      <td
                        colspan="2"
                        class="text-right! font-bold text-slate-900 text-lg px-6 py-4 bg-slate-50/50"
                      >
                        RM {{ FG.get('subTotal')?.value | number: '1.2-2' }}
                      </td>
                    </tr>

                    <tr class="border-t border-slate-200">
                      <td
                        colspan="6"
                        class="text-right! font-bold text-slate-700 px-6 py-4 bg-slate-50/30"
                      >
                        Discount (RM)
                      </td>
                      <td colspan="2" class="px-6 py-4 bg-slate-50/30">
                        <p-inputNumber
                          formControlName="discount"
                          mode="decimal"
                          [minFractionDigits]="2"
                          [maxFractionDigits]="2"
                          inputStyleClass="w-full text-right! border-2 border-slate-200 focus:border-blue-500 rounded-lg px-3 py-2.5"
                          styleClass="w-full"
                        ></p-inputNumber>
                      </td>
                    </tr>

                    <tr
                      class="border-t-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50"
                    >
                      <td
                        colspan="6"
                        class="text-right! font-bold text-slate-900 px-6 py-5 text-lg"
                      >
                        Total Amount
                      </td>
                      <td
                        colspan="2"
                        class="text-right! font-bold text-blue-600 text-2xl px-6 py-5"
                      >
                        RM {{ FG.get('totalAmount')?.value | number: '1.2-2' }}
                      </td>
                    </tr>
                  </ng-template>

                  <ng-template #emptymessage>
                    <tr>
                      <td colspan="100%">
                        <div
                          class="flex flex-col items-center justify-center py-16 text-slate-400"
                        >
                          <div
                            class="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-4"
                          >
                            <i class="pi pi-inbox text-4xl text-slate-300"></i>
                          </div>
                          <div
                            class="text-base font-semibold text-slate-600 mb-1"
                          >
                            No items added yet
                          </div>
                          <div class="text-sm text-slate-400">
                            Start by adding a group section or line item below
                          </div>
                        </div>
                      </td>
                    </tr>
                  </ng-template>
                </p-table>
              </div>

              <div class="flex flex-wrap gap-3">
                <p-button
                  label="Add Group Section"
                  styleClass="px-5 py-2.5 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-400 font-semibold transition-all duration-200"
                  icon="pi pi-folder-open"
                  size="small"
                  severity="secondary"
                  [outlined]="true"
                  (onClick)="addGroup()"
                ></p-button>
                <p-button
                  label="Add Line Item"
                  styleClass="px-5 py-2.5 rounded-xl border-2 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 font-semibold transition-all duration-200"
                  icon="pi pi-plus-circle"
                  size="small"
                  severity="info"
                  [outlined]="true"
                  (onClick)="addItem()"
                ></p-button>
              </div>
            </div>
          </div>

          <div
            class="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden"
          >
            <div
              class="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-8 py-5"
            >
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"
                >
                  <i class="pi pi-file-edit text-amber-600 text-lg"></i>
                </div>
                <div>
                  <h2 class="text-lg font-bold text-slate-900">
                    Terms & Conditions
                  </h2>
                  <p class="text-sm text-slate-500 mt-0.5">
                    Define payment, delivery, and warranty terms
                  </p>
                </div>
              </div>
            </div>

            <div class="p-8">
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="space-y-2">
                  <label class="block text-sm font-semibold text-slate-700"
                    >Payment Terms</label
                  >
                  <input
                    pInputText
                    formControlName="paymentTerms"
                    class="w-full px-4 py-3 border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-slate-900 placeholder:text-slate-400 transition-all duration-200"
                    placeholder="e.g. 30 Days"
                  />
                </div>

                <div class="space-y-2">
                  <label class="block text-sm font-semibold text-slate-700"
                    >Validity Period (Days)</label
                  >
                  <p-inputNumber
                    formControlName="validityDays"
                    class="w-full"
                    inputStyleClass="w-full px-4 py-3 border-2 border-slate-200 focus:border-blue-500 rounded-xl"
                    placeholder="e.g. 30"
                  ></p-inputNumber>
                </div>

                <div class="space-y-2">
                  <label class="block text-sm font-semibold text-slate-700"
                    >Execution</label
                  >
                  <input
                    pInputText
                    formControlName="execution"
                    class="w-full px-4 py-3 border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-slate-900 placeholder:text-slate-400 transition-all duration-200"
                    placeholder="e.g. Within 7-14 working days"
                  />
                </div>

                <div class="space-y-2">
                  <label class="block text-sm font-semibold text-slate-700"
                    >Warranty Terms</label
                  >
                  <input
                    pInputText
                    formControlName="warrantyTerms"
                    class="w-full px-4 py-3 border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-slate-900 placeholder:text-slate-400 transition-all duration-200"
                    placeholder="e.g. 12 months manufacturer warranty"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <p-dialog
      [(visible)]="visible"
      [modal]="true"
      [closable]="true"
      [draggable]="false"
      styleClass="w-[95%] max-w-[900px] rounded-2xl overflow-hidden shadow-2xl border-none!"
      [maskStyle]="{
        'overflow-y': 'auto',
        'background-color': 'rgba(15, 23, 42, 0.5)',
        'backdrop-filter': 'blur(8px)',
      }"
      appendTo="body"
    >
      <ng-template #headless>
        <div
          class="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 relative overflow-hidden"
        >
          <div
            class="absolute inset-0 bg-grid-white/[0.05] bg-[length:20px_20px]"
          ></div>
          <div class="relative flex justify-between items-start gap-4">
            <div class="flex items-center gap-4">
              <div
                class="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-lg"
              >
                <i class="pi pi-building text-white text-2xl"></i>
              </div>
              <div>
                <h2 class="text-2xl font-bold text-white tracking-tight m-0">
                  {{
                    mode === 'company' ? 'Add New Company' : 'Add New Client'
                  }}
                </h2>
                <p class="text-blue-100 text-sm mt-1 leading-relaxed">
                  Complete the form below to create a new
                  {{ mode === 'company' ? 'company' : 'client' }} record
                </p>
              </div>
            </div>
            <p-button
              icon="pi pi-times"
              [rounded]="true"
              [text]="true"
              severity="secondary"
              styleClass="text-white hover:bg-white/20 transition-all duration-200 backdrop-blur-sm"
              (onClick)="visible = false"
            ></p-button>
          </div>
        </div>

        <div class="max-h-[70vh] overflow-y-auto bg-slate-50">
          <div [formGroup]="companyForm" class="p-8 space-y-8">
            <div
              class="bg-white rounded-xl border-2 border-slate-200 p-6 space-y-5"
            >
              <div
                class="flex items-center gap-2.5 pb-3 border-b-2 border-slate-100"
              >
                <i class="pi pi-briefcase text-blue-600"></i>
                <h3 class="font-bold text-slate-900 text-base">
                  Basic Information
                </h3>
              </div>

              <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div class="lg:col-span-2 space-y-2">
                  <label class="text-sm font-semibold text-slate-700">
                    Company Name <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    pInputText
                    class="w-full px-4 py-3 border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-slate-900 placeholder:text-slate-400 font-medium transition-all duration-200"
                    formControlName="name"
                    placeholder="e.g. Acme Corp Bhd"
                  />
                </div>

                <div class="space-y-2">
                  <label class="text-sm font-semibold text-slate-700"
                    >Account Ref No.</label
                  >
                  <input
                    type="text"
                    pInputText
                    class="w-full px-4 py-3 border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-slate-900 placeholder:text-slate-400 transition-all duration-200"
                    formControlName="acNo"
                    placeholder="ACC-2026-89"
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div class="space-y-2">
                  <label class="text-sm font-semibold text-slate-700"
                    >Email Address</label
                  >
                  <input
                    type="email"
                    pInputText
                    class="w-full px-4 py-3 border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-slate-900 placeholder:text-slate-400 transition-all duration-200"
                    formControlName="email"
                    placeholder="info@acme.com"
                  />
                </div>

                <div class="space-y-2">
                  <label class="text-sm font-semibold text-slate-700"
                    >Phone Number</label
                  >
                  <input
                    type="tel"
                    pInputText
                    class="w-full px-4 py-3 border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-slate-900 placeholder:text-slate-400 transition-all duration-200"
                    formControlName="contactNo"
                    placeholder="+60 3-XXXX XXXX"
                  />
                </div>

                <div class="space-y-2">
                  <label class="text-sm font-semibold text-slate-700"
                    >Fax Number</label
                  >
                  <input
                    type="tel"
                    pInputText
                    class="w-full px-4 py-3 border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-slate-900 placeholder:text-slate-400 transition-all duration-200"
                    formControlName="faxNo"
                    placeholder="+60 3-XXXX XXXX"
                  />
                </div>
              </div>
            </div>

            <div
              class="bg-white rounded-xl border-2 border-slate-200 p-6 space-y-5"
            >
              <div
                class="flex items-center gap-2.5 pb-3 border-b-2 border-slate-100"
              >
                <i class="pi pi-users text-blue-600"></i>
                <h3 class="font-bold text-slate-900 text-base">
                  Contact People
                </h3>
              </div>

              <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div
                  class="bg-blue-50/50 rounded-xl border-2 border-blue-200 p-5 space-y-2"
                >
                  <div class="flex items-center gap-2 mb-2">
                    <div class="w-2 h-2 rounded-full bg-blue-600"></div>
                    <span class="text-sm font-bold text-blue-900"
                      >Primary Contact</span
                    >
                  </div>
                  <label class="text-sm font-medium text-slate-600"
                    >Full Name</label
                  >
                  <input
                    type="text"
                    pInputText
                    class="w-full px-4 py-2.5 border-2 border-blue-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-lg bg-white transition-all duration-200"
                    formControlName="contactPerson1"
                    placeholder="e.g. Mr. John Doe"
                  />
                </div>

                <div
                  class="bg-slate-50 rounded-xl border-2 border-slate-200 p-5 space-y-2"
                >
                  <div class="flex items-center gap-2 mb-2">
                    <div class="w-2 h-2 rounded-full bg-slate-400"></div>
                    <span class="text-sm font-bold text-slate-700"
                      >Secondary Contact</span
                    >
                    <span class="text-xs text-slate-400 italic"
                      >(Optional)</span
                    >
                  </div>
                  <label class="text-sm font-medium text-slate-600"
                    >Full Name</label
                  >
                  <input
                    type="text"
                    pInputText
                    class="w-full px-4 py-2.5 border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-lg bg-white transition-all duration-200"
                    formControlName="contactPerson2"
                    placeholder="e.g. Ms. Jane Doe"
                  />
                </div>
              </div>
            </div>

            <div
              class="bg-white rounded-xl border-2 border-slate-200 p-6 space-y-5"
              formGroupName="billingAddress"
            >
              <div
                class="flex items-center gap-2.5 pb-3 border-b-2 border-slate-100"
              >
                <i class="pi pi-credit-card text-blue-600"></i>
                <h3 class="font-bold text-slate-900 text-base">
                  Billing Address
                </h3>
              </div>

              <div class="grid grid-cols-1 gap-5">
                <div class="space-y-2">
                  <label class="text-sm font-semibold text-slate-700"
                    >Address Line 1</label
                  >
                  <input
                    pInputText
                    formControlName="addressLine1"
                    class="w-full px-4 py-3 border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all duration-200"
                    placeholder="Floor, building, or suite number"
                  />
                </div>
                <div class="space-y-2">
                  <label class="text-sm font-semibold text-slate-700"
                    >Address Line 2</label
                  >
                  <input
                    pInputText
                    formControlName="addressLine2"
                    class="w-full px-4 py-3 border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all duration-200"
                    placeholder="Street name or neighborhood"
                  />
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div class="space-y-2">
                    <label class="text-sm font-semibold text-slate-700"
                      >City</label
                    >
                    <input
                      pInputText
                      formControlName="city"
                      class="w-full px-4 py-3 border-2 border-slate-200 focus:border-blue-500 rounded-xl transition-all duration-200"
                    />
                  </div>
                  <div class="space-y-2">
                    <label class="text-sm font-semibold text-slate-700"
                      >Postcode / ZIP</label
                    >
                    <input
                      pInputText
                      formControlName="poscode"
                      class="w-full px-4 py-3 border-2 border-slate-200 focus:border-blue-500 rounded-xl transition-all duration-200"
                    />
                  </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div class="space-y-2">
                    <label class="text-sm font-semibold text-slate-700"
                      >State</label
                    >
                    <input
                      pInputText
                      formControlName="state"
                      class="w-full px-4 py-3 border-2 border-slate-200 focus:border-blue-500 rounded-xl transition-all duration-200"
                    />
                  </div>
                  <div class="space-y-2">
                    <label class="text-sm font-semibold text-slate-700"
                      >Country</label
                    >
                    <input
                      pInputText
                      formControlName="country"
                      class="w-full px-4 py-3 border-2 border-slate-200 focus:border-blue-500 rounded-xl transition-all duration-200"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div
              class="bg-white rounded-xl border-2 border-slate-200 p-6 space-y-5"
            >
              <div
                class="flex items-center justify-between pb-3 border-b-2 border-slate-100"
              >
                <div class="flex items-center gap-2.5">
                  <i class="pi pi-truck text-blue-600"></i>
                  <h3 class="font-bold text-slate-900 text-base">
                    Delivery Address
                  </h3>
                </div>
                <div
                  class="flex items-center gap-3 bg-slate-100 px-4 py-2.5 rounded-xl border-2 border-slate-200 hover:bg-slate-200/60 cursor-pointer transition-all duration-200"
                >
                  <input
                    type="checkbox"
                    formControlName="sameAsBilling"
                    id="sameAsBilling"
                    class="cursor-pointer w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    for="sameAsBilling"
                    class="cursor-pointer font-semibold text-slate-700 text-sm select-none"
                  >
                    Same as Billing
                  </label>
                </div>
              </div>

              <div
                *ngIf="!companyForm.get('sameAsBilling')?.value"
                formGroupName="deliveryAddress"
                class="grid grid-cols-1 gap-5 animate-fadeIn"
              >
                <div class="space-y-2">
                  <label class="text-sm font-semibold text-slate-700"
                    >Address Line 1</label
                  >
                  <input
                    pInputText
                    formControlName="addressLine1"
                    class="w-full px-4 py-3 border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all duration-200"
                    placeholder="Warehouse, loading bay, or suite number"
                  />
                </div>
                <div class="space-y-2">
                  <label class="text-sm font-semibold text-slate-700"
                    >Address Line 2</label
                  >
                  <input
                    pInputText
                    formControlName="addressLine2"
                    class="w-full px-4 py-3 border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all duration-200"
                    placeholder="Street name or neighborhood"
                  />
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div class="space-y-2">
                    <label class="text-sm font-semibold text-slate-700"
                      >City</label
                    >
                    <input
                      pInputText
                      formControlName="city"
                      class="w-full px-4 py-3 border-2 border-slate-200 focus:border-blue-500 rounded-xl transition-all duration-200"
                    />
                  </div>
                  <div class="space-y-2">
                    <label class="text-sm font-semibold text-slate-700"
                      >Postcode / ZIP</label
                    >
                    <input
                      pInputText
                      formControlName="poscode"
                      class="w-full px-4 py-3 border-2 border-slate-200 focus:border-blue-500 rounded-xl transition-all duration-200"
                    />
                  </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div class="space-y-2">
                    <label class="text-sm font-semibold text-slate-700"
                      >State</label
                    >
                    <input
                      pInputText
                      formControlName="state"
                      class="w-full px-4 py-3 border-2 border-slate-200 focus:border-blue-500 rounded-xl transition-all duration-200"
                    />
                  </div>
                  <div class="space-y-2">
                    <label class="text-sm font-semibold text-slate-700"
                      >Country</label
                    >
                    <input
                      pInputText
                      formControlName="country"
                      class="w-full px-4 py-3 border-2 border-slate-200 focus:border-blue-500 rounded-xl transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              <div
                class="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl flex items-center gap-3 animate-fadeIn"
                *ngIf="companyForm.get('sameAsBilling')?.value"
              >
                <i class="pi pi-info-circle text-blue-600 text-lg"></i>
                <span class="text-sm font-medium text-blue-900">
                  Delivery address will automatically match the billing address
                </span>
              </div>
            </div>
          </div>
        </div>

        <div
          class="bg-slate-100 border-t-2 border-slate-200 px-8 py-5 flex justify-end items-center gap-4"
        >
          <p-button
            (onClick)="visible = false"
            label="Cancel"
            severity="secondary"
            styleClass="px-6! py-2.5 border-2! border-slate-300! bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-all duration-200"
          ></p-button>

          <p-button
            (onClick)="Save()"
            [label]="'Save ' + (mode === 'company' ? 'Company' : 'Client')"
            severity="info"
            [disabled]="companyForm.invalid"
            styleClass="px-6! py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-500 border-0 text-white font-semibold shadow-lg shadow-blue-500/25 rounded-xl transition-all duration-200"
          ></p-button>
        </div>
      </ng-template>
    </p-dialog> `,
  styleUrl: './quotation-form.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuotationForm implements OnInit, OnDestroy {
  private readonly loadingService = inject(LoadingService);
  private readonly quotationService = inject(QuotationService);
  private readonly messageService = inject(MessageService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly companyService = inject(CompanyService);
  private readonly clientService = inject(ClientService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  currentId: string | null = null;
  visible: boolean = false;

  mode: 'client' | 'company' = 'client';

  FG!: FormGroup;
  companyForm!: FormGroup;

  companySelection: { label: string; value: string; data: any }[] = [];
  clientSelection: { label: string; value: string; data: any }[] = [];

  selectedFromCompany: any = null;
  selectedClient: any = null;

  ngOnInit(): void {
    this.currentId = this.activatedRoute.snapshot.queryParams['id'];

    this.initForm();

    if (!this.currentId) {
      this.generateQuotationNo();
    }

    forkJoin({
      selection: this.companyService.GetMany({
        Page: 1,
        PageSize: 1000000,
        OrderBy: 'Name',
        Select: null,
        Filter: null,
        Includes: 'BillingAddress,DeliveryAddress',
      }),
      data: this.currentId
        ? this.quotationService.GetOne({
            Page: 1,
            PageSize: 1,
            OrderBy: null,
            Select: null,
            Includes: 'QuotationItems',
            Filter: `Id=${this.currentId}`,
          })
        : of({} as any),
    })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(({ selection, data }) => {
        this.companySelection = selection.data
          .filter((x) => x.type === CompanyType.Own)
          .map((x) => ({ label: x.name, value: x.id, data: x }));

        this.clientSelection = selection.data
          .filter((x) => x.type === CompanyType.Client)
          .map((x) => ({ label: x.name, value: x.id, data: x }));

        if (data && data.id) {
          this.patchData(data);
        }
      });
  }

  generateQuotationNo() {
    this.quotationService
      .GenerateNo()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.FG.get('quotationNo')?.setValue(res.quotationNo);
          this.cdr.markForCheck();
        },
      });
  }

  patchData(res: any) {
    this.FG.patchValue({
      ...res,
      quotationDate: new Date(res.quotationDate),
    });

    this.Items.clear();

    res?.quotationItems
      ?.sort((a: any, b: any) => a.sortOrder - b.sortOrder)
      .forEach((item: any) => {
        const group = this.createItemGroup({
          ...item,
          description: denormalizeHtml(item.description),
        });

        group.patchValue(
          {
            totalPrice: (item.quantity ?? 0) * (item.unitPrice ?? 0),
          },
          { emitEvent: false },
        );

        this.Items.push(group);
      });

    this.calculateTotal();
    this.cdr.markForCheck();
  }

  getSelection() {
    this.companyService
      .GetMany({
        Page: 1,
        PageSize: 1000000,
        OrderBy: 'Name',
        Select: null,
        Filter: null,
        Includes: null,
      })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.companySelection = res.data
            .filter((x) => x.type === CompanyType.Own)
            .map((x) => ({ label: x.name, value: x.id, data: x }));

          this.clientSelection = res.data
            .filter((x) => x.type === CompanyType.Client)
            .map((x) => ({ label: x.name, value: x.id, data: x }));
        },
      });
  }

  initForm() {
    this.FG = new FormGroup({
      id: new FormControl<string | null>({ value: null, disabled: true }),
      quotationNo: new FormControl<string | null>(null),
      quotationDate: new FormControl<Date | null>(null),
      fromCompanyId: new FormControl<string | null>(null, Validators.required),
      clientId: new FormControl<string | null>(null, Validators.required),
      subject: new FormControl<string | null>(null),
      subTotal: new FormControl<number | null>(0),
      discount: new FormControl<number | null>(0),
      totalAmount: new FormControl<number | null>(0),
      paymentTerms: new FormControl<string | null>(null),
      validityDays: new FormControl<number | null>(null),
      execution: new FormControl<string | null>(null),
      warrantyTerms: new FormControl<string | null>(null),
      quotationItems: new FormArray([]),
    });
    this.listenItemChanges();

    this.FG.get('fromCompanyId')?.valueChanges.subscribe((id) => {
      this.selectedFromCompany = this.companySelection.find(
        (x) => x.value === id,
      )?.data;
      this.cdr.markForCheck();
    });

    this.FG.get('clientId')?.valueChanges.subscribe((id) => {
      this.selectedClient = this.clientSelection.find(
        (x) => x.value === id,
      )?.data;
      this.cdr.markForCheck();
    });
    this.FG.get('discount')
      ?.valueChanges.pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        this.calculateTotal();
      });
  }

  createItemGroup(data?: any): FormGroup {
    return new FormGroup({
      id: new FormControl<string | null>(data?.id ?? null),
      type: new FormControl<'Category' | 'Item'>(
        data?.type ?? (data?.isGroup ? 'Category' : 'Item'),
      ),
      itemType: new FormControl<'Product' | 'Service' | 'Notes' | null>(
        data?.itemType ?? null,
      ),
      parentId: new FormControl<string | null>(data?.parentId ?? null),
      isGroup: new FormControl<boolean>(data?.isGroup ?? false),
      item: new FormControl<string | null>(data?.item ?? null),
      description: new FormControl<string | null>(data?.description ?? null),
      quantity: new FormControl<number | null>(data?.quantity ?? null),
      unit: new FormControl<string | null>(data?.unit ?? null),
      unitPrice: new FormControl<number | null>(data?.unitPrice ?? null),
      totalPrice: new FormControl<number | null>({
        value: data?.totalPrice ?? null,
        disabled: true,
      }),
      sortOrder: new FormControl<number>(data?.sortOrder ?? 0),
    });
  }

  GetData() {
    this.loadingService.start();
    this.quotationService
      .GetOne({
        Page: 1,
        PageSize: 1,
        OrderBy: null,
        Select: null,
        Includes: 'QuotationItems',
        Filter: `Id=${this.currentId}`,
      })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          if (res) {
            this.loadingService.stop();
            this.FG.patchValue({
              ...res,
              quotationDate: new Date(res.quotationDate),
            });
            this.Items.clear();

            if (res.quotationItems?.length) {
              res.quotationItems.forEach((item: any) => {
                const group = this.createItemGroup(item);

                const qty = item.quantity ?? 0;
                const price = item.unitPrice ?? 0;

                group.patchValue(
                  {
                    totalPrice: qty * price,
                  },
                  { emitEvent: false },
                );

                this.Items.push(group);
              });
            }

            this.calculateTotal();

            this.cdr.markForCheck();
          }
        },
        error: (err) => {
          this.loadingService.stop();
        },
      });
  }

  private buildQuotationItemsPayload() {
    const items = this.Items.getRawValue();

    return items.map((x, index) => ({
      id: x.id || null,
      type: x.type,
      itemType: x.itemType,
      parentId: x.parentId || null,
      item: x.item,
      description: normalizeHtml(x.description),
      quantity: x.quantity,
      unit: x.unit,
      unitPrice: x.unitPrice,
      totalPrice: x.quantity * x.unitPrice,
      sortOrder: index,

      children: [],
    }));
  }

  getItemNumber(index: number): number {
    let count = 0;

    for (let i = 0; i <= index; i++) {
      const item = this.Items.at(i);
      if (!item.get('isGroup')?.value) {
        count++;
      }
    }

    return count;
  }

  listenItemChanges() {
    this.Items.valueChanges
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        this.Items.controls.forEach((group: any) => {
          const qty = group.get('quantity')?.value || 0;
          const price = group.get('unitPrice')?.value || 0;
          const total = qty * price;

          group.get('totalPrice')?.setValue(total, { emitEvent: false });
        });

        this.calculateTotal();
      });
  }

  addItem(parentGroupId: string | null = null) {
    this.Items.push(
      this.createItemGroup({
        type: 'Item',
        itemType: null,
        isGroup: false,
        parentId: parentGroupId,
      }),
    );
  }

  removeItem(index: number) {
    const current = this.Items.at(index);

    if (current.get('isGroup')?.value) {
      this.Items.removeAt(index);

      while (
        index < this.Items.length &&
        !this.Items.at(index).get('isGroup')?.value
      ) {
        this.Items.removeAt(index);
      }
    } else {
      this.Items.removeAt(index);
    }

    this.calculateTotal();
  }

  addGroup() {
    const groupId = crypto.randomUUID();

    this.Items.push(
      this.createItemGroup({
        id: groupId,
        type: 'Category',
        isGroup: true,
        description: null,
      }),
    );
  }

  calculateTotal() {
    const subTotal = this.Items.controls.reduce((sum: number, group: any) => {
      return sum + (group.get('totalPrice')?.value || 0);
    }, 0);

    const discount = this.FG.get('discount')?.value || 0;

    const total = subTotal - discount;

    this.FG.patchValue(
      {
        subTotal: subTotal,
        totalAmount: total < 0 ? 0 : total,
      },
      { emitEvent: false },
    );
  }

  get Items(): FormArray {
    return this.FG.get('quotationItems') as FormArray;
  }

  AddCompanyClick() {
    this.mode = 'company';
    this.initCompanyForm();
    this.visible = true;
  }

  initCompanyForm() {
    this.companyForm = new FormGroup({
      name: new FormControl<string | null>(null, Validators.required),
      email: new FormControl<string | null>(null, [Validators.email]),
      contactNo: new FormControl<string | null>(null, Validators.required),
      faxNo: new FormControl<string | null>(null),
      contactPerson1: new FormControl<string | null>(null),
      contactPerson2: new FormControl<string | null>(null),
      acNo: new FormControl<string | null>(null),
      type: new FormControl<CompanyType>(
        this.mode === 'company' ? CompanyType.Own : CompanyType.Client,
      ),
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
    this.SameAddressOnChanges();
  }

  AddClientClick() {
    this.mode = 'client';
    this.initCompanyForm();
    this.visible = true;
  }

  SameAddressOnChanges() {
    this.companyForm.get('sameAsBilling')?.valueChanges.subscribe((checked) => {
      if (checked) {
        const billingValue = this.companyForm.get('billingAddress')?.value;
        this.companyForm.get('deliveryAddress')?.patchValue({
          ...billingValue,
          name: 'Delivery',
        });
      }
    });
  }

  createAddressGroup(): FormGroup {
    return new FormGroup({
      addressLine1: new FormControl(null),
      addressLine2: new FormControl(null),
      city: new FormControl(null),
      state: new FormControl(null),
      country: new FormControl(null),
      poscode: new FormControl(null),
    });
  }

  Save() {
    if (!this.companyForm.valid) {
      ValidateAllFormFields(this.companyForm);
      return;
    }

    const payload = this.companyForm.getRawValue();

    this.loadingService.start();

    const request$ =
      this.mode === 'company'
        ? this.companyService.Create(payload)
        : this.clientService.Create(payload);

    request$
      .pipe(
        switchMap((res: any) => {
          const newId = res?.id;

          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail:
              this.mode === 'company'
                ? 'Company created successfully'
                : 'Client created successfully',
          });

          this.visible = false;

          return this.companyService
            .GetMany({
              Page: 1,
              PageSize: 1000000,
              OrderBy: 'Name',
              Select: null,
              Filter: null,
              Includes: 'BillingAddress,DeliveryAddress',
            })
            .pipe(map((list) => ({ list, newId })));
        }),
        takeUntil(this.ngUnsubscribe),
      )
      .subscribe({
        next: ({ list, newId }) => {
          this.loadingService.stop();

          const mapped = list.data.map((x: any) => ({
            label: x.name,
            value: x.id,
            data: x,
          }));

          if (this.mode === 'company') {
            this.companySelection = mapped.filter(
              (x) => x.data.type === CompanyType.Own,
            );
            this.FG.get('fromCompanyId')?.setValue(newId);
          } else {
            this.clientSelection = mapped.filter(
              (x) => x.data.type === CompanyType.Client,
            );
            this.FG.get('clientId')?.setValue(newId);
          }

          this.cdr.markForCheck();
        },
        error: () => this.loadingService.stop(),
      });
  }

  SaveQuotation() {
    if (this.FG.valid) {
      this.loadingService.start();
      const payload = {
        ...this.FG.getRawValue(),
        quotationItems: this.buildQuotationItemsPayload(),
      };
      const request$ = this.currentId
        ? this.quotationService.Update(payload)
        : this.quotationService.Create(payload);

      request$.pipe(takeUntil(this.ngUnsubscribe)).subscribe({
        next: (res) => {
          this.loadingService.stop();
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `${res.quotationNo} has been successfully ${this.currentId ? 'updated' : 'added'}`,
          });

          this.router.navigate(['/quotations']);
        },
        error: (err) => {
          this.loadingService.stop();
        },
      });
    }
    ValidateAllFormFields(this.FG);
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
