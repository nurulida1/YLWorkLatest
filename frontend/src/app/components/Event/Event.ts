import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FullCalendarModule } from '@fullcalendar/angular';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { LoadingService } from '../../services/loading.service';
import { EventService } from '../../services/EventService';
import { MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { GridifyQueryExtend } from '../../shared/helpers/helpers';

@Component({
  selector: 'app-event',
  imports: [
    CommonModule,
    FullCalendarModule,
    ButtonModule,
    ReactiveFormsModule,
    InputTextModule,
    TextareaModule,
    DatePickerModule,
    CheckboxModule,
    MultiSelectModule,
    SelectModule,
  ],
  template: `<p>Event works!</p>`,
  styleUrl: './Event.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Event implements OnInit, OnDestroy {
  private readonly loadingService = inject(LoadingService);
  private readonly messageService = inject(MessageService);
  private readonly eventService = inject(EventService);
  private readonly cdr = inject(ChangeDetectorRef);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  visible: boolean = false;
  isUpdate: boolean = false;
  today: Date = new Date();

  users: { label: string; value: string }[] = [];

  constructor() {}

  ngOnInit(): void {}

  GetData() {
    this.loadingService.start();
    this.eventService
      .GetMany(this.Query)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();
        },
        error: (err) => {
          this.loadingService.stop();
        },
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
