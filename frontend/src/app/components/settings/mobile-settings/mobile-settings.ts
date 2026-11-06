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
  template: `<div class="w-full min-h-[80vh] flex flex-col bg-gray-50">
      <div class="flex flex-col space-y-3 items-center justify-center py-5">
        <div
          class="border-2 inset-shadow-sm border-gray-200 relative w-25 h-25 rounded-full bg-gray-100 flex items-center justify-center"
        >
          <i class="pi pi-user text-4xl! text-gray-500!"></i>
          <div class="absolute -bottom-1 -right-1">
            <div
              class="flex items-center justify-center bg-blue-600 rounded-full h-7 w-7 border-2 border-white"
            >
              <i class="pi pi-pencil text-xs! text-white!"></i>
            </div>
          </div>
        </div>
        <div class="flex flex-col text-center gap-1">
          <div class="font-bold text-xl">{{ name }}</div>
          <span class="text-gray-500" translate>
            {{ currentUser?.jobTitle }}
          </span>
        </div>
      </div>
      <div class="flex flex-col gap-1 px-6 mt-2">
        <div class="uppercase text-gray-600 text-sm" translate>Account</div>
        <div class="bg-white rounded-lg border border-gray-300 my-2">
          <div
            [routerLink]="'/profile-settings/personal-info'"
            class="cursor-pointer flex flex-row items-center justify-between border-b border-gray-300 p-4"
          >
            <div class="flex flex-row items-center gap-4">
              <i class="pi pi-user"></i>
              <div translate>Personal Information</div>
            </div>
            <i class="pi pi-chevron-right text-gray-500!"></i>
          </div>
          <div
            class="flex flex-row items-center justify-between border-b border-gray-300 p-4"
            [routerLink]="'/change-password'"
          >
            <div class="flex flex-row items-center gap-4">
              <i class="pi pi-lock"></i>
              <div translate>Change Password</div>
            </div>
            <i class="pi pi-chevron-right text-gray-500!"></i>
          </div>
          <div class="flex flex-row items-center justify-between p-4">
            <div class="flex flex-row items-center gap-4">
              <i class="pi pi-bell"></i>
              <div translate>Notifications</div>
            </div>
            <i class="pi pi-chevron-right text-gray-500!"></i>
          </div>
        </div>
      </div>
      <div class="flex flex-col gap-1 px-6 mt-3">
        <div class="uppercase text-gray-600 text-sm" translate>Preferences</div>
        <div class="bg-white rounded-lg border border-gray-300 my-2">
          <div
            (click)="isLanguageDialogOpen.set(true)"
            class="cursor-pointer flex flex-row items-center justify-between
         border-b border-gray-300 p-4"
          >
            <div class="flex flex-row items-center gap-4">
              <i class="pi pi-language"></i>
              <div translate>Language</div>
            </div>

            <div class="flex flex-row items-center gap-2">
              <span class="text-blue-600">
                {{ getLanguageName() }}
              </span>

              <i class="pi pi-chevron-right text-gray-500!"></i>
            </div>
          </div>
          <div class="flex flex-row items-center justify-between p-4">
            <div class="flex flex-row items-center gap-4">
              <i class="pi pi-moon"></i>
              <div translate>Dark Mode</div>
            </div>
            <p-toggleswitch
              [ngModel]="appState()?.darkTheme ?? false"
              (ngModelChange)="toggleDarkMode($event)"
            ></p-toggleswitch>
          </div>
        </div>
      </div>
      <div class="flex flex-col gap-1 px-6 mt-3">
        <div class="uppercase text-gray-600 text-sm" translate>Support</div>
        <div class="bg-white rounded-lg border border-gray-300 my-2">
          <div
            class="flex flex-row items-center justify-between border-b border-gray-300 p-4"
          >
            <div class="flex flex-row items-center gap-4">
              <i class="pi pi-question-circle"></i>
              <div translate>Help Center</div>
            </div>
            <i class="pi pi-external-link text-gray-500!"></i>
          </div>
          <div
            class="flex flex-row items-center justify-between border-b border-gray-300 p-4"
          >
            <div class="flex flex-row items-center gap-4">
              <i class="pi pi-microchip"></i>
              <div translate>Report a bug</div>
            </div>
            <i class="pi pi-chevron-right text-gray-500!"></i>
          </div>
          <div class="flex flex-row items-center justify-between p-4">
            <div class="flex flex-row items-center gap-4">
              <i class="pi pi-file"></i>
              <div translate>Terms & Privacy</div>
            </div>
            <i class="pi pi-chevron-right text-gray-500!"></i>
          </div>
        </div>
        <p-button
          (onClick)="LogOut()"
          styleClass="w-full border-gray-200! py-3!"
          severity="secondary"
          [label]="'Sign Out' | translate"
          icon="pi pi-sign-out"
          class="my-4"
        ></p-button>
      </div>
    </div>

    @if (isLoggingOut()) {
      <div
        class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm
         flex items-center justify-center"
      >
        <div
          class="bg-white rounded-3xl px-8 py-7 flex flex-col
           items-center gap-4 shadow-2xl"
        >
          <i class="pi pi-spin pi-spinner text-4xl text-blue-600"></i>

          <div class="font-semibold" translate>Signing Out...</div>

          <div class="text-sm text-gray-500" translate>
            Please wait a moment
          </div>
        </div>
      </div>
    }

    @if (isLanguageDialogOpen()) {
      <div
        class="fixed inset-0 z-50 bg-black/40 flex items-end"
        (click)="isLanguageDialogOpen.set(false)"
      >
        <div
          class="w-full bg-white rounded-t-3xl px-6 pt-5 pb-8"
          (click)="$event.stopPropagation()"
        >
          <div class="flex items-center justify-between mb-5">
            <div class="text-xl font-semibold" translate>Language</div>

            <button
              type="button"
              class="border-none bg-transparent cursor-pointer"
              (click)="isLanguageDialogOpen.set(false)"
            >
              <i class="pi pi-times text-xl"></i>
            </button>
          </div>

          <div
            (click)="changeLanguage('en')"
            class="cursor-pointer flex items-center justify-between
               py-4 border-b border-gray-200"
          >
            <div class="flex items-center gap-3">
              <div class="text-xl">🇬🇧</div>

              <div class="flex flex-col">
                <span class="font-medium">English</span>
              </div>
            </div>

            @if (selectedLanguage() === 'en') {
              <i class="pi pi-check text-blue-600"></i>
            }
          </div>

          <div
            (click)="changeLanguage('zh')"
            class="cursor-pointer flex items-center justify-between
               py-4 border-b border-gray-200"
          >
            <div class="flex items-center gap-3">
              <div class="text-xl">🇨🇳</div>

              <div class="flex flex-col">
                <span class="font-medium">中文</span>
                <span class="text-sm text-gray-500">Mandarin</span>
              </div>
            </div>

            @if (selectedLanguage() === 'zh') {
              <i class="pi pi-check text-blue-600"></i>
            }
          </div>

          <div
            (click)="changeLanguage('ms')"
            class="cursor-pointer flex items-center justify-between py-4"
          >
            <div class="flex items-center gap-3">
              <div class="text-xl">🇲🇾</div>

              <div class="flex flex-col">
                <span class="font-medium">Bahasa Malaysia</span>
              </div>
            </div>

            @if (selectedLanguage() === 'ms') {
              <i class="pi pi-check text-blue-600"></i>
            }
          </div>
        </div>
      </div>
    } `,
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
