import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { TableModule } from 'primeng/table';
import { LoadingService } from '../../../services/loading.service';

@Component({
  selector: 'app-do-rma',
  imports: [
    CommonModule,
    TableModule,
    InputTextModule,
    FormsModule,
    MenuModule,
    ButtonModule,
    RouterLink,
  ],
  template: `<p>do-rma works!</p>`,
  styleUrl: './do-rma.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DoRma implements OnInit, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly loadingService = inject(LoadingService);

  ngOnInit(): void {}

  ngOnDestroy(): void {}
}
