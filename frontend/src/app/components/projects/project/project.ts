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
import { MenuModule } from 'primeng/menu';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { LoadingService } from '../../../services/loading.service';
import { MenuItem, MessageService } from 'primeng/api';
import { ProjectService } from '../../../services/ProjectService';
import { map, Subject, switchMap, takeUntil } from 'rxjs';
import {
  BuildFilterText,
  BuildSortText,
  GridifyQueryExtend,
  PagingContent,
  ValidateAllFormFields,
} from '../../../shared/helpers/helpers';
import { ProjectDto } from '../../../models/Project';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { MultiSelectModule } from 'primeng/multiselect';
import { RadioButton } from 'primeng/radiobutton';
import { ProgressBarModule } from 'primeng/progressbar';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core/index.js';
import dayGridPlugin from '@fullcalendar/daygrid/index.js';
import timeGridPlugin from '@fullcalendar/timegrid/index.js';
import interactionPlugin from '@fullcalendar/interaction/index.js';
import { ClientService } from '../../../services/ClientService';
import { CompanyType } from '../../../shared/enum/enum';
import { TabsModule } from 'primeng/tabs';
import { CheckboxModule } from 'primeng/checkbox';

@Component({
  selector: 'app-project',
  imports: [
    CommonModule,
    RouterLink,
    InputTextModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    ReactiveFormsModule,
    DatePickerModule,
    TextareaModule,
    MenuModule,
    SelectModule,
    MultiSelectModule,
    RadioButton,
    ProgressBarModule,
    AvatarModule,
    TooltipModule,
    FullCalendarModule,
    TabsModule,
    CheckboxModule,
  ],
  template: `<div class="w-full min-h-[92.9vh] flex flex-col p-5">
      <div class="flex flex-row items-center justify-between">
        <div
          class="flex flex-row items-center gap-1 text-gray-500 tracking-wide"
        >
          <div
            [routerLink]="'/dashboard'"
            class="cursor-pointer hover:text-gray-600"
          >
            Dashboard
          </div>
          /
          <div class="text-gray-700 font-semibold">Projects</div>
        </div>
      </div>
      <div
        class="mt-3 border border-gray-200 rounded-md tracking-wide bg-white p-5 flex flex-col"
      >
        <div class="flex flex-row items-center justify-between">
          <div class="flex flex-col">
            <div class="text-[20px] text-gray-700 font-semibold">Projects</div>
            <div class="text-gray-500">Manage and track projects</div>
          </div>
          <p-button
            label="New Project"
            icon="pi pi-plus-circle"
            severity="info"
            styleClass="tracking-wide!"
            (onClick)="ActionClick(null, 'add')"
          ></p-button>
        </div>
        <div class="flex flex-row items-center gap-2 mt-3">
          <div class="flex-1 flex flex-row relative">
            <input
              type="text"
              pInputText
              [(ngModel)]="search"
              class="w-full!"
              placeholder="Search by project code, or name ..."
              (keyup)="onKeyDown($event)"
            />
            <i
              class="pi pi-search absolute! top-3! right-2! text-gray-500!"
            ></i>
          </div>
        </div>
        <div class="mt-3">
          <p-table
            #fTable
            [value]="PagingSignal().data"
            [paginator]="true"
            [rows]="Query.PageSize"
            [totalRecords]="PagingSignal().totalElements"
            tableStyleClass="min-w-[70rem] 3xl:min-w-[80rem]"
            [rowsPerPageOptions]="[10, 20, 30, 50]"
            [showGridlines]="true"
            [lazy]="true"
            (onLazyLoad)="NextPage($event)"
            ><ng-template #header>
              <tr>
                <th
                  pSortableColumn="ProjectCode"
                  class="bg-gray-100! text-center! w-[10%]!"
                >
                  <div class="flex flex-row items-center justify-center gap-2">
                    <div>Project Code</div>
                    <p-sortIcon field="ProjectCode"></p-sortIcon>
                  </div>
                </th>
                <th
                  pSortableColumn="ProjectTitle"
                  class="bg-gray-100! text-center! w-[30%]!"
                >
                  <div class="flex flex-row items-center justify-center gap-2">
                    <div>Project Title</div>
                    <p-sortIcon field="ProjectTitle"></p-sortIcon>
                  </div>
                </th>
                <th
                  pSortableColumn="Priority"
                  class="bg-gray-100! text-center! w-[10%]!"
                >
                  <div class="flex flex-row items-center justify-center gap-2">
                    <div>Priority</div>
                    <p-sortIcon field="Priority"></p-sortIcon>
                  </div>
                </th>
                <th class="bg-gray-100! text-center! w-[25%]!">Client</th>
                <th
                  pSortableColumn="DueDate"
                  class="bg-gray-100! text-center! w-[15%]!"
                >
                  <div class="flex flex-row items-center justify-center gap-2">
                    <div>Due Date</div>
                    <p-sortIcon field="DueDate"></p-sortIcon>
                  </div>
                </th>

                <th
                  pSortableColumn="Status"
                  class="bg-gray-100! text-center! w-[10%]!"
                >
                  <div class="flex flex-row items-center justify-center gap-2">
                    <div>Status</div>
                    <p-sortIcon field="Status"></p-sortIcon>
                  </div>
                </th>
                <th class="bg-gray-100! text-center! w-[10%]!">Action</th>
              </tr>
            </ng-template>
            <ng-template #body let-data>
              <tr>
                <td class="text-center! bg-white! font-semibold!">
                  <a
                    class="hover:underline"
                    [routerLink]="'/projects/details'"
                    [queryParams]="{ id: data.id }"
                    >{{ data.projectCode }}</a
                  >
                </td>
                <td class="text-center! bg-white!">
                  {{ data.projectTitle }}
                </td>
                <td class="text-center! bg-white!">
                  <div
                    class="px-2 py-1 rounded-full border"
                    [ngClass]="{
                      'bg-yellow-100 text-yellow-600':
                        data.priority === 'Medium',
                      'bg-blue-100 text-blue-600': data.priority === 'Low',
                      'bg-red-100 text-red-600': data.priority === 'High',
                    }"
                  >
                    {{ data.priority }}
                  </div>
                </td>
                <td class="text-center! bg-white!">
                  {{ data.client.name }}
                </td>
                <td class="text-center! bg-white!">
                  {{ data.dueDate | date: 'dd/MM/yyyy' }}
                </td>

                <td class="text-center! bg-white!">
                  <div
                    class="px-2 py-1 rounded-full border flex flex-row justify-center gap-3 items-center"
                    [ngClass]="{
                      'bg-yellow-100 text-yellow-600':
                        data.status === 'Planning',
                      'bg-blue-100 text-blue-600': data.status === 'InProgress',
                      'bg-red-100 text-red-600 animate-pulse':
                        data.status === 'OnHold',
                      'bg-green-100 text-green-600':
                        data.status === 'Completed',
                    }"
                  >
                    <i class="pi pi-circle-fill text-[5px]!"></i>
                    {{ data.status }}
                  </div>
                </td>
                <td class="text-center! bg-white!">
                  <i
                    *ngIf="data.status != 'Completed'"
                    class="pi pi-ellipsis-h cursor-pointer!"
                    (click)="onEllipsisClick($event, data, menu)"
                  ></i>
                </td>
              </tr>
            </ng-template>

            <ng-template #emptymessage>
              <tr>
                <td colspan="100%">
                  <div class="flex items-center justify-center text-gray-500">
                    <div>No project found.</div>
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
      styleClass="!relative !border-0 !bg-white overflow-y-auto! w-[90%] lg:w-[35%]"
    >
      <ng-template #headless>
        <div class="flex flex-col p-5">
          <div class="font-semibold text-[18px]">{{ title }}</div>
          <div class="font-normal tracking-wide text-gray-500 text-sm">
            Fill in all required field.
          </div>
          <div [formGroup]="FG" class="mt-3 grid grid-cols-12 gap-3">
            <div class="col-span-12 flex flex-col gap-1">
              <div>Project Code</div>
              <input
                type="text"
                pInputText
                class="w-full!"
                formControlName="projectCode"
              />
            </div>
            <div class="col-span-12 flex flex-col gap-1">
              <div>Project Title <span class="text-red-500">*</span></div>
              <input
                type="text"
                pInputText
                class="w-full!"
                formControlName="projectTitle"
              />
            </div>

            <div class="col-span-12 flex flex-col gap-1">
              <div class="flex flex-row items-center justify-between">
                <div>Client</div>
                <p-button
                  label="Add New Client"
                  icon="pi pi-plus-circle"
                  severity="info"
                  [text]="true"
                  size="small"
                  (onClick)="NewClientClick()"
                ></p-button>
              </div>
              <p-select
                [options]="clients || []"
                appendTo="body"
                formControlName="clientId"
                [showClear]="FG.get('clientId')?.value"
                [filter]="true"
              ></p-select>
            </div>

            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
              <div>Start Date</div>
              <p-datepicker
                appendTo="body"
                styleClass="w-full!"
                formControlName="startDate"
                dateFormat="dd/mm/yy"
                [showIcon]="true"
              ></p-datepicker>
            </div>
            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
              <div>Due Date</div>
              <p-datepicker
                appendTo="body"
                styleClass="w-full!"
                formControlName="dueDate"
                dateFormat="dd/mm/yy"
                [showIcon]="true"
              ></p-datepicker>
            </div>
            <div class="col-span-12 flex flex-col gap-1">
              <div>Priority</div>
              <div class="flex flex-row gap-5">
                <div class="flex flex-row gap-3">
                  <p-radiobutton
                    value="Low"
                    formControlName="priority"
                  ></p-radiobutton>
                  <label for="">Low</label>
                </div>
                <div class="flex flex-row gap-3">
                  <p-radiobutton
                    value="Medium"
                    formControlName="priority"
                  ></p-radiobutton>
                  <label for="">Medium</label>
                </div>
                <div class="flex flex-row gap-3">
                  <p-radiobutton
                    value="High"
                    formControlName="priority"
                  ></p-radiobutton>
                  <label for="">High</label>
                </div>
              </div>
            </div>
            <div class="col-span-12 flex flex-col gap-1">
              <div>Description</div>
              <textarea
                pTextarea
                rows="3"
                cols="30"
                formControlName="description"
              ></textarea>
            </div>
            <div class="col-span-12 flex flex-col gap-1">
              <div>Project Members</div>

              <p-multiselect
                [options]="users"
                formControlName="projectMembers"
                optionLabel="label"
                optionValue="value"
                display="chip"
                [filter]="true"
                appendTo="body"
              >
                <ng-template let-team #item>
                  <div class="flex items-center gap-2">
                    <div>{{ team.label }}</div>
                  </div>
                </ng-template>
                <ng-template let-team #selecteditems>
                  <div class="flex items-center" *ngIf="team?.length > 0">
                    <div class="font-semibold tracking-wide">
                      {{ team?.length }} team members selected
                    </div>
                  </div>
                </ng-template>
              </p-multiselect>
              <div class="flex flex-wrap gap-3">
                <ng-container *ngFor="let user of selectedTeamMembers">
                  <div
                    class="flex flex-row px-3 py-1 bg-gray-100 cursor-pointer rounded-full gap-2 items-center"
                  >
                    <div
                      class="pi pi-times-circle"
                      (click)="RemoveSelectedMember(user)"
                    ></div>
                    <div class="">{{ user?.label }}</div>
                  </div>
                </ng-container>
              </div>
            </div>
          </div>
          <div class="border-b border-gray-200 mt-3 mb-3"></div>
          <div class="flex flex-row justify-end items-center gap-2 w-full">
            <p-button
              (onClick)="visible = false"
              label="Cancel"
              severity="secondary"
              styleClass="px-7! tracking-wide! py-1.5! border-gray-200!"
            >
            </p-button>

            <p-button
              (onClick)="Submit()"
              [label]="isUpdate ? 'Save Changes' : 'Create'"
              severity="info"
              styleClass="px-7! tracking-wide! py-1.5!"
            >
            </p-button>
          </div>
        </div>
      </ng-template>
    </p-dialog>

    <p-dialog
      *ngIf="clientDialog"
      [(visible)]="clientDialog"
      [modal]="true"
      [draggable]="false"
      closable="true"
      (onHide)="clientDialog = false"
      styleClass="!relative !border-0 !bg-white overflow-y-auto! w-[90%] lg:w-[40%]"
    >
      <ng-template #headless>
        <div class="flex flex-col p-5 gap-3">
          <div class="font-semibold text-[18px]">Add New Client</div>
          <div class="tracking-wide text-gray-500 text-sm">
            Fill in all required field.
          </div>
          <p-tabs value="0">
            <p-tablist>
              <p-tab value="0">Details</p-tab>
              <p-tab value="1">Delivery Address</p-tab>
              <p-tab value="2">Billing Address</p-tab>
            </p-tablist>
            <p-tabpanels>
              <p-tabpanel value="0">
                <div
                  class="mt-3 grid grid-cols-12 gap-3"
                  [formGroup]="clientForm"
                >
                  <div class="col-span-12 flex flex-col gap-1">
                    <div>Client Name <span class="text-red-500">*</span></div>
                    <input
                      type="text"
                      pInputText
                      class="w-full"
                      formControlName="name"
                    />
                    <small
                      *ngIf="
                        FG.get('name')?.errors?.['required'] &&
                        FG.get('name')?.touched
                      "
                      class="text-red-500"
                      >Name is required.</small
                    >
                  </div>
                  <div class="col-span-12 flex flex-col gap-1">
                    <div>Email</div>
                    <input
                      type="text"
                      pInputText
                      class="w-full"
                      formControlName="email"
                    /><small
                      *ngIf="
                        FG.get('email')?.errors?.['email'] &&
                        FG.get('email')?.touched
                      "
                      class="text-red-500"
                      >Email is invalid.</small
                    >
                  </div>
                  <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
                    <div>Contact No</div>
                    <input
                      type="text"
                      pInputText
                      class="w-full"
                      formControlName="contactNo"
                    />
                  </div>
                  <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
                    <div>Fax No</div>
                    <input
                      type="text"
                      pInputText
                      class="w-full"
                      formControlName="faxNo"
                    />
                  </div>
                  <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
                    <div>Contact Person</div>
                    <input
                      type="text"
                      pInputText
                      class="w-full"
                      formControlName="contactPerson1"
                    />
                  </div>
                  <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
                    <div>Contact Person 2</div>
                    <input
                      type="text"
                      pInputText
                      class="w-full"
                      formControlName="contactPerson2"
                    />
                  </div>
                  <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
                    <div>A/C No</div>
                    <input
                      type="text"
                      pInputText
                      class="w-full"
                      formControlName="acNo"
                    />
                  </div>
                  <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
                    <div>TIN No</div>
                    <input
                      type="text"
                      pInputText
                      class="w-full"
                      formControlName="tinNo"
                    />
                  </div>
                  <div class="col-span-12 flex flex-col gap-1">
                    <div>SST Reg No</div>
                    <input
                      type="text"
                      pInputText
                      class="w-full"
                      formControlName="sstRegNo"
                    />
                  </div>
                </div> </p-tabpanel
            ></p-tabpanels>
            <p-tabpanel value="1">
              <div class="flex flex-col gap-2" [formGroup]="clientForm">
                <div
                  class="grid grid-cols-12 gap-4 mt-4 items-center"
                  formGroupName="billingAddress"
                >
                  <div class="col-span-4">Address Line 1</div>
                  <div class="col-span-8">
                    <input
                      type="text"
                      pInputText
                      class="w-full"
                      formControlName="addressLine1"
                    />
                  </div>
                  <div class="col-span-4">Address Line 2</div>
                  <div class="col-span-8">
                    <input
                      type="text"
                      pInputText
                      class="w-full"
                      formControlName="addressLine2"
                    />
                  </div>
                  <div class="col-span-4">City</div>
                  <div class="col-span-8">
                    <input
                      type="text"
                      pInputText
                      class="w-full"
                      formControlName="city"
                    />
                  </div>
                  <div class="col-span-4">Poscode</div>
                  <div class="col-span-8">
                    <input
                      type="text"
                      pInputText
                      class="w-full"
                      formControlName="poscode"
                    />
                  </div>
                  <div class="col-span-4">State</div>
                  <div class="col-span-8">
                    <input
                      type="text"
                      pInputText
                      class="w-full"
                      formControlName="state"
                    />
                  </div>
                  <div class="col-span-4">Country</div>
                  <div class="col-span-8">
                    <input
                      type="text"
                      pInputText
                      class="w-full"
                      formControlName="country"
                    />
                  </div>
                </div>
              </div>
            </p-tabpanel>
            <p-tabpanel value="2">
              <div class="flex flex-col gap-2" [formGroup]="clientForm">
                <div class="flex flex-row items-center gap-2">
                  <p-checkbox
                    formControlName="sameAsBillingAddress"
                    [binary]="true"
                  ></p-checkbox>
                  <label class="mt-1 text-sm text-gray-600" for=""
                    >Same with Delivery Address</label
                  >
                </div>
                <div class="border-b border-gray-200 mt-2"></div>
                <div
                  class="grid grid-cols-12 gap-4 mt-4 items-center"
                  formGroupName="deliveryAddress"
                >
                  <div class="col-span-4">Address Line 1</div>
                  <div class="col-span-8">
                    <input
                      type="text"
                      pInputText
                      class="w-full"
                      formControlName="addressLine1"
                    />
                  </div>
                  <div class="col-span-4">Address Line 2</div>
                  <div class="col-span-8">
                    <input
                      type="text"
                      pInputText
                      class="w-full"
                      formControlName="addressLine2"
                    />
                  </div>
                  <div class="col-span-4">City</div>
                  <div class="col-span-8">
                    <input
                      type="text"
                      pInputText
                      class="w-full"
                      formControlName="city"
                    />
                  </div>
                  <div class="col-span-4">Poscode</div>
                  <div class="col-span-8">
                    <input
                      type="text"
                      pInputText
                      class="w-full"
                      formControlName="poscode"
                    />
                  </div>
                  <div class="col-span-4">State</div>
                  <div class="col-span-8">
                    <input
                      type="text"
                      pInputText
                      class="w-full"
                      formControlName="state"
                    />
                  </div>
                  <div class="col-span-4">Country</div>
                  <div class="col-span-8">
                    <input
                      type="text"
                      pInputText
                      class="w-full"
                      formControlName="country"
                    />
                  </div>
                </div>
              </div>
            </p-tabpanel>
          </p-tabs>

          <div class="border-b border-gray-200 mt-3 mb-3"></div>
          <div class="flex flex-row items-center justify-end gap-2">
            <p-button
              (onClick)="clientDialog = false"
              label="Cancel"
              severity="secondary"
              styleClass="px-7! tracking-wide! py-1.5! border-gray-200!"
            >
            </p-button>

            <p-button
              (onClick)="SaveClient()"
              label="Create"
              severity="info"
              styleClass="px-7! tracking-wide! py-1.5!"
            >
            </p-button>
          </div>
        </div>
      </ng-template>
    </p-dialog>`,
  styleUrl: './project.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Project implements OnInit, OnDestroy {
  @ViewChild('fTable') fTable?: Table;

  private readonly loadingService = inject(LoadingService);
  private readonly messageService = inject(MessageService);
  private readonly projectService = inject(ProjectService);
  private readonly clientService = inject(ClientService);
  private readonly cdr = inject(ChangeDetectorRef);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  PagingSignal = signal<PagingContent<ProjectDto>>(
    {} as PagingContent<ProjectDto>,
  );
  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  visible: boolean = false;
  clientDialog: boolean = false;
  isUpdate: boolean = false;

  search: string = '';
  viewMode: 'grid' | 'list' | 'calendar' = 'grid';
  title: string = 'Create New Project';
  selectedStatus: string | null = null;
  sortBy: string | null = null;
  FG!: FormGroup;
  clientForm!: FormGroup;
  menuItems: MenuItem[] = [];

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay',
    },
    events: this.getCalendarEvents(),
    height: 650,
    editable: false,
  };

  clients: { label: string; value: string }[] = [];
  users: { label: string; value: string }[] = [];

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 10;
    this.Query.Filter = null;
    this.Query.OrderBy = `CreatedAt desc`;
    this.Query.Select = null;
    this.Query.Includes = null;
  }

  ngOnInit(): void {
    this.loadingService.start();

    this.projectService
      .GetDropdown()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          console.log(res);
          // Map clients for p-select
          this.clients = res.clients
            .map((c) => ({ label: c.name, value: c.id }))
            .sort((a, b) => a.label.localeCompare(b.label));

          // Map users for p-select
          this.users = res.users
            .map((u: any) => ({
              label: u.name,
              value: u.id,
            }))
            .sort((a, b) => a.label.localeCompare(b.label));

          this.loadingService.stop();
          this.cdr.markForCheck(); // update the view
        },
        error: (err) => {
          this.loadingService.stop();
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load dropdown data',
          });
        },
      });
  }

  getCalendarEvents() {
    if (!this.PagingSignal()?.data) return [];
    return this.PagingSignal().data.map((project) => ({
      title: project.projectTitle,
      start: project.createdAt,
      end: project.dueDate,
      extendedProps: {
        priority: project.priority,
        status: project.status,
      },
      backgroundColor:
        project.status === 'Completed'
          ? '#10B981'
          : project.status === 'On Hold'
            ? '#EF4444'
            : '#3B82F6',
    }));
  }

  GetData() {
    this.loadingService.start();
    this.projectService
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
    this.Query.OrderBy = sortText ? sortText : 'CreatedAt desc';

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
      ProjectCode: [
        {
          value: data,
          matchMode: '=',
          operator: 'and',
        },
      ],
      ProjectTitle: [
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

  ActionClick(data: ProjectDto | null, action: string) {
    this.FG = new FormGroup({
      id: new FormControl<string | null>({ value: null, disabled: true }),
      projectCode: new FormControl<string | null>(null),
      projectTitle: new FormControl<string | null>(null, [Validators.required]),
      clientId: new FormControl<string | null>(null, Validators.required),
      startDate: new FormControl<Date | null>(null),
      dueDate: new FormControl<Date | null>(null),
      description: new FormControl<string | null>(null),
      priority: new FormControl<string | null>(null),
      projectMembers: new FormControl<string[]>([]),
    });

    if (action === 'Update') {
      this.isUpdate = true;
      this.title = 'Update Project';
      this.FG.get('id')?.enable();
      if (data) {
        this.FG.patchValue({
          ...data,
          startDate: data.startDate ? new Date(data.startDate) : null,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          projectMembers: data.projectMembers?.map((m: any) => m.userId) || [],
        });
      }
      console.log(this.FG.value);
    } else {
      this.title = 'Create New Project';
      this.isUpdate = false;
      this.FG.reset();
      this.FG.get('projectCode')?.enable();
    }

    this.visible = true;
    this.cdr.detectChanges();
  }

  get selectedTeamMembers() {
    const selectedIds = this.FG.get('projectMembers')?.value || [];

    return this.users.filter((u) => selectedIds.includes(u.value));
  }

  RemoveSelectedMember(user: any) {
    const selectedIds = this.FG.get('projectMembers')?.value || [];

    const updated = selectedIds.filter((id: string) => id !== user.value);

    this.FG.get('projectMembers')?.setValue(updated);
  }

  NewClientClick() {
    this.initClientForm();
    this.clientDialog = true;
    this.cdr.detectChanges();
  }

  initClientForm() {
    this.clientForm = new FormGroup({
      name: new FormControl<string | null>(null, Validators.required),
      logoImage: new FormControl<string | null>(null),
      contactNo: new FormControl<string | null>(null),
      contactPerson1: new FormControl<string | null>(null),
      contactPerson2: new FormControl<string | null>(null),
      faxNo: new FormControl<string | null>(null),
      acNo: new FormControl<string | null>(null),
      email: new FormControl<string | null>(null, Validators.email),
      websiteUrl: new FormControl<string | null>(null),
      type: new FormControl<CompanyType | null>(CompanyType.Client),
      tinNo: new FormControl<string | null>(null),
      sstRegNo: new FormControl<string | null>(null),
      sameAsBillingAddress: new FormControl<string | null>(null),
      billingAddress: this.createAddressGroup(),
      deliveryAddress: this.createAddressGroup(),
    });
    this.SameAddressOnChanges();
  }

  createAddressGroup(): FormGroup {
    return new FormGroup({
      addressLine1: new FormControl(null),
      addressLine2: new FormControl(null),
      city: new FormControl(null),
      state: new FormControl(null),
      country: new FormControl(null),
      poscode: new FormControl(null),
    });
  }

  SameAddressOnChanges() {
    this.clientForm
      .get('sameAsBillingAddress')
      ?.valueChanges.pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((checked: boolean) => {
        if (checked) {
          const billing = this.clientForm.get('billingAddress')?.value;

          this.clientForm.get('deliveryAddress')?.patchValue(billing);
          this.clientForm.get('deliveryAddress')?.disable(); // optional UX
        } else {
          this.clientForm.get('deliveryAddress')?.enable();
        }
      });
  }

  SaveClient() {
    if (!this.clientForm.valid) {
      ValidateAllFormFields(this.clientForm);
      return;
    }

    const payload = this.clientForm.getRawValue();

    this.loadingService.start();

    this.clientService
      .Create(payload)
      .pipe(
        switchMap((res) => {
          const newClientId = res?.id;

          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Client created successfully',
          });

          this.clientDialog = false;

          return this.clientService
            .GetMany({
              Page: 1,
              PageSize: 1000000,
              OrderBy: 'Name',
              Select: null,
              Filter: null,
              Includes: null,
            })
            .pipe(map((clientRes) => ({ clientRes, newClientId })));
        }),
        takeUntil(this.ngUnsubscribe),
      )
      .subscribe({
        next: ({ clientRes, newClientId }) => {
          this.loadingService.stop();

          this.clients = clientRes.data
            .filter((x) => x.type === CompanyType.Client)
            .map((x) => ({ label: x.name, value: x.id }));

          // auto select new client
          this.FG.get('clientId')?.setValue(newClientId);

          this.cdr.markForCheck();
        },
        error: () => {
          this.loadingService.stop();
        },
      });
  }

  Submit() {
    ValidateAllFormFields(this.FG);

    if (!this.FG.valid) return;

    this.loadingService.start();

    const request$ = this.isUpdate
      ? this.projectService.Update(this.FG.value)
      : this.projectService.Create(this.FG.value);

    request$.pipe(takeUntil(this.ngUnsubscribe)).subscribe({
      next: (res) => {
        if (this.isUpdate) {
          const index = this.PagingSignal().data.findIndex(
            (x) => x.id === this.FG.get('id')?.value,
          );

          if (index > -1) {
            this.PagingSignal().data[index] = { ...res };
          }
        } else {
          this.PagingSignal().data.push(res);
        }

        this.loadingService.stop();
        this.visible = false;
        this.cdr.markForCheck();
        this.messageService.add({
          severity: 'success',
          summary: this.isUpdate ? 'Updated' : 'Created',
          detail: this.isUpdate
            ? `Project: ${res.projectCode} updated successfully.`
            : `Project: ${res.projectCode} created successfully.`,
        });
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

  onEllipsisClick(event: any, project: any, menu: any) {
    const statusFlow: Record<string, string[]> = {
      Planning: ['Start Progress'],
      InProgress: ['Put On Hold', 'Mark Completed'],
      OnHold: ['Resume Progress', 'Mark Completed'],
      Completed: [],
    };

    const actions = statusFlow[project.status] || [];

    this.menuItems = [
      {
        label: 'Edit',
        icon: 'pi pi-pencil',
        command: () => this.ActionClick(project, 'Edit'),
      },
      ...actions.map((action) => ({
        label: action,
        icon: this.getStatusIcon(action),
        command: () => this.handleStatusChange(project, action),
      })),
    ];

    menu.toggle(event);
  }

  handleStatusChange(project: any, action: string) {
    let newStatus = project.status;

    switch (action) {
      case 'Start Progress':
        newStatus = 'InProgress';
        break;
      case 'Put On Hold':
        newStatus = 'OnHold';
        break;
      case 'Resume Progress':
        newStatus = 'InProgress';
        break;
      case 'Mark Completed':
        newStatus = 'Completed';
        break;
    }

    this.projectService
      .UpdateStatus({
        projectId: project.id,
        status: newStatus,
      })
      .subscribe((res) => {
        project.status = res.status;
        this.cdr.markForCheck();
      });
  }

  getStatusIcon(action: string) {
    switch (action) {
      case 'Start Progress':
      case 'Resume Progress':
        return 'pi pi-play';

      case 'Put On Hold':
        return 'pi pi-pause';

      case 'Mark Completed':
        return 'pi pi-check';

      default:
        return 'pi pi-cog';
    }
  }

  getInitials(name: string | undefined | null) {
    if (!name) return ''; // return empty string if name is missing
    return name
      .split(' ')
      .filter((n) => n) // remove empty parts
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }
  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
