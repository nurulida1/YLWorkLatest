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
  ],
  template: `<div class="p-6 w-full min-h-[85vh] flex flex-col">
      @if (currentUser?.systemRole === 'SuperAdmin') {
        <div class="flex flex-col">
          <div class="font-bold text-2xl">
            Hello, {{ currentUser?.fullName }}
          </div>
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
                  (click)="openReject(pending)"
                ></i>
                <i
                  class="pi pi-check text-sky-700! cursor-pointer hover:scale-102"
                  (click)="openApprove(pending)"
                ></i>
              </div>
            </div>
          }
        </div>

        <div class="mt-8 flex flex-col gap-6">
          <div class="uppercase text-gray-600">System Activity</div>
        </div>
      }
    </div>

    <p-dialog
      [(visible)]="approveDialog"
      [modal]="true"
      [style]="{ width: '95vw', maxWidth: '420px' }"
    >
      <ng-template #headless>
        <div class="flex flex-col gap-4 p-6">
          <div class="flex flex-col gap-1 border-b border-gray-200 pb-3">
            <div class="text-xl font-bold">Approve Registration</div>
            <span class="text-gray-500"
              >Set organizational details for
              <strong class="text-gray-700">{{
                selectedUser?.fullName
              }}</strong></span
            >
          </div>

          <div class="flex flex-col gap-2 text-gray-600 tracking-wide">
            <label class="font-medium uppercase"> Departments</label>
            <div class="grid grid-cols-12 justify-between gap-3 mt-3">
              <ng-container *ngFor="let department of departments">
                <div class="col-span-6 flex flex-row gap-2 items-center">
                  <p-checkbox
                    [binary]="true"
                    [(ngModel)]="selectedDepartments"
                  ></p-checkbox>
                  <label for="">{{ department?.name }}</label>
                </div>
              </ng-container>
            </div>
          </div>

          <div class="flex flex-col gap-2 text-gray-600">
            <label class="font-medium"> System Role </label>

            <p-select
              [options]="roles"
              optionLabel="label"
              optionValue="value"
              [(ngModel)]="selectedRole"
            >
            </p-select>
          </div>
        </div>
        <div class="flex flex-col gap-2 bg-gray-100 p-6 rounded-b-xl">
          <p-button
            label="Confirm Approval"
            size="small"
            styleClass="w-full! bg-sky-950! py-3! border-none!"
            severity="info"
            (onClick)="approveUser()"
          ></p-button>

          <p-button
            label="Cancel"
            size="small"
            [text]="true"
            severity="secondary"
            styleClass="w-full!"
            (onClick)="approveDialog = false"
          ></p-button>
        </div>
      </ng-template>
    </p-dialog>

    <p-dialog
      header="Reject Registration"
      [(visible)]="rejectDialog"
      [modal]="true"
      [style]="{ width: '95vw', maxWidth: '420px' }"
    >
      <textarea
        pInputTextarea
        rows="5"
        maxlength="300"
        [(ngModel)]="rejectReason"
        class="w-full"
        placeholder="Reason (optional)"
      >
      </textarea>

      <div class="text-right text-sm text-gray-400">
        {{ rejectReason.length }} / 300
      </div>

      <ng-template pTemplate="footer">
        <p-button
          severity="secondary"
          label="Cancel"
          (click)="rejectDialog = false"
        >
        </p-button>

        <p-button
          severity="danger"
          label="Reject"
          icon="pi pi-times"
          (click)="rejectUser()"
        >
        </p-button>
      </ng-template>
    </p-dialog> `,
  styleUrl: './mobile-dashboard.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileDashboard implements OnInit, OnDestroy {
  private readonly loadingService = inject(LoadingService);
  private readonly appService = inject(AppService);
  private readonly departmentService = inject(DepartmentService);
  private readonly userService = inject(UserService);
  private readonly cdr = inject(ChangeDetectorRef);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  currentUser = this.userService.currentUser;

  approveDialog: boolean = false;
  rejectDialog: boolean = false;

  selectedUser: any = null;

  selectedDepartments: string[] = [];
  selectedRole: string = 'Staff';

  rejectReason: string = '';

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
    }
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

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
