// import { CommonModule } from '@angular/common';
// import {
//   ChangeDetectionStrategy,
//   ChangeDetectorRef,
//   Component,
//   inject,
//   OnDestroy,
//   OnInit,
//   signal,
// } from '@angular/core';
// import {
//   FormArray,
//   FormBuilder,
//   FormControl,
//   FormGroup,
//   FormsModule,
//   ReactiveFormsModule,
//   Validators,
// } from '@angular/forms';
// import { ActivatedRoute, Router, RouterLink } from '@angular/router';
// import { ButtonModule } from 'primeng/button';
// import { DatePickerModule } from 'primeng/datepicker';
// import { DialogModule } from 'primeng/dialog';
// import { EditorModule } from 'primeng/editor';
// import { InputNumberModule } from 'primeng/inputnumber';
// import { InputTextModule } from 'primeng/inputtext';
// import { SelectModule } from 'primeng/select';
// import { TableModule } from 'primeng/table';
// import { TextareaModule } from 'primeng/textarea';
// import { InvoiceService } from '../../../services/invoiceService.service';
// import { CreateInvoiceRequest } from '../../../models/Invoice';
// import { Subject, takeUntil } from 'rxjs';
// import { ClientDto } from '../../../models/Client';
// import { MessageService } from 'primeng/api';
// import { LoadingService } from '../../../services/loading.service';
// import { ValidateAllFormFields } from '../../../shared/helpers/helpers';
// import { AppService } from '../../../services/appService.service';
// import { ClientService } from '../../../services/ClientService';
// import { SupplierService } from '../../../services/supplierService';

// @Component({
//   selector: 'app-invoice-form',
//   imports: [
//     CommonModule,
//     RouterLink,
//     InputTextModule,
//     DatePickerModule,
//     SelectModule,
//     TableModule,
//     FormsModule,
//     InputNumberModule,
//     ButtonModule,
//     ReactiveFormsModule,
//     DialogModule,
//     EditorModule,
//     TextareaModule,
//   ],
//   template: `
//     <div class="min-h-screen bg-gray-50/50 p-5" [formGroup]="invoiceForm">
//       <div class="mx-auto flex flex-row items-center justify-between mb-3">
//         <nav class="flex items-center gap-2 text-sm text-gray-500">
//           <a
//             routerLink="/dashboard"
//             class="hover:text-blue-600 transition-colors"
//             >Dashboard</a
//           >
//           <i class="pi pi-chevron-right text-[10px]"></i>
//           <a
//             routerLink="/invoices"
//             class="hover:text-blue-600 transition-colors"
//             >Invoices</a
//           >
//           <i class="pi pi-chevron-right text-[10px]"></i>
//           <span class="text-gray-900 font-bold">New Invoice</span>
//         </nav>
//         <div class="flex gap-3">
//           <p-button
//             (onClick)="onPreview()"
//             label="Preview"
//             icon="pi pi-eye"
//             [outlined]="true"
//             severity="secondary"
//             styleClass="!rounded-md !px-4"
//           ></p-button>
//           <p-button
//             (onClick)="onSave(false)"
//             label="Generate Invoice"
//             icon="pi pi-file-pdf"
//             severity="info"
//             styleClass="!rounded-md !px-6 tracking-wide"
//           ></p-button>
//         </div>
//       </div>

//       <div
//         class="mx-auto bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden"
//       >
//         <div class="grid grid-cols-12 gap-8 p-8 border-b border-gray-100">
//           <div class="col-span-12 md:col-span-7 grid grid-cols-2 gap-6">
//             <div class="flex flex-col gap-1.5">
//               <label
//                 class="text-xs font-semibold uppercase tracking-wider text-gray-400"
//                 >Invoice No</label
//               >
//               <input
//                 type="text"
//                 pInputText
//                 formControlName="invoiceNo"
//                 class="!bg-white !border-gray-200"
//                 placeholder="INV-2026-001"
//               />
//               <div
//                 *ngIf="
//                   invoiceForm.get('invoiceNo')?.invalid &&
//                   invoiceForm.get('invoiceNo')?.touched
//                 "
//                 class="text-[13px] tracking-wide text-red-500"
//               >
//                 <span
//                   *ngIf="invoiceForm.get('invoiceNo')?.errors?.['required']"
//                 >
//                   Invoice number is required.
//                 </span>
//               </div>
//             </div>
//             <div class="flex flex-col gap-1.5">
//               <label
//                 class="text-xs font-semibold uppercase tracking-wider text-gray-400"
//                 >Reference</label
//               >
//               <input
//                 type="text"
//                 pInputText
//                 formControlName="referenceNo"
//                 class="!bg-white !border-gray-200"
//               />
//             </div>
//             <div class="flex flex-col gap-1.5">
//               <label
//                 class="text-xs font-semibold uppercase tracking-wider text-gray-400"
//                 >Date</label
//               >
//               <p-datepicker
//                 showIcon="true"
//                 styleClass="w-full"
//                 formControlName="invoiceDate"
//                 iconDisplay="input"
//                 dateFormat="dd/mm/yy"
//               ></p-datepicker>
//               <div
//                 *ngIf="
//                   invoiceForm.get('invoiceDate')?.invalid &&
//                   invoiceForm.get('invoiceDate')?.touched
//                 "
//                 class="text-[13px] tracking-wide text-red-500"
//               >
//                 <span
//                   *ngIf="invoiceForm.get('invoiceDate')?.errors?.['required']"
//                 >
//                   Invoice date is required.
//                 </span>
//               </div>
//             </div>
//             <div class="flex flex-col gap-1.5">
//               <label
//                 class="text-xs font-semibold uppercase tracking-wider text-gray-400"
//                 >Expires On</label
//               >
//               <p-datepicker
//                 showIcon="true"
//                 formControlName="dueDate"
//                 styleClass="w-full"
//                 iconDisplay="input"
//                 dateFormat="dd/mm/yy"
//               ></p-datepicker>
//             </div>
//           </div>

//           <div
//             class="col-span-12 md:col-span-5 flex flex-col items-end justify-center"
//           >
//             <div
//               class="flex items-center gap-4 p-4 bg-white rounded-xl border border-blue-50 shadow-sm"
//             >
//               <img
//                 src="assets/yl-logo.png"
//                 alt="Logo"
//                 class="w-16 h-16 object-contain"
//               />
//               <div>
//                 <h1
//                   class="text-2xl font-black tracking-wide text-blue-900 leading-none"
//                 >
//                   YL Systems
//                 </h1>
//                 <p
//                   class="text-[12px] text-gray-400 uppercase tracking-wide mt-1"
//                 >
//                   ELV Technology Solution Provider
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>

