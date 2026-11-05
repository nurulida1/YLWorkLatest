import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';

import { LoadingService } from '../../services/loading.service';
import { ActivityLogService } from '../../services/ActivityLogService';

import {
  GridifyQueryExtend,
  PagingContent,
} from '../../shared/helpers/helpers';

interface ActivityLogDto {
  title: string;
  description: string;
  user: string;
  date: Date | string | null;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-activity-log',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TableModule,
    ButtonModule,
    InputTextModule,
  ],
  template: `
    <div class="w-full flex flex-col p-5">
      <!-- Breadcrumb -->
      <div class="flex flex-row items-center gap-1 text-gray-500 tracking-wide">
        <div
          class="cursor-pointer hover:text-gray-600"
          [routerLink]="'/dashboard'"
        >
          Dashboard
        </div>
        /
        <div class="text-gray-700 font-semibold">Activity Log</div>
      </div>

      <!-- Main Container -->
      <div
        class="mt-3 border border-gray-200 rounded-md tracking-wide bg-white p-5 flex flex-col"
      >
        <!-- Header -->
        <div
          class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3"
        >
          <div class="flex flex-col">
            <div class="text-[20px] text-gray-700 font-semibold">
              Activity Log
            </div>

            <div class="text-gray-500">
              Track and monitor activities performed throughout the system.
            </div>
          </div>

          <div class="flex flex-row items-center gap-2">
            <!-- Search -->
            <div class="min-w-[250px] relative">
              <input
                type="text"
                pInputText
                [(ngModel)]="search"
                class="w-full!"
                placeholder="Search activity"
                (keyup)="onKeyDown($event)"
              />

              <i
                class="pi pi-search absolute! top-3! right-2! text-gray-500!"
              ></i>
            </div>

            <p-button
              label="Refresh"
              icon="pi pi-refresh"
              severity="secondary"
              (onClick)="ResetTable()"
              styleClass="py-2! whitespace-nowrap!"
            ></p-button>
          </div>
        </div>

        <!-- Summary -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
          <div
            class="border border-gray-200 rounded-lg p-4 flex items-center gap-3"
          >
            <div
              class="w-11 h-11 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center"
            >
              <i class="pi pi-history text-lg"></i>
            </div>

            <div>
              <div class="text-sm text-gray-500">Total Activities</div>
              <div class="text-xl font-bold text-gray-700">
                {{ PagingSignal().totalElements }}
              </div>
            </div>
          </div>

          <div
            class="border border-gray-200 rounded-lg p-4 flex items-center gap-3"
          >
            <div
              class="w-11 h-11 rounded-full bg-green-100 text-green-700 flex items-center justify-center"
            >
              <i class="pi pi-list text-lg"></i>
            </div>

            <div>
              <div class="text-sm text-gray-500">Activities Displayed</div>
              <div class="text-xl font-bold text-gray-700">
                {{ PagingSignal().data.length }}
              </div>
            </div>
          </div>
        </div>

        <!-- Table -->
        <div class="mt-5">
          <p-table
            #fTable
            [value]="PagingSignal().data"
            [paginator]="true"
            [rows]="Query.PageSize"
            [totalRecords]="PagingSignal().totalElements"
            [tableStyle]="{ 'min-width': '60rem' }"
            [rowsPerPageOptions]="[10, 20, 30, 50]"
            [lazy]="true"
            [showGridlines]="true"
            (onLazyLoad)="NextPage($event)"
          >
            <!-- Header -->
            <ng-template #header>
              <tr>
                <th class="bg-gray-100! text-center! w-[5%]!">No.</th>

                <th class="bg-gray-100! w-[20%]!">Activity</th>

                <th class="bg-gray-100! w-[30%]!">Description</th>

                <th class="bg-gray-100! text-center! w-[15%]!">User</th>

                <th class="bg-gray-100! text-center! w-[20%]!">Date & Time</th>
              </tr>
            </ng-template>

            <!-- Body -->
            <ng-template #body let-data let-rowIndex="rowIndex">
              <tr>
                <!-- Number -->
                <td class="text-center!">
                  {{ (Query.Page - 1) * Query.PageSize + rowIndex + 1 }}
                </td>

                <!-- Activity -->
                <td>
                  <span class="font-semibold text-gray-700">
                    {{ data.title }}
                  </span>
                </td>

                <!-- Description -->
                <td>
                  <div class="text-gray-600">
                    {{ data.description }}
                  </div>
                </td>

                <!-- User -->
                <td class="text-center!">
                  <div class="flex items-center justify-center gap-2">
                    <i class="pi pi-user text-gray-400"></i>

                    <span class="text-gray-600">
                      {{ data.user || 'System' }}
                    </span>
                  </div>
                </td>

                <!-- Date -->
                <td class="text-center!">
                  <div class="flex flex-col">
                    <span class="text-sm text-gray-700">
                      {{ data.date | date: 'dd/MM/yyyy' }}
                    </span>

                    <span class="text-xs text-gray-400">
                      {{ data.date | date: 'hh:mm a' }}
                    </span>
                  </div>
                </td>
              </tr>
            </ng-template>

            <!-- Empty Message -->
            <ng-template #emptymessage>
              <tr>
                <td colspan="100%" class="border-x!">
                  <div class="text-center text-gray-500 py-3">
                    No activity found in records.
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      </div>
    </div>
  `,
  styleUrl: './activity-log.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityLog implements OnInit, OnDestroy {
  @ViewChild('fTable') fTable?: Table;

  private readonly loadingService = inject(LoadingService);
  private readonly activityLogService = inject(ActivityLogService);
  private readonly messageService = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  PagingSignal = signal<PagingContent<ActivityLogDto>>({
    data: [],
    totalElements: 0,
  } as PagingContent<ActivityLogDto>);

  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  search: string = '';

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 10;
    this.Query.Filter = null;
    this.Query.OrderBy = 'CreatedAt desc';
    this.Query.Select = null;
    this.Query.Includes = null;
  }

  ngOnInit(): void {
    this.GetData();
  }

  GetData(): void {
    this.loadingService.start();

    this.activityLogService
      .GetMany(this.Query)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.PagingSignal.set(
            res as unknown as PagingContent<ActivityLogDto>,
          );

          this.loadingService.stop();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loadingService.stop();

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail:
              err.message || 'An error occurred while fetching activity logs.',
          });

          this.cdr.markForCheck();
        },
      });
  }

  NextPage(event: TableLazyLoadEvent): void {
    if ((event?.first || event?.first === 0) && event?.rows) {
      this.Query.Page = event.first / event.rows + 1 || 1;
      this.Query.PageSize = event.rows;
    }

    this.Query.OrderBy = 'CreatedAt desc';

    this.GetData();
  }

  onKeyDown(event: KeyboardEvent): void {
    const isEnter = event.key === 'Enter';
    const isBackspaceClear = event.key === 'Backspace' && this.search === '';

    if (isEnter) {
      this.Search(this.search);
    } else if (isBackspaceClear) {
      this.Search('');
    }
  }

  Search(data: string): void {
    this.Query.Filter = data.trim() || null;

    if (this.fTable != null) {
      this.fTable.first = 0;
    }

    this.Query.Page = 1;
    this.GetData();
  }

  ResetTable(): void {
    this.search = '';
    this.Query.Filter = null;
    this.Query.Page = 1;

    if (this.fTable) {
      this.fTable.first = 0;
    }

    this.GetData();
  }

  GetColorClass(color: string): string {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-700',
      green: 'bg-green-100 text-green-700',
      red: 'bg-red-100 text-red-700',
      orange: 'bg-orange-100 text-orange-700',
      yellow: 'bg-yellow-100 text-yellow-700',
      purple: 'bg-purple-100 text-purple-700',
      gray: 'bg-gray-100 text-gray-700',
      grey: 'bg-gray-100 text-gray-700',
      pink: 'bg-pink-100 text-pink-700',
      indigo: 'bg-indigo-100 text-indigo-700',
    };

    return colors[color?.toLowerCase()] ?? colors['blue'];
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
