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
import { ProjectService } from '../../../../services/ProjectService';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { LoadingService } from '../../../../services/loading.service';
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
  template: `
    <div class="min-h-screen bg-slate-50 px-4 py-5 sm:px-6 lg:px-8">
      <!-- Breadcrumb -->
      <div class="mb-5 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
        <a
          routerLink="/dashboard"
          class="text-slate-500 transition hover:text-blue-600"
        >
          Dashboard
        </a>
        <i class="pi pi-chevron-right text-[9px]! text-slate-400"></i>
        <a
          routerLink="/projects"
          class="text-slate-500 transition hover:text-blue-600"
        >
          Projects
        </a>
        <i class="pi pi-chevron-right text-[9px]! text-slate-400"></i>
        <span class="font-semibold text-blue-700">
          {{ currentId ? 'Edit Project' : 'New Project' }}
        </span>
      </div>

      <!-- Page Header -->
      <div
        class="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"
      >
        <div>
          <div class="flex items-center gap-3">
            <div
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700"
            >
              <i class="pi pi-briefcase text-xl"></i>
            </div>

            <div>
              <h1
                class="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl"
              >
                {{ currentId ? 'Edit Project' : 'Create New Project' }}
              </h1>
              <p class="mt-1 text-sm text-slate-500">
                {{
                  currentId
                    ? 'Update project information, team assignments and resources.'
                    : 'Set up a new project and assign the necessary resources.'
                }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Form Layout -->
      <div class="grid grid-cols-1 items-start gap-5 xl:grid-cols-12">
        <!-- LEFT COLUMN -->
        <div class="flex min-w-0 flex-col gap-5 xl:col-span-8">
          <!-- Project Basics -->
          <section
            class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            <div
              class="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6"
            >
              <div
                class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700"
              >
                <i class="pi pi-info-circle text-lg"></i>
              </div>

              <div>
                <h2 class="font-bold text-slate-800">Project Basics</h2>
                <p class="text-xs text-slate-500">
                  General information about this project
                </p>
              </div>
            </div>

            <div
              class="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6"
              [formGroup]="FG"
            >
              <!-- Project Code -->
              <div class="flex flex-col gap-2">
                <label class="text-sm font-semibold text-slate-700">
                  Project Code
                </label>

                <input
                  type="text"
                  pInputText
                  formControlName="projectCode"
                  placeholder="YL-2026-001"
                  class="!w-full !rounded-lg !border-slate-200 !bg-slate-50 !text-sm"
                />

                <small class="text-xs text-slate-400">
                  System-generated project reference.
                </small>
              </div>

              <!-- Project Name -->
              <div class="flex flex-col gap-2">
                <label class="text-sm font-semibold text-slate-700">
                  Project Name <span class="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  pInputText
                  formControlName="projectTitle"
                  placeholder="Enter project name..."
                  class="!w-full !rounded-lg !border-slate-200 !text-sm"
                />

                <small
                  *ngIf="
                    FG.get('projectTitle')?.invalid &&
                    FG.get('projectTitle')?.touched
                  "
                  class="text-xs text-red-500"
                >
                  Project name is required.
                </small>
              </div>

              <!-- Client -->
              <div class="flex flex-col gap-2">
                <label class="text-sm font-semibold text-slate-700">
                  Client *
                </label>

                <p-select
                  [options]="clientSelection"
                  formControlName="clientId"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select client..."
                  appendTo="body"
                  [filter]="true"
                  filterBy="label"
                  [showClear]="true"
                  styleClass="!w-full !rounded-lg"
                  panelStyleClass="!rounded-lg"
                ></p-select>

                <small
                  *ngIf="
                    FG.get('clientId')?.invalid &&
                    FG.get('clientId')?.touched
                  "
                  class="text-red-500 text-xs"
                >
                  Client is required.
                </small>
              </div>

              <!-- Priority -->
              <div class="flex flex-col gap-2">
                <label class="text-sm font-semibold text-slate-700">
                  Priority
                </label>

                <p-select
                  [options]="[
                    { label: 'Low', value: 'Low' },
                    { label: 'Medium', value: 'Medium' },
                    { label: 'High', value: 'High' },
                    { label: 'Critical', value: 'Critical' },
                  ]"
                  formControlName="priority"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select priority..."
                  appendTo="body"
                  styleClass="!w-full !rounded-lg"
                  panelStyleClass="!rounded-lg"
                ></p-select>
              </div>
            </div>
          </section>

          <!-- Detailed Description -->
          <section
            class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            <div
              class="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6"
            >
              <div
                class="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700"
              >
                <i class="pi pi-align-left text-lg"></i>
              </div>

              <div>
                <h2 class="font-bold text-slate-800">Detailed Description</h2>
                <p class="text-xs text-slate-500">
                  Define the project scope and objectives
                </p>
              </div>
            </div>

            <div class="p-5 sm:p-6" [formGroup]="FG">
              <div class="flex flex-col gap-2">
                <label class="text-sm font-semibold text-slate-700">
                  Scope & Objectives
                </label>

                <textarea
                  pTextarea
                  [rows]="5"
                  [autoResize]="true"
                  formControlName="description"
                  placeholder="Describe project goals, technical requirements, scope of work and expected outcomes..."
                  class="!w-full !rounded-lg !border-slate-200 !text-sm"
                ></textarea>

                <div
                  class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
                >
                  <small class="text-xs text-slate-400">
                    Provide sufficient details for project tracking and audit
                    purposes.
                  </small>
                  <small class="text-xs text-slate-400">
                    Minimum 100 characters recommended.
                  </small>
                </div>
              </div>
            </div>
          </section>

          <!-- Location & Schedule -->
          <section
            class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            <div
              class="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6"
            >
              <div
                class="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"
              >
                <i class="pi pi-map-marker text-lg"></i>
              </div>

              <div>
                <h2 class="font-bold text-slate-800">Location & Schedule</h2>
                <p class="text-xs text-slate-500">
                  Project site and expected timeline
                </p>
              </div>
            </div>

            <div
              class="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6"
              [formGroup]="FG"
            >
              <!-- Site Address -->
              <div class="flex flex-col gap-2 sm:col-span-2">
                <label class="text-sm font-semibold text-slate-700">
                  Site Address
                </label>

                <div class="relative">
                  <i
                    class="pi pi-map-marker absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400"
                  ></i>

                  <input
                    type="text"
                    pInputText
                    formControlName="location"
                    placeholder="Street, building, city, postcode..."
                    class="!w-full !rounded-lg !border-slate-200 !pl-10 !text-sm"
                  />
                </div>
              </div>

              <!-- Start Date -->
              <div class="flex flex-col gap-2">
                <label class="text-sm font-semibold text-slate-700">
                  Start Date
                </label>

                <p-datepicker
                  appendTo="body"
                  dateFormat="dd/mm/yy"
                  formControlName="startDate"
                  placeholder="Select start date"
                  [showIcon]="true"
                  styleClass="!w-full !rounded-lg"
                  panelStyleClass="!rounded-lg"
                ></p-datepicker>
              </div>

              <!-- Estimated Completion -->
              <div class="flex flex-col gap-2">
                <label class="text-sm font-semibold text-slate-700">
                  Estimated Completion Date
                </label>

                <p-datepicker
                  appendTo="body"
                  dateFormat="dd/mm/yy"
                  formControlName="estimatedCompletedDate"
                  placeholder="Select completion date"
                  [showIcon]="true"
                  styleClass="!w-full !rounded-lg"
                  panelStyleClass="!rounded-lg"
                ></p-datepicker>
              </div>
            </div>
          </section>
        </div>

        <!-- RIGHT COLUMN -->
        <div class="flex min-w-0 flex-col gap-5 xl:col-span-4">
          <!-- Team & Assignment -->
          <section
            class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            <div
              class="flex items-center gap-3 border-b border-slate-100 px-5 py-4"
            >
              <div
                class="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-700"
              >
                <i class="pi pi-users text-lg"></i>
              </div>

              <div>
                <h2 class="font-bold text-slate-800">Team & Assignment</h2>
                <p class="text-xs text-slate-500">
                  Assign project responsibilities
                </p>
              </div>
            </div>

            <div class="flex flex-col gap-5 p-5" [formGroup]="FG">
              <!-- Project Lead -->
              <div class="flex flex-col gap-2">
                <label class="text-sm font-semibold text-slate-700">
                  Project Lead
                </label>

                <p-select
                  [options]="userSelection"
                  appendTo="body"
                  [filter]="true"
                  filterBy="label"
                  [showClear]="true"
                  placeholder="Select project lead..."
                  optionLabel="label"
                  optionValue="value"
                  styleClass="!w-full !rounded-lg"
                  panelStyleClass="!rounded-lg"
                  formControlName="projectLeaderId"
                ></p-select>
              </div>

              <!-- Team Members -->
              <div class="flex flex-col gap-2">
                <div class="flex items-center justify-between">
                  <label class="text-sm font-semibold text-slate-700">
                    Assign Team Members
                  </label>

                  <span class="text-xs text-slate-400">
                    {{ selectedMembers.length }} selected
                  </span>
                </div>

                <p-multiselect
                  [options]="userSelection"
                  appendTo="body"
                  [filter]="true"
                  filterBy="label"
                  [showClear]="true"
                  placeholder="Select team members..."
                  optionLabel="label"
                  optionValue="value"
                  styleClass="!w-full !rounded-lg"
                  panelStyleClass="!rounded-lg"
                  formControlName="projectMembers"
                ></p-multiselect>

                <!-- Selected Members -->
                <div
                  *ngIf="selectedMembers.length > 0"
                  class="mt-2 flex flex-col gap-2"
                >
                  <div
                    *ngFor="let member of selectedMembers"
                    class="flex items-center justify-between gap-2 rounded-lg border border-blue-100 bg-blue-50/70 px-3 py-2"
                  >
                    <div class="flex min-w-0 items-center gap-2">
                      <div
                        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700"
                      >
                        {{ getInitials(member.label ?? member.fullName) }}
                      </div>

                      <div class="min-w-0">
                        <div
                          class="truncate text-sm font-medium text-slate-700"
                        >
                          {{ member.label ?? member.fullName }}
                        </div>
                        <div class="text-xs text-slate-400">
                          {{ member.jobTitle || 'Team Member' }}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-red-100 hover:text-red-600"
                      (click)="RemoveMember(member)"
                      aria-label="Remove team member"
                    >
                      <i class="pi pi-times text-xs"></i>
                    </button>
                  </div>
                </div>

                <div
                  *ngIf="!selectedMembers.length"
                  class="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center"
                >
                  <i class="pi pi-users mb-1 text-xl text-slate-300"></i>
                  <p class="text-xs text-slate-400">
                    No team members assigned yet.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <!-- Budget & Resources -->
          <section
            class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            <div
              class="flex items-center gap-3 border-b border-slate-100 px-5 py-4"
            >
              <div
                class="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-700"
              >
                <i class="pi pi-wallet text-lg"></i>
              </div>

              <div>
                <h2 class="font-bold text-slate-800">Budget & Resources</h2>
                <p class="text-xs text-slate-500">
                  Estimated cost and supporting documents
                </p>
              </div>
            </div>

            <div class="flex flex-col gap-5 p-5" [formGroup]="FG">
              <!-- Budget -->
              <div class="flex flex-col gap-2">
                <label class="text-sm font-semibold text-slate-700">
                  Total Estimated Budget
                </label>

                <p-inputnumber
                  placeholder="0.00"
                  formControlName="estimatedBudget"
                  [minFractionDigits]="2"
                  [maxFractionDigits]="2"
                  [min]="0"
                  mode="decimal"
                  prefix="RM "
                  inputStyleClass="!w-full !rounded-lg !text-sm"
                  styleClass="!w-full"
                ></p-inputnumber>

                <small class="text-xs text-slate-400">
                  Enter the estimated total project budget.
                </small>
              </div>

              <div class="border-t border-slate-100"></div>

              <!-- Attachments -->
              <div class="flex flex-col gap-3">
                <div>
                  <label class="text-sm font-semibold text-slate-700">
                    Documentation & Photos
                  </label>
                  <p class="mt-1 text-xs text-slate-400">
                    Upload project documents and supporting photos.
                  </p>
                </div>

                <input
                  #fileInput
                  type="file"
                  multiple
                  hidden
                  accept=".pdf,.jpg,.jpeg,.png"
                  (change)="onFilesSelected($event)"
                />

                <!-- Upload Area -->
                <div
                  class="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center transition hover:border-blue-400 hover:bg-blue-50/50"
                  (click)="fileInput.click()"
                >
                  <div
                    class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600"
                  >
                    <i class="pi pi-cloud-upload text-2xl"></i>
                  </div>

                  <p class="text-sm font-semibold text-slate-700">
                    Click to upload files
                  </p>

                  <p class="mt-1 text-xs text-slate-400">
                    PDF, JPG, JPEG or PNG
                  </p>

                  <p class="mt-1 text-xs text-slate-400">
                    Maximum 10MB per file
                  </p>
                </div>

                <!-- Selected Files -->
                <div
                  *ngIf="selectedFiles.length > 0"
                  class="flex flex-col gap-2"
                >
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-semibold text-slate-600">
                      Selected Files
                    </span>
                    <span class="text-xs text-slate-400">
                      {{ selectedFiles.length }} file(s)
                    </span>
                  </div>

                  <div
                    *ngFor="let file of selectedFiles; let i = index"
                    class="flex min-w-0 items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-3"
                  >
                    <div class="flex min-w-0 items-center gap-3">
                      <div
                        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600"
                      >
                        <i
                          [ngClass]="
                            file.name.toLowerCase().endsWith('.pdf')
                              ? 'pi pi-file-pdf'
                              : 'pi pi-image'
                          "
                        ></i>
                      </div>

                      <div class="min-w-0">
                        <p
                          class="truncate text-xs font-semibold text-slate-700"
                        >
                          {{ file.name }}
                        </p>
                        <p class="text-[11px] text-slate-400">
                          {{ (file.size / 1024).toFixed(1) }} KB
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                      (click)="removeFile(i)"
                      aria-label="Remove file"
                    >
                      <i class="pi pi-trash text-sm"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <!-- Bottom Actions -->
      <div
        class="mt-6 flex flex-col-reverse gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6"
      >
        <p class="text-xs text-slate-400">
          <i class="pi pi-info-circle mr-1"></i>
          Please review the project details before saving.
        </p>

        <div class="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <p-button
            label="Discard"
            severity="secondary"
            [outlined]="true"
            styleClass="!w-full !rounded-lg !px-4 !py-2 sm:!w-auto"
            [routerLink]="'/projects'"
          ></p-button>

          <p-button
            (onClick)="Save()"
            [label]="
              !currentId || status === 'Draft'
                ? 'Create Project'
                : 'Save Changes'
            "
            icon="pi pi-save"
            severity="info"
            styleClass="!w-full !rounded-lg !border-blue-700 !bg-blue-700 !px-5 !py-2 sm:!w-auto"
          ></p-button>
        </div>
      </div>
    </div>
  `,
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

  clientSelection: any[] = [];
  userSelection: any[] = [];

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
      clientId: new FormControl<string | null>(null, Validators.required),
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
    const user = this.userSelection?.find((x: any) => x.value === id);
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
    if (status !== 'Draft') {
      this.FG.markAllAsTouched();

      if (this.FG.invalid) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Incomplete Information',
          detail: 'Please complete all required fields.',
        });

        return;
      }
    }

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
