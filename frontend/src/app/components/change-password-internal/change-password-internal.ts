import { CommonModule, Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { UserService } from '../../services/userService.service';
import { LoadingService } from '../../services/loading.service';
import { ValidateAllFormFields } from '../../shared/helpers/helpers';
import { Subject, takeUntil } from 'rxjs';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-change-password-internal',
  imports: [CommonModule, PasswordModule, ButtonModule, ReactiveFormsModule],
  template: `<div
    class="relative w-full min-h-[92.2vh] bg-cover bg-center flex justify-center"
    [ngClass]="{
      'bg-gray-100 items-center': isMobile,
      'bg-white/70 p-3 pt-10': !isMobile
    }"
  >
    <div
      class="w-[50%] px-10 pt-5 pb-10 shadow-lg rounded-2xl border border-gray-300 bg-white h-fit"
      *ngIf="!isMobile"
    >
      <div class="flex flex-row justify-center items-center gap-2">
        <i class="pi pi-lock !text-shadow-md"></i>
        <div class="text-gray-600 font-bold tracking-widest text-xl">
          Change Password
        </div>
      </div>
      <div [formGroup]="FG" class="w-full flex flex-col">
        <div class="flex flex-col gap-2 mt-5">
          <div class="text-sm text-gray-600 tracking-wider font-medium">
            New Password
          </div>
          <p-password
            formControlName="newPassword"
            [toggleMask]="true"
            class="w-full"
            inputStyleClass="!w-full"
            styleClass="!w-full"
            [feedback]="false"
          />
          <div
            *ngIf="
              FG.get('newPassword')?.touched && FG.get('newPassword')?.invalid
            "
            class="text-red-500 text-xs"
          >
            <div *ngIf="FG.get('newPassword')?.errors?.['required']">
              New password is required.
            </div>
          </div>
        </div>
        <div class="flex flex-col gap-2 mt-5">
          <div class="text-sm text-gray-600 tracking-wider font-medium">
            Confirm Password
          </div>
          <p-password
            formControlName="confirmPassword"
            [toggleMask]="true"
            class="w-full"
            inputStyleClass="!w-full"
            styleClass="!w-full"
            [feedback]="false"
          />
          <div
            *ngIf="
              FG.get('confirmPassword')?.touched &&
              FG.get('confirmPassword')?.invalid
            "
            class="text-red-500 text-xs"
          >
            <div *ngIf="FG.get('confirmPassword')?.errors?.['required']">
              Confirm password is required.
            </div>
            <div
              *ngIf="
                FG.get('confirmPassword')?.value &&
                FG.get('confirmPassword')?.value !==
                  FG.get('newPassword')?.value
              "
            >
              Passwords do not match.
            </div>
          </div>
        </div>
      </div>
      <div class="border-b mt-5 mb-5 border-gray-300"></div>
      <div class="w-full">
        <p-button
          label="Change Password"
          severity="info"
          styleClass="w-full !tracking-wide !py-3 !shadow-md"
        ></p-button>
      </div>
    </div>
    <div class="relative w-full min-h-screen flex flex-col" *ngIf="isMobile">
      <div
        class="flex flex-row items-center justify-between p-3 py-5 border border-white/10 shadow-md"
      >
        <div (click)="BackButton()">
          <svg
            class="w-6 h-6 text-gray-500"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M14.5 8.046H11V6.119c0-.921-.9-1.446-1.524-.894l-5.108 4.49a1.2 1.2 0 0 0 0 1.739l5.108 4.49c.624.556 1.524.027 1.524-.893v-1.928h2a3.023 3.023 0 0 1 3 3.046V19a5.593 5.593 0 0 0-1.5-10.954Z"
            />
          </svg>
        </div>
        <div class="tracking-widest">Change Password</div>
        <div></div>
      </div>
      <div [formGroup]="FG" class="w-full flex flex-col px-6">
        <div class="flex flex-col gap-2 mt-5">
          <div class="text-gray-600 tracking-wider font-medium">
            New Password
          </div>
          <p-password
            formControlName="newPassword"
            [toggleMask]="true"
            class="w-full"
            inputStyleClass="!w-full"
            styleClass="!w-full"
            [feedback]="false"
          />
          <div
            *ngIf="
              FG.get('newPassword')?.touched && FG.get('newPassword')?.invalid
            "
            class="text-red-500 text-xs"
          >
            <div *ngIf="FG.get('newPassword')?.errors?.['required']">
              New password is required.
            </div>
          </div>
        </div>
        <div class="flex flex-col gap-2 mt-5">
          <div class="text-gray-600 tracking-wider font-medium">
            Confirm Password
          </div>
          <p-password
            formControlName="confirmPassword"
            [toggleMask]="true"
            class="w-full"
            inputStyleClass="!w-full"
            styleClass="!w-full"
            [feedback]="false"
          />
          <div
            *ngIf="
              FG.get('confirmPassword')?.touched &&
              FG.get('confirmPassword')?.invalid
            "
            class="text-red-500 text-xs"
          >
            <div *ngIf="FG.get('confirmPassword')?.errors?.['required']">
              Confirm password is required.
            </div>
            <div
              *ngIf="
                FG.get('confirmPassword')?.value &&
                FG.get('confirmPassword')?.value !==
                  FG.get('newPassword')?.value
              "
            >
              Passwords do not match.
            </div>
          </div>
        </div>
      </div>

      <div class="pt-6 px-6 w-full">
        <p-button
          label="Change Password"
          severity="info"
          styleClass="w-full !tracking-wide !py-3 !shadow-md"
        ></p-button>
      </div>
    </div>
  </div> `,
  styleUrl: './change-password-internal.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangePasswordInternal implements OnInit, OnDestroy {
  private readonly userService = inject(UserService);
  private readonly loadingService = inject(LoadingService);
  private readonly location = inject(Location);
  private readonly messageService = inject(MessageService);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  FG!: FormGroup;
  userId: string | null = null;
  isMobile = window.innerWidth < 770;

  @HostListener('window:resize', [])
  onResize() {
    this.isMobile = window.innerWidth < 770;
  }

  constructor() {
    this.FG = new FormGroup({
      userId: new FormControl<string | null>(null, Validators.required),
      newPassword: new FormControl<string | null>(null, Validators.required),
      confirmPassword: new FormControl<string | null>(
        null,
        Validators.required
      ),
    });
  }

  ngOnInit(): void {
    this.userId = this.userService.currentUser?.userId ?? null;
    this.FG.get('id')?.patchValue(this.userId);
  }

  BackButton() {
    this.location.back();
  }

  ChangePassword() {
    if (this.FG.valid) {
      this.loadingService.start();
      this.userService
        .ChangePassword(this.FG.value)
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe({
          next: (res) => {
            this.loadingService.stop();
            if (res.success) {
              this.FG.get('newPassword')?.patchValue(null);
              this.FG.get('confirmPassword')?.patchValue(null);
              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: res.message,
              });
            } else {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: res.message,
              });
            }
          },
          error: (err) => {
            this.loadingService.stop();
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: err,
            });
          },
        });
    }
    ValidateAllFormFields(this.FG);
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
