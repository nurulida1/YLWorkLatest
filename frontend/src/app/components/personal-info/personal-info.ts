import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { LoadingService } from '../../services/loading.service';
import { UserService } from '../../services/userService.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-personal-info',
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, InputTextModule],
  template: `<div
    class="w-full min-h-[85vh] flex flex-col gap-5 px-6 py-4 items-center"
  >
    <div class="flex flex-col items-center justify-center gap-2">
      <div class="w-25 h-25 border-3 border-white shadow-lg rounded-xl"></div>
      <div class="font-bold text-2xl mt-3 tracking-wide">
        {{ selectedUser?.fullName }}
      </div>
      <span class="text-gray-500 font-semibold">{{
        selectedUser?.jobTitle
      }}</span>
    </div>

    <div
      class="p-6 flex flex-col bg-white border border-gray-300 shadow-sm rounded-lg w-full"
    >
      <div class="flex flex-row items-center gap-2">
        <i class="pi pi-user text-xs text-sky-700!"></i>
        <span class="font-bold text-lg text-gray-800">Basic Information</span>
      </div>

      <div class="flex flex-col gap-1 mt-6">
        <div>Full Name</div>
        <div
          class="border text-gray-700 bg-gray-100 rounded-lg p-2 border-gray-300"
        >
          {{ selectedUser?.fullName }}
        </div>
      </div>
      <div class="flex flex-col gap-1 mt-4">
        <div>Display Name</div>
        <div
          class="border text-gray-700 bg-gray-100 rounded-lg p-2 border-gray-300"
        >
          {{ selectedUser?.displayName }}
        </div>
      </div>
      <div class="flex flex-col gap-1 mt-4">
        <div>Employee ID</div>
        <div
          class="border text-gray-700 bg-gray-100 rounded-lg p-2 border-gray-300"
        >
          {{ selectedUser?.employeeNo }}
        </div>
      </div>
    </div>

    <div
      class="p-6 flex flex-col bg-white border border-gray-300 shadow-sm rounded-lg w-full"
    >
      <div class="flex flex-row items-center gap-2">
        <i class="pi pi-id-card text-xl! text-sky-700!"></i>
        <span class="font-bold text-lg text-gray-800">Contact Details</span>
      </div>

      <div class="flex flex-col gap-1 mt-6">
        <div>Corporate Email</div>
        <div
          class="border text-gray-700 bg-gray-100 rounded-lg p-2 border-gray-300"
        >
          {{ selectedUser?.email }}
        </div>
      </div>
      <div class="flex flex-col gap-1 mt-4">
        <div>Phone Number</div>
        <div
          class="border text-gray-700 bg-gray-100 rounded-lg p-2 border-gray-300"
        >
          {{ selectedUser?.contactNo }}
        </div>
      </div>
    </div>

    <div
      class="p-6 flex flex-col bg-white border border-gray-300 shadow-sm rounded-lg w-full"
    >
      <div class="flex flex-row items-center gap-2">
        <i class="pi pi-building text-xl! text-sky-700!"></i>
        <span class="font-bold text-lg text-gray-800">Professional Info</span>
      </div>

      <div class="flex flex-col border-b pb-4 border-gray-200 gap-2 mt-6">
        <div>Departments</div>
        <div class="grid grid-cols-2 gap-2 justify-end">
          <ng-container *ngFor="let department of selectedUser?.departments"
            ><div
              class="text-center rounded-sm bg-gray-200 text-gray-700 font-semibold px-3 py-2 text-sm"
            >
              {{ department?.name }}
            </div></ng-container
          >
        </div>
      </div>
      <div
        class="border-b border-gray-200 pb-4 flex flex-row items-center justify-between gap-1 mt-4"
      >
        <div>Reporting Managers</div>
        <div class="text-sky-700 font-semibold">
          {{ selectedUser?.hod?.displayName }}1
        </div>
      </div>
      <div class="flex flex-row items-center justify-between gap-1 mt-4">
        <div>Date Joined</div>
        <div class="text-gray-700 font-semibold">
          {{ selectedUser?.joinedDate | date }}
        </div>
      </div>
    </div>
    <p-button
      styleClass="w-full! py-3! shadow-lg! bg-sky-700! border-none!"
      class="w-full"
      severity="info"
      iconPos="right"
      label="Update Profile"
      icon="pi pi-check-circle"
    ></p-button>
  </div>`,
  styleUrl: './personal-info.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonalInfo implements OnInit, OnDestroy {
  private readonly loadingService = inject(LoadingService);
  private readonly userService = inject(UserService);
  private readonly cdr = inject(ChangeDetectorRef);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  FG!: FormGroup;
  selectedUser: any;

  ngOnInit(): void {
    this.GetData();
  }

  GetData() {
    this.loadingService.start();
    this.userService
      .GetOne({
        Page: 1,
        PageSize: 1,
        OrderBy: null,
        Includes: 'Departments, Hod',
        Select: null,
        Filter: `Id=${this.userService.currentUser?.userId}`,
      })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();
          // if (res) this.FG.patchValue(res);
          this.selectedUser = res;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loadingService.stop();
        },
      });
  }

  ngOnDestroy(): void {}
}
