import { CommonModule, Location } from '@angular/common';
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
import { UserService } from '../../../services/userService.service';
import { EditorModule } from 'primeng/editor';

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
    EditorModule,
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
      <span class="text-gray-900 font-bold">Material Request Form</span>
    </nav>

    <div class="border bg-white border-gray-200 rounded-md p-5 flex flex-col">
      <h2 class="text-xl font-semibold">
        {{ currentId ? 'Edit Material Request Form' : 'Material Request Form' }}
      </h2>

      <div class="mt-1 text-gray-500 tracking-wide">
        Fill in all required field.
      </div>
      <div
        class="mt-5 grid grid-cols-12 gap-4 items-center"
        [formGroup]="materialForm"
      >
        <!-- <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
          <div>Document No <span class="text-red-500">*</span></div>
          <input
            type="text"
            pInputText
            class="w-full"
            formControlName="documentNo"
          />
        </div> -->
        <div class="col-span-12 flex flex-col gap-1">
          <div>Project</div>
          <p-select
            [options]="projectSelections || []"
            appendTo="body"
            styleClass="w-full!"
            formControlName="projectId"
            [filter]="true"
          ></p-select>
        </div>
        <!-- <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
          <div>Rev No</div>
          <input
            type="text"
            pInputText
            class="w-full"
            formControlName="revNo"
          />
        </div>
        <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
          <div>Eff Date</div>
          <p-datepicker
            appendTo="body"
            [showIcon]="true"
            formControlName="effDate"
            dateFormat="dd/mm/yy"
            styleClass="w-full!"
          ></p-datepicker>
        </div> -->
        <!-- <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
          <div>Request No</div>
          <input
            type="text"
            pInputText
            class="w-full"
            formControlName="requestNo"
          />
        </div> -->

        <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
          <div>Request Date</div>
          <p-datepicker
            appendTo="body"
            [showIcon]="true"
            formControlName="requestDate"
            dateFormat="dd/mm/yy"
            styleClass="w-full!"
          ></p-datepicker>
        </div>
        <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
          <div>Request By</div>
          <p-select
            [options]="userSelections || []"
            appendTo="body"
            [filter]="true"
            formControlName="requestedById"
          ></p-select>
        </div>
        <div class="col-span-12 flex flex-col gap-1">
          <div>Delivery Place</div>
          <input
            type="text"
            pInputText
            class="w-full"
            formControlName="deliveryPlace"
          />
        </div>

        <div class="col-span-12 flex flex-col gap-1">
          <div>Remarks</div>
          <textarea
            name=""
            id=""
            pTextarea
            [cols]="30"
            [rows]="3"
            formControlName="remarks"
          ></textarea>
        </div>
      </div>
      <div [formGroup]="materialForm">
        <div formGroupName="materialItems" class="flex flex-col gap-2 mt-6">
          <div class="font-semibold text-lg">Material Items</div>
          <p-table
            showGridlines="true"
            [tableStyle]="{ 'min-width': '70rem', 'table-layout': 'fixed' }"
            [value]="materialItems.controls"
          >
            <ng-template #header>
              <tr>
                <th class="text-center! text-sm! w-[30%]! bg-gray-100!">
                  Description
                </th>
                <th class="text-center! text-sm! w-[20%]! bg-gray-100!">
                  Brand
                </th>

                <th class="text-center! text-sm! w-[10%]! bg-gray-100!">
                  Type No
                </th>
                <th class="text-center! text-sm! w-[10%]! bg-gray-100!">
                  Quantity
                </th>
                <th class="text-center! text-sm! w-[10%]! bg-gray-100!">
                  Unit
                </th>
                <th class="text-center! text-sm! w-[15%]! bg-gray-100!">
                  Required At
                </th>
                <th class="text-center! text-sm! w-[15%]! bg-gray-100!">
                  Remarks
                </th>
                <th class="text-center! text-sm! w-[5%]! bg-gray-100!">
                  Action
                </th>
              </tr></ng-template
            >
            <ng-template #body let-row let-i="rowIndex">
              <tr [formGroup]="row">
                <td>
                  <textarea
                    name=""
                    id=""
                    pTextarea
                    class="w-full!"
                    formControlName="description"
                    [cols]="30"
                    [rows]="3"
                  ></textarea>
                </td>

                <td>
                  <input
                    pInputText
                    formControlName="brand"
                    class="w-full text-center!"
                  />
                </td>

                <td>
                  <input
                    pInputText
                    formControlName="typeNo"
                    class="w-full text-center!"
                  />
                </td>

                <td>
                  <p-inputNumber
                    formControlName="quantity"
                    class="w-full!"
                    inputStyleClass="w-full! text-center!"
                    styleClass="w-full!"
                  />
                </td>
                <td>
                  <p-select
                    formControlName="unit"
                    appendTo="body"
                    [options]="[
                      { label: 'Pcs', value: 'Pcs' },
                      { label: 'Box', value: 'Box' },
                      { label: 'Set', value: 'Set' },
                      { label: 'Pair', value: 'Pair' },
                      { label: 'Unit', value: 'Unit' },
                      { label: 'Nos', value: 'Nos' },
                      { label: 'Rolls', value: 'Rolls' },
                    ]"
                    styleClass="w-full!"
                  ></p-select>
                </td>

                <td>
                  <p-datepicker
                    showIcon="true"
                    appendTo="body"
                    formControlName="requiredAt"
                    styleClass="w-full!"
                    dateFormat="dd/mm/yy"
                  ></p-datepicker>
                </td>

                <td>
                  <input
                    pInputText
                    formControlName="remarks"
                    class="w-full text-center!"
                  />
                </td>

                <td class="text-center!">
                  <p-button
                    icon="pi pi-trash"
                    severity="danger"
                    size="small"
                    class="flex items-center justify-center"
                    [text]="true"
                    (onClick)="removeItem(i)"
                  ></p-button>
                </td>
              </tr>
            </ng-template>
            <ng-template #emptymessage>
              <tr>
                <td colspan="100%">
                  <div class="flex items-center justify-center text-gray-500">
                    No items added.
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
          <p-button
            label="Add Item"
            styleClass="rounded-full!"
            icon="pi pi-plus-circle"
            size="small"
            severity="info"
            (onClick)="addMaterialItem()"
          ></p-button>
        </div>
      </div>
      <div class="border-b border-gray-200 mt-4 mb-4"></div>
      <div class="flex flex-row items-center justify-end gap-2">
        <p-button
          label="Discard"
          severity="secondary"
          styleClass="border-gray-200! px-4!"
          (onClick)="CancelClick()"
        ></p-button>
        <p-button
          label="Submit"
          severity="info"
          styleClass="px-4!"
          (onClick)="onSave()"
        ></p-button>
      </div>
    </div>
  </div>`,
  styleUrl: './material-request-form.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaterialRequestForm implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly userService = inject(UserService);
  private readonly messageService = inject(MessageService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly loadingService = inject(LoadingService);
  private readonly location = inject(Location);
  private readonly materialRequestService = inject(MaterialRequestService);

  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  materialForm!: FormGroup;
  currentId: string = '';
  userRequestedId: string | null = null;
  projectId: string | null = null;

  projectSelections: any[] = [];
  userSelections: any[] = [];
  supplierSelections: any[] = [];

  selectedClient: any = null;

  ngOnInit(): void {
    this.currentId = this.activatedRoute.snapshot.queryParams['id'] || null;
    this.projectId =
      this.activatedRoute.snapshot.queryParams['projectId'] || null;
    this.userRequestedId = this.userService.currentUser?.userId || null;

    this.initForm();

    this.getDropdown();

    this.materialForm
      .get('projectId')
      ?.valueChanges.pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((projectId: string) => {
        const selectedProject = this.projectSelections.find(
          (x) => x.value === projectId,
        );

        if (selectedProject) {
          this.materialForm.patchValue({
            clientId: selectedProject.clientId,
          });
        }
      });

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
          this.loadingService.stop();

          this.projectSelections = res.projects.map((p: any) => ({
            value: p.id,
            label: p.projectTitle,
            clientId: p.clientId,
          }));

          this.supplierSelections = res.suppliers.map((s: any) => ({
            label: s.name,
            value: s.id,
          }));

          this.userSelections = res.users.map((u: any) => ({
            label: u.name,
            value: u.id,
          }));

          if (this.projectId) {
            this.materialForm.get('projectId')?.patchValue(this.projectId);
            this.materialForm.get('projectId')?.disable();
          }
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
  }

  initForm() {
    this.materialForm = new FormGroup({
      id: new FormControl<string | null>({ value: null, disabled: true }),
      documentNo: new FormControl<string | null>(null),
      revNo: new FormControl<string | null>(null),
      effDate: new FormControl<Date | null>(null),
      requestNo: new FormControl<string | null>(null),
      projectId: new FormControl<string | null>(null),
      clientId: new FormControl<string | null>(null),
      requestDate: new FormControl<Date | null>(new Date()),
      deliveryDate: new FormControl<Date | null>(null),
      deliveryPlace: new FormControl<string | null>(null),
      workOrderId: new FormControl<string | null>(null),
      requestedById: new FormControl<string | null>(this.userRequestedId),
      remarks: new FormControl<string | null>(null),
      materialItems: new FormArray([this.createMaterialItem()]),
    });
  }

  get materialItems() {
    return this.materialForm.get('materialItems') as FormArray;
  }

  createMaterialItem(): FormGroup {
    return this.fb.group({
      id: null,
      description: [null, Validators.required],
      brand: [null],
      unit: [null],
      typeNo: [null],
      quantity: [null, Validators.required],
      requiredAt: [null],
      remarks: [null],
      supplierId: [null],
    });
  }

  addMaterialItem(item?: any) {
    const newItemGroup = this.createMaterialItem();

    if (item) {
      newItemGroup.patchValue({
        id: item.id || null,
        description: item.description || null,
        brand: item.brand || null,
        unit: item.unit || null,
        typeNo: item.typeNo,
        quantity: item.quantity || 0,
        requiredAt: item.requiredDate ? new Date(item.requiredDate) : null,
        remarks: item.remarks || null,
        supplierId: item.supplierId || null,
      });
    }

    this.materialItems.push(newItemGroup);
  }

  removeItem(index: number) {
    this.materialItems.removeAt(index);
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

    this.loadingService.start();
    const payload = this.materialForm.getRawValue();

    const action$ = this.currentId
      ? this.materialRequestService.Update(payload)
      : this.materialRequestService.Create(payload);

    action$.subscribe({
      next: (res) => {
        this.loadingService.stop();
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Material Request: ${res.requestNo ? 'updated' : 'created'} successfully`,
        });
        this.CancelClick();
      },
      error: (err) => {
        this.loadingService.stop();
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

  CancelClick() {
    this.location.back();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
