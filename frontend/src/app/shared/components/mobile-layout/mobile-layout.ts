import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe, TranslateDirective } from '@ngx-translate/core';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { Menu, MenuModule } from 'primeng/menu';

@Component({
  selector: 'app-mobile-layout',
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    ButtonModule,
    MenuModule,
    RouterLinkActive,
    AvatarModule,
  ],
  template: `
    <div class="h-screen overflow-hidden flex flex-col">
      <div class="h-[90%] overflow-y-auto">
        <router-outlet></router-outlet>
      </div>

      <div
        class="px-8 py-3 h-[10%] border-t border-gray-200 bg-white flex flex-row items-center justify-between"
      >
        <a
          routerLink="/dashboard"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: true }"
          class="nav-item"
        >
          <i class="pi pi-home text-xl!"></i>
          <span class="text-sm">Home</span>
        </a>

        <a routerLink="/tasks" routerLinkActive="active" class="nav-item">
          <i class="pi pi-clipboard text-xl!"></i>
          <span class="text-sm">Tasks</span>
        </a>

        <a
          routerLink="/new"
          routerLinkActive="active"
          class="nav-item new-item"
        >
          <div
            class="border-2 border-blue-600 shadow-lg w-13 h-13 bg-blue-800 flex items-center justify-center rounded-full"
          >
            <i class="pi pi-plus text-xl! text-white!"></i>
          </div>
          <span class="text-sm">New</span>
        </a>

        <a routerLink="/notice" routerLinkActive="active" class="nav-item">
          <i class="pi pi-megaphone text-xl!"></i>
          <span class="text-sm">Notices</span>
        </a>

        <a
          routerLink="/profile-settings"
          routerLinkActive="active"
          class="nav-item"
        >
          <i class="pi pi-cog text-xl!"></i>
          <span class="text-sm">Settings</span>
        </a>
      </div>
    </div>
  `,
  styleUrl: './mobile-layout.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileLayout {
  @ViewChild('menu') menu!: Menu;

  showActions: boolean = false;

  quickActions = [
    {
      label: 'Apply Leave',
      icon: 'pi pi-calendar-plus',
      routerLink: '/leave/apply',
    },
    {
      label: 'Submit Claim',
      icon: 'pi pi-wallet',
      routerLink: '/claims/create',
    },
    {
      label: 'Material Request',
      icon: 'pi pi-file-edit',
      routerLink: '/material-requests',
    },
    {
      label: 'Approval',
      icon: 'pi pi-check-circle',
      routerLink: '/approval',
    },
    {
      label: 'Meeting Room',
      icon: 'pi pi-calendar',
      routerLink: '/meeting-room',
    },
  ];
}
