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
// import { QuotationService } from '../../../services/quotationService.service';
// import { ActivatedRoute, Router, RouterLink } from '@angular/router';
// import { InputTextModule } from 'primeng/inputtext';
// import { DatePickerModule } from 'primeng/datepicker';
// import { SelectModule } from 'primeng/select';
// import { TableModule } from 'primeng/table';
// import {
//   FormArray,
//   FormBuilder,
//   FormControl,
//   FormGroup,
//   FormsModule,
//   ReactiveFormsModule,
//   Validators,
// } from '@angular/forms';
// import { InputNumberModule } from 'primeng/inputnumber';
// import { ButtonModule } from 'primeng/button';
// import { MessageService } from 'primeng/api';
// import { Subject, takeUntil } from 'rxjs';
// import { CreateQuotationRequest } from '../../../models/Quotation';
// import { LoadingService } from '../../../services/loading.service';
// import { DialogModule } from 'primeng/dialog';
// import { ClientService } from '../../../services/ClientService';
// import { ValidateAllFormFields } from '../../../shared/helpers/helpers';
// import { EditorModule } from 'primeng/editor';
// import { ClientDto } from '../../../models/Client';
// import { TextareaModule } from 'primeng/textarea';
// import { UserService } from '../../../services/userService.service';
// import { ProjectService } from '../../../services/ProjectService';
// import { ProjectDto } from '../../../models/Project';

// @Component({
//   selector: 'app-quotation-form',
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
//     <div class="min-h-screen bg-gray-50/50 p-5" [formGroup]="quotationForm">
//       <div class="mx-auto flex flex-row items-center justify-between mb-3">
//         <nav class="flex items-center gap-2 text-sm text-gray-500">
//           <a
//             routerLink="/dashboard"
//             class="hover:text-blue-600 transition-colors"
//             >Dashboard</a
//           >
//           <i class="pi pi-chevron-right text-[10px]"></i>
//           <a
//             routerLink="/purchase-orders"
//             class="hover:text-blue-600 transition-colors"
//             >Purchase Orders</a
//           >
//           <i class="pi pi-chevron-right text-[10px]"></i>
//           <span class="text-gray-900 font-bold">New Purchase Order</span>
//         </nav>
//       </div>
//       <div
//         class="p-2 bg-white shadow-sm border border-gray-200 mb-2 flex flex-row items-center justify-end gap-2"
//       >
//         <p-button
//           (onClick)="onSave()"
//           label="Save PO"
//           styleClass="bg-blue-500!"
//           severity="info"
//           icon="pi pi-save"
//           size="small"
//         ></p-button>
//         <p-button
//           (onClick)="downloadPDF()"
//           label="Download PO"
//           severity="danger"
//           icon="pi pi-download"
//           size="small"
//         ></p-button>
//       </div>
//       <div
//         id="print-area"
//         class="border border-gray-200  shadow-sm bg-white w-full p-5 grid grid-cols-12"
//       >
//         <div class="col-span-8 flex flex-row gap-3">
//           <div class="flex items-center justify-center">
//             <img src="assets/yl-logo.png" alt="" class="w-[130px] h-[80px]" />
//           </div>
//           <div class="flex flex-col">
//             <div class="flex flex-row items-end gap-2">
//               <div class="font-semibold text-[20px]">YL SYSTEMS SDN BHD</div>
//               <div class="text-[10px] mb-1">(200001006138(508743-P))</div>
//             </div>
//             <div class="text-[13px]">
//               42, Jalan 21/19, 46300 Petaling Jaya, Selangor
//             </div>
//             <div class="flex flex-row items-center gap-3 text-[13px]">
//               <div>Phone: 03-7877 3929</div>
//               <div>Fax: 03-7877 8595</div>
//             </div>
//             <div class="text-[13px]">Website: www.ylsystems.com.my</div>
//             <div class="flex flex-row items-center gap-3 text-[11px]">
//               <div>TIN No: C10626737100</div>
//               <div>SST Reg No: W10-2510-3200030</div>
//             </div>
//           </div>
//         </div>
//         <div class="text-xs col-span-4 flex flex-col items-end gap-1">
//           <div>{{ today | date: 'dd/mm/yy hh:mm aa' }}</div>
//           <div class="uppercase text-[9px]">{{ name }}</div>
//         </div>
//         <div class="mt-8 col-span-7 lg:col-span-8 flex flex-col">
//           <div class="flex flex-col">
//             <p-select
//               [fluid]="true"
//               styleClass="lg:w-[60%]"
//               panelStyleClass="text-[15px]"
//               [options]="clientSelections || []"
//               formControlName="clientId"
//               (onChange)="ClientOnChange($event)"
//               [filter]="true"
//             ></p-select>
//             <div
//               *ngIf="
//                 quotationForm.get('clientId')?.invalid &&
//                 quotationForm.get('clientId')?.touched
//               "
//               class="mt-1 text-[13px] tracking-wide text-red-500"
//             >
//               <span *ngIf="quotationForm.get('clientId')?.errors?.['required']">
//                 Client is required.
//               </span>
//             </div>
//             <p-button
//               label="Add New Client"
//               [text]="true"
//               size="small"
//               severity="info"
//               icon="pi pi-plus-circle"
//               (onClick)="AddClientClick()"
//             ></p-button>
//           </div>
//           <div class=" mt-2 flex flex-col text-[13px]" *ngIf="selectedClient">
//             <strong>{{ selectedClient.label || selectedClient.name }} </strong>
//             <div>
//               {{ selectedClient.deliveryAddress?.addressLine1 }}
//             </div>
//             <div *ngIf="selectedClient.deliveryAddress?.addressLine2">
//               {{ selectedClient.deliveryAddress?.addressLine2 }}
//               <br />
//             </div>
//             <div class="flex flex-row items-center gap-1">
//               {{ selectedClient.deliveryAddress?.poscode }}
//               ,{{ selectedClient.deliveryAddress?.city }},
//               {{ selectedClient.state }}
//               {{ selectedClient.deliveryAddress?.country }}
//             </div>

