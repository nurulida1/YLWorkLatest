import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { LoadingService } from '../../services/loading.service';
import { StaffTaskService } from '../../services/staffTaskService';
import { MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import {
  GridifyQueryExtend,
  PagingContent,
} from '../../shared/helpers/helpers';
import { StaffTask } from '../../models/StaffTask';

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
  template: `<div class="w-full min-h-[92.9vh] flex flex-col p-5">
    <div class="flex flex-row items-center justify-between">
      <div class="flex flex-row items-center gap-1 text-gray-500 tracking-wide">
        <div
          [routerLink]="'/dashboard'"
          class="cursor-pointer hover:text-gray-600"
        >
          Dashboard
        </div>
        <i class="pi pi-chevron-right text-[8px]! text-gray-500!"></i>
        <div class="text-gray-700 font-semibold">Tasks</div>
      </div>
    </div>
    <div class="mt-3 tracking-wide flex flex-col">
      <div class="flex flex-row items-center justify-between">
        <div class="text-[20px] text-gray-700 font-semibold">Tasks</div>

        <!-- <p-button
          label="New Meeting"
          icon="pi pi-plus"
          severity="info"
          (onClick)="OpenDialog()"
          styleClass="tracking-wide! bg-blue-700! border-none! rounded-none! py-2! px-5!"
        ></p-button> -->
      </div>
    </div>
  </div>`,
  styleUrl: './staffTasks.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaffTasks implements OnInit, OnDestroy {
  private readonly loadingService = inject(LoadingService);
  private readonly staffTaskService = inject(StaffTaskService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messageService = inject(MessageService);

  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  PagingSignal = signal<PagingContent<StaffTask>>(
    {} as PagingContent<StaffTask>,
  );
  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  FG!: FormGroup;
  userSelection: any;

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 10;
    this.Query.Select = null;
    this.Query.Filter = null;
    this.Query.OrderBy = null;
  }

  ngOnInit(): void {}

  GetData() {
    this.loadingService.start();
    this.staffTaskService
      .GetMany(this.Query)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();
          this.PagingSignal.set(res);
          this.cdr.markForCheck();
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
