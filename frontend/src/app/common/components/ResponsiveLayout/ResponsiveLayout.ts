import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { map } from 'rxjs/operators';

import { WebLayout } from '../../../shared/components/web-layout/web-layout';
import { MobileLayout } from '../../../shared/components/mobile-layout/mobile-layout';

@Component({
  selector: 'app-responsive-layout',
  standalone: true,
  imports: [CommonModule, WebLayout, MobileLayout],
  template: `
    <app-mobile-layout *ngIf="isMobile$ | async; else desktop" />

    <ng-template #desktop>
      <app-web-layout />
    </ng-template>
  `,
  styleUrl: './ResponsiveLayout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResponsiveLayout {
  private breakpointObserver = inject(BreakpointObserver);

  isMobile$ = this.breakpointObserver
    .observe('(max-width: 768px)')
    .pipe(map((result) => result.matches));
}
