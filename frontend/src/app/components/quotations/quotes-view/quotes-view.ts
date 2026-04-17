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
// import { ButtonModule } from 'primeng/button';
// import { LoadingService } from '../../../services/loading.service';
// import { QuotationService } from '../../../services/quotationService.service';
// import { ActivatedRoute, Router, RouterLink } from '@angular/router';
// import { MessageService } from 'primeng/api';
// import { QuotationDto } from '../../../models/Quotation';
// import { Subject, takeUntil } from 'rxjs';
// import { TableModule } from 'primeng/table';
// import { UserService } from '../../../services/userService.service';
// import { LoginResponse } from '../../../models/User';

// @Component({
//   selector: 'app-quotes-view',
//   imports: [CommonModule, ButtonModule, RouterLink, TableModule],
//   template: `<div class="min-h-screen bg-gray-50/50 p-5">
//     <div class="mx-auto flex flex-row items-center justify-between mb-3">
//       <nav class="flex items-center gap-2 text-sm text-gray-500">
//         <a routerLink="/dashboard" class="hover:text-blue-600 transition-colors"
//           >Dashboard</a
//         >
//         <i class="pi pi-chevron-right text-[10px]"></i>
//         <a
//           routerLink="/quotations"
//           class="hover:text-blue-600 transition-colors"
//           >Quotations</a
//         >
//         <i class="pi pi-chevron-right text-[10px]"></i>
//         <span class="text-gray-900 font-bold">Sign Quotation</span>
//       </nav>
//       <div class="flex gap-3">
//         <p-button
//           (onClick)="Save()"
//           label="Save"
//           icon="pi pi-check-circle"
//           severity="info"
//           styleClass="!rounded-md !px-5 py-1.5! tracking-wide"
//         ></p-button>
//         <p-button
//           (onClick)="printPreview()"
//           label="Print / Download PDF"
//           icon="pi pi-download"
//           severity="secondary"
//           styleClass="!rounded-md bg-gray-100! border-gray-200! !px-5 py-1.5! tracking-wide"
//         ></p-button>
//       </div>
//     </div>

//     <div
//       class="mt-5 border bg-white rounded-lg p-5 border-gray-200"
//       id="quotation-print"
//     >
//       <div class="flex justify-between items-start mb-10">
//         <div>
//           <img src="assets/yl-logo.png" class="w-24 mb-3" />
//           <h2 class="text-2xl font-bold text-blue-900">YL Systems Sdn Bhd</h2>
//           <p class="text-xs text-gray-500 tracking-widest uppercase">
//             ELV Technology Solution Provider
//           </p>
//         </div>
//         <div class="text-right">
//           <h1 class="text-4xl font-light text-gray-300 mb-2">QUOTATION</h1>
//           <p class="font-bold text-lg">
//             {{ quotationData?.quotationNo || 'DRAFT' }}
//           </p>
//           <p class="text-sm text-gray-600">
//             Date:
//             {{ quotationData?.quotationDate | date: 'dd MMM yyyy' }}
//           </p>
//           <p class="text-sm text-gray-600">
//             Valid Until:
//             {{ quotationData?.dueDate | date: 'dd MMM yyyy' }}
//           </p>
//         </div>
//       </div>

//       <div
//         class="flex justify-between items-start mb-10 border-t border-b py-8 border-gray-100"
//       >
//         <div class="w-[45%]">
//           <p class="text-xs font-bold text-blue-600 uppercase mb-3">From</p>
//           <div class="text-sm text-gray-700 leading-relaxed">
//             <p class="font-bold text-gray-900">YL Systems Sdn Bhd</p>
//             <p>42, Jln 21/19, Sea Park</p>
//             <p>46300 Petaling Jaya, Selangor</p>
//             <p><strong>Contact:</strong> 03-78773929</p>
//           </div>
//         </div>

//         <div class="text-right w-[30%]">
//           <p class="text-xs font-bold text-blue-600 uppercase mb-3">Bill To</p>
//           <div
//             class="text-sm text-gray-700 leading-relaxed"
//             *ngIf="quotationData?.client"
//           >
//             <p class="font-bold text-gray-900">
//               {{ quotationData?.client?.name }}
//             </p>
//             <p class="whitespace-pre-line">
//               <!-- {{ quotationData?.client?.address }} -->
//             </p>
//             <p>
//               <strong>Attn:</strong> {{ quotationData?.client?.contactPerson }}
//             </p>
//             <p><strong>Email:</strong> {{ quotationData?.client?.email }}</p>
//           </div>
//         </div>
//       </div>

