import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MenuItem } from 'primeng/api';
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
    <div class="min-h-screen w-full flex flex-col bg-gray-50">
      <div
        class="sticky top-0 z-50 p-3 top-0 flex flex-row items-center justify-between border-b bg-white border-gray-200 shadow-xs"
      >
        <div class="flex flex-row gap-3 items-center">
          <div
            class="font-bold uppercase text-2xl tracking-wide text-shadow-sm"
          >
            YL Works
          </div>
        </div>
        <div class="flex flex-row items-center gap-4">
          <i class="pi pi-bell text-2xl! text-gray-500!"></i>
          <div
            class="bg-gray-100 border border-gray-200 flex items-center justify-center rounded-full w-10 h-10 inset-shadow-sm"
          >
            <i class="pi pi-user text-xl! text-gray-500!"></i>
          </div>
        </div>
      </div>
      <main class="flex-1 pb-25">
        <router-outlet></router-outlet>
      </main>
      <div class="fixed bottom-2 w-full px-2 z-50">
        <div
          class="border border-gray-200 bg-white py-3 rounded-2xl shadow-lg grid grid-cols-10 justify-around"
        >
          <a
            routerLink="/tasks"
            routerLinkActive="active"
            class="nav-item col-span-2"
          >
            <i class="pi pi-list-check"></i>
            <span>Tasks</span>
          </a>

          <a
            routerLink="/dashboard"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
            class="nav-item col-span-2"
          >
            <i class="pi pi-home"></i>
            <span>Home</span>
          </a>

          <div class="col-span-2 relative">
            <div class="absolute bottom-2">
              <div
                class="relative col-span-2 border-7 rounded-full border-gray-100"
              >
                <div
                  *ngIf="showActions"
                  class="absolute bottom-16 left-1/2 -translate-x-1/2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-fade"
                >
                  <a
                    *ngFor="let item of quickActions"
                    [routerLink]="item.routerLink"
                    class="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition"
                    (click)="showActions = false"
                  >
                    <div
                      class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"
                    >
                      <i [class]="item.icon" class="text-blue-600 text-xl"></i>
                    </div>

                    <div class="text-gray-700 font-medium">
                      {{ item.label }}
                    </div>
                  </a>
                </div>

                <button
                  (click)="showActions = !showActions"
                  class="w-16 h-16 rounded-full bg-blue-600 text-white shadow-xl flex items-center justify-center transition-transform"
                  [class.rotate-45]="showActions"
                >
                  <i class="pi pi-plus text-2xl"></i>
                </button>
              </div>
            </div>
          </div>
          <a
            routerLink="/schedule"
            routerLinkActive="active"
            class="nav-item col-span-2"
          >
            <i class="pi pi-calendar"></i>
            <span>Schedule</span>
          </a>

          <a
            routerLink="/profile-settings"
            routerLinkActive="active"
            class="nav-item col-span-2"
          >
            <i class="pi pi-cog"></i>
            <span>Settings</span>
          </a>
        </div>
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
