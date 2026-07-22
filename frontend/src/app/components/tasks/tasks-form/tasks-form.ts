import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ClientRoutingModule } from '../../clients/client-routing.module';
import { CheckboxModule } from 'primeng/checkbox';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { ProjectTaskService } from '../../../services/ProjectTaskService';
import { finalize, Subject, takeUntil } from 'rxjs';
import { LoadingService } from '../../../services/loading.service';
import { ValidateAllFormFields } from '../../../shared/helpers/helpers';
import { MessageService } from 'primeng/api';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-tasks-form',
  imports: [
    CommonModule,
    InputTextModule,
    ButtonModule,
    ReactiveFormsModule,
    DatePickerModule,
    TextareaModule,
    SelectModule,
    MultiSelectModule,
    ClientRoutingModule,
    CheckboxModule,
    ToggleSwitchModule,
    DragDropModule,
  ],
  template: `
    <div class="w-full min-h-screen bg-gray-100">
      <div class="flex-col block lg:hidden">
        <div class="px-4 pt-4 pb-3 flex items-center justify-between">
          <p-button [text]="true" severity="secondary" [routerLink]="'/tasks'">
            <ng-template #icon>
              <i class="pi pi-chevron-left text-xl"></i>
            </ng-template>
          </p-button>

          <div class="text-xl font-semibold tracking-wide text-gray-800">
            Add New Task
          </div>

          <p-button [text]="true" severity="secondary"> </p-button>
        </div>
        <div
          class="border-t-2 border-gray-200 bg-white pb-30 rounded-t-3xl pt-5 flex-1 px-7"
        >
          <div
            class="grid grid-cols-12 items-center space-y-4"
            [formGroup]="FG"
          >
            <div class="col-span-12 flex flex-col gap-1">
              <label for="">Title <span class="text-red-500">*</span></label>
              <input
                type="text"
                pInputText
                class="w-full border-gray-200!"
                formControlName="title"
              />
            </div>
            <div class="col-span-12 flex flex-col gap-1">
              <label for="">Project</label>

              <p-select
                formControlName="projectId"
                [options]="projectSelection"
                styleClass="w-full! border-gray-200! py-1!"
                appendTo="body"
              ></p-select>
            </div>
            <div class="col-span-12 flex flex-col gap-1">
              <label for="">Due Date </label>
              <p-datepicker
                [showIcon]="true"
                formControlName="dueDate"
                dateFormat="dd/mm/yy"
                styleClass="w-full!"
                inputStyleClass="border-gray-200!"
                placeholder="dd/mm/yyyy"
              ></p-datepicker>
            </div>
            <div class="col-span-12 flex flex-col gap-1">
              <label for="">Priority</label>

              <p-select
                formControlName="priority"
                [options]="[
                  { label: 'Low', value: 'Low' },
                  { label: 'Medium', value: 'Medium' },
                  { label: 'High', value: 'High' },
                ]"
                styleClass="w-full! border-gray-200! py-1!"
                appendTo="body"
              ></p-select>
            </div>

            <div class="col-span-12 flex flex-col gap-1">
              <label for=""
                >Description
                <span class="italic text-gray-400 text-sm"
                  >(Optional)</span
                ></label
              >
              <textarea
                pTextarea
                class="w-full border-gray-200!"
                formControlName="description"
                rows="4"
                [autoResize]="true"
              ></textarea>
            </div>
            <div class="col-span-12 border-b border-gray-200 mt-2"></div>
            <div class="col-span-12 flex flex-col gap-3">
              <div class="flex items-center justify-between">
                <label class="font-semibold">Checklist</label>

                <p-button
                  icon="pi pi-plus-circle"
                  label="Add"
                  size="small"
                  severity="info"
                  styleClass="text-blue-900!"
                  [text]="true"
                  (click)="AddChecklist()"
                />
              </div>

              <div formArrayName="checklists" class="flex flex-col gap-3">
                <div
                  *ngFor="let checklist of checklists.controls; let i = index"
                  [formGroupName]="i"
                  class="rounded-xl border border-gray-200 bg-white p-3"
                >
                  <div class="flex items-center gap-3">
                    <p-checkbox
                      binary="true"
                      formControlName="isCompleted"
                    ></p-checkbox>

                    <input
                      pInputText
                      formControlName="title"
                      placeholder="Checklist item"
                      class="flex-1 border-none shadow-none"
                    />

                    <button
                      type="button"
                      class="w-8 h-8 rounded-full hover:bg-red-50"
                      (click)="RemoveChecklist(i)"
                    >
                      <i class="pi pi-trash text-red-500"></i>
                    </button>
                  </div>
                </div>

                <div
                  *ngIf="checklists.length === 0"
                  class="rounded-xl border border-dashed border-gray-300 py-6 text-center text-sm text-gray-400"
                >
                  No checklist added yet
                </div>
              </div>
            </div>
            <div class="col-span-12 border-b border-gray-200"></div>
            <div class="col-span-12 flex flex-col gap-2">
              <label for="" class="font-semibold">Assigned Members </label>
              <p-multiselect
                [options]="userSelection"
                formControlName="assignedUserIds"
                optionLabel="label"
                optionValue="value"
                appendTo="body"
                placeholder="Select team members"
                [filter]="true"
                filterBy="fullName,displayName,email"
                display="chip"
                selectedItemsLabel="{0} members selected"
                styleClass="w-full! border-gray-200! py-1!"
              >
                <ng-template let-user #item>
                  <div class="flex items-center gap-3 py-1">
                    <div
                      class="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold flex items-center justify-center"
                    >
                      {{ user.fullName.charAt(0) }}
                    </div>

                    <div class="flex flex-col">
                      <span class="font-medium text-gray-800">
                        {{ user.fullName }}
                      </span>

                      <span class="text-xs text-gray-500">
                        {{ user.displayName }}
                      </span>
                    </div>
                  </div>
                </ng-template>

                <ng-template let-user #selectedItem>
                  <span class="text-sm">
                    {{ user.displayName }}
                  </span>
                </ng-template>
              </p-multiselect>
              <div
                *ngIf="selectedMembers.length"
                class="flex flex-col gap-3 mt-4"
              >
                <div class="flex items-center justify-between">
                  <label class="text-sm font-medium text-gray-700">
                    Selected Members
                  </label>

                  <span class="text-xs text-gray-400">
                    {{ selectedMembers.length }} selected
                  </span>
                </div>

                <div class="flex flex-col gap-2">
                  <div
                    *ngFor="let user of selectedMembers"
                    class="group flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition hover:border-blue-200 hover:bg-blue-50/30"
                  >
                    <div class="flex items-center gap-3 min-w-0">
                      <div
                        class="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 font-semibold flex items-center justify-center"
                      >
                        {{ user.fullName?.charAt(0) }}
                      </div>

                      <div class="flex flex-col min-w-0">
                        <span class="font-medium text-gray-800 truncate">
                          {{ user.fullName }}
                        </span>

                        <span class="text-xs text-gray-500 truncate">
                          {{ user.displayName }}
                          <span *ngIf="user.email">
                            •
                            <span class="text-blue-500">{{ user.email }}</span>
                          </span>
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      class="flex items-center justify-center w-8 h-8 rounded-full text-gray-400 transition hover:bg-red-100 hover:text-red-500"
                      (click)="removeMember(user.value)"
                    >
                      <i class="pi pi-times text-red-500! text-sm!"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-span-12 border-b border-gray-200"></div>

            <div class="col-span-12 flex flex-col gap-3">
              <label> Attachments </label>

              <p-button
                label="Add Attachment"
                icon="pi pi-paperclip"
                severity="secondary"
                styleClass="w-full! border-gray-200!"
                (click)="fileInput.click()"
              >
              </p-button>
              <input
                #fileInput
                type="file"
                hidden
                multiple
                (change)="onFilesSelected($event)"
              />
              <div *ngIf="attachments.length" class="flex flex-col gap-2 mt-2">
                <div
                  *ngFor="let file of attachments; let i = index"
                  class="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-3"
                >
                  <div class="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"
                    >
                      <i class="pi pi-file text-blue-600"></i>
                    </div>

                    <div class="flex flex-col min-w-0">
                      <div class="font-medium truncate">
                        {{ file.name }}
                      </div>

                      <div class="text-xs text-gray-500">
                        {{ formatFileSize(file.size) }}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    class="w-9 h-9 rounded-full hover:bg-red-50 transition"
                    (click)="removeAttachment(i)"
                  >
                    <i class="pi pi-times text-red-500"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="flex flex-row items-center gap-2 mt-5">
            <p-button
              [routerLink]="'/tasks'"
              label="Cancel"
              class="flex-1"
              styleClass="w-full! border-gray-200!"
              severity="secondary"
            ></p-button>

            <p-button
              label="Create Task"
              class="flex-1"
              styleClass="w-full! bg-blue-600! border-none!"
            ></p-button>
          </div>
        </div>
      </div>

      <div class="hidden lg:block">
        <div class="flex flex-col p-6">
          <div class="flex flex-row items-center justify-between">
            <div class="font-bold text-3xl">Create New Task</div>
            <div class="flex flex-row items-center gap-3">
              <p-button
                severity="info"
                label="Discard"
                [text]="true"
                [routerLink]="'/tasks'"
                styleClass="px-5! rounded-sm! border-blue-900! text-blue-900!"
              ></p-button>
              <p-button
                severity="info"
                label="Create Task"
                (onClick)="onSave()"
                styleClass="px-5! rounded-sm! bg-blue-900! border-none! text-white!"
              ></p-button>
            </div>
          </div>
          <div
            class="grid grid-cols-12 gap-4 justify-between mt-6"
            [formGroup]="FG"
          >
            <div class="col-span-8 flex flex-col gap-4">
              <div
                class="p-8 bg-white border border-gray-300 grid grid-cols-12 gap-5"
              >
                <div class="col-span-12 flex flex-col gap-1">
                  <div class="uppercase">Task Name</div>
                  <input
                    type="text"
                    pInputText
                    formControlName="title"
                    class="w-full rounded-none!"
                    placeholder="e.g., Compliance Audit - Q3 Infrastructure"
                  />
                </div>
                <div class="col-span-12 md:col-span-6 flex flex-col gap-1">
                  <div class="uppercase">Project</div>
                  <p-select
                    [options]="projectSelection"
                    appendTo="body"
                    formControlName="projectId"
                    [filter]="true"
                    placeholder="Select a project"
                    styleClass="rounded-none!"
                  ></p-select>
                </div>
                <div class="col-span-12 md:col-span-6 flex flex-col gap-1">
                  <div class="uppercase">Due Date</div>
                  <p-datepicker
                    [showIcon]="true"
                    dateFormat="dd/mm/yy"
                    formControlName="dueDate"
                    styleClass="w-full!"
                    inputStyleClass="rounded-none!"
                    placeholder="dd/mm/yyyy"
                  ></p-datepicker>
                </div>

                <div class="col-span-12 flex flex-col gap-1">
                  <div class="uppercase">Task Description</div>
                  <textarea
                    name=""
                    id=""
                    pTextarea
                    [rows]="5"
                    [autoResize]="true"
                    formControlName="description"
                    placeholder="Provide a detailed overview of the task requirements and success criteria..."
                    class="rounded-none!"
                  ></textarea>
                </div>
              </div>
              <div
                class="flex flex-col gap-2 mt-3 p-8 bg-white border border-gray-300"
                formArrayName="checklists"
              >
                @if (checklists.length === 0) {
                  <div
                    class="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-10 px-6 text-center"
                  >
                    <i class="pi pi-list-check text-4xl text-gray-300 mb-3"></i>

                    <div class="text-lg font-medium text-gray-700">
                      No subtasks yet
                    </div>

                    <div class="text-sm text-gray-500 mt-1 mb-5">
                      Break this task into smaller actionable items.
                    </div>

                    <p-button
                      label="Add First Subtask"
                      icon="pi pi-plus"
                      severity="info"
                      styleClass="bg-blue-900! text-white! rounded-sm! border-none!"
                      (onClick)="AddChecklist()"
                    ></p-button>
                  </div>
                } @else {
                  <div class="flex flex-row items-center justify-between">
                    <div class="mb-1 font-semibold text-lg">Checklists</div>

                    <p-button
                      label="Add Subtask"
                      icon="pi pi-plus-circle"
                      [text]="true"
                      size="small"
                      styleClass="text-blue-800!"
                      severity="info"
                      (onClick)="AddChecklist()"
                    ></p-button>
                  </div>

                  <div
                    cdkDropList
                    (cdkDropListDropped)="dropChecklist($event)"
                    class="flex flex-col gap-2"
                  >
                    @for (item of checklists.controls; track $index) {
                      <div
                        cdkDrag
                        class="p-4 border border-gray-300 rounded-lg flex items-center gap-4 hover:border-blue-300 transition-colors bg-white"
                        [formGroupName]="$index"
                      >
                        <!-- Drag Handle -->
                        <i
                          cdkDragHandle
                          class="pi pi-th-large text-gray-400 cursor-move"
                        ></i>

                        @if (item.get('isEditing')?.value) {
                          <input
                            pInputText
                            formControlName="title"
                            class="flex-1 border-none shadow-none!"
                            placeholder="Enter subtask..."
                          />

                          <button
                            type="button"
                            (click)="SaveChecklist($index)"
                            class="text-blue-600 hover:text-blue-800"
                          >
                            <i class="pi pi-check-circle"></i>
                          </button>

                          <button
                            type="button"
                            (click)="CancelEdit($index)"
                            class="text-gray-500 hover:text-gray-700"
                          >
                            <i class="pi pi-times"></i>
                          </button>
                        } @else {
                          <div class="flex-1">
                            {{ item.get('title')?.value }}
                          </div>

                          <button
                            type="button"
                            (click)="EditChecklist($index)"
                            class="text-blue-600 hover:text-blue-800"
                          >
                            <i class="pi pi-pencil"></i>
                          </button>

                          <button
                            type="button"
                            (click)="RemoveChecklist($index)"
                            class="text-red-500 hover:text-red-700"
                          >
                            <i class="pi pi-trash"></i>
                          </button>
                        }
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
            <div class="col-span-4 flex flex-col gap-4">
              <div
                class="p-8 bg-white border border-gray-300 flex flex-col gap-2"
              >
                <div>Assignee</div>
                <p-multiselect
                  [options]="userSelection"
                  appendTo="body"
                  formControlName="assignedUserIds"
                  styleClass="rounded-none!"
                  placeholder="Search team members..."
                ></p-multiselect>

                <div class="flex flex-wrap gap-2 justify-between">
                  @for (item of selectedMembers; track $index) {
                    <div
                      class="p-2 bg-blue-100 rounded-full flex flex-row items-center gap-2"
                    >
                      <div
                        class="w-7 h-7 inset-shadow-sm rounded-full p-2 flex items-center justify-center text-xs text-blue-900 font-bold bg-blue-200"
                      >
                        {{ getInitials(item.label) }}
                      </div>
                      <div class="text-blue-900">{{ item.label }}</div>
                      <i
                        (click)="removeMember(item.value)"
                        class="pi pi-times-circle text-xs! pr-2! mt-0.5! text-red-500!"
                      ></i>
                    </div>
                  }
                </div>

                <div class="mt-2">Priority Level</div>

                <div class="grid grid-cols-12 gap-2">
                  @for (priority of priorityOptions; track priority) {
                    <div
                      (click)="selectPriority(priority)"
                      class="col-span-6 cursor-pointer rounded-lg border py-2 text-center
             select-none transition-all duration-300 ease-out
             hover:-translate-y-0.5 hover:shadow-md
             active:scale-95"
                      [ngClass]="[getPriorityClass(priority)]"
                    >
                      {{ priority }}
                    </div>
                  }
                </div>
              </div>

              <div
                class="p-8 bg-white border border-gray-300 flex flex-col gap-3"
              >
                <div class="font-semibold text-lg">Attachments</div>

                <!-- Upload Area -->
                <div
                  class="h-56 border-2 border-dashed border-gray-300 flex flex-col gap-2 items-center justify-center cursor-pointer hover:border-blue-400 transition"
                  (click)="fileInput.click()"
                  (dragover)="onDragOver($event)"
                  (drop)="onDrop($event)"
                >
                  <i class="pi pi-cloud-upload text-5xl! text-gray-400!"></i>

                  <div class="w-45 text-center font-semibold text-lg">
                    Click to upload or drag and drop
                  </div>

                  <span class="text-gray-400 text-xs w-45 text-center">
                    PDF, DOCX, or PNG (Max 10MB)
                  </span>

                  <input
                    #fileInput
                    type="file"
                    hidden
                    multiple
                    accept=".pdf,.docx,.png"
                    (change)="onFileSelected($event)"
                  />
                </div>

                <!-- Uploaded Files -->

                @for (file of attachments; track $index) {
                  <div
                    class="p-3 flex flex-row items-center justify-between bg-blue-50 border border-gray-200 rounded"
                  >
                    <div class="flex flex-row items-center gap-3">
                      <i class="pi pi-file text-blue-900! text-2xl!"></i>

                      <div class="flex flex-col">
                        <div class="font-semibold text-gray-600">
                          {{ file.name }}
                        </div>

                        <div class="text-gray-400 text-xs">
                          {{ formatFileSize(file.size) }}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      (click)="removeAttachment($index)"
                      class="cursor-pointer"
                    >
                      <i
                        class="pi pi-trash text-gray-500 hover:text-red-500"
                      ></i>
                    </button>
                  </div>
                }
              </div>

              <div
                class="bg-blue-50 p-8 border border-gray-300 flex flex-col gap-3"
              >
                <div class="flex flex-row items-center gap-2">
                  <i class="pi pi-info-circle text-gray-500! text-xs!"></i>
                  <div class="uppercase text-xs text-gray-500 tracking-wider">
                    Task Visibility
                  </div>
                </div>
                <div class="flex flex-row items-center justify-between">
                  <div class="text-sm tracking-wide">Visible to department</div>
                  <p-toggleswitch class="mt-1!" />
                </div>
                <span class="text-xs tracking-wide text-gray-500"
                  >This task will be visible to all members of the
                  <strong class="text-blue-800">Compliance & Legal</strong>
                  department by default.</span
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './tasks-form.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasksForm implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly loadingService = inject(LoadingService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  private readonly projectTaskService = inject(ProjectTaskService);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  FG!: FormGroup;

  currentId: string | null = null;

  attachments: File[] = [];

  projectSelection: any[] = [];
  userSelection: any[] = [];
  selectedTeamMembers: any[] = [];
  priorityOptions = ['Low', 'Medium', 'High', 'Critical'];

  allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
  ];

  maxSize = 10 * 1024 * 1024;

  constructor() {
    this.initForm();
  }

  initForm() {
    this.FG = new FormGroup({
      id: new FormControl<string | null>({ value: null, disabled: true }),
      title: new FormControl<string | null>(null, Validators.required),
      description: new FormControl<string | null>(null),
      estimatedStartDate: new FormControl<Date | null>(null),
      estimatedEndDate: new FormControl<Date | null>(null),
      dueDate: new FormControl<Date | null>(null),
      priority: new FormControl<string | null>('High'),
      projectId: new FormControl<string | null>(null),
      assignedUserIds: new FormControl<string[]>([]),
      attachments: new FormControl<File[]>([]),
      checklists: new FormArray([]),
      notes: new FormControl<string | null>(null),
    });
  }

  ngOnInit(): void {
    this.currentId = this.activatedRoute.snapshot.queryParams['id'];

    this.getDropdown();

    if (this.currentId) {
      this.FG.get('id')?.enable();
      this.LoadForm();
    }
  }

  LoadForm() {
    if (!this.currentId) return;

    this.loadingService.start();

    this.projectTaskService
      .GetOne(this.currentId)
      .pipe(
        takeUntil(this.ngUnsubscribe),
        finalize(() => {
          this.loadingService.stop();
        }),
      )
      .subscribe({
        next: (res: any) => {
          this.FG.patchValue({
            title: res.title,

            description: res.description,

            projectId: res.projectId,

            priority: res.priority,

            category: res.category,

            status: res.status,

            estimatedStartDate: res.estimatedStartDate
              ? new Date(res.estimatedStartDate)
              : null,

            estimatedEndDate: res.estimatedEndDate
              ? new Date(res.estimatedEndDate)
              : null,

            dueDate: res.dueDate ? new Date(res.dueDate) : null,

            progress: res.progress ?? 0,

            remarks: res.remarks,
          });

          this.checklists.clear();

          res.checklists?.forEach((item: any) => {
            this.checklists.push(
              this.fb.group({
                id: [item.id],
                title: [item.title],
                isCompleted: [item.isCompleted],
                isEditing: [false],
                oldTitle: [item.title],
              }),
            );
          });

          const selectedMembers = res.assignedTaskMembers ?? [];

          this.FG.patchValue({
            assignedUserIds: selectedMembers.map(
              (member: any) => member.userId,
            ),
          });

          this.cdr.markForCheck();
        },

        error: (err) => {
          console.error('Load task failed:', err);
        },
      });
  }

  getDropdown() {
    this.projectTaskService
      .GetDropdown()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.projectSelection = res.projects.map((x: any) => ({
            label: x.name,
            value: x.id,
          }));

          this.userSelection = res.users.map((user: any) => ({
            label: user.name,
            value: user.id,
            fullName: user.name,
            displayName: user.displayName,
            email: user.email,
          }));
          this.cdr.markForCheck();
        },
      });
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (!input.files?.length) return;

    const newFiles = Array.from(input.files);

    newFiles.forEach((file) => {
      const exists = this.attachments.some(
        (x) =>
          x.name === file.name &&
          x.size === file.size &&
          x.lastModified === file.lastModified,
      );

      if (!exists) {
        this.attachments.push(file);
      }
    });

    this.FG.patchValue({
      attachments: this.attachments,
    });

    input.value = '';

    this.cdr.markForCheck();
  }

  removeAttachment(index: number) {
    this.attachments.splice(index, 1);
  }

  formatFileSize(size: number): string {
    if (size < 1024) {
      return `${size} bytes`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  get selectedMembers() {
    const selectedIds = this.FG.get('assignedUserIds')?.value ?? [];

    return this.userSelection.filter((user) =>
      selectedIds.includes(user.value),
    );
  }

  removeMember(id: string) {
    const selected = this.FG.get('assignedUserIds')?.value ?? [];

    this.FG.patchValue({
      assignedUserIds: selected.filter((x: string) => x !== id),
    });

    this.cdr.markForCheck();
  }

  getInitials(name: string | undefined | null) {
    if (!name) return '';

    return name
      .split(' ')
      .filter((n) => n)
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }

  selectPriority(priority: string) {
    this.FG.get('priority')?.setValue(priority);
  }

  AddChecklist() {
    this.checklists.push(
      new FormGroup({
        title: new FormControl('', Validators.required),
        oldTitle: new FormControl(''),
        isEditing: new FormControl(true),
      }),
    );
  }

  get checklists(): FormArray {
    return this.FG.get('checklists') as FormArray;
  }

  SaveChecklist(index: number) {
    const group = this.checklists.at(index) as FormGroup;

    const title = group.get('title')?.value?.trim();

    if (!title) {
      group.get('title')?.markAsTouched();
      return;
    }

    group.patchValue({
      isEditing: false,
    });
  }

  RemoveChecklist(index: number) {
    this.checklists.removeAt(index);
  }

  EditChecklist(index: number) {
    const group = this.checklists.at(index) as FormGroup;

    group.patchValue({
      isEditing: true,
      oldTitle: group.get('title')?.value,
    });
  }

  CancelEdit(index: number) {
    const group = this.checklists.at(index) as FormGroup;

    const oldTitle = group.get('oldTitle')?.value;

    if (!oldTitle) {
      this.RemoveChecklist(index);
      return;
    }

    group.patchValue({
      title: oldTitle,
      isEditing: false,
    });
  }

  dropChecklist(event: CdkDragDrop<any[]>) {
    const formArray = this.checklists;

    const controls = formArray.controls;

    moveItemInArray(controls, event.previousIndex, event.currentIndex);

    formArray.setValue(controls.map((control) => control.value));
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (!input.files) return;

    Array.from(input.files).forEach((file) => {
      this.addFile(file);
    });

    input.value = '';
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();

    if (!event.dataTransfer?.files) return;

    Array.from(event.dataTransfer.files).forEach((file) => {
      this.addFile(file);
    });
  }

  addFile(file: File) {
    if (!this.allowedTypes.includes(file.type)) {
      alert(`${file.name} is not supported. Only PDF, DOCX and PNG allowed.`);

      return;
    }

    if (file.size > this.maxSize) {
      alert(`${file.name} exceeds 10MB limit`);

      return;
    }

    this.attachments.push(file);
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }

  onSave() {
    if (this.FG.invalid) {
      ValidateAllFormFields(this.FG);
      return;
    }

    this.loadingService.start();

    this.projectTaskService
      .Create(this.FG.value)
      .pipe(
        takeUntil(this.ngUnsubscribe),
        finalize(() => {
          this.loadingService.stop();
        }),
      )
      .subscribe({
        next: (res) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Task created successfully',
          });

          this.FG.reset();

          this.router.navigate(['/tasks']);
        },

        error: (err) => {
          console.error('Create task failed:', err);

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to create task',
          });
        },
      });
  }

  getPriorityClass(priority: string) {
    const isSelected = this.FG.get('priority')?.value === priority;

    if (!isSelected) {
      return 'border-gray-300 bg-white hover:border-blue-300 hover:bg-blue-50';
    }

    switch (priority) {
      case 'Low':
        return 'bg-blue-600 text-white border-blue-600 font-semibold shadow-lg ring-2 ring-blue-300 scale-101';

      case 'Medium':
        return 'bg-yellow-500 text-white border-yellow-500 font-semibold shadow-lg ring-2 ring-yellow-300 scale-101';

      case 'High':
        return 'bg-orange-500 text-white border-orange-500 font-semibold shadow-lg ring-2 ring-orange-300 scale-101';

      case 'Critical':
        return 'bg-red-600 text-white border-red-600 font-semibold shadow-lg ring-2 ring-red-300 scale-101';

      default:
        return 'bg-blue-900 text-white border-blue-900 font-semibold';
    }
  }
}
