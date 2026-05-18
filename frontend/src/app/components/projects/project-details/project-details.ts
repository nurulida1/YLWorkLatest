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
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-project-details',
  imports: [CommonModule, RouterLink, ButtonModule, TabsModule, TableModule],
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
            *ngIf="PagingSignal().status !== 'Completed'"
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
      <p-tabs value="1">
        <p-tablist>
          <p-tab value="0">Tasks</p-tab>
          <p-tab value="1">Material Requests</p-tab>
          <p-tab value="2">Invoice</p-tab>
        </p-tablist>
        <p-tabpanels>
          <p-tabpanel value="0"> </p-tabpanel>
          <p-tabpanel value="1">
            <div class="text-lg font-semibold mt-2 mb-2">
              Material Requested
            </div>
            <p-table
              [value]="PagingSignal().materialRequests"
              [lazy]="false"
              [showGridlines]="true"
              [expandedRowKeys]="expandedRows"
              dataKey="id"
            >
              <ng-template #header>
                <tr>
                  <th class="text-center! bg-gray-100! w-[10%]!"></th>
                  <th class="text-center! bg-gray-100!">Document No</th>
                  <th class="text-center! bg-gray-100!">Requested Date</th>
                  <th class="text-center! bg-gray-100!">
                    Total Material Requested
                  </th>
                </tr>
              </ng-template>
              <ng-template #body let-data let-expanded="expanded">
                <tr>
                  <td>
                    <div class="flex items-center justify-center">
                      <p-button
                        pRipple
                        [pRowToggler]="data"
                        [text]="true"
                        severity="secondary"
                        [rounded]="true"
                        [icon]="
                          expanded
                            ? 'pi pi-chevron-down'
                            : 'pi pi-chevron-right'
                        "
                      />
                    </div>
                  </td>
                  <td class="text-center! font-semibold">
                    {{ data.documentNo }}
                  </td>
                  <td class="text-center!">
                    {{ data.requestDate | date: 'dd MMM, yyyy' }}
                  </td>
                  <td class="text-center!">
                    {{ data.materialItems?.length || 0 }}
                  </td>
                </tr> </ng-template
              ><ng-template pTemplate="rowexpansion" let-data>
                <tr>
                  <td colspan="4">
                    <div class="p-4 bg-gray-50 border rounded-md">
                      <div class="font-semibold text-gray-700 mb-3">
                        Material Items
                      </div>

                      <p-table
                        [value]="data.materialItems"
                        [showGridlines]="true"
                        styleClass="p-datatable-sm"
                      >
                        <ng-template pTemplate="header">
                          <tr>
                            <th>Description</th>
                            <th>Brand</th>
                            <th>Type No</th>
                            <th>Unit</th>
                            <th class="text-right">Quantity</th>
                            <th>Remarks</th>
                          </tr>
                        </ng-template>

                        <ng-template pTemplate="body" let-item>
                          <tr>
                            <td>{{ item.description }}</td>
                            <td>{{ item.brand }}</td>
                            <td>{{ item.typeNo }}</td>
                            <td>{{ item.unit }}</td>
                            <td class="text-right">{{ item.quantity }}</td>
                            <td>{{ item.remarks }}</td>
                          </tr>
                        </ng-template>

                        <ng-template pTemplate="emptymessage">
                          <tr>
                            <td colspan="6" class="text-center text-gray-500">
                              No material items found.
                            </td>
                          </tr>
                        </ng-template>
                      </p-table>
                    </div>
                  </td>
                </tr>
              </ng-template>

              <ng-template #emptymessage>
                <tr>
                  <td colspan="100%">
                    <div class="flex items-center justify-center text-gray-500">
                      No items found.
                    </div>
                  </td>
                </tr>
              </ng-template>
            </p-table>
          </p-tabpanel></p-tabpanels
        ></p-tabs
      >
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
  expandedRows: { [key: string]: boolean } = {};

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
          projectId: this.PagingSignal()?.id,
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
