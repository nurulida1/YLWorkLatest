import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
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
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { Subject, takeUntil } from 'rxjs';
import { LoadingService } from '../../services/loading.service';
import { UserService } from '../../services/userService.service';
import { MessageService } from 'primeng/api';
import { UserRole } from '../../shared/enum/enum';
import { RouterLink } from '@angular/router';
import { ValidateAllFormFields } from '../../shared/helpers/helpers';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-register',
  imports: [
    CommonModule,
    ButtonModule,
    ReactiveFormsModule,
    InputTextModule,
    PasswordModule,
    RouterLink,
    SelectModule,
    CheckboxModule,
    DialogModule,
  ],
  template: `<div
      class="py-5 min-h-screen w-full flex flex-col justify-center items-center bg-[#F2F4F8]"
    >
      @if (!successRegistered) {
        <div
          class="w-[90%] xl:max-w-[32%] p-8 shadow-sm bg-white border border-gray-200 rounded-2xl flex flex-col"
        >
          <div class="flex flex-col items-center">
            <div
              class="w-16 h-16 flex items-center justify-center p-3 rounded-2xl bg-sky-950 shadow-lg mb-2"
            >
              <img
                src="assets/yl-works-logo.png"
                alt="YL Works Icon"
                class="w-full h-full object-contain"
              />
            </div>
            <div class="font-semibold tracking-widest text-xl pt-2">
              YL Works
            </div>
            <div class="pb-5 text-sm text-gray-500 tracking-wide">
              Manage Everything. Effortlessly.
            </div>
          </div>
          <div class="font-semibold tracking-wide text-2xl text-gray-700">
            Create Account
          </div>
          <div class="pt-1 text-gray-500 text-sm tracking-wide">
            Sign up to get started
          </div>
          <div class="mt-5 grid grid-cols-12 gap-4" [formGroup]="FG">
            <div class="col-span-12 lg:col-span-6">
              <div class="flex flex-col gap-1">
                <label for="" class="text-sm text-gray-600 tracking-wide"
                  >Full Name</label
                >
                <input
                  type="text"
                  pInputText
                  class="w-full !py-2.5 !text-sm"
                  placeholder="Ahmad bin Abu"
                  formControlName="fullName"
                />
                <div
                  *ngIf="
                    FG.get('fullName')?.touched && FG.get('fullName')?.invalid
                  "
                  class="text-red-500 text-xs"
                >
                  <div *ngIf="FG.get('fullName')?.errors?.['required']">
                    Full Name is required.
                  </div>
                </div>
              </div>
            </div>
            <div class="col-span-12 lg:col-span-6">
              <div class="flex flex-col gap-1">
                <label for="" class="text-sm text-gray-600 tracking-wide"
                  >Display Name</label
                >
                <input
                  type="text"
                  pInputText
                  placeholder="Ahmad"
                  class="w-full !py-2.5 !text-sm"
                  formControlName="displayName"
                />
                <div
                  *ngIf="
                    FG.get('displayName')?.touched &&
                    FG.get('displayName')?.invalid
                  "
                  class="text-red-500 text-xs"
                >
                  <div *ngIf="FG.get('displayName')?.errors?.['required']">
                    Display Name is required.
                  </div>
                </div>
              </div>
            </div>
            <div class="col-span-12">
              <div class="flex flex-col gap-1">
                <label for="" class="text-sm text-gray-600 tracking-wide"
                  >Email Address</label
                >
                <input
                  type="text"
                  pInputText
                  placeholder="ahmad@ylsystems.com"
                  class="w-full !py-2.5 !text-sm"
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
            </div>
            <div class="col-span-12">
              <div class="flex flex-col gap-1">
                <label for="" class="text-sm text-gray-600 tracking-wide"
                  >Job Title</label
                >
                <input
                  type="text"
                  pInputText
                  formControlName="jobTitle"
                  placeholder="Technical Support"
                  class="w-full! text-sm! py-2.5!"
                />
              </div>
            </div>
            <div class="col-span-12">
              <div class="flex flex-col gap-1">
                <label for="" class="text-sm text-gray-600 tracking-wide"
                  >Password</label
                >
                <p-password
                  [toggleMask]="true"
                  styleClass="!w-full"
                  placeholder="●●●●●●●●"
                  inputStyleClass="!w-full !py-2.5 !text-sm"
                  formControlName="password"
                ></p-password>
                <div
                  *ngIf="
                    FG.get('password')?.touched && FG.get('password')?.invalid
                  "
                  class="text-red-500 text-xs"
                >
                  <div *ngIf="FG.get('password')?.errors?.['required']">
                    Password is required.
                  </div>
                </div>
                <div class="text-xs text-gray-500">
                  Must be at least 8 characters
                </div>
              </div>
            </div>
            <div class="col-span-12">
              <div class="flex flex-col gap-1">
                <label for="" class="text-sm text-gray-600 tracking-wide"
                  >Confirm Password</label
                >
                <p-password
                  [toggleMask]="true"
                  styleClass="!w-full"
                  placeholder="●●●●●●●●"
                  inputStyleClass="!w-full !py-2.5 !text-sm"
                  formControlName="confirmPassword"
                ></p-password>
                <div
                  *ngIf="
                    FG.get('confirmPassword')?.touched &&
                    FG.get('confirmPassword')?.invalid
                  "
                  class="text-red-500 text-xs"
                >
                  <div *ngIf="FG.get('confirmPassword')?.errors?.['required']">
                    Confirm Password is required.
                  </div>
                </div>
                <div class="pt-2 flex flex-row items-center justify-between">
                  <div class="flex flex-row items-center gap-2">
                    <p-checkbox
                      formControlName="isAgree"
                      [binary]="true"
                    ></p-checkbox>
                    <div class="text-sm text-gray-500 mt-1">
                      I agree to the
                      <span
                        class="text-sky-800 font-semibold cursor-pointer hover:underline"
                        (click)="tncVisible = true"
                        >Terms and Conditions</span
                      >
                      and
                      <span
                        class="text-sky-800 font-semibold cursor-pointer hover:underline"
                        (click)="ppVisible = true"
                        >Privacy Policy</span
                      >
                      of YL Systems Sdn Bhd.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="pt-5">
            <p-button
              [disabled]="!FG.get('isAgree')?.value"
              (onClick)="Register()"
              label="Create Account"
              styleClass="!bg-sky-800 !w-full !border-none !py-3 !tracking-wide"
            ></p-button>
          </div>
          <div class="text-center pt-3 text-gray-500 text-sm">
            Already have an account?
            <b
              class="text-sky-800 cursor-pointer hover:underline !tracking-wide"
              [routerLink]="'/login'"
              >Sign In</b
            >
          </div>
        </div>
      } @else {
        <div
          class="w-[90%] xl:max-w-[32%] shadow-sm bg-white border border-gray-200 rounded-2xl flex flex-col"
        >
          <div class="flex flex-col shadow-lg rounded-xl">
            <div class="w-full h-80">
              <img
                src="assets/register-bg.png"
                alt=""
                class="w-full h-full object-cover rounded-t-xl"
              />
            </div>
            <div
              class="w-full p-10 border-t border-gray-200 flex flex-col gap-3 items-center justify-center"
            >
              <div class="font-extrabold text-gray-800 text-3xl">
                Registration Received
              </div>
              <span class="text-gray-500 text-center max-w-sm"
                >Your account has been created successfully. Please wait while
                an administrator reviews and approves your access.</span
              >
              <span class="text-gray-400 italic text-center max-w-sm"
                >You will receive an email notification once your account is
                active.</span
              >

              <p-button
                [routerLink]="'/login'"
                class="w-sm!"
                styleClass="w-full! bg-sky-900! border-none! py-3! shadow-lg! hover:scale-101!"
                label="Return to Login"
                icon="pi pi-sign-in"
              ></p-button>

              <span
                class="mt-2 flex flex-row justify-center items-center gap-2 text-gray-500 font-semibold"
              >
                <i class="pi pi-question-circle text-gray-500!"></i>
                <span>Need assistance? Contact IT Support</span>
              </span>
            </div>
          </div>
        </div>
      }
      <div class="pt-3 text-gray-500 text-sm w-full text-center">
        © 2026 YL Systems Sdn Bhd. All rights reserved.
      </div>
    </div>

    <!-- tnc -->
    <p-dialog
      [(visible)]="tncVisible"
      (onHide)="tncVisible = false"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [dismissableMask]="true"
      styleClass="!w-[50%]"
    >
      <ng-template #headless>
        <div class="p-8 flex flex-col gap-5">
          <div class="font-bold text-xl text-center tracking-wide">
            Terms and Conditions
          </div>
          <div
            class="pt-4 tracking-wide text-gray-600 overflow-auto h-[400px] flex flex-col gap-2"
          >
            <div>
              Welcome to <b>YL Works</b>, an internal system developed for
              employees of <b>YL Systems Sdn Bhd.</b> By creating an account and
              using this system, you agree to the following Terms & Conditions:
            </div>
            <div class="border-b border-gray-200 mt-2 mb-2"></div>
            <b class="pb-1">1. Purpose of the System</b>
            <div>YL Works is provided to employees for:</div>
            <ul class="list-disc pl-5">
              <li class="pb-1">Leave management</li>
              <li class="pb-1">Attendance and HR-related processes</li>
              <li class="pb-1">Payslip viewing</li>
              <li class="pb-1">
                Job, quotation, material, WO, PO and project management
              </li>
              <li class="pb-1">
                Internal communication and administrative tasks
              </li>
            </ul>
            <div>This system is strictly for <b>company use only.</b></div>
            <div class="border-b border-gray-200 mt-2 mb-2"></div>
            <b class="pt-3"> 2. User Responsibilities</b>
            <div>By using the system, you agree to:</div>
            <ol class="list-decimal pl-5 pt-1">
              <li class="pb-2">
                Provide accurate and truthful information when registering or
                updating your profile.
              </li>
              <li class="pb-2">
                Keep your login credentials confidential and not share them with
                anyone.
              </li>
              <li class="pb-2">
                Use the system in compliance with company rules, policies and
                Malaysian law.
              </li>
              <li class="pb-2">
                Notify HR/Admin immediately if you suspect unauthorized access
                to your account.
              </li>
            </ol>
            <div class="border-b border-gray-200 mt-2 mb-2"></div>
            <b class="pb-1 pt-2">3. Prohibited Activities</b>
            <div>Users must <b>not:</b></div>
            <ul class="list-disc pl-5">
              <li class="pb-2">
                Attempt to hack, disrupt, or interfere with the system.
              </li>
              <li class="pb-2">Attendance and HR-related processes</li>
              <li class="pb-2">
                Access modules or data not authorized for your role.
              </li>
              <li class="pb-2">
                Upload harmful content, malicious files, or false information.
              </li>
              <li class="pb-2">
                Share internal company data with unauthorized persons.
              </li>
            </ul>
            <div>
              Any violation may result in account suspension or disciplinary
              action.
            </div>
            <div class="border-b border-gray-200 mt-2 mb-2"></div>
            <b class="py-1 pt-3">4. System Availability</b>
            <div>
              YL Systems strives to ensure smooth system operation, but:
            </div>
            <ul class="list-disc pl-5">
              <li class="pb-2">
                The system may occasionally be unavailable due to maintenance.
              </li>
              <li class="pb-2">
                The company is not liable for data loss caused by hardware
                failure, outages, or technical issues.
              </li>
            </ul>
            <div class="border-b border-gray-200 mt-2 mb-2"></div>
            <b class="pt-2"> 5. Data Ownership</b>
            <div>
              All data entered into YL Works—including employee records,
              attendance, jobs, purchase orders, etc.—is the property of
              <b>YL Systems Sdn Bhd.</b>
            </div>
            <div class="py-1">
              Users do not have ownership rights over system data.
            </div>
            <div class="border-b border-gray-200 mt-2 mb-2"></div>
            <b class="pt-2">6. Modifications to Terms</b>
            <div>
              YL Systems may update these Terms & Conditions at any time.
            </div>
            <div>
              Users will be notified of material changes through the system or
              email.
            </div>
            <div class="py-2">
              Continued use of the system means you accept the updated terms.
            </div>
            <div class="border-b border-gray-200 mt-2 mb-2"></div>
            <b class="pt-2">7. Contact</b>
            <div>
              For any questions or issues related to the system, please contact:
            </div>
            <b class="py-2">YL Systems HR/Admin Department</b>
          </div>
          <p-button
            (onClick)="tncVisible = false"
            styleClass="!w-full !border-none !bg-black !py-3 !tracking-wide"
            label="Accept"
          ></p-button></div
      ></ng-template>
    </p-dialog>

    <!-- privacy Policy -->

    <p-dialog
      [(visible)]="ppVisible"
      (onHide)="ppVisible = false"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [dismissableMask]="true"
      styleClass="!w-[50%]"
    >
      <ng-template #headless>
        <div class="p-8 flex flex-col gap-5">
          <div class="font-bold text-xl text-center tracking-wide">
            Privacy Policy
          </div>
          <div
            class="pt-4 tracking-wide text-gray-600 overflow-auto h-[400px] flex flex-col gap-2"
          >
            <div>
              YL Systems Sdn Bhd is committed to protecting your privacy. This
              Privacy Policy explains how your information is collected, used,
              and protected when using <b>YL Works.</b>
            </div>
            <div class="border-b border-gray-200 mt-2 mb-2"></div>
            <b class="pb-1">1. Information We Collect</b>
            <div>
              We collect information necessary for HR, payroll, job management,
              and system operations, including:
            </div>
            <b>Personal Information</b>
            <ul class="list-disc pl-5">
              <li class="pb-1">Full Name</li>
              <li class="pb-1">Email Address</li>
              <li class="pb-1">Phone Number</li>
              <li class="pb-1">Role/Department</li>
            </ul>
            <b>Employment Information</b>
            <ul class="list-disc pl-5">
              <li class="pb-1">Attendance & leave records</li>
              <li class="pb-1">Payslip & salary details</li>
              <li class="pb-1">Job/Work Order activity</li>
              <li class="pb-1">System usage logs</li>
            </ul>
            <b>Technical Data</b>
            <ul class="list-disc pl-5">
              <li class="pb-1">Device/browser information</li>
              <li class="pb-1">Login timestamps</li>
              <li class="pb-1">IP address (for security)</li>
            </ul>
            <div class="border-b border-gray-200 mt-2 mb-2"></div>
            <b class="pt-3">2. How We Use Your Information</b>
            <div>Your information is used to:</div>
            <ol class="list-disc pl-5 pt-1">
              <li class="pb-2">
                Manage HR processes (leave, payroll, attendance)
              </li>
              <li class="pb-2">
                Process job orders, quotations, and internal tasks
              </li>
              <li class="pb-2">Provide access control based on your role</li>
              <li class="pb-2">Improve system performance and security</li>
              <li class="pb-2">Maintain accurate company records</li>
            </ol>
            <div>
              We do <b>NOT</b> sell, trade, or share your data with external
              parties except when required by law.
            </div>
            <div class="border-b border-gray-200 mt-2 mb-2"></div>
            <b class="pb-1 pt-2">3. Data Sharing</b>
            <div>Your data may be shared internally with:</div>
            <ul class="list-disc pl-5">
              <li class="pb-2">
                Attempt to hack, disrupt, or interfere with the system.
              </li>
              <li class="pb-2">HR Department</li>
              <li class="pb-2">Payroll/Finance</li>
              <li class="pb-2">Management Team</li>
            </ul>
            <div>External sharing happens <b>only</b> when:</div>
            <ul class="list-disc pl-5">
              <li class="pb-2">Required by Malaysian law</li>
              <li class="pb-2">
                Required for payroll compliance or statutory submissions (EPF,
                SOCSO, LHDN)
              </li>
              <li class="pb-2">
                Required for system maintenance by authorized vendors under NDA
              </li>
            </ul>
            <div class="border-b border-gray-200 mt-2 mb-2"></div>

            <b class="py-1 pt-3">4. Data Security</b>
            <div>
              We implement reasonable security measures to protect your data,
              including:
            </div>
            <ul class="list-disc pl-5">
              <li class="pb-2">Encrypted password storage</li>
              <li class="pb-2">Access control based on user role</li>
              <li class="pb-2">Activity logging & monitoring</li>
              <li class="pb-2">Secure server hosting environment</li>
            </ul>
            <div>
              Despite best efforts, no system is 100% secure, but we
              continuously maintain and upgrade security measures.
            </div>
            <div class="border-b border-gray-200 mt-2 mb-2"></div>

            <b class="pt-2"> 5. Your Rights</b>
            <div>You may request to:</div>
            <ul class="list-disc pl-5">
              <li class="pb-2">Update your personal information</li>
              <li class="pb-2">Access your own employment records</li>
              <li class="pb-2">Report incorrect or missing information</li>
              <li class="pb-2">
                Request assistance from HR/Admin regarding your account
              </li>
            </ul>
            <div class="border-b border-gray-200 mt-2 mb-2"></div>
            <b class="pt-2">6. Data Retention</b>
            <div>Employee data will be retained:</div>
            <ul class="list-disc pl-5">
              <li class="pb-2">As long as you are an active employee</li>
              <li class="pb-2">
                Up to 7 years after employment ends (for statutory & audit
                purposes)
              </li>
            </ul>
            <div class="border-b border-gray-200 mt-2 mb-2"></div>
            <b class="pt-2">7. Changes to Privacy Policy</b>
            <div class="pt-2">
              This policy may be updated from time to time.
            </div>
            <div>Updates will be posted within the system.</div>
            <div class="border-b border-gray-200 mt-2 mb-2"></div>

            <b class="pt-2">8. Contact</b>
            <div>For privacy-related concerns, contact:</div>
            <b class="pt-2">YL Systems HR/Admin Department</b>
            <div class="pb-2">Email / Internal Contact</div>
          </div>
          <p-button
            (onClick)="ppVisible = false"
            styleClass="!w-full !border-none !bg-black !py-3 !tracking-wide"
            label="Accept"
          ></p-button></div
      ></ng-template>
    </p-dialog> `,
  styleUrl: './register.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Register implements OnDestroy {
  private readonly loadingService = inject(LoadingService);
  private readonly messageService = inject(MessageService);
  private readonly userService = inject(UserService);
  private readonly cdr = inject(ChangeDetectorRef);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  FG!: FormGroup;
  successRegistered: boolean = false;
  tncVisible: boolean = false;
  ppVisible: boolean = false;
  isMobile = window.innerWidth < 770;

  @HostListener('window:resize', [])
  onResize() {
    this.isMobile = window.innerWidth < 770;
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
    if (this.FG.valid) {
      this.loadingService.start();
      this.userService
        .Register(this.FG.value)
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe({
          next: (res) => {
            if (res) {
              setTimeout(() => {
                this.loadingService.stop();
                this.successRegistered = true;
                this.cdr.detectChanges();
              }, 1500);
            } else {
              this.loadingService.stop();

              return this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: res,
              });
            }
          },
          error: (err) => {
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
