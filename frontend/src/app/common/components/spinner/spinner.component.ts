import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'spinner',
  imports: [CommonModule],
  template: `<div id="background">
    <div id="loader">
      <div id="shadow"></div>
      <div class="flex flex-row gap-2">
        <div
          class="w-4 h-4 rounded-full !bg-[#d9884d] animate-bounce [animation-delay:.7s]"
        ></div>
        <div
          class="w-4 h-4 rounded-full !bg-[#d9884d] animate-bounce [animation-delay:.3s]"
        ></div>
        <div
          class="w-4 h-4 rounded-full !bg-[#d9884d] animate-bounce [animation-delay:.7s]"
        ></div>
      </div>
    </div>
  </div>`,
  styleUrl: './spinner.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpinnerComponent {
  @Input() isSpinning: boolean = false;
}
