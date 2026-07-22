import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';

@Component({
  selector: 'app-material-request-mobile-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    DatePickerModule,
    TextareaModule,
    SelectModule,
  ],
  template: `<p>material-request-mobile-form works!</p>`,
  styleUrl: './material-request-mobile-form.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaterialRequestMobileForm {}
