import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { LoadingService } from '../../../services/loading.service';
import { ButtonModule } from 'primeng/button';
import { AppService } from '../../../services/appService.service';
import { Subject, takeUntil } from 'rxjs';
import { InventoryRestockDto } from '../../../models/Inventory';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'app-logistic-dashboard',
  imports: [CommonModule, ButtonModule, BaseChartDirective],
  template: `<div class="flex flex-col">
    <div class="font-bold text-xl md:text-2xl">Dashboard</div>
    <div class="text-[12px] text-gray-500 tracking-wide">
      Real-time visibility of inventory and stock flow
    </div>
    <div class="mt-4 grid grid-cols-12 gap-4 justify-between">
      <div
        class="col-span-12 sm:col-span-6 2xl:col-span-3 flex flex-row justify-between items-center p-4 rounded-md bg-white border border-gray-200 h-[120px] cursor-pointer hover:shadow-md"
      >
        <div class="flex flex-col justify-between h-full">
          <div class="text-gray-600 text-[13px]">TOTAL ITEMS</div>
          <div class="font-bold text-4xl">{{ counts?.totalItems }}</div>
          <div class="text-gray-400 text-[12px]">Total items in inventory</div>
        </div>
        <div
          class="p-3 bg-blue-100 flex items-center justify-center rounded-lg"
        >
          <i class="pi pi-box text-[28px]! text-blue-700! text-shadow-md!"></i>
        </div>
      </div>
      <div
        class="col-span-12 sm:col-span-6 2xl:col-span-3 flex flex-row justify-between items-center p-4 rounded-md bg-white border border-gray-200 h-[120px] cursor-pointer hover:shadow-md"
      >
        <div class="flex flex-col justify-between h-full">
          <div class="text-gray-600 text-[13px]">LOW STOCK ITEMS</div>
          <div class="font-bold text-4xl">{{ counts?.lowStockItems }}</div>
          <div class="text-gray-400 text-[12px]">
            Items below minimum stock level
          </div>
        </div>
        <div class="p-3 bg-red-100 flex items-center justify-center rounded-lg">
          <i
            class="pi pi-exclamation-triangle text-[28px]! text-red-700! text-shadow-md!"
          ></i>
        </div>
      </div>
      <div
        class="col-span-12 sm:col-span-6 2xl:col-span-3 flex flex-row justify-between items-center p-4 rounded-md bg-white border border-gray-200 h-[120px] cursor-pointer hover:shadow-md"
      >
        <div class="flex flex-col justify-between h-full">
          <div class="text-gray-600 text-[13px]">FAULTY / REPAIR</div>
          <div class="font-bold text-4xl">{{ counts?.faultyItems }}</div>
          <div class="text-gray-400 text-[12px]">
            Items under repair or unavailable
          </div>
        </div>
        <div
          class="p-3 bg-yellow-100 flex items-center justify-center rounded-lg"
        >
          <i
            class="pi pi-arrow-down-right text-[28px]! text-yellow-700! text-shadow-md!"
          ></i>
        </div>
      </div>
      <div
        class="col-span-12 sm:col-span-6 2xl:col-span-3 flex flex-row justify-between items-center p-4 rounded-md bg-white border border-gray-200 h-[120px] cursor-pointer hover:shadow-md"
      >
        <div class="flex flex-col justify-between h-full">
          <div class="text-gray-600 text-[13px]">PENDING REQUESTS</div>
          <div class="font-bold text-4xl">{{ counts?.pendingRequests }}</div>
          <div class="text-gray-400 text-[12px]">Waiting for approval</div>
        </div>
        <div
          class="p-3 bg-purple-100 flex items-center justify-center rounded-lg"
        >
          <i
            class="pi pi-list-check text-[28px]! text-purple-700! text-shadow-md!"
          ></i>
        </div>
      </div>
      <div
        class="col-span-12 xl:col-span-8 p-5 border rounded-md border-gray-200 bg-white flex flex-col gap-2 h-[300px]"
      >
        <div class="font-semibold">Inventory Based on Category</div>
        <div class="w-full h-[250px]">
          <div class="w-full h-[250px]">
            <canvas
              baseChart
              [data]="barChartData"
              [options]="barChartOptions"
              [type]="'bar'"
            >
            </canvas>
          </div>
        </div>
      </div>
      <div
        class="col-span-12 xl:col-span-4 p-5 border rounded-md border-gray-200 bg-white flex flex-col gap-5"
      >
        <div class="flex flex-row items-center justify-between">
          <div class="font-semibold">Restock Alert</div>
          <div
            class="flex flex-row items-center gap-2 text-[12px] text-gray-500 cursor-pointer hover:underline"
          >
            <div>Show all</div>
            <div class="pi pi-arrow-right text-[12px]!"></div>
          </div>
        </div>
        <div class="flex flex-col gap-2 h-[300px] xl:h-[200px] overflow-y-auto">
          <ng-container *ngFor="let stock of restockAlerts">
            <div
              class="p-2 bg-red-50 border rounded-md border-red-200 flex flex-row items-center justify-between"
            >
              <div class="flex flex-col gap-1">
                <div class="text-[12px] font-semibold">{{ stock.name }}</div>
                <div
                  class="flex flex-row items-center gap-1 text-[10px] text-gray-500"
                >
                  <div>{{ stock.section?.name }}</div>
                  <i class="pi pi-circle-fill text-[2px]!"></i>
                  <div>{{ stock.brand }}</div>
                </div>
              </div>
              <div class="flex flex-col text-right">
                <div class="font-semibold text-red-500">
                  {{ stock.quantity }}
                </div>
                <div class="text-[10px] text-gray-500">
                  Par: {{ stock.parLevel }}
                </div>
              </div>
            </div>
          </ng-container>
        </div>
      </div>
      <div
        class="col-span-12 flex flex-col gap-2 p-5 border border-gray-200 rounded-md bg-white"
      >
        <div class="flex flex-row items-center justify-between">
          <div class="font-semibold">Current Requests</div>
          <div
            class="flex flex-row items-center gap-2 text-[12px] text-gray-500 cursor-pointer hover:underline"
          >
            <div>Show all</div>
            <i class="pi pi-arrow-right text-[12px]!"></i>
          </div>
        </div>
      </div>
    </div>
  </div>`,
  styleUrl: './logistic-dashboard.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogisticDashboard implements OnInit, OnDestroy {
  private readonly loadingService = inject(LoadingService);
  private readonly appService = inject(AppService);
  private readonly cdr = inject(ChangeDetectorRef);

  protected ngUnsubscribe: Subject<void> = new Subject<void>();

  counts: any;
  restockAlerts: InventoryRestockDto[] = [];
  categoryLabels: string[] = [];
  categoryValues: number[] = [];

  barChartData: any;

  barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  ngOnInit(): void {
    this.GetSummary();
  }

  GetSummary() {
    this.loadingService.start();
    this.appService
      .GetLogisticDashboard()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (res) => {
          this.loadingService.stop();
          this.counts = {
            faultyItems: res.faultyItems,
            lowStockItems: res.lowStockItems,
            pendingRequests: res.pendingRequests,
            totalItems: res.totalItems,
          };
          this.restockAlerts = res.restockAlerts;
          this.categoryLabels = res.categoryChart.map(
            (x: any) => x.categoryName,
          );
          this.categoryValues = res.categoryChart.map((x: any) => x.total);

          this.barChartData = {
            labels: this.categoryLabels,
            datasets: [
              {
                data: this.categoryValues,
                label: 'Inventory by Category',
              },
            ],
          };

          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loadingService.stop();
        },
      });
  }

  ngOnDestroy(): void {}
}
