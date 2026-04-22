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
      class="py-8 min-h-screen w-full flex flex-col gap-4 justify-center items-center bg-[#F2F4F8]"
    >
      <div
        class="w-[50%] xl:w-[32%] 2xl:w-[30%] p-8 shadow-sm bg-white border border-gray-200 rounded-2xl flex flex-col"
      >
        <div class="flex flex-col items-center">
          <div
            class="bg-[#202838] shadow-md rounded-md w-14 h-14 flex justify-center items-center p-2"
          >
            <img src="assets/logo.png" alt="" class="w-full" />
          </div>
          <div class="font-semibold tracking-widest text-xl pt-2">YL Works</div>

          <div class="pb-5 text-sm text-gray-500 tracking-wide">
            Manage Everything. Effortlessly.
          </div>
        </div>
        <div class="font-semibold tracking-wide text-2xl text-gray-700">
          Welcome Back
        </div>
        <div class="pt-1 text-gray-500 text-sm tracking-wide">
          Sign in to your account to continue
        </div>
        <div class="pt-8 flex flex-col gap-6" [formGroup]="FG">
          <div class="flex flex-col gap-1">
            <label for="" class="text-sm text-gray-600 tracking-wide"
              >Email</label
            >
            <input
              type="text"
              pInputText
              class="w-full py-3!"
              formControlName="email"
            />
            <div
              *ngIf="FG.get('email')?.touched && FG.get('email')?.invalid"
              class="text-red-500 text-xs"
            >
              <div *ngIf="FG.get('email')?.errors?.['required']">
                Email is required.
              </div>
              <div *ngIf="FG.get('email')?.errors?.['email']">
                Please enter a valid email address.
              </div>
            </div>
          </div>
          <div class="flex flex-col gap-1">
            <label for="" class="text-sm text-gray-600 tracking-wide"
              >Password</label
            >
            <p-password
              [toggleMask]="true"
              styleClass="!w-full"
              inputStyleClass="!w-full !py-3"
              formControlName="password"
            ></p-password>
            <div
              *ngIf="FG.get('password')?.touched && FG.get('password')?.invalid"
              class="text-red-500 text-xs"
            >
              <div *ngIf="FG.get('password')?.errors?.['required']">
                Password is required.
              </div>
            </div>
            <div class="pt-2 flex flex-row items-center justify-between">
              <div class="flex flex-row items-center gap-2">
                <p-checkbox
                  [binary]="true"
                  formControlName="rememberMe"
                ></p-checkbox>
                <div class="text-sm text-gray-400 mt-1.5">Remember me</div>
              </div>

              <div
                [routerLink]="'/reset-link'"
                class="text-sm text-[#4D46F7] cursor-pointer hover:underline"
              >
                Forgot Password ?
              </div>
            </div>
          </div>
        </div>
        <div class="pt-5">
          <p-button
            (onClick)="onLogin()"
            label="Sign In"
            styleClass="!bg-[#4D46F7] !w-full !border-none !py-3 !tracking-wide"
          ></p-button>
        </div>
        <!-- <div class="text-center pt-3 text-gray-500 text-sm">
          Don't have an account?
          <b
            class="text-[#4D46F7] cursor-pointer hover:underline tracking-wide!"
            [routerLink]="'/register'"
            >Create account</b
          >
        </div> -->
      </div>
      <div class="text-gray-500 text-sm w-full text-center">
        © 2025 YL Systems Sdn Bhd. All rights reserved.
      </div>
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
            // ✅ Set currentUser in UserService
            this.userService.setCurrentUser(res, rememberMe);

            // Navigate only after currentUser is set
            this.router.navigate(['/dashboard']);
          } else {
            this.error = true;
            this.errorMessage = res.message ?? 'Login failed';
            this.messageService.add({
              severity: 'error', // 'success', 'warn', 'info' also available
              summary: 'Login Failed', // short title
              detail: this.errorMessage, // detailed message
              life: 5000, // duration in ms
            });
          }
        },
        error: (err) => {
          this.loadingService.stop();
          this.error = true;
          this.errorMessage =
            err?.error?.message ?? 'An unexpected error occurred';
        },
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
