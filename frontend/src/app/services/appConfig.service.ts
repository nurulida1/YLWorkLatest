import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  computed,
  effect,
  inject,
  Injectable,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { AppState } from '../models/AppState';

@Injectable({
  providedIn: 'root',
})
export class AppConfigService {
  private readonly STORAGE_KEY = 'appConfigState';

  appState = signal<AppState | null>(null);
  document = inject(DOCUMENT);
  platformId = inject(PLATFORM_ID);
  transitionComplete = signal<boolean>(false);

  theme = computed(() => (this.appState()?.darkTheme ? 'dark' : 'light'));
  private initialized = false;

  constructor() {
    const state = this.loadAppState();
    this.appState.set({ ...state });

    // ✅ Apply darkMode immediately on load
    if (isPlatformBrowser(this.platformId)) {
      if (state.darkTheme) {
        this.document.documentElement.classList.add('darkMode');
      } else {
        this.document.documentElement.classList.remove('darkMode');
      }
    }

    effect(() => {
      const currentState = this.appState();

      if (!this.initialized || !currentState) {
        this.initialized = true;
        return;
      }

      this.saveAppState(currentState);
      this.handleDarkModeTransition(currentState);
    });
  }

  private handleDarkModeTransition(state: AppState): void {
    if (isPlatformBrowser(this.platformId)) {
      if ((document as any).startViewTransition) {
        this.startViewTransition(state);
      } else {
        this.toggleDarkMode(state);
      }
    }
  }

  private startViewTransition(state: AppState): void {
    const transition = (document as any).startViewTransition(() => {
      this.toggleDarkMode(state);
    });

    transition.ready.then(() => this.onTransitionEnd());
  }

  private onTransitionEnd() {
    this.transitionComplete.set(true);
    setTimeout(() => {
      this.transitionComplete.set(false);
    });
  }

  private toggleDarkMode(state: AppState): void {
    if (state.darkTheme) {
      this.document.documentElement.classList.add('darkMode');
    } else {
      this.document.documentElement.classList.remove('darkMode');
    }
  }

  private loadAppState(): any {
    if (isPlatformBrowser(this.platformId)) {
      const storedState = localStorage.getItem(this.STORAGE_KEY);
      if (storedState) {
        return JSON.parse(storedState);
      }
    }
    return {
      preset: 'Aura',
      primary: 'noir',
      surface: null,
      darkTheme: false,
      menuActive: false,
      designerKey: 'primeng-designer-theme',
      RTL: false,
    };
  }

  private saveAppState(state: any): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    }
  }
}
