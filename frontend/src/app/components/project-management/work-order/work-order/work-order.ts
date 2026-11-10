import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-work-order',
  imports: [CommonModule],
  template: `<p>work-order works!</p>`,
  styleUrl: './work-order.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkOrder {}
