import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { UserService } from '../../../services/userService.service';
import { RouterLink } from '@angular/router';
import { DepartmentDto } from '../../../models/Department';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink],
  template: `<div class="p-6 bg-gray-50 min-h-screen">
    <div
      class="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6"
    >
      <div class="flex flex-col justify-between">
        <h1 class="font-bold text-3xl text-gray-900 tracking-tight">
          Welcome Back, {{ name }}
        </h1>
        <p class="text-gray-500 mt-1">
          {{ now | date: 'EEEE, dd MMMM, yyyy' }} &bull; Operational snapshot
          across YL Works.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <button
          [routerLink]="'/quotations/form'"
          class="cursor-pointer hover:scale-102 flex flex-row items-center py-2.5 px-5 gap-2 border rounded-lg border-gray-300 font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all shadow-sm"
        >
          <i class="pi pi-file text-gray-400"></i>
          <span>New Quotation</span>
        </button>
        <button
          [routerLink]="'/material-requests/form'"
          class="cursor-pointer hover:scale-102 flex flex-row items-center py-2.5 px-5 gap-2 border rounded-lg bg-blue-800 font-medium text-white hover:bg-blue-700 transition-all shadow-sm"
        >
          <i class="pi pi-list"></i>
          <span>Request Materials</span>
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
      <div
        class="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between h-36"
      >
        <div class="flex flex-row justify-between items-start">
          <span
            class="text-sm text-gray-500 font-semibold tracking-wide uppercase"
            >Active Projects</span
          >
          <div class="p-2.5 rounded-lg bg-blue-50 text-blue-800">
            <i class="pi pi-building text-lg!"></i>
          </div>
        </div>
        <div class="text-4xl font-bold text-gray-900">0</div>
        <div class="flex items-center gap-2 text-sm text-gray-400 font-medium">
          <span>0 planning</span> &bull; <span>0 on hold</span>
        </div>
      </div>

      <div
        class="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between h-36"
      >
        <div class="flex flex-row justify-between items-start">
          <span
            class="text-sm text-gray-500 font-semibold tracking-wide uppercase"
            >Tasks Due Today</span
          >
          <div class="p-2.5 rounded-lg bg-amber-50 text-amber-700">
            <i class="pi pi-calendar text-lg!"></i>
          </div>
        </div>
        <div class="text-4xl font-bold text-gray-900">0</div>
        <div class="flex items-center gap-2 text-sm text-gray-400 font-medium">
          <span class="text-amber-600 font-semibold">0 in progress</span> &bull;
          <span>0 pending</span>
        </div>
      </div>

      <div
        class="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between h-36"
      >
        <div class="flex flex-row justify-between items-start">
          <span
            class="text-sm text-gray-500 font-semibold tracking-wide uppercase"
            >Outstanding Invoices</span
          >
          <div class="p-2.5 rounded-lg bg-emerald-50 text-emerald-700">
            <i class="pi pi-dollar text-lg!"></i>
          </div>
        </div>
        <div class="text-4xl font-bold text-gray-900">RM 0.00</div>
        <div class="flex items-center gap-2 text-sm text-gray-400 font-medium">
          <span>Across 0 unpaid claims</span>
        </div>
      </div>

      <div
        class="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between h-36"
      >
        <div class="flex flex-row justify-between items-start">
          <span
            class="text-sm text-gray-500 font-semibold tracking-wide uppercase"
            >Open Work Orders</span
          >
          <div class="p-2.5 rounded-lg bg-purple-50 text-purple-700">
            <i class="pi pi-briefcase text-lg!"></i>
          </div>
        </div>
        <div class="text-4xl font-bold text-gray-900">0</div>
        <div
          class="flex items-center gap-2 text-sm text-purple-600 font-medium bg-purple-50 px-2 py-0.5 rounded-md w-fit"
        >
          <span>0 dispatch ongoing</span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-12 gap-6">
      <div
        class="col-span-12 md:col-span-6 xl:col-span-4 p-5 rounded-xl border border-gray-100 bg-white shadow-sm flex flex-col h-80 justify-between"
      >
        <div class="flex justify-between items-start">
          <div>
            <h3 class="text-xl font-bold text-gray-900">Active Quotations</h3>
            <p class="text-sm text-gray-400">
              View and manage ongoing proposals
            </p>
          </div>
          <a
            [routerLink]="'/quotations'"
            class="text-blue-800 text-sm font-semibold hover:underline"
            >View Quotations</a
          >
        </div>
        <div class="grid grid-cols-2 gap-3 mt-4">
          <div class="p-3 bg-gray-50 rounded-lg border border-gray-100">
            <div class="text-xs text-gray-400 font-medium">Drafts</div>
            <div class="text-2xl font-bold text-gray-800 mt-1">0</div>
          </div>
          <div class="p-3 bg-gray-50 rounded-lg border border-gray-100">
            <div class="text-xs text-gray-400 font-medium">Sent to Client</div>
            <div class="text-2xl font-bold text-gray-800 mt-1">0</div>
          </div>
          <div
            class="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100"
          >
            <div class="text-xs text-emerald-700 font-medium">Accepted</div>
            <div class="text-2xl font-bold text-emerald-600 mt-1">0</div>
          </div>
          <div class="p-3 bg-rose-50/50 rounded-lg border border-rose-100">
            <div class="text-xs text-rose-700 font-medium">Declined</div>
            <div class="text-2xl font-bold text-rose-500 mt-1">0</div>
          </div>
        </div>
      </div>

      <div
        class="col-span-12 md:col-span-6 xl:col-span-4 p-5 rounded-xl border border-gray-100 bg-white shadow-sm flex flex-col h-80 justify-between"
      >
        <div class="flex justify-between items-start">
          <div>
            <h3 class="text-xl font-bold text-gray-900">Purchase Orders</h3>
            <p class="text-sm text-gray-400">
              Client validation & fulfillment tracks
            </p>
          </div>
          <a
            [routerLink]="'/purchase-orders'"
            class="text-blue-800 text-sm font-semibold hover:underline"
            >Manage</a
          >
        </div>
        <div class="flex flex-col gap-3 mt-2">
          <div
            class="p-3.5 flex justify-between items-center bg-gray-50 rounded-xl border border-gray-100"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-9 h-9 bg-blue-800 text-white rounded-lg flex items-center justify-center"
              >
                <i class="pi pi-file"></i>
              </div>
              <div>
                <div class="text-sm font-semibold text-gray-800">
                  Active Client PO
                </div>
                <div class="text-xs text-gray-400">Awaiting Delivery Setup</div>
              </div>
            </div>
            <div class="text-2xl font-bold text-gray-900">0</div>
          </div>
          <div
            class="p-3.5 flex justify-between items-center bg-gray-50 rounded-xl border border-gray-100"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-9 h-9 bg-blue-600 text-white rounded-lg flex items-center justify-center"
              >
                <i class="pi pi-truck"></i>
              </div>
              <div>
                <div class="text-sm font-semibold text-gray-800">
                  Pending Supplier PO
                </div>
                <div class="text-xs text-gray-400">Sent & Acknowledged</div>
              </div>
            </div>
            <div class="text-2xl font-bold text-gray-900">0</div>
          </div>
        </div>
      </div>

      <div
        class="col-span-12 md:col-span-6 xl:col-span-4 p-5 rounded-xl border border-gray-100 bg-white shadow-sm flex flex-col h-80 justify-between"
      >
        <div>
          <h3 class="text-xl font-bold text-gray-900">Financial Insights</h3>
          <p class="text-sm text-gray-400">Corporate balance flow overview</p>

          <div
            class="mt-4 bg-rose-50/40 rounded-xl p-4 flex items-center justify-between border border-rose-100/60"
          >
            <div>
              <div
                class="text-xs font-bold text-rose-800 uppercase tracking-wide"
              >
                Total Expenses Month-to-Date
              </div>
              <div class="text-2xl font-black text-rose-600 mt-1">RM 0.00</div>
            </div>
            <div
              class="w-10 h-10 bg-white text-rose-500 rounded-lg flex items-center justify-center shadow-xs border border-rose-100"
            >
              <i class="pi pi-credit-card text-lg"></i>
            </div>
          </div>
        </div>
        <div>
          <div
            class="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5"
          >
            Recent Clearances
          </div>
          <p class="text-xs text-gray-400 italic">
            No historical records logged today.
          </p>
        </div>
      </div>

      <div
        class="col-span-12 md:col-span-6 p-5 rounded-xl border border-gray-100 bg-white shadow-sm flex flex-col justify-between h-80"
      >
        <div>
          <div class="flex justify-between items-start">
            <div>
              <h3 class="text-xl font-bold text-gray-900">Low Stock Warning</h3>
              <p class="text-sm text-gray-400">
                Materials below replenishment boundaries
              </p>
            </div>
            <button class="text-blue-800 text-sm font-semibold hover:underline">
              Open Inventory
            </button>
          </div>

          <div
            class="mt-5 flex items-center justify-between p-3 bg-amber-50/40 border border-amber-100 rounded-xl"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 bg-amber-500 text-white flex items-center justify-center rounded-xl shadow-sm"
              >
                <i class="pi pi-exclamation-triangle text-lg"></i>
              </div>
              <div>
                <div class="font-semibold text-sm text-gray-900">
                  Steel Rebar 12mm
                </div>
                <div class="text-xs text-gray-400">SKU: SR-12-001</div>
              </div>
            </div>
            <div class="text-right">
              <span class="text-sm font-bold text-rose-600">2 / 10 units</span>
            </div>
          </div>
        </div>
        <div class="flex justify-end">
          <button
            class="px-4 py-2 text-sm font-semibold bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition shadow-xs"
          >
            Initiate Procurement
          </button>
        </div>
      </div>

      <div
        class="col-span-12 md:col-span-6 p-5 rounded-xl border border-gray-100 bg-white shadow-sm flex flex-col justify-between h-80"
      >
        <div>
          <div class="flex justify-between items-start">
            <div>
              <h3 class="text-xl font-bold text-gray-900">
                Delivery & Returns
              </h3>
              <p class="text-sm text-gray-400">
                Track active deliveries and return requests
              </p>
            </div>
            <button class="text-blue-800 text-sm font-semibold hover:underline">
              View All
            </button>
          </div>

          <div class="mt-3 grid grid-cols-1 gap-2">
            <div
              class="bg-gray-50 rounded-xl p-3 flex items-center justify-between border border-gray-100"
            >
              <div class="flex items-center gap-2.5">
                <div
                  class="w-8 h-8 bg-rose-500 text-white rounded-lg flex items-center justify-center"
                >
                  <i class="pi pi-replay text-sm"></i>
                </div>
                <span class="text-sm font-semibold text-gray-700"
                  >Open Return Actions (RMA)</span
                >
              </div>
              <span class="font-bold text-xl text-gray-900">0</span>
            </div>

            <div class="mt-2">
              <div
                class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2"
              >
                Most Recent Dispatch
              </div>
              <div
                class="flex items-center justify-between p-2.5 bg-white border border-gray-100 rounded-lg shadow-2xs"
              >
                <div>
                  <div class="text-sm font-bold text-gray-800">DO-2026-001</div>
                  <div class="text-xs text-gray-400">
                    V50 Tower &bull; 17 May
                  </div>
                </div>
                <span
                  class="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold"
                  >Delivered</span
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`,
  styleUrl: './dashboard.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit, OnDestroy {
  private readonly userService = inject(UserService);

  currentUser = this.userService.currentUser;
  name: string = this.currentUser?.displayName || 'User';
  systemRole: string = this.currentUser?.systemRole || 'Executive';
  departments: DepartmentDto[] = this.currentUser?.departments || [];
  now: Date = new Date();

  isManagementOrAdmin =
    this.systemRole === 'SuperAdmin' ||
    this.systemRole === 'Management' ||
    this.systemRole === 'HOD';
  isExecutiveOrSupport =
    this.systemRole === 'Executive' || this.systemRole === 'Support';

  ngOnInit(): void {}

  ngOnDestroy(): void {}
}
