import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { WebLayout } from '../../../shared/components/web-layout/web-layout';
import { MobileLayout } from '../../../shared/components/mobile-layout/mobile-layout';
import { BreakpointObserver } from '@angular/cdk/layout';

@Component({
  selector: 'app-responsive-layout',
  imports: [CommonModule, WebLayout, MobileLayout],
  template: ` <app-mobile-layout *ngIf="isMobile; else desktop" />
    <ng-template #desktop>
      <app-web-layout />
    </ng-template>`,
  styleUrl: './ResponsiveLayout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResponsiveLayout {
  private breakpointObserver = inject(BreakpointObserver);

  isMobile = false;

  constructor() {
    this.breakpointObserver
      .observe('(max-width: 768px)')
      .subscribe((result) => {
        this.isMobile = result.matches;
      });
  }
}
