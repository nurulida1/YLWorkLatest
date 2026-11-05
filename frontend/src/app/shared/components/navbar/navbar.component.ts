import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';

import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { Subject, filter, takeUntil } from 'rxjs';

import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { PopoverModule } from 'primeng/popover';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { DrawerModule } from 'primeng/drawer';
import { RippleModule } from 'primeng/ripple';

import { AppConfigService } from '../../../services/appConfig.service';
import { LoadingService } from '../../../services/loading.service';
import { NotificationService } from '../../../services/notificationService.service';
import { UserService } from '../../../services/userService.service';

import { NotificationDto } from '../../../models/Notifications';
import { LoginResponse } from '../../../models/User';
import { AuthService } from '../../../services/authService';

@Component({
  selector: 'app-navbar',
  imports: [
    CommonModule,
    AvatarModule,
    ButtonModule,
    PopoverModule,
    DialogModule,
    FormsModule,
    InputTextModule,
    MenuModule,
    DrawerModule,
    RouterLink,
    RippleModule,
  ],
  template: `
    <div
      class="border-b border-gray-200 w-full py-3 px-2 bg-white flex flex-row items-center justify-between"
    >
      <!-- Mobile Sidebar Toggle -->
      <div>
        <div class="block pl-3 lg:pl-0 lg:hidden">
          <div
            class="pi pi-bars text-xl! cursor-pointer"
            (click)="ToggleSidebar()"
          ></div>
        </div>
      </div>

      <div class="flex flex-row gap-4 items-center">
        <!-- Dark Mode Toggle -->
        <div
          class="w-10 h-10 border rounded-full border-gray-300 flex items-center justify-center cursor-pointer"
          (click)="toggleDarkMode()"
        >
          <i
            [ngClass]="isDarkMode() ? 'pi pi-sun' : 'pi pi-moon'"
            class="text-lg text-gray-500!"
          ></i>
        </div>

        <!-- Notification Bell -->
        <div
          id="notification-bell"
          class="relative w-10 h-10 border rounded-full border-gray-300 flex items-center justify-center cursor-pointer"
          (click)="onBellClick()"
        >
          <i class="pi pi-bell text-lg text-gray-500!"></i>

          <span
            *ngIf="unreadCount > 0"
            class="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full min-w-5 h-5 flex items-center justify-center px-1"
          >
            {{ unreadCount > 99 ? '99+' : unreadCount }}
          </span>
        </div>

        <!-- Desktop Notification Panel -->
        <div
          id="notification-panel"
          *ngIf="notificationVisible && !isMobile"
          class="absolute right-4 top-16 z-50 w-80 max-h-[min(32rem,calc(100vh-5rem))] flex flex-col overflow-hidden bg-white border border-gray-200 rounded-lg shadow-lg"
        >
          <div
            class="flex justify-between items-center p-3 border-b border-gray-300"
          >
            <span class="font-semibold">Notifications</span>

            <span class="text-sm text-gray-500">
              {{ unreadCount }} unread
            </span>
          </div>

          <!-- Notification List -->
          <div class="flex-1 overflow-y-auto min-h-0">
            <div
              *ngIf="notificationLists.length === 0"
              class="p-5 text-center text-gray-500"
            >
              No notifications yet.
            </div>

            <div
              *ngFor="let notification of notificationLists | slice: 0 : 5"
              class="p-3 border-b border-gray-200 hover:bg-gray-50"
              [ngClass]="{
                'bg-blue-50': !notification.isRead,
              }"
            >
              <div class="flex justify-between items-start gap-2">
                <div class="text-sm text-gray-800 font-semibold">
                  {{ notification.title }}
                </div>

                <span
                  *ngIf="!notification.isRead"
                  class="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"
                ></span>
              </div>

              <div class="text-sm text-gray-600 mt-1">
                {{ notification.message }}
              </div>

              <div class="flex justify-between items-center mt-2">
                <span class="text-xs text-gray-400">
                  {{ notification.createdAt | date: 'dd/MM/yyyy hh:mm a' }}
                </span>

                <button
                  *ngIf="!notification.isRead"
                  type="button"
                  class="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  (click)="markNotificationAsRead(notification)"
                >
                  Mark as read
                </button>

                <span *ngIf="notification.isRead" class="text-xs text-gray-400">
                  Read
                </span>
              </div>
            </div>
          </div>

          <div
            class="p-3 text-center border-t border-gray-200 bg-white shrink-0"
          >
            <a
              routerLink="/notifications"
              (click)="notificationVisible = false"
              class="text-sm text-blue-600 hover:text-blue-800 cursor-pointer font-medium"
            >
              View all notifications
            </a>
          </div>
        </div>

        <!-- Profile Icon -->
        <div
          class="w-10 h-10 border rounded-full border-gray-300 flex items-center justify-center cursor-pointer"
        >
          <i class="pi pi-user text-lg text-gray-500!"></i>
        </div>

        <!-- Profile Menu Toggle -->
        <div
          (click)="menu.toggle($event)"
          class="pi pi-angle-down text-lg! text-gray-500! cursor-pointer"
        ></div>

        <!-- Profile Menu -->
        <p-menu
          #menu
          [model]="items"
          class="flex justify-center"
          styleClass="w-full md:w-60 mt-4! ml-3!"
          [popup]="true"
        >
          <ng-template #start>
            <div class="flex flex-row items-center gap-3 px-2 py-3">
              <p-avatar
                icon="pi pi-user"
                shape="circle"
                styleClass="p-2! border border-gray-200 bg-gray-100!"
              ></p-avatar>

              <span class="flex flex-col min-w-0">
                <span class="font-bold truncate">
                  {{
                    currentUser?.displayName || currentUser?.fullName || 'User'
                  }}
                </span>

                <span class="text-sm truncate">
                  {{ currentUser?.email || '' }}
                </span>
              </span>
            </div>

            <div class="border-b border-gray-200"></div>
          </ng-template>

          <ng-template #item let-item>
            <a
              pRipple
              class="flex items-center px-3 py-2 cursor-pointer"
              [class]="item.linkClass"
            >
              <span [class]="item.icon"></span>
              <span class="ms-2 text-[14px]">{{ item.label }}</span>

              <span
                *ngIf="item.shortcut"
                class="ms-auto border border-surface rounded bg-emphasis text-muted-color text-xs p-1"
              >
                {{ item.shortcut }}
              </span>
            </a>
          </ng-template>
        </p-menu>
      </div>
    </div>

    <!-- Mobile Drawer -->
    <p-drawer
      [(visible)]="showSidebar"
      (onHide)="showSidebar = false"
      position="left"
      [modal]="true"
      styleClass="bg-gray-800! border-none! text-white! overflow-y-auto!"
      [closable]="false"
    >
      <ng-template #headless>
        <div class="flex flex-col pt-7 pb-5 text-white">
          <!-- Logo -->
          <div
            class="flex flex-row items-center gap-4 px-5 border-b border-white/10 pb-5"
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
            class="py-5 flex flex-col px-3 overflow-y-auto scrollbar scroll-smooth"
          >
            <!-- Main Menu -->
            <div class="flex flex-col gap-2 w-full">
              <ng-container *ngFor="let item of mainMenu">
                <div
                  *ngIf="canView(item) || hasVisibleSubItems(item)"
                  class="flex flex-row items-center gap-3 py-3 px-2 text-[14px]"
                  [routerLink]="item.route"
                  [ngClass]="{
                    'rounded-lg bg-blue-500 text-white': isActive(item.route),
                    'cursor-pointer hover:text-gray-400 text-gray-300':
                      !isActive(item.route),
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

                    <span>{{ item.label }}</span>
                  </div>
                </div>
              </ng-container>
            </div>

            <!-- Management Menu -->
            <div
              class="mt-1 flex flex-col items-center lg:items-start gap-3 text-[14px]"
            >
              <ng-container *ngFor="let item of management">
                <div
                  *ngIf="canView(item) || hasVisibleSubItems(item)"
                  class="flex flex-col gap-2 w-full"
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

                      <span>{{ item.label }}</span>
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
      </ng-template>
    </p-drawer>

    <!-- Logout Confirmation Dialog -->
    <p-dialog
      [(visible)]="signOutDialog"
      (onHide)="signOutDialog = false"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [dismissableMask]="true"
      [showHeader]="false"
      styleClass="w-[90%] sm:w-[420px] !rounded-2xl"
      contentStyleClass="!p-0 !rounded-2xl"
    >
      <ng-template #headless>
        <div class="px-6 pt-8 pb-6 sm:px-8">
          <div class="flex justify-center">
            <div
              class="flex h-20 w-20 items-center justify-center rounded-full bg-red-50 ring-8 ring-red-50/50"
            >
              <i class="pi pi-sign-out text-3xl text-red-500"></i>
            </div>
          </div>

          <div class="mt-6 text-center">
            <h2 class="text-xl font-bold tracking-tight text-gray-900">
              Confirm Logout
            </h2>

            <p class="mt-2 text-sm leading-6 text-gray-500">
              Are you sure you want to log out of your account? You'll need to
              sign in again to access your workspace.
            </p>
          </div>

          <div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <p-button
              label="Cancel"
              icon="pi pi-times"
              (onClick)="signOutDialog = false"
              severity="secondary"
              [outlined]="true"
              styleClass="!w-full !justify-center !rounded-xl !py-3 !font-semibold"
            ></p-button>

            <p-button
              label="Yes, Logout"
              icon="pi pi-sign-out"
              (onClick)="LogOut()"
              severity="danger"
              styleClass="!w-full !justify-center !rounded-xl !py-3 !font-semibold"
            ></p-button>
          </div>
        </div>
      </ng-template>
    </p-dialog>
  `,
  styleUrl: './navbar.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent implements OnDestroy, OnInit {
  private readonly notificationService = inject(NotificationService);
  private readonly appConfigService = inject(AppConfigService);
  private readonly loadingService = inject(LoadingService);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  private readonly destroy$ = new Subject<void>();

  readonly isDarkMode = computed(
    () => this.appConfigService.appState()?.darkTheme ?? false,
  );

  isMobile = window.innerWidth < 770;

  notificationVisible = false;
  userRequestVisible = false;
  showLogoutDialog = false;
  visibleSetting = false;
  signOutDialog = false;
  isLogin = false;
  showSidebar = false;

  type = '';
  reason = '';
  currentUrl = '';
  openMenu: string | null = null;

  userId: string | null = null;
  unreadCount = 0;

  items: MenuItem[] = [];

  selectedNotification: NotificationDto | null = null;
  notificationLists: NotificationDto[] = [];

  currentUser: LoginResponse | null = null;

  // ==========================================
  // MAIN MENU
  // ==========================================

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

  // ==========================================
  // MANAGEMENT MENU
  // ==========================================

  management: any[] = [
    {
      label: 'Quotations',
      route: '/quotations',
      icon: 'pi-file',
    },
    {
      label: 'Purchase Orders',
      icon: 'pi-shopping-cart',
      route: '/purchase-orders',
    },
    {
      label: 'Sales Order',
      icon: 'pi-money-bill',
      route: '/sales-order',
    },
    {
      label: 'Company',
      route: '/company',
      icon: 'pi-building',
    },
    {
      label: 'Suppliers',
      route: '/supplier',
      icon: 'pi-shop',
    },
    {
      label: 'Clients',
      route: '/clients',
      icon: 'pi-users',
    },
    {
      label: 'Material Requests',
      route: '/material-requests',
      icon: 'pi-list',
    },
    {
      label: 'Inventory',
      icon: 'pi-box',
      items: [
        {
          label: 'Inventory Record',
          route: '/inventory/listing',
        },
        {
          label: 'Category',
          route: '/inventory/category',
        },
        {
          label: 'Location',
          route: '/inventory/location',
        },
        {
          label: 'Section',
          route: '/inventory/section',
        },
      ],
    },
    {
      label: 'Delivery Orders',
      icon: 'pi-truck',
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
    },
    {
      label: 'Projects',
      icon: 'pi-folder',
      route: '/projects',
    },
    {
      label: 'Tasks',
      icon: 'pi-check-square',
      route: '/tasks',
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
    },
    {
      label: 'Incomes',
      route: '/incomes',
      icon: 'pi-chart-line',
    },
    {
      label: 'Payments',
      route: '/payments',
      icon: 'pi-credit-card',
    },
    {
      label: 'Settings',
      icon: 'pi-cog',
      items: [
        {
          label: 'User Management',
          route: '/user-management',
        },
      ],
    },
  ];

  // ==========================================
  // CONSTRUCTOR
  // ==========================================

  constructor() {
    this.currentUser = this.userService.currentUser;
    this.userId = this.currentUser?.userId ?? null;

    this.currentUrl = this.router.url;

    // Keep navbar user information synchronized.
    this.userService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.currentUser = user;
        this.userId = user?.userId ?? null;

        this.cdr.markForCheck();
      });

    // Listen for route changes.
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd,
        ),
        takeUntil(this.destroy$),
      )
      .subscribe((event) => {
        this.currentUrl = event.urlAfterRedirects;

        this.syncOpenMenuWithRoute();

        this.notificationVisible = false;
        this.showSidebar = false;

        this.cdr.markForCheck();
      });

    this.syncOpenMenuWithRoute();
  }

  // ==========================================
  // INITIALIZATION
  // ==========================================

  ngOnInit(): void {
    // Notification list.
    this.notificationService.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe((notifications) => {
        this.notificationLists = notifications;
        this.cdr.markForCheck();
      });

    // Unread count.
    this.notificationService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe((count) => {
        this.unreadCount = count;
        this.cdr.markForCheck();
      });

    // Load notifications.
    this.notificationService
      .GetNotifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (err) => console.error('Failed to load notifications:', err),
      });

    // Refresh unread count using the service.
    this.notificationService.refreshUnreadCount();

    // Profile menu.
    this.items = [
      {
        items: [
          {
            label: 'Sign Out',
            icon: 'pi pi-sign-out',
            command: () => {
              this.signOutDialog = true;
              this.cdr.markForCheck();
            },
          },
        ],
      },
    ];

    this.syncOpenMenuWithRoute();
  }

  // ==========================================
  // ROUTE HANDLING
  // ==========================================

  private isRouteMatch(route?: string): boolean {
    if (!route) return false;

    const currentRoute = this.currentUrl.split('?')[0].split('#')[0];

    return currentRoute === route || currentRoute.startsWith(`${route}/`);
  }

  syncOpenMenuWithRoute(): void {
    for (const item of this.management) {
      if (!item.items) continue;

      const isChildActive = item.items.some((sub: any) =>
        this.isRouteMatch(sub.route),
      );

      if (isChildActive) {
        this.openMenu = item.label;
        return;
      }
    }

    this.openMenu = null;
  }

  isActive(route?: string, item?: any): boolean {
    if (item?.items) {
      return (
        item.items.some((sub: any) => this.isRouteMatch(sub.route)) ||
        this.isRouteMatch(route)
      );
    }

    return this.isRouteMatch(route);
  }

  // ==========================================
  // ROLE PERMISSIONS
  // ==========================================

  canView(item: any): boolean {
    const currentRole = this.currentUser?.systemRole?.trim().toLowerCase();

    if (!currentRole) return false;

    // SuperAdmin can access everything.
    if (currentRole === 'superadmin') {
      return true;
    }

    // Items without role restrictions.
    if (!item.roles || item.roles.length === 0) {
      return true;
    }

    return item.roles.some(
      (role: string) => role.trim().toLowerCase() === currentRole,
    );
  }

  getAllowedSubItems(item: any): any[] {
    if (!item.items) return [];

    return item.items.filter((sub: any) => this.canView(sub));
  }

  hasVisibleSubItems(item: any): boolean {
    return this.getAllowedSubItems(item).length > 0;
  }

  toggleMenu(label: string): void {
    this.openMenu = this.openMenu === label ? null : label;
    this.cdr.markForCheck();
  }

  // ==========================================
  // MOBILE SIDEBAR
  // ==========================================

  ToggleSidebar(): void {
    this.showSidebar = true;
    this.cdr.markForCheck();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.isMobile = window.innerWidth < 770;

    if (!this.isMobile) {
      this.showSidebar = false;
    }

    this.cdr.markForCheck();
  }

  // ==========================================
  // DARK MODE
  // ==========================================

  toggleDarkMode(): void {
    this.appConfigService.appState.update((state) => ({
      ...state,
      darkTheme: !state?.darkTheme,
    }));

    this.cdr.markForCheck();
  }

  // ==========================================
  // NOTIFICATIONS
  // ==========================================

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.notificationVisible || this.isMobile) return;

    const target = event.target as HTMLElement;

    const notificationPanel = document.getElementById('notification-panel');

    const notificationBell = document.getElementById('notification-bell');

    const clickedInsidePanel = notificationPanel?.contains(target);

    const clickedBell = notificationBell?.contains(target);

    if (!clickedInsidePanel && !clickedBell) {
      this.notificationVisible = false;
      this.cdr.markForCheck();
    }
  }

  onBellClick(): void {
    if (this.isMobile) {
      this.router.navigate(['/notifications']);
      return;
    }

    this.notificationVisible = !this.notificationVisible;
    this.cdr.markForCheck();
  }

  markNotificationAsRead(notification: NotificationDto): void {
    if (notification.isRead) return;

    this.notificationService
      .MarkRead(notification.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          notification.isRead = true;

          this.unreadCount = Math.max(0, this.unreadCount - 1);

          this.cdr.markForCheck();
        },
        error: (err) =>
          console.error('Failed to mark notification as read:', err),
      });
  }

  loadNotifications(): void {
    this.notificationService
      .GetNotifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: NotificationDto[]) => {
          this.notificationLists = res;

          this.unreadCount = res.filter(
            (notification) => !notification.isRead,
          ).length;

          this.cdr.markForCheck();
        },
        error: (err) => console.error('Failed to load notifications:', err),
      });
  }

  // ==========================================
  // OTHER DIALOGS
  // ==========================================

  ShowSettingDialog(): void {
    this.visibleSetting = !this.visibleSetting;

    if (this.notificationVisible && this.visibleSetting) {
      this.notificationVisible = false;
    }

    this.cdr.markForCheck();
  }

  RoleRequestClick(notification: NotificationDto): void {
    this.selectedNotification = notification;
    this.userRequestVisible = true;
    this.cdr.markForCheck();
  }

  CancelDialog(): void {
    this.userRequestVisible = false;
    this.cdr.markForCheck();
  }

  // ==========================================
  // LOGOUT
  // ==========================================

  LogOut(): void {
    this.signOutDialog = false;
    this.authService.logout();
  }

  // ==========================================
  // CLEANUP
  // ==========================================

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
