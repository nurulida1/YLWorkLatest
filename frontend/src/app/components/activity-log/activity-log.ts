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
import { PaginatorModule } from 'primeng/paginator';
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
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TableModule,
    ButtonModule,
    InputTextModule,
    PaginatorModule,
  ],
  template: `
    <div class="activity-page">
      <!-- Breadcrumb -->
      <nav class="breadcrumb">
        <a routerLink="/dashboard">
          <i class="pi pi-home"></i>
          <span>Dashboard</span>
        </a>

        <i class="pi pi-angle-right separator"></i>

        <span class="current">Activity Log</span>
      </nav>

      <!-- Page Header -->
      <section class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <i class="pi pi-history"></i>
          </div>

          <div class="header-text">
            <h1>Activity Log</h1>
            <p>Track and monitor activities performed throughout the system.</p>
          </div>
        </div>

        <button
          pButton
          type="button"
          icon="pi pi-refresh"
          label="Refresh"
          class="refresh-button"
          severity="secondary"
          (click)="ResetTable()"
        ></button>
      </section>

      <!-- Summary Cards -->
      <section class="summary-grid">
        <div class="summary-card">
          <div class="summary-icon total-icon">
            <i class="pi pi-history"></i>
          </div>

          <div class="summary-content">
            <span class="summary-label">Total Activities</span>
            <strong>{{ PagingSignal().totalElements }}</strong>
            <small>Recorded activities</small>
          </div>
        </div>

        <div class="summary-card">
          <div class="summary-icon displayed-icon">
            <i class="pi pi-list"></i>
          </div>

          <div class="summary-content">
            <span class="summary-label">Activities Displayed</span>
            <strong>{{ PagingSignal().data.length }}</strong>
            <small>Activities on this page</small>
          </div>
        </div>
      </section>

      <!-- Activity Section -->
      <section class="activity-section">
        <!-- Section Header -->
        <div class="section-header">
          <div>
            <h2>System Activities</h2>
            <p>View the latest activities recorded in the system.</p>
          </div>

          <div class="search-container">
            <i class="pi pi-search search-icon"></i>

            <input
              pInputText
              type="text"
              [(ngModel)]="search"
              placeholder="Search activities..."
              (keyup)="onKeyDown($event)"
            />

            @if (search) {
              <button
                type="button"
                class="clear-search"
                aria-label="Clear search"
                (click)="ResetTable()"
              >
                <i class="pi pi-times"></i>
              </button>
            }
          </div>
        </div>

        <!-- Desktop Table -->
        <div class="desktop-table">
          <p-table
            #fTable
            [value]="PagingSignal().data"
            [paginator]="true"
            [rows]="Query.PageSize"
            [first]="(Query.Page - 1) * Query.PageSize"
            [totalRecords]="PagingSignal().totalElements"
            [rowsPerPageOptions]="[10, 20, 30, 50]"
            [lazy]="true"
            [showGridlines]="false"
            [rowHover]="true"
            (onLazyLoad)="NextPage($event)"
            styleClass="activity-table"
          >
            <ng-template #header>
              <tr>
                <th class="number-column">No.</th>
                <th class="activity-column">Activity</th>
                <th>Description</th>
                <th class="user-column">Performed By</th>
                <th class="date-column">Date & Time</th>
              </tr>
            </ng-template>

            <ng-template #body let-data let-rowIndex="rowIndex">
              <tr>
                <td class="number-cell">
                  {{ (Query.Page - 1) * Query.PageSize + rowIndex + 1 }}
                </td>

                <td>
                  <div class="activity-name">
                    <div
                      class="activity-badge"
                      [ngClass]="GetColorClass(data.color)"
                    >
                      <i [class]="data.icon || 'pi pi-history'"></i>
                    </div>

                    <span>{{ data.title || 'Activity' }}</span>
                  </div>
                </td>

                <td>
                  <span class="description-text">
                    {{ data.description || '-' }}
                  </span>
                </td>

                <td>
                  <div class="user-info">
                    <div class="user-avatar">
                      <i class="pi pi-user"></i>
                    </div>

                    <span>{{ data.user || 'System' }}</span>
                  </div>
                </td>

                <td>
                  <div class="date-info">
                    <span class="date-main">
                      {{ data.date | date: 'dd MMM yyyy' }}
                    </span>

                    <span class="date-time">
                      <i class="pi pi-clock"></i>
                      {{ data.date | date: 'hh:mm a' }}
                    </span>
                  </div>
                </td>
              </tr>
            </ng-template>

            <ng-template #emptymessage>
              <tr>
                <td colspan="5">
                  <div class="empty-state">
                    <div class="empty-icon">
                      <i class="pi pi-inbox"></i>
                    </div>

                    <strong>No activities found</strong>
                    <span>
                      There are no activity records matching your search.
                    </span>
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>

        <!-- Mobile Activity Cards -->
        <div class="mobile-activity-list">
          @if (PagingSignal().data.length > 0) {
            @for (data of PagingSignal().data; track $index; let i = $index) {
              <article class="mobile-activity-card">
                <div class="mobile-card-top">
                  <div
                    class="activity-badge"
                    [ngClass]="GetColorClass(data.color)"
                  >
                    <i [class]="data.icon || 'pi pi-history'"></i>
                  </div>

                  <div class="mobile-activity-content">
                    <div class="mobile-activity-title">
                      {{ data.title || 'Activity' }}
                    </div>

                    <div class="mobile-activity-description">
                      {{ data.description || '-' }}
                    </div>
                  </div>
                </div>

                <div class="mobile-card-divider"></div>

                <div class="mobile-card-footer">
                  <div class="mobile-user">
                    <i class="pi pi-user"></i>
                    <span>{{ data.user || 'System' }}</span>
                  </div>

                  <div class="mobile-date">
                    <span>
                      {{ data.date | date: 'dd MMM yyyy' }}
                    </span>
                    <span class="mobile-time">
                      {{ data.date | date: 'hh:mm a' }}
                    </span>
                  </div>
                </div>

                <span class="mobile-record-number">
                  #{{ (Query.Page - 1) * Query.PageSize + i + 1 }}
                </span>
              </article>
            }
          } @else {
            <div class="empty-state mobile-empty">
              <div class="empty-icon">
                <i class="pi pi-inbox"></i>
              </div>

              <strong>No activities found</strong>
              <span> There are no activity records matching your search. </span>
            </div>
          }

          <!-- Mobile Pagination -->
          @if (PagingSignal().totalElements > 0) {
            <p-paginator
              [first]="(Query.Page - 1) * Query.PageSize"
              [rows]="Query.PageSize"
              [totalRecords]="PagingSignal().totalElements"
              [rowsPerPageOptions]="[10, 20, 30]"
              (onPageChange)="OnMobilePage($event)"
              styleClass="mobile-paginator"
            ></p-paginator>
          }
        </div>
      </section>
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

  protected ngUnsubscribe = new Subject<void>();

  PagingSignal = signal<PagingContent<ActivityLogDto>>({
    data: [],
    totalElements: 0,
  } as PagingContent<ActivityLogDto>);

  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  search = '';

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

  OnMobilePage(event: { first?: number | null; rows?: number | null }): void {
    if (event.rows) {
      this.Query.PageSize = event.rows;
      this.Query.Page = Math.floor((event.first ?? 0) / event.rows) + 1;
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
      blue: 'activity-blue',
      green: 'activity-green',
      red: 'activity-red',
      orange: 'activity-orange',
      yellow: 'activity-yellow',
      purple: 'activity-purple',
      gray: 'activity-gray',
      grey: 'activity-gray',
      pink: 'activity-pink',
      indigo: 'activity-indigo',
    };

    return colors[color?.toLowerCase()] ?? colors['blue'];
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
