import { trigger, transition, style, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../../services/userService.service';

@Component({
  selector: 'app-splash-screen',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="splash-page flex h-screen items-center justify-center relative [background:linear-gradient(0deg,rgba(11,19,41,1)_0%,rgba(11,19,41,1)_100%),linear-gradient(0deg,rgba(255,255,255,1)_0%,rgba(255,255,255,1)_100%)] w-full"
    >
      <div
        class="relative flex-1 w-full grow h-screen overflow-hidden shadow-[0px_25px_70px_#000000a6] [background:linear-gradient(180deg,rgba(30,64,175,1)_0%,rgba(29,78,216,1)_50%,rgba(15,23,42,1)_100%)]"
      >
        <div
          class="absolute w-full h-full top-0 left-0 [background:radial-gradient(50%_50%_at_50%_50%,rgba(255,255,255,0.12)_9%,rgba(255,255,255,0)_9%)] opacity-40"
        ></div>

        <div
          class="absolute h-[76.06%] top-[-4.70%] left-[calc(50.00%_-_170px)] w-[340px] bg-[#3b82f640] rounded-full blur-[32px]"
        ></div>

        <div
          class="absolute -top-16 -right-16 w-80 h-80 rounded-full border border-dashed border-[#ffffff1a]"
        ></div>

        <div
          class="absolute -top-10 -right-10 w-64 h-64 rounded-full border border-solid border-[#93c5fd26]"
        ></div>

        <div
          class="absolute -left-28 bottom-20 w-72 h-72 rounded-full border border-solid border-[#ffffff1a]"
        ></div>

        <div
          class="absolute right-[-60px] -bottom-10 w-64 h-64 bg-[#60a5fa26] rounded-full blur-[20px]"
        ></div>

        <div
          class="absolute inset-0 flex flex-col items-center gap-10 justify-center"
        >
          <div
            class="splash-item bg-white/10 rounded-full flex flex-row gap-2 items-center border border-white/20 px-4 py-1 shadow-sm"
          >
            <i
              class="pi pi-circle-fill text-[5px]! text-green-500! animate-pulse"
            ></i>

            <div class="text-white font-light text-sm tracking-wide">
              YL WORKS PLATFORM
            </div>
          </div>

          <div
            class="splash-logo relative w-40 h-40 rounded-4xl bg-white border-4 border-white inset-shadow-sm inset-shadow-black/50 flex flex-col gap-1 items-center justify-center"
          >
            <div class="relative">
              <div class="text-6xl font-bold text-[#1D4ED8]">YL</div>

              <i
                class="absolute bottom-1 -right-2 pi pi-circle-fill text-[10px]! text-[#2563EB]! border-2 border-white rounded-full"
              ></i>
            </div>

            <span class="text-gray-400 tracking-widest">WORKS</span>

            <div
              class="absolute -bottom-2 -right-4 border-4 w-13 h-13 border-white shadow-lg rounded-2xl flex items-center justify-center bg-[#3878F0]"
            >
              <i class="pi pi-check-circle text-white text-xl!"></i>
            </div>
          </div>

          <div
            class="splash-item flex flex-col gap-2 text-center justify-center items-center"
          >
            <div class="font-bold text-4xl text-white">YL WORKS</div>

            <span class="text-white/80 w-[80%]">
              Enterprise Workspace & Operational Management
            </span>
          </div>

          <div class="splash-features flex flex-row items-center gap-3">
            <div
              class="rounded-full px-5 py-2 flex flex-row items-center justify-center gap-2 bg-white/10 border border-white/20"
            >
              <i class="pi pi-check-circle text-white/50!"></i>
              <span class="text-sm text-white">Tasks</span>
            </div>

            <div
              class="rounded-full px-5 py-2 flex flex-row items-center justify-center gap-2 bg-white/10 border border-white/20"
            >
              <i class="pi pi-calendar text-white/50!"></i>
              <span class="text-sm text-white">Schedule</span>
            </div>

            <div
              class="rounded-full px-5 py-2 flex flex-row items-center justify-center gap-2 bg-white/10 border border-white/20"
            >
              <i class="pi pi-id-card text-white/50!"></i>
              <span class="text-sm text-white">Directory</span>
            </div>
          </div>

          <div
            class="splash-progress h-[5px] w-[50%] bg-white/60 rounded-full overflow-hidden"
          >
            <div
              class="splash-progress-bar h-full bg-white rounded-full origin-left"
            ></div>
          </div>

          <div
            class="splash-item flex flex-row items-center gap-2 animate-pulse"
          >
            <i class="pi pi-circle-fill text-blue-100! text-[5px]!"></i>

            <span class="text-white/80"> Initializing workspace... </span>
          </div>

          <div class="splash-copyright text-white/60 text-sm">
            © YL Systems. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './splash-screen.less',
  animations: [
    trigger('fade', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [animate('500ms ease-in', style({ opacity: 0 }))]),
    ]),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SplashScreen implements OnInit {
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  private readonly cdr = inject(ChangeDetectorRef);

  isLoading: boolean = true;

  ngOnInit(): void {
    setTimeout(() => {
      const currentUser = this.userService.currentUser;

      const token =
        localStorage.getItem('jwtToken') ?? sessionStorage.getItem('jwtToken');

      const isAuthenticated = !!currentUser && !!token;

      this.isLoading = false;
      this.cdr.markForCheck();

      setTimeout(() => {
        if (isAuthenticated) {
          this.router.navigate(['/dashboard']);
        } else {
          this.router.navigate(['/get-started']);
        }
      }, 500);
    }, 2000);
  }
}