//         <div class="grid grid-cols-1 lg:grid-cols-2 gap-10 p-8">
//           <div class="relative p-6 rounded-xl border border-blue-100">
//             <span
//               class="absolute -top-3 left-4 bg-white px-2 text-xs font-bold text-blue-600 uppercase"
//             >
//               Bill From
//             </span>
//             <div class="flex flex-col gap-1 text-sm text-gray-600">
//               <strong class="text-blue-900 text-base">YL Systems</strong>
//               <p>No. 42, Jln 21/19, Sea Park,</p>
//               <p>46300 Petaling Jaya, Selangor, Malaysia</p>
//               <p class="mt-2">
//                 <i class="pi pi-phone text-[10px]!"></i> +60 3-7877 3929
//               </p>
//               <p>
//                 <i class="pi pi-envelope text-[10px]!"></i>
//                 {{ 'ylsystems@test.com.my' }}
//               </p>
//               <!-- <div
//                 class="mt-2 py-1 px-2 bg-blue-50 text-blue-700 rounded text-[10px] font-bold inline-block w-fit"
//               >
//                 TAX ID: MY-992039-X
//               </div> -->
//             </div>
//           </div>

//           <div
//             class="relative p-6 rounded-xl border border-blue-100 bg-blue-50/10"
//           >
//             <div
//               class="absolute -top-3 left-4 bg-white px-2 flex items-center gap-2"
//             >
//               <span class="text-xs font-bold text-blue-600 uppercase"
//                 >Bill To</span
//               >
//               <button
//                 (click)="AddVendorClientClick()"
//                 class="cursor-pointer text-[12px] text-blue-500 flex items-center gap-2 hover:underline transition-all"
//               >
//                 <i class="pi pi-plus-circle text-[14px]!"></i> Add New
//                 {{ sourceType }}
//               </button>
//             </div>
//             <div class="flex flex-col gap-4">
//               <div class="flex flex-col">
//                 <p-select
//                   [fluid]="true"
//                   [placeholder]="'Search ' + sourceType + ' Name'"
//                   [options]="
//                     sourceType === 'Vendor'
//                       ? vendorSelections
//                       : clientSelections || []
//                   "
//                   [formControlName]="
//                     sourceType === 'Vendor' ? 'supplierId' : 'clientId'
//                   "
//                   (onChange)="BillToOnChange($event)"
//                   [filter]="true"
//                 ></p-select>
//                 <div
//                   *ngIf="
//                     invoiceForm.get('clientId')?.invalid &&
//                     invoiceForm.get('clientId')?.touched
//                   "
//                   class="mt-1 text-[13px] tracking-wide text-red-500"
//                 >
//                   <span
//                     *ngIf="invoiceForm.get('clientId')?.errors?.['required']"
//                   >
//                     Client is required.
//                   </span>
//                 </div>
//               </div>
//               <div
//                 class="min-h-[100px] text-sm text-gray-600 p-2 leading-6"
//                 *ngIf="selectedBillTo"
//               >
//                 <strong>{{
//                   selectedBillTo.label || selectedBillTo.name
//                 }}</strong
//                 ><br />
//                 {{ selectedBillTo.deliveryAddress?.addressLine1 }}<br />
//                 <span *ngIf="selectedBillTo.deliveryAddress?.addressLine2"
//                   >{{ selectedBillTo.deliveryAddress?.addressLine2 }}<br
//                 /></span>
//                 {{ selectedBillTo.deliveryAddress?.poscode }},
//                 {{ selectedBillTo.deliveryAddress?.city }},
//                 {{ selectedBillTo.deliveryAddress?.state }}
//                 {{ selectedBillTo.deliveryAddress?.country }}<br />
//                 {{ selectedBillTo.contactNo }}
//                 <br />{{ selectedBillTo.email }}
//               </div>
//             </div>
//           </div>
//         </div>
//         <div class="border-b border-gray-200 mb-4"></div>

//         <div class="p-8 pt-0">
//           <h3
//             class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"
//           >
//             <i class="pi pi-list text-blue-500"></i> Line Items
//           </h3>
//           <p-table
//             [value]="items.controls"
//             formArrayName="invoiceItems"
//             styleClass="p-datatable-sm custom-table"
//             [tableStyle]="{ 'min-width': '50rem' }"
//             [showGridlines]="true"
//           >
//             <ng-template #header>
//               <tr class="!bg-gray-50">
//                 <th
//                   class="!bg-transparent text-center! text-gray-500 font-semibold w-120"
//                 >
//                   Item Description
//                 </th>
//                 <th
//                   class="!bg-transparent text-center! text-gray-500 font-semibold w-40"
//                 >
//                   Qty
//                 </th>
//                 <th
//                   class="!bg-transparent text-center! text-gray-500 font-semibold w-32"
//                 >
//                   Unit
//                 </th>
//                 <th
//                   class="!bg-transparent text-center! text-gray-500 font-semibold w-48"
//                 >
//                   Rate (RM)
//                 </th>
//                 <th
//                   class="!bg-transparent text-center! text-gray-500 font-semibold w-48"
//                 >
//                   Tax %
//                 </th>
//                 <th
//                   class="!bg-transparent text-center! text-gray-500 font-semibold w-64"
//                 >
//                   Amount
//                 </th>
//                 <th class="!bg-transparent w-32"></th>
//               </tr>
//             </ng-template>
//             <ng-template #body let-item let-i="rowIndex">
//               <tr [formGroupName]="i">
//                 <td>
//                   <textarea
//                     type="text"
//                     pTextarea
//                     formControlName="description"
//                     class="focus:!ring-1 w-full text-[15px]!"
//                     placeholder="Enter service or product..."
//                     [autoResize]="true"
//                   ></textarea>
//                 </td>
//                 <td>
//                   <p-inputnumber
//                     styleClass="text-center!"
//                     formControlName="quantity"
//                     inputStyleClass="!text-center w-full"
//                   ></p-inputnumber>
//                 </td>
//                 <td>
//                   <input
//                     type="text"
//                     pInputText
//                     formControlName="unit"
//                     class="focus:!ring-1 text-center! w-full"
//                   />
//                 </td>
//                 <td>
//                   <p-inputnumber
//                     styleClass="w-full"
//                     formControlName="rate"
//                     inputStyleClass="!text-center w-full"
//                     mode="decimal"
//                     [minFractionDigits]="2"
//                   ></p-inputnumber>
//                 </td>
//                 <td>
//                   <p-inputnumber
//                     styleClass="w-full"
//                     formControlName="taxRate"
//                     inputStyleClass="!text-center w-full"
//                     suffix="%"
//                   ></p-inputnumber>
//                 </td>
//                 <td class="text-center! font-bold text-gray-700 p-3">
//                   {{ item.get('amount').value | number: '1.2-2' }}
//                 </td>
//                 <td class="text-center">
//                   <div class="flex justify-center">
//                     <p-button
//                       (click)="removeItem(i)"
//                       severity="danger"
//                       [text]="true"
//                       styleClass="text-red-300 hover:text-red-500 "
//                     >
//                       <i class="pi pi-trash"></i>
//                     </p-button>
//                   </div>
//                 </td>
//               </tr>
//             </ng-template>
//           </p-table>
//           <button
//             (click)="addItem()"
//             class="mt-4 flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
//           >
//             <i class="pi pi-plus-circle"></i> Add Line Item
//           </button>
//         </div>
//         <div class="border-b border-gray-200"></div>
//         <div class="grid grid-cols-12 gap-8 py-5 px-8 bg-gray-50/50">
//           <div class="col-span-12 lg:col-span-7 pr-[5%]">
//             <div class="pb-2 font-semibold tracking-wide text-gray-700">
//               Extra Information
//             </div>
//             <div class="flex flex-wrap gap-3 mb-4">
//               <div
//                 (click)="selectedTemplate = 'notes'"
//                 [ngClass]="
//                   selectedTemplate === 'notes'
//                     ? 'bg-blue-600 text-white'
//                     : 'cursor-pointer hover:bg-blue-600 hover:text-white border-gray-200 text-gray-500'
//                 "
//                 class="border flex flex-row items-center rounded-sm text-[14px] gap-2 px-4 py-1"
//               >
//                 <i class="pi pi-file text-[13px]!"></i>
//                 <div>Add Notes</div>
//               </div>
//               <div
//                 (click)="applyTemplate('terms')"
//                 [ngClass]="
//                   selectedTemplate === 'terms'
//                     ? 'bg-blue-600 text-white border-blue-600'
//                     : 'cursor-pointer hover:bg-blue-600 hover:text-white border-gray-200 text-gray-500'
//                 "
//                 class="border flex flex-row items-center rounded-sm text-[14px] gap-2 px-4 py-1 transition-colors"
//               >
//                 <i class="pi pi-list text-[13px]!"></i>
//                 <div>Add Terms & Conditions</div>
//               </div>

