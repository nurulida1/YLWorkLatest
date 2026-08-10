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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { LoadingService } from '../../../services/loading.service';
import { MenuItem } from 'primeng/api';
import { ProjectService } from '../../../services/ProjectService';
import { Subject, takeUntil } from 'rxjs';
import {
  BuildFilterText,
  BuildSortText,
  GridifyQueryExtend,
  PagingContent,
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
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
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
          <i class="pi pi-chevron-right text-[8px]! text-gray-500!"></i>
          <div class="text-gray-700 font-semibold">Projects</div>
        </div>
      </div>
      <div
        class="mt-3 border border-gray-200 rounded-md tracking-wide bg-white p-5 flex flex-col"
      >
        <div class="flex flex-row items-center justify-between">
          <div class="flex flex-col">
            <div class="text-[20px] text-gray-700 font-semibold">Projects</div>
            <div class="text-gray-500">
              Manage and monitor precision engineering project lifecycles.
            </div>
          </div>
          <p-button
            label="New Project"
            icon="pi pi-plus"
            severity="info"
            styleClass="tracking-wide! bg-blue-700! border-none! rounded-none! py-2! px-5!"
            [routerLink]="'/projects/form'"
          ></p-button>
        </div>
        <div class="flex flex-row items-center gap-2 mt-3">
          <div class="flex-1 flex flex-row relative">
            <input
              type="text"
              pInputText
              [(ngModel)]="search"
              class="pl-8! w-full!"
              placeholder="Search by project code, or name ..."
              (keyup)="onKeyDown($event)"
            />
            <i
              class="pi pi-search absolute! top-3.5! left-2! text-gray-500!"
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
            [tableStyle]="{ 'min-width': '80rem' }"
            [rowsPerPageOptions]="[10, 20, 30, 50]"
            [showGridlines]="true"
            [lazy]="true"
            (onLazyLoad)="NextPage($event)"
            ><ng-template #header>
              <tr>
                <th
                  pSortableColumn="ProjectCode"
                  class="bg-gray-100! text-center! w-[15%]!"
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
                  <div class="flex flex-row items-center gap-2">
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
                <th class="bg-gray-100! w-[25%]!">Client</th>
                <th class="bg-gray-100! text-center! w-[15%]!">Timeline</th>

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
                <td class="bg-white!">
                  {{ data.projectTitle }}
                </td>
                <td class="text-center! bg-white!">
                  <div
                    class="px-2 rounded-full border"
                    [ngClass]="{
                      'bg-yellow-100 text-yellow-600':
                        data.priority === 'Medium',
                      'bg-blue-100 text-blue-600': data.priority === 'Low',
                      'bg-red-100 text-red-600 animate-pulse':
                        data.priority === 'High',
                    }"
                  >
                    {{ data.priority }}
                  </div>
                </td>
                <td class="bg-white!">
                  {{ data.client.name }}
                </td>
                <td class="text-center! bg-white!">
                  {{ data.startDate | date: 'dd/MM/yyyy' }} -
                  {{ data.estimatedCompletedDate | date: 'dd/MM/yyyy' }}
                </td>

                <td class="text-center! bg-white!">
                  <div
                    class="px-2 rounded-full border flex flex-row justify-center gap-3 items-center"
                    [ngClass]="{
                      'bg-amber-100 text-amber-600': data.status === 'Draft',
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
    <p-menu #menu [model]="menuItems" [popup]="true"></p-menu> `,
  styleUrl: './project.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Project implements OnInit, OnDestroy {
  @ViewChild('fTable') fTable?: Table;

  private readonly loadingService = inject(LoadingService);
  private readonly projectService = inject(ProjectService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  PagingSignal = signal<PagingContent<ProjectDto>>(
    {} as PagingContent<ProjectDto>,
  );
  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  search: string = '';
  viewMode: 'grid' | 'list' | 'calendar' = 'grid';
  title: string = 'Create New Project';
  selectedStatus: string | null = null;
  sortBy: string | null = null;
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

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 10;
    this.Query.Filter = null;
    this.Query.OrderBy = `CreatedAt desc`;
    this.Query.Select = null;
    this.Query.Includes = null;
  }

  ngOnInit(): void {}

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
    if (action === 'Edit') {
      this.router.navigate(['/projects/form'], {
        queryParams: { id: data?.id },
      });
    }
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
    if (!name) return '';
    return name
      .split(' ')
      .filter((n) => n)
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
