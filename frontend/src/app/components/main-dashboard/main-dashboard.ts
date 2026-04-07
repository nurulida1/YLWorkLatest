import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { UserService } from '../../services/userService.service';
import { QuotationStatus, UserRole } from '../../shared/enum/enum';
import { ChartModule } from 'primeng/chart';
import { LoadingService } from '../../services/loading.service';
import { AppService } from '../../services/appService.service';
import { Subject, takeUntil } from 'rxjs';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import ApexCharts from 'apexcharts';
import { KnobModule } from 'primeng/knob';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ProgressBarModule } from 'primeng/progressbar';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';

@Component({
  selector: 'app-main-dashboard',
  imports: [
    CommonModule,
    ChartModule,
    TableModule,
    TagModule,
    KnobModule,
    FormsModule,
    SelectModule,
    ButtonModule,
    ProgressBarModule,
    AvatarModule,
  ],
  template: `
    <div class="min-h-[93.5vh] bg-gray-100 p-5 md:p-8 2xl:py-5 2xl:px-[2%]">
      <div class="grid grid-cols-12 gap-4" *ngIf="role === 'SuperAdmin'">
        <div class="col-span-12 lg:col-span-6">
          <div class="grid grid-cols-12 gap-4 w-full">
            <div
              class="col-span-12 md:col-span-6 h-[100px] bg-white border-gray-200 border p-3 2xl:p-5 rounded-2xl flex flex-row items-center justify-between gap-3"
            >
              <div
                class="w-10 2xl:w-13 h-10 2xl:h-13 rounded-2xl bg-gray-100 flex items-center justify-center"
              >
                <div
                  class="pi pi-users text-lg! 2xl:text-2xl! text-gray-700!"
                ></div>
              </div>
              <div class="flex flex-col gap-2 text-center">
                <div class="text-gray-600 text-[14px] 2xl:text-base">
                  Total Users
                </div>
                <div
                  class="font-extrabold text-[30px] 2xl:text-[35px] text-gray-800"
                >
                  {{ dashboardSummary?.Employees?.total }}
                </div>
              </div>
            </div>
            <div
              class="col-span-12 md:col-span-6 h-[100px] bg-white border-gray-200 border p-3 2xl:p-5 rounded-2xl flex flex-row items-center justify-between gap-3"
            >
              <div
                class="w-10 2xl:w-13 h-10 2xl:h-13 rounded-2xl bg-gray-100 flex items-center justify-center"
              >
                <div
                  class="pi pi-users text-lg! 2xl:text-2xl! text-gray-700!"
                ></div>
              </div>
              <div class="flex flex-col gap-2 text-center">
                <div class="text-gray-600 text-[14px] 2xl:text-base">
                  Active Users
                </div>
                <div
                  class="font-extrabold text-[30px] 2xl:text-[35px] text-gray-800"
                >
                  {{ dashboardSummary?.Employees?.active }}
                </div>
              </div>
            </div>
            <div
              class="col-span-12 h-[280px] rounded-2xl bg-white border border-gray-200 p-5 flex flex-col"
            >
              <div class="text-[18px] font-semibold text-gray-700 mb-2">
                Daily User Login
              </div>

              <div class="flex-1 w-full">
                <div id="userLoginAreaChart" class="flex-1 w-full"></div>
              </div>
            </div>
          </div>
        </div>
        <div
          class="col-span-12 lg:col-span-6 h-[405px] bg-gray-200 border-gray-200 border rounded-2xl flex flex-col"
        >
          <div class="h-[75%] flex flex-col bg-white p-5 rounded-2xl">
            <div
              class="flex flex-col md:flex-row lg:flex-col 2xl:flex-row items-center justify-between"
            >
              <div
                class="flex flex-row items-center gap-3"
                *ngIf="dashboardSummary?.SystemLoadTrend"
              >
                <div class="text-[18px] 2xl:text-[20px] font-semibold">
                  System Health
                </div>
                <div class="flex flex-row items-center gap-1 mt-1">
                  <div
                    class="pi pi-circle-fill text-[5px]!"
                    [ngClass]="{
                      'text-green-500 blink':
                        dashboardSummary?.SystemLoadTrend?.apiRunning,
                      'text-red-500':
                        !dashboardSummary?.SystemLoadTrend?.apiRunning,
                    }"
                  ></div>

                  <div
                    class="text-sm"
                    [ngClass]="{
                      'text-green-600':
                        dashboardSummary?.SystemLoadTrend?.apiRunning,
                      'text-red-600':
                        !dashboardSummary?.SystemLoadTrend?.apiRunning,
                    }"
                  >
                    Api Running
                  </div>
                </div>
              </div>
              <div class="text-gray-500 text-sm">
                Last Updated:
                {{
                  dashboardSummary?.SystemLoadTrend?.timestamp
                    | date: 'dd MMM, yyyy hh:mm aa'
                }}
              </div>
            </div>
            <div
              class="w-full h-full flex justify-center items-center"
              *ngIf="dashboardSummary?.SystemLoadTrend"
            >
              <p-knob
                [(ngModel)]="dashboardSummary.SystemLoadTrend.cpuUsage"
                valueTemplate="{value}%"
                [size]="180"
                [readonly]="true"
              />
            </div>
          </div>
          <div class="flex flex-row items-center justify-between h-[25%]">
            <div
              class="flex-1 border-r border-gray-300 flex flex-col items-center gap-3"
            >
              <div class="text-gray-500">CPU</div>
              <div class="font-semibold text-[20px] text-gray-800">
                {{ dashboardSummary?.SystemLoadTrend.cpuUsage }}%
              </div>
            </div>
            <div
              class="flex-1 border-r border-gray-300 flex flex-col items-center gap-3"
            >
              <div class="text-gray-500">Memory</div>
              <div class="font-semibold text-[20px] text-gray-800">
                {{ dashboardSummary?.SystemLoadTrend.memoryUsageMb }} MB
              </div>
            </div>
            <div class="flex-1 flex flex-col items-center gap-3">
              <div class="text-gray-500">Disk</div>
              <div class="font-semibold text-[20px] text-gray-800">
                {{ dashboardSummary?.SystemLoadTrend.diskFreeGb }} GB
              </div>
            </div>
          </div>
        </div>
        <div
          class="col-span-12 lg:col-span-6 2xl:col-span-8 border border-gray-200 min-h-[350px] bg-white rounded-2xl flex flex-col p-5"
        >
          <div class="text-[20px] font-semibold text-gray-700">
            Recent Activities
          </div>
          <div class="flex flex-col mt-7 gap-3">
            <ng-container
              *ngFor="
                let activity of dashboardSummary?.RecentActivities;
                let last = last
              "
            >
              <div
                class="flex flex-col gap-1 pb-2"
                [ngClass]="{ 'border-b border-gray-200': !last }"
              >
                <div class="text-[15px]">{{ activity.message }}</div>
                <div class="text-[13px] text-gray-500">
                  {{ activity.createdAt | date: 'dd MMMM, yyyy hh:mm aa' }}
                </div>
              </div>
            </ng-container>
          </div>
        </div>
        <div
          class="col-span-12 lg:col-span-6 2xl:col-span-4 border border-gray-200 min-h-[350px] bg-white rounded-2xl p-5 flex flex-col"
        >
          <div class="text-[20px] font-semibold text-gray-700">
            Monthly Purchase Orders
          </div>
          <div class="flex-1">
            <div id="poPerMonthChart" class="flex-1"></div>
          </div>
        </div>
      </div>

      <div
        *ngIf="role === 'Admin'"
        class="flex flex-row items-center justify-end gap-2 pb-2"
      >
        <div
          class="flex flex-row items-center gap-2 border-r border-gray-300 pr-2"
        >
          <div class="text-gray-500 text-[14px]">Today</div>
          <div class="pi pi-calendar text-gray-500! text-[14px]!"></div>
        </div>
        <div class="flex flex-row items-center gap-2">
          <div class="text-gray-500 text-[14px]">Download report</div>
          <div class="pi pi-download text-gray-500! text-[14px]!"></div>
        </div>
      </div>
      <div class="grid grid-cols-12 gap-3" *ngIf="role === 'Admin'">
        <div class="col-span-12 2xl:col-span-8 grid grid-cols-12 gap-3">
          <div
            class="col-span-12 md:col-span-4 border bg-white border-gray-200 rounded-lg h-[130px] md:h-[150px] flex flex-col justify-between p-5"
          >
            <div class="flex flex-row items-center gap-2">
              <i class="pi pi-receipt text-gray-500! text-[14px]!"></i>
              <div class="text-gray-500 text-[14px]">Total Invoices</div>
            </div>

            <div class="flex flex-col">
              <div class="font-semibold text-[35px]">
                {{ dashboardSummary?.Invoices.total }}
              </div>
              <div class="flex flex-row items-center gap-2">
                <i class="pi pi-chart-line text-[14px]! text-green-600!"></i>
                <div class="text-[13px] text-gray-500">
                  <b class="text-green-600"
                    >({{ dashboardSummary?.Invoices.growthPercent }}%)</b
                  >
                  Since last month
                </div>
              </div>
            </div>
          </div>
          <div
            class="col-span-12 md:col-span-4 border bg-white border-gray-200 rounded-lg h-[130px] md:h-[150px] flex flex-col justify-between p-5"
          >
            <div class="flex flex-row items-center gap-2">
              <i class="pi pi-file text-gray-500! text-[14px]!"></i>
              <div class="text-gray-500 text-[14px]">Total Quotations</div>
            </div>

            <div class="flex flex-col">
              <div class="font-semibold text-[35px]">
                {{ dashboardSummary?.Quotations.total }}
              </div>
              <div class="flex flex-row items-center gap-2">
                <i class="pi pi-chart-line text-[14px]! text-green-600!"></i>
                <div class="text-[13px] text-gray-500">
                  <b class="text-green-600"
                    >( {{ dashboardSummary?.Quotations.growthPercent }}%)</b
                  >
                  Since last month
                </div>
              </div>
            </div>
          </div>
          <div
            class="col-span-12 md:col-span-4 border bg-white border-gray-200 rounded-lg h-[130px] md:h-[150px] flex flex-col justify-between p-5"
          >
            <div class="flex flex-row items-center gap-2">
              <i class="pi pi-money-bill text-gray-500! text-[14px]!"></i>
              <div class="text-gray-500 text-[14px]">Total POs</div>
            </div>

            <div class="flex flex-col">
              <div class="font-semibold text-[35px]">
                {{ dashboardSummary?.PurchaseOrders.total }}
              </div>
              <div class="flex flex-row items-center gap-2">
                <i class="pi pi-chart-line text-[14px]! text-green-600!"></i>
                <div class="text-[13px] text-gray-500">
                  <b class="text-green-600"
                    >({{ dashboardSummary?.PurchaseOrders.growthPercent }}%)</b
                  >
                  Since last month
                </div>
              </div>
            </div>
          </div>
          <div
            class="col-span-12 border bg-white border-gray-200 rounded-lg h-[400px] flex flex-col p-5"
          >
            <div class="flex flex-row justify-between items-start">
              <div class="flex flex-col gap-1">
                <div class="text-gray-600 text-sm md:text-base">
                  Revenue Over Time
                </div>
                <div class="flex flex-col md:flex-row md:items-center gap-2">
                  <div
                    class="text-[20px] md:text-[25px] font-bold tracking-wide"
                  >
                    {{ dashboardSummary?.Revenue.total | currency: 'RM ' }}
                  </div>
                  <div
                    class="text-green-600 text-[11px] md:text-[13px] rounded-full w-fit px-3 py-0.5 bg-green-50"
                  >
                    {{ dashboardSummary?.Revenue.growthPercent }}% Increased
                  </div>
                </div>
              </div>
              <p-select
                appendTo="body"
                styleClass="text-[12px]! md:text-[14px]!"
                panelStyleClass="text-[12px]! md:text-[14px]!"
                [options]="[
                  { label: 'This Week', value: 'Week' },
                  { label: 'This Month', value: 'Month' },
                  { label: 'Last Month', value: 'Last Month' },
                ]"
              ></p-select>
            </div>
            <div class="h-[300px] border border-gray-200 mt-5">
              <div class="flex-1">
                <div class="w-full h-64" #revenueChart></div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-span-12 2xl:col-span-4 grid grid-cols-12 gap-3">
          <div
            class="col-span-12 border bg-white border-gray-200 rounded-lg min-h-[500px] 2xl:h-[563px] flex flex-col p-5"
          >
            <div class="flex flex-row items-center justify-between">
              <div
                class="text-gray-700 font-semibold text-[15px] md:text-[18px]"
              >
                Quotes Status by Time
              </div>
              <p-select
                appendTo="body"
                styleClass="text-[12px]! md:text-[14px]!"
                panelStyleClass="text-[12px]! md:text-[14px]!"
                [options]="[
                  { label: 'This Week', value: 'Week' },
                  { label: 'This Month', value: 'Month' },
                  { label: 'Last Month', value: 'Last Month' },
                ]"
              ></p-select>
            </div>
            <div class="mt-5 flex justify-center">
              <div class="w-full h-[300px] border border-gray-200">
                <p-chart
                  type="pie"
                  [data]="quotationChartData"
                  [options]="quotationChartOptions"
                  class="w-full h-full flex justify-center items-center"
                ></p-chart>
              </div>
            </div>
            <div class="border-b border-gray-200 mt-2 mb-2"></div>
            <div class="flex flex-col gap-2">
              <ng-container
                *ngFor="let quoteStatus of dashboardSummary?.Quotations.status"
              >
                <div class="flex flex-row items-center justify-between">
                  <div class="flex flex-row items-center gap-2">
                    <i
                      class="pi pi-circle-fill text-[8px]!"
                      [ngClass]="{
                        'text-green-500!': quoteStatus.status === 'Approved',
                        'text-yellow-500!': quoteStatus.status === 'Pending',
                        'text-red-500!': quoteStatus.status === 'Rejected',
                      }"
                    ></i>
                    <div class="text-gray-600 text-[13px] md:text-[15px]">
                      {{ quoteStatus.status }}
                    </div>
                  </div>
                  <div class="font-semibold text-[20px]">
                    {{ quoteStatus.count }}
                  </div>
                </div>
              </ng-container>
            </div>
          </div>
        </div>

        <div
          class="col-span-12 md:col-span-6 border border-gray-200 rounded-lg bg-white p-5 flex flex-col"
        >
          <div class="font-semibold text-gray-700 text-[20px]">
            Invoice Overview
          </div>

          <div class="mt-5 grid grid-cols-12 gap-5">
            <div
              class="col-span-12 2xl:col-span-6 border rounded-lg border-gray-200 bg-white inset-shadow-sm inset-shadow-black/30 h-[120px] flex flex-row items-center gap-3 p-3"
            >
              <div
                class="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center"
              >
                <i class="pi pi-money-bill text-green-700! text-lg!"></i>
              </div>
              <div class="flex flex-col">
                <div class="text-[20px] font-semibold">
                  {{ dashboardSummary?.Invoices.paid.amount | currency: 'RM ' }}
                </div>
                <div class="text-gray-500 text-[14px]">Paid</div>
              </div>
            </div>

            <div
              class="col-span-12 2xl:col-span-6 border rounded-lg border-gray-200 bg-white inset-shadow-sm inset-shadow-black/30 h-[120px] flex flex-row items-center gap-3 p-3"
            >
              <div
                class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center"
              >
                <i class="pi pi-clock text-red-700! text-lg!"></i>
              </div>
              <div class="flex flex-col">
                <div class="text-[20px] font-semibold">
                  {{
                    dashboardSummary?.Invoices.unpaid.amount | currency: 'RM '
                  }}
                </div>
                <div class="text-gray-500 text-[14px]">Unpaid</div>
              </div>
            </div>
          </div>
        </div>
        <div
          class="col-span-12 md:col-span-6 border border-gray-200 rounded-lg bg-white p-5 flex flex-col"
        >
          <div class="font-semibold text-gray-700 text-[20px]">
            Invoice Status
          </div>

          <div class="mt-5 flex flex-row gap-3">
            <div class="flex-1 h-[200px] p-2">
              <p-chart
                type="doughnut"
                [data]="invoiceChartData"
                [options]="invoiceChartOptions"
              ></p-chart>
            </div>

            <div
              class="flex-1 h-[200px] flex flex-col justify-center gap-2 p-3"
            >
              <div class="flex flex-row items-center gap-2">
                <i class="pi pi-circle-fill text-yellow-500! text-[8px]!"></i>
                <div class="text-gray-500 text-[14px]">Pending</div>
              </div>
              <div class="flex flex-row items-center gap-2">
                <i class="pi pi-circle-fill text-green-500! text-[8px]!"></i>
                <div class="text-gray-500 text-[14px]">Paid</div>
              </div>
              <div class="flex flex-row items-center gap-2">
                <i class="pi pi-circle-fill text-red-500! text-[8px]!"></i>
                <div class="text-gray-500 text-[14px]">OverDue</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        class="grid grid-cols-12 gap-3"
        *ngIf="role === 'Manager' || role === 'Director'"
      >
        <div
          class="col-span-4 2xl:col-span-3 border border-gray-200 rounded-lg bg-white h-[130px] px-5 py-3 flex flex-row items-center justify-between"
        >
          <div class="flex flex-col justify-between h-full">
            <div>Total Projects</div>
            <div class="flex flex-row items-center gap-1">
              <div class="font-semibold text-[40px] text-gray-700">0</div>
              <div class="text-gray-500 text-[14px] mt-2">Active projects</div>
            </div>
          </div>
          <div class="pi pi-list-check text-4xl! text-gray-600!"></div>
        </div>
        <div
          class="col-span-4 2xl:col-span-3 border border-gray-200 rounded-lg bg-white h-[130px] px-5 py-3 flex flex-row items-center justify-between"
        >
          <div class="flex flex-col justify-between h-full">
            <div>Total Tasks</div>
            <div class="flex flex-row items-center gap-1">
              <div class="font-semibold text-[40px] text-gray-700">0</div>
              <div class="text-gray-500 text-[14px] mt-2">Task created</div>
            </div>
          </div>
          <div class="pi pi-file-check text-4xl! text-gray-600!"></div>
        </div>
        <div
          class="col-span-4 2xl:col-span-3 border border-gray-200 rounded-lg bg-white h-[130px] px-5 py-3 flex flex-row items-center justify-between"
        >
          <div class="flex flex-col justify-between h-full">
            <div>In Progress</div>
            <div class="flex flex-row items-center gap-1">
              <div class="font-semibold text-[40px] text-gray-700">0</div>
              <div class="text-gray-500 text-[14px] mt-2">Tasks</div>
            </div>
          </div>
          <div class="pi pi-clock text-4xl! text-gray-600!"></div>
        </div>
        <div
          class="col-span-12 2xl:col-span-3 border border-gray-200 rounded-lg bg-white h-[130px] px-5 py-3 flex flex-row items-center justify-between"
        >
          <div class="flex flex-col justify-between h-full">
            <div>Completed</div>
            <div class="flex flex-row items-center gap-1">
              <div class="font-semibold text-[40px] text-gray-700">0</div>
              <div class="text-gray-500 text-[14px] mt-2">Tasks</div>
            </div>
          </div>
          <div class="pi pi-check-circle text-4xl! text-gray-600!"></div>
        </div>
        <div
          class="col-span-7 border border-gray-200 rounded-lg bg-white h-[300px] p-5 flex flex-col"
        >
          <div>Recent Project</div>
          <div class="mt-4 flex flex-col gap-2">
            <div
              class="flex flex-col bg-gray-100 border border-gray-200 rounded-lg p-2"
            >
              <div
                class="w-fit text-red-600 bg-red-100 rounded-md text-[14px] px-3 py-0.5"
              >
                High
              </div>
              <div class="border-b border-gray-200 mt-2 mb-2"></div>
              <div class="text-[15px] font-medium text-gray-700">
                SERVICE CHECKING CCTV AND ACCESS CARD
              </div>
              <div class="text-gray-500 font-normal text-[13px] tracking-wide">
                Inspected and maintained CCTV and access card systems to ensure
                full security functionality.
              </div>
              <div class="py-2 flex flex-col gap-1">
                <p-progressbar
                  [value]="50"
                  [showValue]="false"
                  [style]="{ height: '10px' }"
                />
                <div class="text-[13px] text-gray-500">Progress 50%</div>
              </div>
              <div class="border border-gray-200 mb-2"></div>
              <div class="flex flex-row gap-3">
                <div class="text-sm text-gray-500">Assigned To:</div>
              </div>
            </div>
          </div>
        </div>
        <div
          class="col-span-5 border border-gray-200 rounded-lg bg-white h-[300px] p-5 flex flex-col"
        ></div>
      </div>

      <div class="grid grid-cols-12 gap-3" *ngIf="role === 'HR'">
        <div class="col-span-12 flex flex-row items-center justify-between">
          <div class="flex flex-col gap-1">
            <div class="font-medium text-2xl">Welcome Back, {{ name }} !</div>
            <div class="text-gray-500 text-sm tracking-wide">
              Track employee activity, attendance, and organizational updates in
              one place.
            </div>
          </div>
          <div class="flex flex-row items-center gap-2">
            <div
              class="p-2 py-2.5 flex flex-row items-center gap-2 bg-white border border-gray-200 rounded-md"
            >
              <i class="pi pi-calendar text-gray-500!"></i>
              <div class="text-gray-500 tracking-wide font-medium text-sm">
                {{ today | date: 'dd MMM, yyyy' }}
              </div>
            </div>
            <p-button
              label="Add New"
              severity="info"
              styleClass="px-5 text-sm! tracking-wide!"
            >
              <ng-template #icon>
                <i class="pi pi-plus-circle"></i>
              </ng-template>
            </p-button>
          </div>
        </div>
        <div class="col-span-8">
          <div class="grid grid-cols-12 gap-4">
            <div
              class="col-span-4 border bg-white border-gray-200 rounded-md shadow-sm h-40 flex flex-col p-5"
            >
              <div class="flex flex-row gap-3">
                <div
                  class="bg-blue-400 w-15 h-15 rounded-md shadow-sm flex items-center justify-center"
                >
                  <i
                    class="pi pi-calendar text-white! text-3xl! text-shadow-lg!"
                  ></i>
                </div>
                <div class="flex flex-col">
                  <b class="text-4xl text-gray-700">0</b>
                  <div class="text-gray-400 text-sm tracking-wide">
                    Attendance
                  </div>
                </div>
              </div>
              <div
                class="border-b-2 border-gray-200 border-dashed mt-5 mb-3"
              ></div>
              <div
                class="flex flex-row items-center justify-between text-gray-500"
              >
                <div>View details</div>
                <i class="pi pi-arrow-right cursor-pointer"></i>
              </div>
            </div>
            <div
              class="col-span-4 border bg-white border-gray-200 rounded-md shadow-sm h-40 flex flex-col p-5"
            >
              <div class="flex flex-row gap-3">
                <div
                  class="bg-red-400 w-15 h-15 rounded-md shadow-sm flex items-center justify-center"
                >
                  <i
                    class="pi pi-calendar-times text-white! text-3xl! text-shadow-lg!"
                  ></i>
                </div>
                <div class="flex flex-col">
                  <b class="text-4xl text-gray-700">0</b>
                  <div class="text-gray-400 text-sm tracking-wide">Absent</div>
                </div>
              </div>
              <div
                class="border-b-2 border-gray-200 border-dashed mt-5 mb-3"
              ></div>
              <div
                class="flex flex-row items-center justify-between text-gray-500"
              >
                <div>View details</div>
                <i class="pi pi-arrow-right cursor-pointer"></i>
              </div>
            </div>
            <div
              class="col-span-4 border bg-white border-gray-200 rounded-md shadow-sm h-40 flex flex-col p-5"
            >
              <div class="flex flex-row gap-3">
                <div
                  class="bg-orange-400 w-15 h-15 rounded-md shadow-sm flex items-center justify-center"
                >
                  <i
                    class="pi pi-calendar-clock text-white! text-3xl! text-shadow-lg!"
                  ></i>
                </div>
                <div class="flex flex-col">
                  <b class="text-4xl text-gray-700">0</b>
                  <div class="text-gray-400 text-sm tracking-wide">
                    Leave Apply
                  </div>
                </div>
              </div>
              <div
                class="border-b-2 border-gray-200 border-dashed mt-5 mb-3"
              ></div>
              <div
                class="flex flex-row items-center justify-between text-gray-500"
              >
                <div>View details</div>
                <i class="pi pi-arrow-right cursor-pointer"></i>
              </div>
            </div>
            <div
              class="col-span-12 border border-gray-200 rounded-md p-3 bg-white"
            ></div>
          </div>
        </div>
        <div
          class="col-span-4 px-5 pt-2 pb-8 border border-gray-200 rounded-md bg-white"
        >
          <!-- Header -->
          <div
            class="flex flex-row justify-between items-center mb-3 px-5 pt-2"
          >
            <div class="font-semibold text-gray-700 text-lg">
              {{ currentMonth }} {{ currentYear }}
            </div>
            <div class="flex flex-row items-center gap-2">
              <p-button
                (onClick)="prevWeek()"
                styleClass="px-1.5! py-0.5! text-sm! border-gray-200!"
                severity="secondary"
              >
                ◀
              </p-button>
              <p-button
                (onClick)="nextWeek()"
                styleClass="px-1.5! py-0.5! text-sm!"
                severity="info"
              >
                ▶
              </p-button>
            </div>
          </div>

          <!-- Week Days -->
          <div class="grid grid-cols-7 gap-2 text-center px-5">
            <div
              *ngFor="let day of weekDates"
              (click)="selectDate(day)"
              class="cursor-pointer p-2 text-sm transition flex flex-col gap-1 justify-center items-center"
              [ngClass]="{
                'bg-blue-500 text-white border-blue-500': isSelected(day),
                'bg-white': isToday(day),
                'hover:bg-gray-100': !isSelected(day),
              }"
            >
              <div class="text-xs text-gray-500">
                {{ day | date: 'EEE' }}
              </div>
              <div
                class="font-semibold text-base flex items-center justify-center text-center w-8 h-8 text-gray-500"
                [ngClass]="{
                  'bg-green-600 rounded-full text-white': isToday(day),
                }"
              >
                {{ day | date: 'dd' }}
              </div>
            </div>
          </div>

          <div class="flex flex-row items-center mt-2">
            <div class="text-gray-500 text-sm mr-2">Today</div>
            <div class="flex-1 border-t border-dashed border-gray-300"></div>
          </div>
          <div
            class="mt-3 tracking-wide bg-gray-50 h-20 rounded-md flex flex-row items-center justify-between px-5 border-l-10 border-green-600"
          >
            <div class="flex flex-col">
              <div class="font-medium">Management Meeting</div>
              <div class="text-gray-500 text-xs">4.00 pm - 6.00 pm</div>
            </div>
            <div class="flex items-center">
              <p-avatar
                image="https://primefaces.org/cdn/primeng/images/demo/avatar/amyelsner.png"
                size="normal"
                shape="circle"
                class="border-2 border-white -ml-0 z-[6]"
              ></p-avatar>

              <p-avatar
                image="https://primefaces.org/cdn/primeng/images/demo/avatar/asiyajavayant.png"
                size="normal"
                shape="circle"
                class="border-2 border-white -ml-3 z-[5]"
              ></p-avatar>

              <p-avatar
                image="https://primefaces.org/cdn/primeng/images/demo/avatar/onyamalimba.png"
                size="normal"
                shape="circle"
                class="border-2 border-white -ml-3 z-[4]"
              ></p-avatar>

              <p-avatar
                image="https://primefaces.org/cdn/primeng/images/demo/avatar/ionibowcher.png"
                size="normal"
                shape="circle"
                class="border-2 border-white -ml-3 z-[3]"
              ></p-avatar>

              <p-avatar
                image="https://primefaces.org/cdn/primeng/images/demo/avatar/xuxuefeng.png"
                size="normal"
                shape="circle"
                class="border-2 border-white -ml-3 z-[2]"
              ></p-avatar>

              <div
                class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-300 text-sm font-medium -ml-3 z-[1] border-2 border-white"
              >
                +2
              </div>
            </div>
          </div>

          <div class="flex flex-row items-center mt-4">
            <div class="text-gray-500 text-sm mr-2">Mon, March 23</div>
            <div class="flex-1 border-t border-dashed border-gray-300"></div>
          </div>
          <div
            class="mt-3 tracking-wide bg-gray-50 h-20 rounded-md flex flex-row items-center justify-between px-5 border-l-10 border-green-600"
          >
            <div class="flex flex-col">
              <div class="font-medium">Interview HR Intern</div>
              <div class="text-gray-500 text-xs">10.00 am - 11.00 am</div>
            </div>
            <div class="flex items-center">
              <p-avatar
                image="https://primefaces.org/cdn/primeng/images/demo/avatar/amyelsner.png"
                size="normal"
                shape="circle"
                class="border-2 border-white -ml-0 z-[6]"
              ></p-avatar>

              <p-avatar
                image="https://primefaces.org/cdn/primeng/images/demo/avatar/ionibowcher.png"
                size="normal"
                shape="circle"
                class="border-2 border-white -ml-3 z-[3]"
              ></p-avatar>

              <p-avatar
                image="https://primefaces.org/cdn/primeng/images/demo/avatar/xuxuefeng.png"
                size="normal"
                shape="circle"
                class="border-2 border-white -ml-3 z-[2]"
              ></p-avatar>
            </div>
          </div>
          <div
            class="mt-3 tracking-wide bg-gray-50 h-20 rounded-md flex flex-row items-center justify-between px-5 border-l-10 border-green-600"
          >
            <div class="flex flex-col">
              <div class="font-medium">Interview Technical</div>
              <div class="text-gray-500 text-xs">2.00 pm - 3.00 pm</div>
            </div>
            <div class="flex items-center">
              <p-avatar
                image="https://primefaces.org/cdn/primeng/images/demo/avatar/amyelsner.png"
                size="normal"
                shape="circle"
                class="border-2 border-white -ml-0 z-[6]"
              ></p-avatar>

              <p-avatar
                image="https://primefaces.org/cdn/primeng/images/demo/avatar/asiyajavayant.png"
                size="normal"
                shape="circle"
                class="border-2 border-white -ml-3 z-[5]"
              ></p-avatar>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './main-dashboard.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainDashboard implements OnInit, OnDestroy {
  @ViewChild('revenueChart', { static: false }) revenueChartEl!: ElementRef;

  private readonly loadingService = inject(LoadingService);
  private readonly userService = inject(UserService);
  private readonly appService = inject(AppService);
  private readonly cdr = inject(ChangeDetectorRef);

  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  today: Date = new Date();
  selectedDate: Date = new Date();
  weekDates: Date[] = [];

  dashboardSummary: any | null = null;
  role: UserRole | null = null;

  userJobChartData: any;
  options: any;
  data: any;
  userLoginChartData: any;
  userLoginChartOptions: any;
  invoiceChartData: any;
  invoiceChartOptions: any;
  quotationChartData: any;
  quotationChartOptions: any;

  name: string =
    (this.userService.currentUser?.firstName ?? '') +
    ' ' +
    (this.userService.currentUser?.lastName ?? '');

  constructor() {
    this.role =
      (this.userService.currentUser?.role as UserRole) ?? UserRole.Staff;
  }

  ngOnInit(): void {
    // this.GetDashboardSummary();
    if (this.role === 'HR') this.generateWeek(this.today);
  }

  generateWeek(date: Date) {
    const start = new Date(date);
    const day = start.getDay(); // 0 (Sun) - 6 (Sat)

    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    const monday = new Date(start.setDate(diff));

    this.weekDates = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      this.weekDates.push(d);
    }
  }

  get currentMonth() {
    return this.weekDates[0]?.toLocaleString('default', { month: 'long' });
  }

  get currentYear() {
    return this.weekDates[0]?.getFullYear();
  }

  nextWeek() {
    const next = new Date(this.weekDates[6]);
    next.setDate(next.getDate() + 1);
    this.generateWeek(next);
  }

  prevWeek() {
    const prev = new Date(this.weekDates[0]);
    prev.setDate(prev.getDate() - 1);
    this.generateWeek(prev);
  }

  selectDate(date: Date) {
    this.selectedDate = date;
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  isSelected(date: Date): boolean {
    return this.selectedDate?.toDateString() === date.toDateString();
  }

  GetDashboardSummary() {
    this.loadingService.start();
    this.appService
      .GetDashboardSummary()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res: any) => {
          console.log(res);
          this.loadingService.stop();
          this.dashboardSummary = res;

          if (this.role === 'Admin') {
            this.prepareQuotationChart();
            const revenueData = this.dashboardSummary?.Revenue?.trend ?? [];
            const revenueLabels: string[] = [];
            const revenueValues: number[] = [];

            revenueData.forEach((d: any) => {
              // Convert "12/2025" → "Dec 2025"
              const month = Number(d.month) - 1; // JS months 0-indexed
              const year = Number(d.year);
              const date = new Date(year, month);

              const label = date.toLocaleDateString('en-MY', {
                month: 'short',
                year: 'numeric',
              }); // e.g., "Dec 2025"

              revenueLabels.push(label);
              revenueValues.push(Number(d.total) || 0);
            });

            const revenueOptions: ApexCharts.ApexOptions = {
              chart: {
                type: 'area',
                height: '100%',
                toolbar: { show: false },
                zoom: { enabled: false },
              },
              series: [{ name: 'Revenue', data: revenueValues }],
              xaxis: { categories: revenueLabels, title: { text: 'Date' } },
              yaxis: {
                min: 0,
                title: { text: 'Revenue (RM)' },
                labels: { formatter: (val) => `RM ${val.toLocaleString()}` },
              },
              stroke: { curve: 'smooth', width: 2 },
              fill: {
                type: 'gradient',
                gradient: { opacityFrom: 0.45, opacityTo: 0.05 },
              },
              dataLabels: { enabled: false },
              tooltip: {
                y: { formatter: (val) => `RM ${val.toLocaleString()}` },
              },
            };

            setTimeout(() => {
              if (this.revenueChartEl) {
                new ApexCharts(
                  this.revenueChartEl.nativeElement,
                  revenueOptions,
                ).render();
              }
            }, 0);

            const invoices = this.dashboardSummary?.Invoices ?? {};

            // Extract counts
            const paidCount = invoices.paid?.count ?? 0;
            const unpaidCount = invoices.unpaid?.count ?? 0;
            const overdueCount = invoices.overdue?.count ?? 0;

            // Set doughnut chart data
            this.invoiceChartData = {
              labels: ['Paid', 'Unpaid/Pending', 'Overdue'],
              datasets: [
                {
                  data: [paidCount, unpaidCount, overdueCount],
                  backgroundColor: [
                    getComputedStyle(document.documentElement).getPropertyValue(
                      '--p-green-400',
                    ),
                    getComputedStyle(document.documentElement).getPropertyValue(
                      '--p-yellow-400',
                    ),
                    getComputedStyle(document.documentElement).getPropertyValue(
                      '--p-red-400',
                    ),
                  ],
                  hoverBackgroundColor: [
                    getComputedStyle(document.documentElement).getPropertyValue(
                      '--p-green-300',
                    ),
                    getComputedStyle(document.documentElement).getPropertyValue(
                      '--p-yellow-300',
                    ),
                    getComputedStyle(document.documentElement).getPropertyValue(
                      '--p-red-300',
                    ),
                  ],
                },
              ],
            };

            // Chart options
            this.invoiceChartOptions = {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false, // hide the legend completely
                },
                tooltip: {
                  callbacks: {
                    label: (tooltipItem: any) => {
                      const label =
                        this.invoiceChartData.labels[tooltipItem.dataIndex];
                      const value =
                        this.invoiceChartData.datasets[0].data[
                          tooltipItem.dataIndex
                        ];
                      return `${label}: ${value}`;
                    },
                  },
                },
              },
            };

            this.cdr.markForCheck();
          } else if (this.role === 'SuperAdmin') {
            // --- Daily User Login Area Chart ---
            const dailyTrend = this.dashboardSummary?.UserLoginTrend ?? [];
            const days = 5;
            const today = new Date();

            // Map backend data for quick lookup
            const dateMap = new Map<string, number>();
            dailyTrend.forEach((d: any) => {
              if (d.date) {
                const key = new Date(d.date).toDateString();
                dateMap.set(
                  key,
                  typeof d.loginCount === 'number' ? d.loginCount : 0,
                );
              }
            });

            const loginLabels: string[] = [];
            const loginData: number[] = [];

            for (let i = days - 1; i >= 0; i--) {
              const date = new Date(today);
              date.setDate(today.getDate() - i);
              const key = date.toDateString();

              loginLabels.push(
                date.toLocaleDateString('en-MY', {
                  day: '2-digit',
                  month: 'short',
                }),
              );

              loginData.push(dateMap.get(key) ?? 0);
            }

            const loginOptions: ApexCharts.ApexOptions = {
              chart: {
                type: 'area',
                height: '100%',
                toolbar: { show: false },
                zoom: { enabled: false },
              },
              series: [{ name: 'User Logins', data: loginData }],
              xaxis: { categories: loginLabels, title: { text: 'Day' } },
              yaxis: {
                min: 0,
                title: { text: 'Login Count' },
                labels: {
                  formatter: (val) =>
                    Number.isInteger(val) ? val.toString() : '',
                },
              },
              stroke: { curve: 'smooth', width: 2 },
              fill: {
                type: 'gradient',
                gradient: { opacityFrom: 0.45, opacityTo: 0.05 },
              },
              dataLabels: { enabled: false },
              tooltip: { y: { formatter: (val) => `${val} users` } },
            };

            new ApexCharts(
              document.querySelector('#userLoginAreaChart'),
              loginOptions,
            ).render();

            // --- POs Per Month Bar Chart ---
            const posPerMonth = this.dashboardSummary?.POsPerMonth ?? [];

            const poLabels: string[] = posPerMonth.map(
              (d: any) => d.monthName ?? 'N/A',
            );

            // Use count directly for data
            const data: number[] = posPerMonth.map((d: any) =>
              typeof d.count === 'number' ? d.count : 0,
            );

            // ApexCharts bar chart options
            const options: ApexCharts.ApexOptions = {
              chart: {
                type: 'bar',
                height: '100%',
                toolbar: { show: false },
              },
              series: [
                {
                  name: 'Purchase Orders',
                  data,
                },
              ],
              xaxis: {
                categories: poLabels,
                title: { text: 'Month' },
              },
              yaxis: {
                min: 0,
                title: { text: 'PO Count' },
                labels: {
                  formatter: (val) =>
                    Number.isInteger(val) ? val.toString() : '',
                },
              },
              dataLabels: { enabled: true },
              tooltip: { y: { formatter: (val) => `${val} POs` } },
              plotOptions: {
                bar: {
                  borderRadius: 4,
                  columnWidth: '50%',
                },
              },
              colors: ['#42A5F5'], // your theme color
            };

            const chart = new ApexCharts(
              document.querySelector('#poPerMonthChart'),
              options,
            );

            chart.render();
          }

          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loadingService.stop();
        },
      });
  }

  prepareQuotationChart() {
    const statuses = this.dashboardSummary?.Quotations?.status ?? [];

    // Map status to chart data
    const labels = statuses.map((s: any) => s.status);
    const data = statuses.map((s: any) => s.count);
    const backgroundColors = statuses.map((s: any) => {
      switch (s.status) {
        case 'Approved':
          return '#22c55e'; // green
        case 'Pending':
          return '#eab308'; // yellow
        case 'Rejected':
          return '#ef4444'; // red
        default:
          return '#9ca3af'; // gray fallback
      }
    });

    this.quotationChartData = {
      labels,
      datasets: [
        {
          data,
          backgroundColor: backgroundColors,
          hoverBackgroundColor: backgroundColors,
        },
      ],
    };

    this.quotationChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }, // hide legend
        tooltip: {
          callbacks: {
            label: (tooltipItem: any) => {
              const label =
                this.quotationChartData.labels[tooltipItem.dataIndex];
              const value =
                this.quotationChartData.datasets[0].data[tooltipItem.dataIndex];
              return `${label}: ${value}`;
            },
          },
        },
      },
    };
  }

  highlightRef(message: string): string {
    if (!message) return '';

    // Match #188788, #PAY-2025-472, #RHB000813, etc.
    return message.replace(
      /(#[A-Za-z0-9-]+)/g,
      '<span class="ref-highlight">$1</span>',
    );
  }

  DisplayStatus(status: QuotationStatus) {
    switch (status) {
      case QuotationStatus.Pending: {
        return 'Pending';
      }
      case QuotationStatus.Approved: {
        return 'Approved';
      }
      default: {
        return 'Rejected';
      }
    }
  }

  SeverityStatus(status: QuotationStatus) {
    switch (status) {
      case QuotationStatus.Pending: {
        return 'warn';
      }
      case QuotationStatus.Approved: {
        return 'success';
      }
      default: {
        return 'danger';
      }
    }
  }

  SeverityPOs(status: string) {
    switch (status) {
      case 'Draft': {
        return 'warn';
      }
      case 'Cancelled': {
        return 'danger';
      }
      case 'Completed': {
        return 'success';
      }
      default: {
        return 'info';
      }
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