//               <div
//                 (click)="applyTemplate('bank')"
//                 [ngClass]="
//                   selectedTemplate === 'bank'
//                     ? 'bg-blue-600 text-white border-blue-600'
//                     : 'cursor-pointer hover:bg-blue-600 hover:text-white border-gray-200 text-gray-500'
//                 "
//                 class="border flex flex-row items-center rounded-sm text-[14px] gap-2 px-4 py-1 transition-colors"
//               >
//                 <i class="pi pi-building-columns text-[13px]!"></i>
//                 <div>Bank Details</div>
//               </div>
//             </div>
//             <ng-container *ngIf="selectedTemplate === 'notes'">
//               <label
//                 class="text-xs font-bold uppercase text-gray-400 block mb-2"
//                 >Notes / Terms</label
//               >
//               <textarea
//                 rows="4"
//                 formControlName="description"
//                 class="w-full p-3 border border-gray-200 rounded-lg bg-white text-sm"
//                 placeholder="Any additional notes..."
//               ></textarea>
//             </ng-container>
//             <ng-container *ngIf="selectedTemplate === 'terms'">
//               <label
//                 class="text-xs font-bold uppercase text-gray-400 block mb-2"
//                 >Terms & Conditions</label
//               >
//               <p-editor
//                 formControlName="termsConditions"
//                 [style]="{ height: '320px' }"
//               >
//               </p-editor>
//             </ng-container>
//             <ng-container *ngIf="selectedTemplate === 'bank'">
//               <label
//                 class="text-xs font-bold uppercase text-gray-400 block mb-2"
//                 >Account</label
//               >
//               <p-select appendTo="body" styleClass="w-full!"></p-select>
//             </ng-container>
//           </div>

//           <div class="col-span-12 lg:col-span-5 flex flex-col gap-3">
//             <div class="flex justify-between text-sm text-gray-500 px-2">
//               <span>Subtotal</span>
//               <span>RM {{ subTotal() | number: '1.2-2' }}</span>
//             </div>
//             <div
//               class="flex justify-between items-center text-sm text-gray-500 px-2"
//             >
//               <span class="flex items-center gap-1"
//                 >Discount <i class="pi pi-info-circle text-[10px]"></i
//               ></span>
//               <p-inputnumber
//                 formControlName="discount"
//                 inputStyleClass="!w-20 !py-1 !text-right"
//                 suffix="%"
//               ></p-inputnumber>
//             </div>
//             <div class="h-px bg-gray-200 my-2"></div>
//             <div class="flex justify-between items-center px-2">
//               <span class="text-lg font-bold text-gray-800">Total Amount</span>
//               <span class="text-2xl font-black text-blue-700"
//                 >RM {{ grandTotal() | number: '1.2-2' }}</span
//               >
//             </div>

//             <div class="mt-6">
//               <label
//                 class="text-xs font-bold uppercase text-gray-400 block mb-2 text-right"
//                 >Authorized Signature</label
//               >
//               <input
//                 type="file"
//                 #fileInput
//                 style="display: none"
//                 accept="image/*"
//                 (change)="onFileSelected($event)"
//               />
//               <div
//                 (click)="fileInput.click()"
//                 class="border-2 border-dashed border-gray-200 rounded-xl p-6 bg-white flex flex-col items-center justify-center hover:bg-blue-50/30 hover:border-blue-200 cursor-pointer transition-all"
//               >
//                 <ng-container *ngIf="!signaturePreview">
//                   <i
//                     class="pi pi-cloud-upload text-gray-300 text-3xl! mb-2"
//                   ></i>
//                   <span class="text-sm text-gray-400 tracking-wide"
//                     >Upload signature file</span
//                   >
//                 </ng-container>

//                 <img
//                   *ngIf="signaturePreview"
//                   [src]="signaturePreview"
//                   class="max-h-24 object-contain"
//                 />
//               </div>
//               <input
//                 formControlName="signatureName"
//                 type="text"
//                 pInputText
//                 class="w-full mt-3 !text-center !text-sm"
//                 placeholder="Signatory Name"
//               />
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//     <p-dialog
//       [(visible)]="displayPreview"
//       [modal]="true"
//       [style]="{ width: '850px' }"
//       styleClass="preview-dialog rounded-none!"
//       [maskStyle]="{ 'overflow-y': 'auto' }"
//       appendTo="body"
//     >
//       <ng-template #headless>
//         <div
//           class="flex justify-end items-center p-4 bg-gray-50 border-b border-gray-200 sticky top-0 z-[1102]"
//         >
//           <div class="flex gap-2">
//             <p-button
//               label="Print / Download PDF"
//               icon="pi pi-print"
//               (onClick)="printPreview()"
//               styleClass="py-1.5! p-button-rounded"
//             ></p-button>

//             <p-button
//               icon="pi pi-times"
//               (onClick)="displayPreview = false"
//               styleClass="p-button-rounded p-button-danger"
//             ></p-button>
//           </div>
//         </div>

