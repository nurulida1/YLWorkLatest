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
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { LoadingService } from '../../../services/loading.service';
import { StaffTaskService } from '../../../services/staffTaskService';
import { MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { UserService } from '../../../services/userService.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { ValidateAllFormFields } from '../../../shared/helpers/helpers';

@Component({
  selector: 'app-task-form',
  imports: [
    CommonModule,
    ButtonModule,
    ReactiveFormsModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    DatePickerModule,
    ToggleSwitchModule,
    RouterLink,
    InputNumberModule,
    CheckboxModule,
  ],
  template: `<div class="h-screen flex flex-col overflow-hidden">
    <div
      class="shrink-0 p-6 flex flex-row items-center justify-between border-b border-gray-200 bg-white"
    >
      <div class="font-semibold text-xl">
        {{ isUpdate ? 'Update Task' : 'Create New Task' }}
      </div>

      <i
        class="pi pi-times cursor-pointer"
        [routerLink]="'/task-management'"
      ></i>
    </div>
    <div class="flex-1 min-h-0 overflow-y-auto">
      <div class="grid grid-cols-12 gap-4 p-6" [formGroup]="FG">
        <div class="col-span-12 flex flex-col gap-2">
          <div class="font-semibold">Task Title</div>
          <input
            type="text"
            pInputText
            class="w-full py-3!"
            formControlName="title"
            placeholder="E.g., Update Server Infrastructure"
          />
        </div>
        <div class="col-span-12 flex flex-col gap-2">
          <div class="font-semibold">Description</div>
          <textarea
            pTextarea
            class="w-full py-3!"
            [rows]="4"
            [cols]="30"
            [autoResize]="true"
            formControlName="description"
            placeholder="Provide details about the task..."
          ></textarea>
        </div>
        <div class="col-span-6 flex flex-col gap-2">
          <div class="font-semibold">Priority</div>
          <p-select
            appendTo="body"
            formControlName="priority"
            [options]="[
              { label: 'Low', value: 'Low' },
              { label: 'Medium', value: 'Medium' },
              { label: 'High', value: 'High' },
              { label: 'Critical', value: 'Critical' },
            ]"
            styleClass="py-1!"
            inputStyleClass="py-1!"
          ></p-select>
        </div>
        <div class="col-span-6 flex flex-col gap-2">
          <div class="font-semibold">Category</div>
          <p-select
            appendTo="body"
            formControlName="category"
            [options]="categoryOptions"
            styleClass="py-1!"
            inputStyleClass="py-1!"
          ></p-select>
        </div>
        <div class="col-span-12 flex flex-col gap-2">
          <div class="font-semibold">Assigned To</div>
          <p-select
            appendTo="body"
            placeholder="Search..."
            [filter]="true"
            formControlName="assignedToId"
            [options]="userSelection"
            styleClass="py-2!"
            [showClear]="FG.get('assignedToId')?.value"
            inputStyleClass="py-2!"
          ></p-select>
        </div>
        <div class="col-span-6 flex flex-col gap-2">
          <div class="font-semibold">Start Date</div>
          <p-datepicker
            appendTo="body"
            [showIcon]="true"
            formControlName="startDate"
            dateFormat="dd/mm/yy"
            placeholder="dd/mm/yyyy"
            inputStyleClass="py-3!"
          ></p-datepicker>
        </div>
        <div class="col-span-6 flex flex-col gap-2">
          <div class="font-semibold">Due Date</div>
          <p-datepicker
            appendTo="body"
            [showIcon]="true"
            formControlName="dueDate"
            dateFormat="dd/mm/yy"
            placeholder="dd/mm/yyyy"
            inputStyleClass="py-3!"
          ></p-datepicker>
        </div>

        <div
          class="col-span-12 flex flex-col gap-4 bg-gray-100 rounded-md p-5 border border-gray-200"
        >
          <div class="flex flex-row items-center justify-between">
            <div class="flex flex-row items-center gap-3">
              <i class="pi pi-arrow-right-arrow-left"></i>
              <div class="font-semibold">Recurring Task</div>
            </div>
            <p-toggleswitch formControlName="isRecurring"></p-toggleswitch>
          </div>
          <div class="flex flex-col gap-2">
            <div class="font-semibold">Estimated Hours</div>
            <p-inputnumber
              formControlName="estimatedHours"
              inputStyleClass="w-full!"
              mode="decimal"
              [minFractionDigits]="2"
              [maxFractionDigits]="5"
            ></p-inputnumber>
          </div>
        </div>

        <div class="col-span-12 flex flex-col gap-2 mt-4">
          <div class="flex flex-row items-center justify-between">
            <div class="font-semibold">Checklist Items</div>
            <div
              class="flex flex-row items-center gap-2 w-fit"
              (click)="addChecklist()"
            >
              <i class="pi pi-plus text-gray-500! text-sm!"></i>
              <span class="text-gray-500 text-sm font-semibold">Add Item</span>
            </div>
          </div>

          <div class="mt-4 flex flex-col gap-3" formArrayName="checklists">
            <div
              *ngFor="let item of checklists.controls; let i = index"
              [formGroupName]="i"
            >
              <div class="grid grid-cols-12 items-center gap-3">
                <div class="col-span-1">
                  <p-checkbox
                    [binary]="true"
                    formControlName="isCompleted"
                  ></p-checkbox>
                </div>
                <div class="col-span-10">
                  <input
                    pInputText
                    type="text"
                    formControlName="title"
                    placeholder="Enter checklist item..."
                    class="w-full!"
                    [class.completed]="item.get('isCompleted')?.value"
                  />
                </div>
                <div class="col-span-1">
                  <a
                    *ngIf="!item.get('isCompleted')?.value"
                    (click)="removeChecklist(i)"
                    class="pi pi-trash text-red-500! text-xl!"
                  ></a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      class="shrink-0 flex flex-row items-center justify-end gap-3 border-t border-gray-200 bg-white p-4 px-5"
    >
      <p-button
        label="Cancel"
        [outlined]="true"
        severity="secondary"
        styleClass="py-3!"
        [routerLink]="'/task-management'"
      ></p-button>
      <p-button
        [label]="isUpdate ? 'Save Changes' : 'Create Task'"
        icon="pi pi-save"
        severity="info"
        (onClick)="SaveTask()"
        styleClass="py-3! bg-blue-900! border-none!"
      ></p-button>
    </div>
  </div>`,
  styleUrl: './task-form.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskForm implements OnInit, OnDestroy {
  private readonly loadingService = inject(LoadingService);
  private readonly staffTaskService = inject(StaffTaskService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly messageService = inject(MessageService);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  FG!: FormGroup;
  userSelection: any;
  isUpdate: boolean = false;
  currentId: string | null = null;

  createdBy = `${this.userService.currentUser?.fullName}`;

  statusOptions = [
    { label: 'Not Started', value: 'NotStarted' },
    { label: 'In Progress', value: 'InProgress' },
    { label: 'On Hold', value: 'OnHold' },
    { label: 'Review', value: 'Review' },
    { label: 'Completed', value: 'Completed' },
    { label: 'Cancelled', value: 'Cancelled' },
  ];
  priorityOptions = [
    { label: 'Low', value: 'Low' },
    { label: 'Medium', value: 'Medium' },
    { label: 'High', value: 'High' },
    { label: 'Critical', value: 'Critical' },
  ];
  categoryOptions = [
    { label: 'General', value: 'General' },
    { label: 'Development', value: 'Development' },
    { label: 'Documentation', value: 'Documentation' },
    { label: 'Testing', value: 'Testing' },
    { label: 'Meeting', value: 'Meeting' },
    { label: 'Administrative', value: 'Administrative' },
    { label: 'Support', value: 'Support' },
    { label: 'Other', value: 'Other' },
  ];
  recurringOptions = [
    { label: 'Does not repeat', value: null },
    { label: 'Daily', value: 'Daily' },
    { label: 'Weekly', value: 'Weekly' },
    { label: 'Monthly', value: 'Monthly' },
  ];

  ngOnInit(): void {
    this.currentId = this.activatedRoute.snapshot.queryParams['id'];

    this.getUserSelection();
    this.initForm();

    if (this.currentId) {
      this.isUpdate = true;
      this.FG.get('id')?.enable();
      this.FG.get('id')?.patchValue(this.currentId);
      this.LoadForm();
    }
  }

  initForm() {
    this.FG = new FormGroup({
      id: new FormControl<string | null>({ value: null, disabled: true }),
      title: new FormControl<string | null>(null, Validators.required),
      description: new FormControl<string | null>(null),
      assignedToId: new FormControl<string | null>(null),
      priority: new FormControl<string | null>('Medium'),
      category: new FormControl<string | null>('General'),
      startDate: new FormControl<Date | null>(null),
      dueDate: new FormControl<Date | null>(null, Validators.required),
      reminderAt: new FormControl<Date | null>(null),
      isRecurring: new FormControl<boolean>(false),
      recurringType: new FormControl<string | null>(null),
      estimatedHours: new FormControl<number | null>(0.0),
      checklists: new FormArray([]),
    });
  }

  LoadForm() {
    if (!this.currentId) return;

    this.loadingService.start();
    this.staffTaskService
      .GetOne(this.currentId)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();
          if (res)
            this.FG.patchValue({
              ...res,
              startDate: new Date(res.startDate || ''),
              dueDate: new Date(res.dueDate),
            });
          this.clearChecklists();
          for (const item of res?.checklists || []) {
            this.checklists.push(
              new FormGroup({
                id: new FormControl(item.id),
                title: new FormControl(item.title),
                isCompleted: new FormControl(item.isCompleted),
                sequence: new FormControl(item.sequence ?? 0),
              }),
            );
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loadingService.stop();
        },
      });
  }

  clearChecklists(): void {
    while (this.checklists.length) {
      this.checklists.removeAt(0);
    }
  }

  getUserSelection() {
    this.staffTaskService
      .GetDropdown()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.userSelection = res.users.map((user: any) => ({
            label: user.name,
            value: user.id,
          }));
        },
      });
  }

  get checklists(): FormArray {
    return this.FG.get('checklists') as FormArray;
  }

  addChecklist(): void {
    this.checklists.push(
      new FormGroup({
        id: new FormControl(null),
        title: new FormControl('', Validators.required),
        isCompleted: new FormControl(false),
        sequence: new FormControl(this.checklists.length),
      }),
    );
  }

  removeChecklist(index: number): void {
    this.checklists.removeAt(index);
  }

  SaveTask() {
    if (this.FG.valid) {
      this.loadingService.start();

      const $request = this.isUpdate
        ? this.staffTaskService.Update(this.FG.value)
        : this.staffTaskService.Create(this.FG.value);

      $request.pipe(takeUntil(this.ngUnsubscribe)).subscribe({
        next: (res) => {
          this.loadingService.stop();
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `Task has been ${this.isUpdate ? 'updated' : 'created'}.`,
          });
          this.router.navigate(['/task-management']);
        },
        error: (err) => {
          this.loadingService.stop();
        },
      });
    }
    ValidateAllFormFields(this.FG);
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