//             <div class="mt-5 flex flex-col">
//               <div class="grid grid-cols-[70px_10px_1fr] text-[11px] gap-y-0.5">
//                 <div>Attn</div>
//                 <div>:</div>
//                 <div>
//                   {{ selectedClient.contactPerson }}
//                 </div>

//                 <div>TEL</div>
//                 <div>:</div>
//                 <div>{{ selectedClient.contactNo }}</div>

//                 <div>FAX</div>
//                 <div>:</div>
//                 <div>{{ selectedClient.faxNo }}</div>

//                 <div>A/C NO</div>
//                 <div>:</div>
//                 <div>{{ selectedClient.acNo }}</div>
//               </div>
//             </div>
//           </div>
//         </div>
//         <div class="mt-8 col-span-5 lg:col-span-4 flex flex-col gap-2 pl-2">
//           <div class="border w-full h-full flex flex-col">
//             <div class="text-center font-bold text-xl py-2 border-b">
//               QUOTATION
//             </div>
//             <div class="text-[12px] p-2">
//               Please quote this number on all correspondence
//             </div>
//             <div
//               class="grid grid-cols-[70px_10px_1fr] p-2 text-[13px] gap-y-0.5 items-center border-b"
//             >
//               <div>NO.</div>
//               <div>:</div>
//               <input
//                 type="text"
//                 pInputText
//                 class="flex-1"
//                 formControlName="quotationNo"
//               />
//             </div>
//             <div
//               class="grid grid-cols-[70px_10px_1fr] p-2 text-[13px] gap-y-0.5 items-center"
//             >
//               <div>DATE</div>
//               <div>:</div>
//               <p-datepicker
//                 [showIcon]="true"
//                 styleClass="w-full!"
//                 appendTo="body"
//                 dateFormat="dd/mm/yy"
//                 formControlName="quotationDate"
//                 inputStyleClass="text-[13px]!"
//               ></p-datepicker>
//               <div>TERMS</div>
//               <div>:</div>
//               <input
//                 pInputText
//                 type="text"
//                 formControlName="terms"
//                 class="flex-1! text-[13px]!"
//               />
//               <div>PROJECT</div>
//               <div>:</div>
//               <p-select
//                 styleClass="flex-1!"
//                 appendTo="body"
//                 [options]="projectSelection"
//                 formControlName="projectId"
//                 inputStyleClass="text-[13px]!"
//                 panelStyleClass="text-[13px]!"
//                 [filter]="true"
//               ></p-select>
//               <div>PAGE</div>
//               <div>:</div>
//               <input
//                 class="flex-1! text-[13px]! cursor-pointer bg-gray-100!"
//                 pInputText
//                 type="text"
//                 formControlName="page"
//                 readonly
//               />
//             </div>
//           </div>
//         </div>
//         <div class="col-span-12 border-b mt-3 mb-3"></div>
//         <div class="col-span-12 flex flex-col gap-1">
//           <div class="text-[13px]">
//             Please supply and pack in the most suitable manner for shipment to:
//           </div>
//           <div class="text-[13px] flex flex-row items-center gap-2">
//             <div>Quotation NO:</div>
//           </div>
//           <div
//             class="text-[13px] flex flex-row items-center gap-2 border-b pb-2"
//           >
//             <div>SO NO:</div>
//           </div>
//           <div class="col-span-12">
//             <p-table [value]="items.controls" formArrayName="items">
//               <ng-template #header>
//                 <tr>
//                   <th
//                     class="border-b! border-black! text-black! text-center! font-normal! text-[13px]! w-[20%]!"
//                   >
//                     ITEM
//                   </th>
//                   <th
//                     class="border-b! border-black! text-black! text-center! font-normal! text-[13px]! w-[30%]!"
//                   >
//                     DESCRIPTION
//                   </th>
//                   <th
//                     class="border-b! border-black! text-black! text-center! font-normal! text-[13px]! w-[5%]!"
//                   >
//                     QTY
//                   </th>
//                   <th
//                     class="border-b! border-black! text-black! text-center! font-normal! text-[13px]! w-[10%]!"
//                   >
//                     UNIT
//                   </th>
//                   <th
//                     class="border-b! border-black! text-black! text-center! font-normal! text-[13px]! w-[15%]!"
//                   >
//                     U.PRICE (RM)
//                   </th>
//                   <th
//                     class="border-b! border-black! text-black! text-center! font-normal! text-[13px]! w-[5%]!"
//                   >
//                     DISC
//                   </th>
//                   <th
//                     class="border-b! border-black! text-black! text-center! font-normal! text-[13px]! w-[15%]!"
//                   >
//                     T.AMOUNT (RM)
//                   </th>
//                 </tr>
//               </ng-template>
//               <ng-template #body let-item let-i="rowIndex">
//                 <tr [formGroupName]="i">
//                   <td class="px-1!">
//                     <input
//                       type="text"
//                       pInputText
//                       formControlName="item"
//                       class="focus:!ring-1 text-[13px]! text-center! w-full"
//                     />
//                   </td>
//                   <td class="px-1!">
//                     <textarea
//                       type="text"
//                       pTextarea
//                       formControlName="description"
//                       rows="3"
//                       class="focus:!ring-1 w-full text-[13px]!"
//                       [autoResize]="true"
//                     ></textarea>
//                   </td>
//                   <td class="px-1!">
//                     <p-inputnumber
//                       styleClass="text-center!"
//                       formControlName="quantity"
//                       inputStyleClass="!text-center w-full text-[13px]!"
//                     ></p-inputnumber>
//                   </td>
//                   <td class="px-1!">
//                     <input
//                       type="text"
//                       pInputText
//                       formControlName="unit"
//                       class="focus:!ring-1 text-[13px]! text-center! w-full"
//                     />
//                   </td>
//                   <td class="px-1!">
//                     <p-inputnumber
//                       styleClass="text-center!"
//                       formControlName="unitPrice"
//                       inputStyleClass="!text-center w-full text-[13px]!"
//                       mode="decimal"
//                       [minFractionDigits]="2"
//                     ></p-inputnumber>
//                   </td>
//                   <td class="px-1!">
//                     <p-inputnumber
//                       styleClass="text-center!"
//                       formControlName="discount"
//                       inputStyleClass="!text-center w-full text-[13px]!"
//                       mode="decimal"
//                       [minFractionDigits]="2"
//                     ></p-inputnumber>
//                   </td>
//                   <td class="px-1! text-center!">
//                     <p-inputnumber
//                       styleClass="text-center!"
//                       formControlName="totalAmount"
//                       inputStyleClass="!text-center w-full text-[13px]! cursor-pointer! border-none! shadow-none!"
//                       readonly
//                       mode="decimal"
//                       [minFractionDigits]="2"
//                     ></p-inputnumber>
//                   </td></tr
//               ></ng-template>
//             </p-table>
//             <p-button
//               label="Add Item"
//               icon="pi pi-plus-circle"
//               size="small"
//               severity="info"
//               [text]="true"
//               styleClass="text-blue-500!"
//               (onClick)="addItem()"
//             ></p-button>
//           </div>
//           <div class="col-span-12 mt-8 flex flex-col gap-2">
//             <b class="underline font-bold text-[15px]">REMARKS:</b>
//             <textarea
//               name=""
//               id=""
//               pTextarea
//               class="w-full"
//               formControlName="deliveryInstruction"
//               rows="3"
//               autoResize="true text-[13px]"
//             ></textarea>
//           </div>
//           <div
//             class="col-span-12 border-b pb-3 mb-2 mt-8 flex flex-row items-center gap-2 font-bold text-[14px]"
//           >
//             <div>RINGGIT MALAYSIA :</div>
//             <div>
//               {{ amountToWords(quotationForm.get('totalAmount')?.value) }}
//             </div>
//           </div>
//           <div class="col-span-12 grid grid-cols-12 items-start gap-1">
//             <div
//               class="col-span-4 flex flex-row gap-2 items-center italic text-xs"
//             >
//               <div>Remarks:</div>
//               <input
//                 type="text"
//                 pInputText
//                 class="text-xs! italic flex-1!"
//                 formControlName="remarks"
//               />
//             </div>
//             <div
//               class="col-span-4 px-4 flex flex-row justify-between items-center gap-5 text-[13px]"
//             >
//               <div class="">TOTAL QUANTITY</div>
//               <p-inputnumber
//                 styleClass="text-center! w-[30%]!"
//                 inputStyleClass="!text-center text-[13px]! w-[30%]!"
//                 formControlName="totalQuantity"
//               ></p-inputnumber>
//             </div>
//             <div class="col-span-4 flex flex-col text-sm font-bold">
//               <div
//                 class="grid grid-cols-[140px_10px_1fr] gap-y-0.5 items-center"
//               >
//                 <div>Gross (RM)</div>
//                 <div>:</div>
//                 <p-inputnumber
//                   styleClass="text-center!"
//                   formControlName="gross"
//                   inputStyleClass="!text-center w-full text-[13px]!"
//                   mode="decimal"
//                   [minFractionDigits]="2"
//                 ></p-inputnumber>
//                 <div>-Discount</div>
//                 <div>:</div>
//                 <p-inputnumber
//                   styleClass="text-center!"
//                   formControlName="discount"
//                   inputStyleClass="!text-center w-full text-[13px]!"
//                   mode="decimal"
//                   [minFractionDigits]="2"
//                 ></p-inputnumber>
//                 <div>Total Payable (RM)</div>
//                 <div>:</div>
//                 <p-inputnumber
//                   styleClass="text-center!"
//                   formControlName="totalAmount"
//                   inputStyleClass="!text-center w-full text-[13px]!"
//                   mode="decimal"
//                   [minFractionDigits]="2"
//                 ></p-inputnumber>
//               </div>
//             </div>
//           </div>

