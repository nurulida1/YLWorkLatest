import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import {
  buildInventoryItemUrl,
  downloadDataUrl,
  generateInventoryQrDataUrl,
  printInventoryQrLabel,
} from './inventory-qr.util';

@Component({
  selector: 'app-inventory-qr-dialog',
  imports: [CommonModule, DialogModule, ButtonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-dialog
      [(visible)]="visible"
      [modal]="true"
      [draggable]="false"
      [closable]="true"
      header="Item QR Code"
      styleClass="w-[92%] max-w-md"
      (onHide)="onHide()"
    >
      <div class="flex flex-col items-center gap-3 py-2">
        @if (loading) {
          <div class="text-sm text-gray-500 py-10">Generating QR…</div>
        } @else if (error) {
          <div class="text-sm text-rose-600 py-6">{{ error }}</div>
        } @else if (qrDataUrl) {
          <img
            [src]="qrDataUrl"
            alt="Inventory QR code"
            class="w-56 h-56 border border-gray-100 rounded"
          />
          <div class="text-center">
            @if (itemCode) {
              <div class="text-xs text-gray-500">{{ itemCode }}</div>
            }
            <div class="text-base font-semibold text-gray-800">
              {{ itemName || 'Inventory item' }}
            </div>
            <div class="text-[11px] text-gray-400 break-all mt-1 max-w-xs">
              {{ itemUrl }}
            </div>
          </div>
        }

        <div class="flex flex-wrap items-center justify-center gap-2 mt-2">
          <p-button
            label="Print"
            icon="pi pi-print"
            severity="info"
            [disabled]="!qrDataUrl"
            (onClick)="print()"
          ></p-button>
          <p-button
            label="Download"
            icon="pi pi-download"
            severity="secondary"
            [outlined]="true"
            [disabled]="!qrDataUrl"
            (onClick)="download()"
          ></p-button>
          @if (itemId) {
            <a [routerLink]="['/inventory/item', itemId]">
              <p-button
                label="Open item"
                icon="pi pi-external-link"
                severity="secondary"
                [text]="true"
                (onClick)="onHide()"
              ></p-button>
            </a>
          }
        </div>
      </div>
    </p-dialog>
  `,
})
export class InventoryQrDialog implements OnChanges {
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() visible = false;
  @Input() itemId: string | null = null;
  @Input() itemName: string | null = null;
  @Input() itemCode: string | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();

  qrDataUrl: string | null = null;
  itemUrl = '';
  loading = false;
  error: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (
      (changes['visible'] || changes['itemId']) &&
      this.visible &&
      this.itemId
    ) {
      void this.loadQr();
    }
  }

  async loadQr(): Promise<void> {
    if (!this.itemId) return;

    this.loading = true;
    this.error = null;
    this.qrDataUrl = null;
    this.itemUrl = buildInventoryItemUrl(this.itemId);
    this.cdr.markForCheck();

    try {
      this.qrDataUrl = await generateInventoryQrDataUrl(this.itemId);
    } catch {
      this.error = 'Failed to generate QR code.';
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  print(): void {
    if (!this.qrDataUrl) return;
    printInventoryQrLabel({
      qrDataUrl: this.qrDataUrl,
      itemName: this.itemName || 'Inventory item',
      itemCode: this.itemCode,
    });
  }

  download(): void {
    if (!this.qrDataUrl || !this.itemId) return;
    const safeName = (this.itemCode || this.itemName || this.itemId)
      .replace(/[^\w.-]+/g, '_')
      .slice(0, 40);
    downloadDataUrl(this.qrDataUrl, `inventory-qr-${safeName}.png`);
  }

  onHide(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}
