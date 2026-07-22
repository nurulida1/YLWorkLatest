import { trigger, transition, style, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-splash-screen',
  imports: [CommonModule],
  template: `
    <div
      *ngIf="isLoading"
      @fade
      class="bg-black w-full min-h-screen flex items-center justify-center"
    >
      <div class="banter-loader">
        <div class="banter-loader__box" *ngFor="let _ of boxes"></div>
      </div>
    </div>

    <div
      *ngIf="!isLoading"
      @fade
      class="min-h-screen bg-gradient-to-br from-black/80 via-black to-black/80 flex items-center justify-center"
    >
      <div class="text-center px-8">
        <img
          src="assets/logo-yl-work.png"
          alt="YL Work"
          class="w-64 mx-auto drop-shadow-2xl"
        />

        <h1 class="mt-8 text-3xl font-semibold text-white tracking-wide">
          Welcome
        </h1>

        <p class="mt-3 text-gray-400 text-lg">
          One Platform for Your Daily Work
        </p>

        <div class="w-20 h-1 bg-blue-400 rounded-full mx-auto mt-8"></div>

        <div class="mt-10 flex items-center justify-center gap-3">
          <div
            class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
          ></div>
          <span class="text-gray-300 text-base"> Preparing Sign In... </span>
        </div>

        <p class="mt-12 text-xs tracking-widest text-gray-500 uppercase">
          Powered by YL Systems
        </p>
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
export class SplashScreen {
  private readonly router = inject(Router);
  isLoading: boolean = true;

  boxes = Array(9);

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.isLoading = false;
      this.cdr.markForCheck();

      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);
    }, 2000);
  }
}
