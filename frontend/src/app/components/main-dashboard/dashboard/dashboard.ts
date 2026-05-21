import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { LogisticDashboard } from '../logistic-dashboard/logistic-dashboard';
import { UserService } from '../../../services/userService.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, LogisticDashboard, RouterLink],
  template: `<div class="p-5">
    <ng-container *ngIf="jobTitle === 'Logistic Assistant'; else mainTemplate">
      <app-logistic-dashboard></app-logistic-dashboard>
    </ng-container>
    <ng-template #mainTemplate>
      <div class="grid grid-cols-12 gap-2 xl:gap-5 justify-between">
        <div
          class="col-span-12 bg-white rounded-lg p-5 border border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0 md:h-38"
        >
          <div class="flex flex-col justify-between h-full">
            <div class="font-semibold text-gray-500">
              {{ now | date: 'EEEE, dd MMMM, yyyy' }}
            </div>
            <div class="font-bold text-3xl">Welcome Back, {{ name }}</div>
            <div class="text-sm text-gray-500">
              Here's the operational snapshot across YL Works today.
            </div>
          </div>
          <div class="flex flex-row items-center gap-3">
            <div
              [routerLink]="'/quotations/form'"
              class="flex flex-row items-center py-3 px-6 gap-2 border rounded-lg border-gray-300 hover:scale-102 cursor-pointer hover:bg-gray-50"
            >
              <i class="pi pi-file"></i>
              <div>New Quotation</div>
            </div>
            <div
              [routerLink]="'/material-requests/form'"
              class="flex flex-row items-center py-3 px-6 gap-2 border rounded-lg bg-blue-800 text-white hover:scale-102 cursor-pointer hover:bg-blue-700"
            >
              <i class="pi pi-list"></i>
              <div>New Material Requests</div>
            </div>
          </div>
        </div>
        <div
          class="col-span-6 md:col-span-3 border bg-white rounded-lg p-5 border-gray-200 flex flex-col h-40 justify-between"
        >
          <div class="flex flex-row justify-between">
            <div class="text-sm text-gray-500 font-semibold">
              Active Projects
            </div>
            <div class="p-2 rounded-lg bg-blue-50">
              <i class="pi pi-building text-blue-800 text-xl!"></i>
            </div>
          </div>
          <div class="text-5xl font-bold">0</div>
          <div class="flex flex-row items-center gap-1 text-sm text-gray-500">
            <div>0 in planning</div>
            <i class="pi pi-circle-fill text-gray-500! text-[3px]! mt-1!"></i>
            <div>0 on hold</div>
          </div>
        </div>
        <div
          class="col-span-6 md:col-span-3 border bg-white rounded-lg p-5 border-gray-200 flex flex-col h-40 justify-between"
        >
          <div class="flex flex-row justify-between">
            <div class="text-sm text-gray-500 font-semibold">
              Tasks Due Today
            </div>
            <div class="p-2 rounded-lg bg-blue-50">
              <i class="pi pi-calendar text-blue-700 text-xl!"></i>
            </div>
          </div>
          <div class="text-5xl font-bold">0</div>
          <div class="flex flex-row items-center gap-1 text-sm text-gray-500">
            <div>0 in progress</div>
            <i class="pi pi-circle-fill text-gray-500! text-[3px]! mt-1!"></i>
            <div>0 to do</div>
          </div>
        </div>
        <div
          class="col-span-6 md:col-span-3 border bg-white rounded-lg p-5 border-gray-200 flex flex-col h-40 justify-between"
        >
          <div class="flex flex-row justify-between">
            <div class="text-sm text-gray-500 font-semibold">
              Outstanding Invoices
            </div>
            <div class="p-2 rounded-lg bg-blue-50">
              <i class="pi pi-dollar text-blue-800 text-xl!"></i>
            </div>
          </div>
          <div class="text-5xl font-bold">0</div>
          <div class="flex flex-row items-center gap-1 text-sm text-gray-500">
            <div>Across 0 invoices</div>
          </div>
        </div>
        <div
          class="col-span-6 md:col-span-3 border bg-white rounded-lg p-5 border-gray-200 flex flex-col h-40 justify-between"
        >
          <div class="flex flex-row justify-between">
            <div class="text-sm text-gray-500 font-semibold">
              Open Work Orders
            </div>
            <div class="p-2 rounded-lg bg-blue-50">
              <i class="pi pi-briefcase text-blue-700 text-xl!"></i>
            </div>
          </div>
          <div class="text-5xl font-bold">0</div>
          <div class="flex flex-row items-center gap-1 text-sm text-gray-500">
            <div>0 in progress</div>
          </div>
        </div>
        <div
          class="col-span-12 md:col-span-6 xl:col-span-4 p-5 rounded-lg border border-gray-200 bg-white flex flex-col h-80"
        >
          <div class="flex flex-row justify-between">
            <div class="flex flex-col">
              <div class="text-xl font-semibold">Quotations</div>
              <div class="text-sm text-gray-500">
                Outstanding & pending pipeline
              </div>
            </div>
            <div
              [routerLink]="'/quotations'"
              class="text-blue-800 text-sm cursor-pointer hover:underline font-semibold"
            >
              View all
            </div>
          </div>
          <div class="grid grid-cols-12 gap-4 justify-between mt-5">
            <div
              class="col-span-6 p-4 flex flex-col bg-gray-100 border border-gray-300 rounded-lg h-23 justify-between"
            >
              <div class="text-sm text-gray-500">Draft</div>
              <div class="text-3xl font-bold">0</div>
            </div>
            <div
              class="col-span-6 p-4 flex flex-col bg-gray-100 border border-gray-300 rounded-lg h-23 justify-between"
            >
              <div class="text-sm text-gray-500">Sent to Client</div>
              <div class="text-3xl font-bold">0</div>
            </div>
            <div
              class="col-span-6 p-4 flex flex-col bg-gray-100 border border-gray-300 rounded-lg h-23 justify-between"
            >
              <div class="text-sm text-gray-500">Accepted</div>
              <div class="text-3xl font-bold text-green-600">0</div>
            </div>
            <div
              class="col-span-6 p-4 flex flex-col bg-gray-100 border border-gray-300 rounded-lg h-23 justify-between"
            >
              <div class="text-sm text-gray-500">Rejected</div>
              <div class="text-3xl font-bold text-red-500">0</div>
            </div>
          </div>
        </div>
        <div
          class="col-span-12 md:col-span-6 xl:col-span-4 p-5 rounded-lg border border-gray-200 bg-white flex flex-col h-80"
        >
          <div class="flex flex-row justify-between">
            <div class="flex flex-col">
              <div class="text-xl font-semibold">Purchase Orders</div>
              <div class="text-sm text-gray-500">
                Client & supplier activity
              </div>
            </div>
            <div
              [routerLink]="'/purchase-orders'"
              class="text-blue-800 text-sm cursor-pointer hover:underline font-semibold"
            >
              Manage
            </div>
          </div>
          <div class="grid grid-cols-12 gap-4 justify-between mt-5">
            <div
              class="col-span-12 p-4 flex flex-row justify-between items-center bg-gray-100 border border-gray-300 rounded-lg h-23"
            >
              <div class="flex flex-row items-center">
                <div
                  class="bg-blue-800 w-10 h-10 flex items-center justify-center rounded-lg"
                >
                  <i class="pi pi-file text-xl! text-white"></i>
                </div>

                <div class="flex flex-col ml-4">
                  <div class="font-semibold">Active Client PO(s)</div>
                  <div class="text-sm text-gray-500">
                    Received & In Progress
                  </div>
                </div>
              </div>
              <div class="text-4xl font-bold">0</div>
            </div>
            <div
              class="col-span-12 p-4 flex flex-row justify-between items-center bg-gray-100 border border-gray-300 rounded-lg h-23"
            >
              <div class="flex flex-row items-center">
                <div
                  class="bg-blue-700 w-10 h-10 flex items-center justify-center rounded-lg"
                >
                  <i class="pi pi-truck text-xl! text-white"></i>
                </div>

                <div class="flex flex-col ml-4">
                  <div class="font-semibold">Pending Supplier PO(s)</div>
                  <div class="text-sm text-gray-500">
                    Draft, Sent, Acknowledged
                  </div>
                </div>
              </div>
              <div class="text-4xl font-bold">0</div>
            </div>
          </div>
        </div>
        <div
          class="col-span-12 md:col-span-6 xl:col-span-4 p-5 rounded-lg border border-gray-200 bg-white flex flex-col h-80"
        >
          <div class="font-semibold text-xl">Financial Snapshot</div>
          <div class="text-sm text-gray-500">Expenses & recent payments</div>
          <div
            class="mt-2 bg-gray-100 rounded-lg p-3 flex flex-row items-center justify-between border border-gray-300"
          >
            <div class="flex flex-col gap-2">
              <div class="text-gray-600 text-sm">TOTAL EXPENSES (RM)</div>
              <div class="text-3xl font-bold text-red-600">RM 0.00</div>
            </div>
            <div
              class="w-10 h-10 bg-gray-50 inset-shadow-sm inset-shadow-gray-500 rounded-lg flex items-center justify-center"
            >
              <i class="pi pi-credit-card text-red-600 text-xl!"></i>
            </div>
          </div>
          <div class="mt-4">
            <div class="font-semibold">Recent Payments</div>
            <div class="text-sm text-gray-500">
              No recent payments to display
            </div>
          </div>
        </div>
        <div
          class="col-span-12 md:col-span-6 p-5 rounded-lg border border-gray-200 bg-white flex flex-col justify-between h-80"
        >
          <div class="flex flex-col">
            <div class="flex flex-row justify-between">
              <div class="flex flex-col">
                <div class="font-semibold text-xl">Low Stock Alert</div>
                <div class="text-sm text-gray-500">
                  Items with low stock levels
                </div>
              </div>
              <div class="text-blue-800 text-sm font-semibold cursor-pointer">
                Open Inventory
              </div>
            </div>
            <div class="mt-5 flex flex-row items-center justify-between">
              <div class="flex flex-row items-center gap-3">
                <div
                  class="w-10 h-10 bg-amber-500 flex items-center justify-center rounded-lg"
                >
                  <i class="pi pi-exclamation-triangle text-xl!"></i>
                </div>
                <div class="flex flex-col">
                  <div class="font-semibold">Steel Rebar 12mm</div>
                  <div class="text-sm text-gray-500">SKU: SR-12-001</div>
                </div>
              </div>
              <div class="font-bold text-red-500">2/10 units</div>
            </div>
          </div>
          <div class="flex justify-end">
            <div
              class="px-4 py-2 rounded-lg border w-fit border-gray-300 cursor-pointer mt-5 hover:bg-gray-50"
            >
              Procure
            </div>
          </div>
        </div>
        <div
          class="col-span-12 xl:col-span-6 p-5 rounded-lg border border-gray-200 bg-white flex flex-col justify-between h-80"
        >
          <div class="flex flex-col">
            <div class="flex flex-row justify-between">
              <div class="flex flex-col">
                <div class="font-semibold text-xl">Logistics</div>
                <div class="text-sm text-gray-500">
                  Recent DOs & open RMA(s)
                </div>
              </div>
              <div class="text-blue-800 text-sm font-semibold cursor-pointer">
                Details
              </div>
            </div>
            <div
              class="mt-2 bg-gray-100 rounded-lg p-3 flex flex-col border border-gray-300"
            >
              <div class="flex flex-row items-center justify-between">
                <div class="flex flex-row items-center gap-2">
                  <div
                    class="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center"
                  >
                    <i class="pi pi-replay text-white text-xl!"></i>
                  </div>
                  <div class="font-semibold">Open RMA(s)</div>
                </div>
                <div class="font-semibold text-3xl">0</div>
              </div>
            </div>
            <div class="mt-3 font-semibold text-gray-500">
              Recent Delivery Orders
            </div>
            <div class="flex flex-row items-center justify-between mt-5">
              <div class="flex flex-col">
                <div class="font-semibold">DO-2026-001</div>
                <div class="text-gray-500 text-sm">V50 Tower. 17 May</div>
              </div>
              <div
                class="px-4 py-1 bg-green-600 text-white rounded-full text-sm font-semibold"
              >
                Delivered
              </div>
            </div>
          </div>
        </div>
      </div>
    </ng-template>
  </div>`,
  styleUrl: './dashboard.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit, OnDestroy {
  private readonly userService = inject(UserService);

  jobTitle?: string = this.userService.currentUser?.jobTitle;
  name?: string = this.userService.currentUser?.displayName;
  now: Date = new Date();

  ngOnInit(): void {}

  ngOnDestroy(): void {}
}
