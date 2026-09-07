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
    <div class="w-full flex flex-col p-4 sm:p-5 gap-4 max-w-3xl mx-auto">
      <div class="flex flex-row items-center gap-1 text-gray-500 tracking-wide text-sm">
        <a class="cursor-pointer hover:text-gray-600" routerLink="/dashboard"
          >Dashboard</a
        >
        /
        <a
          class="cursor-pointer hover:text-gray-600"
          routerLink="/inventory/listing"
          >Inventory</a
        >
        /
        <span class="text-gray-700 font-semibold">Item</span>
      </div>

      @if (notFound) {
        <div
          class="border border-gray-200 rounded-md bg-white p-6 text-center text-gray-600"
        >
          Inventory item not found.
          <div class="mt-3">
            <a routerLink="/inventory/listing">
              <p-button label="Back to listing" severity="secondary"></p-button>
            </a>
          </div>
        </div>
      } @else if (item) {
        <div
          class="border border-gray-200 rounded-md bg-white p-4 sm:p-6 flex flex-col gap-5"
        >
          <div
            class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"
          >
            <div class="min-w-0">
              <h1 class="text-xl font-semibold text-gray-800 m-0 break-words">
                {{ item.itemName }}
              </h1>
              <p class="text-sm text-gray-500 m-0 mt-1">
                {{ item.itemCode || 'No item code' }}
                @if (item.status) {
                  · {{ item.status }}
                }
              </p>
            </div>
            <div class="flex flex-wrap gap-2 shrink-0">
              <p-button
                label="Print QR"
                icon="pi pi-qrcode"
                severity="secondary"
                [outlined]="true"
                (onClick)="qrVisible = true"
              ></p-button>
              <p-button
                *ngIf="rights().canUpdate"
                label="Save"
                icon="pi pi-save"
                severity="info"
                (onClick)="save()"
              ></p-button>
            </div>
          </div>

          @if (item.attachment) {
            <div class="flex justify-center sm:justify-start">
              <p-image
                [src]="item.attachment"
                [preview]="true"
                width="120"
                height="120"
              ></p-image>
            </div>
          }

          <form class="flex flex-col gap-6" [formGroup]="FG">
            <section class="flex flex-col gap-3">
              <h2
                class="text-xs font-bold uppercase tracking-wider text-gray-400 m-0"
              >
                Product
              </h2>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="flex flex-col gap-1.5">
                  <label class="text-sm font-semibold text-gray-700"
                    >Item Code</label
                  >
                  <input
                    pInputText
                    class="w-full"
                    formControlName="itemCode"
                  />
                </div>
                <div class="flex flex-col gap-1.5">
                  <label class="text-sm font-semibold text-gray-700"
                    >Brand</label
                  >
                  <input pInputText class="w-full" formControlName="brand" />
                </div>
                <div class="sm:col-span-2 flex flex-col gap-1.5">
                  <label class="text-sm font-semibold text-gray-700"
                    >Item Name *</label
                  >
                  <input
                    pInputText
                    class="w-full"
                    formControlName="itemName"
                  />
                </div>
                <div class="flex flex-col gap-1.5">
                  <label class="text-sm font-semibold text-gray-700"
                    >Model</label
                  >
                  <input pInputText class="w-full" formControlName="model" />
                </div>
                <div class="flex flex-col gap-1.5">
                  <label class="text-sm font-semibold text-gray-700"
                    >Category</label
                  >
                  <p-select
                    [options]="categorySelection"
                    formControlName="categoryId"
                    appendTo="body"
                    [filter]="true"
                    styleClass="w-full"
                    placeholder="Select Category"
                  ></p-select>
                </div>
              </div>
            </section>

            <section class="flex flex-col gap-3">
              <h2
                class="text-xs font-bold uppercase tracking-wider text-gray-400 m-0"
              >
                Stock
              </h2>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="flex flex-col gap-1.5">
                  <label class="text-sm font-semibold text-gray-700"
                    >Location</label
                  >
                  <p-select
                    [options]="locationSelection"
                    formControlName="locationId"
                    appendTo="body"
                    [filter]="true"
                    styleClass="w-full"
                    placeholder="Select Location"
                  ></p-select>
                </div>
                <div class="flex flex-col gap-1.5">
                  <label class="text-sm font-semibold text-gray-700"
                    >Section / Rack</label
                  >
                  <p-select
                    [options]="sectionSelection"
                    formControlName="sectionId"
                    appendTo="body"
                    [filter]="true"
                    styleClass="w-full"
                    placeholder="Select Section"
                  ></p-select>
                </div>
                <div class="flex flex-col gap-1.5">
                  <label class="text-sm font-semibold text-gray-700"
                    >Quantity *</label
                  >
                  <p-inputnumber
                    formControlName="quantity"
                    mode="decimal"
                    [minFractionDigits]="0"
                    [maxFractionDigits]="3"
                    styleClass="w-full"
                    inputStyleClass="w-full"
                  ></p-inputnumber>
                </div>
                <div class="flex flex-col gap-1.5">
                  <label class="text-sm font-semibold text-gray-700"
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
                <div class="flex flex-col gap-1.5">
                  <label class="text-sm font-semibold text-gray-700"
                    >Unit</label
                  >
                  <p-select
                    formControlName="unit"
                    appendTo="body"
                    styleClass="w-full"
                    [options]="unitOptions"
                  ></p-select>
                </div>
                <div class="flex flex-col gap-1.5">
                  <label class="text-sm font-semibold text-gray-700"
                    >Status</label
                  >
                  <p-select
                    formControlName="status"
                    appendTo="body"
                    styleClass="w-full"
                    [options]="statusOptions"
                  ></p-select>
                </div>
                <div class="sm:col-span-2 flex flex-col gap-1.5">
                  <label class="text-sm font-semibold text-gray-700"
                    >Remarks</label
                  >
                  <textarea
                    pTextarea
                    formControlName="remarks"
                    [rows]="3"
                    class="w-full"
                  ></textarea>
                </div>
              </div>
            </section>
          </form>

          @if (!canEdit) {
            <p class="text-sm text-amber-700 m-0">
              You can view this item but do not have permission to update it.
            </p>
          }
        </div>

        <div
          class="border border-gray-200 rounded-md bg-white p-4 sm:p-6 flex flex-col gap-4"
        >
          <div>
            <h2 class="text-base font-semibold text-gray-800 m-0">
              Activity history
            </h2>
            <p class="text-sm text-gray-500 m-0 mt-1">
              Latest 10 create/update events for this item
            </p>
          </div>

          @if (auditsLoading) {
            <div class="text-sm text-gray-500">Loading history…</div>
          } @else if (!audits.length) {
            <div class="text-sm text-gray-500">No history yet.</div>
          } @else {
            <ul class="m-0 p-0 list-none flex flex-col gap-3">
              @for (entry of audits; track entry.id) {
                <li class="border border-gray-100 rounded-md p-3 bg-gray-50/60">
                  <div
                    class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-sm"
                  >
                    <div class="font-semibold text-gray-800">
                      {{ entry.action }}
                      <span class="font-normal text-gray-500">
                        by {{ entry.userName || 'Unknown user' }}
                      </span>
                    </div>
                    <div class="text-xs text-gray-500">
                      {{ entry.createdAt | date: 'dd/MM/yyyy hh:mm:ss a' }}
                    </div>
                  </div>

                  @if (entry.changes.message) {
                    <p class="text-sm text-gray-600 m-0 mt-2 italic">
                      {{ entry.changes.message }}
                    </p>
                  } @else if (entry.changes.fields.length) {
                    <ul class="m-0 mt-2 pl-4 list-disc text-sm text-gray-700">
                      @for (f of entry.changes.fields; track f.field) {
                        <li>
                          <span class="font-medium">{{ f.field }}</span>:
                          {{ formatAuditValue(f.field, f.oldValue) }} →
                          {{ formatAuditValue(f.field, f.newValue) }}
                        </li>
                      }
                    </ul>
                  }
                </li>
              }
            </ul>
          }
        </div>
      }

      <app-inventory-qr-dialog
        [(visible)]="qrVisible"
        [itemId]="item?.id || null"
        [itemName]="item?.itemName || null"
        [itemCode]="item?.itemCode || null"
      ></app-inventory-qr-dialog>
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

    if (!this.FG.valid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation',
        detail: 'Item name, unit, and quantity are required.',
      });
      return;
    }

    this.loadingService.start();
    this.inventoryService
      .Update(this.FG.getRawValue())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();
          this.item = res;
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