//         <div class="mb-20 p-10 bg-white" id="invoice-print">
//           <div class="flex justify-between items-start mb-10">
//             <div>
//               <img src="assets/yl-logo.png" class="w-24 mb-3" />
//               <h2 class="text-2xl font-bold text-blue-900">
//                 YL Systems Sdn Bhd
//               </h2>
//               <p class="text-xs text-gray-500 tracking-widest uppercase">
//                 ELV Technology Solution Provider
//               </p>
//             </div>
//             <div class="text-right">
//               <h1 class="text-4xl font-light text-gray-300 mb-2">INVOICE</h1>
//               <p class="font-bold text-lg">
//                 {{ previewData?.invoiceNo || 'DRAFT' }}
//               </p>
//               <p class="text-sm text-gray-600">
//                 Date:
//                 {{
//                   invoiceForm.get('invoiceDate')?.value | date: 'dd MMM yyyy'
//                 }}
//               </p>
//               <p class="text-sm text-gray-600">
//                 Valid Until:
//                 {{ invoiceForm.get('dueDate')?.value | date: 'dd MMM yyyy' }}
//               </p>
//             </div>
//           </div>

//           <div
//             class="flex justify-between items-start mb-10 border-t border-b py-8 border-gray-100"
//           >
//             <div class="w-[45%]">
//               <p class="text-xs font-bold text-blue-600 uppercase mb-3">From</p>
//               <div class="text-sm text-gray-700 leading-relaxed">
//                 <p class="font-bold text-gray-700">YL Systems Sdn Bhd</p>
//                 <p>42, Jln 21/19, Sea Park</p>
//                 <p>46300 Petaling Jaya, Selangor</p>
//                 <p><strong>Contact:</strong> 03-78773929</p>
//               </div>
//             </div>

//             <div class="text-right w-[30%]">
//               <p class="text-xs font-bold text-blue-600 uppercase mb-3">
//                 Bill To
//               </p>
//               <div
//                 class="text-sm text-gray-700 leading-relaxed"
//                 *ngIf="selectedBillTo.name"
//               >
//                 <strong>{{
//                   selectedBillTo.label || selectedBillTo.name
//                 }}</strong
//                 ><br />
//                 {{ selectedBillTo.deliveryAddress?.addressLine1 }}<br />
//                 <span *ngIf="selectedBillTo.deliveryAddress?.addressLine2"
//                   >{{ selectedBillTo.deliveryAddress?.addressLine2 }}<br
//                 /></span>
//                 {{ selectedBillTo.deliveryAddress?.poscode }},
//                 {{ selectedBillTo.deliveryAddress?.city }},
//                 {{ selectedBillTo.state }}
//                 {{ selectedBillTo.deliveryAddress?.country }}<br />
//                 <p><strong>Attn:</strong> {{ selectedBillTo.contactPerson }}</p>
//                 <p><strong>Email:</strong> {{ selectedBillTo.email }}</p>
//               </div>
//             </div>
//           </div>

//           <p-table
//             [value]="previewData?.items"
//             class="w-full"
//             [rowHover]="false"
//             showGridlines
//           >
//             <ng-template #header>
//               <tr class="bg-gray-50">
//                 <th
//                   class="p-3 text-center! text-xs font-bold uppercase bg-gray-100! text-gray-500 border-b"
//                 >
//                   Description
//                 </th>
//                 <th
//                   class="p-3 text-center! text-xs font-bold uppercase bg-gray-100! text-gray-500 border-b"
//                 >
//                   Qty
//                 </th>
//                 <th
//                   class="p-3 text-center! text-xs font-bold uppercase bg-gray-100! text-gray-500 border-b"
//                 >
//                   Unit
//                 </th>
//                 <th
//                   class="p-3 text-center! text-xs font-bold uppercase bg-gray-100! text-gray-500 border-b"
//                 >
//                   Rate (RM)
//                 </th>
//                 <th
//                   class="p-3 text-center! text-xs font-bold uppercase bg-gray-100! text-gray-500 border-b"
//                 >
//                   Tax
//                 </th>
//                 <th
//                   class="p-3 text-center! text-xs font-bold uppercase bg-gray-100! text-gray-500 border-b"
//                 >
//                   Amount (RM)
//                 </th>
//               </tr>
//             </ng-template>
//             <ng-template #body let-item>
//               <tr>
//                 <td class="p-3 border-b! text-sm">{{ item.description }}</td>
//                 <td class="p-3 border-b! text-center! text-sm">
//                   {{ item.quantity }}
//                 </td>
//                 <td class="p-3 border-b! text-center! text-sm">
//                   {{ item.unit }}
//                 </td>
//                 <td class="p-3 border-b! text-center! text-sm">
//                   {{ item.rate | number: '1.2-2' }}
//                 </td>
//                 <td class="p-3 border-b! text-center! text-sm text-gray-400">
//                   {{ item.taxRate }}%
//                 </td>
//                 <td class="p-3 border-b! text-center! text-sm font-semibold">
//                   {{ item.amount | number: '1.2-2' }}
//                 </td>
//               </tr>
//             </ng-template>
//           </p-table>

//           <div class="grid grid-cols-2 gap-10 mt-8">
//             <div class="flex flex-col">
//               <div class="flex flex-col gap-2">
//                 <div class="font-bold text-gray-600">Terms and Conditions</div>
//                 <div
//                   [innerHTML]="previewData.termsConditions"
//                   class="text-sm text-gray-500 text-justify [&_ol]:list-decimal [&_ol]:pl-6"
//                 ></div>
//               </div>
//               <div class="flex flex-col gap-1 mt-5">
//                 <div class="font-bold text-gray-600">Additional Notes</div>
//                 <div class="text-sm text-gray-500 tracking-wide italic">
//                   {{
//                     invoiceForm.get('description')?.value ||
//                       'No additional notes provided.'
//                   }}
//                 </div>
//               </div>
//             </div>
//             <div class="space-y-2 flex justify-end">
//               <div class="flex flex-col gap-2 w-[70%]">
//                 <div class="flex justify-between text-sm">
//                   <span>Sub Total</span>
//                   <span>RM {{ this.subTotal() | number: '1.2-2' }}</span>
//                 </div>
//                 <div class="flex justify-between text-sm text-red-500">
//                   <span>Discount ({{ previewData?.discount }}%)</span>
//                   <span
//                     >-RM
//                     {{
//                       (this.subTotal() * previewData?.discount) / 100
//                         | number: '1.2-2'
//                     }}</span
//                   >
//                 </div>
//                 <div
//                   class="flex justify-between text-lg font-bold border-t-2 pt-2 text-blue-900"
//                 >
//                   <span>Total</span>
//                   <span
//                     >RM {{ previewData?.totalAmount | number: '1.2-2' }}</span
//                   >
//                 </div>

