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
import { RippleModule } from 'primeng/ripple';

import { AppConfigService } from '../../../services/appConfig.service';
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
    RouterLink,
    RippleModule,
  ],
  template: `
    <div
      class="border-b border-gray-200 w-full py-3 px-2 bg-white flex flex-row items-center justify-end"
    >
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
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly router = inject(Router);

  private readonly destroy$ = new Subject<void>();

  readonly isDarkMode = computed(
    () => this.appConfigService.appState()?.darkTheme ?? false,
  );

  isMobile = window.innerWidth < 770;

  notificationVisible = false;
  signOutDialog = false;

  userId: string | null = null;
  unreadCount = 0;

  items: MenuItem[] = [];

  notificationLists: NotificationDto[] = [];

  currentUser: LoginResponse | null = null;

  constructor() {
    this.currentUser = this.userService.currentUser;
    this.userId = this.currentUser?.userId ?? null;

    this.userService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.currentUser = user;
        this.userId = user?.userId ?? null;
        this.cdr.markForCheck();
      });

    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd,
        ),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        this.notificationVisible = false;
        this.cdr.markForCheck();
      });
  }

  ngOnInit(): void {
    this.notificationService.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe((notifications) => {
        this.notificationLists = notifications;
        this.cdr.markForCheck();
      });

    this.notificationService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe((count) => {
        this.unreadCount = count;
        this.cdr.markForCheck();
      });

    this.notificationService
      .GetNotifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (err) => console.error('Failed to load notifications:', err),
      });

    this.notificationService.refreshUnreadCount();

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
  }

  @HostListener('window:resize')
  onResize(): void {
    this.isMobile = window.innerWidth < 770;
    this.cdr.markForCheck();
  }

  toggleDarkMode(): void {
    this.appConfigService.appState.update((state) => ({
      ...state,
      darkTheme: !state?.darkTheme,
    }));

    this.cdr.markForCheck();
  }

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

  LogOut(): void {
    this.signOutDialog = false;
    this.authService.logout();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
