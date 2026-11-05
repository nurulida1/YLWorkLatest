import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  Router,
  RouterOutlet,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';

import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';

interface QuickAction {
  label: string;
  description: string;
  icon: string;
  route: string;
  color: string;
  background: string;
}

@Component({
  selector: 'app-mobile-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    AvatarModule,
    ButtonModule,
  ],
  template: `
    <div class="mobile-layout">
      <!-- Main Content -->
      <main class="mobile-content">
        <router-outlet></router-outlet>
      </main>

      <!-- Bottom Navigation -->
      <nav class="bottom-navigation">
        <a
          routerLink="/dashboard"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: true }"
          class="nav-item"
        >
          <i class="pi pi-home"></i>
          <span>Home</span>
        </a>

        <a routerLink="/my-tasks" routerLinkActive="active" class="nav-item">
          <i class="pi pi-clipboard"></i>
          <span>My Work</span>
        </a>

        <!-- Create Button -->
        <div class="quick-action-wrapper">
          <button
            type="button"
            class="quick-action-button"
            [class.active]="showQuickActions"
            aria-label="Open quick actions"
            [attr.aria-expanded]="showQuickActions"
            (click)="toggleActions()"
          >
            <i
              class="pi"
              [class.pi-plus]="!showQuickActions"
              [class.pi-times]="showQuickActions"
            ></i>
          </button>

          <span class="quick-action-label">Create</span>
        </div>

        <a
          routerLink="/announcements"
          routerLinkActive="active"
          class="nav-item"
        >
          <i class="pi pi-megaphone"></i>
          <span>Notices</span>
        </a>

        <a
          routerLink="/profile-settings"
          routerLinkActive="active"
          class="nav-item"
        >
          <i class="pi pi-user"></i>
          <span>Profile</span>
        </a>
      </nav>

      <!-- Quick Action Backdrop -->
      <div
        class="quick-action-backdrop"
        [class.show]="showQuickActions"
        (click)="closeActions()"
      ></div>

      <!-- Quick Action Bottom Sheet -->
      <section
        class="quick-action-sheet"
        [class.show]="showQuickActions"
        [attr.aria-hidden]="!showQuickActions"
        aria-label="Create new"
      >
        <div class="sheet-handle"></div>

        <div class="sheet-header">
          <div>
            <h3>Create New</h3>
            <p>What would you like to create?</p>
          </div>

          <button
            type="button"
            class="sheet-close-button"
            aria-label="Close quick actions"
            (click)="closeActions()"
          >
            <i class="pi pi-times"></i>
          </button>
        </div>

        <div class="quick-action-grid">
          @for (action of quickActions; track action.route) {
            <button
              type="button"
              class="quick-action-card"
              (click)="navigateTo(action.route)"
            >
              <div
                class="action-icon"
                [style.background]="action.background"
                [style.color]="action.color"
              >
                <i [class]="action.icon"></i>
              </div>

              <div class="action-text">
                <span class="action-title">{{ action.label }}</span>
                <span class="action-description">
                  {{ action.description }}
                </span>
              </div>

              <i class="pi pi-angle-right action-arrow"></i>
            </button>
          }
        </div>
      </section>
    </div>
  `,
  styleUrl: './mobile-layout.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileLayout {
  showQuickActions = false;

  constructor(private router: Router) {}

  quickActions: QuickAction[] = [
    {
      label: 'Apply Leave',
      description: 'Submit a leave application',
      icon: 'pi pi-calendar-plus',
      route: '/leave',
      color: '#2563eb',
      background: '#eff6ff',
    },
    {
      label: 'Apply Claim',
      description: 'Submit an expense claim',
      icon: 'pi pi-wallet',
      route: '/claims/apply',
      color: '#059669',
      background: '#ecfdf5',
    },
    {
      label: 'Daily Report',
      description: 'Submit your daily report',
      icon: 'pi pi-file-edit',
      route: '/daily-reports',
      color: '#7c3aed',
      background: '#f5f3ff',
    },
    {
      label: 'Hardware Request',
      description: 'Request equipment or IT support',
      icon: 'pi pi-desktop',
      route: '/hardware-request',
      color: '#ea580c',
      background: '#fff7ed',
    },
    {
      label: 'Create Meeting',
      description: 'Schedule a new meeting',
      icon: 'pi pi-calendar',
      route: '/meeting',
      color: '#0891b2',
      background: '#ecfeff',
    },
  ];

  toggleActions(): void {
    this.showQuickActions = !this.showQuickActions;
  }

  closeActions(): void {
    this.showQuickActions = false;
  }

  navigateTo(route: string): void {
    this.closeActions();
    this.router.navigateByUrl(route);
  }
}
