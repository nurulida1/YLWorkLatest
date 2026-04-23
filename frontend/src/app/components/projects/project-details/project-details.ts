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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { LoadingService } from '../../../services/loading.service';
import { ProjectService } from '../../../services/ProjectService';
import { ProjectDto } from '../../../models/Project';
import { Subject, takeUntil } from 'rxjs';
import { TabsModule } from 'primeng/tabs';

@Component({
  selector: 'app-project-details',
  imports: [CommonModule, RouterLink, ButtonModule, TabsModule],
  template: `<div class="w-full min-h-[92.9vh] flex flex-col p-5">
    <div class="flex flex-row items-center justify-between">
      <div class="flex flex-row items-center gap-1 text-gray-500 tracking-wide">
        <div
          [routerLink]="'/dashboard'"
          class="cursor-pointer hover:text-gray-600"
        >
          Dashboard
        </div>
        /
        <div
          [routerLink]="'/projects'"
          class="cursor-pointer hover:text-gray-600"
        >
          Projects
        </div>
        /
        <div class="text-gray-700 font-semibold">
          {{ PagingSignal().projectCode }}
        </div>
      </div>
    </div>
    <div class="bg-white mt-3 p-5 border border-gray-200 flex flex-col">
      <div class="flex flex-row items-center justify-between">
        <div class="text-[20px] font-bold text-gray-700">
          Project: {{ PagingSignal().projectCode }}
        </div>
        <div class="flex flex-row items-center gap-2">
          <p-button
            label="Request Materials"
            styleClass="tracking-wide! border-gray-200!"
            severity="secondary"
            icon="pi pi-pencil"
            (onClick)="ActionClick('requestMaterial')"
          ></p-button>
        </div>
      </div>
      <div class="grid grid-cols-[140px_10px_1fr] gap-y-4 mt-7 text-[14px]">
        <div class="text-gray-600">Project Title</div>
        <div class="text-gray-600">:</div>
        <div class="font-semibold">
          {{ PagingSignal().projectTitle }}
        </div>

        <div class="text-gray-600">Timeline</div>
        <div class="text-gray-600">:</div>
        <div class="font-semibold">
          {{ PagingSignal().startDate | date: 'dd MMM, yyyy' }} -
          {{ PagingSignal().dueDate | date: 'dd MMM, yyyy' }}
        </div>

        <div class="text-gray-600">Client</div>
        <div class="text-gray-600">:</div>
        <div class="font-semibold">
          {{ PagingSignal().client?.name || 'N/A' }}
        </div>

        <div class="text-gray-600">Priority</div>
        <div class="text-gray-600">:</div>
        <div class="font-semibold">
          <div
            class="px-5 py-1 w-fit"
            [ngClass]="{
              'bg-blue-100 text-blue-600': PagingSignal().priority === 'Low',
              'bg-yellow-100 text-yellow-600':
                PagingSignal().priority === 'Medium',
              'bg-red-100 text-red-600': PagingSignal().priority === 'High',
            }"
          >
            {{ PagingSignal().priority }}
          </div>
        </div>
        <div class="text-gray-600">Status</div>
        <div class="text-gray-600">:</div>
        <div class="font-semibold">
          <div
            class="px-5 py-1 w-fit flex flex-row items-center gap-2"
            [ngClass]="{
              'bg-yellow-100 text-yellow-600':
                PagingSignal().status === 'Planning',
              'bg-blue-100 text-blue-600':
                PagingSignal().status === 'InProgress',
              'bg-green-100 text-green-700':
                PagingSignal().status === 'Completed',
              'bg-red-100 text-red-600': PagingSignal().status === 'OnHold',
            }"
          >
            <i class="pi pi-circle-fill text-[5px]!"></i>
            <div>{{ PagingSignal().status }}</div>
          </div>
        </div>

        <div class="text-gray-600">Assignees</div>
        <div class="text-gray-600">:</div>
        <div class="flex flex-wrap gap-3">
          <ng-container
            *ngFor="let projectMember of PagingSignal().projectMembers"
          >
            <div
              class="bg-gray-100 px-2 py-1 border border-gray-200 text-gray-800 flex flex-row items-center gap-2"
            >
              <i class="pi pi-user"></i>
              <div>{{ projectMember.user.fullName || 'N/A' }}</div>
            </div>
          </ng-container>
        </div>
      </div>
      <div class="mt-7 p-3 bg-gray-100 flex flex-col gap-4 rounded-md">
        <div class="font-semibold text-[16px]">Project Description</div>
        <div>{{ PagingSignal().description || 'N/A' }}</div>
      </div>
      <div class="border-b border-gray-200 mt-5 mb-5"></div>
    </div>
  </div>`,
  styleUrl: './project-details.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetails implements OnInit, OnDestroy {
  private readonly loadingService = inject(LoadingService);
  private readonly projectService = inject(ProjectService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  PagingSignal = signal<ProjectDto>({} as ProjectDto);
  projectId: string | null = null;

  ngOnInit(): void {
    this.projectId = this.activatedRoute.snapshot.queryParams['id'];
    this.GetData();
  }

  GetData() {
    this.loadingService.start();
    this.projectService
      .GetOne({
        Page: 1,
        PageSize: 1,
        OrderBy: null,
        Select: null,
        Includes: null,
        Filter: `Id=${this.projectId}`,
      })
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();
          if (res) {
            this.PagingSignal.set(res);
            this.cdr.markForCheck();
          }
        },
        error: (err) => {
          this.loadingService.stop();
        },
      });
  }

  ActionClick(type: string) {
    if (type === 'requestMaterial') {
      this.router.navigate(['/material-requests/form'], {
        queryParams: {
          projectCode: this.PagingSignal()?.projectCode,
        },
      });
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.loadingService.stop();
  }
}
