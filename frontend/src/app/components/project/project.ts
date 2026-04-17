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
import { LoadingService } from '../../services/loading.service';
import { MenuItem, MessageService } from 'primeng/api';
import { ProjectService } from '../../services/ProjectService';
import { Subject, takeUntil } from 'rxjs';
import {
  BuildFilterText,
  BuildSortText,
  GridifyQueryExtend,
  PagingContent,
  ValidateAllFormFields,
} from '../../shared/helpers/helpers';
import { ProjectDto } from '../../models/Project';
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
  ],
  template: `<div class="w-full min-h-[92.9vh] flex flex-col p-5">
      <div class="flex flex-row items-center justify-between">
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
          <div class="text-gray-700 font-semibold">Projects</div>
        </div>

        <div class="flex flex-row items-center gap-2">
          <div
            class="bg-white p-1 flex flex-row items-center gap-2 border border-gray-100"
          >
            <div
              class="rounded-md pt-1 px-2"
              [ngClass]="{
                'bg-blue-500 text-white': viewMode === 'list',
                'text-gray-500 cursor-pointer': viewMode !== 'list',
              }"
              (click)="viewMode = 'list'"
            >
              <i class="pi pi-list"></i>
            </div>
            <div
              class="rounded-md pt-1 px-2"
              [ngClass]="{
                'bg-blue-500 text-white': viewMode === 'grid',
                'text-gray-500 cursor-pointer': viewMode !== 'grid',
              }"
              (click)="viewMode = 'grid'"
            >
              <i class="pi pi-table"></i>
            </div>
            <div
              class="rounded-md pt-1 px-2"
              [ngClass]="{
                'bg-blue-500 text-white': viewMode === 'calendar',
                'text-gray-500 cursor-pointer': viewMode !== 'calendar',
              }"
              (click)="viewMode = 'calendar'"
            >
              <i class="pi pi-calendar"></i>
            </div>
          </div>

          <p-button
            label="Export"
            icon="pi pi-file-export"
            size="small"
            styleClass="rounded-none! bg-blue-500! border-blue-500! text-white! px-3!"
          ></p-button>
        </div>
      </div>

      <ng-container *ngIf="viewMode === 'grid'">
        <div
          class="mt-3 border border-gray-200 rounded-md tracking-wide bg-white p-5 flex flex-col"
        >
          <div class="flex flex-row items-center justify-between">
            <div class="flex flex-col">
              <div class="text-[20px] text-gray-700 font-semibold">
                Projects
              </div>
              <div class="text-gray-500 text-[15px]">
                Manage and oversee all project activities
              </div>
            </div>
            <div class="flex flex-row items-center gap-2">
              <div class="min-w-[300px] relative">
                <input
                  type="text"
                  pInputText
                  [(ngModel)]="search"
                  class="w-full! text-[15px]!"
                  placeholder="Search by project title"
                  (keyup)="onKeyDown($event)"
                />
                <i
                  class="pi pi-search absolute! top-3! right-2! text-gray-500!"
                ></i>
              </div>
              <p-button
                label="Add New Project"
                (onClick)="ActionClick(null, 'add')"
                icon="pi pi-plus"
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
              stripedRows="false"
              [lazy]="true"
              [showGridlines]="true"
              (onLazyLoad)="NextPage($event)"
            >
              <ng-template #header>
                <tr>
                  <th class="bg-gray-100! text-[15px]! text-center! w-[30%]!">
                    Project
                  </th>
                  <th class="bg-gray-100! text-[15px]! text-center! w-[10%]">
                    Status
                  </th>
                  <th
                    class="bg-gray-100! text-[15px]! text-center! w-[15%]"
                  ></th>
                  <th class="bg-gray-100! text-[15px]! text-center! w-[15%]">
                    Deadline
                  </th>
                  <th class="bg-gray-100! text-[15px]! text-center! w-[15%]">
                    Team
                  </th>

                  <th class="bg-gray-100! text-[15px]! text-center! w-[10%]">
                    Action
                  </th>
                </tr>
              </ng-template>
              <ng-template #body let-data>
                <tr>
                  <td class="text-[14px]!">
                    <div
                      class="flex flex-row gap-3 border-l-5! py-3 pl-4 font-semibold"
                      [ngClass]="{
                        'border-l-blue-300!': data.priority === 'Low',
                        'border-l-yellow-300!': data.priority === 'Medium',
                        'border-l-red-300!': data.priority === 'High',
                      }"
                    >
                      {{ data.projectTitle }}
                    </div>
                  </td>
                  <td class="text-center! text-[14px]!">
                    <div class="flex justify-center items-center">
                      <div
                        class="text-[13px] py-0.5 font-medium px-4 rounded-full w-fit"
                        [ngClass]="{
                          'bg-blue-100 text-blue-500':
                            data.status === 'Planning',
                        }"
                      >
                        {{ data.status }}
                      </div>
                    </div>
                  </td>
                  <td class="text-center! text-[14px]!"></td>
                  <td class="text-center! text-[14px]!">
                    {{ data.dueDate | date: 'dd MMMM, yyyy' }}
                  </td>

                  <td class="text-center! text-[14px]!">
                    <div class="flex -space-x-3 justify-center items-center">
                      <ng-container *ngFor="let member of data.projectMembers">
                        <div
                          [pTooltip]="
                            member.user.firstName + ' ' + member.user.lastName
                          "
                          tooltipPosition="top"
                          class="w-10 h-10 rounded-full border-4 border-gray-200 bg-gray-300 flex items-center justify-center text-black text-[16px] font-semibold relative hover:z-10"
                        >
                          {{ getInitials(member.user.firstName) }}
                        </div>
                      </ng-container>
                    </div>
                  </td>
                  <td class="text-center! border-r! text-[14px]!">
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
        </div></ng-container
      >
      <ng-container *ngIf="viewMode === 'list'">
        <div
          class="flex flex-col gap-3 mt-3 border border-gray-200 rounded-md tracking-wide bg-white px-5 py-3"
        >
          <div class="flex flex-row items-center justify-between">
            <div class="flex flex-col gap-1">
              <div class="font-semibold text-[20px] text-gray-700">
                Projects
              </div>
              <div class="text-gray-500 text-sm tracking-wider">
                Manage and oversee all project activities
              </div>
            </div>
            <div class="flex flex-row gap-2 items-center">
              <p-select
                [(ngModel)]="selectedStatus"
                [options]="[
                  { label: 'All Status', value: null },
                  { label: 'Planning', value: 'Planning' },
                  { label: 'In Progress', value: 'In Progress' },
                  { label: 'Completed', value: 'Completed' },
                  { label: 'On Hold', value: 'On Hold' },
                ]"
                panelStyleClass="text-[14px]!"
                styleClass="text-[14px]!"
                appendTo="body"
                placeholder="Select status"
              ></p-select>
              <p-select
                [(ngModel)]="sortBy"
                [options]="[
                  { label: 'Sort By', value: null },
                  { label: 'Deadline - Earliest', value: 'dueDate asc' },
                  { label: 'Deadline - Latest', value: 'dueDate desc' },
                  { label: 'Progress - Low to High', value: 'progress asc' },
                  { label: 'Progress - High to Low', value: 'progress desc' },
                ]"
                panelStyleClass="text-[14px]!"
                styleClass="text-[14px]!"
                appendTo="body"
                placeholder="Select sort by"
              ></p-select>
            </div>
          </div>
        </div>
        <div class="grid grid-cols-12 gap-3 mt-7">
          <ng-container *ngFor="let data of PagingSignal().data">
            <div
              class="col-span-12 lg:col-span-6 2xl:col-span-4 bg-white border border-gray-200 rounded-md border-l-7 p-3"
              [ngClass]="{
                'border-l-blue-500': data.priority === 'Low',
                'border-l-yellow-500': data.priority === 'Medium',
                'border-l-red-500': data.priority === 'High',
              }"
            >
              <div class="flex flex-row justify-between items-center">
                <div class="font-semibold text-[17px]">
                  {{ data.projectTitle }}
                </div>
                <div
                  (click)="onEllipsisClick($event, data, menu)"
                  class="pi pi-ellipsis-v text-sm! text-gray-500 hover:text-black cursor-pointer"
                ></div>
              </div>
              <div class="text-gray-500 text-[14px] mt-1">
                {{ data.description }}
              </div>

              <div class="border-b border-gray-200 mt-2 mb-2"></div>
              <div class="flex flex-row items-start justify-between">
                <div class="flex flex-col gap-1">
                  <div class="text-[14px] font-medium text-gray-700">
                    Client
                  </div>
                  <div class="text-gray-500 text-[13px]">
                    {{ data.client.name }}
                  </div>
                </div>
                <div class="flex flex-col gap-1 items-end">
                  <div class="text-[14px] font-medium text-gray-700">
                    Deadline
                  </div>
                  <div class="text-[13px] text-gray-500">
                    {{ data.dueDate | date }}
                  </div>
                </div>
              </div>
              <div class="border-b border-gray-200 mt-2 mb-2"></div>
              <div class="flex flex-row justify-between items-center">
                <div
                  class="text-gray-500 text-[13px] tracking-wide flex flex-row items-center gap-1"
                >
                  <div>Current Status:</div>
                  <div
                    class="font-semibold"
                    [ngClass]="{
                      'text-blue-500': data.status === 'In Progress',
                      'text-green-500': data.status === 'Completed',
                      'text-red-500': data.status === 'On Hold',
                      'text-gray-500': data.status === 'Planning',
                    }"
                  >
                    {{ data.status }}
                  </div>
                </div>
                <div class="flex -space-x-3 justify-center items-center">
                  <ng-container *ngFor="let member of data.projectMembers">
                    <div
                      [pTooltip]="member.user.fullName"
                      tooltipPosition="top"
                      class="w-10 h-10 rounded-full border-4 border-gray-200 bg-gray-300 flex items-center justify-center text-black text-[16px] font-semibold relative hover:z-10"
                    >
                      {{ getInitials(member.user.fullName) }}
                    </div>
                  </ng-container>
                </div>
              </div>
            </div>
          </ng-container>
        </div>
      </ng-container>
      <ng-container *ngIf="viewMode === 'calendar'">
        <div
          class="mt-3 bg-white p-5 rounded-md border border-gray-200 shadow-sm"
        >
          <full-calendar
            #calendar
            [options]="calendarOptions"
          ></full-calendar></div
      ></ng-container>
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
          <div class="font-semibold text-[20px]">{{ title }}</div>
          <div class="font-normal tracking-wide text-gray-500 text-[14px]">
            Fill in all required field.
          </div>
          <div
            [formGroup]="FG"
            class="mt-3 grid grid-cols-12 gap-3 text-[15px]"
          >
            <div class="col-span-12 flex flex-col gap-1">
              <div>Project Title <span class="text-red-500">*</span></div>
              <input
                type="text"
                pInputText
                class="w-full! text-[15px]!"
                formControlName="projectTitle"
              />
            </div>

            <div class="col-span-12 flex flex-col gap-1">
              <div>Client</div>
              <p-select
                [options]="clients || []"
                appendTo="body"
                styleClass="text-[15px]!"
                inputStyleClass="text-[15px]!"
                panelStyleClass="text-[15px]!"
                formControlName="clientId"
                [showClear]="FG.get('clientId')?.value"
                [filter]="true"
              ></p-select>
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
              <div>Due Date</div>
              <p-datepicker
                appendTo="body"
                styleClass="text-[15px]! w-full!"
                inputStyleClass="text-[15px]!"
                formControlName="dueDate"
                dateFormat="dd/mm/yy"
                [showIcon]="true"
              ></p-datepicker>
            </div>
            <div class="col-span-12 flex flex-col gap-1">
              <div>Description</div>
              <textarea
                pTextarea
                rows="3"
                cols="30"
                styleClass="text-[15px]!"
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
                      class="pi pi-times-circle text-[12px]!"
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
              styleClass="px-7! text-[14px]! tracking-wide! py-1.5! border-gray-200!"
            >
            </p-button>

            <p-button
              (onClick)="Submit()"
              [label]="isUpdate ? 'Save Changes' : 'Create Project'"
              severity="info"
              styleClass="px-7! text-[14px]! tracking-wide! py-1.5!"
            >
            </p-button>
          </div>
        </div>
      </ng-template>
    </p-dialog> `,
  styleUrl: './project.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Project implements OnInit, OnDestroy {
  @ViewChild('fTable') fTable?: Table;

  private readonly loadingService = inject(LoadingService);
  private readonly messageService = inject(MessageService);
  private readonly projectService = inject(ProjectService);
  private readonly cdr = inject(ChangeDetectorRef);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  PagingSignal = signal<PagingContent<ProjectDto>>(
    {} as PagingContent<ProjectDto>,
  );
  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  visible: boolean = false;
  isUpdate: boolean = false;

  search: string = '';
  viewMode: 'grid' | 'list' | 'calendar' = 'grid';
  title: string = 'Create New Project';
  selectedStatus: string | null = null;
  sortBy: string | null = null;
  FG!: FormGroup;
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
          // Map clients for p-select
          this.clients = res.clients
            .map((c) => ({ label: c.name, value: c.id }))
            .sort((a, b) => a.label.localeCompare(b.label));

          // Map users for p-select
          this.users = res.users
            .map((u) => ({
              label: u.firstName + ' ' + u.lastName,
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
      projectTitle: new FormControl<string | null>(null, [Validators.required]),
      clientId: new FormControl<string | null>(null, Validators.required),
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
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          projectMembers: data.projectMembers?.map((m: any) => m.userId) || [],
        });
      }
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
            ? `Project: ${res.projectTitle} updated successfully.`
            : `Project: ${res.projectTitle} created successfully.`,
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
    this.menuItems = [
      {
        label: 'Edit',
        icon: 'pi pi-pencil',
        command: () => this.ActionClick(project, 'Update'),
      },
    ];

    menu.toggle(event); // toggle the popup menu
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
