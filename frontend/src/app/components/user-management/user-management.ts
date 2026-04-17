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
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { UserService } from '../../services/userService.service';
import { MenuItem, MessageService } from 'primeng/api';
import { Observable, Subject, takeUntil } from 'rxjs';
import { LoadingService } from '../../services/loading.service';
import { UserDto } from '../../models/User';
import {
  PagingContent,
  GridifyQueryExtend,
  BuildFilterText,
  BuildSortText,
  ValidateAllFormFields,
  passwordMatchValidator,
} from '../../shared/helpers/helpers';
import { MenuModule } from 'primeng/menu';
import { InputNumberModule } from 'primeng/inputnumber';
import { KeyFilterModule } from 'primeng/keyfilter';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { DatePickerModule } from 'primeng/datepicker';
import { PasswordModule } from 'primeng/password';

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
    MenuModule,
    InputNumberModule,
    KeyFilterModule,
    ToggleSwitchModule,
    DatePickerModule,
    PasswordModule,
  ],
  template: `<div class="w-full min-h-[92.9vh] flex flex-col p-5">
      <div
        class="flex flex-row items-center gap-1 text-gray-500 text-[15px] tracking-wide"
      >
        <div
          [routerLink]="'/dashboard'"
          class="cursor-pointer hover:text-gray-600"
        >
          Dashboard
        </div>
        /
        <div class="text-gray-700 font-semibold">User Management</div>
      </div>

      <div
        class="mt-3 border border-gray-200 rounded-md tracking-wide bg-white p-5 flex flex-col"
      >
        <div class="flex flex-row items-center justify-between">
          <div class="flex flex-col">
            <div class="text-[20px] text-gray-700 font-semibold">
              User Management
            </div>
            <div class="text-gray-500 text-[15px]">
              Create, edit, and manage user accounts
            </div>
          </div>
          <div class="flex flex-row items-center gap-2">
            <div class="min-w-[300px] relative">
              <input
                type="text"
                pInputText
                [(ngModel)]="search"
                class="w-full! text-[15px]!"
                placeholder="Search by name"
                (keyup)="onKeyDown($event)"
              />
              <i
                class="pi pi-search absolute! top-3! right-2! text-gray-500!"
              ></i>
            </div>
            <p-button
              label="New User"
              (onClick)="ActionClick(null, 'add')"
              icon="pi pi-plus-circle"
              severity="info"
              size="small"
              styleClass="py-2! whitespace-nowrap!"
            ></p-button>
          </div>
        </div>
        <div class="mt-3">
          <p-table
            #fTable
            [value]="PagingSignal().data"
            [paginator]="true"
            [rows]="Query.PageSize"
            [totalRecords]="PagingSignal().totalElements"
            [tableStyle]="{ 'min-width': '60rem' }"
            [rowsPerPageOptions]="[10, 20, 30, 50]"
            [stripedRows]="true"
            [showGridlines]="true"
            [lazy]="true"
            (onLazyLoad)="NextPage($event)"
          >
            <ng-template #header>
              <tr>
                <th class="bg-gray-100! text-[15px]! text-center! w-[20%]!">
                  User
                </th>
                <th class="bg-gray-100! text-[15px]! text-center! w-[15%]">
                  Job Title
                </th>
                <th class="bg-gray-100! text-[15px]! text-center! w-[15%]">
                  Last Activity
                </th>
                <th class="bg-gray-100! text-[15px]! text-center! w-[15%]">
                  Created On
                </th>

                <th class="bg-gray-100! text-[15px]! text-center! w-[10%]">
                  Status
                </th>
                <th class="bg-gray-100! text-[15px]! text-center! w-[5%]">
                  Action
                </th>
              </tr>
            </ng-template>
            <ng-template #body let-data>
              <tr>
                <td class="text-[14px]! text-center! font-semibold">
                  {{ data.fullName }}
                </td>
                <td class="text-center! text-[14px]!">
                  {{ data.jobTitle }}
                </td>
                <td class="text-center! text-[14px]! text-gray-500!">
                  <div class="flex flex-row items-center gap-2 justify-center">
                    <div
                      class="pi pi-circle-fill !text-[5px] text-green-500!"
                      *ngIf="getLastSeen(data.lastLoginAt) === 'Online'"
                    ></div>
                    <div>{{ getLastSeen(data.lastLoginAt) }}</div>
                  </div>
                </td>

                <td class="text-center! text-[14px]!">
                  {{ data.createdAt | date: 'dd MMMM, yyyy' }}
                </td>
                <td class="text-center! text-[14px]!">
                  <p-toggleswitch
                    [(ngModel)]="data.isActive"
                    (ngModelChange)="isActiveOnChange($event, data.id)"
                  />
                </td>
                <td class="text-center! text-[14px]!">
                  <div class="flex items-center justify-center">
                    <i
                      (click)="onEllipsisClick($event, data, menu)"
                      class="pi pi-ellipsis-h cursor-pointer"
                    ></i>
                  </div>
                </td>
              </tr>
            </ng-template>
            <ng-template #emptymessage>
              <tr>
                <td colspan="100%" class="border-x!">
                  <div class="text-[15px] text-center text-gray-500">
                    No project found in records.
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      </div>
    </div>
    <p-menu #menu [model]="menuItems" [popup]="true"></p-menu>

    <p-dialog
      *ngIf="visible"
      [(visible)]="visible"
      [modal]="true"
      [draggable]="false"
      closable="true"
      (onHide)="visible = false"
      styleClass="!relative !border-0 !bg-white overflow-y-auto! w-[90%] lg:w-[50%]"
    >
      <ng-template #headless>
        <div class="p-5 flex flex-col">
          <div class="font-semibold text-[20px]">{{ title }}</div>
          <div class="font-normal tracking-wide text-gray-500 text-[14px]">
            Fill in all required field.
          </div>
          <div
            class="text-[15px] tracking-wide mt-7 grid grid-cols-12 gap-4"
            [formGroup]="FG"
          >
            <div class="col-span-12 flex flex-col gap-1">
              <div>Full Name <span class="text-red-500">*</span></div>
              <input
                type="text"
                pInputText
                class="w-full py-1.5!"
                formControlName="fullName"
              /><small
                class="text-red-500"
                *ngIf="
                  FG.get('fullName')?.errors?.['required'] &&
                  FG.get('fullName')?.touched
                "
                >Full Name is required.</small
              >
            </div>

            <div class="col-span-12 md:col-span-6 flex flex-col gap-1">
              <div>Email <span class="text-red-500">*</span></div>
              <input
                type="text"
                pInputText
                class="w-full py-1.5!"
                formControlName="email"
              /><small
                class="text-red-500"
                *ngIf="FG.get('email')?.errors?.['email']"
                >Invalid email format.</small
              >
              <small
                class="text-red-500"
                *ngIf="
                  FG.get('email')?.errors?.['required'] &&
                  FG.get('email')?.touched
                "
                >Email is required.</small
              >
            </div>
            <div class="col-span-12 md:col-span-6 flex flex-col gap-1">
              <div>Contact No</div>
              <input
                type="text"
                pInputText
                class="w-full py-1.5!"
                formControlName="contactNo"
              /><small
                class="text-red-500"
                *ngIf="
                  FG.get('contactNo')?.errors?.['required'] &&
                  FG.get('contactNo')?.touched
                "
                >Contact No is required</small
              >
            </div>
            <div class="col-span-12 md:col-span-6 flex flex-col gap-1">
              <div>Job Title</div>
              <input
                type="text"
                pInputText
                class="w-full"
                formControlName="jobTitle"
              />
            </div>
            <div class="col-span-12 md:col-span-6 flex flex-col gap-1">
              <div>HOD</div>
              <p-select
                appendTo="body"
                class="w-full"
                formControlName="hodId"
                [options]="hodSelection || []"
                [filter]="true"
                [showClear]="FG.get('hodId')?.value"
              ></p-select>
            </div>
            <div class="col-span-12 md:col-span-6 flex flex-col gap-1">
              <div>Joined Date</div>
              <p-datepicker
                class="w-full"
                showIcon="true"
                appendTo="body"
                styleClass="w-full!"
                dateFormat="dd/mm/yy"
                formControlName="joinedDate"
              ></p-datepicker>
            </div>
            <div class="col-span-12 md:col-span-6 flex flex-col gap-1">
              <div>Gender</div>
              <p-select
                class="w-full"
                appendTo="body"
                styleClass="w-full!"
                [options]="[
                  { label: 'Male', value: 'Male' },
                  { label: 'Female', value: 'Female' },
                ]"
                formControlName="gender"
              ></p-select>
            </div>
            <div
              class="col-span-12 md:col-span-6 flex flex-col gap-1"
              *ngIf="!isUpdate"
            >
              <div>Password <span class="text-red-500">*</span></div>
              <p-password
                formControlName="password"
                [feedback]="false"
                autocomplete="off"
                styleClass="w-full!"
                inputStyleClass="w-full!"
                [toggleMask]="true"
              />
            </div>
            <div
              class="col-span-12 md:col-span-6 flex flex-col gap-1"
              *ngIf="!isUpdate"
            >
              <div>Confirm Password <span class="text-red-500">*</span></div>
              <p-password
                formControlName="confirmPassword"
                [feedback]="false"
                autocomplete="off"
                styleClass="w-full!"
                inputStyleClass="w-full!"
                [toggleMask]="true"
              />
              <small
                class="text-red-500"
                *ngIf="
                  FG.errors?.['passwordMismatch'] &&
                  FG.get('confirmPassword')?.touched
                "
              >
                Passwords do not match.
              </small>
            </div>
          </div>

          <div class="border-b border-gray-200 mt-3 mb-3"></div>
          <div class="flex flex-row items-center gap-3 justify-between">
            <p-button
              (onClick)="visible = false"
              label="Cancel"
              severity="secondary"
              styleClass="border-gray-200! py-1.5! px-4!"
            ></p-button>
            <p-button
              (onClick)="SaveUser()"
              [label]="isUpdate ? 'Save Changes' : 'Create'"
              severity="info"
              styleClass="py-1.5! px-4!"
            ></p-button>
          </div></div></ng-template
    ></p-dialog> `,
  styleUrl: './user-management.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserManagement implements OnInit, OnDestroy {
  @ViewChild('fTable') fTable?: Table;

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
        gender: new FormControl<string | null>(data?.gender || 'Male'),
      },
      { validators: passwordMatchValidator },
    ); // Add cross-field validator here

    if (this.isUpdate && data) {
      this.FG.patchValue({
        ...data,
        joinedDate: data.joinedDate ? new Date(data.joinedDate) : null,
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

    menu.toggle(event); // toggle the popup menu
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

  getLastSeen(lastLoginAt: string | Date): string {
    if (!lastLoginAt) return '-';

    const last = new Date(lastLoginAt).getTime();
    const now = Date.now();
    const diffMs = now - last;

    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // If within 2 minutes → Online
    if (minutes < 2) return 'Online';

    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;

    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;

    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;

    // More than 7 days → show full date
    return new Date(lastLoginAt).toLocaleDateString('en-MY', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  isActiveOnChange(event: any, userId: string) {
    // Note: event is the boolean value from p-toggleswitch
    this.userService.UpdateStatus(userId, event).subscribe({
      next: (res) => {
        if (res.success) {
          // Update the Signal locally so the UI stays in sync without a refresh
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
