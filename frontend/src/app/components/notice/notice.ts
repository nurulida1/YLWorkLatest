import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { LoadingService } from '../../services/loading.service';
import { NoticeService } from '../../services/NoticeService';
import { Subject, takeUntil } from 'rxjs';
import { InputTextModule } from 'primeng/inputtext';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { EditorModule } from 'primeng/editor';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { ValidateAllFormFields } from '../../shared/helpers/helpers';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-notice',
  imports: [
    CommonModule,
    ButtonModule,
    InputTextModule,
    FormsModule,
    EditorModule,
    DatePickerModule,
    CheckboxModule,
    DialogModule,
    ReactiveFormsModule,
    RouterLink,
  ],
  template: `<div class="relative flex flex-col gap-6 min-h-screen">
      <div
        class="h-43 bg-[#0566D9] px-6 pb-8 pt-6 flex flex-col justify-between rounded-b-4xl shadow-lg"
      >
        <div class="flex flex-row items-center justify-between">
          <div
            class="text-3xl font-bold text-white"
            [routerLink]="'/dashboard'"
          >
            YL Works
          </div>
          <div class="flex flex-row items-center gap-4">
            <i class="pi pi-bell text-3xl! text-white!"></i>
            <div
              class="bg-white w-8 h-8 rounded-full flex items-center justify-center p-2"
            >
              <i class="pi pi-user text-xl! text-[#0566D9]!"></i>
            </div>
          </div>
        </div>

        <div class="relative">
          <input
            type="text"
            pInputText
            [(ngModel)]="searchTerm"
            class="w-full rounded-2xl! pl-12! text-lg! py-3!"
            placeholder="Search notices..."
          />
          <i
            class="pi pi-search text-gray-400! text-xl! absolute! top-3.5! left-6!"
          ></i>
        </div>
      </div>

      <div class="py-3 px-7 flex flex-col gap-6">
        <ng-container *ngFor="let data of filteredNotices">
          <div
            class="bg-white p-4 border border-gray-200 shadow-sm flex flex-col gap-4"
            [ngClass]="{ 'border-l-4 border-l-red-800': data.isPinned }"
          >
            <div
              class="w-13 h-13 rounded-lg flex items-center justify-center"
              [ngClass]="{
                'bg-red-100!': data.isPinned,
                'bg-blue-100!': !data.isPinned,
              }"
            >
              <i
                class="pi pi-megaphone text-2xl!"
                [ngClass]="{
                  'text-red-800!': data.isPinned,
                  'text-blue-800!': !data.isPinned,
                }"
              ></i>
            </div>
            <div class="text-gray-500">
              {{ data.publishDate | date: 'MMM dd, yyyy' }}
            </div>
            <div class="text-2xl font-bold">
              {{ data.title }}
            </div>
            <div
              [innerHTML]="data.content"
              class="text-gray-700 [overflow-wrap:break-word]
         [&_p]:mb-3
         [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3
         [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3
         [&_li]:mb-1"
            ></div>
          </div>
        </ng-container>
      </div>

      <div class="fixed bottom-35 right-5 z-50">
        <div
          (click)="visible = true"
          class="flex items-center justify-center w-15 h-15 bg-blue-800 rounded-lg"
        >
          <i class="pi pi-plus text-white! text-2xl!"></i>
        </div>
      </div>
    </div>

    <p-dialog
      [(visible)]="visible"
      [draggable]="false"
      [resizable]="false"
      [modal]="true"
      styleClass="w-[90%]! max-h-[90vh]!"
    >
      <ng-template #headless>
        <div class="flex flex-col h-[90vh] max-h-[90vh]">
          <div
            class="shrink-0 flex flex-row items-center justify-between px-6 py-5 border-b border-gray-200"
          >
            <div class="font-bold text-xl">Create New Notice</div>

            <i
              class="pi pi-times text-gray-500! cursor-pointer"
              (click)="visible = false"
            ></i>
          </div>

          <div class="flex-1 overflow-y-auto px-6 py-6" [formGroup]="FG">
            <div class="grid grid-cols-12 gap-4">
              <div class="col-span-12 flex flex-col gap-1">
                <div>Title</div>
                <input
                  type="text"
                  pInputText
                  class="w-full py-3!"
                  placeholder="Enter notice title"
                  formControlName="title"
                />
              </div>

              <div class="col-span-12 flex flex-col gap-1">
                <div>Publish Date</div>
                <p-datepicker
                  formControlName="publishDate"
                  dateFormat="dd/mm/yy"
                  [showIcon]="true"
                  appendTo="body"
                  placeholder="dd/mm/yyyy"
                  styleClass="w-full!"
                  inputStyleClass="py-3!"
                ></p-datepicker>
              </div>

              <div class="col-span-12 flex flex-col gap-1">
                <div>Expiry Date</div>
                <p-datepicker
                  formControlName="expiryDate"
                  dateFormat="dd/mm/yy"
                  [showIcon]="true"
                  appendTo="body"
                  placeholder="dd/mm/yyyy"
                  styleClass="w-full!"
                  inputStyleClass="py-3!"
                ></p-datepicker>
              </div>

              <div class="col-span-12 flex flex-row items-center gap-3">
                <p-checkbox
                  formControlName="isPinned"
                  [binary]="true"
                ></p-checkbox>

                <div class="mt-1">Pin this notice to top</div>
              </div>

              <div class="col-span-12 flex flex-col gap-1">
                <div>Content</div>

                <p-editor
                  formControlName="content"
                  [style]="{ 'min-height': '200px' }"
                >
                  <ng-template #header>
                    <span class="ql-formats">
                      <button
                        type="button"
                        class="ql-bold"
                        aria-label="Bold"
                      ></button>

                      <button
                        type="button"
                        class="ql-italic"
                        aria-label="Italic"
                      ></button>

                      <button
                        type="button"
                        class="ql-underline"
                        aria-label="Underline"
                      ></button>
                    </span>
                  </ng-template>
                </p-editor>
              </div>
            </div>
          </div>

          <div
            class="shrink-0 flex flex-row items-center gap-3 px-6 py-5 border-t border-gray-200 bg-white"
          >
            <p-button
              label="Cancel"
              [outlined]="true"
              severity="secondary"
              class="flex-1!"
              styleClass="w-full! py-3!"
              (click)="visible = false"
            ></p-button>

            <p-button
              label="Post Notice"
              severity="info"
              class="flex-1!"
              (onClick)="SaveNotice()"
              styleClass="w-full! py-3! bg-blue-900! border-none!"
            ></p-button>
          </div>
        </div>
      </ng-template>
    </p-dialog>`,
  styleUrl: './notice.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Notice implements OnInit, OnDestroy {
  private readonly loadingService = inject(LoadingService);
  private readonly noticeService = inject(NoticeService);
  private readonly cdr = inject(ChangeDetectorRef);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  noticeLists: any;
  searchTerm: string = '';

  visible: boolean = false;

  FG!: FormGroup;

  ngOnInit(): void {
    this.GetData();
    this.initForm();
  }

  initForm() {
    this.FG = new FormGroup({
      id: new FormControl<string | null>({ value: null, disabled: true }),
      title: new FormControl<string | null>(null, Validators.required),
      content: new FormControl<string | null>(null),
      publishDate: new FormControl<Date | null>(null),
      expiryDate: new FormControl<Date | null>(null),
      isPinned: new FormControl<boolean>(false),
    });
  }

  GetData() {
    this.loadingService.start();
    this.noticeService
      .GetMany({
        Page: 1,
        PageSize: 100,
        OrderBy: 'PublishDate desc',
      })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();
          this.noticeLists = res;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loadingService.stop();
        },
      });
  }

  SaveNotice() {
    if (this.FG.valid) {
      this.loadingService.start();
      this.noticeService
        .Create(this.FG.value)
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe({
          next: (res) => {
            this.loadingService.stop();
            this.noticeLists = {
              ...this.noticeLists,
              data: [res, ...(this.noticeLists?.data ?? [])],
            };
            this.FG.reset();
            this.FG.patchValue({
              isPinned: false,
            });
            this.visible = false;

            this.cdr.markForCheck();
          },
          error: (err) => {
            this.loadingService.stop();

            console.error('Failed to create notice:', err);
            this.cdr.markForCheck();
          },
        });
    }
    ValidateAllFormFields(this.FG);
  }

  get filteredNotices() {
    const search = this.searchTerm.trim().toLowerCase();

    if (!search) {
      return this.noticeLists?.data ?? [];
    }

    return (this.noticeLists?.data ?? []).filter((notice: any) => {
      const title = notice.title?.toLowerCase() ?? '';
      const content = notice.content?.toLowerCase() ?? '';

      return title.includes(search) || content.includes(search);
    });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
