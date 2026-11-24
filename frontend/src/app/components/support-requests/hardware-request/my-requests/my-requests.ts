import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-my-requests',
  imports: [],
  template: `<p>my-requests works!</p>`,
  styleUrl: './my-requests.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyRequests {}
