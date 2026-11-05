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
import { DialogModule } from 'primeng/dialog';
import { MultiSelectModule } from 'primeng/multiselect';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { DepartmentService } from '../../../services/departmentService';
import { CheckboxModule } from 'primeng/checkbox';
import { StaffTaskService } from '../../../services/staffTaskService';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-mobile-dashboard',
  imports: [
    CommonModule,
    DialogModule,
    MultiSelectModule,
    FormsModule,
    SelectModule,
    InputTextModule,
    TextareaModule,
    ButtonModule,
    CheckboxModule,
    RouterLink,
  ],
  template: `
    <div class="flex flex-col">
      <div
        class="relative bg-[#1D4ED8] rounded-b-[2.5rem] overflow-hidden pb-3"
      >
        <div
          class="absolute -top-20 -right-15 w-56 h-56 rounded-full border border-white/15"
        ></div>

        <div
          class="absolute -top-12 -right-8 w-44 h-44 rounded-full border border-white/20"
        ></div>

        <div
          class="absolute top-8 -right-20 w-36 h-36 rounded-full bg-white/5"
        ></div>

        <div class="relative z-10 h-full px-6 py-6 flex flex-col">
          <div class="flex flex-row items-center justify-between">
            <div class="flex flex-row items-center gap-3">
              <div
                class="w-12 h-12 rounded-full flex items-center justify-center bg-white/10 border border-white/30"
              >
                <div class="font-semibold text-white">YL</div>
              </div>
              <div class="uppercase text-white mt-1">Works Enterprise</div>
            </div>
            <div class="flex flex-row items-center gap-2">
              <div
                class="w-11 h-11 rounded-full flex items-center justify-center bg-white/10 border border-white/30"
              >
                <i class="pi pi-bell text-white!"></i>
              </div>
              <div
                class="w-11 h-11 rounded-full flex items-center justify-center bg-[#FCDF7B] border border-[#e5c85f]"
              >
                <div class="font-semibold">
                  {{ getInitial(currentUser?.displayName) }}
                </div>
              </div>
            </div>
          </div>
          <div class="flex flex-col mt-10">
            <div class="font-semibold text-2xl text-white text-shadow-lg">
              Welcome back, {{ currentUser?.displayName }}
            </div>
            <span class="font-light text-white/80 mt-1 tracking-wide">{{
              currentUser?.jobTitle
            }}</span>
            <div class="mt-4 w-full relative">
              <input
                class="w-full p-3! pl-10! rounded-full!"
                [(ngModel)]="searchTerm"
                placeholder="Search tasks, materials, notices..."
                pInputText
              />
              <i
                class="pi pi-search absolute! top-4.5! left-4! text-gray-400!"
              ></i>
            </div>
          </div>
        </div>
      </div>
      <div class="relative w-full px-5 h-30">
        <div
          class="absolute -top-5 left-1/2 -translate-x-1/2 w-[calc(100%-2.5rem)] py-5 px-7 bg-white rounded-2xl shadow-lg"
        >
          <div class="flex flex-row items-center justify-between px-3">
            <div class="flex flex-col items-center gap-1">
              <div
                [routerLink]="'/claims'"
                class="w-13 h-13 rounded-xl flex items-center justify-center bg-green-100"
              >
                <i class="pi pi-money-bill text-green-800! text-2xl!"></i>
              </div>
              <div class="text-sm font-semibold">Claims</div>
            </div>
            <div class="flex flex-col items-center gap-1">
              <div
                [routerLink]="'/tasks'"
                class="w-13 h-13 rounded-xl flex items-center justify-center bg-blue-100"
              >
                <i class="pi pi-list-check text-blue-800! text-2xl!"></i>
              </div>
              <div class="text-sm font-semibold">Tasks</div>
            </div>
            <div class="flex flex-col items-center gap-1">
              <div
                [routerLink]="'/leave'"
                class="w-13 h-13 rounded-xl flex items-center justify-center bg-yellow-100"
              >
                <i class="pi pi-calendar text-yellow-800! text-2xl!"></i>
              </div>
              <div class="text-sm font-semibold">Leave</div>
            </div>
            <div class="flex flex-col items-center gap-1">
              <div
                [routerLink]="'/notice'"
                class="w-13 h-13 rounded-xl flex items-center justify-center bg-violet-100"
              >
                <i class="pi pi-megaphone text-violet-800! text-2xl!"></i>
              </div>
              <div class="text-sm font-semibold">Notices</div>
            </div>
          </div>
        </div>
      </div>
      <div class="flex flex-col gap-3 mt-2 px-6">
        <div class="font-semibold tracking-wide uppercase text-gray-400">
          Quick Access
        </div>
        <div class="grid grid-cols-12 gap-4 justify-between">
          <div
            [routerLink]="'/directory'"
            class="col-span-6 flex flex-row gap-3 items-center p-5 bg-white border border-gray-100 rounded-xl shadow-md"
          >
            <div
              class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"
            >
              <i class="pi pi-users text-blue-700! text-xl!"></i>
            </div>
            <div class="flex flex-col">
              <b>Directory</b
              ><span class="text-gray-400 text-xs">See coworkers</span>
            </div>
          </div>
          <div
            [routerLink]="'/projects'"
            class="col-span-6 flex flex-row gap-3 items-center p-5 bg-white border border-gray-100 rounded-xl shadow-md"
          >
            <div
              class="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center"
            >
              <i class="pi pi-list text-violet-700! text-xl!"></i>
            </div>
            <div class="flex flex-col">
              <b>Projects</b
              ><span class="text-gray-400 text-xs">Latest Projects</span>
            </div>
          </div>
          <div
            [routerLink]="'/inventory'"
            class="col-span-6 flex flex-row gap-3 items-center p-5 bg-white border border-gray-100 rounded-xl shadow-md"
          >
            <div
              class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"
            >
              <i class="pi pi-box text-green-700! text-xl!"></i>
            </div>
            <div class="flex flex-col">
              <b>Inventory</b
              ><span class="text-gray-400 text-xs">Warehouse Stock</span>
            </div>
          </div>
          <div
            [routerLink]="'/material-requests'"
            class="col-span-6 flex flex-row gap-3 items-center p-5 bg-white border border-gray-100 rounded-xl shadow-md"
          >
            <div
              class="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center"
            >
              <i class="pi pi-file-o text-orange-700! text-xl!"></i>
            </div>
            <div class="flex flex-col">
              <b>Materials</b
              ><span class="text-gray-400 text-xs">Request materials</span>
            </div>
          </div>
        </div>
      </div>
      <div class="flex flex-col gap-5 px-5 mt-6">
        <div class="flex flex-row items-center justify-between">
          <div class="font-semibold text-lg">Tasks to Do</div>
          <div
            class="flex flex-row items-center gap-2 text-blue-700"
            [routerLink]="['/tasks']"
          >
            <div class="text-sm">View All</div>
            <i class="pi pi-chevron-right text-xs!"></i>
          </div>
        </div>
        <div class="flex flex-col gap-3">
          <ng-container *ngFor="let task of staffTask">
            <div
              class="flex flex-row bg-white rounded-lg border border-gray-100 p-4 shadow-sm border-l-4"
              [ngClass]="{
                'border-l-red-500': task.priority === 'Critical',
                'border-l-orange-500': task.priority === 'High',
                'border-l-yellow-500': task.priority === 'Medium',
                'border-l-blue-500': task.priority === 'Low',
              }"
            >
              <div class="flex flex-row gap-3">
                <p-checkbox
                  [binary]="true"
                  [(ngModel)]="task.isCompleted"
                ></p-checkbox>
                <div class="flex flex-col gap-1">
                  <div class="font-semibold">{{ task.title }}</div>
                  <div class="flex flex-row items-center gap-2">
                    <i class="pi pi-clock text-gray-400! text-xs! mt-1!"></i>
                    <span class="text-gray-500 text-sm">{{
                      task.dueDate | date
                    }}</span>
                  </div>
                </div>
              </div>
            </div>
          </ng-container>
        </div>
      </div>
    </div>
  `,
  styleUrl: './mobile-dashboard.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileDashboard implements OnInit, OnDestroy {
  private readonly loadingService = inject(LoadingService);
  private readonly appService = inject(AppService);
  private readonly staffTaskService = inject(StaffTaskService);
  private readonly departmentService = inject(DepartmentService);
  private readonly userService = inject(UserService);
  private readonly cdr = inject(ChangeDetectorRef);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  currentUser = this.userService.currentUser;

  approveDialog: boolean = false;
  rejectDialog: boolean = false;

  selectedUser: any = null;
  staffTask: any;

  selectedDepartments: string[] = [];
  selectedRole: string = 'Staff';

  rejectReason: string = '';
  searchTerm: string = '';

  departments: any[] = [];

  roles: any[] = [
    { label: 'Administrator', value: 'SuperAdmin' },
    { label: 'HR', value: 'HR' },
    { label: 'Manager', value: 'Manager' },
    { label: 'Director', value: 'Director' },
    { label: 'Staff', value: 'Staff' },
  ];

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

      this.LoadDepartments();
    } else {
      this.GetTask();
    }
  }

  GetTask() {
    this.loadingService.start();
    this.staffTaskService
      .GetMany({
        Page: 1,
        PageSize: 3,
        OrderBy: 'DueDate',
        Select: null,
        Includes: null,
        Filter: `AssignedToId=${this.currentUser?.userId} | OrganizedById=${this.currentUser?.userId}`,
      })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();
          this.staffTask = res.data;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loadingService.stop();
        },
      });
  }

  LoadDepartments() {
    this.departmentService
      .GetMany({
        Page: 1,
        PageSize: 1000000,
        OrderBy: `Name desc`,
        Filter: null,
        Includes: null,
        Select: null,
      })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          if (res) this.departments = res.data;
        },
        error: (err) => {
          console.error(err);
        },
      });
  }

  getInitial(fullName?: string): string {
    if (!fullName?.trim()) return '?';

    const names = fullName.trim().split(/\s+/).filter(Boolean);

    if (names.length === 1) {
      return names[0].substring(0, 2).toUpperCase();
    }

    return (names[0].charAt(0) + names[1].charAt(0)).toUpperCase();
  }

  openApprove(user: any) {
    this.selectedUser = user;
    this.selectedDepartments = [];
    this.selectedRole = 'Staff';
    this.approveDialog = true;
  }

  openReject(user: any) {
    this.selectedUser = user;
    this.rejectReason = '';
    this.rejectDialog = true;
  }

  approveUser() {
    const request = {
      userId: this.selectedUser.id,
      departmentIds: this.selectedDepartments,
      systemRole: this.selectedRole,
    };

    this.loadingService.start();

    // this.userService.approveUser(request).subscribe({
    //   next: () => {

    //     this.approveDialog = false;

    //     this.dashboard.update(d => {
    //       if (!d) return d;

    //       return {
    //         ...d,
    //         pendingApprovals: d.pendingApprovals - 1,
    //         pendingUsers: d.pendingUsers.filter(x => x.id !== this.selectedUser.id)
    //       };
    //     });

    //     this.loadingService.stop();

    //   },
    //   error: () => this.loadingService.stop()
    // });
  }

  rejectUser() {
    const request = {
      userId: this.selectedUser.id,
      reason: this.rejectReason,
    };

    this.loadingService.start();

    // this.appService.rejectUser(request).subscribe({
    //   next: () => {

    //     this.rejectDialog = false;

    //     this.dashboard.update(d => {
    //       if (!d) return d;

    //       return {
    //         ...d,
    //         pendingApprovals: d.pendingApprovals - 1,
    //         pendingUsers: d.pendingUsers.filter(x => x.id !== this.selectedUser.id)
    //       };
    //     });

    //     this.loadingService.stop();

    //   },
    //   error: () => this.loadingService.stop()
    // });
  }

  get filteredTasks() {
    const search = this.searchTerm.trim().toLowerCase();

    if (!search) {
      return this.staffTask ?? [];
    }

    return (this.staffTask ?? []).filter((task: any) => {
      return (
        task.title?.toLowerCase().includes(search) ||
        task.description?.toLowerCase().includes(search)
      );
    });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
