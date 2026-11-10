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
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { LoadingService } from '../../../services/loading.service';
import { UserService } from '../../../services/userService.service';
import { AppService } from '../../../services/appService.service';
import { StaffTaskService } from '../../../services/staffTaskService';
import { SuperAdminDashboardDto } from '../../../models/AppModels';

import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-mobile-dashboard',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    CheckboxModule,
    InputTextModule,
  ],
  template: `
    <div class="min-h-screen bg-slate-50 flex flex-col pb-8">
      <!-- HEADER -->
      <header class="relative overflow-hidden bg-[#2148BC] rounded-b-[2rem]">
        <div
          class="absolute -top-16 -right-12 w-56 h-56 rounded-full border border-white/10"
        ></div>
        <div
          class="absolute top-5 -right-16 w-48 h-48 rounded-full bg-white/5"
        ></div>

        <div class="relative z-10 px-5 pt-6 pb-10">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div
                class="w-11 h-11 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center"
              >
                <span class="font-bold text-white text-lg">YL</span>
              </div>

              <div>
                <div class="text-white font-bold tracking-wide">
                  Works Enterprise
                </div>
                <div class="text-white/60 text-[10px] tracking-widest">
                  OFFICE MANAGEMENT
                </div>
              </div>
            </div>

            <div
              class="w-10 h-10 rounded-full bg-[#FCDF7B] border border-[#e5c85f] flex items-center justify-center"
            >
              <span class="font-bold text-slate-800 text-sm">
                {{
                  getInitial(
                    currentUser?.displayName || currentUser?.fullName
                  )
                }}
              </span>
            </div>
          </div>

          <div class="mt-8">
            <p class="text-white/70 text-sm">Welcome back,</p>

            <h1 class="text-2xl font-bold text-white mt-1">
              {{
                currentUser?.displayName ||
                  currentUser?.fullName ||
                  'Employee'
              }}
            </h1>

            <div class="flex items-center gap-2 mt-2 text-white/80 text-sm">
              <i class="pi pi-briefcase text-sm!"></i>
              <span>{{
                currentUser?.jobTitle || currentUser?.systemRole || 'Employee'
              }}</span>
            </div>

            <div class="relative mt-5">
              <input
                pInputText
                [(ngModel)]="searchTerm"
                placeholder="Search your tasks..."
                class="w-full rounded-xl! bg-white! border-0! py-3! pl-11! pr-4! text-sm!"
              />

              <i
                class="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              ></i>
            </div>
          </div>
        </div>
      </header>

      <!-- ROLE QUICK ACTIONS -->
      <div class="relative z-20 px-5 -mt-5">
        <div class="bg-white rounded-2xl shadow-lg border border-slate-100 p-3">
          <div class="grid grid-cols-4 gap-2">
            @if (isSuperAdmin) {
              <a routerLink="/user-management" class="quick-action">
                <i class="pi pi-users text-blue-600"></i>
                <span>Users</span>
              </a>

              <a routerLink="/inventory/listing" class="quick-action">
                <i class="pi pi-box text-green-600"></i>
                <span>Inventory</span>
              </a>

              <a routerLink="/announcements" class="quick-action">
                <i class="pi pi-megaphone text-violet-600"></i>
                <span>News</span>
              </a>

              <a routerLink="/activity-log" class="quick-action">
                <i class="pi pi-history text-amber-600"></i>
                <span>Activity</span>
              </a>
            } @else if (isHR) {
              <a routerLink="/user-management" class="quick-action">
                <i class="pi pi-users text-blue-600"></i>
                <span>Employees</span>
              </a>

              <a routerLink="/leave" class="quick-action">
                <i class="pi pi-calendar text-amber-600"></i>
                <span>Leave</span>
              </a>

              <a routerLink="/announcements" class="quick-action">
                <i class="pi pi-megaphone text-violet-600"></i>
                <span>News</span>
              </a>

              <a routerLink="/directory" class="quick-action">
                <i class="pi pi-address-book text-green-600"></i>
                <span>Directory</span>
              </a>
            } @else if (isLogistics) {
              <a routerLink="/inventory/listing" class="quick-action">
                <i class="pi pi-box text-green-600"></i>
                <span>Inventory</span>
              </a>

              <a routerLink="/hardware-request" class="quick-action">
                <i class="pi pi-file text-orange-600"></i>
                <span>Requests</span>
              </a>

              <a routerLink="/my-tasks" class="quick-action">
                <i class="pi pi-list-check text-blue-600"></i>
                <span>My Tasks</span>
              </a>

              <a routerLink="/announcements" class="quick-action">
                <i class="pi pi-megaphone text-violet-600"></i>
                <span>News</span>
              </a>
            } @else {
              <a routerLink="/claims" class="quick-action">
                <i class="pi pi-wallet text-green-600"></i>
                <span>Claims</span>
              </a>

              <a routerLink="/my-tasks" class="quick-action">
                <i class="pi pi-list-check text-blue-600"></i>
                <span>My Tasks</span>
              </a>

              <a routerLink="/leave" class="quick-action">
                <i class="pi pi-calendar text-amber-600"></i>
                <span>Leave</span>
              </a>

              <a routerLink="/announcements" class="quick-action">
                <i class="pi pi-megaphone text-violet-600"></i>
                <span>News</span>
              </a>
            }
          </div>
        </div>
      </div>

      <!-- SUPER ADMIN DASHBOARD -->
      @if (isSuperAdmin) {
        <main class="dashboard-content">
          <div class="dashboard-section-heading">
            <div>
              <h2>Company Overview</h2>
              <p>Company statistics and system activities</p>
            </div>
            <span class="role-label role-superadmin">Super Admin</span>
          </div>

          @if (dashboard(); as data) {
            <div class="dashboard-stat-grid">
              <div class="dashboard-stat-card">
                <div class="stat-card-top">
                  <div class="stat-icon stat-blue">
                    <i class="pi pi-users"></i>
                  </div>
                  <span class="text-xs text-slate-400">Users</span>
                </div>
                <div class="stat-value">{{ data.totalUsers }}</div>
                <div class="stat-label">Total Users</div>
              </div>

              <div class="dashboard-stat-card">
                <div class="stat-card-top">
                  <div class="stat-icon stat-green">
                    <i class="pi pi-check-circle"></i>
                  </div>
                  <span class="text-xs text-slate-400">Active</span>
                </div>
                <div class="stat-value">{{ data.activeUsers }}</div>
                <div class="stat-label">Active Users</div>
              </div>

              <div class="dashboard-stat-card">
                <div class="stat-card-top">
                  <div class="stat-icon stat-red">
                    <i class="pi pi-user-minus"></i>
                  </div>
                  <span class="text-xs text-slate-400">Inactive</span>
                </div>
                <div class="stat-value">{{ data.inactiveUsers }}</div>
                <div class="stat-label">Inactive Users</div>
              </div>

              <div class="dashboard-stat-card">
                <div class="stat-card-top">
                  <div class="stat-icon stat-amber">
                    <i class="pi pi-user-plus"></i>
                  </div>
                  <span class="text-xs text-slate-400">Pending</span>
                </div>
                <div class="stat-value">{{ data.pendingApprovals }}</div>
                <div class="stat-label">Pending Approvals</div>
              </div>

              <div class="dashboard-stat-card">
                <div class="stat-card-top">
                  <div class="stat-icon stat-violet">
                    <i class="pi pi-sitemap"></i>
                  </div>
                  <span class="text-xs text-slate-400">Departments</span>
                </div>
                <div class="stat-value">{{ data.totalDepartments }}</div>
                <div class="stat-label">Departments</div>
              </div>

              <div class="dashboard-stat-card">
                <div class="stat-card-top">
                  <div class="stat-icon stat-cyan">
                    <i class="pi pi-box"></i>
                  </div>
                  <span class="text-xs text-slate-400">Inventory</span>
                </div>
                <div class="stat-value">
                  {{ data.totalInventoryItems }}
                </div>
                <div class="stat-label">Inventory Items</div>
              </div>

              <div class="dashboard-stat-card">
                <div class="stat-card-top">
                  <div class="stat-icon stat-orange">
                    <i class="pi pi-exclamation-triangle"></i>
                  </div>
                  <span class="text-xs text-slate-400">Low Stock</span>
                </div>
                <div class="stat-value">{{ data.lowStockItems }}</div>
                <div class="stat-label">Low Stock Items</div>
              </div>

              <div class="dashboard-stat-card">
                <div class="stat-card-top">
                  <div class="stat-icon stat-rose">
                    <i class="pi pi-wrench"></i>
                  </div>
                  <span class="text-xs text-slate-400">Faulty</span>
                </div>
                <div class="stat-value">{{ data.faultyItems }}</div>
                <div class="stat-label">Faulty Items</div>
              </div>
            </div>

            <!-- PENDING REGISTRATIONS -->
            <section class="dashboard-card">
              <div class="dashboard-card-heading">
                <div>
                  <h3>Pending Registrations</h3>
                  <p>Users waiting for account approval</p>
                </div>
                <a routerLink="/user-management">View All</a>
              </div>

              @if (data.pendingUsers.length) {
                <div class="flex flex-col">
                  @for (user of data.pendingUsers; track user.id || $index) {
                    <div class="leave-event">
                      <div class="leave-avatar">
                        {{ getInitial(user.displayName || user.fullName) }}
                      </div>

                      <div class="leave-event-info">
                        <strong>{{
                          user.displayName ||
                            user.fullName ||
                            user.displayName ||
                            'New User'
                        }}</strong>
                        <span>{{ user.email || 'Pending registration' }}</span>
                      </div>

                      <span class="leave-days">Pending</span>
                    </div>
                  }
                </div>
              } @else {
                <div class="dashboard-empty">
                  <i class="pi pi-check-circle"></i>
                  <span>No pending registrations</span>
                </div>
              }
            </section>

            <!-- RECENT ACTIVITIES -->
            <section class="dashboard-card">
              <div class="dashboard-card-heading">
                <div>
                  <h3>Recent Activities</h3>
                  <p>Latest actions in the system</p>
                </div>
              </div>

              @if (data.activities.length) {
                <div class="flex flex-col gap-4">
                  @for (
                    activity of data.activities;
                    track activity.id || $index
                  ) {
                    <div class="flex items-start gap-3">
                      <div
                        class="w-9 h-9 shrink-0 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"
                      >
                        <i class="pi pi-history text-sm"></i>
                      </div>

                      <div class="flex-1 min-w-0">
                        <div class="text-xs font-semibold text-slate-700">
                          {{
                            activity.description ||
                              activity.title ||
                              'System activity'
                          }}
                        </div>
                        <div class="text-[10px] text-slate-400 mt-1">
                          {{ activity.user }}
                          @if (activity.date) {
                            ·
                            {{ activity.date | date: 'dd MMM yyyy, hh:mm aa' }}
                          }
                        </div>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="dashboard-empty">
                  <i class="pi pi-history"></i>
                  <span>No recent activities available</span>
                </div>
              }
            </section>
          } @else {
            <div class="dashboard-loading">
              <i class="pi pi-spin pi-spinner"></i>
              <span>Loading company dashboard...</span>
            </div>
          }
        </main>

        <!-- HR DASHBOARD -->
      } @else if (isHR) {
        <main class="dashboard-content">
          <div class="dashboard-section-heading">
            <div>
              <h2>HR Overview</h2>
              <p>Employee and leave management summary</p>
            </div>
            <span class="role-label role-hr">Human Resources</span>
          </div>

          @if (hrDashboard(); as data) {
            <div class="dashboard-stat-grid">
              <div class="dashboard-stat-card">
                <div class="stat-card-top">
                  <div class="stat-icon stat-blue">
                    <i class="pi pi-users"></i>
                  </div>
                  <span class="text-xs text-slate-400">Employees</span>
                </div>
                <div class="stat-value">{{ data.totalEmployees }}</div>
                <div class="stat-label">Total Employees</div>
              </div>

              <div class="dashboard-stat-card">
                <div class="stat-card-top">
                  <div class="stat-icon stat-amber">
                    <i class="pi pi-clock"></i>
                  </div>
                  <span class="text-xs text-slate-400">Pending</span>
                </div>
                <div class="stat-value">{{ data.pendingLeave }}</div>
                <div class="stat-label">Pending Leave Requests</div>
              </div>

              <div class="dashboard-stat-card">
                <div class="stat-card-top">
                  <div class="stat-icon stat-orange">
                    <i class="pi pi-calendar-minus"></i>
                  </div>
                  <span class="text-xs text-slate-400">Today</span>
                </div>
                <div class="stat-value">{{ data.onLeaveToday }}</div>
                <div class="stat-label">On Leave Today</div>
              </div>

              <div class="dashboard-stat-card">
                <div class="stat-card-top">
                  <div class="stat-icon stat-green">
                    <i class="pi pi-user-check"></i>
                  </div>
                  <span class="text-xs text-slate-400">Present</span>
                </div>
                <div class="stat-value">
                  {{ data.assumedPresentToday }}
                </div>
                <div class="stat-label">Assumed Present Today</div>
              </div>

              <div class="dashboard-stat-card">
                <div class="stat-card-top">
                  <div class="stat-icon stat-red">
                    <i class="pi pi-user-minus"></i>
                  </div>
                  <span class="text-xs text-slate-400">Resigned</span>
                </div>
                <div class="stat-value">{{ data.resignedStaff }}</div>
                <div class="stat-label">Resigned Staff</div>
              </div>

              <div class="dashboard-stat-card">
                <div class="stat-card-top">
                  <div class="stat-icon stat-violet">
                    <i class="pi pi-user-plus"></i>
                  </div>
                  <span class="text-xs text-slate-400">New Staff</span>
                </div>
                <div class="stat-value">
                  {{ data.newStaffUnderOneYear }}
                </div>
                <div class="stat-label">Joined Within One Year</div>
              </div>
            </div>

            <!-- DEPARTMENT DISTRIBUTION -->
            <section class="dashboard-card">
              <div class="dashboard-card-heading">
                <div>
                  <h3>Department Distribution</h3>
                  <p>Employee count by department</p>
                </div>
              </div>

              @if (data.departmentDistribution.length) {
                <div class="department-list">
                  @for (
                    department of data.departmentDistribution;
                    track department.departmentId || $index
                  ) {
                    <div>
                      <div class="department-item-heading">
                        <span>{{ department.department }}</span>
                        <strong>{{ department.count }}</strong>
                      </div>

                      <div class="department-progress">
                        <div
                          class="department-progress-value"
                          [style.width.%]="
                            getPercentage(department.count, data.totalEmployees)
                          "
                        ></div>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="dashboard-empty">
                  <i class="pi pi-chart-bar"></i>
                  <span>No department data available</span>
                </div>
              }
            </section>

            <!-- TODAY'S LEAVE -->
            <section class="dashboard-card">
              <div class="dashboard-card-heading">
                <div>
                  <h3>Employees on Leave Today</h3>
                  <p>Today's leave schedule</p>
                </div>
                <a routerLink="/leave">View All</a>
              </div>

              @if (data.todayLeaveEvents.length) {
                <div class="flex flex-col">
                  @for (
                    leave of data.todayLeaveEvents;
                    track leave.requestId || $index
                  ) {
                    <div class="leave-event">
                      <div class="leave-avatar">
                        {{ getInitial(leave.employeeName) }}
                      </div>

                      <div class="leave-event-info">
                        <strong>{{ leave.employeeName }}</strong>
                        <span>{{ leave.leaveTypeName || 'Leave' }}</span>
                        <small>
                          {{ leave.startDate | date: 'dd MMM' }}
                          -
                          {{ leave.endDate | date: 'dd MMM yyyy' }}
                        </small>
                      </div>

                      <span class="leave-days">
                        {{ leave.totalDays }} day(s)
                      </span>
                    </div>
                  }
                </div>
              } @else {
                <div class="dashboard-empty">
                  <i class="pi pi-calendar-check"></i>
                  <span>No employees on leave today</span>
                </div>
              }
            </section>
          } @else {
            <div class="dashboard-loading">
              <i class="pi pi-spin pi-spinner"></i>
              <span>Loading HR dashboard...</span>
            </div>
          }
        </main>

        <!-- LOGISTICS DASHBOARD -->
      } @else if (isLogistics) {
        <main class="dashboard-content">
          <div class="dashboard-section-heading">
            <div>
              <h2>Logistics Overview</h2>
              <p>Inventory and warehouse summary</p>
            </div>
            <span class="role-label role-logistics">Logistics</span>
          </div>

          @if (logisticsDashboard(); as data) {
            <div class="dashboard-stat-grid">
              <div class="dashboard-stat-card">
                <div class="stat-card-top">
                  <div class="stat-icon stat-blue">
                    <i class="pi pi-box"></i>
                  </div>
                  <span class="text-xs text-slate-400">Items</span>
                </div>
                <div class="stat-value">{{ data.totalItems }}</div>
                <div class="stat-label">Total Inventory Items</div>
              </div>

              <div class="dashboard-stat-card">
                <div class="stat-card-top">
                  <div class="stat-icon stat-amber">
                    <i class="pi pi-exclamation-triangle"></i>
                  </div>
                  <span class="text-xs text-slate-400">Low Stock</span>
                </div>
                <div class="stat-value">{{ data.lowStockItems }}</div>
                <div class="stat-label">Low Stock Items</div>
              </div>

              <div class="dashboard-stat-card">
                <div class="stat-card-top">
                  <div class="stat-icon stat-red">
                    <i class="pi pi-wrench"></i>
                  </div>
                  <span class="text-xs text-slate-400">Faulty</span>
                </div>
                <div class="stat-value">{{ data.faultyItems }}</div>
                <div class="stat-label">Faulty Items</div>
              </div>

              <div class="dashboard-stat-card">
                <div class="stat-card-top">
                  <div class="stat-icon stat-violet">
                    <i class="pi pi-file-edit"></i>
                  </div>
                  <span class="text-xs text-slate-400">Requests</span>
                </div>
                <div class="stat-value">{{ data.pendingRequests }}</div>
                <div class="stat-label">Pending Requests</div>
              </div>
            </div>

            <!-- RESTOCK ALERTS -->
            <section class="dashboard-card">
              <div class="dashboard-card-heading">
                <div>
                  <h3>Restock Alerts</h3>
                  <p>Items that need replenishment</p>
                </div>
                <a routerLink="/inventory/listing">Inventory</a>
              </div>

              @if (data.restockAlerts.length) {
                <div class="restock-list">
                  @for (item of data.restockAlerts; track item.id || $index) {
                    <div class="restock-item">
                      <div class="restock-icon">
                        <i class="pi pi-box"></i>
                      </div>

                      <div class="restock-info">
                        <strong>{{ item.name }}</strong>
                        <span>
                          {{ item.brand || 'Unbranded' }}
                          @if (item.section?.name) {
                            · {{ item.section.name }}
                          }
                        </span>
                      </div>

                      <div class="restock-quantity">
                        <strong>{{ item.quantity }}</strong>
                        <small>Par: {{ item.parLevel }}</small>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="dashboard-empty">
                  <i class="pi pi-check-circle"></i>
                  <span>No restock alerts</span>
                </div>
              }
            </section>

            <!-- INVENTORY CATEGORIES -->
            <section class="dashboard-card">
              <div class="dashboard-card-heading">
                <div>
                  <h3>Inventory by Category</h3>
                  <p>Items grouped by category</p>
                </div>
              </div>

              @if (data.categoryChart.length) {
                <div class="department-list">
                  @for (
                    category of data.categoryChart;
                    track category.categoryName || $index
                  ) {
                    <div>
                      <div class="department-item-heading">
                        <span>{{ category.categoryName }}</span>
                        <strong>{{ category.total }}</strong>
                      </div>

                      <div class="department-progress">
                        <div
                          class="department-progress-value"
                          [style.width.%]="
                            getPercentage(category.total, data.totalItems)
                          "
                        ></div>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="dashboard-empty">
                  <i class="pi pi-chart-bar"></i>
                  <span>No category data available</span>
                </div>
              }
            </section>
          } @else {
            <div class="dashboard-loading">
              <i class="pi pi-spin pi-spinner"></i>
              <span>Loading logistics dashboard...</span>
            </div>
          }
        </main>

        <!-- OTHER ROLES: MANAGEMENT / HOD / STAFF / SUPPORT -->
      } @else {
        <main class="dashboard-content">
          <div class="dashboard-section-heading">
            <div>
              <h2>My Workspace</h2>
              <p>Your tasks and frequently used modules</p>
            </div>
            <span class="role-label role-staff">
              {{ currentUser?.systemRole || 'Employee' }}
            </span>
          </div>

          <!-- QUICK ACCESS -->
          <section>
            <div class="section-title">
              <h3>Quick Access</h3>
              <p>Frequently used modules</p>
            </div>

            <div class="dashboard-quick-grid">
              <a routerLink="/directory" class="dashboard-quick-card">
                <div class="quick-icon quick-blue">
                  <i class="pi pi-users"></i>
                </div>
                <div>
                  <strong>Directory</strong>
                  <span>Find coworkers</span>
                </div>
                <i class="pi pi-chevron-right quick-arrow"></i>
              </a>

              <a routerLink="/projects" class="dashboard-quick-card">
                <div class="quick-icon quick-violet">
                  <i class="pi pi-briefcase"></i>
                </div>
                <div>
                  <strong>Projects</strong>
                  <span>Project updates</span>
                </div>
                <i class="pi pi-chevron-right quick-arrow"></i>
              </a>

              <a routerLink="/inventory/listing" class="dashboard-quick-card">
                <div class="quick-icon quick-green">
                  <i class="pi pi-box"></i>
                </div>
                <div>
                  <strong>Inventory</strong>
                  <span>Warehouse stock</span>
                </div>
                <i class="pi pi-chevron-right quick-arrow"></i>
              </a>

              <a routerLink="/hardware-request" class="dashboard-quick-card">
                <div class="quick-icon quick-orange">
                  <i class="pi pi-file"></i>
                </div>
                <div>
                  <strong>Hardware</strong>
                  <span>Request equipment</span>
                </div>
                <i class="pi pi-chevron-right quick-arrow"></i>
              </a>
            </div>
          </section>

          <!-- TASKS -->
          <section>
            <div class="section-title section-title-action">
              <div>
                <h3>Tasks to Do</h3>
                <p>Your assigned tasks</p>
              </div>

              <a routerLink="/my-tasks">
                View All <i class="pi pi-chevron-right text-[9px]"></i>
              </a>
            </div>

            @if (filteredTasks.length) {
              <div class="task-list">
                @for (task of filteredTasks; track task.id) {
                  <div class="task-card">
                    <div
                      class="task-priority-bar"
                      [ngClass]="getPriorityClass(task.priority)"
                    ></div>

                    <div class="task-card-content">
                      <p-checkbox
                        [binary]="true"
                        [(ngModel)]="task.isCompleted"
                      ></p-checkbox>

                      <div class="task-info">
                        <strong
                          [class.line-through]="task.isCompleted"
                          [class.text-slate-400]="task.isCompleted"
                        >
                          {{ task.title }}
                        </strong>

                        <p>{{ task.description }}</p>

                        <div class="task-meta">
                          <span>
                            <i class="pi pi-calendar"></i>
                            {{ task.dueDate | date: 'dd MMM yyyy' }}
                          </span>

                          <span
                            class="task-priority-label"
                            [ngClass]="getPriorityLabelClass(task.priority)"
                          >
                            {{ task.priority || 'Normal' }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <div class="task-empty p-6 text-center">
                <i class="pi pi-check-circle text-2xl text-green-500"></i>
                <p class="mt-2">
                  <strong>
                    {{ searchTerm ? 'No matching tasks' : 'No pending tasks' }}
                  </strong>
                </p>
                <p class="text-xs text-slate-400 mt-1">
                  {{
                    searchTerm
                      ? 'Try another search keyword.'
                      : 'You are all caught up!'
                  }}
                </p>
              </div>
            }
          </section>
        </main>
      }

      <div class="h-6"></div>
    </div>
  `,
  styleUrl: './mobile-dashboard.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileDashboard implements OnInit, OnDestroy {
  private readonly loadingService = inject(LoadingService);
  private readonly appService = inject(AppService);
  private readonly staffTaskService = inject(StaffTaskService);
  private readonly userService = inject(UserService);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly ngUnsubscribe = new Subject<void>();

  currentUser = this.userService.currentUser;

  dashboard = signal<SuperAdminDashboardDto | null>(null);
  hrDashboard = signal<any | null>(null);
  logisticsDashboard = signal<any | null>(null);

  staffTask: any[] = [];
  searchTerm = '';

  get isSuperAdmin(): boolean {
    return this.currentUser?.systemRole?.toLowerCase() === 'superadmin';
  }

  get isHR(): boolean {
    return this.currentUser?.systemRole?.toLowerCase() === 'hr';
  }

  get isLogistics(): boolean {
    return this.currentUser?.systemRole?.toLowerCase() === 'logistics';
  }

  ngOnInit(): void {
    if (this.isSuperAdmin) {
      this.loadSuperAdminDashboard();
    } else if (this.isHR) {
      this.loadHrDashboard();
    } else if (this.isLogistics) {
      this.loadLogisticDashboard();
    } else {
      this.loadStaffTasks();
    }
  }

  // SUPER ADMIN

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

  // HR

  private loadHrDashboard(): void {
    this.loadingService.start();

    this.appService
      .GetHrDashboard()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.hrDashboard.set(res);
          this.loadingService.stop();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Failed to load HR dashboard:', err);
          this.loadingService.stop();
          this.cdr.markForCheck();
        },
      });
  }

  // LOGISTICS

  private loadLogisticDashboard(): void {
    this.loadingService.start();

    this.appService
      .GetLogisticDashboard()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.logisticsDashboard.set(res);
          this.loadingService.stop();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Failed to load Logistics dashboard:', err);
          this.loadingService.stop();
          this.cdr.markForCheck();
        },
      });
  }

  // STAFF / OTHER ROLES

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

  // HELPERS

  getInitial(fullName?: string): string {
    if (!fullName?.trim()) return '?';

    const names = fullName.trim().split(/\s+/).filter(Boolean);

    if (names.length === 1) {
      return names[0].substring(0, 2).toUpperCase();
    }

    return (
      names[0].charAt(0) + names[names.length - 1].charAt(0)
    ).toUpperCase();
  }

  getPercentage(
    value: number | null | undefined,
    total: number | null | undefined,
  ): number {
    if (!total || total <= 0 || !value) return 0;

    return Math.min(100, Math.max(0, (value / total) * 100));
  }

  getPriorityClass(priority?: string): string {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return 'priority-critical';
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      default:
        return 'priority-low';
    }
  }

  getPriorityLabelClass(priority?: string): string {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return 'priority-label-critical';
      case 'high':
        return 'priority-label-high';
      case 'medium':
        return 'priority-label-medium';
      default:
        return 'priority-label-low';
    }
  }

  get filteredTasks(): any[] {
    const search = this.searchTerm.trim().toLowerCase();

    if (!search) return this.staffTask;

    return this.staffTask.filter(
      (task: any) =>
        task.title?.toLowerCase().includes(search) ||
        task.description?.toLowerCase().includes(search),
    );
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
