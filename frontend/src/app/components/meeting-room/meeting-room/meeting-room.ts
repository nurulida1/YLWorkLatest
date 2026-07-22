import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';

interface TimeSlot {
  time: string;
  booked: boolean;
}

@Component({
  selector: 'app-meeting-room',
  imports: [CommonModule, ButtonModule, DatePickerModule, FormsModule],
  template: `<div class="w-full bg-gray-50 px-5 py-7 flex flex-col">
    <!-- Room Card -->

    <div
      class="bg-white rounded-lg p-3 border border-gray-300 flex flex-col gap-3"
    >
      <div
        class="bg-green-100 rounded-full px-3 py-1 w-fit flex items-center gap-2"
      >
        <i class="pi pi-circle-fill text-green-500 text-[8px]"></i>
        <span class="uppercase font-semibold text-green-700"> Available </span>
      </div>

      <div>
        <div class="text-2xl font-bold">Meeting Room</div>

        <div class="text-gray-500 flex items-center gap-1">
          <i class="pi pi-map-marker"></i>
          Floor 2
        </div>
      </div>

      <img
        src="assets/meeting-room.png"
        class="rounded-lg h-60 border border-gray-200 object-cover"
      />
    </div>

    <!-- Date -->

    <div class="mt-6 bg-white rounded-lg border border-gray-300 p-4">
      <div class="font-semibold mb-3">Select Date</div>

      <p-datepicker
        [inline]="true"
        [ngModel]="selectedDate()"
        (ngModelChange)="selectedDate.set($event); onDateChange()"
        (onSelect)="onDateChange()"
        [minDate]="today"
        dateFormat="dd/mm/yy"
        styleClass="w-full!"
      >
      </p-datepicker>
    </div>

    <!-- Timeline -->

    <div class="mt-7 flex justify-between mb-2">
      <div class="text-2xl font-bold">Daily Timeline</div>

      <div>
        {{ selectedDate() | date: 'dd MMM yyyy' }}
      </div>
    </div>

    <div class="bg-white rounded-lg border border-gray-300 p-4">
      <div class="flex gap-4 overflow-x-auto pb-3">
        <div
          *ngFor="let slot of slots()"
          class="flex flex-col items-center gap-2"
        >
          <div>
            {{ slot.time }}
          </div>

          <div
            (click)="selectSlot(slot)"
            class="w-20 h-28 rounded-lg border transition-all duration-200 flex items-center justify-center"
            [ngClass]="{
              'bg-red-100 border-red-200 cursor-not-allowed': slot.booked,

              'bg-gray-200 border-gray-300 cursor-not-allowed':
                !slot.booked && isPast(slot.time),

              'bg-blue-600 border-blue-600 cursor-pointer':
                !slot.booked && !isPast(slot.time) && isSelected(slot),

              'bg-gray-100 border-gray-200 hover:border-blue-500 cursor-pointer':
                !slot.booked && !isPast(slot.time) && !isSelected(slot),
            }"
          >
            <i *ngIf="slot.booked" class="pi pi-lock text-red-500 text-xl"> </i>

            <i
              *ngIf="!slot.booked && isPast(slot.time)"
              class="pi pi-clock text-gray-500 text-xl"
            >
            </i>

            <i
              *ngIf="!slot.booked && !isPast(slot.time) && isSelected(slot)"
              class="pi pi-check text-white text-xl"
            >
            </i>
          </div>
        </div>
      </div>

      <div class="mt-6 flex justify-between items-center">
        <div>
          <div class="font-semibold">
            Selected:
            {{
              selectedSlot()
                ? (selectedDate() | date: 'dd MMM yyyy') +
                  ' • ' +
                  selectedSlot()!.time
                : 'No slot selected'
            }}
          </div>
        </div>

        <p-button
          label="Book Now"
          severity="info"
          styleClass="bg-blue-600! px-6! py-2! border-none!"
          [rounded]="true"
          [disabled]="!selectedSlot()"
          (onClick)="bookNow()"
        >
        </p-button>
      </div>
    </div>
  </div>`,
  styleUrl: './meeting-room.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeetingRoom {
  today: Date = new Date();

  selectedDate = signal(new Date());

  selectedSlot = signal<TimeSlot | null>(null);

  slots = signal<TimeSlot[]>([
    { time: '08:00', booked: false },
    { time: '09:00', booked: false },
    { time: '10:00', booked: false },
    { time: '11:00', booked: true },
    { time: '12:00', booked: false },
    { time: '13:00', booked: true },
    { time: '14:00', booked: false },
    { time: '15:00', booked: false },
    { time: '16:00', booked: false },
    { time: '17:00', booked: true },
    { time: '18:00', booked: false },
  ]);

  selectSlot(slot: TimeSlot) {
    if (slot.booked || this.isPast(slot.time)) {
      return;
    }

    if (this.selectedSlot()?.time === slot.time) {
      this.selectedSlot.set(null);
      return;
    }

    this.selectedSlot.set(slot);
  }

  isSelected(slot: TimeSlot) {
    return this.selectedSlot()?.time === slot.time;
  }

  isPast(time: string): boolean {
    const selected = this.selectedDate();

    const today = new Date();

    if (selected.toDateString() !== today.toDateString()) {
      return false;
    }

    const hour = Number(time.split(':')[0]);

    return hour <= today.getHours();
  }

  onDateChange() {
    this.selectedSlot.set(null);

    // TODO:
    // Call API here
    // this.meetingService.getAvailability(this.selectedDate())
  }

  bookNow() {
    console.log({
      date: this.selectedDate(),
      time: this.selectedSlot()?.time,
    });
  }
}
