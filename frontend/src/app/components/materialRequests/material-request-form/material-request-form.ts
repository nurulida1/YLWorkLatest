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
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { MaterialRequestService } from '../../../services/materialRequestService';
import { LoadingService } from '../../../services/loading.service';
import { Subject, takeUntil } from 'rxjs';
import { ValidateAllFormFields } from '../../../shared/helpers/helpers';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'app-material-request-form',
  imports: [
    CommonModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    ButtonModule,
    ReactiveFormsModule,
    DatePickerModule,
    SelectModule,
    TableModule,
    RouterLink,
  ],
  template: `<div class="flex flex-col min-h-screen w-full p-5 gap-5">
    <nav class="flex items-center gap-2 text-gray-500">
      <a routerLink="/dashboard" class="hover:text-blue-600 transition-colors"
        >Dashboard</a
      >
      <i class="pi pi-chevron-right"></i>
      <a
        routerLink="/material-requests"
        class="hover:text-blue-600 transition-colors"
        >Material Requests</a
      >
      <i class="pi pi-chevron-right"></i>
      <span class="text-gray-900 font-bold">New Material Request</span>
    </nav>

    <div class="border bg-white border-gray-200 rounded-md p-5 flex flex-col">
      <h2 class="text-lg font-semibold mb-5">
        {{ currentId ? 'Edit Material Request' : 'New Material Request' }}
      </h2>

      <form [formGroup]="materialForm">
        <div class="grid grid-cols-12 gap-4">
          <div class="col-span-12 lg:col-span-6">
            <label class="block font-medium mb-1">Request No</label>
            <input
              formControlName="requestNo"
              placeholder="Auto-generate if leave blanks"
              class="w-full border border-gray-300 rounded-md p-2"
              pInputText
            />
          </div>
          <div class="col-span-12 lg:col-span-6">
            <label class="block font-medium mb-1">Project</label>
            <p-select
              styleClass="w-full!"
              appendTo="body"
              formControlName="projectId"
              [options]="projectSelections"
              [filter]="true"
            ></p-select>
          </div>

          <div class="col-span-12 lg:col-span-6">
            <label class="block font-medium mb-1">Client</label>
            <p-select
              styleClass="w-full!"
              appendTo="body"
              formControlName="clientId"
              [options]="clientSelections"
              [filter]="true"
            ></p-select>
          </div>

          <div class="col-span-12 lg:col-span-6">
            <label class="block font-medium mb-1">Task</label>
            <p-select
              styleClass="w-full!"
              appendTo="body"
              formControlName="taskId"
              [options]="taskSelections"
              [filter]="true"
            ></p-select>
          </div>

          <div class="col-span-12 lg:col-span-6">
            <label class="block font-medium mb-1">Purchase Order</label>
            <p-select
              styleClass="w-full!"
              appendTo="body"
              formControlName="poId"
              [options]="poSelections"
              [filter]="true"
            ></p-select>
          </div>
          <div class="col-span-12 lg:col-span-6">
            <label class="block font-medium mb-1">Request Date</label>
            <p-datepicker
              showIcon="true"
              dateFormat="dd/mm/yy"
              appendTo="body"
              formControlName="requestDate"
              styleClass="w-full!"
              inputStyleClass="w-full! border border-gray-300 rounded-md p-2"
            />
          </div>
          <div class="col-span-12 lg:col-span-6">
            <label class="block font-medium mb-1">Requested By</label>
            <p-select
              styleClass="w-full!"
              appendTo="body"
              formControlName="requestedById"
              [options]="userSelections"
              [filter]="true"
            ></p-select>
          </div>
          <div class="col-span-12 lg:col-span-6">
            <label class="block font-medium mb-1">Purpose</label>
            <input
              formControlName="purpose"
              class="w-full border border-gray-300 rounded-md p-2"
              pInputText
            />
          </div>
          <div class="col-span-12">
            <label class="block font-medium mb-1"
              >Additional Notes or Special Intructions</label
            >
            <textarea
              formControlName="remarks"
              class="w-full border border-gray-300 rounded-md p-2"
              rows="4"
              pTextarea
              [autoResize]="true"
            ></textarea>
          </div>
        </div>
        <div class="border-b border-gray-200 mt-5"></div>
        <div class="mt-5">
          <h3 class="text-md font-semibold mb-3">Material Items</h3>
          <p-table
            [showGridlines]="true"
            formArrayName="materialItems"
            [value]="materialItems.controls"
            styleClass="p-datatable-sm custom-table"
            [tableStyle]="{ 'min-width': '70rem' }"
            [showGridlines]="true"
          >
            <ng-template #header>
              <tr>
                <th
                  class="!bg-gray-100 text-center! text-gray-500 font-semibold w-96"
                >
                  Description
                </th>
                <th
                  class="!bg-gray-100 text-center! text-gray-500 font-semibold w-64"
                >
                  Brand
                </th>
                <th
                  class="!bg-gray-100 text-center! text-gray-500 font-semibold w-40"
                >
                  Unit
                </th>
                <th
                  class="!bg-gray-100 text-center! text-gray-500 font-semibold w-40"
                >
                  Quantity
                </th>
                <th
                  class="!bg-gray-100 text-center! text-gray-500 font-semibold w-64"
                >
                  Required Date
                </th>
                <th
                  class="!bg-gray-100 text-center! text-gray-500 font-semibold w-64"
                >
                  Supplier
                </th>
                <th
                  class="!bg-gray-100 text-center! text-gray-500 font-semibold w-24"
                >
                  Action
                </th>
              </tr>
            </ng-template>
            <ng-template #body let-item let-i="rowIndex">
              <tr [formGroupName]="i">
                <td class="border p-2">
                  <textarea
                    pTextarea
                    formControlName="description"
                    rows="2"
                    cols="30"
                    class="w-full border border-gray-300 rounded-md p-1"
                    [autoResize]="true"
                  ></textarea>
                </td>
                <td class="border p-2">
                  <input
                    type="text"
                    formControlName="brand"
                    pInputText
                    class="w-full! border border-gray-300 text-center! rounded-md p-1"
                  />
                </td>
                <td class="border p-2">
                  <input
                    type="text"
                    pInputText
                    formControlName="unit"
                    class="w-full! border border-gray-300 text-center! rounded-md p-1"
                  />
                </td>
                <td class="border p-2">
                  <p-inputnumber
                    formControlName="quantity"
                    inputStyleClass="text-center! w-full!"
                    [useGrouping]="false"
                  ></p-inputnumber>
                </td>
                <td class="border p-2">
                  <p-datepicker
                    showIcon="true"
                    formControlName="requiredDate"
                    styleClass="w-full"
                    dateFormat="dd/mm/yy"
                    appendTo="body"
                  ></p-datepicker>
                </td>
                <td class="border p-2">
                  <p-select
                    formControlName="supplierId"
                    styleClass="w-full!"
                    [options]="supplierSelections"
                    [filter]="true"
                    appendTo="body"
                  ></p-select>
                </td>
                <td>
                  <div class="flex items-center justify-center">
                    <p-button
                      *ngIf="i !== 0"
                      (onClick)="materialItems.removeAt(i)"
                      icon="pi pi-times-circle"
                      [text]="true"
                      severity="danger"
                    >
                    </p-button>
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
          <p-button
            (onClick)="addMaterialItem()"
            [text]="true"
            styleClass="mt-4! flex! items-center! gap-2!! font-semibold! text-blue-600! hover:text-blue-700!"
          >
            <i class="pi pi-plus-circle"></i> Add Line Item
          </p-button>
        </div>

        <div class="mt-5">
          <h3 class="text-md font-semibold mb-3">Attachments</h3>
          <input #file type="file" (change)="addAttachment($event)" hidden />
          <div
            class="mt-2 p-5 border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-2 cursor-pointer"
          >
            <div
              *ngIf="attachments.length === 0"
              (click)="file.click()"
              class="w-15 h-15 flex items-center justify-center border border-gray-200 bg-gray-100 rounded-full"
            >
              <div class="pi pi-cloud-upload text-gray-400 text-4xl!"></div>
            </div>
            <ul class="mt-2">
              <li
                *ngFor="let attachment of attachments.controls; let i = index"
                class="flex items-center gap-2"
              >
                <a
                  [href]="attachment.value"
                  target="_blank"
                  class="text-blue-600 hover:underline"
                >
                  {{ attachment.value | slice: 0 : 30 }}...
                </a>
                <button
                  type="button"
                  (click)="removeAttachment(i)"
                  class="text-red-600 hover:underline"
                >
                  Remove
                </button>
              </li>
            </ul>
            <div
              class="flex flex-row items-center gap-1 text-gray-500 cursor-pointer tracking-wide"
            >
              <b class="underline">Click to Upload</b
              ><span>or drag and drop</span>
            </div>
          </div>
        </div>

        <div class="mt-5 flex flex-row justify-end gap-3">
          <p-button
            [routerLink]="'/material-requests'"
            label="Cancel"
            severity="secondary"
            styleClass="border-gray-200! px-4! tracking-wide! hover:bg-gray-100!"
          >
          </p-button>
          <p-button
            (onClick)="onSave()"
            [label]="currentId ? 'Update' : 'Create'"
            styleClass="bg-blue-600! text-white! border-none! tracking-wide! px-4!"
          >
          </p-button>
        </div>
      </form>
    </div>
  </div>`,
  styleUrl: './material-request-form.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaterialRequestForm implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messageService = inject(MessageService);
  private readonly materialRequestService = inject(MaterialRequestService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly loadingService = inject(LoadingService);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  private destroy$ = new Subject<void>();

  materialForm!: FormGroup;
  currentId: string = '';

  projectSelections: any[] = [];
  taskSelections: any[] = [];
  poSelections: any[] = [];
  userSelections: any[] = [];
  supplierSelections: any[] = [];
  clientSelections: any[] = [];

  selectedClient: any = null;

  ngOnInit(): void {
    this.initForm();
    this.currentId = this.activatedRoute.snapshot.queryParams['id'] || null;

    this.getDropdown();

    if (this.currentId) {
      this.loadForm();
    }
  }

  getDropdown() {
    this.loadingService.start();
    this.materialRequestService
      .GetDropdown()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res: any) => {
          console.log(res);
          this.loadingService.stop();

          this.clientSelections = res.clients.map((c: any) => ({
            label: c.name,
            value: c.id,
          }));

          this.projectSelections = res.projects.map((p: any) => ({
            label: p.projectTitle,
            value: p.id,
            tasks: p.tasks,
            clientId: p.clientId,
          }));
          this.taskSelections = res.tasks.map((t: any) => ({
            label: t.name,
            value: t.id,
          }));
          this.poSelections = res.purchaseOrders.map((po: any) => ({
            label: po.poNo,
            value: po.id,
          }));
          this.userSelections = res.users.map((u: any) => ({
            label: u.name,
            value: u.id,
          }));
          this.supplierSelections = res.suppliers.map((s: any) => ({
            label: s.name,
            value: s.id,
          }));
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loadingService.stop();
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail:
              err.message || 'An error occurred while loading dropdown data',
          });
        },
      });

    this.materialForm
      .get('projectId')
      ?.valueChanges.pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((projectId) => {
        this.projectSelections.forEach((project: any) => {
          if (project.value === projectId) {
            this.taskSelections = project.tasks.map((t: any) => ({
              label: t.name,
              value: t.id,
            }));
          }
          this.materialForm.get('clientId')?.setValue(project.clientId);
          this.cdr.markForCheck();
        });
      });
  }

  private initForm() {
    this.materialForm = this.fb.group({
      requestNo: [null],
      projectId: ['', Validators.required],
      taskId: [null],
      poId: [null],
      clientId: [null],
      purpose: [null],
      requestDate: [new Date(), Validators.required],
      requestedById: ['', Validators.required],
      remarks: [null],
      materialItems: this.fb.array([this.createMaterialItem()]),
      attachments: this.fb.array([]),
    });
  }

  get materialItems() {
    return this.materialForm.get('materialItems') as FormArray;
  }

  get attachments(): FormArray<FormControl<string>> {
    return this.materialForm.get('attachments') as FormArray<
      FormControl<string>
    >;
  }

  addAttachment(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const fileUrl = reader.result as string;
        this.attachments.push(new FormControl(fileUrl, { nonNullable: true }));
        this.cdr.markForCheck();
      };
      reader.readAsDataURL(file);
    }
  }

  // Remove attachment by index
  removeAttachment(index: number) {
    this.attachments.removeAt(index);
  }

  createMaterialItem(): FormGroup {
    return this.fb.group({
      id: null,
      description: ['', Validators.required],
      brand: [''],
      unit: [''],
      quantity: [0, Validators.required],
      requiredDate: [null, Validators.required],
      supplierId: [''],
    });
  }

  addMaterialItem(item?: any) {
    const newItemGroup = this.createMaterialItem();

    if (item) {
      newItemGroup.patchValue({
        id: item.id || null,
        description: item.description || '',
        brand: item.brand || '',
        unit: item.unit || '',
        quantity: item.quantity || 0,
        requiredDate: item.requiredDate ? new Date(item.requiredDate) : null,
        supplierId: item.supplierId || '',
      });
    }

    this.materialItems.push(newItemGroup);
  }

  loadForm() {
    this.loadingService.start();
    this.materialRequestService
      .GetOne({
        Page: 1,
        PageSize: 1,
        OrderBy: null,
        Select: null,
        Filter: this.currentId,
        Includes: 'MaterialItems',
      })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();
          if (res) {
            this.materialForm.patchValue({
              ...res,
              requestDate: new Date(res.requestDate),
            });
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loadingService.stop();
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail:
              err.message ||
              'An error occurred while loading the material request',
          });
        },
      });
  }

  onSave() {
    ValidateAllFormFields(this.materialForm);

    if (this.materialForm.invalid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Please fill all required fields',
      });
      return;
    }

    const action$ = this.currentId
      ? this.materialRequestService.Update(this.materialForm.value)
      : this.materialRequestService.Create(this.materialForm.value);

    action$.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Material Request ${this.currentId ? 'updated' : 'created'} successfully`,
        });
        this.router.navigate(['/material-requests']);
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail:
            err.message ||
            'An error occurred while saving the material request',
        });
      },
    });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
