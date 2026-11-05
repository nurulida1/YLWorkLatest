import { CommonModule } from '@angular/common';
import {
  Component,
  ChangeDetectionStrategy,
  OnDestroy,
  OnInit,
  inject,
  ChangeDetectorRef,
  HostListener,
} from '@angular/core';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../services/authService';
import { LoadingService } from '../../../services/loading.service';
import { ValidateAllFormFields } from '../../../shared/helpers/helpers';
import { FloatLabelModule } from 'primeng/floatlabel';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    CheckboxModule,
    RouterLink,
    SelectModule,
    FloatLabelModule,
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
              Sign in to
              <span class="text-[#2148BC]"> YL Works </span>
            </h1>

            <p
              class="text-gray-500
               text-base xl:text-lg
               mt-4
               leading-relaxed
               max-w-lg"
            >
              Enter your corporate credentials to access workspace & intranet
              services.
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
                [feedback]="false"
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

            <div
              class="
          flex
          items-center
          justify-between
          px-2
          pt-1
        "
            >
              <div class="flex items-center gap-2">
                <p-checkbox
                  [binary]="true"
                  formControlName="rememberMe"
                ></p-checkbox>

                <span class="text-sm text-gray-500"> Remember me </span>
              </div>

              <a
                class="
            cursor-pointer
            text-sm
            text-[#2148BC]
            font-medium
            hover:underline
          "
                [routerLink]="'/forgot-password'"
              >
                Forgot password?
              </a>
            </div>
          </div>

          <p-button
            class="yl-login-button"
            (onClick)="onLogin()"
            size="large"
            label="Sign In to Workspace"
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
            <span class="text-gray-500"> New employee? </span>

            <a
              class="
          cursor-pointer
          text-[#2148BC]
          font-semibold
          hover:underline
        "
              [routerLink]="'/register'"
            >
              Request Onboarding
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
      class="h-screen lg:hidden flex flex-col items-center justify-between relative overflow-hidden bg-[#1E3C92]"
    >
      <div
        class="absolute -top-12 -right-16 w-64 h-64 bg-[#ffffff0d] rounded-full blur-md"
      ></div>
      <div
        class="absolute top-48 -left-12 w-48 h-48 bg-[#60a5fa1a] rounded-full blur"
      ></div>
      <div class="h-[30%] w-full flex flex-col gap-7 p-10">
        <div class="flex flex-row items-center gap-3">
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10 border border-white/20"
          >
            <div class="font-extrabold text-white text-shadow-md">YL</div>
          </div>
          <div class="text-white tracking-wide">WORKS ENTERPRISE</div>
        </div>
        <div class="font-bold text-3xl text-white tracking-wide w-[80%]">
          Log In to stay on top of your tasks and projects.
        </div>
      </div>
      <div class="h-[70%] w-full">
        <div
          class="bg-white h-full p-6 flex flex-col items-center gap-2 rounded-t-4xl"
        >
          <div class="h-1 w-15 rounded-full bg-gray-200"></div>
          <div class="font-extrabold text-3xl mt-4 text-gray-800">Login</div>
          <span class="text-gray-500 text-sm mb-4"
            >Don't Have An Account?
            <b class="text-blue-800 cursor-pointer" [routerLink]="'/register'"
              >Sign Up</b
            ></span
          >

          <div class="flex flex-col mt-3 gap-6 w-full px-5" [formGroup]="FG">
            <div class="relative">
              <input
                type="text"
                pInputText
                class="w-full! bg-gray-50! pl-12! rounded-full! p-5! placeholder:text-gray-400! border-gray-200!"
                formControlName="email"
                placeholder="syukshah@ylworks.com"
              />
              <i class="pi pi-user absolute! top-6! left-5! text-gray-400!"></i>
            </div>
            <div class="relative">
              <p-password
                styleClass="w-full!"
                inputStyleClass="w-full! bg-gray-50! pl-12! rounded-full! p-5! placeholder:text-gray-400! border-gray-200!"
                formControlName="password"
                placeholder="Enter your password"
                [toggleMask]="true"
              />
              <i
                class="pi pi-lock absolute! top-6.5! left-5! text-gray-400!"
              ></i>
            </div>
            <div class="flex flex-row items-center justify-between">
              <div class="flex flex-row items-center gap-2">
                <p-checkbox
                  [binary]="true"
                  formControlName="rememberMe"
                ></p-checkbox>
                <span class="mt-1 text-gray-500 text-sm">Remember Me</span>
              </div>
              <span
                class="text-blue-800 text-sm font-semibold"
                [routerLink]="'/forgot-password'"
                >Forgot Password?</span
              >
            </div>
          </div>
          <p-button
            label="Sign In"
            (onClick)="onLogin()"
            [rounded]="true"
            class="w-full! mt-4 px-4!"
            styleClass="w-full! bg-[#2148BC]! text-white! border-none! p-5!"
          ></p-button>

          <span class="text-gray-500 text-sm text-center"
            >Protected by YL Works Enterprise Security</span
          >
        </div>
      </div>
    </div>
  `,
  styleUrl: './login.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login implements OnDestroy, OnInit {
  private readonly loadingService = inject(LoadingService);
  private readonly messageService = inject(MessageService);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  FG!: FormGroup;
  error: boolean = false;
  errorMessage: string = '';
  isMobile = window.innerWidth < 770;

  @HostListener('window:resize', [])
  onResize() {
    this.isMobile = window.innerWidth < 770;
  }

  constructor() {
    this.FG = new FormGroup({
      email: new FormControl<string | null>(null, [
        Validators.required,
        Validators.email,
      ]),
      password: new FormControl<string | null>(null, Validators.required),
      rememberMe: new FormControl<boolean>(false),
    });
  }

  ngOnInit(): void {}

  CancelDialog() {
    this.error = false;
    this.errorMessage = '';
    this.cdr.detectChanges();
  }

  onLogin(): void {
    if (this.FG.invalid) {
      ValidateAllFormFields(this.FG);
      return;
    }

    this.loadingService.start();

    const email = this.FG.get('email')?.value;
    const password = this.FG.get('password')?.value;
    const rememberMe = this.FG.get('rememberMe')?.value ?? false;

    this.authService
      .login(email, password, rememberMe)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();

          if (res.success) {
            // AuthService should already save the tokens and update currentUser.
            this.router.navigate(['/dashboard']);
            return;
          }

          this.error = true;
          this.errorMessage = res.message ?? 'Login failed';

          this.messageService.add({
            severity: 'error',
            summary: 'Authentication Failed',
            detail: this.errorMessage,
            life: 5000,
          });
        },

        error: (err) => {
          this.loadingService.stop();

          this.error = true;
          this.errorMessage =
            err?.error?.message ?? 'An unexpected network error occurred';

          this.messageService.add({
            severity: 'error',
            summary: 'Login Failed',
            detail: this.errorMessage,
            life: 6000,
          });
        },
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
