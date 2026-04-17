// import { CommonModule } from '@angular/common';
// import {
//   ChangeDetectionStrategy,
//   ChangeDetectorRef,
//   Component,
//   inject,
//   OnDestroy,
//   OnInit,
//   signal,
//   ViewChild,
// } from '@angular/core';
// import { FormsModule } from '@angular/forms';
// import { ButtonModule } from 'primeng/button';
// import { InputTextModule } from 'primeng/inputtext';
// import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
// import { MaterialRequestService } from '../../../services/materialRequestService';
// import { LoadingService } from '../../../services/loading.service';
// import { Router, RouterLink } from '@angular/router';
// import { map, Observable, Subject, takeUntil } from 'rxjs';
// import {
//   BuildFilterText,
//   BuildSortText,
//   GridifyQueryExtend,
//   PagingContent,
// } from '../../../shared/helpers/helpers';
// import { MaterialRequestDto } from '../../../models/MaterialRequest';
// import { MenuItem, MessageService } from 'primeng/api';
// import { MenuModule } from 'primeng/menu';
// import { DialogModule } from 'primeng/dialog';
// import { SelectModule } from 'primeng/select';
// import { UserService } from '../../../services/userService.service';
// import { TextareaModule } from 'primeng/textarea';

// @Component({
//   selector: 'app-material-requests',
//   imports: [
//     CommonModule,
//     TableModule,
//     InputTextModule,
//     ButtonModule,
//     FormsModule,
//     RouterLink,
//     MenuModule,
//     DialogModule,
//     SelectModule,
//     TextareaModule,
//   ],
//   template: `
//     <div class="w-full min-screen flex flex-col p-5">
//       <div
//         class="flex flex-row items-center gap-1 text-gray-500 text-[15px] tracking-wide"
//       >
//         <div
//           [routerLink]="'/dashboard'"
//           class="cursor-pointer hover:text-gray-600"
//         >
//           Dashboard
//         </div>
//         /
//         <div class="text-gray-700 font-semibold">Material Requests</div>
//       </div>

//       <div
//         class="mt-3 border border-gray-200 rounded-md tracking-wide bg-white p-5 flex flex-col"
//       >
//         <div
//           class="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-0 justify-between"
//         >
//           <div class="flex flex-col">
//             <div class="text-[20px] text-gray-700 font-semibold">
//               Material Requests
//             </div>
//             <div class="text-gray-500 text-[15px]">
//               View, create, and track all material requests in one place.
//             </div>
//           </div>

