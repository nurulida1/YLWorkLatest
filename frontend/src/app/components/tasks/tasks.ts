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
import { LoadingService } from '../../services/loading.service';
import { TaskService } from '../../services/TaskService';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { MenuItem, MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import {
  BuildFilterText,
  BuildSortText,
  GridifyQueryExtend,
  PagingContent,
  ValidateAllFormFields,
} from '../../shared/helpers/helpers';
import { ProjectTaskDto } from '../../models/ProjectTask';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CalendarOptions } from '@fullcalendar/core/index.js';
import dayGridPlugin from '@fullcalendar/daygrid/index.js';
import timeGridPlugin from '@fullcalendar/timegrid/index.js';
import interactionPlugin from '@fullcalendar/interaction/index.js';
import { RouterLink } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { MenuModule } from 'primeng/menu';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ProgressBarModule } from 'primeng/progressbar';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { FullCalendarModule } from '@fullcalendar/angular';

@Component({
  selector: 'app-tasks',
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
    RadioButtonModule,
    ProgressBarModule,
    AvatarModule,
    TooltipModule,
    FullCalendarModule,
  ],
  template: `<div class="w-full min-h-screen flex flex-col p-5">
      <div class="flex flex-row items-center justify-between">
        <div
          class="flex flex-row items-center gap-1 text-gray-500 text-[15px] tracking-wide"
        >
          <div
            class="cursor-pointer hover:text-gray-500"
            [routerLink]="'/dashboard'"
          >
            Dashboard
          </div>
          /
          <div class="text-gray-700 font-semibold">Tasks</div>
        </div>
        <div class="flex flex-row items-center gap-2">
          <div
            class="bg-white p-1 flex flex-row items-center gap-2 border border-gray-200"
          >
            <div
              class="rounded-md pt-1 px-2"
              [ngClass]="{
                'bg-blue text-white': viewMode === 'list',
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
              <div class="text-[20px] text-gray-700 font-semibold">Tasks</div>
              <div class="text-gray-500 text-[15px]">
                Manage and oversee all tasks activities
              </div>
            </div>
            <div class="flex flex-row items-center gap-2">
              <div class="min-w-[300px] relative">
                <input
                  type="text"
                  pInputText
                  class="w-full text-[15px]!"
                  [(ngModel)]="search"
                  placeholder="Search ..."
                  (keyup)="onKeyDown($event)"
                />
                <i
                  class="pi pi-search absolute! top-3! right-2! text-gray-500!"
                ></i>
              </div>
              <p-button
                label="New Task"
                icon="pi pi-plus-circle"
                severity="info"
                size="small"
                styleClass="py-! whitespace-nowrap!"
                (onClick)="ActionClick(null, 'Create')"
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
              [showGridlines]="true"
              [lazy]="true"
              (onLazyLoad)="NextPage($event)"
            >
              <ng-template #header>
                <tr>
                  <th class="bg-gray-100! text-[15px]! text-center! w-[30%]!">
                    Task Name
                  </th>
                  <th class="bg-gray-100! text-[15px]! text-center! w-[20%]!">
                    Assignee
                  </th>
                  <th class="bg-gray-100! text-[15px]! text-center! w-[15%]!">
                    Status
                  </th>
                  <th class="bg-gray-100! text-[15px]! text-center! w-[15%]!">
                    Due Date
                  </th>
                  <th class="bg-gray-100! text-[15px]! text-center! w-[10%]!">
                    Action
                  </th>
                </tr>
              </ng-template>
              <ng-template #body let-data>
                <tr>
                  <td class="text-[15px]">
                    {{ data.jobTitle }}
                  </td>
                  <td class="text-[15px] text-center!"></td>
                  <td class="text-[15px] text-center!">
                    <div>{{ data.status }}</div>
                  </td>
                  <td class="text-[15px] text-center!">
                    {{ data.dueDate | date }}
                  </td>
                  <td class="text-[15px] text-center!">
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
                  <td colspan="100%">
                    <div class="text-gray-500 text-sm text-center">
                      No task found.
                    </div>
                  </td>
                </tr>
              </ng-template>
            </p-table>
          </div>
        </div>
      </ng-container>
    </div>
    <p-menu #menu [model]="menuItems" [popup]="true"></p-menu>

    <p-dialog
      *ngIf="visible"
      [(visible)]="visible"
      [modal]="true"
      [draggable]="false"
      [closable]="true"
      (onHide)="visible = false"
      [style]="{ width: '800px' }"
      styleClass="preview-dialog rounded-xl! overflow-hidden"
      [maskStyle]="{ 'overflow-y': 'auto' }"
      appendTo="body"
    >
      <ng-template #headless>
        <div class="bg-gray-50 px-6 py-4 border-b border-gray-100 flex-none">
          <div class="font-semibold text-[20px]">{{ title }}</div>
          <div class="text-gray-500 text-sm">
            Fill in the form below to manage task details
          </div>
        </div>

        <div class="p-6 flex-1 overflow-y-auto">
          <div [formGroup]="FG" class="grid grid-cols-12 gap-3">
            <div class="col-span-12 flex flex-col gap-1">
              <div>Project</div>
              <p-select
                class="w-full text-[15px]!"
                appendTo="body"
                formControlName="projectId"
                [options]="projectSelection || []"
              />
            </div>
            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
              <div>Task No</div>
              <input
                type="text"
                pInputText
                class="w-full text-[15px]!"
                formControlName="taskNo"
              />
            </div>
            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
              <div>Priority</div>
              <p-select
                class="w-full text-[15px]!"
                appendTo="body"
                formControlName="priority"
                [options]="[
                  { label: 'Low', value: 'Low' },
                  { label: 'Medium', value: 'Medium' },
                  { label: 'High', value: 'High' },
                ]"
              />
            </div>
            <div class="col-span-12 flex flex-col gap-1">
              <div>Job Title</div>
              <input
                type="text"
                pInputText
                class="w-full text-[15px]!"
                formControlName="jobTitle"
              />
            </div>
            <div class="col-span-12 flex flex-col gap-1">
              <div>Description</div>
              <textarea
                pTextarea
                [rows]="3"
                [cols]="30"
                [autoResize]="true"
                class="w-full text-[15px]!"
                formControlName="description"
              ></textarea>
            </div>
            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
              <div>Start Date</div>
              <p-datepicker
                [showIcon]="true"
                appendTo="body"
                styleClass="w-full!"
                class="w-full text-[15px]!"
                formControlName="startDate"
              ></p-datepicker>
            </div>
            <div class="col-span-12 lg:col-span-6 flex flex-col gap-1">
              <div>Due Date</div>
              <p-datepicker
                [showIcon]="true"
                appendTo="body"
                styleClass="w-full!"
                class="w-full text-[15px]!"
                formControlName="dueDate"
              ></p-datepicker>
            </div>
            <div class="col-span-12 flex flex-col gap-1">
              <div>Assign To</div>
              <div class="flex flex-col">
                <p-multiselect
                  [options]="userSelection || []"
                  appendTo="body"
                  [filter]="true"
                  (onChange)="AssignedMemberOnChange($event)"
                  panelStyleClass="text-[15px]!"
                  placeholder="Select team members"
                  selectedItemsLabel="{0} members selected"
                  styleClass="text-[15px]!"
                ></p-multiselect>

                <div class="flex items-center gap-2 mt-3">
                  <ng-container *ngFor="let user of selectedUsers">
                    <div
                      class="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm"
                      [title]="user.label"
                    >
                      {{ user.label.charAt(0) }}
                    </div>
                  </ng-container>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          class="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 flex-none"
        >
          <p-button
            label="Cancel"
            severity="secondary"
            styleClass="border-gray-200!"
            (onClick)="visible = false"
          ></p-button>
          <p-button
            label="Save"
            icon="pi pi-check-circle"
            severity="info"
            (onClick)="Submit()"
          ></p-button>
        </div>
      </ng-template>
    </p-dialog> `,
  styleUrl: './tasks.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tasks implements OnInit, OnDestroy {
  @ViewChild('fTable') fTable?: Table;

  private readonly loadingService = inject(LoadingService);
  private readonly messageService = inject(MessageService);
  private readonly taskService = inject(TaskService);
  private readonly cdr = inject(ChangeDetectorRef);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  PagingSignal = signal<PagingContent<ProjectTaskDto>>(
    {} as PagingContent<ProjectTaskDto>,
  );
  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  visible: boolean = false;
  isUpdate: boolean = false;

  search: string = '';
  viewMode: 'grid' | 'list' | 'calendar' = 'grid';
  title: string = 'Create New Task';
  selectedStatus: string | null = null;
  sortBy: string | null = null;
  FG!: FormGroup;
  menuItems: MenuItem[] = [];
  projectSelection: any[] = [];
  userSelection: any[] = [];
  selectedUsers: any[] = [];

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

  projects: { label: string; value: string }[] = [];
  users: { label: string; value: string }[] = [];

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 10;
    this.Query.Filter = null;
    this.Query.OrderBy = `CreatedAt desc`;
    this.Query.Select = null;
    this.Query.Includes = null;
  }

  getCalendarEvents() {
    if (!this.PagingSignal()?.data) return [];
    return this.PagingSignal().data.map((task) => ({
      taskNo: task.taskNo,
      jobTitle: task.jobTitle,
      startDate: task.startDate,
      dueDate: task.dueDate,
      extendedProps: {
        priority: task.priority,
        status: task.status,
      },
      backgroundColor:
        task.status === 'Completed'
          ? '#10B981'
          : task.status === 'OnHold'
            ? 'EF4444'
            : '#3B82F6',
    }));
  }

  ngOnInit(): void {
    this.getDropdown();
  }

  getDropdown() {
    this.loadingService.start();
    this.taskService
      .GetDropdown()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();
          this.projectSelection = res.projects
            .map((p: any) => ({
              label: p.projectTitle,
              value: p.id,
            }))
            .sort((a: any, b: any) => a.label.localCompare(b.label));

          this.userSelection = res.users.map((u: any) => ({
            label: u.firstName + ' ' + u.lastName,
            value: u.id,
          }));

          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loadingService.stop();
        },
      });
  }

  GetData() {
    this.loadingService.start();
    this.taskService
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

  ActionClick(data: ProjectTaskDto | null, action: string) {
    this.initForm();

    if (action === 'Update') {
      this.isUpdate = true;
      this.title = 'Update Task';
      this.FG.get('id')?.enable();
      if (data) {
        this.FG.patchValue({
          ...data,
          startDate: data.startDate ? new Date(data.startDate) : null,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
        });
      }
    } else {
      this.title = 'Create New Task';
      this.isUpdate = false;
      this.FG.reset();
    }

    this.visible = true;
    this.cdr.detectChanges();
  }

  initForm() {
    this.FG = new FormGroup({
      id: new FormControl<string | null>({ value: null, disabled: true }),
      projectId: new FormControl<string | null>(null, Validators.required),
      taskNo: new FormControl<string | null>(null, Validators.required),
      jobTitle: new FormControl<string | null>(null, Validators.required),
      startDate: new FormControl<Date | null>(null),
      dueDate: new FormControl<Date | null>(null, Validators.required),
      description: new FormControl<string | null>(null),
      priority: new FormControl<string | null>(null),
      assignedToIds: new FormControl<string[]>([]),
      attachments: new FormControl<string[]>([]),
    });
  }

  Submit() {
    ValidateAllFormFields(this.FG);

    if (!this.FG.valid) return;

    this.loadingService.start();

    const request$ = this.isUpdate
      ? this.taskService.Update(this.FG.value)
      : this.taskService.Create(this.FG.value);

    request$.pipe(takeUntil(this.ngUnsubscribe)).subscribe({
      next: (res) => {
        if (this.isUpdate) {
          const index = this.PagingSignal().data.findIndex(
            (x) => x.id === this.FG.get('id')?.value,
          );

          if (index < -1) {
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
            ? `Task: ${res.taskNo} updated successfully.`
            : `Task: ${res.taskNo} created successfully.`,
        });
      },
      error: (err) => {
        this.loadingService.stop();
        this.messageService.add({
          severity: 'error',
          summary: this.isUpdate ? 'Update Failed' : 'Creation Failed',
          detail: err?.error?.message || 'Something went wrong.',
        });
      },
    });
  }

  onEllipsisClick(event: any, task: any, menu: any) {
    this.menuItems = [
      {
        label: 'Edit',
        icon: 'pi pi-pencil',
        command: () => this.ActionClick(task, 'Update'),
      },
    ];
    menu.toggle(event);
  }

  AssignedMemberOnChange(event: any) {
    this.FG.get('assignedToIds')?.patchValue(event.value);
    this.selectedUsers.push(event.itemValue);
    console.log(this.FG.value);
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
