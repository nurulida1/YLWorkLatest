import { CommonModule, Location } from '@angular/common';
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
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { MaterialRequestService } from '../../../services/materialRequestService';
import { LoadingService } from '../../../services/loading.service';
import { Subject, takeUntil } from 'rxjs';
import { ValidateAllFormFields } from '../../../shared/helpers/helpers';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { UserService } from '../../../services/userService.service';
import { EditorModule } from 'primeng/editor';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { environment } from '../../../../environments/environment.development';

@Component({
  selector: 'app-material-request-form',
  imports: [
    CommonModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    ButtonModule,
    ReactiveFormsModule,
    DatePickerModule,
    SelectModule,
    TableModule,
    RouterLink,
    EditorModule,
    DialogModule,
    FormsModule,
    CheckboxModule,
  ],
  template: `
    <div class="flex flex-col lg:hidden">
      <div class="bg-[#1E40AF] rounded-b-[2.5rem] px-6 py-8 flex flex-col">
        <div class="flex flex-row items-center justify-between">
          <div class="flex flex-row items-center gap-3">
            <div
              [routerLink]="'/inventory'"
              class="w-13 h-13 flex items-center justify-center bg-white/10 rounded-xl"
            >
              <i class="pi pi-arrow-left text-white! text-lg!"></i>
            </div>
            <div class="flex flex-col gap-1">
              <div class="text-sm text-white/50 font-semibold tracking-widest">
                YL WORKS INVENTORY
              </div>
              <b class="text-2xl text-white text-shadow-sm"
                >{{ currentId ? 'Update' : 'New' }} Material Request</b
              >
            </div>
          </div>
        </div>
      </div>
      <div class="flex flex-col p-4 gap-4" [formGroup]="materialForm">
        <div class="p-4 border border-gray-200 rounded-lg flex flex-col">
          <div class="flex flex-row items-center gap-3">
            <div
              class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center"
            >
              <i class="pi pi-building text-blue-700!"></i>
            </div>
            <div class="font-bold">Destination & Site</div>
          </div>
          <div class="mt-4 flex flex-col gap-3">
            <div class="flex flex-col gap-1">
              <div class="text-gray-500 font-semibold">Assigned Project</div>

              <p-select
                [options]="projectSelections"
                appendTo="body"
                styleClass="bg-gray-100!"
                formControlName="projectId"
                placeholder="Select project"
                [showClear]="materialForm.get('projectId')?.value"
              ></p-select>
            </div>

            <div
              *ngIf="materialForm.get('projectId')?.value === null"
              class="flex flex-col gap-1"
            >
              <div class="text-gray-500 font-semibold">
                Location
                <span class="text-red-500">*</span>
              </div>

              <input
                pInputText
                formControlName="location"
                placeholder="Enter site / location"
                class="w-full p-3! bg-gray-100!"
              />

              <small
                *ngIf="
                  materialForm.get('location')?.invalid &&
                  materialForm.get('location')?.touched
                "
                class="text-red-500"
              >
                Location is required.
              </small>
            </div>
          </div>
        </div>
        <div class="p-4 border border-gray-200 rounded-lg flex flex-col">
          <div class="flex flex-row items-center gap-3">
            <div
              class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center"
            >
              <i class="pi pi-clock text-blue-700!"></i>
            </div>
            <div class="font-bold">Timeline & Priority</div>
          </div>
          <div class="mt-4 flex flex-col gap-2">
            <div class="text-gray-600 font-semibold">Fulfillment Priority</div>
            <div class="grid grid-cols-12 gap-3">
              <!-- STANDARD -->
              <div
                class="col-span-4 flex flex-col text-center p-3 rounded-lg gap-1
           cursor-pointer transition-all duration-200"
                (click)="materialForm.get('priority')?.setValue('Standard')"
                [ngClass]="{
                  'bg-blue-800 shadow-sm':
                    materialForm.get('priority')?.value === 'Standard',
                  'bg-gray-100 hover:bg-gray-200':
                    materialForm.get('priority')?.value !== 'Standard',
                }"
              >
                <div
                  class="font-semibold"
                  [ngClass]="
                    materialForm.get('priority')?.value === 'Standard'
                      ? 'text-white'
                      : 'text-gray-600'
                  "
                >
                  Standard
                </div>

                <span
                  class="text-sm"
                  [ngClass]="
                    materialForm.get('priority')?.value === 'Standard'
                      ? 'text-white/80'
                      : 'text-gray-500'
                  "
                >
                  3 - 5 Days
                </span>
              </div>

              <!-- PRIORITY -->
              <div
                class="col-span-4 flex flex-col text-center p-3 rounded-lg gap-1
           cursor-pointer transition-all duration-200"
                (click)="materialForm.get('priority')?.setValue('Priority')"
                [ngClass]="{
                  'bg-blue-800 shadow-sm':
                    materialForm.get('priority')?.value === 'Priority',
                  'bg-gray-100 hover:bg-gray-200':
                    materialForm.get('priority')?.value !== 'Priority',
                }"
              >
                <div
                  class="font-semibold"
                  [ngClass]="
                    materialForm.get('priority')?.value === 'Priority'
                      ? 'text-white'
                      : 'text-gray-600'
                  "
                >
                  Priority
                </div>

                <span
                  class="text-sm whitespace-nowrap"
                  [ngClass]="
                    materialForm.get('priority')?.value === 'Priority'
                      ? 'text-white/80'
                      : 'text-gray-500'
                  "
                >
                  Next Day (24h)
                </span>
              </div>

              <!-- URGENT -->
              <div
                class="col-span-4 flex flex-col text-center p-3 rounded-lg gap-1
           cursor-pointer transition-all duration-200"
                (click)="materialForm.get('priority')?.setValue('Urgent')"
                [ngClass]="{
                  'bg-blue-800 shadow-sm':
                    materialForm.get('priority')?.value === 'Urgent',
                  'bg-gray-100 hover:bg-gray-200':
                    materialForm.get('priority')?.value !== 'Urgent',
                }"
              >
                <div
                  class="font-semibold"
                  [ngClass]="
                    materialForm.get('priority')?.value === 'Urgent'
                      ? 'text-white'
                      : 'text-red-700'
                  "
                >
                  Urgent
                </div>

                <span
                  class="text-sm"
                  [ngClass]="
                    materialForm.get('priority')?.value === 'Urgent'
                      ? 'text-white/80'
                      : 'text-gray-500'
                  "
                >
                  Same Day
                </span>
              </div>
            </div>
            <div class="flex flex-col gap-1 mt-2">
              <div class="text-gray-500 font-semibold">Target Date</div>
              <p-datepicker
                [showIcon]="true"
                appendTo="body"
                styleClass="w-full!"
                dateFormat="dd/mm/yy"
              ></p-datepicker>
            </div>
          </div>
        </div>
        <div class="p-4 border border-gray-200 rounded-lg flex flex-col">
          <div class="flex flex-row items-center justify-between">
            <div class="flex flex-row items-center gap-3">
              <div
                class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"
              >
                <i class="pi pi-list text-blue-700!"></i>
              </div>
              <div class="flex flex-col">
                <div class="font-bold">Requested Items</div>
                <span class="text-sm text-gray-500">
                  {{ materialItems.length }} item(s) staged
                </span>
              </div>
            </div>
            <p-button
              label="Catalog"
              icon="pi pi-plus"
              size="small"
              styleClass="bg-blue-900! text-white! border-none! px-4! py-2!"
              (onClick)="openCatalogDialog()"
            ></p-button>
          </div>
          <div class="mt-4 flex flex-col gap-2">
            <ng-container
              *ngFor="let row of materialItems.controls; let i = index"
            >
              <div
                [formGroup]="row"
                class="p-3 flex flex-col bg-gray-100 rounded-lg border border-gray-200"
              >
                <div
                  class="flex flex-row items-start justify-between border-b border-gray-200 pb-3"
                >
                  <div class="flex flex-row items-start gap-3 min-w-0 flex-1">
                    <div
                      class="w-14 h-14 bg-white border border-gray-200
                   flex items-center justify-center rounded-lg shrink-0"
                    >
                      <img
                        [src]="row.get('attachment')?.value"
                        alt=""
                        class="w-full h-full object-contain"
                      />
                    </div>

                    <div class="flex flex-col min-w-0 flex-1">
                      <!-- TYPE -->
                      <div class="flex items-center gap-2 mb-1">
                        <div
                          class="text-xs px-2 py-1 rounded
                       bg-blue-100 text-blue-700
                       font-bold tracking-wider"
                        >
                          {{
                            row.get('inventoryId')?.value ? 'CATALOG' : 'CUSTOM'
                          }}
                        </div>
                      </div>

                      <!-- DESCRIPTION -->
                      <div
                        class="font-semibold text-gray-800 truncate"
                        [title]="row.get('description')?.value"
                      >
                        {{ row.get('description')?.value }}
                      </div>

                      <!-- BRAND / TYPE -->
                      <div
                        class="flex items-center gap-1
                     text-xs text-gray-500
                     overflow-hidden whitespace-nowrap"
                      >
                        <span *ngIf="row.get('brand')?.value" class="truncate">
                          {{ row.get('brand')?.value }}
                        </span>

                        <i
                          *ngIf="
                            row.get('brand')?.value && row.get('typeNo')?.value
                          "
                          class="pi pi-circle-fill text-[3px]!"
                        ></i>

                        <span *ngIf="row.get('typeNo')?.value" class="truncate">
                          {{ row.get('typeNo')?.value }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- REMOVE -->
                  <p-button
                    icon="pi pi-trash"
                    severity="danger"
                    [text]="true"
                    size="small"
                    (onClick)="removeItem(i)"
                  ></p-button>
                </div>

                <!-- QUANTITY -->
                <div class="mt-3 flex items-center justify-between">
                  <div class="flex flex-col">
                    <span class="text-xs text-gray-500">
                      Request Quantity
                    </span>
                  </div>

                  <p-inputnumber
                    formControlName="quantity"
                    buttonLayout="horizontal"
                    [showButtons]="true"
                    [min]="1"
                    [suffix]="
                      row.get('unit')?.value ? ' ' + row.get('unit')?.value : ''
                    "
                    inputStyleClass="w-28!"
                  >
                    <ng-template #incrementbuttonicon>
                      <span class="pi pi-plus"></span>
                    </ng-template>

                    <ng-template #decrementbuttonicon>
                      <span class="pi pi-minus"></span>
                    </ng-template>
                  </p-inputnumber>
                </div>
              </div>
            </ng-container>

            <div
              *ngIf="materialItems.length === 0"
              class="p-5 bg-gray-50 border border-dashed
           border-gray-300 rounded-lg
           text-center text-sm text-gray-500"
            >
              No requested items added yet.
            </div>
          </div>
          <div
            (click)="nonCatalogDialog = true"
            class="rounded-lg flex flex-row items-center justify-center gap-2 border p-3 border-dashed border-blue-900 mt-2"
          >
            <i class="pi pi-plus-circle text-blue-900!"></i>
            <span class="font-semibold text-blue-900"
              >Add Custom Non-Catalog Item</span
            >
          </div>
        </div>
        <div class="flex flex-row items-center gap-2">
          <p-button
            [routerLink]="'/material-requests'"
            label="Cancel"
            severity="secondary"
            styleClass="w-full! py-3! border-gray-200!"
            class="flex-1!"
          ></p-button>
          <p-button
            (onClick)="onSave()"
            label="Submit Request"
            severity="info"
            styleClass="w-full! text-white! border-none! bg-blue-900! py-3!"
            class="flex-1!"
          ></p-button>
        </div>
      </div>

      <div class="hidden lg:flex flex-col min-h-screen w-full p-5 gap-5">
        <nav class="flex items-center gap-2 text-gray-500">
          <a
            routerLink="/dashboard"
            class="hover:text-blue-600 transition-colors"
            >Dashboard</a
          >
          <i class="pi pi-chevron-right"></i>
          <a
            routerLink="/material-requests"
            class="hover:text-blue-600 transition-colors"
            >Material Requests</a
          >
          <i class="pi pi-chevron-right"></i>
          <span class="text-gray-900 font-bold">Material Request Form</span>
        </nav>

        <div
          class="border bg-white border-gray-200 rounded-md p-5 flex flex-col"
        >
          <h2 class="text-xl font-semibold">
            {{
              currentId ? 'Edit Material Request Form' : 'Material Request Form'
            }}
          </h2>

          <div class="mt-1 text-gray-500 tracking-wide">
            Fill in all required field.
          </div>
          <div
            class="mt-5 grid grid-cols-12 gap-4 items-center"
            [formGroup]="materialForm"
          >
            <!-- <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
          <div>Document No <span class="text-red-500">*</span></div>
          <input
            type="text"
            pInputText
            class="w-full"
            formControlName="documentNo"
          />
        </div> -->
            <div class="col-span-12 flex flex-col gap-1">
              <div>Project</div>
              <p-select
                [options]="projectSelections || []"
                appendTo="body"
                styleClass="w-full!"
                formControlName="projectId"
                [filter]="true"
              ></p-select>
            </div>
            <!-- <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
          <div>Rev No</div>
          <input
            type="text"
            pInputText
            class="w-full"
            formControlName="revNo"
          />
        </div>
        <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
          <div>Eff Date</div>
          <p-datepicker
            appendTo="body"
            [showIcon]="true"
            formControlName="effDate"
            dateFormat="dd/mm/yy"
            styleClass="w-full!"
          ></p-datepicker>
        </div> -->
            <!-- <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
          <div>Request No</div>
          <input
            type="text"
            pInputText
            class="w-full"
            formControlName="requestNo"
          />
        </div> -->

            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
              <div>Request Date</div>
              <p-datepicker
                appendTo="body"
                [showIcon]="true"
                formControlName="requestDate"
                dateFormat="dd/mm/yy"
                styleClass="w-full!"
              ></p-datepicker>
            </div>
            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
              <div>Request By</div>
              <p-select
                [options]="userSelections || []"
                appendTo="body"
                [filter]="true"
                formControlName="requestedById"
              ></p-select>
            </div>
            <div class="col-span-12 flex flex-col gap-1">
              <div>Delivery Place</div>
              <input
                type="text"
                pInputText
                class="w-full"
                formControlName="deliveryPlace"
              />
            </div>

            <div class="col-span-12 flex flex-col gap-1">
              <div>Remarks</div>
              <textarea
                name=""
                id=""
                pTextarea
                [cols]="30"
                [rows]="3"
                formControlName="remarks"
              ></textarea>
            </div>
          </div>
          <div [formGroup]="materialForm">
            <div formGroupName="materialItems" class="flex flex-col gap-2 mt-6">
              <div class="font-semibold text-lg">Material Items</div>
              <p-table
                showGridlines="true"
                [tableStyle]="{ 'min-width': '70rem', 'table-layout': 'fixed' }"
                [value]="materialItems.controls"
              >
                <ng-template #header>
                  <tr>
                    <th class="text-center! text-sm! w-[30%]! bg-gray-100!">
                      Description
                    </th>
                    <th class="text-center! text-sm! w-[20%]! bg-gray-100!">
                      Brand
                    </th>

                    <th class="text-center! text-sm! w-[10%]! bg-gray-100!">
                      Type No
                    </th>
                    <th class="text-center! text-sm! w-[10%]! bg-gray-100!">
                      Quantity
                    </th>
                    <th class="text-center! text-sm! w-[10%]! bg-gray-100!">
                      Unit
                    </th>
                    <th class="text-center! text-sm! w-[15%]! bg-gray-100!">
                      Required At
                    </th>
                    <th class="text-center! text-sm! w-[15%]! bg-gray-100!">
                      Remarks
                    </th>
                    <th class="text-center! text-sm! w-[5%]! bg-gray-100!">
                      Action
                    </th>
                  </tr></ng-template
                >
                <ng-template #body let-row let-i="rowIndex">
                  <tr [formGroup]="row">
                    <td>
                      <textarea
                        name=""
                        id=""
                        pTextarea
                        class="w-full!"
                        formControlName="description"
                        [cols]="30"
                        [rows]="3"
                      ></textarea>
                    </td>

                    <td>
                      <input
                        pInputText
                        formControlName="brand"
                        class="w-full text-center!"
                      />
                    </td>

                    <td>
                      <input
                        pInputText
                        formControlName="typeNo"
                        class="w-full text-center!"
                      />
                    </td>

                    <td>
                      <p-inputNumber
                        formControlName="quantity"
                        class="w-full!"
                        inputStyleClass="w-full! text-center!"
                        styleClass="w-full!"
                      />
                    </td>
                    <td>
                      <p-select
                        formControlName="unit"
                        appendTo="body"
                        [options]="[
                          { label: 'Pcs', value: 'Pcs' },
                          { label: 'Box', value: 'Box' },
                          { label: 'Set', value: 'Set' },
                          { label: 'Pair', value: 'Pair' },
                          { label: 'Unit', value: 'Unit' },
                          { label: 'Nos', value: 'Nos' },
                          { label: 'Rolls', value: 'Rolls' },
                        ]"
                        styleClass="w-full!"
                      ></p-select>
                    </td>

                    <td>
                      <p-datepicker
                        showIcon="true"
                        appendTo="body"
                        formControlName="requiredAt"
                        styleClass="w-full!"
                        dateFormat="dd/mm/yy"
                      ></p-datepicker>
                    </td>

                    <td>
                      <input
                        pInputText
                        formControlName="remarks"
                        class="w-full text-center!"
                      />
                    </td>

                    <td class="text-center!">
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
                        class="flex items-center justify-center text-gray-500"
                      >
                        No items added.
                      </div>
                    </td>
                  </tr>
                </ng-template>
              </p-table>
              <p-button
                label="Add Item"
                styleClass="rounded-full!"
                icon="pi pi-plus-circle"
                size="small"
                severity="info"
                (onClick)="addMaterialItem()"
              ></p-button>
            </div>
          </div>
          <div class="border-b border-gray-200 mt-4 mb-4"></div>
          <div class="flex flex-row items-center justify-end gap-2">
            <p-button
              label="Discard"
              severity="secondary"
              styleClass="border-gray-200! px-4!"
              (onClick)="CancelClick()"
            ></p-button>
            <p-button
              label="Submit"
              severity="info"
              styleClass="px-4!"
              (onClick)="onSave()"
            ></p-button>
          </div>
        </div>
      </div>

      <p-dialog
        [(visible)]="nonCatalogDialog"
        [modal]="true"
        position="bottom"
        styleClass="w-full!"
      >
        <ng-template #headless>
          <div
            class="w-full p-5 bg-gray-100 border-b border-gray-200 rounded-t-xl flex flex-row items-center gap-2 justify-between"
          >
            <div class="flex flex-row items-center gap-3">
              <div
                class="w-14 h-14 rounded-xl flex items-center justify-center bg-blue-100"
              >
                <i
                  class="pi pi-file-o text-2xl! text-blue-800! font-semibold!"
                ></i>
              </div>
              <div class="flex flex-col">
                <b class="text-xl">Add Non-Catalog Item</b>
                <span class="text-sm text-gray-500"
                  >Request custom materials, specialty tools, or unlisted
                  suppliers</span
                >
              </div>
            </div>
            <div
              class="pi pi-times text-xl! text-gray-500!"
              (click)="nonCatalogDialog = false"
            ></div>
          </div>
          <div class="p-5 bg-white flex flex-col gap-3">
            <div class="flex flex-col gap-1">
              <div class="font-semibold">
                Item Name & Specification <span class="text-red-500">*</span>
              </div>

              <input
                pInputText
                placeholder="e.g. 10mm Expansion Anchor Bolts (SS316)"
                class="w-full! bg-gray-100! p-3! border-gray-200!"
              />
            </div>
            <div class="flex flex-col gap-1">
              <div class="font-semibold">
                Category / Type <span class="text-red-500">*</span>
              </div>

              <p-select appendTo="body" styleClass="bg-gray-100!"></p-select>
            </div>
            <div class="grid grid-cols-12 gap-3">
              <div class="col-span-6 flex flex-col gap-1">
                <div class="font-semibold">
                  Quantity <span class="text-red-500">*</span>
                </div>

                <p-inputnumber
                  styleClass="w-full"
                  inputStyleClass="w-full bg-gray-100!"
                  [showButtons]="true"
                  buttonLayout="horizontal"
                  ><ng-template #incrementbuttonicon>
                    <span class="pi pi-plus"></span>
                  </ng-template>
                  <ng-template #decrementbuttonicon>
                    <span class="pi pi-minus"></span> </ng-template
                ></p-inputnumber>
              </div>
              <div class="col-span-6 flex flex-col gap-1">
                <div class="font-semibold">
                  Unit of Measure <span class="text-red-500">*</span>
                </div>

                <p-select appendTo="body" styleClass="bg-gray-100!"></p-select>
              </div>
            </div>
            <div class="flex flex-col gap-1">
              <div class="flex flex-row items-center justify-between">
                <div class="text-gray-500 text-sm">
                  <b class="text-base text-gray-600">Estimated Unit Price</b>
                  (Optional)
                </div>
                <div class="text-xs text-gray-500">MYR (RM)</div>
              </div>
              <p-inputnumber inputStyleClass="bg-gray-100!"></p-inputnumber>
            </div>
            <div class="flex flex-col gap-1">
              <div class="text-gray-600 font-semibold">
                Justification / Urgency Note
              </div>
              <textarea
                placeholder="Why is a non-catalog item required? e.g. Urgent replacement for damaged conduit line on Bay 3"
                pTextarea
                [cols]="30"
                [rows]="3"
                [autoResize]="true"
                class="bg-gray-100!"
              ></textarea>
            </div>
            <div class="flex flex-col gap-1">
              <div class="text-gray-600 font-semibold">
                Photo or Spec Sheet
                <span class="text-sm text-gray-500">(Optional)</span>
              </div>
              <div
                class="w-full p-5 flex flex-col gap-1 items-center justify-center
         border-2 border-dashed border-gray-200 rounded-lg bg-gray-100
         cursor-pointer hover:bg-gray-50 transition"
                (click)="fileInput.click()"
              >
                <div
                  class="w-13 h-13 rounded-xl flex items-center justify-center bg-blue-100"
                >
                  <i class="pi pi-camera text-2xl! text-blue-900!"></i>
                </div>

                <div
                  class="font-semibold text-sm mt-2 w-full text-center truncate"
                ></div>

                <span class="text-sm text-gray-500">
                  PNG, JPG, or PDF up to 10MB
                </span>

                <input
                  #fileInput
                  type="file"
                  class="hidden"
                  accept=".png,.jpg,.jpeg,.pdf"
                  (change)="onFileSelected($event)"
                />
              </div>
            </div>
          </div>
          <div
            class="w-full p-5 bg-gray-100 border-t border-gray-300 rounded-b-xl flex flex-row items-center gap-2 justify-end"
          >
            <p-button
              label="Cancel"
              severity="secondary"
              styleClass="py-3! px-5! bg-gray-200!"
              (onClick)="nonCatalogDialog = false"
            ></p-button>
            <p-button
              label="Add to Requisition"
              severity="info"
              icon="pi pi-check-circle"
              styleClass="border-none! bg-blue-900! text-white! py-3! px-5!"
            ></p-button>
          </div>
        </ng-template>
      </p-dialog>

      <p-dialog
        [(visible)]="catalogDialog"
        [modal]="true"
        position="bottom"
        styleClass="w-full!"
      >
        <ng-template #headless>
          <div
            class="w-full h-[85vh] flex flex-col bg-white rounded-t-xl overflow-hidden"
          >
            <!-- HEADER -->
            <div
              class="shrink-0 sticky top-0 z-20
               w-full p-5 bg-gray-100 border-b border-gray-200
               flex flex-row items-center gap-2 justify-between"
            >
              <div class="flex flex-row items-center gap-3">
                <div
                  class="w-14 h-14 rounded-xl flex items-center justify-center bg-blue-100"
                >
                  <i
                    class="pi pi-box text-2xl! text-blue-800! font-semibold!"
                  ></i>
                </div>

                <div class="flex flex-col">
                  <b class="text-xl">Select Catalog Items</b>
                  <span class="text-sm text-gray-500">
                    Browse central depot inventory & standard site supplies
                  </span>
                </div>
              </div>
            </div>

            <!-- SCROLLABLE CONTENT -->
            <div
              class="flex-1 overflow-y-auto p-5 bg-white flex flex-col gap-3"
            >
              <!-- SEARCH -->
              <div class="relative">
                <i class="pi pi-search absolute! top-4! left-4!"></i>

                <input
                  pInputText
                  class="w-full p-3! pl-10!"
                  [(ngModel)]="catalogSearch"
                  placeholder="Search materials, tools, SKU..."
                />
              </div>

              <!-- INVENTORY LIST -->
              <div class="flex flex-col gap-1 border-t border-gray-200 pt-4">
                <ng-container
                  *ngFor="let inventory of filteredInventorySelections"
                >
                  <div
                    class="p-3 rounded-lg flex flex-col border transition"
                    [ngClass]="{
                      'bg-blue-50 border-blue-500 ring-1 ring-blue-200':
                        inventory.selected,
                      'bg-gray-100 border-gray-200': !inventory.selected,
                    }"
                  >
                    <div class="flex flex-row items-start gap-3">
                      <!-- SELECT CHECKBOX -->
                      <p-checkbox
                        [(ngModel)]="inventory.selected"
                        [binary]="true"
                        (onChange)="onInventorySelected(inventory)"
                      ></p-checkbox>

                      <div
                        class="w-12 h-12 rounded-lg bg-white border border-gray-200
               flex items-center justify-center shrink-0"
                      >
                        <img
                          [src]="inventory.attachment"
                          alt=""
                          size="w-full h-full object-contain"
                        />
                      </div>

                      <div class="flex flex-col gap-1 flex-1">
                        <div class="flex flex-row items-center gap-2">
                          <div
                            class="py-1 px-3 bg-blue-100 text-blue-700
                   font-semibold text-xs uppercase rounded"
                          >
                            {{ inventory.category }}
                          </div>

                          <div
                            class="font-semibold text-xs"
                            [ngClass]="{
                              'text-green-700': inventory.status === 'In Stock',
                              'text-red-700':
                                inventory.status === 'Low Stock' ||
                                inventory.status === 'Out Stock',
                            }"
                          >
                            {{ inventory.status }}
                            ({{ inventory.quantity }} {{ inventory.unit }})
                          </div>
                        </div>

                        <div class="font-semibold text-gray-800">
                          {{ inventory.label }}
                        </div>

                        <div
                          class="flex flex-row items-center gap-1 text-xs text-gray-500 min-w-0 overflow-hidden"
                        >
                          <div *ngIf="inventory.itemCode" class="shrink-0">
                            {{ inventory.itemCode }}
                          </div>

                          <i
                            *ngIf="inventory.itemCode && inventory.brand"
                            class="pi pi-circle-fill text-gray-500! text-[3px]! shrink-0"
                          ></i>

                          <div
                            *ngIf="inventory.brand"
                            class="truncate min-w-0"
                            [title]="inventory.brand"
                          >
                            {{ inventory.brand }}
                          </div>

                          <i
                            *ngIf="inventory.brand && inventory.model"
                            class="pi pi-circle-fill text-gray-500! text-[3px]! shrink-0"
                          ></i>

                          <div
                            *ngIf="inventory.model"
                            class="truncate min-w-0"
                            [title]="inventory.model"
                          >
                            {{ inventory.model }}
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- QUANTITY -->
                    <div
                      *ngIf="inventory.selected"
                      class="border-t border-gray-200 mt-3 pt-3
             flex flex-row items-center justify-between"
                    >
                      <div class="flex flex-col">
                        <span class="text-xs text-gray-500">
                          Request Quantity
                        </span>
                        <span class="text-sm font-medium">
                          Available: {{ inventory.quantity }}
                          {{ inventory.unit }}
                        </span>
                      </div>

                      <p-inputnumber
                        buttonLayout="horizontal"
                        [showButtons]="true"
                        [(ngModel)]="inventory.requestQuantity"
                        [min]="1"
                        [max]="inventory.quantity"
                        [suffix]="inventory.unit ? ' ' + inventory.unit : ''"
                        inputStyleClass="w-28!"
                        styleClass="w-fit!"
                      >
                        <ng-template #incrementbuttonicon>
                          <span class="pi pi-plus"></span>
                        </ng-template>

                        <ng-template #decrementbuttonicon>
                          <span class="pi pi-minus"></span>
                        </ng-template>
                      </p-inputnumber>
                    </div>
                  </div>
                </ng-container>
              </div>
            </div>

            <!-- FOOTER -->
            <div
              class="shrink-0 w-full p-5 bg-gray-100 border-t border-gray-300
         flex flex-row items-center justify-between"
            >
              <div class="flex flex-col">
                <span class="text-sm font-semibold text-gray-800">
                  {{ selectedInventories.length }} item(s) selected
                </span>
              </div>

              <div class="flex flex-row items-center gap-2">
                <p-button
                  label="Cancel"
                  severity="secondary"
                  styleClass="py-3! px-5! bg-gray-200!"
                  size="small"
                  (onClick)="closeCatalogDialog()"
                ></p-button>

                <p-button
                  [label]="
                    'Add to Requisition ' +
                    '(' +
                    selectedInventories.length +
                    ')'
                  "
                  severity="info"
                  icon="pi pi-check-circle"
                  size="small"
                  styleClass="border-none! bg-blue-900! text-white! py-3! px-5! whitespace-nowrap!"
                  [disabled]="selectedInventories.length === 0"
                  (onClick)="addSelectedInventories()"
                ></p-button>
              </div>
            </div>
          </div>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styleUrl: './material-request-form.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaterialRequestForm implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly userService = inject(UserService);
  private readonly messageService = inject(MessageService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly loadingService = inject(LoadingService);
  private readonly location = inject(Location);
  private readonly materialRequestService = inject(MaterialRequestService);

  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  materialForm!: FormGroup;

  currentId: string = '';
  catalogSearch: string = '';

  userRequestedId: string | null = null;
  projectId: string | null = null;
  selectedClient: any = null;

  projectSelections: any[] = [];
  userSelections: any[] = [];
  supplierSelections: any[] = [];
  inventorySelections: any[] = [];

  nonCatalogDialog: boolean = false;
  catalogDialog: boolean = false;

  ngOnInit(): void {
    this.currentId = this.activatedRoute.snapshot.queryParams['id'] || null;
    this.projectId =
      this.activatedRoute.snapshot.queryParams['projectId'] || null;
    this.userRequestedId = this.userService.currentUser?.userId || null;

    this.initForm();

    this.getDropdown();

    this.materialForm
      .get('projectId')
      ?.valueChanges.pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((projectId: string) => {
        const locationControl = this.materialForm.get('location');

        if (projectId === null) {
          this.materialForm.patchValue(
            {
              clientId: null,
            },
            { emitEvent: false },
          );

          locationControl?.setValidators([Validators.required]);
        } else {
          const selectedProject = this.projectSelections.find(
            (x) => x.value === projectId,
          );

          this.materialForm.patchValue(
            {
              clientId: selectedProject?.clientId ?? null,

              // clear manually-entered location
              location: null,
            },
            { emitEvent: false },
          );

          locationControl?.clearValidators();
        }

        locationControl?.updateValueAndValidity();

        this.cdr.markForCheck();
      });

    if (this.currentId) {
      this.loadForm();
    }
  }

  getDropdown() {
    this.loadingService.start();
    this.materialRequestService
      .GetDropdown()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res: any) => {
          this.loadingService.stop();

          this.projectSelections = [
            ...res.projects.map((p: any) => ({
              value: p.id,
              label: p.projectTitle,
              clientId: p.clientId,
            })),
            {
              value: null,
              label: 'Others',
              clientId: null,
            },
          ];

          this.supplierSelections = res.suppliers.map((s: any) => ({
            label: s.name,
            value: s.id,
          }));

          this.userSelections = res.users.map((u: any) => ({
            label: u.name,
            value: u.id,
          }));

          this.inventorySelections = res.inventories.map((u: any) => ({
            label: u.name,
            value: u.id,
            brand: u.brand,
            model: u.model,
            quantity: u.quantity,
            unit: u.unit,
            status: u.status,
            itemCode: u.itemCode,
            category: u.category,
            attachment: environment.AttachmentUrl + u.attachment,
          }));

          if (this.projectId) {
            this.materialForm.get('projectId')?.patchValue(this.projectId);
            this.materialForm.get('projectId')?.disable();
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loadingService.stop();
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail:
              err.message || 'An error occurred while loading dropdown data',
          });
        },
      });
  }

  initForm() {
    this.materialForm = this.fb.group({
      id: [{ value: null, disabled: true }],

      documentNo: [null],
      revNo: ['00'],
      effDate: [null],
      requestNo: [null],

      clientId: [null],
      projectId: [null],
      priority: ['Standard', Validators.required],
      location: [null],

      requestDate: [new Date(), Validators.required],
      deliveryDate: [null],
      deliveryPlace: [null],

      workOrderId: [null],
      requestedById: [this.userRequestedId, Validators.required],

      remarks: [null],

      // IMPORTANT:
      // jangan create empty item by default
      materialItems: this.fb.array([]),
    });
  }

  get materialItems(): FormArray<FormGroup> {
    return this.materialForm.get('materialItems') as FormArray<FormGroup>;
  }

  createMaterialItem(item?: any): FormGroup {
    console.log(item);
    return this.fb.group({
      id: [item?.id ?? null],

      // null = non-catalog
      // ada value = inventory/catalog item
      inventoryId: [item?.inventoryId ?? null],

      description: [item?.description ?? null, Validators.required],

      brand: [item?.brand ?? null],

      unit: [item?.unit ?? null, Validators.required],

      typeNo: [item?.typeNo ?? null],

      quantity: [item?.quantity ?? 1, [Validators.required, Validators.min(1)]],

      requiredAt: [item?.requiredAt ? new Date(item.requiredAt) : null],

      remarks: [item?.remarks ?? null],

      supplierId: [item?.supplierId ?? null],
      attachment: [item?.attachment ?? null],
    });
  }

  addMaterialItem(item?: any) {
    this.materialItems.push(this.createMaterialItem(item));

    this.cdr.markForCheck();
  }

  removeItem(index: number) {
    this.materialItems.removeAt(index);
    this.cdr.markForCheck();
  }

  loadForm() {
    this.loadingService.start();

    this.materialRequestService
      .GetOne({
        Page: 1,
        PageSize: 1,
        OrderBy: null,
        Select: null,
        Filter: this.currentId,
        Includes: 'MaterialItems',
      })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res: any) => {
          this.loadingService.stop();

          if (!res) {
            return;
          }

          // Patch main request
          this.materialForm.patchValue({
            id: res.id ?? null,

            documentNo: res.documentNo ?? null,
            revNo: res.revNo ?? '00',

            effDate: res.effDate ? new Date(res.effDate) : null,

            requestNo: res.requestNo ?? null,

            clientId: res.clientId ?? null,
            projectId: res.projectId ?? null,

            requestDate: res.requestDate ? new Date(res.requestDate) : null,

            deliveryDate: res.deliveryDate ? new Date(res.deliveryDate) : null,

            deliveryPlace: res.deliveryPlace ?? null,

            workOrderId: res.workOrderId ?? null,

            requestedById: res.requestedById ?? null,

            remarks: res.remarks ?? null,
          });

          // Rebuild MaterialItems
          this.materialItems.clear();

          if (res.materialItems?.length) {
            res.materialItems.forEach((item: any) => {
              this.materialItems.push(
                this.createMaterialItem({
                  id: item.id,

                  inventoryId: item.inventoryId ?? null,

                  description: item.description,

                  brand: item.brand,

                  unit: item.unit,

                  typeNo: item.typeNo,

                  quantity: item.quantity,

                  requiredAt: item.requiredAt,

                  remarks: item.remarks,

                  supplierId: item.supplierId,
                }),
              );
            });
          }

          this.cdr.markForCheck();
        },

        error: (err) => {
          this.loadingService.stop();

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail:
              err.message ||
              'An error occurred while loading the material request',
          });
        },
      });
  }

  onSave() {
    ValidateAllFormFields(this.materialForm);

    if (this.materialItems.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Requested Items',
        detail: 'Please add at least one item to the requisition.',
      });

      return;
    }

    if (this.materialForm.invalid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Please fill all required fields',
      });

      return;
    }

    this.loadingService.start();

    const payload = this.materialForm.getRawValue();

    const action$ = this.currentId
      ? this.materialRequestService.Update(payload)
      : this.materialRequestService.Create(payload);

    action$.pipe(takeUntil(this.ngUnsubscribe)).subscribe({
      next: (res: any) => {
        this.loadingService.stop();

        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: this.currentId
            ? 'Material request updated successfully'
            : 'Material request created successfully',
        });

        this.CancelClick();
      },

      error: (err) => {
        this.loadingService.stop();

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail:
            err.message ||
            'An error occurred while saving the material request',
        });
      },
    });
  }

  CancelClick() {
    this.location.back();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files?.length) return;

    const file = input.files[0];

    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      alert('File size must not exceed 10MB.');
      input.value = '';
      return;
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'application/pdf'];

    if (!allowedTypes.includes(file.type)) {
      alert('Only PNG, JPG, JPEG, or PDF files are allowed.');
      input.value = '';
      return;
    }

    // this.materialForm.get('attachment')?.patchValue(file);
    // this.materialForm.get('attachment')?.markAsDirty();

    // this.attachmentPreview = URL.createObjectURL(file);

    this.cdr.markForCheck();
  }

  openCatalogDialog() {
    this.catalogDialog = true;
  }

  get selectedInventories() {
    return this.inventorySelections.filter((x: any) => x.selected);
  }

  onInventorySelected(inventory: any) {
    if (inventory.selected) {
      inventory.requestQuantity = inventory.requestQuantity ?? 1;
    } else {
      inventory.requestQuantity = null;
    }
  }

  addSelectedInventories() {
    const invalidItem = this.selectedInventories.find(
      (x: any) =>
        !x.requestQuantity ||
        x.requestQuantity < 1 ||
        x.requestQuantity > x.quantity,
    );

    if (invalidItem) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Invalid Quantity',
        detail: `Requested quantity for ${invalidItem.label} must be between 1 and ${invalidItem.quantity} ${invalidItem.unit}.`,
      });

      return;
    }

    for (const inventory of this.selectedInventories) {
      const alreadyAdded = this.materialItems.controls.some(
        (control) => control.get('inventoryId')?.value === inventory.value,
      );

      if (alreadyAdded) {
        continue;
      }

      this.materialItems.push(
        this.createMaterialItem({
          inventoryId: inventory.value,
          description: inventory.label,
          brand: inventory.brand,
          typeNo: inventory.model,
          unit: inventory.unit,
          quantity: inventory.requestQuantity,
          attachment: inventory.attachment,
        }),
      );
    }

    this.closeCatalogDialog();

    this.cdr.markForCheck();
  }

  closeCatalogDialog() {
    this.catalogDialog = false;
    this.catalogSearch = '';

    this.inventorySelections.forEach((inventory: any) => {
      inventory.selected = false;
      inventory.requestQuantity = null;
    });
  }

  get filteredInventorySelections() {
    const search = this.catalogSearch?.trim().toLowerCase();

    if (!search) {
      return this.inventorySelections;
    }

    return this.inventorySelections.filter((inventory: any) => {
      return [
        inventory.label,
        inventory.itemCode,
        inventory.brand,
        inventory.model,
        inventory.category,
        inventory.status,
      ].some((value) => value?.toString().toLowerCase().includes(search));
    });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