//           <div class="flex flex-row items-center gap-2">
//             <div class="min-w-[300px] relative">
//               <input
//                 type="text"
//                 pInputText
//                 placeholder="Search..."
//                 class="w-full text-sm!"
//                 [(ngModel)]="search"
//                 (keydown)="onKeyDown($event)"
//               />
//               <i
//                 class="pi pi-search absolute! top-3! right-2! text-gray-500!"
//               ></i>
//             </div>
//             <p-button
//               label="New Material Request"
//               [routerLink]="'/material-requests/form'"
//               icon="pi pi-plus-circle"
//               size="small"
//               severity="info"
//               styleClass="py-2! whitespace-nowrap!"
//             ></p-button>
//           </div>
//         </div>
//         <div class="mt-3">
//           <p-table
//             #fTable
//             [value]="PagingSignal().data"
//             [paginator]="true"
//             [rows]="Query.PageSize"
//             [totalRecords]="PagingSignal().totalElements"
//             [lazy]="true"
//             [showGridlines]="true"
//             [tableStyle]="{ 'min-width': '60rem' }"
//             (onLazyLoad)="NextPage($event)"
//           >
//             <ng-template #header>
//               <tr>
//                 <th
//                   pSortableColumn="RequestNo"
//                   class="bg-gray-100! text-[15px]! text-center! w-[15%]!"
//                 >
//                   <div class="flex flex-row justify-center items-center gap-2">
//                     <div>Request No</div>
//                     <p-sortIcon field="RequestNo" />
//                   </div>
//                 </th>
//                 <th class="bg-gray-100! text-[15px]! text-center! w-[30%]">
//                   Client
//                 </th>
//                 <th
//                   pSortableColumn="RequestDate"
//                   class="bg-gray-100! text-[15px]! text-center! w-[15%]"
//                 >
//                   <div class="flex flex-row justify-center items-center gap-2">
//                     <div>Requested Date</div>
//                     <p-sortIcon field="RequestDate" />
//                   </div>
//                 </th>
//                 <th class="bg-gray-100! text-[15px]! text-center! w-[20%]">
//                   Requested By
//                 </th>
//                 <th
//                   pSortableColumn="Status"
//                   class="bg-gray-100! text-[15px]! text-center! w-[15%]"
//                 >
//                   <div class="flex flex-row justify-center items-center gap-2">
//                     <div>Status</div>
//                     <p-sortIcon field="Status" />
//                   </div>
//                 </th>
//                 <th class="bg-gray-100! text-[15px]! text-center! w-[10%]">
//                   Action
//                 </th>
//               </tr>
//             </ng-template>
//             <ng-template #body let-data>
//               <tr>
//                 <td class="text-center! text-[14px]! font-semibold!">
//                   {{ data.requestNo }}
//                 </td>
//                 <td class="text-center! text-[14px]!">
//                   {{ data.client?.name }}
//                 </td>
//                 <td class="text-center! text-[14px]!">
//                   {{ data.requestDate | date: 'dd MMM, yyyy' }}
//                 </td>
//                 <td class="text-center! text-[14px]!">
//                   {{
//                     data.requestedBy?.firstName +
//                       ' ' +
//                       data.requestedBy?.lastName
//                   }}
//                 </td>
//                 <td class="text-center! text-[14px]!">
//                   <div class="flex items-center justify-center">
//                     <div
//                       class="px-4 py-1 rounded-full"
//                       [ngClass]="{
//                         'bg-amber-100 text-amber-600': data.status === 'Draft',
//                         'bg-orange-100 text-orange-600':
//                           data.status === 'PendingApproval',
//                         'bg-blue-100 text-blue-600': data.status === 'Approved',
//                         'bg-indigo-100 text-indigo-600':
//                           data.status === 'Issued',
//                         'bg-sky-100 text-sky-600': data.status === 'Partial',
//                         'bg-green-100 text-green-600':
//                           data.status === 'Completed',
//                         'bg-red-100 text-red-600': data.status === 'Rejected',
//                       }"
//                     >
//                       {{ data.status }}
//                     </div>
//                   </div>
//                 </td>
//                 <td class="text-center! text-[14px]!">
//                   <i
//                     *ngIf="
//                       data.status !== 'Rejected' && data.status !== 'Completed'
//                     "
//                     class="pi pi-ellipsis-h cursor-pointer"
//                     (click)="onEllipsisClick($event, data, menu)"
//                   ></i>
//                 </td></tr
//             ></ng-template>

//             <ng-template #emptymessage>
//               <tr>
//                 <td colspan="100%">
//                   <div class="flex flex-col items-center justify-center">
//                     <div class="text-gray-500 text-[15px]">
//                       No material requests found.
//                     </div>
//                   </div>
//                 </td>
//               </tr>
//             </ng-template>
//           </p-table>
//         </div>
//       </div>
//     </div>
//     <p-menu
//       #menu
//       [model]="menuItems"
//       [popup]="true"
//       [style]="{ transform: 'translate(20px, 8px)' }"
//     ></p-menu>

//     <p-dialog
//       [modal]="true"
//       [(visible)]="showApprovalDialog"
//       [closable]="false"
//       [draggable]="false"
//       styleClass="w-[30%]"
//     >
//       <ng-template #headless>
//         <div class="flex flex-col p-5">
//           <b class="text-[20px] pb-4">Assign Approver</b>
//           <div class="text-gray-600 text-[14px] mb-2">
//             Please select the management or director who will review and approve
//             this material request.
//           </div>
//           <p-select
//             [options]="(userSelections$ | async) || []"
//             [(ngModel)]="selectedApprovalUserId"
//             placeholder="Select Approver"
//             appendTo="body"
//             styleClass="w-full!"
//             [filter]="true"
//             panelStyleClass="text-[15px]!"
//             [showClear]="selectedApprovalUserId"
//           ></p-select>

