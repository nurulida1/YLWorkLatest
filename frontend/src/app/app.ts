import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SpinnerComponent } from './common/components/spinner/spinner.component';
import { ToastModule } from 'primeng/toast';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { delay, Subscription } from 'rxjs';
import { LoadingService } from './services/loading.service';
import { NotificationService } from './services/notificationService.service';
import { AuthService } from './services/authService';

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
  private sub!: Subscription;

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService,
  ) {}

  isSpinning$ = inject(LoadingService).isLoading$.pipe(delay(0));

  ngOnInit() {
    this.authService.initAuth(); // 👈 IMPORTANT

    this.notificationService.startConnection();

    // optional: listen globally for any notifications
    this.sub = this.notificationService.message$.subscribe((msg) => {
      if (msg) console.log('🔔 New message:', msg);
    });
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
    this.notificationService.stopConnection();
  }
}
