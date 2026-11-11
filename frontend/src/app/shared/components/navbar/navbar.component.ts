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
import { Subject, distinctUntilChanged, filter, takeUntil } from 'rxjs';

import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

import { AppConfigService } from '../../../services/appConfig.service';
import { NotificationService } from '../../../services/notificationService.service';
import { UserService } from '../../../services/userService.service';

import { NotificationDto } from '../../../models/Notifications';
import { LoginResponse } from '../../../models/User';
import { AuthService } from '../../../services/authService';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, AvatarModule, ButtonModule, DialogModule, RouterLink],
  template: `
    <header
      class="relative z-40 flex h-[68px] w-full items-center justify-end
             border-b border-slate-200/80 bg-white px-3 sm:px-5 lg:px-7"
    >
      <div class="flex items-center gap-2 sm:gap-3">
        <!-- Dark Mode -->
        <button
          type="button"
          (click)="toggleDarkMode()"
          [attr.aria-label]="
            isDarkMode() ? 'Switch to light mode' : 'Switch to dark mode'
          "
          class="group flex h-10 w-10 items-center justify-center rounded-xl
                 border border-slate-200 bg-white text-slate-500
                 transition-all duration-200 hover:border-blue-200
                 hover:bg-blue-50 hover:text-blue-600
                 active:scale-95"
        >
          <i
            [ngClass]="isDarkMode() ? 'pi pi-sun' : 'pi pi-moon'"
            class="text-lg transition-transform duration-200 group-hover:rotate-12"
          ></i>
        </button>

        <!-- Notification -->
        <div class="relative" id="notification-container">
          <button
            id="notification-bell"
            type="button"
            (click)="onBellClick()"
            aria-label="Notifications"
            class="relative flex h-10 w-10 items-center justify-center
                   rounded-xl border border-slate-200 bg-white
                   text-slate-500 transition-all duration-200
                   hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600
                   active:scale-95"
          >
            <i class="pi pi-bell text-lg"></i>

            <span
              *ngIf="unreadCount > 0"
              class="absolute -right-1 -top-1 flex h-[19px] min-w-[19px]
                     items-center justify-center rounded-full border-2
                     border-white bg-red-500 px-1 text-[9px] font-bold
                     text-white shadow-sm"
            >
              {{ unreadCount > 99 ? '99+' : unreadCount }}
            </span>
          </button>

          <!-- Desktop Notification Dropdown -->
          <div
            *ngIf="notificationVisible && !isMobile"
            id="notification-panel"
            class="absolute right-0 top-[50px] z-50 flex w-[min(360px,calc(100vw-24px))]
                   max-h-[min(480px,calc(100vh-100px))] flex-col
                   overflow-hidden rounded-2xl border border-slate-200
                   bg-white shadow-xl shadow-slate-900/10"
          >
            <!-- Header -->
            <div
              class="flex items-center justify-between border-b border-slate-100
                     px-5 py-4"
            >
              <div>
                <h3 class="text-sm font-bold text-slate-800">Notifications</h3>
                <p class="mt-0.5 text-xs text-slate-400">
                  Stay updated with your latest activities
                </p>
              </div>

              <span
                class="rounded-full bg-blue-50 px-2.5 py-1
                       text-[11px] font-semibold text-blue-600"
              >
                {{ unreadCount }} unread
              </span>
            </div>

            <!-- Notification List -->
            <div class="min-h-0 flex-1 overflow-y-auto">
              <!-- Empty State -->
              <div
                *ngIf="notificationLists.length === 0"
                class="flex flex-col items-center justify-center px-5 py-12"
              >
                <div
                  class="flex h-14 w-14 items-center justify-center
                         rounded-2xl bg-slate-50"
                >
                  <i class="pi pi-bell-slash text-2xl text-slate-300"></i>
                </div>

                <p class="mt-4 text-sm font-semibold text-slate-700">
                  You're all caught up!
                </p>

                <p class="mt-1 text-xs text-slate-400">
                  No notifications at the moment.
                </p>
              </div>

              <!-- Notification Items -->
              <div
                *ngFor="let notification of notificationLists | slice: 0 : 5"
                class="flex gap-3 border-b border-slate-100 px-4 py-4
                       transition-colors hover:bg-slate-50"
                [ngClass]="!notification.isRead ? 'bg-blue-50/40' : 'bg-white'"
              >
                <div
                  class="flex h-9 w-9 shrink-0 items-center justify-center
                         rounded-xl"
                  [ngClass]="
                    !notification.isRead
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-slate-100 text-slate-400'
                  "
                >
                  <i class="pi pi-bell text-sm"></i>
                </div>

                <div class="min-w-0 flex-1">
                  <div class="flex items-start justify-between gap-2">
                    <p class="text-sm font-semibold text-slate-800">
                      {{ notification.title }}
                    </p>

                    <span
                      *ngIf="!notification.isRead"
                      class="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500"
                    ></span>
                  </div>

                  <p
                    class="mt-1 text-xs leading-5 text-slate-500
                           break-words"
                  >
                    {{ notification.message }}
                  </p>

                  <div
                    class="mt-2 flex flex-wrap items-center justify-between gap-2"
                  >
                    <span class="text-[10px] text-slate-400">
                      {{ notification.createdAt | date: 'dd/MM/yyyy hh:mm a' }}
                    </span>

                    <button
                      *ngIf="!notification.isRead"
                      type="button"
                      (click)="markNotificationAsRead(notification)"
                      class="text-[11px]! font-semibold text-blue-600
                             transition-colors hover:text-blue-800"
                    >
                      Mark as read
                    </button>

                    <span
                      *ngIf="notification.isRead"
                      class="text-[10px] text-slate-400"
                    >
                      Read
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <a
              routerLink="/notifications"
              (click)="notificationVisible = false"
              class="flex items-center justify-center gap-2 border-t
                     border-slate-100 bg-white px-4 py-3.5
                     text-xs font-semibold text-blue-600
                     transition-colors hover:bg-blue-50"
            >
              View all notifications
              <i class="pi pi-arrow-right text-[10px]"></i>
            </a>
          </div>
        </div>

        <!-- Profile Dropdown -->
        <div class="relative" id="profile-menu-container">
          <!-- Profile Toggle -->
          <button
            type="button"
            (click)="toggleProfileMenu()"
            [attr.aria-expanded]="profileMenuVisible"
            aria-label="Open profile menu"
            class="flex items-center gap-2 rounded-xl border border-transparent
                   py-1.5 pl-1.5 pr-2 transition-all duration-200
                   hover:border-slate-200 hover:bg-slate-50
                   active:scale-[0.98] sm:gap-3 sm:pl-2 sm:pr-3"
          >
            <p-avatar
              [label]="getUserInitials()"
              shape="circle"
              styleClass="!h-9 !w-9 !bg-blue-100 !text-blue-700 !text-sm !font-bold"
            ></p-avatar>

            <div class="hidden min-w-0 text-left sm:block">
              <p
                class="max-w-[130px] truncate text-xs font-bold text-slate-800"
              >
                {{
                  currentUser?.displayName || currentUser?.fullName || 'User'
                }}
              </p>

              <p class="text-[10px] text-slate-400">My Account</p>
            </div>

            <i
              class="pi text-xs text-slate-400 transition-transform duration-200"
              [ngClass]="
                profileMenuVisible ? 'pi-chevron-up' : 'pi-chevron-down'
              "
            ></i>
          </button>

          <!-- Profile Dropdown Content -->
          <div
            *ngIf="profileMenuVisible"
            class="absolute right-0 top-[52px] z-50 w-[min(290px,calc(100vw-24px))]
                   overflow-hidden rounded-2xl border border-slate-200
                   bg-white shadow-xl shadow-slate-900/10"
          >
            <!-- User Information -->
            <div class="border-b border-slate-100 bg-slate-50/70 p-4">
              <div class="flex items-center gap-3">
                <p-avatar
                  [label]="getUserInitials()"
                  shape="circle"
                  styleClass="!h-11 !w-11 !bg-blue-100 !text-blue-700 !font-bold"
                ></p-avatar>

                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-bold text-slate-800">
                    {{
                      currentUser?.displayName ||
                        currentUser?.fullName ||
                        'User'
                    }}
                  </p>

                  <p class="mt-0.5 truncate text-xs text-slate-500">
                    {{ currentUser?.email || '' }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Menu Items -->
            <div class="p-2">
              <!-- Language -->
              <button
                type="button"
                (click)="openLanguageDialog()"
                class="flex w-full items-center gap-3 rounded-xl px-3 py-3
                       text-left transition-colors hover:bg-blue-50"
              >
                <span
                  class="flex h-9 w-9 items-center justify-center
                         rounded-xl bg-blue-50 text-blue-600"
                >
                  <i class="pi pi-globe text-base"></i>
                </span>

                <span class="min-w-0 flex-1">
                  <span class="block text-sm font-semibold text-slate-700">
                    Language
                  </span>

                  <span class="mt-0.5 block text-[11px] text-slate-400">
                    {{ getLanguageLabel() }}
                  </span>
                </span>

                <i class="pi pi-angle-right text-xs text-slate-400"></i>
              </button>

              <!-- Divider -->
              <div class="my-2 border-t border-slate-100"></div>

              <!-- Logout -->
              <button
                type="button"
                (click)="openLogoutDialog()"
                class="flex w-full items-center gap-3 rounded-xl px-3 py-3
                       text-left transition-colors hover:bg-red-50"
              >
                <span
                  class="flex h-9 w-9 items-center justify-center
                         rounded-xl bg-red-50 text-red-500"
                >
                  <i class="pi pi-sign-out text-base"></i>
                </span>

                <span class="flex-1">
                  <span class="block text-sm font-semibold text-red-600">
                    Sign Out
                  </span>

                  <span class="mt-0.5 block text-[11px] text-slate-400">
                    Sign out of your account
                  </span>
                </span>
              </button>
            </div>

            <!-- Footer -->
            <div class="border-t border-slate-100 bg-slate-50/70 px-4 py-3">
              <p class="text-center text-[10px] font-medium text-slate-400">
                OfficeHub
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Language Dialog -->
    <p-dialog
      [(visible)]="languageDialog"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [closable]="true"
      [dismissableMask]="true"
      [style]="{ width: 'min(92vw, 420px)' }"
      styleClass="!rounded-2xl"
      contentStyleClass="!px-5 !pb-5 !pt-2 sm:!px-6"
    >
      <ng-template #header>
        <div class="flex items-center gap-3 py-1">
          <div
            class="flex h-11 w-11 items-center justify-center
                   rounded-xl bg-blue-50 text-blue-600"
          >
            <i class="pi pi-globe text-xl"></i>
          </div>

          <div>
            <h2 class="text-base font-bold text-slate-800">Choose Language</h2>

            <p class="mt-0.5 text-xs text-slate-400">
              Select your preferred language
            </p>
          </div>
        </div>
      </ng-template>

      <div class="flex flex-col gap-2.5">
        <!-- English -->
        <button
          type="button"
          (click)="changeLanguage('en')"
          [disabled]="isChangingLanguage"
          class="group flex w-full items-center gap-3 rounded-xl border
                 p-3.5 text-left transition-all duration-200
                 disabled:cursor-wait disabled:opacity-60"
          [ngClass]="
            selectedLanguage === 'en'
              ? 'border-blue-500 bg-blue-50/70 ring-1 ring-blue-100'
              : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50'
          "
        >
          <span
            class="flex h-11 w-11 items-center justify-center
                   rounded-xl bg-slate-50 text-2xl"
          >
            🇬🇧
          </span>

          <span class="min-w-0 flex-1">
            <span class="block text-sm font-bold text-slate-800">
              English
            </span>
            <span class="mt-0.5 block text-xs text-slate-400">
              English language
            </span>
          </span>

          <i
            *ngIf="selectedLanguage === 'en'"
            class="pi pi-check-circle text-lg text-blue-600"
          ></i>
        </button>

        <!-- Chinese -->
        <button
          type="button"
          (click)="changeLanguage('zh')"
          [disabled]="isChangingLanguage"
          class="group flex w-full items-center gap-3 rounded-xl border
                 p-3.5 text-left transition-all duration-200
                 disabled:cursor-wait disabled:opacity-60"
          [ngClass]="
            selectedLanguage === 'zh'
              ? 'border-blue-500 bg-blue-50/70 ring-1 ring-blue-100'
              : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50'
          "
        >
          <span
            class="flex h-11 w-11 items-center justify-center
                   rounded-xl bg-slate-50 text-2xl"
          >
            🇨🇳
          </span>

          <span class="min-w-0 flex-1">
            <span class="block text-sm font-bold text-slate-800"> 中文 </span>
            <span class="mt-0.5 block text-xs text-slate-400">
              Chinese language
            </span>
          </span>

          <i
            *ngIf="selectedLanguage === 'zh'"
            class="pi pi-check-circle text-lg text-blue-600"
          ></i>
        </button>

        <!-- Bahasa Malaysia -->
        <button
          type="button"
          (click)="changeLanguage('ms')"
          [disabled]="isChangingLanguage"
          class="group flex w-full items-center gap-3 rounded-xl border
                 p-3.5 text-left transition-all duration-200
                 disabled:cursor-wait disabled:opacity-60"
          [ngClass]="
            selectedLanguage === 'ms'
              ? 'border-blue-500 bg-blue-50/70 ring-1 ring-blue-100'
              : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50'
          "
        >
          <span
            class="flex h-11 w-11 items-center justify-center
                   rounded-xl bg-slate-50 text-2xl"
          >
            🇲🇾
          </span>

          <span class="min-w-0 flex-1">
            <span class="block text-sm font-bold text-slate-800">
              Bahasa Malaysia
            </span>
            <span class="mt-0.5 block text-xs text-slate-400">
              Bahasa Melayu
            </span>
          </span>

          <i
            *ngIf="selectedLanguage === 'ms'"
            class="pi pi-check-circle text-lg text-blue-600"
          ></i>
        </button>
      </div>

      <div class="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 p-3">
        <i class="pi pi-info-circle mt-0.5 text-xs text-slate-400"></i>
        <p class="text-[11px] leading-5 text-slate-500">
          Your language preference will be saved and used the next time you
          access OfficeHub.
        </p>
      </div>
    </p-dialog>

    <!-- Logout Confirmation Dialog -->
    <p-dialog
      [(visible)]="signOutDialog"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [dismissableMask]="true"
      [showHeader]="false"
      [style]="{ width: 'min(92vw, 420px)' }"
      styleClass="!rounded-2xl"
      contentStyleClass="!p-0 !rounded-2xl"
    >
      <div class="px-6 pb-6 pt-8 sm:px-8">
        <!-- Icon -->
        <div class="flex justify-center">
          <div
            class="flex h-16 w-16 items-center justify-center
                   rounded-2xl bg-red-50"
          >
            <i class="pi pi-sign-out text-2xl text-red-500"></i>
          </div>
        </div>

        <!-- Content -->
        <div class="mt-5 text-center">
          <h2 class="text-lg font-bold text-slate-800">Confirm Logout</h2>

          <p
            class="mx-auto mt-2 max-w-[290px] text-sm leading-6 text-slate-500"
          >
            Are you sure you want to log out of your account? You'll need to
            sign in again to access your workspace.
          </p>
        </div>

        <!-- Actions -->
        <div class="mt-7 flex flex-col-reverse gap-2 sm:flex-row">
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
  private readonly translate = inject(TranslateService);
  private readonly destroy$ = new Subject<void>();

  readonly router = inject(Router);

  readonly isDarkMode = computed(
    () => this.appConfigService.appState()?.darkTheme ?? false,
  );

  isMobile = typeof window !== 'undefined' && window.innerWidth < 770;

  notificationVisible = false;
  profileMenuVisible = false;
  signOutDialog = false;
  languageDialog = false;

  selectedLanguage: 'en' | 'zh' | 'ms' = 'en';
  isChangingLanguage = false;

  userId: string | null = null;
  unreadCount = 0;

  notificationLists: NotificationDto[] = [];
  currentUser: LoginResponse | null = null;

  constructor() {
    const savedLanguage = localStorage.getItem('language');
    const currentLanguage = this.translate.currentLang;

    const language = savedLanguage || currentLanguage || 'en';

    this.selectedLanguage =
      language === 'zh' || language === 'ms' ? language : 'en';

    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd,
        ),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        this.notificationVisible = false;
        this.profileMenuVisible = false;
        this.cdr.markForCheck();
      });
  }

  ngOnInit(): void {
    // Language
    this.translate.onLangChange
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        const language = event.lang;

        if (language === 'en' || language === 'zh' || language === 'ms') {
          this.selectedLanguage = language;
          this.cdr.markForCheck();
        }
      });

    // Notification list
    this.notificationService.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe((notifications) => {
        this.notificationLists = notifications;
        this.cdr.markForCheck();
      });

    // Unread count
    this.notificationService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe((count) => {
        this.unreadCount = count;
        this.cdr.markForCheck();
      });

    // Authenticated user
    this.subscribeToCurrentUser();
  }

  // ----------------------------------------
  // Profile Menu
  // ----------------------------------------

  toggleProfileMenu(): void {
    this.profileMenuVisible = !this.profileMenuVisible;

    if (this.profileMenuVisible) {
      this.notificationVisible = false;
    }

    this.cdr.markForCheck();
  }

  openLanguageDialog(): void {
    this.profileMenuVisible = false;
    this.languageDialog = true;
    this.cdr.markForCheck();
  }

  openLogoutDialog(): void {
    this.profileMenuVisible = false;
    this.signOutDialog = true;
    this.cdr.markForCheck();
  }

  getUserInitials(): string {
    const name =
      this.currentUser?.displayName || this.currentUser?.fullName || 'User';

    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }

  getLanguageLabel(): string {
    switch (this.selectedLanguage) {
      case 'zh':
        return '中文';
      case 'ms':
        return 'Bahasa Malaysia';
      default:
        return 'English';
    }
  }

  // ----------------------------------------
  // Dark Mode
  // ----------------------------------------

  toggleDarkMode(): void {
    this.appConfigService.appState.update((state) => ({
      ...state,
      darkTheme: !state?.darkTheme,
    }));

    this.cdr.markForCheck();
  }

  // ----------------------------------------
  // Notifications
  // ----------------------------------------

  onBellClick(): void {
    if (this.isMobile) {
      this.notificationVisible = false;
      this.profileMenuVisible = false;
      this.router.navigate(['/notifications']);
      return;
    }

    this.notificationVisible = !this.notificationVisible;

    if (this.notificationVisible) {
      this.profileMenuVisible = false;
    }

    this.cdr.markForCheck();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    const notificationContainer = document.getElementById(
      'notification-container',
    );

    const profileContainer = document.getElementById('profile-menu-container');

    const clickedNotification =
      notificationContainer?.contains(target) ?? false;

    const clickedProfile = profileContainer?.contains(target) ?? false;

    let changed = false;

    if (this.notificationVisible && !clickedNotification) {
      this.notificationVisible = false;
      changed = true;
    }

    if (this.profileMenuVisible && !clickedProfile) {
      this.profileMenuVisible = false;
      changed = true;
    }

    if (changed) {
      this.cdr.markForCheck();
    }
  }

  markNotificationAsRead(notification: NotificationDto): void {
    if (notification.isRead) return;

    this.notificationService
      .MarkRead(notification.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (err) => {
          console.error('Failed to mark notification as read:', err);
        },
      });
  }

  // ----------------------------------------
  // Language
  // ----------------------------------------

  changeLanguage(language: 'en' | 'zh' | 'ms'): void {
    if (this.isChangingLanguage || this.selectedLanguage === language) {
      if (this.selectedLanguage === language) {
        this.languageDialog = false;
        this.cdr.markForCheck();
      }

      return;
    }

    this.isChangingLanguage = true;
    this.cdr.markForCheck();

    this.translate
      .use(language)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.selectedLanguage = language;
          localStorage.setItem('language', language);

          this.isChangingLanguage = false;
          this.languageDialog = false;

          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Failed to change language:', err);

          this.isChangingLanguage = false;
          this.cdr.markForCheck();
        },
      });
  }

  // ----------------------------------------
  // Logout
  // ----------------------------------------

  LogOut(): void {
    this.signOutDialog = false;
    this.authService.logout();
  }

  // ----------------------------------------
  // Responsive
  // ----------------------------------------

  @HostListener('window:resize')
  onResize(): void {
    this.isMobile = window.innerWidth < 770;

    if (this.isMobile) {
      this.notificationVisible = false;
    }

    this.cdr.markForCheck();
  }

  private subscribeToCurrentUser(): void {
    this.userService.currentUser$
      .pipe(
        distinctUntilChanged(
          (previous, current) => previous?.userId === current?.userId,
        ),
        takeUntil(this.destroy$),
      )
      .subscribe((user) => {
        this.currentUser = user;
        this.userId = user?.userId ?? null;

        this.cdr.markForCheck();
      });
  }

  // ----------------------------------------
  // Cleanup
  // ----------------------------------------

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
