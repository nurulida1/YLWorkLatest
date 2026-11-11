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
import { distinctUntilChanged, filter, of, switchMap } from 'rxjs';
import { UserService } from '../../../services/userService.service';
import { LoginResponse } from '../../../models/User';
import { PermissionService } from '../../../services/permissionService';
import {
  APP_MAIN_MENU,
  APP_MANAGEMENT_MENU,
  AppNavItem,
} from '../../navigation/app-navigation';

@Component({
  selector: 'app-sidemenu',
  imports: [CommonModule, RouterLink],
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
                *ngIf="canView(item)"
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
                *ngIf="canView(item)"
                class="flex flex-col gap-2 w-full"
                [ngClass]="{
                  'lg:hidden': item.mobileOnly,
                }"
              >
                <!-- Parent Menu -->
                <button
                  type="button"
                  class="flex w-full flex-row lg:pl-4 items-center justify-between
         gap-3 py-2 rounded-lg px-2 text-left"
                  [ngClass]="{
                    'bg-blue-500 text-white': isActive(item.route, item),
                    'text-gray-300 hover:text-white cursor-pointer': !isActive(
                      item.route,
                      item
                    ),
                  }"
                  [attr.aria-controls]="
                    item.items ? 'submenu-' + item.label : null
                  "
                  [attr.aria-expanded]="
                    item.items ? openMenu === item.label : null
                  "
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
                </button>

                <!-- Submenu -->
                <div
                  *ngIf="item.items && openMenu === item.label"
                  [id]="'submenu-' + item.label"
                  class="ml-10 flex flex-col gap-1"
                >
                  <a
                    *ngFor="let sub of getAllowedSubItems(item)"
                    class="py-3 px-3 rounded-md cursor-pointer"
                    [ngClass]="{
                      'bg-gray-700 font-semibold text-blue-500': isActive(
                        sub.route
                      ),
                      'hover:bg-gray-700 hover:text-blue-500': !isActive(
                        sub.route
                      ),
                      'lg:hidden': sub.mobileOnly,
                    }"
                    [routerLink]="sub.route"
                    [attr.aria-current]="isActive(sub.route) ? 'page' : null"
                  >
                    {{ sub.label }}
                  </a>
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
  private readonly permissionService = inject(PermissionService);

  currentUrl = '';
  currentUser: LoginResponse | null = null;

  openMenu: string | null = null;

  readonly mainMenu: AppNavItem[] = APP_MAIN_MENU;
  readonly management: AppNavItem[] = APP_MANAGEMENT_MENU;

  constructor() {
    this.initializeCurrentUser();
    this.initializeRouteTracking();
  }

  private initializeCurrentUser(): void {
    this.currentUser = this.userService.currentUser;

    this.userService.currentUser$
      .pipe(
        distinctUntilChanged(
          (previous, current) => previous?.userId === current?.userId,
        ),
        switchMap((user) => {
          this.currentUser = user;

          if (!user) {
            this.permissionService.clearPermissions();
            return of([]);
          }

          return this.permissionService.loadPermissions();
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.cdr.markForCheck();
      });
  }

  private initializeRouteTracking(): void {
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

  syncOpenMenuWithRoute(): void {
    const activeParent = this.management.find((item) =>
      item.items?.some((sub) => this.isRouteMatch(this.currentUrl, sub.route)),
    );

    this.openMenu = activeParent?.label ?? null;
  }

  isActive(route?: string, item?: AppNavItem): boolean {
    const cleanUrl = this.currentUrl.split('?')[0].split('#')[0];

    if (item?.items?.length) {
      return item.items.some((sub) => this.isRouteMatch(cleanUrl, sub.route));
    }

    if (!route) return false;

    const allRoutes = [
      ...this.mainMenu,
      ...this.management.flatMap((menu) => [menu, ...(menu.items ?? [])]),
    ]
      .map((menu) => menu.route)
      .filter((value): value is string => !!value);

    const mostSpecificRoute = allRoutes
      .filter((value) => this.isRouteMatch(cleanUrl, value))
      .reduce(
        (longest, value) => (value.length > longest.length ? value : longest),
        '',
      );

    return route === mostSpecificRoute;
  }

  private isRouteMatch(currentUrl: string, route?: string): boolean {
    if (!route) return false;

    const cleanRoute = route.split('?')[0].split('#')[0];

    return currentUrl === cleanRoute || currentUrl.startsWith(`${cleanRoute}/`);
  }

  getAllowedSubItems(item: AppNavItem): AppNavItem[] {
    return item.items?.filter((sub) => this.canView(sub)) ?? [];
  }

  hasVisibleSubItems(item: AppNavItem): boolean {
    return this.getAllowedSubItems(item).length > 0;
  }

  toggleMenu(label: string): void {
    this.openMenu = this.openMenu === label ? null : label;
    this.cdr.markForCheck();
  }

  canView(item: AppNavItem): boolean {
    if (item.public) {
      return true;
    }

    if (item.items?.length) {
      return this.hasVisibleSubItems(item);
    }

    return this.permissionService.canReadModule(item.moduleKey);
  }
}