//                 <div class="flex flex-col gap-1 mt-4">
//                   <div class="text-gray-500 text-[14px]">
//                     Invoice Total (in words)
//                   </div>
//                   <div class="font-medium text-[15px] text-gray-600">
//                     {{ amountToWords(previewData?.totalAmount || 0) }}
//                   </div>
//                 </div>

//                 <div
//                   class="mt-12 text-right flex flex-col items-end"
//                   *ngIf="invoiceForm.get('signatureImageUrl')?.value"
//                 >
//                   <img
//                     [src]="invoiceForm.get('signatureImageUrl')?.value"
//                     class="max-w-[180px] border-b border-gray-200 mb-2"
//                   />
//                   <p class="text-sm font-bold">
//                     {{ invoiceForm.get('signatureName')?.value }}
//                   </p>
//                   <p class="text-xs text-gray-400 uppercase tracking-tighter">
//                     Authorized Signature
//                   </p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </ng-template>

//       <ng-template #footer>
//         <p-button
//           label="Close"
//           icon="pi pi-times"
//           severity="danger"
//           [text]="true"
//           (onClick)="displayPreview = false"
//         ></p-button>
//         <p-button
//           label="Print / Download PDF"
//           icon="pi pi-print"
//           (onClick)="printPreview()"
//         ></p-button>
//       </ng-template>
//     </p-dialog>

//     <p-dialog
//       [(visible)]="showVendorClientDialog"
//       [modal]="true"
//       [style]="{ width: '850px' }"
//       styleClass="preview-dialog overflow-hidden rounded-xl!"
//       [maskStyle]="{ 'overflow-y': 'auto' }"
//       appendTo="body"
//     >
//       <ng-template #headless>
//         <div class="bg-gray-50/50 p-6 border-b border-gray-100">
//           <div class="flex items-center gap-3">
//             <div class="bg-blue-100 p-2.5 rounded-lg">
//               <i class="pi pi-user-plus text-blue-600 text-xl"></i>
//             </div>
//             <div>
//               <h2 class="text-xl font-bold text-gray-800 m-0">
//                 Create New Vendor
//               </h2>
//               <p class="text-sm text-gray-500 mt-1">
//                 Fill in the primary details and address information to register
//                 a new vendor.
//               </p>
//             </div>
//           </div>
//         </div>

//         <div class="p-6 max-h-[70vh] overflow-y-auto">
//           <div
//             [formGroup]="clientVendorForm"
//             class="grid grid-cols-12 gap-x-4 gap-y-3 text-[14px]"
//           >
//             <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
//               <label class="font-medium text-gray-700"
//                 >Vendor Name <span class="text-red-500">*</span></label
//               >
//               <input
//                 type="text"
//                 pInputText
//                 class="w-full!"
//                 formControlName="name"
//                 placeholder="e.g. Acme Corp"
//               />
//             </div>
//             <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
//               <label class="font-medium text-gray-700">Email Address</label>
//               <input
//                 type="text"
//                 pInputText
//                 class="w-full!"
//                 formControlName="email"
//                 placeholder="client@example.com"
//               />
//             </div>
//             <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
//               <label class="font-medium text-gray-700">Contact Number</label>
//               <input
//                 type="text"
//                 pInputText
//                 class="w-full!"
//                 formControlName="contactNo"
//               />
//             </div>
//             <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
//               <label class="font-medium text-gray-700">Contact Person</label>
//               <input
//                 type="text"
//                 pInputText
//                 class="w-full!"
//                 formControlName="contactPerson"
//               />
//             </div>

//             <div class="col-span-12 border-t border-gray-100 pt-4 mt-2">
//               <div class="flex items-center gap-2 mb-3">
//                 <i class="pi pi-file text-gray-400"></i>
//                 <span
//                   class="font-bold text-gray-800 uppercase tracking-wider text-xs"
//                   >Billing Address</span
//                 >
//               </div>
//             </div>

//             <div
//               formGroupName="billingAddress"
//               class="col-span-12 grid grid-cols-12 gap-3"
//             >
//               <div class="col-span-12 flex flex-col gap-1.5">
//                 <label class="text-gray-600">Address Line 1</label>
//                 <input
//                   pInputText
//                   formControlName="addressLine1"
//                   class="w-full!"
//                 />
//               </div>
//               <div class="col-span-12 flex flex-col gap-1.5">
//                 <label class="text-gray-600">Address Line 2</label>
//                 <input
//                   pInputText
//                   formControlName="addressLine2"
//                   class="w-full!"
//                 />
//               </div>
//               <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
//                 <label class="text-gray-600">City</label>
//                 <input pInputText formControlName="city" class="w-full!" />
//               </div>
//               <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
//                 <label class="text-gray-600">Postcode</label>
//                 <input pInputText formControlName="poscode" class="w-full!" />
//               </div>
//               <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
//                 <label class="text-gray-600">State</label>
//                 <input pInputText formControlName="state" class="w-full!" />
//               </div>
//               <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
//                 <label class="text-gray-600">Country</label>
//                 <input pInputText formControlName="country" class="w-full!" />
//               </div>
//             </div>

//             <div
//               class="col-span-12 border-t border-gray-100 pt-4 mt-4 flex justify-between items-center"
//             >
//               <div class="flex items-center gap-2">
//                 <i class="pi pi-truck text-gray-400"></i>
//                 <span
//                   class="font-bold text-gray-800 uppercase tracking-wider text-xs"
//                   >Delivery Address</span
//                 >
//               </div>
//               <div
//                 class="flex items-center gap-2 text-sm bg-gray-100 px-3 py-1 rounded-full cursor-pointer hover:bg-gray-200 transition-colors"
//               >
//                 <input
//                   type="checkbox"
//                   formControlName="sameAsBilling"
//                   id="sameAsBilling"
//                   class="cursor-pointer"
//                 />
//                 <label
//                   for="sameAsBilling"
//                   class="cursor-pointer font-medium text-gray-600 text-xs"
//                   >Same as Billing</label
//                 >
//               </div>
//             </div>

//             <div
//               formGroupName="deliveryAddress"
//               class="col-span-12 grid grid-cols-12 gap-3"
//             >
//               <div class="col-span-12 flex flex-col gap-1.5">
//                 <label class="text-gray-600">Address Line 1</label>
//                 <input
//                   pInputText
//                   formControlName="addressLine1"
//                   class="w-full!"
//                 />
//               </div>
//               <div class="col-span-12 flex flex-col gap-1.5">
//                 <label class="text-gray-600">Address Line 2</label>
//                 <input
//                   pInputText
//                   formControlName="addressLine2"
//                   class="w-full!"
//                 />
//               </div>
//               <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
//                 <label class="text-gray-600">City</label>
//                 <input pInputText formControlName="city" class="w-full!" />
//               </div>
//               <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
//                 <label class="text-gray-600">Postcode</label>
//                 <input pInputText formControlName="poscode" class="w-full!" />
//               </div>
//               <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
//                 <label class="text-gray-600">State</label>
//                 <input pInputText formControlName="state" class="w-full!" />
//               </div>
//               <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
//                 <label class="text-gray-600">Country</label>
//                 <input pInputText formControlName="country" class="w-full!" />
//               </div>
//             </div>