//           <div
//             class="text-[13px] cols-span-12 flex flex-row items-center justify-between mt-30"
//           >
//             <div class="font-bold border-t mt-2 w-[20%] text-center">
//               Issued by
//             </div>
//             <div class="font-bold border-t mt-2 w-[20%] text-center">
//               Checked by
//             </div>
//             <div class="font-bold border-t mt-2 w-[20%] text-center">
//               Approved by
//             </div>
//             <div class="font-bold border-t mt-2 w-[20%] text-center">
//               Authorised Signature
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

//         <div class="mb-20 p-10 bg-white" id="quotation-print">
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
//               <h1 class="text-4xl font-light text-gray-300 mb-2">QUOTATION</h1>
//               <p class="font-bold text-lg">
//                 {{ previewData?.quotationNo || 'DRAFT' }}
//               </p>
//               <p class="text-sm text-gray-600">
//                 Date:
//                 {{
//                   quotationForm.get('quotationDate')?.value
//                     | date: 'dd MMM yyyy'
//                 }}
//               </p>
//               <p class="text-sm text-gray-600">
//                 Valid Until:
//                 {{ quotationForm.get('dueDate')?.value | date: 'dd MMM yyyy' }}
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
//                 *ngIf="previewData.client"
//               >
//                 <strong>{{
//                   previewData.client.label || previewData.client.name
//                 }}</strong
//                 ><br />
//                 {{ previewData.client.deliveryAddress?.addressLine1 }}<br />
//                 <span *ngIf="previewData.client.deliveryAddress?.addressLine2"
//                   >{{ previewData.client.deliveryAddress?.addressLine2 }}<br
//                 /></span>
//                 {{ previewData.client.deliveryAddress?.poscode }},
//                 {{ previewData.client.deliveryAddress?.city }},
//                 {{ previewData.client.state }}
//                 {{ previewData.client.deliveryAddress?.country }}<br />
//                 <p *ngIf="previewData.client.contactPerson">
//                   <strong>Attn:</strong> {{ previewData.client.contactPerson }}
//                 </p>
//                 <p *ngIf="previewData.client.email">
//                   <strong>Email:</strong> {{ previewData.client.email }}
//                 </p>
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

