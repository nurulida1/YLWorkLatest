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
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { EditorModule } from 'primeng/editor';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { PurchaseOrderService } from '../../../services/purchaseOrderService';
import { LoadingService } from '../../../services/loading.service';
import { forkJoin, of, Subject, takeUntil } from 'rxjs';
import { ValidateAllFormFields } from '../../../shared/helpers/helpers';
import { UserService } from '../../../services/userService.service';
import { ProjectService } from '../../../services/ProjectService';
import { ProjectDto } from '../../../models/Project';
import { SupplierService } from '../../../services/SupplierService';
import { CompanyService } from '../../../services/companyService';
import { CompanyType } from '../../../shared/enum/enum';
import { MultiSelectModule } from 'primeng/multiselect';
import { RadioButtonModule } from 'primeng/radiobutton';

@Component({
  selector: 'app-purchase-order-form',
  imports: [
    CommonModule,
    RouterLink,
    InputTextModule,
    DatePickerModule,
    SelectModule,
    TableModule,
    FormsModule,
    InputNumberModule,
    ButtonModule,
    ReactiveFormsModule,
    DialogModule,
    EditorModule,
    TextareaModule,
    MultiSelectModule,
    RadioButtonModule,
  ],
  template: `
    <div class="w-full p-5 flex flex-col">
      <div class="flex flex-row items-center gap-1 text-gray-500 tracking-wide">
        <div
          [routerLink]="'/dashboard'"
          class="cursor-pointer hover:text-gray-600"
        >
          Dashboard
        </div>
        /
        <div
          [routerLink]="'/purchase-orders'"
          class="cursor-pointer hover:text-gray-600"
        >
          Purchase Orders
        </div>
        /
        <div class="text-gray-700 font-semibold">
          {{
            currentId
              ? poForm.get('purchaseOrderNo')?.value
              : 'New Purchase Order'
          }}
        </div>
      </div>
      <div
        class="px-5 py-2 flex flex-row items-center justify-between border border-gray-200 bg-white mt-3"
      >
        <div class="flex flex-row items-center gap-2 font-semibold">
          <i class="pi pi-file"></i>
          <div>
            {{ currentId ? 'Update Purchase Order' : 'Create Purchase Order' }}
          </div>
        </div>
        <div class="flex flex-row items-center gap-2">
          <p-button
            label="Cancel"
            severity="secondary"
            [outlined]="true"
            styleClass="py-1.5! px-4!"
            [routerLink]="'/purchase-orders'"
          ></p-button>
          <!-- <p-buttons
          label="Save As Draft"
          severity="info"
          [outlined]="true"
          styleClass="py-1.5!"
          size="small"
        ></p-button> -->
          <p-button
            (onClick)="onSave()"
            [label]="currentId ? 'Save Changes' : 'Create'"
            severity="info"
            styleClass="py-1.5! px-4!"
          ></p-button>
        </div>
      </div>

      <div class="mt-3 border border-gray-200 bg-white p-5 flex flex-col">
        <div class="grid grid-cols-12 gap-4 items-center" [formGroup]="poForm">
          <div class="col-span-12 font-semibold text-lg">
            Purchase Order Information
          </div>
          <div class="col-span-12 flex flex-col gap-1">
            <div class="flex items-center justify-between">
              <div>
                PO No
                <span class="text-gray-400 text-xs italic ml-1">
                  (Optional – auto-generated if left blank)
                </span>
              </div>
            </div>

            <input
              type="text"
              pInputText
              class="w-full font-semibold! placeholder:font-normal!"
              formControlName="purchaseOrderNo"
              placeholder="Leave blank for auto-generated PO number"
            />
          </div>
          <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
            <div class="flex flex-row justify-between items-center">
              <div>From <span class="text-red-500">*</span></div>
              <p-button
                label="Add New Company"
                icon="pi pi-plus-circle"
                size="small"
                severity="info"
                [text]="true"
                (onClick)="AddCompanyClick(companyTypeEnum.Own)"
              ></p-button>
            </div>
            <p-select
              [options]="companySelection || []"
              appendTo="body"
              styleClass="w-full!"
              formControlName="fromCompanyId"
            ></p-select>
          </div>
          <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
            <div class="flex flex-row justify-between items-center">
              <div>Bill To <span class="text-red-500">*</span></div>
              <p-button
                label="Add New Vendor"
                icon="pi pi-plus-circle"
                size="small"
                severity="info"
                [text]="true"
                (onClick)="AddCompanyClick(companyTypeEnum.Supplier)"
              ></p-button>
            </div>
            <p-select
              [filter]="true"
              [options]="supplierSelection || []"
              appendTo="body"
              styleClass="w-full!"
              formControlName="supplierId"
              [showClear]="poForm.get('supplierId')?.value"
            ></p-select>
          </div>
          <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
            <div>
              Quotation No
              <span class="text-gray-500 text-xs italic">(Optional)</span>
            </div>
            <p-select
              [filter]="true"
              [options]="quotationSelection || []"
              appendTo="body"
              styleClass="w-full!"
              formControlName="quotationId"
              [showClear]="poForm.get('quotationId')?.value"
            ></p-select>
          </div>
          <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
            <div>PO date <span class="text-red-500">*</span></div>
            <p-datepicker
              appendTo="body"
              styleClass="w-full!"
              formControlName="poDate"
              [showIcon]="true"
              dateFormat="dd/mm/yy"
            ></p-datepicker>
          </div>
          <div class="col-span-12 lg:col-span-6 flex flex-col gap-2 mt-2">
            <div>Terms</div>
            <input
              type="text"
              pInputText
              class="w-full"
              formControlName="terms"
            />
          </div>
          <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
            <div class="flex flex-row items-center justify-between">
              <div>Project</div>
              <p-button
                label="Add New Project"
                icon="pi pi-plus-circle"
                size="small"
                severity="info"
                [text]="true"
                (onClick)="AddProject()"
              ></p-button>
            </div>

            <p-select
              [options]="projectSelection || []"
              appendTo="body"
              styleClass="w-full!"
              formControlName="projectId"
              appendTo="body"
              [filter]="true"
            ></p-select>
          </div>
          <div class="col-span-12 flex flex-col gap-1">
            <div>Remarks</div>
            <div class="col-span-12">
              <textarea
                name="remarks"
                id="remarks"
                pTextarea
                formControlName="remarks"
                class="w-full!"
                rows="3"
                cols="30"
                placeholder="Enter remarks here..."
              ></textarea>
            </div>
          </div>
          <div class="col-span-12 font-semibold text-lg">Items Details</div>
          <div class="col-span-12">
            <p-table
              showGridlines="true"
              [tableStyle]="{ 'min-width': '60rem', 'table-layout': 'fixed' }"
              [value]="items.controls"
            >
              <ng-template #header>
                <tr>
                  <th class="text-center! text-sm! w-[20%]!">Item</th>
                  <th class="text-center! text-sm! w-[30%]!">Description</th>
                  <th class="text-center! text-sm! w-[10%]!">Qty</th>

                  <th class="text-center! text-sm! w-[10%]!">Unit</th>
                  <th class="text-center! text-sm! w-[15%]!">
                    Unit Price (RM)
                  </th>
                  <th class="text-center! text-sm! w-[10%]!">Discount (%)</th>

                  <th class="text-center! text-sm! w-[15%]!">
                    Total Price (RM)
                  </th>
                  <th class="text-center! text-sm! w-[10%]!">Action</th>
                </tr></ng-template
              >
              <ng-template #body let-row let-i="rowIndex">
                <tr [formGroup]="row">
                  <td class="w-[20%]! text-center!">
                    <input
                      pInputText
                      formControlName="item"
                      class="w-full text-center!"
                    />
                  </td>

                  <td class="w-[15%]!">
                    <p-editor
                      formControlName="description"
                      [style]="{ height: '100px' }"
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
                        </span> </ng-template
                    ></p-editor>
                  </td>
                  <td class="w-[10%]!">
                    <p-inputNumber
                      formControlName="quantity"
                      class="w-full!"
                      inputStyleClass="w-full! text-center!"
                      styleClass="w-full!"
                    />
                  </td>
                  <td class="w-[10%]!">
                    <input
                      pInputText
                      formControlName="unit"
                      class="w-full text-center!"
                    />
                  </td>

                  <td class="w-[15%]!">
                    <p-inputNumber
                      formControlName="unitPrice"
                      class="w-full!"
                      inputStyleClass="w-full! text-center!"
                      styleClass="w-full!"
                      mode="decimal"
                      [minFractionDigits]="2"
                      [maxFractionDigits]="2"
                    />
                  </td>

                  <td class="w-[10%]!">
                    <p-inputNumber
                      formControlName="discount"
                      class="w-full!"
                      inputStyleClass="w-full! text-center!"
                      styleClass="w-full!"
                      mode="decimal"
                      [minFractionDigits]="2"
                      [maxFractionDigits]="2"
                    />
                  </td>

                  <td class="w-[15%]!">
                    <p-inputNumber
                      formControlName="totalPrice"
                      [readonly]="true"
                      class="w-full!"
                      inputStyleClass="w-full! text-center!"
                      styleClass="w-full!"
                      mode="decimal"
                      [minFractionDigits]="2"
                      [maxFractionDigits]="2"
                    />
                  </td>

                  <td class="text-center w-[5%]!">
                    <p-button
                      icon="pi pi-trash"
                      severity="danger"
                      size="small"
                      class="flex items-center justify-center"
                      [text]="true"
                      (onClick)="removeItem(i)"
                    ></p-button>
                  </td>
                </tr>
              </ng-template>
              <ng-template #emptymessage>
                <tr>
                  <td colspan="100%">
                    <div
                      class="flex items-center justify-center text-sm text-gray-500"
                    >
                      No items
                    </div>
                  </td>
                </tr>
              </ng-template>
            </p-table>

            <div class="flex gap-2 mt-3">
              <p-button
                label="Add Item"
                styleClass="rounded-full!"
                icon="pi pi-plus-circle"
                size="small"
                (onClick)="addItem()"
              ></p-button>
            </div>
          </div>
          <div
            class="col-span-12 flex flex-col items-end justify-end mt-4 pt-4 border-t border-gray-100"
          >
            <div class="w-full max-w-[360px] flex flex-col gap-3">
              <div class="flex items-center justify-between gap-4">
                <div
                  class="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5"
                >
                  <span>Gross (RM)</span>
                  <span
                    class="text-[10px] text-blue-500 lowercase font-normal bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100"
                    >auto</span
                  >
                </div>
                <p-inputnumber
                  formControlName="gross"
                  styleClass="w-[180px]"
                  inputStyleClass="w-full px-3 py-1.5 text-right font-medium text-sm text-gray-500 bg-gray-100! border border-gray-200 rounded-lg cursor-not-allowed select-none"
                  mode="currency"
                  currency="MYR"
                  [readonly]="true"
                  locale="ms-MY"
                  placeholder="0.00"
                  [minFractionDigits]="2"
                ></p-inputnumber>
              </div>

              <div class="flex items-center justify-between gap-4">
                <div
                  class="text-sm font-semibold text-gray-600 uppercase tracking-wider"
                >
                  - Discount (RM)
                </div>
                <p-inputnumber
                  formControlName="discount"
                  styleClass="w-[180px]"
                  inputStyleClass="w-full px-3 py-1.5 text-right text-sm font-semibold text-gray-800 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  mode="currency"
                  currency="MYR"
                  locale="ms-MY"
                  placeholder="0.00"
                  [minFractionDigits]="2"
                ></p-inputnumber>
              </div>

              <div class="border-b border-gray-200 my-1"></div>

              <div class="flex items-center justify-between gap-4">
                <div
                  class="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5"
                >
                  <span>Total Amount</span>
                  <span
                    class="text-[10px] text-emerald-600 lowercase font-normal bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 tracking-normal"
                    >auto</span
                  >
                </div>
                <p-inputnumber
                  formControlName="totalAmount"
                  styleClass="w-[180px]"
                  inputStyleClass="w-full px-3 py-2 text-right font-bold text-base bg-gray-100! border border-emerald-200 rounded-lg cursor-not-allowed select-none shadow-sm"
                  mode="currency"
                  currency="MYR"
                  [readonly]="true"
                  locale="ms-MY"
                  placeholder="0.00"
                  [minFractionDigits]="2"
                ></p-inputnumber>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <p-dialog
      [(visible)]="showCompanyDialog"
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
                  Add New Company
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
              (onClick)="showCompanyDialog = false"
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
            (onClick)="showCompanyDialog = false"
            label="Cancel"
            severity="secondary"
            styleClass="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 py-2 px-5 text-sm font-medium rounded-lg shadow-sm"
          ></p-button>

          <p-button
            (onClick)="SaveCompany()"
            label="Save Company"
            severity="info"
            [disabled]="companyForm.invalid"
            styleClass="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-400 border-none text-white py-2 px-6 text-sm font-medium shadow-sm rounded-lg"
          ></p-button>
        </div>
      </ng-template>
    </p-dialog>

    <p-dialog
      [(visible)]="showProjectDialog"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      styleClass="preview-dialog overflow-hidden rounded-xl! w-[95%]! max-w-[800px]! shadow-2xl"
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
                <i class="pi pi-folder-plus text-xl flex"></i>
              </div>
              <div>
                <h2 class="text-xl font-bold text-gray-900 tracking-tight m-0">
                  Create New Project
                </h2>
                <p class="text-sm text-gray-500 mt-0.5 leading-relaxed">
                  Define primary metrics, set milestones, and allocate initial
                  team responsibilities.
                </p>
              </div>
            </div>
            <p-button
              icon="pi pi-times"
              [rounded]="true"
              [text]="true"
              severity="secondary"
              styleClass="hover:bg-gray-200/60 text-gray-400 hover:text-gray-600 transition-colors"
              (onClick)="showProjectDialog = false"
            ></p-button>
          </div>
        </div>

        <div class="p-6 max-h-[70vh] overflow-y-auto">
          <div
            [formGroup]="projectForm"
            class="grid grid-cols-12 gap-x-5 gap-y-4"
          >
            <div class="col-span-12 flex flex-col gap-1.5">
              <label
                class="text-sm font-semibold text-gray-600 uppercase tracking-wider"
              >
                Project Title <span class="text-rose-500">*</span>
              </label>
              <input
                type="text"
                pInputText
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow"
                formControlName="projectTitle"
                placeholder="e.g. Phase 2 Cloud Migration Pipeline"
              />
            </div>

            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
              <label
                class="text-sm font-semibold text-gray-600 uppercase tracking-wider"
                >Project Code</label
              >
              <input
                type="text"
                pInputText
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow"
                formControlName="projectCode"
                placeholder="e.g. 112-1"
              />
            </div>

            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
              <label
                class="text-sm font-semibold text-gray-600 uppercase tracking-wider"
                >Client Account</label
              >
              <p-select
                [options]="clientSelection"
                appendTo="body"
                [filter]="true"
                [showClear]="projectForm.get('clientId')?.value"
                formControlName="clientId"
                styleClass="w-full border border-gray-300 rounded-lg shadow-none"
                placeholder="Assign customer corporate profile"
              ></p-select>
            </div>

            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
              <label
                class="text-sm font-semibold text-gray-600 uppercase tracking-wider"
                >Kickoff Date</label
              >
              <p-datepicker
                appendTo="body"
                styleClass="w-full"
                inputStyleClass="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500"
                formControlName="startDate"
                dateFormat="dd/mm/yy"
                [showIcon]="true"
                placeholder="Select start date"
              ></p-datepicker>
            </div>

            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
              <label
                class="text-sm font-semibold text-gray-600 uppercase tracking-wider"
                >Target Deadline</label
              >
              <p-datepicker
                appendTo="body"
                styleClass="w-full"
                inputStyleClass="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500"
                formControlName="dueDate"
                dateFormat="dd/mm/yy"
                [showIcon]="true"
                placeholder="Select delivery target"
              ></p-datepicker>
            </div>

            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1 mt-2">
              <label
                class="text-sm font-semibold text-gray-600 uppercase tracking-wider"
                >Operational Priority Level</label
              >
              <div class="flex items-center gap-6 h-full min-h-[38px]">
                <div class="flex items-center gap-2 cursor-pointer group">
                  <p-radiobutton
                    value="Low"
                    formControlName="priority"
                    inputId="prio-low"
                  ></p-radiobutton>
                  <label
                    for="prio-low"
                    class="mt-1 font-medium text-gray-700 cursor-pointer group-hover:text-gray-900"
                    >Low</label
                  >
                </div>
                <div class="flex items-center gap-2 cursor-pointer group">
                  <p-radiobutton
                    value="Medium"
                    formControlName="priority"
                    inputId="prio-med"
                  ></p-radiobutton>
                  <label
                    for="prio-med"
                    class="mt-1 font-medium text-gray-700 cursor-pointer group-hover:text-gray-900"
                    >Medium</label
                  >
                </div>
                <div class="flex items-center gap-2 cursor-pointer group">
                  <p-radiobutton
                    value="High"
                    formControlName="priority"
                    inputId="prio-high"
                  ></p-radiobutton>
                  <label
                    for="prio-high"
                    class="mt-1 font-medium text-gray-700 cursor-pointer group-hover:text-gray-900"
                    >High</label
                  >
                </div>
              </div>
            </div>

            <div class="col-span-12 flex flex-col gap-1.5">
              <label
                class="text-sm font-semibold text-gray-600 uppercase tracking-wider"
                >Project Objectives Scope</label
              >
              <textarea
                pTextarea
                rows="3"
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                formControlName="description"
                placeholder="Summarize structural project milestones, contractual dependencies or general notes..."
              ></textarea>
            </div>

            <div class="col-span-12 flex flex-col gap-2.5 mt-1">
              <label
                class="text-sm font-semibold text-gray-600 uppercase tracking-wider"
                >Allocate Team</label
              >

              <p-multiselect
                [options]="userSelection"
                formControlName="projectMembers"
                optionLabel="label"
                optionValue="value"
                display="chip"
                [filter]="true"
                appendTo="body"
                styleClass="w-full border border-gray-300 rounded-lg shadow-none"
                placeholder="Search and add team member(s)..."
              >
                <ng-template let-team #item>
                  <div class="flex items-center gap-2 py-0.5">
                    <i class="pi pi-user text-gray-400 text-xs"></i>
                    <span class="font-medium text-gray-700">{{
                      team.label
                    }}</span>
                  </div>
                </ng-template>
                <ng-template let-team #selecteditems>
                  <div
                    class="flex items-center gap-2 px-1 font-semibold text-blue-700"
                    *ngIf="team?.length > 0"
                  >
                    <i class="pi pi-users"></i>
                    <span>{{ team?.length }} assigned team members</span>
                  </div>
                </ng-template>
              </p-multiselect>

              <div
                class="flex flex-wrap gap-2 mt-1"
                *ngIf="selectedTeamMembers && selectedTeamMembers.length > 0"
              >
                <ng-container *ngFor="let user of selectedTeamMembers">
                  <div
                    class="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-xs font-medium text-slate-700 rounded-full transition-colors group"
                  >
                    <span class="truncate max-w-[180px]">{{
                      user?.label
                    }}</span>
                    <button
                      type="button"
                      (click)="RemoveSelectedMember(user)"
                      class="pi pi-times text-[10px] text-slate-400 hover:text-rose-600 rounded-full p-0.5 transition-colors focus:outline-none"
                    ></button>
                  </div>
                </ng-container>
              </div>
            </div>
          </div>
        </div>

        <div
          class="p-4 bg-slate-50 border-t border-gray-200 flex justify-end items-center gap-3 flex-none"
        >
          <p-button
            (onClick)="showProjectDialog = false"
            label="Discard"
            severity="secondary"
            styleClass="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 py-2 px-5 text-sm font-medium rounded-lg shadow-sm"
          ></p-button>

          <p-button
            (onClick)="SaveProject()"
            label="Create Project"
            severity="info"
            [disabled]="projectForm.invalid"
            styleClass="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-400 border-none text-white py-2 px-6 text-sm font-medium shadow-sm rounded-lg"
          ></p-button>
        </div>
      </ng-template>
    </p-dialog>
  `,
  styleUrl: './purchase-order-form.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseOrderForm implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messageService = inject(MessageService);
  private readonly purchaseOrderService = inject(PurchaseOrderService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly companyService = inject(CompanyService);
  private readonly projectService = inject(ProjectService);
  private readonly loadingService = inject(LoadingService);
  private readonly userService = inject(UserService);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  private destroy$ = new Subject<void>();

  poForm!: FormGroup;
  companyForm!: FormGroup;
  projectForm!: FormGroup;

  currentId: string = '';

  displayPreview: boolean = false;
  showCompanyDialog: boolean = false;
  showProjectDialog: boolean = false;

  companyTypeEnum = CompanyType;

  supplierSelection: any[] = [];
  quotationSelection: any[] = [];
  clientSelection: any[] = [];
  userSelection: any[] = [];
  companySelection: { label: string; value: string }[] = [];

  selectedVendor: any;
  selectedTemplate: string = 'notes';

  grossTotal = signal(0);
  totalDiscount = signal(0);
  totalAmount = signal(0);

  projectSelection: any[] = [];

  ngOnInit(): void {
    this.initForm();
    this.currentId = this.activatedRoute.snapshot.queryParams['id'];
    this.getDropdown();

    if (!this.currentId) {
      this.generatePONo();
    } else {
      this.LoadForm();
    }

    this.poForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.calculateTotals());
  }

  generatePONo() {
    this.purchaseOrderService
      .GenerateNo()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.poForm.get('purchaseOrderNo')?.setValue(res.purchaseOrderNo);
          this.cdr.markForCheck();
        },
      });
  }

  initForm() {
    this.poForm = new FormGroup({
      purchaseOrderNo: new FormControl<string | null>(null),
      fromCompanyId: new FormControl<string | null>(null, Validators.required),
      poDate: new FormControl<Date | null>(new Date(), Validators.required),
      poReceivedDate: new FormControl<Date | null>(null),
      supplierId: new FormControl<string | null>(null),
      clientId: new FormControl<string | null>(null),
      terms: new FormControl<string | null>(null),
      projectId: new FormControl<string | null>(null),
      quotationId: new FormControl<string | null>(null),
      gross: new FormControl<number | null>(0),
      discount: new FormControl<number | null>(0),
      totalAmount: new FormControl<number | null>(0),
      remarks: new FormControl<string | null>(null),
      notes: new FormControl<string | null>(null),
      termsAndConditions: new FormControl<string | null>(null),
      bankDetails: new FormControl<string | null>(null),
      totalQuantity: new FormControl<number | null>(null),
      attachment: new FormControl<string | null>(null),
      purchaseOrderItems: new FormArray([]),
    });
  }

  get items(): FormArray {
    return this.poForm.get('purchaseOrderItems') as FormArray;
  }

  createItem(data?: any): FormGroup {
    return this.fb.group({
      id: [data?.id ?? null],
      item: [data?.item ?? ''],
      description: [data?.description ?? '', Validators.required],
      quantity: [data?.quantity ?? 1, [Validators.required, Validators.min(1)]],
      unit: [data?.unit ?? 'unit'],
      unitPrice: [
        data?.unitPrice ?? 0,
        [Validators.required, Validators.min(0)],
      ],
      discount: [data?.discount ?? 0],
      totalPrice: [{ value: data?.totalPrice ?? 0, disabled: true }],
    });
  }

  addItem(item?: any) {
    const newItemGroup = this.createItem(item);

    this.items.push(newItemGroup);

    this.calculateTotals();
  }

  removeItem(index: number) {
    const current = this.items.at(index);

    if (current.get('isGroup')?.value) {
      this.items.removeAt(index);

      while (
        index < this.items.length &&
        !this.items.at(index).get('isGroup')?.value
      ) {
        this.items.removeAt(index);
      }
    } else {
      this.items.removeAt(index);
    }

    this.calculateTotals();
  }

  applyTemplate(type: 'notes' | 'terms' | 'bank') {
    this.selectedTemplate = type;

    this.cdr.detectChanges();
  }

  calculateTotals() {
    let gross = 0;
    let itemDiscountTotal = 0;
    let subtotal = 0;

    this.items.controls.forEach((control) => {
      const qty = Number(control.get('quantity')?.value || 0);
      const unitPrice = Number(control.get('unitPrice')?.value || 0);
      const itemDiscountPercent = Number(control.get('discount')?.value || 0);

      const lineTotal = qty * unitPrice;
      const itemDiscount = lineTotal * (itemDiscountPercent / 100);
      const netLine = lineTotal - itemDiscount;

      control.get('totalPrice')?.setValue(netLine, { emitEvent: false });

      gross += lineTotal;
      itemDiscountTotal += itemDiscount;
      subtotal += netLine;
    });

    const headerDiscount = Number(this.poForm.get('discount')?.value || 0);
    const total = subtotal - headerDiscount;
    const safeTotal = Math.max(0, total);

    this.grossTotal.set(gross);
    this.totalDiscount.set(itemDiscountTotal + headerDiscount);
    this.totalAmount.set(safeTotal);

    this.poForm.patchValue(
      {
        gross: subtotal,
        totalAmount: safeTotal,
      },
      { emitEvent: false },
    );

    this.cdr.markForCheck();
  }

  getDropdown() {
    this.loadingService.start();
    this.purchaseOrderService
      .GetDropdown()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();

          this.quotationSelection = res.quotations.map((q: any) => ({
            label: q.quotationNo,
            value: q.id,
            fromCompanyId: q.fromCompanyId,
          }));

          this.companySelection = res.companies.map((c: any) => ({
            label: c.name,
            value: c.id,
          }));

          this.supplierSelection = res.suppliers.map((c: any) => ({
            label: c.name,
            value: c.id,
          }));

          this.clientSelection = res.clients.map((c: any) => ({
            label: c.name,
            value: c.id,
          }));

          this.projectSelection = res.projects.map((c: any) => ({
            label: `${c.projectCode} - ${c.projectTitle}`,
            value: c.id,
          }));

          this.userSelection = res.users.map((c: any) => ({
            label: c.fullName,
            value: c.id,
          }));
        },
        error: (err) => {
          this.loadingService.stop();
        },
      });
  }

  LoadForm() {
    this.loadingService.start();
    this.purchaseOrderService
      .GetOne({
        Page: 1,
        PageSize: 1,
        OrderBy: null,
        Includes: 'PurchaseOrderItems',
        Select: null,
        Filter: `Id=${this.currentId}`,
      })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();
          this.poForm.get('id')?.enable();
          this.poForm.patchValue({
            ...res,
            poDate: res?.poDate ? new Date(res.poDate) : null,
          });

          this.items.clear();

          res?.purchaseOrderItems
            ?.sort((a: any, b: any) => a.sortOrder - b.sortOrder)
            .forEach((item: any) => {
              const group = this.createItem({
                ...item,
                description: this.denormalizeHtml(item.description),
              });

              group.patchValue(
                {
                  totalPrice: (item.quantity ?? 0) * (item.unitPrice ?? 0),
                },
                { emitEvent: false },
              );

              this.items.push(group);
            });
          this.calculateTotals();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loadingService.stop();
        },
      });
  }

  getProjectSelection() {
    this.projectService
      .GetMany({
        Page: 1,
        PageSize: 1000000,
        Select: null,
        Includes: null,
        Filter: null,
        OrderBy: 'ProjectCode',
      })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.projectSelection = res.data.map((x: ProjectDto) => {
            return {
              label: x.projectCode + ' - ' + x.projectTitle,
              value: x.id,
            };
          });
        },
        error: (err) => {},
      });
  }

  VendorOnChange(event: any) {
    const selectedId = event.value;

    this.selectedVendor = this.supplierSelection.find(
      (x) => x.value === selectedId,
    );
  }

  onSave() {
    ValidateAllFormFields(this.poForm);
    if (this.poForm.invalid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Please fill all required fields',
      });
      return;
    }

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
      description: this.normalizeHtml(item.description),
    }));

    formData.append('purchaseOrderItems', JSON.stringify(items));
    if (this.currentId) {
      formData.append('id', this.currentId);
    }

    const action$ = this.currentId
      ? this.purchaseOrderService.Update(formData)
      : this.purchaseOrderService.Create(formData);

    action$.subscribe((res: any) => {
      if (res.success == false) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `${res.message}`,
        });
      } else {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `PO: ${res.purchaseOrderNo} has been saved`,
        });
        this.router.navigate(['/purchase-orders']);
      }
    });
  }

  downloadPDF() {
    window.print();
  }

  AddCompanyClick(type: CompanyType) {
    this.companyForm = new FormGroup({
      name: new FormControl<string | null>(null, Validators.required),
      email: new FormControl<string | null>(null, [Validators.email]),
      contactNo: new FormControl<string | null>(null, Validators.required),
      faxNo: new FormControl<string | null>(null),
      contactPerson1: new FormControl<string | null>(null),
      contactPerson2: new FormControl<string | null>(null),
      acNo: new FormControl<string | null>(null),
      type: new FormControl<CompanyType>(type),
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

    this.companyForm.get('sameAsBilling')?.valueChanges.subscribe((checked) => {
      if (checked) {
        const billingValue = this.companyForm.get('billingAddress')?.value;
        this.companyForm.get('deliveryAddress')?.patchValue({
          ...billingValue,
          name: 'Delivery',
        });
      }
    });

    this.showCompanyDialog = true;
  }

  SaveCompany() {
    ValidateAllFormFields(this.companyForm);

    if (!this.companyForm.valid) return;

    this.loadingService.start();

    this.companyService
      .Create(this.companyForm.value)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res: any) => {
          this.loadingService.stop();
          const activeAddress = res.deliveryAddress ?? res.billingAddress;

          const newCompany = {
            label: res.name || this.companyForm.value.name,
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

          this.companyForm.get('supplierId')?.setValue(res.id);

          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `${this.companyForm.get('name')?.value} created and selected successfully`,
            life: 3000,
          });

          this.showCompanyDialog = false;
          this.companyForm.reset();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.loadingService.stop();

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail:
              err.error?.message ||
              'Failed to create company. Please try again.',
            life: 5000,
          });

          this.cdr.markForCheck();
        },
      });
  }

  AddProject() {
    this.projectForm = new FormGroup({
      id: new FormControl<string | null>({ value: null, disabled: true }),
      projectCode: new FormControl<string | null>(null),
      projectTitle: new FormControl<string | null>(null, Validators.required),
      clientId: new FormControl<string | null>(null, Validators.required),
      startDate: new FormControl<string | null>(null),
      dueDate: new FormControl<Date | null>(null),
      description: new FormControl<string | null>(null),
      priority: new FormControl<string | null>(null),
      projectMembers: new FormControl<string[]>([]),
    });

    this.showProjectDialog = true;
  }

  get selectedTeamMembers() {
    const selectedIds = this.projectForm.get('projectMembers')?.value || [];

    return this.userSelection.filter((u) => selectedIds.includes(u.value));
  }

  RemoveSelectedMember(user: any) {
    const selectedIds = this.projectForm.get('projectMembers')?.value || [];

    const updated = selectedIds.filter((id: string) => id !== user.value);

    this.projectForm.get('projectMembers')?.setValue(updated);
  }

  SaveProject() {
    ValidateAllFormFields(this.projectForm);

    if (!this.projectForm.valid) return;

    this.loadingService.start();
    this.projectService
      .Create(this.projectForm.value)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();
          const newProject = {
            label: `${res.projectCode} - ${res.projectTitle}`,
            value: res.id,
          };

          this.projectSelection = [...this.projectSelection, newProject];

          this.poForm.get('projectId')?.setValue(res.id);

          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `${this.projectForm.get('projectCode')?.value} created and selected successfully`,
            life: 3000,
          });

          this.showProjectDialog = false;
          this.projectForm.reset();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.loadingService.stop();

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail:
              err.error?.message ||
              'Failed to create project. Please try again.',
            life: 5000,
          });

          this.cdr.markForCheck();
        },
      });
  }

  normalizeHtml(html: string): string {
    if (!html) return html;

    return html
      .replace(/<strong>/g, '<b>')
      .replace(/<\/strong>/g, '</b>')
      .replace(/<em>/g, '<i>')
      .replace(/<\/em>/g, '</i>');
  }

  denormalizeHtml(html: string): string {
    if (!html) return html;

    return html
      .replace(/<b>/g, '<strong>')
      .replace(/<\/b>/g, '</strong>')
      .replace(/<i>/g, '<em>')
      .replace(/<\/i>/g, '</em>');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
