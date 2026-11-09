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
import { PermissionService } from '../../../services/permissionService';
import { UserService } from '../../../services/userService.service';

import { LoginResponse } from '../../../models/User';
import {
  APP_MAIN_MENU,
  APP_MANAGEMENT_MENU,
  AppNavItem,
  MOBILE_QUICK_ACTIONS,
  MOBILE_WORK_MENU,
  MobileQuickAction,
  MobileWorkMenuItem,
} from '../../navigation/app-navigation';

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
              @for (item of visibleMyWorkItems; track item.route) {
                <a
                  class="work-menu-item"
                  [class.active]="isActive(item.route)"
                  [routerLink]="item.route"
                  (click)="closeAllSheets()"
                >
                  <div class="work-menu-icon">
                    <i [class]="item.icon || 'pi pi-circle'"></i>
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
                          {{ getMenuDescription(item) }}
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
          @for (action of visibleQuickActions; track action.route) {
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
  private readonly permissionService = inject(PermissionService);

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
  // SECTION 1: MY WORK (shared navigation)
  // ==========================================

  private readonly allMyWorkItems = MOBILE_WORK_MENU;

  get visibleMyWorkItems(): MobileWorkMenuItem[] {
    return this.allMyWorkItems.filter((item) =>
      this.permissionService.canReadModule(item.moduleKey),
    );
  }

  // ==========================================
  // SECTION 2: ALL MODULES (shared with sidemenu)
  // ==========================================

  readonly allModuleItems: AppNavItem[] = [
    ...APP_MAIN_MENU,
    ...APP_MANAGEMENT_MENU.filter((item) => item.label !== 'My Work'),
  ];

  // ==========================================
  // CREATE ACTIONS (shared navigation)
  // ==========================================

  private readonly allQuickActions = MOBILE_QUICK_ACTIONS;

  get visibleQuickActions(): MobileQuickAction[] {
    return this.allQuickActions.filter((action) =>
      this.permissionService.canReadModule(action.moduleKey),
    );
  }

  // ==========================================
  // INITIALIZATION
  // ==========================================

  ngOnInit(): void {
    this.currentUser = this.userService.currentUser;
    this.currentUrl = this.router.url;
    this.reloadPermissions();

    // USER INFORMATION
    this.userService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        this.currentUser = user;

        if (user) {
          this.reloadPermissions();
        } else {
          this.syncOpenMenuWithRoute();
          this.cdr.markForCheck();
        }
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

  getMenuDescription(item: AppNavItem): string {
    return (
      this.menuDescriptions[item.label] ||
      `Access ${item.label}`
    );
  }

  // ==========================================
  // PERMISSIONS (shared with sidemenu)
  // ==========================================

  private reloadPermissions(): void {
    this.permissionService.loadPermissions().subscribe({
      next: () => {
        this.syncOpenMenuWithRoute();
        this.cdr.markForCheck();
      },
      error: () => {
        this.syncOpenMenuWithRoute();
        this.cdr.markForCheck();
      },
    });
  }

  canView(item: AppNavItem): boolean {
    if (item.items?.length) {
      return this.hasVisibleSubItems(item);
    }

    return this.permissionService.canReadModule(item.moduleKey);
  }

  getAllowedSubItems(item: AppNavItem): AppNavItem[] {
    return item.items?.filter((sub) => this.canView(sub)) ?? [];
  }

  hasVisibleSubItems(item: AppNavItem): boolean {
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

    return currentRoute === route || currentRoute.startsWith(`${route}/`);
  }

  isActive(route?: string, item?: AppNavItem): boolean {
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
