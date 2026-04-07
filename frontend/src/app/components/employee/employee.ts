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
import { LoadingService } from '../../services/loading.service';
import { MessageService } from 'primeng/api';
import { UserService } from '../../services/userService.service';
import { Subject, takeUntil } from 'rxjs';
import {
  BuildFilterText,
  BuildSortText,
  GridifyQueryExtend,
  PagingContent,
} from '../../shared/helpers/helpers';
import { UserDto } from '../../models/User';
import { TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-employee',
  imports: [
    CommonModule,
    ButtonModule,
    FormsModule,
    InputTextModule,
    RouterLink,
    PaginatorModule,
  ],
  template: `
    <div class="w-full min-h-[85vh] flex flex-col p-5">
      <div
        class="flex flex-row items-center gap-1 text-gray-500 text-[15px] tracking-wide"
      >
        <div
          [routerLink]="'/dashboard'"
          class="cursor-pointer hover:text-gray-600"
        >
          Dashboard
        </div>
        /
        <div class="text-gray-700 font-semibold">Employee</div>
      </div>

      <div class="mt-3 flex flex-row items-center justify-between">
        <div class="text-2xl font-semibold">
          Employee
          <span class="text-blue-500"
            >({{ PagingSignal().totalElements || 0 }})</span
          >
        </div>
        <div class="flex flex-row items-center gap-2">
          <input
            type="text"
            pInputText
            class="min-w-[300px] text-sm!"
            placeholder="Search by name ..."
            [(ngModel)]="search"
            (keyup)="onKeyDown($event)"
          />
          <p-button
            severity="info"
            icon="pi pi-plus-circle"
            styleClass="text-sm! tracking-wide"
            label="Add Employee"
          ></p-button>
        </div>
      </div>

      <div class="mt-5 grid grid-cols-12 gap-3 px-5">
        <ng-container *ngFor="let data of PagingSignal().data">
          <div
            class="col-span-6 md:col-span-4 lg:col-span-3 bg-white p-4 rounded-md border border-gray-200 shadow-sm flex flex-col gap-2"
          >
            <div
              class="flex flex-col gap-2 items-center justify-center text-center"
            >
              <div
                class="rounded-md bg-gray-100 w-40 h-30 border border-gray-100"
              ></div>
            </div>
            <div class="flex flex-col text-center">
              <div class="font-semibold tracking-wide">
                {{ data.firstName + ' ' + data.lastName }}
              </div>
              <div class="text-blue-500 text-sm">
                {{ data.jobTitle || 'Worker' }}
              </div>

              <div class="border-b border-gray-200 mt-3 mb-3"></div>
              <div class="grid grid-cols-12 gap-1 items-center">
                <div class="col-span-2">
                  <i class="pi pi-building text-blue-500 text-sm!"></i>
                </div>
                <div class="col-span-10 text-left text-sm text-gray-600">
                  {{ data.department?.name || 'N/A' }}
                </div>
                <div class="col-span-2">
                  <i class="pi pi-envelope text-blue-500 text-sm!"></i>
                </div>
                <div class="col-span-10 text-left text-sm text-gray-600">
                  {{ data.email }}
                </div>
                <div class="col-span-2">
                  <i class="pi pi-phone text-blue-500 text-sm!"></i>
                </div>
                <div class="col-span-10 text-left text-sm text-gray-600">
                  {{ data.contactNo || 'N/A' }}
                </div>
              </div>
            </div>
          </div></ng-container
        >
      </div>
    </div>
    <div class="flex justify-end mt-3">
      <p-paginator
        [first]="(Query.Page - 1) * Query.PageSize"
        [rows]="Query.PageSize"
        [totalRecords]="PagingSignal().totalElements"
        [rowsPerPageOptions]="[12, 24, 36]"
        (onPageChange)="onPageChange($event)"
      />
    </div>
  `,
  styleUrl: './employee.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Employee implements OnInit, OnDestroy {
  private readonly loadingService = inject(LoadingService);
  private readonly messageService = inject(MessageService);
  private readonly userService = inject(UserService);
  private readonly cdr = inject(ChangeDetectorRef);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  PagingSignal = signal<PagingContent<UserDto>>({} as PagingContent<UserDto>);
  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  search: string = '';

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 12;
    this.Query.Filter = null;
    this.Query.OrderBy = `FirstName`;
    this.Query.Select = null;
    this.Query.Includes = null;
  }

  ngOnInit(): void {
    this.GetData();
  }

  GetData() {
    this.loadingService.start();
    this.userService
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

  NextPage(event: TableLazyLoadEvent) {
    if ((event?.first || event?.first === 0) && event?.rows) {
      this.Query.Page = event.first / event.rows + 1 || 1;
      this.Query.PageSize = event.rows;
    }

    const sortText = BuildSortText(event);
    this.Query.OrderBy = sortText ? sortText : 'FirstName';

    this.Query.Filter = BuildFilterText(event);
    this.GetData();
  }

  onPageChange(event: PaginatorState) {
    const first = event.first ?? 0;
    const rows = event.rows ?? 10;

    this.Query.PageSize = rows;
    this.Query.Page = Math.floor(first / rows) + 1;

    this.GetData();
  }
  onKeyDown(event: KeyboardEvent) {
    const isEnter = event.key === 'Enter';
    const isBackspaceClear = event.key === 'Backspace' && this.search === '';

    if (isEnter) {
      this.Search(this.search);
    } else if (isBackspaceClear) {
      this.Search('');
    }
  }

  Search(data: string) {
    this.Query.Page = 1; // reset to first page
    if (data) {
      this.Query.Filter = `FirstName=${data}|LastName=${data}`;
    } else {
      this.Query.Filter = null;
    }
    this.GetData();
  }

  ResetPage() {
    this.search = '';
    this.Query.Filter = null;
    this.GetData();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
