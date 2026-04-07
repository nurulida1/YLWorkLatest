import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
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
import { InputTextModule } from 'primeng/inputtext';
import { LoadingService } from '../../services/loading.service';
import { ClientService } from '../../services/ClientService';
import {
  BuildFilterText,
  BuildSortText,
  GridifyQueryExtend,
  PagingContent,
  ValidateAllFormFields,
} from '../../shared/helpers/helpers';
import { ClientDto } from '../../models/Client';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { Subject, takeUntil } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { MenuItem, MessageService } from 'primeng/api';
import { MenuModule } from 'primeng/menu';

@Component({
  selector: 'app-client',
  imports: [
    CommonModule,
    RouterLink,
    InputTextModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    ReactiveFormsModule,
    TextareaModule,
    MenuModule,
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
        <div class="text-gray-700 font-semibold">Clients</div>
      </div>
      <div
        class="mt-3 border border-gray-200 rounded-md tracking-wide bg-white p-5 flex flex-col"
      >
        <div class="flex flex-row items-center justify-between">
          <div class="flex flex-col">
            <div class="text-[20px] text-gray-700 font-semibold">Clients</div>
            <div class="text-gray-500 text-[15px]">
              Manage and monitor client accounts
            </div>
          </div>
          <div class="flex flex-row items-center gap-2">
            <div class="min-w-[300px] relative">
              <input
                type="text"
                pInputText
                [(ngModel)]="search"
                class="w-full! text-[15px]!"
                placeholder="Search by company name"
              />
              <i
                class="pi pi-search absolute! top-3! right-2! text-gray-500!"
              ></i>
            </div>
            <p-button
              (onClick)="ActionClick(null, 'add')"
              label="Add New Client"
              icon="pi pi-plus"
              severity="info"
              size="small"
              styleClass="py-2!"
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
            stripedRows="false"
            [lazy]="true"
            (onLazyLoad)="NextPage($event)"
            [showGridlines]="true"
          >
            <ng-template #header>
              <tr>
                <th
                  pSortableColumn="Name"
                  class="bg-gray-100! text-[15px]! text-center! w-[30%]!"
                >
                  <div class="flex flex-row justify-center items-center gap-2">
                    <div>Name</div>
                    <p-sortIcon field="Name" />
                  </div>
                </th>
                <th class="bg-gray-100! text-center! text-[15px]! w-[15%]!">
                  Email
                </th>
                <th class="bg-gray-100! text-center! text-[15px]! w-[15%]!">
                  Contact No
                </th>
                <th class="bg-gray-100! text-center! text-[15px]! w-[20%]!">
                  Contact Person
                </th>
                <th class="bg-gray-100! text-center! text-[15px]! w-[10%]!">
                  Status
                </th>
                <th class="bg-gray-100! text-center! text-[15px]! w-[10%]!">
                  Action
                </th>
              </tr>
            </ng-template>
            <ng-template #body let-data>
              <tr>
                <td class="text-center! text-[14px]!">
                  {{ data.name }}
                </td>
                <td class="text-center! text-[14px]!">
                  {{ data.email }}
                </td>
                <td class="text-center! text-[14px]!">
                  {{ data.contactNo }}
                </td>
                <td class="text-center! text-[14px]!">
                  {{ data.contactPerson }}
                </td>
                <td class="text-center! text-[14px]!">
                  <div class="flex items-center justify-center">
                    <div
                      class="rounded-full w-fit px-4"
                      [ngClass]="
                        data.status === 'Active'
                          ? 'text-green-600 bg-green-100'
                          : 'text-red-600 bg-red-100'
                      "
                    >
                      {{ data.status }}
                    </div>
                  </div>
                </td>

                <td class="text-center! text-[14px]!">
                  <div class="flex items-center justify-center">
                    <i
                      (click)="onEllipsisClick($event, data, menu)"
                      class="pi pi-ellipsis-h cursor-pointer"
                    ></i>

                    <!-- <i
                      (click)="ActionClick('Update', data)"
                      class="pi pi-pencil text-blue-500! cursor-pointer! hover:text-gray-500!"
                    ></i> -->
                  </div>
                </td>
              </tr>
            </ng-template>
            <ng-template #emptymessage>
              <tr>
                <td colspan="100%" class="border-x!">
                  <div class="text-[15px] text-center text-gray-500">
                    No client found in records.
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
      styleClass="!relative !border-0 !bg-white w-[50%]"
    >
      <ng-template #header>
        <div class="font-semibold text-[20px]">{{ title }}</div>
      </ng-template>
      <div [formGroup]="FG" class="mt-3 grid grid-cols-12 gap-3 text-[15px]">
        <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
          <div>Name</div>
          <input
            type="text"
            pInputText
            class="w-full! text-[15px]!"
            formControlName="name"
          />
        </div>
        <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
          <div>Email</div>
          <input
            type="text"
            pInputText
            class="w-full! text-[15px]!"
            formControlName="email"
          />
        </div>
        <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
          <div>Contact No</div>
          <input
            type="text"
            pInputText
            class="w-full! text-[15px]!"
            formControlName="contactNo"
          />
        </div>
        <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
          <div>Contact Person</div>
          <input
            type="text"
            pInputText
            class="w-full! text-[15px]!"
            formControlName="contactPerson"
          />
        </div>
        <div class="col-span-12 border-t border-gray-100 pt-3 mt-2">
          <div class="font-semibold text-gray-700 mb-2">Billing Address</div>
        </div>

        <div
          formGroupName="billingAddress"
          class="col-span-12 grid grid-cols-12 gap-3"
        >
          <div class="col-span-12 flex flex-col gap-1">
            <div>Address Line 1</div>
            <input
              pInputText
              formControlName="addressLine1"
              class="w-full! text-[15px]!"
            />
          </div>
          1
          <div class="col-span-12 flex flex-col gap-1">
            <div>Address Line 2</div>
            <input
              pInputText
              formControlName="addressLine2"
              class="w-full! text-[15px]!"
            />
          </div>

          <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
            <div>City</div>
            <input
              pInputText
              formControlName="city"
              class="w-full! text-[15px]!"
            />
          </div>

          <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
            <div>Postcode</div>
            <input
              pInputText
              formControlName="poscode"
              class="w-full! text-[15px]!"
            />
          </div>

          <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
            <div>State</div>
            <input
              pInputText
              formControlName="state"
              class="w-full! text-[15px]!"
            />
          </div>

          <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
            <div>Country</div>
            <input
              pInputText
              formControlName="country"
              class="w-full! text-[15px]!"
            />
          </div>
        </div>

        <div
          class="col-span-12 border-t border-gray-100 pt-3 mt-4 flex justify-between items-center"
        >
          <div class="font-semibold text-gray-700">Delivery Address</div>
          <div class="flex items-center gap-2 text-sm text-gray-500">
            <input
              type="checkbox"
              formControlName="sameAsBilling"
              id="sameAsBilling"
              class="cursor-pointer"
            />
            <label for="sameAsBilling" class="cursor-pointer"
              >Same as Billing Address</label
            >
          </div>
        </div>

        <div
          formGroupName="deliveryAddress"
          class="col-span-12 grid grid-cols-12 gap-3"
          *ngIf="!FG.get('sameAsBilling')?.value"
        >
          <div class="col-span-12 flex flex-col gap-1">
            <div>Address Line 1</div>
            <input
              pInputText
              formControlName="addressLine1"
              class="w-full! text-[15px]!"
            />
          </div>
          <div class="col-span-12 flex flex-col gap-1">
            <div>Address Line 2</div>
            <input
              pInputText
              formControlName="addressLine2"
              class="w-full! text-[15px]!"
            />
          </div>

          <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
            <div>City</div>
            <input
              pInputText
              formControlName="city"
              class="w-full! text-[15px]!"
            />
          </div>

          <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
            <div>Postcode</div>
            <input
              pInputText
              formControlName="poscode"
              class="w-full! text-[15px]!"
            />
          </div>

          <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
            <div>State</div>
            <input
              pInputText
              formControlName="state"
              class="w-full! text-[15px]!"
            />
          </div>

          <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
            <div>Country</div>
            <input
              pInputText
              formControlName="country"
              class="w-full! text-[15px]!"
            />
          </div>
        </div>

        <div
          class="col-span-12 p-3 bg-gray-50 border border-dashed rounded-md text-gray-500 text-center text-sm"
          *ngIf="FG.get('sameAsBilling')?.value"
        >
          Using billing address for delivery.
        </div>
      </div>
      <div class="border-b border-gray-200 mt-3 mb-3"></div>
      <div class="flex flex-row justify-between items-center gap-2 w-full">
        <p-button
          (onClick)="visible = false"
          label="Cancel"
          severity="secondary"
          styleClass="w-full py-1.5! px-5! border-gray-200!"
        >
        </p-button>

        <p-button
          (onClick)="Submit()"
          [label]="isUpdate ? 'Save Changes' : 'Save'"
          severity="info"
          styleClass="w-full py-1.5! px-5!"
        >
        </p-button>
      </div>
    </p-dialog> `,
  styleUrl: './client.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Client implements OnDestroy {
  @ViewChild('fTable') fTable?: Table;

  private readonly loadingService = inject(LoadingService);
  private readonly messageService = inject(MessageService);
  private readonly clientService = inject(ClientService);
  private readonly cdr = inject(ChangeDetectorRef);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  PagingSignal = signal<PagingContent<ClientDto>>(
    {} as PagingContent<ClientDto>,
  );
  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  visible: boolean = false;
  isUpdate: boolean = false;

  search: string = '';
  title: string = 'Add New Client';
  FG!: FormGroup;
  menuItems: MenuItem[] = [];

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 10;
    this.Query.Filter = null;
    this.Query.OrderBy = `Name desc`;
    this.Query.Select = null;
    this.Query.Includes = null;
  }

  GetData() {
    this.loadingService.start();
    this.clientService
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
    this.Query.OrderBy = sortText ? sortText : 'Name desc';

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
      Name: [
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

  ActionClick(data: ClientDto | null, action: string) {
    this.FG = new FormGroup({
      id: new FormControl<string | null>({ value: null, disabled: true }),
      name: new FormControl<string | null>(null, Validators.required),
      email: new FormControl<string | null>(null, [Validators.email]),
      contactNo: new FormControl<string | null>(null, Validators.required),
      contactPerson: new FormControl<string | null>(null),

      sameAsBilling: new FormControl(false),
      // Create nested group for billing address
      billingAddress: new FormGroup({
        name: new FormControl('Billing'),
        addressLine1: new FormControl(null, Validators.required),
        addressLine2: new FormControl(null),
        city: new FormControl(null, Validators.required),
        state: new FormControl(null, Validators.required),
        poscode: new FormControl(null, Validators.required),
        country: new FormControl('Malaysia', Validators.required),
      }),

      deliveryAddress: new FormGroup({
        name: new FormControl('Delivery'),
        addressLine1: new FormControl(null, Validators.required),
        addressLine2: new FormControl(null),
        city: new FormControl(null, Validators.required),
        state: new FormControl(null, Validators.required),
        poscode: new FormControl(null, Validators.required),
        country: new FormControl('Malaysia', Validators.required),
      }),
    });

    this.FG.get('sameAsBilling')?.valueChanges.subscribe((checked) => {
      if (checked) {
        const billingValue = this.FG.get('billingAddress')?.value;
        this.FG.get('deliveryAddress')?.patchValue({
          ...billingValue,
          name: 'Delivery', // Keep the name as Delivery
        });
      }
    });

    if (action === 'Update' && data) {
      this.isUpdate = true;
      this.title = 'Update Client';
      this.FG.get('id')?.enable();
      this.FG.patchValue(data);
    } else {
      this.isUpdate = false;
      this.title = 'Add New Client';
      this.FG.reset({
        billingAddress: { name: 'Billing', country: 'Malaysia' },
        deliveryAddress: { name: 'Delivery', country: 'Malaysia' },
        sameAsBilling: false,
      });
    }
    this.visible = true;
  }

  Submit() {
    // Validate the form first
    ValidateAllFormFields(this.FG);

    if (!this.FG.valid) return;

    this.loadingService.start();
    // Determine which service call to use
    const request$ = this.isUpdate
      ? this.clientService.Update(this.FG.value)
      : this.clientService.Create(this.FG.value);

    request$.pipe(takeUntil(this.ngUnsubscribe)).subscribe({
      next: (res) => {
        // Update local data if needed
        if (this.isUpdate) {
          const index = this.PagingSignal().data.findIndex(
            (x) => x.id === this.FG.get('id')?.value,
          );
          if (index > -1) {
            this.PagingSignal().data[index] = { ...res };
          }
        } else {
          // For create, you can push new record to your list
          this.PagingSignal().data.push(res);
        }

        this.loadingService.stop();
        this.visible = false;
        this.cdr.markForCheck();
        this.messageService.add({
          severity: 'success',
          summary: this.isUpdate ? 'Updated' : 'Created',
          detail: this.isUpdate
            ? 'Client updated successfully.'
            : 'Client created successfully.',
        });

        // Optionally reset the form after creation
        if (!this.isUpdate) this.FG.reset();
      },
      error: (err) => {
        this.loadingService.stop();
        this.messageService.add({
          severity: 'error',
          summary: this.isUpdate ? 'Update Failed' : 'Creation Failed',
          detail: err?.error?.message || 'Something went wrong',
        });
      },
    });
  }

  toggleClientStatus(client: any) {
    this.loadingService.start();
    this.clientService
      .ToggleStatus(client.id)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.PagingSignal.update((current) => {
            const updatedData = current.data.map((item: any) =>
              item.id === client.id ? { ...item, status: res.status } : item,
            );

            return {
              ...current,
              data: updatedData,
            };
          });

          this.cdr.markForCheck();

          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `Client has been ${res.status.toLowerCase()}.`,
          });
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update client status.',
          });
        },
        complete: () => this.loadingService.stop(),
      });
  }

  onEllipsisClick(event: any, client: any, menu: any) {
    this.menuItems = [
      {
        label: 'Edit',
        icon: 'pi pi-pencil',
        command: () => this.ActionClick(client, 'Update'),
      },
      client.status === 'Active'
        ? {
            label: 'Deactivate',
            icon: 'pi pi-times-circle',
            command: () => this.toggleClientStatus(client),
          }
        : {
            label: 'Activate',
            icon: 'pi pi-check-circle',
            command: () => this.toggleClientStatus(client),
          },
    ];

    menu.toggle(event); // toggle the popup menu
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
