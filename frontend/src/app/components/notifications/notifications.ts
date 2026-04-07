import { CommonModule, Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { LoadingService } from '../../services/loading.service';
import { of, Subject, switchMap, takeUntil } from 'rxjs';
import { NotificationDto } from '../../models/Notifications';
import { UserService } from '../../services/userService.service';
import { NotificationService } from '../../services/notificationService.service';

@Component({
  selector: 'app-notifications',
  imports: [CommonModule],
  template: `<div
    class="relative w-full min-h-screen bg-cover bg-center flex items-center justify-center bg-gray-100"
  >
    <div class="relative w-full min-h-screen flex flex-col">
      <div
        class="flex flex-row items-center justify-between p-3 py-5 border border-white/10 shadow-md"
      >
        <div (click)="CloseNotification()">
          <svg
            class="w-6 h-6 text-gray-500"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M14.5 8.046H11V6.119c0-.921-.9-1.446-1.524-.894l-5.108 4.49a1.2 1.2 0 0 0 0 1.739l5.108 4.49c.624.556 1.524.027 1.524-.893v-1.928h2a3.023 3.023 0 0 1 3 3.046V19a5.593 5.593 0 0 0-1.5-10.954Z"
            />
          </svg>
        </div>
        <div class="tracking-widest">Notifications</div>
        <div></div>
      </div>
      <div class="flex flex-col gap-3 mt-3 p-3" *ngIf="notificationsList">
        <ng-container *ngFor="let notification of notificationsList">
          <div
            class="rounded shadow-md p-2 py-3"
            [ngClass]="!notification.isRead ? 'bg-gray-100' : 'bg-white'"
          >
            <div class="text-gray-900">{{ notification.message }}</div>
            <div class="text-right text-gray-500 text-xs pt-1 font-thin">
              ~ {{ notification.createdAt | date: 'dd/MM/yyyy hh:mm:ss a' }}
            </div>
          </div>
        </ng-container>
      </div>
      <div
        class="flex flex-col gap-3 justify-center items-center mt-6"
        *ngIf="notificationsList?.length === 0"
      >
        <div><img src="assets/no-spam.png" alt="" class="w-[70px]" /></div>
        <div class="text-xl tracking-widest">No notification yet :(</div>
        <div
          class="px-10 text-center text-white/70 tracking-widest font-thin text-sm"
        >
          Your notification will appear here once you've received them.
        </div>
      </div>
    </div>
  </div>`,
  styleUrl: './notifications.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Notifications implements OnInit, OnDestroy {
  private readonly notificationService = inject(NotificationService);
  private readonly loadingService = inject(LoadingService);
  private readonly userService = inject(UserService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly location = inject(Location);

  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  notificationsList: NotificationDto[] | null = null;
  userId: string | null = null;

  ngOnInit(): void {
    this.userId = this.userService.currentUser?.userId ?? null;
    if (!this.userId) return;

    this.notificationService.message$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((data: any) => {
        if (!data) return;

        const payload = typeof data === 'string' ? JSON.parse(data) : data;
        if (payload.userId === this.userId) {
          console.log('📢 SignalR update:', payload);
          this.refreshNotifications(); // Refresh notifications automatically
        }
      });
    // Load initial notifications
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.loadingService.start();

    this.notificationService
      .GetNotifications(this.userId ?? '')
      .pipe(
        takeUntil(this.ngUnsubscribe),
        switchMap((res) => {
          this.notificationsList = res;
          this.cdr.markForCheck();
          const unreadCount = res.filter((n) => !n.isRead).length;
          if (this.userId && unreadCount > 0) {
            return this.notificationService.MarkAllAsRead(this.userId);
          }
          return of(null);
        }),
      )
      .subscribe({
        next: () => this.loadingService.stop(),
        error: () => this.loadingService.stop(),
      });
  }

  private refreshNotifications(): void {
    if (!this.userId) return;

    this.notificationService
      .GetNotifications(this.userId)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res: NotificationDto[]) => {
          this.notificationsList = res;
          this.cdr.markForCheck();
        },
        error: (err) => console.error(err),
      });
  }

  CloseNotification() {
    this.location.back();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
    this.notificationService.stopConnection(); // Clean disconnect
  }
}
