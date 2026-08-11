import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-staff-tasks',
  imports: [
    CommonModule,
    RouterLink,
    TableModule,
    InputTextModule,
    ReactiveFormsModule,
    ButtonModule,
    DatePickerModule,
    SelectModule,
  ],
  template: `<p>staffTasks works!</p>`,
  styleUrl: './staffTasks.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaffTasks {}
