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

import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { Observable, Subject, takeUntil } from 'rxjs';

import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { MenuItem, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { MenuModule } from 'primeng/menu';
import { DialogModule } from 'primeng/dialog';
import { ImageModule } from 'primeng/image';
import { ProgressBarModule } from 'primeng/progressbar';

import { InventoryDto } from '../../../models/Inventory';
import { InventoryService } from '../../../services/InventoryService';
import { LoadingService } from '../../../services/loading.service';
import { UserService } from '../../../services/userService.service';

import {
  PagingContent,
  GridifyQueryExtend,
  BuildSortText,
} from '../../../shared/helpers/helpers';

import { InventoryQrDialog } from '../shared/inventory-qr-dialog';
import { environment } from '../../../../environments/environment.development';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    TableModule,
    FormsModule,
    ReactiveFormsModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    SelectModule,
    RouterLink,
    DatePickerModule,
    MenuModule,
    DialogModule,
    ImageModule,
    ProgressBarModule,
    InventoryQrDialog,
  ],
  template: `
    <div class="min-h-screen bg-slate-50">
      <!-- MOBILE HEADER -->
      <div class="lg:hidden bg-blue-800 px-5 pt-6 pb-8 rounded-b-[2rem]">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-blue-200 font-semibold tracking-widest">
              YL WORKS
            </p>
            <h1 class="text-2xl font-bold text-white mt-1">Inventory</h1>
            <p class="text-sm text-blue-100 mt-1">
              Manage your stock and equipment
            </p>
          </div>

          <div
            class="w-11 h-11 rounded-xl bg-white flex items-center justify-center"
          >
            <span class="font-bold text-blue-800">
              {{ getInitial(currentUser?.displayName) }}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-2 mt-6">
          <div class="bg-white/10 rounded-xl p-3 text-white">
            <p class="text-xs text-blue-100">Total Items</p>
            <p class="text-2xl font-bold">
              {{ dashboardCount?.totalItems ?? 0 }}
            </p>
          </div>

          <div class="bg-red-500/20 rounded-xl p-3 text-white">
            <p class="text-xs text-red-100">Low Stock</p>
            <p class="text-2xl font-bold">
              {{ dashboardCount?.lowStock ?? 0 }}
            </p>
          </div>

          <div class="bg-white/10 rounded-xl p-3 text-white">
            <p class="text-xs text-blue-100">Reserved</p>
            <p class="text-2xl font-bold">
              {{ dashboardCount?.reserved ?? 0 }}
            </p>
          </div>
        </div>
      </div>

      <!-- DESKTOP HEADER -->
      <div class="hidden lg:block px-6 pt-6">
        <div class="flex items-center gap-2 text-sm text-gray-500">
          <a routerLink="/dashboard" class="hover:text-blue-700"> Dashboard </a>
          <i class="pi pi-angle-right text-xs"></i>
          <span class="font-semibold text-gray-800">Inventory</span>
        </div>

        <div class="flex items-center justify-between mt-5">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">
              Inventory Management
            </h1>
            <p class="text-sm text-gray-500 mt-1">
              Manage, monitor and track company inventory.
            </p>
          </div>

          <p-button
            label="New Inventory"
            icon="pi pi-plus"
            styleClass="bg-blue-900! border-none! hover:bg-blue-700! cursor-pointer!"
            (onClick)="ActionClick(null, 'add')"
          ></p-button>
        </div>
      </div>

      <!-- MOBILE ADD BUTTON -->
      <div class="lg:hidden px-5 -mt-1">
        <p-button
          label="Add New Item"
          icon="pi pi-plus"
          styleClass="w-full!"
          (onClick)="ActionClick(null, 'add')"
        ></p-button>
      </div>

      <!-- DESKTOP SUMMARY -->
      <div class="hidden lg:grid grid-cols-3 gap-4 px-6 mt-6">
        <div class="bg-white border border-gray-200 rounded-xl p-5">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">Total Inventory</p>
              <p class="text-3xl font-bold text-gray-900 mt-2">
                {{ dashboardCount?.totalItems ?? 0 }}
              </p>
            </div>
            <div
              class="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center"
            >
              <i class="pi pi-box text-xl"></i>
            </div>
          </div>
        </div>

        <div class="bg-white border border-gray-200 rounded-xl p-5">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">Low Stock</p>
              <p class="text-3xl font-bold text-red-600 mt-2">
                {{ dashboardCount?.lowStock ?? 0 }}
              </p>
            </div>
            <div
              class="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center"
            >
              <i class="pi pi-exclamation-triangle text-xl"></i>
            </div>
          </div>
        </div>

        <div class="bg-white border border-gray-200 rounded-xl p-5">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">Reserved / In-Transit</p>
              <p class="text-3xl font-bold text-blue-700 mt-2">
                {{ dashboardCount?.reserved ?? 0 }}
              </p>
            </div>
            <div
              class="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center"
            >
              <i class="pi pi-truck text-xl"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- RESTOCK ALERT -->
      <div class="px-5 lg:px-6 mt-5">
        <div
          class="flex items-center justify-between gap-3 p-4 rounded-xl border"
          [ngClass]="
            (dashboardCount?.restock ?? 0) > 0
              ? 'bg-red-50 border-red-200'
              : 'bg-white border-gray-200'
          "
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center"
              [ngClass]="
                (dashboardCount?.restock ?? 0) > 0
                  ? 'bg-red-100 text-red-700'
                  : 'bg-green-100 text-green-700'
              "
            >
              <i class="pi pi-exclamation-triangle"></i>
            </div>

            <div>
              <p class="font-bold text-sm text-gray-800">
                {{
                  (dashboardCount?.restock ?? 0) > 0
                    ? 'Restock Attention Required'
                    : 'Stock Levels Healthy'
                }}
              </p>
              <p class="text-xs text-gray-500 mt-1">
                {{ dashboardCount?.restock ?? 0 }} items require restocking
              </p>
            </div>
          </div>

          <button
            *ngIf="(dashboardCount?.restock ?? 0) > 0"
            type="button"
            class="text-xs font-bold text-red-700 whitespace-nowrap"
            (click)="applyRestockFilter()"
          >
            View Items
            <i class="pi pi-arrow-right ml-1"></i>
          </button>
        </div>
      </div>

      <!-- SEARCH AND FILTERS -->
      <div class="px-5 lg:px-6 mt-5">
        <div class="bg-white border border-gray-200 rounded-xl p-4">
          <div class="flex flex-col lg:flex-row gap-3">
            <div class="relative flex-1">
              <i class="pi pi-search absolute left-3 top-3.5 text-gray-400"></i>
              <input
                type="text"
                pInputText
                [(ngModel)]="search"
                placeholder="Search item, brand or model..."
                class="w-full pl-10!"
                (keyup)="onKeyDown($event)"
              />
            </div>

            <div class="grid grid-cols-2 lg:flex gap-2">
              <p-select
                [options]="sectionFilter"
                [(ngModel)]="selectedSectionId"
                placeholder="All Sections"
                appendTo="body"
                styleClass="w-full lg:w-44"
                (onChange)="applyFilters()"
              ></p-select>

              <p-select
                [options]="categoryFilter"
                [(ngModel)]="selectedCategoryId"
                placeholder="All Categories"
                appendTo="body"
                styleClass="w-full lg:w-44"
                (onChange)="applyFilters()"
              ></p-select>

              <p-select
                [options]="statusOptions"
                [(ngModel)]="selectedStatus"
                placeholder="All Status"
                appendTo="body"
                styleClass="w-full lg:w-40"
                (onChange)="applyFilters()"
              ></p-select>

              <p-button
                label="Reset"
                icon="pi pi-refresh"
                severity="secondary"
                [outlined]="true"
                (onClick)="ResetTable()"
              ></p-button>
            </div>
          </div>
        </div>
      </div>

      <!-- INVENTORY LIST -->
      <div class="px-5 lg:px-6 py-5">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-lg font-bold text-gray-900">Inventory Items</h2>
            <p class="text-xs text-gray-500 mt-1">
              {{ PagingSignal()?.totalElements ?? 0 }} items found
            </p>
          </div>
        </div>

        <!-- MOBILE CARDS -->
        <div class="lg:hidden flex flex-col gap-3">
          <ng-container *ngFor="let data of PagingSignal()?.data">
            <div
              class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
            >
              <div class="flex gap-3">
                <div
                  class="w-20 h-20 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center"
                >
                  <img
                    *ngIf="data.attachment"
                    [src]="data.attachment"
                    class="w-full h-full object-contain"
                    alt="Inventory item"
                  />
                  <i
                    *ngIf="!data.attachment"
                    class="pi pi-image text-2xl text-gray-300"
                  ></i>
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0">
                      <h3 class="font-bold text-gray-900 text-sm">
                        {{ data.itemName }}
                      </h3>
                      <p class="text-xs text-gray-500 mt-1">
                        {{ data.brand || 'No brand' }}
                        <span *ngIf="data.model"> · {{ data.model }}</span>
                      </p>
                      <p class="text-xs text-gray-400 mt-1">
                        {{ data.itemCode }}
                      </p>
                    </div>

                    <button
                      type="button"
                      class="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-500 flex-shrink-0"
                      (click)="onEllipsisClick($event, data, menu)"
                    >
                      <i class="pi pi-ellipsis-v"></i>
                    </button>
                  </div>

                  <div class="mt-2">
                    <span
                      class="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold"
                      [ngClass]="getStatusClass(data.status)"
                    >
                      {{ data.status || 'Unknown' }}
                    </span>
                  </div>
                </div>
              </div>

              <div
                class="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-gray-100"
              >
                <div>
                  <p class="text-[10px] uppercase text-gray-400 font-semibold">
                    Balance
                  </p>
                  <p
                    class="font-bold text-sm mt-1"
                    [ngClass]="
                      data.quantity <= data.parLevel
                        ? 'text-red-600'
                        : 'text-gray-800'
                    "
                  >
                    {{ data.quantity | number: '1.0-3' }} {{ data.unit }}
                  </p>
                </div>

                <div>
                  <p class="text-[10px] uppercase text-gray-400 font-semibold">
                    Par Level
                  </p>
                  <p class="font-bold text-sm text-gray-800 mt-1">
                    {{ data.parLevel }}
                  </p>
                </div>

                <div>
                  <p class="text-[10px] uppercase text-gray-400 font-semibold">
                    Section
                  </p>
                  <p class="font-bold text-sm text-gray-800 mt-1 truncate">
                    {{ data.section?.name || '-' }}
                  </p>
                </div>
              </div>

              <div class="mt-3">
                <p-progressbar
                  [value]="getProgress(data.quantity, data.parLevel)"
                  [showValue]="false"
                  [style]="{ height: '5px' }"
                ></p-progressbar>
              </div>

              <div
                class="flex items-center justify-between mt-3 pt-3 border-t border-gray-100"
              >
                <button
                  type="button"
                  class="text-sm text-blue-700 font-semibold"
                  (click)="DetailsClick(data)"
                >
                  View Details
                </button>

                <div class="flex items-center gap-3">
                  <button
                    type="button"
                    class="text-blue-700 text-sm"
                    (click)="ActionClick(data, 'Update')"
                  >
                    <i class="pi pi-pencil"></i>
                    Edit
                  </button>

                  <button
                    type="button"
                    class="text-red-600 text-sm"
                    (click)="DeleteInventory(data)"
                  >
                    <i class="pi pi-trash"></i>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </ng-container>

          <div
            *ngIf="!PagingSignal()?.data?.length"
            class="bg-white rounded-xl border border-gray-200 p-8 text-center"
          >
            <i class="pi pi-box text-3xl text-gray-300"></i>
            <p class="font-semibold text-gray-700 mt-3">No inventory found</p>
            <p class="text-sm text-gray-400 mt-1">
              Try changing your search or filters.
            </p>
          </div>

          <!-- MOBILE PAGINATION -->
          <div
            *ngIf="(PagingSignal()?.totalElements ?? 0) > Query.PageSize"
            class="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-3"
          >
            <p-button
              icon="pi pi-chevron-left"
              severity="secondary"
              [outlined]="true"
              [disabled]="Query.Page <= 1"
              (onClick)="changeMobilePage(-1)"
            ></p-button>

            <span class="text-sm text-gray-600">
              Page {{ Query.Page }} of {{ totalPages }}
            </span>

            <p-button
              icon="pi pi-chevron-right"
              severity="secondary"
              [outlined]="true"
              [disabled]="Query.Page >= totalPages"
              (onClick)="changeMobilePage(1)"
            ></p-button>
          </div>
        </div>

        <!-- DESKTOP TABLE -->
        <div
          class="hidden lg:block bg-white rounded-xl border border-gray-200 overflow-hidden"
        >
          <p-table
            #fTable
            [value]="PagingSignal().data"
            [paginator]="true"
            [rows]="Query.PageSize"
            [totalRecords]="PagingSignal().totalElements"
            [rowsPerPageOptions]="[10, 20, 30, 50]"
            [showGridlines]="false"
            [lazy]="true"
            (onLazyLoad)="NextPage($event)"
            [rowHover]="true"
          >
            <ng-template #header>
              <tr>
                <th class="w-20">Image</th>
                <th pSortableColumn="ItemName">
                  Item <p-sortIcon field="ItemName"></p-sortIcon>
                </th>
                <th pSortableColumn="Brand">
                  Brand <p-sortIcon field="Brand"></p-sortIcon>
                </th>
                <th pSortableColumn="Model">
                  Model <p-sortIcon field="Model"></p-sortIcon>
                </th>
                <th>Section</th>
                <th class="text-center">Balance</th>
                <th class="text-center">Par Level</th>
                <th>Status</th>
                <th class="text-center w-24">Actions</th>
              </tr>
            </ng-template>

            <ng-template #body let-data>
              <tr [ngClass]="data.status === 'Restock' ? 'bg-red-50/50' : ''">
                <td>
                  <div
                    class="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center"
                  >
                    <img
                      *ngIf="data.attachment"
                      [src]="data.attachment"
                      class="w-full h-full object-contain"
                      alt="Inventory item"
                    />
                    <i
                      *ngIf="!data.attachment"
                      class="pi pi-image text-gray-300"
                    ></i>
                  </div>
                </td>

                <td>
                  <div class="font-semibold text-gray-800">
                    {{ data.itemName }}
                  </div>
                  <div class="text-xs text-gray-400 mt-1">
                    {{ data.itemCode }}
                  </div>
                </td>

                <td>{{ data.brand || '-' }}</td>
                <td>{{ data.model || '-' }}</td>

                <td>
                  <span class="bg-gray-100 rounded-md px-2 py-1 text-xs">
                    {{ data.section?.name || '-' }}
                  </span>
                </td>

                <td
                  class="text-center font-semibold"
                  [ngClass]="
                    data.quantity <= data.parLevel
                      ? 'text-red-600'
                      : 'text-gray-800'
                  "
                >
                  {{ data.quantity | number: '1.0-3' }}
                </td>

                <td class="text-center">{{ data.parLevel }}</td>

                <td>
                  <span
                    class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                    [ngClass]="getStatusClass(data.status)"
                  >
                    {{ data.status }}
                  </span>
                </td>

                <td class="text-center">
                  <button
                    type="button"
                    class="w-9 h-9 rounded-lg hover:bg-gray-100 text-gray-600"
                    (click)="onEllipsisClick($event, data, menu)"
                  >
                    <i class="pi pi-ellipsis-v"></i>
                  </button>
                </td>
              </tr>
            </ng-template>

            <ng-template #emptymessage>
              <tr>
                <td colspan="9">
                  <div class="py-10 text-center text-gray-500">
                    <i class="pi pi-box text-3xl text-gray-300"></i>
                    <p class="mt-2">No inventory available</p>
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      </div>
    </div>

    <!-- ACTION MENU -->
    <p-menu #menu [model]="menuItems" [popup]="true"></p-menu>

    <!-- ADD / EDIT INVENTORY DIALOG -->
    <p-dialog
      [(visible)]="visible"
      [modal]="true"
      [draggable]="false"
      [closable]="true"
      [dismissableMask]="!saving"
      (onHide)="onInventoryDialogHide()"
      [style]="{ width: 'min(95vw, 900px)' }"
      styleClass="inventory-dialog"
    >
      <ng-template #header>
        <div>
          <h2 class="font-bold text-xl text-gray-900">
            {{ title }}
          </h2>
          <p class="text-sm text-gray-500 mt-1">
            Complete the details below to maintain inventory specifications.
          </p>
        </div>
      </ng-template>

      <form [formGroup]="FG" class="flex flex-col gap-7">
        <!-- PRODUCT IDENTIFICATION -->
        <section class="flex flex-col gap-4">
          <div class="border-b border-gray-100 pb-2">
            <h3
              class="text-sm font-bold uppercase tracking-wider text-gray-400"
            >
              Product Identification
            </h3>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div class="md:col-span-2 flex flex-col gap-1.5">
              <label class="text-sm font-semibold text-gray-700">
                Item Name <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                pInputText
                formControlName="itemName"
                placeholder="Enter item name"
                class="w-full"
              />
              <small
                *ngIf="
                  FG.get('itemName')?.invalid && FG.get('itemName')?.touched
                "
                class="text-red-600"
              >
                Item name is required.
              </small>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-semibold text-gray-700">
                Item Code
              </label>
              <input
                type="text"
                pInputText
                formControlName="itemCode"
                placeholder="e.g. HW-CAM-01"
                class="w-full"
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-semibold text-gray-700"> Brand </label>
              <input
                type="text"
                pInputText
                formControlName="brand"
                placeholder="e.g. Hanwha Vision"
                class="w-full"
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-semibold text-gray-700"> Model </label>
              <input
                type="text"
                pInputText
                formControlName="model"
                placeholder="Enter model"
                class="w-full"
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-semibold text-gray-700">
                Category
              </label>
              <p-select
                [options]="categorySelection"
                appendTo="body"
                formControlName="categoryId"
                [filter]="true"
                styleClass="w-full"
                placeholder="Select Category"
              ></p-select>
            </div>
          </div>
        </section>

        <!-- LOGISTICS AND STOCK -->
        <section class="flex flex-col gap-4">
          <div class="border-b border-gray-100 pb-2">
            <h3
              class="text-sm font-bold uppercase tracking-wider text-gray-400"
            >
              Logistics & Stock Levels
            </h3>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-semibold text-gray-700">
                Storage Location
              </label>
              <p-select
                [options]="locationSelection"
                appendTo="body"
                formControlName="locationId"
                [filter]="true"
                styleClass="w-full"
                placeholder="Select Location"
              ></p-select>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-semibold text-gray-700">
                Section / Rack
              </label>
              <p-select
                [options]="sectionSelection"
                appendTo="body"
                formControlName="sectionId"
                [filter]="true"
                styleClass="w-full"
                placeholder="Select Section / Rack"
              ></p-select>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-semibold text-gray-700">
                Current Quantity <span class="text-red-500">*</span>
              </label>
              <p-inputnumber
                formControlName="quantity"
                mode="decimal"
                [min]="0"
                [minFractionDigits]="0"
                [maxFractionDigits]="3"
                styleClass="w-full"
                inputStyleClass="w-full"
              ></p-inputnumber>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-semibold text-gray-700">
                Minimum Par Level
              </label>
              <p-inputnumber
                formControlName="parLevel"
                mode="decimal"
                [min]="0"
                [minFractionDigits]="0"
                [maxFractionDigits]="4"
                styleClass="w-full"
                inputStyleClass="w-full"
              ></p-inputnumber>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-semibold text-gray-700">
                Unit of Measure
              </label>
              <p-select
                formControlName="unit"
                appendTo="body"
                styleClass="w-full"
                placeholder="Select Unit"
                [options]="unitOptions"
              ></p-select>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-semibold text-gray-700">
                Inventory Status
              </label>
              <p-select
                formControlName="status"
                appendTo="body"
                styleClass="w-full"
                [options]="statusOptions"
                placeholder="Select Status"
              ></p-select>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-semibold text-gray-700">
                Unit Cost (RM)
              </label>
              <p-inputnumber
                formControlName="costs"
                mode="decimal"
                [min]="0"
                [minFractionDigits]="2"
                [maxFractionDigits]="2"
                styleClass="w-full"
                inputStyleClass="w-full"
              ></p-inputnumber>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-semibold text-gray-700"> Date </label>
              <p-datepicker
                formControlName="date"
                appendTo="body"
                styleClass="w-full"
                [showIcon]="true"
                dateFormat="dd/mm/yy"
              ></p-datepicker>
            </div>
          </div>
        </section>

        <!-- DOCUMENTATION -->
        <section class="flex flex-col gap-4">
          <div class="border-b border-gray-100 pb-2">
            <h3
              class="text-sm font-bold uppercase tracking-wider text-gray-400"
            >
              Documentation
            </h3>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-semibold text-gray-700">
              Description / Operational Remarks
            </label>
            <textarea
              pTextarea
              formControlName="description"
              [rows]="3"
              class="w-full"
              placeholder="Enter item description or storage notes..."
            ></textarea>
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-sm font-semibold text-gray-700">
              Product Image
            </label>

            <div
              *ngIf="attachmentPreview"
              class="flex items-center gap-4 p-4 border border-gray-200 rounded-xl bg-gray-50"
            >
              <div
                class="w-20 h-20 rounded-lg bg-white border border-gray-200 overflow-hidden flex items-center justify-center"
              >
                <img
                  [src]="attachmentPreview"
                  alt="Attachment preview"
                  class="w-full h-full object-contain"
                />
              </div>

              <div class="flex-1">
                <p class="text-sm font-semibold text-gray-800">
                  Image selected
                </p>
                <p class="text-xs text-gray-500 mt-1">
                  You can replace or remove this image.
                </p>

                <div class="flex gap-3 mt-2">
                  <button
                    type="button"
                    class="text-sm text-blue-700 font-semibold"
                    (click)="file.click()"
                  >
                    Replace
                  </button>

                  <button
                    type="button"
                    class="text-sm text-red-600 font-semibold"
                    (click)="removeAttachment()"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>

            <button
              *ngIf="!attachmentPreview"
              type="button"
              class="w-full cursor-pointer border border-dashed border-gray-300 rounded-xl p-6 bg-gray-50 hover:bg-gray-100 transition-colors"
              (click)="file.click()"
            >
              <i class="pi pi-cloud-upload text-2xl text-gray-400"></i>
              <p class="text-sm font-semibold text-gray-700 mt-2">
                Upload Product Image
              </p>
              <p class="text-xs text-gray-400 mt-1">JPG, PNG or WEBP</p>
            </button>

            <input
              #file
              type="file"
              hidden
              accept="image/png,image/jpeg,image/webp,image/gif"
              (change)="onFileSelected($event)"
            />
          </div>
        </section>
      </form>

      <ng-template #footer>
        <div class="flex justify-end gap-2 w-full">
          <p-button
            label="Cancel"
            severity="secondary"
            [outlined]="true"
            [disabled]="saving"
            (onClick)="visible = false"
          ></p-button>

          <p-button
            [label]="
              saving ? 'Saving...' : isUpdate ? 'Save Changes' : 'Save Item'
            "
            icon="pi pi-save"
            styleClass="bg-blue-900! border-none! hover:bg-blue-700! cursor-pointer!"
            [loading]="saving"
            [disabled]="saving"
            (onClick)="SaveInventory()"
          ></p-button>
        </div>
      </ng-template>
    </p-dialog>

    <!-- DELETE CONFIRMATION -->
    <p-dialog
      [(visible)]="confirmDialog"
      [modal]="true"
      [draggable]="false"
      [closable]="false"
      [style]="{ width: 'min(95vw, 480px)' }"
    >
      <ng-template #headless>
        <div class="p-5">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-xl bg-red-100 text-red-700 flex items-center justify-center"
              >
                <i class="pi pi-trash text-xl"></i>
              </div>

              <div>
                <h2 class="font-bold text-lg text-gray-900">
                  Delete Inventory Item
                </h2>
                <p class="text-xs text-red-600 font-semibold">
                  Irreversible action
                </p>
              </div>
            </div>

            <button
              type="button"
              class="text-gray-400 hover:text-gray-700"
              (click)="confirmDialog = false"
              [disabled]="deleting"
            >
              <i class="pi pi-times"></i>
            </button>
          </div>

          <p class="text-sm text-gray-600 mt-5">
            Are you sure you want to remove this item from inventory? This
            action cannot be undone.
          </p>

          <div
            *ngIf="selectedItem"
            class="p-3 bg-gray-50 rounded-xl border border-gray-200 mt-4 flex items-center gap-3"
          >
            <div
              class="w-14 h-14 rounded-lg bg-white border border-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0"
            >
              <img
                *ngIf="selectedItem.attachment"
                [src]="selectedItem.attachment"
                class="w-full h-full object-contain"
                alt="Inventory item"
              />
              <i
                *ngIf="!selectedItem.attachment"
                class="pi pi-box text-gray-300 text-xl"
              ></i>
            </div>

            <div class="flex-1 min-w-0">
              <p class="font-semibold text-sm text-gray-800">
                {{ selectedItem.itemName }}
              </p>
              <p class="text-xs text-gray-500 mt-1">
                {{ selectedItem.brand }} · {{ selectedItem.itemCode }}
              </p>
            </div>

            <div class="text-sm font-bold text-red-600 whitespace-nowrap">
              {{ selectedItem.quantity }} {{ selectedItem.unit }}
            </div>
          </div>

          <div class="flex justify-end gap-2 mt-5">
            <p-button
              label="Cancel"
              severity="secondary"
              [outlined]="true"
              [disabled]="deleting"
              (onClick)="confirmDialog = false"
            ></p-button>

            <p-button
              label="Delete Item"
              icon="pi pi-trash"
              severity="danger"
              [loading]="deleting"
              [disabled]="deleting"
              (onClick)="ConfirmDelete()"
            ></p-button>
          </div>
        </div>
      </ng-template>
    </p-dialog>

    <!-- ITEM DETAILS -->
    <p-dialog
      [(visible)]="detailVisible"
      [modal]="true"
      [draggable]="false"
      [style]="{ width: 'min(95vw, 700px)' }"
      header="Inventory Details"
    >
      <ng-container *ngIf="selectedItem as item">
        <div class="flex flex-col gap-5">
          <!-- ITEM SUMMARY -->
          <div class="flex items-start gap-4">
            <div
              class="w-24 h-24 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center"
            >
              <img
                *ngIf="item.attachment"
                [src]="item.attachment"
                class="w-full h-full object-contain"
                alt="Inventory item"
              />
              <i
                *ngIf="!item.attachment"
                class="pi pi-image text-3xl text-gray-300"
              ></i>
            </div>

            <div class="flex-1 min-w-0">
              <span
                class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                [ngClass]="getStatusClass(item.status)"
              >
                {{ item.status }}
              </span>

              <h2 class="text-xl font-bold text-gray-900 mt-2">
                {{ item.itemName }}
              </h2>

              <p class="text-sm text-gray-500 mt-1">
                {{ item.brand }} {{ item.model ? '· ' + item.model : '' }}
              </p>

              <p class="text-xs text-gray-400 mt-1">
                {{ item.itemCode }}
              </p>
            </div>
          </div>

          <!-- STOCK LEVEL -->
          <div class="border border-gray-200 rounded-xl p-4">
            <div class="flex justify-between items-center">
              <h3 class="font-bold text-sm text-gray-800">Stock Level</h3>
              <span
                class="text-sm font-semibold"
                [ngClass]="
                  item.quantity <= item.parLevel
                    ? 'text-red-600'
                    : 'text-green-700'
                "
              >
                {{
                  item.quantity <= item.parLevel ? 'Low Stock' : 'Healthy Stock'
                }}
              </span>
            </div>

            <div class="flex justify-between mt-4 text-sm">
              <span class="text-gray-500">Available Quantity</span>
              <span class="font-bold text-gray-900">
                {{ item.quantity }} {{ item.unit }}
              </span>
            </div>

            <div class="flex justify-between mt-2 text-sm">
              <span class="text-gray-500">Minimum Par Level</span>
              <span class="font-semibold text-gray-800">
                {{ item.parLevel }} {{ item.unit }}
              </span>
            </div>

            <div class="mt-3">
              <p-progressbar
                [value]="getProgress(item.quantity, item.parLevel)"
                [showValue]="false"
                [style]="{ height: '7px' }"
              ></p-progressbar>
            </div>
          </div>

          <!-- ITEM INFORMATION -->
          <div class="border border-gray-200 rounded-xl p-4">
            <h3 class="font-bold text-sm text-gray-800 mb-4">
              Item Information
            </h3>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-xs text-gray-400">Category</p>
                <p class="font-semibold text-sm mt-1">
                  {{ item.category?.name || '-' }}
                </p>
              </div>

              <div>
                <p class="text-xs text-gray-400">Brand</p>
                <p class="font-semibold text-sm mt-1">
                  {{ item.brand || '-' }}
                </p>
              </div>

              <div>
                <p class="text-xs text-gray-400">Model</p>
                <p class="font-semibold text-sm mt-1">
                  {{ item.model || '-' }}
                </p>
              </div>

              <div>
                <p class="text-xs text-gray-400">Item Code</p>
                <p class="font-semibold text-sm mt-1">
                  {{ item.itemCode || '-' }}
                </p>
              </div>

              <div>
                <p class="text-xs text-gray-400">Location</p>
                <p class="font-semibold text-sm mt-1">
                  {{ item.location?.name || '-' }}
                </p>
              </div>

              <div>
                <p class="text-xs text-gray-400">Section / Rack</p>
                <p class="font-semibold text-sm mt-1">
                  {{ item.section?.name || '-' }}
                </p>
              </div>
            </div>
          </div>

          <!-- COST INFORMATION -->
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p class="text-xs text-gray-500">Unit Cost</p>
              <p class="font-bold text-lg text-gray-900 mt-1">
                RM {{ item.costs | number: '1.2-2' }}
              </p>
            </div>

            <div class="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p class="text-xs text-blue-600">Total Stock Value</p>
              <p class="font-bold text-lg text-blue-800 mt-1">
                RM {{ item.costs * item.quantity | number: '1.2-2' }}
              </p>
            </div>
          </div>

          <!-- DESCRIPTION -->
          <div class="border border-gray-200 rounded-xl p-4">
            <h3 class="font-bold text-sm text-gray-800">
              Description / Remarks
            </h3>
            <p class="text-sm text-gray-500 mt-2 whitespace-pre-line">
              {{ item.description || item.remarks || 'No notes provided.' }}
            </p>
          </div>
        </div>
      </ng-container>

      <ng-template #footer>
        <div class="flex justify-end gap-2">
          <p-button
            label="Close"
            severity="secondary"
            [outlined]="true"
            (onClick)="detailVisible = false"
          ></p-button>

          <p-button
            label="Edit Item"
            icon="pi pi-pencil"
            (onClick)="editSelectedItem()"
          ></p-button>
        </div>
      </ng-template>
    </p-dialog>

    <!-- QR CODE DIALOG -->
    <app-inventory-qr-dialog
      [(visible)]="qrVisible"
      [itemId]="qrItemId"
      [itemName]="qrItemName"
      [itemCode]="qrItemCode"
    ></app-inventory-qr-dialog>
  `,
  styleUrl: './inventory.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Inventory implements OnInit, OnDestroy {
  @ViewChild('fTable') fTable?: Table;

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly loadingService = inject(LoadingService);
  private readonly messageService = inject(MessageService);
  private readonly inventoryService = inject(InventoryService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  protected ngUnsubscribe = new Subject<void>();

  PagingSignal = signal<PagingContent<InventoryDto>>({
    data: [],
    totalElements: 0,
  } as PagingContent<InventoryDto>);

  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  currentUser = this.userService.currentUser ?? null;

  sectionSelection: { label: string; value: string }[] = [];
  categorySelection: { label: string; value: string }[] = [];
  locationSelection: { label: string; value: string }[] = [];

  sectionFilter: { label: string; value: string }[] = [];
  categoryFilter: { label: string; value: string }[] = [];

  statusOptions = [
    { label: 'All Status', value: 'All' },
    { label: 'In Stock', value: 'In Stock' },
    { label: 'Low Stock', value: 'Low Stock' },
    { label: 'Restock', value: 'Restock' },
    { label: 'FOC', value: 'FOC' },
    { label: 'Faulty', value: 'Faulty' },
    { label: 'Under Repair', value: 'Under Repair' },
  ];

  unitOptions = [
    { label: 'Pcs', value: 'Pcs' },
    { label: 'Box', value: 'Box' },
    { label: 'Set', value: 'Set' },
    { label: 'Pair', value: 'Pair' },
    { label: 'Unit', value: 'Unit' },
  ];

  visible = false;
  isUpdate = false;
  confirmDialog = false;
  detailVisible = false;

  qrVisible = false;
  qrItemId: string | null = null;
  qrItemName: string | null = null;
  qrItemCode: string | null = null;

  saving = false;
  deleting = false;

  attachmentPreview: string | null = null;

  selectedCategoryId = 'All';
  selectedSectionId = 'All';
  selectedStatus = 'All';

  search = '';
  title = 'New Inventory';

  menuItems: MenuItem[] = [];

  dashboardCount: any = null;
  selectedItem: InventoryDto | null = null;

  FG: FormGroup = new FormGroup({
    id: new FormControl<string | null>({
      value: null,
      disabled: true,
    }),

    itemCode: new FormControl<string | null>(null),
    itemName: new FormControl<string | null>(null, Validators.required),
    brand: new FormControl<string | null>(null),
    model: new FormControl<string | null>(null),
    categoryId: new FormControl<string | null>(null),
    description: new FormControl<string | null>(null),

    unit: new FormControl<string | null>(null, Validators.required),
    quantity: new FormControl<number | null>(0, [
      Validators.required,
      Validators.min(0),
    ]),
    reservedQuantity: new FormControl<number | null>(0),
    serialNumber: new FormControl<string | null>(null),
    referenceType: new FormControl<string | null>(null),
    referenceId: new FormControl<string | null>(null),
    locationId: new FormControl<string | null>(null),
    sectionId: new FormControl<string | null>(null),
    parLevel: new FormControl<number | null>(0),
    date: new FormControl<Date | null>(new Date()),
    status: new FormControl<string | null>('In Stock'),
    remarks: new FormControl<string | null>(null),
    costs: new FormControl<number | null>(0),
    attachment: new FormControl<File | string | null>(null),
  });

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 10;
    this.Query.Filter = null;
    this.Query.OrderBy = 'CreatedAt';
    this.Query.Select = null;
    this.Query.Includes = null;
  }

  get totalPages(): number {
    const total = this.PagingSignal()?.totalElements ?? 0;
    const pageSize = this.Query.PageSize || 10;

    return Math.max(Math.ceil(total / pageSize), 1);
  }

  ngOnInit(): void {
    this.getCount();
    this.getDropdown();
    this.GetData();
  }

  // ---------------------------------------------------------
  // DATA
  // ---------------------------------------------------------

  getCount(): void {
    this.inventoryService
      .GetSummary()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.dashboardCount = res;
          this.cdr.markForCheck();
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Unable to load inventory summary.',
          });
        },
      });
  }

  GetData(): void {
    this.loadingService.start();

    this.inventoryService
      .GetMany(this.Query)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          const updatedRes = {
            ...res,
            data: (res.data ?? []).map((item) => ({
              ...item,
              attachment: item.attachment
                ? `${environment.AttachmentUrl}${item.attachment}`
                : '',
            })),
          };

          this.PagingSignal.set(updatedRes);
          this.loadingService.stop();
          this.cdr.markForCheck();
        },
        error: () => {
          this.loadingService.stop();

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Unable to load inventory items.',
          });
        },
      });
  }

  // ---------------------------------------------------------
  // FILTERS
  // ---------------------------------------------------------

  buildFilters(): string {
    const filters: string[] = [];

    if (this.search?.trim()) {
      filters.push(`ItemName=${this.search.trim()}`);
    }

    if (this.selectedSectionId && this.selectedSectionId !== 'All') {
      filters.push(`SectionId=${this.selectedSectionId}`);
    }

    if (this.selectedCategoryId && this.selectedCategoryId !== 'All') {
      filters.push(`CategoryId=${this.selectedCategoryId}`);
    }

    if (this.selectedStatus && this.selectedStatus !== 'All') {
      filters.push(`Status=${this.selectedStatus}`);
    }

    return filters.join(',');
  }

  applyFilters(): void {
    this.Query.Page = 1;
    this.Query.Filter = this.buildFilters();

    if (this.fTable) {
      this.fTable.first = 0;
    }

    this.GetData();
  }

  NextPage(event: TableLazyLoadEvent): void {
    if (event?.first !== undefined && event?.rows) {
      this.Query.Page = event.first / event.rows + 1;
      this.Query.PageSize = event.rows;
    }

    const sortText = BuildSortText(event);
    this.Query.OrderBy = sortText || 'ItemName';
    this.Query.Filter = this.buildFilters();

    this.GetData();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.applyFilters();
    }

    if (event.key === 'Backspace' && this.search.trim() === '') {
      this.applyFilters();
    }
  }

  Search(data: string): void {
    this.search = data;
    this.applyFilters();
  }

  ResetTable(): void {
    this.search = '';
    this.selectedCategoryId = 'All';
    this.selectedSectionId = 'All';
    this.selectedStatus = 'All';

    this.Query.Page = 1;
    this.Query.Filter = null;
    this.Query.OrderBy = 'ItemName';

    if (this.fTable) {
      this.fTable.first = 0;
    }

    this.GetData();
  }

  applyRestockFilter(): void {
    this.selectedStatus = 'Restock';
    this.Query.Page = 1;
    this.Query.Filter = this.buildFilters();

    if (this.fTable) {
      this.fTable.first = 0;
    }

    this.GetData();
  }

  changeMobilePage(direction: number): void {
    const nextPage = this.Query.Page + direction;

    if (nextPage < 1 || nextPage > this.totalPages) {
      return;
    }

    this.Query.Page = nextPage;
    this.Query.Filter = this.buildFilters();

    this.GetData();
  }

  // ---------------------------------------------------------
  // FORM
  // ---------------------------------------------------------

  initForm(): void {
    this.FG = new FormGroup({
      id: new FormControl<string | null>({
        value: null,
        disabled: true,
      }),

      itemCode: new FormControl<string | null>(null),
      itemName: new FormControl<string | null>(null, Validators.required),
      brand: new FormControl<string | null>(null),
      model: new FormControl<string | null>(null),
      categoryId: new FormControl<string | null>(null),
      description: new FormControl<string | null>(null),

      unit: new FormControl<string | null>(null, Validators.required),

      quantity: new FormControl<number | null>(0, [
        Validators.required,
        Validators.min(0),
      ]),

      reservedQuantity: new FormControl<number | null>(0),
      serialNumber: new FormControl<string | null>(null),
      referenceType: new FormControl<string | null>(null),
      referenceId: new FormControl<string | null>(null),
      locationId: new FormControl<string | null>(null),
      sectionId: new FormControl<string | null>(null),
      parLevel: new FormControl<number | null>(0),
      date: new FormControl<Date | null>(new Date()),
      status: new FormControl<string | null>('In Stock'),
      remarks: new FormControl<string | null>(null),
      costs: new FormControl<number | null>(0),
      attachment: new FormControl<File | string | null>(null),
    });
  }

  ActionClick(data: InventoryDto | null, action: string): void {
    if (action === 'Update' && data) {
      this.isUpdate = true;
      this.title = 'Edit Inventory Item';

      this.initForm();

      this.FG.get('id')?.enable();

      this.FG.patchValue({
        ...data,
        date: data.date ? new Date(data.date) : new Date(),
        attachment: null,
      });

      this.attachmentPreview = data.attachment
        ? data.attachment.startsWith('http')
          ? data.attachment
          : `${environment.AttachmentUrl}${data.attachment}`
        : null;

      this.visible = true;
      this.cdr.detectChanges();
      return;
    }

    if (action === 'add') {
      this.isUpdate = false;
      this.title = 'New Inventory Item';

      this.initForm();

      this.FG.reset({
        reservedQuantity: 0,
        quantity: 0,
        parLevel: 0,
        costs: 0,
        date: new Date(),
        status: 'In Stock',
      });

      this.attachmentPreview = null;
      this.visible = true;
      this.cdr.detectChanges();
    }
  }

  onInventoryDialogHide(): void {
    if (this.saving) {
      return;
    }

    this.visible = false;
    this.attachmentPreview = null;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    if (!allowedTypes.includes(file.type)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Invalid File',
        detail: 'Please select a JPG, PNG, WEBP or GIF image.',
      });

      input.value = '';
      return;
    }

    this.FG.patchValue({
      attachment: file,
    });

    this.FG.get('attachment')?.markAsDirty();

    const reader = new FileReader();

    reader.onload = () => {
      this.attachmentPreview = reader.result as string;
      this.cdr.markForCheck();
    };

    reader.readAsDataURL(file);
    input.value = '';
  }

  removeAttachment(): void {
    this.FG.patchValue({
      attachment: null,
    });

    this.attachmentPreview = null;
    this.FG.get('attachment')?.markAsDirty();
  }

  SaveInventory(): void {
    if (this.FG.invalid) {
      this.FG.markAllAsTouched();

      this.messageService.add({
        severity: 'error',
        summary: 'Required Fields',
        detail: 'Please complete the required inventory fields.',
      });

      return;
    }

    if (this.saving) {
      return;
    }

    this.saving = true;
    this.loadingService.start();

    const formData = new FormData();
    const formValue = this.FG.getRawValue();

    Object.keys(formValue).forEach((key) => {
      const value = formValue[key];

      if (key === 'attachment') {
        if (value instanceof File) {
          formData.append('attachment', value);
        } else if (typeof value === 'string' && value.trim()) {
          formData.append('attachment', value);
        }

        return;
      }

      if (value !== null && value !== undefined) {
        formData.append(
          key,
          value instanceof Date ? value.toISOString() : value.toString(),
        );
      }
    });

    const request$: Observable<any> = this.isUpdate
      ? this.inventoryService.Update(formData)
      : this.inventoryService.Create(formData);

    request$.pipe(takeUntil(this.ngUnsubscribe)).subscribe({
      next: (res) => {
        this.loadingService.stop();
        this.saving = false;

        if (!res) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Warning',
            detail: 'The inventory operation did not return a result.',
          });
          return;
        }

        const wasUpdate = this.isUpdate;
        const itemName = res.itemName || res.ItemName || 'Item';

        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Inventory: ${itemName} has been ${
            wasUpdate ? 'updated' : 'added'
          } successfully.`,
        });

        this.visible = false;
        this.attachmentPreview = null;
        this.isUpdate = false;

        // Refresh the current page to keep pagination and total records correct.
        this.GetData();
        this.getCount();

        // if (!wasUpdate) {
        //   this.openQrDialog(res);
        // }

        this.cdr.markForCheck();
      },

      error: (err: any) => {
        this.loadingService.stop();
        this.saving = false;

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail:
            err.error?.message ||
            err.error?.Message ||
            err.error?.error ||
            'Something went wrong. Please try again.',
        });

        this.cdr.markForCheck();
      },
    });
  }

  // ---------------------------------------------------------
  // DROPDOWNS
  // ---------------------------------------------------------

  mapToDropdown(data: { id: string; name: string }[]) {
    return (data ?? []).map((item) => ({
      label: item.name,
      value: item.id,
    }));
  }

  getDropdown(): void {
    this.inventoryService
      .GetDropdown()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.sectionSelection = this.mapToDropdown(res.sections);
          this.categorySelection = this.mapToDropdown(res.categories);
          this.locationSelection = this.mapToDropdown(res.locations);

          this.sectionFilter = [
            { label: 'All Sections', value: 'All' },
            ...this.sectionSelection,
          ];

          this.categoryFilter = [
            { label: 'All Categories', value: 'All' },
            ...this.categorySelection,
          ];

          this.cdr.markForCheck();
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Unable to load inventory dropdown options.',
          });
        },
      });
  }

  // ---------------------------------------------------------
  // ACTION MENU
  // ---------------------------------------------------------

  onEllipsisClick(event: Event, client: InventoryDto, menu: any): void {
    this.menuItems = [
      {
        label: 'Open Details',
        icon: 'pi pi-external-link',
        command: () => this.DetailsClick(client),
      },
      {
        label: 'Print QR',
        icon: 'pi pi-qrcode',
        command: () => this.openQrDialog(client),
      },
      {
        separator: true,
      },
      {
        label: 'Edit',
        icon: 'pi pi-pencil',
        command: () => this.ActionClick(client, 'Update'),
      },
      {
        label: 'Delete',
        icon: 'pi pi-trash',
        styleClass: 'text-red-600',
        command: () => this.DeleteInventory(client),
      },
    ];

    menu.toggle(event);
  }

  openItem(data: InventoryDto | any): void {
    const id = data?.id || data?.Id;

    if (!id) {
      return;
    }

    void this.router.navigate(['/inventory/item', id]);
  }

  openQrDialog(data: InventoryDto | any): void {
    const id = data?.id || data?.Id;

    if (!id) {
      return;
    }

    this.qrItemId = id;
    this.qrItemName = data.itemName || data.ItemName || null;
    this.qrItemCode = data.itemCode || data.ItemCode || null;

    this.qrVisible = true;
    this.cdr.markForCheck();
  }

  // ---------------------------------------------------------
  // DELETE
  // ---------------------------------------------------------

  DeleteInventory(data: InventoryDto): void {
    this.selectedItem = data;
    this.confirmDialog = true;
    this.cdr.markForCheck();
  }

  ConfirmDelete(): void {
    if (!this.selectedItem?.id || this.deleting) {
      return;
    }

    const item = this.selectedItem;

    this.deleting = true;
    this.loadingService.start();

    this.inventoryService
      .Delete(item.id)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();
          this.deleting = false;

          this.PagingSignal.update((state) => ({
            ...state,
            data: (state.data ?? []).filter((x: any) => x.id !== item.id),
            totalElements: Math.max((state.totalElements ?? 0) - 1, 0),
          }));

          if (this.dashboardCount) {
            this.dashboardCount = {
              ...this.dashboardCount,
              totalItems: Math.max(
                (this.dashboardCount.totalItems ?? 0) - 1,
                0,
              ),
            };

            switch (item.status) {
              case 'Low Stock':
                this.dashboardCount.lowStock = Math.max(
                  (this.dashboardCount.lowStock ?? 0) - 1,
                  0,
                );
                break;

              case 'In Stock':
                this.dashboardCount.inStock = Math.max(
                  (this.dashboardCount.inStock ?? 0) - 1,
                  0,
                );
                break;

              case 'Out of Stock':
                this.dashboardCount.outOfStock = Math.max(
                  (this.dashboardCount.outOfStock ?? 0) - 1,
                  0,
                );
                break;

              case 'Restock':
                this.dashboardCount.restock = Math.max(
                  (this.dashboardCount.restock ?? 0) - 1,
                  0,
                );
                break;
            }

            if ((item.reservedQuantity ?? 0) > 0) {
              this.dashboardCount.reserved = Math.max(
                (this.dashboardCount.reserved ?? 0) - 1,
                0,
              );
            }
          }

          this.confirmDialog = false;
          this.selectedItem = null;

          this.messageService.add({
            severity: 'success',
            summary: 'Deleted',
            detail: res?.message || 'Inventory deleted successfully.',
          });

          this.getCount();
          this.cdr.markForCheck();
        },

        error: (err: any) => {
          this.loadingService.stop();
          this.deleting = false;

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail:
              err.error?.message ||
              err.error?.Message ||
              err.error?.error ||
              'Failed to delete inventory.',
          });

          this.cdr.markForCheck();
        },
      });
  }

  // ---------------------------------------------------------
  // ITEM DETAILS
  // ---------------------------------------------------------

  DetailsClick(data: InventoryDto): void {
    this.selectedItem = data;
    this.detailVisible = true;
    this.cdr.markForCheck();
  }

  editSelectedItem(): void {
    if (!this.selectedItem) {
      return;
    }

    const item = this.selectedItem;

    this.detailVisible = false;
    this.ActionClick(item, 'Update');
  }

  // ---------------------------------------------------------
  // UI HELPERS
  // ---------------------------------------------------------

  getInitial(fullName?: string): string {
    if (!fullName?.trim()) {
      return '?';
    }

    const names = fullName.trim().split(/\s+/).filter(Boolean);

    if (names.length === 1) {
      return names[0].substring(0, 2).toUpperCase();
    }

    return (names[0].charAt(0) + names[1].charAt(0)).toUpperCase();
  }

  getProgress(quantity: number, parLevel: number): number {
    if (!parLevel || parLevel <= 0) {
      return 0;
    }

    return Math.min((quantity / parLevel) * 100, 100);
  }

  getStatusClass(status: string | null | undefined): string {
    switch (status) {
      case 'In Stock':
        return 'bg-green-100 text-green-700';

      case 'FOC':
        return 'bg-purple-100 text-purple-700';

      case 'Low Stock':
      case 'Restock':
        return 'bg-red-100 text-red-700 blink';

      case 'Faulty':
      case 'Faulty/Repair':
      case 'Under Repair':
        return 'bg-yellow-100 text-yellow-800';

      default:
        return 'bg-gray-100 text-gray-600';
    }
  }

  // ---------------------------------------------------------
  // CLEANUP
  // ---------------------------------------------------------

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();

    this.loadingService.stop();
  }
}
