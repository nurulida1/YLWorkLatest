import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { LoadingService } from '../../../services/loading.service';
import { UserService } from '../../../services/userService.service';
import { SuperAdminDashboardDto } from '../../../models/AppModels';
import { AppService } from '../../../services/appService.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-mobile-dashboard',
  imports: [CommonModule],
  template: `<div class="p-6 w-full min-h-[85vh] flex flex-col">
    @if (currentUser?.systemRole === 'SuperAdmin') {
      <div class="flex flex-col">
        <div class="font-bold text-2xl">Hello, {{ currentUser?.fullName }}</div>
        <span class="text-gray-500">System-wide oversight & operations.</span>
      </div>
      <div class="grid grid-cols-12 gap-3 mt-6">
        <div
          class="h-30 border border-gray-200 shadow-sm col-span-6 bg-white rounded-xl flex flex-col gap-2 justify-center p-4"
        >
          <div class="uppercase text-sm text-gray-500">Total Users</div>
          <div class="font-bold text-gray-700 text-4xl">
            {{ dashboard()?.totalUsers }}
          </div>
        </div>
        <div
          class="h-30 border border-gray-200 shadow-sm col-span-6 bg-white rounded-xl flex flex-col gap-2 justify-center p-4"
        >
          <div class="uppercase text-sm text-gray-500">Pending Approval</div>
          <div class="font-bold text-sky-700 text-4xl">
            {{ dashboard()?.pendingApprovals }}
          </div>
        </div>
      </div>

      <div class="mt-8 uppercase text-gray-700">Quick Actions</div>
      <div class="grid grid-cols-12 gap-4 mt-3">
        <div
          class="h-30 bg-sky-950 text-white border border-gray-200 rounded-lg shadow-sm col-span-6 flex flex-col gap-2 items-center justify-center p-4"
        >
          <i class="pi pi-user-plus text-3xl!"></i>
          <span>Add User</span>
        </div>
        <div
          class="h-30 bg-white border border-gray-200 rounded-lg shadow-sm col-span-6 flex flex-col gap-2 items-center justify-center p-4"
        >
          <i class="pi pi-database text-3xl! text-sky-600"></i>
          <span class="text-gray-600">System Logs</span>
        </div>

        <div
          class="h-30 bg-white border border-gray-200 rounded-lg shadow-sm col-span-6 flex flex-col gap-2 items-center justify-center p-4"
        >
          <i class="pi pi-chart-scatter text-3xl! text-sky-600"></i>
          <span class="text-gray-600">Reports</span>
        </div>
        <div
          class="h-30 bg-white border border-gray-200 rounded-lg shadow-sm col-span-6 flex flex-col gap-2 items-center justify-center p-4"
        >
          <i class="pi pi-shield text-3xl! text-sky-600"></i>
          <span class="text-gray-600">Policy Update</span>
        </div>
      </div>

      <div class="mt-8 flex flex-row items-center justify-between">
        <div class="uppercase text-gray-700">Registration Requests</div>
        <span
          class="uppercase bg-sky-600 px-4 py-1 text-white text-sm font-semibold"
        >
          {{ dashboard()?.pendingApprovals }} New</span
        >
      </div>
      <div class="mt-4 flex flex-col gap-2">
        @for (pending of dashboard()?.pendingUsers; track $index) {
          <div
            class="p-4 border w-full rounded-lg bg-white border-gray-200 flex flex-row items-center justify-between"
          >
            <div class="flex flex-row items-center gap-3">
              <div
                class="font-bold text-sky-800 w-12 h-12 rounded-lg bg-sky-50 flex items-center justify-center"
              >
                {{ getInitial(pending?.fullName) }}
              </div>
              <div class="flex flex-col">
                <div class="font-bold text-gray-700">
                  {{ pending?.fullName }}
                </div>
                <div class="text-gray-500">{{ pending?.jobTitle }}</div>
              </div>
            </div>
            <div class="flex flex-row items-center gap-5">
              <i
                class="pi pi-times text-red-600! cursor-pointer hover:scale-102"
              ></i>
              <i
                class="pi pi-check text-sky-700! cursor-pointer hover:scale-102"
              ></i>
            </div>
          </div>
        }
      </div>

      <div class="mt-8 flex flex-col gap-6">
        <div class="uppercase text-gray-600">System Activity</div>
      </div>
    }
  </div>`,
  styleUrl: './mobile-dashboard.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileDashboard implements OnInit, OnDestroy {
  private readonly loadingService = inject(LoadingService);
  private readonly appService = inject(AppService);
  private readonly userService = inject(UserService);
  private readonly cdr = inject(ChangeDetectorRef);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  currentUser = this.userService.currentUser;

  dashboard = signal<SuperAdminDashboardDto | null>(null);

  ngOnInit(): void {
    if (this.currentUser?.systemRole === 'SuperAdmin') {
      this.loadingService.start();
      this.appService
        .GetSuperAdminDashboard()
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe({
          next: (res) => {
            this.dashboard.set(res);
            this.cdr.markForCheck();
            this.loadingService.stop();
          },
          error: (err) => {
            this.loadingService.stop();
          },
        });
    }
  }

  getInitial(fullName?: string): string {
    if (!fullName?.trim()) return '?';

    const names = fullName.trim().split(/\s+/).filter(Boolean);

    if (names.length === 1) {
      return names[0].substring(0, 2).toUpperCase();
    }

    return (names[0].charAt(0) + names[1].charAt(0)).toUpperCase();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