//             <div
//               class="col-span-12 p-4 bg-blue-50/50 border border-blue-100 rounded-lg text-blue-700 text-center text-sm flex items-center justify-center gap-2 mt-2"
//               *ngIf="clientVendorForm.get('sameAsBilling')?.value"
//             >
//               <i class="pi pi-info-circle"></i>
//               System will use the billing address for delivery.
//             </div>
//           </div>
//         </div>

//         <div
//           class="p-4 bg-gray-50 border-t border-gray-100 flex justify-end items-center gap-3"
//         >
//           <p-button
//             (onClick)="showVendorClientDialog = false"
//             label="Discard"
//             severity="secondary"
//             styleClass="px-6 py-2! border-gray-200!"
//           ></p-button>

//           <p-button
//             (onClick)="AddNewVendorClient()"
//             label="Create Client"
//             severity="info"
//             [disabled]="clientVendorForm.invalid"
//             styleClass="px-8 py-2! shadow-sm"
//           ></p-button>
//         </div>
//       </ng-template>
//     </p-dialog>
//   `,
//   styleUrl: './invoice-form.less',
//   changeDetection: ChangeDetectionStrategy.OnPush,
// })
// export class InvoiceForm implements OnInit, OnDestroy {
//   private readonly router = inject(Router);
//   private readonly fb = inject(FormBuilder);
//   private readonly cdr = inject(ChangeDetectorRef);
//   private readonly appService = inject(AppService);
//   private readonly clientService = inject(ClientService);
//   private readonly messageService = inject(MessageService);
//   private readonly invoiceService = inject(InvoiceService);
//   private readonly activatedRoute = inject(ActivatedRoute);
//   private readonly loadingService = inject(LoadingService);
//   private readonly supplierService = inject(SupplierService);

//   protected ngUnsubscribe: Subject<void> = new Subject<void>();

//   private destroy$ = new Subject<void>();

//   invoiceForm!: FormGroup;
//   currentId: string = '';
//   sourceType: 'Vendor' | 'Client' = 'Client';
//   signaturePreview: string | null = null;

//   displayPreview: boolean = false;
//   showVendorClientDialog: boolean = false;
//   showClientDialog: boolean = false;

//   clientVendorForm!: FormGroup;

//   previewData: any = null;

//   clientSelections: any[] = [];
//   vendorSelections: any[] = [];

//   selectedBillTo: any;
//   selectedTemplate: string = 'notes';

//   // Totals as signals for performance
//   subTotal = signal(0);
//   taxTotal = signal(0);
//   grandTotal = signal(0);

//   ngOnInit() {
//     this.currentId = this.activatedRoute.snapshot.queryParams['id'] || null;
//     this.sourceType = this.activatedRoute.snapshot.queryParams['source'];
//     const data = this.appService.getData()?.data;

//     this.initForm();
//     this.getDropdown();

//     if (data) {
//       // 1. Patch the basic top-level fields
//       this.invoiceForm.patchValue({
//         ...data,
//         referenceNo: data.poNo,
//         supplierId: data.supplierId,
//         clientId: data.clientId,
//         discount: data.discountRate || 0, // Mapping discountRate to discount
//         totalAmount: data.totalAmount,
//       });

//       this.selectedBillTo = data.supplier ?? data.client;

//       this.grandTotal.set(data.totalAmount);

//       // 2. Clear and Patch the FormArray
//       const itemsArray = this.invoiceForm.get('invoiceItems') as FormArray;

//       // Clear existing items (like the default one created in initForm)
//       while (itemsArray.length) {
//         itemsArray.removeAt(0);
//       }

//       // 3. Map poItems to the Invoice Items structure
//       if (data.poItems && data.poItems.length > 0) {
//         data.poItems.forEach((poItem: any) => {
//           itemsArray.push(
//             this.fb.group({
//               description: [poItem.description],
//               quantity: [poItem.quantity],
//               unit: [poItem.unit || 'Unit'],
//               rate: [poItem.rate],
//               taxRate: [poItem.taxRate || 0],
//               amount: [poItem.amount],
//             }),
//           );
//         });
//       }

//       this.cdr.markForCheck();
//     }

//     if (this.currentId) {
//       this.loadInvoice();
//     }

//     // Auto-calculate whenever items or discount change
//     this.invoiceForm.valueChanges
//       .pipe(takeUntil(this.destroy$))
//       .subscribe(() => this.calculateTotals());
//   }

//   getDropdown() {
//     this.loadingService.start();
//     this.invoiceService.GetDropdown().subscribe({
//       next: (res) => {
//         this.loadingService.stop();
//         this.clientSelections = res.clients.map((x: ClientDto) => {
//           const activeAddress = x.deliveryAddress ?? x.billingAddress;

//           return {
//             label: x.name,
//             value: x.id,
//             email: x.email,
//             contactNo: x.contactNo,
//             contactPerson: x.contactPerson,
//             addressType: x.deliveryAddress ? 'Delivery' : 'Billing', // Optional: track which one is being shown
//             deliveryAddress: {
//               addressLine1: activeAddress.addressLine1,
//               addressLine2: activeAddress.addressLine2,
//               city: activeAddress.city,
//               poscode: activeAddress.poscode,
//               state: activeAddress.state,
//               country: activeAddress.country,
//             },
//           };
//         });
//         this.vendorSelections = res.suppliers.map((x: ClientDto) => {
//           const activeAddress = x.deliveryAddress ?? x.billingAddress;

//           return {
//             label: x.name,
//             value: x.id,
//             email: x.email,
//             contactNo: x.contactNo,
//             contactPerson: x.contactPerson,
//             addressType: x.deliveryAddress ? 'Delivery' : 'Billing', // Optional: track which one is being shown
//             deliveryAddress: {
//               addressLine1: activeAddress.addressLine1,
//               addressLine2: activeAddress.addressLine2,
//               city: activeAddress.city,
//               poscode: activeAddress.poscode,
//               state: activeAddress.state,
//               country: activeAddress.country,
//             },
//           };
//         });
//         this.cdr.markForCheck();
//       },
//       error: (err) => {
//         this.loadingService.stop();
//       },
//     });
//   }

//   BillToOnChange(event: any) {
//     const selectedId = event.value;

//     const list =
//       this.sourceType !== 'Vendor'
//         ? this.clientSelections
//         : this.vendorSelections;
//     this.selectedBillTo = list.find((x) => x.value === selectedId);
//     this.cdr.markForCheck();
//   }

