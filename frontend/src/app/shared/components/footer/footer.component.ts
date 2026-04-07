import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { UserService } from '../../../services/userService.service';
import { UserRole } from '../../enum/enum';

@Component({
  selector: 'app-footer',
  imports: [CommonModule, RouterModule],
  template: `<div
    class="rounded-2xl border px-5 text-gray-500 text-xs lg:text-sm bg-white border-t border-gray-200 shadow-md relative"
    [ngClass]="{ 'pt-3': role === 'Admin' || role === 'Manager' }"
  >
    <div
      *ngIf="getOverflowMenus().length > 0"
      class="flex justify-center cursor-pointer"
      (click)="toggleOverflow()"
    >
      <i
        class="pi"
        [ngClass]="showOverflowMenu ? 'pi-angle-down' : 'pi-angle-up'"
      ></i>
    </div>

    <div class="flex flex-row items-center justify-between py-4">
      <ng-container *ngFor="let menu of getMainMenus()">
        <div
          [routerLink]="menu.link"
          routerLinkActive="!text-blue-500"
          class="w-12 h-12 flex flex-col justify-center items-center rounded-full transition-colors"
        >
          <i class="pi" [ngClass]="menu.icon + ' !text-2xl'"></i>
          <div>{{ menu.label }}</div>
        </div>
      </ng-container>
    </div>

    <div
      class="flex flex-row items-center justify-center gap-10 transition-all duration-300 overflow-hidden"
      [ngClass]="{
        'max-h-0': !showOverflowMenu,
        'max-h-24 pb-3': showOverflowMenu,
      }"
    >
      <ng-container *ngFor="let menu of getOverflowMenus()">
        <div
          [routerLink]="menu.link"
          routerLinkActive="!text-blue-500"
          class="w-12 h-12 flex flex-col justify-center items-center rounded-full transition-colors"
        >
          <i class="pi" [ngClass]="menu.icon + ' !text-2xl'"></i>
          <div>{{ menu.label }}</div>
        </div>
      </ng-container>
    </div>
  </div> `,
  styleUrl: './footer.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  private readonly userService = inject(UserService);

  role: UserRole | null = null;
  showOverflowMenu: boolean = false;

  menus = [
    {
      label: 'Home',
      icon: 'pi-home',
      link: '/dashboard',
      roles: ['Guest', 'Admin', 'Approver', 'RegularStaff', 'Planner'],
    },
    {
      label: 'To-Do',
      icon: 'pi-list',
      link: '/to-do',
      roles: ['Admin', 'RegularStaff'],
    },
    {
      label: 'Quotation',
      icon: 'pi-receipt',
      link: '/quotation',
      roles: ['Admin', 'Approver', 'Planner'],
    },
    {
      label: 'PO',
      icon: 'pi-credit-card',
      link: '/purchase-order',
      roles: ['Admin', 'Approver', 'Planner'],
    },
    {
      label: 'WO',
      icon: 'pi-file',
      link: '/work-order',
      roles: ['Admin', 'Approver', 'Planner'],
    },
    {
      label: 'Job',
      icon: 'pi-briefcase',
      link: '/job',
      roles: ['Admin', 'Approver', 'RegularStaff', 'Planner'],
    },
    {
      label: 'Delivery',
      icon: 'pi-truck',
      link: '/delivery',
      roles: ['Admin', 'Approver', 'RegularStaff', 'Planner'],
    },
    {
      label: 'Roles',
      icon: 'pi-users',
      link: '/role-management',
      roles: ['Admin', 'Approver'],
    },
    {
      label: 'Settings',
      icon: 'pi-cog',
      link: '/settings',
      roles: ['Guest', 'Admin', 'Approver', 'RegularStaff', 'Planner'],
    },
  ];

  constructor() {
    this.role =
      (this.userService.currentUser?.role as UserRole) ?? UserRole.Staff;
  }

  toggleOverflow() {
    this.showOverflowMenu = !this.showOverflowMenu;
  }

  getVisibleMenus(): any[] {
    return this.menus.filter((menu) => menu.roles.includes(this.role ?? ''));
  }

  getMainMenus(): any[] {
    return this.getVisibleMenus().slice(0, 5);
  }

  getOverflowMenus(): any[] {
    return this.getVisibleMenus().slice(5);
  }
}
