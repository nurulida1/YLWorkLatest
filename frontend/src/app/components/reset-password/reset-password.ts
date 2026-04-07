import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { LoadingService } from '../../services/loading.service';
import { UserService } from '../../services/userService.service';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ValidateAllFormFields } from '../../shared/helpers/helpers';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-reset-password',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    PasswordModule,
    RouterLink,
  ],
  template: `
    <div class="relative w-full min-h-screen">
      <div class="p-3 px-6 pt-10">
        <ng-container *ngIf="!doneReset; else doneResetTemplate">
          <div class="flex flex-col">
            <div class="flex justify-center items-center pb-10">
              <img
                src="assets/password-protection.png"
                alt=""
                class="w-[120px]"
              />
            </div>
            <div class="font-medium text-2xl text-gray-600 tracking-wider pb-2">
              Create New Password
            </div>
            <div class="text-gray-500 tracking-wide">
              This password should be different from the previous password.
            </div>
            <div [formGroup]="FG" class="pt-10 flex flex-col gap-5">
              <div class="flex flex-col gap-1">
                <div class="text-gray-600 font-medium tracking-wider">
                  New Password
                </div>
                <p-password
                  formControlName="newPassword"
                  [toggleMask]="true"
                  class="w-full"
                  inputStyleClass="!w-full"
                  styleClass="!w-full"
                  [feedback]="true"
                />
                <div
                  *ngIf="
                    FG.get('newPassword')?.touched &&
                    FG.get('newPassword')?.invalid
                  "
                  class="text-red-500 text-xs"
                >
                  <div *ngIf="FG.get('newPassword')?.errors?.['required']">
                    New password is required.
                  </div>
                </div>
              </div>
              <div class="flex flex-col gap-1">
                <div class="text-gray-600 font-medium tracking-wider">
                  Confirm Password
                </div>
                <p-password
                  formControlName="confirmPassword"
                  [toggleMask]="true"
                  class="w-full"
                  inputStyleClass="!w-full"
                  styleClass="!w-full"
                  [feedback]="true"
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
                </div>
                <div
                  *ngIf="errorMessage"
                  class="text-xs text-red-500 tracking-wide"
                >
                  {{ errorMessage }}
                </div>
              </div>
            </div>
            <div class="pt-6">
              <p-button
                (onClick)="ResetPassword()"
                label="Reset Password"
                severity="info"
                styleClass="tracking-wider !py-3 w-full"
              ></p-button>
            </div></div
        ></ng-container>
        <ng-template #doneResetTemplate>
          <div class="flex flex-col items-center justify-center pt-30">
            <div>
              <img src="assets/circle-tick.png" alt="" class="w-[150px]" />
            </div>
            <div class="pt-10 font-medium tracking-wider text-3xl px-6">
              Password Changed !
            </div>
            <div class="text-gray-500 tracking-wider pt-2 px-6 text-center">
              Your password has been changed successfully.
            </div>
          </div>
          <div class="px-6 fixed bottom-0 left-0 right-0 w-full pb-20">
            <p-button
              label="Back to Login"
              styleClass="!w-full !py-3 tracking-wider"
              [routerLink]="'/login'"
            ></p-button>
          </div>
        </ng-template>
        <div
          *ngIf="expiredToken"
          class="absolute top-0 left-0 backdrop-blur-xs w-full min-h-screen opacity-0 animate-fadeIn
"
        >
          <div
            class="flex flex-col justify-center items-center w-full min-h-screen"
          >
            <div
              class="flex flex-col tracking-wider gap-3 text-center justify-center items-center w-[90%] h-fit p-3 bg-gray-100 rounded-md"
            >
              <div class="font-medium text-lg">Reset link expired!</div>
              <div class="text-gray-500 text-sm">
                Your password reset link has expired. Please request a new one
                to continue.
              </div>
              <div class="border-t w-full border-gray-300">
                <p-button
                  label="Ok"
                  severity="info"
                  [text]="true"
                  styleClass="w-full !py-3"
                  [routerLink]="'/confirm-email'"
                ></p-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './reset-password.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPassword implements OnDestroy {
  private readonly loadingService = inject(LoadingService);
  private readonly userService = inject(UserService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  FG!: FormGroup;
  doneReset: boolean = false;
  expiredToken: boolean = false;
  errorMessage: string = '';

  constructor() {
    this.activatedRoute.queryParamMap.subscribe((params) => {
      const token = params.get('token');

      this.FG = new FormGroup({
        token: new FormControl<string | null>(token),
        newPassword: new FormControl<string | null>(null, Validators.required),
        confirmPassword: new FormControl<string | null>(
          null,
          Validators.required
        ),
      });
    });
  }

  ResetPassword() {
    if (this.FG.valid) {
      this.errorMessage = '';
      if (
        this.FG.get('newPassword')?.value !==
        this.FG.get('confirmPassword')?.value
      ) {
        this.errorMessage = 'Passwords do not match.';
        this.cdr.detectChanges();
        return;
      } else {
        this.loadingService.start();
        this.userService
          .ResetPassword(this.FG.value)
          .pipe(takeUntil(this.ngUnsubscribe))
          .subscribe({
            next: (res) => {
              if (res.success) {
                this.doneReset = true;
                this.cdr.markForCheck();
              } else {
                this.expiredToken = true;
                this.cdr.detectChanges();
              }
            },
            error: (err) => {
              this.loadingService.stop();
            },
            complete: () => {
              this.loadingService.stop();
            },
          });
      }
    }

    ValidateAllFormFields(this.FG);
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
