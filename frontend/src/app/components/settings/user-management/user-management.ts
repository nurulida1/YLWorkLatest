import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect'; // Import MultiSelect
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { UserService } from '../../../services/userService.service';
import { MenuItem, MessageService } from 'primeng/api';
import { Observable, Subject, takeUntil } from 'rxjs';
import { LoadingService } from '../../../services/loading.service';
import { UserDto } from '../../../models/User';
import {
  PagingContent,
  GridifyQueryExtend,
  BuildFilterText,
  BuildSortText,
  ValidateAllFormFields,
  passwordMatchValidator,
} from '../../../shared/helpers/helpers';
import { MenuModule } from 'primeng/menu';
import { InputNumberModule } from 'primeng/inputnumber';
import { KeyFilterModule } from 'primeng/keyfilter';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { DatePickerModule } from 'primeng/datepicker';
import { PasswordModule } from 'primeng/password';
import { DepartmentService } from '../../../services/departmentService';

@Component({
  selector: 'app-user-management',
  imports: [
    CommonModule,
    RouterLink,
    InputTextModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    ReactiveFormsModule,
    SelectModule,
    MultiSelectModule, // Register MultiSelect component
    MenuModule,
    InputNumberModule,
    KeyFilterModule,
    ToggleSwitchModule,
    DatePickerModule,
    PasswordModule,
  ],
  template: `<div class="w-full min-h-[92.9vh] flex flex-col p-6 bg-gray-50/50">
      <div
        class="flex flex-row items-center gap-2 text-xs text-gray-500 tracking-wide font-medium mb-4"
      >
        <div
          [routerLink]="'/dashboard'"
          class="cursor-pointer hover:text-blue-600 transition-colors"
        >
          Dashboard
        </div>
        <span class="text-gray-300 text-[10px]">/</span>
        <div class="text-gray-700 font-semibold">User Management</div>
      </div>

      <div
        class="border border-gray-200/80 rounded-xl tracking-wide bg-white shadow-sm flex flex-col overflow-hidden"
      >
        <div
          class="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100"
        >
          <div class="flex flex-col gap-0.5">
            <h1 class="text-xl text-gray-800 font-bold m-0 tracking-tight">
              User Management
            </h1>
            <p class="text-sm text-gray-500 m-0">
              Create, edit, and configure systemic permission roles for user
              accounts.
            </p>
          </div>

          <div
            class="flex flex-col md:flex-row items-stretch md:items-center gap-3"
          >
            <span class="relative min-w-full md:min-w-[320px]">
              <i
                class="pi pi-search absolute top-1/2 -translate-y-1/2 left-3 text-gray-400 text-sm"
              ></i>
              <input
                type="text"
                pInputText
                [(ngModel)]="search"
                class="w-full pl-9! pr-4! py-2! text-sm border border-gray-300 rounded-lg focus:border-blue-500 text-gray-800 placeholder:text-gray-400 shadow-inner/5"
                placeholder="Search users by name..."
                (keyup)="onKeyDown($event)"
              />
            </span>

            <p-button
              label="Add User"
              (onClick)="ActionClick(null, 'add')"
              icon="pi pi-plus"
              severity="info"
              styleClass="!bg-blue-600 hover:!bg-blue-700 !border-blue-600 !py-2 !px-4 !text-sm whitespace-nowrap font-medium rounded-lg shadow-sm transition-all"
            ></p-button>
          </div>
        </div>

        <div class="p-0 overflow-x-auto">
          <p-table
            #fTable
            [value]="PagingSignal().data"
            [paginator]="true"
            [rows]="Query.PageSize"
            [totalRecords]="PagingSignal().totalElements"
            [tableStyle]="{ 'min-width': '60rem' }"
            [rowsPerPageOptions]="[10, 20, 30, 50]"
            [stripedRows]="false"
            [showGridlines]="false"
            [lazy]="true"
            (onLazyLoad)="NextPage($event)"
            styleClass="p-datatable-sm"
          >
            <ng-template #header>
              <tr class="border-b border-gray-200">
                <th
                  class="bg-gray-50/70! text-gray-600! font-semibold! text-xs! uppercase tracking-wider py-3 px-5 w-[25%]!"
                >
                  Identity Profile
                </th>
                <th
                  class="bg-gray-50/70! text-gray-600! font-semibold! text-xs! uppercase tracking-wider py-3 px-4 w-[18%]"
                >
                  Job Title
                </th>
                <th
                  class="bg-gray-50/70! text-gray-600! font-semibold! text-xs! uppercase tracking-wider py-3 px-4 w-[20%]"
                >
                  Departments
                </th>
                <th
                  class="bg-gray-50/70! text-gray-600! font-semibold! text-xs! uppercase tracking-wider py-3 px-4 text-center! w-[14%]"
                >
                  Last Active
                </th>
                <th
                  class="bg-gray-50/70! text-gray-600! font-semibold! text-xs! uppercase tracking-wider py-3 px-4 text-center! w-[13%]"
                >
                  Created Date
                </th>
                <th
                  class="bg-gray-50/70! text-gray-600! font-semibold! text-xs! uppercase tracking-wider py-3 px-4 text-center! w-[5%]"
                >
                  Status
                </th>
                <th
                  class="bg-gray-50/70! text-gray-600! font-semibold! text-xs! uppercase tracking-wider py-3 px-4 text-center! w-[5%]"
                >
                  Action
                </th>
              </tr>
            </ng-template>

            <ng-template #body let-data>
              <tr
                class="hover:bg-gray-50/40 transition-colors border-b border-gray-100 last:border-b-0 text-sm"
              >
                <td class="py-3 px-5">
                  <div class="flex flex-col gap-0.5">
                    <span class="font-semibold text-gray-800">{{
                      data.fullName
                    }}</span>
                    <span class="text-xs text-gray-400 font-normal"
                      >{{ '@' }} {{ data.displayName || 'no-alias' }}</span
                    >
                  </div>
                </td>

                <td class="py-3 px-4 text-gray-600 font-normal">
                  {{ data.jobTitle || 'Unassigned Role' }}
                </td>

                <td class="py-3 px-4">
                  <div class="flex flex-wrap gap-1 max-w-[240px]">
                    <span
                      *ngFor="let dept of data.departments"
                      class="bg-slate-50 text-slate-700 text-[11px] font-medium px-2 py-0.5 rounded-md border border-slate-200/60 shadow-xs"
                    >
                      {{ dept.name }}
                    </span>
                    <span
                      *ngIf="!data.departments?.length"
                      class="text-gray-400 font-normal italic text-xs"
                    >
                      No divisions assigned
                    </span>
                  </div>
                </td>

                <td class="py-3 px-4 text-center! text-gray-500">
                  <div
                    class="flex flex-row items-center gap-2 justify-center text-xs"
                  >
                    <span
                      class="h-2 w-2 rounded-full inline-block"
                      [ngClass]="
                        getLastSeen(data.lastLoginAt) === 'Online'
                          ? 'bg-emerald-500 animate-pulse'
                          : 'bg-gray-300'
                      "
                    ></span>
                    <span class="font-medium text-gray-600">{{
                      getLastSeen(data.lastLoginAt)
                    }}</span>
                  </div>
                </td>

                <td class="py-3 px-4 text-center! text-gray-600 text-xs">
                  {{ data.createdAt | date: 'dd MMM yyyy' }}
                </td>

                <td class="py-3 px-4 text-center!">
                  <div class="flex items-center justify-center">
                    <p-toggleswitch
                      [(ngModel)]="data.isActive"
                      (ngModelChange)="isActiveOnChange($event, data.id)"
                      styleClass="scale-90"
                    />
                  </div>
                </td>

                <td class="py-3 px-4 text-center!">
                  <div class="flex items-center justify-center">
                    <button
                      (click)="onEllipsisClick($event, data, menu)"
                      class="h-8 w-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-all cursor-pointer border-0 bg-transparent"
                    >
                      <i class="pi pi-ellipsis-h text-sm"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </ng-template>

            <ng-template #emptymessage>
              <tr>
                <td colspan="7" class="py-8 bg-gray-50/20">
                  <div
                    class="flex flex-col items-center justify-center gap-2 py-4"
                  >
                    <i class="pi pi-users text-gray-300 text-3xl"></i>
                    <span
                      class="text-sm text-gray-400 font-medium tracking-wide"
                    >
                      No user records found matching target scope.
                    </span>
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      </div>
    </div>

    <p-menu
      #menu
      [model]="menuItems"
      [popup]="true"
      styleClass="shadow-lg border border-gray-100 rounded-lg text-sm"
    ></p-menu>

    <p-dialog
      *ngIf="visible"
      [(visible)]="visible"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      closable="true"
      (onHide)="visible = false"
      styleClass="!border-0 !rounded-xl !shadow-2xl bg-white w-[95%] sm:w-[85%] md:w-[70%] lg:w-[50%] max-h-[90vh] flex flex-col"
    >
      <ng-template #header>
        <div class="flex flex-col gap-1 pr-6">
          <h2 class="text-xl font-bold text-gray-800 tracking-tight m-0">
            {{ title }}
          </h2>
          <p class="text-xs font-normal text-gray-500 tracking-wide m-0">
            Provide account details and assign roles or departmental units.
            fields marked with <span class="text-red-500">*</span> are required.
          </p>
        </div>
      </ng-template>

      <div class="py-4 overflow-y-auto px-1" [formGroup]="FG">
        <div class="grid grid-cols-12 gap-x-5 gap-y-4 tracking-wide text-sm">
          <div class="col-span-12 md:col-span-6 flex flex-col gap-1.5">
            <label
              class="text-xs font-semibold text-gray-600 uppercase tracking-wider"
              >Full Name <span class="text-red-500">*</span></label
            >
            <input
              type="text"
              pInputText
              class="w-full py-2! px-3! border border-gray-300 rounded-md focus:border-blue-500 text-gray-800 text-sm!"
              placeholder="e.g. John Doe"
              formControlName="fullName"
            />
            <small
              class="text-red-500 font-medium text-xs mt-0.5"
              *ngIf="
                FG.get('fullName')?.errors?.['required'] &&
                FG.get('fullName')?.touched
              "
            >
              Full Name is required.
            </small>
          </div>

          <div class="col-span-12 md:col-span-6 flex flex-col gap-1.5">
            <label
              class="text-xs font-semibold text-gray-600 uppercase tracking-wider"
              >Display Name</label
            >
            <input
              type="text"
              pInputText
              class="w-full py-2! px-3! border border-gray-300 rounded-md text-gray-800 text-sm!"
              placeholder="e.g. Johnny"
              formControlName="displayName"
            />
          </div>

          <div class="col-span-12 md:col-span-6 flex flex-col gap-1.5">
            <label
              class="text-xs font-semibold text-gray-600 uppercase tracking-wider"
              >Email Address <span class="text-red-500">*</span></label
            >
            <input
              type="text"
              pInputText
              class="w-full py-2! px-3! border border-gray-300 rounded-md text-gray-800 text-sm!"
              placeholder="name@company.com"
              formControlName="email"
            />
            <small
              class="text-red-500 font-medium text-xs mt-0.5"
              *ngIf="FG.get('email')?.errors?.['email']"
            >
              Invalid email format.
            </small>
            <small
              class="text-red-500 font-medium text-xs mt-0.5"
              *ngIf="
                FG.get('email')?.errors?.['required'] &&
                FG.get('email')?.touched
              "
            >
              Email is required.
            </small>
          </div>

          <div class="col-span-12 md:col-span-6 flex flex-col gap-1.5">
            <label
              class="text-xs font-semibold text-gray-600 uppercase tracking-wider"
              >Contact No</label
            >
            <input
              type="text"
              pInputText
              class="w-full py-2! px-3! border border-gray-300 rounded-md text-gray-800 text-sm!"
              placeholder="+60123456789"
              formControlName="contactNo"
            />
            <small
              class="text-red-500 font-medium text-xs mt-0.5"
              *ngIf="
                FG.get('contactNo')?.errors?.['required'] &&
                FG.get('contactNo')?.touched
              "
            >
              Contact No is required
            </small>
          </div>

          <div class="col-span-12 md:col-span-6 flex flex-col gap-1.5">
            <label
              class="text-xs font-semibold text-gray-600 uppercase tracking-wider"
              >Job Title</label
            >
            <input
              type="text"
              pInputText
              class="w-full py-2! px-3! border border-gray-300 rounded-md text-gray-800 text-sm!"
              placeholder="e.g. Software Engineer"
              formControlName="jobTitle"
            />
          </div>

          <div class="col-span-12 md:col-span-6 flex flex-col gap-1.5">
            <label
              class="text-xs font-semibold text-gray-600 uppercase tracking-wider"
              >Assigned Departments</label
            >
            <p-multiSelect
              class="w-full"
              appendTo="body"
              styleClass="w-full! border border-gray-300 rounded-md text-gray-800 min-h-[38px] flex items-center"
              [options]="departmentSelection"
              formControlName="departmentIds"
              placeholder="Select operational divisions"
              display="chip"
            ></p-multiSelect>
          </div>

          <div class="col-span-12 md:col-span-6 flex flex-col gap-1.5">
            <label
              class="text-xs font-semibold text-gray-600 uppercase tracking-wider"
              >Reporting Manager (HOD)</label
            >
            <p-select
              appendTo="body"
              class="w-full"
              styleClass="w-full! border border-gray-300 rounded-md text-gray-800 h-[38px] flex items-center"
              formControlName="hodId"
              [options]="hodSelection || []"
              [filter]="true"
              placeholder="Select reporting line"
              [showClear]="!!FG.get('hodId')?.value"
            ></p-select>
          </div>

          <div class="col-span-12 md:col-span-6 flex flex-col gap-1.5">
            <label
              class="text-xs font-semibold text-gray-600 uppercase tracking-wider"
              >Joined Date</label
            >
            <p-datepicker
              class="w-full"
              showIcon="true"
              appendTo="body"
              styleClass="w-full! rounded-md text-gray-800 h-[38px]!"
              inputStyleClass="h-[38px]! text-sm!"
              dateFormat="dd/mm/yy"
              placeholder="Select effective date"
              formControlName="joinedDate"
            ></p-datepicker>
          </div>

          <div class="col-span-12 md:col-span-6 flex flex-col gap-1.5">
            <label
              class="text-xs font-semibold text-gray-600 uppercase tracking-wider"
              >Gender</label
            >
            <p-select
              class="w-full"
              appendTo="body"
              styleClass="w-full! border border-gray-300 rounded-md text-gray-800 h-[38px] flex items-center"
              [options]="[
                { label: 'Male', value: 'Male' },
                { label: 'Female', value: 'Female' },
              ]"
              formControlName="gender"
            ></p-select>
          </div>

          <div class="col-span-12 md:col-span-6 flex flex-col gap-1.5">
            <label
              class="text-xs font-semibold text-gray-600 uppercase tracking-wider"
              >System Access Role</label
            >
            <p-select
              class="w-full"
              appendTo="body"
              styleClass="w-full! border border-gray-300 rounded-md text-gray-800 h-[38px] flex items-center"
              placeholder="Assign standard permission level"
              [options]="[
                { label: 'Management', value: 'Management' },
                { label: 'Executive', value: 'Executive' },
                { label: 'HOD', value: 'HOD' },
                { label: 'Support', value: 'Support' },
              ]"
              formControlName="systemRole"
            ></p-select>
          </div>

          <div
            class="col-span-12 md:col-span-6 flex flex-col gap-1.5"
            *ngIf="!isUpdate"
          >
            <label
              class="text-xs font-semibold text-gray-600 uppercase tracking-wider"
              >Account Password <span class="text-red-500">*</span></label
            >
            <p-password
              formControlName="password"
              [feedback]="false"
              autocomplete="off"
              styleClass="w-full!"
              placeholder="Min. 6 alphanumeric items"
              inputStyleClass="w-full! py-2! px-3! border border-gray-300 rounded-md text-gray-800"
              [toggleMask]="true"
            />
          </div>

          <div
            class="col-span-12 md:col-span-6 flex flex-col gap-1.5"
            *ngIf="!isUpdate"
          >
            <label
              class="text-xs font-semibold text-gray-600 uppercase tracking-wider"
              >Confirm Password <span class="text-red-500">*</span></label
            >
            <p-password
              formControlName="confirmPassword"
              [feedback]="false"
              autocomplete="off"
              styleClass="w-full!"
              placeholder="Re-enter verification password"
              inputStyleClass="w-full! py-2! px-3! border border-gray-300 rounded-md text-gray-800"
              [toggleMask]="true"
            />
            <small
              class="text-red-500 font-medium text-xs mt-0.5"
              *ngIf="
                FG.errors?.['passwordMismatch'] &&
                FG.get('confirmPassword')?.touched
              "
            >
              Passwords do not match.
            </small>
          </div>
        </div>
      </div>

      <ng-template #footer>
        <div
          class="flex flex-row justify-end items-center gap-3 pt-3 border-t border-gray-100 bg-gray-50/50 -mx-5 -mb-5 px-5 pb-5 rounded-b-xl"
        >
          <p-button
            (onClick)="visible = false"
            label="Cancel"
            severity="secondary"
            styleClass="!border-gray-300 !text-gray-700 hover:!bg-gray-100 !py-2 !px-4 font-medium transition-all rounded-md text-sm"
          ></p-button>
          <p-button
            (onClick)="SaveUser()"
            [label]="isUpdate ? 'Save Changes' : 'Create User'"
            severity="info"
            styleClass="!bg-blue-600 hover:!bg-blue-700 !border-blue-600 !py-2 !px-5 font-medium transition-all rounded-md text-sm shadow-sm"
          ></p-button>
        </div>
      </ng-template>
    </p-dialog>`,
  styleUrl: './user-management.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserManagement implements OnInit, OnDestroy {
  @ViewChild('fTable') fTable?: Table;

  private readonly departmentService = inject(DepartmentService);
  private readonly loadingService = inject(LoadingService);
  private readonly messageService = inject(MessageService);
  private readonly userService = inject(UserService);
  private readonly cdr = inject(ChangeDetectorRef);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  PagingSignal = signal<PagingContent<UserDto>>({} as PagingContent<UserDto>);
  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  visible: boolean = false;
  isUpdate: boolean = false;
  now: Date = new Date();

  departmentSelection: any[] = [];

  search: string = '';
  title: string = 'Add New User';
  FG!: FormGroup;
  menuItems: MenuItem[] = [];

  hodSelection: { label: string; value: string }[] = [];

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 10;
    this.Query.Filter = null;
    this.Query.OrderBy = `FullName`;
    this.Query.Select = null;
    this.Query.Includes = null;
  }

  ngOnInit(): void {}

  GetData() {
    this.loadingService.start();
    this.userService
      .GetMany(this.Query)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.PagingSignal.set(res);
          this.cdr.markForCheck();
          this.loadingService.stop();
        },
        error: (err) => {
          this.loadingService.stop();
        },
      });
  }

  NextPage(event: TableLazyLoadEvent) {
    if ((event?.first || event?.first === 0) && event?.rows) {
      this.Query.Page = event.first / event.rows + 1 || 1;
      this.Query.PageSize = event.rows;
    }

    const sortText = BuildSortText(event);
    this.Query.OrderBy = sortText ? sortText : 'FullName';

    this.Query.Filter = BuildFilterText(event);
    this.GetData();
  }

  onKeyDown(event: KeyboardEvent) {
    const isEnter = event.key === 'Enter';
    const isBackspaceClear = event.key === 'Backspace' && this.search === '';

    if (isEnter) {
      this.Search(this.search);
    } else if (isBackspaceClear) {
      this.Search('');
    }
  }

  Search(data: string) {
    const filter = {
      FullName: [
        {
          value: data,
          matchMode: '=',
          operator: 'and',
        },
      ],
    };

    if (this.fTable != null) {
      this.fTable.first = 0;
      this.fTable.filters = filter;
    }

    const event: TableLazyLoadEvent = {
      first: 0,
      rows: this.fTable?.rows,
      sortField: null,
      sortOrder: null,
      filters: filter,
    };

    this.NextPage(event);
  }

  ResetTable() {
    this.search = '';

    if (this.fTable) {
      this.fTable.first = 0;
      this.fTable.clearFilterValues();
      this.fTable.saveState();
    }

    this.Query.Filter = null;
    this.GetData();
  }

  ActionClick(data: UserDto | null, action: string) {
    this.isUpdate = action === 'Update';
    this.title = this.isUpdate ? 'Edit User' : 'Add New User';

    this.GetHodSelection();
    this.GetDepartmentSelection();

    this.FG = new FormGroup(
      {
        id: new FormControl<string | null>({
          value: data?.id || null,
          disabled: true,
        }),
        fullName: new FormControl<string | null>(
          data?.fullName || null,
          Validators.required,
        ),
        displayName: new FormControl<string | null>(null),
        email: new FormControl<string | null>(data?.email || null, [
          Validators.required,
          Validators.email,
        ]),
        contactNo: new FormControl<string | null>(null),
        password: new FormControl<string | null>(
          null,
          this.isUpdate ? [] : [Validators.required, Validators.minLength(6)],
        ),
        confirmPassword: new FormControl<string | null>(
          null,
          this.isUpdate ? [] : [Validators.required],
        ),
        jobTitle: new FormControl<string | null>(
          data?.jobTitle ?? null,
          Validators.required,
        ),
        joinedDate: new FormControl<Date | null>(
          data?.joinedDate ? new Date(data.joinedDate) : null,
        ),
        hodId: new FormControl<string | null>(data?.hodId || null),

        // UPDATED: Initialized form value field to hold an array tracking matching backend properties
        departmentIds: new FormControl<string[] | null>(
          data?.departmentIds || [],
        ),
        gender: new FormControl<string | null>(data?.gender || 'Male'),
        systemRole: new FormControl<string | null>(data?.systemRole || null),
      },
      { validators: passwordMatchValidator },
    );

    if (this.isUpdate && data) {
      this.FG.patchValue({
        ...data,
        joinedDate: data.joinedDate ? new Date(data.joinedDate) : null,
        departmentIds: data.departmentIds || [],
      });
    }

    this.visible = true;
    this.cdr.detectChanges();
  }

  onEllipsisClick(event: any, client: any, menu: any) {
    this.menuItems = [
      {
        label: 'Edit',
        icon: 'pi pi-pencil',
        command: () => this.ActionClick(client, 'Update'),
      },
    ];

    menu.toggle(event);
  }

  GetHodSelection() {
    this.userService
      .GetMany({
        Page: 1,
        PageSize: 1000000,
        OrderBy: 'FullName',
        Filter: `SystemRole!=SuperAdmin`,
        Select: null,
        Includes: null,
      })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((res) => {
        this.hodSelection = res.data.map((user: any) => ({
          label: user.fullName,
          value: user.id,
        }));
      });
  }

  GetDepartmentSelection() {
    this.departmentService
      .GetMany({
        Page: 1,
        PageSize: 1000000,
        OrderBy: 'Name',
        Includes: null,
        Select: null,
        Filter: null,
      })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.departmentSelection = res.data.map((x) => ({
            label: x.name,
            value: x.id,
          }));
        },
      });
  }

  getLastSeen(lastLoginAt: string | Date): string {
    if (!lastLoginAt) return '-';

    const last = new Date(lastLoginAt).getTime();
    const now = Date.now();
    const diffMs = now - last;

    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (minutes < 2) return 'Online';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;

    return new Date(lastLoginAt).toLocaleDateString('en-MY', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  isActiveOnChange(event: any, userId: string) {
    this.userService.UpdateStatus(userId, event).subscribe({
      next: (res) => {
        if (res.success) {
          this.PagingSignal.update((current) => ({
            ...current,
            data: current.data.map((user) =>
              user.id === userId ? { ...user, isActive: event } : user,
            ),
          }));

          this.messageService.add({
            severity: 'success',
            summary: 'Updated',
            detail: `User is now ${event ? 'Active' : 'Inactive'}`,
          });
        }
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to update status',
        });
      },
    });
  }

  SaveUser() {
    ValidateAllFormFields(this.FG);

    if (this.FG.invalid) return;

    this.loadingService.start();

    const payload = this.FG.getRawValue();

    const request$: Observable<any> = this.isUpdate
      ? this.userService.UpdateUser(payload)
      : this.userService.Register(payload);

    request$.pipe(takeUntil(this.ngUnsubscribe)).subscribe({
      next: (res: any) => {
        this.loadingService.stop();

        if (res) {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `User ${this.isUpdate ? 'updated' : 'registered'} successfully`,
          });

          this.visible = false;
          if (this.isUpdate) {
            this.PagingSignal.update((state) => ({
              ...state,
              data: state.data.map((u: any) => (u.id === res.id ? res : u)),
            }));
          } else {
            this.PagingSignal.update((state) => ({
              ...state,
              data: [res, ...state.data],
            }));
          }
          this.cdr.markForCheck();
        } else {
          this.messageService.add({
            severity: 'warn',
            summary: 'Warning',
            detail: res.message || res.Message || 'Operation partially failed',
          });
        }
      },
      error: (err: any) => {
        this.loadingService.stop();

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail:
            err.error?.message ||
            err.error?.Message ||
            'Something went wrong. Please try again.',
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
