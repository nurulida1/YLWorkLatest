import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { Subject, takeUntil } from 'rxjs';
import { finalize } from 'rxjs/operators';
import {
  LeaveCalendarSyncService,
  LeaveCalendarSyncStatusDto,
} from '../../../services/leave-calendar-sync.service';
import { LoadingService } from '../../../services/loading.service';

@Component({
  selector: 'app-leave-calendar-sync-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, ButtonModule],
  template: `
    <div class="w-full min-h-screen bg-[#f4f6f8] p-6">
      <div class="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
        <a routerLink="/dashboard" class="hover:text-blue-600">Dashboard</a>
        <span>/</span>
        <span class="text-gray-700 font-semibold">Leave calendar sync</span>
      </div>

      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900 m-0">Leave calendar sync</h1>
        <p class="text-sm text-gray-500 mt-1 m-0 max-w-3xl">
          Connect Google (push) and/or Outlook desktop (ICS subscribe) to see company-wide approved leave.
          Medical leave appears as “On leave” only.
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-5xl">
        <!-- Google -->
        <div class="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-4">
          <div class="flex items-start gap-3">
            <div
              class="w-15 h-15 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center shrink-0"
            >
              <img
                src="assets/icon-google-calendar.svg"
                alt="Google Calendar"
                class="w-13 h-13"
              />
            </div>
            <div class="min-w-0 flex-1">
              <h2 class="text-base font-semibold text-gray-900 m-0">Google Calendar</h2>
              @if (status?.googleConnected) {
                <p class="text-sm text-green-700 m-0 mt-1">Connected as {{ status?.googleAccountEmail }}</p>
                @if (status?.lastSyncAtUtc) {
                  <p class="text-xs text-gray-500 m-0 mt-1">
                    Last sync: {{ status?.lastSyncAtUtc | date: 'medium' }}
                  </p>
                }
                @if (status?.lastError) {
                  <p class="text-xs text-red-600 m-0 mt-1">{{ status?.lastError }}</p>
                }
              } @else {
                <p class="text-sm text-gray-500 m-0 mt-1">Not connected</p>
              }
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            @if (status?.googleConnected) {
              <p-button
                label="Resync"
                icon="pi pi-refresh"
                severity="secondary"
                [outlined]="true"
                (onClick)="resyncGoogle()"
                [loading]="resyncingGoogle"
              />
              <p-button
                label="Disconnect"
                icon="pi pi-times"
                severity="danger"
                [outlined]="true"
                (onClick)="disconnectGoogle()"
                [loading]="disconnectingGoogle"
              />
            } @else {
              <p-button
                label="Connect Google Calendar"
                icon="pi pi-google"
                (onClick)="connectGoogle()"
                [loading]="connectingGoogle"
              />
            }
          </div>

          <div class="text-xs text-gray-500 border-t border-gray-100 pt-4 mt-auto">
            <p class="m-0 mb-1">Creates “YLWork Company Leave” in your Google account.</p>
            <p class="m-0">Approved leave is pushed near real-time on approve/cancel.</p>
          </div>
        </div>

        <!-- Outlook ICS -->
        <div class="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-4">
          <div class="flex items-start gap-3">
            <div
              class="w-15 h-15 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0"
            >
              <img
                src="assets/icon-outlook.svg"
                alt="Outlook"
                class="w-13 h-13"
              />
            </div>
            <div class="min-w-0 flex-1">
              <h2 class="text-base font-semibold text-gray-900 m-0">Outlook (ICS subscribe)</h2>
              @if (status?.outlookConnected) {
                <p class="text-sm text-green-700 m-0 mt-1">Feed enabled</p>
                @if (status?.outlookLastAccessedAtUtc) {
                  <p class="text-xs text-gray-500 m-0 mt-1">
                    Last fetched: {{ status?.outlookLastAccessedAtUtc | date: 'medium' }}
                  </p>
                }
              } @else {
                <p class="text-sm text-gray-500 m-0 mt-1">Not enabled</p>
              }
            </div>
          </div>

          @if (status?.outlookConnected && status?.outlookFeedUrl) {
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <label class="block text-xs text-gray-500 mb-1">Subscribe URL</label>
              <p class="text-xs text-gray-800 break-all m-0 font-mono">{{ status?.outlookFeedUrl }}</p>
            </div>
          }

          <div class="flex flex-wrap gap-2">
            @if (status?.outlookConnected) {
              <p-button
                label="Copy URL"
                icon="pi pi-copy"
                severity="secondary"
                [outlined]="true"
                (onClick)="copyOutlookUrl()"
                [disabled]="!status?.outlookFeedUrl"
              />
              <p-button
                label="Rotate URL"
                icon="pi pi-refresh"
                severity="secondary"
                [outlined]="true"
                (onClick)="rotateOutlook()"
                [loading]="rotatingOutlook"
              />
              <p-button
                label="Disable"
                icon="pi pi-times"
                severity="danger"
                [outlined]="true"
                (onClick)="disableOutlook()"
                [loading]="disablingOutlook"
              />
            } @else {
              <p-button
                label="Enable Outlook feed"
                icon="pi pi-calendar"
                (onClick)="enableOutlook()"
                [loading]="enablingOutlook"
              />
            }
          </div>

          <div class="text-xs text-gray-500 border-t border-gray-100 pt-4 mt-auto space-y-1">
            <p class="m-0 font-medium text-gray-600">Outlook desktop setup</p>
            <p class="m-0">1. Enable feed and copy the URL</p>
            <p class="m-0">2. Outlook → Add calendar → From Internet → paste URL</p>
            <p class="m-0">
              Updates appear when Outlook refreshes the subscription (often 30+ minutes — not instant).
            </p>
            <p class="m-0">
              For IMAP mailboxes, ICS subscribe is used (Microsoft Graph push requires Microsoft 365).
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class LeaveCalendarSyncSettings implements OnInit, OnDestroy {
  private readonly syncService = inject(LeaveCalendarSyncService);
  private readonly loading = inject(LoadingService);
  private readonly messages = inject(MessageService);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  status: LeaveCalendarSyncStatusDto | null = null;
  connectingGoogle = false;
  disconnectingGoogle = false;
  resyncingGoogle = false;
  enablingOutlook = false;
  rotatingOutlook = false;
  disablingOutlook = false;

  ngOnInit(): void {
    this.handleQueryParams();
    this.loadStatus();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  connectGoogle(): void {
    this.connectingGoogle = true;
    this.syncService
      .getGoogleConnectUrl()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.connectingGoogle = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (url) => {
          if (!url) {
            this.messages.add({
              severity: 'error',
              summary: 'Connect failed',
              detail: 'Google Calendar OAuth is not configured on the server.',
            });
            return;
          }
          window.location.href = url;
        },
        error: (err) => {
          this.messages.add({
            severity: 'error',
            summary: 'Connect failed',
            detail: err?.error?.message ?? 'Could not start Google sign-in.',
          });
        },
      });
  }

  disconnectGoogle(): void {
    this.disconnectingGoogle = true;
    this.syncService
      .disconnectGoogle()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.disconnectingGoogle = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.messages.add({ severity: 'success', summary: 'Disconnected', detail: 'Google Calendar removed.' });
          this.loadStatus();
        },
        error: (err) => {
          this.messages.add({
            severity: 'error',
            summary: 'Disconnect failed',
            detail: err?.error?.message ?? 'Could not disconnect.',
          });
        },
      });
  }

  resyncGoogle(): void {
    this.resyncingGoogle = true;
    this.syncService
      .resyncGoogle()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.resyncingGoogle = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.messages.add({ severity: 'success', summary: 'Resync', detail: 'Leave events refreshed.' });
          this.loadStatus();
        },
        error: (err) => {
          this.messages.add({
            severity: 'error',
            summary: 'Resync failed',
            detail: err?.error?.message ?? 'Could not resync.',
          });
        },
      });
  }

  enableOutlook(): void {
    this.enablingOutlook = true;
    this.syncService
      .enableOutlookIcs()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.enablingOutlook = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (res) => {
          this.messages.add({
            severity: 'success',
            summary: 'Outlook feed enabled',
            detail: res.message || 'Copy the URL into Outlook.',
          });
          this.loadStatus();
        },
        error: (err) => {
          this.messages.add({
            severity: 'error',
            summary: 'Enable failed',
            detail: err?.error?.message ?? 'Could not enable Outlook feed.',
          });
        },
      });
  }

  rotateOutlook(): void {
    this.rotatingOutlook = true;
    this.syncService
      .rotateOutlookIcs()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.rotatingOutlook = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (res) => {
          this.messages.add({
            severity: 'success',
            summary: 'URL rotated',
            detail: res.message || 'Update the subscription in Outlook.',
          });
          this.loadStatus();
        },
        error: (err) => {
          this.messages.add({
            severity: 'error',
            summary: 'Rotate failed',
            detail: err?.error?.message ?? 'Could not rotate feed URL.',
          });
        },
      });
  }

  disableOutlook(): void {
    this.disablingOutlook = true;
    this.syncService
      .disableOutlookIcs()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.disablingOutlook = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.messages.add({
            severity: 'success',
            summary: 'Disabled',
            detail: 'Outlook ICS feed disabled.',
          });
          this.loadStatus();
        },
        error: (err) => {
          this.messages.add({
            severity: 'error',
            summary: 'Disable failed',
            detail: err?.error?.message ?? 'Could not disable Outlook feed.',
          });
        },
      });
  }

  async copyOutlookUrl(): Promise<void> {
    const url = this.status?.outlookFeedUrl;
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      this.messages.add({ severity: 'success', summary: 'Copied', detail: 'Feed URL copied to clipboard.' });
    } catch {
      this.messages.add({
        severity: 'warn',
        summary: 'Copy failed',
        detail: 'Select and copy the URL manually.',
      });
    }
  }

  private loadStatus(): void {
    this.loading.start();
    this.syncService
      .getStatus()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading.stop();
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (s) => {
          this.status = s;
        },
        error: () => {
          this.messages.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Could not load calendar sync status.',
          });
        },
      });
  }

  private handleQueryParams(): void {
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      if (params.get('connected') === '1') {
        this.messages.add({
          severity: 'success',
          summary: 'Connected',
          detail: 'Google Calendar connected. Future approved leave will sync automatically.',
        });
      } else if (params.get('oauth_failed') === '1') {
        this.messages.add({
          severity: 'error',
          summary: 'Connection failed',
          detail: 'Google sign-in did not complete. Try again.',
        });
      } else if (params.get('invalid_state') === '1' || params.get('missing_code') === '1') {
        this.messages.add({
          severity: 'error',
          summary: 'Connection failed',
          detail: 'Invalid or expired sign-in session. Try again.',
        });
      }
    });
  }
}
