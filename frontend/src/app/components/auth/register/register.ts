import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { Subject, takeUntil } from 'rxjs';
import { LoadingService } from '../../../services/loading.service';
import { UserService } from '../../../services/userService.service';
import { MessageService } from 'primeng/api';
import { Router, RouterLink } from '@angular/router';
import { ValidateAllFormFields } from '../../../shared/helpers/helpers';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';

@Component({
  selector: 'app-register',
  imports: [
    CommonModule,
    ButtonModule,
    ReactiveFormsModule,
    FormsModule,
    InputTextModule,
    PasswordModule,
    RouterLink,
    SelectModule,
    CheckboxModule,
    DialogModule,
    AvatarModule,
    AvatarGroupModule,
  ],
  template: `
    <div class="hidden lg:grid grid-cols-12 h-screen">
      <div
        class="col-span-6 h-full w-full flex items-center px-16 xl:px-24 2xl:px-32"
      >
        <div class="w-full max-w-xl mx-auto">
          <div
            class="inline-flex items-center gap-3
             px-4 py-2
             rounded-full
             bg-white
             border border-gray-200
             shadow-sm yl-login-brand"
          >
            <div
              class="w-7 h-7
               rounded-full
               bg-blue-50
               flex items-center justify-center"
            >
              <i class="pi pi-circle-fill text-blue-800! text-[9px]!"></i>
            </div>

            <span class="font-bold text-gray-900"> YL WORKS </span>

            <span class="text-gray-300"> | </span>

            <span class="text-gray-500 text-sm"> Internal </span>
          </div>

          <div class="mt-10 yl-login-heading">
            <h1
              class="text-4xl xl:text-5xl
               font-bold
               tracking-tight
               text-gray-950
               leading-tight"
            >
              Create an
              <span class="text-[#2148BC]"> account </span>
            </h1>

            <p
              class="text-gray-500
               text-base xl:text-lg
               mt-4
               leading-relaxed
               max-w-lg"
            >
              Join YL Works internal operations & workplace
            </p>
          </div>

          <div class="flex flex-col gap-5 mt-9 yl-login-form" [formGroup]="FG">
            <div class="flex flex-col gap-2">
              <label
                class="text-gray-600
                 text-sm
                 font-medium
                 pl-2"
              >
                FULL NAME
              </label>

              <div class="relative">
                <i
                  class="
              pi pi-user
              absolute
              left-5
              top-1/2
              -translate-y-1/2
              text-gray-400!
              z-10
            "
                ></i>

                <input
                  type="text"
                  pInputText
                  formControlName="fullName"
                  class="
              w-full!
              bg-gray-50!
              pl-12!
              pr-5!
              rounded-2xl!
              py-4!
              placeholder:text-gray-400!
              border-gray-200!
              focus:border-blue-500!
              focus:bg-white!
              transition-all
            "
                  placeholder="Enter your full name"
                />
              </div>
            </div>
            <div class="flex flex-col gap-2">
              <label
                class="text-gray-600
                 text-sm
                 font-medium
                 pl-2"
              >
                DISPLAY NAME
              </label>

              <div class="relative">
                <i
                  class="
              pi pi-user
              absolute
              left-5
              top-1/2
              -translate-y-1/2
              text-gray-400!
              z-10
            "
                ></i>

                <input
                  type="text"
                  pInputText
                  formControlName="displayName"
                  class="
              w-full!
              bg-gray-50!
              pl-12!
              pr-5!
              rounded-2xl!
              py-4!
              placeholder:text-gray-400!
              border-gray-200!
              focus:border-blue-500!
              focus:bg-white!
              transition-all
            "
                  placeholder="Enter your display name"
                />
              </div>
            </div>
            <div class="flex flex-col gap-2">
              <label
                class="text-gray-600
                 text-sm
                 font-medium
                 pl-2"
              >
                WORK EMAIL
              </label>

              <div class="relative">
                <i
                  class="
              pi pi-envelope
              absolute
              left-5
              top-1/2
              -translate-y-1/2
              text-gray-400!
              z-10
            "
                ></i>

                <input
                  type="text"
                  pInputText
                  formControlName="email"
                  class="
              w-full!
              bg-gray-50!
              pl-12!
              pr-5!
              rounded-2xl!
              py-4!
              placeholder:text-gray-400!
              border-gray-200!
              focus:border-blue-500!
              focus:bg-white!
              transition-all
            "
                  placeholder="Enter your work email"
                />
              </div>
            </div>

            <div class="flex flex-col gap-2">
              <label
                class="text-gray-600
                 text-sm
                 font-medium
                 pl-2"
              >
                PASSWORD
              </label>

              <p-password
                formControlName="password"
                [toggleMask]="true"
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
                placeholder="Enter your password"
              ></p-password>
            </div>
            <div class="flex flex-col gap-2">
              <label
                class="text-gray-600
                 text-sm
                 font-medium
                 pl-2"
              >
                CONFIRM PASSWORD
              </label>

              <p-password
                formControlName="confirmPassword"
                [toggleMask]="true"
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
                placeholder="Confirm your password"
              ></p-password>
            </div>
            <div class="flex flex-row items-center gap-2">
              <p-checkbox
                formControlName="isAgree"
                [binary]="true"
              ></p-checkbox>
              <span class="text-sm text-gray-500 mt-1 font-semibold">
                I agree to the
                <a
                  class="text-blue-600 cursor-pointer hover:underline"
                  (click)="tncVisible = true"
                >
                  YL Works Internal Policy
                </a>
                and Terms.
              </span>
            </div>
          </div>

          <p-button
            class="yl-login-button"
            (onClick)="Register()"
            size="large"
            label="Submit"
            iconPos="right"
            [rounded]="true"
            [disabled]="FG.invalid || FG.get('isAgree')?.value === false"
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
        transition-all! disabled:bg-gray-300! disabled:text-gray-500! disabled:cursor-not-allowed!
      "
          ></p-button>

          <div
            class="yl-login-footer
        flex
        items-center
        justify-center
        gap-2
        mt-5
        text-gray-400
        text-xs
      "
          >
            <i class="pi pi-shield text-blue-700!"></i>

            <span> Protected by YL Works Enterprise Security </span>
          </div>

          <div
            class="
        mt-8
        pt-6
        border-t
        border-gray-200
        flex
        items-center
        justify-center
        gap-2
        text-sm yl-login-footer
      "
          >
            <span class="text-gray-500"> Already have an account? </span>

            <a
              class="
          cursor-pointer
          text-[#2148BC]
          font-semibold
          hover:underline
        "
              [routerLink]="'/login'"
            >
              Sign In
            </a>
          </div>
        </div>
      </div>
      <div class="col-span-6 h-full w-full p-8">
        <div
          class="relative w-full h-full overflow-hidden rounded-[2rem] yl-preview
           border border-gray-200 bg-slate-950 shadow-2xl"
        >
          <img
            src="assets/screen.png"
            alt=""
            class="absolute inset-0 h-full w-full object-cover scale-110 blur-md"
          />

          <div
            class="absolute inset-0
             bg-gradient-to-br from-blue-950/80
             via-slate-950/35
             to-slate-950/70"
          ></div>

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
            <div
              class="absolute top-8 left-10 right-10 flex items-center justify-between"
            >
              <div class="flex items-center gap-3">
                <div
                  class="w-9 h-9 rounded-xl bg-white/10
                   border border-white/15 backdrop-blur-md
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
                 rounded-full
                 bg-black/20
                 border border-white/10
                 backdrop-blur-xl
                 px-4 py-2 yl-preview-status"
              >
                <span
                  class="w-2 h-2 rounded-full
                   bg-green-400
                   shadow-[0_0_10px_rgba(74,222,128,.8)]"
                ></span>

                <span class="text-white/80 text-xs"> Workspace Online </span>
              </div>
            </div>

            <div
              class="absolute
               top-[20%]
               left-[10%]
               right-[10%]
               bottom-[20%]
               rounded-3xl
               bg-white/10
               border border-white/15
               backdrop-blur-md
               shadow-2xl
               overflow-hidden yl-preview-main"
            >
              <div
                class="h-16
                 border-b border-white/10
                 flex items-center justify-between
                 px-7"
              >
                <div>
                  <div class="text-white font-semibold">My Workspace</div>

                  <div class="text-white/40 text-xs mt-0.5">
                    Monday, 23 September
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <div
                    class="w-8 h-8 rounded-lg
                     bg-white/10
                     flex items-center justify-center"
                  >
                    <i class="pi pi-bell text-white/70 text-sm"></i>
                  </div>

                  <p-avatar
                    image="https://primefaces.org/cdn/primeng/images/demo/avatar/amyelsner.png"
                    shape="circle"
                  ></p-avatar>
                </div>
              </div>

              <div class="p-7">
                <div class="grid grid-cols-3 gap-4">
                  <div
                    class="rounded-2xl
                     bg-white/10
                     border border-white/10
                     p-4"
                  >
                    <div class="text-white/40 text-xs">PROJECTS</div>

                    <div class="text-white text-2xl font-bold mt-2">12</div>

                    <div class="text-green-400 text-xs mt-1">+3 this month</div>
                  </div>

                  <div
                    class="rounded-2xl
                     bg-white/10
                     border border-white/10
                     p-4"
                  >
                    <div class="text-white/40 text-xs">TASKS</div>

                    <div class="text-white text-2xl font-bold mt-2">28</div>

                    <div class="text-blue-300 text-xs mt-1">8 in progress</div>
                  </div>

                  <div
                    class="rounded-2xl
                     bg-white/10
                     border border-white/10
                     p-4"
                  >
                    <div class="text-white/40 text-xs">MEETINGS</div>

                    <div class="text-white text-2xl font-bold mt-2">05</div>

                    <div class="text-white/40 text-xs mt-1">Today</div>
                  </div>
                </div>

                <div class="grid grid-cols-5 gap-5 mt-5">
                  <div
                    class="col-span-3
                     rounded-2xl
                     bg-white/10
                     border border-white/10
                     p-5"
                  >
                    <div class="flex justify-between items-center">
                      <div class="text-white font-semibold">
                        Recent Activity
                      </div>

                      <div class="text-white/40 text-xs">View all</div>
                    </div>

                    <div class="flex flex-col gap-4 mt-5">
                      <div class="flex items-center gap-3">
                        <div
                          class="w-9 h-9 rounded-xl
                           bg-green-500/15
                           flex items-center justify-center"
                        >
                          <i class="pi pi-check text-green-400 text-sm"></i>
                        </div>

                        <div class="flex-1">
                          <div class="text-white text-sm">
                            Project documentation completed
                          </div>

                          <div class="text-white/40 text-xs mt-1">
                            5 minutes ago
                          </div>
                        </div>
                      </div>

                      <div class="flex items-center gap-3">
                        <div
                          class="w-9 h-9 rounded-xl
                           bg-blue-500/15
                           flex items-center justify-center"
                        >
                          <i class="pi pi-user text-blue-300 text-sm"></i>
                        </div>

                        <div class="flex-1">
                          <div class="text-white text-sm">
                            New team member joined
                          </div>

                          <div class="text-white/40 text-xs mt-1">
                            18 minutes ago
                          </div>
                        </div>
                      </div>

                      <div class="flex items-center gap-3">
                        <div
                          class="w-9 h-9 rounded-xl
                           bg-purple-500/15
                           flex items-center justify-center"
                        >
                          <i class="pi pi-calendar text-purple-300 text-sm"></i>
                        </div>

                        <div class="flex-1">
                          <div class="text-white text-sm">
                            Meeting scheduled
                          </div>

                          <div class="text-white/40 text-xs mt-1">
                            32 minutes ago
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    class="col-span-2
                     rounded-2xl
                     bg-white/10
                     border border-white/10
                     p-5"
                  >
                    <div class="text-white font-semibold">Upcoming</div>

                    <div class="text-white/40 text-xs mt-1">Your schedule</div>

                    <div
                      class="mt-5
                       rounded-xl
                       bg-[#2148BC]
                       p-4
                       shadow-lg"
                    >
                      <div class="flex justify-between">
                        <div class="text-white/70 text-xs">11:30 AM</div>

                        <i class="pi pi-video text-white/80 text-xs"></i>
                      </div>

                      <div class="text-white font-semibold mt-3">
                        Product Meeting
                      </div>

                      <div class="text-white/60 text-xs mt-1">
                        6 participants
                      </div>
                    </div>

                    <div
                      class="mt-3
                       rounded-xl
                       bg-white/5
                       border border-white/10
                       p-4"
                    >
                      <div class="text-white/50 text-xs">01:00 PM</div>

                      <div class="text-white text-sm font-medium mt-2">
                        Daily Standup
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              class="absolute
               left-6
               top-[34%]
               w-52
               bg-white
               rounded-2xl
               p-4
               shadow-2xl
               border border-gray-100
               -rotate-2 yl-float-card-1"
            >
              <div class="flex items-center gap-3">
                <div
                  class="w-9 h-9 rounded-xl
                   bg-blue-50
                   text-blue-700
                   flex items-center justify-center"
                >
                  <i class="pi pi-check"></i>
                </div>

                <div>
                  <div class="text-xs text-gray-400">TASK</div>

                  <div class="font-semibold text-sm">Completed</div>
                </div>
              </div>

              <div class="text-xs text-gray-400 mt-3">
                Website deployment successfully completed.
              </div>
            </div>

            <div
              class="absolute
               right-6
               top-[55%]
               w-52
               bg-white
               rounded-2xl
               p-4
               shadow-2xl
               border border-gray-100
               rotate-2 yl-float-card-2"
            >
              <div class="flex items-center justify-between">
                <div class="text-xs text-gray-400">TEAM</div>

                <i
                  class="pi pi-users
                   text-blue-700!
                   text-sm!"
                ></i>
              </div>

              <div class="text-2xl font-bold mt-2">24</div>

              <div class="text-xs text-gray-400">Active employees</div>

              <div class="flex mt-3">
                <p-avatar
                  image="https://primefaces.org/cdn/primeng/images/demo/avatar/amyelsner.png"
                  shape="circle"
                  size="normal"
                />

                <p-avatar
                  image="https://primefaces.org/cdn/primeng/images/demo/avatar/asiyajavayant.png"
                  shape="circle"
                  size="normal"
                />

                <p-avatar
                  image="https://primefaces.org/cdn/primeng/images/demo/avatar/onyamalimba.png"
                  shape="circle"
                  size="normal"
                />

                <p-avatar label="+21" shape="circle" size="normal" />
              </div>
            </div>

            <div
              class="absolute
               bottom-8
               left-10
               right-10
               flex items-center justify-between"
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

    <div
      class="h-screen flex flex-col lg:hidden pt-5 relative [background:linear-gradient(158deg,rgba(30,64,175,1)_0%,rgba(29,78,216,1)_50%,rgba(37,99,235,1)_100%)] overflow-x-hidden"
    >
      <div class="absolute top-20 -right-15">
        <div
          class="flex flex-col w-[163.28px] h-[206px] items-start gap-2 p-2 relative bg-[[#ffffff0d]] rounded-2xl border-2 border-solid border-white/10 rotate-5"
        >
          <div
            class="relative self-stretch w-full h-3 bg-white/5 rounded-md"
          ></div>
          <div class="w-[93px] h-2 rounded-md relative bg-white/5"></div>
          <div
            class="flex items-start justify-center gap-1.5 pt-1 pb-0 px-0 relative self-stretch w-full flex-[0_0_auto]"
          >
            <div
              class="w-[58.99px] h-[32.01px] rounded relative bg-white/5"
            ></div>
            <div class="w-[59px] h-[31.99px] rounded relative bg-white/5"></div>
          </div>
        </div>
      </div>

      <div class="flex flex-col justify-center gap-5 px-7 h-[18%]">
        <div
          class="rounded-full w-fit px-3 py-2 flex flex-row items-center gap-3 bg-white/10 backdrop-blur-2xl border border-white/20"
        >
          <i class="pi pi-circle-fill text-green-500! text-[5px]!"></i>
          <div class="font-light text-sm text-white/80">
            YL WORKS ENTERPRISE
          </div>
        </div>
        <b
          class="font-bold text-white text-shadow-md text-2xl tracking-wide w-[80%]"
          >Create Your Account and Simplify Your Workday</b
        >
      </div>

      <div class=" w-full h-[82%]">
        <div
          class="bg-white h-full rounded-t-4xl p-10 flex flex-col items-center gap-2"
        >
          <div class="text-3xl font-semibold">Sign up</div>
          <span class="text-sm text-gray-400"
            >Already have an account?
            <a class="text-blue-600 font-bold" [routerLink]="'/login'"
              >Log In</a
            ></span
          >

          <div class="mt-4 flex flex-col gap-4 w-full" [formGroup]="FG">
            <div class="relative">
              <input
                type="text"
                pInputText
                class="w-full! bg-gray-50! pl-12! rounded-full! p-5! placeholder:text-gray-400! border-gray-200!"
                formControlName="fullName"
                placeholder="Full Name (e.g. Sarah Tan)"
              />
              <i class="pi pi-user absolute! top-6! left-5! text-gray-400!"></i>
            </div>
            <div class="relative">
              <input
                type="text"
                pInputText
                class="w-full! bg-gray-50! pl-12! rounded-full! p-5! placeholder:text-gray-400! border-gray-200!"
                formControlName="displayName"
                placeholder="Display Name (e.g. Sarah)"
              />
              <i class="pi pi-user absolute! top-6! left-5! text-gray-400!"></i>
            </div>
            <div class="relative">
              <input
                type="text"
                pInputText
                class="w-full! bg-gray-50! pl-12! rounded-full! p-5! placeholder:text-gray-400! border-gray-200!"
                formControlName="email"
                placeholder="name@ylworks.com"
              />
              <i
                class="pi pi-envelope absolute! top-6.5! left-5! text-gray-400!"
              ></i>
            </div>
            <div class="relative">
              <p-password
                styleClass="w-full!"
                inputStyleClass="w-full! bg-gray-50! pl-12! rounded-full! p-5! placeholder:text-gray-400! border-gray-200!"
                formControlName="password"
                placeholder="Password"
                [toggleMask]="true"
              />
              <i
                class="pi pi-lock absolute! top-6.5! left-5! text-gray-400!"
              ></i>
            </div>
            <div class="relative">
              <p-password
                styleClass="w-full!"
                inputStyleClass="w-full! bg-gray-50! pl-12! rounded-full! p-5! placeholder:text-gray-400! border-gray-200!"
                formControlName="confirmPassword"
                placeholder="Confirm Password"
                [toggleMask]="true"
              />
              <i
                class="pi pi-lock absolute! top-6.5! left-5! text-gray-400!"
              ></i>
            </div>
            <div class="flex flex-row items-center gap-2">
              <p-checkbox
                formControlName="isAgree"
                [binary]="true"
              ></p-checkbox>
              <span class="text-sm text-gray-500 mt-1 font-semibold">
                I agree to the
                <a class="text-blue-600" (click)="tncVisible = true">
                  YL Works Internal Policy
                </a>
                and Terms.
              </span>
            </div>
          </div>

          <p-button
            [disabled]="FG.invalid && FG.get('isAgree')?.value === false"
            label="Create Account"
            (onClick)="Register()"
            [rounded]="true"
            class="w-full! mt-4"
            styleClass="w-full! bg-[#2148BC]! text-white! border-none! p-5!"
          ></p-button>
          <span class="text-sm text-gray-400 mt-2 text-center">
            By signing up, you agree to YL Works Enterprise Security Guidelines.
          </span>
        </div>
      </div>
    </div>

    <p-dialog
      [(visible)]="tncVisible"
      [modal]="true"
      [position]="'bottom'"
      [draggable]="false"
      [resizable]="false"
      [dismissableMask]="false"
      styleClass="
    w-full!
    sm:w-[95%]!
    md:w-[700px]!
    lg:w-[850px]!
    xl:w-[950px]!
    2xl:w-[1000px]!
    h-[94dvh]!
    sm:h-[88dvh]!
    md:h-[80dvh]!
    lg:h-[75dvh]!
    max-h-[850px]!
    p-0!
    rounded-t-3xl!
    sm:rounded-3xl!
    overflow-hidden!
  "
    >
      <ng-template #headless>
        <div class="flex flex-col w-full h-full min-h-0 bg-white">
          <div class="shrink-0 flex justify-center pt-3 sm:hidden">
            <div class="w-12 h-1.5 rounded-full bg-gray-200"></div>
          </div>

          <div
            class="
          shrink-0
          flex items-center justify-between
          gap-3
          px-5 py-4
          sm:px-6 sm:py-5
          border-b border-gray-100
        "
          >
            <div class="flex items-center gap-3 min-w-0">
              <div
                class="
              shrink-0
              w-11 h-11
              sm:w-12 sm:h-12
              rounded-2xl
              bg-blue-50
              border border-blue-100
              flex items-center justify-center
            "
              >
                <i class="pi pi-shield text-blue-600! text-lg!"></i>
              </div>

              <div class="min-w-0">
                <div
                  class="
                font-bold
                text-gray-900
                text-base
                sm:text-lg
                truncate
              "
                >
                  YL Works Internal Policy
                </div>

                <div class="text-[11px] sm:text-xs text-gray-400 mt-0.5">
                  Last updated: September 2026
                  <span class="hidden sm:inline"> • Version 1.0</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              class="
            shrink-0
            w-9 h-9
            sm:w-10 sm:h-10
            rounded-full
            bg-gray-50
            hover:bg-gray-100
            flex items-center justify-center
            transition
          "
              (click)="tncVisible = false"
            >
              <i class="pi pi-times text-gray-500!"></i>
            </button>
          </div>

          <div
            class="
          flex-1
          min-h-0
          overflow-y-auto
          overscroll-contain
          px-4 py-4
          sm:px-6 sm:py-5
        "
          >
            <div class="flex flex-col gap-3 sm:gap-4">
              <div
                class="
              flex gap-3
              p-4
              rounded-2xl
              bg-gray-50
              border border-gray-100
            "
              >
                <div
                  class="
                shrink-0
                w-8 h-8
                rounded-xl
                bg-blue-100
                text-blue-700
                flex items-center justify-center
                text-sm font-bold
              "
                >
                  01
                </div>

                <div class="min-w-0">
                  <div class="font-bold text-gray-800 text-sm sm:text-base">
                    Acceptable Use & Account Security
                  </div>

                  <p
                    class="text-xs sm:text-sm text-gray-500 leading-relaxed mt-1.5"
                  >
                    Enterprise user accounts are personal and non-transferable.
                    Do not share credentials, bypass MFA, or use automated
                    sign-in agents. Suspicious session activity must be
                    reported.
                  </p>
                </div>
              </div>

              <div
                class="
              flex gap-3
              p-4
              rounded-2xl
              bg-gray-50
              border border-gray-100
            "
              >
                <div
                  class="
                shrink-0
                w-8 h-8
                rounded-xl
                bg-blue-100
                text-blue-700
                flex items-center justify-center
                text-sm font-bold
              "
                >
                  02
                </div>

                <div class="min-w-0">
                  <div class="font-bold text-gray-800 text-sm sm:text-base">
                    Data Privacy & Confidentiality
                  </div>

                  <p
                    class="text-xs sm:text-sm text-gray-500 leading-relaxed mt-1.5"
                  >
                    Internal proprietary documentation, intellectual assets, and
                    client operational metrics are confidential under NDA. Do
                    not upload company data to external AI or cloud services
                    without IT compliance approval.
                  </p>
                </div>
              </div>

              <div
                class="
              flex gap-3
              p-4
              rounded-2xl
              bg-gray-50
              border border-gray-100
            "
              >
                <div
                  class="
                shrink-0
                w-8 h-8
                rounded-xl
                bg-blue-100
                text-blue-700
                flex items-center justify-center
                text-sm font-bold
              "
                >
                  03
                </div>

                <div class="min-w-0">
                  <div class="font-bold text-gray-800 text-sm sm:text-base">
                    Workplace & Operational Code
                  </div>

                  <p
                    class="text-xs sm:text-sm text-gray-500 leading-relaxed mt-1.5"
                  >
                    Maintain accurate shift logs and transparent communication.
                    Workplace incidents should be recorded in real time.
                    Equipment must be handled according to safety guidelines.
                  </p>
                </div>
              </div>

              <div
                class="
              flex gap-3
              p-4
              rounded-2xl
              bg-gray-50
              border border-gray-100
            "
              >
                <div
                  class="
                shrink-0
                w-8 h-8
                rounded-xl
                bg-blue-100
                text-blue-700
                flex items-center justify-center
                text-sm font-bold
              "
                >
                  04
                </div>

                <div class="min-w-0">
                  <div class="font-bold text-gray-800 text-sm sm:text-base">
                    Device & Network Policy
                  </div>

                  <p
                    class="text-xs sm:text-sm text-gray-500 leading-relaxed mt-1.5"
                  >
                    Only certified mobile and desktop endpoints with current
                    endpoint protection may access company systems. Unauthorized
                    VPN tunnelling, software modifications, jailbroken, or
                    rooted devices are prohibited.
                  </p>
                </div>
              </div>

              <div
                class="
              flex gap-3
              p-4
              rounded-2xl
              bg-gray-50
              border border-gray-100
            "
              >
                <div
                  class="
                shrink-0
                w-8 h-8
                rounded-xl
                bg-blue-100
                text-blue-700
                flex items-center justify-center
                text-sm font-bold
              "
                >
                  05
                </div>

                <div class="min-w-0">
                  <div class="font-bold text-gray-800 text-sm sm:text-base">
                    Compliance & Reporting
                  </div>

                  <p
                    class="text-xs sm:text-sm text-gray-500 leading-relaxed mt-1.5"
                  >
                    YL Works maintains a zero-retaliation whistleblower code.
                    Potential policy breaches or ethical irregularities should
                    be reported to
                    <span class="font-semibold text-blue-600">
                      {{ 'ylsystems@ylsystems.com' }} </span
                    >.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div
            class="
          shrink-0
          border-t border-gray-100
          bg-white
          px-4 py-4
          sm:px-6 sm:py-5
          pb-[calc(1rem+env(safe-area-inset-bottom))]
        "
          >
            <div class="flex items-start gap-3 mb-4">
              <p-checkbox
                [binary]="true"
                [(ngModel)]="isAgree"
                styleClass="mt-0.5"
              ></p-checkbox>

              <label
                class="
              text-xs
              sm:text-sm
              text-gray-500
              leading-relaxed
              cursor-pointer mt-0.5
            "
              >
                I have read, understood, and agree to the
                <span class="font-semibold text-gray-800">
                  YL Works Enterprise Internal Policies & Terms </span
                >.
              </label>
            </div>

            <!-- Accept -->
            <p-button
              label="Accept & Continue"
              [disabled]="!isAgree"
              [rounded]="true"
              class="w-full! mt-4!"
              styleClass="
            w-full!
            bg-[#2148BC]!
            hover:bg-[#193a9e]!
            text-white!
            border-none!
            py-3!
            shadow-sm!
          "
              icon="pi pi-check"
              iconPos="right"
              (onClick)="AgreeClick()"
            ></p-button>

            <!-- Decline -->
            <button
              type="button"
              class="
            w-full
            text-xs sm:text-sm
            text-gray-400
            hover:text-gray-600
            mt-3
            py-1
            transition
          "
              (click)="DeclineClick()"
            >
              Decline / Dismiss
            </button>
          </div>
        </div>
      </ng-template>
    </p-dialog>

    <!-- Registration Success Dialog -->
    <p-dialog
      [(visible)]="registrationSuccessVisible"
      [modal]="true"
      [closable]="false"
      [draggable]="false"
      [resizable]="false"
      [dismissableMask]="false"
      [style]="{ width: '450px' }"
    >
      <ng-template #headless>
        <div class="flex flex-col items-center text-center p-7 gap-4">
          <div
            class="w-20 h-20 rounded-full bg-green-50
        flex items-center justify-center"
          >
            <i class="pi pi-check-circle text-green-500! text-5xl!"></i>
          </div>

          <div class="text-xl font-bold text-gray-900">
            Registration Submitted!
          </div>

          <p class="text-sm text-gray-500 leading-relaxed">
            Your account registration has been submitted successfully. It is
            currently pending administrator approval.
          </p>

          <div class="w-full bg-blue-50 rounded-xl p-4 text-left">
            <div class="flex items-center gap-2 text-blue-700 font-semibold">
              <i class="pi pi-info-circle"></i>
              What's next?
            </div>

            <p class="text-sm text-gray-600 mt-2 leading-relaxed">
              Our administrator will review your registration. You will receive
              an email notification once your account has been approved or
              rejected.
            </p>
          </div>

          <p-button
            label="Back to Login"
            icon="pi pi-sign-in"
            [rounded]="true"
            styleClass="w-full! bg-[#2148BC]! border-none! mt-2!"
            (onClick)="GoToLogin()"
          ></p-button>
        </div>
      </ng-template>
    </p-dialog>
  `,
  styleUrl: './register.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Register implements OnInit, OnDestroy {
  private readonly loadingService = inject(LoadingService);
  private readonly messageService = inject(MessageService);
  private readonly userService = inject(UserService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  FG!: FormGroup;
  successRegistered: boolean = false;
  tncVisible: boolean = false;
  isAgree: boolean = false;
  registrationSuccessVisible: boolean = false;

  isMobile = window.innerWidth < 770;

  @HostListener('window:resize', [])
  onResize() {
    this.isMobile = window.innerWidth < 770;
  }

  ngOnInit(): void {
    this.FG.get('isAgree')?.valueChanges.subscribe((res) => {
      this.isAgree = res;
    });
  }

  constructor() {
    this.FG = new FormGroup({
      fullName: new FormControl<string | null>(null, Validators.required),
      displayName: new FormControl<string | null>(null, Validators.required),
      email: new FormControl<string | null>(null, [
        Validators.required,
        Validators.email,
      ]),
      password: new FormControl<string | null>(null, Validators.required),
      confirmPassword: new FormControl<string | null>(
        null,
        Validators.required,
      ),
      contactNo: new FormControl<string | null>(null),
      jobTitle: new FormControl<string | null>(null),
      isAgree: new FormControl<boolean>(false),
    });
  }

  Register() {
    if (this.FG.invalid) {
      ValidateAllFormFields(this.FG);
      return;
    }

    this.loadingService.start();

    this.userService
      .Register(this.FG.value)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res: any) => {
          this.loadingService.stop();

          if (res?.success || res?.Success) {
            this.registrationSuccessVisible = true;
            this.cdr.markForCheck();
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Registration Failed',
              detail: res?.message || res?.Message || 'Unable to register.',
            });
          }

          this.cdr.markForCheck();
        },

        error: (err) => {
          this.loadingService.stop();

          this.messageService.add({
            severity: 'error',
            summary: 'Registration Failed',
            detail:
              err?.error?.details ||
              err?.error?.message ||
              'Something went wrong. Please try again.',
          });

          this.cdr.markForCheck();
        },
      });
  }

  DeclineClick() {
    this.isAgree = false;
    this.FG.get('isAgree')?.patchValue(false);
    this.tncVisible = false;
    this.cdr.markForCheck();
  }

  AgreeClick() {
    this.FG.get('isAgree')?.patchValue(true);
    this.tncVisible = false;
    this.cdr.markForCheck();
  }

  GoToLogin() {
    this.registrationSuccessVisible = false;
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
