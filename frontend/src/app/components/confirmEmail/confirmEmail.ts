import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  inject,
  OnDestroy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { LoadingService } from '../../services/loading.service';
import { UserService } from '../../services/userService.service';
import { Subject } from 'rxjs';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-confirm-email',
  imports: [
    CommonModule,
    InputTextModule,
    ButtonModule,
    FormsModule,
    RouterLink,
    DialogModule,
  ],
  template: `
    <div
      class="h-screen overflow-hidden w-full bg-[#F2F4F8] flex flex-col justify-center items-center"
    >
      <div
        class="w-[50%] xl:w-[32%] 2xl:w-[30%] px-8 py-10 shadow-sm bg-white border border-gray-200 rounded-2xl flex flex-col"
      >
        <div class="font-semibold tracking-wide text-2xl text-gray-700">
          Forgot Password ?
        </div>
        <div class="pt-1 text-gray-500 text-sm tracking-wide">
          No worries! Enter your email and we'll send you reset instructions.
        </div>
        <div class="pt-8 flex flex-col gap-6">
          <div class="flex flex-col gap-1">
            <label for="" class="text-sm text-gray-600 tracking-wide"
              >Email Address</label
            >
            <input
              type="text"
              pInputText
              class="w-full !py-3"
              [(ngModel)]="email"
            />
          </div>
        </div>
        <div class="pt-5">
          <p-button
            label="Sent Reset Link"
            styleClass="!bg-[#4D46F7] !w-full !border-none !py-3 !tracking-wide"
          ></p-button>
        </div>
        <div class="pt-5 flex flex-row justify-center items-center gap-1">
          <i
            class="pi pi-arrow-left !text-sm !text-gray-500
"
          ></i>
          <div class="text-center  text-gray-500 text-sm">
            Back to
            <span
              class="text-[#4D46F7] cursor-pointer hover:underline"
              [routerLink]="'/login'"
              >Login</span
            >
          </div>
        </div>
      </div>
    </div>
    <!-- <ng-container *ngIf="!emailSent; else emailSentTemplate">
      <div class="w-full min-h-screen flex flex-col p-2 pt-3" *ngIf="isMobile">
        <div class="flex flex-row items-center gap-2" [routerLink]="'/login'">
          <svg
            class="w-6 h-6 text-gray-800"
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
          <div class="text-gray-600 font-medium tracking-wide">Back</div>
        </div>
        <div class="pt-10 font-medium tracking-widest text-lg px-3">
          Reset Password
        </div>
        <div class="pt-3 px-3 text-gray-500">
          Enter the email associated with your account and we'll send an email
          with instructions to reset your password.
        </div>
        <div class="pt-6 px-3 text-gray-600 tracking-wider font-medium text-sm">
          Email address
        </div>
        <div class="px-3 pt-2">
          <input type="text" class="w-full" pInputText [(ngModel)]="email" />
          <div *ngIf="invalidEmail" class="text-sm text-red-500 tracking-wide">
            Invalid email
          </div>
        </div>
        <div class="pt-4 px-3 w-full">
          <p-button
            (onClick)="SendEmail()"
            label="Send Instructions"
            styleClass="w-full tracking-wider !py-3"
            severity="info"
          ></p-button>
        </div>
      </div>
      <div *ngIf="!isMobile" class="flex flex-row w-full min-h-screen">
        <div
          class="relative flex-1 border-r overflow-hidden border-gray-300 min-h-screen p-2 flex items-center justify-center"
        >
          <img src="assets/forgot-password.png" alt="" class="w-[400px]" />
        </div>
        <div class="flex-1 min-h-screen p-2 flex justify-center items-center">
          <div class="w-[70%] h-[50%]">
            <div
              class="flex flex-col border px-3 py-7 rounded-lg border-gray-300 shadow-lg"
            >
              <div class="p-2 text-2xl text-gray-700 tracking-wider font-bold">
                Forgot Password ?
              </div>
              <div class="px-3 text-xs tracking-wide text-gray-500">
                Enter the email associated with your account and we'll send an
                email with instructions to reset your password.
              </div>
              <div
                class="pt-6 px-3 text-gray-600 tracking-wider font-medium text-sm"
              >
                Email address
              </div>
              <div class="px-3 pt-2">
                <input
                  type="text"
                  class="w-full"
                  pInputText
                  [(ngModel)]="email"
                />
                <div
                  *ngIf="invalidEmail"
                  class="text-xs text-red-500 tracking-wide"
                >
                  Invalid email
                </div>
              </div>

              <div class="px-3">
                <div class="border-b mt-4 mb-4 border-gray-200"></div>
              </div>
              <div class="px-3">
                <p-button
                  (onClick)="SendEmail()"
                  label="Send Email Link"
                  severity="info"
                  styleClass="!text-sm !w-full !text-shadow-md !tracking-wider"
                ></p-button>
              </div>
              <div
                class="text-xs pt-2 tracking-wider text-center text-gray-500"
              >
                Back to
                <b
                  class="text-cyan-600 cursor-pointer hover:text-cyan-700"
                  [routerLink]="'/login'"
                  >Sign In</b
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </ng-container>
    <ng-template #emailSentTemplate>
      <div class="w-full min-h-screen flex flex-col p-3 pt-3">
        <div
          class="flex flex-row items-center gap-2"
          (click)="emailSent = false"
        >
          <svg
            class="w-6 h-6 text-gray-800"
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
          <div class="text-gray-600 font-medium tracking-wide">Back</div>
        </div>
        <div
          class="px-6 pt-10 font-semibold tracking-widest text-2xl text-gray-800"
        >
          Check your Email
        </div>
        <div class="px-6 text-gray-500 tracking-wider pt-1">
          We have sent a reset password instructions to your email address.
        </div>
        <div class="px-6 pt-10 flex justify-center items-center">
          <img src="assets/postbox.png" alt="" class="w-[200px]" />
        </div>
        <div class="px-6 pt-10">
          <p-button
            label="Open Email App"
            severity="info"
            styleClass="tracking-wider w-full !py-3"
            (onClick)="openEmailApp()"
          ></p-button>
        </div>
      </div>
      <div class="fixed bottom-0 p-2 px-10 text-center w-full pb-5">
        <div class="tracking-widest text-sm text-gray-500">
          Did you receive this email? Check your inbox or
          <b class="font-medium text-blue-600" (click)="SendEmail()"
            >Resent email</b
          >
        </div>
      </div>
    </ng-template> -->
  `,
  styleUrl: './confirmEmail.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmEmail implements OnDestroy {
  private readonly loadingService = inject(LoadingService);
  private readonly userService = inject(UserService);
  private readonly messageService = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  email: string = '';
  message: string = '';
  invalidEmail: boolean = false;
  emailSent: boolean = false;
  isMobile = window.innerWidth < 770;

  @HostListener('window:resize', [])
  onResize() {
    this.isMobile = window.innerWidth < 770;
  }

  SendEmail() {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!this.email || !emailPattern.test(this.email)) {
      this.invalidEmail = true;
      this.cdr.detectChanges();
      return;
    }

    this.loadingService.start();

    this.userService.ResetPasswordLink(this.email).subscribe({
      next: (res) => {
        this.loadingService.stop();

        if (res.success) {
          this.invalidEmail = false;

          // Slight delay to ensure UI refreshes properly
          setTimeout(() => {
            this.emailSent = true;
            this.message = 'Reset instruction sent! Please check your email.';
            this.cdr.detectChanges();
          });
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: res.message || 'Failed to send reset email.',
          });
        }
      },
      error: () => {
        this.loadingService.stop();
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'An unexpected error occurred. Please try again.',
        });
      },
    });
  }

  openEmailApp() {
    window.location.href = 'mailto:';
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
