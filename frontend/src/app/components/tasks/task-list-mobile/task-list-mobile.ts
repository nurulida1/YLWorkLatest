import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { LoadingService } from '../../../services/loading.service';
import { ProjectTaskService } from '../../../services/ProjectTaskService';
import { ProjectTaskDto } from '../../../models/ProjectTask';
import { MessageService } from 'primeng/api';
import {
  GridifyQueryExtend,
  PagingContent,
} from '../../../shared/helpers/helpers';
import { Subject, takeUntil } from 'rxjs';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-task-list-mobile',
  imports: [
    CommonModule,
    ButtonModule,
    InputTextModule,
    FormsModule,
    TagModule,
    AvatarModule,
    AvatarGroupModule,
    ProgressBarModule,
    DrawerModule,
    RouterLink,
    TooltipModule,
  ],
  template: `<div class="w-full min-h-screen bg-gray-100 flex flex-col">
      <div class="px-4 pt-4 pb-3 flex items-center justify-between">
        <p-button [text]="true" severity="secondary">
          <ng-template #icon>
            <i class="pi pi-chevron-left text-xl"></i>
          </ng-template>
        </p-button>

        <div class="text-xl font-semibold tracking-wide text-gray-800">
          My Tasks
        </div>

        <p-button [text]="true" severity="secondary">
          <ng-template #icon>
            <i class="pi pi-filter text-lg"></i>
          </ng-template>
        </p-button>
      </div>

      <div class="px-5">
        <input
          pInputText
          [(ngModel)]="search"
          class="w-full rounded-2xl border-none bg-white py-3.5 pl-11 shadow-sm"
          placeholder="🔍︎ Search task..."
          (keyup)="onKeyDown($event)"
        />
      </div>

      <div
        class="flex-1 mt-5 bg-white rounded-t-[30px] px-5 pt-5 overflow-y-auto"
      >
        <div class="bg-gray-100 rounded-2xl p-1 relative">
          <div
            class="absolute top-1 bottom-1 rounded-xl bg-white shadow transition-all duration-300"
            [style.width.%]="100 / tabs.length"
            [style.left.%]="selectedTab * (100 / tabs.length)"
          ></div>

          <div class="relative flex">
            <button
              *ngFor="let tab of tabs; let i = index"
              (click)="changeTab(i)"
              class="flex-1 py-3 text-sm font-semibold transition-colors duration-300"
              [ngClass]="{
                'text-gray-900': selectedTab === i,
                'text-gray-400': selectedTab !== i,
              }"
            >
              {{ tab }}
            </button>
          </div>
        </div>

        <div class="flex items-center justify-between mt-6 mb-5">
          <div>
            <div class="font-bold text-xl text-gray-800">Tasks</div>

            <div class="text-sm text-gray-400">
              {{ TaskSignal().totalElements }} Tasks
            </div>
          </div>

          <p-button
            label="New"
            icon="pi pi-plus"
            size="small"
            styleClass="!rounded-full !px-4 !bg-blue-600 !border-blue-600 shadow-md"
            [routerLink]="'/tasks/form'"
          />
        </div>

        <div
          class="flex flex-col gap-4 mb-5"
          *ngFor="let item of FilteredTasks()"
        >
          <div
            class="rounded-3xl bg-white shadow-sm border border-gray-100 overflow-hidden"
          >
            <div class="h-1 bg-blue-500"></div>

            <div class="p-5">
              <div class="flex justify-between items-start">
                <div class="flex gap-2">
                  <p-tag
                    [value]="formatStatus(item.status)"
                    [severity]="getStatusSeverity(item.status)"
                    styleClass="rounded-full px-3!"
                  >
                  </p-tag>

                  <p-tag
                    [value]="item.priority"
                    [severity]="getPrioritySeverity(item.priority)"
                    styleClass="rounded-full px-3!"
                  />
                </div>

                <button
                  class="w-9 h-9 rounded-full hover:bg-gray-100 transition flex items-center justify-center"
                  (click)="openTaskMenu(item)"
                >
                  <i class="pi pi-ellipsis-h text-gray-500"></i>
                </button>
              </div>

              <div class="mt-5">
                <h2 class="text-lg font-semibold text-gray-900">
                  {{ item.title }}
                </h2>

                <p class="text-sm text-gray-500 leading-6 mt-2">
                  {{ item.description }}
                </p>
              </div>

              <div class="mt-6">
                <div class="flex justify-between mb-2">
                  <span class="text-sm text-gray-500"> Progress </span>

                  <span class="text-sm font-semibold text-blue-600">
                    {{ item.progress }}
                  </span>
                </div>

                <p-progressBar
                  [value]="item.progress"
                  [showValue]="false"
                  styleClass="h-2"
                >
                </p-progressBar>
              </div>

              <div
                class="mt-6 pt-5 border-t border-gray-100 flex justify-between items-center"
              >
                <div>
                  <div
                    class="flex items-center gap-2 text-sm text-gray-500"
                    *ngIf="item.dueDate"
                  >
                    <i class="pi pi-calendar"></i>

                    <span>Due: {{ item.dueDate | date: 'dd MMM, yyyy' }}</span>
                  </div>
                </div>

                <div>
                  @if (item.assignedTaskMembers?.length) {
                    <div class="flex items-center">
                      @for (
                        member of item.assignedTaskMembers;
                        track member.userId
                      ) {
                        <div
                          class="w-9 h-9 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-sm font-semibold border-2 border-white -ml-2 first:ml-0"
                          pTooltip="{{ member?.name }}"
                          tooltipPosition="top"
                        >
                          {{ getInitials(member?.name) }}
                        </div>
                      }
                    </div>
                  } @else {
                    <span class="text-gray-400 text-sm"> Unassigned </span>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        @if (totalPages() > 1) {
          <div class="flex justify-center items-center gap-4 mt-6 mb-5">
            <p-button
              icon="pi pi-angle-left"
              rounded
              outlined
              severity="secondary"
              [disabled]="Query.Page <= 1"
              (click)="previousPage()"
            />

            <div class="text-sm font-medium text-gray-600">
              Page {{ Query.Page }} of {{ totalPages() }}
            </div>

            <p-button
              icon="pi pi-angle-right"
              rounded
              outlined
              severity="secondary"
              [disabled]="Query.Page >= totalPages()"
              (click)="nextPage()"
            />
          </div>
        }
      </div>
    </div>

    <p-drawer
      [(visible)]="showTaskMenu"
      position="bottom"
      styleClass="!rounded-t-3xl h-[70%]!"
      [showCloseIcon]="false"
    >
      <div class="pb-6">
        <div class="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6"></div>

        <div class="text-center mb-6">
          <div class="text-xl font-semibold">Task Actions</div>

          <div class="text-sm text-gray-500">Choose an action</div>
        </div>

        <div class="space-y-2">
          <button
            *ngFor="let action of taskActions"
            (click)="action.command?.()"
            class="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition"
            [ngClass]="{
              'text-red-600': action.danger,
            }"
          >
            <div
              class="w-11 h-11 rounded-xl flex items-center justify-center"
              [ngClass]="{
                'bg-red-100': action.danger,
                'bg-blue-50': !action.danger,
              }"
            >
              <i
                [class]="action.icon"
                [ngClass]="{
                  'text-red-600': action.danger,
                  'text-blue-600': !action.danger,
                }"
              >
              </i>
            </div>

            <span class="font-medium">
              {{ action.label }}
            </span>
          </button>
        </div>
      </div>
    </p-drawer>`,
  styleUrl: './task-list-mobile.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskListMobile implements OnInit, OnDestroy {
  private readonly loadingService = inject(LoadingService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly projectTaskService = inject(ProjectTaskService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);
  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  search: string = '';
  showTaskMenu: boolean = false;
  tabs = ['All', 'In Progress', 'Completed'];

  TaskSignal = signal<PagingContent<any>>({} as PagingContent<any>);

  Query: GridifyQueryExtend = {} as GridifyQueryExtend;

  selectedTab: number = 0;
  selectedTask: any = null;

  taskActions = [
    {
      label: 'View Details',
      icon: 'pi pi-eye',
      command: () => this.viewTask(),
    },
    {
      label: 'Edit Task',
      icon: 'pi pi-pencil',
      command: () => this.editTask(),
    },
    {
      label: 'Assign Members',
      icon: 'pi pi-users',
      command: () => {},
    },
    {
      label: 'Add Comment',
      icon: 'pi pi-comment',
      command: () => {},
    },
    {
      label: 'Attach File',
      icon: 'pi pi-paperclip',
      command: () => {},
    },
    {
      label: 'Duplicate',
      icon: 'pi pi-copy',
      command: () => {},
    },
    {
      label: 'Mark Complete',
      icon: 'pi pi-check-circle',
      command: () => this.completeTask(),
    },
    {
      label: 'Delete Task',
      icon: 'pi pi-trash',
      danger: true,
      command: () => this.deleteTask(),
    },
  ];

  constructor() {
    this.Query.Page = 1;
    this.Query.PageSize = 5;
    this.Query.Filter = null;
    this.Query.Select = null;
    this.Query.OrderBy = 'TaskCode';
    this.Query.Includes = null;
  }

  ngOnInit(): void {
    this.GetData();
  }

  GetData() {
    this.loadingService.start();
    this.projectTaskService
      .GetMany(this.Query)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.TaskSignal.set(res);
          this.cdr.markForCheck();
          this.loadingService.stop();
        },
        error: (err) => {
          this.loadingService.stop();
        },
      });
  }

  FilteredTasks = computed(() => {
    const tasks = this.TaskSignal().data ?? [];

    switch (this.selectedTab) {
      case 1:
        return tasks.filter((x) => x.status === 'InProgress');

      case 2:
        return tasks.filter((x) => x.status === 'Completed');

      default:
        return tasks;
    }
  });

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
    this.search = data;

    const filters: string[] = [];

    // keep selected tab filter
    switch (this.selectedTab) {
      case 1:
        filters.push('Status=InProgress');
        break;

      case 2:
        filters.push('Status=Completed');
        break;
    }

    // search filter
    if (data?.trim()) {
      filters.push(`Title=${data.trim()}`);
    }

    this.Query.Filter = filters.length ? filters.join(',') : null;

    this.Query.Page = 1;

    this.GetData();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
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

  viewTask() {
    if (!this.selectedTask) return;

    this.showTaskMenu = false;

    this.router.navigate(['/tasks/details'], {
      queryParams: {
        id: this.selectedTask.id,
      },
    });
  }

  editTask() {
    if (!this.selectedTask) return;

    this.showTaskMenu = false;

    this.router.navigate(['/tasks/form'], {
      queryParams: {
        id: this.selectedTask.id,
      },
    });
  }

  completeTask() {
    if (!this.selectedTask) return;

    this.projectTaskService
      .UpdateStatus({
        projectTaskId: this.selectedTask.id,
        status: 'Completed',
      })
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Completed',
            detail: 'Task marked as completed',
          });

          this.GetData();
          this.showTaskMenu = false;
        },
      });
  }

  deleteTask() {
    if (!this.selectedTask) return;

    this.projectTaskService.Delete(this.selectedTask.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Deleted',
          detail: 'Task deleted',
        });

        this.GetData();
        this.showTaskMenu = false;
      },
    });
  }

  openTaskMenu(task: any) {
    this.selectedTask = task;
    this.showTaskMenu = true;
  }

  formatStatus(status: string) {
    return status?.replace(/([A-Z])/g, ' $1').trim();
  }

  getStatusSeverity(status: string) {
    switch (status) {
      case 'Completed':
        return 'success';

      case 'InProgress':
        return 'info';

      case 'OnHold':
        return 'warning';

      case 'Cancelled':
        return 'danger';

      default:
        return 'secondary';
    }
  }

  getPrioritySeverity(priority: string) {
    switch (priority) {
      case 'Critical':
        return 'danger';

      case 'High':
        return 'warn';

      case 'Medium':
        return 'info';

      case 'Low':
        return 'success';

      default:
        return 'secondary';
    }
  }

  changeTab(index: number) {
    this.selectedTab = index;

    this.Search(this.search);
  }

  totalPages = computed(() => {
    const total = this.TaskSignal().totalElements ?? 0;

    return Math.ceil(total / this.Query.PageSize);
  });

  nextPage() {
    if (this.Query.Page < this.totalPages()) {
      this.Query.Page++;
      this.GetData();
    }
  }

  previousPage() {
    if (this.Query.Page > 1) {
      this.Query.Page--;
      this.GetData();
    }
  }
}
