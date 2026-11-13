import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, of, switchMap } from 'rxjs';

import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { QuotationService } from '../../../../services/quotationService.service';
import { ProjectDto } from '../../../../models/Project';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { OverlayModule } from '@angular/cdk/overlay';
import { LoadingService } from '../../../../services/loading.service';

interface CompanyOption {
  id: string;
  name: string;
}

interface ProductServiceOption {
  id: string;
  itemCode: string;
  description?: string;
  type?: string;
}

interface TermOption {
  id: string;
  title: string;
  description?: string;
  sortOrder?: number;
}

@Component({
  selector: 'app-quotation-template-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    TextareaModule,
    CheckboxModule,
    CardModule,
    DividerModule,
    TagModule,
    TableModule,
    OverlayModule,
    FormsModule,
  ],

  template: `
    <div class="space-y-6 p-4 md:p-6">
      <!-- Header -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-xl font-semibold text-gray-800">
            {{
              isEdit ? 'Edit Quotation Template' : 'Create Quotation Template'
            }}
          </h2>
          <p class="mt-1 text-gray-500">
            {{
              isEdit
                ? 'Update your quotation template details.'
                : 'Create a reusable quotation template.'
            }}
          </p>
        </div>

        <!-- Actions -->
        <div class="flex flex-wrap justify-end gap-3">
          <button
            pButton
            type="button"
            label="Back"
            icon="pi pi-arrow-left"
            severity="secondary"
            [outlined]="true"
            (click)="Back()"
          ></button>

          <button
            pButton
            type="submit"
            class="bg-blue-700! border-none! hover:bg-blue-500!"
            [label]="isEdit ? 'Update Template' : 'Create Template'"
            icon="pi pi-save"
            [loading]="saving"
            [disabled]="saving || loading"
            (click)="SaveTemplate()"
          ></button>
        </div>
      </div>

      <form [formGroup]="form" class="flex flex-col gap-4">
        <!-- General Information -->
        <p-card>
          <ng-template pTemplate="title">
            <span class="text-base font-semibold">General Information</span>
          </ng-template>

          <div class="grid gap-4 grid-cols-12">
            <div class="col-span-12 flex flex-col">
              <label class="mb-2 block text-sm font-medium">
                Template Name <span class="text-red-500">*</span>
              </label>
              <input
                pInputText
                formControlName="name"
                class="w-full"
                placeholder="Enter template name"
              />
              <small
                class="text-red-500"
                *ngIf="form.get('name')?.touched && form.get('name')?.invalid"
              >
                Template name is required.
              </small>
            </div>

            <div class="col-span-12 md:col-span-6 flex flex-col">
              <label class="mb-2 block text-sm font-medium">
                From Company <span class="text-red-500">*</span>
              </label>
              <p-select
                formControlName="fromCompanyId"
                [options]="companies"
                optionLabel="name"
                optionValue="id"
                placeholder="Select company"
                [filter]="true"
                filterBy="name"
                [showClear]="form.get('fromCompanyId')?.value"
                styleClass="w-full"
              ></p-select>
              <small
                class="text-red-500"
                *ngIf="
                  form.get('fromCompanyId')?.touched &&
                  form.get('fromCompanyId')?.invalid
                "
              >
                Please select a company.
              </small>
            </div>

            <div class="col-span-12 md:col-span-6 flex flex-col">
              <label class="mb-2 block text-sm font-medium">Description</label>
              <input
                pInputText
                formControlName="description"
                class="w-full"
                placeholder="Enter template description"
              />
            </div>

            <div class="col-span-12 flex flex-col">
              <label class="mb-2 block text-sm font-medium">Subject</label>
              <div class="flex flex-row items-center gap-2">
                <b>Re: Request for quotation - </b>
                <input
                  pInputText
                  formControlName="subject"
                  class="flex-1!"
                  placeholder="Enter quotation subject"
                />
              </div>
            </div>
          </div>
        </p-card>

        <!-- Quotation Items -->

        <p-card>
          <ng-template pTemplate="title">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="text-base font-semibold">Quotation Items</span>

              <div class="flex flex-wrap gap-2">
                <button
                  pButton
                  type="button"
                  label="Add Item"
                  icon="pi pi-plus"
                  size="small"
                  class="border-none! bg-blue-700! hover:bg-blue-500!"
                  (click)="AddItem('LineItem')"
                ></button>

                <button
                  pButton
                  type="button"
                  label="Add Header"
                  icon="pi pi-heading"
                  severity="secondary"
                  [outlined]="true"
                  size="small"
                  (click)="AddItem('CategoryHeader')"
                ></button>

                <button
                  pButton
                  type="button"
                  label="Add Note"
                  icon="pi pi-align-left"
                  severity="secondary"
                  [outlined]="true"
                  size="small"
                  (click)="AddItem('NoteRow')"
                ></button>
              </div>
            </div>
          </ng-template>

          <div class="mt-3">
            <div formArrayName="items">
              <p-table
                [value]="items.controls"
                [scrollable]="true"
                scrollDirection="horizontal"
                styleClass="p-datatable-sm"
                [tableStyle]="{ 'min-width': '1100px' }"
                showGridlines
              >
                <ng-template #header>
                  <tr>
                    <th style="width: 50px" class="bg-gray-100!">Item</th>
                    <th style="min-width: 160px" class="bg-gray-100!">
                      Description / Product
                    </th>
                    <th style="width: 100px" class="bg-gray-100! text-center!">
                      Unit
                    </th>
                    <th style="width: 110px" class="bg-gray-100! text-center!">
                      Quantity
                    </th>

                    <th style="width: 140px" class="bg-gray-100! text-right!">
                      Unit Price (RM)
                    </th>
                    <th style="width: 110px" class="bg-gray-100!">
                      Discount (%)
                    </th>
                    <th style="width: 140px" class="bg-gray-100! text-right!">
                      Total (RM)
                    </th>
                    <th style="width: 70px" class="bg-gray-100! text-center!">
                      Action
                    </th>
                  </tr>
                </ng-template>

                <!-- FormArray applies only to body rows -->
                <ng-template #body let-item let-i="rowIndex">
                  <tr [formGroup]="item">
                    <ng-container
                      *ngIf="
                        item.get('rowType')?.value === 'LineItem';
                        else specialRow
                      "
                    >
                      <td>
                        <input
                          pInputText
                          formControlName="item"
                          class="w-full"
                        />
                      </td>

                      <td>
                        <!-- Keep your existing product selection here -->
                        <p-select
                          formControlName="productServiceId"
                          [options]="productOptions"
                          optionLabel="label"
                          optionValue="value"
                          placeholder="Select product / service or other"
                          [filter]="true"
                          filterBy="label,description"
                          [showClear]="true"
                          appendTo="body"
                          styleClass="w-full"
                          (onChange)="OnProductSelect(i, $event.value)"
                        >
                          <ng-template pTemplate="item" let-option>
                            <div
                              class="text-gray-600"
                              *ngIf="option.description"
                              [innerHTML]="option.description"
                            ></div>
                          </ng-template>

                          <ng-template pTemplate="selectedItem" let-option>
                            <span
                              *ngIf="option"
                              [innerHTML]="option.description || option.label"
                            ></span>
                          </ng-template>
                        </p-select>

                        <input
                          *ngIf="!item.get('productServiceId')?.value"
                          pInputText
                          formControlName="item"
                          class="mt-2 w-full"
                          placeholder="Enter item code / name"
                        />
                      </td>

                      <td>
                        <input
                          pInputText
                          formControlName="unit"
                          class="w-full text-center!"
                          placeholder="Unit"
                        />
                      </td>
                      <td>
                        <p-inputNumber
                          formControlName="quantity"
                          [min]="0"
                          [minFractionDigits]="0"
                          [maxFractionDigits]="2"
                          styleClass="w-full"
                          inputStyleClass="w-full text-center!"
                          (onInput)="RecalculateItem(i)"
                        ></p-inputNumber>
                      </td>
                      <td>
                        <p-inputNumber
                          formControlName="unitPrice"
                          mode="decimal"
                          [min]="0"
                          [minFractionDigits]="2"
                          [maxFractionDigits]="2"
                          styleClass="w-full"
                          inputStyleClass="w-full text-right!"
                          (onInput)="RecalculateItem(i)"
                        ></p-inputNumber>
                      </td>

                      <td>
                        <p-inputNumber
                          formControlName="discount"
                          mode="decimal"
                          [min]="0"
                          [max]="100"
                          [minFractionDigits]="0"
                          [maxFractionDigits]="2"
                          styleClass="w-full"
                          inputStyleClass="w-full text-right!"
                          (onInput)="RecalculateItem(i)"
                        ></p-inputNumber>
                      </td>

                      <td class="text-right! font-semibold whitespace-nowrap">
                        {{ item.get('totalPrice')?.value | number: '1.2-2' }}
                      </td>
                    </ng-container>

                    <ng-template #specialRow>
                      <td colspan="7">
                        <div class="flex flex-col gap-2">
                          <input
                            *ngIf="
                              item.get('rowType')?.value === 'CategoryHeader'
                            "
                            pInputText
                            formControlName="description"
                            class="w-full"
                          />
                          <textarea
                            *ngIf="item.get('rowType')?.value === 'NoteRow'"
                            pTextarea
                            formControlName="description"
                            rows="2"
                            class="w-full"
                            placeholder="Enter description"
                          ></textarea>
                        </div>
                      </td>
                    </ng-template>

                    <td class="text-center!">
                      <button
                        pButton
                        type="button"
                        icon="pi pi-trash"
                        severity="danger"
                        [text]="true"
                        [rounded]="true"
                        (click)="RemoveItem(i)"
                      ></button>
                    </td>
                  </tr>
                </ng-template>

                <!-- Financial summary footer -->
                <ng-template #footer>
                  <tr>
                    <td colspan="6" class="text-right! font-medium">
                      Subtotal (RM)
                    </td>
                    <td class="text-right! font-semibold">
                      {{ subtotal | number: '1.2-2' }}
                    </td>
                    <td></td>
                  </tr>

                  <tr>
                    <td colspan="6" class="text-right! font-medium">
                      Discount (RM)
                    </td>
                    <td>
                      <p-inputNumber
                        [formControl]="discountControl"
                        mode="decimal"
                        [min]="0"
                        [minFractionDigits]="2"
                        [maxFractionDigits]="2"
                        styleClass="w-full"
                        inputStyleClass="w-full text-right!"
                        (onInput)="CalculateTotals()"
                      ></p-inputNumber>
                    </td>
                    <td></td>
                  </tr>

                  <tr>
                    <td colspan="6" class="text-right! font-bold text-base">
                      Total Amount (RM)
                    </td>
                    <td class="text-right! font-bold text-blue-700 text-lg">
                      {{ totalAmount | number: '1.2-2' }}
                    </td>
                    <td></td>
                  </tr>
                </ng-template>

                <ng-template #emptymessage>
                  <tr>
                    <td colspan="8" class="py-8 text-center text-gray-500">
                      No quotation items added yet.
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            </div>
          </div>
        </p-card>

        <!-- Terms and Condition -->
        <p-card>
          <ng-template pTemplate="title">
            <span class="text-base font-semibold"> Payment and Validity </span>
          </ng-template>

          <div class="grid grid-cols-12 gap-3 items-center">
            <!-- Payment Terms -->
            <label class="col-span-12 md:col-span-3 font-medium">
              Payment Terms
            </label>

            <div class="col-span-12 md:col-span-9">
              <input
                pInputText
                formControlName="paymentTerms"
                class="w-full"
                placeholder="e.g. Net 30 Days"
              />
            </div>

            <!-- Quotation Validity -->
            <label class="col-span-12 md:col-span-3 font-medium">
              Quotation Validity
            </label>

            <div
              class="col-span-12 md:col-span-9 flex flex-wrap items-center gap-3"
            >
              <p-checkbox
                formControlName="noValidity"
                [binary]="true"
                inputId="noValidity"
              ></p-checkbox>

              <label for="noValidity" class="text-sm font-medium">
                No expiry
              </label>

              <div class="text-gray-300">|</div>

              <p-inputNumber
                formControlName="validity"
                [min]="1"
                [useGrouping]="false"
                styleClass="w-20!"
              ></p-inputNumber>

              <p-select
                formControlName="validityType"
                [options]="validityTypes"
                optionLabel="label"
                optionValue="value"
                placeholder="Select period"
                styleClass="w-fit!"
              ></p-select>
            </div>

            <!-- Additional Terms -->
            <div class="col-span-12 border-t border-gray-200 mt-3 pt-4">
              <label class="mb-3 block font-bold">
                Additional Terms and Conditions
              </label>

              <!-- Add Term Inputs -->
              <div
                class="grid grid-cols-1 items-end gap-3 lg:grid-cols-[220px_1fr_auto]"
              >
                <!-- Term Title -->
                <div>
                  <input
                    pInputText
                    cdkOverlayOrigin
                    #titleOrigin="cdkOverlayOrigin"
                    [ngModel]="termTitle"
                    (ngModelChange)="
                      termTitle = $event;
                      selectedTermId = null;
                      activeTermField = 'title'
                    "
                    (focus)="activeTermField = 'title'"
                    [ngModelOptions]="{ standalone: true }"
                    class="w-full"
                    placeholder="Enter term title"
                  />

                  <!-- Title Suggestions -->
                  <ng-template
                    cdkConnectedOverlay
                    [cdkConnectedOverlayOrigin]="titleOrigin"
                    [cdkConnectedOverlayOpen]="
                      activeTermField === 'title' && filteredTerms().length > 0
                    "
                    [cdkConnectedOverlayWidth]="
                      titleOrigin.elementRef.nativeElement.offsetWidth
                    "
                    [cdkConnectedOverlayHasBackdrop]="false"
                    [cdkConnectedOverlayPush]="true"
                  >
                    <div
                      class="mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl"
                    >
                      <div
                        *ngFor="let term of filteredTerms()"
                        class="cursor-pointer p-3 text-sm hover:bg-blue-50"
                        (click)="SelectTerm(term)"
                      >
                        <div class="font-medium">
                          {{ term.title }}
                        </div>

                        <div class="mt-1 text-xs text-gray-500">
                          {{ term.description }}
                        </div>
                      </div>
                    </div>
                  </ng-template>
                </div>

                <!-- Term Description -->
                <div>
                  <input
                    pInputText
                    cdkOverlayOrigin
                    #descriptionOrigin="cdkOverlayOrigin"
                    [ngModel]="termDescription"
                    (ngModelChange)="
                      termDescription = $event;
                      selectedTermId = null;
                      activeTermField = 'description'
                    "
                    (focus)="activeTermField = 'description'"
                    [ngModelOptions]="{ standalone: true }"
                    class="w-full"
                    placeholder="Enter term description"
                  />

                  <!-- Description Suggestions -->
                  <ng-template
                    cdkConnectedOverlay
                    [cdkConnectedOverlayOrigin]="descriptionOrigin"
                    [cdkConnectedOverlayOpen]="
                      activeTermField === 'description' &&
                      filteredTerms().length > 0
                    "
                    [cdkConnectedOverlayWidth]="
                      descriptionOrigin.elementRef.nativeElement.offsetWidth
                    "
                    [cdkConnectedOverlayHasBackdrop]="false"
                    [cdkConnectedOverlayPush]="true"
                  >
                    <div
                      class="mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl"
                    >
                      <div
                        *ngFor="let term of filteredTerms()"
                        class="cursor-pointer p-3 text-sm hover:bg-blue-50"
                        (click)="SelectTerm(term)"
                      >
                        <div class="font-medium">
                          {{ term.description }}
                        </div>

                        <div class="mt-1 text-xs text-gray-500">
                          {{ term.title }}
                        </div>
                      </div>
                    </div>
                  </ng-template>
                </div>

                <!-- Add Term Button -->
                <div>
                  <p-button
                    label="Add Term"
                    icon="pi pi-plus"
                    severity="info"
                    (onClick)="AddTerm()"
                    styleClass="!bg-blue-700 !border-blue-700 hover:!bg-blue-500"
                  />
                </div>
              </div>
              <!-- Selected Terms List -->
              <div formArrayName="termsAndConditions" class="space-y-2 my-4">
                <div
                  *ngFor="let term of terms.controls; let i = index"
                  [formGroupName]="i"
                  class="flex items-start gap-3 rounded-lg border border-gray-300 bg-slate-50 p-3"
                >
                  <div class="min-w-0 flex-1">
                    <div class="font-medium">
                      {{ term.get('title')?.value }}
                    </div>

                    <div class="mt-1 text-sm text-gray-500">
                      {{ term.get('description')?.value || 'No description' }}
                    </div>
                  </div>

                  <button
                    pButton
                    type="button"
                    icon="pi pi-trash"
                    severity="danger"
                    [text]="true"
                    [rounded]="true"
                    (click)="RemoveTerm(i)"
                  ></button>
                </div>

                <div
                  *ngIf="terms.length === 0"
                  class="rounded-lg border border-dashed border-gray-400 p-5 text-center text-sm text-gray-500"
                >
                  No terms and conditions added yet.
                </div>
              </div>
            </div>
          </div>
        </p-card>
      </form>
    </div>
  `,
  styleUrl: './quotation-template-form.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuotationTemplateForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly quotationService = inject(QuotationService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly loadingService = inject(LoadingService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  isEdit: boolean = false;
  templateId: string | null = null;

  loading: boolean = false;
  saving: boolean = false;

  companies: CompanyOption[] = [];
  productServices: ProductServiceOption[] = [];
  availableTerms: TermOption[] = [];
  projects: ProjectDto[] = [];
  productOptions: any[] = [];

  selectedTermId: string | null = null;

  termTitle: string = '';
  termDescription: string = '';

  activeTermField: 'title' | 'description' | null = null;

  subtotal: number = 0;
  totalAmount: number = 0;

  validityTypes = [
    { label: 'Days', value: 'days' },
    { label: 'Months', value: 'months' },
    { label: 'Years', value: 'years' },
  ];

  form: FormGroup = this.fb.group({
    name: [null, Validators.required],
    description: [null],
    fromCompanyId: [null, Validators.required],
    subject: [null],
    projectCode: [null],
    discount: [0],
    taxAmount: [0],
    paymentTerms: [null],
    noValidity: [false],
    validity: [null],
    validityType: ['Days'],
    items: this.fb.array([]),
    termsAndConditions: this.fb.array([]),
  });

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  get terms(): FormArray {
    return this.form.get('termsAndConditions') as FormArray;
  }

  ngOnInit(): void {
    this.templateId = this.activatedRoute.snapshot.queryParams['id'];
    console.log(this.templateId);

    this.isEdit = !!this.templateId;

    this.LoadDropdowns();
  }

  // =========================================================
  // LOAD DROPDOWNS
  // =========================================================

  LoadDropdowns(): void {
    console.log(this.templateId);
    this.loadingService.start();

    this.quotationService
      .GetDropdown()
      .pipe(
        switchMap((res: any) => {
          this.companies = res?.companies ?? res?.Companies ?? [];

          this.productServices =
            res?.productAndServices ?? res?.ProductAndServices ?? [];

          this.availableTerms =
            res?.termsAndConditions ?? res?.TermsAndConditions ?? [];

          this.projects = res?.projects ?? res?.Projects ?? [];

          // Product / Service options + manual entry
          this.productOptions = [
            ...this.productServices.map((product: any) => ({
              label: product.itemCode,
              description: product.description,
              value: product.id,
            })),
            {
              label: 'Other (Manual Entry)',
              description: 'Enter your own item or service',
              value: null,
            },
          ];

          // Only load template after dropdowns are ready.
          if (this.templateId) {
            return this.quotationService.GetTemplate(this.templateId);
          }

          return of(null);
        }),
      )
      .subscribe({
        next: (template: any) => {
          if (template) {
            this.LoadTemplate(template);
          } else if (!this.templateId) {
            this.AddItem('LineItem');
          }

          this.loadingService.stop();
        },
        error: (err) => {
          console.error('Failed to load quotation data:', err);

          this.loadingService.stop();

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load quotation data.',
          });
        },
      });
  }

  // =========================================================
  // LOAD TEMPLATE FOR EDIT
  // =========================================================

  LoadTemplate(res: any): void {
    if (!res) {
      this.messageService.add({
        severity: 'error',
        summary: 'Not Found',
        detail: 'Quotation template could not be found.',
      });

      this.Back();
      return;
    }

    this.form.patchValue({
      name: res.name ?? res.Name ?? '',
      description: res.description ?? res.Description ?? '',
      fromCompanyId: res.fromCompanyId ?? res.FromCompanyId ?? '',
      subject: res.subject ?? res.Subject ?? '',
      projectCode: res.projectCode ?? res.ProjectCode ?? '',
      discount: res.discount ?? res.Discount ?? 0,
      taxAmount: res.taxAmount ?? res.TaxAmount ?? 0,
      paymentTerms: res.paymentTerms ?? res.PaymentTerms ?? '',
      noValidity: res.noValidity ?? res.NoValidity ?? false,
      validity: res.validity ?? res.Validity ?? null,
      validityType: res.validityType ?? res.ValidityType ?? null,
    });

    // Load items
    this.items.clear();

    const templateItems = res.items ?? res.Items ?? [];

    templateItems
      .sort(
        (a: any, b: any) =>
          (a.sortOrder ?? a.SortOrder ?? 0) - (b.sortOrder ?? b.SortOrder ?? 0),
      )
      .forEach((item: any) => {
        this.items.push(
          this.CreateItemGroup({
            productServiceId:
              item.productServiceId ?? item.ProductServiceId ?? null,
            rowType: item.rowType ?? item.RowType ?? 'LineItem',
            item: item.item ?? item.Item ?? '',
            description: item.description ?? item.Description ?? '',
            quantity: item.quantity ?? item.Quantity ?? null,
            unit: item.unit ?? item.Unit ?? '',
            unitPrice: item.unitPrice ?? item.UnitPrice ?? null,
            discount: item.discount ?? item.Discount ?? 0,
            totalPrice: item.totalPrice ?? item.TotalPrice ?? 0,
          }),
        );
      });

    // Load terms and conditions
    this.terms.clear();

    const templateTerms = res.terms ?? [];

    templateTerms
      .sort(
        (a: any, b: any) =>
          (a.sortOrder ?? a.SortOrder ?? 0) - (b.sortOrder ?? b.SortOrder ?? 0),
      )
      .forEach((term: any) => {
        this.terms.push(
          this.CreateTermGroup({
            id: term.id ?? term.Id ?? null,
            title: term.title ?? term.Title ?? '',
            description: term.description ?? term.Description ?? '',
          }),
        );
      });

    if (this.items.length === 0) {
      this.AddItem('LineItem');
    }

    this.CalculateTotals();
  }

  // =========================================================
  // ITEM MANAGEMENT
  // =========================================================

  CreateItemGroup(item?: any): FormGroup {
    return this.fb.group({
      productServiceId: [item?.productServiceId ?? null],
      rowType: [item?.rowType ?? 'LineItem'],
      item: [item?.item ?? ''],
      description: [item?.description ?? ''],
      quantity: [item?.quantity ?? 1],
      unit: [item?.unit ?? ''],
      unitPrice: [item?.unitPrice ?? 0],
      discount: [item?.discount ?? 0],
      totalPrice: [item?.totalPrice ?? 0],
    });
  }

  AddItem(rowType: string = 'LineItem'): void {
    this.items.push(
      this.CreateItemGroup({
        rowType,
        quantity: rowType === 'LineItem' ? 1 : null,
        unitPrice: rowType === 'LineItem' ? 0 : null,
        unit: null,
        discount: 0,
        totalPrice: 0,
      }),
    );
  }

  RemoveItem(index: number): void {
    this.items.removeAt(index);
    this.CalculateTotals();
  }

  OnProductSelect(index: number, productId: string | null): void {
    const group = this.items.at(index);

    if (!productId) {
      group.patchValue({
        productServiceId: null,
        item: '',
        description: '',
        unit: '',
        unitPrice: 0,
        quantity: 1,
        discount: 0,
      });

      return;
    }

    const product = this.productServices.find((x: any) => x.id === productId);

    if (!product) return;

    group.patchValue({
      productServiceId: product.id,
      item: product.itemCode,
      description: product.description,
    });
  }

  RecalculateItem(index: number): void {
    const group = this.items.at(index);
    const rowType = group.get('rowType')?.value;

    if (rowType !== 'LineItem') {
      group.patchValue({ totalPrice: 0 }, { emitEvent: false });
      this.CalculateTotals();
      return;
    }

    const quantity = Number(group.get('quantity')?.value) || 0;
    const unitPrice = Number(group.get('unitPrice')?.value) || 0;
    const discount = Number(group.get('discount')?.value) || 0;

    const total =
      quantity * unitPrice * (1 - Math.min(Math.max(discount, 0), 100) / 100);

    group.patchValue(
      { totalPrice: Number(total.toFixed(2)) },
      { emitEvent: false },
    );

    this.CalculateTotals();
  }

  // =========================================================
  // TOTAL CALCULATION
  // =========================================================

  CalculateTotals(): void {
    this.subtotal = this.items.controls.reduce((sum, control) => {
      if (control.get('rowType')?.value !== 'LineItem') {
        return sum;
      }

      return sum + (Number(control.get('totalPrice')?.value) || 0);
    }, 0);

    const discount = Number(this.form.get('discount')?.value) || 0;
    const taxAmount = Number(this.form.get('taxAmount')?.value) || 0;

    this.totalAmount = Math.max(0, this.subtotal - discount + taxAmount);
  }

  // =========================================================
  // TERMS AND CONDITIONS
  // =========================================================

  CreateTermGroup(term?: any): FormGroup {
    return this.fb.group({
      id: [term?.id ?? null],
      title: [term?.title ?? ''],
      description: [term?.description ?? ''],
    });
  }

  AddTerm(): void {
    const title = this.termTitle.trim();
    const description = this.termDescription.trim();

    if (!title || !description) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Required Fields',
        detail: 'Please enter both term title and description.',
      });
      return;
    }

    // Find matching existing term if user typed manually.
    const matchedTerm = this.availableTerms.find(
      (term: TermOption) =>
        term.title.trim().toLowerCase() === title.toLowerCase() &&
        (term.description ?? '').trim().toLowerCase() ===
          description.toLowerCase(),
    );

    const termId = this.selectedTermId ?? matchedTerm?.id ?? null;

    // Prevent duplicate terms.
    const alreadyAdded = this.terms.controls.some((control) => {
      const existingId = control.get('id')?.value;

      const existingTitle = String(control.get('title')?.value ?? '')
        .trim()
        .toLowerCase();

      const existingDescription = String(
        control.get('description')?.value ?? '',
      )
        .trim()
        .toLowerCase();

      return (
        (termId && existingId === termId) ||
        (existingTitle === title.toLowerCase() &&
          existingDescription === description.toLowerCase())
      );
    });

    if (alreadyAdded) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Already Added',
        detail: 'This term has already been added.',
      });
      return;
    }

    this.terms.push(
      this.CreateTermGroup({
        id: termId,
        title,
        description,
      }),
    );

    // Reset inputs.
    this.termTitle = '';
    this.termDescription = '';
    this.selectedTermId = null;
    this.activeTermField = null;
  }

  RemoveTerm(index: number): void {
    this.terms.removeAt(index);
  }

  // =========================================================
  // TERM SUGGESTIONS
  // =========================================================

  filteredTerms(): TermOption[] {
    const search =
      this.activeTermField === 'title'
        ? this.termTitle.trim().toLowerCase()
        : this.termDescription.trim().toLowerCase();

    if (!search) return [];

    return this.availableTerms.filter((term: TermOption) => {
      const value =
        this.activeTermField === 'title' ? term.title : term.description;

      return value?.toLowerCase().includes(search);
    });
  }

  SelectTerm(term: TermOption): void {
    if (!term) return;

    this.selectedTermId = term.id;
    this.termTitle = term.title ?? '';
    this.termDescription = term.description ?? '';

    this.activeTermField = null;
  }

  // =========================================================
  // SAVE TEMPLATE
  // =========================================================

  SaveTemplate(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      this.messageService.add({
        severity: 'warn',
        summary: 'Required Fields',
        detail: 'Please complete the required fields.',
      });
      return;
    }

    this.CalculateTotals();

    const values = this.form.getRawValue();

    const request: any = {
      name: values.name?.trim(),
      description: values.description?.trim() || null,
      fromCompanyId: values.fromCompanyId,
      subject: values.subject || null,
      projectCode: values.projectCode || null,
      discount: Number(values.discount) || 0,
      taxAmount: Number(values.taxAmount) || 0,
      paymentTerms: values.paymentTerms || null,
      noValidity: !!values.noValidity,
      validity: values.noValidity ? null : values.validity,
      validityType: values.noValidity ? null : values.validityType,

      items: values.items.map((item: any, index: number) => ({
        productServiceId: item.productServiceId || null,
        rowType: item.rowType || 'LineItem',
        item: item.item || null,
        description: item.description || null,
        quantity:
          item.rowType === 'LineItem' ? Number(item.quantity) || 0 : null,
        unit: item.rowType === 'LineItem' ? item.unit || null : null,
        unitPrice:
          item.rowType === 'LineItem' ? Number(item.unitPrice) || 0 : null,
        discount:
          item.rowType === 'LineItem' ? Number(item.discount) || 0 : null,
        totalPrice:
          item.rowType === 'LineItem' ? Number(item.totalPrice) || 0 : 0,
        sortOrder: index + 1,
      })),

      termsAndConditions: values.termsAndConditions.map(
        (term: any, index: number) => ({
          id: term.id || null,
          title: term.title,
          description: term.description || null,
          sortOrder: index + 1,
        }),
      ),
    };

    this.saving = true;

    const request$ =
      this.isEdit && this.templateId
        ? this.quotationService.UpdateTemplate({
            ...request,
            id: this.templateId,
          })
        : this.quotationService.CreateTemplate(request);

    request$.pipe(finalize(() => (this.saving = false))).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: this.isEdit
            ? 'Quotation template updated successfully.'
            : 'Quotation template created successfully.',
        });

        this.Back();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Save Failed',
          detail:
            error?.error?.Error ||
            error?.error?.error ||
            error?.error?.detail ||
            'Unable to save quotation template.',
        });
      },
    });
  }

  // =========================================================
  // NAVIGATION
  // =========================================================

  Back(): void {
    this.router.navigate(['/quotation-template']);
  }

  get discountControl(): FormControl {
    return this.form.get('discount') as FormControl;
  }

  get taxAmountControl(): FormControl {
    return this.form.get('taxAmount') as FormControl;
  }
}
