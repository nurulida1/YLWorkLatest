import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'app-report-update',
  imports: [
    CommonModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    ReactiveFormsModule,
  ],
  template: `<p>report-update works!</p>`,
  styleUrl: './report-update.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportUpdate {}
