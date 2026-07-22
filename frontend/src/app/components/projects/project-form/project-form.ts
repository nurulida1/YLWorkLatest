import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { TextareaModule } from 'primeng/textarea';
import { ProjectService } from '../../../services/ProjectService';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { LoadingService } from '../../../services/loading.service';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-project-form',
  imports: [
    CommonModule,
    ButtonModule,
    ReactiveFormsModule,
    InputTextModule,
    MultiSelectModule,
    DatePickerModule,
    InputNumberModule,
    TextareaModule,
    SelectModule,
    TagModule,
  ],
  template: `<div class="flex flex-col p-6">
    <div class="font-semibold tracking-wide text-3xl">Create New Project</div>
    <span class="text-gray-500 tracking-wider mt-1"
      >Initialize a new enterprise venture. Fill in the parameters below to
      establish the project scope and governance.</span
    >
    <div
      class="mt-6 p-6 bg-white rounded-t-lg border border-gray-300 grid grid-cols-12 gap-4"
      [formGroup]="FG"
    >
      <div class="col-span-12 flex flex-col gap-2">
        <div class="uppercase text-gray-700">Project Name</div>
        <input type="text" pInputText class="projectTitle" />
      </div>
      <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
        <div class="uppercase text-gray-700">Client</div>
        <p-select
          [options]="clientSelection"
          formControlName="clientId"
          appendTo="body"
          [filter]="true"
          [showClear]="FG.get('clientId')?.value"
        ></p-select>
      </div>
      <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
        <div class="uppercase text-gray-700">Project Manager</div>
        <p-select
          [options]="userSelection"
          formControlName="projectLeaderId"
          appendTo="body"
          [filter]="true"
          filterBy="displayName,fullName,jobTitle"
          [showClear]="!!FG.get('projectLeaderId')?.value"
        >
          <ng-template let-user #item>
            <div class="flex flex-col py-1">
              <span class="font-semibold text-gray-900">
                {{ user.displayName }}
              </span>

              <span class="text-sm text-gray-600">
                {{ user.name }}
              </span>

              <span class="text-xs text-blue-600">
                {{ user.jobTitle }}
              </span>
            </div>
          </ng-template>

          <ng-template let-user #selectedItem>
            <span *ngIf="user">
              {{ user.name }}
            </span>
          </ng-template>
        </p-select>
      </div>
      <div class="col-span-12 border-b border-gray-300"></div>
      <div class="col-span-12 md:col-span-4 flex flex-col gap-2">
        <div class="uppercase text-gray-700">Start Date</div>
        <p-datepicker
          formControlName="startDate"
          appendTo="body"
          dateFormat="dd/mm/yy"
          placeholder="dd/mm/yyyy"
          showIcon="true"
          styleClass="w-full!"
        >
        </p-datepicker>
      </div>
      <div class="col-span-12 md:col-span-4 flex flex-col gap-2">
        <div class="uppercase text-gray-700">End Date</div>
        <p-datepicker
          formControlName="endDate"
          appendTo="body"
          dateFormat="dd/mm/yy"
          placeholder="dd/mm/yyyy"
          showIcon="true"
          styleClass="w-full!"
        >
        </p-datepicker>
      </div>
      <div class="col-span-12 md:col-span-4 flex flex-col gap-2">
        <div class="uppercase text-gray-700">Priority</div>
        <p-select
          [options]="[
            { label: 'Low', value: 'Low' },
            { label: 'Medium', value: 'Medium' },
            { label: 'High', value: 'High' },
          ]"
          formControlName="priority"
          appendTo="body"
          [filter]="true"
          [showClear]="FG.get('priority')?.value"
        ></p-select>
      </div>
      <div class="col-span-12 border-b border-gray-300"></div>
      <div class="col-span-12 flex flex-col gap-2">
        <div class="uppercase text-gray-700">Project Description</div>
        <textarea
          pTextarea
          type="text"
          class="description"
          placeholder="Detail the strategic objectives, key milestones, and high-level requirements..."
          [rows]="3"
          [autoResize]="true"
        ></textarea>
      </div>
      <div class="col-span-12 border-b border-gray-300"></div>
      <div class="col-span-12 flex flex-col gap-2">
        <div class="uppercase text-gray-700">Project Team</div>
        <p-multiSelect
          [options]="userSelection"
          formControlName="projectMembers"
          appendTo="body"
          [filter]="true"
          filterBy="displayName,name,jobTitle"
          optionLabel="name"
          optionValue="value"
          placeholder="Add team members..."
        >
          <ng-template let-user #item>
            <div class="flex flex-col py-1">
              <span class="font-semibold">
                {{ user.displayName }}
              </span>

              <span class="text-sm text-gray-600">
                {{ user.name }}
              </span>

              <span class="text-xs text-blue-600">
                {{ user.jobTitle }}
              </span>
            </div>
          </ng-template>

          <ng-template #selectedItems>
            <div class="flex flex-wrap gap-2">
              @for (user of selectedMembers; track user.value) {
                <p-tag [value]="user.name" severity="info"></p-tag>
              }
            </div>
          </ng-template>
        </p-multiSelect>
      </div>
      <div class="col-span-12 grid grid-cols-12 gap-3">
        @for (item of selectedMembers; track $index) {
          <div
            class="col-span-6 md:col-span-4 p-3 bg-blue-50 rounded-md border border-gray-200 flex flex-row justify-between"
          >
            <div class="flex flex-row gap-4 items-center">
              <div
                class="w-10 h-10 rounded-xl bg-blue-200 flex items-center justify-center"
              >
                <div class="font-bold text-blue-800">
                  {{ getInitials(item.name) }}
                </div>
              </div>
              <div class="flex flex-col">
                <div>{{ item.name }}</div>
                <span class="text-sm text-gray-600">{{ item.jobTitle }}</span>
              </div>
            </div>
            <i
              (click)="RemoveMember(item)"
              class="pi pi-times text-red-500! text-sm! cursor-pointer!"
            ></i>
          </div>
        }
      </div>
    </div>
    <div
      class="col-span-12 p-5 bg-blue-100 border border-gray-300 rounded-b-lg flex flex-row items-center justify-between"
    >
      <p-button
        label="Cancel"
        severity="secondary"
        styleClass="bg-blue-100! text-blue-900! border-blue-900! px-5! rounded-sm!"
      ></p-button>

      <div class="flex flex-row items-center gap-3">
        <p-button
          (onClick)="Save('Draft')"
          label="Save as Draft"
          severity="secondary"
          styleClass="bg-blue-100! text-blue-900! border-blue-900! px-5! rounded-sm!"
        ></p-button>
        <p-button
          (onClick)="Save('Pending')"
          label="Create Project"
          severity="secondary"
          styleClass="shadow-sm! bg-blue-900! border-none! text-white! px-5! rounded-sm!"
        ></p-button>
      </div>
    </div>
  </div>`,
  styleUrl: './project-form.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectForm implements OnInit, OnDestroy {
  private readonly projectService = inject(ProjectService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly loadingService = inject(LoadingService);
  private readonly messageService = inject(MessageService);

  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  FG!: FormGroup;

  clientSelection: any;
  userSelection: any;

  selectedMembers: any[] = [];

  constructor() {
    this.getDropdown();
    this.initForm();
  }

  initForm() {
    this.FG = new FormGroup({
      id: new FormControl<string | null>({ value: null, disabled: true }),
      projectTitle: new FormControl<string | null>(null, Validators.required),
      clientId: new FormControl<string | null>(null),
      projectLeaderId: new FormControl<string | null>(null),
      startDate: new FormControl<Date | null>(null),
      endDate: new FormControl<Date | null>(null),
      priority: new FormControl<string | null>('Low'),
      description: new FormControl<string | null>(null),
      projectMembers: new FormControl<string[]>([]),
    });
  }

  getDropdown() {
    this.projectService
      .GetDropdown()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.clientSelection = res.clients
            .map((c) => ({ label: c.name, value: c.id }))
            .sort((a, b) => a.label.localeCompare(b.label));

          this.userSelection = res.users
            .map((u: any) => ({
              label: u.name,
              value: u.id,
              name: u.name,
              displayName: u.displayName,
              jobTitle: u.jobTitle,
            }))
            .sort((a, b) => a?.name.localeCompare(b?.name));

          this.loadingService.stop();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loadingService.stop();
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load dropdown data',
          });
        },
      });
  }

  ngOnInit(): void {
    this.FG.get('projectMembers')
      ?.valueChanges.pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((ids: string[] | null) => {
        if (!ids || !this.userSelection) {
          this.selectedMembers = [];
          return;
        }

        this.selectedMembers = this.userSelection.filter((user: any) =>
          ids.includes(user.value),
        );

        this.cdr.markForCheck();
      });
  }

  getUserName(id: string): string {
    const user = this.userSelection.find((x: any) => x.value === id);
    return user?.name ?? '';
  }

  getInitials(name: string | undefined | null): string {
    if (!name) return '';

    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase();
  }

  RemoveMember(member: any): void {
    this.selectedMembers = this.selectedMembers.filter(
      (x) => x.value !== member.value,
    );

    const currentIds = this.FG.get('projectMembers')?.value ?? [];

    const updatedIds = currentIds.filter((id: string) => id !== member.value);

    this.FG.get('projectMembers')?.setValue(updatedIds);

    this.cdr.markForCheck();
  }

  Save(status: string) {}

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