//           <div class="grid grid-cols-12 mt-8">
//             <div class="col-span-8 flex flex-col w-[90%]">
//               <div class="flex flex-col gap-2">
//                 <div class="font-bold text-gray-600">Terms and Conditions</div>
//                 <div
//                   [innerHTML]="previewData.termsConditions"
//                   class="prose prose-sm max-w-full text-[14px] text-gray-600 break-words [&_ol]:list-decimal [&_ol]:pl-5"
//                 ></div>
//               </div>
//               <div class="flex flex-col gap-1 mt-5">
//                 <div class="font-bold text-gray-600">Additional Notes</div>
//                 <div class="text-sm text-gray-500 tracking-wide italic">
//                   {{
//                     quotationForm.get('description')?.value ||
//                       'No additional notes provided.'
//                   }}
//                 </div>
//               </div>
//             </div>
//             <div class="col-span-4 flex justify-end">
//               <div class="flex flex-col gap-2">
//                 <div class="flex justify-between text-sm">
//                   <span>Sub Total</span>
//                   <span>RM {{ previewData.gross | number: '1.2-2' }}</span>
//                 </div>
//                 <div class="flex justify-between text-sm text-red-500">
//                   <span>Discount ({{ previewData?.discount }}%)</span>
//                   <span>-RM {{ previewData.discount | number: '1.2-2' }}</span>
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
//                   <div class="font-medium text-[14px] text-gray-600">
//                     {{ amountToWords(previewData?.totalAmount || 0) }}
//                   </div>
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
//       [(visible)]="showClientDialog"
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
//                 Create New Client
//               </h2>
//               <p class="text-sm text-gray-500 mt-1">
//                 Fill in the primary details and address information to register
//                 a new client.
//               </p>
//             </div>
//           </div>
//         </div>

