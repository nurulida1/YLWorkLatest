import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
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
import { MessageService } from 'primeng/api';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map, Observable, Subject, switchMap, takeUntil } from 'rxjs';
import { DatePickerModule } from 'primeng/datepicker';
import { EditorModule } from 'primeng/editor';
import { DialogModule } from 'primeng/dialog';
import { TabsModule } from 'primeng/tabs';
import { CheckboxModule } from 'primeng/checkbox';
import { PopoverModule } from 'primeng/popover';
import { OrderListModule } from 'primeng/orderlist';
import { CompanyDto } from '../../../../models/Company';
import { PaymentTermDto } from '../../../../models/PaymentTerm';
import { ProductServiceDto } from '../../../../models/ProductService';
import { TermsAndConditionDto } from '../../../../models/TermsAndCondition';
import { ClientService } from '../../../../services/ClientService';
import { CompanyService } from '../../../../services/companyService';
import { LoadingService } from '../../../../services/loading.service';
import { PaymentTermService } from '../../../../services/PaymentTermService';
import { QuotationService } from '../../../../services/quotationService.service';
import { TermsAndConditionService } from '../../../../services/TermsAndConditionService';
import { CompanyType } from '../../../../shared/enum/enum';
import {
  PagingContent,
  denormalizeHtml,
  normalizeHtml,
  ValidateAllFormFields,
} from '../../../../shared/helpers/helpers';
import {
  QuotationDto,
  SaveQuotationAsTemplateRequest,
} from '../../../../models/Quotation';
import { OverlayModule } from '@angular/cdk/overlay';
import { CdkOverlayOrigin } from '@angular/cdk/overlay';
import {
  DragDropModule,
  CdkDragDrop,
  moveItemInArray,
} from '@angular/cdk/drag-drop';

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
    OverlayModule,
    DragDropModule,
  ],
  template: `
    <div class="min-h-screen bg-slate-50 px-3 py-5 sm:px-5 lg:px-8">
      <div class="mx-auto max-w-[1600px] space-y-6">
        <!-- HEADER -->
        <section class="space-y-5">
          <div class="flex items-center gap-2 font-medium text-slate-500">
            <a routerLink="/quotations" class="hover:text-blue-600">
              Quotations
            </a>
            <i class="pi pi-angle-right text-[10px]"></i>
            <span class="text-slate-800">
              {{ currentId ? 'Edit Quotation' : 'New Quotation' }}
            </span>
          </div>

          <div
            class="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between"
          >
            <div class="flex items-start gap-4">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <h1 class="text-2xl font-bold tracking-tight text-slate-900">
                    {{ currentId ? 'Edit Quotation' : 'Create Quotation' }}
                  </h1>

                  <span
                    class="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700"
                  >
                    {{ quotationStatus || 'New Draft' }}
                  </span>
                </div>

                <p class="mt-1 text-slate-500">
                  Prepare and manage your business quotation.
                </p>
              </div>
            </div>

            <!-- ACTIONS -->
            <div class="flex flex-wrap items-center gap-2">
              <p-button
                label="Cancel"
                icon="pi pi-arrow-left"
                severity="secondary"
                [text]="true"
                [routerLink]="'/quotations'"
              />

              <p-button
                label="Save as Template"
                icon="pi pi-bookmark"
                severity="secondary"
                [outlined]="true"
                (onClick)="SaveAsTemplate()"
              />

              <p-button
                label="Save Draft"
                icon="pi pi-save"
                severity="secondary"
                [outlined]="true"
                (onClick)="SaveDraft()"
              />

              <p-button
                label="Submit Quotation"
                icon="pi pi-send"
                severity="primary"
                styleClass="bg-blue-700! border-none! hover:bg-blue-500!"
                (onClick)="SaveQuotation()"
              />
            </div>
          </div>
        </section>

        <!-- USE QUOTATION TEMPLATE -->
        <section
          class="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 shadow-sm"
        >
          <div
            class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div class="flex items-center gap-3">
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700"
              >
                <i class="pi pi-book text-lg"></i>
              </div>

              <div>
                <h2 class="font-bold text-slate-900">Use Quotation Template</h2>
                <p class="text-sm text-slate-500">
                  Select a saved template to automatically populate this
                  quotation.
                </p>
              </div>
            </div>

            <div class="w-full sm:max-w-md">
              <p-select
                [options]="quotationTemplates"
                optionLabel="name"
                optionValue="id"
                placeholder="Choose a quotation template"
                filterPlaceholder="Search templates..."
                [filter]="true"
                [showClear]="true"
                [loading]="loadingTemplates"
                appendTo="body"
                styleClass="w-full"
                [(ngModel)]="selectedTemplateId"
                [ngModelOptions]="{ standalone: true }"
                (onChange)="onQuotationTemplateChange($event.value)"
              />
            </div>
          </div>
        </section>

        <!-- FINANCIAL SUMMARY -->
        <section class="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <div class="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold text-slate-500">Subtotal</span>
              <i class="pi pi-calculator text-slate-400"></i>
            </div>
            <p class="mt-3 text-xl font-bold text-slate-900">
              RM {{ subTotal() | number: '1.2-2' }}
            </p>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold text-slate-500">Discount</span>
              <i class="pi pi-percentage text-red-400"></i>
            </div>
            <p class="mt-3 text-xl font-bold text-red-500">
              RM {{ FG.get('discount')?.value || 0 | number: '1.2-2' }}
            </p>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold text-slate-500"
                >Order Items</span
              >
              <i class="pi pi-list text-slate-400"></i>
            </div>
            <p class="mt-3 text-xl font-bold text-slate-900">
              {{ getLineItemCount() }}
            </p>
          </div>

          <div
            class="rounded-2xl border border-blue-600 bg-blue-600 p-4 text-white shadow-md shadow-blue-600/10 sm:p-5"
          >
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold text-blue-100"
                >Grand Total</span
              >
              <i class="pi pi-wallet text-blue-200"></i>
            </div>
            <p class="mt-3 text-xl font-bold">
              RM {{ totalAmount() | number: '1.2-2' }}
            </p>
          </div>
        </section>

        <!-- MAIN FORM -->
        <div [formGroup]="FG" class="space-y-6">
          <!-- QUOTATION DETAILS -->
          <section
            class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div
              class="flex items-center gap-3 border-b border-slate-100 px-5 py-5 sm:px-7"
            >
              <div
                class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"
              >
                <i class="pi pi-file-edit"></i>
              </div>
              <div>
                <h2 class="font-bold text-slate-900">Quotation Details</h2>
                <p class="text-sm text-slate-500">
                  Basic information about this quotation.
                </p>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-7">
              <div class="space-y-2 flex flex-col">
                <label class="text-sm font-semibold text-slate-700"
                  >Quotation Number</label
                >
                <input
                  pInputText
                  formControlName="quotationNo"
                  placeholder="e.g. QT-2026-001"
                  class="w-full"
                />
              </div>

              <div class="space-y-2 flex flex-col">
                <label class="text-sm font-semibold text-slate-700"
                  >Quotation Date</label
                >
                <p-datepicker
                  [showIcon]="true"
                  formControlName="quotationDate"
                  styleClass="w-full"
                  dateFormat="dd/mm/yy"
                  appendTo="body"
                />
              </div>

              <div class="space-y-2 sm:col-span-2">
                <label class="text-sm font-semibold text-slate-700"
                  >Subject</label
                >
                <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <span class="shrink-0 font-semibold text-slate-600">
                    Re: Request for quotation -
                  </span>
                  <input
                    pInputText
                    formControlName="subject"
                    placeholder="Enter quotation subject"
                    class="w-full"
                  />
                </div>
              </div>
            </div>
          </section>

          <!-- COMPANY AND CLIENT -->
          <section class="space-y-4">
            <div class="flex items-center gap-3">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"
              >
                <i class="pi pi-building"></i>
              </div>
              <div>
                <h2 class="font-bold text-slate-900">Parties Involved</h2>
                <p class="text-sm text-slate-500">
                  Select the issuing company and recipient.
                </p>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-5 xl:grid-cols-2">
              <!-- FROM COMPANY -->
              <div
                class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
              >
                <div
                  class="mb-5 flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <p
                      class="text-xs font-bold uppercase tracking-wider text-blue-600"
                    >
                      Issued By
                    </p>
                    <h3 class="mt-1 font-bold text-slate-900">Your Company</h3>
                  </div>

                  <p-button
                    label="Add Company"
                    icon="pi pi-plus"
                    severity="info"
                    [text]="true"
                    size="small"
                    (onClick)="AddCompanyClick()"
                  />
                </div>

                <p-select
                  [options]="filteredCompanies()"
                  formControlName="fromCompanyId"
                  [filter]="true"
                  optionLabel="name"
                  optionValue="id"
                  placeholder="Choose issuing company"
                  styleClass="w-full"
                />

                <div
                  *ngIf="selectedCompany"
                  class="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2"
                >
                  <div class="rounded-xl bg-slate-50 p-4">
                    <div
                      class="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700"
                    >
                      <i class="pi pi-credit-card text-blue-600"></i>
                      Billing Address
                    </div>
                    <p
                      class="break-words text-sm leading-relaxed text-slate-600"
                    >
                      {{ selectedCompany.billingAddress?.addressLine1 }}
                      <span
                        *ngIf="selectedCompany.billingAddress?.addressLine2"
                      >
                        , {{ selectedCompany.billingAddress?.addressLine2 }}
                      </span>
                      <br />
                      {{ selectedCompany.billingAddress?.postcode }}
                      {{ selectedCompany.billingAddress?.city }},
                      {{ selectedCompany.billingAddress?.state }}
                    </p>
                  </div>

                  <div class="rounded-xl bg-slate-50 p-4">
                    <div
                      class="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700"
                    >
                      <i class="pi pi-truck text-blue-600"></i>
                      Delivery Address
                    </div>
                    <p
                      class="break-words text-sm leading-relaxed text-slate-600"
                    >
                      {{ selectedCompany.deliveryAddress?.addressLine1 }}
                      <span
                        *ngIf="selectedCompany.deliveryAddress?.addressLine2"
                      >
                        , {{ selectedCompany.deliveryAddress?.addressLine2 }}
                      </span>
                      <br />
                      {{ selectedCompany.deliveryAddress?.postcode }}
                      {{ selectedCompany.deliveryAddress?.city }},
                      {{ selectedCompany.deliveryAddress?.state }}
                    </p>
                  </div>
                </div>

                <div
                  *ngIf="!selectedCompany"
                  class="mt-4 rounded-xl border border-dashed border-slate-200 py-8 text-center"
                >
                  <i class="pi pi-building text-2xl text-slate-300"></i>
                  <p class="mt-2 text-sm text-slate-500">No company selected</p>
                </div>
              </div>

              <!-- CLIENT -->
              <div
                class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
              >
                <div
                  class="mb-5 flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <p
                      class="text-xs font-bold uppercase tracking-wider text-emerald-600"
                    >
                      Prepared For
                    </p>
                    <h3 class="mt-1 font-bold text-slate-900">
                      Customer / Client
                    </h3>
                  </div>

                  <p-button
                    label="Add Client"
                    icon="pi pi-plus"
                    severity="info"
                    [text]="true"
                    size="small"
                    (onClick)="AddClientClick()"
                  />
                </div>

                <p-select
                  [options]="filteredClients()"
                  formControlName="clientId"
                  [filter]="true"
                  optionLabel="name"
                  optionValue="id"
                  placeholder="Choose client"
                  styleClass="w-full"
                />

                <div
                  *ngIf="selectedClient"
                  class="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2"
                >
                  <div class="rounded-xl bg-slate-50 p-4">
                    <div
                      class="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700"
                    >
                      <i class="pi pi-credit-card text-blue-600"></i>
                      Billing Address
                    </div>
                    <p class="mb-2 text-xs font-semibold text-slate-700">
                      Attn: {{ selectedClient.primaryContactPerson }}
                      <span *ngIf="selectedClient.secondaryContactPerson">
                        / {{ selectedClient.secondaryContactPerson }}
                      </span>
                    </p>
                    <p
                      class="break-words text-sm leading-relaxed text-slate-600"
                    >
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

                  <div class="rounded-xl bg-slate-50 p-4">
                    <div
                      class="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700"
                    >
                      <i class="pi pi-truck text-blue-600"></i>
                      Delivery Address
                    </div>
                    <p
                      class="break-words text-sm leading-relaxed text-slate-600"
                    >
                      {{ selectedClient.deliveryAddress?.addressLine1 }}
                      <span
                        *ngIf="selectedClient.deliveryAddress?.addressLine2"
                      >
                        , {{ selectedClient.deliveryAddress?.addressLine2 }}
                      </span>
                      <br />
                      {{ selectedClient.deliveryAddress?.postcode }}
                      {{ selectedClient.deliveryAddress?.city }},
                      {{ selectedClient.deliveryAddress?.state }}
                    </p>
                  </div>
                </div>

                <div
                  *ngIf="!selectedClient"
                  class="mt-4 rounded-xl border border-dashed border-slate-200 py-8 text-center"
                >
                  <i class="pi pi-user text-2xl text-slate-300"></i>
                  <p class="mt-2 text-sm text-slate-500">No client selected</p>
                </div>
              </div>
            </div>
          </section>

          <!-- ORDER ITEMS -->
          <section
            class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div
              class="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-7"
            >
              <div class="flex items-center gap-3">
                <div
                  class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"
                >
                  <i class="pi pi-list"></i>
                </div>
                <div>
                  <h2 class="font-bold text-slate-900">Quotation Items</h2>
                  <p class="text-sm text-slate-500">
                    Manage products, services and line descriptions.
                  </p>
                </div>
              </div>

              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  (click)="ItemTypeClick('lines')"
                  class="quotation-add-action"
                >
                  <i class="pi pi-plus-circle"></i>
                  Add Item
                </button>
                <button
                  type="button"
                  (click)="ItemTypeClick('section')"
                  class="quotation-add-action"
                >
                  <i class="pi pi-folder-plus"></i>
                  Add Section
                </button>
                <button
                  type="button"
                  (click)="ItemTypeClick('notes')"
                  class="quotation-add-action"
                >
                  <i class="pi pi-file-edit"></i>
                  Add Note
                </button>
              </div>
            </div>

            <div class="overflow-x-auto p-5">
              <p-table
                [value]="Items.controls"
                [paginator]="false"
                [scrollable]="true"
                showGridlines
                responsiveLayout="scroll"
                size="small"
              >
                <ng-template #header>
                  <tr>
                    <th class="min-w-20 bg-slate-50! text-center!">Item</th>
                    <th class="min-w-64 bg-slate-50!">Description</th>
                    <th class="min-w-24 bg-slate-50! text-center!">Unit</th>
                    <th class="min-w-24 bg-slate-50! text-center!">Qty</th>
                    <th class="min-w-24 bg-slate-50! text-center!">Disc (%)</th>
                    <th class="min-w-36 bg-slate-50! text-right!">
                      Unit Price
                    </th>
                    <th class="min-w-36 bg-slate-50! text-right!">
                      Total (RM)
                    </th>
                    <th class="w-24 bg-slate-50! text-center!">Actions</th>
                  </tr>
                </ng-template>

                <ng-template pTemplate="body" let-row let-rowIndex="rowIndex">
                  <tr [formGroup]="row" [pReorderableRow]="rowIndex">
                    <ng-container
                      *ngIf="row.get('isEdit')?.value; else viewMode"
                    >
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

                            <div
                              *ngIf="
                                activeSuggestionIndex === rowIndex &&
                                rowSuggestions[rowIndex]?.length
                              "
                              class="absolute left-0 top-full z-50 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-xl"
                            >
                              <div
                                *ngFor="let product of rowSuggestions[rowIndex]"
                                (click)="insertProduct(product, row, rowIndex)"
                                class="cursor-pointer border-b border-slate-100 p-3 last:border-0 hover:bg-blue-50"
                              >
                                <div
                                  class="line-clamp-2 text-xs text-slate-600"
                                  [innerHtml]="product.description"
                                ></div>
                                <div class="mt-2 flex flex-wrap gap-2 text-xs">
                                  <span
                                    class="rounded-lg bg-slate-100 px-2 py-1"
                                    >Unit: {{ product.unit }}</span
                                  >
                                  <span
                                    class="rounded-lg bg-slate-100 px-2 py-1"
                                    >Qty: {{ product.quantity }}</span
                                  >
                                  <span
                                    class="rounded-lg bg-blue-50 px-2 py-1 text-blue-700"
                                    >RM {{ product.price }}</span
                                  >
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
                            inputStyleClass="w-full text-right bg-slate-50 font-semibold"
                          />
                        </td>
                      </ng-container>

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

                      <ng-container
                        *ngIf="row.get('rowType')?.value === 'NoteRow'"
                      >
                        <td>
                          <input
                            pInputText
                            type="text"
                            formControlName="item"
                            class="w-full text-center!"
                          />
                        </td>
                        <td colspan="6">
                          <textarea
                            pTextarea
                            formControlName="description"
                            rows="3"
                            [autoResize]="true"
                            class="w-full"
                          ></textarea>
                        </td>
                      </ng-container>

                      <td>
                        <div class="flex items-center justify-center gap-1">
                          <!-- Move Up -->
                          <p-button
                            icon="pi pi-arrow-up"
                            [text]="true"
                            severity="secondary"
                            [disabled]="rowIndex === 0"
                            pTooltip="Move Up"
                            (onClick)="moveItem(rowIndex, -1)"
                          />

                          <!-- Move Down -->
                          <p-button
                            icon="pi pi-arrow-down"
                            [text]="true"
                            severity="secondary"
                            [disabled]="rowIndex === Items.length - 1"
                            pTooltip="Move Down"
                            (onClick)="moveItem(rowIndex, 1)"
                          />

                          <!-- Save -->
                          <p-button
                            icon="pi pi-check"
                            [text]="true"
                            severity="success"
                            (onClick)="row.get('isEdit')?.setValue(false)"
                          />

                          <!-- Delete -->
                          <p-button
                            icon="pi pi-trash"
                            [text]="true"
                            severity="danger"
                            (onClick)="removeItem(rowIndex)"
                          />
                        </div>
                      </td>
                    </ng-container>

                    <ng-template #viewMode>
                      <ng-container [ngSwitch]="row.get('rowType')?.value">
                        <ng-container *ngSwitchCase="'LineItem'">
                          <td class="text-center!">
                            {{ row.get('item')?.value }}
                          </td>
                          <td>
                            <div
                              [innerHTML]="row.get('description')?.value"
                            ></div>
                          </td>
                          <td class="text-center!">
                            {{ row.get('unit')?.value }}
                          </td>
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

                        <ng-container *ngSwitchCase="'CategoryHeader'">
                          <td
                            colspan="7"
                            class="pl-12! font-bold text-slate-800"
                          >
                            {{ row.get('description')?.value }}
                          </td>
                        </ng-container>

                        <ng-container *ngSwitchCase="'NoteRow'">
                          <td class="text-center!">
                            {{ row.get('item')?.value }}
                          </td>
                          <td colspan="6" class="text-slate-600">
                            {{ row.get('description')?.value }}
                          </td>
                        </ng-container>
                      </ng-container>

                      <td>
                        <div class="flex items-center justify-center gap-1">
                          <p-button
                            icon="pi pi-arrow-up"
                            [text]="true"
                            severity="secondary"
                            [disabled]="rowIndex === 0"
                            pTooltip="Move Up"
                            (onClick)="moveItem(rowIndex, -1)"
                          />

                          <p-button
                            icon="pi pi-arrow-down"
                            [text]="true"
                            severity="secondary"
                            [disabled]="rowIndex === Items.length - 1"
                            pTooltip="Move Down"
                            (onClick)="moveItem(rowIndex, 1)"
                          />

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
                    <td colspan="6" class="text-right! font-medium">
                      Subtotal (RM)
                    </td>
                    <td class="text-right! font-semibold">
                      {{ subTotal() | number: '1.2-2' }}
                    </td>
                    <td></td>
                  </tr>

                  <tr>
                    <td colspan="6" class="text-right! font-medium">
                      Discount (RM)
                    </td>
                    <td>
                      <p-inputNumber
                        formControlName="discount"
                        mode="decimal"
                        [min]="0"
                        [minFractionDigits]="2"
                        [maxFractionDigits]="2"
                        styleClass="w-full"
                        inputStyleClass="w-full text-right!"
                        (onInput)="calculateTotal()"
                      ></p-inputNumber>
                    </td>
                    <td></td>
                  </tr>

                  <tr>
                    <td colspan="6" class="text-right! font-bold text-base">
                      Total Amount (RM)
                    </td>
                    <td class="text-right! font-bold text-blue-700 text-lg">
                      {{ totalAmount() | number: '1.2-2' }}
                    </td>
                    <td></td>
                  </tr>
                </ng-template>

                <ng-template #emptymessage>
                  <tr>
                    <td colspan="8">
                      <div
                        class="flex flex-col items-center justify-center py-12 text-center"
                      >
                        <div
                          class="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"
                        >
                          <i class="pi pi-box text-2xl"></i>
                        </div>
                        <p class="mt-3 font-semibold text-slate-700">
                          No quotation items yet
                        </p>
                        <p class="mt-1 text-xs text-slate-400">
                          Add your first product or service to get started.
                        </p>
                      </div>
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            </div>
          </section>

          <!-- TERMS AND CONDITIONS -->
          <section
            class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div
              class="flex items-center gap-3 border-b border-slate-100 px-5 py-5 sm:px-7"
            >
              <div
                class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"
              >
                <i class="pi pi-file"></i>
              </div>
              <div>
                <h2 class="font-bold text-slate-900">Terms & Conditions</h2>
                <p class="text-sm text-slate-500">
                  Configure payment terms and quotation validity.
                </p>
              </div>
            </div>

            <div class="space-y-5 p-5 sm:p-7">
              <div
                class="grid grid-cols-1 gap-3 sm:grid-cols-[180px_1fr] sm:items-center"
              >
                <label class="font-semibold text-slate-700"
                  >Payment Terms</label
                >
                <input
                  formControlName="paymentTerms"
                  pInputText
                  class="w-full"
                  placeholder="e.g. Net 30 days"
                />
              </div>

              <div
                class="grid grid-cols-1 gap-3 sm:grid-cols-[180px_1fr] sm:items-center"
              >
                <label class="font-semibold text-slate-700"
                  >Quotation Validity</label
                >

                <div class="flex flex-wrap items-center gap-3">
                  <div class="flex items-center gap-2">
                    <p-checkbox
                      binary="true"
                      formControlName="noValidity"
                      inputId="noValidity"
                    />
                    <label for="noValidity" class="text-sm text-slate-600"
                      >No expiry</label
                    >
                  </div>

                  <span class="hidden text-slate-300 sm:inline">|</span>

                  <p-inputnumber
                    formControlName="validity"
                    [disabled]="FG.get('noValidity')?.value"
                    inputStyleClass="w-24!"
                  />

                  <p-select
                    formControlName="validityType"
                    appendTo="body"
                    [options]="[
                      { label: 'Days', value: 'days' },
                      { label: 'Months', value: 'months' },
                      { label: 'Years', value: 'years' },
                    ]"
                    styleClass="w-fit!"
                    class="w-fit!"
                    [disabled]="FG.get('noValidity')?.value"
                  />
                </div>
              </div>

              <div class="border-t border-slate-100"></div>

              <!-- SELECTED TERMS -->
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="font-bold text-slate-800">Additional Terms</h3>
                    <p class="text-sm text-slate-500">
                      Add reusable conditions to this quotation.
                    </p>
                  </div>
                  <span
                    class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
                  >
                    {{ selectedTerms.length }} selected
                  </span>
                </div>

                <div
                  *ngFor="let term of selectedTerms; let i = index"
                  class="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div class="min-w-0">
                    <p class="text-sm font-bold text-slate-800">
                      {{ term.title }}
                    </p>
                    <p
                      class="mt-1 break-words text-sm leading-relaxed text-slate-600"
                    >
                      {{ term.description }}
                    </p>
                  </div>

                  <p-button
                    icon="pi pi-times"
                    [text]="true"
                    severity="danger"
                    (onClick)="removeSelectedTerm(i)"
                  />
                </div>
              </div>

              <!-- ADD TERM -->
              <div
                class="relative overflow-visible rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 sm:p-5"
              >
                <h3 class="mb-4 text-sm font-bold text-slate-800">
                  Add a Term
                </h3>

                <div
                  class="grid grid-cols-1 gap-3 overflow-visible lg:grid-cols-[220px_1fr_auto]"
                >
                  <div class="relative">
                    <input
                      pInputText
                      cdkOverlayOrigin
                      #titleOrigin="cdkOverlayOrigin"
                      [ngModel]="title()"
                      (ngModelChange)="
                        title.set($event);
                        selectedExistingTerm.set(null);
                        activeField.set('title')
                      "
                      (focus)="activeField.set('title')"
                      [ngModelOptions]="{ standalone: true }"
                      class="w-full"
                      placeholder="Term title"
                    />

                    <ng-template
                      cdkConnectedOverlay
                      [cdkConnectedOverlayOrigin]="titleOrigin"
                      [cdkConnectedOverlayOpen]="
                        activeField() === 'title' && filteredTerms().length > 0
                      "
                      [cdkConnectedOverlayWidth]="
                        titleOrigin.elementRef.nativeElement.offsetWidth
                      "
                      [cdkConnectedOverlayHasBackdrop]="false"
                      [cdkConnectedOverlayPush]="true"
                    >
                      <div
                        class="mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl"
                      >
                        <div
                          *ngFor="let term of filteredTerms()"
                          class="cursor-pointer p-3 text-sm hover:bg-blue-50"
                          (click)="SelectTerm(term)"
                        >
                          <div class="font-medium">{{ term.title }}</div>
                          <div class="mt-1 text-xs text-gray-500">
                            {{ term.description }}
                          </div>
                        </div>
                      </div>
                    </ng-template>
                  </div>

                  <!-- Description -->
                  <div class="relative">
                    <input
                      pInputText
                      cdkOverlayOrigin
                      #descriptionOrigin="cdkOverlayOrigin"
                      [ngModel]="description()"
                      (ngModelChange)="
                        description.set($event);
                        selectedExistingTerm.set(null);
                        activeField.set('description')
                      "
                      (focus)="activeField.set('description')"
                      [ngModelOptions]="{ standalone: true }"
                      class="w-full"
                      placeholder="Enter term description"
                    />

                    <ng-template
                      cdkConnectedOverlay
                      [cdkConnectedOverlayOrigin]="descriptionOrigin"
                      [cdkConnectedOverlayOpen]="
                        activeField() === 'description' &&
                        filteredTerms().length > 0
                      "
                      [cdkConnectedOverlayWidth]="
                        descriptionOrigin.elementRef.nativeElement.offsetWidth
                      "
                      [cdkConnectedOverlayHasBackdrop]="false"
                      [cdkConnectedOverlayPush]="true"
                    >
                      <div
                        class="mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl"
                      >
                        <div
                          *ngFor="let term of filteredTerms()"
                          class="cursor-pointer p-3 text-sm hover:bg-blue-50"
                          (click)="SelectTerm(term)"
                        >
                          <div class="font-medium">{{ term.description }}</div>
                          <div class="mt-1 text-xs text-gray-500">
                            {{ term.title }}
                          </div>
                        </div>
                      </div>
                    </ng-template>
                  </div>

                  <!-- Add Term -->
                  <p-button
                    label="Add Term"
                    icon="pi pi-plus"
                    severity="info"
                    (onClick)="addInlineTerm()"
                    styleClass="!bg-blue-600 !border-blue-600"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
    <!-- ADD COMPANY / CLIENT DIALOG -->
    <p-dialog
      [(visible)]="visible"
      [modal]="true"
      [closable]="true"
      [draggable]="false"
      styleClass="quotation-company-dialog rounded-2xl overflow-hidden shadow-2xl border-none!"
      [maskStyle]="{
        'overflow-y': 'auto',
        'background-color': 'rgba(15, 23, 42, 0.5)',
        'backdrop-filter': 'blur(8px)',
      }"
      appendTo="body"
    >
      <ng-template #headless>
        <!-- DIALOG HEADER -->
        <div
          class="bg-gray-100 px-4 py-4 sm:px-6 lg:px-8 relative overflow-hidden border-b border-gray-200"
        >
          <div
            class="absolute inset-0 bg-grid-white/[0.05] bg-[length:20px_20px]"
          ></div>

          <div class="relative flex justify-between items-start gap-3">
            <div class="flex items-center gap-3 sm:gap-4 min-w-0">
              <div
                class="w-11 h-11 sm:w-14 sm:h-14 shrink-0 rounded-xl bg-white/70 border border-gray-200 flex items-center justify-center"
              >
                <i class="pi pi-building text-xl sm:text-2xl text-blue-600"></i>
              </div>

              <div class="min-w-0">
                <h2
                  class="text-xl sm:text-2xl font-bold tracking-tight m-0 text-slate-900"
                >
                  {{
                    mode === 'company' ? 'Add New Company' : 'Add New Client'
                  }}
                </h2>

                <p
                  class="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed"
                >
                  Complete the form below to create a new
                  {{ mode === 'company' ? 'company' : 'client' }} record.
                </p>
              </div>
            </div>

            <p-button
              icon="pi pi-times"
              [rounded]="true"
              [text]="true"
              severity="secondary"
              styleClass="shrink-0"
              (onClick)="visible = false"
            />
          </div>
        </div>

        <!-- DIALOG CONTENT -->
        <div
          class="quotation-company-dialog-content max-h-[calc(100dvh-150px)] sm:max-h-[70vh] overflow-y-auto bg-slate-50"
        >
          <div
            [formGroup]="companyForm"
            class="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-8"
          >
            <!-- BASIC INFORMATION -->
            <div
              class="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 space-y-5"
            >
              <div
                class="flex items-center gap-2.5 pb-3 border-b border-slate-100"
              >
                <i class="pi pi-briefcase text-blue-600"></i>
                <h3 class="font-bold text-slate-900 text-base">
                  Basic Information
                </h3>
              </div>

              <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
                <div class="lg:col-span-2 space-y-2">
                  <label class="text-sm font-semibold text-slate-700">
                    Company Name <span class="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    pInputText
                    class="w-full"
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
                    class="w-full"
                    formControlName="acNo"
                    placeholder="ACC-2026-89"
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                <div class="space-y-2">
                  <label class="text-sm font-semibold text-slate-700"
                    >Email Address</label
                  >
                  <input
                    type="email"
                    pInputText
                    class="w-full"
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
                    class="w-full"
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
                    class="w-full"
                    formControlName="faxNo"
                    placeholder="+60 3-XXXX XXXX"
                  />
                </div>
              </div>
            </div>

            <!-- CONTACT PEOPLE -->
            <div
              class="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 space-y-5"
            >
              <div
                class="flex items-center gap-2.5 pb-3 border-b border-slate-100"
              >
                <i class="pi pi-users text-blue-600"></i>
                <h3 class="font-bold text-slate-900 text-base">
                  Contact People
                </h3>
              </div>

              <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                <div
                  class="bg-blue-50/50 rounded-xl border border-blue-200 p-4 sm:p-5 space-y-2"
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
                    class="w-full"
                    formControlName="primaryContactPerson"
                    placeholder="e.g. Mr. John Doe"
                  />
                </div>

                <div
                  class="bg-slate-50 rounded-xl border border-slate-200 p-4 sm:p-5 space-y-2"
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
                    class="w-full"
                    formControlName="secondaryContactPerson"
                    placeholder="e.g. Ms. Jane Doe"
                  />
                </div>
              </div>
            </div>

            <!-- BILLING ADDRESS -->
            <div
              class="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 space-y-5"
              formGroupName="billingAddress"
            >
              <div
                class="flex items-center gap-2.5 pb-3 border-b border-slate-100"
              >
                <i class="pi pi-credit-card text-blue-600"></i>
                <h3 class="font-bold text-slate-900 text-base">
                  Billing Address
                </h3>
              </div>

              <div class="grid grid-cols-1 gap-4 sm:gap-5">
                <div class="space-y-2">
                  <label class="text-sm font-semibold text-slate-700"
                    >Address Line 1</label
                  >
                  <input
                    pInputText
                    formControlName="addressLine1"
                    class="w-full"
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
                    class="w-full"
                    placeholder="Street name or neighborhood"
                  />
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                  <div class="space-y-2">
                    <label class="text-sm font-semibold text-slate-700"
                      >City</label
                    >
                    <input pInputText formControlName="city" class="w-full" />
                  </div>

                  <div class="space-y-2">
                    <label class="text-sm font-semibold text-slate-700"
                      >Postcode / ZIP</label
                    >
                    <input
                      pInputText
                      formControlName="postcode"
                      class="w-full"
                    />
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                  <div class="space-y-2">
                    <label class="text-sm font-semibold text-slate-700"
                      >State</label
                    >
                    <input pInputText formControlName="state" class="w-full" />
                  </div>

                  <div class="space-y-2">
                    <label class="text-sm font-semibold text-slate-700"
                      >Country</label
                    >
                    <input
                      pInputText
                      formControlName="country"
                      class="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- SHIPPING ADDRESS -->
            <div
              class="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 space-y-5"
            >
              <div
                class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100"
              >
                <div class="flex items-center gap-2.5">
                  <i class="pi pi-truck text-blue-600"></i>
                  <h3 class="font-bold text-slate-900 text-base">
                    Shipping Address
                  </h3>
                </div>

                <label
                  class="flex items-center gap-3 bg-slate-100 px-3 sm:px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-200/60 cursor-pointer transition-all"
                >
                  <input
                    type="checkbox"
                    formControlName="sameAsBilling"
                    id="sameAsBilling"
                    class="cursor-pointer w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span
                    class="cursor-pointer font-semibold text-slate-700 text-sm select-none"
                  >
                    Same as Billing
                  </span>
                </label>
              </div>

              <div
                *ngIf="!companyForm.get('sameAsBilling')?.value"
                formGroupName="deliveryAddress"
                class="grid grid-cols-1 gap-4 sm:gap-5 animate-fadeIn"
              >
                <div class="space-y-2">
                  <label class="text-sm font-semibold text-slate-700"
                    >Address Line 1</label
                  >
                  <input
                    pInputText
                    formControlName="addressLine1"
                    class="w-full"
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
                    class="w-full"
                    placeholder="Street name or neighborhood"
                  />
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                  <div class="space-y-2">
                    <label class="text-sm font-semibold text-slate-700"
                      >City</label
                    >
                    <input pInputText formControlName="city" class="w-full" />
                  </div>

                  <div class="space-y-2">
                    <label class="text-sm font-semibold text-slate-700"
                      >Postcode / ZIP</label
                    >
                    <input
                      pInputText
                      formControlName="postcode"
                      class="w-full"
                    />
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                  <div class="space-y-2">
                    <label class="text-sm font-semibold text-slate-700"
                      >State</label
                    >
                    <input pInputText formControlName="state" class="w-full" />
                  </div>

                  <div class="space-y-2">
                    <label class="text-sm font-semibold text-slate-700"
                      >Country</label
                    >
                    <input
                      pInputText
                      formControlName="country"
                      class="w-full"
                    />
                  </div>
                </div>
              </div>

              <div
                class="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3 animate-fadeIn"
                *ngIf="companyForm.get('sameAsBilling')?.value"
              >
                <i class="pi pi-info-circle text-blue-600 text-lg mt-0.5"></i>
                <span class="text-sm font-medium text-blue-900">
                  Delivery address will automatically match the billing address.
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- DIALOG FOOTER -->
        <div
          class="bg-slate-100 border-t border-slate-200 px-4 sm:px-6 lg:px-8 py-3 flex flex-col-reverse sm:flex-row justify-end items-stretch sm:items-center gap-2 sm:gap-3"
        >
          <p-button
            (onClick)="visible = false"
            label="Cancel"
            severity="secondary"
            styleClass="w-full sm:w-auto px-6! py-2.5 border! border-slate-300! bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl"
          />

          <p-button
            (onClick)="SaveCompany()"
            [label]="'Save ' + (mode === 'company' ? 'Company' : 'Client')"
            severity="info"
            [disabled]="companyForm.invalid"
            styleClass="w-full sm:w-auto px-6! py-2.5 bg-blue-600! hover:bg-blue-700! disabled:bg-slate-300! border-0 text-white font-semibold shadow-lg shadow-blue-500/20 rounded-xl"
          />
        </div>
      </ng-template>
    </p-dialog>

    <p-dialog
      header="Save as Template"
      [(visible)]="showTemplateDialog"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [closable]="!savingTemplate"
      [dismissableMask]="!savingTemplate"
      [style]="{ width: '450px', maxWidth: '95vw' }"
      styleClass="rounded-xl"
    >
      <div class="flex flex-col gap-4">
        <div>
          <label class="mb-2 block text-sm font-semibold text-slate-700">
            Template Name <span class="text-red-500">*</span>
          </label>

          <input
            pInputText
            [(ngModel)]="templateName"
            [ngModelOptions]="{ standalone: true }"
            placeholder="Enter quotation template name"
            class="w-full"
            [disabled]="savingTemplate"
            (keydown.enter)="ConfirmSaveAsTemplate()"
          />

          <small class="mt-1 block text-slate-500">
            Save this quotation's details as a reusable template.
          </small>
        </div>
      </div>

      <ng-template pTemplate="footer">
        <div class="flex justify-end gap-2">
          <p-button
            label="Cancel"
            severity="secondary"
            [outlined]="true"
            [disabled]="savingTemplate"
            (onClick)="showTemplateDialog = false"
          />

          <p-button
            label="Save Template"
            icon="pi pi-save"
            [loading]="savingTemplate"
            [disabled]="!templateName.trim()"
            (onClick)="ConfirmSaveAsTemplate()"
            styleClass="!bg-blue-600 !border-blue-600"
          />
        </div>
      </ng-template>
    </p-dialog>
  `,
  styleUrl: './quotation-form.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuotationForm implements OnInit, OnDestroy {
  private readonly termsAndConditionService = inject(TermsAndConditionService);
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
  quotationStatus: string | null = null;

  activeField = signal<'title' | 'description' | null>(null);
  title = signal('');
  description = signal('');

  visible: boolean = false;
  clientDialog: boolean = false;
  companyDialog: boolean = false;
  showNewPaymentTermInput: boolean = false;
  showProductForm: boolean = false;
  showTemplateDialog: boolean = false;
  savingTemplate: boolean = false;

  templateName: string = '';

  selectedExistingTerm = signal<any | null>(null);

  dragIndex: number | null = null;
  today = new Date();
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

  // ==========================================
  // QUOTATION TEMPLATES
  // ==========================================

  quotationTemplates: any[] = [];
  selectedTemplateId: string | null = null;
  loadingTemplates: boolean = false;

  ngOnInit(): void {
    this.currentId = this.activatedRoute.snapshot.queryParams['id'];

    this.getDropdown();
    this.LoadQuotationTemplates();
    this.initForm();

    if (!this.currentId) {
      this.generateQuotationNo();
    } else {
      this.LoadForm();
    }
  }

  // ==========================================
  // LOAD QUOTATION TEMPLATES
  // ==========================================

  LoadQuotationTemplates(): void {
    this.loadingTemplates = true;

    this.quotationService
      .GetTemplates()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res: any) => {
          this.quotationTemplates = res?.data ?? res?.templates ?? res ?? [];

          this.loadingTemplates = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Failed to load quotation templates:', err);

          this.loadingTemplates = false;
          this.cdr.markForCheck();
        },
      });
  }

  // ==========================================
  // SELECT QUOTATION TEMPLATE
  // ==========================================

  onQuotationTemplateChange(templateId: string | null): void {
    if (!templateId) {
      this.selectedTemplateId = null;
      return;
    }

    this.loadingService.start();

    this.quotationService
      .GetTemplate(templateId)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res: any) => {
          this.loadingService.stop();

          const template = res?.template ?? res?.data ?? res;

          if (!template) {
            this.messageService.add({
              severity: 'error',
              summary: 'Template Not Found',
              detail: 'Unable to load the selected quotation template.',
            });
            return;
          }

          this.ApplyQuotationTemplate(template);

          this.messageService.add({
            severity: 'success',
            summary: 'Template Applied',
            detail: `${template.name} has been applied to this quotation.`,
          });

          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loadingService.stop();

          console.error('Failed to load quotation template:', err);

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail:
              err?.error?.Error ||
              'Unable to load the selected quotation template.',
          });
        },
      });
  }

  // ==========================================
  // APPLY QUOTATION TEMPLATE
  // ==========================================

  ApplyQuotationTemplate(template: any): void {
    if (!template) return;

    // ----------------------------------------
    // 1. PATCH BASIC QUOTATION INFORMATION
    // ----------------------------------------
    this.FG.patchValue(
      {
        fromCompanyId: template.fromCompanyId ?? null,
        subject: template.subject ?? '',
        discount: Number(template.discount) || 0,
        paymentTerms: template.paymentTerms ?? '',
        noValidity: template.noValidity ?? false,
        validity: template.noValidity ? null : (template.validity ?? null),
        validityType: template.validityType ?? 'Days',
      },
      { emitEvent: false },
    );

    // ----------------------------------------
    // 2. UPDATE SELECTED COMPANY
    // ----------------------------------------

    this.selectedCompany =
      this.companySignal().data?.find(
        (company: any) => company.id === template.fromCompanyId,
      ) ?? null;

    // Do not change selectedClient or clientId.
    // The template does not determine the quotation recipient.

    // ----------------------------------------
    // 3. REPLACE QUOTATION ITEMS
    // ----------------------------------------

    this.Items.clear();

    const templateItems = [...(template.items ?? [])].sort(
      (a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
    );

    templateItems.forEach((item: any) => {
      const group = this.createItemGroup({
        // Do not reuse the template item's database ID.
        id: null,

        rowType: item.rowType ?? 'LineItem',
        productServiceId: item.productServiceId ?? null,
        item: item.item ?? null,
        description: denormalizeHtml(item.description ?? ''),
        quantity: item.quantity ?? null,
        unit: item.unit ?? null,
        unitPrice: item.unitPrice ?? null,
        discount: item.discount ?? 0,
        totalPrice: item.totalPrice ?? 0,
      });

      // Recalculate line item total using the quotation formula.
      if (item.rowType === 'LineItem') {
        const quantity = Number(item.quantity) || 0;
        const unitPrice = Number(item.unitPrice) || 0;
        const discount = Number(item.discount) || 0;

        group.patchValue(
          {
            totalPrice: quantity * unitPrice * (1 - discount / 100),
            isEdit: false,
          },
          { emitEvent: false },
        );
      }

      this.Items.push(group);
    });

    // ----------------------------------------
    // 4. REPLACE ADDITIONAL TERMS
    // ----------------------------------------

    this.selectedTerms = (template.termsAndConditions ?? template.terms ?? [])
      .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((term: any, index: number) => ({
        // Template term's ID is the reusable
        // TermsAndCondition ID, if available.
        id: term.termsAndConditionId ?? term.id ?? null,

        title: term.title ?? '',
        description: term.description ?? '',
        sortOrder: index + 1,
      }));

    this.syncTermsToForm();

    // ----------------------------------------
    // 5. RECALCULATE FINANCIAL TOTALS
    // ----------------------------------------

    this.calculateTotal();

    this.FG.updateValueAndValidity();

    this.cdr.markForCheck();
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
            this.quotationStatus = res.status;
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

                const qty = Number(item.quantity) || 0;
                const price = Number(item.unitPrice) || 0;
                const discount = Number(item.discount) || 0;

                group.patchValue(
                  {
                    totalPrice: qty * price * (1 - discount / 100),
                  },
                  { emitEvent: false },
                );

                this.Items.push(group);
              });

            if (res.termsAndConditions) {
              this.selectedTerms = res.termsAndConditions.map((x: any) => ({
                ...x,
                sortOrder: x.sortOrder,
              }));

              this.syncTermsToForm();
            }

            this.calculateTotal();

            this.otherInfo.clear();

            (res.otherInformations || []).forEach((item: any) => {
              this.otherInfo.push(
                this.fb.group({
                  field: [item.key || ''],
                  value: [item.value || ''],
                }),
              );
            });
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
      sortOrder: new FormControl(data?.sortOrder ?? 0),

      productServiceId: new FormControl<string | null>(
        data?.productServiceId ?? null,
      ),
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
            const loadedTerms = (res.termsAndConditions || [])
              .map((item: any) => ({
                ...item.termsAndCondition,
                sortOrder: item.sortOrder,
              }))
              .filter((term: any) => !!term.id);

            this.selectedTerms = loadedTerms;

            this.FG.patchValue({
              ...res,
              quotationDate: new Date(res.quotationDate),
              termsAndConditions: loadedTerms.map(
                (term: any, index: number) => ({
                  id: term.id,
                  title: term.title,
                  description: term.description,
                  sortOrder: index + 1,
                }),
              ),
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

    return items.map((x: any, index: number) => {
      const isLineItem = x.rowType === 'LineItem';

      const quantity = Number(x.quantity) || 0;
      const unitPrice = Number(x.unitPrice) || 0;
      const discount = Number(x.discount) || 0;

      return {
        id: x.id || null,
        productServiceId: x.productServiceId || null,
        rowType: x.rowType,
        item: x.item,
        description: normalizeHtml(x.description || ''),
        quantity: isLineItem ? quantity : null,
        unit: x.unit,
        unitPrice: isLineItem ? unitPrice : null,
        discount: isLineItem ? discount : 0,
        totalPrice: isLineItem
          ? quantity * unitPrice * (1 - discount / 100)
          : 0,
        sortOrder: index,
      };
    });
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
      primaryContactPerson: new FormControl<string | null>(null),
      secondaryContactPerson: new FormControl<string | null>(null),
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
    if (this.FG.invalid) {
      ValidateAllFormFields(this.FG);
      return;
    }

    this.loadingService.start();

    const payload: any = {
      ...this.buildQuotationPayload(),
    };

    if (this.currentId) {
      payload.id = this.currentId;
    }

    const request$ = this.currentId
      ? this.quotationService.Update(payload)
      : this.quotationService.Create(payload);

    request$.pipe(takeUntil(this.ngUnsubscribe)).subscribe({
      next: (res) => {
        this.loadingService.stop();

        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `${res.quotationNo} has been successfully ${
            this.currentId ? 'updated' : 'added'
          }`,
        });

        this.router.navigate(['/quotations']);
      },
      error: (err) => {
        this.loadingService.stop();
        console.error('Payload submission error:', err);
      },
    });
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
          x.primaryContactPerson?.toLowerCase().includes(keyword) ||
          x.secondaryContactPerson?.toLowerCase().includes(keyword),
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
          x.primaryContactPerson?.toLowerCase().includes(keyword) ||
          x.secondaryContactPerson?.toLowerCase().includes(keyword),
      ) ?? []
    );
  });

  SelectTerm(term: any): void {
    if (!term) return;

    this.selectedExistingTerm.set(term);
    this.title.set(term.title ?? '');
    this.description.set(term.description ?? '');
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
        next: (results: any[]) => {
          const validResults = (results || []).filter((term: any) => !!term.id);

          const current = this.termsAndConditionSignal().data || [];

          this.termsAndConditionSignal.set({
            ...this.termsAndConditionSignal(),
            data: [...current, ...validResults],
          });

          this.selectedTerms = [
            ...this.selectedTerms,
            ...validResults.map((term: any, index: number) => ({
              ...term,
              sortOrder: this.selectedTerms.length + index + 1,
            })),
          ];

          this.syncTermsToForm();

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
      const code = (p.itemCode || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();
      const type = (p.type || '').toLowerCase();
      const q = keyword.toLowerCase();

      return code.includes(q) || desc.includes(q) || type.includes(q);
    });
  }

  insertProduct(product: any, row: any, rowIndex: number) {
    const editor = this.editorInstances[rowIndex];
    if (!editor) return;

    const html = product.description || '';

    editor.insertText(editor.getLength(), '\n');
    editor.clipboard.dangerouslyPasteHTML(editor.getLength(), html);

    row.patchValue({
      productServiceId: product.id,
      item: product.itemCode || product.description,
      unit: product.unit,
      unitPrice: product.price,
      quantity: product.quantity,
      description: editor.root.innerHTML,
    });
    this.recalculateRow(row);
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

    // Check whether an existing term was selected.
    const existingTerm = this.selectedExistingTerm();

    if (existingTerm?.id) {
      const alreadyAdded = this.selectedTerms.some(
        (term: any) => term.id === existingTerm.id,
      );

      if (alreadyAdded) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Duplicate Term',
          detail: 'This term has already been added.',
        });
        return;
      }

      this.selectedTerms = [
        ...this.selectedTerms,
        {
          ...existingTerm,
          sortOrder: this.selectedTerms.length + 1,
        },
      ];

      this.syncTermsToForm();

      this.title.set('');
      this.description.set('');
      this.selectedExistingTerm.set(null);
      this.activeField.set(null);

      this.cdr.markForCheck();
      return;
    }

    // Otherwise, create a new term.
    const duplicate = this.selectedTerms.some(
      (term: any) => (term.title || '').toLowerCase() === title.toLowerCase(),
    );

    if (duplicate) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Duplicate Term',
        detail: 'This term has already been added.',
      });
      return;
    }

    this.loadingService.start();

    this.termsAndConditionService
      .CreateBulk({
        items: [{ title, description }],
      })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (results: any[]) => {
          const newTerm = results?.[0];

          if (!newTerm?.id) {
            this.loadingService.stop();
            return;
          }

          // Add to available terms.
          const current = this.termsAndConditionSignal().data || [];

          this.termsAndConditionSignal.set({
            ...this.termsAndConditionSignal(),
            data: [...current, newTerm],
          });

          // Add to quotation.
          this.selectedTerms = [
            ...this.selectedTerms,
            {
              ...newTerm,
              sortOrder: this.selectedTerms.length + 1,
            },
          ];

          this.syncTermsToForm();

          this.title.set('');
          this.description.set('');
          this.selectedExistingTerm.set(null);
          this.activeField.set(null);

          this.loadingService.stop();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Failed to create term:', err);
          this.loadingService.stop();
        },
      });
  }

  syncTermsToForm() {
    this.FG.patchValue({
      termsAndConditions: this.selectedTerms.map(
        (term: any, index: number) => ({
          id: term.id ?? null,
          title: term.title,
          description: term.description,
          sortOrder: index + 1,
        }),
      ),
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
    this.syncTermsToForm();
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
    this.selectedTerms.forEach((term: any, index: number) => {
      term.sortOrder = index + 1;
    });
  }

  // ==========================================
  // SAVE QUOTATION HELPER
  // ==========================================

  private saveQuotation(): Observable<QuotationDto> {
    const payload: any = {
      ...this.buildQuotationPayload(),
    };

    if (this.currentId) {
      payload.id = this.currentId;
      return this.quotationService.Update(payload);
    }

    return this.quotationService.Create(payload);
  }

  // ==========================================
  // SAVE DRAFT
  // ==========================================

  SaveDraft(): void {
    if (this.FG.invalid) {
      this.FG.markAllAsTouched();
      return;
    }

    this.loadingService.start();

    this.saveQuotation()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res: any) => {
          this.loadingService.stop();

          if (res?.id) {
            this.currentId = res.id;
          }

          this.messageService.add({
            severity: 'success',
            summary: 'Saved Successfully',
            detail: 'Quotation has been saved successfully.',
          });

          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Save quotation error:', err);
          this.loadingService.stop();

          this.messageService.add({
            severity: 'error',
            summary: 'Save Failed',
            detail: err?.error?.Error || 'Unable to save quotation.',
          });
        },
      });
  }

  // ==========================================
  // SAVE AS TEMPLATE
  // ==========================================

  SaveAsTemplate(): void {
    if (this.FG.invalid) {
      this.FG.markAllAsTouched();
      return;
    }

    this.templateName = '';
    this.showTemplateDialog = true;
  }

  ConfirmSaveAsTemplate(): void {
    const name = this.templateName.trim();

    if (!name) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Required',
        detail: 'Please enter a template name.',
      });
      return;
    }

    this.savingTemplate = true;
    this.loadingService.start();

    // Save quotation first, then save it as a template.
    this.saveQuotation()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res: QuotationDto) => {
          const quotationId = res?.id ?? this.currentId;

          if (!quotationId) {
            this.savingTemplate = false;
            this.loadingService.stop();

            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Unable to retrieve quotation ID.',
            });

            return;
          }

          this.currentId = quotationId;

          const request: SaveQuotationAsTemplateRequest = {
            name,
            description: '',
          };

          this.quotationService
            .SaveAsTemplate(quotationId, request)
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe({
              next: (result) => {
                this.savingTemplate = false;
                this.loadingService.stop();
                this.showTemplateDialog = false;

                this.messageService.add({
                  severity: 'success',
                  summary: 'Template Saved',
                  detail:
                    result?.message || 'Quotation template saved successfully.',
                });

                this.templateName = '';
                this.cdr.markForCheck();
              },

              error: (err) => {
                console.error('Save template error:', err);

                this.savingTemplate = false;
                this.loadingService.stop();

                this.messageService.add({
                  severity: 'error',
                  summary: 'Template Failed',
                  detail:
                    err?.error?.Error ||
                    err?.error?.error ||
                    'Unable to save quotation template.',
                });
              },
            });
        },

        error: (err) => {
          console.error('Save before template error:', err);

          this.savingTemplate = false;
          this.loadingService.stop();

          this.messageService.add({
            severity: 'error',
            summary: 'Save Failed',
            detail:
              err?.error?.Error ||
              'Unable to save quotation before creating template.',
          });
        },
      });
  }

  private buildQuotationPayload() {
    const formValues = this.FG.getRawValue();

    const otherInformations = this.otherInfo
      .getRawValue()
      .map((item: any, index: number) => ({
        key: item.field,
        value: item.value,
        sortOrder: index,
      }));

    return {
      ...formValues,

      quotationItems: this.buildQuotationItemsPayload(),

      termsAndConditions: this.selectedTerms.map(
        (term: any, index: number) => ({
          id: term.id ?? null,
          title: term.title,
          description: term.description,
          sortOrder: index + 1,
        }),
      ),

      otherInformations,
    };
  }

  removeProductService(index: number) {
    this.Items.removeAt(index);
  }

  dropItem(event: CdkDragDrop<any[]>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    moveItemInArray(
      this.Items.controls,
      event.previousIndex,
      event.currentIndex,
    );

    this.Items.updateValueAndValidity();
    this.calculateTotal();
    this.cdr.markForCheck();
  }

  moveItem(currentIndex: number, direction: -1 | 1): void {
    const newIndex = currentIndex + direction;

    // Check valid position
    if (
      currentIndex < 0 ||
      currentIndex >= this.Items.length ||
      newIndex < 0 ||
      newIndex >= this.Items.length
    ) {
      return;
    }

    // Get the existing FormGroup
    const currentItem = this.Items.at(currentIndex);

    // Move the row
    this.Items.removeAt(currentIndex, { emitEvent: false });
    this.Items.insert(newIndex, currentItem, { emitEvent: false });

    // Update sort order
    this.Items.controls.forEach((control, index) => {
      control.get('sortOrder')?.setValue(index + 1, {
        emitEvent: false,
      });
    });

    this.Items.updateValueAndValidity();

    this.calculateTotal();
    this.cdr.markForCheck();
  }

  getLineItemCount(): number {
    return this.Items.controls.filter(
      (item) => item.get('rowType')?.value === 'LineItem',
    ).length;
  }


  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