//   private initForm() {
//     this.invoiceForm = this.fb.group({
//       invoiceNo: ['', Validators.required],
//       referenceNo: [null],
//       invoiceDate: [new Date(), Validators.required],
//       dueDate: [
//         new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
//         Validators.required,
//       ],
//       clientId: [null],
//       supplierId: [null],
//       discount: [0],
//       description: [null],
//       termsConditions: [null],
//       bankDetails: [null],
//       signatureName: [null],
//       signatureImageUrl: [null],
//       totalAmount: null,
//       invoiceItems: this.fb.array([this.createItem()]),
//     });
//   }

//   get items() {
//     return this.invoiceForm.get('invoiceItems') as FormArray;
//   }

//   createItem(): FormGroup {
//     return this.fb.group({
//       id: null,
//       description: ['', Validators.required],
//       quantity: [1, [Validators.required, Validators.min(1)]],
//       unit: ['Unit'],
//       rate: [0, [Validators.required, Validators.min(0)]],
//       taxRate: [0],
//       amount: 0,
//     });
//   }

//   addItem(item?: any) {
//     const newItemGroup = this.createItem();

//     // If data is passed (from loadQuotation), populate the group
//     if (item) {
//       newItemGroup.patchValue({
//         id: item.id || null,
//         description: item.description,
//         quantity: item.quantity,
//         unit: item.unit,
//         rate: item.rate,
//         taxRate: item.taxRate || 0,
//         amount: item.amount,
//       });
//     }

//     this.items.push(newItemGroup);
//   }

//   removeItem(index: number) {
//     if (this.items.length > 1) {
//       this.items.removeAt(index);
//     }
//   }

//   calculateTotals() {
//     let sub = 0;
//     let tax = 0;

//     this.items.controls.forEach((control) => {
//       const qty = control.get('quantity')?.value || 0;
//       const rate = control.get('rate')?.value || 0;
//       const taxRate = control.get('taxRate')?.value || 0;

//       const lineTotal = qty * rate;
//       const lineTax = lineTotal * (taxRate / 100);
//       const finalLineAmount = lineTotal + lineTax;

//       control.get('amount')?.setValue(finalLineAmount, { emitEvent: false });

//       sub += lineTotal;
//       tax += lineTax;
//     });

//     const discountPercent = this.invoiceForm.get('discount')?.value || 0;

//     const discountAmount = sub * (discountPercent / 100);

//     this.subTotal.set(sub);
//     this.taxTotal.set(tax);
//     this.grandTotal.set(sub + tax - discountAmount);

//     // ✅ Keep form totalAmount in sync
//     this.invoiceForm
//       .get('totalAmount')
//       ?.setValue(this.grandTotal(), { emitEvent: false });
//   }

//   onSave(isDraft: boolean = false) {
//     ValidateAllFormFields(this.invoiceForm);
//     if (this.invoiceForm.invalid) {
//       this.messageService.add({
//         severity: 'error',
//         summary: 'Error',
//         detail: 'Please fill all required fields',
//       });
//       return;
//     }

//     const formValue = this.invoiceForm.getRawValue();
//     const request: CreateInvoiceRequest = {
//       ...formValue,
//       isDraft: isDraft,
//       subTotal: this.subTotal(),
//       tax: this.taxTotal(),
//       totalAmount: this.grandTotal(),
//     };

//     const action$ = this.currentId
//       ? this.invoiceService.Update({
//           ...request,
//           id: this.currentId!,
//         } as any)
//       : this.invoiceService.Create(request);

//     action$.subscribe(() => {
//       this.messageService.add({
//         severity: 'success',
//         summary: 'Success',
//         detail: 'Invoice Saved',
//       });
//       this.router.navigate(['/invoices']);
//     });
//   }

//   onPreview() {
//     if (this.invoiceForm.invalid) {
//       this.messageService.add({
//         severity: 'warn',
//         summary: 'Validation',
//         detail: 'Please complete the form first',
//       });
//       return;
//     }

//     this.loadingService.start();
//     // Use getRawValue() to include disabled fields like 'totalAmount'
//     // this.invoiceService
//     //   .Preview(this.invoiceForm.getRawValue())
//     //   .pipe(takeUntil(this.destroy$))
//     //   .subscribe({
//     //     next: (res) => {
//     //       this.previewData = res;
//     //       this.displayPreview = true;
//     //       this.cdr.markForCheck();

//     //       this.loadingService.stop();
//     //     },
//     //     error: () => this.loadingService.stop(),
//     //   });
//   }

//   applyTemplate(type: 'notes' | 'terms' | 'bank') {
//     this.selectedTemplate = type;

//     this.cdr.detectChanges();
//   }

//   private loadInvoice() {
//     this.loadingService.start();
//     this.invoiceService
//       .GetOne({
//         Page: 1,
//         PageSize: 1,
//         OrderBy: null,
//         Select: null,
//         Filter: this.currentId, // Simplify this if you use the fixed C# logic above
//         Includes:
//           'Client.BillingAddress,Client.DeliveryAddress,Supplier.BillingAddress,Supplier.DeliveryAddress,InvoiceItems', // Make sure to include Items!
//       })
//       .pipe(takeUntil(this.ngUnsubscribe))
//       .subscribe({
//         next: (res) => {
//           this.loadingService.stop();
//           if (res) {
//             if (res.signatureImageUrl) {
//               this.signaturePreview = res.signatureImageUrl;
//             }
//             // 1. Clear existing items
//             while (this.items.length !== 0) {
//               this.items.removeAt(0);
//             }

//             // 2. Build the FormArray based on the data received
//             if (res.invoiceItems && res.invoiceItems.length > 0) {
//               res.invoiceItems.forEach((item: any) => {
//                 this.addItem(item); // Use your existing addItem logic
//               });
//             }

//             this.selectedBillTo = res.client ?? res.supplier;

//             // 3. Patch the rest of the form
//             this.invoiceForm.patchValue({
//               ...res,
//               invoiceDate: new Date(res.invoiceDate),
//               dueDate: new Date(res.dueDate),
//               discount: res.discountRate,
//             });
//           }

//           this.sourceType = res?.supplierId ? 'Vendor' : 'Client';
//           this.cdr.markForCheck();
//         },
//         error: () => this.loadingService.stop(),
//       });
//   }

//   printPreview() {
//     this.displayPreview = false;
//     const printContents = document.getElementById('invoice-print');

//     if (!printContents) return;

//     const originalContents = document.body.innerHTML;
//     const printHtml = printContents.innerHTML;

//     // Temporarily replace body content with the dialog content
//     document.body.innerHTML = printHtml;

//     window.print();

//     // Restore original body content after printing
//     document.body.innerHTML = originalContents;

