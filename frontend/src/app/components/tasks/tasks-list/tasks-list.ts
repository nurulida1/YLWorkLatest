import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TaskListMobile } from '../task-list-mobile/task-list-mobile';
import { TaskDesktop } from '../task-desktop/task-desktop';

@Component({
  selector: 'app-tasks-list',
  imports: [CommonModule, TaskListMobile, TaskDesktop],
  template: `<div class="w-full">
    <div class="block lg:hidden">
      <app-task-list-mobile />
    </div>

    <div class="hidden lg:block">
      <app-task-desktop />
    </div>
  </div>`,
  styleUrl: './tasks-list.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasksList {}
