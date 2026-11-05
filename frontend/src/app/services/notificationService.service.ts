import { Injectable, NgZone } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  Observable,
  of,
  retry,
  take,
  tap,
  throwError,
} from 'rxjs';

import * as signalR from '@microsoft/signalr';
import { HttpClient, HttpParams } from '@angular/common/http';

import { environment } from '../../environments/environment.development';
import { NotificationDto } from '../models/Notifications';
import { BaseResponse } from '../shared/helpers/helpers';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private hubConnection: signalR.HubConnection | null = null;

  private activeUserId: string | null = null;
  private userVersion = 0;

  private messageSource = new BehaviorSubject<NotificationDto | null>(null);
  readonly message$ = this.messageSource.asObservable();

  private _unreadCount$ = new BehaviorSubject<number>(0);
  readonly unreadCount$ = this._unreadCount$.asObservable();

  private _notifications$ = new BehaviorSubject<NotificationDto[]>([]);
  readonly notifications$ = this._notifications$.asObservable();

  url = environment.ApiBaseUrl + '/Notification';

  private readonly baseUrl = 'http://192.168.1.79:5000/hubs/notifications';

  constructor(
    private zone: NgZone,
    private http: HttpClient,
    private messageService: MessageService,
  ) {}

  // ==========================================
  // USER / ACCOUNT MANAGEMENT
  // ==========================================

  /**
   * Call this whenever the authenticated user changes.
   * Passing null logs out the notification connection.
   */
  setUser(userId: string | null): void {
    if (this.activeUserId === userId) {
      return;
    }

    this.activeUserId = userId;
    const version = ++this.userVersion;

    // Immediately clear the previous account's notification data.
    this.clearNotificationState();

    // Stop the old SignalR connection before connecting the new user.
    void this.switchUser(userId, version);
  }

  private async switchUser(
    userId: string | null,
    version: number,
  ): Promise<void> {
    await this.stopConnection();

    // Another account change happened while disconnecting.
    if (version !== this.userVersion) {
      return;
    }

    // Logged out. Nothing else to do.
    if (!userId) {
      return;
    }

    // Load notifications for the newly authenticated user.
    this.loadNotificationsForUser(version);
    this.loadUnreadCountForUser(version);

    // Start SignalR using the latest user's JWT.
    await this.startConnection(version);
  }

  private clearNotificationState(): void {
    this._notifications$.next([]);
    this._unreadCount$.next(0);
    this.messageSource.next(null);
  }

  // ==========================================
  // SIGNALR CONNECTION
  // ==========================================

  private async startConnection(version: number): Promise<void> {
    if (!this.activeUserId || version !== this.userVersion) {
      return;
    }

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(this.baseUrl, {
        accessTokenFactory: () => {
          return this.getAccessToken();
        },
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection = connection;

    this.listenForUpdates(connection, version);

    connection.onreconnecting((error) => {
      console.warn('SignalR reconnecting:', error);
    });

    connection.onreconnected((connectionId) => {
      console.log('SignalR reconnected:', connectionId);
    });

    connection.onclose((error) => {
      if (this.hubConnection === connection) {
        console.log('SignalR connection closed:', error);
      }
    });

    try {
      await connection.start();

      // Prevent an old connection from remaining active.
      if (version !== this.userVersion) {
        await connection.stop();
        return;
      }

      console.log(`SignalR connected for user: ${this.activeUserId}`);
    } catch (error) {
      console.error('SignalR connection error:', error);
    }
  }

  private async stopConnection(): Promise<void> {
    const connection = this.hubConnection;

    // Remove the reference immediately so old events are ignored.
    this.hubConnection = null;

    if (
      connection &&
      connection.state !== signalR.HubConnectionState.Disconnected
    ) {
      try {
        await connection.stop();
        console.log('SignalR disconnected');
      } catch (error) {
        console.error('SignalR disconnect error:', error);
      }
    }
  }

  /**
   * Read the current token each time SignalR requests it.
   */
  private getAccessToken(): string {
    return (
      localStorage.getItem('jwtToken') ??
      sessionStorage.getItem('jwtToken') ??
      ''
    );
  }

  private listenForUpdates(
    connection: signalR.HubConnection,
    version: number,
  ): void {
    connection.on('ReceiveNotification', (notification: NotificationDto) => {
      this.zone.run(() => {
        // Ignore notifications from an old account/connection.
        if (version !== this.userVersion || this.hubConnection !== connection) {
          return;
        }

        console.log('New notification:', notification);

        const current = this._notifications$.value;

        const exists = current.some((x) => x.id === notification.id);

        if (!exists) {
          this._notifications$.next([notification, ...current]);

          if (!notification.isRead) {
            this._unreadCount$.next(this._unreadCount$.value + 1);
          }
        }

        this.messageSource.next(notification);
      });
    });

    connection.on('UpdateUnreadCount', (data: any) => {
      this.zone.run(() => {
        if (version !== this.userVersion || this.hubConnection !== connection) {
          return;
        }

        this._unreadCount$.next(Number(data?.unreadCount ?? 0));
      });
    });
  }

  // ==========================================
  // LOAD NOTIFICATIONS
  // ==========================================

  private loadNotificationsForUser(version: number): void {
    this.GetNotifications()
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          if (version !== this.userVersion) {
            return;
          }

          this._notifications$.next(res);
        },
        error: (err) => {
          console.error('Failed to load notifications:', err);
        },
      });
  }

  private loadUnreadCountForUser(version: number): void {
    this.UnreadCount()
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          if (version !== this.userVersion) {
            return;
          }

          if (res.success) {
            this._unreadCount$.next(res.unreadCount);
          }
        },
        error: (err) => {
          console.error('Failed to load unread count:', err);
        },
      });
  }

  GetNotifications(): Observable<NotificationDto[]> {
    // Always request notifications for the current authenticated user.
    // No global notificationsLoaded cache.
    return this.http
      .get<NotificationDto[]>(this.url)
      .pipe(retry(1), catchError(this.handleError('GetNotifications')));
  }

  RefreshNotifications(userId: number): void {
    const params = new HttpParams().set('userId', userId.toString());

    this.http
      .get<NotificationDto[]>(`${this.url}/GetAll`, { params })
      .pipe(
        retry(1),
        tap((res) => this._notifications$.next(res)),
        catchError(this.handleError('RefreshNotifications')),
      )
      .subscribe();
  }

  // ==========================================
  // UNREAD COUNT
  // ==========================================

  loadUnreadCount(userId: string | undefined): void {
    const params: any = {};

    if (userId) {
      params.userId = userId;
    }

    this.http
      .get<{ unreadCount: number }>(`${this.url}/UnreadCount`, { params })
      .subscribe({
        next: (res) => {
          this._unreadCount$.next(res.unreadCount);
        },
        error: (err) => {
          console.error('Failed to load unread count:', err);
        },
      });
  }

  refreshUnreadCount(): void {
    this.UnreadCount()
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this._unreadCount$.next(res.unreadCount);
          }
        },
        error: (err) => {
          console.error('Failed to refresh unread count:', err);
        },
      });
  }

  UnreadCount(): Observable<{
    success: boolean;
    unreadCount: number;
  }> {
    return this.http
      .get<{
        success: boolean;
        unreadCount: number;
      }>(`${this.url}/UnreadCount`)
      .pipe(retry(1), catchError(this.handleError('UnreadCount')));
  }

  // ==========================================
  // MARK AS READ
  // ==========================================

  MarkAllAsRead(): Observable<{
    success: boolean;
    unreadCount?: number;
  }> {
    return this.http
      .put<{
        success: boolean;
        unreadCount?: number;
      }>(`${this.url}/MarkAllRead`, {})
      .pipe(
        retry(1),
        tap(() => {
          const updatedNotifications = this._notifications$.value.map(
            (notification) => ({
              ...notification,
              isRead: true,
            }),
          );

          this._notifications$.next(updatedNotifications);
          this._unreadCount$.next(0);
        }),
        catchError(this.handleError('MarkAllAsRead')),
      );
  }

  MarkRead(id: string): Observable<BaseResponse> {
    const params = new HttpParams().set('id', id);

    return this.http
      .put<BaseResponse>(`${this.url}/MarkRead`, {}, { params })
      .pipe(
        retry(1),
        tap(() => {
          const current = this._notifications$.value;

          const notification = current.find((x) => x.id === id);

          if (notification && !notification.isRead) {
            this._notifications$.next(
              current.map((x) => (x.id === id ? { ...x, isRead: true } : x)),
            );

            this._unreadCount$.next(Math.max(0, this._unreadCount$.value - 1));
          }
        }),
        catchError(this.handleError('MarkRead')),
      );
  }

  // ==========================================
  // ERROR HANDLING
  // ==========================================

  private handleError = (context: string) => (error: any) => {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail:
        error?.error?.detail || error?.message || 'Unexpected error occurred.',
    });

    return throwError(() => error);
  };
}
