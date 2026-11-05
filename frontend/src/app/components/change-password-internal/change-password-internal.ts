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
import { RadioButtonModule } from 'primeng/radiobutton';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-change-password-internal',
  imports: [
    CommonModule,
    PasswordModule,
    ButtonModule,
    ReactiveFormsModule,
    RadioButtonModule,
    RouterLink,
  ],
  template: `
    <div class="w-full min-h-screen flex flex-col">
      <div
        class="flex flex-row items-center justify-between border-b p-5 bg-white border-gray-300 shadow-sm"
      >
        <div class="pi pi-arrow-left" [routerLink]="'/profile-settings'"></div>
        <div class="text-xl font-bold text-blue-800">Change Password</div>
        <i class="pi pi-ellipsis-v"></i>
      </div>
      <div class="p-8 flex flex-col gap-5">
        <div class="text-center text-gray-500">
          Please enter your current password and choose a new, strong password
          to secure your account.
        </div>

        <div
          class="flex flex-col gap-4 p-5 bg-white border border-gray-200 rounded-md"
          [formGroup]="FG"
        >
          <div class="flex flex-col gap-2">
            <div class="text-gray-600 text-sm">New Password</div>
            <p-password
              formControlName="newPassword"
              [toggleMask]="true"
              class="w-full"
              inputStyleClass="w-full! py-3!"
              styleClass="w-full!"
              placeholder="Enter new password"
              [feedback]="true"
            />
          </div>
          <div
            class="mt-4 text-sm gap-3 border border-gray-300 bg-gray-100 rounded-md p-3 flex flex-col"
          >
            <div class="text-gray-600 font-semibold">
              Password Requirements:
            </div>
            <div class="flex flex-row items-center gap-3">
              <!-- <p-radiobutton></p-radiobutton> -->
              <span class="text-gray-600">At least 8 characters</span>
            </div>
            <div class="flex flex-row items-center gap-3">
              <!-- <p-radiobutton></p-radiobutton> -->
              <span class="text-gray-600"
                >Contains uppercase and lowercase letters</span
              >
            </div>
            <div class="flex flex-row items-center gap-3">
              <!-- <p-radiobutton></p-radiobutton> -->
              <span class="text-gray-600">Contains at least one number</span>
            </div>
          </div>
          <div class="mt-3 flex flex-col gap-2">
            <div class="text-gray-600 text-sm">Confirm New Password</div>
            <p-password
              formControlName="confirmPassword"
              [toggleMask]="true"
              class="w-full"
              inputStyleClass="w-full! py-3!"
              styleClass="w-full!"
              placeholder="Confirm new password"
              [feedback]="true"
            />
          </div>
          <p-button
            (onClick)="ChangePassword()"
            label="Update Password"
            severity="info"
            styleClass="w-full rounded-sm! mt-4 py-3! bg-blue-900! border-none!"
          ></p-button>
          <p-button
            [routerLink]="'/profile-settings'"
            label="Cancel"
            severity="secondary"
            [outlined]="true"
            styleClass="w-full rounded-sm! py-3!"
          ></p-button>
        </div>
      </div>
    </div>
  `,
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
        Validators.required,
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
