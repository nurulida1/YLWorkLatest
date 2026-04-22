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
          class="w-10 h-10 border rounded-full border-gray-300 flex items-center justify-center cursor-pointer"
        >
          <i class="pi pi-bell text-lg text-gray-500!"></i>
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
                <span class="font-bold">{{ currentUser.fullName }}</span>
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
      [closable]="false"
    >
      <ng-template #header>
        <div class="flex flex-row items-center gap-2 w-full">
          <div class="bg-blue-500 rounded-md w-8 h-8 p-1.5">
            <img
              src="assets/logo.png"
              alt=""
              class="w-full h-full object-cover"
            />
          </div>
          <span class="font-bold text-2xl tracking-wide"> YL Works </span>
        </div>
      </ng-template>
      <div class="border-b border-gray-100 mb-4"></div>
      <div class="w-full flex flex-col gap-3 overflow-y-auto max-h-96">
        <div class="text-gray-500 text-sm">MAIN MENU</div>
        <div class="flex flex-col gap-2 w-full">
          <ng-container *ngFor="let item of mainMenu">
            <div
              *ngIf="item.roles.includes(currentUser?.systemRole)"
              class="flex flex-row py-2 px-5 items-center justify-start gap-3"
              [routerLink]="item.route"
              [ngClass]="{
                'rounded-lg bg-blue-500 text-white': isActive(item.route),
                'cursor-pointer hover:text-gray-500': !isActive(item.route),
              }"
            >
              <div class="text-[15px]">
                {{ item.label }}
              </div>
            </div>
          </ng-container>
        </div>
      </div>
      <div class="text-gray-500 text-sm mt-5 mb-3">MANAGEMENT</div>
      <div class="flex flex-col items-center lg:items-start gap-3 mt-3">
        <ng-container *ngFor="let item of management">
          <div
            class="flex flex-col gap-2 w-full"
            *ngIf="item.roles.includes(currentUser?.systemRole)"
          >
            <div
              class="flex flex-row items-center justify-between gap-3 py-2 rounded-lg px-2"
              [ngClass]="{
                'bg-blue-500 text-white': isActive(item.route, item),
                'hover:text-gray-500 cursor-pointer': !isActive(
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
                  class="{{ item.icon }}"
                  [ngClass]="{
                    'text-white': isActive(item.route, item),
                    'text-gray-600': !isActive(item.route, item),
                  }"
                ></i>

                <span class="text-[15px]">
                  {{ item.label }}
                </span>
              </div>

              <!-- RIGHT: chevron -->
              <i
                *ngIf="item.items"
                class="text-sm! pi"
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
                *ngFor="let sub of item.items"
                class="py-3 px-3 rounded-md cursor-pointer text-[15px]"
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
    </p-drawer>

    <p-dialog
      [(visible)]="signOutDialog"
      (onHide)="signOutDialog = false"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [dismissableMask]="true"
      styleClass="w-[80%] lg:w-[40%]! 2xl:w-[30%]! p-5"
    >
      <ng-template #headless>
        <div class="flex flex-col justify-center items-center">
          <div><img src="assets/logout.png" alt="" class="w-20" /></div>
          <div class="font-semibold text-lg pt-2">
            Are you sure you want to logout ?
          </div>
        </div>
        <div class="pt-5 flex flex-row items-center gap-2 justify-center px-10">
          <p-button
            label="Cancel"
            (onClick)="signOutDialog = false"
            class="w-full"
            styleClass="!flex-1 !w-full"
            severity="secondary"
          ></p-button>
          <p-button
            (onClick)="LogOut()"
            label="Confirm"
            class="w-full"
            styleClass="!flex-1 !w-full !bg-[#4D46F7] !border-none"
          ></p-button>
        </div> </ng-template
    ></p-dialog>
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

  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  private notificationSub!: Subscription;
  private destroy$ = new Subject<void>();
  notifications: { message: string; time: Date }[] = [];

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
      icon: 'pi pi-home',
      route: '/dashboard',
      roles: ['SuperAdmin', 'Admin', 'Staff', 'HR', 'Manager', 'Director'],
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
      label: 'Project',
      roles: ['Manager', 'Director', 'Admin', 'SuperAdmin'],
      items: [
        {
          label: 'Projects',
          route: '/projects',
        },
        {
          label: 'Tasks',
          route: '/tasks',
        },
      ],
    },
    {
      label: 'Inventory & Sales',
      roles: ['Manager', 'Director', 'Admin', 'SuperAdmin'],
      items: [
        {
          label: 'Quotations',
          route: '/quotations',
        },
        {
          label: 'Invoices',
          route: '/invoices',
        },
        {
          label: 'Clients',
          route: '/clients',
        },
      ],
    },
    {
      label: 'Purchases',
      roles: ['Manager', 'Director', 'Admin', 'SuperAdmin'],
      items: [
        {
          label: 'Purchase Orders',
          route: '/purchase-orders',
        },
        {
          label: 'Suppliers',
          route: '/suppliers',
        },
        {
          label: 'Supplier Payments',
          route: '/supplier-payments',
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
          label: 'Manage Users',
          route: '/user-management',
        },
      ],
    },
    {
      label: 'Administration',
      roles: ['Director', 'Admin', 'SuperAdmin'],
      items: [
        {
          label: 'Settings',
          route: '/settings',
        },
      ],
    },
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
    this.notificationService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe((count) => {
        this.unreadCount = count;
        this.cdr.markForCheck();
      });

    this.notificationService.loadUnreadCount(
      this.userService.currentUser?.userId,
    );

    this.notificationService.message$
      .pipe(takeUntil(this.destroy$))
      .subscribe((msg) => {
        if (msg) {
          this.addNotification(msg);
          if (this.userId)
            this.notificationService.refreshUnreadCount(this.userId);
        }
      });

    if (!this.isMobile && this.userId) {
      this.notificationService.GetNotifications(this.userId).subscribe({
        next: (res) => (this.notificationLists = res),
        error: (err) => console.error('Failed to load notifications', err),
      });
    } else {
      this.notificationLists = [];
    }

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
    } else {
      this.notificationVisible = !this.notificationVisible;
      if (this.notificationVisible && this.visibleSetting) {
        this.visibleSetting = false;
      }
      if (this.notificationLists.some((x) => !x.isRead)) {
        setTimeout(() => {
          if (this.userId) {
            this.notificationService.MarkAllAsRead(this.userId).subscribe({
              next: (res) => {
                if (res.success) {
                  // ✅ update each notification in place
                  this.notificationLists.forEach((x) => (x.isRead = true));

                  // ✅ update unread count
                  this.notificationService['_unreadCount$'].next(0);
                }
              },
              error: (err) => {
                console.error(err);
              },
            });
          }
        }, 2000);
      }

      this.cdr.detectChanges();
    }
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

    //markAsRead
    this.cdr.detectChanges();
  }

  addNotification(message: string) {
    const newNotification = { message, time: new Date() };
    this.notifications = this.notifications
      ? [newNotification, ...this.notifications]
      : [newNotification];
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.notificationSub) this.notificationSub.unsubscribe();
    this.loadingService.stop();
  }
}
