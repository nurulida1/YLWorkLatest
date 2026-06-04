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
      class="w-full p-6 bg-gray-50 min-h-screen flex flex-col gap-4"
    >
      <div
        class="flex flex-row items-center gap-2 text-sm text-gray-500 tracking-wide px-1"
      >
        <div
          [routerLink]="'/dashboard'"
          class="cursor-pointer hover:text-indigo-600 transition-colors"
        >
          Dashboard
        </div>
        <span class="text-gray-300">/</span>
        <div
          [routerLink]="'/quotations'"
          class="cursor-pointer hover:text-indigo-600 transition-colors"
        >
          Quotations
        </div>
        <span class="text-gray-300">/</span>
        <div class="text-gray-800 font-medium">
          {{ currentId ? FG.get('quotationNo')?.value : 'New Quotation' }}
        </div>
      </div>

      <div
        class="px-6 py-4 flex flex-row items-center justify-between border border-gray-200 bg-white rounded-xl shadow-sm"
      >
        <div
          class="flex flex-row items-center gap-3 text-gray-800 font-semibold text-lg"
        >
          <i class="pi pi-file text-indigo-600 text-xl"></i>
          <div>
            {{ currentId ? 'Update Quotation' : 'Create New Quotation' }}
          </div>
        </div>
        <div class="flex flex-row items-center gap-3">
          <p-button
            label="Cancel"
            severity="secondary"
            [outlined]="true"
            styleClass="py-2 px-5 font-medium border-gray-300 text-gray-700 hover:bg-gray-50"
            [routerLink]="'/quotations'"
          ></p-button>
          <p-button
            (onClick)="SaveQuotation()"
            [label]="currentId ? 'Save Changes' : 'Create'"
            severity="info"
            styleClass="py-2 px-5 font-medium shadow-sm bg-indigo-600 border-indigo-600 hover:bg-indigo-700"
          ></p-button>
        </div>
      </div>

      <div class="grid grid-cols-12 gap-6" [formGroup]="FG">
        <div
          class="col-span-12 border border-gray-200 bg-white p-6 rounded-xl shadow-sm flex flex-col gap-5"
        >
          <div
            class="font-bold text-gray-800 text-lg border-b border-gray-100 pb-3"
          >
            General Information
          </div>

          <div class="grid grid-cols-12 gap-5">
            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
              <label class="font-medium text-gray-700"
                >Quotation No <span class="text-red-500">*</span></label
              >
              <input
                type="text"
                pInputText
                class="w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg"
                formControlName="quotationNo"
                placeholder="e.g. QT-2026-001"
              />
            </div>
            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
              <label class="font-medium text-gray-700"
                >Quote Date <span class="text-red-500">*</span></label
              >
              <p-datepicker
                appendTo="body"
                styleClass="w-full!"
                inputStyleClass="w-full border-gray-300 rounded-lg"
                formControlName="quotationDate"
                [showIcon]="true"
                dateFormat="dd/mm/yy"
              ></p-datepicker>
            </div>
          </div>

          <div class="grid grid-cols-12 gap-5 mt-2">
            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
              <div class="flex flex-row items-center justify-between">
                <label class="font-medium text-gray-700"
                  >From <span class="text-red-500">*</span></label
                >
                <p-button
                  label="Add Company"
                  icon="pi pi-plus-circle"
                  severity="info"
                  [text]="true"
                  size="small"
                  styleClass="p-0.5! text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                  (onClick)="AddCompanyClick()"
                ></p-button>
              </div>
              <p-select
                [options]="companySelection || []"
                appendTo="body"
                styleClass="w-full! border-gray-300 rounded-lg"
                formControlName="fromCompanyId"
                placeholder="Select a company"
              ></p-select>

              <div
                *ngIf="selectedFromCompany"
                class="mt-2 bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm text-gray-600 flex flex-col gap-1.5 transition-all"
              >
                <div
                  class="font-semibold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-1.5 mb-1"
                >
                  <i class="pi pi-building text-indigo-500"></i> From Company
                  Details
                </div>

                <div>
                  <span class="font-medium text-gray-500">Phone:</span>
                  {{ selectedFromCompany.contactNo }}
                </div>
                <div>
                  <span class="font-medium text-gray-500">Email:</span>
                  {{ selectedFromCompany.email }}
                </div>
                <div
                  class="mt-1 pt-1.5 border-t border-dashed border-slate-200"
                >
                  <span class="font-medium text-gray-500">Address:</span>
                  <div class="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    {{ selectedFromCompany.deliveryAddress?.addressLine1 }},
                    {{ selectedFromCompany.deliveryAddress?.addressLine2 }},

                    {{ selectedFromCompany.deliveryAddress?.city }},
                    {{ selectedFromCompany.deliveryAddress?.state }}
                  </div>
                </div>
              </div>
            </div>

            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
              <div class="flex flex-row justify-between items-center h-[22px]">
                <label class="font-medium text-gray-700"
                  >Bill To <span class="text-red-500">*</span></label
                >
                <p-button
                  label="Add New Client"
                  icon="pi pi-plus-circle"
                  severity="info"
                  [text]="true"
                  size="small"
                  styleClass="p-0 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                  (onClick)="AddClientClick()"
                ></p-button>
              </div>
              <p-select
                [filter]="true"
                [options]="clientSelection || []"
                appendTo="body"
                styleClass="w-full! border-gray-300 rounded-lg"
                formControlName="clientId"
                placeholder="Search or select client"
                [showClear]="FG.get('clientId')?.value"
              ></p-select>

              <div
                *ngIf="selectedClient"
                class="mt-2 bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm text-gray-600 flex flex-col gap-1.5 transition-all"
              >
                <div
                  class="font-semibold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-1.5 mb-1"
                >
                  <i class="pi pi-user text-indigo-500"></i> Client Details
                </div>
                <div>
                  <span class="font-medium text-gray-500">Contact:</span>
                  {{
                    selectedClient.contactPerson1 +
                      (selectedClient.contactPerson2
                        ? ' / ' + selectedClient.contactPerson2
                        : '')
                  }}
                </div>
                <div>
                  <span class="font-medium text-gray-500">Phone:</span>
                  {{ selectedClient.contactNo }}
                </div>
                <div>
                  <span class="font-medium text-gray-500">Email:</span>
                  {{ selectedClient.email }}
                </div>

                <div
                  class="grid grid-cols-2 gap-3 mt-1 pt-1.5 border-t border-dashed border-slate-200"
                >
                  <div class="col-span-2">
                    <span class="font-medium text-gray-500"
                      >Billing Address:</span
                    >
                    <div class="text-xs text-gray-500 mt-0.5 leading-relaxed">
                      {{ selectedClient.billingAddress?.addressLine1 }},
                      {{ selectedClient.billingAddress?.addressLine2 }},

                      {{ selectedClient.billingAddress?.city }},
                      {{ selectedClient.billingAddress?.state }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-span-12 flex flex-col gap-1.5 mt-2">
              <label class="font-medium text-gray-700"
                >Subject <span class="text-red-500">*</span></label
              >
              <input
                type="text"
                pInputText
                class="w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg"
                formControlName="subject"
                placeholder="Provide a clear title for this quote"
              />
            </div>
          </div>
        </div>

        <div
          class="col-span-12 border border-gray-200 bg-white p-6 rounded-xl shadow-sm flex flex-col gap-4"
        >
          <div
            class="font-bold text-gray-800 text-lg border-b border-gray-100 pb-3"
          >
            Line Items Configuration
          </div>

          <div class="col-span-12 overflow-hidden shadow-xs">
            <p-table
              showGridlines="true"
              [tableStyle]="{ 'min-width': '60rem', 'table-layout': 'fixed' }"
              [value]="Items.controls"
              styleClass="p-datatable-sm"
            >
              <ng-template #header>
                <tr class="bg-gray-50 text-gray-700 font-semibold">
                  <th class="text-center! text-sm tracking-wider w-[8%]!">
                    Item No
                  </th>
                  <th class="text-left! text-sm tracking-wider w-[37%]!">
                    Description / Specification
                  </th>
                  <th class="text-center! text-sm tracking-wider w-[10%]!">
                    Unit
                  </th>
                  <th class="text-center! text-sm tracking-wider w-[10%]!">
                    Qty
                  </th>
                  <th class="text-right! text-sm tracking-wider w-[15%]!">
                    Unit Price (RM)
                  </th>
                  <th class="text-right! text-sm tracking-wider w-[15%]!">
                    Total Price (RM)
                  </th>
                  <th class="text-center! text-sm tracking-wider w-[7%]!">
                    Action
                  </th>
                </tr>
              </ng-template>

              <ng-template #body let-row let-i="rowIndex">
                <tr
                  [formGroup]="row"
                  class="hover:bg-gray-50/50 transition-colors"
                >
                  <ng-container
                    *ngIf="
                      row.get('type')?.value === 'Category';
                      else normalRow
                    "
                  >
                    <td colspan="6" class="font-semibold bg-slate-50/80 p-2">
                      <input
                        pInputText
                        formControlName="description"
                        placeholder="📁 Group Heading Title (e.g. CCTV Equipment System Component)"
                        class="w-full font-semibold border-transparent bg-transparent focus:border-indigo-500 focus:bg-white rounded-md text-indigo-900"
                      />
                    </td>
                    <td colspan="1" class="bg-slate-50/80 text-center">
                      <p-button
                        icon="pi pi-trash"
                        severity="danger"
                        [text]="true"
                        styleClass="p-1 hover:bg-red-50 rounded-md"
                        (onClick)="removeItem(i)"
                      ></p-button>
                    </td>
                  </ng-container>

                  <ng-template #normalRow>
                    <td class="text-center font-medium text-gray-500">
                      {{ row.get('isGroup')?.value ? '' : getItemNumber(i) }}
                    </td>

                    <td class="p-2 align-top">
                      <p-editor
                        formControlName="description"
                        [style]="{ height: '80px' }"
                        styleClass="border-gray-200 rounded-md overflow-hidden"
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

                    <td class="p-2">
                      <input
                        pInputText
                        formControlName="unit"
                        placeholder="pcs/lot"
                        class="w-full text-center border-gray-200 rounded-md"
                      />
                    </td>

                    <td class="p-2">
                      <p-inputNumber
                        formControlName="quantity"
                        class="w-full!"
                        inputStyleClass="w-full! text-center border-gray-200 rounded-md"
                        styleClass="w-full!"
                      ></p-inputNumber>
                    </td>

                    <td class="p-2">
                      <p-inputNumber
                        formControlName="unitPrice"
                        class="w-full!"
                        inputStyleClass="w-full! text-right border-gray-200 rounded-md"
                        styleClass="w-full!"
                        mode="decimal"
                        [minFractionDigits]="2"
                        [maxFractionDigits]="2"
                      ></p-inputNumber>
                    </td>

                    <td class="p-2">
                      <p-inputNumber
                        formControlName="totalPrice"
                        [readonly]="true"
                        class="w-full!"
                        inputStyleClass="w-full! text-right bg-gray-50 border-gray-200 text-gray-700 font-medium rounded-md"
                        styleClass="w-full!"
                        mode="decimal"
                        [minFractionDigits]="2"
                        [maxFractionDigits]="2"
                      ></p-inputNumber>
                    </td>

                    <td class="text-center">
                      <p-button
                        icon="pi pi-trash"
                        severity="danger"
                        [text]="true"
                        styleClass="p-1 hover:bg-red-50 rounded-md"
                        (onClick)="removeItem(i)"
                      ></p-button>
                    </td>
                  </ng-template>
                </tr>
              </ng-template>

              <ng-template #footer>
                <tr class="border-t-2 border-gray-300">
                  <td
                    colspan="5"
                    class="text-right! font-bold text-gray-700 bg-gray-50/70 px-4 py-3"
                  >
                    Total Amount
                  </td>
                  <td
                    colspan="2"
                    class="text-right font-bold text-xl bg-indigo-50! text-indigo-900 border-l border-gray-200 px-4 py-3"
                  >
                    RM {{ FG.get('totalAmount')?.value | number: '1.2-2' }}
                  </td>
                </tr>
              </ng-template>

              <ng-template #emptymessage>
                <tr>
                  <td colspan="100%">
                    <div
                      class="flex flex-col items-center justify-center py-8 text-gray-400 gap-2"
                    >
                      <i class="pi pi-box text-3xl text-gray-300"></i>
                      <div class="text-sm">
                        No details or grouping layers added yet
                      </div>
                    </div>
                  </td>
                </tr>
              </ng-template>
            </p-table>
          </div>

          <div class="flex gap-3 mt-1">
            <p-button
              label="Add Group Section"
              styleClass="rounded-lg px-4 py-2 border-dashed border-indigo-300 text-indigo-700 hover:bg-indigo-50"
              icon="pi pi-folder-open"
              size="small"
              severity="secondary"
              [outlined]="true"
              (onClick)="addGroup()"
            ></p-button>
            <p-button
              label="Add New Line Item"
              styleClass="rounded-lg px-4 py-2 bg-indigo-50 border-indigo-100 text-indigo-700 hover:bg-indigo-100"
              icon="pi pi-plus"
              size="small"
              severity="info"
              [outlined]="true"
              (onClick)="addItem()"
            ></p-button>
          </div>
        </div>

        <div
          class="col-span-12 border border-gray-200 bg-white p-6 rounded-xl shadow-sm flex flex-col gap-5"
        >
          <div
            class="font-bold text-gray-800 text-lg border-b border-gray-100 pb-3"
          >
            Commercial Terms & Conditions
          </div>

          <div class="grid grid-cols-12 gap-5">
            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
              <label class="font-medium text-gray-700">Payment Terms</label>
              <input
                pInputText
                formControlName="paymentTerms"
                class="w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg"
                placeholder="e.g. 30 days from invoice date / 50% upfront"
              />
            </div>

            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
              <label class="font-medium text-gray-700">Validity (Days)</label>
              <p-inputNumber
                formControlName="validityDays"
                class="w-full!"
                inputStyleClass="w-full border-gray-300 rounded-lg"
                placeholder="e.g. 14"
              ></p-inputNumber>
            </div>

            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
              <label class="font-medium text-gray-700">Delivery Timeline</label>
              <input
                pInputText
                formControlName="deliveryTimeline"
                class="w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg"
                placeholder="e.g. Within 7–14 working days"
              />
            </div>

            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
              <label class="font-medium text-gray-700">Warranty Terms</label>
              <input
                pInputText
                formControlName="warrantyTerms"
                class="w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg"
                placeholder="e.g. 12 months manufacturer warranty"
              />
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
                  {{
                    mode === 'company' ? 'Add New Company' : 'Add New Client'
                  }}
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
              (onClick)="visible = false"
            ></p-button>
          </div>
        </div>

        <div class="p-6 max-h-[70vh] overflow-y-auto bg-white">
          <div
            [formGroup]="companyForm"
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
              *ngIf="!companyForm.get('sameAsBilling')?.value"
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
              *ngIf="companyForm.get('sameAsBilling')?.value"
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
            (onClick)="visible = false"
            label="Cancel"
            severity="secondary"
            styleClass="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 py-2 px-5 text-sm font-medium rounded-lg shadow-sm"
          ></p-button>

          <p-button
            (onClick)="Save()"
            label="Save"
            severity="info"
            [disabled]="companyForm.invalid"
            styleClass="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-400 border-none text-white py-2 px-6 text-sm font-medium shadow-sm rounded-lg"
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
      totalAmount: new FormControl<number | null>(0),
      paymentTerms: new FormControl<string | null>(null),
      validityDays: new FormControl<number | null>(null),
      deliveryTimeline: new FormControl<string | null>(null),
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
  }

  createItemGroup(data?: any): FormGroup {
    return new FormGroup({
      id: new FormControl<string | null>(data?.id ?? null),
      type: new FormControl<'Category' | 'Item'>(
        data?.type ?? (data?.isGroup ? 'Category' : 'Item'),
      ),
      parentId: new FormControl<string | null>(data?.parentId ?? null),
      isGroup: new FormControl<boolean>(data?.isGroup ?? false),
      description: new FormControl<string | null>(data?.description ?? null),
      quantity: new FormControl<number>(data?.quantity ?? 1),
      unit: new FormControl<string>(data?.unit ?? 'Nos'),
      unitPrice: new FormControl<number>(data?.unitPrice ?? 0),
      totalPrice: new FormControl<number>({
        value: data?.totalPrice ?? 0,
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
      parentId: x.parentId || null,

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
        description: 'New Group',
      }),
    );
  }

  calculateTotal() {
    const total = this.Items.controls.reduce((sum: number, group: any) => {
      return sum + (group.get('totalPrice')?.value || 0);
    }, 0);

    this.FG.get('totalAmount')?.setValue(total, { emitEvent: false });
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
