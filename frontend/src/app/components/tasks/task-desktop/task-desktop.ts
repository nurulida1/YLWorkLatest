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
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { LoadingService } from '../../../services/loading.service';
import { ProjectTaskService } from '../../../services/ProjectTaskService';
import { Subject, takeUntil } from 'rxjs';
import { ProjectTaskDto } from '../../../models/ProjectTask';
import {
  PagingContent,
  GridifyQueryExtend,
  BuildFilterText,
  BuildSortText,
} from '../../../shared/helpers/helpers';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-task-desktop',
  imports: [
    CommonModule,
    InputTextModule,
    FormsModule,
    ButtonModule,
    TableModule,
    RouterLink,
    TooltipModule,
  ],
  template: `<div class="w-full flex flex-col p-6">
    <div class="flex flex-row items-end justify-between">
      <div class="flex flex-col">
        <div class="text-3xl font-semibold">Task Board</div>
        <span class="text-gray-500 tracking-wider"
          >Manage and track institutional project progress and client
          delivery.</span
        >
      </div>

      <div class="flex flex-row gap-2">
        <p-button
          (onClick)="ExportToExcel()"
          label="Export"
          icon="pi pi-download"
          severity="secondary"
          styleClass="text-sm! border-gray-300! px-4! rounded-sm!"
        ></p-button>
        <p-button
          [routerLink]="'form'"
          label="Add New Task"
          icon="pi pi-plus"
          severity="secondary"
          styleClass="text-sm! border-none! bg-blue-900! text-white! text-shadow-lg! px-4! rounded-sm!"
        ></p-button>
      </div>
    </div>

    <div class="mt-4 grid grid-cols-12 gap-3 justify-between">
      <div
        class="p-5 flex flex-row gap-3 items-center col-span-3 bg-white border border-gray-200"
      >
        <div class="w-10 h-10 bg-blue-100 flex items-center justify-center p-2">
          <i class="pi pi-list text-blue-900! text-lg!"></i>
        </div>
        <div class="flex flex-col">
          <div class="uppercase text-gray-500 font-semibold text-sm">
            Total Task
          </div>
          <div class="font-bold text-3xl">{{ taskCounts?.totalTask }}</div>
        </div>
      </div>
      <div
        class="p-5 flex flex-row gap-3 items-center col-span-3 bg-white border border-gray-200"
      >
        <div class="w-10 h-10 bg-blue-100 flex items-center justify-center p-2">
          <i class="pi pi-file-check text-blue-900! text-lg!"></i>
        </div>
        <div class="flex flex-col">
          <div class="uppercase text-gray-500 font-semibold text-sm">
            In Progress
          </div>
          <div class="font-bold text-3xl">{{ taskCounts?.inProgress }}</div>
        </div>
      </div>
      <div
        class="p-5 flex flex-row gap-3 items-center col-span-3 bg-white border border-gray-200"
      >
        <div class="w-10 h-10 bg-blue-100 flex items-center justify-center p-2">
          <i class="pi pi-list-check text-blue-900! text-lg!"></i>
        </div>
        <div class="flex flex-col">
          <div class="uppercase text-gray-500 font-semibold text-sm">
            Under Review
          </div>
          <div class="font-bold text-3xl">{{ taskCounts?.underReview }}</div>
        </div>
      </div>
      <div
        class="p-5 flex flex-row gap-3 items-center col-span-3 bg-white border border-gray-200"
      >
        <div class="w-10 h-10 bg-red-100 flex items-center justify-center p-2">
          <i class="pi pi-exclamation-circle text-red-900! text-lg!"></i>
        </div>
        <div class="flex flex-col">
          <div class="uppercase text-gray-500 font-semibold text-sm">
            Critical Priority
          </div>
          <div class="font-bold text-3xl">
            {{ taskCounts?.criticalPriority }}
          </div>
        </div>
      </div>
    </div>

    <div class="mt-4">
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
      >
        <ng-template #header>
          <tr>
            <th
              pSortableColumn="Title"
              class="bg-blue-100! uppercase! text-sm! border-b! border-gray-300! w-[30%]!"
            >
              <div class="flex flex-row items-center gap-2">
                <div>Task</div>
                <p-sortIcon field="Title" class="mt-1" />
              </div>
            </th>
            <th
              class="bg-blue-100! uppercase! text-sm! border-b! border-gray-300! w-[20%]!"
            >
              Project
            </th>
            <th
              class="bg-blue-100! uppercase! text-sm! border-b! border-gray-300! w-[20%]!"
            >
              Assignee
            </th>
            <th
              pSortableColumn="DueDate"
              class="text-center! bg-blue-100! uppercase! text-sm! border-b! border-gray-300! w-[10%]!"
            >
              <div class="flex flex-row justify-center items-center gap-2">
                <div>Due Date</div>
                <p-sortIcon field="DueDate" class="mt-1" />
              </div>
            </th>
            <th
              pSortableColumn="Priority"
              class="text-center! bg-blue-100! uppercase! text-sm! border-b! border-gray-300! w-[10%]!"
            >
              <div class="flex flex-row justify-center items-center gap-2">
                <div>Priority</div>
                <p-sortIcon field="Priority" class="mt-1" />
              </div>
            </th>
            <th
              pSortableColumn="Status"
              class="text-center! bg-blue-100! uppercase! text-sm! border-b! border-gray-300! w-[15%]!"
            >
              <div class="flex flex-row justify-center items-center gap-2">
                <div>Status</div>
                <p-sortIcon field="Status" class="mt-1" />
              </div>
            </th>
            <th
              class="text-center! bg-blue-100! uppercase! text-sm! border-b! border-gray-300! w-[10%]!"
            >
              Action
            </th>
          </tr>
        </ng-template>
        <ng-template #body let-data>
          <tr class="hover:bg-gray-50 transition">
            <td>
              <div class="flex flex-col gap-1">
                <div class="font-semibold text-gray-800">
                  {{ data.title }}
                </div>

                <div class="text-xs text-gray-400">
                  {{ data.taskCode }}
                </div>
              </div>
            </td>

            <td class="max-w-xs">
              @if (data?.project) {
                <span
                  class="inline-block max-w-[250px] truncate px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm"
                  [pTooltip]="data.project.projectTitle"
                  tooltipPosition="top"
                >
                  {{ data.project.projectTitle }}
                </span>
              } @else {
                <span class="text-gray-400 text-sm"> No Project </span>
              }
            </td>

            <td>
              @if (data.assignedTaskMembers?.length) {
                <div class="flex items-center">
                  @for (
                    member of data.assignedTaskMembers;
                    track member.userId
                  ) {
                    <div
                      class="w-9 h-9 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-sm font-semibold border-2 border-white -ml-2 first:ml-0"
                      pTooltip="{{ member?.name }}"
                      tooltipPosition="top"
                    >
                      {{ getInitials(member?.name) }}
                    </div>
                  }
                </div>
              } @else {
                <span class="text-gray-400 text-sm"> Unassigned </span>
              }
            </td>

            <td>
              <div class="flex items-center justify-center">
                @if (data.dueDate) {
                  <div class="flex items-center gap-2 text-gray-600">
                    <i class="pi pi-calendar text-gray-400"></i>

                    {{ data.dueDate | date: 'dd/MM/yyyy' }}
                  </div>
                } @else {
                  <span class="text-gray-400"> - </span>
                }
              </div>
            </td>

            <td>
              <div class="flex items-center justify-center">
                @switch (data.priority) {
                  @case ('High') {
                    <span
                      class="px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-medium"
                    >
                      High
                    </span>
                  }

                  @case ('Medium') {
                    <span
                      class="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-sm font-medium"
                    >
                      Medium
                    </span>
                  }

                  @case ('Low') {
                    <span
                      class="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium"
                    >
                      Low
                    </span>
                  }

                  @default {
                    <span
                      class="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm"
                    >
                      {{ data.priority }}
                    </span>
                  }
                }
              </div>
            </td>

            <td>
              <div class="flex items-center justify-center">
                @switch (data.status) {
                  @case ('Completed') {
                    <span
                      class="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium"
                    >
                      Completed
                    </span>
                  }

                  @case ('InProgress') {
                    <span
                      class="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium"
                    >
                      In Progress
                    </span>
                  }

                  @case ('NotStarted') {
                    <span
                      class="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm font-medium"
                    >
                      Not Started
                    </span>
                  }

                  @default {
                    <span
                      class="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm"
                    >
                      {{ data.status }}
                    </span>
                  }
                }
              </div>
            </td>
            <td>
              <div class="flex items-center justify-center gap-2">
                <button
                  type="button"
                  class="w-8 h-8 rounded-full hover:bg-blue-50 text-blue-600 transition"
                  pTooltip="Edit Task"
                  tooltipPosition="top"
                  [routerLink]="'/tasks/form'"
                  [queryParams]="{ id: data.id }"
                >
                  <i class="pi pi-pencil"></i>
                </button>

                <button
                  type="button"
                  class="w-8 h-8 rounded-full hover:bg-red-50 text-red-500 transition"
                  pTooltip="Delete Task"
                  tooltipPosition="top"
                  (click)="DeleteTask(data)"
                >
                  <i class="pi pi-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        </ng-template>
        <ng-template #emptymessage>
          <tr>
            <td colspan="100%">
              <div class="text-center!">No data</div>
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  </div>`,
  styleUrl: './task-desktop.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDesktop implements OnInit, OnDestroy {
  @ViewChild('fTable') fTable?: Table;

  private readonly loadingService = inject(LoadingService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly projectTaskService = inject(ProjectTaskService);
  private readonly messageService = inject(MessageService);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  PagingSignal = signal<PagingContent<ProjectTaskDto>>(
    {} as PagingContent<ProjectTaskDto>,
  );
  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  search: string = '';
  taskCounts: any;

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 10;
    this.Query.OrderBy = 'TaskCode';
    this.Query.Includes = null;
    this.Query.Filter = null;
  }

  ngOnInit(): void {
    this.GetCounts();
  }

  GetCounts() {
    this.projectTaskService
      .GetCounts()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.taskCounts = res;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error(err);
        },
      });
  }

  GetData() {
    this.loadingService.start();
    this.projectTaskService
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
    this.Query.OrderBy = sortText ? sortText : 'TaskCode';

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
      TaskCode: [
        {
          value: data,
          matchMode: '=',
          operator: 'and',
        },
      ],
      Title: [
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

  getInitials(name: string | undefined | null) {
    if (!name) return '';

    return name
      .split(' ')
      .filter((n) => n)
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }

  DeleteTask(data: any) {
    this.loadingService.start();
    this.projectTaskService
      .Delete(data.id)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();
          this.messageService.add({
            severity: 'success',
            summary: 'Deleted',
            detail: res?.message || 'Task deleted successfully',
          });

          this.PagingSignal.update((state) => ({
            ...state,
            data: state.data.filter((d: any) => d.id !== data.id),
          }));

          this.cdr.markForCheck();
        },
        error: (err: any) => {
          this.loadingService.stop();

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail:
              err.error?.error || err.error?.message || 'Failed to delete task',
          });
        },
      });
  }

  ExportToExcel() {
    this.projectTaskService.ExportToExcel().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;

        const fileName = `TASK_${new Date().getTime()}.xlsx`;

        link.download = fileName;
        link.click();

        window.URL.revokeObjectURL(url);
      },
    });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
