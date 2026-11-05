import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { LoadingService } from '../../../services/loading.service';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { UserService } from '../../../services/userService.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-email-link',
  imports: [
    CommonModule,
    ButtonModule,
    FormsModule,
    RouterLink,
    InputTextModule,
  ],
  template: `
    <!-- DESKTOP -->
    <div class="hidden lg:grid grid-cols-12 h-screen">
      <!-- LEFT: EMAIL CONFIRMATION -->
      <div
        class="col-span-6 h-full w-full flex items-center px-16 xl:px-24 2xl:px-32"
      >
        <div class="w-full max-w-xl mx-auto">
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
              Check your
              <span class="text-[#2148BC]">Inbox.</span>
            </h1>

            <p
              class="text-gray-500 text-base xl:text-lg
              mt-4 leading-relaxed max-w-lg"
            >
              Your password recovery request has been received. We've sent a
              secure recovery link to your registered corporate email address.
            </p>
          </div>

          <!-- EMAIL FORM -->
          <div class="flex flex-col gap-5 mt-9 yl-login-form">
            <div class="flex flex-col gap-2">
              <label class="text-gray-600 text-sm font-medium pl-2">
                WORK EMAIL
              </label>

              <div class="relative">
                <i
                  class="pi pi-envelope
                  absolute left-5 top-1/2
                  -translate-y-1/2 text-gray-400! z-10"
                ></i>

                <input
                  type="text"
                  pInputText
                  [(ngModel)]="email"
                  [disabled]="!edit"
                  class="w-full!
                  bg-gray-50!
                  pl-12! pr-20!
                  rounded-2xl! py-4!
                  placeholder:text-gray-400!
                  border-gray-200!
                  focus:border-blue-500!
                  focus:bg-white!
                  transition-all"
                  placeholder="Enter your work email"
                />

                <button
                  type="button"
                  class="absolute right-5 top-1/2
                  -translate-y-1/2
                  text-sm font-semibold
                  text-[#2148BC]
                  hover:underline cursor-pointer"
                  (click)="edit = !edit"
                >
                  {{ edit ? 'Save' : 'Edit' }}
                </button>
              </div>
            </div>
          </div>

          <!-- OPEN EMAIL -->
          <p-button
            class="yl-login-button"
            label="Open Email App"
            icon="pi pi-arrow-right"
            iconPos="right"
            [rounded]="true"
            [disabled]="!email"
            (onClick)="openEmailApp()"
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

          <!-- RESEND -->
          <div
            class="flex items-center justify-center gap-2
            mt-6 text-sm"
          >
            <span class="text-gray-500"> Didn't receive the email? </span>

            <button
              type="button"
              class="cursor-pointer
              text-[#2148BC]
              font-semibold
              hover:underline"
              (click)="ResendLink()"
            >
              Resend Link
            </button>
          </div>

          <!-- BACK TO LOGIN -->
          <div
            class="flex items-center justify-center gap-2
            mt-4 text-sm"
          >
            <i class="pi pi-arrow-left text-gray-400 text-xs"></i>

            <a
              class="cursor-pointer
              text-gray-500
              hover:text-[#2148BC]
              font-medium"
              [routerLink]="'/login'"
            >
              Back to Sign In
            </a>
          </div>

          <!-- FOOTER -->
          <div
            class="yl-login-footer
            flex items-center justify-center gap-2
            mt-8 text-gray-400 text-xs"
          >
            <i class="pi pi-shield text-blue-700!"></i>
            <span>Protected by YL Works Enterprise Security</span>
          </div>
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
            via-slate-950/35 to-slate-950/70"
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
              <div class="max-w-lg text-center yl-email-content">
                <!-- EMAIL ICON -->
                <div
                  class="w-28 h-28 mx-auto
                  rounded-[2rem]
                  bg-white/10
                  border border-white/20
                  backdrop-blur-xl
                  flex items-center justify-center
                  shadow-2xl"
                >
                  <i class="pi pi-envelope text-white! text-5xl!"></i>
                </div>

                <h2
                  class="text-white text-4xl xl:text-5xl
                  font-bold tracking-tight mt-8"
                >
                  Almost
                  <span class="text-blue-300">There!</span>
                </h2>

                <p
                  class="text-white/60 text-base xl:text-lg
                  leading-relaxed mt-5 max-w-md mx-auto"
                >
                  Follow the instructions in your email to securely reset your
                  password and regain access to your workspace.
                </p>

                <!-- INFO CARD -->
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
                    <i class="pi pi-lock text-blue-300! text-xl!"></i>
                  </div>

                  <div>
                    <div class="text-white font-semibold text-sm">
                      Secure Password Recovery
                    </div>

                    <div class="text-white/50 text-xs mt-1">
                      Your account security is our priority.
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
          Your reset link is on its way.
        </div>
      </div>

      <!-- FORM CARD -->
      <div class="h-[70%] w-full">
        <div
          class="bg-white h-full p-6
          flex flex-col items-center gap-2
          rounded-t-4xl"
        >
          <div class="h-1 w-15 rounded-full bg-gray-200"></div>

          <!-- ICON -->
          <div
            class="mt-5 w-16 h-16
            bg-blue-50 rounded-full
            flex items-center justify-center
            border border-blue-100"
          >
            <i class="pi pi-envelope text-blue-700! text-2xl!"></i>
          </div>

          <!-- TITLE -->
          <div class="font-extrabold text-3xl mt-4 text-gray-800">
            Check Your Email
          </div>

          <span
            class="text-gray-500 text-sm
            mb-4 text-center w-[90%]"
          >
            We've sent a secure password recovery link to your registered work
            email address.
          </span>

          <!-- EMAIL -->
          <div class="flex flex-col mt-3 gap-2 w-full px-5">
            <label class="text-gray-600 text-sm font-medium pl-2">
              WORK EMAIL
            </label>

            <div class="relative">
              <input
                type="text"
                pInputText
                [(ngModel)]="email"
                [disabled]="!edit"
                class="w-full! bg-gray-50!
                pl-12! pr-16!
                rounded-full! p-5!
                placeholder:text-gray-400!
                border-gray-200!"
                placeholder="Enter your work email"
              />

              <i
                class="pi pi-envelope
                absolute! top-6! left-5!
                text-gray-400!"
              ></i>

              <button
                type="button"
                class="text-blue-800 font-semibold
                absolute right-4 top-5
                cursor-pointer text-sm"
                (click)="edit = !edit"
              >
                {{ edit ? 'Save' : 'Edit' }}
              </button>
            </div>
          </div>

          <!-- OPEN EMAIL -->
          <p-button
            label="Open Email App"
            [rounded]="true"
            [disabled]="!email"
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
            (onClick)="openEmailApp()"
          ></p-button>

          <!-- RESEND -->
          <span class="text-gray-500 text-sm text-center mt-4">
            Didn't get the email?

            <b class="text-blue-700 cursor-pointer" (click)="ResendLink()">
              Resend Link
            </b>
          </span>

          <!-- FOOTER -->
          <div
            class="flex items-center justify-center
            gap-2 mt-5 text-gray-400 text-xs"
          >
            <i class="pi pi-shield text-blue-700!"></i>

            <span> Protected by YL Works Enterprise Security </span>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './email-link.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailLink implements OnInit, OnDestroy {
  private readonly loadingService = inject(LoadingService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly userService = inject(UserService);

  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  email: string = this.activatedRoute.snapshot.queryParams['email'];
  edit: boolean = false;

  ngOnInit(): void {}

  ResendLink(): void {
    if (!this.email) return;

    this.loadingService.start();

    this.userService
      .ResetPasswordLink(this.email)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: () => {
          this.loadingService.stop();
        },
        error: () => {
          this.loadingService.stop();
        },
      });
  }

  openEmailApp(): void {
    if (!this.email) return;

    window.open('https://mail.google.com/mail/u/0/#inbox', '_blank');
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