//           <div class="border-b border-gray-200 mt-3 mb-3"></div>
//           <div class="flex flex-row gap-2 justify-center mt-3">
//             <p-button
//               label="Cancel"
//               (onClick)="showApprovalDialog = false"
//               styleClass="tracking-wide! border-gray-200! py-1!"
//               severity="secondary"
//             ></p-button>
//             <p-button
//               label="Confirm"
//               (onClick)="SetApproval()"
//               styleClass="tracking-wide! py-1!"
//               severity="info"
//               [disabled]="!selectedApprovalUserId"
//             ></p-button>
//           </div></div
//       ></ng-template>
//     </p-dialog>

//     <p-dialog
//       [modal]="true"
//       [(visible)]="showRejectedDialog"
//       [closable]="false"
//       [draggable]="false"
//       styleClass="w-[450px] overflow-hidden rounded-xl"
//     >
//       <ng-template #headless>
//         <div class="bg-white p-6 flex flex-col gap-4">
//           <div class="flex items-center gap-3">
//             <div class="bg-red-50 p-2 rounded-full">
//               <i class="pi pi-exclamation-triangle text-red-600 text-xl"></i>
//             </div>
//             <div>
//               <h3 class="text-lg font-semibold text-gray-900 m-0">
//                 Reject Material
//               </h3>
//               <p class="text-sm text-gray-500">
//                 Please provide a reason for rejecting this item.
//               </p>
//             </div>
//           </div>

//           <div class="flex flex-col gap-2">
//             <label for="reason" class="text-sm font-medium text-gray-700"
//               >Rejection Reason</label
//             >
//             <textarea
//               id="reason"
//               pTextarea
//               rows="3"
//               class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
//               [(ngModel)]="rejectReason"
//               placeholder="e.g., Incomplete documentation..."
//             ></textarea>
//           </div>

//           <div class="flex justify-end gap-3 pt-2">
//             <p-button
//               label="Cancel"
//               (onClick)="showRejectedDialog = false"
//               severity="secondary"
//               styleClass="border-gray-200! px-4 py-2 font-medium text-gray-600 hover:bg-gray-100"
//             ></p-button>
//             <p-button
//               label="Confirm Rejection"
//               (onClick)="ActionClick(selectedMaterial, 'Reject')"
//               severity="danger"
//               styleClass="px-4 py-2 font-medium"
//             ></p-button>
//           </div>
//         </div>
//       </ng-template>
//     </p-dialog>
//   `,
//   styleUrl: './material-requests.less',
//   changeDetection: ChangeDetectionStrategy.OnPush,
// })
// export class MaterialRequests implements OnInit, OnDestroy {
//   @ViewChild('fTable') fTable?: Table;

//   private readonly materialRequestService = inject(MaterialRequestService);
//   private readonly userService = inject(UserService);
//   private readonly loadingService = inject(LoadingService);
//   private readonly messageService = inject(MessageService);
//   private readonly cdr = inject(ChangeDetectorRef);
//   private readonly router = inject(Router);
//   protected ngUnsubscribe: Subject<void> = new Subject<void>();

//   PagingSignal = signal<PagingContent<MaterialRequestDto>>(
//     {} as PagingContent<MaterialRequestDto>,
//   );
//   Query: GridifyQueryExtend = {} as GridifyQueryExtend;

//   search: string = '';
//   rejectReason: string | null = null;
//   selectedApprovalUserId: string | null = null;
//   menuItems: MenuItem[] = [];

//   selectedMaterial!: MaterialRequestDto | null;
//   showApprovalDialog: boolean = false;
//   showRejectedDialog: boolean = false;
//   userSelections$!: Observable<{ label: string; value: string }[]>;
//   selectedUserId = this.userService.currentUser?.userId ?? undefined;
//   currentUser = this.userService.currentUser;

