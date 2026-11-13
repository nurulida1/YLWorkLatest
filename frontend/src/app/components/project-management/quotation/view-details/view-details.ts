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
import { LoadingService } from '../../../../services/loading.service';
import { MessageService } from 'primeng/api';
import { QuotationService } from '../../../../services/quotationService.service';
import { Subject, takeUntil } from 'rxjs';
import { QuotationDto } from '../../../../models/Quotation';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { DatePickerModule } from 'primeng/datepicker';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
    <div class="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
      <div class="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <!-- Page navigation and actions -->
        <div class="flex flex-col gap-4">
          <nav class="flex flex-wrap items-center gap-2">
            <a
              routerLink="/dashboard"
              class="text-slate-500 hover:text-blue-600"
            >
              Dashboard
            </a>
            <i class="pi pi-angle-right text-xs text-slate-300"></i>
            <a
              routerLink="/quotations"
              class="text-slate-500 hover:text-blue-600"
            >
              Quotations
            </a>
            <i class="pi pi-angle-right text-xs text-slate-300"></i>
            <span class="font-semibold text-slate-800">
              {{ quotationData()?.quotationNo || 'Quotation Details' }}
            </span>
          </nav>

          <div
            class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
          >
            <div class="flex items-center gap-3">
              <div>
                <div class="flex flex-wrap items-center gap-3">
                  <h1
                    class="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl"
                  >
                    Quotation Details
                  </h1>

                  <span
                    *ngIf="quotationData()?.status"
                    class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
                    [ngClass]="{
                      'bg-amber-200 text-amber-700':
                        quotationData()?.status === 'Draft',
                      'bg-blue-100 text-blue-700':
                        quotationData()?.status === 'Sent',
                      'bg-emerald-100 text-emerald-700':
                        quotationData()?.status === 'Approved' ||
                        quotationData()?.status === 'Accepted',
                      'bg-red-100 text-red-700':
                        quotationData()?.status === 'Rejected' ||
                        quotationData()?.status === 'Expired',
                    }"
                  >
                    <span class="h-1.5 w-1.5 rounded-full bg-current"></span>
                    {{ quotationData()?.status }}
                  </span>
                </div>
                <p class="mt-1 text-slate-500">
                  Review and manage your quotation.
                </p>
              </div>
            </div>

            <!-- Quotation actions -->
            <div class="flex flex-wrap items-center gap-2 sm:justify-end">
              <p-select
                [options]="actionMenus"
                [(ngModel)]="selectedAction"
                (ngModelChange)="onActionChange($event)"
                optionLabel="label"
                optionValue="value"
                placeholder="Quotation actions"
                styleClass="quotation-action-select"
                appendTo="body"
                [showClear]="false"
              >
                <ng-template pTemplate="selectedItem" let-item>
                  <div class="flex items-center gap-2" *ngIf="item">
                    <i class="pi" [ngClass]="[item.icon, item.color]"></i>
                    <span>{{ item.label }}</span>
                  </div>
                </ng-template>

                <ng-template pTemplate="item" let-item>
                  <div class="flex items-start gap-3 py-1">
                    <div
                      class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50"
                    >
                      <i class="pi" [ngClass]="[item.icon, item.color]"></i>
                    </div>
                    <div class="flex min-w-0 flex-col gap-0.5">
                      <span class="font-medium text-slate-800">{{
                        item.label
                      }}</span>
                      <span
                        *ngIf="item.description"
                        class="text-xs leading-relaxed text-slate-500"
                      >
                        {{ item.description }}
                      </span>
                    </div>
                  </div>
                </ng-template>
              </p-select>
            </div>
          </div>
        </div>

        <!-- Document preview -->
        <div
          class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
        >
          <!-- Document content -->
          <div class="p-5 sm:p-8 lg:p-12">
            <!-- Company header -->
            <div class="flex flex-col gap-6 border-b border-slate-800 pb-3">
              <div
                class="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-start"
              >
                <div
                  *ngIf="quotationData()?.fromCompany?.logoImage"
                  class="flex h-35 w-45 shrink-0 items-center justify-center"
                >
                  <img
                    [src]="quotationData()?.fromCompany?.logoImage"
                    alt="Company logo"
                    class="h-full w-full object-fill"
                  />
                </div>

                <div class="min-w-0">
                  <div class="flex flex-row items-end gap-2">
                    <div class="text-xl font-extrabold uppercase tracking-wide">
                      {{ quotationData()?.fromCompany?.name || 'Company Name' }}
                    </div>

                    <div
                      *ngIf="
                        quotationData()?.fromCompany?.registrationNo ||
                        quotationData()?.fromCompany?.ssmRegNo
                      "
                    >
                      {{
                        quotationData()?.fromCompany?.registrationNo ||
                          quotationData()?.fromCompany?.ssmRegNo
                      }}
                    </div>
                    <div *ngIf="quotationData()?.fromCompany?.tinNo">
                      {{ quotationData()?.fromCompany?.tinNo }}
                    </div>
                    <div *ngIf="quotationData()?.fromCompany?.sstRegNo">
                      {{ quotationData()?.fromCompany?.sstRegNo }}
                    </div>
                  </div>
                  <div class="mt-1 leading-relaxed">
                    <p>
                      {{
                        quotationData()?.fromCompany?.billingAddress
                          ?.addressLine1
                      }}
                    </p>
                    <p
                      *ngIf="
                        quotationData()?.fromCompany?.billingAddress
                          ?.addressLine2
                      "
                    >
                      {{
                        quotationData()?.fromCompany?.billingAddress
                          ?.addressLine2
                      }}
                    </p>
                    <p>
                      {{
                        quotationData()?.fromCompany?.billingAddress?.postcode
                      }}
                      {{ quotationData()?.fromCompany?.billingAddress?.city }}
                      {{ quotationData()?.fromCompany?.billingAddress?.state }}
                    </p>
                    <div class="flex flex-row items-center gap-1">
                      <p *ngIf="quotationData()?.fromCompany?.contactNo">
                        Tel: {{ quotationData()?.fromCompany?.contactNo }}
                      </p>
                      <p *ngIf="quotationData()?.fromCompany?.faxNo">
                        Fax: {{ quotationData()?.fromCompany?.faxNo }}
                      </p>
                    </div>
                    <a
                      *ngIf="quotationData()?.fromCompany?.websiteUrl"
                      class="underline"
                    >
                      {{ quotationData()?.fromCompany?.websiteUrl }}
                    </a>
                  </div>
                </div>
              </div>

              <div class="shrink-0 text-center sm:min-w-[220px]">
                <h1
                  class="text-3xl font-extrabold tracking-widest text-slate-900"
                >
                  QUOTATION
                </h1>
              </div>
            </div>

            <div class="mt-4 space-y-2 flex flex-col items-start">
              <div
                class="grid grid-cols-12 items-center font-medium gap-2 text-slate-900"
              >
                <span class="col-span-1">Ref. No:</span>
                <span class="col-span-11">
                  {{ quotationData()?.quotationNo || '-' }}
                </span>
              </div>
              <div
                class="grid grid-cols-12 items-center font-medium gap-2 text-slate-900"
              >
                <span class="col-span-1">Date</span>
                <span class="col-span-11">
                  {{ quotationData()?.quotationDate | date: 'dd/MM/yyyy' }}
                </span>
              </div>
            </div>

            <!-- Client details -->
            <div class="grid grid-cols-1 gap-8 py-7 md:grid-cols-2">
              <!-- Bill to -->
              <div>
                <h3 class="text-base font-bold">
                  {{ quotationData()?.client?.name || '-' }}
                </h3>

                <div class="mt-1 leading-relaxed">
                  <p>
                    {{ quotationData()?.client?.billingAddress?.addressLine1 }}
                  </p>
                  <p
                    *ngIf="
                      quotationData()?.client?.billingAddress?.addressLine2
                    "
                  >
                    {{ quotationData()?.client?.billingAddress?.addressLine2 }}
                  </p>
                  <p>
                    {{ quotationData()?.client?.billingAddress?.city }}
                  </p>
                  <p>
                    {{ quotationData()?.client?.billingAddress?.postcode }},
                    {{ quotationData()?.client?.billingAddress?.state }}
                  </p>

                  <p
                    *ngIf="quotationData()?.client?.primaryContactNo"
                    class="pt-2"
                  >
                    Tel: {{ quotationData()?.client?.primaryContactNo }}
                  </p>
                  <p *ngIf="quotationData()?.client?.secondaryContactNo">
                    Tel: {{ quotationData()?.client?.secondaryContactNo }}
                  </p>
                </div>
              </div>

              <!-- Contact No -->
              <div class="md:text-right font-bold">
                <div class="space-y-1">
                  <div *ngIf="quotationData()?.client?.contactNo">
                    <span>Tel No: </span>
                    <span>
                      {{ quotationData()?.client?.contactNo }}
                    </span>
                  </div>

                  <div *ngIf="quotationData()?.client?.faxNo">
                    <span>Fax: </span>
                    <span>
                      {{ quotationData()?.client?.faxNo }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Attention -->
            <div class="flex flex-row items-center font-bold gap-2">
              <span>Attention: </span>
              <span>
                {{ quotationData()?.client?.primaryContactPerson || '-' }}
                <ng-container
                  *ngIf="quotationData()?.client?.secondaryContactPerson"
                >
                  / {{ quotationData()?.client?.secondaryContactPerson }}
                </ng-container>
              </span>
            </div>

            <!-- Subject -->
            <div class="mb-4 py-3 font-bold">
              <p class="leading-relaxed">
                <span>Re: </span>
                {{ quotationData()?.subject || '-' }}
              </p>
            </div>

            <!-- Quotation items -->
            <div class="mb-8">
              <div class="overflow-x-auto">
                <p-table
                  [value]="quotationData()?.quotationItems || []"
                  dataKey="id"
                  [paginator]="false"
                  [scrollable]="true"
                  responsiveLayout="scroll"
                  size="small"
                  showGridlines
                >
                  <ng-template #header>
                    <tr>
                      <th class="w-14 text-center!">Item</th>
                      <th class="min-w-[240px]">Description</th>
                      <th class="w-16 text-center!">Unit</th>
                      <th class="w-16 text-center!">Qty</th>
                      <th class="w-20 text-center!">Disc (%)</th>
                      <th class="w-32 text-right!">Unit Price (RM)</th>
                      <th class="w-32 text-right!">Total (RM)</th>
                    </tr>
                  </ng-template>

                  <ng-template #body let-row>
                    <tr>
                      <ng-container *ngIf="row.rowType === 'LineItem'">
                        <td class="text-center!">
                          {{ row.item || '—' }}
                        </td>
                        <td>
                          <div
                            class="quotation-item-description leading-relaxed"
                            [innerHTML]="row.description || '—'"
                          ></div>
                        </td>
                        <td class="text-center!">{{ row.unit || '—' }}</td>
                        <td class="text-center! tabular-nums">
                          {{ row.quantity ?? '—' }}
                        </td>
                        <td class="text-center! tabular-nums">
                          {{ row.discount ?? 0 }}
                        </td>
                        <td class="text-right! tabular-nums">
                          {{
                            row.unitPrice != null
                              ? (row.unitPrice | number: '1.2-2')
                              : '—'
                          }}
                        </td>
                        <td class="text-right! font-semibold tabular-nums">
                          {{
                            row.totalPrice != null
                              ? (row.totalPrice | number: '1.2-2')
                              : '—'
                          }}
                        </td>
                      </ng-container>

                      <ng-container *ngIf="row.rowType === 'CategoryHeader'">
                        <td></td>
                        <td colspan="6" class="font-bold">
                          {{ row.description }}
                        </td>
                      </ng-container>

                      <ng-container *ngIf="row.rowType === 'NoteRow'">
                        <td class="text-center! italic">
                          {{ row.item || '' }}
                        </td>
                        <td colspan="6" class="italic">
                          <div [innerHTML]="row.description || ''"></div>
                        </td>
                      </ng-container>
                    </tr>
                  </ng-template>

                  <ng-template #footer>
                    <tr>
                      <td colspan="6" class="text-right! font-semibold">
                        Sub Total
                      </td>
                      <td class="text-right! font-semibold tabular-nums">
                        {{ quotationData()?.subTotal ?? 0.0 | number: '1.2-2' }}
                      </td>
                    </tr>

                    <tr>
                      <td colspan="6" class="text-right! font-semibold">
                        Discount
                      </td>
                      <td class="text-right! font-semibold tabular-nums">
                        {{ quotationData()?.discount ?? 0.0 | number: '1.2-2' }}
                      </td>
                    </tr>

                    <tr>
                      <td colspan="6" class="text-right! font-bold">
                        Total Amount
                      </td>
                      <td
                        class="text-right! text-base font-extrabold tabular-nums"
                      >
                        {{
                          quotationData()?.totalAmount ?? 0.0 | number: '1.2-2'
                        }}
                      </td>
                    </tr>
                  </ng-template>

                  <ng-template #emptymessage>
                    <tr>
                      <td colspan="7" class="py-8 text-center text-sm">
                        No quotation items found.
                      </td>
                    </tr>
                  </ng-template>
                </p-table>
              </div>
            </div>

            <!-- Terms and conditions -->
            <div class="mb-8">
              <h3 class="mb-3 underline font-extrabold">Terms & Conditions</h3>

              <div class="grid grid-cols-12 items-center leading-relaxed ">
                <div class="col-span-2 font-bold">Payment Terms</div>
                <span class="col-span-10">
                  : {{ quotationData()?.paymentTerms || '-' }}</span
                >

                <div
                  class="col-span-2 font-bold"
                  *ngIf="quotationData()?.validity"
                >
                  Validity
                </div>
                <span class="col-span-10" *ngIf="quotationData()?.validity">
                  : {{ quotationData()?.validity }}
                  {{ quotationData()?.validityType }}
                  (with effect from the date of this quotation)
                </span>
                <ng-container
                  *ngFor="let term of quotationData()?.termsAndConditions"
                >
                  <div class="col-span-2 font-bold">
                    {{ term?.title }}
                  </div>
                  <p class="col-span-10">
                    : {{ term?.description }}
                  </p></ng-container
                >
              </div>

              <!-- Signature -->
              <div class="grid grid-cols-12 gap-8 pt-6">
                <div class="col-span-3">
                  <p class="">Yours faithfully,</p>

                  <div class="mt-16 border-b"></div>

                  <div class="mt-3 space-y-1">
                    <p>
                      {{ quotationData()?.createdBy?.fullName || '-' }}
                    </p>
                    <p>
                      {{ quotationData()?.createdBy?.jobTitle || '' }}
                    </p>
                    <p>
                      {{ quotationData()?.createdBy?.email || '' }}
                    </p>
                  </div>
                  <p class="font-medium italic pt-10">
                    Your ELV Solution Provider
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Convert to Sales Order Dialog -->
        <p-dialog
          [(visible)]="SODialog"
          [modal]="true"
          [draggable]="false"
          [resizable]="false"
          [style]="{ width: 'min(520px, calc(100vw - 2rem))' }"
          appendTo="body"
          styleClass="quotation-convert-dialog"
          (onHide)="resetConvertForm()"
        >
          <ng-template #header>
            <div class="flex items-center gap-3">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"
              >
                <i class="pi pi-file-edit text-lg"></i>
              </div>
              <div>
                <h2 class="font-semibold text-slate-900">
                  Convert to Sales Order
                </h2>
                <p class="mt-0.5 text-xs text-slate-500">
                  Enter the client's purchase order details
                </p>
              </div>
            </div>
          </ng-template>

          <div class="flex flex-col gap-5 py-2">
            <div class="rounded-xl border border-blue-100 bg-blue-50/70 p-3">
              <div class="flex items-start gap-2">
                <i class="pi pi-info-circle mt-0.5 text-blue-600"></i>
                <p class="text-xs leading-relaxed text-blue-800">
                  Please provide the client PO number and attachment before
                  converting this quotation into a Sales Order.
                </p>
              </div>
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-sm font-semibold text-slate-700">
                Client PO Number <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                pInputText
                [(ngModel)]="soForm.clientPONumber"
                placeholder="e.g. PO-12345"
                class="w-full"
              />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-sm font-semibold text-slate-700">
                PO Received Date
              </label>
              <p-datepicker
                [(ngModel)]="soForm.clientPODate"
                appendTo="body"
                [showIcon]="true"
                dateFormat="dd/mm/yy"
                placeholder="Select received date"
                inputStyleClass="w-full"
                styleClass="w-full"
              ></p-datepicker>
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-sm font-semibold text-slate-700"
                >Remarks</label
              >
              <input
                type="text"
                pInputText
                [(ngModel)]="soForm.remarks"
                placeholder="Optional notes..."
                class="w-full"
              />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-sm font-semibold text-slate-700">
                PO Attachment <span class="text-red-500">*</span>
              </label>

              <input
                type="file"
                id="poFile"
                (change)="onFileSelected($event)"
                accept=".pdf,.png,.jpg,.jpeg"
                class="hidden"
                #fileInput
              />

              <div
                class="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 transition hover:border-blue-300 hover:bg-blue-50/40"
              >
                <div
                  *ngIf="!soForm.clientPOAttachment"
                  class="flex flex-col items-center gap-2 py-3"
                >
                  <div
                    class="flex h-11 w-11 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm"
                  >
                    <i class="pi pi-cloud-upload text-xl"></i>
                  </div>
                  <p class="text-sm font-medium text-slate-700">
                    Upload client PO
                  </p>
                  <p class="text-xs text-slate-500">PDF, PNG or JPG</p>
                  <p-button
                    label="Choose File"
                    icon="pi pi-upload"
                    size="small"
                    severity="secondary"
                    [outlined]="true"
                    (onClick)="fileInput.click()"
                  ></p-button>
                </div>

                <div
                  *ngIf="soForm.clientPOAttachment"
                  class="flex items-center gap-3"
                >
                  <div
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600"
                  >
                    <i class="pi pi-file-pdf text-lg"></i>
                  </div>

                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-semibold text-slate-800">
                      {{ soForm.clientPOAttachment.name }}
                    </p>
                    <p class="text-xs text-slate-500">
                      {{
                        soForm.clientPOAttachment.size / 1024 | number: '1.0-0'
                      }}
                      KB
                    </p>
                  </div>

                  <button
                    type="button"
                    class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    (click)="
                      soForm.clientPOAttachment = null; fileInput.value = ''
                    "
                    aria-label="Remove attachment"
                  >
                    <i class="pi pi-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <ng-template #footer>
            <div
              class="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end"
            >
              <p-button
                label="Cancel"
                severity="secondary"
                [outlined]="true"
                (onClick)="SODialog = false"
              ></p-button>

              <p-button
                label="Convert to Sales Order"
                icon="pi pi-arrow-right"
                iconPos="right"
                severity="success"
                [disabled]="
                  !soForm.clientPONumber.trim() ||
                  !soForm.clientPOAttachment ||
                  !soForm.quotationData
                "
                (onClick)="submitConvertToSO()"
              ></p-button>
            </div>
          </ng-template>
        </p-dialog>
      </div>
    </div>
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

  quotationData = signal<QuotationDto | null>(null);

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
        Includes: `Client.BillingAddress,Client.DeliveryAddress,FromCompany.DeliveryAddress,FromCompany.BillingAddress,QuotationItems,TermsAndConditions`,
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

  updateActionMenus(status: string): void {
    const downloadAction = {
      label: 'Download PDF',
      value: 'Download',
      description: 'Download this quotation as a PDF',
      icon: 'pi-file-pdf',
      color: 'text-red-600',
    };

    switch (status) {
      case 'Draft':
        this.actionMenus = [
          {
            label: 'Approve Quotation',
            value: 'Approved',
            description: 'Approve this quotation',
            icon: 'pi-check-circle',
            color: 'text-emerald-600',
          },
          {
            label: 'Reject Quotation',
            value: 'Rejected',
            description: 'Reject this quotation',
            icon: 'pi-times-circle',
            color: 'text-red-600',
          },
          {
            label: 'Print Quotation',
            value: 'Print',
            description: 'Open a print-friendly quotation document',
            icon: 'pi-print',
            color: 'text-slate-600',
          },
          downloadAction,
        ];
        break;

      case 'Approved':
        this.actionMenus = [
          {
            label: 'Mark as Sent',
            value: 'Sent',
            description:
              'Confirm that the quotation has been sent to the client',
            icon: 'pi-send',
            color: 'text-blue-600',
          },
          downloadAction,
          {
            label: 'Reject Quotation',
            value: 'Rejected',
            description: 'Reject this quotation',
            icon: 'pi-times-circle',
            color: 'text-red-600',
          },
          {
            label: 'Print Quotation',
            value: 'Print',
            description: 'Open a print-friendly quotation document',
            icon: 'pi-print',
            color: 'text-slate-600',
          },
        ];
        break;

      case 'Sent':
        this.actionMenus = [
          {
            label: 'Mark as Accepted',
            value: 'Accepted',
            description: 'Confirm that the client has accepted this quotation',
            icon: 'pi-check-circle',
            color: 'text-emerald-600',
          },
          {
            label: 'Mark as Rejected',
            value: 'Rejected',
            description: 'Record that the client rejected this quotation',
            icon: 'pi-times-circle',
            color: 'text-red-600',
          },
          downloadAction,
          {
            label: 'Print Quotation',
            value: 'Print',
            description: 'Open a print-friendly quotation document',
            icon: 'pi-print',
            color: 'text-slate-600',
          },
        ];
        break;

      case 'Accepted':
        this.actionMenus = [
          {
            label: 'Convert to Sales Order',
            value: 'ConvertToSO',
            description: 'Create a Sales Order using the client PO',
            icon: 'pi-arrow-right-arrow-left',
            color: 'text-emerald-600',
          },
          {
            label: 'Start Job',
            value: 'WorkOrder',
            description: 'Create a new work order for this quotation',
            icon: 'pi-briefcase',
            color: 'text-blue-600',
          },
          downloadAction,
          {
            label: 'Print Quotation',
            value: 'Print',
            description: 'Open a print-friendly quotation document',
            icon: 'pi-print',
            color: 'text-slate-600',
          },
        ];
        break;

      case 'Rejected':
      case 'Expired':
        this.actionMenus = [
          downloadAction,
          {
            label: 'Print Quotation',
            value: 'Print',
            description: 'Open a print-friendly quotation document',
            icon: 'pi-print',
            color: 'text-slate-600',
          },
        ];
        break;

      default:
        this.actionMenus = [
          downloadAction,
          {
            label: 'Print Quotation',
            value: 'Print',
            description: 'Open a print-friendly quotation document',
            icon: 'pi-print',
            color: 'text-slate-600',
          },
        ];
        break;
    }

    this.selectedAction = null;

    this.cdr.markForCheck();
  }

  onActionChange(value: string | null): void {
    if (!value) return;

    switch (value) {
      case 'Print':
        this.printQuotation();
        break;
      case 'Download':
        this.downloadQuotation();
        break;

      case 'WorkOrder':
        this.startJob();
        break;

      case 'ConvertToSO':
        this.showSODialog();
        break;

      case 'Approved':
      case 'Rejected':
      case 'Sent':
      case 'Accepted':
        this.updateStatus(value);
        break;

      default:
        break;
    }
    setTimeout(() => {
      this.selectedAction = null;
      this.cdr.markForCheck();
    });
  }

  updateStatus(status: string) {
    if (!this.currentId) return;

    this.loadingService.start();

    this.quotationService
      .UpdateStatus(this.currentId, status)
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

  async printQuotation(): Promise<void> {
    const printWindow = window.open('', '_blank');

    if (!printWindow) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Popup Blocked',
        detail: 'Please allow popups to print the quotation.',
      });
      return;
    }

    try {
      const pdf = await this.generateQuotationPdf();

      if (!pdf) {
        printWindow.close();
        return;
      }

      pdf.autoPrint();

      const blobUrl = pdf.output('bloburl');

      printWindow.location.href = blobUrl.toString();
    } catch (error) {
      printWindow.close();

      console.error('Quotation PDF printing failed:', error);

      this.messageService.add({
        severity: 'error',
        summary: 'Print Failed',
        detail: 'Unable to print quotation PDF.',
      });
    }
  }

  sendQuotationEmail() {
    const email = this.quotationData()?.client?.email;

    if (!email) {
      console.warn('Client email not found');
      return;
    }
  }

  async generateQuotationPdf(): Promise<jsPDF | null> {
    const quotation = this.quotationData();

    if (!quotation) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Data',
        detail: 'Quotation information is not available.',
      });
      return null;
    }

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const margin = 15;
      const contentWidth = pageWidth - margin * 2;

      const primaryColor: [number, number, number] = [33, 72, 188];
      const darkColor: [number, number, number] = [30, 41, 59];
      const mutedColor: [number, number, number] = [100, 116, 139];
      const lightColor: [number, number, number] = [226, 232, 240];

      let y = 15;

      const company = quotation.fromCompany;
      const client = quotation.client;

      const formatDate = (date: any): string => {
        if (!date) return '-';

        const parsed = new Date(date);

        return isNaN(parsed.getTime())
          ? '-'
          : parsed.toLocaleDateString('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            });
      };

      const formatCurrency = (value: any): string =>
        Number(value || 0).toLocaleString('en-MY', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

      const addText = (
        text: string,
        x: number,
        yPosition: number,
        fontSize = 8,
        color: [number, number, number] = darkColor,
        bold = false,
      ): void => {
        pdf.setFont('helvetica', bold ? 'bold' : 'normal');
        pdf.setFontSize(fontSize);
        pdf.setTextColor(...color);
        pdf.text(text || '-', x, yPosition);
      };

      const getAddressLines = (address: any): string[] => {
        if (!address) return [];

        return [
          address.addressLine1,
          address.addressLine2,
          [address.postcode, address.city, address.state]
            .filter(Boolean)
            .join(' '),
        ].filter(Boolean);
      };

      const addSectionTitle = (title: string): void => {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(0, 0, 0);
        pdf.text(title.toUpperCase(), margin, y);

        y += 3;

        pdf.setDrawColor(...lightColor);
        pdf.setLineWidth(0.3);
        pdf.line(margin, y, pageWidth - margin, y);

        y += 6;
      };

      // =====================================================
      // 1. COMPANY HEADER WITH LOGO
      // =====================================================

      let logoData = await this.getLogoImage(company?.logoImage);

      if (logoData?.format === 'AVIF') {
        const pngData = await this.convertImageToPng(logoData.data);

        logoData = {
          data: pngData,
          format: 'PNG',
        };
      }

      const logoWidth = 30;
      const logoHeight = 25;
      const logoX = margin;
      const logoY = y;

      if (logoData) {
        try {
          pdf.addImage(
            logoData.data,
            logoData.format,
            logoX,
            logoY,
            logoWidth,
            logoHeight,
            undefined,
            'FAST',
          );
        } catch (error) {
          console.warn('Unable to add company logo:', error);
        }
      }
      const companyX = margin + 36;
      const companyWidth = pageWidth - companyX - margin;
      // Company name
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(0, 0, 0);

      const companyName = company?.name || 'Company Name';
      pdf.text(companyName, companyX, y + 4);

      // Registration details
      const registrationDetails = [
        company?.registrationNo
          ? `Registration No: ${company.registrationNo}`
          : '',
        company?.ssmRegNo || '',
        company?.tinNo ? `TIN: ${company.tinNo}` : '',
        company?.sstRegNo ? `SST: ${company.sstRegNo}` : '',
      ].filter(Boolean);

      const nameWidth = pdf.getTextWidth(companyName);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(0, 0, 0);

      const registrationText = registrationDetails.join(' | ');

      if (registrationText) {
        pdf.text(registrationText, companyX + nameWidth + 3, y + 4);
      }

      let companyY = y + 10;

      // Company address
      const companyAddress = getAddressLines(company?.billingAddress);

      companyAddress.forEach((line) => {
        const wrapped = pdf.splitTextToSize(line, companyWidth);

        pdf.text(wrapped, companyX, companyY);
        companyY += wrapped.length * 3.5 + 1.5;
      });

      // Contact details
      const companyContacts = [
        [
          company?.contactNo ? `Tel: ${company.contactNo}` : '',
          company?.faxNo ? `Fax: ${company.faxNo}` : '',
        ]
          .filter(Boolean)
          .join('     '),

        company?.websiteUrl || '',
      ].filter(Boolean);

      companyContacts.forEach((detail) => {
        const wrapped = pdf.splitTextToSize(detail, companyWidth);

        pdf.text(wrapped, companyX, companyY);
        companyY += wrapped.length * 3.5 + 1;
      });

      y = Math.max(y + logoHeight, companyY) + 5;
      // =====================================================
      // 2. QUOTATION TITLE AND REFERENCE
      // =====================================================

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(15);
      pdf.setTextColor(...darkColor);

      pdf.text('QUOTATION', pageWidth / 2, y, {
        align: 'center',
      });

      y += 5;

      // Header divider
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.3);
      pdf.line(margin, y, pageWidth - margin, y);

      // Ref No.
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(0, 0, 0);

      const refLabel = 'Ref No.:';
      pdf.text(refLabel, margin, y + 6);

      pdf.text(
        quotation.quotationNo || '-',
        margin + pdf.getTextWidth(refLabel + ' '),
        y + 6,
      );

      // Date
      const dateLabel = 'Date:';
      pdf.text(dateLabel, margin, y + 10);

      pdf.text(
        formatDate(quotation.quotationDate),
        margin + pdf.getTextWidth(dateLabel + ' '),
        y + 10,
      );

      y += 13;

      // =====================================================
      // 3. CLIENT DETAILS
      // =====================================================

      const leftColumn = margin;
      const halfWidth = contentWidth * 0.52;

      const clientName = client?.name || '-';

      addText(clientName, leftColumn, y + 5, 9, [0, 0, 0], true);

      // LEFT: Billing Address
      const billingAddress = client?.billingAddress;

      const billingLines = billingAddress
        ? [
            billingAddress.addressLine1,
            billingAddress.addressLine2,
            [billingAddress.postcode, billingAddress.city]
              .filter(Boolean)
              .join(' '),
            billingAddress.state,
          ].filter(Boolean)
        : [];

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(0, 0, 0);

      const billingText = pdf.splitTextToSize(
        billingLines.join('\n') || '-',
        halfWidth,
      );

      pdf.setLineHeightFactor(1.5);
      pdf.text(billingText, leftColumn, y + 10);
      pdf.setLineHeightFactor(1.15); // Reset to default
      // RIGHT: Contact Details
      const contactY = y + 10;
      const rightEdge = pageWidth - margin;

      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);

      // Telephone
      pdf.text(`Tel No: ${client?.contactNo || '-'}`, rightEdge, contactY, {
        align: 'right',
      });

      // Fax
      pdf.text(`Fax: ${client?.faxNo || '-'}`, rightEdge, contactY + 6, {
        align: 'right',
      });
      // Calculate section height
      const clientAddressHeight = billingText.length;

      y += Math.max(20, clientAddressHeight * 4 + 16);

      // Client contact information
      const attention = [
        client?.primaryContactPerson,
        client?.secondaryContactPerson,
      ]
        .filter(Boolean)
        .join(' / ');

      addText(`Attention: ${attention || '-'}`, margin, y, 9, darkColor, true);

      y += 7;

      // =====================================================
      // 4. SUBJECT
      // =====================================================

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(...darkColor);

      const subjectLines = pdf.splitTextToSize(
        `Re: Request for quotation - ${quotation.subject || '-'}`,
        contentWidth,
      );
      pdf.text(subjectLines, margin, y);

      y += subjectLines.length * 5 + 2;

      // =====================================================
      // 5. ORDER ITEMS
      // =====================================================

      const items = (quotation.quotationItems || [])
        .slice()
        .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0));

      const tableBody = items.map((item: any) => {
        if (item.rowType === 'CategoryHeader') {
          return [
            {
              content: item.description || '',
              colSpan: 7,
              styles: {
                fontStyle: 'bold' as const,
                fillColor: [255, 255, 255] as [number, number, number], // White background
                textColor: [0, 0, 0] as [number, number, number], // Black text
                halign: 'left' as const, // Align left
              },
            },
          ];
        }

        if (item.rowType === 'NoteRow') {
          return [
            item.item || '',
            {
              content: item.description || '',
              colSpan: 6,
              styles: {
                fontStyle: 'italic' as const,
                textColor: [100, 116, 139] as [number, number, number],
              },
            },
          ];
        }

        const description = String(item.description || '')
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<\/(p|div|li)>/gi, '\n')
          .replace(/<[^>]*>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .trim();

        return [
          item.item || '',
          description,
          item.unit || '',
          item.quantity ?? '',
          item.discount ?? 0,
          formatCurrency(item.unitPrice),
          formatCurrency(item.totalPrice),
        ];
      });

      autoTable(pdf, {
        startY: y,
        showHead: 'everyPage',
        pageBreak: 'auto',
        rowPageBreak: 'auto',
        head: [
          [
            'Item',
            'Description',
            'Unit',
            'Qty',
            'Disc (%)',
            'Unit Price (RM)',
            'Total (RM)',
          ],
        ],
        body: tableBody,
        foot: [
          [
            {
              content: 'Sub Total',
              colSpan: 6,
              styles: {
                halign: 'right',
                fontStyle: 'normal',
                textColor: [0, 0, 0],
                fillColor: [255, 255, 255],
              },
            },
            {
              content: `${formatCurrency(quotation.subTotal)}`,
              styles: {
                halign: 'right',
                textColor: [0, 0, 0],
                fillColor: [255, 255, 255],
              },
            },
          ],
          [
            {
              content: 'Discount',
              colSpan: 6,
              styles: {
                halign: 'right',
                fontStyle: 'normal',
                textColor: [0, 0, 0],
                fillColor: [255, 255, 255],
              },
            },
            {
              content: `${formatCurrency(quotation.discount)}`,
              styles: {
                halign: 'right',
                textColor: [0, 0, 0],
                fillColor: [255, 255, 255],
              },
            },
          ],
          [
            {
              content: 'Total Amount',
              colSpan: 6,
              styles: {
                halign: 'right',
                fontStyle: 'bold',
                textColor: [0, 0, 0],
                fillColor: [255, 255, 255],
              },
            },
            {
              content: `${formatCurrency(quotation.totalAmount)}`,
              styles: {
                halign: 'right',
                fontStyle: 'bold',
                textColor: [0, 0, 0],
                fillColor: [255, 255, 255],
              },
            },
          ],
        ],
        footStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontSize: 8,
          cellPadding: 2.5,
        },
        theme: 'grid',
        margin: {
          left: margin,
          right: margin,
          bottom: 22,
        },
        styles: {
          font: 'helvetica',
          fontSize: 8,
          cellPadding: 2.5,
          textColor: darkColor,
          lineColor: lightColor,
          lineWidth: 0.15,
          overflow: 'linebreak',
          valign: 'middle',
        },
        headStyles: {
          fillColor: [255, 255, 255], // White background
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          halign: 'center',
        },
        columnStyles: {
          0: { cellWidth: 12, halign: 'center' },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 13, halign: 'center' },
          3: { cellWidth: 12, halign: 'center' },
          4: { cellWidth: 15, halign: 'center' },
          5: { cellWidth: 25, halign: 'right' },
          6: { cellWidth: 27, halign: 'right' },
        },
      });

      y = ((pdf as any).lastAutoTable?.finalY || y) + 8;

      y += 3;

      // =====================================================
      // 7. TERMS & CONDITIONS
      // =====================================================

      if (y > pageHeight - 55) {
        pdf.addPage();
        y = 20;
      }

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);

      const title = 'Terms & Conditions';

      pdf.text(title, margin, y);

      // Draw underline
      const titleWidth = pdf.getTextWidth(title);
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.3);
      pdf.line(margin, y + 1, margin + titleWidth, y + 1);

      y += 4;

      const terms = [
        ['Terms', `: ${quotation.paymentTerms}` || '-'],
        [
          'Validity',
          `: ${[quotation.validity, quotation.validityType].filter(Boolean).join(' ') || '-'} (with effect from the date of this quotation)`,
        ],
        ...(quotation.termsAndConditions || []).map((term: any) => [
          term?.title ? `${term.title}` : '',
          `: ${term?.description}` || '',
        ]),
      ];

      autoTable(pdf, {
        startY: y,
        body: terms,
        theme: 'plain',
        margin: {
          left: margin - 2,
          right: margin,
          bottom: 30,
        },
        styles: {
          font: 'helvetica',
          fontSize: 9,
          cellPadding: {
            top: 0.5,
            bottom: 0.5,
            left: 2,
            right: 2,
          },
          textColor: darkColor,
          overflow: 'linebreak',
        },
        columnStyles: {
          0: {
            cellWidth: 25, // Reduced from 42
            fontStyle: 'bold',
            textColor: [0, 0, 0],
          },
          1: {
            cellWidth: 'auto',
          },
        },
      });

      y = ((pdf as any).lastAutoTable?.finalY || y) + 12;

      // =====================================================
      // 8. SIGNATURE
      // =====================================================

      if (y > pageHeight - 55) {
        pdf.addPage();
        y = 20;
      }

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(...darkColor);

      pdf.text('Yours faithfully,', margin, y);

      y += 20;

      pdf.setDrawColor(...darkColor);
      pdf.line(margin, y, margin + 55, y);

      y += 5;

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text(
        quotation.createdBy?.fullName || 'Authorised Representative',
        margin,
        y,
      );

      y += 4;

      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);

      pdf.text(quotation.createdBy?.jobTitle || '-', margin, y);
      y += 4;
      pdf.text(quotation.createdBy?.email || '', margin, y);
      y += 20;

      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(9);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Your ELV Solution Provider', margin, y);

      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      return pdf;
    } catch (error) {
      console.error('Quotation PDF generation failed:', error);

      this.messageService.add({
        severity: 'error',
        summary: 'Download Failed',
        detail: 'Unable to generate quotation PDF.',
      });
      return null;
    }
  }

  async downloadQuotation(): Promise<void> {
    const pdf = await this.generateQuotationPdf();

    if (!pdf) return;

    const quotation = this.quotationData();

    const filename = `${quotation?.quotationNo || 'Quotation'}.pdf`.replace(
      /[\\/:*?"<>|]/g,
      '_',
    );

    pdf.save(filename);

    this.messageService.add({
      severity: 'success',
      summary: 'PDF Generated',
      detail: `${filename} downloaded successfully.`,
    });
  }

  private async getLogoImage(imageSource?: string): Promise<{
    data: string;
    format: 'PNG' | 'JPEG' | 'AVIF';
  } | null> {
    if (!imageSource) return null;

    try {
      let dataUrl = imageSource;

      // Handle raw Base64 strings.
      if (
        !imageSource.startsWith('data:') &&
        !imageSource.startsWith('http') &&
        !imageSource.startsWith('/')
      ) {
        dataUrl = `data:image/png;base64,${imageSource}`;
      } else if (!imageSource.startsWith('data:')) {
        const response = await fetch(imageSource);

        if (!response.ok) {
          throw new Error('Unable to load company logo.');
        }

        const blob = await response.blob();

        dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();

          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);

          reader.readAsDataURL(blob);
        });
      }

      const mimeType = dataUrl.substring(0, dataUrl.indexOf(';')).toLowerCase();

      let format: 'PNG' | 'JPEG' | 'AVIF' | null = null;

      if (mimeType === 'data:image/png') {
        format = 'PNG';
      } else if (
        mimeType === 'data:image/jpeg' ||
        mimeType === 'data:image/jpg'
      ) {
        format = 'JPEG';
      } else if (mimeType === 'data:image/avif') {
        format = 'AVIF';
      }

      if (!format) {
        console.warn('Unsupported company logo format:', mimeType);
        return null;
      }

      return { data: dataUrl, format };
    } catch (error) {
      console.error('Company logo loading failed:', error);
      return null;
    }
  }
  private async convertImageToPng(dataUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const image = new Image();

      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;

        const context = canvas.getContext('2d');

        if (!context) {
          reject(new Error('Unable to create canvas context'));
          return;
        }

        context.drawImage(image, 0, 0);

        resolve(canvas.toDataURL('image/png'));
      };

      image.onerror = () => reject(new Error('Unable to load company logo'));

      image.src = dataUrl;
    });
  }

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