//       <p-table
//         [value]="quotationData?.items || []"
//         class="w-full"
//         [rowHover]="false"
//         showGridlines
//       >
//         <ng-template #header>
//           <tr class="bg-gray-50">
//             <th
//               class="p-3 text-center! text-xs font-bold uppercase bg-gray-100! text-gray-500 border-b"
//             >
//               Description
//             </th>
//             <th
//               class="p-3 text-center! text-xs font-bold uppercase bg-gray-100! text-gray-500 border-b"
//             >
//               Qty
//             </th>
//             <th
//               class="p-3 text-center! text-xs font-bold uppercase bg-gray-100! text-gray-500 border-b"
//             >
//               Unit
//             </th>
//             <th
//               class="p-3 text-center! text-xs font-bold uppercase bg-gray-100! text-gray-500 border-b"
//             >
//               Rate (RM)
//             </th>
//             <th
//               class="p-3 text-center! text-xs font-bold uppercase bg-gray-100! text-gray-500 border-b"
//             >
//               Tax
//             </th>
//             <th
//               class="p-3 text-center! text-xs font-bold uppercase bg-gray-100! text-gray-500 border-b"
//             >
//               Amount (RM)
//             </th>
//           </tr>
//         </ng-template>
//         <ng-template #body let-item>
//           <tr>
//             <td class="p-3 border-b text-sm">{{ item.description }}</td>
//             <td class="p-3 border-b text-center! text-sm">
//               {{ item.quantity }}
//             </td>
//             <td class="p-3 border-b text-center! text-sm">
//               {{ item.unit }}
//             </td>
//             <td class="p-3 border-b text-center! text-sm">
//               {{ item.rate | number: '1.2-2' }}
//             </td>
//             <td class="p-3 border-b text-center! text-sm text-gray-400">
//               {{ item.taxRate }}%
//             </td>
//             <td class="p-3 border-b text-center! text-sm font-semibold">
//               {{ item.amount | number: '1.2-2' }}
//             </td>
//           </tr>
//         </ng-template>
//       </p-table>

//       <div class="grid grid-cols-12 mt-8">
//         <div class="col-span-8 flex flex-col w-[80%]">
//           <div class="flex flex-col gap-2">
//             <div class="font-bold text-gray-600">Terms and Conditions</div>
//             <div
//               [innerHTML]="quotationData?.termsConditions"
//               class="prose prose-sm max-w-full text-[14px] text-gray-600 break-words [&_ol]:list-decimal [&_ol]:pl-5"
//             ></div>
//           </div>
//           <div class="flex flex-col gap-1 mt-5">
//             <div class="font-bold text-gray-600">Additional Notes</div>
//             <div class="text-sm text-gray-500 tracking-wide italic">
//               {{
//                 quotationData?.description || 'No additional notes provided.'
//               }}
//             </div>
//           </div>
//         </div>
//         <div class="col-span-4 flex justify-end">
//           <div class="flex flex-col gap-2 w-full">
//             <div class="flex justify-between text-sm">
//               <span>Subtotal</span>
//               <span>RM {{ this.subTotal() | number: '1.2-2' }}</span>
//             </div>
//             <!-- <div class="flex justify-between text-sm text-red-500">
//               <span>Discount ({{ quotationData?.discount }}%)</span>
//               <span *ngIf="quotationData && quotationData.discount"
//                 >-RM
//                 {{
//                   (this.subTotal() * quotationData.discount) / 100
//                     | number: '1.2-2'
//                 }}</span
//               >
//             </div> -->
//             <div
//               class="flex justify-between text-xl font-bold border-t-2 pt-3 text-blue-900"
//             >
//               <span>Total Amount</span>
//               <span>RM {{ quotationData?.totalAmount | number: '1.2-2' }}</span>
//             </div>

//             <div class="mt-12" *ngIf="!signatureImageUrl">
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
//                 <i class="pi pi-cloud-upload text-gray-300 text-3xl! mb-2"></i>
//                 <span class="text-sm text-gray-400 tracking-wide"
//                   >Upload signature file</span
//                 >
//               </div>
//             </div>

