import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { DepartmentService } from '../../services/departmentService';
import { LoadingService } from '../../services/loading.service';
import { UserService } from '../../services/userService.service';
import { Subject, takeUntil } from 'rxjs';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-directory',
  imports: [CommonModule, FormsModule, InputTextModule, RouterLink],
  template: ` <div class="flex flex-col gap-6 min-h-screen">
    <div
      class="h-43 bg-[#0566D9] px-6 pb-8 pt-6 flex flex-col justify-between rounded-b-4xl shadow-lg"
    >
      <div class="flex flex-row items-center justify-between">
        <div class="text-3xl font-bold text-white" [routerLink]="'/dashboard'">
          YL Works
        </div>
        <div class="flex flex-row items-center gap-4">
          <i class="pi pi-bell text-3xl! text-white!"></i>
          <div
            class="bg-white w-8 h-8 rounded-full flex items-center justify-center p-2"
          >
            <i class="pi pi-user text-xl! text-[#0566D9]!"></i>
          </div>
        </div>
      </div>

      <div class="relative">
        <input
          type="text"
          pInputText
          [(ngModel)]="searchTerm"
          class="w-full rounded-2xl! pl-12! text-lg! py-3!"
          placeholder="Search employees..."
        />
        <i
          class="pi pi-search text-gray-400! text-xl! absolute! top-3.5! left-6!"
        ></i>
      </div>
    </div>
    <div class="px-5 py-3 flex flex-row items-center gap-4 overflow-x-auto">
      <ng-container *ngFor="let dept of departments">
        <div
          class="shadow-xs rounded-xl whitespace-nowrap p-2 cursor-pointer"
          [ngClass]="{
            'bg-blue-500 text-white': activeDepartment === dept.name,
            'bg-gray-100 border border-gray-200 text-gray-700':
              activeDepartment !== dept.name,
          }"
          (click)="
            activeDepartment = activeDepartment === dept.name ? '' : dept.name
          "
        >
          {{ dept.name }}
        </div>
      </ng-container>
    </div>

    <div class="mt-3 px-5 flex flex-col gap-5">
      <ng-container *ngIf="filteredUsers.length > 0; else noEmployees">
        <ng-container *ngFor="let data of filteredUsers">
          <div
            class="p-4 rounded-lg border border-gray-200 bg-white grid grid-cols-12 gap-4 items-center justify-between"
          >
            <div class="col-span-9 items-center gap-5 grid grid-cols-12">
              <div
                class="col-span-2 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center font-bold text-blue-700"
              >
                {{ getInitial(data?.fullName) }}
              </div>

              <div class="col-span-10 flex flex-col">
                <div class="font-bold text-lg">{{ data.fullName }}</div>
                <span class="text-gray-500">{{ data.jobTitle }}</span>
              </div>
            </div>

            <div class="col-span-3 flex items-end justify-end">
              <a
                [href]="'mailto:' + data.email"
                class="w-10 h-10 flex items-center justify-center shadow-sm bg-white rounded-lg"
                [attr.aria-label]="'Email ' + data.fullName"
              >
                <i class="pi pi-envelope text-blue-500! text-xl!"></i>
              </a>
            </div>
          </div>
        </ng-container>
      </ng-container>

      <ng-template #noEmployees>
        <div
          class="flex flex-col items-center justify-center py-12 text-center"
        >
          <i class="pi pi-users text-4xl text-gray-300"></i>
          <div class="mt-3 font-semibold text-gray-500">No employees found</div>
          <div class="text-sm text-gray-400">
            Try another search or department.
          </div>
        </div>
      </ng-template>
    </div>
  </div>`,
  styleUrl: './directory.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Directory implements OnInit, OnDestroy {
  private readonly departmentService = inject(DepartmentService);
  private readonly loadingService = inject(LoadingService);
  private readonly userService = inject(UserService);
  private readonly cdr = inject(ChangeDetectorRef);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  userLists: any;
  departments: any;

  activeDepartment: string = '';
  searchTerm: string = '';

  ngOnInit(): void {
    this.GetDepartment();
    this.GetData();
  }

  GetDepartment() {
    this.departmentService
      .GetMany({
        Page: 1,
        PageSize: 10,
        OrderBy: 'Name',
        Includes: null,
        Select: null,
        Filter: null,
      })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.departments = res.data;
          this.cdr.markForCheck();
        },
        error: (err) => {},
      });
  }

  GetData() {
    this.loadingService.start();
    this.userService
      .GetMany({
        Page: 1,
        PageSize: 100,
        Select: null,
        Includes: null,
        Filter: null,
        OrderBy: 'FullName desc',
      })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();
          this.userLists = res;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loadingService.stop();
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

  get filteredUsers() {
    const search = this.searchTerm.trim().toLowerCase();

    return (this.userLists?.data ?? []).filter((user: any) => {
      const matchesSearch =
        !search ||
        user.fullName?.toLowerCase().includes(search) ||
        user.jobTitle?.toLowerCase().includes(search);

      const matchesDepartment =
        !this.activeDepartment ||
        user.departments?.some(
          (dept: any) => dept.name === this.activeDepartment,
        );

      return matchesSearch && matchesDepartment;
    });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
