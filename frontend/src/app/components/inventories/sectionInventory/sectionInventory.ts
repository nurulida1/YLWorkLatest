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
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { FilterMetadata, MenuItem, MessageService } from 'primeng/api';
import { Observable, Subject, takeUntil } from 'rxjs';

import { LoadingService } from '../../../services/loading.service';
import { SectionInventoryService } from '../../../services/SectionCategoryService';
import {
  BuildFilterText,
  BuildSortText,
  GridifyQueryExtend,
  PagingContent,
} from '../../../shared/helpers/helpers';
import { BaseOption } from '../../../models/BaseModel';

@Component({
  selector: 'app-section-inventory',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    InputTextModule,
    FormsModule,
    RouterLink,
    TableModule,
    MenuModule,
    DialogModule,
  ],
  template: `
    <div class="section-page">
      <!-- PAGE HEADER -->
      <div class="page-header">
        <div class="page-heading">
          <div class="breadcrumb">
            <a routerLink="/dashboard">Dashboard</a>
            <i class="pi pi-angle-right"></i>
            <span>Inventory</span>
            <i class="pi pi-angle-right"></i>
            <strong>Sections</strong>
          </div>

          <div class="heading-content">
            <div class="heading-icon">
              <i class="pi pi-th-large"></i>
            </div>

            <div>
              <h1>Inventory Sections</h1>
              <p>Manage and organize your inventory sections in one place.</p>
            </div>
          </div>
        </div>

        <div class="header-actions">
          <button
            type="button"
            class="btn-refresh"
            (click)="ResetTable()"
            [disabled]="loading"
          >
            <i class="pi pi-refresh"></i>
            Refresh
          </button>

          <button
            type="button"
            class="btn-add"
            (click)="ActionClick(null, 'add')"
          >
            <i class="pi pi-plus"></i>
            Add Section
          </button>
        </div>
      </div>

      <!-- MAIN CONTENT -->
      <div class="content-card">
        <!-- CONTENT HEADER -->
        <div class="content-header">
          <div>
            <h2>Section Management</h2>
            <p>View, search and maintain your inventory sections.</p>
          </div>

          <div class="record-count">
            <i class="pi pi-database"></i>
            {{ PagingSignal().totalElements || 0 }} records
          </div>
        </div>

        <!-- SEARCH -->
        <div class="toolbar">
          <div class="search-wrapper">
            <i class="pi pi-search"></i>

            <input
              type="text"
              pInputText
              placeholder="Search section by name..."
              [(ngModel)]="search"
              (keyup)="onKeyDown($event)"
              (input)="onSearchInput()"
            />

            @if (search) {
              <button
                type="button"
                class="clear-search"
                (click)="Search('')"
                title="Clear search"
              >
                <i class="pi pi-times"></i>
              </button>
            }
          </div>

          <button type="button" class="btn-reset" (click)="ResetTable()">
            <i class="pi pi-filter-slash"></i>
            Reset
          </button>
        </div>

        <!-- TABLE -->
        <div class="table-container">
          <p-table
            #fTable
            [value]="PagingSignal().data || []"
            [paginator]="true"
            [rows]="Query.PageSize"
            [totalRecords]="PagingSignal().totalElements"
            [tableStyle]="{ 'min-width': '600px' }"
            [rowsPerPageOptions]="[10, 20, 30, 50]"
            [stripedRows]="true"
            [showGridlines]="false"
            [lazy]="true"
            (onLazyLoad)="NextPage($event)"
            styleClass="section-table"
          >
            <ng-template #header>
              <tr>
                <th class="name-column">
                  <div class="table-heading">
                    <i class="pi pi-th-large"></i>
                    Section Name
                  </div>
                </th>

                <th class="action-column">Actions</th>
              </tr>
            </ng-template>

            <ng-template #body let-data let-rowIndex="rowIndex">
              <tr>
                <td>
                  <div class="section-name-cell">
                    <div class="section-avatar">
                      <i class="pi pi-folder"></i>
                    </div>

                    <div class="section-name-content">
                      <strong>{{ data.name }}</strong>
                      <small>Inventory Section</small>
                    </div>
                  </div>
                </td>

                <td>
                  <div class="row-actions">
                    <button
                      type="button"
                      class="icon-action edit-action"
                      title="Edit section"
                      (click)="ActionClick(data, 'Update')"
                    >
                      <i class="pi pi-pencil"></i>
                    </button>

                    <button
                      type="button"
                      class="icon-action delete-action"
                      title="Delete section"
                      (click)="openDeleteDialog(data)"
                    >
                      <i class="pi pi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </ng-template>

            <ng-template #emptymessage>
              <tr>
                <td colspan="2">
                  <div class="empty-state">
                    <div class="empty-icon">
                      <i class="pi pi-folder-open"></i>
                    </div>

                    <h3>No sections found</h3>
                    <p>There are no inventory sections matching your search.</p>

                    <button
                      type="button"
                      class="btn-add empty-add"
                      (click)="ActionClick(null, 'add')"
                    >
                      <i class="pi pi-plus"></i>
                      Add First Section
                    </button>
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      </div>
    </div>

    <!-- ADD / EDIT DIALOG -->
    <p-dialog
      [(visible)]="visible"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [closable]="false"
      [dismissableMask]="!saving"
      [style]="{ width: 'min(500px, 95vw)' }"
      styleClass="section-dialog"
      (onHide)="resetForm()"
    >
      <ng-template #header>
        <div class="dialog-heading">
          <div class="dialog-icon">
            <i [class]="isUpdate ? 'pi pi-pencil' : 'pi pi-plus'"></i>
          </div>

          <div>
            <h2>{{ isUpdate ? 'Edit Section' : 'Create Section' }}</h2>
            <p>
              {{
                isUpdate
                  ? 'Update the inventory section details.'
                  : 'Add a new section to your inventory.'
              }}
            </p>
          </div>
        </div>
      </ng-template>

      <div class="dialog-content">
        <div class="form-field">
          <label for="sectionName">
            Section Name
            <span>*</span>
          </label>

          <input
            id="sectionName"
            type="text"
            pInputText
            class="section-input"
            [(ngModel)]="name"
            placeholder="Enter section name"
            maxlength="150"
            (keyup.enter)="SaveSection()"
            autofocus
          />

          <small>
            Enter a clear name to identify this inventory section.
          </small>
        </div>
      </div>

      <ng-template #footer>
        <div class="dialog-footer">
          <button
            type="button"
            class="btn-cancel"
            (click)="visible = false"
            [disabled]="saving"
          >
            Cancel
          </button>

          <button
            type="button"
            class="btn-save"
            (click)="SaveSection()"
            [disabled]="saving || !name?.trim()"
          >
            <i
              [class]="
                saving
                  ? 'pi pi-spin pi-spinner'
                  : isUpdate
                    ? 'pi pi-save'
                    : 'pi pi-plus'
              "
            ></i>

            {{
              saving
                ? 'Saving...'
                : isUpdate
                  ? 'Save Changes'
                  : 'Create Section'
            }}
          </button>
        </div>
      </ng-template>
    </p-dialog>

    <!-- DELETE CONFIRMATION DIALOG -->
    <p-dialog
      [(visible)]="deleteVisible"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [closable]="false"
      [style]="{ width: 'min(420px, 95vw)' }"
      styleClass="section-dialog"
    >
      <ng-template #header>
        <div class="dialog-heading">
          <div class="dialog-icon delete-dialog-icon">
            <i class="pi pi-trash"></i>
          </div>

          <div>
            <h2>Delete Section</h2>
            <p>Confirm your deletion</p>
          </div>
        </div>
      </ng-template>

      <div class="delete-content">
        <p>
          Are you sure you want to delete
          <strong>{{ selectedSection?.name }}</strong
          >?
        </p>

        <div class="delete-warning">
          <i class="pi pi-exclamation-triangle"></i>
          This action cannot be undone.
        </div>
      </div>

      <ng-template #footer>
        <div class="dialog-footer">
          <button
            type="button"
            class="btn-cancel"
            (click)="deleteVisible = false"
            [disabled]="deleting"
          >
            Cancel
          </button>

          <button
            type="button"
            class="btn-delete"
            (click)="confirmDelete()"
            [disabled]="deleting"
          >
            <i [class]="deleting ? 'pi pi-spin pi-spinner' : 'pi pi-trash'"></i>
            {{ deleting ? 'Deleting...' : 'Delete Section' }}
          </button>
        </div>
      </ng-template>
    </p-dialog>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        color: #1e293b;
      }

      .section-page {
        display: flex;
        flex-direction: column;
        gap: 24px;
        padding: 24px;
        min-height: 100%;
        background: #f8fafc;
      }

      .page-header {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 20px;
        flex-wrap: wrap;
      }

      .breadcrumb {
        display: flex;
        align-items: center;
        gap: 9px;
        margin-bottom: 18px;
        font-size: 12px;
        color: #94a3b8;
      }

      .breadcrumb a {
        color: #64748b;
        text-decoration: none;
      }

      .breadcrumb a:hover {
        color: #2563eb;
      }

      .breadcrumb strong {
        color: #334155;
        font-weight: 600;
      }

      .heading-content {
        display: flex;
        align-items: center;
        gap: 15px;
      }

      .heading-icon {
        width: 52px;
        height: 52px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 14px;
        background: #eff6ff;
        color: #2563eb;
        font-size: 22px;
      }

      .heading-content h1 {
        margin: 0;
        font-size: 25px;
        font-weight: 750;
        letter-spacing: -0.5px;
        color: #172554;
      }

      .heading-content p {
        margin: 6px 0 0;
        font-size: 13px;
        color: #64748b;
      }

      .header-actions {
        display: flex;
        gap: 10px;
        align-items: center;
      }

      .btn-refresh,
      .btn-add,
      .btn-reset,
      .btn-cancel,
      .btn-save,
      .btn-delete {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border-radius: 9px;
        padding: 10px 15px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: 0.2s ease;
      }

      .btn-refresh {
        border: 1px solid #e2e8f0;
        background: white;
        color: #475569;
      }

      .btn-refresh:hover,
      .btn-reset:hover {
        background: #f1f5f9;
      }

      .btn-add,
      .btn-save {
        border: 1px solid #2563eb;
        background: #2563eb;
        color: white;
      }

      .btn-add:hover,
      .btn-save:hover {
        background: #1d4ed8;
      }

      button:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 16px;
      }

      .stat-card {
        display: flex;
        align-items: center;
        gap: 15px;
        padding: 20px;
        border: 1px solid #e8edf4;
        border-radius: 13px;
        background: white;
        box-shadow: 0 2px 7px rgba(15, 23, 42, 0.025);
      }

      .stat-icon {
        width: 46px;
        height: 46px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        font-size: 19px;
      }

      .stat-icon.blue {
        background: #eff6ff;
        color: #2563eb;
      }

      .stat-icon.green {
        background: #ecfdf5;
        color: #059669;
      }

      .stat-icon.purple {
        background: #f5f3ff;
        color: #7c3aed;
      }

      .stat-content span {
        display: block;
        color: #64748b;
        font-size: 12px;
        font-weight: 500;
      }

      .stat-content h3 {
        margin: 5px 0 0;
        color: #172554;
        font-size: 23px;
        font-weight: 750;
      }

      .content-card {
        overflow: hidden;
        border: 1px solid #e8edf4;
        border-radius: 14px;
        background: white;
        box-shadow: 0 2px 7px rgba(15, 23, 42, 0.025);
      }

      .content-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 15px;
        padding: 21px 23px;
        border-bottom: 1px solid #f1f5f9;
      }

      .content-header h2 {
        margin: 0;
        color: #1e293b;
        font-size: 16px;
        font-weight: 700;
      }

      .content-header p {
        margin: 5px 0 0;
        color: #94a3b8;
        font-size: 12px;
      }

      .record-count {
        display: flex;
        align-items: center;
        gap: 7px;
        padding: 7px 11px;
        border-radius: 20px;
        background: #f1f5f9;
        color: #64748b;
        font-size: 12px;
        font-weight: 600;
        white-space: nowrap;
      }

      .toolbar {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 17px 23px;
        border-bottom: 1px solid #f1f5f9;
      }

      .search-wrapper {
        position: relative;
        width: 100%;
        max-width: 380px;
      }

      .search-wrapper > i {
        position: absolute;
        left: 13px;
        top: 50%;
        transform: translateY(-50%);
        color: #94a3b8;
        z-index: 1;
        font-size: 13px;
      }

      .search-wrapper input {
        width: 100%;
        height: 40px;
        padding: 0 38px;
        border: 1px solid #e2e8f0;
        border-radius: 9px;
        outline: none;
        font-size: 13px;
        color: #334155;
      }

      .search-wrapper input:focus {
        border-color: #93c5fd;
        box-shadow: 0 0 0 3px #eff6ff;
      }

      .clear-search {
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        border: none;
        background: transparent;
        color: #94a3b8;
        cursor: pointer;
      }

      .btn-reset {
        border: 1px solid #e2e8f0;
        background: white;
        color: #64748b;
      }

      .table-container {
        padding: 0 12px 12px;
      }

      .table-heading {
        display: flex;
        align-items: center;
        gap: 9px;
      }

      .table-heading i {
        color: #64748b;
      }

      .section-name-cell {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 4px 0;
      }

      .section-avatar {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 38px;
        height: 38px;
        border-radius: 10px;
        background: #eff6ff;
        color: #2563eb;
        font-size: 15px;
      }

      .section-name-content {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .section-name-content strong {
        color: #334155;
        font-size: 13px;
        font-weight: 650;
      }

      .section-name-content small {
        color: #94a3b8;
        font-size: 11px;
      }

      .row-actions {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }

      .icon-action {
        width: 33px;
        height: 33px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid transparent;
        border-radius: 8px;
        cursor: pointer;
        transition: 0.2s ease;
      }

      .edit-action {
        background: #eff6ff;
        color: #2563eb;
      }

      .edit-action:hover {
        background: #dbeafe;
      }

      .delete-action {
        background: #fef2f2;
        color: #dc2626;
      }

      .delete-action:hover {
        background: #fee2e2;
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 55px 20px;
        text-align: center;
      }

      .empty-icon {
        width: 58px;
        height: 58px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 16px;
        background: #f1f5f9;
        color: #94a3b8;
        font-size: 24px;
      }

      .empty-state h3 {
        margin: 15px 0 0;
        color: #334155;
        font-size: 15px;
        font-weight: 700;
      }

      .empty-state p {
        margin: 7px 0 17px;
        color: #94a3b8;
        font-size: 12px;
      }

      .empty-add {
        padding: 9px 13px;
      }

      .dialog-heading {
        display: flex;
        align-items: center;
        gap: 13px;
      }

      .dialog-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 43px;
        height: 43px;
        border-radius: 12px;
        background: #eff6ff;
        color: #2563eb;
        font-size: 17px;
      }

      .dialog-heading h2 {
        margin: 0;
        color: #1e293b;
        font-size: 17px;
        font-weight: 700;
      }

      .dialog-heading p {
        margin: 5px 0 0;
        color: #94a3b8;
        font-size: 12px;
      }

      .dialog-content {
        padding: 12px 0 22px;
      }

      .form-field {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .form-field label {
        color: #334155;
        font-size: 13px;
        font-weight: 600;
      }

      .form-field label span {
        color: #ef4444;
      }

      .section-input {
        width: 100%;
        height: 43px;
        border: 1px solid #e2e8f0;
        border-radius: 9px;
        padding: 0 12px;
        font-size: 13px;
      }

      .form-field small {
        color: #94a3b8;
        font-size: 11px;
      }

      .dialog-footer {
        display: flex;
        justify-content: flex-end;
        gap: 9px;
        width: 100%;
      }

      .btn-cancel {
        border: 1px solid #e2e8f0;
        background: white;
        color: #64748b;
      }

      .btn-cancel:hover {
        background: #f8fafc;
      }

      .delete-dialog-icon {
        background: #fef2f2;
        color: #dc2626;
      }

      .delete-content {
        padding: 10px 0 20px;
      }

      .delete-content p {
        color: #475569;
        font-size: 13px;
        line-height: 1.7;
      }

      .delete-content strong {
        color: #1e293b;
      }

      .delete-warning {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 15px;
        padding: 11px;
        border-radius: 8px;
        background: #fff7ed;
        color: #c2410c;
        font-size: 12px;
      }

      .btn-delete {
        border: 1px solid #dc2626;
        background: #dc2626;
        color: white;
      }

      .btn-delete:hover {
        background: #b91c1c;
      }

      @media (max-width: 768px) {
        .section-page {
          padding: 15px;
          gap: 17px;
        }

        .page-header {
          align-items: flex-start;
          flex-direction: column;
        }

        .header-actions {
          width: 100%;
        }

        .header-actions button {
          flex: 1;
        }

        .heading-content h1 {
          font-size: 21px;
        }

        .stats-grid {
          grid-template-columns: 1fr;
          gap: 10px;
        }

        .stat-card {
          padding: 14px;
        }

        .content-header {
          align-items: flex-start;
          flex-direction: column;
          padding: 17px;
        }

        .toolbar {
          padding: 14px 17px;
        }

        .search-wrapper {
          max-width: none;
          flex: 1;
        }

        .table-container {
          padding: 0 8px 8px;
        }
      }

      @media (max-width: 420px) {
        .toolbar {
          align-items: stretch;
          flex-direction: column;
        }

        .search-wrapper {
          max-width: 100%;
        }

        .btn-reset {
          width: 100%;
        }
      }

      :host ::ng-deep .section-table .p-datatable-thead > tr > th {
        padding: 15px 16px;
        background: #f8fafc;
        border-color: #edf2f7;
        color: #64748b;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.4px;
      }

      :host ::ng-deep .section-table .p-datatable-tbody > tr > td {
        padding: 12px 16px;
        border-color: #f1f5f9;
        font-size: 13px;
      }

      :host ::ng-deep .section-table .p-datatable-tbody > tr:hover {
        background: #f8fafc;
      }

      :host ::ng-deep .section-table .p-paginator {
        border: none;
        padding: 15px 8px 8px;
      }

      :host ::ng-deep .section-dialog .p-dialog-header {
        padding: 22px 22px 14px;
        border-bottom: 1px solid #f1f5f9;
      }

      :host ::ng-deep .section-dialog .p-dialog-content {
        padding: 15px 22px 0;
      }

      :host ::ng-deep .section-dialog .p-dialog-footer {
        padding: 12px 22px 20px;
        border-top: 1px solid #f1f5f9;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionInventory implements OnInit, OnDestroy {
  @ViewChild('fTable') fTable?: Table;

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly loadingService = inject(LoadingService);
  private readonly messageService = inject(MessageService);
  private readonly sectionInventoryService = inject(SectionInventoryService);

  protected ngUnsubscribe = new Subject<void>();

  PagingSignal = signal<PagingContent<BaseOption>>({
    data: [],
    totalElements: 0,
  } as PagingContent<BaseOption>);

  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  visible = false;
  deleteVisible = false;
  isUpdate = false;

  loading = false;
  saving = false;
  deleting = false;

  search = '';
  title = 'Create Section';
  name: string | null = null;
  id: string | null = null;

  selectedSection: BaseOption | null = null;

  menuItems: MenuItem[] = [];

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 10;
    this.Query.Filter = null;
    this.Query.OrderBy = 'Name';
    this.Query.Select = null;
    this.Query.Includes = null;
  }

  ngOnInit(): void {
    this.GetData();
  }

  // ==========================================
  // LOAD DATA
  // ==========================================

  GetData(): void {
    this.loading = true;
    this.loadingService.start();

    this.sectionInventoryService
      .GetMany(this.Query)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loading = false;
          this.loadingService.stop();

          this.PagingSignal.set(res);

          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loading = false;
          this.loadingService.stop();

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'Unable to load inventory sections.',
          });

          this.cdr.markForCheck();
        },
      });
  }

  // ==========================================
  // PAGINATION / SORTING
  // ==========================================

  NextPage(event: TableLazyLoadEvent): void {
    if ((event?.first || event?.first === 0) && event?.rows) {
      this.Query.Page = event.first / event.rows + 1 || 1;
      this.Query.PageSize = event.rows;
    }

    const sortText = BuildSortText(event);
    this.Query.OrderBy = sortText || 'Name';

    this.Query.Filter = BuildFilterText(event);

    this.GetData();
  }

  // ==========================================
  // SEARCH
  // ==========================================

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.Search(this.search);
    }
  }

  onSearchInput(): void {
    if (!this.search.trim()) {
      this.Search('');
    }
  }

  Search(data: string): void {
    this.search = data;

    const filter: { [s: string]: FilterMetadata | FilterMetadata[] } =
      data.trim()
        ? {
            Name: {
              value: data.trim(),
              matchMode: 'contains',
              operator: 'and',
            },
          }
        : {};

    if (this.fTable) {
      this.fTable.first = 0;
      this.fTable.filters = filter;
    }

    const event: TableLazyLoadEvent = {
      first: 0,
      rows: this.fTable?.rows || this.Query.PageSize,
      sortField: null,
      sortOrder: null,
      filters: filter,
    };

    this.NextPage(event);
  }

  ResetTable(): void {
    this.search = '';

    if (this.fTable) {
      this.fTable.first = 0;
      this.fTable.clearFilterValues();
      this.fTable.saveState();
    }

    this.Query.Page = 1;
    this.Query.Filter = null;
    this.Query.OrderBy = 'Name';

    this.GetData();
  }

  // ==========================================
  // ADD / EDIT
  // ==========================================

  ActionClick(data: BaseOption | null, action: string): void {
    this.isUpdate = action === 'Update';

    this.title = this.isUpdate ? 'Edit Section' : 'Create Section';

    if (this.isUpdate && data) {
      this.id = data.id;
      this.name = data.name;
    } else {
      this.id = null;
      this.name = null;
    }

    this.visible = true;
    this.cdr.markForCheck();
  }

  resetForm(): void {
    if (!this.saving) {
      this.name = null;
      this.id = null;
      this.isUpdate = false;
    }
  }

  SaveSection(): void {
    const sectionName = this.name?.trim();

    if (!sectionName) {
      this.messageService.add({
        severity: 'error',
        summary: 'Name is required',
        detail: 'Please enter a section name.',
      });
      return;
    }

    if (this.saving) {
      return;
    }

    const request$: Observable<any> = this.isUpdate
      ? this.sectionInventoryService.Update({
          id: this.id!,
          name: sectionName,
        })
      : this.sectionInventoryService.Create({
          name: sectionName,
        });

    this.saving = true;
    this.loadingService.start();

    request$.pipe(takeUntil(this.ngUnsubscribe)).subscribe({
      next: (res) => {
        this.saving = false;
        this.loadingService.stop();

        if (res) {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `Section "${sectionName}" has been ${
              this.isUpdate ? 'updated' : 'created'
            } successfully.`,
          });

          this.visible = false;

          // Reload to keep pagination and server-side data accurate.
          this.GetData();
        } else {
          this.messageService.add({
            severity: 'warn',
            summary: 'Warning',
            detail: 'The operation could not be completed.',
          });
        }

        this.cdr.markForCheck();
      },
      error: (err) => {
        this.saving = false;
        this.loadingService.stop();

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail:
            err.error?.message ||
            err.error?.Message ||
            'Something went wrong. Please try again.',
        });

        this.cdr.markForCheck();
      },
    });
  }

  // ==========================================
  // DELETE
  // ==========================================

  openDeleteDialog(data: BaseOption): void {
    this.selectedSection = data;
    this.deleteVisible = true;
  }

  confirmDelete(): void {
    if (!this.selectedSection || this.deleting) {
      return;
    }

    const section = this.selectedSection;

    this.deleting = true;
    this.loadingService.start();

    this.sectionInventoryService
      .Delete(section.id)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res: any) => {
          this.deleting = false;
          this.loadingService.stop();

          this.deleteVisible = false;
          this.selectedSection = null;

          this.messageService.add({
            severity: 'success',
            summary: 'Deleted',
            detail: res?.message || 'Section deleted successfully.',
          });

          this.GetData();
          this.cdr.markForCheck();
        },
        error: (err: any) => {
          this.deleting = false;
          this.loadingService.stop();

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail:
              err.error?.error ||
              err.error?.message ||
              'Failed to delete section.',
          });

          this.cdr.markForCheck();
        },
      });
  }

  // ==========================================
  // LIFECYCLE
  // ==========================================

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();

    this.loadingService.stop();
  }
}
