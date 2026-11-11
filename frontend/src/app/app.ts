import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
  PLATFORM_ID,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { SpinnerComponent } from './common/components/spinner/spinner.component';
import { ToastModule } from 'primeng/toast';
import { ConfirmPopupModule } from 'primeng/confirmpopup';

import {
  delay,
  Subject,
  take,
  takeUntil,
  distinctUntilChanged,
  catchError,
  switchMap,
  of,
} from 'rxjs';

import { LoadingService } from './services/loading.service';
import { NotificationService } from './services/notificationService.service';
import { AuthService } from './services/authService';
import { UserService } from './services/userService.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    SpinnerComponent,
    CommonModule,
    ToastModule,
    ConfirmPopupModule,
  ],
  templateUrl: './app.html',
  styleUrl: './app.less',
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('YLWorks');

  private readonly destroy$ = new Subject<void>();

  private readonly platformId = inject(PLATFORM_ID);

  private readonly notificationService = inject(NotificationService);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly loadingService = inject(LoadingService);
  private readonly translate = inject(TranslateService);

  isSpinning$ = this.loadingService.isLoading$.pipe(delay(0));

  ngOnInit(): void {
    this.initializeLanguage();
    this.initializeAuthentication();
    this.initializeNotifications();
  }

  private initializeLanguage(): void {
    const savedLanguage = isPlatformBrowser(this.platformId)
      ? localStorage.getItem('language')
      : null;

    const language: 'en' | 'zh' | 'ms' =
      savedLanguage === 'ms' || savedLanguage === 'zh' ? savedLanguage : 'en';

    this.translate.setFallbackLang('en');
    this.translate.use(language);
  }

  private initializeAuthentication(): void {
    this.authService
      .initAuth()
      .pipe(
        take(1),
        catchError((error) => {
          console.error('Authentication initialization failed:', error);
          return of(null);
        }),
        switchMap(() =>
          this.userService.currentUser$.pipe(
            distinctUntilChanged(
              (previous, current) => previous?.userId === current?.userId,
            ),
          ),
        ),
        takeUntil(this.destroy$),
      )
      .subscribe((user) => {
        this.notificationService.setUser(user?.userId ?? null);
      });
  }

  private initializeNotifications(): void {
    this.notificationService.message$
      .pipe(takeUntil(this.destroy$))
      .subscribe((msg) => {
        if (msg) {
          console.log('New message:', msg);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    this.notificationService.setUser(null);
  }
}
