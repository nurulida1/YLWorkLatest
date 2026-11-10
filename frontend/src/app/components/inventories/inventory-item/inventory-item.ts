import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ImageModule } from 'primeng/image';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { Subject, takeUntil } from 'rxjs';
import { InventoryAuditDto, InventoryDto } from '../../../models/Inventory';
import { InventoryService } from '../../../services/InventoryService';
import { LoadingService } from '../../../services/loading.service';
import { PermissionContextService } from '../../../services/permission-context.service';
import { InventoryQrDialog } from '../shared/inventory-qr-dialog';

@Component({
  selector: 'app-inventory-item',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    SelectModule,
    ImageModule,
    InventoryQrDialog,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-slate-50">
      <div class="w-full mx-auto p-3 sm:p-5 flex flex-col gap-4">
        <!-- Breadcrumb -->
        <nav class="flex items-center gap-2 text-xs text-slate-500">
          <a routerLink="/dashboard" class="hover:text-blue-600">Dashboard</a>
          <i class="pi pi-angle-right text-[10px]"></i>
          <a routerLink="/inventory/listing" class="hover:text-blue-600"
            >Inventory</a
          >
          <i class="pi pi-angle-right text-[10px]"></i>
          <span class="font-medium text-slate-700">Item Details</span>
        </nav>

        @if (notFound) {
          <div
            class="rounded-xl border border-slate-200 bg-white p-8 text-center"
          >
            <i class="pi pi-box text-3xl text-slate-300"></i>
            <h2 class="mt-3 font-semibold text-slate-800">Item not found</h2>
            <p class="mt-1 text-sm text-slate-500">
              This inventory item is unavailable.
            </p>
            <a routerLink="/inventory/listing" class="inline-block mt-4">
              <p-button
                label="Back to inventory"
                icon="pi pi-arrow-left"
                severity="secondary"
              ></p-button>
            </a>
          </div>
        } @else if (item) {
          <!-- Header -->
          <div
            class="rounded-xl border border-slate-200 bg-white p-4 sm:px-5 sm:py-4"
          >
            <div
              class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div class="flex items-center gap-3 min-w-0">
                <div
                  class="h-11 w-11 shrink-0 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"
                >
                  <i class="pi pi-box text-xl"></i>
                </div>

                <div class="min-w-0">
                  <h1 class="text-lg font-bold text-slate-800 break-words">
                    {{ item.itemName }}
                  </h1>
                  <div
                    class="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-500"
                  >
                    <span>{{ item.itemCode || 'No item code' }}</span>
                    @if (item.brand) {
                      <span>· {{ item.brand }}</span>
                    }
                    @if (item.model) {
                      <span>· {{ item.model }}</span>
                    }
                    @if (item.status) {
                      <span
                        class="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600"
                      >
                        {{ item.status }}
                      </span>
                    }
                  </div>
                </div>
              </div>

              <div class="flex gap-2">
                <p-button
                  icon="pi pi-qrcode"
                  label="QR Code"
                  severity="secondary"
                  [outlined]="true"
                  size="small"
                  styleClass="flex-1 sm:flex-none"
                  (onClick)="qrVisible = true"
                ></p-button>

                @if (rights().canUpdate) {
                  <p-button
                    icon="pi pi-save"
                    label="Save"
                    severity="info"
                    size="small"
                    styleClass="flex-1 sm:flex-none"
                    (onClick)="save()"
                  ></p-button>
                }
              </div>
            </div>
          </div>

          <!-- Stock Summary -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div class="rounded-xl border border-slate-200 bg-white p-3">
              <p class="text-xs text-slate-500">Total Quantity</p>
              <p class="mt-1 text-xl font-bold text-slate-800 tabular-nums">
                {{ item.quantity }}
                <span class="text-xs font-normal text-slate-500">{{
                  item.unit
                }}</span>
              </p>
            </div>

            <div class="rounded-xl border border-slate-200 bg-white p-3">
              <p class="text-xs text-slate-500">Reserved</p>
              <p class="mt-1 text-xl font-bold text-amber-600 tabular-nums">
                {{ item.reservedQuantity }}
              </p>
            </div>

            <div class="rounded-xl border border-slate-200 bg-white p-3">
              <p class="text-xs text-slate-500">Available</p>
              <p class="mt-1 text-xl font-bold text-emerald-600 tabular-nums">
                {{ item.availableQuantity }}
              </p>
            </div>

            <div class="rounded-xl border border-slate-200 bg-white p-3">
              <p class="text-xs text-slate-500">Par Level</p>
              <p class="mt-1 text-xl font-bold text-slate-800 tabular-nums">
                {{ item.parLevel }}
              </p>
            </div>
          </div>

          <!-- Form -->
          <form [formGroup]="FG" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <!-- Product Details -->
            <section
              class="rounded-xl border border-slate-200 bg-white overflow-hidden"
            >
              <div
                class="flex items-center gap-2 border-b border-slate-100 px-4 py-3"
              >
                <i class="pi pi-tag text-blue-600"></i>
                <h2 class="text-sm font-semibold text-slate-800">
                  Product Details
                </h2>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
                <div class="flex flex-col gap-1">
                  <label class="text-xs font-medium text-slate-600"
                    >Item Code</label
                  >
                  <input
                    pInputText
                    formControlName="itemCode"
                    class="w-full"
                    placeholder="Item code"
                  />
                </div>

                <div class="flex flex-col gap-1">
                  <label class="text-xs font-medium text-slate-600"
                    >Brand</label
                  >
                  <input
                    pInputText
                    formControlName="brand"
                    class="w-full"
                    placeholder="Brand"
                  />
                </div>

                <div class="sm:col-span-2 flex flex-col gap-1">
                  <label class="text-xs font-medium text-slate-600">
                    Item Name <span class="text-red-500">*</span>
                  </label>
                  <input
                    pInputText
                    formControlName="itemName"
                    class="w-full"
                    placeholder="Item name"
                  />
                  @if (
                    FG.controls['itemName'].touched &&
                    FG.controls['itemName'].invalid
                  ) {
                    <small class="text-red-500">Item name is required.</small>
                  }
                </div>

                <div class="flex flex-col gap-1">
                  <label class="text-xs font-medium text-slate-600"
                    >Model</label
                  >
                  <input
                    pInputText
                    formControlName="model"
                    class="w-full"
                    placeholder="Model"
                  />
                </div>

                <div class="flex flex-col gap-1">
                  <label class="text-xs font-medium text-slate-600"
                    >Category</label
                  >
                  <p-select
                    [options]="categorySelection"
                    formControlName="categoryId"
                    appendTo="body"
                    [filter]="true"
                    styleClass="w-full"
                    placeholder="Select category"
                  ></p-select>
                </div>

                <div class="sm:col-span-2 flex flex-col gap-1">
                  <label class="text-xs font-medium text-slate-600"
                    >Description</label
                  >
                  <textarea
                    pTextarea
                    formControlName="description"
                    [rows]="2"
                    class="w-full"
                    placeholder="Product description"
                  ></textarea>
                </div>
              </div>
            </section>

            <!-- Inventory Details -->
            <section
              class="rounded-xl border border-slate-200 bg-white overflow-hidden"
            >
              <div
                class="flex items-center gap-2 border-b border-slate-100 px-4 py-3"
              >
                <i class="pi pi-warehouse text-emerald-600"></i>
                <h2 class="text-sm font-semibold text-slate-800">
                  Inventory Details
                </h2>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
                <div class="flex flex-col gap-1">
                  <label class="text-xs font-medium text-slate-600"
                    >Location</label
                  >
                  <p-select
                    [options]="locationSelection"
                    formControlName="locationId"
                    appendTo="body"
                    [filter]="true"
                    styleClass="w-full"
                    placeholder="Select location"
                  ></p-select>
                </div>

                <div class="flex flex-col gap-1">
                  <label class="text-xs font-medium text-slate-600"
                    >Section / Rack</label
                  >
                  <p-select
                    [options]="sectionSelection"
                    formControlName="sectionId"
                    appendTo="body"
                    [filter]="true"
                    styleClass="w-full"
                    placeholder="Select section"
                  ></p-select>
                </div>

                <div class="flex flex-col gap-1">
                  <label class="text-xs font-medium text-slate-600">
                    Quantity <span class="text-red-500">*</span>
                  </label>
                  <p-inputnumber
                    formControlName="quantity"
                    mode="decimal"
                    [minFractionDigits]="0"
                    [maxFractionDigits]="3"
                    styleClass="w-full"
                    inputStyleClass="w-full"
                  ></p-inputnumber>
                </div>

                <div class="flex flex-col gap-1">
                  <label class="text-xs font-medium text-slate-600"
                    >Par Level</label
                  >
                  <p-inputnumber
                    formControlName="parLevel"
                    mode="decimal"
                    [minFractionDigits]="0"
                    [maxFractionDigits]="4"
                    styleClass="w-full"
                    inputStyleClass="w-full"
                  ></p-inputnumber>
                </div>

                <div class="flex flex-col gap-1">
                  <label class="text-xs font-medium text-slate-600">Unit</label>
                  <p-select
                    formControlName="unit"
                    appendTo="body"
                    styleClass="w-full"
                    [options]="unitOptions"
                    placeholder="Select unit"
                  ></p-select>
                </div>

                <div class="flex flex-col gap-1">
                  <label class="text-xs font-medium text-slate-600"
                    >Status</label
                  >
                  <p-select
                    formControlName="status"
                    appendTo="body"
                    styleClass="w-full"
                    [options]="statusOptions"
                    placeholder="Select status"
                  ></p-select>
                </div>

                <div class="sm:col-span-2 flex flex-col gap-1">
                  <label class="text-xs font-medium text-slate-600"
                    >Serial Number</label
                  >
                  <input
                    pInputText
                    formControlName="serialNumber"
                    class="w-full"
                    placeholder="Serial number"
                  />
                </div>
              </div>
            </section>

            <!-- Additional Information -->
            <section
              class="lg:col-span-2 rounded-xl border border-slate-200 bg-white overflow-hidden"
            >
              <div
                class="flex items-center gap-2 border-b border-slate-100 px-4 py-3"
              >
                <i class="pi pi-info-circle text-violet-600"></i>
                <h2 class="text-sm font-semibold text-slate-800">
                  Additional Information
                </h2>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4">
                <div class="flex flex-col gap-1">
                  <label class="text-xs font-medium text-slate-600">Cost</label>
                  <p-inputnumber
                    formControlName="costs"
                    mode="currency"
                    currency="MYR"
                    locale="en-MY"
                    styleClass="w-full"
                    inputStyleClass="w-full"
                  ></p-inputnumber>
                </div>

                <div class="flex flex-col gap-1">
                  <label class="text-xs font-medium text-slate-600"
                    >Record Date</label
                  >
                  <div
                    class="flex min-h-11 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600"
                  >
                    {{
                      item.date
                        ? (item.date | date: 'dd/MM/yyyy')
                        : 'Not specified'
                    }}
                  </div>
                </div>

                <div class="flex flex-col gap-1 sm:col-span-1">
                  <label class="text-xs font-medium text-slate-600"
                    >Remarks</label
                  >
                  <textarea
                    pTextarea
                    formControlName="remarks"
                    [rows]="2"
                    class="w-full"
                    placeholder="Remarks"
                  ></textarea>
                </div>
              </div>
            </section>

            <!-- Attachment -->
            @if (item.attachment) {
              <section
                class="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-4"
              >
                <div class="flex items-center gap-2 mb-3">
                  <i class="pi pi-paperclip text-amber-600"></i>
                  <h2 class="text-sm font-semibold text-slate-800">
                    Attachment
                  </h2>
                </div>
                <p-image
                  [src]="item.attachment"
                  [preview]="true"
                  width="120"
                  height="120"
                  imageClass="rounded-lg border border-slate-200 object-cover"
                ></p-image>
              </section>
            }
          </form>

          @if (!canEdit) {
            <div
              class="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800"
            >
              <i class="pi pi-lock"></i>
              You have view-only access to this inventory item.
            </div>
          }

          <!-- Activity History -->
          <section
            class="rounded-xl border border-slate-200 bg-white overflow-hidden"
          >
            <div
              class="flex items-center justify-between border-b border-slate-100 px-4 py-3"
            >
              <div class="flex items-center gap-2">
                <i class="pi pi-history text-slate-500"></i>
                <h2 class="text-sm font-semibold text-slate-800">
                  Activity History
                </h2>
              </div>
              <span class="text-xs text-slate-500"
                >{{ audits.length }} records</span
              >
            </div>

            <div class="p-4">
              @if (auditsLoading) {
                <div class="py-5 text-center text-sm text-slate-500">
                  <i class="pi pi-spin pi-spinner mr-2"></i>Loading history...
                </div>
              } @else if (!audits.length) {
                <div class="py-5 text-center">
                  <i class="pi pi-history text-2xl text-slate-300"></i>
                  <p class="mt-2 text-sm text-slate-500">
                    No activity recorded yet.
                  </p>
                </div>
              } @else {
                <div class="flex flex-col divide-y divide-slate-100">
                  @for (entry of audits; track entry.id) {
                    <div class="flex gap-3 py-3 first:pt-0 last:pb-0">
                      <div
                        class="h-8 w-8 shrink-0 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"
                      >
                        <i class="pi pi-pencil text-xs"></i>
                      </div>

                      <div class="min-w-0 flex-1">
                        <div
                          class="flex flex-col sm:flex-row sm:justify-between gap-1"
                        >
                          <div>
                            <p class="text-sm font-semibold text-slate-800">
                              {{ entry.action }}
                            </p>
                            <p class="text-xs text-slate-500">
                              {{ entry.userName || 'Unknown user' }}
                            </p>
                          </div>
                          <span class="text-xs text-slate-400">
                            {{ entry.createdAt | date: 'dd/MM/yyyy, hh:mm a' }}
                          </span>
                        </div>

                        @if (entry.changes.message) {
                          <p class="mt-2 text-xs text-slate-600 italic">
                            {{ entry.changes.message }}
                          </p>
                        } @else if (entry.changes.fields.length) {
                          <div class="mt-2 flex flex-col gap-1.5">
                            @for (f of entry.changes.fields; track f.field) {
                              <div
                                class="flex flex-wrap items-center gap-2 text-xs"
                              >
                                <span class="font-medium text-slate-700"
                                  >{{ f.field }}:</span
                                >
                                <span class="text-slate-400 break-all">{{
                                  formatAuditValue(f.field, f.oldValue)
                                }}</span>
                                <i
                                  class="pi pi-arrow-right text-[10px] text-slate-400"
                                ></i>
                                <span
                                  class="font-medium text-emerald-700 break-all"
                                  >{{
                                    formatAuditValue(f.field, f.newValue)
                                  }}</span
                                >
                              </div>
                            }
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </section>
        }

        <!-- QR Dialog -->
        <app-inventory-qr-dialog
          [(visible)]="qrVisible"
          [itemId]="item?.id || null"
          [itemName]="item?.itemName || null"
          [itemCode]="item?.itemCode || null"
        ></app-inventory-qr-dialog>
      </div>
    </div>
  `,
})
export class InventoryItem implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly inventoryService = inject(InventoryService);
  private readonly loadingService = inject(LoadingService);
  private readonly messageService = inject(MessageService);
  private readonly permissionContext = inject(PermissionContextService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly rights = this.permissionContext.rights;
  private readonly destroy$ = new Subject<void>();

  item: InventoryDto | null = null;
  notFound = false;
  qrVisible = false;
  FG!: FormGroup;

  audits: InventoryAuditDto[] = [];
  auditsLoading = false;

  sectionSelection: { label: string; value: string }[] = [];
  categorySelection: { label: string; value: string }[] = [];
  locationSelection: { label: string; value: string }[] = [];

  unitOptions = [
    { label: 'Pcs', value: 'Pcs' },
    { label: 'Box', value: 'Box' },
    { label: 'Set', value: 'Set' },
    { label: 'Pair', value: 'Pair' },
    { label: 'Unit', value: 'Unit' },
  ];

  statusOptions = [
    { label: 'In Stock', value: 'In Stock' },
    { label: 'Low Stock', value: 'Low Stock' },
    { label: 'Restock', value: 'Restock' },
    { label: 'FOC', value: 'FOC' },
    { label: 'Faulty', value: 'Faulty' },
    { label: 'Under Repair', value: 'Under Repair' },
  ];

  get canEdit(): boolean {
    return !!this.rights().canUpdate;
  }

  ngOnInit(): void {
    this.initForm();
    this.getDropdown();

    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.loadItem(id);
      }
    });
  }

  initForm(): void {
    this.FG = new FormGroup({
      id: new FormControl<string | null>(null),
      itemCode: new FormControl<string | null>(null),
      itemName: new FormControl<string | null>(null, Validators.required),
      brand: new FormControl<string | null>(null),
      model: new FormControl<string | null>(null),
      categoryId: new FormControl<string | null>(null),
      description: new FormControl<string | null>(null),
      unit: new FormControl<string | null>(null, Validators.required),
      quantity: new FormControl<number | null>(null, Validators.required),
      reservedQuantity: new FormControl<number | null>(0),
      serialNumber: new FormControl<string | null>(null),
      locationId: new FormControl<string | null>(null),
      sectionId: new FormControl<string | null>(null),
      parLevel: new FormControl<number | null>(null),
      date: new FormControl<Date | null>(null),
      status: new FormControl<string | null>(null),
      remarks: new FormControl<string | null>(null),
      costs: new FormControl<number | null>(null),
      attachment: new FormControl<string | null>(null),
    });
  }

  getDropdown(): void {
    this.inventoryService
      .GetDropdown()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.sectionSelection = this.mapToDropdown(res.sections);
          this.categorySelection = this.mapToDropdown(res.categories);
          this.locationSelection = this.mapToDropdown(res.locations);
          this.cdr.markForCheck();
        },
      });
  }

  mapToDropdown(data: { id: string; name: string }[]) {
    return data.map((x) => ({ label: x.name, value: x.id }));
  }

  formatAuditValue(field: string, value: string | null | undefined): string {
    if (value == null || value === '') return '—';

    if (field === 'Date' || this.looksLikeIsoDate(value)) {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        const dd = String(parsed.getDate()).padStart(2, '0');
        const mm = String(parsed.getMonth() + 1).padStart(2, '0');
        const yyyy = parsed.getFullYear();
        let hours = parsed.getHours();
        const minutes = String(parsed.getMinutes()).padStart(2, '0');
        const seconds = String(parsed.getSeconds()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        if (hours === 0) hours = 12;
        const hh = String(hours).padStart(2, '0');
        return `${dd}/${mm}/${yyyy} ${hh}:${minutes}:${seconds} ${ampm}`;
      }
    }

    return value;
  }

  private looksLikeIsoDate(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}T/.test(value);
  }

  loadItem(id: string): void {
    this.loadingService.start();
    this.notFound = false;
    this.inventoryService
      .GetOne(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();
          if (!res) {
            this.notFound = true;
            this.item = null;
            this.audits = [];
          } else {
            this.item = res;
            this.FG.patchValue({
              ...res,
              date: res.date ? new Date(res.date) : null,
            });
            if (!this.canEdit) {
              this.FG.disable({ emitEvent: false });
            } else {
              this.FG.enable({ emitEvent: false });
            }
            this.loadAudits(id);
          }
          this.cdr.markForCheck();
        },
        error: () => {
          this.loadingService.stop();
          this.notFound = true;
          this.cdr.markForCheck();
        },
      });
  }

  loadAudits(inventoryId: string): void {
    this.auditsLoading = true;
    this.cdr.markForCheck();

    this.inventoryService
      .GetAudit(inventoryId, 10)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.audits = res || [];
          this.auditsLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.audits = [];
          this.auditsLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  save(): void {
    if (!this.canEdit) return;

    if (this.FG.invalid) {
      this.FG.markAllAsTouched();

      this.messageService.add({
        severity: 'error',
        summary: 'Validation',
        detail: 'Item name, unit, and quantity are required.',
      });

      return;
    }

    this.loadingService.start();

    // API expects [FromForm] multipart — plain JSON leaves Id unbound → 404 "Inventory not found".
    const formData = new FormData();
    const formValue = this.FG.getRawValue() as Record<string, unknown>;

    Object.keys(formValue).forEach((key) => {
      const value = formValue[key];

      if (key === 'attachment') {
        if (value instanceof File) {
          formData.append('attachment', value);
        }
        return;
      }

      if (value !== null && value !== undefined) {
        formData.append(
          key,
          value instanceof Date ? value.toISOString() : String(value),
        );
      }
    });

    this.inventoryService
      .Update(formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();
          this.item = res;

          this.FG.patchValue({
            ...res,
            date: res.date ? new Date(res.date) : null,
          });
          this.messageService.add({
            severity: 'success',
            summary: 'Saved',
            detail: `${res.itemName} updated successfully`,
          });
          if (res?.id) {
            this.loadAudits(res.id);
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loadingService.stop();
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail:
              err.error?.message ||
              err.error?.Error ||
              'Failed to update inventory item.',
          });
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.loadingService.stop();
  }
}
