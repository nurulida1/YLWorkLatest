import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FullCalendarModule } from '@fullcalendar/angular';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Table, TableModule } from 'primeng/table';
import { LoadingService } from '../../services/loading.service';
import { Subject } from 'rxjs';
import { MessageService } from 'primeng/api';
import {
  PagingContent,
  GridifyQueryExtend,
} from '../../shared/helpers/helpers';
import { CalendarOptions } from '@fullcalendar/core/index.js';
import dayGridPlugin from '@fullcalendar/daygrid/index.js';
import timeGridPlugin from '@fullcalendar/timegrid/index.js';
import interactionPlugin from '@fullcalendar/interaction/index.js';

@Component({
  selector: 'app-to-do',
  imports: [
    CommonModule,
    ButtonModule,
    InputTextModule,
    FormsModule,
    TableModule,
    FullCalendarModule,
  ],
  template: `<p>to-do works!</p>`,
  styleUrl: './to-do.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToDo implements OnInit, OnDestroy {
  @ViewChild('fTable') fTable?: Table;

  private readonly loadingService = inject(LoadingService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messageService = inject(MessageService);

  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  PagingSignal = signal<PagingContent<any>>({} as PagingContent<any>);
  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay',
    },
    events: this.getCalendarEvents(),
    height: 650,
    editable: false,
  };

  ngOnInit(): void {}

  getCalendarEvents() {
    if (!this.PagingSignal()?.data) return [];
    return this.PagingSignal().data.map((project) => ({
      title: project.projectTitle,
      start: project.createdAt,
      end: project.dueDate,
      extendedProps: {
        priority: project.priority,
        status: project.status,
      },
      backgroundColor:
        project.status === 'Completed'
          ? '#10B981'
          : project.status === 'On Hold'
            ? '#EF4444'
            : '#3B82F6',
    }));
  }

  ngOnDestroy(): void {}
}