//   constructor() {
//     this.Query.Page = 1;
//     this.Query.PageSize = 10;
//     if (this.currentUser?.systemRole === 'Director') {
//       this.Query.Filter = `ApproverById=${this.currentUser.userId}`;
//     } else {
//       this.Query.Filter = null;
//     }
//     this.Query.Filter = null;
//     this.Query.OrderBy = `CreatedAt desc`;
//     this.Query.Select = null;
//     this.Query.Includes = 'Client,RequestedBy';
//   }

//   ngOnInit(): void {}

//   GetData() {
//     this.loadingService.start();
//     this.materialRequestService
//       .GetMany(this.Query)
//       .pipe(takeUntil(this.ngUnsubscribe))
//       .subscribe({
//         next: (res) => {
//           this.PagingSignal.set(res);
//           this.loadingService.stop();
//           this.cdr.markForCheck();
//         },
//         error: (err) => {
//           this.loadingService.stop();
//           this.cdr.markForCheck();
//         },
//       });
//   }

//   NextPage(event: TableLazyLoadEvent) {
//     if ((event?.first || event?.first === 0) && event?.rows) {
//       this.Query.Page = event.first / event.rows + 1 || 1;
//       this.Query.PageSize = event.rows;
//     }

//     const sortText = BuildSortText(event);
//     this.Query.OrderBy = sortText ? sortText : `CreatedAt desc`;

//     if (this.currentUser?.systemRole === 'Director') {
//       this.Query.Filter = `ApprovedById=${this.currentUser.userId}`;
//     }

//     this.Query.Filter =
//       this.currentUser?.systemRole === 'Director'
//         ? `ApprovedById=${this.currentUser.userId}`
//         : BuildFilterText(event);
//     this.GetData();
//   }

//   onKeyDown(event: KeyboardEvent) {
//     const isEnter = event.key === 'Enter';
//     const isBackspace = event.key === 'Backspace' && this.search === '';

//     if (isEnter) {
//       this.Search(this.search);
//     } else if (isBackspace) {
//       this.Search('');
//     }
//   }

//   Search(data: string) {
//     const filter = {
//       RequestNo: [
//         {
//           value: data,
//           matchMode: '=',
//           operator: 'and',
//         },
//       ],
//     };

//     if (this.fTable != null) {
//       this.fTable.first = 0;
//       this.fTable.filters = filter;
//     }

//     const event: TableLazyLoadEvent = {
//       first: 0,
//       rows: this.fTable?.rows,
//       sortField: null,
//       sortOrder: null,
//       filters: filter,
//     };

//     this.NextPage(event);
//   }

//   ResetTable() {
//     this.search = '';

//     if (this.fTable) {
//       this.fTable.first = 0;
//       this.fTable.clearFilterValues();
//       this.fTable.saveState();
//     }

//     this.Query.Filter = null;
//     this.GetData();
//   }

//   ActionClick(data: MaterialRequestDto | null, action: string) {
//     if (data) {
//       switch (action) {
//         case 'Update':
//           this.router.navigate(['/material-requests/form'], {
//             queryParams: { id: data?.id },
//           });
//           break;
//         case 'Delete':
//           this.loadingService.start();
//           this.materialRequestService
//             .Delete(data.id)
//             .pipe(takeUntil(this.ngUnsubscribe))
//             .subscribe({
//               next: (res) => {
//                 this.loadingService.stop();
//                 const currentPaging = this.PagingSignal();
//                 const updatedData = currentPaging.data.filter(
//                   (item) => item.id !== data.id,
//                 );

//                 this.PagingSignal.set({
//                   ...currentPaging,
//                   data: updatedData,
//                   totalElements: currentPaging.totalElements - 1,
//                 });
//                 this.cdr.markForCheck();
//                 this.messageService.add({
//                   severity: 'success',
//                   summary: 'Success',
//                   detail: 'Material Request deleted successfully',
//                 });
//               },
//               error: (err) => {
//                 this.loadingService.stop();
//                 this.cdr.markForCheck();
//               },
//             });
//           break;
//         case 'RequestApproval':
//           this.openApproveDialog(data);
//           break;
//         case 'Approve':
//           this.updateStatus(data, 'Approved');
//           break;
//         case 'Reject':
//           this.updateStatus(data, 'Rejected');
//           break;
//       }
//     }
//   }

