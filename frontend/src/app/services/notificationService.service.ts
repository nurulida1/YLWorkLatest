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
import { environment } from '../../environments/environment.development';
import { HttpClient, HttpParams } from '@angular/common/http';
import { NotificationDto } from '../models/Notifications';
import { BaseResponse } from '../shared/helpers/helpers';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private hubConnection!: signalR.HubConnection;

  private messageSource = new BehaviorSubject<NotificationDto | null>(null);
  public message$ = this.messageSource.asObservable();

  private _unreadCount$ = new BehaviorSubject<number>(0);
  unreadCount$ = this._unreadCount$.asObservable();

  private isConnected: boolean = false;

  private notificationsLoaded = false;
  private _notifications$ = new BehaviorSubject<NotificationDto[]>([]);
  public notifications$ = this._notifications$.asObservable();

  url = environment.ApiBaseUrl + '/Notification';
  private readonly baseUrl = 'http://192.168.1.79:5000/hubs/notifications';

  constructor(
    private zone: NgZone,
    private http: HttpClient,
    private messageService: MessageService,
  ) {}

  startConnection() {
    if (this.isConnected) return;

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(this.baseUrl, {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection
      .start()
      .then(() => {
        this.isConnected = true;
        console.log('✅ SignalR Connected');
        this.listenForUpdates();
      })
      .catch((err) => console.error('❌ SignalR Connection Error:', err));
  }

  stopConnection() {
    if (this.hubConnection && this.isConnected) {
      this.hubConnection.stop().then(() => {
        this.isConnected = false;
        console.log('🔌 SignalR Disconnected');
      });
    }
  }

  private listenForUpdates() {
    this.hubConnection.on(
      'ReceiveNotification',
      (notification: NotificationDto) => {
        this.zone.run(() => {
          console.log('📢 New notification:', notification);

          const current = this._notifications$.value;
          const exists = current.some((x) => x.id === notification.id);

          if (!exists) {
            this._notifications$.next([notification, ...current]);
          }

          if (!notification.isRead) {
            this._unreadCount$.next(
              this._unreadCount$.value + (exists ? 0 : 1),
            );
          }

          this.messageSource.next(notification);
        });
      },
    );

    this.hubConnection.on('UpdateUnreadCount', (data: any) => {
      this.zone.run(() => {
        this._unreadCount$.next(data.unreadCount);
      });
    });
  }

  loadUnreadCount(userId: string | undefined) {
    const params: any = {};
    if (userId) params.userId = userId;

    this.http
      .get<{ unreadCount: number }>(`${this.url}/UnreadCount`, { params })
      .subscribe((res) => {
        this._unreadCount$.next(res.unreadCount);
      });
  }

  refreshUnreadCount(): void {
    this.UnreadCount()
      .pipe(take(1))
      .subscribe((res) => {
        if (res.success) {
          this._unreadCount$.next(res.unreadCount);
        }
      });
  }

  GetNotifications(): Observable<NotificationDto[]> {
    if (this.notificationsLoaded) {
      return of(this._notifications$.value);
    }

    return this.http.get<NotificationDto[]>(this.url).pipe(
      retry(1),
      tap((res) => {
        this._notifications$.next(res);
        this.notificationsLoaded = true;
      }),
      catchError(this.handleError('GetNotifications')),
    );
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

  MarkAllAsRead(): Observable<{ success: boolean; unreadCount?: number }> {
    return this.http
      .put<{
        success: boolean;
        unreadCount?: number;
      }>(`${this.url}/MarkAllRead`, {})
      .pipe(
        retry(1),
        tap(() => {
          // Update all notifications in shared state.
          const updatedNotifications = this._notifications$.value.map(
            (notification) => ({
              ...notification,
              isRead: true,
            }),
          );

          this._notifications$.next(updatedNotifications);

          // Update navbar unread count.
          this._unreadCount$.next(0);
        }),
        catchError(this.handleError('MarkAllAsRead')),
      );
  }

  UnreadCount(): Observable<{ success: boolean; unreadCount: number }> {
    return this.http
      .get<{ success: boolean; unreadCount: number }>(`${this.url}/UnreadCount`)
      .pipe(retry(1), catchError(this.handleError('UnreadCount')));
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
