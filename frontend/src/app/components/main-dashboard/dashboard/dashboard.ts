import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { LogisticDashboard } from '../logistic-dashboard/logistic-dashboard';
import { UserService } from '../../../services/userService.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, LogisticDashboard],
  template: `<div class="p-5">
    <ng-container *ngIf="jobTitle === 'Logistic Assistant'">
      <app-logistic-dashboard></app-logistic-dashboard>
    </ng-container>
  </div>`,
  styleUrl: './dashboard.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit, OnDestroy {
  private readonly userService = inject(UserService);

  jobTitle?: string = this.userService.currentUser?.jobTitle;

  ngOnInit(): void {}

  ngOnDestroy(): void {}
}
