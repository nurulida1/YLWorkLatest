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
import { LoadingService } from '../../../services/loading.service';
import { UserService } from '../../../services/userService.service';
import { SuperAdminDashboardDto } from '../../../models/AppModels';
import { AppService } from '../../../services/appService.service';
import { Subject, takeUntil } from 'rxjs';
import { DialogModule } from 'primeng/dialog';
import { MultiSelectModule } from 'primeng/multiselect';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { StaffTaskService } from '../../../services/staffTaskService';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-mobile-dashboard',
  imports: [
    CommonModule,
    DialogModule,
    MultiSelectModule,
    FormsModule,
    SelectModule,
    InputTextModule,
    TextareaModule,
    ButtonModule,
    CheckboxModule,
    RouterLink,
  ],
  template: `
    <div class="min-h-screen bg-slate-50 flex flex-col pb-8">
      <!-- ==================== MOBILE HEADER ==================== -->
      <div class="relative bg-[#1D4ED8] rounded-b-[2.5rem] overflow-hidden">
        <!-- Decorative Background -->
        <div
          class="absolute -top-20 -right-15 w-56 h-56 rounded-full border border-white/15"
        ></div>
        <div
          class="absolute -top-12 -right-8 w-44 h-44 rounded-full border border-white/20"
        ></div>
        <div
          class="absolute top-8 -right-20 w-36 h-36 rounded-full bg-white/5"
        ></div>

        <div class="relative z-10 px-5 pt-6 pb-10">
          <!-- Brand and Profile -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div
                class="w-11 h-11 rounded-full flex items-center justify-center bg-white/10 border border-white/30"
              >
                <span class="font-bold text-white text-lg">YL</span>
              </div>

              <div class="flex flex-col">
                <span class="uppercase text-white font-semibold tracking-wide">
                  Works Enterprise
                </span>
                <span class="text-white/60 text-[10px] tracking-widest">
                  OFFICE MANAGEMENT
                </span>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                class="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 border border-white/30"
              >
                <i class="pi pi-bell text-white"></i>
              </button>

              <div
                class="w-10 h-10 rounded-full flex items-center justify-center bg-[#FCDF7B] border border-[#e5c85f]"
              >
                <span class="font-bold text-slate-800">
                  {{ getInitial(currentUser?.displayName) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Welcome -->
          <div class="mt-9">
            <div class="text-white/70">Welcome back,</div>

            <h1 class="text-2xl font-bold text-white mt-1">
              {{ currentUser?.displayName }}
            </h1>

            <div class="flex items-center gap-2 mt-2">
              <i class="pi pi-briefcase text-white/70 text-xs"></i>
              <span class="text-white/80 text-sm">
                {{ currentUser?.jobTitle || 'Employee' }}
              </span>
            </div>

            <div class="mt-5 relative">
              <input
                pInputText
                [(ngModel)]="searchTerm"
                placeholder="Search anything..."
                class="w-full rounded-xl! bg-white! border-0! py-3! pl-11! pr-4! text-sm!"
              />

              <i
                class="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              ></i>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== QUICK ACTIONS ==================== -->
      <div class="relative px-5 -mt-5 z-20">
        <div class="bg-white rounded-2xl shadow-lg border border-slate-100 p-4">
          <div class="grid grid-cols-4 gap-2">
            <a
              routerLink="/claims"
              class="flex flex-col items-center gap-2 py-2"
            >
              <div
                class="w-15 h-15 rounded-xl bg-green-50 flex items-center justify-center"
              >
                <i class="pi pi-wallet text-green-600 text-2xl!"></i>
              </div>
              <span class="text-sm font-semibold text-slate-700">Claims</span>
            </a>

            <a
              routerLink="/my-tasks"
              class="flex flex-col items-center gap-2 py-2"
            >
              <div
                class="w-15 h-15 rounded-xl bg-blue-50 flex items-center justify-center"
              >
                <i class="pi pi-list-check text-blue-600 text-2xl!"></i>
              </div>
              <span class="text-sm font-semibold text-slate-700">My Tasks</span>
            </a>

            <a
              routerLink="/leave"
              class="flex flex-col items-center gap-2 py-2"
            >
              <div
                class="w-15 h-15 rounded-xl bg-amber-50 flex items-center justify-center"
              >
                <i class="pi pi-calendar text-amber-600 text-2xl!"></i>
              </div>
              <span class="text-sm font-semibold text-slate-700">Leave</span>
            </a>

            <a
              routerLink="/announcements"
              class="flex flex-col items-center gap-2 py-2"
            >
              <div
                class="w-15 h-15 rounded-xl bg-violet-50 flex items-center justify-center"
              >
                <i class="pi pi-megaphone text-violet-600 text-2xl!"></i>
              </div>
              <span class="text-sm font-semibold text-slate-700"
                >Annoucements</span
              >
            </a>
          </div>
        </div>
      </div>

      <!-- ==================== SUPER ADMIN DASHBOARD ==================== -->
      @if (currentUser?.systemRole === 'SuperAdmin') {
        <div class="flex flex-col gap-6 px-5 mt-7">
          <!-- Section Heading -->
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-bold text-slate-800">Overview</h2>
              <p class="text-xs text-slate-400 mt-1">
                Company statistics and activities
              </p>
            </div>

            <span
              class="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full"
            >
              Super Admin
            </span>
          </div>

          <!-- Loading -->
          @if (dashboard()) {
            <!-- Statistics -->
            <div class="grid grid-cols-2 gap-3">
              <div
                class="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm"
              >
                <div class="flex items-center justify-between">
                  <div
                    class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"
                  >
                    <i class="pi pi-users text-blue-600 text-lg"></i>
                  </div>
                  <span class="text-xs text-slate-400">Users</span>
                </div>
                <div class="text-2xl font-bold text-slate-800 mt-4">
                  {{ dashboard()?.totalUsers ?? 0 }}
                </div>
                <div class="text-xs text-slate-500 mt-1">Total Users</div>
              </div>

              <div
                class="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm"
              >
                <div class="flex items-center justify-between">
                  <div
                    class="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center"
                  >
                    <i class="pi pi-user-check text-green-600 text-lg"></i>
                  </div>
                  <span class="text-xs text-slate-400">Active</span>
                </div>
                <div class="text-2xl font-bold text-slate-800 mt-4">
                  {{ dashboard()?.activeUsers ?? 0 }}
                </div>
                <div class="text-xs text-slate-500 mt-1">Active Users</div>
              </div>

              <div
                class="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm"
              >
                <div class="flex items-center justify-between">
                  <div
                    class="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center"
                  >
                    <i class="pi pi-user-minus text-red-600 text-lg"></i>
                  </div>
                  <span class="text-xs text-slate-400">Inactive</span>
                </div>
                <div class="text-2xl font-bold text-slate-800 mt-4">
                  {{ dashboard()?.inactiveUsers ?? 0 }}
                </div>
                <div class="text-xs text-slate-500 mt-1">Inactive Users</div>
              </div>

              <div
                class="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm"
              >
                <div class="flex items-center justify-between">
                  <div
                    class="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center"
                  >
                    <i class="pi pi-user-plus text-amber-600 text-lg"></i>
                  </div>
                  <span class="text-xs text-slate-400">Pending</span>
                </div>
                <div class="text-2xl font-bold text-slate-800 mt-4">
                  {{ dashboard()?.pendingApprovals ?? 0 }}
                </div>
                <div class="text-xs text-slate-500 mt-1">Pending Approvals</div>
              </div>

              <div
                class="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm"
              >
                <div class="flex items-center justify-between">
                  <div
                    class="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center"
                  >
                    <i class="pi pi-sitemap text-violet-600 text-lg"></i>
                  </div>
                  <span class="text-xs text-slate-400">Departments</span>
                </div>
                <div class="text-2xl font-bold text-slate-800 mt-4">
                  {{ dashboard()?.totalDepartments ?? 0 }}
                </div>
                <div class="text-xs text-slate-500 mt-1">Departments</div>
              </div>

              <div
                class="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm"
              >
                <div class="flex items-center justify-between">
                  <div
                    class="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center"
                  >
                    <i class="pi pi-box text-cyan-600 text-lg"></i>
                  </div>
                  <span class="text-xs text-slate-400">Inventory</span>
                </div>
                <div class="text-2xl font-bold text-slate-800 mt-4">
                  {{ dashboard()?.totalInventoryItems ?? 0 }}
                </div>
                <div class="text-xs text-slate-500 mt-1">Inventory Items</div>
              </div>

              <div
                class="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm"
              >
                <div class="flex items-center justify-between">
                  <div
                    class="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center"
                  >
                    <i
                      class="pi pi-exclamation-triangle text-orange-600 text-lg"
                    ></i>
                  </div>
                  <span class="text-xs text-slate-400">Low Stock</span>
                </div>
                <div class="text-2xl font-bold text-slate-800 mt-4">
                  {{ dashboard()?.lowStockItems ?? 0 }}
                </div>
                <div class="text-xs text-slate-500 mt-1">Low Stock Items</div>
              </div>

              <div
                class="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm"
              >
                <div class="flex items-center justify-between">
                  <div
                    class="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center"
                  >
                    <i class="pi pi-wrench text-rose-600 text-lg"></i>
                  </div>
                  <span class="text-xs text-slate-400">Faulty</span>
                </div>
                <div class="text-2xl font-bold text-slate-800 mt-4">
                  {{ dashboard()?.faultyItems ?? 0 }}
                </div>
                <div class="text-xs text-slate-500 mt-1">Faulty Items</div>
              </div>
            </div>

            <!-- Pending Registrations -->
            <div
              class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
            >
              <div class="flex items-center justify-between mb-4">
                <div>
                  <h3 class="font-bold text-slate-800">
                    Pending Registrations
                  </h3>
                  <p class="text-xs text-slate-400 mt-1">
                    Users awaiting approval
                  </p>
                </div>
                <a
                  routerLink="/user-management"
                  class="text-xs font-semibold text-blue-600"
                >
                  View All
                </a>
              </div>

              <!-- Registration list will be added using the actual DTO properties -->
            </div>

            <!-- Recent Activities -->
            <div
              class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
            >
              <div class="flex items-center justify-between mb-4">
                <h3 class="font-bold text-slate-800">Recent Activities</h3>
              </div>

              <!-- Activity list will be added using the actual DTO properties -->
            </div>
          } @else {
            <div
              class="bg-white rounded-2xl p-8 flex flex-col items-center justify-center"
            >
              <i class="pi pi-spin pi-spinner text-blue-600 text-2xl"></i>
              <span class="text-sm text-slate-500 mt-3">
                Loading dashboard...
              </span>
            </div>
          }
        </div>
      } @else {
        <!-- ==================== STAFF / HR / LOGISTICS DASHBOARD ==================== -->
        <div class="flex flex-col gap-6 px-5 mt-7">
          <!-- Quick Access -->
          <section>
            <div class="flex items-center justify-between mb-3">
              <div>
                <h2 class="text-lg font-bold text-slate-800">Quick Access</h2>
                <p class="text-xs text-slate-400 mt-1">
                  Your frequently used modules
                </p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <a
                routerLink="/directory"
                class="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-xl shadow-sm"
              >
                <div
                  class="w-10 h-10 shrink-0 bg-blue-50 rounded-xl flex items-center justify-center"
                >
                  <i class="pi pi-users text-blue-700 text-lg"></i>
                </div>
                <div class="min-w-0">
                  <div class="font-semibold text-sm text-slate-800">
                    Directory
                  </div>
                  <span class="text-xs text-slate-400">Find coworkers</span>
                </div>
              </a>

              <a
                routerLink="/projects"
                class="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-xl shadow-sm"
              >
                <div
                  class="w-10 h-10 shrink-0 bg-violet-50 rounded-xl flex items-center justify-center"
                >
                  <i class="pi pi-briefcase text-violet-700 text-lg"></i>
                </div>
                <div class="min-w-0">
                  <div class="font-semibold text-sm text-slate-800">
                    Projects
                  </div>
                  <span class="text-xs text-slate-400">Project updates</span>
                </div>
              </a>

              <a
                routerLink="/inventory/listing"
                class="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-xl shadow-sm"
              >
                <div
                  class="w-10 h-10 shrink-0 bg-green-50 rounded-xl flex items-center justify-center"
                >
                  <i class="pi pi-box text-green-700 text-lg"></i>
                </div>
                <div class="min-w-0">
                  <div class="font-semibold text-sm text-slate-800">
                    Inventory
                  </div>
                  <span class="text-xs text-slate-400">Warehouse stock</span>
                </div>
              </a>

              <a
                routerLink="/hardware-request"
                class="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-xl shadow-sm"
              >
                <div
                  class="w-10 h-10 shrink-0 bg-orange-50 rounded-xl flex items-center justify-center"
                >
                  <i class="pi pi-file text-orange-700 text-lg"></i>
                </div>
                <div class="min-w-0">
                  <div class="font-semibold text-sm text-slate-800">
                    Hardware
                  </div>
                  <span class="text-xs text-slate-400">Request equipment</span>
                </div>
              </a>
            </div>
          </section>

          <!-- Tasks -->
          <section>
            <div class="flex items-center justify-between mb-3">
              <div>
                <h2 class="text-lg font-bold text-slate-800">Tasks to Do</h2>
                <p class="text-xs text-slate-400 mt-1">Your assigned tasks</p>
              </div>

              <a
                routerLink="/my-tasks"
                class="flex items-center gap-1 text-sm font-semibold text-blue-600"
              >
                View All
                <i class="pi pi-chevron-right text-xs"></i>
              </a>
            </div>

            <div class="flex flex-col gap-3">
              @for (task of filteredTasks; track task.id) {
                <div
                  class="bg-white rounded-xl border border-slate-100 shadow-sm p-4 border-l-4"
                  [ngClass]="{
                    'border-l-red-500': task.priority === 'Critical',
                    'border-l-orange-500': task.priority === 'High',
                    'border-l-amber-500': task.priority === 'Medium',
                    'border-l-blue-500': task.priority === 'Low',
                  }"
                >
                  <div class="flex items-start gap-3">
                    <p-checkbox
                      [binary]="true"
                      [(ngModel)]="task.isCompleted"
                    ></p-checkbox>

                    <div class="flex-1 min-w-0">
                      <div
                        class="font-semibold text-sm text-slate-800"
                        [class.line-through]="task.isCompleted"
                        [class.text-slate-400]="task.isCompleted"
                      >
                        {{ task.title }}
                      </div>

                      <p class="text-xs text-slate-400 mt-1 line-clamp-2">
                        {{ task.description }}
                      </p>

                      <div class="flex items-center justify-between gap-2 mt-3">
                        <div
                          class="flex items-center gap-1.5 text-xs text-slate-500"
                        >
                          <i class="pi pi-calendar text-slate-400"></i>
                          <span>
                            {{ task.dueDate | date: 'dd MMM yyyy' }}
                          </span>
                        </div>

                        <span
                          class="text-[10px] font-semibold px-2 py-1 rounded-full"
                          [ngClass]="{
                            'bg-red-50 text-red-600':
                              task.priority === 'Critical',
                            'bg-orange-50 text-orange-600':
                              task.priority === 'High',
                            'bg-amber-50 text-amber-600':
                              task.priority === 'Medium',
                            'bg-blue-50 text-blue-600': task.priority === 'Low',
                          }"
                        >
                          {{ task.priority }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              } @empty {
                <div
                  class="bg-white rounded-xl border border-slate-100 p-6 text-center"
                >
                  <i class="pi pi-check-circle text-3xl text-green-500"></i>
                  <p class="text-sm font-semibold text-slate-700 mt-3">
                    No pending tasks
                  </p>
                  <p class="text-xs text-slate-400 mt-1">
                    You're all caught up!
                  </p>
                </div>
              }
            </div>
          </section>
        </div>
      }

      <!-- ==================== BOTTOM SPACING ==================== -->
      <div class="h-6"></div>
    </div>
  `,
  styleUrl: './mobile-dashboard.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileDashboard implements OnInit, OnDestroy {
  // ==================== SERVICES ====================

  private readonly loadingService = inject(LoadingService);
  private readonly appService = inject(AppService);
  private readonly staffTaskService = inject(StaffTaskService);
  private readonly userService = inject(UserService);
  private readonly cdr = inject(ChangeDetectorRef);

  // ==================== SUBSCRIPTION ====================

  private readonly ngUnsubscribe = new Subject<void>();

  // ==================== USER ====================

  currentUser = this.userService.currentUser;

  get isSuperAdmin(): boolean {
    return this.currentUser?.systemRole?.toLowerCase() === 'superadmin';
  }

  // ==================== DASHBOARD DATA ====================

  dashboard = signal<SuperAdminDashboardDto | null>(null);

  staffTask: any[] = [];

  // ==================== UI STATE ====================

  searchTerm = '';

  // ==================== INITIALIZATION ====================

  ngOnInit(): void {
    if (this.isSuperAdmin) {
      this.loadSuperAdminDashboard();
    } else {
      this.loadStaffTasks();
    }
  }

  // ==================== SUPER ADMIN DASHBOARD ====================

  private loadSuperAdminDashboard(): void {
    this.loadingService.start();

    this.appService
      .GetSuperAdminDashboard()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.dashboard.set(res);

          this.loadingService.stop();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Failed to load Super Admin dashboard:', err);

          this.loadingService.stop();
          this.cdr.markForCheck();
        },
      });
  }

  // ==================== STAFF TASKS ====================

  private loadStaffTasks(): void {
    this.loadingService.start();

    this.staffTaskService
      .GetMany({
        Page: 1,
        PageSize: 3,
        OrderBy: 'DueDate',
        Select: null,
        Includes: null,
        Filter: `AssignedToId=${this.currentUser?.userId} | OrganizedById=${this.currentUser?.userId}`,
      })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.staffTask = res?.data ?? [];

          this.loadingService.stop();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Failed to load staff tasks:', err);

          this.staffTask = [];

          this.loadingService.stop();
          this.cdr.markForCheck();
        },
      });
  }

  // ==================== USER INITIAL ====================

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

  // ==================== FILTER TASKS ====================

  get filteredTasks(): any[] {
    const search = this.searchTerm.trim().toLowerCase();

    if (!search) {
      return this.staffTask;
    }

    return this.staffTask.filter((task: any) => {
      return (
        task.title?.toLowerCase().includes(search) ||
        task.description?.toLowerCase().includes(search)
      );
    });
  }

  // ==================== DESTROY ====================

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
