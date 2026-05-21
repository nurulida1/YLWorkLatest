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
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { EditorModule } from 'primeng/editor';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { InvoiceService } from '../../../services/invoiceService.service';
import { LoadingService } from '../../../services/loading.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-invoice-form',
  imports: [
    CommonModule,
    RouterLink,
    InputTextModule,
    DatePickerModule,
    SelectModule,
    TableModule,
    FormsModule,
    InputNumberModule,
    ButtonModule,
    ReactiveFormsModule,
    DialogModule,
    EditorModule,
    TextareaModule,
  ],
  template: ` <div class="w-full p-5 flex flex-col">
    <div class="flex flex-row items-center gap-1 text-gray-500 tracking-wide">
      <div
        [routerLink]="'/dashboard'"
        class="cursor-pointer hover:text-gray-600"
      >
        Dashboard
      </div>
      /
      <div
        [routerLink]="'/invoices/sales'"
        class="cursor-pointer hover:text-gray-600"
      >
        Sales Invoice
      </div>
      /
      <div class="text-gray-700 font-semibold">
        {{ currentId ? FG.get('invoiceNo')?.value : 'New Sales Invoice' }}
      </div>
    </div>
    <div
      class="px-5 py-2 flex flex-row items-center justify-between border border-gray-200 bg-white mt-3"
    >
      <div class="flex flex-row items-center gap-2 font-semibold">
        <i class="pi pi-file"></i>
        <div>
          {{ currentId ? 'Update Sales Invoice' : 'Create Sales Invoice' }}
        </div>
      </div>
      <div class="flex flex-row items-center gap-2">
        <p-button
          label="Cancel"
          severity="secondary"
          [outlined]="true"
          styleClass="py-1.5! px-4!"
          [routerLink]="'/purchase-orders'"
        ></p-button>

        <p-button
          (onClick)="onSave()"
          [label]="currentId ? 'Save Changes' : 'Create'"
          severity="info"
          styleClass="py-1.5! px-4!"
        ></p-button>
      </div>
    </div>
  </div>`,
  styleUrl: './invoice-form.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoiceForm implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messageService = inject(MessageService);
  private readonly invoiceService = inject(InvoiceService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly loadingService = inject(LoadingService);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  FG!: FormGroup;

  currentId: string = '';

  companySelection: { label: string; value: string }[] = [];

  ngOnInit(): void {
    this.currentId = this.activatedRoute.snapshot.queryParams['id'];

    this.initForm();
    this.getDropdown();

    if (this.currentId) {
      this.LoadForm();
    }
  }

  initForm() {
    this.FG = new FormGroup({
      id: new FormControl<string | null>({ value: null, disabled: true }),
    });
  }

  getDropdown() {}

  LoadForm() {
    this.loadingService.start();
    this.invoiceService
      .GetOne({
        Page: 1,
        PageSize: 1,
        OrderBy: null,
        Includes: 'InvoiceItems',
        Filter: `Id=${this.currentId}`,
        Select: null,
      })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();
          this.FG.patchValue({ ...res });
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loadingService.stop();
        },
      });
  }

  get Items(): FormArray {
    return this.FG.get('invoiceItems') as FormArray;
  }

  createItem(data?: any): FormGroup {
    return this.fb.group({
      id: [data?.id ?? null],
    });
  }

  addItem(item?: any) {
    const newItemGroup = this.createItem(item);

    this.Items.push(newItemGroup);

    this.calculateTotals();
  }

  removeItem(index: number) {
    const current = this.Items.at(index);

    if (current.get('isGroup')?.value) {
      this.Items.removeAt(index);

      while (
        index < this.Items.length &&
        !this.Items.at(index).get('isGroup')?.value
      ) {
        this.Items.removeAt(index);
      }
    } else {
      this.Items.removeAt(index);
    }

    this.calculateTotals();
  }

  calculateTotals() {}

  onSave() {}

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
