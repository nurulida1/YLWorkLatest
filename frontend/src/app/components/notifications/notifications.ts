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

  template: `
    <div class="min-h-screen bg-[#F8FAFC]">
      <!-- Header -->
      <div class="bg-white border-b border-gray-200 md:hidden block">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16 sm:h-20">
            <div class="flex items-center gap-3">
              <button
                type="button"
                (click)="CloseNotification()"
                aria-label="Go back"
                class="w-10 h-10 flex items-center justify-center rounded-xl
                     text-gray-500 hover:text-[#2148BC] hover:bg-blue-50
                     transition-all cursor-pointer border-0 bg-transparent"
              >
                <i class="pi pi-arrow-left text-lg"></i>
              </button>

              <div>
                <h1 class="text-lg sm:text-xl font-bold text-gray-900 m-0">
                  Notifications
                </h1>
                <p class="text-xs sm:text-sm text-gray-500 mt-0.5 mb-0">
                  Stay updated with your latest activities
                </p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <div
                class="flex items-center gap-2 px-3 py-2 rounded-xl
                     bg-blue-50 text-[#2148BC]"
              >
                <i class="pi pi-bell text-sm"></i>
                <span class="text-xs sm:text-sm font-semibold">
                  {{ notificationsList.length }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
        <!-- Page Heading -->
        <div class="mb-5 sm:mb-6">
          <div
            class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          >
            <div>
              <h2 class="text-base sm:text-xl font-bold text-gray-800 m-0">
                Notifications
              </h2>

              <p class="text-xs sm:text-sm text-gray-500 mt-1 mb-0">
                Stay updated with your latest activities.
              </p>
            </div>

            <div class="flex items-center justify-between sm:justify-end gap-3">
              <span class="text-xs text-gray-400 font-medium whitespace-nowrap">
                {{ notificationsList.length }} notifications
                <span class="text-blue-700"> ({{ unreadCount }} unread) </span>
              </span>

              @if (unreadCount > 0) {
                <button
                  type="button"
                  (click)="MarkAllAsRead()"
                  [disabled]="markingAllAsRead"
                  class="inline-flex items-center justify-center gap-2 px-3 py-2
                 text-xs font-semibold text-blue-700 bg-blue-50
                 hover:bg-blue-100 rounded-lg transition-colors
                 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i
                    class="pi"
                    [ngClass]="
                      markingAllAsRead
                        ? 'pi-spin pi-spinner'
                        : 'pi-check-double'
                    "
                  ></i>

                  {{ markingAllAsRead ? 'Marking...' : 'Mark all as read' }}
                </button>
              }
            </div>
          </div>
        </div>

        <!-- Notification List -->
        <div
          *ngIf="notificationsList.length > 0; else emptyState"
          class="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
        >
          <div
            *ngFor="let notification of notificationsList; let last = last"
            class="relative flex gap-3 sm:gap-4 p-4 sm:p-5
                 transition-colors hover:bg-gray-50/70"
            [ngClass]="!last ? 'border-b border-gray-100' : ''"
            [ngClass]="!notification.isRead ? 'bg-blue-50/40' : 'bg-white'"
          >
            <!-- Notification Icon -->
            <div
              class="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl
                   flex items-center justify-center"
              [ngClass]="
                !notification.isRead
                  ? 'bg-blue-100 text-[#2148BC]'
                  : 'bg-gray-100 text-gray-500'
              "
            >
              <i class="pi pi-bell text-base sm:text-lg"></i>
            </div>

            <!-- Notification Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0 flex-1">
                  <p
                    class="text-sm sm:text-base leading-relaxed m-0"
                    [ngClass]="
                      !notification.isRead
                        ? 'text-gray-900 font-semibold'
                        : 'text-gray-700 font-medium'
                    "
                  >
                    {{ notification.message }}
                  </p>

                  <div class="flex items-center gap-2 mt-2">
                    <i class="pi pi-clock text-[11px]! text-gray-400"></i>
                    <span class="text-[11px] sm:text-xs text-gray-400">
                      {{
                        notification.createdAt | date: 'dd MMM yyyy, hh:mm a'
                      }}
                    </span>
                  </div>
                </div>

                <!-- Unread Indicator -->
                <div
                  *ngIf="!notification.isRead"
                  class="shrink-0 flex items-center gap-1.5
                       px-2 py-1 rounded-full bg-blue-100"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-[#2148BC]"></span>
                  <span class="text-[10px] font-bold text-[#2148BC]">
                    NEW
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <ng-template #emptyState>
          <div
            class="bg-white border border-gray-200 rounded-2xl shadow-sm
                 min-h-[350px] sm:min-h-[420px]
                 flex flex-col items-center justify-center
                 text-center px-6 py-12"
          >
            <div
              class="w-20 h-20 sm:w-24 sm:h-24 rounded-full
                   bg-blue-50 flex items-center justify-center mb-5"
            >
              <i
                class="pi pi-bell-slash text-3xl sm:text-4xl text-[#2148BC]"
              ></i>
            </div>

            <h3 class="text-lg sm:text-xl font-bold text-gray-800 m-0">
              You're all caught up!
            </h3>

            <p
              class="text-sm text-gray-500 mt-2 mb-0
                   max-w-sm leading-relaxed"
            >
              You don't have any notifications right now. We'll let you know
              when there's something new.
            </p>
          </div>
        </ng-template>

        <!-- Footer -->
        <div class="text-center mt-6">
          <p class="text-[11px] sm:text-xs text-gray-400 m-0">
            YL Works · Notification Centre
          </p>
        </div>
      </div>
    </div>
  `,
  styleUrl: './notifications.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Notifications implements OnInit, OnDestroy {
  private readonly notificationService = inject(NotificationService);
  private readonly loadingService = inject(LoadingService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly location = inject(Location);

  private destroy$ = new Subject<void>();

  notificationsList: NotificationDto[] = [];
  markingAllAsRead: boolean = false;

  ngOnInit(): void {
    this.loadNotifications();

    this.notificationService.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe((notifications) => {
        this.notificationsList = notifications;
        this.cdr.markForCheck();
      });
  }

  loadNotifications(): void {
    this.loadingService.start();

    this.notificationService
      .GetNotifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: NotificationDto[]) => {
          this.notificationsList = res;
          this.cdr.markForCheck();
          this.loadingService.stop();
        },
        error: (err) => {
          console.error('Failed to load notifications:', err);
          this.loadingService.stop();
        },
      });
  }

  CloseNotification(): void {
    this.location.back();
  }

  get unreadCount(): number {
    return this.notificationsList.filter((notification) => !notification.isRead)
      .length;
  }

  MarkAllAsRead(): void {
    if (this.unreadCount === 0 || this.markingAllAsRead) {
      return;
    }

    this.markingAllAsRead = true;
    this.loadingService.start();

    this.notificationService
      .MarkAllAsRead()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.markingAllAsRead = false;
          this.loadingService.stop();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Failed to mark all notifications as read:', err);

          this.markingAllAsRead = false;
          this.loadingService.stop();

          this.cdr.markForCheck();
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.loadingService.stop();

    // Do not stop the shared SignalR connection here.
  }
}
