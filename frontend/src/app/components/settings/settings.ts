import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { AvatarModule } from 'primeng/avatar';
import { UserService } from '../../services/userService.service';
import { LoadingService } from '../../services/loading.service';
import { Subject } from 'rxjs';
import { UserRole } from '../../shared/enum/enum';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-settings',
  imports: [CommonModule, FooterComponent, AvatarModule, RouterLink],
  template: `<div class="relative w-full min-h-screen bg-cover bg-center">
    <div class="relative bg-gray-100 w-full min-h-screen flex flex-col">
      <div
        class="flex flex-row items-center justify-center p-3 py-5 border border-white/10 shadow-md"
      >
        <div class="tracking-widest">Settings</div>
        <app-footer
          class="p-2 fixed bottom-0 left-0 w-full z-50 shadow-md"
        ></app-footer>
      </div>
      <div class="mt-3 px-3">
        <div
          class="p-5 border-b border-gray-300 flex flex-col justify-center items-center"
        >
          <p-avatar
            icon="pi pi-user"
            class="mr-2"
            size="xlarge"
            styleClass="!bg-gray-200"
            shape="circle"
          />
          <div class="mt-2 tracking-wider text-shadow-md text-lg">
            {{ userData?.fullName }}
          </div>
          <div class="text-gray-500 text-xs tracking-widest">
            {{ userData?.role }}
          </div>
        </div>
        <div
          class="p-3 pt-5 pb-2 flex flex-row items-center gap-3 text-gray-700"
        >
          <div
            class="bg-white/30 shadow-md w-10 h-10 flex items-center justify-center rounded-full"
          >
            <i class="pi pi-user-edit !text-lg"></i>
          </div>
          <div>Update Profile</div>
        </div>
        <div
          class="p-3 pb-2 flex flex-row items-center gap-3 text-gray-700"
          [routerLink]="'/change-password-internal'"
        >
          <div
            class="bg-white/30 shadow-md w-10 h-10 flex items-center justify-center rounded-full"
          >
            <i class="pi pi-unlock !text-lg"></i>
          </div>
          <div>Change Password</div>
        </div>
        <div class="p-3 pb-2 flex flex-row items-center gap-3 text-gray-700">
          <div
            class="bg-white/30 shadow-md w-10 h-10 flex items-center justify-center rounded-full"
          >
            <i class="pi pi-moon !text-lg"></i>
          </div>
          <div>Dark Theme</div>
        </div>
        <div
          class="p-3 pb-5 flex flex-row items-center gap-3 text-gray-700"
          (click)="LogoutClick()"
        >
          <div
            class="bg-white/30 shadow-md w-10 h-10 flex items-center justify-center rounded-full"
          >
            <i class="pi pi-sign-out !text-lg"></i>
          </div>
          <div>Sign Out</div>
        </div>
      </div>
    </div>
    <div
      *ngIf="logoutPopup"
      class="backdrop-blur-xs z-20 absolute top-0 left-0 w-full min-h-screen flex justify-center items-center transition-opacity duration-300"
      [ngClass]="{ 'opacity-0': !logoutPopup, 'opacity-100': logoutPopup }"
    >
      <div class="w-full min-h-screen flex justify-center items-center">
        <div
          class="w-[80%] shadow-md rounded-lg bg-white flex flex-col justify-center items-center transform transition-all duration-300 ease-out scale-95 opacity-0"
          [ngClass]="{ 'scale-100 opacity-100': logoutPopup }"
        >
          <div
            class="font-medium text-lg pb-2 pt-5 text-gray-800 tracking-wider"
          >
            See you soon !
          </div>
          <div class="text-gray-600 text-sm tracking-wide">
            Are you sure you want to log out ?
          </div>
          <div
            class="flex flex-row items-center w-full border-t mt-4 border-gray-200"
          >
            <div
              (click)="closeDialog()"
              class="flex-1 border-r text-sm tracking-wider border-gray-200 py-4 text-center text-gray-600"
            >
              Cancel
            </div>
            <div
              (click)="logoutConfirm()"
              class="flex-1 text-sm tracking-wider text-blue-600 text-center py-4"
            >
              Confirm
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`,
  styleUrl: './settings.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Settings implements OnInit, OnDestroy {
  private readonly userService = inject(UserService);
  private readonly loadingService = inject(LoadingService);
  private readonly cdr = inject(ChangeDetectorRef);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  userData: any | null = null;
  role: UserRole | null = null;

  logoutPopup: boolean = false;
  isMobile = window.innerWidth < 770;

  @HostListener('window:resize', [])
  onResize() {
    this.isMobile = window.innerWidth < 770;
  }

  constructor() {
    this.role =
      (this.userService.currentUser?.systemRole as UserRole) ?? UserRole.Staff;
  }

  ngOnInit(): void {
    this.userData = this.userService.currentUser;
  }

  LogoutClick() {
    this.logoutPopup = true;
    this.cdr.detectChanges();
  }

  closeDialog() {
    this.logoutPopup = false;
    this.cdr.detectChanges();
  }

  logoutConfirm() {
    setTimeout(() => {
      this.userService.logout();
    }, 50);
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
