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
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { Subject, Subscription, filter, takeUntil } from 'rxjs';
import { PopoverModule } from 'primeng/popover';
import { DialogModule } from 'primeng/dialog';
import { AppConfigService } from '../../../services/appConfig.service';
import { LoadingService } from '../../../services/loading.service';
import { NotificationService } from '../../../services/notificationService.service';
import { UserService } from '../../../services/userService.service';
import { NotificationDto } from '../../../models/Notifications';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { MenuItem, MessageService } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { DrawerModule } from 'primeng/drawer';

@Component({
  selector: 'app-navbar',
  imports: [
    CommonModule,
    AvatarModule,
    ButtonModule,
    PopoverModule,
    DialogModule,
    AvatarModule,
    FormsModule,
    InputTextModule,
    MenuModule,
    DrawerModule,
    RouterLink,
  ],
  template: `
    <div
      class="border-b border-gray-200 w-full py-3 px-2 bg-white flex flex-row items-center justify-between"
    >
      <div class="">
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
        <div
          id="notification-bell"
          class="relative w-10 h-10 border rounded-full border-gray-300
           flex items-center justify-center cursor-pointer"
          (click)="onBellClick()"
        >
          <i class="pi pi-bell text-lg text-gray-500!"></i>

          <span
            *ngIf="unreadCount > 0"
            class="absolute -top-1 -right-1 bg-red-500 text-white
               text-[10px] rounded-full min-w-5 h-5
               flex items-center justify-center px-1"
          >
            {{ unreadCount > 99 ? '99+' : unreadCount }}
          </span>
        </div>

        <div
          id="notification-panel"
          #notificationPanel
          *ngIf="notificationVisible && !isMobile"
          class="absolute right-4 top-16 z-50 w-80
         max-h-[min(32rem,calc(100vh-5rem))]
         flex flex-col overflow-hidden
         bg-white border border-gray-200 rounded-lg shadow-lg"
        >
          <div
            class="flex justify-between items-center p-3 border-b border-gray-300"
          >
            <span class="font-semibold">Notifications</span>

            <span class="text-sm text-gray-500">
              {{ unreadCount }} unread
            </span>
          </div>

          <!-- Scrollable notification list -->
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
              [ngClass]="{ 'bg-blue-50': !notification.isRead }"
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

        <div
          class="w-10 h-10 border rounded-full border-gray-300 flex items-center justify-center cursor-pointer"
        >
          <i class="pi pi-user text-lg text-gray-500!"></i>
        </div>
        <div
          (click)="menu.toggle($event)"
          class="pi pi-angle-down text-lg! text-gray-500! cursor-pointer"
        ></div>

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
              <span class="flex flex-col">
                <span class="font-bold">{{ currentUser.displayName }}</span>
                <span class="text-sm">{{ currentUser.email }}</span>
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
                >{{ item.shortcut }}</span
              >
            </a>
          </ng-template>
        </p-menu>
      </div>
    </div>

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
          <div
            class="flex flex-row items-center gap-4 px-5 border-b border-white/10 pb-5"
          >
            <div class="w-50">
              <img
                src="assets/logo-yl-work.png"
                alt=""
                class="w-full h-full object-cover cursor-pointer"
                [routerLink]="'/dashboard'"
              />
            </div>
          </div>

          <div
            class="py-5 flex flex-col px-3 overflow-y-auto scrollbar scroll-smooth"
          >
            <div class="flex flex-col gap-2 w-full">
              <ng-container *ngFor="let item of mainMenu">
                <div
                  *ngIf="
                    item.roles.includes(currentUser?.systemRole) &&
                    (!item.items || hasVisibleSubItems(item))
                  "
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

                    <span>
                      {{ item.label }}
                    </span>
                  </div>
                </div>
              </ng-container>
            </div>
            <div
              class="mt-1 flex flex-col items-center lg:items-start gap-3 text-[14px]"
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
                      'hover:text-gray-400 cursor-pointer text-gray-300':
                        !isActive(item.route, item),
                    }"
                    (click)="item.items ? toggleMenu(item.label) : null"
                    [routerLink]="!item.items ? item.route : null"
                  >
                    <div class="flex items-center gap-3">
                      <i
                        class="pi {{ item.icon }} text-sm! xl:text-base!"
                        [ngClass]="{
                          'text-white': isActive(item.route, item),
                          'text-gray-400': !isActive(item.route, item),
                        }"
                      ></i>

                      <span>
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
        </div></ng-template
      >
    </p-drawer>

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
          <!-- Icon -->
          <div class="flex justify-center">
            <div
              class="flex h-20 w-20 items-center justify-center rounded-full bg-red-50 ring-8 ring-red-50/50"
            >
              <i class="pi pi-sign-out text-3xl text-red-500"></i>
            </div>
          </div>

          <!-- Title & Description -->
          <div class="mt-6 text-center">
            <h2 class="text-xl font-bold tracking-tight text-gray-900">
              Confirm Logout
            </h2>

            <p class="mt-2 text-sm leading-6 text-gray-500">
              Are you sure you want to log out of your account? You'll need to
              sign in again to access your workspace.
            </p>
          </div>

          <!-- Actions -->
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
  private readonly messageService = inject(MessageService);
  private readonly userService = inject(UserService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  private destroy$ = new Subject<void>();

  isDarkMode = computed(
    () => this.appConfigService.appState()?.darkTheme ?? false,
  );
  role: string | null = localStorage.getItem('role');
  isMobile = window.innerWidth < 770;

  notificationVisible: boolean = false;
  userRequestVisible: boolean = false;
  showLogoutDialog: boolean = false;
  visibleSetting: boolean = false;
  signOutDialog: boolean = false;
  isLogin: boolean = false;
  showSidebar: boolean = false;

  type: string = '';
  reason: string = '';
  currentUrl: string = '';
  openMenu: string | null = null;

  userId: string | null = null;
  unreadCount: number = 0;
  items: MenuItem[] | undefined;

  selectedNotification: NotificationDto | null = null;

  notificationLists: NotificationDto[] = [];
  currentUser: any = {};

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
      // roles: ['Logistic Assistant', 'SuperAdmin', 'Purchasing Executive'],
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
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

  @HostListener('window:resize', [])
  onResize() {
    this.isMobile = window.innerWidth < 770;
  }

  constructor() {
    this.userId = this.userService.currentUser?.userId ?? null;
    this.currentUser = this.userService.currentUser;

    this.currentUrl = this.router.url;
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd,
        ),
        takeUntil(this.destroy$),
      )
      .subscribe((event: NavigationEnd) => {
        this.currentUrl = event.urlAfterRedirects;
      });
  }

  ngOnInit(): void {
    // Listen to the notification list maintained by NotificationService.
    this.notificationService.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe((notifications) => {
        this.notificationLists = notifications;
        this.cdr.markForCheck();
      });

    // Listen to the unread count maintained by NotificationService.
    this.notificationService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe((count) => {
        this.unreadCount = count;
        this.cdr.markForCheck();
      });

    // Load saved notifications from the database.
    this.notificationService
      .GetNotifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (err) => console.error('Failed to load notifications:', err),
      });

    // Get the current unread count from the backend.
    this.notificationService.refreshUnreadCount();

    this.items = [
      {
        items: [
          {
            label: 'Sign Out',
            icon: 'pi pi-sign-out',
            command: () => {
              this.signOutDialog = true;
            },
          },
        ],
      },
    ];

    this.syncOpenMenuWithRoute();
  }

  loadNotifications() {
    this.notificationService.GetNotifications().subscribe({
      next: (res: NotificationDto[]) => {
        this.notificationLists = res;

        this.unreadCount = res.filter((x) => !x.isRead).length;

        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load notifications:', err);
      },
    });
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

  refreshUnreadCount() {
    this.loadingService.start();
    this.notificationService.UnreadCount().subscribe({
      next: (res) => {
        this.loadingService.stop();
        if (res.success) {
          this.unreadCount = res.unreadCount;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.loadingService.stop();
      },
    });
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

  LogOut() {
    this.userService.logout();
  }

  ToggleSidebar() {
    this.showSidebar = true;
    this.cdr.detectChanges();
  }

  ShowSettingDialog() {
    this.visibleSetting = !this.visibleSetting;
    if (this.notificationVisible && this.visibleSetting) {
      this.notificationVisible = false;
    }
    this.cdr.detectChanges();
  }

  toggleDarkMode() {
    this.appConfigService.appState.update((state) => ({
      ...state,
      darkTheme: !state?.darkTheme,
    }));

    this.cdr.detectChanges();
  }

  onBellClick() {
    if (this.isMobile) {
      this.router.navigate(['/notifications']);
      return;
    }

    this.notificationVisible = !this.notificationVisible;
    this.cdr.markForCheck();
  }

  RoleRequestClick(notification: NotificationDto) {
    this.selectedNotification = notification;
    this.userRequestVisible = true;
    this.cdr.detectChanges();
  }

  toggleMenu(label: string) {
    this.openMenu = this.openMenu === label ? null : label;
  }

  CancelDialog() {
    this.userRequestVisible = false;
    this.cdr.detectChanges();
  }

  getAllowedSubItems(item: any) {
    if (!item.items) return [];

    return item.items.filter((sub: any) => {
      if (!sub.roles) return true;
      return sub.roles.includes(this.currentUser?.systemRole);
    });
  }

  hasVisibleSubItems(item: any): boolean {
    if (!item.items) return false;
    return this.getAllowedSubItems(item).length > 0;
  }

  markNotificationAsRead(notification: NotificationDto) {
    if (notification.isRead) return;

    this.notificationService.MarkRead(notification.id).subscribe({
      next: () => {
        notification.isRead = true;

        this.unreadCount = Math.max(0, this.unreadCount - 1);

        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to mark notification as read:', err);
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.loadingService.stop();
  }
}
