import { CommonModule, Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  imports: [CommonModule],
  template: `
    <main
      class="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-8 sm:px-6 lg:px-8"
    >
      <div class="w-full max-w-5xl">
        <!-- Main Container -->
        <div
          class="grid grid-cols-1 lg:grid-cols-2 bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-xl shadow-slate-300/30 min-h-[580px]"
        >
          <!-- Left Panel: Desktop -->
          <section
            class="hidden lg:flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-blue-900 p-12 text-white"
          >
            <!-- Background Decorations -->
            <div
              class="absolute -top-24 -right-24 w-80 h-80 rounded-full border border-white/10"
            ></div>
            <div
              class="absolute -top-12 -right-12 w-56 h-56 rounded-full border border-white/10"
            ></div>
            <div
              class="absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl"
            ></div>

            <!-- Brand -->
            <div class="relative z-10 flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center"
              >
                <i class="pi pi-building text-2xl text-white"></i>
              </div>

              <div>
                <h1 class="text-xl font-extrabold tracking-wider">YL WORKS</h1>
                <p
                  class="text-[10px] font-semibold tracking-[0.2em] text-blue-200 uppercase"
                >
                  Workplace Management
                </p>
              </div>
            </div>

            <!-- Illustration -->
            <div class="relative z-10 flex flex-col items-center text-center">
              <div
                class="relative w-64 h-64 flex items-center justify-center mb-9"
              >
                <div
                  class="absolute inset-0 rounded-full border border-white/10 bg-white/[0.03]"
                ></div>
                <div
                  class="absolute inset-7 rounded-full border border-white/10"
                ></div>

                <div
                  class="relative w-40 h-40 rounded-[2rem] bg-white/10 border border-white/15 backdrop-blur-sm flex items-center justify-center rotate-[-6deg]"
                >
                  <i class="pi pi-shield text-8xl text-blue-200"></i>
                </div>

                <div
                  class="absolute bottom-5 right-5 w-16 h-16 rounded-2xl bg-red-500 flex items-center justify-center shadow-xl shadow-red-950/30"
                >
                  <i class="pi pi-lock text-3xl text-white"></i>
                </div>

                <div
                  class="absolute top-8 left-5 w-3 h-3 rounded-full bg-blue-300"
                ></div>
                <div
                  class="absolute top-16 right-4 w-2 h-2 rounded-full bg-white/60"
                ></div>
                <div
                  class="absolute bottom-8 left-8 w-2 h-2 rounded-full bg-red-300"
                ></div>
              </div>

              <h2 class="text-3xl font-bold tracking-tight">
                Your access matters.
              </h2>

              <p class="mt-4 text-sm leading-7 text-blue-100/75 max-w-sm">
                YL WORKS keeps your workplace information secure. Access to
                certain areas is restricted based on your assigned permissions.
              </p>
            </div>

            <!-- Left Footer -->
            <div
              class="relative z-10 flex items-center justify-between text-xs text-blue-200/60"
            >
              <span>Secure Workplace Platform</span>
              <span>YL Systems Sdn. Bhd.</span>
            </div>
          </section>

          <!-- Right Panel: Content -->
          <section
            class="flex flex-col justify-center px-6 py-10 sm:px-12 sm:py-14 lg:px-14"
          >
            <!-- Mobile Brand -->
            <div class="flex lg:hidden items-center justify-center gap-3 mb-10">
              <div
                class="w-11 h-11 rounded-xl bg-blue-950 flex items-center justify-center shadow-lg shadow-blue-950/20"
              >
                <i class="pi pi-building text-xl text-white"></i>
              </div>

              <div>
                <h1 class="text-lg font-extrabold tracking-wide text-slate-900">
                  YL WORKS
                </h1>
                <p
                  class="text-[9px] font-semibold tracking-[0.18em] text-slate-400 uppercase"
                >
                  Workplace Management
                </p>
              </div>
            </div>

            <!-- Error Icon -->
            <div class="flex justify-center lg:justify-start mb-8">
              <div
                class="relative w-20 h-20 rounded-3xl bg-red-50 border border-red-100 flex items-center justify-center"
              >
                <i class="pi pi-shield text-4xl text-red-500"></i>

                <span
                  class="absolute -bottom-2 -right-2 w-9 h-9 rounded-xl bg-white border border-red-100 shadow-sm flex items-center justify-center"
                >
                  <i class="pi pi-lock text-red-500 text-sm"></i>
                </span>
              </div>
            </div>

            <!-- Error Content -->
            <div class="text-center lg:text-left">
              <div
                class="inline-flex items-center gap-2 rounded-full bg-red-50 border border-red-100 px-3 py-1.5 mb-5"
              >
                <span class="w-2 h-2 rounded-full bg-red-500"></span>
                <span class="text-[11px] font-bold tracking-wider text-red-600">
                  ERROR 403
                </span>
              </div>

              <h2
                class="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900"
              >
                Access Denied
              </h2>

              <p
                class="mt-4 text-sm sm:text-base text-slate-500 leading-7 max-w-md mx-auto lg:mx-0"
              >
                You don't have the required permission to view this page. Your
                account may not have access to this particular module or
                resource.
              </p>
            </div>

            <!-- Information Card -->
            <div
              class="mt-8 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 sm:p-5"
            >
              <div class="flex items-start gap-3">
                <div
                  class="w-9 h-9 shrink-0 rounded-xl bg-white flex items-center justify-center shadow-sm"
                >
                  <i class="pi pi-info-circle text-blue-600"></i>
                </div>

                <div>
                  <h3 class="text-sm font-bold text-slate-800">
                    Need access to this page?
                  </h3>

                  <p class="mt-1.5 text-xs sm:text-sm text-slate-600 leading-6">
                    Please contact your department administrator or system
                    administrator to request the necessary permissions.
                  </p>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8">
              <button
                type="button"
                (click)="goBack()"
                class="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98]"
              >
                <i class="pi pi-arrow-left"></i>
                <span>Go Back</span>
              </button>

              <button
                type="button"
                (click)="goDashboard()"
                class="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-950 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-950/15 transition-all duration-200 hover:bg-blue-900 active:scale-[0.98]"
              >
                <i class="pi pi-home"></i>
                <span>Dashboard</span>
              </button>
            </div>

            <!-- Footer -->
            <div class="mt-10 pt-6 border-t border-slate-100">
              <p class="text-center text-[11px] text-slate-400">
                © {{ year }} YL Systems Sdn. Bhd. All rights reserved.
              </p>
            </div>
          </section>
        </div>

        <!-- Bottom Note -->
        <p class="text-center text-[11px] text-slate-400 mt-5">
          If you believe this is an error, please contact your administrator.
        </p>
      </div>
    </main>
  `,
  styleUrl: './unauthorized.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Unauthorized {
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  year = new Date().getFullYear();

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    this.goDashboard();
  }

  goDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
