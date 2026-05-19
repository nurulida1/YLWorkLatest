import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-sales-invoice',
  imports: [],
  template: `<p>sales-invoice works!</p>`,
  styleUrl: './sales-invoice.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesInvoice {}
