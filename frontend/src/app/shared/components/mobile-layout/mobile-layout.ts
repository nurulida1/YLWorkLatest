import { CommonModule } from '@angular/common';

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  OnInit,
} from '@angular/core';

import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

import { NotificationService } from '../../../services/notificationService.service';
import { UserService } from '../../../services/userService.service';

import { LoginResponse } from '../../../models/User';

// ==========================================
// INTERFACES
// ==========================================

interface QuickAction {
  label: string;
  description: string;
  icon: string;
  route: string;
  color: string;
  background: string;
}

interface WorkMenuItem {
  label: string;
  description?: string;
  icon?: string;
  route?: string;
  roles?: string[];
  items?: WorkMenuItem[];
}

// ==========================================
// COMPONENT
// ==========================================

@Component({
  selector: 'app-mobile-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="mobile-layout">
      <!-- ====================================== -->
      <!-- MAIN CONTENT -->
      <!-- ====================================== -->

      <main class="mobile-content">
        <router-outlet></router-outlet>
      </main>

      <!-- ====================================== -->
      <!-- BOTTOM NAVIGATION -->
      <!-- ====================================== -->

      <nav class="bottom-navigation" aria-label="Main navigation">
        <!-- HOME -->
        <a
          routerLink="/dashboard"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: true }"
          class="nav-item"
          (click)="closeAllSheets()"
        >
          <i class="pi pi-home"></i>
          <span>Home</span>
        </a>

        <!-- MY WORK -->
        <button
          type="button"
          class="nav-item"
          [class.active]="showWorkMenu"
          [attr.aria-expanded]="showWorkMenu"
          (click)="toggleWorkMenu()"
        >
          <i class="pi pi-briefcase"></i>
          <span>My Work</span>
        </button>

        <!-- CREATE -->
        <div class="quick-action-wrapper">
          <button
            type="button"
            class="quick-action-button"
            [class.active]="showQuickActions"
            [attr.aria-expanded]="showQuickActions"
            aria-label="Open create actions"
            (click)="toggleActions()"
          >
            <i
              class="pi"
              [class.pi-plus]="!showQuickActions"
              [class.pi-times]="showQuickActions"
            ></i>
          </button>

          <span class="quick-action-label">Create</span>
        </div>

        <!-- NOTIFICATIONS -->
        <a
          routerLink="/notifications"
          routerLinkActive="active"
          class="nav-item notification-nav-item"
          (click)="closeAllSheets()"
        >
          <span class="notification-icon-wrapper">
            <i class="pi pi-bell"></i>

            @if (unreadCount > 0) {
              <span class="notification-badge">
                {{ unreadCount > 99 ? '99+' : unreadCount }}
              </span>
            }
          </span>

          <span>Notifications</span>
        </a>

        <!-- SETTINGS -->
        <a
          routerLink="/mobile-settings"
          routerLinkActive="active"
          class="nav-item"
          (click)="closeAllSheets()"
        >
          <i class="pi pi-cog"></i>
          <span>Settings</span>
        </a>
      </nav>

      <!-- ====================================== -->
      <!-- BACKDROP -->
      <!-- ====================================== -->

      @if (showWorkMenu || showQuickActions) {
        <div
          class="mobile-sheet-backdrop show"
          (click)="closeAllSheets()"
        ></div>
      }

      <!-- ====================================== -->
      <!-- MY WORK BOTTOM SHEET -->
      <!-- ====================================== -->

      <section
        class="mobile-bottom-sheet work-menu-sheet"
        [class.show]="showWorkMenu"
        [attr.aria-hidden]="!showWorkMenu"
        aria-label="My Work and All Modules"
      >
        <div class="sheet-handle"></div>

        <!-- SHEET HEADER -->
        <div class="sheet-header">
          <div>
            <h3>My Work</h3>
            <p>Your work and application modules</p>
          </div>

          <button
            type="button"
            class="sheet-close-button"
            aria-label="Close menu"
            (click)="closeAllSheets()"
          >
            <i class="pi pi-times"></i>
          </button>
        </div>

        <div class="work-menu-list">
          <!-- ================================== -->
          <!-- SECTION 1: MY WORK -->
          <!-- ================================== -->

          <div class="menu-section">
            <div class="menu-section-heading">
              <div class="menu-section-heading-icon">
                <i class="pi pi-user"></i>
              </div>

              <div>
                <h4>My Work</h4>
                <p>Your daily work activities</p>
              </div>
            </div>

            <div class="menu-section-items">
              @for (item of myWorkItems; track item.route) {
                <a
                  class="work-menu-item"
                  [class.active]="isActive(item.route)"
                  [routerLink]="item.route"
                  (click)="closeAllSheets()"
                >
                  <div class="work-menu-icon">
                    <i [class]="'pi ' + (item.icon || 'pi-circle')"></i>
                  </div>

                  <div class="work-menu-text">
                    <span class="work-menu-title">
                      {{ item.label }}
                    </span>

                    <span class="work-menu-description">
                      {{ item.description }}
                    </span>
                  </div>

                  <i class="pi pi-angle-right work-menu-arrow"></i>
                </a>
              }
            </div>
          </div>

          <!-- ================================== -->
          <!-- SECTION 2: ALL MODULES -->
          <!-- ================================== -->

          <div class="menu-section all-modules-section">
            <div class="menu-section-heading">
              <div class="menu-section-heading-icon">
                <i class="pi pi-th-large"></i>
              </div>

              <div>
                <h4>All Modules</h4>
                <p>Explore other application modules</p>
              </div>
            </div>

            <div class="menu-section-items">
              @for (item of allModuleItems; track item.label) {
                <!-- GROUP MENU -->
                @if (item.items?.length) {
                  @if (hasVisibleSubItems(item)) {
                    <div class="work-menu-group">
                      <button
                        type="button"
                        class="work-menu-item work-menu-parent"
                        [class.expanded]="openMenu === item.label"
                        [class.menu-group-active]="isActive(undefined, item)"
                        [attr.aria-expanded]="openMenu === item.label"
                        (click)="toggleMenu(item.label)"
                      >
                        <div class="work-menu-icon">
                          <i [class]="'pi ' + (item.icon || 'pi-folder')"></i>
                        </div>

                        <div class="work-menu-text">
                          <span class="work-menu-title">
                            {{ item.label }}
                          </span>

                          <span class="work-menu-description">
                            {{ getMenuDescription(item) }}
                          </span>
                        </div>

                        <i
                          class="pi work-menu-arrow"
                          [class.pi-chevron-down]="openMenu === item.label"
                          [class.pi-chevron-right]="openMenu !== item.label"
                        ></i>
                      </button>

                      <!-- SUBMENU -->
                      @if (openMenu === item.label) {
                        <div class="work-submenu">
                          @for (
                            sub of getAllowedSubItems(item);
                            track sub.route || sub.label
                          ) {
                            <a
                              class="work-submenu-item"
                              [class.active]="isActive(sub.route)"
                              [routerLink]="sub.route"
                              (click)="closeAllSheets()"
                            >
                              <i
                                class="pi"
                                [class]="'pi ' + (sub.icon || 'pi-circle')"
                              ></i>

                              <span>{{ sub.label }}</span>

                              @if (isActive(sub.route)) {
                                <i class="pi pi-check submenu-active-icon"></i>
                              }
                            </a>
                          }
                        </div>
                      }
                    </div>
                  }
                } @else {
                  <!-- SINGLE MENU ITEM -->
                  @if (canView(item)) {
                    <a
                      class="work-menu-item"
                      [class.active]="isActive(item.route)"
                      [routerLink]="item.route"
                      (click)="closeAllSheets()"
                    >
                      <div class="work-menu-icon">
                        <i [class]="'pi ' + (item.icon || 'pi-circle')"></i>
                      </div>

                      <div class="work-menu-text">
                        <span class="work-menu-title">
                          {{ item.label }}
                        </span>

                        <span class="work-menu-description">
                          {{ item.description || 'Open ' + item.label }}
                        </span>
                      </div>

                      <i class="pi pi-angle-right work-menu-arrow"></i>
                    </a>
                  }
                }
              }
            </div>
          </div>
        </div>
      </section>

      <!-- ====================================== -->
      <!-- CREATE BOTTOM SHEET -->
      <!-- ====================================== -->

      <section
        class="mobile-bottom-sheet create-menu-sheet"
        [class.show]="showQuickActions"
        [attr.aria-hidden]="!showQuickActions"
        aria-label="Create new"
      >
        <div class="sheet-handle"></div>

        <div class="sheet-header">
          <div>
            <h3>Create New</h3>
            <p>What would you like to create?</p>
          </div>

          <button
            type="button"
            class="sheet-close-button"
            aria-label="Close create menu"
            (click)="closeAllSheets()"
          >
            <i class="pi pi-times"></i>
          </button>
        </div>

        <div class="quick-action-grid">
          @for (action of quickActions; track action.route) {
            <button
              type="button"
              class="quick-action-card"
              (click)="navigateTo(action.route)"
            >
              <div
                class="action-icon"
                [style.background]="action.background"
                [style.color]="action.color"
              >
                <i [class]="action.icon"></i>
              </div>

              <div class="action-text">
                <span class="action-title">
                  {{ action.label }}
                </span>

                <span class="action-description">
                  {{ action.description }}
                </span>
              </div>

              <i class="pi pi-angle-right action-arrow"></i>
            </button>
          }
        </div>
      </section>
    </div>
  `,
  styleUrl: './mobile-layout.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileLayout implements OnInit {
  // ==========================================
  // DEPENDENCIES
  // ==========================================

  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  private readonly userService = inject(UserService);
  private readonly notificationService = inject(NotificationService);

  // ==========================================
  // STATE
  // ==========================================

  showQuickActions = false;
  showWorkMenu = false;

  openMenu: string | null = null;

  currentUser: LoginResponse | null = null;
  currentUrl = '';

  unreadCount = 0;

  // ==========================================
  // MENU DESCRIPTIONS
  // ==========================================

  private readonly menuDescriptions: Record<string, string> = {
    'Leave & Claims': 'Leave applications and expenses',
    'Support & Requests': 'Hardware and IT support',
    'Project Management': 'Projects, work orders and quotations',
    'Sales & Purchasing': 'Sales and purchasing operations',
    Inventory: 'Manage inventory records',
    Finance: 'Invoices, expenses and payments',
    'Company Management': 'Manage company information',
    'Administration Settings': 'System and application settings',
  };

  // ==========================================
  // SECTION 1: MY WORK
  // Personal / daily work activities only
  // ==========================================

  readonly myWorkItems: WorkMenuItem[] = [
    {
      label: 'Upcoming Meetings',
      description: 'View your upcoming meetings',
      icon: 'pi-calendar-clock',
      route: '/meeting',
    },

    {
      label: 'My Tasks',
      description: 'View and manage your tasks',
      icon: 'pi-list-check',
      route: '/my-tasks',
    },

    {
      label: 'My Daily Reports',
      description: 'View your daily reports',
      icon: 'pi-file-edit',
      route: '/daily-reports',
    },

    {
      label: 'Team Daily Reports',
      description: 'View your team reports',
      icon: 'pi-users',
      route: '/daily-reports/team',
    },
  ];

  // ==========================================
  // SECTION 2: ALL MODULES
  // Same module structure as desktop Sidemenu
  // ==========================================

  readonly allModuleItems: WorkMenuItem[] = [
    // --------------------------------------
    // GENERAL
    // --------------------------------------

    {
      label: 'Dashboard',
      description: 'View your company dashboard',
      icon: 'pi-home',
      route: '/dashboard',
    },

    {
      label: 'Office Handbook',
      description: 'Company information and guidelines',
      icon: 'pi-book',
      route: '/office-handbook',
    },

    // --------------------------------------
    // LEAVE & CLAIMS
    // --------------------------------------

    {
      label: 'Leave & Claims',
      icon: 'pi-calendar',
      items: [
        {
          label: 'Leave Application',
          route: '/leave',
          icon: 'pi-calendar',
        },

        {
          label: 'Leave Approvals',
          route: '/leave/approvals',
          icon: 'pi-check-circle',
          roles: ['SuperAdmin', 'Management', 'HOD', 'HR'],
        },

        {
          label: 'Claims',
          route: '/claims',
          icon: 'pi-wallet',
        },

        {
          label: 'Apply Claim',
          route: '/claims/apply',
          icon: 'pi-file-edit',
        },

        {
          label: 'Claim Approvals',
          route: '/claims/approvals',
          icon: 'pi-check-square',
        },
      ],
    },

    // --------------------------------------
    // SUPPORT & REQUESTS
    // --------------------------------------

    {
      label: 'Support & Requests',
      icon: 'pi-desktop',
      items: [
        {
          label: 'Hardware / IT Support',
          route: '/hardware-request',
          icon: 'pi-wrench',
        },

        {
          label: 'Incoming Requests',
          route: '/hardware-request/incoming',
          icon: 'pi-inbox',
        },
      ],
    },

    // --------------------------------------
    // PROJECT MANAGEMENT
    // --------------------------------------

    {
      label: 'Project Management',
      icon: 'pi-folder',
      roles: ['SuperAdmin', 'Management', 'HOD'],
      items: [
        {
          label: 'Projects',
          route: '/projects',
          icon: 'pi-briefcase',
          roles: ['SuperAdmin', 'Management', 'HOD'],
        },

        {
          label: 'Work Orders',
          route: '/work-order',
          icon: 'pi-list',
          roles: ['SuperAdmin', 'Management', 'HOD'],
        },

        {
          label: 'Quotations',
          route: '/quotations',
          icon: 'pi-file',
          roles: ['SuperAdmin', 'Management', 'HOD'],
        },
      ],
    },

    // --------------------------------------
    // SALES & PURCHASING
    // --------------------------------------

    {
      label: 'Sales & Purchasing',
      icon: 'pi-shopping-cart',
      roles: ['SuperAdmin', 'Management', 'HOD'],
      items: [
        {
          label: 'Products Services',
          route: '/products-services',
          icon: 'pi-box',
          roles: ['SuperAdmin', 'Management', 'HOD'],
        },

        {
          label: 'Sales Order',
          route: '/sales-order',
          icon: 'pi-shopping-bag',
          roles: ['SuperAdmin', 'Management', 'HOD'],
        },

        {
          label: 'Delivery Orders',
          route: '/delivery-orders',
          icon: 'pi-truck',
          roles: ['SuperAdmin', 'Management', 'HOD'],
        },

        {
          label: 'Purchase Orders',
          route: '/purchase-orders',
          icon: 'pi-file',
          roles: ['SuperAdmin', 'Management', 'HOD'],
        },

        {
          label: 'Goods Receiving',
          route: '/goods-receiving',
          icon: 'pi-inbox',
          roles: ['SuperAdmin', 'Management', 'HOD'],
        },

        {
          label: 'DO RMA',
          route: '/do-rma',
          icon: 'pi-refresh',
          roles: ['SuperAdmin', 'Management', 'HOD'],
        },
      ],
    },

    // --------------------------------------
    // INVENTORY
    // Special department permission applies
    // --------------------------------------

    {
      label: 'Inventory',
      icon: 'pi-box',
      items: [
        {
          label: 'Inventory Record',
          route: '/inventory/listing',
          icon: 'pi-list',
        },

        {
          label: 'Category',
          route: '/inventory/category',
          icon: 'pi-tags',
        },

        {
          label: 'Location',
          route: '/inventory/location',
          icon: 'pi-map-marker',
        },

        {
          label: 'Section',
          route: '/inventory/section',
          icon: 'pi-th-large',
        },
      ],
    },

    // --------------------------------------
    // FINANCE
    // --------------------------------------

    {
      label: 'Finance',
      icon: 'pi-wallet',
      roles: ['SuperAdmin', 'Management', 'HOD'],
      items: [
        {
          label: 'Sales Invoice',
          route: '/invoices/sales',
          icon: 'pi-file',
          roles: ['SuperAdmin', 'Management', 'HOD'],
        },

        {
          label: 'Purchase Invoice',
          route: '/invoices/purchase',
          icon: 'pi-file',
          roles: ['SuperAdmin', 'Management', 'HOD'],
        },

        {
          label: 'Expenses',
          route: '/expenses',
          icon: 'pi-money-bill',
          roles: ['SuperAdmin', 'Management', 'HOD'],
        },

        {
          label: 'Incomes',
          route: '/incomes',
          icon: 'pi-wallet',
          roles: ['SuperAdmin', 'Management', 'HOD'],
        },

        {
          label: 'Payments',
          route: '/payments',
          icon: 'pi-credit-card',
          roles: ['SuperAdmin', 'Management', 'HOD'],
        },
      ],
    },

    // --------------------------------------
    // COMPANY MANAGEMENT
    // --------------------------------------

    {
      label: 'Company Management',
      icon: 'pi-building',
      roles: ['SuperAdmin', 'Management', 'HOD'],
      items: [
        {
          label: 'My Company',
          route: '/company',
          icon: 'pi-building',
          roles: ['SuperAdmin', 'Management', 'HOD'],
        },

        {
          label: 'Department',
          route: '/department',
          icon: 'pi-sitemap',
        },

        {
          label: 'Suppliers',
          route: '/supplier',
          icon: 'pi-truck',
          roles: ['SuperAdmin', 'Management', 'HOD'],
        },

        {
          label: 'Clients',
          route: '/clients',
          icon: 'pi-users',
          roles: ['SuperAdmin', 'Management', 'HOD'],
        },
      ],
    },

    // --------------------------------------
    // ADMINISTRATION SETTINGS
    // --------------------------------------

    {
      label: 'Administration Settings',
      icon: 'pi-cog',
      items: [
        {
          label: 'User Management',
          route: '/user-management',
          icon: 'pi-users',
          roles: ['SuperAdmin', 'HR'],
        },

        {
          label: 'Profile Settings',
          route: '/profile-settings',
          icon: 'pi-user',
          roles: ['Support', 'Staff', 'Management', 'HOD', 'HR'],
        },

        {
          label: 'System Module',
          route: '/settings/system-module',
          icon: 'pi-th-large',
          roles: ['SuperAdmin'],
        },

        {
          label: 'Role Permissions',
          route: '/settings/role-permission',
          icon: 'pi-lock',
          roles: ['SuperAdmin'],
        },

        {
          label: 'Leave Types',
          route: '/settings/leave-types',
          icon: 'pi-calendar',
          roles: ['SuperAdmin', 'HOD', 'Management', 'HR'],
        },

        {
          label: 'Leave Policy',
          route: '/settings/leave-policy',
          icon: 'pi-file',
          roles: ['SuperAdmin', 'HOD', 'Management', 'HR'],
        },

        {
          label: 'Public Holidays',
          route: '/settings/leave-holidays',
          icon: 'pi-calendar-plus',
          roles: ['SuperAdmin', 'Admin', 'HR'],
        },

        {
          label: 'Leave Calendar Sync',
          route: '/settings/leave-calendar-sync',
          icon: 'pi-sync',
          roles: ['SuperAdmin', 'HOD', 'Management', 'HR'],
        },

        {
          label: 'Claim Settings',
          route: '/settings/claim-settings',
          icon: 'pi-wallet',
          roles: ['SuperAdmin', 'Admin', 'HR'],
        },
      ],
    },

    // --------------------------------------
    // ACTIVITY LOG
    // --------------------------------------

    {
      label: 'Activity Log',
      description: 'View system activity history',
      icon: 'pi-history',
      route: '/activity-log',
      roles: ['SuperAdmin'],
    },

    // --------------------------------------
    // ANNOUNCEMENTS
    // --------------------------------------

    {
      label: 'Announcements',
      description: 'Company announcements and updates',
      icon: 'pi-megaphone',
      route: '/announcements',
    },
  ];

  // ==========================================
  // CREATE ACTIONS
  // ==========================================

  readonly quickActions: QuickAction[] = [
    {
      label: 'Apply Leave',
      description: 'Submit a leave application',
      icon: 'pi pi-calendar-plus',
      route: '/leave/apply',
      color: '#2563eb',
      background: '#eff6ff',
    },

    {
      label: 'Apply Claim',
      description: 'Submit an expense claim',
      icon: 'pi pi-wallet',
      route: '/claims/apply',
      color: '#059669',
      background: '#ecfdf5',
    },

    {
      label: 'Daily Report',
      description: 'Submit your daily report',
      icon: 'pi pi-file-edit',
      route: '/daily-reports',
      color: '#7c3aed',
      background: '#f5f3ff',
    },

    {
      label: 'Hardware Request',
      description: 'Request equipment or IT support',
      icon: 'pi pi-desktop',
      route: '/hardware-request',
      color: '#ea580c',
      background: '#fff7ed',
    },

    {
      label: 'Create Meeting',
      description: 'Schedule a new meeting',
      icon: 'pi pi-calendar',
      route: '/meeting/form',
      color: '#0891b2',
      background: '#ecfeff',
    },
  ];

  // ==========================================
  // INITIALIZATION
  // ==========================================

  ngOnInit(): void {
    this.currentUser = this.userService.currentUser;
    this.currentUrl = this.router.url;

    // USER INFORMATION
    this.userService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        this.currentUser = user;

        this.syncOpenMenuWithRoute();

        this.cdr.markForCheck();
      });

    // ROUTE CHANGES
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd,
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        this.currentUrl = event.urlAfterRedirects;

        this.syncOpenMenuWithRoute();

        this.closeAllSheets();

        this.cdr.markForCheck();
      });

    // NOTIFICATION COUNT
    this.notificationService.unreadCount$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((count) => {
        this.unreadCount = count;

        this.cdr.markForCheck();
      });

    // LOAD NOTIFICATIONS
    this.notificationService
      .GetNotifications()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (error) => {
          console.error('Failed to load notifications:', error);
        },
      });

    this.notificationService.refreshUnreadCount();

    this.syncOpenMenuWithRoute();
  }

  // ==========================================
  // MENU DESCRIPTIONS
  // ==========================================

  getMenuDescription(item: WorkMenuItem): string {
    return (
      item.description ||
      this.menuDescriptions[item.label] ||
      `Access ${item.label}`
    );
  }

  // ==========================================
  // ROLE PERMISSIONS
  // ==========================================

  canView(item: WorkMenuItem): boolean {
    const role = this.currentUser?.systemRole?.trim().toLowerCase();

    if (!role) {
      return false;
    }

    // SUPERADMIN CAN ACCESS EVERYTHING
    if (role === 'superadmin') {
      return true;
    }

    // INVENTORY SPECIAL PERMISSION
    if (this.isInventoryMenu(item)) {
      return (
        role === 'director' ||
        role === 'hod' ||
        this.hasPurchasingLogisticDepartment()
      );
    }

    // ITEMS WITHOUT ROLE RESTRICTIONS
    if (!item.roles?.length) {
      return true;
    }

    // CHECK USER ROLE
    return item.roles.some(
      (allowedRole) => allowedRole.trim().toLowerCase() === role,
    );
  }

  // ==========================================
  // INVENTORY PERMISSION
  // ==========================================

  private isInventoryMenu(item: WorkMenuItem): boolean {
    return (
      item.label === 'Inventory' ||
      item.route?.startsWith('/inventory/') === true
    );
  }

  private hasPurchasingLogisticDepartment(): boolean {
    const departments = this.currentUser?.departments ?? [];

    return departments.some(
      (department) =>
        department?.trim().toLowerCase() === 'purchasing & logistic',
    );
  }

  // ==========================================
  // SUBMENU PERMISSIONS
  // ==========================================

  getAllowedSubItems(item: WorkMenuItem): WorkMenuItem[] {
    // Check parent permission first.
    if (!this.canView(item)) {
      return [];
    }

    return item.items?.filter((sub) => this.canView(sub)) ?? [];
  }

  hasVisibleSubItems(item: WorkMenuItem): boolean {
    return this.getAllowedSubItems(item).length > 0;
  }

  // ==========================================
  // ROUTE HANDLING
  // ==========================================

  private isRouteMatch(route?: string): boolean {
    if (!route) {
      return false;
    }

    const currentRoute = this.currentUrl.split('?')[0].split('#')[0];

    return currentRoute === route;
  }

  isActive(route?: string, item?: WorkMenuItem): boolean {
    if (item?.items?.length) {
      return item.items.some((sub) => this.isActive(sub.route, sub));
    }

    return this.isRouteMatch(route);
  }

  syncOpenMenuWithRoute(): void {
    const activeParent = this.allModuleItems.find((item) =>
      item.items?.some((sub) => this.isActive(sub.route, sub)),
    );

    this.openMenu = activeParent?.label ?? null;
  }

  // ==========================================
  // BOTTOM SHEET HANDLING
  // ==========================================

  toggleWorkMenu(): void {
    this.showWorkMenu = !this.showWorkMenu;

    this.showQuickActions = false;

    if (this.showWorkMenu) {
      this.syncOpenMenuWithRoute();
    }

    this.cdr.markForCheck();
  }

  toggleActions(): void {
    this.showQuickActions = !this.showQuickActions;

    this.showWorkMenu = false;

    this.cdr.markForCheck();
  }

  closeAllSheets(): void {
    this.showQuickActions = false;

    this.showWorkMenu = false;

    this.cdr.markForCheck();
  }

  toggleMenu(label: string): void {
    this.openMenu = this.openMenu === label ? null : label;

    this.cdr.markForCheck();
  }

  // ==========================================
  // NAVIGATION
  // ==========================================

  navigateTo(route: string): void {
    this.closeAllSheets();

    this.router.navigateByUrl(route);
  }
}
