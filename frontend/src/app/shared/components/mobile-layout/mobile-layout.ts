import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  Router,
  RouterOutlet,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';

interface QuickAction {
  label: string;
  description: string;
  icon: string;
  route: string;
  color: string;
  background: string;
}

interface WorkMenuItem {
  label: string;
  description: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-mobile-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="mobile-layout">
      <!-- Main Content -->
      <main class="mobile-content">
        <router-outlet></router-outlet>
      </main>

      <!-- Bottom Navigation -->
      <nav class="bottom-navigation" aria-label="Main navigation">
        <!-- Home -->
        <a
          routerLink="/dashboard"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: true }"
          class="nav-item"
          (click)="closeAllSheets()"
        >
          <i class="pi pi-home"></i>
          <span>Home</span>
        </a>

        <!-- My Work -->
        <button
          type="button"
          class="nav-item"
          [class.active]="showWorkMenu"
          [attr.aria-expanded]="showWorkMenu"
          aria-label="Open My Work menu"
          (click)="toggleWorkMenu()"
        >
          <i class="pi pi-briefcase"></i>
          <span>My Work</span>
        </button>

        <!-- Create -->
        <div class="quick-action-wrapper">
          <button
            type="button"
            class="quick-action-button"
            [class.active]="showQuickActions"
            aria-label="Open create actions"
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

        <!-- Notifications -->
        <a
          routerLink="/notifications"
          routerLinkActive="active"
          class="nav-item"
          (click)="closeAllSheets()"
        >
          <i class="pi pi-bell"></i>
          <span>Notifications</span>
        </a>

        <!-- Settings -->
        <a
          routerLink="/mobile-settings"
          routerLinkActive="active"
          class="nav-item"
          (click)="closeAllSheets()"
        >
          <i class="pi pi-cog"></i>
          <span>Settings</span>
        </a>
      </nav>

      <!-- Shared Backdrop -->
      <div
        class="mobile-sheet-backdrop"
        [class.show]="showQuickActions || showWorkMenu"
        (click)="closeAllSheets()"
      ></div>

      <!-- My Work Bottom Sheet -->
      <section
        class="mobile-bottom-sheet work-menu-sheet"
        [class.show]="showWorkMenu"
        [attr.aria-hidden]="!showWorkMenu"
        aria-label="My Work menu"
      >
        <div class="sheet-handle"></div>

        <div class="sheet-header">
          <div>
            <h3>My Work</h3>
            <p>Access your work modules</p>
          </div>

          <button
            type="button"
            class="sheet-close-button"
            aria-label="Close My Work menu"
            (click)="closeAllSheets()"
          >
            <i class="pi pi-times"></i>
          </button>
        </div>

        <div class="work-menu-list">
          @for (item of workMenuItems; track item.route) {
            <button
              type="button"
              class="work-menu-item"
              (click)="navigateTo(item.route)"
            >
              <div class="work-menu-icon">
                <i [class]="item.icon"></i>
              </div>

              <div class="work-menu-text">
                <span class="work-menu-title">{{ item.label }}</span>
                <span class="work-menu-description">
                  {{ item.description }}
                </span>
              </div>

              <i class="pi pi-angle-right work-menu-arrow"></i>
            </button>
          }
        </div>
      </section>

      <!-- Create Bottom Sheet -->
      <section
        class="mobile-bottom-sheet create-menu-sheet"
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
            aria-label="Close create menu"
            (click)="closeAllSheets()"
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
  showWorkMenu = false;

  constructor(private router: Router) {}

  // My Work menu
  workMenuItems: WorkMenuItem[] = [
    {
      label: 'Upcoming Meetings',
      description: 'View your upcoming meetings',
      icon: 'pi pi-calendar-clock',
      route: '/meeting',
    },
    {
      label: 'My Tasks',
      description: 'View and manage your assigned tasks',
      icon: 'pi pi-list-check',
      route: '/my-tasks',
    },
    {
      label: 'My Daily Reports',
      description: 'View your submitted daily reports',
      icon: 'pi pi-file-edit',
      route: '/daily-reports',
    },
    {
      label: 'Team Daily Reports',
      description: 'View daily reports submitted by your team',
      icon: 'pi pi-users',
      route: '/daily-reports/team',
    },
  ];
  // Create menu
  quickActions: QuickAction[] = [
    {
      label: 'Apply Leave',
      description: 'Submit a leave application',
      icon: 'pi pi-calendar-plus',
      route: '/leave/apply',
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
      route: '/meeting/form',
      color: '#0891b2',
      background: '#ecfeff',
    },
  ];

  toggleWorkMenu(): void {
    this.showWorkMenu = !this.showWorkMenu;
    this.showQuickActions = false;
  }

  toggleActions(): void {
    this.showQuickActions = !this.showQuickActions;
    this.showWorkMenu = false;
  }

  closeAllSheets(): void {
    this.showQuickActions = false;
    this.showWorkMenu = false;
  }

  navigateTo(route: string): void {
    this.closeAllSheets();
    this.router.navigateByUrl(route);
  }
}
