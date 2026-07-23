import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
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
import { map, Subject, switchMap, takeUntil } from 'rxjs';
import {
  denormalizeHtml,
  normalizeHtml,
  PagingContent,
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
import { CompanyDto } from '../../../models/Company';
import { TermsAndConditionDto } from '../../../models/TermsAndCondition';
import { TermsAndConditionService } from '../../../services/TermsAndConditionService';
import { PaymentTermDto } from '../../../models/PaymentTerm';
import { PaymentTermService } from '../../../services/PaymentTermService';
import { ProductServiceDto } from '../../../models/ProductService';
import { ProductServicesService } from '../../../services/productServicesService';
import { PopoverModule } from 'primeng/popover';
import { OrderListModule } from 'primeng/orderlist';

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
    FormsModule,
    PopoverModule,
    OrderListModule,
    CheckboxModule,
  ],
  template: `<div class="min-h-screen bg-slate-50/50 p-6">
    <div class="mx-auto space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-slate-900 tracking-tight">
            {{ currentId ? 'Update Quotation' : 'Create New Quotation' }}
          </h1>
          <p class="text-slate-500">
            Manage your business quotations with precision.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <p-button
            label="Cancel"
            severity="secondary"
            [outlined]="true"
            [routerLink]="'/quotations'"
            styleClass="px-6 rounded-xl"
          />
          <p-button
            (onClick)="SaveQuotation()"
            [label]="currentId ? 'Save Changes' : 'Generate Quotation'"
            icon="pi pi-check-circle"
            styleClass="!bg-blue-600 hover:bg-blue-700 !border-0 px-6 rounded-xl shadow-lg shadow-blue-600/20"
          />
        </div>
      </div>

      <div
        [formGroup]="FG"
        class="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm"
      >
        <div class="grid grid-cols-12 items-center gap-5">
          <div class="col-span-12 lg:col-span-6 flex flex-col gap-2">
            <label class="block font-medium text-slate-700"
              >Quotation No.</label
            >
            <input
              pInputText
              class="w-full"
              formControlName="quotationNo"
              placeholder="e.g. QT-2026-001"
            />
          </div>
          <div class="col-span-12 lg:col-span-6 flex flex-col gap-2">
            <label class="block font-medium text-slate-700">Date</label>
            <p-datepicker
              [showIcon]="true"
              formControlName="quotationDate"
              styleClass="w-full"
              dateFormat="dd/mm/yy"
            />
          </div>
          <div class="col-span-12 flex flex-col gap-2">
            <label class="block font-medium text-slate-700"> Subject </label>

            <div
              class="flex items-center gap-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500"
            >
              <span class="whitespace-nowrap text-black font-bold">
                Re: Request for quotation -
              </span>

              <input
                pInputText
                formControlName="subject"
                placeholder="What is this quotation for?"
                class="flex-1 min-w-0 border-0 shadow-none focus:shadow-none focus:ring-0 bg-transparent font-bold! text-slate-800!"
              />
            </div>
          </div>
        </div>

        <hr class="border-slate-100 my-6" />

        <!-- Company & Client Selection -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- From Section -->
          <div class="space-y-4">
            <div class="flex flex-row justify-between items-center">
              <h3 class="font-semibold text-slate-900 flex items-center gap-2">
                <i class="pi pi-building text-blue-600"></i> Select From
              </h3>
              <p-button
                [text]="true"
                label="Add Company Profile"
                icon="pi pi-plus-circle"
                severity="info"
                size="small"
                styleClass="p-0! text-blue-600!"
                (onClick)="AddCompanyClick()"
              ></p-button>
            </div>
            <p-select
              [options]="filteredCompanies()"
              formControlName="fromCompanyId"
              [filter]="true"
              optionLabel="name"
              optionValue="id"
              placeholder="Select Company"
              styleClass="w-full"
            />

            <div class="grid grid-cols-2 gap-4 text-sm" *ngIf="selectedCompany">
              <!-- Billing -->
              <div class="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p class="font-bold text-slate-900 mb-2">Billing</p>

                <p class="text-slate-600 leading-relaxed">
                  {{ selectedCompany.billingAddress?.addressLine1 }}
                  <span *ngIf="selectedCompany.billingAddress?.addressLine2">
                    , {{ selectedCompany.billingAddress?.addressLine2 }}
                  </span>
                  <br />
                  {{ selectedCompany.billingAddress?.postcode }}
                  {{ selectedCompany.billingAddress?.city }},
                  {{ selectedCompany.billingAddress?.state }}
                </p>
              </div>

              <!-- Delivery -->
              <div class="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p class="font-bold text-slate-900 mb-2">Delivery</p>

                <p class="text-slate-600 leading-relaxed">
                  {{ selectedCompany.deliveryAddress?.addressLine1 }}
                  <span *ngIf="selectedCompany.deliveryAddress?.addressLine2">
                    , {{ selectedCompany.deliveryAddress?.addressLine2 }}
                  </span>
                  <br />
                  {{ selectedCompany.deliveryAddress?.postcode }}
                  {{ selectedCompany.deliveryAddress?.city }},
                  {{ selectedCompany.deliveryAddress?.state }}
                </p>
              </div>
            </div>
          </div>

          <!-- Client Section -->
          <div class="space-y-4">
            <div class="flex flex-row items-center justify-between">
              <h3 class="font-semibold text-slate-900 flex items-center gap-2">
                <i class="pi pi-user text-blue-600"></i> Select Client
              </h3>
              <p-button
                [text]="true"
                label="Add Client"
                icon="pi pi-plus-circle"
                severity="info"
                size="small"
                styleClass="p-0! text-blue-600!"
                (onClick)="AddClientClick()"
              ></p-button>
            </div>
            <p-select
              [options]="filteredClients()"
              formControlName="clientId"
              [filter]="true"
              optionLabel="name"
              optionValue="id"
              placeholder="Select Client"
              styleClass="w-full"
            />

            <div class="grid grid-cols-2 gap-4 text-sm" *ngIf="selectedClient">
              <!-- Billing -->
              <div class="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p class="font-bold text-slate-900 mb-2">Billing</p>

                <p class="text-slate-700 font-medium mb-1">
                  Attn:
                  {{ selectedClient.contactPerson1 }}
                  <span *ngIf="selectedClient.contactPerson2">
                    / {{ selectedClient.contactPerson2 }}
                  </span>
                </p>

                <p class="text-slate-600 leading-relaxed">
                  {{ selectedClient.billingAddress?.addressLine1 }}
                  <span *ngIf="selectedClient.billingAddress?.addressLine2">
                    , {{ selectedClient.billingAddress?.addressLine2 }}
                  </span>
                  <br />
                  {{ selectedClient.billingAddress?.postcode }}
                  {{ selectedClient.billingAddress?.city }},
                  {{ selectedClient.billingAddress?.state }}
                </p>
              </div>

              <!-- Delivery -->
              <div class="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p class="font-bold text-slate-900 mb-2">Delivery</p>

                <p class="text-slate-600 leading-relaxed">
                  {{ selectedClient.deliveryAddress?.addressLine1 }}
                  <span *ngIf="selectedClient.deliveryAddress?.addressLine2">
                    , {{ selectedClient.deliveryAddress?.addressLine2 }}
                  </span>
                  <br />
                  {{ selectedClient.deliveryAddress?.postcode }}
                  {{ selectedClient.deliveryAddress?.city }},
                  {{ selectedClient.deliveryAddress?.state }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Order Lines -->
        <div class="flex flex-col gap-2 border-t border-gray-100 my-5 pt-5">
          <div class="flex flex-row items-center justify-between">
            <div class="flex flex-row items-center gap-2">
              <div class="pi pi-list text-blue-600!"></div>
              <div class="font-semibold">Order Lines</div>
            </div>
          </div>
          <p-table
            [value]="Items.controls"
            [showGridlines]="true"
            [paginator]="false"
            [scrollable]="true"
            scrollHeight="flex"
            responsiveLayout="scroll"
            size="small"
          >
            <ng-template #header>
              <tr>
                <th class="bg-gray-100! w-[5%]! text-center!">Item</th>
                <th class="bg-gray-100! w-[25%]!">Description</th>
                <th class="bg-gray-100! w-[10%]! text-center!">Unit</th>
                <th class="bg-gray-100! w-[10%]! text-center!">Qty</th>
                <th class="bg-gray-100! w-[10%]! text-center!">Disc (%)</th>
                <th class="bg-gray-100! w-[15%]! text-right!">
                  Unit Price (RM)
                </th>
                <th class="bg-gray-100! w-[15%]! text-right!">
                  Total Amount (RM)
                </th>
                <th class="bg-gray-100! w-[5%]!"></th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-row let-rowIndex="rowIndex">
              <tr [formGroup]="row">
                <!--  EDIT MODE -->
                <ng-container *ngIf="row.get('isEdit')?.value; else viewMode">
                  <!-- LINE ITEM -->
                  <ng-container
                    *ngIf="row.get('rowType')?.value === 'LineItem'"
                  >
                    <td>
                      <input
                        pInputText
                        formControlName="item"
                        class="w-full text-center"
                      />
                    </td>

                    <td>
                      <div class="relative w-full">
                        <p-editor
                          formControlName="description"
                          [style]="{ 'min-height': '80px' }"
                          (onInit)="onEditorInit($event, rowIndex)"
                          ><ng-template #header>
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
                            </span> </ng-template
                        ></p-editor>

                        <div
                          *ngIf="
                            activeSuggestionIndex === rowIndex &&
                            rowSuggestions[rowIndex]?.length
                          "
                          class="absolute z-[9999] mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-auto"
                        >
                          <div
                            *ngFor="let product of rowSuggestions[rowIndex]"
                            (click)="insertProduct(product, row, rowIndex)"
                            class="p-3 hover:bg-blue-50 cursor-pointer flex flex-col gap-1"
                          >
                            <!-- <div class="font-semibold text-gray-800">
                              {{ product.name }}
                            </div> -->

                            <div
                              class="text-xs text-gray-500 line-clamp-2"
                              [innerHtml]="product.description"
                            ></div>

                            <div class="flex gap-2 text-xs mt-1">
                              <span class="bg-gray-100 px-2 py-1 rounded">
                                Unit: {{ product.unit }}
                              </span>
                              <span class="bg-gray-100 px-2 py-1 rounded">
                                Quantity: {{ product.quantity }}
                              </span>

                              <span
                                class="bg-blue-50 text-blue-700 px-2 py-1 rounded"
                              >
                                RM {{ product.price }}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <input
                        pInputText
                        formControlName="unit"
                        class="w-full text-center"
                      />
                    </td>

                    <td>
                      <p-inputnumber
                        formControlName="quantity"
                        inputStyleClass="w-full text-center"
                      />
                    </td>

                    <td>
                      <p-inputnumber
                        formControlName="discount"
                        suffix="%"
                        inputStyleClass="w-full text-center"
                      />
                    </td>

                    <td>
                      <p-inputnumber
                        formControlName="unitPrice"
                        mode="currency"
                        currency="MYR"
                        locale="ms-MY"
                        inputStyleClass="w-full text-right"
                      />
                    </td>

                    <td>
                      <p-inputnumber
                        formControlName="totalPrice"
                        mode="currency"
                        currency="MYR"
                        locale="ms-MY"
                        [readonly]="true"
                        inputStyleClass="w-full text-right bg-gray-50 font-semibold"
                      />
                    </td>
                  </ng-container>

                  <!-- SECTION -->
                  <ng-container
                    *ngIf="row.get('rowType')?.value === 'CategoryHeader'"
                  >
                    <td colspan="7">
                      <input
                        pInputText
                        formControlName="description"
                        class="w-full font-bold"
                      />
                    </td>
                  </ng-container>

                  <!-- NOTES -->
                  <ng-container *ngIf="row.get('rowType')?.value === 'NoteRow'">
                    <td>
                      <input
                        pInputText
                        formControlName="item"
                        class="w-full text-center italic"
                      />
                    </td>

                    <td colspan="6">
                      <textarea
                        pTextarea
                        formControlName="description"
                        rows="3"
                        class="w-full italic"
                      ></textarea>
                    </td>
                  </ng-container>

                  <!-- ACTION -->
                  <td class="text-center">
                    <div class="flex flex-row items-center justify-center">
                      <p-button
                        icon="pi pi-check-circle"
                        [text]="true"
                        (onClick)="row.get('isEdit')?.setValue(false)"
                      />
                      <p-button
                        icon="pi pi-trash"
                        severity="danger"
                        [text]="true"
                        (onClick)="removeItem(rowIndex)"
                      />
                    </div>
                  </td>
                </ng-container>

                <!--  VIEW MODE -->
                <ng-template #viewMode>
                  <ng-container [ngSwitch]="row.get('rowType')?.value">
                    <!-- LINE -->
                    <ng-container *ngSwitchCase="'LineItem'">
                      <td class="text-center!">{{ row.get('item')?.value }}</td>
                      <td>
                        <div [innerHTML]="row.get('description')?.value"></div>
                      </td>
                      <td class="text-center!">{{ row.get('unit')?.value }}</td>
                      <td class="text-center!">
                        {{ row.get('quantity')?.value }}
                      </td>
                      <td class="text-center!">
                        {{ row.get('discount')?.value }}
                      </td>
                      <td class="text-right!">
                        {{ row.get('unitPrice')?.value | number: '1.2-2' }}
                      </td>
                      <td class="text-right! font-semibold">
                        {{ row.get('totalPrice')?.value | number: '1.2-2' }}
                      </td>
                    </ng-container>

                    <!-- SECTION -->
                    <ng-container *ngSwitchCase="'CategoryHeader'">
                      <td colspan="7" class="font-bold">
                        {{ row.get('description')?.value }}
                      </td>
                    </ng-container>

                    <!-- NOTE -->
                    <ng-container *ngSwitchCase="'NoteRow'">
                      <td class="text-center! italic">
                        {{ row.get('item')?.value }}
                      </td>
                      <td colspan="6" class="italic">
                        {{ row.get('description')?.value }}
                      </td>
                    </ng-container>
                  </ng-container>

                  <td class="text-center">
                    <div class="flex items-center justify-center">
                      <p-button
                        icon="pi pi-pencil"
                        [text]="true"
                        severity="info"
                        (onClick)="row.get('isEdit')?.setValue(true)"
                      />
                      <p-button
                        icon="pi pi-trash"
                        [text]="true"
                        severity="danger"
                        (onClick)="removeProductService(rowIndex)"
                      />
                    </div>
                  </td>
                </ng-template>
              </tr>
            </ng-template>
            <ng-template #footer>
              <tr>
                <td colspan="6" class="text-right!">SubTotal</td>
                <td colspan="1" class="text-right!">
                  {{ subTotal() | number: '1.2' }}
                </td>
                <td colspan="1" class="text-sm"></td>
              </tr>
              <tr>
                <td colspan="6" class="text-right! text-red-500!">
                  - Discount (RM)
                </td>
                <td colspan="1" class="text-right!">
                  <p-inputnumber
                    mode="decimal"
                    [minFractionDigits]="2"
                    [maxFractionDigits]="5"
                    inputStyleClass="w-full! min-w-0! text-right! text-red-500!"
                    formControlName="discount"
                  ></p-inputnumber>
                </td>
                <td colspan="1" class="text-sm"></td>
              </tr>
              <tr>
                <td colspan="6" class="text-right! font-bold! bg-gray-50!">
                  Total Amount
                </td>
                <td colspan="1" class="text-right! font-bold! bg-gray-50!">
                  {{ totalAmount() | number: '1.2' }}
                </td>
                <td colspan="1" class="bg-gray-50!"></td>
              </tr>
            </ng-template>
            <ng-template #emptymessage>
              <tr>
                <td colspan="100%">
                  <div
                    class="flex flex-col items-center text-sm py-2 justify-center text-gray-400 gap-2"
                  >
                    <i class="pi pi-box"></i>
                    <span>No order found</span>
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
          <div class="flex flex-wrap gap-3 mt-2">
            <div
              (click)="ItemTypeClick('lines')"
              class="p-2 bg-blue-50 border text-sm border-blue-100 rounded-lg cursor-pointer hover:bg-gray-50 hover:scale-101"
            >
              Add Item
            </div>
            <div
              (click)="ItemTypeClick('section')"
              class="p-2 bg-blue-50 border text-sm border-blue-100 rounded-lg cursor-pointer hover:bg-gray-50 hover:scale-101"
            >
              Add Section
            </div>
            <div
              (click)="ItemTypeClick('notes')"
              class="p-2 bg-blue-50 border text-sm border-blue-100 rounded-lg cursor-pointer hover:bg-gray-50 hover:scale-101"
            >
              Add Notes
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-2 border-t border-gray-100 my-5 pt-5">
          <div class="flex flex-row items-center justify-between">
            <div class="flex flex-row items-center gap-2">
              <div class="pi pi-file text-blue-600"></div>
              <div class="font-semibold">Terms & Conditions</div>
            </div>
          </div>

          <div class="flex flex-col gap-2 mt-2" #termBox>
            <div class="grid grid-cols-12 gap-4 items-center">
              <div class="col-span-2 font-semibold">Terms:</div>
              <div class="col-span-10">
                <input
                  formControlName="paymentTerms"
                  pInputText
                  class="w-full"
                  placeholder="Enter payment terms (e.g. Net 30 days)"
                />
              </div>

              <div class="col-span-2 font-semibold">Validity:</div>

              <div class="col-span-10 flex items-center gap-3 flex-wrap">
                <!-- Checkbox -->
                <div class="flex items-center gap-2">
                  <p-checkbox
                    binary="true"
                    formControlName="noValidity"
                    inputId="noValidity"
                    class="mb-1"
                  ></p-checkbox>
                  <label for="noValidity" class="text-sm whitespace-nowrap">
                    No expiry
                  </label>
                </div>

                <!-- OR divider -->
                <span class="text-gray-400 text-sm">or</span>

                <!-- Input group -->
                <div class="flex items-center gap-2">
                  <p-inputnumber
                    formControlName="validity"
                    [disabled]="FG.get('noValidity')?.value"
                    inputStyleClass="w-24!"
                  ></p-inputnumber>

                  <p-select
                    formControlName="validityType"
                    appendTo="body"
                    [options]="[
                      { label: 'days', value: 'days' },
                      { label: 'months', value: 'months' },
                      { label: 'years', value: 'years' },
                    ]"
                    class="w-auto min-w-[90px]"
                    [disabled]="FG.get('noValidity')?.value"
                  ></p-select>
                </div>

                <!-- Description -->
                <span class="text-sm text-gray-500">
                  (with effect from the date of this quotation)
                </span>
              </div>

              <ng-container *ngFor="let term of selectedTerms; let i = index">
                <div class="col-span-2 font-semibold">{{ term.title }}:</div>
                <div
                  class="col-span-10 flex flex-row items-center justify-between"
                >
                  <span>{{ term.description }}</span
                  ><p-button
                    icon="pi pi-times"
                    [text]="true"
                    severity="danger"
                    (onClick)="removeSelectedTerm(i)"
                  >
                  </p-button>
                </div>
              </ng-container>

              <div class="col-span-2 relative">
                <input
                  pInputText
                  [ngModel]="title()"
                  (ngModelChange)="title.set($event)"
                  (focus)="activeField.set('title')"
                  [ngModelOptions]="{ standalone: true }"
                  class="w-full font-semibold!"
                />

                <div
                  *ngIf="activeField() === 'title' && filteredTerms().length"
                  class="z-50 absolute flex flex-col max-h-[150px] overflow-y-auto font-semibold border border-gray-300 rounded-b-lg bg-white w-full"
                >
                  <div
                    *ngFor="let term of filteredTerms()"
                    class="cursor-pointer hover:bg-gray-100 p-3"
                    (click)="SelectTerm(term)"
                  >
                    {{ term.title }}
                  </div>
                </div>
              </div>
              <div
                class="col-span-10 flex flex-row gap-3 items-center relative"
              >
                <input
                  pInputText
                  [ngModel]="description()"
                  (ngModelChange)="description.set($event)"
                  (focus)="activeField.set('description')"
                  class="w-full!"
                  [ngModelOptions]="{ standalone: true }"
                />

                <div
                  *ngIf="
                    activeField() === 'description' && filteredTerms().length
                  "
                  class="z-50 absolute top-full left-0 mt-1 flex flex-col max-h-[150px] overflow-y-auto font-semibold border border-gray-300 rounded-b-lg bg-white w-full"
                >
                  <div
                    *ngFor="let term of filteredTerms()"
                    class="cursor-pointer hover:bg-gray-100 p-3"
                    (click)="SelectTerm(term)"
                  >
                    {{ term.description }}
                  </div>
                </div>

                <p-button
                  icon="pi pi-plus-circle"
                  label="Add"
                  severity="info"
                  styleClass="border-none! bg-blue-600! text-white! text-sm! py-2! px-4!"
                  (onClick)="addInlineTerm()"
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
            class="bg-gray-100 px-8 py-4 relative overflow-hidden border-b border-gray-200"
          >
            <div
              class="absolute inset-0 bg-grid-white/[0.05] bg-[length:20px_20px]"
            ></div>
            <div class="relative flex justify-between items-start gap-2">
              <div class="flex items-center gap-4">
                <div
                  class="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm border border-gray-200 flex items-center justify-center"
                >
                  <i class="pi pi-building text-2xl"></i>
                </div>
                <div>
                  <h2 class="text-2xl font-bold tracking-tight m-0">
                    {{
                      mode === 'company' ? 'Add New Company' : 'Add New Client'
                    }}
                  </h2>
                  <p class=" text-sm mt-1 leading-relaxed">
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
                        formControlName="postcode"
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
                      Shipping Address
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
                        formControlName="postcode"
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
                    Delivery address will automatically match the billing
                    address
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div
            class="bg-slate-100 border-t border-slate-200 px-8 py-3 flex justify-end items-center gap-4"
          >
            <p-button
              (onClick)="visible = false"
              label="Cancel"
              severity="secondary"
              styleClass="px-6! py-2.5 border! border-slate-300! bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-all duration-200"
            ></p-button>

            <p-button
              (onClick)="SaveCompany()"
              [label]="'Save ' + (mode === 'company' ? 'Company' : 'Client')"
              severity="info"
              [disabled]="companyForm.invalid"
              styleClass="px-6! py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-500 border-0 text-white font-semibold shadow-lg shadow-blue-500/25 rounded-xl transition-all duration-200"
            ></p-button>
          </div>
        </ng-template>
      </p-dialog>
    </div>
  </div> `,
  styleUrl: './quotation-form.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuotationForm implements OnInit, OnDestroy {
  @ViewChild('termBox') termBox!: ElementRef;

  private readonly termsAndConditionService = inject(TermsAndConditionService);
  private readonly productServicesService = inject(ProductServicesService);
  private readonly paymentTermService = inject(PaymentTermService);
  private readonly loadingService = inject(LoadingService);
  private readonly quotationService = inject(QuotationService);
  private readonly messageService = inject(MessageService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly companyService = inject(CompanyService);
  private readonly clientService = inject(ClientService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  currentId: string | null = null;

  activeField = signal<'title' | 'description' | null>(null);
  title = signal('');
  description = signal('');

  visible: boolean = false;
  clientDialog: boolean = false;
  companyDialog: boolean = false;
  showNewPaymentTermInput: boolean = false;
  productServiceDialog: boolean = false;
  showProductForm: boolean = false;

  dragIndex: number | null = null;

  dropdownPosition = {
    x: 0,
    y: 0,
  };

  mode: 'client' | 'company' = 'client';
  itemType: 'lines' | 'section' | 'notes' = 'lines';
  activeRowIndex: number | null = null;
  rowSuggestions: { [key: number]: any[] } = {};

  selectedTerms: any[] = [];

  searchClient = signal<string>('');
  searchCompany = signal<string>('');

  searchTerm = signal<string>('');
  searchItem = signal<string>('');

  FG!: FormGroup;
  companyForm!: FormGroup;
  productForm!: FormGroup;

  termsName: string = '';
  newPaymentTermName: string = '';
  activeSuggestionIndex: number | null = null;
  newTerms: { title: string; description: string }[] = [];

  products: any[] = [];
  filteredProducts: any[] = [];

  editorInstances: { [key: number]: any } = {};

  companySelection: { label: string; value: string; data: any }[] = [];
  productOptions: { label: string; value: string; data: any }[] = [];

  clientSignal = signal<PagingContent<CompanyDto>>(
    {} as PagingContent<CompanyDto>,
  );

  companySignal = signal<PagingContent<CompanyDto>>(
    {} as PagingContent<CompanyDto>,
  );

  termsAndConditionSignal = signal<PagingContent<TermsAndConditionDto>>(
    {} as PagingContent<TermsAndConditionDto>,
  );
  paymentTermsSignal = signal<PagingContent<PaymentTermDto>>(
    {} as PagingContent<PaymentTermDto>,
  );
  productServiceSignal = signal<PagingContent<ProductServiceDto>>({
    data: [],
    totalElements: 0,
  });

  selectedCompany: any = null;
  selectedClient: any = null;

  subTotal = signal<number>(0);
  discount = signal<number>(0);
  totalAmount = signal<number>(0);

  @HostListener('document:click', ['$event'])
  onOutsideClick(event: MouseEvent) {
    if (!this.termBox) return;

    const clickedInside = this.termBox.nativeElement.contains(event.target);

    if (!clickedInside) {
      this.activeField.set(null);
    }
  }

  ngOnInit(): void {
    this.currentId = this.activatedRoute.snapshot.queryParams['id'];

    this.getDropdown();
    this.initForm();

    if (!this.currentId) {
      this.generateQuotationNo();
    } else {
      this.LoadForm();
    }
  }

  LoadForm() {
    this.loadingService.start();
    this.quotationService
      .GetOne({
        Page: 1,
        PageSize: 1,
        OrderBy: null,
        Select: null,
        Includes:
          'Client.BillingAddress,Client.DeliveryAddress,FromCompany.DeliveryAddress,FromCompany.BillingAddress,QuotationItems,TermsAndConditions',
        Filter: `Id=${this.currentId}`,
      })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();
          if (res && res.id) {
            this.FG.patchValue({
              ...res,
              quotationDate: new Date(res.quotationDate),
            });

            if (res.client) this.selectedClient = res.client;
            if (res.fromCompany) this.selectedCompany = res.fromCompany;

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

            if (res.termsAndConditions) {
              this.selectedTerms = res.termsAndConditions.map(
                (x) => x.termsAndCondition,
              );
              this.FG.get('termsAndConditions')?.patchValue(
                this.selectedTerms.map((x) => ({
                  termsAndConditionId: x.termsAndConditionId,
                  sortOrder: x.sortOrder,
                })),
              );
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

  getDropdown() {
    this.quotationService
      .GetDropdown()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.clientSignal.set({
            data: res.clients,
            totalElements: res.clients?.length,
          });

          this.companySignal.set({
            data: res.companies,
            totalElements: res.companies?.length,
          });

          this.termsAndConditionSignal.set({
            data: res.termsAndConditions,
            totalElements: res.termsAndConditions?.length,
          });

          this.paymentTermsSignal.set({
            data: res.paymentTerms,
            totalElements: res.paymentTerms?.length,
          });

          this.productOptions = res.productAndServices.map((x: any) => ({
            label: x.description,
            value: x.description,
            data: x,
          }));

          this.productServiceSignal.set({
            data: res.productAndServices,
            totalElements: res.productAndServices?.length,
          });

          this.cdr.markForCheck();
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
      validity: new FormControl<number | null>(null),
      validityType: new FormControl<string | null>('days'),
      noValidity: new FormControl<boolean>(false),
      execution: new FormControl<string | null>(null),
      warrantyTerms: new FormControl<string | null>(null),
      quotationItems: new FormArray([]),
      termsAndConditions: new FormControl<any[]>([]),
      otherInformation: new FormArray([]),
    });
    this.listenItemChanges();

    this.FG.get('fromCompanyId')?.valueChanges.subscribe((id) => {
      this.selectedCompany = this.filteredCompanies().find((x) => x.id === id);
      this.cdr.markForCheck();
    });

    this.FG.get('clientId')?.valueChanges.subscribe((id) => {
      this.selectedClient = this.clientSignal().data?.find((x) => x.id === id);

      this.cdr.markForCheck();
    });

    this.FG.get('discount')
      ?.valueChanges.pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        this.calculateTotal();
      });

    this.Items.valueChanges.subscribe(() => {
      this.calculateTotal();
    });
  }

  createItemGroup(data?: any): FormGroup {
    return new FormGroup({
      id: new FormControl(data?.id ?? null),
      rowType: new FormControl(data?.rowType ?? 'LineItem'),
      productServiceId: new FormControl<string | null>(null),
      item: new FormControl(data?.item ?? null),
      description: new FormControl(data?.description ?? ''),
      quantity: new FormControl(data?.quantity ?? null),
      unit: new FormControl(data?.unit ?? null),
      unitPrice: new FormControl(data?.unitPrice ?? null),
      discount: new FormControl(data?.discount ?? 0),

      totalPrice: new FormControl({
        value: data?.totalPrice ?? 0,
        disabled: true,
      }),

      isEdit: new FormControl(data?.id ? false : true), // ✅ important
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
        Includes: 'QuotationItems,TermsAndConditions.TermsAndCondition',
        Filter: `Id=${this.currentId}`,
      })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          if (res) {
            let loadedTerms: any[] = [];
            if (res.termsAndConditions?.length) {
              loadedTerms = res.termsAndConditions
                .map((jt: any) => jt.termsAndCondition)
                .filter((t: any) => !!t);
            }

            this.FG.patchValue({
              ...res,
              quotationDate: new Date(res.quotationDate),
              termsAndCondition: loadedTerms,
            });

            this.Items.clear();

            if (res.quotationItems?.length) {
              res.quotationItems.forEach((item: any) => {
                const group = this.createItemGroup(item);
                const qty = item.quantity ?? 0;
                const price = item.unitPrice ?? 0;

                group.patchValue(
                  { totalPrice: qty * price },
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
      rowType: x.rowType,
      item: x.item,
      description: normalizeHtml(x.description),
      quantity: x.quantity,
      unit: x.unit,
      unitPrice: x.unitPrice,
      discount: x.discount,
      totalPrice: (x.quantity || 0) * (x.unitPrice || 0),
      sortOrder: index,
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
          const qty = Number(group.get('quantity')?.value) || 0;
          const price = Number(group.get('unitPrice')?.value) || 0;
          const disc = Number(group.get('discount')?.value) || 0;

          const total = qty * price;
          const discAmount = total * (disc / 100);
          const totalPrice = total - discAmount;

          group.get('totalPrice')?.setValue(totalPrice, {
            emitEvent: false,
          });
        });

        this.calculateTotal();
      });
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
      const val = Number(group.get('totalPrice')?.value) || 0;
      return sum + val;
    }, 0);

    const discount = Number(this.FG.get('discount')?.value) || 0;

    const total = subTotal - discount;
    this.subTotal.set(subTotal);
    this.totalAmount.set(total);

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
        postcode: new FormControl(null, Validators.required),
        country: new FormControl('Malaysia', Validators.required),
      }),

      deliveryAddress: new FormGroup({
        name: new FormControl('Delivery'),
        addressLine1: new FormControl(null, Validators.required),
        addressLine2: new FormControl(null),
        city: new FormControl(null, Validators.required),
        state: new FormControl(null, Validators.required),
        postcode: new FormControl(null, Validators.required),
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
      postcode: new FormControl(null),
    });
  }

  SaveCompany() {
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
            const clients = list.data.filter(
              (x: any) => x.type === CompanyType.Client,
            );
            this.clientSignal.update((prev) => ({
              ...prev,
              data: clients,
              totalElements: clients.length,
            }));

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

      const formValues = this.FG.getRawValue();

      const termsAndConditions = this.selectedTerms.map((t, index) => ({
        termsAndConditionId: t.termsAndConditionId ?? null,
        title: t.title,
        description: t.description,
        sortOrder: index + 1,
      }));
      const payload = {
        ...formValues,
        quotationItems: this.buildQuotationItemsPayload(),
        termsAndConditions: termsAndConditions,
      };

      delete (payload as any).termsAndCondition;

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
          console.error('Payload submission error:', err);
        },
      });
    } else {
      ValidateAllFormFields(this.FG);
    }
  }

  ClientClick() {
    this.clientDialog = true;
    this.cdr.markForCheck();
  }

  CompanyClick() {
    this.companyDialog = true;
    this.cdr.markForCheck();
  }

  SelectClient(data: CompanyDto) {
    this.selectedClient = data;
    this.FG.get('clientId')?.setValue(data.id);
    this.clientDialog = false;
    this.cdr.markForCheck();
  }

  SelectCompany(data: CompanyDto) {
    this.FG.get('fromCompanyId')?.patchValue(data.id);
    this.companyDialog = false;
    this.selectedCompany = data;

    this.cdr.markForCheck();
  }

  filteredClients = computed(() => {
    const keyword = this.searchClient()?.toLowerCase() || '';

    return (
      this.clientSignal().data?.filter(
        (x: any) =>
          x.name?.toLowerCase().includes(keyword) ||
          x.contactNo?.toLowerCase().includes(keyword) ||
          x.contactPerson1?.toLowerCase().includes(keyword) ||
          x.contactPerson2?.toLowerCase().includes(keyword),
      ) ?? []
    );
  });

  filteredCompanies = computed(() => {
    const keyword = this.searchCompany()?.toLowerCase() || '';

    return (
      this.companySignal().data?.filter(
        (x: any) =>
          x.name?.toLowerCase().includes(keyword) ||
          x.contactNo?.toLowerCase().includes(keyword) ||
          x.contactPerson1?.toLowerCase().includes(keyword) ||
          x.contactPerson2?.toLowerCase().includes(keyword),
      ) ?? []
    );
  });

  SelectTerm(term: any) {
    this.title.set(term.title);
    this.description.set(term.description);
    this.activeField.set(null);
  }

  AddTermClick() {
    this.newTerms.push({ title: '', description: '' });
  }

  removeTerm(index: number) {
    this.newTerms.splice(index, 1);
  }

  saveTerms() {
    const validItems = this.newTerms
      .map((x) => ({
        title: x.title?.trim(),
        description: x.description || '',
      }))
      .filter((x) => !!x.title);

    if (!validItems.length) return;

    this.loadingService.start();

    this.termsAndConditionService
      .CreateBulk({ items: validItems })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (results) => {
          const current = this.termsAndConditionSignal().data || [];

          this.termsAndConditionSignal.set({
            ...this.termsAndConditionSignal(),
            data: [...current, ...results],
          });

          this.selectedTerms = [...this.selectedTerms, ...results];

          this.newTerms = [];

          this.loadingService.stop();
          this.cdr.markForCheck();
        },

        error: (err) => {
          console.error(err);
          this.loadingService.stop();
        },
      });
  }

  filteredTerms = computed(() => {
    const data = this.termsAndConditionSignal()?.data || [];

    const keyword =
      this.activeField() === 'title'
        ? this.title()
        : this.activeField() === 'description'
          ? this.description()
          : '';

    const search = keyword.toLowerCase().trim();

    if (!search) return data;

    return data.filter(
      (t) =>
        (t.title || '').toLowerCase().includes(search) ||
        (t.description || '').toLowerCase().includes(search),
    );
  });

  createNewPaymentTerm() {
    const termName = this.newPaymentTermName.trim();
    if (!termName) return;

    this.loadingService.start();
    this.paymentTermService
      .Create({ name: termName })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (newTerm: any) => {
          const currentData = this.paymentTermsSignal().data;

          this.paymentTermsSignal.set({
            ...this.paymentTermsSignal(),
            data: [...currentData, newTerm],
          });

          this.FG.get('paymentTerms')?.setValue(newTerm.name);

          this.newPaymentTermName = '';
          this.showNewPaymentTermInput = false;
          this.loadingService.stop();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loadingService.stop();
          console.error('Failed to create payment term:', err);
        },
      });
  }

  AddProductServiceClick() {
    const state = this.productServiceSignal();

    if (!state.data || state.data.length === 0) {
      this.getDropdown();
    }

    this.productServiceDialog = true;
  }

  removeProductService(index: number) {
    this.Items.removeAt(index);
  }

  filteredItems = computed(() => {
    const state = this.productServiceSignal();
    const keyword = this.searchItem().toLowerCase();

    return (state.data || []).filter(
      (x: any) =>
        x.name?.toLowerCase().includes(keyword) ||
        x.description?.toLowerCase().includes(keyword),
    );
  });

  ItemTypeClick(type: 'lines' | 'section' | 'notes') {
    let rowType: 'LineItem' | 'CategoryHeader' | 'NoteRow';

    if (type === 'lines') rowType = 'LineItem';
    else if (type === 'section') rowType = 'CategoryHeader';
    else rowType = 'NoteRow';

    this.Items.push(
      this.createItemGroup({
        rowType,
        productServiceId: null,
        item: rowType === 'CategoryHeader' ? '' : null,
        description: '',
        quantity: rowType === 'LineItem' ? 1 : null,
        unit: rowType === 'LineItem' ? '' : null,
        unitPrice: rowType === 'LineItem' ? 0 : null,
        discount: 0,
        totalPrice: 0,
      }),
    );

    this.cdr.markForCheck();
  }

  onProductSelect(group: FormGroup) {
    const product = group.get('product')?.value;

    if (!product) return;

    group.patchValue({
      productServiceId: product.id,
      item: product.name,
      description: product.description,
      unit: product.unit,
      quantity: product.quantity,
      unitPrice: product.price,
    });

    this.recalculateRow(group);
  }

  recalculateRow(group: FormGroup) {
    const qty = Number(group.get('quantity')?.value) || 0;
    const price = Number(group.get('unitPrice')?.value) || 0;
    const disc = Number(group.get('discount')?.value) || 0;

    const total = qty * price;
    const discAmount = total * (disc / 100);

    group.patchValue(
      {
        totalPrice: total - discAmount,
      },
      { emitEvent: false },
    );
  }

  onEditorInit(event: any, rowIndex: number) {
    this.editorInstances[rowIndex] = event.editor;

    event.editor.on('text-change', () => {
      const editor = this.editorInstances[rowIndex];
      const selection = editor.getSelection();
      if (!selection) return;

      const text = editor.getText(0, selection.index);
      const lastWord = text.split(/\s/).pop()?.toLowerCase();

      if (lastWord && lastWord.length >= 2) {
        this.activeSuggestionIndex = rowIndex;

        this.searchProducts(lastWord, rowIndex);
      } else {
        this.rowSuggestions[rowIndex] = [];
        this.activeSuggestionIndex = null;
      }
    });
  }

  closeSuggestion(rowIndex: number) {
    if (this.activeSuggestionIndex === rowIndex) {
      this.activeSuggestionIndex = null;
    }
  }

  searchProducts(keyword: string, rowIndex: number) {
    const list = this.productServiceSignal().data || [];

    this.rowSuggestions[rowIndex] = list.filter((p) => {
      const name = (p.name || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();

      return (
        name.includes(keyword.toLowerCase()) ||
        desc.includes(keyword.toLowerCase())
      );
    });
  }

  insertProduct(product: any, row: any, rowIndex: number) {
    const editor = this.editorInstances[rowIndex];
    if (!editor) return;

    const html = product.description || '';

    editor.insertText(editor.getLength(), '\n');
    editor.clipboard.dangerouslyPasteHTML(editor.getLength(), html);

    row.patchValue({
      unit: product.unit,
      unitPrice: product.price,
      quantity: product.quantity,
      description: editor.root.innerHTML,
    });

    this.rowSuggestions[rowIndex] = [];
    this.activeSuggestionIndex = null;
  }

  stripHtml(html: string) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }

  addInlineTerm() {
    const title = this.title()?.trim();
    const description = this.description()?.trim();

    if (!title || !description) return;

    const exists = this.selectedTerms.some(
      (t) => (t.title || '').toLowerCase() === title.toLowerCase(),
    );

    if (exists) {
      console.warn('Term already exists');
      return;
    }

    this.selectedTerms.push({
      title,
      description,
      sortOrder: this.selectedTerms.length + 1,
    });

    this.title.set('');
    this.description.set('');
    this.activeField.set(null);

    this.syncTermsToForm();
  }

  syncTermsToForm() {
    this.FG.patchValue({
      termsAndConditions: this.selectedTerms.map((t, i) => ({
        termsAndConditionId: t.termsAndConditionId ?? null,
        title: t.title,
        description: t.description,
        sortOrder: i + 1,
      })),
    });
  }

  onTermsReorder() {
    this.selectedTerms = [...this.selectedTerms];
  }

  get otherInfo(): FormArray {
    return this.FG.get('otherInformation') as FormArray;
  }

  addOtherInfo() {
    this.otherInfo.push(
      this.fb.group({
        field: [''],
        value: [''],
      }),
    );
  }

  removeOtherInfo(index: number) {
    this.otherInfo.removeAt(index);
  }

  removeSelectedTerm(index: number) {
    this.selectedTerms.splice(index, 1);

    this.updateTermOrder();

    this.FG.patchValue({
      termsAndConditions: this.selectedTerms.map((t, i) => ({
        termsAndConditionId: t.termsAndConditionId ?? t.id,
        sortOrder: i + 1,
      })),
    });
  }

  onTitleFocus() {
    this.activeField.set('title');
  }

  onDescriptionFocus() {
    this.activeField.set('description');
  }

  onDragStart(index: number) {
    this.dragIndex = index;
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onDrop(dropIndex: number) {
    if (this.dragIndex === null || this.dragIndex === dropIndex) return;

    const item = this.selectedTerms[this.dragIndex];

    this.selectedTerms.splice(this.dragIndex, 1);
    this.selectedTerms.splice(dropIndex, 0, item);

    this.dragIndex = null;

    this.updateTermOrder();
    this.onTermsReorder();
  }

  private updateTermOrder() {
    this.selectedTerms.forEach((t, index) => {
      t.order = index + 1;
    });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
