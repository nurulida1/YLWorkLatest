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
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { LoadingService } from '../../services/loading.service';
import { Subject, takeUntil } from 'rxjs';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ValidateAllFormFields } from '../../shared/helpers/helpers';
import { AuthService } from '../../services/authService';
import { UserService } from '../../services/userService.service';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';

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
  ],
  template: `
    <div
      class="w-full min-h-screen bg-slate-100 flex items-center justify-center font-sans"
    >
      <main
        class="w-[90%] max-w-[1300px] h-[85vh] bg-white shadow-2xl rounded-3xl overflow-hidden grid grid-cols-12 border border-slate-100"
      >
        <section
          class="col-span-12 lg:col-span-5 p-10 flex flex-col items-center justify-center"
        >
          <div class="flex flex-col items-center gap-3 mb-10 text-center">
            <div
              class="w-16 h-16 flex items-center justify-center p-3 rounded-2xl bg-slate-900 shadow-lg mb-2"
            >
              <img
                src="assets/yl-works-logo.png"
                alt="YL Works Icon"
                class="w-full h-full object-contain"
              />
            </div>
            <h1 class="text-3xl font-bold tracking-tight text-slate-950">
              Welcome Back
            </h1>
            <p class="text-sm text-slate-600 max-w-sm">
              Please sign in to your corporate account to access your workspace.
            </p>
          </div>

          <form
            [formGroup]="FG"
            class="flex flex-col gap-5 w-full max-w-[380px]"
          >
            <div class="flex flex-col gap-1.5 relative">
              <label
                for="email"
                class="text-xs font-semibold uppercase tracking-wider text-slate-600 pl-1"
              >
                Workspace Email
              </label>
              <input
                id="email"
                type="text"
                pInputText
                class="w-full text-sm! py-3! pl-4! pr-10! border-slate-200 focus:border-slate-800 transition shadow-inner bg-slate-50!"
                placeholder="you@company.com"
                formControlName="email"
              />
              <i
                class="pi pi-envelope absolute right-3.5 top-1/2 -translate-y-[10%] text-slate-400"
              ></i>

              <small
                *ngIf="FG.get('email')?.touched && FG.get('email')?.invalid"
                class="text-rose-600 text-xs pl-1"
              >
                Please enter a valid workspace email address.
              </small>
            </div>

            <div class="flex flex-col gap-1.5 relative">
              <label
                for="password"
                class="text-xs font-semibold uppercase tracking-wider text-slate-600 pl-1"
              >
                Password
              </label>
              <p-password
                id="password"
                formControlName="password"
                [toggleMask]="true"
                [feedback]="false"
                inputStyleClass="w-full! text-sm! py-3! pl-4! pr-12! border-slate-200 focus:border-slate-800 transition shadow-inner bg-slate-50!"
                styleClass="w-full!"
                placeholder="Enter your password"
              ></p-password>
              <small
                *ngIf="
                  FG.get('password')?.touched && FG.get('password')?.invalid
                "
                class="text-rose-600 text-xs pl-1"
              >
                Password is required.
              </small>
            </div>

            <div class="flex flex-row items-center justify-between mt-1 px-1">
              <div class="flex flex-row items-center gap-2.5">
                <p-checkbox
                  id="rememberMe"
                  formControlName="rememberMe"
                  [binary]="true"
                  styleClass="border-slate-300"
                ></p-checkbox>
                <label
                  for="rememberMe"
                  class="text-slate-700 text-sm font-medium"
                >
                  Remember my credentials
                </label>
              </div>
              <a
                routerLink="/forgot-password"
                class="text-sm font-semibold text-slate-900 hover:text-slate-800 hover:underline cursor-pointer transition-colors"
              >
                Forgot Password?
              </a>
            </div>

            <div class="w-full mt-6">
              <p-button
                label="Authenticate & Sign In"
                size="large"
                icon="pi pi-sign-in"
                styleClass="w-full! py-4! text-base! font-semibold! rounded-xl!"
                class="shadow-sm"
                severity="contrast"
                (onClick)="onLogin()"
              ></p-button>
            </div>
          </form>

          <footer class="mt-16 text-slate-400 text-xs text-center">
            © 2026 YL Systems Sdn Bhd. All rights reserved.<br />
            Petaling Jaya, Selangor.
          </footer>
        </section>

        <aside
          class="hidden lg:col-span-7 lg:flex h-full bg-slate-950 flex-col items-center justify-center p-12 relative"
        >
          <div
            class="absolute inset-0 opacity-10 bg-[url('/assets/brand-pattern.png')] bg-cover"
          ></div>

          <img
            src="assets/illustration.png"
            alt="Collaborative Team Work"
            class="w-[80%] object-contain relative z-10"
          />

          <div class="mt-12 text-center text-white relative z-10 max-w-sm">
            <h2 class="text-2xl font-bold tracking-tight mb-2">
              YL Works System
            </h2>
            <p
              class="text-sm text-slate-400 leading-relaxed tracking-wide font-light"
            >
              Internal platform for managing business operations and information
              workflows.
            </p>
          </div>
        </aside>
      </main>
    </div>
  `,
  styleUrl: './login.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login implements OnDestroy, OnInit {
  private readonly loadingService = inject(LoadingService);
  private readonly messageService = inject(MessageService);
  private readonly userService = inject(UserService);
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

  onLogin() {
    if (!this.FG.valid) {
      ValidateAllFormFields(this.FG);
      return;
    }

    this.loadingService.start();

    const email = this.FG.get('email')?.value;
    const password = this.FG.get('password')?.value;
    const rememberMe = this.FG.get('rememberMe')?.value;

    this.authService
      .authenticate(email, password)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();

          if (res.success) {
            this.userService.setCurrentUser(res, rememberMe);

            this.router.navigate(['/dashboard']);
          } else {
            this.error = true;
            this.errorMessage = res.message ?? 'Login failed';
            this.messageService.add({
              severity: 'error',
              summary: 'Authentication Failed',
              detail: this.errorMessage,
              life: 5000,
            });
          }
        },
        error: (err) => {
          this.loadingService.stop();
          this.error = true;
          this.errorMessage =
            err?.error?.message ?? 'An unexpected network error occurred';
          this.messageService.add({
            severity: 'warn',
            summary: 'Network Error',
            detail: this.errorMessage,
            life: 6000,
          });
        },
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
