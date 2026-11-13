import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { Subject, takeUntil } from 'rxjs';
import { QuotationService } from '../../../../services/quotationService.service';
import {
  QuotationTemplateDto,
  QuotationTemplateItem,
  QuotationTemplateTerm,
} from '../../../../models/Quotation';
import { Router, RouterLink } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-quotation-template',
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    DecimalPipe,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TagModule,
    RouterLink,
    TooltipModule,
  ],
  template: `
    <div class="quotation-template-page p-6">
      <!-- PAGE HEADER -->
      <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-bold text-slate-800">Quotation Templates</h2>
          <p class="mt-1 text-slate-500">
            View and manage your saved quotation templates.
          </p>
        </div>

        <p-button
          label="Refresh"
          icon="pi pi-refresh"
          severity="secondary"
          [outlined]="true"
          [loading]="loading()"
          (onClick)="loadTemplates()"
        />
      </div>

      <!-- TEMPLATE LIST -->
      <div class="rounded-xl border border-slate-200 bg-white">
        <div
          class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4"
        >
          <div>
            <h3 class="text-lg font-semibold text-slate-800">
              Saved Templates
            </h3>
            <p class="mt-1 text-slate-500">
              Select a template to view its details.
            </p>
          </div>

          <div class="flex flex-wrap gap-3 items-center">
            <div class="relative w-full sm:w-102">
              <i
                class="pi pi-search absolute! left-3! top-1/2! -translate-y-1/2! text-slate-400"
              ></i>

              <input
                pInputText
                [ngModel]="searchText()"
                (ngModelChange)="searchText.set($event)"
                [ngModelOptions]="{ standalone: true }"
                placeholder="Search templates..."
                class="w-full pl-10!"
              />
            </div>
            <p-button
              [routerLink]="['/quotation-template/form']"
              label="Add New Template"
              icon="pi pi-plus"
              styleClass="bg-blue-700! border-none! hover:bg-blue-500!"
            />
          </div>
        </div>

        <p-table
          [value]="filteredTemplates()"
          [loading]="loading()"
          dataKey="id"
          [rowHover]="true"
          responsiveLayout="scroll"
          [tableStyle]="{ 'min-width': '700px' }"
          [paginator]="true"
          [rows]="10"
          [rowsPerPageOptions]="[10, 20, 50]"
          [showCurrentPageReport]="true"
          currentPageReportTemplate="Showing {first} to {last} of {totalRecords} templates"
          styleClass="p-datatable-sm"
        >
          <ng-template pTemplate="header">
            <tr>
              <th style="width: 60px">No.</th>
              <th>Template Name</th>
              <th>Description</th>
              <th>Created By</th>
              <th class="text-center!">Created At</th>
              <th class="text-center!" style="width: 130px">Actions</th>
            </tr>
          </ng-template>

          <ng-template pTemplate="body" let-template let-rowIndex="rowIndex">
            <tr>
              <td class="text-slate-500">
                {{ rowIndex + 1 }}
              </td>

              <td>
                <div class="font-semibold text-slate-800">
                  {{ template.name || '-' }}
                </div>
              </td>

              <td>
                <span class="text-sm text-slate-600">
                  {{ template.description || template.subject || '-' }}
                </span>
              </td>

              <td>
                <span class="text-sm text-slate-600">
                  {{ getCreatedBy(template) }}
                </span>
              </td>

              <td class="text-center!">
                <span class="text-sm text-slate-600">
                  {{
                    template.createdAt
                      ? (template.createdAt | date: 'dd/MM/yyyy')
                      : '-'
                  }}
                </span>
              </td>

              <td>
                <div class="flex items-center justify-center gap-2">
                  <!-- View -->
                  <p-button
                    icon="pi pi-eye"
                    severity="info"
                    [text]="true"
                    [rounded]="true"
                    pTooltip="View template"
                    (onClick)="ViewTemplate(template)"
                  />

                  <!-- Edit -->
                  <p-button
                    icon="pi pi-pencil"
                    severity="success"
                    [text]="true"
                    [rounded]="true"
                    pTooltip="Edit template"
                    (onClick)="EditTemplate(template)"
                  />

                  <!-- Delete -->
                  <p-button
                    icon="pi pi-trash"
                    severity="danger"
                    [text]="true"
                    [rounded]="true"
                    pTooltip="Delete template"
                    (onClick)="ConfirmDelete(template)"
                  />
                </div>
              </td>
            </tr>
          </ng-template>

          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="6">
                <div class="flex flex-col items-center justify-center py-12">
                  <i class="pi pi-file text-4xl! text-slate-300"></i>

                  <p class="mt-3 font-semibold text-slate-700">
                    No quotation templates found
                  </p>

                  <p class="mt-1 text-sm text-slate-500">
                    Create your first quotation template to reuse quotation
                    details.
                  </p>

                  <p-button
                    label="Create Template"
                    icon="pi pi-plus"
                    styleClass="mt-4 bg-blue-700! border-none!"
                    (onClick)="CreateTemplate()"
                  />
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>

    <!-- VIEW QUOTATION TEMPLATE DIALOG -->
    <p-dialog
      header="Quotation Template"
      [visible]="showDetailsDialog()"
      (visibleChange)="showDetailsDialog.set($event)"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '1000px', maxWidth: '96vw' }"
      [breakpoints]="{ '768px': '95vw' }"
      styleClass="quotation-template-document-dialog"
      (onHide)="CloseDetails()"
    >
      @if (selectedTemplate(); as template) {
        <div class="bg-white text-slate-800">
          <!-- DOCUMENT HEADER -->
          <div class="border-b-2 border-blue-800 pb-5">
            <div
              class="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"
            >
              <div>
                <p
                  class="text-xs font-bold uppercase tracking-[0.18em] text-blue-800"
                >
                  YL WORKS INTERNAL
                </p>

                <h2
                  class="mt-1 text-2xl font-bold tracking-tight text-slate-900"
                >
                  {{ template.name || 'Untitled Template' }}
                </h2>
              </div>

              <div class="sm:text-right">
                <p
                  class="text-xs font-semibold uppercase tracking-wider text-slate-400"
                >
                  Document Type
                </p>
                <p class="mt-1 text-sm font-bold text-slate-800">
                  QUOTATION TEMPLATE
                </p>
              </div>
            </div>
          </div>

          <!-- GENERAL INFORMATION -->
          <section class="border-b border-slate-200 py-6">
            <div class="mb-4">
              <h3 class="font-bold uppercase tracking-wider text-slate-800">
                01. General Information
              </h3>
              <p class="mt-1 text-sm text-slate-400">
                Basic information and quotation reference details
              </p>
            </div>

            <div class="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
              <div>
                <p class="text-sm font-medium text-slate-400">Template Name</p>
                <p class="mt-1 font-semibold text-slate-800">
                  {{ template.name || '-' }}
                </p>
              </div>

              <div class="sm:col-span-2">
                <p class="text-sm font-medium text-slate-400">Description</p>
                <p class="mt-1 whitespace-pre-line leading-6 text-slate-700">
                  {{ template.description || '-' }}
                </p>
              </div>

              <div class="sm:col-span-2">
                <p class="text-sm font-medium text-slate-400">Subject</p>
                <p class="mt-1 leading-6 text-slate-700">
                  {{ template.subject || '-' }}
                </p>
              </div>
            </div>
          </section>

          <!-- QUOTATION ITEMS -->
          <section class="border-b border-slate-200 py-6">
            <div class="mb-4 flex items-center justify-between">
              <div>
                <h3 class="font-bold uppercase tracking-wider text-slate-800">
                  02. Quotation Items
                </h3>
                <p class="mt-1 text-sm text-slate-400">
                  Products, services and item descriptions
                </p>
              </div>

              <p class="text-xs font-semibold text-slate-500">
                {{ getItems(template).length }} Items
              </p>
            </div>

            <div class="overflow-hidden">
              <p-table
                [value]="getItems(template)"
                dataKey="id"
                responsiveLayout="scroll"
                [tableStyle]="{ 'min-width': '680px' }"
                styleClass="p-datatable-sm"
                showGridlines
              >
                <ng-template pTemplate="header">
                  <tr class="bg-slate-100">
                    <th
                      class="text-xs font-bold uppercase tracking-wide"
                      style="width: 60px"
                    >
                      Item
                    </th>
                    <th class="text-xs font-bold uppercase tracking-wide">
                      Description
                    </th>
                    <th
                      class="text-center! text-xs font-bold uppercase tracking-wide"
                    >
                      Qty
                    </th>
                    <th
                      class="text-center! text-xs font-bold uppercase tracking-wide"
                    >
                      Unit
                    </th>
                    <th
                      class="text-right! text-xs font-bold uppercase tracking-wide"
                    >
                      Unit Price (RM)
                    </th>
                    <th
                      class="text-right! text-xs font-bold uppercase tracking-wide"
                    >
                      Discount (RM)
                    </th>
                    <th
                      class="text-right! text-xs font-bold uppercase tracking-wide"
                    >
                      Total (RM)
                    </th>
                  </tr>
                </ng-template>

                <ng-template pTemplate="body" let-item let-rowIndex="rowIndex">
                  @if (item.rowType === 'CategoryHeader') {
                    <tr class="bg-slate-50">
                      <td
                        colspan="6"
                        class="border-y border-slate-200 py-3 font-bold text-slate-800"
                      >
                        {{ item.description || 'Untitled Category' }}
                      </td>
                    </tr>
                  } @else if (item.rowType === 'NoteRow') {
                    <tr>
                      <td
                        colspan="6"
                        class="bg-slate-50/60 py-3 text-sm italic text-slate-600"
                      >
                        {{ item.description || '-' }}
                      </td>
                    </tr>
                  } @else {
                    <tr>
                      <td class="text-center! text-sm text-slate-500">
                        {{ item.item || rowIndex + 1 }}
                      </td>

                      <td>
                        <div
                          class="whitespace-pre-line text-sm leading-6 text-slate-700"
                          [innerHTML]="item.description || '-'"
                        ></div>
                      </td>

                      <td class="text-center! text-sm tabular-nums">
                        {{ item.quantity ?? '-' }}
                      </td>

                      <td class="text-sm text-center!">
                        {{ item.unit || '-' }}
                      </td>

                      <td class="text-right! text-sm tabular-nums">
                        {{
                          item.unitPrice != null
                            ? (item.unitPrice | number: '1.2-2')
                            : '-'
                        }}
                      </td>

                      <td class="text-right! text-sm tabular-nums">
                        {{
                          item.discount != null
                            ? (item.discount | number: '1.2-2')
                            : '-'
                        }}
                      </td>

                      <td
                        class="text-right! text-sm font-semibold tabular-nums"
                      >
                        {{
                          item.totalPrice != null
                            ? (item.totalPrice | number: '1.2-2')
                            : '-'
                        }}
                      </td>
                    </tr>
                  }
                </ng-template>

                <ng-template #footer>
                  <tr>
                    <td colspan="6" class="text-right! font-semibold!">
                      Subtotal
                    </td>
                    <td class="text-right! font-semibold!">
                      {{ templateTotal() | number: '1.2-2' }}
                    </td>
                  </tr>

                  <tr>
                    <td colspan="6" class="text-right! font-semibold!">
                      Discount
                    </td>
                    <td class="text-right! font-semibold!">
                      {{ template.discount ?? 0 | number: '1.2-2' }}
                    </td>
                  </tr>

                  <tr>
                    <td colspan="6" class="text-right! font-bold!">
                      Total Amount
                    </td>
                    <td class="text-right! font-bold!">
                      {{
                        templateTotal() - (template.discount ?? 0)
                          | number: '1.2-2'
                      }}
                    </td>
                  </tr>
                </ng-template>

                <ng-template pTemplate="emptymessage">
                  <tr>
                    <td
                      colspan="100%"
                      class="py-8 text-center text-sm text-slate-400"
                    >
                      No quotation items available.
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            </div>
          </section>

          <!-- TERMS AND CONDITIONS -->
          <section class="py-6">
            <div class="mb-4">
              <h3 class="font-bold uppercase tracking-wider text-slate-800">
                03. Terms & Conditions
              </h3>
              <p class="mt-1 text-sm text-slate-400">
                Applicable terms and conditions for this quotation template
              </p>
            </div>

            <div
              class="text-sm mt-4 grid grid-cols-12 items-center font-medium"
            >
              <div class="col-span-1">Terms</div>
              <div class="col-span-11">: {{ template.paymentTerms }}</div>
              @if (template.validity) {
                <div class="col-span-1">Validity</div>
                <div class="col-span-11">
                  : {{ template.validity }} {{ template.validityType }} (with
                  effect from the date of this quotation)
                </div>
              }
              @if (getTerms(template).length) {
                @for (term of getTerms(template); track term.id || $index) {
                  <div class="col-span-1">{{ term.title }}</div>
                  <div class="col-span-11">: {{ term.description }}</div>
                }
              }
            </div>
          </section>
        </div>
      }
    </p-dialog>

    <!-- DELETE CONFIRMATION DIALOG -->
    <p-dialog
      header="Delete Template"
      [visible]="showDeleteDialog()"
      (visibleChange)="showDeleteDialog.set($event)"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '420px', maxWidth: '95vw' }"
    >
      <div class="flex items-start gap-3">
        <i class="pi pi-exclamation-triangle mt-1 text-2xl text-red-500"></i>

        <div>
          <p class="font-semibold text-slate-800">
            Are you sure you want to delete this template?
          </p>

          <p class="mt-2 text-sm text-slate-500">
            "{{ templateToDelete()?.name }}" will no longer be available for
            reuse.
          </p>
        </div>
      </div>

      <ng-template pTemplate="footer">
        <p-button
          label="Cancel"
          severity="secondary"
          [outlined]="true"
          (onClick)="showDeleteDialog.set(false)"
        />

        <p-button
          label="Delete"
          icon="pi pi-trash"
          severity="danger"
          [loading]="loading()"
          (onClick)="DeleteTemplate()"
        />
      </ng-template>
    </p-dialog>
  `,
  styleUrl: './quotation-template.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuotationTemplate implements OnInit, OnDestroy {
  private quotationService = inject(QuotationService);
  private messageService = inject(MessageService);
  private readonly router = inject(Router);
  private ngUnsubscribe = new Subject<void>();

  templates = signal<QuotationTemplateDto[]>([]);
  loading = signal(false);
  searchText = signal('');

  showDetailsDialog = signal(false);
  showDeleteDialog = signal(false);
  templateTotal = signal(0);

  selectedTemplate = signal<QuotationTemplateDto | null>(null);
  templateToDelete = signal<QuotationTemplateDto | null>(null);

  filteredTemplates = computed(() => {
    const search = this.searchText().trim().toLowerCase();

    if (!search) {
      return this.templates();
    }

    return this.templates().filter((template) =>
      [
        template.name,
        template.description,
        template.subject,
        template.createdByName,
        template.createdBy?.fullName,
        template.createdBy?.displayName,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search)),
    );
  });

  ngOnInit(): void {
    this.loadTemplates();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  // =========================================================
  // LOAD TEMPLATES
  // =========================================================

  loadTemplates(): void {
    this.loading.set(true);

    this.quotationService
      .GetTemplates()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res: any) => {
          const data = Array.isArray(res)
            ? res
            : (res?.data ?? res?.items ?? []);

          this.templates.set(data);

          this.loading.set(false);
        },
        error: (err) => {
          console.error('Load quotation templates error:', err);
          this.loading.set(false);

          this.messageService.add({
            severity: 'error',
            summary: 'Load Failed',
            detail: 'Unable to load quotation templates.',
          });
        },
      });
  }

  // =========================================================
  // VIEW TEMPLATE
  // =========================================================

  ViewTemplate(template: QuotationTemplateDto): void {
    if (!template.id) {
      return;
    }

    this.loading.set(true);

    this.quotationService
      .GetTemplate(template.id)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res: any) => {
          const data = res?.data ?? res;
          this.selectedTemplate.set(data);
          this.templateTotal.set(this.CalculateTemplateTotal(data));
          this.showDetailsDialog.set(true);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Get quotation template error:', err);
          this.loading.set(false);

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Unable to retrieve template details.',
          });
        },
      });
  }

  // =========================================================
  // DELETE TEMPLATE
  // =========================================================

  ConfirmDelete(template: QuotationTemplateDto): void {
    this.templateToDelete.set(template);
    this.showDeleteDialog.set(true);
  }

  DeleteTemplate(): void {
    const template = this.templateToDelete();

    if (!template?.id) {
      return;
    }

    this.loading.set(true);

    this.quotationService
      .DeleteTemplate(template.id)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res: any) => {
          this.loading.set(false);
          this.showDeleteDialog.set(false);
          this.templateToDelete.set(null);

          this.messageService.add({
            severity: 'success',
            summary: 'Deleted',
            detail: res?.message || 'Quotation template deleted successfully.',
          });

          this.loadTemplates();
        },
        error: (err) => {
          console.error('Delete quotation template error:', err);
          this.loading.set(false);

          this.messageService.add({
            severity: 'error',
            summary: 'Delete Failed',
            detail: err?.error?.Error || 'Unable to delete quotation template.',
          });
        },
      });
  }

  // =========================================================
  // HELPERS
  // =========================================================

  getCreatedBy(template: QuotationTemplateDto): string {
    return (
      template.createdBy?.fullName || template.createdBy?.displayName || '-'
    );
  }

  getItems(template: QuotationTemplateDto | null): QuotationTemplateItem[] {
    return [...(template?.items ?? [])].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
    );
  }

  getTerms(template: QuotationTemplateDto | null): QuotationTemplateTerm[] {
    return [...(template?.terms ?? [])].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
    );
  }

  CloseDetails(): void {
    this.showDetailsDialog.set(false);
    this.selectedTemplate.set(null);
  }

  // =========================================================
  // CREATE TEMPLATE
  // =========================================================

  CreateTemplate(): void {
    this.router.navigate(['/quotation-template/form']);
  }

  // =========================================================
  // EDIT TEMPLATE
  // =========================================================

  EditTemplate(template: QuotationTemplateDto): void {
    if (!template.id) {
      return;
    }

    this.router.navigate(['/quotation-template/form'], {
      queryParams: {
        id: template.id,
      },
    });
  }

  CalculateTemplateTotal(template: QuotationTemplateDto | null): number {
    if (!template) {
      return 0;
    }

    return (template.items ?? []).reduce((total, item) => {
      const rowType = (item as any).rowType ?? 'LineItem';

      if (rowType !== 'LineItem') {
        return total;
      }

      const quantity = Number(item.quantity ?? 0);
      const unitPrice = Number(item.unitPrice ?? 0);
      const discount = Number(item.discount ?? 0);

      const itemTotal = quantity * unitPrice;
      const discountedTotal = itemTotal - discount;

      return total + Math.max(0, discountedTotal);
    }, 0);
  }
}
