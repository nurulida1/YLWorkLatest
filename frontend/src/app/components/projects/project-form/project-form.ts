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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
    RouterLink,
  ],
  template: `<div class="flex flex-col p-6">
    <div class="flex flex-row items-center gap-2">
      <a href="/dashboard" class="font-semibold text-gray-500 hover:underline"
        >Dashboard</a
      >
      <i class="pi pi-chevron-right mt-1! text-[8px]! text-gray-500!"></i>
      <a href="/projects" class="font-semibold text-gray-500 hover:underline"
        >Projects</a
      >
      <i class="pi pi-chevron-right mt-1! text-[8px]! text-gray-500!"></i>
      <span class="text-blue-600 font-semibold">New Project</span>
    </div>

    <div class="my-4 flex flex-row items-center justify-between">
      <div class="font-extrabold text-3xl text-gray-800 tracking-wide">
        Create New Project
      </div>
      <div class="flex flex-row items-center justify-between gap-3">
        <p-button
          [routerLink]="'/projects'"
          label="Discard"
          severity="secondary"
          [outlined]="true"
          styleClass="rounded-none! px-5! border-2! border-gray-400! py-1.5!"
        ></p-button>
        <p-button
          *ngIf="!currentId || status === 'Draft'"
          (onClick)="Save('Draft')"
          label="Save as Draft"
          severity="info"
          [outlined]="true"
          styleClass="rounded-none! px-5! border-2! border-blue-600! text-blue-700! py-1.5!"
        ></p-button>

        <p-button
          (onClick)="Save()"
          [label]="
            !currentId || status === 'Draft' ? 'Create Project' : 'Save Changes'
          "
          [icon]="!currentId || status === 'Draft' ? 'pi pi-plus' : ''"
          severity="info"
          styleClass="rounded-none! px-5! border-none! bg-blue-700! py-2!"
        ></p-button>
      </div>
    </div>
    <div class="border-b border-gray-200 mb-4"></div>
    <div class="grid grid-cols-12 gap-5 justify-between">
      <div class="col-span-8 flex flex-col">
        <div class="p-4 bg-white border border-gray-200 flex flex-col">
          <div class="flex flex-row items-center gap-2">
            <i class="pi pi-info-circle text-blue-700! text-lg! mt-1!"></i>
            <div class="text-xl text-gray-800 font-semibold tracking-wide">
              Project Basics
            </div>
          </div>
          <div class="border-b border-gray-200 my-4"></div>
          <div class="grid grid-cols-12 gap-4" [formGroup]="FG">
            <div class="col-span-6 flex flex-col gap-1">
              <div class="font-semibold text-gray-700">Project Code</div>
              <input
                type="text"
                pInputText
                class="w-full rounded-none! bg-gray-100!"
                placeholder="YL-2026-001"
                formControlName="projectCode"
              />
            </div>
            <div class="col-span-6 flex flex-col gap-1">
              <div class="font-semibold text-gray-700">Project Name</div>
              <input
                type="text"
                pInputText
                class="w-full rounded-none!"
                placeholder="Enter descriptive name..."
                formControlName="projectTitle"
              />
            </div>
            <div class="col-span-6 flex flex-col gap-1">
              <div class="font-semibold text-gray-700">Client</div>
              <p-select
                [options]="clientSelection"
                formControlName="clientId"
                appendTo="body"
                [filter]="true"
                styleClass="rounded-none!"
                panelStyleClass="rounded-none!"
              ></p-select>
            </div>
            <div class="col-span-6 flex flex-col gap-1">
              <div class="font-semibold text-gray-700">Priority</div>
              <p-select
                [options]="[
                  { label: 'Low', value: 'Low' },
                  { label: 'Medium', value: 'Medium' },
                  { label: 'High', value: 'High' },
                  { label: 'Critical', value: 'Critical' },
                ]"
                formControlName="priority"
                appendTo="body"
                [filter]="true"
                styleClass="rounded-none!"
                panelStyleClass="rounded-none!"
              ></p-select>
            </div>
          </div>
        </div>

        <div class="mt-7 p-4 bg-white border border-gray-200 flex flex-col">
          <div class="flex flex-row items-center gap-2">
            <i class="pi pi-align-left text-blue-700! text-lg! mt-1!"></i>
            <div class="text-xl text-gray-800 font-semibold tracking-wide">
              Detailed Description
            </div>
          </div>
          <div class="border-b border-gray-200 my-4"></div>
          <div class="grid grid-cols-12 gap-4" [formGroup]="FG">
            <div class="col-span-12 flex flex-col gap-1">
              <div class="font-semibold text-gray-700">Scope & Objectives</div>
              <textarea
                name=""
                id=""
                pTextarea
                [rows]="4"
                [autoResize]="true"
                formControlName="description"
                class="rounded-none!"
                placeholder="Provide a comprehensive breakdown of project goals, technical requirements, and expected outcomes..."
              ></textarea>
              <span class="text-gray-400 text-sm italic"
                >Minimum 100 characters recommended for audit compliance.</span
              >
            </div>
          </div>
        </div>

        <div class="mt-7 p-4 bg-white border border-gray-200 flex flex-col">
          <div class="flex flex-row items-center gap-2">
            <i class="pi pi-map-marker text-blue-700! text-lg! mt-1!"></i>
            <div class="text-xl text-gray-800 font-semibold tracking-wide">
              Location & Schedule
            </div>
          </div>
          <div class="border-b border-gray-200 my-4"></div>
          <div class="grid grid-cols-12 gap-4" [formGroup]="FG">
            <div class="col-span-12 flex flex-col gap-1">
              <div class="font-semibold text-gray-700">Site Address</div>
              <div class="w-full relative">
                <input
                  type="text"
                  pInputText
                  class="w-full rounded-none! pl-8!"
                  formControlName="location"
                  placeholder="Street, Building, City, Postcode"
                />
                <i class="pi pi-map text-gray-600! absolute top-3.5 left-2"></i>
              </div>
            </div>
            <div class="col-span-6 flex flex-col gap-1">
              <div class="font-semibold text-gray-700">Start Date</div>
              <p-datepicker
                appendTo="body"
                dateFormat="dd/mm/yy"
                formControlName="startDate"
                styleClass="w-full rounded-none!"
                class="rounded-none!"
                panelStyleClass="rounded-none!"
                [showIcon]="true"
              ></p-datepicker>
            </div>
            <div class="col-span-6 flex flex-col gap-1">
              <div class="font-semibold text-gray-700">
                Estimated Completed Date
              </div>
              <p-datepicker
                appendTo="body"
                dateFormat="dd/mm/yy"
                formControlName="estimatedCompletedDate"
                styleClass="w-full rounded-none!"
                class="rounded-none!"
                panelStyleClass="rounded-none!"
                [showIcon]="true"
              ></p-datepicker>
            </div>
          </div>
        </div>
      </div>

      <div class="col-span-4 flex flex-col gap-5">
        <div class="bg-white border border-gray-200 p-4 flex flex-col">
          <div class="flex flex-row items-center gap-2">
            <i class="pi pi-users text-blue-600! text-lg!"></i>
            <div class="font-semibold tracking-wide text-lg">
              Team & Assignment
            </div>
          </div>
          <div class="my-4 border-b border-gray-200"></div>
          <div class="grid grid-cols-12 gap-4" [formGroup]="FG">
            <div class="col-span-12 flex flex-col gap-1">
              <div class="font-semibold text-gray-600">Project Lead</div>
              <p-select
                [options]="userSelection"
                appendTo="body"
                [filter]="true"
                placeholder="Select Lead..."
                styleClass="rounded-none!"
                formControlName="projectLeaderId"
                panelStyleClass="rounded-none!"
              ></p-select>
            </div>
            <div class="col-span-12 flex flex-col gap-1">
              <div class="font-semibold text-gray-600">Assign Team</div>
              <p-multiselect
                [options]="userSelection"
                appendTo="body"
                [filter]="true"
                placeholder="Select team members..."
                styleClass="rounded-none!"
                panelStyleClass="rounded-none!"
                formControlName="projectMembers"
              ></p-multiselect>
              <div
                class="flex flex-wrap gap-2 mt-2"
                *ngIf="selectedMembers && selectedMembers.length > 0"
              >
                <ng-container *ngFor="let member of selectedMembers">
                  <div class="bg-blue-100 px-5 py-1 rounded-full text-blue-600">
                    {{ member.label ?? member?.fullName }}
                  </div>
                </ng-container>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white border border-gray-200 p-4 flex flex-col">
          <div class="flex flex-row items-center gap-2">
            <i class="pi pi-money-bill text-blue-600! text-lg!"></i>
            <div class="font-semibold tracking-wide text-lg">
              Budget & Resources
            </div>
          </div>
          <div class="my-4 border-b border-gray-200"></div>
          <div class="grid grid-cols-12 gap-4" [formGroup]="FG">
            <div class="col-span-12 flex flex-col gap-1">
              <div class="font-semibold text-gray-600">
                Total Estimated Budget (RM)
              </div>
              <p-inputnumber
                placeholder="0.00"
                formControlName="estimatedBudget"
                [minFractionDigits]="2"
                inputStyleClass="rounded-none!"
                mode="decimal"
              ></p-inputnumber>
            </div>
            <div class="col-span-12 flex flex-col gap-1">
              <div class="font-semibold text-gray-600">
                Documentation & Photos
              </div>

              <input
                #fileInput
                type="file"
                multiple
                hidden
                accept=".pdf,.jpg,.jpeg,.png"
                (change)="onFilesSelected($event)"
              />

              <div
                class="w-full border-2 border-dashed border-gray-300 bg-gray-50 h-36 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition"
                (click)="fileInput.click()"
              >
                <i class="pi pi-cloud-upload text-4xl! text-blue-500!"></i>

                <div class="font-semibold mt-2">Click to upload files</div>

                <span class="text-gray-500 text-xs">
                  PDF, JPG, JPEG, PNG (Multiple files)
                </span>
              </div>

              <div
                *ngIf="selectedFiles.length"
                class="mt-4 flex flex-col gap-2"
              >
                <div
                  *ngFor="let file of selectedFiles; let i = index"
                  class="flex items-center justify-between border border-blue-400 rounded px-3 py-2"
                >
                  <div class="flex items-center gap-2">
                    <i class="pi pi-file"></i>

                    <div>
                      <div
                        class="text-blue-800 font-medium whitespace-nowrap truncate max-w-[200px]"
                      >
                        {{ file.name }}
                      </div>

                      <div class="text-xs text-gray-500">
                        {{ (file.size / 1024).toFixed(1) }} KB
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    class="text-red-500 cursor-pointer"
                    (click)="removeFile(i)"
                  >
                    <i class="pi pi-times"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
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
  private readonly router = inject(Router);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  FG!: FormGroup;

  clientSelection: any;
  userSelection: any;

  currentId: string | null = null;

  status: string | null = null;

  selectedMembers: any[] = [];
  selectedFiles: File[] = [];

  constructor() {
    this.getDropdown();
    this.initForm();
  }

  initForm() {
    this.FG = new FormGroup({
      id: new FormControl<string | null>({ value: null, disabled: true }),
      projectCode: new FormControl<string | null>(null),
      projectTitle: new FormControl<string | null>(null, Validators.required),
      location: new FormControl<string | null>(null),
      clientId: new FormControl<string | null>(null),
      projectLeaderId: new FormControl<string | null>(null),
      startDate: new FormControl<Date | null>(null),
      estimatedCompletedDate: new FormControl<Date | null>(null),
      endDate: new FormControl<Date | null>(null),
      estimatedBudget: new FormControl<number | null>(null),
      priority: new FormControl<string | null>('Low'),
      description: new FormControl<string | null>(null),
      status: new FormControl<string | null>('Draft'),
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
    this.currentId = this.activatedRoute.snapshot.queryParams['id'];

    if (this.currentId) {
      this.FG.get('id')?.enable();
      this.FG.get('id')?.patchValue(this.currentId);

      this.LoadForm();
    } else {
      this.GetProjectCode();
    }

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

  GetProjectCode() {
    this.projectService
      .GetNextProjectCode()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.FG.get('projectCode')?.patchValue(res.projectCode);
          this.cdr.markForCheck();
        },
      });
  }

  LoadForm() {
    this.loadingService.start();

    this.projectService
      .GetOne({
        Page: 1,
        PageSize: 1,
        OrderBy: null,
        Includes: 'ProjectMembers,Attachments',
        Select: null,
        Filter: `Id=${this.currentId}`,
      })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();

          if (res) {
            this.status = res.status;

            this.FG.patchValue({
              ...res,
              startDate: res.startDate ? new Date(res.startDate) : null,
              estimatedCompletedDate: res.estimatedCompletedDate
                ? new Date(res.estimatedCompletedDate)
                : null,

              projectMembers:
                res.projectMembers?.map((x: any) => x.userId) ?? [],
            });
          }

          this.cdr.markForCheck();
        },
        error: () => {
          this.loadingService.stop();
        },
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

  Save(status: 'Draft' | 'Planning' = 'Planning') {
    this.FG.get('status')?.patchValue(status);

    const formData = new FormData();

    const formValue = this.FG.getRawValue();

    Object.keys(formValue).forEach((key) => {
      if (
        key === 'projectMembers' ||
        formValue[key] === null ||
        formValue[key] === undefined
      ) {
        return;
      }

      let value = formValue[key];

      if (value instanceof Date) {
        value = value.toISOString();
      }

      formData.append(key, value);
    });

    const members = formValue.projectMembers ?? [];

    members.forEach((id: string) => {
      formData.append('ProjectMembers', id);
    });

    this.selectedFiles.forEach((file) => {
      formData.append('Files', file);
    });

    this.loadingService.start();

    const request$ = this.currentId
      ? this.projectService.Update(formData)
      : this.projectService.Create(formData);

    request$.pipe(takeUntil(this.ngUnsubscribe)).subscribe({
      next: (res) => {
        this.loadingService.stop();

        this.messageService.add({
          severity: 'success',

          summary: 'Success',

          detail: this.currentId
            ? `${res.projectCode} updated successfully`
            : `Project: ${res.projectCode} created successfully`,
        });

        this.router.navigate(['/projects']);
      },

      error: (err) => {
        console.error(err);

        this.loadingService.stop();

        this.messageService.add({
          severity: 'error',

          summary: 'Error',

          detail: 'Failed to save project',
        });
      },
    });
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files?.length) {
      return;
    }

    const files = Array.from(input.files);

    const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png'];

    const maxSize = 10 * 1024 * 1024; //10MB

    files.forEach((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase();

      if (!ext || !allowedExtensions.includes(ext)) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Invalid File',
          detail: `${file.name} is not supported.`,
        });

        return;
      }

      if (file.size > maxSize) {
        this.messageService.add({
          severity: 'warn',
          summary: 'File Too Large',
          detail: `${file.name} exceeds 10MB.`,
        });

        return;
      }

      const exists = this.selectedFiles.some(
        (f) => f.name === file.name && f.size === file.size,
      );

      if (!exists) {
        this.selectedFiles.push(file);
      }
    });

    input.value = '';

    this.cdr.markForCheck();
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);

    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