//         <div class="p-6 max-h-[70vh] overflow-y-auto">
//           <div
//             [formGroup]="clientForm"
//             class="grid grid-cols-12 gap-x-4 gap-y-3 text-[14px]"
//           >
//             <div class="col-span-12 lg:col-span-6 flex flex-col gap-1.5">
//               <label class="font-medium text-gray-700"
//                 >Client Name <span class="text-red-500">*</span></label
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
//               *ngIf="clientForm.get('sameAsBilling')?.value"
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
//             (onClick)="showClientDialog = false"
//             label="Discard"
//             severity="secondary"
//             styleClass="px-6 py-2! border-gray-200!"
//           ></p-button>

//           <p-button
//             (onClick)="AddNewClient()"
//             label="Create Client"
//             severity="info"
//             [disabled]="clientForm.invalid"
//             styleClass="px-8 py-2! shadow-sm"
//           ></p-button>
//         </div>
//       </ng-template>
//     </p-dialog>
//   `,
//   styleUrl: './quotation-form.less',
//   changeDetection: ChangeDetectionStrategy.OnPush,
// })
// export class QuotationForm implements OnInit, OnDestroy {
//   private readonly fb = inject(FormBuilder);
//   private readonly router = inject(Router);
//   private readonly cdr = inject(ChangeDetectorRef);
//   private readonly messageService = inject(MessageService);
//   private readonly quotationService = inject(QuotationService);
//   private readonly activatedRoute = inject(ActivatedRoute);
//   private readonly clientService = inject(ClientService);
//   private readonly loadingService = inject(LoadingService);
//   private readonly userService = inject(UserService);
//   private readonly projectService = inject(ProjectService);
//   protected ngUnsubscribe: Subject<void> = new Subject<void>();

