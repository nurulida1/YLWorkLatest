import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../../services/userService.service';
import { Tooltip } from 'primeng/tooltip';
import { LoginResponse } from '../../../models/User';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-sidemenu',
  imports: [CommonModule, RouterLink, Tooltip, DialogModule, ButtonModule],
  template: `<div
    class="h-full flex flex-col justify-between pt-7 pb-5 border-r border-gray-200 bg-gray-800 text-white"
  >
    <div class="flex flex-col">
      <div
        class="flex flex-row items-center justify-center lg:justify-start gap-4 lg:px-6 border-b border-white/10 pb-5"
      >
        <div
          class="bg-blue-500 rounded-md w-7 h-7 xl:w-[38px] xl:h-[38px] p-1.5"
        >
          <img
            src="assets/logo.png"
            alt=""
            class="w-full h-full object-cover"
          />
        </div>
        <div class="hidden lg:flex tracking-wide flex-col">
          <div class="text-lg 3xl:text-xl font-bold">YL Works</div>
          <div class="text-gray-400 text-[10px] 3xl:text-[12px]">
            MANAGEMENT SYSTEM
          </div>
        </div>
      </div>
      <div
        class="py-5 flex flex-col gap-7 lg:gap-3 lg:pl-3 lg:pr-2 overflow-y-auto scrollbar scroll-smooth"
      >
        <div class="hidden lg:block text-gray-400 text-sm">MAIN MENU</div>
        <div class="flex flex-col gap-2 w-full">
          <ng-container *ngFor="let item of mainMenu">
            <div
              *ngIf="
                item.roles.includes(currentUser?.systemRole) &&
                (!item.items || hasVisibleSubItems(item))
              "
              class="flex flex-row lg:pl-2 xl:pl-4 py-2 items-center justify-center lg:justify-start gap-3 px-2 text-[14px]"
              [routerLink]="item.route"
              [ngClass]="{
                'rounded-lg bg-blue-500 text-white': isActive(item.route),
                'cursor-pointer hover:text-gray-400 text-gray-300': !isActive(
                  item.route
                ),
              }"
            >
              <i
                class="{{ item.icon }} text-sm! xl:text-base!"
                [ngClass]="{
                  'text-white': isActive(item.route),
                  'text-gray-600': !isActive(item.route),
                }"
                [pTooltip]="item.label"
              ></i>
              <div class="lg:tracking-wider hidden lg:block">
                {{ item.label }}
              </div>
            </div>
          </ng-container>
        </div>
        <div class="border-b-2 border-dashed border-white/10"></div>
        <div class="hidden lg:block text-gray-400 text-sm">MANAGEMENT</div>
        <div
          class="flex flex-col items-center lg:items-start gap-3 text-[14px]"
        >
          <ng-container *ngFor="let item of management">
            <div
              class="flex flex-col gap-2 w-full"
              *ngIf="item.roles.includes(currentUser?.systemRole)"
            >
              <div
                class="flex flex-row lg:pl-4 items-center justify-between gap-3 py-2 rounded-lg px-2"
                [ngClass]="{
                  'bg-blue-500 text-white': isActive(item.route, item),
                  'hover:text-gray-400 cursor-pointer text-gray-300': !isActive(
                    item.route,
                    item
                  ),
                }"
                (click)="item.items ? toggleMenu(item.label) : null"
                [routerLink]="!item.items ? item.route : null"
              >
                <!-- LEFT: icon + label -->
                <div class="flex items-center gap-3">
                  <i
                    class="{{ item.icon }} text-sm! xl:text-base!"
                    [ngClass]="{
                      'text-white': isActive(item.route, item),
                      'text-gray-400': !isActive(item.route, item),
                    }"
                  ></i>

                  <span class="hidden lg:block">
                    {{ item.label }}
                  </span>
                </div>

                <!-- RIGHT: chevron -->
                <i
                  *ngIf="item.items"
                  class="text-sm! hidden! lg:block! pi"
                  [ngClass]="{
                    'pi-chevron-right': openMenu !== item.label,
                    'pi-chevron-down': openMenu === item.label,
                  }"
                ></i>
              </div>

              <!-- Sub menu -->
              <div
                *ngIf="item.items && openMenu === item.label"
                class="ml-10 flex flex-col gap-1"
              >
                <div
                  *ngFor="let sub of getAllowedSubItems(item)"
                  class="py-3 px-3 rounded-md cursor-pointer"
                  [ngClass]="{
                    'bg-gray-200 font-semibold text-blue-500': isActive(
                      sub.route
                    ),
                    'hover:bg-gray-100': !isActive(sub.route),
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
  </div> `,
  styleUrl: './sidemenu.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidemenu {
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly userService = inject(UserService);

  currentUrl: string = '';
  currentUser: LoginResponse | null = null;
  showDialog: boolean = false;
  signOutDialog: boolean = false;
  openMenu: string | null = null;

  mainMenu: any[] = [
    {
      label: 'Dashboard',
      route: '/dashboard',
      roles: [
        'SuperAdmin',
        'Admin',
        'Staff',
        'HR',
        'Manager',
        'Sales Director',
        'Sales Support',
        'Sales Executive',
        'Logistic Assistant',
        'Project Manager',
        'System & Intelligence Manager',
      ],
    },
    // {
    //   label: 'Apply Leave',
    //   icon: 'pi pi-calendar',
    //   route: '/apply-leave',
    //   roles: ['SuperAdmin', 'Admin', 'HR', 'Manager', 'Staff'],
    // },
    // {
    //   label: 'Payslips',
    //   icon: 'pi pi-dollar',
    //   route: '/my-payslips',
    //   roles: ['SuperAdmin', 'Admin', 'HR', 'Manager', 'Staff', 'Director'],
    // },
    // {
    //   label: 'Employees',
    //   icon: 'pi pi-users',
    //   route: '/employees',
    //   roles: ['SuperAdmin', 'Admin', 'HR', 'Manager', 'Staff', 'Director'],
    // },
  ];

  management: any[] = [
    {
      label: 'Calendar & ToDo',
      roles: ['HR'],
      route: '/to-do',
    },
    {
      label: 'Employee',
      roles: ['HR'],
      route: '/employee',
    },
    {
      label: 'Attendance',
      roles: ['HR'],
    },
    {
      label: 'Leave',
      roles: ['HR'],
    },
    {
      label: 'Recruitment',
      roles: ['HR'],
    },

    {
      label: 'Inventory & Sales',
      roles: [
        'Manager',
        'Director',
        'Admin',
        'SuperAdmin',
        'Sales Director',
        'Sales Executive',
        'Sales Support',
      ],
      items: [
        {
          label: 'Quotations',
          route: '/quotations',
          roles: ['Sales Director', 'Sales Executive', 'Sales Support'],
        },
        {
          label: 'Invoices',
          route: '/invoices',
          roles: ['Manager', 'Director', 'Admin', 'SuperAdmin'],
        },
        {
          label: 'Clients',
          route: '/clients',
          roles: ['Manager', 'Director', 'Admin', 'SuperAdmin'],
        },
      ],
    },
    {
      label: 'Purchases',
      roles: [
        'Manager',
        'Director',
        'Admin',
        'SuperAdmin',
        'Sales Director',
        'Sales Executive',
        'Sales Support',
      ],
      items: [
        {
          label: 'Purchase Orders',
          route: '/purchase-orders',
          roles: [
            'Sales Director',
            'Sales Executive',
            'Sales Support',
            'SuperAdmin',
          ],
        },
        {
          label: 'Suppliers',
          route: '/supplier',
          roles: [
            'Sales Director',
            'Sales Executive',
            'Sales Support',
            'SuperAdmin',
          ],
        },
        {
          label: 'Supplier Payments',
          route: '/supplier-payments',
        },
        {
          label: 'Material Requests',
          route: '/material-requests',
          roles: ['Purchasing Executive', 'Project Manager', 'SuperAdmin'],
        },
      ],
    },
    {
      label: 'Finance & Accounts',
      roles: ['Director', 'Admin', 'SuperAdmin'],
      items: [
        {
          label: 'Expenses',
          route: '/expenses',
        },
        {
          label: 'Incomes',
          route: '/incomes',
        },
        {
          label: 'Payments',
          route: '/payments',
        },
        {
          label: 'Transactions',
          route: '/transactions',
        },
      ],
    },
    {
      label: 'Manage',
      roles: ['Director', 'Admin', 'SuperAdmin'],
      items: [
        {
          label: 'Department',
          route: '/department',
        },
        {
          label: 'Company',
          route: '/company',
        },
        {
          label: 'Manage Users',
          route: '/user-management',
        },
        {
          label: 'Access Permission',
          route: '/access-permission',
        },
      ],
    },

    //Project Management
    {
      label: 'Projects',
      roles: ['SuperAdmin', 'Project Manager', 'System & Intelligence Manager'],
      route: '/projects',
    },
    {
      label: 'Request Materials',
      roles: ['SuperAdmin', 'Project Manager', 'System & Intelligence Manager'],
      route: '/material-requests',
    },

    //Inventory (Logistic)
    {
      label: 'Inventory',
      roles: ['Logistic Assistant', 'SuperAdmin', 'Purchasing Executive'],
      route: '/inventory',
    },
    {
      label: 'Locations',
      roles: ['Logistic Assistant', 'SuperAdmin'],
      route: '/locations',
    },
    {
      label: 'Category',
      roles: ['Logistic Assistant', 'SuperAdmin'],
      route: '/category',
    },
    {
      label: 'Sections',
      roles: ['Logistic Assistant', 'SuperAdmin'],
      route: '/sections',
    },
    // {
    //   label: 'Administration',
    //   roles: ['Director', 'Admin', 'SuperAdmin'],
    //   items: [
    //     {
    //       label: 'Settings',
    //       route: '/settings',
    //     },
    //   ],
    // },
    // {
    //   label: 'Delivery',
    //   icon: 'pi pi-truck',
    //   route: '/delivery',
    //   roles: ['SuperAdmin', 'Admin'],
    // },
    // {
    //   label: 'Timesheet',
    //   icon: 'pi pi-calendar-clock',
    //   roles: ['HR', 'SuperAdmin'],
    //   items: [
    //     {
    //       label: 'Manage Holidays',
    //       route: '/holiday',
    //     },
    //     {
    //       label: 'Manage Leaves',
    //       route: '/leaves',
    //     },
    //   ],
    // },
    // {
    //   label: 'Leave Request',
    //   icon: 'pi pi-calendar',
    //   route: '/leave-request',
    //   roles: ['Manager', 'Director', 'SuperAdmin'],
    // },
    // {
    //   label: 'Payslip Management',
    //   icon: 'pi pi-dollar',
    //   route: '/payslips',
    //   roles: ['SuperAdmin', 'HR'],
    // },

    // {
    //   label: 'Audit Log',
    //   icon: 'pi pi-list',
    //   route: '/auditlog',
    //   roles: ['SuperAdmin'],
    // },
  ];

  constructor() {
    this.currentUser = this.userService.currentUser;

    this.router.events.subscribe(() => {
      this.currentUrl = this.router.url;
      this.syncOpenMenuWithRoute();
      this.cdr.markForCheck();
    });

    this.syncOpenMenuWithRoute();
  }

  syncOpenMenuWithRoute() {
    for (const item of this.management) {
      if (!item.items) continue;

      const isChildActive = item.items.some((sub: any) =>
        this.currentUrl.startsWith(sub.route),
      );

      if (isChildActive) {
        this.openMenu = item.label;
        return;
      }
    }
  }

  getAllowedSubItems(item: any) {
    if (!item.items) return [];

    return item.items.filter((sub: any) => {
      if (!sub.roles) return true; // if no roles defined → allow all
      return sub.roles.includes(this.currentUser?.systemRole);
    });
  }

  hasVisibleSubItems(item: any): boolean {
    if (!item.items) return false;
    return this.getAllowedSubItems(item).length > 0;
  }

  isActive(route?: string, item?: any): boolean {
    if (route) {
      return this.currentUrl.startsWith(route);
    }

    if (item?.items) {
      return item.items.some((sub: any) =>
        this.currentUrl.startsWith(sub.route),
      );
    }

    return false;
  }

  signOutClick() {
    this.signOutDialog = true;
    this.cdr.detectChanges();
  }

  LogOut() {
    this.userService.logout();
  }

  toggleDialog() {
    this.showDialog = !this.showDialog;
  }

  toggleMenu(label: string) {
    this.openMenu = this.openMenu === label ? null : label;
  }
}