//     // Re-run Angular change detection to re-bind everything
//     this.cdr.detectChanges();
//   }

//   onFileSelected(event: any) {
//     const file = event.target.files[0];
//     if (file) {
//       const reader = new FileReader();

//       reader.onload = (e: any) => {
//         const base64String = e.target.result;

//         this.signaturePreview = base64String;

//         this.invoiceForm.patchValue({
//           signatureImageUrl: base64String,
//         });

//         this.cdr.markForCheck();
//       };

//       reader.readAsDataURL(file);
//     }
//   }

//   amountToWords(amount: number): string {
//     if (amount === 0) return 'ZERO ONLY';

//     const units = [
//       '',
//       'ONE',
//       'TWO',
//       'THREE',
//       'FOUR',
//       'FIVE',
//       'SIX',
//       'SEVEN',
//       'EIGHT',
//       'NINE',
//     ];
//     const teens = [
//       'TEN',
//       'ELEVEN',
//       'TWELVE',
//       'THIRTEEN',
//       'FOURTEEN',
//       'FIFTEEN',
//       'SIXTEEN',
//       'SEVENTEEN',
//       'EIGHTEEN',
//       'NINETEEN',
//     ];
//     const tens = [
//       '',
//       '',
//       'TWENTY',
//       'THIRTY',
//       'FORTY',
//       'FIFTY',
//       'SIXTY',
//       'SEVENTY',
//       'EIGHTY',
//       'NINETY',
//     ];
//     const scales = ['', 'THOUSAND', 'MILLION', 'BILLION'];

//     const convertSection = (num: number): string => {
//       let n = Math.floor(num);
//       let str = '';
//       if (n >= 100) {
//         str += units[Math.floor(n / 100)] + ' HUNDRED ';
//         n %= 100;
//       }
//       if (n >= 10 && n <= 19) {
//         str += teens[n - 10] + ' ';
//       } else if (n >= 20 || n <= 9) {
//         str += tens[Math.floor(n / 10)] + ' ' + units[n % 10] + ' ';
//       }
//       return str.trim();
//     };

//     let integerPart = Math.floor(amount);
//     let decimalPart = Math.round((amount - integerPart) * 100);
//     let words = '';
//     let scaleIndex = 0;

//     while (integerPart > 0) {
//       let section = integerPart % 1000;
//       if (section > 0) {
//         words =
//           convertSection(section) + ' ' + scales[scaleIndex] + ' ' + words;
//       }
//       integerPart = Math.floor(integerPart / 1000);
//       scaleIndex++;
//     }

//     let finalResult = words.trim() + ' RINGGIT';

//     if (decimalPart > 0) {
//       finalResult += ' AND CENTS ' + convertSection(decimalPart);
//     }

//     return finalResult.trim() + ' ONLY';
//   }

//   AddVendorClientClick() {
//     this.clientVendorForm = new FormGroup({
//       name: new FormControl<string | null>(null, Validators.required),
//       email: new FormControl<string | null>(null, [Validators.email]),
//       contactNo: new FormControl<string | null>(null, Validators.required),
//       contactPerson: new FormControl<string | null>(null),

//       sameAsBilling: new FormControl(false),
//       // Create nested group for billing address
//       billingAddress: new FormGroup({
//         name: new FormControl('Billing'),
//         addressLine1: new FormControl(null, Validators.required),
//         addressLine2: new FormControl(null),
//         city: new FormControl(null, Validators.required),
//         state: new FormControl(null, Validators.required),
//         poscode: new FormControl(null, Validators.required),
//         country: new FormControl('Malaysia', Validators.required),
//       }),

//       deliveryAddress: new FormGroup({
//         name: new FormControl('Delivery'),
//         addressLine1: new FormControl(null, Validators.required),
//         addressLine2: new FormControl(null),
//         city: new FormControl(null, Validators.required),
//         state: new FormControl(null, Validators.required),
//         poscode: new FormControl(null, Validators.required),
//         country: new FormControl('Malaysia', Validators.required),
//       }),
//     });

//     this.clientVendorForm
//       .get('sameAsBilling')
//       ?.valueChanges.subscribe((checked) => {
//         if (checked) {
//           const billingValue =
//             this.clientVendorForm.get('billingAddress')?.value;
//           this.clientVendorForm.get('deliveryAddress')?.patchValue({
//             ...billingValue,
//             name: 'Delivery', // Keep the name as Delivery
//           });
//         }
//       });

//     this.showVendorClientDialog = true;
//   }

//   AddNewVendorClient() {
//     ValidateAllFormFields(this.clientVendorForm);

//     if (!this.clientVendorForm.valid) return;

//     this.loadingService.start();

//     const $request =
//       this.sourceType === 'Vendor'
//         ? this.supplierService.Create(this.clientVendorForm.value)
//         : this.clientService.Create(this.clientVendorForm.value);

//     $request.pipe(takeUntil(this.ngUnsubscribe)).subscribe({
//       next: (res) => {
//         this.loadingService.stop();
//         const activeAddress = res.deliveryAddress ?? res.billingAddress;
//         const newData = {
//           label: res.name || this.clientVendorForm.value.name,
//           value: res.id,
//           email: res.email,
//           contactNo: res.contactNo,
//           addressType: res.deliveryAddress ? 'Delivery' : 'Billing', // Optional: track which one is being shown
//           deliveryAddress: {
//             addressLine1: activeAddress.addressLine1,
//             addressLine2: activeAddress.addressLine2,
//             city: activeAddress.city,
//             poscode: activeAddress.poscode,
//             state: activeAddress.state,
//             country: activeAddress.country,
//           },
//         };

//         if (this.sourceType === 'Vendor') {
//           this.vendorSelections = [...this.vendorSelections, newData];
//           this.clientVendorForm.get('supplierId')?.setValue(res.id);
//         } else {
//           this.clientSelections = [...this.clientSelections, newData];
//           this.clientVendorForm.get('clientId')?.setValue(res.id);
//         }

//         this.messageService.add({
//           severity: 'success',
//           summary: 'Success',
//           detail: `${this.sourceType} created and selected successfully`,
//           life: 3000,
//         });

//         this.showVendorClientDialog = false;
//         this.clientVendorForm.reset();
//         this.cdr.detectChanges();
//       },
//       error: (err) => {
//         this.loadingService.stop();

//         this.messageService.add({
//           severity: 'error',
//           summary: 'Error',
//           detail:
//             err.error?.message ||
//             `Failed to create ${this.sourceType}. Please try again.`,
//           life: 5000,
//         });

//         this.cdr.markForCheck();
//       },
//     });
//   }

//   ngOnDestroy() {
//     this.destroy$.next();
//     this.destroy$.complete();
//     this.ngUnsubscribe.next();
//     this.ngUnsubscribe.complete();
//     this.loadingService.stop();
//   }
// }