//   private destroy$ = new Subject<void>();

//   quotationForm!: FormGroup;
//   clientForm!: FormGroup;
//   currentId: string = '';
//   signaturePreview: string | null = null;

//   displayPreview: boolean = false;
//   showClientDialog: boolean = false;
//   previewData: any = null;

//   today: Date = new Date();

//   name = this.userService.currentUser?.firstName;

//   clientSelections: any[] = [];

//   selectedClient: any;
//   selectedTemplate: string = 'notes';

//   grossTotal = signal(0);
//   discountTotal = signal(0);
//   totalAmount = signal(0);

//   projectSelection: any[] = [];

//   ngOnInit() {
//     this.initForm();
//     this.currentId = this.activatedRoute.snapshot.queryParams['id'] || null;

//     this.getClientSelection();
//     this.getProjectSelection();

//     if (this.currentId) {
//       this.loadQuotation();
//     }

//     // Auto-calculate whenever items or discount change
//     this.quotationForm.valueChanges
//       .pipe(takeUntil(this.destroy$))
//       .subscribe(() => this.calculateTotals());
//   }

//   getClientSelection() {
//     this.loadingService.start();
//     this.clientService
//       .GetMany({
//         Page: 1,
//         PageSize: 1000000,
//         OrderBy: 'Name desc',
//         Includes: 'BillingAddress,DeliveryAddress',
//         Filter: 'Status=Active',
//         Select: null,
//       })
//       .subscribe({
//         next: (res) => {
//           this.clientSelections = res.data.map((x: ClientDto) => {
//             // Determine which address to use (Prioritize Delivery, fallback to Billing)
//             const company = x.company;
//             const activeAddress =
//               company.deliveryAddress ?? company.billingAddress;

//             return {
//               label: company.name,
//               value: x.id,
//               email: company.email,
//               contactNo: company.contactNo,
//               faxNo: company.faxNo,
//               acNo: company.acNo,
//               contactPerson: company.contactPerson1,
//               addressType: company.deliveryAddress ? 'Delivery' : 'Billing', // Optional: track which one is being shown
//               deliveryAddress: {
//                 addressLine1: activeAddress.addressLine1,
//                 addressLine2: activeAddress.addressLine2,
//                 city: activeAddress.city,
//                 poscode: activeAddress.poscode,
//                 state: activeAddress.state,
//                 country: activeAddress.country,
//               },
//             };
//           });
//           this.loadingService.stop();
//         },
//         error: (err) => {
//           this.loadingService.stop();
//         },
//       });
//   }

//   getProjectSelection() {
//     this.loadingService.start();
//     this.projectService
//       .GetMany({
//         Page: 1,
//         PageSize: 1000000,
//         Select: null,
//         Includes: null,
//         Filter: null,
//         OrderBy: 'ProjectTitle',
//       })
//       .pipe(takeUntil(this.ngUnsubscribe))
//       .subscribe({
//         next: (res) => {
//           this.projectSelection = res.data.map((x: ProjectDto) => {
//             this.loadingService.stop();
//             return {
//               label: x.projectTitle,
//               value: x.id,
//             };
//           });
//         },
//         error: (err) => {
//           this.loadingService.stop();
//         },
//       });
//   }

//   ClientOnChange(event: any) {
//     const selectedId = event.value;

//     this.selectedClient = this.clientSelections.find(
//       (x) => x.value === selectedId,
//     );
//   }

//   private initForm() {
//     this.quotationForm = this.fb.group({
//       quotationNo: ['', Validators.required],
//       quotationDate: [new Date(), Validators.required],
//       dueDate: [
//         new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
//         Validators.required,
//       ],
//       clientId: [null, Validators.required],
//       projectId: [null, Validators.required],
//       terms: [null],
//       page: [null],
//       gross: [null],
//       discount: [null],
//       totalAmount: null,
//       deliveryInstruction: [null],
//       deliveryDate: [null],
//       description: [null],
//       termsConditions: [null],
//       bankDetails: [null],
//       remarks: [null],
//       totalQuantity: [null],
//       items: this.fb.array([this.createItem()]),
//     });
//   }

