import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { TagModule } from 'primeng/tag';
import { ClientRoutingModule } from '../clients/client-routing.module';

@Component({
  selector: 'app-schedule',
  imports: [
    CommonModule,
    FullCalendarModule,
    ButtonModule,
    DatePickerModule,
    TagModule,
    ClientRoutingModule,
  ],
  template: ` <div class="w-full min-h-screen bg-gray-100 p-5">
    <div class="px-4 pt-4 flex items-center justify-between">
      <p-button [text]="true" severity="secondary">
        <ng-template #icon>
          <i class="pi pi-chevron-left text-xl"></i>
        </ng-template>
      </p-button>

      <div class="text-xl font-semibold tracking-wide text-gray-800">
        Schedule
      </div>

      <p-button [text]="true" severity="secondary"> </p-button>
    </div>
    <div class="pb-3 w-full flex items-center justify-center ">
      <span class="w-75 text-gray-500 text-sm text-center"
        >Plan your tasks, meetings, and deadline in one view.</span
      >
    </div>

    <p-datepicker [inline]="true" styleClass="w-full"></p-datepicker>

    <div class="py-3 flex flex-col mt-4">
      <div class="font-bold text-lg text-gray-800">
        Task for {{ selectedDate | date: 'MMMM dd, yyyy' }}
      </div>
      <div class="mt-4 flex flex-col gap-1">
        <div class="p-3 bg-white rounded-lg border border-gray-200">
          <div class="flex flex-row justify-between items-center">
            <div class="flex flex-row gap-3 items-center">
              <i class="pi pi-file text-gray-400 text-3xl!"></i>
              <div class="flex flex-col">
                <div class="font-bold">Task 1</div>
                <div class="text-sm text-gray-500">Description</div>
              </div>
            </div>
            <p-tag
              [value]="'Low'"
              severity="info"
              styleClass="px-5! rounded-full!"
            ></p-tag>
          </div>
        </div>
        <div class="p-3 bg-white rounded-lg border border-gray-200">
          <div class="flex flex-row justify-between items-center">
            <div class="flex flex-row gap-3 items-center">
              <i class="pi pi-file text-gray-400 text-3xl!"></i>
              <div class="flex flex-col">
                <div class="font-bold">Task 2</div>
                <div class="text-sm text-gray-500">Description</div>
              </div>
            </div>
            <p-tag
              [value]="'Medium'"
              severity="warn"
              styleClass="px-5! rounded-full!"
            ></p-tag>
          </div>
        </div>
        <div class="p-3 bg-white rounded-lg border border-gray-200">
          <div class="flex flex-row justify-between items-center">
            <div class="flex flex-row gap-3 items-center">
              <i class="pi pi-file text-gray-400 text-3xl!"></i>
              <div class="flex flex-col">
                <div class="font-bold">Task 3</div>
                <div class="text-sm text-gray-500">Description</div>
              </div>
            </div>
            <p-tag
              [value]="'High'"
              severity="danger"
              styleClass="px-5! rounded-full!"
            ></p-tag>
          </div>
        </div>

        <p-button
          [routerLink]="'/tasks/form'"
          label="Add New Task"
          icon="pi pi-plus"
          styleClass="w-full! py-3! mt-3 bg-blue-600! border-none!"
        ></p-button>
      </div>
    </div>
  </div>`,
  styleUrl: './schedule.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Schedule {
  selectedDate: Date = new Date();

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],

    initialView: 'dayGridMonth',

    headerToolbar: {
      left: 'prev,next',
      center: 'title',
      right: 'today',
    },

    height: 'auto',

    dayMaxEvents: 2,

    fixedWeekCount: false,

    events: [
      {
        title: 'Website Redesign',
        start: '2026-07-10',
        end: '2026-07-18',
        backgroundColor: '#2563eb',
      },
      {
        title: 'Mobile App Development',
        start: '2026-07-15',
        end: '2026-07-30',
        backgroundColor: '#16a34a',
      },
      {
        title: 'Testing Phase',
        start: '2026-07-22',
        backgroundColor: '#f59e0b',
      },
    ],

    eventClick: (info) => {
      console.log(info.event);
    },

    dateClick: (info) => {
      console.log(info.date);
    },
  };
}
