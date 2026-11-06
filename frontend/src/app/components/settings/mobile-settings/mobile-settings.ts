import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ButtonModule } from 'primeng/button';
import { RouterLink } from '@angular/router';
import {
  TranslatePipe,
  TranslateDirective,
  TranslateService,
} from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { LoginResponse } from '../../../models/User';
import { AppConfigService } from '../../../services/appConfig.service';
import { AuthService } from '../../../services/authService';
import { UserService } from '../../../services/userService.service';

@Component({
  selector: 'app-mobile-settings',
  imports: [
    CommonModule,
    RouterLink,
    TagModule,
    ToggleSwitchModule,
    ButtonModule,
    TranslatePipe,
    TranslateDirective,
    FormsModule,
  ],

  template: `
    <div class="min-h-screen bg-slate-50 pb-8">
      <!-- Header -->
      <div class="px-5 pt-6 pb-5">
        <div class="flex items-center justify-between mb-5">
          <div>
            <h1 class="text-2xl font-bold text-slate-900" translate>
              Settings
            </h1>
            <p class="text-sm text-slate-500 mt-1" translate>
              Manage your account and preferences
            </p>
          </div>
        </div>

        <!-- Profile Card -->
        <div
          class="relative overflow-hidden rounded-2xl bg-gradient-to-br
               from-blue-600 to-indigo-700 p-5 shadow-lg shadow-blue-200/50"
        >
          <div
            class="absolute -right-8 -top-10 w-36 h-36 rounded-full
                 bg-white/10"
          ></div>

          <div
            class="absolute -right-3 -bottom-16 w-40 h-40 rounded-full
                 bg-white/10"
          ></div>

          <div class="relative flex items-center gap-4">
            <div
              class="w-16 h-16 shrink-0 rounded-2xl bg-white/20
                   border border-white/30 flex items-center justify-center
                   text-white text-xl font-bold"
            >
              {{ initials || 'U' }}
            </div>

            <div class="flex-1 min-w-0">
              <h2 class="text-lg font-bold text-white truncate">
                {{ name }}
              </h2>

              <p class="text-sm text-blue-100 mt-1 truncate">
                {{ currentUser?.jobTitle || 'Employee' }}
              </p>

              <div
                class="inline-flex items-center gap-1.5 mt-2
                     rounded-full bg-white/15 px-2.5 py-1"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-green-300"></span>
                <span class="text-xs text-white font-medium" translate>
                  Active Account
                </span>
              </div>
            </div>

            <a
              routerLink="/profile-settings/personal-info"
              class="w-9 h-9 shrink-0 rounded-xl bg-white/15
                   flex items-center justify-center"
              aria-label="Edit profile"
            >
              <i class="pi pi-pencil text-white text-sm"></i>
            </a>
          </div>
        </div>
      </div>

      <!-- Account -->
      <div class="px-5 mt-2">
        <div class="flex items-center justify-between mb-3">
          <h3
            class="text-sm font-bold text-slate-800 uppercase tracking-wider"
            translate
          >
            Account
          </h3>
        </div>

        <div
          class="bg-white rounded-2xl border border-slate-200
               overflow-hidden shadow-sm"
        >
          <!-- Personal Information -->
          <a
            routerLink="/profile-settings/personal-info"
            class="flex items-center gap-3.5 p-4
                 active:bg-slate-50 transition-colors"
          >
            <div
              class="w-11 h-11 rounded-xl bg-blue-50
                   flex items-center justify-center shrink-0"
            >
              <i class="pi pi-user text-blue-600 text-lg"></i>
            </div>

            <div class="flex-1 min-w-0">
              <p class="font-semibold text-sm text-slate-800" translate>
                Personal Information
              </p>
              <p class="text-xs text-slate-500 mt-1" translate>
                Manage your personal details
              </p>
            </div>

            <i class="pi pi-chevron-right text-xs text-slate-400"></i>
          </a>

          <div class="h-px bg-slate-100 ml-[68px]"></div>

          <!-- Change Password -->
          <a
            routerLink="/change-password"
            class="flex items-center gap-3.5 p-4
                 active:bg-slate-50 transition-colors"
          >
            <div
              class="w-11 h-11 rounded-xl bg-amber-50
                   flex items-center justify-center shrink-0"
            >
              <i class="pi pi-lock text-amber-600 text-lg"></i>
            </div>

            <div class="flex-1 min-w-0">
              <p class="font-semibold text-sm text-slate-800" translate>
                Change Password
              </p>
              <p class="text-xs text-slate-500 mt-1" translate>
                Update your account password
              </p>
            </div>

            <i class="pi pi-chevron-right text-xs text-slate-400"></i>
          </a>

          <div class="h-px bg-slate-100 ml-[68px]"></div>

          <!-- Notifications -->
          <a
            routerLink="/notifications"
            class="flex items-center gap-3.5 p-4
                 active:bg-slate-50 transition-colors"
          >
            <div
              class="w-11 h-11 rounded-xl bg-violet-50
                   flex items-center justify-center shrink-0"
            >
              <i class="pi pi-bell text-violet-600 text-lg"></i>
            </div>

            <div class="flex-1 min-w-0">
              <p class="font-semibold text-sm text-slate-800" translate>
                Notifications
              </p>
              <p class="text-xs text-slate-500 mt-1" translate>
                View your notifications
              </p>
            </div>

            <i class="pi pi-chevron-right text-xs text-slate-400"></i>
          </a>
        </div>
      </div>

      <!-- Preferences -->
      <div class="px-5 mt-6">
        <h3
          class="text-sm font-bold text-slate-800 uppercase
               tracking-wider mb-3"
          translate
        >
          Preferences
        </h3>

        <div
          class="bg-white rounded-2xl border border-slate-200
               overflow-hidden shadow-sm"
        >
          <!-- Language -->
          <button
            type="button"
            (click)="isLanguageDialogOpen.set(true)"
            class="w-full flex items-center gap-3.5 p-4
                 text-left active:bg-slate-50 transition-colors"
          >
            <div
              class="w-11 h-11 rounded-xl bg-emerald-50
                   flex items-center justify-center shrink-0"
            >
              <i class="pi pi-language text-emerald-600 text-lg"></i>
            </div>

            <div class="flex-1 min-w-0">
              <p class="font-semibold text-sm text-slate-800" translate>
                Language
              </p>
              <p class="text-xs text-slate-500 mt-1" translate>
                Choose your preferred language
              </p>
            </div>

            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold text-blue-600">
                {{ getLanguageName() }}
              </span>
              <i class="pi pi-chevron-right text-xs text-slate-400"></i>
            </div>
          </button>

          <div class="h-px bg-slate-100 ml-[68px]"></div>

          <!-- Dark Mode -->
          <div class="flex items-center gap-3.5 p-4">
            <div
              class="w-11 h-11 rounded-xl bg-indigo-50
                   flex items-center justify-center shrink-0"
            >
              <i class="pi pi-moon text-indigo-600 text-lg"></i>
            </div>

            <div class="flex-1 min-w-0">
              <p class="font-semibold text-sm text-slate-800" translate>
                Dark Mode
              </p>
              <p class="text-xs text-slate-500 mt-1" translate>
                Change your app appearance
              </p>
            </div>

            <p-toggleswitch
              [ngModel]="appState()?.darkTheme ?? false"
              (ngModelChange)="toggleDarkMode($event)"
            ></p-toggleswitch>
          </div>
        </div>
      </div>

      <!-- Support -->
      <div class="px-5 mt-6">
        <h3
          class="text-sm font-bold text-slate-800 uppercase
               tracking-wider mb-3"
          translate
        >
          Support
        </h3>

        <div
          class="bg-white rounded-2xl border border-slate-200
               overflow-hidden shadow-sm"
        >
          <!-- Help Center -->
          <div
            class="flex items-center gap-3.5 p-4
                 active:bg-slate-50 transition-colors"
          >
            <div
              class="w-11 h-11 rounded-xl bg-sky-50
                   flex items-center justify-center shrink-0"
            >
              <i class="pi pi-question-circle text-sky-600 text-lg"></i>
            </div>

            <div class="flex-1 min-w-0">
              <p class="font-semibold text-sm text-slate-800" translate>
                Help Center
              </p>
              <p class="text-xs text-slate-500 mt-1" translate>
                Get help using OfficeHub
              </p>
            </div>

            <i class="pi pi-external-link text-xs text-slate-400"></i>
          </div>

          <div class="h-px bg-slate-100 ml-[68px]"></div>

          <!-- Report a Bug -->
          <div
            class="flex items-center gap-3.5 p-4
                 active:bg-slate-50 transition-colors"
          >
            <div
              class="w-11 h-11 rounded-xl bg-rose-50
                   flex items-center justify-center shrink-0"
            >
              <i class="pi pi-microchip text-rose-600 text-lg"></i>
            </div>

            <div class="flex-1 min-w-0">
              <p class="font-semibold text-sm text-slate-800" translate>
                Report a Bug
              </p>
              <p class="text-xs text-slate-500 mt-1" translate>
                Let us know if something is not working
              </p>
            </div>

            <i class="pi pi-chevron-right text-xs text-slate-400"></i>
          </div>

          <div class="h-px bg-slate-100 ml-[68px]"></div>

          <!-- Terms & Privacy -->
          <div
            class="flex items-center gap-3.5 p-4
                 active:bg-slate-50 transition-colors"
          >
            <div
              class="w-11 h-11 rounded-xl bg-slate-100
                   flex items-center justify-center shrink-0"
            >
              <i class="pi pi-file text-slate-600 text-lg"></i>
            </div>

            <div class="flex-1 min-w-0">
              <p class="font-semibold text-sm text-slate-800" translate>
                Terms & Privacy
              </p>
              <p class="text-xs text-slate-500 mt-1" translate>
                Read our terms and privacy policy
              </p>
            </div>

            <i class="pi pi-chevron-right text-xs text-slate-400"></i>
          </div>
        </div>
      </div>

      <!-- Sign Out -->
      <div class="px-5 mt-7">
        <p-button
          (onClick)="LogOut()"
          styleClass="w-full !rounded-xl !py-3.5 !bg-white !border !border-red-200 !text-red-600 hover:!bg-red-50"
          severity="danger"
          [outlined]="true"
          [label]="'Sign Out' | translate"
          icon="pi pi-sign-out"
          class="w-full"
        ></p-button>

        <div class="text-center mt-5">
          <p class="text-xs text-slate-400 font-medium">OfficeHub</p>
          <p class="text-[11px] text-slate-400 mt-1">Version 1.0.0</p>
        </div>
      </div>
    </div>

    <!-- Signing Out Overlay -->
    @if (isLoggingOut()) {
      <div
        class="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm
             flex items-center justify-center px-6"
      >
        <div
          class="w-full max-w-xs bg-white rounded-3xl px-8 py-8
               flex flex-col items-center gap-4 shadow-2xl"
        >
          <div
            class="w-16 h-16 rounded-2xl bg-blue-50
                 flex items-center justify-center"
          >
            <i class="pi pi-spin pi-spinner text-3xl text-blue-600"></i>
          </div>

          <div class="text-center">
            <p class="font-bold text-slate-900" translate>Signing Out...</p>

            <p class="text-sm text-slate-500 mt-1" translate>
              Please wait a moment
            </p>
          </div>
        </div>
      </div>
    }

    <!-- Language Bottom Sheet -->
    @if (isLanguageDialogOpen()) {
      <div
        class="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm
             flex items-end"
        (click)="isLanguageDialogOpen.set(false)"
      >
        <div
          class="w-full bg-white rounded-t-3xl px-5 pt-3 pb-8
               animate-[slideUp_0.25s_ease-out]"
          (click)="$event.stopPropagation()"
        >
          <!-- Sheet Handle -->
          <div class="w-10 h-1 rounded-full bg-slate-300 mx-auto mb-5"></div>

          <div class="flex items-center justify-between mb-5">
            <div>
              <h2 class="text-lg font-bold text-slate-900" translate>
                Choose Language
              </h2>
              <p class="text-xs text-slate-500 mt-1" translate>
                Select your preferred language
              </p>
            </div>

            <button
              type="button"
              class="w-9 h-9 rounded-full bg-slate-100
                   flex items-center justify-center"
              (click)="isLanguageDialogOpen.set(false)"
              aria-label="Close language selection"
            >
              <i class="pi pi-times text-slate-600"></i>
            </button>
          </div>

          <!-- English -->
          <button
            type="button"
            (click)="changeLanguage('en')"
            class="w-full flex items-center gap-3.5 p-4 rounded-2xl
                 border mb-3 transition-colors"
            [ngClass]="
              selectedLanguage() === 'en'
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 bg-white'
            "
          >
            <div
              class="w-11 h-11 rounded-xl bg-blue-100
                   flex items-center justify-center text-2xl"
            >
              🇬🇧
            </div>

            <div class="flex-1 text-left">
              <p class="font-semibold text-sm text-slate-800">English</p>
              <p class="text-xs text-slate-500 mt-1">English language</p>
            </div>

            @if (selectedLanguage() === 'en') {
              <i class="pi pi-check-circle text-blue-600 text-lg"></i>
            }
          </button>

          <!-- Chinese -->
          <button
            type="button"
            (click)="changeLanguage('zh')"
            class="w-full flex items-center gap-3.5 p-4 rounded-2xl
                 border mb-3 transition-colors"
            [ngClass]="
              selectedLanguage() === 'zh'
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 bg-white'
            "
          >
            <div
              class="w-11 h-11 rounded-xl bg-red-50
                   flex items-center justify-center text-2xl"
            >
              🇨🇳
            </div>

            <div class="flex-1 text-left">
              <p class="font-semibold text-sm text-slate-800">中文</p>
              <p class="text-xs text-slate-500 mt-1">Mandarin</p>
            </div>

            @if (selectedLanguage() === 'zh') {
              <i class="pi pi-check-circle text-blue-600 text-lg"></i>
            }
          </button>

          <!-- Bahasa Malaysia -->
          <button
            type="button"
            (click)="changeLanguage('ms')"
            class="w-full flex items-center gap-3.5 p-4 rounded-2xl
                 border transition-colors"
            [ngClass]="
              selectedLanguage() === 'ms'
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 bg-white'
            "
          >
            <div
              class="w-11 h-11 rounded-xl bg-emerald-50
                   flex items-center justify-center text-2xl"
            >
              🇲🇾
            </div>

            <div class="flex-1 text-left">
              <p class="font-semibold text-sm text-slate-800">
                Bahasa Malaysia
              </p>
              <p class="text-xs text-slate-500 mt-1">Bahasa Melayu</p>
            </div>

            @if (selectedLanguage() === 'ms') {
              <i class="pi pi-check-circle text-blue-600 text-lg"></i>
            }
          </button>
        </div>
      </div>
    }
  `,

  styleUrl: './mobile-settings.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileSettings implements OnDestroy {
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly translate = inject(TranslateService);
  private readonly appConfigService = inject(AppConfigService);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly destroy$ = new Subject<void>();

  currentUser: LoginResponse | null = null;

  readonly appState = this.appConfigService.appState;

  isLanguageDialogOpen = signal(false);
  isLoggingOut = signal(false);
  isThemeDialogOpen = signal(false);

  selectedLanguage = signal<'en' | 'zh' | 'ms'>(
    (localStorage.getItem('language') as 'en' | 'zh' | 'ms') ?? 'en',
  );

  constructor() {
    this.currentUser = this.userService.currentUser;

    this.userService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.currentUser = user;
        this.cdr.markForCheck();
      });
  }

  get name(): string {
    return (
      this.currentUser?.displayName || this.currentUser?.fullName || 'User'
    );
  }

  get initials(): string {
    const name = this.currentUser?.fullName;

    if (!name) {
      return '';
    }

    return name
      .trim()
      .split(/\s+/)
      .filter((n) => n.length > 0)
      .slice(0, 2)
      .map((n) => n.charAt(0))
      .join('')
      .toUpperCase();
  }

  async LogOut(): Promise<void> {
    if (this.isLoggingOut()) return;

    this.isLoggingOut.set(true);

    // Small delay to show the signing-out animation.
    await new Promise((resolve) => setTimeout(resolve, 700));

    // Use AuthService to revoke refresh token and clear session.
    this.authService.logout();
  }

  changeLanguage(language: 'en' | 'zh' | 'ms'): void {
    this.selectedLanguage.set(language);

    this.translate.use(language);

    localStorage.setItem('language', language);

    this.isLanguageDialogOpen.set(false);
  }

  getLanguageName(): string {
    switch (this.selectedLanguage()) {
      case 'zh':
        return '中文';

      case 'ms':
        return 'Bahasa Malaysia';

      default:
        return 'English';
    }
  }

  toggleDarkMode(isDark: boolean): void {
    this.appConfigService.appState.update((state) => {
      if (!state) return state;

      return {
        ...state,
        darkTheme: isDark,
      };
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
