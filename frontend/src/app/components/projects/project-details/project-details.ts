import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { LoadingService } from '../../../services/loading.service';
import { ProjectService } from '../../../services/ProjectService';
import { ProjectDto } from '../../../models/Project';
import { Subject, takeUntil } from 'rxjs';
import { TabsModule } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import {
  FormArray,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ProgressBarModule } from 'primeng/progressbar';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { MultiSelectModule } from 'primeng/multiselect';
import { TextareaModule } from 'primeng/textarea';
import { ValidateAllFormFields } from '../../../shared/helpers/helpers';
import { ProjectTaskService } from '../../../services/ProjectTaskService';
import { TagModule } from 'primeng/tag';
import { ChipModule } from 'primeng/chip';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { JobSheetDto } from '../../../models/JobSheets';
import { JobSheetService } from '../../../services/JobSheetService';
import { DrawerModule } from 'primeng/drawer';

@Component({
  selector: 'app-project-details',
  imports: [
    CommonModule,
    RouterLink,
    ButtonModule,
    TabsModule,
    TableModule,
    SelectModule,
    FormsModule,
    ProgressBarModule,
    DialogModule,
    ReactiveFormsModule,
    InputTextModule,
    DatePickerModule,
    MultiSelectModule,
    TextareaModule,
    TagModule,
    AvatarModule,
    ChipModule,
    TooltipModule,
    ConfirmDialogModule,
    DrawerModule,
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
          <div
            [routerLink]="'/projects'"
            class="cursor-pointer hover:text-gray-600"
          >
            Projects
          </div>
          <i class="pi pi-chevron-right text-[8px]! text-gray-500!"></i>
          <div class="text-gray-700 font-semibold">
            {{ PagingSignal().projectCode }}
          </div>
        </div>
      </div>

      <div
        class="flex flex-col lg:flex-row lg:items-center justify-between mt-4 gap-3"
      >
        <div class="flex flex-row items-center gap-3">
          <div
            class="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center"
          >
            <i class="pi pi-hammer text-blue-900! text-3xl!"></i>
          </div>
          <div class="flex flex-col gap-1">
            <div class="font-bold text-2xl text-gray-800">
              {{ PagingSignal()?.projectTitle }}
            </div>
            <span class="text-gray-500 tracking-wide"
              >PROJECT ID: {{ PagingSignal()?.projectCode }}</span
            >
          </div>
        </div>
        <div class="flex flex-row items-center gap-2">
          <p-select
            appendTo="body"
            [options]="[
              { label: 'Draft', value: 'Draft' },
              { label: 'Planning', value: 'Planning' },
              { label: 'WIP', value: 'WIP' },
              { label: 'On Hold', value: 'OnHold' },
              { label: 'Cancel', value: 'Cancelled' },
            ]"
            [(ngModel)]="PagingSignal().status"
          ></p-select>
          <p-button
            label="Export Report"
            icon="pi pi-file-pdf"
            severity="info"
            styleClass="bg-blue-800! px-5! border-none!"
          ></p-button>
        </div>
      </div>

      <div class="grid grid-cols-12 gap-4 justify-between mt-6">
        <div
          class="col-span-6 xl:col-span-3 border rounded-lg border-gray-200 bg-white p-5 flex flex-row items-center justify-between"
        >
          <div class="flex flex-col gap-2 w-full">
            <div class="text-gray-500">Project Progress</div>
            <div class="text-4xl text-gray-800 font-bold">0%</div>

            <div class="w-full">
              <p-progressbar
                [value]="50"
                [showValue]="false"
                [style]="{
                  height: '6px',
                }"
              />
            </div>
          </div>
        </div>
        <div
          class="col-span-6 xl:col-span-3 border rounded-lg border-gray-200 bg-white p-5 flex flex-row items-center justify-between"
        >
          <div class="flex flex-col gap-2 w-full">
            <div class="text-gray-500">Budget</div>
            <div class="text-3xl text-gray-800 font-bold">
              {{
                PagingSignal().estimatedBudget
                  | currency: 'RM ' : 'symbol' : '1.2-2'
              }}
            </div>
          </div>
          <div
            class="w-15 h-15 rounded-lg bg-green-100 flex items-center justify-center"
          >
            <i class="pi pi-money-bill text-green-700! text-4xl!"></i>
          </div>
        </div>
        <div
          class="col-span-6 xl:col-span-3 border rounded-lg border-gray-200 bg-white p-5 flex flex-row items-center justify-between"
        >
          <div class="flex flex-col gap-2">
            <div class="text-gray-500">Active Tasks</div>
            <div class="text-4xl text-gray-800 font-bold">0</div>
          </div>
          <div
            class="w-15 h-15 rounded-lg bg-blue-100 flex items-center justify-center"
          >
            <i class="pi pi-check-circle text-blue-700! text-4xl!"></i>
          </div>
        </div>

        <div
          class="col-span-6 xl:col-span-3 border rounded-lg border-gray-200 bg-white p-5 flex flex-row items-center justify-between"
        >
          <div class="flex flex-col gap-2">
            <div class="text-gray-500">Pending Materials</div>
            <div class="text-4xl text-gray-800 font-bold">0</div>
          </div>
          <div
            class="w-15 h-15 rounded-lg bg-amber-100 flex items-center justify-center"
          >
            <i class="pi pi-box text-amber-700! text-4xl!"></i>
          </div>
        </div>
      </div>

      <div class="bg-white mt-3 p-5 border border-gray-200 flex flex-col">
        <p-tabs value="0">
          <p-tablist>
            <p-tab value="0">Overview</p-tab>
            <p-tab value="1">Tasks</p-tab>
            <p-tab value="2">Material Requests</p-tab>
            <p-tab value="3">Job Sheets</p-tab>
          </p-tablist>
          <p-tabpanels>
            <p-tabpanel value="0">
              <div class="grid grid-cols-12 gap-10 justify-between mt-3">
                <div class="col-span-12 lg:col-span-8 flex flex-col gap-5">
                  <div class="flex flex-col gap-3">
                    <div class="uppercase text-lg font-semibold text-gray-700">
                      Project Description
                    </div>
                    <div class="tracking-wide text-gray-600 text-justify">
                      {{ PagingSignal().description }}
                    </div>
                  </div>
                  <div class="grid grid-cols-12 gap-5">
                    <div
                      class="col-span-12 xl:col-span-6 bg-gray-100 border border-gray-200 p-3 flex flex-col gap-3"
                    >
                      <div class="text-gray-500">Client</div>
                      <div class="flex flex-col gap-1">
                        <div class="font-semibold">
                          {{ PagingSignal().client?.name }}
                        </div>
                        <div class="flex flex-row items-center gap-2">
                          <i
                            class="pi pi-map-marker text-blue-700! text-sm!"
                          ></i>
                          <div class="text-gray-500 text-sm">
                            {{ PagingSignal().location }}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div
                      class="col-span-12 xl:col-span-6 bg-gray-100 border border-gray-200 p-3 flex flex-col gap-3"
                    >
                      <div class="flex flex-row items-center gap-2">
                        <div class="text-gray-500">Project Leader</div>
                      </div>
                      <div class="flex flex-row items-center gap-2">
                        <div
                          class="w-10 h-10 font-semibold text-blue-800 bg-blue-100 rounded-full flex items-center justify-center"
                        >
                          {{
                            getInitial(PagingSignal().projectLeader?.fullName)
                          }}
                        </div>
                        <div class="flex flex-col">
                          <div class="font-semibold">
                            {{ PagingSignal().projectLeader?.fullName }}
                          </div>
                          <div class="text-sm text-gray-500">
                            {{ PagingSignal().projectLeader?.jobTitle }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="flex flex-col gap-3 mt-4">
                    <div class="text-lg uppercase font-semibold">
                      Project Team
                    </div>
                    <div class="grid grid-cols-12 gap-4">
                      <ng-container
                        *ngFor="let member of PagingSignal().projectMembers"
                      >
                        <div
                          class="col-span-12 xl:col-span-6 flex flex-row items-center justify-between p-5 bg-gray-100 border border-gray-200"
                        >
                          <div class="flex flex-row items-center gap-2">
                            <div
                              class="w-10 h-10 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-semibold"
                            >
                              {{ getInitial(member.user?.fullName) }}
                            </div>
                            <div class="flex flex-col">
                              <div>{{ member.user?.fullName }}</div>
                              <div class="text-sm text-gray-500">
                                {{ member.user?.jobTitle }}
                              </div>
                            </div>
                          </div>
                        </div>
                      </ng-container>
                    </div>
                  </div>
                </div>

                <div
                  class="h-fit col-span-12 lg:col-span-4 border border-gray-200 p-5 bg-gray-100 flex flex-col gap-3"
                >
                  <div class="uppercase text-lg tracking-wide font-semibold">
                    TIMELINE
                  </div>

                  <div class="flex flex-row items-center justify-between">
                    <div>Start Date</div>
                    <div>
                      {{ PagingSignal().startDate | date: 'dd MMM, yyyy' }}
                    </div>
                  </div>
                  <div class="flex flex-row items-center justify-between">
                    <div>Est. Completion</div>
                    <div>
                      {{
                        PagingSignal().estimatedCompletedDate
                          | date: 'dd MMM, yyyy'
                      }}
                    </div>
                  </div>

                  <div class="border-b border-gray-300"></div>
                  <div class="flex flex-row items-center justify-between">
                    <div class="font-semibold">Remaining Days</div>

                    <div
                      [ngClass]="{
                        'text-red-600':
                          getRemainingDaysValue(
                            PagingSignal().estimatedCompletedDate
                          ) < 0,
                        'text-orange-500':
                          getRemainingDaysValue(
                            PagingSignal().estimatedCompletedDate
                          ) >= 0 &&
                          getRemainingDaysValue(
                            PagingSignal().estimatedCompletedDate
                          ) <= 7,
                        'text-blue-600':
                          getRemainingDaysValue(
                            PagingSignal().estimatedCompletedDate
                          ) > 7,
                      }"
                    >
                      {{
                        getRemainingDays(PagingSignal().estimatedCompletedDate)
                      }}
                    </div>
                  </div>
                </div>
              </div>
            </p-tabpanel>

            <p-tabpanel value="1">
              <div class="flex flex-row items-center justify-between mt-3">
                <div class="text-xl font-semibold">Milestone Tasks</div>
                <p-button
                  label="Add Task"
                  icon="pi pi-plus"
                  severity="contrast"
                  size="small"
                  styleClass="px-5! rounded-sm!"
                  (onClick)="OpenTaskDialog()"
                ></p-button>
              </div>

              <div class="mt-4">
                <p-table
                  #fTable
                  size="small"
                  [value]="PagingSignal().projectTasks"
                  [tableStyle]="{ 'min-width': '80rem' }"
                  styleClass="p-datatable-sm"
                  showGridlines
                  [rowHover]="true"
                  [scrollable]="true"
                  scrollHeight="400px"
                >
                  <ng-template pTemplate="header">
                    <tr>
                      <th class="bg-gray-100! w-[10%]!">Task ID</th>
                      <th class="bg-gray-100! w-[20%]!">Task Name</th>
                      <th class="bg-gray-100! w-[30%]!">Description</th>
                      <th class="bg-gray-100! text-center w-[10%]!">Status</th>
                      <th class="bg-gray-100! w-[15%]!">Assignee</th>
                      <th class="bg-gray-100! text-center! w-[10%]!">
                        Priority
                      </th>
                      <th class="bg-gray-100! text-center! w-[10%]!">Action</th>
                    </tr>
                  </ng-template>

                  <ng-template pTemplate="body" let-data>
                    <tr class="align-middle">
                      <td>
                        <span class="font-semibold text-blue-700">
                          {{ data.taskCode }}
                        </span>
                      </td>
                      <td>
                        <div class="font-medium">
                          {{ data.title }}
                        </div>
                      </td>
                      <td>
                        {{ data.description }}
                      </td>

                      <td class="text-center">
                        <p-tag
                          [value]="data.status"
                          [severity]="
                            data.status === 'Completed'
                              ? 'success'
                              : data.status === 'InProgress'
                                ? 'info'
                                : data.status === 'Review'
                                  ? 'warn'
                                  : data.status === 'Cancelled'
                                    ? 'danger'
                                    : data.status === 'OnHold'
                                      ? 'contrast'
                                      : 'secondary'
                          "
                        ></p-tag>
                      </td>

                      <td>
                        <div class="flex flex-wrap gap-2">
                          <ng-container
                            *ngFor="let member of data.assignedTaskMembers"
                          >
                            <p-avatar
                              [label]="getInitial(member.user?.fullName)"
                              shape="circle"
                              pTooltip="{{ member.user?.fullName }}"
                              tooltipPosition="top"
                              styleClass="cursor-pointer font-semibold! bg-blue-100! text-blue-800!"
                            ></p-avatar>
                          </ng-container>
                          <span
                            *ngIf="!data.assignedTaskMembers?.length"
                            class="text-gray-400 italic"
                          >
                            No assignee
                          </span>
                        </div>
                      </td>
                      <td class="text-center!">
                        <p-tag
                          [value]="data.priority"
                          [severity]="
                            data.priority === 'Critical'
                              ? 'danger'
                              : data.priority === 'High'
                                ? 'warn'
                                : data.priority === 'Medium'
                                  ? 'info'
                                  : 'success'
                          "
                          [rounded]="true"
                        >
                          <ng-template pTemplate="content">
                            <i
                              class="pi mr-1"
                              [ngClass]="{
                                'pi-exclamation-triangle':
                                  data.priority === 'Critical',
                                'pi-arrow-up': data.priority === 'High',
                                'pi-minus': data.priority === 'Medium',
                                'pi-arrow-down': data.priority === 'Low',
                              }"
                            ></i>
                            {{ data.priority }}
                          </ng-template>
                        </p-tag>
                      </td>
                      <td>
                        <div
                          class="flex justify-center gap-2"
                          *ngIf="
                            data.status !== 'Completed' &&
                            data.status !== 'Cancelled'
                          "
                        >
                          <button
                            pButton
                            icon="pi pi-pencil"
                            rounded
                            text
                            severity="warn"
                            (click)="EditTask(data)"
                          ></button>
                          <button
                            *ngIf="data.status === 'NotStarted'"
                            pButton
                            icon="pi pi-trash"
                            rounded
                            text
                            severity="danger"
                            (click)="RemoveTaskClick(data)"
                          ></button>
                        </div>
                      </td>
                    </tr>
                  </ng-template>

                  <ng-template pTemplate="emptymessage">
                    <tr>
                      <td colspan="100%">
                        <div class="py-8 text-center text-gray-500">
                          <i class="pi pi-inbox text-3xl mb-3"></i>
                          <div>No tasks assigned.</div>
                        </div>
                      </td>
                    </tr>
                  </ng-template>
                </p-table>
              </div>
            </p-tabpanel>
            <p-tabpanel value="2">
              <div class="mt-3 flex flex-row items-center justify-between">
                <div class="text-lg font-semibold">Material Procurement</div>
                <p-button
                  label="Request Materials"
                  icon="pi pi-shopping-cart"
                  severity="contrast"
                  size="small"
                  styleClass="px-5! rounded-sm!"
                ></p-button>
              </div>
              <div class="mt-3">
                <p-table
                  [value]="PagingSignal().materialRequests"
                  [lazy]="false"
                  [showGridlines]="true"
                  [expandedRowKeys]="expandedRows"
                  dataKey="id"
                  size="small"
                  [tableStyle]="{ 'min-width': '60rem' }"
                >
                  <ng-template #header>
                    <tr>
                      <th class="bg-gray-100! w-[25%]!">SKU/Item</th>
                      <th class="text-center! bg-gray-100! w-[15%]!">
                        Quantity
                      </th>
                      <th class="text-center! bg-gray-100! w-[10%]!">Status</th>
                      <th class="text-center! bg-gray-100! w-[15%]!">
                        Requested By
                      </th>
                      <th class="text-right! bg-gray-100! w-[15%]!">
                        Requested Date
                      </th>
                    </tr>
                  </ng-template>
                  <ng-template #body let-data let-expanded="expanded">
                    <tr>
                      <td>
                        <div class="flex items-center justify-center">
                          <p-button
                            pRipple
                            [pRowToggler]="data"
                            [text]="true"
                            severity="secondary"
                            [rounded]="true"
                            [icon]="
                              expanded
                                ? 'pi pi-chevron-down'
                                : 'pi pi-chevron-right'
                            "
                          />
                        </div>
                      </td>
                      <td class="text-center! font-semibold">
                        {{ data.documentNo }}
                      </td>
                      <td class="text-center!">
                        {{ data.requestDate | date: 'dd MMM, yyyy' }}
                      </td>
                      <td class="text-center!">
                        {{ data.materialItems?.length || 0 }}
                      </td>
                    </tr> </ng-template
                  ><ng-template pTemplate="rowexpansion" let-data>
                    <tr>
                      <td colspan="4">
                        <div class="p-4 bg-gray-50 border rounded-md">
                          <div class="font-semibold text-gray-700 mb-3">
                            Material Items
                          </div>

                          <p-table
                            [value]="data.materialItems"
                            [showGridlines]="true"
                            styleClass="p-datatable-sm"
                          >
                            <ng-template pTemplate="header">
                              <tr>
                                <th>Description</th>
                                <th>Brand</th>
                                <th>Type No</th>
                                <th>Unit</th>
                                <th class="text-right">Quantity</th>
                                <th>Remarks</th>
                              </tr>
                            </ng-template>

                            <ng-template pTemplate="body" let-item>
                              <tr>
                                <td>{{ item.description }}</td>
                                <td>{{ item.brand }}</td>
                                <td>{{ item.typeNo }}</td>
                                <td>{{ item.unit }}</td>
                                <td class="text-right">{{ item.quantity }}</td>
                                <td>{{ item.remarks }}</td>
                              </tr>
                            </ng-template>

                            <ng-template pTemplate="emptymessage">
                              <tr>
                                <td
                                  colspan="100%"
                                  class="text-center! text-gray-500 py-2!"
                                >
                                  No material items found.
                                </td>
                              </tr>
                            </ng-template>
                          </p-table>
                        </div>
                      </td>
                    </tr>
                  </ng-template>

                  <ng-template #emptymessage>
                    <tr>
                      <td colspan="100%">
                        <div
                          class="flex items-center justify-center text-gray-500 py-2!"
                        >
                          No request.
                        </div>
                      </td>
                    </tr>
                  </ng-template>
                </p-table>
              </div>
            </p-tabpanel>

            <p-tabpanel value="3">
              <div class="flex flex-row items-center justify-between mt-3">
                <div class="text-lg font-semibold">Job Sheet Logs</div>

                <p-button
                  label="Create Job Sheet"
                  icon="pi pi-clipboard"
                  severity="contrast"
                  size="small"
                  styleClass="px-5! rounded-sm!"
                  (onClick)="OpenJobSheetDialog()"
                ></p-button>
              </div>

              <div class="mt-4 grid grid-cols-12 gap-5">
                <ng-container *ngIf="jobSheets.length > 0; else noJobSheet">
                  <div
                    *ngFor="let item of jobSheets"
                    class="col-span-12 md:col-span-6 xl:col-span-4 p-4 bg-gray-100 border border-gray-200 flex flex-col justify-between h-32"
                  >
                    <div class="flex flex-row items-center justify-between">
                      <div class="flex flex-col gap-1">
                        <span class="text-sm text-gray-500">
                          JS: {{ item.jobSheetNo }}
                        </span>

                        <div class="font-semibold">
                          {{ item.workDescription }}
                        </div>
                      </div>

                      <i class="pi pi-clipboard text-blue-800! text-lg!"></i>
                    </div>

                    <div
                      class="flex flex-row items-center justify-between text-sm"
                    >
                      <div
                        class="font-semibold"
                        [ngClass]="{
                          'text-yellow-600': item.status === 'Draft',
                          'text-blue-700': item.status === 'In Progress',
                          'text-green-700': item.status === 'Completed',
                          'text-red-700': item.status === 'Rejected',
                        }"
                      >
                        {{ item.status }}
                      </div>

                      <div>
                        {{ item.workDate | date: 'MMM dd, yyyy' }}
                      </div>
                    </div>
                  </div>
                </ng-container>

                <ng-template #noJobSheet>
                  <div class="col-span-12 text-center text-gray-500 py-10">
                    No Job Sheet available
                  </div>
                </ng-template>
              </div>
            </p-tabpanel>
          </p-tabpanels></p-tabs
        >
      </div>
    </div>

    <p-dialog
      [(visible)]="deleteTaskDialog"
      [modal]="true"
      [draggable]="false"
      [closable]="false"
      [style]="{ width: '420px' }"
    >
      <ng-template #headless>
        <div class="p-6 flex flex-col items-center text-center">
          <div
            class="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4"
          >
            <i class="pi pi-trash text-red-600 text-2xl"></i>
          </div>

          <div class="text-xl font-semibold">Delete Task?</div>

          <div class="text-gray-500 mt-2">
            Are you sure you want to delete
            <span class="font-semibold"> {{ taskToDelete?.taskCode }} </span>?
          </div>

          <div class="flex justify-center gap-3 mt-6 w-full">
            <p-button
              label="No"
              severity="secondary"
              [outlined]="true"
              (onClick)="CancelDeleteTask()"
            ></p-button>

            <p-button
              label="Yes"
              severity="danger"
              (onClick)="ConfirmDeleteTask()"
              styleClass="bg-red-600! border-none!"
            ></p-button>
          </div>
        </div>
      </ng-template>
    </p-dialog>

    <p-dialog
      [(visible)]="taskDialog"
      [modal]="true"
      [draggable]="false"
      [closable]="true"
      (onHide)="taskDialog = false"
      styleClass="relative! border-0! bg-white! overflow-y-auto! w-[80%]! md:w-[50%]!"
    >
      <ng-template #headless>
        <div class="flex flex-col">
          <div
            class="px-5 pt-3 pb-2 flex flex-row items-center justify-between"
          >
            <div class="text-lg font-semibold">
              {{
                taskUpdate
                  ? 'Update Task: ' + selectedTask?.taskCode
                  : 'Add New Task'
              }}
            </div>
            <i
              class="pi pi-times text-gray-600! cursor-pointer!"
              (click)="taskDialog = false"
            ></i>
          </div>
          <div class="border-b border-gray-200 mb-2"></div>
          <div class="p-5 grid grid-cols-12 gap-4" [formGroup]="taskForm">
            <div class="col-span-12 flex flex-col gap-1">
              <div class="uppercase text-sm">Task Name</div>
              <input
                type="text"
                pInputText
                class="w-full"
                formControlName="title"
                placeholder="e.g., Pressure Valve Inspection"
              />
            </div>
            <div class="col-span-12 flex flex-col gap-1">
              <div class="uppercase text-sm">Description</div>
              <textarea
                name=""
                id=""
                pTextarea
                class="w-full"
                [rows]="4"
                [autoResize]="true"
                formControlName="description"
                placeholder="Describe the task requirements..."
              ></textarea>
            </div>
            <div class="col-span-4 flex flex-col gap-1">
              <div class="uppercase text-sm">Priority</div>
              <p-select
                formControlName="priority"
                appendTo="body"
                [options]="[
                  { label: 'Low', value: 'Low' },
                  { label: 'Medium', value: 'Medium' },
                  { label: 'High', value: 'High' },
                  { label: 'Critical', value: 'Critical' },
                ]"
              ></p-select>
            </div>
            <div class="col-span-4 flex flex-col gap-1">
              <div class="uppercase text-sm">Due Date</div>
              <p-datepicker
                formControlName="dueDate"
                showIcon="true"
                dateFormat="dd/mm/yy"
                placeholder="dd/mm/yyyy"
                styleClass="w-full!"
                appendTo="body"
              ></p-datepicker>
            </div>

            <div class="col-span-4 flex flex-col gap-1">
              <div class="uppercase text-sm">Status</div>
              <p-select
                formControlName="status"
                appendTo="body"
                [options]="[
                  { label: 'Not Started', value: 'NotStarted' },
                  { label: 'In Progress', value: 'InProgress' },
                  { label: 'On Hold', value: 'OnHold' },
                  { label: 'Review', value: 'Review' },
                  { label: 'Completed', value: 'Completed' },
                  { label: 'Cancelled', value: 'Cancelled' },
                ]"
              ></p-select>
            </div>

            <div class="col-span-12 flex flex-col gap-1">
              <div class="uppercase text-sm">Assignee</div>
              <p-multiselect
                formControlName="assignedUserIds"
                appendTo="body"
                [options]="userSelection"
                [filter]="true"
                placeholder="Select Team Member"
              ></p-multiselect>
            </div>
          </div>
          <div
            class="p-5 bg-gray-100 flex flex-row items-center justify-end gap-2"
          >
            <p-button
              label="Cancel"
              severity="secondary"
              [text]="true"
              (onClick)="taskDialog = false"
            ></p-button>
            <p-button
              (onClick)="SaveTask()"
              [label]="taskUpdate ? 'Save Changes' : 'Create Task'"
              severity="info"
              styleClass="bg-blue-800! px-5! border-none!"
            ></p-button>
          </div>
        </div>
      </ng-template>
    </p-dialog>

    <p-drawer
      [(visible)]="jobSheetDialog"
      position="right"
      [modal]="true"
      [dismissible]="true"
      [showCloseIcon]="false"
      styleClass="w-full md:w-[550px]!"
      [header]="
        taskUpdate
          ? 'Update JobSheet: ' + selectedJobSheet?.jobSheetNo
          : 'New JobSheet'
      "
    >
      <div class="grid grid-cols-12 gap-6" [formGroup]="jobSheetForm">
        <div class="col-span-12 flex flex-col gap-1">
          <div class="uppercase text-sm">Job Sheet No</div>
          <input
            type="text"
            pInputText
            class="w-full"
            formControlName="jobSheetNo"
          />
        </div>
        <div class="col-span-12 flex flex-col gap-1">
          <div class="uppercase text-sm">Line Task</div>
          <p-select
            formControlName="projectTaskId"
            appendTo="body"
            optionLabel="title"
            optionValue="id"
            [options]="PagingSignal().projectTasks"
          ></p-select>
        </div>
        <div class="col-span-12 flex flex-col gap-1">
          <div class="uppercase text-sm">Technician Assignment</div>
          <p-multiselect
            formControlName="members"
            appendTo="body"
            [options]="userSelection"
            [filter]="true"
            placeholder="Select Team Member"
          ></p-multiselect>
        </div>
        <div class="col-span-4 flex flex-col gap-1">
          <div class="uppercase text-sm">Date</div>
          <p-datepicker
            formControlName="workDate"
            showIcon="true"
            dateFormat="dd/mm/yy"
            placeholder="dd/mm/yyyy"
            styleClass="w-full!"
            appendTo="body"
          ></p-datepicker>
        </div>
        <div class="col-span-4 flex flex-col gap-1">
          <div class="uppercase text-sm">Start Time</div>
          <p-datepicker
            formControlName="startTime"
            [timeOnly]="true"
            hourFormat="24"
            showIcon="true"
            placeholder="HH:mm"
            styleClass="w-full!"
            appendTo="body"
          ></p-datepicker>
        </div>
        <div class="col-span-4 flex flex-col gap-1">
          <div class="uppercase text-sm">End Time</div>
          <p-datepicker
            formControlName="endTime"
            [timeOnly]="true"
            hourFormat="24"
            showIcon="true"
            placeholder="HH:mm"
            styleClass="w-full!"
            appendTo="body"
          ></p-datepicker>
        </div>
        <div class="col-span-12 flex flex-col gap-1">
          <div class="uppercase text-sm">Work Description</div>
          <textarea
            name=""
            id=""
            pTextarea
            class="w-full"
            [rows]="4"
            [autoResize]="true"
            formControlName="workDescription"
            placeholder="Describe the work performed..."
          ></textarea>
        </div>

        <div class="col-span-12 flex flex-col gap-1">
          <div class="uppercase text-sm">Remarks</div>
          <input
            type="text"
            pInputText
            class="w-full"
            placeholder="Additional notes..."
            formControlName="remarks"
          />
        </div>
      </div>
      <ng-template #footer>
        <p-button
          (onClick)="SaveJobSheet()"
          class="w-full!"
          [label]="taskUpdate ? 'Save Changes' : 'Save JobSheet'"
          styleClass="rounded-sm! bg-sky-700! w-full! border-none!"
        ></p-button>
      </ng-template>
    </p-drawer> `,
  styleUrl: './project-details.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetails implements OnInit, OnDestroy {
  private readonly loadingService = inject(LoadingService);
  private readonly projectService = inject(ProjectService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly jobSheetService = inject(JobSheetService);
  private readonly projectTaskService = inject(ProjectTaskService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  PagingSignal = signal<ProjectDto>({} as ProjectDto);
  projectId: string | null = null;
  expandedRows: { [key: string]: boolean } = {};
  userSelection: any;

  taskDialog: boolean = false;
  taskUpdate: boolean = false;
  deleteTaskDialog: boolean = false;

  materialDialog: boolean = false;
  materialUpdate: boolean = false;
  deleteMaterialDialog: boolean = false;

  jobSheetDialog: boolean = false;
  jobSheetUpdate: boolean = false;
  deleteJobSheetDialog: boolean = false;

  confirmationPopup: boolean = false;
  confirmMessage: string = '';
  taskToDelete: any = null;

  taskForm!: FormGroup;
  materialForm!: FormGroup;
  jobSheetForm!: FormGroup;

  selectedTask: any;
  selectedMaterial: any;
  selectedJobSheet: any;

  jobSheets: JobSheetDto[] = [];

  ngOnInit(): void {
    this.initJobSheetForm();

    this.projectId = this.activatedRoute.snapshot.queryParams['id'];
    this.GetData();
  }

  GetData() {
    this.loadingService.start();
    this.projectService
      .GetOne({
        Page: 1,
        PageSize: 1,
        OrderBy: null,
        Select: null,
        Includes: 'ProjectMembers, ProjectTasks',
        Filter: `Id=${this.projectId}`,
      })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();

          if (res) {
            res.projectTasks =
              res.projectTasks?.sort((a: any, b: any) => {
                return (
                  new Date(a.createdAt).getTime() -
                  new Date(b.createdAt).getTime()
                );
              }) ?? [];

            this.PagingSignal.set(res);
            this.cdr.markForCheck();
          }
        },
        error: (err) => {
          this.loadingService.stop();
        },
      });
  }

  ActionClick(type: string) {
    if (type === 'requestMaterial') {
      this.router.navigate(['/material-requests/form'], {
        queryParams: {
          projectId: this.PagingSignal()?.id,
        },
      });
    }
  }

  getInitial(fullName?: string): string {
    if (!fullName?.trim()) return '?';

    const names = fullName.trim().split(/\s+/).filter(Boolean);

    if (names.length === 1) {
      return names[0].substring(0, 2).toUpperCase();
    }

    return (names[0].charAt(0) + names[1].charAt(0)).toUpperCase();
  }

  getRemainingDaysValue(date: Date | string | null | undefined): number {
    if (!date) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const target = new Date(date);
    target.setHours(0, 0, 0, 0);

    return Math.ceil(
      (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
  }

  getRemainingDays(date: Date | string | null | undefined): string {
    const days = this.getRemainingDaysValue(date);

    if (days > 0) return `${days} days`;
    if (days === 0) return 'Today';

    return `${Math.abs(days)} days overdue`;
  }

  OpenTaskDialog() {
    this.getUserDropdown();
    this.initTaskForm();
    this.taskDialog = true;
  }

  EditTask(task: any) {
    this.selectedTask = task;
    this.taskUpdate = true;
    this.OpenTaskDialog();
  }

  getUserDropdown() {
    const project = this.PagingSignal();

    const members =
      project.projectMembers?.map((x) => ({
        label: x.user?.fullName,
        value: x.userId,
      })) ?? [];

    const projectLeader = project.projectLeader
      ? [
          {
            label: project.projectLeader.fullName,
            value: project.projectLeaderId,
          },
        ]
      : [];

    this.userSelection = [...projectLeader, ...members].filter(
      (item, index, self) =>
        index === self.findIndex((x) => x.value === item.value),
    );
  }

  initTaskForm() {
    this.taskForm = new FormGroup({
      id: new FormControl<string | null>({ value: null, disabled: true }),
      projectId: new FormControl(this.PagingSignal().id),
      title: new FormControl(null, Validators.required),
      description: new FormControl(null),
      priority: new FormControl('Low'),
      status: new FormControl('NotStarted'),
      dueDate: new FormControl<Date | null>(null),
      assignedUserIds: new FormControl<string[]>([]),
    });

    if (!this.taskUpdate || !this.selectedTask) {
      return;
    }

    this.taskForm.get('id')?.enable();

    this.taskForm.patchValue({
      id: this.selectedTask.id,
      projectId: this.selectedTask.projectId,
      title: this.selectedTask.title,
      description: this.selectedTask.description,
      priority: this.selectedTask.priority,
      dueDate: this.selectedTask.dueDate
        ? new Date(this.selectedTask.dueDate)
        : null,
      assignedUserIds:
        this.selectedTask.assignedTaskMembers?.map((x: any) => x.userId) ?? [],
    });
  }

  SaveTask() {
    if (this.taskForm.invalid) {
      ValidateAllFormFields(this.taskForm);
      return;
    }

    this.loadingService.start();

    const request = this.taskForm.getRawValue();

    const $request = this.taskUpdate
      ? this.projectTaskService.Update(request)
      : this.projectTaskService.Create(request);

    $request.pipe(takeUntil(this.ngUnsubscribe)).subscribe({
      next: (task) => {
        this.loadingService.stop();

        this.PagingSignal.update((project) => {
          if (this.taskUpdate) {
            return {
              ...project,
              projectTasks: project.projectTasks.map((t) =>
                t.id === task.id ? task : t,
              ),
            };
          }

          return {
            ...project,
            projectTasks: [...project.projectTasks, task],
          };
        });

        this.taskDialog = false;
        this.taskUpdate = false;
        this.selectedTask = null;
        this.taskForm.reset();

        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingService.stop();
      },
    });
  }

  RemoveTaskClick(task: any) {
    this.taskToDelete = task;
    this.deleteTaskDialog = true;
  }

  ConfirmDeleteTask() {
    if (!this.taskToDelete) return;

    this.DeleteTask(this.taskToDelete.id);

    this.deleteTaskDialog = false;
    this.taskToDelete = null;
  }

  CancelDeleteTask() {
    this.deleteTaskDialog = false;
    this.taskToDelete = null;
  }

  DeleteTask(id: string) {
    this.loadingService.start();

    this.projectTaskService
      .Delete(id)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: () => {
          this.loadingService.stop();

          this.PagingSignal.update((project) => ({
            ...project,
            projectTasks: project.projectTasks.filter((x) => x.id !== id),
          }));

          this.cdr.markForCheck();
        },
        error: () => {
          this.loadingService.stop();
        },
      });
  }

  OpenMaterialDialog() {
    this.initMaterialForm();
    this.materialDialog = true;
  }

  EditMaterial(material: any) {
    this.selectedMaterial = material;
    this.materialDialog = true;
    this.OpenMaterialDialog();
  }

  initMaterialForm() {
    this.materialForm = new FormGroup({
      id: new FormControl<string | null>({ value: null, disabled: true }),
      projectId: new FormControl(this.PagingSignal().id),
      description: new FormControl(null),
      brand: new FormControl<string | null>(null),
      unit: new FormControl<string>('Nos'),
      quantity: new FormControl<number>(1),
      requiredAt: new FormControl<Date | null>(null),
      remarks: new FormControl<string | null>(null),
      supplierId: new FormControl<string | null>(null),
    });

    if (!this.materialUpdate || !this.selectedMaterial) {
      return;
    }

    this.materialForm.get('id')?.enable();

    this.materialForm.patchValue({
      id: this.selectedMaterial.id,
      projectId: this.selectedMaterial.projectId,
      description: this.selectedMaterial.description,
      brand: this.selectedMaterial.brand,
      unit: this.selectedMaterial.unit,
      quantity: this.selectedMaterial.quantity,
      requiredAt: this.selectedMaterial.requiredAt,
      remarks: this.selectedMaterial.remarks,
      supplierId: this.selectedMaterial.supplierId,
    });
  }

  //JobSheet
  OpenJobSheetDialog() {
    this.getUserDropdown();
    this.jobSheetDialog = true;
  }

  EditJobSheet(jobsheet: any) {
    this.selectedJobSheet = jobsheet;
    this.jobSheetDialog = true;
    this.OpenJobSheetDialog();
  }

  initJobSheetForm() {
    this.jobSheetForm = new FormGroup({
      id: new FormControl<string | null>({
        value: null,
        disabled: true,
      }),

      projectTaskId: new FormControl<string | null>(null),

      jobSheetNo: new FormControl<string | null>(null),

      workDate: new FormControl<Date | null>(null),
      startTime: new FormControl<Date | null>(null),
      endTime: new FormControl<Date | null>(null),
      workDescription: new FormControl<string | null>(null),

      status: new FormControl<string | null>('Draft'),

      remarks: new FormControl<string | null>(null),

      members: new FormControl<any[]>([]),

      files: new FormControl<File[] | null>(null),
    });

    this.jobSheetForm
      .get('projectTaskId')
      ?.valueChanges.pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((taskId: string | null) => {
        this.onProjectTaskChange(taskId);
      });

    if (!this.jobSheetUpdate || !this.selectedJobSheet) {
      return;
    }

    this.jobSheetForm.get('id')?.enable();

    this.jobSheetForm.patchValue({
      id: this.selectedJobSheet.id,
      projectTaskId: this.selectedJobSheet.projectTaskId,
      jobSheetNo: this.selectedJobSheet.jobSheetNo,
      workDate: this.selectedJobSheet.workDate
        ? new Date(this.selectedJobSheet.workDate)
        : null,
      startTime: this.selectedJobSheet.startTime
        ? new Date(this.selectedJobSheet.startTime)
        : null,
      endTime: this.selectedJobSheet.endTime
        ? new Date(this.selectedJobSheet.endTime)
        : null,
      workDescription: this.selectedJobSheet.workDescription,
      status: this.selectedJobSheet.status,
      members: this.selectedJobSheet.members ?? [],
    });
  }

  onProjectTaskChange(taskId: string | null) {
    if (!taskId) {
      this.jobSheetForm.patchValue({
        members: [],
      });

      return;
    }

    const task = this.PagingSignal().projectTasks?.find(
      (x: any) => x.id === taskId,
    );

    if (!task) {
      this.jobSheetForm.patchValue({
        members: [],
      });

      return;
    }

    const members: string[] =
      task.assignedTaskMembers?.map((member: any) => member.userId) ?? [];

    this.jobSheetForm.patchValue({
      members,
    });
  }

  SaveJobSheet() {
    if (this.jobSheetForm.invalid) {
      ValidateAllFormFields(this.jobSheetForm);
      return;
    }

    this.loadingService.start();

    const value = this.jobSheetForm.getRawValue();

    const formData = new FormData();

    formData.append('JobSheetNo', value.jobSheetNo ?? '');

    formData.append('ProjectId', this.projectId!);

    if (value.projectTaskId) {
      formData.append('ProjectTaskId', value.projectTaskId);
    }

    if (value.workDate) {
      formData.append('WorkDate', new Date(value.workDate).toISOString());
    }

    if (value.startTime) {
      formData.append('StartTime', new Date(value.startTime).toISOString());
    }

    if (value.endTime) {
      formData.append('EndTime', new Date(value.endTime).toISOString());
    }

    formData.append('WorkDescription', value.workDescription ?? '');

    formData.append('Remarks', value.remarks ?? '');

    const members = value.members ?? [];

    members.forEach((member: any, index: number) => {
      formData.append(`Members[${index}].UserId`, member.userId ?? member);

      formData.append(
        `Members[${index}].IsLeader`,
        String(member.isLeader ?? false),
      );
    });

    if (value.files?.length) {
      value.files.forEach((file: File) => {
        formData.append('Files', file, file.name);
      });
    }

    const $request = this.jobSheetUpdate
      ? this.jobSheetService.Update(formData)
      : this.jobSheetService.Create(formData);

    $request.pipe(takeUntil(this.ngUnsubscribe)).subscribe({
      next: (jobsheet) => {
        this.loadingService.stop();

        this.PagingSignal.update((project) => {
          if (this.jobSheetUpdate) {
            return {
              ...project,
              jobSheets: project.jobSheets?.map((t) =>
                t.id === jobsheet.id ? jobsheet : t,
              ),
            };
          }

          return {
            ...project,
            jobSheets: [...(project.jobSheets ?? []), jobsheet],
          };
        });

        this.jobSheetDialog = false;
        this.jobSheetUpdate = false;
        this.selectedJobSheet = null;

        this.jobSheetForm.reset();

        this.cdr.markForCheck();
      },

      error: (error) => {
        this.loadingService.stop();

        console.error('Failed to save Job Sheet:', error);
      },
    });
  }

  get members(): FormArray {
    return this.jobSheetForm.get('members') as FormArray;
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
