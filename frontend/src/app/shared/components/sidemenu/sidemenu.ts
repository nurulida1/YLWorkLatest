import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';

import { UserService } from '../../../services/userService.service';
import { LoginResponse } from '../../../models/User';
import { AuthService } from '../../../services/authService';

@Component({
  selector: 'app-sidemenu',
  imports: [
    CommonModule,
    RouterLink,
    TooltipModule,
    DialogModule,
    ButtonModule,
  ],
  template: `
    <div
      class="h-full flex flex-col justify-between pt-7 pb-5 border-r border-gray-200 text-white"
    >
      <div class="flex flex-col">
        <!-- Logo -->
        <div
          class="flex flex-row items-center gap-4 lg:px-6 border-b border-white/10 pb-5"
        >
          <div class="w-50">
            <img
              src="assets/logo-yl-work.png"
              alt="YL Work"
              class="w-full h-full object-cover cursor-pointer"
              [routerLink]="'/dashboard'"
            />
          </div>
        </div>

        <div
          class="py-5 flex flex-col gap-7 lg:gap-3 lg:pl-3 lg:pr-2 overflow-y-auto scrollbar scroll-smooth"
        >
          <!-- Main Menu -->
          <div class="flex flex-col gap-2 w-full">
            <ng-container *ngFor="let item of mainMenu">
              <div
                class="flex flex-row lg:pl-4 py-2 items-center justify-center lg:justify-start gap-3 px-2 text-[14px] cursor-pointer"
                [routerLink]="item.route"
                [ngClass]="{
                  'rounded-lg bg-blue-500 text-white': isActive(item.route),
                  'hover:text-gray-400 text-gray-300': !isActive(item.route),
                }"
              >
                <div class="flex items-center gap-3">
                  <i
                    class="pi {{ item.icon }} text-sm! xl:text-base!"
                    [ngClass]="{
                      'text-white': isActive(item.route),
                      'text-gray-400': !isActive(item.route),
                    }"
                  ></i>

                  <span class="hidden lg:block">
                    {{ item.label }}
                  </span>
                </div>
              </div>
            </ng-container>
          </div>

          <!-- Management Menu -->
          <div
            class="flex flex-col items-center lg:items-start gap-3 text-[14px]"
          >
            <ng-container *ngFor="let item of management">
              <div
                *ngIf="canView(item) || hasVisibleSubItems(item)"
                class="flex flex-col gap-2 w-full"
                [ngClass]="{
                  'lg:hidden': item.mobileOnly,
                }"
              >
                <!-- Parent Menu -->
                <div
                  class="flex flex-row lg:pl-4 items-center justify-between gap-3 py-2 rounded-lg px-2"
                  [ngClass]="{
                    'bg-blue-500 text-white': isActive(item.route, item),
                    'hover:text-gray-400 cursor-pointer text-gray-300':
                      !isActive(item.route, item),
                  }"
                  (click)="
                    item.items
                      ? toggleMenu(item.label)
                      : item.route && router.navigate([item.route])
                  "
                >
                  <div class="flex items-center gap-3">
                    <i
                      class="pi {{ item.icon }} text-sm! xl:text-base!"
                      [ngClass]="{
                        'text-white': isActive(item.route, item),
                        'text-gray-400': !isActive(item.route, item),
                      }"
                    ></i>

                    <span class="hidden lg:block">
                      {{ item.label }}
                    </span>
                  </div>

                  <i
                    *ngIf="item.items"
                    class="text-sm! hidden! lg:block! pi"
                    [ngClass]="{
                      'pi-chevron-right': openMenu !== item.label,
                      'pi-chevron-down': openMenu === item.label,
                    }"
                  ></i>
                </div>

                <!-- Submenu -->
                <div
                  *ngIf="item.items && openMenu === item.label"
                  class="ml-10 flex flex-col gap-1"
                >
                  <div
                    *ngFor="let sub of getAllowedSubItems(item)"
                    class="py-3 px-3 rounded-md cursor-pointer"
                    [ngClass]="{
                      'bg-gray-700 font-semibold text-blue-500': isActive(
                        sub.route
                      ),
                      'hover:bg-gray-700 hover:text-blue-500': !isActive(
                        sub.route
                      ),
                    }"
                    [routerLink]="sub.route"
                  >
                    {{ sub.label }}
                  </div>
                </div>
              </div>
            </ng-container>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './sidemenu.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidemenu {
  readonly router = inject(Router);

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);

  currentUrl = '';
  currentUser: LoginResponse | null = null;

  showDialog = false;
  signOutDialog = false;
  openMenu: string | null = null;

  mainMenu: any[] = [
    {
      label: 'Dashboard',
      route: '/dashboard',
      icon: 'pi-home',
    },
    {
      label: 'Office Handbook',
      route: '/office-handbook',
      icon: 'pi-book',
    },
  ];

  management: any[] = [
    {
      label: 'Activity Log',
      route: '/activity-log',
      icon: 'pi-history',
      roles: ['SuperAdmin'],
    },
    {
      label: 'Announcements',
      route: '/announcements',
      icon: 'pi-bell',
    },
    {
      label: 'Leave',
      route: '/leave',
      icon: 'pi-calendar',
      items: [
        {
          label: 'Leave Application',
          route: '/leave',
        },
        {
          label: 'Leave Approvals',
          route: '/leave/approvals',
          roles: ['SuperAdmin', 'Management', 'HOD', 'HR'],
        },
      ],
    },
    {
      label: 'Claims',
      route: '/claims',
      icon: 'pi-wallet',
      items: [
        {
          label: 'Claims',
          route: '/claims',
        },
        {
          label: 'Apply Claim',
          route: '/claims/apply',
        },
        {
          label: 'Claim Approvals',
          route: '/claims/approvals',
        },
      ],
    },
    {
      label: 'My Work',
      icon: 'pi-briefcase',
      items: [
        {
          label: 'Upcoming Meetings',
          route: '/meeting',
          icon: 'pi-calendar-clock',
        },
        {
          label: 'My Tasks',
          route: '/my-tasks',
          icon: 'pi-list-check',
        },
        {
          label: 'My Daily Reports',
          route: '/daily-reports',
          icon: 'pi-file-edit',
        },
        {
          label: 'Team Daily Reports',
          route: '/daily-reports/team',
          icon: 'pi-users',
        },
      ],
    },
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
    {
      label: 'Projects',
      icon: 'pi-folder',
      route: '/projects',
      roles: ['SuperAdmin', 'Management', 'HOD'],
    },
    {
      label: 'Work Orders',
      icon: 'pi-wrench',
      route: '/work-order',
      roles: ['SuperAdmin', 'Management', 'HOD'],
    },
    {
      label: 'Quotations',
      route: '/quotations',
      icon: 'pi-file',
      roles: ['SuperAdmin', 'Management', 'HOD'],
    },
    {
      label: 'Products Services',
      icon: 'pi-list',
      route: '/products-services',
      roles: ['SuperAdmin', 'Management', 'HOD'],
    },
    {
      label: 'Sales Order',
      icon: 'pi-money-bill',
      route: '/sales-order',
      roles: ['SuperAdmin', 'Management', 'HOD'],
    },
    {
      label: 'Delivery Orders',
      icon: 'pi-truck',
      route: '/delivery-orders',
      roles: ['SuperAdmin', 'Management', 'HOD'],
    },
    {
      label: 'Purchase Orders',
      icon: 'pi-shopping-cart',
      route: '/purchase-orders',
      roles: ['SuperAdmin', 'Management', 'HOD'],
    },
    {
      label: 'Goods Receiving',
      icon: 'pi-clipboard',
      route: '/goods-receiving',
      roles: ['SuperAdmin', 'Management', 'HOD'],
    },
    {
      label: 'DO RMA',
      icon: 'pi-refresh',
      route: '/do-rma',
      roles: ['SuperAdmin', 'Management', 'HOD'],
    },
    {
      label: 'Inventory',
      icon: 'pi-box',
      items: [
        {
          label: 'Inventory Record',
          route: '/inventory/listing',
          roles: ['SuperAdmin', 'Management', 'HOD'],
        },
        {
          label: 'Category',
          route: '/inventory/category',
          roles: ['SuperAdmin', 'Management', 'HOD'],
        },
        {
          label: 'Location',
          route: '/inventory/location',
          roles: ['SuperAdmin', 'Management', 'HOD'],
        },
        {
          label: 'Section',
          route: '/inventory/section',
          roles: ['SuperAdmin', 'Management', 'HOD'],
        },
      ],
    },
    {
      label: 'Invoices',
      icon: 'pi-receipt',
      roles: ['SuperAdmin', 'Management', 'HOD'],
      items: [
        {
          label: 'Sales Invoice',
          route: '/invoices/sales',
          roles: ['SuperAdmin', 'Management', 'HOD'],
        },
        {
          label: 'Purchase Invoice',
          route: '/invoices/purchase',
          roles: ['SuperAdmin', 'Management', 'HOD'],
        },
      ],
    },
    {
      label: 'Expenses',
      route: '/expenses',
      icon: 'pi-wallet',
      roles: ['SuperAdmin', 'Management', 'HOD'],
    },
    {
      label: 'Incomes',
      route: '/incomes',
      icon: 'pi-chart-line',
      roles: ['SuperAdmin', 'Management', 'HOD'],
    },
    {
      label: 'Payments',
      route: '/payments',
      icon: 'pi-credit-card',
      roles: ['SuperAdmin', 'Management', 'HOD'],
    },
    {
      label: 'My Company',
      route: '/company',
      icon: 'pi-building',
      roles: ['SuperAdmin', 'Management', 'HOD'],
    },
    {
      label: 'Suppliers',
      route: '/supplier',
      icon: 'pi-shop',
      roles: ['SuperAdmin', 'Management', 'HOD'],
    },
    {
      label: 'Clients',
      route: '/clients',
      icon: 'pi-users',
      roles: ['SuperAdmin', 'Management', 'HOD'],
    },
    {
      label: 'User Management',
      route: '/user-management',
      icon: 'pi-users',
      roles: ['SuperAdmin', 'HR'],
    },
    {
      label: 'Department',
      route: '/department',
      icon: 'pi-building',
    },
    {
      label: 'Settings',
      icon: 'pi-cog',
      items: [
        {
          label: 'Profile Settings',
          route: '/profile-settings',
          icon: 'pi-user',
          roles: ['Support', 'Staff', 'Management', 'HOD', 'HR'],
          mobileOnly: true,
        },
        {
          label: 'System Module',
          route: '/settings/system-module',
          roles: ['SuperAdmin'],
        },
        {
          label: 'Role Permissions',
          route: '/settings/role-permission',
          roles: ['SuperAdmin'],
        },
        {
          label: 'Leave Types',
          route: '/settings/leave-types',
          roles: ['SuperAdmin', 'HOD', 'Management', 'HR'],
        },
        {
          label: 'Leave Policy',
          route: '/settings/leave-policy',
          roles: ['SuperAdmin', 'HOD', 'Management', 'HR'],
        },
        {
          label: 'Public Holidays',
          route: '/settings/leave-holidays',
          roles: ['SuperAdmin', 'Admin', 'HR'],
        },
        {
          label: 'Leave calendar sync',
          route: '/settings/leave-calendar-sync',
          roles: ['SuperAdmin', 'HOD', 'Management', 'HR'],
        },
        {
          label: 'Claim Settings',
          route: '/settings/claim-settings',
          roles: ['SuperAdmin', 'Admin', 'HR'],
        },
      ],
    },
  ];

  constructor() {
    // Restore current user.
    this.currentUser = this.userService.currentUser;

    // Keep the menu synchronized when user data changes.
    this.userService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        this.currentUser = user;
        this.cdr.markForCheck();
      });

    // Track current route.
    this.currentUrl = this.router.url;
    this.syncOpenMenuWithRoute();

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.currentUrl = this.router.url;
        this.syncOpenMenuWithRoute();
        this.cdr.markForCheck();
      });
  }

  // ==========================================
  // MENU ROUTE HANDLING
  // ==========================================

  syncOpenMenuWithRoute(): void {
    for (const item of this.management) {
      if (!item.items) continue;

      const isChildActive = item.items.some((sub: any) =>
        this.isRouteMatch(this.currentUrl, sub.route),
      );

      if (isChildActive) {
        this.openMenu = item.label;
        return;
      }
    }
  }

  isActive(route?: string, item?: any): boolean {
    if (!route) return false;

    // Parent menu is active only on its own route.
    if (item?.items) {
      return this.currentUrl === route;
    }

    return this.currentUrl === route;
  }

  private isRouteMatch(currentUrl: string, route?: string): boolean {
    if (!route) return false;

    const cleanUrl = currentUrl.split('?')[0].split('#')[0];

    return cleanUrl === route || cleanUrl.startsWith(`${route}/`);
  }

  // ==========================================
  // SUBMENU HANDLING
  // ==========================================

  getAllowedSubItems(item: any): any[] {
    if (!item.items) return [];

    return item.items.filter((sub: any) => this.canView(sub));
  }

  hasVisibleSubItems(item: any): boolean {
    if (!item.items) return false;

    return this.getAllowedSubItems(item).length > 0;
  }

  toggleMenu(label: string): void {
    this.openMenu = this.openMenu === label ? null : label;
    this.cdr.markForCheck();
  }

  // ==========================================
  // ROLE AND DEPARTMENT PERMISSIONS
  // ==========================================

  canView(item: any): boolean {
    const role = this.currentUser?.systemRole?.trim().toLowerCase();

    if (!role) return false;

    // SuperAdmin can view everything.
    if (role === 'superadmin') {
      return true;
    }

    // Inventory special access.
    if (item.label === 'Inventory' || item.route?.startsWith('/inventory/')) {
      return (
        role === 'director' ||
        role === 'hod' ||
        this.hasPurchasingLogisticDepartment()
      );
    }

    // Items without role restrictions are visible to authenticated users.
    if (!item.roles || item.roles.length === 0) {
      return true;
    }

    return item.roles.some(
      (allowedRole: string) => allowedRole.trim().toLowerCase() === role,
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
  // DIALOG HANDLING
  // ==========================================

  signOutClick(): void {
    this.signOutDialog = true;
    this.cdr.markForCheck();
  }

  toggleDialog(): void {
    this.showDialog = !this.showDialog;
    this.cdr.markForCheck();
  }

  // ==========================================
  // AUTHENTICATION
  // ==========================================

  LogOut(): void {
    this.signOutDialog = false;
    this.authService.logout();
  }
}