//             <div
//               class="mt-12 text-right flex flex-col items-end"
//               *ngIf="signatureImageUrl"
//             >
//               <img
//                 [src]="signatureImageUrl"
//                 class="max-w-[180px] border-b border-gray-200 mb-2"
//               />
//             </div>
//             <div class="flex flex-col gap-1">
//               <p class="text-right text-[15px] font-bold">
//                 {{ currentUser?.firstName }} {{ currentUser?.lastName }}
//               </p>
//               <p class="text-right text-xs text-gray-400 uppercase">
//                 Authorized Signature
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   </div>`,
//   styleUrl: './quotes-view.less',
//   changeDetection: ChangeDetectionStrategy.OnPush,
// })
// export class QuotesView implements OnInit, OnDestroy {
//   private readonly loadingService = inject(LoadingService);
//   private readonly quotationService = inject(QuotationService);
//   private readonly messageService = inject(MessageService);
//   private readonly activatedRoute = inject(ActivatedRoute);
//   private readonly cdr = inject(ChangeDetectorRef);
//   private readonly userService = inject(UserService);
//   private readonly router = inject(Router);
//   protected ngUnsubscribe: Subject<void> = new Subject<void>();

//   signatureImageUrl: string = '';
//   currentId: string = '';
//   quotationData: QuotationDto | null = null;
//   currentUser: LoginResponse | null = null;

//   subTotal = signal(0);
//   taxTotal = signal(0);
//   grandTotal = signal(0);

//   constructor() {
//     this.currentId = this.activatedRoute.snapshot.queryParams['id'];
//     this.currentUser = this.userService.currentUser;
//   }

//   ngOnInit(): void {
//     this.loadingService.start();
//     this.quotationService
//       .GetOne({
//         Page: 1,
//         PageSize: 1,
//         OrderBy: null,
//         Select: null,
//         Includes: 'Client,Items',
//         Filter: `Id=${this.currentId}`,
//       })
//       .pipe(takeUntil(this.ngUnsubscribe))
//       .subscribe({
//         next: (res) => {
//           this.quotationData = res;

//           this.loadingService.stop();
//           this.cdr.markForCheck();
//         },
//         error: (err) => {
//           this.loadingService.stop();
//         },
//       });

//     this.calculateTotals();
//   }

//   calculateTotals() {
//     // let gross = 0;
//     // let itemDiscountTotal = 0;
//     // let subTotal = 0;
//     // if (this.quotationData) {
//     //   this.quotationData?.items.forEach((item) => {
//     //     const lineTotal = item?.quantity * item?.unitPrice;
//     //     const lineDiscount = lineTotal * (item?.discount / 100);
//     //     const netLine = lineTotal + lineDiscount;
//     //     item.totalAmount = netLine;
//     //     gross += lineTotal;
//     //     itemDiscountTotal += lineDiscount;
//     //     subTotal += netLine;
//     //   });
//     //   const headerDiscountAmount =
//     //     subTotal * (this.quotationData.discount / 100);
//     //   const total = subTotal - headerDiscountAmount;
//     //   this.quotationData.gross = gross;
//     // }
//   }

//   printPreview() {
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

//         this.signatureImageUrl = base64String;

//         this.cdr.markForCheck();
//       };

//       reader.readAsDataURL(file);
//     }
//   }

//   Save() {
//     // 1. Validation
//     if (!this.signatureImageUrl) {
//       this.messageService.add({
//         severity: 'error',
//         summary: 'Validation Error',
//         detail: 'Please provide a signature before submitting.',
//       });
//       return;
//     }

//     this.loadingService.start();
//     // 3. Execution
//     // this.quotationService.SubmitSignature(request).subscribe({
//     //   next: () => {
//     //     this.loadingService.stop();
//     //     this.messageService.add({
//     //       severity: 'success',
//     //       summary: 'Quotation Signed',
//     //       detail: 'The signature has been recorded and the status updated.',
//     //     });

//     //     // Optional: Navigate away or refresh the view
//     //     this.router.navigate(['/quotations']);
//     //   },
//     //   error: (err: any) => {
//     //     this.loadingService.stop();
//     //     // Service handles the toast, but you can log details here
//     //     console.error('Submission error:', err);
//     //   },
//     // });
//   }

//   ngOnDestroy(): void {
//     this.ngUnsubscribe.next();
//     this.ngUnsubscribe.complete();
//     this.loadingService.stop();
//   }
// }
