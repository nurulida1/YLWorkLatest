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
            [routerLink]="'/purchase-orders/supplier'"
          ></p-button>
          <!-- <p-button
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
          <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
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
          <div class="col-span-12 flex flex-row items-center justify-end gap-2">
            <div class="font-semibold">Total Amount :</div>
            <p-inputnumber
              styleClass="text-center!"
              formControlName="totalAmount"
              inputStyleClass="w-full font-semibold! cursor-pointer! bg-gray-200!"
              mode="currency"
              currency="MYR"
              readonly="true"
              locale="ms-MY"
              placeholder="totalAmount"
              [minFractionDigits]="2"
            ></p-inputnumber>
          </div>
        </div>
      </div>
    </div>
    <p-dialog
      [(visible)]="showCompanyDialog"
      [modal]="true"
      [style]="{ width: '850px' }"
      styleClass="preview-dialog overflow-hidden rounded-xl!"
      [maskStyle]="{ 'overflow-y': 'auto' }"
      appendTo="body"
    >
      <ng-template #headless>
        <div class="bg-gray-50/50 p-6 border-b border-gray-100">
          <div class="flex items-center gap-3">
            <div class="bg-blue-100 p-2.5 rounded-lg">
              <i class="pi pi-user-plus text-blue-600 text-xl"></i>
            </div>
            <div>
              <h2 class="text-xl font-bold text-gray-800 m-0">
                Create New Company
              </h2>
              <p class="text-sm text-gray-500 mt-1 tracking-wide">
                Fill in the primary details and address information to register
                a new company.
              </p>
            </div>
          </div>
        </div>

        <div class="p-6 max-h-[70vh] overflow-y-auto">
          <div
            [formGroup]="companyForm"
            class="grid grid-cols-12 gap-x-4 gap-y-3"
          >
            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
              <label class="font-medium text-gray-700"
                >Name <span class="text-red-500">*</span></label
              >
              <input
                type="text"
                pInputText
                class="w-full!"
                formControlName="name"
                placeholder="e.g. Acme Corp"
              />
            </div>
            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
              <label class="font-medium text-gray-700">Email Address</label>
              <input
                type="text"
                pInputText
                class="w-full!"
                formControlName="email"
                placeholder="company@example.com"
              />
            </div>
            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
              <label class="font-medium text-gray-700">Contact Number</label>
              <input
                type="text"
                pInputText
                class="w-full!"
                formControlName="contactNo"
              />
            </div>
            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
              <label class="font-medium text-gray-700">Fax No</label>
              <input
                type="text"
                pInputText
                class="w-full!"
                formControlName="faxNo"
              />
            </div>
            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
              <label class="font-medium text-gray-700">Contact Person</label>
              <input
                type="text"
                pInputText
                class="w-full!"
                formControlName="contactPerson"
              />
            </div>
            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
              <label class="font-medium text-gray-700">A/C No</label>
              <input
                type="text"
                pInputText
                class="w-full!"
                formControlName="acNo"
              />
            </div>

            <div class="col-span-12 border-t border-gray-100 pt-4 mt-2">
              <div class="flex items-center gap-2 mb-3">
                <i class="pi pi-file text-gray-400"></i>
                <span
                  class="font-bold text-gray-800 uppercase tracking-wider text-xs"
                  >Billing Address</span
                >
              </div>
            </div>

            <div
              formGroupName="billingAddress"
              class="col-span-12 grid grid-cols-12 gap-3"
            >
              <div class="col-span-12 flex flex-col gap-1.5">
                <label class="text-gray-600">Address Line 1</label>
                <input
                  pInputText
                  formControlName="addressLine1"
                  class="w-full!"
                />
              </div>
              <div class="col-span-12 flex flex-col gap-1.5">
                <label class="text-gray-600">Address Line 2</label>
                <input
                  pInputText
                  formControlName="addressLine2"
                  class="w-full!"
                />
              </div>
              <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
                <label class="text-gray-600">City</label>
                <input pInputText formControlName="city" class="w-full!" />
              </div>
              <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
                <label class="text-gray-600">Postcode</label>
                <input pInputText formControlName="poscode" class="w-full!" />
              </div>
              <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
                <label class="text-gray-600">State</label>
                <input pInputText formControlName="state" class="w-full!" />
              </div>
              <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
                <label class="text-gray-600">Country</label>
                <input pInputText formControlName="country" class="w-full!" />
              </div>
            </div>

            <div
              class="col-span-12 border-t border-gray-100 pt-4 mt-4 flex justify-between items-center"
            >
              <div class="flex items-center gap-2">
                <i class="pi pi-truck text-gray-400"></i>
                <span
                  class="font-bold text-gray-800 uppercase tracking-wider text-xs"
                  >Delivery Address</span
                >
              </div>
              <div
                class="flex items-center gap-2 text-sm bg-gray-100 px-3 py-1 rounded-full cursor-pointer hover:bg-gray-200 transition-colors"
              >
                <input
                  type="checkbox"
                  formControlName="sameAsBilling"
                  id="sameAsBilling"
                  class="cursor-pointer"
                />
                <label
                  for="sameAsBilling"
                  class="cursor-pointer font-medium text-gray-600 text-xs"
                  >Same as Billing</label
                >
              </div>
            </div>

            <div
              formGroupName="deliveryAddress"
              class="col-span-12 grid grid-cols-12 gap-3"
            >
              <div class="col-span-12 flex flex-col gap-1.5">
                <label class="text-gray-600">Address Line 1</label>
                <input
                  pInputText
                  formControlName="addressLine1"
                  class="w-full!"
                />
              </div>
              <div class="col-span-12 flex flex-col gap-1.5">
                <label class="text-gray-600">Address Line 2</label>
                <input
                  pInputText
                  formControlName="addressLine2"
                  class="w-full!"
                />
              </div>
              <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
                <label class="text-gray-600">City</label>
                <input pInputText formControlName="city" class="w-full!" />
              </div>
              <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
                <label class="text-gray-600">Postcode</label>
                <input pInputText formControlName="poscode" class="w-full!" />
              </div>
              <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
                <label class="text-gray-600">State</label>
                <input pInputText formControlName="state" class="w-full!" />
              </div>
              <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
                <label class="text-gray-600">Country</label>
                <input pInputText formControlName="country" class="w-full!" />
              </div>
            </div>

            <div
              class="col-span-12 p-4 bg-blue-50/50 border border-blue-100 rounded-lg text-blue-700 text-center text-sm flex items-center justify-center gap-2 mt-2"
              *ngIf="companyForm.get('sameAsBilling')?.value"
            >
              <i class="pi pi-info-circle"></i>
              System will use the billing address for delivery.
            </div>
          </div>
        </div>

        <div
          class="p-4 bg-gray-50 border-t border-gray-100 flex justify-end items-center gap-3"
        >
          <p-button
            (onClick)="showCompanyDialog = false"
            label="Discard"
            severity="secondary"
            styleClass="px-6 py-2! border-gray-200!"
          ></p-button>

          <p-button
            (onClick)="SaveCompany()"
            label="Save"
            severity="info"
            [disabled]="companyForm.invalid"
            styleClass="px-8 py-2! shadow-sm"
          ></p-button>
        </div>
      </ng-template>
    </p-dialog>

    <p-dialog
      [(visible)]="showProjectDialog"
      [modal]="true"
      [style]="{ width: '850px' }"
      styleClass="preview-dialog overflow-hidden rounded-xl!"
      [maskStyle]="{ 'overflow-y': 'auto' }"
      appendTo="body"
    >
      <ng-template #headless>
        <div class="bg-gray-50/50 p-6 border-b border-gray-100">
          <div class="flex items-center gap-3">
            <div class="bg-blue-100 p-2.5 rounded-lg">
              <i class="pi pi-user-plus text-blue-600 text-xl"></i>
            </div>
            <div>
              <h2 class="text-xl font-bold text-gray-800 m-0">
                Create New Project
              </h2>
              <p class="text-sm text-gray-500 mt-1 tracking-wide">
                Fill in the primary details to create new project.
              </p>
            </div>
          </div>
        </div>

        <div class="p-6 max-h-[70vh] overflow-y-auto">
          <div
            [formGroup]="projectForm"
            class="grid grid-cols-12 gap-x-4 gap-y-3"
          >
            <div class="col-span-12 flex flex-col gap-1.5">
              <label class="font-medium text-gray-700"
                >Project Title<span class="text-red-500">*</span></label
              >
              <input
                type="text"
                pInputText
                class="w-full!"
                formControlName="projectTitle"
              />
            </div>
            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
              <label class="font-medium text-gray-700">Project Code </label>
              <input
                type="text"
                pInputText
                class="w-full!"
                formControlName="projectCode"
                placeholder="e.g. 112-1"
              />
            </div>

            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
              <label class="font-medium text-gray-700">Client</label>
              <p-select
                [options]="clientSelection"
                appendTo="body"
                [filter]="true"
                [showClear]="projectForm.get('clientId')?.value"
                formControlName="clientId"
              ></p-select>
            </div>
            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
              <div>Start Date</div>
              <p-datepicker
                appendTo="body"
                styleClass="w-full!"
                formControlName="startDate"
                dateFormat="dd/mm/yy"
                [showIcon]="true"
              ></p-datepicker>
            </div>
            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
              <div>Due Date</div>
              <p-datepicker
                appendTo="body"
                styleClass="w-full!"
                formControlName="dueDate"
                dateFormat="dd/mm/yy"
                [showIcon]="true"
              ></p-datepicker>
            </div>
            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
              <div>Priority</div>
              <div class="flex flex-row gap-5">
                <div class="flex flex-row gap-3">
                  <p-radiobutton
                    value="Low"
                    formControlName="priority"
                  ></p-radiobutton>
                  <label for="">Low</label>
                </div>
                <div class="flex flex-row gap-3">
                  <p-radiobutton
                    value="Medium"
                    formControlName="priority"
                  ></p-radiobutton>
                  <label for="">Medium</label>
                </div>
                <div class="flex flex-row gap-3">
                  <p-radiobutton
                    value="High"
                    formControlName="priority"
                  ></p-radiobutton>
                  <label for="">High</label>
                </div>
              </div>
            </div>

            <div class="col-span-12 flex flex-col gap-1">
              <div>Description</div>
              <textarea
                pTextarea
                rows="3"
                cols="30"
                formControlName="description"
              ></textarea>
            </div>
            <div class="col-span-12 flex flex-col gap-1 mb-3">
              <div>Project Members</div>

              <p-multiselect
                [options]="userSelection"
                formControlName="projectMembers"
                optionLabel="label"
                optionValue="value"
                display="chip"
                [filter]="true"
                appendTo="body"
              >
                <ng-template let-team #item>
                  <div class="flex items-center gap-2">
                    <div>{{ team.label }}</div>
                  </div>
                </ng-template>
                <ng-template let-team #selecteditems>
                  <div class="flex items-center" *ngIf="team?.length > 0">
                    <div class="font-semibold tracking-wide">
                      {{ team?.length }} team members selected
                    </div>
                  </div>
                </ng-template>
              </p-multiselect>
              <div class="flex flex-wrap gap-3">
                <ng-container *ngFor="let user of selectedTeamMembers">
                  <div
                    class="flex flex-row px-3 py-1 bg-gray-100 cursor-pointer rounded-full gap-2 items-center"
                  >
                    <div
                      class="pi pi-times-circle"
                      (click)="RemoveSelectedMember(user)"
                    ></div>
                    <div class="">{{ user?.label }}</div>
                  </div>
                </ng-container>
              </div>
            </div>
          </div>

          <div
            class="p-4 bg-gray-50 border-t border-gray-100 flex justify-end items-center gap-3"
          >
            <p-button
              (onClick)="showProjectDialog = false"
              label="Discard"
              severity="secondary"
              styleClass="px-6 py-2! border-gray-200!"
            ></p-button>

            <p-button
              (onClick)="SaveProject()"
              label="Save"
              severity="info"
              [disabled]="projectForm.invalid"
              styleClass="px-8 py-2! shadow-sm"
            ></p-button>
          </div>
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
  discountTotal = signal(0);
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
      type: new FormControl<string>('Outcoming'),
      poDate: new FormControl<Date | null>(new Date(), Validators.required),
      poReceivedDate: new FormControl<Date | null>(null),
      supplierId: new FormControl<string | null>(null),
      clientId: new FormControl<string | null>(null),
      terms: new FormControl<string | null>(null),
      projectId: new FormControl<string | null>(null),
      quotationId: new FormControl<string | null>(null),
      gross: new FormControl<number | null>(0),
      discount: new FormControl<number | null>(null),
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
      const qty = control.get('quantity')?.value || 0;
      const unitPrice = control.get('unitPrice')?.value || 0;
      const itemDiscountPercent = control.get('discount')?.value || 0;

      const lineTotal = qty * unitPrice;

      const itemDiscount = lineTotal * (itemDiscountPercent / 100);
      const netLine = lineTotal - itemDiscount;

      control.get('totalPrice')?.setValue(netLine, { emitEvent: false });

      gross += lineTotal;
      itemDiscountTotal += itemDiscount;
      subtotal += netLine;
    });

    const headerDiscountPercent = this.poForm.get('discount')?.value || 0;
    const headerDiscountAmount = subtotal * (headerDiscountPercent / 100);

    const total = subtotal - headerDiscountAmount;

    this.grossTotal.set(gross);
    this.discountTotal.set(itemDiscountTotal + headerDiscountAmount);
    this.totalAmount.set(total);

    this.poForm.get('gross')?.setValue(gross, { emitEvent: false });
    this.poForm.get('totalAmount')?.setValue(total, { emitEvent: false });
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
              const group = this.createItem(item);

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

    formData.append(
      'purchaseOrderItems',
      JSON.stringify(raw.purchaseOrderItems),
    );
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
        this.router.navigate(['/purchase-orders/supplier']);
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
      contactPerson: new FormControl<string | null>(null),
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