//   get items() {
//     return this.quotationForm.get('items') as FormArray;
//   }

//   createItem(): FormGroup {
//     return this.fb.group({
//       id: null,
//       items: [null],
//       description: [null, Validators.required],
//       quantity: [null, [Validators.required, Validators.min(1)]],
//       unit: ['Unit'],
//       unitPrice: [null, [Validators.required, Validators.min(0)]],
//       discount: [null],
//       amount: null,
//     });
//   }

//   addItem(item?: any) {
//     const newItemGroup = this.createItem();

//     // If data is passed (from loadQuotation), populate the group
//     if (item) {
//       newItemGroup.patchValue({
//         id: item.id || null,
//         item: item.item,
//         description: item.description,
//         quantity: item.quantity,
//         unit: item.unit,
//         unitPrice: item.unitPrice,
//         discount: item.discount || 0,
//         totalAmount: item.totalAmount,
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
//     let gross = 0;
//     let itemDiscountTotal = 0;
//     let subtotal = 0;

//     this.items.controls.forEach((control) => {
//       const qty = control.get('quantity')?.value || 0;
//       const unitPrice = control.get('unitPrice')?.value || 0;
//       const itemDiscountPercent = control.get('discount')?.value || 0;

//       const lineTotal = qty * unitPrice;

//       const itemDiscount = lineTotal * (itemDiscountPercent / 100);
//       const netLine = lineTotal - itemDiscount;

//       control.get('totalAmount')?.setValue(netLine, { emitEvent: false });

//       gross += lineTotal;
//       itemDiscountTotal += itemDiscount;
//       subtotal += netLine;
//     });

//     // HEADER DISCOUNT (BOTTOM INPUT)
//     const headerDiscountPercent =
//       this.quotationForm.get('discount')?.value || 0;
//     const headerDiscountAmount = subtotal * (headerDiscountPercent / 100);

//     const total = subtotal - headerDiscountAmount;

//     // UI values
//     this.grossTotal.set(gross);
//     this.discountTotal.set(itemDiscountTotal + headerDiscountAmount);
//     this.totalAmount.set(total);

//     // Sync form
//     this.quotationForm.get('gross')?.setValue(gross, { emitEvent: false });
//     this.quotationForm
//       .get('totalAmount')
//       ?.setValue(total, { emitEvent: false });
//   }

//   onSave(isDraft: boolean = false) {
//     ValidateAllFormFields(this.quotationForm);
//     if (this.quotationForm.invalid) {
//       this.messageService.add({
//         severity: 'error',
//         summary: 'Error',
//         detail: 'Please fill all required fields',
//       });
//       return;
//     }

//     const formValue = this.quotationForm.getRawValue();

//     const action$ = this.currentId
//       ? this.quotationService.Update({
//           ...formValue,
//           id: this.currentId!,
//         } as any)
//       : this.quotationService.Create(formValue);

//     action$.subscribe(() => {
//       this.messageService.add({
//         severity: 'success',
//         summary: 'Success',
//         detail: 'Quotation Saved',
//       });
//       this.router.navigate(['/quotations']);
//     });
//   }

//   onPreview() {
//     if (this.quotationForm.invalid) {
//       this.messageService.add({
//         severity: 'warn',
//         summary: 'Validation',
//         detail: 'Please complete the form first',
//       });
//       return;
//     }

//     this.loadingService.start();
//     // Use getRawValue() to include disabled fields like 'totalAmount'
//     this.quotationService
//       .Preview(this.quotationForm.getRawValue())
//       .pipe(takeUntil(this.destroy$))
//       .subscribe({
//         next: (res) => {
//           this.previewData = res;
//           this.displayPreview = true;
//           this.cdr.markForCheck();

//           this.loadingService.stop();
//         },
//         error: () => this.loadingService.stop(),
//       });
//   }

//   applyTemplate(type: 'notes' | 'terms' | 'bank') {
//     this.selectedTemplate = type;

//     this.cdr.detectChanges();
//   }

