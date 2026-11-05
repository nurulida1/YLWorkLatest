import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { SpinnerComponent } from './common/components/spinner/spinner.component';
import { ToastModule } from 'primeng/toast';
import { ConfirmPopupModule } from 'primeng/confirmpopup';

import { delay, Subject, take, takeUntil, distinctUntilChanged } from 'rxjs';

import { LoadingService } from './services/loading.service';
import { NotificationService } from './services/notificationService.service';
import { AuthService } from './services/authService';
import { UserService } from './services/userService.service';

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

  private readonly notificationService = inject(NotificationService);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly loadingService = inject(LoadingService);

  isSpinning$ = this.loadingService.isLoading$.pipe(delay(0));

  ngOnInit(): void {
    // Initialize authentication first.
    // This also ensures expired tokens are refreshed before
    // starting the notification connection.
    this.authService
      .initAuth()
      .pipe(take(1))
      .subscribe({
        next: () => {
          // Listen for login/logout/account changes.
          this.userService.currentUser$
            .pipe(
              distinctUntilChanged(
                (previous, current) => previous?.userId === current?.userId,
              ),
              takeUntil(this.destroy$),
            )
            .subscribe((user) => {
              const userId = user?.userId ?? null;

              console.log('Notification account changed:', userId);

              this.notificationService.setUser(userId);
            });
        },
        error: (error) => {
          console.error('Authentication initialization failed:', error);

          this.notificationService.setUser(null);
        },
      });

    // Optional: listen globally for new notifications.
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
