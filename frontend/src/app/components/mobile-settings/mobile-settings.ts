import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { UserService } from '../../services/userService.service';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ButtonModule } from 'primeng/button';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-mobile-settings',
  imports: [
    CommonModule,
    RouterLink,
    TagModule,
    ToggleSwitchModule,
    ButtonModule,
  ],
  template: `<div class="w-full min-h-[80vh] flex flex-col bg-gray-50">
      <div class="flex flex-col space-y-3 items-center justify-center py-5">
        <div
          class="border-2 inset-shadow-sm border-gray-200 relative w-25 h-25 rounded-full bg-gray-100 flex items-center justify-center"
        >
          <i class="pi pi-user text-4xl! text-gray-500!"></i>
          <div class="absolute -bottom-1 -right-1">
            <div
              class="flex items-center justify-center bg-blue-600 rounded-full h-7 w-7 border-2 border-white"
            >
              <i class="pi pi-pencil text-xs! text-white!"></i>
            </div>
          </div>
        </div>
        <div class="flex flex-col text-center gap-1">
          <div class="font-bold text-xl">{{ name }}</div>
          <span class="text-gray-500">{{ currentUser?.jobTitle }}</span>
        </div>
      </div>
      <div class="flex flex-col gap-1 px-6 mt-2">
        <div class="uppercase text-gray-600 text-sm">Account</div>
        <div class="bg-white rounded-lg border border-gray-300 my-2">
          <div
            [routerLink]="'/profile-settings/personal-info'"
            class="cursor-pointer flex flex-row items-center justify-between border-b border-gray-300 p-4"
          >
            <div class="flex flex-row items-center gap-4">
              <i class="pi pi-user"></i>
              <div>Personal Information</div>
            </div>
            <i class="pi pi-chevron-right text-gray-500!"></i>
          </div>
          <div
            class="flex flex-row items-center justify-between border-b border-gray-300 p-4"
          >
            <div class="flex flex-row items-center gap-4">
              <i class="pi pi-lock"></i>
              <div>Change Password</div>
            </div>
            <i class="pi pi-chevron-right text-gray-500!"></i>
          </div>
          <div class="flex flex-row items-center justify-between p-4">
            <div class="flex flex-row items-center gap-4">
              <i class="pi pi-bell"></i>
              <div>Notifications</div>
            </div>
            <i class="pi pi-chevron-right text-gray-500!"></i>
          </div>
        </div>
      </div>
      <div class="flex flex-col gap-1 px-6 mt-3">
        <div class="uppercase text-gray-600 text-sm">Preferences</div>
        <div class="bg-white rounded-lg border border-gray-300 my-2">
          <div
            class="flex flex-row items-center justify-between border-b border-gray-300 p-4"
          >
            <div class="flex flex-row items-center gap-4">
              <i class="pi pi-language"></i>
              <div>Language</div>
            </div>
            <a class="text-blue-600">English</a>
          </div>
          <div
            class="flex flex-row items-center justify-between border-b border-gray-300 p-4"
          >
            <div class="flex flex-row items-center gap-4">
              <i class="pi pi-moon"></i>
              <div>Dark Mode</div>
            </div>
            <p-toggleswitch></p-toggleswitch>
          </div>
          <div class="flex flex-row items-center justify-between p-4">
            <div class="flex flex-row items-center gap-4">
              <i class="pi pi-palette"></i>
              <div>App Theme</div>
            </div>
            <i class="pi pi-chevron-right text-gray-500!"></i>
          </div>
        </div>
      </div>
      <div class="flex flex-col gap-1 px-6 mt-3">
        <div class="uppercase text-gray-600 text-sm">Support</div>
        <div class="bg-white rounded-lg border border-gray-300 my-2">
          <div
            class="flex flex-row items-center justify-between border-b border-gray-300 p-4"
          >
            <div class="flex flex-row items-center gap-4">
              <i class="pi pi-question-circle"></i>
              <div>Help Center</div>
            </div>
            <i class="pi pi-external-link text-gray-500!"></i>
          </div>
          <div
            class="flex flex-row items-center justify-between border-b border-gray-300 p-4"
          >
            <div class="flex flex-row items-center gap-4">
              <i class="pi pi-microchip"></i>
              <div>Report a bug</div>
            </div>
            <i class="pi pi-chevron-right text-gray-500!"></i>
          </div>
          <div class="flex flex-row items-center justify-between p-4">
            <div class="flex flex-row items-center gap-4">
              <i class="pi pi-file"></i>
              <div>Terms & Privacy</div>
            </div>
            <i class="pi pi-chevron-right text-gray-500!"></i>
          </div>
        </div>
        <p-button
          (onClick)="LogOut()"
          styleClass="w-full border-gray-200! py-3!"
          severity="secondary"
          label="Sign Out"
          icon="pi pi-sign-out"
          class="my-4"
        ></p-button>
      </div>
    </div>

    @if (isLoggingOut()) {
      <div
        class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm
         flex items-center justify-center"
      >
        <div
          class="bg-white rounded-3xl px-8 py-7 flex flex-col
           items-center gap-4 shadow-2xl"
        >
          <i class="pi pi-spin pi-spinner text-4xl text-blue-600"></i>

          <div class="font-semibold">Signing Out...</div>

          <div class="text-sm text-gray-500">Please wait a moment</div>
        </div>
      </div>
    }`,
  styleUrl: './mobile-settings.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileSettings {
  private readonly userService = inject(UserService);

  currentUser = this.userService.currentUser;
  name: string | undefined = this.currentUser?.fullName ?? undefined;

  isLoggingOut = signal(false);

  get initials(): string {
    const name = this.currentUser?.fullName;

    if (!name) {
      return '';
    }

    return name
      .trim()
      .split(/\s+/)
      .filter((n) => n.length > 0)
      .slice(0, 2)
      .map((n) => n.charAt(0))
      .join('')
      .toUpperCase();
  }

  async LogOut() {
    if (this.isLoggingOut()) return;

    this.isLoggingOut.set(true);

    await new Promise((r) => setTimeout(r, 700));

    this.userService.logout();
  }
}
