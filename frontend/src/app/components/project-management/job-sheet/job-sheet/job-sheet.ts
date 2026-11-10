import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-job-sheet',
  imports: [CommonModule],
  template: `<p>job-sheet works!</p>`,
  styleUrl: './job-sheet.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobSheet {}