//   onEllipsisClick(event: any, material: MaterialRequestDto, menu: any) {
//     this.menuItems = [];

//     // Always allow edit if still Requested
//     if (material.status === 'Draft') {
//       this.menuItems.push(
//         {
//           label: 'Edit',
//           icon: 'pi pi-pencil',
//           command: () => this.ActionClick(material, 'Update'),
//         },
//         {
//           label: 'Request Approval',
//           icon: 'pi pi-send',
//           command: () => this.ActionClick(material, 'RequestApproval'),
//         },
//         {
//           label: 'Delete',
//           icon: 'pi pi-trash',
//           command: () => this.ActionClick(material, 'Delete'),
//         },
//       );
//     }

//     // If pending approval → management can approve/reject
//     if (
//       material.status === 'PendingApproval' &&
//       this.selectedUserId === material.approvedById
//     ) {
//       this.menuItems.push(
//         {
//           label: 'Approve',
//           icon: 'pi pi-check',
//           command: () => this.ActionClick(material, 'Approve'),
//         },
//         {
//           label: 'Reject',
//           icon: 'pi pi-times',
//           command: () => this.openRejectDialog(material),
//         },
//       );
//     }

//     if (material.status === 'Approved') {
//       this.menuItems.push({
//         label: 'Issued',
//         icon: 'pi pi-receipt',
//         command: () => this.updateStatus(material, 'Issued'),
//       });
//     }

//     if (material.status === 'Issued') {
//       this.menuItems.push({
//         label: 'Completed',
//         icon: 'pi pi-check-circle',
//         command: () => this.updateStatus(material, 'Completed'),
//       });
//     }

//     menu.toggle(event);
//   }

//   updateStatus(material: MaterialRequestDto, status: string) {
//     this.loadingService.start();

//     this.materialRequestService
//       .UpdateStatus({
//         id: material.id,
//         status: status,
//         approvedById: this.selectedApprovalUserId ?? undefined,
//         rejectionReason: this.rejectReason ?? undefined,
//       }) // create this API
//       .pipe(takeUntil(this.ngUnsubscribe))
//       .subscribe({
//         next: () => {
//           material.status = status;
//           this.loadingService.stop();
//           this.showApprovalDialog = false;
//           this.showRejectedDialog = false;
//           this.cdr.markForCheck();
//           this.messageService.add({
//             severity: 'success',
//             summary: 'Success',
//             detail: `Status updated to ${status}`,
//           });
//         },
//         error: () => {
//           this.loadingService.stop();
//           this.cdr.markForCheck();
//         },
//       });
//   }

//   openApproveDialog(material: MaterialRequestDto) {
//     this.userSelections$ = this.userService
//       .GetMany({
//         Page: 1,
//         PageSize: 1000000,
//         OrderBy: 'FirstName desc',
//         Filter: null,
//         Select: null,
//         Includes: null,
//       })
//       .pipe(
//         map((res) =>
//           res.data.map((user) => ({
//             label: `${user.firstName} ${user.lastName}`,
//             value: user.id,
//           })),
//         ),
//       );
//     this.selectedMaterial = material;
//     this.selectedApprovalUserId = null;
//     this.showApprovalDialog = true;
//   }

//   openRejectDialog(material: MaterialRequestDto) {
//     this.selectedMaterial = material;
//     this.showRejectedDialog = true;
//     this.cdr.markForCheck();
//   }

//   SetApproval() {
//     if (!this.selectedApprovalUserId || !this.selectedMaterial) {
//       this.messageService.add({
//         severity: 'warn',
//         summary: 'Warning',
//         detail: 'Please select approver',
//       });
//       return;
//     }

//     this.updateStatus(this.selectedMaterial, 'PendingApproval');
//   }

//   ngOnDestroy(): void {
//     this.ngUnsubscribe.next();
//     this.ngUnsubscribe.complete();
//     this.loadingService.stop();
//   }
// }
