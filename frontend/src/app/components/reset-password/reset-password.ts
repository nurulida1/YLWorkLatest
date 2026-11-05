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
      <!-- DESKTOP -->
      <div class="hidden lg:grid grid-cols-12 h-screen">
        <!-- LEFT: RESET PASSWORD FORM -->
        <div
          class="col-span-6 h-full w-full flex items-center px-16 xl:px-24 2xl:px-32"
        >
          <div class="w-full max-w-xl mx-auto">
            <ng-container *ngIf="!doneReset; else desktopDoneTemplate">
              <!-- BRAND -->
              <div
                class="inline-flex items-center gap-3
                px-4 py-2 rounded-full
                bg-white border border-gray-200
                shadow-sm yl-login-brand"
              >
                <div
                  class="w-7 h-7 rounded-full bg-blue-50
                  flex items-center justify-center"
                >
                  <i class="pi pi-circle-fill text-blue-800! text-[9px]!"></i>
                </div>

                <span class="font-bold text-gray-900">YL WORKS</span>

                <span class="text-gray-300">|</span>

                <span class="text-gray-500 text-sm">Internal</span>
              </div>

              <!-- HEADING -->
              <div class="mt-10 yl-login-heading">
                <h1
                  class="text-4xl xl:text-5xl
                  font-bold tracking-tight
                  text-gray-950 leading-tight"
                >
                  Create a New
                  <span class="text-[#2148BC]">Password.</span>
                </h1>

                <p
                  class="text-gray-500 text-base xl:text-lg
                  mt-4 leading-relaxed max-w-lg"
                >
                  Choose a strong password to protect your YL Works account.
                  Make sure it is different from your previous password.
                </p>
              </div>

              <!-- FORM -->
              <div
                [formGroup]="FG"
                class="flex flex-col gap-5 mt-9 yl-login-form"
              >
                <!-- NEW PASSWORD -->
                <div class="flex flex-col gap-2">
                  <label class="text-gray-600 text-sm font-medium pl-2">
                    NEW PASSWORD
                  </label>

                  <p-password
                    formControlName="newPassword"
                    [toggleMask]="true"
                    [feedback]="true"
                    styleClass="w-full!"
                    inputStyleClass="
                      w-full!
                      bg-gray-50!
                      pl-5!
                      pr-12!
                      rounded-2xl!
                      py-4!
                      placeholder:text-gray-400!
                      border-gray-200!
                      focus:border-blue-500!
                      focus:bg-white!
                      transition-all
                    "
                    placeholder="Enter your new password"
                  ></p-password>

                  <div
                    *ngIf="
                      FG.get('newPassword')?.touched &&
                      FG.get('newPassword')?.invalid
                    "
                    class="text-red-500 text-xs pl-2"
                  >
                    <div *ngIf="FG.get('newPassword')?.errors?.['required']">
                      New password is required.
                    </div>
                  </div>
                </div>

                <!-- CONFIRM PASSWORD -->
                <div class="flex flex-col gap-2">
                  <label class="text-gray-600 text-sm font-medium pl-2">
                    CONFIRM PASSWORD
                  </label>

                  <p-password
                    formControlName="confirmPassword"
                    [toggleMask]="true"
                    [feedback]="false"
                    styleClass="w-full!"
                    inputStyleClass="
                      w-full!
                      bg-gray-50!
                      pl-5!
                      pr-12!
                      rounded-2xl!
                      py-4!
                      placeholder:text-gray-400!
                      border-gray-200!
                      focus:border-blue-500!
                      focus:bg-white!
                      transition-all
                    "
                    placeholder="Re-enter your new password"
                  ></p-password>

                  <div
                    *ngIf="
                      FG.get('confirmPassword')?.touched &&
                      FG.get('confirmPassword')?.invalid
                    "
                    class="text-red-500 text-xs pl-2"
                  >
                    <div
                      *ngIf="FG.get('confirmPassword')?.errors?.['required']"
                    >
                      Confirm password is required.
                    </div>
                  </div>

                  <div *ngIf="errorMessage" class="text-xs text-red-500 pl-2">
                    {{ errorMessage }}
                  </div>
                </div>
              </div>

              <!-- RESET BUTTON -->
              <p-button
                class="yl-login-button"
                (onClick)="ResetPassword()"
                label="Reset Password"
                icon="pi pi-arrow-right"
                iconPos="right"
                [rounded]="true"
                styleClass="
                  shadow-lg!
                  w-full!
                  mt-7!
                  bg-[#2148BC]!
                  hover:bg-[#193a9f]!
                  text-white!
                  border-none!
                  py-4!
                  px-5!
                  transition-all!
                "
              ></p-button>

              <!-- BACK TO LOGIN -->
              <div
                class="flex items-center justify-center gap-2
                mt-6 text-sm"
              >
                <span class="text-gray-500"> Remember your password? </span>

                <a
                  class="cursor-pointer
                  text-[#2148BC]
                  font-semibold
                  hover:underline"
                  [routerLink]="'/login'"
                >
                  Sign In
                </a>
              </div>

              <!-- FOOTER -->
              <div
                class="yl-login-footer
                flex items-center justify-center gap-2
                mt-8 text-gray-400 text-xs"
              >
                <i class="pi pi-shield text-blue-700!"></i>

                <span> Protected by YL Works Enterprise Security </span>
              </div>
            </ng-container>

            <!-- DESKTOP SUCCESS -->
            <ng-template #desktopDoneTemplate>
              <div class="flex flex-col items-center text-center">
                <div
                  class="w-24 h-24 rounded-3xl
                  bg-green-50 border border-green-100
                  flex items-center justify-center
                  yl-success-icon"
                >
                  <i class="pi pi-check-circle text-green-600! text-5xl!"></i>
                </div>

                <h1
                  class="text-4xl xl:text-5xl
                  font-bold tracking-tight
                  text-gray-950 mt-8"
                >
                  Password
                  <span class="text-[#2148BC]">Changed!</span>
                </h1>

                <p
                  class="text-gray-500 text-base
                  mt-4 leading-relaxed max-w-md"
                >
                  Your password has been successfully updated. You can now sign
                  in using your new password.
                </p>

                <p-button
                  label="Back to Login"
                  icon="pi pi-arrow-right"
                  iconPos="right"
                  [rounded]="true"
                  styleClass="
                    w-full!
                    mt-8!
                    bg-[#2148BC]!
                    hover:bg-[#193a9f]!
                    text-white!
                    border-none!
                    py-4!
                  "
                  [routerLink]="'/login'"
                ></p-button>

                <div
                  class="flex items-center justify-center
                  gap-2 mt-8 text-gray-400 text-xs"
                >
                  <i class="pi pi-shield text-blue-700!"></i>

                  <span> Protected by YL Works Enterprise Security </span>
                </div>
              </div>
            </ng-template>
          </div>
        </div>

        <!-- RIGHT: PREVIEW PANEL -->
        <div class="col-span-6 h-full w-full p-8">
          <div
            class="relative w-full h-full overflow-hidden
            rounded-[2rem] yl-preview
            border border-gray-200 bg-slate-950 shadow-2xl"
          >
            <img
              src="assets/screen.png"
              alt=""
              class="absolute inset-0 h-full w-full
              object-cover scale-110 blur-md"
            />

            <div
              class="absolute inset-0
              bg-gradient-to-br from-blue-950/80
              via-slate-950/35
              to-slate-950/70"
            ></div>

            <!-- GLOW -->
            <div
              class="absolute -top-32 -right-32
              w-96 h-96 rounded-full
              bg-blue-500/20 blur-3xl yl-preview-glow"
            ></div>

            <div
              class="absolute -bottom-32 -left-32
              w-96 h-96 rounded-full
              bg-blue-700/20 blur-3xl yl-preview-glow"
            ></div>

            <div class="absolute inset-0 z-10">
              <!-- TOP BRAND -->
              <div
                class="absolute top-8 left-10 right-10
                flex items-center justify-between"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="w-9 h-9 rounded-xl
                    bg-white/10 border border-white/15
                    backdrop-blur-md
                    flex items-center justify-center"
                  >
                    <i class="pi pi-circle-fill text-white! text-xs!"></i>
                  </div>

                  <div>
                    <div class="text-white font-semibold">YL Works</div>

                    <div class="text-white/50 text-xs">
                      Your workspace, connected.
                    </div>
                  </div>
                </div>

                <div
                  class="flex items-center gap-2
                  rounded-full bg-black/20
                  border border-white/10
                  backdrop-blur-xl px-4 py-2
                  yl-preview-status"
                >
                  <span
                    class="w-2 h-2 rounded-full
                    bg-green-400
                    shadow-[0_0_10px_rgba(74,222,128,.8)]"
                  ></span>

                  <span class="text-white/80 text-xs"> Workspace Online </span>
                </div>
              </div>

              <!-- CENTER CONTENT -->
              <div
                class="absolute inset-0
                flex items-center justify-center px-12"
              >
                <div class="max-w-lg text-center yl-reset-content">
                  <div
                    class="w-28 h-28 mx-auto
                    rounded-[2rem]
                    bg-white/10
                    border border-white/20
                    backdrop-blur-xl
                    flex items-center justify-center
                    shadow-2xl"
                  >
                    <i class="pi pi-lock text-white! text-5xl!"></i>
                  </div>

                  <h2
                    class="text-white text-4xl xl:text-5xl
                    font-bold tracking-tight mt-8"
                  >
                    Your Security,
                    <span class="text-blue-300">Your Control.</span>
                  </h2>

                  <p
                    class="text-white/60 text-base xl:text-lg
                    leading-relaxed mt-5 max-w-md mx-auto"
                  >
                    A strong password helps protect your account, company
                    information, and connected workspace.
                  </p>

                  <div
                    class="mt-9 inline-flex items-center gap-4
                    bg-white/10 border border-white/15
                    rounded-2xl px-5 py-4
                    backdrop-blur-md text-left"
                  >
                    <div
                      class="w-11 h-11 rounded-xl
                      bg-blue-500/20
                      flex items-center justify-center"
                    >
                      <i class="pi pi-shield text-blue-300! text-xl!"></i>
                    </div>

                    <div>
                      <div class="text-white font-semibold text-sm">
                        Account Protection
                      </div>

                      <div class="text-white/50 text-xs mt-1">
                        Keep your credentials safe and private.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- BOTTOM -->
              <div
                class="absolute bottom-8 left-10 right-10
                flex items-center justify-between
                yl-preview-bottom"
              >
                <div>
                  <div class="text-white font-semibold">
                    Everything your team needs.
                  </div>

                  <div class="text-white/50 text-xs mt-1">
                    Projects · People · Tasks · Communication
                  </div>
                </div>

                <div class="text-white/40 text-xs">YL Systems</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- MOBILE -->
      <div
        class="h-screen lg:hidden flex flex-col
        items-center justify-between relative
        overflow-hidden bg-[#1E3C92]"
      >
        <!-- BACKGROUND -->
        <div
          class="absolute -top-12 -right-16
          w-64 h-64 bg-[#ffffff0d]
          rounded-full blur-md"
        ></div>

        <div
          class="absolute top-48 -left-12
          w-48 h-48 bg-[#60a5fa1a]
          rounded-full blur"
        ></div>

        <!-- HEADER -->
        <div class="h-[30%] w-full flex flex-col gap-7 p-10">
          <div class="flex flex-row items-center justify-between">
            <div class="flex flex-row items-center gap-3">
              <div
                class="w-10 h-10 rounded-xl
                flex items-center justify-center
                bg-white/10 border border-white/20"
              >
                <div class="font-extrabold text-white text-shadow-md">YL</div>
              </div>

              <div class="text-white tracking-wide">WORKS ENTERPRISE</div>
            </div>

            <a
              [routerLink]="'/login'"
              class="flex items-center gap-2
              px-3 py-2 rounded-full
              bg-white/10 border border-white/20
              text-white/80 text-xs"
            >
              <i class="pi pi-chevron-left"></i>
              Sign In
            </a>
          </div>

          <div
            class="font-bold text-3xl
            text-white tracking-wide w-[90%]"
          >
            Secure your account with a new password.
          </div>
        </div>

        <!-- MOBILE FORM CARD -->
        <div class="h-[70%] w-full">
          <div
            class="bg-white h-full p-6
            flex flex-col items-center gap-2
            rounded-t-4xl overflow-y-auto"
          >
            <ng-container *ngIf="!doneReset; else mobileDoneTemplate">
              <div class="h-1 w-15 rounded-full bg-gray-200"></div>

              <!-- ICON -->
              <div
                class="mt-5 w-16 h-16
                bg-blue-50 rounded-full
                flex items-center justify-center
                border border-blue-100"
              >
                <i class="pi pi-key text-blue-700! text-2xl!"></i>
              </div>

              <!-- TITLE -->
              <div class="font-extrabold text-3xl mt-4 text-gray-800">
                Reset Password
              </div>

              <span
                class="text-gray-500 text-sm
                mb-4 text-center w-[90%]"
              >
                Create a new password to regain access to your account.
              </span>

              <!-- FORM -->
              <div
                [formGroup]="FG"
                class="flex flex-col mt-3 gap-5 w-full px-3"
              >
                <!-- NEW PASSWORD -->
                <div class="flex flex-col gap-2">
                  <label class="text-gray-600 text-sm font-medium pl-2">
                    NEW PASSWORD
                  </label>

                  <p-password
                    formControlName="newPassword"
                    [toggleMask]="true"
                    [feedback]="true"
                    styleClass="w-full!"
                    inputStyleClass="
                      w-full!
                      bg-gray-50!
                      pl-5!
                      pr-12!
                      rounded-2xl!
                      py-4!
                      placeholder:text-gray-400!
                      border-gray-200!
                    "
                    placeholder="Enter new password"
                  ></p-password>

                  <div
                    *ngIf="
                      FG.get('newPassword')?.touched &&
                      FG.get('newPassword')?.invalid
                    "
                    class="text-red-500 text-xs pl-2"
                  >
                    <div *ngIf="FG.get('newPassword')?.errors?.['required']">
                      New password is required.
                    </div>
                  </div>
                </div>

                <!-- CONFIRM PASSWORD -->
                <div class="flex flex-col gap-2">
                  <label class="text-gray-600 text-sm font-medium pl-2">
                    CONFIRM PASSWORD
                  </label>

                  <p-password
                    formControlName="confirmPassword"
                    [toggleMask]="true"
                    [feedback]="false"
                    styleClass="w-full!"
                    inputStyleClass="
                      w-full!
                      bg-gray-50!
                      pl-5!
                      pr-12!
                      rounded-2xl!
                      py-4!
                      placeholder:text-gray-400!
                      border-gray-200!
                    "
                    placeholder="Confirm new password"
                  ></p-password>

                  <div
                    *ngIf="
                      FG.get('confirmPassword')?.touched &&
                      FG.get('confirmPassword')?.invalid
                    "
                    class="text-red-500 text-xs pl-2"
                  >
                    <div
                      *ngIf="FG.get('confirmPassword')?.errors?.['required']"
                    >
                      Confirm password is required.
                    </div>
                  </div>

                  <div *ngIf="errorMessage" class="text-xs text-red-500 pl-2">
                    {{ errorMessage }}
                  </div>
                </div>
              </div>

              <!-- BUTTON -->
              <p-button
                label="Reset Password"
                (onClick)="ResetPassword()"
                [rounded]="true"
                class="w-full! mt-5 px-4!"
                styleClass="
                  w-full!
                  bg-[#2148BC]!
                  hover:bg-[#193a9f]!
                  text-white!
                  border-none!
                  p-5!
                  shadow-md!
                "
                icon="pi pi-arrow-right"
                iconPos="right"
              ></p-button>

              <!-- FOOTER -->
              <span class="text-gray-500 text-sm text-center mt-4">
                Remember your password?

                <b class="text-blue-700 cursor-pointer" [routerLink]="'/login'">
                  Sign In
                </b>
              </span>

              <div
                class="flex items-center justify-center
                gap-2 mt-5 text-gray-400 text-xs"
              >
                <i class="pi pi-shield text-blue-700!"></i>

                <span> Protected by YL Works Enterprise Security </span>
              </div>
            </ng-container>

            <!-- MOBILE SUCCESS -->
            <ng-template #mobileDoneTemplate>
              <div
                class="flex flex-col items-center
                justify-center text-center w-full
                flex-1 px-3"
              >
                <div
                  class="w-24 h-24 rounded-3xl
                  bg-green-50 border border-green-100
                  flex items-center justify-center
                  yl-success-icon"
                >
                  <i class="pi pi-check-circle text-green-600! text-5xl!"></i>
                </div>

                <div class="font-extrabold text-3xl mt-8 text-gray-800">
                  Password Changed!
                </div>

                <p
                  class="text-gray-500 text-sm
                  mt-3 leading-relaxed"
                >
                  Your password has been changed successfully. You can now sign
                  in with your new password.
                </p>

                <p-button
                  label="Back to Login"
                  icon="pi pi-arrow-right"
                  iconPos="right"
                  [rounded]="true"
                  class="w-full! mt-8 px-2!"
                  styleClass="
                    w-full!
                    bg-[#2148BC]!
                    hover:bg-[#193a9f]!
                    text-white!
                    border-none!
                    p-5!
                  "
                  [routerLink]="'/login'"
                ></p-button>

                <div
                  class="flex items-center justify-center
                  gap-2 mt-6 text-gray-400 text-xs"
                >
                  <i class="pi pi-shield text-blue-700!"></i>

                  <span> Protected by YL Works Enterprise Security </span>
                </div>
              </div>
            </ng-template>
          </div>
        </div>
      </div>

      <!-- EXPIRED TOKEN OVERLAY -->
      <div
        *ngIf="expiredToken"
        class="fixed inset-0 z-50
        flex items-center justify-center
        bg-black/40 backdrop-blur-sm
        p-5 yl-expired-overlay"
      >
        <div
          class="flex flex-col items-center
          text-center gap-4
          w-full max-w-md
          p-8 bg-white
          rounded-3xl shadow-2xl
          border border-gray-100
          yl-expired-card"
        >
          <div
            class="w-16 h-16 rounded-2xl
            bg-red-50 border border-red-100
            flex items-center justify-center"
          >
            <i class="pi pi-clock text-red-500! text-3xl!"></i>
          </div>

          <div class="font-bold text-xl text-gray-900">Reset Link Expired</div>

          <div class="text-gray-500 text-sm leading-relaxed">
            Your password reset link has expired. Please request a new password
            reset link to continue.
          </div>

          <div class="border-t border-gray-100 w-full pt-4">
            <p-button
              label="Request New Reset Link"
              icon="pi pi-arrow-right"
              iconPos="right"
              [rounded]="true"
              styleClass="
                w-full!
                bg-[#2148BC]!
                hover:bg-[#193a9f]!
                text-white!
                border-none!
                py-3!
              "
              [routerLink]="'/forgot-password'"
            ></p-button>
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
    this.activatedRoute.queryParamMap
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((params) => {
        const token = params.get('token');

        this.FG = new FormGroup({
          token: new FormControl<string | null>(token),
          newPassword: new FormControl<string | null>(
            null,
            Validators.required,
          ),
          confirmPassword: new FormControl<string | null>(
            null,
            Validators.required,
          ),
        });
      });
  }

  ResetPassword(): void {
    if (this.FG.valid) {
      this.errorMessage = '';

      if (
        this.FG.get('newPassword')?.value !==
        this.FG.get('confirmPassword')?.value
      ) {
        this.errorMessage = 'Passwords do not match.';
        this.cdr.detectChanges();
        return;
      }

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

            this.loadingService.stop();
          },
          error: () => {
            this.loadingService.stop();
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
