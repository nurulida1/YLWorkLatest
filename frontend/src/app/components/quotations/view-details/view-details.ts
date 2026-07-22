import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { LoadingService } from '../../../services/loading.service';
import { MessageService } from 'primeng/api';
import { QuotationService } from '../../../services/quotationService.service';
import { Subject, takeUntil } from 'rxjs';
import { QuotationDto } from '../../../models/Quotation';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { DatePickerModule } from 'primeng/datepicker';

@Component({
  selector: 'app-view-details',
  imports: [
    CommonModule,
    ButtonModule,
    InputTextModule,
    FormsModule,
    TextareaModule,
    TableModule,
    SelectModule,
    RouterLink,
    DialogModule,
    DatePickerModule,
  ],
  template: `
    <div class="flex flex-col gap-3 tracking-wide w-full h-full px-6 py-4">
      <div class="flex flex-row justify-between items-center">
        <div
          class="flex flex-row items-center gap-2 text-slate-500 tracking-wide"
        >
          <div
            [routerLink]="'/dashboard'"
            class="cursor-pointer hover:text-indigo-600 transition-colors"
          >
            Dashboard
          </div>
          <span class="text-slate-300">/</span>
          <div
            [routerLink]="'/quotations'"
            class="cursor-pointer hover:text-indigo-600 transition-colors"
          >
            Quotations
          </div>
          <span class="text-slate-300">/</span>
          <div class="text-slate-900 font-semibold">
            {{ quotationData()?.quotationNo }}
          </div>
        </div>
        <p-select
          [options]="actionMenus"
          [(ngModel)]="selectedAction"
          (ngModelChange)="onActionChange($event)"
          optionLabel="label"
          optionValue="value"
          styleClass="w-max!"
          appendTo="body"
          inputStyleClass="w-max! whitespace-nowrap"
        >
          <ng-template pTemplate="selectedItem" let-item>
            <div class="flex items-center gap-2" *ngIf="item">
              <i class="pi" [ngClass]="[item.icon, item.color]"></i>
              <span>{{ item.label }}</span>
            </div>
          </ng-template>

          <ng-template pTemplate="item" let-item>
            <div class="flex flex-row items-start gap-3">
              <i
                class="pi"
                [ngClass]="[
                  item.icon,
                  item.color,
                  item.description ? 'mt-1.5' : 'mt-1',
                ]"
              ></i>

              <div class="flex flex-col">
                <span>{{ item.label }}</span>

                <span *ngIf="item.description" class="text-sm text-gray-500">
                  {{ item.description }}
                </span>
              </div>
            </div>
          </ng-template>
        </p-select>
      </div>

      <div class="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div class="grid grid-cols-12 items-center gap-5">
          <div class="col-span-12 lg:col-span-6 flex flex-col gap-2">
            <label class="block font-medium text-slate-700"
              >Quotation No.</label
            >

            <strong>{{ quotationData()?.quotationNo }}</strong>
          </div>
          <div class="col-span-12 lg:col-span-6 flex flex-col gap-2">
            <label class="block font-medium text-slate-700">Date</label>
            <strong>{{ quotationData()?.quotationDate | date }}</strong>
          </div>
        </div>

        <hr class="border-slate-100 my-6" />

        <!-- Company & Client Selection -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- From Section -->
          <div class="space-y-4">
            <div class="flex flex-row justify-between items-center">
              <h3 class="font-semibold text-slate-900 flex items-center gap-2">
                <i class="pi pi-building text-blue-600"></i> From
              </h3>
            </div>

            <div
              class="grid grid-cols-2 gap-4 text-sm"
              *ngIf="quotationData()?.fromCompany"
            >
              <!-- Billing -->
              <div class="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p class="font-bold text-slate-900 mb-2">Billing</p>

                <p class="text-slate-600 leading-relaxed">
                  {{
                    quotationData()?.fromCompany?.billingAddress?.addressLine1
                  }}
                  <span
                    *ngIf="
                      quotationData()?.fromCompany?.billingAddress?.addressLine2
                    "
                  >
                    ,
                    {{
                      quotationData()?.fromCompany?.billingAddress?.addressLine2
                    }}
                  </span>
                  <br />
                  {{ quotationData()?.fromCompany?.billingAddress?.poscode }}
                  {{ quotationData()?.fromCompany?.billingAddress?.city }},
                  {{ quotationData()?.fromCompany?.billingAddress?.state }}
                </p>
              </div>

              <div class="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p class="font-bold text-slate-900 mb-2">Delivery</p>

                <p class="text-slate-600 leading-relaxed">
                  {{
                    quotationData()?.fromCompany?.deliveryAddress?.addressLine1
                  }}
                  <span
                    *ngIf="
                      quotationData()?.fromCompany?.deliveryAddress
                        ?.addressLine2
                    "
                  >
                    ,
                    {{
                      quotationData()?.fromCompany?.deliveryAddress
                        ?.addressLine2
                    }}
                  </span>
                  <br />
                  {{ quotationData()?.fromCompany?.deliveryAddress?.poscode }}
                  {{ quotationData()?.fromCompany?.deliveryAddress?.city }},
                  {{ quotationData()?.fromCompany?.deliveryAddress?.state }}
                </p>
              </div>
            </div>
          </div>

          <!-- Client Section -->
          <div class="space-y-4">
            <div class="flex flex-row items-center justify-between">
              <h3 class="font-semibold text-slate-900 flex items-center gap-2">
                <i class="pi pi-user text-blue-600"></i> Client
              </h3>
            </div>

            <div
              class="grid grid-cols-2 gap-4 text-sm"
              *ngIf="quotationData()?.client"
            >
              <!-- Billing -->
              <div class="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p class="font-bold text-slate-900 mb-2">Billing</p>

                <p class="text-slate-600 leading-relaxed">
                  {{ quotationData()?.client?.billingAddress?.addressLine1 }}
                  <span
                    *ngIf="
                      quotationData()?.client?.billingAddress?.addressLine2
                    "
                  >
                    ,
                    {{ quotationData()?.client?.billingAddress?.addressLine2 }}
                  </span>
                  <br />
                  {{ quotationData()?.client?.billingAddress?.poscode }}
                  {{ quotationData()?.client?.billingAddress?.city }},
                  {{ quotationData()?.client?.billingAddress?.state }}
                </p>
              </div>

              <!-- Delivery -->
              <div class="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p class="font-bold text-slate-900 mb-2">Delivery</p>

                <p class="text-slate-600 leading-relaxed">
                  {{ quotationData()?.client?.deliveryAddress?.addressLine1 }}
                  <span
                    *ngIf="
                      quotationData()?.client?.deliveryAddress?.addressLine2
                    "
                  >
                    ,
                    {{ quotationData()?.client?.deliveryAddress?.addressLine2 }}
                  </span>
                  <br />
                  {{ quotationData()?.client?.deliveryAddress?.poscode }}
                  {{ quotationData()?.client?.deliveryAddress?.city }},
                  {{ quotationData()?.client?.deliveryAddress?.state }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <hr class="border-slate-100 my-6" />

        <div class="col-span-12 flex flex-row gap-2 text-black font-bold mb-3">
          Attention : {{ quotationData()?.client?.contactPerson1 }}
          <span *ngIf="quotationData()?.client?.contactPerson2"
            >/ {{ quotationData()?.client?.contactPerson2 }}</span
          >
        </div>

        <div class="col-span-12 flex flex-col gap-2">
          <span class="whitespace-nowrap text-black font-bold">
            Re: Request for quotation - {{ quotationData()?.subject }}
          </span>
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
            [value]="quotationData()?.quotationItems || []"
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
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-row let-rowIndex="rowIndex">
              <tr>
                <!--  VIEW MODE -->

                <ng-container [ngSwitch]="row.rowType">
                  <!-- LINE -->
                  <ng-container *ngSwitchCase="'LineItem'">
                    <td class="text-center!">{{ row.item }}</td>
                    <td>
                      <div [innerHTML]="row.description"></div>
                    </td>
                    <td class="text-center!">{{ row.unit }}</td>
                    <td class="text-center!">
                      {{ row.quantity }}
                    </td>
                    <td class="text-center!">
                      {{ row.discount }}
                    </td>
                    <td class="text-right!">
                      {{ row.unitPrice | number: '1.2-2' }}
                    </td>
                    <td class="text-right! font-semibold">
                      {{ row.totalPrice | number: '1.2-2' }}
                    </td>
                  </ng-container>

                  <!-- SECTION -->
                  <ng-container *ngSwitchCase="'CategoryHeader'">
                    <td></td>
                    <td class="font-bold underline">
                      {{ row.description }}
                    </td>

                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                  </ng-container>

                  <!-- NOTE -->
                  <ng-container *ngSwitchCase="'NoteRow'">
                    <td class="text-center! italic">
                      {{ row.item }}
                    </td>
                    <td colspan="6" class="italic">
                      {{ row.description }}
                    </td>
                  </ng-container>
                </ng-container>
              </tr>
            </ng-template>
            <ng-template #footer>
              <tr>
                <td colspan="6" class="text-right!">SubTotal</td>
                <td colspan="1" class="text-right!">
                  {{ quotationData()?.subTotal | number: '1.2' }}
                </td>
              </tr>
              <tr>
                <td colspan="6" class="text-right! text-red-500!">
                  - Discount (RM)
                </td>
                <td colspan="1" class="text-right!">
                  {{ quotationData()?.discount | number: '1.2' }}
                </td>
              </tr>
              <tr>
                <td colspan="6" class="text-right! font-bold! bg-gray-50!">
                  Total Amount
                </td>
                <td colspan="1" class="text-right! font-bold! bg-gray-50!">
                  {{ quotationData()?.totalAmount | number: '1.2' }}
                </td>
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
        </div>

        <div class="flex flex-col border-t border-gray-100 my-5 pt-5">
          <div class="flex flex-row items-center gap-2">
            <div class="pi pi-file text-blue-600"></div>
            <div class="font-semibold">Terms & Conditions</div>
          </div>

          <div class="pl-6 grid grid-cols-12 gap-2 mt-5 mb-2">
            <div class="col-span-1 font-bold">Terms</div>
            <div class="col-span-11">: {{ quotationData()?.paymentTerms }}</div>
            <div class="col-span-1 font-bold">Validity</div>
            <div class="col-span-11">
              : {{ quotationData()?.validity }}
              {{ quotationData()?.validityType }} (with effect from the date of
              this quotation)
            </div>
          </div>

          <div class="pl-6 flex flex-col gap-2">
            <ng-container
              *ngFor="let term of quotationData()?.termsAndConditions"
            >
              <div class="grid grid-cols-12 gap-1">
                <div class="col-span-1 font-bold">
                  {{ term.termsAndCondition.title }}
                </div>
                <div class="col-span-11">
                  : {{ term.termsAndCondition.description }}
                </div>
              </div>
            </ng-container>
          </div>
        </div>
      </div>
    </div>

    <p-dialog
      header="Convert Quotation to Sales Order"
      [(visible)]="SODialog"
      [modal]="true"
      [style]="{ width: '450px' }"
      [draggable]="false"
      [resizable]="false"
      (onHide)="resetConvertForm()"
    >
      <div class="flex flex-col gap-4 py-2 text-sm text-gray-700 tracking-wide">
        <div class="flex flex-col gap-1">
          <label class="font-semibold text-gray-600"
            >Client PO Number <span class="text-red-500">*</span></label
          >
          <input
            type="text"
            pInputText
            [(ngModel)]="soForm.clientPONumber"
            placeholder="e.g., PO-12345"
            class="w-full"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="font-semibold text-gray-600">PO Received Date</label>

          <p-datepicker
            [(ngModel)]="soForm.clientPODate"
            appendTo="body"
            [showIcon]="true"
            dateFormat="dd/mm/yy"
            inputStyleClass="w-full"
            styleClass="w-full"
          >
          </p-datepicker>
        </div>

        <div class="flex flex-col gap-1">
          <label class="font-semibold text-gray-600">Remarks</label>
          <input
            type="text"
            pInputText
            [(ngModel)]="soForm.remarks"
            placeholder="Optional notes..."
            class="w-full"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="font-semibold text-gray-600"
            >PO Attachment File <span class="text-red-500">*</span></label
          >
          <div
            class="flex items-center justify-between gap-2 border border-dashed border-gray-300 rounded p-3 bg-gray-50"
          >
            <input
              type="file"
              id="poFile"
              (change)="onFileSelected($event)"
              accept=".pdf,.png,.jpg,.jpeg"
              class="hidden"
              #fileInput
            />
            <div class="flex flex-col truncate max-w-[250px]">
              <span
                *ngIf="soForm.clientPOAttachment"
                (click)="downloadLocalFile(soForm.clientPOAttachment)"
                class="text-xs text-blue-600 hover:text-blue-800 font-medium underline cursor-pointer truncate flex items-center gap-1"
              >
                <i class="pi pi-download text-[10px]"></i>
                {{ soForm.clientPOAttachment.name }}
              </span>
              <span
                *ngIf="!soForm.clientPOAttachment"
                class="text-xs text-gray-500 font-medium truncate"
                >No file chosen</span
              >
            </div>
            <p-button
              label="Choose File"
              size="small"
              icon="pi pi-upload"
              severity="secondary"
              (click)="fileInput.click()"
            ></p-button>
          </div>
        </div>
      </div>

      <ng-template #footer>
        <div class="flex justify-end gap-2 mt-2">
          <p-button
            label="Cancel"
            severity="secondary"
            styleClass="py-1.5!"
            (click)="SODialog = false"
          ></p-button>
          <p-button
            label="Convert"
            severity="success"
            styleClass="py-1.5!"
            [disabled]="!soForm.clientPONumber || !soForm.clientPOAttachment"
            (click)="submitConvertToSO()"
          ></p-button>
        </div>
      </ng-template>
    </p-dialog>
  `,
  styleUrl: './view-details.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewDetails implements OnInit, OnDestroy {
  @ViewChild('printArea') printArea!: ElementRef;

  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly loadingService = inject(LoadingService);
  private readonly messageService = inject(MessageService);
  private readonly quotationService = inject(QuotationService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  remarks: string | null = null;
  currentId: string | null = null;
  quotationNo: string | null = null;

  isPrinting: boolean = false;
  SODialog: boolean = false;

  soForm = {
    quotationData: null as any,
    clientPONumber: '',
    clientPODate: '',
    remarks: '',
    clientPOAttachment: null as File | null,
  };

  actionMenus: {
    label: string;
    description?: string;
    value: string | null;
    icon?: string;
    color?: string;
    action?: any;
  }[] = [];
  selectedAction: string | null = null;

  quotationData = signal<QuotationDto | null>({} as QuotationDto);

  constructor() {
    this.currentId = this.activatedRoute.snapshot.queryParams['id'];
    this.quotationNo = this.activatedRoute.snapshot.queryParams['quoteNo'];
  }

  ngOnInit(): void {
    this.GetData();
  }

  GetData() {
    this.loadingService.start();
    this.quotationService
      .GetOne({
        Page: 1,
        PageSize: 1,
        OrderBy: null,
        Select: null,
        Includes: `QuotationItems,TermsAndConditions,Client.BillingAddress,FromCompany.BillingAddress,CreatedBy`,
        Filter: this.quotationNo
          ? `QuotationNo=${this.quotationNo}`
          : `Id=${this.currentId}`,
      })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();

          if (res && res.quotationItems) {
            res.quotationItems = [...res.quotationItems].sort(
              (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0),
            );
          }

          this.quotationData.set(res);

          if (!this.currentId && res) {
            this.currentId = res.id;
          }

          if (res) this.updateActionMenus(res.status);
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loadingService.stop();
        },
      });
  }

  updateActionMenus(status: string) {
    if (status === 'Draft') {
      this.actionMenus = [
        {
          label: 'Waiting for approval',
          value: null,
          description: 'This quotation is currently in draft state',
          icon: 'pi-clock',
          color: 'text-orange-600',
        },
        {
          label: 'Approve quotation',
          value: 'Approved',
          description: 'Approve and send quotation to client',
          icon: 'pi-check-circle',
          color: 'text-green-600',
        },
        {
          label: 'Reject quotation',
          value: 'Rejected',
          description: 'Reject and return quotation for revision',
          icon: 'pi-times-circle',
          color: 'text-red-600',
        },
      ];
    } else if (status === 'Approved') {
      this.actionMenus = [
        {
          label: 'Approved',
          value: null,
          description: 'This quotation is currently in Approved state',
          icon: 'pi-check-circle',
          color: 'text-green-600',
        },
        {
          label: 'Mark as Sent',
          value: 'Sent',
          description: 'Mark this quotation as sent to the client',
          icon: 'pi-send',
          color: 'text-blue-600',
        },
        {
          label: 'Download PDF',
          value: 'Download',
          description: 'Download this quote as PDF',
          icon: 'pi-file-pdf',
          color: 'text-red-600',
        },
        {
          label: 'Reject quotation',
          value: 'Rejected',
          description: 'Reject and return quotation for revision',
          icon: 'pi-times-circle',
          color: 'text-red-600',
        },
      ];
    } else if (status === 'Accepted') {
      this.actionMenus = [
        {
          label: 'Accepted',
          value: null,
          description: 'This quotation is currently in Accepted state',
          icon: 'pi-check-circle',
          color: 'text-green-600',
        },
        {
          label: 'Download PDF',
          value: 'Download',
          description: 'Download this quote as PDF',
          icon: 'pi-file-pdf',
          color: 'text-red-600',
        },
        {
          label: 'Start Job',
          value: 'WorkOrder',
          description: 'Generate new job',
          icon: 'pi-briefcase',
          color: 'text-blue-600',
        },
      ];
    } else if (status === 'Sent') {
      this.actionMenus = [
        {
          label: 'Sent',
          value: null,
          description: 'This quotation has been sent to the client',
          icon: 'pi-send',
          color: 'text-blue-600',
        },
        {
          label: 'Mark as Accepted',
          value: 'Accepted',
          description: 'Mark this quotation as accepted by the client',
          icon: 'pi-check-circle',
          color: 'text-green-600',
        },
        {
          label: 'Mark as Rejected',
          value: 'Rejected',
          description: 'Mark this quotation as rejected by the client',
          icon: 'pi-times-circle',
          color: 'text-red-600',
        },
        {
          label: 'Download PDF',
          value: 'Download',
          description: 'Download sent quotation as PDF',
          icon: 'pi-file-pdf',
          color: 'text-red-600',
        },
      ];
    }
  }

  updateStatus(status: string) {
    if (!this.currentId) return;

    this.loadingService.start();

    this.quotationService
      .UpdateStatus(this.currentId, status, this.remarks)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();
          this.messageService.add({
            severity: 'success',
            summary: 'Status Updated',
            detail: `Quotation has been ${status.toLowerCase()} successfully.`,
          });

          this.router.navigate(['/quotations']);
        },
        error: (err) => {
          this.loadingService.stop();

          this.messageService.add({
            severity: 'error',
            summary: 'Update Failed',
            detail: err?.error?.message || 'Unable to update quotation status.',
          });
        },
      });
  }

  printQuotation(): void {}

  sendQuotationEmail() {
    const email = this.quotationData()?.client?.email;

    if (!email) {
      console.warn('Client email not found');
      return;
    }
  }

  onActionChange(value: string | null) {
    if (!value) return;

    switch (value) {
      case 'Download':
        this.downloadQuotation();
        break;

      case 'WorkOrder':
        this.startJob();
        break;

      case 'Accepted':
        this.showSODialog();
        break;

      default:
        this.updateStatus(value);
        break;
    }
  }

  downloadQuotation() {}

  showSODialog() {
    this.soForm.quotationData = this.quotationData();
    this.SODialog = true;
    this.cdr.markForCheck();
  }

  startJob() {
    if (!this.currentId) return;

    this.router.navigate(['/work-order/create'], {
      queryParams: { quotationId: this.currentId },
    });
  }

  resetConvertForm() {
    this.soForm = {
      quotationData: null,
      clientPONumber: '',
      clientPODate: '',
      remarks: '',
      clientPOAttachment: null,
    };
  }

  onFileSelected(event: any) {
    const fileList: FileList = event.target.files;
    if (fileList.length > 0) {
      this.soForm.clientPOAttachment = fileList[0];
    }
  }

  downloadLocalFile(file: File | null) {
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);

    const tempAnchor = document.createElement('a');
    tempAnchor.href = objectUrl;
    tempAnchor.download = file.name;

    document.body.appendChild(tempAnchor);
    tempAnchor.click();

    document.body.removeChild(tempAnchor);
    URL.revokeObjectURL(objectUrl);
  }

  submitConvertToSO() {
    console.log(this.soForm);
    if (
      !this.soForm.clientPONumber ||
      !this.soForm.clientPOAttachment ||
      !this.soForm.quotationData
    ) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please provide a PO Number and upload an attachment file.',
      });
      return;
    }

    this.loadingService.start();
    this.SODialog = false;

    const quotationId = this.soForm.quotationData.id;

    let formattedPODate: string | undefined = undefined;
    if (this.soForm.clientPODate) {
      const dateObj = new Date(this.soForm.clientPODate);
      if (!isNaN(dateObj.getTime())) {
        formattedPODate = dateObj.toISOString().split('T')[0];
      }
    }

    this.quotationService
      .ConvertToSalesOrder(
        quotationId,
        this.soForm.clientPONumber,
        formattedPODate || undefined,
        this.soForm.clientPOAttachment || undefined,
        this.soForm.remarks || undefined,
      )
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res: any) => {
          this.loadingService.stop();
          this.messageService.add({
            severity: 'success',
            summary: 'Converted Successfully',
            detail: `Sales Order generated: ${res.salesOrderNo}`,
          });
          this.router.navigate(['/quotations']);

          this.resetConvertForm();
          this.cdr.markForCheck();
        },
        error: () => {
          this.loadingService.stop();
        },
      });
  }

  ngOnDestroy(): void {
    this.loadingService.stop();
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
