import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { LoadingService } from '../../../services/loading.service';
import { InventoryService } from '../../../services/InventoryService';
import { Subject, takeUntil } from 'rxjs';
import { ValidateAllFormFields } from '../../../shared/helpers/helpers';
import { LocationInventoryService } from '../../../services/LocationCategoryService';
import { DialogModule } from 'primeng/dialog';
import { CategoryInventoryService } from '../../../services/CategoryInventoryService';
import { SectionInventoryService } from '../../../services/SectionCategoryService';

@Component({
  selector: 'app-inventory-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    TextareaModule,
    InputNumberModule,
    SelectModule,
    ButtonModule,
    RouterLink,
    DialogModule,
    FormsModule,
  ],
  template: `<div class="flex flex-col">
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
              >{{ currentId ? 'Update' : 'Add' }} Inventory Item</b
            >
          </div>
        </div>
      </div>
    </div>
    <div class="flex flex-col gap-4 p-5" [formGroup]="FG">
      <div
        class="p-4 flex flex-col rounded-lg border border-gray-200 shadow-xs"
      >
        <div
          class="flex flex-row items-center gap-2 border-b border-gray-200 pb-3"
        >
          <i class="pi pi-file-o text-blue-900! text-lg!"></i>
          <div class="font-bold text-gray-700">Basic Information</div>
        </div>
        <div class="flex flex-col gap-1 mt-5">
          <div class="font-semibold text-gray-700">
            Item Name / Description <span class="text-red-500">*</span>
          </div>
          <input
            formControlName="itemName"
            pInputText
            class="w-full bg-gray-100! p-3! border-gray-200!"
            placeholder="Item 1"
          />
        </div>
        <div class="flex flex-col gap-1 mt-5">
          <div class="flex flex-row items-center justify-between">
            <div class="font-semibold text-gray-700">
              Category <span class="text-red-500">*</span>
            </div>
            <div
              (click)="OpenCategoryDialog()"
              class="flex flex-row items-center gap-1 text-sm text-blue-800 font-semibold"
            >
              <i class="pi pi-plus-circle text-xs!"></i>
              <div>New Category</div>
            </div>
          </div>
          <p-select
            [options]="categorySelection || []"
            formControlName="categoryId"
            styleClass="w-full! bg-gray-100!"
            appendTo="body"
            [filter]="true"
          ></p-select>
        </div>
        <div class="flex flex-col gap-1 mt-5">
          <div class="font-semibold text-gray-700">Brand</div>
          <input
            formControlName="brand"
            pInputText
            class="w-full bg-gray-100! p-3! border-gray-200!"
            placeholder="Huawei"
          />
        </div>
        <div class="flex flex-col gap-1 mt-5">
          <div class="font-semibold text-gray-700">Model</div>
          <input
            formControlName="model"
            pInputText
            class="w-full bg-gray-100! p-3! border-gray-200!"
            placeholder="Model 1"
          />
        </div>
        <div class="flex flex-col gap-1 mt-5">
          <div class="font-semibold text-gray-700">
            SKU / Item Code <span class="text-red-500">*</span>
          </div>
          <div class="grid grid-cols-12 gap-2">
            <input
              formControlName="itemCode"
              pInputText
              class="w-full bg-gray-100! p-3! border-gray-200! col-span-9!"
              placeholder="YL-MAT-4029"
            />
            <div
              class="bg-blue-100 rounded-lg flex flex-row items-center gap-2 p-3 col-span-3 border border-blue-200"
            >
              <i class="pi pi-qrcode text-blue-900!"></i>
              <span class="text-blue-900 font-semibold">Scan</span>
            </div>
          </div>
          <div
            class="text-xs flex flex-row items-center gap-1 mt-1 text-gray-500"
          >
            <i class="pi pi-info-circle text-xs!"></i>
            <div>Leave blank to auto-generate the item code.</div>
          </div>
        </div>
      </div>
      <div
        class="p-4 flex flex-col rounded-lg border border-gray-200 shadow-xs"
      >
        <div
          class="flex flex-row items-center gap-2 border-b border-gray-200 pb-3"
        >
          <i class="pi pi-warehouse text-blue-900! text-lg!"></i>
          <div class="font-bold text-gray-700">Storage & Site Location</div>
        </div>
        <div class="flex flex-col gap-1 mt-5">
          <div class="flex flex-row items-center justify-between">
            <div class="font-semibold text-gray-700">
              Location <span class="text-red-500">*</span>
            </div>
            <div
              (click)="OpenLocationDialog()"
              class="flex flex-row items-center gap-1 text-sm text-blue-800 font-semibold"
            >
              <i class="pi pi-plus-circle text-xs!"></i>
              <div>New Location</div>
            </div>
          </div>
          <p-select
            [options]="locationSelection || []"
            formControlName="locationId"
            styleClass="w-full! bg-gray-100!"
            appendTo="body"
            [filter]="true"
          ></p-select>
        </div>
        <div class="flex flex-col gap-1 mt-5">
          <div class="flex flex-row items-center justify-between">
            <div class="font-semibold text-gray-700">Storage Rack</div>
            <div
              (click)="OpenSectionDialog()"
              class="flex flex-row items-center gap-1 text-sm text-blue-800 font-semibold"
            >
              <i class="pi pi-plus-circle text-xs!"></i>
              <div>New Section</div>
            </div>
          </div>

          <p-select
            [options]="sectionSelection || []"
            formControlName="sectionId"
            styleClass="w-full! bg-gray-100!"
            appendTo="body"
            [filter]="true"
          ></p-select>
        </div>
      </div>
      <div
        class="p-4 flex flex-col rounded-lg border border-gray-200 shadow-xs"
      >
        <div
          class="flex flex-row items-center gap-2 border-b border-gray-200 pb-3"
        >
          <i class="pi pi-sliders-h text-blue-900! text-lg!"></i>
          <div class="font-bold text-gray-700">Stock Levels & Costing</div>
        </div>
        <div class="grid grid-cols-12 gap-3 mt-5">
          <div class="col-span-6 flex flex-col gap-1">
            <div>Current Quantity <span class="text-red-500">*</span></div>
            <p-inputnumber
              formControlName="quantity"
              inputStyleClass="w-full! bg-gray-100!"
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
            <div>UOM <span class="text-red-500">*</span></div>
            <p-select
              appendTo="body"
              formControlName="unit"
              styleClass="w-full! bg-gray-100!"
              [options]="[
                { label: 'Pcs', value: 'Pcs' },
                { label: 'Box', value: 'Box' },
                { label: 'Set', value: 'Set' },
                { label: 'Pair', value: 'Pair' },
                { label: 'Unit', value: 'Unit' },
              ]"
            ></p-select>
          </div>
          <div class="col-span-6 flex flex-col gap-1">
            <div>Min Quantity</div>
            <p-inputnumber
              formControlName="parLevel"
              inputStyleClass="w-full! bg-gray-100!"
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
            <div>Unit Cost (RM)</div>
            <p-inputnumber
              formControlName="costs"
              mode="decimal"
              inputStyleClass="w-full! bg-gray-100!"
              [minFractionDigits]="2"
            ></p-inputnumber>
          </div>
        </div>
      </div>
      <div
        class="p-4 flex flex-col rounded-lg border border-gray-200 shadow-xs"
      >
        <div
          class="flex flex-row items-center gap-2 border-b border-gray-200 pb-3"
        >
          <i class="pi pi-camera text-blue-900! text-lg!"></i>
          <div class="font-bold text-gray-700">Item Photo & Spec Sheet</div>
        </div>

        <div
          class="mt-5 w-full p-5 flex flex-col gap-1 items-center justify-center
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
            [title]="
              FG.get('attachment')?.value?.name || existingAttachment || ''
            "
          >
            {{
              FG.get('attachment')?.value?.name ||
                (existingAttachment
                  ? getAttachmentName(existingAttachment)
                  : 'Upload Item Photo or Spec Sheet')
            }}
          </div>

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
      <div
        class="p-4 flex flex-col rounded-lg border border-gray-200 shadow-xs"
      >
        <div
          class="flex flex-row items-center gap-2 border-b border-gray-200 pb-3"
        >
          <i class="pi pi-align-left text-blue-900! text-lg!"></i>
          <div class="font-bold text-gray-700">Handling & Batch Notes</div>
        </div>

        <div class="mt-5">
          <textarea
            pTextarea
            formControlName="description"
            class="bg-gray-100! w-full!"
            [rows]="3"
            [cols]="30"
            [autoResize]="true"
            styleClass="w-full!"
            placeholder="Add any handling, storage, or batch notes..."
          ></textarea>
        </div>
      </div>
      <div class="flex flex-row items-center gap-3">
        <p-button
          label="Cancel"
          severity="secondary"
          class="flex-1!"
          styleClass="py-3! w-full! border-gray-200!"
          [routerLink]="'/inventory'"
        ></p-button>
        <p-button
          [label]="currentId ? 'Save Changes' : 'Add to Inventory'"
          severity="info"
          icon="pi pi-check-circle"
          class="flex-1!"
          (onClick)="SaveInventory()"
          styleClass="py-3! w-full! border-none! bg-[#1E40AF]! text-white!"
        ></p-button>
      </div>
    </div>

    <p-dialog
      [(visible)]="locationVisible"
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
                class="pi pi-map-marker text-2xl! text-blue-800! font-semibold!"
              ></i>
            </div>
            <div class="flex flex-col">
              <b class="text-xl">Quick Add Location</b>
              <span class="text-sm text-gray-500">Add a new location</span>
            </div>
          </div>
          <div
            class="pi pi-times text-xl! text-gray-500!"
            (click)="locationVisible = false"
          ></div>
        </div>
        <div class="p-5 bg-white flex flex-col gap-3">
          <div class="flex flex-col gap-1">
            <div class="font-semibold">
              Location Name <span class="text-red-500">*</span>
            </div>
            <div class="relative w-full">
              <i
                class="pi pi-warehouse text-gray-600! text-lg! absolute! top-3! left-4!"
              ></i>
              <input
                [(ngModel)]="locationName"
                pInputText
                class="w-full! bg-gray-100! pl-12! p-3! border-gray-200!"
              />
            </div>
          </div>
          <div
            class="bg-gray-100 rounded-xl border border-gray-50 flex flex-row gap-3 p-4"
          >
            <i class="pi pi-info-circle text-blue-800! mt-1!"></i>
            <span class="text-sm text-gray-500"
              >Once added, this location will immediately appear in your
              location selection dropdown.</span
            >
          </div>
        </div>
        <div
          class="w-full p-5 bg-gray-100 border-t border-gray-300 rounded-b-xl flex flex-row items-center gap-2 justify-end"
        >
          <p-button
            label="Cancel"
            severity="secondary"
            styleClass="py-3! px-5! bg-gray-200!"
            (onClick)="locationVisible = false"
          ></p-button>
          <p-button
            [disabled]="!locationName"
            (onClick)="SaveLocation()"
            label="Save Location"
            severity="info"
            icon="pi pi-check-circle"
            styleClass="border-none! bg-blue-900! text-white! py-3! px-5!"
          ></p-button>
        </div>
      </ng-template>
    </p-dialog>

    <p-dialog
      [(visible)]="categoryVisible"
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
              <i class="pi pi-box text-2xl! text-blue-800! font-semibold!"></i>
            </div>
            <div class="flex flex-col">
              <b class="text-xl">Quick Add Category</b>
              <span class="text-sm text-gray-500">Add a new category</span>
            </div>
          </div>
          <div
            class="pi pi-times text-xl! text-gray-500!"
            (click)="categoryVisible = false"
          ></div>
        </div>
        <div class="p-5 bg-white flex flex-col gap-3">
          <div class="flex flex-col gap-1">
            <div class="font-semibold">
              Category Name <span class="text-red-500">*</span>
            </div>
            <div class="relative w-full">
              <i
                class="pi pi-warehouse text-gray-600! text-lg! absolute! top-3! left-4!"
              ></i>
              <input
                [(ngModel)]="categoryName"
                pInputText
                class="w-full! bg-gray-100! pl-12! p-3! border-gray-200!"
              />
            </div>
          </div>
          <div
            class="bg-gray-100 rounded-xl border border-gray-50 flex flex-row gap-3 p-4"
          >
            <i class="pi pi-info-circle text-blue-800! mt-1!"></i>
            <span class="text-sm text-gray-500"
              >Once added, this category will immediately appear in your
              category selection.</span
            >
          </div>
        </div>
        <div
          class="w-full p-5 bg-gray-100 border-t border-gray-300 rounded-b-xl flex flex-row items-center gap-2 justify-end"
        >
          <p-button
            label="Cancel"
            severity="secondary"
            styleClass="py-3! px-5! bg-gray-200!"
            (onClick)="categoryVisible = false"
          ></p-button>
          <p-button
            [disabled]="!categoryName"
            (onClick)="SaveCategory()"
            label="Save Category"
            severity="info"
            icon="pi pi-check-circle"
            styleClass="border-none! bg-blue-900! text-white! py-3! px-5!"
          ></p-button>
        </div>
      </ng-template>
    </p-dialog>

    <p-dialog
      [(visible)]="sectionVisible"
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
              <i class="pi pi-box text-2xl! text-blue-800! font-semibold!"></i>
            </div>
            <div class="flex flex-col">
              <b class="text-xl">Quick Add Section</b>
              <span class="text-sm text-gray-500">Add a new section</span>
            </div>
          </div>
          <div
            class="pi pi-times text-xl! text-gray-500!"
            (click)="sectionVisible = false"
          ></div>
        </div>
        <div class="p-5 bg-white flex flex-col gap-3">
          <div class="flex flex-col gap-1">
            <div class="font-semibold">
              Section Name <span class="text-red-500">*</span>
            </div>
            <div class="relative w-full">
              <i
                class="pi pi-warehouse text-gray-600! text-lg! absolute! top-3! left-4!"
              ></i>
              <input
                [(ngModel)]="sectionName"
                pInputText
                class="w-full! bg-gray-100! pl-12! p-3! border-gray-200!"
              />
            </div>
          </div>
          <div
            class="bg-gray-100 rounded-xl border border-gray-50 flex flex-row gap-3 p-4"
          >
            <i class="pi pi-info-circle text-blue-800! mt-1!"></i>
            <span class="text-sm text-gray-500"
              >Once added, this section will immediately appear in your section
              selection dropdown.</span
            >
          </div>
        </div>
        <div
          class="w-full p-5 bg-gray-100 border-t border-gray-300 rounded-b-xl flex flex-row items-center gap-2 justify-end"
        >
          <p-button
            label="Cancel"
            severity="secondary"
            styleClass="py-3! px-5! bg-gray-200!"
            (onClick)="sectionVisible = false"
          ></p-button>
          <p-button
            [disabled]="!sectionName"
            (onClick)="SaveSection()"
            label="Save Section"
            severity="info"
            icon="pi pi-check-circle"
            styleClass="border-none! bg-blue-900! text-white! py-3! px-5!"
          ></p-button>
        </div>
      </ng-template>
    </p-dialog>
  </div>`,
  styleUrl: './inventory-form.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryForm implements OnInit, OnDestroy {
  private readonly loadingService = inject(LoadingService);
  private readonly inventoryService = inject(InventoryService);
  private readonly locationInventoryService = inject(LocationInventoryService);
  private readonly categoryInventoryService = inject(CategoryInventoryService);
  private readonly sectionInventoryService = inject(SectionInventoryService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  FG!: FormGroup;
  currentId: string = '';
  locationName: string = '';
  categoryName: string = '';
  sectionName: string = '';

  existingAttachment: string | null = null;
  attachmentPreview: string | null = null;

  locationSelection: any;
  categorySelection: any;
  sectionSelection: any;

  locationVisible: boolean = false;
  sectionVisible: boolean = false;
  categoryVisible: boolean = false;

  constructor() {
    this.FG = new FormGroup({
      id: new FormControl<string | null>({ value: null, disabled: true }),
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
      referenceType: new FormControl<string | null>(null),
      referenceId: new FormControl<string | null>(null),
      locationId: new FormControl<string | null>(null),
      sectionId: new FormControl<string | null>(null),
      parLevel: new FormControl<string | null>(null),
      date: new FormControl<Date | null>(new Date()),
      status: new FormControl<string | null>(null),
      remarks: new FormControl<string | null>(null),
      costs: new FormControl<number | null>(null),
      attachment: new FormControl<File | null>(null),
    });
  }

  ngOnInit(): void {
    this.currentId = this.activatedRoute.snapshot.queryParams['id'];

    this.GetDropdown();

    if (this.currentId) {
      this.FG.get('id')?.enable();
      this.FG.get('id')?.patchValue(this.currentId);
      this.LoadForm();
    }
  }

  GetDropdown() {
    this.loadingService.start();
    this.inventoryService
      .GetDropdown()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();
          this.categorySelection = res.categories.map((x) => ({
            label: x.name,
            value: x.id,
          }));
          this.locationSelection = res.locations.map((x) => ({
            label: x.name,
            value: x.id,
          }));
          this.sectionSelection = res.sections.map((x) => ({
            label: x.name,
            value: x.id,
          }));
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loadingService.stop();
        },
      });
  }

  LoadForm() {
    this.loadingService.start();
    this.inventoryService
      .GetOne(this.currentId)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();
          if (res) {
            this.existingAttachment = res.attachment || null;

            this.FG.patchValue({
              ...res,
              attachment: null,
            });
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loadingService.stop();
        },
      });
  }

  SaveInventory(): void {
    ValidateAllFormFields(this.FG);

    if (this.FG.invalid) {
      return;
    }

    const formData = new FormData();
    const formValue = this.FG.getRawValue();

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
          value instanceof Date ? value.toISOString() : value.toString(),
        );
      }
    });

    this.loadingService.start();

    const $request = this.currentId
      ? this.inventoryService.Update(formData)
      : this.inventoryService.Create(formData);

    $request.pipe(takeUntil(this.ngUnsubscribe)).subscribe({
      next: (res) => {
        this.loadingService.stop();
        this.router.navigate(['/inventory']);
      },
      error: (err) => {
        this.loadingService.stop();
      },
    });
  }

  OpenLocationDialog() {
    this.locationVisible = true;
    this.locationName = '';
    this.cdr.detectChanges();
  }

  SaveLocation() {
    if (!this.locationName) return;

    this.loadingService.start();
    this.locationInventoryService
      .Create({ name: this.locationName })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();
          this.locationName = '';
          this.locationSelection = [
            ...(this.locationSelection || []),
            { label: res.name, value: res.id },
          ];
          this.locationVisible = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loadingService.stop();
        },
      });
  }

  OpenCategoryDialog() {
    this.categoryVisible = true;
    this.categoryName = '';
    this.cdr.detectChanges();
  }

  SaveCategory() {
    if (!this.categoryName) return;

    this.loadingService.start();
    this.categoryInventoryService
      .Create({ name: this.categoryName })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();
          this.categoryName = '';
          this.categorySelection = [
            ...(this.categorySelection || []),
            { label: res.name, value: res.id },
          ];
          this.categoryVisible = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loadingService.stop();
        },
      });
  }

  OpenSectionDialog() {
    this.sectionVisible = true;
    this.sectionName = '';
    this.cdr.detectChanges();
  }

  SaveSection() {
    if (!this.sectionName) return;

    this.loadingService.start();
    this.sectionInventoryService
      .Create({ name: this.sectionName })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();
          this.sectionName = '';
          this.sectionSelection = [
            ...(this.sectionSelection || []),
            { label: res.name, value: res.id },
          ];
          this.sectionVisible = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loadingService.stop();
        },
      });
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

    this.FG.get('attachment')?.patchValue(file);
    this.FG.get('attachment')?.markAsDirty();

    this.attachmentPreview = URL.createObjectURL(file);

    this.cdr.markForCheck();
  }

  getAttachmentName(path: string | null): string {
    if (!path) return '';
    return path.split('/').pop() || '';
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
