import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../../services/userService.service';
import { TooltipModule } from 'primeng/tooltip';
import { LoginResponse } from '../../../models/User';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-sidemenu',
  imports: [
    CommonModule,
    RouterLink,
    TooltipModule,
    DialogModule,
    ButtonModule,
  ],
  template: `<div
    class="h-full flex flex-col justify-between pt-7 pb-5 border-r border-gray-200 text-white"
  >
    <div class="flex flex-col">
      <div
        class="flex flex-row items-center gap-4 lg:px-6 border-b border-white/10 pb-5"
      >
        <div class="w-50">
          <img
            src="assets/logo-yl-work.png"
            alt=""
            class="w-full h-full object-cover"
          />
        </div>
        <!-- <div class="hidden lg:flex tracking-wide flex-col">
          <div class="text-lg 3xl:text-xl font-bold">YL WORKS</div>
          <div class="text-gray-400 text-[10px] 3xl:text-[12px]">
            MANAGEMENT SYSTEM
          </div>
        </div> -->
      </div>

      <div
        class="py-5 flex flex-col gap-7 lg:gap-3 lg:pl-3 lg:pr-2 overflow-y-auto scrollbar scroll-smooth"
      >
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
            </div>
          </ng-container>
        </div>
        <div
          class="flex flex-col items-center lg:items-start gap-3 text-[14px]"
        >
          <ng-container *ngFor="let item of management">
            <div
              class="flex flex-col gap-2 w-full"
              *ngIf="
                !item.roles || item.roles.includes(currentUser?.systemRole)
              "
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
      icon: 'pi-home',
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
        'Account & Admin Manager',
        'Purchasing Executive',
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
      label: 'Quotations',
      route: '/quotations',
      icon: 'pi-file',
      // roles: ['Sales Director', 'Sales Executive', 'Sales Support'],
    },
    {
      label: 'Purchase Orders',
      icon: 'pi-shopping-cart',
      items: [
        {
          label: 'Supplier PO',
          route: '/purchase-orders/supplier',
          // roles: [
          //   'Sales Director',
          //   'Sales Executive',
          //   'Sales Support',
          //   'Account & Admin Manager',
          //   'Purchasing Executive',
          //   'SuperAdmin',
          // ],
        },
        {
          label: 'Client PO',
          route: '/purchase-orders/client',
          // roles: [
          //   'Sales Director',
          //   'Sales Executive',
          //   'Sales Support',
          //   'Account & Admin Manager',
          //   'Purchasing Executive',
          //   'SuperAdmin',
          // ],
        },
      ],
    },

    {
      label: 'Suppliers',
      route: '/supplier',
      icon: 'pi-shop',
      // roles: [
      //   'Sales Director',
      //   'Sales Executive',
      //   'Sales Support',
      //   'SuperAdmin',
      // ],
    },

    {
      label: 'Clients',
      route: '/clients',
      icon: 'pi-users',
      // roles: [
      //   'Sales Director',
      //   'Sales Executive',
      //   'Sales Support',
      //   'SuperAdmin',
      // ],
    },

    // {
    //   label: 'Supplier Payments',
    //   route: '/supplier-payments',
    //   roles: ['Purchasing Executive', 'SuperAdmin'],
    // },
    {
      label: 'Material Requests',
      route: '/material-requests',
      icon: 'pi-list',
      // roles: ['Purchasing Executive', 'Project Manager', 'SuperAdmin'],
    },

    {
      label: 'Inventory',
      route: '/inventory',
      icon: 'pi-box',
      // roles: ['Logistic Assistant', 'SuperAdmin', 'Purchasing Executive'],
    },

    {
      label: 'Delivery Orders',
      icon: 'pi pi-truck',
      items: [
        {
          label: 'Inbound DO',
          route: '/delivery-orders/inbound',
        },
        {
          label: 'Outbound DO',
          route: '/delivery-orders/outbound',
        },
        {
          label: 'DO RMA',
          route: '/delivery-orders/rma',
        },
      ],
    },

    {
      label: 'Work Orders',
      icon: 'pi-wrench',
      route: '/work-order',
      // roles: ['SuperAdmin', 'Admin'],
    },
    {
      label: 'Projects',
      icon: 'pi-folder',
      route: '/projects',
      // roles: ['SuperAdmin', 'Admin'],
    },
    {
      label: 'Tasks',
      icon: 'pi-check-square',
      route: '/tasks',
      // roles: ['SuperAdmin', 'Admin'],
    },
    {
      label: 'Invoices',
      icon: 'pi-receipt',
      items: [
        {
          label: 'Sales Invoice',
          route: '/invoices/sales',
        },
        {
          label: 'Purchase Invoice',
          route: '/invoices/purchase',
        },
      ],
    },
    {
      label: 'Expenses',
      route: '/expenses',
      icon: 'pi-wallet',
      // roles: ['Purchasing Executive', 'SuperAdmin'],
    },
    {
      label: 'Incomes',
      route: '/incomes',
      icon: 'pi-chart-line',
      // roles: ['Purchasing Executive', 'SuperAdmin'],
    },
    {
      label: 'Payments',
      route: '/payments',
      icon: 'pi-credit-card',
      // roles: ['Purchasing Executive', 'SuperAdmin'],
    },
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