//   private loadQuotation() {
//     this.loadingService.start();
//     this.quotationService
//       .GetOne({
//         Page: 1,
//         PageSize: 1,
//         OrderBy: null,
//         Select: null,
//         Filter: this.currentId, // Simplify this if you use the fixed C# logic above
//         Includes: 'Client.BillingAddress,Client.DeliveryAddress,Items', // Make sure to include Items!
//       })
//       .pipe(takeUntil(this.ngUnsubscribe))
//       .subscribe({
//         next: (res) => {
//           this.loadingService.stop();
//           if (res) {
//             // 1. Clear existing items
//             while (this.items.length !== 0) {
//               this.items.removeAt(0);
//             }

//             // 2. Build the FormArray based on the data received
//             if (res.items && res.items.length > 0) {
//               res.items.forEach((item: any) => {
//                 this.addItem(item); // Use your existing addItem logic
//               });
//             }

//             this.selectedClient = res.client;

//             // 3. Patch the rest of the form
//             this.quotationForm.patchValue({
//               ...res,
//               quotationDate: new Date(res.quotationDate),
//               dueDate: new Date(res.dueDate),
//             });
//           }
//           this.cdr.markForCheck();
//         },
//         error: () => this.loadingService.stop(),
//       });
//   }

//   printPreview() {
//     this.displayPreview = false;
//     const printContents = document.getElementById('quotation-print');

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

//         this.quotationForm.patchValue({
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

//   AddClientClick() {
//     this.clientForm = new FormGroup({
//       name: new FormControl<string | null>(null, Validators.required),
//       email: new FormControl<string | null>(null, [Validators.email]),
//       contactNo: new FormControl<string | null>(null, Validators.required),
//       contactPerson: new FormControl<string | null>(null),
//       faxNo: new FormControl<string | null>(null),
//       acNo: new FormControl<string | null>(null),

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

//     this.clientForm.get('sameAsBilling')?.valueChanges.subscribe((checked) => {
//       if (checked) {
//         const billingValue = this.clientForm.get('billingAddress')?.value;
//         this.clientForm.get('deliveryAddress')?.patchValue({
//           ...billingValue,
//           name: 'Delivery', // Keep the name as Delivery
//         });
//       }
//     });

//     this.showClientDialog = true;
//   }

//   AddNewClient() {
//     ValidateAllFormFields(this.clientForm);

//     if (!this.clientForm.valid) return;

//     this.loadingService.start();

//     this.clientService
//       .Create(this.clientForm.value)
//       .pipe(takeUntil(this.ngUnsubscribe))
//       .subscribe({
//         next: (res: any) => {
//           this.loadingService.stop();
//           const activeAddress = res.deliveryAddress ?? res.billingAddress;

//           const newClient = {
//             label: res.name || this.clientForm.value.name,
//             value: res.id,
//             email: res.email,
//             contactNo: res.contactNo,
//             faxNo: res.faxNo,
//             acNo: res.acNo,
//             addressType: res.deliveryAddress ? 'Delivery' : 'Billing', // Optional: track which one is being shown
//             deliveryAddress: {
//               addressLine1: activeAddress.addressLine1,
//               addressLine2: activeAddress.addressLine2,
//               city: activeAddress.city,
//               poscode: activeAddress.poscode,
//               state: activeAddress.state,
//               country: activeAddress.country,
//             },
//           };

//           this.clientSelections = [...this.clientSelections, newClient];

//           this.clientForm.get('clientId')?.setValue(res.id);

//           this.messageService.add({
//             severity: 'success',
//             summary: 'Success',
//             detail: 'Client created and selected successfully',
//             life: 3000,
//           });

//           this.showClientDialog = false;
//           this.clientForm.reset();
//           this.cdr.detectChanges();
//         },
//         error: (err) => {
//           this.loadingService.stop();

//           this.messageService.add({
//             severity: 'error',
//             summary: 'Error',
//             detail:
//               err.error?.message ||
//               'Failed to create client. Please try again.',
//             life: 5000,
//           });

//           this.cdr.markForCheck();
//         },
//       });
//   }

//   downloadPDF() {}

//   ngOnDestroy() {
//     this.destroy$.next();
//     this.destroy$.complete();
//     this.ngUnsubscribe.next();
//     this.ngUnsubscribe.complete();
//     this.loadingService.stop();
//   }
// }
